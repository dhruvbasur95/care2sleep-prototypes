import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A numbered vertical timeline: a 40px numbered disc per step, joined to the
 * next by a dotted rule, with the step's content beside it.
 *
 * Extracted 2026-11-09 from `SessionPlanEmptyBanner` (its two-step "get in
 * touch / create the plan" timeline) at its second caller, the coach
 * checklist's Client’s module tab (direct instruction: "reuse component from
 * session plan creation card"). The markup and classes are the banner's own,
 * moved verbatim — the banner renders byte-identical.
 *
 * - **Colours come from the caller** (`markerClassName`, `ruleClassName`).
 *   Never white on a yellow tint: the banner's purple card takes
 *   `bg-yellow-200 text-ink` markers, a light ground takes
 *   `bg-primary text-white`. Write the classes as literals at the call site —
 *   a Tailwind class built from a variable emits no CSS.
 * - **The rule is painted** (`repeating-linear-gradient`), not `border-dotted`:
 *   CSS derives a dotted border's dot spacing from its width, so stroke and gap
 *   cannot be set independently.
 * - **The step gap lives inside the row** (`stepGapClassName`, on every step
 *   but the last) so the rule spans it; a `gap` on the `<ol>` would break the
 *   line between steps. Keyed on the index, NOT `last:` — `:last-child` here
 *   matches the content column inside every `<li>` and zeroed every gap once.
 * - The number is `aria-hidden`; the `<ol>` already announces the order.
 */
export function NumberedTimeline({
  steps,
  markerClassName,
  ruleClassName,
  contentClassName,
  stepGapClassName = 'pb-16',
  className,
}: {
  steps: readonly { key: string; content: ReactNode }[]
  markerClassName: string
  ruleClassName: string
  /** Added to each step's content column (`flex flex-col gap-2`). */
  contentClassName?: string
  /** Space below every step but the last, inside the row. Default 64px. */
  stepGapClassName?: string
  className?: string
}) {
  return (
    <ol className={cn('flex flex-col', className)}>
      {steps.map((step, i) => (
        <li key={step.key} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full text-body-md',
                markerClassName,
              )}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className={cn('w-[1.5px] flex-1', ruleClassName)} />
            )}
          </div>
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-2',
              contentClassName,
              i < steps.length - 1 && stepGapClassName,
            )}
          >
            {step.content}
          </div>
        </li>
      ))}
    </ol>
  )
}
