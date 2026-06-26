// Screenshot the 3D ISS globe with the TLE endpoint mocked, so no backend is needed.
// Usage: SHOT_BASE=http://localhost:5191 node scripts/globe-shot.mjs <outFile>
import { chromium } from '@playwright/test'

const out = process.argv[2] ?? '/tmp/orbit-globe.png'
const wait = Number(process.argv[3] ?? 4000)
const base = process.env.SHOT_BASE ?? 'http://localhost:5191'

// A real, well-formed ISS TLE (static is fine for a still).
const TLE = {
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   26175.15560926  .00007363  00000+0  13975-3 0  9991',
  line2: '2 25544  51.6326 265.6000 0004427 224.4953 135.5681 15.49396189572839',
}

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
page.on('console', (m) => {
  if (m.type() === 'error') console.log('PAGE ERROR:', m.text())
})
page.on('pageerror', (e) => console.log('PAGE EXCEPTION:', e.message))
await page.route('**/api/iss/tle', (r) =>
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TLE) }),
)
await page.goto(`${base}/iss`, { waitUntil: 'networkidle' })
await page.waitForTimeout(wait) // let textures load, the worker spin up, and frames render
await page.screenshot({ path: out })
await browser.close()
console.log('shot saved:', out)
