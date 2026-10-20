import {
  Bot,
  Boxes,
  CreditCard,
  FileBarChart,
  FolderTree,
  LayoutDashboard,
  ListChecks,
  Package,
  PackagePlus,
  ReceiptText,
  ScanLine,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  TriangleAlert,
  Truck,
  Undo2,
  Users,
  WalletCards,
  Award,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  ready?: boolean
  badge?: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: '经营总览',
    items: [
      { title: '经营工作台', href: '/', icon: LayoutDashboard, ready: true },
      { title: '经营报表', href: '/reports', icon: FileBarChart },
    ],
  },
  {
    label: '商品中心',
    items: [
      { title: '商品管理', href: '/products', icon: Package, ready: true },
      { title: 'AI 商品采集', href: '/ai-collect', icon: ScanLine, ready: true, badge: 'AI' },
      { title: '商品分类', href: '/categories', icon: FolderTree },
      { title: '品牌管理', href: '/brands', icon: Award },
      { title: '价格管理', href: '/pricing', icon: Tag },
    ],
  },
  {
    label: '库存采购',
    items: [
      { title: '库存管理', href: '/inventory', icon: Boxes, ready: true },
      { title: '入库管理', href: '/stock-in', icon: PackagePlus, ready: true },
      { title: '采购管理', href: '/purchase', icon: ShoppingCart, ready: true },
      { title: '库存预警', href: '/stock-alerts', icon: TriangleAlert },
      { title: '供应商管理', href: '/suppliers', icon: Truck },
    ],
  },
  {
    label: '销售收银',
    items: [
      { title: '收银管理', href: '/cashier', icon: WalletCards, ready: true },
      { title: '销售订单', href: '/orders', icon: ReceiptText },
      { title: '退货退款', href: '/refunds', icon: Undo2 },
    ],
  },
  {
    label: '门店管理',
    items: [
      { title: '门店列表', href: '/stores', icon: Store },
      { title: '员工与权限', href: '/staff', icon: Users },
    ],
  },
  {
    label: 'AI 助手',
    items: [
      { title: 'AI 经营助手', href: '/ai-assistant', icon: Bot, ready: true },
      { title: 'AI 任务记录', href: '/ai-tasks', icon: ListChecks },
    ],
  },
  {
    label: '系统设置',
    items: [
      { title: '基础设置', href: '/settings', icon: Settings },
      { title: '账号与订阅', href: '/subscription', icon: CreditCard },
    ],
  },
]

export const allNavItems = navGroups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label })))

/** 审核页是采集中心的子页面，导航高亮跟随「AI 商品采集」 */
export function resolveActiveHref(pathname: string) {
  if (pathname.startsWith('/ai-review')) return '/ai-collect'
  return pathname
}

export const pageMeta: Record<string, { title: string; group: string }> = {
  '/ai-review': { title: 'AI 识别结果审核', group: '商品中心' },
}
