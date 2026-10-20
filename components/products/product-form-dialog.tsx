'use client'

import { useState } from 'react'
import { ImagePlus, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductThumb } from '@/components/common/product-thumb'
import { useDemoStore } from '@/components/providers/demo-store'
import { brands, categories, type Product } from '@/lib/mock-data'

type FormState = {
  name: string
  barcode: string
  category: string
  brand: string
  spec: string
  unit: string
  purchasePrice: string
  retailPrice: string
  stock: string
  safetyStock: string
}

function toForm(p?: Product | null): FormState {
  return {
    name: p?.name ?? '',
    barcode: p?.barcode ?? '',
    category: p?.category ?? categories[0],
    brand: p?.brand ?? '',
    spec: p?.spec ?? '',
    unit: p?.unit ?? '件',
    purchasePrice: p?.purchasePrice?.toString() ?? '',
    retailPrice: p?.retailPrice?.toString() ?? '',
    stock: p?.stock.toString() ?? '0',
    safetyStock: p?.safetyStock.toString() ?? '10',
  }
}

const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        {open && <ProductForm key={product?.id ?? 'new'} product={product} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ProductForm({ product, onDone }: { product: Product | null; onDone: () => void }) {
  const { addProduct, updateProduct } = useDemoStore()
  const [form, setForm] = useState<FormState>(() => toForm(product))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const isEdit = !!product

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const buy = numOrNull(form.purchasePrice)
  const sell = numOrNull(form.retailPrice)
  const lowMargin = buy !== null && sell !== null && sell > 0 && sell <= buy

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = '请输入商品名称'
    if (form.barcode && !/^\d{8,14}$/.test(form.barcode)) next.barcode = '条码应为 8–14 位数字'
    if (sell === null || Number.isNaN(sell) || sell <= 0) next.retailPrice = '请输入有效的零售价'
    if (buy !== null && (Number.isNaN(buy) || buy < 0)) next.purchasePrice = '请输入有效的进货价'
    if (!/^\d+$/.test(form.stock)) next.stock = '库存需为整数'
    setErrors(next)
    if (Object.keys(next).length) return

    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim() || null,
      category: form.category,
      brand: form.brand.trim() || '未设置',
      spec: form.spec.trim() || null,
      unit: form.unit.trim() || '件',
      purchasePrice: buy,
      retailPrice: sell,
      stock: Number(form.stock),
      safetyStock: Number(form.safetyStock) || 0,
    }
    if (isEdit) {
      updateProduct(product.id, payload)
      toast.success('商品信息已更新', { description: payload.name })
    } else {
      addProduct({ ...payload, image: null, source: '手动录入' })
      toast.success('商品已新增', { description: `${payload.name} 已加入商品库` })
    }
    onDone()
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>{isEdit ? '编辑商品' : '新增商品'}</DialogTitle>
        <DialogDescription>{isEdit ? `商品编号 ${product.id}` : '带 * 为必填项，其余信息可稍后补充'}</DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex gap-5">
        <div className="flex w-28 shrink-0 flex-col items-center gap-2">
          {product?.image ? (
            <ProductThumb src={product.image} alt={product.name} size={112} />
          ) : (
            <button
              type="button"
              onClick={() => toast.info('上传商品图片', { description: '演示版本未接入文件存储' })}
              className="flex size-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-muted/40 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden="true" />
              上传图片
            </button>
          )}
          <span className="text-center text-[11px] text-muted-foreground">建议 800×800 白底图</span>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3.5">
          <Field label="商品名称" required error={errors.name} className="col-span-2">
            <Input id="name" value={form.name} onChange={set('name')} placeholder="如：农夫山泉 饮用天然水" aria-invalid={!!errors.name} />
          </Field>
          <Field label="商品条码" error={errors.barcode}>
            <Input id="barcode" value={form.barcode} onChange={set('barcode')} placeholder="69 开头的 13 位条码" inputMode="numeric" aria-invalid={!!errors.barcode} />
          </Field>
          <Field label="商品分类" required>
            <Select items={categories.map((c) => ({ value: c, label: c }))} value={form.category} onValueChange={(v) => v && setForm((f) => ({ ...f, category: v as string }))}>
              <SelectTrigger id="category" className="h-9 w-full">
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
          </Field>
          <Field label="品牌">
            <Input id="brand" value={form.brand} onChange={set('brand')} placeholder="输入或选择品牌" list="brand-options" />
            <datalist id="brand-options">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <div className="grid grid-cols-[1fr_72px] gap-2">
            <Field label="规格">
              <Input id="spec" value={form.spec} onChange={set('spec')} placeholder="如 550ml/瓶" />
            </Field>
            <Field label="单位">
              <Input id="unit" value={form.unit} onChange={set('unit')} />
            </Field>
          </div>
          <Field label="进货价（元）" error={errors.purchasePrice}>
            <Input id="purchasePrice" value={form.purchasePrice} onChange={set('purchasePrice')} inputMode="decimal" placeholder="0.00" aria-invalid={!!errors.purchasePrice} />
          </Field>
          <Field label="零售价（元）" required error={errors.retailPrice}>
            <Input id="retailPrice" value={form.retailPrice} onChange={set('retailPrice')} inputMode="decimal" placeholder="0.00" aria-invalid={!!errors.retailPrice} />
          </Field>
          <Field label="当前库存" error={errors.stock}>
            <Input id="stock" value={form.stock} onChange={set('stock')} inputMode="numeric" aria-invalid={!!errors.stock} />
          </Field>
          <Field label="安全库存">
            <Input id="safetyStock" value={form.safetyStock} onChange={set('safetyStock')} inputMode="numeric" />
          </Field>
          {lowMargin && (
            <p className="col-span-2 flex items-center gap-1.5 rounded-md bg-warning-soft px-3 py-2 text-xs text-[oklch(0.5_0.12_60)]">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              零售价不高于进货价，该商品将无毛利
            </p>
          )}
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" className="h-9" onClick={onDone}>
          取消
        </Button>
        <Button type="submit" className="h-9 min-w-24">
          {isEdit ? '保存修改' : '确认新增'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-xs font-normal text-muted-foreground">
        {label}
        {required && <span className="text-danger">*</span>}
      </Label>
      <div className="[&_input]:h-9">{children}</div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
