import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'
import { ConsumerHeader } from '@/components/consumer/ConsumerHeader'
import { ConsumerWelcome } from '@/components/consumer/ConsumerWelcome'
import { ScrollCue } from '@/components/consumer/ScrollCue'
import { ConsumerOnboardingTour } from '@/components/consumer/ConsumerOnboardingTour'
import { ConsumerFooter } from '@/components/consumer/ConsumerFooter'
import { cn } from '@/lib/utils'
import { useTextScale } from '@/data/consumerTextScale'
import {
  closeConsumerOnboarding,
  openConsumerOnboarding,
  useConsumerOnboardingOpen,
} from '@/data/consumerOnboarding'
import { dyadFirstNames } from '@/data/spaces'
import { useResearch } from '@/data/research-context'

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
        <p className="text-body font-semibold text-white">
          You have opted out of Care2Sleep. Someone from the research team will be in touch
          with you.
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
 * the top of the main column, above the hero — sticking at
 * `--consumer-header-h` stacks it
 * directly under the header (`--consumer-header-h`, 72px since Round 47,
 * itself `sticky top-0`), sticking at `--consumer-header-h` like every other
 * header-dependent offset in this portal since Round 47. Scoped to `main`'s column, not full
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
/**
 * The horizontal gutter every full-page consumer surface uses — 24 on a phone,
 * **80** from `md`, which is frame `982:8558`'s own inset and the value Home,
 * My Modules, Need Help and My Profile all already pass in their own
 * `contentClassName`.
 *
 * Exported so `ConsumerFooter` reads the same number rather than transcribing
 * it. The footer is a full-bleed dark band whose *contents* have to line up
 * with the page above it, and the shell's own default (`md:px-16`, 64) is 16px
 * narrower than what those four pages actually use — so a footer built on the
 * shell default would have put the Monash lockup 16px inside every card edge
 * above it, which is exactly the kind of near-miss that reads as a mistake.
 *
 * ⚠️ **The breakpoint is `min-[1200px]`, matching `ConsumerHeader`'s own
 * `px-6 min-[1200px]:px-20`** (direct instruction: "make sure the page footer
 * side padding match the one used in header"). It was `md:` — 768 — so between
 * 768 and 1199 the footer's contents sat 80px in while the header's sat 24px
 * in, a 56px disagreement between the two bands that top and tail every page.
 *
 * The trade, stated rather than hidden: the page *content* on those four pages
 * still switches at `md`, so in that 768-1199 band the footer now lines up with
 * the header instead of with the content above it. Header and footer are the
 * two full-bleed bands and the frame the page sits in, which is why they were
 * chosen as the pair that must agree; moving the content to 1200 as well would
 * be the tidier end state and is a separate change.
 */
export const CONSUMER_PAGE_GUTTER = 'px-6 min-[1200px]:px-20'

export function ConsumerShell({
  dyadId,
  accountLabel,
  children,
  hero,
  heroNoSeam = false,
  topBanner,
  contentClassName,
  optedOut,
  showNav = true,
  showWelcome = true,
  contentFullBleed = false,
  showScrollCue = true,
  showFooter = false,
}: {
  dyadId: string
  accountLabel: string
  children: ReactNode
  hero?: ReactNode
  heroNoSeam?: boolean
  topBanner?: ReactNode
  /**
   * Round 46 — drop the header's Home / My Modules / Need Help nav, leaving the
   * wordmark and Sign Out. Additive and defaulting `true`, so every existing
   * page renders byte-identically.
   *
   * For a flow, not a page: frames `818:12862` and `819:13049` put a module's
   * inner pages on a bare header, the same way the first-run welcome screen
   * already does. That is the right call rather than a frame quirk — a module
   * is something you are *inside*, with its own Go Home and Continue, and
   * leaving the portal tabs up invites a consumer to wander out of a video
   * halfway through with no idea whether their place was kept.
   */
  showNav?: boolean
  /**
   * Round 46 — skip the portal's first-run welcome screen on this page.
   *
   * The welcome is a once-per-session introduction to the *portal*, and the
   * gate lives in this shell, so it fires on whichever consumer page happens to
   * be loaded first. On a module's inner pages that is wrong: a module is a
   * sub-page you can only reach from Home or My Modules, so by the time anyone
   * is here they have already passed the welcome — or they deep-linked, and
   * "Welcome to Care2Sleep" in front of a module they asked for is a non
   * sequitur, which is exactly how it was reported.
   *
   * Opting out does not mark the welcome seen: the flag is untouched, so Home
   * still shows it on the next visit. This page just does not host it.
   */
  showWelcome?: boolean
  /**
   * Round 46 — drop the content column's `max-w-[1320px]` cap so a page can
   * paint edge to edge. Additive and defaulting `false`, so every existing page
   * keeps its cap.
   *
   * The module pages need it because three of their surfaces are full-bleed in
   * the frames — the welcome screen's photo band, the yellow module bar and the
   * white footer — and a bar that stops 128px short of the window on a wide
   * screen reads as a broken layout rather than as a centred one. A page that
   * opts in takes on capping its own *content*: the bars below wrap their rows
   * in the same 1320 + gutter the shell would have applied, which is the
   * pattern `OptedOutBanner` in this file already uses.
   */
  contentFullBleed?: boolean
  /**
   * Round 46 — a page with its own sticky footer must turn the cue off. Both
   * are pinned to the bottom of the viewport, so they overlap: the cue lands on
   * top of the footer's own CTA. The footer already signals that there is more
   * below it, by having content run underneath it.
   */
  showScrollCue?: boolean
  /**
   * The dark site footer (`ConsumerFooter`).
   *
   * ⚠️ **Defaults `false` — opt in, never opt out.** Direct instruction: it
   * shows on Home, My Modules and Need Help only. Three of the portal's six
   * surfaces carry it, so a default of `true` would hand one to every flow
   * built later and each would have to remember to refuse it. See
   * `ConsumerFooter` for why the diary and module flows in particular must not
   * have one.
   */
  showFooter?: boolean
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
  const { scale } = useTextScale()
  const [welcomed, setWelcomed] = useState(() => welcomeDismissed)

  /**
   * A page that opts out of the welcome counts as having passed it.
   *
   * ⚠️ This is a real bug fix, not bookkeeping. `welcomeDismissed` was only
   * ever set by the welcome screen's own Continue, so a reader who finished a
   * module — the module flow passes `showWelcome={false}` — was sent to Home
   * with the flag still `false` and met the first-run welcome screen *again*,
   * after having used the app (reported as "when I complete my module, it
   * should go back to homepage, not welcome page"; the module's own exit was
   * already navigating to Home correctly, which is why this looked like a
   * routing bug and was not one).
   *
   * Written during render rather than in an effect on purpose: the very next
   * thing this component does is read `skipWelcome`, and an effect would run a
   * commit too late — the welcome would paint for a frame on the way past. The
   * write is idempotent and to a module-scoped flag, not to state, so it does
   * not schedule a render.
   */
  if (!showWelcome) welcomeDismissed = true
  // `|| !showWelcome` rather than seeding the state: a page that opts out must
  // not *dismiss* the welcome for the rest of the session, only decline to be
  // the page that shows it.
  const skipWelcome = welcomed || !showWelcome

  const tourOpen = useConsumerOnboardingOpen()

  /**
   * Closing the tour has to put focus somewhere deliberate.
   *
   * ⚠️ Measured, not assumed: without this, finishing or skipping the tour
   * left `document.activeElement` on `<body>` — the control that was clicked
   * unmounts with the modal, and there is no opener to restore focus to,
   * because the tour opens itself off the back of the welcome flow rather than
   * from a button. `main` carries `tabIndex={-1}` as the portal's deliberate
   * landing spot and is where `dismissWelcome` already lands, so the reader
   * ends up in the same place whichever way they leave.
   *
   * This is the defect class this project has shipped in more rounds than any
   * other, which is why it is checked on every new control that unmounts
   * itself.
   */
  const dismissTour = useCallback(() => {
    closeConsumerOnboarding()
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [])
  /* The store, not the seed module — the greeting must read the same record
     every other consumer surface does. */
  const { consumerDyads } = useResearch()
  const tourGreeting = (() => {
    const dyad = consumerDyads.find((d) => d.id === dyadId)
    return dyad ? dyadFirstNames(dyad) : ''
  })()

  /**
   * Finishing the welcome lands on Home, then opens the onboarding tour.
   *
   * ⚠️ **The navigation is the fix for a real bug**, not a flourish. This used
   * to only flip a flag, and flipping a flag merely *uncovers* whatever page
   * the reader happened to enter on — the welcome flow renders over every
   * consumer surface, so arriving on `/consumer/:id/help` and finishing the
   * welcome left you on Help, having just been told "welcome to your
   * dashboard". The trainee portal shipped this exact bug in Round 30 (its
   * final CTA called `onComplete()` with no path and landed on My Learning),
   * and the fix there was the same: name the destination.
   *
   * `replace`, so Back does not walk into the flow that was just completed.
   */
  const navigate = useNavigate()
  const dismissWelcome = useCallback(() => {
    welcomeDismissed = true
    setWelcomed(true)
    navigate(`/consumer/${dyadId}`, { replace: true })
    openConsumerOnboarding()
  }, [navigate, dyadId])

  // Continue unmounts the control that was clicked, so focus would otherwise
  // fall to `<body>`. `main` carries `tabIndex={-1}` as the deliberate landing
  // spot. An effect rather than `requestAnimationFrame`: rAF is throttled in a
  // background or preview tab, which is what made the same fix fail on the
  // coach portal before Round 30 rewrote it this way.
  useEffect(() => {
    /*
      ⚠️ `&& !tourOpen` — measured, not assumed. The welcome's handover both
      opens the tour and flips `welcomed` in one go, so this effect ran a commit
      AFTER the modal had mounted and focused its own heading, and pulled focus
      straight back out to `main`. The tour then opened with
      `document.activeElement` outside its own dialog, which means Tab reaches
      the page behind the dim and Escape does nothing — Round 32's Critical on
      the coach portal's tour, arrived at by a different route.

      When the tour is up it owns focus; this effect is only responsible for the
      case where the welcome closes onto a bare page.
    */
    if (welcomed && !tourOpen) {
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }
  }, [welcomed, tourOpen])

  // One-way latch, set after the first page render. Not reactive state: nothing
  // re-renders off it, and reading it during render is what decides whether this
  // mount animates at all.
  const playPageIntro = !pageIntroPlayed
  useEffect(() => {
    pageIntroPlayed = true
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* `welcomed &&` still gates it: the first-run welcome screen has no nav
          either, and a page that opts out must not be able to turn it back on
          while that screen is up. */}
      <ConsumerHeader
        dyadId={dyadId}
        accountLabel={accountLabel}
        /*
          Round 48, direct instruction: "the home and my module buttons are also
          missing" — on the first-run welcome screen, which used to pass
          `skipWelcome && showNav` and so hid the tabs there.

          That reverses the earlier reasoning ("a nav row above it offers three
          ways out of a screen whose whole job is the one button"), and the
          reversal is right for a second reason the original did not know about:
          the header bar is now a `1fr auto 1fr` grid, and with the nav absent
          there are only two children, so the account cluster fell into the
          MIDDLE track and floated mid-bar instead of sitting at the right edge.
          Hiding the nav had become a layout bug as well as a navigation choice.

          `showNav` itself is untouched, so a caller that genuinely wants no tabs
          (the module flow's inner pages) still gets none.
        */
        /*
         * ⚠️ `skipWelcome &&` — Round 49, direct instruction: "home and module
         * page should be hidden when its welcome journey". This restores the
         * gate Round 48 removed, and the reason Round 48 removed it is now
         * fixed at the header instead: hiding the nav used to collapse the
         * bar's `1fr auto 1fr` grid to two children and float the account
         * cluster mid-bar, so `ConsumerHeader` now holds the middle track open
         * explicitly. The navigation argument and the layout bug were two
         * separate things wearing one flag.
         *
         * `showNav` itself is untouched, so a page that genuinely wants no tabs
         * (the module flow's inner pages) still gets none either way.
         */
        showNav={skipWelcome && showNav}
      />

      {!skipWelcome ? (
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
          /*
            The accessibility menu's text scale, applied to the page and NOT to
            the header.

            ── Why `zoom` and not a font-size ──────────────────────────────
            This portal sizes type in literal px in most places (the transcript
            at 24, the module bar, the diary fields). Scaling a root `font-size`
            only moves `rem`-based steps, so a reader who pressed "Increase
            Text" would watch half the page grow and half of it stay put, which
            reads as broken rather than as an accessibility feature. `zoom`
            scales everything the box contains, so the result is honest.

            The trade, stated rather than hidden: `zoom` scales layout as well
            as text, so this is closer to a page magnifier than to a pure text
            resize. That is the right call for THIS audience — a carer who
            cannot read the diary does not want a reflowed column, they want it
            bigger — but it is not what WCAG 1.4.4 means by resizing text, and
            it is why the store's own doc says this maps to no spec.

            Scoped to `main` so the header, and therefore the menu itself, holds
            still while it is being used. A control that grows under the finger
            pressing it is its own usability problem.
          */
          style={{ zoom: scale }}
        >
          {optedOut ? (
            <div className="sticky top-[var(--consumer-chrome-h)] z-20">
              <OptedOutBanner />
            </div>
          ) : (
            topBanner && <div className="sticky top-[var(--consumer-chrome-h)] z-20">{topBanner}</div>
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
            {contentFullBleed ? children : <div className="mx-auto max-w-[1320px]">{children}</div>}
          </div>
          {/* Inside `<main>`, deliberately, so the accessibility text-scale
              `zoom` reaches it: the acknowledgement is readable copy, not
              chrome, and a footer that stayed at 100% while the page around it
              grew would become the hardest thing on the page to read at the
              exact moment someone asked for bigger text. The header is the only
              thing that holds still, because the control doing the scaling
              lives in it. */}
          {showFooter && <ConsumerFooter />}
        </motion.main>
        {/* Self-hiding: it measures the document and renders nothing when there
            is nothing below. Mounted in the shell rather than per page so any
            consumer surface that grows past the fold gets it, and deliberately
            NOT during the welcome flow, which is one CTA on a page that does not
            scroll. */}
        {/* ⚠️ `&& !tourOpen` — direct instruction: "make sure scroll to see
            more does not activate at this stage". The tour locks the page
            behind it, so a cue inviting a reader to scroll a page that cannot
            move is an affordance that does nothing. It also sits at the bottom
            of the viewport, which is exactly where the modal's own footer is. */}
        {showScrollCue && !tourOpen && <ScrollCue />}

        {/* The first-run onboarding tour, opened by the welcome flow's handover
            above. Mounted in the shell rather than on Home so it survives being
            navigated to — and so it is one modal for the portal rather than one
            per page. Its open state is module-scoped for the same reason; see
            `data/consumerOnboarding`. */}
        <ConsumerOnboardingTour
          open={tourOpen}
          greeting={tourGreeting}
          onClose={dismissTour}
        />
      </div>
      )}
    </div>
  )
}
