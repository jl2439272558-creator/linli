'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, CircleHelp, ClipboardCheck, ImagePlus, Loader2, RefreshCw, SkipForward, Sparkles, Store, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/common/page-header'
import { ProductThumb } from '@/components/common/product-thumb'
import { SectionCard } from '@/components/common/section-card'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge, type Tone } from '@/components/common/status-badge'
import { useDemoStore } from '@/components/providers/demo-store'
import { categories, suppliers, type FieldOrigin, type ReviewItem, type ReviewStatus } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { pickAndUploadImage } from '@/lib/upload'
import { cn } from '@/lib/utils'

const originMeta: Record<FieldOrigin, { label: string; tone: Tone; dot: string; hint: string }> = {
  source: { label: '来源数据', tone: 'success', dot: 'bg-success', hint: '资料原文中直接读取' },
  ai: { label: 'AI 推断', tone: 'ai', dot: 'bg-ai', hint: '由大模型推断，需人工确认' },
  pending: { label: '待确认', tone: 'warning', dot: 'bg-warning', hint: '资料中未能确认，需人工填写' },
  manual: { label: '人工确认', tone: 'brand', dot: 'bg-primary', hint: '已由人工修改并确认' },
}

const reviewTone: Record<ReviewStatus, Tone> = {
  待审核: 'ai',
  需补充: 'warning',
  已确认: 'success',
  识别中: 'info',
  已入库: 'neutral',
}

const filters: { key: 'pending' | 'all' | 'done'; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'all', label: '全部' },
  { key: 'done', label: '已入库' },
]

type FieldKey = 'name' | 'brand' | 'spec' | 'category' | 'barcode' | 'refPrice' | 'suggestedPrice'

type Row = { key: FieldKey; label: string; value: string | null; raw: string; origin: FieldOrigin; note?: string; money?: boolean }

function rows(item: ReviewItem): Row[] {
  const price = (f: typeof item.refPrice) => (f.value === null ? '' : String(f.value))
  const text = (f: { value: string | null }) => f.value ?? ''
  return [
    { key: 'name', label: '商品名称', value: item.name.value, raw: text(item.name), origin: item.name.origin, note: item.name.note },
    { key: 'brand', label: '品牌', value: item.brand.value, raw: text(item.brand), origin: item.brand.origin, note: item.brand.note },
    { key: 'spec', label: '规格', value: item.spec.value, raw: text(item.spec), origin: item.spec.origin, note: item.spec.note },
    { key: 'category', label: '商品分类', value: item.category.value, raw: text(item.category), origin: item.category.origin, note: item.category.note },
    { key: 'barcode', label: '商品条码', value: item.barcode.value, raw: text(item.barcode), origin: item.barcode.origin, note: item.barcode.note },
    { key: 'refPrice', label: '参考价格', value: item.refPrice.value === null ? null : formatMoney(item.refPrice.value), raw: price(item.refPrice), origin: item.refPrice.origin, note: item.refPrice.note, money: true },
    { key: 'suggestedPrice', label: '建议零售价', value: item.suggestedPrice.value === null ? null : formatMoney(item.suggestedPrice.value), raw: price(item.suggestedPrice), origin: item.suggestedPrice.origin, note: item.suggestedPrice.note, money: true },
  ]
}

export function ReviewView({ taskId }: { taskId?: string }) {
  const router = useRouter()
  const { reviewItems, updateReviewItem, addProduct, tasks } = useDemoStore()

  const [scope, setScope] = useState<'pending' | 'all' | 'done'>('pending')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [edit, setEdit] = useState<{ key: FieldKey; value: string } | null>(null)
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [reRunning, setReRunning] = useState(false)

  const list = useMemo(() => {
    const base = reviewItems.filter((r) => (taskId ? r.taskId === taskId : true))
    if (scope === 'pending') return base.filter((r) => r.status === '待审核' || r.status === '需补充')
    if (scope === 'done') return base.filter((r) => r.status === '已入库')
    return base
  }, [reviewItems, taskId, scope])

  const active = list.find((r) => r.id === activeId) ?? list[0] ?? null
  const task = taskId ? tasks.find((t) => t.id === taskId) : null
  const pending = reviewItems.filter((r) => r.status === '待审核' || r.status === '需补充')
  const scoped = taskId ? pending.filter((r) => r.taskId === taskId) : pending
  const importable = scoped.filter((r) => r.name.value && r.name.origin !== 'pending')

  // 候选主图：识别图 + 商品库中同品牌的商品图
  const candidates = useMemo(() => {
    if (!active) return []
    const sameBrand = reviewItems
      .filter((r) => r.brand.value && r.brand.value === active.brand.value && r.image)
      .map((r) => r.image as string)
    return Array.from(new Set([active.image, ...sameBrand].filter(Boolean) as string[])).slice(0, 4)
  }, [active, reviewItems])

  const openItem = (id: string) => {
    setActiveId(id)
    setEdit(null)
    setMainImage(null)
  }

  /** 真实上传替换主图：落盘后同步写入识别记录，入库时沿用该图 */
  const replaceImage = async () => {
    if (!active || uploading) return
    setUploading(true)
    try {
      const url = await pickAndUploadImage()
      if (url) {
        setMainImage(url)
        updateReviewItem(active.id, { image: url })
        toast.success('主图已替换', { description: '已写入识别记录，入库商品将使用该图' })
      }
    } catch (err) {
      toast.error('上传失败', { description: err instanceof Error ? err.message : String(err) })
    } finally {
      setUploading(false)
    }
  }

  const saveEdit = () => {
    if (!active || !edit) return
    const key = edit.key
    const raw = edit.value.trim()
    if (!raw) {
      toast.info('请输入内容后再保存', { description: '留空无法确认该字段' })
      return
    }
    const isPrice = key === 'refPrice' || key === 'suggestedPrice'
    const num = Number(raw)
    if (isPrice && (Number.isNaN(num) || num < 0)) {
      toast.info('请输入正确的金额', { description: '价格需为不小于 0 的数字' })
      return
    }
    if (key === 'barcode' && !/^\d{8,14}$/.test(raw)) {
      toast.info('条码格式不正确', { description: '条码应为 8–14 位数字；无法确认时请保持「待确认」' })
      return
    }
    const value = isPrice ? num : raw
    updateReviewItem(active.id, { [key]: { value, origin: 'manual', note: '人工填写并确认' } } as Partial<ReviewItem>)
    setEdit(null)
    toast.success(`已更新「${rows(active).find((r) => r.key === key)?.label}」`, { description: '标记为人工确认' })
  }

  const confirmCurrent = () => {
    if (!active) return
    if (rows(active).some((r) => r.origin === 'pending' && (r.key === 'name' || r.key === 'spec'))) {
      toast.info('仍有字段待确认', { description: '商品名称与规格需人工确认后才能标记为已确认' })
      return
    }
    updateReviewItem(active.id, { status: '已确认' })
    toast.success('本条已确认', { description: `${active.name.value ?? active.id} · 可继续导入商品库` })
  }

  const rerun = () => {
    if (!active) return
    setReRunning(true)
    updateReviewItem(active.id, { status: '识别中' })
    setTimeout(() => {
      setReRunning(false)
      updateReviewItem(active.id, { status: '待审核', confidence: Math.min(99, active.confidence + 2) })
      toast.success('已重新识别', { description: `${active.id} · 演示数据将重新提取字段` })
    }, 1400)
  }

  const importOne = (item: ReviewItem) => {
    addProduct({
      name: item.name.value ?? '未命名商品',
      image: mainImage ?? item.image,
      barcode: item.barcode.origin === 'pending' ? null : item.barcode.value,
      category: item.category.value ?? categories[0],
      brand: item.brand.value ?? '未设置',
      spec: item.spec.origin === 'pending' ? null : item.spec.value,
      unit: '件',
      purchasePrice: null,
      retailPrice: item.suggestedPrice.value ?? item.refPrice.value ?? null,
      memberPrice: null,
      minPrice: null,
      stock: 0,
      safetyStock: 10,
      supplier: suppliers[0],
      status: '在售',
      source: 'AI 采集',
    })
  }

  const importItems = (items: ReviewItem[]) => {
    const ok = items.filter((i) => i.name.value && i.name.origin !== 'pending')
    if (!ok.length) {
      toast.info('暂无可导入的商品', { description: '商品名称需先人工确认' })
      return
    }
    setImporting(true)
    setTimeout(() => {
      ok.forEach(importOne)
      ok.forEach((r) => updateReviewItem(r.id, { status: '已入库' }))
      setImporting(false)
      const blocked = items.length - ok.length
      if (active) {
        setActiveId(null)
        setMainImage(null)
      }
      toast.success(`已导入 ${ok.length} 个商品到商品库`, {
        description: blocked > 0 ? `另有 ${blocked} 个商品因字段待确认未导入` : '可在商品管理中继续完善价格与库存',
      })
    }, 900)
  }

  const stats: StatItem[] = [
    { label: '待审核', value: reviewItems.filter((r) => r.status === '待审核').length, icon: ClipboardCheck, tone: 'bg-ai-soft text-ai' },
    { label: '需补充', value: reviewItems.filter((r) => r.status === '需补充').length, icon: CircleHelp, tone: 'bg-warning-soft text-warning' },
    { label: '已确认', value: reviewItems.filter((r) => r.status === '已确认').length, icon: Check, tone: 'bg-success-soft text-success' },
    { label: '已入库', value: reviewItems.filter((r) => r.status === '已入库').length, icon: Store, tone: 'bg-brand-soft text-primary' },
  ]

  return (
    <>
      <PageHeader
        title="AI 识别结果审核"
        breadcrumbs={[{ label: '商品中心' }, { label: 'AI 商品采集', href: '/ai-collect' }, { label: '识别结果审核' }]}
        description={task ? `任务 ${task.id} · ${task.source} · 识别 ${task.total} 项资料` : '逐条核对 AI 识别结果，确认后写入商品库'}
        actions={
          <>
            <Button variant="outline" className="h-9" onClick={() => router.push('/ai-collect')}>
              <ArrowLeft data-icon="inline-start" />
              返回采集中心
            </Button>
            <Button className="h-9" disabled={importing || importable.length === 0} onClick={() => importItems(scoped)}>
              {importing ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ClipboardCheck data-icon="inline-start" />}
              批量确认并导入商品库{importable.length > 0 ? `（${importable.length}）` : ''}
            </Button>
          </>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <section aria-label="待审核商品" className="flex flex-col rounded-xl border border-border bg-card">
          <header className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold text-foreground">识别结果列表</h2>
            <div role="tablist" aria-label="筛选" className="flex rounded-lg bg-muted p-0.5">
              {filters.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  type="button"
                  aria-selected={scope === f.key}
                  onClick={() => {
                    setScope(f.key)
                    setActiveId(null)
                    setEdit(null)
                  }}
                  className={cn(
                    'h-7 rounded-md px-2.5 text-xs transition-colors',
                    scope === f.key ? 'bg-background font-medium text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </header>

          {list.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-muted-foreground">当前筛选下没有识别结果</p>
          ) : (
            <ul className="max-h-[560px] divide-y divide-border overflow-y-auto scrollbar-thin">
              {list.map((r) => {
                const isActive = active?.id === r.id
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => openItem(r.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                        isActive ? 'bg-brand-soft/60' : 'hover:bg-muted/50',
                      )}
                    >
                      <ProductThumb src={r.image} alt={r.name.value ?? r.id} size={48} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className={cn('truncate text-[13px] font-medium', r.name.origin === 'pending' ? 'text-[oklch(0.5_0.12_60)]' : 'text-foreground')}>
                            {r.name.value ?? '待确认'}
                          </span>
                          {r.name.origin === 'pending' && <span className="shrink-0 text-[11px] text-[oklch(0.5_0.12_60)]">待确认</span>}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {r.id} · {r.brand.value ?? '品牌待确认'} · {r.spec.origin === 'pending' ? '规格待确认' : r.spec.value ?? '—'}
                        </span>
                        <span className="mt-1.5 flex items-center gap-1.5">
                          <StatusBadge tone={reviewTone[r.status]} dot={r.status !== '识别中'} pulse={r.status === '识别中'} className="h-5 px-1.5 text-[11px]">
                            {r.status}
                          </StatusBadge>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] tabular-nums',
                              r.confidence >= 90 ? 'bg-success-soft text-success' : r.confidence >= 75 ? 'bg-ai-soft text-ai' : 'bg-warning-soft text-[oklch(0.5_0.12_60)]',
                            )}
                          >
                            置信度 {r.confidence}%
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="col-span-2">
          {!active ? (
            <SectionCard title="审核详情" description="从左侧列表选择一条识别结果开始核对">
              <p className="py-20 text-center text-sm text-muted-foreground">暂无可审核的识别结果</p>
            </SectionCard>
          ) : (
            <SectionCard
              title="审核详情"
              description={`${active.id} · 整体识别置信度 ${active.confidence}%`}
              icon={
                <span className="flex size-8 items-center justify-center rounded-lg bg-ai-soft text-ai">
                  <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
              }
              actions={
                <StatusBadge tone={reviewTone[active.status]} pulse={active.status === '识别中'}>{active.status}</StatusBadge>
              }
              bodyClassName="p-0"
            >
              <div className="border-b border-border p-5">
                <div className="flex gap-5">
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <ProductThumb src={mainImage ?? active.image} alt={active.name.value ?? active.id} size={132} />
                    <span className="text-[11px] text-muted-foreground">主图预览</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {candidates.length > 1 ? (
                        candidates.map((src, i) => (
                          <button
                            key={src}
                            type="button"
                            aria-label={`选择第 ${i + 1} 张候选图作为主图`}
                            onClick={() => {
                              setMainImage(src)
                              toast.success('已设置主图', { description: '保存后与商品一并入库' })
                            }}
                            className={cn(
                              'overflow-hidden rounded-md border p-0.5 transition-colors',
                              (mainImage ?? active.image) === src ? 'border-primary' : 'border-border hover:border-primary/40',
                            )}
                          >
                            <ProductThumb src={src} alt={`候选图 ${i + 1}`} size={56} className="border-0" />
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">当前仅识别到 1 张商品图片，可手动上传替换。</p>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" className="h-8" disabled={uploading} onClick={replaceImage}>
                        <ImagePlus data-icon="inline-start" />
                        替换主图
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 text-muted-foreground"
                        onClick={() => {
                          setMainImage(null)
                          toast.info('已恢复为识别原图')
                        }}
                      >
                        <X data-icon="inline-start" />
                        恢复原图
                      </Button>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                      图片使用须符合来源授权范围：来自美团商品资料的图片仅限本店商品使用，不得用于站外展示。
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 pt-5">
                <div className="mb-3 flex flex-wrap items-center gap-4">
                  <span className="text-[13px] font-medium text-foreground">字段核对</span>
                  <span className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {(Object.keys(originMeta) as FieldOrigin[]).map((k) => (
                      <span key={k} className="inline-flex items-center gap-1.5">
                        <span className={cn('size-1.5 rounded-full', originMeta[k].dot)} aria-hidden="true" />
                        {originMeta[k].label}
                      </span>
                    ))}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">来源资料：{active.sourceText}</span>
                </div>

                <div className="overflow-x-auto"><Table className="text-[13px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                      <TableHead>字段</TableHead>
                      <TableHead>识别结果</TableHead>
                      <TableHead className="w-32">信息来源</TableHead>
                      <TableHead className="w-28 text-right">置信度</TableHead>
                    </TableRow>
                  </TableHeader>
                    <TableBody>
                      {rows(active).map((r) => {
                        const meta = originMeta[r.origin]
                        const editing = edit?.key === r.key
                        return (
                          <TableRow key={r.key} className="[&_td]:py-3">
                            <TableCell className="text-muted-foreground">{r.label}</TableCell>
                            <TableCell>
                              {editing ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    autoFocus
                                    value={edit.value}
                                    onChange={(e) => setEdit({ key: r.key, value: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEdit()
                                      if (e.key === 'Escape') setEdit(null)
                                    }}
                                    inputMode={r.money ? 'decimal' : 'text'}
                                    className="h-8 max-w-56"
                                    aria-label={`填写${r.label}`}
                                  />
                                  <Button size="sm" className="h-8" onClick={saveEdit}>
                                    保存
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEdit(null)}>
                                    取消
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2">
                                  <span className={cn('font-medium', r.value ? 'text-foreground' : 'text-[oklch(0.5_0.12_60)]')}>
                                    {r.value ?? '待确认'}
                                  </span>
                                  {r.note && <span className="text-xs text-muted-foreground">{r.note}</span>}
                                  <button
                                    type="button"
                                    onClick={() => setEdit({ key: r.key, value: r.raw })}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {r.value ? '编辑' : '填写'}
                                  </button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden="true" />
                                {meta.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-xs tabular-nums">
                              {r.origin === 'ai' ? (
                                <span className="text-ai">{active.confidence}%</span>
                              ) : r.origin === 'pending' ? (
                                <span className="text-[oklch(0.5_0.12_60)]">待确认</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table></div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted/50 px-3.5 py-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                    来源数据：资料原文可直接读取
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-ai" aria-hidden="true" />
                    AI 推断：置信度显示为整体识别置信度，需人工核对
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
                    待确认：系统不会自动编造条码、规格与价格
                  </span>
                </div>
              </div>

              <div className="sticky bottom-14 mt-5 flex flex-wrap items-center gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm md:bottom-0 md:px-5 md:py-3.5">
                <p className="mr-auto text-xs text-muted-foreground">
                  入库后商品状态为「在售」，价格与库存可在商品管理中继续维护
                </p>
                <Button variant="ghost" className="h-9" disabled={reRunning} onClick={rerun}>
                  {reRunning ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
                  {reRunning ? '识别中…' : '重新识别'}
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 text-muted-foreground"
                  onClick={() => {
                    const idx = list.findIndex((r) => r.id === active.id)
                    const next = list[idx + 1] ?? list[0]
                    toast.info('已跳过本条', { description: '稍后可在「全部」筛选中继续审核' })
                    if (next && next.id !== active.id) openItem(next.id)
                  }}
                >
                  <SkipForward data-icon="inline-start" />
                  跳过
                </Button>
                <Button variant="outline" className="h-9" onClick={confirmCurrent}>
                  保存并确认
                </Button>
                <Button
                  variant="outline"
                  className="h-9 border-primary/40 text-primary hover:bg-brand-soft hover:text-primary"
                  disabled={importing}
                  onClick={() => importItems([active])}
                >
                  {importing ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ClipboardCheck data-icon="inline-start" />}
                  导入商品库
                </Button>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-card px-4 py-3.5 text-xs text-muted-foreground">
        <CircleHelp className="mt-px size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>
          审核结果仅基于采集到的资料与演示数据生成，不代表真实线上接口返回。若字段无法确认，请保持「待确认」并人工补充，系统不会自动填充条码、规格或价格。
          <Link href="/ai-collect" className="ml-1 text-primary hover:underline">
            返回 AI 商品采集
          </Link>
        </span>
      </p>
    </>
  )
}
