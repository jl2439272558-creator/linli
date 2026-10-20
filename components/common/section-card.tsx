import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  icon,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  icon?: ReactNode
}) {
  return (
    <section className={cn('flex flex-col rounded-xl border border-border bg-card', className)}>
      <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon}
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
