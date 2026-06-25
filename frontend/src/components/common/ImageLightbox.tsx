import * as Dialog from '@radix-ui/react-dialog'
import { ExternalLink, X } from 'lucide-react'
import { useState } from 'react'
import type { FavoriteInput } from '@/api/types'
import { FavoriteButton } from './FavoriteButton'

export interface LightboxImage {
  imageUrl: string
  fallbackUrl?: string
  title: string
  subtitle?: string
  description?: string
  sourceUrl?: string
  favorite?: FavoriteInput
}

/** A focused full-screen view of a single image, with caption, source link, and save. */
export function ImageLightbox({ image, onClose }: { image: LightboxImage; onClose: () => void }) {
  const [src, setSrc] = useState(image.imageUrl)

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[94vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          <Dialog.Title className="sr-only">{image.title}</Dialog.Title>

          <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black">
            <img
              src={src}
              alt={image.title}
              onError={() => image.fallbackUrl && setSrc(image.fallbackUrl)}
              className="max-h-[68vh] w-full object-contain"
            />
            <Dialog.Close className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-border p-4 sm:p-5">
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-foreground">{image.title}</h2>
              {image.subtitle && <p className="mt-0.5 text-xs text-muted">{image.subtitle}</p>}
              {image.description && (
                <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-relaxed text-muted">
                  {image.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {image.favorite && <FavoriteButton item={image.favorite} />}
              {image.sourceUrl && (
                <a
                  href={image.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid size-9 place-items-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:border-input hover:text-foreground"
                  aria-label="Open at NASA"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
