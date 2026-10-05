import { useEffect } from 'react'

/**
 * Lock page scroll behind an overlay — **ref-counted**, so nested overlays
 * cannot leak.
 *
 * ## The bug this replaces
 * Four components had each grown their own copy of the same effect: capture
 * `documentElement.style.overflow`, set `'hidden'`, restore the captured value
 * on cleanup. Each is correct **alone** and they are wrong **together**, which
 * is why it survived four rounds of review.
 *
 * A modal opened over `DeliveryTour` captures `'hidden'` — the tour's value,
 * not the page's. When the modal closes it faithfully restores `'hidden'`, and
 * the page is left unscrollable with nothing on screen to explain why. The
 * same happens to the consumer menu drawer over the consumer tour.
 *
 * Counting fixes it: the **first** locker records the real page value, every
 * later one adds to the count, and only the **last** unlock restores. Nobody
 * captures a value another overlay wrote.
 *
 * ## Why `overflow: hidden` rather than a wheel blocker
 * It stops *user* scrolling while leaving **programmatic** scrolling intact —
 * `.focus()`, `scrollIntoView`, and the coachmark tour's own placement all
 * depend on the latter. A wheel/touch handler would have to allow those
 * through by guesswork.
 *
 * The body padding compensates for the removed scrollbar, without which the
 * page jumps ~15px wider the instant an overlay opens — which also moves every
 * anchor a coachmark tour is about to measure.
 */

let locks = 0
let restore: { overflow: string; paddingRight: string } | null = null

function lock() {
  locks += 1
  if (locks > 1) return

  const root = document.documentElement
  /* Measured before anything changes: once `overflow: hidden` is on,
     `clientWidth` already includes the reclaimed scrollbar. */
  const scrollbar = window.innerWidth - root.clientWidth
  restore = { overflow: root.style.overflow, paddingRight: document.body.style.paddingRight }
  root.style.overflow = 'hidden'
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
}

function unlock() {
  locks = Math.max(0, locks - 1)
  if (locks > 0 || !restore) return

  document.documentElement.style.overflow = restore.overflow
  document.body.style.paddingRight = restore.paddingRight
  restore = null
}

/**
 * Hold a scroll lock for as long as `active` is true.
 *
 * Mount the hook unconditionally and pass the overlay's own open flag — a hook
 * called conditionally is a rules-of-hooks error, and an unmount while locked
 * still releases through the cleanup.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    lock()
    return unlock
  }, [active])
}
