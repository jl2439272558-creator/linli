'use client'

import { Bar, BarChart, XAxis, YAxis, LabelList } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { SectionCard } from '@/components/common/section-card'
import { categorySales } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'

const config = {
  sales: { label: '销售额', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function CategoryChart() {
  const total = categorySales.reduce((s, c) => s + c.sales, 0)
  const top = categorySales[0]

  return (
    <SectionCard title="商品分类销售" description="今日各分类销售额（元）">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs text-muted-foreground">
          {'销售额最高：'}
          <span className="font-medium text-foreground">{top.category}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {'占比 '}
          <span className="font-medium text-foreground tabular-nums">{((top.sales / total) * 100).toFixed(1)}%</span>
        </p>
      </div>
      <ChartContainer config={config} className="aspect-auto h-[272px] w-full">
        <BarChart data={categorySales} layout="vertical" margin={{ left: 0, right: 48, top: 0, bottom: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide />
          <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={64} fontSize={12} />
          <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent hideIndicator />} />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={4} barSize={18}>
            <LabelList
              dataKey="sales"
              position="right"
              offset={8}
              className="fill-muted-foreground"
              fontSize={11}
              formatter={(v) => formatMoney(Number(v), 0)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </SectionCard>
  )
}
