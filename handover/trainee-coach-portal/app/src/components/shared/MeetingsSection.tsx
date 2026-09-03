import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CalendarPlus } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { formatDate, formatTime, TODAY } from '@/data/format'
import { cn } from '@/lib/utils'

/**
 * "Schedule and track your meetings" — the day-grouped, Upcoming/Scheduled
 * meetings table.
 *
 * Extracted from `ResearchHomePage.tsx` in Round 29 the moment it got a second
 * caller: the Coach Delivery Portal's Home shows the same table in both coach
 * stages (direct instruction), differing only in *which* meetings it lists —
 * a trainee sees their own group practice and placement sessions, a certified
 * coach sees their consumer catch-ups. Same behaviour everywhere, so one
 * implementation rather than two that drift, per this project's own reason for
 * extracting `ResearchPageHero`.
 *
 * The caller supplies already-sorted rows. Everything visual is unchanged from
 * the researcher original, including the two frame-driven divergences worth
 * knowing about:
 * - Row buttons use this app's canonical pill/utility styles, not the frame's
 *   own bordered rects ("buttons don't match our style").
 * - `Edit` / `Delete` / `Schedule session` have no write path yet, so they are
 *   focusable `aria-disabled` controls with an `sr-only` cue rather than
 *   silently dead buttons.
 */

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
  /**
   * This meeting is not this page's to change — Edit and Delete are rendered
   * *absent*, not disabled (Round 40, direct instruction).
   *
   * Set on a client's planned SPACES session. Those dates come from the session
   * plan and are edited there, through `EditSessionPlanModal`, which is the
   * only path that keeps a session, its module target date and the rest of the
   * arc in agreement. Letting a schedule row rewrite one date in isolation
   * would be a second, weaker editor for the same record — and "Delete" has no
   * honest meaning at all for a session the protocol requires.
   *
   * Absent rather than disabled for the same reason the coach's Profile details
   * tab omits Withdraw: a control the coach may never use here is not a
   * control, and a greyed one invites "so who can press it?".
   */
  readOnly?: boolean
  /**
   * Where "View details" goes, when this meeting is with someone whose record
   * the viewer can open (Round 40). Absent means no button at all rather than a
   * disabled one — the Research Dashboard's group-practice rows have several
   * attendees and its supervision rows point at a coach, so neither has a
   * single client record to land on.
   */
  detailsHref?: string
  /**
   * Drop the "Start Session" pill from this row (Round 40, direct instruction).
   *
   * A coach's schedule is for *seeing* what is booked. Joining a client session
   * belongs in that client's own record, where the session plan, the case notes
   * and the sleep data are — a Zoom link on a schedule row invites a coach to
   * drop into a session with none of that in front of them. "View details"
   * becomes the row's primary action instead, and it is the route to the place
   * the Join control actually lives.
   *
   * The Research Dashboard's own rows are untouched: a researcher joining a
   * group practice or a supervision call has no client record to prepare from,
   * so Start is the right and only action there.
   */
  hideStart?: boolean
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

export function InertButton({
  label,
  className,
  children,
  appearance = 'dimmed',
}: {
  label: string
  className: string
  children?: ReactNode
  appearance?: 'dimmed' | 'active'
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      className={cn(className, appearance === 'dimmed' ? 'cursor-default' : 'cursor-pointer')}
    >
      {children}
      {label}
      <span className="sr-only"> (coming soon)</span>
    </button>
  )
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
        {!row.hideStart && (
        <a
          href={row.zoomLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
        >
          {/* Round 40, direct instruction: "Start" -> "Start Session". Renamed
              on the shared row rather than only on the coach's client rows —
              one control with two names across two portals is the drift this
              component exists to prevent. */}
          Start Session
          <span className="sr-only"> {row.title}</span>
        </a>
        )}
        {/* Round 40, direct instruction: a session scheduled with a client gets
            a way through to that client, right after Start. Only rows that name
            a real destination get it — the Research Dashboard's group-practice
            and supervision rows have no single client to open, so they render
            nothing rather than a dead button. */}
        {row.detailsHref && (
          <Link
            to={row.detailsHref}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-full px-[18px] text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              /* Primary when it is the row's only way through, outline when it
                 sits beside Start. A row's one action should not be an outline
                 pill next to two utility buttons. */
              row.hideStart
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'border border-primary text-primary hover:bg-purple-50',
            )}
          >
            View details
            <span className="sr-only"> for {row.title}</span>
          </Link>
        )}
        {!row.readOnly && (
          <>
            <InertButton label="Edit" className={ROW_UTILITY_BUTTON} />
            <InertButton label="Delete" className={ROW_UTILITY_BUTTON} />
          </>
        )}
      </div>
    </div>
  )
}

export function MeetingsSection({
  rows,
  title = 'Schedule and track your meetings',
  /**
   * The Coach Delivery Portal's own My meetings page puts the title and the
   * schedule action in its page hero instead, so it renders this without a
   * header — otherwise the same heading and button would appear twice, 40px
   * apart. Research Home keeps the inline header it was built with.
   */
  showHeader = true,
  /** Must be unique per mounted instance — `framer-motion` would otherwise
   *  animate one underline between two rows on the same page. */
  idNamespace,
}: {
  rows: ScheduleRow[]
  title?: string
  showHeader?: boolean
  idNamespace: string
}) {
  const [tab, setTab] = useState<MeetingsTab>('upcoming')

  /* One predicate, read three times — the two counts and the visible list.
     Written out twice, a tab could show "(2)" over an empty table. */
  const isUpcoming = (row: ScheduleRow) => row.date === TODAY || row.date === TOMORROW
  const inTab = (row: ScheduleRow, t: MeetingsTab) =>
    t === 'upcoming' ? isUpcoming(row) : row.date > TOMORROW

  /* Round 40, direct instruction: counts on both tabs. A parenthesised number
     rather than the count badge the Case notes filter pills carry —
     `UnderlineTabs` takes a plain string label, and widening it to a ReactNode
     would change every tab row in four portals for one page's benefit. */
  const tabs = MEETINGS_TABS.map((t) => ({
    id: t.id,
    label: `${t.label} (${rows.filter((row) => inTab(row, t.id)).length})`,
  }))

  const visible = rows.filter((row) => inTab(row, tab))
  const groups = groupByDay(visible)
  const panelId = `${idNamespace}-panel`

  return (
    <section>
      {showHeader && (
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
      )}

      <div className={showHeader ? 'mt-6' : ''}>
        <UnderlineTabs
          tabs={tabs}
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
          /* Round 40, direct instruction: streamlined onto the app's own empty
             state. This was a hand-rolled near-copy of `EmptyState` — same
             circle, same icon, same one-liner — at its own larger geometry
             (64px badge, 32px icon, `body`/`ink-faint`) on a `parchment` slab
             with no card around it. Two consequences: it was visibly a
             different size from every other "nothing here" state in the app,
             and the slab read as a tinted patch rather than as an empty
             version of the table it replaces.

             The wrapper is the same white + `parchment` stroke + card shadow
             the Case notes and My reflections tables use, so an empty table and
             a full one are one surface. Shared component, so the Research
             Dashboard's own Home page gets the same fix — which is the point,
             not a side effect. */
          <div className="overflow-hidden rounded-lg border border-parchment bg-white shadow-card">
            <EmptyState
              icon={Calendar}
              copy={
                tab === 'upcoming'
                  ? 'Nothing scheduled today or tomorrow.'
                  : 'Nothing scheduled further out.'
              }
            />
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
