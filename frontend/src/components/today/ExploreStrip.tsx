import { Telescope } from 'lucide-react'
import { Link } from 'react-router-dom'

const CHIPS = ['Mars', 'Hubble', 'Apollo', 'Jupiter', 'Nebula', 'Saturn', 'Aurora', 'Galaxy']

export function ExploreStrip() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Telescope className="size-4 text-accent" />
        <h2 className="font-display text-sm font-semibold text-foreground">Explore the archive</h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        Search NASA's image library, from Mars rovers to the deep field.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <Link
            key={c}
            to={`/explore?q=${encodeURIComponent(c)}`}
            className="rounded-full border border-border bg-surface-2 px-3 py-1 text-sm text-foreground transition-colors hover:border-input hover:text-accent"
          >
            {c}
          </Link>
        ))}
      </div>
    </div>
  )
}
