import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '品牌管理' }

export default function BrandsPage() {
  return (
    <PlaceholderView
      title="品牌管理"
      group="商品中心"
      description="维护品牌资料，用于商品建档与 AI 识别匹配"
      features={[
        '维护品牌名称、别名与所属分类，供 AI 采集时匹配',
        '查看品牌下的商品数量、销售占比与平均毛利率',
        '品牌 Logo 与资料可在商品列表与价签中复用',
      ]}
      links={[
        { label: '商品管理', href: '/products' },
        { label: 'AI 商品采集', href: '/ai-collect' },
      ]}
    />
  )
}
