import { CalendarPlus, Video } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatTime, TODAY } from '@/data/format'

/**
 * Generic "upcoming Zoom sessions" panel — originally built into
 * `DeliveryHomePage.tsx` scoped to `ConsumerDyad` (Round 6.1), then reused
 * as-is by `DeliveryConsumerDetailPage`'s Session Logs tab (Round 6.2).
 * Extracted here (Research Dashboard "My Schedule", Round 10) since a third
 * caller with a different row shape (coach trainees, not consumer dyads)
 * made a copy-pasted third variant the wrong call — callers now build their
 * own `UpcomingSessionRow[]` and this component only handles grouping/
 * display.
 */

export interface UpcomingSessionRow {
  key: string
  title: string
  subtitle?: string
  date: string
  time: string
  meetingId: string
  zoomLink: string
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Day-group header — "Today, {day} {month}" for TODAY, else
 *  "{Weekday}, {day} {month}", per the ux-copy.md Round 6.1 spec. */
function formatDayHeader(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const label = `${d} ${MONTHS[(m ?? 1) - 1]}`
  if (iso === TODAY) return `Today, ${label}`
  return `${WEEKDAYS[new Date(y, (m ?? 1) - 1, d).getDay()]}, ${label}`
}

export function UpcomingSessionsPanel({
  rows,
  title = 'Upcoming sessions',
  emptyMessage = 'No sessions scheduled right now.',
  onAddAdHocClick,
  ctaLabel = 'Add ad-hoc meeting',
  ctaVariant = 'outline',
}: {
  rows: UpcomingSessionRow[]
  title?: string
  /** Design critique (Round 14): the two callers that pass `onAddAdHocClick`
   *  only ever populate `rows` from ad-hoc meetings, never the dyad's
   *  planned 7-session arc — so the generic "No sessions scheduled right
   *  now." copy read as flatly wrong on a consumer with a full plan and a
   *  session due today (that info just lives in a different card/table).
   *  Those two callers now pass a copy override that's honest about what
   *  this panel actually tracks. */
  emptyMessage?: string
  /** Session planning (Round 14) — when provided, the panel's CTA becomes a
   *  real "Add ad-hoc meeting" button; when omitted, it stays disabled
   *  ("not yet available"), unchanged from before. Only wired where a
   *  single, known consumer dyad is in scope to attach the meeting to. */
  onAddAdHocClick?: () => void
  /** Optional CTA label override (default "Add ad-hoc meeting"). */
  ctaLabel?: string
  /** Optional CTA visual weight — 'outline' (default, unchanged) or
   *  'primary' (filled, matching this file's own "Join Zoom" visual weight)
   *  for callers whose panel is meant to be more CTA-forward. */
  ctaVariant?: 'outline' | 'primary'
}) {
  const sorted = [...rows].sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
  )

  const groupMap = new Map<string, UpcomingSessionRow[]>()
  for (const row of sorted) {
    const bucket = groupMap.get(row.date) ?? []
    bucket.push(row)
    groupMap.set(row.date, bucket)
  }
  const groups = [...groupMap.entries()]

  // Accessibility/design fix: when the card header itself already reads
  // "Today" (ResearchHomePage's filtered-to-today panel, currently titled
  // "Today's sessions") and every row is for today, the per-day-group header
  // would just repeat "Today, {date}" right underneath — redundant, not just
  // visually but for screen readers reading both headings back to back.
  // Suppress the day-group header only in that exact case; every other
  // caller (multi-day panels, or panels titled something else) keeps it.
  // Matched by prefix (not exact string) so a copy tweak to the title prop
  // — e.g. "Today" -> "Today's sessions" — can't silently break this again.
  const suppressDayHeader =
    title.toLowerCase().startsWith('today') && groups.every(([date]) => date === TODAY)

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="bg-card-header p-6">
        <h2 className="font-display text-title">{title}</h2>
      </div>

      <div className="flex flex-1 flex-col border-t border-hairline p-6 pt-4">
        {/* Round 6.2.1 — this wrapper grows to fill any extra card height
         *  (e.g. when a taller sibling card, like Session notes, stretches
         *  this card via the grid's default row-stretch), so "Schedule a
         *  session" always sits flush with the card's bottom edge instead of
         *  floating right under a short session list. */}
        <div className="flex-1">
          {groups.length === 0 ? (
            <div className="flex h-full min-h-[160px] items-center justify-center rounded-sm bg-pearl p-6 text-center">
              <p className="text-caption text-ink-muted">{emptyMessage}</p>
            </div>
          ) : (
            <div className="max-h-[189px] space-y-5 overflow-y-auto pr-1">
              {groups.map(([date, dateRows]) => (
                <div key={date}>
                  {!suppressDayHeader && (
                    <p className="text-fine font-semibold text-ink-muted">{formatDayHeader(date)}</p>
                  )}
                  <div className={suppressDayHeader ? 'space-y-3' : 'mt-2 space-y-3'}>
                    {dateRows.map((row) => (
                      <div
                        key={row.key}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-hairline bg-pearl p-4"
                      >
                        <div>
                          <p className="text-caption font-semibold text-ink">{row.title}</p>
                          {row.subtitle && (
                            <p className="mt-0.5 text-caption text-ink-muted">{row.subtitle}</p>
                          )}
                          <p className="mt-0.5 text-fine text-ink-faint">
                            {formatTime(row.time)} · Meeting ID {row.meetingId}
                          </p>
                        </div>
                        <a
                          href={row.zoomLink}
                          target="_blank"
                          rel="noreferrer"
                          className="relative inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                        >
                          <Video aria-hidden="true" className="size-4" />
                          Join Zoom
                          <span className="sr-only"> for {row.title}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-disabled={onAddAdHocClick ? undefined : 'true'}
          onClick={onAddAdHocClick}
          className={
            ctaVariant === 'primary'
              ? 'relative mt-5 flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-sm bg-primary text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]'
              : 'relative mt-5 flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-sm border border-primary text-caption-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]'
          }
        >
          <CalendarPlus aria-hidden="true" className="size-4" />
          {ctaLabel}
          {/* Round 6.1.1 accessibility fix, still true where no handler is
           *  wired: a real, focusable button that visually looks the same
           *  either way. aria-disabled (unlike native `disabled`) keeps it
           *  focusable while announcing it as unavailable to assistive tech. */}
          {!onAddAdHocClick && <span className="sr-only"> (not yet available)</span>}
        </button>
      </div>
    </Card>
  )
}
