import { Fragment, useEffect, useRef } from 'react'
import type { Slide } from '@/data/moduleContent'
import { SlideGateProvider, type SlideGateState } from './slideGate'
import { cn } from '@/lib/utils'
import { BlockView } from './blocks/BlockRenderer'
import { BlockBox, COMPOUND_BLOCK_TAGS, NO_VERTICAL_PADDING_BLOCK_TAGS } from './blocks/BlockBox'
import { OUTLINE_RAIL_COLLAPSED_PX, OUTLINE_RAIL_OPEN_PX } from './ModulePlayerNav'

/**
 * The slide column's two widths.
 *
 * `880` is the Figma composite blocks' own width (file
 * `xhAPgU8I5GzG9UDPHqJrnj`, canvas `2577:19500`) — the width the blocks
 * were drawn at, and what the column uses while the outline rail is open.
 *
 * Collapsing the rail hands back exactly `330 - 76 = 254px`, and the column
 * takes all of it. **Derived from the rail's own constants rather than
 * written as `1134`**: the two numbers have to move together, and this
 * project has already shipped one bug from a hardcoded offset that stopped
 * matching a collapsible rail (Round 33's footer, 127px off centre). If the
 * rail is ever resized, the column follows on its own.
 */
export const SLIDE_COLUMN_OPEN_PX = 880
export const SLIDE_COLUMN_COLLAPSED_PX =
  SLIDE_COLUMN_OPEN_PX + (OUTLINE_RAIL_OPEN_PX - OUTLINE_RAIL_COLLAPSED_PX)

/**
 * The shell for one `module.md` slide: the centred content column, the
 * slide's blocks stacked in source order, and focus management.
 *
 * Replaced `SlideLayout`, the player's old eyebrow/title/body chassis, which
 * assumed a screen whose heading the *player* supplied; here the heading is
 * authored content inside whichever block happens to come first (a `<Text
 * block_2>` label+title, a `<Chapter intro block>` chapter title, sometimes
 * just a `<Text block _Sub title>` line on a transition slide).
 *
 * `SlideLayout` was kept for a while for the two shell steps with no module.md
 * slide behind them — feedback and complete — and **was deleted on 2026-09-18**
 * once both of those grew their own content and moved onto this file's own
 * column geometry, leaving it at zero callers.
 *
 * ## Width
 * 880px, not the old 656px. The Figma block components are 879px
 * wide and these blocks are substantially denser than the screens the
 * narrower column was measured for (frame `665:1013`) — a 17-chip skills
 * list or a three-up quote row does not fit 656px without wrapping into a
 * column of slivers.
 *
 * ## Focus
 * Focus moves to the slide's own first heading on every slide change, not
 * to `<body>`. The player swaps one slide for another, so the control that
 * triggered the change (the footer's Next) survives — but a screen-reader
 * user would otherwise get no signal that the whole screen just changed.
 *
 * The heading is located by a `data-slide-heading` attribute rather than a
 * ref threaded through every block component: which block carries the
 * heading varies by slide, and a ref chain through a discriminated union of
 * ten block types would have to be re-plumbed every time a block is added.
 * The query runs against **this slide's own subtree**, never the document,
 * so it cannot pick up a heading belonging to anything else on the page.
 */
export function BlockSlide({
  slide,
  railOpen = true,
  scrollSatisfied = true,
  onGateChange,
}: {
  slide: Slide
  railOpen?: boolean
  /** The scroll half of this slide's gate, measured by the player against
   *  `<main>` (the element that actually scrolls). See `slideGate.tsx`. */
  scrollSatisfied?: boolean
  /** Reports this slide's combined readiness up to the footer. Absent when a
   *  slide is rendered outside the player. */
  onGateChange?: (state: SlideGateState) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  /**
   * The line that introduces a video is not rendered.
   *
   * Direct instruction, 2026-09-17, against two annotated slides: *"hide this
   * block, we have already marked this as repetitive in module master
   * online."* Both were the italic `sub-title` sitting directly above a video
   * — "Now let's watch a video to learn more about the Good Sleep Recipe", and
   * "Now you'll watch a video of the coach explaining..." — which say, in
   * prose, what the video below them already says by being a video.
   *
   * ⚠️ The rule is **structural, not "hide mid-slide sub-titles"**, and that
   * distinction is load-bearing. `sub-title` has three jobs: a transition beat
   * when it is alone on a slide, this video lead-in, and the hand-off line
   * that closes a slide. Slides 4 and 12 carry the video lead-in *and* a
   * closing hand-off, and only the first was marked — a blanket rule would
   * silently drop authored copy that nobody asked to lose.
   *
   * Read off the block order rather than a new data field, the same way
   * `isTransitionSlide` below reads the shape: the position *is* the
   * definition, and a flag in the data could disagree with it. module.md is
   * read-only, so the source keeps the line either way; this only stops it
   * rendering.
   */
  const blocks = slide.blocks.filter(
    (block, i) => !(block.tag === 'sub-title' && slide.blocks[i + 1]?.tag === 'video'),
  )

  // A transition slide is one `sub-title` block and nothing else — the same
  // condition the renderer uses (`isOnly` in its `sub-title` case) to decide
  // between the centred glyph-over-line beat and the plain italic line that
  // tag draws mid-slide. Read the tag here rather than adding a flag to the
  // data: the shape *is* the definition, and a second field could disagree
  // with it.
  const isTransitionSlide = blocks.length === 1 && blocks[0].tag === 'sub-title'

  useEffect(() => {
    const heading = rootRef.current?.querySelector<HTMLElement>('[data-slide-heading]')
    heading?.focus()
  }, [slide.id])

  // Defaults to ready when no handler is wired, so a slide rendered outside the
  // player (a preview, a Figma mirror) is never stuck behind a gate with no
  // footer to unlock.
  const noop = (_state: SlideGateState) => {}

  return (
    <SlideGateProvider
      // Keyed, so React discards this slide's gate state and rebuilds it rather
      // than an effect clearing it — see the warning in `SlideGateProvider`.
      key={slide.id}
      slideId={slide.id}
      /**
       * **A transition slide is never gated** (direct instruction, 2026-09-18:
       * *"transition slides should not be affected by these gates, the button
       * stays activated"*).
       *
       * It is a beat between sections — one short line and a glyph, centred in
       * the column — not a page of content. There is nothing to read to the end
       * of and nothing to answer, so asking for either would be a lock with no
       * key. It also cannot overflow, which is the same property that lets it
       * centre itself vertically where every other slide top-anchors.
       *
       * Declared here rather than in the gate: `isTransitionSlide` is read off
       * the block shape a few lines above, and the shape *is* the definition —
       * a flag in the data could disagree with it.
       */
      scrollSatisfied={isTransitionSlide || scrollSatisfied}
      onStateChange={onGateChange ?? noop}
    >
    <div
      ref={rootRef}
      // Vertical only (direct instruction, 2026-09-16: "remove all side
      // paddings, no longer needed"). The column briefly carried 40px on all
      // four sides; now every block owns its own 40px inset and the blocks
      // that deliberately bleed — the outro's photo band — cancel exactly that
      // one inset, so a second horizontal margin here only narrowed the
      // content for no gain.
      // 40px top on EVERY slide, banner-led or not (direct instruction,
      // reversing the same session's earlier "a slide starting with a banner
      // should have no top padding"). Seen side by side, the exception read as
      // the two kinds of slide being misaligned rather than as the image
      // meeting the edge deliberately; the opening-topics slide is the
      // reference and everything now matches it.
      className="mx-auto flex h-full w-full flex-col py-10 transition-[max-width] duration-200 ease-out"
      // Matches the rail's own 200ms ease-out collapse, so the column grows
      // in step with it rather than snapping to its new width first.
      style={{ maxWidth: railOpen ? SLIDE_COLUMN_OPEN_PX : SLIDE_COLUMN_COLLAPSED_PX }}
    >
      {/* Round 47, direct instruction: **every slide anchors to the same top
          point.** This was `my-auto`, which vertically centred a slide that fit
          — so a short slide (a transition line) sat mid-column while a long one
          started at the top, and the first block landed at a different y on
          almost every slide.

          `my-auto` was chosen originally because centred *flex* content pushes
          the top of an over-tall slide out of reach of the scroll container.
          `mb-auto` keeps that property — it still pins to the top and lets the
          remaining space fall below — without the centring. Alignment *inside*
          a block is untouched: the transition slide is still centred, because
          its own block centres its text.

          **One exception, direct instruction 2026-09-16: a transition slide
          centres vertically.** It is a beat between sections rather than a
          page of content — one short line and a glyph, with nothing above or
          below it to line up against — so the top-anchoring that keeps every
          other slide's first block at the same y buys nothing here and leaves
          the line stranded under a tall empty column. `my-auto` is safe on
          this one slide type precisely because it can never overflow: a
          `sub-title` alone is a few lines at most, so the "centred flex
          content pushes the top out of scroll reach" failure above cannot
          occur. `isTransitionSlide` keeps the rule readable at the one place
          that decides it. */}
      <div className={cn('w-full space-y-10', isTransitionSlide ? 'my-auto' : 'mb-auto')}>
        {blocks.map((block, i) => {
          const view = (
            <BlockView
              block={block}
              isFirst={i === 0}
              isOnly={blocks.length === 1}
            />
          )

          // A compound block draws its own boxes — it is one module.md tag
          // rendering as more than one block. The fragment is load-bearing:
          // it adds no DOM node, so the renderer's boxes land as direct
          // children of the `space-y-10` column above and get the same 40px
          // gap every other block pair gets.
          return COMPOUND_BLOCK_TAGS.has(block.tag) ? (
            <Fragment key={i}>{view}</Fragment>
          ) : (
            // Each block owns its spacing: 40px on all four sides, with a
            // 40px gap between blocks (`space-y-10` above). Blocks used to
            // carry no padding at all — every seam was one uniform 24px gap,
            // identical whether a heading met a paragraph or a video met an
            // interactive.
            <BlockBox key={i} className={cn(NO_VERTICAL_PADDING_BLOCK_TAGS.has(block.tag) && 'py-0')}>
              {view}
            </BlockBox>
          )
        })}

        {/* A trailing empty block on EVERY slide (direct instruction,
            2026-09-18: *"for each slide, add an empty block (~40px) no top
            bottom padding. Always add this at last"*).

            40px of its own with `py-0`, and the column's `space-y-10` puts
            another 40px in front of it, so a slide closes on 80px of negative
            space rather than running its last block into the 84px footer.

            It lives here rather than as a block appended to all 30 slides in
            `moduleContent.ts` for two reasons: it is template chrome, not
            authored content — module.md has no row for it, the same way the
            chapter intro's second lead line and the transition glyph are
            build-side — and putting it here means a slide added later cannot
            forget it.

            `BlockBox` rather than a bare `div` so it shows up as a block under
            `DEBUG_BLOCK_OUTLINES`, which is exactly when someone would want to
            see a spacer. Empty, so it contributes nothing to the a11y tree. */}
        <BlockBox tail className="h-10 py-0" />
      </div>
    </div>
    </SlideGateProvider>
  )
}
