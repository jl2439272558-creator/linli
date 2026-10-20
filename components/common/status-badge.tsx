import { cn } from '@/lib/utils'

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'neutral' | 'brand'

const toneClass: Record<Tone, string> = {
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-[oklch(0.5_0.12_60)] ring-warning/25',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  info: 'bg-info-soft text-info ring-info/20',
  ai: 'bg-ai-soft text-ai ring-ai/20',
  neutral: 'bg-muted text-muted-foreground ring-border',
  brand: 'bg-brand-soft text-primary ring-primary/20',
}

const dotClass: Record<Tone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  ai: 'bg-ai',
  neutral: 'bg-muted-foreground/60',
  brand: 'bg-primary',
}

export function StatusBadge({
  tone,
  children,
  dot = true,
  pulse = false,
  className,
}: {
  tone: Tone
  children: React.ReactNode
  dot?: boolean
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        toneClass[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5">
          {pulse && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', dotClass[tone])} />}
          <span className={cn('relative inline-flex size-1.5 rounded-full', dotClass[tone])} />
        </span>
      )}
      {children}
    </span>
  )
}
