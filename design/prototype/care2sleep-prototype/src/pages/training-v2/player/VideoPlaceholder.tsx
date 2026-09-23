import { useEffect, useRef, useState } from 'react'
import { Check, Play } from 'lucide-react'
import { moduleArt } from '@/components/ModuleCard'
import { PATHWAY_MODULES_V2 } from '@/data/trainingPathwayV2'
import { cn } from '@/lib/utils'
import { MODULE_PLAYER_ID } from '../pathway'

const PLAYER_MODULE = PATHWAY_MODULES_V2.find((m) => m.id === MODULE_PLAYER_ID)
/** Falls back to a neutral wash if the player module id is ever missing —
 *  should never happen in practice since this only renders for
 *  `building-blocks-good-sleep` (Option B's own `data/trainingPathwayV2.ts`
 *  dataset, not the shared `data/portal.ts` which has no matching id). */
const THUMBNAIL_COLORS = PLAYER_MODULE?.cover.colors ?? (['#1c2b4a', '#5b7fa6', '#f0d9a8'] as const)

/** Roughly a few seconds of simulated playback — this is a placeholder, not
 *  a real video, so the "watch-through" is deliberately short rather than
 *  matching the real duration estimate shown in the badge. */
const SIMULATED_DURATION_MS = 3200

/**
 * `video-placeholder` (design-tokens.md §26, simplified in §30/Round 7.1.2)
 * — shared by the module intro, every chapter's Learn video(s), and
 * video-format case examples (6 slots total in Module 4). No real assets
 * exist yet, so this renders a muted gradient thumbnail (reusing
 * `moduleArt`, not a new gradient technique), a duration badge, and a
 * play/watched control.
 *
 * **Text is not this component's job.** §26 originally had this component
 * also render the source doc's own video-coverage text beneath the
 * thumbnail — on inspection that text (`"Covers: ..."`, `"Dramatised
 * scene: ..."`) is a production brief for whoever eventually shoots the
 * real video, not copy written for a coach to read, and reads oddly
 * presented as if it were the lesson itself. Any genuinely learner-facing
 * framing for a video slide (a quoted transcript line, a case's plain
 * vignette) is now its own text block on the slide, rendered *above* this
 * component, not passed into it.
 */
export function VideoPlaceholder({
  label,
  durationLabel,
  onWatched,
  alreadyWatched = false,
}: {
  /** Short accessible label, e.g. "Chapter 1 Learn video". */
  label: string
  /** Verbatim duration estimate from the source doc, e.g. "~4-5 min".
   *  Optional: the `module.md` authoring format carries no runtime for its
   *  `<Video block>`s, and a made-up number on screen is worse than none. */
  durationLabel?: string
  /** Fired once when the simulated watch-through completes. */
  onWatched?: () => void
  /** True once this exact video has already been marked watched (e.g. the
   *  coach navigated back to this screen within the same session). */
  alreadyWatched?: boolean
}) {
  const [state, setState] = useState<'idle' | 'playing' | 'watched'>(
    alreadyWatched ? 'watched' : 'idle',
  )
  const [progress, setProgress] = useState(alreadyWatched ? 100 : 0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  function play() {
    if (state === 'watched') return
    setState('playing')
    const start = Date.now()
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, (elapsed / SIMULATED_DURATION_MS) * 100)
      setProgress(pct)
      if (pct >= 100) {
        if (timerRef.current) window.clearInterval(timerRef.current)
        setState('watched')
        onWatched?.()
      }
    }, 80)
  }

  const stateLabel =
    state === 'idle' ? 'Play' : state === 'playing' ? 'Playing…' : 'Watched'

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '16 / 9' }}>
      <div aria-hidden="true" className="absolute inset-0" style={moduleArt(THUMBNAIL_COLORS)} />

      {durationLabel && (
        <span className="absolute top-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-fine text-white backdrop-blur-sm">
          {durationLabel}
        </span>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={play}
          aria-label={state === 'watched' ? `Watched: ${label}` : `Play: ${label}`}
          disabled={state === 'playing'}
          className={cn(
            'flex size-16 items-center justify-center rounded-full bg-white/90 text-ink outline-none transition-all',
            'hover:bg-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            state === 'playing' && 'cursor-wait',
          )}
        >
          {state === 'watched' ? (
            <Check aria-hidden="true" className="size-6 text-success" />
          ) : (
            <Play aria-hidden="true" className="ml-0.5 size-6" fill="currentColor" />
          )}
        </button>
      </div>

      {state === 'playing' && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
          <div
            className="h-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <span
        aria-live="polite"
        className="absolute bottom-2 left-3 rounded-full bg-black/40 px-2 py-0.5 text-fine text-white"
      >
        {stateLabel}
      </span>
    </div>
  )
}
