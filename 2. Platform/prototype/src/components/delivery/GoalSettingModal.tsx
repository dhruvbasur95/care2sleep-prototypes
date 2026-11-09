import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Eye, MonitorUp, Users } from 'lucide-react'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { GHOST_BUTTON_MUTED, PILL_OUTLINE, PILL_PRIMARY } from '@/components/shared/buttonStyles'
import { ReflectionReviewTable } from '@/components/shared/ReflectionReviewTable'
import { ReflectionStepBar, ReflectionStepStatus } from '@/components/shared/ReflectionStepBar'
import { WizardWelcomeSteps } from '@/components/shared/WizardWelcomeSteps'
import { ThanksMascot } from '@/components/shared/ThanksMascot'
import {
  GOAL_THANKS_HEADING,
  GOAL_WELCOME_BLURB,
  GOAL_WELCOME_STEPS,
  goalThanksBody,
  goalKey,
  goalReviewRows,
  goalQuestionsFor,
  goalWelcomeHeading,
  saveGoalDraft,
  saveGoals,
  useGoalSetting,
} from '@/data/goalSetting'
import { useScrollLock } from '@/lib/useScrollLock'
import { cn } from '@/lib/utils'

/**
 * Goal setting — worked through by the coach and client together on a shared
 * screen during the session (direct instruction, 2026-11-09).
 *
 * **The reflection wizard's chassis, reused** (same instruction: *"re-use the
 * reflection style UI i.e. numbered timeline on top, followed by question and
 * freetext box"*). The panel, the footer surface, the step bar, the welcome row
 * and the review table are all `AddAnnotationSummaryModal`'s; what differs is
 * the flow, and every difference is the brief's:
 *
 *  - **"Finish later", not Cancel** (label: /design:ux-copy pass,
 *    2026-11-09 — "Minimise" was window jargon). A coach steps out of this mid-call to look at
 *    something else and comes straight back, so leaving keeps everything —
 *    answers *and* the question they were on — with no confirm dialog, because
 *    nothing is lost. Escape and the backdrop minimise too.
 *  - **Every answer is required.** Next is `aria-disabled` on a blank answer
 *    and says why when pressed, rather than going silently dead.
 *  - **A thank-you after Save** (direct instruction, 2026-11-09). The goals
 *    are already written when it shows — the card behind the dialog has turned
 *    green — so closing it from any path counts as saved.
 *
 * Saving goals does **not** complete the session. It unlocks the debrief
 * banner, which still owns the reflection, transcript and completion.
 */

export interface GoalSessionSnapshot {
  /** Internal SPACES session number (1 = Planning). */
  session: number
  /** From `sessionRowLabel()` — never a bare number. */
  label: string
}

const WELCOME_STEP = -1

export function GoalSettingModal({
  open,
  onClose,
  dyadId,
  session,
}: {
  open: boolean
  /** `saved` tells the caller where focus goes: saving swaps the card's CTA
   *  out for the completed state, so the trigger no longer exists. */
  onClose: (opts: { saved: boolean }) => void
  dyadId: string
  session: GoalSessionSnapshot
}) {
  const reduceMotion = useReducedMotion()
  const { drafts } = useGoalSetting()
  const questions = goalQuestionsFor(session.session)
  const reviewStep = questions.length
  const thanksStep = questions.length + 1
  /* Questions plus Review — every screen the coach can be part-way through. */
  const barCount = questions.length + 1

  const [step, setStep] = useState(WELCOME_STEP)
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const [blankAttempt, setBlankAttempt] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const focusedScreen = useRef<string | null>(null)
  const saved = useRef(false)
  const titleId = useId()
  const errorId = useId()

  /* Read through a ref so the open-effect runs on `open` alone — see the same
     pattern in `AddAnnotationSummaryModal`. */
  const draft = drafts[goalKey(dyadId, session.session)]
  const draftRef = useRef(draft)
  draftRef.current = draft

  useScrollLock(open)

  /* The trigger is read **during render**, on the false→true edge of `open`.
     An effect is too late: the incoming heading's callback ref focuses itself
     during commit, before any effect runs, so an effect records the dialog's
     own heading as the "trigger" — measured, Minimise then dropped focus to
     `<body>`. */
  const wasOpen = useRef(false)
  if (open && !wasOpen.current) triggerRef.current = document.activeElement as HTMLElement
  wasOpen.current = open

  useEffect(() => {
    if (open) {
      const d = draftRef.current
      setAnswers(d ? [...d.answers] : questions.map(() => ''))
      setStep(d ? d.step : WELCOME_STEP)
      setBlankAttempt(false)
      focusedScreen.current = null
      saved.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /** Focus the incoming screen's heading on a callback ref, never an effect —
   *  under `AnimatePresence mode="wait"` an effect runs against the outgoing
   *  screen. Keyed so a re-render mid-typing does not steal focus back. */
  const headingRef = useCallback(
    (node: HTMLHeadingElement | null) => {
      const key = String(step)
      if (!node || focusedScreen.current === key) return
      focusedScreen.current = key
      node.focus({ preventScroll: true })
    },
    [step],
  )

  const minimise = () => {
    /* On the thank-you the goals are already saved — every close is the
       saved close, which is what moves focus to the now-green card. */
    if (saved.current) {
      onClose({ saved: true })
      triggerRef.current = null
      return
    }
    saveGoalDraft(dyadId, session.session, { answers, step })
    onClose({ saved: false })
    if (triggerRef.current) triggerRef.current.focus({ preventScroll: true })
    triggerRef.current = null
  }

  const handleSave = () => {
    if (saved.current || answers.some((a) => !a.trim())) return
    saved.current = true
    saveGoals(dyadId, session.session, answers)
    go(thanksStep)
  }

  const trapKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      minimise()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled])',
      ),
    ]
    if (focusables.length === 0) return
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

  const direction = useRef(1)
  const go = (next: number) => {
    direction.current = next > step ? 1 : -1
    setBlankAttempt(false)
    setStep(next)
  }

  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction.current * 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction.current * -24 },
      }

  const onWelcome = step === WELCOME_STEP
  const onReview = step === reviewStep
  const onThanks = step === thanksStep
  const onQuestion = !onWelcome && !onReview && !onThanks
  const currentBlank = onQuestion && !answers[step]?.trim()

  const statusLabel = onReview
    ? `Step ${barCount} of ${barCount}: review the goals`
    : onQuestion
      ? `Step ${step + 1} of ${barCount}`
      : ''

  const heading = onWelcome
    ? goalWelcomeHeading(session.label)
    : onThanks
      ? GOAL_THANKS_HEADING
      : onReview
      ? 'Review the goals'
      : `Question ${step + 1}`

  const welcomeIcons = [MonitorUp, Users, CheckCircle2, Eye]

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
            onClick={minimise}
            aria-hidden="true"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
              aria-label={heading}
              /* The reflection wizard's panel exactly: one fixed height so Next
                 never moves under the cursor between screens. */
              className="pointer-events-auto flex h-[85vh] max-h-[820px] w-full max-w-[920px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline md:p-8"
            >
              {!onWelcome && !onThanks && (
                <div className="flex shrink-0 flex-col gap-4">
                  <ReflectionStepBar step={step} count={barCount} />
                  <ReflectionStepStatus label={statusLabel} />
                </div>
              )}

              <div
                className={cn(
                  'flex min-h-0 flex-1 flex-col overflow-y-auto pr-1',
                  !onWelcome && !onThanks && 'mt-10',
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={slide.initial}
                    animate={slide.animate}
                    exit={slide.exit}
                    transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.4, 0, 0.2, 1] }}
                    className={cn(
                      'flex flex-col gap-6',
                      /* Review keeps its natural height so the table scrolls
                         inside the panel — see the same note in
                         `AddAnnotationSummaryModal`. */
                      onReview ? 'shrink-0' : 'min-h-0 flex-1',
                      (onWelcome || onThanks) && 'min-h-full justify-center',
                    )}
                  >
                    {onWelcome && (
                      <div className="flex flex-col items-center gap-14 px-2 text-center">
                        <div className="flex w-full min-w-0 flex-col items-center gap-3">
                          <h2
                            id={titleId}
                            ref={headingRef}
                            tabIndex={-1}
                            className="text-balance font-display text-display-md text-ink outline-none"
                          >
                            {goalWelcomeHeading(session.label)}
                          </h2>
                          <p className="max-w-[620px] text-balance text-body leading-[1.5] text-ink-muted">
                            {GOAL_WELCOME_BLURB}
                          </p>
                        </div>
                        <WizardWelcomeSteps
                          steps={GOAL_WELCOME_STEPS.map((s, i) => ({
                            ...s,
                            Icon: welcomeIcons[i],
                          }))}
                        />
                      </div>
                    )}

                    {onQuestion && (
                      /* `justify-center` (direct instruction, 2026-11-09): the
                         question and its box sit in the middle of the panel
                         rather than pinned under the step bar, now that the
                         box is a fixed 160px instead of filling the space. */
                      <div className="flex min-h-0 flex-1 flex-col justify-center">
                        {/* The focus target on each step. Visually hidden: the
                            numbered question below is the visible text, and it
                            is the textarea's label. */}
                        <h2
                          id={titleId}
                          ref={headingRef}
                          tabIndex={-1}
                          className="sr-only outline-none"
                        >
                          Question {step + 1} of {questions.length}
                        </h2>
                        <label
                          htmlFor={`goal-${step}`}
                          className="block text-left font-display text-title text-balance text-ink"
                        >
                          {step + 1}. {questions[step]}
                        </label>
                        <textarea
                          id={`goal-${step}`}
                          key={step}
                          value={answers[step] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v.trim()) setBlankAttempt(false)
                            setAnswers((prev) => prev.map((a, i) => (i === step ? v : a)))
                          }}
                          autoComplete="off"
                          required
                          aria-invalid={blankAttempt || undefined}
                          aria-describedby={blankAttempt ? errorId : undefined}
                          placeholder="Write the answer you agree on together."
                          /* A fixed 192px, not the reflection wizard's
                             fill-the-panel box (direct instruction,
                             2026-11-09: reduce the height, then +20% from
                             160). Answers here are a line or two agreed out
                             loud, not a paragraph. */
                          className={cn(
                            'mt-3 h-48 w-full shrink-0 resize-none rounded-sm border bg-parchment px-4 py-3 text-caption text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring',
                            blankAttempt ? 'border-destructive' : 'border-hairline',
                          )}
                        />
                        {blankAttempt && (
                          <p id={errorId} role="alert" className="mt-2 text-caption text-destructive">
                            Write an answer before you go on. Every question needs one.
                          </p>
                        )}
                      </div>
                    )}

                    {onThanks && (
                      <div className="flex flex-col items-center gap-6 py-6 text-center">
                        <ThanksMascot />
                        <div className="flex flex-col gap-2">
                          <h2
                            id={titleId}
                            ref={headingRef}
                            tabIndex={-1}
                            className="text-balance font-display text-display-md text-ink outline-none"
                          >
                            {GOAL_THANKS_HEADING}
                          </h2>
                          <p className="text-balance text-body leading-[1.4] text-ink-muted">
                            {goalThanksBody(session.label)}
                          </p>
                        </div>
                      </div>
                    )}

                    {onReview && (
                      <>
                        <div className="flex flex-col gap-2">
                          <h2
                            id={titleId}
                            ref={headingRef}
                            tabIndex={-1}
                            className="font-display text-title text-ink outline-none"
                          >
                            Review the goals
                          </h2>
                          <p className="text-body text-ink-muted">
                            Check each answer with your client. Once saved, these goals cannot be
                            changed.
                          </p>
                        </div>
                        <ReflectionReviewTable
                          rows={goalReviewRows(session.session, answers)}
                          onEdit={(i) => go(i)}
                          questionHeading="Question"
                          answerHeading="Client’s answer"
                        />
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div
                className={cn(
                  MODAL_FOOTER_SURFACE,
                  'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3',
                )}
              >
                {onThanks ? (
                  <span />
                ) : (
                  /* "Finish later" (2026-11-09): says the work is kept and
                     matches the card's own "Resume goal setting". Not "Save
                     and close" — beside "Save goals" that reads as done. */
                  <button type="button" onClick={minimise} className={GHOST_BUTTON_MUTED}>
                    Finish later
                  </button>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {!onWelcome && !onThanks && (
                    <button type="button" onClick={() => go(step - 1)} className={PILL_OUTLINE}>
                      Back
                    </button>
                  )}
                  {onThanks ? (
                    <button type="button" onClick={minimise} className={PILL_PRIMARY}>
                      Close
                    </button>
                  ) : onWelcome ? (
                    <button type="button" onClick={() => go(0)} className={PILL_PRIMARY}>
                      Get started
                    </button>
                  ) : onReview ? (
                    <button type="button" onClick={handleSave} className={PILL_PRIMARY}>
                      Save goals
                    </button>
                  ) : (
                    /* `aria-disabled`, never `disabled` — a button that disables
                       while focused drops focus to `<body>` and changes the
                       trap's last element. Pressing it explains itself. */
                    <button
                      type="button"
                      aria-disabled={currentBlank}
                      onClick={() => {
                        if (currentBlank) {
                          setBlankAttempt(true)
                          return
                        }
                        go(step + 1)
                      }}
                      className={cn(
                        PILL_PRIMARY,
                        currentBlank && 'cursor-not-allowed bg-ink-faint hover:bg-ink-faint',
                      )}
                    >
                      Next
                      {currentBlank && <span className="sr-only"> (answer this question first)</span>}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
