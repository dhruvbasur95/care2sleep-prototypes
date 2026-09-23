import { cn } from '@/lib/utils'

/**
 * ⚠️ TEMPORARY — a dashed stroke on every block's own box, so block padding and
 * the gap between blocks can be seen while they are being tuned. Not a design
 * decision and not shippable: flip to `false` once the spacing is settled.
 *
 * `outline`, deliberately, not `border` or `ring`: an outline is painted outside
 * the box without occupying layout, so switching it on cannot move the very
 * spacing it is being used to measure.
 */
// OFF since 2026-09-17, by request ("remove outlines from here also") — the
// spacing is settled. It was switched on earlier the same day to see block
// padding while it was being tuned. Leave it `false`: it is a debugging aid, not
// a design decision, and it is not shippable on.
export const DEBUG_BLOCK_OUTLINES = false

/**
 * One block's own box: 40px of padding on all four sides, with a 40px gap to the
 * next one (owned by the slide column's `space-y-10`).
 *
 * It lives in its own module rather than in `BlockSlide`, which is where it used
 * to be inline, because a **compound** block has to draw its own boxes — and
 * `BlockSlide` already imports `BlockView`, so the renderer importing the box
 * back from `BlockSlide` would be a cycle.
 *
 * ## Compound blocks
 * Normally one module.md tag is one box, and `BlockSlide` wraps every block for
 * you. `<Chapter outro block>` is the exception (direct instruction,
 * 2026-09-16: "image and text is one block, next module card a separate one") —
 * one tag, two boxes. Such a block is listed in `COMPOUND_BLOCK_TAGS` below,
 * `BlockSlide` then leaves it unwrapped, and its renderer returns a fragment of
 * `BlockBox`es. A fragment is what makes the spacing work without a wrapper
 * element: its children become *direct* children of the column, so the column's
 * own `space-y-10` gaps them like any other pair of blocks.
 */
export function BlockBox({
  children,
  className,
  tail,
}: {
  /** Optional: the slide's own trailing spacer is a deliberately empty box
   *  (`BlockSlide`), so a box with no content is a real case, not a mistake. */
  children?: React.ReactNode
  className?: string
  /** Marks this box as the slide's trailing spacer, so the scroll gate and the
   *  "Scroll to see more" cue can both discount it. Direct instruction,
   *  2026-09-18: *"do not treat empty block container as content"*. */
  tail?: boolean
}) {
  return (
    <div
      data-slide-tail={tail || undefined}
      className={cn(
        'p-10',
        DEBUG_BLOCK_OUTLINES && 'outline outline-1 outline-dashed outline-primary/40',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Tags whose box keeps its 40px sides but drops its top and bottom padding.
 *
 * Direct instruction, 2026-09-17, given in two parts:
 * 1. *"add rule to video blocks, no top bottom padding needed."*
 * 2. *"if its just subtitle block, or body block or just title block -> no top
 *    and bottom paddings. This rule does not apply to any block which uses a
 *    combination."*
 *
 * ⚠️ **The test is single-role, not single-element.** A block carrying one text
 * role has nothing above or below it inside its own box, so the box's vertical
 * inset only adds to the 40px gap the column already puts between blocks —
 * 80px of air around one paragraph. A block that *combines* roles (`text-2` is
 * Label + Title + Sub title; `text-3` is Sub title + Body; the three "Know ..."
 * blocks are eyebrow + Title + Sub title) has internal spacing of its own to
 * sit against, so it keeps the padding. Same logic for a video: one flush
 * rectangle.
 *
 * The **horizontal** inset always stays, so a block still lines up with the
 * copy above it rather than bleeding to the column edge.
 *
 * There is no title-only tag in the block union today — `<Text block _Title>`
 * is a Figma atom with no module.md tag of its own, used inside the transition
 * slide rather than authored directly. **Add it here when one appears**, since
 * the instruction names it explicitly.
 *
 * A `Set` rather than a check at the call site for the same reason
 * `COMPOUND_BLOCK_TAGS` is one: it is a rule about which tags behave this way,
 * and it should be readable in one place.
 */
export const NO_VERTICAL_PADDING_BLOCK_TAGS = new Set(['video', 'sub-title', 'body'])

/** Tags whose renderer draws its own `BlockBox`es instead of being wrapped in
 *  one. Keep this the single source — `BlockSlide` reads it, so adding a tag
 *  here is the whole change. */
export const COMPOUND_BLOCK_TAGS = new Set([
  // `accordion-image` also draws ONE box. It has to: the frame puts a 1px
  // stroke and an 8px radius on the padded box itself, and a wrapper's stroke
  // would sit 40px outside the one the frame draws.
  'accordion-image',
  // `interactive` draws ONE box, not several — it is here for the other half of
  // this set's contract ("draws its own box instead of being wrapped"). It has
  // to, because a surfaced interactive block carries its own 40px inset inside
  // its tint, and a wrapper box's 40px outside it would double to 80.
  'interactive',
  'module-intro',
  'chapter-intro',
  'chapter-opening',
  'chapter-outro',
])
