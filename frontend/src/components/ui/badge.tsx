import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        hazard: 'bg-hazard-soft text-hazard',
        accent: 'border border-accent/30 bg-accent/10 text-accent',
        primary: 'border border-primary/30 bg-primary/10 text-primary',
        neutral: 'bg-surface-2 text-muted',
        outline: 'border border-border text-muted',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
