import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

type Crumb = { label: string; href?: string }

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col items-start gap-3 md:mb-5 md:flex-row md:items-end md:gap-6">
      <div className="min-w-0">
        {breadcrumbs && (
          <nav aria-label="面包屑" className="mb-1.5">
            <ol className="flex items-center gap-1 text-xs text-muted-foreground">
              {breadcrumbs.map((c, i) => (
                <li key={c.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3" aria-hidden="true" />}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={i === breadcrumbs.length - 1 ? 'text-foreground' : undefined}>{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto">{actions}</div>}
    </div>
  )
}
