'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, FolderOpen, FolderTree, Loader2, MoreHorizontal, Package, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/common/page-header'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { useDemoStore } from '@/components/providers/demo-store'
import { formatMoney } from '@/lib/format'

type Editing = { mode: 'add' } | { mode: 'rename'; name: string }

export function CategoriesView() {
  const { categoryList, products, moveCategory, deleteCategory } = useDemoStore()
  const [editing, setEditing] = useState<Editing | null>(null)

  const stats = useMemo(() => {
    const rows = categoryList.map((name) => {
      const items = products.filter((p) => p.category === name)
      return { name, count: items.length, value: items.reduce((s, p) => s + p.stock * (p.purchasePrice ?? 0), 0) }
    })
    return {
      rows,
      totalProducts: products.length,
      totalValue: rows.reduce((s, r) => s + r.value, 0),
      unused: rows.filter((r) => r.count === 0).length,
    }
  }, [categoryList, products])

  const remove = (name: string) => {
    const count = products.filter((p) => p.category === name).length
    if (count > 0) {
      toast.info(`无法删除「${name}」`, { description: `该分类下仍有 ${count} 个商品，请先在商品管理中调整这些商品的分类` })
      return
    }
    deleteCategory(name)
    toast.success(`已删除分类「${name}」`)
  }

  const statItems: StatItem[] = [
    { label: '分类总数', value: `${categoryList.length} 个`, icon: FolderTree, tone: 'bg-brand-soft text-primary' },
    { label: '商品总数', value: `${stats.totalProducts} 个`, icon: Package, tone: 'bg-info-soft text-info' },
    { label: '库存总金额', value: formatMoney(stats.totalValue, 0), icon: Wallet, tone: 'bg-success-soft text-success' },
    { label: '未使用分类', value: `${stats.unused} 个`, icon: FolderOpen, tone: 'bg-warning-soft text-warning', hint: '分类下暂无商品' },
  ]

  return (
    <>
      <PageHeader
        title="商品分类"
        breadcrumbs={[{ label: '商品中心' }, { label: '商品分类' }]}
        description="维护商品分类与排序，收银台与商品管理的分类顺序与此处一致"
        actions={
          <Button className="h-9" onClick={() => setEditing({ mode: 'add' })}>
            <Plus data-icon="inline-start" />
            新增分类
          </Button>
        }
      />

      <StatCards items={statItems} className="mb-4" />

      <section aria-label="分类列表" className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto"><Table className="min-w-[760px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="w-24 pl-5">排序</TableHead>
              <TableHead className="min-w-48">分类名称</TableHead>
              <TableHead className="text-right">商品数</TableHead>
              <TableHead className="text-right">库存金额</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <p className="text-sm text-foreground">暂无分类</p>
                  <p className="mt-1 text-xs text-muted-foreground">点击右上角「新增分类」创建第一个商品分类</p>
                </TableCell>
              </TableRow>
            ) : (
              stats.rows.map((row, i) => (
                <TableRow key={row.name} className="[&_td]:py-2.5">
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`上移 ${row.name}`}
                        disabled={i === 0}
                        onClick={() => moveCategory(row.name, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`下移 ${row.name}`}
                        disabled={i === stats.rows.length - 1}
                        onClick={() => moveCategory(row.name, 1)}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{row.name}</span>
                      {row.count === 0 && (
                        <StatusBadge tone="neutral" dot={false}>
                          未使用
                        </StatusBadge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(row.value)}</TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${row.name} 更多操作`} />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => setEditing({ mode: 'rename', name: row.name })}>
                            <Pencil data-icon="inline-start" />
                            重命名
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => remove(row.name)}>
                            <Trash2 data-icon="inline-start" />
                            删除
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
      </section>

      <CategoryDialog editing={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  )
}

function CategoryDialog({ editing, onOpenChange }: { editing: Editing | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!editing} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        {editing && (
          <CategoryForm key={editing.mode === 'rename' ? `rename-${editing.name}` : 'add'} editing={editing} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({ editing, onDone }: { editing: Editing; onDone: () => void }) {
  const { categoryList, addCategory, renameCategory } = useDemoStore()
  const isRename = editing.mode === 'rename'
  const [name, setName] = useState(isRename ? editing.name : '')
  const [saving, setSaving] = useState(false)

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.info('请输入分类名称')
      return
    }
    if (isRename && trimmed === editing.name) {
      onDone()
      return
    }
    if (categoryList.includes(trimmed)) {
      toast.info(`分类「${trimmed}」已存在`, { description: '请换一个名称' })
      return
    }
    setSaving(true)
    setTimeout(() => {
      if (isRename) {
        renameCategory(editing.name, trimmed)
        toast.success(`已将「${editing.name}」重命名为「${trimmed}」`, { description: '该分类下商品的分类信息已同步更新' })
      } else {
        addCategory(trimmed)
        toast.success(`已新增分类「${trimmed}」`)
      }
      setSaving(false)
      onDone()
    }, 400)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isRename ? '重命名分类' : '新增分类'}</DialogTitle>
        <DialogDescription>
          {isRename ? `重命名「${editing.name}」，该分类下的商品将同步更新` : '新增的分类会展示在收银台与商品管理的分类列表末尾'}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5">
        <Label className="mb-1.5 text-xs font-normal text-muted-foreground">分类名称</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9"
          placeholder="如：粮油调味"
          maxLength={12}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" className="h-9" onClick={onDone}>
          取消
        </Button>
        <Button className="h-9" disabled={saving} onClick={submit}>
          {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {isRename ? '保存' : '新增'}
        </Button>
      </DialogFooter>
    </>
  )
}
