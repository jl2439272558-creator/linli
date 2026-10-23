'use client'

import { useState } from 'react'
import { CalendarDays, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useDemoStore } from '@/components/providers/demo-store'
import { getStockStatus } from '@/lib/mock-data'
import { downloadCsv, todaySuffix } from '@/lib/export-csv'
import { formatMoney } from '@/lib/format'

export function DashboardActions() {
  const { currentStore, products, saleOrders, refunds } = useDemoStore()
  const [loading, setLoading] = useState(false)

  const exportDaily = () => {
    const d = new Date()
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const today = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    const todayOrders = saleOrders.filter((o) => o.createdAt.startsWith(today))
    const paid = todayOrders.reduce((s, o) => s + o.paid, 0)
    const todayRefunds = refunds.filter((r) => r.createdAt.startsWith(today))
    const lowCount = products.filter((p) => getStockStatus(p) === '库存偏低').length
    const outCount = products.filter((p) => getStockStatus(p) === '缺货').length
    const rows: (string | number)[][] = [
      ['门店', currentStore.name],
      ['日期', today],
      ['今日订单数', todayOrders.length],
      ['今日实收金额', Math.round(paid * 100) / 100],
      ['今日客单价', todayOrders.length ? Math.round((paid / todayOrders.length) * 100) / 100 : 0],
      ['今日退货单数', todayRefunds.length],
      ['今日退款金额', Math.round(todayRefunds.reduce((s, r) => s + r.amount, 0) * 100) / 100],
      ['在架商品数', products.length],
      ['库存偏低商品数', lowCount],
      ['缺货商品数', outCount],
      ['库存预警合计', lowCount + outCount],
      ['导出时间', `${today} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`],
    ]
    downloadCsv(`经营日报_${todaySuffix()}`, ['指标', '数值'], rows)
    toast.success('日报已导出', { description: `经营日报_${todaySuffix()}.csv · 数据来自实时数据库` })
  }

  return (
    <>
      <Button variant="outline" className="h-9" onClick={() => toast.info('日期筛选', { description: '演示版本固定展示今日数据' })}>
        <CalendarDays data-icon="inline-start" />
        今日
      </Button>
      <Button
        variant="outline"
        className="h-9"
        disabled={loading}
        onClick={() => {
          setLoading(true)
          window.location.reload()
        }}
      >
        <RefreshCw data-icon="inline-start" className={loading ? 'animate-spin' : undefined} />
        刷新
      </Button>
      <Button className="h-9" onClick={exportDaily}>
        <Download data-icon="inline-start" />
        导出日报
      </Button>
    </>
  )
}
