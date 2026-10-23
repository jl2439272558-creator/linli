'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera, CircleCheck, Keyboard, Loader2, ScanBarcode, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { randomBarcodeEntry, type BarcodeProductInfo } from '@/lib/barcode-db'
import { formatMoney } from '@/lib/format'

export type BarcodeScanResult = { barcode: string; info: BarcodeProductInfo | null }

type Phase = 'idle' | 'loading' | 'found' | 'missed' | 'exists'

/** 扫码成功提示音（扫码枪同款反馈） */
function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 1568
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => void ctx.close()
  } catch {
    // 无音频设备时静默
  }
}

function cameraErrorMessage(e: unknown) {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError') return '摄像头权限被拒绝，请在浏览器地址栏允许访问摄像头'
    if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') return '未检测到可用摄像头，请改用扫码枪或手动输入'
  }
  return '摄像头启动失败，请改用扫码枪或手动输入'
}

/** 摄像头实时扫码：仅在可见时挂载（条件渲染触发启动/停止） */
function CameraScanner({ onCode, onError }: { onCode: (code: string) => void; onError: (msg: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode
  const firedRef = useRef(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 300 })
    let controls: { stop: () => void } | null = null
    let cancelled = false

    ;(async () => {
      try {
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
          if (result && !firedRef.current) {
            firedRef.current = true
            onCodeRef.current(result.getText())
          }
        })
        if (cancelled) controls?.stop()
      } catch (e) {
        if (!cancelled) onError(cameraErrorMessage(e))
      }
    })()

    return () => {
      cancelled = true
      controls?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-black">
      <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline aria-label="摄像头扫码画面" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="size-44 rounded-lg border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
      </div>
      <p className="absolute inset-x-0 bottom-2 text-center text-xs text-white/90">将商品条码对准取景框</p>
    </div>
  )
}

export function BarcodeScanDialog({
  open,
  onOpenChange,
  existingBarcodes,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 商品库中已有条码，用于查重提示 */
  existingBarcodes: string[]
  onApply: (result: BarcodeScanResult) => void
}) {
  const [tab, setTab] = useState<'camera' | 'manual'>('camera')
  const [phase, setPhase] = useState<Phase>('idle')
  const [code, setCode] = useState('')
  const [info, setInfo] = useState<BarcodeProductInfo | null>(null)
  const [camError, setCamError] = useState<string | null>(null)
  const [input, setInput] = useState('')

  // 关闭时重置，便于下一次扫码
  useEffect(() => {
    if (!open) {
      setPhase('idle')
      setCode('')
      setInfo(null)
      setInput('')
      setCamError(null)
    }
  }, [open])

  const reset = () => {
    setPhase('idle')
    setCode('')
    setInfo(null)
  }

  const handleCode = async (raw: string) => {
    const c = raw.trim()
    if (!/^\d{8,14}$/.test(c)) {
      toast.info('条码格式不正确', { description: '应为 8–14 位数字（EAN-13 / EAN-8 / UPC）' })
      return
    }
    beep()
    setCode(c)
    setInfo(null)
    if (existingBarcodes.includes(c)) {
      setPhase('exists')
      return
    }
    setPhase('loading')
    try {
      const resp = await fetch(`/api/barcode?code=${encodeURIComponent(c)}`)
      const data = (await resp.json()) as { found: boolean; info: BarcodeProductInfo | null }
      if (data.found && data.info) {
        setInfo(data.info)
        setPhase('found')
      } else {
        setPhase('missed')
      }
    } catch {
      setPhase('missed')
    }
  }

  const apply = (withInfo: boolean) => {
    onApply({ barcode: code, info: withInfo ? info : null })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-primary">
              <ScanBarcode className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            扫码录入商品
          </DialogTitle>
          <DialogDescription>扫描商品条码，自动查询商品资料并填入表单；未收录的条码可仅填入条码后人工补全</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'camera' | 'manual')} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="camera" className="flex-1">
              <Camera data-icon="inline-start" />
              摄像头扫码
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">
              <Keyboard data-icon="inline-start" />
              扫码枪 / 手动输入
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-3">
            {phase === 'idle' &&
              (camError ? (
                <div className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-6 text-center">
                  <TriangleAlert className="mx-auto size-5 text-[oklch(0.5_0.12_60)]" aria-hidden="true" />
                  <p className="mt-2 text-[13px] text-foreground">{camError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setTab('manual')}>
                    改用扫码枪 / 手动输入
                  </Button>
                </div>
              ) : (
                <CameraScanner onCode={handleCode} onError={setCamError} />
              ))}
          </TabsContent>

          <TabsContent value="manual" className="mt-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleCode(input)
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 14))}
                placeholder="扫码枪扫入或输入 8–14 位条码"
                inputMode="numeric"
                autoFocus={tab === 'manual'}
                className="h-10 flex-1 font-mono"
                aria-label="商品条码"
              />
              <Button type="submit" className="h-10" disabled={phase === 'loading'}>
                查询
              </Button>
            </form>
            <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>扫码枪扫入后自动查询，无需点击</span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => handleCode(randomBarcodeEntry().barcode)}
              >
                没有扫码枪？模拟扫描一枪
              </button>
            </div>
          </TabsContent>
        </Tabs>

        {phase !== 'idle' && (
          <div className="mt-4">
            {phase === 'loading' && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3.5 text-[13px] text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                正在查询条码 {code} …
              </div>
            )}

            {phase === 'exists' && (
              <div className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                  <TriangleAlert className="size-4 text-[oklch(0.5_0.12_60)]" aria-hidden="true" />
                  该条码已在商品库中
                </p>
                <p className="mt-1 text-xs text-muted-foreground">条码 {code} 对应的商品已存在，无需重复录入；可在商品管理中搜索该条码进行编辑。</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                  继续扫描
                </Button>
              </div>
            )}

            {phase === 'found' && info && (
              <div className="rounded-lg border border-success/40 bg-success-soft px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                  <CircleCheck className="size-4 text-success" aria-hidden="true" />
                  已识别：{info.name}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>条码：{info.barcode}</span>
                  <span>品牌：{info.brand}</span>
                  <span>规格：{info.spec}</span>
                  <span>分类：{info.category}</span>
                  <span>
                    参考零售价：{formatMoney(info.retailPrice)}
                    {info.purchasePrice !== null && ` · 参考进货价：${formatMoney(info.purchasePrice)}`}
                  </span>
                  <span>数据来源：{info.source}</span>
                </dl>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => apply(true)}>
                    填入表单
                  </Button>
                  <Button variant="outline" size="sm" onClick={reset}>
                    继续扫描
                  </Button>
                </div>
              </div>
            )}

            {phase === 'missed' && (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3.5">
                <p className="text-[13px] font-medium text-foreground">条码库未收录 {code}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  可先填入条码，其余字段人工补全；接入付费条码数据库（聚合数据 / 阿里云市场）后可覆盖更多商品。
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => apply(false)}>
                    仅填入条码
                  </Button>
                  <Button variant="outline" size="sm" onClick={reset}>
                    继续扫描
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
