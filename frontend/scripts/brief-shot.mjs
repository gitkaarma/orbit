// End-to-end shot of the AI flight director: loads /iss against the real backend, clicks
// "Brief me on the sky", and captures the streaming narration driving the globe.
// Usage: SHOT_BASE=http://localhost:5199 node scripts/brief-shot.mjs <outFile> [waitAfterClickMs]
import { chromium } from '@playwright/test'

const out = process.argv[2] ?? '/tmp/orbit-brief.png'
const waitAfterClick = Number(process.argv[3] ?? 3000)
const base = process.env.SHOT_BASE ?? 'http://localhost:5199'

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.log('PAGE EXCEPTION:', e.message))
page.on('console', (m) => {
  if (m.type() === 'error') console.log('PAGE ERROR:', m.text())
})

await page.goto(`${base}/iss`, { waitUntil: 'networkidle' })
await page.waitForTimeout(5000) // globe + swarm load (real ISS TLE from the backend)

await page.getByRole('button', { name: /Brief me on the sky/i }).click()
await page.waitForTimeout(waitAfterClick) // narration streams; a focus/highlight should be active

await page.screenshot({ path: out })
console.log('shot saved:', out)
await browser.close()
