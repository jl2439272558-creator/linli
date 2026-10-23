'use client'

import { useState } from 'react'
import { FolderTree, Loader2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDemoStore } from '@/components/providers/demo-store'
import { categories, type Product } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'

export type BulkMode = 'price' | 'category' | null

const priceStrategies = [
  { value: 'fix', label: '统一设为新的零售价', hint: '所选商品零售价全部改为同一价格' },
  { value: 'percent', label: '按现价百分比调整', hint: '正数为上调、负数为下调，例如 -5 表示下调 5%' },
  { value: 'margin', label: '按目标毛利率反推', hint: '按进货价与目标毛利率计算零售价，无进货价的商品将跳过' },
]

function nextPrice(p: Product, strategy: string, value: number): number | null {
  if (p.retailPrice === null) return null
  if (strategy === 'fix') return value
  if (strategy === 'percent') return Math.round(p.retailPrice * (1 + value / 100) * 100) / 100
  if (p.purchasePrice === null || value >= 100) return null
  return Math.round((p.purchasePrice / (1 - value / 100)) * 100) / 100
}

/** 批量调价 / 批量分类：改价与分类调整均由人工在本弹窗确认后生效 */
export function BulkEditDialog({
  mode,
  ids,
  onOpenChange,
  onDone,
}: {
  mode: BulkMode
  ids: string[]
  onOpenChange: (mode: BulkMode) => void
  onDone: () => void
}) {
  const { products, updateProduct } = useDemoStore()
  const targets = products.filter((p) => ids.includes(p.id))
  const [strategy, setStrategy] = useState('percent')
  const [value, setValue] = useState('-5')
  const [category, setCategory] = useState(categories[0])
  const [saving, setSaving] = useState(false)

  const isPrice = mode === 'price'
  const num = Number(value)
  const invalidMessage = (() => {
    if (!isPrice) return null
    if (value.trim() === '' || Number.isNaN(num)) return '请输入数值'
    if (strategy === 'fix' && num <= 0) return '零售价需大于 0'
    if (strategy === 'percent' && (num <= -100 || num > 1000)) return '百分比需在 -100 到 1000 之间'
    if (strategy === 'margin' && (num <= 0 || num >= 100)) return '目标毛利率需在 0 到 100 之间'
    return null
  })()

  const preview = targets.slice(0, 6).map((p) => ({ p, next: invalidMessage ? null : nextPrice(p, strategy, num) }))

  const submit = () => {
    if (!targets.length) {
      toast.info('请先选择要批量处理的商品')
      return
    }
    if (isPrice) {
      if (invalidMessage) {
        toast.info(invalidMessage)
        return
      }
      const changed = preview.filter((r) => r.next !== null).length
      const totalChanged = targets.filter((p) => nextPrice(p, strategy, num) !== null).length
      if (!totalChanged) {
        toast.info('所选商品无法按该规则调价', { description: '商品缺少进货价或零售价，请改用其他方式' })
        return
      }
      setSaving(true)
      setTimeout(() => {
        targets.forEach((p) => {
          const next = nextPrice(p, strategy, num)
          if (next !== null) updateProduct(p.id, { retailPrice: next })
        })
        setSaving(false)
        onOpenChange(null)
        onDone()
        toast.success(`已调整 ${totalChanged} 个商品的零售价`, {
          description: changed < targets.length ? `另有 ${targets.length - changed} 个商品因缺少价格信息未调整` : '可在价格管理中查看调价记录',
        })
      }, 500)
      return
    }
    setSaving(true)
    setTimeout(() => {
      targets.forEach((p) => updateProduct(p.id, { category }))
      setSaving(false)
      onOpenChange(null)
      onDone()
      toast.success(`已将 ${targets.length} 个商品归类为「${category}」`)
    }, 400)
  }

  return (
    <Dialog open={mode !== null} onOpenChange={(o) => !o && onOpenChange(null)}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPrice ? (
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-primary">
                <Tag className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
            ) : (
              <span className="flex size-7 items-center justify-center rounded-lg bg-info-soft text-info">
                <FolderTree className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
            )}
            {isPrice ? '批量调价' : '批量调整分类'}
          </DialogTitle>
          <DialogDescription>
            已选择 {targets.length} 个商品 · 调整后立即生效，需人工确认本次操作
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-4">
          {isPrice ? (
            <>
              <div>
                <Label className="mb-1.5 text-xs font-normal text-muted-foreground">调价方式</Label>
                <Select items={priceStrategies.map((s) => ({ value: s.value, label: s.label }))} value={strategy} onValueChange={(v) => v && setStrategy(v as string)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceStrategies.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">{priceStrategies.find((s) => s.value === strategy)?.hint}</p>
              </div>
              <div>
                <Label className="mb-1.5 text-xs font-normal text-muted-foreground">
                  {strategy === 'fix' ? '新零售价（元）' : strategy === 'percent' ? '调整幅度（%）' : '目标毛利率（%）'}
                </Label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  inputMode="decimal"
                  className="h-9"
                  aria-label={strategy === 'fix' ? '新零售价' : strategy === 'percent' ? '调整幅度' : '目标毛利率'}
                  aria-invalid={!!invalidMessage}
                />
                {invalidMessage && <p className="mt-1 text-xs text-danger">{invalidMessage}</p>}
              </div>
            </>
          ) : (
            <div>
              <Label className="mb-1.5 text-xs font-normal text-muted-foreground">目标分类</Label>
              <Select items={categories.map((c) => ({ value: c, label: c }))} value={category} onValueChange={(v) => v && setCategory(v as string)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto"><Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-9 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                  <TableHead className="pl-3">商品</TableHead>
                  <TableHead>{isPrice ? '现零售价' : '现分类'}</TableHead>
                  <TableHead>{isPrice ? '调整后' : '调整后分类'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="py-8 text-center text-xs text-muted-foreground">
                      尚未选择商品，请先在商品列表中勾选
                    </TableCell>
                  </TableRow>
                ) : (
                  preview.map(({ p, next }) => (
                    <TableRow key={p.id} className="[&_td]:py-2">
                      <TableCell className="pl-3">
                        <span className="block max-w-56 truncate font-medium text-foreground">{p.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{isPrice ? formatMoney(p.retailPrice) : p.category}</TableCell>
                      <TableCell className={next === null && isPrice ? 'text-muted-foreground' : 'font-medium text-primary tabular-nums'}>
                        {isPrice ? (next === null ? '缺少价格信息，跳过' : formatMoney(next)) : category}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></div>
          </div>
          {targets.length > 6 && (
            <p className="text-xs text-muted-foreground">仅预览前 6 个商品，其余 {targets.length - 6} 个将按同一规则处理。</p>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" className="h-9" onClick={() => onOpenChange(null)}>
            取消
          </Button>
          <Button className="h-9" disabled={saving || !targets.length} onClick={submit}>
            {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
            {isPrice ? '确认调价' : '确认调整'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
