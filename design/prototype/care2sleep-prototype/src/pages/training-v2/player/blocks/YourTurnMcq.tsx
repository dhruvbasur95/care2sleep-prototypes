import { useEffect, useId, useRef, useState } from 'react'
import { useSlideGate } from '../slideGate'
import { ChevronLeft, ChevronRight, Circle, CircleCheck, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { YourTurnQuestion } from '@/data/moduleContent'
import { AnswerOutcome } from './AnswerOutcome'

/**
 * Multiple-choice question — the **Your turn** pattern, and the third real
 * `<Interactive block>` component after the flip cards and click-to-reveal.
 *
 * Built from frames `2666:23995` (default) and `2666:24168` (answer submitted),
 * 2026-09-17. **Those ids are dead** — the frames were promoted to components
 * the same day and are now `Multiple choice / Default` (`2677:1098`) and
 * `Multiple choice / Answered` (`2677:1101`) in the INTERACTIVE BLOCKS group.
 * Direct instruction: *"for logic, refer the module 6 wherever
 * there is MCQ, use this component"* — so it is selected by the block's own
 * `interactionType`, not applied to every Your turn slide. Module 6's two
 * non-MCQ Your turn blocks (Free-text, Ranking) still fall through to the stub.
 *
 * ## The one-question rule
 * Direct instruction: *"if there is only 1 question then do not show previous,
 * next option, nor show the pagination up top."* Both are progress affordances
 * for a set; over a set of one they are chrome that says nothing. Module 6 has
 * a real instance of each case — Chapter 1's block carries one question and
 * Chapter 3's carries three — so this is exercised, not hypothetical.
 *
 * ## Grading is by option letter, not by string equality
 * `correctAnswer` is authored prose, not a key: Chapter 1's reads
 * `"B. Sleep Drive + C. Body Clock + E. Calm Mind and Body"` against options
 * spelled `"B. Sleep drive"` — different capitalisation — and one option is
 * `"F . Melatonin"` with a space before its dot. Comparing the strings marks a
 * right answer wrong. So each side is reduced to its leading letter and matched
 * on that, with a normalised-text comparison as the fallback for a segment that
 * carries no letter (none in Module 6, but the authoring template does not
 * require one). Never "fix" this in the source — `Modules/*.md` is read-only.
 *
 * ## Native inputs, not a hand-rolled radiogroup
 * `<fieldset>` + real `<input type="radio">` / `<input type="checkbox">`,
 * visually hidden inside the pill's `<label>`. Round 14.5 found `WeekdayPicker`
 * claiming `role="radiogroup"` without the roving-tabindex and arrow-key
 * contract those roles oblige, and had to rewrite it; the native controls carry
 * that behaviour for free, and `selectMode` maps straight onto which element
 * type is correct.
 */

/** `A.` / `B)` / the source's own `F .`, all of which appear in the template. */
const OPTION_LETTER = /^\s*([A-Za-z])\s*[.)]\s*/

/** Trailing punctuation and repeated whitespace are authoring noise, not
 *  meaning — `correctAnswer` frequently ends in a stray period or space that
 *  its own option does not. */
function normalise(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/, '')
    .trim()
}

interface ParsedOption {
  /** `null` when the author wrote an option with no letter prefix. */
  letter: string | null
  /** The option without its letter prefix — what the learner reads. */
  label: string
}

function parseOptions(raw: string[]): ParsedOption[] {
  return raw.map((option) => {
    const match = option.match(OPTION_LETTER)
    return match
      ? { letter: match[1].toUpperCase(), label: option.slice(match[0].length).trim() }
      : { letter: null, label: option.trim() }
  })
}

/** The indices of the options the author marked correct. */
function correctIndices(correctAnswer: string, options: ParsedOption[]): number[] {
  const found = new Set<number>()

  for (const segment of correctAnswer.split('+')) {
    const trimmed = segment.trim()
    if (!trimmed) continue

    const letter = trimmed.match(OPTION_LETTER)?.[1].toUpperCase()
    const byLetter = letter ? options.findIndex((o) => o.letter === letter) : -1
    if (byLetter !== -1) {
      found.add(byLetter)
      continue
    }

    // No usable letter on this side. Compare the prose instead, against the
    // option's own label with its prefix already stripped.
    const wanted = normalise(trimmed.replace(OPTION_LETTER, ''))
    const byText = options.findIndex((o) => normalise(o.label) === wanted)
    if (byText !== -1) found.add(byText)
  }

  return [...found]
}

function sameSet(a: number[], b: number[]) {
  return a.length === b.length && a.every((value) => b.includes(value))
}

/**
 * Two short options sit side by side the way the frame draws them; a paragraph
 * does not.
 *
 * The frame's own options are the literal string `<Option>`, so its 2x292
 * grid was never tested against real copy — Module 6's longest option runs 118
 * characters, which in a 280px column is six wrapped lines inside a pill drawn
 * around one. The threshold is measured rather than chosen: at 16px Inter, 48
 * characters is roughly the widest string that still fits one line in half of
 * this block's own content width.
 */
const DENSE_OPTION_CHARS = 48

export function YourTurnMcq({
  questions,
  labelledBy,
}: {
  questions: YourTurnQuestion[]
  /** The container's title, so the set is labelled without repeating it. */
  labelledBy: string
}) {
  const groupName = useId()
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<Record<number, number[]>>({})
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
  const gate = useSlideGate(`your-turn-mcq:${questions[0]?.question.slice(0, 32) ?? ''}`)
  useEffect(() => {
    if (questions.length > 0 && questions.every((_, i) => submitted[i])) gate.satisfy()
  }, [submitted, questions, gate])

  // Where focus goes after the next commit. Both transitions here unmount the
  // control that caused them — Submit disappears on submit, and the option set
  // is replaced on navigation — which is this project's most-repeated defect:
  // focus falls to `<body>` unless it is moved somewhere deliberate.
  const pending = useRef<'stem' | 'feedback' | null>(null)
  const stemRef = useRef<HTMLParagraphElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pending.current) return
    const target = pending.current === 'feedback' ? feedbackRef.current : stemRef.current
    pending.current = null
    // `preventScroll`: a programmatic `.focus()` scrolls its nearest scrollable
    // ancestor — and, where the document itself is scrollable, the page — to
    // bring the target into view. These two moves exist only to keep focus off
    // `<body>`; moving the viewport is not part of the job, and the stem sits
    // ABOVE the options, so without this the slide jumps upward the moment a
    // question is submitted.
    //
    // ⚠️ Reported 2026-09-18 as *"when I select the last option, the whole page
    // goes up"*. **Not reproduced here** — measured at 1512x900 and 1280x620,
    // `window.scrollY` stayed 0, the scroll container did not move, and
    // `document.documentElement.scrollHeight` never exceeded the viewport. So
    // this is the mechanism most likely to explain the report rather than a
    // confirmed cause, and it is applied because it is correct regardless.
    // If the jump persists, the thing to check is whether the DOCUMENT is
    // scrollable in that session (`scrollHeight > innerHeight`): the player is
    // `h-screen`, so it should never be, and if it is then a focus move
    // anywhere on the slide will move the page.
    target?.focus({ preventScroll: true })
  })

  const question = questions[index]
  const options = parseOptions(question.options ?? [])
  const correct = correctIndices(question.correctAnswer, options)
  const multiple = /multiple/i.test(question.selectMode ?? '')
  const selected = chosen[index] ?? []
  const isSubmitted = submitted[index] ?? false
  const isCorrect = isSubmitted && sameSet(selected, correct)

  // Direct instruction — one question means no set to move through.
  const showSet = questions.length > 1
  const dense = options.every((option) => option.label.length <= DENSE_OPTION_CHARS)

  function toggle(optionIndex: number) {
    if (isSubmitted) return
    setChosen((previous) => {
      const current = previous[index] ?? []
      if (!multiple) return { ...previous, [index]: [optionIndex] }
      return {
        ...previous,
        [index]: current.includes(optionIndex)
          ? current.filter((value) => value !== optionIndex)
          : [...current, optionIndex],
      }
    })
  }

  function go(to: number) {
    pending.current = 'stem'
    setIndex(to)
  }

  return (
    // 72px between the question, its feedback and the footer — the frame's own
    // outer gap, and the reason the footer does not jump when the feedback
    // panel appears: the panel takes the slot, the gaps do not change.
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
            {/* The pills are the only progress cue on screen; without this the
                set is silent to a screen reader. Outside the pill row, in
                normal flow — `sr-only` is `position:absolute` with
                `white-space:nowrap`, which widened the whole document once
                already when it was placed inside a row that clips. */}
            <span className="sr-only">
              Question {index + 1} of {questions.length}
            </span>
          </div>
        )}

        <fieldset className="flex flex-col gap-10">
          <legend className="sr-only">{question.question}</legend>
          {/* The visible stem is a `<p>`, not the legend: `<legend>` cannot
              carry the frame's two-line block, and it is already announced as
              the group's own name. `aria-hidden` so the two are not read
              twice. */}
          <div aria-hidden="true" className="flex flex-col gap-2 text-ink">
            <p ref={stemRef} tabIndex={-1} className="text-display-sm outline-none">
              {question.question}
            </p>
            <p className="text-sub-greeting leading-[1.4]">
              {multiple ? 'Choose one or more options' : 'Choose one option'}
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <div className={cn('grid gap-4', dense ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
              {options.map((option, optionIndex) => {
                const isChosen = selected.includes(optionIndex)
                // Direct instruction, 2026-09-17: *"on submitting answers, show
                // all correct ones"* — so a right answer the learner **missed**
                // turns green too, not only the ones they picked. This is a
                // deliberate override of the frame as drawn, which greened the
                // chosen-correct option and left a missed one plain. On a
                // select-multiple question that teaches nothing: it marks what
                // you got wrong without ever showing what the answer was. The
                // Figma component `2677:1101` was updated to match, so the two
                // no longer disagree.
                const showAsCorrect = isSubmitted && correct.includes(optionIndex)
                const gotItWrong = isSubmitted && isChosen && !correct.includes(optionIndex)
                const Glyph = gotItWrong ? CircleX : showAsCorrect || isChosen ? CircleCheck : Circle

                return (
                  <label
                    key={optionIndex}
                    className={cn(
                      // ⚠️ `relative` is load-bearing, not styling.
                      //
                      // The real `<input>` below is `sr-only`, which is
                      // `position: absolute`. Without a positioned ancestor its
                      // containing block is whatever ancestor happens to be
                      // positioned — NOT this label — so its box can land a long
                      // way from the control it belongs to. Clicking the label
                      // focuses that input, and the browser then scrolls it into
                      // view: it scrolls to the input's real box, walking up to
                      // the DOCUMENT when the slide container cannot satisfy it.
                      //
                      // Reported 2026-09-18, and the report is what localised it:
                      // *"as soon as i click [the last option] the whole page
                      // goes up"*. The LAST option is the one whose escaped box
                      // is furthest past the container's own scroll extent, so it
                      // is the one that forces the document to move — which is
                      // also why it does not reproduce at a viewport where the
                      // document has no overflow to give.
                      //
                      // With `relative` the input is positioned against this
                      // label, so "scroll the input into view" is a no-op
                      // whenever the option is already on screen. This is the
                      // same class as the Round 30 trap where `sr-only` inside a
                      // clipping row widened the whole document — same cause,
                      // vertical instead of horizontal.
                      'relative',
                      'flex min-h-12 min-w-0 cursor-pointer items-center gap-4 rounded-[28px] border px-5 py-[10px] text-body-md transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                      dense ? 'justify-center text-center' : 'text-left',
                      isSubmitted && 'cursor-default',
                      showAsCorrect && 'border-success bg-success text-white',
                      gotItWrong && 'border-destructive bg-destructive text-white',
                      isChosen &&
                        !isSubmitted &&
                        'border-primary bg-primary text-white',
                      !isChosen &&
                        !showAsCorrect &&
                        'border-primary bg-white text-primary' +
                          (isSubmitted ? '' : ' hover:bg-purple-50'),
                    )}
                  >
                    <input
                      type={multiple ? 'checkbox' : 'radio'}
                      name={multiple ? undefined : `${groupName}-${index}`}
                      className="sr-only"
                      checked={isChosen}
                      disabled={isSubmitted}
                      onChange={() => toggle(optionIndex)}
                    />
                    <span className="min-w-0 flex-1">
                      {option.label}
                      {/* A green pill on an option nobody picked is otherwise
                          indistinguishable, to a screen reader, from one they
                          did — same label, same disabled checkbox. */}
                      {showAsCorrect && !isChosen && (
                        <span className="sr-only"> (a correct answer you did not choose)</span>
                      )}
                      {showAsCorrect && isChosen && <span className="sr-only"> (correct)</span>}
                      {gotItWrong && <span className="sr-only"> (not correct)</span>}
                    </span>
                    <Glyph
                      aria-hidden="true"
                      className={cn(
                        'size-6 shrink-0',
                        !isChosen && !showAsCorrect && 'text-primary',
                      )}
                    />
                  </label>
                )
              })}
            </div>

            {!isSubmitted && (
              <button
                type="button"
                aria-disabled={selected.length === 0}
                onClick={
                  selected.length === 0
                    ? undefined
                    : () => {
                        pending.current = 'feedback'
                        setSubmitted((previous) => ({ ...previous, [index]: true }))
                      }
                }
                className={cn(
                  'inline-flex h-12 w-fit items-center justify-center rounded-[28px] px-5 py-[10px] text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  selected.length === 0
                    // The frame draws only the ready state. `purple-200/40` +
                    // `ink-muted` is this player's own disabled pill, already
                    // contrast-checked at 10.38:1 in the module footer — the
                    // `opacity-60` shortcut measured 2.35:1 when Round 14.5
                    // tried it.
                    ? 'cursor-not-allowed bg-purple-200/40 text-ink-muted'
                    : 'bg-ink-muted text-white hover:bg-ink',
                )}
              >
                Submit answer
                {selected.length === 0 && <span className="sr-only"> (choose an answer first)</span>}
              </button>
            )}
          </div>
        </fieldset>
      </div>

      {isSubmitted && (
        <AnswerOutcome
          panelRef={feedbackRef}
          message={isCorrect ? question.correctMessage : question.wrongMessage}
        />
      )}

      {showSet && (
        <div className="mt-12 flex items-center justify-between gap-4 rounded-[16px] bg-yellow-200 px-8 py-4">
          {/* A button for a question that does not exist is not disabled, it is
              absent (direct instruction, 2026-09-18: *"do not show next
              question, if there is none, i.e. dont even show disabled state"*).
              The row is `justify-between`, so dropping one button would slide
              the other across the bar; `SetSpacer` holds the missing button's
              own footprint so the survivor stays on its own side. */}
          {index > 0 ? (
            <SetButton direction="previous" onClick={() => go(index - 1)} />
          ) : (
            <SetSpacer />
          )}
          {index < questions.length - 1 ? (
            <SetButton
              direction="next"
              /* Gate: the current question must be SUBMITTED before the set
                 moves on (direct instruction, 2026-09-18). Without this a coach
                 pages through three questions, answers only the last, and the
                 slide's own gate still counts two of them unsubmitted — a dead
                 Next slide button with nothing on screen explaining which
                 question is outstanding. Disabled rather than absent, because
                 unlike the boundary case there genuinely IS a next question. */
              disabled={!isSubmitted}
              onClick={() => go(index + 1)}
            />
          ) : (
            <SetSpacer />
          )}
        </div>
      )}
    </div>
  )
}

/** The width a set button occupies, so an absent one can still hold its place
 *  in the `justify-between` bar rather than letting its partner drift across. */
const SET_BUTTON_WIDTH = 'w-[248px] max-w-full'

/** The footprint of a button that is deliberately not rendered — the boundary
 *  cases, where there is no previous or no next question to offer. Purely
 *  layout: no role, no label, nothing for a screen reader to meet. */
function SetSpacer() {
  return <span aria-hidden="true" className={cn('h-12 shrink', SET_BUTTON_WIDTH)} />
}

function SetButton({
  direction,
  disabled = false,
  onClick,
}: {
  direction: 'previous' | 'next'
  /** Only ever the "answer this one first" gate. A button with no question to
   *  move to is not rendered at all — see the bar's own comment. */
  disabled?: boolean
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
        'inline-flex h-12 items-center justify-center gap-4 rounded-[28px] border text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        SET_BUTTON_WIDTH,
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
      {disabled && <span className="sr-only"> (submit your answer first)</span>}
    </button>
  )
}
