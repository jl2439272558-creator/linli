'use client'

import Link from 'next/link'
import { ClipboardCheck, FileBarChart, PackagePlus, ScanLine, ShoppingCart, Truck, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/common/section-card'
import { useDemoStore } from '@/components/providers/demo-store'
import { cn } from '@/lib/utils'

type Action = { label: string; desc: string; icon: LucideIcon; href?: string; onClick?: () => void; ai?: boolean; badge?: number }

export function QuickActions() {
  const { reviewItems } = useDemoStore()
  const pendingReview = reviewItems.filter((r) => r.status === '待审核' || r.status === '需补充').length

  const actions: Action[] = [
    { label: '新增商品', desc: '手动录入商品', icon: PackagePlus, href: '/products?action=new' },
    { label: 'AI 商品采集', desc: '图片 / 文件识别', icon: ScanLine, href: '/ai-collect', ai: true },
    { label: '审核识别结果', desc: '确认后导入商品库', icon: ClipboardCheck, href: '/ai-review', ai: true, badge: pendingReview },
    { label: '入库登记', desc: '扫码快速入库', icon: Truck, onClick: () => toast.info('入库管理', { description: '该模块将在第二阶段开放，当前为 UI 演示' }) },
    { label: '采购下单', desc: '按预警生成采购单', icon: ShoppingCart, onClick: () => toast.info('采购管理', { description: '该模块将在第二阶段开放，当前为 UI 演示' }) },
    { label: '经营报表', desc: '日 / 周 / 月报', icon: FileBarChart, href: '/reports' },
  ]

  return (
    <SectionCard title="快捷操作" description="常用业务入口">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon
          const inner = (
            <>
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  a.ai ? 'bg-ai-soft text-ai' : 'bg-brand-soft text-primary',
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                  {a.label}
                  {!!a.badge && (
                    <span className="rounded-full bg-ai px-1.5 text-[10px] leading-4 font-semibold text-ai-foreground tabular-nums">{a.badge}</span>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">{a.desc}</span>
              </span>
            </>
          )
          const cls =
            'flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/40'
          return a.href ? (
            <Link key={a.label} href={a.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={a.label} type="button" onClick={a.onClick} className={cls}>
              {inner}
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}
