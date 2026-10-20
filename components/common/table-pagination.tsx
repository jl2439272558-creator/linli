'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizes = [8, 20, 50],
}: {
  total: number
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange?: (s: number) => void
  pageSizes?: number[]
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const items = pageSizes.map((s) => ({ value: String(s), label: `${s} 条/页` }))

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[13px] text-muted-foreground">
      <span>
        {'共 '}
        <span className="font-medium text-foreground tabular-nums">{total}</span>
        {' 条记录'}
      </span>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <Select items={items} value={String(pageSize)} onValueChange={(v) => v && onPageSizeChange(Number(v))}>
            <SelectTrigger aria-label="每页条数" className="h-8 w-28 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <nav aria-label="分页" className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="上一页" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft />
          </Button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="icon"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
              className={cn('tabular-nums', p !== page && 'text-foreground')}
            >
              {p}
            </Button>
          ))}
          <Button variant="outline" size="icon" aria-label="下一页" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight />
          </Button>
        </nav>
      </div>
    </div>
  )
}
