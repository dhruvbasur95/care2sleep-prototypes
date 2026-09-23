import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { HearPair } from '@/data/moduleContent'
import { useRevealVerb } from './useRevealVerb'
import { AVATAR_OVERHANG, AVATAR_W, BUBBLES, pickBubbles } from './QuoteBubble'
import {
  ANSWER_CLOSED_D,
  ANSWER_H,
  ANSWER_OPEN_D,
  ANSWER_SPARKLES,
  ANSWER_VIEWBOX,
  ANSWER_W,
  BUBBLE_STROKE,
  BUBBLE_STROKE_W,
  SPARKLE_STROKE_W,
} from './revealBubble'

/**
 * Click to reveal, **style 2** — the You Might Also Hear pattern.
 *
 * Frames `2665:23779` (default) and `2665:23780` (revealed), added 2026-09-17.
 * The second real `<Interactive block>` component, after the flip cards.
 *
 * One block per pair: a two-column header, then a `purple-50` panel holding the
 * client's line on the left, an arrow, and the coach's response on the right —
 * hidden behind a press until the coach has had a go at answering it themselves.
 *
 * ## What is reused
 * Direct instruction: *"you can re-use the bubbles + avatar + animation."* The
 * frame draws the client's line on `bubble-3` — **its export is byte-for-byte
 * that committed blob**, 292.502x251.75 against 292.501x251.75 — but a later
 * instruction widened it: *"for clients might say, feel free to use from the
 * three chat bubble variations."* So the left bubble runs through `pickBubbles`,
 * the same cycle-all-three-then-repeat rule the quote rows use, and a block of
 * four pairs shows three different blobs before any repeats.
 *
 * The avatar, its breath, and **its placement against each blob's own measured
 * tail tip** all come from `QuoteBubble`, whose `BUBBLES` table is exported
 * rather than copied (direct correction: *"avatar position incorrect, see how
 * you did for chat bubbles"* — a first pass put it in flow at the far left,
 * detached from the tail it is supposed to rest on). Cycling the blobs is only
 * safe *because* the tip comes from that table: each tail leaves at a different
 * angle, so a shared offset would strand the avatar on two of the three.
 *
 * ⚠️ **The avatar's base changed colour for everyone.** *"just base below
 * avatar I have updated the color"* — `#EADECC` -> `#C2A3FF` (`purple-300`).
 * Checked before committing: the frame's export and the committed `avatar.svg`
 * are the same artwork to within floating-point noise (30.4900 vs 30.4900,
 * 16.1017 vs 16.1016) and differ only in that one ellipse fill, so this is the
 * shared avatar being restyled rather than a style-2 variant. It therefore also
 * changes the module intro and chapter opening quote rows, which is the correct
 * consequence of editing a shared asset — not a side effect to hide.
 *
 * ## The answer bubble is inline SVG, not an `<img>`
 * Because it has to change fill on hover (*"on hover use purple 300"*), and an
 * `<img>` cannot be recoloured. Its path data lives in `revealBubble.ts`, the
 * same arrangement `pillowFrame.ts` and `blobFrame.ts` already use.
 */

/** The frame's own blob width. Heights are minima — both bubbles are
 *  backgrounds that grow with their copy (`preserveAspectRatio="none"`). */
const BUBBLE_W = 290
const BUBBLE_MIN_H = 255
/**
 * How far apart the two bubbles may drift.
 *
 * The frame's own middle column: 790 wide, less its 2x32 inset and the two
 * 290px bubbles, leaves **146**. Direct instruction, 2026-09-17: *"bring the two
 * bubbles closer when the screen widens"* — with a bare `flex-1` the arrow
 * column swallowed every extra pixel of a 1512px window and shoved the pair out
 * to opposite edges, which reads as two unrelated things rather than one
 * exchange. Capping it at the frame's own number and centring the group puts the
 * slack outside the pair instead of between them.
 */
const ARROW_MAX_W = 146

/**
 * How wide the answer bubble may grow.
 *
 * Direct instruction, 2026-09-17: *"make the on reveal bubble state height
 * variable to inside copy"*, then *"width can also be made variable"*. So the
 * closed state is the frame's own 290x178 and the revealed state sizes to its
 * answer on **both** axes, rather than forcing a 300-character response into a
 * box drawn around two words.
 *
 * ⚠️ **300, not the 420 a first pass used — and the number is derived, not
 * chosen.** The slide column is 880, less the block's 2x40 inset and the panel's
 * 2x32, leaves **736** for the three columns. Take the client's fixed 290 and
 * the arrow's 146 and exactly 300 remains. At 420 the row overflowed, the arrow
 * column (`flex-1 min-w-0`) was squeezed to nothing, and **the arrow vanished
 * entirely** — reported as "arrow is missing", and invisible as an overflow
 * because the row simply looked tight.
 *
 * Narrowing it trades width for height, which the same instruction allowed
 * ("you can alter height also"): a long answer now grows downward instead of
 * sideways, and nothing else has to move.
 */
const ANSWER_MAX_W = 300

export function HearPairReveal({
  pair,
  index,
  variant,
  onFirstReveal,
}: {
  pair: HearPair
  index: number
  /** Which of the three drawn blobs the client's line gets. */
  variant: number
  /** Fires once, the first time this pair's answer is revealed. The list above
   *  counts these for the slide's gate. */
  onFirstReveal?: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const reduceMotion = useReducedMotion()
  const verb = useRevealVerb()
  const base = `${import.meta.env.BASE_URL}illustrations/quote-bubbles/`
  const bubble = BUBBLES[variant % BUBBLES.length]

  return (
    <li className="flex flex-col">
      {/* The two column labels. **"Client", not the frame's "Consumer"** — this
          is a coach-facing surface, and the audience-dependent terminology rule
          says researcher surfaces say consumer and coach surfaces say client.
          The data field is `clientSays`, which agrees.

          `ink-muted` on both: the default frame draws the left label in pure
          `#000000` and the revealed frame draws it in `#333`, which is drift
          between two states of one component rather than a decision — `#333` is
          a real token, `#000000` is not used anywhere in this library. */}
      <div className="flex items-center justify-between p-4 text-title text-ink-muted">
        <span>Client might say...</span>
        <span className="text-right">What you can say...</span>
      </div>

      {/* `items-center`: both sides are vertically centred against the row
          (direct instruction), and the row grows to whichever bubble's copy is
          longer. `pb-8` balances the frame's `pt-4` now that the avatar hangs
          below its bubble rather than sitting in flow. */}
      {/* The painterly purple wash behind every pair (direct instruction,
          2026-09-18: *"add a painterly style background in the parent container
          that is currently just purple 50. use same across, make sure its using
          hues of purple"*).

          **One asset for every pair**, as asked — the same wash, so the rows read
          as one surface rather than a gallery.

          ⚠️ `bg-purple-50` is KEPT under it, not replaced: it is what paints
          before the image decodes, and what shows if the asset ever 404s. The
          image is a `backgroundImage` at `cover` rather than an `<img>` so it
          cannot enter the layout or the a11y tree — this panel's children are
          already absolutely-positioned bubbles with an overhanging avatar.

          ⚠️ **Generate the wash gently; do not veil a strong one.** The first
          asset was a full-strength purple wash with blooms and granulation, and
          its deepest violet measured **2.67:1** against the `ink-muted` copy on
          top — a real AA failure, invisible unless a line happened to land on
          that bloom. Veiling it 45% toward white fixed the contrast and made it
          **disappear**, reported immediately as *"I cannot see it"*. Veiling is
          the wrong lever: it flattens the thing you are trying to show.

          The shipped asset is generated soft instead — *"a more muted (toned
          down) version, with less brush strokes, and something that very subtly
          fades into background colour"* — and needs **no veil at all**. Measured
          on it: darkest pixel `rgb(221,203,228)` = **8.26:1** against
          `ink-muted`, 1st percentile 8.95:1, and its average `#ece0ed` sits a
          max of **18 per channel** off `purple-50` `#f3efff` — far enough to
          read as a surface, close enough to stay quiet. Re-measure both numbers
          on any re-export: contrast against the copy, and delta against
          `purple-50`. Passing one and failing the other is how this went wrong
          twice. */}
      <div
        className="flex flex-wrap items-center justify-center rounded-[16px] bg-purple-50 bg-cover bg-center px-8 pt-4 pb-8"
        style={{
          backgroundImage: `url("${import.meta.env.BASE_URL}illustrations/module/hear-pair-wash.webp")`,
        }}
      >
        {/* ── The client's line ───────────────────────────────────────────── */}
        <figure
          className="relative shrink-0"
          style={{ width: BUBBLE_W, marginBottom: AVATAR_OVERHANG }}
        >
          <img
            src={`${base}${bubble.src}`}
            alt=""
            aria-hidden="true"
            // Stretched behind the copy rather than sized to it — every bubble
            // export in this library carries `preserveAspectRatio="none"`
            // precisely so this works.
            className="absolute inset-0 block h-full w-full"
          />
          {/* `justify-center` with `QuoteBubble`'s own insets: `px-8`/`pt-7`
              clear the outline where it bows inward, and **`pb-14` reserves the
              tail**, which is what makes the copy read as centred in the
              bubble's *body* rather than in its bounding box (direct
              instruction: "the copy in yellow box should always be vertically
              centred"). Centring against the full box sits the text visibly
              low, because the tail occupies the bottom fifth of it. */}
          <blockquote
            className="relative flex flex-col justify-center px-8 pt-7 pb-14"
            style={{ minHeight: BUBBLE_MIN_H }}
          >
            <p className="text-caption text-ink italic">{pair.clientSays}</p>
          </blockquote>
          {/* Placed against this blob's own measured tail tip, exactly as the
              chapter opening's quotes are — not in flow at the left edge. */}
          <motion.img
            src={`${base}avatar.svg`}
            alt=""
            aria-hidden="true"
            className="absolute"
            style={{
              bottom: -AVATAR_OVERHANG,
              width: AVATAR_W,
              left: `calc(${(bubble.tipPct * 100).toFixed(1)}% + ${bubble.gapPx}px)`,
              transformOrigin: 'center bottom',
            }}
            // The quote bubbles' own breath, same amplitude and the same
            // negative delay so a column of them is never in step.
            animate={reduceMotion ? undefined : { scale: [1, 1.05, 1], y: [0, -5, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: -(index * 1.1) }
            }
          />
        </figure>

        {/* ── The arrow ───────────────────────────────────────────────────── */}
        {/* Centred by the row rather than by the frame's `pb-[112px]`: that
            padding is how the frame centres the arrow against a fixed 255px row,
            and it would sit the arrow off-centre the moment a row grows. */}
        {/* `shrink-0` at a fixed width, not `flex-1 min-w-0`. The flexible
            version let the row steal this column's space when the answer bubble
            grew, collapsing it to zero and taking the arrow with it. The gap is
            a constant now anyway — it is capped, and the row centres. */}
        <div
          className="flex shrink-0 items-center justify-center px-6"
          style={{ width: ARROW_MAX_W }}
        >
          <img
            src={`${base}reveal-arrow.svg`}
            alt=""
            aria-hidden="true"
            // ⚠️ `w-auto`, NOT the frame's `w-full`. This export carries
            // `preserveAspectRatio="none"` like every other asset here, and the
            // frame stretches it across a column that is only as wide as its own
            // fixed layout. In the real slide column that column is much wider,
            // and a stretched arrow smears into a flat line (reported:
            // "arrows are getting skewed"). Holding the height and letting the
            // width follow the intrinsic ratio keeps the hand-drawn look; the
            // gap either side is the column centring it.
            className="block h-8 w-auto max-w-full"
          />
        </div>

        {/* ── The coach's response, behind a press ────────────────────────── */}
        {/* A real toggle, not a one-way reveal: the frame draws no way back, and
            a control that becomes inert after one press is still focusable and
            still announces as a button. `aria-expanded` carries the state.

            ⚠️ **Padding on the button, copy as a single in-flow child.** A first
            pass nested the copy in a `flex-1` wrapper and the button never grew
            past its own `min-height` — measured at exactly 255 with a
            300-character answer spilling straight through the bubble's outline.
            A flex child with `flex-basis: 0` contributes nothing to its parent's
            height, so the floor became a ceiling.

            The insets are generous for the same reason the left bubble's are:
            this blob bows inward at every corner, so copy set tight to the box
            crosses the painted edge. Direct instruction: "the entire copy should
            be encapsulated by purple chat bubble." */}
        <button
          type="button"
          onClick={() =>
            setRevealed((v) => {
              // Reported on the way open only, and the list de-duplicates by
              // index — the control toggles, and the gate counts pairs seen.
              if (!v) onFirstReveal?.()
              return !v
            })
          }
          aria-expanded={revealed}
          // The hover tint is **closed-state only** (direct instruction: "no
          // hover state after data has been revealed"). Once the answer is out,
          // the bubble is content rather than an invitation, and a colour shift
          // on it would keep promising something that has already happened. The
          // control stays a real toggle — it just stops advertising.
          className={cn(
            'relative flex shrink-0 items-center justify-center rounded-[16px] px-10 py-8 text-center text-purple-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            !revealed && 'hover:text-purple-300',
          )}
          // No fixed width or height — both are minima, so the bubble grows
          // with its answer on either axis. The closed state always lands on
          // exactly the frame's 290x178, because "Click to see" never reaches
          // those bounds.
          style={{ minWidth: ANSWER_W, maxWidth: ANSWER_MAX_W, minHeight: ANSWER_H }}
        >
          {/* Inline, so `currentColor` carries the hover from the button.
              `preserveAspectRatio="none"` matches every other bubble here: the
              shape is a background that stretches to its copy. `overflow-visible`
              lets the revealed state's sparkles paint outside the cropped
              viewBox, where they are drawn. */}
          <svg
            aria-hidden="true"
            viewBox={ANSWER_VIEWBOX}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible transition-colors"
          >
            <path
              d={revealed ? ANSWER_OPEN_D : ANSWER_CLOSED_D}
              fill="currentColor"
              // The chat bubbles' own outline — see `BUBBLE_STROKE` for why the
              // stroke must not scale with the stretched shape.
              stroke={BUBBLE_STROKE}
              strokeWidth={BUBBLE_STROKE_W}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeMiterlimit={2}
              vectorEffect="non-scaling-stroke"
            />
            {revealed &&
              ANSWER_SPARKLES.map((d) => (
                <path
                  key={d}
                  d={d}
                  stroke="var(--color-primary)"
                  strokeWidth={SPARKLE_STROKE_W}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  // The sparkles are drawn in the blob's own coordinate space,
                  // so a stretched viewBox would smear them along with it.
                  vectorEffect="non-scaling-stroke"
                />
              ))}
          </svg>
          {revealed ? (
            <span className="relative text-caption text-ink italic">
              {pair.youCanSay}
            </span>
          ) : (
            <span className="relative text-caption font-bold text-ink">{verb} to see</span>
          )}
        </button>
      </div>
    </li>
  )
}

export function HearPairRevealList({
  pairs,
  labelledBy,
}: {
  pairs: HearPair[]
  labelledBy?: string
}) {
  /**
   * **Not gated** (direct instruction, 2026-09-18) — revealing a suggested reply
   * is reading, not answering. The slide rides its scroll gate.
   */

  // Seeded from the pairs' own copy, so the blobs are stable across re-renders
  // and slide revisits rather than re-rolling while a coach reads.
  const variants = pickBubbles(
    pairs.length,
    pairs.map((p) => p.clientSays),
  )

  return (
    // Stacked vertically, 40px apart (direct instruction: "all blocks to be
    // stacked vertically"). Each pair carries its own `purple-50` panel, which
    // is why the container around them passes no surface of its own.
    <ul aria-labelledby={labelledBy} className="flex list-none flex-col gap-10">
      {pairs.map((pair, i) => (
        <HearPairReveal
          key={pair.clientSays}
          pair={pair}
          index={i}
          variant={variants[i]}
          onFirstReveal={undefined}
        />
      ))}
    </ul>
  )
}
