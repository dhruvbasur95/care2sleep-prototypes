import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * The section-level tab row. Used by `MeetingsSection` (Upcoming / Scheduled),
 * the trainee and coach rosters, and the consumer and coach record pages —
 * every tabbed section in the dashboard behaves identically because they all
 * mount this.
 *
 * Fully controlled: it owns no state. The caller holds the active tab and
 * decides what a change means.
 *
 * ⚠️ LOAD-BEARING ACCESSIBILITY — this implements the WAI-ARIA tabs pattern,
 * and each piece is required by the roles it claims. Do not simplify:
 *  - **Roving tabindex.** Only the selected tab is in the tab sequence
 *    (`tabIndex={0}`); the rest are `-1`. A `role="tab"` row where every tab is
 *    tabbable is a broken pattern, not a stylistic choice.
 *  - **Arrow / Home / End keys** move focus *and* selection, and the handler
 *    calls `.focus()` explicitly — changing `active` alone moves the tabindex
 *    but not the browser's focus.
 *  - **`aria-selected` + `aria-controls`** wire each tab to its panel. The
 *    caller must render a matching `role="tabpanel"` with `id={panelId}` and
 *    `aria-labelledby={`${idPrefix}-${active}`}` — see `MeetingsSection` for
 *    the reference wiring.
 *  - The active tab is carried by **weight and colour together**, never colour
 *    alone.
 *
 * ⚠️ `layoutId` must be unique per mounted tab row on a page. Two rows sharing
 * one id make `framer-motion` animate a single underline flying between them.
 * `idPrefix` must likewise be unique, since it mints DOM ids.
 */
export function UnderlineTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  layoutId,
  idPrefix,
  panelId,
  /** Pulls the row left by its own tab padding so the FIRST tab's label lands
   *  on the page's content gutter rather than 16px inside it.
   *
   *  Each tab carries `px-4`, which gives the underline its inset and the row
   *  its click targets — so with no correction the first label sits 16px right
   *  of every heading and card below it, which reads as a misaligned column.
   *  The bottom rule is deliberately NOT pulled: it belongs to the full content
   *  width. Off by default, so existing callers are unchanged. */
  flushStart = false,
}: {
  tabs: readonly { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  ariaLabel: string
  layoutId: string
  /** Prefix for each tab's DOM id, so a panel can point at it via `aria-labelledby`. */
  idPrefix: string
  panelId: string
  flushStart?: boolean
}) {
  return (
    <div className="border-b border-hairline">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn('flex gap-2', flushStart && '-ml-4')}
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${idPrefix}-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={panelId}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              let next: number
              if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
              else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
              else if (e.key === 'Home') next = 0
              else if (e.key === 'End') next = tabs.length - 1
              else return
              e.preventDefault()
              onChange(tabs[next].id)
              document.getElementById(`${idPrefix}-${tabs[next].id}`)?.focus()
            }}
            className={cn(
              'relative rounded-t-sm px-4 py-2.5 text-[15px] whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              active === t.id ? 'font-semibold text-primary' : 'font-medium text-ink hover:text-primary',
            )}
          >
            {t.label}
            {active === t.id && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
