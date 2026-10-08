import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shared step-progress rail for every multi-step wizard modal in this app
 * (`AddCoachTraineeModal`, `AddAnnotationSummaryModal`, `EnrollConsumerDialog`,
 * `PlanSessionsModal`) — previously four separately-duplicated copies of the
 * same dot/connector markup. Extracted (Round 14.1) specifically to fix a
 * shared mobile defect: at narrow widths, every one of those copies stacked
 * the rail as a full vertical list ABOVE the step content (`grid-cols-1`),
 * pushing the actual step heading/fields below the fold. Below `md`, this
 * component now lays the same markers out horizontally (a compact stepper,
 * connecting lines only, no visible labels — the step's own heading in the
 * content pane already says what's active) instead of vertically; at `md`
 * and up it renders exactly as before (vertical list, full labels).
 *
 * Direct feedback (this round): markers sized down slightly (`size-9`→
 * `size-8` desktop, `size-7`→`size-6` mobile, icon/number text scaled to
 * match); the vertical gap between rail steps opened up (`md:pb-8`→
 * `md:pb-12`, "spread vertically") so the connector lines read as less
 * cramped now that the column itself is wider. Every modal that renders
 * this component alongside its content pane must use a `3fr_7fr` grid-cols
 * split (a 30/70 proportional split, not a fixed pixel width, so it scales
 * with the panel — briefly `2fr_3fr`/40-60 before direct feedback that the
 * rail was still too wide relative to the content pane; before that, an
 * inconsistent `280px_1fr`/`240px_1fr` fixed-width split across different
 * modals, then briefly a uniform `350px_1fr`). Also applies to every
 * modal's own top-level `<h2>` title: it must use the same `font-display
 * text-title text-ink` treatment this rail's modals share, not a
 * smaller/muted variant — see `PlanSessionsModal`'s "Plan sessions"
 * heading, previously the one outlier at `text-caption`. (`PlanSessionsModal`'s
 * own *welcome* screen heading, shown before this rail ever mounts, is a
 * deliberate exception — sized up to `text-display-md` since it's acting as
 * a one-time hero title, not a title stacked directly above a same-size
 * step heading the way every other modal's top-level `<h2>` is.)
 *
 * The rail-wrapping `<div>` each modal renders around this component is a
 * light-blue tinted box (`shrink-0 rounded-lg bg-primary/10 p-4 md:p-6`) —
 * originally a `PlanSessionsModal`-only treatment (a plain `md:border-r
 * md:border-hairline md:pr-4` divider before that), rolled out to all
 * four wizards for visual consistency once it was clear this reads better
 * than a bare divider. The marker/connector/label colors below are
 * calibrated specifically for that tint (see the contrast measurements in
 * this file's own history) — they'd under-contrast badly on a plain white
 * background, so don't reuse this component without also using that exact
 * wrapper.
 */
export interface WizardRailStep {
  key: string
  /** Short label shown in the rail (desktop only). */
  navLabel: string
  /** Fuller heading used only for the "Step N of M: {heading}" live-region
   *  announcement — falls back to `navLabel` when a wizard has no separate
   *  heading string (e.g. `AddAnnotationSummaryModal`, whose SIPTEA labels
   *  are already the full heading). */
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
  /** `AddAnnotationSummaryModal`'s one visible-copy convention — every other
   *  wizard keeps the live text `sr-only`. */
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
                    /* Round 39, direct instruction ("fix inner rings"): a
                       1px hairline-weight outline in `purple-200`, down from a
                       2px `primary` ring. Paired with the grey dot that used to
                       sit inside it, a heavy ring read as two concentric rings
                       on one 32px marker — a step that has not been reached
                       does not need that much ink. */
                    state === 'upcoming' && 'border border-purple-200 bg-white',
                  )}
                >
                  {state === 'answered' ? (
                    <Check className="size-3.5 md:size-4" />
                  ) : state === 'current' ? (
                    i + 1
                  ) : /* Nothing. The inner `size-2` dot is gone — an outlined
                        circle is already the conventional "not reached" marker,
                        and the dot inside it was the second of the two rings.
                        Note this reaches all four wizards using this component;
                        it is a defect fix rather than a per-caller preference,
                        so it is not behind a flag. */
                  null}
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
                {/* Round 28, direct instruction: step labels moved
                    `text-body font-semibold` (16/600) -> `caption-medium`
                    (14/500). Changed here rather than per modal — this one
                    component is the left timeline in all four wizards
                    (`EnrollConsumerDialog`, `AddCoachTraineeModal`,
                    `PlanSessionsModal`, `AddAnnotationSummaryModal`), which is
                    exactly why it was extracted in Round 14.1.

                    The `font-semibold` is dropped, not kept alongside: leaving
                    it would override `caption-medium`'s own 500 and the label
                    would still render 600, the same trap two buttons hit
                    earlier this round. */}
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
              {/* Mobile-only live announcement — the visible label above is `hidden` below `md`,
                  so the sr-only text needs its own always-mounted copy for that breakpoint. */}
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
