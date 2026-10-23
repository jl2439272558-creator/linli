'use client'

import { useMemo, useState } from 'react'
import { Loader2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDemoStore } from '@/components/providers/demo-store'
import type { PriceField, Product } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'

const fieldOptions: { value: PriceField; label: PriceField; key: 'retailPrice' | 'memberPrice' | 'minPrice' }[] = [
  { value: '零售价', label: '零售价', key: 'retailPrice' },
  { value: '会员价', label: '会员价', key: 'memberPrice' },
  { value: '最低售价', label: '最低售价', key: 'minPrice' },
]

const modeOptions = [
  { value: 'percent', label: '按比例调整（%）', hint: '正数上调、负数下调，例如 -5 表示下调 5%' },
  { value: 'fixed', label: '按固定金额调整（元）', hint: '正数加价、负数减价，例如 -0.2 表示降价 0.2 元' },
  { value: 'set', label: '统一设定为（元）', hint: '所选商品的该字段全部改为同一价格' },
]

function calcNext(current: number | null, mode: string, num: number): number | null {
  if (current === null) return null
  let next: number
  if (mode === 'percent') next = current * (1 + num / 100)
  else if (mode === 'fixed') next = current + num
  else next = num
  next = Math.round(next * 100) / 100
  return next > 0 ? next : null
}

function marginOf(p: Product, price: number | null) {
  if (price === null || price <= 0 || p.purchasePrice === null) return null
  return ((price - p.purchasePrice) / price) * 100
}

export function PricingAdjustDialog({ ids, onOpenChange, onDone }: { ids: string[] | null; onOpenChange: (open: boolean) => void; onDone: () => void }) {
  return (
    <Dialog open={!!ids} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[640px]">
        {ids && <AdjustForm key={ids.join(',')} ids={ids} onDone={() => { onOpenChange(false); onDone() }} />}
      </DialogContent>
    </Dialog>
  )
}

function AdjustForm({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const { products, bulkPriceAdjust } = useDemoStore()
  const targets = products.filter((p) => ids.includes(p.id))
  const [field, setField] = useState<PriceField>('零售价')
  const [mode, setMode] = useState('percent')
  const [value, setValue] = useState('5')
  const [saving, setSaving] = useState(false)

  const fieldConfig = fieldOptions.find((f) => f.value === field) ?? fieldOptions[0]
  const num = Number(value)
  const invalidMessage = (() => {
    if (value.trim() === '' || Number.isNaN(num)) return '请输入数值'
    if (mode === 'percent' && (num <= -100 || num > 1000)) return '百分比需在 -100 到 1000 之间'
    if (mode === 'fixed' && (num < -10000 || num > 10000)) return '金额需在 -10000 到 10000 之间'
    if (mode === 'set' && num <= 0) return '价格需大于 0'
    return null
  })()

  const preview = useMemo(
    () =>
      targets.map((p) => {
        const current = p[fieldConfig.key]
        const next = invalidMessage ? null : calcNext(current, mode, num)
        return { p, current, next }
      }),
    [targets, fieldConfig.key, invalidMessage, mode, num],
  )

  const affected = preview.filter((r) => r.next !== null && r.next !== r.current)

  /** 调整零售价时，预览毛利率变化 */
  const marginPreview = useMemo(() => {
    if (field !== '零售价') return null
    const before = affected.map((r) => marginOf(r.p, r.p.retailPrice)).filter((m): m is number => m !== null)
    const after = affected.map((r) => marginOf(r.p, r.next)).filter((m): m is number => m !== null)
    if (!before.length || !after.length) return null
    return {
      before: before.reduce((s, m) => s + m, 0) / before.length,
      after: after.reduce((s, m) => s + m, 0) / after.length,
    }
  }, [field, affected])

  const modeText = () => {
    if (mode === 'percent') return `按比例 ${num >= 0 ? '+' : ''}${num}%`
    if (mode === 'fixed') return `固定金额 ${num >= 0 ? '+' : '−'}${Math.abs(num).toFixed(2)} 元`
    return `设定为 ${num.toFixed(2)} 元`
  }

  const submit = async () => {
    if (invalidMessage) {
      toast.info(invalidMessage)
      return
    }
    if (!affected.length) {
      toast.info('所选商品无法按该规则调价', { description: '商品缺少当前价格，或调整后价格未发生变化' })
      return
    }
    setSaving(true)
    const changes: Record<string, number> = {}
    affected.forEach(({ p, next }) => {
      if (next !== null) changes[p.id] = next
    })
    // 单事务：批量写价 + 生成调价记录
    await bulkPriceAdjust({
      ids: Object.keys(changes),
      field: fieldConfig.key,
      changes,
      log: {
        field,
        mode: modeText(),
        scope: targets.length > 1 ? `手动选择 ${targets.length} 个商品` : `单品：${targets[0].name}`,
        affected: affected.length,
      },
    })
    setSaving(false)
    onDone()
    toast.success(`已调整 ${affected.length} 个商品的${field}`, {
      description: affected.length < targets.length ? `另有 ${targets.length - affected.length} 个商品因缺少价格信息未调整` : '调价记录已保存',
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-primary">
            <Tag className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
          批量调价
        </DialogTitle>
        <DialogDescription>已选择 {targets.length} 个商品 · 调整后立即生效并写入调价记录</DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">调价字段</Label>
            <Select items={fieldOptions.map((f) => ({ value: f.value, label: f.label }))} value={field} onValueChange={(v) => v && setField(v as PriceField)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldOptions.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">调价方式</Label>
            <Select items={modeOptions.map((m) => ({ value: m.value, label: m.label }))} value={mode} onValueChange={(v) => v && setMode(v as string)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">
            {mode === 'percent' ? '调整幅度（%）' : mode === 'fixed' ? '调整金额（元）' : '设定价格（元）'}
          </Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className="h-9" aria-label="调价数值" aria-invalid={!!invalidMessage} />
          <p className={`mt-1 text-xs ${invalidMessage ? 'text-danger' : 'text-muted-foreground'}`}>
            {invalidMessage ?? modeOptions.find((m) => m.value === mode)?.hint}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto"><Table className="text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-9 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                <TableHead className="pl-3">商品</TableHead>
                <TableHead className="text-right">现{field}</TableHead>
                <TableHead className="text-right">调整后</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.slice(0, 6).map(({ p, current, next }) => (
                <TableRow key={p.id} className="[&_td]:py-2">
                  <TableCell className="pl-3">
                    <span className="block max-w-56 truncate font-medium text-foreground">{p.name}</span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(current)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${next === null ? 'text-muted-foreground' : 'font-medium text-primary'}`}>
                    {next === null ? (current === null ? '缺少当前价格，跳过' : '价格无效，跳过') : formatMoney(next)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </div>
        {targets.length > 6 && <p className="text-xs text-muted-foreground">仅预览前 6 个商品，其余 {targets.length - 6} 个将按同一规则处理。</p>}

        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">将影响商品</span>
            <span className="font-semibold tabular-nums">{affected.length} / {targets.length} 个</span>
          </div>
          {marginPreview && (
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-muted-foreground">平均毛利率变化</span>
              <span className="font-semibold tabular-nums">
                {marginPreview.before.toFixed(1)}% → {marginPreview.after.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" className="h-9" onClick={onDone}>
          取消
        </Button>
        <Button className="h-9" disabled={saving} onClick={submit}>
          {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
          确认调价
        </Button>
      </DialogFooter>
    </>
  )
}
