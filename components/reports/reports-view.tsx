'use client'

import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Banknote, Download, FileBarChart, Printer, ReceiptText, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/common/page-header'
import { SectionCard } from '@/components/common/section-card'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { categorySales, productSalesRank, salesDaily } from '@/lib/mock-data'
import { formatMoney, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

type Range = 7 | 30 | 90

const ranges: { key: Range; label: string }[] = [
  { key: 7, label: '近 7 天' },
  { key: 30, label: '近 30 天' },
  { key: 90, label: '近 90 天' },
]

const rangeHint: Record<Range, string> = { 7: '2026-10-14 至 2026-10-20', 30: '2026-09-21 至 2026-10-20', 90: '2026-07-23 至 2026-10-20' }

/** 导出 CSV：在浏览器本地生成并下载，不经过服务端 */
function downloadCsv(filename: string, head: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [head, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsView() {
  const [range, setRange] = useState<Range>(30)

  const rows = useMemo(() => salesDaily.slice(-range).slice().reverse(), [range])
  const totalSales = rows.reduce((s, d) => s + d.sales, 0)
  const totalProfit = rows.reduce((s, d) => s + d.profit, 0)
  const totalOrders = rows.reduce((s, d) => s + d.orders, 0)
  const margin = totalSales ? (totalProfit / totalSales) * 100 : 0
  const avgOrders = totalOrders / Math.max(1, rows.length)
  const avgTicket = totalOrders ? totalSales / totalOrders : 0

  // 与前一等长周期对比
  const prev = salesDaily.slice(-range * 2, -range)
  const prevSales = prev.reduce((s, d) => s + d.sales, 0)
  const salesDelta = prevSales ? ((totalSales - prevSales) / prevSales) * 100 : 0

  const topSales = productSalesRank[0]?.sales ?? 0
  const rankTotal = productSalesRank.reduce((s, r) => s + r.sales, 0)

  const stats: StatItem[] = [
    { label: '销售额合计', value: formatMoney(totalSales, 0), icon: Banknote, tone: 'bg-brand-soft text-primary', hint: `${rangeHint[range]}` },
    { label: '订单数量', value: `${formatNumber(totalOrders)} 笔`, icon: ReceiptText, tone: 'bg-info-soft text-info', hint: `日均 ${avgOrders.toFixed(0)} 笔 · 客单价 ${formatMoney(avgTicket)}` },
    { label: '毛利额合计', value: formatMoney(totalProfit, 0), icon: TrendingUp, tone: 'bg-ai-soft text-ai', hint: `毛利率 ${margin.toFixed(1)}%` },
    { label: '较上一周期', value: `${salesDelta >= 0 ? '+' : ''}${salesDelta.toFixed(1)}%`, icon: salesDelta >= 0 ? ArrowUpRight : ArrowDownRight, tone: salesDelta >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger', hint: `对比区间销售额 ${formatMoney(prevSales, 0)}` },
  ]

  const exportReport = () => {
    downloadCsv(
      `经营日报_近${range}天_20261020.csv`,
      ['日期', '订单数', '销售额(元)', '毛利额(元)', '客单价(元)', '毛利率(%)'],
      rows.map((d) => [d.date, d.orders, d.sales, d.profit, (d.sales / d.orders).toFixed(2), ((d.profit / d.sales) * 100).toFixed(1)]),
    )
    toast.success(`已导出近 ${range} 天经营日报`, { description: `经营日报_近${range}天_20261020.csv · 共 ${rows.length} 行` })
  }

  const exportRank = () => {
    downloadCsv(
      '商品销售排行_近30天_20261020.csv',
      ['排名', '商品', '分类', '销量', '销售额(元)', '毛利额(元)', '毛利率(%)'],
      productSalesRank.map((r, i) => [i + 1, r.name, r.category, r.quantity, r.sales.toFixed(2), r.profit.toFixed(2), r.margin.toFixed(1)]),
    )
    toast.success('已导出商品销售排行', { description: '商品销售排行_近30天_20261020.csv' })
  }

  return (
    <>
      <PageHeader
        title="经营报表"
        breadcrumbs={[{ label: '经营总览' }, { label: '经营报表' }]}
        description="按日 / 周 / 月查看门店经营数据，所有报表均标注统计区间与计算口径"
        actions={
          <>
            <Button variant="outline" className="h-9" onClick={() => toast.info('打印预览', { description: '演示版本未接入打印服务，可先导出 CSV 后打印' })}>
              <Printer data-icon="inline-start" />
              打印预览
            </Button>
            <Button className="h-9" onClick={exportReport}>
              <Download data-icon="inline-start" />
              导出报表
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="tablist" aria-label="统计区间" className="flex rounded-lg bg-muted p-0.5">
          {ranges.map((r) => (
            <button
              key={r.key}
              role="tab"
              type="button"
              aria-selected={range === r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'h-8 rounded-md px-3.5 text-[13px] transition-colors',
                range === r.key ? 'bg-background font-medium text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">统计区间：{rangeHint[range]}</span>
      </div>

      <StatCards items={stats} className="mb-4" />

      <div className="flex flex-col gap-3 md:gap-4">
        <SectionCard
          title="经营日报表"
          description={`${rangeHint[range]} · 共 ${rows.length} 天，按日期倒序`}
          icon={
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-primary">
              <FileBarChart className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
          }
          bodyClassName="p-0"
          actions={
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download data-icon="inline-start" />
              导出 CSV
            </Button>
          }
        >
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
            <div className="overflow-x-auto"><Table className="min-w-[820px] text-[13px]">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-muted/70 hover:bg-muted/70 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                  <TableHead className="pl-5">日期</TableHead>
                  <TableHead className="text-right">订单数</TableHead>
                  <TableHead className="text-right">销售额</TableHead>
                  <TableHead className="text-right">毛利额</TableHead>
                  <TableHead className="text-right">客单价</TableHead>
                  <TableHead className="pr-5 text-right">毛利率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => {
                  const ticket = d.orders ? d.sales / d.orders : 0
                  const m = d.sales ? (d.profit / d.sales) * 100 : 0
                  return (
                    <TableRow key={d.date} className="[&_td]:py-2.5">
                      <TableCell className="pl-5 font-medium text-foreground tabular-nums">{d.date}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.orders}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(d.sales, 0)}</TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(d.profit, 0)}</TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(ticket)}</TableCell>
                      <TableCell className={cn('pr-5 text-right tabular-nums', m >= 24 ? 'text-success' : 'text-[oklch(0.5_0.12_60)]')}>{m.toFixed(1)}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <tfoot>
                <TableRow className="bg-muted/50 hover:bg-muted/50 [&_td]:py-2.5">
                  <TableCell className="pl-5 font-medium text-foreground">合计（{rows.length} 天）</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{totalOrders}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatMoney(totalSales, 0)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatMoney(totalProfit, 0)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatMoney(avgTicket)}</TableCell>
                  <TableCell className="pr-5 text-right font-medium tabular-nums">{margin.toFixed(1)}%</TableCell>
                </TableRow>
              </tfoot>
            </Table></div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <SectionCard
            title="商品销售排行"
            description="近 30 天 · 销量前 10 的商品"
            className="md:col-span-2"
            bodyClassName="p-0"
            actions={
              <Button variant="outline" size="sm" onClick={exportRank}>
                <Download data-icon="inline-start" />
                导出 CSV
              </Button>
            }
          >
            <div className="overflow-x-auto"><Table className="min-w-[760px] text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                  <TableHead className="w-12 pl-5 text-right">排名</TableHead>
                  <TableHead className="min-w-52">商品</TableHead>
                  <TableHead className="text-right">销量</TableHead>
                  <TableHead className="text-right">销售额</TableHead>
                  <TableHead className="text-right">毛利额</TableHead>
                  <TableHead className="pr-5 text-right">毛利率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSalesRank.map((r, i) => (
                  <TableRow key={r.productId} className="[&_td]:py-2.5">
                    <TableCell className="pl-5 text-right text-muted-foreground tabular-nums">{i + 1}</TableCell>
                    <TableCell>
                      <span className="block max-w-60 truncate font-medium text-foreground">{r.name}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <span className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (r.sales / topSales) * 100)}%` }} />
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {r.category} · {r.brand}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.quantity)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatMoney(r.sales, 0)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(r.profit, 0)}</TableCell>
                    <TableCell className={cn('pr-5 text-right tabular-nums', r.margin >= 35 ? 'text-success' : '')}>{r.margin.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
            <p className="border-t border-border px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
              演示数据：销量为演示值，销售额与毛利额按商品库中的定价计算；本表仅统计销量前 10 的商品，合计销售额 {formatMoney(rankTotal, 0)}，不代表门店全部销售构成。
            </p>
          </SectionCard>

          <SectionCard title="分类销售构成" description="今日各分类销售额（元）" bodyClassName="p-0">
            <div className="overflow-x-auto"><Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                  <TableHead className="pl-4">分类</TableHead>
                  <TableHead className="text-right">销售额</TableHead>
                  <TableHead className="pr-4 text-right">占比</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySales.map((c) => {
                  const total = categorySales.reduce((s, x) => s + x.sales, 0)
                  return (
                    <TableRow key={c.category} className="[&_td]:py-2.5">
                      <TableCell className="pl-4">{c.category}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(c.sales, 0)}</TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">{((c.sales / total) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table></div>
            <p className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
              口径：占比＝分类销售额 ÷ 当日总销售额；该表为今日数据，不随上方统计区间变化。
            </p>
          </SectionCard>
        </div>

        <p className="rounded-xl border border-border bg-card px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">
          报表口径说明：销售额为折扣后实收金额、不含退款；毛利额＝销售额－商品进货成本；订单数按门店 POS 流水统计。
          全部数据来自本地演示数据集（销售流水 2026-07-23 起），未接入真实收银系统。
        </p>
      </div>
    </>
  )
}
