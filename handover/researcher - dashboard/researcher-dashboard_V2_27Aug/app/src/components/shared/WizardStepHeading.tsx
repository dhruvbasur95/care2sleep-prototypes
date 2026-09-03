/**
 * The `Step N of M` + heading + subtitle block above every wizard step's
 * fields, plus the gap between it and those fields.
 *
 * Callers: `AddCoachTraineeModal` and `PlanSessionsModal`. Both also mount
 * `WizardProgressRail`; this block is the content pane's counterpart to it.
 * Each wizard hand-rolled this once and they drifted, so keep it shared.
 *
 * `STEP_CONTENT_GAP` is exported alongside on purpose. The two numbers compose:
 * this block's own `pb-2` sits inside the `mt-6` below it, so the **painted**
 * gap from subtitle to first control is 32px, not 24. Measure 32 when
 * verifying, and if you change either number, check the other.
 *
 * The three lines have deliberately different weights and colours. If the
 * subtitle drops to the counter's size they flatten into one grey mass and the
 * block stops reading as a hierarchy.
 */
export const STEP_CONTENT_GAP = 'mt-6'

export function WizardStepHeading({
  step,
  stepCount,
  heading,
  subtitle,
  headingRef,
}: {
  /** Zero-based index; rendered as `step + 1`. */
  step: number
  stepCount: number
  heading: string
  /**
   * Optional. Omit it when a step's third line is the step's *content* rather
   * than descriptive sub copy — content should not be muted into a subtitle it
   * is not.
   */
  subtitle?: string
  /**
   * ⚠️ Focus target for the heading, and the reason `tabIndex={-1}` is applied
   * conditionally below.
   *
   * Advancing a wizard step unmounts the control that was pressed, so focus
   * falls to `<body>` unless something claims it. `PlanSessionsModal` passes
   * this ref and focuses the heading on every step change. Any new caller with
   * more than one step needs to do the same — losing focus to `<body>` on an
   * unmounting control is the single most-repeated defect in this codebase.
   *
   * `tabIndex={-1}` is only set when a ref is passed, so the heading never
   * becomes a stop in normal Tab order for callers that do not need it.
   */
  headingRef?: React.Ref<HTMLHeadingElement>
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-caption-medium text-ink-muted">
        Step {step + 1} of {stepCount}
      </p>
      <div className="flex flex-col gap-1">
        <h3
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className="text-title font-display text-ink outline-none"
        >
          {heading}
        </h3>
        {subtitle && <p className="text-body text-ink-muted">{subtitle}</p>}
      </div>
    </div>
  )
}
