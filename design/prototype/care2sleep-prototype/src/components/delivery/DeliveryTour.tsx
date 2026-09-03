import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  endDeliveryTour,
  goToTourStep,
  tourStepBody,
  useDeliveryTour,
} from '@/data/deliveryTour'
import { cn } from '@/lib/utils'

/**
 * Coach Delivery Portal first-run tour (Round 32) — five coachmarks over the
 * trainee's Home page, started by the welcome flow's final CTA.
 *
 * Figma `637:10621`-`637:10625`. Copy and anchors live in `data/deliveryTour`.
 *
 * ## Two things here are load-bearing, both learned the hard way
 *
 * **1. The overlay is portalled to `<body>`.** `DeliveryShell` renders its
 * content inside a `motion.main`, and a transformed ancestor becomes the
 * containing block for `position: fixed` descendants — so an overlay rendered
 * in place silently offsets itself and stops covering the sidebar, where one
 * of these five anchors lives. Round 17 found this on the researcher tour and
 * it is the single reason that tour used a portal too.
 *
 * **2. Focus has to be moved into the card and taken back out deliberately.**
 * Without it, Tab escapes to the controls *behind* the dim — which are visible
 * but unreachable-by-intent — and Escape does nothing. Focus falling to
 * `<body>` on the step that unmounts the button you just clicked is this
 * project's most-repeated defect (six separate rounds).
 */

/** Frame `633:959`. */
const CARD_W = 320
/** Frame `633:958`: a 16px square rotated 45deg, so it protrudes ~11px. */
const ARROW_OFFSET = 11
/** Breathing room between the spotlight hole and the anchor's own box. */
const HOLE_PAD = 8
/** Corner radius of the spotlight hole. 8px on direct instruction — 16px (the
 *  `Card` radius) read as a much softer shape than the cards it cuts around. */
const HOLE_RADIUS = 8
/** Never let the card touch a viewport edge. */
const VIEWPORT_MARGIN = 16

type Side = 'right' | 'left' | 'bottom' | 'top'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * The frame's own illustration (`633:963`), identical on all five steps. The
 * two vector pieces are the frame's committed exports; everything else is
 * plain rectangles, which is what they are in Figma too.
 *
 * Purely decorative — it carries no information the copy beside it does not —
 * so the whole block is hidden from assistive tech rather than described.
 */
function TourIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-[130px] w-full shrink-0 flex-col items-center justify-end overflow-hidden rounded-xs bg-white"
    >
      <div className="flex items-end">
        <div className="mr-[-20px] flex h-[105.051px] w-[90.909px] shrink-0 items-center justify-center">
          <div className="-rotate-15">
            <img
              src="/illustrations/tour/left-doc.svg"
              alt=""
              className="block h-[90px] w-[70px]"
            />
          </div>
        </div>
        <div className="mr-[-20px] flex h-[95px] w-[70px] shrink-0 flex-col gap-1 rounded-t-xs bg-pearl p-1.5">
          <div className="h-[10px] w-full rounded-[1px] bg-[#e0e0e5]" />
          <img src="/illustrations/tour/chart-line.svg" alt="" className="block h-[20px] w-[36px]" />
        </div>
        <div className="flex h-[112.778px] w-[92.979px] shrink-0 items-center justify-center">
          <div className="rotate-15">
            <div className="flex h-[98px] w-[70px] flex-col gap-1 rounded-t-xs bg-pearl p-1.5">
              <div className="h-[10px] w-full rounded-[1px] bg-[#d1d1d6]" />
              <div className="flex h-6 w-full items-end gap-[2px]">
                <div className="h-[12px] w-[4px] bg-[#329d9c]" />
                <div className="h-[18px] w-[4px] bg-[#2e70e8]" />
                <div className="h-[8px] w-[4px] bg-[#56c1ff]" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* `folder-front` — the yellow band the documents sit behind. */}
      <div className="absolute left-1/2 top-[92px] h-[38px] w-[180px] -translate-x-1/2 rounded-[2px] bg-[#f4c455]" />
    </div>
  )
}

/**
 * Picks the side with room for the card, preferring the step's own choice.
 * Returns the chosen side and the card's viewport position.
 *
 * Height is passed in measured rather than assumed: the frame draws every card
 * at 421px, but the copy is real and a narrow viewport can wrap it taller —
 * placing against a hardcoded height is how a card ends up hanging off the
 * bottom of the screen on the one step whose text ran long.
 */
function place(anchor: Rect, cardH: number, prefer: Side): { side: Side; top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const fits: Record<Side, boolean> = {
    right: vw - anchor.left - anchor.width - ARROW_OFFSET - VIEWPORT_MARGIN >= CARD_W,
    left: anchor.left - ARROW_OFFSET - VIEWPORT_MARGIN >= CARD_W,
    bottom: vh - anchor.top - anchor.height - ARROW_OFFSET - VIEWPORT_MARGIN >= cardH,
    top: anchor.top - ARROW_OFFSET - VIEWPORT_MARGIN >= cardH,
  }

  const order: Side[] = [prefer, 'right', 'bottom', 'left', 'top']
  const side = order.find((s) => fits[s]) ?? prefer

  let top: number
  let left: number
  if (side === 'right' || side === 'left') {
    top = anchor.top
    left =
      side === 'right'
        ? anchor.left + anchor.width + ARROW_OFFSET
        : anchor.left - CARD_W - ARROW_OFFSET
  } else {
    left = anchor.left
    top = side === 'bottom' ? anchor.top + anchor.height + ARROW_OFFSET : anchor.top - cardH - ARROW_OFFSET
  }

  // Clamp last, so a card that had to fall back to a cramped side still lands
  // fully on screen rather than half off it.
  left = Math.min(Math.max(left, VIEWPORT_MARGIN), vw - CARD_W - VIEWPORT_MARGIN)
  top = Math.min(Math.max(top, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vh - cardH - VIEWPORT_MARGIN))

  return { side, top, left }
}

export function DeliveryTour({ stageCount }: { stageCount: string }) {
  /* `steps` comes from the store, not the module: the trainee and the
     certified coach run different walkthroughs and the store knows which was
     opened (Round 40). */
  const { active, index, steps } = useDeliveryTour()
  const reduceMotion = useReducedMotion()
  /**
   * The card is held in state rather than a plain ref, because `mode="wait"`
   * below means the incoming card mounts in a *later* commit than the step
   * change. A ref would still be null (or pointing at the outgoing card) when
   * the placement effect ran, so the new coachmark would be positioned using
   * the previous one's height. State re-runs that effect on the commit the new
   * card actually appears in.
   */
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLParagraphElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null)
  const [pos, setPos] = useState<{ side: Side; top: number; left: number } | null>(null)

  const step = active ? steps[index] : undefined
  const isFirst = index === 0
  const isLast = index === steps.length - 1

  /**
   * Where focus goes when the tour ends. `#main-content` carries `tabIndex={-1}`
   * for exactly this — the control that ends the tour unmounts with it, so
   * without a deliberate target focus lands on `<body>`.
   */
  const finish = useCallback(() => {
    endDeliveryTour()
    // Back to the top of Home (direct instruction). The tour scrolls the page
    // to centre each anchor and then locks it, so wherever the last step left
    // it is an arbitrary position the coach never chose — the last two steps
    // sit on sidebar rows, which can leave Home scrolled halfway down with no
    // coachmark left to explain why.
    //
    // `preventScroll` on the focus call is what makes the order here safe: it
    // moves focus without dragging the viewport back down to `main`'s box.
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [reduceMotion])

  // Measure the anchor, and keep measuring while the page moves under it.
  useLayoutEffect(() => {
    if (!step) {
      setAnchorRect(null)
      return
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`)
    if (!el) {
      // A missing anchor is a wiring bug, not a user-facing state: rather than
      // dimming the whole screen around nothing, skip to the next step.
      goToTourStep(index + 1)
      return
    }

    /* Round 40, direct instruction: the **opening** step scrolls instantly.
       The spotlight is a fixed-position hole that re-measures its anchor every
       frame, so while the page smooth-scrolls the anchor into view the hole
       chases it up the viewport — which is what read as the highlight "coming
       from the bottom, bouncy". Its own 0.5s ease running against that travel
       is what added the overshoot.

       Only the first step: moving *between* steps is where the glide is doing
       real work (Round 32 found it was the larger half of what made the tour
       feel smooth), and by then the coach is already oriented. The entrance is
       carried instead by the overlay's own 0.45s opacity fade — a subtle
       fade-in rather than a move. */
    el.scrollIntoView({
      block: 'center',
      behavior: reduceMotion || index === 0 ? 'auto' : 'smooth',
    })

    const measure = () => {
      const r = el.getBoundingClientRect()
      setAnchorRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    measure()

    // The smooth scroll above is still running for a few frames, so one
    // measurement is not enough — the card would settle beside where the
    // anchor *was*. A short poll is cheaper and more reliable here than
    // guessing a scroll duration.
    const poll = window.setInterval(measure, 60)
    const stop = window.setTimeout(() => window.clearInterval(poll), 700)

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.clearInterval(poll)
      window.clearTimeout(stop)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step, index, reduceMotion])

  // Position the card once both it and the anchor have real boxes.
  useLayoutEffect(() => {
    if (!anchorRect || !cardEl || !step) return
    setPos(place(anchorRect, cardEl.offsetHeight, step.prefer ?? 'right'))
  }, [anchorRect, cardEl, step])

  /**
   * Focus the card's own step label on every step change. Focusing the heading
   * rather than the first button means a screen reader reads the new content
   * from the top instead of announcing "Next".
   *
   * This deliberately waits for `pos`, and that is not a nicety: the card is
   * `visibility: hidden` until it has been placed, and **`.focus()` on a
   * `visibility: hidden` element silently does nothing**. A first pass focused
   * on `active` alone and measured `activeElement` still sitting on
   * `#main-content` — the tour opened with focus outside it, so Tab went to the
   * page behind the dim, which is the exact failure the trap exists to prevent.
   *
   * `focusedFor` makes it fire once per card: `pos` also changes on every
   * scroll and resize reflow, and re-focusing on those would yank focus back
   * off whichever button the coach had just tabbed to.
   *
   * It tracks the **card element**, not the step index, and that distinction is
   * the whole fix for a real bug the crossfade introduced. `mode="wait"` mounts
   * the incoming card ~280ms after the index changes, so an index-keyed guard
   * fired early — against the *outgoing* card — marked the step as done, and
   * then refused to fire again when the real card arrived. Measured, focus was
   * landing on the page's "Skip to main content" link on every step after the
   * first: outside the dialog, outside the trap. Keying on the element means
   * the guard cannot run before there is something to focus.
   */
  const focusedFor = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!active) {
      focusedFor.current = null
      return
    }
    if (!pos || !cardEl || focusedFor.current === cardEl) return
    focusedFor.current = cardEl
    headingRef.current?.focus({ preventScroll: true })
  }, [active, cardEl, pos])

  /**
   * Lock the page while the tour runs (direct instruction): the coach should
   * move through it with Next/Previous, not scroll the dimmed page out from
   * under a coachmark that is pinned to viewport coordinates.
   *
   * `overflow: hidden` on the root is deliberately chosen over a wheel/touch
   * event blocker, because it stops *user* scrolling while leaving
   * **programmatic** scrolling intact — and this component's own
   * `scrollIntoView` depends on that to bring each anchor into view. An event
   * blocker would have had to whitelist its own calls.
   *
   * The padding compensates for the scrollbar the lock removes. Without it the
   * whole page jumps ~15px wider the instant the tour opens, which moves every
   * anchor it is about to measure.
   */
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const scrollbar = window.innerWidth - root.clientWidth
    const prevOverflow = root.style.overflow
    const prevPad = document.body.style.paddingRight
    root.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      root.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPad
    }
  }, [active])

  // Escape closes; Tab is trapped inside the card.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        finish()
        return
      }
      if (e.key !== 'Tab' || !cardEl) return
      const focusable = cardEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement
      if (e.shiftKey && (current === first || current === headingRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && current === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, finish, cardEl])

  const hole = anchorRect
    ? {
        x: anchorRect.left - HOLE_PAD,
        y: anchorRect.top - HOLE_PAD,
        width: anchorRect.width + HOLE_PAD * 2,
        height: anchorRect.height + HOLE_PAD * 2,
      }
    : null

  const side = pos?.side ?? step?.prefer ?? 'right'

  return createPortal(
    /*
      The whole overlay fades, not just the card. Reported as the handoff out of
      the welcome flow being "instant and hard", and the dim was the reason: the
      dashboard arrived on a gentle 0.55s curve and then a full-strength scrim
      dropped over it in a single frame. Fading the scrim in — and back out on
      Done — is what makes the tour open and close as one soft change.

      `AnimatePresence` wraps the *whole* portal rather than sitting inside it,
      because a component that returns `null` when inactive can never play an
      exit. It keeps the last rendered subtree alive for the length of the fade,
      which is also why everything below tolerates a `step` of `undefined`.
    */
    <AnimatePresence>
      {active && step && (
      <motion.div
        key="delivery-tour"
        className="fixed inset-0 z-[60]"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
      >
      {/*
        The dim is an SVG rect masked minus a rounded hole, rather than a giant
        `box-shadow` spread. Round 17 rejected box-shadow for a reason it later
        marked **unproven**, so this is not presented as the only way — it is
        simply the one that is known to work here.

        `pointer-events-none` on the svg, with a sibling catcher below, so the
        hole does not have to be punched out of the click target too.
      */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <mask id="delivery-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/*
              The hole glides between anchors rather than cutting. This is the
              larger half of "smoother": the card was already fading, but the
              spotlight underneath it was snapping from one box to the next in
              a single frame, which is what the eye actually caught.

              `initial={false}` so the very first step opens with the hole
              already around its anchor — animating it from nothing would play
              a shape growing out of the top-left corner on arrival.
            */}
            {hole && (
              <motion.rect
                initial={false}
                animate={{ x: hole.x, y: hole.y, width: hole.width, height: hole.height }}
                // Same symmetric curve as the card, and deliberately so: two
                // different easings on two things moving together is most of
                // what reads as springy.
                transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                rx={HOLE_RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15,10,30,0.55)"
          mask="url(#delivery-tour-mask)"
        />
      </svg>

      {/* Clicking the dim ends the tour, the same as Skip. Not a focus stop —
          Skip is the labelled way to do this; this is just the forgiving one. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={finish}
        className="absolute inset-0 cursor-default"
      />

      {/*
        `key={index}` is what stops the card *travelling*. A single persistent
        card animating its own `top`/`left` slid diagonally across the whole
        viewport between steps — reported as flying in randomly, and fairly:
        the path it took was a straight line between two unrelated anchors and
        meant nothing. Remounting per step replaces that with a fade in place,
        so each coachmark simply appears where it belongs.

        `mode="wait"` holds the incoming card until the outgoing one has fully
        faded, which is what makes Next and Previous read as one soft change
        rather than a cut. It is also why `cardEl` is state and not a ref — see
        the note on that declaration.
      */}
      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={index}
        ref={setCardEl}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-tour-title"
        aria-describedby="delivery-tour-body"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        // The exit timing rides on the variant, not the shared `transition`
        // prop — framer-motion has no `exit` key there, and putting one in is a
        // type error rather than a silent no-op.
        exit={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: -3, transition: { duration: 0.3, ease: 'easeInOut' } }
        }
        /*
          Tuned across four rounds of direct feedback: too fast, then too fast
          again, then "too springy". The springiness was the *curve*, not the
          duration — `[0.16, 1, 0.3, 1]` is an expo-out, which sprints and then
          crawls to a halt, and at 10px of travel plus a scale-up that lands as
          a pop. This is a symmetric ease with a quarter of the travel and no
          scale at all, so what remains is essentially a cross-dissolve with a
          hint of direction.
        */
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          top: pos?.top ?? -9999,
          left: pos?.left ?? -9999,
          // Hidden until placed, so it never flashes at the top-left corner
          // before its first measurement lands.
          visibility: pos ? 'visible' : 'hidden',
        }}
        className={cn(
          'absolute flex w-[320px] flex-col justify-between gap-6 rounded-xl bg-primary p-6 text-white',
          'shadow-[0px_8px_12px_rgba(0,0,0,0.2)]',
        )}
      >
        {/* Frame `633:958` — a 16px square rotated 45deg, tucked under the card
            so only its corner shows. `-z-10` keeps it behind the card's own
            fill, which is what makes it read as a tail rather than a diamond. */}
        <div
          aria-hidden="true"
          className={cn(
            'absolute -z-10 size-4 rotate-45 bg-primary',
            side === 'right' && 'left-[-6px] top-6',
            side === 'left' && 'right-[-6px] top-6',
            side === 'bottom' && 'left-6 top-[-6px]',
            side === 'top' && 'bottom-[-6px] left-6',
          )}
        />

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <p
              ref={headingRef}
              tabIndex={-1}
              id="delivery-tour-title"
              className="flex-1 text-caption text-on-purple-muted outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Step {index + 1} of {steps.length}
            </p>
            {/* No Skip on the last step (direct instruction) — there is nothing
                left to skip past, and offering two ways out of the same card
                where one of them is already labelled "Done" only asks the coach
                to work out whether they differ. */}
            {!isLast && (
            <button
              type="button"
              onClick={finish}
              // 36px hit area, not the frame's bare 17px text box — the control
              // floor is a non-negotiable here. The negative margin cancels its
              // effect on the row's height, so the header still measures the
              // frame's own 20px rather than pushing the card 19px taller.
              className="-my-2 flex h-9 items-center rounded-sm px-2 text-caption-medium text-parchment underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white"
            >
              Skip
            </button>
            )}
          </div>

          <TourIllustration />

          <div className="flex flex-col gap-1">
            <p className="text-body-md">{step.title}</p>
            <p id="delivery-tour-body" className="text-body leading-[1.4]">
              {tourStepBody(step, stageCount)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {/* Step 1 has no Previous in the frame (`637:10622`), and the slot is
              held rather than collapsed so Next does not slide left on step 1
              and then jump right on step 2. */}
          {isFirst ? (
            <span aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={() => goToTourStep(index - 1)}
              className="h-9 w-28 rounded-full border border-white text-caption-medium text-white outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
            >
              Previous
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? finish() : goToTourStep(index + 1))}
            className="h-9 w-28 rounded-full bg-white text-caption-medium text-primary outline-none hover:bg-parchment focus-visible:ring-2 focus-visible:ring-white"
          >
            {/* A step may name its own advance label — the trainee's first card
                is an invitation and says "Start tour". Everything else is
                Next / Done, and a tour whose first step is already content (the
                coach's) gets "Next" like any other. */}
            {step?.cta ?? (isLast ? 'Done' : 'Next')}
          </button>
        </div>
      </motion.div>
      </AnimatePresence>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
