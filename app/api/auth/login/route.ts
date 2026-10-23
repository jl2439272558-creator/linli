import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, login } from '@/lib/server/auth'
import { defaultHome } from '@/lib/authz'

/** POST /api/auth/login：账号密码登录，成功后写入 httpOnly 会话 Cookie */
export async function POST(req: NextRequest) {
  let body: { account?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: '请求体不是合法 JSON' }, { status: 400 })
  }
  try {
    const result = await login(body.account ?? '', body.password ?? '')
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status })
    const res = NextResponse.json({ ok: true, user: result.user, home: defaultHome(result.user.role) })
    res.cookies.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === '1',
      path: '/',
      maxAge: 7 * 24 * 3600,
    })
    return res
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : '登录失败' }, { status: 500 })
  }
}
