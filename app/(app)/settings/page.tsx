import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '基础设置' }

export default function SettingsPage() {
  return (
    <PlaceholderView
      title="基础设置"
      group="系统设置"
      description="门店基础参数、数据导入导出与授权管理"
      features={[
        '设置默认单位、安全库存规则、小票抬头与抹零策略',
        '商品、库存、会员数据的批量导入导出与导入结果校验',
        '查看并撤销第三方数据授权（含美团商品资料授权）',
      ]}
      links={[
        { label: '商品管理', href: '/products' },
        { label: 'AI 商品采集', href: '/ai-collect' },
      ]}
    />
  )
}
