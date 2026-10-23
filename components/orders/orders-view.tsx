'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Banknote, Download, Eye, Printer, ReceiptText, RotateCcw, Search, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { payMethods, saleOrderStatusTone, type SaleOrder, type SaleOrderStatus } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { downloadCsv, todaySuffix } from '@/lib/export-csv'
import { printReceipt } from '@/lib/print-receipt'
import { cn } from '@/lib/utils'

const ALL = 'all'
const statuses: SaleOrderStatus[] = ['已完成', '部分退款', '已退款']

export function OrdersView({ initialQuery = '' }: { initialQuery?: string }) {
  const { saleOrders, currentStore } = useDemoStore()
  const [query, setQuery] = useState(initialQuery)
  const [pay, setPay] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState<SaleOrder | null>(null)

  // 顶部全局搜索跳转 /orders?q= 时同步搜索词（同路由客户端导航不会重建组件状态）
  const [prevQuery, setPrevQuery] = useState(initialQuery)
  if (initialQuery !== prevQuery) {
    setPrevQuery(initialQuery)
    setQuery(initialQuery)
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return saleOrders.filter((o) => {
      if (q && !o.id.toLowerCase().includes(q) && !(o.memberName ?? '').toLowerCase().includes(q) && !(o.memberPhone ?? '').includes(q) && !o.items.some((i) => i.name.toLowerCase().includes(q) || i.productId.toLowerCase() === q)) return false
      if (pay !== ALL && o.payMethod !== pay) return false
      if (status !== ALL && o.status !== status) return false
      return true
    })
  }, [saleOrders, query, pay, status])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = !!query || pay !== ALL || status !== ALL

  const now = new Date()
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const todayPrefix = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
  const todayOrders = saleOrders.filter((o) => o.createdAt.startsWith(todayPrefix))
  const todayPaid = todayOrders.reduce((s, o) => s + o.paid, 0)
  const refundedOrders = saleOrders.filter((o) => o.status !== '已完成')
  const refundedAmount = saleOrders.reduce((s, o) => s + o.refunded, 0)
  const avgTicket = filtered.length ? filtered.reduce((s, o) => s + o.paid, 0) / filtered.length : 0

  const reset = () => {
    setQuery('')
    setPay(ALL)
    setStatus(ALL)
    setPage(1)
  }

  const stats: StatItem[] = [
    { label: '今日订单数', value: `${todayOrders.length} 笔`, icon: ReceiptText, tone: 'bg-brand-soft text-primary', hint: '按当日收银流水统计' },
    { label: '今日实收金额', value: formatMoney(todayPaid), icon: Banknote, tone: 'bg-info-soft text-info', hint: `客单价 ${formatMoney(todayOrders.length ? todayPaid / todayOrders.length : 0)}` },
    { label: '退款订单数', value: `${refundedOrders.length} 笔`, icon: Undo2, tone: 'bg-warning-soft text-warning', hint: `退款金额 ${formatMoney(refundedAmount)}` },
    { label: '当前筛选客单价', value: formatMoney(avgTicket), icon: ReceiptText, tone: 'bg-ai-soft text-ai', hint: `共 ${filtered.length} 笔订单` },
  ]

  return (
    <>
      <PageHeader
        title="销售订单"
        breadcrumbs={[{ label: '销售收银' }, { label: '销售订单' }]}
        description="查询收银流水明细，支持按支付方式与订单状态筛选并导出"
        actions={
          <>
            <Button
              variant="outline"
              className="h-9"
              onClick={() =>
                downloadCsv(
                  `销售订单_${todaySuffix()}`,
                  ['订单号', '创建时间', '商品明细', '应收金额', '优惠金额', '实收金额', '支付方式', '收银员', '会员', '状态', '累计退款'],
                  filtered.map((o) => [
                    o.id,
                    o.createdAt,
                    o.items.map((i) => `${i.name} x${i.quantity}`).join(' / '),
                    o.amount,
                    o.discount,
                    o.paid,
                    o.payMethod,
                    o.cashier,
                    o.memberName ?? '',
                    o.status,
                    o.refunded,
                  ]),
                )
              }
            >
              <Download data-icon="inline-start" />
              导出数据
            </Button>
            <Button className="h-9" render={<Link href="/cashier" />} nativeButton={false}>
              <ReceiptText data-icon="inline-start" />
              前往收银台
            </Button>
          </>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="订单列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="搜索订单号、会员或商品"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索订单号 / 会员 / 手机号 / 商品"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <FilterSelect label="支付方式" value={pay} onChange={(v) => { setPay(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...payMethods.map((p) => ({ value: p, label: p }))]} className="w-36" />
          <FilterSelect label="订单状态" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...statuses.map((s) => ({ value: s, label: s }))]} />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[1180px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">订单号</TableHead>
              <TableHead>下单时间</TableHead>
              <TableHead className="min-w-52">商品</TableHead>
              <TableHead className="text-right">商品件数</TableHead>
              <TableHead className="text-right">应收金额</TableHead>
              <TableHead className="text-right">优惠</TableHead>
              <TableHead className="text-right">实收金额</TableHead>
              <TableHead>支付方式</TableHead>
              <TableHead>会员</TableHead>
              <TableHead>收银员</TableHead>
              <TableHead>订单状态</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={12} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的订单</p>
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
                    <TableCell className="pl-5 font-mono text-xs">{o.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{o.createdAt}</TableCell>
                    <TableCell>
                      <span className="block max-w-56 truncate text-foreground">{o.items.map((i) => i.name).join('、')}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {o.items.length} 种商品
                        {o.refunded > 0 && <span className="ml-1.5 text-[oklch(0.5_0.12_60)]">已退 {formatMoney(o.refunded)}</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{qty}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(o.amount)}</TableCell>
                    <TableCell className={cn('text-right tabular-nums', o.discount > 0 ? 'text-success' : 'text-muted-foreground')}>
                      {o.discount > 0 ? `-${formatMoney(o.discount)}` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatMoney(o.paid)}</TableCell>
                    <TableCell>{o.payMethod}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.memberName ? (
                        <>
                          <span className="block text-foreground">{o.memberName}</span>
                          <span className="mt-0.5 block">{o.memberPhone}</span>
                        </>
                      ) : (
                        '非会员'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{o.cashier}</TableCell>
                    <TableCell>
                      <StatusBadge tone={saleOrderStatusTone[o.status]}>{o.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setDetail(o)}>
                          <Eye data-icon="inline-start" />
                          查看明细
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          disabled={o.status === '已退款'}
                          render={<Link href={`/refunds?order=${o.id}`} />}
                          nativeButton={false}
                        >
                          <Undo2 data-icon="inline-start" />
                          发起退货
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
        <p className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
          本页展示全部 {saleOrders.length} 笔收银流水（实时数据库），与经营工作台的当日汇总口径不同；收银台完成结算后会实时写入本列表。
        </p>
      </section>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full gap-0 p-0 sm:w-[520px] sm:max-w-[520px]">
          {detail && (
            <>
              <SheetHeader className="border-b border-border px-6 py-4">
                <SheetTitle className="text-base">订单明细</SheetTitle>
                <SheetDescription>
                  {detail.id} · {detail.createdAt} · {detail.payMethod}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={saleOrderStatusTone[detail.status]}>{detail.status}</StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    收银员 {detail.cashier} · {detail.memberName ? `会员 ${detail.memberName}（${detail.memberPhone}）` : '非会员'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-[13px]">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">商品</th>
                        <th className="px-3 py-2 text-right font-medium">单价</th>
                        <th className="px-3 py-2 text-right font-medium">数量</th>
                        <th className="px-3 py-2 text-right font-medium">金额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detail.items.map((i) => (
                        <tr key={i.productId}>
                          <td className="px-3 py-2">
                            <span className="block max-w-56 truncate font-medium text-foreground">{i.name}</span>
                            <span className="text-xs text-muted-foreground">{i.productId}</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatMoney(i.price)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {i.quantity} {i.unit}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">{formatMoney(i.price * i.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <dl className="mt-4 divide-y divide-border rounded-lg border border-border text-[13px]">
                  {[
                    ['应收金额', formatMoney(detail.amount)],
                    ['优惠金额', detail.discount > 0 ? `-${formatMoney(detail.discount)}` : '—'],
                    ['实收金额', formatMoney(detail.paid)],
                    ['退款金额', detail.refunded > 0 ? formatMoney(detail.refunded) : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-3.5 py-2.5">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-medium text-foreground tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  口径：应收＝商品金额合计；优惠含会员折扣与抹零；实收＝应收－优惠。退款金额为累计已退款金额。
                </p>
              </div>

              <SheetFooter className="flex-row justify-end border-t border-border px-6 py-4">
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => {
                    const ok = printReceipt({
                      orderId: detail.id,
                      createdAt: detail.createdAt,
                      cashier: detail.cashier,
                      storeName: currentStore.name,
                      items: detail.items,
                      amount: detail.amount,
                      discount: detail.discount,
                      paid: detail.paid,
                      payMethod: detail.payMethod,
                      memberName: detail.memberName,
                      status: detail.status,
                      refunded: detail.refunded,
                    })
                    if (ok) toast.success('已调起打印', { description: `${detail.id} · 可在打印窗口选择打印机或另存为 PDF` })
                    else toast.info('浏览器拦截了打印窗口', { description: '请允许本站弹出窗口后重试' })
                  }}
                >
                  <Printer data-icon="inline-start" />
                  打印小票
                </Button>
                <Button className="h-9" disabled={detail.status === '已退款'} render={<Link href={`/refunds?order=${detail.id}`} />} nativeButton={false}>
                  <Undo2 data-icon="inline-start" />
                  发起退货
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
