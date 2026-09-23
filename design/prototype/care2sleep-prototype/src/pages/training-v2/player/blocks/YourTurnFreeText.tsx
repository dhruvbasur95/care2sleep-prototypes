import { useEffect, useId, useRef, useState } from 'react'
import { useSlideGate } from '../slideGate'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { YourTurnQuestion } from '@/data/moduleContent'
import { AnswerOutcome } from './AnswerOutcome'

/**
 * Free-text question — the **Your turn** pattern's second interaction type,
 * after multiple choice.
 *
 * No Figma frame. Direct instruction, 2026-09-17: *"After title, add a purple
 * 50 container, use title font for question followed by white free text box,
 * and submit answer bottom left. This one will not have any logic, so on submit
 * answer re-use the mcq answer outcome component (avatar + purple blob) and add
 * a message Your answer has been recorded."*
 *
 * ## "Will not have any logic" is the whole specification
 * There is no grading, no model answer shown, and no right or wrong state.
 * module.md's two message columns were **merged into one for this row** on
 * 2026-09-17 (*"for free text box there is no right or wrong answer"*), so
 * `correctMessage` is simply **the** message shown after submission and
 * `wrongMessage` is `N/A`. `correctAnswer` holds the author's model answer and
 * stays deliberately unused — a free-text response cannot be matched against a
 * sentence, and showing the model answer was not asked for. The answer is not
 * persisted either: it lives in component state for the session, like every
 * other interaction in this player.
 *
 * ## What is shared with multiple choice and what is not
 * Shared: the outcome panel (`AnswerOutcome` — extracted at this second
 * caller), and the set chrome. Not shared: everything else. The question is the
 * block library's **Title** role here (`display-md`, per the instruction's "use
 * title font") rather than multiple choice's 28px stem, and the surface is
 * `purple-50` drawn by this component rather than the container's `yellow-50`
 * tint — which is why its block passes `surface="none"`.
 */
export function YourTurnFreeText({
  questions,
  labelledBy,
}: {
  questions: YourTurnQuestion[]
  /** The container's title, so the set is labelled without repeating it. */
  labelledBy: string
}) {
  const fieldId = useId()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({})

  /**
   * Gate: **every question in the set submitted.**
   *
   * Submitted, not answered correctly — this is a learning check, not an exam,
   * and the block already shows the coach where they went wrong. Gating on a
   * right answer would trap someone on a slide with no way forward but guessing.
   *
   * The id carries the first question's own words so that a slide holding two
   * Your-turn blocks registers two gates rather than one. Module 6 slide 22
   * (`s23-ch3-your-turn-1`) is exactly that case — a free-text set and a ranking
   * exercise — and a shared id would have let the first one answered unlock the
   * slide. Content-derived rather than `useId()` so it is stable across
   * remounts, which is what `slideGate`'s latching keys on.
   */
  const gate = useSlideGate(`your-turn-free:${questions[0]?.question.slice(0, 32) ?? ''}`)
  useEffect(() => {
    if (questions.length > 0 && questions.every((_, i) => submitted[i])) gate.satisfy()
  }, [submitted, questions, gate])

  // Both transitions unmount the control that caused them — Submit disappears
  // on submit, the field is replaced on navigation — so focus has to be moved
  // deliberately or it falls to `<body>`.
  const pending = useRef<'question' | 'outcome' | null>(null)
  const questionRef = useRef<HTMLParagraphElement>(null)
  const outcomeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pending.current) return
    const target = pending.current === 'outcome' ? outcomeRef.current : questionRef.current
    pending.current = null
    target?.focus()
  })

  const question = questions[index]
  const answer = answers[index] ?? ''
  const isSubmitted = submitted[index] ?? false

  // The same rule multiple choice follows (direct instruction): one question is
  // not a set, so it gets neither pagination nor a footer.
  const showSet = questions.length > 1

  function go(to: number) {
    pending.current = 'question'
    setIndex(to)
  }

  return (
        // **24px** between the interactive block and the avatar message (direct
    // instruction, 2026-09-17: *"can the spacing between the avatar block and
    // the interactive block be reduced from 40 to 24px"*, then *"everywhere"* —
    // so all three Your turn patterns). It measured 72px, not 40, before this.
    //
    // The footer keeps the frames' own 72px through its `mt-12`: the instruction
    // named the avatar gap, and pulling the Previous/Next bar up with it would
    // be a change nobody asked for.
    <div className="flex flex-col gap-6" aria-labelledby={labelledBy}>
      <div className="flex flex-col gap-10">
        {showSet && (
          <div className="flex items-center gap-2">
            {questions.map((_, pill) => (
              <span
                key={pill}
                aria-hidden="true"
                className={cn(
                  'h-[10px] w-10 rounded-[16px]',
                  pill === index ? 'bg-primary' : 'bg-purple-300',
                )}
              />
            ))}
            <span className="sr-only">
              Question {index + 1} of {questions.length}
            </span>
          </div>
        )}

        {/* The `purple-50` container the instruction asks for. It is drawn here
            rather than by `InteractiveBlock`'s `surface`, which only knows the
            `yellow-50` tint — a second surface colour on the container would be
            a prop that exists for exactly one caller. */}
        <div className="flex flex-col gap-8 rounded-[16px] bg-purple-50 p-10">
          {/* The block library's **Title** role — `font-display text-display-md`
              — which is what "use title font" names. Deliberately not multiple
              choice's 28px stem: that number came from the MCQ frame, and this
              instruction points at the Title atom instead.

              `<label>` rather than a heading: it names the field below it, and a
              real label is what makes clicking the question focus the box. */}
          <label
            htmlFor={fieldId}
            className="font-display text-display-md text-ink text-balance"
          >
            {/* Focus lands on this line on navigation, so it needs to be
                focusable without being a tab stop. A `<label>` cannot take
                `tabIndex={-1}` and stay a label in every browser, so the inner
                span carries it. */}
            <span ref={questionRef} tabIndex={-1} className="outline-none">
              {question.question}
            </span>
          </label>

          <textarea
            id={fieldId}
            rows={5}
            value={answer}
            readOnly={isSubmitted}
            onChange={(event) =>
              setAnswers((previous) => ({ ...previous, [index]: event.target.value }))
            }
            placeholder="Type your answer here"
            className={cn(
              'w-full resize-y rounded-[16px] border border-parchment bg-white p-6 text-body text-ink outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-ring',
              isSubmitted && 'resize-none',
            )}
          />

          {!isSubmitted && (
            // Bottom left, per the instruction — so the row is `justify-start`
            // rather than multiple choice's own left-aligned button in a column.
            <div className="flex">
              <button
                type="button"
                aria-disabled={answer.trim().length === 0}
                onClick={
                  answer.trim().length === 0
                    ? undefined
                    : () => {
                        pending.current = 'outcome'
                        setSubmitted((previous) => ({ ...previous, [index]: true }))
                      }
                }
                className={cn(
                  'inline-flex h-12 w-fit items-center justify-center rounded-[28px] px-5 py-[10px] text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  answer.trim().length === 0
                    // The same disabled pill multiple choice uses, which is the
                    // player footer's own — contrast-checked rather than an
                    // `opacity-60` that measured 2.35:1 when Round 14.5 tried it.
                    ? 'cursor-not-allowed bg-purple-200/40 text-ink-muted'
                    : 'bg-ink-muted text-white hover:bg-ink',
                )}
              >
                Submit answer
                {answer.trim().length === 0 && (
                  <span className="sr-only"> (write an answer first)</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {isSubmitted && (
        // The authored message, not a hardcoded receipt (direct instruction,
        // 2026-09-17: *"for free text box earlier we said your answer has been
        // submitted, swap this"*). `correctMessage` carries it because free text
        // has no right-or-wrong axis: module.md's two message columns were
        // merged into one for this row, and `wrongMessage` is `N/A` there.
        <AnswerOutcome panelRef={outcomeRef} message={question.correctMessage} />
      )}

      {showSet && (
        <div className="mt-12 flex items-center justify-between gap-4 rounded-[16px] bg-yellow-200 px-8 py-4">
          <SetButton direction="previous" disabled={index === 0} onClick={() => go(index - 1)} />
          <SetButton
            direction="next"
            disabled={index === questions.length - 1}
            onClick={() => go(index + 1)}
          />
        </div>
      )}
    </div>
  )
}

function SetButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  const isNext = direction === 'next'
  const Chevron = isNext ? ChevronRight : ChevronLeft

  return (
    <button
      type="button"
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'inline-flex h-12 w-[248px] max-w-full items-center justify-center gap-4 rounded-[28px] border text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        disabled
          ? 'cursor-not-allowed border-transparent bg-purple-200/40 text-ink-muted'
          : isNext
            ? 'border-primary bg-primary text-white hover:bg-primary-hover'
            : 'border-primary bg-white text-primary hover:bg-purple-50',
      )}
    >
      {!isNext && <Chevron aria-hidden="true" className="size-4" />}
      {isNext ? 'Next question' : 'Previous question'}
      {isNext && <Chevron aria-hidden="true" className="size-4" />}
      {disabled && (
        <span className="sr-only">
          {isNext ? ' (this is the last question)' : ' (this is the first question)'}
        </span>
      )}
    </button>
  )
}
