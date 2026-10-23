'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Loader2, LockKeyhole, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { brand } from '@/lib/brand'

/** 账号密码登录：成功后由服务端下发 httpOnly 会话 Cookie 并进入角色首页 */
export function LoginForm() {
  const router = useRouter()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || !data.ok) {
        setError(data.error || `登录失败（HTTP ${resp.status}）`)
        setSubmitting(false)
        return
      }
      // 跳转前整页刷新，确保服务端会话与菜单权限生效
      window.location.href = data.home || '/'
    } catch {
      setError('网络异常，请稍后重试')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-[380px] flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <KeyRound className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold tracking-wide text-foreground">{brand.name}</h1>
        <p className="text-[13px] text-muted-foreground">{brand.subtitle}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account" className="text-xs font-normal text-muted-foreground">
            账号
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoComplete="username"
              autoFocus
              placeholder="请输入登录账号"
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-xs font-normal text-muted-foreground">
            密码
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="请输入密码"
              className="h-10 pl-9"
            />
          </div>
        </div>

        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}

        <Button type="submit" className="h-10 w-full" disabled={submitting || !account.trim() || !password}>
          {submitting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          {submitting ? '登录中…' : '登录'}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        员工初始密码为 123456，登录后请联系店长在员工管理中重置
      </p>
    </form>
  )
}
