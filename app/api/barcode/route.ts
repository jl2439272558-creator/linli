import { NextRequest, NextResponse } from 'next/server'
import { queryBarcodeDb } from '@/lib/barcode-db'

/**
 * GET /api/barcode?code=6901285991219
 *
 * 条码 → 商品信息查询接口。当前返回内置演示库数据。
 *
 * 接入真实条码数据库（如聚合数据 / 阿里云市场「商品条码查询」）时：
 *   const resp = await fetch(`https://api.example.com/barcode?code=${code}`, {
 *     headers: { Authorization: `Bearer ${process.env.BARCODE_API_KEY}` },
 *     next: { revalidate: 86400 }, // 条码信息变化极少，缓存 24h
 *   })
 * API Key 必须放在服务端环境变量，不要写进前端代码。
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim() ?? ''
  if (!/^\d{8,14}$/.test(code)) {
    return NextResponse.json({ found: false, error: '条码应为 8–14 位数字' }, { status: 400 })
  }
  const info = queryBarcodeDb(code)
  return NextResponse.json({ found: !!info, info })
}
