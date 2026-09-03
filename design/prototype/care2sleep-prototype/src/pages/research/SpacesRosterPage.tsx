import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, UserRoundCheck, Users, UserRoundX } from 'lucide-react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { OnboardCoachDialog } from '@/components/research/OnboardCoachDialog'
import { CoachStatusChip } from '@/components/research/StatusChip'
import { SearchInput } from '@/components/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
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
] as const
type CoachTab = (typeof COACH_TABS)[number]['id']

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
  const { coaches, spacesCoaches, consumerDyads } = useResearch()
  const navigate = useNavigate()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [onboardCoachId, setOnboardCoachId] = useState<string | undefined>(undefined)
  const [tab, setTab] = useState<CoachTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const rows = spacesCoaches
    .map((sc) => {
      const coach = coaches.find((c) => c.id === sc.coachId)
      if (!coach) return null
      const dyadCount = consumerDyads.filter((d) => d.coachId === sc.coachId).length
      return { sc, coach, dyadCount }
    })
    .filter((r): r is { sc: (typeof spacesCoaches)[number]; coach: Coach; dyadCount: number } => r !== null)

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
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total coaches" value={rows.length} icon={Users} />
          <StatCard label="No consumers assigned" value={noCaseloadCount} icon={UserRoundX} />
          <StatCard label="Certified, not onboarded" value={eligibleCoaches.length} icon={UserRoundCheck} />
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
            tabs={COACH_TABS}
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
        {tab === 'waiting' ? (
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
          <table className="w-full min-w-[980px] border-collapse text-left">
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
                  <td className="px-4 py-4 text-caption text-ink-muted">
                    {row.dyadCount}
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
    <table className="w-full min-w-[1040px] border-collapse text-left">
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
                Onboard as coach
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
