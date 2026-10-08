import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The step-progress rail down the left side of every multi-step wizard modal.
 * Callers: `AddCoachTraineeModal` and `PlanSessionsModal`.
 *
 * Responsive by design, and the mobile branch is not cosmetic: below `md` the
 * markers lay out **horizontally** as a compact stepper with no labels. A
 * vertical rail at narrow widths stacks above the content and pushes the
 * step's actual heading and fields below the fold. The content pane's own
 * heading already names the active step, so the labels are not lost.
 *
 * ⚠️ CONTRACT FOR ANY NEW CALLER — this component does not stand alone:
 *
 *  1. **Wrap it in `shrink-0 rounded-lg bg-primary/10 p-4 md:p-6`.** The
 *     marker, connector and label colours below are calibrated for that tint
 *     and under-contrast badly on plain white. The wrapper is part of the
 *     component's contract, not the caller's styling choice.
 *  2. **Lay the modal out as `md:grid-cols-[3fr_7fr]`** — rail, then content
 *     pane. A proportional 30/70 split, not a fixed pixel width, so it scales
 *     with the panel.
 *  3. **Give the modal a `font-display text-title text-ink` `<h2>`.** All
 *     wizards share one title treatment; a smaller or muted variant makes one
 *     modal look like a different component.
 *
 * ACCESSIBILITY: every marker is `aria-hidden` — the rail is a picture of
 * progress, and the real announcement is the `aria-live` "Step N of M"
 * text. There are two copies of that text, one for each breakpoint, because
 * the desktop label block is `hidden` below `md` and a live region inside a
 * `display: none` subtree announces nothing. Both copies must stay.
 */
export interface WizardRailStep {
  key: string
  /** Short label shown in the rail (desktop only). Two or three words. */
  navLabel: string
  /** Fuller heading, used **only** in the "Step N of M: {heading}" live-region
   *  announcement — never rendered visibly. Falls back to `navLabel` when a
   *  wizard's rail label is already the full heading. */
  heading?: string
}

export function WizardProgressRail({
  steps,
  current,
  ariaLabel,
  liveTextVisible = false,
  liveTextSuffix,
}: {
  steps: WizardRailStep[]
  current: number
  ariaLabel: string
  /** Renders the "Step N of M" live text visibly under the current step's
   *  label as well as announcing it. Off by default; no current caller. */
  liveTextVisible?: boolean
  /** Extra `sr-only` context appended after the live text (e.g. "— reflection for {name}"). */
  liveTextSuffix?: string
}) {
  const stepCount = steps.length
  return (
    <nav aria-label={ariaLabel}>
      <ol className="flex items-center md:flex-col md:items-stretch">
        {steps.map((step, i) => {
          const state = i < current ? 'answered' : i === current ? 'current' : 'upcoming'
          const last = i === stepCount - 1
          return (
            <li
              key={step.key}
              className={cn(
                'flex items-center md:flex-none md:items-stretch md:gap-4',
                !last && 'flex-1',
              )}
            >
              <div className={cn('flex items-center md:flex-none md:flex-col', !last && 'flex-1')}>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-fine font-semibold md:size-8 md:text-caption',
                    state === 'answered' && 'bg-success text-white',
                    state === 'current' && 'bg-primary text-white',
                    state === 'upcoming' && 'border-2 border-primary bg-white',
                  )}
                >
                  {state === 'answered' ? (
                    <Check className="size-3.5 md:size-4" />
                  ) : state === 'current' ? (
                    i + 1
                  ) : (
                    <span className="size-2 rounded-full bg-divider-soft" />
                  )}
                </span>
                {!last && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mx-1.5 h-0.5 flex-1 md:mx-0 md:my-1.5 md:h-auto md:w-0.5',
                      state === 'answered' ? 'bg-success/90' : 'bg-primary/90',
                    )}
                  />
                )}
              </div>
              <div className={cn('hidden md:block md:flex-1 md:pt-1', !last && 'md:pb-12')}>
                {/* Do not add `font-semibold` here. `caption-medium` carries
                    its own weight (500); an explicit weight class overrides
                    the token and silently renders 600, so the label opts out
                    of the step it claims to use. */}
                <p
                  className={cn(
                    'text-caption-medium',
                    state === 'upcoming' ? 'text-ink-muted' : 'text-ink',
                  )}
                >
                  {step.navLabel}
                </p>
                {state === 'current' &&
                  (liveTextVisible ? (
                    <p aria-live="polite" className="mt-0.5 text-caption text-ink-faint">
                      Step {i + 1} of {stepCount}: {step.heading ?? step.navLabel}
                    </p>
                  ) : (
                    <p aria-live="polite" className="sr-only">
                      Step {i + 1} of {stepCount}: {step.heading ?? step.navLabel}
                      {liveTextSuffix}
                    </p>
                  ))}
              </div>
              {/* Mobile-only live announcement. The block above is `hidden`
                  below `md`, and a live region inside a `display: none`
                  subtree announces nothing — so this second copy is required,
                  not redundant. */}
              {state === 'current' && (
                <p aria-live="polite" className="sr-only md:hidden">
                  Step {i + 1} of {stepCount}: {step.heading ?? step.navLabel}
                  {liveTextSuffix}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
