import { ArrowDown, ArrowUp, Radar } from 'lucide-react'
import { useMemo, useState } from 'react'
import { apiErrorMessage } from '@/api/client'
import { useAsteroids } from '@/api/queries'
import type { Asteroid } from '@/api/types'
import { AsteroidScatter } from '@/components/asteroids/AsteroidScatter'
import { ErrorState } from '@/components/common/ErrorState'
import { FavoriteButton } from '@/components/common/FavoriteButton'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDiameter, formatKmh, formatLunar } from '@/lib/format'

function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'hazard' }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === 'hazard' ? 'text-hazard' : 'text-foreground'}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 truncate text-xs text-muted">{sub}</div>}
    </div>
  )
}

type SortKey = 'name' | 'closeApproachDate' | 'diameterMaxM' | 'missDistanceLunar' | 'velocityKmh'

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'name', label: 'Object' },
  { key: 'closeApproachDate', label: 'Approach' },
  { key: 'diameterMaxM', label: 'Diameter', align: 'right' },
  { key: 'missDistanceLunar', label: 'Miss distance', align: 'right' },
  { key: 'velocityKmh', label: 'Speed', align: 'right' },
]

function AsteroidTable({ asteroids }: { asteroids: Asteroid[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'missDistanceLunar',
    dir: 'asc',
  })

  const sorted = useMemo(() => {
    const m = sort.dir === 'asc' ? 1 : -1
    return [...asteroids].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * m
      return ((av as number) - (bv as number)) * m
    })
  }, [asteroids, sort])

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-muted">
            {COLUMNS.map((c) => (
              <th key={c.key} className={`px-3 py-2.5 font-medium ${c.align === 'right' ? 'text-right' : ''}`}>
                <button
                  type="button"
                  onClick={() => toggle(c.key)}
                  className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                    sort.key === c.key ? 'text-foreground' : ''
                  } ${c.align === 'right' ? 'flex-row-reverse' : ''}`}
                >
                  {c.label}
                  {sort.key === c.key &&
                    (sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                </button>
              </th>
            ))}
            <th className="px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id} className="border-b border-border/60 last:border-0 hover:bg-surface/60">
              <td className="px-3 py-2.5">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {a.name}
                  {a.hazardous && <Badge variant="hazard">hazardous</Badge>}
                </span>
              </td>
              <td className="px-3 py-2.5 text-muted">{formatDate(a.closeApproachDate)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                {formatDiameter(a.diameterMinM, a.diameterMaxM)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                <span className={a.missDistanceLunar < 1 ? 'text-hazard' : 'text-foreground'}>
                  {formatLunar(a.missDistanceLunar)}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{formatKmh(a.velocityKmh)}</td>
              <td className="px-2 py-1.5">
                <FavoriteButton
                  variant="icon"
                  className="size-8 border-transparent bg-transparent text-muted hover:bg-surface-2 hover:text-foreground"
                  item={{
                    itemType: 'asteroid',
                    externalId: a.id,
                    title: a.name,
                    sourceUrl: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(a.name)}`,
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Asteroids() {
  const { data, isLoading, isError, error, refetch } = useAsteroids()

  const stats = useMemo(() => {
    if (!data?.asteroids.length) return null
    const closest = data.asteroids.reduce((m, a) => (a.missDistanceLunar < m.missDistanceLunar ? a : m))
    const fastest = data.asteroids.reduce((m, a) => (a.velocityKmh > m.velocityKmh ? a : m))
    const biggest = data.asteroids.reduce((m, a) => (a.diameterMaxM > m.diameterMaxM ? a : m))
    return { closest, fastest, biggest }
  }, [data])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground">
          <Radar className="size-6 text-accent" /> Near-Earth this week
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          {data
            ? `${data.count} asteroids pass within range over the next seven days. Distance is in lunar distances (1 LD = the gap to the Moon).`
            : 'Asteroids making a close approach over the next seven days.'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
      ) : data && stats ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Objects" value={String(data.count)} sub="this week" />
            <StatCard
              label="Hazardous"
              value={String(data.hazardousCount)}
              sub={data.hazardousCount ? 'flagged by NASA' : 'none flagged'}
              tone={data.hazardousCount ? 'hazard' : undefined}
            />
            <StatCard label="Closest pass" value={formatLunar(stats.closest.missDistanceLunar)} sub={stats.closest.name} />
            <StatCard
              label="Largest"
              value={formatDiameter(stats.biggest.diameterMinM, stats.biggest.diameterMaxM)}
              sub={stats.biggest.name}
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="font-display text-sm font-semibold text-foreground">Size vs. closeness</h2>
            <p className="mb-2 mt-0.5 text-xs text-muted">
              Up and to the left is bigger and closer. Red objects are flagged potentially hazardous.
            </p>
            <AsteroidScatter asteroids={data.asteroids} />
          </div>

          <AsteroidTable asteroids={data.asteroids} />
        </>
      ) : null}
    </div>
  )
}
