import { Star } from 'lucide-react'
import { useAddFavorite, useFavorites, useRemoveFavorite } from '@/api/queries'
import type { FavoriteInput } from '@/api/types'
import { cn } from '@/lib/utils'

/** Toggles whether an item is in the user's saved gallery. `icon` variant is for image corners. */
export function FavoriteButton({
  item,
  variant = 'button',
  className,
}: {
  item: FavoriteInput
  variant?: 'button' | 'icon'
  className?: string
}) {
  const { data: favorites } = useFavorites()
  const add = useAddFavorite()
  const remove = useRemoveFavorite()
  const saved =
    favorites?.some((f) => f.itemType === item.itemType && f.externalId === item.externalId) ?? false
  const busy = add.isPending || remove.isPending

  const toggle = () => {
    if (saved) remove.mutate({ itemType: item.itemType, externalId: item.externalId })
    else add.mutate(item)
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={saved ? 'Remove from saved' : 'Save'}
        className={cn(
          'grid size-9 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/65',
          className,
        )}
      >
        <Star className={cn('size-4', saved && 'fill-accent text-accent')} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm font-medium transition-colors hover:border-input disabled:opacity-50',
        saved && 'border-accent/40',
        className,
      )}
    >
      <Star className={cn('size-4', saved && 'fill-accent text-accent')} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
