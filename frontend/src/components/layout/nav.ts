import { Globe, Image, Radar, Satellite, Sparkles, Star, Telescope } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: typeof Sparkles
  end?: boolean
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: Sparkles, end: true },
  { to: '/apod', label: 'APOD', icon: Image },
  { to: '/explore', label: 'Explore', icon: Telescope },
  { to: '/iss', label: 'ISS', icon: Satellite },
  { to: '/asteroids', label: 'Asteroids', icon: Radar },
  { to: '/earth', label: 'Earth', icon: Globe },
  { to: '/saved', label: 'Saved', icon: Star },
]

/** A focused subset for the mobile bottom bar. */
const BOTTOM = new Set(['/', '/explore', '/iss', '/asteroids', '/saved'])
export const BOTTOM_NAV: NavItem[] = NAV.filter((n) => BOTTOM.has(n.to))
