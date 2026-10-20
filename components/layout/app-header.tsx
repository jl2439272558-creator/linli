'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, ChevronDown, CircleHelp, LogOut, MapPin, Search, Settings, Sparkles, Store, UserRound } from 'lucide-react'
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
import { notifications as initialNotifications, stores } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const router = useRouter()
  const { storeId, setStoreId, currentStore } = useDemoStore()
  const [query, setQuery] = useState('')
  const [notices, setNotices] = useState(initialNotifications)
  const inputRef = useRef<HTMLInputElement>(null)
  const unread = notices.filter((n) => n.unread).length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submitSearch = () => {
    const q = query.trim()
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur-sm">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="h-9 gap-2 px-3 font-normal">
              <Store className="size-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-[13px] font-medium">{currentStore.name}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-72">
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

      <form
        role="search"
        className="relative w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault()
          submitSearch()
        }}
      >
        <label htmlFor="global-search" className="sr-only">
          全局搜索
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          id="global-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索商品名称、条码、订单号"
          className="h-9 w-full rounded-lg border border-input bg-muted/50 pr-14 pl-9 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/20"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-px font-mono text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="outline"
          className="h-9 gap-1.5 border-ai/30 px-3 text-ai hover:bg-ai-soft hover:text-ai"
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
          <DropdownMenuContent align="end" className="w-80 p-0">
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

        <div className="mx-2 h-6 w-px bg-border" aria-hidden="true" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">王</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-medium">王建国</span>
                  <span className="text-[11px] text-muted-foreground">店长 · 管理员</span>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
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
