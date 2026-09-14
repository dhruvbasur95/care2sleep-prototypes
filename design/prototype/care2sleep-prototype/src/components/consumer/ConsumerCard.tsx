import type { LucideIcon } from 'lucide-react'

/**
 * The Consumer Portal's card chrome and its 52px icon slot.
 *
 * Extracted from `ConsumerHomePage` at their second caller (Round 48's session
 * plan strip, frame `930:5195`), which lives in `components/consumer/` and so
 * cannot reach into the page for them — importing a page from a component would
 * also close a real cycle, since the page renders the strip.
 *
 * Both values already matched frame `930:5195` exactly before this move, which
 * is the reason it is a move and not a new treatment: white fill, a 1px
 * `hairline` (#e0e0e0) stroke, 16px radius, the app's warm `shadow-card`, and
 * 32px side / 32px top / 40px bottom padding at `sm` and up.
 */
export const CARD_HAIRLINE = 'overflow-hidden rounded-lg border border-hairline shadow-card'

export const CARD_PAD = 'px-4 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-10'

/**
 * The 52px icon slot the frames put at the top of a card (direct instruction:
 * "I have also added icon provision for sleep diary, and session card. add icon
 * use blue color as used for buttons", and for the plan strip: "add an
 * appropriate icon in grey placeholder box").
 *
 * Every frame draws it as a bare `#d9d9d9` square — a placeholder for an icon,
 * not a treatment — so the square itself is deliberately not reproduced. What
 * ships is a lucide glyph in `consumer-primary`, which is the "blue" the
 * instruction means: it is the fill on every CTA on this page. Glyphs match how
 * this app already uses them: `NotebookPen` is the reflection/notes mark,
 * `Video` is the mark on every Zoom session row in all four portals, and
 * `CalendarDays` is the schedule mark.
 */
export function CardIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-[52px] shrink-0 items-center justify-center text-consumer-primary"
    >
      <Icon className="size-10" strokeWidth={1.75} />
    </span>
  )
}
