import { useState } from 'react'
import { Calendar, CalendarPlus } from 'lucide-react'
import { InertButton } from '@/components/shared/InertButton'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { formatDate, formatTime, TODAY } from '@/data/format'

/**
 * "Schedule and track your meetings" — the day-grouped meetings list on
 * Research Home, split across Upcoming and Scheduled tabs.
 *
 * One caller: `ResearchHomePage`, which builds the rows by merging cohort-wide
 * group-practice sessions with individual placement and supervision bookings.
 * This component is purely presentational — it does no data derivation and
 * assumes **rows arrive already sorted by date**, because `groupByDay` only
 * merges *consecutive* same-day rows.
 *
 * ⚠️ The Upcoming/Scheduled split is computed against `TODAY`, the frozen date
 * constant in `data/format.ts`, not the real clock. `TODAY` is currently weeks
 * in the past, so "Upcoming" shows meetings that have already happened.
 * Replacing `TODAY` with a real clock fixes this here for free.
 *
 * ⚠️ Three controls here are inert: the per-row `Edit`/`Delete` pair and the
 * `Schedule session` CTA. They render through the shared `InertButton`, whose
 * doc comment is the index of every unwired control in the package and what
 * each is waiting on. Read it before wiring these — `Edit`/`Delete` have two
 * different write targets depending on row kind.
 *
 * The `Start` links are real `<a href target="_blank">` to `zoom.us`, built
 * from fabricated meeting ids. They are live outbound links to a third party,
 * not inert placeholders.
 */

/** One meeting row. A group-practice row carries several `attendeeNames`; a
 *  placement or supervision row carries one. That difference is what makes
 *  `Edit`/`Delete` two write paths rather than one. */
export interface ScheduleRow {
  key: string
  /** The meeting's own real title. */
  title: string
  attendeeNames: string[]
  sessionType: string
  /** ISO date. */
  date: string
  /** "HH:MM". */
  time: string
  meetingId: string
  zoomLink: string
}

const MEETINGS_TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'scheduled', label: 'Scheduled' },
] as const
type MeetingsTab = (typeof MEETINGS_TABS)[number]['id']

const ROW_UTILITY_BUTTON =
  'inline-flex h-9 items-center rounded-sm bg-pearl px-4 text-caption text-ink-muted outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]'

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TOMORROW = addDays(TODAY, 1)

function dayLabel(iso: string): string {
  if (iso === TODAY) return 'Today'
  if (iso === TOMORROW) return 'Tomorrow'
  return formatDate(iso)
}

/** Groups an already-sorted row list into consecutive same-day blocks. */
function groupByDay(rows: ScheduleRow[]): { date: string; rows: ScheduleRow[] }[] {
  const groups: { date: string; rows: ScheduleRow[] }[] = []
  for (const row of rows) {
    const last = groups[groups.length - 1]
    if (last && last.date === row.date) last.rows.push(row)
    else groups.push({ date: row.date, rows: [row] })
  }
  return groups
}

function MeetingRow({ row }: { row: ScheduleRow }) {
  return (
    <div className="flex flex-col gap-4 border-b border-hairline bg-card px-6 py-5 last:border-b-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      <div className="flex w-full shrink-0 flex-col gap-1 lg:w-[200px]">
        <p className="text-caption font-bold text-ink">{formatTime(row.time)}</p>
        <p className="text-caption text-ink-faint">Melbourne time</p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-caption font-bold text-ink">{row.title}</p>
        <p className="truncate text-caption text-ink-faint">
          {row.sessionType} · {row.attendeeNames.join(', ')} · Meeting ID {row.meetingId}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href={row.zoomLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
        >
          Start
          <span className="sr-only"> {row.title}</span>
        </a>
        <InertButton label="Edit" className={ROW_UTILITY_BUTTON} />
        <InertButton label="Delete" className={ROW_UTILITY_BUTTON} />
      </div>
    </div>
  )
}

export function MeetingsSection({
  rows,
  title = 'Schedule and track your meetings',
  /** ⚠️ Must be unique per mounted instance. It namespaces both the
   *  `framer-motion` `layoutId` (two rows sharing one id animate a single
   *  underline flying between them) and the tab/panel DOM ids that wire
   *  `aria-controls`/`aria-labelledby` together. */
  idNamespace,
}: {
  rows: ScheduleRow[]
  title?: string
  idNamespace: string
}) {
  const [tab, setTab] = useState<MeetingsTab>('upcoming')

  const visible = rows.filter((row) =>
    tab === 'upcoming' ? row.date === TODAY || row.date === TOMORROW : row.date > TOMORROW,
  )
  const groups = groupByDay(visible)
  const panelId = `${idNamespace}-panel`

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-title text-ink">{title}</h2>
        <InertButton
          label="Schedule session"
          appearance="active"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
        >
          <CalendarPlus aria-hidden="true" className="size-4" strokeWidth={2} />
        </InertButton>
      </div>

      <div className="mt-6">
        <UnderlineTabs
          tabs={MEETINGS_TABS}
          active={tab}
          onChange={setTab}
          ariaLabel="Meetings"
          layoutId={`${idNamespace}-tab-underline`}
          idPrefix={`${idNamespace}-tab`}
          panelId={panelId}
        />
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${idNamespace}-tab-${tab}`}
        className="mt-3"
      >
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-sm bg-parchment py-16 text-center">
            <span
              aria-hidden="true"
              className="flex size-16 items-center justify-center rounded-full bg-primary/10"
            >
              <Calendar className="size-8 text-primary" strokeWidth={1.75} />
            </span>
            <p className="text-body text-ink-faint">
              {tab === 'upcoming'
                ? 'Nothing scheduled today or tomorrow.'
                : 'Nothing scheduled further out.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <div key={group.date} className="flex flex-col gap-2">
                <h3 className="rounded-sm bg-yellow-200 px-6 py-2 text-body-md text-ink">
                  {dayLabel(group.date)}
                </h3>
                <div className="overflow-hidden rounded-sm border border-parchment shadow-card">
                  {group.rows.map((row) => (
                    <MeetingRow key={row.key} row={row} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
