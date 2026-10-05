import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The numbered progress bar above a reflection wizard's question screens.
 *
 * Built in Round 53 for `TraineeReflectionModal` (direct instruction: *"a 6
 * stepper progress bar on top, centre aligned to page"*, then *"I want a
 * circle + horizontal stroke, each circle to have numbers, and as I move next,
 * update it to green state tick"*), and **extracted here at its second caller**
 * in Round 55, when the coach's own post-session reflection was rebuilt onto
 * the same shape (direct instruction: *"re-use SIPTEA pop-up component as we
 * used trainee reflection i.e. number progress bar at top"*).
 *
 * Three states, and the green tick is the one carrying information: a step is
 * **done** once the user has moved past it, which is not the same as answered —
 * nothing in either wizard is required, so a tick means "visited", and the
 * review screen is where unanswered components actually surface. Said plainly
 * because a green tick that implied "answered" would be the sort of quiet
 * untruth this project keeps having to retract.
 *
 * Black for the step you are on, not `primary` (direct instruction,
 * 2026-10-02). Green stays on the steps behind you — that pairing is what makes
 * "done" and "here" read as two different things rather than two shades of one.
 *
 * The connecting stroke is a flex sibling rather than a border or a
 * pseudo-element, so it absorbs the row's slack and the circles stay evenly
 * spaced at any panel width. It fills green behind a completed step for the
 * same reason the pathway rail's connector does — a broken line reads as a
 * broken sequence.
 *
 * ## ⚠️ Never render this without `ReflectionStepStatus`
 * The bar is **`aria-hidden` in full**: six circles and five strokes tell a
 * screen reader nothing. The position is carried entirely by the `role="status"`
 * line, which is why that line ships in this file rather than being left for
 * each caller to remember. A wizard that renders the bar alone has no
 * screen-reader position at all.
 */
export function ReflectionStepBar({ step, count }: { step: number; count: number }) {
  return (
    <div className="flex w-full justify-center">
      <div aria-hidden="true" className="flex w-full max-w-[420px] items-center">
        {Array.from({ length: count }, (_, i) => {
          const done = i < step
          const current = i === step
          return (
            <div key={i} className="flex min-w-0 flex-1 items-center last:flex-none">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-fine transition-colors',
                  done
                    ? 'border-success bg-success text-white'
                    : current
                      ? 'border-ink bg-ink text-white'
                      : 'border-hairline bg-card text-ink-faint',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              {/* The stroke belongs to the gap *after* a circle, so the last
                  circle has none — `last:flex-none` stops that final item
                  claiming a share of the row it does not need. */}
              {i < count - 1 && (
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
 * The bar's screen-reader half: the only thing that announces position.
 *
 * `label` is the caller's, because the two wizards reach the bar from different
 * numbers of post-question screens and "Review" announced three times running
 * would be worse than silence. A question screen passes
 * `Step N of M`; every screen past the questions passes its own name.
 */
export function ReflectionStepStatus({ label }: { label: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  )
}
