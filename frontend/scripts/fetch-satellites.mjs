// Bake a snapshot of the active satellite catalogue into a static asset, so the swarm
// loads instantly from the CDN with no backend dependency. TLEs drift slowly, so a
// periodic re-run keeps it fresh. Run: node scripts/fetch-satellites.mjs
import { writeFile } from 'node:fs/promises'

const SOURCE = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'
const OUT = new URL('../public/satellites.json', import.meta.url)
const CAP = 6000 // keep propagation comfortably real-time in the worker

// Category order here defines the contiguous ranges the renderer slices by.
const ORDER = ['starlink', 'oneweb', 'navigation', 'other']

function classify(name) {
  const n = name.toUpperCase()
  if (n.includes('STARLINK')) return 'starlink'
  if (n.includes('ONEWEB')) return 'oneweb'
  if (/\b(GPS|NAVSTAR|GLONASS|GALILEO|GSAT|BEIDOU|QZS|IRNSS|NAVIC)\b/.test(n)) return 'navigation'
  return 'other'
}

const res = await fetch(SOURCE, { headers: { 'User-Agent': 'orbit-portfolio/1.0' } })
if (!res.ok) throw new Error(`Celestrak fetch failed: ${res.status}`)
const text = await res.text()
const lines = text.split(/\r?\n/).filter((l) => l.trim().length)

const all = []
for (let i = 0; i + 2 < lines.length + 1; i += 3) {
  const n = lines[i]?.trim()
  const l1 = lines[i + 1]
  const l2 = lines[i + 2]
  if (!l1?.startsWith('1 ') || !l2?.startsWith('2 ')) continue
  if (n === 'ISS (ZARYA)') continue // the ISS is rendered separately, with its orbit
  all.push({ n, l1, l2, c: classify(n) })
}

// Keep every navigation + OneWeb satellite (small, distinctive constellations);
// downsample the large Starlink/other populations to fit the cap.
const must = all.filter((s) => s.c === 'navigation' || s.c === 'oneweb')
const rest = all.filter((s) => s.c === 'starlink' || s.c === 'other')
const budget = Math.max(0, CAP - must.length)
const stride = rest.length > budget ? Math.ceil(rest.length / budget) : 1
const sampledRest = rest.filter((_, i) => i % stride === 0)
const kept = [...must, ...sampledRest]

// Sort into contiguous category ranges.
kept.sort((a, b) => ORDER.indexOf(a.c) - ORDER.indexOf(b.c))

const categories = ORDER.map((key) => ({ key, count: kept.filter((s) => s.c === key).length })).filter(
  (c) => c.count > 0,
)

const payload = {
  source: 'Celestrak GP "active" catalogue',
  total: all.length,
  kept: kept.length,
  cap: CAP,
  categories,
  sats: kept.map((s) => ({ n: s.n, l1: s.l1, l2: s.l2 })),
}

await writeFile(OUT, JSON.stringify(payload))
console.log(
  `wrote ${kept.length}/${all.length} satellites ->`,
  categories.map((c) => `${c.key}:${c.count}`).join(' '),
)
