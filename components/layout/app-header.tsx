'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, ChevronDown, CircleHelp, LogOut, MapPin, Menu, Package, ReceiptText, Search, Settings, Sparkles, Store, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDemoStore } from '@/components/providers/demo-store'
import { members, notifications as initialNotifications, stores } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

type Hit = { key: string; kind: '商品' | '订单' | '会员'; title: string; sub: string; href: string; icon: ReactNode }

export function AppHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const router = useRouter()
  const { storeId, setStoreId, currentStore, products, saleOrders } = useDemoStore()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [notices, setNotices] = useState(initialNotifications)
  const inputRef = useRef<HTMLInputElement>(null)
  const unread = notices.filter((n) => n.unread).length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setFocused(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** 跨模块搜索：商品（名称/条码/编号）、销售订单（单号/会员/商品）、会员（姓名/手机号） */
  const results = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const productHits: Hit[] = products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.barcode ?? '').includes(q) || p.id.toLowerCase() === q)
      .slice(0, 5)
      .map((p) => ({
        key: `p-${p.id}`,
        kind: '商品',
        title: p.name,
        sub: `${p.id} · 条码 ${p.barcode ?? '未录入'} · 库存 ${p.stock} ${p.unit} · ${formatMoney(p.retailPrice)}`,
        href: `/products?q=${encodeURIComponent(p.barcode ?? p.name)}`,
        icon: <Package className="size-3.5" strokeWidth={1.75} aria-hidden="true" />,
      }))
    const orderHits: Hit[] = saleOrders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.memberName ?? '').toLowerCase().includes(q) ||
          (o.memberPhone ?? '').includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q)),
      )
      .slice(0, 4)
      .map((o) => ({
        key: `o-${o.id}`,
        kind: '订单',
        title: o.id,
        sub: `${o.createdAt} · 实收 ${formatMoney(o.paid)} · ${o.payMethod}${o.memberName ? ` · 会员 ${o.memberName}` : ''}`,
        href: `/orders?q=${encodeURIComponent(o.id)}`,
        icon: <ReceiptText className="size-3.5" strokeWidth={1.75} aria-hidden="true" />,
      }))
    const memberHits: Hit[] = members
      .filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.id.toLowerCase() === q)
      .slice(0, 3)
      .map((m) => ({
        key: `m-${m.id}`,
        kind: '会员',
        title: `${m.name} · ${m.level}`,
        sub: `${m.id} · ${m.phone} · ${m.points} 积分 · 最近到店 ${m.lastVisitAt}`,
        href: `/orders?q=${encodeURIComponent(m.phone)}`,
        icon: <UserRound className="size-3.5" strokeWidth={1.75} aria-hidden="true" />,
      }))
    return [...productHits, ...orderHits, ...memberHits]
  }, [query, products, saleOrders])

  const open = (href: string) => {
    router.push(href)
    setFocused(false)
    setQuery('')
  }

  const submitSearch = () => {
    const q = query.trim()
    if (results.length) return open(results[cursor]?.href ?? results[0].href)
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
    setFocused(false)
  }

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-sm md:h-[60px] md:flex-nowrap md:gap-4 md:px-6 md:py-0">
      {/* 手机端菜单按钮 */}
      <Button variant="ghost" size="icon-lg" aria-label="打开菜单" className="shrink-0 md:hidden" onClick={onOpenNav}>
        <Menu className="size-5 text-foreground" strokeWidth={1.75} />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="h-9 min-w-0 gap-2 px-3 font-normal">
              <Store className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <span className="max-w-[38vw] truncate text-[13px] font-medium md:max-w-none">{currentStore.name}</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-[min(18rem,calc(100vw-2rem))]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>切换门店</DropdownMenuLabel>
            {stores.map((s) => (
              <DropdownMenuItem
                key={s.id}
                className="items-start gap-2.5 py-2"
                onClick={() => {
                  setStoreId(s.id)
                  if (s.id !== storeId) toast.success(`已切换至「${s.name}」`, { description: '演示数据：各门店共用同一套示例商品' })
                }}
              >
                <MapPin className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-medium">{s.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{s.address}</span>
                </div>
                {s.id === storeId && <Check className="mt-0.5 size-4 text-primary" aria-hidden="true" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/stores')}>管理全部门店</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        className="relative order-3 w-full md:order-none md:w-full md:max-w-md"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
        }}
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            submitSearch()
          }}
        >
          <label htmlFor="global-search" className="sr-only">
            全局搜索
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            id="global-search"
            value={query}
            onFocus={() => setFocused(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setCursor(0)
              setFocused(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setFocused(false)
                inputRef.current?.blur()
                return
              }
              if (e.key === 'ArrowDown' && results.length) {
                e.preventDefault()
                setCursor((c) => (c + 1) % results.length)
              }
              if (e.key === 'ArrowUp' && results.length) {
                e.preventDefault()
                setCursor((c) => (c - 1 + results.length) % results.length)
              }
            }}
            role="combobox"
            aria-expanded={focused && !!query.trim()}
            aria-controls="global-search-results"
            aria-autocomplete="list"
            placeholder="搜索商品、订单号、会员"
            className="h-9 w-full rounded-lg border border-input bg-muted/50 pr-9 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/20 md:pr-14"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-px font-mono text-[10px] text-muted-foreground md:block">
            Ctrl K
          </kbd>
        </form>

        {focused && !!query.trim() && (
          <div id="global-search-results" role="listbox" aria-label="搜索结果" className="absolute top-11 left-0 z-30 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">未找到匹配的商品、订单或会员，可换个关键词试试</p>
            ) : (
              <ul className="scrollbar-thin max-h-96 overflow-y-auto py-1">
                {results.map((r, i) => (
                  <li key={r.key}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={cursor === i}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => open(r.href)}
                      className={cn('flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors', cursor === i ? 'bg-muted' : 'hover:bg-muted/60')}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">{r.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-foreground">{r.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{r.sub}</span>
                      </span>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{r.kind}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-border px-3.5 py-2 text-[11px] text-muted-foreground">
              {results.length > 0
                ? `共 ${results.length} 条结果 · ↑↓ 选择 · Enter 打开 · Esc 关闭`
                : '支持商品名称 / 条码、订单号 / 会员姓名、手机号'}
            </p>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="outline"
          className="hidden h-9 gap-1.5 border-ai/30 px-3 text-ai hover:bg-ai-soft hover:text-ai md:inline-flex"
          render={<Link href="/ai-assistant" />}
          nativeButton={false}
        >
          <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
          AI 助手
        </Button>

        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="帮助中心"
          className="hidden md:flex"
          onClick={() => toast.info('帮助中心', { description: '演示版本：帮助文档将在后续阶段提供' })}
        >
          <CircleHelp className="size-[18px] text-muted-foreground" strokeWidth={1.75} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-lg" aria-label={`通知，${unread} 条未读`} className="relative">
                <Bell className="size-[18px] text-muted-foreground" strokeWidth={1.75} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white ring-2 ring-background">
                    {unread}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))] p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-medium">通知</span>
              <button
                type="button"
                className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                disabled={unread === 0}
                onClick={() => setNotices((prev) => prev.map((n) => ({ ...n, unread: false })))}
              >
                全部标为已读
              </button>
            </div>
            <div className="p-1">
              {notices.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="items-start gap-3 px-3 py-2.5"
                  onClick={() => {
                    setNotices((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
                    if (n.id === 'n1') router.push('/ai-review')
                    else if (n.id === 'n2') router.push('/products?stock=库存偏低')
                    else toast.info(n.title, { description: n.desc })
                  }}
                >
                  <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', n.unread ? 'bg-primary' : 'bg-transparent')} aria-hidden="true" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-foreground">{n.title}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{n.desc}</span>
                    <span className="text-[11px] text-muted-foreground/80">{n.time}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-2 hidden h-6 w-px bg-border md:block" aria-hidden="true" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">王</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start leading-tight md:flex">
                  <span className="text-[13px] font-medium">王建国</span>
                  <span className="text-[11px] text-muted-foreground">店长 · 管理员</span>
                </div>
                <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" aria-hidden="true" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push('/staff')}>
              <UserRound aria-hidden="true" />
              个人信息
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings aria-hidden="true" />
              基础设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info('演示模式', { description: '当前为 UI 演示原型，未接入登录系统' })}>
              <LogOut aria-hidden="true" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
