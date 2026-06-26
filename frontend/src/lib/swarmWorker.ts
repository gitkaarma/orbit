/// <reference lib="webworker" />
// Propagates the whole satellite catalogue off the main thread. Every tick it computes a
// scene-space position for each satellite (same coordinate frame as the Earth and the ISS)
// and ships the packed Float32Array back to be rendered as a point cloud.
import * as satellite from 'satellite.js'
import { geoToVec3 } from './globeMath'
import { satSceneRadius, SWARM_HIDDEN, type SwarmInit } from './swarm'

const ctx = self as unknown as DedicatedWorkerGlobalScope

type SatRec = ReturnType<typeof satellite.twoline2satrec>

let satrecs: SatRec[] = []
let positions = new Float32Array(0)
let timer: ReturnType<typeof setInterval> | undefined

function propagate() {
  const now = new Date()
  const gmst = satellite.gstime(now)
  for (let i = 0; i < satrecs.length; i++) {
    const pv = satellite.propagate(satrecs[i], now)
    const eci = pv && pv.position
    if (!eci || typeof eci === 'boolean') {
      positions[i * 3] = SWARM_HIDDEN
      positions[i * 3 + 1] = SWARM_HIDDEN
      positions[i * 3 + 2] = SWARM_HIDDEN
      continue
    }
    const geo = satellite.eciToGeodetic(eci, gmst)
    const [x, y, z] = geoToVec3(
      satellite.degreesLat(geo.latitude),
      satellite.degreesLong(geo.longitude),
      satSceneRadius(geo.height),
    )
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
  }
  const out = positions
  positions = new Float32Array(satrecs.length * 3) // fresh buffer; `out` is transferred away
  ctx.postMessage({ type: 'pos', positions: out }, [out.buffer])
}

ctx.onmessage = (e: MessageEvent<SwarmInit>) => {
  const msg = e.data
  if (msg.type !== 'init') return
  if (timer) clearInterval(timer)
  satrecs = msg.sats.map((s) => satellite.twoline2satrec(s.l1, s.l2))
  positions = new Float32Array(satrecs.length * 3)
  propagate()
  timer = setInterval(propagate, msg.intervalMs)
}
