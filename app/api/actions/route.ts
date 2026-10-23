import { NextRequest, NextResponse } from 'next/server'
import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { withTransaction } from '@/lib/server/db'
import { entityToRow, nextId, nowStamp, resources } from '@/lib/server/resources'
import { getRequestUser, unauthorized } from '@/lib/server/auth'

class BizError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

async function insertRow(conn: PoolConnection, resource: string, entity: Record<string, unknown>): Promise<Record<string, unknown>> {
  const def = resources[resource]
  const row = entityToRow(def, entity)
  const colSql = def.columns.map((c) => `\`${c.name}\``).join(', ')
  const ph = def.columns.map(() => '?').join(', ')
  await conn.query(`INSERT INTO \`${def.table}\` (${colSql}) VALUES (${ph})`, def.columns.map((c) => row[c.name]))
  return row
}

async function loadProductPatches(conn: PoolConnection, ids: string[]): Promise<Record<string, unknown>[]> {
  if (!ids.length) return []
  const ph = ids.map(() => '?').join(', ')
  const [rows] = await conn.query(`SELECT id, stock, updatedAt FROM products WHERE id IN (${ph})`, ids)
  return rows as Record<string, unknown>[]
}

/** 收银结算：校验并扣减库存 + 写入销售订单（单事务） */
async function checkout(payload: { order: Record<string, unknown> }) {
  const order = payload.order
  const items = (order?.items ?? []) as { productId: string; name: string; quantity: number }[]
  if (!Array.isArray(items) || !items.length) throw new BizError(400, '购物清单为空')
  return withTransaction(async (conn) => {
    const stamp = nowStamp()
    for (const item of items) {
      const [rows] = await conn.query('SELECT `stock` FROM products WHERE id = ? FOR UPDATE', [item.productId])
      if (!(rows as RowDataPacket[]).length) throw new BizError(409, `商品不存在：${item.name}`)
      const stock = Number((rows as RowDataPacket[])[0].stock)
      if (stock < item.quantity) throw new BizError(409, `库存不足：${item.name}（剩余 ${stock}）`)
      await conn.query('UPDATE products SET stock = stock - ?, updatedAt = ? WHERE id = ?', [item.quantity, stamp, item.productId])
    }
    const id = await nextId(conn, 'saleOrders', resources.saleOrders.idGen!)
    const createdAt = stamp
    const saved = await insertRow(conn, 'saleOrders', { ...order, id, createdAt })
    const products = await loadProductPatches(conn, items.map((i) => i.productId))
    return { order: saved, products }
  })
}

/** 确认退款：回滚库存 + 更新订单退款状态 + 更新退货单（单事务） */
async function approveRefund(payload: { refundId: string }) {
  const refundId = payload?.refundId
  if (!refundId) throw new BizError(400, '缺少退货单号')
  return withTransaction(async (conn) => {
    const stamp = nowStamp()
    const [rr] = await conn.query('SELECT * FROM refunds WHERE id = ? FOR UPDATE', [refundId])
    const refund = (rr as RowDataPacket[])[0]
    if (!refund) throw new BizError(404, '退货单不存在')
    if (String(refund.status) !== '待处理') throw new BizError(409, '该退货单已处理，无需重复操作')
    const items = JSON.parse(String(refund.items || '[]')) as { productId: string; quantity: number }[]
    for (const item of items) {
      await conn.query('UPDATE products SET stock = stock + ?, updatedAt = ? WHERE id = ?', [item.quantity, stamp, item.productId])
    }
    let order: Record<string, unknown> | null = null
    const [orows] = await conn.query('SELECT * FROM sale_orders WHERE id = ? FOR UPDATE', [String(refund.orderId)])
    const row = (orows as RowDataPacket[])[0]
    if (row) {
      const refunded = round2(Number(row.refunded) + Number(refund.amount))
      const status = refunded >= Number(row.paid) ? '已退款' : '部分退款'
      await conn.query('UPDATE sale_orders SET refunded = ?, status = ? WHERE id = ?', [refunded, status, row.id])
      order = { ...row, refunded, status }
    }
    await conn.query('UPDATE refunds SET status = ?, handledAt = ?, stockRolledBack = 1 WHERE id = ?', ['已退款', stamp, refundId])
    const [frows] = await conn.query('SELECT * FROM refunds WHERE id = ?', [refundId])
    const products = await loadProductPatches(conn, items.map((i) => i.productId))
    return { refund: (frows as RowDataPacket[])[0], order, products }
  })
}

type StockInLine = {
  productId: string
  name: string
  spec: string | null
  unit: string
  orderedQty: number | null
  alreadyIn: number
  receive: number
  price: number | null
}

/** 采购入库：扣增库存 + 写入库单 + 回写采购单（单事务） */
async function confirmStockIn(payload: { orderId: string | null; lines: StockInLine[] }) {
  const lines = payload?.lines ?? []
  const receivable = lines.filter((l) => Number(l.receive) > 0)
  if (!receivable.length) throw new BizError(400, '请先填写实收数量，实收数量为 0 的行不会入库')
  if (lines.some((l) => Number(l.receive) < 0 || !Number.isInteger(Number(l.receive)))) {
    throw new BizError(400, '实收数量需为不小于 0 的整数')
  }
  return withTransaction(async (conn) => {
    const stamp = nowStamp()
    for (const line of receivable) {
      await conn.query('UPDATE products SET stock = stock + ?, updatedAt = ? WHERE id = ?', [Number(line.receive), stamp, line.productId])
    }
    const items = lines.map((l) => {
      const target = l.orderedQty == null ? null : l.orderedQty - l.alreadyIn
      const receive = Number(l.receive)
      const lineStatus = receive <= 0 ? '待收货' : target !== null && receive < target ? '部分入库' : '已入库'
      return {
        productId: l.productId,
        name: l.name,
        spec: l.spec,
        unit: l.unit,
        quantity: l.orderedQty ?? receive,
        received: l.alreadyIn + receive,
        price: l.price ?? 0,
        _lineStatus: lineStatus,
      }
    })
    const allReceived = lines.length > 0 && lines.every((l) => {
      const target = l.orderedQty == null ? null : l.orderedQty - l.alreadyIn
      const receive = Number(l.receive)
      return !(receive <= 0 || (target !== null && receive < target))
    })
    const recordStatus = allReceived ? '已入库' : '部分入库'

    let order: Record<string, unknown> | null = null
    let supplier = '未关联采购单'
    const orderId = payload.orderId ?? null
    if (orderId) {
      const [orows] = await conn.query('SELECT * FROM purchase_orders WHERE id = ? FOR UPDATE', [orderId])
      const row = (orows as RowDataPacket[])[0]
      if (row) {
        supplier = String(row.supplier ?? '未指定供应商')
        const oldItems = JSON.parse(String(row.items || '[]')) as { productId: string; received: number; quantity: number }[]
        const merged = oldItems.map((i) => {
          const line = lines.find((l) => l.productId === i.productId)
          return line ? { ...i, received: i.received + Number(line.receive) } : i
        })
        const status = merged.every((i) => i.received >= i.quantity) ? '已入库' : '部分入库'
        await conn.query('UPDATE purchase_orders SET items = ?, status = ? WHERE id = ?', [JSON.stringify(merged), status, orderId])
        order = { ...row, items: merged, status }
      } else {
        supplier = '未指定供应商'
      }
    }
    const recordId = await nextId(conn, 'stockInRecords', resources.stockInRecords.idGen!)
    const record = await insertRow(conn, 'stockInRecords', {
      id: recordId,
      orderId,
      supplier,
      status: recordStatus,
      arrivedAt: stamp,
      operator: '王店长',
      items: items.map(({ _lineStatus, ...rest }) => rest),
    })
    const products = await loadProductPatches(conn, receivable.map((l) => l.productId))
    return { record, order, products }
  })
}

/** 分类 / 品牌维护：列表与商品档案联动更新（单事务） */
async function listOp(payload: { kind: 'categories' | 'brands'; op: string; name?: string; oldName?: string; newName?: string; dir?: number }) {
  const kind = payload?.kind
  if (kind !== 'categories' && kind !== 'brands') throw new BizError(400, 'kind 必须是 categories 或 brands')
  const productField = kind === 'categories' ? 'category' : 'brand'
  return withTransaction(async (conn) => {
    const stamp = nowStamp()
    const [rows] = await conn.query('SELECT v FROM settings WHERE k = ? FOR UPDATE', [kind])
    let list = (rows as RowDataPacket[]).length ? (JSON.parse(String((rows as RowDataPacket[])[0].v || '[]')) as string[]) : []
    let renamed: { ids: string[]; value: string; updatedAt: string } | null = null

    switch (payload.op) {
      case 'add': {
        const name = String(payload.name ?? '').trim()
        if (!name) throw new BizError(400, '名称不能为空')
        if (!list.includes(name)) list = [...list, name]
        break
      }
      case 'rename': {
        const oldName = String(payload.oldName ?? '')
        const newName = String(payload.newName ?? '').trim()
        if (!newName) throw new BizError(400, '新名称不能为空')
        if (oldName === newName) break
        if (list.includes(newName)) throw new BizError(409, `「${newName}」已存在`)
        list = list.map((c) => (c === oldName ? newName : c))
        const [prows] = await conn.query(`SELECT id FROM products WHERE \`${productField}\` = ?`, [oldName])
        const ids = (prows as RowDataPacket[]).map((r) => String(r.id))
        if (ids.length) {
          await conn.query(`UPDATE products SET \`${productField}\` = ?, updatedAt = ? WHERE \`${productField}\` = ?`, [newName, stamp, oldName])
          renamed = { ids, value: newName, updatedAt: stamp }
        }
        break
      }
      case 'delete': {
        const name = String(payload.name ?? '')
        list = list.filter((c) => c !== name)
        break
      }
      case 'move': {
        const name = String(payload.name ?? '')
        const dir = Number(payload.dir) >= 0 ? 1 : -1
        const i = list.indexOf(name)
        const j = i + dir
        if (i >= 0 && j >= 0 && j < list.length) {
          const next = [...list]
          const tmp = next[i]
          next[i] = next[j]
          next[j] = tmp
          list = next
        }
        break
      }
      default:
        throw new BizError(400, `未知操作 ${payload.op}`)
    }

    await conn.query(
      'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      [kind, JSON.stringify(list)],
    )
    return { list, renamed }
  })
}

/** 批量调价：逐个写价 + 生成调价记录（单事务） */
async function bulkPrice(payload: { ids: string[]; field: string; changes: Record<string, number>; log: { field: string; mode: string; scope: string; affected: number } }) {
  const allowed = ['retailPrice', 'memberPrice', 'minPrice', 'purchasePrice']
  const field = payload?.field
  if (!allowed.includes(field)) throw new BizError(400, '调价字段不合法')
  const ids = Object.keys(payload?.changes ?? {})
  if (!ids.length) throw new BizError(400, '没有需要调价的商品')
  return withTransaction(async (conn) => {
    const stamp = nowStamp()
    for (const id of ids) {
      const value = Number(payload.changes[id])
      if (Number.isNaN(value)) continue
      await conn.query(`UPDATE products SET \`${field}\` = ?, updatedAt = ? WHERE id = ?`, [value, stamp, id])
    }
    const logId = await nextId(conn, 'priceLogs', resources.priceLogs.idGen!)
    const log = await insertRow(conn, 'priceLogs', {
      id: logId,
      createdAt: stamp,
      field: payload.log?.field ?? field,
      mode: payload.log?.mode ?? '',
      scope: payload.log?.scope ?? '',
      affected: payload.log?.affected ?? ids.length,
      operator: '王建国',
    })
    const products = await loadProductPatches(conn, ids)
    return { products, log, stamp, field }
  })
}

/** 重置员工登录密码为初始密码（事务内单语句更新） */
async function resetStaffPassword(payload: { id: string }) {
  const id = payload?.id
  if (!id) throw new BizError(400, '缺少员工编号')
  const { hashPassword } = await import('@/lib/server/auth')
  const { DEFAULT_STAFF_PASSWORD } = await import('@/lib/server/store')
  const hashed = hashPassword(DEFAULT_STAFF_PASSWORD)
  const affected = await withTransaction(async (conn) => {
    const [res] = await conn.query('UPDATE staff SET password_hash = ? WHERE id = ?', [hashed, id])
    return (res as { affectedRows: number }).affectedRows
  })
  if (!affected) throw new BizError(404, '员工不存在')
  return { password: DEFAULT_STAFF_PASSWORD }
}

/**
 * POST /api/actions
 * 跨表业务动作，全部在单个事务内完成，失败自动回滚。
 */
export async function POST(req: NextRequest) {
  if (!getRequestUser(req)) return unauthorized()
  let body: { action?: string; payload?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 })
  }
  const action = body.action
  const payload = body.payload ?? {}
  try {
    switch (action) {
      case 'checkout':
        return NextResponse.json({ ok: true, ...(await checkout(payload as { order: Record<string, unknown> })) })
      case 'approve-refund':
        return NextResponse.json({ ok: true, ...(await approveRefund(payload as { refundId: string })) })
      case 'confirm-stock-in':
        return NextResponse.json({ ok: true, ...(await confirmStockIn(payload as { orderId: string | null; lines: StockInLine[] })) })
      case 'list-op':
        return NextResponse.json({ ok: true, ...(await listOp(payload as { kind: 'categories' | 'brands'; op: string })) })
      case 'bulk-price':
        return NextResponse.json({ ok: true, ...(await bulkPrice(payload as { ids: string[]; field: string; changes: Record<string, number>; log: { field: string; mode: string; scope: string; affected: number } })) })
      case 'reset-staff-password':
        return NextResponse.json({ ok: true, ...(await resetStaffPassword(payload as { id: string })) })
      default:
        return NextResponse.json({ error: `未知动作 ${action}` }, { status: 400 })
    }
  } catch (err) {
    if (err instanceof BizError) return NextResponse.json({ error: err.message }, { status: err.status })
    const message = err instanceof Error ? err.message : '操作失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
