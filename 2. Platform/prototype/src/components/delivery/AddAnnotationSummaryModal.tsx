import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  CalendarClock,
  CheckCircle2,
  Image as ImageIcon,
  ListChecks,
  PenLine,
  UploadCloud,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import {
  GHOST_BUTTON_MUTED,
  HELP_BUTTON,
  PILL_OUTLINE,
  PILL_PRIMARY,
} from '@/components/shared/buttonStyles'
import { FileDropzone, type UploadStage } from '@/components/shared/FileDropzone'
import { ReflectionReviewTable, rowsFromAnswers } from '@/components/shared/ReflectionReviewTable'
import { ReflectionStepBar, ReflectionStepStatus } from '@/components/shared/ReflectionStepBar'
import { ThanksMascot } from '@/components/shared/ThanksMascot'
import { SipteaSkillChip } from '@/pages/training-v2/player/blocks/SipteaSkillChip'
import { SIPTEA_INITIALS, SIPTEA_NAMES, type SipteaInitial } from '@/data/siptea'
import {
  COACH_REFLECTION_STEP_COUNT,
  PLANNING_THANKS_BODY,
  PLANNING_THANKS_HEADING,
  PLANNING_TRANSCRIPT_SUBCOPY,
  PLANNING_WELCOME_BLURB,
  PLANNING_WELCOME_HEADING,
  clearCoachReflectionDraft,
  coachDraftKey,
  saveCoachReflectionDraft,
  useCoachReflectionDrafts,
  COACH_SESSION_QUESTIONS,
  COACH_WELCOME_BLURB,
  COACH_WELCOME_STEPS,
  TRANSCRIPT_ACCEPT_LABEL,
  emptyCoachAnswers,
} from '@/data/coachReflections'
import { useScrollLock } from '@/lib/useScrollLock'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { formatDateLong, formatTime } from '@/data/format'
import type { ReflectionComponentAnswer } from '@/data/spaces'

/**
 * The coach's post-session SIPTEA reflection — the gate, six questions, a
 * review, the session transcript, marking the session held, and a thank-you.
 *
 * ## Round 55 rebuilt this onto the trainee wizard's shape
 * Direct instruction, 2026-10-05: *"re-use SIPTEA pop-up component as we used
 * trainee reflection i.e. number progress bar at top, SIPTEA label below,
 * followed by question, and text placeholder to add response"*, plus a welcome
 * screen, a streamlined review, a thank-you, and a new mandatory transcript
 * upload. What changed:
 *
 *  - **Questions** are Notion's own now, one per component instead of Round
 *    39's sentence pairs, and they live in `data/coachReflections.ts`.
 *  - **The vertical `WizardProgressRail` is gone**, replaced by the shared
 *    horizontal `ReflectionStepBar`. The rail still serves the three research
 *    wizards; this was never its only caller.
 *  - **Sharing is mandatory** (Notion: *"all reflections are shared
 *    compulsorily with the researchers"*), so the "Who can read this
 *    reflection?" radio pair is deleted along with the `shared` field it wrote.
 *  - **The transcript is required** and is what gates completion.
 *
 * ## Three things that are load-bearing
 *
 * 1. **Nothing is written until the final button.** Round 39 saved the
 *    reflection on the review screen and completed the session two screens
 *    later. With a mandatory transcript in between, that could produce a
 *    reflection saved against a session with no transcript and no completion —
 *    the state the requirement exists to prevent. One commit, at the end, which
 *    is also what lets every cancel dialog say truthfully that nothing is saved.
 * 2. **The session is a snapshot, taken by the caller.** It used to be read
 *    live off `nextPlannedSession()`. The moment `onConfirm` marks this session
 *    held, that function returns the *next* one — so the thank-you would have
 *    renamed itself mid-flow, and on the last planned session the whole modal
 *    would have unmounted mid-click. See `SessionSnapshot`.
 * 3. **Focus moves on a callback ref, never an effect.** Under
 *    `AnimatePresence mode="wait"` the incoming screen mounts a commit *later*
 *    than the step change, so an effect keyed on the step runs while the
 *    outgoing screen is still the only thing in the tree — it focuses the old
 *    heading or nothing, and every transition lands on `<body>`. This project
 *    has shipped the effect version six times. Before this round the coach
 *    wizard had no per-screen focus at all: clicking a gate option dropped
 *    focus to `<body>` and nobody had measured it.
 */

/**
 * What the caller must freeze before opening this dialog.
 *
 * Passing a live object is the bug in this file's header — the labels would
 * advance under the coach the instant they completed the session.
 */
export interface SessionSnapshot {
  /** Internal SPACES session number (1 = Planning). Never rendered raw. */
  session: number
  /** Display label, e.g. "Session 4". Always from `sessionRowLabel()`. */
  label: string
  date?: string
  time?: string
  /** Marks the session held. The caller's job: completion lives in the session
   *  store, which this wizard otherwise knows nothing about.
   *
   *  On the transcript-only flow the session is **already** held — the plan
   *  was made in it — so the caller uses this to record that the transcript
   *  has been shared instead. Either way it is "the thing that happens on
   *  commit", which is why it is one field rather than two. */
  onConfirm: () => void
  /**
   * The **Planning session's** flow: welcome, upload, thank you. No gate, no
   * questions, no review, no mark-complete, no progress bar.
   *
   * On the snapshot rather than as its own prop because it is frozen with the
   * session it describes — the two can never be read from different moments
   * and disagree about which flow is open.
   */
  transcriptOnly?: boolean
}

/* Step -1 is the welcome; 0-5 are the SIPTEA components; then review,
   transcript, mark-complete, thanks. The welcome sits at -1 rather than
   shifting every other step up by one, so the stepper reads "Step N of 6"
   against question N with no arithmetic in between — the same trick, for the
   same reason, as `TraineeReflectionModal`. */
const WELCOME_STEP = -1
const REVIEW_STEP = COACH_REFLECTION_STEP_COUNT
const TRANSCRIPT_STEP = COACH_REFLECTION_STEP_COUNT + 1
const COMPLETE_STEP = COACH_REFLECTION_STEP_COUNT + 2
const THANKS_STEP = COACH_REFLECTION_STEP_COUNT + 3

/**
 * How many circles the progress bar draws: **every step the coach walks
 * through**, which is the six questions plus Review plus Transcript.
 *
 * Direct instruction, 2026-10-05: *"progress stepper missing from top, also
 * incorrect numbers for this process."* It counted `COACH_REFLECTION_STEP_COUNT`
 * — the six questions — so the bar said "6 of 6, all done" on Review while two
 * screens of real work were still ahead, and vanished entirely on Transcript,
 * which is the step most likely to make a coach wonder how much is left.
 *
 * Derived from `TRANSCRIPT_STEP` rather than written as `8`, so adding a screen
 * to the machine cannot leave the bar describing the old one.
 *
 * Mark-complete and thanks are deliberately **not** circles: the first is a
 * confirmation of work already done and the second is an outcome, and neither
 * is a step you can be part-way through.
 */
const BAR_STEP_COUNT = TRANSCRIPT_STEP + 1

type Screen =
  | { kind: 'welcome' }
  | { kind: 'question'; index: number }
  | { kind: 'review' }
  | { kind: 'transcript' }
  | { kind: 'complete' }
  | { kind: 'thanks' }

function screenFor(step: number): Screen {
  if (step === WELCOME_STEP) return { kind: 'welcome' }
  if (step === REVIEW_STEP) return { kind: 'review' }
  if (step === TRANSCRIPT_STEP) return { kind: 'transcript' }
  if (step === COMPLETE_STEP) return { kind: 'complete' }
  if (step === THANKS_STEP) return { kind: 'thanks' }
  return { kind: 'question', index: step }
}

/** Structured per-component answers for the store — not one flattened string,
 *  so every display surface renders each component as its own row instead of
 *  parsing text back apart. The `"S: Shared understanding"` shape is what every
 *  entry since Round 13 carries; `resolveSipteaInitial` reads it back. */
function buildReflectionComponents(answers: string[]): ReflectionComponentAnswer[] {
  return SIPTEA_INITIALS.map((initial, i) => ({
    label: `${initial}: ${SIPTEA_NAMES[initial]}`,
    answer: answers[i]?.trim() || '(no response recorded)',
  }))
}

/* ── Welcome ────────────────────────────────────────────────────────────── */

/**
 * Shape follows the trainee's welcome, which follows `PlanSessionsModal`'s:
 * heading, one short paragraph, then a row of steps describing the flow.
 *
 * **Four columns at 160px with a 32px gap — not the trainee's 180/48.** The
 * arithmetic, not a guess: this panel is `max-w-[920px]` with `md:p-8`, so the
 * content area is 856px, less the scroller's `pr-1` and this block's `px-2`
 * leaves ~836px. Four columns at the trainee's metrics need 4x180 + 3x48 =
 * **864px** and would be clipped. At 4x160 + 3x32 = **736px** they fit. That is
 * also what `PlanSessionsModal` landed on when its own three-step row became
 * four (2026-10-01) — so three-step rows are 180/48, four-step rows 160/32.
 *
 * The connector inset follows the column width: half of 160 is **80px**, not
 * the trainee's 90. Copying 90 leaves the line 10px short of each end circle,
 * which is invisible in a screenshot.
 *
 * `items-stretch` because the four descriptions are different lengths and a
 * start-aligned row ends at four different heights — also what
 * `layout-audit.js` checks across 3+ sibling tiles.
 *
 * `min-w-0` on the row and its cells is not decoration: fixed columns inside a
 * fixed-width panel otherwise size the track to the widest child and push the
 * document into horizontal scroll (Rounds 21.1, 30, 34).
 */
function WelcomeScreen({
  headingRef,
  sessionLabel,
  /** The Planning session's flow — see `SessionSnapshot.transcriptOnly`. */
  transcriptOnly,
}: {
  headingRef: (el: HTMLHeadingElement | null) => void
  sessionLabel: string
  transcriptOnly: boolean
}) {
  const icons = [PenLine, ListChecks, UploadCloud, CheckCircle2]

  return (
    <div className="flex flex-col items-center gap-14 px-2 text-center">
      <div className="flex w-full min-w-0 flex-col items-center gap-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-balance font-display text-display-md text-ink outline-none"
        >
          {transcriptOnly ? PLANNING_WELCOME_HEADING : `Your reflection for ${sessionLabel}`}
        </h2>
        <p className="max-w-[620px] text-balance text-body leading-[1.5] text-ink-muted">
          {transcriptOnly ? PLANNING_WELCOME_BLURB : COACH_WELCOME_BLURB}
        </p>
      </div>

      {/* **No step row on the transcript-only flow.** The row exists to preview
          a four-screen sequence; previewing a one-action flow with a single
          icon would be ceremony around a file picker, and a four-step row
          would describe work this flow does not ask for. The blurb above is
          the whole orientation it needs. */}
      {!transcriptOnly && (
      <div className="relative isolate">
        {/* Hidden on the stacked layout: a horizontal rule joining four
            vertically stacked steps points at nothing. A 736px row does not fit
            a narrow panel, hence `min-[880px]:` where the trainee's 636px row
            uses `min-[640px]:`. */}
        <span
          aria-hidden="true"
          className="absolute top-[27px] right-[80px] left-[80px] -z-10 hidden h-0.5 bg-hairline min-[880px]:block"
        />
        <ol className="flex min-w-0 flex-col items-center gap-8 min-[880px]:flex-row min-[880px]:items-stretch min-[880px]:justify-center min-[880px]:gap-8">
          {COACH_WELCOME_STEPS.map((s, i) => {
            const Icon = icons[i]
            return (
              <li
                key={s.label}
                className="flex w-full min-w-0 max-w-[280px] flex-col items-center gap-4 min-[880px]:w-[160px] min-[880px]:max-w-none"
              >
                <span
                  aria-hidden="true"
                  className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-purple-50 text-primary"
                >
                  <Icon className="size-6" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-body-md text-ink">{s.label}</p>
                  <p className="text-balance text-caption text-ink-muted">{s.description}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
      )}
    </div>
  )
}

/* ── One question ───────────────────────────────────────────────────────── */

/**
 * Spacing is three deliberate steps rather than one shared `gap`, copied from
 * the trainee's own question screen: 40px under the stepper, 32px under the
 * SIPTEA chip, and **12px** between the question and the box it is asking you
 * to fill. The small gap is the point — the question and the field are one
 * unit, and the large gaps above separate that unit from the chrome.
 *
 * The box fills the panel's remaining height (`flex-1` with a `min-h` floor),
 * so the slack below a one-line question is writing space rather than a hole.
 *
 * **No "Your response" label and no `WizardStepHeading`** (direct instruction,
 * 2026-10-05: *"Remove the Your response copy from above the text box"* and
 * *"Remove step x of x also"*). The chip names the component, the question is
 * the only other text, and the position is carried by the bar above plus its
 * `role="status"` sibling.
 */
function QuestionScreen({
  headingRef,
  initial,
  index,
  value,
  onChange,
}: {
  headingRef: (node: HTMLHeadingElement | null) => void
  initial: SipteaInitial
  index: number
  value: string
  onChange: (value: string) => void
}) {
  const fieldId = `coach-reflection-${index}`
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex justify-center">
        <SipteaSkillChip initial={initial} size="sm" />
      </div>

      {/* The heading is the component name, visually hidden because the chip
          directly above already shows it — but focus has to land on something
          that announces where the coach now is, and the chip is a decorative
          pill. Same pattern as the trainee's. */}
      <h2 ref={headingRef} tabIndex={-1} className="sr-only outline-none">
        {SIPTEA_NAMES[initial]}
      </h2>

      {/* Type and alignment are the trainee wizard's exactly (direct
          instruction, 2026-10-05): `font-display text-title` (20/500), left.
          This was `text-body` centred and `text-balance` — a smaller, centred
          question read as a caption above the box rather than as the thing
          being answered, and the two wizards disagreed about the same object.
          The chip above stays centred; only the question moved.

          The question is also the textarea's **label** now, which is how the
          trainee's screen is built. The `sr-only` "Your answer for …" label
          that used to sit here went with it: two labels for one field meant a
          screen reader heard the component name twice and the question never.
          The `sr-only` heading above still carries the component name on
          focus, so nothing is lost on a step change. */}
      {/* Numbered (direct instruction, 2026-10-05): "1. What did you learn
          today…". The number is `index + 1`, derived from the step the coach
          is on rather than written into the question strings — those are
          Notion's own wording and a hand-typed "1." in each would be this
          app's copy smuggled into the research team's.

          Note the trainee's wizard deliberately has **no** number on its
          question, removed the same week ("remove the numbers, its
          confusing"): there the question sits below a lead-in line and two
          recalled answers, so a number read as labelling the third thing on
          screen. Here it is the only text under the chip. The two are
          different on purpose. */}
      <label
        htmlFor={fieldId}
        className="mt-8 block text-left font-display text-title text-ink"
      >
        {index + 1}. {COACH_SESSION_QUESTIONS[initial]}
      </label>
      <textarea
        id={fieldId}
        key={index}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        placeholder="Write your answer here."
        /* `parchment` (`#f5f5f7`) reads as a writable field against the modal's
           white panel, where `bg-card` made the box disappear into it and left
           only a hairline to say "type here". */
        className="mt-3 min-h-[200px] w-full flex-1 resize-none rounded-sm border border-hairline bg-parchment px-4 py-3 text-caption text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}

/* ── The modal ──────────────────────────────────────────────────────────── */

export function AddAnnotationSummaryModal({
  open,
  onClose,
  dyadId,
  session,
}: {
  open: boolean
  /**
   * Every close path. `completed` tells the page where focus has to go, which
   * it cannot work out for itself: completing the session unmounts the banner
   * whose CTA opened this dialog, so the usual trigger-restore would land on a
   * disconnected node. Measured — this project's most-repeated defect.
   */
  onClose: (opts: { completed: boolean }) => void
  dyadId: string
  session: SessionSnapshot
}) {
  const { submitPostPracticeAnnotation } = useResearch()
  const reduceMotion = useReducedMotion()
  const { drafts } = useCoachReflectionDrafts()

  /**
   * Did the session actually go ahead?
   *
   * Round 39, direct instruction, kept and reconfirmed 2026-10-05 (*"we will
   * still keep the screen that checks if the session happened or not"*). The
   * banner fires off the clock, not off any knowledge that the session
   * happened — so without this the flow asked the coach to reflect on a session
   * that may simply not have taken place, and offered to mark it complete
   * regardless. `null` = not answered yet.
   *
   * It sits **before** the welcome: a precondition for the flow, not a step
   * inside it. A welcome screen for a flow about to be abandoned is wasted.
   */
  const [sessionHappened, setSessionHappened] = useState<boolean | null>(null)
  const [step, setStep] = useState(WELCOME_STEP)
  const [answers, setAnswers] = useState<string[]>(emptyCoachAnswers)
  const [transcript, setTranscript] = useState<File | null>(null)
  const [uploadStage, setUploadStage] = useState<UploadStage>('empty')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const focusedScreen = useRef<string | null>(null)
  /** Guards the commit. `toggleSession` is a **toggle, not a set**, so a second
   *  press would un-complete the session it just completed. Today's immediate
   *  close hides that; a thank-you screen leaves the button alive one more
   *  frame. */
  const committed = useRef(false)
  const titleId = useId()

  /* Read through a ref, not a dependency. The open-effect must run on `open`
     alone — adding the draft to its deps would re-seed `answers` from the
     store on the very first keystroke, because saving a draft emits and this
     component is a subscriber. The ref is written on every render and read
     only at the moment the modal opens. */
  const draft = drafts[coachDraftKey(dyadId, session.session)]
  const draftRef = useRef(draft)
  draftRef.current = draft

  useScrollLock(open)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      setSessionHappened(null)
      setStep(WELCOME_STEP)
      /* Resume where the coach left off. The flow still restarts at the
         welcome screen rather than the question they abandoned: the draft is
         the *answers*, not a cursor, and dropping someone back into question 4
         with no sense of what they had already written is disorienting where
         re-reading six prefilled boxes is not. */
      setAnswers(draftRef.current ? [...draftRef.current] : emptyCoachAnswers())
      setTranscript(null)
      setUploadStage('empty')
      setCancelOpen(false)
      setHelpOpen(false)
      focusedScreen.current = null
      committed.current = false
    }
    // Setters are stable — only `open` should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /* The Planning session's flow. Read off the snapshot so it cannot change
     under an open modal. */
  const transcriptOnly = !!session.transcriptOnly

  const screen = screenFor(step)
  /* No gate on the transcript-only flow: the plan was built *in* the planning
     session, so asking whether it went ahead is asking about a meeting whose
     output the coach has just saved. */
  const onGate = !transcriptOnly && sessionHappened === null
  const rescheduling = sessionHappened === false
  const anyAnswered = answers.some((a) => a.trim().length > 0)

  /**
   * Focus the incoming screen's heading — as a **callback ref**, not an effect.
   * See this file's header. Guarded on a key so it fires once per screen:
   * React re-invokes a callback ref whenever its identity changes, and without
   * the guard a re-render mid-typing would steal focus back to the heading.
   */
  const headingRef = useCallback(
    (node: HTMLHeadingElement | null) => {
      const key = `${sessionHappened}-${step}`
      if (!node || focusedScreen.current === key) return
      focusedScreen.current = key
      node.focus({ preventScroll: true })
    },
    [sessionHappened, step],
  )

  const close = (completed: boolean) => {
    /* Every close path that is not the submit keeps the answers (direct
       instruction, 2026-10-05: match the trainee's cancel, whose answers
       survive). `committed` rather than `completed` is the right test: the
       thanks screen closes with `completed: true` and has already written
       both the reflection and the draft's deletion, and re-saving there would
       resurrect a draft for a session that is finished. */
    if (!committed.current && !transcriptOnly) {
      saveCoachReflectionDraft(dyadId, session.session, answers)
    }
    onClose({ completed })
    /* Restore the trigger only when it still exists. On the completed path the
       banner that owned it has unmounted, and the caller moves focus instead. */
    if (!completed && triggerRef.current) triggerRef.current.focus({ preventScroll: true })
    triggerRef.current = null
  }

  /**
   * Cancel **always** confirms once the flow has started (direct instruction,
   * 2026-10-05: *"make sure to add the missing pop-up modals when I click
   * cancel, we have added these in previous session for trainees"*).
   *
   * Three carve-outs, all of them cases where a confirm would be friction with
   * nothing behind it: the **gate** and the **reschedule** dead end, where the
   * coach has not been asked anything and nothing is in progress, and
   * **thanks**, where everything is already saved.
   */
  const requestCancel = () => {
    if (cancelOpen || helpOpen) return
    if (screen.kind === 'thanks') {
      close(true)
      return
    }
    if (onGate || rescheduling) {
      close(false)
      return
    }
    /* The short flow has nothing to lose until a file is attached — no
       answers exist to be kept or discarded — so confirming would be a
       dialog asking about nothing. */
    if (transcriptOnly && !transcript) {
      close(false)
      return
    }
    setCancelOpen(true)
  }

  const trapKeys = (e: React.KeyboardEvent) => {
    if (cancelOpen || helpOpen) return
    if (e.key === 'Escape') {
      requestCancel()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled]), textarea:not([disabled])',
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

  /**
   * The one commit. Save the reflection, then mark the session held.
   *
   * That order matters: both writes land in different state atoms so neither
   * can clobber the other, but if one were to fail, a reflection written
   * against an incomplete session is recoverable where a session marked held
   * with no reflection is the invariant this flow exists to protect.
   */
  const handleComplete = () => {
    if (committed.current) return
    committed.current = true
    /* Nothing is written for the Planning session: no answers were collected,
       and writing six "(no response recorded)" rows would put a reflection in
       front of the research team that the coach was never asked for — the
       exact thing the short flow exists to avoid. The transcript itself is
       not stored anywhere by design (see `FileDropzone`'s callers), so the
       whole commit here is `onConfirm`. */
    if (!transcriptOnly) {
      submitPostPracticeAnnotation(dyadId, buildReflectionComponents(answers), session.session)
      clearCoachReflectionDraft(dyadId, session.session)
    }
    session.onConfirm()
    setStep(THANKS_STEP)
  }

  /* Direction drives the slide, so going Back reads as going back rather than
     as another forward step. Held in a ref: it is read during the next
     render's animation and must not itself trigger one. */
  const direction = useRef(1)
  const go = (next: number) => {
    direction.current = next > step ? 1 : -1
    setStep(next)
  }

  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction.current * 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction.current * -24 },
      }

  /** The `role="status"` line. Distinct per screen: the bar is `aria-hidden`,
   *  so this is the only announcement of position, and "Review" three times
   *  running would be worse than silence. */
  const statusLabel =
    screen.kind === 'review'
      ? `Step ${REVIEW_STEP + 1} of ${BAR_STEP_COUNT}: review your answers`
      : screen.kind === 'transcript'
        ? `Step ${TRANSCRIPT_STEP + 1} of ${BAR_STEP_COUNT}: upload the session transcript`
        : screen.kind === 'question'
          ? `Step ${screen.index + 1} of ${BAR_STEP_COUNT}`
          : ''

  /* Every step the bar counts, and only those: questions, review, transcript.
     Welcome is before the flow, and mark-complete and thanks are after it —
     see `BAR_STEP_COUNT` for why those two are not circles. */
  const showBar =
    !transcriptOnly &&
    (screen.kind === 'question' || screen.kind === 'review' || screen.kind === 'transcript')

  const heading = onGate
    ? `Did ${session.label} go ahead?`
    : rescheduling
      ? `Reschedule ${session.label}`
      : screen.kind === 'thanks'
        ? transcriptOnly
          ? PLANNING_THANKS_HEADING
          : 'Thank you for sharing your reflection'
        : screen.kind === 'complete'
          ? `Mark ${session.label} as complete?`
          : screen.kind === 'transcript'
            ? 'Upload the session transcript'
            : screen.kind === 'review'
              ? 'Review your answers'
              : transcriptOnly
                ? PLANNING_WELCOME_HEADING
                : `Your reflection for ${session.label}`

  return (
    <>
      {/* AnimatePresence stays mounted regardless of `open`, gating its
          *content* instead — the pattern `ConfirmDialog` and
          `TraineeReflectionModal` both use. Unmounting AnimatePresence across
          opens makes framer-motion lose track of its previous children and
          emit duplicate-key errors on every reopen. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/25"
              onClick={requestCancel}
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
                /* One fixed height for every screen. The screens differ a lot
                   in length, and a panel that resized per step would move the
                   Next button under the coach's cursor on every advance. The
                   content region scrolls instead. */
                className="pointer-events-auto flex h-[85vh] max-h-[820px] w-full max-w-[920px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline md:p-8"
              >
                {onGate ? (
                  /* ── The gate ─────────────────────────────────────────── */
                  <>
                    {/* Centred on both axes (direct instruction). One question
                        and two answers is far less content than the panel's
                        fixed height, and left-aligned at the top it read as a
                        page that had failed to load the rest of itself.
                        `my-auto` rather than `justify-center`: auto margins
                        centre the block while still letting it scroll if the
                        copy ever grows past the space. */}
                    <div className="my-auto flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-6 text-center">
                      <div className="flex w-full flex-col items-center gap-2">
                        <h2
                          id={titleId}
                          ref={headingRef}
                          tabIndex={-1}
                          className="text-balance font-display text-display-md text-ink outline-none"
                        >
                          Did {session.label} go ahead?
                        </h2>
                        {/* `body` regular in `ink` (direct instruction), not
                            `ink-muted`. It carries the one fact the coach needs
                            to answer the question above it, so it is not
                            supporting copy. */}
                        <p className="max-w-[640px] text-body text-ink">
                          {session.date
                            ? `It was planned for ${formatDateLong(session.date)}${
                                session.time ? ` at ${formatTime(session.time)}` : ''
                              }.`
                            : 'Let us start there.'}
                        </p>
                      </div>

                      {/* Side by side, equal width and height (direct
                          instruction). `grid-cols-2` rather than a flex row
                          because equal *width* is the ask and a grid gives it
                          without `flex-1` fighting the content. `min-w-0` on
                          the cells: a grid item defaults to `min-width: auto`,
                          so without it the longer copy sizes its track and the
                          two stop being equal. */}
                      <div className="mt-10 grid w-full max-w-[520px] grid-cols-2 gap-4">
                        {[
                          {
                            value: true,
                            Icon: CheckCircle2,
                            title: 'Yes, it went ahead',
                            body: 'Add your reflection and transcript, then mark the session complete.',
                          },
                          {
                            value: false,
                            Icon: CalendarClock,
                            title: 'No, it did not happen',
                            body: 'The session needs rescheduling before it can be completed.',
                          },
                        ].map((o) => (
                          <button
                            key={String(o.value)}
                            type="button"
                            onClick={() => setSessionHappened(o.value)}
                            /* Purple border, no shadow (direct instruction):
                               these are choices, and a purple outline reads as
                               "pick one" where a shadowed white card read as a
                               surface. */
                            className="flex min-w-0 flex-col items-center gap-4 rounded-sm border border-primary bg-card p-6 text-center outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <span
                              aria-hidden="true"
                              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-purple-50 text-primary"
                            >
                              <o.Icon className="size-6" />
                            </span>
                            <span className="flex flex-col gap-2">
                              <span className="text-body-md text-ink">{o.title}</span>
                              <span className="text-caption text-ink-muted">{o.body}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className={cn(
                        MODAL_FOOTER_SURFACE,
                        'mt-6 flex shrink-0 flex-wrap items-center justify-end gap-3',
                      )}
                    >
                      <button type="button" onClick={requestCancel} className={GHOST_BUTTON_MUTED}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : rescheduling ? (
                  /* ── The dead end ─────────────────────────────────────── */
                  /* Stated plainly. Nothing is saved and nothing is marked —
                     the coach is sent to Reschedule, which lives on the session
                     card behind this dialog. This wizard does not offer to
                     reschedule itself: that would be a second editor for the
                     plan, and the card already owns it. */
                  <>
                    <div className="my-auto flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-2 text-center">
                      <h2
                        id={titleId}
                        ref={headingRef}
                        tabIndex={-1}
                        className="text-balance font-display text-display-md text-ink outline-none"
                      >
                        Reschedule {session.label}
                      </h2>
                      {/* Both reschedule routes are named because both exist
                          (direct instruction) — naming only the card made the
                          plan route invisible. `max-w-[460px]`: centred copy
                          needs a measure, or the lines run the panel's full
                          width and the centring stops reading as deliberate. */}
                      <p className="mt-4 max-w-[460px] text-body text-ink">
                        Nothing has been saved yet. Close this, then pick a new date and time —{' '}
                        <span className="font-semibold">Reschedule</span> on the session card, or{' '}
                        <span className="font-semibold">Edit session plan</span> at the top of the
                        page.
                      </p>
                    </div>

                    <div
                      className={cn(
                        MODAL_FOOTER_SURFACE,
                        'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSessionHappened(null)}
                        className={GHOST_BUTTON_MUTED}
                      >
                        Go back
                      </button>
                      <button type="button" onClick={() => close(false)} className={PILL_PRIMARY}>
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── The flow ─────────────────────────────────────────── */
                  <>
                    {showBar && (
                      <div className="flex shrink-0 flex-col gap-4">
                        {/* `step` passes straight through and lines up with
                            the circles by construction: the question screens
                            are steps 0-5, review is 6 and transcript is 7, so
                            each is its own `current` circle with the ones
                            behind it ticked. */}
                        <ReflectionStepBar step={step} count={BAR_STEP_COUNT} />
                        <ReflectionStepStatus label={statusLabel} />
                      </div>
                    )}

                    {/* `flex flex-col` on the scroller is what lets the
                        question screen's textarea claim the leftover height:
                        without it the child sizes to its content and `flex-1`
                        inside it has nothing to divide. */}
                    <div
                      className={cn(
                        'flex min-h-0 flex-1 flex-col overflow-y-auto pr-1',
                        showBar && 'mt-10',
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
                            /* ⚠️ Review must NOT be `flex-1 min-h-0`. Inside an
                               `overflow-y-auto` parent that pair lets the
                               wrapper shrink to the scroller's own height, so a
                               six-row table is clipped at the panel edge and
                               `scrollHeight` never grows past `clientHeight` —
                               nothing scrolls and the wheel falls through to
                               the page behind. Reported live on the trainee's
                               own review as "cant scroll to review my
                               answers". `shrink-0` keeps its natural height.

                               The question screens still need `flex-1 min-h-0`:
                               that is what lets the textarea claim the panel's
                               remaining height. */
                            screen.kind === 'review' || screen.kind === 'transcript'
                              ? 'shrink-0'
                              : 'min-h-0 flex-1',
                            (screen.kind === 'thanks' ||
                              screen.kind === 'welcome' ||
                              screen.kind === 'complete') &&
                              'min-h-full justify-center',
                          )}
                        >
                          {screen.kind === 'welcome' && (
                            <WelcomeScreen
                              headingRef={headingRef}
                              sessionLabel={session.label}
                              transcriptOnly={transcriptOnly}
                            />
                          )}

                          {screen.kind === 'question' && (
                            <QuestionScreen
                              headingRef={headingRef}
                              initial={SIPTEA_INITIALS[screen.index]}
                              index={screen.index}
                              value={answers[screen.index] ?? ''}
                              onChange={(v) =>
                                setAnswers((prev) =>
                                  prev.map((a, i) => (i === screen.index ? v : a)),
                                )
                              }
                            />
                          )}

                          {screen.kind === 'review' && (
                            <>
                              <div className="flex flex-col gap-2">
                                <h2
                                  id={titleId}
                                  ref={headingRef}
                                  tabIndex={-1}
                                  className="font-display text-title text-ink outline-none"
                                >
                                  Review your answers
                                </h2>
                                {/* Sharing is stated as a fact, not offered as
                                    a choice — the radio pair that used to sit
                                    under this table is gone. */}
                                <p className="text-body text-ink-muted">
                                  Check each answer before you share it with the research team.
                                </p>
                              </div>
                              <ReflectionReviewTable
                                rows={rowsFromAnswers(answers)}
                                onEdit={(i) => go(i)}
                              />
                            </>
                          )}

                          {screen.kind === 'transcript' && (
                            <>
                              {/* `gap-10`, not `gap-4` (direct instruction,
                                  2026-10-05). The text column is `flex-1`, so
                                  the gap is literally all the space there ever
                                  is between the sub copy's longest line and
                                  the button — 16px of it read as the two
                                  touching. */}
                              <div className="flex flex-wrap items-start justify-between gap-10">
                                {/* `basis-[320px]`, not bare `min-w-0`: a flex
                                    item's base size is its content, so the sub
                                    copy's own length was deciding the line and
                                    wrapping the button underneath it — which
                                    is why the control rendered bottom-LEFT
                                    despite `justify-between`. A 320px basis
                                    plus the button's ~220px fits the panel's
                                    796px content box with room over, so they
                                    share a line here and still wrap on a phone
                                    rather than crushing the copy to a word a
                                    line. */}
                                <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-2">
                                  <h2
                                    id={titleId}
                                    ref={headingRef}
                                    tabIndex={-1}
                                    className="font-display text-title text-ink outline-none"
                                  >
                                    Upload the session transcript
                                  </h2>
                                  <p className="text-body text-ink-muted">
                                    {transcriptOnly
                                      ? PLANNING_TRANSCRIPT_SUBCOPY
                                      : `Attach the transcript for ${session.label}. It is shared with the research team alongside your reflection.`}
                                  </p>
                                </div>
                                {/* The home page's Need help control, reused as
                                    a real button (direct instruction: *"re-use
                                    need help button (change this to where to
                                    find scripts?)"*). Its styling is shared
                                    through `HELP_BUTTON`; its behaviour is not
                                    — the home-page instance is deliberately
                                    inert, this one opens a dialog.
                                    Stacking is correct by construction:
                                    `ConfirmDialog` is `z-[70]`/`z-[80]`, this
                                    panel `z-50` over a `z-40` dim. */}
                                <button
                                  type="button"
                                  onClick={() => setHelpOpen(true)}
                                  className={HELP_BUTTON}
                                >
                                  Where to find scripts?
                                </button>
                              </div>
                              {/* `mt-6` on top of the column's own `gap-6`
                                  (direct instruction, 2026-10-05: *"fix
                                  spacing, move the box down"*). The box sat
                                  24px under a two-line sub copy, which read as
                                  jammed against it while the panel's fixed
                                  85vh left a large empty band underneath. 48px
                                  separates the header block from the control
                                  it introduces. */}
                              <div className="mt-6">
                                <FileDropzone
                                  id="coach-session-transcript"
                                  acceptLabel={TRANSCRIPT_ACCEPT_LABEL}
                                  noun="transcript"
                                  file={transcript}
                                  onChange={setTranscript}
                                  onStageChange={setUploadStage}
                                />
                              </div>
                            </>
                          )}

                          {screen.kind === 'complete' && (
                            <div className="flex flex-col items-center gap-14 px-2 text-center">
                              <div className="flex w-full flex-col items-center gap-2">
                                <h2
                                  id={titleId}
                                  ref={headingRef}
                                  tabIndex={-1}
                                  className="text-balance font-display text-display-md text-ink outline-none"
                                >
                                  Mark {session.label} as complete?
                                </h2>
                                <p className="max-w-[640px] text-body text-ink">
                                  This is the last step. Nothing is saved until you confirm.
                                </p>
                              </div>

                              {/* One row, no wrapping, vertical strokes between
                                  the fields (direct instruction). The strokes
                                  are an explicit `border-l` per cell after the
                                  first, not `divide-x` — measured, `divide-x`
                                  computed to 0px here and the separators were
                                  reported invisible twice. `hairline`
                                  (`#e0e0e0`), not `parchment` (`#f5f5f7`):
                                  parchment on a white panel composites to
                                  almost nothing. `items-stretch` so each stroke
                                  runs the row's full height, and
                                  `whitespace-nowrap` because the held date is
                                  long and wrapped at any constrained width. */}
                              <dl className="flex flex-nowrap items-stretch justify-center">
                                {[
                                  { label: 'Session', value: session.label },
                                  ...(session.date
                                    ? [
                                        {
                                          label: 'Held on',
                                          value: `${formatDateLong(session.date)}${
                                            session.time ? ` · ${formatTime(session.time)}` : ''
                                          }`,
                                        },
                                      ]
                                    : []),
                                  {
                                    label: 'Transcript',
                                    value: transcript ? transcript.name : 'Not attached',
                                  },
                                ].map((f, i) => (
                                  <div
                                    key={f.label}
                                    className={cn(
                                      'flex min-w-0 flex-col gap-1 px-8',
                                      i > 0 && 'border-l border-hairline',
                                    )}
                                  >
                                    <dt className="text-caption-medium whitespace-nowrap text-ink-muted">
                                      {f.label}
                                    </dt>
                                    <dd className="max-w-[240px] truncate text-body-md text-ink">
                                      {f.value}
                                    </dd>
                                  </div>
                                ))}
                              </dl>

                              <div className="mx-auto w-full max-w-[560px] rounded-sm bg-purple-50 p-6 text-left">
                                <h3 className="text-caption-medium text-ink">What happens next?</h3>
                                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-caption text-ink-muted">
                                  <li>
                                    Your reflection and the transcript are shared with the research
                                    team.
                                  </li>
                                  <li>
                                    This session moves to complete on the session plan, and the next
                                    session becomes the upcoming one.
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {screen.kind === 'thanks' && (
                            <div className="flex flex-col items-center gap-6 py-6 text-center">
                              <ThanksMascot />
                              <div className="flex flex-col gap-2">
                                <h2
                                  id={titleId}
                                  ref={headingRef}
                                  tabIndex={-1}
                                  className="font-display text-display-md text-ink outline-none"
                                >
                                  {transcriptOnly
                                    ? PLANNING_THANKS_HEADING
                                    : 'Thank you for sharing your reflection'}
                                </h2>
                                <p className="text-body leading-[1.4] text-ink-muted">
                                  {transcriptOnly
                                    ? PLANNING_THANKS_BODY
                                    : `${session.label} is marked complete. Your reflection and transcript have been shared with the research team.`}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Footer. Fixed at the panel's foot rather than scrolling
                        with the content, so the controls are reachable at any
                        height — the Round 33 lesson from the module player.
                        `MODAL_FOOTER_SURFACE` is the app-wide treatment Round
                        17.2 extracted, shared with all five wizard-shaped
                        modals. */}
                    <div
                      className={cn(
                        MODAL_FOOTER_SURFACE,
                        'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3',
                      )}
                    >
                      {screen.kind === 'thanks' ? (
                        <>
                          <span />
                          <button
                            type="button"
                            onClick={() => close(true)}
                            className={PILL_PRIMARY}
                          >
                            Close
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={requestCancel}
                            className={GHOST_BUTTON_MUTED}
                          >
                            Cancel
                          </button>
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Back sits beside Next (direct instruction,
                                2026-10-05). The welcome has none: it is a
                                one-time orientation with nothing behind it. */}
                            {screen.kind !== 'welcome' && (
                              <button
                                type="button"
                                /* `step - 1` would land on the review screen,
                                   which the short flow never shows. */
                                onClick={() => go(transcriptOnly ? WELCOME_STEP : step - 1)}
                                className={PILL_OUTLINE}
                              >
                                Back
                              </button>
                            )}
                            {screen.kind === 'welcome' ? (
                              /* "Get started" rather than "Next" matches
                                 `PlanSessionsModal`'s intro, the precedent this
                                 screen is modelled on. */
                              <button
                                type="button"
                                /* The short flow jumps the six questions and
                                   the review rather than renumbering the
                                   machine: every step constant keeps one
                                   meaning, and the screens in between are
                                   simply never visited. */
                                onClick={() => go(transcriptOnly ? TRANSCRIPT_STEP : step + 1)}
                                className={PILL_PRIMARY}
                              >
                                Get started
                              </button>
                            ) : screen.kind === 'complete' ? (
                              <button
                                type="button"
                                onClick={handleComplete}
                                className={PILL_PRIMARY}
                              >
                                Mark session complete
                              </button>
                            ) : screen.kind === 'transcript' ? (
                              /* Mandatory (direct instruction: *"its mandatory
                                 to upload a file to move next"*).

                                 ⚠️ `aria-disabled`, never `disabled`:
                                 `trapKeys` above queries
                                 `button:not([disabled])`, so a button that
                                 disables while focused drops focus to `<body>`
                                 *and* silently changes the trap's last
                                 element. This is also the treatment CLAUDE.md
                                 already mandates for unwired controls — the
                                 control stays focusable and explains itself
                                 rather than going dead. */
                              <button
                                type="button"
                                aria-disabled={uploadStage !== 'ready'}
                                onClick={() => {
                                  if (uploadStage !== 'ready') return
                                  /* On the short flow this button is the
                                     commit — there is no mark-complete screen
                                     behind it — so it goes through
                                     `handleComplete`, which owns the
                                     once-only guard. */
                                  if (transcriptOnly) handleComplete()
                                  else go(step + 1)
                                }}
                                className={cn(
                                  PILL_PRIMARY,
                                  uploadStage !== 'ready' &&
                                    'cursor-not-allowed bg-ink-faint hover:bg-ink-faint',
                                )}
                              >
                                {transcriptOnly ? 'Share transcript' : 'Next'}
                                {uploadStage !== 'ready' && (
                                  <span className="sr-only">
                                    {' '}
                                    (attach the transcript first)
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => go(step + 1)}
                                className={PILL_PRIMARY}
                              >
                                Next
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel discards — the coach has no draft store, unlike the trainee,
          whose equivalent dialog says "Save and close" because its answers
          genuinely survive. Two wordings for the same button across two
          portals, and the reason is this and only this. If a coach draft store
          ever lands, this copy is the thing that has to change with it.

          The body is per screen because the consequences genuinely differ.
          The mark-complete one names **both** outcomes: a coach whose mental
          model is "I have done the work" needs telling that the session will
          still show as not held, or they close, see it incomplete, and
          conclude the app lost it. */}
      <ConfirmDialog
        open={cancelOpen}
        title={transcriptOnly ? 'Leave this upload for now?' : 'Leave this reflection for now?'}
        /* Three bodies, each true of its own screen — the first rule here is
           that none of them may promise something the store does not do.

           The transcript is the one thing that genuinely does NOT survive:
           `saveCoachReflectionDraft` holds answers, and a `File` handle is not
           answers. Saying so is the difference between a coach who reattaches
           it on the way back and one who assumes it is waiting. */
        body={
          transcriptOnly
            ? /* The one thing in flight, and it genuinely does not survive —
                 a `File` handle is not something the draft store holds. */
              `${transcript?.name ?? 'The transcript'} will not be attached. You can come back to this from the session card.`
            : !anyAnswered
              ? 'You have not answered anything yet. You can come back to this reflection from the session card.'
              : transcript
                ? `Your answers are saved. You can come back and finish this from the session card — you will need to attach ${transcript.name} again.`
                : 'Your answers are saved. You can come back and finish this from the session card.'
        }
        /* The trainee's own labels, exactly (direct instruction, 2026-10-05).
           "Save and close" is honest here only because the draft store landed
           in the same change; before it, the answers really were thrown away,
           which is why this dialog used to read "Leave" on a red button. And
           **not** `destructive`: nothing is destroyed on this path any more,
           and a red confirm over "your answers are saved" would be the two
           halves of one dialog disagreeing. */
        confirmLabel={!transcriptOnly && anyAnswered ? 'Save and close' : 'Close'}
        cancelLabel={transcriptOnly ? 'Resume upload' : 'Resume answering'}
        onConfirm={() => {
          setCancelOpen(false)
          close(false)
        }}
        onClose={() => setCancelOpen(false)}
      />

      {/* "Where to find scripts?" — a placeholder screenshot (direct
          instruction: *"this will be a screenshot, keep as placeholder for
          now"*). `singleAction` because the dialog shows a thing and asks
          nothing. */}
      <ConfirmDialog
        open={helpOpen}
        title="Where to find your session transcript"
        body="Zoom saves a transcript for every recorded session. Open the meeting in your Zoom account, then download the transcript file from the recording."
        confirmLabel="Close"
        cancelLabel="Close"
        singleAction
        panelClassName="max-h-[85vh] w-full max-w-[640px]"
        onConfirm={() => setHelpOpen(false)}
        onClose={() => setHelpOpen(false)}
      >
        {/* A real placeholder rather than a fabricated screenshot: this app
            does not invent UI it has not built, and a drawn mock of Zoom's own
            interface would be exactly that. Replace the box with the real
            export when it exists. */}
        <div className="mt-2 flex h-[220px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-ink-faint bg-purple-50 px-8 text-center">
          <ImageIcon aria-hidden="true" className="size-8 text-ink-faint" />
          <span className="text-caption-medium text-ink">Screenshot to come</span>
          <span className="text-fine text-ink-muted">
            A walkthrough of downloading a transcript from Zoom
          </span>
        </div>
      </ConfirmDialog>
    </>
  )
}
