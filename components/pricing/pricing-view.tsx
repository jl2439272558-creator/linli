'use client'

import { useMemo, useState } from 'react'
import { History, Percent, RotateCcw, Search, Tag, Tags, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { ProductThumb } from '@/components/common/product-thumb'
import { SectionCard } from '@/components/common/section-card'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import type { Product } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { PricingAdjustDialog } from './pricing-adjust-dialog'

const ALL = 'all'

/** 平均毛利率：仅统计零售价与进货价齐全的商品 */
function avgMargin(items: Product[]) {
  const valid = items.filter((p) => p.retailPrice !== null && p.retailPrice > 0 && p.purchasePrice !== null)
  if (!valid.length) return null
  return valid.reduce((s, p) => s + ((p.retailPrice! - p.purchasePrice!) / p.retailPrice!) * 100, 0) / valid.length
}

export function PricingView() {
  const { products, categoryList, supplierList, priceLogs } = useDemoStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)
  const [supplier, setSupplier] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<string[]>([])
  const [adjustIds, setAdjustIds] = useState<string[] | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.barcode ?? '').includes(q)) return false
      if (category !== ALL && p.category !== category) return false
      if (supplier !== ALL && p.supplier !== supplier) return false
      return true
    })
  }, [products, query, category, supplier])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)
  const rowIds = rows.map((p) => p.id)
  const allChecked = rowIds.length > 0 && rowIds.every((id) => selected.includes(id))
  const someChecked = rowIds.some((id) => selected.includes(id))
  const hasFilter = !!query || category !== ALL || supplier !== ALL

  const margin = avgMargin(products)
  const lowMarginCount = products.filter((p) => {
    if (p.retailPrice === null || p.retailPrice <= 0 || p.purchasePrice === null) return false
    return ((p.retailPrice - p.purchasePrice) / p.retailPrice) * 100 < 20
  }).length

  const reset = () => {
    setQuery('')
    setCategory(ALL)
    setSupplier(ALL)
    setPage(1)
  }

  const stats: StatItem[] = [
    { label: '在售商品', value: `${products.filter((p) => p.status === '在售').length} 个`, icon: Tags, tone: 'bg-brand-soft text-primary' },
    { label: '平均毛利率', value: margin === null ? '—' : `${margin.toFixed(1)}%`, icon: Percent, tone: 'bg-success-soft text-success' },
    { label: '毛利率低于 20%', value: `${lowMarginCount} 个`, icon: TriangleAlert, tone: 'bg-warning-soft text-warning', hint: '建议复核进货价与售价' },
    { label: '调价记录', value: `${priceLogs.length} 次`, icon: History, tone: 'bg-info-soft text-info' },
  ]

  return (
    <>
      <PageHeader
        title="价格管理"
        breadcrumbs={[{ label: '商品中心' }, { label: '价格管理' }]}
        description="查看商品进货价、零售价与毛利率，支持单品与批量调价，调价记录留痕"
        actions={
          <Button className="h-9" disabled={!selected.length} onClick={() => setAdjustIds(selected)}>
            <Tag data-icon="inline-start" />
            批量调价{selected.length > 0 ? `（${selected.length}）` : ''}
          </Button>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="价格列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="搜索商品名称或条码"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索商品名称 / 条码"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <FilterSelect label="分类" value={category} onChange={(v) => { setCategory(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...categoryList.map((c) => ({ value: c, label: c }))]} />
          <FilterSelect label="供应商" value={supplier} onChange={(v) => { setSupplier(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...supplierList.map((s) => ({ value: s.name, label: s.name }))]} className="w-48" />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-brand-soft/50 px-4 py-2.5 text-[13px] md:px-5">
            <span>
              {'已选择 '}
              <span className="font-semibold text-primary tabular-nums">{selected.length}</span>
              {' 个商品'}
            </span>
            <div className="h-4 w-px bg-border" aria-hidden="true" />
            <Button variant="ghost" size="sm" onClick={() => setAdjustIds(selected)}>
              <Tag data-icon="inline-start" />
              批量调价
            </Button>
            <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelected([])}>
              取消选择
            </button>
          </div>
        )}

        <div className="overflow-x-auto"><Table className="min-w-[1080px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="w-10 pl-5">
                <Checkbox
                  aria-label="全选当前页"
                  checked={allChecked}
                  indeterminate={!allChecked && someChecked}
                  onCheckedChange={(c) => setSelected((s) => (c ? Array.from(new Set([...s, ...rowIds])) : s.filter((id) => !rowIds.includes(id))))}
                />
              </TableHead>
              <TableHead className="min-w-52">商品信息</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead className="text-right">进货价</TableHead>
              <TableHead className="text-right">零售价</TableHead>
              <TableHead className="text-right">会员价</TableHead>
              <TableHead className="text-right">最低售价</TableHead>
              <TableHead className="text-right">毛利率</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的商品</p>
                  <p className="mt-1 text-xs text-muted-foreground">请调整搜索关键词或筛选条件</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                    清除筛选
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => {
                const checked = selected.includes(p.id)
                const m = p.retailPrice !== null && p.retailPrice > 0 && p.purchasePrice !== null ? ((p.retailPrice - p.purchasePrice) / p.retailPrice) * 100 : null
                return (
                  <TableRow key={p.id} data-state={checked ? 'selected' : undefined} className="[&_td]:py-2.5">
                    <TableCell className="pl-5">
                      <Checkbox
                        aria-label={`选择 ${p.name}`}
                        checked={checked}
                        onCheckedChange={(c) => setSelected((s) => (c ? [...s, p.id] : s.filter((id) => id !== p.id)))}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductThumb src={p.image} alt={p.name} size={44} />
                        <span className="min-w-0">
                          <span className="block max-w-52 truncate font-medium text-foreground">{p.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{p.spec ?? '—'}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.category}</TableCell>
                    <TableCell className="max-w-36 truncate text-muted-foreground">{p.supplier}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(p.purchasePrice)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatMoney(p.retailPrice)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(p.memberPrice)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(p.minPrice)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${m !== null && m < 20 ? 'font-medium text-[oklch(0.5_0.12_60)]' : 'text-muted-foreground'}`}>
                      {m === null ? '—' : `${m.toFixed(1)}%`}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setAdjustIds([p.id])}>
                          <Tag data-icon="inline-start" />
                          调价
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table></div>

        <TablePagination
          total={filtered.length}
          page={current}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
          }}
          pageSizes={[10, 20, 50]}
        />
      </section>

      <SectionCard title="调价记录" description="每次人工确认调价后自动留痕" className="mt-4" bodyClassName="p-0">
        <div className="overflow-x-auto"><Table className="min-w-[860px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">记录号</TableHead>
              <TableHead>调价时间</TableHead>
              <TableHead>调价字段</TableHead>
              <TableHead>调价方式</TableHead>
              <TableHead>范围</TableHead>
              <TableHead className="text-right">影响商品数</TableHead>
              <TableHead className="pr-5">操作员</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceLogs.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-sm text-foreground">暂无调价记录</p>
                  <p className="mt-1 text-xs text-muted-foreground">在上方列表勾选商品并点击「批量调价」</p>
                </TableCell>
              </TableRow>
            ) : (
              priceLogs.map((log) => (
                <TableRow key={log.id} className="[&_td]:py-2.5">
                  <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{log.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{log.createdAt}</TableCell>
                  <TableCell className="font-medium text-foreground">{log.field}</TableCell>
                  <TableCell className="text-muted-foreground">{log.mode}</TableCell>
                  <TableCell className="text-muted-foreground">{log.scope}</TableCell>
                  <TableCell className="text-right tabular-nums">{log.affected}</TableCell>
                  <TableCell className="pr-5 text-muted-foreground">{log.operator}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>
      </SectionCard>

      <PricingAdjustDialog ids={adjustIds} onOpenChange={(open) => !open && setAdjustIds(null)} onDone={() => setSelected([])} />
    </>
  )
}
