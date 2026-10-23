import type { PoolConnection } from 'mysql2/promise'

export type ColumnType = 'string' | 'number' | 'bool' | 'json'

export type ColumnDef = { name: string; type: ColumnType }

export type IdGen = {
  /** 单号前缀 */
  prefix: string
  /** 序号位数（0 表示不补零） */
  pad: number
  /** 是否按天重新计数 */
  perDay?: boolean
  /** 起始序号 */
  start: number
}

export type ResourceDef = {
  table: string
  columns: ColumnDef[]
  /** 业务主键列名，默认 id */
  idColumn?: string
  idGen?: IdGen
  /** 列表默认排序，desc = 倒序（最新在前） */
  order?: 'asc' | 'desc'
  /** 排序字段，默认 id；products 用 updatedAt */
  orderField?: string
}

const cols = (...names: string[]): ColumnDef[] => names.map((name) => ({ name, type: 'string' }))
const num = (name: string): ColumnDef => ({ name, type: 'number' })
const bool = (name: string): ColumnDef => ({ name, type: 'bool' })
const json = (name: string): ColumnDef => ({ name, type: 'json' })

export const resources: Record<string, ResourceDef> = {
  products: {
    table: 'products',
    idGen: { prefix: 'P', pad: 5, start: 10013 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'image', type: 'string' },
      { name: 'barcode', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'brand', type: 'string' },
      { name: 'spec', type: 'string' },
      num('purchasePrice'),
      num('retailPrice'),
      num('memberPrice'),
      num('minPrice'),
      num('stock'),
      num('safetyStock'),
      { name: 'unit', type: 'string' },
      { name: 'supplier', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'source', type: 'string' },
      { name: 'updatedAt', type: 'string' },
    ],
    order: 'desc',
    orderField: 'updatedAt',
  },
  suppliers: {
    table: 'suppliers',
    idGen: { prefix: 'SUP', pad: 2, start: 6 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'contact', type: 'string' },
      { name: 'phone', type: 'string' },
      json('categories'),
      { name: 'status', type: 'string' },
      num('onTimeRate'),
      { name: 'since', type: 'string' },
      { name: 'address', type: 'string' },
    ],
  },
  staff: {
    table: 'staff',
    idGen: { prefix: 'E', pad: 3, start: 7 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'account', type: 'string' },
      { name: 'role', type: 'string' },
      { name: 'storeId', type: 'string' },
      { name: 'phone', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'lastLoginAt', type: 'string' },
    ],
  },
  stores: {
    table: 'stores',
    idGen: { prefix: 's', pad: 0, start: 4 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'address', type: 'string' },
      { name: 'phone', type: 'string' },
      { name: 'hours', type: 'string' },
      { name: 'manager', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'openedAt', type: 'string' },
      num('monthSales'),
    ],
  },
  purchaseOrders: {
    table: 'purchase_orders',
    idGen: { prefix: 'PO', pad: 3, perDay: true, start: 1 },
    columns: [...cols('id', 'supplier', 'status', 'expectedAt', 'createdAt', 'operator'), json('items')],
    order: 'desc',
  },
  stockInRecords: {
    table: 'stock_in_records',
    idGen: { prefix: 'SI', pad: 3, perDay: true, start: 1 },
    columns: [...cols('id', 'orderId', 'supplier', 'status', 'arrivedAt', 'operator'), json('items')],
    order: 'desc',
  },
  saleOrders: {
    table: 'sale_orders',
    idGen: { prefix: 'SO', pad: 3, perDay: true, start: 1 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'createdAt', type: 'string' },
      json('items'),
      num('amount'),
      num('discount'),
      num('paid'),
      { name: 'payMethod', type: 'string' },
      { name: 'cashier', type: 'string' },
      { name: 'memberName', type: 'string' },
      { name: 'memberPhone', type: 'string' },
      { name: 'status', type: 'string' },
      num('refunded'),
    ],
    order: 'desc',
  },
  refunds: {
    table: 'refunds',
    idGen: { prefix: 'RF', pad: 3, perDay: true, start: 1 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'orderId', type: 'string' },
      { name: 'createdAt', type: 'string' },
      json('items'),
      num('amount'),
      { name: 'reason', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'operator', type: 'string' },
      { name: 'handledAt', type: 'string' },
      bool('stockRolledBack'),
    ],
    order: 'desc',
  },
  tasks: {
    table: 'collect_tasks',
    idGen: { prefix: 'AT', pad: 3, perDay: true, start: 1 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'source', type: 'string' },
      { name: 'sourceDetail', type: 'string' },
      num('total'),
      num('success'),
      num('pending'),
      { name: 'status', type: 'string' },
      num('progress'),
      { name: 'createdAt', type: 'string' },
      { name: 'operator', type: 'string' },
    ],
    order: 'desc',
  },
  reviewItems: {
    table: 'review_items',
    columns: [
      { name: 'id', type: 'string' },
      { name: 'taskId', type: 'string' },
      { name: 'image', type: 'string' },
      num('confidence'),
      json('name'),
      json('brand'),
      json('spec'),
      json('category'),
      json('barcode'),
      json('refPrice'),
      json('suggestedPrice'),
      { name: 'status', type: 'string' },
      { name: 'sourceText', type: 'string' },
    ],
  },
  priceLogs: {
    table: 'price_logs',
    idGen: { prefix: 'PL', pad: 3, perDay: true, start: 1 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'createdAt', type: 'string' },
      { name: 'field', type: 'string' },
      { name: 'mode', type: 'string' },
      { name: 'scope', type: 'string' },
      num('affected'),
      { name: 'operator', type: 'string' },
    ],
    order: 'desc',
  },
  heldOrders: {
    table: 'held_orders',
    idGen: { prefix: 'HD', pad: 3, perDay: true, start: 1 },
    columns: [
      { name: 'id', type: 'string' },
      { name: 'createdAt', type: 'string' },
      json('items'),
      num('amount'),
      num('count'),
      { name: 'memberName', type: 'string' },
      { name: 'memberPhone', type: 'string' },
      { name: 'memberId', type: 'string' },
      bool('member'),
    ],
    order: 'desc',
  },
}

export function idColumnOf(def: ResourceDef): string {
  return def.idColumn ?? 'id'
}

/** 数据库行 → 实体（解析 JSON、布尔） */
export function rowToEntity(def: ResourceDef, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of def.columns) {
    const v = row[c.name]
    if (c.type === 'json') out[c.name] = v == null ? null : typeof v === 'string' ? JSON.parse(v) : v
    else if (c.type === 'bool') out[c.name] = v == null ? false : Boolean(v)
    else out[c.name] = v ?? null
  }
  return out
}

/** 实体 → 数据库行（序列化 JSON、布尔） */
export function entityToRow(def: ResourceDef, entity: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of def.columns) {
    const v = entity[c.name]
    if (v === undefined) {
      out[c.name] = null
    } else if (c.type === 'json') {
      out[c.name] = v == null ? null : JSON.stringify(v)
    } else if (c.type === 'bool') {
      out[c.name] = v ? 1 : 0
    } else {
      out[c.name] = v
    }
  }
  return out
}

/** 生成带前缀的单号，序号落在 sequences 表，跨天/跨会话不重复 */
export async function nextId(conn: PoolConnection, key: string, gen: IdGen): Promise<string> {
  const date = shanghaiDateCompact()
  const seqName = gen.perDay ? `${key}:${date}` : key
  await conn.query('INSERT INTO sequences (name, next_val) VALUES (?, 0) ON DUPLICATE KEY UPDATE next_val = next_val', [seqName])
  await conn.query('UPDATE sequences SET next_val = LAST_INSERT_ID(next_val + 1) WHERE name = ?', [seqName])
  const [rows] = await conn.query('SELECT LAST_INSERT_ID() AS n')
  const n = Number((rows as { n: number }[])[0].n)
  const seq = gen.pad > 0 ? String(n).padStart(gen.pad, '0') : String(n)
  return `${gen.prefix}${gen.perDay ? date : ''}${seq}`
}

/** 上海时区日期（YYYYMMDD），与业务单号日期保持一致 */
export function shanghaiDateCompact(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

/** 上海时区时间戳（YYYY-MM-DD HH:mm） */
export function nowStamp(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}
