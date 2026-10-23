import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getRequestUser, unauthorized } from '@/lib/server/auth'

const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const MAX_BYTES = 2 * 1024 * 1024

export const runtime = 'nodejs'

/**
 * POST /api/upload（multipart/form-data，字段名 file）
 * 商品图片真实落盘到项目 uploads/ 目录，返回可通过 /api/uploads/<name> 访问的 URL。
 */
export async function POST(req: NextRequest) {
  if (!getRequestUser(req)) return unauthorized()
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: '请以 multipart/form-data 上传文件' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: '未选择文件' }, { status: 400 })

  const ext = ALLOWED[file.type]
  if (!ext) return NextResponse.json({ ok: false, error: '仅支持 JPG / PNG / WebP / GIF 图片' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: '图片不能超过 2MB' }, { status: 400 })

  const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
  const dir = path.join(process.cwd(), 'uploads')
  await mkdir(dir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, name), buffer)

  return NextResponse.json({ ok: true, url: `/api/uploads/${name}` })
}
