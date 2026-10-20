import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { DemoStoreProvider } from '@/components/providers/demo-store'
import { Toaster } from '@/components/ui/sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoStoreProvider>
      <div className="min-h-screen min-w-[1200px]">
        <AppSidebar />
        <div className="flex min-h-screen flex-col pl-[230px]">
          <AppHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
      <Toaster position="top-center" richColors={false} />
    </DemoStoreProvider>
  )
}
