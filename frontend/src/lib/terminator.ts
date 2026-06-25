// Day/night terminator and sun position, ported from the standard astronomical formulae
// (same approach as leaflet-terminator). Accurate to a fraction of a degree, which is plenty.

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

function julian(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5
}

function gmstDeg(jd: number): number {
  const d = jd - 2451545.0
  return ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360
}

interface SunPos {
  ra: number // right ascension, degrees
  decl: number // declination, degrees
}

function sunPosition(jd: number): SunPos {
  const d = jd - 2451545.0
  const g = (357.529 + 0.98560028 * d) * RAD
  const q = 280.459 + 0.98564736 * d
  const lon = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD
  const eps = (23.439 - 0.00000036 * d) * RAD
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lon), Math.cos(lon)) * DEG
  const decl = Math.asin(Math.sin(eps) * Math.sin(lon)) * DEG
  return { ra, decl }
}

/** Sun elevation (degrees) at a ground point; > 0 means daylight there. */
export function sunElevation(lat: number, lon: number, date: Date): number {
  const jd = julian(date)
  const sun = sunPosition(jd)
  const ha = (gmstDeg(jd) + lon - sun.ra) * RAD
  const elev = Math.asin(
    Math.sin(lat * RAD) * Math.sin(sun.decl * RAD) +
      Math.cos(lat * RAD) * Math.cos(sun.decl * RAD) * Math.cos(ha),
  )
  return elev * DEG
}

export function isDaylight(lat: number, lon: number, date: Date): boolean {
  return sunElevation(lat, lon, date) > 0
}

/** Polygon (lat/lon pairs) covering the night hemisphere, for shading the map. */
export function nightPolygon(date: Date): [number, number][] {
  const jd = julian(date)
  const sun = sunPosition(jd)
  const gmst = gmstDeg(jd)
  const points: [number, number][] = []
  for (let lon = -180; lon <= 180; lon += 2) {
    const ha = (gmst + lon - sun.ra) * RAD
    const lat = Math.atan(-Math.cos(ha) / Math.tan(sun.decl * RAD)) * DEG
    points.push([lat, lon])
  }
  // Close the polygon over whichever pole is currently in polar night.
  const darkPole = sun.decl > 0 ? -90 : 90
  points.push([darkPole, 180])
  points.push([darkPole, -180])
  return points
}
