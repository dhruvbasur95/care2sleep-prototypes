import type { LucideIcon } from 'lucide-react'

/**
 * The Figma frames' `stat-card` / `kpi-*` tile (Round 21) — Home's "Study
 * overview" row (frame `1:38`, node `1:341`) and Trainee Management's
 * "Trainees overview" row (frame `23:1453`, node `23:1710`) draw the identical
 * card, so it lives here rather than being defined twice.
 *
 * Transcribed from the frames: 120px tall, 16px padding, 12px radius
 * (`rounded-md`), Yellow Lighter 1 fill, **no border and no shadow**; a
 * label/icon row on top, then the value below it. The icon sits in its own 32px
 * flex-centred box at the row's right edge, in `purple-500`.
 *
 * Deliberately **not** the older shared `KpiTile`: that component bottom-anchors
 * its value and always reserves a subtext line beneath it — both load-bearing
 * for the shared-baseline alignment its own doc comment explains — which is a
 * different layout from this card's simple top-down stack. Forcing one to render
 * the other would have meant a flag that switches off the very behaviour that
 * makes `KpiTile` correct on the pages still using it. Consumer Management's
 * own KPI row moved onto this card too (Round 21), so `KpiTile` now survives
 * only on the Coach Profile insights strips; this is the tile for every
 * page-level KPI row.
 */
export function StatCard({
  label,
  value,
  valueLabel,
  icon: Icon,
  breakdown,
  breakdownLayout = 'inline',
}: {
  label: string
  /** Omit on a tile that is *only* a breakdown — Consumer Management's
   *  "Consumer breakdown" is PLE and Carer side by side with no total above
   *  them, since the tile's own label already says what is being counted. */
  value?: number | string
  /** Names the headline number when the tile also carries a `breakdown` —
   *  without it the big figure is the only unlabelled part in a row of
   *  labelled ones. Unused when `value` is omitted. */
  valueLabel?: string
  icon: LucideIcon
  /**
   * Optional split of the headline number into named parts, rendered as small
   * label-over-value pairs to its right — e.g. Consumer Management's
   * "Total consumers 4 · PLE 4 · Carer 4".
   *
   * A caption line *under* the value was built first and replaced: the value
   * is `mt-auto`-pushed to the bottom of a fixed 120px tile, so a caption
   * either overflowed the fill (measured at 124px, the text visibly spilling
   * below the yellow) or forced every other tile in the row to reserve an
   * invisible line just to keep the numbers on one baseline. Sitting the parts
   * beside the number costs no vertical space, so a tile with a breakdown and
   * one without stay the same height with their headline numbers aligned.
   */
  breakdown?: { label: string; value: number | string }[]
  /**
   * How the breakdown parts sit.
   *
   * `inline` (default) is the original: number first, label after, all parts on
   * one wrapping row. Correct when the parts are short numbers.
   *
   * `stacked` puts the label above its value in equal columns, per the coach
   * Home frame (`423:3619`). Needed there because that tile's values are words
   * ("Yes", "–") rather than digits, and three label+value pairs inline
   * overflowed the tile onto a second line — which is what read as unbalanced
   * against its two single-number neighbours. Opt-in rather than a change of
   * default, so Consumer Management's own breakdown tiles are untouched.
   */
  breakdownLayout?: 'inline' | 'stacked'
}) {
  return (
    /* Round 23, frame `93:188` (node `93:451`): `rounded-[12px]` (the frame's
       own radius; `--radius-md` is 11px and is left alone rather than nudged,
       since it is the app-wide capsule radius and this is the only element
       asking for 12), and `h-full min-h-[120px]` rather than a hard
       `h-[120px]` — the frame stretches every tile in the row to the tallest
       one (133px here, driven by the 3-column "Reviews shared" tile) instead
       of clipping them all to a fixed height. `min-h` keeps the old floor for
       rows where nothing is taller. */
    <div className="h-full min-h-[120px] rounded-[12px] bg-yellow-100 p-4">
      {/* `<dl>` term/definition, per the accessibility fix Round 20 made to
          `KpiTile` for this same label/number pairing — a screen reader landing
          on the number alone otherwise gets a bare digit with nothing tying it
          to its label. Each breakdown part is its own dt/dd pair inside the
          same list, so "PLE" reads as the term for its own count rather than
          as loose text near the total. */}
      <dl className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          {/* Round 23: `caption`, not `caption-medium` — the Figma KPI
              title style was changed back to regular. */}
          <dt className="text-caption text-ink">{label}</dt>
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center">
            <Icon className="size-[18px] text-purple-500" />
          </span>
        </div>
        {/* Titles and numbers are all `text-ink` — no grey anywhere on this
            tile, so each part reads as data in its own right rather than as a
            footnote to a headline.

            Each part is one baseline-aligned row — title *beside* its number,
            not stacked above it. Stacked was tried and measured wrong: the
            extra title line pushed the part's number 13px below where every
            other tile in the row sits its number, and there is no room inside
            the fixed 120px card to pad it back. Inline keeps this row exactly
            one 40px line tall, the same as a plain tile, so the numbers share
            a baseline across the whole row by construction. */}
        <div
          className={
            breakdownLayout === 'stacked'
              ? 'mt-auto grid grid-cols-3 gap-x-4 gap-y-1'
              : 'mt-auto flex flex-wrap items-baseline gap-x-10 gap-y-1'
          }
        >
          {value !== undefined && (
            <div className="flex min-w-0 items-baseline gap-2">
              {valueLabel && <dt className="truncate text-caption text-ink">{valueLabel}</dt>}
              {/* Round 22 direct edit: KPI numbers capped at 32px app-wide
                  (`text-display-md`, this app's own 32px step) — was
                  `text-display-lg` (40px). Anything already ≤32px (the
                  `text-title` breakdown branch below) was left alone. */}
              <dd className="font-display text-display-md font-medium text-ink">{value}</dd>
            </div>
          )}
          {breakdown?.map((part) => (
            <div
              key={part.label}
              className={
                breakdownLayout === 'stacked'
                  ? 'flex min-w-0 flex-col gap-1'
                  : 'flex min-w-0 items-baseline gap-2'
              }
            >
              {/* `order-2` puts the title *after* its number visually while
                  leaving the `dt` before its `dd` in the DOM, which is what
                  `<dl>` requires for the pair to be associated. */}
              <dt
                className={
                  breakdownLayout === 'stacked'
                    ? 'truncate text-caption text-ink-muted'
                    : 'order-2 truncate text-caption text-ink'
                }
              >
                {part.label}
              </dt>
              <dd
                className={
                  value !== undefined
                    ? 'font-display text-title text-ink'
                    : 'font-display text-display-md font-medium text-ink'
                }
              >
                {part.value}
              </dd>
            </div>
          ))}
        </div>
      </dl>
    </div>
  )
}
