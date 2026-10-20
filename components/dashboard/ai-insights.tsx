'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/common/section-card'
import { StatusBadge, type Tone } from '@/components/common/status-badge'
import { aiInsights } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const levelTone: Record<string, Tone> = { 补货: 'danger', 定价: 'info', 滞销: 'warning' }

export function AiInsights() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState('今天 09:30')

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      const d = new Date()
      setUpdatedAt(`今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
      toast.success('经营建议已更新', { description: '基于本地演示数据重新计算' })
    }, 1200)
  }

  const handle = (id: string, action: string) => {
    if (id === 'i3') router.push('/products?category=日用百货')
    else toast.info(action, { description: '演示交互：该功能将在后续阶段接入' })
  }

  return (
    <SectionCard
      title="AI 经营建议"
      description={`更新于 ${updatedAt}`}
      icon={
        <span className="flex size-8 items-center justify-center rounded-lg bg-ai-soft text-ai">
          <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
      }
      actions={
        <Button variant="ghost" size="icon-sm" aria-label="刷新建议" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
        </Button>
      }
      bodyClassName="flex flex-col gap-3"
    >
      {aiInsights.map((i) => (
        <article key={i.id} className={cn('rounded-lg border border-border p-3 transition-opacity', refreshing && 'opacity-50')}>
          <div className="flex items-center gap-2">
            <StatusBadge tone={levelTone[i.level]} dot={false} className="h-5 px-1.5 text-[11px]">
              {i.level}
            </StatusBadge>
            <h3 className="truncate text-[13px] font-medium text-foreground">{i.title}</h3>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{i.detail}</p>
          <button type="button" onClick={() => handle(i.id, i.action)} className="mt-2 text-xs font-medium text-primary hover:underline">
            {i.action}
          </button>
        </article>
      ))}
      <p className="text-[11px] leading-relaxed text-muted-foreground/80">
        建议由规则与演示数据生成，仅供参考；当前版本未接入真实大模型。
      </p>
    </SectionCard>
  )
}
