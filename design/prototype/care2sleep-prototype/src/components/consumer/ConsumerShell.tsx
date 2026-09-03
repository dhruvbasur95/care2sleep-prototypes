import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'
import { ConsumerHeader } from '@/components/consumer/ConsumerHeader'
import { ConsumerWelcome } from '@/components/consumer/ConsumerWelcome'
import { ScrollCue } from '@/components/consumer/ScrollCue'
import { cn } from '@/lib/utils'

/**
 * Round 41 — has the first-run welcome screen been dismissed this session?
 *
 * Module-scoped rather than `useState` in the shell, and that is load-bearing:
 * every page under `/consumer` mounts its OWN `ConsumerShell`, so a flag stored
 * in component state resets the moment the dyad navigates to Health & Sleep and
 * the welcome flow replays. Round 29 shipped exactly that bug on the coach
 * portal before the same fix was applied there.
 *
 * Deliberately **not persisted** to `localStorage`, matching the trainee flow
 * (`DeliveryShell`, direct instruction, Round 29): this is a prototype under
 * review, and a first-run screen that only ever appears once per browser is a
 * screen nobody can look at twice. The consequence is that a reviewer sees it
 * on every full page load, which is the intended trade, not an oversight.
 */
let welcomeDismissed = false

/** Persistent (no dismiss — unlike `TodaySessionBanner`, this reflects a
 *  standing account state, not a one-time reminder) red banner shown on
 *  every Consumer Portal page once the dyad has opted out (Round 6.2.1).
 *  Takes over the `topBanner` slot entirely, so a stale "session today"
 *  banner can never show alongside it. */
function OptedOutBanner() {
  return (
    <div role="status" className="border-b border-black/10 bg-destructive px-6 py-3 md:px-16">
      <div className="mx-auto flex max-w-[1320px] items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-white" />
        <p className="text-caption font-semibold text-white">
          You've opted out of Care2Sleep. You no longer have access to Zoom session links.
        </p>
      </div>
    </div>
  )
}

const pageMotion = {
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

/**
 * Has the page's own entrance already played this page load?
 *
 * Same latch, same reason, as `ConsumerHeader`'s `navIntroPlayed`: `App.tsx`
 * wraps its `<Routes>` in an `AnimatePresence` keyed on the pathname, so every
 * in-app navigation unmounts and remounts the whole page. That made the greeting
 * block fade and rise again on every tab switch (reported: "this section should
 * not keep on reload, everytime I switch page").
 *
 * The **exit** animation is dropped along with the arrival, and that took a
 * second pass to get right. Suppressing only the arrival still left a visible
 * blink on every tab change ("nor should the header buttons reload"): with
 * `mode="wait"` the incoming page is held back until the outgoing one has
 * finished its 300ms fade, and because the header is inside the page subtree
 * that App remounts, the whole bar — logo, tabs and account controls — was
 * unmounted for that beat and then reappeared. Dropping the exit makes the swap
 * instant, so nothing is ever absent long enough to read as a reload.
 *
 * The proper fix is for the header to live above the animated route swap
 * entirely; that is a change to `App.tsx`'s shared chassis affecting all four
 * portals, so it is flagged rather than taken here.
 *
 * Module-scoped rather than state, because state lives in the component that
 * keeps being thrown away. Resets on a real refresh, which is the intent.
 */
let pageIntroPlayed = false

/**
 * Consumer Portal shell (Round 5) — same hub chassis as `ResearchShell`
 * (global header + collapsible left sidebar + optional full-bleed `hero`
 * band), scoped to this portal's dyad. `accountLabel` threads the signed-in
 * dyad's name into the header's account menu.
 *
 * `heroNoSeam` drops the hero band's bottom `border-hairline` — the Home
 * page's Welcome section (plan §1a) is a deliberate one-off variant of the
 * §17 pearl-band token spec, which otherwise always carries that seam.
 *
 * `topBanner` (Round 5.1) pins page-level alerts (e.g. "session today") to
 * the top of the main column, above the hero — `sticky top-24` stacks it
 * directly under the header (`h-24`/96px since Round 41's `ConsumerHeader`,
 * itself `sticky top-0`), matching the sidebar's own `sticky top-24`. Scoped to `main`'s column, not full
 * page width, so it never overlaps the sidebar.
 *
 * Content column width (direct instruction): widened from `max-w-[1100px]`
 * — same reasoning as `DeliveryShell`/`ResearchShell` (see `DeliveryShell`'s
 * own doc comment): on a wide viewport the old cap left a large, unused
 * gutter on both sides of the centered content regardless of the sidebar's
 * collapsed/expanded width. A first pass landed on `1600px`, corrected down
 * to `1536px` after direct feedback that it read as "drastically" reduced,
 * then corrected again — checked specifically on a genuinely wide (1800px+)
 * window — down to **`max-w-[1320px]`** after `1536px` was found to still
 * read as too drastic a change from the original `1100px`. `1320px` is a
 * deliberate middle ground between the too-narrow original and the too-wide
 * first two passes. `OptedOutBanner` above keeps its own matching-width
 * copy, since it isn't wrapped by this shell's own max-width div.
 */
export function ConsumerShell({
  dyadId,
  accountLabel,
  children,
  hero,
  heroNoSeam = false,
  topBanner,
  contentClassName,
  optedOut,
}: {
  dyadId: string
  accountLabel: string
  children: ReactNode
  hero?: ReactNode
  heroNoSeam?: boolean
  topBanner?: ReactNode
  /**
   * Overrides the content column's own padding and background. Additive — omit
   * it and every other page keeps its insets byte-identical. Deliberately the
   * same name and meaning as `DeliveryShell`'s own slot, which exists for the
   * same reason: Home (frame `761:3170`) has no hero band at all, puts its
   * greeting on the page canvas, and paints its own warm radial background,
   * which is neither of the two states the hero-driven rule below produces.
   */
  contentClassName?: string
  /** Round 6.2.1 — when set, overrides `topBanner` on every page with a
   *  persistent red opted-out notice (a page-specific banner like "session
   *  today" no longer applies once Zoom access is gone). */
  optedOut?: { reason: string; date: string }
}) {
  const [welcomed, setWelcomed] = useState(() => welcomeDismissed)

  const dismissWelcome = useCallback(() => {
    welcomeDismissed = true
    setWelcomed(true)
  }, [])

  // Continue unmounts the control that was clicked, so focus would otherwise
  // fall to `<body>`. `main` carries `tabIndex={-1}` as the deliberate landing
  // spot. An effect rather than `requestAnimationFrame`: rAF is throttled in a
  // background or preview tab, which is what made the same fix fail on the
  // coach portal before Round 30 rewrote it this way.
  useEffect(() => {
    if (welcomed) document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [welcomed])

  // One-way latch, set after the first page render. Not reactive state: nothing
  // re-renders off it, and reading it during render is what decides whether this
  // mount animates at all.
  const playPageIntro = !pageIntroPlayed
  useEffect(() => {
    pageIntroPlayed = true
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <ConsumerHeader dyadId={dyadId} accountLabel={accountLabel} showNav={welcomed} />

      {!welcomed ? (
        // No sidebar, no banners, no hero during the welcome flow — the frame
        // puts the screen alone on the canvas, and a "session today" banner or
        // an opted-out notice above a "Welcome to Care2Sleep" heading would be
        // two contradictory first impressions. Both are standing states and
        // will still be there on the page behind it.
        <main id="main-content" tabIndex={-1} className="min-w-0 outline-none">
          <ConsumerWelcome onContinue={dismissWelcome} />
        </main>
      ) : (
        /* No left sidebar. Round 41 emptied it one instruction at a time —
           Health & Sleep deleted, Home promoted into the header's centred nav,
           My Profile moved into the account menu — and `ConsumerSidebar` was
           deleted rather than left as an empty rail. `ConsumerHeader` is this
           portal's whole navigation now. */
        <div className="flex">
        <motion.main
          {...pageMotion}
          initial={playPageIntro ? { opacity: 0, y: 8 } : false}
          exit={playPageIntro ? { opacity: 0 } : undefined}
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 outline-none"
        >
          {optedOut ? (
            <div className="sticky top-24 z-20">
              <OptedOutBanner />
            </div>
          ) : (
            topBanner && <div className="sticky top-24 z-20">{topBanner}</div>
          )}
          {hero && (
            <div
              className={cn(
                'bg-pearl px-6 pt-16 pb-8 md:px-16 md:pt-20 md:pb-10',
                !heroNoSeam && 'border-b border-hairline',
              )}
            >
              <div className="mx-auto max-w-[1320px]">{hero}</div>
            </div>
          )}
          <div
            className={
              contentClassName ??
              cn('px-6 pb-16 md:px-16', (!hero || heroNoSeam) && 'pt-16 md:pt-20')
            }
          >
            <div className="mx-auto max-w-[1320px]">{children}</div>
          </div>
        </motion.main>
        {/* Self-hiding: it measures the document and renders nothing when there
            is nothing below. Mounted in the shell rather than per page so any
            consumer surface that grows past the fold gets it, and deliberately
            NOT during the welcome flow, which is one CTA on a page that does not
            scroll. */}
        <ScrollCue />
      </div>
      )}
    </div>
  )
}
