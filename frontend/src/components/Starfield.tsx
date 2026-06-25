import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  a: number
  tw: number
  depth: number
}

/** A subtle, performant starfield. Twinkles and parallaxes to the cursor; static if the user
 *  prefers reduced motion. Sits behind all content (z -10), above the page's glow (z -2). */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let stars: Star[] = []
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    let raf = 0

    const build = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(280, Math.floor((w * h) / 6000))
      stars = Array.from({ length: count }, () => {
        const depth = Math.random()
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: depth * 1.25 + 0.25,
          a: Math.random() * 0.5 + 0.3,
          tw: Math.random() * Math.PI * 2,
          depth,
        }
      })
    }

    const render = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      for (const s of stars) {
        const twinkle = reduced ? 1 : 0.6 + 0.4 * Math.sin(t * 0.001 + s.tw)
        const px = s.x + mouse.x * s.depth * 16
        const py = s.y + mouse.y * s.depth * 16
        ctx.globalAlpha = s.a * twinkle
        ctx.fillStyle = s.depth > 0.86 ? '#f4c56b' : s.depth > 0.6 ? '#cfe0ff' : '#ffffff'
        ctx.beginPath()
        ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (!reduced) raf = requestAnimationFrame(render)
    }

    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / w - 0.5
      mouse.ty = e.clientY / h - 0.5
    }

    build()
    render(0)
    window.addEventListener('resize', build)
    if (!reduced) window.addEventListener('mousemove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', build)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
}
