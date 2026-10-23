import type { PoolConnection } from 'mysql2/promise'
import { execute, query, withTransaction } from '@/lib/server/db'
import {
  entityToRow,
  idColumnOf,
  resources,
  rowToEntity,
  type ResourceDef,
} from '@/lib/server/resources'
import {
  brands,
  categories,
  initialPriceLogs,
  initialProducts,
  initialPurchaseOrders,
  initialRefunds,
  initialReviewItems,
  initialSaleOrders,
  initialStaff,
  initialStockInRecords,
  initialSupplierDetails,
  initialTasks,
  stores as initialStores,
} from '@/lib/mock-data'

function columnDdl(col: { name: string; type: string }, isId: boolean): string {
  if (isId) return `\`${col.name}\` VARCHAR(64) NOT NULL PRIMARY KEY`
  if (col.type === 'number') return `\`${col.name}\` DOUBLE NULL`
  if (col.type === 'bool') return `\`${col.name}\` TINYINT(1) NULL`
  return `\`${col.name}\` TEXT NULL`
}

function createTableSql(def: ResourceDef): string {
  const idCol = idColumnOf(def)
  const body = def.columns.map((c) => columnDdl(c, c.name === idCol)).join(', ')
  return `CREATE TABLE IF NOT EXISTS \`${def.table}\` (${body}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
}

const AUX_SQL = [
  `CREATE TABLE IF NOT EXISTS \`settings\` (\`k\` VARCHAR(64) NOT NULL PRIMARY KEY, \`v\` LONGTEXT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  `CREATE TABLE IF NOT EXISTS \`schema_meta\` (\`k\` VARCHAR(64) NOT NULL PRIMARY KEY, \`v\` LONGTEXT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  `CREATE TABLE IF NOT EXISTS \`sequences\` (\`name\` VARCHAR(64) NOT NULL PRIMARY KEY, \`next_val\` INT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
]

async function insertEntities(conn: PoolConnection, def: ResourceDef, entities: Record<string, unknown>[]): Promise<void> {
  if (!entities.length) return
  const colSql = def.columns.map((c) => `\`${c.name}\``).join(', ')
  const placeholders = entities.map(() => `(${def.columns.map(() => '?').join(', ')})`).join(', ')
  const values = entities.flatMap((e) => {
    const row = entityToRow(def, e)
    return def.columns.map((c) => row[c.name])
  })
  await conn.query(`INSERT INTO \`${def.table}\` (${colSql}) VALUES ${placeholders}`, values)
}

/** 首次访问时建表并写入演示种子数据，之后不再重复写入 */
export async function ensureReady(): Promise<void> {
  const g = globalThis as { __saasStoreReady?: Promise<void> }
  if (!g.__saasStoreReady) {
    g.__saasStoreReady = init()
      .catch((err) => {
        g.__saasStoreReady = undefined
        throw err
      })
  }
  return g.__saasStoreReady
}

async function init(): Promise<void> {
  for (const def of Object.values(resources)) await execute(createTableSql(def))
  for (const sql of AUX_SQL) await execute(sql)

  // staff 表补充登录密码列（密码不进入任何查询返回列，无法通过通用接口写入）
  const colRows = await query<{ COLUMN_NAME: string }>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'password_hash'",
  )
  if (!colRows.length) await execute('ALTER TABLE staff ADD COLUMN password_hash VARCHAR(255) NULL')

  const [flag] = await query<{ v: string }>('SELECT v FROM schema_meta WHERE k = ?', ['seeded'])
  if (flag?.v === '1') {
    await backfillStaffPasswords()
    return
  }

  await withTransaction(async (conn) => {
    // 单号序列起点：接续现有演示数据
    await conn.query(
      'INSERT INTO sequences (name, next_val) VALUES (?, ?), (?, ?), (?, ?), (?, ?) ON DUPLICATE KEY UPDATE next_val = next_val',
      ['product', 10012, 'suppliers', 5, 'staff', 6, 'stores', 3],
    )
    await insertEntities(conn, resources.products, initialProducts as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.suppliers, initialSupplierDetails as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.staff, initialStaff as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.stores, initialStores as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.purchaseOrders, initialPurchaseOrders as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.stockInRecords, initialStockInRecords as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.saleOrders, initialSaleOrders as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.refunds, initialRefunds as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.tasks, initialTasks as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.reviewItems, initialReviewItems as unknown as Record<string, unknown>[])
    await insertEntities(conn, resources.priceLogs, initialPriceLogs as unknown as Record<string, unknown>[])

    const settings: Record<string, string> = {
      categories: JSON.stringify(categories),
      brands: JSON.stringify(brands),
      receiptTitle: '',
      rounding: 'jiao',
      safetyStockDefault: '30',
      meituan: '0',
    }
    const keys = Object.keys(settings)
    await conn.query(
      `INSERT INTO settings (k, v) VALUES ${keys.map(() => '(?, ?)').join(', ')}`,
      keys.flatMap((k) => [k, settings[k]]),
    )
    await conn.query('INSERT INTO schema_meta (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = v', ['seeded', '1'])
  })
  await backfillStaffPasswords()
}

/** 为尚未设置密码的员工补初始密码（含新入库的员工档案），初始密码见部署说明 */
export async function backfillStaffPasswords(): Promise<void> {
  const { hashPassword } = await import('@/lib/server/auth')
  const rows = await query<{ id: string }>('SELECT id FROM staff WHERE password_hash IS NULL')
  for (const r of rows) {
    await execute('UPDATE staff SET password_hash = ? WHERE id = ?', [hashPassword(DEFAULT_STAFF_PASSWORD), r.id])
  }
}

/** 员工初始密码：登录后由店长在员工管理中重置 */
export const DEFAULT_STAFF_PASSWORD = '123456'

/** 全量读取：bootstrap 一次拉齐所有列表与设置 */
export async function fetchAll(): Promise<Record<string, unknown>> {
  await ensureReady()
  const out: Record<string, unknown> = {}
  for (const [key, def] of Object.entries(resources)) {
    const field = def.orderField ?? idColumnOf(def)
    const dir = def.order === 'desc' ? 'DESC' : 'ASC'
    const rows = await query<Record<string, unknown>>(`SELECT * FROM \`${def.table}\` ORDER BY \`${field}\` ${dir}`)
    out[key] = rows.map((r) => rowToEntity(def, r))
  }
  const settingRows = await query<{ k: string; v: string | null }>('SELECT k, v FROM settings')
  const settings: Record<string, string> = {}
  for (const r of settingRows) settings[r.k] = r.v ?? ''
  out.settings = settings
  return out
}

export async function readSettings(): Promise<Record<string, string>> {
  const rows = await query<{ k: string; v: string | null }>('SELECT k, v FROM settings')
  const out: Record<string, string> = {}
  for (const r of rows) out[r.k] = r.v ?? ''
  return out
}
