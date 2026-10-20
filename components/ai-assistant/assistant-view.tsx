'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { AlertTriangle, ArrowUpRight, Bot, CircleHelp, Database, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/page-header'
import { SectionCard } from '@/components/common/section-card'
import { useDemoStore } from '@/components/providers/demo-store'
import { assistantInsufficient, assistantTopics, type AssistantTopic } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Message = { id: string; role: 'user'; text: string } | { id: string; role: 'ai'; topic: AssistantTopic }

const fallback: AssistantTopic = {
  id: 'fallback',
  title: '未匹配到分析主题',
  hint: '',
  question: '',
  summary: '当前演示版本仅覆盖经营总览、销售分析、库存补货、滞销商品、商品定价与采购建议 6 类问题，请从左侧主题中选择，或换个说法再问一次。',
  table: {
    caption: '当前可回答的分析主题',
    columns: ['主题', '示例问题'],
    rows: assistantTopics.map((t) => [t.title, t.question]),
  },
  basis: '数据来源：门店演示数据集',
  note: '未匹配的问题不做推断，也不生成经营结论。',
  actions: [],
}

function resolve(question: string): AssistantTopic {
  const q = question.trim()
  if (!q) return fallback
  const has = (...keys: string[]) => keys.some((k) => q.includes(k))
  if (has('季度', '历史', '去年的', '上个月')) return assistantInsufficient
  if (has('补货', '补什么', '缺货')) return assistantTopics.find((t) => t.id === 'restock') ?? fallback
  if (has('滞销', '卖不动', '销售慢', '库存高')) return assistantTopics.find((t) => t.id === 'slow') ?? fallback
  if (has('定价', '价格', '毛利', '调价')) return assistantTopics.find((t) => t.id === 'pricing') ?? fallback
  if (has('采购', '进货', '供应商')) return assistantTopics.find((t) => t.id === 'purchase') ?? fallback
  if (has('饮料', '卖得', '卖得比较快', '畅销', '销售')) return assistantTopics.find((t) => t.id === 'sales') ?? fallback
  if (has('今天', '经营', '营业额', '销售额')) return assistantTopics.find((t) => t.id === 'today') ?? fallback
  return fallback
}

let seq = 0
const nextId = () => `m${(seq += 1)}`

export function AssistantView() {
  const { products, reviewItems } = useDemoStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const alerts = products.filter((p) => p.stock <= 0 || p.stock < p.safetyStock).length
  const pendingReview = reviewItems.filter((r) => r.status === '待审核' || r.status === '需补充').length

  const ask = (question: string) => {
    const q = question.trim()
    if (!q) return
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: q }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const topic = resolve(q)
      setActiveTopic(topic.id)
      setMessages((prev) => [...prev, { id: nextId(), role: 'ai', topic }])
      setThinking(false)
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end' }))
    }, 700)
  }

  return (
    <>
      <PageHeader
        title="AI 经营助手"
        breadcrumbs={[{ label: 'AI 助手' }, { label: 'AI 经营助手' }]}
        description="基于门店经营数据回答问题，结论附带数据来源与统计口径"
      />

      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col gap-4">
          <SectionCard
            title="快捷分析主题"
            description="点击即可提问"
            icon={
              <span className="flex size-8 items-center justify-center rounded-lg bg-ai-soft text-ai">
                <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
            }
            bodyClassName="p-3"
          >
            <ul className="flex flex-col gap-1">
              {assistantTopics.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => ask(t.question)}
                    aria-current={activeTopic === t.id ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                      activeTopic === t.id ? 'bg-ai-soft/70' : 'hover:bg-muted',
                    )}
                  >
                    <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', activeTopic === t.id ? 'bg-ai' : 'bg-muted-foreground/40')} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className={cn('block text-[13px] font-medium', activeTopic === t.id ? 'text-ai' : 'text-foreground')}>{t.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{t.hint}</span>
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => ask(assistantInsufficient.question)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-foreground">数据不足示例</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">门店数据不足时的回答方式</span>
                  </span>
                </button>
              </li>
            </ul>
          </SectionCard>

          <SectionCard title="当前门店数据" description="助手回答问题时的数据基础" bodyClassName="flex flex-col gap-2.5">
            <Row label="在售商品" value={`${products.filter((p) => p.status === '在售').length} 个`} />
            <Row label="库存预警商品" value={`${alerts} 个`} />
            <Row label="待审核识别结果" value={`${pendingReview} 个`} />
            <Row label="销售流水区间" value="2026-10-07 起" />
          </SectionCard>
        </div>

        <div className="col-span-3 flex flex-col rounded-xl border border-border bg-card">
          <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-ai-soft text-ai">
                <Bot className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">经营分析对话</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">回答以数据与结论为主，不虚构经营依据</p>
              </div>
            </div>
            <StatusPill />
          </header>

          <div className="flex max-h-[520px] min-h-[420px] flex-1 flex-col gap-4 overflow-y-auto p-5 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-ai-soft text-ai">
                  <Sparkles className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <p className="text-sm text-foreground">可以问我门店经营数据相关的问题</p>
                <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                  例如「最近哪些饮料卖得比较快」「哪些商品应该补货」「哪些商品库存高但销售慢」。
                  回答会附带数据来源、统计区间与计算口径；数据不足时会明确提示，不虚构结论。
                </p>
                <div className="mt-1 flex flex-wrap justify-center gap-2">
                  {assistantTopics.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => ask(t.question)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ai/40 hover:text-ai"
                    >
                      {t.question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="flex max-w-[520px] items-start gap-2.5">
                      <p className="rounded-xl rounded-tr-sm bg-muted px-3.5 py-2.5 text-[13px] text-foreground">{m.text}</p>
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="size-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <AnswerCard key={m.id} topic={m.topic} />
                ),
              )
            )}
            {thinking && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded-full bg-ai-soft text-ai">
                  <Bot className="size-3.5" aria-hidden="true" />
                </span>
                正在汇总门店经营数据并核对统计口径…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border px-5 py-4">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                ask(input)
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="用自然语言提问，例如：哪些商品应该补货？"
                aria-label="提问"
                className="h-10 flex-1"
              />
              <Button type="submit" className="h-10" disabled={thinking || !input.trim()}>
                <Send data-icon="inline-start" />
                发送
              </Button>
            </form>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-px size-3.5 shrink-0 text-primary" aria-hidden="true" />
              助手只做分析与建议，不会自动修改价格、创建采购单或调整库存；涉及实际业务变更时，需在对应模块由人工确认后执行。
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function StatusPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
      <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
      仅分析建议 · 不直接改动业务数据
    </span>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  )
}

function AnswerCard({ topic }: { topic: AssistantTopic }) {
  const insufficient = !!topic.insufficient
  return (
    <article className="flex gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-ai-soft text-ai">
        <Sparkles className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 rounded-xl border border-border bg-background p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[13px] font-semibold text-foreground">{topic.title}</h3>
          <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]', insufficient ? 'bg-warning-soft text-[oklch(0.5_0.12_60)]' : 'bg-ai-soft text-ai')}>
            {insufficient ? <AlertTriangle className="size-3" aria-hidden="true" /> : <Database className="size-3" aria-hidden="true" />}
            {insufficient ? '数据不足' : '演示数据'}
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-foreground text-pretty">{topic.summary}</p>

        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">{topic.table.caption}</div>
          <table className="w-full text-[13px]">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                {topic.table.columns.map((c, i) => (
                  <th key={c} className={cn('px-3 py-2 font-medium', (topic.table.alignRight ?? []).includes(i) ? 'text-right' : 'text-left')}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topic.table.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'px-3 py-2',
                        ci === 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
                        (topic.table.alignRight ?? []).includes(ci) ? 'text-right tabular-nums' : 'text-left',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col gap-1 text-[11px] leading-relaxed text-muted-foreground">
          <span className="flex items-start gap-1.5">
            <Database className="mt-px size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            {topic.basis}
          </span>
          <span className="flex items-start gap-1.5">
            <CircleHelp className="mt-px size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            {topic.note}
          </span>
        </div>

        {topic.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {topic.actions.map((a) =>
              a.href ? (
                <Button key={a.label} variant="outline" className="h-8" render={<Link href={a.href} />} nativeButton={false}>
                  {a.label}
                  <ArrowUpRight data-icon="inline-end" />
                </Button>
              ) : (
                <Button key={a.label} variant="outline" className="h-8" onClick={() => toast.info(a.label, { description: '演示交互：需人工确认后执行' })}>
                  {a.label}
                </Button>
              ),
            )}
          </div>
        )}
      </div>
    </article>
  )
}
