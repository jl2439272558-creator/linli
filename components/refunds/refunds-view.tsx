'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Check, Download, Eye, Loader2, Plus, RotateCcw, Search, ShieldCheck, Undo2, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { refundReasons, refundStatusTone, type RefundRecord, type RefundStatus } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const ALL = 'all'
const statuses: RefundStatus[] = ['待处理', '已退款', '已拒绝']

function nowStamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function RefundsView({ initialOrder }: { initialOrder?: string }) {
  const { refunds, saleOrders, updateRefund, updateSaleOrder, adjustStock } = useDemoStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [newOpen, setNewOpen] = useState(!!initialOrder)
  const [detail, setDetail] = useState<RefundRecord | null>(null)
  const [handling, setHandling] = useState<string | null>(null)

  // 从订单页「发起退货」跳转 /refunds?order= 时自动打开退货单弹窗
  const [prevOrder, setPrevOrder] = useState(initialOrder)
  if (initialOrder !== prevOrder) {
    setPrevOrder(initialOrder)
    if (initialOrder) setNewOpen(true)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return refunds.filter((r) => {
      if (q && !r.id.toLowerCase().includes(q) && !r.orderId.toLowerCase().includes(q) && !r.reason.includes(q) && !r.items.some((i) => i.name.toLowerCase().includes(q))) return false
      if (status !== ALL && r.status !== status) return false
      return true
    })
  }, [refunds, query, status])

  const pageSize = 8
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = !!query || status !== ALL

  const pending = refunds.filter((r) => r.status === '待处理')
  const refundedRecords = refunds.filter((r) => r.status === '已退款')
  const refundedAmount = refundedRecords.reduce((s, r) => s + r.amount, 0)
  const refundedQty = refundedRecords.reduce((s, r) => s + r.items.reduce((a, i) => a + i.quantity, 0), 0)

  const reset = () => {
    setQuery('')
    setStatus(ALL)
    setPage(1)
  }

  const approve = (r: RefundRecord) => {
    setHandling(r.id)
    setTimeout(() => {
      // 回滚库存 → 更新订单退款金额与状态 → 更新退款单
      r.items.forEach((i) => adjustStock(i.productId, i.quantity))
      const order = saleOrders.find((o) => o.id === r.orderId)
      if (order) {
        const refunded = Math.round((order.refunded + r.amount) * 100) / 100
        updateSaleOrder(order.id, { refunded, status: refunded >= order.paid ? '已退款' : '部分退款' })
      }
      updateRefund(r.id, { status: '已退款', handledAt: nowStamp(), stockRolledBack: true })
      setHandling(null)
      toast.success(`已退款 ${formatMoney(r.amount)}`, {
        description: `${r.id} · 库存已回滚 ${r.items.reduce((a, i) => a + i.quantity, 0)} 件${order ? ` · 订单 ${order.id} 状态已更新` : ''}`,
      })
    }, 600)
  }

  const reject = (r: RefundRecord) => {
    updateRefund(r.id, { status: '已拒绝', handledAt: nowStamp() })
    toast.success('退货申请已拒绝', { description: `${r.id} · ${r.reason} · 库存不做变动` })
  }

  const stats: StatItem[] = [
    { label: '待处理退货', value: `${pending.length} 单`, icon: Undo2, tone: 'bg-warning-soft text-warning', hint: pending.length ? '需人工确认后回滚库存' : '暂无待处理' },
    { label: '已退款金额', value: formatMoney(refundedAmount), icon: Check, tone: 'bg-success-soft text-success', hint: `共 ${refundedRecords.length} 单` },
    { label: '回滚库存件数', value: `${refundedQty} 件`, icon: ShieldCheck, tone: 'bg-brand-soft text-primary', hint: '退款确认后自动加回库存' },
    { label: '退货商品种类', value: `${refunds.reduce((s, r) => s + r.items.length, 0)} 项`, icon: XCircle, tone: 'bg-info-soft text-info', hint: `累计 ${refunds.length} 张退货单` },
  ]

  return (
    <>
      <PageHeader
        title="退货退款"
        breadcrumbs={[{ label: '销售收银' }, { label: '退货退款' }]}
        description="登记退货申请，确认退款后自动回滚库存并更新订单状态"
        actions={
          <>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => toast.success(`已导出 ${filtered.length} 张退货单`, { description: '退货退款_20261020.xlsx（演示文件，未实际下载）' })}
            >
              <Download data-icon="inline-start" />
              导出数据
            </Button>
            <Button className="h-9" onClick={() => setNewOpen(true)}>
              <Plus data-icon="inline-start" />
              新增退货单
            </Button>
          </>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="退货单列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="搜索退货单号、订单号或商品"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索退货单号 / 订单号 / 商品 / 原因"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <FilterSelect label="处理状态" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...statuses.map((s) => ({ value: s, label: s }))]} />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[1120px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">退款单号</TableHead>
              <TableHead>关联订单</TableHead>
              <TableHead>申请时间</TableHead>
              <TableHead className="min-w-48">退货商品</TableHead>
              <TableHead className="text-right">件数</TableHead>
              <TableHead className="text-right">退款金额</TableHead>
              <TableHead>退货原因</TableHead>
              <TableHead>处理状态</TableHead>
              <TableHead>处理人</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的退货单</p>
                  <p className="mt-1 text-xs text-muted-foreground">可调整搜索关键词，或点击「新增退货单」登记退货</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                    清除筛选
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const qty = r.items.reduce((a, i) => a + i.quantity, 0)
                return (
                  <TableRow key={r.id} className="[&_td]:py-2.5">
                    <TableCell className="pl-5 font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <Link href={`/orders?q=${r.orderId}`} className="hover:text-primary hover:underline">
                        {r.orderId}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{r.createdAt}</TableCell>
                    <TableCell>
                      <span className="block max-w-48 truncate text-foreground">{r.items.map((i) => i.name).join('、')}</span>
                      {r.stockRolledBack && <span className="mt-0.5 block text-[11px] text-success">库存已回滚</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{qty}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatMoney(r.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.reason}</TableCell>
                    <TableCell>
                      <StatusBadge tone={refundStatusTone[r.status]} pulse={r.status === '待处理'}>
                        {r.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="block">{r.operator}</span>
                      {r.handledAt && <span className="mt-0.5 block">{r.handledAt}</span>}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-0.5">
                        {r.status === '待处理' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/40 text-primary hover:bg-brand-soft hover:text-primary"
                              disabled={handling === r.id}
                              onClick={() => approve(r)}
                            >
                              {handling === r.id ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                              确认退款
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => reject(r)}>
                              <XCircle data-icon="inline-start" />
                              拒绝
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setDetail(r)}>
                            <Eye data-icon="inline-start" />
                            查看明细
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table></div>

        <TablePagination total={filtered.length} page={current} pageSize={pageSize} onPageChange={setPage} />

        <p className="flex items-start gap-2 border-t border-border px-5 py-3.5 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-px size-3.5 shrink-0 text-primary" aria-hidden="true" />
          演示说明：确认退款会把退货商品数量加回库存，并把订单状态更新为「部分退款 / 已退款」。退款金额与库存变动均为本地演示数据，未对接支付渠道。
        </p>
      </section>

      <NewRefundDialog open={newOpen} initialOrderId={initialOrder} onOpenChange={setNewOpen} />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-[560px]">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>退货单明细</DialogTitle>
                <DialogDescription>
                  {detail.id} · 关联订单 {detail.orderId} · {detail.createdAt}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={refundStatusTone[detail.status]}>{detail.status}</StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    退货原因：{detail.reason} · 处理人 {detail.operator}
                    {detail.handledAt ? ` · 处理时间 ${detail.handledAt}` : ''}
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-[13px]">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">商品</th>
                        <th className="px-3 py-2 text-right font-medium">单价</th>
                        <th className="px-3 py-2 text-right font-medium">退货数量</th>
                        <th className="px-3 py-2 text-right font-medium">金额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detail.items.map((i) => (
                        <tr key={i.productId}>
                          <td className="px-3 py-2 font-medium text-foreground">{i.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatMoney(i.price)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {i.quantity} {i.unit}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">{formatMoney(i.price * i.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/40">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-muted-foreground">
                          退款合计
                        </td>
                        <td className={cn('px-3 py-2 text-right font-semibold tabular-nums', detail.status === '已退款' ? 'text-success' : 'text-foreground')}>
                          {formatMoney(detail.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  库存回滚状态：{detail.stockRolledBack ? '已回滚（退货商品已加回库存）' : '未回滚'}
                </p>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" className="h-9" onClick={() => setDetail(null)}>
                  关闭
                </Button>
                <Button className="h-9" render={<Link href={`/orders?q=${detail.orderId}`} />} nativeButton={false}>
                  查看关联订单
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ---------------- 新增退货单 ---------------- */

type DraftLine = { productId: string; name: string; unit: string; price: number; max: number; qty: string; include: boolean }

function NewRefundDialog({
  open,
  initialOrderId,
  onOpenChange,
}: {
  open: boolean
  initialOrderId?: string
  onOpenChange: (o: boolean) => void
}) {
  const { saleOrders, refunds, addRefund } = useDemoStore()
  const [orderId, setOrderId] = useState(initialOrderId ?? '')
  const [reason, setReason] = useState(refundReasons[0])
  const [lines, setLines] = useState<DraftLine[]>([])
  const [saving, setSaving] = useState(false)

  // 已申请过退货（非拒绝）的数量，用于计算可退上限
  const refundedQty = (orderIdValue: string, productId: string) =>
    refunds
      .filter((r) => r.orderId === orderIdValue && r.status !== '已拒绝')
      .flatMap((r) => r.items)
      .filter((i) => i.productId === productId)
      .reduce((s, i) => s + i.quantity, 0)

  const buildLines = (orderIdValue: string) => {
    const order = saleOrders.find((o) => o.id === orderIdValue)
    if (!order) return setLines([])
    setLines(
      order.items.map((i) => {
        const max = Math.max(0, i.quantity - refundedQty(order.id, i.productId))
        return { productId: i.productId, name: i.name, unit: i.unit, price: i.price, max, qty: max ? String(Math.min(1, max)) : '0', include: max > 0 }
      }),
    )
  }

  useEffect(() => {
    if (open && orderId) buildLines(orderId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId])

  const selectableOrders = saleOrders.filter((o) => o.status !== '已退款' && o.items.some((i) => i.quantity - refundedQty(o.id, i.productId) > 0))

  const selected = lines.filter((l) => l.include && Number(l.qty) > 0)
  const total = selected.reduce((s, l) => s + l.price * (Number(l.qty) || 0), 0)

  const submit = () => {
    if (!orderId) {
      toast.info('请先选择要退货的订单')
      return
    }
    if (!selected.length) {
      toast.info('请至少勾选一个退货商品并填写数量')
      return
    }
    const invalid = selected.some((l) => !Number.isInteger(Number(l.qty)) || Number(l.qty) <= 0 || Number(l.qty) > l.max)
    if (invalid) {
      toast.info('退货数量超出可退范围', { description: '请核对每项的最大可退数量' })
      return
    }
    setSaving(true)
    setTimeout(() => {
      const record = addRefund({
        orderId,
        items: selected.map((l) => ({ productId: l.productId, name: l.name, unit: l.unit, price: l.price, quantity: Number(l.qty) })),
        amount: Math.round(total * 100) / 100,
        reason,
        status: '待处理',
        handledAt: null,
        stockRolledBack: false,
      })
      setSaving(false)
      onOpenChange(false)
      setOrderId('')
      setLines([])
      toast.success('退货单已创建', { description: `${record.id} · 待处理 · 确认退款后回滚库存` })
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>新增退货单</DialogTitle>
          <DialogDescription>选择订单与退货商品，提交后进入待处理状态；确认退款才会回滚库存</DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 text-xs font-normal text-muted-foreground">关联订单</Label>
              <Select items={selectableOrders.map((o) => ({ value: o.id, label: `${o.id} · ${o.payMethod} · ${formatMoney(o.paid)}` }))} value={orderId} onValueChange={(v) => v && setOrderId(v as string)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="选择订单" />
                </SelectTrigger>
                <SelectContent>
                  {selectableOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {`${o.id} · ${o.payMethod} · ${formatMoney(o.paid)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-normal text-muted-foreground">退货原因</Label>
              <Select items={refundReasons.map((r) => ({ value: r, label: r }))} value={reason} onValueChange={(v) => v && setReason(v as string)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {refundReasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2 text-left font-medium">商品</th>
                  <th className="px-3 py-2 text-right font-medium">单价</th>
                  <th className="px-3 py-2 text-right font-medium">可退数量</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">退货数量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">
                      请先选择订单，系统会列出可退商品
                    </td>
                  </tr>
                ) : (
                  lines.map((l) => (
                    <tr key={l.productId} className={cn(!l.max && 'opacity-50')}>
                      <td className="px-3 py-2">
                        <Checkbox
                          aria-label={`选择退货 ${l.name}`}
                          disabled={l.max === 0}
                          checked={l.include}
                          onCheckedChange={(c) => setLines((prev) => prev.map((x) => (x.productId === l.productId ? { ...x, include: !!c } : x)))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <span className="block max-w-56 truncate font-medium text-foreground">{l.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {l.productId} · 单位 {l.unit}
                          {l.max === 0 && ' · 已全部退完'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(l.price)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">{l.max}</td>
                      <td className="px-3 py-2">
                        <Input
                          value={l.qty}
                          disabled={!l.include || l.max === 0}
                          onChange={(e) => setLines((prev) => prev.map((x) => (x.productId === l.productId ? { ...x, qty: e.target.value } : x)))}
                          inputMode="numeric"
                          className="h-8 text-right"
                          aria-label={`${l.name} 退货数量`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-muted/40 text-[13px]">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right text-muted-foreground">
                    退款合计
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            可退数量＝该订单商品数量－已申请退货数量（已拒绝的申请不计入）。提交后需在列表中确认退款，库存才会加回。
          </p>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button className="h-9" disabled={saving} onClick={submit}>
            {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
            提交退货申请
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
