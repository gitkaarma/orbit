import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Line, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { IssTle } from '@/api/types'
import { groundTrack, type IssState } from '@/lib/iss'
import { geoToVec3, sunDirectionEcef, type Vec3 } from '@/lib/globeMath'
import { SAT_CATEGORY_META, SWARM_CATEGORY_ORDER, type SatCategoryKey } from '@/lib/swarm'
import type { SkyAction } from '@/lib/skyActions'
import { SatelliteSwarm, type SwarmCount } from './SatelliteSwarm'
import { MissionControl } from './MissionControl'

type OControls = ComponentRef<typeof OrbitControls>
type Visibility = Record<SatCategoryKey, boolean>
type CameraIntent = null | { kind: 'iss' } | { kind: 'geo'; lat: number; lon: number }

const EARTH_RADIUS = 1
const EARTH_KM = 6371
// The ISS orbits at ~420 km — only ~6.6% of Earth's radius, a razor-thin sliver at true
// scale. We lift it a little for legibility so the orbit reads as a clear low arc.
const ALT_EXAGGERATION = 3
const NOMINAL_ALT_KM = 420

const PRIMARY = '#6aa8ff'

function orbitRadius(altKm: number): number {
  return EARTH_RADIUS + (altKm / EARTH_KM) * ALT_EXAGGERATION
}

/** Whether this browser/session can create a WebGL context at all. */
export function webglSupported(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    )
  } catch {
    return false
  }
}

const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const EARTH_FRAG = /* glsl */ `
  uniform sampler2D dayTex;
  uniform sampler2D nightTex;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    float d = dot(normalize(vWorldNormal), normalize(sunDir));
    float t = smoothstep(-0.12, 0.22, d);          // soft day/night terminator
    vec3 day = texture2D(dayTex, vUv).rgb;
    vec3 night = texture2D(nightTex, vUv).rgb * 1.35; // lift the city lights
    vec3 col = mix(night, day, t);
    // faint cool rim of atmosphere scattering along the lit edge of the terminator
    col += vec3(0.03, 0.07, 0.13) * (1.0 - abs(d)) * t;
    gl_FragColor = vec4(col, 1.0);
  }
`

const ATMO_VERT = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const ATMO_FRAG = /* glsl */ `
  uniform vec3 glowColor;
  uniform vec3 sunDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = pow(clamp(1.0 - abs(dot(viewDir, vWorldNormal)), 0.0, 1.0), 3.5);
    float sunlit = smoothstep(-0.4, 0.5, dot(vWorldNormal, normalize(sunDir)));
    gl_FragColor = vec4(glowColor, rim * (0.25 + 0.75 * sunlit));
  }
`

const texUrl = (name: string) => `${import.meta.env.BASE_URL}textures/${name}`

function Earth() {
  const [day, night] = useLoader(THREE.TextureLoader, [texUrl('earth-day.jpg'), texUrl('earth-night.jpg')])

  const material = useMemo(() => {
    day.colorSpace = THREE.SRGBColorSpace
    night.colorSpace = THREE.SRGBColorSpace
    day.anisotropy = 8
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTex: { value: day },
        nightTex: { value: night },
        sunDir: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: EARTH_VERT,
      fragmentShader: EARTH_FRAG,
    })
  }, [day, night])

  useFrame(() => {
    const [x, y, z] = sunDirectionEcef(new Date())
    material.uniforms.sunDir.value.set(x, y, z)
  })

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(PRIMARY) },
          sunDir: { value: new THREE.Vector3(1, 0, 0) },
        },
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  )

  useFrame(() => {
    const [x, y, z] = sunDirectionEcef(new Date())
    material.uniforms.sunDir.value.set(x, y, z)
  })

  return (
    <mesh scale={1.02}>
      <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function OrbitTrack({ tle }: { tle: IssTle }) {
  const points = useMemo<Vec3[]>(
    () => groundTrack(tle, 95, 60).map(([lat, lon]) => geoToVec3(lat, lon, orbitRadius(NOMINAL_ALT_KM))),
    [tle],
  )
  const surface = useMemo<Vec3[]>(
    () => groundTrack(tle, 95, 60).map(([lat, lon]) => geoToVec3(lat, lon, EARTH_RADIUS + 0.002)),
    [tle],
  )
  return (
    <>
      <Line points={points} color={PRIMARY} lineWidth={1.6} transparent opacity={0.6} />
      <Line points={surface} color={PRIMARY} lineWidth={1} transparent opacity={0.25} />
    </>
  )
}

function IssMarker({ pos, animate }: { pos: IssState | null; animate: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const pulse = useRef<THREE.Mesh>(null!)
  const placed = useRef(false)
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    if (!pos) return
    const [x, y, z] = geoToVec3(pos.lat, pos.lon, orbitRadius(pos.altitudeKm))
    target.set(x, y, z)
    if (!placed.current) {
      group.current.position.copy(target)
      placed.current = true
    } else {
      group.current.position.lerp(target, Math.min(1, dt * 3))
    }
    if (pulse.current) {
      const s = animate ? 1 + 0.45 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4)) : 1.2
      pulse.current.scale.setScalar(s)
    }
  })

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshBasicMaterial color={PRIMARY} toneMapped={false} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={PRIMARY} transparent opacity={0.22} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Eases the camera toward the current intent (the live ISS, or a fixed lat/lon) and frames the globe. */
function CameraRig({
  pos,
  intent,
  controls,
}: {
  pos: IssState | null
  intent: CameraIntent
  controls: RefObject<OControls | null>
}) {
  const dir = useMemo(() => new THREE.Vector3(), [])
  useFrame((state, dt) => {
    if (!intent) return
    let lat: number
    let lon: number
    if (intent.kind === 'iss') {
      if (!pos) return
      lat = pos.lat
      lon = pos.lon
    } else {
      lat = intent.lat
      lon = intent.lon
    }
    const [x, y, z] = geoToVec3(lat, lon, 1)
    dir.set(x, y, z).normalize()
    const dist = controls.current ? controls.current.getDistance() : 2.8
    dir.multiplyScalar(Math.max(1.7, Math.min(4, dist)))
    state.camera.position.lerp(dir, Math.min(1, dt * 1.6))
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

export function IssGlobe({ tle, pos }: { tle: IssTle; pos: IssState | null }) {
  const [cameraIntent, setCameraIntent] = useState<CameraIntent>(null)
  const [highlight, setHighlight] = useState<SatCategoryKey | null>(null)
  const [briefing, setBriefing] = useState(false)
  const [showSwarm, setShowSwarm] = useState(true)
  const [visible, setVisible] = useState<Visibility>({
    starlink: true,
    oneweb: true,
    navigation: true,
    other: true,
  })
  const [counts, setCounts] = useState<SwarmCount[]>([])
  const [total, setTotal] = useState(0)
  const controls = useRef<OControls | null>(null)
  const handleSwarmLoaded = useCallback(
    ({ categories, kept }: { categories: SwarmCount[]; kept: number }) => {
      setCounts(categories)
      setTotal(kept)
    },
    [],
  )
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const following = cameraIntent?.kind === 'iss'

  // The AI flight director drives the globe through these actions.
  const handleAction = useCallback((action: SkyAction) => {
    switch (action.type) {
      case 'focus':
        setCameraIntent('target' in action ? { kind: 'iss' } : { kind: 'geo', lat: action.lat, lon: action.lon })
        break
      case 'highlight':
        setHighlight(action.category)
        break
      case 'reset':
        setHighlight(null)
        setCameraIntent(null)
        break
    }
  }, [])

  // Releasing any camera intent hands control back cleanly from wherever the camera ended up.
  useEffect(() => {
    if (!cameraIntent) controls.current?.update()
  }, [cameraIntent])

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 0.6, 3], fov: 40, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#070b14']} />
        <ambientLight intensity={0.12} />
        <Stars radius={60} depth={40} count={2500} factor={3} saturation={0} fade speed={reduced ? 0 : 0.4} />
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
        <Atmosphere />
        <OrbitTrack tle={tle} />
        <IssMarker pos={pos} animate={!reduced} />
        {showSwarm && <SatelliteSwarm visible={visible} highlight={highlight} onLoaded={handleSwarmLoaded} />}
        <CameraRig pos={pos} intent={cameraIntent} controls={controls} />
        <OrbitControls
          ref={controls}
          enabled={!cameraIntent}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          zoomSpeed={0.6}
          minDistance={1.45}
          maxDistance={9}
          autoRotate={!cameraIntent && !reduced && !briefing}
          autoRotateSpeed={0.25}
        />
      </Canvas>

      <button
        type="button"
        onClick={() => setCameraIntent((c) => (c?.kind === 'iss' ? null : { kind: 'iss' }))}
        aria-pressed={following}
        className={`absolute right-3 top-3 z-10 rounded-lg border px-2.5 py-1.5 text-xs font-medium backdrop-blur-md transition ${
          following
            ? 'border-primary/60 bg-primary/15 text-primary'
            : 'border-border bg-background/70 text-muted hover:text-foreground'
        }`}
      >
        {following ? 'Following ISS' : 'Follow ISS'}
      </button>

      <div className="absolute bottom-3 left-3 z-10 w-44 rounded-xl border border-border bg-background/80 p-2.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setShowSwarm((s) => !s)}
          aria-pressed={showSwarm}
          className="flex w-full items-center justify-between text-xs font-medium text-foreground"
        >
          <span className={showSwarm ? '' : 'opacity-50'}>Satellites</span>
          <span className="font-mono text-[11px] text-muted">
            {total ? total.toLocaleString() : '…'}
          </span>
        </button>
        {showSwarm && total > 0 && (
          <div className="mt-2 space-y-0.5">
            {SWARM_CATEGORY_ORDER.map((key) => {
              const meta = SAT_CATEGORY_META[key]
              const n = counts.find((c) => c.key === key)?.count ?? 0
              if (!n) return null
              const on = visible[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
                  aria-pressed={on}
                  className={`flex w-full items-center justify-between rounded-md px-1.5 py-1 text-[11px] transition hover:bg-surface-2 ${
                    on ? 'text-foreground' : 'text-muted opacity-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: meta.color, opacity: on ? 1 : 0.4 }}
                    />
                    {meta.label}
                  </span>
                  <span className="font-mono tabular-nums">{n.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <MissionControl pos={pos} onAction={handleAction} onActiveChange={setBriefing} />
    </div>
  )
}
