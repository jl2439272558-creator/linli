'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, FileSpreadsheet, FileUp, ImageIcon, Link2, Loader2, ShieldCheck, Store, Unplug, Upload, X, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useDemoStore } from '@/components/providers/demo-store'
import { cn } from '@/lib/utils'

export type SourceKey = 'meituan' | 'link' | 'file'
export type Material = { label: string; count: number; files?: string[] }

type Props = {
  selected: SourceKey | null
  onSelect: (k: SourceKey) => void
  materials: Partial<Record<SourceKey, Material>>
  onMaterial: (k: SourceKey, m: Material | null) => void
}

export function SourceCards(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      <MeituanCard {...props} />
      <LinkCard {...props} />
      <FileCard {...props} />
    </div>
  )
}

function CardShell({
  k,
  icon: Icon,
  iconClass,
  title,
  desc,
  status,
  selected,
  onSelect,
  children,
}: {
  k: SourceKey
  icon: LucideIcon
  iconClass: string
  title: string
  desc: string
  status?: React.ReactNode
  selected: SourceKey | null
  onSelect: (k: SourceKey) => void
  children: React.ReactNode
}) {
  const active = selected === k
  return (
    <section
      aria-label={title}
      onClick={() => onSelect(k)}
      className={cn(
        'relative flex cursor-pointer flex-col rounded-xl border bg-card p-5 transition-all',
        active ? 'border-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_12%,transparent)]' : 'border-border hover:border-primary/40',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', iconClass)}>
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
            <span
              aria-hidden="true"
              className={cn('flex size-4 items-center justify-center rounded-full border', active ? 'border-primary bg-primary' : 'border-input bg-background')}
            >
              {active && <span className="size-1.5 rounded-full bg-primary-foreground" />}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
        </div>
      </div>
      {status && <div className="mt-3">{status}</div>}
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  )
}

function MaterialChip({ m, onClear }: { m: Material; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-brand-soft/60 px-3 py-2 text-[13px]">
      <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-foreground">{m.label}</span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{m.count} 项</span>
      <button
        type="button"
        aria-label="移除资料"
        onClick={(e) => {
          e.stopPropagation()
          onClear()
        }}
        className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

/* ---------------- 美团商品资料 ---------------- */

function MeituanCard({ selected, onSelect, materials, onMaterial }: Props) {
  const { meituanConnected, setMeituanConnected } = useDemoStore()
  const [authOpen, setAuthOpen] = useState(false)
  const [agree, setAgree] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const m = materials.meituan

  return (
    <CardShell
      k="meituan"
      icon={Store}
      iconClass="bg-warning-soft text-[oklch(0.55_0.13_70)]"
      title="美团商品资料"
      desc="通过商家授权接口，或导入从商家后台合规导出的商品文件"
      selected={selected}
      onSelect={onSelect}
      status={
        meituanConnected ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 text-xs text-success">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            已完成演示授权（未连接真实接口）
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            <Unplug className="size-3.5" aria-hidden="true" />
            未授权
          </span>
        )
      }
    >
      {m ? (
        <MaterialChip m={m} onClear={() => onMaterial('meituan', null)} />
      ) : (
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>· 仅读取商家本人店铺的商品名称、图片与规格</li>
          <li>· 授权可随时在「基础设置」中撤销</li>
        </ul>
      )}
      <div className="mt-auto flex gap-2 pt-4" onClick={(e) => e.stopPropagation()}>
        {meituanConnected ? (
          <Button
            variant="outline"
            className="h-9 flex-1"
            onClick={() => {
              onSelect('meituan')
              onMaterial('meituan', { label: '美团门店商品（演示数据）', count: 24 })
              toast.success('已读取演示商品资料', { description: '共 24 项，可开始 AI 识别' })
            }}
          >
            读取商品资料
          </Button>
        ) : (
          <Button className="h-9 flex-1" onClick={() => setAuthOpen(true)}>
            授权连接
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv"
          className="sr-only"
          aria-label="导入美团导出文件"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            onSelect('meituan')
            onMaterial('meituan', { label: f.name, count: 36 })
            toast.success('文件已读取', { description: `${f.name}（演示：按 36 项商品处理）` })
            e.target.value = ''
          }}
        />
        <Button variant="outline" className="h-9 flex-1" onClick={() => fileRef.current?.click()}>
          <FileUp data-icon="inline-start" />
          导入导出文件
        </Button>
      </div>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-[480px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>授权读取美团商品资料</DialogTitle>
            <DialogDescription>当前为 UI 演示版本，点击确认仅模拟授权结果，不会跳转或连接美团。</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-[13px]">
            <p className="font-medium text-foreground">将申请以下权限</p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />读取本店商品名称、图片、规格与分类</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />读取本店商品售价（用作参考价格）</li>
              <li className="flex gap-2"><X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />不读取订单、顾客及资金信息</li>
            </ul>
          </div>
          <label className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <Checkbox checked={agree} onCheckedChange={(c) => setAgree(!!c)} className="mt-0.5" />
            我确认是该店铺的经营者或已获得授权，并同意按平台规则使用商品资料
          </label>
          <DialogFooter>
            <Button variant="outline" className="h-9" onClick={() => setAuthOpen(false)}>
              取消
            </Button>
            <Button
              className="h-9"
              disabled={!agree || connecting}
              onClick={() => {
                setConnecting(true)
                setTimeout(() => {
                  setConnecting(false)
                  setMeituanConnected(true)
                  setAuthOpen(false)
                  onSelect('meituan')
                  toast.success('演示授权完成', { description: '可点击「读取商品资料」继续' })
                }, 900)
              }}
            >
              {connecting && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {connecting ? '授权中…' : '确认授权'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardShell>
  )
}

/* ---------------- 商品链接导入 ---------------- */

function LinkCard({ selected, onSelect, materials, onMaterial }: Props) {
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const m = materials.link

  const parse = () => {
    const links = text.split(/\s+/).filter(Boolean)
    const valid = links.filter((l) => /^https?:\/\/[^\s.]+\.[^\s]+/.test(l))
    if (!links.length) return setError('请粘贴至少一条商品链接')
    if (!valid.length) return setError('未识别到有效链接，请以 http:// 或 https:// 开头')
    setError(null)
    setParsing(true)
    setTimeout(() => {
      setParsing(false)
      onSelect('link')
      onMaterial('link', { label: `已解析 ${valid.length} 条商品链接`, count: valid.length })
      toast.success(`解析完成：${valid.length} 条有效链接`, {
        description: links.length > valid.length ? `${links.length - valid.length} 条格式无效已忽略` : '可开始 AI 识别',
      })
    }, 1000)
  }

  return (
    <CardShell
      k="link"
      icon={Link2}
      iconClass="bg-info-soft text-info"
      title="商品链接导入"
      desc="粘贴供应商或品牌官网的商品详情页链接，每行一条"
      selected={selected}
      onSelect={onSelect}
    >
      {m ? (
        <MaterialChip m={m} onClear={() => { onMaterial('link', null); setText('') }} />
      ) : (
        <div onClick={(e) => e.stopPropagation()}>
          <Textarea
            aria-label="商品链接"
            value={text}
            onFocus={() => onSelect('link')}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            placeholder={'https://supplier.example.com/item/10086\nhttps://brand.example.com/product/2231'}
            className="h-[76px] resize-none font-mono text-xs"
            aria-invalid={!!error}
          />
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>
      )}
      <div className="mt-auto pt-4" onClick={(e) => e.stopPropagation()}>
        <Button className="h-9 w-full" variant={m ? 'outline' : 'default'} disabled={parsing} onClick={m ? () => { onMaterial('link', null); setText('') } : parse}>
          {parsing && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {parsing ? '解析中…' : m ? '重新输入链接' : '解析链接'}
        </Button>
      </div>
    </CardShell>
  )
}

/* ---------------- 图片与文件识别 ---------------- */

function FileCard({ selected, onSelect, materials, onMaterial }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const m = materials.file

  const accept = (files: FileList | null) => {
    if (!files?.length) return
    const names = Array.from(files).map((f) => f.name)
    const images = names.filter((n) => /\.(png|jpe?g|webp|heic)$/i.test(n)).length
    const sheets = names.length - images
    onSelect('file')
    onMaterial('file', {
      label: names.length === 1 ? names[0] : `${images ? `${images} 张图片` : ''}${images && sheets ? '、' : ''}${sheets ? `${sheets} 个表格` : ''}`,
      count: images + sheets * 20,
      files: names,
    })
    toast.success(`已添加 ${names.length} 个文件`, { description: '文件仅在浏览器本地读取，未上传服务器' })
  }

  return (
    <CardShell
      k="file"
      icon={ImageIcon}
      iconClass="bg-ai-soft text-ai"
      title="图片与文件识别"
      desc="上传货架照片、商品包装图，或 Excel / CSV 商品清单"
      selected={selected}
      onSelect={onSelect}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.xlsx,.xls,.csv"
        className="sr-only"
        aria-label="上传图片或文件"
        onChange={(e) => {
          accept(e.target.files)
          e.target.value = ''
        }}
      />
      {m ? (
        <MaterialChip m={m} onClear={() => onMaterial('file', null)} />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect('file')
            inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            accept(e.dataTransfer.files)
          }}
          className={cn(
            'flex h-[76px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs transition-colors',
            dragging ? 'border-ai bg-ai-soft/60 text-ai' : 'border-input bg-muted/30 text-muted-foreground hover:border-ai/50 hover:text-ai',
          )}
        >
          <Upload className="size-4" aria-hidden="true" />
          <span>拖拽文件到此处，或点击上传</span>
        </button>
      )}
      <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ImageIcon className="size-3.5" aria-hidden="true" />JPG / PNG</span>
        <span className="inline-flex items-center gap-1"><FileSpreadsheet className="size-3.5" aria-hidden="true" />Excel / CSV</span>
        <span className="ml-auto">单个文件 ≤ 20MB</span>
      </div>
    </CardShell>
  )
}
