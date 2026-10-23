'use client'

import { useMemo, useState } from 'react'
import { Check, KeyRound, Loader2, MoreHorizontal, Pencil, Plus, RotateCcw, Search, ShieldCheck, UserRound, Users, UserX, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/common/filter-select'
import { PageHeader } from '@/components/common/page-header'
import { SectionCard } from '@/components/common/section-card'
import { StatCards, type StatItem } from '@/components/common/stat-cards'
import { StatusBadge } from '@/components/common/status-badge'
import { TablePagination } from '@/components/common/table-pagination'
import { useDemoStore } from '@/components/providers/demo-store'
import { permissionModules, rolePermissions, roleTone, staffStatusTone, type StaffMember, type StaffRole } from '@/lib/mock-data'

const ALL = 'all'
const roles: StaffRole[] = ['店长', '收银员', '理货员']

export function StaffView() {
  const { staffList, storeList, updateStaff } = useDemoStore()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [editing, setEditing] = useState<{ mode: 'add' } | { mode: 'edit'; member: StaffMember } | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return staffList.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !m.account.toLowerCase().includes(q)) return false
      if (role !== ALL && m.role !== role) return false
      if (status !== ALL && m.status !== status) return false
      return true
    })
  }, [staffList, query, role, status])

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize)
  const hasFilter = !!query || role !== ALL || status !== ALL

  const activeCount = staffList.filter((m) => m.status === '在职').length
  const storeName = (id: string) => storeList.find((s) => s.id === id)?.name ?? '—'

  const reset = () => {
    setQuery('')
    setRole(ALL)
    setStatus(ALL)
    setPage(1)
  }

  const stats: StatItem[] = [
    { label: '员工总数', value: `${staffList.length} 人`, icon: Users, tone: 'bg-brand-soft text-primary' },
    { label: '在职', value: `${activeCount} 人`, icon: UserRound, tone: 'bg-success-soft text-success' },
    { label: '已停用', value: `${staffList.length - activeCount} 人`, icon: UserX, tone: 'bg-warning-soft text-warning' },
    { label: '店长', value: `${staffList.filter((m) => m.role === '店长').length} 人`, icon: ShieldCheck, tone: 'bg-info-soft text-info' },
  ]

  return (
    <>
      <PageHeader
        title="员工与权限"
        breadcrumbs={[{ label: '门店管理' }, { label: '员工与权限' }]}
        description="维护员工账号与角色，角色决定可使用的功能模块（见下方权限矩阵）"
        actions={
          <Button className="h-9" onClick={() => setEditing({ mode: 'add' })}>
            <Plus data-icon="inline-start" />
            新增员工
          </Button>
        }
      />

      <StatCards items={stats} className="mb-4" />

      <section aria-label="员工列表" className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:gap-3 md:px-5">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="搜索员工姓名或账号"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索姓名 / 账号"
              className="h-9 w-full rounded-lg border border-input bg-background pr-8 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {query && (
              <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <FilterSelect label="角色" value={role} onChange={(v) => { setRole(v); setPage(1) }} options={[{ value: ALL, label: '全部' }, ...roles.map((r) => ({ value: r, label: r }))]} />
          <FilterSelect
            label="状态"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
            options={[
              { value: ALL, label: '全部' },
              { value: '在职', label: '在职' },
              { value: '已停用', label: '已停用' },
            ]}
          />
          <Button variant="ghost" className="h-9 text-muted-foreground" onClick={reset} disabled={!hasFilter}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[960px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">姓名</TableHead>
              <TableHead>登录账号</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>所属门店</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>最近登录</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-16 text-center">
                  <p className="text-sm text-foreground">没有找到匹配的员工</p>
                  <p className="mt-1 text-xs text-muted-foreground">请调整搜索关键词或筛选条件</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                    清除筛选
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((m) => (
                <TableRow key={m.id} className="[&_td]:py-2.5">
                  <TableCell className="pl-5 font-medium text-foreground">{m.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{m.account}</TableCell>
                  <TableCell>
                    <StatusBadge tone={roleTone[m.role]} dot={false}>
                      {m.role}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{storeName(m.storeId)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{m.phone}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{m.lastLoginAt ?? '从未登录'}</TableCell>
                  <TableCell>
                    <StatusBadge tone={staffStatusTone[m.status]}>{m.status}</StatusBadge>
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${m.name} 更多操作`} />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => setEditing({ mode: 'edit', member: m })}>
                            <Pencil data-icon="inline-start" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // 真实重置：服务端写入初始密码，不输出明文以外的凭据
                              fetch('/api/actions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'reset-staff-password', payload: { id: m.id } }),
                              })
                                .then((r) => r.json())
                                .then((data: { ok?: boolean; password?: string; error?: string }) => {
                                  if (data.ok) toast.success(`已重置「${m.name}」的登录密码`, { description: `新密码为 ${data.password}，请告知本人及时修改` })
                                  else toast.error('重置失败', { description: data.error })
                                })
                                .catch((err: unknown) => toast.error('重置失败', { description: err instanceof Error ? err.message : String(err) }))
                            }}
                          >
                            <KeyRound data-icon="inline-start" />
                            重置密码
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant={m.status === '在职' ? 'destructive' : 'default'}
                            onClick={() => {
                              const next = m.status === '在职' ? '已停用' : '在职'
                              updateStaff(m.id, { status: next })
                              toast.success(`已${next === '在职' ? '启用' : '停用'}「${m.name}」的账号`)
                            }}
                          >
                            {m.status === '在职' ? '停用账号' : '启用账号'}
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

      <SectionCard title="角色权限矩阵" description="不同角色可见的功能模块；演示版登录身份固定为店长（全部权限）" className="mt-4" bodyClassName="p-0">
        <div className="overflow-x-auto"><Table className="min-w-[640px] text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&_th]:h-10 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableHead className="pl-5">功能模块</TableHead>
              {roles.map((r) => (
                <TableHead key={r} className="w-32 text-center">
                  <StatusBadge tone={roleTone[r]} dot={false}>
                    {r}
                  </StatusBadge>
                </TableHead>
              ))}
              <TableHead className="pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissionModules.map((mod) => (
              <TableRow key={mod} className="[&_td]:py-2.5">
                <TableCell className="pl-5 font-medium text-foreground">{mod}</TableCell>
                {roles.map((r) => (
                  <TableCell key={r} className="text-center">
                    {rolePermissions[r].includes(mod) ? (
                      <Check className="mx-auto size-4 text-success" aria-label={`${r} 可用 ${mod}`} />
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="pr-5" />
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </SectionCard>

      <StaffDialog editing={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  )
}

function StaffDialog({ editing, onOpenChange }: { editing: { mode: 'add' } | { mode: 'edit'; member: StaffMember } | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!editing} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {editing && <StaffForm key={editing.mode === 'edit' ? editing.member.id : 'add'} editing={editing} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function StaffForm({ editing, onDone }: { editing: { mode: 'add' } | { mode: 'edit'; member: StaffMember }; onDone: () => void }) {
  const { storeList, addStaff, updateStaff } = useDemoStore()
  const isEdit = editing.mode === 'edit'
  const init = isEdit ? editing.member : null
  const [name, setName] = useState(init?.name ?? '')
  const [account, setAccount] = useState(init?.account ?? '')
  const [role, setRole] = useState<StaffRole>(init?.role ?? '收银员')
  const [storeId, setStoreId] = useState(init?.storeId ?? storeList[0]?.id ?? '')
  const [phoneHead, setPhoneHead] = useState(init ? init.phone.slice(0, 3) : '')
  const [phoneTail, setPhoneTail] = useState(init ? init.phone.slice(-4) : '')
  const [saving, setSaving] = useState(false)

  const submit = () => {
    if (!name.trim()) {
      toast.info('请输入员工姓名')
      return
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(account.trim())) {
      toast.info('请输入正确的登录账号', { description: '3–20 位字母、数字或下划线' })
      return
    }
    if (!/^\d{3}$/.test(phoneHead) || !/^\d{4}$/.test(phoneTail)) {
      toast.info('请输入正确的手机号', { description: '仅录入前三位与后四位数字' })
      return
    }
    setSaving(true)
    setTimeout(() => {
      const phone = `${phoneHead}****${phoneTail}`
      if (isEdit) {
        updateStaff(editing.member.id, { name: name.trim(), account: account.trim(), role, storeId, phone })
        toast.success(`已保存「${name.trim()}」的员工信息`)
      } else {
        addStaff({ name: name.trim(), account: account.trim(), role, storeId, phone, status: '在职' })
        toast.success(`已新增员工「${name.trim()}」`, { description: '初始密码已发送至员工手机（演示）' })
      }
      setSaving(false)
      onDone()
    }, 400)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? '编辑员工' : '新增员工'}</DialogTitle>
        <DialogDescription>{isEdit ? '修改员工角色与所属门店' : '新增员工默认状态为「在职」，初始密码将发送至手机'}</DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">姓名</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="如：李晓" maxLength={12} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">登录账号</Label>
            <Input value={account} onChange={(e) => setAccount(e.target.value)} className="h-9" placeholder="如：lixiao" maxLength={20} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">角色</Label>
            <Select items={roles.map((r) => ({ value: r, label: r }))} value={role} onValueChange={(v) => v && setRole(v as StaffRole)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-xs font-normal text-muted-foreground">所属门店</Label>
            <Select items={storeList.map((s) => ({ value: s.id, label: s.name }))} value={storeId} onValueChange={(v) => v && setStoreId(v as string)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {storeList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="mb-1.5 text-xs font-normal text-muted-foreground">手机号（前三位 + 后四位）</Label>
          <div className="flex items-center gap-1.5">
            <Input value={phoneHead} onChange={(e) => setPhoneHead(e.target.value.replace(/\D/g, '').slice(0, 3))} className="h-9 w-20 text-center" inputMode="numeric" aria-label="手机号前三位" />
            <span className="text-muted-foreground">****</span>
            <Input value={phoneTail} onChange={(e) => setPhoneTail(e.target.value.replace(/\D/g, '').slice(0, 4))} className="h-9 w-24 text-center" inputMode="numeric" aria-label="手机号后四位" />
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
