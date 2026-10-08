import { useLayoutEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Chapter } from '@/data/moduleContent'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'

/**
 * `knowledge-check-step` (design-tokens.md §26) — one question at a time,
 * own local state for which of the 5 is showing + whether revealed.
 * True/False buttons or free-text self-check per `answerFormat`, immediate
 * answer reveal, closing "Chapter {n} knowledge check complete" summary.
 *
 * **"Next question" is local sub-navigation, not step advancement** — all
 * 5 questions are one single player step, so moving between them is this
 * screen's own concern and stays a local button here (design-tokens.md
 * §30's global-footer contract). Only once the 5th question is revealed
 * does this screen report `canContinue: true` to the global footer, which
 * is what actually advances past the knowledge check as a whole.
 */
export function KnowledgeCheckScreen({
  chapter,
  onReadyChange,
}: {
  chapter: Chapter
  onReadyChange?: OnReadyChange
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [freeTextAnswer, setFreeTextAnswer] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<'True' | 'False' | null>(null)

  const questions = chapter.knowledgeCheck
  const total = questions.length
  const isLast = index === total - 1
  const question = questions[index]

  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: revealed && isLast })
  }, [revealed, isLast, onReadyChange])

  function goNextQuestion() {
    if (isLast) return
    setIndex((i) => i + 1)
    setRevealed(false)
    setFreeTextAnswer('')
    setSelectedChoice(null)
  }

  return (
    <SlideLayout
      eyebrow={`Question ${index + 1} of ${total} · ${question.type}`}
      title={question.question}
      isCurrent={Boolean(onReadyChange)}
    >
      <div className="mt-6">
        {question.answerFormat === 'true-false' ? (
          <div className="flex gap-3">
            {(['True', 'False'] as const).map((choice) => {
              const isCorrectChoice = question.answer.trim().toLowerCase().startsWith(choice.toLowerCase())
              const isSelected = selectedChoice === choice
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => {
                    // HANDOVER PACKAGE ONLY — accessibility fix, WCAG 2.4.3.
                    // See `aria-disabled` below: the guard replaces what the
                    // native `disabled` attribute used to enforce.
                    if (revealed) return
                    setSelectedChoice(choice)
                    setRevealed(true)
                  }}
                  /* HANDOVER PACKAGE ONLY — accessibility fix.
                     This was `disabled={revealed}`. Answering a question made
                     the button the coach had just activated natively disabled,
                     and the browser drops focus from a disabled element — so
                     `document.activeElement` fell to `<body>` on every answer,
                     measured. The reveal is announced correctly via the live
                     region, but a keyboard user lost their place in the slide.
                     `aria-disabled` conveys the same state while keeping the
                     element focusable, which is also this app's documented
                     convention for unavailable controls. */
                  aria-disabled={revealed}
                  className={cn(
                    'inline-flex h-9 flex-1 items-center justify-center rounded-full border px-[18px] text-caption-medium outline-none transition-all',
                    'focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
                    !revealed && 'border-primary text-primary hover:bg-primary/5',
                    revealed && isSelected && isCorrectChoice && 'cursor-not-allowed border-success bg-success/10 text-success',
                    revealed && isSelected && !isCorrectChoice && 'cursor-not-allowed border-destructive bg-destructive/10 text-destructive',
                    revealed && !isSelected && 'cursor-not-allowed border-hairline text-ink-faint opacity-60',
                  )}
                >
                  {choice}
                  {revealed && isSelected && (
                    <span className="sr-only">
                      {isCorrectChoice ? ' (your answer, correct)' : ' (your answer, incorrect)'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <label htmlFor={`kc-${chapter.id}-${index}`} className="sr-only">
              Your answer
            </label>
            <textarea
              id={`kc-${chapter.id}-${index}`}
              value={freeTextAnswer}
              onChange={(e) => setFreeTextAnswer(e.target.value)}
              disabled={revealed}
              rows={3}
              placeholder="Type your answer, then check it against the model answer below."
              className="w-full rounded-sm border border-hairline bg-card px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:bg-pearl disabled:text-ink-faint"
            />
            {!revealed && (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Show answer
              </button>
            )}
          </div>
        )}

        {revealed && (
          <div role="status" className="mt-4 space-y-1 border-t border-hairline pt-4">
            <p className="text-fine font-semibold text-ink-faint">Answer</p>
            <p className="text-body font-semibold text-ink">{question.answer}</p>
          </div>
        )}

        {revealed && !isLast && (
          <button
            type="button"
            onClick={goNextQuestion}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] sm:w-auto"
          >
            Next question
          </button>
        )}

        {revealed && isLast && (
          <p className="mt-6 text-body font-semibold text-ink">
            Chapter {chapter.number} knowledge check complete.
          </p>
        )}
      </div>
    </SlideLayout>
  )
}
