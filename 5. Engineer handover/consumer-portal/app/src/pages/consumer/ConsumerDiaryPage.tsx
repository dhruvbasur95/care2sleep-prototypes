import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { TODAY, formatDateLong } from '@/data/format'
import {
  SLEEP_DIARY_QUESTIONS,
  type SleepDiaryAnswers,
  type SleepDiaryQuestion,
} from '@/data/spaces'
import {
  CompletionHero,
} from '@/components/consumer/ConsumerCompletionHero'
import { ConsumerFlowFooter } from '@/components/consumer/ConsumerFlowFooter'
import { ConsumerContentReveal } from '@/components/consumer/ConsumerCanvasWave'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

/**
 * Consumer sleep diary fill-in flow — Round 44.
 *
 * Frames: `811:10934` / `792:4292` (welcome, desktop / iPhone SE),
 * `811:10747` / `805:9508` + the `810:*` series (questions), `812:11076` /
 * `814:11665` (thank you). No tablet frames were supplied — tablet is the
 * desktop layout on the fluid type scale (§85.1), which is what every other
 * consumer surface already does between 640 and 1280.
 *
 * One route (`/consumer/:dyadId/diary`), three stages in page state:
 * welcome -> the 9 directly-answered Consensus Sleep Diary questions -> thank
 * you. The questions, their order, their answer fields and their number/time
 * formats all come from `SLEEP_DIARY_QUESTIONS` in `data/spaces.ts` — the
 * researcher's table, the coach's summary and this questionnaire read one
 * list, so they cannot drift (the reason the list moved out of
 * `ConsumerDetailPage` this round).
 *
 * ── Input formats (the "best industry practice" pass) ────────────────────
 *
 * Numbers are `type="text" inputmode="numeric"`, not `type="number"`: the
 * numeric keypad still comes up on a phone, but there is no spinner to nudge
 * a value by accident, no scroll-wheel silently changing an answer under the
 * pointer, and no `e`/`+`/`-` characters a number field legally accepts —
 * all three are documented failure modes for older, less digitally literate
 * users, which is exactly this portal's audience note. Non-digits are
 * stripped on input rather than rejected on submit.
 *
 * Times are native `type="time"`: iOS and Android hand these to their own
 * wheel/clock pickers, which is the most familiar, largest-target time entry
 * this audience has; desktop browsers render segmented HH:MM fields matching
 * the frame's own "HH : MM" placeholder. The data model stores the diary's
 * paper-format "h:mm am/pm" strings, so values convert on submit
 * (`to12Hour`), never in the field.
 *
 * ── Motion ────────────────────────────────────────────────────────────────
 *
 * Only the question block animates. The chrome a reader anchors on — header,
 * progress row, Back/Next — never moves, so the eye has a fixed frame around
 * the change (the same reasoning as the module player's persistent footer).
 * Steps slide in the direction of travel (Next: in from the right; Back: in
 * from the left) with the answer rows staggering a beat behind the question,
 * and the progress fill runs on a spring. Everything collapses to a plain
 * crossfade under `prefers-reduced-motion`.
 *
 * Focus moves to the incoming question's heading on every step change —
 * announced step changes rather than silence is this project's
 * most-repeated defect class, fixed here the same way `SlideLayout` does it.
 */

/* ------------------------------------------------------------------------ */
/* Constants                                                                 */
/* ------------------------------------------------------------------------ */

/** The 9 directly-answered questions, in order — the questionnaire's steps. */
const QUESTIONS = SLEEP_DIARY_QUESTIONS.filter(
  (q): q is SleepDiaryQuestion & { field: keyof SleepDiaryAnswers } => !q.computed && !!q.field,
)

/** This portal's own pill CTA (Home's `CTA` constant, duplicated classes —
 *  same geometry: 48px pill, `text-body-md`). */
const CTA =
  'flex h-12 items-center justify-center rounded-3xl px-5 text-body-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2'

const CTA_PRIMARY = `${CTA} bg-consumer-primary text-white`
const CTA_OUTLINE = `${CTA} border-2 border-consumer-primary bg-white text-consumer-primary`

/** "22 July 2026" — the welcome line's date, from the app's frozen demo
 *  `TODAY` (the date the store writes the answers under), not the real
 *  clock. Displaying one date and saving under another is the two-surfaces
 *  disagreement this file is otherwise built to avoid. */
const DIARY_DATE = formatDateLong(TODAY).split(', ')[1]

/** "HH:MM" (a native time input's value) -> the diary's own "h:mm am/pm". */
function to12Hour(value: string): string {
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const meridiem = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${meridiem}`
}

type Stage = 'welcome' | 'questions' | 'done'
type Who = 'patient' | 'carer'
type Draft = Record<Who, Partial<Record<keyof SleepDiaryAnswers, string>>>

const ACTIVE_SCALE = 1.08
const ACTIVE_TRANSITION = { type: 'spring' as const, stiffness: 300, damping: 24 }
/**
 * Growth is anchored to the box's LEFT edge, not its centre (direct
 * instruction: "left align it for mobile and tablet so that it does not get
 * cropped out of screen").
 *
 * Centre-origin grows both ways, and on a phone the row has no room on the
 * right — the field ran past the column and the step's `overflow-x-clip` cut
 * it off. Anchoring left means the extra width only ever goes into the slack
 * that the fixed field widths below deliberately leave there.
 */
const ACTIVE_ORIGIN = 'left center'
/**
 * The numeric field's base width at each breakpoint, so the `min` label can be
 * pushed by exactly the amount the box grows.
 *
 * `scale` is a transform: it paints the box larger without reflowing anything,
 * so the unit sitting beside it stayed put and the enlarged field ran
 * underneath it. Translating the unit by the same delta keeps the pair
 * together and still costs no layout. Only the numeric questions have a unit —
 * the time fields have nothing to displace.
 */
const NUMBER_FIELD_W = { base: 136, sm: 208 }
const unitShiftFor = (wide: boolean) => (ACTIVE_SCALE - 1) * (wide ? NUMBER_FIELD_W.sm : NUMBER_FIELD_W.base)

/**
 * Selected state is a SOLID STROKE, not a filled box (direct correction: "when
 * I said solid blue state, I ment the outline stroke not the entire white
 * field"). A first pass filled the whole field purple with white text; the
 * field stays white and only its outline thickens.
 *
 * Both states keep the same full-strength `consumer-primary` border colour and
 * differ only in weight. Fading the idle border instead would have put the
 * field's only boundary under the 3:1 that a graphical indicator needs —
 * `consumer-primary/40` on white measures about 2.3:1.
 */
const FIELD_BASE =
  'min-h-11 rounded-lg border-consumer-primary bg-white text-center text-[22px] leading-[1.3] font-medium text-ink outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 px-2 py-2 sm:py-3.5'
const FIELD_ACTIVE = 'border-[3px]'
const FIELD_IDLE = 'border sm:border-2'
/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

export function ConsumerDiaryPage() {
  const { dyadId } = useParams()
  const navigate = useNavigate()
  const { consumerDyads, submitSleepDiary } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)

  const [stage, setStage] = useState<Stage>('welcome')
  const [qIndex, setQIndex] = useState(0)
  /** +1 = travelling forward (Next), -1 = back — steers the slide direction. */
  const [direction, setDirection] = useState(1)
  const [draft, setDraft] = useState<Draft>({ patient: {}, carer: {} })
  /** Round 44 left the X discarding answers with no confirmation (§87.6). */
  const [exitOpen, setExitOpen] = useState(false)
  const exitButtonRef = useRef<HTMLButtonElement | null>(null)

  /** Drives `unitShiftFor` — the numeric field's base width changes at `sm`,
   *  and the unit has to travel by whatever that field actually grows. A media
   *  query rather than a Tailwind class, because this feeds a `framer-motion`
   *  animation target rather than CSS. */
  const [wideField, setWideField] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const sync = () => setWideField(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const reducedMotion = useReducedMotion()

  const headingRef = useRef<HTMLHeadingElement | null>(null)

  // Focus the incoming step's heading on every stage/step change. An effect,
  // not rAF — rAF is throttled in a hidden/preview tab (Round 30's fix).
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [stage, qIndex])

  const members = useMemo(() => {
    if (!dyad) return []
    const rows: { who: Who; name: string }[] = []
    if (dyad.patient) rows.push({ who: 'patient', name: dyad.patient.name.split(' ')[0] })
    rows.push({ who: 'carer', name: dyad.carer.name.split(' ')[0] })
    return rows
  }, [dyad])

  if (!dyad) return <Navigate to="/consumer" replace />

  const question = QUESTIONS[qIndex]
  const total = QUESTIONS.length
  const isFirst = qIndex === 0
  const isLast = qIndex === total - 1

  const answersFor = (who: Who, field: keyof SleepDiaryAnswers) => draft[who][field] ?? ''
  const setAnswer = (who: Who, field: keyof SleepDiaryAnswers, value: string) => {
    setDraft((prev) => ({ ...prev, [who]: { ...prev[who], [field]: value } }))
  }

  /** Every present member has a non-empty answer for the current question. */
  const stepComplete = members.every((m) => answersFor(m.who, question.field).trim() !== '')

  const goHome = () => navigate(`/consumer/${dyad.id}`)

  const next = () => {
    // Round 48 — the footer's own `continueBlockedReason` now owns the "you
    // have not answered yet" affordance (`aria-disabled` plus a `BlockedHint`
    // that opens on hover, focus and tap), so the footer never calls this while
    // the step is incomplete. The guard stays: it is the only thing standing
    // between an unanswered step and `submitSleepDiary` writing `Number('')`
    // as `NaN` into the store, and a guard whose caller happens to be careful
    // is not a guard.
    if (!stepComplete) return
    if (!isLast) {
      setDirection(1)
      setQIndex((i) => i + 1)
      return
    }
    // Finish: convert the drafts into the data model's own shapes and write
    // both members in one action.
    const build = (who: Who): SleepDiaryAnswers => {
      const read = (field: keyof SleepDiaryAnswers) => draft[who][field] ?? ''
      return {
        napMin: Number(read('napMin')),
        outOfSleepWindowMin: Number(read('outOfSleepWindowMin')),
        bedtime: to12Hour(read('bedtime')),
        sleepLatencyMin: Number(read('sleepLatencyMin')),
        wakeCount: Number(read('wakeCount')),
        awakeDuringNightMin: Number(read('awakeDuringNightMin')),
        outOfBedDuringNightMin: Number(read('outOfBedDuringNightMin')),
        wakeTime: to12Hour(read('wakeTime')),
        outOfBedTime: to12Hour(read('outOfBedTime')),
      }
    }
    submitSleepDiary(dyad.id, {
      patient: dyad.patient ? build('patient') : undefined,
      carer: build('carer'),
    })
    setStage('done')
  }

  const back = () => {
    if (isFirst) return
    setDirection(-1)
    setQIndex((i) => i - 1)
  }

  /* ── Motion variants ──────────────────────────────────────────────────── */

  // The step block slides in the direction of travel; under reduced motion it
  // crossfades in place. `custom` carries the direction so the exiting step
  // reads it at exit time, not the value it mounted with.
  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: reducedMotion ? 0 : 64 * dir }),
    center: {
      opacity: 1,
      x: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
        when: 'beforeChildren' as const,
        staggerChildren: reducedMotion ? 0 : 0.07,
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: reducedMotion ? 0 : -64 * dir,
      transition: { duration: 0.18, ease: 'easeIn' as const },
    }),
  }

  // Children (the question, then each answer row) rise a beat behind the
  // block, which is what makes the transition read as orchestrated rather
  // than one flat swap.
  const riseVariants = {
    enter: { opacity: 0, y: reducedMotion ? 0 : 16 },
    center: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 380, damping: 34 },
    },
    exit: { opacity: 0 },
  }

  const stageMotion = {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  /* ── Screens ──────────────────────────────────────────────────────────── */

  return (
    <ConsumerShell
      /* ⚠️ `showWelcome={false}` — the first-run welcome belongs to Home and
         only to Home. Without this, landing here with the module-scoped
         `welcomeDismissed` flag still unset (a reload mid-flow, a deep link, a
         shared URL) renders the whole five-screen welcome OVER this route, and
         its final CTA navigates to Home — so the reader never reaches the page
         they asked for, and on the way back Home they meet the welcome a second
         time. Reported as "after completing the sleep diary I go back to the
         welcome screen and not the home page". Setting it also marks the
         welcome as passed for the rest of the session (see `ConsumerShell`),
         which is what stops the replay. Every non-Home consumer page needs
         this line. */
      showWelcome={false}
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      // Purple/50, the diary frames' own canvas on all three screens — not
      // Home's warm radial. Padding is per-stage, so the shell contributes none.
      contentClassName="relative overflow-clip bg-purple-50 p-0"
      // Round 48 — the shared `ConsumerFlowFooter` is a full-bleed white bar in
      // the module flow, and a bar that stops 128px short of the window on a
      // wide screen reads as a broken layout rather than a centred one. Each
      // stage below re-applies the cap itself (the question column at its own
      // 1121, `CompletionHero` by centring), which is the same trade the module
      // page takes. The wave band already escaped the column via `100vw`, so it
      // is unaffected.
      contentFullBleed
      // The footer is viewport-anchored and the shell's cue pins itself to the
      // same corner. Both diary heroes are viewport-height and never scroll, so
      // the cue was already hidden on them — this only concerns the questions.
      showScrollCue={false}
      optedOut={dyad.optedOut}
    >
      {/*
        The footer is `sticky bottom-0`, and a sticky element only detaches from
        the flow once its container overflows — so on a short question step it
        would simply sit wherever the content ended, halfway up the page. This
        column gives the page a viewport-height floor and hands the slack to the
        step, exactly as `ConsumerModulePage` does. `-61px` below 1200 is this
        portal's nav tab row, which the module flow drops and this page keeps.
      */}
      {/* ⚠️ `ConsumerContentReveal`, not a plain `div` — reported as "when I
          open sleep diary there is no motion, its static", and it was the only
          consumer page without it. The inner `AnimatePresence` below carries
          `initial={false}`, deliberately, so it animates *between* steps and
          never on arrival — nothing was animating the arrival at all.

          It **replaces** the column rather than wrapping it, so the
          viewport-height floor and the sticky footer that depends on it are
          unchanged; an extra nested element would have broken that `min-h`
          chain. Reusing the shared component also means closing the hamburger
          drawer on this page now plays the same shutter-reveal as every other
          page, since this is what subscribes to the pulse. */}
      <ConsumerContentReveal className="flex min-h-[calc(100dvh-var(--consumer-header-h)-61px)] flex-col min-[1200px]:min-h-[calc(100dvh-var(--consumer-header-h))]">
      <AnimatePresence mode="wait" initial={false}>
        {stage === 'welcome' && (
          <motion.div key="welcome" {...stageMotion}>
            <CompletionHero
              // 274px renders the art at the frames' own 263 (the export
              // carries 15px of shadow bleed: solid art is 373 of its 388).
              mascotClassName="w-[200px] sm:w-[274px]"
              title="Sleep Diary"
              headingRef={headingRef}
            >
              <p className="text-consumer-eyebrow text-ink">
                Fill in for <span className="font-medium">{DIARY_DATE}</span>
              </p>
              <p className="text-consumer-eyebrow mt-2 max-w-[644px] text-ink">
                This takes about 5 minutes and covers both of you. One of you can fill it in on
                behalf of you both. There are no right or wrong answers, just answer as honestly as
                you can.
              </p>
              {/* 56 + the parent's 8 = the frame's 64 (`812:11486`). Mobile
                  keeps its previous 32, which is enough on a 375px screen. */}
              <div className="mt-6 flex w-full max-w-[448px] flex-col gap-4 sm:mt-14">
                <button type="button" className={CTA_PRIMARY} onClick={() => setStage('questions')}>
                  Fill in Sleep Diary
                </button>
                <button type="button" className={CTA_OUTLINE} onClick={goHome}>
                  Go Back
                </button>
              </div>
            </CompletionHero>
          </motion.div>
        )}

        {stage === 'questions' && (
          <motion.div
            key="questions"
            {...stageMotion}
            // `flex-1 min-h-0` rather than its own viewport calc: the wrapper
            // above holds the floor now, and the step takes the slack so the
            // footer is pushed to the bottom of the window on a short question
            // and stays stuck there on a tall one. Without `min-h-0` a long
            // step cannot shrink inside the column and pushes the sticky footer
            // off-screen.
            className="mx-auto flex min-h-0 w-full max-w-[1121px] flex-1 flex-col px-6 pt-6 pb-6 sm:px-10 sm:pt-20 xl:px-0"
          >
            {/* Progress row — persistent chrome, never animates with the step. */}
            <div className="flex items-center gap-6 sm:gap-14">
              <button
                type="button"
                ref={exitButtonRef}
                onClick={() => setExitOpen(true)}
                aria-label="Leave the sleep diary"
                // Black disc, white glyph (direct instruction), not the
                // purple-300 disc it shipped with — and a 24px glyph rather
                // than 16px, which read as a speck inside a 44px target.
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
              >
                <X className="size-6" strokeWidth={2} aria-hidden="true" />
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={total}
                  aria-valuenow={qIndex + 1}
                  aria-label={`Question ${qIndex + 1} of ${total}`}
                  className="relative h-[7px] flex-1 overflow-hidden rounded-3xl bg-purple-200 sm:h-[9px]"
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-3xl bg-consumer-primary"
                    initial={false}
                    animate={{ width: `${((qIndex + 1) / total) * 100}%` }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 210, damping: 28 }
                    }
                  />
                </div>
                <p aria-hidden="true" className="text-consumer-progress whitespace-nowrap text-ink">
                  {qIndex + 1} / {total}
                </p>
              </div>
            </div>

            {/* The animated step — question + answer rows. `popLayout` mounts
                the incoming step immediately, so the heading focus effect above
                always finds the element it is meant to land on. */}
            {/* 72px from the progress row to the question (direct
                instruction), down from 96. Mobile scales with it — 62 -> 48,
                the same ~25% cut — because a phone has less room above the
                fold, not more. */}
            <div className="relative flex flex-1 flex-col overflow-x-clip pt-12 sm:pt-[72px]">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                  key={qIndex}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex w-full flex-col sm:items-center"
                >
                  <motion.h1
                    ref={headingRef}
                    tabIndex={-1}
                    variants={riseVariants}
                    // `text-balance` — no orphans (standing rule). Q7 left
                    // "night?" alone on a second line; balancing evens the two
                    // lines instead of breaking one word early.
                    className="text-consumer-question w-full text-balance text-ink outline-none sm:text-center"
                  >
                    Q{qIndex + 1}. {question.label}
                  </motion.h1>
                  {/*
                    18px explainer (direct instruction). `consumer-eyebrow` is
                    already the portal's 18px step (clamped 16 -> 18), so this
                    adds no token.

                    It is `aria-describedby` on both inputs rather than a loose
                    paragraph: a screen-reader user tabbing straight into the
                    field would otherwise never hear it. Only rendered where a
                    question has one — Q5, Q8 and Q9 were called out as needing
                    none, and help under an already-clear question is noise.
                  */}
                  {question.help && (
                    <motion.p
                      id={`diary-help-${qIndex}`}
                      variants={riseVariants}
                      // 800, not 720: Q2's line measures 759px at 18px Inter,
                      // so the old clamp broke it one word early and left
                      // "sleep." alone on a second line. 800 fits the longest
                      // of the four explainers on one line and still holds a
                      // readable measure well inside the 1121px column.
                      className="text-consumer-eyebrow mt-3 w-full max-w-[800px] text-balance text-ink-muted sm:text-center"
                    >
                      {question.help}
                    </motion.p>
                  )}
                  <div className="mt-[70px] flex w-full flex-col gap-7 sm:mt-[72px] sm:items-center sm:gap-[52px]">
                    {/*
                      Whose turn it is. `members` is already PLE-then-carer, so
                      the first one without an answer is the one being asked —
                      which makes this derive from the answers themselves
                      rather than a second piece of state that could disagree
                      with them. Once both are filled nobody is emphasised, so
                      the pair settles rather than leaving the carer's box
                      permanently enlarged.
                    */}
                    {members.map((m) => {
                      const inputId = `diary-${m.who}-${question.field}`
                      const value = answersFor(m.who, question.field)
                      const activeWho = members.find((x) => !answersFor(x.who, question.field))?.who
                      const isActive = activeWho === m.who
                      return (
                        <motion.div
                          key={m.who}
                          variants={riseVariants}
                          className="flex w-full items-center gap-8 sm:w-auto"
                        >
                          <label
                            htmlFor={inputId}
                            className="text-consumer-answer-name w-[97px] shrink-0 text-ink"
                          >
                            {m.name}:
                          </label>
                          {question.kind === 'time' ? (
                            <motion.input
                              id={inputId}
                              type="time"
                              aria-describedby={question.help ? `diary-help-${qIndex}` : undefined}
                              value={value}
                              onChange={(e) => setAnswer(m.who, question.field, e.target.value)}
                              animate={reducedMotion ? undefined : { scale: isActive ? ACTIVE_SCALE : 1 }}
                              transition={ACTIVE_TRANSITION}
                              style={{ transformOrigin: ACTIVE_ORIGIN }}
                              // `w-[172px] flex-none` on a phone rather than
                              // `flex-1`: a field that already fills the row
                              // has nowhere to grow into. This leaves ~26px of
                              // trailing slack for the 8% emphasis.
                              className={cn(
                                FIELD_BASE,
                                isActive ? FIELD_ACTIVE : FIELD_IDLE,
                                // `w-[172px] flex-none` on a phone rather than
                                // `flex-1`: a field that already fills the row
                                // has nowhere to grow into.
                                'w-[172px] flex-none sm:w-[208px]',
                              )}
                            />
                          ) : (
                            <div className="flex min-w-0 flex-1 items-center gap-4 sm:flex-none">
                              <motion.input
                                id={inputId}
                                type="text"
                                aria-describedby={question.help ? `diary-help-${qIndex}` : undefined}
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="Approx."
                                animate={reducedMotion ? undefined : { scale: isActive ? ACTIVE_SCALE : 1 }}
                                transition={ACTIVE_TRANSITION}
                                style={{ transformOrigin: ACTIVE_ORIGIN }}
                                value={value}
                                onChange={(e) =>
                                  setAnswer(
                                    m.who,
                                    question.field,
                                    // Digits only — stripped on input, not
                                    // rejected on submit (see doc comment).
                                    e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                                  )
                                }
                                className={cn(
                                  FIELD_BASE,
                                  isActive ? FIELD_ACTIVE : FIELD_IDLE,
                                  'w-[136px] min-w-0 flex-none sm:w-[208px]',
                                )}
                              />
                              <motion.span
                                className="text-consumer-unit shrink-0 text-consumer-primary"
                                animate={
                                  reducedMotion
                                    ? undefined
                                    : { x: isActive ? unitShiftFor(wideField) : 0 }
                                }
                                transition={ACTIVE_TRANSITION}
                              >
                                {question.unit}
                              </motion.span>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done" {...stageMotion}>
            <CompletionHero
              // Frames `811:10934` / `816:12478` draw the mascot at an
              // IDENTICAL 263 art width on both screens, so this now matches
              // the welcome screen. That reverses Round 44's own direct
              // instruction ("Desktop thank you screen avatar is a little
              // bigger", which put it at 388) — the newer frames win, but it
              // is a deliberate reversal rather than drift.
              mascotClassName="w-[220px] sm:w-[274px]"
              title="Thank you for filling in today's sleep diary"
              headingRef={headingRef}
            >
              <p className="text-consumer-eyebrow mt-2 max-w-[644px] text-ink">
                {/* "module of the week", not "lesson" — Round 46 renamed this
                    portal-wide and §89.12 recorded zero occurrences of "lesson"
                    in rendered text, which was wrong: this screen sits behind
                    nine answered questions and the sweep never reached it. */}
                Remember to complete your module of the week, if not done already. We will see you
                again tomorrow to fill in the sleep diary.
              </p>
              <div className="mt-6 flex w-full max-w-[448px] flex-col sm:mt-14">
                {/* "Go home", not the frame's title-case "Go Back Home": the
                    module flow's own footer and the yellow bar both say "Go
                    home", and this screen now shares its layout with theirs. */}
                <button type="button" className={CTA_PRIMARY} onClick={goHome}>
                  Go home
                </button>
              </div>
            </CompletionHero>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        Round 48, direct instruction: the questionnaire's own Back / Next row is
        gone and the module flow's footer carries the pair instead — one
        component, two flows. It sits OUTSIDE the `AnimatePresence` so it does
        not slide with the step: the whole point of this chrome is that it never
        moves while the question under it changes, which is what the row it
        replaces was already documented as doing.

        `shown` is left at its default. The module flow hides the footer on
        scroll up because its stages are long enough to scroll; a question step
        is one question and two fields, so there is no direction to be aware of.
      */}
      {stage === 'questions' && (
        <ConsumerFlowFooter
          // The diary's own wording, kept as it was. The module flow says "Go
          // back" / "Go next"; aligning the two is a copy decision rather than
          // a consequence of sharing the component, so it is not taken here.
          backLabel="Back"
          label={isLast ? 'Finish' : 'Next'}
          onBack={back}
          // Blocked, never removed (direct instruction, Round 44): a control
          // that vanishes and reappears as you travel reads as a bug.
          backBlockedReason={isFirst ? 'This is the first question.' : undefined}
          onContinue={next}
          // This replaces the press-Next-then-show-a-hint live region this page
          // used to run. `BlockedHint` says the same sentence on hover, on
          // focus AND on tap — the last one being what the old hint was really
          // for — and wires it as the button's own `aria-describedby`, so the
          // reason now reaches a screen-reader user before they press rather
          // than after.
          continueBlockedReason={
            stepComplete
              ? undefined
              : `Please fill in an answer for ${
                  members.length === 2 ? 'both of you' : 'this question'
                } before moving on.`
          }
        />
      )}
      </ConsumerContentReveal>

      {/*
        Exit confirmation — closes §87.6's first open item ("the X exit button
        discards answers without confirming").

        It sits OUTSIDE the `AnimatePresence` on purpose: the step blocks mount
        and unmount as the questionnaire advances, and a dialog owned by one of
        them would be torn down mid-transition.

        Copy is deliberately not "Are you sure?" — both buttons name their own
        outcome, so nobody has to work out which one loses their answers, and
        the second sentence says the diary can be filled in again later. For an
        audience living with dementia, an unexplained loss reads as a mistake
        they cannot undo; saying it is repeatable is what makes leaving a
        normal choice rather than an alarming one.
      */}
      <ConfirmDialog
        open={exitOpen}
        title="Leave the sleep diary?"
        body="Your answers will not be saved. You can fill in the sleep diary again later today."
        confirmLabel="Leave without saving"
        cancelLabel="Keep filling it in"
        // Red (direct instruction). Losing typed answers is the consequential
        // path, and the error tone is what separates it at a glance from the
        // outline "Keep filling it in" beside it.
        destructive
        onConfirm={goHome}
        onClose={() => setExitOpen(false)}
      />
    </ConsumerShell>
  )
}
