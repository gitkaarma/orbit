import { useState, type ReactNode } from 'react'
import type { FavoriteInput } from '@/api/types'
import { cn } from '@/lib/utils'
import { FavoriteButton } from './FavoriteButton'

interface ImageTileProps {
  imageUrl: string
  fallbackUrl?: string
  alt: string
  title?: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  favorite?: FavoriteInput
  onClick: () => void
  aspect?: string
  className?: string
}

/**
 * A single image in a gallery: cover-fit thumbnail that opens a detail view on click,
 * with an always-available save control that doesn't trigger the open (sibling, not nested).
 */
export function ImageTile({
  imageUrl,
  fallbackUrl,
  alt,
  title,
  subtitle,
  badge,
  favorite,
  onClick,
  aspect = 'aspect-[4/3]',
  className,
}: ImageTileProps) {
  const [src, setSrc] = useState(imageUrl)

  return (
    <div className={cn('group relative overflow-hidden rounded-xl border border-border bg-surface', className)}>
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => fallbackUrl && src !== fallbackUrl && setSrc(fallbackUrl)}
          className={cn('w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]', aspect)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
        {(title || subtitle) && (
          <div className="absolute inset-x-0 bottom-0 p-3">
            {badge}
            {title && (
              <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-0.5 truncate text-[11px] text-muted">{subtitle}</p>}
          </div>
        )}
      </button>
      {favorite && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <FavoriteButton variant="icon" item={favorite} className="size-8" />
        </div>
      )}
    </div>
  )
}
