'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, LayoutDashboard, Menu, Package, WalletCards } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 手机端底部导航：工作台 / 商品 / 库存 / 收银 / 更多（打开完整菜单抽屉）。
 * 桌面端隐藏（md:hidden）；高度 56px + iOS 底部安全区。
 */
const tabs = [
  { label: '工作台', href: '/', icon: LayoutDashboard, match: (p: string) => p === '/' },
  { label: '商品', href: '/products', icon: Package, match: (p: string) => p.startsWith('/products') || p.startsWith('/ai-collect') || p.startsWith('/ai-review') || p.startsWith('/categories') || p.startsWith('/brands') || p.startsWith('/pricing') },
  { label: '库存', href: '/inventory', icon: Boxes, match: (p: string) => p.startsWith('/inventory') || p.startsWith('/stock-in') || p.startsWith('/purchase') || p.startsWith('/stock-alerts') || p.startsWith('/suppliers') },
  { label: '收银', href: '/cashier', icon: WalletCards, match: (p: string) => p.startsWith('/cashier') || p.startsWith('/orders') || p.startsWith('/refunds') },
]

export function MobileTabBar({ onOpenNav }: { onOpenNav: () => void }) {
  const pathname = usePathname()
  const inMainTabs = tabs.some((t) => t.match(pathname))

  return (
    <nav
      aria-label="底部导航"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
    >
      <ul className="mx-auto grid h-14 max-w-md grid-cols-5">
        {tabs.map((t) => {
          const active = t.match(pathname)
          const Icon = t.icon
          return (
            <li key={t.label}>
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors',
                  active ? 'font-medium text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
                {t.label}
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={onOpenNav}
            aria-label="打开全部菜单"
            className={cn(
              'flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors',
              !inMainTabs ? 'font-medium text-primary' : 'text-muted-foreground',
            )}
          >
            <Menu className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
            更多
          </button>
        </li>
      </ul>
    </nav>
  )
}
