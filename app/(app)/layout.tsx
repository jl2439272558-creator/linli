import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { DemoStoreProvider } from '@/components/providers/demo-store'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import { getSessionUser } from '@/lib/server/auth'

/** 应用外壳布局：未登录统一跳转登录页，登录用户信息注入客户端 Auth 上下文 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return (
    <AuthProvider user={user}>
      <DemoStoreProvider>
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" richColors={false} />
      </DemoStoreProvider>
    </AuthProvider>
  )
}
