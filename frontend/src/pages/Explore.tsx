import { Search, Telescope, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiErrorMessage } from '@/api/client'
import { useLibrarySearchInfinite } from '@/api/queries'
import type { LibraryItem } from '@/api/types'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ImageLightbox, type LightboxImage } from '@/components/common/ImageLightbox'
import { ImageTile } from '@/components/common/ImageTile'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'

const CHIPS = ['Mars', 'Hubble', 'Apollo', 'Nebula', 'Jupiter', 'Saturn', 'Aurora', 'Galaxy', 'Eclipse', 'Earthrise']

function toLightbox(item: LibraryItem): LightboxImage {
  const subtitle = [item.center, formatDate(item.dateCreated)].filter(Boolean).join(' · ')
  const sourceUrl = `https://images.nasa.gov/details/${item.nasaId}`
  return {
    imageUrl: item.imageUrl,
    fallbackUrl: item.thumbUrl,
    title: item.title,
    subtitle: subtitle || undefined,
    description: item.description ?? undefined,
    sourceUrl,
    favorite: {
      itemType: 'library',
      externalId: item.nasaId,
      title: item.title,
      imageUrl: item.thumbUrl,
      sourceUrl,
    },
  }
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
      ))}
    </div>
  )
}

export function Explore() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [term, setTerm] = useState(q)
  const [selected, setSelected] = useState<LibraryItem | null>(null)

  // Keep the input in sync when the query changes via a chip or the back button.
  useEffect(() => setTerm(q), [q])

  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLibrarySearchInfinite(q)
  const items = data?.pages.flat() ?? []

  const submit = (value: string) => {
    const next = value.trim()
    setParams(next ? { q: next } : {}, { replace: false })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground">
          <Telescope className="size-6 text-accent" /> Explore the archive
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Six decades of NASA imagery, from the Apollo surface to the deep field. Search it.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(term)
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Try “Curiosity”, “Pillars of Creation”, “Saturn rings”…"
          aria-label="Search NASA's image library"
          className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-foreground placeholder:text-muted focus-visible:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {term && (
          <button
            type="button"
            onClick={() => {
              setTerm('')
              submit('')
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => submit(c)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              q.toLowerCase() === c.toLowerCase()
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-border bg-surface-2 text-foreground hover:border-input hover:text-accent'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {!q ? (
        <EmptyState
          icon={Telescope}
          title="What do you want to see?"
          message="Search above, or pick one of the topics to start exploring NASA's archive."
        />
      ) : isLoading ? (
        <GridSkeleton />
      ) : isError ? (
        <ErrorState title="Search failed" message={apiErrorMessage(error)} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No results for “${q}”`}
          message="Try a different spelling, a broader term, or one of the topics above."
        />
      ) : (
        <>
          <p className="text-xs text-muted">
            {items.length}
            {hasNextPage ? '+' : ''} result{items.length === 1 ? '' : 's'} for “{q}”
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <ImageTile
                key={item.nasaId}
                imageUrl={item.thumbUrl}
                alt={item.title}
                title={item.title}
                subtitle={[item.center, formatDate(item.dateCreated)].filter(Boolean).join(' · ') || undefined}
                favorite={toLightbox(item).favorite}
                onClick={() => setSelected(item)}
              />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      {selected && <ImageLightbox image={toLightbox(selected)} onClose={() => setSelected(null)} />}
    </div>
  )
}
