import { ProductFormPage } from '@/components/products/product-form-page'

export const metadata = { title: '商品新增与编辑' }

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  return <ProductFormPage productId={id} />
}
