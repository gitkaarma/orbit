import { describe, expect, it } from 'vitest'
import { geoToVec3, sunDirectionEcef, type Vec3 } from './globeMath'
import { isDaylight } from './terminator'

const len = ([x, y, z]: Vec3) => Math.hypot(x, y, z)
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

describe('geoToVec3', () => {
  it('maps (0°, 0°) to +X', () => {
    const [x, y, z] = geoToVec3(0, 0, 1)
    expect(x).toBeCloseTo(1, 6)
    expect(y).toBeCloseTo(0, 6)
    expect(z).toBeCloseTo(0, 6)
  })

  it('maps the poles to ±Y regardless of longitude', () => {
    expect(geoToVec3(90, 0, 1)[1]).toBeCloseTo(1, 6)
    expect(geoToVec3(-90, 123, 1)[1]).toBeCloseTo(-1, 6)
  })

  it('keeps points on the sphere of the requested radius', () => {
    for (const [lat, lon] of [
      [12, -77],
      [-33, 151],
      [51, 0],
      [0, 180],
    ]) {
      expect(len(geoToVec3(lat, lon, 2.5))).toBeCloseTo(2.5, 6)
    }
  })
})

describe('sunDirectionEcef', () => {
  const date = new Date('2026-06-21T12:00:00Z')

  it('returns a unit vector', () => {
    expect(len(sunDirectionEcef(date))).toBeCloseTo(1, 6)
  })

  it('agrees with isDaylight everywhere: zenith·sun > 0 ⇔ daytime', () => {
    const sun = sunDirectionEcef(date)
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = -180; lon < 180; lon += 20) {
        const zenith = geoToVec3(lat, lon, 1)
        const d = dot(zenith, sun)
        if (Math.abs(d) < 1e-3) continue // skip the terminator knife-edge
        expect(d > 0).toBe(isDaylight(lat, lon, date))
      }
    }
  })
})
