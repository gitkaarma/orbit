import { render, screen } from '@testing-library/react'
import { Star } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title and message', () => {
    render(<EmptyState icon={Star} title="Nothing saved yet" message="Tap the star to save." />)
    expect(screen.getByText('Nothing saved yet')).toBeInTheDocument()
    expect(screen.getByText('Tap the star to save.')).toBeInTheDocument()
  })

  it('renders an action when provided', () => {
    render(<EmptyState title="Empty" action={<button>Explore</button>} />)
    expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument()
  })
})
