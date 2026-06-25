import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BOTTOM_NAV } from './nav'

/** Mobile bottom tab bar (the header nav is hidden on mobile). */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl">
        {BOTTOM_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                isActive ? 'text-accent' : 'text-muted',
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
