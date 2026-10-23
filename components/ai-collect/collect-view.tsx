'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, CircleHelp, ClipboardCheck, Loader2, Play, RefreshCw, ScanLine, Sparkles, Store as StoreIcon, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/common/page-header'
import { SectionCard } from '@/components/common/section-card'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge, type Tone } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { categories, stores, type TaskSource, type TaskStatus } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { FlowSteps } from './flow-steps'
import { SourceCards, type Material, type SourceKey } from './source-cards'

const statusTone: Record<TaskStatus, Tone> = {
  等待处理: 'neutral',
  识别中: 'info',
  待审核: 'ai',
  已入库: 'success',
  处理失败: 'danger',
}

const sourceLabels: Record<SourceKey, TaskSource> = {
  meituan: '美团商品资料',
  link: '商品链接导入',
  file: '图片识别',
}

function stageText(progress: number) {
  if (progress < 45) return '正在解析商品资料'
  if (progress < 80) return '正在整理品牌与分类字段'
  if (progress < 100) return '正在生成审核清单'
  return '识别完成，等待审核'
}

export function CollectView() {
  const { tasks, addTask, updateTask, reviewItems, storeId, setStoreId } = useDemoStore()
  const [selected, setSelected] = useState<SourceKey | null>(null)
  const [materials, setMaterials] = useState<Partial<Record<SourceKey, Material>>>({})

  const [targetStore, setTargetStore] = useState(storeId)
  const [defaultCategory, setDefaultCategory] = useState(categories[0])
  const [priceStrategy, setPriceStrategy] = useState('ai')
  const [imageProcess, setImageProcess] = useState('crop')
  const [recognizeSpec, setRecognizeSpec] = useState(true)
  const [recognizeBrand, setRecognizeBrand] = useState(true)
  const [recognizeBarcode, setRecognizeBarcode] = useState(false)
  const [starting, setStarting] = useState(false)

  const [page, setPage] = useState(1)
  const material = selected ? materials[selected] : undefined
  const pendingReview = reviewItems.filter((r) => r.status === '待审核' || r.status === '需补充').length
  const identified = tasks.reduce((sum, t) => sum + t.success, 0)
  const totalItems = tasks.reduce((sum, t) => sum + t.total, 0)
  const successRate = totalItems ? Math.round((identified / totalItems) * 100) : 0
  const todayCount = tasks.filter((t) => t.createdAt.startsWith('2026-10-20')).length

  const pageSize = 5
  const pages = Math.max(1, Math.ceil(tasks.length / pageSize))
  const current = Math.min(page, pages)
  const rows = tasks.slice((current - 1) * pageSize, current * pageSize)

  const start = () => {
    if (!selected || !material) {
      toast.info('请先选择采集来源', { description: '准备资料后即可开始 AI 识别' })
      return
    }
    const files = material.files ?? []
    const hasImage = files.some((f) => /\.(png|jpe?g|webp|heic)$/i.test(f))
    const hasCsv = files.some((f) => /\.csv$/i.test(f))
    const source: TaskSource = selected === 'file' ? (hasImage ? '图片识别' : hasCsv ? 'CSV 导入' : 'Excel 导入') : sourceLabels[selected]
    setStarting(true)
    const task = addTask({
      source,
      sourceDetail: material.label,
      total: material.count,
      success: 0,
      pending: 0,
      status: '等待处理',
      progress: 0,
    })
    setTimeout(() => {
      updateTask(task.id, { status: '识别中', progress: 8 })
      setStarting(false)
    }, 900)
    toast.success('识别任务已创建', { description: `${task.id} · 共 ${material.count} 项资料，识别过程中可离开本页` })
    setPage(1)
  }

  const stats: StatItem[] = [
    { label: '识别成功率', value: `${successRate}%`, icon: Sparkles, tone: 'bg-ai-soft text-ai' },
    { label: '待审核商品', value: `${pendingReview} 个`, icon: ClipboardCheck, tone: 'bg-warning-soft text-warning' },
    { label: '本次任务数量', value: `${todayCount} 个`, icon: ScanLine, tone: 'bg-brand-soft text-primary' },
  ]

  return (
    <>
      <PageHeader
        title="AI 商品采集"
        breadcrumbs={[{ label: '商品中心' }, { label: 'AI 商品采集' }]}
        description="从商品资料到标准商品档案，让商品录入更高效。"
        actions={
          <>
            <Button variant="outline" className="h-9" render={<Link href="/products" />} nativeButton={false}>
              返回商品管理
            </Button>
            <Button variant="outline" className="h-9 border-ai/30 text-ai hover:bg-ai-soft hover:text-ai" render={<Link href="/ai-review" />} nativeButton={false}>
              <ClipboardCheck data-icon="inline-start" />
              进入识别结果审核{pendingReview > 0 ? `（${pendingReview}）` : ''}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <FlowSteps current={material ? 2 : selected ? 1 : 0} />

        <section aria-label="采集来源">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">选择采集来源</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">选择一种来源并准备资料，AI 将提取商品名称、品牌、规格与分类</p>
            </div>
            <span className="text-xs text-muted-foreground">当前选中：{selected ? sourceLabels[selected] : '未选择'}</span>
          </div>
          <SourceCards
            selected={selected}
            onSelect={setSelected}
            materials={materials}
            onMaterial={(k, m) => setMaterials((prev) => ({ ...prev, [k]: m ?? undefined }))}
          />
        </section>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <SectionCard
            title="AI 识别操作区"
            description="设置本次识别的目标门店与字段范围"
            className="md:col-span-2"
            icon={
              <span className="flex size-8 items-center justify-center rounded-lg bg-ai-soft text-ai">
                <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
              <ConfigField label="目标门店">
                <Select
                  items={stores.map((s) => ({ value: s.id, label: s.name }))}
                  value={targetStore}
                  onValueChange={(v) => {
                    if (!v) return
                    setTargetStore(v as string)
                    setStoreId(v as string)
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <StoreIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ConfigField>
              <ConfigField label="默认商品分类">
                <Select items={categories.map((c) => ({ value: c, label: c }))} value={defaultCategory} onValueChange={(v) => v && setDefaultCategory(v as string)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ConfigField>
              <ConfigField label="默认价格策略" hint="AI 建议价仅作参考，需人工确认">
                <Select
                  items={[
                    { value: 'ai', label: '生成 AI 建议价（参考同类区间）' },
                    { value: 'source', label: '沿用来源参考价' },
                    { value: 'none', label: '不生成价格，审核时人工填写' },
                  ]}
                  value={priceStrategy}
                  onValueChange={(v) => v && setPriceStrategy(v as string)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">生成 AI 建议价（参考同类区间）</SelectItem>
                    <SelectItem value="source">沿用来源参考价</SelectItem>
                    <SelectItem value="none">不生成价格，审核时人工填写</SelectItem>
                  </SelectContent>
                </Select>
              </ConfigField>
              <ConfigField label="图片处理方式" hint="来源图片须在授权范围内使用">
                <Select
                  items={[
                    { value: 'crop', label: '自动裁白边并选主图' },
                    { value: 'keep', label: '保留原图，审核时人工选择' },
                    { value: 'none', label: '不处理图片' },
                  ]}
                  value={imageProcess}
                  onValueChange={(v) => v && setImageProcess(v as string)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crop">自动裁白边并选主图</SelectItem>
                    <SelectItem value="keep">保留原图，审核时人工选择</SelectItem>
                    <SelectItem value="none">不处理图片</SelectItem>
                  </SelectContent>
                </Select>
              </ConfigField>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ToggleRow label="识别商品规格" hint="从包装文字提取净含量" checked={recognizeSpec} onChange={setRecognizeSpec} />
              <ToggleRow label="识别品牌" hint="匹配品牌库中的品牌名" checked={recognizeBrand} onChange={setRecognizeBrand} />
              <ToggleRow label="尝试识别条码" hint="仅读取资料中真实存在的条码" checked={recognizeBarcode} onChange={setRecognizeBarcode} />
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-ai-soft/60 px-3.5 py-3 text-xs text-muted-foreground">
              <CircleHelp className="mt-px size-3.5 shrink-0 text-ai" aria-hidden="true" />
              <span>
                识别结果中，来自资料原文的字段标记为「来源数据」，AI 推断的字段标记为「AI 推断」，无法确认的字段标记为「待确认」。
                系统不会自动编造商品条码、规格与价格，所有结果均需人工审核后入库。
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button className="h-9" disabled={starting} onClick={start}>
                {starting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Play data-icon="inline-start" />}
                {starting ? '任务创建中…' : '开始识别'}
              </Button>
              <span className="text-xs text-muted-foreground">
                {material ? `已准备：${material.label} · ${material.count} 项` : '尚未准备资料，请先在上方选择来源'}
              </span>
            </div>
          </SectionCard>

          <SectionCard title="任务状态说明" description="共 5 种状态" bodyClassName="flex flex-col gap-2.5">
            {(
              [
                ['等待处理', '任务已创建，等待开始识别'],
                ['识别中', 'AI 正在提取与整理字段，可离开本页'],
                ['待审核', '识别完成，需人工确认后入库'],
                ['已入库', '审核通过并已写入商品库'],
                ['处理失败', '资料格式或授权问题导致失败，可重新处理'],
              ] as [TaskStatus, string][]
            ).map(([status, desc]) => (
              <div key={status} className="flex items-center gap-3">
                <StatusBadge tone={statusTone[status]} pulse={status === '识别中'}>
                  {status}
                </StatusBadge>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </SectionCard>
        </div>

        <StatCards items={stats} columns={3} />

        <section aria-label="采集任务列表" className="rounded-xl border border-border bg-card">
          <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-5 py-3">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">采集任务</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">共 {tasks.length} 个任务 · 识别中的任务进度实时更新</p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => toast.info('已刷新任务状态', { description: '演示数据：状态由本地定时器推进' })}>
              <RefreshCw data-icon="inline-start" />
              刷新
            </Button>
          </header>

          <div className="overflow-x-auto"><Table className="min-w-[1080px] text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                <TableHead className="pl-5">任务编号</TableHead>
                <TableHead>采集来源</TableHead>
                <TableHead className="text-right">商品数量</TableHead>
                <TableHead className="text-right">识别成功</TableHead>
                <TableHead className="text-right">待审核</TableHead>
                <TableHead className="min-w-40">任务状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="pr-5 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id} className="[&_td]:py-2.5">
                  <TableCell className="pl-5">
                    <span className="font-mono text-xs text-foreground">{t.id}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{t.operator}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground">{t.source}</span>
                    <span className="mt-0.5 block max-w-56 truncate text-xs text-muted-foreground">{t.sourceDetail}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{t.total}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', t.success > 0 ? 'text-success' : 'text-muted-foreground')}>{t.success}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', t.pending > 0 ? 'text-ai' : 'text-muted-foreground')}>
                    {t.status === '待审核' ? t.pending : 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <StatusBadge tone={statusTone[t.status]} pulse={t.status === '识别中'}>
                        {t.status}
                      </StatusBadge>
                      {t.status === '识别中' && (
                        <Progress value={t.progress} className="w-36 flex-col gap-1">
                          <ProgressTrack className="h-1.5">
                            <ProgressIndicator className="bg-ai" />
                          </ProgressTrack>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {t.progress}% · {stageText(t.progress)}
                          </span>
                        </Progress>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{t.createdAt}</TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-0.5">
                      {(t.status === '待审核' || t.status === '已入库') && (
                        <Button variant="ghost" size="sm" className="text-ai hover:text-ai" render={<Link href={`/ai-review?task=${t.id}`} />} nativeButton={false}>
                          <ArrowRight data-icon="inline-start" />
                          {t.status === '待审核' ? '继续审核' : '查看结果'}
                        </Button>
                      )}
                      {t.status === '处理失败' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => {
                            updateTask(t.id, { status: '识别中', progress: 6 })
                            toast.success('已重新提交处理', { description: `${t.id} · 演示数据将重新执行识别` })
                          }}
                        >
                          <RefreshCw data-icon="inline-start" />
                          重新处理
                        </Button>
                      )}
                      {t.status === '等待处理' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => {
                            updateTask(t.id, { status: '识别中', progress: 8 })
                            toast.success('已开始识别', { description: t.id })
                          }}
                        >
                          <Play data-icon="inline-start" />
                          开始处理
                        </Button>
                      )}
                      {t.status === '已入库' && (
                        <Button variant="ghost" size="sm" className="text-primary" render={<Link href="/products" />} nativeButton={false}>
                          查看商品
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
          <TablePagination total={tasks.length} page={current} pageSize={pageSize} onPageChange={setPage} />

          <div className="flex items-start gap-2.5 border-t border-border px-5 py-3.5 text-xs text-muted-foreground">
            <TriangleAlert className="mt-px size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <span>
              演示说明：本页任务与状态均由本地演示数据生成，不连接美团或任何外部接口；识别结果仅用于展示审核流程。
            </span>
          </div>
        </section>
      </div>
    </>
  )
}

function ConfigField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3.5 py-3">
      <Switch checked={checked} onCheckedChange={(v) => onChange(!!v)} aria-label={label} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span>
      </span>
    </label>
  )
}
