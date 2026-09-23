import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Download,
  Lock,
  GripVertical,
  Minus,
  NotebookPen,
  Paperclip,
  SlidersHorizontal,
  TriangleAlert,
} from 'lucide-react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { Chip } from '@/components/research/StatusChip'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { Card } from '@/components/ui/card'
import { TabIntro } from '@/components/research/TabIntro'
import { KeyUpdatesPanel, type KeyUpdateItem } from '@/components/research/KeyUpdatesPanel'
import {
  RECORD_GRID,
  RecordFieldList,
  RecordInput,
  RecordSelect,
  RecordTextarea,
  type RecordFieldItem,
} from '@/components/research/RecordFields'
import { cn } from '@/lib/utils'
import { downloadCsv } from '@/lib/csv'
import { SlideCard } from '@/pages/research/CoachProfilePage'
import {
  CONSUMER_MODULES,
  SLEEP_DIARY_QUESTIONS,
  SPACES_CATCHUP_COUNT,
  catchupSessionsCompleted,
  computeSleepDiary,
  displaySessionNumber,
  moduleIndex,
  moduleUnlockState,
  sessionRowLabel,
  type ConsumerDyad,
  type HealthLogEntry,
  type NotificationPreferences,
  type PersonProfile,
  type SessionCompletionRecord,
  type SessionPlan,
  type SleepDiaryAnswers,
} from '@/data/spaces'
import { SegmentedSwitch } from '@/components/shared/SegmentedSwitch'
import { SleepSourceComparison } from '@/components/research/SleepSourceComparison'
import { useResearch } from '@/data/research-context'
import { formatDate, TODAY } from '@/data/format'
import { parseTimeToMinutes } from '@/data/spaces'

// Round 21: "Assigned Coach" removed on direct instruction — the Overview's
// Learning progress card now names the assigned coach, and the coach's own
// record lives under Coach Management.
/* Direct instruction: **Study Progress, Sleep & Health Data and Notes are
   hidden on this page.** All three now read off the Coach Management record
   page instead, under its own "Assigned Consumers" tab — the study-progress
   timeline and study log as its "Study progress" sub-tab, Fitbit + sleep diary
   as its "Sleep & health data" sub-tab. Showing the same three surfaces in two
   places would be two renderings of one fact, which is the failure mode this
   project keeps hitting.

   The components behind them are **not** deleted: `StudyProgressTimelineCard`,
   `StudyLogSection` and `HealthDataHubTab` are exported and consumed by
   `SpacesCoachProfilePage`. `NotesTab` has no caller today and is exported
   rather than removed, because "hide" was the instruction and the researcher
   notes write path (`researchNotes`/`addResearchNote`) is still in the store. */
/* Direct instruction, a round later: **Overview is hidden too.** Once the coach
   record page shows this consumer's contact details (in its "View consumer
   details" panel), their learning progress and their attention items, the
   Overview tab was a second rendering of all three — and two surfaces showing
   one fact is the failure mode this project keeps hitting.

   That leaves one tab, so the tab row hides itself (see `TABS.length > 1`
   below) rather than drawing a tablist with a single item. `OverviewTab` is
   exported, not deleted, for the same reason as `NotesTab`. */
const TABS = ['Profile details'] as const
type Tab = (typeof TABS)[number]

/** Per-tab title + sub copy (Figma `93:7`). */
const TAB_INTRO: Record<Tab, { title: string; subtitle: string }> = {
  'Profile details': {
    title: 'Profile details',
    subtitle: 'Study information and contact details for both members of this dyad',
  },
}

/** Same table header treatment as every other research table. */
// Round 24, node `194:2861`: header labels move `ink-muted` -> `ink` on the
// new `purple-50` band, and the row's padding to the frame's own 16px.
const SESSION_TH = 'px-4 py-4 text-caption-medium text-ink'

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

function dyadTitle(dyad: ConsumerDyad): string {
  return dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name
}

/**
 * Page-level banner for a consumer who has left the study.
 *
 * Mirrors `CoachProfilePage`'s `WithdrawnBanner` exactly — same `destructive`
 * fill, same `TriangleAlert`, same `role="status"`, same 1320px inner width —
 * so a researcher reads the same signal whichever record page they are on.
 *
 * **Not dismissible, deliberately.** It describes standing account state, not a
 * one-time notice; a researcher who dismissed it would read the rest of the
 * record as though the consumer were still active.
 *
 * White on `--destructive` measures **5.38:1** here, rasterised through a 1x1
 * canvas on the live page. `CoachProfilePage`'s equivalent banner comment says
 * 5.86:1; that figure was not reproduced on a recompute, so the measured one is
 * recorded rather than the inherited one — CLAUDE.md warns specifically about
 * "verified" contrast numbers that do not survive being measured again. Clears
 * AA either way.
 */
function DyadWithdrawnBanner({ dyad }: { dyad: ConsumerDyad }) {
  return (
    <div role="status" className="border-b border-black/10 bg-destructive px-6 py-3 md:px-8">
      <div className="mx-auto flex max-w-[1320px] items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-white" />
        <p className="text-caption font-semibold text-white">
          {dyadTitle(dyad)} withdrew from the study
          {dyad.optedOut ? ` on ${formatDate(dyad.optedOut.date)}` : ''}. They no longer have
          access to the platform. Their records are kept per their consent.
        </p>
      </div>
    </div>
  )
}

/**
 * Page-level banner for a consumer who has **asked** to leave and is waiting on
 * the research team.
 *
 * **Red, same `destructive` fill as the withdrawn banner** (direct instruction,
 * 2026-09-21: *"withdrawn banner to be red"*, given while looking at this one).
 * It was built amber, on the trainee page's `PendingInviteBanner` treatment,
 * on the reasoning that a request is an outstanding task rather than a closed
 * record — that reasoning is recorded here and overruled, not silently
 * dropped. The two banners are still mutually exclusive at the call site, and
 * the copy is what now distinguishes them: this one says the consumer *asked*
 * and still has access, the other says they have gone.
 *
 * White on `--destructive` measures **5.38:1**, rasterised on the live page.
 */
function WithdrawalRequestedBanner({ dyad }: { dyad: ConsumerDyad }) {
  return (
    <div role="status" className="border-b border-black/10 bg-destructive px-6 py-3 md:px-8">
      <div className="mx-auto flex max-w-[1320px] items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-white" />
        <p className="text-caption font-semibold text-white">
          {dyadTitle(dyad)} asked to withdraw from the study
          {dyad.withdrawalRequested ? ` on ${formatDate(dyad.withdrawalRequested.date)}` : ''}.
          They still have platform access until the research team records the withdrawal on the
          Profile details tab.
        </p>
      </div>
    </div>
  )
}

/**
 * The reasons a research coordinator withdraws a consumer.
 *
 * Deliberately **not** the trainee/coach list (`CoachProfilePage`'s
 * `WITHDRAWAL_REASONS`), which is about employment — "Left their aged care
 * employer", "No longer has capacity to continue training". A consumer is a
 * person living with dementia and their carer; they leave for clinical and
 * caregiving reasons, and offering a researcher "Left their aged care employer"
 * on this dialog would be noise at best.
 *
 * "Withdrew at their own request" is first among the real reasons because it is
 * the one the withdrawal-request flow lands on.
 */
const CONSUMER_WITHDRAWAL_REASONS = [
  'Withdrew from the study at their own request',
  'Health or care needs have changed',
  'Moved into residential aged care',
  'Carer no longer able to take part',
  'Unable to be contacted',
  'Bereavement',
  'Research team decision',
  'Other',
]

function SelectChevron() {
  return (
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
    />
  )
}

/** A run of 2+ consecutive days (most recent first) failing a check — the
 *  ">48 hours" threshold from plan §2c, expressed against the 5-day daily log. */
export function hasRecentGap(log: HealthLogEntry[], failing: (e: HealthLogEntry) => boolean): boolean {
  if (log.length < 2) return false
  return log.slice(-2).every(failing)
}

/** Data Health Alerts (plan §2c). Checks both dyad members independently,
 *  since sync/diary gaps aren't necessarily shared.
 *
 *  As of Round 37 neither this page nor the Coach Delivery Portal's own
 *  renders a sync banner beside the Fitbit table — the remaining readers are
 *  both notification hubs and the Consumer Portal's page-level banner. */
export function dyadHealthAlerts(dyad: ConsumerDyad): string[] {
  const members: { label: string; log: HealthLogEntry[] }[] = []
  if (dyad.patient) members.push({ label: dyad.patient.name, log: dyad.patientLog })
  members.push({ label: dyad.carer.name, log: dyad.carerLog })

  const alerts: string[] = []
  for (const m of members) {
    if (hasRecentGap(m.log, (e) => !e.synced)) {
      alerts.push(`${m.label}’s Fitbit hasn’t synced in over 48 hours.`)
    }
    if (hasRecentGap(m.log, (e) => !e.diaryEntry)) {
      alerts.push(`${m.label}’s sleep-diary entries have stopped for over 48 hours.`)
    }
  }
  return alerts
}

/* ------------------------------------------------------------------------ */
/* Overview                                                                  */
/* ------------------------------------------------------------------------ */

/** The consumer's own landing tab: the same consolidated identity/notes
 *  card the coach sees on their Assigned Consumers tab (`ConsumerDetailsCard`,
 *  reused as-is, not forked), plus a read-only view of their SPACES session
 *  tracker. Subtitle is deliberately generic — this page is reached without
 *  a coach in context (a consumer can be enrolled before assignment), so it
 *  never assumes or names a specific coach. */
/**
 * Consumer Overview — Round 21, rebuilt to the same shape as the trainee
 * profile's own Overview so the two record pages read as one system:
 *   1. Contact details, on the yellow surface, for both dyad members.
 *   2. Learning progress — how far through the 7 consumer modules they are.
 *   3. Scheduled sessions — the existing read-only session plan, which already
 *      answers where they are, which module is done, which session is next and
 *      whether it's been completed.
 *
 * Consumers carry no participant ID, so the contact card is email and phone
 * only — the trainee card's third row has no equivalent here.
 */
/**
 * Round 24 — one "Trainee Details Card" per dyad member (frame `194:2555`,
 * nodes `194:2614` / `194:2830`). Same chassis as the trainee Overview's own
 * card: a vertical `yellow-100` -> white gradient, 1px `parchment` border, the
 * warm card shadow, and the frame's three literal row tracks
 * (110px label / 24px colon / value) with the colon as its own `aria-hidden`
 * span outside both `dt` and `dd`, so it never joins either accessible name.
 *
 * Consumers carry no participant ID, so the rows are Email / Phone /
 * Background — the trainee card's "Trainee ID" row has no equivalent here.
 *
 * The Background row is the one addition the frame doesn't specify a control
 * for: the frame draws it capped at 3 lines with an ellipsis, which loses the
 * rest of a genuinely long clinical note. It is clamped to 3 lines as drawn,
 * with a "Show more" toggle below the panel that reveals the full text. The
 * toggle only renders when the text actually overflows — measured, not guessed
 * from a character count, and re-measured on resize, since whether 3 lines are
 * enough depends entirely on the card's width.
 */
/** Exported for the Coach Management record page's "View consumer details"
 *  slide-in panel, which shows the same contact card per dyad member rather
 *  than a second identity treatment of its own (direct instruction). */
export function ContactDetailsCard({
  role,
  person,
}: {
  role: 'PLE' | 'Carer'
  person: PersonProfile
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const bgRef = useRef<HTMLDivElement | null>(null)
  const background = person.background?.trim()

  useEffect(() => {
    const el = bgRef.current
    if (!el || !background || expanded) return
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    measure()
    // Width drives whether 3 lines are enough, so a viewport or sibling-card
    // change has to re-measure — a one-shot check on mount would strand the
    // toggle in whichever state the first paint happened to produce.
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [background, expanded])

  const rows: { label: string; value: string | undefined; clamp?: boolean }[] = [
    { label: 'Email', value: person.email },
    { label: 'Phone', value: person.phone },
    { label: 'Background', value: background, clamp: true },
  ]

  return (
    <Card className="gap-0 rounded-lg border border-parchment bg-gradient-to-b from-yellow-100 to-white py-0 shadow-card">
      <div className="flex h-full flex-col gap-2 p-6">
        {/* `px-2` is the frame's own 8px inset on this row and on the rows
            block below it, so the name's left edge lines up with the "Email"
            label under it. */}
        <div className="flex items-center gap-2 px-2">
          <p className="min-w-0 flex-1 truncate text-title text-ink">{person.name}</p>
          {/* Role badge. Not a `<Chip>`: these are identity labels, not status,
              and the frame gives them the brand's own two hues rather than any
              of the six status tones. Contrast computed from the painted fills
              — white on `purple-500` 4.85:1, `ink` on `yellow-400` 9.90:1,
              both clear AA. */}
          <span
            className={cn(
              'inline-flex h-6 shrink-0 items-center rounded-full px-2 text-caption-medium',
              role === 'PLE' ? 'bg-purple-500 text-white' : 'bg-yellow-400 text-ink',
            )}
          >
            {role}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-x-0 gap-y-4 p-2 sm:grid-cols-[110px_24px_1fr]">
          {rows.map((f) => (
            <Fragment key={f.label}>
              <dt className={cn('text-caption-medium text-ink', !f.clamp && 'sm:self-center')}>
                {f.label}
              </dt>
              <span
                aria-hidden="true"
                className={cn(
                  'hidden text-body-md text-ink sm:block',
                  !f.clamp && 'sm:self-center',
                )}
              >
                :
              </span>
              <dd className="min-w-0 text-caption text-ink">
                {f.value ? (
                  f.clamp ? (
                    <>
                      <div ref={bgRef} className={cn(!expanded && 'line-clamp-3')}>
                        {f.value}
                      </div>
                      {/* Directly below the background text and inside the
                          value column, per direct annotated feedback — a
                          toggle sitting at the card's left edge read as
                          belonging to the card, not to the text it expands.
                          `-ml-2` pulls the button's own padding back so its
                          label starts exactly on the value column's x. */}
                      {overflows && (
                        <button
                          type="button"
                          onClick={() => setExpanded((v) => !v)}
                          aria-expanded={expanded}
                          className="-ml-2 inline-flex min-h-9 items-center gap-1 rounded-sm px-2 text-caption-medium text-primary outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {expanded ? 'Show less' : 'Show more'}
                          {expanded ? (
                            <ChevronUp aria-hidden="true" className="size-4" />
                          ) : (
                            <ChevronDown aria-hidden="true" className="size-4" />
                          )}
                          <span className="sr-only"> of {person.name}&rsquo;s background</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="block truncate">{f.value}</span>
                  )
                ) : (
                  '—'
                )}
              </dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </Card>
  )
}

/**
 * The "Key updates" list on the Overview tab (frame node `194:2655`).
 *
 * The frame draws five rows, three of which are placeholder copy ("Action
 * items: Next steps for sleep improvement", "Sleep hygiene: Optimizing your
 * environment", "Weekly check-in: Progress and reflections") — none of them a
 * real Care2Sleep concept and none backed by a field on `ConsumerDyad`. This
 * takes the panel's shape from the frame and derives every row from the record,
 * the same call §66 made for the trainee's own version of this panel.
 */
function consumerKeyUpdates({
  dyad,
  inProgressTitle,
  modulesDone,
  totalModules,
  coachName,
  plan,
  completed,
}: {
  dyad: ConsumerDyad
  inProgressTitle: string | undefined
  modulesDone: number
  totalModules: number
  coachName: string | undefined
  plan: SessionPlan | undefined
  completed: SessionCompletionRecord[]
}): KeyUpdateItem[] {
  const rows: KeyUpdateItem[] = []

  rows.push({
    id: 'ongoing-module',
    label: 'Ongoing module',
    value:
      inProgressTitle ??
      (modulesDone === totalModules ? 'All modules completed' : 'None in progress'),
  })

  rows.push({
    id: 'assigned-coach',
    label: 'Assigned coach',
    value: coachName ?? 'Not assigned',
    ...(coachName ? {} : { tone: 'text-destructive' }),
  })

  const lastDone = dyad.moduleEngagement
    .filter((r) => r.status === 'completed' && r.lastActivityDate)
    .sort((a, b) => (a.lastActivityDate ?? '').localeCompare(b.lastActivityDate ?? ''))
    .at(-1)
  if (lastDone) {
    const title = CONSUMER_MODULES[moduleIndex(lastDone.moduleId)]?.title ?? lastDone.moduleId
    rows.push({
      id: 'last-completed-module',
      label: 'Last completed module',
      value: `${title} · ${formatDate(lastDone.lastActivityDate!)}`,
    })
  }

  // First planned session that hasn't been held. A row with no date is not
  // "next" — it is unscheduled, which the row below reports instead.
  const next = plan?.sessions.find((s) => s.date && !completed.some((c) => c.session === s.session))
  rows.push(
    next?.date
      ? {
          id: 'next-session',
          label: 'Next session',
          value: `${sessionRowLabel(next.session)} · ${formatDate(next.date)}`,
        }
      : {
          id: 'next-session',
          label: 'Next session',
          value: 'Not yet scheduled',
          tone: 'text-destructive',
        },
  )

  const planned = plan?.sessions.every((s) => !!s.date) ?? false
  rows.push({
    id: 'session-plan',
    label: 'Session plan',
    value: planned ? 'Created' : 'Not created yet',
    ...(planned ? {} : { tone: 'text-destructive' }),
  })

  return rows
}

/** **No caller today** — the Overview tab is hidden on direct instruction.
 *  Exported rather than deleted; re-enabling it is one entry in `TABS`. */
export function OverviewTab({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans, coaches } = useResearch()
  const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]

  const modulesDone = dyad.moduleEngagement.filter((r) => r.status === 'completed').length
  const totalModules = CONSUMER_MODULES.length
  const inProgress = dyad.moduleEngagement.find((r) => r.status === 'in-progress')
  const inProgressTitle = inProgress
    ? (CONSUMER_MODULES[moduleIndex(inProgress.moduleId)]?.title ?? inProgress.moduleId)
    : undefined
  const lastActivity = dyad.moduleEngagement
    .map((r) => r.lastActivityDate)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)

  const people = [
    ...(dyad.patient ? [{ role: 'PLE' as const, person: dyad.patient }] : []),
    { role: 'Carer' as const, person: dyad.carer },
  ]

  const keyUpdates = consumerKeyUpdates({
    dyad,
    inProgressTitle,
    modulesDone,
    totalModules,
    coachName: coach?.fullName,
    plan,
    completed,
  })
  const sessionsDone = catchupSessionsCompleted(completed)
  // First planned catch-up that hasn't been held. A row with no date is not
  // "next" — it is unscheduled, which the pill says instead.
  const nextPlannedDate = plan?.sessions.find(
    (r) => r.date && !completed.some((c) => c.session === r.session),
  )?.date

  return (
    // Round 24, frame `194:2555`: sections are 40px apart, not 24 — the frame's
    // own `Frame 108` -> `Learning Progress Card` -> `Frame 137` offsets, and
    // the same value now used on the trainee Overview.
    <div className="flex flex-col gap-10">
      {/* Round 24 — `Frame 136` (node `194:2829`). One card per dyad member,
          side by side and equal width, replacing the single card that held both
          people in stacked white panels. Each card leads with the person's own
          name (so the "Contact details" heading is gone, as on the trainee
          card) and carries a role badge, which is what now distinguishes PLE
          from Carer — previously a `PLE:`/`Carer:` line above each panel. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {people.map(({ role, person }) => (
          <ContactDetailsCard key={role} role={role} person={person} />
        ))}
      </div>

      {/* Round 24 — "Learning Progress Card" (node `194:2632`), superseding the
          half-width version that used to share a row with the contact card.
          Same shape as the trainee Overview's own card (§66): a full-width card
          holding two `parchment` panels 24px apart — a flex-1 "Progress:" panel
          and a fixed 640px "Key updates" panel. */}
      <section>
        <Card className="gap-0 rounded-lg border border-parchment bg-card py-0 shadow-card">
          <div className="flex flex-col gap-6 p-6">
            {/* The "View more" CTA is gone with the Study Progress tab it
                pointed at (direct instruction). Its detail now lives on the
                Coach Management record page, which this page has no link to —
                deliberately left as a dead end rather than deep-linking a
                consumer record into a coach record. */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="min-w-0 flex-1 text-title text-ink">
                Consumer&rsquo;s learning journey progress
              </h2>
            </div>

            {/* Splits at `xl`, not `lg`, for the same reason as the trainee
                card: the right panel is a fixed 640px and the left needs
                ~409px beside it. */}
            <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
              {/* Progress panel (`194:2638`) */}
              <div className="flex min-w-0 flex-1 flex-col gap-6 rounded-sm bg-parchment p-4">
                <p className="flex h-6 items-center text-body-md text-ink">Progress:</p>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    {/* `h-16` + `justify-between` on both columns: labels pinned
                        top, values bottom, which puts the 32px count and the
                        16px date on a shared baseline without either column
                        knowing the other's type size. */}
                    <div className="flex h-16 items-start justify-between gap-4">
                      <div className="flex h-full flex-col justify-between">
                        <p className="text-caption text-ink-muted">Modules completed:</p>
                        <p className="text-display-md whitespace-nowrap text-ink">
                          {modulesDone} of {totalModules}
                        </p>
                      </div>
                      <div className="flex h-full flex-col items-start justify-between">
                        <p className="text-caption whitespace-nowrap text-ink-muted">Last active:</p>
                        <p className="text-body-md whitespace-nowrap text-ink">
                          {lastActivity ? formatDate(lastActivity) : 'Not started'}
                        </p>
                      </div>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-purple-200"
                      role="img"
                      aria-label={`${modulesDone} of ${totalModules} modules completed`}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(modulesDone / totalModules) * 100}%` }}
                      />
                    </div>
                  </div>
                  {/* White 72px sub-panel (`194:2651`) — the trainee card's
                      "Current Stage" slot. A consumer has no COACH stage, and
                      the frame fills it with the fact that does apply to them:
                      how many of the 6 numbered catch-up sessions are done.
                      Counted with `catchupSessionsCompleted` (Round 21.1) so it
                      excludes the unnumbered Planning session and cannot
                      disagree with the sessions table below. */}
                  {/* Round 25, direct instruction: a second row for the next
                      scheduled session, with the **date inside the pill** —
                      same label + pill treatment as the row above it, so the
                      panel reads as one pair of facts rather than a fact and a
                      caption. The fixed `h-18` is gone: it was sized for a
                      single row and would have clipped the second. */}
                  <div className="flex flex-col justify-center gap-2 rounded-sm bg-card p-3">
                    {/* Round 25, direct instruction: these two labels are
                        `caption-medium` rather than `body-md`. */}
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 text-caption-medium text-ink">
                        Total sessions completed:
                      </p>
                      {/* Round 25, direct instruction: `x/y`, not a bare
                          count. The denominator is `SPACES_CATCHUP_COUNT` (6),
                          matching the "Sessions held 3 of 6" KPI on the Study
                          Progress tab and every other surface that shows this
                          figure — Round 21.1 fixed a real bug caused by
                          counting the unnumbered Planning session here, which
                          made a dyad read "1 of 7" directly beside
                          "Next session: Session 1". */}
                      <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-purple-50 px-3 text-caption-medium text-ink">
                        {sessionsDone}/{SPACES_CATCHUP_COUNT}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 text-caption-medium text-ink">
                        Next scheduled session:
                      </p>
                      <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-purple-50 px-3 text-caption-medium whitespace-nowrap text-ink">
                        {nextPlannedDate ? formatDate(nextPlannedDate) : 'Not scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key updates panel (`194:2655`) */}
              <KeyUpdatesPanel items={keyUpdates} className="xl:w-[640px] xl:shrink-0" />
            </div>
          </div>
        </Card>
      </section>

    </div>
  )
}


/* ------------------------------------------------------------------------ */
/* Profile details                                                          */
/* ------------------------------------------------------------------------ */

/** Consent records (plan §2a, new — Round 4). Dummy filenames only; add
 *  (via upload) / delete, matching the Supervision Records attachment
 *  pattern already used elsewhere for dummy attachments.
 *
 *  Restructured onto the trainee Personal-details card vocabulary
 *  (design-tokens.md §67): a `purple-50` header band (no `border-t` seam
 *  below it — the band is its own boundary) and `RecordRowDivider` between
 *  rows instead of a plain `divide-y`, so all three cards in this tab now
 *  share one header/row grammar. */
/**
 * ⚠️ **DUMMY CLINICAL DATA — prototype only, no data-layer backing.**
 *
 * The Notion brief ("Researcher dashboard open items to be confirmed" →
 * Consumer management sub-pages → Profile details) lists clinical fields that
 * have no home on `PersonProfile`:
 *
 *   PLE   — Sleep issues, Current medications relevant to sleep,
 *           Years since diagnosis during enrolment, Dementia type, Comorbidities
 *   Carer — Sleep issues, Current medications relevant to sleep,
 *           Own health conditions, Primary carer
 *
 * Direct instruction, 2026-09-21: *"just update prototype, add some fields, no
 * need to mess with data"*. So `PersonProfile` and the seed in `data/spaces.ts`
 * are deliberately untouched, the values below are invented, and they are held
 * in **local component state** — an edit survives Save while the card stays
 * mounted and resets on navigation. Nothing here reaches the store.
 *
 * **What replaces this:** real fields on `PersonProfile` (or a read of the
 * REDCap record the brief asks about), seeded per dyad, saved through
 * `updateDyadPerson` alongside the fields that already round-trip.
 *
 * Keyed by person name rather than dyad id so a carer-only dyad resolves too.
 */
const DUMMY_CLINICAL: Record<
  string,
  { sleepIssues?: string; medications?: string; yearsSinceDiagnosis?: string; comorbidities?: string; ownConditions?: string; primaryCarer?: string }
> = {
  'Bruce Whitfield': {
    sleepIssues: 'Yes',
    medications: 'Donepezil 10mg (evening), melatonin 2mg PRN',
    yearsSinceDiagnosis: '3',
    comorbidities: 'Type 2 diabetes, osteoarthritis (both knees)',
  },
  'Joan Whitfield': {
    sleepIssues: 'Yes',
    medications: 'None',
    ownConditions: 'Hypertension, managed with medication',
    primaryCarer: 'Yes',
  },
  'Arthur Ngata': {
    sleepIssues: 'Yes',
    medications: 'Rivastigmine patch 9.5mg/24h',
    yearsSinceDiagnosis: '1',
    comorbidities: 'Benign prostatic hyperplasia (nocturia)',
  },
  'Tania Ngata': {
    sleepIssues: 'Yes',
    medications: 'None',
    ownConditions: 'None reported',
    primaryCarer: 'Yes',
  },
  'Dorothy Kellerman': {
    sleepIssues: 'Yes',
    medications: 'Amlodipine 5mg (morning), temazepam 10mg PRN',
    yearsSinceDiagnosis: '4',
    comorbidities: 'Hypertension, previous TIA (2023)',
  },
  'Frank Kellerman': {
    sleepIssues: 'Yes',
    medications: 'None',
    ownConditions: 'Lower back pain',
    primaryCarer: 'Yes',
  },
  'Eleanor Sinclair': {
    sleepIssues: 'No',
    medications: 'Memantine 20mg (morning)',
    yearsSinceDiagnosis: '5',
    comorbidities: 'Atrial fibrillation, hypothyroidism',
  },
  'Margaret Sinclair': {
    sleepIssues: 'No',
    medications: 'None',
    ownConditions: 'None reported',
    primaryCarer: 'Yes',
  },
  'Harold Ableson': {
    sleepIssues: 'Yes',
    medications: 'Donepezil 5mg (evening)',
    yearsSinceDiagnosis: '2',
    comorbidities: 'Chronic kidney disease (stage 2), high cholesterol',
  },
  'Diane Ableson': {
    sleepIssues: 'Yes',
    medications: 'None',
    ownConditions: 'Migraine',
    primaryCarer: 'Yes',
  },
}

const YES_NO = ['Yes', 'No', 'Not recorded']

/** The recognised dementia types, in the order the enrolment record uses. */
const DEMENTIA_TYPES = [
  "Alzheimer's disease",
  'Vascular dementia',
  "Mixed vascular and Alzheimer's",
  'Lewy body dementia',
  'Frontotemporal dementia',
  'Not recorded',
]

/**
 * Dementia type, **derived from the person's own Background text** rather than
 * stored beside it.
 *
 * Deliberate: Background is rendered two rows below this one on the same card,
 * and it already says which dementia the PLE lives with. A second, independent
 * copy is precisely how this project's most-repeated bug arrives — two surfaces
 * (here, one card) showing the same fact off two fields, free to disagree the
 * moment either is edited. Deriving it means they cannot.
 *
 * Order matters: "mixed" is checked before the single types, because a mixed
 * presentation names both.
 */
function dementiaTypeFrom(background: string): string {
  const b = background.toLowerCase()
  if (b.includes('mixed')) return "Mixed vascular and Alzheimer's"
  if (b.includes('lewy')) return 'Lewy body dementia'
  if (b.includes('frontotemporal')) return 'Frontotemporal dementia'
  if (b.includes('vascular')) return 'Vascular dementia'
  if (b.includes('alzheimer')) return "Alzheimer's disease"
  return 'Not recorded'
}

/** One dyad member's identity record.
 *
 *  Round 47 (2026-09-21): the `dl` of inline `Label ....... value` rows is
 *  replaced by the shared `RecordFields` "title + text field" vocabulary —
 *  a label above a filled `pearl` box, two to a row — ported from the
 *  Consumer Portal's own My Profile card on direct instruction. The
 *  `purple-50` header band, the "Edit details" toggle and the `onSave` shape
 *  are unchanged; only the rows inside changed. `RecordRowDivider` is gone
 *  from this card: the boxes are their own boundaries, so a rule between them
 *  would draw a line through whitespace. */
function PersonRecordCard({
  title,
  person,
  showRelationship,
  isPle,
  onSave,
  readOnly = false,
}: {
  title: string
  person: PersonProfile
  showRelationship: boolean
  /** Selects the brief's PLE-only clinical block (dementia type, years since
   *  diagnosis, comorbidities) over the carer-only one (own health conditions,
   *  primary carer). Passed explicitly rather than inferred from
   *  `showRelationship`, which is about the *dyad's shape*, not this person's
   *  role — a carer-only enrolment has no PLE and still shows the carer block. */
  isPle: boolean
  onSave: (patch: Partial<PersonProfile>) => void
  /** Round 36, direct instruction: a coach may read a client's PLE/Carer
   *  details but not change them — that write path belongs to the research
   *  team. Hides the "Edit details" affordance entirely and never enters the
   *  form state, rather than relying on `onSave` simply not being wired. */
  readOnly?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  const [age, setAge] = useState(String(person.age))
  const [relationship, setRelationship] = useState(person.relationship ?? '')
  const [email, setEmail] = useState(person.email ?? '')
  const [phone, setPhone] = useState(person.phone ?? '')
  const [background, setBackground] = useState(person.background)

  /* Dummy clinical block — see `DUMMY_CLINICAL` above. Held here, saved
     nowhere. `useState` initialisers run once, so an edit is not clobbered by a
     re-render; navigating away and back resets it, which is the honest
     behaviour for a value with no store behind it. */
  const seed = DUMMY_CLINICAL[person.name] ?? {}
  const [sleepIssues, setSleepIssues] = useState(seed.sleepIssues ?? 'Not recorded')
  const [medications, setMedications] = useState(seed.medications ?? 'None recorded')
  const [yearsSinceDiagnosis, setYearsSinceDiagnosis] = useState(seed.yearsSinceDiagnosis ?? '—')
  const [dementiaType, setDementiaType] = useState(dementiaTypeFrom(person.background))
  const [comorbidities, setComorbidities] = useState(seed.comorbidities ?? 'None recorded')
  const [ownConditions, setOwnConditions] = useState(seed.ownConditions ?? 'None reported')
  const [primaryCarer, setPrimaryCarer] = useState(seed.primaryCarer ?? 'Not recorded')

  // Both the form's Cancel and Save controls unmount the instant `editing`
  // flips back to `false` — the card swaps to its `dl` and remounts "Edit
  // details" in the same spot. Without this, focus drops to `<body>`, this
  // project's most-repeated defect class (CLAUDE.md's non-negotiables list).
  // `wasEditing` distinguishes "just left edit mode" from first mount, so
  // this doesn't steal focus on initial page load.
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  useEffect(() => {
    if (editing) {
      wasEditing.current = true
    } else if (wasEditing.current) {
      wasEditing.current = false
      editButtonRef.current?.focus()
    }
  }, [editing])

  const resetFields = () => {
    setName(person.name)
    setAge(String(person.age))
    setRelationship(person.relationship ?? '')
    setEmail(person.email ?? '')
    setPhone(person.phone ?? '')
    setBackground(person.background)
    setSleepIssues(seed.sleepIssues ?? 'Not recorded')
    setMedications(seed.medications ?? 'None recorded')
    setYearsSinceDiagnosis(seed.yearsSinceDiagnosis ?? '—')
    setDementiaType(dementiaTypeFrom(person.background))
    setComorbidities(seed.comorbidities ?? 'None recorded')
    setOwnConditions(seed.ownConditions ?? 'None reported')
    setPrimaryCarer(seed.primaryCarer ?? 'Not recorded')
  }

  const idFor = (field: string) => `${title.replace(/\s+/g, '-').toLowerCase()}-${field}`

  /* Read-mode rows, in the brief's own order: the five shared identity fields
     first, then the role-specific clinical block. `full` on the sentence
     fields — Background, Comorbidities, Own health conditions — because a
     half-width box wraps them to four lines and reads as a broken column. */
  /* Read-mode rows. Order is deliberate and is the same order the edit form
     below uses: **every short field first, every narrative field last.** A
     `full` item placed mid-list spans the whole grid, which forces itself onto
     the next row and leaves the cell beside its predecessor empty — so the
     brief's own ordering (Background sitting among the identity fields) would
     punch a hole through the middle of the card. The fields are all still
     here, and a narrative field reading last is also how a record actually
     gets read: facts, then prose.

     Both roles land on exactly eight short fields — a clean four-by-two block
     — which is what makes the two-column grid above the right call. */
  const fields: RecordFieldItem[] = [
    { key: 'name', label: 'Name', value: person.name },
    { key: 'age', label: 'Age', value: String(person.age) },
    ...(showRelationship
      ? [{ key: 'relationship', label: 'Relationship to PLE', value: person.relationship || '—' }]
      : []),
    { key: 'email', label: 'Email', value: person.email || '—' },
    { key: 'phone', label: 'Phone', value: person.phone || '—' },
    { key: 'sleep-issues', label: 'Sleep issues', value: sleepIssues },
    { key: 'medications', label: 'Current medications relevant to sleep', value: medications },
    ...(isPle
      ? [
          {
            key: 'years-since-diagnosis',
            label: 'Years since diagnosis at enrolment',
            value: yearsSinceDiagnosis,
          },
          { key: 'dementia-type', label: 'Dementia type', value: dementiaType },
          { key: 'comorbidities', label: 'Comorbidities', value: comorbidities, full: true },
        ]
      : [
          { key: 'primary-carer', label: 'Primary carer', value: primaryCarer },
          {
            key: 'own-conditions',
            label: 'Own health conditions',
            value: ownConditions,
            full: true,
          },
        ]),
    { key: 'background', label: 'Background', value: person.background, full: true },
  ]

  return (
    <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
      <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
        <h2 className="font-display text-title text-ink">{title}</h2>
        {!editing && !readOnly && (
          <button
            ref={editButtonRef}
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-9 shrink-0 items-center rounded-sm bg-card px-4 text-caption-medium text-primary outline-none transition-colors hover:bg-parchment focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            Edit details
          </button>
        )}
      </div>

      {editing && !readOnly ? (
        <form
          className="flex flex-col gap-5 p-6"
          onSubmit={(e) => {
            e.preventDefault()
            /* Only the fields that exist on `PersonProfile` are sent. The
               clinical block stays in local state by design — see
               `DUMMY_CLINICAL`. */
            onSave({
              name,
              age: Number(age) || person.age,
              ...(showRelationship ? { relationship } : {}),
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
              background,
            })
            setEditing(false)
          }}
        >
          <div className={RECORD_GRID}>
            <RecordInput id={idFor('name')} label="Name" value={name} onChange={setName} />
            <RecordInput
              id={idFor('age')}
              label="Age"
              value={age}
              onChange={setAge}
              type="number"
              min={0}
            />
            {showRelationship && (
              <RecordInput
                id={idFor('relationship')}
                label="Relationship to PLE"
                value={relationship}
                onChange={setRelationship}
              />
            )}
            <RecordInput
              id={idFor('email')}
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
            />
            <RecordInput
              id={idFor('phone')}
              label="Phone"
              value={phone}
              onChange={setPhone}
              type="tel"
            />
            <RecordSelect
              id={idFor('sleep-issues')}
              label="Sleep issues"
              value={sleepIssues}
              onChange={setSleepIssues}
              options={YES_NO}
            />
            <RecordInput
              id={idFor('medications')}
              label="Current medications relevant to sleep"
              value={medications}
              onChange={setMedications}
            />
            {isPle ? (
              <>
                <RecordInput
                  id={idFor('years-since-diagnosis')}
                  label="Years since diagnosis at enrolment"
                  value={yearsSinceDiagnosis}
                  onChange={setYearsSinceDiagnosis}
                />
                <RecordSelect
                  id={idFor('dementia-type')}
                  label="Dementia type"
                  value={dementiaType}
                  onChange={setDementiaType}
                  options={DEMENTIA_TYPES}
                />
                <RecordTextarea
                  id={idFor('comorbidities')}
                  label="Comorbidities"
                  value={comorbidities}
                  onChange={setComorbidities}
                  rows={2}
                />
              </>
            ) : (
              <>
                <RecordSelect
                  id={idFor('primary-carer')}
                  label="Primary carer"
                  value={primaryCarer}
                  onChange={setPrimaryCarer}
                  options={YES_NO}
                />
                <RecordTextarea
                  id={idFor('own-conditions')}
                  label="Own health conditions"
                  value={ownConditions}
                  onChange={setOwnConditions}
                  rows={2}
                />
              </>
            )}
            {/* Last, matching the read view's own order — see the comment on
                `fields` above for why every spanning field sits at the end. */}
            <RecordTextarea
              id={idFor('background')}
              label="Background"
              value={background}
              onChange={setBackground}
              rows={4}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-6 text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => {
                resetFields()
                setEditing(false)
              }}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary px-6 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <RecordFieldList fields={fields} className="p-6" />
      )}
    </Card>
  )
}

/** Local sibling of `components/account/NotificationPreferencesCard.tsx` —
 *  same fields, same behaviour, but styled onto this tab's `purple-50`
 *  header cards (Figma `210:797`, node `221:2`) rather than that
 *  component's `bg-card-header` band. Same precedent as `PersonRecordCard`
 *  above: a local variant rather than restyling a component 3 other Account
 *  pages already rely on. */
function DyadNotificationPreferencesCard({
  dyad,
  onSave,
}: {
  dyad: ConsumerDyad
  onSave: (prefs: NotificationPreferences) => void
}) {
  const preferences = dyad.notificationPreferences ?? { email: true, sms: false }
  const [email, setEmail] = useState(preferences.email)
  const [sms, setSms] = useState(preferences.sms)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEmail(preferences.email)
    setSms(preferences.sms)
  }, [preferences.email, preferences.sms])

  const dirty = email !== preferences.email || sms !== preferences.sms

  // Figma `210:797` node `221:19`/`221:22`: a 28px `purple-500` checkbox with
  // a white checkmark, not the browser's native control — `appearance-none`
  // on the (still real, still keyboard/AT-operable) input, with the check
  // glyph as a `peer-checked`-driven sibling rather than a second fake
  // element layered on top of a hidden real one.
  const checkboxClass =
    'peer size-7 shrink-0 cursor-pointer appearance-none rounded-[6px] border border-hairline bg-card outline-none transition-colors checked:border-purple-500 checked:bg-purple-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
      <div className="flex min-h-16 items-center bg-purple-50 px-6 py-3">
        <h2 className="font-display text-title text-ink">Notification preferences</h2>
      </div>
      <div className="p-6">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSave({ email, sms })
            setSaved(true)
          }}
        >
          <label className="flex cursor-pointer items-center gap-3 text-caption text-ink">
            <span className="relative inline-flex size-7 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={email}
                onChange={(e) => {
                  setEmail(e.target.checked)
                  setSaved(false)
                }}
                className={checkboxClass}
              />
              <Check
                aria-hidden="true"
                className="pointer-events-none absolute size-4 text-white opacity-0 peer-checked:opacity-100"
              />
            </span>
            Email
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-caption text-ink">
            <span className="relative inline-flex size-7 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={sms}
                onChange={(e) => {
                  setSms(e.target.checked)
                  setSaved(false)
                }}
                className={checkboxClass}
              />
              <Check
                aria-hidden="true"
                className="pointer-events-none absolute size-4 text-white opacity-0 peer-checked:opacity-100"
              />
            </span>
            SMS
          </label>

          {dirty && (
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Save changes
            </button>
          )}
          {saved && !dirty && (
            <p role="status" className="text-fine font-semibold text-success">
              Saved.
            </p>
          )}
        </form>
      </div>
    </Card>
  )
}

/** Both dyad members' basic details, each in their own editable, vertically
 *  stacked field list, side by side as two columns. Restructured onto the
 *  trainee record page's Personal details card vocabulary
 *  (design-tokens.md §67) — see `PersonRecordCard` above. Consent records
 *  removed per Figma `210:797`, which has no such section on this tab.
 *
 *  Figma `210:797`: adds a "Study information" card (join date + a
 *  researcher-initiated "Withdraw from study", the same `purple-50` header +
 *  destructive-outline-on-`bg-card` button `CoachProfilePage`'s own Study
 *  information card already established for the trainee record page — see
 *  that file's comment on why the fill is opaque, not a translucent tint)
 *  and a "Notification preferences" card at the end. The frame's own
 *  personal-details content ("Claire Donnelly / Research coordinator /
 *  Monash University") is a researcher's own profile borrowed from a My
 *  Profile screen, same as the trainee record page's frame — this dyad's
 *  real PLE/Carer fields stay, just retitled to match the frame's card
 *  headings. "Join date" reads the dyad's earliest consent upload as the
 *  closest existing stand-in for an enrolment date, rather than adding a new
 *  field for a UI-only pass. */
/* Round 36: exported and made role-aware so the Coach Delivery Portal's own
   "Client Profile Details" tab renders *this* component rather than a second,
   simpler set of cards of its own. Before this the coach saw two bare
   `ProfilePersonCard`s while the researcher saw Study information + two
   `PersonRecordCard`s + Notification preferences — the same record, two
   different card vocabularies, which is exactly the drift this project keeps
   paying for. One component, one set of cards, two permission levels.

   A coach's two removals are permissions, not layout (direct instruction):
   they cannot withdraw a client from the study, and they cannot change the
   client's notification preferences — so the button and the whole
   preferences card are *absent*, not disabled. The third difference is a
   routing fact rather than a permission: "Assigned coach" links to
   `/research/spaces-coaches/:id`, a Research Dashboard route the Coach
   Delivery Portal must not send anyone into, so the coach sees the name as
   plain text. */
export function ProfileDetailsSections({
  dyad,
  viewerRole = 'researcher',
}: {
  dyad: ConsumerDyad
  /** Same `viewerRole` contract `SessionTracker` established in Round 17.2 and
   *  `ModuleEngagementTab`/`SleepDiaryFeed` adopted in Round 30. */
  viewerRole?: 'researcher' | 'coach'
}) {
  const { updateDyadPerson, setDyadOptOut, updateDyadNotificationPreferences, coaches, spacesCoaches } =
    useResearch()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [withdrawDetail, setWithdrawDetail] = useState('')
  /* Seeded from the request date when there is one: a researcher actioning a
     request that came in three days ago is recording *that* date, not the day
     they got to the paperwork. Falls back to today, and stays editable either
     way. A lazy initialiser, so re-renders cannot clobber a typed value. */
  const [withdrawDate, setWithdrawDate] = useState(() => dyad.withdrawalRequested?.date ?? TODAY)
  /** Focus target after a withdrawal is recorded.
   *
   *  Confirming unmounts the button that opened the dialog — `!dyad.optedOut`
   *  goes false and the CTA disappears — so `ConfirmDialog`'s own
   *  restore-focus-to-trigger has nothing left to restore to and focus lands
   *  on `<body>`. **Measured, not assumed**: running the flow end to end
   *  reported `document.activeElement === document.body`, which is this
   *  project's most-repeated defect and has shipped in six separate rounds.
   *
   *  The Study information heading is the right landing place — it is the card
   *  whose contents just changed, and unlike the trigger it survives the
   *  change. Same contract `SpacesCoachProfilePage`'s own `studyHeadingRef`
   *  already uses. Focusing synchronously inside `onConfirm` is deliberate:
   *  `ConfirmDialog` defers its restore a frame and skips it when focus has
   *  already left the closing panel, so the heading wins. */
  const studyHeadingRef = useRef<HTMLHeadingElement>(null)
  const isResearcher = viewerRole === 'researcher'
  /* The consumer has asked to leave and nobody has actioned it yet. Drives the
     banner, the Study information status row and the CTA's own label — one
     fact, read in three places rather than three booleans that could drift. */
  const requested = !dyad.optedOut && !!dyad.withdrawalRequested
  const joinDate = dyad.consentDocuments[0]?.uploadedDate
  /* Direct instruction: the assigned coach belongs in Study information — who
     this consumer is paired with, and since when, is study record rather than
     personal detail. Derived from `dyad.coachId`, never a second stored copy of
     the name: this page and the coach record page must not be able to disagree
     about a pairing.
     Every row degrades honestly when there is no coach, rather than being
     omitted — "not assigned" is a real state a researcher acts on, and a
     missing row reads as missing data. */
  const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined
  /* Only link to the coach record page when there *is* one. `spacesCoaches`
     holds onboarded coaches; a certified-but-not-yet-onboarded candidate has a
     `Coach` record and no SPACES record, so `/research/spaces-coaches/:id`
     redirects straight back to the roster for them. A link that silently
     dead-ends is worse than plain text, so the name renders unlinked instead.
     ⚠️ That case is reachable today: `dyad-012` is assigned to `mei-ling-chen`,
     who sits in the "Waiting to be onboarded" list — a consumer assigned to a
     coach who has not been onboarded is a seed-data contradiction, flagged
     here rather than papered over. */
  const coachRecordExists = !!coach && spacesCoaches.some((sc) => sc.coachId === coach.id)

  return (
    // 40px stack, all cards vertical — same rhythm as the other tabs.
    <div className="flex flex-col gap-10">
      <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2
            ref={studyHeadingRef}
            tabIndex={-1}
            className="font-display text-title text-ink outline-none"
          >
            Study information
          </h2>
          {isResearcher && !dyad.optedOut && (
            /* Same destructive-outline-on-`bg-card` button the trainee record
               page uses. The fill is opaque, not `bg-destructive/8`: measured,
               an 8% tint on the `purple-50` band composites to a pinkish
               `rgb(241,220,236)` where `destructive` is only 4.15:1 and fails
               AA. On white it is 5.38:1.

               The label changes when the consumer has already asked to leave —
               the researcher is then *confirming a request*, not initiating a
               withdrawal, and a button that says "Withdraw from study" over a
               banner saying they already requested it reads as a second,
               separate action. */
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="inline-flex h-9 shrink-0 items-center rounded-sm border border-destructive bg-card px-4 text-caption-medium text-destructive outline-none transition-colors hover:bg-destructive/8 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              {requested ? 'Review withdrawal request' : 'Withdraw from study'}
            </button>
          )}
        </div>
        {/* Round 47: the inline `Label ....... value` rows become the shared
            "title + text field" vocabulary (`RecordFields`), so this card and
            the two personal-details cards below it read as one system rather
            than two. `RecordRowDivider` goes with them — the boxes are their
            own boundaries. */}
        <RecordFieldList
          className="p-6"
          fields={[
            { key: 'join-date', label: 'Join date', value: joinDate ? formatDate(joinDate) : '\u2014' },
            {
              key: 'assigned-coach',
              label: 'Assigned coach',
              value:
                isResearcher && coachRecordExists && coach ? (
                  /* A link, not plain text: the coach record is where a
                     researcher goes next from here, and it is one hop away.
                     Never for a coach — the target is a Research Dashboard
                     route, so it renders as the plain-text branch below. */
                  /* `-my-2 py-2` reclaims the value box's own vertical
                     padding so the link's hit area is the full 36px the box
                     is, without the box growing around it. Caught by
                     `layout-audit.js` at 20px, and it is a real finding rather
                     than the excluded "text link inside a table cell" case:
                     there the row is the tap target, here the link is the only
                     way to reach the coach record. */
                  <Link
                    to={`/research/spaces-coaches/${coach.id}`}
                    className="-my-2 inline-flex min-h-9 items-center rounded-sm py-2 text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {coach.fullName}
                  </Link>
                ) : coach ? (
                  <span>{coach.fullName}</span>
                ) : (
                  <span className="text-destructive">Not assigned</span>
                ),
            },
            { key: 'coach-email', label: 'Coach email', value: coach?.email || '\u2014' },
            {
              key: 'assigned-on',
              label: 'Assigned on',
              value: dyad.coachAssignedDate ? formatDate(dyad.coachAssignedDate) : '\u2014',
            },
            /* Status is only a row when there is something to say. An
               always-present "Active" row would be the fifth thing on a card
               whose other four are facts a researcher looks up; the two states
               that matter are both exceptions. */
            ...(dyad.optedOut
              ? [
                  {
                    key: 'status',
                    label: 'Status',
                    full: true,
                    value: (
                      <span className="text-destructive">
                        Withdrawn on {formatDate(dyad.optedOut.date)}
                        {dyad.optedOut.reason ? ` \u00b7 ${dyad.optedOut.reason}` : ''}
                      </span>
                    ),
                  } as RecordFieldItem,
                ]
              : requested && dyad.withdrawalRequested
                ? [
                    {
                      key: 'status',
                      label: 'Status',
                      full: true,
                      value: (
                        <span className="text-destructive">
                          Withdrawal requested on {formatDate(dyad.withdrawalRequested.date)}
                          {dyad.withdrawalRequested.note
                            ? ` \u00b7 ${dyad.withdrawalRequested.note}`
                            : ''}
                        </span>
                      ),
                    } as RecordFieldItem,
                  ]
                : []),
          ]}
        />
      </Card>

      {/* Direct instruction, 2026-09-21: *"vertically stack the consumer
          details first PLE then carer"*. They were two side-by-side columns
          at `lg`, which halved each card's width and forced its own field grid
          down to one column on anything but a very wide screen — so the
          "title + text field" rows never actually got to sit two across.
          Stacked, each card is full width and its fields read as the intended
          grid. PLE first, matching the hero's own PLE/Carer order. */}
      <div className="flex flex-col gap-6">
        {dyad.patient && (
          <PersonRecordCard
            title="PLE personal details"
            person={dyad.patient}
            showRelationship={false}
            isPle
            readOnly={!isResearcher}
            onSave={(patch) => updateDyadPerson(dyad.id, 'patient', patch)}
          />
        )}
        <PersonRecordCard
          title="Carer personal details"
          person={dyad.carer}
          showRelationship={!!dyad.patient}
          isPle={false}
          readOnly={!isResearcher}
          onSave={(patch) => updateDyadPerson(dyad.id, 'carer', patch)}
        />
      </div>

      {isResearcher && (
        <DyadNotificationPreferencesCard
          dyad={dyad}
          onSave={(prefs) => updateDyadNotificationPreferences(dyad.id, prefs)}
        />
      )}

      {isResearcher && (
        /* Withdrawal — rebuilt 2026-09-21 from the Notion brief: *"The
           researcher will click on the withdraw tab, enter reason for
           withdrawal, date of withdrawal."* It was a single yes/no confirm
           before, which recorded neither: it hardcoded "Withdrawn by the
           research team" and stamped `TODAY` inside the store.

           Deliberately identical in shape to the trainee record page's own
           withdrawal dialog (`CoachProfilePage`'s `PersonalDetails`) — same
           reason/date/detail triple, same `confirmDisabled` gate, same
           "Other" handling — because a researcher does this job on both
           record pages and two dialogs would be two vocabularies for one task.
           Only the reason list differs, because a consumer leaves the study
           for different reasons than a trainee does.

           Confirm is gated on a reason being chosen (and, for "Other", on the
           free text being filled), so the record can never say a reason was
           given when none was. */
        <ConfirmDialog
          open={withdrawOpen}
          title={
            requested
              ? `Confirm withdrawal for ${dyadTitle(dyad)}?`
              : `Withdraw ${dyadTitle(dyad)} from the study?`
          }
          body={
            requested
              ? "They asked to leave the study. Confirming records the withdrawal: their status changes to withdrawn, they lose access to Zoom session links, and their records are kept per their consent. This is reversible in the prototype only."
              : "Their status changes to withdrawn and their records are kept per their consent. They'll lose access to Zoom session links. This is reversible in the prototype only."
          }
          confirmLabel={requested ? 'Confirm withdrawal' : 'Withdraw from study'}
          cancelLabel="Keep active"
          destructive
          confirmDisabled={
            !withdrawReason || (withdrawReason === 'Other' && !withdrawDetail.trim())
          }
          onConfirm={() => {
            const trimmed = withdrawDetail.trim()
            const primary = withdrawReason === 'Other' ? trimmed : withdrawReason
            const extra = withdrawReason === 'Other' ? '' : trimmed
            setDyadOptOut(
              dyad.id,
              [primary, extra ? `Additional comments: ${extra}` : null].filter(Boolean).join('. '),
              withdrawDate,
            )
            setWithdrawOpen(false)
            studyHeadingRef.current?.focus({ preventScroll: true })
          }}
          onClose={() => setWithdrawOpen(false)}
        >
          <div className="flex flex-col gap-6 py-2">
            {/* The consumer's own words, shown before the researcher picks a
                reason rather than after — it is the thing they are deciding
                on, and asking for a reason while hiding the one already given
                invites a mismatch between the two records. */}
            {requested && dyad.withdrawalRequested?.note && (
              <p className="rounded-sm bg-pearl p-3 text-caption text-ink">
                <span className="text-caption-medium">
                  Requested on {formatDate(dyad.withdrawalRequested.date)}:
                </span>{' '}
                {dyad.withdrawalRequested.note}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="consumer-withdraw-reason" className="text-fine text-ink-faint">
                Reason for withdrawal
              </label>
              <select
                id="consumer-withdraw-reason"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                className="h-9 w-full appearance-none rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a reason…</option>
                {CONSUMER_WITHDRAWAL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="consumer-withdraw-date" className="text-fine text-ink-faint">
                Date of withdrawal
              </label>
              {/* Defaults to the request date when there is one, otherwise
                  today. A researcher actioning a request that came in three
                  days ago is recording *that* date, not the date they got
                  round to the paperwork — but it stays editable either way. */}
              <input
                id="consumer-withdraw-date"
                type="date"
                value={withdrawDate}
                onChange={(e) => setWithdrawDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="consumer-withdraw-detail" className="text-fine text-ink-faint">
                {withdrawReason === 'Other' ? 'What happened?' : 'Anything to add? (optional)'}
              </label>
              <textarea
                id="consumer-withdraw-detail"
                rows={3}
                value={withdrawDetail}
                onChange={(e) => setWithdrawDetail(e.target.value)}
                className="w-full rounded-sm border border-hairline bg-card px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Module Engagement                                                         */
/* ------------------------------------------------------------------------ */

/** Direct reuse of the Learning Progress (formerly Training Review)
 *  `engagement-tracker` + `slide-canvas` grammar (design-tokens.md §12/§16),
 *  scoped to the 6 consumer-facing
 *  modules only — no baseline/midline/endline rows, no Session recordings
 *  card (plan §2b).
 *
 *  Exported for direct reuse by the Coach Delivery Portal's per-consumer
 *  detail page (Round 6.2 — Health Data Hub tab). */
export function ModuleEngagementTab({
  dyad,
  viewerRole = 'researcher',
}: {
  dyad: ConsumerDyad
  /** The person receiving coaching is a "consumer" to a researcher and a
   *  "client" to a coach (CLAUDE.md terminology). This component renders in
   *  both portals, so it cannot hardcode either. Same `viewerRole` contract
   *  `SessionTracker` established in Round 17.2. */
  viewerRole?: 'researcher' | 'coach'
}) {
  const personNoun = viewerRole === 'coach' ? 'client' : 'consumer'
  const { sessionCompletion, sessionPlans, manualModuleUnlocks } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]
  const unlocks = manualModuleUnlocks[dyad.id] ?? []
  const ordered = CONSUMER_MODULES.map((m) => ({
    module: m,
    record: dyad.moduleEngagement.find((r) => r.moduleId === m.id),
  })).filter((r): r is { module: (typeof CONSUMER_MODULES)[number]; record: NonNullable<typeof r.record> } =>
    Boolean(r.record),
  )
  const firstNonEmpty =
    ordered.find((r) => r.record.status !== 'not-started')?.module.id ?? ordered[0]?.module.id ?? ''
  const [selectedId, setSelectedId] = useState(firstNonEmpty)
  const selected = ordered.find((r) => r.module.id === selectedId)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <div className="lg:hidden">
        <label htmlFor="module-engagement-select" className="text-fine text-ink-faint">
          Module
        </label>
        <div className="relative mt-1">
          <select
            id="module-engagement-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-9 w-full appearance-none rounded-sm border border-hairline bg-card pr-9 pl-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ordered.map((r) => {
              const locked = moduleUnlockState(moduleIndex(r.module.id), completed, unlocks) === 'locked'
              const rate =
                r.record.status === 'completed'
                  ? 100
                  : r.record.status === 'not-started'
                    ? 0
                    : Math.round(((r.record.slidesCompleted ?? 0) / r.module.slideCount) * 100)
              return (
                <option key={r.module.id} value={r.module.id}>
                  {r.module.title}: {locked ? 'Locked' : `${rate}%`}
                </option>
              )
            })}
          </select>
          <SelectChevron />
        </div>
      </div>

      <div className="hidden lg:block">
        {/* Title + subtitle live above the card as a plain heading, not
            inside a bordered/tinted header row — matching the Learning
            Progress tab's own settled "Module engagement tracker" pattern
            (`CoachProfilePage.tsx`'s `TrackerSection`/`LearningProgress`).
            No accordion grouping here: the 7 consumer-facing modules (the
            always-unlocked "Getting started" pre-module + 6 named modules)
            don't split into real curriculum tiers the way the coach's
            12-module training does, so what transfers is the header
            treatment and the selected-row style, not a forced grouping. */}
        <div className="mb-4">
          <h2 className="font-display text-title">Module engagement tracker</h2>
          <p className="mt-1 text-caption text-ink-faint">
            Review this {personNoun}'s progress through each learning module.
          </p>
        </div>
        <Card className="max-h-[70vh] gap-0 self-start overflow-y-auto rounded-lg py-0">
          <nav aria-label="Engagement tracker" className="p-3">
            <ul>
              {ordered.map((r, i) => {
                const idx = moduleIndex(r.module.id)
                const locked = moduleUnlockState(idx, completed, unlocks) === 'locked'
                const rate =
                  r.record.status === 'completed'
                    ? 100
                    : r.record.status === 'not-started'
                      ? 0
                      : Math.round(((r.record.slidesCompleted ?? 0) / r.module.slideCount) * 100)
                const active = selectedId === r.module.id
                return (
                  <li key={r.module.id}>
                    {i > 0 && <div className="my-1 h-px bg-divider-soft" />}
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.module.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex w-full min-h-11 items-center gap-2 rounded-sm px-3 py-2 text-left text-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                        active ? 'font-semibold text-primary' : 'text-ink-muted hover:bg-pearl',
                      )}
                    >
                      <span className="min-w-0 flex-1">{r.module.title}</span>
                      {locked ? (
                        <span className="flex shrink-0 items-center gap-1 text-fine text-ink-faint">
                          <Lock aria-hidden="true" className="size-3" />
                          Locked
                        </span>
                      ) : idx === 0 ? (
                        <span className="shrink-0 text-fine text-ink-faint">Always available</span>
                      ) : (
                        <span
                          className={cn(
                            'shrink-0 text-fine tabular-nums',
                            rate === 100 ? 'text-success' : 'text-ink-faint',
                          )}
                        >
                          {rate}%
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </Card>
      </div>

      {selected ? (
        (() => {
          const idx = moduleIndex(selected.module.id)
          const locked = moduleUnlockState(idx, completed, unlocks) === 'locked'
          const targetDate =
            idx >= 1 && idx <= 6 ? plan?.sessions.find((s) => s.session === idx)?.moduleTargetDate : undefined
          return (
            <div className="max-h-[70vh] min-h-[240px] space-y-4 overflow-y-auto rounded-lg bg-hairline p-4 pb-6 shadow-none md:p-6 md:pb-8">
              <SlideCard title={selected.module.title}>
                {idx === 0 && (
                  <p className="mb-2 text-fine font-semibold text-ink-faint">Always available</p>
                )}
                {locked ? (
                  <div className="flex items-start gap-2">
                    <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                    <p className="text-caption text-ink-faint">
                      {/* Session 0 leak fix: Module 1's own unlock trigger is
                          the planning session itself (idx === 1 → internal
                          session 1) — see the identical fix on
                          `SpacesCoachProfilePage.tsx`'s "Unlock module"
                          dialog for the full explanation. */}
                      Locked. Unlocks once{' '}
                      {idx === 1 ? 'the planning session is' : `Session ${displaySessionNumber(idx)} is`} marked
                      complete.
                      {targetDate && ` Target: ${formatDate(targetDate)}.`}
                      <span className="sr-only"> This module isn't available to the {personNoun} yet.</span>
                    </p>
                  </div>
                ) : selected.record.status === 'not-started' ? (
                  <p className="text-caption text-ink-faint">
                    Not yet reached. This module hasn’t been opened yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-caption font-semibold text-ink">
                      {selected.record.status === 'completed' ? 'Completed' : 'In progress'}
                      {selected.record.lastActivityDate &&
                        `, last viewed ${formatDate(selected.record.lastActivityDate)}`}
                    </p>
                    <p className="text-caption text-ink-muted">
                      {selected.record.status === 'completed'
                        ? selected.module.slideCount
                        : (selected.record.slidesCompleted ?? 0)}{' '}
                      of {selected.module.slideCount} slides viewed
                    </p>
                  </div>
                )}
              </SlideCard>
            </div>
          )
        })()
      ) : (
        <div className="rounded-lg bg-hairline p-6">
          <EmptyState icon={BookOpenCheck} copy="No module records yet" />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Learning Progress (researcher)                                            */
/* ------------------------------------------------------------------------ */

/**
 * Round 25 — the researcher's Learning Progress tab, rebuilt from Figma
 * `210:2` (KPI row `212:3986` · charts `212:4185` · timeline `212:4665` ·
 * study log `212:4840`).
 *
 * Deliberately a **new component** rather than a rebuild of
 * `ModuleEngagementTab`: that one is shared with the Coach Delivery Portal's
 * own Learning Progress tab, and this frame is a researcher view (KPIs, a
 * completion chart, a study log). Rebuilding the shared component would have
 * silently changed the coach's page too, so `ModuleEngagementTab` stays as it
 * is and keeps serving `/delivery`.
 *
 * Every figure here is derived from records that already exist — session plan
 * dates, session-completion records and module engagement. Nothing is
 * fabricated, and nothing reads a coach's notes or recordings, which
 * researchers do not have access to for coach-consumer delivery.
 *
 * ⚠️ One deliberate divergence from the frame: its "Avg. time to complete"
 * tile reads "2 hrs". There is no time-on-content field on
 * `ConsumerModuleRecord` (status, `slidesCompleted`, `lastActivityDate` only),
 * so hours cannot be computed without inventing them. This shows **days from a
 * module becoming available to being completed**, which is real. If
 * time-on-content is wanted, it needs a field before enrolment starts.
 */

/** One cycle of the arc: a module, and the catch-up session that reviews it. */
interface LearningCycle {
  /** Displayed session number, 1-6. */
  session: number
  /** Internal plan/completion key, 2-7. */
  internal: number
  moduleIndex: number
  moduleTitle: string
  moduleStatus: 'complete' | 'in-progress' | 'incomplete' | 'locked' | 'not-started'
  completedOn?: string
  sessionDate?: string
  sessionTime?: string
  sessionHeld: boolean
  rescheduled: boolean
  /** Which of the four card treatments this cycle takes. */
  tone: 'complete' | 'attention' | 'ongoing' | 'upcoming'
}

function learningCycles(
  dyad: ConsumerDyad,
  plan: SessionPlan | undefined,
  completed: SessionCompletionRecord[],
  unlocks: number[],
): LearningCycle[] {
  return CONSUMER_MODULES.slice(1).map((mod, i) => {
    const modIdx = i + 1
    const internal = modIdx + 1
    const row = plan?.sessions.find((s) => s.session === internal)
    const sessionHeld = completed.some((c) => c.session === internal)
    const rec = dyad.moduleEngagement.find((r) => r.moduleId === mod.id)
    const locked = moduleUnlockState(modIdx, completed, unlocks) === 'locked'
    const done = rec?.status === 'completed'

    // The documented rule (Round 21.1): a module only reads "in progress"
    // *before* its own catch-up. Once that session is held it is either
    // complete or incomplete — there is no third outcome.
    let moduleStatus: LearningCycle['moduleStatus']
    if (done) moduleStatus = 'complete'
    else if (locked) moduleStatus = 'locked'
    else if (sessionHeld) moduleStatus = 'incomplete'
    else if (rec && rec.status !== 'not-started') moduleStatus = 'in-progress'
    else moduleStatus = 'not-started'

    // Card treatment. Attention outranks everything: a module left incomplete
    // or a session moved is the thing a researcher is looking for, and it
    // should not be hidden behind a green card just because the session ran.
    let tone: LearningCycle['tone']
    if (moduleStatus === 'incomplete' || row?.rescheduled) tone = 'attention'
    else if (done && sessionHeld) tone = 'complete'
    else if (moduleStatus === 'in-progress') tone = 'ongoing'
    else tone = 'upcoming'

    return {
      session: modIdx,
      internal,
      moduleIndex: modIdx,
      moduleTitle: mod.title,
      moduleStatus,
      completedOn: done ? rec?.lastActivityDate : undefined,
      sessionDate: row?.date,
      sessionTime: row?.time,
      sessionHeld,
      rescheduled: !!row?.rescheduled,
      tone,
    }
  })
}

/** Per-cycle card surface + marker. Greens, reds and purples come from this
 *  app's own tokens (`success`, `destructive`, `primary`), not the frame's own
 *  hexes — direct instruction. Tints are the 8% mix the `Chip` component
 *  already uses, so a tinted card and a chip of the same meaning agree.
 *  Status labels sit on **white**, never on the card's own tint: the frame
 *  painted green-on-green and red-on-red, which is the legibility problem
 *  this fixes. */
type ToneKey = LearningCycle['tone'] | 'milestone'

/**
 * Timeline node treatments — **two resting states, plus the one the consumer is
 * actually on**.
 *
 * Direct instruction: *"further simplify timeline, too many colours, don't know
 * where to look at, where user currently are."* It had five: yellow milestone
 * cards, purple complete/ongoing cards, pink attention cards, grey upcoming
 * cards, and a matching marker colour for each — on top of the two status chips
 * inside every session card. Nine coloured objects in one row, none of which
 * said which step was live.
 *
 * So the card surface no longer carries state at all. Every node is a white
 * card with a `parchment` stroke; state is carried **only** by the status chips
 * inside it, which is where a researcher should be reading it. The marker
 * separates just two things a colour can honestly say at a glance: reached
 * (`ink-faint`) and not reached yet (`hairline`).
 *
 * The one accent left in the whole timeline is `current`, applied to the single
 * step the pairing is up to. It is the only primary-coloured thing in the row,
 * which is what makes "where are they now" answerable without reading a word.
 */
const CYCLE_TONE: Record<ToneKey | 'current', { card: string; marker: string; ring: string }> = {
  /* REACHED — a milestone that happened, or a catch-up that has been held.
     Neutral grey, the same as every other non-current node. Whether it went
     well is the chips' job, not the card's. */
  milestone: { card: 'border-parchment bg-parchment', marker: 'bg-ink-faint', ring: 'border-ink-faint' },
  complete: { card: 'border-parchment bg-parchment', marker: 'bg-ink-faint', ring: 'border-ink-faint' },
  attention: { card: 'border-parchment bg-parchment', marker: 'bg-ink-faint', ring: 'border-ink-faint' },
  ongoing: { card: 'border-parchment bg-parchment', marker: 'bg-ink-faint', ring: 'border-ink-faint' },
  /* NOT REACHED — the same neutral grey card as every reached node (direct
     instruction: "make all neutral grey except the current one"). Only the
     marker separates them: `hairline` is this app's own inactive-line token,
     present and aligned like every other node, just quiet. A white dot on a
     white page was invisible and read as a broken column. */
  upcoming: { card: 'border-parchment bg-parchment', marker: 'bg-hairline', ring: 'border-hairline' },
  /* THE STEP THEY ARE ON — the only brand colour in the timeline.
     `p-[15px]` pays for the extra border pixel: without it the 2px stroke
     pushes this card's two lanes 1px down while every neighbour sits at `p-4`
     with a 1px stroke, and the lanes stop running level. Measured — and the
     whole point of the lane grid is that the eye can run along one. */
  current: {
    card: 'border-2 border-primary bg-purple-50 p-[15px]',
    marker: 'bg-primary',
    ring: 'border-primary',
  },
}

/** A status pill inside a timeline card. White fill so it separates from the
 *  card's tint; colour is carried by the text and the 1px border. Measured on
 *  white: `success` 5.19:1, `destructive` 5.38:1, `primary` 10.58:1. */
const MODULE_STATUS_LABEL: Record<LearningCycle['moduleStatus'], string> = {
  complete: 'Complete',
  'in-progress': 'In progress',
  incomplete: 'Incomplete',
  locked: 'Locked',
  'not-started': 'Not started',
}

/** Maps onto the shared `Chip`'s own tone set — this used to be a bespoke
 *  `CycleBadge` (24px, unfilled, its own colour-per-tone) rather than the
 *  app's one designated status-chip shape, which Trainee's own Learning
 *  Progress tab (and this file's own Study log Flag column) already use.
 *  `'next'` is the same tone `SessionsPlanOverview.tsx`/`CoachProfilePage.tsx`
 *  already use for an "in progress"/"ready now" label. */
function moduleBadgeTone(s: LearningCycle['moduleStatus']): 'success' | 'destructive' | 'next' | 'muted' {
  if (s === 'complete') return 'success'
  if (s === 'incomplete') return 'destructive'
  if (s === 'in-progress') return 'next'
  return 'muted'
}

/** One event in the study log. `flag` is set **only** for the two cases the
 *  brief names — a rescheduled session and an incomplete module — so the Flag
 *  column stays scannable instead of decorating every row. */
interface LogEvent {
  date: string
  actor: 'Consumer' | 'Coach' | 'System' | 'Researcher'
  event: string
  detail: string
  flag?: 'Rescheduled' | 'Incomplete'
}

/** `Module 3 — Managing nighttime waking`, or just the title for the
 *  always-available pre-module, which has no number. Keeps every log detail in
 *  the same shape as the timeline's own "Module 3" rows. */
function logModuleLabel(idx: number, title: string): string {
  return idx === 0 ? title : `Module ${idx} — ${title}`
}

function studyLogEvents(
  dyad: ConsumerDyad,
  cycles: LearningCycle[],
  completed: SessionCompletionRecord[],
  plan: SessionPlan | undefined,
  coachName: string | undefined,
): LogEvent[] {
  const out: LogEvent[] = []

  /* Round 25, direct instruction: every `detail` reads as a **system log
     entry**, not prose. No verbs, no sentences, no explanation — an
     identifier, then ` · ` separated qualifiers. The prose version of the
     incomplete row ("... was not finished when Session 2 was held") is what
     prompted this; the `event` column already says what happened, so `detail`
     only has to say *which thing*. */
  dyad.moduleEngagement.forEach((rec) => {
    const idx = moduleIndex(rec.moduleId)
    const label = logModuleLabel(idx, CONSUMER_MODULES[idx]?.title ?? rec.moduleId)
    if (!rec.lastActivityDate) return
    if (rec.status === 'completed') {
      out.push({
        date: rec.lastActivityDate,
        actor: 'Consumer',
        event: 'Module completed',
        detail: label,
      })
    } else if (rec.status === 'in-progress') {
      out.push({
        date: rec.lastActivityDate,
        actor: 'Consumer',
        event: 'Module opened',
        detail: label,
      })
    }
  })

  cycles.forEach((c) => {
    // "Module available" (the frame draws this row too). A module unlocks when
    // the *previous* session is held, so that session's own completion date is
    // the availability date — derived, never stored. Skipped while locked,
    // because it hasn't happened yet.
    if (c.moduleStatus !== 'locked') {
      const trigger = completed.find((r) => r.session === c.internal - 1)
      const target = plan?.sessions.find((s) => s.session === c.internal)?.moduleTargetDate
      if (trigger) {
        out.push({
          date: trigger.completedDate,
          actor: 'System',
          event: 'Module available',
          detail: target
            ? `${logModuleLabel(c.moduleIndex, c.moduleTitle)} · due ${formatDate(target)}`
            : logModuleLabel(c.moduleIndex, c.moduleTitle),
        })
      }
    }
    if (c.sessionHeld) {
      const rec = completed.find((r) => r.session === c.internal)
      out.push({
        date: rec?.completedDate ?? c.sessionDate ?? '',
        actor: 'Coach',
        event: 'Session held',
        detail: `Session ${c.session} · Module ${c.moduleIndex}`,
      })
    }
    if (c.rescheduled && c.sessionDate) {
      out.push({
        date: c.sessionDate,
        actor: 'Coach',
        event: 'Session rescheduled',
        detail: `Session ${c.session} · moved to ${formatDate(c.sessionDate)}`,
        flag: 'Rescheduled',
      })
    }
    if (c.moduleStatus === 'incomplete') {
      const rec = completed.find((r) => r.session === c.internal)
      out.push({
        date: rec?.completedDate ?? c.sessionDate ?? '',
        actor: 'System',
        event: 'Module incomplete',
        detail: `${logModuleLabel(c.moduleIndex, c.moduleTitle)} · Session ${c.session} held`,
        flag: 'Incomplete',
      })
    }
  })

  if (coachName) {
    out.push({ date: '', actor: 'Researcher', event: 'Coach assigned', detail: coachName })
  }
  dyad.consentDocuments.forEach((d) => {
    out.push({
      date: d.uploadedDate,
      actor: 'System',
      event: 'Consent recorded',
      detail: d.filename,
    })
  })

  return out
    .filter((e) => e.date)
    .sort((a, b) => b.date.localeCompare(a.date))
}

type LogColKey = 'date' | 'actor' | 'event' | 'detail' | 'flag'

/** Study-log column definitions. Order and visibility are user state (the
 *  Columns panel); everything else — width, alignment, how a cell renders and
 *  how it exports — lives here, so the table, the `<colgroup>` and the CSV all
 *  read from one list and cannot drift apart. */
const LOG_COLUMNS: {
  key: LogColKey
  label: string
  width: string
  align?: 'right'
  cellClassName?: string
  cell: (e: LogEvent) => React.ReactNode
  csv: (e: LogEvent) => string
}[] = [
  {
    key: 'date',
    label: 'Date',
    width: 'w-[11%]',
    cellClassName: 'text-caption-medium whitespace-nowrap text-ink',
    cell: (e) => formatDate(e.date),
    csv: (e) => formatDate(e.date),
  },
  {
    key: 'actor',
    label: 'Who',
    width: 'w-[13%]',
    cellClassName: 'text-caption whitespace-nowrap text-ink-muted',
    cell: (e) => e.actor,
    csv: (e) => e.actor,
  },
  {
    key: 'event',
    label: 'Event',
    width: 'w-[21%]',
    // Round 25, direct instruction: `caption`, not `caption-medium` — semi-bold
    // made this column compete with Date for the row's emphasis.
    cellClassName: 'text-caption text-ink',
    cell: (e) => e.event,
    csv: (e) => e.event,
  },
  {
    key: 'detail',
    label: 'Detail',
    width: '',
    cellClassName: 'text-caption text-ink-muted',
    cell: (e) => e.detail,
    csv: (e) => e.detail,
  },
  {
    key: 'flag',
    label: 'Flag',
    width: 'w-[13%]',
    align: 'right',
    cell: (e) =>
      e.flag ? (
        <Chip tone={e.flag === 'Rescheduled' ? 'warning' : 'destructive'} label={e.flag} />
      ) : (
        <span className="sr-only">No flag</span>
      ),
    csv: (e) => e.flag ?? '',
  },
]

const LOG_PAGE = 10

/** Study-log pager control — the app's primary-outline pill, going `disabled`
 *  at the ends of the range rather than unmounting. */
const PAGER_BTN =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary px-4 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-hairline disabled:text-ink-faint disabled:hover:bg-transparent disabled:active:scale-100'

/**
 * "Module completion overview" — the overall completion rate plus every module
 * with its own state. Extracted from the consumer record page's former Study
 * Progress tab so the **Coach Management** record page can show it under its
 * Assigned Consumers tab (direct instruction); that tab is hidden here, so this
 * is the component's only caller today.
 */
export function ModuleCompletionOverviewCard({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans, manualModuleUnlocks } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]
  const unlocks = manualModuleUnlocks[dyad.id] ?? []
  const cycles = learningCycles(dyad, plan, completed, unlocks)

  const totalModules = CONSUMER_MODULES.length
  const complete = Math.min(
    dyad.moduleEngagement.filter((r) => r.status === 'completed').length,
    totalModules,
  )
  const counts = { complete }
  const completionRate = Math.round((counts.complete / totalModules) * 100)

  /* All seven modules in study order. Index 0 is the always-available
     pre-module — it has NO catch-up session of its own, so its state comes
     straight from the engagement record rather than from a cycle, and it is
     labelled by name because it has no number. */
  const moduleBreakdown = CONSUMER_MODULES.map((mod, idx) => {
    if (idx === 0) {
      const rec = dyad.moduleEngagement.find((r) => r.moduleId === mod.id)
      const status: LearningCycle['moduleStatus'] =
        rec?.status === 'completed'
          ? 'complete'
          : rec?.status === 'in-progress'
            ? 'in-progress'
            : 'not-started'
      return { id: mod.id, label: 'Getting started', status }
    }
    const cycle = cycles.find((c) => c.moduleIndex === idx)
    return {
      // Number only, no title: real module titles are long enough to truncate
      // these rows at a third of their width.
      label: `Module ${idx}`,
      id: mod.id,
      status: cycle?.moduleStatus ?? 'not-started',
    }
  })

  /* ⚠️ A module is a single video, so per-module progress is BINARY: the bar is
     full for Complete and empty otherwise, and the state word carries the
     nuance. Do NOT drive this bar from the legacy `slidesCompleted` field. */
  return (
        <Card className="gap-0 rounded-lg py-0">
          <div className="bg-purple-50 p-6">
            <h3 className="text-body-md text-ink">Consumer module completion overview</h3>
            <p className="mt-1 text-caption text-ink-muted">
              Every module, with its completion rate
            </p>
          </div>
          <div className="flex h-full flex-1 flex-col gap-4 border-t border-hairline p-6 pt-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-end justify-between gap-3">
                <p className="text-display-md text-ink">{completionRate}%</p>
                <p className="text-caption text-ink-muted">
                  {counts.complete} of {totalModules} complete
                </p>
              </div>
              <div
                /* `purple-200` — see the timeline spine below: the ramp has
                   no 100 and Tailwind v4 fills the gap from its own palette. */
                className="h-2 w-full overflow-hidden rounded-full bg-purple-200"
                role="img"
                aria-label={`${completionRate}% of modules complete`}
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <span aria-hidden="true" className="block h-px bg-hairline" />

            <dl className="flex flex-1 flex-col gap-3">
              {moduleBreakdown.map((m) => (
                /* Label, bar and percentage on one row. The label takes the
                   slack so the bars and percentages stay in their own aligned
                   columns down the list. */
                <div key={m.id} className="flex items-center gap-4">
                  <dt className="min-w-0 flex-1 truncate text-caption text-ink">{m.label}</dt>
                  <div
                    aria-hidden="true"
                    className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-parchment"
                  >
                    <div
                      className={cn(
                        'h-full rounded-full',
                        m.status === 'complete' ? 'bg-primary' : 'bg-transparent',
                      )}
                      style={{ width: m.status === 'complete' ? '100%' : '0%' }}
                    />
                  </div>
                  {/* The visible value is a percentage, and the only honest ones
                      are 100% and 0%. Colour separates a red "catch-up went
                      ahead without it" 0% from a quiet not-yet-available 0% —
                      but colour alone is not enough, so the `sr-only` text
                      spells the state out. Keep both. */}
                  <dd
                    className={cn(
                      'w-10 shrink-0 text-right text-fine tabular-nums whitespace-nowrap',
                      m.status === 'complete'
                        ? 'text-success'
                        : m.status === 'incomplete'
                          ? 'text-destructive'
                          : m.status === 'in-progress'
                            ? 'text-primary'
                            : 'text-ink-faint',
                    )}
                  >
                    <span aria-hidden="true">{m.status === 'complete' ? '100%' : '0%'}</span>
                    <span className="sr-only">
                      {m.status === 'complete'
                        ? '100% complete'
                        : `0% complete, ${MODULE_STATUS_LABEL[m.status]}`}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
  )
}

/**
 * The study-progress timeline card, extracted from the consumer record page's
 * former "Study Progress" tab so the **Coach Management** record page can show
 * it under its own Assigned Consumers tab (direct instruction). The consumer
 * record page no longer carries a Study Progress tab at all, so this is the
 * component's only caller today — extracted rather than moved so the
 * `learningCycles`/`studyLogEvents` derivations stay beside the data helpers
 * they belong to.
 *
 * It replaces `SessionsPlanOverview`'s table on that tab: same six facts per
 * session, read as a journey rather than as rows.
 */
export function StudyProgressTimelineCard({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans, manualModuleUnlocks, coaches } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]
  const unlocks = manualModuleUnlocks[dyad.id] ?? []
  const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined
  const cycles = learningCycles(dyad, plan, completed, unlocks)
  /* Round 25, direct instruction: the timeline is bookended. Reading left to
     right it is now — study start, the date the sessions were planned, the six
     catch-ups, then study end. The two openers and the closer are milestones,
     not cycles, so they render a lighter 2-row card at the same width and
     height rather than a fake session card with empty status rows. Every date
     is a real record: consent upload, the planning session (internal session 1,
     displayed as Session 0), and the last planned catch-up. */
  const consentDate = [...dyad.consentDocuments]
    .map((d) => d.uploadedDate)
    .sort()
    .at(0)
  const planningRow = plan?.sessions.find((s) => s.session === 1)
  const lastSessionDate = [...cycles].reverse().find((c) => c.sessionDate)?.sessionDate
  const allHeld = cycles.length > 0 && cycles.every((c) => c.sessionHeld)

  type TimelineNode =
    | { kind: 'cycle'; key: string; cycle: LearningCycle }
    | {
        kind: 'milestone'
        key: string
        title: string
        date?: string
        time?: string
        tone: ToneKey
        /** A bare value under the title, for a milestone that is only a date
         *  (the frame draws no label beside it). */
        lead?: string
        /** The one step the consumer hasn't reached yet — labelled "Next"
         *  above its marker, in the slot the session columns use for their
         *  date. */
        isNext?: boolean
        rows: { label: string; value: string }[]
      }

  /* Round 25, direct instruction: the timeline follows the consumer rather
     than drawing the whole arc up front. It shows everything reached **plus the
     one next step**, and stops — an onboarded consumer with no coach sees
     "Consumer onboarded" and "Coach assigned", nothing beyond it. Once the
     session plan exists the arc is fully determined, so from that point every
     session card and the study-end card are shown as before.
     The next step is a real, *incomplete* card: it takes the neutral
     `upcoming` treatment rather than the yellow milestone one, because a
     yellow "done"-looking card reading "Coach: Not assigned" would say two
     contradictory things at once. */
  const isOnboarded = !!consentDate
  const isCoachAssigned = !!coach
  const isPlanned = !!planningRow?.date

  const nodes: TimelineNode[] = [
    {
      kind: 'milestone',
      key: 'onboarded',
      title: 'Consumer onboarded',
      tone: isOnboarded ? 'milestone' : 'upcoming',
      isNext: !isOnboarded,
      rows: [
        // Earliest consent document on file. `ConsumerDyad` has no enrolment
        // date of its own, and consent is the record that proves onboarding
        // happened, so it is used rather than inventing a second field.
        { label: 'Date', value: consentDate ? formatDate(consentDate) : 'Not recorded' },
      ],
    },
    {
      kind: 'milestone',
      key: 'coach',
      title: 'Coach assigned',
      tone: isCoachAssigned ? 'milestone' : 'upcoming',
      isNext: isOnboarded && !isCoachAssigned,
      rows: [
        { label: 'Coach', value: coach?.fullName ?? 'Not assigned' },
        {
          label: 'Date',
          value: dyad.coachAssignedDate ? formatDate(dyad.coachAssignedDate) : 'Not recorded',
        },
      ],
    },
    // Only once there is a coach — otherwise this is two steps ahead.
    ...(isCoachAssigned
      ? [
          {
            kind: 'milestone' as const,
            key: 'planned',
            // Round 25, direct correction: the step after coach assignment is
            // **session planning**, so the card is named for the step rather
            // than for its consequence. It still carries the session-plan date
            // (the planning session, internal session 1 / displayed Session 0),
            // which is what "study start" was pointing at.
            title: 'Sessions planned',
            tone: (isPlanned ? 'milestone' : 'upcoming') as ToneKey,
            isNext: !isPlanned,
            rows: [
              {
                label: 'Date',
                // The planning session (internal session 1, displayed as
                // Session 0) is where the coach and consumer set the whole arc
                // up, so its date is when the plan was made. Derived, not a
                // stored field.
                value: planningRow?.date ? formatDate(planningRow.date) : 'Not planned yet',
              },
            ],
          },
        ]
      : []),
    // From the plan onwards the whole arc is known, so it is all drawn.
    ...(isPlanned
      ? [
          ...cycles.map((c) => ({ kind: 'cycle' as const, key: `c${c.session}`, cycle: c })),
          {
            kind: 'milestone' as const,
            key: 'end',
            title: 'Study end',
            tone: (allHeld ? 'milestone' : 'upcoming') as ToneKey,
            // Title + completion date, per direct instruction. A completion
            // date only exists once every catch-up has been held; until then
            // the card shows the projected end rather than a date it cannot
            // know.
            rows: [
              {
                label: allHeld ? 'Date' : 'Projected date',
                value: lastSessionDate ? formatDate(lastSessionDate) : '\u2014',
              },
            ],
          },
        ]
      : []),
  ]
  /* The one step the pairing is up to: the first catch-up not yet held, or —
     before a plan exists — the first milestone not yet reached. Exactly one
     node can be current, which is what makes it usable as the timeline's only
     accent. Derived here rather than stored, so it cannot disagree with the
     chips inside the card. */
  const currentCycleSession = cycles.find((c) => !c.sessionHeld)?.session

  /* "Go to current step" (direct instruction). The arc runs to nine nodes and
     scrolls, so the step a researcher opens this card to find is often off
     screen to the right.

     Deliberately a control, not an auto-scroll on mount: this project has
     shipped that bug twice (Rounds 18 and 19), where a mount-time
     `scrollIntoView` dragged the whole *page* to the card instead of scrolling
     inside it. For the same reason this sets `scrollLeft` arithmetically rather
     than calling `scrollIntoView` — `scrollLeft` cannot escape the scroller,
     and `scrollIntoView` demonstrably can. */
  const scrollerRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)
  const goToCurrent = () => {
    const scroller = scrollerRef.current
    const node = currentRef.current
    if (!scroller || !node) return
    scroller.scrollTo({
      left: Math.max(0, node.offsetLeft - (scroller.clientWidth - node.offsetWidth) / 2),
      behavior: 'smooth',
    })
    /* Focus follows the scroll, so a keyboard user ends up where the sighted
       user is looking rather than back at the button. The node is not
       otherwise focusable, hence `tabIndex={-1}`. */
    node.focus({ preventScroll: true })
  }

  /* EXACTLY ONE current node.
     `isNext` is a per-milestone flag and more than one milestone can carry it
     at once — an unonboarded consumer has both "Consumer onboarded" and
     "Sessions planned" pending, and both rendered "Up next" with a primary
     border. Two accents is the same as none: the reader cannot tell which step
     is actually live. The first pending node in study order is the current one;
     once a plan exists it is the first catch-up not yet held. */
  const currentKey =
    currentCycleSession !== undefined && nodes.some((n) => n.key === `c${currentCycleSession}`)
      ? `c${currentCycleSession}`
      : nodes.find((n) => n.kind === 'milestone' && n.isNext)?.key

  /* Study progress timeline (`212:4665`).
     §35a card-header band + border-t divider, matching Trainee's
     SynthesisCard — this card previously put its title in the same padded
     content div as the timeline itself. */
  return (
      <Card className="gap-0 rounded-lg py-0">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-purple-50 p-6">
          <div className="min-w-0">
          <h3 className="text-title text-ink">Study progress timeline</h3>
          <p className="mt-1 text-caption text-ink-muted">
            {/* Round 25: the timeline truncates at the next step, so it
                cannot promise "every catch-up session through to study end"
                — that line was only true for a dyad whose plan already
                exists. This wording holds in every state. */}
            Everything this consumer has reached, plus the step that comes next
          </p>
          </div>
          {/* Hidden when nothing is pending — with every catch-up held there is
              no current step to go to, and a control that scrolls nowhere is
              worse than no control. Keyed on `currentKey`, not on the cycle:
              before a plan exists the current step is a milestone. */}
          {currentKey !== undefined && (
            <button
              type="button"
              onClick={goToCurrent}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-primary px-5 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              {/* Label only, no glyph. lucide's `Crosshair` had no equivalent
                  in this project's Figma icon set, and the standing rule is
                  never to hand-draw one to fill the gap — so rather than let
                  the two surfaces diverge over decoration, the icon went. The
                  label already says exactly what the control does. */}
              Go to current step
            </button>
          )}
        </div>
        <div className="flex flex-col gap-6 border-t border-hairline p-6 pt-4">
          {/* `min-w-0` on the scroller: without it the 6-card row sizes the
              container and forces the whole page into horizontal scroll — the
              exact bug `layout-audit.js` caught on the trainee pathway. */}
          <div ref={scrollerRef} className="min-w-0 overflow-x-auto pb-2">
            {/* `min-w-full` alongside `w-max`: the row is max(content, container), so
                the spine below always runs the **full width of the card** even
                when the timeline is truncated to two cards, while a full arc
                still overflows and scrolls. */}
            <div className="relative flex w-max min-w-full gap-6 pt-1">
              {/* Spine, behind the markers. 71px = the 56px date block + half
                  the 30px marker.
                  `purple-200`, not `purple-100`: this project's brand ramp
                  skips 100, and Tailwind v4 silently fills an undefined brand
                  step from its OWN stock palette — so this line was painting a
                  lavender that appears in no Figma swatch. Round 40 documented
                  the same trap on the coach sidebar. 200 is the ramp's real
                  neighbour. */}
              <span
                aria-hidden="true"
                className="absolute top-[71px] right-0 left-0 h-0.5 rounded-full bg-purple-200"
              />
              {nodes.map((n) => {
                /* `current` outranks the node's own tone — it is the single
                   accent in the row and the answer to "where are they now". */
                const isCurrent = n.key === currentKey
                const t = CYCLE_TONE[isCurrent ? 'current' : n.kind === 'cycle' ? n.cycle.tone : n.tone];
                /* 240 -> 208 when the rows dropped to two lanes, briefly 252
                   while the chip shared the title's line, now **224** with the
                   chip stacked under the title. Measured, not guessed: the
                   binding pair is "Scheduled date" + "30 Sep 2026" at ~160px,
                   which clears 192px of content. Titles no longer compete for
                   the line, so the card does not have to be sized for the
                   widest chip. Still fixed-width, so the markers stay evenly
                   spaced along the spine. */
                return (
                  <div
                    key={n.key}
                    ref={isCurrent ? currentRef : undefined}
                    tabIndex={isCurrent ? -1 : undefined}
                    className="relative flex w-[224px] shrink-0 flex-col items-center outline-none"
                  >
                    {/* Milestones carry their date inside the card, not above
                        the marker (direct instruction). The 56px block is kept
                        empty for them so every marker still lands on the
                        spine. */}
                    <div className="flex h-14 flex-col items-center justify-start">
                      {/* Round 25, direct instruction: the next step shows
                          **"Next"** here — the slot the session columns spend
                          on their date, and otherwise empty for a milestone. */}
                      {/* The current column announces itself here, in the slot
                          every other column spends on its date. It is the only
                          place in the timeline that says where the pairing is
                          up to, so it is deliberately a word rather than a
                          colour — "Up next" is legible to someone who cannot
                          separate the primary stroke from a parchment one. */}
                      <p
                        className={cn(
                          'text-caption-medium',
                          isCurrent ? 'text-primary' : 'text-ink',
                        )}
                      >
                        {isCurrent ? 'Up next' : ''}
                      </p>
                      {/* The block keeps its 56px height whether or not it
                          speaks, so every marker still lands on the spine. */}
                      <p className="text-fine text-ink-muted">
                        {/* Empty. The date under "Up next" was removed on
                            direct instruction — the card's own "Scheduled
                            date:" row already carries it, so this was the same
                            fact twice in one column. The line is kept rather
                            than deleted so the 56px block holds its height and
                            every marker still lands on the spine. */}
                        {''}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-[30px] items-center justify-center rounded-full border-2 bg-card',
                        t.ring,
                      )}
                    >
                      <span className={cn('size-3.5 rounded-full', t.marker)} />
                    </span>
                    <span aria-hidden="true" className={cn('h-6 w-0.5', t.marker)} />
                    {/* ONE card shape for every node, and exactly TWO lanes in
                        every card (design critique, direct instruction: "very
                        simple, easy to scan").

                        Before this the row was nine independent mini-tables —
                        milestones carried one or two rows, sessions carried
                        four, and no row lined up with its neighbour, so
                        answering "which sessions are done" meant reading nine
                        separate blocks instead of running the eye along one
                        line. Fixing the lane count and giving each lane a fixed
                        28px box makes the whole timeline a real grid: both
                        lanes run unbroken across every column.

                        **The status moved into the title row** (direct
                        instruction: "its confusing to have a title then repeat
                        same copy below"). A card titled "Session 1" above a
                        lane labelled "Session" reading "Complete" said the word
                        twice; a card titled "Consumer onboarded" above a lane
                        labelled "Onboarded on" did the same. Now the title
                        carries its own state — `Session 1  [Complete]`,
                        `Consumer onboarded  [Yes]` — and the lanes below are
                        only the facts that are not already in the title.

                        A milestone with one lane pads the second with an
                        invisible spacer rather than shrinking, which is what
                        keeps the lanes aligned end to end. */}
                    <div className={cn('flex w-full flex-1 flex-col rounded-lg border p-4', t.card)}>
                      {/* Title, then a label/value list whose FIRST row is
                          "Status" (direct instruction: "add a status row, and
                          map labels on right").

                          The chip used to sit on its own line under the title,
                          left-aligned against nothing. As a row it joins the
                          same two-track grid as every other fact, so the labels
                          run down one column and the values down another — and
                          the eye can read "Status" straight across all nine
                          cards instead of hunting a floating pill.

                          Three lanes in every card, padded where a node has
                          fewer, each a fixed 28px box. That is what keeps the
                          lanes level end to end. */}
                      <p className="text-body-md text-balance text-ink">
                        {n.kind === 'milestone' ? n.title : `Session ${n.cycle.session}`}
                      </p>
                      <span aria-hidden="true" className="mt-3 mb-3 block h-px bg-ink/10" />
                      <dl className="flex flex-col gap-2.5">
                        {(() => {
                          /* Chips get a white backing: `Chip`'s fills are 8%
                             tints, and a `destructive/8` tint over this card's
                             `parchment` or `purple-50` paints a colour against
                             which `destructive` text measures under AA — the
                             same failure Round 23 found on the `purple-50`
                             table band. Over white they keep their measured
                             ratios whatever the card is tinted. */
                          const chip = (label: string, tone: Parameters<typeof Chip>[0]['tone']) => (
                            <span className="inline-flex w-fit rounded-full bg-white">
                              <Chip label={label} tone={tone} />
                            </span>
                          )
                          const plain = (v: string) => (
                            <span className="text-caption-medium text-ink">{v}</span>
                          )
                          const lanes =
                            n.kind === 'milestone'
                              ? [
                                  {
                                    label: 'Status',
                                    value: chip(
                                      n.tone === 'milestone' ? 'Yes' : 'No',
                                      n.tone === 'milestone' ? 'success' : 'muted',
                                    ),
                                  },
                                  ...n.rows.slice(0, 2).map((r) => ({
                                    label: r.label,
                                    value: plain(r.value),
                                  })),
                                ]
                              : [
                                  {
                                    label: 'Status',
                                    value: chip(
                                      n.cycle.rescheduled
                                        ? 'Rescheduled'
                                        : n.cycle.sessionHeld
                                          ? 'Complete'
                                          : 'To be held',
                                      n.cycle.rescheduled
                                        ? 'destructive'
                                        : n.cycle.sessionHeld
                                          ? 'success'
                                          : 'muted',
                                    ),
                                  },
                                  {
                                    label: 'Scheduled date',
                                    value: plain(
                                      n.cycle.sessionDate
                                        ? formatDate(n.cycle.sessionDate)
                                        : 'Not scheduled',
                                    ),
                                  },
                                  {
                                    label: `Module ${n.cycle.moduleIndex}`,
                                    value: chip(
                                      MODULE_STATUS_LABEL[n.cycle.moduleStatus],
                                      moduleBadgeTone(n.cycle.moduleStatus),
                                    ),
                                  },
                                ]
                          return (
                            <>
                              {lanes.map((r) => (
                                <div
                                  key={r.label}
                                  className="flex h-7 items-center justify-between gap-2"
                                >
                                  {/* The colon is part of the label, not a
                                      separate track: these lanes are
                                      `justify-between`, so the label hugs the
                                      left edge and a colon column would float
                                      in the middle of the gap rather than
                                      aligning to anything. */}
                                  <dt className="shrink-0 text-fine whitespace-nowrap text-ink-muted">
                                    {r.label}:
                                  </dt>
                                  <dd className="min-w-0 truncate">{r.value}</dd>
                                </div>
                              ))}
                              {/* Pads a short card to the row's three lanes.
                                  `invisible`, not omitted: the box has to exist
                                  for the lanes below it to stay level with the
                                  cards beside it. */}
                              {Array.from({ length: Math.max(0, 3 - lanes.length) }).map((_, i) => (
                                <div
                                  key={`pad-${i}`}
                                  aria-hidden="true"
                                  className="invisible flex h-7 items-center"
                                >
                                  <span className="text-fine">&nbsp;</span>
                                </div>
                              ))}
                            </>
                          )
                        })()}
                      </dl>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
  )
}

/**
 * The study log — every recorded event for one dyad, paginated, with
 * show/hide/reorder column settings and a CSV export. Extracted alongside
 * `StudyProgressTimelineCard` above and for the same reason; the two are
 * always shown together.
 */
export function StudyLogSection({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans, manualModuleUnlocks, coaches } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]
  const unlocks = manualModuleUnlocks[dyad.id] ?? []
  const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined
  const [logPage, setLogPage] = useState(0)
  const [colsOpen, setColsOpen] = useState(false)
  const newerBtnRef = useRef<HTMLButtonElement | null>(null)
  const olderBtnRef = useRef<HTMLButtonElement | null>(null)
  /** Which pager the user last activated, so the effect below knows whether to
   *  rescue focus and where to. */
  const pagedRef = useRef<'newer' | 'older' | null>(null)
  const [dragCol, setDragCol] = useState<LogColKey | null>(null)
  const [logColumns, setLogColumns] = useState(() =>
    LOG_COLUMNS.map((c) => ({ ...c, visible: true })),
  )
  const visibleLogColumns = logColumns.filter((c) => c.visible)

  const setLogColumnVisible = (key: LogColKey | null, visible: boolean) =>
    setLogColumns((cols) => {
      if (!key) return cols
      const col = cols.find((c) => c.key === key)
      if (!col || col.visible === visible) return cols
      // Never let the last column be hidden — an empty table is not a view.
      if (!visible && cols.filter((c) => c.visible).length === 1) return cols
      return cols.map((c) => (c.key === key ? { ...c, visible } : c))
    })

  const moveLogColumn = (key: LogColKey | null, to: number) =>
    setLogColumns((cols) => {
      if (!key) return cols
      const from = cols.findIndex((c) => c.key === key)
      if (from === -1 || from === to) return cols
      const next = [...cols]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })

  const cycles = learningCycles(dyad, plan, completed, unlocks)
  const events = studyLogEvents(dyad, cycles, completed, plan, coach?.fullName)
  /* Round 25, direct instruction: real pagination. `logPage` is clamped
     rather than reset, so a dyad with fewer events than the current page never
     renders an empty table. */
  const pageCount = Math.max(1, Math.ceil(events.length / LOG_PAGE))
  const page = Math.min(logPage, pageCount - 1)
  const pageStart = page * LOG_PAGE
  const shown = events.slice(pageStart, pageStart + LOG_PAGE)
  const remaining = Math.max(0, events.length - (pageStart + shown.length))

  /* Paging to either end of the range disables the very button that was just
   * pressed, and a `disabled` control cannot hold focus — the browser drops it
   * to `<body>`. This project's most-repeated defect class, and it was caught
   * here by a live `activeElement` read rather than by looking.
   *
   * It has to run in an effect, not in the click handler: inside the handler
   * the sibling is still disabled from the previous render, so focusing it
   * silently does nothing. */
  useEffect(() => {
    const pressed = pagedRef.current
    if (!pressed) return
    pagedRef.current = null
    const stillUsable = pressed === 'newer' ? page > 0 : remaining > 0
    if (stillUsable) return
    const sibling = pressed === 'newer' ? olderBtnRef.current : newerBtnRef.current
    sibling?.focus()
  }, [page, remaining])
  /* Study log (`212:4840`). */
  return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-title text-ink">Study log</h3>
            <p className="mt-1 text-caption text-ink-muted">
              Every recorded event for this dyad. Dates, actors and outcomes only.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* Round 25, direct instruction ("export button not accessible"):
                promoted from the quiet `bg-pearl` utility chrome to the app's
                primary-outline pill, the same treatment the pager below uses.
                `ink-muted` on `pearl` measured 4.83:1 — passing, but it read
                as disabled next to a real control, which is the accessibility
                problem that matters here. */}
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `${dyadTitle(dyad).toLowerCase().replace(/\s+/g, '-')}-study-log.csv`,
                  [
                    visibleLogColumns.map((c) => c.label),
                    ...events.map((e) => visibleLogColumns.map((c) => c.csv(e))),
                  ],
                )
              }
              className={PAGER_BTN}
            >
              <Download aria-hidden="true" className="size-4" />
              Export
            </button>
            {/* Column settings. Opens a panel of draggable chips — one per
                column — so a researcher can hide what they don't read and
                reorder what they do. */}
            <button
              type="button"
              onClick={() => setColsOpen((v) => !v)}
              aria-expanded={colsOpen}
              aria-label="Table columns"
              className={cn(PAGER_BTN, 'w-9 justify-center px-0')}
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        {/* Round 25, direct instruction: a **pop-up modal**, not a panel above
            the table. Built on the shared `ConfirmDialog` in its `singleAction`
            mode — the mode added in Round 6.1 for exactly this shape, a list
            whose rows each carry their own action and so has nothing for a
            Cancel/Confirm pair to confirm. Reusing it inherits the app's focus
            trap, Escape handling, footer treatment and the focus-restore fixes
            Rounds 11 and 14 made at the chassis level, none of which a local
            popover would have. */}
        <ConfirmDialog
          open={colsOpen}
          title="Table columns"
          body="Click a chip to show or hide that column. Drag a chip, or use the arrow keys, to reorder."
          singleAction
          confirmLabel="Done"
          cancelLabel="Close"
          onConfirm={() => setColsOpen(false)}
          onClose={() => setColsOpen(false)}
        >
          {/* Round 25, direct instruction: **two clear sections** — hidden
              columns on the left, the current view on the right. Native HTML5
              drag-and-drop, no library: drag a chip across to show or hide it,
              or drop it onto another chip inside "Current view" to reorder.
              Clicking does the same move, and because pointer drag is unusable
              by keyboard, a focused chip in the current view also reorders on
              ArrowLeft/ArrowRight. Every change is announced through the live
              region at the end, so none of this is mouse-only.
              `LOG_COLUMNS` stays the single ordered source — the table, the
              `<colgroup>` and the CSV all read from it, so adding a column
              later is one entry in that list and nothing else. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { id: 'available' as const, title: 'Available', hint: 'Not shown in the table' },
              { id: 'current' as const, title: 'Current view', hint: 'Shown, in this order' },
            ].map((panel) => {
              const inPanel = logColumns.filter((c) =>
                panel.id === 'current' ? c.visible : !c.visible,
              )
              return (
                <div
                  key={panel.id}
                  onDragOver={(ev) => ev.preventDefault()}
                  onDrop={() => setLogColumnVisible(dragCol, panel.id === 'current')}
                  className={cn(
                    'flex min-h-[132px] flex-col gap-3 rounded-sm border border-hairline p-3',
                    // "Current view" takes `purple-50` (direct instruction) so
                    // the panel that represents the live table is the one
                    // carrying the same tint the table's own header band does.
                    panel.id === 'current' ? 'bg-purple-50' : 'bg-parchment',
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-caption-medium text-ink">{panel.title}</p>
                    <p className="text-fine text-ink-faint">{panel.hint}</p>
                  </div>
                  {inPanel.length === 0 ? (
                    <p className="text-fine text-ink-faint">
                      {panel.id === 'current' ? 'No columns selected' : 'Every column is shown'}
                    </p>
                  ) : (
                    <ul className="flex flex-wrap content-start gap-2">
                      {inPanel.map((c, i) => (
                        <li key={c.key}>
                          <button
                            type="button"
                            draggable
                            onDragStart={() => setDragCol(c.key)}
                            onDragOver={(ev) => ev.preventDefault()}
                            onDrop={(ev) => {
                              ev.stopPropagation()
                              if (panel.id === 'current') {
                                moveLogColumn(dragCol, logColumns.indexOf(c))
                              } else {
                                setLogColumnVisible(dragCol, false)
                              }
                            }}
                            onDragEnd={() => setDragCol(null)}
                            onClick={() => setLogColumnVisible(c.key, panel.id !== 'current')}
                            onKeyDown={(ev) => {
                              if (panel.id !== 'current') return
                              const prev = inPanel[i - 1]
                              const next = inPanel[i + 1]
                              if (ev.key === 'ArrowLeft' && prev) {
                                ev.preventDefault()
                                moveLogColumn(c.key, logColumns.indexOf(prev))
                              } else if (ev.key === 'ArrowRight' && next) {
                                ev.preventDefault()
                                moveLogColumn(c.key, logColumns.indexOf(next))
                              }
                            }}
                            className={cn(
                              'inline-flex min-h-9 cursor-grab items-center gap-2 rounded-full border bg-card px-3 text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing',
                              panel.id === 'current'
                                ? 'border-primary text-primary'
                                : 'border-hairline text-ink-muted',
                              dragCol === c.key && 'opacity-50',
                            )}
                          >
                            <GripVertical aria-hidden="true" className="size-3.5" />
                            {c.label}
                            {/* No +/- glyph: the chip's own panel already says
                                whether the column is shown, so an icon that
                                implies "add"/"remove" was describing the
                                action rather than the state and read as wrong
                                (direct instruction). The grip stays — it is the
                                affordance for the drag. */}
                            <span className="sr-only">
                              {panel.id === 'current'
                                ? `shown, position ${i + 1} of ${inPanel.length}. Activate to hide.`
                                : 'hidden. Activate to show.'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            Showing {visibleLogColumns.map((c) => c.label).join(', ')}
          </p>
        </ConfirmDialog>

        <Card className="gap-0 overflow-hidden rounded-lg py-0">
          {/* Round 27: with no events the table rendered a lone header row over
              nothing, which read as a broken table rather than an empty one.
              Same icon-led empty state as "Needs attention" above and the
              coach page's "Latest updates". */}
          {events.length === 0 ? (
            <EmptyState icon={ClipboardList} copy="No recorded events yet" />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <colgroup>
                {visibleLogColumns.map((c) => (
                  <col key={c.key} className={c.width} />
                ))}
              </colgroup>
              <thead>
                {/* `purple-50` band with `ink` labels, no bottom rule — the
                    same treatment the Overview sessions table now uses, so the
                    two tables on this record read as one system. */}
                <tr className="bg-purple-50">
                  {visibleLogColumns.map((c, i) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={cn(
                        SESSION_TH,
                        i === 0 && 'px-6',
                        i === visibleLogColumns.length - 1 && 'px-6',
                        c.align === 'right' && 'text-right',
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((e, i) => (
                  <tr
                    key={`${e.date}-${e.event}-${e.detail}`}
                    className={cn(i > 0 && 'border-t border-parchment')}
                  >
                    {visibleLogColumns.map((c, ci) => (
                      <td
                        key={c.key}
                        className={cn(
                          'py-4',
                          ci === 0 || ci === visibleLogColumns.length - 1 ? 'px-6' : 'px-4',
                          c.align === 'right' && 'text-right',
                          c.cellClassName,
                        )}
                      >
                        {c.cell(e)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Card>

        {events.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-fine text-ink-faint">
            Showing {events.length === 0 ? 0 : pageStart + 1}
            {shown.length > 1 ? `\u2013${pageStart + shown.length}` : ''} of {events.length} events
          </p>
          {/* Round 25, direct instruction: pagination, not a disclosure.
              **Labels run backwards in time, because the log does.** Page 1 is
              the 10 most recent events, so paging forward shows *older* ones —
              "Previous 10", not "Next 10" — and the return control is "Newer".
              Calling it "Next" would have implied the opposite direction to the
              one the table actually moves in.
              Both controls stay mounted and go `disabled` at the ends of the
              range, so the row's geometry does not shift; both clear the 36px
              control floor, which the Round 21 audit caught a 22px pagination
              hit area failing once already. A `disabled` control cannot hold
              focus, so whichever button the click disables hands focus to its
              sibling — without that, paging to either end dropped focus to
              `<body>`, which a live `activeElement` read caught. */}
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                ref={newerBtnRef}
                onClick={() => {
                  pagedRef.current = 'newer'
                  setLogPage(page - 1)
                }}
                disabled={page === 0}
                className={PAGER_BTN}
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Newer
              </button>
              <button
                type="button"
                ref={olderBtnRef}
                onClick={() => {
                  pagedRef.current = 'older'
                  setLogPage(page + 1)
                }}
                disabled={remaining === 0}
                className={PAGER_BTN}
              >
                Previous {remaining > 0 ? Math.min(LOG_PAGE, remaining) : LOG_PAGE}
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
        </div>
        )}
      </section>
  )
}

/* ------------------------------------------------------------------------ */
/* Health Data Hub                                                           */
/* ------------------------------------------------------------------------ */

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

/**
 * The six sleep metrics the Fitbit tables report, derived from one log entry.
 *
 * Direct instruction: the tables now carry Total Sleep Time, Time in bed
 * (sleep opportunity), Sleep efficiency, Sleep latency, WASO and Early morning
 * awakening, and Sync status is gone.
 *
 * ## What is real and what is dummy
 * `HealthLogEntry` carries `durationMin` and `disturbances` and nothing else
 * that maps onto these. So:
 *
 * - **Total sleep time** is REAL — it is `durationMin`, the field the old
 *   "Duration" column already showed.
 * - **Sleep latency**, **WASO** and **early morning awakening** are DUMMY.
 *   They are derived deterministically from `disturbances` rather than
 *   randomised, so a night reading 3 wakings shows more wake time than one
 *   reading 0, the same row renders identically on every visit, and the
 *   Export matches the screen.
 * - **Time in bed** and **sleep efficiency** are then REAL BY DEFINITION —
 *   TIB = TST + latency + WASO + EMA, and efficiency = TST / TIB. Computing
 *   them rather than inventing them is what stops the three columns
 *   contradicting each other on screen, which is this project's most-repeated
 *   bug class.
 *
 * ⚠️ **To replace with the real integration:** the Fitbit Sleep API already
 * returns every one of these — `minutesAsleep` (TST), `timeInBed` (TIB),
 * `efficiency`, `minutesToFallAsleep` (latency), `minutesAwake` (WASO) — so
 * this helper should collapse to a straight field read on `HealthLogEntry`
 * once those are stored. Early morning awakening is the one Fitbit does not
 * publish directly; it is computed from the final wake epoch against the
 * scheduled rise time.
 *
 * Returns `undefined` for a night with no device reading, so every column
 * renders an em dash together rather than some cells guessing.
 */
export interface SleepMetrics {
  /** Minutes actually asleep. */
  totalSleepMin: number
  /** Minutes in bed — the sleep opportunity. */
  timeInBedMin: number
  /** TST / TIB, as a whole percentage. */
  efficiencyPct: number
  /** Minutes from lights-out to sleep onset. */
  latencyMin: number
  /** Wake after sleep onset, in minutes. */
  wasoMin: number
  /** Minutes awake before the intended rise time. */
  emaMin: number
}

export function sleepMetrics(entry: HealthLogEntry | undefined): SleepMetrics | undefined {
  if (!entry || entry.durationMin === undefined) return undefined
  const wakings = entry.disturbances ?? 0
  /* DUMMY, deterministic. See the block above for what replaces each one.
     Seeded from the DATE as well as `disturbances`, which matters: several
     seeded dyads log 0 disturbances on every night, and a derivation that
     leaned on that field alone produced an identical 6m/0m/0m row and a flat
     98% efficiency for every night of the study — a reading no real cohort
     would ever produce, and one that made the three new columns look broken.
     The date hash gives each night its own plausible spread; the waking count
     still pushes wake time up on top of it, so the two fields agree. */
  /* An FNV-1a mix per metric, salted, and seeded with the entry's OWN duration
     as well as its date. Both parts are load-bearing and both were found by
     reading the rendered table rather than the code:
       - Slicing bit ranges out of ONE weak `h * 31` hash left WASO reading an
         identical 29m on every night of the study and EMA a flat 0m — adjacent
         date strings differ by one character, so the high bits barely moved.
       - Seeding on the date alone gave the PLE and the carer the same latency
         and WASO every night, because they share the date. `durationMin`
         differs between them, so it separates the two people. */
  const mix = (salt: number) => {
    let h = salt ^ 2166136261
    for (const ch of `${entry.date}:${entry.durationMin}`) {
      h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
    }
    return h >>> 0
  }
  const latencyMin = 9 + (mix(1) % 17) + wakings * 4
  const wasoMin = 11 + (mix(2) % 29) + wakings * 8
  const emaMin = mix(3) % 4 === 0 ? 8 + (mix(4) % 17) : 0
  const totalSleepMin = entry.durationMin
  const timeInBedMin = totalSleepMin + latencyMin + wasoMin + emaMin
  return {
    totalSleepMin,
    timeInBedMin,
    efficiencyPct: Math.round((totalSleepMin / timeInBedMin) * 100),
    latencyMin,
    wasoMin,
    emaMin,
  }
}

/** "5h 55m" for the two long durations. */
function hm(min: number): string {
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

/** "12m" for the three short ones — an "0h 12m" latency reads as a duration
 *  of the same kind as time in bed, which it is not. */
function mins(min: number): string {
  return `${Math.round(min)}m`
}

/** The six column headers, in the order the brief lists them. Shared by all
 *  three Fitbit tables and the CSV so a column can never be renamed on one
 *  surface only. */
const SLEEP_METRIC_COLUMNS = [
  'Total sleep time',
  'Time in bed',
  'Sleep efficiency',
  'Sleep latency',
  'WASO',
  'Early morning awakening',
] as const

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
    <table className="w-full min-w-[960px] border-collapse text-left">
      <thead>
        {/* `purple-50`, no bottom rule — the treatment `SleepDiaryFeed`'s table
            (the other table on this same tab) already carries. */}
        <tr className="bg-purple-50">
          <th scope="col" className="px-6 py-4 text-caption-medium text-ink">Date</th>
          {SLEEP_METRIC_COLUMNS.map((c) => (
            <th key={c} scope="col" className="px-4 py-4 text-caption-medium text-ink">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {log.map((entry, i) => {
          const prev = log[i - 1]
          return (
            <tr key={entry.date} className={cn(i > 0 && 'border-t border-parchment')}>
              <td className="px-6 py-3 text-caption whitespace-nowrap text-ink">{formatDate(entry.date)}</td>
              {(() => {
                const m = sleepMetrics(entry)
                const p = sleepMetrics(prev)
                const cell = 'px-4 py-3 text-caption tabular-nums text-ink-muted'
                if (!m)
                  return SLEEP_METRIC_COLUMNS.map((c) => (
                    <td key={c} className={cell}>
                      —
                    </td>
                  ))
                return (
                  <>
                    <td className={cell}>
                      {/* Trend stays on total sleep time — it was on Duration,
                          which is the same number under its clinical name. */}
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        {hm(m.totalSleepMin)}
                        <Trend current={m.totalSleepMin} previous={p?.totalSleepMin} />
                      </span>
                    </td>
                    <td className={cell}>{hm(m.timeInBedMin)}</td>
                    <td className={cell}>{m.efficiencyPct}%</td>
                    <td className={cell}>{mins(m.latencyMin)}</td>
                    <td className={cell}>{mins(m.wasoMin)}</td>
                    <td className={cell}>{mins(m.emaMin)}</td>
                  </>
                )
              })()}
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
 *   - **Sync status is dropped entirely** — first from this table only (direct
 *     instruction: "I don't want to see not synced status"), and now from every
 *     Fitbit table, alongside the metric rewrite. It briefly rendered here as a "5 of 7 nights
 *     synced" chip. Worth recording what goes with it: the reader can no longer
 *     tell how many nights a mean rests on, so a 6h average over 2 synced
 *     nights and one over 7 now look identical. Unsynced nights are still
 *     excluded from every mean rather than counted as zero, so the figures
 *     themselves stay correct — it is only the sample size that is now
 *     invisible. ⚠️ That escape hatch is now closed too: the night-by-night
 *     log used to keep its own Sync status column, so sample size was one tab
 *     away — with the column gone from every table, sync state is no longer
 *     readable anywhere in this card. It still drives the page-level sync-gap
 *     banner and the attention list, which is where it now surfaces.
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
      /* Means of the SAME derived metrics the log table above renders, read
         through `sleepMetrics` rather than recomputed here — two surfaces
         showing one fact must read one source. */
      totalSleep: mean((e) => sleepMetrics(e)?.totalSleepMin),
      timeInBed: mean((e) => sleepMetrics(e)?.timeInBedMin),
      efficiency: mean((e) => sleepMetrics(e)?.efficiencyPct),
      latency: mean((e) => sleepMetrics(e)?.latencyMin),
      waso: mean((e) => sleepMetrics(e)?.wasoMin),
      ema: mean((e) => sleepMetrics(e)?.emaMin),
    }
  })

  if (rows.every((r) => r.considered === 0)) {
    return <p className="p-6 text-caption text-ink-faint">{emptyMessage}</p>
  }

  const pct = (v: number | undefined) => (v === undefined ? '—' : `${Math.round(v)}%`)
  return (
    <table className="w-full min-w-[960px] border-collapse text-left">
      <thead>
        <tr className="bg-purple-50">
          <th scope="col" className="px-6 py-4 text-caption-medium text-ink">Member</th>
          {SLEEP_METRIC_COLUMNS.map((c) => (
            <th key={c} scope="col" className="px-4 py-4 text-caption-medium text-ink">
              {c}
            </th>
          ))}
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
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
              {r.totalSleep === undefined ? '—' : hm(Math.round(r.totalSleep))}
            </td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
              {r.timeInBed === undefined ? '—' : hm(Math.round(r.timeInBed))}
            </td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">{pct(r.efficiency)}</td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
              {r.latency === undefined ? '—' : mins(r.latency)}
            </td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
              {r.waso === undefined ? '—' : mins(r.waso)}
            </td>
            <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
              {r.ema === undefined ? '—' : mins(r.ema)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** One log entry as plain CSV cell strings — the six sleep metrics, read
 *  through the same `sleepMetrics` helper the tables render, so the export
 *  always matches what is on screen. */
function fitbitEntryCsvRow(entry: HealthLogEntry | undefined): string[] {
  const m = sleepMetrics(entry)
  if (!m) return SLEEP_METRIC_COLUMNS.map(() => '—')
  return [
    hm(m.totalSleepMin),
    hm(m.timeInBedMin),
    `${m.efficiencyPct}%`,
    mins(m.latencyMin),
    mins(m.wasoMin),
    mins(m.emaMin),
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
    <table className="w-full min-w-[1020px] border-collapse text-left">
      <thead>
        {/* `purple-50`, no bottom rule — matches `FitbitLogTable`'s own
            header and `SleepDiaryFeed`'s table on this same tab. */}
        <tr className="bg-purple-50">
          <th scope="col" className="px-6 py-4 text-caption-medium text-ink">Date</th>
          <th scope="col" className="px-4 py-4 text-caption-medium text-ink">Member</th>
          {SLEEP_METRIC_COLUMNS.map((c) => (
            <th key={c} scope="col" className="px-4 py-4 text-caption-medium text-ink">
              {c}
            </th>
          ))}
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
              {(() => {
                const m = sleepMetrics(row.entry)
                const cell = 'px-4 py-3 align-top text-caption tabular-nums text-ink-muted'
                if (!m)
                  return SLEEP_METRIC_COLUMNS.map((c) => (
                    <td key={c} className={cell}>
                      —
                    </td>
                  ))
                return (
                  <>
                    <td className={cell}>{hm(m.totalSleepMin)}</td>
                    <td className={cell}>{hm(m.timeInBedMin)}</td>
                    <td className={cell}>{m.efficiencyPct}%</td>
                    <td className={cell}>{mins(m.latencyMin)}</td>
                    <td className={cell}>{mins(m.wasoMin)}</td>
                    <td className={cell}>{mins(m.emaMin)}</td>
                  </>
                )
              })()}
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
            ['Date', 'Member', ...SLEEP_METRIC_COLUMNS],
            ...dates.flatMap((date) => [
              [formatDate(date), 'PLE', ...fitbitEntryCsvRow(dyad.patientLog.find((e) => e.date === date))],
              [formatDate(date), 'Carer', ...fitbitEntryCsvRow(dyad.carerLog.find((e) => e.date === date))],
            ]),
          ]
        })()
      : [
          ['Date', ...SLEEP_METRIC_COLUMNS],
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

/* The 13 standard Consensus Sleep Diary questions moved to `data/spaces.ts`
 * as `SLEEP_DIARY_QUESTIONS` (Round 44) when the Consumer Portal's fill-in
 * flow became a second reader — imported above so the surfaces cannot drift. */

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

/** Fitbit sleep data + sleep diary notes for one dyad.
 *
 *  Direct instruction: exported so the **Coach Management** record page can
 *  render it as its own "Sleep & health data" sub-tab. This page no longer
 *  shows it. */
const HEALTH_VIEWS = [
  { id: 'fitbit', label: 'Fitbit sleep data' },
  { id: 'diary', label: 'Sleep diary notes' },
] as const
type HealthView = (typeof HEALTH_VIEWS)[number]['id']

export function HealthDataHubTab({ dyad }: { dyad: ConsumerDyad }) {
  /* Direct instruction: the same Fitbit / Sleep diary switch the Coach
     Delivery Portal's own client health tab already has. Same reasoning as
     there — the two are alternatives in practice (objective device data vs
     what the consumer wrote down) and both are tall tables, so stacking them
     left the diary permanently below the fold of an 18-night Fitbit log.

     The switch itself is now `components/shared/SegmentedSwitch`, extracted at
     this second caller rather than copied across. Because this component is
     rendered by BOTH the consumer record page and the Coach profile's health
     sub-tab, both researcher surfaces get the switch from one change. */
  const [view, setView] = useState<HealthView>('fitbit')

  return (
    // 40px stack, all cards vertical — same rhythm as the other tabs.
    <div className="flex flex-col gap-10">
      {/* Title left, switcher right — the heading gives the control something
          to be the control *for*, and the switch sits on its own row rather
          than in either section's header, where a third control would read as
          one more filter on the table instead of the thing choosing it. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* "overview" is load-bearing, not filler: the heading names the KPI
            + switch band, and the section directly below it carries its own
            "Fitbit sleep data" / "Sleep diary notes" title. Without it the two
            headings read as the same thing said twice. Matches the Coach
            Delivery Portal's own wording. */}
        <h2 className="min-w-0 font-display text-title text-ink">
          Sleep and health data overview
        </h2>
        <SegmentedSwitch
          options={HEALTH_VIEWS}
          active={view}
          onChange={setView}
          ariaLabel="Sleep data view"
          idPrefix="research-health-view"
          panelId="research-health-panel"
        />
      </div>

      <div
        id="research-health-panel"
        role="tabpanel"
        aria-labelledby={`research-health-view-${view}`}
        className="flex flex-col gap-10"
      >
        {view === 'fitbit' ? (
          <>
            {/* `FitbitSyncMonitor` is reused by the Consumer and Coach Delivery
                portals too, so any wrapper concern sits here rather than inside
                the shared component. */}
            <div>
              <FitbitSyncMonitor dyad={dyad} />
            </div>
            {/* Takes no props by design — the comparison is a worked example,
                identical on every consumer, and labelled as such on screen. */}
            <SleepSourceComparison />
          </>
        ) : (
          <SleepDiaryFeed dyad={dyad} />
        )}
      </div>
    </div>
  )
}

/**
 * The researcher's own note-creation form + records table for one dyad.
 *
 * Deliberately NOT the shared `SupervisionRecords` component (imported from
 * SpacesCoachProfilePage.tsx): that form is a coach's own supervision/session
 * notes, always keyed by `coachId` — a researcher writing a note about a
 * consumer who has no coach assigned yet has no such id to key it to. Rather
 * than making `SupervisionNote.coachId` optional (which every other reader
 * of that array — Supervision Hub, the trainee page's Supervision Notes tab,
 * the Coach Delivery Portal's Session Logs — would then have to account
 * for), this reads/writes the separate `researchNotes`/`addResearchNote`
 * store slice, keyed only by `dyadId`. The visual chassis (44px fields,
 * `purple-50` table header, "Attach File"/"Save note") matches
 * `SupervisionRecords`' `fullWidthStack` layout exactly, by design — same
 * form, different owner.
 */
function ResearchNotesCard({ dyadId }: { dyadId: string }) {
  const { researchNotes, addResearchNote } = useResearch()
  const notes = researchNotes
    .filter((n) => n.dyadId === dyadId)
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(TODAY)
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5))
  const [notesBody, setNotesBody] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null)

  const fieldLabel = 'text-caption-medium text-ink-faint'
  const fieldInput =
    'h-11 w-full rounded-sm border border-hairline bg-card px-4 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="space-y-6">
      <Card className="gap-0 self-start rounded-lg border border-parchment bg-card py-0 shadow-card">
        <div className="p-8">
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              if (!title.trim() || !notesBody.trim()) return
              addResearchNote(dyadId, { title, date, time, notes: notesBody, attachments })
              setTitle('')
              setNotesBody('')
              setAttachments([])
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="research-note-title" className={fieldLabel}>
                Title
              </label>
              <input
                id="research-note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={fieldInput}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="research-note-date" className={fieldLabel}>
                  Date
                </label>
                <input
                  id="research-note-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="research-note-time" className={fieldLabel}>
                  Time
                </label>
                <input
                  id="research-note-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="research-note-notes" className={fieldLabel}>
                Notes
              </label>
              <textarea
                id="research-note-notes"
                value={notesBody}
                onChange={(e) => setNotesBody(e.target.value)}
                required
                className="h-40 w-full resize-y rounded-sm border border-hairline bg-parchment p-4 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="research-note-attachments"
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-primary px-6 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-within:ring-2 focus-within:ring-ring active:scale-[0.97]"
                >
                  Attach File
                  <input
                    id="research-note-attachments"
                    type="file"
                    multiple
                    onChange={(e) =>
                      setAttachments(e.target.files ? Array.from(e.target.files).map((f) => f.name) : [])
                    }
                    className="sr-only"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-6 text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  Save note
                </button>
              </div>
              <p className="mt-6 border-t border-hairline pt-6 text-caption-medium text-ink-faint">
                {attachments.length > 0 ? attachments.join(', ') : 'No files attached'}
              </p>
            </div>
          </form>
        </div>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-body-md text-ink">Previous notes</h2>
        <Card className="gap-0 overflow-hidden rounded-lg border-0 bg-yellow-50 py-0 shadow-card">
          {notes.length === 0 ? (
            <p className="bg-card px-8 py-6 text-caption text-ink-muted">
              No notes yet. The first one you add appears here.
            </p>
          ) : (
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <colgroup>
                  <col />
                  <col className="w-[200px]" />
                  <col className="w-[120px]" />
                  <col className="w-[160px]" />
                  <col className="w-[60px]" />
                </colgroup>
                <thead>
                  <tr className="bg-purple-50">
                    <th scope="col" className="py-4 pl-8 text-caption-medium text-ink-muted">
                      Title
                    </th>
                    <th scope="col" className="py-4 text-caption-medium text-ink-muted">
                      Date
                    </th>
                    <th scope="col" className="py-4 text-caption-medium text-ink-muted">
                      Time
                    </th>
                    <th scope="col" className="py-4 text-caption-medium text-ink-muted">
                      Attachments
                    </th>
                    <th scope="col" className="py-4 pr-8">
                      <span className="sr-only">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((n) => (
                    <tr key={n.id} className="border-b border-hairline bg-card">
                      <td className="py-4 pl-8 text-caption-medium text-ink">
                        <span className="line-clamp-2" title={n.title}>
                          {n.title}
                        </span>
                      </td>
                      <td className="py-4 text-caption whitespace-nowrap text-ink">
                        {formatDate(n.date)}
                      </td>
                      <td className="py-4 text-caption whitespace-nowrap text-ink">{n.time}</td>
                      <td className="py-4 text-caption text-ink">
                        <span className="inline-flex items-center gap-1.5">
                          <Paperclip aria-hidden="true" className="size-4 text-ink-faint" />
                          {n.attachments.length}
                        </span>
                      </td>
                      <td className="py-4 pr-8 text-right">
                        <button
                          type="button"
                          onClick={() => setDownloadMsg(`${n.title} downloaded (prototype).`)}
                          aria-label={`Download ${n.title}`}
                          className="inline-flex size-9 items-center justify-center rounded-sm text-ink-faint outline-none transition-colors hover:bg-pearl hover:text-ink focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                        >
                          <Download aria-hidden="true" className="size-[18px]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {downloadMsg && (
            <p role="status" className="bg-card px-8 pb-6 text-caption font-semibold text-success">
              {downloadMsg}
            </p>
          )}
        </Card>
      </section>
    </div>
  )
}

/**
 * Notes — replaces this page's "Session Recordings" tab. The researcher's
 * own notes on this dyad, independent of coach assignment (see
 * `ResearchNotesCard`'s own comment for why this isn't the shared
 * `SupervisionRecords` component).
 */
/** Researcher notes for one dyad. **No caller today** — the Notes tab is
 *  hidden on direct instruction. Exported rather than deleted because the
 *  instruction was "hide", and `researchNotes`/`addResearchNote` are still in
 *  the store; re-enabling it is one entry in `TABS`. */
export function NotesTab({ dyad }: { dyad: ConsumerDyad }) {
  return (
    // `-mt-4`: this page's tabpanel wrapper is `gap-10` (40px, Round 25),
    // not the trainee page's `gap-14` (56px) — pulling up by the trainee
    // page's own `-mt-8` (32px) would leave only 8px here. Pulling by 16px
    // instead lands on the same 24px gap below `TabIntro` the trainee
    // page's Supervision Notes tab uses, so the two record pages read as
    // one system.
    <div className="-mt-4">
      <ResearchNotesCard dyadId={dyad.id} />
    </div>
  )
}


/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

/** Consumer detail view — drill-in from the Consumer Management Table (plan §2). */
export function ConsumerDetailPage() {
  const { dyadId } = useParams()
  const { consumerDyads, coaches, spacesCoaches } = useResearch()
  /* `?tab=Profile details` deep-links straight to that tab. Added for the Coach
     Management record page's "Go to consumer profile details" link, so the CTA
     lands where its own label says it will rather than on Overview. Lazy
     initialiser, not an effect: the tab is correct on first paint, and the
     param is a starting point — changing tabs afterwards does not rewrite the
     URL. */
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => {
    const requested = searchParams.get('tab')
    return (TABS as readonly string[]).includes(requested ?? '') ? (requested as Tab) : TABS[0]
  })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const dyad = consumerDyads.find((d) => d.id === dyadId)

  /* The hero's "Study progress" CTA only has somewhere to go when the assigned
     coach has been **onboarded** — a certified-but-waiting candidate has a
     `Coach` record and no SPACES record, so that route redirects to the roster.
     Same guard as the Assigned-coach row in Study information. */
  const coachRecordForCta =
    dyad?.coachId && spacesCoaches.some((sc) => sc.coachId === dyad.coachId)
      ? coaches.find((c) => c.id === dyad.coachId)
      : undefined

  if (!dyad) return <Navigate to="/research/consumers" replace />

  const assignedCoach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined

  const onTabKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next: number
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    setTab(TABS[next])
    tabRefs.current[next]?.focus()
  }

  return (
    <ResearchShell
      // Round 21: band surface only, keeping a name heading and tab row
      // rather than a 56px purple page title, which reads far too heavy for
      // what is a person/dyad name, not a page title. (This page's own
      // heading is `text-title`, not the trainee page's `display-lg` — a
      // two-name PLE/Carer row needs the smaller step to keep both names on
      // one line; a stale version of this comment once claimed all 3 record
      // pages shared one size, which Round 24's dedicated dual-name layout
      // no longer does.)
      /* Round 23, frame `152:176`: the record-page hero band is a global item
         from the trainee page — solid `Purple/700`, white type, yellow active
         underline, 40px top / 80px side insets. Applied here so the three
         researcher record pages stay one treatment; see `CoachProfilePage` for
         the measured derivation of `pt-10` and the tab row's `mt-[33px]`. */
      heroClassName="bg-primary px-6 pt-10 md:px-20 md:pt-10"
      /* A recorded withdrawal wins over an outstanding request: once the
         research team has actioned it the request is no longer a task, and
         showing the amber "still has access" line beside a red one would have
         the page contradict itself. `setDyadOptOut` also clears the request,
         so this is belt and braces rather than the only guard. */
      topBanner={
        dyad.optedOut ? (
          <DyadWithdrawnBanner dyad={dyad} />
        ) : dyad.withdrawalRequested ? (
          <WithdrawalRequestedBanner dyad={dyad} />
        ) : undefined
      }
      /* The band used to be closed by the tab row's own `pb-3`; with the row
         hidden (`TABS.length > 1`) the hero ended flush against its last line
         and the assigned-coach pill sat on the band's bottom edge.
         `heroNoSeam` restores the 40px bottom padding a plain hero gets — the
         same treatment `ResearchShell` already applies to every non-tabbed
         hero. Conditional, so the padding disappears again if a tab row comes
         back and closes the band itself. */
      heroNoSeam={TABS.length === 1}
      /* …and `heroFlushBelow` tightens the content inset that follows it from
         80px to 48px. The 80px default assumes a hero that ends on a heading —
         here the band already closes itself with `heroNoSeam`'s own 40px, so
         the two stacked to 120px and read as a hole between the band and the
         first card (direct instruction). 40 + 48 = 88px. */
      heroFlushBelow={TABS.length === 1}
      hero={
        <>
          <Link
            to="/research/consumers"
            // `gap-2` + `size-3` chevron: matches CoachProfilePage.tsx's back
            // link exactly, which ties this geometry to a measured Round 23
            // frame derivation — this link had drifted to `gap-1`/`size-4`.
            className="-my-3 flex w-fit items-center gap-2 rounded-sm py-3 text-caption-medium text-white outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft aria-hidden="true" className="size-3" />
            Back to Consumer Management
          </Link>

          {/* Round 23: 48px below the back link, matching the trainee page.
              Now a two-column row: identity left, the study-progress CTA
              right. */}
          <div className="mt-12 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {/* aria-label overrides the computed accessible name explicitly —
                the two stacked `block` spans read visually as separate lines,
                but their text nodes concatenate with no whitespace in the
                default accname computation ("...WhitfieldCarer:..."), which a
                screen reader would run together as one run-on word. */}
            {/* Label/name pairing, per direct feedback: PLE and Carer names
                are equal weight at `title` (21px, font-display) — both are
                the dyad's real identity, neither subordinate to the other.
                The "PLE:"/"Carer:" labels sit at `body` (17px, regular
                weight, `text-ink-faint`) rather than a smaller size of their
                own — two earlier rounds found both `fine` (12px) and
                `caption` (14px) too small to read comfortably next to a
                21px name, so the label/name distinction is carried by
                weight and colour, not size. Each line is an `items-center`
                flex row so the label's own smaller line-height doesn't pull
                it toward the top of the row next to the taller name. */}
            {/* Round 23: white on the purple band. The "PLE:"/"Carer:" labels
                move `ink-faint` -> `parchment` (9.75:1 on this band), keeping
                the same label-quieter-than-name relationship in the new
                colourway. */}
            {/* Round 24, frame `194:2555` (`Frame 107`, node `194:2595`): the two
                identity lines move from stacked to a single row, 24px apart,
                separated by a 1px full-height rule. Labels are `body-md`
                `parchment` (9.75:1 on this band), names `title` white — the
                label/name relationship is unchanged, only the axis.
                `flex-wrap` + a `hidden` rule below `sm` keeps the pair legible
                on a narrow viewport, where a 1px divider between two wrapped
                lines would sit in the wrong place. */}
            <h1
              className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-white"
              aria-label={
                dyad.patient
                  ? `PLE: ${dyad.patient.name} Carer: ${dyad.carer.name}`
                  : `Carer: ${dyad.carer.name}`
              }
            >
              {dyad.patient && (
                <>
                  <span className="flex items-center gap-2" aria-hidden="true">
                    <span className="text-body-md text-parchment">PLE:</span>
                    <span className="font-display text-title">{dyad.patient.name}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden h-7 w-px shrink-0 self-stretch bg-white/40 sm:block"
                  />
                </>
              )}
              <span className="flex items-center gap-2" aria-hidden="true">
                <span className="text-body-md text-parchment">Carer:</span>
                <span className="font-display text-title">{dyad.carer.name}</span>
              </span>
            </h1>
            {/* Round 24, `Frame 136` (node `194:3037`) — added to the header on a
                live frame update: the assigned coach, 16px below the identity
                row, as a `caption-medium` label plus a 32px pill.
                Assigned: the frame's own `purple-200` fill with `ink` text
                (12.74:1). Unassigned: no pill fill exists in the frame for that
                case, and `destructive` red is unreadable on a purple band — a
                translucent white pill carries it instead, with `parchment` text
                at 6.37:1 over the composited surface. Both computed from the
                painted values, not the authored hex. */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-caption-medium text-parchment">Assigned coach:</p>
              {assignedCoach ? (
                <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-purple-200 px-4 text-caption-medium text-ink">
                  {assignedCoach.fullName}
                </span>
              ) : (
                <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-white/15 px-4 text-caption-medium text-parchment">
                  Not assigned
                </span>
              )}
            </div>
            {/* No "what you can do here" sub copy here, unlike the trainee and
                coach record pages: this header already carries two stacked
                identity lines (PLE and Carer), and a third line under them read
                as clutter rather than orientation. Removed on direct
                instruction. */}
          </div>
            {/* Direct instruction: a "Study progress" CTA in the hero. This
                page no longer owns a study-progress view — it lives on the
                **coach** record page under Assigned Consumers — so the button
                deep-links there with this consumer already selected and the
                Study progress sub-tab open (`?tab=&dyad=&sub=`), rather than
                dropping the researcher on that coach's Overview to find the
                same consumer again.

                Without an onboarded coach there is no such view to open, so the
                control renders `aria-disabled` with an `sr-only` reason rather
                than being omitted — a control that appears and disappears
                between records is harder to trust than one that is always there
                and says why it cannot act. */}
            {coachRecordForCta ? (
              <Link
                to={`/research/spaces-coaches/${coachRecordForCta.id}?tab=${encodeURIComponent(
                  'Assigned Consumers',
                )}&dyad=${dyad.id}&sub=progress`}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-white px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-parchment focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.97]"
              >
                View study progress
              </Link>
            ) : (
              <button
                type="button"
                aria-disabled="true"
                className="inline-flex h-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-white/40 px-[18px] text-caption-medium text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                View study progress
                <span className="sr-only"> (unavailable until a coach is assigned)</span>
              </button>
            )}
          </div>

          {/* A tablist with one tab is not a tab row — it is a heading that
              looks clickable. Hidden while `TABS` is down to a single entry,
              and it comes back on its own if a tab is restored. */}
          {TABS.length > 1 && (
          <div role="tablist" aria-label="Consumer profile sections" className="mt-[33px] flex items-end gap-8 overflow-x-auto">
            {TABS.map((t, i) => {
              const active = t === tab
              return (
                <button
                  key={t}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`consumer-tabpanel-${i}`}
                  id={`consumer-tab-${i}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={cn(
                    'relative flex min-h-11 shrink-0 items-end pb-3 whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white',
                    active
                      ? 'text-caption-medium text-white'
                      : 'text-caption text-on-purple-muted hover:text-white',
                  )}
                >
                  {t}
                  {active && (
                    <motion.span
                      layoutId="consumer-detail-tab-underline"
                      className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-yellow-300"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
          )}
        </>
      }
    >
      {/* Round 25, direct instruction: the Fitbit "data not synced" banner is
          removed from this page — at the time it duplicated the one inside the
          Fitbit card's own sync monitor. Round 37 removed that one too (direct
          instruction), so no researcher-facing surface carries the banner now.
          `dyadHealthAlerts` itself stays — the Delivery Portal's notification
          hub and the Research Home hub both read it, and so does the Consumer
          Portal's own page-level banner. */}
      <div
        /* No tab row means no tab panel: `role="tabpanel"` pointing at an
           `aria-labelledby` whose target does not exist is worse than plain
           markup, because a screen reader announces a panel and then finds
           nothing naming it. Both come back with the row. */
        {...(TABS.length > 1
          ? {
              role: 'tabpanel' as const,
              id: `consumer-tabpanel-${TABS.indexOf(tab)}`,
              'aria-labelledby': `consumer-tab-${TABS.indexOf(tab)}`,
            }
          : {})}
        // Round 25, direct instruction: 40px between the components of every
        // tab on this record page. The trainee record page's own tabpanel
        // wrapper was still 56px when this was written, so the "matching"
        // claim didn't hold — CoachProfilePage.tsx was brought down to 40px
        // to actually match, rather than raising this one back to 56px.
        /* `mt-16` exists to separate this panel from the hero's own tab row.
           With the row hidden it double-counts against the shell's content
           inset — measured 128px from the band to the first heading, where the
           convention is 48 + `TabIntro`'s own 16. Dropped to 0 in that case. */
        className={cn('flex flex-col gap-10', TABS.length > 1 && 'mt-16')}
      >
        <TabIntro {...TAB_INTRO[tab]} />
        {tab === 'Profile details' && <ProfileDetailsSections dyad={dyad} />}
      </div>

    </ResearchShell>
  )
}
