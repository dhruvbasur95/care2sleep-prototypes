import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The Consumer Portal's first-run onboarding tour — frames `991:9446` (the
 * greeting), `992:9666`, `992:9724`, `995:9931`, `995:10173`.
 *
 * One modal shell, five screens, opened automatically once the welcome flow
 * hands over to Home. Next / Go back / Skip.
 *
 * ── COLOUR AND TYPE ───────────────────────────────────────────────────────
 *
 * Every hex in the five frames is already a token in this app, byte for byte,
 * so the tokens are used and the painted colour is identical to the frame:
 *
 *     #3a00ad -> consumer-primary     #1a1a1a -> ink
 *     #333333 -> ink-muted            #6d6d6d -> ink-faint
 *
 * The type maps just as cleanly, which is worth stating because it is unusual
 * — nothing here needed a new step:
 *
 *     32/500/-0.374/normal -> consumer-section       (exact)
 *     16/400/1.4           -> consumer-body          (exact)
 *     16/600/1.4           -> consumer-body-strong   (exact)
 *     18/500/1.4           -> consumer-eyebrow + font-medium
 *
 * Only the eyebrow needed anything added: `consumer-eyebrow` is the frames'
 * size and line height at 400, and these frames set it in Medium.
 *
 * ── THE CHASSIS IS THIS COMPONENT'S OWN ───────────────────────────────────
 *
 * Not `ConfirmDialog` — it unmounts its content on close, which a five-screen
 * flow cannot use. What is borrowed, deliberately and almost verbatim, is
 * `SessionFeedbackModal`'s focus work, because that is the part carrying this
 * project's scars: trap Tab, close on Escape, and focus the incoming heading
 * from a **callback ref** rather than an effect. Under
 * `AnimatePresence mode="wait"` the incoming node mounts a commit LATER than
 * the state change, so an effect keyed on the step index fires against the
 * OUTGOING screen and focus lands on `<body>`; a callback ref is keyed on the
 * element, which cannot exist too early.
 *
 * ⚠️ There is deliberately **no restore-focus-to-the-opener**, unlike
 * `SessionFeedbackModal`. This tour's only opener is the welcome flow's final
 * CTA, and that button is gone by the time the tour is visible — the welcome
 * navigates to Home and unmounts. There is nothing to restore to. On close,
 * focus goes to `<main id="main-content">` instead, which is the page the tour
 * was describing. Measured: heading on open, `MAIN#main-content` after Skip,
 * never `<body>`. An earlier version of this comment claimed a focus-restore
 * that was never implemented; if you add an opener that survives, add the
 * restore with it.
 *
 * ⚠️ That makes this the *second* consumer modal with the same chassis and no
 * shared component. Extracting one is a real follow-up, deliberately not done
 * in the same pass that introduced this file: it would mean editing
 * `SessionFeedbackModal`, which is signed off, while this screen is still being
 * iterated on. A third caller should force it.
 *
 * ── WHAT THE FRAMES GET WRONG, AND IS DERIVED HERE INSTEAD ────────────────
 *
 * 1. **The step counter.** Frames `995:9931` and `995:10173` BOTH read "3/4" —
 *    the last screen should be 4/4. It is computed from position here, never
 *    written, which is this project's standing rule for any stated count.
 * 2. **The dots.** All five frames draw the first dot active, including the
 *    ones whose own counter says 2/4 and 3/4. Also derived.
 * 3. **The greeting.** `991:9446` reads the placeholder "Hello <> & <>";
 *    `dyadFirstNames` fills in the real two.
 * 4. **Go back on screen 1.** The frames draw it on all five, but nothing sits
 *    behind the first screen. The slot is *absent* there rather than disabled,
 *    which is the same call `ConsumerWelcome` already made for its own step 1.
 */

/** The four numbered screens plus the greeting that opens them. */
const STEPS = [
  {
    /** No number — the greeting is the way in, not one of the four. */
    numbered: false,
    title: 'Welcome to your dashboard',
    body: `Your dashboard is where you'll find everything for the study. Before your first session, let's walk through what it offers.`,
    image: '/illustrations/consumer-onboarding/dashboard.png',
    /** Empty alt: every one of these is a picture of the screen the copy beside
     *  it already describes in words, so announcing it twice adds nothing. */
    alt: '',
  },
  {
    numbered: true,
    title: 'Your tasks for today',
    /* The frame bolds "new module" and "sleep diary" inside the sentence. Split
       rather than marked up with `dangerouslySetInnerHTML`, and `consumer-body`
       carries the run so only the weight changes on the two emphasised spans. */
    body: [
      'Each day brings a couple of small things to do. A ',
      { strong: 'new module' },
      ' is released each week, and your ',
      { strong: 'sleep diary' },
      ` is a daily habit, both of you fill it in every day. You'll find both on your dashboard.`,
    ],
    image: '/illustrations/consumer-onboarding/tasks.png',
    alt: '',
  },
  {
    numbered: true,
    title: 'Your session plan',
    body: `From your home page, you'll be able to view your personalised session plan, created together with your coach, and see the date and time of your upcoming session.`,
    image: '/illustrations/consumer-onboarding/session-plan.png',
    alt: '',
  },
  {
    numbered: true,
    title: 'Know your coach',
    body: 'Your home page also lets you view your assigned coach, see their contact details, and read more about their background.',
    image: '/illustrations/consumer-onboarding/coach.png',
    alt: '',
  },
  {
    numbered: true,
    title: 'In case you run into any issues',
    body: `If anything's unclear, or you'd like to reach your coach or the research team with an update, head to the Help page for more directions.`,
    image: '/illustrations/consumer-onboarding/help.png',
    alt: '',
  },
] satisfies readonly {
  numbered: boolean
  title: string
  body: string | (string | { strong: string })[]
  image: string
  alt: string
}[]

/**
 * The image's aspect ratio, from the frames' own 497 x 343 box.
 *
 * A ratio rather than a fixed size, because it is the one thing that has to
 * survive the panel narrowing on a phone: the committed PNGs are exactly 2x the
 * frame box (994 x 686), so they stay sharp at their desktop size and simply
 * scale down inside it.
 *
 * The panel's own 577 x 716 and its 40px padding are written into the classes
 * below rather than held here — Tailwind scans class names statically, so a
 * constant cannot be interpolated into one, and a number that lives in a
 * constant only to be repeated in a string is a number with two homes.
 */
const IMAGE_RATIO = '497 / 343'

export function ConsumerOnboardingTour({
  open,
  greeting,
  onClose,
}: {
  open: boolean
  /** Both first names, from `dyadFirstNames` — the frame's "<> & <>". */
  greeting: string
  onClose: () => void
}) {
  const reduceMotion = useReducedMotion()
  const titleId = useId()
  const [step, setStep] = useState(0)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const focusedStep = useRef<number | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  /* Reopening starts at the beginning. Held here rather than by remounting the
     component, so the exit animation can still play against the old step. */
  useEffect(() => {
    if (!open) {
      setStep(0)
      focusedStep.current = null
    }
  }, [open])

  /**
   * Lock the page behind the modal.
   *
   * `overflow: hidden` on the root rather than a wheel/touch handler — the same
   * choice `DeliveryTour` made and for the same reason: it stops the *reader*
   * scrolling while leaving programmatic scrolling intact. The padding
   * compensates for the removed scrollbar, without which the page jumps ~15px
   * wider the instant the modal opens.
   */
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const gap = window.innerWidth - root.clientWidth
    const prevOverflow = root.style.overflow
    const prevPad = root.style.paddingRight
    root.style.overflow = 'hidden'
    if (gap > 0) root.style.paddingRight = `${gap}px`
    return () => {
      root.style.overflow = prevOverflow
      root.style.paddingRight = prevPad
    }
  }, [open])

  /**
   * ⚠️ **The heading is focused from a callback ref, not an effect.**
   *
   * Screens cross-fade under `AnimatePresence mode="wait"`, so the incoming
   * heading mounts a commit *later* than the step change. An effect keyed on
   * `step` runs while the outgoing screen is still the only thing in the tree:
   * it focuses the heading on its way out, never runs again, and every
   * transition lands on `<body>`. A callback ref is keyed on the element, which
   * cannot exist too early. This project has shipped and measured both.
   *
   * `focusedStep` stops a re-render of the same screen stealing focus back off
   * whatever the reader has since tabbed to.
   */
  const headingRef = useCallback(
    (node: HTMLHeadingElement | null) => {
      if (!node || focusedStep.current === step) return
      focusedStep.current = step
      node.focus({ preventScroll: true })
    },
    [step],
  )

  const trapKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'),
    ]
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/25"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Inset at every width, so the dim is visible on all four sides and
              the panel reads as something sitting ON the page. See the panel's
              own note — this was briefly `p-0` below `sm`. */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              ref={panelRef}
              onKeyDown={trapKeys}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              /*
                ⚠️ **One fixed size for all five screens.** The frames are all
                577 x 716 and the panel holds that at every step, so the box the
                reader is looking at never resizes under them as they advance —
                the same call `SessionFeedbackModal` was given directly ("keep
                the modal dimensions fixed, and not change it based on next
                screen").

                ⚠️ **A card at every width, never a full-bleed sheet.** This
                went the other way first — `100dvh`, square corners, edge to
                edge below `sm`, following `SessionFeedbackModal`'s phone
                treatment — and was reported straight back: "in mobile view, I
                cannot see it as a pop-up modal". It was right about that. Filling
                the screen removes the two things that say *modal* rather than
                *page*: the dim around the edges and the rounded corner. So the
                panel keeps its 24px radius and its inset at 375 just as it does
                at 1281, and only narrows.

                `max-h` against the viewport so a short screen cannot overflow,
                with `dvh` rather than `vh` — a mobile browser's own chrome is
                already subtracted, so the card is never partly under the
                address bar.

                ⚠️ The phone cap is **96px short of the viewport, not 32**
                ("I look like a page though it is not, reduce dimensions"). At
                32 the card cleared 375 x 667 by 16px a side, which is a margin
                you have to look for; 48px of dim above and below it is what
                actually reads as something floating over the page. The content
                region scrolls to absorb the difference, and the pagination and
                footer are outside it, so nothing is lost.
              */
              className="pointer-events-auto flex h-[716px] max-h-[calc(100dvh-96px)] w-full max-w-[577px] flex-col items-center overflow-hidden rounded-[24px] bg-white p-5 sm:max-h-[calc(100dvh-48px)] sm:p-10"
            >
              {/* The content region is what scrolls, never the panel: the
                  footer has to stay reachable on a short viewport. */}
              {/* ⚠️ `overflow-x-hidden` is explicit and load-bearing: `overflow-y-auto`
                  alone computes overflow-x to `auto`, so any child overhanging by
                  a pixel becomes a horizontal scrollbar (direct instruction: "in
                  mobile the onboarding screens should not have any horizontal
                  scroll"). `min-w-0` so a wide child sizes to the track rather
                  than the other way round. */}
              <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-4 overflow-x-hidden overflow-y-auto">
                <div className="flex w-full min-w-0 flex-col gap-4">
                  {/* Header row — eyebrow and Skip */}
                  <div className="flex w-full items-center justify-between gap-4">
                    <p className="text-consumer-eyebrow min-w-0 font-medium text-consumer-primary">
                      {current.numbered
                        ? /* Derived, never written — two frames say "3/4".
                             Counts ALL five screens, the greeting included
                             (direct instruction: "I want default welcome to
                             dashboard to be counted as a page"), so it runs
                             2/5 .. 5/5 and agrees with the dots below. */
                          `${step + 1}/${STEPS.length}`
                        : `Hello ${greeting}`}
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      /* The frame's own `px-8`, plus the height needed to clear
                         this app's 36px control floor without moving the label
                         off the frame's baseline — the padding grows the hit
                         area and the negative *vertical* margin keeps the row
                         25px tall.

                         ⚠️ No `-mx-`. It had one, to pull the label flush with
                         the panel's inset, and that made the header row 8px
                         wider than its container — which `overflow-y-auto`
                         turned into a real horizontal scrollbar on a phone,
                         because CSS computes the other axis to `auto` when one
                         axis is not `visible`. 8px of overhang, a grey bar
                         across the modal.

                         ⚠️ The hover is a **fill**, not just a colour. It was
                         `hover:text-ink` alone, which moves #333333 to #1a1a1a
                         — a 26-per-channel shift on text that is already dark,
                         and reported as no hover state at all. This project's
                         standing rule is that a change too small to see is not
                         a state change, so the `parchment` fill does the work
                         and the darkening rides along with it. */
                      className="text-consumer-body-strong -my-2 shrink-0 rounded-lg px-2 py-2 text-ink-muted underline underline-offset-2 outline-none transition-colors hover:bg-parchment hover:text-ink focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
                    >
                      Skip
                    </button>
                  </div>

                  {/* Title + body. `mode="wait"` so the outgoing copy is gone
                      before the incoming arrives — a cross-fade of two
                      different sentences in the same box reads as a smear. */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                      className="flex w-full min-w-0 flex-col gap-1"
                    >
                      <h2
                        id={titleId}
                        ref={headingRef}
                        tabIndex={-1}
                        className="text-consumer-section text-balance text-ink outline-none"
                      >
                        {current.title}
                      </h2>
                      {/*
                        ⚠️ **No fixed height.** The frames set all five bodies in
                        an 88px box so the picture below starts at the same y on
                        every screen, and that was built here as
                        `sm:min-h-[88px]` — then removed on direct instruction
                        ("you can toggle sub copy below title height") because
                        the reserve is what pushed the pagination off the bottom
                        of a short viewport: screen 1's copy is two lines, so it
                        was holding ~40px of empty space open underneath itself.

                        The trade is stated rather than hidden: the picture now
                        starts a little lower on the screens with longer copy.
                        Nothing is clipped either way, which the reserve could
                        not promise.
                      */}
                      <p className="text-consumer-body text-ink">
                        {typeof current.body === 'string'
                          ? current.body
                          : current.body.map((part, i) =>
                              typeof part === 'string' ? (
                                part
                              ) : (
                                /* 600 is this portal's heaviest permitted
                                   weight; the frame's Bold would be the first
                                   700 on a consumer surface. */
                                <strong key={i} className="font-semibold">
                                  {part.strong}
                                </strong>
                              ),
                            )}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* The picture. A committed Figma export at 2x its frame size,
                    held to the frame's own aspect ratio so it scales with the
                    panel on a phone instead of being cropped. */}
                <div
                  className="w-full shrink-0 overflow-hidden rounded-[12px]"
                  style={{ aspectRatio: IMAGE_RATIO }}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={current.image}
                      src={current.image}
                      alt={current.alt}
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                      className="size-full object-cover"
                    />
                  </AnimatePresence>
                </div>

              </div>

              {/*
                Pagination. Four dots for the four numbered screens.

                ⚠️ **Outside the scrolling region, and that is the whole point.**
                It used to be the last child of the content column, which made it
                the first thing to be pushed out of sight on a short viewport
                (reported as "paginations are getting clipped") and moved it up
                and down as each screen's copy changed length. As a `shrink-0`
                sibling of the footer inside a fixed-height panel its y is
                constant on all five screens and it cannot be scrolled away —
                direct instruction: "make sure pagination component does not has
                any pixel movement".

                ⚠️ **One dot per screen, the greeting included** (direct
                instruction: "I want default welcome to dashboard to be counted
                as a page"). The frames draw four and number the other screens
                "N/4", which left the greeting either unrepresented or claiming
                a dot belonging to a different screen — reported as "pagination
                also does not mapps in default screen". Counting it as page one
                makes the dots and the counter say the same thing on every
                screen, which four dots and five screens could not.

                Both are derived from `STEPS` rather than written, so adding or
                removing a screen cannot leave either of them stale.

                The 16px above and 32px below are the frames' own image -> dots
                -> footer rhythm, applied here rather than as a flex `gap` on the
                panel so the two spacings can differ.
              */}
              <ol aria-hidden="true" className="flex shrink-0 items-center gap-2 pt-4 pb-8">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex items-center">
                    <span
                      className={cn(
                        'h-2 rounded-[32px] transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none',
                        i === step ? 'w-6 bg-ink' : 'w-2 bg-ink-faint',
                      )}
                    />
                  </li>
                ))}
              </ol>
              <p className="sr-only" aria-live="polite">
                Step {step + 1} of {STEPS.length}
              </p>

              {/* Footer. Go back is absent on the first screen rather than
                  disabled — nothing sits behind it.

                  ⚠️ Stacked below `sm`, side by side from there. Side by side on
                  a phone leaves the primary about 87px of label width, and
                  "Start my journey" needs ~150 — it wrapped to two lines inside
                  a 48px pill. `flex-col-reverse` so the forward action is still
                  the first control a thumb reaches, which is exactly what
                  `ConsumerWelcome`'s own footer does at the same breakpoint. */}
              <div className="flex w-full shrink-0 flex-col-reverse items-center justify-center gap-3 sm:flex-row sm:gap-4">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="text-consumer-body-strong flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-[28px] border border-consumer-primary bg-white px-4 whitespace-nowrap text-consumer-primary sm:w-[136px] outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
                  >
                    <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
                    Go back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
                  className="text-consumer-body-strong flex h-12 w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-[28px] bg-consumer-primary px-5 whitespace-nowrap text-white sm:w-auto sm:flex-1 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
                >
                  <span className="min-w-0 flex-1 text-center">
                    {isLast ? 'Start my journey' : 'Next'}
                  </span>
                  <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
