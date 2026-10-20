import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '退货退款' }

export default function RefundsPage() {
  return (
    <PlaceholderView
      title="退货退款"
      group="销售收银"
      description="退货登记与库存回滚"
      features={[
        '按订单号或条码发起退货，支持部分退货',
        '退货确认后自动回滚库存，并记录退款方式与操作人',
        '退货原因统计，用于商品质量与供应商评估',
      ]}
      links={[
        { label: '销售收银', href: '/cashier' },
        { label: '库存管理', href: '/inventory' },
      ]}
    />
  )
}
