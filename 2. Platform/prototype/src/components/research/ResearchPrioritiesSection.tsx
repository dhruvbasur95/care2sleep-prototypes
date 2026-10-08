import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, MoreVertical } from 'lucide-react'
import { Chip } from '@/components/research/StatusChip'
import { TablePager } from '@/components/shared/TablePager'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * "Items that need your attention" — the Research Dashboard Home attention
 * list.
 *
 * **Replaces `ResearchNotificationHub` + `NotificationHubView`** (Rounds 20/28)
 * on direct instruction: match the coach portal's own
 * `components/delivery/PrioritiesSection.tsx` (Round 40) rather than keep a
 * second, differently-shaped attention pattern in the researcher portal. The
 * row shape is that component's exactly — a neutral `parchment` card, a
 * `caption-medium` title over a `body` note, a kebab that opens a one-item
 * Dismiss menu — so the two portals now read as one system.
 *
 * **2026-10-01, direct instruction: this component now serves the coach portal
 * too.** `components/delivery/PrioritiesSection.tsx` is **deleted**, and coach
 * Home renders this with `title="Your this week's priorities"` plus the
 * `dataTour`/`className`/`emptyCopy` props below. The instruction was to align
 * the coach list with this one, including its per-row priority chip, and to
 * drop the coach's "Dismiss all". Collapsing the two rather than restyling one
 * to look like the other is what makes them unable to drift again — which is
 * the whole reason the ask came up, given this component began as a copy of
 * that one.
 *
 * Three earlier entries here described coach-vs-researcher differences that no
 * longer exist (no chip on the coach list, a "Dismiss all" the coach kept, a
 * fixed 272px scrolling box). They are gone rather than struck through: there
 * is one component now, so there is nothing to differ.
 *
 * What survives of them as real behaviour, still worth knowing:
 *
 * 1. **The priority chip carries real information**, which is why it is not
 *    decoration: the source classification assigns every item High or Medium.
 *    It uses the app's own `<Chip>` rather than a hand-rolled pill, so it
 *    inherits the one contrast-measured geometry all seven tones share. The
 *    coach's own severities are **dummy** — see `coachPriorities()`.
 *
 * 2. **No "Dismiss all".** Direct instruction, twice: once here and again on
 *    2026-10-01 for the coach surface. The per-row kebab Dismiss stays.
 *
 * 3. **Paged, via the shared `TablePager`**, rather than a scrolling panel that
 *    hides how many items are behind it. `TablePager` brings the app's own 36px
 *    hit areas and the live-region range label, which matters for the same
 *    reason it does on a table: paging swaps every row with no other
 *    announcement.
 *
 * 4. **Auto height, and it hides itself when empty** — unless `emptyCopy` is
 *    set, which is what a caller passes when it owns a box it cannot vacate.
 *    Research Home collapses and closes the gap via `onEmptyChange`; coach Home
 *    passes `emptyCopy`, because its box is one half of a two-column row and
 *    vacating it would leave the KPI tiles beside a hole.
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
  /** Where the row goes when opened. Omit when the destination is on the page
   *  the row already sits on — pass `onSelect` instead. */
  to?: string
  /** In-page destination, e.g. switching the record page's own tab. Additive:
   *  a row with neither `to` nor `onSelect` renders as plain text rather than
   *  a control that goes nowhere. */
  onSelect?: () => void
}

/* Medium moved `warning` -> `yellow` on 2026-10-02, so the chip is painted
   entirely from this project's own tokens.
   `warning` is `border-amber-200 bg-amber-50 text-amber-800` — Tailwind's
   borrowed amber scale, not tokens, which is why `StatusChip` itself records
   that Round 40 added the `yellow` tone to replace it. It also had a practical
   consequence: none of those three amber values has a published Figma paint
   style, so the chip could not be mirrored in Figma without inventing styles.
   `yellow` is `border-yellow-300 bg-yellow-50 text-ink`, all three published.
   High stays `destructive`; see the Figma note in design-tokens.md. */
const priorityTone = { High: 'destructive', Medium: 'yellow' } as const

/** Four rows a page — the same count the coach list shows before scrolling, so
 *  the two panels are about the same height. */
const PAGE_SIZE = 4

/** Shared by the row's three title treatments so the link, the button and the
 *  plain-text case cannot drift apart. The `after:` overlay makes the whole row
 *  the hit area. */
const ROW_TITLE =
  'text-caption-medium text-ink outline-none after:absolute after:inset-0 after:rounded-xs'

export function ResearchPrioritiesSection({
  items,
  onEmptyChange,
  fillHeight = false,
  emptyCopy,
  surfacePadding = 'sm',
  title = 'Items that need your attention',
  dataTour,
  className,
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
  /**
   * Additive, default undefined, so Research Home stays byte-identical —
   * without it this component still returns `null` when it has nothing to show,
   * which is what lets Home collapse the gap behind it via `onEmptyChange`.
   *
   * Set it where the section owns a box it cannot vacate: on the Coach
   * profile's Study progress tab it is absolutely positioned to match the KPI
   * column's height, so returning `null` left a visibly empty bordered card
   * with no explanation of why (direct instruction: *"when there are no items
   * that need attention, show an empty state container with message"*).
   *
   * One short line, per `EmptyState`'s own rule — a resting state, not an error
   * and not a call to action.
   */
  emptyCopy?: string
  /**
   * The section's own heading. Additive with the researcher default, so all
   * three researcher callers stay byte-identical.
   *
   * 2026-10-01, direct instruction: coach Home now renders this component
   * instead of its own `PrioritiesSection` (deleted), under the heading
   * **"Your this week's priorities"**. The heading is the only thing that
   * differs between the two portals — the row vocabulary, the alerts pill, the
   * kebab menu and the pager are shared, which is the point: these were two
   * components that had to be kept in step by hand, and the researcher one was
   * itself built as a copy of the coach one.
   */
  title?: string
  /**
   * `data-tour` anchor for the coach portal's first-run tour. Additive and
   * absent on the researcher pages, which have no tour.
   *
   * Load-bearing rather than cosmetic: `data/deliveryTour.ts` anchors a step to
   * `priorities`, and a missing anchor fails **silently** — the step simply
   * never points at anything. It rides the `<section>` because the tour
   * measures the whole block, heading included.
   */
  dataTour?: string
  /**
   * Extra classes on the `<section>`. Exists for `min-w-0`, which coach Home
   * must pass: the section is a grid cell, grid items default to
   * `min-width: auto`, and without it one long note sizes the track instead of
   * wrapping inside it. That has produced a real horizontal page scroll in
   * this project four times.
   */
  className?: string
  /**
   * Card padding under `fillHeight`. `'sm'` (16px) is the default and what the
   * Coach profile uses, where the card sits beside a bare KPI grid. `'lg'`
   * (24px) matches this app's own card convention and is for rows where the
   * sibling is a real `Card` — the trainee record Overview pairs it with the
   * learning-journey card, and an 8px padding difference between two cards on
   * one row reads as a mistake. Additive; existing callers are unchanged.
   */
  surfacePadding?: 'sm' | 'lg'
}) {
  const pad = surfacePadding === 'lg' ? 'p-6' : 'p-4'
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
    /* `emptyCopy` keeps the section on screen after the last dismiss, so the
       heading is still a real target and focus stays where the user was
       working. Without it the section unmounts and the heading goes with it,
       so focus has to leave for `#main-content` — `<main>` carries
       `tabIndex={-1}` for exactly this. Either way it never reaches `<body>`. */
    if (remaining > 0 || emptyCopy) headingRef.current?.focus({ preventScroll: true })
    else document.getElementById('main-content')?.focus({ preventScroll: true })
  }


  /* Empty, but the caller has asked for a resting state rather than a collapse.
     Same shell as the populated section so the box does not change size, shape
     or border when the last row is dismissed — only its contents. The count
     pill is deliberately absent: it is an *alert* count on `alert-pastel`, and
     a red "0 alerts" contradicts the all-clear it would be sitting above. */
  if (visible.length === 0) {
    /* No resting copy asked for: collapse, so Home can close the gap behind
       this section via `onEmptyChange`, exactly as before. */
    if (!emptyCopy) return null
    return (
      <section
        data-tour={dataTour}
        className={cn(
          'flex flex-col gap-4',
          fillHeight && cn('h-full rounded-lg border border-parchment bg-white shadow-card', pad),
          className,
        )}
      >
        <div className="flex min-h-9 items-center justify-between gap-6">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="min-w-0 font-display text-title text-ink outline-none"
          >
            {title}
          </h2>
        </div>
        <div
          className={cn(
            'flex min-h-0 flex-1 items-center justify-center',
            !fillHeight && cn('rounded-lg border border-parchment bg-white shadow-card', pad),
          )}
        >
          <EmptyState icon={CircleCheck} copy={emptyCopy} />
        </div>
      </section>
    )
  }

  return (
    <section
      data-tour={dataTour}
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
        className,
      )}
    >
      <div className="flex min-h-9 items-center justify-between gap-6">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 font-display text-title text-ink outline-none"
        >
          {title}
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
            : cn('rounded-lg border border-parchment bg-white shadow-card', pad),
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
              className="relative flex shrink-0 items-start justify-between gap-3 rounded-xs bg-parchment p-3 transition-colors hover:bg-hairline has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
            >
              {/* Direct instruction — the row reads label / space / title /
                  copy, top to bottom. The priority chip used to share a line
                  with the title, which made the title start at a different x on
                  every row (the chip's width follows its word) and left the
                  eye no single column to scan down. On its own line the chip is
                  a band label, the title is the headline, and all three
                  left-align. The 12px gap after the chip is the "space"; title
                  and copy sit 4px apart as one block. */}
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {/* The chip sits on a white backing rather than directly on
                    the row. `<Chip>`'s fills are 8% tints, and a
                    `destructive/8` tint composited over a tinted row paints a
                    colour against which `destructive` text measured **4.15:1**
                    — under AA, the identical failure Round 23 found on the
                    `purple-50` table band. Over white the same tint measures
                    5.38:1. Kept now the row is `parchment`, and re-measured
                    rather than assumed. `rounded-full` + `w-fit` so the backing
                    is exactly the chip's own shape. */}
                <span className="inline-flex w-fit rounded-full bg-white">
                  <Chip tone={priorityTone[item.priority]} label={item.priority} />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  {/* Three cases, deliberately: a route (`to`), an in-page
                      destination (`onSelect` — e.g. switching this record
                      page's own tab), or neither, in which case the title is
                      plain text. A row whose only destination is the page it
                      is already on would be a silently dead control. */}
                  {item.to ? (
                    <Link
                      to={item.to}
                      className={ROW_TITLE}
                    >
                      {item.title}
                    </Link>
                  ) : item.onSelect ? (
                    <button
                      type="button"
                      onClick={item.onSelect}
                      /* Its own ring rather than the row's `has-[a:…]` overlay:
                         that selector cannot tell this button from the kebab,
                         which owns a ring of its own. */
                      /* `min-h-9` + a cancelling negative margin — the same
                         trick the kebab beside it uses. The row-wide `::after`
                         overlay already gives this control a 466x108 hit area
                         (measured: every corner of the row resolves to it), but
                         the element's own box was 17px and `layout-audit.js`
                         reads boxes, not overlays. It never fired on the `<a>`
                         variant only because the check ignores anchors. Fixing
                         the markup keeps the audit honest rather than teaching
                         it to ignore a real class of defect. */
                      className={cn(
                        ROW_TITLE,
                        'flex min-h-9 -my-2.5 items-center text-left focus-visible:ring-2 focus-visible:ring-ring',
                      )}
                    >
                      {item.title}
                    </button>
                  ) : (
                    <span className="text-caption-medium text-ink">{item.title}</span>
                  )}
                  <span className="text-body text-ink">{item.note}</span>
                </div>
              </div>

              {/* A kebab opening a one-item menu, not a bare dismiss button: a
                  kebab that fires an action on click is a lie about what a
                  kebab means, and this app already has kebabs on four surfaces
                  that all open menus. */}
              <div className="relative z-10 -mt-1.5 -mr-1.5 shrink-0">
                <Button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === item.id}
                  onClick={() => setOpenMenu((c) => (c === item.id ? null : item.id))}
                  variant="ghost"
                  tone="neutral"
                  size="icon"
                >
                  <MoreVertical aria-hidden="true" className="size-4" />
                  <span className="sr-only">Options for {item.title}</span>
                </Button>
                {openMenu === item.id && (
                  <div
                    role="menu"
                    className="absolute right-0 z-10 mt-1 min-w-[160px] rounded-sm bg-white p-1 shadow-card ring-1 ring-hairline"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => dismiss(item.id)}
                      className="flex h-9 w-full items-center rounded-xs px-3 text-caption-medium text-ink outline-none transition-colors hover:bg-parchment focus-visible:ring-2 focus-visible:ring-ring"
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
