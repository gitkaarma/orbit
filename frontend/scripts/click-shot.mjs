// Click an element, then screenshot — for verifying interactions (lightbox, modals).
// Usage: node scripts/click-shot.mjs <path> <selector> <outFile>
import { chromium } from '@playwright/test'

const path = process.argv[2] ?? '/'
const sel = process.argv[3] ?? 'button'
const out = process.argv[4] ?? '/tmp/orbit-click.png'
const base = process.env.SHOT_BASE ?? 'http://localhost:5173'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })
await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator(sel).first().click()
await page.waitForTimeout(1400)
await page.screenshot({ path: out })
await browser.close()
console.log('clicked + shot:', out)
