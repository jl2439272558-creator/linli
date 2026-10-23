import { NextRequest, NextResponse } from 'next/server'
import { fetchAll } from '@/lib/server/store'
import { getRequestUser, unauthorized } from '@/lib/server/auth'

/** GET /api/bootstrap：一次拉取全部列表与设置，失败时前端回退到演示数据 */
export async function GET(req: NextRequest) {
  if (!getRequestUser(req)) return unauthorized()
  try {
    const data = await fetchAll()
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : '数据库初始化失败'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
