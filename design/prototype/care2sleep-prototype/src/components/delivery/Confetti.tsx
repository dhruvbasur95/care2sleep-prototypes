import { useEffect, useRef, useState } from 'react'

/**
 * The certification confetti burst (Figma `648:13406`, "Confetti 2").
 *
 * **A 20-frame PNG sequence, not a GIF and not a particle system.** The frames
 * are the designer's own hand-keyed animation exported at 1400x1080, 440KB for
 * the set. The size curve alone shows it is a genuine burst rather than a loop:
 * ~8KB at frame 1, peaking by frame 5 as the confetti fills the frame, tapering
 * back to ~8KB by frame 20 as it falls out.
 *
 * PNG over the alternatives, each rejected for a measured reason:
 *   - **GIF** — a first export came back 3840x142 (a 27:1 ribbon) and GIF's
 *     1-bit alpha would fringe every piece against the card's yellow.
 *   - **SVG frames** — smaller over the wire, but each frame carries 100+ paths
 *     and swapping them re-rasterises all of it every tick. A bitmap blit is
 *     what keeps this smooth on the low-end devices this audience uses.
 *
 * **The exported PNGs were not transparent.** Figma baked a solid `#f5f5f5`
 * plate into every variant, so all 1,512,000 pixels of each frame came back
 * opaque — measured, not guessed — which is why the confetti first arrived
 * sitting on a grey card instead of over the yellow. The committed frames have
 * had that background removed and their anti-aliased edges un-blended from it,
 * so the alpha is real (96.7% transparent). **Re-exporting from Figma will
 * reintroduce it** unless the variant backgrounds are cleared there first.
 */
const FRAME_COUNT = 20

/** 130ms/frame = ~7.7fps, 2.6s per pass. Slowed twice on direct feedback: 45ms
 *  read as a flicker, 80ms was still hurried. Confetti falling under gravity is
 *  a slow thing, and these 20 frames are the whole arc rather than a fast loop
 *  of a few. */
const FRAME_MS = 130

/** Eight passes back to back (~21s), then a pause, then round again — repeating
 *  for as long as the card is on screen (direct instruction). */
const PASSES_PER_ROUND = 8
const PAUSE_MS = 10_000

const FRAMES = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/illustrations/confetti/f${String(i + 1).padStart(2, '0')}.png`,
)

export function Confetti({ play }: { play: boolean }) {
  const [frame, setFrame] = useState(-1)
  const step = useRef<number | null>(null)
  const pause = useRef<number | null>(null)

  useEffect(() => {
    if (!play) {
      setFrame(-1)
      return
    }
    // Respect the OS setting. Confetti is decoration with no information in it,
    // so the honest reduced-motion treatment is to skip it entirely rather than
    // hold a static frame — a frozen mid-burst would just look like a bug.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // One round is eight uninterrupted passes; then the frames unmount for the
    // pause and the round starts over.
    //
    // The pause is what makes this affordable to leave running. Twenty decoded
    // 1400x1080 bitmaps is the expensive part, and dropping to `frame === -1`
    // unmounts every `<img>` (see the render), handing that memory back between
    // rounds instead of holding it for as long as the coach sits on the page.
    // The files stay in the HTTP cache, so the next round re-decodes rather
    // than re-downloads.
    function startRound() {
      let i = 0
      let pass = 0
      setFrame(0)
      step.current = window.setInterval(() => {
        i += 1
        if (i >= FRAME_COUNT) {
          pass += 1
          if (pass >= PASSES_PER_ROUND) {
            setFrame(-1)
            if (step.current) window.clearInterval(step.current)
            pause.current = window.setTimeout(startRound, PAUSE_MS)
            return
          }
          i = 0
        }
        setFrame(i)
      }, FRAME_MS)
    }

    startRound()

    return () => {
      if (step.current) window.clearInterval(step.current)
      if (pause.current) window.clearTimeout(pause.current)
    }
  }, [play])

  return (
    // **The card's left half, full height** (direct instruction) — the burst
    // sits behind the photo and the start of the copy rather than washing over
    // the whole card. At the card's 1096x400 that is a 548x398 box, which is
    // within a whisker of the artwork's own 1.296 aspect, so `object-cover`
    // below crops ~25px of height and distorts nothing. Stretching it across
    // the full card (`object-fill`) compressed the burst 2.7x vertically and
    // every piece read as a flattened smear.
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-1/2 overflow-hidden"
    >
      {frame >= 0 &&
        FRAMES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 size-full object-cover"
            // Only `opacity` switches between frames — a compositor property.
            // Swapping a single `<img>`'s `src` would decode mid-animation and
            // stall; this way all twenty are decoded before the first paint of
            // a round.
            style={{ opacity: i === frame ? 1 : 0 }}
          />
        ))}
    </div>
  )
}
