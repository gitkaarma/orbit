import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="font-mono text-6xl font-bold text-accent">404</p>
      <p className="text-muted">Lost in space. That page doesn't exist.</p>
      <Button asChild variant="outline" size="sm">
        <Link to="/">Back to Today</Link>
      </Button>
    </div>
  )
}
