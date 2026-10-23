import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getRequestUser, unauthorized } from '@/lib/server/auth'

export const runtime = 'nodejs'

const NAME_RE = /^\d{13}-[a-f0-9-]{8}\.(jpg|png|webp|gif)$/
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

/** GET /api/uploads/<name>：读取已上传的商品图片 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  if (!getRequestUser(req)) return unauthorized()
  const { name } = await ctx.params
  if (!NAME_RE.test(name)) return new NextResponse('Not Found', { status: 404 })
  try {
    const buf = await readFile(path.join(process.cwd(), 'uploads', name))
    const ext = path.extname(name)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
