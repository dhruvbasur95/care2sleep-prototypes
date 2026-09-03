import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, toLocalISODate } from '@/data/format'

/**
 * The first-session date field: a button showing the chosen date, opening a
 * month calendar (Round 38, direct instruction — "open calendar style view
 * when I click on date from dropdown with only that day of week highlighted
 * and can be selected. I do not want a default calendar, use a proper
 * component").
 *
 * Built here rather than pulled in as a dependency: this project hand-builds
 * its controls to its own tokens (`WeekdayPicker`, `TablePager`, `StatusChip`
 * all follow that pattern), and a date-picker library would arrive with its
 * own type scale, radii and focus treatment to override. It is also a
 * deliberately *narrow* calendar — every day is rendered so the coach can see
 * the shape of the month, but only dates matching the agreed catch-up weekday
 * and at or after `minDate` can be chosen. That is the whole point: the plan
 * repeats weekly on one weekday, so any other date is not a real option.
 *
 * Accessibility: the grid is a real `<table>` with day-name column headers, so
 * a screen reader announces "Thursday, 10 September". Unselectable dates are
 * plain `<td>` text rather than disabled buttons — they are not controls at
 * all, so they should not be in the tab order. The popover closes on Escape
 * and on outside click, and returns focus to the trigger, which is this
 * project's most-repeated defect class when missed.
 */

const WEEKDAY_HEADS = [
  { key: 'mon', short: 'M', label: 'Monday' },
  { key: 'tue', short: 'T', label: 'Tuesday' },
  { key: 'wed', short: 'W', label: 'Wednesday' },
  { key: 'thu', short: 'T', label: 'Thursday' },
  { key: 'fri', short: 'F', label: 'Friday' },
  { key: 'sat', short: 'S', label: 'Saturday' },
  { key: 'sun', short: 'S', label: 'Sunday' },
]

/** Monday-first column index for a `Date#getDay()` value. */
function columnIndex(day: number): number {
  return day === 0 ? 6 : day - 1
}

function startOfMonth(iso: string): Date {
  const [y, m] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, 1)
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

export function SessionDateCalendar({
  value,
  onChange,
  weekday,
  minDate,
  disabled,
  id,
}: {
  /** Selected date, ISO `YYYY-MM-DD`. */
  value: string | undefined
  onChange: (iso: string) => void
  /** The only weekday that can be picked (`Date#getDay()`). `null` means any
   *  day is selectable — used when editing a single week on the review step,
   *  where a coach rescheduling one session is not bound to the pattern. */
  weekday: number | null
  /** Earliest selectable date, ISO. */
  minDate: string
  disabled?: boolean
  id: string
}) {
  const [open, setOpen] = useState(false)
  // Screen position of the trigger, so the panel can be portalled out of the
  // table. It has to be: the review step's table wrapper carries
  // `overflow-hidden` for its rounded corners and the modal body scrolls, so
  // an absolutely-positioned panel is clipped by both and the calendar simply
  // never appears — which is exactly how it was reported.
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const [month, setMonth] = useState<Date>(() => startOfMonth(value ?? minDate))
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Reopening should land on the month the coach is actually looking at, not
  // wherever they browsed to last time.
  useEffect(() => {
    if (open) setMonth(startOfMonth(value ?? minDate))
  }, [open, value, minDate])

  // Close on outside click / Escape, returning focus to the trigger — without
  // this the coach is left with focus inside a panel that no longer exists.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  useEffect(() => {
    if (open) requestAnimationFrame(() => panelRef.current?.focus())
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect()
      if (!r) return
      // Flip above the trigger when there is not room below, so the panel is
      // never half off-screen on a short viewport.
      const below = window.innerHeight - r.bottom
      const top = below < 380 && r.top > 380 ? r.top - 372 : r.bottom + 8
      setAnchor({ top, left: Math.min(r.left, window.innerWidth - 336) })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  /** Six rows of seven, Monday-first, covering the visible month. */
  const weeks = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - columnIndex(first.getDay()))
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = new Date(gridStart)
        date.setDate(gridStart.getDate() + w * 7 + d)
        return date
      }),
    )
  }, [month])

  const selectable = (d: Date) =>
    (weekday === null || d.getDay() === weekday) && toLocalISODate(d) >= minDate

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-xs border border-purple-300 bg-card pr-2 pl-2 text-caption-medium text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:border-hairline disabled:text-ink-faint',
        )}
      >
        <span>{value ? formatDate(value) : 'Select a day first'}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </button>

      {open &&
        anchor &&
        createPortal(
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Choose a date"
          style={{ top: anchor.top, left: anchor.left }}
          className="fixed z-[60] w-[320px] rounded-sm border border-parchment bg-card p-4 shadow-float outline-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-caption-medium text-ink">{monthLabel(month)}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className="flex size-9 items-center justify-center rounded-xs text-ink outline-none hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className="flex size-9 items-center justify-center rounded-xs text-ink outline-none hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>

          <table className="mt-2 w-full table-fixed border-collapse">
            <thead>
              <tr>
                {WEEKDAY_HEADS.map((h) => (
                  <th key={h.key} scope="col" className="pb-1 text-fine font-normal text-ink-faint">
                    <span aria-hidden="true">{h.short}</span>
                    <span className="sr-only">{h.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={toLocalISODate(week[0])}>
                  {week.map((d) => {
                    const iso = toLocalISODate(d)
                    const inMonth = d.getMonth() === month.getMonth()
                    const isSelected = iso === value
                    if (!selectable(d)) {
                      return (
                        <td
                          key={iso}
                          className={cn(
                            'py-0.5 text-center text-caption',
                            inMonth ? 'text-ink-faint' : 'text-ink-faint/40',
                          )}
                        >
                          {d.getDate()}
                        </td>
                      )
                    }
                    return (
                      <td key={iso} className="py-0.5 text-center">
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={d.toLocaleDateString('en-AU', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                          onClick={() => {
                            onChange(iso)
                            setOpen(false)
                            triggerRef.current?.focus()
                          }}
                          className={cn(
                            'mx-auto flex size-9 items-center justify-center rounded-full text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                            isSelected
                              ? 'bg-primary text-white'
                              : weekday === null
                                ? // Any-day mode (editing one week): filling all 30+
                                  // dates read as a wall of purple with nothing
                                  // standing out. Plain until hovered, so the only
                                  // filled cell is the one actually chosen.
                                  'text-ink hover:bg-purple-50'
                                : // Weekday-restricted mode: the fill IS the signal,
                                  // marking the handful of dates that can be picked.
                                  'bg-purple-50 text-primary hover:bg-purple-200',
                          )}
                        >
                          {d.getDate()}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-2 text-fine text-ink-faint">
            {weekday === null
              ? `Any date from ${formatDate(minDate)} onwards.`
              : `Only your catch-up day can be chosen, from ${formatDate(minDate)} onwards.`}
          </p>
        </div>,
          document.body,
        )}
    </div>
  )
}
