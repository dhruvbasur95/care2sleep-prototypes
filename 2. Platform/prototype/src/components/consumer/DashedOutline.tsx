import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * A dashed outline with Figma's own dash pattern.
 *
 * CSS `border-style: dashed` cannot be told a dash length — the browser picks
 * its own (Chrome draws ~3x the border width with equal gaps) — so it never
 * matches a frame that specifies one (reported 2026-11-12: "the dotted outline
 * also does not match figma"; the goals panel is `[8, 6]`, the future-session
 * pill `[6, 4]`). This draws the outline as one SVG `rect` instead.
 *
 * Figma's strokes here are **inside, 2px**: the rect sits on the box edge with
 * a 4px stroke, **clipped to its own rounded shape**, which leaves exactly 2px
 * inside the edge everywhere. ⚠️ Clipping to the SVG's square box instead (the
 * first version) left the outer half visible at every rounded corner — the
 * corners drew 4px thick and read as clipped (reported 2026-11-12).
 *
 * It takes no layout space, so the parent's padding is measured from its edge,
 * as Figma's is. The parent must be `relative`; colour is `currentColor`.
 */
export function DashedOutline({
  radius,
  dash,
  className,
}: {
  radius: number
  /** Figma `dashPattern`, e.g. `[8, 6]`. */
  dash: [number, number]
  className?: string
}) {
  // `useId` can contain characters a `url(#…)` reference does not accept.
  const clipId = `dashed-outline-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="100%" height="100%" rx={radius} />
        </clipPath>
      </defs>
      <rect
        width="100%"
        height="100%"
        rx={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeDasharray={dash.join(' ')}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  )
}
