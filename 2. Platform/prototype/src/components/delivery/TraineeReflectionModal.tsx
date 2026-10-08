import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ListChecks, PenLine, Send } from 'lucide-react'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { GHOST_BUTTON_MUTED } from '@/components/shared/buttonStyles'
import { ThanksMascot } from '@/components/shared/ThanksMascot'
import { SIPTEA_BG, SIPTEA_INITIALS, SIPTEA_NAMES, type SipteaInitial } from '@/data/siptea'
import { SipteaSkillChip } from '@/pages/training-v2/player/blocks/SipteaSkillChip'
import {
  BASELINE_QUESTIONS,
  DUMMY_EARLIER,
  GROWTH_PROMPT,
  QUOTES_BACK,
  REFLECTION_STEP_COUNT,
  recallLeadIn,
  stageFullName,
  WELCOME_BLURB,
  WELCOME_STEPS,
  TIMEPOINT_NAME,
  emptyAnswers,
  saveReflectionDraft,
  submitReflection,
  useReflectionState,
  type ReflectionAnswers,
  type ReflectionTimepoint,
} from '@/data/traineeReflections'
import { cn } from '@/lib/utils'

/**
 * The trainee's SIPTEA reflection wizard — six questions, a review, and a
 * thank-you.
 *
 * Built 2026-10-02 from the Notion page's own question sets (see
 * `data/traineeReflections.ts`, which owns every string). Opened by the stage
 * reflection banner on trainee Home at three timepoints: after Stage C
 * (baseline), Stage O (midline) and Stage H (endline).
 *
 * ## Why this is not `AddAnnotationSummaryModal`
 * That wizard is also six SIPTEA steps, and the chassis below is deliberately
 * its chassis — backdrop, focus trap, Escape, return-focus, the discard
 * `ConfirmDialog`. What differs is the **shape**, which is the test CLAUDE.md
 * sets for forking rather than flagging:
 *
 *  - a **horizontal, centred** 6-step progress bar instead of the vertical
 *    `WizardProgressRail` four other wizards share (direct instruction);
 *  - a per-component colour disc, which no other wizard has;
 *  - questions that **differ per timepoint** and, at midline and endline, quote
 *    the trainee's own earlier answers back above the question.
 *
 * Adding three flags to the shared wizard to switch its rail off, its colours
 * on and its questions out would have left a component whose defaults are
 * wrong for everything, which is exactly the outcome that rule exists to avoid.
 * The **review table is shared** (`ReflectionReviewTable` is not re-made here —
 * see `ReviewTable` below for why a local one was needed instead).
 *
 * ## Three things that are load-bearing
 *
 * 1. **Focus moves on a callback ref, never an effect.** Under
 *    `AnimatePresence mode="wait"` the incoming screen mounts a commit *later*
 *    than the step change, so an effect keyed on the index runs while the
 *    outgoing screen is still the only thing in the tree — it focuses the old
 *    heading or nothing, never runs again, and every transition lands on
 *    `<body>`. A callback ref is keyed on the element, which cannot exist too
 *    early. This project has shipped the effect version six times.
 * 2. **Cancel is not destructive.** It confirms, then keeps the answers as a
 *    draft, which is what lets the banner offer Resume. "Discard" wording would
 *    be a lie about what the button does.
 * 3. **The draft is written on every close path** — Cancel, Escape, backdrop —
 *    through one `closeWithDraft`, so there is no route out of the modal that
 *    silently loses typing.
 */

/**
 * Step -1 is the welcome screen; 0-5 are the SIPTEA components; then review,
 * then thanks.
 *
 * The welcome sits at **-1 rather than shifting every other step up by one**,
 * so the numbered stepper still reads "Step N of 6" against question N with no
 * arithmetic in between. It also means the welcome rides the existing
 * `AnimatePresence key={step}` and the callback-ref focus guard rather than
 * needing a parallel `showIntro` boolean with its own focus effect, which is
 * how `PlanSessionsModal` does it and why that file carries two near-identical
 * focus effects.
 */
type Screen =
  | { kind: 'welcome' }
  | { kind: 'question'; index: number }
  | { kind: 'review' }
  | { kind: 'thanks' }

const WELCOME_STEP = -1
const REVIEW_STEP = REFLECTION_STEP_COUNT
const THANKS_STEP = REFLECTION_STEP_COUNT + 1

function screenFor(step: number): Screen {
  if (step === WELCOME_STEP) return { kind: 'welcome' }
  if (step === THANKS_STEP) return { kind: 'thanks' }
  if (step === REVIEW_STEP) return { kind: 'review' }
  return { kind: 'question', index: step }
}

/** The question a given component asks at a given timepoint. Baseline has its
 *  own six; midline and endline share the growth prompt, because what changes
 *  between them is how many earlier answers sit above it, not the ask. */
function questionFor(tp: ReflectionTimepoint, initial: SipteaInitial): string {
  return tp === 'baseline' ? BASELINE_QUESTIONS[initial] : GROWTH_PROMPT
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

const PILL_PRIMARY =
  'inline-flex h-11 min-w-[120px] shrink-0 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-ink-faint'
const PILL_OUTLINE =
  'inline-flex h-11 min-w-[120px] shrink-0 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring'
/* The ghost Cancel's style now lives in `components/shared/buttonStyles.ts`.
   This file's local `PILL_GHOST` WAS the app-wide ghost button, it just did
   not know it: its pill shape won a side-by-side against the five wizards'
   bare text cancel (direct instruction, 2026-10-05: *"always go with option
   A"*), so the six of them now share one constant. That file also carries the
   hover rule and the note on why `hover:bg-parchment` here painted nothing. */

/**
 * The 6-step progress bar (direct instruction: *"a 6 stepper progress bar on
 * top, centre aligned to page"*, then *"I want a circle + horizontal stroke,
 * each circle to have numbers, and as I move next, update it to green state
 * tick"*).
 *
 * Three states, and the green tick is the one carrying information: a step is
 * **done** once the trainee has moved past it, which is not the same as
 * answered — nothing here is required, so a tick means "visited", and the
 * review screen is where unanswered components actually surface. Said plainly
 * because a green tick that implied "answered" would be the sort of quiet
 * untruth this project keeps having to retract.
 *
 * The connecting stroke is a flex sibling rather than a border or a
 * pseudo-element, so it absorbs the row's slack and the circles stay evenly
 * spaced at any panel width. It fills green behind a completed step for the
 * same reason the pathway rail's connector does — a broken line reads as a
 * broken sequence.
 *
 * **Decorative in full** (`aria-hidden`): six circles and five strokes tell a
 * screen reader nothing, and the position is given once in text by the
 * `role="status"` line directly beneath.
 */
function StepBar({ step }: { step: number }) {
  return (
    <div className="flex w-full justify-center">
      <div aria-hidden="true" className="flex w-full max-w-[420px] items-center">
        {Array.from({ length: REFLECTION_STEP_COUNT }, (_, i) => {
          const done = i < step
          const current = i === step
          return (
            <div key={i} className="flex min-w-0 flex-1 items-center last:flex-none">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-fine transition-colors',
                  /* Black for the step you are on, not `primary` (direct
                     instruction, 2026-10-02). Green stays on the steps behind
                     you — that pairing is what makes "done" and "here" read as
                     two different things rather than two shades of one. */
                  done
                    ? 'border-success bg-success text-white'
                    : current
                      ? 'border-ink bg-ink text-white'
                      : 'border-hairline bg-card text-ink-faint',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={2.25}  /> : i + 1}
              </span>
              {/* The stroke belongs to the gap *after* a circle, so the last
                  circle has none — `last:flex-none` stops that final item
                  claiming a share of the row it does not need. */}
              {i < REFLECTION_STEP_COUNT - 1 && (
                <span
                  className={cn(
                    'h-0.5 min-w-0 flex-1 transition-colors',
                    done ? 'bg-success' : 'bg-hairline',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The component label is the **module player's own `SipteaSkillChip`**, reused
 * verbatim (direct instruction: *"SIPTEA labels should be horizontally stacked
 * not vertically, re-use the label style we are using in one of the interactive
 * blocks inside trainee modules (case scenario block)"*, then *"use shadow
 * also"*).
 *
 * Imported rather than reimplemented, and not restyled on the way in. It is a
 * 44-radius pill split into a coloured cap carrying the white initial and a
 * white body carrying the name, on `shadow-siptea-chip` — every one of those
 * values was measured against frame `3214:19765`, and a lookalike built here
 * would drift the first time that frame is re-exported. A trainee meets this
 * chip inside the module player when a case scenario is answered; meeting the
 * same object again when reflecting on the same six components is the point.
 *
 * It also settles the contrast question this file previously carried: white on
 * golden amber is 2.04:1 and fails, and a direct instruction of 2026-09-28
 * already covers it — *"ignore the contrast check for SIPTEA labels"*. What
 * makes that defensible rather than merely instructed is the same thing here as
 * there: the initial is `aria-hidden` and the component is named in full beside
 * it, so the letter is never the only carrier of the meaning.
 */

/**
 * A previous timepoint's answer, in the recall column beside the writing box.
 *
 * `purple-50` ground (direct instruction), which is also what separates it from
 * the `parchment` box opposite: one is a thing to read, the other a thing to
 * fill in, and at a glance the colour is the only cue that says which. The
 * `parchment` stroke (direct instruction: *"add off white outline to the purple
 * box"*) is the same off-white 1px the `Card` component carries by default, so
 * the panel is outlined the way every other surface in this app is rather than
 * carrying a border of its own invention.
 *
 * The title is the user's own wording — *"here is what you said before"* —
 * rather than Notion's longer "Here is what you said earlier about {Component}:".
 * The component is already named by the chip at the top of the screen, so
 * repeating it here was the third mention in 200px. The **stage** is named
 * instead, which Notion's version does not do and which endline needs: two of
 * these stack there, and "what you said before" twice would not say which
 * before.
 */
/**
 * One recalled answer, shown at midline and endline.
 *
 * **Fixed height with a "show more" affordance** (direct instruction,
 * 2026-10-05), modelled on the collapsed-message pattern the user pointed at:
 * a subtle fade over the bottom of the text and a *Show more* control at the
 * bottom left, which scrolls rather than expands, and which disappears once
 * there is nothing left below.
 *
 * Why fixed rather than growing: endline stacks two of these **side by side**
 * above a writing box inside one fixed-height panel. Letting either grow to its
 * content pushes the footer off a short laptop, which is the failure this
 * modal's own one-fixed-height rule exists to prevent.
 *
 * The fade is `pointer-events-none` so it never swallows a click on the text
 * beneath it, and it is painted from `purple-50` — the panel's own fill — so it
 * reads as the text passing under an edge rather than as a grey band.
 */
function EarlierAnswer({ stage, answer }: { stage: string; answer: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)

  /* Recompute on mount, on scroll and on resize: whether there is more below
     depends on the box's width, and at endline these two boxes reflow from
     side-by-side to stacked at 768px. */
  const sync = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const remaining = el.scrollHeight - el.clientHeight - el.scrollTop
    setMore(remaining > 4)
  }, [])

  useEffect(() => {
    sync()
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [sync, answer])

  return (
    /* 248px. Settled after three passes: 168 (reported cramped) -> 220 -> 280
       ("increase purple box height also") -> **-32px** here. The panel became a
       scroller by direct instruction, so height costs only scroll depth; this
       is the point where short answers still fit whole — "Show more" appears on
       a long answer rather than on every one, which is what makes it read as
       deliberate instead of everything being cut off. */
    <div className="relative flex h-[248px] min-w-0 flex-1 flex-col overflow-hidden rounded-sm border border-parchment bg-purple-50">
      {/* The stage label sits **outside** the scroller, so it stays put while
          the answer scrolls under it. With two of these side by side at endline
          the stage is the only thing telling them apart, and scrolling it out
          of view leaves a trainee reading an answer with no idea which stage it
          came from. "Fixed height, content scrolls" means the *content*.

          Named in full (direct instruction: *"say your answer for <Stage C:
          <name>>"*). `stageFullName` derives it from the trainee rail's own
          copy, so the two cannot drift.

          `purple-200` fill with `purple-500` text — the settled pairing after
          three passes (`purple-200`/`ink`, then `purple-500`/white, then
          `purple-50`/`purple-500`). The fill is a step darker than the
          `purple-50` panel behind it, so the pill reads as a pill. */}
      <p className="flex shrink-0 flex-wrap items-center gap-2 px-4 pt-4 text-caption-medium text-ink-muted">
        {/* Just "For" (direct instruction, 2026-10-05) — the panel is already
            inside "Here is what you said earlier about X", so "Your answer for"
            repeated what the line above had said. The colon stays after the
            pill so the pill holds the stage name alone. */}
        For
        <span className="inline-flex min-w-0 items-center gap-1">
          {/* `py-1.5` (direct instruction: *"increase purple button
              height"*), up from `py-0.5`. */}
          <span className="rounded-full bg-purple-200 px-2.5 py-1.5 text-fine text-purple-500">
            {stage}
          </span>
          <span aria-hidden="true">:</span>
        </span>
      </p>

      <div ref={scrollRef} onScroll={sync} className="mt-3 min-h-0 flex-1 overflow-y-auto px-4">
        {/* `whitespace-pre-line` so a trainee's own paragraph breaks survive
            being read back to them. `pb-10` keeps the last line clear of the
            fade so it is never half-hidden behind it. */}
        <p className="pb-10 text-body whitespace-pre-line text-ink">
          {answer.trim() || <span className="text-ink-faint">You did not answer this one.</span>}
        </p>
      </div>

      {more && (
        /* A **solid** bar behind the control, with the gradient easing into it
           above (direct instruction, 2026-10-05: *"the text behind show more is
           still visible, making it hard to read as button or even text"*). The
           previous version was gradient-only, so the answer kept running under
           the label and both became hard to read.

           The wrapper is `pointer-events-none` so the fade never swallows a
           click on the text beneath it; only the bar holding the button takes
           pointer events back. */
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <span
            aria-hidden="true"
            className="block h-10 bg-gradient-to-t from-purple-50 to-transparent"
          />
          <div className="pointer-events-auto flex items-center bg-purple-50 px-2 pb-1">
            {/* Ghost button: underline on hover, colour unchanged, no fill —
                the app-wide rule in `components/shared/buttonStyles.ts`. Not
                the shared pill constant, because this is a 36px inline control
                inside a fixed-height box rather than a footer action. */}
            <button
              type="button"
              onClick={() => {
                const el = scrollRef.current
                if (!el) return
                el.scrollBy({ top: el.clientHeight - 48, behavior: 'smooth' })
              }}
              className="inline-flex h-9 items-center rounded-sm px-2 text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Show more
              <span className="sr-only"> of your {stage} answer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * The review table.
 *
 * Deliberately **not** `ReflectionReviewTable` from `AddAnnotationSummaryModal`,
 * despite the near-identical shape: that component maps over *its own* `STEPS`
 * constant to label each row, so it renders the coach wizard's six component
 * labels regardless of what it is handed. The labels happen to match today,
 * which is precisely what makes reusing it dangerous — the coupling is
 * invisible, and the day someone edits the coach wizard's labels this screen
 * changes with no indication why. Giving that component a labels prop would
 * mean editing a signed-off file to serve a caller it was not built for.
 */
function ReviewTable({
  answers,
  onEdit,
}: {
  answers: ReflectionAnswers
  onEdit: (index: number) => void
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-parchment shadow-card">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-purple-50">
            {/* 34%. `layout-audit.js` reports all six row headers as "wrapped
                onto 3 lines" here and it is a **false positive**, verified by
                measurement: each name returns a single client rect 17px tall in
                a 348px column. The check reads descendant rect-tops, and the
                24px disc and the 17px name sit at different y inside one flex
                row — the same false-positive class Round 21.1 documented for
                the consumer table's inline chip cell. Recorded in
                `design/layout-audit.js` rather than widened away: the answer
                column is the one that wants the extra room. */}
            <th scope="col" className="w-[34%] px-4 py-3.5 text-caption-medium text-ink-muted">
              SIPTEA component
            </th>
            <th scope="col" className="px-4 py-3.5 text-caption-medium text-ink-muted">
              Your answer
            </th>
          </tr>
        </thead>
        <tbody>
          {SIPTEA_INITIALS.map((initial, i) => (
            <tr key={initial} className={cn(i > 0 && 'border-t border-hairline')}>
              {/* A row header, not a plain cell — the component is what the
                  answer is *about*, which is what `scope="row"` tells a screen
                  reader reading across. */}
              <th
                scope="row"
                className="px-4 py-3 text-left align-top text-caption-medium font-medium text-ink"
              >
                {/* `min-w-0` on the name: a flex child defaults to
                    `min-width: auto`, so without it the name cannot wrap
                    inside its own box and pushes the row instead. */}
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-fine text-white',
                      SIPTEA_BG[initial],
                    )}
                  >
                    {initial}
                  </span>
                  <span className="min-w-0">{SIPTEA_NAMES[initial]}</span>
                </span>
              </th>
              <td className="px-4 py-3 align-top">
                <p className="text-caption whitespace-pre-line text-ink">
                  {answers[i]?.trim() || (
                    <span className="text-ink-faint">Not answered yet.</span>
                  )}
                </p>
                {/* Editing goes back to the question's own screen rather than
                    opening a textarea here. The midline and endline screens
                    carry the earlier answers the question depends on, and an
                    inline field would ask the trainee to revise an answer with
                    the thing it is a response to no longer in front of them. */}
                <button
                  type="button"
                  onClick={() => onEdit(i)}
                  className="-mx-2 mt-1 inline-flex h-9 items-center rounded-sm px-2 text-caption-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Edit
                  <span className="sr-only"> {SIPTEA_NAMES[initial]}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── The modal ──────────────────────────────────────────────────────────── */

export function TraineeReflectionModal({
  open,
  timepoint,
  onClose,
  onSubmitted,
}: {
  open: boolean
  timepoint: ReflectionTimepoint
  /**
   * Called on every close path. The draft has already been written by then.
   *
   * `submitted` tells the page where focus has to go next, which it cannot work
   * out for itself: the control that opened this modal is the banner's CTA, and
   * on a submit that CTA unmounts with the banner while on a cancel it is still
   * there. Measured — without this, Save-and-close landed on `<body>`, because
   * `ConfirmDialog` restores focus to the Cancel button that has just unmounted
   * with the panel around it.
   */
  onClose: (opts: { submitted: boolean }) => void
  /** Called once, after the trainee closes the thank-you screen — not on
   *  submit. The banner's own state change is the last thing that happens, so
   *  the thank-you is not yanked out from under them. */
  onSubmitted: () => void
}) {
  const { drafts } = useReflectionState()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<ReflectionAnswers>(emptyAnswers)
  const [cancelOpen, setCancelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const focusedScreen = useRef<string | null>(null)
  const hasSubmitted = useRef(false)

  /**
   * Lock the page behind the modal.
   *
   * Without this the wheel chains to the document as soon as the panel's own
   * scroller hits an end, so the page slides around underneath an open dialog.
   * Same approach as `DeliveryTour` and the two consumer overlays: `overflow:
   * hidden` on the root rather than a wheel blocker, so *user* scrolling stops
   * while programmatic scrolling (focus, `scrollIntoView`) still works. The
   * body padding compensates for the removed scrollbar, without which the page
   * jumps ~15px wider the instant the modal opens.
   */
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const scrollbar = window.innerWidth - root.clientWidth
    const prevOverflow = root.style.overflow
    const prevPad = document.body.style.paddingRight
    root.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      root.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPad
    }
  }, [open])

  /* Seed from the draft when the modal opens, not on every render. Keyed on
     `open` rather than initialised lazily: the component stays mounted across
     opens (see the AnimatePresence note below), so a lazy initialiser would run
     once ever and the second open would show the first one's answers. */
  useEffect(() => {
    if (!open) return
    setAnswers(drafts[timepoint] ? [...drafts[timepoint]!] : emptyAnswers())
    /* A resumed reflection skips the welcome. The banner that opened it
       already said "Resume my reflections", and re-explaining the flow to
       someone part-way through it is friction, not orientation. */
    setStep(drafts[timepoint] ? 0 : WELCOME_STEP)
    setCancelOpen(false)
    focusedScreen.current = null
    hasSubmitted.current = false
    // `drafts` is deliberately not a dependency: re-seeding mid-edit would wipe
    // what the trainee is typing the moment the draft store emits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, timepoint])

  const screen = screenFor(step)
  const anyAnswered = answers.some((a) => a.trim())

  /**
   * Focus the incoming screen's heading — as a **callback ref**, not an effect.
   * See this file's own doc comment: under `mode="wait"` an effect keyed on the
   * step fires against the outgoing screen and focus ends on `<body>`.
   *
   * Guarded on a key rather than a boolean so it fires once per screen: React
   * re-invokes a callback ref whenever the identity changes, and without the
   * guard a re-render mid-typing would steal focus back to the heading.
   */
  const headingRef = useCallback(
    (node: HTMLHeadingElement | null) => {
      const key = `${step}`
      if (!node || focusedScreen.current === key) return
      focusedScreen.current = key
      node.focus({ preventScroll: true })
    },
    [step],
  )

  const setAnswer = (index: number, value: string) =>
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })

  /** Every close path goes through here, so no route out loses typing. The
   *  thank-you screen is past the point of drafting — the answers are already
   *  submitted and the draft cleared. */
  const closeWithDraft = () => {
    if (screen.kind === 'thanks') {
      onClose({ submitted: true })
      if (hasSubmitted.current) onSubmitted()
      return
    }
    saveReflectionDraft(timepoint, answers)
    onClose({ submitted: false })
  }

  /**
   * Cancel **always** confirms (direct instruction, 2026-10-05: *"for when I
   * click cancel ask for confirmation"*).
   *
   * It used to skip the dialog when nothing had been typed, on the reasoning
   * that there was nothing to resume and the confirm was pure friction. That
   * reasoning was wrong about what the trainee is being asked: leaving is the
   * consequential act here, not losing a draft — this reflection is a required
   * part of the pathway, and a Cancel that simply closes gives no chance to
   * notice the click was a mistake.
   *
   * The thank-you screen is still exempt: the answers are already submitted,
   * its only control is labelled "Close", and confirming a close after a
   * completed submission would be friction with nothing behind it.
   */
  const requestCancel = () => {
    if (cancelOpen) return
    if (screen.kind === 'thanks') {
      closeWithDraft()
      return
    }
    setCancelOpen(true)
  }

  const trapKeys = (e: React.KeyboardEvent) => {
    if (cancelOpen) return
    if (e.key === 'Escape') {
      requestCancel()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled])',
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

  const handleSubmit = () => {
    submitReflection(timepoint, answers)
    hasSubmitted.current = true
    setStep(THANKS_STEP)
  }

  /* Direction drives the slide, so going Back reads as going back rather than
     as another forward step. Held in a ref: it is read during the next render's
     animation and must not itself trigger one. */
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

  const heading =
    screen.kind === 'thanks'
      ? 'Thank you for sharing your reflection'
      : screen.kind === 'review'
        ? 'Review your answers'
        : screen.kind === 'welcome'
          ? `Your ${TIMEPOINT_NAME[timepoint].toLowerCase()}`
          : `${TIMEPOINT_NAME[timepoint]}`

  return (
    <>
      {/* AnimatePresence stays mounted regardless of `open`, gating its
          *content* instead — the pattern `ConfirmDialog` and
          `AddAnnotationSummaryModal` both use. Unmounting AnimatePresence
          across opens makes framer-motion lose track of its previous children
          and emit duplicate-key errors on every reopen. */}
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
                aria-label={heading}
                /* One fixed height for every screen. The six questions differ
                   in length — endline carries two quoted answers above the
                   prompt, baseline none — and a panel that resized per step
                   would move the Next button under the trainee's cursor on
                   every advance. The content region scrolls instead. */
                className="pointer-events-auto flex h-[85vh] max-h-[760px] w-full max-w-[860px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline md:p-8"
              >
                {/* The stepper is hidden on the thank-you screen: the flow is
                    over, and a full bar above "thank you" invites a reader to
                    look for a seventh step. */}
                {screen.kind !== 'thanks' && screen.kind !== 'welcome' && (
                  <div className="flex shrink-0 flex-col gap-4">
                    {/* **No clamp.** `Math.min(step, 5)` used to pin the bar
                        to the last question, so the review screen rendered
                        circle 6 as *current* — visually identical to being on
                        question 6 (Action and goals), which is the two steps
                        reading as one. Passing `step` straight through means
                        review is `6`, every circle satisfies `done`, and all
                        six show a green tick with nothing marked current. The
                        screen's own heading says Review; the bar's job here is
                        only to say the questions are behind you. */}
                    <StepBar step={step} />
                    {/* `sr-only`, not deleted (direct instruction: *"remove
                        steps from below progress bar"* — the numbered circles
                        above already say it, so the line was the same fact
                        twice). It cannot simply go: the bar itself is
                        `aria-hidden`, so this is the only thing telling a
                        screen reader where in the flow they are. */}
                    <p role="status" className="sr-only">
                      {screen.kind === 'review'
                        ? 'Review'
                        : `Step ${screen.index + 1} of ${REFLECTION_STEP_COUNT}`}
                    </p>
                  </div>
                )}

                {/* `flex flex-col` on the scroller is what lets the question
                    screen's textarea claim the leftover height: without it the
                    child sizes to its content and `flex-1` inside it has
                    nothing to divide. It still scrolls when content exceeds the
                    panel (the endline screen, with two quoted answers above the
                    question). `mt-10` is the enlarged gap under the stepper. */}
                <div
                  className={cn(
                    'flex min-h-0 flex-1 flex-col overflow-y-auto pr-1',
                    /* `mt-10` is the enlarged gap under the stepper. The
                       welcome and thank-you screens have no stepper above
                       them, so reserving it would push both down by 40px. */
                    screen.kind !== 'welcome' && 'mt-10',
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={slide.initial}
                      animate={slide.animate}
                      exit={slide.exit}
                      transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.4, 0, 0.2, 1] }}
                      /* The panel is one fixed height for every screen, so the
                         thank-you — by far the shortest — would otherwise sit
                         pinned to the top of a tall empty box. `min-h-full`
                         rather than `h-full`: it centres while the content is
                         short and still grows and scrolls if it is not. */
                      className={cn(
                        'flex flex-col gap-6',
                        /* ⚠️ The review screen must NOT be `flex-1 min-h-0`.
                           Inside the `overflow-y-auto` parent, that pair let
                           this wrapper shrink to the scroller's own height, so
                           a six-row review table was clipped at the panel edge
                           and the scroller's `scrollHeight` never grew past its
                           `clientHeight` — nothing scrolled, and the wheel fell
                           through to the page behind. Reported live as "cant
                           scroll to review my answers, the background page
                           scrolls". `shrink-0` keeps its natural height so the
                           scroller actually has something to scroll.

                           The question screens still need `flex-1 min-h-0`:
                           that is what lets the textarea claim the panel's
                           remaining height. */
                        screen.kind === 'review' ? 'shrink-0' : 'min-h-0 flex-1',
                        (screen.kind === 'thanks' || screen.kind === 'welcome') &&
                          'min-h-full justify-center',
                      )}
                    >
                      {screen.kind === 'welcome' && (
                        <WelcomeScreen headingRef={headingRef} timepoint={timepoint} />
                      )}

                      {screen.kind === 'question' && (
                        <QuestionScreen
                          headingRef={headingRef}
                          timepoint={timepoint}
                          initial={SIPTEA_INITIALS[screen.index]}
                          index={screen.index}
                          value={answers[screen.index] ?? ''}
                          onChange={(v) => setAnswer(screen.index, v)}
                          /* **Dummy, deliberately** (direct instruction: "dont
                             wire previous stage answers that I end up
                             writing"). `DUMMY_EARLIER` is the one place this
                             wizard does not read its own store — see that
                             constant for the one-line change that wires it. */
                          earlier={QUOTES_BACK[timepoint].map((tp) => ({
                            tp,
                            answer:
                              tp === 'endline'
                                ? ''
                                : DUMMY_EARLIER[tp][SIPTEA_INITIALS[screen.index]],
                          }))}
                        />
                      )}

                      {screen.kind === 'review' && (
                        /* Not `flex-1`: the review's table is as tall as it is,
                           and stretching it would space six rows across the
                           panel. It sits at the top and scrolls. */
                        <>
                          <div className="flex flex-col gap-2">
                            <h2
                              ref={headingRef}
                              tabIndex={-1}
                              className="font-display text-title text-ink outline-none"
                            >
                              Review your answers
                            </h2>
                            {/* No share control. Notion, coach page: "all
                                reflections are shared compulsorily with the
                                researchers" — so a toggle would offer a choice
                                the study does not give. Said plainly instead of
                                left implied. */}
                            <p className="text-body leading-[1.4] text-ink-muted">
                              Check each answer before you share it with the research team.
                            </p>
                          </div>
                          <ReviewTable answers={answers} onEdit={(i) => go(i)} />
                        </>
                      )}

                      {screen.kind === 'thanks' && (
                        <div className="flex flex-col items-center gap-6 py-6 text-center">
                          <ThanksMascot />
                          <div className="flex flex-col gap-2">
                            <h2
                              ref={headingRef}
                              tabIndex={-1}
                              className="font-display text-display-md text-ink outline-none"
                            >
                              Thank you for sharing your reflection
                            </h2>
                            <p className="text-body leading-[1.4] text-ink-muted">
                              Your {TIMEPOINT_NAME[timepoint].toLowerCase()} has been shared with
                              the research team.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer. Fixed at the panel's foot rather than scrolling with
                    the content, so the controls are reachable at any height —
                    the Round 33 lesson from the module player's own footer.

                    `MODAL_FOOTER_SURFACE` is the app-wide treatment Round 17.2
                    extracted (direct instruction, 2026-10-02: *"make sure the
                    pop-up modal footer is consistent with other pop-up
                    modals"*) — a full-bleed `pearl` bar closing the panel's own
                    rounded corners, shared with all five wizard-shaped modals.
                    The wide variant, not `_COMPACT`: this panel is `p-6 md:p-8`
                    like the wizards, not `ConfirmDialog`'s `p-6`-only. The
                    panel already carries `overflow-hidden`, which that constant
                    requires so the negative margins do not poke past the
                    corners. */}
                <div
                  className={cn(
                    MODAL_FOOTER_SURFACE,
                    'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3',
                  )}
                >
                  {screen.kind === 'thanks' ? (
                    <>
                      <span />
                      <button type="button" onClick={closeWithDraft} className={PILL_PRIMARY}>
                        Close
                      </button>
                    </>
                  ) : screen.kind === 'welcome' ? (
                    /* No Back: the welcome is a one-time orientation, not a
                       step, and there is nothing behind it. "Get started"
                       rather than "Next" matches `PlanSessionsModal`'s intro,
                       the one precedent this screen is modelled on. */
                    <>
                      <button type="button" onClick={requestCancel} className={GHOST_BUTTON_MUTED}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => go(step + 1)}
                        className={PILL_PRIMARY}
                      >
                        Get started
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={requestCancel} className={GHOST_BUTTON_MUTED}>
                        Cancel
                      </button>
                      <div className="flex flex-wrap items-center gap-3">
                        {step > 0 && (
                          <button
                            type="button"
                            onClick={() => go(step - 1)}
                            className={PILL_OUTLINE}
                          >
                            Back
                          </button>
                        )}
                        {screen.kind === 'review' ? (
                          <button type="button" onClick={handleSubmit} className={PILL_PRIMARY}>
                            Share reflection
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
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel keeps the answers — hence "Save and close", not "Discard".
          Nothing is thrown away on this path, and a destructive label would be
          a lie about what the button does. */}
      <ConfirmDialog
        open={cancelOpen}
        title="Leave this reflection for now?"
        /* Two bodies, because one of them would otherwise be a quiet untruth.
           Cancel now fires with nothing typed (see `requestCancel`), and
           "Your answers are saved" is false when there are none. The promise
           that survives both cases is that the reflection is still waiting.

           "You can come back and finish this" replaces "you can pick up where
           you left off" — the idiom is three words doing one verb's work and
           the first thing to break in translation, and it is the same sentence
           the welcome screen makes, so both now use one phrase for one idea. */
        body={
          anyAnswered
            ? 'Your answers are saved. You can come back and finish this from your dashboard.'
            : 'You have not answered anything yet. You can come back to this reflection from your dashboard.'
        }
        confirmLabel={anyAnswered ? 'Save and close' : 'Close'}
        /* One label at every step and in both states (direct instruction,
           2026-10-05). It was briefly "Start answering" with nothing typed and
           "Keep answering" once something was — two words for one control,
           which is the inconsistency the instruction was about. */
        cancelLabel="Resume answering"
        onConfirm={() => {
          setCancelOpen(false)
          closeWithDraft()
        }}
        onClose={() => setCancelOpen(false)}
      />
    </>
  )
}

/**
 * The welcome screen (direct instruction, 2026-10-05: *"for all reflections
 * (after stage C, O, H), we need a welcome screen with a short instruction
 * blurb i.e. what trainee needs to do"*).
 *
 * Shape follows `PlanSessionsModal`'s own intro, this app's only existing
 * precedent for a wizard welcome: heading, one short paragraph, then a row of
 * numbered steps describing the flow. Every string comes from
 * `data/traineeReflections.ts`, which owns the copy for this whole flow.
 *
 * The blurb is **per timepoint** because the task genuinely differs; the step
 * row and the reassurance line are shared, because the flow does not.
 *
 * `min-w-0` on the row and its cells is not decoration: an `<ol>` of three
 * 180px columns inside a fixed-width panel will otherwise size the track to
 * its widest child and push the document into horizontal scroll, which this
 * project has shipped three times (Rounds 21.1, 30, 34).
 */
function WelcomeScreen({
  headingRef,
  timepoint,
}: {
  headingRef: (el: HTMLHeadingElement | null) => void
  timepoint: ReflectionTimepoint
}) {
  const icons = [PenLine, ListChecks, Send]

  return (
    /* `gap-14` (56px), up from 40 by direct instruction. With the
       reassurance line gone this is the screen's only gap, so it reads as one
       deliberate step between the copy and the timeline rather than a rhythm. */
    <div className="flex flex-col items-center gap-14 px-2 text-center">
      <div className="flex w-full min-w-0 flex-col items-center gap-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-balance font-display text-display-md text-ink outline-none"
        >
          Your {TIMEPOINT_NAME[timepoint].toLowerCase()}
        </h2>
        <p className="max-w-[620px] text-balance text-body leading-[1.5] text-ink-muted">
          {WELCOME_BLURB[timepoint]}
        </p>
      </div>

      <div className="relative isolate">
        {/* Runs between the first and last circle centres: 180px columns with a
            48px gap, so half a column (90px) lands it exactly on both. Behind
            the circles via `-z-10`, and 2px rather than a hairline, which read
            as too thin at this size on `PlanSessionsModal`'s own intro.

            Hidden on the stacked layout: a horizontal rule joining three
            vertically stacked steps points at nothing. */}
        <span
          aria-hidden="true"
          className="absolute top-[27px] right-[90px] left-[90px] -z-10 hidden h-0.5 bg-hairline min-[640px]:block"
        />
        {/* The row is 3x180 + 2x48 = 636px, which does not fit the panel below
            ~640px of viewport: measured at 375, the `<ol>` was 636px inside a
            418px scroller and the third step was clipped out of reach. It
            stacks instead. Written as `min-[640px]:` rather than `sm:` to match
            this project's own convention for responsive variants. */}
        {/* `items-stretch`, not `items-start` (direct instruction, 2026-10-05:
            *"text wrap all steps"*). The three descriptions are 1, 2 and 3
            lines, so a start-aligned row ended at three different heights and
            read as ragged. Stretching makes every column the height of the
            tallest, which is also what this project's own `layout-audit.js`
            checks for across 3+ sibling tiles. */}
        <ol className="flex min-w-0 flex-col items-center gap-8 min-[640px]:flex-row min-[640px]:items-stretch min-[640px]:justify-center min-[640px]:gap-12">
          {WELCOME_STEPS.map((s, i) => {
            const Icon = icons[i]
            return (
              <li
                key={s.label}
                className="flex w-full min-w-0 max-w-[280px] flex-col items-center gap-4 min-[640px]:w-[180px] min-[640px]:max-w-none"
              >
                <span
                  aria-hidden="true"
                  className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-purple-50 text-primary"
                >
                  <Icon className="size-6" strokeWidth={1.75} />
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

    </div>
  )
}

/**
 * One question screen.
 *
 * Spacing is three deliberate steps rather than one shared `gap` (direct
 * instruction: *"increase vertical space between the progress bar, label,
 * question and text box. Text box and question should be closer"*): 40px under
 * the stepper, 32px under the label, and **12px** between the question and the
 * box it is asking you to fill. The small gap is the point — the question and
 * the field are one unit, and the large gaps above separate that unit from the
 * chrome.
 *
 * **The box fills the panel's remaining height** (direct instruction: *"there
 * is a lot of deadspace below the freetext box, use that space"*). The panel is
 * one fixed height for every screen, so the slack varies — baseline has none
 * above the question, endline carries two quoted answers — and a fixed `rows`
 * left a different-sized hole on each. `flex-1` with a `min-h` floor means the
 * box takes whatever is left and never collapses when there is nothing left to
 * take.
 */
function QuestionScreen({
  headingRef,
  timepoint,
  initial,
  index,
  value,
  onChange,
  earlier,
}: {
  headingRef: (node: HTMLHeadingElement | null) => void
  timepoint: ReflectionTimepoint
  initial: SipteaInitial
  index: number
  value: string
  onChange: (value: string) => void
  earlier: { tp: ReflectionTimepoint; answer: string }[]
}) {
  const fieldId = `trainee-reflection-${index}`
  const hasRecall = earlier.length > 0
  return (
    /* The gap between the box and the footer bar, and it is **not the same at
       every timepoint** (direct instruction, 2026-10-05: *"increase the white
       space between the text box and footer (this is only for stage C) by
       ~32px"*).

       Baseline has nothing above the question, so its box runs the full height
       of the panel and sits hard against the footer; midline and endline carry
       a recall panel that already shortens it. So baseline takes `pb-10` (40px
       + the footer's own `mt-6` = **64px**) and the recall timepoints keep
       `pb-2` (8 + 24 = **32px**).

       Measured at each step rather than computed, because the footer carries
       its own margin and this was wrong twice before anyone measured it:
       `pb-16` gives 88 and `pb-10` gives 64. It rides the column rather than
       the textarea's own margin so the box's height resolves against the
       reduced space; a margin would let the box claim the full height and then
       push the gap off the panel. */
    <div className={cn('flex flex-col', hasRecall ? 'shrink-0 pb-2' : 'min-h-0 flex-1 pb-10')}>
      {/* Centred (direct instruction). The chip is an inline-flex pill, so the
          row around it is what centres it. */}
      <div className="flex justify-center">
        <SipteaSkillChip initial={initial} size="sm" />
      </div>


      {/* Midline and endline, rebuilt 2026-10-05 to follow Notion's own order
          (direct instruction: *"after siptea label, first state the line …
          then show the purple box … after this add the text line again"*).

          Notion writes one block per component:
            "Here's what you said earlier about Shared Understanding:
             [trainee's answer Stage C].
             Has your understanding of this grown or changed since then?"

          So the screen is now a **vertical stack**, not the two-column grid it
          was: lead-in -> recalled answer(s) -> the numbered growth prompt ->
          the box you type in. The previous layout put the question above both
          columns and the recall beside the writing box, which read as two
          parallel things rather than one sentence you read top to bottom. */}
      {hasRecall && (
        /* Same type as the question below it (direct instruction,
           2026-10-05: *"the here is what you said earlier title match the
           question title below"*) — they are the two halves of one block, and
           a lighter, smaller lead-in read as a caption for the purple boxes
           rather than as the sentence the question completes. */
        <p className="mt-8 font-display text-title text-ink">{recallLeadIn(initial)}</p>
      )}

      {hasRecall && (
        /* **Horizontal** at endline (direct instruction) — the two recalled
           answers sit side by side, each at the same fixed height, each
           scrolling its own content. Fixed rather than natural height because
           endline stacks two real answers above a writing box inside one fixed
           panel; letting them grow pushes the footer off a short laptop.

           Stacks below 768px: two of these in a 375px panel leaves ~150px of
           reading width each, which is not a column you can read a paragraph
           in. They keep their fixed height when stacked, so the promise holds
           either way. */
        <div className="mt-5 flex shrink-0 flex-col gap-5 min-[768px]:flex-row">
          {earlier.map((e) => (
            <EarlierAnswer key={e.tp} stage={stageFullName(e.tp)} answer={e.answer} />
          ))}
        </div>
      )}

      {/* The question. At baseline it is the screen's only text; at midline and
          endline it is the growth prompt, and it carries the number because it
          is the line directly above the box being answered (direct
          instruction). */}
      <h2
        ref={headingRef}
        tabIndex={-1}
        /* `mt-10` after a recall block (direct instruction: *"add vertical
           space between the purple box and question that follows"*), up from
           24px. */
        className={cn('font-display text-title text-ink outline-none', hasRecall ? 'mt-10' : 'mt-8')}
      >
        {/* **Unnumbered** (direct instruction, 2026-10-05: *"remove the
            numbers, its confusing"*) — this reverses the numbering added
            earlier the same day. With a lead-in line above the recall boxes and
            the question below them, a number on the question read as labelling
            the third thing on screen rather than the component. The stepper
            above already gives the position, and the `sr-only` "Step N of 6"
            carries it for a screen reader.

            Left-aligned and unbalanced — see the instructions at the chip. */}
        <label htmlFor={fieldId} className="block text-left">
          {questionFor(timepoint, initial)}
        </label>
      </h2>

      <textarea
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        /* `resize-none`, not `resize-y`: the box already takes every spare
           pixel, so a drag handle offers to grow something that cannot grow
           without pushing the footer off the panel. */
        /* At baseline the box takes the panel's spare height (`flex-1`).
           With a recall block above it, it takes a **fixed** height instead and
           the screen is allowed to overflow into the panel's own scroller
           (direct instruction: *"keeping the parent pop-up modal height same,
           its fine if it becomes a scroller"*). Keeping `flex-1` there would
           squeeze the writing box smaller the more there is to recall, which is
           backwards — endline has the most to read and the most to say. */
        className={cn(
          'mt-3 w-full min-w-0 resize-none rounded-sm border border-hairline bg-parchment px-4 py-3 text-body text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring',
          hasRecall ? 'h-[180px] shrink-0' : 'min-h-[140px] flex-1',
        )}
        placeholder="Write your answer here."
      />
      {/* No required-field blocking. These are reflective questions, and a
          trainee who has nothing to say about one component should be able to
          move past it and come back — the review screen shows every gap, which
          is the honest place to surface it. */}
    </div>
  )
}
