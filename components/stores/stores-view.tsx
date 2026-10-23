'use client'

import { useState } from 'react'
import { CalendarDays, Clock, Loader2, MapPin, Phone, Plus, Store, User, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/page-header'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { useDemoStore } from '@/components/providers/demo-store'
import { storeStatusTone, type StoreInfo, type StoreStatus } from '@/lib/mock-data'
import { formatMoney } from '@/lib/format'

export function StoresView() {
  const { storeList, storeId, setStoreId, updateStore } = useDemoStore()
  const [editing, setEditing] = useState<{ mode: 'add' } | { mode: 'edit'; store: StoreInfo } | null>(null)

  const openCount = storeList.filter((s) => s.status === '营业中').length
  const preparingCount = storeList.filter((s) => s.status === '筹备中').length
  const totalSales = storeList.reduce((s, x) => s + x.monthSales, 0)

  const stats: StatItem[] = [
    { label: '门店总数', value: `${storeList.length} 家`, icon: Store, tone: 'bg-brand-soft text-primary' },
    { label: '营业中', value: `${openCount} 家`, icon: Store, tone: 'bg-success-soft text-success' },
    { label: '筹备中', value: `${preparingCount} 家`, icon: CalendarDays, tone: 'bg-info-soft text-info' },
    { label: '本月销售额合计', value: formatMoney(totalSales, 0), icon: Wallet, tone: 'bg-warning-soft text-warning' },
  ]

  return (
    <>
      <PageHeader
        title="门店列表"
        breadcrumbs={[{ label: '门店管理' }, { label: '门店列表' }]}
        description="维护门店信息与营业状态，「当前操作门店」决定各业务页面展示的门店口径"
        actions={
          <Button className="h-9" onClick={() => setEditing({ mode: 'add' })}>
            <Plus data-icon="inline-start" />
            新增门店
          </Button>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="门店卡片" className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {storeList.map((s) => {
          const isCurrent = s.id === storeId
          return (
            <div key={s.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[15px] font-semibold text-foreground">{s.name}</h2>
                    {isCurrent && (
                      <StatusBadge tone="brand" dot={false}>
                        当前门店
                      </StatusBadge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">开业于 {s.openedAt}</p>
                </div>
                <StatusBadge tone={storeStatusTone[s.status]}>{s.status}</StatusBadge>
              </div>

              <dl className="mt-4 flex flex-col gap-2 text-[13px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{s.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">{s.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>营业时间 {s.hours}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>店长：{s.manager}</span>
                </div>
              </dl>

              <div className="mt-4 flex items-baseline justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">本月销售额</span>
                <span className="text-[15px] font-semibold tabular-nums">{formatMoney(s.monthSales, 0)}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3.5">
                {!isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStoreId(s.id)
                      toast.info(`已切换至「${s.name}」`, { description: '演示数据：各门店共用同一套业务记录' })
                    }}
                  >
                    设为当前门店
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setEditing({ mode: 'edit', store: s })}>
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    const next: StoreStatus = s.status === '已停业' ? '营业中' : '已停业'
                    updateStore(s.id, { status: next })
                    toast.success(`「${s.name}」已${next === '已停业' ? '停业' : '恢复营业'}`)
                  }}
                >
                  {s.status === '已停业' ? '恢复营业' : '停业'}
                </Button>
              </div>
            </div>
          )
        })}
      </section>

      <StoreDialog editing={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  )
}

function StoreDialog({ editing, onOpenChange }: { editing: { mode: 'add' } | { mode: 'edit'; store: StoreInfo } | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!editing} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {editing && <StoreForm key={editing.mode === 'edit' ? editing.store.id : 'add'} editing={editing} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function StoreForm({ editing, onDone }: { editing: { mode: 'add' } | { mode: 'edit'; store: StoreInfo }; onDone: () => void }) {
  const { addStore, updateStore } = useDemoStore()
  const isEdit = editing.mode === 'edit'
  const init = isEdit ? editing.store : null
  const [name, setName] = useState(init?.name ?? '')
  const [address, setAddress] = useState(init?.address ?? '')
  const [phone, setPhone] = useState(init?.phone ?? '')
  const [hours, setHours] = useState(init?.hours ?? '07:00–23:00')
  const [manager, setManager] = useState(init?.manager ?? '')
  const [status, setStatus] = useState<StoreStatus>(init?.status ?? '筹备中')
  const [openedAt, setOpenedAt] = useState(init?.openedAt ?? '2026-11-01')
  const [saving, setSaving] = useState(false)

  const submit = () => {
    if (!name.trim()) {
      toast.info('请输入门店名称')
      return
    }
    if (!address.trim()) {
      toast.info('请输入门店地址')
      return
    }
    setSaving(true)
    setTimeout(() => {
      if (isEdit) {
        updateStore(editing.store.id, { name: name.trim(), address: address.trim(), phone: phone.trim() || '—', hours, manager: manager.trim() || '—', status, openedAt })
        toast.success(`已保存「${name.trim()}」的门店信息`)
      } else {
        addStore({ name: name.trim(), address: address.trim(), phone: phone.trim() || '—', hours, manager: manager.trim() || '—', status, openedAt })
        toast.success(`已新增门店「${name.trim()}」`)
      }
      setSaving(false)
      onDone()
    }, 400)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? '编辑门店' : '新增门店'}</DialogTitle>
        <DialogDescription>{isEdit ? '修改门店基础信息与营业状态' : '新增门店默认计入订阅套餐的门店额度'}</DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">门店名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="如：幸福里社区店" maxLength={20} />
        </div>
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">门店地址</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9" placeholder="如：杭州市西湖区文三路 218 号" maxLength={40} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">联系电话</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" placeholder="如：0571-8821 6690" maxLength={16} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">营业时间</Label>
            <Input value={hours} onChange={(e) => setHours(e.target.value)} className="h-9" placeholder="如：07:00–23:00" maxLength={16} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">店长</Label>
            <Input value={manager} onChange={(e) => setManager(e.target.value)} className="h-9" placeholder="如：王建国" maxLength={12} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">开业日期</Label>
            <Input value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} className="h-9" placeholder="YYYY-MM-DD" maxLength={10} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">状态</Label>
            <Select
              items={(['营业中', '筹备中', '已停业'] as StoreStatus[]).map((s) => ({ value: s, label: s }))}
              value={status}
              onValueChange={(v) => v && setStatus(v as StoreStatus)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['营业中', '筹备中', '已停业'] as StoreStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
