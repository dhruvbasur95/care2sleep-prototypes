import { useLayoutEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'

const RATING_MAX = 5

/**
 * Module feedback — the last step before "Module complete" (Round 22 direct
 * edit, `playerSteps.ts`'s `feedback` step). A 0-5 star rating plus a free
 * -text comment, both optional: like `ModuleOutroScreen`'s own reflection
 * field, Continue is never gated on giving feedback, and neither value is
 * persisted anywhere beyond local component state — this is the trainee's
 * own read on the module, not a scored or reviewed artifact, so it follows
 * the exact same "ungraded, ephemeral" precedent this player already
 * established for the outro rather than inventing a new one.
 *
 * The star control is a `role="group"` of 5 real toggle buttons, not
 * `role="radiogroup"`/`"radio"` — this project tried that pattern once
 * before (`WeekdayPicker`) and it shipped without the roving-tabindex/arrow
 * -key contract those roles require, an accessibility Critical caught and
 * fixed by switching to plain toggle buttons. Doing the same here from the
 * start rather than repeating the mistake.
 */
export function ModuleFeedbackSlide({ onReadyChange }: { onReadyChange?: OnReadyChange }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: true, label: 'Complete module' })
  }, [onReadyChange])

  return (
    <SlideLayout
      eyebrow="Module feedback"
      title="How was this module?"
      body="Your rating and comments help us improve future modules. Both are optional."
      isCurrent={Boolean(onReadyChange)}
    >
      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span id="module-feedback-rating-label" className="text-fine font-semibold text-ink-faint">
            Rating
          </span>
          <div
            role="group"
            aria-labelledby="module-feedback-rating-label"
            className="flex items-center gap-1"
          >
            {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((star) => {
              const filled = star <= rating
              return (
                <button
                  key={star}
                  type="button"
                  aria-pressed={filled}
                  aria-label={`Rate ${star} out of ${RATING_MAX} stars`}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="flex size-11 items-center justify-center rounded-sm outline-none transition-colors hover:bg-pearl focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    aria-hidden="true"
                    className={cn(
                      'size-6',
                      filled ? 'fill-primary text-primary' : 'fill-none text-ink-faint',
                    )}
                    strokeWidth={1.5}
                  />
                </button>
              )
            })}
            <span aria-live="polite" className="sr-only">
              {rating === 0 ? 'No rating selected' : `${rating} out of ${RATING_MAX} stars selected`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="module-feedback-comment" className="text-fine font-semibold text-ink-faint">
            Comments
          </label>
          <textarea
            id="module-feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            placeholder="What worked, what didn't, anything you'd change?"
            className="w-full rounded-sm border border-hairline bg-card px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
    </SlideLayout>
  )
}
