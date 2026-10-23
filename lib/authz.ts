import { permissionModules, rolePermissions, type StaffRole } from '@/lib/mock-data'
import { navGroups, type NavGroup } from '@/lib/nav'

export type PermissionModule = (typeof permissionModules)[number]

/** 路由 → 权限模块：与侧边栏分组、角色权限矩阵一一对应 */
const PATH_MODULES: { prefixes: string[]; module: PermissionModule }[] = [
  { prefixes: ['/', '/reports', '/ai-assistant'], module: '经营报表' },
  { prefixes: ['/products', '/ai-collect', '/ai-review', '/categories', '/brands', '/pricing', '/ai-tasks'], module: '商品管理' },
  { prefixes: ['/inventory', '/stock-in', '/stock-alerts'], module: '库存管理' },
  { prefixes: ['/purchase', '/suppliers'], module: '采购入库' },
  { prefixes: ['/cashier', '/orders'], module: '销售收银' },
  { prefixes: ['/refunds'], module: '退货退款' },
  { prefixes: ['/stores', '/staff', '/settings', '/subscription'], module: '系统设置' },
]

/** 当前路径所属权限模块（前缀匹配，长路径优先） */
export function moduleOfPath(pathname: string): PermissionModule | null {
  let best: { len: number; module: PermissionModule } | null = null
  for (const entry of PATH_MODULES) {
    for (const p of entry.prefixes) {
      const hit = p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`)
      if (hit && (!best || p.length > best.len)) best = { len: p.length, module: entry.module }
    }
  }
  return best?.module ?? null
}

export function hasPermission(role: StaffRole, pathname: string): boolean {
  const module = moduleOfPath(pathname)
  if (!module) return true
  return rolePermissions[role].includes(module)
}

/** 角色的默认首页：按优先级取第一个有权访问的页面 */
export function defaultHome(role: StaffRole): string {
  const candidates = ['/', '/products', '/cashier']
  return candidates.find((p) => hasPermission(role, p)) ?? '/cashier'
}

/** 按角色过滤侧边栏分组，空分组整体隐藏 */
export function visibleNavGroups(role: StaffRole): NavGroup[] {
  return navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        const module = moduleOfPath(item.href)
        return module ? rolePermissions[role].includes(module) : true
      }),
    }))
    .filter((g) => g.items.length > 0)
}
