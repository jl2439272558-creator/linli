'use client'

import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDemoStore } from '@/components/providers/demo-store'
import { downloadCsv } from '@/lib/export-csv'
import { parseCsv } from '@/lib/csv'
import type { Product } from '@/lib/mock-data'

const HEADER_MAP: Record<string, keyof Product> = {
  商品名称: 'name',
  名称: 'name',
  分类: 'category',
  品类: 'category',
  品牌: 'brand',
  规格: 'spec',
  条码: 'barcode',
  商品条码: 'barcode',
  进货价: 'purchasePrice',
  零售价: 'retailPrice',
  会员价: 'memberPrice',
  单位: 'unit',
  供应商: 'supplier',
}

const toNumber = (v: string | undefined): number | null => {
  if (v === undefined || v.trim() === '') return null
  const n = Number(v.replace(/[¥￥,\s]/g, ''))
  return Number.isNaN(n) ? null : n
}

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addProduct, categoryList, brandList, supplierList } = useDemoStore()
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = (o: boolean) => {
    onOpenChange(o)
    if (!o) {
      setFile(null)
      setSubmitting(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const downloadTemplate = () =>
    downloadCsv('商品导入模板', ['商品名称', '分类', '品牌', '规格', '条码', '进货价', '零售价', '单位', '供应商'], [
      ['农夫山泉 饮用天然水', '饮料冲调', '农夫山泉', '550ml/瓶', '6921168509256', '1.15', '2', '瓶', '康达饮料经销'],
    ])

  const submit = async () => {
    if (!file) return
    if (/\.xlsx?$/i.test(file.name)) {
      toast.info('暂不支持 Excel 文件', { description: '请在 Excel 中另存为 CSV（逗号分隔）后再导入' })
      return
    }
    setSubmitting(true)
    try {
      const text = await file.text()
      const matrix = parseCsv(text)
      if (matrix.length < 2) {
        toast.info('文件内容为空', { description: '需要包含表头行与至少一行商品数据' })
        setSubmitting(false)
        return
      }
      const header = matrix[0].map((h) => h.trim())
      const colIndex = header.map((h) => HEADER_MAP[h])
      if (!colIndex.includes('name')) {
        toast.info('未找到「商品名称」列', { description: '请确认表头与导入模板一致' })
        setSubmitting(false)
        return
      }
      const rows = matrix.slice(1)
      let imported = 0
      for (const r of rows) {
        const get = (key: keyof Product) => {
          const idx = colIndex.indexOf(key)
          return idx >= 0 ? (r[idx] ?? '').trim() : ''
        }
        const name = get('name')
        if (!name) continue
        await addProduct({
          name,
          image: null,
          barcode: get('barcode') || null,
          category: get('category') || categoryList[0] || '日用百货',
          brand: get('brand') || '未设置',
          spec: get('spec') || null,
          purchasePrice: toNumber(get('purchasePrice')),
          retailPrice: toNumber(get('retailPrice')),
          memberPrice: toNumber(get('memberPrice')),
          minPrice: null,
          stock: 0,
          safetyStock: 10,
          unit: get('unit') || '件',
          supplier: get('supplier') || supplierList[0]?.name || '未指定供应商',
          status: '在售',
          source: '批量导入',
        })
        imported++
      }
      if (!imported) {
        toast.info('未解析到有效商品行', { description: '请确认每行都填写了商品名称' })
      } else {
        toast.success(`已导入 ${imported} 个商品`, { description: `${file.name} · 已写入商品库，库存默认为 0` })
        close(false)
      }
    } catch (err) {
      toast.error('导入失败', { description: err instanceof Error ? err.message : '文件读取出错' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>导入商品</DialogTitle>
          <DialogDescription>选择 .csv 文件，解析后逐行写入商品库；字段需与模板保持一致。</DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          aria-label="选择导入文件"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <FileSpreadsheet className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
            <span className="flex-1 truncate text-[13px] font-medium">{file.name}</span>
            <Button variant="ghost" size="icon-sm" aria-label="移除文件" onClick={() => setFile(null)}>
              <X />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-brand-soft/40"
          >
            <Upload className="size-6 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[13px] font-medium text-foreground">点击选择文件</span>
            <span className="text-xs text-muted-foreground">文件在浏览器本地解析，不会上传服务器</span>
          </button>
        )}

        <button
          type="button"
          className="self-start text-xs text-primary hover:underline"
          onClick={downloadTemplate}
        >
          下载导入模板
        </button>

        <DialogFooter>
          <Button variant="outline" className="h-9" onClick={() => close(false)}>
            取消
          </Button>
          <Button className="h-9" disabled={!file || submitting} onClick={submit}>
            {submitting ? '导入中…' : '开始导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
