'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PackageX, RotateCcw, Search, ShoppingCart, TriangleAlert, Wallet, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { ProductThumb } from '@/components/common/product-thumb'
import { SectionCard } from '@/components/common/section-card'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { getStockStatus } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { stockTone } from '@/components/products/stock-tone'

const ALL = 'all'

/** 建议补货量＝2 × 安全库存 − 当前库存（至少 1） */
function suggestQty(p: { stock: number; safetyStock: number }) {
  return Math.max(1, p.safetyStock * 2 - p.stock)
}

export function StockAlertsView() {
  const { products, categoryList, addPurchaseOrder } = useDemoStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const alerts = useMemo(() => products.filter((p) => getStockStatus(p) !== '正常'), [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return alerts.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.barcode ?? '').includes(q)) return false
      if (category !== ALL && p.category !== category) return false
      if (status !== ALL && getStockStatus(p) !== status) return false
      return true
    })
  }, [alerts, query, category, status])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = !!query || category !== ALL || status !== ALL

  const lowCount = alerts.filter((p) => getStockStatus(p) === '库存偏低').length
  const outCount = alerts.filter((p) => getStockStatus(p) === '缺货').length
  const suggestedAmount = alerts.reduce((s, p) => s + suggestQty(p) * (p.purchasePrice ?? 0), 0)

  const reset = () => {
    setQuery('')
    setCategory(ALL)
    setStatus(ALL)
    setPage(1)
  }

  const createPurchaseOrders = () => {
    const bySupplier = new Map<string, typeof alerts>()
    for (const p of alerts) {
      const list = bySupplier.get(p.supplier) ?? []
      list.push(p)
      bySupplier.set(p.supplier, list)
    }
    bySupplier.forEach((items, supplier) => {
      addPurchaseOrder({
        supplier,
        status: '草稿',
        expectedAt: '2026-10-24',
        items: items.map((p) => ({
          productId: p.id,
          name: p.name,
          spec: p.spec,
          unit: p.unit,
          quantity: suggestQty(p),
          received: 0,
          price: p.purchasePrice ?? 0,
        })),
      })
    })
    toast.success(`已生成 ${bySupplier.size} 张采购草稿单`, {
      description: `按供应商归集 ${alerts.length} 个预警商品，请前往采购管理确认后下单`,
      action: { label: '前往采购管理', onClick: () => (window.location.href = '/purchase') },
    })
  }

  const stats: StatItem[] = [
    { label: '预警商品数', value: `${alerts.length} 个`, icon: TriangleAlert, tone: 'bg-warning-soft text-warning' },
    { label: '缺货商品', value: `${outCount} 个`, icon: PackageX, tone: 'bg-danger-soft text-danger', hint: '需优先补货' },
    { label: '库存偏低', value: `${lowCount} 个`, icon: TriangleAlert, tone: 'bg-info-soft text-info' },
    { label: '建议补货金额', value: formatMoney(suggestedAmount, 0), icon: Wallet, tone: 'bg-brand-soft text-primary', hint: '按补至 2 倍安全库存估算' },
  ]

  return (
    <>
      <PageHeader
        title="库存预警"
        breadcrumbs={[{ label: '库存采购' }, { label: '库存预警' }]}
        description="低于安全库存的商品清单，建议补货量＝2 × 安全库存 − 当前库存"
        actions={
          <Button className="h-9" disabled={!alerts.length} onClick={createPurchaseOrders}>
            <ShoppingCart data-icon="inline-start" />
            一键生成采购单
          </Button>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="预警商品列表" className="rounded-xl border border-border bg-card">
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
          <FilterSelect
            label="预警状态"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
            options={[
              { value: ALL, label: '全部' },
              { value: '库存偏低', label: '库存偏低' },
              { value: '缺货', label: '缺货' },
            ]}
          />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[1060px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5 min-w-52">商品信息</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead className="text-right">当前库存</TableHead>
              <TableHead className="text-right">安全库存</TableHead>
              <TableHead className="text-right">建议补货</TableHead>
              <TableHead className="text-right">预估金额</TableHead>
              <TableHead>预警状态</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="py-16 text-center">
                  <p className="text-sm text-foreground">{alerts.length === 0 ? '当前没有库存预警' : '没有找到匹配的商品'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {alerts.length === 0 ? '全部商品库存均在安全线以上' : '请调整搜索关键词或筛选条件'}
                  </p>
                  {alerts.length > 0 && hasFilter && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                      清除筛选
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => {
                const st = getStockStatus(p)
                const qty = suggestQty(p)
                return (
                  <TableRow key={p.id} className="[&_td]:py-2.5">
                    <TableCell className="pl-5">
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
                    <TableCell className={`text-right font-medium tabular-nums ${st === '缺货' ? 'text-danger' : 'text-[oklch(0.5_0.12_60)]'}`}>
                      {p.stock}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">{p.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {p.safetyStock}
                      <span className="ml-0.5 text-xs">{p.unit}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary tabular-nums">
                      {qty}
                      <span className="ml-0.5 text-xs font-normal">{p.unit}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(qty * (p.purchasePrice ?? 0))}</TableCell>
                    <TableCell>
                      <StatusBadge tone={stockTone[st]}>{st}</StatusBadge>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary"
                          render={<Link href="/inventory" />}
                          nativeButton={false}
                        >
                          前往库存
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

      <SectionCard title="预警规则说明" className="mt-4">
        <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-muted-foreground">
          <li>库存状态：库存 ≤ 0 判定为「缺货」；0 &lt; 库存 &lt; 安全库存判定为「库存偏低」。</li>
          <li>建议补货量＝2 × 安全库存 − 当前库存（不足 1 件按 1 件计），预估金额＝建议补货量 × 最近进货价。</li>
          <li>「一键生成采购单」按商品默认供应商归集，生成状态为「草稿」的采购单，需人工确认后下单。</li>
          <li>商品安全库存可在商品管理编辑，或在基础设置中批量应用默认值。</li>
        </ul>
      </SectionCard>
    </>
  )
}
