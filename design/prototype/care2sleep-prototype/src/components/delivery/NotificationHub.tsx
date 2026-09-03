import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarPlus,
  CheckCircle2,
  CircleAlert,
  CircleX,
  NotebookPen,
  TriangleAlert,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { dyadHealthAlerts } from '@/pages/research/ConsumerDetailPage'
import {
  isPlanSet,
  nextPlannedSession,
  type ConsumerDyad,
  type SessionCompletionRecord,
  type SessionPlan,
} from '@/data/spaces'
import { useResearch } from '@/data/research-context'
import { formatDate, TODAY } from '@/data/format'

/**
 * Coach Delivery Portal Home, left column — replaces the generic Gmail/
 * Calendar/Zoom/Coach Training Portal shortcut widget grid (removed per
 * direct feedback: "coaches won't be needing any widgets"). A real,
 * data-driven notification center rather than a decorative tile grid:
 * surfaces what needs the coach's attention across their whole caseload
 * (missing session plans, reflections ready to add, Fitbit/diary sync
 * gaps, upcoming Zoom sessions).
 *
 * Visual structure borrows a "tinted outer container holding individually
 * elevated item cards" idea (a travel-booking rewards page was shown as a
 * pure structural reference, not a content/color source), iterated twice on
 * direct feedback:
 * - Pass 1 used this app's sanctioned blue accent (`bg-primary/5` + a visible
 *   ring) in a vertically-stacked list of wide rows — rejected as too blue/
 *   bordered and too list-like.
 * - Pass 2 moved to a green tint + a 2-3 column grid of square tiles, each a
 *   `<Link>` straight to the consumer — rejected on three more points: no
 *   redirect (these are notices, not navigation), too many same-size icons
 *   dominating each tile, and the plain grid should be a paginated 2x2
 *   carousel instead of an open-ended grid.
 *
 * Current shape: a green tint (a new, deliberately-scoped one-off exception,
 * same category as `diary-green`/`badge-purple` in design-tokens.md §1 —
 * confirmed directly, not silently reached for), no ring/border anywhere in
 * the section. Items are plain (non-navigating) cards — small icon top-left,
 * left-aligned message below, a real dismiss (X) control top-right backed by
 * local component state — laid out 2x2 per "page" inside a horizontally
 * snapping scroll container with dot pagination below. Sync/diary alerts
 * keep `text-destructive` (already the app-wide color for this exact alert
 * concept, see `ConsumerDetailPage.tsx`/`ConsumerShell.tsx`) so real urgency
 * still stands out against the calmer green tiles.
 */

const PAGE_SIZE = 4

/**
 * Which chassis this hub renders as. `'delivery'` is the original Round 18
 * shape (green-tinted `Card`, header icon + subtitle inside it, 2x2 tile
 * pages, dot pagination) and stays the default so the Coach Delivery Portal's
 * own call site is untouched. `'research'` is the Round 21 Figma frame's
 * "Items that need your attention" section: the heading and an alert-count
 * badge sit *outside* a neutral `parchment` container, tiles run 4-across in
 * one row, and pagination is a pair of pill bars rather than dots.
 *
 * Threading one prop rather than six (a tint override, a header-layout flag, a
 * grid-shape flag, a pagination-style flag, a card-shape flag, a CTA flag) is
 * the deliberate trade here: the two layouts diverge visually but share every
 * piece of behaviour that took two accessibility rounds to get right —
 * dismiss focus-return, the `aria-live` announcement, and the carousel's
 * `ResizeObserver` re-anchor. Forking the component would have duplicated all
 * three.
 */
type HubLayout = 'delivery' | 'research'

function dyadTitle(dyad: ConsumerDyad): string {
  return dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name
}

/** Shared item shape — also reused by `ResearchNotificationHub.tsx` (Research
 *  Dashboard "My Home", Round 20), which builds a study-wide notice list
 *  from trainees/consumers instead of one coach's caseload but renders
 *  through the exact same carousel/card/dismiss chassis below.
 *
 *  `severity` (Round 20.2) is a Research-Dashboard-only addition: a
 *  red/amber/green traffic-light classification `ResearchNotificationHub.tsx`
 *  sets to both color and re-sort its 5 notice categories by researcher
 *  priority. It's additive and optional precisely so this file's own
 *  `buildNotifications` below — the Coach Delivery Portal's generator, which
 *  never sets it — is untouched: every Delivery Portal item still renders via
 *  the `tone`-only path with zero visual or behavioral change.
 *
 *  `actionLabel`/`actionTo` (Round 21) are likewise Research-Dashboard-only
 *  and likewise optional: the supplied Figma frame draws each attention card
 *  with its own full-width CTA under the message. Round 18's standing rule
 *  that "these are notices, not navigation" is about the *tile itself* not
 *  being a link — an explicit, labelled CTA is a different affordance, and
 *  every research notice category has a real destination to send a researcher
 *  to (the flagged trainee, the unassigned consumer), so these are real links
 *  rather than inert buttons. Items with no `actionTo` simply render no CTA. */
export interface NotificationItem {
  id: string
  icon: LucideIcon
  message: string
  tone?: 'destructive'
  severity?: 'red' | 'amber' | 'green'
  actionLabel?: string
  actionTo?: string
}

/** Maps a coach's caseload to a flat, prioritized notification list —
 *  gaps (most urgent) → reflections-ready → upcoming Zoom sessions →
 *  missing plans. Each category is skipped per-dyad when it doesn't
 *  apply — never a fake or empty placeholder item. Pagination (below)
 *  handles however many real items this produces, so there's no cap here. */
function buildNotifications(
  dyads: ConsumerDyad[],
  sessionPlans: Record<string, SessionPlan>,
  sessionCompletion: Record<string, SessionCompletionRecord[]>,
): NotificationItem[] {
  const gapItems: NotificationItem[] = []
  const reflectionItems: NotificationItem[] = []
  const zoomItems: NotificationItem[] = []
  const planItems: NotificationItem[] = []

  for (const dyad of dyads) {
    const title = dyadTitle(dyad)
    const completed = sessionCompletion[dyad.id] ?? []
    const plan = sessionPlans[dyad.id]

    dyadHealthAlerts(dyad).forEach((alert, i) => {
      gapItems.push({
        id: `${dyad.id}-gap-${i}`,
        icon: TriangleAlert,
        message: alert,
        tone: 'destructive',
      })
    })

    if (completed.some((s) => s.session === 1) && dyad.annotationSummaries.length === 0) {
      reflectionItems.push({
        id: `${dyad.id}-reflection`,
        icon: NotebookPen,
        message: `Add your reflection for ${title}.`,
      })
    }

    const next = nextPlannedSession(plan, completed)
    if (next?.date) {
      zoomItems.push({
        id: `${dyad.id}-zoom`,
        icon: Video,
        message:
          next.date === TODAY
            ? `Zoom session with ${title} today.`
            : `Zoom session with ${title} on ${formatDate(next.date)}.`,
      })
    }

    if (!isPlanSet(plan)) {
      planItems.push({
        id: `${dyad.id}-no-plan`,
        icon: CalendarPlus,
        message: `Build a session plan for ${title}.`,
      })
    }
  }

  return [...gapItems, ...reflectionItems, ...zoomItems, ...planItems]
}

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size))
  return pages
}

/** A small notice tile — icon top-left, left-aligned message below, a real
 *  dismiss control top-right. Not a link — per direct feedback these are
 *  notices, not navigation, so nothing here redirects. `shadow-card` alone
 *  carries the elevation (no ring/border, per direct feedback).
 *
 *  Round 20.2: when `item.severity` is set (Research Dashboard items only —
 *  see `NotificationItem` above), the badge/icon recolor to a full
 *  red/amber/green traffic-light and a vertical accent stroke is added
 *  before the icon, inside the card's own padding. When `severity` is
 *  absent (every Coach Delivery Portal item, since `buildNotifications`
 *  never sets it), the branch below renders the exact pre-existing
 *  tone-only markup with no stroke element in the DOM at all, so that
 *  portal's rendering is byte-for-byte unchanged. */
function NotificationItemCard({
  item,
  onDismiss,
  uniformHeight,
  layout = 'delivery',
}: {
  item: NotificationItem
  onDismiss: () => void
  uniformHeight?: boolean
  layout?: HubLayout
}) {
  const Icon = item.icon
  const isAlert = item.tone === 'destructive'
  const hasSeverity = item.severity !== undefined

  /** Severity → icon colour, shared by the `research` layout below and the
   *  badge/stroke branches further down so the traffic-light stays one
   *  mapping rather than three. */
  const severityText =
    item.severity === 'red'
      ? // Softened from `destructive` to `alert-pastel` (Round 21, direct
        // instruction). 3.45:1 on the white card / 3.17:1 on the parchment
        // panel — both clear WCAG 1.4.11's 3:1 floor for a graphical
        // indicator, which is what this icon is.
        'text-alert-pastel'
      : item.severity === 'amber'
        ? 'text-amber-800'
        : 'text-success'

  const badge = (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full',
        hasSeverity
          ? item.severity === 'red'
            ? 'bg-destructive/10'
            : item.severity === 'amber'
              ? 'bg-amber-100'
              : 'bg-success/10'
          : isAlert
            ? 'bg-destructive/10'
            : 'bg-green-100',
      )}
    >
      <Icon
        className={cn('size-4', hasSeverity ? severityText : isAlert ? 'text-destructive' : 'text-green-700')}
        strokeWidth={1.75}
      />
    </span>
  )

  const dismissButton = (
    <button
      type="button"
      onClick={onDismiss}
      // Focus-return target after a sibling tile is dismissed — see
      // `NotificationHubView` below.
      data-notif-dismiss={item.id}
      aria-label={`Dismiss: ${item.message}`}
      // Design critique (Round 18): was `size-6` (24px) — this app has an
      // established, repeatedly-enforced dismiss/close-button precedent at
      // 36px (`size-9`), e.g. `ConsumerDetailPage.tsx`/`ConsumerHealthPage.tsx`'s
      // own "Dismiss alert" button. Raised to match rather than introducing
      // a third, smaller one-off size.
      className="absolute top-1.5 right-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-faint outline-none transition-colors hover:bg-pearl hover:text-ink focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.95]"
    >
      {layout === 'research' ? (
        // The frame draws this as a 16px near-black circled X, not the bare
        // grey X the Delivery Portal uses. Only the *glyph and colour* change —
        // the 36px hit area stays, since this app has repeatedly enforced that
        // floor for dismiss controls (Round 18 raised this very button from
        // 24px, Round 20 raised the needs-support banner's from the same).
        <CircleX aria-hidden="true" className="size-4 text-ink" strokeWidth={2} />
      ) : (
        <X aria-hidden="true" className="size-4" strokeWidth={2} />
      )}
    </button>
  )

  if (layout === 'research') {
    // Figma frame `1:38`, `alert-card` (`1:1316`): white card, accent-tinted
    // hairline, bare severity-coloured alert icon top-left, circled-X dismiss
    // top-right, 2-line message, and a full-width outlined CTA pinned to the
    // bottom. Deliberately *no* badge circle behind the icon — the frame
    // draws the glyph bare, unlike the Delivery Portal's tiles below.
    //
    // The severity prefix below is the same screen-reader parity fix the
    // `hasSeverity` branch documents: the traffic-light colour is otherwise
    // conveyed only through an `aria-hidden` glyph.
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
          // Frame measurements: 10px radius (`rounded-md`), 1px Purple
          // Lighter 4 border, 16px padding, and the one shadow that appears
          // anywhere in the whole frame.
          'relative flex flex-col justify-between gap-8 rounded-md border border-purple-300 bg-card p-4 shadow-notice-card',
          // A hard height (not a floor) so all 4 cards in a row render truly
          // uniform: CSS Grid equalizes only within a row, and the message is
          // `line-clamp-2`, so nothing can grow past this. p-4 (32) + icon row
          // (20) + gap-4 (16) + 2 lines of 13px text (~36) + gap-8 (32) +
          // CTA (36) = 172px.
          uniformHeight && 'h-[172px]',
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            {/* The frame draws the same `alert-circle` glyph on every card
                rather than a per-category icon, so this layout deliberately
                ignores `item.icon` (the Delivery Portal's own tiles still use
                it). Both are lucide — this app's only icon library — never a
                Figma-exported SVG.
                What is NOT dropped is the severity tint: the frame's four mock
                notices were all one severity, so it has nothing to say about a
                traffic-light it never drew, and the colour is real information
                Round 20.2 added. Uniform shape, meaningful colour. */}
            <CircleAlert
              aria-hidden="true"
              className={cn('size-5 shrink-0', hasSeverity ? severityText : 'text-alert-pastel')}
              strokeWidth={2}
            />
            {dismissButton}
          </div>
          <p className="line-clamp-2 pr-6 text-left text-caption text-ink">
            <span className="sr-only">{severityLabel}</span>
            {item.message}
          </p>
        </div>
        {item.actionTo && item.actionLabel && (
          // Frame's `cta-button` (`1:1326`) is a full-width, near-black,
          // 6px-radius outline button. Per direct feedback ("buttons don't
          // match our style") it renders with **this app's own canonical
          // outline button** instead — the `rounded-full border border-primary`
          // / `text-primary` / `hover:bg-primary/5` treatment used at 24 other
          // sites. Full width and bottom-pinned as the frame draws it; the
          // chrome is this project's.
          <Link
            to={item.actionTo}
            // `shrink-0` is load-bearing, not cosmetic: this is a flex child of
            // a fixed-height (`h-[172px]`) card, and `h-9` is a *height*, not a
            // minimum — flex-shrink was compressing it to **31px**, under this
            // app's enforced 36px floor. Caught by `design/layout-audit.js`,
            // not by looking at it.
            className="flex h-9 w-full shrink-0 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            {item.actionLabel}
            <span className="sr-only"> — {item.message}</span>
          </Link>
        )}
      </div>
    )
  }

  if (hasSeverity) {
    // Accessibility review (Round 20.2 fix): the red/amber/green tier was
    // previously conveyed only via the (aria-hidden) badge/stroke color, with
    // no equivalent for screen reader users — a real parity gap, since a
    // sighted user can visually group items by severity and a screen reader
    // user otherwise couldn't. Folded in as a visually-hidden prefix on the
    // message itself rather than the dismiss button's label, so it reads
    // before the message content in document order.
    const severityLabel =
      item.severity === 'red' ? 'High priority: ' : item.severity === 'amber' ? 'Medium priority: ' : 'Low priority: '

    return (
      <div
        className={cn(
          'relative flex items-start gap-3 rounded-xl bg-card p-4 shadow-card',
          // Research Dashboard only: fixed (not min-) height so all 4 tiles in
          // a 2x2 page render truly uniform regardless of message length or
          // which row they land in — CSS Grid only stretches items to match
          // within their own row, so a `min-h` alone doesn't equalize a tile
          // in row 1 against one in row 2. A hard `h-` pairs with the
          // paragraph's own `line-clamp-3` so the tallest possible message
          // (3 lines, not the previously-assumed 2) can never grow the tile:
          // p-4 padding (16px x2 = 32px) + the badge (`size-8` = 32px) + the
          // flex column's `gap-2` (8px) + 3 lines at `text-caption`
          // (14px * 1.43 line-height ≈ 20px/line, 60px for 3 lines) =
          // 32 + 32 + 8 + 60 = 132px.
          uniformHeight && 'h-[132px]',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'w-1 shrink-0 self-stretch rounded-full',
            item.severity === 'red'
              ? 'bg-destructive'
              : item.severity === 'amber'
                ? // raw `amber-400` measured ~1.6:1 against the card's white
                  // background, failing the 3:1 minimum WCAG 1.4.11 requires
                  // for a graphical UI indicator — the exact "raw Tailwind
                  // amber" anti-pattern `index.css`'s
                  // `--color-plan-module`/`--color-plan-catchup` history
                  // already documents moving away from. `amber-700` matches
                  // this component's own badge text tone one step darker and
                  // clears ~4.8:1.
                  'bg-amber-700'
                : 'bg-success',
          )}
        />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          {dismissButton}
          {badge}
          <p className={'line-clamp-3 pr-3 text-left text-fine text-ink'}>
            <span className="sr-only">{severityLabel}</span>
            {item.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-xl bg-card p-4 shadow-card',
        // See the matching comment in the `hasSeverity` branch above — same
        // computed value (now a hard height, not min-height), same reasoning.
        uniformHeight && 'h-[132px]',
      )}
    >
      {dismissButton}
      {badge}
      <p className={'line-clamp-3 pr-3 text-left text-fine text-ink'}>{item.message}</p>
    </div>
  )
}

/** 2x2 pages in a horizontally snapping scroll container, with dot
 *  pagination below reflecting real scroll position (not just a static
 *  page-count decoration) — direct feedback against the earlier open-ended
 *  grid + "+N more" text. */
function NotificationCarousel({
  items,
  onDismiss,
  uniformHeight,
  layout = 'delivery',
}: {
  items: NotificationItem[]
  onDismiss: (id: string) => void
  uniformHeight?: boolean
  layout?: HubLayout
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

  // A real bug caught live, not just in review: `scrollLeft` is a plain
  // pixel offset, so resizing the window (or the sidebar collapsing/
  // expanding, which resizes this same column) leaves it stale relative to
  // the container's new width — the view then renders torn between two
  // pages, showing slivers of both rather than one clean page. Re-anchor to
  // the current page's pixel offset, instantly (no animation), whenever the
  // container itself resizes.
  //
  // Round 18 accessibility review — a second real bug found live in this
  // same effect: `ResizeObserver` guarantees one "initial" callback
  // immediately after `observe()` even with no actual size change, and this
  // effect re-runs on every `page` change (including the very first mount).
  // That unprompted `scrollTo` call was intermittently racing the browser's
  // own native focus-driven scroll (what carries a Tab press into an
  // off-screen page-2 item) — reproduced live via real Tab presses shortly
  // after page load: focus would silently drop to `<body>` instead of
  // advancing to the next dismiss button, disappearing entirely once a ~2s
  // delay was inserted before the next Tab. Skipping this guaranteed first
  // callback (tracked per observer instance, not per mount) keeps the real
  // resize-recovery behavior intact while removing the unprompted call.
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
          // Design critique (Round 18): rows were previously forced to a flat
          // 2-row `min-h-[224px]`/`grid-rows-2`, so a page holding only 1-2
          // items (the common state after a coach dismisses a few) left a
          // large dead green area rather than reading as a genuinely shorter
          // page — reproduced live by dismissing from 5 items down to 1.
          // Dropping `grid-rows-2` lets the grid size itself to however many
          // rows the real item count needs (1 row for 1-2 items, 2 for 3-4);
          // `min-h-[104px]` is just a floor matching one real card's own
          // measured height (103px), not an artificial 2-row minimum.
          <div
            key={i}
            className={cn(
              'grid w-full shrink-0 content-start gap-4 snap-start',
              layout === 'research'
                ? // Figma frame: all 4 tiles of a page in one row. Steps down
                  // at narrow widths rather than squeezing 4 columns into a
                  // phone — this app's own responsive-grid convention.
                  'grid-cols-1 gap-4 p-1 sm:grid-cols-2 xl:grid-cols-4'
                : 'min-h-[104px] grid-cols-2 gap-3 p-2',
            )}
          >
            {pageItems.map((item) => (
              <NotificationItemCard
                key={item.id}
                item={item}
                onDismiss={() => onDismiss(item.id)}
                uniformHeight={uniformHeight}
                layout={layout}
              />
            ))}
          </div>
        ))}
      </div>
      {pages.length > 1 && (
        // One implementation for both layouts, differing only in hue. The
        // frame draws flat 4px pill *bars*; those were built, shipped, and then
        // rejected on direct feedback as looking ugly — so this now uses **this
        // app's own carousel dot pattern**, the one Round 18 built and reviewed
        // for the Coach Delivery Portal's identical carousel: a 6px dot that
        // stretches to a 20px lozenge when current. Same "the chrome is ours"
        // rule the buttons and tab underline follow.
        //
        // Each dot is a child <span> inside a padded <button> so the control has
        // a real hit area without the padding inflating the visual gap — see the
        // superseded `bg-clip-content` attempt in this file's history for why
        // styling the button itself as the dot does not work.
        // Round 28: `mt-6` -> `mt-2`. The measured gap from the last card's
        // bottom edge to the dot row was 28px, and the row's own 26px hit area
        // adds ~11px of transparent padding above the 6px bar — so the gap
        // *read* as ~39px, far larger than it was authored to be. Sizing this
        // off the authored number rather than the painted one is what left the
        // dots looking detached from the cards they page.
        <div className="mt-2 flex items-center justify-center gap-1">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPage(i)}
              aria-label={`Page ${i + 1} of ${pages.length}`}
              aria-current={i === page}
              // `py-2.5` not `py-2`: the audit measured the hit area at 22px, 2px
                // under WCAG 2.2 AA's 24x24 target-size minimum (2.5.8). The
                // visible 6px bar is unchanged — only the padding grows.
                className="flex items-center rounded-sm px-1 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'block h-1.5 rounded-full transition-all duration-200',
                  i === page
                    ? layout === 'research'
                      ? 'w-5 bg-primary'
                      : 'w-5 bg-green-600'
                    : layout === 'research'
                      ? 'w-1.5 bg-purple-300 hover:bg-purple-400'
                      : 'w-1.5 bg-green-200 hover:bg-green-300',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** The `research` layout's own empty state — its container is neutral
 *  `parchment` rather than the Delivery Portal's green tint, so the green
 *  check badge below would read as a stray accent. Uses this app's standard
 *  `bg-primary/10` circular-icon empty-state pattern instead (the same one
 *  `DyadSessionRecordingsCard` and the schedule sections already use).
 *
 *  Round 28 note: the Research Dashboard's own hub now passes `hideWhenEmpty`,
 *  so in practice this no longer renders there. Kept rather than deleted
 *  because `hideWhenEmpty` is opt-in — a future `layout="research"` caller
 *  that doesn't pass it still needs an empty state, and without this it would
 *  render a blank `parchment` panel instead. Briefly deleted as "orphaned" and
 *  restored: it has a real reader below, so it never was. */
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

/** Sits comfortably on the hub's own green tint rather than the plain
 *  grey-box empty state used elsewhere in the app (that one's for
 *  plain-white sibling panels, e.g. "My upcoming meetings"). */
function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="size-5 text-green-700" strokeWidth={1.75} />
      </span>
      <p className="text-caption font-semibold text-ink">You're all caught up</p>
      <p className="text-caption text-ink-faint">Nothing needs your attention right now.</p>
    </div>
  )
}

/** Generic presentational chassis — the green-tinted card, header, dismiss
 *  live-region, and carousel/empty-state switch. Takes an already-built item
 *  list, so it has no opinion on *what* produced the notices; `NotificationHub`
 *  below (coach caseload) and `ResearchNotificationHub.tsx` (study-wide,
 *  Round 20) each supply their own `buildNotifications`-style function and
 *  header copy, then render through this one shared shell. */
export function NotificationHubView({
  title = 'Notifications',
  subtitle,
  items: allItems,
  uniformHeight,
  layout = 'delivery',
  hideWhenEmpty = false,
  onEmptyChange,
}: {
  title?: string
  /** Only the `delivery` layout renders a subtitle — the `research` layout's
   *  Figma frame has none. */
  subtitle?: string
  items: NotificationItem[]
  /** Research Dashboard only: fixes each notice tile to a uniform height
   *  regardless of message length. Defaults to off/undefined so the Coach
   *  Delivery Portal's own instance is byte-for-byte unchanged. */
  uniformHeight?: boolean
  /** See `HubLayout` above. Defaults to `'delivery'`, the original shape. */
  layout?: HubLayout
  /**
   * Round 28, direct instruction: when there is nothing left to show, remove
   * the whole section — heading, badge, panel — instead of leaving an
   * "all caught up" empty state behind.
   *
   * Research Dashboard only. The Coach Delivery Portal keeps its own empty
   * state: its hub is a fixed slot in a two-panel row, so hiding it there
   * would leave a hole beside "My upcoming meetings" rather than closing up.
   * Defaults to `false` so that instance is unchanged.
   */
  hideWhenEmpty?: boolean
  /**
   * Fires whenever the visible-item count crosses to/from zero.
   *
   * Needed because `hideWhenEmpty` removes this section's own box but cannot
   * remove the *gap* its parent reserves after it — the following section's
   * `mt-24` would survive as a ~96px hole where the hub used to be. Dismissal
   * state is internal here, so the page has no other way to know. The parent
   * uses this to drop that margin and let the rest of the page close up.
   */
  onEmptyChange?: (isEmpty: boolean) => void
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  // Round 18 accessibility review — dismissing a tile removed its DOM node
  // with zero screen-reader announcement (confirmed live: no `aria-live`
  // region existed anywhere in this component). This app already has an
  // established `role="status" aria-live="polite"` sr-only pattern for
  // exactly this kind of silent-removal case (see `WidgetGrid.tsx`'s
  // widget-picker "X added to your home page." announcement) — reused here
  // rather than inventing a new one.
  const [lastDismissedMessage, setLastDismissedMessage] = useState('')
  const items = allItems.filter((item) => !dismissed.has(item.id))

  // Round 20 accessibility review — Round 18 fixed the *announcement* on
  // dismiss but not the focus: the pressed button unmounts with its tile, so
  // `document.activeElement` fell to `<body>` on every dismiss (confirmed
  // live with 7 items still remaining, so this was the ordinary case, not an
  // edge case). Chrome's sequential-focus heuristic sometimes recovers on the
  // next Tab, but nothing about that is guaranteed and there is no focus ring
  // in the meantime. Move focus to whichever tile now occupies the dismissed
  // one's slot (falling back to the previous tile, then to the hub heading
  // once the list empties into the "all caught up" state).
  const rootRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [focusAfterDismiss, setFocusAfterDismiss] = useState<string | null>(null)

  useEffect(() => {
    if (focusAfterDismiss === null) return
    if (focusAfterDismiss === '') {
      // `''` means "the list is now empty, send focus to the hub heading".
      //
      // Round 28: under `hideWhenEmpty` that heading has just unmounted along
      // with the rest of the section, so `headingRef.current` is null and the
      // old unconditional call silently did nothing — dropping focus to
      // `<body>`, the exact defect this whole block exists to prevent. Fall
      // back to the page's `<main>` landmark, which always outlives the
      // section and is where a keyboard user should logically land when the
      // thing they were acting on disappears.
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

  /** Round 28, direct instruction — clears every currently-visible notice.
   *
   *  Focus is moved to the hub heading explicitly (`''` is this component's
   *  existing "send it to the heading" signal, already used when the last tile
   *  is dismissed one at a time). That is not optional here: the "Dismiss all"
   *  button unmounts *itself* along with the tiles, so without this the
   *  pressed control disappears and `document.activeElement` falls to
   *  `<body>` — the defect class this project has shipped in six separate
   *  rounds. Reusing the existing path rather than adding a second one.
   *
   *  Announced through the same `aria-live` region as a single dismiss, with a
   *  count rather than a message, since there is no one message to name. */
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

  // Reported to the parent from an effect, never during render — calling a
  // parent's setState mid-render is the classic "Cannot update a component
  // while rendering a different component" warning. Keyed on the boolean, not
  // on `items.length`, so it fires only on the 1 -> 0 (and 0 -> 1) crossing
  // rather than on every dismiss.
  const isEmpty = items.length === 0
  useEffect(() => {
    onEmptyChange?.(isEmpty)
  }, [isEmpty, onEmptyChange])

  // Round 28 — nothing left to show, and this caller asked for the section to
  // disappear rather than sit there as an empty state.
  //
  // Deliberately NOT `return null`: the live region has to stay mounted or the
  // "Dismissed all N alerts." announcement is destroyed in the same tick it is
  // set, and a screen-reader user gets silence for the action they just took.
  // An `sr-only` paragraph has no visual footprint, so the section is gone on
  // screen while the announcement still lands.
  if (hideWhenEmpty && items.length === 0) {
    return <div ref={rootRef}>{liveRegion}</div>
  }

  if (layout === 'research') {
    // Figma frame `1:38`, `1:1373` + `attention-section` (`1:1309`): the
    // heading and a live alert-count badge sit *above* the container, and the
    // container itself is a neutral tinted panel holding the 4-across tile
    // row + bar pagination. Not a `Card` — the frame gives this panel no
    // hairline ring and no §35a header band, since its header is outside it.
    return (
      <div ref={rootRef}>
        {liveRegion}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-title text-ink outline-none">
            {title}
          </h2>
          {items.length > 0 && (
            // Frame's `badge` (`1:1370`): solid pill, 10px/4px padding, on
            // `alert-pastel` (the frame's own #e45f5b) per direct instruction
            // to soften the alert red.
            //
            // Round 28: type moved `body-md` (16/600) -> `caption-medium`
            // (14/500), the Figma style having changed. The old `0.3px`
            // tracking override went with it — `caption-medium` carries its
            // own -0.224px, and leaving a hardcoded value on top would mean
            // this badge quietly opting out of the step it claims to use.
            //
            // Shared deliberately: this is `NotificationHubView`, rendered by
            // BOTH the Research Dashboard and the Coach Delivery Portal, so
            // the two hubs keep one badge rather than forking over 2px.
            //
            // ⚠️ KNOWN CONTRAST EXCEPTION, accepted on direct instruction
            // ("change 8 alerts font color to white"). White on #e45f5b
            // measures **3.45:1**, below WCAG AA's 4.5:1. The size change
            // above does NOT move that bar: 14px/500 is not "large text"
            // either (that starts at 18.66px bold or 24px regular), so the
            // requirement was 4.5:1 before and remains 4.5:1 now. An earlier
            // pass used `text-ink` here precisely because it clears at
            // 4.88:1; white was then requested explicitly and overrides that.
            //
            // Two one-line fixes if this is ever revisited: keep white and
            // deepen the fill to #cc4340 (4.73:1, still clearly softer than
            // `destructive`'s #d70015), or go back to `text-ink`. Recorded
            // rather than silently shipped.
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-alert-pastel px-2.5 py-1 text-caption-medium text-white">
                {items.length} {items.length === 1 ? 'alert' : 'alerts'}
              </span>
              {/* Round 28, direct instruction: sits immediately after the
                  alert label.

                  Ghost, not the app's `bg-pearl` utility button. A first pass
                  used that utility style and it was reported as looking wrong
                  — measurement showed why, and it is worth recording because
                  it applies to every `bg-pearl` control on a page canvas:
                  `pearl` is #f5f5f7, a **cool** grey, while this app's page
                  background has been the **warm** #fffcfa since Round 23. The
                  two do not belong to the same family, so a pearl chip on the
                  canvas reads as a foreign grey patch rather than as a quiet
                  control. (Inside a white card, where `pearl` normally lives,
                  there is no such clash.)

                  A transparent fill sidesteps the temperature problem
                  entirely and keeps this correctly low-emphasis next to the
                  alert badge. `h-9` still applies — the 36px floor holds even
                  for a control that reads as a small inline action, which is
                  exactly how Rounds 3.1/10/18 each shipped one under it.

                  Hover is `purple-50`, NOT the `primary/5` a first pass used:
                  5% of #4a278f over the #fffcfa canvas composites to about a
                  9-per-channel shift, which is present in the DOM and
                  effectively invisible on screen — reported as "no hover
                  state". `purple-50` (#f3efff) is a real palette step and the
                  same hover the quick-action pills already use. An opacity
                  that small is not a hover state; it is a rounding error. */}
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
        {/* Frame's `attention-section` (`1:1309`): neutral tinted panel, 16px
            radius, 24px padding. 24px from the heading row above.

            Round 28: bottom padding trimmed 24px -> 12px on direct
            instruction to reduce the panel's height. Deliberately asymmetric
            and it still *looks* even: the dot row below the cards carries
            ~11px of its own transparent hit-area padding, so 12px + 11px = 23px
            of visual space at the bottom against the 24px at the top. Padding
            the panel evenly here would have painted a visibly heavier bottom
            edge — the same authored-vs-painted gap as the `mt` above. */}
        <div className="mt-6 rounded-lg bg-parchment px-6 pt-6 pb-3">
          {items.length === 0 ? (
            <ResearchEmptyState />
          ) : (
            <NotificationCarousel
              items={items}
              onDismiss={handleDismiss}
              uniformHeight={uniformHeight}
              layout="research"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <Card ref={rootRef} className="gap-0 overflow-visible rounded-lg border-0 bg-green-50 py-0">
      {liveRegion}
      <div className="flex items-center gap-3 p-6">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100"
        >
          <Bell className="size-5 text-green-700" strokeWidth={1.75} />
        </span>
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-title outline-none">
            {title}
          </h2>
          <p className="mt-1 text-caption text-ink-faint">{subtitle}</p>
        </div>
      </div>
      <div className="p-6 pt-2">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <NotificationCarousel
            items={items}
            onDismiss={handleDismiss}
            uniformHeight={uniformHeight}
          />
        )}
      </div>
    </Card>
  )
}

export function NotificationHub({ dyads }: { dyads: ConsumerDyad[] }) {
  const { sessionPlans, sessionCompletion } = useResearch()
  const items = buildNotifications(dyads, sessionPlans, sessionCompletion)
  return (
    <NotificationHubView
      subtitle="What needs your attention across your clients."
      items={items}
    />
  )
}
