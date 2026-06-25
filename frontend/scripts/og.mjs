// Renders the social-share image to public/og.png in the Orbit brand.
// Usage: node scripts/og.mjs
import { chromium } from '@playwright/test'

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; font-family: Inter, sans-serif; color: #eceef5;
    background: #070b14; overflow: hidden; }
  .card { position: relative; width: 100%; height: 100%; padding: 84px 88px;
    display: flex; flex-direction: column; justify-content: center; }
  .glow { position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(900px 460px at 78% -8%, rgba(106,168,255,0.18), transparent 60%),
      radial-gradient(680px 420px at 6% 116%, rgba(244,197,107,0.10), transparent 55%); }
  .stars { position: absolute; inset: 0; }
  .stars i { position: absolute; background: #fff; border-radius: 9999px; opacity: .5; }
  .brand { display: flex; align-items: center; gap: 18px; margin-bottom: 30px; }
  .glyph { width: 64px; height: 64px; display: grid; place-items: center;
    border: 1px solid rgba(244,197,107,0.35); background: rgba(244,197,107,0.10);
    border-radius: 16px; }
  .word { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 40px;
    letter-spacing: -0.02em; }
  h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 76px;
    line-height: 1.04; letter-spacing: -0.03em; max-width: 920px; }
  h1 .accent { color: #f4c56b; }
  p { margin-top: 28px; font-size: 25px; color: #8b93a8; max-width: 880px; }
  .foot { position: absolute; left: 88px; bottom: 70px; font-family: 'JetBrains Mono', monospace;
    font-size: 18px; color: #6aa8ff; letter-spacing: .02em; }
</style></head>
<body><div class="card">
  <div class="glow"></div>
  <div class="stars" id="stars"></div>
  <div class="brand">
    <div class="glyph">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f4c56b" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <ellipse cx="12" cy="12" rx="10.5" ry="4.5" transform="rotate(-30 12 12)"/>
        <circle cx="20.5" cy="7.5" r="1.6" fill="#f4c56b" stroke="none"/>
      </svg>
    </div>
    <div class="word">Orbit</div>
  </div>
  <h1>A live window<br>on the <span class="accent">cosmos</span></h1>
  <p>NASA's picture of the day · the ISS tracked in real time · near-Earth asteroids · Earth from a million miles out</p>
  <div class="foot">orbit · built on NASA Open APIs</div>
</div>
<script>
  const s = document.getElementById('stars');
  const seed = [11,29,7,53,71,19,97,3,61,41,83,13,37,67,23,89,47,5,73,31];
  for (let i = 0; i < 70; i++) {
    const e = document.createElement('i');
    const sz = (seed[i % 20] % 3) + 1;
    e.style.width = e.style.height = sz + 'px';
    e.style.left = ((seed[i % 20] * (i + 7)) % 1200) + 'px';
    e.style.top = ((seed[(i + 5) % 20] * (i + 3)) % 630) + 'px';
    e.style.opacity = (((seed[i % 20]) % 5) / 10 + 0.2).toFixed(2);
    s.appendChild(e);
  }
</script></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: 'public/og.png' })
await browser.close()
console.log('og.png written')
