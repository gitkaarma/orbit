import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDiameter,
  formatKm,
  formatKmh,
  formatLatLon,
  formatLunar,
  formatNumber,
  formatRelative,
} from './format'

describe('formatNumber', () => {
  it('rounds and groups thousands', () => {
    expect(formatNumber(1234.6)).toBe('1,235')
  })
  it('returns a dash for non-finite values', () => {
    expect(formatNumber(Infinity)).toBe('—')
    expect(formatNumber(NaN)).toBe('—')
  })
})

describe('units', () => {
  it('formats km and km/h', () => {
    expect(formatKm(434)).toBe('434 km')
    expect(formatKmh(27_600)).toBe('27,600 km/h')
  })
  it('formats lunar distances to one decimal', () => {
    expect(formatLunar(6.6719)).toBe('6.7 LD')
  })
})

describe('formatLatLon', () => {
  it('uses N/S and E/W hemispheres', () => {
    expect(formatLatLon(-50.83, -139.01)).toBe('50.83°S, 139.01°W')
    expect(formatLatLon(17.7, 168.3)).toBe('17.70°N, 168.30°E')
  })
})

describe('formatDiameter', () => {
  it('switches to km above a kilometer', () => {
    expect(formatDiameter(708.85, 1585.04)).toMatch(/^0\.7.1\.6 km$/)
  })
  it('stays in meters below a kilometer', () => {
    expect(formatDiameter(60.05, 134.28)).toMatch(/^60.134 m$/)
  })
})

describe('formatDate', () => {
  it('formats ISO and space-separated dates', () => {
    expect(formatDate('2026-06-25')).toBe('Jun 25, 2026')
    expect(formatDate('2026-06-22 00:50:23')).toBe('Jun 22, 2026')
  })
  it('returns a dash for empty input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })
})

describe('formatRelative', () => {
  it('reports recent times as just now', () => {
    expect(formatRelative(new Date().toISOString())).toBe('just now')
  })
  it('returns empty string for invalid input', () => {
    expect(formatRelative('not-a-date')).toBe('')
  })
})
