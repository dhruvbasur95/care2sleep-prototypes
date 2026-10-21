import { TriangleAlert } from 'lucide-react'

/**
 * Red banner across the top of the trainee/coach portal once they have opted
 * out of the study (direct instruction, 2026-10-21: *"if a coach has opted out,
 * add red banner up top"*, then *"add red banner to opt out screens under
 * trainee also"* — the opt-out card is the same for both stages, so is this).
 *
 * Same treatment as the Research Dashboard's `WithdrawnBanner` and the Consumer
 * Portal's opted-out banner: `destructive` fill, white 14/600, a warning glyph,
 * no dismiss — it reports a standing state, not a one-off notice. White on
 * `#d70015` measures 5.86:1.
 */
export function OptedOutBanner() {
  return (
    <div role="status" className="border-b border-black/10 bg-destructive px-6 py-3 md:px-8">
      <div className="mx-auto flex max-w-[1320px] items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-white" strokeWidth={2.25} />
        <p className="text-caption font-semibold text-white">
          You have opted out of the Care2Sleep study. Your supervisor has been notified and will be
          in touch with you shortly.
        </p>
      </div>
    </div>
  )
}
