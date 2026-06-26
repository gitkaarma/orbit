import { subsolarPoint } from './terminator'

const DEG2RAD = Math.PI / 180

export type Vec3 = [number, number, number]

/**
 * Geodetic latitude/longitude (degrees) → a point on a sphere of the given radius,
 * in scene space. The convention matches three.js's default SphereGeometry UV layout,
 * so an equirectangular Earth texture lines up with real lat/lon, and the ISS, the Sun,
 * and the texture all share one coordinate frame.
 *
 * Sanity: (0,0)→[r,0,0], north pole (90,·)→[0,r,0], south pole (−90,·)→[0,−r,0].
 */
export function geoToVec3(latDeg: number, lonDeg: number, radius: number): Vec3 {
  const phi = (90 - latDeg) * DEG2RAD // polar angle from +Y
  const theta = (lonDeg + 180) * DEG2RAD // azimuth
  const sinPhi = Math.sin(phi)
  return [
    -radius * sinPhi * Math.cos(theta),
    radius * Math.cos(phi),
    radius * sinPhi * Math.sin(theta),
  ]
}

/**
 * Unit vector from Earth's centre toward the Sun, in the same frame as {@link geoToVec3}.
 * Used to light the day/night terminator shader. Derived from the sub-solar point so it
 * stays consistent with `isDaylight()` / `nightPolygon()` in terminator.ts.
 */
export function sunDirectionEcef(date: Date): Vec3 {
  const { lat, lon } = subsolarPoint(date)
  return geoToVec3(lat, lon, 1)
}
