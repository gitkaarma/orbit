import { ExternalLink, Radar, Star, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiErrorMessage } from '@/api/client'
import { useFavorites, useRemoveFavorite } from '@/api/queries'
import type { FavoriteDto } from '@/api/types'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelative } from '@/lib/format'

const TYPE_LABEL: Record<string, string> = {
  apod: 'Picture of the Day',
  library: 'Image archive',
  epic: 'Earth · DSCOVR',
  asteroid: 'Near-Earth object',
}

function RemoveButton({ fav }: { fav: FavoriteDto }) {
  const remove = useRemoveFavorite()
  return (
    <button
      type="button"
      onClick={() => remove.mutate({ itemType: fav.itemType, externalId: fav.externalId })}
      disabled={remove.isPending}
      aria-label="Remove from saved"
      className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition-colors hover:bg-hazard/80 disabled:opacity-50"
    >
      <X className="size-4" />
    </button>
  )
}

function SavedTile({ fav }: { fav: FavoriteDto }) {
  const href = fav.sourceUrl ?? fav.imageUrl ?? undefined
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface">
      <a href={href} target="_blank" rel="noreferrer" className="block">
        {fav.imageUrl ? (
          <img src={fav.imageUrl} alt={fav.title ?? ''} loading="lazy" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="aspect-[4/3] w-full bg-surface-2" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <span className="text-[10px] uppercase tracking-wide text-accent">
            {TYPE_LABEL[fav.itemType] ?? fav.itemType}
          </span>
          <h3 className="mt-0.5 line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground">
            {fav.title ?? 'Untitled'}
          </h3>
          <span className="mt-0.5 block text-[11px] text-muted">saved {formatRelative(fav.addedAt)}</span>
        </div>
      </a>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <RemoveButton fav={fav} />
      </div>
    </div>
  )
}

function SavedAsteroid({ fav }: { fav: FavoriteDto }) {
  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-accent">
        <Radar className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">{fav.title ?? fav.externalId}</div>
        <div className="text-xs text-muted">Near-Earth object · saved {formatRelative(fav.addedAt)}</div>
      </div>
      {fav.sourceUrl && (
        <a
          href={fav.sourceUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in JPL Small-Body Database"
          className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-4" />
        </a>
      )}
      <RemoveButton fav={fav} />
    </div>
  )
}

export function Saved() {
  const { data, isLoading, isError, error, refetch } = useFavorites()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-5">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground">
          <Star className="size-6 text-accent" /> Saved
        </h1>
        <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
      </div>
    )
  }

  const favorites = data ?? []
  const images = favorites.filter((f) => f.itemType !== 'asteroid')
  const asteroids = favorites.filter((f) => f.itemType === 'asteroid')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground">
          <Star className="size-6 text-accent" /> Saved
        </h1>
        <p className="mt-1 text-sm text-muted">
          Your collection, kept on this device. {favorites.length} item{favorites.length === 1 ? '' : 's'}.
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nothing saved yet"
          message="Tap the star on any image, asteroid, or picture of the day and it lands here."
          action={
            <Link
              to="/explore"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Explore the archive
            </Link>
          }
        />
      ) : (
        <>
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((f) => (
                <SavedTile key={`${f.itemType}-${f.externalId}`} fav={f} />
              ))}
            </div>
          )}
          {asteroids.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-display text-sm font-semibold text-foreground">Asteroids</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {asteroids.map((f) => (
                  <SavedAsteroid key={`${f.itemType}-${f.externalId}`} fav={f} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
