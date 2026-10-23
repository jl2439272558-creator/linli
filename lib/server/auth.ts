import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { execute, query } from '@/lib/server/db'
import type { StaffRole } from '@/lib/mock-data'

export const SESSION_COOKIE = 'saas_session'
const SESSION_TTL_SECONDS = 7 * 24 * 3600

export type SessionUser = {
  id: string
  name: string
  account: string
  role: StaffRole
}

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (s) return s
  // 未配置时退化为固定密钥，仅保证本机演示可用
  return 'linli-saas-dev-secret'
}

/* ---------------- 密码（scrypt，无需额外依赖） ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const calc = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(calc, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/* ---------------- 会话令牌（HMAC 签名，不落库） ---------------- */

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex')
}

export function createSessionToken(user: SessionUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = Buffer.from(JSON.stringify({ ...user, exp })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function parseSessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expect = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expect)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionUser & { exp: number }
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null
    if (!data.id || !data.role) return null
    return { id: data.id, name: data.name, account: data.account, role: data.role }
  } catch {
    return null
  }
}

/** 服务端组件读取当前登录用户（仅校验签名，不查库） */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  return parseSessionToken(store.get(SESSION_COOKIE)?.value)
}

/** API 路由读取当前登录用户 */
export function getRequestUser(req: NextRequest): SessionUser | null {
  return parseSessionToken(req.cookies.get(SESSION_COOKIE)?.value)
}

/** API 统一鉴权：未登录返回 401 */
export function unauthorized(): Response {
  return Response.json({ ok: false, error: '登录已过期，请重新登录' }, { status: 401 })
}

/* ---------------- 登录 ---------------- */

export type LoginResult =
  | { ok: true; user: SessionUser; token: string }
  | { ok: false; status: number; error: string }

export async function login(account: string, password: string): Promise<LoginResult> {
  const acc = account.trim()
  if (!acc || !password) return { ok: false, status: 400, error: '请输入账号与密码' }
  const rows = await query<{
    id: string
    name: string
    account: string
    role: StaffRole
    status: string
    password_hash: string | null
  }>('SELECT id, name, account, role, status, password_hash FROM staff WHERE account = ? LIMIT 1', [acc])
  const row = rows[0]
  if (!row || !verifyPassword(password, row.password_hash)) {
    return { ok: false, status: 401, error: '账号或密码错误' }
  }
  if (row.status !== '在职') return { ok: false, status: 403, error: '该账号已停用，请联系店长' }
  const user: SessionUser = { id: row.id, name: row.name, account: row.account, role: row.role }
  // 登录时间落库（尽力而为，失败不影响登录）
  try {
    const d = new Date(Date.now() + 8 * 3600 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${d.toISOString().slice(0, 10)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    await execute('UPDATE staff SET lastLoginAt = ? WHERE id = ?', [stamp, row.id])
  } catch {
    /* 忽略 */
  }
  return { ok: true, user, token: createSessionToken(user) }
}
