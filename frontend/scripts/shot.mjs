// Screenshot helper for the design feedback loop.
// Usage: node scripts/shot.mjs <path> <outFile> [width] [height]
import { chromium } from '@playwright/test'

const path = process.argv[2] ?? '/'
const out = process.argv[3] ?? '/tmp/orbit-shot.png'
const width = Number(process.argv[4] ?? 1440)
const height = Number(process.argv[5] ?? 900)
const base = process.env.SHOT_BASE ?? 'http://localhost:5173'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200) // let fonts, starfield, and transitions settle
await page.screenshot({ path: out })
await browser.close()
console.log('shot saved:', out)
