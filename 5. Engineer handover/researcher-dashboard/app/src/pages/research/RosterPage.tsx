import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, ChevronRight, Clock, UserCheck, Users } from 'lucide-react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { Card } from '@/components/ui/card'
import { SearchInput } from '@/components/SearchInput'
import { AddCoachTraineeModal } from '@/components/research/AddCoachTraineeModal'
import { InviteStatusChip } from '@/components/research/StatusChip'
import { StatCard } from '@/components/shared/StatCard'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { cn } from '@/lib/utils'
import { stageLabel, type Coach } from '@/data/research'
import { PATHWAY_MODULES_V2 } from '@/data/trainingPathwayV2'
import { formatDate, TODAY } from '@/data/format'
import { useResearch } from '@/data/research-context'

/**
 * Trainee Management — route `/research/trainees`. The roster of coach trainees
 * still working through the COACH certification pathway, and the drill-in point
 * for `CoachProfilePage` (`/research/coaches/:coachId`).
 *
 * Shape: hero (`ResearchPageHero`) → "Trainees overview" KPI row → a table
 * section with its own heading, search field and `UnderlineTabs`.
 *
 * Data in: the store's `coaches` array, plus the shared `searchQuery` slice.
 * Data out: `AddCoachTraineeModal`, which calls the store's `addCoachTrainee`.
 * That modal is the one genuinely complete write path in the whole package —
 * everything else a researcher can create here is read-only or inert.
 *
 * Things a newcomer will otherwise get wrong:
 *
 * - **This page owns the app's only trainee-creation flow, and it dead-ends.**
 *   `addCoachTrainee` creates a `Coach` at `currentPhase: 2`,
 *   `inviteStatus: 'pending'`, but nothing sends an invitation and nothing can
 *   ever flip `inviteStatus` to `'active'`. Pending is a terminal state today;
 *   a real build needs an invitation email plus an accept-invite endpoint that
 *   writes `inviteStatus` and `lastActive`. Until then every new trainee reads
 *   "Never" in the Last Active column, correctly.
 *
 * - **`inviteStatus` and `CoachStatus` are two different axes.** Everything on
 *   this page — the Status column, the tabs, the "Active trainees" and "Invite
 *   pending" tiles — reads `inviteStatus`. `Coach.status` (enrolled / active /
 *   withdrawn / completed) is the study-lifecycle field and is NOT shown here.
 *   Counting one under a label that displays the other is the specific bug this
 *   page has already shipped once.
 *
 * - **The "Certified" tab is intentionally an empty state**, not an unfinished
 *   one. See `ROSTER_TABS`.
 *
 * - **Search state is shared, not local.** This is the only page reading the
 *   store's `searchQuery`/`setSearchQuery`; Consumer and Coach Management each
 *   keep their own `useState`. The store copy is never cleared on unmount, so a
 *   term typed here survives navigating away and back.
 *
 * - **The table's heading and search sit outside the `Card`**, which makes this
 *   a deliberate exception to the app-wide rule that a card title lives in a
 *   `bg-card-header` band inside its card. Consumer and Coach Management follow
 *   the same exception, so the three list pages match each other.
 */

/**
 * Phase 8 is "Entry into SPACES delivery": certified, and managed from Coach
 * Management instead. Scoping by the phase rather than capping the row count is
 * what lets a newly-added trainee (always created at Phase 2) appear here
 * automatically.
 *
 * The same constant is declared independently in `ResearchHomePage.tsx` for its
 * "Active trainees" tile. Two copies of one protocol rule: change both, or
 * hoist them into a shared config module.
 */
const GRADUATED_PHASE = 8

/** Orders the roster by COACH stage, earliest first. A pending invite has not
 *  reached any stage at all, so it ranks ahead of Stage C. Ties inside one
 *  stage keep their seed-array order, which `Array.prototype.sort` guarantees
 *  by being stable. */
function sortTrainees(list: Coach[]): Coach[] {
  const rank = (c: Coach) => (c.inviteStatus === 'pending' ? -1 : c.currentPhase)
  return [...list].sort((a, b) => rank(a) - rank(b))
}

/** "Certified this period" window: a coach counts once their Placement 2
 *  assessment (`certification.assessedDate`) falls within this many days of
 *  `TODAY`. The window is what stops the tile becoming a synonym for "ever
 *  certified" — it is a study-protocol figure, not a display choice, and
 *  belongs in config alongside the other thresholds scattered through this
 *  package. */
const CERTIFIED_WINDOW_DAYS = 60

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`)
  const to = new Date(`${toIso}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

/** Total modules in the COACH content-learning curriculum, read from the real
 *  dataset rather than hardcoded so the "x of N" denominator can't go stale. */
const TOTAL_MODULES = PATHWAY_MODULES_V2.length

/** How many of the curriculum's modules this trainee has finished.
 *
 *  Deliberately a plain count with no clamping or special-casing. The Modules
 *  Completed column and the Current Stage column beside it are two views of one
 *  underlying progression, and the pathway constrains them:
 *    - a trainee at Stage O or beyond has by definition finished Content
 *      learning, so all modules must read completed;
 *    - a trainee whose invite is still pending has never signed in, so none can.
 *  Both rules are enforced structurally in the seed data (`fillRecordsComplete`
 *  in `data/research.ts`). Keep it that way: if the data ever violates them the
 *  column should show the contradiction, not hide it. Do not "fix" an impossible
 *  reading here. */
function modulesCompleted(c: Coach): number {
  return c.moduleRecords.filter((r) => r.status === 'completed').length
}

/** Shared header-cell classes. Matches Consumer Management's table header
 *  (`purple-50` band, `text-ink`, `py-4`); Coach Management's own `TH` has
 *  drifted from both. */
const TH = 'px-4 py-4 text-caption-medium text-ink'

/**
 * Roster tabs.
 *
 * "Active trainees" and "Pending invite" split the same list by
 * `inviteStatus`, mirroring the two KPI tiles above them.
 *
 * ⚠️ "Certified" renders a hardcoded "No data available." empty state and reads
 * no data at all. That is an intentional product decision, not an unfinished
 * one: certified coaches are managed under Coach Management, and this roster is
 * scoped to trainees still inside the COACH pathway. Certified records DO exist
 * in `coaches`, which is in scope here, so this looks like a one-line bug and
 * is not. Confirm with the study team before changing it.
 */
const ROSTER_TABS = [
  { id: 'active', label: 'Active trainees' },
  { id: 'pending', label: 'Pending invite' },
  { id: 'certified', label: 'Certified' },
] as const
type RosterTab = (typeof ROSTER_TABS)[number]['id']

export function RosterPage() {
  const { coaches, searchQuery, setSearchQuery } = useResearch()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [tab, setTab] = useState<RosterTab>('active')

  const trainees = sortTrainees(coaches.filter((c) => c.currentPhase < GRADUATED_PHASE))

  // Scoping rule for the tiles: the first three count `trainees` (the roster
  // this page shows), so tile and table can never disagree. "Certified this
  // period" deliberately reads the *full* `coaches` list instead — a trainee
  // leaves this roster the moment they reach Phase 8, so scoping it the same
  // way would make it permanently zero.
  //
  // `activeCount` must stay on `inviteStatus`, the field the Status column
  // renders. Counting `Coach.status` instead put "Active trainees 6" above a
  // table showing five Active chips and one Invite pending.
  const activeCount = trainees.filter((c) => c.inviteStatus === 'active').length
  const invitePendingCount = trainees.filter((c) => c.inviteStatus === 'pending').length
  const certifiedThisPeriodCount = coaches.filter((c) => {
    if (c.certification.outcome !== 'pass' || c.certification.assessedDate === undefined) {
      return false
    }
    // Do not drop the `days >= 0` half of this test. One seeded coach has an
    // `assessedDate` after the frozen `TODAY`; a future date yields a negative
    // difference, which satisfies `<= 60` and would silently inflate the tile.
    // The seed data being future-dated is itself a defect (a coach cannot be
    // certified after today), but the guard is correct regardless.
    const days = daysBetween(c.certification.assessedDate, TODAY)
    return days >= 0 && days <= CERTIFIED_WINDOW_DAYS
  }).length

  const q = searchQuery.trim().toLowerCase()
  const searched = trainees.filter(
    (c) =>
      q === '' ||
      c.fullName.toLowerCase().includes(q) ||
      c.employer.toLowerCase().includes(q) ||
      c.participantId.toLowerCase().includes(q),
  )
  // Same `inviteStatus` split as the two KPI tiles above.
  const filtered = searched.filter((c) => c.inviteStatus === (tab === 'pending' ? 'pending' : 'active'))
  // Tab-scoped but pre-search. Needed so the empty state can tell "this tab has
  // no rows at all" apart from "your search matched nothing" — two different
  // messages, and only this second count can distinguish them.
  const tabScoped = trainees.filter((c) => c.inviteStatus === (tab === 'pending' ? 'pending' : 'active'))

  return (
    <ResearchShell
      heroNoSeam
      heroClassName="bg-purple-50"
      hero={
        <ResearchPageHero
          title="Manage trainees"
          subtitle="Onboard, track, and manage coaches who first join as trainees."
          action={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Add new coach trainee
            </button>
          }
        />
      }
    >
      {/* Trainees overview — the shared yellow `StatCard` row, the same tile
          Consumer and Coach Management use (and that Home re-implements
          locally). */}
      <section>
        <h2 className="font-display text-title text-ink">Trainees overview</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total trainees" value={trainees.length} icon={Users} />
          <StatCard label="Active trainees" value={activeCount} icon={UserCheck} />
          <StatCard label="Invite pending" value={invitePendingCount} icon={Clock} />
          <StatCard label="Certified this period" value={certifiedThisPeriodCount} icon={Award} />
        </div>
      </section>

      {/* Trainees management table. 96px section gap, matching Home. */}
      <section className="mt-24">
        {/* Heading + sub copy left, search right, on one row ABOVE the card —
            not in an in-card header band. All three research list pages do
            this; it is the documented exception to the app-wide card-header
            rule, and they should stay consistent with each other. */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-title text-ink">Trainees management table</h2>
            <p className="mt-2 text-body text-ink-muted">Click a trainee to view more details.</p>
          </div>
          <div>
            <SearchInput
              id="coach-search"
              label="Search trainees"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search trainees"
              widthClassName="sm:w-[340px]"
            />
          </div>
        </div>

        <div className="mt-6">
          <UnderlineTabs
            tabs={ROSTER_TABS}
            active={tab}
            onChange={setTab}
            ariaLabel="Trainee roster"
            layoutId="trainee-roster-tab-underline"
            idPrefix="roster-tab"
            panelId="roster-panel"
          />
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {filtered.length} of {trainees.length} trainees
        </p>

        <div id="roster-panel" role="tabpanel" aria-labelledby={`roster-tab-${tab}`} className="mt-6">
        {/* Every state of this table — rows, search-empty, and the "Certified"
            tab's empty state — lives inside the one `Card`. An empty state
            rendered outside the card is a regression this app has had to fix
            twice; keep new states inside it. */}
        <Card className="gap-0 rounded-lg py-0">
          <div className="overflow-x-auto">
            {tab === 'certified' ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Award className="size-8 text-primary" strokeWidth={1.75} />
                </span>
                <p className="text-body text-ink-muted">No data available.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-10 text-center text-body text-ink-muted">
                {tabScoped.length === 0
                  ? 'No trainees in this view yet.'
                  : `No trainees match “${searchQuery.trim()}”.`}
              </p>
            ) : (
              <table className="w-full min-w-[840px] border-collapse text-left">
                <thead>
                  {/* `purple-50` band with no bottom rule — the tint is the
                      boundary. Same treatment as Consumer Management's table. */}
                  <tr className="bg-purple-50">
                    <th scope="col" className={cn(TH, 'px-6')}>
                      Trainee Name
                    </th>
                    {/* Do not add per-column widths. Fixed widths summed past
                        the card's own inner width, which pushed the trailing
                        chevron column off-screen inside `overflow-x-auto` (it
                        scrolls, so nothing looks broken) and squeezed the name
                        column until every name wrapped. The table's single
                        `min-w-[840px]` plus `whitespace-nowrap` on the cells
                        that must not wrap is what keeps it fitting. */}
                    <th scope="col" className={TH}>
                      Trainee ID
                    </th>
                    <th scope="col" className={TH}>
                      Status
                    </th>
                    <th scope="col" className={TH}>
                      Current Stage
                    </th>
                    <th scope="col" className={TH}>
                      Modules Completed
                    </th>
                    <th scope="col" className={TH}>
                      Last Active
                    </th>
                    <th scope="col" className="relative px-4 py-3.5">
                      <span className="sr-only">Open profile</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* The whole row navigates on click, and the name cell also
                      holds a real `<Link>` to the same place so the row is
                      reachable by keyboard. That inner link must keep its
                      `stopPropagation`, or activating it fires both handlers.
                      Any new interactive cell in this table needs the same. */}
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/research/coaches/${c.id}`)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-pearl',
                        i > 0 && 'border-t border-hairline',
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex min-h-11 items-center">
                          <Link
                            to={`/research/coaches/${c.id}`}
                            aria-label={`View ${c.fullName}'s profile`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-caption font-semibold whitespace-nowrap text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {c.fullName}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                        {c.participantId}
                      </td>
                      <td className="px-4 py-4">
                        <InviteStatusChip status={c.inviteStatus} />
                      </td>
                      <td className="px-4 py-4 text-caption text-ink">
                        {c.inviteStatus === 'pending' ? (
                          <span aria-label="No stage yet, because the invite hasn't been accepted">—</span>
                        ) : (
                          stageLabel(c.currentPhase)
                        )}
                      </td>
                      <td className="px-4 py-4 text-caption tabular-nums whitespace-nowrap text-ink-muted">
                        {modulesCompleted(c)} of {TOTAL_MODULES}
                      </td>
                      <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                        {c.lastActive ? (
                          formatDate(c.lastActive)
                        ) : (
                          <span className="text-ink-faint">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ChevronRight aria-hidden="true" className="inline size-4 text-ink-faint" />
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

      <AddCoachTraineeModal open={addOpen} onClose={() => setAddOpen(false)} />

    </ResearchShell>
  )
}
