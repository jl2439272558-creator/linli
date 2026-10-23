'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatItem = {
  label: string
  value: string | number
  icon: LucideIcon
  /** 图标底色与文字色，如 'bg-brand-soft text-primary' */
  tone: string
  /** 传入后整卡变为可点击筛选入口 */
  onClick?: () => void
  /** 点击筛选的选中态 */
  active?: boolean
  hint?: string
}

/**
 * 统计指标卡行：工作台、商品、库存、采购、采集与审核页统一复用。
 * 视觉规范：卡片圆角 12px、图标 40px 圆角块、数值 20px 半粗、tabular-nums。
 */
export function StatCards({ items, columns = 4, className }: { items: StatItem[]; columns?: 3 | 4 | 5; className?: string }) {
  return (
    <section
      aria-label="统计指标"
      className={cn(
        'grid grid-cols-2 gap-3 md:gap-4',
        columns === 3 && 'md:grid-cols-3',
        columns === 4 && 'md:grid-cols-4',
        columns === 5 && 'md:grid-cols-5',
        className,
      )}
    >
      {items.map((s) => {
        const Icon = s.icon
        const inner = (
          <>
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg md:size-10', s.tone)}>
              <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs text-muted-foreground">{s.label}</span>
              <span className="mt-0.5 block text-lg font-semibold tabular-nums md:text-xl">{s.value}</span>
              {s.hint && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/80">{s.hint}</span>}
            </span>
          </>
        )
        const shell = 'flex items-center gap-3 rounded-xl border bg-card px-3 py-3 text-left transition-colors md:gap-3.5 md:px-4 md:py-3.5'
        return s.onClick ? (
          <button
            key={s.label}
            type="button"
            onClick={s.onClick}
            aria-pressed={s.active}
            className={cn(shell, 'hover:border-primary/40', s.active ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border')}
          >
            {inner}
          </button>
        ) : (
          <div key={s.label} className={cn(shell, 'border-border')}>
            {inner}
          </div>
        )
      })}
    </section>
  )
}
