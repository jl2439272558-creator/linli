'use client'

import { useMemo, useRef, useState } from 'react'
import { Barcode, Check, Download, Eye, PackageCheck, RotateCcw, ScanLine, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/common/page-header'
import { ProductThumb } from '@/components/common/product-thumb'
import { StatusBadge } from '@/components/common/status-badge'
import { SectionCard } from '@/components/common/section-card'
import { useDemoStore } from '@/components/providers/demo-store'
import { stockInStatusTone, type PurchaseItem, type StockInRecord, type StockInStatus } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

type Line = {
  productId: string
  name: string
  image: string | null
  barcode: string | null
  spec: string | null
  unit: string
  orderedQty: number | null
  alreadyIn: number
  receive: string
  price: number | null
}

export function StockInView() {
  const { products, purchaseOrders, updatePurchaseOrder, addStockInRecord, stockInRecords, adjustStock } = useDemoStore()
  const [code, setCode] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [orderId, setOrderId] = useState<string | null>(null)
  const [detail, setDetail] = useState<StockInRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const inTransit = purchaseOrders.filter((o) => o.status === '已下单' || o.status === '部分入库')

  const addByCode = () => {
    const q = code.trim().toLowerCase()
    if (!q) return
    const p = products.find((x) => (x.barcode ?? '').toLowerCase() === q || x.name.toLowerCase().includes(q) || x.id.toLowerCase() === q)
    if (!p) {
      toast.info('未找到对应商品', { description: '请核对条码或商品名称；也可先在商品管理中创建商品' })
      return
    }
    if (lines.some((l) => l.productId === p.id)) {
      toast.info('该商品已在入库清单中', { description: '请直接修改实收数量' })
      setCode('')
      return
    }
    setLines((prev) => [
      ...prev,
      { productId: p.id, name: p.name, image: p.image, barcode: p.barcode, spec: p.spec, unit: p.unit, orderedQty: null, alreadyIn: 0, receive: '1', price: p.purchasePrice },
    ])
    setCode('')
    toast.success(`已加入：${p.name}`, { description: '可继续扫码或输入条码回车添加' })
    inputRef.current?.focus()
  }

  const loadOrder = (id: string) => {
    const order = purchaseOrders.find((o) => o.id === id)
    if (!order) return
    const next: Line[] = order.items
      .filter((i) => i.quantity - i.received > 0)
      .map((i) => {
        const p = products.find((x) => x.id === i.productId)
        const rest = i.quantity - i.received
        return {
          productId: i.productId,
          name: i.name,
          image: p?.image ?? null,
          barcode: p?.barcode ?? null,
          spec: i.spec,
          unit: i.unit,
          orderedQty: i.quantity,
          alreadyIn: i.received,
          receive: String(rest),
          price: i.price,
        }
      })
    setOrderId(id)
    setLines(next)
    if (next.length) toast.success(`已载入采购单 ${id}`, { description: `${next.length} 个待入库商品，实收数量默认按未入库量填写` })
    else toast.info('该采购单已全部入库', { description: id })
  }

  const rows = useMemo(
    () =>
      lines.map((l) => {
        const receive = Number(l.receive) || 0
        const target = l.orderedQty === null ? null : l.orderedQty - l.alreadyIn
        const diff = target === null ? null : receive - target
        const status: StockInStatus = receive <= 0 ? '待收货' : target !== null && receive < target ? '部分入库' : '已入库'
        return { ...l, receive, target, diff, status }
      }),
    [lines],
  )

  const receivable = rows.filter((r) => r.receive > 0)
  const totalReceive = receivable.reduce((s, r) => s + r.receive, 0)
  const totalAmount = receivable.reduce((s, r) => s + r.receive * (r.price ?? 0), 0)

  const confirm = () => {
    if (!receivable.length) {
      toast.info('请先填写实收数量', { description: '实收数量为 0 的行不会入库' })
      return
    }
    const invalid = rows.some((r) => r.receive < 0 || !Number.isInteger(r.receive))
    if (invalid) {
      toast.info('实收数量需为不小于 0 的整数')
      return
    }
    setSaving(true)
    setTimeout(() => {
      receivable.forEach((r) => adjustStock(r.productId, r.receive))
      const status: StockInStatus = rows.every((r) => r.status === '已入库') ? '已入库' : '部分入库'
      const record = addStockInRecord({
        orderId,
        supplier: orderId ? purchaseOrders.find((o) => o.id === orderId)?.supplier ?? '未指定供应商' : '未关联采购单',
        status,
        items: rows.map<PurchaseItem>((r) => ({
          productId: r.productId,
          name: r.name,
          spec: r.spec,
          unit: r.unit,
          quantity: r.orderedQty ?? r.receive,
          received: r.alreadyIn + r.receive,
          price: r.price ?? 0,
        })),
      })
      if (orderId) {
        const order = purchaseOrders.find((o) => o.id === orderId)
        if (order) {
          const merged = order.items.map((i) => {
            const line = rows.find((r) => r.productId === i.productId)
            return line ? { ...i, received: i.received + line.receive } : i
          })
          updatePurchaseOrder(orderId, {
            items: merged,
            status: merged.every((i) => i.received >= i.quantity) ? '已入库' : '部分入库',
          })
        }
      }
      setSaving(false)
      setLines([])
      setOrderId(null)
      toast.success(`入库完成：${receivable.length} 个商品，实收 ${totalReceive} 件`, {
        description: `${record.id} · 入库金额 ${formatMoney(totalAmount)}`,
      })
    }, 700)
  }

  return (
    <>
      <PageHeader
        title="入库管理"
        breadcrumbs={[{ label: '库存采购' }, { label: '入库管理' }]}
        description="扫码或按采购单登记到货，核对实收数量与差异"
        actions={
          <>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => toast.success(`已导出 ${stockInRecords.length} 条入库记录`, { description: '入库记录_20261020.xlsx（演示文件，未实际下载）' })}
            >
              <Download data-icon="inline-start" />
              导出记录
            </Button>
            <Button className="h-9" disabled={saving || !lines.length} onClick={confirm}>
              <PackageCheck data-icon="inline-start" />
              确认入库{receivable.length ? `（${receivable.length} 项）` : ''}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <SectionCard
          title="扫码 / 选择采购单"
          description="支持扫码枪输入条码后回车添加，也可从在途采购单载入明细"
          icon={
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-primary">
              <ScanLine className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
          }
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-80">
              <label htmlFor="scan-input" className="mb-1.5 block text-xs text-muted-foreground">
                扫描或输入商品条码
              </label>
              <div className="relative">
                <Barcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="scan-input"
                  ref={inputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addByCode()
                    }
                  }}
                  placeholder="扫码后自动回车，或输入条码 / 商品名称"
                  className="h-9 pl-9 font-mono text-[13px]"
                />
              </div>
            </div>
            <Button variant="outline" className="h-9" onClick={addByCode}>
              <ScanLine data-icon="inline-start" />
              添加商品
            </Button>
            <div className="w-72">
              <p className="mb-1.5 text-xs text-muted-foreground">选择在途采购单</p>
              <Select
                items={inTransit.map((o) => ({ value: o.id, label: `${o.id} · ${o.supplier}` }))}
                value={orderId ?? ''}
                onValueChange={(v) => v && loadOrder(v as string)}
              >
                <SelectTrigger className="h-9 w-full">
                  <Truck className="size-4 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder={inTransit.length ? '选择采购单载入明细' : '暂无在途采购单'} />
                </SelectTrigger>
                <SelectContent>
                  {inTransit.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {`${o.id} · ${o.supplier}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              className="h-9 text-muted-foreground"
              disabled={!lines.length}
              onClick={() => {
                setLines([])
                setOrderId(null)
                toast.info('已清空入库清单')
              }}
            >
              <RotateCcw data-icon="inline-start" />
              清空
            </Button>
            <div className="ml-auto flex items-center gap-5 text-[13px]">
              <span className="text-muted-foreground">
                本次实收合计 <span className="font-semibold text-foreground tabular-nums">{totalReceive}</span> 件
              </span>
              <span className="text-muted-foreground">
                入库金额 <span className="font-semibold text-foreground tabular-nums">{formatMoney(totalAmount)}</span>
              </span>
            </div>
          </div>
        </SectionCard>

        <section aria-label="待入库明细" className="rounded-xl border border-border bg-card">
          <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-5 py-3">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">待入库明细</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {orderId ? `来源采购单 ${orderId}` : '扫码添加的商品'} · 共 {lines.length} 项
              </p>
            </div>
          </header>

          <Table className="min-w-[1080px] text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                <TableHead className="pl-5 min-w-56">商品信息</TableHead>
                <TableHead>条码</TableHead>
                <TableHead className="text-right">采购数量</TableHead>
                <TableHead className="text-right">已入库</TableHead>
                <TableHead className="text-right">本次实收</TableHead>
                <TableHead className="text-right">差异数量</TableHead>
                <TableHead>入库状态</TableHead>
                <TableHead className="pr-5 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-16 text-center">
                    <p className="text-sm text-foreground">尚未添加待入库商品</p>
                    <p className="mt-1 text-xs text-muted-foreground">扫描商品条码，或从上方选择在途采购单载入明细</p>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.productId} className="[&_td]:py-2.5">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={r.image} alt={r.name} size={44} />
                        <span className="min-w-0">
                          <span className="block max-w-52 truncate font-medium text-foreground">{r.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{r.spec ?? '无规格'} · 单位 {r.unit}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.barcode ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.orderedQty === null ? <span className="text-muted-foreground">—</span> : `${r.orderedQty} ${r.unit}`}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {r.alreadyIn} {r.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        value={r.receive}
                        onChange={(e) => setLines((prev) => prev.map((l) => (l.productId === r.productId ? { ...l, receive: e.target.value } : l)))}
                        inputMode="numeric"
                        className="ml-auto h-8 w-20 text-right"
                        aria-label={`${r.name} 本次实收数量`}
                      />
                    </TableCell>
                    <TableCell className={cn('text-right tabular-nums', r.diff === null ? 'text-muted-foreground' : r.diff === 0 ? 'text-success' : r.diff > 0 ? 'text-info' : 'text-danger')}>
                      {r.diff === null ? '—' : r.diff === 0 ? '无差异' : `${r.diff > 0 ? '+' : ''}${r.diff} ${r.unit}`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={stockInStatusTone[r.status]}>{r.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`移除 ${r.name}`}
                        className="text-muted-foreground hover:text-danger"
                        onClick={() => setLines((prev) => prev.filter((l) => l.productId !== r.productId))}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <section aria-label="入库记录" className="rounded-xl border border-border bg-card">
          <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-5 py-3">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">入库记录</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">共 {stockInRecords.length} 条记录</p>
            </div>
          </header>

          <Table className="min-w-[960px] text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                <TableHead className="pl-5">入库单号</TableHead>
                <TableHead>关联采购单</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead className="text-right">商品项数</TableHead>
                <TableHead className="text-right">实收数量</TableHead>
                <TableHead>入库状态</TableHead>
                <TableHead>入库时间</TableHead>
                <TableHead className="pr-5 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockInRecords.map((r) => (
                <TableRow key={r.id} className="[&_td]:py-2.5">
                  <TableCell className="pl-5 font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.orderId ?? '—'}</TableCell>
                  <TableCell>{r.supplier}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.items.length}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.items.reduce((s, i) => s + i.received, 0)}</TableCell>
                  <TableCell>
                    <StatusBadge tone={stockInStatusTone[r.status]}>{r.status}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {r.arrivedAt}
                    <span className="mt-0.5 block">{r.operator}</span>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setDetail(r)}>
                      <Eye data-icon="inline-start" />
                      查看明细
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-[640px]">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>入库单明细</DialogTitle>
                <DialogDescription>
                  {detail.id} · {detail.supplier} · {detail.arrivedAt} · {detail.operator}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-[13px]">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">商品</th>
                      <th className="px-3 py-2 text-right font-medium">采购数量</th>
                      <th className="px-3 py-2 text-right font-medium">实收数量</th>
                      <th className="px-3 py-2 text-right font-medium">入库单价</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detail.items.map((i) => (
                      <tr key={i.productId}>
                        <td className="px-3 py-2">
                          <span className="block max-w-64 truncate font-medium text-foreground">{i.name}</span>
                          <span className="text-xs text-muted-foreground">{i.spec ?? '无规格'} · 单位 {i.unit}</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{i.quantity}</td>
                        <td className={cn('px-3 py-2 text-right tabular-nums', i.received >= i.quantity ? 'text-success' : 'text-[oklch(0.5_0.12_60)]')}>
                          {i.received}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(i.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" className="h-9" onClick={() => setDetail(null)}>
                  关闭
                </Button>
                <Button className="h-9" onClick={() => toast.success('差异已记录', { description: '演示交互：差异明细可在采购管理中核对' })}>
                  <Check data-icon="inline-start" />
                  确认差异
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
