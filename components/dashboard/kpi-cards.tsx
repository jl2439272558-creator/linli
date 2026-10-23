'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Banknote, Package, ReceiptText, TrendingUp, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useDemoStore } from '@/components/providers/demo-store'
import { getStockStatus, todayStats } from '@/lib/mock-data'
import { formatMoney, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

type Kpi = {
  label: string
  value: string
  icon: LucideIcon
  delta?: number
  foot: string
  href?: string
  tone?: 'warning'
}

export function KpiCards() {
  const { products } = useDemoStore()
  const alerts = products.filter((p) => getStockStatus(p) !== '正常')
  const outOfStock = products.filter((p) => getStockStatus(p) === '缺货').length

  const kpis: Kpi[] = [
    { label: '今日销售额', value: formatMoney(todayStats.sales), icon: Banknote, delta: todayStats.salesDelta, foot: '较昨日同时段' },
    { label: '订单数量', value: `${formatNumber(todayStats.orders)} 笔`, icon: ReceiptText, delta: todayStats.ordersDelta, foot: `客单价 ${formatMoney(todayStats.avgTicket)}` },
    { label: '毛利额', value: formatMoney(todayStats.profit), icon: TrendingUp, delta: todayStats.profitDelta, foot: `毛利率 ${((todayStats.profit / todayStats.sales) * 100).toFixed(1)}%` },
    { label: '商品总数', value: `${formatNumber(products.length)} 个`, icon: Package, foot: '在售 SKU · 含 AI 采集', href: '/products' },
    { label: '库存预警', value: `${alerts.length} 个`, icon: TriangleAlert, foot: `缺货 ${outOfStock} 个 · 偏低 ${alerts.length - outOfStock} 个`, href: '/products?stock=预警', tone: 'warning' },
  ]

  return (
    <section aria-label="今日经营指标" className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
      {kpis.map((k, idx) => {
        const Icon = k.icon
        const content = (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">{k.label}</span>
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg',
                  k.tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-brand-soft text-primary',
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-xl font-semibold tracking-tight text-foreground tabular-nums md:text-2xl">{k.value}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs">
              {k.delta !== undefined && (
                <span className={cn('inline-flex items-center gap-0.5 font-medium tabular-nums', k.delta >= 0 ? 'text-success' : 'text-danger')}>
                  {k.delta >= 0 ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : <ArrowDownRight className="size-3.5" aria-hidden="true" />}
                  {Math.abs(k.delta)}%
                </span>
              )}
              <span className="text-muted-foreground">{k.foot}</span>
            </div>
          </>
        )
        const cls = cn(
          'rounded-xl border border-border bg-card p-4 transition-colors',
          // 手机端两列布局：第 5 张卡占满整行，避免孤卡悬空
          idx === kpis.length - 1 && 'col-span-2 md:col-span-1',
        )
        return k.href ? (
          <Link key={k.label} href={k.href} className={cn(cls, 'hover:border-primary/40')}>
            {content}
          </Link>
        ) : (
          <div key={k.label} className={cls}>
            {content}
          </div>
        )
      })}
    </section>
  )
}
