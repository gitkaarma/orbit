import { ChevronLeft, ChevronRight, Download, Play, Shuffle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiErrorMessage } from '@/api/client'
import { useApod, useApodArchive } from '@/api/queries'
import type { Apod as ApodModel } from '@/api/types'
import { ErrorState } from '@/components/common/ErrorState'
import { FavoriteButton } from '@/components/common/FavoriteButton'
import { ImageLightbox } from '@/components/common/ImageLightbox'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'

const APOD_START = '1995-06-16'

function todayStr(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function randomDate(): string {
  const start = new Date(APOD_START).getTime()
  const end = new Date(todayStr()).getTime()
  const t = start + Math.floor((end - start) * Math.random())
  return new Date(t).toISOString().slice(0, 10)
}

function ApodMedia({ data, onOpen }: { data: ApodModel; onOpen: () => void }) {
  if (data.mediaType === 'video') {
    // APOD videos are either a direct media file (needs <video>) or an embed page (needs <iframe>).
    const isFile = /\.(mp4|webm|ogv|ogg)(\?|#|$)/i.test(data.url)
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
        {isFile ? (
          <video
            controls
            playsInline
            poster={data.thumbnailUrl ?? undefined}
            className="h-full w-full"
          >
            <source src={data.url} />
          </video>
        ) : (
          <iframe
            src={data.url}
            title={data.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        )}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-2xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img src={data.url} alt={data.title} loading="eager" className="max-h-[72vh] w-full object-contain" />
      <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-1 text-xs text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
        View full size
      </span>
    </button>
  )
}

function ArchiveTile({
  item,
  active,
  onSelect,
}: {
  item: ApodModel
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={item.title}
      className={`group relative aspect-square w-full overflow-hidden rounded-lg border transition-colors ${
        active ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-input'
      }`}
    >
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-surface-2" />
      )}
      {item.mediaType === 'video' && (
        <span className="absolute inset-0 grid place-items-center">
          <Play className="size-4 fill-white text-white drop-shadow" />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-1.5">
        <span className="block truncate text-[10px] text-muted">{formatDate(item.date)}</span>
      </div>
    </button>
  )
}

export function Apod() {
  const [params, setParams] = useSearchParams()
  const today = todayStr()
  const selected = params.get('date') ?? today
  const [lightbox, setLightbox] = useState(false)

  // "Today" is fetched via the keyless today endpoint to avoid the not-yet-posted edge.
  const dateParam = selected === today ? undefined : selected
  const { data, isLoading, isError, error, refetch } = useApod(dateParam)
  const { data: archive } = useApodArchive()

  const go = (date: string) => {
    const clamped = date < APOD_START ? APOD_START : date > today ? today : date
    setParams(clamped === today ? {} : { date: clamped })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground">
            <Sparkles className="size-6 text-accent" /> Astronomy Picture of the Day
          </h1>
          <p className="mt-1 text-sm text-muted">
            Every day since June 1995, one image of our universe, explained by an astronomer.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Previous day"
            disabled={selected <= APOD_START}
            onClick={() => go(addDays(selected, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <input
            type="date"
            value={selected}
            min={APOD_START}
            max={today}
            onChange={(e) => e.target.value && go(e.target.value)}
            aria-label="Pick a date"
            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground [color-scheme:dark] focus-visible:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            variant="secondary"
            size="icon"
            aria-label="Next day"
            disabled={selected >= today}
            onClick={() => go(addDays(selected, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="secondary" onClick={() => go(randomDate())}>
            <Shuffle className="size-4" /> Random
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="aspect-[16/10] w-full rounded-2xl sm:aspect-[2/1]" />
      ) : isError ? (
        <ErrorState title="No picture for this date" message={apiErrorMessage(error)} onRetry={() => refetch()} />
      ) : data ? (
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <ApodMedia data={data} onOpen={() => setLightbox(true)} />
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-accent">{formatDate(data.date)}</div>
              <h2 className="mt-1 font-display text-xl font-bold leading-tight text-foreground">{data.title}</h2>
              {data.copyright && <p className="mt-1 text-xs text-muted">© {data.copyright.trim()}</p>}
            </div>
            <p className="text-sm leading-relaxed text-muted">{data.explanation}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <FavoriteButton
                item={{
                  itemType: 'apod',
                  externalId: data.date,
                  title: data.title,
                  imageUrl: data.thumbnailUrl,
                  sourceUrl: data.hdurl ?? data.url,
                }}
              />
              {data.mediaType === 'image' && (
                <Button variant="outline" asChild>
                  <a href={data.hdurl ?? data.url} target="_blank" rel="noreferrer">
                    <Download className="size-4" /> HD
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {archive && archive.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="font-display text-sm font-semibold text-foreground">Recent days</h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
            {archive.map((item) => (
              <ArchiveTile
                key={item.date}
                item={item}
                active={item.date === selected}
                onSelect={() => go(item.date)}
              />
            ))}
          </div>
        </div>
      )}

      {lightbox && data && data.mediaType === 'image' && (
        <ImageLightbox
          image={{
            imageUrl: data.hdurl ?? data.url,
            fallbackUrl: data.url,
            title: data.title,
            subtitle: formatDate(data.date),
            description: data.explanation,
            sourceUrl: data.hdurl ?? data.url,
            favorite: {
              itemType: 'apod',
              externalId: data.date,
              title: data.title,
              imageUrl: data.thumbnailUrl,
              sourceUrl: data.hdurl ?? data.url,
            },
          }}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  )
}
