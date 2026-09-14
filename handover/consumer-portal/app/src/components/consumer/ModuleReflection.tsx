import { useCallback, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { BlockedHint } from '@/components/consumer/BlockedHint'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReflectionQuestion } from '@/data/consumerLessonContent'

/**
 * The consumer module's reflection activity — Round 47, frame `910:2367`.
 *
 * One question at a time inside a single card: a step-pip row, the question,
 * "Choose one or more options", a two-column set of answer pills, and the
 * card's own Go back / Next below them.
 *
 * ── Two footers, and why that is not a mistake ────────────────────────────
 *
 * The frame draws navigation twice: black pills *inside* the card that move
 * between the five questions, and the module's own purple footer below it that
 * leaves the module. They are deliberately different colours because they do
 * different things, and the split is what lets a reader answer question three
 * and still walk out without having to reach the end first.
 *
 * Direct instruction, and it is also what the frame's own states imply: **the
 * first question has no Go back and the last has no Next**, and **Next is inert
 * until the question has at least one answer.** There is nowhere
 * behind question one inside this card (behind it is the Summary stage, which
 * the module footer's own Go back reaches), and past question five the thing
 * to press is Finish, in the footer. So the card never shows a control that
 * would land you outside it.
 *
 * ── Multi-select ──────────────────────────────────────────────────────────
 *
 * `aria-pressed` toggle buttons in a `role="group"`, **not** checkboxes styled
 * as pills and **not** `role="radiogroup"`. The same call as the video screen's
 * Video/Audio/Transcript row (§89.15): a radiogroup carries a roving-tabindex
 * and arrow-key contract this project has already shipped unimplemented once
 * (`WeekdayPicker`, fixed in Round 14.5), and these are genuinely independent
 * toggles rather than one-of-N anyway.
 *
 * ── Focus ─────────────────────────────────────────────────────────────────
 *
 * The question heading takes focus on every question change, via a **callback
 * ref keyed to the element** (`key={question.id}` remounts it), for the reason
 * §89.3 records: an effect keyed on the index runs a commit too early. It is
 * load-bearing rather than a nicety here, because on the last question the Next
 * button unmounts underneath the cursor that just pressed it — the exact
 * focus-to-`<body>` defect this project has shipped in six rounds.
 */

/* ── Geometry, all the frame's own ──────────────────────────────────────── */

/** Who is answering. Internal ids only — the reader never sees these words,
 *  they see the two first names in the column headings. */
export type ReflectionWho = 'ple' | 'carer'

export type ReflectionMember = { who: ReflectionWho; name: string }

/** Selected option ids, per question, per person. A question nobody has
 *  reached is absent; a carer-only dyad never grows a `ple` key. */
export type ReflectionAnswers = Record<string, Partial<Record<ReflectionWho, string[]>>>

/**
 * ── Two people, one question ──────────────────────────────────────────────
 *
 * New requirement: both members of the dyad answer the same question, then it
 * advances — the pairing the sleep diary already does for a night's sleep.
 *
 * The frame's own layout was one person's set of pills in two columns. That
 * does not survive a second answerer: two sets of four pills is eight controls
 * on one question, and the reader has to work out which half is theirs before
 * they can start. So the answers turn on their side — **the option text on the
 * left, one tick box per person on the right**, under a heading carrying their
 * first name. Four rows either way, whether one person is answering or two.
 *
 * A tick box rather than the frame's filled pill because these are genuinely
 * multi-select ("Choose one or more"), and a box that fills with a tick says
 * that on sight where a pill that turns purple does not. `aria-pressed` toggle
 * buttons in a `role="group"`, for the reason the file already records: a real
 * `checkbox` role would be fine too, but this keeps one interaction vocabulary
 * with the video screen's Video/Audio/Transcript row.
 *
 * The column headings are the only place a name appears. The instruction line
 * above says "your own name" rather than naming anyone — direct instruction —
 * so the sentence stays true for a carer-only dyad and for whichever of the two
 * is holding the phone.
 */
/**
 * The card's own navigation. Black, not purple: the module footer below it is
 * the purple pair, and two identical-looking pairs on one screen would be a
 * reader's problem, not a designer's.
 *
 * ⚠️ **`min-w-0` and the tighter mobile padding are a pair, and they fix a real
 * bug**: reported as "the go back and next buttons for questions is not same
 * width" on a phone. Both buttons carry `flex-1` with `flex-basis: 0`, so they
 * should split the row evenly — but a flex item's default `min-width: auto`
 * floors it at its own min-content, and "Go back" plus a chevron is wider than
 * half the row at 375. Measured: Go back clamped to 156px and Next got the
 * 114px left over. `min-w-0` lets both settle on the even split, and the
 * smaller gap and padding below 768 keep the labels inside it rather than
 * overflowing the box they now fit.
 *
 * `min-w-[136px]` at 1200 and up rather than the frame's flat `w-[136px]`:
 * 136 less 40px of padding, a 16px gap and a 16px chevron leaves 64px, and
 * "Go back" needs ~66 at 16/600, so the frame's own width wrapped the label.
 * Below 1200 the pair share the row on `flex-1`.
 */
const NAV =
  'flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-[28px] px-4 py-2 text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 min-[768px]:gap-4 min-[768px]:px-5 min-[1200px]:min-w-[136px] min-[1200px]:flex-none'

/**
 * ── Making the box feel like a control ────────────────────────────────────
 *
 * Direct instruction: "make the tick buttons more intuitive, engaging,
 * responsive". Three separate things, and each is a different mechanism:
 *
 *   **Intuitive** — an empty box, and nothing inside it.
 *
 *     ⚠️ A faint "ghost tick" at 20% was tried here first, on the reasoning
 *     that it demonstrates what tapping will do. It was reported immediately as
 *     "it looks like already the box is ticked", which is the worse failure: a
 *     preview that reads as a state makes the reader think they have already
 *     answered. An empty box it is. The affordance is carried by the instruction
 *     line and the column headings instead, which is where it belongs.
 *   **Engaging** — the tick springs in rather than appearing, and the box
 *     fills at the same time. One short spring, not a bounce.
 *   **Responsive** — `whileTap` shrinks the whole box under the finger, so the
 *     press is acknowledged on touch-down instead of only on release. Hover
 *     fills it faintly on a pointer.
 *
 * All three collapse under `prefers-reduced-motion`, which the card already
 * reads for its question transitions.
 */
/**
 * The filled tick, per person — direct instruction: "can we use different
 * selected state color for carer".
 *
 * Purple for the PLE and yellow for the carer: this portal's own two brand
 * colours, so the pair is a distinction the reader has already been seeing all
 * the way through the module rather than two new hues.
 *
 * ⚠️ **The border stays `consumer-primary` in both states, including when the
 * carer's box is filled yellow.** `yellow-300` against the white row measures
 * about 1.7:1, so a yellow-bordered box would have no boundary a reader could
 * see — WCAG 1.4.11 wants 3:1 for a control's own edge. Keeping the purple
 * outline gives every box the same visible shape and lets the *fill* carry
 * whose answer it is.
 *
 * Colour is never the only carrier: the column heading above each box names the
 * person, and each box's `aria-label` says the name and the answer.
 */
const TICK_ON: Record<ReflectionWho, string> = {
  ple: 'border-consumer-primary bg-consumer-primary text-white',
  carer: 'border-consumer-primary bg-yellow-300 text-ink',
}

const TICK =
  'flex size-14 shrink-0 items-center justify-center rounded-[12px] border-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2'

function AnswerRow({
  label,
  members,
  selectedFor,
  onToggle,
  reduceMotion,
}: {
  label: string
  members: ReflectionMember[]
  selectedFor: (who: ReflectionWho) => boolean
  onToggle: (who: ReflectionWho) => void
  reduceMotion: boolean
}) {
  const anyone = members.some((m) => selectedFor(m.who))
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[16px] border bg-white py-2 pr-2 pl-4 transition-colors min-[768px]:gap-4 min-[768px]:pr-3 min-[768px]:pl-5',
        anyone ? 'border-consumer-primary' : 'border-purple-300',
      )}
    >
      {/* The answer itself. `min-w-0` so a long option wraps inside the row
          instead of pushing the tick boxes off the card — the longest here is
          "I hadn't thought about my wake-up time before now". */}
      <span className="text-body-md min-w-0 flex-1 text-ink">{label}</span>
      {members.map((m) => {
        const on = selectedFor(m.who)
        return (
          <motion.button
            key={m.who}
            type="button"
            aria-pressed={on}
            /* The visible column heading is not programmatically tied to each
               box, so every box says whose it is and which answer it belongs
               to. Without this a screen reader hears four identical "button,
               pressed" in a row. */
            aria-label={`${m.name}: ${label}`}
            onClick={() => onToggle(m.who)}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              TICK,
              on
                ? TICK_ON[m.who]
                : 'border-consumer-primary bg-white text-consumer-primary hover:bg-purple-50',
            )}
          >
            {on ? (
              <motion.span
                initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 620, damping: 24 }}
                className="flex"
              >
                <Check aria-hidden="true" className="size-7" strokeWidth={3} />
              </motion.span>
            ) : null}
          </motion.button>
        )
      })}
    </div>
  )
}

/**
 * The column headings plus one `AnswerRow` per option — the whole answering
 * surface for a single question.
 *
 * Extracted at its second caller: the review screen renders the *same* block
 * for every question rather than a read-only summary of them (direct
 * instruction: "make review screen similar to how we are doing for all
 * questions"). Sharing it is the point — a separate review layout is how the
 * two drift, and a reader who has learned to tick a box on question one should
 * not meet a different thing on the screen that checks their answers.
 *
 * Because the rows are live in both places, the review screen needs no "change"
 * affordance at all: the answer is edited where it is shown.
 */
function AnswerGrid({
  question,
  members,
  answers,
  onToggle,
  reduceMotion,
  labelledBy,
  rowVariants,
}: {
  question: ReflectionQuestion
  members: ReflectionMember[]
  answers: ReflectionAnswers
  onToggle: (questionId: string, who: ReflectionWho, optionId: string) => void
  reduceMotion: boolean
  labelledBy: string
  /** Rows stagger in on a single question; on review there are twenty of them
   *  and staggering the lot reads as a page building itself, so the review
   *  passes nothing and the rows simply appear with their block. */
  rowVariants?: Variants
}) {
  const forQuestion = answers[question.id] ?? {}
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-col gap-3">
      {/* `aria-hidden` because every tick box already names its own person and
          answer — read out, this row would be two loose first names. */}
      <div
        aria-hidden="true"
        className="flex items-center gap-3 pr-2 pl-4 min-[768px]:gap-4 min-[768px]:pr-3 min-[768px]:pl-5"
      >
        <span className="min-w-0 flex-1" />
        {members.map((m) => (
          <span key={m.who} className="text-body-md w-14 shrink-0 text-center text-ink">
            {m.name}
          </span>
        ))}
      </div>

      {question.options.map((option) => {
        const row = (
          <AnswerRow
            label={option.label}
            members={members}
            reduceMotion={reduceMotion}
            selectedFor={(who) => (forQuestion[who] ?? []).includes(option.id)}
            onToggle={(who) => onToggle(question.id, who, option.id)}
          />
        )
        return rowVariants ? (
          <motion.div key={option.id} variants={rowVariants}>
            {row}
          </motion.div>
        ) : (
          <div key={option.id}>{row}</div>
        )
      })}
    </div>
  )
}

/* ── The card ───────────────────────────────────────────────────────────── */

export function ModuleReflection({
  questions,
  index,
  answers,
  members,
  onIndexChange,
  onToggle,
}: {
  questions: ReflectionQuestion[]
  index: number
  /** Selected option ids per question id, per person. Held by the page, so
   *  stepping out to the Summary stage and back does not empty the answers. */
  answers: ReflectionAnswers
  /** PLE first, then carer. One entry for a carer-only dyad. */
  members: ReflectionMember[]
  onIndexChange: (next: number) => void
  onToggle: (questionId: string, who: ReflectionWho, optionId: string) => void
}) {
  const reduceMotion = useReducedMotion()
  const first = useRef(true)

  /** Skips the mount that arrives with the stage — that one already moved focus
   *  to the stage's own `<h1>`, and stealing it back to the question would make
   *  the screen's title unreachable by the reader who just landed on it. */
  const questionRef = useCallback((node: HTMLHeadingElement | null) => {
    if (!node) return
    if (first.current) {
      first.current = false
      return
    }
    node.focus({ preventScroll: true })
  }, [])

  /**
   * Which way the reader is travelling, so the outgoing question leaves the way
   * the incoming one arrives. A ref rather than state: it is read during the
   * same render that the new index arrives in, and storing it in state would
   * need a second render to be right.
   */
  const lastIndex = useRef(index)
  const direction = index >= lastIndex.current ? 1 : -1
  lastIndex.current = index

  /*
   * The same motion vocabulary as the sleep diary's own question stepper
   * (Round 44) — direct instruction to match what the portal already does. The
   * block slides in the direction of travel on a spring while its children rise
   * a beat behind it on a stagger, which is what reads as one orchestrated move
   * rather than a flat swap. Under reduced motion both collapse to a crossfade
   * in place.
   */
  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: reduceMotion ? 0 : 64 * dir }),
    center: {
      opacity: 1,
      x: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
        when: 'beforeChildren' as const,
        staggerChildren: reduceMotion ? 0 : 0.07,
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : -64 * dir,
      transition: { duration: 0.18, ease: 'easeIn' as const },
    }),
  }

  const riseVariants = {
    enter: { opacity: 0, y: reduceMotion ? 0 : 16 },
    center: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 380, damping: 34 },
    },
    exit: { opacity: 0 },
  }

  /**
   * A sixth step after the five questions: the review screen (direct
   * instruction — "once the user has answered all questions show me a summary
   * screen ... where user can review their answers, and change their answers").
   * It is an index past the end rather than a separate stage, so the card's own
   * progress rail, animation and Go back all keep working unchanged.
   */
  const REVIEW_INDEX = questions.length
  const isReview = index >= REVIEW_INDEX
  const question = questions[index]
  if (!question && !isReview) return null

  const forQuestion = question ? (answers[question.id] ?? {}) : {}
  const selectedFor = (who: ReflectionWho) => forQuestion[who] ?? []
  /* Everyone answers before the question advances — that is the whole point of
     the change. `every` rather than a hard-coded pair, so a carer-only dyad is
     complete on one answer rather than waiting for a column it never had. */
  const waiting = members.filter((m) => selectedFor(m.who).length === 0)
  const answered = members.length > 0 && waiting.length === 0
  const headingId = question ? `reflection-${question.id}` : 'reflection-review'
  const reasonId = 'reflection-next-blocked-reason'

  return (
    <section className="overflow-hidden rounded-[16px] border border-parchment bg-purple-50 shadow-card">
      <div className="flex flex-col gap-10 bg-purple-200 px-5 py-8 min-[768px]:px-8 min-[768px]:py-10">
        <p className="sr-only" aria-live="polite">
          Question {index + 1} of {questions.length}
        </p>
        {/* A segmented **progress bar**, not a stepper — direct instruction:
            every segment up to and including the current question stays solid,
            so the row fills as the reader works through rather than moving one
            lit dot along. 8px tall, also direct. */}
        <div aria-hidden="true" className="flex items-start gap-2">
          {questions.map((q, i) => (
            <span
              key={q.id}
              className={cn(
                'h-2 w-10 rounded-[16px] transition-colors duration-300',
                i <= index ? 'bg-consumer-primary' : 'bg-purple-300',
              )}
            />
          ))}
        </div>

        {/* `min-w-0` on the clip: the outgoing question is still in the tree
            for a beat and would otherwise size the column while it slides.
            `overflow-x-clip` rather than `hidden` so the vertical axis stays
            visible, and `-mx-1 px-1` buys back the 4px an option pill's
            `ring-offset-2` focus ring needs at the column edges, which the clip
            would otherwise cut. */}
        <div className="-mx-1 min-w-0 overflow-x-clip px-1">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              /* The review step has no question, so it keys on its own id —
                 without this the whole card crashed on reaching review. */
              key={question ? question.id : 'review'}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-10"
            >
              <motion.div variants={riseVariants} className="flex flex-col gap-2">
                <h2
                  ref={questionRef}
                  tabIndex={-1}
                  id={headingId}
                  className="text-consumer-card-title text-balance text-ink outline-none"
                >
                  {isReview ? 'Check your answers' : `Q${index + 1}. ${question!.prompt}`}
                </h2>
                {isReview ? (
                  <p className="text-consumer-eyebrow text-ink">
                    Here is what you both chose. Change any answer before you finish.
                  </p>
                ) : (
                  /* Direct instruction: say it clearly and **without naming
                     anyone** — the names are in the column headings, and a
                     sentence that named them would be wrong for a carer-only
                     dyad and would read oddly to whichever of the two is
                     holding the phone. */
                  <p className="text-consumer-eyebrow text-ink">
                    {members.length > 1
                      ? 'Each of you answer. Tap the box under your own name. You can tap more than one answer.'
                      : 'Tap the box next to your answer. You can tap more than one answer.'}
                  </p>
                )}
              </motion.div>

              {isReview ? (
                /* The same rows as a question screen, once per question, and
                   **live** — direct instruction: "make review screen similar to
                   how we are doing for all questions", "user should be able to
                   change answer via review screen itself", "simple tick on
                   off". So there is no separate read-only summary and no
                   "change" link: the answer is edited where it is shown, with
                   the tick that was used to give it.

                   Not inside `AnimatePresence`'s per-row stagger: twenty rows
                   arriving one after another reads as the page assembling
                   itself rather than a list appearing. */
                <ol className="flex flex-col gap-8">
                  {questions.map((q, qi) => (
                    <li key={q.id} className="flex flex-col gap-3">
                      <p id={`reflection-review-${q.id}`} className="text-body-md text-ink">
                        Q{qi + 1}. {q.prompt}
                      </p>
                      <AnswerGrid
                        question={q}
                        members={members}
                        answers={answers}
                        onToggle={onToggle}
                        reduceMotion={!!reduceMotion}
                        labelledBy={`reflection-review-${q.id}`}
                      />
                    </li>
                  ))}
                </ol>
              ) : (
                <AnswerGrid
                  question={question!}
                  members={members}
                  answers={answers}
                  onToggle={onToggle}
                  reduceMotion={!!reduceMotion}
                  labelledBy={headingId}
                  rowVariants={riseVariants}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Left-aligned below 1200, right-aligned at 1200 and up — direct
          instruction. With both buttons on `flex-1` the row already fills the
          width, so the alignment is what decides where a *single* button sits:
          on the first and last questions it starts at the left edge and runs
          the full width, rather than sitting alone against the right margin. */}
      {/*
        ⚠️ **A grid below 1200, not flex** — reported as "the go back and next
        buttons for questions is not same width" on a phone, and flex would not
        give it up. Both children carry `flex-1 min-w-0` with `flex-basis: 0`,
        which should split the row evenly, and measured it stayed 151.5 / 117.5
        even with `flex: 1 1 0px !important` forced onto both. Two equal grid
        tracks are declarative about the thing that actually matters here — the
        two buttons are the same width — instead of asking the flex algorithm
        for it and checking afterwards.

        The column count follows the number of buttons, so the lone control on
        the first question still runs the full width rather than sitting in half
        a row. At 1200 and up it goes back to flex, where the pair is
        right-aligned at their own 136px and equality is not the goal.
      */}
      <div
        className={cn(
          'grid items-center gap-4 px-5 py-6 min-[768px]:px-8 min-[1200px]:flex min-[1200px]:justify-end',
          index > 0 && index < questions.length ? 'grid-cols-2' : 'grid-cols-1',
        )}
      >
        {index > 0 && (
          <button type="button" onClick={() => onIndexChange(index - 1)} className={cn(NAV, 'border border-ink bg-white text-ink')}>
            <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
            Go back
          </button>
        )}
        {!isReview && (
          /*
           * Next is inert until the question has an answer — direct
           * instruction, Round 47.
           *
           * `aria-disabled` rather than `disabled`, this project's standing
           * treatment: the control stays focusable, so a reader tabbing through
           * finds it and hears *why* nothing happens instead of meeting a gap
           * where a button used to be. `aria-describedby` points at the visible
           * line above, so there is one sentence rather than an `sr-only` copy
           * of it that can drift.
           *
           * `bg-ink/60` measures 4.95:1 against white on this card, so the
           * dimmed state is still readable. Round 33's own disabled Next was
           * kept legible for the same reason, against a frame whose treatment
           * measured 1.98:1.
           */
          <BlockedHint
            id={reasonId}
            reason={
              answered
                ? undefined
                : waiting.length === members.length
                  ? 'Please choose an answer first.'
                  : `${waiting.map((m) => m.name).join(' and ')} has not answered yet.`
            }
            align="end"
            /* `min-w-0` here as well as on the button: this span is the flex
               item in the row, and its own `min-width: auto` was what left the
               pair at 152/118 on a phone. */
            className="min-w-0 flex-1 min-[1200px]:flex-none"
          >
            <button
              type="button"
              aria-disabled={!answered}
              aria-describedby={answered ? undefined : reasonId}
              /* The last question goes to review; everything else to the next
                 question. There is no "back to summary" case any more: answers
                 are edited on the review screen itself, so nobody leaves it to
                 change one. */
              onClick={answered ? () => onIndexChange(index + 1) : undefined}
              className={cn(NAV, answered ? 'bg-ink text-white' : 'bg-ink/60 text-white')}
            >
              {/* Direct instruction: "for after last question it should say
                  review answers". */}
              {index === questions.length - 1 ? 'Review answers' : 'Next'}
              <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
            </button>
          </BlockedHint>
        )}
      </div>
    </section>
  )
}
