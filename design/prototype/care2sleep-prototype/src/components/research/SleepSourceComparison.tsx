import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'

/**
 * "Actigraphy vs sleep diary" — the perceived-vs-actual sleep comparison.
 *
 * ## Why it exists
 * Direct instruction. A sleep diary is **subjective** and actigraphy is
 * **objective**, and the clinically interesting thing is the gap between them:
 * a consumer may report falling asleep at 1am when the device has them asleep
 * at 10:30pm. Putting the two side by side is what lets a researcher or
 * clinician see that gap rather than infer it.
 *
 * ## The data is STATIC AND FABRICATED — deliberately
 * Direct instruction: *"just make up any random data, do not link with
 * consumers, all consumers can show same graph."* So this component takes no
 * props, reads no store, and renders the same figures on every consumer's
 * record. That is a demonstration of the comparison, not a reading of anybody.
 * The banner above the chart says so on screen, so nobody mistakes it for a
 * real record — a fabricated clinical chart that does not announce itself is
 * the one thing this project must not ship.
 *
 * ⚠️ **To make it real:** every figure here has a source. Actigraphy comes from
 * the Fitbit Sleep API (`minutesAsleep`, `timeInBed`, `minutesToFallAsleep`,
 * `minutesAwake`); the diary column comes from the Consensus Sleep Diary
 * answers `SleepDiaryFeed` already collects (bedtime, lights-out, latency,
 * night wakings, final wake). Swap `COMPARISON` for a per-dyad derivation and
 * the rest of this file stands.
 *
 * ## Why the numbers are what they are
 * They are internally consistent, and that is load-bearing rather than
 * decorative: **time in bed is identical for both sources (569 min)** — the
 * window is the same however you measure it — and each source's four segments
 * sum to exactly that. So the two stacked bars are the same height, and the
 * comparison the chart is *for* becomes legible: the bars differ only in how
 * that fixed window is divided between sleep and wake. If the totals drifted,
 * the taller bar would read as "more sleep" when it means nothing of the kind.
 */

/** The one fixed window both sources measure, in minutes. */
const TIME_IN_BED = 569

interface Segment {
  key: 'sleep' | 'latency' | 'waso' | 'ema'
  label: string
  /** Token-driven; no raw chart palette. See the note on `fill`. */
  fill: string
}

/**
 * Four series, four existing tokens.
 *
 * The reference uses blue / orange / green / red. This project has no chart
 * palette and CLAUDE.md maps any blue onto the purple ramp, so the series take
 * the nearest existing semantic tokens and keep the reference's *reading*:
 * sleep is the brand colour, latency is the yellow ramp, wake-after-onset is
 * green, and the early-morning wake — the one a clinician is scanning for — is
 * the red. Nothing new is minted.
 *
 * Colour is never the only cue: every segment is named in the legend and every
 * figure is repeated as text in the breakdown table below, which is also what
 * makes the chart's content available to a screen reader.
 */
const SEGMENTS: Segment[] = [
  { key: 'sleep', label: 'Actual sleep', fill: 'var(--primary)' },
  { key: 'latency', label: 'Sleep latency', fill: 'var(--color-yellow-300)' },
  { key: 'waso', label: 'WASO', fill: 'var(--color-success)' },
  { key: 'ema', label: 'Early morning awakening', fill: 'var(--color-destructive)' },
]

/** Both sources, each summing to `TIME_IN_BED`. */
const COMPARISON = [
  { source: 'Actigraphy', sleep: 410, latency: 25, waso: 110, ema: 24 },
  { source: 'Sleep diary', sleep: 519, latency: 15, waso: 30, ema: 5 },
] as const

/** Efficiency is derived from the two figures beside it rather than written,
 *  so the percentage and the bar can never disagree. One decimal, because the
 *  difference between 72.1% and 91.2% is the whole point and rounding to whole
 *  percentages would still show it but reads as less precise than the source. */
const efficiency = (sleep: number) => `${((sleep / TIME_IN_BED) * 100).toFixed(1)}%`

const ROWS: { metric: string; actigraphy: string; diary: string; note: string }[] = [
  {
    metric: 'Total time in bed (TIB)',
    actigraphy: `${TIME_IN_BED} min`,
    diary: `${TIME_IN_BED} min`,
    note: 'Time between getting into bed and getting out of bed',
  },
  {
    metric: 'Actual sleep time (TST)',
    actigraphy: `${COMPARISON[0].sleep} min`,
    diary: `${COMPARISON[1].sleep} min`,
    note: 'TIB less latency, WASO and early morning awakening',
  },
  {
    metric: 'Sleep efficiency',
    actigraphy: efficiency(COMPARISON[0].sleep),
    diary: efficiency(COMPARISON[1].sleep),
    note: '(TST / TIB) × 100',
  },
  {
    metric: 'Sleep latency',
    actigraphy: `${COMPARISON[0].latency} min`,
    diary: `${COMPARISON[1].latency} min`,
    note: 'Time taken to fall asleep',
  },
  {
    metric: 'WASO',
    actigraphy: `${COMPARISON[0].waso} min`,
    diary: `${COMPARISON[1].waso} min`,
    note: 'Total wake time between falling asleep and final waking',
  },
  {
    metric: 'Early morning awakening',
    actigraphy: `${COMPARISON[0].ema} min`,
    diary: `${COMPARISON[1].ema} min`,
    note: 'Wake time before finally getting out of bed',
  },
]

export function SleepSourceComparison() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-title text-ink">Perceived sleep vs measured sleep</h2>
        <p className="text-body text-ink">
          The sleep diary records what the consumer experienced; actigraphy records what the
          device measured. The gap between them is what this compares.
        </p>
      </div>

      <Card className="gap-0 rounded-lg py-0">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-purple-50 p-6">
          <div className="min-w-0">
            <h3 className="text-body-md text-ink">Sleep data source comparison</h3>
            <p className="mt-1 text-caption text-ink-muted">
              One standard week, both sources measured over the same time in bed
            </p>
          </div>
          {/* Says what it is on screen, not only in a code comment. A
              clinical-looking chart that is actually a worked example has to
              admit it where the reader is. */}
          <span className="inline-flex shrink-0 items-center rounded-full bg-yellow-100 px-3 py-1 text-fine text-ink">
            Example data
          </span>
        </div>

        <div className="flex flex-col gap-6 border-t border-hairline p-6 lg:flex-row lg:items-center">
          {/* `min-w-0` on the chart column: a `ResponsiveContainer` reports the
              width it is given, and an `auto`-minimum flex child sizes to its
              content — together they hold the container open at its last width
              and the row never shrinks back down. */}
          <div className="min-w-0 flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={COMPARISON as unknown as Record<string, number | string>[]} barSize={120}>
                <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
                <XAxis
                  dataKey="source"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-hairline)' }}
                  tick={{ fill: 'var(--color-ink-muted)', fontSize: 13 }}
                />
                <YAxis
                  /* Explicit domain and ticks. Recharts' auto-domain produced
                     0 / 150 / 300 / 450 / 800 for a 569 max — an uneven top
                     step that makes the bars look shorter than they are
                     against the gridlines. 600 is the next round number above
                     the fixed time in bed, so both bars fill the plot
                     honestly. */
                  domain={[0, 600]}
                  ticks={[0, 150, 300, 450, 600]}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
                  label={{
                    value: 'Minutes',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'var(--color-ink-muted)', fontSize: 12 },
                  }}
                />
                {/* Stacked in study order — sleep at the base, then the three
                    kinds of wake time above it, so the blue block's height is
                    read directly against the axis. */}
                {SEGMENTS.map((seg) => (
                  <Bar key={seg.key} dataKey={seg.key} stackId="tib" fill={seg.fill} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* A real list, not a chart-library legend: this one keeps its order
              and its contrast, and it reads to a screen reader as the key it
              is. */}
          <dl className="flex shrink-0 flex-col gap-3 lg:w-[220px]">
            {SEGMENTS.map((seg) => (
              <div key={seg.key} className="flex items-center gap-3">
                {/* A hairline edge on every swatch. `yellow-300` measures
                    **1.5:1** against white — far under WCAG 1.4.11's 3:1 — so
                    the pale dot had no discernible boundary at all. The ring
                    gives it one without recolouring a token that is correct
                    everywhere else. (Inside the chart the same yellow is fine:
                    it is read against the segments above and below it, not
                    against the page.) */}
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-full ring-1 ring-ink/20"
                  style={{ background: seg.fill }}
                />
                <dt className="min-w-0 flex-1 text-caption text-ink">{seg.label}</dt>
                <dd className="shrink-0 text-caption tabular-nums text-ink-muted">
                  {COMPARISON[0][seg.key]} / {COMPARISON[1][seg.key]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <h3 className="text-body-md text-ink">Detailed metric breakdown</h3>
        <Card className="gap-0 rounded-lg py-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-purple-50">
                  <th scope="col" className="px-6 py-4 text-caption-medium text-ink">
                    Metric
                  </th>
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Actigraphy
                  </th>
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Sleep diary
                  </th>
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    How it is measured
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={r.metric} className={i > 0 ? 'border-t border-parchment' : undefined}>
                    <th scope="row" className="px-6 py-3 text-left text-caption font-normal text-ink">
                      {r.metric}
                    </th>
                    <td className="px-4 py-3 text-caption tabular-nums whitespace-nowrap text-ink-muted">
                      {r.actigraphy}
                    </td>
                    <td className="px-4 py-3 text-caption tabular-nums whitespace-nowrap text-ink-muted">
                      {r.diary}
                    </td>
                    <td className="px-4 py-3 text-caption text-ink-muted">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  )
}
