'use client'

import { useMemo, useState } from 'react'
import { CircleCheck, Handshake, Loader2, MoreHorizontal, Pencil, Phone, Plus, RotateCcw, Search, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { supplierStatusTone, type SupplierDetail } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const ALL = 'all'

export function SuppliersView() {
  const { supplierList, products, purchaseOrders, updateSupplier } = useDemoStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [editing, setEditing] = useState<{ mode: 'add' } | { mode: 'edit'; supplier: SupplierDetail } | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return supplierList
      .map((s) => {
        const productCount = products.filter((p) => p.supplier === s.name).length
        const orders = purchaseOrders.filter((o) => o.supplier === s.name)
        const amount = orders.reduce((sum, o) => sum + o.items.reduce((x, i) => x + i.quantity * i.price, 0), 0)
        return { ...s, productCount, orderCount: orders.length, amount }
      })
      .filter((s) => {
        if (q && !s.name.toLowerCase().includes(q) && !s.contact.toLowerCase().includes(q)) return false
        if (status !== ALL && s.status !== status) return false
        return true
      })
  }, [supplierList, products, purchaseOrders, query, status])

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = !!query || status !== ALL

  const activeCount = supplierList.filter((s) => s.status === '合作中').length
  const avgOnTime = supplierList.length ? Math.round(supplierList.reduce((s, x) => s + x.onTimeRate, 0) / supplierList.length) : 0

  const reset = () => {
    setQuery('')
    setStatus(ALL)
    setPage(1)
  }

  const stats: StatItem[] = [
    { label: '供应商总数', value: `${supplierList.length} 家`, icon: Truck, tone: 'bg-brand-soft text-primary' },
    { label: '合作中', value: `${activeCount} 家`, icon: Handshake, tone: 'bg-success-soft text-success' },
    { label: '暂停合作', value: `${supplierList.length - activeCount} 家`, icon: CircleCheck, tone: 'bg-warning-soft text-warning' },
    { label: '平均准时率', value: `${avgOnTime}%`, icon: Phone, tone: 'bg-info-soft text-info', hint: '近 90 天到货准时率' },
  ]

  return (
    <>
      <PageHeader
        title="供应商管理"
        breadcrumbs={[{ label: '库存采购' }, { label: '供应商管理' }]}
        description="维护供应商档案与合作状态，采购单按此处供应商归集"
        actions={
          <Button className="h-9" onClick={() => setEditing({ mode: 'add' })}>
            <Plus data-icon="inline-start" />
            新增供应商
          </Button>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="供应商列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="搜索供应商名称或联系人"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索供应商 / 联系人"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <FilterSelect
            label="合作状态"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
            options={[
              { value: ALL, label: '全部' },
              { value: '合作中', label: '合作中' },
              { value: '暂停合作', label: '暂停合作' },
            ]}
          />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[1100px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5 min-w-48">供应商</TableHead>
              <TableHead>联系人</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead className="min-w-44">供应分类</TableHead>
              <TableHead className="text-right">商品数</TableHead>
              <TableHead className="text-right">采购单数</TableHead>
              <TableHead className="text-right">累计采购额</TableHead>
              <TableHead className="text-right">准时率</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的供应商</p>
                  <p className="mt-1 text-xs text-muted-foreground">请调整搜索关键词或筛选条件</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                    清除筛选
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((s) => (
                <TableRow key={s.id} className="[&_td]:py-2.5">
                  <TableCell className="pl-5">
                    <span className="block max-w-52 truncate font-medium text-foreground">{s.name}</span>
                    <span className="mt-0.5 block max-w-52 truncate text-xs text-muted-foreground">{s.address}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.contact}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{s.phone}</TableCell>
                  <TableCell>
                    <span className="flex max-w-48 flex-wrap gap-1">
                      {s.categories.map((c) => (
                        <span key={c} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {c}
                        </span>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.productCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.orderCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.amount > 0 ? formatMoney(s.amount) : '—'}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', s.onTimeRate >= 95 ? 'text-success' : s.onTimeRate >= 88 ? 'text-muted-foreground' : 'text-[oklch(0.5_0.12_60)]')}>
                    {s.onTimeRate}%
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={supplierStatusTone[s.status]}>{s.status}</StatusBadge>
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${s.name} 更多操作`} />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => setEditing({ mode: 'edit', supplier: s })}>
                            <Pencil data-icon="inline-start" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const next = s.status === '合作中' ? '暂停合作' : '合作中'
                              updateSupplier(s.id, { status: next })
                              toast.success(`已${next === '合作中' ? '恢复' : '暂停'}与「${s.name}」的合作`)
                            }}
                          >
                            {s.status === '合作中' ? '暂停合作' : '恢复合作'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>

        <TablePagination
          total={rows.length}
          page={current}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(v) => {
            setPageSize(v)
            setPage(1)
          }}
        />
      </section>

      <SupplierDialog editing={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  )
}

function SupplierDialog({ editing, onOpenChange }: { editing: { mode: 'add' } | { mode: 'edit'; supplier: SupplierDetail } | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!editing} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        {editing && <SupplierForm key={editing.mode === 'edit' ? editing.supplier.id : 'add'} editing={editing} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function SupplierForm({ editing, onDone }: { editing: { mode: 'add' } | { mode: 'edit'; supplier: SupplierDetail }; onDone: () => void }) {
  const { categoryList, addSupplier, updateSupplier } = useDemoStore()
  const isEdit = editing.mode === 'edit'
  const init = isEdit ? editing.supplier : null
  const [name, setName] = useState(init?.name ?? '')
  const [contact, setContact] = useState(init?.contact ?? '')
  const [phoneHead, setPhoneHead] = useState(init ? init.phone.slice(0, 3) : '')
  const [phoneTail, setPhoneTail] = useState(init ? init.phone.slice(-4) : '')
  const [cats, setCats] = useState<string[]>(init?.categories ?? [])
  const [address, setAddress] = useState(init?.address ?? '')
  const [saving, setSaving] = useState(false)

  const toggleCat = (c: string) => setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const submit = () => {
    if (!name.trim()) {
      toast.info('请输入供应商名称')
      return
    }
    if (!/^\d{3}$/.test(phoneHead) || !/^\d{4}$/.test(phoneTail)) {
      toast.info('请输入正确的联系电话', { description: '仅录入前三位与后四位数字' })
      return
    }
    if (!cats.length) {
      toast.info('请选择至少一个供应分类')
      return
    }
    setSaving(true)
    setTimeout(() => {
      const phone = `${phoneHead}****${phoneTail}`
      if (isEdit) {
        updateSupplier(editing.supplier.id, { contact: contact.trim() || editing.supplier.contact, phone, categories: cats, address: address.trim() })
        toast.success(`已保存「${editing.supplier.name}」的资料`)
      } else {
        addSupplier({ name: name.trim(), contact: contact.trim() || '—', phone, categories: cats, status: '合作中', onTimeRate: 95, since: '2026-10-21', address: address.trim() || '—' })
        toast.success(`已新增供应商「${name.trim()}」`)
      }
      setSaving(false)
      onDone()
    }, 400)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? '编辑供应商' : '新增供应商'}</DialogTitle>
        <DialogDescription>{isEdit ? '名称与商品档案、采购单关联，不可修改' : '新增供应商默认状态为「合作中」'}</DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">供应商名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="如：杭州华润食品批发" disabled={isEdit} maxLength={24} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">联系人</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} className="h-9" placeholder="如：陈经理" maxLength={12} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">联系电话（前三位 + 后四位）</Label>
            <div className="flex items-center gap-1.5">
              <Input value={phoneHead} onChange={(e) => setPhoneHead(e.target.value.replace(/\D/g, '').slice(0, 3))} className="h-9 w-16 text-center" inputMode="numeric" aria-label="手机号前三位" />
              <span className="text-muted-foreground">****</span>
              <Input value={phoneTail} onChange={(e) => setPhoneTail(e.target.value.replace(/\D/g, '').slice(0, 4))} className="h-9 w-20 text-center" inputMode="numeric" aria-label="手机号后四位" />
            </div>
          </div>
        </div>
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">供应分类（可多选）</Label>
          <div className="flex flex-wrap gap-1.5">
            {categoryList.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCat(c)}
                aria-pressed={cats.includes(c)}
                className={cn(
                  'h-7 rounded-md border px-2.5 text-xs transition-colors',
                  cats.includes(c) ? 'border-primary/50 bg-brand-soft font-medium text-primary' : 'border-border text-muted-foreground hover:border-primary/30',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">地址</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9" placeholder="如：杭州市余杭区勾庄农产品物流中心 B12" maxLength={40} />
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" className="h-9" onClick={onDone}>
          取消
        </Button>
        <Button className="h-9" disabled={saving} onClick={submit}>
          {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {isEdit ? '保存' : '新增'}
        </Button>
      </DialogFooter>
    </>
  )
}
