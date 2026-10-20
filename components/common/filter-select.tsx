'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type Option = { value: string; label: string }

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
  id,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[]
  className?: string
  id?: string
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => onChange((v as string | null) ?? options[0].value)}>
      <SelectTrigger id={id} aria-label={label} className={cn('h-9 w-40 bg-background text-[13px]', className)}>
        <span className="shrink-0 text-muted-foreground">{label}</span>
        <SelectValue className="justify-end truncate font-medium" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
