import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { Asteroid } from '@/api/types'
import { formatDate, formatDiameter, formatKmh, formatLunar } from '@/lib/format'

const AXIS = '#8b93a8'
const GRID = '#1e2636'

function Dot({ a }: { a: Asteroid }) {
  return (
    <div className="rounded-lg border border-border bg-surface/95 p-2.5 text-xs shadow-xl backdrop-blur">
      <div className="font-display font-semibold text-foreground">{a.name}</div>
      <div className="mt-1 space-y-0.5 text-muted">
        <div>{formatDate(a.closeApproachDate)}</div>
        <div>
          <span className="text-foreground">{formatDiameter(a.diameterMinM, a.diameterMaxM)}</span> across
        </div>
        <div>
          misses by <span className="text-foreground">{formatLunar(a.missDistanceLunar)}</span>
        </div>
        <div>{formatKmh(a.velocityKmh)}</div>
        {a.hazardous && <div className="font-medium text-hazard">flagged potentially hazardous</div>}
      </div>
    </div>
  )
}

/** Each object plotted by how close it passes (x, lunar distances) against how big it is (y, meters). */
export function AsteroidScatter({ asteroids }: { asteroids: Asteroid[] }) {
  const data = asteroids.map((a) => ({ ...a, x: a.missDistanceLunar, y: a.diameterMaxM, z: a.diameterMaxM }))

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 12, right: 18, bottom: 28, left: 6 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name="Miss distance"
          tick={{ fill: AXIS, fontSize: 11 }}
          stroke={GRID}
          tickFormatter={(v) => `${v} LD`}
          label={{ value: 'Miss distance (lunar distances)', position: 'bottom', offset: 12, fill: AXIS, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Diameter"
          tick={{ fill: AXIS, fontSize: 11 }}
          stroke={GRID}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}km` : `${Math.round(v)}m`)}
          width={48}
        />
        <ZAxis type="number" dataKey="z" range={[40, 520]} />
        <ReferenceLine
          x={1}
          stroke={AXIS}
          strokeDasharray="4 4"
          label={{ value: 'Moon', position: 'insideTopLeft', fill: AXIS, fontSize: 10 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: GRID }}
          content={({ payload }) =>
            payload && payload[0] ? <Dot a={payload[0].payload as Asteroid} /> : null
          }
        />
        <Scatter data={data} fillOpacity={0.7}>
          {data.map((a) => (
            <Cell
              key={a.id}
              fill={a.hazardous ? '#ff5a6a' : '#6aa8ff'}
              stroke={a.hazardous ? '#ff5a6a' : '#6aa8ff'}
              strokeWidth={1}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
