import { useEffect, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * "Key updates" — the derived-facts panel on the right-hand side of the
 * Overview tab's learning/progress card, on **both** researcher record pages
 * (trainee and consumer).
 *
 * ## Why this exists
 * Direct instruction, 2026-09-21: *"Key updates -> reuse component as used in
 * home and coach important key updates page, streamline here also so that
 * there is one single component."*
 *
 * Before this, the panel existed **twice**, hand-rolled, in
 * `CoachProfilePage.tsx` and `ConsumerDetailPage.tsx` — byte-identical markup
 * differing only in which helper built the rows. Two copies of one panel is
 * precisely the copy-paste drift that took the page hero across five pages in
 * Round 21, so the markup now lives here and both pages pass rows in.
 *
 * ## The row is the attention-list row, deliberately
 * The row vocabulary is `ResearchPrioritiesSection`'s (Home) and, through it,
 * the coach portal's `PrioritiesSection`: a `purple-50` card, a
 * `caption-medium` title over a `body` line, and a kebab opening a one-item
 * Dismiss menu. Three surfaces, one row treatment — which is what the
 * instruction asked for. The old row was a bottom-ruled `label: value` line
 * that looked like nothing else in the app.
 *
 * ## Three deliberate differences from the Home attention list
 *
 * 1. **No priority chip.** Home's rows are *alerts* and the source
 *    classification gives each one a real High/Medium priority. These rows are
 *    *facts* — an ongoing module, an accuracy figure, a booked session. There
 *    is no severity behind them, and a chip would invent a ranking that does
 *    not exist. This is the same reasoning `PrioritiesSection` already records
 *    for why the coach portal's own list carries no colour.
 *
 * 2. **The count pill is `purple-500`/white (4.85:1), not Home's
 *    `alert-pastel`/white.** Home's pill is a documented, explicitly requested
 *    AA exception at 3.45:1. An exception that was argued for on one surface is
 *    not a licence to spread it to a new one, so this panel keeps the pill that
 *    passes.
 *
 * 3. **Scrolls rather than pages.** Home's list is full width with `TablePager`
 *    beneath it; this panel is a fixed 640px column inside a card, sharing a
 *    row with the progress panel. A pager would add a row of controls to a box
 *    already constrained in height.
 *
 * ## What was dropped
 * **"Mark all as read" is gone.** It was an `aria-disabled` control with no
 * write path — "read" is not a state this app persists — and the Notion brief
 * never asked for it. Leaving a permanently dead control beside a kebab that
 * now genuinely dismisses would make the working control look dead too. The
 * per-row kebab went the other way: it used to be inert and now does the job
 * its equivalent does on Home.
 *
 * Dismissal is local state and is not persisted, exactly like Home's.
 */
export interface KeyUpdateItem {
  /** Stable within one record's list; used as the React key and dismiss id. */
  id: string
  /** What the fact is — "Ongoing module", "Next session". */
  label: string
  /** The fact itself. */
  value: string
  /** Optional text-colour class for the value, e.g. `text-destructive` for an
   *  overdue annotation summary. Defaults to `text-ink`. */
  tone?: string
  /** Renders the value semibold. Used for module rows, which the brief asks to
   *  show as a bold "Module 9: Setting the Stage for Sleep". */
  strong?: boolean
}

export function KeyUpdatesPanel({
  items,
  className,
}: {
  items: KeyUpdateItem[]
  className?: string
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const headingRef = useRef<HTMLParagraphElement>(null)

  const visible = items.filter((i) => !dismissed.has(i.id))

  /* A record swap (navigating trainee -> trainee) keeps this component mounted
     with a fresh `items` array, and a dismissed id from the previous record
     could collide with one in the new list and hide a row nobody dismissed.
     Keyed on the joined id list rather than a count, which would not change
     when two records happen to produce the same number of updates. */
  const identity = items.map((i) => i.id).join('|')
  useEffect(() => {
    setDismissed(new Set())
    setOpenMenu(null)
  }, [identity])

  /* Dismissing unmounts the button that was clicked, so focus would fall to
     `<body>` — this project's most-repeated defect, shipped in six rounds.
     Land on the panel's own heading while rows remain, and on `#main-content`
     once the last row goes. Same contract `ResearchPrioritiesSection` uses. */
  const dismiss = (id: string) => {
    const remaining = visible.filter((i) => i.id !== id).length
    setDismissed((prev) => new Set(prev).add(id))
    setOpenMenu(null)
    if (remaining > 0) headingRef.current?.focus({ preventScroll: true })
    else document.getElementById('main-content')?.focus({ preventScroll: true })
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-6 overflow-hidden rounded-sm bg-parchment p-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <p
          ref={headingRef}
          tabIndex={-1}
          className="text-body-md whitespace-nowrap text-ink outline-none"
        >
          Key updates
        </p>
        {/* `purple-500` fill with white text: 4.85:1, clears AA. */}
        <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-purple-500 px-2 text-caption-medium text-white">
          {visible.length} {visible.length === 1 ? 'update' : 'updates'}
        </span>
      </div>

      {visible.length === 0 ? (
        /* Every row dismissible means "none left" is reachable, so it needs a
           resting state rather than an empty box. One line, per
           `EmptyState`'s own rule — this is a resting state, not an error. */
        <p className="flex-1 rounded-xs bg-card p-3 text-body text-ink-muted">
          No updates to show.
        </p>
      ) : (
        /* Capped rather than growing with the list: a record with nine updates
           scrolls instead of stretching the card away from the progress panel
           beside it. */
        <ul className="flex max-h-[268px] min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xs bg-card p-3">
          {visible.map((u) => (
            <li
              key={u.id}
              className="flex shrink-0 items-start justify-between gap-3 rounded-xs bg-purple-50 p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-caption-medium text-ink">{u.label}</span>
                <span
                  className={cn(
                    'text-body',
                    u.tone ?? 'text-ink',
                    u.strong && 'font-semibold',
                  )}
                >
                  {u.value}
                </span>
              </div>

              {/* A kebab opening a one-item menu, not a bare dismiss button —
                  a kebab that fires an action on click is a lie about what a
                  kebab means, and this app has kebabs on five surfaces that
                  all open menus. `-mt-1.5 -mr-1.5` keeps a real 36px target
                  without the row growing around it. */}
              <div className="relative -mt-1.5 -mr-1.5 shrink-0">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === u.id}
                  onClick={() => setOpenMenu((c) => (c === u.id ? null : u.id))}
                  className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreVertical aria-hidden="true" className="size-4" />
                  <span className="sr-only">Options for {u.label}</span>
                </button>
                {openMenu === u.id && (
                  <div
                    role="menu"
                    className="absolute right-0 z-10 mt-1 min-w-[160px] rounded-sm bg-white p-1 shadow-card ring-1 ring-hairline"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => dismiss(u.id)}
                      className="flex h-9 w-full items-center rounded-xs px-3 text-caption-medium text-ink outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
