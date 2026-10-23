'use client'

import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { SectionCard } from '@/components/common/section-card'
import { salesDaily } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const config = {
  sales: { label: '销售额', color: 'var(--chart-1)' },
  profit: { label: '毛利额', color: 'var(--chart-3)' },
} satisfies ChartConfig

type Mode = 'day' | 'week' | 'month'
type Point = { label: string; sales: number; profit: number }

const modes: { key: Mode; label: string; days: number; hint: string }[] = [
  { key: 'day', label: '按日', days: 14, hint: '近 14 天' },
  { key: 'week', label: '按周', days: 56, hint: '近 8 周' },
  { key: 'month', label: '按月', days: 90, hint: '近 3 个月' },
]

/** 按日直接取数；按周按 7 天分桶（从最新一天往前推）；按月按自然月汇总 */
function aggregate(mode: Mode, days: number): Point[] {
  const rows = salesDaily.slice(-days)
  if (mode === 'day') return rows.map((d) => ({ label: d.date, sales: d.sales, profit: d.profit }))
  if (mode === 'week') {
    const out: Point[] = []
    for (let end = rows.length; end > 0; end -= 7) {
      const chunk = rows.slice(Math.max(0, end - 7), end)
      if (!chunk.length) break
      out.unshift({
        label: `${chunk[0].date}~${chunk[chunk.length - 1].date}`,
        sales: chunk.reduce((s, d) => s + d.sales, 0),
        profit: chunk.reduce((s, d) => s + d.profit, 0),
      })
    }
    return out
  }
  const byMonth = new Map<string, Point>()
  for (const d of rows) {
    const month = `2026-${d.date.slice(0, 2)}`
    const cur = byMonth.get(month) ?? { label: month, sales: 0, profit: 0 }
    cur.sales += d.sales
    cur.profit += d.profit
    byMonth.set(month, cur)
  }
  return Array.from(byMonth.values())
}

export function SalesTrendChart() {
  const [mode, setMode] = useState<Mode>('day')
  const active = modes.find((m) => m.key === mode) ?? modes[0]
  const data = useMemo(() => aggregate(mode, active.days), [mode, active.days])

  const total = data.reduce((s, d) => s + d.sales, 0)
  const profit = data.reduce((s, d) => s + d.profit, 0)
  const margin = total ? (profit / total) * 100 : 0

  return (
    <SectionCard
      title="销售趋势"
      description={`${active.hint}门店销售额与毛利额（折线）`}
      className="md:col-span-2"
      actions={
        <div role="tablist" aria-label="统计维度" className="flex rounded-lg bg-muted p-0.5">
          {modes.map((m) => (
            <button
              key={m.key}
              role="tab"
              type="button"
              aria-selected={mode === m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                'h-7 rounded-md px-3 text-xs transition-colors',
                mode === m.key ? 'bg-background font-medium text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-3 md:gap-x-8">
        <div>
          <p className="text-xs text-muted-foreground">{`累计销售额（${active.hint}）`}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatMoney(total, 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">累计毛利额</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatMoney(profit, 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">毛利率</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{margin.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{mode === 'day' ? '日均销售额' : mode === 'week' ? '周均销售额' : '月均销售额'}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatMoney(total / Math.max(1, data.length), 0)}</p>
        </div>
      </div>
      <ChartContainer config={config} className="aspect-auto h-[248px] w-full">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            minTickGap={mode === 'month' ? 0 : 16}
          />
          <YAxis tickLine={false} axisLine={false} width={48} fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <ChartTooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent indicator="line" />} />
          <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          <Line dataKey="profit" type="monotone" stroke="var(--color-profit)" strokeWidth={2} dot={false} strokeDasharray="4 3" activeDot={{ r: 3 }} />
          <ChartLegend content={<ChartLegendContent />} />
        </LineChart>
      </ChartContainer>
      <p className="mt-3 text-[11px] text-muted-foreground/80">
        统计口径：销售额含折扣后实收金额、不含退款；毛利额＝销售额－商品进货成本。演示数据，按日期区间自动汇总。
      </p>
    </SectionCard>
  )
}
