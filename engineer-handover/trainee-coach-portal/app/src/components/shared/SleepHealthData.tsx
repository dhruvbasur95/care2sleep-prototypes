/**
 * Fitbit sleep data + Consensus Sleep Diary, for one dyad.
 *
 * Extracted verbatim from the Research Dashboard's `ConsumerDetailPage.tsx`
 * for the coach-portal handover package: `FitbitSyncMonitor`,
 * `FitbitAveragesTable` and `SleepDiaryFeed` are all rendered by the Coach
 * Delivery Portal's per-client detail page, and the researcher page they used
 * to live in is not part of this package. Their private helpers
 * (`Trend`, `FitbitLogTable`, `ComparativeFitbitTable`, the date-range
 * filters, the diary question list and its per-cell value/average readers)
 * came with them unchanged.
 *
 * The `viewerRole` and Consumer-Portal override props are preserved in full —
 * they encode real audience differences (see the comments on each), not dead
 * configuration.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Minus,
  NotebookPen,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/shared/StatusChip'
import { EmptyState } from '@/components/shared/EmptyState'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { dyadTitle } from '@/components/shared/dyadHealth'
import { cn } from '@/lib/utils'
import { downloadCsv } from '@/lib/csv'
import { formatDate, formatSleepDuration } from '@/data/format'
import {
  computeSleepDiary,
  parseTimeToMinutes,
  type ConsumerDyad,
  type HealthLogEntry,
  type SleepDiaryAnswers,
} from '@/data/spaces'

function SelectChevron() {
  return (
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
    />
  )
}

function Trend({ current, previous }: { current?: number; previous?: number }) {
  if (current === undefined || previous === undefined) return null
  if (current === previous) {
    return (
      <>
        <Minus aria-hidden="true" className="inline size-3 text-ink-faint" />
        <span className="sr-only">, no change from previous day</span>
      </>
    )
  }
  return current > previous ? (
    <>
      <ChevronUp aria-hidden="true" className="inline size-3 text-ink-faint" />
      <span className="sr-only">, higher than previous day</span>
    </>
  ) : (
    <>
      <ChevronDown aria-hidden="true" className="inline size-3 text-ink-faint" />
      <span className="sr-only">, lower than previous day</span>
    </>
  )
}

export function FitbitLogTable({
  log,
  emptyMessage = 'No Fitbit data synced yet for this consumer.',
}: {
  log: HealthLogEntry[]
  /** Consumer Portal overrides this — the default third-person phrasing is
   *  written for a researcher reading about someone else's record. */
  emptyMessage?: string
}) {
  if (log.length === 0) {
    return <p className="p-6 text-caption text-ink-faint">{emptyMessage}</p>
  }
  return (
    <table className="w-full min-w-[760px] border-collapse text-left">
      <thead>
        {/* `purple-50`, no bottom rule — the treatment `SleepDiaryFeed`'s table
            (the other table on this same tab) already carries. */}
        <tr className="bg-purple-50">
          <th scope="col" className="px-6 py-4 text-caption-medium text-ink">Date</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Sync status</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">REM %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Deep %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Light %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Duration</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Disturbances</th>
        </tr>
      </thead>
      <tbody>
        {log.map((entry, i) => {
          const prev = log[i - 1]
          return (
            <tr key={entry.date} className={cn(i > 0 && 'border-t border-parchment')}>
              <td className="px-6 py-3 text-caption whitespace-nowrap text-ink">{formatDate(entry.date)}</td>
              <td className="px-4 py-3">
                {/* Shared `Chip`, not a hand-rolled pill — Stage Management
                    already uses `Chip` for its own status indicators, and
                    this table's own sibling (`ComparativeFitbitTable`) had
                    drifted onto a different `bg-card` fill for the identical
                    pill, which routing both through `Chip` fixes for free. */}
                <Chip tone={entry.synced ? 'success' : 'muted'} label={entry.synced ? 'Synced' : 'Not synced'} />
              </td>
              <td className="px-4 py-3 text-caption text-ink-muted">
                {entry.remPercent !== undefined ? (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    {entry.remPercent}%
                    <Trend current={entry.remPercent} previous={prev?.remPercent} />
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
                {entry.deepPercent !== undefined ? `${entry.deepPercent}%` : '—'}
              </td>
              <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
                {entry.lightPercent !== undefined ? `${entry.lightPercent}%` : '—'}
              </td>
              <td className="px-4 py-3 text-caption text-ink-muted">
                {entry.durationMin !== undefined ? (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    {Math.floor(entry.durationMin / 60)}h {entry.durationMin % 60}m
                    <Trend current={entry.durationMin} previous={prev?.durationMin} />
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
                {entry.disturbances ?? '—'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/**
 * The same table as `FitbitLogTable`, one row per dyad member, every value a
 * mean over the last N nights.
 *
 * Round 39, direct instruction ("reuse same table, do not invent anything new
 * … average values only for both dyad, individually"). It deliberately lives
 * directly beneath `FitbitLogTable` and mirrors it column for column, cell
 * class for cell class, so the two cannot drift: 7 columns, `purple-50` header
 * with no bottom rule, `px-6` on the first column and `px-4` after,
 * `text-caption tabular-nums text-ink-muted` values, em dash for absent data.
 *
 * Two changes from the log table's own columns:
 *   - **Date -> Member.** The rows are people now, not nights.
 *   - **Sync status is dropped entirely** (direct instruction: "I don't want to
 *     see not synced status"). It briefly rendered here as a "5 of 7 nights
 *     synced" chip. Worth recording what goes with it: the reader can no longer
 *     tell how many nights a mean rests on, so a 6h average over 2 synced
 *     nights and one over 7 now look identical. Unsynced nights are still
 *     excluded from every mean rather than counted as zero, so the figures
 *     themselves stay correct — it is only the sample size that is now
 *     invisible. The night-by-night log on the Client sleep & health data tab
 *     still carries its own Sync status column, so the information is one tab
 *     away rather than gone.
 *
 * `Trend` arrows are dropped — they compare a night with the night before, and
 * there is no "previous" for a single aggregate row.
 *
 * Means are taken **per metric over the nights that actually carry it**, not
 * over all N nights: an unsynced night has no REM figure at all, and counting
 * it as zero would drag every average toward zero and read as a sleep problem
 * that is really a flat battery.
 */
export function FitbitAveragesTable({
  people,
  nights,
  emptyMessage = 'No Fitbit data synced yet.',
}: {
  people: { key: string; name: string; log: HealthLogEntry[] }[]
  /** How many of the most recent nights to average. */
  nights: number
  emptyMessage?: string
}) {
  const rows = people.map((p) => {
    const window = p.log.slice(-nights)
    const mean = (pick: (e: HealthLogEntry) => number | undefined) => {
      const vals = window.map(pick).filter((v): v is number => v !== undefined)
      if (vals.length === 0) return undefined
      return vals.reduce((a, b) => a + b, 0) / vals.length
    }
    return {
      ...p,
      considered: window.length,
      rem: mean((e) => e.remPercent),
      deep: mean((e) => e.deepPercent),
      light: mean((e) => e.lightPercent),
      duration: mean((e) => e.durationMin),
      disturbances: mean((e) => e.disturbances),
    }
  })

  if (rows.every((r) => r.considered === 0)) {
    return <p className="p-6 text-caption text-ink-faint">{emptyMessage}</p>
  }

  const pct = (v: number | undefined) => (v === undefined ? '—' : `${Math.round(v)}%`)
  /* Disturbances is a count, so a mean is genuinely fractional — "0.4 wakings a
     night" is a real reading and rounding it to 0 would claim undisturbed
     sleep. One decimal, and no trailing ".0" on a whole number. */
  const count = (v: number | undefined) =>
    v === undefined ? '—' : Number.isInteger(v) ? String(v) : v.toFixed(1)

  return (
    <table className="w-full min-w-[760px] border-collapse text-left">
      <thead>
        <tr className="bg-purple-50">
          <th scope="col" className="px-6 py-4 text-caption-medium text-ink">Member</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">REM %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Deep %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Light %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Duration</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Disturbances</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.key} className={cn(i > 0 && 'border-t border-parchment')}>
            <th scope="row" className="px-6 py-3 text-left font-normal">
              {/* A row header, not a plain cell — the member is what every
                  value in the row is *about*, which is what `scope="row"`
                  tells a screen reader reading across it. */}
              <span className="text-caption whitespace-nowrap text-ink">{r.name}</span>{' '}
              <span className="text-fine text-ink-muted">({r.key})</span>
            </th>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">{pct(r.rem)}</td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">{pct(r.deep)}</td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">{pct(r.light)}</td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
              {r.duration === undefined ? '—' : formatSleepDuration(Math.round(r.duration))}
            </td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
              {count(r.disturbances)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** One log entry as plain CSV cell strings (Sync status/REM %/Deep %/Light %/
 *  Duration/Disturbances) — the same values `FitbitLogTable`/
 *  `ComparativeFitbitTable` display, reused by the Export button's CSV rows
 *  so the export always matches what's on screen. */
function fitbitEntryCsvRow(entry: HealthLogEntry | undefined): string[] {
  return [
    entry ? (entry.synced ? 'Synced' : 'Not synced') : '—',
    entry?.remPercent !== undefined ? `${entry.remPercent}%` : '—',
    entry?.deepPercent !== undefined ? `${entry.deepPercent}%` : '—',
    entry?.lightPercent !== undefined ? `${entry.lightPercent}%` : '—',
    entry?.durationMin !== undefined
      ? `${Math.floor(entry.durationMin / 60)}h ${entry.durationMin % 60}m`
      : '—',
    entry?.disturbances !== undefined ? String(entry.disturbances) : '—',
  ]
}

/** Fitbit Sync Monitor (plan §2c) — objective sleep data (REM/Deep/Light,
 *  duration, disturbances). Data Health Alerts are mapped within it (a
 *  per-member note), not a separate section — the page-level banner repeats
 *  the same signal for visibility.
 *
 *  Exported for direct reuse by the Consumer Portal's Health & Sleep tab
 *  (Round 5) — same grammar, not reinvented. `member`/`onMemberChange` are
 *  optional so that page can lift member selection across its several
 *  sections; this page's own call site stays uncontrolled, unchanged.
 *  `description`/`emptyMessage`/`memberLabels` (Round 5.1) let the Consumer
 *  Portal override researcher-facing copy (third-person phrasing, "PLE"/
 *  "Carer" role labels — see CLAUDE.md's consumer terminology rule) without
 *  forking the component; omitted, they fall back to this page's originals. */
type FitbitTab = 'comparative' | 'patient' | 'carer'

/** Display-only date-range filter for the Fitbit sleep-data table (Sync
 *  Monitor / Comparative view) — a dyad like dyad-011's whose `healthLog()`
 *  entries were extended to 18 nights (for the separate Sleep diary notes
 *  card's own horizontal-scroll demo) would otherwise render an equally long
 *  Fitbit table by simply sharing the same data. This never touches the
 *  underlying `healthLog()`/`patientLog`/`carerLog` data, and the Sleep
 *  diary notes card (`SleepDiaryFeed`) doesn't read it at all — it keeps
 *  showing its own full range regardless of what's selected here. Defaults
 *  to the shortest option so the table is short out of the box; harmless
 *  for a normal 5-entry seed log too (slicing the last 7/14 of a 5-entry
 *  log just returns all 5). */
type FitbitDateRange = '7' | '14' | 'all'

const FITBIT_DATE_RANGE_OPTIONS: { value: FitbitDateRange; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: 'all', label: 'All' },
]

/** Keeps only the most recent `range` entries of a (chronologically
 *  ascending) health log, or all of them for `'all'`. */
function filterLogToRange(log: HealthLogEntry[], range: FitbitDateRange): HealthLogEntry[] {
  if (range === 'all') return log
  const days = Number(range)
  return log.slice(-days)
}

/** Same idea as `filterLogToRange`, applied to an already-sorted list of
 *  union dates (the comparative table's own axis). */
function filterDatesToRange(dates: string[], range: FitbitDateRange): string[] {
  if (range === 'all') return dates
  const days = Number(range)
  return dates.slice(-days)
}

/** Comparative view (default-selected when the dyad has a PLE) — a
 *  research-facing interest in this study is exactly how the person with
 *  dementia's sleep relates to their carer's on the same nights, so this
 *  pairs both members' rows per date rather than switching between them.
 *  Same 7-column shape as `FitbitLogTable` (so the two views read as one
 *  table, not a redesign), with each date's PLE/Carer rows grouped by a
 *  merged (`rowSpan`) date cell and alternating-date shading — chosen over
 *  cramming two values into one cell, which breaks down for a status chip
 *  and a formatted duration, and over doubling the column count, which
 *  breaks down at 13 columns for a 2-person × 6-metric table. */
function ComparativeFitbitTable({ dyad, dateRange }: { dyad: ConsumerDyad; dateRange: FitbitDateRange }) {
  const dates = filterDatesToRange(
    [...new Set([...dyad.patientLog, ...dyad.carerLog].map((e) => e.date))].sort(),
    dateRange,
  )

  if (dates.length === 0) {
    return <EmptyState icon={Activity} copy="No Fitbit data synced yet" />
  }

  const entryFor = (log: HealthLogEntry[], date: string) => log.find((e) => e.date === date)

  return (
    <table className="w-full min-w-[820px] border-collapse text-left">
      <thead>
        {/* `purple-50`, no bottom rule — matches `FitbitLogTable`'s own
            header and `SleepDiaryFeed`'s table on this same tab. */}
        <tr className="bg-purple-50">
          <th scope="col" className="px-6 py-4 text-caption-medium text-ink">Date</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Member</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Sync status</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">REM %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Deep %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Light %</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Duration</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Disturbances</th>
        </tr>
      </thead>
      <tbody>
        {dates.map((date, groupIndex) =>
          ([
            { label: 'PLE', entry: entryFor(dyad.patientLog, date) },
            { label: 'Carer', entry: entryFor(dyad.carerLog, date) },
          ] as const).map((row, i) => (
            <tr
              key={`${date}-${row.label}`}
              className={cn(
                groupIndex > 0 && i === 0 && 'border-t border-parchment',
                groupIndex % 2 === 1 && 'bg-pearl',
              )}
            >
              {i === 0 && (
                <td rowSpan={2} className="px-6 py-3 align-top text-caption whitespace-nowrap text-ink">
                  {formatDate(date)}
                </td>
              )}
              <td className="px-4 py-3 align-top text-caption font-semibold text-ink-muted">{row.label}</td>
              <td className="px-4 py-3 align-top">
                {row.entry ? (
                  <Chip tone={row.entry.synced ? 'success' : 'muted'} label={row.entry.synced ? 'Synced' : 'Not synced'} />
                ) : (
                  <span className="text-caption text-ink-faint">—</span>
                )}
              </td>
              <td className="px-4 py-3 align-top text-caption tabular-nums text-ink-muted">
                {row.entry?.remPercent !== undefined ? `${row.entry.remPercent}%` : '—'}
              </td>
              <td className="px-4 py-3 align-top text-caption tabular-nums text-ink-muted">
                {row.entry?.deepPercent !== undefined ? `${row.entry.deepPercent}%` : '—'}
              </td>
              <td className="px-4 py-3 align-top text-caption tabular-nums text-ink-muted">
                {row.entry?.lightPercent !== undefined ? `${row.entry.lightPercent}%` : '—'}
              </td>
              <td className="px-4 py-3 align-top text-caption text-ink-muted">
                {row.entry?.durationMin !== undefined
                  ? `${Math.floor(row.entry.durationMin / 60)}h ${row.entry.durationMin % 60}m`
                  : '—'}
              </td>
              <td className="px-4 py-3 align-top text-caption tabular-nums text-ink-muted">
                {row.entry?.disturbances ?? '—'}
              </td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  )
}

export function FitbitSyncMonitor({
  dyad,
  member: controlledMember,
  onMemberChange,
  description = 'Objective sleep data synced via the Fitbit API.',
  emptyMessage,
  memberLabels,
  showComparative = true,
  tabsMatchPageRow = false,
}: {
  dyad: ConsumerDyad
  member?: 'patient' | 'carer'
  onMemberChange?: (member: 'patient' | 'carer') => void
  description?: string
  emptyMessage?: string
  memberLabels?: { patient?: string; carer?: string }
  /** Adds the default-selected "Comparative" tab — a clinical interest for a
   *  researcher/coach reading someone else's data, not something the
   *  Consumer Portal's own carer-facing controlled `member` (typed
   *  `'patient' | 'carer'` only, with no 'comparative' state to switch to)
   *  can represent. Consumer Portal turns this off; every other site keeps it. */
  showComparative?: boolean
  /** Aligns this section's member tabs with the *page's* own tab row: label
   *  flush to the section gutter, and the 5px active underline the Coach
   *  Delivery Portal's per-client row uses (direct instruction, Round 37 —
   *  a 2px bar 16px inboard read as a different kind of selected state on the
   *  same screen).
   *
   *  Opt-in, because the other two callers sit under page rows of their own
   *  with different underlines (the researcher record page's yellow 3px hero
   *  tabs, the Consumer Portal's 3px primary row) — turning this on for them
   *  would swap one mismatch for another. Both still show the same 16px label
   *  indent this fixes here; correcting them is a separate call. */
  tabsMatchPageRow?: boolean
}) {
  const [uncontrolledMember, setUncontrolledMember] = useState<FitbitTab>(
    showComparative && dyad.patient ? 'comparative' : dyad.patient ? 'patient' : 'carer',
  )
  // Display-only date-range filter (see `FitbitDateRange`) — defaults to the
  // shortest option so a dyad with an extended `healthLog()` (e.g. dyad-011,
  // 18 nights) doesn't render an equally long table by default.
  const [dateRange, setDateRange] = useState<FitbitDateRange>('7')
  const member: FitbitTab = controlledMember ?? uncontrolledMember
  // `onMemberChange` is only ever supplied where `showComparative` is false
  // (Consumer Portal), so `m` is never 'comparative' when it's called here —
  // routing 'comparative' through the internal state setter regardless keeps
  // that guarantee explicit rather than relying on an unsound type cast.
  const setMember = useCallback(
    (m: FitbitTab) => {
      if (m !== 'comparative' && onMemberChange) onMemberChange(m)
      else setUncontrolledMember(m)
    },
    [onMemberChange],
  )
  const tabs =
    showComparative && dyad.patient
      ? (['comparative', 'patient', 'carer'] as const)
      : dyad.patient
        ? (['patient', 'carer'] as const)
        : (['carer'] as const)
  const tabLabel = (m: FitbitTab) =>
    m === 'comparative' ? 'Comparative' : (memberLabels?.[m] ?? (m === 'patient' ? 'PLE' : 'Carer'))

  useEffect(() => {
    if (!dyad.patient && member !== 'carer') setMember('carer')
  }, [dyad, member, setMember])

  const log = member === 'patient' ? dyad.patientLog : member === 'carer' ? dyad.carerLog : []
  const rangedLog = filterLogToRange(log, dateRange)
  const memberLabel =
    memberLabels?.[member as 'patient' | 'carer'] ??
    (member === 'patient' ? (dyad.patient?.name ?? 'PLE') : dyad.carer.name)
  // Round 37, direct instruction: this section no longer carries a per-member
  // sync-gap banner of its own. The signal still exists where a page owns it —
  // the Research Dashboard's page-level dismissible banner and the Consumer
  // Portal's own — and `hasRecentGap` (exported, read by both) is unchanged.
  const exportRows: string[][] =
    member === 'comparative'
      ? (() => {
          const dates = filterDatesToRange(
            [...new Set([...dyad.patientLog, ...dyad.carerLog].map((e) => e.date))].sort(),
            dateRange,
          )
          return [
            ['Date', 'Member', 'Sync status', 'REM %', 'Deep %', 'Light %', 'Duration', 'Disturbances'],
            ...dates.flatMap((date) => [
              [formatDate(date), 'PLE', ...fitbitEntryCsvRow(dyad.patientLog.find((e) => e.date === date))],
              [formatDate(date), 'Carer', ...fitbitEntryCsvRow(dyad.carerLog.find((e) => e.date === date))],
            ]),
          ]
        })()
      : [
          ['Date', 'Sync status', 'REM %', 'Deep %', 'Light %', 'Duration', 'Disturbances'],
          ...rangedLog.map((entry) => [formatDate(entry.date), ...fitbitEntryCsvRow(entry)]),
        ]

  const handleExport = () => {
    const nameSlug = dyadTitle(dyad).toLowerCase().replace(/\s+/g, '-')
    const viewSlug = member === 'comparative' ? 'comparative' : (memberLabel || tabLabel(member)).toLowerCase()
    downloadCsv(`${nameSlug}-fitbit-sleep-data-${viewSlug}.csv`, exportRows)
  }

  return (
    // Title + copy live on the page canvas, not inside the card — the same
    // header-outside-the-card shape `SleepDiaryFeed` (the other table on
    // this tab) already uses, so the two read as one system.
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-title text-ink">Fitbit sleep data</h3>
          <p className="mt-1 text-caption text-ink-muted">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <label htmlFor="fitbit-date-range" className="sr-only">
              Date range
            </label>
            <select
              id="fitbit-date-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as FitbitDateRange)}
              className="h-9 appearance-none rounded-sm border border-hairline bg-card py-0 pr-8 pl-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            >
              {FITBIT_DATE_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
          {/* Primary-outline pill — the same accessible, already-reviewed
              Export button `SleepDiaryFeed` uses right below this section,
              replacing the previous low-emphasis `bg-pearl` utility
              button. */}
          <button
            type="button"
            onClick={handleExport}
            disabled={exportRows.length <= 1}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary px-4 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-hairline disabled:text-ink-faint disabled:hover:bg-transparent disabled:active:scale-100"
          >
            <Download aria-hidden="true" className="size-4" />
            Export
          </button>
        </div>
      </div>

      {tabs.length > 1 && (
        <UnderlineTabs
          tabs={tabs.map((m) => ({ id: m, label: tabLabel(m) }))}
          active={member}
          onChange={setMember}
          ariaLabel="Dyad member"
          layoutId="consumer-health-data-hub-member-underline"
          idPrefix="fitbit-member-tab"
          panelId="fitbit-table-panel"
          /* See `tabsMatchPageRow` above: flush label + the page row's 5px bar. */
          flushStart={tabsMatchPageRow}
          underlineEmphasis={tabsMatchPageRow ? 'page' : 'section'}
        />
      )}

      <div
        id="fitbit-table-panel"
        role="tabpanel"
        aria-labelledby={`fitbit-member-tab-${member}`}
      >
        <Card className="gap-0 overflow-hidden rounded-lg py-0">
          <div className="overflow-x-auto">
            {member === 'comparative' ? (
              <ComparativeFitbitTable dyad={dyad} dateRange={dateRange} />
            ) : (
              <FitbitLogTable log={rangedLog} emptyMessage={emptyMessage} />
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}

/** The 13 standard Consensus Sleep Diary questions, in order. Questions 1-9
 *  are directly answered (`SleepDiaryAnswers`); 10-13 are always derived at
 *  render time via `computeSleepDiary`, never stored. */
const SLEEP_DIARY_QUESTIONS: { label: string; computed?: boolean }[] = [
  { label: 'How long did you nap yesterday? (minutes)' },
  { label: 'How many minutes outside your sleep window were spent in bed doing something other than sleep?' },
  { label: 'What time did you close your eyes with the intention of falling asleep last night?' },
  { label: 'How long did it take you to fall asleep last night? (minutes)' },
  { label: 'How many times did you wake up during the night, not including the last time?' },
  { label: 'How many minutes total were you awake during the times reported in #5?' },
  { label: 'How many minutes were you out of bed during the times reported in #5?' },
  { label: 'What time did you wake up this morning (for the last time)?' },
  { label: 'What time did you get out of bed for the last time this morning?' },
  { label: 'How many minutes were you awake in bed between #8 and #9?', computed: true },
  { label: 'In total, how long was your Sleep Opportunity, in minutes? (time between #3 and #9)', computed: true },
  { label: 'Overall, how much Total Sleep Time did you get, in minutes? (#11 − #4 − #6 − #10)', computed: true },
  { label: 'Sleep Efficiency = Total Sleep Time (#12) / Sleep Opportunity (#11), as a percentage', computed: true },
]

/** Reads one question's value out of a night's diary answers — questions
 *  10-13 are computed live via `computeSleepDiary`, never read off a stored
 *  field. Returns '—' whenever the underlying answers are incomplete. */
function sleepDiaryCellValue(questionIndex: number, answers: SleepDiaryAnswers | undefined): string {
  if (!answers) return '—'
  switch (questionIndex) {
    case 0:
      return `${answers.napMin}`
    case 1:
      return `${answers.outOfSleepWindowMin}`
    case 2:
      return answers.bedtime
    case 3:
      return `${answers.sleepLatencyMin}`
    case 4:
      return `${answers.wakeCount}`
    case 5:
      return `${answers.awakeDuringNightMin}`
    case 6:
      return `${answers.outOfBedDuringNightMin}`
    case 7:
      return answers.wakeTime
    case 8:
      return answers.outOfBedTime
    case 9:
      return `${computeSleepDiary(answers).minutesAwakeInBed}`
    case 10:
      return `${computeSleepDiary(answers).sleepOpportunityMin}`
    case 11:
      return `${computeSleepDiary(answers).totalSleepTimeMin}`
    case 12:
      return `${computeSleepDiary(answers).sleepEfficiencyPercent.toFixed(0)}%`
    default:
      return '—'
  }
}

/** Minutes-since-midnight back to the diary's own "h:mm am/pm" format — the
 *  inverse of `parseTimeToMinutes`, needed only by the averaged view. Wraps
 *  past 24h so a mean bedtime that lands after midnight reads correctly. */
function clockFromMinutes(total: number): string {
  const m = ((Math.round(total) % 1440) + 1440) % 1440
  const hour24 = Math.floor(m / 60)
  const meridiem = hour24 >= 12 ? 'pm' : 'am'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${String(m % 60).padStart(2, '0')} ${meridiem}`
}

/**
 * One question's **mean** across a set of nights, as a display string.
 *
 * Round 39, direct instruction: the coach's checklist reads the diary as a
 * summary over a period rather than a day-by-day grid. Same question indexes as
 * `sleepDiaryCellValue`, so the two stay interchangeable per cell.
 *
 * Three kinds of question need three kinds of mean, and conflating them would
 * produce numbers that look fine and are wrong:
 *
 *  - **Minutes and counts** average directly. Counts keep one decimal, because
 *    "0.4 wakings a night" is a real reading and rounding it to 0 would claim
 *    undisturbed sleep.
 *  - **Clock times** average in minutes-since-midnight, then format back.
 *  - **Bedtime specifically** is shifted: a 12:30 am bedtime is 30 minutes past
 *    midnight, so a naive mean of "11:30 pm" (1410) and "12:30 am" (30) is
 *    720 — 12:00 *noon*. Any bedtime before noon is treated as belonging to the
 *    previous evening (+24h) before averaging, which puts the mean at 12:00 am
 *    where it belongs. The same trap does not apply to wake times, which never
 *    straddle midnight in this data.
 *
 * The derived questions (10-13) are deliberately unhandled — they are already
 * filtered out of the coach's view, which is the only caller of this.
 */
function averageDiaryCellValue(
  questionIndex: number,
  entries: (SleepDiaryAnswers | undefined)[],
): string {
  const present = entries.filter((a): a is SleepDiaryAnswers => !!a)
  if (present.length === 0) return '—'

  const meanOf = (pick: (a: SleepDiaryAnswers) => number) =>
    present.reduce((sum, a) => sum + pick(a), 0) / present.length

  const minutes = (pick: (a: SleepDiaryAnswers) => number) => `${Math.round(meanOf(pick))}`
  const countValue = (pick: (a: SleepDiaryAnswers) => number) => {
    const v = meanOf(pick)
    return Number.isInteger(v) ? String(v) : v.toFixed(1)
  }
  const clock = (pick: (a: SleepDiaryAnswers) => string, shiftBeforeNoon = false) =>
    clockFromMinutes(
      meanOf((a) => {
        const m = parseTimeToMinutes(pick(a))
        return shiftBeforeNoon && m < 720 ? m + 1440 : m
      }),
    )

  switch (questionIndex) {
    case 0:
      return minutes((a) => a.napMin)
    case 1:
      return minutes((a) => a.outOfSleepWindowMin)
    case 2:
      return clock((a) => a.bedtime, true)
    case 3:
      return minutes((a) => a.sleepLatencyMin)
    case 4:
      return countValue((a) => a.wakeCount)
    case 5:
      return minutes((a) => a.awakeDuringNightMin)
    case 6:
      return minutes((a) => a.outOfBedDuringNightMin)
    case 7:
      return clock((a) => a.wakeTime)
    case 8:
      return clock((a) => a.outOfBedTime)
    default:
      return '—'
  }
}

/**
 * Consensus Sleep Diary — **one night at a time**.
 *
 * Round 25, rebuilt from Figma `210:267` (section `275:5936`). It was an ~18
 * date-column grid you scrolled sideways; it is now a single night's answers
 * with a date stepper, which is how the diary is actually read — a researcher
 * or coach opens the most recent night, not eighteen at once. That also
 * retires the WCAG 2.1.1 problem Round 20 had to work around by making the
 * scroll container a tabbable `role="region"`: there is nothing to scroll to
 * any more.
 *
 * Rows are the 13 Consensus questions in order. 1-9 are directly answered;
 * **10-13 are always derived** at render time via `computeSleepDiary` and
 * carry an "Auto-calculated" badge — never read off a stored field. The frame
 * draws 11 rows with 2 badged, which is an abbreviation of this same list; the
 * project's own 13 are kept.
 *
 * Shared by the researcher's Sleep & Health Data tab and the Coach Delivery
 * Portal's Health Data Hub. The single-night view suits both, so this is
 * deliberately not forked.
 */
export function SleepDiaryFeed({
  dyad,
  viewerRole = 'researcher',
  compact = false,
  averageNights,
}: {
  dyad: ConsumerDyad
  /** See `ModuleEngagementTab` — consumer/client is audience-dependent. */
  viewerRole?: 'researcher' | 'coach'
  /**
   * Drops this section's own title and sub copy, keeping the date stepper,
   * Export and table.
   *
   * Round 39, for the coach's pre-session checklist, where the card the panel
   * sits inside already carries a title — rendering "Sleep diary notes" again
   * 16px under the tab labelled "Sleep diary notes" is the kind of duplicate
   * heading that reads as a bug. Off by default, so the three existing callers
   * are byte-identical.
   */
  compact?: boolean
  /**
   * Render **means over the last N nights** instead of a single night, and drop
   * the date stepper (there is no night being stepped through).
   *
   * Round 39, direct instruction, for the coach's pre-session checklist: before
   * a session a coach wants the shape of the last week, not one night, and
   * pairing it with the Fitbit averages on the neighbouring tab makes the two
   * read as one summary. The Client sleep & health data tab keeps the
   * night-by-night view, which is still the right one for reading a specific
   * night back to someone.
   *
   * The table itself is unchanged — same 9 question rows, same two member
   * columns, same cells. Only the value in each cell and the header control
   * differ, which is what keeps this a mode rather than a second table.
   */
  averageNights?: number
}) {
  const personNoun = viewerRole === 'coach' ? 'client' : 'consumer'
  /* Round 39, direct instruction: **a coach does not see the auto-calculated
     questions.** Questions 10-13 are the derived ones (`computed`) — minutes
     awake in bed, Sleep Opportunity, Total Sleep Time, Sleep Efficiency — and
     a coach reads the diary to know what their client actually reported, not
     to read a sleep-efficiency figure back to them.

     Filtered here rather than at the two call sites, so the researcher's own
     view keeps all 13 and the coach's two surfaces (this tab and the
     pre-session checklist) cannot disagree about which questions exist.

     Note the knock-on, which is deliberate: `handleDownload` maps this same
     list, so a coach's CSV export carries the 9 answered questions and no
     derived columns. The export matching what is on screen is the point — a
     download that silently contains four rows the page refused to show would
     be worse.

     Each entry keeps its **original** index. `sleepDiaryCellValue` switches on
     the question's position in the canonical 13, so handing it a filtered
     list's own index would silently read the wrong answer for every row after
     the first omission. It happens that the 4 computed questions are the last
     4, so a naive filter would work today — and would break the moment a
     derived question is added anywhere but the end. */
  const questions = SLEEP_DIARY_QUESTIONS.map((q, index) => ({ ...q, index })).filter(
    (q) => !(viewerRole === 'coach' && q.computed),
  )
  const dates = [...new Set([...dyad.patientLog, ...dyad.carerLog].map((e) => e.date))].sort()
  const entryFor = (log: HealthLogEntry[], date: string) => log.find((e) => e.date === date)

  /* Opens on the most recent night on record — the "previous day" in the
     sense that matters here, since a diary is filled in the morning after.
     Clamped rather than reset so switching dyads can never index past the
     end of a shorter log. */
  const [dateIndex, setDateIndex] = useState(() => Math.max(0, dates.length - 1))
  const index = Math.min(dateIndex, Math.max(0, dates.length - 1))
  const date = dates[index]
  const canGoEarlier = index > 0
  const canGoLater = index < dates.length - 1

  const prevBtnRef = useRef<HTMLButtonElement | null>(null)
  const nextBtnRef = useRef<HTMLButtonElement | null>(null)
  const steppedRef = useRef<'earlier' | 'later' | null>(null)

  /* Stepping to either end of the log disables the button just pressed, and a
     `disabled` control cannot hold focus — the browser drops it to `<body>`.
     Same rescue as the study log's pager, and it has to run in an effect: in
     the click handler the sibling is still disabled from the previous render,
     so focusing it silently does nothing. */
  useEffect(() => {
    const pressed = steppedRef.current
    if (!pressed) return
    steppedRef.current = null
    const stillUsable = pressed === 'earlier' ? canGoEarlier : canGoLater
    if (stillUsable) return
    const sibling = pressed === 'earlier' ? nextBtnRef.current : prevBtnRef.current
    sibling?.focus()
  }, [index, canGoEarlier, canGoLater])

  const people = [
    ...(dyad.patient
      ? [{ key: 'PLE' as const, name: dyad.patient.name, log: dyad.patientLog }]
      : []),
    { key: 'Carer' as const, name: dyad.carer.name, log: dyad.carerLog },
  ]

  /* The averaged view's own window: the last N nights that exist, so the
     caption can say how many were actually averaged rather than claiming 7
     when only 5 are on record. */
  const averaging = averageNights !== undefined
  const windowDates = averaging ? dates.slice(-averageNights) : []
  const answersFor = (log: HealthLogEntry[]) =>
    windowDates.map((d) => entryFor(log, d)?.diary)
  /** One cell's text — a single night's answer, or the window's mean. */
  const cellValue = (questionIndex: number, log: HealthLogEntry[]) =>
    averaging
      ? averageDiaryCellValue(questionIndex, answersFor(log))
      : sleepDiaryCellValue(questionIndex, entryFor(log, date)?.diary)

  /* Exports the night on screen, not the whole log — the card is a
     single-night view, and a one-day card quietly producing eighteen days of
     CSV would be a surprise. The date is in the filename so a folder of these
     stays legible. */
  const handleDownload = () => {
    if (!averaging && !date) return
    const csvRows = [
      ['Question', ...people.map((p) => `${p.key} (${p.name})`)],
      ...questions.map((q) => [
        `${q.index + 1}. ${q.label}`,
        ...people.map((p) => cellValue(q.index, p.log)),
      ]),
    ]
    /* Filename says which view produced it — an averaged export and a
       single-night export of the same client would otherwise collide in a
       downloads folder and be indistinguishable once there. */
    downloadCsv(
      `${dyadTitle(dyad).toLowerCase().replace(/\s+/g, '-')}-sleep-diary-${
        averaging ? `${windowDates.length}-night-average` : date
      }.csv`,
      csvRows,
    )
  }

  const stepBtn =
    'inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-hairline bg-card text-ink outline-none transition-colors hover:bg-parchment focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-card'

  /* In the averaged view the whole header row is empty — no title (compact), no
     stepper, no Export — so it is not rendered at all rather than left as a
     zero-height flex box contributing the section's own `gap-4`. */
  const showHeaderRow = !compact || !averaging

  return (
    <section className="flex flex-col gap-4">
      {/* Header (`275:5937`): title + sub copy on the left, the date stepper
          and Export on the right. Card titles are sentence case per §35a, so
          the frame's "Sleep Diary Notes" becomes "Sleep diary notes". */}
      {showHeaderRow && (
      <div
        className={cn(
          'flex flex-wrap items-end gap-4',
          /* With no title on the left, the stepper and Export would sit at the
             start of an otherwise empty row. `justify-end` keeps them on the
             right where every other caller puts them. */
          compact ? 'justify-end' : 'justify-between',
        )}
      >
        {!compact && (
          <div className="min-w-0 flex-1">
            <h3 className="text-title text-ink">Sleep diary notes</h3>
            <p className="mt-1 text-caption text-ink-muted">
              The diary as filled in by this {personNoun}, one night at a time.
            </p>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-4">
          {/* Direct instruction: the averaged view carries **no** badge pill and
              **no** Export — just the plain from/to label rendered above the
              table below. So this control cluster is empty in that mode, and
              the stepper and Export are the night-by-night view's alone. */}
          {!averaging && dates.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                ref={prevBtnRef}
                onClick={() => {
                  steppedRef.current = 'earlier'
                  setDateIndex(index - 1)
                }}
                disabled={!canGoEarlier}
                aria-label="Earlier night"
                className={stepBtn}
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              {/* The frame's `Purple/700` badge — `primary` here, white label,
                  10.62:1. It is the anchor of the whole card, so it carries the
                  one filled surface in the row. */}
              <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-sm bg-primary px-4 text-caption-medium whitespace-nowrap text-white">
                <CalendarDays aria-hidden="true" className="size-4" />
                {formatDate(date)}
              </span>
              <button
                type="button"
                ref={nextBtnRef}
                onClick={() => {
                  steppedRef.current = 'later'
                  setDateIndex(index + 1)
                }}
                disabled={!canGoLater}
                aria-label="Later night"
                className={stepBtn}
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={dates.length === 0}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary px-4 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-hairline disabled:text-ink-faint disabled:hover:bg-transparent disabled:active:scale-100"
          >
            <Download aria-hidden="true" className="size-4" />
            Export
          </button>
        </div>
      </div>
      )}

      {/* Direct instruction: a plain from/to date label above the table, in
          place of the badge pill and Export the averaged view no longer has.
          It also does the job the removed footnote did — a mean with no stated
          window is an unfalsifiable number, and this is the only thing on
          screen saying which nights it covers.
          A real `<time>` pair, so the range is machine-readable rather than
          three spans that merely look like a date. */}
      {averaging && windowDates.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 text-caption text-ink-muted">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <span className="text-caption-medium text-ink">
            {windowDates.length === 1
              ? 'Average of 1 night'
              : `Average of ${windowDates.length} nights`}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            From <time dateTime={windowDates[0]}>{formatDate(windowDates[0])}</time> to{' '}
            <time dateTime={windowDates[windowDates.length - 1]}>
              {formatDate(windowDates[windowDates.length - 1])}
            </time>
          </span>
        </p>
      )}

      {/* In compact mode (direct instruction) this table sits inside the
          coach's checklist card, so it drops two things a standalone card
          keeps: the shadow (a panel floating inside a panel) and the 16px
          radius (repeating the parent card's own radius reads as a second
          card). `rounded-sm` is the app's 8px token, matching the Fitbit
          averages table in the neighbouring panel. Every standalone caller is
          unaffected. */}
      <Card
        className={cn(
          'gap-0 overflow-hidden py-0',
          compact ? 'rounded-sm shadow-none' : 'rounded-lg',
        )}
      >
        {dates.length === 0 ? (
          <EmptyState icon={NotebookPen} copy="No diary entries logged yet" />
        ) : (
          <table className="w-full border-collapse text-left">
            <colgroup>
              <col />
              {people.map((p) => (
                <col key={p.key} className="w-[160px]" />
              ))}
            </colgroup>
            <thead>
              {/* `purple-50`, no bottom rule — the treatment every table on
                  this record now shares. */}
              <tr className="bg-purple-50">
                <th scope="col" className="px-6 py-4 text-caption-medium text-ink">
                  Sleep diary question
                </th>
                {people.map((p) => (
                  <th
                    key={p.key}
                    scope="col"
                    className="px-4 py-4 text-center text-caption-medium text-ink"
                  >
                    {p.key} {averaging ? 'average' : 'answer'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q, qi) => (
                <tr key={q.label} className={cn(qi > 0 && 'border-t border-parchment')}>
                  <td className="px-6 py-[18px]">
                    <div className="flex items-start gap-2">
                      {/* The question's own canonical number, not its position
                          in a filtered list — a coach's diary is questions
                          1-9 of the Consensus instrument, and renumbering
                          them 1-9 would be a coincidence today and a lie as
                          soon as a hidden question is not last. */}
                      <span className="shrink-0 text-caption-medium text-primary">{q.index + 1}.</span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-caption text-ink">{q.label}</p>
                        {/* Round 25, direct instruction: the badge is purple,
                            not grey. `purple-50` fill with `primary` text is
                            10.62:1, and it ties the badge to the question
                            number beside it, which is already `primary`. */}
                        {q.computed && (
                          <span className="inline-flex w-fit items-center rounded-full bg-purple-50 px-2 py-0.5 text-fine text-primary">
                            Auto-calculated
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {people.map((p) => {
                    const value = cellValue(q.index, p.log)
                    return (
                      <td key={p.key} className="px-4 py-[18px] text-center">
                        {/* The frame's 120px answer pill. A missing answer
                            stays an em dash on the page canvas rather than a
                            filled pill around nothing. */}
                        {value === '—' ? (
                          <span className="text-caption text-ink-faint">{value}</span>
                        ) : (
                          <span className="inline-flex min-w-[120px] items-center justify-center rounded-sm bg-parchment px-4 py-2 text-caption-medium whitespace-nowrap text-ink">
                            {value}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Not shown in the averaged view — the from/to label above the table
          already states the window, and saying it twice around one table reads
          as two different claims. */}
      {!averaging && dates.length > 0 && (
        <p className="text-fine text-ink-faint">
          Night {index + 1} of {dates.length} on record
        </p>
      )}
    </section>
  )
}
