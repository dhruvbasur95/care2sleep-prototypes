import { useEffect, useState, type RefObject } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * "There is more below" cue — a labelled pill pinned near the bottom of the
 * scrolling area that bobs gently and disappears once there is nothing left
 * to scroll to.
 *
 * Originally `components/consumer/ScrollCue.tsx` and documented there as
 * consumer-only by design. It moved here when the coach training portal's
 * module player became its second caller (direct instruction: module slides
 * may now scroll vertically, and should carry the same cue). The reason it
 * was consumer-only still holds for *why it exists* — this project's note
 * that people living with dementia and their carers should not be relied on
 * to discover content below the fold — but a coach reading a dense
 * `<Text block_3>` slide benefits from the same signal, and forking it would
 * start exactly the drift this project keeps having to undo.
 *
 * Two things generalised on the move, and nothing else:
 * 1. **Which element scrolls.** The consumer portal scrolls the window; the
 *    module player scrolls its own `<main>` (the player is a fixed-height
 *    flex column — only that element overflows). Pass `containerRef` for the
 *    latter; omit it for window scrolling.
 * 2. **Brand.** `variant="consumer"` keeps `consumer-primary`; `variant="app"`
 *    uses `--primary`. The Consumer Portal is on its own brand and nothing
 *    app-wide may leak into it — or the reverse.
 *
 * It is a real `<button>`, not a decorative hint. An affordance that says
 * "scroll" and does nothing when pressed is worse than none, and a
 * keyboard-only user gets the same one-press jump a mouse user gets.
 *
 * Two things it deliberately does NOT do:
 * - It does not animate its own y with `repeat: Infinity` while also being
 *   the thing that moves the page. The bob is a transform on an inner span,
 *   so the button's own hit area stays where the browser put it.
 * - It does not use `scrollIntoView`. This project has fixed three separate
 *   bugs caused by that call scrolling an unexpected ancestor (Rounds 18, 19
 *   and 7.1.2); an explicit `scrollBy` cannot pick the wrong scroller.
 */

/** How much scrollable distance has to remain before the cue appears. Small,
 *  but not zero — a page that overflows by 3px because of a shadow is not a
 *  page with more content on it. */
const REVEAL_THRESHOLD_PX = 48

/**
 * Trailing whitespace the cue must not mistake for content.
 *
 * The module player closes every slide with an empty 40px block behind a 40px
 * gap. Without this the cue appears on a slide whose question, options and
 * Submit button are all already on screen, pointing at 80px of nothing —
 * reported directly, 2026-09-18: *"screens like these should not have scroll to
 * see more, as there is no content below this block"*.
 *
 * Read from the DOM rather than passed in, so the consumer portal — the other
 * caller, which has no such spacer — discounts nothing and is untouched.
 */
const TRAILING_GAP_PX = 40
function trailingSlack(el: Element | null) {
  const tail = el?.querySelector<HTMLElement>('[data-slide-tail]')
  return tail ? tail.offsetHeight + TRAILING_GAP_PX : 0
}

export function ScrollCue({
  containerRef,
  variant = 'consumer',
  className,
}: {
  /** The element that actually scrolls. Omit to measure the window. */
  containerRef?: RefObject<HTMLElement | null>
  variant?: 'consumer' | 'app'
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    const measure = () => {
      const el = containerRef?.current
      const remaining = el
        ? el.scrollHeight - trailingSlack(el) - el.scrollTop - el.clientHeight
        : document.documentElement.scrollHeight -
          trailingSlack(document.documentElement) -
          window.scrollY -
          window.innerHeight
      setHasMore(remaining > REVEAL_THRESHOLD_PX)
    }
    // Layout reads from an observer callback are re-entrant; coalescing them
    // into the next frame keeps a burst of mutations to one measurement.
    let frame = 0
    let settle = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
      // ...and once more after the incoming slide's own entrance animation has
      // finished. The player animates each slide in over 250ms from `y: 16`, so
      // a measurement taken on the very next frame is reading a layout that is
      // still moving. Without this second pass a cue can be decided against
      // mid-transition geometry and then never revisited — which is what "once
      // it detects on a specific page, it stays there" looks like from outside.
      clearTimeout(settle)
      settle = window.setTimeout(measure, 400)
    }
    measure()

    const scroller: HTMLElement | Window = containerRef?.current ?? window
    scroller.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)

    // The content's own height changes without either event firing — a card
    // finishing its entrance animation, an image loading, a slide swapping.
    // Observing the scrolling element covers all of those; without it the cue
    // is decided once, off whatever the layout happened to be on mount.
    const observed = containerRef?.current ?? document.documentElement
    const ro = new ResizeObserver(schedule)
    ro.observe(observed)

    // A slide swap changes the *content's* height while the scroll container
    // itself stays exactly the same size, so observing only the container
    // misses it entirely.
    //
    // ⚠️ Observing `firstElementChild` is NOT enough, and measuring proves it:
    // in the module player the chain under `<main>` is
    //   main (870) > div.h-full (870) > div.h-full (870) > div.my-auto (298)
    // — the first two children are `h-full`, so they are pinned to the
    // container's own height and a ResizeObserver on them can **never** fire
    // for a content change. Only the third box tracks content. So walk a few
    // levels down the first-child chain and observe each: whichever one hugs
    // its content is then covered, without needing to know the caller's markup.
    const OBSERVE_DEPTH = 4
    let watched: Element[] = []
    const watchChain = () => {
      const next: Element[] = []
      let node: Element | null = observed.firstElementChild
      for (let i = 0; i < OBSERVE_DEPTH && node; i++) {
        next.push(node)
        node = node.firstElementChild
      }
      for (const el of watched) if (!next.includes(el)) ro.unobserve(el)
      for (const el of next) if (!watched.includes(el)) ro.observe(el)
      watched = next
    }
    watchChain()

    // Re-point the chain whenever the subtree changes. The player renders its
    // slide as `<motion.div key={stepIndex}>`, so every Next/Previous replaces
    // those nodes — without this the observer is left watching **detached**
    // elements and the cue freezes on whatever the first slide needed.
    const mo = new MutationObserver(() => {
      watchChain()
      schedule()
    })
    mo.observe(observed, { childList: true, subtree: true })

    // Two height changes that fire neither a mutation nor an element resize,
    // and so were invisible to everything above:
    //
    // 1. **A web font swapping in.** Fallback metrics are not Inter's, so text
    //    is a different height until the real face loads. The cue is otherwise
    //    decided against the fallback layout and never revisited — which reads
    //    as "it says scroll when there is nothing to scroll".
    // 2. **A late image.** `load` does not bubble, hence the capture listener.
    document.fonts?.ready.then(schedule).catch(() => {})
    observed.addEventListener('load', schedule, true)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settle)
      scroller.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      observed.removeEventListener('load', schedule, true)
      ro.disconnect()
      mo.disconnect()
    }
  }, [containerRef])

  function jump() {
    const el = containerRef?.current
    if (el) el.scrollBy({ top: el.clientHeight * 0.8, behavior: 'smooth' })
    else window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {hasMore && (
        <motion.button
          key="scroll-cue"
          type="button"
          onClick={jump}
          // A labelled pill, not a bare 44px chevron circle. The first pass was
          // both (direct instruction: "chevron too small, no text there Scroll
          // to see more") — at 44px it was, in the reporter's words, very easy
          // to miss.
          //
          // `shadow-float` rather than `shadow-card` (direct instruction: "use
          // grey shadow for this"). `shadow-card` is the frames' warm gold,
          // which is correct for a card resting on the warm canvas and reads as
          // a smudge on something floating above it.
          className={cn(
            // `fixed` when measuring the window (the consumer portal, where
            // the page itself scrolls); `absolute` when a container scrolls, so
            // the cue pins to that container's own bottom-right rather than the
            // viewport's. The container side needs a positioned ancestor — the
            // player wraps its <main> in `relative` for exactly this.
            containerRef ? 'absolute' : 'fixed',
            'right-6 bottom-6 z-20 flex h-14 items-center gap-2 rounded-3xl border border-parchment bg-white px-6 text-body-md shadow-float outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-offset-2',
            variant === 'consumer'
              ? 'text-consumer-primary focus-visible:ring-consumer-primary'
              : 'text-primary focus-visible:ring-ring',
            className,
          )}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          Scroll to see more
          {/* The bob lives on the glyph, not the button — see the doc note. 5px
              over 1.5s: enough to read as movement on a 20px chevron without
              turning a quiet hint into a bouncing badge. */}
          <motion.span
            className="flex"
            animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
            transition={
              reduceMotion ? undefined : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <ChevronDown aria-hidden="true" className="size-6" />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
