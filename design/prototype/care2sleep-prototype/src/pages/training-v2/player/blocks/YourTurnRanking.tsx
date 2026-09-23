import { useEffect, useId, useRef, useState } from 'react'
import { useSlideGate } from '../slideGate'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GripHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { YourTurnQuestion } from '@/data/moduleContent'
import { AnswerOutcome } from './AnswerOutcome'

/**
 * Ranking — the **Your turn** pattern's third interaction type.
 *
 * Built from the user's own mid-fi, `Ranking — mid-fi / Default
 * (horizontal)_My version` (`2681:1096`): a row of four white step cards and a
 * row of four `purple-200` drop fields, each carrying a 40px ghost numeral above
 * "Drop a step here". The mid-fi's own `purple-50` block surface was overridden
 * the same day — it is `yellow-50` now, and comes from the container.
 *
 * ## The source's numbering IS the answer
 * `module.md` writes the four options as "1. …" through "4. …" in the correct
 * order, and `correctAnswer` repeats the same four sentences in that order. So
 * the tiles must carry **neither the number nor the source order** — the prefix
 * is stripped and the pool is shuffled by a fixed, deterministic rotation. Print
 * the numbers on the cards and the exercise answers itself.
 *
 * ## Dragging, and the keyboard path beside it
 * Pointer dragging is `framer-motion`'s, hit-tested against the live slot rects
 * on every `onDrag` — not HTML5 drag-and-drop, which has no touch story and
 * cannot be styled mid-drag.
 *
 * ⚠️ **A drag is not operable by keyboard, and this is the first interaction in
 * this player where that bites.** Dragging is therefore one of two equal ways to
 * do the same thing, never the only one: a card can also be *picked up* with
 * Enter or Space, at which point every empty slot becomes a real button that
 * accepts it, and Escape puts it down. The picked-up state reuses the drag's own
 * shadow and ring, so there is one visual language rather than an accessible
 * alternative that looks like a different feature. Without this the block is a
 * WCAG 2.1.1 failure outright, so it is not optional and should not be removed
 * to "simplify" the component.
 */

/** `1. ` / `2) ` — the authored rank prefix, which is the answer key. */
const RANK_PREFIX = /^\s*(\d+)\s*[.)]\s*/

/**
 * How far the pool is rotated away from the authored order.
 *
 * A fixed rotation rather than `Math.random()`: a shuffle that changes on every
 * render would move cards under the learner's cursor, and one that changes per
 * mount makes the block untestable. 2 puts none of the four in its own answer
 * position, which a rotation of 1 or 3 also do — 2 is simply the one that also
 * separates the two "If the nap…" openings.
 */
const POOL_ROTATION = 2

interface Step {
  /** Position in the authored (correct) order, 0-based. */
  rank: number
  label: string
}

function parseSteps(options: string[]): Step[] {
  return options.map((option, index) => {
    const match = option.match(RANK_PREFIX)
    return {
      rank: match ? Number(match[1]) - 1 : index,
      label: match ? option.slice(match[0].length).trim() : option.trim(),
    }
  })
}

export function YourTurnRanking({
  question,
  labelledBy,
}: {
  question: YourTurnQuestion
  /** The container's title, so the exercise is labelled without repeating it. */
  labelledBy: string
}) {
  const steps = parseSteps(question.options ?? [])
  const slotCount = steps.length
  const instructionsId = useId()
  const reduceMotion = useReducedMotion()

  /** `slots[i]` is the index into `steps` sitting at rank i, or null. */
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(slotCount).fill(null))
  /** The card the learner is currently carrying — by drag or by keyboard. */
  const [carrying, setCarrying] = useState<number | null>(null)
  /** Which empty slot the pointer is over mid-drag. */
  const [hoverSlot, setHoverSlot] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  /**
   * Gate: **the ranking submitted.** One exercise, one commit — and the block
   * will not let a coach submit a partial order anyway, so this is "every card
   * placed, then checked".
   *
   * Distinct prefix from the two question-set blocks above: slide 22 carries a
   * free-text set and this exercise together, and both have to be satisfied
   * before its Next opens.
   */
  const gate = useSlideGate(`your-turn-rank:${question.question.slice(0, 32)}`)
  useEffect(() => {
    if (submitted) gate.satisfy()
  }, [submitted, gate])

  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const outcomeRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<'outcome' | null>(null)

  useEffect(() => {
    if (pendingFocus.current !== 'outcome') return
    pendingFocus.current = null
    outcomeRef.current?.focus()
  })

  // Escape puts a keyboard-carried card down wherever it came from. A global
  // listener rather than one per card: the card that was picked up may no longer
  // hold focus by the time the learner gives up on it.
  useEffect(() => {
    if (carrying === null) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setCarrying(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [carrying])

  const pool = steps
    .map((_, index) => index)
    .filter((index) => !slots.includes(index))
    // The authored order is the answer, so the pool is presented rotated.
    .sort((a, b) => ((a + POOL_ROTATION) % slotCount) - ((b + POOL_ROTATION) % slotCount))

  const allPlaced = slots.every((slot) => slot !== null)
  const correctCount = slots.filter((step, rank) => step !== null && steps[step].rank === rank).length
  const allCorrect = correctCount === slotCount

  function announce(message: string) {
    if (liveRef.current) liveRef.current.textContent = message
  }

  function place(stepIndex: number, rank: number) {
    setSlots((previous) => {
      const next = [...previous]
      // A card can only be in one place, so vacate wherever it was.
      const from = next.indexOf(stepIndex)
      if (from !== -1) next[from] = null
      // Dropping onto an occupied slot sends its current card back to the pool
      // rather than silently discarding it.
      next[rank] = stepIndex
      return next
    })
    setCarrying(null)
    setHoverSlot(null)
    announce(`Step placed at position ${rank + 1}.`)
  }

  function sendBack(rank: number) {
    setSlots((previous) => {
      const next = [...previous]
      next[rank] = null
      return next
    })
    announce(`Step removed from position ${rank + 1} and returned to the steps.`)
  }

  /** Which slot a pointer at these viewport coordinates is over. */
  function slotAt(x: number, y: number) {
    for (let i = 0; i < slotCount; i += 1) {
      const rect = slotRefs.current[i]?.getBoundingClientRect()
      if (!rect) continue
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return i
    }
    return null
  }

  /**
   * **2x2** — direct instruction, 2026-09-17: *"stack the cards 2x2"*.
   *
   * The mid-fi draws one row of four, but it is drawn at 1057px and this block
   * renders inside the player's 656px slide column: four across there is four
   * ~130px cards, which an earlier pass shipped because the breakpoint was keyed
   * to the viewport rather than to the container it applied to. Two columns give
   * the same card the mid-fi's own proportions. It drops to one column below
   * 420px, where two would be ~150px each.
   *
   * The pool and the positions share this, so their columns always line up.
   */
  const gridCols = 'grid-cols-1 min-[420px]:grid-cols-2'

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
      {/* No surface of its own. Direct instruction, 2026-09-17: *"use yellow 50
          for this drag and drop ranking style"* — which is the tint
          `InteractiveBlock` already owns, so the block now takes it from the
          container (`surface="panel"`, `surfaceScope="content"`) exactly as
          multiple choice does, rather than drawing a second one here. The
          mid-fi's `purple-50` box is superseded, and its 32px inset with it: the
          container's 40px is the number that belongs to every interactive
          block. */}
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2 text-ink">
          <p className="text-display-sm">{question.question}</p>
          <p id={instructionsId} className="text-sub-greeting leading-[1.4]">
            Drag each step into the order you would follow, then submit. You can also press
            Enter on a step to pick it up, then choose a position.
          </p>
        </div>

        {/* ── the pool ──────────────────────────────────────────────────── */}
        {!submitted && (
          <section className="flex flex-col gap-4">
            <h3 className="text-body-md text-ink-faint">Steps to order</h3>
            {/* A grid, not a flex row. As cards leave, the remaining ones keep
                their width and move into the columns on the left — "stack the
                cards on left" — where `flex-1` children would instead grow to
                fill the gap. `layout` on the wrapper is what animates that
                travel; it sits on a wrapper rather than on the draggable itself
                because `layout` and `drag` fight for the same transform. */}
            <div className={cn('grid gap-6', gridCols)}>
              <AnimatePresence initial={false}>
                {pool.map((stepIndex) => (
                  <motion.div
                    key={stepIndex}
                    layout={!reduceMotion}
                    initial={false}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="min-w-0"
                  >
                    <StepCard
                      label={steps[stepIndex].label}
                      carried={carrying === stepIndex}
                      describedBy={instructionsId}
                      onPickUp={() =>
                        setCarrying((current) => {
                          const next = current === stepIndex ? null : stepIndex
                          announce(
                            next === null
                              ? 'Step put down.'
                              : 'Step picked up. Choose a position, or press Escape to put it down.',
                          )
                          return next
                        })
                      }
                      onDragMove={(x, y) => setHoverSlot(slotAt(x, y))}
                      onDragStart={() => setCarrying(stepIndex)}
                      onDragEnd={(x, y) => {
                        const rank = slotAt(x, y)
                        if (rank !== null) place(stepIndex, rank)
                        else {
                          setCarrying(null)
                          setHoverSlot(null)
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {pool.length === 0 && (
              <p className="text-body text-ink-faint">
                Every step is placed. Check the order, then submit.
              </p>
            )}
          </section>
        )}

        {/* ── the four positions ────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h3 className="text-body-md text-ink-faint">Your order</h3>
          <div className={cn('grid gap-6', gridCols)}>
            {slots.map((stepIndex, rank) => {
              const isRight = submitted && stepIndex !== null && steps[stepIndex].rank === rank
              const isWrong = submitted && stepIndex !== null && steps[stepIndex].rank !== rank
              const isTarget = carrying !== null && (hoverSlot === rank || stepIndex === null)

              return (
                <div
                  key={rank}
                  ref={(node) => {
                    slotRefs.current[rank] = node
                  }}
                  className="min-w-0"
                >
                  {stepIndex === null ? (
                    <EmptySlot
                      rank={rank}
                      // Mid-drag hover, and the keyboard equivalent: while a
                      // card is carried every empty slot is a live target, and
                      // the one under the pointer is the hovered one.
                      hovered={hoverSlot === rank && carrying !== null}
                      armed={carrying !== null}
                      onChoose={carrying !== null ? () => place(carrying, rank) : undefined}
                    />
                  ) : (
                    <FilledSlot
                      rank={rank}
                      label={steps[stepIndex].label}
                      submitted={submitted}
                      isRight={isRight}
                      isWrong={isWrong}
                      isTarget={isTarget}
                      carried={carrying === stepIndex}
                      describedBy={instructionsId}
                      onRemove={() => sendBack(rank)}
                      onPickUp={() =>
                        setCarrying((current) => (current === stepIndex ? null : stepIndex))
                      }
                      onDragMove={(x, y) => setHoverSlot(slotAt(x, y))}
                      onDragStart={() => setCarrying(stepIndex)}
                      onDragEnd={(x, y) => {
                        const to = slotAt(x, y)
                        if (to !== null && to !== rank) place(stepIndex, to)
                        else if (to === null) {
                          // Dropped outside every position — back to the pool,
                          // which is the drag equivalent of the card's own ×.
                          sendBack(rank)
                          setCarrying(null)
                        } else {
                          setCarrying(null)
                        }
                        setHoverSlot(null)
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {!submitted && (
          <div className="flex">
            <button
              type="button"
              aria-disabled={!allPlaced}
              onClick={
                !allPlaced
                  ? undefined
                  : () => {
                      pendingFocus.current = 'outcome'
                      setSubmitted(true)
                    }
              }
              className={cn(
                'inline-flex h-12 w-fit items-center justify-center rounded-[28px] px-5 py-[10px] text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                allPlaced
                  ? 'bg-ink-muted text-white hover:bg-ink'
                  : 'cursor-not-allowed bg-purple-200/40 text-ink-muted',
              )}
            >
              Submit answer
              {!allPlaced && <span className="sr-only"> (place every step first)</span>}
            </button>
          </div>
        )}

        {/* Drag and drop changes the page without any other announcement. */}
        <div ref={liveRef} role="status" aria-live="polite" className="sr-only" />
      </div>

      {/* ── after submit ──────────────────────────────────────────────────
          The avatar message first, then the correct order (direct instruction,
          2026-09-17: *"for order and drop, first show the avatar message, then
          suggested order"*). It reads better in that order too: the message says
          how it went, the list says what it should have been. */}
      {submitted && (
        <AnswerOutcome
          panelRef={outcomeRef}
          message={allCorrect ? question.correctMessage : question.wrongMessage}
        />
      )}

      {/* Only when they got it wrong (direct instruction: *"if the order is
          correct then why do we suggest?"*). A learner who has just built the
          right sequence is otherwise shown their own four cards back, in the
          order they are already looking at, under a heading implying they should
          have done something else. Four green marks and the question's own
          correct message have already said it. */}
      {submitted && !allCorrect && (
        <div className="flex flex-col gap-6 rounded-[16px] border border-success bg-white p-6">
          <p className="text-body-md text-success">Following is the correct order</p>
          <ol className="flex flex-col gap-3">
            {[...steps]
              .sort((a, b) => a.rank - b.rank)
              .map((step) => (
                <li key={step.rank} className="flex gap-3">
                  <span className="text-body-md text-primary">{step.rank + 1}.</span>
                  <span className="min-w-0 flex-1 text-body text-ink">{step.label}</span>
                </li>
              ))}
          </ol>
        </div>
      )}
    </div>
  )
}

/** The shadow and lift a card takes while it is being carried, by either route. */
const CARRIED = 'shadow-float ring-2 ring-primary'

function StepCard({
  label,
  carried,
  describedBy,
  onPickUp,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  label: string
  carried: boolean
  describedBy: string
  onPickUp: () => void
  onDragStart: () => void
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
}) {
  return (
    <motion.button
      type="button"
      drag
      dragSnapToOrigin
      dragMomentum={false}
      onDragStart={onDragStart}
      onDrag={(_, info) => onDragMove(info.point.x, info.point.y)}
      onDragEnd={(_, info) => onDragEnd(info.point.x, info.point.y)}
      onClick={onPickUp}
      aria-pressed={carried}
      aria-describedby={describedBy}
      // `whileDrag` rather than a state class: it survives the pointer leaving
      // the element, which a `:active` or an `onMouseDown` flag does not.
      whileDrag={{ scale: 1.03, zIndex: 50 }}
      className={cn(
        // `select-none` and `touch-none` are load-bearing, not tidiness: a drag
        // that starts on text otherwise runs the browser's own selection
        // alongside the card, and the learner ends up with half the slide
        // highlighted behind a card they were only trying to move. Seen
        // directly while testing the pointer path.
        'flex h-full w-full cursor-grab touch-none flex-col gap-3 rounded-[16px] border border-primary bg-white p-4 text-left select-none outline-none transition-shadow active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring',
        carried && CARRIED,
      )}
    >
      <GripHorizontal aria-hidden="true" className="size-5 text-ink-faint" />
      <span className="text-body text-ink">{label}</span>
      <span className="sr-only">
        {carried ? ' (picked up — choose a position)' : ' (press Enter to pick this step up)'}
      </span>
    </motion.button>
  )
}

function EmptySlot({
  rank,
  hovered,
  armed,
  onChoose,
}: {
  rank: number
  hovered: boolean
  armed: boolean
  onChoose?: () => void
}) {
  const body = (
    <>
      {/* The mid-fi's own 40px ghost numeral, inside the field rather than on a
          badge beside it. */}
      <span aria-hidden="true" className="text-display-lg text-yellow-400">
        {rank + 1}
      </span>
      <span className="text-body text-ink-muted">Drop a step here</span>
    </>
  )

  // Direct instruction, 2026-09-17: *"update the empty states also, use yellow
  // tokens."* The mid-fi drew these `purple-200` on a `purple-50` block; the
  // block is `yellow-50` now, so a purple field on it is the last piece of the
  // superseded palette rather than a decision. `yellow-200` is the step that
  // separates from `yellow-50` the way `purple-200` separated from `purple-50` —
  // `yellow-100` is barely a shade apart from the block behind it.
  const shell = cn(
    'flex h-[152px] w-full flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed p-6 text-center transition-colors',
    hovered
      ? // Hovering an empty field mid-carry: the fill deepens and the dashes
        // become a solid edge, so the target reads as a target rather than as
        // one of four identical boxes.
        'border-solid border-yellow-400 bg-yellow-300'
      : 'border-yellow-400 bg-yellow-200',
  )

  if (!armed || !onChoose) {
    return <div className={shell}>{body}</div>
  }

  // Only a control while something is actually being carried — an empty field
  // with nothing to put in it is not actionable, and a focusable box that does
  // nothing is worse than no box.
  return (
    <button
      type="button"
      onClick={onChoose}
      className={cn(
        shell,
        'cursor-pointer outline-none hover:border-solid hover:border-yellow-400 hover:bg-yellow-300 focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {body}
      <span className="sr-only">Place the step you are carrying at position {rank + 1}</span>
    </button>
  )
}

function FilledSlot({
  rank,
  label,
  submitted,
  isRight,
  isWrong,
  isTarget,
  carried,
  describedBy,
  onRemove,
  onPickUp,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  rank: number
  label: string
  submitted: boolean
  isRight: boolean
  isWrong: boolean
  isTarget: boolean
  carried: boolean
  describedBy: string
  onRemove: () => void
  onPickUp: () => void
  onDragStart: () => void
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
}) {
  return (
    // Direct instruction, 2026-09-17: *"when the card has been dropped, use blue
    // to show dropped state, i.e. from white change to blue, text becomes
    // white."* "Blue" is this project's purple — the same word was used for the
    // interactive-block sub title, which shipped as `primary`, and for the
    // chapter intro's purple wave. The portal has no blue.
    //
    // After submit the fill carries the marking instead, in multiple choice's
    // own answered language: correct is a `success` fill, wrong a `destructive`
    // one, both with white copy. So a placed card is never white again — it is
    // blue while it is an answer and green or red once it has been marked.
    <div
      className={cn(
        'relative flex h-[152px] w-full flex-col rounded-[16px] border-2 p-4 text-white transition-colors',
        isRight && 'border-success bg-success',
        isWrong && 'border-destructive bg-destructive',
        !submitted &&
          (isTarget
            ? 'border-primary-hover bg-primary-hover'
            : 'border-primary bg-primary'),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Full white, not `white/70` (direct instruction, 2026-09-17). On the
            blue card the rank is the only thing saying which position this is,
            so it is content rather than a watermark — 70% took it to 7.9:1 where
            solid white is 11.78:1. */}
        <span aria-hidden="true" className="text-body-md text-white">
          {rank + 1}
        </span>
        {!submitted && (
          // Direct instruction: *"needs to x to move the card back"*. A real
          // control, not only a drag — this is also the only way back for a
          // keyboard or touch user who cannot complete a drag gesture.
          <button
            type="button"
            onClick={onRemove}
            className="-m-2 flex size-9 shrink-0 items-center justify-center rounded-full text-white outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
          >
            <X aria-hidden="true" className="size-4" />
            <span className="sr-only">Remove this step from position {rank + 1}</span>
          </button>
        )}
      </div>

      {submitted ? (
        <p className="mt-1 min-w-0 flex-1 overflow-y-auto text-body">{label}</p>
      ) : (
        <motion.button
          type="button"
          drag
          dragSnapToOrigin
          dragMomentum={false}
          onDragStart={onDragStart}
          onDrag={(_, info) => onDragMove(info.point.x, info.point.y)}
          onDragEnd={(_, info) => onDragEnd(info.point.x, info.point.y)}
          onClick={onPickUp}
          aria-pressed={carried}
          aria-describedby={describedBy}
          whileDrag={{ scale: 1.03, zIndex: 50 }}
          className={cn(
            'mt-1 min-w-0 flex-1 cursor-grab touch-none overflow-y-auto rounded-[8px] text-left text-body select-none outline-none transition-shadow active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-white',
            // The carried ring is white here rather than `primary`: on a blue
            // card a primary ring is invisible.
            carried && 'shadow-float ring-2 ring-white',
          )}
        >
          {label}
          <span className="sr-only"> (press Enter to move this step)</span>
        </motion.button>
      )}
    </div>
  )
}
