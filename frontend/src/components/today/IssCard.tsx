import { Satellite } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useIssTle } from '@/api/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { formatKm, formatKmh, formatLatLon } from '@/lib/format'
import { useIssPosition } from '@/lib/iss'

export function IssCard() {
  const { data: tle } = useIssTle()
  const pos = useIssPosition(tle)

  return (
    <Link
      to="/iss"
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-input"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Satellite className="size-4 text-primary" /> ISS now
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" /> LIVE
        </span>
      </div>
      {pos ? (
        <div className="mt-3">
          <div className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {formatLatLon(pos.lat, pos.lon)}
          </div>
          <div className="mt-0.5 font-mono text-xs tabular-nums text-muted">
            {formatKm(pos.altitudeKm)} · {formatKmh(pos.velocityKmh)}
          </div>
        </div>
      ) : (
        <Skeleton className="mt-3 h-12 w-full" />
      )}
    </Link>
  )
}
