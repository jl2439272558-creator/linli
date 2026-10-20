'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { brand } from '@/lib/brand'
import { navGroups, resolveActiveHref } from '@/lib/nav'
import { BrandLogo } from './brand-logo'

export function AppSidebar() {
  const pathname = usePathname()
  const active = resolveActiveHref(pathname)

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[230px] flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-[60px] shrink-0 items-center border-b border-sidebar-border px-5">
        <Link href="/" aria-label={`${brand.name} 首页`}>
          <BrandLogo />
        </Link>
      </div>

      <nav aria-label="主导航" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground/80">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = active === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group relative flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] transition-colors',
                        isActive
                          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {isActive && (
                        <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-primary" />
                      )}
                      <Icon
                        className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <span className="rounded bg-ai-soft px-1.5 py-px text-[10px] font-semibold text-ai">{item.badge}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Link
          href="/subscription"
          className="flex items-center gap-3 rounded-lg bg-muted/70 px-3 py-2.5 transition-colors hover:bg-muted"
        >
          <div className="flex size-8 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
            <Crown className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[13px] font-medium text-foreground">{brand.plan}</p>
            <p className="text-[11px] text-muted-foreground">
              {'剩余 '}
              <span className="font-medium text-foreground tabular-nums">{brand.planDaysLeft}</span>
              {' 天 · 续费'}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
