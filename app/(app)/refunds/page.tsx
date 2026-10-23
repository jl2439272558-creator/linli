import { RefundsView } from '@/components/refunds/refunds-view'

export const metadata = { title: '退货退款' }

export default async function RefundsPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams
  return <RefundsView initialOrder={order} />
}
