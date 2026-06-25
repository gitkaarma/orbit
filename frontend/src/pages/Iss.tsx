import { Satellite } from 'lucide-react'
import { apiErrorMessage } from '@/api/client'
import { useIssTle } from '@/api/queries'
import { ErrorState } from '@/components/common/ErrorState'
import { IssMap } from '@/components/iss/IssMap'
import { Skeleton } from '@/components/ui/skeleton'
import { formatKm, formatKmh, formatLatLon } from '@/lib/format'
import { useIssPosition, type IssState } from '@/lib/iss'
import { isDaylight } from '@/lib/terminator'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-mono text-sm tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

function IssStats({ pos }: { pos: IssState }) {
  const day = isDaylight(pos.lat, pos.lon, new Date())
  return (
    <div className="absolute left-3 top-3 z-[500] w-48 rounded-xl border border-border bg-background/80 p-3 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
        <span className="size-1.5 animate-pulse rounded-full bg-primary" /> LIVE
      </div>
      <div className="mt-1.5 font-mono text-base font-semibold tabular-nums text-foreground">
        {formatLatLon(pos.lat, pos.lon)}
      </div>
      <dl className="mt-3 space-y-2">
        <Stat label="Altitude" value={formatKm(pos.altitudeKm)} />
        <Stat label="Speed" value={formatKmh(pos.velocityKmh)} />
        <Stat label="Sunlight" value={day ? 'In daylight' : "In Earth's shadow"} />
      </dl>
    </div>
  )
}

export function Iss() {
  const { data: tle, isLoading, isError, error, refetch } = useIssTle()
  const pos = useIssPosition(tle)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground">
          <Satellite className="size-6 text-primary" /> Tracking the ISS
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          The position is computed live from orbital elements, right in your browser. The blue
          arc traces the ground path for the next 90 minutes; the shaded region is night.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-[62vh] min-h-[360px] w-full rounded-xl" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load the orbit"
          message={apiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : tle ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <div className="h-[62vh] min-h-[360px]">
            <IssMap tle={tle} pos={pos} />
          </div>
          {pos && <IssStats pos={pos} />}
          <div className="pointer-events-none absolute bottom-1 right-2 z-[500] text-[10px] text-muted">
            © OpenStreetMap, CARTO
          </div>
        </div>
      ) : null}
    </div>
  )
}
