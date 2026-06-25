import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 p-10 text-center">
      {Icon && <Icon className="size-8 text-muted" />}
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {message && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{message}</p>}
      </div>
      {action}
    </div>
  )
}
