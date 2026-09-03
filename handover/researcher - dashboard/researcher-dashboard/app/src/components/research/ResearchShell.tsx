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
 * The page chassis every one of the eight screens mounts: global header,
 * collapsible sidebar, animated `<main>`, and a set of optional full-bleed
 * bands above the content column.
 *
 * ⚠️ EACH PAGE MOUNTS ITS OWN INSTANCE OF THIS SHELL. Anything stored in
 * `useState` here resets on every in-app navigation. State that must survive a
 * route change belongs in the store or in a module-scoped value —
 * `ResearchSidebar`'s collapsed flag uses `localStorage` for exactly this
 * reason.
 *
 * SLOT CONTRACT. All slots are optional and every default reproduces the
 * plain, hero-less list-page layout, so adding one cannot disturb another
 * page. Prefer a new slot here over a page re-deriving this band's padding and
 * max-width itself.
 *
 *   `hero`          Full-bleed band above the content column, edge to edge
 *                   across `<main>` and independent of the page's own centred
 *                   column. Two shapes use it: list pages pass a
 *                   `ResearchPageHero`; record pages pass a back link, name
 *                   and tab row.
 *
 *   `heroClassName` Overrides the band's default `bg-pearl` surface, and can
 *                   also override its padding — `cn()` merges it last. List
 *                   pages pass `bg-purple-50`; record pages pass a purple band
 *                   plus their own tighter top padding.
 *
 *   `heroNoSeam`    For a hero that does NOT end in a tab row. The default
 *                   assumes the band closes on a tab row whose underline sits
 *                   on the hairline seam, so the band has no bottom padding of
 *                   its own. Without `heroNoSeam` a plain title+subtitle hero
 *                   ends up flush against the content with zero gap.
 *
 *   `heroBelow`     A second full-bleed band pinned under the hero with no gap
 *                   and no seam — Home's Quick Actions strip. It sits outside
 *                   `hero` rather than inside it because it needs its own
 *                   edge-to-edge background, which a child of the tinted band
 *                   cannot have.
 *
 *   `heroFlushBelow` Use with `heroBelow` when the hero already closes itself
 *                   (i.e. ends on a tab row). Drops the hero's remaining
 *                   bottom padding and tightens the content's top inset.
 *                   Without it there is visible dead space between the tabs
 *                   and the band below.
 *
 *   `topBanner`     A page-level alert pinned above everything, `sticky top-12`
 *                   so it stacks under the global header. Only
 *                   `CoachProfilePage`'s pending-invite banner uses it. It is
 *                   NOT wrapped by this shell's max-width div, so a caller
 *                   must match the content width itself.
 *
 * ⚠️ The content column's `max-w-[1320px]` and the `md:px-20` gutter are
 * shared by the hero band and the content column deliberately. They must move
 * together, or a record page and the roster it opens from will visibly
 * misalign as you navigate between them.
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
   *  it, and tightens the content's top inset to match. For a hero that
   *  already closes itself on a tab row; leave unset for a hero that needs
   *  breathing room above the band. */
  heroFlushBelow?: boolean
  topBanner?: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="flex">
        <ResearchSidebar />

        <motion.main
          {...pageMotion}
          id="main-content"
          // ⚠️ Do not remove `tabIndex={-1}`. A bare `id` is not a focus
          // target, so without it two things silently break: the header's
          // "Skip to main content" link moves the scroll position but not
          // focus, and `NotificationHubView` has nowhere to send focus when
          // it hides itself on the last dismiss (its own heading has
          // unmounted by then) — focus falls to `<body>`.
          // `outline-none` because this is a landing point, not a control.
          tabIndex={-1}
          className="min-w-0 flex-1 outline-none"
        >
          {topBanner && <div className="sticky top-12 z-20">{topBanner}</div>}
          {hero && (
            <div
              className={cn(
                'px-6 pt-16 md:px-20 md:pt-20',
                /* `heroClassName` is merged after the base classes, so a
                   caller can override the surface *and* the padding. */
                heroClassName ?? 'bg-pearl',
                /* Three mutually exclusive ways the band can close, in
                   priority order: flush against a `heroBelow` strip, with its
                   own bottom padding (`heroNoSeam`), or on a hairline seam
                   that a tab row's underline is expected to sit on. */
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
              /* A hero that closes on a seam supplies its own separation, so
                 the content column adds no top inset in that case. The
                 `heroFlushBelow` value is smaller because `TabIntro` adds its
                 own 16px underneath — the two are sized to sum to the intended
                 inset, so changing one means checking the other. */
              (!hero || heroNoSeam || heroBelow) &&
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
