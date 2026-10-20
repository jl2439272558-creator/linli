import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '经营报表' }

export default function ReportsPage() {
  return (
    <PlaceholderView
      title="经营报表"
      group="经营总览"
      description="日 / 周 / 月经营报表与利润分析"
      features={[
        '按日、周、月导出销售额、订单量、毛利额与客单价报表',
        '按商品、分类、品牌维度查看销售排行与毛利贡献',
        '支持与上一周期对比，并标注统计口径与数据覆盖区间',
        '报表导出为 Excel / CSV，字段与商品档案保持一致',
      ]}
      links={[
        { label: '经营工作台', href: '/' },
        { label: '商品管理', href: '/products' },
        { label: 'AI 经营助手', href: '/ai-assistant' },
      ]}
    />
  )
}
