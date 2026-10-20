import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '销售订单' }

export default function OrdersPage() {
  return (
    <PlaceholderView
      title="销售订单"
      group="销售收银"
      description="收银流水与订单明细查询"
      features={[
        '查询门店收银流水，包含商品明细、优惠与实收金额',
        '按支付方式、收银员、时间区间筛选与导出',
        '支持订单备注、重新打印小票与异常订单标记',
      ]}
      links={[
        { label: '销售收银', href: '/cashier' },
        { label: '经营工作台', href: '/' },
      ]}
    />
  )
}
