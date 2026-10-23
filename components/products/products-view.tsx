'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Ban, Check, Download, Eye, FolderTree, MoreHorizontal, Package, PackagePlus, Pencil, RotateCcw, ScanLine, Search, Tag, Trash2, TriangleAlert, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/common/page-header'
import { FilterSelect } from '@/components/common/filter-select'
import { ProductThumb } from '@/components/common/product-thumb'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { brands, categories, getStockStatus, suppliers, type Product, type ProductStatus } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { downloadCsv, todaySuffix } from '@/lib/export-csv'
import { cn } from '@/lib/utils'
import { ProductDetailSheet } from './product-detail-sheet'
import { ImportDialog } from './import-dialog'
import { BulkEditDialog, type BulkMode } from './bulk-edit-dialog'
import { stockTone } from './stock-tone'

const ALL = 'all'
const stockOptions = [
  { value: ALL, label: '全部' },
  { value: '正常', label: '正常' },
  { value: '预警', label: '全部预警' },
  { value: '库存偏低', label: '库存偏低' },
  { value: '缺货', label: '缺货' },
]
const statusOptions = [
  { value: ALL, label: '全部' },
  { value: '在售', label: '在售' },
  { value: '停售', label: '停售' },
]

export function ProductsView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { products, updateProduct, deleteProducts, bulkUpdateProducts } = useDemoStore()

  const [query, setQuery] = useState(params.get('q') ?? '')
  const [category, setCategory] = useState(params.get('category') ?? ALL)
  const [brand, setBrand] = useState(ALL)
  const [supplier, setSupplier] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [stock, setStock] = useState(params.get('stock') ?? ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [selected, setSelected] = useState<string[]>([])
  const [viewing, setViewing] = useState<Product | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<BulkMode>(null)

  // 顶部全局搜索 / 工作台入口跳转时同步 URL 参数到筛选条件
  const paramKey = params.toString()
  const [prevKey, setPrevKey] = useState(paramKey)
  if (paramKey !== prevKey) {
    setPrevKey(paramKey)
    setQuery(params.get('q') ?? '')
    setCategory(params.get('category') ?? ALL)
    setStock(params.get('stock') ?? ALL)
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const stockStatus = getStockStatus(p)
      if (q && !p.name.toLowerCase().includes(q) && !(p.barcode ?? '').includes(q) && !p.id.toLowerCase().includes(q)) return false
      if (category !== ALL && p.category !== category) return false
      if (brand !== ALL && p.brand !== brand) return false
      if (supplier !== ALL && p.supplier !== supplier) return false
      if (status !== ALL && p.status !== status) return false
      if (stock === '预警' ? stockStatus === '正常' : stock !== ALL && stockStatus !== stock) return false
      return true
    })
  }, [products, query, category, brand, supplier, status, stock])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)
  const rowIds = rows.map((r) => r.id)
  const allChecked = rows.length > 0 && rowIds.every((id) => selected.includes(id))
  const someChecked = rowIds.some((id) => selected.includes(id))
  const hasFilter = !!query || category !== ALL || brand !== ALL || supplier !== ALL || status !== ALL || stock !== ALL

  const resetFilters = () => {
    setQuery('')
    setCategory(ALL)
    setBrand(ALL)
    setSupplier(ALL)
    setStatus(ALL)
    setStock(ALL)
    setPage(1)
    if (paramKey) router.replace(pathname)
  }

  const openNew = () => router.push('/products/new')
  const openEdit = (p: Product) => {
    setViewing(null)
    router.push(`/products/new?id=${p.id}`)
  }

  const remove = (ids: string[]) => {
    deleteProducts(ids)
    setSelected((s) => s.filter((id) => !ids.includes(id)))
    toast.success(`已删除 ${ids.length} 个商品`, { description: '删除已同步到商品库' })
  }

  const bulkSetStatus = (status: ProductStatus) => {
    bulkUpdateProducts(selected, { status })
    toast.success(`已将 ${selected.length} 个商品设为「${status}」`, {
      description: status === '停售' ? '停售商品不会出现在收银台，仍保留库存记录' : '已恢复在售状态',
    })
    setSelected([])
  }

  const exportProducts = (rows: Product[]) =>
    downloadCsv(
      `商品列表_${todaySuffix()}`,
      ['商品编号', '商品名称', '分类', '品牌', '规格', '条码', '进货价', '零售价', '会员价', '最低售价', '库存', '安全库存', '单位', '供应商', '状态', '来源', '更新时间'],
      rows.map((p) => [
        p.id,
        p.name,
        p.category,
        p.brand,
        p.spec ?? '',
        p.barcode ?? '',
        p.purchasePrice,
        p.retailPrice,
        p.memberPrice,
        p.minPrice,
        p.stock,
        p.safetyStock,
        p.unit,
        p.supplier,
        p.status,
        p.source,
        p.updatedAt,
      ]),
    )

  const stats: StatItem[] = [
    { label: '商品总数', value: products.length, icon: Package, tone: 'bg-brand-soft text-primary', onClick: resetFilters, active: !hasFilter },
    { label: '本月新增', value: products.filter((p) => p.updatedAt.startsWith('2026-10')).length, icon: PackagePlus, tone: 'bg-info-soft text-info', onClick: () => toast.info('本月新增', { description: '演示数据：本月录入的全部商品' }), active: false },
    { label: 'AI 采集商品', value: products.filter((p) => p.source === 'AI 采集').length, icon: ScanLine, tone: 'bg-ai-soft text-ai', onClick: () => router.push('/ai-collect'), active: false },
    { label: '库存预警', value: products.filter((p) => getStockStatus(p) !== '正常').length, icon: TriangleAlert, tone: 'bg-warning-soft text-warning', onClick: () => { setStock('预警'); setPage(1) }, active: stock === '预警' },
  ]

  return (
    <>
      <PageHeader
        title="商品管理"
        breadcrumbs={[{ label: '商品中心' }, { label: '商品管理' }]}
        description="维护门店在售商品的基础资料、价格与库存"
        actions={
          <>
            <Button variant="outline" className="h-9" onClick={() => setImportOpen(true)}>
              <Upload data-icon="inline-start" />
              导入商品
            </Button>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => exportProducts(filtered)}
            >
              <Download data-icon="inline-start" />
              导出数据
            </Button>
            <Button variant="outline" className="h-9 border-ai/30 text-ai hover:bg-ai-soft hover:text-ai" render={<Link href="/ai-collect" />} nativeButton={false}>
              <ScanLine data-icon="inline-start" />
              AI 采集商品
            </Button>
            <Button className="h-9" onClick={openNew}>
              <PackagePlus data-icon="inline-start" />
              新增商品
            </Button>
          </>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="商品列表" className="rounded-xl border border-border bg-card">
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
              placeholder="搜索商品名称 / 条码 / 编号"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <FilterSelect label="分类" value={category} onChange={(v) => { setCategory(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...categories.map((c) => ({ value: c, label: c }))]} />
          <FilterSelect label="品牌" value={brand} onChange={(v) => { setBrand(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...brands.map((b) => ({ value: b, label: b }))]} />
          <FilterSelect label="供应商" value={supplier} onChange={(v) => { setSupplier(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...suppliers.map((s) => ({ value: s, label: s }))]} className="w-44" />
          <FilterSelect label="状态" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={statusOptions} className="w-32" />
          <FilterSelect label="库存" value={stock} onChange={(v) => { setStock(v); setPage(1) }} options={stockOptions} />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={resetFilters} disabled={!hasFilter}>
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
            <Button variant="ghost" size="sm" onClick={() => setBulkMode('price')}>
              <Tag data-icon="inline-start" />
              批量调价
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setBulkMode('category')}>
              <FolderTree data-icon="inline-start" />
              批量分类
            </Button>
            <Button variant="ghost" size="sm" onClick={() => bulkSetStatus('在售')}>
              <Check data-icon="inline-start" />
              批量启用
            </Button>
            <Button variant="ghost" size="sm" onClick={() => bulkSetStatus('停售')}>
              <Ban data-icon="inline-start" />
              批量停用
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportProducts(products.filter((p) => selected.includes(p.id)))}>
              <Download data-icon="inline-start" />
              导出所选
            </Button>
            <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => remove(selected)}>
              <Trash2 data-icon="inline-start" />
              批量删除
            </Button>
            <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelected([])}>
              取消选择
            </button>
          </div>
        )}

        <div className="overflow-x-auto"><Table className="min-w-[1180px] text-[13px]">
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
              <TableHead>商品条码</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>品牌</TableHead>
              <TableHead>规格</TableHead>
              <TableHead className="text-right">进货价</TableHead>
              <TableHead className="text-right">零售价</TableHead>
              <TableHead className="text-right">当前库存</TableHead>
              <TableHead>库存状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={12} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的商品</p>
                  <p className="mt-1 text-xs text-muted-foreground">请调整搜索关键词或筛选条件</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={resetFilters}>
                    清除筛选
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => {
                const stockStatus = getStockStatus(p)
                const checked = selected.includes(p.id)
                const low = p.stock < p.safetyStock
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
                      <button type="button" onClick={() => setViewing(p)} className="group flex items-center gap-3 text-left">
                        <ProductThumb src={p.image} alt={p.name} size={44} />
                        <span className="min-w-0">
                          <span className="block max-w-52 truncate font-medium text-foreground group-hover:text-primary">{p.name}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            {p.id}
                            {p.source === 'AI 采集' && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-ai-soft px-1 text-[10px] font-medium text-ai">
                                <ScanLine className="size-2.5" aria-hidden="true" />
                                AI
                              </span>
                            )}
                            {p.status === '停售' && <span className="rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">停售</span>}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.barcode ?? '—'}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{p.brand}</TableCell>
                    <TableCell className="text-muted-foreground">{p.spec ?? '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(p.purchasePrice)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatMoney(p.retailPrice)}</TableCell>
                    <TableCell className={cn('text-right tabular-nums', stockStatus === '缺货' ? 'text-danger' : low ? 'text-[oklch(0.5_0.12_60)]' : '')}>
                      {p.stock}
                      <span className="ml-0.5 text-xs text-muted-foreground">{p.unit}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={stockTone[stockStatus]}>{stockStatus}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{p.updatedAt}</TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setViewing(p)}>
                          <Eye data-icon="inline-start" />
                          查看
                        </Button>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => openEdit(p)}>
                          <Pencil data-icon="inline-start" />
                          编辑
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${p.name} 更多操作`} />}>
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => toast.success('条码标签已加入打印队列', { description: p.name })}>打印价签</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/inventory')}>调整库存</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => remove([p.id])}>
                              <Trash2 />
                              删除商品
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        />
      </section>

      <ProductDetailSheet product={viewing} onOpenChange={(o) => !o && setViewing(null)} onEdit={openEdit} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <BulkEditDialog mode={bulkMode} ids={selected} onOpenChange={setBulkMode} onDone={() => setSelected([])} />
    </>
  )
}
