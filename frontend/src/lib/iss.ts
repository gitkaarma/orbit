import * as satellite from 'satellite.js'
import { useEffect, useMemo, useState } from 'react'
import type { IssTle } from '@/api/types'

export interface IssState {
  lat: number
  lon: number
  altitudeKm: number
  velocityKmh: number
}

type SatRec = ReturnType<typeof satellite.twoline2satrec>

function propagateAt(satrec: SatRec, date: Date): IssState | null {
  const pv = satellite.propagate(satrec, date)
  if (!pv) return null
  const pos = pv.position
  const vel = pv.velocity
  // satellite.js signals a propagation failure with a boolean instead of a vector.
  if (typeof pos === 'boolean' || typeof vel === 'boolean') return null
  const gmst = satellite.gstime(date)
  const geo = satellite.eciToGeodetic(pos, gmst)
  const speedKms = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
  return {
    lat: satellite.degreesLat(geo.latitude),
    lon: satellite.degreesLong(geo.longitude),
    altitudeKm: geo.height,
    velocityKmh: speedKms * 3600,
  }
}

/** Live ISS position, recomputed locally from the TLE every `intervalMs` (no network). */
export function useIssPosition(tle: IssTle | undefined, intervalMs = 1000): IssState | null {
  const satrec = useMemo(() => (tle ? satellite.twoline2satrec(tle.line1, tle.line2) : null), [tle])
  const [state, setState] = useState<IssState | null>(null)

  useEffect(() => {
    if (!satrec) return
    const tick = () => setState(propagateAt(satrec, new Date()))
    tick()
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [satrec, intervalMs])

  return state
}

/** Lat/lon points tracing the orbit from now forward, for drawing the ground track. */
export function groundTrack(tle: IssTle, minutesAhead = 92, stepSec = 60): [number, number][] {
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
  const now = Date.now()
  const points: [number, number][] = []
  for (let s = 0; s <= minutesAhead * 60; s += stepSec) {
    const p = propagateAt(satrec, new Date(now + s * 1000))
    if (p) points.push([p.lat, p.lon])
  }
  return points
}
