'use client'

import { useMemo, useRef, useState } from 'react'
import { ArchiveRestore, Banknote, Minus, PackageX, Pause, Plus, Printer, ScanLine, ShoppingCart, Trash2, UserRound, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PageHeader } from '@/components/common/page-header'
import { ProductThumb } from '@/components/common/product-thumb'
import { useDemoStore } from '@/components/providers/demo-store'
import { categories, getStockStatus, members, payMethods, type PayMethod, type Product } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { printReceipt } from '@/lib/print-receipt'
import { cn } from '@/lib/utils'

type CartLine = { productId: string; name: string; price: number; unit: string; qty: number; stock: number }

const MEMBER_RATE = 0.05

export function CashierView() {
  const { products, currentStore, checkoutSale, heldOrders, holdCart, takeHeld } = useDemoStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [cart, setCart] = useState<CartLine[]>([])
  const [member, setMember] = useState(false)
  const [memberId, setMemberId] = useState(members[0].id)
  const [payMethod, setPayMethod] = useState<PayMethod>('微信支付')
  const [roundOff, setRoundOff] = useState(true)
  const [checking, setChecking] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sellable = products.filter((p) => p.status === '在售')
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sellable.filter((p) => {
      if (category !== '全部' && p.category !== category) return false
      if (q && !p.name.toLowerCase().includes(q) && !(p.barcode ?? '').includes(q)) return false
      return true
    })
  }, [sellable, query, category])

  const cats = ['全部', ...categories.filter((c) => sellable.some((p) => p.category === c))]

  const add = (p: Product) => {
    if (p.retailPrice === null) {
      toast.info('该商品未设置零售价', { description: `${p.name} · 请先在商品管理中补充价格` })
      return
    }
    if (getStockStatus(p) === '缺货') {
      toast.info('该商品已缺货，无法销售', { description: `${p.name} · 建议先登记入库` })
      return
    }
    const inCart = cart.find((l) => l.productId === p.id)?.qty ?? 0
    if (inCart + 1 > p.stock) {
      toast.info('库存不足', { description: `${p.name} 当前库存 ${p.stock} ${p.unit}` })
      return
    }
    setCart((prev) =>
      prev.some((l) => l.productId === p.id)
        ? prev.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { productId: p.id, name: p.name, price: p.retailPrice as number, unit: p.unit, qty: 1, stock: p.stock }],
    )
    setQuery('')
    inputRef.current?.focus()
  }

  const addByCode = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    const p = sellable.find((x) => (x.barcode ?? '').toLowerCase() === q) ?? sellable.find((x) => x.name.toLowerCase() === q)
    if (!p) {
      toast.info('未找到该商品', { description: '请核对条码或从下方商品列表中选择' })
      return
    }
    add(p)
  }

  const setQty = (id: string, qty: number) => {
    setCart((prev) => prev.flatMap((l) => (l.productId === id ? (qty <= 0 ? [] : [{ ...l, qty }]) : [l])))
  }

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0)
  const memberCut = member ? subtotal * MEMBER_RATE : 0
  const afterMember = subtotal - memberCut
  const rounded = roundOff ? Math.floor(afterMember * 10) / 10 : afterMember
  const total = Math.max(0, rounded)
  const count = cart.reduce((s, l) => s + l.qty, 0)

  const checkout = async () => {
    if (!cart.length) {
      toast.info('购物清单为空', { description: '请先扫描或选择商品' })
      return
    }
    const chosen = members.find((m) => m.id === memberId)
    setChecking(true)
    // 单事务：校验并扣减库存 + 写入销售订单，失败时回滚并提示
    const order = await checkoutSale({
      items: cart.map((l) => ({ productId: l.productId, name: l.name, unit: l.unit, price: l.price, quantity: l.qty })),
      amount: subtotal,
      discount: Math.round((subtotal - total) * 100) / 100,
      paid: total,
      payMethod,
      cashier: '王店长',
      memberName: member ? (chosen?.name ?? null) : null,
      memberPhone: member ? (chosen?.phone ?? null) : null,
      status: '已完成',
      refunded: 0,
    })
    setChecking(false)
    if (!order) return
    toast.success(`收款完成 ${formatMoney(total)}`, { description: `${order.id} · ${payMethod} · ${count} 件商品 · 库存已扣减` })
    // 结算后自动调起小票打印（浏览器打印窗口可选实体打印机或另存 PDF）
    const printed = printReceipt({
      orderId: order.id,
      createdAt: order.createdAt,
      cashier: order.cashier,
      storeName: currentStore.name,
      items: order.items,
      amount: order.amount,
      discount: order.discount,
      paid: order.paid,
      payMethod: order.payMethod,
      memberName: order.memberName,
      status: order.status,
    })
    if (printed) toast.success('小票已发送至打印窗口', { description: '未连接打印机时可另存为 PDF' })
    else toast.info('浏览器拦截了打印窗口', { description: '允许弹出窗口后可在订单详情重新打印' })
    setCart([])
    setMember(false)
    inputRef.current?.focus()
  }

  /** 挂单：暂存当前购物车，可随时取回（落库持久化） */
  const hold = async () => {
    if (!cart.length) return
    const chosen = members.find((m) => m.id === memberId)
    const held = await holdCart({
      items: cart,
      amount: total,
      count,
      member,
      memberId: member ? memberId : null,
      memberName: member ? (chosen?.name ?? null) : null,
      memberPhone: member ? (chosen?.phone ?? null) : null,
    })
    if (!held) return
    setCart([])
    setMember(false)
    toast.success('已挂单', { description: `${held.id} · ${held.count} 件商品 · 可通过「取单」取回` })
  }

  /** 取单：恢复挂单内容并从挂单列表移除 */
  const take = (id: string) => {
    const held = takeHeld(id)
    if (!held) return
    setCart(held.items)
    setMember(held.member)
    if (held.memberId) setMemberId(held.memberId)
    setHeldOpen(false)
    toast.success(`已取回挂单 ${held.id}`, { description: `${held.count} 件商品 · ${formatMoney(held.amount)}` })
    inputRef.current?.focus()
  }

  return (
    <>
      <PageHeader
        title="销售收银"
        breadcrumbs={[{ label: '销售收银' }, { label: '收银管理' }]}
        description={`${currentStore.name} · 支持扫码枪、键盘与鼠标操作`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9" onClick={() => setHeldOpen(true)}>
              <ArchiveRestore data-icon="inline-start" />
              取单{heldOrders.length > 0 ? `（${heldOrders.length}）` : ''}
            </Button>
            <Button variant="outline" className="h-9" disabled={!cart.length} onClick={hold}>
              <Pause data-icon="inline-start" />
              挂单
            </Button>
          </div>
        }
      />

      <Sheet open={heldOpen} onOpenChange={setHeldOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>挂单列表</SheetTitle>
            <SheetDescription>暂存的购物车按时间倒序展示，取单后恢复到当前清单</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {heldOrders.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">当前没有挂单</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {heldOrders.map((h) => (
                  <li key={h.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-foreground">{h.id}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{h.createdAt}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {h.count} 件商品 · {formatMoney(h.amount)}
                      {h.memberName ? ` · 会员 ${h.memberName}` : ''}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{h.items.map((i) => `${i.name}×${i.qty}`).join('、')}</p>
                    <Button variant="outline" size="sm" className="mt-2 h-8" onClick={() => take(h.id)}>
                      <ArchiveRestore data-icon="inline-start" />
                      取单
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <section aria-label="商品选择" className="flex flex-col rounded-xl border border-border bg-card md:col-span-2">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
            <div className="relative w-full sm:w-80">
              <ScanLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                autoFocus
                aria-label="扫描条码或搜索商品"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addByCode()
                  }
                }}
                placeholder="扫码后自动回车，或输入商品名称搜索"
                className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
              {query && (
                <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div role="tablist" aria-label="商品分类" className="flex flex-wrap gap-1">
              {cats.map((c) => (
                <button
                  key={c}
                  role="tab"
                  type="button"
                  aria-selected={category === c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'h-8 rounded-md px-2.5 text-xs transition-colors',
                    category === c ? 'bg-brand-soft font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">没有找到匹配的在售商品</p>
          ) : (
            <div className="grid max-h-[420px] grid-cols-3 gap-2.5 overflow-y-auto p-3 scrollbar-thin md:max-h-[600px] md:grid-cols-4 md:gap-3 md:p-5">
              {visible.map((p) => {
                const status = getStockStatus(p)
                const out = status === '缺货'
                const inCart = cart.find((l) => l.productId === p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={out}
                    onClick={() => add(p)}
                    className={cn(
                      'flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors',
                      out ? 'cursor-not-allowed border-border bg-muted/40 opacity-70' : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40',
                      inCart && 'border-primary/60 ring-1 ring-primary/20',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <ProductThumb src={p.image} alt={p.name} size={44} />
                      {inCart ? (
                        <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">{inCart.qty}</span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground tabular-nums">库存 {p.stock}</span>
                      )}
                    </div>
                    <span className="line-clamp-2 min-h-9 text-[13px] font-medium text-foreground">{p.name}</span>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="shrink-0 font-semibold text-primary tabular-nums">{formatMoney(p.retailPrice)}</span>
                      <span className="min-w-0 truncate text-[11px] text-muted-foreground">{p.spec ?? '无规格'}</span>
                    </span>
                    {out && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-danger">
                        <PackageX className="size-3" aria-hidden="true" />
                        缺货
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <div className="flex flex-col rounded-xl border border-border bg-card">
          <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-5">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">本次购物清单</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">共 {count} 件商品</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={!cart.length}
              onClick={() => {
                setCart([])
                toast.info('已清空购物清单')
              }}
            >
              <Trash2 data-icon="inline-start" />
              清空
            </Button>
          </header>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center">
              <ShoppingCart className="size-8 text-muted-foreground/50" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm text-foreground">购物清单为空</p>
              <p className="text-xs text-muted-foreground">扫描条码或点击上方商品加入清单</p>
            </div>
          ) : (
            <ul className="divide-y divide-border md:max-h-[360px] md:overflow-y-auto scrollbar-thin">
              {cart.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">{l.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {formatMoney(l.price)} / {l.unit} · 库存 {l.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`减少 ${l.name} 数量`}
                      onClick={() => setQty(l.productId, l.qty - 1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-[13px] font-medium tabular-nums">{l.qty}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`增加 ${l.name} 数量`}
                      onClick={() => setQty(l.productId, l.qty + 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <span className="w-20 text-right text-[13px] font-semibold tabular-nums">{formatMoney(l.price * l.qty)}</span>
                  <Button variant="ghost" size="icon-sm" aria-label={`移除 ${l.name}`} className="text-muted-foreground hover:text-danger" onClick={() => setQty(l.productId, 0)}>
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="sticky bottom-14 z-10 border-t border-border bg-card px-4 py-4 md:static md:bottom-auto md:z-auto md:px-5">
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">商品金额</span>
                <span className="tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              <label className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                  会员折扣（9.5 折）
                </span>
                <Switch checked={member} onCheckedChange={(v) => setMember(!!v)} aria-label="会员折扣" />
              </label>
              {member && (
                <Select
                  items={members.map((m) => ({ value: m.id, label: `${m.name} · ${m.level}` }))}
                  value={memberId}
                  onValueChange={(v) => v && setMemberId(v as string)}
                >
                  <SelectTrigger className="h-8 w-full text-[13px]" aria-label="选择会员">
                    <UserRound className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {`${m.name} · ${m.level} · ${m.points} 积分`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">优惠金额</span>
                <span className="text-success tabular-nums">-{formatMoney(memberCut + (roundOff ? afterMember - rounded : 0))}</span>
              </div>
              <label className="flex items-center justify-between gap-2">
                <span className="min-w-0 text-muted-foreground">抹零（保留 1 位小数）</span>
                <Switch checked={roundOff} onCheckedChange={(v) => setRoundOff(!!v)} aria-label="抹零" />
              </label>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-xs text-muted-foreground">支付方式</p>
              <div role="radiogroup" aria-label="支付方式" className="flex rounded-lg bg-muted p-0.5">
                {payMethods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={payMethod === m}
                    onClick={() => setPayMethod(m)}
                    className={cn(
                      'h-7 flex-1 rounded-md text-xs transition-colors',
                      payMethod === m ? 'bg-background font-medium text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
              <span className="text-[13px] text-muted-foreground">应收金额</span>
              <span className="text-2xl font-semibold text-primary tabular-nums">{formatMoney(total)}</span>
            </div>

            <Button className="mt-4 h-12 w-full text-base" disabled={checking || !cart.length} onClick={checkout}>
              <Banknote data-icon="inline-start" />
              {checking ? '收款处理中…' : `结算收款 ${formatMoney(total)}`}
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Printer className="size-3" aria-hidden="true" />
              结算后自动调起小票打印，可选择打印机或另存为 PDF
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
