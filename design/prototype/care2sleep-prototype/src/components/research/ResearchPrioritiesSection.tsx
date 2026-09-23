import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { Chip } from '@/components/research/StatusChip'
import { TablePager } from '@/components/shared/TablePager'
import { cn } from '@/lib/utils'

/**
 * "Items that need your attention" — the Research Dashboard Home attention
 * list.
 *
 * **Replaces `ResearchNotificationHub` + `NotificationHubView`** (Rounds 20/28)
 * on direct instruction: match the coach portal's own
 * `components/delivery/PrioritiesSection.tsx` (Round 40) rather than keep a
 * second, differently-shaped attention pattern in the researcher portal. The
 * row shape is that component's exactly — a `purple-50` card, a
 * `caption-medium` title over a `body` note, a kebab that opens a one-item
 * Dismiss menu — so the two portals now read as one system.
 *
 * Three deliberate differences from the coach version, each with a reason:
 *
 * 1. **A priority chip per row.** The coach list carries no colour at all, and
 *    its own doc comment explains why: its rows differ by *kind of job*, not by
 *    severity, so colour there would imply a ranking that does not exist. Here
 *    severity is the whole point — the source classification assigns every
 *    alert a High or Medium priority — so the chip is carrying real
 *    information. It uses the app's own `<Chip>` rather than a hand-rolled
 *    pill, so it inherits the one contrast-measured geometry all seven tones
 *    share.
 *
 * 2. **No "Dismiss all".** Direct instruction. The per-row kebab Dismiss
 *    stays. The coach portal keeps its own "Dismiss all" — that control lives
 *    in `PrioritiesSection`/`NotificationHub`, which this component does not
 *    touch, so removing it here cannot reach the other portal.
 *
 * 3. **Paged, via the shared `TablePager`.** The coach list scrolls inside a
 *    fixed 272px box because it is half of a two-column row; this one is full
 *    width with more alert kinds behind it, and a scrolling panel hides how
 *    many there are. `TablePager` brings the app's own 36px hit areas and the
 *    live-region range label, which matters here for the same reason it does on
 *    a table: paging swaps every row with no other announcement.
 *
 * 4. **Auto height, and it hides itself when empty.** The coach list is a fixed
 *    272px because it is one half of a two-column row and shrinking it would
 *    drag the KPI grid beside it. This section is full width with "Study
 *    overview" beneath it, so there is nothing to hold open — it collapses and
 *    the page closes the gap behind it via `onEmptyChange`, the same contract
 *    the hub it replaces used.
 *
 * **Priority tones:** High -> `destructive`, Medium -> `warning`. The source
 * classification defines only those two levels, so there is deliberately no
 * Low tier here — the red/amber/green traffic light the old hub used had a
 * third band that nothing maps onto any more.
 */
export type Priority = 'High' | 'Medium'

export interface ResearchPriorityItem {
  id: string
  /** High or Medium, rendered as the row's chip. */
  priority: Priority
  /** The alert name from the classification, 2-5 words. */
  title: string
  /** One sentence: who it concerns, and what has happened. */
  note: string
  /** Where the row goes when opened. */
  to: string
}

const priorityTone = { High: 'destructive', Medium: 'warning' } as const

/** Four rows a page — the same count the coach list shows before scrolling, so
 *  the two panels are about the same height. */
const PAGE_SIZE = 4

export function ResearchPrioritiesSection({
  items,
  onEmptyChange,
  fillHeight = false,
}: {
  items: ResearchPriorityItem[]
  /** Lets Home drop the margin this section owns once it hides itself — the
   *  section can collapse its own box but cannot reach a sibling's margin. */
  onEmptyChange?: (isEmpty: boolean) => void
  /**
   * Additive, default off, so Home stays byte-identical.
   *
   * On when the section shares a stretched row with a sibling whose height it
   * must match — the Coach profile's Study progress tab sits it beside the KPI
   * grid (direct instruction: *"add a fixed height to items that need
   * attention, = to full height of KPIs parent container"*).
   *
   * The height is taken from the row rather than written as a px value: the
   * section becomes `h-full` and the rows list becomes the flex child that
   * absorbs the slack and scrolls, so the panel measures exactly the KPI
   * column no matter how many tiles that column wraps to. A hardcoded height
   * would be wrong the moment a KPI is added or the grid rewraps.
   *
   * `min-h-0` on the list is load-bearing: a flex child's automatic minimum is
   * its content, so without it the list refuses to shrink and pushes the panel
   * past the row instead of scrolling inside it.
   */
  fillHeight?: boolean
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const visible = items.filter((i) => !dismissed.has(i.id))

  const lastPage = Math.max(0, Math.ceil(visible.length / PAGE_SIZE) - 1)
  /* Dismissing the last row on the last page would otherwise leave the pager
     pointing past the end and the panel rendering empty while rows remain. */
  useEffect(() => {
    if (page > lastPage) setPage(lastPage)
  }, [page, lastPage])
  const pageItems = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  /* Dismissing unmounts the control that was clicked — focus would fall to
     `<body>`, this project's most-repeated defect. Land on the heading while
     rows remain, on `#main-content` once the section itself goes. */
  const dismiss = (id: string) => {
    const remaining = visible.filter((i) => i.id !== id).length
    setDismissed((prev) => new Set(prev).add(id))
    setOpenMenu(null)
    onEmptyChange?.(remaining === 0)
    if (remaining > 0) headingRef.current?.focus({ preventScroll: true })
    else document.getElementById('main-content')?.focus({ preventScroll: true })
  }

  if (visible.length === 0) return null

  return (
    <section
      className={cn(
        'flex flex-col gap-4',
        /* Under `fillHeight` the card chrome moves from the rows list up onto
           the section itself, so the heading, the count pill and the rows are
           ONE container (direct instruction: "items need attention and study
           KPI are two different containers stacked side by side"). With the
           chrome on the inner list the heading floated on the page canvas
           above the box, so the column's top edge did not line up with the KPI
           grid's and the two read as a label plus a panel rather than as two
           panels. */
        fillHeight && 'h-full rounded-lg border border-parchment bg-white p-4 shadow-card',
      )}
    >
      <div className="flex min-h-9 items-center justify-between gap-6">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 font-display text-title text-ink outline-none"
        >
          Items that need your attention
        </h2>
        {/* The count pill is kept from the hub this replaces and matches the
            coach portal's own. White on `alert-pastel` measures 3.45:1 and is a
            documented, explicitly requested exception (see `index.css`) — not a
            new one. The "Dismiss all" that sat beside it is gone. */}
        <span className="inline-flex shrink-0 items-center rounded-full bg-alert-pastel px-2.5 py-1 text-caption-medium text-white">
          {visible.length} {visible.length === 1 ? 'alert' : 'alerts'}
        </span>
      </div>

      <div
        className={cn(
          fillHeight
            ? /* Chrome lives on the section above; this is just the scroller. */
              'flex min-h-0 flex-1 flex-col overflow-y-auto'
            : 'rounded-lg border border-parchment bg-white p-4 shadow-card',
        )}
      >
        <div className="flex flex-col gap-4">
          {pageItems.map((item) => (
            <div
              key={item.id}
              /* The whole card is the control: a stretched link
                 (`after:absolute after:inset-0`) rather than an `<a>` wrapping
                 the row, because the kebab is a real button and nesting one
                 inside a link is invalid and unreachable by keyboard. The kebab
                 sits above that overlay on `z-10`. */
              className="relative flex shrink-0 items-start justify-between gap-3 rounded-xs bg-purple-50 p-3 transition-colors hover:bg-purple-200 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* The chip sits on a white backing rather than directly on
                      the row. `<Chip>`'s fills are 8% tints, and a
                      `destructive/8` tint composited over this row's
                      `purple-50` paints a pink `rgb(241,220,236)` against
                      which `destructive` text measures **4.15:1** — under AA,
                      and the identical failure Round 23 found and fixed on the
                      `purple-50` table band. Over white the same tint measures
                      5.38:1. `rounded-full` + `w-fit` so the backing is exactly
                      the chip's own shape and nothing shows around it. */}
                  <span className="inline-flex w-fit rounded-full bg-white">
                    <Chip tone={priorityTone[item.priority]} label={item.priority} />
                  </span>
                  <Link
                    to={item.to}
                    className="text-caption-medium text-ink outline-none after:absolute after:inset-0 after:rounded-xs"
                  >
                    {item.title}
                  </Link>
                </div>
                <span className="text-body text-ink">{item.note}</span>
              </div>

              {/* A kebab opening a one-item menu, not a bare dismiss button: a
                  kebab that fires an action on click is a lie about what a
                  kebab means, and this app already has kebabs on four surfaces
                  that all open menus. */}
              <div className="relative z-10 -mt-1.5 -mr-1.5 shrink-0">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === item.id}
                  onClick={() => setOpenMenu((c) => (c === item.id ? null : item.id))}
                  className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreVertical aria-hidden="true" className="size-4" />
                  <span className="sr-only">Options for {item.title}</span>
                </button>
                {openMenu === item.id && (
                  <div
                    role="menu"
                    className="absolute right-0 z-10 mt-1 min-w-[160px] rounded-sm bg-white p-1 shadow-card ring-1 ring-hairline"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => dismiss(item.id)}
                      className="flex h-9 w-full items-center rounded-xs px-3 text-caption-medium text-ink outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {visible.length > PAGE_SIZE && (
          <div className="mt-4 border-t border-hairline pt-3">
            <TablePager
              page={page}
              pageSize={PAGE_SIZE}
              total={visible.length}
              onPageChange={setPage}
              itemLabel="alerts"
            />
          </div>
        )}
      </div>
    </section>
  )
}
