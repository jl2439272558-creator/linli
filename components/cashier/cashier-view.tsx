'use client'

import { useMemo, useRef, useState } from 'react'
import { Banknote, Minus, PackageX, Plus, Printer, ScanLine, ShoppingCart, Trash2, UserRound, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/common/page-header'
import { ProductThumb } from '@/components/common/product-thumb'
import { useDemoStore } from '@/components/providers/demo-store'
import { categories, getStockStatus, type Product } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

type CartLine = { productId: string; name: string; price: number; unit: string; qty: number; stock: number }

const MEMBER_RATE = 0.05

export function CashierView() {
  const { products, currentStore } = useDemoStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [cart, setCart] = useState<CartLine[]>([])
  const [member, setMember] = useState(false)
  const [roundOff, setRoundOff] = useState(true)
  const [checking, setChecking] = useState(false)
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

  const checkout = () => {
    if (!cart.length) {
      toast.info('购物清单为空', { description: '请先扫描或选择商品' })
      return
    }
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      toast.success(`收款完成 ${formatMoney(total)}`, {
        description: `${count} 件商品 · ${member ? '已享会员折扣' : '普通顾客'} · ${currentStore.name}`,
      })
      toast.success('小票已发送至打印机', { description: '演示交互：未连接真实打印设备' })
      setCart([])
      setMember(false)
      inputRef.current?.focus()
    }, 600)
  }

  return (
    <>
      <PageHeader
        title="销售收银"
        breadcrumbs={[{ label: '销售收银' }, { label: '收银管理' }]}
        description={`${currentStore.name} · 支持扫码枪、键盘与鼠标操作`}
        actions={
          <Button
            variant="outline"
            className="h-9"
            disabled={!cart.length}
            onClick={() => toast.info('已挂单', { description: `当前 ${count} 件商品已暂存，可在收银记录中取回（演示交互）` })}
          >
            <ShoppingCart data-icon="inline-start" />
            挂单
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <section aria-label="商品选择" className="col-span-2 flex flex-col rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
            <div className="relative w-80">
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
            <div className="grid max-h-[600px] grid-cols-4 gap-3 overflow-y-auto p-5 scrollbar-thin">
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
                      <span className="font-semibold text-primary tabular-nums">{formatMoney(p.retailPrice)}</span>
                      <span className="text-[11px] text-muted-foreground">{p.spec ?? '无规格'}</span>
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
          <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-5 py-3">
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
              <p className="text-xs text-muted-foreground">扫描条码或点击左侧商品加入清单</p>
            </div>
          ) : (
            <ul className="max-h-[360px] divide-y divide-border overflow-y-auto scrollbar-thin">
              {cart.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 px-5 py-3">
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

          <div className="border-t border-border px-5 py-4">
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">商品金额</span>
                <span className="tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              <label className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="size-3.5" aria-hidden="true" />
                  会员折扣（9.5 折）
                </span>
                <Switch checked={member} onCheckedChange={(v) => setMember(!!v)} aria-label="会员折扣" />
              </label>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">优惠金额</span>
                <span className="text-success tabular-nums">-{formatMoney(memberCut + (roundOff ? afterMember - rounded : 0))}</span>
              </div>
              <label className="flex items-center justify-between">
                <span className="text-muted-foreground">抹零（保留 1 位小数）</span>
                <Switch checked={roundOff} onCheckedChange={(v) => setRoundOff(!!v)} aria-label="抹零" />
              </label>
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
              结算后将自动打印小票（演示交互，未连接真实设备）
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
