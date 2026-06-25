// End-to-end: save a few items across pages, then screenshot /saved.
// Verifies the favorites POST + persistence + Saved rendering in one browser context.
import { chromium } from '@playwright/test'

const base = process.env.SHOT_BASE ?? 'http://localhost:5173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 })

async function visit(path) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
}

// Save three images from Explore.
await visit('/explore?q=earth%20from%20space')
const saves = page.locator('button[aria-label="Save"]')
for (let i = 0; i < 3; i++) {
  await saves.nth(i).click()
  await page.waitForTimeout(350)
}

// Save one asteroid.
await visit('/asteroids')
await page.locator('table button[aria-label="Save"]').first().click()
await page.waitForTimeout(350)

// Save the picture of the day (best-effort).
await visit('/apod')
try {
  await page.getByRole('button', { name: 'Save' }).first().click({ timeout: 5000 })
  await page.waitForTimeout(350)
} catch {
  console.log('apod save skipped')
}

await visit('/saved')
await page.screenshot({ path: process.argv[2] ?? '/tmp/orbit-saved.png' })
await browser.close()
console.log('saved-flow shot done')
