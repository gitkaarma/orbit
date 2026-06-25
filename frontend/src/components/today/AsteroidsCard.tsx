import { Radar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAsteroids } from '@/api/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLunar } from '@/lib/format'

export function AsteroidsCard() {
  const { data } = useAsteroids()
  const closest = data?.asteroids[0]

  return (
    <Link
      to="/asteroids"
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-input"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Radar className="size-4 text-accent" /> Near-Earth this week
      </span>
      {data ? (
        <div className="mt-3">
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
            {closest && <> · closest {formatLunar(closest.missDistanceLunar)}</>}
          </div>
        </div>
      ) : (
        <Skeleton className="mt-3 h-12 w-full" />
      )}
    </Link>
  )
}
