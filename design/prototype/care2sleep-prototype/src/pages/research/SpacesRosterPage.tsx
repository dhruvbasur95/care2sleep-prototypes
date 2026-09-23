import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Scale, UserRoundCheck, UserRoundX, Users } from 'lucide-react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { OnboardCoachDialog } from '@/components/research/OnboardCoachDialog'
import { CoachStatusChip } from '@/components/research/StatusChip'
import { SearchInput } from '@/components/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
import { MeetingsSection, type ScheduleRow } from '@/components/shared/MeetingsSection'
import {
  catchupSessionsCompleted,
  isPlanSet,
  SPACES_CATCHUP_COUNT,
  type ConsumerDyad,
  type SessionCompletionRecord,
  type SessionPlan,
} from '@/data/spaces'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate } from '@/data/format'
import { type Coach } from '@/data/research'
import { useResearch } from '@/data/research-context'

/** Roster tabs. "Active coaches" is every onboarded SPACES coach; "Waiting to be
 *  onboarded" is the certified-but-not-yet-invited pool the Onboard dialog
 *  draws from — previously visible only inside that dialog's dropdown, so a
 *  researcher had no way to see who was waiting without opening it. */
const COACH_TABS = [
  { id: 'all', label: 'Active coaches' },
  { id: 'waiting', label: 'Waiting to be onboarded' },
  { id: 'withdrawn', label: 'Withdrawn' },
] as const
type CoachTab = (typeof COACH_TABS)[number]['id']

/** What "active" means in the Consumer Caseload column: **a session plan has
 *  been created and the consumer has not finished the 7-session arc** (direct
 *  instruction: "Active -> session planned and ongoing").
 *
 *  That makes the column a workload signal rather than a headcount — an
 *  unplanned consumer is not yet work, and a completed one is no longer work.
 *  It reads the same `isPlanSet` helper the researcher's own "No session plan
 *  built" alert and Consumer Management's Session Plan column read, so the
 *  three cannot disagree about whether a plan exists. */
function activeCaseload(
  dyads: ConsumerDyad[],
  coachId: string,
  plans: Record<string, SessionPlan>,
  completion: Record<string, SessionCompletionRecord[]>,
): { active: number; total: number } {
  const mine = dyads.filter((d) => d.coachId === coachId)
  const active = mine.filter(
    (d) =>
      isPlanSet(plans[d.id]) &&
      catchupSessionsCompleted(completion[d.id] ?? []) < SPACES_CATCHUP_COUNT,
  ).length
  return { active, total: mine.length }
}

/** Group supervision schedule shown under the coaches table. Reuses the
 *  researcher Home's own `MeetingsSection` verbatim (direct instruction:
 *  "re-use what is done for researcher dashboard, no need to connect with
 *  data") — same day grouping, same Upcoming/Scheduled tabs, same row chrome.
 *  `idNamespace` must differ from Home's or `framer-motion` would animate one
 *  underline between two mounted rows. Rows are dummy. */
const SUPERVISION_ROWS: ScheduleRow[] = [
  {
    key: 'sup-1',
    title: 'Group supervision: cohort A',
    attendeeNames: ['Helen Zhang', 'Fatima Haidari'],
    sessionType: 'Coach supervision',
    date: '2026-07-22',
    time: '10:00',
    meetingId: '812 4470 9931',
    zoomLink: 'https://monash.zoom.us/j/81244709931',
  },
  {
    key: 'sup-2',
    title: 'Group supervision: cohort B',
    attendeeNames: ['Helen Zhang'],
    sessionType: 'Coach supervision',
    date: '2026-07-29',
    time: '14:30',
    meetingId: '907 1123 4480',
    zoomLink: 'https://monash.zoom.us/j/90711234480',
  },
]

/** Dummy withdrawn coaches. Not interactive (direct instruction) — no row
 *  links, no chevron. Withdrawal has no write path yet, so these records do
 *  not exist anywhere to open. Column set differs from the other two tabs:
 *  Consumers Handled and Reason for withdrawal replace Consumer Caseload. */
const WITHDRAWN_COACHES = [
  { name: 'Robert Tan', id: 'C2S-C-021', email: 'r.tan@lakeside.example.au', phone: '0412 555 037', handled: 4, reason: 'Relocated interstate' },
  { name: 'Ingrid Sorensen', id: 'C2S-C-024', email: 'i.sorensen@parkview.example.au', phone: '0438 555 610', handled: 2, reason: 'Reduced hours at the organisation' },
] as const

/** Same header treatment as Trainee/Consumer Management's tables. */
const TH = 'px-4 py-3.5 text-caption-medium text-ink-muted'

/**
 * Coach Management Table — the default screen for the Coaches (SPACES
 * delivery oversight) area (round-3-…-prototype-plan.md §1).
 *
 * Round 21: brought onto the same page shape as Trainee Management and
 * Consumer Management — a "Coaches overview" `StatCard` row, then a table
 * section whose heading, sub copy and search sit *above* the card rather than
 * in a `bg-card-header` band (the same documented §35a exception those two
 * pages carry), with an `UnderlineTabs` row beneath.
 */
export function SpacesRosterPage() {
  const { coaches, spacesCoaches, consumerDyads, sessionPlans, sessionCompletion } = useResearch()
  const navigate = useNavigate()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [onboardCoachId, setOnboardCoachId] = useState<string | undefined>(undefined)
  const [tab, setTab] = useState<CoachTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const rows = spacesCoaches
    .map((sc) => {
      const coach = coaches.find((c) => c.id === sc.coachId)
      if (!coach) return null
      const caseload = activeCaseload(consumerDyads, sc.coachId, sessionPlans, sessionCompletion)
      return { sc, coach, dyadCount: caseload.total, activeCount: caseload.active }
    })
    .filter(
      (
        r,
      ): r is {
        sc: (typeof spacesCoaches)[number]
        coach: Coach
        dyadCount: number
        activeCount: number
      } => r !== null,
    )

  const invitedCoachIds = new Set(spacesCoaches.map((sc) => sc.coachId))
  const eligibleCoaches = coaches.filter(
    (c) => c.certification.outcome === 'pass' && !invitedCoachIds.has(c.id),
  )

  // Each count mirrors exactly what the table below renders for the same
  // signal — "No consumers assigned" reads the same `dyadCount` the Consumer
  // Caseload column shows, and "Certified, not onboarded" is the same
  // `eligibleCoaches` pool the second tab lists — so a tile and the rows
  // beneath it can never disagree.
  const noCaseloadCount = rows.filter((row) => row.dyadCount === 0).length

  const q = searchQuery.trim().toLowerCase()
  const matches = (coach: Coach) =>
    !q ||
    coach.fullName.toLowerCase().includes(q) ||
    coach.participantId.toLowerCase().includes(q) ||
    coach.email.toLowerCase().includes(q)

  const visibleRows = rows.filter((row) => matches(row.coach))
  const visibleWaiting = eligibleCoaches.filter(matches)
  const shownCount = tab === 'all' ? visibleRows.length : visibleWaiting.length
  const totalCount = tab === 'all' ? rows.length : eligibleCoaches.length

  /* Counts are derived from the same arrays the tables render, never written —
     a tab claiming a number its own table contradicts is this project's
     most-repeated data bug. The warning rides on "Waiting to be onboarded"
     only while that backlog is non-empty. */
  const tabsWithCounts = COACH_TABS.map((t) =>
    t.id === 'all'
      ? { ...t, count: rows.length }
      : t.id === 'waiting'
        ? { ...t, count: eligibleCoaches.length, warn: eligibleCoaches.length > 0 }
        : { ...t, count: WITHDRAWN_COACHES.length },
  )

  return (
    <ResearchShell
      heroNoSeam
      // Round 21: the same `purple-50` welcome band + `display-xl` purple
      // title + `subtitle`-scale sub copy the Home page introduced, so every
      // Research Dashboard destination shares one hero treatment.
      heroClassName="bg-purple-50"
      hero={
        <ResearchPageHero
          title="Coach management"
          subtitle="Onboard certified coaches and manage their consumer caseloads."
          action={
            <button
              type="button"
              onClick={() => {
                setOnboardCoachId(undefined)
                setInviteOpen(true)
              }}
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Onboard new coach
            </button>
          }
        />
      }
    >
      {/* Coaches overview — the same yellow `StatCard` row Home, Trainee
          Management and Consumer Management use. */}
      <section>
        <h2 className="font-display text-title text-ink">Coaches overview</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total coaches" value={rows.length} icon={Users} />
          <StatCard label="Certified, not onboarded" value={eligibleCoaches.length} icon={UserRoundCheck} />
          <StatCard label="No consumers assigned" value={noCaseloadCount} icon={UserRoundX} />
          {/* Same figure and same formula as Home's own tile, so the two
              surfaces cannot report a different average. `—` rather than NaN
              when there are no coaches to divide by. */}
          <StatCard
            label="Average consumers per coach"
            value={rows.length === 0 ? '—' : (consumerDyads.length / rows.length).toFixed(1)}
            icon={Scale}
          />
        </div>
      </section>

      <section className="mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-title text-ink">Coaches management table</h2>
            <p className="mt-2 text-body text-ink-muted">Click a coach to view more details.</p>
          </div>
          <SearchInput
            id="coach-search"
            label="Search coaches"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search coaches"
            widthClassName="sm:w-[340px]"
          />
        </div>

        <div className="mt-6">
          <UnderlineTabs
            tabs={tabsWithCounts}
            active={tab}
            onChange={setTab}
            ariaLabel="Coach roster"
            layoutId="coach-roster-tab-underline"
            idPrefix="coach-tab"
            panelId="coach-panel"
          />
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {shownCount} of {totalCount} coaches
        </p>

        <div id="coach-panel" role="tabpanel" aria-labelledby={`coach-tab-${tab}`}>
      <Card className="mt-6 gap-0 rounded-lg py-0">
        <div className="overflow-x-auto">
        {tab === 'withdrawn' ? (
          <WithdrawnCoachTable />
        ) : tab === 'waiting' ? (
          <WaitingTable
            coaches={visibleWaiting}
            searching={q.length > 0}
            onOnboard={(coachId) => {
              setOnboardCoachId(coachId)
              setInviteOpen(true)
            }}
          />
        ) : visibleRows.length === 0 ? (
          <p className="p-10 text-center text-body text-ink-muted">
            {rows.length === 0
              ? 'No coaches have been onboarded into SPACES yet.'
              : `No coaches match “${searchQuery.trim()}”.`}
          </p>
        ) : (
          <table className="w-full min-w-[840px] border-collapse text-left">
            <thead>
              <tr className="bg-purple-50">
                <th scope="col" className={cn(TH, 'px-6')}>
                  Coach Name
                </th>
                <th scope="col" className={TH}>
                  Coach ID
                </th>
                <th scope="col" className={TH}>
                  Coach Email
                </th>
                <th scope="col" className={TH}>
                  Coach Phone
                </th>
                <th scope="col" className={TH}>
                  Consumer Caseload
                </th>
                <th scope="col" className="relative px-4 py-3.5">
                  <span className="sr-only">Open profile</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr
                  key={row.sc.id}
                  onClick={() => navigate(`/research/spaces-coaches/${row.coach.id}`)}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-pearl',
                    i > 0 && 'border-t border-hairline',
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex min-h-11 items-center gap-2">
                      <Link
                        to={`/research/spaces-coaches/${row.coach.id}`}
                        aria-label={`View ${row.coach.fullName}'s profile`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-caption font-semibold text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {row.coach.fullName}
                      </Link>
                      {row.coach.status === 'withdrawn' && (
                        <CoachStatusChip status={row.coach.status} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                    {row.coach.participantId}
                  </td>
                  <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                    {row.coach.email}
                  </td>
                  <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                    {row.coach.phone}
                  </td>
                  {/* "2 of 3 active" rather than a bare 3 (direct
                      instruction). Active = session plan created and the arc
                      not yet finished — see `activeCaseload`. */}
                  <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                    {row.dyadCount === 0 ? (
                      <span className="text-ink-faint">None assigned</span>
                    ) : (
                      <>
                        <span className="font-semibold text-ink">
                          {row.activeCount} of {row.dyadCount}
                        </span>{' '}
                        active
                      </>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <ChevronRight
                      aria-hidden="true"
                      className="inline size-4 text-ink-faint"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </Card>
        </div>
      </section>

      {/* Group supervision schedule — reuses the researcher Home's own
          `MeetingsSection`. Dummy rows; nothing here is wired to the store. */}
      <section className="mt-24">
        <MeetingsSection rows={SUPERVISION_ROWS} idNamespace="coach-supervision-meetings" />
      </section>

      <OnboardCoachDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        eligibleCoaches={eligibleCoaches}
        initialCoachId={onboardCoachId}
      />

    </ResearchShell>
  )
}

/**
 * The "Waiting to be onboarded" tab: coaches who passed certification but have
 * no SPACES record yet.
 *
 * Same columns as the main table so the two tabs read as one object, but the
 * rows are deliberately **not** clickable and carry no chevron — there is no
 * SPACES profile to open until the coach is onboarded, and a row that looks
 * navigable but goes nowhere is worse than one that plainly doesn't. Caseload
 * shows a chip rather than "0", which would read as an onboarded coach who
 * simply has no consumers — a different state entirely, and one the tile above
 * counts separately.
 */
function WaitingTable({
  coaches,
  searching,
  onOnboard,
}: {
  coaches: Coach[]
  searching: boolean
  onOnboard: (coachId: string) => void
}) {
  if (coaches.length === 0) {
    return (
      <p className="p-10 text-center text-body text-ink-muted">
        {searching ? 'No coaches match your search.' : 'Every certified coach has been onboarded.'}
      </p>
    )
  }

  return (
    <table className="w-full min-w-[860px] border-collapse text-left">
      <thead>
        <tr className="bg-purple-50">
          <th scope="col" className={cn(TH, 'px-6')}>
            Coach Name
          </th>
          <th scope="col" className={TH}>
            Coach ID
          </th>
          <th scope="col" className={TH}>
            Coach Email
          </th>
          <th scope="col" className={TH}>
            Coach Phone
          </th>
          <th scope="col" className={TH}>
            Certified
          </th>
          <th scope="col" className={cn(TH, 'text-right')}>
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {coaches.map((coach, i) => (
          <tr key={coach.id} className={cn(i > 0 && 'border-t border-hairline')}>
            <td className="px-6 py-4">
              <div className="flex min-h-11 items-center">
                <span className="text-caption font-semibold text-ink">{coach.fullName}</span>
              </div>
            </td>
            <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">{coach.participantId}</td>
            <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">{coach.email}</td>
            <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">{coach.phone}</td>
            <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
              {coach.certification.assessedDate ? formatDate(coach.certification.assessedDate) : '\u2014'}
            </td>
            <td className="px-4 py-4 text-right">
              <button
                type="button"
                onClick={() => onOnboard(coach.id)}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-caption-medium whitespace-nowrap text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
              >
                {/* Wrapped so the layout audit measures this label, not the
                    button box — an `inline-flex` button yields a rect for the
                    box and one for its text line at different tops, which is
                    the documented false positive in `layout-audit.js`. The
                    button is `whitespace-nowrap`; it does not wrap. */}
                <span>Onboard as coach</span>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * The Withdrawn tab's table. Deliberately **not interactive** (direct
 * instruction): no row click, no name link, no chevron column. Withdrawal has
 * no write path yet, so none of these coaches exists as a record to open, and a
 * row that looks navigable but goes nowhere is worse than one that plainly is
 * not — the same call `WaitingTable` already makes for its own rows.
 *
 * Its column set differs from the other two tabs: Consumers Handled and Reason
 * for withdrawal replace Consumer Caseload.
 */
function WithdrawnCoachTable() {
  return (
    <table className="w-full min-w-[840px] border-collapse text-left">
      <thead>
        <tr className="bg-purple-50">
          <th scope="col" className={cn(TH, 'px-6')}>
            Coach Name
          </th>
          <th scope="col" className={TH}>
            Coach ID
          </th>
          <th scope="col" className={TH}>
            Coach Email
          </th>
          <th scope="col" className={TH}>
            Coach Phone
          </th>
          <th scope="col" className={cn(TH, 'whitespace-nowrap')}>
            Consumers Handled
          </th>
          <th scope="col" className={cn(TH, 'whitespace-nowrap')}>
            Reason for withdrawal
          </th>
        </tr>
      </thead>
      <tbody>
        {WITHDRAWN_COACHES.map((c, i) => (
          <tr key={c.id} className={cn(i > 0 && 'border-t border-hairline')}>
            <td className="px-6 py-4">
              <div className="flex min-h-11 items-center">
                <span className="text-caption font-semibold whitespace-nowrap text-ink">{c.name}</span>
              </div>
            </td>
            <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">{c.id}</td>
            {/* Email and reason are the only wide columns here; letting them
                wrap is what keeps the 6-column table inside its card instead
                of scrolling "Reason for withdrawal" out of sight. */}
            <td className="px-4 py-4 text-caption text-ink-muted">{c.email}</td>
            <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">{c.phone}</td>
            <td className="px-4 py-4 text-caption tabular-nums text-ink-muted">{c.handled}</td>
            <td className="px-4 py-4 text-caption text-ink-muted">{c.reason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
