import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ title = 'Unable to load', message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-8 text-center',
        className,
      )}
    >
      <AlertTriangle className="size-7 text-hazard" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {message && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  )
}
