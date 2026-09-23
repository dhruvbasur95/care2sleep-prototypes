import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Image as ImageIcon } from 'lucide-react'
import type { AccordionImageItem } from '@/data/moduleContent'
import { cn } from '@/lib/utils'
import { BlockBox } from './BlockBox'

/**
 * `<Accordion with image block>` — Figma `2697:25053`, *"Accordion with image
 * block <no top bottom padding>"*.
 *
 * A run of `<Text block_3>` items (Sub-title + Body) presented as one
 * single-open accordion with a per-item image, instead of as a stack of
 * paragraphs. Chapter 3's Know What slide is its first caller: four strategies
 * that are a list by nature, and read as a wall of prose when stacked.
 *
 * ## The frame's own numbers
 * 40px side padding and **no vertical padding** — the tag name says so, and
 * `BlockBox`'s `py-0` is what delivers it. The frame's 8px radius and 1px
 * `parchment` stroke are **deliberately not built** (direct instruction,
 * *"remove outline stroke from thos block"*): the block sits open on the page
 * canvas like every other one, and it was the only bordered block in the
 * player. Rows are 16px apart; a row is an 8px gap between the number and the
 * title; title to body is 8px. The number is `sub-greeting` in `--primary`, the
 * title `title` (20/500/1.4), the body `body` (16/400/1.5) in `ink-muted`. The
 * rule between rows is `hairline`.
 *
 * The one place this deliberately diverges: the frame's number badges hug their
 * own digits (29/31/32px for 01/02/03), which staggers the titles by up to 3px.
 * A fixed 29px well keeps every title on one left edge. That is a flaw in the
 * frame rather than an intent — nothing else in this player staggers a list.
 *
 * ## Where the image lives
 * **Inside the open drawer, after the body** — to its right on desktop, beneath
 * it once stacked. Settled by instruction after two rejected alternatives, both
 * recorded because the reasoning is the reusable part:
 *
 * 1. A pane locked to the block's top-right corner, cross-fading as drawers
 *    opened (the original frame). Replaced by *"lets not keep the image fixed,
 *    lets move it inside accordion on right"*.
 * 2. The image beside the title **and** body together, `self-stretch` so the
 *    text set its height (a later frame revision). Replaced by *"revert back to
 *    previous version where image was stacked after body"*.
 *
 * The consequence worth knowing: the image is revealed by opening a drawer, so
 * a closed row is a plain numbered line. That is the standard pattern for an
 * image-per-item accordion, and it is what makes one image per item legible — a
 * locked pane has to be read against whichever row happens to be open, where an
 * in-drawer image is unambiguously about the row it sits in.
 *
 * ## Why the breakpoint is 1060px
 * Direct instruction: *"I only want the responsiveness on tablets and
 * mobiles"* — desktop keeps the side-by-side, full stop. So this is a
 * **viewport** query rather than a container query keyed on the block's width.
 *
 * 1060 rather than the conventional 1024, and the extra 36px is load-bearing.
 * The outline rail mounts from 1024px up and takes 330px, so the slide column
 * measures a *narrower* 614px at a 1024px viewport than the 720px it gets at
 * 768px. At 1024 the split would leave a ~130px text column — measured, not
 * estimated. The first viewport where the column reaches its full 880-900px is
 * ~1056. Putting the line at 1060 means iPad Pro landscape (1024) stacks, which
 * is also the correct reading of "tablets": it is a tablet.
 *
 * ## Concealment
 * A closed drawer **unmounts** rather than animating to `height: 0`. Animated
 * zero height hides content visually only — it stays focusable and in the
 * accessibility tree unless it also gets `inert` — which is a standing rule in
 * this project after Round 20 shipped 11 invisible tab stops that way.
 */

/** The number well. Fixed so every title shares one left edge; see above. */
const NUMBER_WELL_PX = 29
/** Number well + the row's own 8px gap — the indent the drawer hangs on. */
const DRAWER_INDENT_PX = NUMBER_WELL_PX + 8

/**
 * The drawer's body/image split: **60/40** (direct instruction).
 *
 * Expressed as flex grow weights on a zero basis rather than percentage widths,
 * so the 40px gap comes off the top and the two columns then split what is
 * actually left — `basis-[60%]`/`basis-[40%]` would total 100% *plus* the gap
 * and overflow the row.
 *
 * Proportional rather than fixed, so it holds at both column widths: at the
 * standard 880 column the drawer row is 763px (content less the 37px indent),
 * giving body 434 / image 289; with the outline rail collapsed the column is
 * 1134 and the row 1017, giving body 586 / image 391.
 */
const BODY_GROW = 3
const IMAGE_GROW = 2

/**
 * The image's aspect — the frame's own `576.5/398` (1.449:1 landscape).
 *
 * **This supersedes the original "image block to be portrait".** The ratio is
 * what settled it rather than a preference: once the width is a percentage of
 * the row, a tall aspect necessarily drives the drawer's height, and 3:4 put a
 * ~520px-wide image at ~693 tall against a ~270px body — reported as *"image
 * height reduce, its proportionally incorrect"* against a screenshot of exactly
 * that. At 1.449 the image lands ~112px shorter than the longest body here, so
 * the copy sets the drawer's height and no dead space opens beneath it.
 */
const IMAGE_ASPECT = '576.5 / 398'

/**
 * Item 1 open on arrival — direct instruction, *"make sure the first one is
 * always open by default"*, which reverses an earlier *"always show them
 * collapsed"*. The frame draws 01 expanded too, and since the image only exists
 * inside a drawer, an all-closed default would open the block on no artwork.
 */
const FIRST_OPEN = 0

/** No drawer open. Reachable by clicking the open row's own title, which is the
 *  other half of "the title is the control". */
const NONE_OPEN = -1

export function AccordionWithImage({ items }: { items: AccordionImageItem[] }) {
  // One index, not a set of booleans — single-open is then true by
  // construction, so "when I select next, the previous collapses" cannot drift
  // into a second state that disagrees with it.
  const [openIndex, setOpenIndex] = useState(FIRST_OPEN)
  /**
   * **Not gated** (direct instruction, 2026-09-18: *"only where user needs to
   * answer questions, add the gate, rest scroll based"*). Opening a drawer is
   * navigation through prose, not an answer, so this slide rides its scroll
   * gate like any other reading slide.
   */
  const reduceMotion = useReducedMotion()
  const baseId = useId()

  const ease = [0.4, 0, 0.2, 1] as const
  // 280ms sits inside the 200-300ms band the accordion literature converges on,
  // and matches the outline rail's own chapter expand so the two do not read as
  // different mechanisms. Symmetric curve: an asymmetric one is most of what
  // reads as "springy".
  const drawer = reduceMotion ? { duration: 0 } : { duration: 0.28, ease }

  return (
    <BlockBox className="flex flex-col gap-4 py-0">
      {items.map((item, i) => {
        const open = i === openIndex
        const panelId = `${baseId}-panel-${i}`
        const buttonId = `${baseId}-button-${i}`

        return (
          // `min-w-0`: a flex item defaults to `min-width: auto`, so one long
          // word in a body would size the track instead of wrapping inside it.
          // This project has shipped a real horizontal page scroll from exactly
          // that omission three times.
          <div key={i} className="min-w-0">
            {/* Heading level: the slide's `<h1>` is the Know What block's own
                title, so these are its sections. The button is inside the
                heading rather than around it — the accessible-accordion
                contract. */}
            <h2 className="min-w-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? NONE_OPEN : i)}
                // The whole row is the target, number included: the title is
                // the only affordance here (no chevron, by instruction), so it
                // has to be an obviously large one — and this portal's audience
                // is explicitly not a digitally literate one.
                //
                // One hover treatment, all purple (direct instruction,
                // *"streamline hover state, color, it should be purple"*): a
                // `purple-50` wash with the number and title both going
                // `primary`. Two channels rather than a tint alone, because a
                // wash at this canvas's opacity composites to a handful of
                // levels per channel — present in the DOM, invisible on screen,
                // and reported as "no hover state". Measured: title and number
                // on the wash are 10.43:1.
                className={cn(
                  'group flex w-full min-w-0 items-start gap-2 rounded-xs py-1 text-left',
                  'transition-colors duration-150',
                  'hover:bg-purple-50',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                )}
              >
                {/* `leading-[28px]`, and it is the whole alignment fix
                    (instruction: *"numbers and titles should horizontally
                    align"*). The number is 18px and the title 20px, so at a
                    shared 1.4 ratio their line boxes are 25.2px and 28px; under
                    `items-start` the two boxes' tops line up and the glyphs
                    inside them therefore do not. The frame has the same defect,
                    made worse there by a `p-[4px]` that pushed the number down
                    another 4px — dropped here.

                    Matching the number's line box to the title's centres both
                    glyphs in the same 28px band. Done this way rather than with
                    `items-center` on the row, because a title that wrapped to
                    two lines would then centre the number against *both* lines
                    instead of sitting on the first. */}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-center text-sub-greeting leading-[28px] text-primary"
                  style={{ width: NUMBER_WELL_PX }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 text-title leading-[1.4] transition-colors duration-150',
                    'group-hover:text-primary',
                    open ? 'text-primary' : 'text-ink-muted',
                  )}
                >
                  {item.subtitle}
                </span>
              </button>
            </h2>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={drawer}
                  className="overflow-hidden"
                >
                  {/* Hangs under the title, not the number — the frame's own
                      alignment. The 8px top gap is the frame's title-to-body. */}
                  <div
                    className={cn(
                      'flex flex-col gap-6 pt-2',
                      'min-[1060px]:flex-row min-[1060px]:items-start min-[1060px]:gap-10',
                    )}
                    style={{ paddingLeft: DRAWER_INDENT_PX }}
                  >
                    <p
                      className="min-w-0 basis-0 text-body text-ink-muted"
                      style={{ flexGrow: BODY_GROW }}
                    >
                      {item.body}
                    </p>

                    {/* Below 1060 the row is `flex-col`, where the grow weights
                        have no proportion to divide — the image simply takes
                        its own width under the body, which is what the stacked
                        layout wants. */}
                    <div
                      aria-hidden="true"
                      className="min-w-0 basis-0"
                      style={{ flexGrow: IMAGE_GROW }}
                    >
                      {/* Real per-item artwork from 2026-09-18, cut to the
                          frame's own `IMAGE_ASPECT`. The placeholder below is
                          kept for any row with no `image` — chapter 2's
                          accordion has none — and still carries the row number,
                          because four identical grey rectangles would give
                          nothing to verify per-item wiring against. */}
                      {item.image ? (
                        <img
                          src={`${import.meta.env.BASE_URL}illustrations/module/accordion/${item.image}.webp`}
                          alt=""
                          aria-hidden="true"
                          className="block w-full rounded-md object-cover"
                          style={{ aspectRatio: IMAGE_ASPECT }}
                        />
                      ) : (
                        <div
                          className="flex w-full flex-col items-center justify-center gap-2 rounded-md bg-parchment"
                          style={{ aspectRatio: IMAGE_ASPECT }}
                        >
                          <ImageIcon aria-hidden="true" className="size-8 text-ink-faint" />
                          <span className="text-caption text-ink-faint">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* A rule after EVERY row, the last one included (direct
                instruction, *"add stroke after last one also"* — the frame
                draws none after 03). Rendered as the row's own trailing element
                with `mt-4` rather than as a sibling of the rows, so the
                column's 16px gap lands symmetrically either side of it and the
                closing rule cannot end up flush against the block's edge. */}
            <div className="mt-4 h-px w-full bg-hairline" aria-hidden="true" />
          </div>
        )
      })}
    </BlockBox>
  )
}
