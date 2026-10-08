import { type ReactNode } from 'react'

/**
 * The one Research Dashboard page hero (Round 21).
 *
 * Extracted after the hero's type treatment was changed four separate times in
 * one session — purple band, then `display-xl`, then weight 500, then one step
 * smaller again. With the markup copy-pasted across five pages, each of those
 * changes needed five edits and drifted between them. Now it's one component,
 * so the next size change is one line.
 *
 * Treatment, derived from the supplied Figma frames (`1:38` Home, `23:1453`
 * Trainee Management) and then adjusted on direct feedback:
 * - Title: `display-lg` (40px / weight 500) in `primary`, `-1px` tracking.
 *   The frames draw 56px; stepped down one scale rung on direct instruction
 *   ("all page titles you can go one font size smaller"), applied across every
 *   research page rather than page-by-page.
 *
 *   Round 28 moved this `purple-500` -> `purple-700`. **2026-09-21 moves it
 *   again, to `primary` (#3a00ad)** — direct instruction to take the deep
 *   purple off the researcher surfaces and use the same blue the Consumer
 *   Portal and the trainee dashboard already paint. Spelled `primary`, not a
 *   ramp step, because it is the brand accent rather than a tint.
 *
 * The band's own surface/padding lives on `ResearchShell` (`heroClassName`
 * `bg-purple-50` + `heroNoSeam`), not here — the shell owns full-bleed layout.
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
   * `end` (default) bottom-aligns it with the sub copy — where the Trainee
   * Management frame (`23:1453`) puts its primary CTA, and what every page
   * with an action used before this prop existed.
   *
   * `start` top-aligns it with the title instead. Home's `Need help` needs
   * this: in frame `1:38` the button (`329:3751`) and the title block
   * (`329:3750`) both sit at y=64, so it is aligned to the title's top edge,
   * not to the bottom of a two-line sub copy 40px further down.
   *
   * A prop rather than a fork, per the standing rule — and defaulting to
   * `end` leaves the other four research heroes byte-identical.
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
        <h1 className="font-display text-display-lg text-primary">{title}</h1>
        <p className="mt-2 max-w-[72ch] text-sub-greeting text-ink">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}
