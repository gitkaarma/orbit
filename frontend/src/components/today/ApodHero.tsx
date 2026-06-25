import { ArrowRight, Play, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiErrorMessage } from '@/api/client'
import { useApod } from '@/api/queries'
import { ErrorState } from '@/components/common/ErrorState'
import { FavoriteButton } from '@/components/common/FavoriteButton'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'

export function ApodHero() {
  const { data, isLoading, isError, error, refetch } = useApod()

  if (isLoading) return <Skeleton className="aspect-[16/10] w-full rounded-2xl sm:aspect-[21/9]" />
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load today's image"
        message={apiErrorMessage(error)}
        onRetry={() => refetch()}
      />
    )
  }
  if (!data) return null

  const isVideo = data.mediaType === 'video'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      {data.thumbnailUrl ? (
        <img
          src={data.thumbnailUrl}
          alt={data.title}
          loading="eager"
          className="aspect-[16/10] w-full object-cover sm:aspect-[21/9]"
        />
      ) : (
        <div className="aspect-[16/10] w-full bg-surface-2 sm:aspect-[21/9]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />

      <div className="absolute right-3 top-3">
        <FavoriteButton
          variant="icon"
          item={{
            itemType: 'apod',
            externalId: data.date,
            title: data.title,
            imageUrl: data.thumbnailUrl,
            sourceUrl: data.hdurl ?? data.url,
          }}
        />
      </div>

      {isVideo && (
        <div className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/50 backdrop-blur">
          <Play className="size-6 translate-x-0.5 text-white" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
          <Sparkles className="size-3.5" />
          Astronomy Picture of the Day · {formatDate(data.date)}
        </div>
        <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {data.title}
        </h1>
        <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted sm:line-clamp-3">
          {data.explanation}
        </p>
        <Link
          to="/apod"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {isVideo ? 'Watch and explore the archive' : 'Read more and explore the archive'}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
