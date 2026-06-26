import { describe, expect, it } from 'vitest'
import { parseNarration } from './skyActions'

describe('parseNarration', () => {
  it('strips a complete tag and emits its action', () => {
    const { clean, actions } = parseNarration('Hello [[focus:iss]] world')
    expect(clean).toBe('Hello world')
    expect(actions).toEqual([{ type: 'focus', target: 'iss' }])
  })

  it('hides a trailing incomplete tag so it never flashes on screen', () => {
    const { clean, actions } = parseNarration('Look up [[focus:i')
    expect(clean).toBe('Look up ')
    expect(actions).toEqual([])
  })

  it('parses a lat/lon focus', () => {
    const { clean, actions } = parseNarration('Over [[focus:-33.9,151.2]] Sydney')
    expect(clean).toBe('Over Sydney')
    expect(actions).toEqual([{ type: 'focus', lat: -33.9, lon: 151.2 }])
  })

  it('parses highlight and reset, ignoring unknown categories', () => {
    const { actions } = parseNarration('[[highlight:starlink]] a [[highlight:bogus]] b [[reset]]')
    expect(actions).toEqual([
      { type: 'highlight', category: 'starlink' },
      { type: 'reset' },
    ])
  })

  it('handles back-to-back tags and collapses the gaps', () => {
    const { clean, actions } = parseNarration('[[focus:iss]]The ISS [[reset]]drifts.')
    expect(clean).toBe('The ISS drifts.')
    expect(actions).toHaveLength(2)
  })
})
