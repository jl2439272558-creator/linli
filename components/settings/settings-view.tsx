'use client'

import { useEffect, useRef, useState } from 'react'
import { DatabaseBackup, Loader2, PlugZap, ReceiptText, Save, ShieldCheck, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/common/page-header'
import { SectionCard } from '@/components/common/section-card'
import { useDemoStore } from '@/components/providers/demo-store'
import { downloadJson, todaySuffix } from '@/lib/export-csv'

const roundingOptions = [
  { value: 'none', label: '不抹零', hint: '按应收金额原样收取' },
  { value: 'jiao', label: '抹零到角', hint: '分位四舍五入，如 ¥10.34 → ¥10.30' },
  { value: 'yuan', label: '抹零到元', hint: '角分四舍五入，如 ¥10.60 → ¥11.00' },
]

export function SettingsView() {
  const {
    products,
    saleOrders,
    refunds,
    purchaseOrders,
    stockInRecords,
    supplierList,
    staffList,
    storeList,
    priceLogs,
    settings,
    hydrated,
    applySafetyStock,
    saveSetting,
    meituanConnected,
    setMeituanConnected,
    currentStore,
  } = useDemoStore()
  const [receiptTitle, setReceiptTitle] = useState(`店管家 · ${currentStore.name}`)
  const [rounding, setRounding] = useState('jiao')
  const [safetyStock, setSafetyStock] = useState('30')
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const restored = useRef(false)

  // 数据库连通后恢复已保存的设置
  useEffect(() => {
    if (!hydrated || restored.current) return
    restored.current = true
    setReceiptTitle(settings.receiptTitle || `店管家 · ${currentStore.name}`)
    setRounding(settings.rounding || 'jiao')
    setSafetyStock(settings.safetyStockDefault || '30')
  }, [hydrated, settings, currentStore])

  const applySafetyStockAll = async () => {
    const num = Number(safetyStock)
    if (safetyStock.trim() === '' || Number.isNaN(num) || num < 0 || num > 9999) {
      toast.info('请输入正确的默认安全库存', { description: '需为 0 到 9999 之间的整数' })
      return
    }
    setApplying(true)
    await applySafetyStock(Math.round(num))
    setApplying(false)
    toast.success(`已将默认安全库存 ${Math.round(num)} 应用到全部 ${products.length} 个商品`, {
      description: '库存预警将按新的安全库存重新判定',
    })
  }

  const save = async () => {
    setSaving(true)
    await Promise.all([
      saveSetting('receiptTitle', receiptTitle),
      saveSetting('rounding', rounding),
      saveSetting('safetyStockDefault', safetyStock.trim() === '' ? '30' : safetyStock),
    ])
    setSaving(false)
    toast.success('设置已保存', { description: '已写入数据库，刷新页面后仍然生效' })
  }

  const exportBackup = () => {
    downloadJson(`店管家数据备份_${todaySuffix()}`, {
      exportedAt: new Date().toISOString(),
      settings,
      products,
      saleOrders,
      refunds,
      purchaseOrders,
      stockInRecords,
      suppliers: supplierList,
      staff: staffList,
      stores: storeList,
      priceLogs,
    })
    toast.success('数据备份已导出', { description: `店管家数据备份_${todaySuffix()}.json（商品、订单、库存与设置完整备份）` })
  }

  return (
    <>
      <PageHeader
        title="基础设置"
        breadcrumbs={[{ label: '系统设置' }, { label: '基础设置' }]}
        description="小票、库存与数据管理相关的基础配置"
        actions={
          <Button className="h-9" disabled={saving} onClick={save}>
            {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
            保存设置
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4">
        <SectionCard title="小票设置" description="打印小票的抬头与金额抹零策略">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="mb-1.5 text-xs font-normal text-muted-foreground">小票抬头</Label>
              <Input value={receiptTitle} onChange={(e) => setReceiptTitle(e.target.value)} className="h-9" maxLength={30} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-normal text-muted-foreground">抹零策略</Label>
              <Select items={roundingOptions.map((r) => ({ value: r.value, label: r.label }))} value={rounding} onValueChange={(v) => v && setRounding(v as string)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roundingOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">{roundingOptions.find((r) => r.value === rounding)?.hint}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="库存设置" description="默认安全库存与批量应用">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="mb-1.5 text-xs font-normal text-muted-foreground">默认安全库存（件）</Label>
              <div className="flex items-center gap-2">
                <Input value={safetyStock} onChange={(e) => setSafetyStock(e.target.value)} className="h-9 w-32" inputMode="numeric" aria-label="默认安全库存" />
                <Button variant="outline" className="h-9" disabled={applying} onClick={applySafetyStockAll}>
                  {applying && <Loader2 className="animate-spin" data-icon="inline-start" />}
                  应用到全部商品
                </Button>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <TriangleAlert className="size-3.5" aria-hidden="true" />
                应用后会覆盖全部 {products.length} 个商品的现有安全库存
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="数据管理" description="商品档案的批量导入与数据备份">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <DatabaseBackup className="size-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">导出数据备份</p>
                  <p className="text-xs text-muted-foreground">商品、订单、库存与设置的完整备份（JSON）</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={exportBackup}>
                导出备份
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <DatabaseBackup className="size-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">导入历史数据</p>
                  <p className="text-xs text-muted-foreground">支持旧系统导出的商品档案与销售流水</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('请在「商品管理」中使用导入功能', { description: '商品导入支持 Excel / CSV 模板' })}
              >
                前往导入
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="第三方授权" description="外部平台账号授权状态">
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div className="flex items-center gap-3">
              {meituanConnected ? (
                <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              ) : (
                <PlugZap className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
              <div>
                <p className="text-[13px] font-medium text-foreground">美团商品资料授权</p>
                <p className="text-xs text-muted-foreground">
                  {meituanConnected ? '已授权 · 可在 AI 商品采集中导出美团商品资料' : '授权后可在 AI 商品采集中导出美团商品资料'}
                </p>
              </div>
            </div>
            <Switch
              checked={meituanConnected}
              onCheckedChange={(v) => {
                setMeituanConnected(v)
                toast[v ? 'success' : 'info'](v ? '已完成美团授权（模拟）' : '已解除美团授权', {
                  description: v ? '采集中心可选择「美团商品资料」来源' : '相关采集入口已停用',
                })
              }}
              aria-label="美团商品资料授权开关"
            />
          </div>
        </SectionCard>
      </div>
    </>
  )
}
