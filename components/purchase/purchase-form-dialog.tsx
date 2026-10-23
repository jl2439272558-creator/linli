'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Loader2, Plus, ShoppingCart, Store, Trash2, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDemoStore } from '@/components/providers/demo-store'
import { suppliers, type PurchaseItem } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

type Row = { productId: string; name: string; spec: string | null; unit: string; quantity: string; price: string }

type DraftRow = Omit<Row, 'price'> & { price: number | null }

export function PurchaseFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        {open && <Form onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function Form({ onDone }: { onDone: () => void }) {
  const { products, addPurchaseOrder } = useDemoStore()
  const [supplier, setSupplier] = useState(suppliers[0])
  const [expectedAt, setExpectedAt] = useState('2026-10-23')
  const [rows, setRows] = useState<Row[]>([])
  const [saving, setSaving] = useState(false)
  const [pick, setPick] = useState('')

  const available = products.filter((p) => p.status === '在售' && !rows.some((r) => r.productId === p.id))
  const itemsOptions = available.map((p) => ({
    value: p.id,
    label: `${p.name} · ${p.spec ?? '无规格'} · 库存 ${p.stock}${p.unit}`,
  }))

  const addRow = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    const suggested = Math.max(p.safetyStock * 2 - p.stock, 1)
    setRows((prev) => [
      ...prev,
      { productId: p.id, name: p.name, spec: p.spec, unit: p.unit, quantity: String(suggested), price: p.purchasePrice?.toString() ?? '' },
    ])
    setPick('')
  }

  const patch = (id: string, key: 'quantity' | 'price', value: string) =>
    setRows((prev) => prev.map((r) => (r.productId === id ? { ...r, [key]: value } : r)))

  const drafts: DraftRow[] = rows.map((r) => ({ ...r, price: r.price.trim() === '' ? null : Number(r.price) }))
  const totalQty = drafts.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
  const totalAmount = drafts.reduce((s, r) => s + (Number(r.quantity) || 0) * (r.price ?? 0), 0)

  const submit = (status: '草稿' | '待确认') => {
    if (!rows.length) {
      toast.info('请至少添加一个商品', { description: '可从库存偏低的商品中选择' })
      return
    }
    const invalid = drafts.some((r) => !Number.isInteger(Number(r.quantity)) || Number(r.quantity) <= 0)
    if (invalid) {
      toast.info('采购数量需为大于 0 的整数')
      return
    }
    setSaving(true)
    setTimeout(() => {
      const items: PurchaseItem[] = drafts.map((r) => ({
        productId: r.productId,
        name: r.name,
        spec: r.spec,
        unit: r.unit,
        quantity: Number(r.quantity),
        received: 0,
        price: r.price ?? 0,
      }))
      const order = addPurchaseOrder({ supplier, status, expectedAt, items })
      setSaving(false)
      onDone()
      toast.success(status === '草稿' ? '采购单已保存为草稿' : '采购单已创建', {
        description: `${order.id} · ${supplier} · ${items.length} 个商品 · ${formatMoney(totalAmount)}`,
      })
    }, 600)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>新建采购单</DialogTitle>
        <DialogDescription>选择供应商与商品，填写采购数量与单价；下单后可在入库管理中登记到货</DialogDescription>
      </DialogHeader>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">供应商</Label>
          <Select items={suppliers.map((s) => ({ value: s, label: s }))} value={supplier} onValueChange={(v) => v && setSupplier(v as string)}>
            <SelectTrigger className="h-9 w-full">
              <Store className="size-4 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">预计到货时间</Label>
          <Input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} className="h-9" aria-label="预计到货时间" />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Label className="text-xs font-normal text-muted-foreground">采购商品</Label>
          <Select items={itemsOptions} value={pick} onValueChange={(v) => v && addRow(v as string)}>
            <SelectTrigger className="h-8 w-full text-[13px] sm:w-64">
              <Plus className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder="添加商品" />
            </SelectTrigger>
            <SelectContent>
              {itemsOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">商品</th>
                <th className="w-24 px-3 py-2 text-right font-medium">采购数量</th>
                <th className="w-24 px-3 py-2 text-right font-medium">采购单价</th>
                <th className="w-24 px-3 py-2 text-right font-medium">小计</th>
                <th className="w-12 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">
                    尚未添加商品，请在上方选择商品加入采购单
                  </td>
                </tr>
              ) : (
                drafts.map((r) => (
                  <tr key={r.productId}>
                    <td className="px-3 py-2">
                      <span className="block max-w-72 truncate font-medium text-foreground">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{r.spec ?? '无规格'} · 单位 {r.unit}</span>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={r.quantity}
                        onChange={(e) => patch(r.productId, 'quantity', e.target.value)}
                        inputMode="numeric"
                        className="h-8 text-right"
                        aria-label={`${r.name} 采购数量`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={r.price ?? ''}
                        onChange={(e) => patch(r.productId, 'price', e.target.value)}
                        inputMode="decimal"
                        className="h-8 text-right"
                        aria-label={`${r.name} 采购单价`}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatMoney((Number(r.quantity) || 0) * (r.price ?? 0))}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`移除 ${r.name}`}
                        className="text-muted-foreground hover:text-danger"
                        onClick={() => setRows((prev) => prev.filter((x) => x.productId !== r.productId))}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-muted/40 text-[13px]">
              <tr>
                <td className="px-3 py-2 text-muted-foreground">合计</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{totalQty}</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(totalAmount)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          建议数量按「补至 2 倍安全库存」自动带出，可手动修改；采购单价默认取最近进货价。
        </p>
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" className="h-9" onClick={onDone}>
          <X data-icon="inline-start" />
          取消
        </Button>
        <Button variant="outline" className="h-9" disabled={saving} onClick={() => submit('草稿')}>
          保存草稿
        </Button>
        <Button className="h-9" disabled={saving} onClick={() => submit('待确认')}>
          {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ShoppingCart data-icon="inline-start" />}
          提交采购单
        </Button>
      </DialogFooter>
    </>
  )
}

/** 采购单明细 */
export function PurchaseDetailDialog({
  order,
  onOpenChange,
}: {
  order: { id: string; supplier: string; status: string; expectedAt: string; createdAt: string; operator: string; items: PurchaseItem[] } | null
  onOpenChange: (o: boolean) => void
}) {
  const total = order?.items.reduce((s, i) => s + i.quantity * i.price, 0) ?? 0
  const received = order?.items.reduce((s, i) => s + i.received, 0) ?? 0
  const ordered = order?.items.reduce((s, i) => s + i.quantity, 0) ?? 0

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>采购单明细</DialogTitle>
              <DialogDescription>
                {order.id} · {order.supplier} · 下单人 {order.operator} · 预计到货 {order.expectedAt}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">商品</th>
                    <th className="px-3 py-2 text-right font-medium">采购数量</th>
                    <th className="px-3 py-2 text-right font-medium">已入库</th>
                    <th className="px-3 py-2 text-right font-medium">采购单价</th>
                    <th className="px-3 py-2 text-right font-medium">金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((i) => (
                    <tr key={i.productId}>
                      <td className="px-3 py-2">
                        <span className="block max-w-64 truncate font-medium text-foreground">{i.name}</span>
                        <span className="text-xs text-muted-foreground">{i.spec ?? '无规格'} · 单位 {i.unit}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {i.quantity} {i.unit}
                      </td>
                      <td className={cn('px-3 py-2 text-right tabular-nums', i.received >= i.quantity ? 'text-success' : i.received > 0 ? 'text-[oklch(0.5_0.12_60)]' : 'text-muted-foreground')}>
                        {i.received} {i.unit}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(i.price)}</td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{formatMoney(i.quantity * i.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 text-[13px]">
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">合计</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {ordered} 件 · 已入库 <span className="text-success">{received}</span>
                    </td>
                    <td colSpan={2} />
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              <Button className="h-9" render={<Link href="/stock-in" />} nativeButton={false}>
                <Truck data-icon="inline-start" />
                前往入库登记
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
