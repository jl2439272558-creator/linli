import mysql from 'mysql2/promise'
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

/** 数据库环境变量统一从 .env.local 读取，缺失时给出明确报错 */
function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`缺少数据库环境变量 ${name}，请在 .env.local 中配置数据库连接`)
  return v
}

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env('DB_HOST'),
      port: Number(process.env.DB_PORT || 3306),
      user: env('DB_USER'),
      password: env('DB_PASSWORD'),
      database: env('DB_NAME'),
      charset: 'utf8mb4',
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
    })
  }
  return pool
}

export async function query<T = RowDataPacket>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, params)
  return rows as T[]
}

export async function execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
  const [res] = await getPool().execute(sql, params)
  return res as ResultSetHeader
}

/** 统一走事务，出错自动回滚 */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
