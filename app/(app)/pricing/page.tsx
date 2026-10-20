import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '价格管理' }

export default function PricingPage() {
  return (
    <PlaceholderView
      title="价格管理"
      group="商品中心"
      description="批量调价、会员价与促销价格管理"
      features={[
        '零售价、会员价、最低售价的批量维护与校验',
        '调价需人工确认后生效，并保留调价记录与操作人',
        '支持按分类或供应商批量调价，调价前预览毛利变化',
      ]}
      links={[
        { label: '商品管理', href: '/products' },
        { label: 'AI 经营助手', href: '/ai-assistant' },
      ]}
    />
  )
}
