import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, Marker, Polygon, Polyline, TileLayer } from 'react-leaflet'
import type { IssTle } from '@/api/types'
import { groundTrack, type IssState } from '@/lib/iss'
import { nightPolygon } from '@/lib/terminator'

/** Break the track wherever it crosses the antimeridian so polylines don't streak the map. */
function splitTrack(track: [number, number][]): [number, number][][] {
  const segments: [number, number][][] = []
  let current: [number, number][] = []
  for (let i = 0; i < track.length; i++) {
    if (i > 0 && Math.abs(track[i][1] - track[i - 1][1]) > 180) {
      segments.push(current)
      current = []
    }
    current.push(track[i])
  }
  if (current.length) segments.push(current)
  return segments
}

const issIcon = L.divIcon({
  className: '',
  html: '<div class="iss-marker"><span class="iss-pulse"></span><span class="iss-dot"></span></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function IssMap({ tle, pos }: { tle: IssTle; pos: IssState | null }) {
  const segments = splitTrack(groundTrack(tle, 95, 60))
  const night = nightPolygon(new Date())

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      worldCopyJump
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
      <Polygon
        positions={night}
        pathOptions={{ stroke: false, fillColor: '#02040a', fillOpacity: 0.42 }}
      />
      {segments.map((seg, i) => (
        <Polyline key={i} positions={seg} pathOptions={{ color: '#6aa8ff', weight: 2, opacity: 0.6 }} />
      ))}
      {pos && <Marker position={[pos.lat, pos.lon]} icon={issIcon} />}
    </MapContainer>
  )
}
