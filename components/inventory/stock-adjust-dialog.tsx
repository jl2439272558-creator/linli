'use client'

import { useState } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDemoStore } from '@/components/providers/demo-store'
import { getStockStatus, type Product, type StockAdjustType } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const typeOptions: { value: StockAdjustType; label: string; sign: 1 | -1; hint: string }[] = [
  { value: '入库补录', label: '入库补录', sign: 1, hint: '补录未走采购单的到货库存' },
  { value: '出库', label: '出库', sign: -1, hint: '门店调出、赠品等非销售出库' },
  { value: '报损', label: '报损', sign: -1, hint: '破损、过期商品登记报废' },
  { value: '盘盈亏', label: '库存盘点', sign: 1, hint: '填写实盘数量，系统自动计算盈亏' },
]

export function StockAdjustDialog({
  product,
  presetType,
  onOpenChange,
}: {
  product: Product | null
  presetType?: StockAdjustType
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {product && (
          <AdjustForm
            key={`${product.id}-${presetType ?? 'default'}`}
            product={product}
            presetType={presetType}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AdjustForm({ product, presetType, onDone }: { product: Product; presetType?: StockAdjustType; onDone: () => void }) {
  const { adjustStock } = useDemoStore()
  const [type, setType] = useState<StockAdjustType>(presetType ?? '入库补录')
  const [qty, setQty] = useState('1')
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)

  const config = typeOptions.find((t) => t.value === type) ?? typeOptions[0]
  const num = Number(qty)
  const valid = qty.trim() !== '' && !Number.isNaN(num) && num >= 0
  const delta = type === '盘盈亏' ? num - product.stock : config.sign * num
  const after = Math.max(0, product.stock + delta)
  const afterStatus = getStockStatus({ stock: after, safetyStock: product.safetyStock })

  const submit = () => {
    if (!valid) {
      toast.info('请输入正确的数量', { description: '数量需为不小于 0 的整数' })
      return
    }
    if (type !== '盘盈亏' && num === 0) {
      toast.info('请输入大于 0 的数量')
      return
    }
    setSaving(true)
    setTimeout(() => {
      adjustStock(product.id, delta)
      setSaving(false)
      onDone()
      toast.success(`库存已${delta >= 0 ? '增加' : '减少'} ${Math.abs(delta)} ${product.unit}`, {
        description: `${product.name} · ${type} · 调整后 ${after} ${product.unit}`,
      })
    }, 500)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>库存调整</DialogTitle>
        <DialogDescription>
          {product.name} · 当前库存 {product.stock} {product.unit} · 安全库存 {product.safetyStock} {product.unit}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">调整类型</Label>
          <Select items={typeOptions.map((t) => ({ value: t.value, label: t.label }))} value={type} onValueChange={(v) => v && setType(v as StockAdjustType)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">{config.hint}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">{type === '盘盈亏' ? '实盘数量' : '调整数量'}</Label>
            <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" className="h-9" aria-label="调整数量" />
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">备注（选填）</Label>
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} className="h-9" placeholder="如：供应商送货、破损登记" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">调整后库存</span>
            <span className="font-semibold tabular-nums">
              {after} {product.unit}
              <span className={cn('ml-2 text-xs', delta >= 0 ? 'text-success' : 'text-danger')}>
                （{delta >= 0 ? '+' : ''}
                {delta}）
              </span>
            </span>
          </div>
          {afterStatus !== '正常' && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[oklch(0.5_0.12_60)]">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              调整后将低于安全库存，商品会进入库存预警
            </p>
          )}
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" className="h-9" onClick={onDone}>
          取消
        </Button>
        <Button className="h-9" disabled={saving} onClick={submit}>
          {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
          确认调整
        </Button>
      </DialogFooter>
    </>
  )
}
