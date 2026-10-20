import Image from 'next/image'
import { Store } from 'lucide-react'
import { brand } from '@/lib/brand'

export function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
        {brand.logoSrc ? (
          <Image src={brand.logoSrc} alt={`${brand.name} Logo`} width={36} height={36} className="size-9 object-cover" />
        ) : (
          <Store className="size-5" strokeWidth={1.75} aria-hidden="true" />
        )}
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-wide text-foreground">{brand.name}</span>
        <span className="truncate text-[11px] text-muted-foreground">{brand.subtitle}</span>
      </div>
    </div>
  )
}
