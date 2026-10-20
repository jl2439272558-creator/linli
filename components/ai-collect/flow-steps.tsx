import { Check, ClipboardCheck, Database, Layers, Sparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: '选择来源', desc: '美团资料 / 链接 / 图片文件', icon: Layers },
  { title: '采集资料', desc: '读取商品名称、图片、规格', icon: Database },
  { title: 'AI 识别整理', desc: '品牌、分类、规格结构化', icon: Sparkles },
  { title: '审核入库', desc: '人工确认后写入商品库', icon: ClipboardCheck },
]

/** current: 0-based index of the step in progress; steps before it are complete */
export function FlowSteps({ current }: { current: number }) {
  return (
    <ol aria-label="采集流程" className="grid grid-cols-4 rounded-xl border border-border bg-card px-6 py-4">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        const Icon = s.icon
        return (
          <li key={s.title} aria-current={active ? 'step' : undefined} className="relative flex items-center gap-3">
            <span
              className={cn(
                'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-sm transition-colors',
                done && 'border-primary bg-primary text-primary-foreground',
                active && 'border-ai bg-ai-soft text-ai ring-4 ring-ai/10',
                !done && !active && 'border-border bg-muted text-muted-foreground',
              )}
            >
              {done ? <Check className="size-4" strokeWidth={2.25} aria-hidden="true" /> : <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className={cn('text-xs tabular-nums', active ? 'text-ai' : 'text-muted-foreground')}>{`0${i + 1}`}</span>
                <span className={cn('text-sm font-medium', done || active ? 'text-foreground' : 'text-muted-foreground')}>{s.title}</span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{s.desc}</span>
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className={cn('mx-4 h-px min-w-6 flex-1', done ? 'bg-primary' : 'bg-border')} />
            )}
            <span className="sr-only">{done ? '已完成' : active ? '进行中' : '未开始'}</span>
          </li>
        )
      })}
    </ol>
  )
}
