import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarX, CheckCircle, ChevronRight, RefreshCw, UserX, Users } from 'lucide-react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { InertButton } from '@/components/shared/MeetingsSection'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/research/StatusChip'
import { SearchInput } from '@/components/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
import { cn } from '@/lib/utils'
import { formatDate, formatTime } from '@/data/format'
import {
  CONSUMER_MODULES,
  SPACES_CATCHUP_COUNT,
  catchupSessionsCompleted,
  isPlanSet,
  moduleIndex,
  nextPlannedSession,
  nextUpcomingSessionNumber,
  type ConsumerDyad,
} from '@/data/spaces'
import { useResearch } from '@/data/research-context'

function dyadTitle(dyad: ConsumerDyad): string {
  return dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name
}

/**
 * The consumer's current position in the 7 content modules, for the roster's
 * "Module Activity" column.
 *
 * Reads the dyad's own `moduleEngagement` records rather than deriving a
 * module number from session completion: the two are related (completing
 * session N unlocks module N) but not the same fact — a module can be
 * unlocked and untouched, or in progress well before its follow-up session.
 * The column is about what the consumer is actually *doing*.
 *
 * Only the module currently **in progress** is shown. A finished module is
 * not activity — it is history, and the row already carries a Sessions
 * Completed column for how far along the study a consumer is. With nothing
 * open, the cell says so rather than falling back to the last module they
 * closed, which read as if they were still working on it.
 */
function moduleActivity(
  dyad: ConsumerDyad,
  sessionsCompleted: number,
  planned: boolean,
  sessionsDone: { session: number }[],
): { title: string; note?: string; chip?: 'success' | 'muted' } {
  // Module content opens only once the coach and consumer have built the
  // session plan — the planning session is what schedules the modules — so a
  // consumer with no plan has no activity to report by definition (and one
  // with no plan has no coach either, since the coach is who builds it).
  // Guarded here as well as fixed in the seed data, so a future enrolment
  // cannot render the impossible state.
  if (!planned) return { title: 'Not started', chip: 'muted' }

  // Finishing all 6 numbered catch-ups means every module has been unlocked
  // and worked through — the two run in lockstep under the COACH/SPACES unlock
  // rule — so the cell states that outright instead of "nothing in progress",
  // which is technically true but reads like a stalled consumer.
  if (sessionsCompleted >= SPACES_CATCHUP_COUNT) return { title: 'All modules completed', chip: 'success' }

  // A module is only ever "in progress" *before* its own catch-up session:
  // once that session has been held the module is complete or incomplete, so a
  // record still marked in-progress behind a completed session is stale and is
  // skipped rather than reported as live activity. Module index N is reviewed
  // by internal session N+1.
  const inProgress = dyad.moduleEngagement.find(
    (r) => r.status === 'in-progress' && !sessionsDone.some((c) => c.session === moduleIndex(r.moduleId) + 1),
  )
  if (!inProgress) return { title: 'No module in progress', chip: 'muted' }

  const index = moduleIndex(inProgress.moduleId)
  const mod = CONSUMER_MODULES[index]
  // The number, not the title: a full module name wrapped to two lines in this
  // column and pushed every other cell around.
  //
  // Numbered 1-7 across the consumer-facing list as a consumer sees it, so the
  // always-unlocked "Getting started" module is Module 1 rather than carrying
  // a "pre-module" caveat this column has no room to explain. Note this runs
  // one ahead of the unlock index (`moduleUnlockState`'s module N unlocks from
  // session N), which is internal machinery and never shown.
  const title = `Module ${index + 1}`
  // Progress reads as a percentage, never "N of M slides": a consumer-facing
  // module is a single page of audio/video learning, so a slide count is a
  // coach-training concept that would be meaningless here. `slidesCompleted`
  // stays as the underlying store of how far through they are.
  const pct = Math.round(((inProgress.slidesCompleted ?? 0) / (mod?.slideCount || 6)) * 100)
  return { title, note: `${pct}% complete` }
}

/**
 * Consumer Management Table — the default screen for the Consumer Management
 * area (round-4-…-prototype-plan.md §1). Structural reuse of the Coaches
 * area's `SpacesRosterPage` `data-table` (design-tokens.md §9/§13), with
 * Consumer-Management-specific columns. Lists every enrolled consumer,
 * assigned or not — unlike the Coaches area's roster, which only ever shows
 * coaches who already have a SPACES record.
 */
export function ConsumerManagementPage() {
  const { consumerDyads, coaches, sessionCompletion, sessionPlans } = useResearch()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  /* Round 27: one dyad exists only to demonstrate the coach record page's
     zero-session caseload state, and duplicates a state this roster already
     shows. It opts out here via `omitFromConsumerRoster` and stays real
     everywhere else. Filtered once, before the rows *and* the KPI counts
     below, so the tiles cannot disagree with the table under them. */
  const rosterDyads = consumerDyads.filter((d) => !d.omitFromConsumerRoster)

  const unsorted = rosterDyads.map((dyad) => {
    const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined
    const completed = sessionCompletion[dyad.id] ?? []
    // Round 14.1 correction: prefer the live plan's next row (matches the
    // Coach Management side's own Session Plan card exactly, display-
    // numbered); fall back to the legacy `upcomingSession` field, still
    // display-numbered, for a dyad with no plan yet. Previously this read
    // the legacy field's raw internal number directly, showing e.g.
    // "Session 2" here for a dyad whose Session Plan card highlighted
    // "Session 1" as Next — the same underlying session, two different
    // numbers, one click apart. `nextUpcomingSessionNumber` (shared with
    // `DeliveryHomePage.tsx`/`SpacesCoachProfilePage.tsx`) also guards
    // against ever resolving to the planning session (internal 1) — a
    // Session 0 leak found live on Dorothy Kellerman's row.
    return {
      dyad,
      coach,
      sessionsCompleted: catchupSessionsCompleted(completed),
      upcomingDisplayNumber: nextUpcomingSessionNumber(sessionPlans[dyad.id], completed, dyad.upcomingSession),
      // The planned row behind that number, for its scheduled date/time. Only
      // a real plan carries one — the legacy `upcomingSession` fallback above
      // can still name a session with no date, which correctly renders as
      // "Not scheduled" rather than inventing one.
      nextPlanRow: nextPlannedSession(sessionPlans[dyad.id], completed),
      moduleActivity: moduleActivity(dyad, catchupSessionsCompleted(completed), isPlanSet(sessionPlans[dyad.id]), completed),
      // Modules finished, out of the 7 consumer-facing modules. Gated on the
      // session plan for the same reason Module Activity is: no plan means no
      // module has opened yet, so the count is 0 by definition rather than
      // whatever stale engagement records might say.
      modulesCompleted: isPlanSet(sessionPlans[dyad.id])
        ? dyad.moduleEngagement.filter((r) => r.status === 'completed').length
        : 0,
    }
  })

  /**
   * Round 17 — fixed roster order: **not assigned → zero sessions → one
   * session → all sessions.** The dataset is deliberately one consumer per
   * state (see `spaces.ts`), so this reads as a progression down the page:
   * waiting for a coach, matched but not started, underway, finished.
   *
   * Sorted rather than relying on the order dyads happen to sit in the seed
   * array — a consumer enrolled live through the Enroll dialog is appended to
   * that array and would otherwise land at the bottom regardless of state.
   * A new enrolment has no coach, so it correctly joins the not-assigned group
   * at the top, where it's the row a researcher most needs to act on.
   */
  const rows = [...unsorted].sort((a, b) => {
    if (!a.coach !== !b.coach) return a.coach ? 1 : -1
    // Round 21: session count alone no longer separates these rows, now that
    // it counts only the 6 numbered catch-ups — a consumer with a plan and a
    // session booked and one with no plan at all both sit at 0, and they were
    // landing in seed order. Plan-created ranks below plan-not-created so the
    // page still reads top-to-bottom as a progression: waiting for a coach →
    // matched but unplanned → planned → underway → finished.
    const aPlanned = isPlanSet(sessionPlans[a.dyad.id])
    const bPlanned = isPlanSet(sessionPlans[b.dyad.id])
    if (aPlanned !== bPlanned) return aPlanned ? 1 : -1
    return a.sessionsCompleted - b.sessionsCompleted
  })

  // "Consumer insights" KPI tiles (matches Trainee Management's own row) —
  // each count mirrors the exact logic the table below already uses for the
  // same signal, so the tiles and the table can never silently disagree.
  const notAssignedCount = rows.filter((row) => !row.coach).length
  const noSessionsPlannedCount = rows.filter((row) => !isPlanSet(sessionPlans[row.dyad.id])).length
  const fullyCompletedCount = rows.filter((row) => row.sessionsCompleted >= SPACES_CATCHUP_COUNT).length
  // PLE/Carer breakdown for the "Total consumers" tile: every dyad has a
  // Carer, but `patient` (PLE) is absent for a carer-only consumer (Round
  // 3.1's carer-only consumer type) — so the PLE count only includes dyads
  // that actually have one.
  const pleCount = rosterDyads.filter((dyad) => dyad.patient).length
  const carerCount = rosterDyads.length

  // Search matches either dyad member's name or the assigned coach's — the
  // three names the table actually renders. Deliberately not filtering the KPI
  // tiles above: they describe the whole study, and Trainee Management's own
  // search behaves the same way.
  const q = searchQuery.trim().toLowerCase()
  const filtered = q
    ? rows.filter(
        (row) =>
          row.dyad.patient?.name.toLowerCase().includes(q) ||
          row.dyad.carer.name.toLowerCase().includes(q) ||
          row.coach?.fullName.toLowerCase().includes(q),
      )
    : rows

  return (
    <ResearchShell
      heroNoSeam
      // Round 21: the same `purple-50` welcome band + `display-xl` purple
      // title + `subtitle`-scale sub copy the Home page introduced, so every
      // Research Dashboard destination shares one hero treatment.
      heroClassName="bg-purple-50"
      hero={
        <ResearchPageHero
          title="Consumer management"
          subtitle="Sync consumers from REDCap and track their coach assignment and progress."
          /* Consumer intake moved to REDCap — the researcher enrols there and
             syncs the record across, so this page no longer offers a
             platform-side enrolment wizard. The in-app CTA is replaced by a
             "Sync with REDCap" control, inert because there is no REDCap
             integration yet: per the standing unwired-controls rule it renders
             as a focusable `aria-disabled` button with an sr-only cue rather
             than a silently dead button or no button at all.

             `EnrollConsumerDialog` and its store action are deliberately left
             in the codebase, unmounted — only the entry point is gone, so the
             flow can be restored by putting a trigger back. */
          action={
            <InertButton
              label="Sync with REDCap"
              appearance="active"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              <RefreshCw aria-hidden="true" className="size-4" strokeWidth={2} />
            </InertButton>
          }
        />
      }
    >
      {/* Consumers overview — Round 21 revamp: this row was "Consumer
          insights" on the older `KpiTile` (white card, semantic-coloured icon,
          PLE/Carer subtext). It now uses the shared yellow `StatCard`, the same
          tile Home's "Study overview" and Trainee Management's "Trainees
          overview" rows draw, so all three Research Dashboard KPI rows read as
          one row. `StatCard` has no subtext slot by design — the frames' tile
          is a label/icon row over a value, nothing else — so the PLE/Carer
          breakdown is dropped here rather than reintroduced as a flag that
          would fork the shared tile. Heading matched to its siblings too:
          `text-title` (24/500), not `text-title`, and the section named for
          the population it counts. */}
      <section>
        <h2 className="font-display text-title text-ink">Consumers overview</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Consumer breakdown"
            icon={Users}
            breakdown={[
              { label: 'PLE', value: pleCount },
              { label: 'Carer', value: carerCount },
            ]}
          />
          <StatCard label="Not assigned coach" value={notAssignedCount} icon={UserX} />
          <StatCard label="No sessions planned" value={noSessionsPlannedCount} icon={CalendarX} />
          <StatCard label="Fully completed study" value={fullyCompletedCount} icon={CheckCircle} />
        </div>
      </section>

      {/* Consumers management table. 96px section gap and an above-the-card
          heading + sub copy, matching Trainee Management's own table section
          (which is itself a documented §35a exception: the frame puts the
          heading outside the card, not in a `card-header` band). */}
      <section className="mt-24">
        {/* Heading + sub copy left, search right on one row above the card —
            the same shape Trainee Management's table section uses. */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-title text-ink">Consumers management table</h2>
            <p className="mt-2 text-body text-ink-muted">Click a consumer to view more details.</p>
          </div>
          <SearchInput
            id="consumer-search"
            label="Search consumers"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search consumers"
            widthClassName="sm:w-[340px]"
          />
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {filtered.length} of {rows.length} consumers
        </p>

      <Card className="mt-6 gap-0 rounded-lg py-0">
        <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="p-10 text-center text-body text-ink-muted">
            {rows.length === 0
              ? 'No consumers enrolled in the study yet.'
              : `No consumers match “${searchQuery.trim()}”.`}
          </p>
        ) : (
          // 980px, tuned by measurement. At 1180 the table overflowed its own
          // 1072px card and silently pushed the chevron column off-screen —
          // the exact bug `design/layout-audit.js` exists to catch. Lower, the
          // browser distributes the eight columns itself and everything fits.
          // The audit still reports four two-word *headers* wrapping to two
          // lines ("Assigned Coach", "Session Plan", "Modules Completed",
          // "Sessions Completed"): checked live, and their data cells are all
          // single-line, so this is the header row deliberately spending
          // vertical space rather than a squeezed column.
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              {/* Round 25, direct instruction: `purple-50` band with **no
                  bottom stroke** — the tint is the boundary. Same treatment the
                  consumer record page's sessions table and study log already
                  use (§68a/§69), so a list page and a record page now read as
                  one system. Labels move `ink-muted` -> `ink` for the same
                  reason they did there: on the tint, the quieter grey reads as
                  disabled rather than secondary. */}
              <tr className="bg-purple-50">
                <th scope="col" className="px-6 py-4 text-caption-medium text-ink">
                  Consumer Details
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Assigned Coach
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Session Plan
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Modules Completed
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Module Activity
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Sessions Completed
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Next Session
                </th>
                <th scope="col" className="relative px-4 py-3.5">
                  <span className="sr-only">Open profile</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={row.dyad.id}
                  onClick={() => navigate(`/research/consumers/${row.dyad.id}`)}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-pearl',
                    i > 0 && 'border-t border-hairline',
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex min-h-11 flex-col justify-center gap-0.5 text-caption whitespace-nowrap">
                      {row.dyad.patient && (
                        <span className="text-ink">
                          <span className="text-ink-faint">PLE:</span>{' '}
                          <Link
                            to={`/research/consumers/${row.dyad.id}`}
                            aria-label={`View ${dyadTitle(row.dyad)}'s profile`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {row.dyad.patient.name}
                          </Link>
                        </span>
                      )}
                      <span className="text-ink">
                        <span className="text-ink-faint">Carer:</span>{' '}
                        {row.dyad.patient ? (
                          row.dyad.carer.name
                        ) : (
                          <Link
                            to={`/research/consumers/${row.dyad.id}`}
                            aria-label={`View ${dyadTitle(row.dyad)}'s profile`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {row.dyad.carer.name}
                          </Link>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-caption text-ink-muted">
                    {/* Round 17 — "Pending assignment" in quiet `ink-faint`
                        renamed to "Not assigned" in `destructive`. It reads as
                        an outstanding action rather than a passive state: an
                        enrolled consumer with no coach is the one row on this
                        page a researcher has to do something about, and the
                        faint grey treatment ranked it *below* the filled-in
                        rows. Uses the `destructive` token already carrying
                        this meaning app-wide (StatusChip's "Incomplete" tone,
                        Round 16), not a new red. */}
                    {/* Round 21: the bare `destructive` text became a
                        `destructive`-toned chip — same meaning and same token,
                        now in the same shape as every other status this table
                        shows, instead of the one status rendered as raw text. */}
                    {row.coach ? row.coach.fullName : <Chip tone="destructive" label="Not assigned" />}
                  </td>
                  <td className="px-4 py-4 text-caption text-ink-muted">
                    {isPlanSet(sessionPlans[row.dyad.id]) ? (
                      <Chip tone="success" label="Created" />
                    ) : (
                      <Chip tone="muted" label="Not yet" />
                    )}
                  </td>
                  <td className="px-4 py-4 text-caption tabular-nums text-ink-muted">
                    {row.modulesCompleted} of {CONSUMER_MODULES.length}
                  </td>
                  <td className="px-4 py-4 text-caption">
                    {/* A state ("All modules completed" / "No module in
                        progress") is a status, so it renders as a chip like
                        every other status in this table; a real module in
                        progress renders as its own name plus progress. */}
                    {row.moduleActivity.chip ? (
                      <Chip tone={row.moduleActivity.chip} label={row.moduleActivity.title} />
                    ) : (
                      <>
                        <span className="text-ink">{row.moduleActivity.title}</span>
                        {row.moduleActivity.note && (
                          <span className="mt-0.5 block text-caption text-ink-faint">{row.moduleActivity.note}</span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-4 text-caption tabular-nums text-ink-muted">
                    {row.sessionsCompleted} of {SPACES_CATCHUP_COUNT}
                  </td>
                  {/* Session number over its scheduled date/time — the number
                      alone answered "which session" but never "when", which is
                      the thing a researcher scanning this column is actually
                      chasing. */}
                  <td className="px-4 py-4 text-caption">
                    {row.upcomingDisplayNumber !== undefined ? (
                      <>
                        <span className="text-ink">Session {row.upcomingDisplayNumber}</span>
                        <span className="mt-0.5 block text-caption text-ink-faint">
                          {row.nextPlanRow?.date
                            ? `${formatDate(row.nextPlanRow.date)}${
                                row.nextPlanRow.time ? ` · ${formatTime(row.nextPlanRow.time)}` : ''
                              }`
                            : 'Not scheduled'}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-faint">—</span>
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
      </section>

    </ResearchShell>
  )
}
