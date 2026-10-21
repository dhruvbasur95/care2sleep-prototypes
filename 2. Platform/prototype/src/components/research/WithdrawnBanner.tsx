import { TriangleAlert } from 'lucide-react'
import type { Coach } from '@/data/research'
import { formatDate } from '@/data/format'

/**
 * Withdrawn banner — shown on every tab of a withdrawn trainee's record,
 * and of a withdrawn SPACES coach's record (direct instruction, 2026-10-21:
 * *"there should be a banner up top as we have done elsewhere"*). Moved here
 * from `CoachProfilePage` at its second caller, unchanged.
 *
 * Originally for the trainee record
 * (direct instruction, 2026-09-21: *"show a withdrawn banner uptop as shown
 * for consumers"*).
 *
 * Deliberately the Consumer Portal's own `OptedOutBanner` treatment — red
 * `destructive` fill, white text, a warning glyph, no dismiss — rather than
 * the amber `PendingInviteBanner` in `CoachProfilePage`. The two states are not the same
 * kind of thing: a pending invite is a waiting state that resolves itself,
 * a withdrawal is terminal. Amber for one and red for the other is the
 * distinction this app already draws everywhere else.
 *
 * Not dismissible, for the same reason the consumer one is not: it reports a
 * standing account state, not a one-time notice, and a researcher who
 * dismissed it would read the rest of the record as though the trainee were
 * still active.
 *
 * White on `--destructive` measures 5.86:1 (rasterised, not calculated —
 * Tailwind v4 emits `oklab()`).
 */
export function WithdrawnBanner({ coach }: { coach: Coach }) {
  return (
    <div role="status" className="border-b border-black/10 bg-destructive px-6 py-3 md:px-8">
      <div className="mx-auto flex max-w-[1320px] items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-white" strokeWidth={2.25} />
        <p className="text-caption font-semibold text-white">
          {coach.fullName} has withdrawn from the study
          {coach.withdrawnOn ? ` on ${formatDate(coach.withdrawnOn)}` : ''}. They no longer have
          access to the platform.
          {/* "Their records are kept per their consent." removed on direct
              instruction, 2026-10-21. */}
        </p>
      </div>
    </div>
  )
}
