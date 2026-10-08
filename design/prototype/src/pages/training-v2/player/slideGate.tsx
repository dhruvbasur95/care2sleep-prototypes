import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * Slide gating — when the footer's "Next slide" becomes active.
 *
 * ## The rule
 * A slide is not finished simply because it is on screen. Direct instruction,
 * 2026-09-18: *"add a detection point for when a slide next button becomes
 * active. Where a user needs to read or watch something, use scroll as a
 * detection point, and where a user needs to interact with components to
 * activate it. only last slide button should not be triggered."*
 *
 * So there are exactly two kinds of gate, and a slide can carry both:
 *
 * | Gate | Satisfied by |
 * |---|---|
 * | **scroll** | reaching the bottom of a slide that actually overflows |
 * | **interaction** | one gated block reporting itself done |
 *
 * A slide is ready when **every** gate registered on it is satisfied. Slide 22
 * (`s23-ch3-your-turn-1`) carries two Your-turn blocks, so a single boolean
 * would have let a coach past after answering one of them.
 *
 * ## Why a context and not props
 * `BlockView` is a discriminated union of ~14 tags rendered by one renderer.
 * Threading a callback down to the three or four tags that gate would mean
 * every block type carrying a prop it has no opinion about, and re-plumbing the
 * union each time a block is added — the same reasoning `BlockSlide` already
 * records for locating the slide heading by attribute rather than by ref chain.
 * Here a block **opts in** by calling `useSlideGate()`; a block that never calls
 * it is never counted, so adding an inert block cannot accidentally gate a
 * slide.
 *
 * (It is a context rather than `BlockSlide`'s own `data-*` + `MutationObserver`
 * because the gate state is real application state, and an observer version is
 * untyped and fails silently when an attribute is misspelled.)
 *
 * ## Latching — read this before "fixing" it
 * A gate, once satisfied, **stays satisfied for the rest of the session**, keyed
 * by slide id. Two concrete failures make this necessary rather than merely
 * kind:
 *
 * 1. The outline rail navigates backwards. Without latching, re-reading an
 *    earlier chapter re-locks work the coach has already done, and they have to
 *    flip every card again to get back to where they were.
 * 2. Revealing content **adds height below the coach**. Opening an accordion
 *    drawer or a You-Might-Also-Hear answer grows the slide, so a scroll gate
 *    that was satisfied a moment ago would silently un-satisfy itself — the
 *    Next button would go dead as a direct result of the coach interacting with
 *    the slide, which is precisely backwards.
 *
 * Session-scoped deliberately: it is `useRef` in the provider's owner, not
 * `localStorage`. Gating is about attention within a sitting, and persisting it
 * would mean a coach who returns tomorrow is waved past content they have not
 * looked at in this sitting. `moduleProgressStore` still persists the step
 * index, which is the thing that genuinely should survive a reload.
 */

/** A gate's identity within one slide. Blocks pass a stable string; the
 *  provider namespaces it by the block's own index so two of the same block
 *  type on one slide (step 22) cannot collide. */
export type GateId = string

interface SlideGateContextValue {
  /** Register this gate as existing and unsatisfied. Idempotent. */
  register: (id: GateId) => void
  /** Report this gate done. Latched — calling it twice is free, and no caller
   *  can un-satisfy a gate. */
  satisfy: (id: GateId) => void
}

const SlideGateContext = createContext<SlideGateContextValue | null>(null)

/**
 * Declare an interaction gate from inside a block.
 *
 * ```tsx
 * const gate = useSlideGate('revision')
 * // ...when every card has been flipped:
 * useEffect(() => { if (allFlipped) gate.satisfy() }, [allFlipped, gate])
 * ```
 *
 * Safe outside a provider: the Figma-mirror and any future standalone preview
 * render these blocks with no player around them, and a block that throws there
 * would be a worse outcome than one that simply does not gate.
 */
export function useSlideGate(id: GateId) {
  const ctx = useContext(SlideGateContext)
  const idRef = useRef(id)
  idRef.current = id

  useEffect(() => {
    ctx?.register(idRef.current)
    // Registration is per gate id, for the life of the block. Re-running it on
    // every render would be harmless (it is idempotent) but pointless.
  }, [ctx])

  const satisfy = useCallback(() => ctx?.satisfy(idRef.current), [ctx])

  return useMemo(() => ({ satisfy }), [satisfy])
}

/**
 * Why a slide's Next button is currently disabled — surfaced to the coach, not
 * only to a screen reader.
 *
 * This portal's audience is explicitly not digitally literate, so a button that
 * is simply dead is a dead end: there is nothing on screen saying what would
 * make it live. `null` means nothing is outstanding.
 */
export type GateReason = 'scroll' | 'interaction' | null

export interface SlideGateState {
  ready: boolean
  reason: GateReason
}

/**
 * Owns one slide's gates and reports the slide's readiness.
 *
 * `scrollSatisfied` is passed in rather than measured here: the scrolling
 * element is `<main>`, which belongs to `ModulePlayerPage`, not to the slide.
 */
/**
 * Latched gate ids, keyed by slide id, for this page load.
 *
 * **Module-scoped, not a ref inside the provider.** The provider is remounted
 * per slide (see `key` at its call site in `BlockSlide`), so anything held in
 * its own state or refs dies with the slide — which is exactly what latching
 * has to survive. This project has the same rule written down for the delivery
 * portal's onboarding flag: a value that must outlive a remount cannot live in
 * the component that remounts.
 *
 * Not `localStorage`, deliberately: gating is about attention within a sitting,
 * and persisting it would wave a coach past content they have not looked at
 * today. The step index is the thing that genuinely should survive a reload,
 * and `moduleProgressStore` already persists that.
 */
const latchedGates = new Map<string, Set<GateId>>()

/** The scroll gate's reserved id, so it latches through the same map as the
 *  interaction gates rather than needing a parallel mechanism. */
const SCROLL_GATE_ID = '__scroll__'

export function SlideGateProvider({
  slideId,
  scrollSatisfied,
  onStateChange,
  children,
}: {
  slideId: string
  /** `true` when the slide does not meaningfully overflow, or when the coach
   *  has reached its bottom. See `useScrollGate`. */
  scrollSatisfied: boolean
  onStateChange: (state: SlideGateState) => void
  children: ReactNode
}) {
  const [registered, setRegistered] = useState<Set<GateId>>(() => new Set())
  const [satisfied, setSatisfied] = useState<Set<GateId>>(
    () => new Set(latchedGates.get(slideId) ?? []),
  )

  /**
   * ⚠️ There is deliberately **no effect here resetting these sets on a slide
   * change**, and reintroducing one reopens a real bug this round shipped and
   * caught by walking the module.
   *
   * React runs a child's effects **before its parent's**. A block calls
   * `useSlideGate` in its own effect, so on mount the sequence was: block
   * registers its gate → provider's `[slideId]` effect clears the set it was
   * just added to. Every interaction gate vanished, and every slide unlocked on
   * scroll alone — the You-Might-Also-Hear and revision slides waved a coach
   * through without a single reveal. It looked correct on screen, because a
   * gate that never registers is indistinguishable from one already satisfied.
   *
   * The provider is keyed by slide id at its call site instead, so React
   * discards and rebuilds this state on a slide change with no ordering to get
   * wrong.
   */

  const register = useCallback((id: GateId) => {
    setRegistered((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  const satisfy = useCallback(
    (id: GateId) => {
      const forSlide = latchedGates.get(slideId) ?? new Set<GateId>()
      forSlide.add(id)
      latchedGates.set(slideId, forSlide)
      setSatisfied((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
    },
    [slideId],
  )

  // The scroll half latches through the same map, so returning to a slide the
  // coach has already read does not ask them to scroll it again.
  useEffect(() => {
    if (scrollSatisfied) satisfy(SCROLL_GATE_ID)
  }, [scrollSatisfied, satisfy])
  const scrollDone = scrollSatisfied || satisfied.has(SCROLL_GATE_ID)

  const interactionsDone = useMemo(
    () => [...registered].every((id) => satisfied.has(id)),
    [registered, satisfied],
  )

  // Interaction outranks scroll in the message, because it is the more specific
  // instruction: a coach stuck on a Your-turn slide needs to be told to answer,
  // not to scroll. Where both are outstanding, scrolling is usually how they
  // reach the thing to interact with anyway.
  const ready = interactionsDone && scrollDone
  const reason: GateReason = ready ? null : !interactionsDone ? 'interaction' : 'scroll'

  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange
  useEffect(() => {
    onStateChangeRef.current({ ready, reason })
  }, [ready, reason])

  const value = useMemo(() => ({ register, satisfy }), [register, satisfy])

  return <SlideGateContext.Provider value={value}>{children}</SlideGateContext.Provider>
}

/**
 * How far past its own height a slide must extend before it counts as
 * scrollable — and how close to the bottom counts as "reached it".
 *
 * **8px, and this number is load-bearing.** Measured across all 32 steps of
 * Module 6 at 1512x900 (a 720px content area), ten of them report a
 * `scrollHeight` of exactly `clientHeight + 1`: steps 6, 7, 8, 15, 16, 23, 25,
 * 27, 29 and 31. That 1px is sub-pixel layout rounding, not content — there is
 * no scrollbar and nothing to scroll to. A naive `scrollHeight > clientHeight`
 * test gates all ten on an action the coach cannot perform, which is a dead
 * Next button with no way out of it.
 *
 * The same slack is allowed at the bottom, where a fractional `scrollTop` on a
 * trackpad otherwise leaves the gate a pixel short of closing.
 */
export const SCROLL_GATE_TOLERANCE_PX = 8

/** How long a "this slide fits" measurement has to hold before the gate trusts
 *  it. Long enough for an image decode and the slide's own 250ms enter
 *  animation, short enough that a genuinely short slide does not feel locked. */
const SETTLE_MS = 400

/**
 * The gap the slide column puts in front of its trailing spacer (`space-y-10`).
 * Counted with the spacer itself, because a 40px gap leading to an empty 40px
 * box is 80px of deliberate negative space, not 80px of content.
 */
const SLIDE_BLOCK_GAP_PX = 40

/**
 * How much of a slide's scroll height is trailing whitespace rather than
 * content.
 *
 * Every slide closes with an empty 40px `BlockBox` (`BlockSlide`), and the
 * column's own 40px gap sits in front of it — 80px of nothing at the end of
 * every slide. Direct instruction, 2026-09-18: *"do not treat empty block
 * container as content"*, after a Your-turn slide showed "Scroll to see more"
 * with the question, its options and Submit all already on screen.
 *
 * Measured off the marked element rather than hardcoded to 80, so a slide with
 * no spacer (the two shell steps, which are not `BlockSlide`) correctly
 * discounts nothing.
 */
export function trailingSlackPx(el: HTMLElement) {
  const tail = el.querySelector<HTMLElement>('[data-slide-tail]')
  return tail ? tail.offsetHeight + SLIDE_BLOCK_GAP_PX : 0
}

/**
 * The scroll half of the gate, for the element that actually scrolls.
 *
 * Lives beside the player rather than in `BlockSlide` because `<main>` is the
 * scroll container and it belongs to `ModulePlayerPage`.
 *
 * Re-measures on scroll **and on resize of the content**: a slide's height
 * changes after mount when an accordion drawer opens or a reveal expands, and
 * a slide that fits on arrival can stop fitting. `ResizeObserver` on the
 * content rather than a window listener, because the window need not change
 * for the content to.
 */
export function useScrollGate(
  containerRef: React.RefObject<HTMLElement | null>,
  /** Re-arms the gate. Pass the current slide's id. */
  slideKey: string,
) {
  const [satisfied, setSatisfied] = useState(false)

  /**
   * Re-armed **during render**, not in the effect below, and that distinction is
   * the whole bug this fixes.
   *
   * Effects run after the commit, so for one render after a slide change this
   * hook still returned the *previous* slide's value. The player passes it
   * straight down as `scrollSatisfied`, the freshly-keyed `SlideGateProvider`
   * saw `true` on its very first render, and its latch wrote that into
   * `latchedGates` permanently. Net effect: scroll to the bottom of any slide
   * and the next one arrived already unlocked, however long it was — measured
   * on steps 1, 2, 3 and 5 of Module 6 with 852, 946, 2348 and 2017px of
   * genuine overflow.
   *
   * Setting state during render is React's own documented pattern for
   * "reset state when a prop changes"; React discards the render and
   * immediately re-runs the component, so no stale value ever escapes.
   */
  const [armedFor, setArmedFor] = useState(slideKey)
  if (armedFor !== slideKey) {
    setArmedFor(slideKey)
    setSatisfied(false)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Latched: once true for this slide it stays true until `slideKey` changes.
    // Revealing content grows the slide *below* the coach, and re-locking the
    // button because they opened a drawer would punish the exact interaction
    // the slide is asking for.
    let done = false
    let settle: ReturnType<typeof setTimeout> | undefined

    function measure(node: HTMLElement) {
      // The slide's trailing spacer is not content, so both the "does this
      // overflow at all" test and the "have they reached the end" test run
      // against the bottom of the *last real block*.
      const contentHeight = node.scrollHeight - trailingSlackPx(node)
      return {
        overflow: contentHeight - node.clientHeight,
        atBottom:
          node.scrollTop + node.clientHeight >= contentHeight - SCROLL_GATE_TOLERANCE_PX,
      }
    }

    function finish() {
      done = true
      if (settle) clearTimeout(settle)
      setSatisfied(true)
    }

    function check() {
      const node = containerRef.current
      if (!node || done) return
      const { overflow, atBottom } = measure(node)

      // Reaching the bottom is unambiguous and settles it immediately.
      if (atBottom && overflow > SCROLL_GATE_TOLERANCE_PX) return finish()

      /**
       * "This slide fits, so there is nothing to scroll" is the other way the
       * gate opens — and it **must not be trusted at mount**.
       *
       * A slide's height is not final when it first commits: the chapter-opening
       * slide's quote bubbles are images, and until they decode the column is
       * short enough to look like it fits. Measured, step 2 of Module 6 reported
       * no overflow on arrival and 946px a moment later, so the gate opened on a
       * slide with a full screen of unread content below the fold.
       *
       * So a "fits" reading has to hold still before it counts. Every size or
       * scroll event restarts the timer; only a measurement that is still
       * "fits" after the slide has stopped changing satisfies the gate. Reaching
       * the bottom, above, needs no such wait — it cannot be a false positive.
       */
      if (overflow <= SCROLL_GATE_TOLERANCE_PX) {
        if (settle) clearTimeout(settle)
        settle = setTimeout(() => {
          const now = containerRef.current
          if (!now || done) return
          if (measure(now).overflow <= SCROLL_GATE_TOLERANCE_PX) finish()
        }, SETTLE_MS)
      } else if (settle) {
        // It grew past the tolerance while we were waiting — it does not fit
        // after all, and the coach owes it a scroll.
        clearTimeout(settle)
        settle = undefined
      }
    }

    const raf = requestAnimationFrame(check)

    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    // The scrolled content, not only the viewport: `<main>`'s own box does not
    // change when the slide inside it grows.
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    // Images are the specific thing that changes height after mount, and they
    // do not always trigger a resize the observer sees in time.
    el.querySelectorAll('img').forEach((img) => img.addEventListener('load', check))

    return () => {
      cancelAnimationFrame(raf)
      if (settle) clearTimeout(settle)
      el.removeEventListener('scroll', check)
      el.querySelectorAll('img').forEach((img) => img.removeEventListener('load', check))
      ro.disconnect()
    }
  }, [containerRef, slideKey])

  return satisfied
}
