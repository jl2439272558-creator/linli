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
      <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 md:flex-nowrap md:gap-4 md:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon}
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto">{actions}</div>}
      </header>
      <div className={cn('flex-1 p-4 md:p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
