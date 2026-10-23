import { OrdersView } from '@/components/orders/orders-view'

export const metadata = { title: '销售订单' }

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return <OrdersView initialQuery={q} />
}
