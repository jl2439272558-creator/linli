'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { MobileTabBar } from './mobile-tab-bar'

/**
 * 应用外壳：桌面端为「固定侧边栏 + 顶栏」，手机端为「抽屉菜单 + 顶栏 + 底部 TabBar」。
 * 抽屉开合状态在此统一管理；路由切换后自动收起。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const pathname = usePathname()

  // 路由切换自动关闭抽屉
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  // 抽屉打开时锁定背景滚动，Esc 关闭
  useEffect(() => {
    if (!navOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [navOpen])

  return (
    <div className="min-h-screen">
      <AppSidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-h-screen flex-col md:pl-[230px]">
        <AppHeader onOpenNav={() => setNavOpen(true)} />
        <main className="flex-1 px-4 pt-4 pb-20 md:px-6 md:pt-6 md:pb-6">{children}</main>
      </div>
      <MobileTabBar onOpenNav={() => setNavOpen(true)} />
    </div>
  )
}
