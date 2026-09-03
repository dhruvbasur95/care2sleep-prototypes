import { CalendarClock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/research/StatusChip'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import {
  CONSUMER_MODULES,
  moduleUnlockState,
  sessionRowLabel,
  type ConsumerDyad,
} from '@/data/spaces'
import { useResearch } from '@/data/research-context'
import { formatDate, formatTime } from '@/data/format'

const SESSION_TH = 'px-4 py-4 text-caption-medium text-ink'

/**
 * "Sessions plan overview" — one row per numbered catch-up session, with the
 * module that session reviews.
 *
 * Round 25, direct instruction: **moved off the Consumer Management record
 * page and onto Coach Management**, where it replaces the researcher's view of
 * `SessionTracker` under the Assigned Consumers tab. Two reasons that swap is
 * the right way round rather than a duplication:
 *
 *   1. Researchers are **not allowed to mark a session complete**, and
 *      `SessionTracker`'s whole reason for existing is that write path
 *      (Mark session complete / Mark as incomplete / Unlock module / Join
 *      Zoom). Showing it to a researcher offered actions they should not have.
 *   2. This table is read-only by construction — every cell is derived — so it
 *      is the honest researcher-facing equivalent.
 *
 * `SessionTracker` is untouched and still serves the **coach**, on the Coach
 * Delivery Portal, where marking a session complete is exactly the point.
 *
 * Module status and Session status are deliberately independent columns,
 * because they genuinely are: a consumer can attend the catch-up without
 * having finished the module, and that gap is what a researcher is looking
 * for. Module 1 ("Getting started") has no catch-up of its own, so it is not a
 * row here.
 */
export function SessionsPlanOverview({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans, manualModuleUnlocks } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]
  const unlocks = manualModuleUnlocks[dyad.id] ?? []
  const planned = plan?.sessions.every((s) => !!s.date) ?? false

  return (
  <section>
    {/* Heading and sub copy stay on the page canvas here, unlike the two
        cards above: this card holds a table, and every other table in the
        dashboard carries its title outside the card rather than in a
        header band. */}
    {/* Round 24, `title-section` (node `194:2857`): retitled from
        "Scheduled sessions" to the frame's own wording. `title` (22/500)
        over a `body` `ink-muted` sub-line, 8px apart. */}
    <h2 className="font-display text-title text-ink">Sessions plan overview</h2>
    {/* The frame's own sub copy is "Where this consumer is in their study
        journey, along with their assigned coaches" — the first half is kept
        verbatim, the second half is **not**. This table has no coach column
        (its six are Session / date & time / Module / Module status /
        Module completed on / Session status), so promising coaches in the
        sub-line would describe a column that isn't there; a consumer also
        has exactly one assigned coach, not "coaches", and it is now named
        in the header band directly above. Flagged rather than transcribed. */}
    <p className="mt-2 text-body text-ink-muted">
      Where this consumer is in their study journey.
    </p>
    <Card className="mt-4 gap-0 overflow-hidden rounded-lg py-0">
      <div>
      {!planned ? (
        /* Round 27: icon-led empty state, matching "Latest updates" and
           Consumer Management's "Needs attention" — a bare grey sentence read
           as unfinished copy rather than a deliberate state. */
        <EmptyState icon={CalendarClock} copy="No session plan yet" />
      ) : (
        /* One row per numbered session, with the module that session
           reviews. Module status and session status are independent
           columns because they genuinely are: a consumer can attend the
           catch-up without having finished the module, and that gap is
           what a researcher is looking for. Module 1 ("Getting started")
           has no catch-up of its own, so it isn't a row here — the
           Learning progress card above counts it. */
        <div className="overflow-x-auto">
          {/* Round 24, `table-header` (node `194:2861`): the column-header
              row is now a `purple-50` band with `ink` labels (11.19:1),
              and the frame draws **no** bottom rule under it — the tint is
              the boundary, the same frame-driven divergence from §35a that
              §67 recorded for Stage Management's table. Row rules move
              `hairline` -> `parchment`, also per the frame.
              Column widths are the frame's own 110 / 230 / 110 / 150 / 190
              / 150 as proportions of its 988px table, so they hold their
              ratio instead of clipping on a narrower container — the same
              fix applied to the trainee page's table this round. */}
          <table className="w-full min-w-[880px] border-collapse text-left">
            <colgroup>
              <col className="w-[15.99%]" />
              <col className="w-[23.28%]" />
              <col className="w-[11.13%]" />
              <col className="w-[15.18%]" />
              <col className="w-[19.23%]" />
              <col className="w-[15.18%]" />
            </colgroup>
            <thead>
              <tr className="bg-purple-50">
                <th scope="col" className={cn(SESSION_TH, 'px-6')}>
                  Session
                </th>
                <th scope="col" className={SESSION_TH}>
                  Session date &amp; time
                </th>
                <th scope="col" className={SESSION_TH}>
                  Module
                </th>
                <th scope="col" className={SESSION_TH}>
                  Module status
                </th>
                <th scope="col" className={SESSION_TH}>
                  Module completed on
                </th>
                <th scope="col" className={SESSION_TH}>
                  Session status
                </th>
              </tr>
            </thead>
            <tbody>
              {CONSUMER_MODULES.slice(1).map((mod, i) => {
                // Module at index i+1 is reviewed by internal session i+2,
                // which a coach and researcher read as "Session i+1".
                const modIdx = i + 1
                const sessionNumber = modIdx + 1
                const row = plan?.sessions.find((r) => r.session === sessionNumber)
                const sessionDone = completed.some((c) => c.session === sessionNumber)
                const modRecord = dyad.moduleEngagement.find((r) => r.moduleId === mod.id)
                const modLocked = moduleUnlockState(modIdx, completed, unlocks) === 'locked'
                const moduleDone = modRecord?.status === 'completed'
                return (
                  <tr key={mod.id} className={cn(i > 0 && 'border-t border-parchment')}>
                    <td className="px-6 py-4 text-caption font-semibold whitespace-nowrap text-ink">
                      {sessionRowLabel(sessionNumber)}
                    </td>
                    <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                      {row?.date ? (
                        `${formatDate(row.date)} · ${formatTime(row.time ?? '00:00')}`
                      ) : (
                        <span className="text-ink-faint">Not scheduled</span>
                      )}
                    </td>
                    {/* The module is its own column, not a caption under
                        the session: it's a separate fact about the row, and
                        stacking it made the first column two lines deep
                        while every other cell stayed one. */}
                    <td className="px-4 py-4 text-caption whitespace-nowrap text-ink">
                      Module {modIdx}
                    </td>
                    {/* Four states, and "In progress" is only possible
                        *before* the catch-up session: once that session has
                        been held the module is either complete or
                        incomplete, so a stale in-progress record is
                        rendered as Incomplete rather than repeated back.
                        Incomplete takes the `destructive` tone — an
                        unlocked module the consumer hasn't finished is the
                        row a researcher may need to act on. */}
                    <td className="px-4 py-4">
                      {moduleDone ? (
                        <Chip tone="success" label="Complete" />
                      ) : modLocked ? (
                        <Chip tone="muted" label="Locked" />
                      ) : modRecord?.status === 'in-progress' && !sessionDone ? (
                        <Chip tone="next" label="In progress" />
                      ) : (
                        <Chip tone="destructive" label="Incomplete" />
                      )}
                    </td>
                    <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                      {moduleDone && modRecord?.lastActivityDate ? (
                        formatDate(modRecord.lastActivityDate)
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {sessionDone ? (
                        <Chip tone="success" label="Complete" />
                      ) : (
                        <Chip tone="muted" label="To be held" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </Card>
  </section>
  )
}
