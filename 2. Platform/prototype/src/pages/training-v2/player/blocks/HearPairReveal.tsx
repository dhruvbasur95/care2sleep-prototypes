import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { HearPair } from '@/data/moduleContent'
import { useRevealVerb } from './useRevealVerb'
import { CONVERSATION_GROUND } from './conversationGround'
import { AVATAR_OVERHANG, AVATAR_W, BUBBLES, pickBubbles } from './QuoteBubble'
import {
  ANSWER_CLOSED_D,
  ANSWER_H,
  ANSWER_OPEN_D,
  ANSWER_VIEWBOX,
  BUBBLE_STROKE,
  BUBBLE_STROKE_W,
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
 * Narrowing it traded width for height, which that instruction allowed ("you
 * can alter height also"): a long answer grew downward instead of sideways.
 *
 * ⚠️ **Widened to 460 on 2026-09-28** (direct instruction: *"can we increase
 * width also"*). 300 was only tenable while the shape was a stretched blob that
 * hid how tall it got; as a real container the longest answer ran to 438px of
 * height in a 300px column — a narrow ribbon of text. 460 brings the same copy
 * down to a readable block, and the row still fits it beside the 290px client
 * bubble and the 146px arrow inside the slide column.
 */
const ANSWER_MAX_W = 460

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
      {/* ⚠️ **SUPERSEDED 2026-09-28**: this row now uses `CONVERSATION_GROUND`,
          the same cream-to-lilac gradient the case scenario conversations sit
          on (direct instruction: *"re-use the same gradient background you have
          used for case scenario 1, 2 for this interactive block style"*). The
          `hear-pair-wash.webp` asset is no longer referenced here.

          The note below is kept because its findings still apply to any future
          painterly asset on this surface — two attempts failed on contrast and
          visibility before the shipped one worked, and re-measuring both numbers
          is the lesson, not the asset.

          The painterly purple wash behind every pair (direct instruction,
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
        className={cn(
          // `flex-nowrap`: at 460 the answer no longer fitted beside the 290
          // client bubble and the 146 arrow on a narrower column, so the row
          // broke and the answer dropped underneath — reported as *"they should
          // not wrap to second line"*. The three stay on one line and the
          // answer gives up width instead (see its own `flex-1 min-w-0`).
          'flex flex-nowrap items-center justify-center rounded-[16px] px-8 pt-4 pb-8',
          CONVERSATION_GROUND,
        )}
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
            {/* `body` (16/400/1.5), not `caption` (direct instruction,
                2026-09-28: *"Use body size for the client might say chat
                bubble, this can remain in italics"*). Italics stay — this is
                the client's own voice, and it is the one half of the pair that
                keeps them. */}
            <p className="text-body text-ink italic">{pair.clientSays}</p>
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
            'relative flex min-w-0 flex-1 items-center justify-center rounded-[16px] px-10 py-8 text-center text-purple-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            !revealed && 'hover:text-purple-300',
            // ⚠️ Once open, a real container instead of the drawn blob — see
            // the SVG below for why.
            //
            // `border-solid` + a colour only — the **width comes from
            // `BUBBLE_STROKE_W` in the style prop below**, the same constant
            // the closed state's SVG stroke reads. It was a flat `border`
            // (1px) against the blob's 2.5, so the outline visibly thinned the
            // moment a pair was opened (direct instruction, 2026-09-28: *"the
            // clicked state for click to see interaction type -> outline stroke
            // is not consistent. Both default and selected states should be
            // 2.5px outline stroke"*).
            //
            // Derived rather than retyped as `border-[2.5px]`: these are one
            // outline drawn two ways, and this project has shipped the
            // two-transcriptions bug often enough to have a rule about it.
            // `border-ink-muted` is the right colour by construction —
            // `BUBBLE_STROKE` is `#333333`, which is that token's own hex.
            revealed && 'border-solid border-ink-muted bg-purple-200',
          )}
          // No fixed width or height — both are minima, so the bubble grows
          // with its answer on either axis. The closed state always lands on
          // exactly the frame's 290x178, because "Click to see" never reaches
          // those bounds.
          // ⚠️ `flex-1 min-w-0` on THIS column only. The arrow column stays
          // `shrink-0` at a fixed width — making that one flexible is what
          // collapsed it to zero once (see its own note). Here it is what lets
          // the answer absorb a narrow row rather than wrapping out of it.
          // `minWidth` is dropped for the same reason: a floor that cannot be
          // met is what forces a wrap.
          style={{
            maxWidth: ANSWER_MAX_W,
            minHeight: ANSWER_H,
            // Only when open: closed, the outline is the SVG path's own stroke.
            borderWidth: revealed ? BUBBLE_STROKE_W : undefined,
          }}
        >
          {/* ⚠️ **Closed state only.** Reported 2026-09-28: *"on select state the
              chat bubble is abnormally skewed"*.

              The shape is one organic path stretched with
              `preserveAspectRatio="none"`. Closed, that is safe — "Click to see"
              never exceeds the drawn 290x178, which is why the note below says
              the closed state always lands on exactly those bounds. Open, the
              longest answer here runs ~500 characters and stretches the same
              path to roughly three times its drawn height: the corner curvature
              and the bows scale with the box, so it reads as a smeared blob
              rather than a bubble.

              This is the identical failure `AnswerOutcome` hit, and the
              resolution is the one given then (direct instruction, 2026-09-18:
              *"just use a simple purple container instead of this skewed box
              behind the message"*) — a plain rounded container with a real
              border, which is a constant weight at every size. Same fill, same
              stroke colour, only the geometry changes.

              The revealed sparkles go with it: they were drawn in the path's own
              coordinate space, so they only made sense on the stretched blob. */}
          {!revealed && (
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
          </svg>
          )}
          {/* **No italics on this half** (direct instruction, 2026-09-28: *"for
              click to see part, remove italics, and use body copy"*). The pair
              is a client utterance and a coaching note about it, and only the
              first is speech — italicising both made the guidance read as a
              second quote. Both states take `body` so the panel does not change
              type size when it opens.

              `font-bold` survives on the closed state: it is a control label
              rather than copy, and weight was not part of the instruction. */}
          {revealed ? (
            <span className="relative text-body text-ink">{pair.youCanSay}</span>
          ) : (
            <span className="relative text-body font-bold text-ink">{verb} to see</span>
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
