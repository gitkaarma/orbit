/** Formatting helpers, centralized so the whole UI reads consistently. */

export function formatNumber(value: number): string {
  return isFinite(value) ? new Intl.NumberFormat('en-US').format(Math.round(value)) : '—'
}

export function formatKm(value: number): string {
  return `${formatNumber(value)} km`
}

export function formatKmh(value: number): string {
  return `${formatNumber(value)} km/h`
}

/** Distance in lunar distances, e.g. "6.7 LD" (1 LD = the Earth-Moon distance). */
export function formatLunar(value: number): string {
  return `${value.toFixed(1)} LD`
}

export function formatLatLon(lat: number, lon: number): string {
  const la = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`
  const lo = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`
  return `${la}, ${lo}`
}

/** Asteroid diameter range, switching to km above 1 km. */
export function formatDiameter(minM: number, maxM: number): string {
  if (maxM >= 1000) {
    return `${(minM / 1000).toFixed(1)}–${(maxM / 1000).toFixed(1)} km`
  }
  return `${Math.round(minM)}–${Math.round(maxM)} m`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  // Accept "2026-06-25" or "2026-06-25 00:50:23" or ISO.
  const iso = value.includes(' ') ? value.replace(' ', 'T') : value
  const d = new Date(iso)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatRelative(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}
