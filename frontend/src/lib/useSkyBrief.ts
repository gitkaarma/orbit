import { useCallback, useRef, useState } from 'react'
import { parseNarration, type SkyAction } from './skyActions'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export type BriefStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error'

export interface BriefParams {
  lat: number
  lon: number
  alt: number
  speed: number
  day: boolean
}

/**
 * Opens the SSE narration stream, accumulates the text, and fires each globe action exactly once
 * as it completes. The clean (tag-free) text is exposed for the typewriter display.
 */
export function useSkyBrief(onAction: (action: SkyAction) => void) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<BriefStatus>('idle')

  const sourceRef = useRef<EventSource | null>(null)
  const rawRef = useRef('')
  const firedRef = useRef(0)
  const onActionRef = useRef(onAction)
  onActionRef.current = onAction

  const stop = useCallback(() => {
    sourceRef.current?.close()
    sourceRef.current = null
  }, [])

  const reset = useCallback(() => {
    stop()
    rawRef.current = ''
    firedRef.current = 0
    setText('')
    setStatus('idle')
  }, [stop])

  const start = useCallback(
    (params: BriefParams) => {
      stop()
      rawRef.current = ''
      firedRef.current = 0
      setText('')
      setStatus('connecting')

      const query = new URLSearchParams({
        lat: String(params.lat),
        lon: String(params.lon),
        alt: String(params.alt),
        speed: String(params.speed),
        day: String(params.day),
      })
      const source = new EventSource(`${API_BASE}/api/sky/brief?${query}`)
      sourceRef.current = source

      source.onmessage = (event) => {
        let delta = ''
        try {
          delta = (JSON.parse(event.data) as { t: string }).t
        } catch {
          delta = event.data
        }
        rawRef.current += delta
        const { clean, actions } = parseNarration(rawRef.current)
        setText(clean)
        setStatus('streaming')
        for (let i = firedRef.current; i < actions.length; i++) {
          onActionRef.current(actions[i])
        }
        firedRef.current = actions.length
      }

      source.addEventListener('done', () => {
        setStatus('done')
        stop()
      })

      source.onerror = () => {
        // Fires on a genuine connection failure; after a clean 'done' the source is already closed.
        stop()
        setStatus((prev) => (prev === 'streaming' || prev === 'done' ? prev : 'error'))
      }
    },
    [stop],
  )

  return { text, status, start, stop, reset }
}
