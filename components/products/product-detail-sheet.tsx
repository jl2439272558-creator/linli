'use client'

import { Pencil, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ProductThumb } from '@/components/common/product-thumb'
import { StatusBadge } from '@/components/common/status-badge'
import { getStockStatus, type Product } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { stockTone } from './stock-tone'

export function ProductDetailSheet({
  product,
  onOpenChange,
  onEdit,
}: {
  product: Product | null
  onOpenChange: (open: boolean) => void
  onEdit: (p: Product) => void
}) {
  const status = product ? getStockStatus(product) : '正常'
  const margin =
    product?.purchasePrice != null && product.retailPrice
      ? ((product.retailPrice - product.purchasePrice) / product.retailPrice) * 100
      : null

  return (
    <Sheet open={!!product} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] gap-0 p-0 sm:max-w-[440px]">
        {product && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle className="text-base">商品详情</SheetTitle>
              <SheetDescription>商品编号 {product.id}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex gap-4">
                <ProductThumb src={product.image} alt={product.name} size={104} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold leading-snug text-foreground text-pretty">{product.name}</h3>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{product.barcode ?? '未录入条码'}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StatusBadge tone={stockTone[status]}>{status}</StatusBadge>
                    <StatusBadge tone={product.source === 'AI 采集' ? 'ai' : 'neutral'} dot={false}>
                      {product.source === 'AI 采集' && <ScanLine className="size-3" aria-hidden="true" />}
                      {product.source}
                    </StatusBadge>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <Metric label="零售价" value={formatMoney(product.retailPrice)} strong />
                <Metric label="进货价" value={formatMoney(product.purchasePrice)} />
                <Metric label="毛利率" value={margin === null ? '—' : `${margin.toFixed(1)}%`} />
              </div>

              <h4 className="mt-6 mb-2 text-[13px] font-medium text-foreground">基础信息</h4>
              <dl className="divide-y divide-border rounded-lg border border-border text-[13px]">
                {[
                  ['商品分类', product.category],
                  ['品牌', product.brand],
                  ['规格', product.spec ?? '—'],
                  ['销售单位', product.unit],
                  ['当前库存', `${product.stock} ${product.unit}`],
                  ['安全库存', `${product.safetyStock} ${product.unit}`],
                  ['最近更新', product.updatedAt],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-foreground tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <SheetFooter className="flex-row justify-end border-t border-border px-6 py-4">
              <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              <Button className="h-9" onClick={() => onEdit(product)}>
                <Pencil data-icon="inline-start" />
                编辑商品
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={strong ? 'mt-0.5 text-base font-semibold text-primary tabular-nums' : 'mt-0.5 text-base font-semibold tabular-nums'}>{value}</p>
    </div>
  )
}
