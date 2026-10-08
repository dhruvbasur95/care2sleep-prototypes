import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

/**
 * KPI summary tile — a label above a large number, with a bare colored icon
 * top-right (no circular badge/background). Originally built for Trainee
 * Management's "Trainee insights" row (Round 20 follow-up) and extracted here
 * so Consumer Management's "Consumer insights" row (and any future KPI row)
 * can reuse it rather than duplicating it.
 *
 * The label stays top-anchored and the number (plus optional subtext) is
 * bottom-anchored within the tile, rather than sitting immediately below the
 * label: the card is `h-full` (filling the grid row's stretched height under
 * the grid's default `items-stretch`), its inner content is a flex column,
 * and the number `<dd>` carries `mt-auto` to push itself — and the subtext
 * `<dd>` below it — to the bottom of that column. Because every tile in a
 * grid row is stretched to the same height, this means every number lands on
 * the same baseline regardless of how many lines a neighboring tile's label
 * wraps to, without needing a fixed-height label slot. The label is
 * `text-ink`; the number is `text-display-lg` for visual dominance. Each call
 * site passes its own `icon`/`iconColor` — the icon renders bare, in its
 * semantic color, with no background wrapper.
 *
 * `subtext` is an optional small muted caption rendered below the number —
 * e.g. a PLE/Carer breakdown under "Total consumers" — for tiles that need
 * one more line of context. It always renders as exactly one line (`truncate`,
 * even when omitted a same-height invisible placeholder takes its place) so
 * every tile in a row reserves identical space below the number: a longer
 * caption that wrapped to 2+ lines would grow past that reserved space and
 * push its own tile's number off the shared baseline relative to a neighbor
 * with no subtext (or a shorter one) — confirmed live and fixed by clamping
 * to one line rather than trying to predict/replicate another tile's wrap.
 */
export function KpiTile({
  label,
  value,
  icon: Icon,
  iconColor,
  subtext,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  iconColor: string
  subtext?: string
}) {
  // Round 20 accessibility review: the label and the number were two
  // unrelated `<p>`s, so nothing programmatically tied the label to
  // "1" — fine in linear reading order, but a screen-reader user landing on
  // the number alone (table/heading/element navigation) got a bare digit.
  // A `<dl>` term/definition pair is the smallest change that makes the
  // association real, and it renders identically. The lucide icon is purely
  // decorative (it repeats the label) and now carries the explicit
  // `aria-hidden` this codebase applies to every other decorative icon.
  return (
    <Card className="h-full gap-0 rounded-lg py-0">
      <div className="relative flex h-full flex-col p-5">
        {/* Absolutely positioned rather than a flex sibling of the label, so
            the `<dl>` below stays a valid, uninterrupted dt/dd pair and the
            number/subtext keep the tile's full width. `pr-7` on the term
            reserves exactly the width the old flex row's icon + gap took
            (20px + 8px), so nothing moves. */}
        <Icon aria-hidden="true" className={`absolute top-5 right-5 size-5 shrink-0 ${iconColor}`} />
        <dl className="flex flex-1 flex-col">
          <dt className="pr-7 text-caption text-ink">{label}</dt>
          {/* Round 22 direct edit: KPI numbers capped at 32px app-wide
              (`text-display-md`) — was `text-display-lg` (40px). */}
          <dd className="mt-auto font-display text-display-md leading-none">{value}</dd>
          {/* Always reserve this line's height, even when a tile has no
              subtext: `mt-auto` on the value above pushes the value+subtext
              pair down as one block, so a tile with a real subtext line
              lands its *value* higher than a subtext-less neighbor whose
              value sits flush with the tile's bottom padding. Rendering an
              invisible placeholder of the same height on every tile keeps
              that reserved space constant across the row — but only if the
              real subtext is guaranteed to be exactly that same one-line
              height too, hence `truncate` below: an un-clamped subtext that
              wraps to 2+ lines would reserve *more* than the placeholder,
              breaking the very alignment this is meant to guarantee. */}
          {subtext ? (
            <dd className="mt-1 truncate text-caption text-ink-faint" title={subtext}>
              {subtext}
            </dd>
          ) : (
            <dd className="mt-1 truncate text-caption text-ink-faint invisible" aria-hidden="true">
              &nbsp;
            </dd>
          )}
        </dl>
      </div>
    </Card>
  )
}
