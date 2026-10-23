import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server/auth'
import { defaultHome } from '@/lib/authz'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: '登录 · 店管家' }

/** 登录页：已登录用户直接进入角色首页 */
export default async function LoginPage() {
  const user = await getSessionUser()
  if (user) redirect(defaultHome(user.role))

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <LoginForm />
    </main>
  )
}
