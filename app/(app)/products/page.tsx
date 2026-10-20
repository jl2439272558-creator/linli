import { Suspense } from 'react'
import { ProductsView } from '@/components/products/products-view'

export const metadata = { title: '商品管理' }

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsView />
    </Suspense>
  )
}
