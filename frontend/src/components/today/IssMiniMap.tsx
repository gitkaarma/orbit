import { useMemo } from 'react'
import type { IssTle } from '@/api/types'
import { groundTrack, type IssState } from '@/lib/iss'

// Equirectangular projection into a 360x180 box: x = lon+180, y = 90-lat.
const W = 360
const H = 180

/** Split the track wherever it crosses the antimeridian, so it doesn't streak across the map. */
function trackSegments(track: [number, number][]): string[] {
  const segs: string[][] = [[]]
  let prevLon: number | null = null
  for (const [lat, lon] of track) {
    if (prevLon !== null && Math.abs(lon - prevLon) > 180) segs.push([])
    segs[segs.length - 1].push(`${(lon + 180).toFixed(1)},${(90 - lat).toFixed(1)}`)
    prevLon = lon
  }
  return segs.filter((s) => s.length > 1).map((s) => `M${s.join(' L')}`)
}

/** A lightweight tracking-screen view of the ISS orbit: graticule, ground track, live marker. */
export function IssMiniMap({ tle, pos }: { tle: IssTle; pos: IssState | null }) {
  const paths = useMemo(() => trackSegments(groundTrack(tle)), [tle])
  const left = pos ? ((pos.lon + 180) / 360) * 100 : null
  const top = pos ? ((90 - pos.lat) / 180) * 100 : null

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0e18]">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <g stroke="#1e2636" strokeWidth="0.6">
          {[60, 120, 240, 300].map((x) => <line key={x} x1={x} y1="0" x2={x} y2={H} />)}
          {[30, 60, 120, 150].map((y) => <line key={y} x1="0" y1={y} x2={W} y2={y} />)}
        </g>
        <line x1="180" y1="0" x2="180" y2={H} stroke="#2a3346" strokeWidth="0.8" />
        <line x1="0" y1="90" x2={W} y2="90" stroke="#2a3346" strokeWidth="0.8" />
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#6aa8ff" strokeWidth="1.3" strokeOpacity="0.7" />
        ))}
      </svg>
      {left !== null && top !== null && (
        <span
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px_rgba(106,168,255,0.85)]"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      )}
    </div>
  )
}
