'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bot, CircleCheck, CircleX, Download, ListChecks, RotateCcw, ScanSearch, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { SectionCard } from '@/components/common/section-card'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge, type Tone } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { aiAnalysisLogs, type TaskStatus } from '@/lib/mock-data'

const ALL = 'all'

const statusTone: Record<TaskStatus, Tone> = {
  等待处理: 'neutral',
  识别中: 'info',
  待审核: 'ai',
  已入库: 'success',
  处理失败: 'danger',
}

const sourceOptions = [
  { value: ALL, label: '全部' },
  { value: '美团商品资料', label: '美团商品资料' },
  { value: '商品链接导入', label: '商品链接导入' },
  { value: '图片识别', label: '图片识别' },
  { value: 'Excel 导入', label: 'Excel 导入' },
  { value: 'CSV 导入', label: 'CSV 导入' },
]

export function AiTasksView() {
  const { tasks } = useDemoStore()
  const [query, setQuery] = useState('')
  const [source, setSource] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter((t) => {
      if (q && !t.id.toLowerCase().includes(q) && !t.sourceDetail.toLowerCase().includes(q)) return false
      if (source !== ALL && t.source !== source) return false
      if (status !== ALL && t.status !== status) return false
      return true
    })
  }, [tasks, query, source, status])

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = !!query || source !== ALL || status !== ALL

  const totalItems = tasks.reduce((s, t) => s + t.total, 0)
  const totalSuccess = tasks.reduce((s, t) => s + t.success, 0)
  const pendingCount = tasks.reduce((s, t) => s + t.pending, 0)
  const failCount = tasks.filter((t) => t.status === '处理失败').length
  const successRate = totalItems ? ((totalSuccess / totalItems) * 100).toFixed(1) : '0.0'

  const reset = () => {
    setQuery('')
    setSource(ALL)
    setStatus(ALL)
    setPage(1)
  }

  const stats: StatItem[] = [
    { label: '任务总数', value: `${tasks.length} 个`, icon: ListChecks, tone: 'bg-brand-soft text-primary' },
    { label: '识别成功率', value: `${successRate}%`, icon: CircleCheck, tone: 'bg-success-soft text-success', hint: `成功 ${totalSuccess} / ${totalItems} 件` },
    { label: '待审核商品', value: `${pendingCount} 件`, icon: ScanSearch, tone: 'bg-ai-soft text-ai' },
    { label: '处理失败', value: `${failCount} 个`, icon: CircleX, tone: 'bg-danger-soft text-danger' },
  ]

  return (
    <>
      <PageHeader
        title="AI 任务记录"
        breadcrumbs={[{ label: 'AI 助手' }, { label: 'AI 任务记录' }]}
        description="商品采集与识别任务的历史记录，待审核任务可前往识别结果审核"
        actions={
          <Button
            variant="outline"
            className="h-9"
            onClick={() => toast.success(`已导出 ${rows.length} 条任务记录`, { description: 'AI任务记录_20261020.xlsx（演示文件，未实际下载）' })}
          >
            <Download data-icon="inline-start" />
            导出记录
          </Button>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="任务列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="搜索任务号或来源详情"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索任务号 / 来源详情"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <FilterSelect label="来源" value={source} onChange={(v) => { setSource(v); setPage(1) }} options={sourceOptions} className="w-44" />
          <FilterSelect
            label="状态"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
            options={[{ value: ALL, label: '全部' }, ...(Object.keys(statusTone) as TaskStatus[]).map((s) => ({ value: s, label: s }))]}
            className="w-36"
          />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[1080px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">任务号</TableHead>
              <TableHead>来源</TableHead>
              <TableHead className="min-w-44">来源详情</TableHead>
              <TableHead className="text-right">商品总数</TableHead>
              <TableHead className="text-right">识别成功</TableHead>
              <TableHead className="min-w-32">进度</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作员</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的任务</p>
                  <p className="mt-1 text-xs text-muted-foreground">请调整搜索关键词或筛选条件</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                    清除筛选
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((t) => (
                <TableRow key={t.id} className="[&_td]:py-2.5">
                  <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                  <TableCell className="text-muted-foreground">{t.source}</TableCell>
                  <TableCell>
                    <span className="block max-w-56 truncate text-muted-foreground">{t.sourceDetail}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{t.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.success}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={t.progress} className="h-1.5 w-20" aria-label={`进度 ${t.progress}%`} />
                      <span className="text-xs text-muted-foreground tabular-nums">{t.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={statusTone[t.status]} pulse={t.status === '识别中'}>
                      {t.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{t.createdAt}</TableCell>
                  <TableCell className="text-muted-foreground">{t.operator}</TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end">
                      {t.status === '待审核' ? (
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" render={<Link href="/ai-review" />} nativeButton={false}>
                          前往审核
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>

        <TablePagination
          total={rows.length}
          page={current}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(v) => {
            setPageSize(v)
            setPage(1)
          }}
        />
      </section>

      <SectionCard
        title="AI 经营分析记录"
        description="AI 经营助手的问答结论留痕，含数据来源与统计区间"
        className="mt-4"
        bodyClassName="p-0"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-ai-soft text-ai">
            <Bot className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
        }
      >
        <div className="overflow-x-auto"><Table className="min-w-[960px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">记录号</TableHead>
              <TableHead className="min-w-44">提问</TableHead>
              <TableHead className="min-w-64">结论摘要</TableHead>
              <TableHead>数据依据</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="pr-5">操作员</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aiAnalysisLogs.map((log) => (
              <TableRow key={log.id} className="[&_td]:py-2.5">
                <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{log.id}</TableCell>
                <TableCell>
                  <span className="block max-w-56 truncate font-medium text-foreground">{log.question}</span>
                </TableCell>
                <TableCell>
                  <span className="block max-w-72 truncate text-muted-foreground">{log.conclusion}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.basis}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{log.createdAt}</TableCell>
                <TableCell className="pr-5 text-muted-foreground">{log.operator}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </SectionCard>
    </>
  )
}
