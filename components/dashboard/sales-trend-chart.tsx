'use client'

import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { SectionCard } from '@/components/common/section-card'
import { salesTrend } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const config = {
  sales: { label: '销售额', color: 'var(--chart-1)' },
  profit: { label: '毛利额', color: 'var(--chart-3)' },
} satisfies ChartConfig

const ranges = [
  { key: 7, label: '近 7 天' },
  { key: 14, label: '近 14 天' },
] as const

export function SalesTrendChart() {
  const [range, setRange] = useState<7 | 14>(14)
  const data = salesTrend.slice(-range)
  const total = data.reduce((s, d) => s + d.sales, 0)
  const profit = data.reduce((s, d) => s + d.profit, 0)

  return (
    <SectionCard
      title="销售趋势"
      description="按日统计门店销售额与毛利额"
      className="col-span-2"
      actions={
        <div role="tablist" aria-label="时间范围" className="flex rounded-lg bg-muted p-0.5">
          {ranges.map((r) => (
            <button
              key={r.key}
              role="tab"
              type="button"
              aria-selected={range === r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'h-7 rounded-md px-3 text-xs transition-colors',
                range === r.key ? 'bg-background font-medium text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-4 flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground">累计销售额</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatMoney(total, 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">累计毛利额</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatMoney(profit, 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">日均销售额</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatMoney(total / data.length, 0)}</p>
        </div>
      </div>
      <ChartContainer config={config} className="aspect-auto h-[248px] w-full">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-sales)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-sales)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} width={48} fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} fill="url(#fillSales)" />
          <Area dataKey="profit" type="monotone" stroke="var(--color-profit)" strokeWidth={2} fill="transparent" strokeDasharray="4 3" />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </SectionCard>
  )
}
