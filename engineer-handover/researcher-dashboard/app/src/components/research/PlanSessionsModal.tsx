import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarDays, Clock, ListChecks, Loader2 } from 'lucide-react'
import { Chip } from '@/components/research/StatusChip'
import { WizardProgressRail, type WizardRailStep } from '@/components/shared/WizardProgressRail'
import { STEP_CONTENT_GAP, WizardStepHeading } from '@/components/shared/WizardStepHeading'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import {
  DAY_OF_WEEK_OPTIONS,
  SPACES_SESSIONS,
  displaySessionNumber,
  generatePlanRows,
  mondayFirstOrdinal,
  type ConsumerDyad,
  type SessionPlanRow,
} from '@/data/spaces'
import { TODAY, formatTime } from '@/data/format'

/**
 * ⚠️ NO MOUNT POINT IN THIS PACKAGE. Nothing renders this component; the only
 * import of this file is `EditSessionPlanModal` reaching for `TOPIC_CARD_CLASS`,
 * and that file has no mount point either.
 *
 * Session planning is the *coach's* workflow with their consumer. Its trigger
 * lived in the coach-portal session tracker, which is not part of the Research
 * Dashboard handover — a researcher reads a plan through `SessionsPlanOverview`
 * but never creates or amends one. Retained intact because this is real,
 * heavily iterated product logic and the store actions it writes through still
 * exist. Deleting it, or giving it a researcher-facing trigger, are both
 * product calls rather than cleanup.
 *
 * ---------------------------------------------------------------------------
 *
 * The guided "Plan sessions" wizard: welcome screen, then two questions, then
 * an editable review timeline.
 *
 * ⚠️ CREATE-ONLY. It assumes no plan exists yet, and `runGenerate` overwrites
 * the whole draft from the two weekday answers. Amending a live plan is
 * `EditSessionPlanModal`'s job — a coach changing one date should not have to
 * re-answer the planning-meeting questions. **Nothing reaches the store until
 * the final confirm on the review step.**
 *
 * WHAT THE COACH IS ACTUALLY DECIDING. Two weekdays, and every date in the
 * 7-session plan cascades from them via `generatePlanRows`:
 *  - the weekday each module unlocks on;
 *  - the weekday and time of the catch-up that reviews it.
 * The review step then exposes `moduleTargetDate`, `date` and `time` per row
 * for adjustment, which is what makes the two validators below necessary.
 *
 * ⚠️ SESSION NUMBERING. Internal session 1 is the *planning* meeting — where
 * the coach and consumer agree this plan — and is never shown as a numbered
 * session. It is not the always-unlocked onboarding module, which is a
 * different thing. Internal sessions 2-7 are the catch-ups, displayed as
 * "Session 1-6" through `displaySessionNumber`. Confirming the wizard marks
 * internal session 1 complete, because by then that meeting has happened.
 *
 * ⚠️ TWO ORDERING RULES ARE ENFORCED, and both are easy to get backwards:
 *  - `rowDateInvalid`: a module must unlock strictly *before* its own week's
 *    catch-up — the consumer has to finish it before the coach reviews it.
 *  - `crossWeekInvalid`: a catch-up must happen *before* the next week's
 *    module unlocks, because completing it is what unlocks that module.
 *
 * ⚠️ FOCUS MANAGEMENT IS LOAD-BEARING THROUGHOUT. Leaving the intro, stepping
 * back, and entering or leaving either loading state each unmount the control
 * that was pressed. Three effects redirect focus onto a `tabIndex={-1}`
 * heading for exactly those transitions; without them focus lands on `<body>`
 * with the dialog still open on top of it. Relatedly, the Tab trap must keep
 * running while busy even though Escape is suppressed — see `trapKeys`.
 *
 * The two loading interstitials are **fake timers** with no async work behind
 * them (`LOADING_MS`). They exist so a screen swap reads as the system doing
 * something rather than as a jarring jump. A real backend would replace them
 * with the actual request.
 *
 * Colour runs by *topic*, not by who answers: green for every module-unlock
 * field, amber for every catch-up field. `TOPIC_CARD_CLASS` is the single
 * definition — three different opacity recipes were doing this job before it
 * was unified.
 */

type StepKey = 'module-availability' | 'catchup-timing' | 'review'

const STEPS: { key: StepKey; navLabel: string; heading: string; subtitle: string }[] = [
  {
    key: 'module-availability',
    navLabel: 'Module unlock day',
    heading: "First, ask your consumer when they'd like their modules to unlock",
    subtitle:
      "Whatever day they choose becomes their weekly unlock day. A new module becomes available on this same day every week, once the previous catch-up is done.",
  },
  {
    key: 'catchup-timing',
    navLabel: 'Catch-up timing',
    heading: 'Next, plan your weekly catch-up with your consumer',
    subtitle:
      "This happens online, over Zoom, every week to review the finished module together. Pick a day and time below. Days before the module becomes available are blocked, since there's nothing to review yet.",
  },
  {
    key: 'review',
    navLabel: 'Review plan',
    heading: 'Review your plan, and make any changes',
    subtitle:
      "Check each week below. You can edit any date or time that needs to change before confirming, nothing is saved until you do.",
  },
]

const RAIL_STEPS: WizardRailStep[] = STEPS.map((s) => ({
  key: s.key,
  navLabel: s.navLabel,
  heading: s.heading,
}))

const STEP_COUNT = STEPS.length
const REVIEW_STEP = STEP_COUNT - 1

/** The welcome screen's preview of the three steps.
 *
 *  `name` must stay in sync with the matching `STEPS` entry's `navLabel` — the
 *  coach sees this, then sees the rail, and they should read as the same three
 *  steps. Each name says what the coach is deciding (a day, a day and time)
 *  rather than naming the underlying field.
 *
 *  `tone` matches the step's own topic colour; Review has no topic, so it is
 *  neutral. */
const INTRO_STEPS: {
  icon: typeof CalendarDays
  name: string
  description: string
  tone: 'green' | 'amber' | 'neutral'
}[] = [
  {
    icon: CalendarDays,
    name: 'Module unlock day',
    description: 'Decide when the consumer prefers their module to unlock.',
    tone: 'green',
  },
  {
    icon: Clock,
    name: 'Catch-up timing',
    description: "Decide when you'll meet to catch up afterward.",
    tone: 'amber',
  },
  {
    icon: ListChecks,
    name: 'Review plan',
    description: 'Check every week, then confirm.',
    tone: 'neutral',
  },
]

/** ⚠️ Fake delay. Nothing async happens in either interstitial — this is
 *  purely so a screen swap reads as progress rather than a jump. Replace both
 *  timers with the real request when a backend exists. */
const LOADING_MS = 700

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/** The one class pair per topic. Every topic-tinted card in the session-planning
 *  UI uses it — this file's question cards and review mini-cards, and
 *  `EditSessionPlanModal`'s timeline. Three different opacity recipes were
 *  doing this job before it was unified, which defeated the point of having a
 *  colour system. Add tints here, not at a call site. */
export const TOPIC_CARD_CLASS: Record<'module' | 'catchup', string> = {
  module: 'border-plan-module/40 bg-plan-module/15',
  catchup: 'border-plan-catchup/40 bg-plan-catchup/15',
}

function LoadingPane({
  label,
  headingRef,
}: {
  label: string
  headingRef: React.RefObject<HTMLParagraphElement | null>
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
      <Loader2 aria-hidden="true" className="size-8 animate-spin text-primary" />
      <p ref={headingRef} tabIndex={-1} className="text-caption font-semibold text-ink-faint outline-none">
        {label}
      </p>
    </div>
  )
}

/** A calendar-style row of weekday tiles, in place of a `<select>`. Working
 *  days only — module unlocks and catch-ups never fall on a weekend, so
 *  `DAY_OF_WEEK_OPTIONS` is Mon-Fri and this row is 5 tiles wide.
 *
 *  ⚠️ IT IS A TOGGLE-BUTTON GROUP (`role="group"` + `aria-pressed`), NOT A
 *  RADIO GROUP. An earlier build used `role="radiogroup"`/`"radio"` with every
 *  tile `tabIndex=0`, which claims radio semantics without the roving-tabindex
 *  and arrow-key navigation the ARIA radio pattern requires. Do not "upgrade"
 *  these roles unless you also implement that contract; the toggle-button
 *  pattern carries no such requirement and is correct for five
 *  mutually-exclusive buttons.
 *
 *  ⚠️ Blocked tiles use `aria-disabled`, not native `disabled`, so they stay
 *  in the tab order and a screen reader can hear *why* — the reason is in
 *  `aria-label`. This is the app's "visible but inert" convention.
 *
 *  The blocked marker is a diagonal cross rather than a darker fill: a fill
 *  dark enough to read as clearly blocked would also erode the tile label's
 *  own contrast, since both draw from the same grey. `preserveAspectRatio=
 *  "none"` makes the cross reach all four corners at any tile aspect ratio.
 *
 *  `tone` colours the whole step consistently rather than coding a field.
 *  Selected tiles pair their fill with dark `text-ink`, never white — both
 *  accent tokens are too light for white text to clear AA. */
function WeekdayPicker({
  value,
  onChange,
  disabledValues = [],
  idPrefix,
  groupLabel,
  tone,
}: {
  value: number | null
  onChange: (value: number) => void
  disabledValues?: number[]
  idPrefix: string
  groupLabel: string
  tone: 'green' | 'amber'
}) {
  // ⚠️ Each tone spells out its full class list rather than composing one from
  // a shared `accent` variable. Tailwind's build-time scanner only sees
  // literal strings, so an interpolated `border-${accent}` generates no CSS at
  // all and the tile silently renders unstyled.
  const selectedClass =
    tone === 'green' ? 'border-plan-module bg-plan-module text-ink' : 'border-plan-catchup bg-plan-catchup text-ink'
  const hoverClass = tone === 'green' ? 'hover:border-plan-module/60' : 'hover:border-plan-catchup/60'
  // ⚠️ `text-ink-muted`, not `ink-faint`. This tile's `/10` wash composites on
  // top of the enclosing question card's own `/15` wash, producing a stronger
  // tint than either was calibrated against — with faint text that measures
  // 4.516:1, effectively on the AA floor. Composite before measuring contrast
  // on a translucent fill; the authored token is not what gets painted. The
  // "disabled" read comes from the diagonal cross, not the text colour, so
  // darkening the text costs nothing.
  const disabledClass =
    tone === 'green'
      ? 'cursor-not-allowed border-plan-module/20 bg-plan-module/10 text-ink-muted'
      : 'cursor-not-allowed border-plan-catchup/20 bg-plan-catchup/10 text-ink-muted'
  return (
    <div role="group" aria-label={groupLabel} className="grid grid-cols-5 gap-2">
      {DAY_OF_WEEK_OPTIONS.map((o) => {
        const disabled = disabledValues.includes(o.value)
        const selected = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            // No `htmlFor` or test selector reads this today. Kept as a
            // test-selector hook and because it documents each tile's
            // identity.
            id={`${idPrefix}-${o.value}`}
            aria-pressed={selected}
            aria-disabled={disabled || undefined}
            aria-label={disabled ? `${o.label}, not available yet` : o.label}
            onClick={() => !disabled && onChange(o.value)}
            className={cn(
              'relative flex h-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-sm border text-caption-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring',
              !disabled && (selected ? selectedClass : cn('border-hairline bg-card text-ink active:scale-[0.97]', hoverClass)),
              disabled && disabledClass,
            )}
          >
            <span aria-hidden="true">{o.short}</span>
            {disabled && (
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full text-ink-faint/35"
              >
                <line x1="8" y1="8" x2="92" y2="92" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="92" y1="8" x2="8" y2="92" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function PlanSessionsModal({
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
  const { sessionCompletion, bulkSetSessionPlan, toggleSession } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []

  const [step, setStep] = useState(0)
  // ⚠️ `null`, not a default weekday. These gate the footer's Next button, so
  // a pre-selected day would let a coach click straight through both questions
  // without ever choosing anything — and the plan would then be built from an
  // answer nobody gave.
  const [moduleWeekday, setModuleWeekday] = useState<number | null>(null)
  const [catchupWeekday, setCatchupWeekday] = useState<number | null>(null)
  const [catchupTime, setCatchupTime] = useState('10:00')
  const [rows, setRows] = useState<SessionPlanRow[]>([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  // A one-time welcome screen ahead of the 3 real steps.
  const [showIntro, setShowIntro] = useState(true)
  // Drives the live region that announces the stale-catch-up-day auto-clear
  // below. Cleared again the moment the coach picks a new day.
  const [catchupDayClearedNotice, setCatchupDayClearedNotice] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const generateTimeoutRef = useRef<number | undefined>(undefined)
  const saveTimeoutRef = useRef<number | undefined>(undefined)
  // ⚠️ Three focus targets, one per transition that unmounts its own trigger:
  // leaving the intro, changing step, and entering or leaving a loading state.
  // Without them focus lands on `<body>` while the dialog is still open on top
  // of it. Each heading is `tabIndex={-1}` so it can receive redirected focus
  // without becoming a stop in normal Tab order. See the three effects below.
  const introHeadingRef = useRef<HTMLHeadingElement>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const loadingHeadingRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus({ preventScroll: true })
      setGenerating(false)
      setSaving(false)
      setShowIntro(true)
      setCatchupDayClearedNotice(false)
      setRows([])
      setModuleWeekday(null)
      setCatchupWeekday(null)
      setCatchupTime('10:00')
      setStep(0)
    } else if (triggerRef.current) {
      triggerRef.current.focus({ preventScroll: true })
      triggerRef.current = null
    }
    // reset/seed logic only depends on the dialog opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(
    () => () => {
      window.clearTimeout(generateTimeoutRef.current)
      window.clearTimeout(saveTimeoutRef.current)
    },
    [],
  )

  const busy = generating || saving

  // The three focus redirects. Each fires on the transition that unmounts the
  // control the user was on — see the ⚠️ note by the refs above.
  useEffect(() => {
    if (busy) requestAnimationFrame(() => loadingHeadingRef.current?.focus())
  }, [busy])

  useEffect(() => {
    if (open && showIntro && !busy) requestAnimationFrame(() => introHeadingRef.current?.focus())
  }, [open, showIntro, busy])

  useEffect(() => {
    if (open && !busy && !showIntro) requestAnimationFrame(() => stepHeadingRef.current?.focus())
  }, [open, busy, showIntro, step])

  // ⚠️ Escape is suppressed while busy; Tab is NOT. An early return on `busy`
  // switches the focus trap off entirely for exactly the stretch a user is
  // most likely to be pressing keys, and Tab then escapes to the page behind
  // the open dialog. Keep the two conditions separate.
  const trapKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (busy) return
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([aria-disabled="true"]), a[href], select:not([disabled]), input:not([disabled])',
      ),
    ]
    // While busy the whole footer is unmounted, so there is nothing to cycle
    // between. Pin focus where it is (the loading pane's heading) rather than
    // letting Tab fall through to the page behind the dialog.
    if (focusables.length === 0) {
      e.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // A catch-up on or before the module's own day in the same week would mean
  // the consumer has not had the module yet, so those days are blocked.
  //
  // ⚠️ The `>= lastWorkdayOrdinal` escape hatch is required, not an
  // optimisation: if the module day is the last working day of the week the
  // plain rule blocks every remaining day and the step becomes impossible to
  // complete. In that case every choice necessarily falls in the following
  // week anyway (`nextWeekday(..., strictlyAfter: true)` wraps correctly), so
  // nothing needs blocking at all.
  const lastWorkdayOrdinal = Math.max(...DAY_OF_WEEK_OPTIONS.map((o) => mondayFirstOrdinal(o.value)))
  const disabledCatchupDays =
    moduleWeekday === null || mondayFirstOrdinal(moduleWeekday) >= lastWorkdayOrdinal
      ? []
      : DAY_OF_WEEK_OPTIONS.filter(
          (o) => mondayFirstOrdinal(o.value) <= mondayFirstOrdinal(moduleWeekday),
        ).map((o) => o.value)

  // Going "Back" and changing the module day can invalidate a catch-up day
  // already picked on the next step. Clear it rather than leave a blocked day
  // selected underneath its own "not available" mark — and set the notice, so
  // the silent reset is announced.
  useEffect(() => {
    if (catchupWeekday !== null && disabledCatchupDays.includes(catchupWeekday)) {
      setCatchupWeekday(null)
      setCatchupDayClearedNotice(true)
    }
    // Keyed on the module day only: `disabledCatchupDays` is a pure function
    // of it and gets a fresh array identity every render, so listing it would
    // re-run this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleWeekday])

  const runGenerate = () => {
    if (moduleWeekday === null || catchupWeekday === null) return
    setGenerating(true)
    generateTimeoutRef.current = window.setTimeout(() => {
      // ⚠️ Always anchor a freshly generated plan to `TODAY`. A persisted
      // anchor date was used here once, seeded from the *original* plan's
      // first session, which meant every regeneration silently re-anchored
      // to whenever the very first plan was created no matter how many times
      // the coach re-planned.
      setRows(generatePlanRows(TODAY, moduleWeekday, catchupWeekday, catchupTime))
      setStep(REVIEW_STEP)
      setGenerating(false)
    }, LOADING_MS)
  }

  const goNext = () => {
    if (step === 0) {
      if (moduleWeekday === null) return
      setStep(1)
      return
    }
    if (step === 1) {
      if (catchupWeekday === null) return
      // Overwrites the whole draft. Safe only because this component runs
      // before any plan exists; `EditSessionPlanModal` amends live plans.
      runGenerate()
    }
  }

  // One generic row setter. Do not add per-field variants — three
  // near-identical map-and-replace copies existed here before this.
  const patchRow = (session: number, patch: Partial<SessionPlanRow>) => {
    setRows((prev) => prev.map((r) => (r.session === session ? { ...r, ...patch } : r)))
  }

  // Within a week: the module must unlock strictly before its own catch-up —
  // the consumer has to finish it before the coach reviews it. Both dates are
  // editable on the review step, so this cannot be assumed true by
  // construction the way it is when a plan is first generated.
  const rowDateInvalid = (row: SessionPlanRow) =>
    !!row.moduleTargetDate && !!row.date && row.moduleTargetDate >= row.date

  // Across weeks: completing a catch-up is what unlocks the *next* week's
  // module, so a catch-up dated after that module is backwards. The same class
  // of error as `rowDateInvalid` one week over, and it needs its own check —
  // neither catches the other's case.
  const crossWeekInvalid = (sessionNumber: number) => {
    const row = rows.find((r) => r.session === sessionNumber)
    const nextRow = rows.find((r) => r.session === sessionNumber + 1)
    return !!row?.date && !!nextRow?.moduleTargetDate && row.date > nextRow.moduleTargetDate
  }

  const rowsIncomplete =
    rows.length === 0 ||
    rows.some(
      (r) =>
        r.session >= 2 &&
        (!r.time || !r.date || !r.moduleTargetDate || rowDateInvalid(r) || crossWeekInvalid(r.session)),
    )

  // The next upcoming, not-yet-completed dated row. Mirrors
  // `nextPlannedSession()` in `data/spaces.ts` but reads this modal's local
  // draft, which is not a committed `SessionPlan` and carries no
  // `adHocMeetings`. Keep the two definitions in step.
  const nextRow = rows
    .filter((r) => r.session >= 2 && !!r.date && !completed.some((c) => c.session === r.session))
    .sort((a, b) => a.session - b.session)[0]

  const handleSubmit = () => {
    if (rowsIncomplete || saving) return
    setSaving(true)
    saveTimeoutRef.current = window.setTimeout(() => {
      bulkSetSessionPlan(dyad.id, rows)
      // Internal session 1 is the planning meeting that produces this plan, so
      // by the time the wizard is confirmed it has happened. No table shows it
      // as a row, so this is the only place it can be marked complete. The
      // guard is belt-and-braces: no path completes it before a plan exists.
      if (!completed.some((c) => c.session === 1)) {
        toggleSession(dyad.id, 1)
      }
      setSaving(false)
      onClose()
      onSaved?.()
    }, LOADING_MS)
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
              onClick={busy ? undefined : onClose}
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
                className="pointer-events-auto flex h-[85vh] max-h-[820px] w-full max-w-[920px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline md:p-8"
              >
                {/* ⚠️ Always mounted, deliberately. The visible `LoadingPane`
                    remounts fresh each time `busy` flips, and several
                    screen-reader/browser combinations announce a live region
                    unreliably when it is a brand-new node rather than an
                    existing one whose text changed. Do not move this inside
                    the conditional branch. */}
                <p aria-live="polite" role="status" className="sr-only">
                  {busy ? (generating ? 'Building your session plan…' : 'Creating your session plan…') : ''}
                </p>
                {/* Announces the stale-catch-up-day auto-clear above. Without
                    it, going Back and changing the module day resets an
                    already-picked catch-up day with no notice at all. */}
                <p aria-live="polite" role="status" className="sr-only">
                  {catchupDayClearedNotice
                    ? "Your previous catch-up day was cleared because it's no longer available."
                    : ''}
                </p>

                {!showIntro && (
                  <h2 id={titleId} className="shrink-0 font-display text-title text-ink">
                    Plan sessions
                  </h2>
                )}

                {busy ? (
                  <div className="flex flex-1 items-center justify-center">
                    <LoadingPane
                      headingRef={loadingHeadingRef}
                      label={generating ? 'Building your session plan…' : 'Creating your session plan…'}
                    />
                  </div>
                ) : showIntro ? (
                  <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-2 text-center">
                    <div className="w-full max-w-xl">
                      <h2
                        id={titleId}
                        ref={introHeadingRef}
                        tabIndex={-1}
                        className="text-balance text-display-md font-display text-ink outline-none"
                      >
                        Welcome! Let's plan your consumer's sessions
                      </h2>
                      <p className="mt-3 text-caption text-ink-faint">
                        You'll decide when each module unlocks and when you'll catch up
                        afterward, then review the plan before saving. Zoom sessions are
                        created automatically.
                      </p>
                      <ol className="mt-14 flex items-start">
                        {INTRO_STEPS.map((s, i, arr) => {
                          const first = i === 0
                          const last = i === arr.length - 1
                          const Icon = s.icon
                          const badgeClass =
                            s.tone === 'green'
                              ? 'bg-plan-module/25 text-green-700'
                              : s.tone === 'amber'
                                ? 'bg-plan-catchup/30 text-amber-700'
                                : 'bg-ink-faint/10 text-ink-muted'
                          return (
                            <li key={s.name} className="flex flex-1 flex-col items-center">
                              <div className="flex w-full items-center">
                                <span
                                  aria-hidden="true"
                                  className={cn('h-px flex-1', first ? 'bg-transparent' : 'bg-ink-faint/25')}
                                />
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'flex size-14 shrink-0 items-center justify-center rounded-full',
                                    badgeClass,
                                  )}
                                >
                                  <Icon className="size-7" />
                                </span>
                                <span
                                  aria-hidden="true"
                                  className={cn('h-px flex-1', last ? 'bg-transparent' : 'bg-ink-faint/25')}
                                />
                              </div>
                              <p className="mt-6 text-fine font-semibold text-ink-faint">Step {i + 1}</p>
                              <p className="mt-0.5 text-caption font-semibold text-ink">{s.name}</p>
                              <p className="mt-0.5 max-w-[160px] text-fine text-ink-faint">{s.description}</p>
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  </div>
                ) : (
                <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[3fr_7fr] md:gap-8">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-4 md:p-6">
                    <WizardProgressRail
                      steps={RAIL_STEPS}
                      current={step}
                      ariaLabel="Plan sessions progress"
                    />
                  </div>

                  <div className="flex min-h-0 flex-col overflow-y-auto pr-1">
                        <WizardStepHeading
                          step={step}
                          stepCount={STEP_COUNT}
                          heading={STEPS[step].heading}
                          subtitle={STEPS[step].subtitle}
                          headingRef={stepHeadingRef}
                        />

                        {step === 0 && (
                          <div className={cn(STEP_CONTENT_GAP, 'rounded-lg border p-6', TOPIC_CARD_CLASS.module)}>
                            <div className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-plan-module/25"
                              >
                                <CalendarDays className="size-4 text-green-700" />
                              </span>
                              <p className="text-caption font-semibold text-ink">
                                Select the day of the week you'd like each module to unlock
                              </p>
                            </div>
                            <div className="mt-4">
                              <WeekdayPicker
                                value={moduleWeekday}
                                onChange={setModuleWeekday}
                                idPrefix="plan-module-day"
                                groupLabel="Day of the week"
                                tone="green"
                              />
                            </div>
                            <p className="mt-5 text-caption text-ink-muted">
                              {moduleWeekday !== null ? (
                                <>
                                  You picked{' '}
                                  {DAY_OF_WEEK_OPTIONS.find((o) => o.value === moduleWeekday)?.label}. Every module
                                  will become available on a{' '}
                                  {DAY_OF_WEEK_OPTIONS.find((o) => o.value === moduleWeekday)?.label} each week.
                                </>
                              ) : (
                                "Every module will unlock on this day each week, once that week's catch-up is done."
                              )}
                            </p>
                          </div>
                        )}

                        {step === 1 && (
                          <div className={cn(STEP_CONTENT_GAP, 'flex flex-col gap-4')}>
                            <div className={cn('rounded-lg border p-6', TOPIC_CARD_CLASS.catchup)}>
                              <div className="flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-plan-catchup/30"
                                >
                                  <CalendarDays className="size-4 text-amber-700" />
                                </span>
                                <p className="text-caption font-semibold text-ink">
                                  First, select the day of the week you'd like to catch up
                                </p>
                              </div>
                              <div className="mt-4">
                                <WeekdayPicker
                                  value={catchupWeekday}
                                  onChange={(v) => {
                                    setCatchupWeekday(v)
                                    setCatchupDayClearedNotice(false)
                                  }}
                                  disabledValues={disabledCatchupDays}
                                  idPrefix="plan-catchup-day"
                                  groupLabel="Select the day of the week you'd like to catch up"
                                  tone="amber"
                                />
                              </div>
                            </div>
                            <div className={cn('rounded-lg border p-6', TOPIC_CARD_CLASS.catchup)}>
                              <div className="flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-plan-catchup/30"
                                >
                                  <Clock className="size-4 text-amber-700" />
                                </span>
                                <label htmlFor="plan-catchup-time" className="text-caption font-semibold text-ink">
                                  Next, select what time works for you both
                                </label>
                              </div>
                              {catchupWeekday === null && (
                                <p className="mt-1 text-fine text-ink-faint">Select a day above first.</p>
                              )}
                              <div
                                className={cn(
                                  // ⚠️ Both heights here are explicit for a reason. A bare
                                  // `<input type="time">` has an intrinsic height of ~25px, so
                                  // padding the wrapper instead leaves ~13px of dead space above
                                  // and below that looks tappable and is not. `align-items:
                                  // stretch` does not close it — the icon opts out via
                                  // `self-center`, so the flex line is only as tall as the input
                                  // already is. Give the wrapper `h-11` and the input the app's
                                  // own `h-9` control height rather than reaching for padding.
                                  //
                                  // `rounded-sm` matches every other input-shaped control in the
                                  // app; do not give this one its own radius.
                                  'mt-4 flex h-11 w-full max-w-64 items-center gap-2 rounded-sm border px-3 transition-colors',
                                  catchupWeekday === null
                                    ? 'cursor-not-allowed border-hairline bg-card/60'
                                    : 'border-plan-catchup bg-card focus-within:border-plan-catchup focus-within:ring-2 focus-within:ring-plan-catchup/30',
                                )}
                              >
                                <Clock
                                  aria-hidden="true"
                                  className={cn(
                                    'size-5 shrink-0',
                                    catchupWeekday === null ? 'text-ink-faint' : 'text-amber-700',
                                  )}
                                />
                                <input
                                  id="plan-catchup-time"
                                  type="time"
                                  value={catchupTime}
                                  onChange={(e) => setCatchupTime(e.target.value)}
                                  disabled={catchupWeekday === null}
                                  className={cn(
                                    'h-9 w-full border-none bg-transparent text-body font-semibold outline-none disabled:cursor-not-allowed',
                                    catchupWeekday === null ? 'text-ink-faint' : 'text-ink',
                                  )}
                                />
                              </div>
                              {catchupWeekday !== null && catchupTime && (
                                <p className="mt-3 text-caption text-ink-muted">
                                  You and your consumer will catch up every{' '}
                                  {DAY_OF_WEEK_OPTIONS.find((o) => o.value === catchupWeekday)?.label} at{' '}
                                  {formatTime(catchupTime)}.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {step === REVIEW_STEP && (
                          <ol className={cn(STEP_CONTENT_GAP, 'flex flex-col')}>
                            {SPACES_SESSIONS.filter((s) => s.number >= 2).map((s, i, arr) => {
                              const row = rows.find((r) => r.session === s.number) ?? { session: s.number }
                              const week = displaySessionNumber(s.number)
                              const last = i === arr.length - 1
                              const isNext = nextRow?.session === s.number
                              return (
                                <li key={s.number} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        'flex size-7 shrink-0 items-center justify-center rounded-full text-caption-medium',
                                        isNext
                                          ? 'bg-primary text-white'
                                          : 'border border-ink-faint bg-card text-ink-muted',
                                      )}
                                    >
                                      {week}
                                    </span>
                                    {!last && (
                                      <span
                                        aria-hidden="true"
                                        className={cn(
                                          'my-1 w-px flex-1',
                                          // ⚠️ `/80`, not a lighter alpha. Lighter values measure under
                                          // 2:1 against this row's white background, short of WCAG
                                          // 1.4.11's 3:1 floor for a UI boundary; `/80` measures
                                          // ~3.4-3.56:1. The marker border above is solid for the same
                                          // reason.
                                          completed.some((c) => c.session === s.number) ? 'bg-success/80' : 'bg-ink-faint/80',
                                        )}
                                      />
                                    )}
                                  </div>
                                  <div className={cn('min-w-0 flex-1', !last && 'pb-8')}>
                                    <p className="flex items-center gap-2 text-caption font-semibold text-ink">
                                      Week {week}
                                      {isNext && <Chip tone="next" label="Next" />}
                                      {row.rescheduled && <Chip tone="muted" label="Rescheduled" />}
                                    </p>
                                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                      <div className={cn('h-full rounded-lg border p-4', TOPIC_CARD_CLASS.module)}>
                                        <p className="text-fine font-semibold text-green-700">Module {week} unlocks</p>
                                        <label
                                          className="mt-3 block text-fine font-semibold text-ink"
                                          htmlFor={`plan-row-module-date-${s.number}`}
                                        >
                                          {/* ⚠️ Every one of the 18 inputs on this step needs a label
                                              naming its week AND which date it sets. A shared "On:"
                                              gives a screen-reader user 18 identically-named fields
                                              with no way to tell them apart. */}
                                          Module {week} unlocks on:
                                        </label>
                                        <div className="mt-1">
                                          <input
                                            id={`plan-row-module-date-${s.number}`}
                                            type="date"
                                            value={row.moduleTargetDate ?? ''}
                                            onChange={(e) => patchRow(s.number, { moduleTargetDate: e.target.value })}
                                            className={cn(inputClass, 'text-body font-semibold text-ink')}
                                          />
                                        </div>
                                      </div>
                                      <div className={cn('h-full rounded-lg border p-4', TOPIC_CARD_CLASS.catchup)}>
                                        <p className="text-fine font-semibold text-amber-700">
                                          Session {week} catch-up
                                        </p>
                                        <label
                                          className="mt-3 block text-fine font-semibold text-ink"
                                          htmlFor={`plan-row-date-${s.number}`}
                                        >
                                          Session {week} catch-up on:
                                        </label>
                                        <div className="mt-1">
                                          <input
                                            id={`plan-row-date-${s.number}`}
                                            type="date"
                                            value={row.date ?? ''}
                                            onChange={(e) => patchRow(s.number, { date: e.target.value })}
                                            className={cn(inputClass, 'text-body font-semibold text-ink')}
                                          />
                                        </div>
                                        <label
                                          className="mt-4 block text-fine font-semibold text-ink"
                                          htmlFor={`plan-row-time-${s.number}`}
                                        >
                                          Session {week} catch-up at:
                                        </label>
                                        <div className="mt-1">
                                          <input
                                            id={`plan-row-time-${s.number}`}
                                            type="time"
                                            value={row.time ?? ''}
                                            onChange={(e) => patchRow(s.number, { time: e.target.value })}
                                            className={cn(inputClass, 'text-body font-semibold text-ink')}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    {rowDateInvalid(row) && (
                                      <div
                                        role="alert"
                                        className="mt-2 flex items-center gap-1.5 rounded-sm bg-destructive/5 px-2 py-1"
                                      >
                                        <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0 text-destructive" />
                                        <p className="text-fine font-semibold text-destructive">
                                          Module {week} should unlock before the Session {week} catch-up.
                                        </p>
                                      </div>
                                    )}
                                    {crossWeekInvalid(s.number) && (
                                      <div
                                        role="alert"
                                        className="mt-2 flex items-center gap-1.5 rounded-sm bg-destructive/5 px-2 py-1"
                                      >
                                        <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0 text-destructive" />
                                        <p className="text-fine font-semibold text-destructive">
                                          Session {week} catch-up should happen before Module {week + 1} unlocks.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </li>
                              )
                            })}
                          </ol>
                        )}
                  </div>
                </div>
                )}

                {!busy && (
                <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-ink-muted outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-3">
                    {showIntro ? (
                      <button
                        type="button"
                        onClick={() => setShowIntro(false)}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                      >
                        Get started
                      </button>
                    ) : (
                      <>
                        {step > 0 && (
                          <button
                            type="button"
                            onClick={() => setStep((s) => Math.max(0, s - 1))}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                          >
                            Back
                          </button>
                        )}
                        {step < REVIEW_STEP ? (
                          <button
                            type="button"
                            onClick={goNext}
                            disabled={step === 0 ? moduleWeekday === null : catchupWeekday === null}
                            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {step === 1 ? 'Build my plan' : 'Next'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={rowsIncomplete}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-divider-soft disabled:text-ink-faint disabled:hover:bg-divider-soft"
                          >
                            Create my session plan
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
  )
}
