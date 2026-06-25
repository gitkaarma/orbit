import { Orbit as OrbitIcon } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { NAV } from './nav'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
            <OrbitIcon className="size-5" strokeWidth={2} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">Orbit</span>
        </Link>
        <nav className="ml-2 hidden items-center gap-0.5 md:flex">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted hover:text-foreground',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
