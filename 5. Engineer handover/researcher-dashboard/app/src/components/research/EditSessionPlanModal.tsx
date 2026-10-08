import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Chip } from '@/components/research/StatusChip'
import { TOPIC_CARD_CLASS } from '@/components/research/PlanSessionsModal'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { useResearch } from '@/data/research-context'
import { SPACES_SESSIONS, displaySessionNumber, type ConsumerDyad, type SessionPlanRow } from '@/data/spaces'
import { formatDate, formatTime } from '@/data/format'
import { cn } from '@/lib/utils'

/**
 * ⚠️ NO MOUNT POINT IN THIS PACKAGE. Nothing imports this file at all.
 *
 * Session planning is the *coach's* workflow with their consumer. Its trigger
 * lived in the coach-portal session tracker, which is not part of the Research
 * Dashboard handover — a researcher reads a plan through
 * `SessionsPlanOverview` but never creates or amends one. Retained intact
 * because this is real, heavily iterated product logic and the store action it
 * writes through (`bulkSetSessionPlan`) still exists. Deleting it, or giving it
 * a researcher-facing trigger, are both product calls rather than cleanup.
 */

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Amends an already-active session plan: a single panel of week rows, no
 * wizard rail. Deliberately not `PlanSessionsModal` reopened at its review
 * step — a coach changing one date should not have to re-answer the
 * planning-meeting questions that generated the plan.
 *
 * It shares `PlanSessionsModal`'s review-step visual language on purpose,
 * importing `TOPIC_CARD_CLASS` from it so the two cannot drift.
 *
 * ⚠️ IT PATCHES ONLY `date`, `time` AND `moduleTargetDate`. `zoomLink` and
 * `meetingId` are carried through untouched on every row, so using this modal
 * cannot silently alter anything it does not show. Keep that property if you
 * add fields.
 *
 * ⚠️ A COMPLETED WEEK IS A FIXED POINT, in two senses:
 *  - It renders as a read-only summary showing the date it *actually*
 *    happened (from `sessionCompletion`), not the date it was planned for.
 *    Nothing about a held session is editable here.
 *  - `orderIssue` therefore checks each editable row from **both** sides. This
 *    app does not gate completion on session order — a coach can mark Session
 *    4 complete while Session 2 is still open — so a completed row *further
 *    down* the list is a boundary an earlier edit could otherwise creep past
 *    unnoticed. A previous-row check alone is not enough.
 *
 * The same-week and cross-week rules (`rowDateInvalid`, `crossWeekInvalid`)
 * are carried over from `PlanSessionsModal` and mean the same thing there —
 * see its header. All three checks feed `rowIssues`, and `canSave` requires
 * every row clean.
 *
 * TESTING NOTE — not a bug, do not re-chase. In an automated browser pane this
 * dialog can appear never to unmount after Save/Cancel/Escape:
 * `document.querySelectorAll('[role="dialog"]')` still finds it seconds later
 * with live handlers. Such panes report `document.hidden === true`, which
 * throttles `requestAnimationFrame` — the mechanism `AnimatePresence` needs to
 * know an exit animation finished. A real user's tab is never hidden while
 * they are clicking in it. Reproduced identically on `ConfirmDialog`, so it is
 * not specific to this component. Check `document.hidden` before assuming a
 * regression.
 */
export function EditSessionPlanModal({
  open,
  onClose,
  dyad,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  dyad: ConsumerDyad
  onSaved?: () => void
}) {
  const { sessionPlans, sessionCompletion, bulkSetSessionPlan } = useResearch()
  const plan = sessionPlans[dyad.id]
  const completed = sessionCompletion[dyad.id] ?? []
  const sessions = SPACES_SESSIONS.filter((s) => s.number >= 2)

  const seedRows = () =>
    sessions.map((s) => ({ ...(plan?.sessions.find((r) => r.session === s.number) ?? { session: s.number }) }))

  // ⚠️ Lazy initialiser, not `useState([])` plus the effect below. `open` can
  // be true on this component's very first render, before any effect has run,
  // and rendering the timeline against an empty array makes `rows[i]`
  // undefined for every row — a real crash, not a blank frame.
  const [rows, setRows] = useState<SessionPlanRow[]>(seedRows)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus({ preventScroll: true })
      setRows(seedRows())
    } else if (triggerRef.current) {
      triggerRef.current.focus({ preventScroll: true })
      triggerRef.current = null
    }
    // Keyed on `open` alone: re-seeding when `plan` re-renders for unrelated
    // reasons would discard edits in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const trapKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled])',
      ),
    ]
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    // ⚠️ The `onPanel` term closes a real hole in the trap. Initial focus lands
    // on the panel div itself, which is `tabIndex={-1}` and so is not in
    // `focusables`. A Shift+Tab pressed as the very first key then matches
    // neither `first` nor `last`, nothing prevents the default, and the
    // browser's backward-tab escapes past the modal onto the page behind it —
    // reproduced with a background row's menu button, hidden under the
    // overlay, receiving focus. Treat "focus is on the panel" the same as
    // "focus is on the first control".
    const onPanel = document.activeElement === panelRef.current
    if (e.shiftKey && (document.activeElement === first || onPanel)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const patchRow = (session: number, patch: Partial<SessionPlanRow>) => {
    setRows((prev) => prev.map((r) => (r.session === session ? { ...r, ...patch } : r)))
  }

  const isDone = (session: number) => completed.some((c) => c.session === session)

  // Within a week: the module must unlock strictly before its own catch-up.
  // Same rule as `PlanSessionsModal`'s review step — keep them identical.
  const rowDateInvalid = (row: SessionPlanRow) =>
    !!row.moduleTargetDate && !!row.date && row.moduleTargetDate >= row.date

  // Across weeks: completing a catch-up is what unlocks the *next* week's
  // module, so a catch-up dated after that module is backwards.
  const crossWeekInvalid = (i: number) => {
    const row = rows[i]
    const next = rows[i + 1]
    return !!row?.date && !!next?.moduleTargetDate && row.date > next.moduleTargetDate
  }

  // ⚠️ Chronological order, checked from BOTH sides. An editable row is
  // invalid if it lands on or before the previous row, OR on or after a
  // *later* row that is already complete. The second direction is not
  // redundant: completion is not gated on session order here, so a completed
  // row further down the list is a boundary nothing else would catch an
  // earlier row creeping past. See the ⚠️ note in the file header.
  const orderIssue = (i: number): 'missing' | 'before-previous' | 'after-next' | null => {
    const row = rows[i]
    if (!row || isDone(row.session)) return null
    if (!row.date || !row.time || !row.moduleTargetDate) return 'missing'
    const prev = rows[i - 1]
    if (prev?.date && row.date <= prev.date) return 'before-previous'
    const next = rows[i + 1]
    if (next && isDone(next.session) && next.date && row.date >= next.date) return 'after-next'
    return null
  }

  const rowIssues = (i: number, displayNumber: number): string[] => {
    const row = rows[i]
    if (!row || isDone(row.session)) return []
    const issues: string[] = []
    const order = orderIssue(i)
    if (order === 'missing') issues.push(`Add a date and time for Session ${displayNumber}.`)
    else if (order === 'before-previous')
      issues.push(`Session ${displayNumber} should happen after Session ${displayNumber - 1}.`)
    else if (order === 'after-next')
      issues.push(`Session ${displayNumber} should happen before Session ${displayNumber + 1}, which is already held.`)
    if (rowDateInvalid(row)) issues.push(`Module ${displayNumber} should unlock before the Session ${displayNumber} catch-up.`)
    if (crossWeekInvalid(i)) issues.push(`Session ${displayNumber} catch-up should happen before Module ${displayNumber + 1} unlocks.`)
    return issues
  }

  const canSave = rows.length > 0 && rows.every((_, i) => rowIssues(i, displaySessionNumber(rows[i].session)).length === 0)

  const handleSave = () => {
    if (!canSave) return
    bulkSetSessionPlan(dyad.id, rows)
    onClose()
    onSaved?.()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/25"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              onKeyDown={trapKeys}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="pointer-events-auto flex max-h-[85vh] w-full max-w-[760px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline md:p-8"
            >
              <h2
                id={titleId}
                ref={headingRef}
                tabIndex={-1}
                className="shrink-0 font-display text-title text-ink outline-none"
              >
                Edit session plan
              </h2>
              <p className="mt-1 shrink-0 text-caption text-ink-faint">
                Update the date and time for sessions that haven't happened yet. Sessions already
                held can't be changed.
              </p>

              <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                <ol className="flex flex-col">
                  {sessions.map((s, i, arr) => {
                    const row = rows[i] ?? { session: s.number }
                    const week = displaySessionNumber(s.number)
                    const last = i === arr.length - 1
                    const done = isDone(s.number)
                    const record = completed.find((c) => c.session === s.number)
                    const issues = rowIssues(i, week)
                    return (
                      <Fragment key={s.number}>
                        <li className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <span
                              aria-hidden="true"
                              className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-full text-caption-medium',
                                done
                                  ? 'bg-success/15 text-success'
                                  : 'border border-ink-faint bg-card text-ink-muted',
                              )}
                            >
                              {week}
                            </span>
                            {!last && (
                              <span
                                aria-hidden="true"
                                // ⚠️ `/80`, not a lighter alpha. Lighter values measure under
                                // 2:1 against this row's white background, short of WCAG
                                // 1.4.11's 3:1 floor for a UI boundary.
                                className={cn('my-1 w-px flex-1', done ? 'bg-success/80' : 'bg-ink-faint/80')}
                              />
                            )}
                          </div>
                          <div className={cn('min-w-0 flex-1', !last && 'pb-8')}>
                            <p className="flex items-center gap-2 text-caption font-semibold text-ink">
                              Week {week}
                              {done && <Chip tone="success" label="Complete" />}
                              {!done && row.rescheduled && <Chip tone="muted" label="Rescheduled" />}
                            </p>

                            {done ? (
                              <div className="mt-3 rounded-lg border border-hairline bg-pearl p-4">
                                <p className="text-caption text-ink-faint">
                                  {record
                                    ? `Completed ${formatDate(record.completedDate)}, ${formatTime(record.completedTime)}`
                                    : 'Session held'}
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                  <div className={cn('h-full rounded-lg border p-4', TOPIC_CARD_CLASS.module)}>
                                    <p className="text-fine font-semibold text-green-700">Module {week} unlocks</p>
                                    <label
                                      className="mt-3 block text-fine font-semibold text-ink"
                                      htmlFor={`edit-plan-module-date-${s.number}`}
                                    >
                                      Module {week} unlocks on:
                                    </label>
                                    <div className="mt-1">
                                      <input
                                        id={`edit-plan-module-date-${s.number}`}
                                        type="date"
                                        value={row.moduleTargetDate ?? ''}
                                        onChange={(e) => patchRow(s.number, { moduleTargetDate: e.target.value })}
                                        className={cn(inputClass, 'text-body font-semibold text-ink')}
                                      />
                                    </div>
                                  </div>
                                  <div className={cn('h-full rounded-lg border p-4', TOPIC_CARD_CLASS.catchup)}>
                                    <p className="text-fine font-semibold text-amber-700">Session {week} catch-up</p>
                                    <label
                                      className="mt-3 block text-fine font-semibold text-ink"
                                      htmlFor={`edit-plan-date-${s.number}`}
                                    >
                                      Session {week} catch-up on:
                                    </label>
                                    <div className="mt-1">
                                      <input
                                        id={`edit-plan-date-${s.number}`}
                                        type="date"
                                        value={row.date ?? ''}
                                        onChange={(e) => patchRow(s.number, { date: e.target.value })}
                                        className={cn(inputClass, 'text-body font-semibold text-ink')}
                                      />
                                    </div>
                                    <label
                                      className="mt-4 block text-fine font-semibold text-ink"
                                      htmlFor={`edit-plan-time-${s.number}`}
                                    >
                                      Session {week} catch-up at:
                                    </label>
                                    <div className="mt-1">
                                      <input
                                        id={`edit-plan-time-${s.number}`}
                                        type="time"
                                        value={row.time ?? ''}
                                        onChange={(e) => patchRow(s.number, { time: e.target.value })}
                                        className={cn(inputClass, 'text-body font-semibold text-ink')}
                                      />
                                    </div>
                                  </div>
                                </div>
                                {issues.map((issue) => (
                                  <div
                                    key={issue}
                                    role="alert"
                                    className="mt-2 flex items-center gap-1.5 rounded-sm bg-destructive/5 px-2 py-1"
                                  >
                                    <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0 text-destructive" />
                                    <p className="text-fine font-semibold text-destructive">{issue}</p>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </li>
                      </Fragment>
                    )
                  })}
                </ol>
              </div>

              <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-ink-muted outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-divider-soft disabled:text-ink-faint disabled:hover:bg-divider-soft"
                >
                  Save changes
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
