import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProductThumb({
  src,
  alt,
  size = 44,
  className,
}: {
  src: string | null
  alt: string
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} width={size * 2} height={size * 2} className="size-full object-contain p-0.5" />
      ) : (
        <ImageOff className="size-1/2 text-muted-foreground/50" strokeWidth={1.5} aria-label="暂无图片" />
      )}
    </div>
  )
}
