import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '账号与订阅' }

export default function SubscriptionPage() {
  return (
    <PlaceholderView
      title="账号与订阅"
      group="系统设置"
      description="订阅套餐、门店额度与增值服务"
      features={[
        '查看当前套餐、到期时间与门店 / 员工数量额度',
        '按门店数量与功能模块升级套餐，支持开具发票',
        'AI 采集与识别额度使用情况统计与续购',
      ]}
      links={[
        { label: '门店列表', href: '/stores' },
        { label: '员工与权限', href: '/staff' },
      ]}
    />
  )
}
