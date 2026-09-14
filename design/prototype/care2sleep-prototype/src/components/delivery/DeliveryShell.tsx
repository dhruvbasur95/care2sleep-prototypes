import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AppHeader } from '@/components/AppHeader'
import { DeliveryOnboarding } from '@/components/delivery/DeliveryOnboarding'
import { DeliverySidebar } from '@/components/delivery/DeliverySidebar'
import { CoachStageSwitcher } from '@/components/delivery/CoachStageSwitcher'
import { useCoachStage } from '@/data/coachStage'
import { startDeliveryTour } from '@/data/deliveryTour'
import { cn } from '@/lib/utils'

/**
 * Onboarding is deliberately **not persisted** (direct instruction, Round 29):
 * every refresh of the Coach Delivery Portal lands on the welcome flow again.
 * Completing or skipping it reveals the portal for the rest of the session
 * only. This is a demo affordance — the flow is the thing being reviewed, and
 * a `localStorage` flag would make it a one-shot that has to be cleared by
 * hand between looks. A real first-run gate would store a flag here (and key
 * it to the coach, not the browser).
 *
 * Module scope, not component state, and that distinction is load-bearing:
 * every page under `/delivery` mounts its **own** `DeliveryShell`, so once the
 * final CTA started routing to `/delivery/learning` a plain `useState` meant
 * the destination page mounted a fresh shell, read `false`, and replayed the
 * whole welcome flow. A module-level flag survives in-app navigation and still
 * resets on a real page load, which is exactly the intended behaviour.
 */
let onboardingDismissed = false

/**
 * The dashboard's arrival, in seconds after the welcome flow has unmounted.
 *
 * The sidebar and the page body share one delay so the nav and the hero land
 * together rather than the nav appearing on its own — it was arriving the
 * instant `showOnboarding` flipped, i.e. while the welcome flow was still on
 * screen fading out.
 */
const PAGE_REVEAL_DELAY_S = 0.3
/** Reduced motion's equivalent: just past the 0.18s wrapper fade above. */
const REDUCED_REVEAL_DELAY_S = 0.12
const SIDEBAR_REVEAL_DELAY_S = PAGE_REVEAL_DELAY_S

/**
 * How long after the welcome flow's final CTA the first-run tour opens.
 *
 * It has to clear the whole handoff: the tour measures the elements it points
 * at, and measuring them mid-fade — while `motion.div` still has a `transform`
 * on the page — is how a coachmark ends up beside where its anchor *was*.
 *
 * This clock starts when the welcome flow calls back, which is already `EXIT_MS`
 * after the click — the flow plays its own exit first. From here the body is the
 * last thing to arrive: `PAGE_REVEAL_DELAY_S` plus one 0.16s stagger plus the
 * 0.85s reveal, ending at 1.31s. Two frames past that.
 *
 * It was 590ms when the handoff was a plain 0.4s/0.55s crossfade. Every number
 * it depends on has since changed, so it is written as the sum rather than a
 * literal — left alone it would open the tour while the dashboard is still
 * rising, and a coachmark measured mid-transform lands beside its anchor.
 */
const TOUR_START_DELAY_MS = (PAGE_REVEAL_DELAY_S + 0.16 + 0.85) * 1000 + 40

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

/**
 * Coach Delivery Portal shell (Round 6.1) — same hub chassis as
 * `ResearchShell`/`ConsumerShell` (global header + collapsible left sidebar
 * + optional full-bleed `hero` band). `accountLabel` threads the signed-in
 * coach's name (Helen Zhang, per the round's resolved Decision 2) into the
 * header's account menu.
 *
 * Content column width (direct instruction): widened from `max-w-[1100px]`
 * — on a wide viewport, `main`'s own `flex-1` width (viewport minus the
 * sidebar's fixed 64px/240px) left a large, unused gutter on both sides of
 * the centered content at the old cap, regardless of whether the sidebar
 * was collapsed or expanded (this cap sits *inside* `main`, entirely
 * independent of the sidebar's own width). A first pass landed on `1600px`
 * and was corrected down to `1536px` (Tailwind's standard `2xl` value) after
 * direct feedback that it read as "drastically" reduced. A second round of
 * feedback, checked specifically on a genuinely wide (1800px+) window,
 * found `1536px` *still* read as too drastic a change from the original
 * `1100px` — landed on **`max-w-[1320px]`**, a deliberate middle ground
 * between the too-narrow original and the too-wide first two passes, wide
 * enough to meaningfully reduce the old gutter without eliminating it.
 * `ResearchShell`/`ConsumerShell` carry the identical value — keep all
 * three in sync if this ever changes again.
 *
 * **Round 29 (Figma `369:6442`) — coach portal only.** The sidebar is now a
 * floating card rather than a flush panel, so this shell owns the inset that
 * makes it float. Frame `542:1597` sets the columns at its own 1281px width:
 * 24 (left) + 200 (sidebar) + 48 (gap) + 961 (content) + 48 (right).
 * `ResearchShell`/`ConsumerShell` keep the old flush chassis — this is the
 * first deliberate divergence between the three.
 *
 * It also owns the **first-run onboarding gate**. While onboarding is
 * unfinished the shell renders `DeliveryOnboarding` in place of `children` and
 * suppresses `AppHeader` entirely — that suppression is why the shell frame is
 * drawn without a header. Both come back the moment the flow is completed or
 * skipped. Per direct instruction this round, finishing lands on whatever page
 * the coach is already on (the default Home in practice) rather than routing
 * anywhere new.
 */
export function DeliveryShell({
  accountLabel,
  children,
  hero,
  heroNoSeam = false,
  heroFlushBelow = false,
  heroClassName,
  contentClassName,
}: {
  accountLabel: string
  children: ReactNode
  hero?: ReactNode
  heroNoSeam?: boolean
  /** Overrides the hero band's own `bg-pearl` surface, same as `ResearchShell`. */
  heroClassName?: string
  /**
   * Overrides the content column's own vertical inset. Additive — omit it and
   * every other page keeps the insets below byte-identical. Trainee Home uses
   * it because frame `542:1597` has no hero band at all: the greeting is page
   * content with its own 64px top inset, which is neither of the two values
   * the hero-driven rule below produces.
   */
  contentClassName?: string
  /**
   * For a hero that already closes itself with a tab row (frame `410:1586`
   * puts the tabs *inside* the header block). Drops the hero's bottom padding
   * so the tab rule is the block's own edge, and tightens the content inset
   * below it from 80px to the frame's 40px. Mirrors `ResearchShell`'s
   * `heroFlushBelow`, which solves the same problem on that portal.
   */
  heroFlushBelow?: boolean
}) {
  const navigate = useNavigate()
  const stage = useCoachStage()
  const reduceMotion = useReducedMotion()
  const [onboarded, setOnboarded] = useState(() => onboardingDismissed)

  // The welcome flow leaves a little quicker than the dashboard arrives, so the
  // handoff reads as one movement rather than two equal halves.
  //
  // Round 32: both were lengthened (0.26/0.34 -> 0.4/0.55) on direct feedback
  // that the handoff felt instant. It was not — measured, the old pair ran a
  // full 600ms — but `mode="wait"` means the canvas passes through *fully
  // blank* at the changeover, and a fast blank frame reads as a cut rather than
  // as a fade. Slowing both sides is what makes the same crossfade legible as
  // one movement; the eased curves below carry most of that extra time in the
  // middle, so neither end feels sluggish.
  // Short, because by the time this runs the welcome flow has already played
  // itself off screen — `DeliveryOnboarding` scales its artwork down and fades
  // its copy and buttons before calling back. This is just the empty wrapper
  // leaving; a long fade here would be a second, invisible wait on top.
  // Reduced motion still gets a fade here, just a short one. At `duration: 0`
  // the wrapper vanished in the same frame the dashboard mounted, so the whole
  // handoff was a single-frame swap — see `EXIT_REDUCED_MS` in
  // `DeliveryOnboarding` for why that is the wrong reading of the preference.
  const dismiss = reduceMotion
    ? { duration: 0.18, ease: 'easeInOut' as const }
    : { duration: 0.25, ease: 'easeInOut' as const }
  // The hero and body each rise as they fade in. Small travel, symmetric curve —
  // the same pair the onboarding copy and Round 32's tour both settled on.
  // The 12px rise is motion, so reduced motion fades in place instead.
  const pageRise = reduceMotion
    ? { out: { opacity: 0, y: 0 }, in: { opacity: 1, y: 0 } }
    : { out: { opacity: 0, y: 12 }, in: { opacity: 1, y: 0 } }
  const reveal = reduceMotion
    ? { duration: 0.22, ease: 'easeOut' as const }
    : { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const }

  // The welcome flow belongs to the trainee stage only (direct instruction): a
  // certified coach has long since been through it, so showing it on the coach
  // view would be telling them they are about to start training.
  const showOnboarding = !onboarded && stage === 'trainee'

  // `to` is passed by the final slide's CTA (the training tab) and omitted by
  // Skip, which just reveals whichever page the coach is already on.
  const completeOnboarding = useCallback(
    (to?: string) => {
      onboardingDismissed = true
      setOnboarded(true)
      if (to) navigate(to)
      // Round 32: the first-run tour starts here, and only from the final CTA.
      // `to` is the tell — Skip omits it — so skipping the welcome flow does
      // not hand the coach straight into a five-step walkthrough they have
      // just declined. Deferred past the crossfade so the tour measures the
      // dashboard's real boxes rather than the ones it has mid-fade.
      if (to) window.setTimeout(startDeliveryTour, TOUR_START_DELAY_MS)
    },
    [navigate],
  )

  // Skip and "Get started" both unmount the control that was clicked, so focus
  // would otherwise fall to `<body>` — this project's most-repeated defect.
  // `main` carries `tabIndex={-1}` as the deliberate landing spot.
  //
  // This runs in an effect rather than a `requestAnimationFrame` callback on
  // purpose: a first pass used rAF and Skip was measured landing on `<body>`
  // anyway, because rAF is throttled in a background/preview tab (the same
  // mechanism Rounds 16 and 17 both traced focus bugs to). An effect fires in
  // React's own commit cycle, after `main` is rendered, with no such dependency.
  //
  // `preventScroll` matters: without it, focusing `main` scrolled the page 79px
  // and cut the top off the hero the coach had just been handed — the same
  // auto-scroll-on-arrival bug Rounds 18 and 19 both had to fix. Focus still
  // moves; the viewport just stays where it was.
  useEffect(() => {
    if (onboarded) document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [onboarded])

  return (
    <div className="min-h-screen bg-background">
      {/* The header stays up during onboarding too (direct instruction). Frame
          `369:6442` is drawn without one and an earlier pass suppressed it to
          match, but keeping it means every coach screen shares one chrome and
          the sidebar never shifts when the welcome flow ends. */}
      <AppHeader portal="delivery" accountLabel={accountLabel} />

      {/* Frame `542:1597` columns, transcribed at its own 1281px width:
          24 (left) + 200 (sidebar) + 48 (gap) + 961 (content) + 48 (right).
          So the row's padding is deliberately asymmetric — 24 left, 48 right —
          which is the same imbalance Round 29 corrected by hand against frame
          `369:6442`, now carried by the frame itself. The gap was 16px and the
          content column carried its own 48px of horizontal padding; both are
          gone, because the frame runs `welcome-header` flush to the content
          column's left edge. */}
      <div className="flex gap-12 py-6 pr-12 pl-6">
        {/* No side nav during the welcome flow (direct instruction). An earlier
            pass kept it mounted but forced collapsed with every link but Home
            inert; the nav is now removed outright, so the welcome card is the
            only thing on the canvas. The coach's own collapse preference lives
            in `localStorage`, so it survives the unmount and returns intact.

            `initial={false}` is what scopes the fade to the handoff out of
            onboarding: every `/delivery` page mounts its own shell, so without
            it the sidebar would fade in again on every in-app navigation. With
            it, a shell that mounts already-onboarded renders the nav outright
            and only a *change* of presence animates. */}
        <AnimatePresence initial={false}>
          {!showOnboarding && (
            <motion.div
              key="delivery-sidebar"
              className="shrink-0"
              // The 8px slide is motion; reduced motion fades in place.
              initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              // Held back so the nav does not pop in while the welcome flow is
              // still fading out — it was arriving the instant the flag flipped,
              // which put a new element on screen underneath a screen that had
              // not left yet. Arrives with the hero instead.
              transition={{
                ...reveal,
                delay: reduceMotion ? REDUCED_REVEAL_DELAY_S : SIDEBAR_REVEAL_DELAY_S,
              }}
            >
              <DeliverySidebar />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.main
          {...pageMotion}
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 outline-none"
        >
          {/* The two screens **overlap** during the handoff (direct instruction:
              fade the welcome flow out, fade the dashboard in with its
              components moving in, with the welcome flow overlaying it).

              This replaced `mode="wait"`, which ran them strictly in sequence
              and so passed through a fully blank canvas at the changeover —
              Round 32 already found that blank frame is what made the handoff
              read as a cut rather than a fade, and lengthened both halves to
              compensate. Overlapping removes the blank entirely, so the fade out
              and the arrival are one movement instead of two.

              Both live in one grid cell so they stack rather than sit end to
              end, and the welcome flow holds the higher layer on its way out. */}
          {/* `min-w-0` on the container **and** the two cells is load-bearing.
              A grid item defaults to `min-width: auto`, so Home's 1379px pathway
              rail sized this track instead of scrolling inside its own card and
              pushed the document to 1456px against a 1131px viewport — a real
              horizontal page scroll, measured. Same failure as Round 21.1's
              timeline and Round 30's carousels. */}
          <div className="grid min-w-0">
            <AnimatePresence initial={false}>
              {showOnboarding && (
                <motion.div
                  key="onboarding"
                  className="z-10 col-start-1 row-start-1 min-w-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={dismiss}
                >
                  <DeliveryOnboarding onComplete={completeOnboarding} />
                </motion.div>
              )}
            </AnimatePresence>

            {!showOnboarding && (
              <motion.div
                key="page"
                className="col-start-1 row-start-1 min-w-0"
                initial="out"
                animate="in"
                // The hero and the body arrive one after the other rather than
                // the page appearing as one block. `delayChildren` holds them
                // until the welcome flow above is most of the way gone, so the
                // movement is not competing with it for attention.
                variants={{
                  in: {
                    transition: reduceMotion
                      ? // No stagger — the hero and body arriving in sequence is
                        // choreography. They fade together, held just long
                        // enough for the welcome flow above to have gone.
                        { delayChildren: REDUCED_REVEAL_DELAY_S }
                      : { staggerChildren: 0.16, delayChildren: PAGE_REVEAL_DELAY_S },
                  },
                }}
              >
                {hero && (
                  <motion.div
                    variants={pageRise}
                    transition={reveal}
                    className={cn(
                      'px-6 pt-16 md:px-12',
                      heroClassName ?? 'bg-pearl',
                      // `heroFlushBelow` is for a hero that ends in its own tab
                      // row: the band stops at the tab rule rather than adding
                      // padding under it, exactly as `ResearchShell` does on the
                      // researcher record pages.
                      heroFlushBelow ? 'pb-0' : heroNoSeam ? 'pb-8 md:pb-10' : 'border-b border-hairline',
                    )}
                  >
                    <div className="mx-auto max-w-[1320px]">{hero}</div>
                  </motion.div>
                )}
                <motion.div
                  variants={pageRise}
                  transition={reveal}
                  className={cn(
                    // Kept as the default deliberately. Frame `542:1597` runs
                    // its content flush to the column's left edge, but that is a
                    // page with **no hero band**. Dropping this padding globally
                    // left the four hero-bearing pages with their band's text
                    // 48px in and the body below it at 0 — a visible 48px step,
                    // measured. Trainee Home opts out via `contentClassName`.
                    'px-6 pb-16 md:px-12',
                    // Both numbers are `ResearchShell`'s, measured from the live
                    // researcher pages rather than picked: a plain hero is
                    // followed by 80px of content inset (on top of the band's own
                    // 40px bottom padding), and a hero that closes itself with a
                    // tab row tightens to 48px. Delivery had drifted on both — a
                    // frame-literal 56px on the tabbed variant, and an
                    // overcorrection to 16px on the plain one that read as far too
                    // tight. Keep these two in step with `ResearchShell`.
                    heroFlushBelow ? 'pt-12' : (!hero || heroNoSeam) && 'pt-16 md:pt-20',
                    contentClassName,
                  )}
                >
                  <div className="mx-auto max-w-[1320px]">{children}</div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.main>
      </div>

      {/* Demo-only stage switcher (Round 29). Lives in the shell rather than on
          Home so the chosen stage is visible and changeable from anywhere in
          the portal, not just the one page whose layout it drives. */}
      <CoachStageSwitcher />
    </div>
  )
}
