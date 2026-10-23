import { NextRequest, NextResponse } from 'next/server'
import { execute, query, withTransaction } from '@/lib/server/db'
import { entityToRow, idColumnOf, nextId, nowStamp, resources } from '@/lib/server/resources'
import { getRequestUser, unauthorized } from '@/lib/server/auth'

type Body = {
  resource?: string
  op?: string
  entity?: Record<string, unknown>
  id?: string
  ids?: string[]
  patch?: Record<string, unknown>
  delta?: number
  k?: string
  v?: string
}

/** 只允许写入资源定义中声明的列，避免注入与越权字段 */
function pickColumns(resource: string, obj: Record<string, unknown>): { sql: string[]; values: unknown[] } {
  const def = resources[resource]
  const sql: string[] = []
  const values: unknown[] = []
  for (const col of def.columns) {
    if (obj[col.name] === undefined) continue
    sql.push(`\`${col.name}\` = ?`)
    values.push(entityToRow(def, { [col.name]: obj[col.name] })[col.name])
  }
  return { sql, values }
}

/**
 * POST /api/data
 * 统一的单表写入：create / update / delete / update-many / update-all / settings.set
 * 每条语句自身原子；跨表业务统一走 /api/actions 事务接口。
 */
export async function POST(req: NextRequest) {
  if (!getRequestUser(req)) return unauthorized()
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 })
  }
  const { resource, op } = body
  if (!resource || !op) return NextResponse.json({ error: '缺少 resource 或 op' }, { status: 400 })

  try {
    if (resource === 'settings') {
      if (op !== 'set' || !body.k) return NextResponse.json({ error: 'settings 仅支持 set' }, { status: 400 })
      await execute(
        'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
        [body.k, body.v ?? ''],
      )
      return NextResponse.json({ ok: true })
    }

    const def = resources[resource]
    if (!def) return NextResponse.json({ error: `未知资源 ${resource}` }, { status: 400 })
    const idCol = idColumnOf(def)

    if (op === 'create') {
      if (!def.idGen) return NextResponse.json({ error: `${resource} 不支持创建` }, { status: 400 })
      const entity = body.entity ?? {}
      const row = entityToRow(def, entity)
      const created = await withTransaction(async (conn) => {
        const id = await nextId(conn, resource, def.idGen!)
        row[idCol] = id
        const colSql = def.columns.map((c) => `\`${c.name}\``).join(', ')
        const ph = def.columns.map(() => '?').join(', ')
        await conn.query(`INSERT INTO \`${def.table}\` (${colSql}) VALUES (${ph})`, def.columns.map((c) => row[c.name]))
        // 新建员工自动写入初始密码，使其可直接登录
        if (resource === 'staff') {
          const { hashPassword } = await import('@/lib/server/auth')
          const { DEFAULT_STAFF_PASSWORD } = await import('@/lib/server/store')
          await conn.query('UPDATE staff SET password_hash = ? WHERE id = ?', [hashPassword(DEFAULT_STAFF_PASSWORD), id])
        }
        return row
      })
      return NextResponse.json({ ok: true, entity: created })
    }

    if (op === 'update') {
      const { sql, values } = pickColumns(resource, body.patch ?? {})
      if (!body.id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
      if (!sql.length) return NextResponse.json({ ok: true, updated: 0 })
      await execute(`UPDATE \`${def.table}\` SET ${sql.join(', ')} WHERE \`${idCol}\` = ?`, [...values, body.id])
      return NextResponse.json({ ok: true })
    }

    if (op === 'delete') {
      const ids = body.ids ?? []
      if (!ids.length) return NextResponse.json({ ok: true })
      const ph = ids.map(() => '?').join(', ')
      await execute(`DELETE FROM \`${def.table}\` WHERE \`${idCol}\` IN (${ph})`, ids)
      return NextResponse.json({ ok: true })
    }

    if (op === 'update-many') {
      const ids = body.ids ?? []
      if (!ids.length) return NextResponse.json({ ok: true })
      const { sql, values } = pickColumns(resource, body.patch ?? {})
      if (!sql.length) return NextResponse.json({ ok: true })
      const ph = ids.map(() => '?').join(', ')
      await execute(`UPDATE \`${def.table}\` SET ${sql.join(', ')} WHERE \`${idCol}\` IN (${ph})`, [...values, ...ids])
      return NextResponse.json({ ok: true })
    }

    if (op === 'adjust-stock') {
      if (resource !== 'products' || !body.id || typeof body.delta !== 'number') {
        return NextResponse.json({ error: 'adjust-stock 仅适用于 products 且需要 id 与 delta' }, { status: 400 })
      }
      await execute('UPDATE products SET stock = GREATEST(0, stock + ?), updatedAt = ? WHERE id = ?', [
        body.delta,
        nowStamp(),
        body.id,
      ])
      return NextResponse.json({ ok: true })
    }

    if (op === 'update-all') {
      const { sql, values } = pickColumns(resource, body.patch ?? {})
      if (!sql.length) return NextResponse.json({ ok: true })
      await execute(`UPDATE \`${def.table}\` SET ${sql.join(', ')}`, values)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: `未知操作 ${op}` }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : '数据库写入失败'
    const status = (err as { code?: string }).code === 'ER_DUP_ENTRY' ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/** GET /api/data?resource=xxx：单表读取（调试与局部刷新用） */
export async function GET(req: NextRequest) {
  if (!getRequestUser(req)) return unauthorized()
  const resource = req.nextUrl.searchParams.get('resource') ?? ''
  const def = resources[resource]
  if (!def) return NextResponse.json({ error: `未知资源 ${resource}` }, { status: 400 })
  try {
    const rows = await query(`SELECT * FROM \`${def.table}\``)
    return NextResponse.json({ ok: true, rows })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '读取失败' }, { status: 500 })
  }
}
