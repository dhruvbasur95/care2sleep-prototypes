import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  PILLOW_FILL,
  PILLOW_FRAMES,
  PILLOW_STROKE,
  PILLOW_STROKE_LINEJOIN,
  PILLOW_STROKE_W,
} from '@/components/consumer/pillowFrame'
import type { ModuleEpisode, ModuleSummaryCard } from '@/data/consumerLessonContent'

/**
 * The Summary screen's flip cards — Round 46, frames `882:2067` (the row and a
 * card's front) and `900:2244` (a card's back).
 *
 * Tap a card and it turns over to reveal what its chapter covered.
 *
 * ── The three pillow styles ───────────────────────────────────────────────
 *
 * Direct instruction: "each has 3 UI styles". The frame's three cards are
 * identical apart from the hand-drawn pillow on each — a different vector at a
 * different size and rotation. Those are the styles, transcribed below and
 * committed as three SVGs, and they cycle across however many cards a module
 * has (this one has four chapters).
 *
 * Each pillow's width is expressed as a **share of the card's inner width**
 * rather than in px, so the whole thing scales with a fluid card instead of
 * overflowing a narrow one. The frame's card is 404 wide with 24px padding
 * either side, so the inner width is 356 and each vector's own width divides
 * into it. Rotation and skew are the frame's own.
 *
 * ── Why a grid stack rather than an absolutely positioned back ────────────
 *
 * Both faces sit in the same grid cell, so the card is as tall as its taller
 * face and **nothing reflows when it turns**. The obvious alternative — front
 * in flow, back `absolute inset-0` — sizes the card to the front alone, and
 * these backs are taller than their fronts (609 against 553 in the frames), so
 * every flip would have resized the card mid-rotation and shoved the rest of
 * the row around. It also means a row of cards is uniformly tall for free.
 *
 * ── Accessibility ─────────────────────────────────────────────────────────
 *
 * The **front** is a `<button>` covering the whole face, because the whole face
 * is the target. The **back** is a plain `div` carrying its own controls — a
 * button inside a button is invalid, and the back has its own controls (a way
 * to turn back; "Download resource" lived here too until Round 48 moved the
 * download to the shared resource card below the row).
 *
 * The face that is turned away is `inert` and `aria-hidden`. `backface-
 * visibility: hidden` hides it *visually only*: without this, every card's back
 * would sit in the tab order and be read out while facing away, which is the
 * same class of defect as animating `height: 0` and calling it concealment
 * (Round 20, and a standing rule in CLAUDE.md).
 *
 * ⚠️ **`inert` takes a boolean in React 19, and `inert=""` is falsy there.**
 * A first pass wrote the React 18 form (`inert={hidden ? '' : undefined}` with
 * a `@ts-expect-error`, since older React types lacked the prop) and the
 * attribute silently never reached the DOM — measured with
 * `el.hasAttribute('inert')` returning `false` on a face that was already
 * `aria-hidden`. Every hidden back's Download and Flip back controls were
 * tabbable. The types in React 19 declare `inert?: boolean`, so the suppression
 * comment was also hiding the compiler telling us this.
 *
 * Flipping also **moves focus**, because the control that was clicked turns
 * away: forward to the back's title, back to the front button. Without it the
 * reader's focus is left on an inert element and the browser drops it to
 * `<body>` — this project's most-repeated defect. An effect is safe here where
 * it was not on the page's stages: both faces are always mounted, so the target
 * element exists at the moment the flag changes.
 *
 * Under `prefers-reduced-motion` the transition is dropped, so the card snaps
 * to its other face rather than turning. The rotation still happens — that is
 * what `backface-visibility` needs to swap which side is painted — it just is
 * not animated. Shortening the turn instead would still be a turn, and the turn
 * is the thing the preference is about.
 */

/**
 * Frame `902:2341` / `902:2348` / `902:2355`. `width` is the share of the card's
 * 356px inner width the vector occupies; `rotate` and `skew` are the frame's own
 * transforms on it.
 *
 * ⚠️ **The committed SVGs carry a hand-added `purple-300` centred stroke**
 * (direct instruction), which the Figma exports do not. Adding it meant growing
 * each file's `viewBox` and intrinsic size by the stroke width — a centred
 * stroke sits half outside the path's own bounds and an `<img>` clips to the
 * viewBox, so without that the outline would be shaved flat on every edge.
 *
 * The widths below are therefore the **post-stroke** intrinsic widths
 * (324.265 -> 330.265, 353.16 -> 359.16, 317.237 -> 323.237), which keeps the
 * pillow shape exactly the size the frame drew it and puts the new outline
 * outside that. **A re-export from Figma drops the stroke and reverts the
 * viewBox**, and both have to be reapplied together — the same standing trap as
 * the confetti frames' transparency (§75).
 */
/**
 * The portal's one stock cover photo — the same file `LessonCards` puts on all
 * six module cards, `LearningTaskCard` puts on Home and `ConsumerModulePage`
 * puts on its own header (direct instruction: "use the stock defaul image we
 * are using everywhere"). One path, so a real per-module image later replaces
 * it everywhere at once rather than in four places.
 */
const PILLOW_PHOTO = '/illustrations/consumer-home/lesson-cover.jpg'

const PILLOW_STYLES = {
  1: { src: 'card-pillow-1.svg', width: 330.265 / 356, rotate: -2.14 },
  2: { src: 'card-pillow-2.svg', width: 359.16 / 356, rotate: 3 },
  3: { src: 'card-pillow-3.svg', width: 323.237 / 356, rotate: -4.51 },
} as const

/** Every vector in this file family carries the same -0.82deg skew the module
 *  hero's wave does — it is the designer's hand-drawn tilt, not a per-shape
 *  value. One constant so the three cannot drift apart. */
const PILLOW_SKEW = -0.82

/**
 * One multiplier on every pillow's width, so the artwork shrinks on the narrow
 * screens where the card has least room to spare — direct instruction ("reduce
 * pillow height container (accordingly reduce pillow height) to reduce card
 * height").
 *
 * Scaling the **width** is what reduces the height: each vector is sized as a
 * share of the card's inner width with `height: auto`, so its aspect does the
 * rest and the three shapes stay in proportion to one another. Capping the
 * height directly would need `w-auto` and would throw away the frame's own
 * per-shape width shares.
 *
 * All three breakpoints are `min-[Npx]:`, never a named one mixed in — Tailwind
 * v4 orders arbitrary-property utilities separately from named-breakpoint ones
 * and the wrong one wins at equal specificity (§89.2).
 */
/* Round 47, direct instruction: bigger on a phone, without touching the
   pillow's own container or the card's height or width. So only the width
   multiplier moves (0.66 -> 0.88) and `--pillow-max-h` stays at 180 — the
   height cap is what guarantees the card cannot grow. Measured at 375: the
   artwork goes 174x138 -> 227x180 inside an unchanged 279x215 container and an
   unchanged 327x440 card. 0.88 is the ceiling rather than a round number: the
   widest pillow (style 2, 1.009 of the column) rotated 4.51deg and swelled by
   the hover/focus scale reaches 211px of the container's 215. */
const PILLOW_SCALE_VARS =
  '[--pillow-s:0.88] min-[640px]:[--pillow-s:0.8] min-[1200px]:[--pillow-s:1]'

/**
 * An absolute ceiling on the artwork, in px, on top of the percentage above.
 *
 * The percentage alone is fine at three across, where the card is ~371 and the
 * pillow lands near the frame's own 324. In the single-column band it is not:
 * at 1199 the card was **1151px** wide, so a 99%-of-inner-width pillow rendered
 * ~1000px across and over 500 tall, and the *front* face became the tallest
 * thing on the page — measured card heights of 833 / 730 / 951 / 833 with a
 * 280px panel sitting behind them. Artwork should not grow without limit just
 * because the container did.
 *
 * 340 is a little above the frame's own 324 at its 404px card, so the desktop
 * three-across layout is untouched and only the wide single-column band clamps.
 */
const PILLOW_MAX_W = 340

/**
 * A height ceiling as well, and it is what makes the three styles
 * interchangeable rather than merely similar.
 *
 * The vectors have quite different aspects — 324x248, 353x207, 317x296 — so
 * sizing them all by width left style 3 rendering 343px tall against style 2's
 * 217. In a single column that made card 3's *front* the tallest face on the
 * page and its card 14px taller than its neighbours', for no reason a reader
 * could see. Capping the height too levels them: CSS scales a replaced element
 * proportionally when both a width and a `max-height` bind, so the aspect is
 * preserved and only the largest shape moves.
 */
/**
 * How much the pillow swells while its card is hovered or focused — direct
 * instruction ("the pillow scales up, without altering card dimension").
 *
 * It is a `scale()` composed into the artwork's **own** transform, and it must
 * be: the image already carries a rotate and a skew, so a Tailwind `scale-*`
 * utility would replace them rather than add to them. A transform is painted
 * rather than laid out, so the card's height and the grid's tracks cannot react
 * to it — which is exactly what "without altering card dimension" asks for. An
 * actual size change would shove a four-card row around on every mouse move.
 *
 * ⚠️ **Driven from React state, not a CSS `:hover`.** The first pass set a
 * custom property with `motion-safe:hover:[--pillow-hover:1.07]`, and Tailwind
 * emitted **no rule at all** for it — verified by walking every stylesheet for
 * the property name and finding zero matches, while the class sat in the DOM
 * and setting the variable by hand scaled the image correctly. Arbitrary
 * *properties* behave here when unprefixed or under a `min-[Npx]:` variant
 * (`--pillow-s`, `--wave-s` both work); stacked with `motion-safe:hover:` they
 * do not. Rather than discover which combinations survive the scanner, the
 * state is explicit and cannot silently fail to compile.
 */
const PILLOW_HOVER_SCALE = 1.07

const PILLOW_MAX_H_VARS =
  '[--pillow-max-h:180px] min-[640px]:[--pillow-max-h:220px] min-[1200px]:[--pillow-max-h:260px]'

/**
 * `**bold**` inside a bullet, which frame `900:2264` uses to lift the three
 * named habits out of a sentence.
 *
 * A deliberately tiny parser rather than a markdown dependency: the only markup
 * these strings carry is a bold span, and pulling in a renderer for that would
 * also let arbitrary markup into copy that is meant to be plain sentences.
 */
function withBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  )
}

function CardFront({
  card,
  title,
  onFlip,
  hidden,
  buttonRef,
}: {
  card: ModuleSummaryCard
  title: string
  onFlip: () => void
  hidden: boolean
  buttonRef: React.RefObject<HTMLButtonElement | null>
}) {
  const pillow = PILLOW_STYLES[card.style]
  const frame = PILLOW_FRAMES[card.style]
  const clipId = useId()
  const reduceMotion = useReducedMotion()
  const [raised, setRaised] = useState(false)
  // Focus raises it too, so the cue is not pointer-only.
  const raise = () => setRaised(true)
  const lower = () => setRaised(false)
  const scale = !reduceMotion && raised ? PILLOW_HOVER_SCALE : 1

  return (
    <button
      type="button"
      onClick={onFlip}
      // `onMouseEnter`, not `onPointerEnter`: the pointer events never fired
      // under automated hover here, and mouse enter/leave is what "hover"
      // actually means for this control. A touch device taps and flips instead,
      // so it needs no raised state.
      onMouseEnter={raise}
      onMouseLeave={lower}
      onFocus={raise}
      onBlur={lower}
      // `col-start-1 row-start-1` puts both faces in the one grid cell.
      className={cn(
        'col-start-1 row-start-1 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-consumer-primary px-6 pt-6 pb-10 text-left',
        'outline-none [backface-visibility:hidden] focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2',
        // The pillow also swells on keyboard focus, so the cue is not
        // pointer-only — same treatment, same reason.
      )}
      aria-hidden={hidden}
      inert={hidden}
      ref={buttonRef}
    >
      <span className="flex w-full flex-col gap-4 text-white">
        {/* `consumer-lesson` + semibold (20/600), not the frame's 24/700.
            That is the exact treatment the module welcome screen already gives
            "Module 4" — the same kind of thing, a small identifier above a
            title — and 24 and 700 appear nowhere else in this portal. Round 46
            type sweep: Home is the scale, and Home tops out at 600. */}
        <span className="text-consumer-lesson font-semibold">{card.number}</span>
        <span className="text-consumer-card-title text-balance">{title}</span>
      </span>

      {/* The pillow. `min-h-0` so it can shrink inside the flex column rather
          than forcing the card taller than its own back. */}
      <span
        className={cn(
          'flex min-h-0 w-full flex-1 items-center justify-center',
          PILLOW_SCALE_VARS,
          PILLOW_MAX_H_VARS,
        )}
      >
        {/*
          ── The pillow, now framing a photo ────────────────────────────────
          One inline SVG rendering `frame.d` **twice**: as the `clipPath` the
          image is cut to, and as the stroke drawn over it. Never two assets —
          see `pillowFrame.ts`, and §78.1 for the three separate rounds this
          project shipped a photo hanging outside its own outline by deriving a
          mask and its frame independently.

          `preserveAspectRatio="xMidYMid meet"` on the root replaces the source
          file's own `none`: `--pillow-max-h` can make the rendered box shorter
          than the natural aspect, and `none` would squash the pillow when it
          does. `meet` is what the `<img>` it replaces already did by default.

          The `<image>` uses `slice`, so the photo fills the pillow and crops
          rather than letterboxing inside it.
        */}
        <svg
          aria-hidden="true"
          viewBox={frame.viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="h-auto"
          style={{
            width: `calc(${pillow.width * 100}% * var(--pillow-s))`,
            maxWidth: PILLOW_MAX_W,
            maxHeight: 'var(--pillow-max-h)',
            transform: `rotate(${pillow.rotate}deg) skewX(${PILLOW_SKEW}deg) scale(${scale})`,
            transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <defs>
            {/* `useId` — four cards render three shapes and two faces each, so
                a fixed id would have every pillow on the page clipped by
                whichever one mounted last. */}
            <clipPath id={clipId}>
              <path d={frame.d} />
            </clipPath>
          </defs>
          {/* Painted under the image: a slow or failed load leaves the shape
              the card was designed around, not a hole in it. */}
          <path d={frame.d} fill={PILLOW_FILL} />
          <image
            href={PILLOW_PHOTO}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
            x={-3}
            y={-3}
            width={frame.width}
            height={frame.height}
          />
          <path
            d={frame.d}
            fill="none"
            stroke={PILLOW_STROKE}
            strokeWidth={PILLOW_STROKE_W}
            strokeLinejoin={PILLOW_STROKE_LINEJOIN}
          />
        </svg>
      </span>

      {/* "Tap" below the portal's own 1200 breakpoint, "Click" above it —
          direct instruction, Round 47. Two spans with one `display: none`
          rather than one string switched in React: CSS-hidden text is excluded
          from the accessible name computation, so the button still announces
          exactly the verb a reader can see, and there is no state to keep in
          sync with a resize. 1200 is the width `ConsumerHeader` already
          switches at, so the portal has one breakpoint rather than two.
          (`pointer-coarse` would be the more literally correct rule — a touch
          device taps whatever its width — but the instruction was framed by
          device size and the portal has no other pointer-based rule.) */}
      <span className="w-full text-center text-body-md text-white underline">
        <span className="min-[1200px]:hidden">Tap to flip</span>
        <span className="hidden min-[1200px]:inline">Click to flip</span>
      </span>
    </button>
  )
}

function CardBack({
  card,
  title,
  onFlip,
  hidden,
  labelId,
  titleRef,
}: {
  card: ModuleSummaryCard
  title: string
  onFlip: () => void
  hidden: boolean
  labelId: string
  titleRef: React.RefObject<HTMLParagraphElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [moreBelow, setMoreBelow] = useState(false)
  const panelId = `${labelId}-points`
  // Where the pointer went down, so a click that was really a drag does not
  // flip the card — see `flipOnBackgroundClick`.
  const pressAt = useRef<{ x: number; y: number } | null>(null)

  /**
   * A scroll indicator, not a Show more toggle — direct instruction: "it should
   * not [be] show more or show less. It should be a scroll detector, scroll to
   * see more."
   *
   * So the panel keeps one height and always scrolls; the hint only says
   * whether there is anything below the fold, and disappears on arrival at the
   * end. "Scroll to see more" is this portal's own wording — `ScrollCue` uses
   * it for the page itself, so the same gesture reads the same way inside a
   * card.
   *
   * Measured rather than assumed, and re-measured on resize: whether four
   * points overflow depends on how much they wrap, which changes with the card
   * width, and no event fires for a resize.
   */
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const check = () => setMoreBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 2)
    check()
    el.addEventListener('scroll', check, { passive: true })
    // Observe the panel AND the list inside it. The panel's own box can hold
    // still while its content reflows — a webfont swapping in is the usual
    // case, and it changes how much the bullets wrap without ever resizing the
    // box, so observing only the panel misses it and the hint never appears.
    const ro = new ResizeObserver(check)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [])

  /**
   * Click anywhere on the back to turn it over — direct instruction, replacing
   * the visible "Flip back" control.
   *
   * Two guards, both necessary:
   *
   * - **Not on an interactive child.** The scroll hint lives on this face;
   *   without the `closest('button, a')` test, pressing it would also flip the
   *   card away from what it just did.
   * - **Not on a drag.** The points list scrolls, and a click-drag to scroll
   *   ends in a `click` event. Comparing pointer-up against pointer-down and
   *   ignoring anything past 6px means scrolling the list, or selecting a line
   *   of text to read it back, does not throw the reader out of the card.
   *
   * The back cannot be a `<button>` like the front is — it contains a button,
   * and nesting them is invalid — so this is a click handler on a div. That
   * would leave keyboard users with no way back, hence the `sr-only` button
   * further down and Escape while focus is anywhere on this face. The
   * instruction was to remove the *button*, not the route back.
   */
  const flipOnBackgroundClick = (e: React.MouseEvent) => {
    const from = pressAt.current
    pressAt.current = null
    if (from) {
      const moved = Math.hypot(e.clientX - from.x, e.clientY - from.y)
      if (moved > 6) return
    }
    if ((e.target as HTMLElement).closest('button, a')) return
    onFlip()
  }

  return (
    <div
      className={cn(
        'col-start-1 row-start-1 flex cursor-pointer flex-col items-center gap-6 rounded-2xl bg-purple-200 p-6',
        '[backface-visibility:hidden] [transform:rotateY(180deg)]',
      )}
      aria-hidden={hidden}
      inert={hidden}
      onPointerDown={(e) => {
        pressAt.current = { x: e.clientX, y: e.clientY }
      }}
      onClick={flipOnBackgroundClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onFlip()
        }
      }}
    >
      {/*
        The header reserves `--card-hdr-h`, the tallest header in the set, so
        every card's pale panel starts at the same y and every card is the same
        height. See `useEqualHeaders` for how that value is arrived at.

        The outer box carries the reserved height; the inner one is what gets
        measured, and the split is the whole trick — measuring an element that
        is itself being inflated by `min-height` just reads the inflated value
        back and the number never settles.
      */}
      <div className="w-full" style={{ minHeight: 'var(--card-hdr-h, 0px)' }}>
        <div data-card-header className="flex w-full flex-col gap-1">
          {/* `tabIndex={-1}` so the flip can land focus here. It is the back's
              own heading, so a screen reader announces which card turned over
              rather than reading from wherever focus happened to fall. */}
          <p
            id={labelId}
            ref={titleRef}
            tabIndex={-1}
            className="text-consumer-lesson text-consumer-primary outline-none"
          >
            {title}
          </p>
          <p className="text-body font-semibold leading-[1.4] text-ink">{card.lead}</p>
        </div>
      </div>

      {/*
        Fixed height, and it scrolls — direct instruction, to bring the card
        down from the 878px it measured at three across.
        (120 header + 483 panel + 108 footer + padding and gaps.) Capping the
        panel is what the card's height follows, since it is by far the tallest
        part; at 280 the card lands near the frame's own 609.

        A scrollable box with no focusable content inside is **keyboard
        unreachable** unless it is a tabbable named region — a real WCAG 2.1.1
        failure, and the exact one Round 20 found on the sleep-diary grid. Hence
        `tabIndex={0}` + `role="group"` + a label naming which chapter's points
        these are.

        ⚠️ Worth stating rather than burying: fixing the height puts roughly two
        of four points below a scroll on this audience's screens, and this
        portal's own note argues against hiding content behind a gesture. It is
        what was asked for and the trade is the designer's to make, but if the
        cards want to be shorter *and* whole, the other lever is two across on
        desktop rather than three.
      */}
      <div
        ref={panelRef}
        id={panelId}
        // Always tabbable. The hint below is a passive indicator now, not a
        // button, so this region has no focusable content of its own — and a
        // scrollable box that cannot be reached by keyboard is a real WCAG
        // 2.1.1 failure, the one Round 20 found on the sleep-diary grid. With
        // focus here the arrow keys scroll it.
        tabIndex={0}
        role="group"
        aria-label={`What ${title} covered`}
        className={cn(
          // `pb-0`, with the list carrying the bottom padding instead. A
          // `sticky bottom-0` child aligns to the container's PADDING box, not
          // its border box, so a `pb-4` here leaves a 16px band underneath the
          // hint where the scrolling text shows through — visible as a sliver
          // of a line below it. Moving that padding into the list removes the
          // band rather than trying to cover it.
          'w-full rounded-lg bg-purple-50 px-4 pt-4 pb-0 outline-none focus-visible:ring-2 focus-visible:ring-consumer-primary',
          // A **bounded** flexible height — 280 floor, 420 ceiling — rather
          // than one hard number, and each half earns its place:
          //
          // **One fixed height, the same on every card** — direct instruction
          // ("keep the inner container card height fixed for all cards"). Not
          // `min-h`, not `max-h`, not `flex-1`: a plain height, so the pale
          // panel is the same size whichever card you turn over and the row
          // reads as one set rather than four different shapes.
          //
          // It steps with the breakpoint (200 / 260 / 300) and nothing else. A
          // phone card is narrow enough that its title and lead wrap to six
          // lines before the list even starts, so the same panel that reads
          // fine in a 371px desktop card made the phone's cards 700px tall.
          // Direct instruction: "I dont want to see cards with a lot of height
          // on tablet and mobile view."
          //
          // Three earlier shapes are recorded so none is re-attempted:
          //   `h-70` + an `mt-auto` footer put the slack between the panel and
          //     Download resource, as a gap in the middle of the card;
          //   `min-h-70 flex-1` moved that slack *inside* the panel, leaving a
          //     420px box holding 300px of text on a wide card;
          //   content-height panels with `items-start` made every card its own
          //     size, which `layout-audit.js` flagged as
          //     `grid-row-uneven-heights` (684 / 635 / 710 in one row) — a check
          //     calibrated to zero false positives here, so it was treated as
          //     the finding it is rather than loosened.
          // What remains of the slack now falls **below Download resource**,
          // where it is just a little more of the card's own fill. That is what
          // dropping `mt-auto` from the footer buys.
          'overflow-y-auto',
          // ⚠️ A **plain height**, and it has now been wrong in both directions,
          // so neither is worth re-attempting:
          //
          //   `flex-1` with these as floors — the first answer to "the vacant
          //     space should be taken over by the container above" once Download
          //     resource left. It works literally and reads badly: measured 394px
          //     of panel holding ~250px of text, which is the same empty-box
          //     complaint the third bullet below already records. Reported as
          //     "reduce this container height now" over exactly this element.
          //   `h-70` + an `mt-auto` footer, `min-h-70 flex-1`, and content-height
          //     panels — see the three shapes listed below.
          //
          // So the panel keeps its own size and the space Download resource left
          // simply comes off the card, which is what makes the whole row shorter.
          'h-50 min-[640px]:h-65 min-[1200px]:h-75',
        )}
      >
        <ul className="flex flex-col gap-4 pb-4">
        {card.bullets.map((bullet, i) => (
          <li key={i} className="flex gap-3">
            {/* The frame exports the bullet as a 12x21 SVG, which is a plain
                circle sitting on the first line's optical centre. A CSS dot
                reproduces it exactly, scales with the text and commits no
                asset — the never-hand-draw-an-icon rule is about glyphs, and a
                dot is a shape. `mt-[7px]` is the frame's own 21px box centre
                against a 22.4px line. */}
            <span
              aria-hidden="true"
              className="mt-[7px] size-1.5 shrink-0 rounded-full bg-consumer-primary"
            />
            <span className="min-w-0 flex-1 text-body leading-[1.4] text-ink">
              {withBold(bullet)}
            </span>
          </li>
        ))}
        </ul>

        {/*
          Inside the scroll panel, not under it — direct instruction ("show more
          should be within scrollable container not below it"). It sat on the
          card's purple-200 surface before, which read as a control belonging to
          the card rather than to the list it opens.

          **It is a real button, and that is a fix rather than a flourish.** As
          a plain div it read as clickable and clicking it flipped the card —
          the back's background handler caught it, because that handler only
          spares `button, a`. Reported exactly that way: "scroll to see more
          [looks] clickable, but flips the card". Pressing it now scrolls the
          list, which is the thing it was pointing at.

          `aria-hidden` + `tabIndex={-1}`: a pointer-only affordance. It is not
          hidden-but-focusable (which would be a real violation) — it is out of
          the tab order entirely, because a keyboard or screen-reader user
          already has the panel itself as a focusable region they can arrow
          through, and a button duplicating that would be noise.

          `sticky bottom-0` so it sits on the panel's lower edge wherever the
          list is scrolled to, with the negative margins bleeding its solid
          `purple-50` fill to the panel's own edges so text passes cleanly
          underneath instead of showing through beside it.
        */}
        {moreBelow ? (
          <div className="sticky bottom-0 -mx-4 bg-purple-50 px-4 pt-1 pb-3">
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => {
                const el = panelRef.current
                // A screenful at a time rather than straight to the end, so the
                // reader keeps their place in the list.
                el?.scrollBy({ top: el.clientHeight * 0.8, behavior: 'smooth' })
              }}
              // `h-9`, the app's control floor. At its natural 17px
              // `layout-audit.js` flagged it, and rightly: it is a real target
              // now that pressing it scrolls the list.
              className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-sm text-body-md text-consumer-primary"
            >
              Scroll to see more
              <ChevronDown strokeWidth={2.25} className="size-4 shrink-0" />
            </button>
          </div>
        ) : null}
      </div>

      {/* The visible "Flip back" pill was removed on instruction, in favour of
          clicking the card. This keeps the same action available to anyone
          tabbing through, where "click anywhere" is not an affordance at all.
          It is the first stop after the card's own controls.

          ⚠️ **Download resource used to live here and is gone** — direct
          instruction, once the take-home guide got its own card below the row
          ("remove Download resources buttons from flip to reveal cards"). One
          download per module rather than one per chapter, and it now sits with
          the copy that says what the file is. The space it vacated is taken by
          the scroll panel above (see its `flex-1`), which is where the reading
          actually happens. */}
      <button type="button" onClick={onFlip} className="sr-only">
        Flip back to the front of this card
      </button>
    </div>
  )
}

function SummaryCard({ card, title }: { card: ModuleSummaryCard; title: string }) {
  const [flipped, setFlipped] = useState(false)
  const reduceMotion = useReducedMotion()
  const labelId = useId()
  const frontRef = useRef<HTMLButtonElement>(null)
  const backTitleRef = useRef<HTMLParagraphElement>(null)
  /**
   * The flip's focus move, guarded on the **previous value** rather than on a
   * "have I run before" latch.
   *
   * The latch version was built first and measured wrong: arriving on the
   * Summary screen put focus on the *last card's front button* instead of the
   * page heading. StrictMode mounts effects twice — run one set the latch and
   * returned, run two saw it already set and focused the front button of every
   * card in turn, last one winning. Exactly the stale-focus-after-a-StrictMode
   * remount that Round 17 traced on the researcher tour.
   *
   * Comparing against the previous value cannot misfire that way: on the second
   * mount run `flipped` has not changed, so there is nothing to do. It only
   * fires on a real turn, which is the only time the control that was clicked
   * has gone away.
   */
  const prevFlipped = useRef(flipped)

  useEffect(() => {
    if (prevFlipped.current === flipped) return
    prevFlipped.current = flipped
    const target = flipped ? backTitleRef.current : frontRef.current
    target?.focus({ preventScroll: true })
  }, [flipped])

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
        <CardFront
          card={card}
          title={title}
          hidden={flipped}
          buttonRef={frontRef}
          onFlip={() => setFlipped(true)}
        />
        <CardBack
          card={card}
          title={title}
          labelId={labelId}
          titleRef={backTitleRef}
          hidden={!flipped}
          onFlip={() => setFlipped(false)}
        />
      </div>
    </li>
  )
}

/**
 * The row.
 *
 * **Three across from 1200 up, one below it** — the frame's own count, after a
 * detour through two across. Both were direct instructions; three is where it
 * landed once the panel stopped stretching, because the height problem two
 * across was meant to solve turned out to be the stretching rather than the
 * column count.
 *
 * The single-column band reaches all the way to 1200 rather than stopping at
 * `640`. At 768, two columns give a **348px** card — narrower than the phone's
 * own single-column card, so the "tablet" layout was worse than the phone one,
 * and it was reported as broken. 1200 is this portal's own breakpoint
 * (`ConsumerHeader`), so the grid changes where the rest of the portal's layout
 * does rather than at a third width of its own.
 *
 * Cards in a row share a height (`auto-rows-fr`, and the default stretch), so
 * the row reads as a row. What changed is where the resulting slack goes — see
 * the panel note in `CardBack`. Flipping never shifts the layout either way:
 * the grid stack sizes each card to its own taller face regardless.
 *
 */
/**
 * Reserve the tallest header across the set, measured, on one CSS variable.
 *
 * The panels are all the same height, but they were not all starting at the
 * same y: a title that wraps one line further pushes its card's panel down and
 * its card taller. Measured at a 371px card: headers 120 / 120 / 146 / 142; at
 * 272px: 233 / 233 / 233 / 256.
 *
 * This replaced a hardcoded `min-h-38` applied only at 1200+. That number was
 * right for one width and one set of titles, and wrong everywhere else — it
 * over-reserved 32px on two cards at desktop and did nothing at all on a phone,
 * where the last card still ran 23px taller than its siblings. Measuring costs
 * one `ResizeObserver` and is correct at every width and for any copy.
 *
 * Set as a variable on the list rather than as state on each card so there is
 * one writer, and applied through `min-height` so an unexpectedly long title
 * grows its card rather than being clipped.
 */
function useEqualHeaders(ref: React.RefObject<HTMLUListElement | null>) {
  useEffect(() => {
    const list = ref.current
    if (!list) return
    const measure = () => {
      const heads = [...list.querySelectorAll<HTMLElement>('[data-card-header]')]
      if (!heads.length) return
      const tallest = Math.max(...heads.map((h) => h.offsetHeight))
      list.style.setProperty('--card-hdr-h', `${tallest}px`)
    }
    measure()
    // Observe every header, not just the list: the list's own width changing is
    // the usual trigger, but a webfont swapping in reflows the text inside a box
    // that never resizes, and that is exactly when a title gains a line.
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    list.querySelectorAll('[data-card-header]').forEach((h) => ro.observe(h))
    return () => ro.disconnect()
  }, [ref])
}

export function ModuleSummaryCards({ episode }: { episode: ModuleEpisode }) {
  const listRef = useRef<HTMLUListElement>(null)
  useEqualHeaders(listRef)

  const titleFor = (chapterId: string) =>
    episode.chapters.find((c) => c.id === chapterId)?.title ?? ''

  return (
    /*
      Three bands: one column on a phone and a portrait tablet, **2 x 2 from
      1024**, three across from 1200.

      The middle band is a direct instruction: "in module summary card, if its a
      big ipad screen, landscape mode, can we have 2x2 stacking of cards, rather
      than vertical stacking". Every iPad in landscape except the 13" lands in
      it — Air 11" is 1180, Pro 11" 1194, 10th gen 1080, mini 1133 — so before
      this they all got a single stacked column on a screen wide enough for two.
      It is exactly 2 x 2 rather than a general two-column rule because this
      module has four summary cards, one per chapter.

      `max-w-[560px] mx-auto` while there is one column, released at 1024 with
      the cap — two columns inside a 560px box would be narrower than the single
      column they replaced.

      Below the cap a single card filled the whole content column — 1151px wide
      at 1199, 976 at 1024. A reflection card that wide is not a card, and it
      dragged everything with it: the header ran to one long line, the artwork
      scaled up with the container, and the pale panel looked like a letterbox
      inside a slab. 560 is close to the width the three-column layout gives a
      card once you account for its own padding, so a card reads at roughly the
      same size whichever band you are in — which is the point of the cap.
    */
    <ul
      ref={listRef}
      className="mx-auto grid w-full max-w-[560px] grid-cols-1 gap-6 min-[1024px]:max-w-none min-[1024px]:auto-rows-fr min-[1024px]:grid-cols-2 min-[1200px]:grid-cols-3"
    >
      {episode.summaryCards.map((card) => (
        <SummaryCard key={card.chapterId} card={card} title={titleFor(card.chapterId)} />
      ))}
    </ul>
  )
}
