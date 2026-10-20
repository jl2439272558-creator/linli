'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Boxes, Download, MoreHorizontal, PackagePlus, PackageX, RotateCcw, Search, SlidersHorizontal, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { ProductThumb } from '@/components/common/product-thumb'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { categories, getStockStatus, lastInboundAt, stores, type Product, type StockAdjustType } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { stockTone } from '@/components/products/stock-tone'
import { StockAdjustDialog } from './stock-adjust-dialog'

const ALL = 'all'
const stockOptions = [
  { value: ALL, label: '全部' },
  { value: '正常', label: '正常' },
  { value: '库存偏低', label: '库存偏低' },
  { value: '缺货', label: '缺货' },
]

export function InventoryView() {
  const { products, stockInRecords, storeId, setStoreId } = useDemoStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)
  const [stock, setStock] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [target, setTarget] = useState<{ product: Product; type?: StockAdjustType } | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const status = getStockStatus(p)
      if (q && !p.name.toLowerCase().includes(q) && !(p.barcode ?? '').includes(q)) return false
      if (category !== ALL && p.category !== category) return false
      if (stock !== ALL && status !== stock) return false
      return true
    })
  }, [products, query, category, stock])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = !!query || category !== ALL || stock !== ALL

  const totalStock = products.reduce((s, p) => s + p.stock, 0)
  const lowCount = products.filter((p) => getStockStatus(p) === '库存偏低').length
  const outCount = products.filter((p) => getStockStatus(p) === '缺货').length
  const totalValue = products.reduce((s, p) => s + p.stock * (p.purchasePrice ?? 0), 0)

  const reset = () => {
    setQuery('')
    setCategory(ALL)
    setStock(ALL)
    setPage(1)
  }

  const stats: { label: string; value: string; icon: LucideIcon; tone: string }[] = [
    { label: '商品总库存数', value: `${totalStock.toLocaleString('zh-CN')} 件`, icon: Boxes, tone: 'bg-brand-soft text-primary' },
    { label: '低库存商品数', value: `${lowCount} 个`, icon: TriangleAlert, tone: 'bg-warning-soft text-warning' },
    { label: '缺货商品数', value: `${outCount} 个`, icon: PackageX, tone: 'bg-danger-soft text-danger' },
    { label: '库存预警数量', value: `${lowCount + outCount} 个`, icon: TriangleAlert, tone: 'bg-info-soft text-info' },
  ]

  return (
    <>
      <PageHeader
        title="库存管理"
        breadcrumbs={[{ label: '库存采购' }, { label: '库存管理' }]}
        description={`当前门店：${stores.find((s) => s.id === storeId)?.name ?? ''} · 库存金额 ${formatMoney(totalValue, 0)}`}
        actions={
          <>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => toast.success(`已导出 ${filtered.length} 条库存数据`, { description: '库存清单_20261020.xlsx（演示文件，未实际下载）' })}
            >
              <Download data-icon="inline-start" />
              导出数据
            </Button>
            <Button className="h-9" render={<Link href="/stock-in" />} nativeButton={false}>
              <PackagePlus data-icon="inline-start" />
              入库登记
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5">
              <span className={cn('flex size-10 items-center justify-center rounded-lg', s.tone)}>
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs text-muted-foreground">{s.label}</span>
                <span className="mt-0.5 block text-xl font-semibold tabular-nums">{s.value}</span>
              </span>
            </div>
          )
        })}
      </div>

      <section aria-label="库存列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative w-64">
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
          <FilterSelect label="分类" value={category} onChange={(v) => { setCategory(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...categories.map((c) => ({ value: c, label: c }))]} />
          <FilterSelect label="库存状态" value={stock} onChange={(v) => { setStock(v); setPage(1) }} options={stockOptions} />
          <FilterSelect
            label="所属门店"
            value={storeId}
            onChange={(v) => {
              setStoreId(v)
              toast.info(`已切换至「${stores.find((s) => s.id === v)?.name}」`, { description: '演示数据：各门店共用同一套库存记录' })
            }}
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
            className="w-44"
          />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <Table className="min-w-[1140px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5 min-w-56">商品信息</TableHead>
              <TableHead>条码</TableHead>
              <TableHead className="text-right">当前库存</TableHead>
              <TableHead className="text-right">安全库存</TableHead>
              <TableHead className="text-right">进货价</TableHead>
              <TableHead className="text-right">库存金额</TableHead>
              <TableHead>最近入库时间</TableHead>
              <TableHead>库存状态</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的商品</p>
                  <p className="mt-1 text-xs text-muted-foreground">请调整搜索关键词或筛选条件</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                    清除筛选
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => {
                const status = getStockStatus(p)
                const inbound = lastInboundAt(stockInRecords, p.id)
                return (
                  <TableRow key={p.id} className="[&_td]:py-2.5">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={p.image} alt={p.name} size={44} />
                        <span className="min-w-0">
                          <span className="block max-w-52 truncate font-medium text-foreground">{p.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {p.category} · {p.brand} · {p.spec ?? '—'}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.barcode ?? '—'}</TableCell>
                    <TableCell className={cn('text-right font-medium tabular-nums', status === '缺货' ? 'text-danger' : status === '库存偏低' ? 'text-[oklch(0.5_0.12_60)]' : '')}>
                      {p.stock}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">{p.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {p.safetyStock}
                      <span className="ml-0.5 text-xs">{p.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(p.purchasePrice)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(p.stock * (p.purchasePrice ?? 0))}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{inbound ?? '暂无入库记录'}</TableCell>
                    <TableCell>
                      <StatusBadge tone={stockTone[status]}>{status}</StatusBadge>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setTarget({ product: p })}>
                          <SlidersHorizontal data-icon="inline-start" />
                          库存调整
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${p.name} 更多操作`} />}>
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => toast.info('入库登记', { description: '请在入库管理中选择采购单或扫码入库' })} render={<Link href="/stock-in" />}>
                              入库登记
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTarget({ product: p, type: '出库' })}>出库</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTarget({ product: p, type: '报损' })}>报损</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTarget({ product: p, type: '盘盈亏' })}>库存盘点</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

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

      <StockAdjustDialog product={target?.product ?? null} presetType={target?.type} onOpenChange={(o) => !o && setTarget(null)} />
    </>
  )
}
