'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/common/section-card'
import { ProductThumb } from '@/components/common/product-thumb'
import { StatusBadge } from '@/components/common/status-badge'
import { useDemoStore } from '@/components/providers/demo-store'
import { getStockStatus } from '@/lib/mock-data'

export function StockAlertList() {
  const { products } = useDemoStore()
  const [planned, setPlanned] = useState<string[]>([])
  const alerts = products
    .filter((p) => getStockStatus(p) !== '正常')
    .sort((a, b) => a.stock / a.safetyStock - b.stock / b.safetyStock)
    .slice(0, 5)

  return (
    <SectionCard
      title="库存预警"
      description="低于安全库存的商品"
      bodyClassName="p-0"
      actions={
        <Button variant="ghost" size="sm" className="text-primary" render={<Link href="/products?stock=预警" />} nativeButton={false}>
          查看全部
        </Button>
      }
    >
      {alerts.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">暂无库存预警</p>
      ) : (
        <ul className="divide-y divide-border">
          {alerts.map((p) => {
            const status = getStockStatus(p)
            const isPlanned = planned.includes(p.id)
            return (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <ProductThumb src={p.image} alt={p.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {'库存 '}
                    <span className={status === '缺货' ? 'font-medium text-danger' : 'font-medium text-[oklch(0.5_0.12_60)]'}>
                      {p.stock}
                    </span>
                    {` / 安全库存 ${p.safetyStock} ${p.unit}`}
                  </p>
                </div>
                <StatusBadge tone={status === '缺货' ? 'danger' : 'warning'}>{status}</StatusBadge>
                <Button
                  variant={isPlanned ? 'ghost' : 'outline'}
                  size="sm"
                  disabled={isPlanned}
                  onClick={() => {
                    setPlanned((prev) => [...prev, p.id])
                    toast.success(`已将「${p.name}」加入采购清单`, {
                      description: `建议采购 ${Math.max(p.safetyStock * 2 - p.stock, p.safetyStock)} ${p.unit}`,
                    })
                  }}
                >
                  {isPlanned ? <Check data-icon="inline-start" /> : <ShoppingCart data-icon="inline-start" />}
                  {isPlanned ? '已加入' : '补货'}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
