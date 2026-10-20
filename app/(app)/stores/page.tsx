import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '门店列表' }

export default function StoresPage() {
  return (
    <PlaceholderView
      title="门店列表"
      group="门店管理"
      description="多门店资料与经营状态管理"
      features={[
        '新增门店、维护地址与营业时间，支持门店停业与恢复',
        '查看各门店的经营指标概览与库存状态',
        '按门店配置独立的商品上架范围与价格策略',
      ]}
      links={[
        { label: '经营工作台', href: '/' },
        { label: '库存管理', href: '/inventory' },
      ]}
    />
  )
}
