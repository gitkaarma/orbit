import { Globe, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { apiErrorMessage } from '@/api/client'
import { useEpicLatest } from '@/api/queries'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FavoriteButton } from '@/components/common/FavoriteButton'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatLatLon } from '@/lib/format'

function timeUtc(date: string): string {
  const t = date.split(' ')[1] ?? ''
  return t ? `${t.slice(0, 5)} UTC` : ''
}

export function Earth() {
  const { data, isLoading, isError, error, refetch } = useEpicLatest()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)

  // Default to the most recent frame once the day's images arrive.
  useEffect(() => {
    if (data?.length) setIndex(data.length - 1)
  }, [data])

  // While playing, sweep through the day. We render the tiny thumbnails for a smooth spin,
  // then snap to the full-resolution disk the moment it pauses.
  useEffect(() => {
    if (!playing || !data?.length) return
    timer.current = setInterval(() => setIndex((i) => (i + 1) % data.length), 550)
    return () => clearInterval(timer.current)
  }, [playing, data])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mx-auto aspect-square w-full max-w-xl rounded-2xl" />
      </div>
    )
  }
  if (isError) return <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />

  const header = (
    <div>
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground">
        <Globe className="size-6 text-primary" /> Earth, a million miles out
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        DSCOVR sits at the Sun-Earth L1 point and photographs the whole sunlit face.
        {data?.length ? ` These ${data.length} frames are one full day. Press play to watch it turn.` : ''}
      </p>
    </div>
  )

  if (!data?.length) {
    return (
      <div className="space-y-5">
        {header}
        <EmptyState
          icon={Globe}
          title="No Earth frames yet"
          message="DSCOVR hasn't posted today's images. Check back a little later."
        />
      </div>
    )
  }

  // Clamp: a refetch can return fewer frames than the index from the previous day.
  const safeIndex = Math.min(index, data.length - 1)
  const frame = data[safeIndex]

  return (
    <div className="space-y-5">
      {header}

      <div className="mx-auto w-full max-w-xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
          <img
            key={playing ? 'spin' : frame.identifier}
            src={playing ? frame.thumbUrl : frame.imageUrl}
            alt={`Earth on ${formatDate(frame.date)} at ${timeUtc(frame.date)}`}
            className="aspect-square w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause rotation' : 'Play rotation'}
            className="absolute left-3 top-3 grid size-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-0.5" />}
          </button>
          <div className="absolute right-3 top-3">
            <FavoriteButton
              variant="icon"
              item={{
                itemType: 'epic',
                externalId: frame.identifier,
                title: `Earth · ${formatDate(frame.date)} ${timeUtc(frame.date)}`,
                imageUrl: frame.thumbUrl,
                sourceUrl: frame.imageUrl,
              }}
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div>
              <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatDate(frame.date)} · {timeUtc(frame.date)}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                Sub-solar point {formatLatLon(frame.lat, frame.lon)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {data.map((f, i) => (
            <button
              key={f.identifier}
              type="button"
              onClick={() => {
                setPlaying(false)
                setIndex(i)
              }}
              title={timeUtc(f.date)}
              className={`relative size-12 shrink-0 overflow-hidden rounded-md border transition-colors ${
                i === safeIndex ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-input'
              }`}
            >
              <img src={f.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
