import { cn } from '@/lib/utils'

/**
 * SegmentedProgressBar
 * =====================
 * A horizontal "stories-style" progress bar made of independently-sized,
 * independently-filled segments — like Instagram Stories, or a course
 * player's per-chapter progress. Each segment stands for one unit of work
 * (a chapter, a stage, a step) and can be weighted wider or narrower than
 * its neighbours to reflect how much content it actually holds, so a
 * 10-step chapter reads as visually "longer" than a 1-step intro.
 *
 * Use this when you need to show BOTH (a) position within a whole
 * multi-part sequence and (b) fractional progress through the current
 * part, in one glance — instead of two separate indicators (e.g. a
 * flat "Step 4 of 12" bar stacked above a set of per-item dots).
 *
 * ## Extraction notes (for reuse outside this app)
 * - **Zero domain coupling.** This file has no idea what a "module" or
 *   "chapter" is — it only knows about an ordered list of `segments`.
 *   Copy this one file into another project and it works as-is.
 * - **One external dependency:** `cn` from `@/lib/utils` (a
 *   `clsx` + `tailwind-merge` wrapper). Any equivalent classname-merge
 *   helper works — swap the import and nothing else changes.
 * - **Exactly 3 Tailwind classes carry the visual language:**
 *   `bg-success` (a completed segment), `bg-primary` (the current
 *   segment's fill), `bg-divider-soft` (the empty track, and — by staying
 *   unfilled — a locked/upcoming segment). Repoint those three classes to
 *   your own design tokens and everything else holds.
 * - **Purely presentational.** No internal state, no timers, no data
 *   fetching. The caller owns which segment is `'current'` and how full
 *   it is; this component only ever renders what it's handed, which is
 *   what makes it trivial to unit-test and to drop into a different app.
 *
 * ## Accessibility
 * Individual segments are decorative (`aria-hidden`) since a sighted user
 * reads position + fill visually in one shape. The bar as a whole exposes
 * one accessible name via `aria-label` (e.g. `"Chapter 2 of 3, 40%
 * complete"`) — supply a summary string that makes sense read on its own,
 * or omit it and describe the bar from a surrounding `aria-live` region
 * instead (matching the calling pattern used elsewhere in this app: a
 * silent visual bar plus a sibling `sr-only` live region that only speaks
 * up when the position actually changes).
 *
 * @example
 * ```tsx
 * <SegmentedProgressBar
 *   aria-label="Chapter 2 of 3, 40% complete"
 *   segments={[
 *     { state: 'completed', weight: 8 },
 *     { state: 'current', progressPercent: 40, weight: 8 },
 *     { state: 'locked', weight: 8 },
 *   ]}
 * />
 * ```
 */

/** A segment's position relative to wherever the caller's "current" marker
 *  is: already passed (`completed`), the one you're on now (`current`), or
 *  not yet reached (`locked`). */
export type SegmentedProgressBarState = 'completed' | 'current' | 'locked'

export interface SegmentedProgressBarSegment {
  state: SegmentedProgressBarState
  /**
   * 0–100. Only meaningful when `state` is `'current'` — a `'completed'`
   * segment always renders full, a `'locked'` one always renders empty.
   * Omit it on a `'current'` single-step segment (one with no internal
   * sub-progress of its own) and it defaults to 100, i.e. "fully lit, this
   * is where you are" rather than "just starting."
   */
  progressPercent?: number
  /**
   * Relative width versus sibling segments — a flex-grow weight, not a
   * pixel or percentage value. A segment covering 8 underlying steps and a
   * neighbour covering 1 should pass `weight: 8` and `weight: 1`
   * respectively so the bar's proportions match the real amount of content
   * each segment represents. Defaults to `1` (equal-width segments).
   */
  weight?: number
}

export interface SegmentedProgressBarProps {
  segments: SegmentedProgressBarSegment[]
  className?: string
  /** Accessible name for the whole bar. See "Accessibility" above. */
  'aria-label'?: string
}

export function SegmentedProgressBar({
  segments,
  className,
  'aria-label': ariaLabel,
}: SegmentedProgressBarProps) {
  return (
    <div role="img" aria-label={ariaLabel} className={cn('flex items-center gap-1', className)}>
      {segments.map((segment, i) => {
        const fillPercent =
          segment.state === 'completed'
            ? 100
            : segment.state === 'locked'
              ? 0
              : Math.max(0, Math.min(100, segment.progressPercent ?? 100))

        return (
          <div
            key={i}
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-divider-soft"
            style={{ flex: `${segment.weight ?? 1} 1 0%` }}
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-300 ease-out',
                segment.state === 'completed' && 'bg-success',
                segment.state === 'current' && 'bg-primary',
              )}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}
