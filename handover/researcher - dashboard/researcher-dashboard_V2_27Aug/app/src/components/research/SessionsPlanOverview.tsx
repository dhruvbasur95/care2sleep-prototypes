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
 * module that session reviews. Mounted by `SpacesCoachProfilePage` under the
 * Assigned Consumers tab.
 *
 * ⚠️ READ-ONLY BY DESIGN, AND THAT IS A REQUIREMENT, NOT AN OMISSION.
 * Researchers must not mark a session complete or unlock a module — those are
 * the coach's write paths. Every cell here is derived from the store; there is
 * no action column and none should be added. This is the only sessions view in
 * the package; the interactive coach-side tracker is not part of the Research
 * Dashboard.
 *
 * ⚠️ SESSION NUMBERING IS OFFSET THREE WAYS and is the most error-prone part
 * of the data model. Read `data/spaces.ts` before touching the row loop:
 *   - `CONSUMER_MODULES` index N is *unlocked by* internal session N and
 *     *reviewed by* internal session N+1.
 *   - internal session N is displayed as "Session N-1"; internal session 1 is
 *     "Planning" and is never numbered.
 *   - `sessionRowLabel()` is the only correct way to render a session label.
 *
 * Module index 0 ("Getting started") has no catch-up of its own, hence the
 * `.slice(1)`.
 *
 * Module status and Session status are deliberately independent columns
 * because they genuinely are independent: a consumer can attend the catch-up
 * without having finished the module, and that gap is the thing a researcher
 * is looking for. Do not collapse them into one status.
 */
export function SessionsPlanOverview({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans, manualModuleUnlocks } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]
  const unlocks = manualModuleUnlocks[dyad.id] ?? []
  const planned = plan?.sessions.every((s) => !!s.date) ?? false

  return (
  <section>
    {/* Title and sub copy sit on the page canvas, outside the card. That is
        the app-wide convention for a card whose content is a table — a header
        band inside the card is for non-table content. */}
    <h2 className="font-display text-title text-ink">Sessions plan overview</h2>
    {/* Keep this describing only what the six columns actually show. It must
        not promise a coach column, which this table does not have. */}
    <p className="mt-2 text-body text-ink-muted">
      Where this consumer is in their study journey.
    </p>
    <Card className="mt-4 gap-0 overflow-hidden rounded-lg py-0">
      <div>
      {!planned ? (
        <EmptyState icon={CalendarClock} copy="No session plan yet" />
      ) : (
        <div className="overflow-x-auto">
          {/* The header row's tint IS the boundary — it deliberately carries
              no bottom rule, unlike the app's default card-header pattern.
              Column widths are percentages rather than fixed px so they hold
              their ratio on a narrow container instead of clipping the
              trailing columns; `min-w` plus this wrapper's `overflow-x-auto`
              is what stops that clipping becoming page-wide scroll. */}
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
                // The offset chain, spelled out: module index i+1 is reviewed
                // by internal session i+2, which is displayed as "Session i+1"
                // via `sessionRowLabel`. Three different numbers for one row.
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
                    {/* Its own column, not a caption under the session: it is
                        a separate fact, and stacking it makes the first column
                        two lines deep while every other cell stays one. */}
                    <td className="px-4 py-4 text-caption whitespace-nowrap text-ink">
                      Module {modIdx}
                    </td>
                    {/* ⚠️ Four states, and the `!sessionDone` guard on "In
                        progress" is load-bearing: a module can only be in
                        progress *before* its own catch-up. Once that session
                        has been held it is complete or incomplete, so a stale
                        in-progress record must render as Incomplete rather
                        than be repeated back. The seed data enforces the same
                        invariant; this guard is the render-side half of it.
                        Incomplete takes `destructive` because an unlocked
                        module the consumer has not finished is the row a
                        researcher may need to act on. */}
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
