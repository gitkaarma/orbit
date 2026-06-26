import { useEffect, useState } from 'react'
import { Radio, Volume2, VolumeX, X } from 'lucide-react'
import { useSkyBrief } from '@/lib/useSkyBrief'
import type { SkyAction } from '@/lib/skyActions'
import type { IssState } from '@/lib/iss'
import { isDaylight } from '@/lib/terminator'

/**
 * The AI "flight director": a streaming, grounded narration of the live sky that types itself out
 * and drives the globe (focus / highlight) via the action tags embedded in the text.
 */
export function MissionControl({
  pos,
  onAction,
  onActiveChange,
}: {
  pos: IssState | null
  onAction: (action: SkyAction) => void
  onActiveChange: (active: boolean) => void
}) {
  const [active, setActive] = useState(false)
  const [tts, setTts] = useState(false)
  const { text, status, start, reset } = useSkyBrief(onAction)

  const begin = () => {
    if (!pos) return
    setActive(true)
    onActiveChange(true)
    start({
      lat: pos.lat,
      lon: pos.lon,
      alt: pos.altitudeKm,
      speed: pos.velocityKmh,
      day: isDaylight(pos.lat, pos.lon, new Date()),
    })
  }

  const end = () => {
    reset()
    setActive(false)
    onActiveChange(false)
    onAction({ type: 'reset' })
    window.speechSynthesis?.cancel()
  }

  // Read the finished narration aloud when TTS is on; cancel when muted or unmounted.
  useEffect(() => {
    if (status === 'done' && tts && text && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
    }
  }, [status, tts, text])
  useEffect(() => {
    if (!tts) window.speechSynthesis?.cancel()
  }, [tts])
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (!active) {
    return (
      <button
        type="button"
        onClick={begin}
        disabled={!pos}
        className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/40 bg-background/80 px-4 py-2 text-sm font-medium text-accent backdrop-blur-md transition hover:bg-accent/10 disabled:opacity-40"
      >
        <Radio className="size-4" /> Brief me on the sky
      </button>
    )
  }

  return (
    <div className="absolute bottom-3 left-1/2 z-10 w-[min(92%,34rem)] -translate-x-1/2 rounded-xl border border-border bg-background/85 p-3 backdrop-blur-md">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-accent">
          <Radio className="size-3" /> Flight director
          {status === 'streaming' && <span className="text-muted">· live</span>}
          {status === 'connecting' && <span className="text-muted">· connecting</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTts((t) => !t)}
            title={tts ? 'Mute' : 'Read aloud'}
            aria-pressed={tts}
            className="text-muted transition hover:text-foreground"
          >
            {tts ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <button type="button" onClick={end} title="Close" className="text-muted transition hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      </div>
      <p className="min-h-[3.5rem] text-sm leading-relaxed text-foreground/90">
        {text}
        {status === 'streaming' && <span className="ml-0.5 inline-block animate-pulse text-accent">▍</span>}
        {status === 'connecting' && !text && <span className="text-muted">Waking the observatory…</span>}
        {status === 'error' && !text && (
          <span className="text-muted">
            Couldn't reach the flight director.{' '}
            <button type="button" onClick={begin} className="text-accent underline underline-offset-2">
              try again
            </button>
          </span>
        )}
      </p>
    </div>
  )
}
