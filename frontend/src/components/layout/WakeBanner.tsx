import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api/client'

/** Free-tier backend sleeps when idle; show a friendly banner if the first ping is slow. */
export function WakeBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let done = false
    const timer = setTimeout(() => {
      if (!done) setShow(true)
    }, 2500)
    api
      .get('/api/ping')
      .catch(() => {})
      .finally(() => {
        done = true
        clearTimeout(timer)
        setShow(false)
      })
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="border-b border-border bg-accent/10">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-xs text-foreground">
        <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" />
        Waking the backend (it sleeps on the free tier). This first load can take up to a minute…
      </div>
    </div>
  )
}
