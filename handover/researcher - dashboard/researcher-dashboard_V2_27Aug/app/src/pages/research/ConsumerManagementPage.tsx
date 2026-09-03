import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarX, CheckCircle, ChevronRight, RefreshCw, UserX, Users } from 'lucide-react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { InertButton } from '@/components/shared/InertButton'
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

/**
 * Consumer Management — route `/research/consumers`. The roster of every
 * enrolled consumer, assigned to a coach or not, and the drill-in point for
 * `ConsumerDetailPage` (`/research/consumers/:dyadId`).
 *
 * Shape: hero → "Consumers overview" KPI row → a table section whose heading
 * and search sit above the `Card` (the same documented exception Trainee and
 * Coach Management use).
 *
 * Data in: the store's `consumerDyads`, `coaches`, `sessionCompletion` and
 * `sessionPlans`. Data out: nothing — this page is entirely read-only.
 *
 * Things a newcomer will otherwise get wrong:
 *
 * - **There is no working consumer-enrolment route in this build.** Intake
 *   moved to REDCap, the in-app enrolment wizard was removed, and the hero's
 *   "Sync with REDCap" CTA is inert. The store's `enrollConsumer` action still
 *   exists, builds a complete `ConsumerDyad` from a plain input object, and has
 *   no caller — it is the intended target for a REDCap importer, once per
 *   synced record.
 *
 * - **A consumer is a dyad, and `patient` is optional.** `carer` is always
 *   present; `patient` — the PLE, the person living with dementia — is absent
 *   for a carer-only consumer. Every read of `dyad.patient` must be guarded.
 *
 * - **Three different numbers describe one module, and they are all correct.**
 *   Module index N is *unlocked by* internal session N, *reviewed by* internal
 *   session N+1, and *shown to the consumer as* "Module N+1". Sessions are
 *   likewise numbered internally 1-7 but displayed as Planning + Sessions 1-6.
 *   Never render a raw internal number; go through `data/spaces.ts`'s helpers
 *   (`displaySessionNumber`, `sessionRowLabel`, `nextUpcomingSessionNumber`).
 *
 * - **"Sessions Completed" counts 6, not 7.** `catchupSessionsCompleted`
 *   excludes the unnumbered Planning session; `SPACES_CATCHUP_COUNT` is the
 *   matching denominator. Counting raw completion records instead put "1 of 7"
 *   next to "Next Session: Session 1" on the same row.
 *
 * - **Module progress is gated on a session plan existing.** No plan means no
 *   coach and no opened module, so the count is 0 by definition regardless of
 *   what engagement records say. See `moduleActivity`.
 */
function dyadTitle(dyad: ConsumerDyad): string {
  return dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name
}

/**
 * The "Module Activity" cell: what this consumer is working on right now.
 *
 * Reads `moduleEngagement` rather than deriving a module from session
 * completion. The two are related — completing session N unlocks module N — but
 * they are not the same fact: a module can be unlocked and untouched, or in
 * progress well before its follow-up session. This column is about what the
 * consumer is actually doing.
 *
 * Only a module currently **in progress** counts as activity. A finished module
 * is history, and the row already has a Sessions Completed column for overall
 * position in the study; falling back to the last closed module read as if they
 * were still working on it.
 *
 * Returns either a chip tone (the cell is a status) or a title plus a progress
 * note (the cell is a real module). The call site branches on `chip`.
 */
function moduleActivity(
  dyad: ConsumerDyad,
  sessionsCompleted: number,
  planned: boolean,
  sessionsDone: { session: number }[],
): { title: string; note?: string; chip?: 'success' | 'muted' } {
  // Module content only opens once a session plan exists — the planning session
  // is what schedules the modules — and no plan implies no coach, since the
  // coach is who builds it. Keep this guard even though the seed data also
  // satisfies it: without it a future enrolment renders an impossible state.
  if (!planned) return { title: 'Not started', chip: 'muted' }

  // All 6 catch-ups done means every module has been unlocked and worked
  // through, since the two run in lockstep under the SPACES unlock rule. Said
  // outright rather than "no module in progress", which is literally true here
  // but reads as a stalled consumer.
  if (sessionsCompleted >= SPACES_CATCHUP_COUNT) return { title: 'All modules completed', chip: 'success' }

  // A module can only be "in progress" BEFORE its own catch-up session: once
  // that session has been held the module is either complete or incomplete, so
  // an in-progress record sitting behind a completed session is stale and must
  // be skipped rather than reported as live activity. The `+ 1` is the
  // index-to-session offset — module index N is reviewed by internal session
  // N+1 — and is not an off-by-one.
  const inProgress = dyad.moduleEngagement.find(
    (r) => r.status === 'in-progress' && !sessionsDone.some((c) => c.session === moduleIndex(r.moduleId) + 1),
  )
  if (!inProgress) return { title: 'No module in progress', chip: 'muted' }

  const index = moduleIndex(inProgress.moduleId)
  const mod = CONSUMER_MODULES[index]
  // The number, not the title — a full module name wraps to two lines here and
  // pushes every other cell around.
  //
  // `index + 1` is the consumer-facing number, so the always-unlocked "Getting
  // started" pre-module is Module 1. This deliberately runs one ahead of the
  // unlock index used by `moduleUnlockState`. Both numbers are right; only this
  // one is ever shown.
  const title = `Module ${index + 1}`
  // A percentage, never "N of M slides". A consumer-facing module is one page of
  // audio/video learning; a slide count is a coach-training concept and means
  // nothing here. `slidesCompleted` remains the underlying store.
  const pct = Math.round(((inProgress.slidesCompleted ?? 0) / (mod?.slideCount || 6)) * 100)
  return { title, note: `${pct}% complete` }
}

export function ConsumerManagementPage() {
  const { consumerDyads, coaches, sessionCompletion, sessionPlans } = useResearch()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  /* `omitFromConsumerRoster` hides a dyad from THIS roster only — it stays real
     everywhere else in the app. One seeded dyad carries the flag; it exists to
     demonstrate a coach record page state and would otherwise duplicate a state
     this roster already shows.

     Filter once, here, ahead of both the rows and the KPI counts below, so a
     tile can never disagree with the table under it. Note Research Home's
     "Total consumers" tile does NOT apply this filter and therefore reads one
     higher than this page — a real inconsistency, fixed there, not here. */
  const rosterDyads = consumerDyads.filter((d) => !d.omitFromConsumerRoster)

  const unsorted = rosterDyads.map((dyad) => {
    const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined
    const completed = sessionCompletion[dyad.id] ?? []
    // Read the live plan first, and fall back to the legacy `upcomingSession`
    // field only for a dyad with no plan yet. Both go through
    // `nextUpcomingSessionNumber`, which is the shared source of truth for
    // "which session is next": it display-numbers the result and refuses to
    // resolve to the internal planning session, which would surface as
    // "Session 0". Reading `upcomingSession.session` directly instead put a
    // different number on this row than the coach's own Session Plan card
    // showed for the same session, one click apart.
    return {
      dyad,
      coach,
      sessionsCompleted: catchupSessionsCompleted(completed),
      upcomingDisplayNumber: nextUpcomingSessionNumber(sessionPlans[dyad.id], completed, dyad.upcomingSession),
      // The planned row behind that number, for its date/time. Only a real plan
      // carries one; the legacy fallback above can name a session that has no
      // date, which must render as "Not scheduled" rather than inventing one.
      nextPlanRow: nextPlannedSession(sessionPlans[dyad.id], completed),
      moduleActivity: moduleActivity(dyad, catchupSessionsCompleted(completed), isPlanSet(sessionPlans[dyad.id]), completed),
      // Out of the 7 consumer-facing modules, which includes the always-unlocked
      // "Getting started" pre-module. Gated on the plan for the same reason
      // Module Activity is: no plan means nothing has opened, so the count is 0
      // by definition rather than whatever stale engagement records say.
      modulesCompleted: isPlanSet(sessionPlans[dyad.id])
        ? dyad.moduleEngagement.filter((r) => r.status === 'completed').length
        : 0,
    }
  })

  /**
   * Roster order is a real comparator, not seed-array order, and it reads
   * top-to-bottom as a progression through the study:
   *
   *   no coach → coach but no plan → planned → underway → finished
   *
   * The top of the list is therefore always the rows a researcher has to act
   * on. This matters for a consumer created at runtime: a new record is
   * appended to the array and would otherwise land at the bottom, when in fact
   * it has no coach and belongs at the top.
   */
  const rows = [...unsorted].sort((a, b) => {
    if (!a.coach !== !b.coach) return a.coach ? 1 : -1
    // The plan check is load-bearing, not a refinement. Session count alone
    // cannot separate these rows: it counts only the 6 numbered catch-ups, so a
    // consumer with a plan and a session booked and one with no plan at all
    // both sit at 0 and fall back to seed order.
    const aPlanned = isPlanSet(sessionPlans[a.dyad.id])
    const bPlanned = isPlanSet(sessionPlans[b.dyad.id])
    if (aPlanned !== bPlanned) return aPlanned ? 1 : -1
    return a.sessionsCompleted - b.sessionsCompleted
  })

  // Each KPI count reuses the exact expression the table below renders for the
  // same signal — `!row.coach` is the "Not assigned" chip, `isPlanSet` is the
  // Session Plan chip — so a tile and the rows under it cannot drift apart.
  // Derive new tiles the same way rather than writing a parallel rule.
  const notAssignedCount = rows.filter((row) => !row.coach).length
  const noSessionsPlannedCount = rows.filter((row) => !isPlanSet(sessionPlans[row.dyad.id])).length
  const fullyCompletedCount = rows.filter((row) => row.sessionsCompleted >= SPACES_CATCHUP_COUNT).length
  // Every dyad has a carer, so `carerCount` is the dyad count; `patient` (the
  // PLE) is absent on a carer-only consumer, so the PLE count is always <= it.
  const pleCount = rosterDyads.filter((dyad) => dyad.patient).length
  const carerCount = rosterDyads.length

  // Search matches either dyad member's name or the assigned coach's — the three
  // names the table renders. It deliberately does not filter the KPI tiles:
  // those describe the whole study, and Trainee Management behaves the same way.
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
      // `heroNoSeam` is required on every hero that has no tab row under it:
      // without it the band sits flush against the content with zero padding.
      heroClassName="bg-purple-50"
      hero={
        <ResearchPageHero
          title="Consumer management"
          subtitle="Sync consumers from REDCap and track their coach assignment and progress."
          /* ⚠️ INERT, and this is the most consequential inert control in the
             package: it is the ONLY consumer-enrolment route in this build, so
             consumers currently cannot be added at all. There is no REDCap
             client anywhere in `src/`.

             The replacement boundary is this button's handler plus the store's
             `enrollConsumer` action, which already turns a plain input object
             into a complete `ConsumerDyad` (seeding its session slices) and has
             no caller. Call it once per synced record.

             The old in-app enrolment wizard is not part of this package, so
             restoring a platform-side flow means rebuilding the wizard, not
             just re-pointing this trigger. */
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
      {/* Consumers overview — the shared yellow `StatCard` row, matching Trainee
          and Coach Management. The PLE/Carer split rides in `StatCard`'s
          `breakdown` prop, which sits the parts *beside* the headline number:
          the tile is a fixed 120px, so a caption under the value overflowed the
          fill. Do not reach for a subtext line here. */}
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

      {/* Consumers management table. 96px section gap, and the heading + search
          sit ABOVE the card rather than in an in-card header band — the same
          documented exception Trainee and Coach Management use. */}
      <section className="mt-24">
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
          // Do not raise this `min-w`. At 1180px the table overflowed its own
          // card and silently pushed the trailing chevron column out of view
          // inside `overflow-x-auto`, which scrolls rather than visibly
          // breaking. At 980 the browser distributes the eight columns itself
          // and everything fits.
          //
          // Known and accepted: four two-word headers ("Assigned Coach",
          // "Session Plan", "Modules Completed", "Sessions Completed") wrap to
          // two lines. Their data cells are all single-line, so this is the
          // header row spending vertical space, not a squeezed column.
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              {/* `purple-50` band with no bottom stroke — the tint is the
                  boundary. Labels are `ink`, not `ink-muted`: on this tint the
                  quieter grey reads as disabled rather than secondary. */}
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
              {/* The row navigates on click; the name cell also holds a real
                  `<Link>` so the row is keyboard-reachable. That inner link must
                  keep its `stopPropagation`, or activating it fires both. In a
                  carer-only dyad there is no PLE line, so the Carer name becomes
                  the link instead — every row must have exactly one. */}
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
                    {/* "Not assigned" is `destructive`-toned on purpose: an
                        enrolled consumer with no coach is the one row on this
                        page a researcher must act on, and a quiet grey ranked it
                        below the filled-in rows. Use the shared `Chip` tones
                        rather than a hand-rolled tint — their contrast is
                        measured in `StatusChip.tsx`. */}
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
                  {/* Session number over its date/time. The number alone answers
                      "which session" but not "when", which is what a researcher
                      scanning this column is after. `undefined` means there is
                      no next session at all (finished, or no plan) and renders
                      an em dash — distinct from a known session with no date,
                      which renders "Not scheduled". */}
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
