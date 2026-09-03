import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, CheckCircle2, Lock, Users } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { WizardProgressRail, type WizardRailStep } from '@/components/shared/WizardProgressRail'
import { STEP_CONTENT_GAP, WizardStepHeading } from '@/components/shared/WizardStepHeading'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { formatDateLong, formatTime } from '@/data/format'
import type { ReflectionComponentAnswer } from '@/data/spaces'

/**
 * The 6-step SIPTEA post-practice annotation wizard (Round 6.2 — Coach
 * Delivery Portal, My Annotations tab). New pattern: no existing modal in
 * this app is a multi-step wizard, so this component owns its own dialog
 * chassis (backdrop, focus trap, Escape, return-focus, `max-h-[85vh]` panel)
 * rather than reusing `ConfirmDialog` directly — `ConfirmDialog`'s own
 * title/body props are plain strings and its footer is a fixed
 * Cancel/Confirm (or single-action) pair, neither of which fits a screen
 * that changes 7 times within one open/close lifecycle (design-tokens.md
 * §23). The nested "Discard this annotation summary?" confirmation *does*
 * reuse `ConfirmDialog` as-is — that one is a genuine single-screen confirm,
 * layered on top.
 */

const STEPS = [
  /* Round 39, direct instruction (`/design:ux-copy`): shorter, and **no client
     names**. Two things changed together:
       - The "{dyad}" placeholder is gone from every question. The banner and the
         page header already name who this is about, so repeating it inside each
         of six questions was the wordiest part of the copy and added nothing.
       - "Think about your FIRST session" is gone too. It was true when this
         wizard only ever ran once per client; it now runs from the session
         debrief banner for whichever session just happened, so naming the first
         one was simply wrong from Session 2 onward.
     Each question keeps its reflective pair — one about what happened, one about
     what was missed — because that pairing is what makes it a reflection rather
     than a form field. */
  {
    component: 'S',
    label: 'Shared understanding',
    question:
      'Where did you land on a shared understanding of the sleep issue and goals? Where did your view differ from theirs?',
  },
  {
    component: 'I',
    label: 'Implementation intent',
    question:
      'How concrete did you get about how the strategy would actually be carried out? What was left vague?',
  },
  {
    component: 'P',
    label: 'Problem identification',
    question:
      'What might make this strategy difficult? Was there anything you suspected but did not raise?',
  },
  {
    component: 'T',
    label: 'Tailoring',
    question:
      'How did you adjust the plan to fit their situation rather than the general advice? What did you let go of?',
  },
  {
    component: 'E',
    label: 'Emotion navigation',
    question:
      'Think of a moment where emotion was present, theirs or yours. How did you navigate it, and what would you do differently?',
  },
  {
    component: 'A',
    label: 'Action and goals',
    question:
      'What did you agree to do next? Is it the right size of step for them right now?',
  },
] as const

const STEP_COUNT = STEPS.length

/* `[minmax(0,248px)_1fr]`, not the old `3fr_7fr` (direct instruction: reduce
   width). At 30% of a 920px panel the rail was ~420px wide for eight short
   labels, which left the response textarea narrower than the question above it.
   A fixed cap rather than a smaller fraction because the rail's content does not
   grow with the panel — its widest label is "Mark session complete".
   `minmax(0, …)` and not a bare `248px`: a grid item defaults to
   `min-width: auto`, so without it a long label sizes the track instead of
   wrapping inside it. */
const WIZARD_GRID =
  'mt-6 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-[minmax(0,248px)_1fr] md:gap-8'
const WIZARD_RAIL_BOX = 'shrink-0 self-start rounded-lg bg-purple-50 p-4 md:p-6'

/* No interpolation any more — the questions no longer mention the client, so
   this is a plain lookup. Kept as a function rather than inlined so the call
   sites do not have to know that. */
function questionFor(step: number): string {
  return STEPS[step].question
}

/** Builds the reflection's structured per-component answers client-side —
 *  a deterministic mapping over the 6 step answers, explicitly not a real
 *  Anthropic API call (scope plan §2d prototype-fidelity note). Kept
 *  structured (rather than flattened into one string) so every display
 *  surface can render each component as its own labeled field via
 *  `ReflectionFields` instead of parsing text back apart. */
function buildReflectionComponents(answers: string[]): ReflectionComponentAnswer[] {
  return STEPS.map((s, i) => ({
    label: s.label.startsWith('Component') ? s.label : `${s.component}: ${s.label}`,
    answer: answers[i]?.trim() || '(no response recorded)',
  }))
}

/** Non-editable, labeled field list for a reflection's per-component
 *  answers — shared by this modal's own review screen (a true preview of
 *  what's about to be saved) and every place a saved reflection is later
 *  displayed (Coach Delivery Portal, researcher-facing Annotation Vault),
 *  so the two never drift into different formats. */
export function ReflectionFields({ components }: { components: ReflectionComponentAnswer[] }) {
  return (
    <dl className="mt-2">
      {components.map((c, i) => (
        <div key={c.label}>
          {i > 0 && <Separator className="bg-divider-soft" />}
          <div className="py-3">
            <dt className="text-fine text-ink-faint">{c.label}</dt>
            <dd className="mt-1 text-caption leading-[1.6] text-ink">{c.answer}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

/**
 * The review screen's component/response table.
 *
 * Round 40: extracted at its second caller. The My reflections tab's own review
 * dialog opens a *saved* reflection and must look like the screen the coach
 * approved it on — direct instruction, after a first pass rendered it as a
 * `ReflectionFields` list and read as a different screen entirely. Sharing the
 * markup is the only way the two stay identical; the alternative is the drift
 * `ProfileDetailsSections` was created to end.
 *
 * `idPrefix` exists because both callers can be mounted at once (the wizard on
 * the Coaching workspace tab, this dialog on My reflections) and duplicate
 * `id`s would break the `<label htmlFor>` pairing.
 */
export function ReflectionReviewTable({
  answers,
  idPrefix,
  onChange,
}: {
  answers: string[]
  idPrefix: string
  onChange: (index: number, value: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-parchment shadow-card">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-purple-50">
            <th scope="col" className="w-[34%] px-4 py-3.5 text-caption-medium text-ink-muted">
              SIPTEA component
            </th>
            <th scope="col" className="px-4 py-3.5 text-caption-medium text-ink-muted">
              Your response
            </th>
          </tr>
        </thead>
        <tbody>
          {STEPS.map((st, i) => (
            <tr key={st.component} className={cn(i > 0 && 'border-t border-parchment')}>
              {/* A row header, not a plain cell — the component is what the
                  response is *about*, which is what `scope="row"` tells a
                  screen reader reading across the row. */}
              <th
                scope="row"
                className="px-4 py-3 text-left align-top text-caption-medium font-medium text-ink"
              >
                <label htmlFor={`${idPrefix}-${i}`}>
                  {st.component}: {st.label}
                </label>
              </th>
              <td className="px-4 py-3 align-top">
                <textarea
                  id={`${idPrefix}-${i}`}
                  value={answers[i] ?? ''}
                  onChange={(e) => onChange(i, e.target.value)}
                  rows={3}
                  placeholder="Not answered yet."
                  className="w-full resize-y rounded-sm border border-hairline bg-parchment px-3 py-2 text-caption text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** `wizard-progress-rail` (design-tokens.md §23/§36) — shared component; this
 *  wizard's own step labels double as their headings (fixed SIPTEA framework
 *  terms), so `RAIL_STEPS` has no separate `heading` override.
 *
 *  Round 28: this rail no longer diverges — its "Step N of M" live text was
 *  the app's only visible one and is now `sr-only` like every other wizard's,
 *  because it repeated the rail label above it and the content pane's heading
 *  beside it. */
const SIPTEA_RAIL_STEPS: WizardRailStep[] = STEPS.map((s) => ({
  key: s.component,
  navLabel: s.label,
}))

/**
 * The rail now covers the **whole** flow, not just the 6 SIPTEA components
 * (Round 39, direct instruction: "add review and markoff session").
 *
 * Two consequences worth naming. The review and confirmation screens previously
 * rendered no rail at all, so a coach four screens into a wizard lost every cue
 * about where they were exactly when the flow was about to commit something —
 * they are steps 7 and 8 now, and look like it. And "Mark complete" only exists
 * when there is a session to complete, so the rail is 7 steps from the
 * per-client reflection card and 8 from the debrief banner: it describes the
 * flow the coach is actually in rather than a fixed idea of it.
 */
function railStepsFor(hasCompleteStep: boolean): WizardRailStep[] {
  return [
    ...SIPTEA_RAIL_STEPS,
    { key: 'review', navLabel: 'Review reflection' },
    ...(hasCompleteStep ? [{ key: 'complete', navLabel: 'Mark session complete' }] : []),
  ]
}

export function AddAnnotationSummaryModal({
  open,
  onClose,
  dyadId,
  dyadTitle,
  session,
  completeSession,
}: {
  open: boolean
  onClose: () => void
  dyadId: string
  dyadTitle: string
  /**
   * The internal SPACES session number this reflection is about (Round 40).
   *
   * Stored on the entry so the My reflections table can list one row per
   * session. Optional: a reflection written outside any session debrief has no
   * session, and the table renders it that way rather than guessing.
   *
   * Deliberately separate from `completeSession.label` even though both name
   * the same session — that one is display copy, this is the key. Deriving a
   * number back out of "Session 3" is the off-by-one this project has shipped
   * more than once (internal 1 is "Planning").
   */
  session?: number
  /**
   * Turns this wizard into "write the session up **and** mark it held".
   *
   * Round 39, direct instruction, for the coach's session-debrief banner: its
   * CTA is "Write note & complete session", so saving the reflection is no
   * longer the last thing that happens — a confirmation screen follows it and
   * completing the session is a separate, explicit act.
   *
   * Optional, and every existing caller omits it: the per-client reflection card
   * still opens this wizard purely to write a reflection, with no session to
   * complete, and is untouched.
   *
   * `onConfirm` is what actually marks the session held. It is the caller's job
   * rather than this component's because completion lives in the session store,
   * which this wizard otherwise knows nothing about.
   */
  completeSession?: {
    /** Display label, e.g. "Session 4" — never a bare number. */
    label: string
    date?: string
    time?: string
    onConfirm: () => void
  }
}) {
  const { submitPostPracticeAnnotation } = useResearch()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(STEP_COUNT).fill(''))
  const [reviewing, setReviewing] = useState(false)
  const [shared, setShared] = useState(true)
  const [discardOpen, setDiscardOpen] = useState(false)
  /* The confirmation screen after review. Only reachable when
     `completeSession` is supplied. */
  const [confirming, setConfirming] = useState(false)
  /**
   * Did the session actually go ahead?
   *
   * Round 39, direct instruction: opening this wizard from the debrief banner
   * now starts with that question rather than with Step 1. The banner fires off
   * the clock, not off any knowledge that the session happened — so the flow
   * asked the coach to reflect on a session that may simply not have taken
   * place, and its final screen offered to mark it complete regardless.
   *
   * `null` = not answered yet. Only ever leaves `null` when `completeSession` is
   * set; the per-client reflection card has no session to have happened or not,
   * so it skips the gate entirely.
   */
  const [sessionHappened, setSessionHappened] = useState<boolean | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  const anyAnswered = answers.some((a) => a.trim().length > 0) || reviewing || confirming

  const reset = () => {
    setStep(0)
    setAnswers(Array(STEP_COUNT).fill(''))
    setReviewing(false)
    setShared(true)
    setDiscardOpen(false)
    setConfirming(false)
    setSessionHappened(null)
  }

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus({ preventScroll: true })
      reset()
      setConfirmation(null)
    } else if (triggerRef.current) {
      triggerRef.current.focus({ preventScroll: true })
      triggerRef.current = null
    }
    // reset/setConfirmation are stable setters — only `open` should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!confirmation) return
    const timer = window.setTimeout(() => setConfirmation(null), 4000)
    return () => window.clearTimeout(timer)
  }, [confirmation])

  const requestClose = () => {
    if (discardOpen) return
    if (!anyAnswered) {
      onClose()
      return
    }
    setDiscardOpen(true)
  }

  const trapKeys = (e: React.KeyboardEvent) => {
    if (discardOpen) return
    if (e.key === 'Escape') {
      requestClose()
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

  const reflectionComponents = buildReflectionComponents(answers)

  const handleSubmit = () => {
    submitPostPracticeAnnotation(dyadId, reflectionComponents, shared, session)
    /* With a session to complete, the reflection is saved here but the dialog
       stays open on its confirmation screen — the coach has done half of what
       the banner's CTA promised, and closing now would leave the session still
       showing as not held with no indication why. */
    if (completeSession) {
      setConfirming(true)
      return
    }
    setConfirmation(
      shared
        ? 'Reflection saved. You shared this with the research team.'
        : 'Reflection saved.',
    )
    onClose()
  }

  const handleCompleteSession = () => {
    completeSession?.onConfirm()
    setConfirmation(`${completeSession?.label} marked complete.`)
    onClose()
  }

  // AnimatePresence (and the discard ConfirmDialog) stay mounted regardless
  // of `open` — matching ConfirmDialog's own pattern of gating *content*
  // inside AnimatePresence via `open && (...)` rather than mounting/
  // unmounting AnimatePresence itself. Unmounting AnimatePresence across
  // open/close transitions is what caused a real bug caught in manual
  // verification: framer-motion re-mounting a fresh AnimatePresence
  // instance on every open lost track of its previous children, producing
  // React "duplicate key" console errors on every open. The post-submit
  // toast renders unconditionally alongside it so it survives `open`
  // flipping to false when the modal closes on submit.
  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/25"
              onClick={requestClose}
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
                {/* The gate. No rail: this is a precondition for the flow, not
                    a step inside it, and the rail's own first step is the first
                    SIPTEA question. */}
                {completeSession && sessionHappened === null ? (
                  <>
                    {/* Centred on both axes (direct instruction). The gate has
                        one question and two answers, so it is the only screen in
                        this wizard with far less content than the panel's fixed
                        height — left-aligned at the top it read as a page that
                        had failed to load the rest of itself.
                        `my-auto` rather than `justify-center`: the panel is a
                        flex column, and auto margins centre the block while
                        still letting it scroll if the copy ever grows past the
                        space. */}
                    {/* Modelled on `PlanSessionsModal`'s own welcome screen
                        (direct instruction) — same centred column, same type
                        pairing, same 56px icon circle. That screen is this
                        wizard's sibling in the coach's flow, so the two now open
                        the same way.
                        Type is `display-md` heading / `body` sub / `body-md`
                        option title / `caption` option copy — one pairing, no
                        variation (direct instruction: the options were
                        `caption-medium` over `fine`, which read as a third
                        scale). */}
                    <div className="my-auto flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-6 text-center">
                      <div className="flex w-full flex-col items-center gap-2">
                        <h2
                          id={titleId}
                          className="text-balance font-display text-display-md text-ink"
                        >
                          Did {completeSession.label} go ahead?
                        </h2>
                        {/* `body` regular in `ink` (direct instruction), not
                            `ink-muted`. It carries the one fact the coach needs
                            to answer the question above it, so it is not
                            supporting copy. */}
                        <p className="max-w-[640px] text-body text-ink">
                          {completeSession.date
                            ? `It was planned for ${formatDateLong(completeSession.date)}${
                                completeSession.time ? ` at ${formatTime(completeSession.time)}` : ''
                              }.`
                            : 'Let us start there.'}
                        </p>
                      </div>

                      {/* Side by side, equal width and height (direct
                          instruction). `grid-cols-2` rather than a flex row
                          because equal *width* is the ask and a grid gives it
                          without `flex-1` fighting the content; `items-stretch`
                          is the default here, so the shorter card matches the
                          taller one. `min-w-0` on the cells: a grid item
                          defaults to `min-width: auto`, so without it the longer
                          copy sizes its track and the two stop being equal. */}
                      <div className="mt-10 grid w-full max-w-[520px] grid-cols-2 gap-4">
                        {[
                          {
                            value: true,
                            Icon: CheckCircle2,
                            title: 'Yes, it went ahead',
                            body: 'Add your reflection, then mark the session complete.',
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

                    <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-end gap-3')}>
                      <button
                        type="button"
                        onClick={requestClose}
                        className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-ink-muted outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : completeSession && sessionHappened === false ? (
                  /* The dead end, stated plainly. Nothing is saved and nothing
                     is marked — the coach is sent to Reschedule, which lives on
                     the session card behind this dialog. This wizard does not
                     offer to reschedule itself: that would be a second editor
                     for the plan, and the card already owns it. */
                  <>
                    {/* Flush centre, no card (direct instruction). It is a
                        message rather than a record — a bordered, filled panel
                        made it look like content the coach had produced, and put
                        a box around three sentences on an otherwise empty
                        screen. Same centring as the gate it follows, so choosing
                        "No" does not shift the layout. */}
                    <div className="my-auto flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-2 text-center">
                      {/* Direct instruction: **no subtext under the title**, and
                          the directions rewritten. The old version said the same
                          thing three times over four lines — a subtitle
                          explaining that a session must be held first, then a
                          paragraph repeating it, then a third clause about
                          coming back. One title, one instruction.
                          Both reschedule routes are named because both exist
                          (also direct instruction) — naming only the card made
                          the plan route invisible.
                          `max-w-[440px]`: centred copy needs a measure, or the
                          lines run the panel's full width and the centring stops
                          reading as deliberate. */}
                      <h2 id={titleId} className="text-balance font-display text-display-md text-ink">
                        Reschedule {completeSession.label}
                      </h2>
                      {/* `/design:ux-copy`, direct instruction (too vague).
                          Naming the two controls was not the problem — not
                          saying **where** they are was. "Go to Edit session
                          plan" assumes the coach already knows that is a button
                          in the page hero, so each is now given its location.
                          The lead sentence is the other missing piece: the coach
                          has just been through a gate and needs telling that
                          nothing was written down. */}
                      <p className="mt-4 max-w-[460px] text-body text-ink">
                        Nothing has been saved yet. Close this, then pick a new date and time —{' '}
                        <span className="font-semibold">Reschedule</span> on the session card, or{' '}
                        <span className="font-semibold">Edit session plan</span> at the top of the
                        page.
                      </p>
                    </div>

                    <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                      <button
                        type="button"
                        onClick={() => setSessionHappened(null)}
                        className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Go back
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : confirming && completeSession ? (
                  /* Round 39: the confirmation screen. Reached only after the
                     reflection has already saved, so it says so plainly — a
                     screen that looked like it might still lose the note would
                     make the coach re-read the whole wizard. */
                  <>
                    {/* **No rail** (direct instruction), and centred on the
                        gate/welcome screen's own shape. This is a closing
                        confirmation, not another question — the rail lists it as
                        the last step while the coach is still answering, which is
                        what tells them it is coming; on the screen itself it only
                        narrowed the summary they are being asked to check.
                        Type follows the welcome screen: `display-md` heading,
                        `body` in `ink` beneath it, `caption-medium` labels over
                        `body-md` values, `caption` for the supporting list. */}
                    <div className="my-auto flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-6 text-center">
                      <div className="flex w-full flex-col items-center gap-2">
                        <h2
                          id={titleId}
                          className="text-balance font-display text-display-md text-ink"
                        >
                          Mark {completeSession.label} as complete?
                        </h2>
                        <p className="max-w-[640px] text-body text-ink">
                          Your reflection has been saved. One last step.
                        </p>
                      </div>

                      {/* Raised twice on direct feedback: 56px above the detail
                          row and 48px between it and the purple card. They are
                          three separate blocks — question, facts, consequences —
                          and at 24px the card read as part of the row above it. */}
                      <div className="mt-14 flex w-full flex-col gap-12">
                        {/* One row, no wrapping, vertical strokes between the
                            fields (direct instruction). `divide-x` on the flex
                            row draws the separators, so there is no separator
                            element to keep in step with the field count.
                            `divide-hairline` (#e0e0e0), NOT `parchment`
                            (#f5f5f7): parchment on a white panel composites to
                            almost nothing and the strokes were invisible —
                            reported as such. `hairline` is the app's actual
                            divider token. `items-stretch` so each stroke runs
                            the full height of the row rather than stopping at
                            the shortest column.
                            `whitespace-nowrap` on the values and no `max-w` on
                            the row: the "Held on" value is a long date, and at
                            560px the three fields wrapped to two lines with the
                            third centred under the first two. */}
                        {/* One row, no wrapping, vertical strokes between the
                            fields (direct instruction).
                            The strokes are an **explicit `border-l` per cell
                            after the first**, not Tailwind's `divide-x`:
                            measured, `divide-x` computed to `0px` here and the
                            separators were reported invisible twice.
                            `hairline` (#e0e0e0) and not `parchment` (#f5f5f7) —
                            parchment on a white panel composites to almost
                            nothing, the same cool-grey-on-light trap this
                            project has hit before.
                            `items-stretch` so each stroke runs the row's full
                            height instead of stopping at the shortest column,
                            and `whitespace-nowrap` on the values because the
                            "Held on" date is long and wrapped to a second line
                            at any constrained width. */}
                        <dl className="flex flex-nowrap items-stretch justify-center">
                          {[
                            { label: 'Session', value: completeSession.label },
                            ...(completeSession.date
                              ? [
                                  {
                                    label: 'Held on',
                                    value: `${formatDateLong(completeSession.date)}${
                                      completeSession.time ? ` · ${formatTime(completeSession.time)}` : ''
                                    }`,
                                  },
                                ]
                              : []),
                            {
                              label: 'Your reflection',
                              value: shared ? 'Saved and shared' : 'Saved, not shared',
                            },
                          ].map((f, i) => (
                            <div
                              key={f.label}
                              className={cn(
                                'flex flex-col gap-1 px-8',
                                i > 0 && 'border-l border-hairline',
                              )}
                            >
                              <dt className="text-caption-medium whitespace-nowrap text-ink-muted">
                                {f.label}
                              </dt>
                              <dd className="text-body-md whitespace-nowrap text-ink">{f.value}</dd>
                            </div>
                          ))}
                        </dl>

                        <div className="mx-auto w-full max-w-[560px] rounded-sm bg-purple-50 p-6 text-left">
                          <h3 className="text-caption-medium text-ink">What happens next</h3>
                          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-caption text-ink-muted">
                            <li>
                              This session moves to complete on the session plan, and the next
                              session becomes the upcoming one.
                            </li>
                            <li>
                              If the session did not go ahead, close this and reschedule it instead,
                              either from the upcoming session card or Edit session plan.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                      <button
                        type="button"
                        /* Back to review, not out of the dialog. The reflection
                           is already saved, so this is "not yet" on completion
                           only — `onClose` is the Escape/backdrop path. */
                        onClick={() => setConfirming(false)}
                        className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Go back
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteSession}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                      >
                        Mark session complete
                      </button>
                    </div>
                  </>
                ) : reviewing ? (
                  <>
                    <h2 id={titleId} className="shrink-0 font-display text-title text-ink">
                      Review your reflection
                    </h2>
                    <p className="mt-2 shrink-0 text-caption text-ink-faint">
                      Nothing has been saved yet. Read over your reflection below, then
                      choose whether to share it.
                    </p>

                    {/* **No side rail here** (direct instruction). Review is a
                        closing screen, not another question — the rail lists it
                        as step 7 while the coach is still answering, which is
                        what tells them it is coming; once they are on it, the
                        table is the content and a rail beside it only narrows
                        the answers they are trying to read.

                        Answers are **editable in place** (direct instruction).
                        An earlier pass put an "Edit" link per row that jumped
                        back to that step; correcting a sentence should not mean
                        leaving the screen you noticed it on. */}
                    <div className="mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
                      <ReflectionReviewTable
                        answers={answers}
                        idPrefix="review-answer"
                        onChange={(i, value) =>
                          setAnswers((prev) => prev.map((a, j) => (j === i ? value : a)))
                        }
                      />

                      {/* Share choice, rebuilt (direct instruction). It is a
                          card on the page's own treatment — `purple-50` header
                          band, `parchment` stroke, card shadow — rather than two
                          loose bordered rows, and each option leads with what it
                          means for the coach rather than with a radio.
                          Native radios kept: the app has a documented
                          hand-rolled `role="radiogroup"` with no keyboard
                          contract elsewhere, and this is not the place to add a
                          second one. */}
                      <div className="overflow-hidden rounded-sm border border-parchment shadow-card">
                        <div className="bg-purple-50 px-4 py-3.5">
                          <h3 className="text-caption-medium text-ink">Who can read this reflection?</h3>
                        </div>
                        <fieldset className="border-t border-parchment p-4">
                          <legend className="sr-only">Who can read this reflection?</legend>
                          <div className="flex flex-col gap-3">
                            {[
                              {
                                value: true,
                                Icon: Users,
                                title: 'Share with the research team',
                                body: 'Your supervisor and the research team can read it.',
                              },
                              {
                                value: false,
                                Icon: Lock,
                                title: 'Keep it private',
                                body: 'Only you can read it. It stays on this client\u2019s record, labelled as not shared.',
                              },
                            ].map((o) => {
                              const selected = shared === o.value
                              return (
                                <label
                                  key={String(o.value)}
                                  className={cn(
                                    'flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition-colors',
                                    selected
                                      ? 'border-primary bg-purple-50'
                                      : 'border-parchment bg-card hover:bg-purple-50/50',
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="annotation-share-choice"
                                    checked={selected}
                                    onChange={() => setShared(o.value)}
                                    className="mt-0.5 size-4 shrink-0 accent-primary"
                                  />
                                  <o.Icon
                                    aria-hidden="true"
                                    className={cn('mt-0.5 size-4 shrink-0', selected ? 'text-primary' : 'text-ink-faint')}
                                  />
                                  {/* Same pairing as the gate's own option
                                      buttons (direct instruction): `body-md` in
                                      `ink` over `caption` in `ink-muted`. These
                                      were `caption-medium` over `fine`, a third
                                      scale for the same kind of choice. */}
                                  <span className="min-w-0">
                                    <span className="block text-body-md text-ink">{o.title}</span>
                                    <span className="mt-1 block text-caption text-ink-muted">{o.body}</span>
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </fieldset>
                      </div>
                    </div>
                    <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                      <button
                        type="button"
                        onClick={() => setReviewing(false)}
                        className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Back to Step {STEP_COUNT}
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                      >
                        {/* "Save reflection" would be a half-truth when a
                            confirmation screen follows it. */}
                        {completeSession ? 'Save and continue' : 'Save reflection'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 id={titleId} className="shrink-0 font-display text-title text-ink">
                      Add reflection
                    </h2>

                    <div className={WIZARD_GRID}>
                      <div className={WIZARD_RAIL_BOX}>
                        <WizardProgressRail
                          steps={railStepsFor(!!completeSession)}
                          current={step}
                          ariaLabel="Reflection progress"
                          // Round 28: `liveTextVisible` dropped. It rendered
                          // "Step N of 6: {label}" under the current rail item,
                          // which repeated the label directly above it *and*
                          // the content pane's own "Step N of 6" + heading —
                          // three copies of the same fact on one screen. The
                          // text is still announced, just `sr-only` now, which
                          // is what the other three wizards already do.
                          liveTextSuffix={`, reflection for ${dyadTitle}`}
                        />
                      </div>

                      <div>
                        {/* The SIPTEA question rides in the `subtitle` slot,
                            i.e. 4px under the heading, with the 32px gap
                            falling *after* it and before the textarea.

                            A first pass had this the other way round — the
                            question rendered as step content, so the 32px sat
                            between heading and question and the textarea was
                            flush underneath. Corrected on direct instruction
                            ("body text should be closer to title, and then
                            there should be spacing followed by interactive
                            component"): the separation belongs between *read
                            this* and *do this*, not inside the reading. */}
                        <WizardStepHeading
                          step={step}
                          /* The rail's total, not the SIPTEA count. Adding
                             Review and Mark-complete to the rail made these two
                             disagree — the pane read "Step 1 of 6" while the
                             rail announced "Step 1 of 8" — and a screen-reader
                             user got a different total from a sighted one. The
                             flow genuinely has 8 stages now, so both say 8. */
                          stepCount={railStepsFor(!!completeSession).length}
                          heading={STEPS[step].label}
                          subtitle={questionFor(step)}
                        />

                        <div className={cn(STEP_CONTENT_GAP, 'flex flex-col gap-1')}>
                          <label
                            htmlFor={`annotation-response-${step}`}
                            className="text-fine text-ink-faint"
                          >
                            Your response
                          </label>
                          <textarea
                            id={`annotation-response-${step}`}
                            key={step}
                            value={answers[step]}
                            onChange={(e) =>
                              setAnswers((prev) =>
                                prev.map((a, i) => (i === step ? e.target.value : a)),
                              )
                            }
                            autoComplete="off"
                            placeholder="Write as much or as little as feels useful."
                            /* Taller and `parchment`-filled (direct
                               instruction). Two notes:
                               - `min-h-[320px]` + `h-full` rather than a bigger
                                 `rows`: the pane is a flex column, so `h-full`
                                 lets the box take the space the shortened copy
                                 above it freed, and `min-h` is the floor for
                                 when the question wraps to three lines. `rows`
                                 alone would have fixed one height for both.
                               - `parchment` (`#f5f5f7`, the off-white token)
                                 reads as a writable field against the modal's
                                 own white panel, where `bg-card` made the box
                                 disappear into it and left only a hairline to
                                 say "type here". It is the same fill the case
                                 note textarea uses. */
                            className="h-full min-h-[320px] w-full resize-y rounded-sm border border-hairline bg-parchment px-3 py-2 text-caption text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                      </div>
                    </div>

                    <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                      <button
                        type="button"
                        onClick={requestClose}
                        className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-ink-muted outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Cancel
                      </button>
                      <div className="flex items-center gap-3">
                        {step > 0 && (
                          <button
                            type="button"
                            onClick={() => setStep((s) => Math.max(0, s - 1))}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                          >
                            Back
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (step === STEP_COUNT - 1) setReviewing(true)
                            else setStep((s) => Math.min(STEP_COUNT - 1, s + 1))
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                        >
                          {step === STEP_COUNT - 1 ? 'Review your reflection' : 'Next'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={discardOpen}
        title="Discard this reflection?"
        body="Your answers won't be saved. You'll need to start over from Step 1."
        confirmLabel="Discard"
        cancelLabel="Keep writing"
        destructive
        onConfirm={() => {
          setDiscardOpen(false)
          onClose()
        }}
        onClose={() => setDiscardOpen(false)}
      />

      {confirmation && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-[60] mx-auto w-fit max-w-[90vw] rounded-full bg-ink px-5 py-3 text-caption font-semibold text-white shadow-card"
        >
          {confirmation}
        </div>
      )}
    </>
  )
}
