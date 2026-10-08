import type { LucideIcon } from 'lucide-react'

/**
 * The yellow KPI tile. Every page-level "overview" stat row in the dashboard
 * is a grid of these — Home's Study overview, and the KPI rows on Trainee
 * Management, Consumer Management, Coach Management, and all three record
 * pages (28 instances across 6 files).
 *
 * Shape: yellow fill, 12px radius, no border and no shadow; a label + icon row
 * on top, the number pushed to the bottom.
 *
 * ⚠️ THE ONE RULE THAT MATTERS: every tile in a row must keep its number on
 * the same baseline as its neighbours. That is what the layout below is built
 * around, and it is why `breakdown` renders its parts *beside* the number
 * rather than stacked under it. Anything that adds a line of vertical content
 * to one tile — a caption, a second row, a stacked sub-label — either
 * overflows the 120px fill or forces every other tile in the row to reserve an
 * invisible matching line. Both were tried; both looked broken.
 *
 * Semantics: the whole tile is a `<dl>`, with each label/number pair a real
 * `dt`/`dd`. Without that a screen reader landing on the number gets a bare
 * digit with nothing tying it to what it counts. Keep the pairing if you
 * restructure the layout.
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
   *  "Consumer breakdown" shows PLE and Carer side by side with no total above
   *  them, because the tile's own `label` already says what is counted. */
  value?: number | string
  /** Names the headline number when the tile also carries a `breakdown`.
   *  Without it the big figure is the only unlabelled part in a row of
   *  labelled ones. Ignored when `value` is omitted. No current caller. */
  valueLabel?: string
  icon: LucideIcon
  /**
   * Splits the headline number into named parts shown to its right, e.g.
   * "Total consumers 4 · PLE 4 · Carer 4".
   *
   * Beside the number, not under it — see the baseline rule in the file
   * header. Only `ConsumerManagementPage` uses this.
   */
  breakdown?: { label: string; value: number | string }[]
  /**
   * How the breakdown parts sit.
   *
   * `inline` (default): number first, label after, parts on one wrapping row.
   * Right when the parts are short numbers.
   *
   * `stacked`: label above value in equal columns. For parts whose values are
   * *words* rather than digits, which overflow onto a second line inline and
   * then read as unbalanced against single-number neighbours. No current
   * caller; opt-in so existing tiles are unaffected.
   */
  breakdownLayout?: 'inline' | 'stacked'
}) {
  return (
    /* `h-full min-h-[120px]`, deliberately not a hard `h-[120px]`: a tile
       stretches to the tallest in its row rather than clipping its own
       content. `min-h` keeps the 120px floor when nothing is taller. The
       literal `rounded-[12px]` is intentional — `--radius-md` is 11px and is
       the app-wide capsule radius, not worth nudging for this one element. */
    <div className="h-full min-h-[120px] rounded-[12px] bg-yellow-100 p-4">
      {/* Each breakdown part is its own dt/dd pair inside this same list, so
          "PLE" reads as the term for its own count rather than as loose text
          near the total. */}
      <dl className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <dt className="text-caption text-ink">{label}</dt>
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center">
            <Icon className="size-[18px] text-purple-500" />
          </span>
        </div>
        {/* `mt-auto` pins this row to the bottom of the tile — that, plus the
            row staying exactly one line tall under the default `inline`
            layout, is what puts every number in a KPI row on one baseline
            without any tile knowing about its neighbours.

            Labels and numbers are all `text-ink`, no grey: each part is data
            in its own right, not a footnote to the headline. */}
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
              {/* 32px is the app-wide cap for a KPI number. Going larger
                  reintroduces the overflow this tile's fixed height cannot
                  absorb. */}
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
              {/* `order-2` shows the label *after* its number visually while
                  leaving `dt` before `dd` in the DOM. Do not reorder the
                  markup to match the visual order — `<dl>` associates a pair
                  by document order, and swapping them breaks the pairing for
                  assistive tech while looking identical on screen. */}
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
