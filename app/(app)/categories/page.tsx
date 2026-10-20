import { PlaceholderView } from '@/components/common/placeholder-view'

export const metadata = { title: '商品分类' }

export default function CategoriesPage() {
  return (
    <PlaceholderView
      title="商品分类"
      group="商品中心"
      description="维护商品分类层级与分类排序"
      features={[
        '新增、重命名、合并商品分类，支持二级分类',
        '调整分类排序与收银台分类快捷键顺序',
        '查看每个分类下的商品数量与库存金额',
      ]}
      links={[
        { label: '商品管理', href: '/products' },
        { label: '库存管理', href: '/inventory' },
      ]}
    />
  )
}
