'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ImagePlus, Loader2, ScanBarcode, ScanLine, Sparkles, Star, Trash2, TriangleAlert, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SectionCard } from '@/components/common/section-card'
import { StatusBadge } from '@/components/common/status-badge'
import { ProductThumb } from '@/components/common/product-thumb'
import { PageHeader } from '@/components/common/page-header'
import { useDemoStore } from '@/components/providers/demo-store'
import { brands, categories, getStockStatus, suppliers, units, type Product } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { stockTone } from './stock-tone'
import { BarcodeScanDialog, type BarcodeScanResult } from './barcode-scan-dialog'

type FormState = {
  name: string
  barcode: string
  category: string
  brand: string
  spec: string
  unit: string
  purchasePrice: string
  retailPrice: string
  memberPrice: string
  minPrice: string
  stock: string
  safetyStock: string
  supplier: string
  status: '在售' | '停售'
}

const emptyForm: FormState = {
  name: '',
  barcode: '',
  category: categories[0],
  brand: '',
  spec: '',
  unit: '件',
  purchasePrice: '',
  retailPrice: '',
  memberPrice: '',
  minPrice: '',
  stock: '0',
  safetyStock: '10',
  supplier: suppliers[0],
  status: '在售',
}

function toForm(p: Product): FormState {
  return {
    name: p.name,
    barcode: p.barcode ?? '',
    category: p.category,
    brand: p.brand,
    spec: p.spec ?? '',
    unit: p.unit,
    purchasePrice: p.purchasePrice?.toString() ?? '',
    retailPrice: p.retailPrice?.toString() ?? '',
    memberPrice: p.memberPrice?.toString() ?? '',
    minPrice: p.minPrice?.toString() ?? '',
    stock: p.stock.toString(),
    safetyStock: p.safetyStock.toString(),
    supplier: p.supplier,
    status: p.status,
  }
}

const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

/** AI 字段建议：依据商品名称与商品库做匹配推断，不编造条码与价格 */
type Suggestion = { field: string; value: string; confidence: number; reason: string }

export function ProductFormPage({ productId }: { productId?: string }) {
  const router = useRouter()
  const id = productId
  const { products, addProduct, updateProduct } = useDemoStore()
  const editing = id ? products.find((p) => p.id === id) ?? null : null

  const [form, setForm] = useState<FormState>(() => (editing ? toForm(editing) : emptyForm))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [aiLoading, setAiLoading] = useState(false)
  const [aiApplied, setAiApplied] = useState<string[]>([])
  const [scanOpen, setScanOpen] = useState(false)
  // 编辑态下切换商品时同步表单
  const [prevId, setPrevId] = useState(id)
  if (id !== prevId) {
    setPrevId(id)
    const next = id ? products.find((p) => p.id === id) ?? null : null
    setForm(next ? toForm(next) : emptyForm)
    setErrors({})
    setAiApplied([])
  }

  const binding = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((err) => ({ ...err, [k]: undefined }))
  }
  const pick = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  /** 已有条码（排除编辑中的商品自身），用于扫码查重 */
  const existingBarcodes = products.filter((p) => p.id !== editing?.id).map((p) => p.barcode).filter((b): b is string => !!b)

  const applyScan = ({ barcode, info }: BarcodeScanResult) => {
    setForm((f) => ({
      ...f,
      barcode,
      ...(info
        ? {
            name: info.name,
            brand: info.brand,
            spec: info.spec,
            category: (categories as string[]).includes(info.category) ? info.category : f.category,
            unit: (units as string[]).includes(info.unit) ? info.unit : f.unit,
            retailPrice: info.retailPrice.toFixed(2),
            purchasePrice: info.purchasePrice?.toFixed(2) ?? f.purchasePrice,
          }
        : {}),
    }))
    setErrors((err) => ({ ...err, barcode: undefined }))
    if (info) {
      toast.success('已填入扫码商品信息', { description: `${info.name} · 来源：${info.source}，请人工核对价格与分类后再保存` })
    } else {
      toast.success('已填入条码', { description: '条码库未收录该商品，请人工补全其余字段' })
    }
  }

  const suggestions = useMemo<Suggestion[]>(() => {
    const name = form.name.trim()
    if (!name) return []
    const out: Suggestion[] = []
    const hitBrand = brands.find((b) => name.includes(b))
    if (hitBrand && hitBrand !== form.brand) out.push({ field: 'brand', value: hitBrand, confidence: 93, reason: '商品名称中包含该品牌关键词' })
    if (hitBrand) {
      const same = products.filter((p) => p.brand === hitBrand)
      if (same.length) out.push({ field: 'category', value: same[0].category, confidence: 88, reason: `参考商品库中同品牌 ${same.length} 个商品的分类` })
    }
    const specMatch = name.match(/(\d+(?:\.\d+)?\s?(?:ml|mL|L|g|kg|抽|片))/)
    if (specMatch && !form.spec) out.push({ field: 'spec', value: specMatch[1], confidence: 74, reason: '从商品名称中识别到规格字符，建议人工核对包装' })
    if (form.category === categories[0] && name.includes('面')) out.push({ field: 'category', value: '方便速食', confidence: 85, reason: '商品名称中包含「面」，推断为方便速食' })
    return out
  }, [form.name, form.brand, form.spec, form.category, products])

  const buy = numOrNull(form.purchasePrice)
  const sell = numOrNull(form.retailPrice)
  const member = numOrNull(form.memberPrice)
  const min = numOrNull(form.minPrice)
  const lowMargin = buy !== null && sell !== null && sell > 0 && sell <= buy
  const memberBelow = member !== null && min !== null && member < min
  const stockNum = /^\d+$/.test(form.stock) ? Number(form.stock) : 0
  const preview = { name: form.name || '未命名商品', retailPrice: sell, stock: stockNum, safetyStock: Number(form.safetyStock) || 0, status: form.status }
  const previewStock = getStockStatus({ stock: preview.stock, safetyStock: preview.safetyStock })

  const validate = () => {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = '请输入商品名称'
    if (form.barcode && !/^\d{8,14}$/.test(form.barcode)) next.barcode = '条码应为 8–14 位数字'
    if (sell === null || Number.isNaN(sell) || sell <= 0) next.retailPrice = '请输入有效的零售价'
    if (buy !== null && (Number.isNaN(buy) || buy < 0)) next.purchasePrice = '请输入有效的进货价'
    if (member !== null && min !== null && member < min) next.memberPrice = '会员价不应低于最低售价'
    if (!/^\d+$/.test(form.stock)) next.stock = '库存需为非负整数'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const payload = () => ({
    name: form.name.trim(),
    barcode: form.barcode.trim() || null,
    category: form.category,
    brand: form.brand.trim() || '未设置',
    spec: form.spec.trim() || null,
    unit: form.unit.trim() || '件',
    purchasePrice: buy,
    retailPrice: sell,
    memberPrice: member,
    minPrice: min,
    stock: Number(form.stock),
    safetyStock: Number(form.safetyStock) || 0,
    supplier: form.supplier,
    status: form.status,
  })

  const save = (mode: 'save' | 'draft' | 'saveAndNew') => {
    if (mode === 'save' && !validate()) return
    if (!form.name.trim()) {
      setErrors({ name: '请输入商品名称' })
      return
    }
    const data = { ...payload(), status: mode === 'draft' ? ('停售' as const) : form.status }
    if (editing) {
      updateProduct(editing.id, data)
      toast.success('商品信息已保存', { description: `${data.name} · 已人工确认` })
      if (mode === 'saveAndNew') {
        setForm(emptyForm)
        router.replace('/products/new')
      } else {
        router.push('/products')
      }
      return
    }
    addProduct({ ...data, image: null, source: '手动录入' })
    toast.success(mode === 'draft' ? '草稿已保存' : '商品已新增', {
      description: mode === 'draft' ? `${data.name} 以「停售」状态保存，可在商品管理中启用` : `${data.name} 已加入商品库`,
    })
    if (mode === 'saveAndNew') {
      setForm(emptyForm)
      setErrors({})
      setAiApplied([])
    } else {
      router.push('/products')
    }
  }

  const runAi = () => {
    if (!form.name.trim()) {
      toast.info('请先填写商品名称', { description: 'AI 依据商品名称推断品牌、分类与规格' })
      return
    }
    setAiLoading(true)
    setTimeout(() => {
      setAiLoading(false)
      if (!suggestions.length) {
        toast.info('未识别到可建议的字段', { description: '当前名称未匹配到品牌或规格，请手动填写；AI 不会编造条码与价格' })
        return
      }
      toast.success(`生成 ${suggestions.length} 条字段建议`, { description: '需人工确认后应用' })
    }, 900)
  }

  return (
    <>
      <PageHeader
        title={editing ? '编辑商品' : '新增商品'}
        breadcrumbs={[{ label: '商品中心' }, { label: '商品管理', href: '/products' }, { label: editing ? '编辑商品' : '新增商品' }]}
        description={editing ? `商品编号 ${editing.id} · 修改后立即生效` : '按分区填写商品资料，带 * 为必填项'}
        actions={
          <Button variant="outline" className="h-9" onClick={() => router.push('/products')}>
            <ArrowLeft data-icon="inline-start" />
            返回列表
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <div className="flex flex-col gap-3 md:col-span-2 md:gap-4">
          <SectionCard title="基本信息" description="商品名称、条码、分类与规格">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:gap-x-4">
              <Field label="商品名称" required error={errors.name} className="col-span-2">
                <Input value={form.name} onChange={binding('name')} placeholder="如：农夫山泉 饮用天然水" aria-invalid={!!errors.name} />
              </Field>
              <Field label="商品条码" error={errors.barcode} hint="支持摄像头与扫码枪扫码录入；无法确认的条码请留空" className="col-span-2 md:col-span-1">
                <div className="flex gap-2">
                  <Input value={form.barcode} onChange={binding('barcode')} placeholder="69 开头的 13 位条码" inputMode="numeric" aria-invalid={!!errors.barcode} className="flex-1" />
                  <Button type="button" variant="outline" className="h-9 shrink-0" onClick={() => setScanOpen(true)}>
                    <ScanBarcode data-icon="inline-start" />
                    扫码录入
                  </Button>
                </div>
              </Field>
              <Field label="商品分类" required>
                <Select items={categories.map((c) => ({ value: c, label: c }))} value={form.category} onValueChange={(v) => v && pick('category', v as string)}>
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
              </Field>
              <Field label="品牌" hint={aiApplied.includes('brand') ? '已应用 AI 建议' : undefined}>
                <Input value={form.brand} onChange={binding('brand')} placeholder="输入或选择品牌" list="brand-options" />
                <datalist id="brand-options">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
              <div className="grid grid-cols-[1fr_88px] gap-2">
                <Field label="规格">
                  <Input value={form.spec} onChange={binding('spec')} placeholder="如 550ml/瓶" />
                </Field>
                <Field label="销售单位">
                  <Select items={units.map((u) => ({ value: u, label: u }))} value={form.unit} onValueChange={(v) => v && pick('unit', v as string)}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="价格信息" description="零售价与会员价将用于收银台结算">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 md:gap-x-4">
              <Field label="进货价（元）" error={errors.purchasePrice}>
                <Input value={form.purchasePrice} onChange={binding('purchasePrice')} inputMode="decimal" placeholder="0.00" aria-invalid={!!errors.purchasePrice} />
              </Field>
              <Field label="零售价（元）" required error={errors.retailPrice}>
                <Input value={form.retailPrice} onChange={binding('retailPrice')} inputMode="decimal" placeholder="0.00" aria-invalid={!!errors.retailPrice} />
              </Field>
              <Field label="会员价（元）" error={errors.memberPrice}>
                <Input value={form.memberPrice} onChange={binding('memberPrice')} inputMode="decimal" placeholder="0.00" aria-invalid={!!errors.memberPrice} />
              </Field>
              <Field label="最低售价（元）" hint="用于促销与折扣下限">
                <Input value={form.minPrice} onChange={binding('minPrice')} inputMode="decimal" placeholder="0.00" />
              </Field>
            </div>
            {(lowMargin || memberBelow) && (
              <div className="mt-3 flex flex-col gap-2">
                {lowMargin && (
                  <p className="flex items-center gap-1.5 rounded-md bg-warning-soft px-3 py-2 text-xs text-[oklch(0.5_0.12_60)]">
                    <TriangleAlert className="size-3.5" aria-hidden="true" />
                    零售价不高于进货价，该商品将无毛利
                  </p>
                )}
                {memberBelow && (
                  <p className="flex items-center gap-1.5 rounded-md bg-danger-soft px-3 py-2 text-xs text-danger">
                    <TriangleAlert className="size-3.5" aria-hidden="true" />
                    会员价低于最低售价，请调整后再保存
                  </p>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="库存与供应商" description="用于库存预警与采购建议">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 md:gap-x-4">
              <Field label="当前库存" error={errors.stock}>
                <Input value={form.stock} onChange={binding('stock')} inputMode="numeric" aria-invalid={!!errors.stock} />
              </Field>
              <Field label="安全库存" hint="低于该值触发预警">
                <Input value={form.safetyStock} onChange={binding('safetyStock')} inputMode="numeric" />
              </Field>
              <Field label="默认供应商" className="col-span-2">
                <Select items={suppliers.map((s) => ({ value: s, label: s }))} value={form.supplier} onValueChange={(v) => v && pick('supplier', v as string)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-muted/50 px-3.5 py-3">
              <span className="text-[13px] text-muted-foreground">商品状态</span>
              <div role="radiogroup" aria-label="商品状态" className="flex rounded-lg bg-background p-0.5 ring-1 ring-border">
                {(['在售', '停售'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={form.status === s}
                    onClick={() => pick('status', s)}
                    className={cn(
                      'h-7 rounded-md px-3 text-xs transition-colors',
                      form.status === s ? 'bg-brand-soft font-medium text-primary' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">停售商品不会出现在收银台，但仍保留库存记录</span>
            </div>
          </SectionCard>

          <SectionCard
            title="商品图片"
            description="主图用于商品列表与收银台展示"
            icon={
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-primary">
                <ImagePlus className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
            }
          >
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                {editing?.image ? (
                  <>
                    <ProductThumb src={editing.image} alt={editing.name} size={112} />
                    <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-1.5 py-0.5 text-[11px] text-primary">
                      <Star className="size-3" aria-hidden="true" />
                      当前主图
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => toast.info('上传商品图片', { description: '演示版本未接入文件存储，图片仅在本地预览' })}
                    className="flex size-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-muted/40 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden="true" />
                    上传主图
                  </button>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-8" onClick={() => toast.info('替换主图', { description: '请选择 800×800 以内的白底商品图（演示）' })}>
                    <ImagePlus data-icon="inline-start" />
                    替换主图
                  </Button>
                  <Button variant="outline" className="h-8" onClick={() => toast.info('图片裁切', { description: '演示版本未接入裁切工具' })}>
                    裁切
                  </Button>
                  <Button variant="outline" className="h-8" onClick={() => toast.info('附加图片', { description: '可上传包装背面、成分表等图片（演示）' })}>
                    添加附加图片
                  </Button>
                  <Button variant="ghost" className="h-8 text-muted-foreground" onClick={() => toast.info('已移除图片', { description: '演示版本未保存实际图片' })}>
                    <Trash2 data-icon="inline-start" />
                    移除
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  图片使用须符合授权范围：来自美团商品资料的图片仅限本店商品使用；AI 采集图片来源需在审核环节确认。
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard
            title="AI 字段建议"
            description="依据商品名称推断，需人工确认"
            icon={
              <span className="flex size-8 items-center justify-center rounded-lg bg-ai-soft text-ai">
                <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
            }
            actions={
              <Button variant="outline" className="h-8 border-ai/30 text-ai hover:bg-ai-soft hover:text-ai" disabled={aiLoading} onClick={runAi}>
                {aiLoading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
                {aiLoading ? '识别中…' : '生成建议'}
              </Button>
            }
            bodyClassName="flex flex-col gap-3"
          >
            {suggestions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                填写商品名称后可生成建议；AI 不会编造条码、进货价与零售价。
              </p>
            ) : (
              suggestions.map((s) => (
                <div key={`${s.field}-${s.value}`} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-foreground">
                      {fieldLabel[s.field]}
                      <span className="ml-1.5 text-ai">{s.value}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-ai-soft px-1.5 py-0.5 text-[11px] text-ai tabular-nums">
                      置信度 {s.confidence}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      className="h-7"
                      disabled={aiApplied.includes(s.field)}
                      onClick={() => {
                        pick(s.field as keyof FormState, s.value)
                        setAiApplied((prev) => [...prev, s.field])
                        toast.success(`已应用 AI 建议：${fieldLabel[s.field]}`, { description: '请人工核对后再保存' })
                      }}
                    >
                      <Check data-icon="inline-start" />
                      {aiApplied.includes(s.field) ? '已应用' : '应用'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => toast.info('已忽略该建议', { description: '可继续手动填写字段' })}>
                      <X data-icon="inline-start" />
                      忽略
                    </Button>
                  </div>
                </div>
              ))
            )}
            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
              建议由演示规则生成，当前版本未接入真实大模型；标记为「待确认」的字段需人工录入。
            </p>
          </SectionCard>

          <SectionCard title="保存预览" description="门店列表与收银台的展示效果">
            <div className="rounded-lg border border-border p-3.5">
              <div className="flex items-center gap-3">
                <ProductThumb src={editing?.image ?? null} alt={preview.name} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">{preview.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{form.category} · {form.brand || '未设置品牌'}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-md bg-muted/60 px-3 py-2">
                  <p className="text-xs text-muted-foreground">零售价</p>
                  <p className="mt-0.5 font-semibold tabular-nums">{formatMoney(preview.retailPrice)}</p>
                </div>
                <div className="rounded-md bg-muted/60 px-3 py-2">
                  <p className="text-xs text-muted-foreground">会员价</p>
                  <p className="mt-0.5 font-semibold tabular-nums">{formatMoney(member)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StatusBadge tone={form.status === '在售' ? 'success' : 'neutral'}>{form.status}</StatusBadge>
                <StatusBadge tone={stockTone[previewStock]}>{previewStock}</StatusBadge>
                <span className="text-xs text-muted-foreground tabular-nums">库存 {preview.stock}</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
              保存后可在商品管理中继续维护价格与库存；改价需人工确认。
            </p>
          </SectionCard>

          {editing?.source === 'AI 采集' && (
            <div className="flex items-start gap-2.5 rounded-xl border border-ai/20 bg-ai-soft/60 px-4 py-3.5 text-[13px]">
              <ScanLine className="mt-0.5 size-4 shrink-0 text-ai" aria-hidden="true" />
              <span className="text-muted-foreground">
                该商品来自 AI 采集，原始来源：{editing.id} 审核记录。修改字段后不会影响已入库的采集记录。
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-14 z-10 -mx-4 -mb-4 mt-6 flex items-center gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm md:bottom-0 md:-mx-6 md:-mb-6 md:px-6 md:py-3.5">
        <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
          {editing ? '修改后立即生效，系统会记录最近更新时间' : '保存后商品将出现在商品管理中'}
        </p>
        <Button variant="outline" className="h-9" onClick={() => router.push('/products')}>
          取消
        </Button>
        <Button variant="outline" className="h-9" onClick={() => save('draft')}>
          保存草稿
        </Button>
        <Button className="h-9 min-w-28" onClick={() => save(editing ? 'save' : 'saveAndNew')}>
          {editing ? '保存修改' : '保存并新增'}
        </Button>
      </div>

      <BarcodeScanDialog open={scanOpen} onOpenChange={setScanOpen} existingBarcodes={existingBarcodes} onApply={applyScan} />
    </>
  )
}

const fieldLabel: Record<string, string> = { brand: '品牌', category: '商品分类', spec: '规格' }

function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
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
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
