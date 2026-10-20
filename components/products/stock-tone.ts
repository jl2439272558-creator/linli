import type { Tone } from '@/components/common/status-badge'
import type { StockStatus } from '@/lib/mock-data'

export const stockTone: Record<StockStatus, Tone> = {
  正常: 'success',
  库存偏低: 'warning',
  缺货: 'danger',
}
