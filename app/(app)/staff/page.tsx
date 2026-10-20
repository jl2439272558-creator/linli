import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '员工与权限' }

export default function StaffPage() {
  return (
    <PlaceholderView
      title="员工与权限"
      group="门店管理"
      description="员工账号、角色与功能权限管理"
      features={[
        '维护员工账号与所属门店，支持邀请与停用',
        '按角色分配功能权限：商品、库存、采购、收银、报表',
        '关键操作（调价、删除、入库确认）支持二次校验与操作留痕',
      ]}
      links={[
        { label: '账号与订阅', href: '/subscription' },
        { label: '商品管理', href: '/products' },
      ]}
    />
  )
}
