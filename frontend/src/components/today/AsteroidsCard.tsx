import { Radar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAsteroids } from '@/api/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatLunar } from '@/lib/format'

export function AsteroidsCard() {
  const { data } = useAsteroids()
  const closest = data?.asteroids.slice(0, 4) ?? []

  return (
    <Link
      to="/asteroids"
      className="flex h-72 flex-col rounded-xl border border-border bg-surface p-4 transition-colors hover:border-input"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Radar className="size-4 text-accent" /> Near-Earth this week
      </span>
      {data ? (
        <>
          <div className="mt-2">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {data.count}
              <span className="ml-1.5 text-sm font-normal text-muted">objects</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {data.hazardousCount > 0 ? (
                <span className="text-hazard">{data.hazardousCount} flagged hazardous</span>
              ) : (
                'none flagged hazardous'
              )}
            </div>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-hidden border-t border-border/60 pt-2.5">
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">Closest approaches</div>
            <div className="space-y-1.5">
              {closest.map((a) => (
                <div key={a.id} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-foreground">{a.name}</span>
                  <span className="shrink-0 text-[10px] text-muted">{formatDate(a.closeApproachDate)}</span>
                  <span
                    className={`shrink-0 font-mono tabular-nums ${a.hazardous ? 'text-hazard' : 'text-primary'}`}
                  >
                    {formatLunar(a.missDistanceLunar)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <Skeleton className="mt-3 h-full w-full" />
      )}
    </Link>
  )
}
