'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, Download, Eye, FileText, PackageCheck, RotateCcw, Search, ShoppingCart, Store, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { StatCards } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { purchaseStatusTone, suppliers, type PurchaseOrder, type PurchaseStatus } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PurchaseDetailDialog, PurchaseFormDialog } from './purchase-form-dialog'

const ALL = 'all'
const statuses: PurchaseStatus[] = ['草稿', '待确认', '已下单', '部分入库', '已入库', '已取消']

export function PurchaseView() {
  const { purchaseOrders, updatePurchaseOrder } = useDemoStore()
  const [query, setQuery] = useState('')
  const [supplier, setSupplier] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [detail, setDetail] = useState<PurchaseOrder | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return purchaseOrders.filter((o) => {
      if (q && !o.id.toLowerCase().includes(q) && !o.supplier.toLowerCase().includes(q)) return false
      if (supplier !== ALL && o.supplier !== supplier) return false
      if (status !== ALL && o.status !== status) return false
      return true
    })
  }, [purchaseOrders, query, supplier, status])

  const pageSize = 8
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = !!query || supplier !== ALL || status !== ALL

  const amountOf = (o: PurchaseOrder) => o.items.reduce((s, i) => s + i.quantity * i.price, 0)
  const pendingIn = purchaseOrders.filter((o) => o.status === '已下单' || o.status === '部分入库')
  const monthAmount = purchaseOrders
    .filter((o) => o.createdAt.startsWith('2026-10') && o.status !== '已取消')
    .reduce((s, o) => s + amountOf(o), 0)

  const reset = () => {
    setQuery('')
    setSupplier(ALL)
    setStatus(ALL)
    setPage(1)
  }

  const stats = [
    { label: '采购单总数', value: `${purchaseOrders.length} 个`, icon: FileText, tone: 'bg-brand-soft text-primary' },
    { label: '待入库采购单', value: `${pendingIn.length} 个`, icon: Truck, tone: 'bg-info-soft text-info' },
    { label: '本月采购金额', value: formatMoney(monthAmount, 0), icon: ShoppingCart, tone: 'bg-ai-soft text-ai' },
    { label: '合作供应商', value: `${suppliers.length} 家`, icon: Store, tone: 'bg-success-soft text-success' },
  ]

  return (
    <>
      <PageHeader
        title="采购管理"
        breadcrumbs={[{ label: '库存采购' }, { label: '采购管理' }]}
        description="按库存预警生成采购单，跟踪下单与到货进度"
        actions={
          <>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => toast.success(`已导出 ${filtered.length} 条采购单`, { description: '采购单列表_20261020.xlsx（演示文件，未实际下载）' })}
            >
              <Download data-icon="inline-start" />
              导出数据
            </Button>
            <Button className="h-9" onClick={() => setFormOpen(true)}>
              <ShoppingCart data-icon="inline-start" />
              新建采购单
            </Button>
          </>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="采购单列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="搜索采购单号或供应商"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索采购单号 / 供应商"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <FilterSelect label="供应商" value={supplier} onChange={(v) => { setSupplier(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...suppliers.map((s) => ({ value: s, label: s }))]} className="w-44" />
          <FilterSelect label="采购状态" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...statuses.map((s) => ({ value: s, label: s }))]} className="w-40" />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[1080px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">采购单号</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead className="text-right">商品项数</TableHead>
              <TableHead className="text-right">采购数量</TableHead>
              <TableHead className="text-right">采购金额</TableHead>
              <TableHead>预计到货</TableHead>
              <TableHead>采购状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的采购单</p>
                  <p className="mt-1 text-xs text-muted-foreground">请调整搜索关键词或筛选条件</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                    清除筛选
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((o) => {
                const qty = o.items.reduce((s, i) => s + i.quantity, 0)
                return (
                  <TableRow key={o.id} className="[&_td]:py-2.5">
                    <TableCell className="pl-5">
                      <span className="font-mono text-xs text-foreground">{o.id}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{o.operator}</span>
                    </TableCell>
                    <TableCell>{o.supplier}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.items.length}</TableCell>
                    <TableCell className="text-right tabular-nums">{qty}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatMoney(amountOf(o))}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{o.expectedAt}</TableCell>
                    <TableCell>
                      <StatusBadge tone={purchaseStatusTone[o.status]}>{o.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{o.createdAt}</TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setDetail(o)}>
                          <Eye data-icon="inline-start" />
                          查看明细
                        </Button>
                        {o.status === '待确认' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary"
                            onClick={() => {
                              updatePurchaseOrder(o.id, { status: '已下单' })
                              toast.success('采购单已确认下单', { description: `${o.id} · 可通知供应商发货` })
                            }}
                          >
                            <Check data-icon="inline-start" />
                            确认下单
                          </Button>
                        )}
                        {(o.status === '已下单' || o.status === '部分入库') && (
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary" render={<Link href="/stock-in" />} nativeButton={false}>
                            <PackageCheck data-icon="inline-start" />
                            入库登记
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${o.id} 更多操作`} />}>
                            <FileText />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => toast.success('采购单已复制为草稿', { description: `${o.id}（演示交互，未实际生成）` })}>复制为草稿</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success('已导出采购单 PDF', { description: `${o.id}（演示文件，未实际下载）` })}>导出采购单</DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={o.status === '已入库' || o.status === '已取消'}
                              onClick={() => {
                                updatePurchaseOrder(o.id, { status: '已取消' })
                                toast.success('采购单已取消', { description: o.id })
                              }}
                            >
                              取消采购单
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
        />
      </section>

      <PurchaseFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <PurchaseDetailDialog order={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </>
  )
}
