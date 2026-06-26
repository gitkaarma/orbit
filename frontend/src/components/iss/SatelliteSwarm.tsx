import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import {
  SAT_CATEGORY_META,
  SWARM_HIDDEN,
  type SatCategoryKey,
  type SwarmPositions,
} from '@/lib/swarm'

export interface SwarmCount {
  key: SatCategoryKey
  count: number
}

interface SwarmData {
  total: number
  kept: number
  categories: SwarmCount[]
  sats: { n: string; l1: string; l2: string }[]
}

/** A soft round sprite so each satellite reads as a glowing dot rather than a hard square. */
function makeDotTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.8)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function SatelliteSwarm({
  visible,
  highlight,
  onLoaded,
}: {
  visible: Record<SatCategoryKey, boolean>
  highlight?: SatCategoryKey | null
  onLoaded?: (data: { categories: SwarmCount[]; total: number; kept: number }) => void
}) {
  const [data, setData] = useState<SwarmData | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}satellites.json`)
      .then((r) => r.json())
      .then((d: SwarmData) => {
        if (cancelled) return
        setData(d)
        onLoaded?.({ categories: d.categories, total: d.total, kept: d.kept })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // One geometry per category, laid out as a contiguous slice of the worker's buffer.
  const built = useMemo(() => {
    if (!data) return null
    const dot = makeDotTexture()
    let offset = 0
    const cats = data.categories.map((c) => {
      const geom = new THREE.BufferGeometry()
      const arr = new Float32Array(c.count * 3).fill(SWARM_HIDDEN)
      geom.setAttribute('position', new THREE.BufferAttribute(arr, 3))
      // Manual bounds: the sentinel-hidden points would otherwise inflate the auto sphere.
      geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4)
      const entry = { key: c.key, start: offset, count: c.count, geom }
      offset += c.count
      return entry
    })
    return { cats, dot }
  }, [data])

  useEffect(() => {
    if (!built || !data) return
    const worker = new Worker(new URL('../../lib/swarmWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<SwarmPositions>) => {
      if (e.data.type !== 'pos') return
      const positions = e.data.positions
      for (const c of built.cats) {
        const attr = c.geom.getAttribute('position') as THREE.BufferAttribute
        ;(attr.array as Float32Array).set(positions.subarray(c.start * 3, (c.start + c.count) * 3))
        attr.needsUpdate = true
      }
    }
    worker.postMessage({
      type: 'init',
      sats: data.sats.map((s) => ({ l1: s.l1, l2: s.l2 })),
      intervalMs: 120,
    })
    return () => {
      worker.terminate()
      built.cats.forEach((c) => c.geom.dispose())
      built.dot.dispose()
    }
  }, [built, data])

  if (!built) return null

  return (
    <group>
      {built.cats.map((c) => {
        const dimmed = highlight != null && highlight !== c.key
        return (
          <points key={c.key} geometry={c.geom} visible={visible[c.key]} frustumCulled={false}>
            <pointsMaterial
              map={built.dot}
              color={SAT_CATEGORY_META[c.key].color}
              size={highlight === c.key ? 0.034 : 0.025}
              sizeAttenuation
              transparent
              opacity={dimmed ? 0.12 : 1}
              depthWrite={false}
              alphaTest={0.01}
              toneMapped={false}
            />
          </points>
        )
      })}
    </group>
  )
}
