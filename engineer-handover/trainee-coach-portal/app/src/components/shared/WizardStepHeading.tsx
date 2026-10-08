/**
 * The `Step N of M` + heading + subtitle block that sits above every wizard
 * step's fields, and the gap between it and those fields.
 *
 * Extracted in Round 28 from Figma frame `334:36` (`pane-headings`), after the
 * same treatment had to be applied to a second wizard. The four wizards on the
 * shared `WizardProgressRail` had each hand-rolled this block, and they had
 * already drifted — which is the same reason the rail itself was extracted in
 * Round 14.1.
 *
 * Transcribed from the frame:
 * - `py-2` on the block (8px top and bottom).
 * - **16px** between the step counter and the heading pair. Previously 4px,
 *   which made the counter read as part of the heading rather than as a
 *   position marker.
 * - 4px between the heading and its subtitle.
 * - Step counter: `caption-medium` in `ink-muted` (was `caption`/600 in
 *   `ink-faint`).
 * - Subtitle: `body` in `ink-muted` (was `caption` in `ink-faint`) — this is
 *   what gives the block its hierarchy; at `caption` it matched the counter
 *   and the three lines flattened into one grey mass.
 *
 * `STEP_CONTENT_GAP` is exported alongside deliberately: the frame's
 * `content-pane` gap is 24px, but this block's own `pb-2` sits between them,
 * so the **painted** gap from subtitle to first control is 32px. Anyone
 * verifying should measure 32, not 24 — and anyone changing one of the two
 * numbers needs to know about the other.
 */
import { cn } from '@/lib/utils'

export const STEP_CONTENT_GAP = 'mt-6'

export function WizardStepHeading({
  step,
  stepCount,
  heading,
  subtitle,
  headingRef,
  headingClassName,
}: {
  /** Zero-based index; rendered as `step + 1`. */
  step: number
  stepCount: number
  heading: string
  /**
   * Optional. Omitted by `AddAnnotationSummaryModal`, whose third line is the
   * SIPTEA question the coach is answering — that is the step's *content*, not
   * descriptive sub copy, so it keeps `ink` and its own generous leading
   * rather than being muted into a subtitle it isn't.
   */
  subtitle?: string
  /**
   * Optional focus target for the heading. `PlanSessionsModal` moves focus
   * here on every step change (Rounds 14.5/15) — without this the extraction
   * would have silently dropped that, which is this project's single
   * most-repeated defect class.
   */
  headingRef?: React.Ref<HTMLHeadingElement>
  /**
   * Optional type override for the heading itself. Additive: omitted, every
   * wizard renders the original `text-title`, so the other three are
   * byte-identical. `PlanSessionsModal` passes `text-display-md` (Round 38,
   * direct instruction) because its own modal chrome already carries a
   * `text-title` "Plan sessions" heading — measured, the two were identical
   * at 22px/500/`#1a1a1a`, so the step heading had no more weight than the
   * frame above it and did not read as the step's title.
   */
  headingClassName?: string
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      {/* `ink-faint`, not `ink-muted` (Round 38, direct instruction: "steps to
          light grey"). This reverses Round 28's move in the other direction —
          the counter is position metadata, not content, and at the same
          `#333333` as the subtitle it competed with copy the coach actually
          has to read. 5.28:1 on white, clear of AA. */}
      <p className="text-caption-medium text-ink-faint">
        Step {step + 1} of {stepCount}
      </p>
      <div className="flex flex-col gap-1">
        <h3
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className={cn('font-display text-ink outline-none', headingClassName ?? 'text-title')}
        >
          {heading}
        </h3>
        {subtitle && <p className="text-body text-ink-muted">{subtitle}</p>}
      </div>
    </div>
  )
}
