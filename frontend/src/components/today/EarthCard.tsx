import { Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEpicLatest } from '@/api/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'

export function EarthCard() {
  const { data } = useEpicLatest()
  const latest = data?.[0]

  return (
    <Link
      to="/earth"
      className="group relative block overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-input"
    >
      {latest ? (
        <>
          <img
            src={latest.imageUrl}
            alt="Earth from DSCOVR/EPIC"
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe className="size-4 text-primary" /> Earth today
            </span>
            <div className="mt-0.5 text-xs text-muted">{formatDate(latest.date)} · from DSCOVR</div>
          </div>
        </>
      ) : (
        <div className="p-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Globe className="size-4 text-primary" /> Earth today
          </span>
          <Skeleton className="mt-3 aspect-video w-full" />
        </div>
      )}
    </Link>
  )
}
