import { motion, useReducedMotion } from 'framer-motion'
import type { Quote } from '@/data/moduleContent'

/**
 * A chapter-opening quote, drawn as a hand-illustrated chat bubble with a
 * pillow avatar resting on its tail.
 *
 * ## The three bubbles, and why the shape is stretched rather than placed
 * Figma supplies three hand-drawn blobs (`2594:21575/21596/21618`), each a
 * single vector carrying its own fill, stroke and tail. They are drawn at
 * 290x255 around the **longest** quote in the module.
 *
 * The quotes are not one length, though — measured across Module 6 they run
 * from **43 to 270 characters**, a six-fold range, and the count per chapter
 * varies too (3, 2, 2). A fixed-height bubble therefore either strands a
 * two-line quote in a bubble drawn for ten lines, or — the failure that was
 * called out directly — lets a long one run under its own outline.
 *
 * So the bubble is a **background that grows with its text**: the box is sized
 * by the copy, and the vector is stretched across it. Every export already
 * carries `preserveAspectRatio="none"`, so this is what they were drawn for.
 * `min-h` keeps the frame's own proportions for ordinary quotes, so nothing is
 * distorted in the common case — only an outlier stretches, and stretching is
 * strictly better than spilling.
 *
 * ## Padding is the point
 * These are irregular shapes: the outline bows inward at the corners and the
 * tail eats the bottom. The insets below are generous on purpose — the
 * instruction was that no outline may cross the copy — and `pb` specifically
 * reserves the tail and avatar region rather than assuming the text will stop
 * short of it.
 */

/**
 * Frame `2594:21574`. One entry per drawn blob, carrying where that blob's own
 * tail tip actually lands — which is what the avatar has to be placed against.
 *
 * `tipPct` is **measured from the painted pixels**, not transcribed: each SVG
 * was rasterised and scanned upward for the lowest opaque row. The frame's own
 * avatar offsets (78 / 103 / 58 of 290) turned out not to describe the tips at
 * all — the real centres are 136 / 95 / 112 — which is why two of the three
 * avatars sat directly on the tip they were supposed to sit beside.
 */
export const BUBBLES = [
  // `gapPx` is the clearance from the tip to the avatar's left edge, so the tip
  // stays visible rather than being covered by the pillow resting beside it.
  // It is per-blob rather than one constant because the tails leave the bubble
  // at different angles: a steep tail needs the pillow tucked closer than a
  // shallow one does for the same apparent spacing. These two were pulled in by
  // eye against the rendered result (direct instruction, "move a little left").
  // Negative enough to clear the avatar's own width puts it fully LEFT of the
  // tip; a small positive puts it just right of one. Bubbles 1 and 3 read
  // better on the left (direct instruction).
  { src: 'bubble-1.svg', tipPct: 136 / 290, gapPx: -78 },
  { src: 'bubble-2.svg', tipPct: 95 / 290, gapPx: 8 },
  { src: 'bubble-3.svg', tipPct: 112 / 290, gapPx: -78 },
] as const

/** The avatar's rendered width, and how far it hangs below its bubble. Shared
 *  so the two callers cannot drift. */
export const AVATAR_W = 72
export const AVATAR_OVERHANG = 16

/**
 * Which blob a given quote gets.
 *
 * ## The rule: cycle all three, then repeat
 *
 * Direct instruction, 2026-09-17: **every row uses three different colours
 * before any colour comes back.** A row of three is therefore always one of
 * each; a fourth bubble starts the cycle again.
 *
 * This replaced a per-quote hash that only forbade *consecutive* repeats. That
 * was too weak at the sizes this actually renders at — the module intro and
 * chapter openings carry 2 or 3 quotes, and `[purple, yellow-200, purple]`
 * passes a consecutive-only check while showing a duplicate and leaving the
 * third colour unused, which is exactly what was reported.
 *
 * Because each SVG carries its own fill, picking the blob *is* picking the
 * colour — there is no separate colour axis to vary.
 *
 * ## Still deterministic, still not authored-looking
 *
 * The starting colour is hashed from the row's own first quote, so different
 * slides open on different colours rather than every row in the module starting
 * purple. It is derived from content rather than `Math.random()` for the reason
 * it always was: a render-time roll would re-colour the bubbles on every
 * re-render and every slide revisit, so a coach would watch them change while
 * reading.
 */
export function pickBubbles(count: number, seedSource: string[]): number[] {
  const seed = seedSource[0] ?? ''
  let hash = 0
  for (let c = 0; c < seed.length; c++) hash = (hash * 31 + seed.charCodeAt(c)) >>> 0
  const offset = hash % BUBBLES.length

  return Array.from({ length: count }, (_, i) => (offset + i) % BUBBLES.length)
}

export function QuoteBubble({ quote, variant, index }: { quote: Quote; variant: number; index: number }) {
  const reduceMotion = useReducedMotion()
  const bubble = BUBBLES[variant % BUBBLES.length]
  const base = `${import.meta.env.BASE_URL}illustrations/quote-bubbles/`

  return (
    <figure className="relative mb-4 w-[290px] shrink-0">
      {/* Stretched to the box the copy sizes — see the note above. `-z-0` is
          not needed: the copy below is in flow and paints over it. */}
      <img
        src={`${base}${bubble.src}`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
      />

      {/* px-8 / pt-7 clear the bowed outline; pb-14 reserves the tail and the
          avatar sitting on it. `min-h` holds the frame's drawn proportions for
          a quote of ordinary length. */}
      <blockquote className="relative flex min-h-[237px] flex-col justify-center px-8 pt-7 pb-14 text-center">
        <p className="text-caption text-ink italic">{quote.text}</p>
        <figcaption className="mt-3 text-caption font-bold text-ink italic">
          — {quote.attribution}
        </figcaption>
      </blockquote>

      {/* The pillow avatar rests on this blob's own tail, which is why its x
          comes from the bubble rather than being one shared number. */}
      <motion.img
        src={`${base}avatar.svg`}
        alt=""
        aria-hidden="true"
        // Pushed below the bubble's own tail tip (direct instruction). Growing
        // the avatar from 50px to 72px grew its height with it, and at
        // `bottom-0` the extra ~15px rode up over the tip it is supposed to sit
        // under. The figure carries matching bottom margin so the overhang is
        // reserved rather than eating into the row below.
        className="absolute -bottom-4 w-[72px]"
        style={{
          left: `calc(${(bubble.tipPct * 100).toFixed(1)}% + ${bubble.gapPx}px)`,
          transformOrigin: 'center bottom',
        }}
        // The Consumer Portal's breathing pillow: same 4s easeInOut, same
        // `center bottom` origin — the default `center` swells it downward too
        // and it sinks into its own resting shadow.
        //
        // **The amplitude is scaled to this element, and that is the whole
        // point.** Copying the consumer's literal 1.8% looked like nothing was
        // animating, and measuring said why: that pillow is 207px wide, so 1.8%
        // is 3.7px of travel, while this avatar was 50px and moved **0.9px**.
        // Running, in the DOM, invisible on screen — the exact failure mode this
        // project documented in Round 34. At 72px, 4% gives ~2.9px, which reads
        // as a breath at this size. Match the pixel travel, not the percentage.
        //
        // **Out of sync by instruction.** A negative delay starts each avatar
        // already part-way through the loop, so they are staggered from the
        // very first frame rather than spending the first seconds in step the
        // way a positive delay would.
        // A **bob plus** the breath, not the breath alone. A scale on a 73px
        // shape tops out at ~3px of edge travel and the centre of the shape
        // barely moves at all, which is why it still read as static; a y
        // translate moves every pixel of the avatar by its full amount and is
        // the far more legible motion at this size. The two run on one
        // transition so they stay phase-locked to each other.
        animate={reduceMotion ? undefined : { scale: [1, 1.05, 1], y: [0, -5, 0] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: -(index * 1.1) }
        }
      />
    </figure>
  )
}
