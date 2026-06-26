import { SWARM_CATEGORY_ORDER, type SatCategoryKey } from './swarm'

/** A control instruction embedded in the narration that steers the globe. */
export type SkyAction =
  | { type: 'focus'; target: 'iss' }
  | { type: 'focus'; lat: number; lon: number }
  | { type: 'highlight'; category: SatCategoryKey }
  | { type: 'reset' }

export interface ParsedNarration {
  /** The narration with all complete tags (and any trailing incomplete tag) removed. */
  clean: string
  /** Every complete action found so far, in order. */
  actions: SkyAction[]
}

const CATEGORIES = new Set<string>(SWARM_CATEGORY_ORDER)

function toAction(type: string, arg: string | undefined): SkyAction | null {
  switch (type) {
    case 'focus': {
      if (!arg || arg === 'iss') return { type: 'focus', target: 'iss' }
      const [latStr, lonStr] = arg.split(',')
      const lat = Number(latStr)
      const lon = Number(lonStr)
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { type: 'focus', lat, lon }
      return { type: 'focus', target: 'iss' }
    }
    case 'highlight':
      return arg && CATEGORIES.has(arg) ? { type: 'highlight', category: arg as SatCategoryKey } : null
    case 'reset':
      return { type: 'reset' }
    default:
      return null
  }
}

/**
 * Parses the running narration buffer. Designed to be called repeatedly as tokens stream in:
 * it strips every complete `[[type:arg]]` tag from the display text, hides a trailing incomplete
 * tag (so a half-arrived `[[foc` never flashes on screen), and returns all complete actions found.
 */
export function parseNarration(raw: string): ParsedNarration {
  const actions: SkyAction[] = []
  let clean = ''
  let last = 0

  for (const match of raw.matchAll(/\[\[(\w+)(?::([^\]]*))?\]\]/g)) {
    const idx = match.index ?? 0
    clean += raw.slice(last, idx)
    last = idx + match[0].length
    const action = toAction(match[1], match[2])
    if (action) actions.push(action)
  }

  let tail = raw.slice(last)
  const open = tail.lastIndexOf('[[')
  if (open !== -1 && !tail.slice(open).includes(']]')) {
    tail = tail.slice(0, open)
  }
  clean += tail

  return { clean: clean.replace(/[ \t]{2,}/g, ' '), actions }
}
