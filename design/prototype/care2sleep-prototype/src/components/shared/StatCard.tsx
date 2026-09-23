import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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
/** One glyph per direction, so the trend is legible without colour. */
function TrendIcon({
  trend,
  ...rest
}: { trend: 'up' | 'down' | 'flat' } & React.ComponentProps<typeof Minus>) {
  const Glyph = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  return <Glyph {...rest} />
}

export function StatCard({
  label,
  value,
  valueLabel,
  icon: Icon,
  breakdown,
  breakdownLayout = 'inline',
  valueTone = 'default',
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
  breakdown?: {
    label: string
    value: number | string
    /**
     * Optional week-on-week direction, added for the Research Home "Study
     * overview" row. Renders a trend arrow before the value and tints the pair
     * green (`up`) / red (`down`) / neutral (`flat`).
     *
     * Additive and optional: every existing caller omits it and is byte
     * identical. Colour is deliberately **not** the only signal — each
     * direction gets its own lucide glyph too, so the distinction survives for
     * anyone who cannot separate red from green, per this project's standing
     * rule that a colour-only state change is not a state change.
     */
    trend?: 'up' | 'down' | 'flat'
    /**
     * What a screen reader hears in place of `value`, for the case where the
     * visible part is a glyph alone. The zero-delta tile renders just the
     * `Minus` arrow with an empty `value`; without this a screen reader would
     * reach "This week:" and then silence.
     */
    srValue?: string
  }[]
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
  /**
   * Semantic colour for the headline number only — never the tile fill.
   *
   * Consumer Management asks for "cannot-assign-coach" and "no sessions
   * planned" in red and "fully completed study" in green. Tinting the *number*
   * rather than the whole tile keeps the yellow KPI row reading as one family
   * and respects this project's "quiet, no rival accents" rule: the colour is
   * carrying a real state, and it sits on exactly the element that state is
   * about.
   *
   * `success` and `destructive` are the app's own semantic tokens, both
   * contrast-checked against `yellow-100` (4.59:1 and 4.77:1) when the trend
   * arrows were added to Research Home.
   */
  valueTone?: 'default' | 'destructive' | 'success'
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
              {/* Direct instruction: each label carries its own colon —
                  "Total: 5". Only on the label-first layout: on a tile with no
                  headline value the label trails its number ("4 PLE"), and a
                  colon there would punctuate the wrong end. */}
              {valueLabel && <dt className="truncate text-caption text-ink">{valueLabel}:</dt>}
              {/* Round 22 direct edit: KPI numbers capped at 32px app-wide
                  (`text-display-md`, this app's own 32px step) — was
                  `text-display-lg` (40px). Anything already ≤32px (the
                  `text-title` breakdown branch below) was left alone. */}
              <dd
                className={cn(
                  'font-display text-display-md font-medium',
                  valueTone === 'destructive' && 'text-destructive',
                  valueTone === 'success' && 'text-success',
                  valueTone === 'default' && 'text-ink',
                )}
              >
                {value}
              </dd>
            </div>
          )}
          {breakdown?.map((part) => (
            <div
              key={part.label}
              /* Direct instruction: the change sits on its own row, **left
                 aligned like every other part** — `w-full` is what forces the
                 wrap, since the parts row is `flex-wrap` and a full-width child
                 always starts a new line. No `justify-center`: the row is not
                 centred in the tile.

                 What *is* centred is the pair inside it. `items-center`
                 replaces the row's `items-baseline` for this part only, so the
                 small "This week:" label lines up with the middle of the large
                 value and its arrow instead of sitting on their baseline —
                 which, at a 15px label against a 24px value, dropped the label
                 visibly low. */
              className={cn(
                breakdownLayout === 'stacked'
                  ? 'flex min-w-0 flex-col gap-1'
                  : 'flex min-w-0 gap-2',
                breakdownLayout !== 'stacked' &&
                  (part.trend ? 'w-full items-center' : 'items-baseline'),
              )}
            >
              {/* `order-2` puts the title *after* its number visually while
                  leaving the `dt` before its `dd` in the DOM, which is what
                  `<dl>` requires for the pair to be associated.

                  Direct instruction: on a tile that has its own headline
                  `value`, **every part reads label-then-number** — "Total 5 /
                  Active 4 / This week +1" — so the breakdown matches the
                  `valueLabel` pair above it instead of reversing it halfway
                  down the tile. `order-2` is therefore dropped in that case
                  only. A tile with no headline value (Consumer Management's
                  "Consumer breakdown", the coach client record's tiles) has
                  nothing to agree with and keeps number-first, unchanged. */}
              <dt
                className={cn(
                  'truncate text-caption',
                  breakdownLayout === 'stacked'
                    ? 'text-ink-muted'
                    : cn('text-ink', value === undefined && 'order-2'),
                )}
              >
                {value === undefined ? part.label : `${part.label}:`}
              </dt>
              <dd
                /* Direct instruction: **every KPI number on the tile is the
                   same size — the change is the one exception.** So a
                   breakdown part renders at the headline's own
                   `display-md`/32px, and only a `trend` part drops to
                   `body-md`, which is what makes it read as an annotation on
                   the number rather than a second number competing with it.
                   (It also fixes a width problem: "No change" at 24px was four
                   times the width of "+1" and unbalanced the row.)

                   The `text-title` branch this replaces was reachable from
                   Research Home alone — the two other breakdown callers,
                   Consumer Management and the coach client record, both omit
                   `value` and already took the `display-md` path — so no other
                   surface moves. */
                className={cn(
                  'flex items-center gap-1',
                  part.trend
                    ? 'font-display text-title font-medium'
                    : 'font-display text-display-md font-medium',
                  part.trend === 'up' && 'text-success',
                  part.trend === 'down' && 'text-destructive',
                  part.trend === 'flat' && 'text-ink-muted',
                  !part.trend && 'text-ink',
                )}
              >
                {part.trend && (
                  <TrendIcon
                    aria-hidden="true"
                    className="size-5 shrink-0"
                    strokeWidth={2.5}
                    trend={part.trend}
                  />
                )}
                {part.srValue ? <span className="sr-only">{part.srValue}</span> : null}
                {part.value}
              </dd>
            </div>
          ))}
        </div>
      </dl>
    </div>
  )
}
