// Shared config for the satellite swarm, used by both the worker (propagation) and the
// renderer (colours, legend). Keep this free of three.js / DOM so the worker can import it.

export const EARTH_KM = 6371

export const SWARM_CATEGORY_ORDER = ['starlink', 'oneweb', 'navigation', 'other'] as const
export type SatCategoryKey = (typeof SWARM_CATEGORY_ORDER)[number]

export const SAT_CATEGORY_META: Record<SatCategoryKey, { label: string; color: string }> = {
  starlink: { label: 'Starlink', color: '#54c8ff' },
  oneweb: { label: 'OneWeb', color: '#b07bff' },
  navigation: { label: 'Navigation', color: '#ffd166' },
  other: { label: 'Other', color: '#8b97ad' },
}

/**
 * Maps a satellite's geodetic height to a scene radius (Earth radius = 1). Low orbits are
 * lifted a little so the dense LEO shell reads clearly; higher orbits are compressed so
 * MEO/GEO objects stay within the camera frame instead of flying off into the distance.
 */
export function satSceneRadius(heightKm: number): number {
  return 1 + Math.min(2.2, (heightKm / EARTH_KM) * 1.4)
}

/** Sentinel placed far beyond the camera's far plane to hide decayed/unpropagatable sats. */
export const SWARM_HIDDEN = 9999

export interface SwarmInit {
  type: 'init'
  sats: { l1: string; l2: string }[]
  intervalMs: number
}

export interface SwarmPositions {
  type: 'pos'
  positions: Float32Array
}
