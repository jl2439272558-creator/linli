'use client'

import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [file, setFile] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = (o: boolean) => {
    onOpenChange(o)
    if (!o) {
      setFile(null)
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>导入商品</DialogTitle>
          <DialogDescription>支持 .xlsx / .csv 文件，单次最多 5,000 条。字段需与模板保持一致。</DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          aria-label="选择导入文件"
          onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
        />
        {file ? (
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <FileSpreadsheet className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
            <span className="flex-1 truncate text-[13px] font-medium">{file}</span>
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
            <span className="text-xs text-muted-foreground">文件仅在本地演示中读取文件名，不会上传</span>
          </button>
        )}

        <button
          type="button"
          className="self-start text-xs text-primary hover:underline"
          onClick={() => toast.success('模板已生成', { description: '商品导入模板.xlsx（演示文件，未实际下载）' })}
        >
          下载导入模板
        </button>

        <DialogFooter>
          <Button variant="outline" className="h-9" onClick={() => close(false)}>
            取消
          </Button>
          <Button
            className="h-9"
            disabled={!file || submitting}
            onClick={() => {
              setSubmitting(true)
              setTimeout(() => {
                toast.success('导入任务已提交', { description: `${file} 将在后台校验，完成后通知您` })
                close(false)
              }, 800)
            }}
          >
            {submitting ? '提交中…' : '开始导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
