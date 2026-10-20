import Link from 'next/link'
import { ArrowUpRight, Construction } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { SectionCard } from '@/components/common/section-card'

/**
 * 后续阶段页面的统一占位视图：说明规划范围并给出可用的相关入口，
 * 不使用虚构数据，也不伪装成已实现功能。
 */
export function PlaceholderView({
  title,
  group,
  description,
  features,
  links,
}: {
  title: string
  group: string
  description: string
  features: string[]
  links?: { label: string; href: string }[]
}) {
  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: group }, { label: title }]}
        description={description}
      />

      <SectionCard
        title="本模块规划范围"
        description="当前演示版本未实现该模块，以下为规划中的功能"
        icon={
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Construction className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
        }
      >
        <ul className="flex flex-col gap-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>

        {links && links.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2.5 text-xs text-muted-foreground">当前可用的相关功能</p>
            <div className="flex flex-wrap gap-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {l.label}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3.5 text-xs text-muted-foreground">
        说明：本页不展示虚构的业务数据。功能将在后续阶段实现，届时会沿用当前统一的设计系统与数据口径。
      </p>
    </>
  )
}
