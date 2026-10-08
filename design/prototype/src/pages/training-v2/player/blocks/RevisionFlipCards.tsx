import { useEffect, useId, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  Activity,
  Blocks,
  BookOpen,
  Clock,
  CookingPot,
  FlaskConical,
  Gauge,
  Hourglass,
  SunMoon,
  Thermometer,
  TrendingUp,
  Utensils,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RevisionIcon, RevisionTerm } from '@/data/moduleContent'
import { PILLOW_SHAPES } from './pillowFrame'
import { useRevealVerb } from './useRevealVerb'

/**
 * Flip-to-reveal cards — the first real `<Interactive block>` component, and the
 * one the Know What revision pattern uses.
 *
 * Frames: `2656:23453` (front) and `2656:23462` (back), the front/back
 * provision added for reference on 2026-09-17. There is no frame for the row
 * itself, only for one card.
 *
 * ## What is taken from the Consumer Portal, and what is not
 * Direct instruction: *"You can extract the interactive style from consumers."*
 * So the **mechanism** is `ModuleSummaryCards`' — two faces in one grid cell,
 * `preserve-3d` on the turning box, `backface-visibility` plus `inert` on the
 * face that is away, focus moved on every turn, rotation kept but not animated
 * under `prefers-reduced-motion` — and the **pillow artwork** is the same three
 * committed vectors.
 *
 * It is a separate component rather than a shared one, deliberately. That file
 * is 832 lines of consumer-branded surface: `consumer-primary`, the portal's
 * own type scale, a photo clipped into the pillow, a capped scrolling back
 * panel. Flexing it to also serve a coach-portal card would mean adding flags
 * that switch off the behaviour making it correct for its own portal, which is
 * exactly what this project's standing rules say to build locally instead. What
 * is genuinely shared — the pillow vectors — is shared as assets.
 *
 * ⚠️ The pillows live under `public/illustrations/consumer-lesson/`. They are
 * brand illustration rather than consumer chrome, the same justification
 * `BlockRenderer` already records for importing `ConsumerMascot`: no consumer
 * token rides along with them.
 */

/**
 * The per-card pillow **rotation**, cycled across the cards.
 *
 * The frame draws one card and therefore says nothing about a row; using pillow
 * 1 seven times would read as a photocopy, and the Consumer Portal's own row
 * varies them for that reason. `rotate` is the frame's own transform, carried
 * over unchanged.
 *
 * ⚠️ **The silhouettes themselves moved to `pillowFrame.ts` on 2026-09-18** and
 * this array no longer names an asset. Both are indexed by `index % 3`, so the
 * rotation and the shape stay in step — if you add a fourth rotation here
 * without a fourth shape there, every fourth card gets shape 1 at rotation 4.
 *
 * They are no longer a plain `<img>` either. Each term's own watercolour art is
 * clipped INTO the silhouette, so the shape is rendered from one path three
 * times in one inline SVG — cream fill, then the clipped image, then the
 * `purple-300` centred stroke on top. The previous note here said no
 * clip/stroke pair was needed "because unlike the consumer's there is no photo
 * to cut into the shape". There is one now.
 */
const PILLOWS = [
  { rotate: -2.14 },
  { rotate: 3 },
  { rotate: -4.51 },
] as const

/** The frame's own skew on the pillow. */
const PILLOW_SKEW = -0.82

/**
 * How much the pillow swells while its card is hovered or focused.
 *
 * Direct instruction, 2026-09-17: *"these cards are missing hover state."* The
 * same treatment and the same number the Consumer Portal's own flip cards use,
 * so the two rows behave alike.
 *
 * ⚠️ Driven from React state, **not** a `motion-safe:hover:[--x:1.07]` custom
 * property. Round 46 measured that exact form emitting no CSS rule at all under
 * stacked variants — the class sat in the DOM and nothing happened. State
 * cannot fail that way.
 *
 * Focus raises it too, so the cue is not pointer-only.
 */
const PILLOW_HOVER_SCALE = 1.07

/**
 * The card's size, and the pillow's with it — **one knob, three numbers that
 * have to move together.**
 *
 * Direct instruction, 2026-09-17: *"the dimensions can be reduced both height
 * and width. Scale down the pillows also accordingly."* The frame draws one
 * card at 352x500 with a 260px pillow, which is right for a card seen on its
 * own and far too big for a row of seven: at that size only two fit a row and
 * each is taller than half the content area.
 *
 * ⚠️ **`CARD_MIN_W` is a grid floor, not a width, and the column count falls off
 * a cliff.** `auto-fit` fits as many columns as clear the floor, so the usable
 * width decides everything: the slide column is 880px and the block box insets
 * 40 each side, leaving **800**. Three columns need `3w + 2*24 <= 800`, i.e.
 * `w <= 250.67`. A first pass used 260 and silently got **two** columns at
 * 388px each — barely narrower than before the change, and invisible as a bug
 * because two columns look deliberate.
 *
 * At 240 the row is 3 up at ~251px each, and 4 up at ~262 with the outline rail
 * collapsed (1134 - 80 = 1054 usable).
 *
 * The other two are scaled off the frame's own ratios rather than picked, so
 * the card keeps its proportions and the pillow keeps its share of the card
 * (251/352 = 0.713):
 *   height  500 * 0.713 = 356
 *
 * The pillow is capped on **both** axes and keeps its own aspect ratio, which
 * took two passes to land:
 * 1. *"pillows are overlapping with title, reduce size, and increase their
 *    width to cater for spacing between"* — on a card grown to ~400px the
 *    height-capped pillow grew wide enough to crowd the title above it, because
 *    `justify-between` hands the pillow whatever the copy does not use. That was
 *    read literally and the pillow was spanned to the card's full width at a
 *    fixed height.
 * 2. *"reduce pillow width, it looks skewed in desktop"* — which it was. The
 *    vectors carry `preserveAspectRatio="none"`, so a full-width stretch at a
 *    fixed height distorts the shape, and the wider the card the more obvious
 *    it gets.
 *
 * So both axes are **maxima** with `width`/`height` left auto: the intrinsic
 * ratio decides, whichever cap binds first wins, and the pillow can never
 * stretch. Reducing the height was the part that actually freed the space
 * between the pillow and the title; widening it was not.
 */
const CARD_MIN_W = 240
/** The row gap, in the column maths below as well as on the grid itself. */
const CARD_GAP = 24
/** Direct instruction, 2026-09-17: never more than three cards in a row. */
const MAX_PER_ROW = 3
const CARD_MIN_H = 356
const PILLOW_MAX_H = 140
const PILLOW_MAX_W = 200

/**
 * How much larger than a perfect fit the pillow artwork is drawn.
 *
 * 1 = the whole square source is visible with cream at the sides; ~1.3 = what
 * `object-fit: cover` used to do on the narrowest silhouette. See the note at
 * the `<image>` below — this is the single knob, and the offsets derive from it.
 */
const ART_SCALE = 1.12

/**
 * The back's glyphs.
 *
 * ⚠️ **A build-side field with no authoring column** — the seventh, after the
 * four icon fields and the outro's next-module name. module.md's Revision row
 * is bold-term/definition pairs and nothing else, so the glyph is chosen
 * against each term's own meaning. `verify-transcription.py` excludes any key
 * named `icon`, which is why adding it keeps the check passing.
 */
const REVISION_ICONS: Record<RevisionIcon, LucideIcon> = {
  'cooking-pot': CookingPot,
  gauge: Gauge,
  clock: Clock,
  wind: Wind,
  zap: Zap,
  'flask-conical': FlaskConical,
  blocks: Blocks,
  activity: Activity,
  'trending-up': TrendingUp,
  'sun-moon': SunMoon,
  thermometer: Thermometer,
  utensils: Utensils,
  hourglass: Hourglass,
}

function FlipCard({
  term,
  index,
  onFirstFlip,
}: {
  term: RevisionTerm
  index: number
  /** Fires once, the first time this card is turned over — the list above
   *  counts these to decide the slide's gate. */
  onFirstFlip?: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const reduceMotion = useReducedMotion()
  const frontRef = useRef<HTMLButtonElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)

  /**
   * The turn moves focus, because the control that was clicked turns away.
   *
   * Guarded on the **previous value**, not on a "have I run before" latch: the
   * latch form misfires under StrictMode's double mount, which is how the
   * Consumer Portal's own version once put focus on the last card in a row
   * instead of leaving it alone. Comparing against the previous value cannot —
   * on a second mount run nothing has changed, so nothing happens.
   *
   * An effect is safe here where it is not on the player's slide transitions:
   * both faces are always mounted, so the target exists at the moment the flag
   * changes.
   */
  const verb = useRevealVerb()
  const [raised, setRaised] = useState(false)
  const raise = () => setRaised(true)
  const lower = () => setRaised(false)

  const prevFlipped = useRef(flipped)
  const reportedRef = useRef(false)
  useEffect(() => {
    if (prevFlipped.current === flipped) return
    prevFlipped.current = flipped
    if (flipped && !reportedRef.current) {
      // Guarded on a ref rather than on `flipped` alone: a card can be turned
      // back and forth, and the gate counts cards *seen*, not the current face.
      reportedRef.current = true
      onFirstFlip?.()
    }
    const target = flipped ? backRef.current : frontRef.current
    target?.focus({ preventScroll: true })
  }, [flipped, onFirstFlip])

  const pillow = PILLOWS[index % PILLOWS.length]
  /* Same cycle, same index — the rotation and the silhouette must stay in step,
     so both are keyed off `index % 3` rather than tracked separately. */
  const shape = PILLOW_SHAPES[index % PILLOW_SHAPES.length]
  /* `useId` per card: a `clipPath` id is document-global, and seven cards
     sharing one id would clip every pillow to whichever mounted last. */
  const clipId = `pillow-clip-${useId()}`
  // `BookOpen` is the fallback for a term with no glyph named, so a revision
  // block that has not been through an icon pass still renders. Naming one is
  // the intent — chapter 2's is simply out of this round's scope.
  const Glyph = term.icon ? REVISION_ICONS[term.icon] : BookOpen
  const number = String(index + 1).padStart(2, '0')

  // Both faces carry the front's 24px radius. The frame draws the back at 16,
  // which cannot be right on a card that turns over: the corners would change
  // shape mid-rotation. Flagged rather than silently split.
  const face =
    'col-start-1 row-start-1 flex w-full flex-col rounded-[24px] border border-parchment p-6 text-left shadow-card outline-none [backface-visibility:hidden] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    // `perspective` on the outer box, not the rotating one: applied to the
    // element that turns, the vanishing point travels with it and the card
    // reads as a flat image spinning rather than an object turning over.
    <li className="[perspective:1600px]">
      <div
        className={cn(
          'grid h-full [transform-style:preserve-3d]',
          !reduceMotion && 'transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
        )}
        style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
      >
        {/* ── Front ──────────────────────────────────────────────────────── */}
        <button
          ref={frontRef}
          type="button"
          onClick={() => setFlipped(true)}
          // `onMouseEnter`, not `onPointerEnter`: mouse enter/leave is what
          // "hover" means for this control, and the pointer events did not fire
          // under automated hover when the Consumer Portal's row was measured.
          // A touch device taps and flips, so it needs no raised state.
          onMouseEnter={raise}
          onMouseLeave={lower}
          onFocus={raise}
          onBlur={lower}
          aria-hidden={flipped}
          inert={flipped}
          // The whole face is the target, so the whole face is the button.
          className={cn(face, 'items-center justify-between bg-primary')}
          style={{ minHeight: CARD_MIN_H }}
        >
          <span className="flex w-full flex-col gap-4 text-white">
            <span className="text-[20px] leading-[26px] font-semibold">{number}</span>
            <span className="text-title text-balance">{term.term}</span>
          </span>

          <span className="flex w-full flex-col gap-6">
            {/* `min-h-0` so the art can shrink inside the flex column rather
                than forcing the front taller than its own back. The pillows
                carry `preserveAspectRatio="none"`, so the box is constrained by
                `max-h` + `w-auto` and never by both axes at once — giving it
                both would squash the shape. */}
            <span className="flex min-h-0 items-center justify-center">
              {/* ⚠️ Inline SVG, not the `<img>` this used to be — the pillow now
                  holds the term's own artwork (direct instruction, 2026-09-18:
                  *"add image inside the pillows… the icons that are on flip
                  side, but in same design style we are using for generating
                  images"*).

                  The shape is rendered TWICE from ONE path (`pillowFrame.ts`):
                  once as a `clipPath` the artwork is cut to, once as the visible
                  stroke on top. That is the §78.1 rule, and it is load-bearing
                  rather than tidy — this project has shipped a photo outside its
                  own outline three separate times by transcribing a mask and its
                  frame independently. One path cannot drift from itself, and the
                  stroke scales with the card for free because it rides the same
                  transform.

                  Sizing reproduces the asset's own cap behaviour exactly, which
                  is why `preserveAspectRatio="none"` is kept: the three
                  silhouettes have different intrinsic aspects (1.30 / 1.69 /
                  1.07), so at `maxHeight` 140 / `maxWidth` 200 they land in
                  three different boxes — measured 182x140, 200x119 and 150x140.
                  That difference is deliberate (the frame draws one card, and
                  seven identical pillows read as a photocopy), so the art is
                  square and each shape crops it differently via `slice`. */}
              <svg
                viewBox={shape.viewBox}
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
                className="block h-auto w-auto overflow-visible"
                width={shape.width}
                height={shape.height}
                style={{
                  maxHeight: PILLOW_MAX_H,
                  maxWidth: PILLOW_MAX_W,
                  transform: `rotate(${pillow.rotate}deg) skewX(${PILLOW_SKEW}deg) scale(${raised ? PILLOW_HOVER_SCALE : 1})`,
                  transition: reduceMotion ? undefined : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <defs>
                  <clipPath id={clipId}>
                    <path d={shape.d} />
                  </clipPath>
                </defs>
                {/* The asset's own cream fill, under the art. It is what shows
                    on a term with no `art` — chapter 2's whole revision block
                    today — so that case stays byte-identical to before. */}
                <path d={shape.d} fill={shape.fill} />
                {term.art ? (
                  (() => {
                    /* `meet` + `ART_SCALE`, not `slice`.
                       Direct instruction, 2026-09-18: *"scale them slightly, so
                       that the image content is not getting cropped because of
                       pillow shape completely (you dont need to fight this much)
                       just a little scale down"*.

                       `slice` (= `object-fit: cover`) fits a SQUARE source to the
                       pillow's WIDTH, so on the widest silhouette (1.69:1) it threw
                       away ~41% of the image's height — the pot lost its lid and
                       the bolt lost both ends.

                       `meet` fits to the shorter axis instead, so at `ART_SCALE`
                       1 nothing is cropped at all and cream shows at the sides.
                       The knob interpolates between the two:
                         1.00  = no crop, most cream
                         ~1.30 = what `slice` did on shape 1
                       1.12 keeps a little of the pillow filled while leaving the
                       subject whole, which is the "little scale down" asked for.
                       **This is the only number to touch** — the offsets below
                       are derived from it so the art stays centred. */
                    const s = ART_SCALE
                    const [vx, vy] = shape.viewBox.split(' ').map(Number)
                    const w = shape.width * s
                    const h = shape.height * s
                    return (
                      <image
                        href={`${import.meta.env.BASE_URL}illustrations/module/revision/${term.art}.webp`}
                        x={vx - (w - shape.width) / 2}
                        y={vy - (h - shape.height) / 2}
                        width={w}
                        height={h}
                        preserveAspectRatio="xMidYMid meet"
                        clipPath={`url(#${clipId})`}
                      />
                    )
                  })()
                ) : null}
                {/* The same path a third time, stroke only, so the outline sits
                    ON TOP of the artwork rather than under it. Centred stroke,
                    exactly as the asset draws it. */}
                <path
                  d={shape.d}
                  fill="none"
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {/* The frame's own affordance. It is inside the button, so it is a
                label rather than a second control — which is also why the verb
                can change with the device without affecting the accessible
                name of anything. */}
            <span className="text-center text-body-md text-white underline">{verb} to flip</span>
          </span>
        </button>

        {/* ── Back ───────────────────────────────────────────────────────── */}
        {/* A `<button>` too, not the frame's plain panel. The frame draws no way
            back, which would strand a keyboard user on the face focus was just
            moved to — this project's most-repeated defect class. The two faces
            are siblings rather than nested, so there is no button-inside-button
            problem, and making the whole face the target matches the front's own
            affordance rather than adding chrome the frame does not draw. */}
        <button
          ref={backRef}
          type="button"
          onClick={() => setFlipped(false)}
          aria-hidden={!flipped}
          inert={!flipped}
          // `inert` takes a **boolean** in React 19 — the React 18 `''` form is
          // falsy there and never reaches the DOM, which once left every hidden
          // face tabbable behind an `aria-hidden`.
          className={cn(face, 'items-start gap-10 bg-purple-200 [transform:rotateY(180deg)]')}
          style={{ minHeight: CARD_MIN_H }}
        >
          {/* 32px, constant with every other template's glyph rather than the
              frame's 56px grey square — that square is the placeholder *for* the
              icon, not a tile behind it, exactly as the chapter opening's white
              48px squares were. `primary` is the "blue" asked for; this portal
              has no blue, and the same word was used for the purple wave
              earlier in the same session. No background, as instructed. */}
          <Glyph aria-hidden="true" className="size-8 shrink-0 text-primary" strokeWidth={1.75} />
          {/* `<Text block_3>` — Sub title over Body, the frame's own pairing. */}
          <span className="flex w-full flex-col gap-2 text-ink-muted">
            <span className="text-sub-greeting leading-[1.4]">{term.term}</span>
            <span className="text-body">{term.definition}</span>
          </span>
        </button>
      </div>
    </li>
  )
}

export function RevisionFlipCards({
  terms,
  labelledBy,
}: {
  terms: RevisionTerm[]
  labelledBy?: string
}) {
  /**
   * **Not gated** (direct instruction, 2026-09-18) — flipping a card reveals a
   * definition, it does not answer anything, so this slide rides its scroll
   * gate. `onFirstFlip` is left in place on the card below: it is the hook a
   * gate would use if that decision is revisited, and it costs one call.
   */

  return (
    /**
     * `auto-fit` rather than the frame's fixed 352px width: the slide column is
     * 880px with the outline rail open and 1134 with it collapsed, so a fixed
     * width would leave a ragged gutter at one of the two.
     *
     * **The `max()` is the "never more than three" cap** (direct instruction).
     * `auto-fit` has no column-count limit of its own, so the floor is raised
     * to whichever is larger: the card's own minimum, or an exact third of the
     * row. A fourth column can then never fit — and where the row is wide, the
     * three cards grow to fill it instead of leaving dead space beside them,
     * which is what capping the container's width would have done.
     *
     * The outer `min(..., 100%)` keeps a single card from overflowing a row
     * narrower than the floor itself.
     *
     * Measured: 3 up at 251px in the 800px content width, 3 up at 335 with the
     * rail collapsed, dropping to 2 and then 1 as the row narrows.
     *
     * Cards in a row share a height for free, because each pair of faces sits
     * in one grid cell and the row sizes to the tallest.
     */
    <ul
      aria-labelledby={labelledBy}
      className="grid list-none"
      style={{
        gap: CARD_GAP,
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, max(${CARD_MIN_W}px, (100% - ${(MAX_PER_ROW - 1) * CARD_GAP}px) / ${MAX_PER_ROW})), 1fr))`,
      }}
    >
      {terms.map((term, i) => (
        <FlipCard
          key={term.term}
          term={term}
          index={i}
          onFirstFlip={undefined}
        />
      ))}
    </ul>
  )
}
