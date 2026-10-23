import { AppShell } from '@/components/layout/app-shell'
import { DemoStoreProvider } from '@/components/providers/demo-store'
import { Toaster } from '@/components/ui/sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoStoreProvider>
      <AppShell>{children}</AppShell>
      <Toaster position="top-center" richColors={false} />
    </DemoStoreProvider>
  )
}
