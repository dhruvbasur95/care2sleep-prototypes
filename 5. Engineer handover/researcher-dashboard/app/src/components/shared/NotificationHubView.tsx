import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, CircleAlert, CircleX, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The attention section on Research Home: heading + live alert count above a
 * tinted panel of dismissible notice cards, paginated four at a time.
 *
 * Purely presentational. It takes an already-built item list and has no
 * opinion on what produced it. `ResearchNotificationHub.tsx` is the only
 * caller; it derives the study-wide notice list and supplies the heading.
 *
 * A card is a notice, not a link — the card itself never navigates. Each
 * carries an explicitly labelled CTA instead, pointing at the page a
 * researcher would open to resolve it.
 *
 * ⚠️ DISMISSAL IS COMPONENT-LOCAL `useState` AND IS NOT PERSISTED. Dismissed
 * notices return on any navigation or reload, and "Dismiss all" is purely
 * visual. This will read as a bug to a real researcher; a production build
 * needs per-user dismissal storage.
 *
 * ⚠️ FOUR BEHAVIOURS IN HERE ARE LOAD-BEARING. Each fixes a defect that is
 * invisible until someone uses a keyboard or a screen reader:
 *
 *  1. **Dismiss focus-return.** The pressed button unmounts with its card, so
 *     focus falls to `<body>`. `handleDismiss` moves it to whichever card takes
 *     the dismissed one's slot, or to the heading / `<main>` when the list
 *     empties. See `focusAfterDismiss`.
 *  2. **The `ResizeObserver` skips its own first callback.** `observe()`
 *     guarantees one immediate callback with no real size change; acting on it
 *     races the browser's native focus-driven scroll and drops focus mid-Tab.
 *  3. **The live region stays mounted even when the section hides itself.**
 *     `hideWhenEmpty` returns a bare `sr-only` node rather than `null`, or the
 *     "Dismissed all N alerts." announcement is destroyed in the same tick it
 *     is set.
 *  4. **`shrink-0` on the card CTA.** See its own note — without it flex
 *     compresses a 36px control to 31px.
 */

const PAGE_SIZE = 4

/** One notice.
 *
 *  `severity` is a red/amber/green traffic light the caller uses both to
 *  colour a notice and to order its categories by researcher priority. There
 *  is no sort in this component — items render in the order given.
 *
 *  `icon` is accepted but **not rendered**: every card draws the same
 *  `CircleAlert` glyph, tinted by severity. Kept on the type because callers
 *  set it and it is the obvious hook if per-category glyphs are wanted later.
 *
 *  `tone` is legacy and read by nothing here.
 *
 *  `actionLabel` + `actionTo` draw the card's CTA. Both or neither — an item
 *  missing either renders no CTA at all. */
export interface NotificationItem {
  id: string
  icon: LucideIcon
  message: string
  tone?: 'destructive'
  severity?: 'red' | 'amber' | 'green'
  actionLabel?: string
  actionTo?: string
}

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size))
  return pages
}

/** One notice card: severity icon top-left, dismiss top-right, a two-line
 *  clamped message, and a full-width CTA pinned to the bottom. */
function NotificationItemCard({
  item,
  onDismiss,
  uniformHeight,
}: {
  item: NotificationItem
  onDismiss: () => void
  uniformHeight?: boolean
}) {
  const hasSeverity = item.severity !== undefined

  /** Severity -> icon colour. `alert-pastel` measures 3.45:1 on the white card
   *  and 3.17:1 on the parchment panel — over WCAG 1.4.11's 3:1 floor for a
   *  graphical indicator, which is what this icon is, but with little margin.
   *  Re-measure if the token moves. */
  const severityText =
    item.severity === 'red'
      ? 'text-alert-pastel'
      : item.severity === 'amber'
        ? 'text-amber-800'
        : 'text-success'

  // Severity is otherwise carried only by the colour of an `aria-hidden`
  // glyph, i.e. not conveyed at all to a screen reader. This prefix is the
  // non-visual equivalent and must stay ahead of the message in document
  // order. Do not remove it without giving severity another accessible name.
  const severityLabel = !hasSeverity
    ? ''
    : item.severity === 'red'
      ? 'High priority: '
      : item.severity === 'amber'
        ? 'Medium priority: '
        : 'Low priority: '

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between gap-8 rounded-md border border-purple-300 bg-card p-4 shadow-notice-card',
        // A hard height, not a floor. CSS Grid only equalises within a row, so
        // page 2 of the carousel would otherwise size differently from page 1.
        // Safe because the message is `line-clamp-2` and nothing else here can
        // grow: 32 padding + 20 icon row + 16 gap + ~36 two text lines +
        // 32 gap + 36 CTA = 172. Changing any of those means changing this.
        uniformHeight && 'h-[172px]',
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          {/* One glyph for every card, tinted by severity — uniform shape,
              meaningful colour. This is why `item.icon` is ignored. */}
          <CircleAlert
            aria-hidden="true"
            className={cn('size-5 shrink-0', hasSeverity ? severityText : 'text-alert-pastel')}
            strokeWidth={2}
          />
          <button
            type="button"
            onClick={onDismiss}
            // How `NotificationHubView` finds the next card's dismiss button
            // to focus after this one unmounts. Do not remove.
            data-notif-dismiss={item.id}
            // Every card's dismiss reads "Dismiss" alone otherwise, so a
            // screen reader's button list is four identical entries.
            aria-label={`Dismiss: ${item.message}`}
            // `size-9` = the app's 36px minimum hit area. The visible glyph is
            // 16px; the box around it is the target and must not shrink.
            className="absolute top-1.5 right-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-faint outline-none transition-colors hover:bg-pearl hover:text-ink focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.95]"
          >
            <CircleX aria-hidden="true" className="size-4 text-ink" strokeWidth={2} />
          </button>
        </div>
        <p className="line-clamp-2 pr-6 text-left text-caption text-ink">
          <span className="sr-only">{severityLabel}</span>
          {item.message}
        </p>
      </div>
      {item.actionTo && item.actionLabel && (
        <Link
          to={item.actionTo}
          // ⚠️ Do not remove `shrink-0`. This is a flex child of a
          // fixed-height card, and `h-9` is a height, not a minimum — without
          // it flex-shrink compresses the control to 31px, under the app's
          // 36px floor. Nothing about that is visible in a screenshot.
          className="flex h-9 w-full shrink-0 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
        >
          {item.actionLabel}
          {/* CTAs repeat across cards ("View consumer" four times), so the
              accessible name has to say which notice this one belongs to. */}
          <span className="sr-only"> — {item.message}</span>
        </Link>
      )}
    </div>
  )
}

/** Pages of 4 cards in a horizontally snapping scroll container, with dot
 *  pagination below reflecting real scroll position (not just a static
 *  page-count decoration). */
function NotificationCarousel({
  items,
  onDismiss,
  uniformHeight,
}: {
  items: NotificationItem[]
  onDismiss: (id: string) => void
  uniformHeight?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const pages = chunk(items, PAGE_SIZE)

  function handleScroll() {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  function goToPage(i: number) {
    scrollRef.current?.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: 'smooth' })
  }

  // Why this exists: `scrollLeft` is an absolute pixel offset, so anything
  // that changes the container's width — a window resize, or the sidebar
  // collapsing, which resizes this same column — leaves it stale and the view
  // renders torn between two pages, showing slivers of both. Re-anchor to the
  // current page's offset instantly (no animation) on resize.
  //
  // ⚠️ Do not remove the `isFirstCallback` skip. `ResizeObserver` fires one
  // guaranteed callback immediately after `observe()` with no real size
  // change, and this effect re-runs on every page change including first
  // mount. That unprompted `scrollTo` races the browser's own focus-driven
  // scroll — the thing that carries a Tab press into an off-screen page-2
  // card — and focus lands on `<body>` instead of the next dismiss button.
  // The flag is per observer instance, not per mount, which is what makes it
  // correct across re-runs.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let isFirstCallback = true
    const observer = new ResizeObserver(() => {
      if (isFirstCallback) {
        isFirstCallback = false
        return
      }
      el.scrollTo({ left: page * el.clientWidth, behavior: 'auto' })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [page])

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {pages.map((pageItems, i) => (
          <div
            key={i}
            // `p-1` is not spacing — it is clearance for the cards' own
            // shadow, which an `overflow-x-auto` parent clips on all four
            // sides (the spec forces `overflow-y: auto` too).
            className="grid w-full shrink-0 content-start grid-cols-1 gap-4 p-1 snap-start sm:grid-cols-2 xl:grid-cols-4"
          >
            {pageItems.map((item) => (
              <NotificationItemCard
                key={item.id}
                item={item}
                onDismiss={() => onDismiss(item.id)}
                uniformHeight={uniformHeight}
              />
            ))}
          </div>
        ))}
      </div>
      {pages.length > 1 && (
        // Each dot is a `<span>` inside a padded `<button>`, so the control has
        // a real hit area without the padding inflating the visual gap between
        // dots.
        //
        // `mt-2` looks too tight authored and is correct painted: the row's own
        // hit-area padding contributes ~11px above the 6px bar, so the visual
        // gap is ~19px, not 8. Size this off measured pixels, not the class.
        <div className="mt-2 flex items-center justify-center gap-1">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPage(i)}
              aria-label={`Page ${i + 1} of ${pages.length}`}
              aria-current={i === page}
              // `py-2.5`, not `py-2`: `py-2` measures a 22px hit area, 2px
              // under WCAG 2.2's 24x24 target minimum (2.5.8). The visible bar
              // is unaffected — this is padding only.
              className="flex items-center rounded-sm px-1 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'block h-1.5 rounded-full transition-all duration-200',
                  i === page ? 'w-5 bg-primary' : 'w-1.5 bg-purple-300 hover:bg-purple-400',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** The panel's empty state.
 *
 *  Unreachable today: the only caller passes `hideWhenEmpty`. Kept because
 *  that flag is opt-in, and a caller without it would otherwise render a blank
 *  tinted panel. */
function ResearchEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-8 text-primary" strokeWidth={1.75} />
      </span>
      <p className="text-body font-semibold text-ink">You're all caught up</p>
      <p className="text-caption text-ink-faint">Nothing needs your attention right now.</p>
    </div>
  )
}

export function NotificationHubView({
  title = 'Notifications',
  items: allItems,
  uniformHeight,
  hideWhenEmpty = false,
  onEmptyChange,
}: {
  title?: string
  items: NotificationItem[]
  /** Fixes each notice card to a uniform height regardless of message length. */
  uniformHeight?: boolean
  /**
   * When there is nothing left to show, remove the whole section — heading,
   * badge and panel — rather than leaving an "all caught up" state behind.
   */
  hideWhenEmpty?: boolean
  /**
   * Fires whenever the visible-item count crosses to or from zero.
   *
   * `hideWhenEmpty` removes this section's box but cannot remove the *gap* its
   * parent reserves after it, and dismissal state is internal here so the page
   * has no other way to know. `ResearchHomePage` uses this to drop that margin
   * and let the page close up.
   */
  onEmptyChange?: (isEmpty: boolean) => void
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  // Removing a DOM node is silent to a screen reader. This feeds the `sr-only`
  // live region below so a dismiss is announced.
  const [lastDismissedMessage, setLastDismissedMessage] = useState('')
  const items = allItems.filter((item) => !dismissed.has(item.id))

  // ⚠️ Focus management for dismissal. The pressed button unmounts with its
  // card, so without this `document.activeElement` is `<body>` — no focus
  // ring, no keyboard position. Browsers sometimes recover on the next Tab;
  // that is a heuristic, not a guarantee. Move focus to whichever card takes
  // the dismissed one's slot, falling back to the previous card, then to the
  // heading (or `<main>`) once the list empties.
  const rootRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [focusAfterDismiss, setFocusAfterDismiss] = useState<string | null>(null)

  useEffect(() => {
    if (focusAfterDismiss === null) return
    if (focusAfterDismiss === '') {
      // `''` means "the list is now empty, send focus to the hub heading".
      //
      // Under `hideWhenEmpty` that heading has unmounted too, so the ref is
      // null and focusing it silently does nothing — which is the very defect
      // this block exists to prevent. `<main>` always outlives the section and
      // is where a keyboard user should land when the thing they were acting
      // on disappears. It is focusable only because `ResearchShell` puts
      // `tabIndex={-1}` on it.
      const fallback = document.getElementById('main-content')
      ;(headingRef.current ?? fallback)?.focus({ preventScroll: true })
    } else
      rootRef.current
        ?.querySelector<HTMLElement>(`[data-notif-dismiss="${CSS.escape(focusAfterDismiss)}"]`)
        ?.focus()
    setFocusAfterDismiss(null)
  }, [focusAfterDismiss])

  function handleDismiss(id: string) {
    const index = items.findIndex((i) => i.id === id)
    const item = items[index]
    if (item) setLastDismissedMessage(`Dismissed: ${item.message}`)
    const remaining = items.filter((i) => i.id !== id)
    const next = remaining[index] ?? remaining[index - 1]
    setFocusAfterDismiss(next ? next.id : '')
    setDismissed((prev) => new Set(prev).add(id))
  }

  /** Clears every currently-visible notice.
   *
   *  ⚠️ The `setFocusAfterDismiss('')` is required, not tidy-up: this button
   *  unmounts *itself* along with the cards, so without it focus falls to
   *  `<body>`. `''` is this component's existing "send it to the heading"
   *  signal — reuse it rather than adding a second path.
   *
   *  Announced through the same live region as a single dismiss, with a count
   *  rather than a message, since there is no one message to name. */
  function handleDismissAll() {
    if (items.length === 0) return
    setLastDismissedMessage(
      `Dismissed all ${items.length} ${items.length === 1 ? 'alert' : 'alerts'}.`,
    )
    setFocusAfterDismiss('')
    setDismissed(new Set(allItems.map((i) => i.id)))
  }

  const liveRegion = (
    <p role="status" aria-live="polite" className="sr-only">
      {lastDismissedMessage}
    </p>
  )

  // Reported from an effect, never during render — calling a parent's setState
  // mid-render triggers React's "Cannot update a component while rendering a
  // different component" warning. Keyed on the boolean, not `items.length`, so
  // it fires only on the 0 <-> non-zero crossing.
  const isEmpty = items.length === 0
  useEffect(() => {
    onEmptyChange?.(isEmpty)
  }, [isEmpty, onEmptyChange])

  // ⚠️ Deliberately not `return null`. The live region must stay mounted or the
  // "Dismissed all N alerts." announcement is destroyed in the same tick it is
  // set, and the user gets silence for the action they just took. An `sr-only`
  // paragraph has no visual footprint, so the section is gone on screen while
  // the announcement still lands.
  if (hideWhenEmpty && items.length === 0) {
    return <div ref={rootRef}>{liveRegion}</div>
  }

  // The heading and alert count sit *outside* the tinted panel. The panel is a
  // plain tinted div, not a `Card` — it has no outline and no header band,
  // because its header is above it.
  return (
    <div ref={rootRef}>
      {liveRegion}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-title text-ink outline-none">
          {title}
        </h2>
        {items.length > 0 && (
          // ⚠️ KNOWN, ACCEPTED CONTRAST FAILURE — white on `alert-pastel`
          // (#e45f5b) measures 3.45:1, under WCAG AA's 4.5:1. 14px/500 is not
          // "large text" (that begins at 18.66px bold / 24px regular), so the
          // bar is 4.5:1. This was requested explicitly over an earlier
          // `text-ink` treatment that cleared at 4.88:1.
          //
          // Two one-line fixes if it is ever revisited: keep white and deepen
          // the fill to #cc4340 (4.73:1, still softer than `destructive`), or
          // go back to `text-ink`. Recorded rather than silently shipped.
          //
          // Do not add a tracking override on the badge — `caption-medium`
          // carries its own, and a hardcoded value opts out of the token.
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-alert-pastel px-2.5 py-1 text-caption-medium text-white">
              {items.length} {items.length === 1 ? 'alert' : 'alerts'}
            </span>
            {/* Two rules encoded here that apply to any low-emphasis control
                sitting directly on the page canvas:

                1. Transparent fill, NOT the app's `bg-pearl` utility button.
                   `pearl` (#f5f5f7) is a cool grey and the page canvas
                   (#fffcfa) is warm, so a pearl chip on the canvas reads as a
                   foreign patch. Inside a white card, where `pearl` normally
                   lives, there is no clash.
                2. Hover is `purple-50`, not `primary/5`. 5% of #4a278f over
                   the canvas composites to about a 9-per-channel shift —
                   present in the DOM, invisible on screen, and correctly
                   reported as "no hover state". An opacity that small is a
                   rounding error, not a state change.

                `h-9` applies even though this reads as a small inline action:
                the 36px floor has no exceptions. */}
            <button
              type="button"
              onClick={handleDismissAll}
              className="inline-flex h-9 shrink-0 items-center rounded-sm px-3 text-caption-medium text-primary underline-offset-4 outline-none transition-colors hover:bg-purple-50 hover:underline focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Dismiss all
            </button>
          </div>
        )}
      </div>
      {/* The asymmetric padding (`pt-6 pb-3`) is correct and looks even: the
          dot row carries ~11px of its own transparent hit-area padding, so
          12 + 11 = 23px painted at the bottom against 24px at the top.
          Equalising the authored values would paint a visibly heavier bottom
          edge. */}
      <div className="mt-6 rounded-lg bg-parchment px-6 pt-6 pb-3">
        {items.length === 0 ? (
          <ResearchEmptyState />
        ) : (
          <NotificationCarousel items={items} onDismiss={handleDismiss} uniformHeight={uniformHeight} />
        )}
      </div>
    </div>
  )
}
