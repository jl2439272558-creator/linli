'use client'

import { useMemo, useState } from 'react'
import { Award, Loader2, MoreHorizontal, Pencil, Percent, Plus, RotateCcw, Search, Tags, Trash2, TrendingUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/common/page-header'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { productSalesRank } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'

type Editing = { mode: 'add' } | { mode: 'rename'; name: string }

/** 平均毛利率：仅统计零售价与进货价齐全的商品 */
function marginOf(products: { retailPrice: number | null; purchasePrice: number | null }[]) {
  const valid = products.filter((p) => p.retailPrice !== null && p.retailPrice > 0 && p.purchasePrice !== null)
  if (!valid.length) return null
  const avg = valid.reduce((s, p) => s + ((p.retailPrice! - p.purchasePrice!) / p.retailPrice!) * 100, 0) / valid.length
  return `${avg.toFixed(1)}%`
}

export function BrandsView() {
  const { brandList, products, deleteBrand } = useDemoStore()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [editing, setEditing] = useState<Editing | null>(null)

  /** 近 30 天销售额按 productId 映射到当前品牌（品牌重命名后仍挂到新名下） */
  const salesByProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of productSalesRank) map.set(r.productId, r.sales)
    return map
  }, [])

  const rows = useMemo(() => {
    const list = brandList.map((name) => {
      const items = products.filter((p) => p.brand === name)
      const sales = items.reduce((s, p) => s + (salesByProduct.get(p.id) ?? 0), 0)
      return { name, count: items.length, sales, margin: marginOf(items) }
    })
    const q = query.trim().toLowerCase()
    return list.filter((r) => !q || r.name.toLowerCase().includes(q)).sort((a, b) => b.sales - a.sales)
  }, [brandList, products, query, salesByProduct])

  const totalSales = rows.reduce((s, r) => s + r.sales, 0)
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize)

  const usedCount = useMemo(() => new Set(products.map((p) => p.brand)).size, [products])
  const topBrand = rows.length ? rows.reduce((a, b) => (b.sales > a.sales ? b : a), rows[0]) : null
  const overallMargin = marginOf(products)

  const remove = (name: string) => {
    const count = products.filter((p) => p.brand === name).length
    if (count > 0) {
      toast.info(`无法删除「${name}」`, { description: `该品牌下仍有 ${count} 个商品，请先在商品管理中调整这些商品的品牌` })
      return
    }
    deleteBrand(name)
    toast.success(`已删除品牌「${name}」`)
  }

  const statItems: StatItem[] = [
    { label: '品牌总数', value: `${brandList.length} 个`, icon: Award, tone: 'bg-brand-soft text-primary' },
    { label: '使用中品牌', value: `${usedCount} 个`, icon: Tags, tone: 'bg-success-soft text-success', hint: '商品档案中实际引用' },
    {
      label: '销售额第一',
      value: topBrand && topBrand.sales > 0 ? topBrand.name : '—',
      icon: TrendingUp,
      tone: 'bg-info-soft text-info',
      hint: topBrand && topBrand.sales > 0 ? `近 30 天销售额 ${formatMoney(topBrand.sales, 0)}` : '暂无销售数据',
    },
    { label: '平均毛利率', value: overallMargin ?? '—', icon: Percent, tone: 'bg-warning-soft text-warning' },
  ]

  return (
    <>
      <PageHeader
        title="品牌管理"
        breadcrumbs={[{ label: '商品中心' }, { label: '品牌管理' }]}
        description="维护商品品牌，销售额按近 30 天销售流水归集"
        actions={
          <Button className="h-9" onClick={() => setEditing({ mode: 'add' })}>
            <Plus data-icon="inline-start" />
            新增品牌
          </Button>
        }
      />

      <StatCards items={statItems} className="mb-4" />

      <section aria-label="品牌列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="搜索品牌名称"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索品牌名称"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={() => { setQuery(''); setPage(1) }} disabled={!query}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[860px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5 min-w-44">品牌名称</TableHead>
              <TableHead className="text-right">商品数</TableHead>
              <TableHead className="text-right">近 30 天销售额</TableHead>
              <TableHead className="text-right">销售占比</TableHead>
              <TableHead className="text-right">平均毛利率</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的品牌</p>
                  <p className="mt-1 text-xs text-muted-foreground">请调整搜索关键词</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { setQuery(''); setPage(1) }}>
                    清除搜索
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.name} className="[&_td]:py-2.5">
                  <TableCell className="pl-5">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{row.name}</span>
                      {row.count === 0 && (
                        <StatusBadge tone="neutral" dot={false}>
                          未使用
                        </StatusBadge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.sales > 0 ? formatMoney(row.sales) : '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {row.sales > 0 && totalSales > 0 ? `${((row.sales / totalSales) * 100).toFixed(1)}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{row.margin ?? '—'}</TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${row.name} 更多操作`} />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => setEditing({ mode: 'rename', name: row.name })}>
                            <Pencil data-icon="inline-start" />
                            重命名
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => remove(row.name)}>
                            <Trash2 data-icon="inline-start" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
          }}
        />
      </section>

      <BrandDialog editing={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  )
}

function BrandDialog({ editing, onOpenChange }: { editing: Editing | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!editing} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        {editing && <BrandForm key={editing.mode === 'rename' ? `rename-${editing.name}` : 'add'} editing={editing} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function BrandForm({ editing, onDone }: { editing: Editing; onDone: () => void }) {
  const { brandList, addBrand, renameBrand } = useDemoStore()
  const isRename = editing.mode === 'rename'
  const [name, setName] = useState(isRename ? editing.name : '')
  const [saving, setSaving] = useState(false)

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.info('请输入品牌名称')
      return
    }
    if (isRename && trimmed === editing.name) {
      onDone()
      return
    }
    if (brandList.includes(trimmed)) {
      toast.info(`品牌「${trimmed}」已存在`, { description: '请换一个名称' })
      return
    }
    setSaving(true)
    setTimeout(() => {
      if (isRename) {
        renameBrand(editing.name, trimmed)
        toast.success(`已将「${editing.name}」重命名为「${trimmed}」`, { description: '该品牌下商品的品牌信息已同步更新' })
      } else {
        addBrand(trimmed)
        toast.success(`已新增品牌「${trimmed}」`)
      }
      setSaving(false)
      onDone()
    }, 400)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isRename ? '重命名品牌' : '新增品牌'}</DialogTitle>
        <DialogDescription>{isRename ? `重命名「${editing.name}」，该品牌下的商品将同步更新` : '新增的品牌会出现在商品档案的品牌选项中'}</DialogDescription>
      </DialogHeader>

      <div className="mt-5">
        <Label className="mb-1.5 text-xs font-normal text-muted-foreground">品牌名称</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9"
          placeholder="如：农夫山泉"
          maxLength={20}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" className="h-9" onClick={onDone}>
          取消
        </Button>
        <Button className="h-9" disabled={saving} onClick={submit}>
          {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {isRename ? '保存' : '新增'}
        </Button>
      </DialogFooter>
    </>
  )
}
