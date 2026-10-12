import { Link } from 'react-router-dom'
import { MessageCircleQuestionMark } from 'lucide-react'
import { InertButton } from '@/components/shared/MeetingsSection'

/**
 * "Need help" — **the** help control, every portal.
 *
 * The Consumer Portal defined it first (Round 49, direct instruction: "introduce
 * a Need Help button on right, that opens help page. Simple outline style in red
 * semantic"), the coach portal copied the class string into its own local
 * `NeedHelpButton` in Round 40, and on 2026-10-12 the Research Dashboard was
 * told to use it too — at which point three hand-written copies of one pill was
 * the drift this file exists to end. Change the control here, not per portal.
 *
 * Geometry is the consumer outline pill: 48px, 24px radius, 20px side padding,
 * `body-md` label, `MessageCircleQuestionMark` at `size-6` / 1.75 stroke.
 * Outline rather than filled for the reason the control exists: a solid red
 * block at this size reads as an error state, where this is an offer of help.
 *
 * Contrast, rasterised from painted pixels 2026-10-12: the `destructive` label
 * and stroke measure **5.38:1** on the white fill, and **4.92:1** once the
 * `destructive/5` hover tint lands — both clear AA. (The 4.80:1 that the three
 * old copies all quoted was never reproducible; it is corrected here rather
 * than carried forward.) The hover tint composites to `rgb(253,242,243)`, a
 * 2/13/12 per-channel shift — a real pink, not the invisible ~9-flat shift
 * `primary/5` gives, which is the trap this project documents.
 *
 * **Nothing leaks either way.** `destructive` and `text-body-md` are app-wide
 * tokens the Consumer Portal happens to share — not consumer-scale steps — so
 * this is not the Consumer Portal's type scale reaching a researcher surface.
 * The 48px height is a deliberate exception to the 40px app button height: it
 * is the same physical control in all three portals, and splitting it by
 * surface is what let the three copies drift in the first place.
 *
 * Pass `to` where a help destination exists (Consumer Portal only, today).
 * Without it the control renders this app's documented unwired treatment —
 * focusable, `aria-disabled`, with an `sr-only` "(coming soon)" cue — never a
 * silently dead button and never omitted. Give the coach or researcher a help
 * page and the only change is passing `to`.
 */
const NEED_HELP_PILL =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-3xl border border-destructive bg-white px-5 text-body-md text-destructive outline-none transition-all hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 active:scale-[0.97]'

export function NeedHelpButton({ to }: { to?: string }) {
  if (to)
    return (
      <Link to={to} className={NEED_HELP_PILL}>
        <MessageCircleQuestionMark aria-hidden="true" className="size-6" strokeWidth={1.75} />
        Need help
      </Link>
    )

  return (
    <InertButton label="Need help" appearance="active" className={NEED_HELP_PILL}>
      <MessageCircleQuestionMark aria-hidden="true" className="size-6" strokeWidth={1.75} />
    </InertButton>
  )
}
