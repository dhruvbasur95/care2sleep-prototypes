import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

/**
 * "There is more below" cue — a downward chevron pinned near the bottom of the
 * viewport that bobs gently and disappears once there is nothing left to scroll
 * to (direct instruction: "add a scroll down button to see more. Add an arrow
 * that is pointing downward, and moving up and down to let user know they need
 * to scroll down. it hides when there is no content below").
 *
 * Consumer Portal only, and worth saying why rather than putting it in
 * `components/shared`: this project has an explicit note that this portal's
 * audience — people living with dementia and their carers — should not be
 * relied on to discover content below the fold. A researcher reading a dense
 * table does not need to be told a page scrolls; a carer meeting this page for
 * the first time might.
 *
 * It is a real `<button>`, not a decorative hint. An affordance that says
 * "scroll" and does nothing when pressed is worse than none, and a
 * keyboard-only user gets the same one-press jump a mouse user gets.
 *
 * Two things it deliberately does NOT do:
 * - It does not animate its own y with `repeat: Infinity` while also being the
 *   thing that moves the page. The bob is a transform on an inner span, so the
 *   button's own hit area stays where the browser put it.
 * - It does not use `scrollIntoView`. This project has fixed three separate
 *   bugs caused by that call scrolling an unexpected ancestor (Rounds 18, 19
 *   and 7.1.2); an explicit `window.scrollBy` cannot pick the wrong scroller.
 */

/** How much scrollable distance has to remain before the cue appears. Small,
 *  but not zero — a page that overflows by 3px because of a shadow is not a
 *  page with more content on it. */
const REVEAL_THRESHOLD_PX = 48

export function ScrollCue() {
  const reduceMotion = useReducedMotion()
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    const measure = () => {
      const doc = document.documentElement
      const remaining = doc.scrollHeight - window.scrollY - window.innerHeight
      setHasMore(remaining > REVEAL_THRESHOLD_PX)
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    // The page's own height changes without either event firing — a card
    // finishing its entrance animation, an image loading, a banner being
    // dismissed. Observing the document element covers all of those; without it
    // the cue is decided once, off whatever the layout happened to be on mount.
    const ro = new ResizeObserver(measure)
    ro.observe(document.documentElement)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
  }, [])

  return (
    <AnimatePresence>
      {hasMore && (
        <motion.button
          key="scroll-cue"
          type="button"
          onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
          // A labelled pill, not a bare 44px chevron circle. The first pass was
          // both (direct instruction: "chevron too small, no text there Scroll
          // to see more") — at 44px over the purple learning card it was, in the
          // reporter's words, very easy to miss. For this portal's audience an
          // icon-only affordance was the wrong choice to begin with: the project
          // note for these users is explicitly plain language, no icon-only
          // cues, big targets.
          //
          // `shadow-float` rather than `shadow-card` (direct instruction: "use
          // grey shadow for this"). `shadow-card` is the frames' warm gold
          // `rgba(230,194,127,0.2)`, which is correct for a card resting on the
          // warm canvas and reads as a smudge on something floating above it —
          // the same call Round 30 made for the coach sidebar. `shadow-float` is
          // this app's own existing neutral `3px 5px 30px rgba(0,0,0,0.22)`, so
          // no new token is needed.
          // Bottom-right, not bottom-centre (direct instruction: "move the
          // scroll more chevron to right of the page"). Centred, it sat directly
          // over the learning card's own CTA — two controls stacked on one spot,
          // one of them floating. The right gutter is empty at every width this
          // page is laid out for.
          className="fixed right-6 bottom-6 z-20 flex h-14 items-center gap-2 rounded-3xl border border-parchment bg-white px-6 text-body-md text-consumer-primary shadow-float outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
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
              reduceMotion
                ? undefined
                : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <ChevronDown aria-hidden="true" className="size-6" />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
