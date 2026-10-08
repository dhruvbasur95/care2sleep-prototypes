import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The shell every `<Interactive block>` shares, whatever interaction sits
 * inside it.
 *
 * Direct instruction, 2026-09-17:
 *
 * ```
 * Interactive block container
 *   Title  <use subtitle text block>
 *   <24px space>          <- given as 16, revised to 24 the same day
 *   <independent interactive components>
 * ```
 *
 * ## Why the container exists at all
 * The interaction inside it *"will keep changing"* — flip cards today, You
 * Might Also Hear and Your turn later, and more after that. Only two things are
 * constant: a title at the Sub title role, and 24px beneath it. Putting those
 * here rather than in each interaction is what stops the three patterns drifting
 * into three different headers, which is the failure this project keeps
 * extracting components to avoid.
 *
 * ## The background is the interaction's call, not the container's
 * Also instruction: *"depending on the nature of interactive component the
 * parent container of interactive block may or may not have a background."* So
 * `surface` is opt-in and defaults to none. Flip cards pass none — they are
 * strongly coloured objects, and a tint behind them would be a third surface
 * competing with the card faces. A pattern that renders plain controls will
 * want one.
 */
export function InteractiveBlock({
  title,
  surface = 'none',
  surfaceScope = 'block',
  titleId,
  isFirst = false,
  children,
}: {
  title: string
  /** When this block opens its slide, the container's title becomes the
   *  slide's `<h1>` and focus target. Module 6 never hits this — both revision
   *  blocks follow a Know What — but a slide whose first block is interactive
   *  would otherwise have no `[data-slide-heading]` at all, and `BlockSlide`
   *  would drop focus to `<body>`. That is this project's most-repeated defect
   *  class, so it is guarded rather than left to the data. */
  isFirst?: boolean
  /** `panel` draws the `yellow-50` tint the bare stub used; `none` sits on the
   *  page canvas. */
  surface?: 'none' | 'panel'
  /**
   * How much of the block the `panel` tint covers.
   *
   * `block` (the default) tints the title along with the interaction — the flip
   * cards' own arrangement. `content` leaves the title on the page canvas and
   * tints only what sits beneath it: direct instruction, 2026-09-17, *"for
   * mcqs, title goes outside yellow box"*, and it is what the MCQ frames draw —
   * neither of them contains a title at all, because the yellow surface in them
   * starts below it.
   *
   * A prop rather than a second container, because the title, the 24px, and the
   * order are all still exactly the same — only the tint's extent differs, and
   * forking would set the three patterns' headers drifting again, which is the
   * whole reason this container exists.
   */
  surfaceScope?: 'block' | 'content'
  /** So an interaction can point `aria-labelledby` at the container's own
   *  title rather than repeating it in a label. */
  titleId?: string
  children: ReactNode
}) {
  const Title = isFirst ? 'h1' : 'p'

  const panel = surface === 'panel'
  const wholeBlockTinted = panel && surfaceScope === 'block'

  return (
    <div className={cn(wholeBlockTinted && 'rounded-[16px] bg-yellow-50 p-10')}>
      {/* The **Sub title** role — `sub-greeting`, 18/500 — named explicitly in
          the instruction ("use subtitle text block"), so it reads off the same
          step as every other Sub title rather than being sized here.

          `primary` — direct instruction, 2026-09-17: *"all interactive blocks
          sub title will be blue."* A rule about the role in this container, not
          about one block, so it lives here and every interaction inherits it.
          ("Blue" is this project's purple: the same word was used for the
          chapter intro's purple wave earlier the same day, and the portal has
          no blue.)

          A `<p>` unless this block opens its slide: the slide's heading is
          normally the block above this one, and a second heading here would
          compete with it for no gain — the title labels a group of controls,
          which is what `aria-labelledby` on the group is for. */}
      <Title
        id={titleId}
        data-slide-heading={isFirst || undefined}
        tabIndex={isFirst ? -1 : undefined}
        className="text-sub-greeting leading-[1.4] text-primary outline-none"
      >
        {title}
      </Title>
      {/* **24px**, and the only spacing this container owns. The structure was
          first given as `<16px space>` and revised to 24 the same day ("increase
          vertical space between title and interactive container to 24px"), so
          the original 16 is superseded rather than an alternative. */}
      {/* The tint, when it covers only the interaction, carries the same 40px
          inset the whole-block version does. That number belongs to this
          container — a second one per pattern is how a shared shell starts
          drifting. */}
      <div className={cn('mt-6', panel && !wholeBlockTinted && 'rounded-[16px] bg-yellow-50 p-10')}>
        {children}
      </div>
    </div>
  )
}
