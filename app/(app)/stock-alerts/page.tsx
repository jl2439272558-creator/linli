import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '库存预警' }

export default function StockAlertsPage() {
  return (
    <PlaceholderView
      title="库存预警"
      group="库存采购"
      description="低于安全库存与缺货商品的预警清单"
      features={[
        '按安全库存阈值自动生成预警清单，可设置预警规则',
        '支持一键把预警商品加入采购单，采购量按补货公式推荐',
        '预警消息推送到顶部通知，并可指定接收人',
      ]}
      links={[
        { label: '库存管理', href: '/inventory' },
        { label: '采购管理', href: '/purchase' },
        { label: '入库管理', href: '/stock-in' },
      ]}
    />
  )
}
