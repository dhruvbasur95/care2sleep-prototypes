import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AppHeader } from '@/components/AppHeader'
import { ResearchSidebar } from '@/components/research/ResearchSidebar'
import { cn } from '@/lib/utils'

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

/**
 * Research Dashboard shell (Round 2.1, renamed Round 2.2.1). The dashboard is
 * a hub: global black header + a collapsible left sidebar navigator
 * (`ResearchSidebar`) that moves between the Consumer management / Training
 * Pipeline / Coaches areas and, within Training Pipeline, its working views
 * in pathway order (Recruitment (EOI), Trainee progress).
 *
 * Replaces the Round 2 top program bar + horizontal section tabs + header-level
 * global search. "Program 1 / Program 2" naming is retired; global coach search
 * now lives above the roster table on the Coaches view.
 *
 * **Round 4.1 (Dhruv, UI edit):** added the optional `hero` slot — record
 * pages (Coach Profile, SPACES Coach Profile, Consumer Detail) pass their
 * back-link + name/subtitle + tab row here so it renders in a full-bleed
 * `bg-pearl` band (edge-to-edge across `main`, independent of the page's own
 * centered max-width column) with a `border-hairline` seam. The band has no
 * bottom padding of its own — its bottom edge is the tab row's own bottom
 * edge, so the active tab's underline sits right on the seam. Pages with no
 * `hero` (list/table pages) are unaffected — same padding as before.
 *
 * **Round 6.2.1 (Dhruv, UI fix):** added `heroNoSeam` (mirrors `DeliveryShell`/
 * `ConsumerShell`, which already had it) — for a `hero` with no tab row
 * underneath it (e.g. a plain title+subtitle like the Account page), the
 * tab-seam assumption above left the band's bottom edge flush against the
 * content with zero gap. `heroNoSeam` gives the band its own bottom padding
 * and drops the hairline seam, and the content area regains its normal top
 * padding — same trade as the other two shells' welcome-band pages.
 *
 * `topBanner` — mirrors `ConsumerShell`'s identical slot (its own opted-out
 * banner): pins a page-level alert above the `hero`, `sticky top-12` so it
 * stacks directly under the global header. Used by `CoachProfilePage`'s
 * pending-invite banner — scoped to that one page, not every Research
 * Dashboard page, unlike `ConsumerShell`'s site-wide opted-out banner.
 *
 * **Round 17:** mounts the `sidebar` onboarding tour. It lives here rather
 * than on any one page because it introduces the nav, which is shell-level —
 * and because it must be able to fire on whichever research page the user
 * happens to land on first. Every page-level tour queues behind it.
 *
 * **Round 23 (frame `152:176`):** the horizontal gutter moved `md:px-16`
 * (64px) -> `md:px-20` (80px), on both the hero band and the content column,
 * to match the frame's own 80px content inset. Applied here rather than
 * per-page so every research page moves together — the frame's page structure
 * is shared, and a 16px difference between the trainee record page and the
 * roster it is opened from would read as a misalignment on the way in.
 *
 * Content column width (direct instruction): widened from `max-w-[1100px]`,
 * matching `DeliveryShell`/`ConsumerShell` — see `DeliveryShell`'s own doc
 * comment for the full reasoning. A first pass landed on `1600px`, corrected
 * down to `1536px` after direct feedback that it read as "drastically"
 * reduced, then corrected again — checked specifically on a genuinely wide
 * (1800px+) window — down to **`max-w-[1320px]`** after `1536px` was found
 * to still read as too drastic a change from the original `1100px`. `1320px`
 * is a deliberate middle ground between the too-narrow original and the
 * too-wide first two passes. `topBanner` (`CoachProfilePage`'s pending-invite
 * banner) keeps its own matching-width copy, since it isn't wrapped by this
 * shell's own max-width div.
 *
 * **Round 21 (Figma frame `1:38`, Home page revamp):** two more additive
 * slots, both defaulting to the exact pre-existing behaviour so every other
 * research page renders byte-identically.
 * - `heroClassName` overrides the hero band's own `bg-pearl` surface. The Home
 *   page's Figma frame calls for a tinted welcome band rather than the
 *   near-white pearl every other page uses; passing a class here is a smaller
 *   change than forking the shell or wrapping the page in a second full-bleed
 *   div that would have to re-derive this band's padding and max-width.
 * - `heroBelow` is a second full-bleed band pinned directly under the hero
 *   with **no gap and no seam** — the Home page's Quick Links bar, which the
 *   frame draws as a solid accent strip butted straight against the welcome
 *   band's bottom edge. It deliberately sits outside the `hero` slot rather
 *   than inside it because it needs its own background colour edge-to-edge,
 *   which a child of the tinted hero band cannot have. When `heroBelow` is
 *   passed, the hero band drops its own bottom padding/seam (the strip *is*
 *   the seam) and the content area regains its normal top padding, same trade
 *   `heroNoSeam` already makes.
 */
export function ResearchShell({
  children,
  hero,
  heroNoSeam = false,
  heroClassName,
  heroBelow,
  heroFlushBelow,
  topBanner,
}: {
  children: ReactNode
  hero?: ReactNode
  heroNoSeam?: boolean
  heroClassName?: string
  heroBelow?: ReactNode
  /** Removes the hero's own bottom padding so `heroBelow` sits flush against
   *  it. For a hero that already closes itself (the record pages' tab row);
   *  leave unset for a hero that needs breathing room above the band. */
  heroFlushBelow?: boolean
  topBanner?: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader portal="research" />

      <div className="flex">
        <ResearchSidebar />

        <motion.main
          {...pageMotion}
          id="main-content"
          // Round 28: `tabIndex={-1}` makes this a real programmatic focus
          // target. Needed by the attention hub, which focuses `#main-content`
          // when it hides itself on the last dismiss (its own heading has
          // unmounted by then). It also fixes the pre-existing "Skip to main
          // content" link, which pointed here but could not move focus,
          // because a bare `id` on a non-focusable element does not.
          // `outline-none` so the programmatic focus draws no ring — this is a
          // landing point, not a control.
          tabIndex={-1}
          className="min-w-0 flex-1 outline-none"
        >
          {topBanner && <div className="sticky top-12 z-20">{topBanner}</div>}
          {hero && (
            <div
              className={cn(
                'px-6 pt-16 md:px-20 md:pt-20',
                heroClassName ?? 'bg-pearl',
                /* Round 27: `heroFlushBelow` drops the hero's bottom padding
                   so `heroBelow` sits flush against whatever the hero ends
                   with. The record pages end on their tab row, which already
                   closes the band with its own `pb-3` (Round 23 measured the
                   band at exactly 257px on that basis) — the extra 40px here
                   read as dead space between the tabs and the band below.
                   Opt-in, so Home's own Quick Links bar keeps its gap. */
                heroBelow
                  ? heroFlushBelow
                    ? undefined
                    : 'pb-8 md:pb-10'
                  : heroNoSeam
                    ? 'pb-8 md:pb-10'
                    : 'border-b border-hairline',
              )}
            >
              <div className="mx-auto max-w-[1320px]">{hero}</div>
            </div>
          )}
          {heroBelow}
          <div
            className={cn(
              'px-6 pb-16 md:px-20',
              (!hero || heroNoSeam || heroBelow) &&
                /* Round 27: `heroFlushBelow` also tightens the content's own
                   top inset. The default 80px stacked with `TabIntro`'s 16px
                   for 96px below the band — the frame's content inset is 64px
                   total, so 48px here plus TabIntro's 16px lands on it. */
                (heroFlushBelow ? 'pt-10 md:pt-12' : 'pt-16 md:pt-20'),
            )}
          >
            <div className="mx-auto max-w-[1320px]">{children}</div>
          </div>
        </motion.main>
      </div>

    </div>
  )
}
