import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '供应商管理' }

export default function SuppliersPage() {
  return (
    <PlaceholderView
      title="供应商管理"
      group="库存采购"
      description="维护供应商资料、供货范围与合作记录"
      features={[
        '维护供应商联系方式、供货分类与合作状态',
        '查看供应商的采购金额、到货准时率与差异记录',
        '商品默认供应商可在商品档案中关联，用于采购建议归集',
      ]}
      links={[
        { label: '采购管理', href: '/purchase' },
        { label: '入库管理', href: '/stock-in' },
      ]}
    />
  )
}
