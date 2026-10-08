import { motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The Research Dashboard's section-level tab row (Round 21).
 *
 * Extracted the moment it got a second caller: Home's "Schedule and track your
 * meetings" (Upcoming / Scheduled) and Trainee Management's roster (Active
 * trainees / Certified) are meant to behave identically — direct instruction
 * was "this tab will operate same as one for schedule sessions" — so they now
 * share one implementation rather than two copies that drift.
 *
 * Behaviour, all of it this app's own convention rather than the Figma frames'
 * (which draw a static colour-only active tab):
 * - A sliding `framer-motion` `layoutId` underline, the same `h-0.5 bg-primary`
 *   bar and spring the record-page tab rows use, so switching tabs animates
 *   consistently everywhere in the dashboard.
 * - Roving tabindex + Left/Right/Home/End keys, per the WAI-ARIA tabs pattern:
 *   only the selected tab is in the tab sequence, and arrows move both focus
 *   and selection.
 * - Active state is carried by weight *and* colour, never colour alone.
 *
 * `layoutId` must be unique per mounted tab row on a page — two rows sharing one
 * id would make `framer-motion` animate a single underline between them.
 */
export function UnderlineTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  layoutId,
  idPrefix,
  panelId,
  /** Pulls the row left by its own tab padding so the **first tab's label**
   *  lands on the page's content gutter rather than 16px inside it.
   *
   *  Each tab carries `px-4`, which is what gives the underline its inset and
   *  the row its click targets — so with no correction the first label sits
   *  16px right of every heading and card below it, which reads as a
   *  misaligned column (direct instruction, measured at 16px). The bottom rule
   *  is deliberately *not* pulled: it belongs to the full content width.
   *
   *  Off by default, so the three existing callers stay byte-identical. */
  flushStart = false,
  /** Thickness of the active tab's sliding underline.
   *
   *  `'section'` (default) is this row's own 2px bar, unchanged for every
   *  existing caller. `'page'` is the 5px bar the record pages' own top-level
   *  tab rows use — pass it where a section row sits directly under one of
   *  those, so the two selected states read as the same mark at two levels
   *  rather than two different treatments (direct instruction, Round 37). */
  underlineEmphasis = 'section',
}: {
  tabs: readonly {
    id: T
    label: string
    /**
     * Optional count rendered after the label as a bold `(n)` — Coach
     * Management shows how many rows sit behind each tab before you open it.
     * Additive: every other caller omits it and renders exactly as before.
     */
    count?: number
    /**
     * Shows an amber warning glyph before the label. Coach Management sets it
     * on "Waiting to be onboarded" whenever that count is non-zero — certified
     * coaches with no coach record are a backlog, not a resting state. Paired
     * with the count rather than replacing it, so the icon is never the only
     * thing carrying the signal.
     */
    warn?: boolean
  }[]
  active: T
  onChange: (id: T) => void
  ariaLabel: string
  layoutId: string
  /** Prefix for each tab's DOM id, so a panel can point at it via `aria-labelledby`. */
  idPrefix: string
  panelId: string
  flushStart?: boolean
  underlineEmphasis?: 'section' | 'page'
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
            {t.warn && (
              <TriangleAlert
                aria-hidden="true"
                className="mr-1.5 inline-block size-4 shrink-0 align-[-3px] text-amber-600"
              />
            )}
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1 font-semibold">({t.count})</span>
            )}
            {active === t.id && (
              <motion.span
                layoutId={layoutId}
                className={cn(
                  'absolute inset-x-4 rounded-full bg-primary',
                  underlineEmphasis === 'page'
                    ? // `-bottom-0.5` overlaps the row's own baseline rule, so
                      // the two read as one mark — same as the record pages'
                      // top-level rows.
                      '-bottom-0.5 h-[5px]'
                    : 'bottom-0 h-0.5',
                )}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
