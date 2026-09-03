import { Fragment, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { Chip } from '@/components/shared/StatusChip'
import { SessionDateCalendar } from '@/components/shared/SessionDateCalendar'
import { SPACES_SESSIONS, displaySessionNumber, type SessionPlanRow } from '@/data/spaces'
import { formatDate, formatTime } from '@/data/format'
import { cn } from '@/lib/utils'

/**
 * The "Session planner table" — the plan, one row per week, with a per-row
 * editing drawer.
 *
 * **Round 39: extracted so `PlanSessionsModal`'s review step and
 * `EditSessionPlanModal` are literally the same table.** Direct instruction was
 * that clicking "Edit session plan" should look exactly like the review screen,
 * and the two had genuinely diverged: the wizard's review step is this table,
 * while the edit modal still carried the Round 14.4 week-wise timeline of green
 * "Module N unlocks" / amber "Session N catch-up" cards it had been rebuilt into
 * two rounds earlier.
 *
 * Copying the table across would have set that same drift running again — this
 * is a plan editor that has now been redesigned four times, and it has twice
 * ended up with two surfaces showing one plan in two vocabularies. So the table
 * lives here and both callers render it.
 *
 * What stays with the caller, because the two genuinely differ:
 *   - **Validation.** The wizard checks a plan being built from nothing; the
 *     edit modal additionally checks against already-completed rows, which are
 *     fixed points an edit can creep past. Both pass their own `rowIssues`.
 *   - **Locked rows.** Only the edit modal has them (`lockedFor`), because only
 *     it edits a plan that has partly happened. Nothing about a session already
 *     held should be editable, so those rows render read-only with a Complete
 *     chip and no Modify control at all — absent rather than disabled, per this
 *     project's own permissions convention.
 */

/** The app's shared table-header cell shape (`SpacesRosterPage`'s `TH`).
 *  Local — it was exported when this table lived in `PlanSessionsModal`; nothing
 *  outside this file reads it. */
const PLAN_TH = 'px-4 py-3.5 text-caption-medium text-ink-muted'

export const TIME_STEP_SECONDS = 900

const STEP_CONTROL =
  'flex h-9 w-full items-center rounded-xs border border-purple-300 bg-card pr-8 pl-2 text-caption-medium text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-hairline disabled:text-ink-faint'

/** `<input type="time">` draws its own clock glyph, which is replaced with the
 *  same down chevron the date select uses — two controls side by side should not
 *  disagree about what "opens a picker" looks like. The native indicator is
 *  stretched over the whole field at zero opacity rather than hidden, so
 *  clicking anywhere still opens the real picker; `display: none` would have
 *  left the chevron decorative. */
export const STEP_TIME_CONTROL = cn(
  STEP_CONTROL,
  '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
)

export function SessionPlannerTable({
  rows,
  patchRow,
  rowIssues,
  minDate,
  lockedFor,
  idPrefix = 'plan-row',
}: {
  rows: SessionPlanRow[]
  patchRow: (session: number, patch: Partial<SessionPlanRow>) => void
  /** Validation messages for one session's row, by internal session number. */
  rowIssues: (session: number) => string[]
  /** Earliest selectable date in the drawer's calendars. */
  minDate: string
  /**
   * For a session that can no longer be edited, the read-only line to show in
   * place of its dates (e.g. "Completed 19 Aug 2026, 10:00 AM"). Return `null`
   * for an editable row. Omitted entirely by the wizard, which has none.
   */
  lockedFor?: (session: number) => string | null
  /** Namespaces the drawer's input ids, so two instances can never collide. */
  idPrefix?: string
}) {
  /* Which weeks currently have their editing drawer open. Local, because it is
     view state about this table rather than anything either caller needs — and
     it must survive a `patchRow` re-render, which is why it is not derived. */
  const [editingWeeks, setEditingWeeks] = useState<number[]>([])

  return (
    <div className="overflow-hidden rounded-sm border border-parchment">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-purple-50">
            <th scope="col" className={cn(PLAN_TH, 'w-16 px-4')}>
              Week
            </th>
            <th scope="col" className={PLAN_TH}>
              Module available
            </th>
            <th scope="col" className={PLAN_TH}>
              Session
            </th>
            <th scope="col" className={PLAN_TH}>
              Catch-up date and time
            </th>
            <th scope="col" className={cn(PLAN_TH, 'w-28 text-right')}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {SPACES_SESSIONS.filter((s) => s.number >= 2).map((s, i) => {
            const row = rows.find((r) => r.session === s.number) ?? { session: s.number }
            const week = displaySessionNumber(s.number)
            const locked = lockedFor?.(s.number) ?? null
            const editing = !locked && editingWeeks.includes(s.number)
            const issues = rowIssues(s.number)
            return (
              <Fragment key={s.number}>
                <tr className={cn(i > 0 && 'border-t border-hairline')}>
                  <td className="px-4 py-3 text-caption-medium text-ink">{week}</td>
                  {/* Plain text, no tinted block — two filled boxes per row
                      across six rows read as clutter, and with the columns
                      already labelled the colour was not carrying meaning the
                      header did not. */}
                  <td className="px-4 py-3 text-caption text-ink">
                    {row.moduleTargetDate ? formatDate(row.moduleTargetDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-caption whitespace-nowrap text-ink">Session {week}</td>
                  <td className="px-4 py-3 text-caption whitespace-nowrap text-ink">
                    {/* A locked row shows when the session was actually held,
                        not the date it was once planned for — those differ, and
                        the planned date is no longer the true fact about it. */}
                    {locked ? (
                      <span className="text-ink-muted">{locked}</span>
                    ) : (
                      <>
                        {row.date ? formatDate(row.date) : '—'}
                        {row.time && (
                          <span className="text-ink-muted">
                            {' · '}
                            {formatTime(row.time)}
                            {row.endTime ? ` to ${formatTime(row.endTime)}` : ''}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {locked ? (
                      <Chip tone="success" label="Complete" />
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingWeeks((prev) =>
                            prev.includes(s.number)
                              ? prev.filter((n) => n !== s.number)
                              : [...prev, s.number],
                          )
                        }
                        aria-expanded={editing}
                        className="inline-flex min-h-9 items-center rounded-sm px-2 text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {editing ? 'Done' : 'Modify'}
                        <span className="sr-only"> week {week}</span>
                      </button>
                    )}
                  </td>
                </tr>

                {/* Editing expands a drawer *below* its own row rather than
                    swapping the row in place, so the values a coach is changing
                    stay on screen while they change them. */}
                {editing && (
                  <tr className="border-t border-hairline">
                    <td colSpan={5} className="bg-pearl px-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor={`${idPrefix}-module-${s.number}`}
                            className="text-fine font-semibold text-ink"
                          >
                            Module {week} available on
                          </label>
                          <SessionDateCalendar
                            id={`${idPrefix}-module-${s.number}`}
                            value={row.moduleTargetDate}
                            onChange={(iso) => patchRow(s.number, { moduleTargetDate: iso })}
                            weekday={null}
                            minDate={minDate}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor={`${idPrefix}-date-${s.number}`}
                            className="text-fine font-semibold text-ink"
                          >
                            Session {week} on
                          </label>
                          <SessionDateCalendar
                            id={`${idPrefix}-date-${s.number}`}
                            value={row.date}
                            onChange={(iso) => patchRow(s.number, { date: iso })}
                            weekday={null}
                            minDate={minDate}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-fine font-semibold text-ink">Session {week} time</span>
                          <div className="flex items-center gap-2">
                            <label htmlFor={`${idPrefix}-time-${s.number}`} className="sr-only">
                              Session {week} start time
                            </label>
                            <div className="relative flex-1">
                              <input
                                id={`${idPrefix}-time-${s.number}`}
                                type="time"
                                step={TIME_STEP_SECONDS}
                                value={row.time ?? ''}
                                onChange={(e) => patchRow(s.number, { time: e.target.value })}
                                className={STEP_TIME_CONTROL}
                              />
                              <ChevronDown
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink"
                              />
                            </div>
                            <span className="shrink-0 text-caption-medium text-ink-muted">to</span>
                            <label htmlFor={`${idPrefix}-end-${s.number}`} className="sr-only">
                              Session {week} end time
                            </label>
                            <div className="relative flex-1">
                              <input
                                id={`${idPrefix}-end-${s.number}`}
                                type="time"
                                step={TIME_STEP_SECONDS}
                                value={row.endTime ?? ''}
                                onChange={(e) => patchRow(s.number, { endTime: e.target.value })}
                                className={STEP_TIME_CONTROL}
                              />
                              <ChevronDown
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Errors sit BELOW the grey editing box, in their own row, so
                    the message reads as the outcome of the edit rather than a
                    banner the fields are stacked under. Shown whether or not the
                    drawer is open, since a plan can be broken and then
                    collapsed. */}
                {issues.length > 0 && (
                  <tr className="border-t border-hairline">
                    <td colSpan={5} className="px-4 py-3">
                      <div
                        role="alert"
                        className="flex items-center gap-2 rounded-sm border border-destructive bg-destructive/10 px-3 py-2"
                      >
                        <AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-destructive" />
                        <ul className="text-fine text-ink">
                          {issues.map((msg) => (
                            <li key={msg}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
