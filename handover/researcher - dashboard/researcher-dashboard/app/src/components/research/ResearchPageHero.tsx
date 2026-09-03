import { type ReactNode } from 'react'

/**
 * The one page hero, used by all five list-level research pages (Home, Trainee
 * Management, Consumer Management, Coach Management, My Profile).
 *
 * Use it rather than writing a title block. This treatment was copy-pasted
 * across those five pages once and visibly drifted; extracting it is what
 * makes a change to page-title type a one-line edit instead of five.
 *
 * ⚠️ This component renders only the *contents* of the hero. The band's
 * surface, padding and full-bleed layout belong to `ResearchShell` — callers
 * pass `heroClassName="bg-purple-50"` and usually `heroNoSeam`. Do not add a
 * background here.
 *
 * The record pages (trainee, consumer, coach) do **not** use this: their hero
 * is a purple band with a back link and a tab row, built inline.
 *
 * The title is spelled `purple-700` rather than `primary` even though the two
 * resolve to the same colour. Both spellings exist deliberately — this is a
 * heading, not a brand *action* — so keep the distinction if the tokens ever
 * diverge again.
 *
 * The sub copy is capped at `72ch` so a long line breaks at a readable measure
 * instead of running the full width of the content column.
 */
export function ResearchPageHero({
  title,
  subtitle,
  action,
  actionAlign = 'end',
}: {
  title: string
  subtitle: string
  /** Primary CTA for the page, e.g. "Add new coach trainee". */
  action?: ReactNode
  /**
   * Which edge the `action` lines up with.
   *
   * `end` (default) bottom-aligns it with the sub copy. `start` top-aligns it
   * with the title — used by Home's `Need help`, which belongs beside the
   * greeting rather than at the foot of a two-line sub copy.
   *
   * A prop, not a fork: `end` is the default precisely so the other four
   * heroes are unaffected. Prefer adding a prop like this over copying the
   * component.
   */
  actionAlign?: 'start' | 'end'
}) {
  return (
    <div
      className={`flex flex-wrap justify-between gap-4 ${
        actionAlign === 'start' ? 'items-start' : 'items-end'
      }`}
    >
      <div>
        <h1 className="font-display text-display-lg text-purple-700">{title}</h1>
        <p className="mt-2 max-w-[72ch] text-sub-greeting text-ink">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}
