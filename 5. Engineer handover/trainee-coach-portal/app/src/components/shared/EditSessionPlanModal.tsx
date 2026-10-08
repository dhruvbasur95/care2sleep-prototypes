import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SessionPlannerTable } from '@/components/shared/SessionPlannerTable'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { useResearch } from '@/data/research-context'
import {
  SPACES_CATCHUP_COUNT,
  SPACES_SESSIONS,
  displaySessionNumber,
  type ConsumerDyad,
  type SessionPlanRow,
} from '@/data/spaces'
import { formatDate, formatTime, toLocalISODate } from '@/data/format'
import { cn } from '@/lib/utils'

/** Same anchor the wizard uses — a coach amending a plan should be able to pick
 *  dates they could actually book, not the seed world's frozen `TODAY`. */
const PLAN_ANCHOR = toLocalISODate(new Date())

/** The wizard's own dashed read-back card, so the summary above the table reads
 *  identically on both screens. */
const SUMMARY_CARD =
  'flex flex-col gap-4 rounded-sm border border-dashed border-primary bg-card p-4'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** The weekday a set of ISO dates falls on, or `null` if they disagree.
 *
 *  The wizard knows its cadence because the coach just answered for it; this
 *  modal has to read it back off the plan. A plan whose rows have been
 *  individually rescheduled genuinely has no single weekday any more, and in
 *  that case the summary says so rather than picking the first row's day and
 *  presenting it as the pattern. */
function commonWeekday(dates: (string | undefined)[]): number | null {
  const days = dates
    .filter((d): d is string => !!d)
    .map((d) => {
      const [y, m, dd] = d.split('-').map(Number)
      return new Date(Date.UTC(y, m - 1, dd)).getUTCDay()
    })
  if (days.length === 0) return null
  return days.every((d) => d === days[0]) ? days[0] : null
}

/**
 * "Edit plan" entry point for an already-active session plan (direct
 * feedback reopening Round 14's `PlanSessionsModal`): that wizard's 3
 * question-and-answer steps (module-availability weekday, catch-up
 * weekday/time) are for the initial planning meeting, so this is a
 * separate, single-panel component rather than `PlanSessionsModal` reopened
 * at its review step — no rail, no cadence questions, no re-answering the
 * weekly-unlock-day questions from the original planning meeting.
 *
 * **Round 39: this screen IS the wizard's review step.** Direct instruction —
 * "when I click edit session plan, update it to be exactly as we have done for
 * new session plan review screen". Both now render the same
 * `SessionPlannerTable`, under the same dashed "Plan summary" card and the same
 * "Session planner table" label, in a panel of the same 888px width.
 *
 * That replaced the Round 14.4 week-wise timeline this file used to carry (a
 * numbered marker rail, a green "Module N unlocks" card and an amber
 * "Session N catch-up" card per week). The timeline was itself a faithful copy
 * of the wizard's review step *at the time*; the wizard's review step was then
 * redesigned into a table and this file was not, which is how one plan came to
 * be shown in two vocabularies. Extracting the table is what stops that
 * recurring — it has now happened twice.
 *
 * Three things remain specific to this screen, all because it edits a plan that
 * has partly happened rather than one being created from nothing:
 * (1) **Locked rows.** A session already held renders read-only via
 * `lockedFor`, showing the date it was *actually* held (from
 * `sessionCompletion`) rather than the date it was once planned for, with a
 * Complete chip and no Modify control at all — absent, not disabled.
 * (2) **`orderIssue`'s second direction.** A coach can mark Session 4 complete
 * while Session 2 is still open in this app, so a done row further down the
 * list is a fixed point an earlier edit could otherwise creep past unnoticed.
 * This is checked on top of the wizard's own same-week (`rowDateInvalid`) and
 * cross-week (`crossWeekInvalid`) rules, which are carried over unchanged.
 * (3) **A derived summary.** The wizard knows its cadence because the coach
 * just answered for it; this modal reads it back off the plan via
 * `commonWeekday`, and says so plainly when the remaining rows no longer share
 * one weekday instead of presenting the first row's day as the pattern.
 *
 * `zoomLink`/`meetingId` are carried through untouched on every row — this
 * modal only ever patches `date`/`endTime`/`time`/`moduleTargetDate`, so nothing
 * it does not show can be silently altered by using it.
 *
 * Testing note (not a bug, don't re-chase this): in the automated browser
 * pane used for live verification, this dialog (and, confirmed separately,
 * `ConfirmDialog` too) can appear to never unmount after Save/Cancel/Escape
 * — `document.querySelectorAll('[role="dialog"]')` still finds it, with
 * live event handlers, seconds later. Root cause: that pane's tab reports
 * `document.hidden === true`, which browsers use to throttle/pause
 * `requestAnimationFrame` — the same mechanism `framer-motion`'s
 * `AnimatePresence` depends on to detect an exit animation has finished and
 * it's safe to remove the node. A real user's tab is never `hidden` while
 * they're clicking in it, so this doesn't happen outside this specific
 * testing tool. Confirmed via a from-scratch dev server restart (not HMR
 * staleness) and reproduced identically on `ConfirmDialog`, a component
 * used app-wide with no other reported issue — so this isn't specific to
 * this file either. If a "stuck dialog" shows up again in this same
 * automated pane, check `document.hidden` before assuming a real
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

  // Lazy initial state matters here, not just style: `open` can flip true on
  // the very same render this component first mounts with, before the
  // effect below has ever run — rendering the table against the empty `[]`
  // this state would otherwise start with crashed on `rows[i]` being
  // `undefined` for every row (caught live: "An error occurred in the
  // <EditSessionPlanModal> component").
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
    // Only re-seed when the dialog opens — editing shouldn't reset itself
    // if `plan` happens to re-render for unrelated reasons while open.
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
    // Initial focus lands on the panel itself (`tabIndex={-1}`, see the open
    // effect above), which is deliberately not part of `focusables` — so a
    // Shift+Tab pressed as the very first key (before ever tabbing forward)
    // needs the same "wrap to last" treatment as Shift+Tab from `first`.
    // Without this, `document.activeElement` is the panel div, matches
    // neither `first` nor `last`, and the browser's native backward-tab
    // escapes straight past the modal onto the page behind it — reproduced
    // live (a background row's kebab-menu button, visually hidden under the
    // dialog overlay, received focus) during the Round 17.1 accessibility
    // review; a real focus-trap break, not a hypothetical one.
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

  // A module's target date must fall strictly before its own week's catch-up
  // date — the consumer needs to finish the module before the coach reviews
  // it (same rule as `PlanSessionsModal`'s review step, now that this modal
  // also exposes `moduleTargetDate` directly).
  const rowDateInvalid = (row: SessionPlanRow) =>
    !!row.moduleTargetDate && !!row.date && row.moduleTargetDate >= row.date

  // Completing a week's catch-up is literally what unlocks the following
  // week's module, so a catch-up dated AFTER the very module it unlocks is
  // backwards — the same class of bug across weeks instead of within one.
  const crossWeekInvalid = (i: number) => {
    const row = rows[i]
    const next = rows[i + 1]
    return !!row?.date && !!next?.moduleTargetDate && row.date > next.moduleTargetDate
  }

  // Sessions must stay in chronological order. A completed row is a fixed
  // point that can't be edited from here, so it's checked from BOTH sides:
  // an editable row is invalid if it's on or before the previous row's
  // date, OR on or after a *later* row's date if that later row is already
  // done. The second direction matters because completion isn't gated on
  // session order in this app (a coach can mark Session 4 complete while
  // Session 2 is still open) — a done row further down the list is a fixed
  // point nothing else would otherwise catch an earlier row creeping past.
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

  /* Keyed by INTERNAL session number, matching `SessionPlannerTable`'s own
     `rowIssues` contract, so the same validation reaches the table that
     `canSave` gates on — two functions answering "is this row broken?"
     differently is exactly how a Save button ends up disabled with no visible
     reason. The index the order checks need is resolved here. */
  const rowIssues = (session: number): string[] => {
    const i = rows.findIndex((r) => r.session === session)
    const row = rows[i]
    if (!row || isDone(row.session)) return []
    const displayNumber = displaySessionNumber(row.session)
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

  const canSave = rows.length > 0 && rows.every((r) => rowIssues(r.session).length === 0)

  /* Read the cadence back off the live plan for the summary card. Only rows
     that have NOT happened yet are considered: a completed session is a
     historical fact and may well have been moved, so including it would let one
     past reschedule report the whole plan as having no pattern. */
  const openRows = rows.filter((r) => !isDone(r.session))
  const moduleWeekday = commonWeekday(openRows.map((r) => r.moduleTargetDate))
  const catchupWeekday = commonWeekday(openRows.map((r) => r.date))
  const firstOpen = openRows[0]
  const remaining = openRows.length

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
              className="pointer-events-auto flex max-h-[85vh] w-full max-w-[888px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline md:p-8"
            >
              <h2
                id={titleId}
                ref={headingRef}
                tabIndex={-1}
                className="shrink-0 font-display text-title text-ink outline-none"
              >
                Edit session plan
              </h2>
              {/* Short, because the summary card below now states the plan's
                  own shape and the "already held cannot be changed" rule. Two
                  sentences saying that 40px apart read as a warning repeated
                  because the first one did not work. */}
              <p className="mt-1 shrink-0 text-caption text-ink-faint">
                Review the plan and modify any week that has not happened yet.
              </p>

              <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                {/* Round 39, direct instruction: this screen is now exactly the
                    wizard's review step — the same dashed summary card, the same
                    "Session planner table" label, and the same
                    `SessionPlannerTable`. It replaced the Round 14.4 week-wise
                    timeline of green/amber topic cards, which had become the
                    second of two vocabularies for one plan. */}
                <div className={SUMMARY_CARD}>
                  <p className="text-caption-medium text-ink">Plan summary</p>
                  <p className="text-body text-ink-muted">
                    {remaining === 0 ? (
                      <>All {SPACES_CATCHUP_COUNT} catch-up sessions have been held. There is nothing left to reschedule.</>
                    ) : (
                      <>
                        {/* Each clause is stated only when the plan actually has
                            a single pattern to state. A plan whose remaining
                            rows have been individually rescheduled has no
                            weekday, and claiming one would be the kind of
                            confident-but-wrong summary this project keeps
                            finding in its own copy. */}
                        {moduleWeekday !== null ? (
                          <>
                            A new module is available each{' '}
                            <span className="font-semibold text-primary">{DAY_NAMES[moduleWeekday]}</span>
                            {catchupWeekday !== null ? ', and you ' : '. You '}
                          </>
                        ) : (
                          <>Module dates vary week to week. You </>
                        )}
                        {catchupWeekday !== null ? (
                          <>
                            meet every{' '}
                            <span className="font-semibold text-primary">{DAY_NAMES[catchupWeekday]}</span>
                            {firstOpen?.time && (
                              <>
                                ,{' '}
                                <span className="font-semibold text-primary">
                                  {formatTime(firstOpen.time)}
                                  {firstOpen.endTime ? ` to ${formatTime(firstOpen.endTime)}` : ''}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <>meet on a different day each week</>
                        )}
                        .{' '}
                        <span className="font-semibold text-primary">
                          {remaining} {remaining === 1 ? 'session' : 'sessions'}
                        </span>{' '}
                        {remaining === 1 ? 'is' : 'are'} still to come
                        {firstOpen?.date && (
                          <>
                            , starting{' '}
                            <span className="font-semibold text-primary">{formatDate(firstOpen.date)}</span>
                          </>
                        )}
                        . Sessions already held cannot be changed.
                      </>
                    )}
                  </p>
                </div>

                <p className="mt-10 text-caption-medium text-ink">Session planner table</p>
                <div className="mt-2">
                  <SessionPlannerTable
                    rows={rows}
                    patchRow={patchRow}
                    rowIssues={rowIssues}
                    minDate={PLAN_ANCHOR}
                    /* The one thing this screen has that the wizard does not:
                       rows for sessions that have already happened. They show
                       the date they were actually held and carry no Modify
                       control at all. */
                    lockedFor={(session) => {
                      if (!isDone(session)) return null
                      const record = completed.find((c) => c.session === session)
                      return record
                        ? `Held ${formatDate(record.completedDate)} · ${formatTime(record.completedTime)}`
                        : 'Session held'
                    }}
                    idPrefix="edit-plan-row"
                  />
                </div>
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
