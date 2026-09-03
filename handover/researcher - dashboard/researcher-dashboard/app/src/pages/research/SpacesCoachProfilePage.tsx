/**
 * SPACES coach record page — the drill-in behind Coach Management.
 *
 * Route: `/research/spaces-coaches/:coachId` (`App.tsx`). Reached from
 * `SpacesRosterPage`. Four tabs: Overview, Assigned Consumers, Supervision
 * Logs, Profile details.
 *
 * ⚠️ THIS FILE ALSO DEFINES COMPONENTS OTHER PAGES IMPORT. It is not just a
 * page. Before changing anything exported here, check the other call site:
 *
 *   - `SupervisionRecords` — the note-creation form + records table. Imported
 *     by `CoachProfilePage.tsx` for the **trainee** record page's Supervision
 *     Notes tab. One form, two pages, two files. A layout change here changes
 *     that page too, and the failure mode is a spacing regression that no
 *     typecheck will catch.
 *   - `ConsumerDetailsCard` — exported, and currently rendered by nothing.
 *     Its former call site (the consumer record page's Overview) was rebuilt.
 *     Delete it or find it a home; do not assume it is live.
 *   - `annotationStatusLabel`, `inputClass` — exported, no external importer.
 *     Every other file that needs an `inputClass` declares its own copy.
 *
 * There is also a **circular import** with `CoachProfilePage.tsx`: this file
 * imports `RecordRowDivider` from it, and it imports `SupervisionRecords` from
 * this one. It resolves today because both are function declarations used only
 * at render time, but it is a real cycle — if either file ever needs a value at
 * module-evaluation time from the other, break it by moving the shared piece
 * into `components/` first.
 *
 * Which coach this page shows: a coach only appears here once they have a
 * `SpacesCoach` row (i.e. they have been onboarded into SPACES delivery). A
 * certified coach with no such row redirects back to the roster. Note the seed
 * data contains a dyad assigned to a coach who has no `SpacesCoach` row, so
 * that caseload is invisible in this portal until she is onboarded.
 *
 * Everything on this page reads the **store** copies (`coaches`,
 * `consumerDyads`, `sessionCompletion`, `sessionPlans`), never the seed arrays
 * — `dyad.sessionsCompleted` and `dyad.sessionPlan` go stale after boot.
 */
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpenCheck,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Download,
  NotebookPen,
  Paperclip,
  Search,
  Users,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/SearchInput'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { SlideOverPanel } from '@/components/research/SlideOverPanel'
/* The study-progress timeline, the study log, the module completion overview
   and the Fitbit/sleep-diary pair all live here now — the consumer record page
   no longer shows any of them. Imported from that page rather than copied: two
   renderings of one fact is the failure mode this dashboard keeps hitting. */
import {
  ContactDetailsCard,
  HealthDataHubTab,
  ModuleCompletionOverviewCard,
  StudyLogSection,
  StudyProgressTimelineCard,
} from '@/pages/research/ConsumerDetailPage'
import { Chip, CertificationChip, CoachStatusChip } from '@/components/research/StatusChip'
import { RecordRowDivider } from '@/pages/research/CoachProfilePage'
import { Card } from '@/components/ui/card'
import { TabIntro } from '@/components/research/TabIntro'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { type Coach, type NotificationPreferences } from '@/data/research'
import {
  CONSUMER_MODULES,
  SPACES_CATCHUP_COUNT,
  catchupSessionsCompleted,
  displaySessionNumber,
  isPlanSet,
  latestAnnotationState,
  nextUpcomingSessionEntry,
  type AnnotationShareState,
  type ConsumerDyad,
  type PersonProfile,
} from '@/data/spaces'
import { useResearch } from '@/data/research-context'
import { formatDate, formatTime, TODAY } from '@/data/format'

/* Tab order drives both the visible row and keyboard Home/End. There is
   deliberately no coach-wide "shared annotations" tab: a coach's reflections
   are written per consumer, so that content lives inside Assigned Consumers,
   scoped to whichever consumer that tab's picker has selected. A coach-wide tab
   would need a second picker driving the same selection. */
const TABS = ['Overview', 'Assigned Consumers', 'Supervision Logs', 'Profile details'] as const
type Tab = (typeof TABS)[number]

/** Per-tab title + sub copy, rendered through the shared `TabIntro`. All 15 tab
 *  panels across the three record pages carry a title *and* a subtitle — keep
 *  both when adding a tab, or this one reads as unfinished beside the rest. */
const TAB_INTRO: Record<Tab, { title: string; subtitle: string }> = {
  Overview: {
    title: 'Coach overview details',
    subtitle: 'Get a quick sense of this coach\u2019s caseload and how delivery is going',
  },
  'Assigned Consumers': {
    title: 'Study progress for this pairing',
    subtitle: 'How this consumer and coach are moving through the study together',
  },
  'Supervision Logs': {
    title: 'Supervision logs',
    subtitle: 'Write and save supervision notes for this coach',
  },
  'Profile details': {
    title: 'Profile details',
    subtitle: 'Contact information and participation record for this coach',
  },
}

export const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'
const selectClass =
  'h-9 w-full appearance-none rounded-sm border border-hairline bg-card pr-9 pl-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

function dyadTitle(dyad: ConsumerDyad): string {
  return dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name
}

function SelectChevron() {
  return (
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
    />
  )
}

function unassignedDyadLabel(dyad: ConsumerDyad): string {
  return dyad.patient
    ? `PLE: ${dyad.patient.name} · Carer: ${dyad.carer.name}`
    : `Carer: ${dyad.carer.name} (carer only)`
}

/**
 * "Assign consumer" — picks an already-enrolled, still-unassigned dyad and puts
 * it on this coach's caseload.
 *
 * This dialog deliberately does not create a consumer. Enrolment happens on the
 * Consumer Management side; the only candidates offered here are dyads with no
 * `coachId`. It commits through `transferDyad`, which is coachId-agnostic and
 * so serves both a first assignment and a later move.
 *
 * Two-step select-then-confirm, the same shape `OnboardCoachDialog` uses. The
 * `confirmDisabled` guard on step one matters: with an empty candidate pool the
 * Continue button would otherwise stay enabled and do nothing.
 */
function AssignConsumerDialog({
  open,
  onClose,
  coachId,
}: {
  open: boolean
  onClose: () => void
  coachId: string
}) {
  const { coaches, consumerDyads, transferDyad } = useResearch()
  const coach = coaches.find((c) => c.id === coachId)
  const unassignedDyads = consumerDyads.filter((d) => !d.coachId)

  const [selectedId, setSelectedId] = useState(unassignedDyads[0]?.id ?? '')
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedId(unassignedDyads[0]?.id ?? '')
      setConfirming(false)
    }
    // only re-seed the selection when the dialog opens, not on every roster change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!confirmation) return
    const timer = window.setTimeout(() => setConfirmation(null), 4000)
    return () => window.clearTimeout(timer)
  }, [confirmation])

  const selected = unassignedDyads.find((d) => d.id === selectedId)

  return (
    <>
      <ConfirmDialog
        open={open && !confirming}
        title="Assign consumer"
        body="Choose a consumer who's enrolled but not yet assigned to a coach."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        confirmDisabled={unassignedDyads.length === 0}
        onConfirm={() => {
          if (selectedId) setConfirming(true)
        }}
        onClose={onClose}
      >
        {unassignedDyads.length === 0 ? (
          <p className="text-caption text-ink-faint">No consumers are waiting to be assigned.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="assign-consumer-select" className="text-fine text-ink-faint">
              Consumer
            </label>
            <div className="relative">
              <select
                id="assign-consumer-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className={selectClass}
              >
                {unassignedDyads.map((d) => (
                  <option key={d.id} value={d.id}>
                    {unassignedDyadLabel(d)}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={open && confirming}
        title={`Assign ${selected ? dyadTitle(selected) : ''} to ${coach?.fullName ?? ''}?`}
        body={`${selected ? dyadTitle(selected) : 'This consumer'} moves onto ${coach?.fullName ?? ''}'s SPACES caseload.`}
        confirmLabel="Assign consumer"
        cancelLabel="Go back"
        onConfirm={() => {
          if (!selected || !coach) return
          transferDyad(selected.id, coach.id)
          onClose()
          setConfirmation(`${dyadTitle(selected)} has been assigned to ${coach.fullName}.`)
        }}
        onClose={() => setConfirming(false)}
      />

      {confirmation && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-[60] mx-auto w-fit max-w-[90vw] rounded-full bg-ink px-5 py-3 text-caption font-semibold text-white shadow-card"
        >
          {confirmation}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------------ */
/* Overview                                                                  */
/* ------------------------------------------------------------------------ */

/** Caseload split on the Overview table. Both halves derive from
 *  `catchupSessionsCompleted` vs `SPACES_CATCHUP_COUNT` — the same derivation
 *  the "Sessions completed" column and the "Study completed" KPI use, so a
 *  consumer reading "6 of 6" in the table can never appear under Ongoing. */
const CASELOAD_TABS = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'complete', label: 'Study complete' },
] as const
type CaseloadTab = (typeof CASELOAD_TABS)[number]['id']

/**
 * Overview — the tab a researcher lands on. A read-only identity card, a KPI
 * row, and the coach's whole caseload as a table.
 *
 * The one action here is the row click / chevron, which switches to Assigned
 * Consumers with that dyad selected. "Assign consumer" and "Transfer consumer"
 * live in the page hero instead, so they are reachable from any tab.
 */
function OverviewTab({
  coach,
  onViewDyad,
}: {
  coach: Coach
  onViewDyad: (dyadId: string) => void
}) {
  const { consumerDyads, sessionCompletion, sessionPlans, spacesCoaches } = useResearch()
  const [query, setQuery] = useState('')
  const [caseloadTab, setCaseloadTab] = useState<CaseloadTab>('ongoing')
  // Ordered least-to-most progressed (0 sessions → all sessions done).
  const dyads = consumerDyads
    .filter((d) => d.coachId === coach.id)
    .sort((a, b) => (sessionCompletion[a.id] ?? []).length - (sessionCompletion[b.id] ?? []).length)

  const withdrawn = coach.status === 'withdrawn'
  const firstName = coach.fullName.split(' ')[0]

  /* All four KPI values are derived, never seeded. Keep it that way: a KPI that
     counts one field while the column beneath it renders another is this
     codebase's most-repeated defect, and it has shipped more than once. */
  const coachSince = spacesCoaches.find((sc) => sc.coachId === coach.id)?.joinedDate
  const sessionsDone = dyads.reduce(
    (n, d) => n + catchupSessionsCompleted(sessionCompletion[d.id] ?? []),
    0,
  )
  const sessionsTotal = dyads.length * SPACES_CATCHUP_COUNT
  const studyComplete = dyads.filter(
    (d) => catchupSessionsCompleted(sessionCompletion[d.id] ?? []) >= SPACES_CATCHUP_COUNT,
  ).length

  const ongoingDyads = dyads.filter(
    (d) => catchupSessionsCompleted(sessionCompletion[d.id] ?? []) < SPACES_CATCHUP_COUNT,
  )
  const completeDyads = dyads.filter(
    (d) => catchupSessionsCompleted(sessionCompletion[d.id] ?? []) >= SPACES_CATCHUP_COUNT,
  )
  const tabDyads = caseloadTab === 'ongoing' ? ongoingDyads : completeDyads

  /* Search filters on every name a row actually shows, so a query that
     visibly matches a row can never hide it. Applied after the tab filter, so
     a query only ever narrows the tab you are looking at. */
  const q = query.trim().toLowerCase()
  const visibleDyads = q
    ? tabDyads.filter((d) =>
        [d.patient?.name, d.carer.name].filter(Boolean).some((n) => n!.toLowerCase().includes(q)),
      )
    : tabDyads

  return (
    <div className="flex flex-col gap-10">
      {/* Intro copy left, Coach Details card right. The card is a fixed
          568.5px and does not flex; the intro takes the remainder. Same row
          structure as the trainee record page's Overview — change both or
          neither. Stacks below `lg`. */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <TabIntro {...TAB_INTRO.Overview} />
        </div>
        <section className="flex flex-col lg:w-[568.5px] lg:shrink-0">
          {/* Coach Details card. The vertical `yellow-100` -> white gradient is
              why the detail rows below carry no panel of their own: the card's
              own lower half is already white. */}
          <Card className="gap-0 rounded-lg border border-parchment bg-gradient-to-b from-yellow-100 to-white py-0 shadow-card">
            <div className="flex flex-col gap-6 p-6">
              <div className="flex items-start gap-6">
                {/* ⚠️ DEMO ASSET — MUST NOT SHIP WITH REAL DATA. One committed
                    stock photo is the portrait for EVERY coach here and every
                    trainee on `CoachProfilePage.tsx`. There is no image field
                    on `Coach` to hold a real headshot. Add one, or remove the
                    portrait, before real participants are loaded: one
                    stranger's face on every participant record is not
                    defensible in a research product. */}
                <span
                  aria-hidden="true"
                  className="block size-[104px] shrink-0 overflow-hidden rounded-full"
                >
                  <img
                    src="/avatars/participant-placeholder.svg"
                    alt=""
                    width={104}
                    height={104}
                    className="size-full object-cover"
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-center gap-3 px-2">
                    <p className="min-w-0 flex-1 truncate text-title text-ink">{coach.fullName}</p>
                    {withdrawn && <CoachStatusChip status={coach.status} />}
                  </div>
                  {/* Three grid tracks — 110px label / 24px colon / value — so
                      the colons align in their own column instead of trailing
                      each label at a ragged edge. The colon is its own span
                      outside both `dt` and `dd`, and `aria-hidden`, so it never
                      becomes part of either accessible name. */}
                  <dl className="flex flex-col gap-2 p-2">
                    {[
                      { label: 'Coach ID', value: coach.participantId },
                      { label: 'Email', value: coach.email },
                      { label: 'Phone', value: coach.phone },
                    ].map((f) => (
                      <div
                        key={f.label}
                        className="grid grid-cols-[110px_24px_1fr] items-center text-ink"
                      >
                        <dt className="text-caption-medium text-ink">{f.label}</dt>
                        <span aria-hidden="true" className="text-body-md text-ink">
                          :
                        </span>
                        <dd className="min-w-0 truncate text-caption text-ink">{f.value}</dd>
                      </div>
                    ))}
                    {/* UNWIRED — needs a backend. There is no certificate
                        artifact anywhere in the data model, so this cannot
                        download anything. `CertificationRecord` does carry
                        `certificateGenerated` / `certificateDate` fields that
                        nothing reads or writes; those are the intended hooks
                        for a certificate generation/storage service.
                        Per the app-wide rule, an unwired control ships as a
                        focusable `aria-disabled` button with an `sr-only`
                        "(coming soon)" cue — never a silently dead link, and
                        never omitted. */}
                    <div className="grid grid-cols-[110px_24px_1fr] items-center text-ink">
                      <dt className="text-caption-medium text-ink">Certification</dt>
                      <span aria-hidden="true" className="text-body-md text-ink">
                        :
                      </span>
                      <dd className="min-w-0">
                        <button
                          type="button"
                          aria-disabled="true"
                          className="inline-flex min-h-9 items-center rounded-sm text-caption-medium text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Download
                          <span className="sr-only"> (coming soon)</span>
                        </button>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* KPI row — the shared `StatCard`, not a fork. Icons come from
          `lucide-react`, which is the only icon source in this app; never
          hand-write an SVG or paste a Figma export. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Coach since"
          value={coachSince ? formatDate(coachSince) : 'Not onboarded'}
          icon={CalendarDays}
        />
        <StatCard label="Consumers assigned" value={dyads.length} icon={Users} />
        <StatCard
          label="Sessions completed"
          value={`${sessionsDone} of ${sessionsTotal}`}
          icon={CalendarCheck}
        />
        <StatCard label="Study completed" value={studyComplete} icon={CircleCheckBig} />
      </div>

      <Card
        className="gap-6 rounded-lg border border-parchment p-6 shadow-card"
      >
        {/* This card's header is plain white; the `purple-50` tint sits on the
            table's own `<thead>` below instead. Deliberate divergence from the
            app-wide card-header band rule: the tinted `<thead>` *is* the
            boundary, so a second tinted band above it reads as two headers
            stacked. Stage Management on the trainee page does the same. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-title text-ink">Assigned consumers</h2>
            <p className="mt-1.5 text-body text-ink">
              Select consumers to track their study progress
            </p>
          </div>
          <SearchInput
            id="coach-caseload-search"
            label="Search consumers"
            value={query}
            onChange={setQuery}
            placeholder="Search consumers"
            widthClassName="sm:w-[340px]"
          />
        </div>

        {withdrawn && dyads.length > 0 && (
          <p className="rounded-sm bg-pearl px-4 py-3 text-caption text-ink-muted">
            {firstName} is no longer participating in the study. Transfer their remaining
            consumers to another coach below.
          </p>
        )}

        <UnderlineTabs
          tabs={CASELOAD_TABS}
          active={caseloadTab}
          onChange={setCaseloadTab}
          ariaLabel="Assigned consumers by study status"
          layoutId="coach-caseload-tabs"
          idPrefix="coach-caseload-tab"
          panelId="coach-caseload-panel"
        />

        <div
          role="tabpanel"
          id="coach-caseload-panel"
          aria-labelledby={`coach-caseload-tab-${caseloadTab}`}
        >
          {dyads.length === 0 ? (
            <div className="rounded-lg border border-parchment">
              <EmptyState icon={Users} copy="No consumers assigned yet" />
            </div>
          ) : visibleDyads.length === 0 ? (
            /* Three genuinely different empty states, and they must stay
               distinct: "no consumers assigned at all", "this tab is legitimately
               empty", and "your search matched nothing" are different facts, and
               one shared message would be false in two of the three cases. */
            <div className="rounded-lg border border-parchment">
              <EmptyState
                icon={q ? Search : CircleCheckBig}
                copy={
                  q
                    ? `No consumers match “${query.trim()}”`
                    : caseloadTab === 'ongoing'
                      ? 'Every assigned consumer has finished'
                      : 'No consumers have finished yet'
                }
              />
            </div>
          ) : (
          /* The table sits in its own bordered, rounded container inside the
             card. `overflow-hidden` is load-bearing: it is what clips the
             tinted `<thead>` to the rounded corners. `shadow-none` is explicit
             rather than merely omitted — a card shadow nested inside a card
             that already has one reads as a second floating surface. */
          <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-parchment shadow-none">
            {/* Grow this `min-w` whenever you add a column. Below it the table
                scrolls; without growing it, a new cell silently squeezes a
                neighbour into a text wrap at narrow widths. */}
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr className="bg-purple-50">
                  <th scope="col" className="px-6 py-4 text-caption-medium text-ink">
                    Consumer Details
                  </th>
                  {/* This table and Consumer Management's roster must show the
                      same fields, in the same order, for the same dyad. Both
                      read `isPlanSet(sessionPlans[id])` with the same Chip
                      tones — one fact off one field. If you add a column to one
                      table, add it to the other. */}
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Session Plan
                  </th>
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Sessions Completed
                  </th>
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Upcoming Session
                  </th>
                  {/* Read off the same single `nextUpcomingSessionEntry()` call
                      as "Upcoming Session" beside it, so the number and the date
                      can never describe two different sessions. */}
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Session Date
                  </th>
                  {/* "Annotation summary", never "Annotation" or "report" — the
                      summary is the artifact; annotating is the act. */}
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Annotation summary
                  </th>
                  {/* Action column: a chevron with an `sr-only` header, matching
                      the Consumer and Trainee rosters. */}
                  <th scope="col" className="relative px-4 py-4">
                    <span className="sr-only">View consumer</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleDyads.map((d, i) => (
                  /* The whole row is the click target. The chevron keeps its
                     own handler (with `stopPropagation`, so one click fires
                     once) because it is the ONLY keyboard route into a
                     consumer: unlike the other rosters, this table's names are
                     plain text, not `<Link>`s. Removing the chevron button
                     would make the row mouse-only. */
                  <tr
                    key={d.id}
                    onClick={() => onViewDyad(d.id)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-pearl',
                      i > 0 && 'border-t border-parchment',
                    )}
                  >
                    <td className="px-6 py-3">
                    <div className="flex flex-col gap-0.5 text-caption">
                      {d.patient && (
                        <span className="text-ink">
                          <span className="text-ink-faint">PLE:</span> {d.patient.name}
                        </span>
                      )}
                      <span className="text-ink">
                        <span className="text-ink-faint">Carer:</span> {d.carer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-caption text-ink-muted">
                    {isPlanSet(sessionPlans[d.id]) ? (
                      <Chip tone="success" label="Created" />
                    ) : (
                      <Chip tone="muted" label="Not yet" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
                    {catchupSessionsCompleted(sessionCompletion[d.id] ?? [])} of {SPACES_CATCHUP_COUNT}
                  </td>
                  {/* Session numbering trap. Internal session keys run 1-7 and
                      key 1 is the unnumbered "Planning" session; the UI number
                      is always `displaySessionNumber(n) = n - 1`. Resolve
                      "which session is next" through `nextUpcomingSessionEntry`
                      — it prefers the plan, falls back to the legacy
                      `d.upcomingSession` field, and never returns the planning
                      session, which would otherwise print as "Session 0".
                      Reading the legacy field directly is how this column once
                      came to contradict the Assigned Consumers tab. */}
                  {(() => {
                    const next = nextUpcomingSessionEntry(
                      sessionPlans[d.id],
                      sessionCompletion[d.id] ?? [],
                      d.upcomingSession,
                    )
                    return (
                      <>
                        <td className="px-4 py-3 text-caption text-ink-muted">
                          {next ? (
                            `Session ${displaySessionNumber(next.session)}`
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-caption whitespace-nowrap text-ink-muted">
                          {next?.date ? (
                            formatDate(next.date)
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                      </>
                    )
                  })()}
                  <td className="px-4 py-3">
                    <Chip
                      tone={latestAnnotationState(d) === 'shared' ? 'success' : 'muted'}
                      label={annotationStatusLabel[latestAnnotationState(d)]}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* Do not downgrade this to a decorative icon. It looks
                        like the bare chevrons on the other rosters, but there
                        the row's name is a `<Link>`; here it is plain text, so
                        this button is the row's only keyboard entry point. */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDyad(d.id)
                      }}
                      aria-label={`View ${dyadTitle(d)}`}
                      className="inline-flex size-9 items-center justify-center rounded-sm text-ink-faint outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Profile details                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Notification preferences for a coach, on this page's `purple-50` header-card
 * vocabulary.
 *
 * Deliberately a local sibling of `ConsumerDetailPage.tsx`'s
 * `DyadNotificationPreferencesCard` rather than the shared
 * `components/account/NotificationPreferencesCard.tsx`: that shared one uses
 * the plain `bg-card-header` band and is depended on by the account pages.
 * Restyling it there would have changed those pages too. If you unify the
 * three, unify them together.
 *
 * Writes `coach.notificationPreferences` via `updateCoachNotificationPreferences`.
 */
function CoachNotificationPreferencesCard({
  coach,
  onSave,
}: {
  coach: Coach
  onSave: (prefs: NotificationPreferences) => void
}) {
  const preferences = coach.notificationPreferences ?? { email: true, sms: false }
  const [email, setEmail] = useState(preferences.email)
  const [sms, setSms] = useState(preferences.sms)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEmail(preferences.email)
    setSms(preferences.sms)
  }, [preferences.email, preferences.sms])

  const dirty = email !== preferences.email || sms !== preferences.sms

  const checkboxClass =
    'peer size-7 shrink-0 cursor-pointer appearance-none rounded-[6px] border border-hairline bg-card outline-none transition-colors checked:border-purple-500 checked:bg-purple-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <Card className="gap-0 overflow-hidden rounded-lg py-0">
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

/**
 * Profile details — the full coach record. Four stacked `purple-50`-header
 * cards separated by `RecordRowDivider` rows: Study details (participation
 * facts + Withdraw coach), Personal details (the one editable card),
 * Professional details, Notification preferences. The trainee and consumer
 * record pages use the same card vocabulary; keep the three in step.
 *
 * Two rules encoded here:
 *  - Only email and phone are editable. Employer, role and years in aged care
 *    are recruitment facts, not profile fields.
 *  - **Withdraw is blocked while the coach still has consumers assigned.** A
 *    withdrawn coach with a live caseload would strand those consumers, so the
 *    button disables and the card explains what to transfer first.
 */
function ProfileDetailsTab({ coach }: { coach: Coach }) {
  const { consumerDyads, updateContact, updateCoachNotificationPreferences, withdrawCoach } =
    useResearch()
  const dyads = consumerDyads.filter((d) => d.coachId === coach.id)

  const [editingContact, setEditingContact] = useState(false)
  const [email, setEmail] = useState(coach.email)
  const [phone, setPhone] = useState(coach.phone)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  // DO NOT REMOVE. The "Edit details" trigger unmounts the instant
  // `editingContact` flips, and the Save/Cancel buttons unmount when it flips
  // back — either way focus falls to `<body>` unless it is moved deliberately.
  // This is the single most-repeated defect in this codebase; assume any
  // control that unmounts on click has it until you have checked
  // `document.activeElement` live.
  const emailInputRef = useRef<HTMLInputElement>(null)
  const editContactButtonRef = useRef<HTMLButtonElement>(null)
  const contactMounted = useRef(false)
  useEffect(() => {
    // Skip the mount run — only the edit/cancel *transition* should move
    // focus, never the tab's own first render.
    if (!contactMounted.current) {
      contactMounted.current = true
      return
    }
    if (editingContact) emailInputRef.current?.focus()
    else editContactButtonRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingContact])

  const withdrawn = coach.status === 'withdrawn'
  const firstName = coach.fullName.split(' ')[0]

  // Mirrors the trainee record page's "Study information" card. A certified
  // coach has no COACH stage left to report, so Certification occupies the slot
  // that page gives to "Current stage".
  const studyFields: { label: string; node: React.ReactNode }[] = [
    { label: 'Coach ID', node: coach.participantId },
    { label: 'Enrolment date', node: formatDate(coach.enrolmentDate) },
    {
      label: 'Certification',
      node: (
        <span className="flex flex-wrap items-center gap-2">
          <CertificationChip outcome={coach.certification.outcome} />
          {coach.certification.assessedDate && (
            <span className="text-caption text-ink-faint">
              Assessed {formatDate(coach.certification.assessedDate)}
            </span>
          )}
        </span>
      ),
    },
  ]

  const personalFields = [
    { label: 'Full name', value: coach.fullName },
    { label: 'Email', value: coach.email, breakAll: true },
    { label: 'Phone', value: coach.phone },
  ]

  const professionalFields = [
    { label: 'Partner org', value: coach.employer },
    { label: 'Role at employer', value: coach.roleAtEmployer },
    { label: 'Years in aged care', value: `${coach.yearsInAgedCare} years` },
  ]

  // `bg-card` is required, not decorative: the pill sits on the `purple-50`
  // header band, and a translucent `destructive/8` fill composites against that
  // band to roughly rgb(241,220,236), where `destructive` measures 4.15:1 and
  // fails AA. On the opaque white fill it is 5.38:1. Same call as the trainee
  // and consumer record pages' withdraw buttons.
  // The disabled variant is unique to this page — only a SPACES coach can be
  // blocked from withdrawing by a live caseload.
  const withdrawButtonClass = cn(
    'inline-flex h-9 shrink-0 items-center rounded-sm border bg-card px-4 text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
    dyads.length > 0
      ? 'cursor-not-allowed border-hairline text-ink-faint'
      : 'border-destructive text-destructive hover:bg-destructive/8',
  )

  return (
    <div className="flex flex-col gap-10">
      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Study details</h2>
          {withdrawn ? (
            <CoachStatusChip status={coach.status} />
          ) : (
            <button
              type="button"
              disabled={dyads.length > 0}
              onClick={() => setWithdrawOpen(true)}
              className={withdrawButtonClass}
            >
              Withdraw coach
            </button>
          )}
        </div>
        <dl className="flex flex-col py-4">
          {studyFields.map((f, i) => (
            <Fragment key={f.label}>
              {i > 0 && <RecordRowDivider />}
              <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
                <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">{f.label}</dt>
                <dd className="text-caption text-ink">{f.node}</dd>
              </div>
            </Fragment>
          ))}
        </dl>
        {withdrawn ? (
          <p className="px-6 pb-4 text-caption text-ink-faint">
            {firstName} is no longer participating in the study
            {coach.withdrawalNote ? `. ${coach.withdrawalNote}` : '.'}
          </p>
        ) : (
          dyads.length > 0 && (
            <p className="px-6 pb-4 text-fine text-ink-faint">
              Can't withdraw {firstName} yet. Transfer{' '}
              {dyads.length === 1 ? 'the 1 consumer' : `all ${dyads.length} consumers`} on their
              caseload to another coach first.
            </p>
          )
        )}
      </Card>

      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Personal details</h2>
          {!editingContact && (
            <button
              ref={editContactButtonRef}
              type="button"
              onClick={() => setEditingContact(true)}
              className="inline-flex h-9 shrink-0 items-center rounded-sm bg-card px-4 text-caption-medium text-primary outline-none transition-colors hover:bg-parchment focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Edit details
            </button>
          )}
        </div>

        {editingContact ? (
          <form
            className="flex flex-col gap-4 p-6"
            onSubmit={(e) => {
              e.preventDefault()
              updateContact(coach.id, { email, phone })
              setEditingContact(false)
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="spaces-contact-email" className="text-caption-medium text-ink-faint">
                Email
              </label>
              <input
                ref={emailInputRef}
                id="spaces-contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="spaces-contact-phone" className="text-caption-medium text-ink-faint">
                Phone
              </label>
              <input
                id="spaces-contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
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
                  setEmail(coach.email)
                  setPhone(coach.phone)
                  setEditingContact(false)
                }}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary px-6 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="flex flex-col py-4">
            {personalFields.map((f, i) => (
              <Fragment key={f.label}>
                {i > 0 && <RecordRowDivider />}
                <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
                  <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">{f.label}</dt>
                  <dd className={cn('min-w-0 text-caption text-ink', f.breakAll && 'break-all')}>
                    {f.value}
                  </dd>
                </div>
              </Fragment>
            ))}
          </dl>
        )}
      </Card>

      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <div className="flex min-h-16 items-center bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Professional details</h2>
        </div>
        <dl className="flex flex-col py-4">
          {professionalFields.map((f, i) => (
            <Fragment key={f.label}>
              {i > 0 && <RecordRowDivider />}
              <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
                <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">{f.label}</dt>
                <dd className="text-caption text-ink">{f.value}</dd>
              </div>
            </Fragment>
          ))}
        </dl>
      </Card>

      <CoachNotificationPreferencesCard
        coach={coach}
        onSave={(prefs) => updateCoachNotificationPreferences(coach.id, prefs)}
      />

      <ConfirmDialog
        open={withdrawOpen}
        title={`Withdraw ${coach.fullName} as a coach?`}
        body="Their SPACES status changes to no longer participating and their records are kept per their consent."
        confirmLabel="Withdraw coach"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          withdrawCoach(coach.id)
          setWithdrawOpen(false)
        }}
        onClose={() => setWithdrawOpen(false)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Consumers Registry                                                        */
/* ------------------------------------------------------------------------ */

/**
 * ⚠️ EXPORTED BUT UNRENDERED. Nothing in this package mounts
 * `ConsumerDetailsCard`. Its former call site — the consumer record page's
 * Overview tab — was rebuilt and no longer uses it. Treat it as a candidate for
 * deletion, not as live UI, and do not assume changes here are visible anywhere.
 *
 * What it was for: one consumer's identity (read-only — identity is owned by
 * the research coordinator on the Consumer Management side, via
 * `PersonRecordCard` in `ConsumerDetailPage.tsx`) plus one merged, editable
 * Notes block.
 *
 * The Notes field has a real data trap in it. It **writes to `dyad.coachNotes`,
 * never to `dyad.notes`.** `dyad.notes` is a separate legacy field that other
 * surfaces render verbatim; an earlier version saved this merged blob into it
 * and corrupted those surfaces on the first edit. `seedNotes()` only falls back
 * to the structured fields (background / sleep goals / caregiving context /
 * notes) when no coach note has been saved yet — otherwise every save would
 * re-concatenate and duplicate them.
 */
export function ConsumerDetailsCard({ dyad }: { dyad: ConsumerDyad }) {
  const { updateDyadCoachNotes } = useResearch()
  const [editingNotes, setEditingNotes] = useState(false)

  // Seed from the structured fields ONLY when no coach note exists yet. See
  // the component doc above: once `coachNotes` is set it is the sole source
  // here, or every save re-concatenates the same text.
  const seedNotes = () =>
    dyad.coachNotes ||
    [
      dyad.patient?.background,
      dyad.carer.background,
      dyad.sleepGoals,
      dyad.caregivingContext,
      dyad.notes,
    ]
      .filter(Boolean)
      .join('\n\n')

  const [notesText, setNotesText] = useState(seedNotes)

  useEffect(() => {
    setEditingNotes(false)
    setNotesText(seedNotes())
    // re-seed only when a different dyad is selected, not on every store update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dyad.id])

  const identity = (person: PersonProfile) => {
    const rows = [
      { label: 'Name', value: person.name },
      { label: 'Email', value: person.email || '—', breakAll: true },
      { label: 'Phone', value: person.phone || '—' },
    ]
    return (
      <dl className="mt-1.5">
        {rows.map((f, i) => (
          <div key={f.label}>
            {i > 0 && <Separator className="bg-divider-soft" />}
            <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[100px_1fr]">
              <dt className="text-caption text-ink-faint">{f.label}</dt>
              <dd className={cn('text-caption text-ink', f.breakAll && 'break-all')}>{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-lg py-0">
      <div className="bg-purple-50 p-6">
        <h2 className="font-display text-title text-ink">Consumer details</h2>
      </div>

      <div className="border-t border-hairline p-6 pt-4">
        <div className={cn('grid grid-cols-1 items-start gap-6', dyad.patient && 'sm:grid-cols-2')}>
          {dyad.patient && (
            <div>
              <p className="text-caption font-semibold text-ink-muted">PLE</p>
              {identity(dyad.patient)}
            </div>
          )}
          <div>
            <p className="text-caption font-semibold text-ink-muted">Carer</p>
            {identity(dyad.carer)}
          </div>
        </div>

        <Separator className="my-5 bg-hairline" />

        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="consumer-details-notes"
            className="text-caption font-semibold text-ink-muted"
          >
            Notes
          </label>
          {!editingNotes && (
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              className="inline-flex h-9 items-center rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Edit details
            </button>
          )}
        </div>

        {editingNotes ? (
          <form
            className="mt-2 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              updateDyadCoachNotes(dyad.id, notesText)
              setEditingNotes(false)
            }}
          >
            <textarea
              id="consumer-details-notes"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={6}
              className="w-full rounded-sm border border-hairline bg-pearl px-3 py-2 text-caption leading-[1.6] text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotesText(seedNotes())
                  setEditingNotes(false)
                }}
                className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-2 space-y-3 rounded-sm border border-hairline bg-pearl p-4 text-caption leading-[1.6] text-ink">
            {notesText
              .split('\n\n')
              .filter(Boolean)
              .map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          </div>
        )}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------------ */
/* Assigned Consumers — study progress for one pairing (frame `306:155`)      */
/* ------------------------------------------------------------------------ */

/** Whole days between two ISO dates. Duplicated here because the only other
 *  copy is unexported inside `ResearchNotificationHub`. If a third caller
 *  appears, lift it into `data/format.ts` rather than making a third copy. */
function daysBetweenDates(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** Five KPI tiles for one coach-consumer pairing. Every value is derived from
 *  the record; nothing is seeded. An absent value renders an em dash rather
 *  than a wordy placeholder, matching every table on the three record pages.
 *  Note "Days in study" measures from `coachAssignedDate` to `TODAY`, which is
 *  the frozen demo clock in `data/format.ts`, not the real date. */
function StudyProgressKpis({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const held = catchupSessionsCompleted(completed)
  const modulesDone = dyad.moduleEngagement.filter((m) => m.status === 'completed').length
  const next = nextUpcomingSessionEntry(sessionPlans[dyad.id], completed, dyad.upcomingSession)
  const daysIn = dyad.coachAssignedDate ? daysBetweenDates(dyad.coachAssignedDate, TODAY) : undefined

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Days in study"
        value={daysIn !== undefined ? `${daysIn} days` : '\u2014'}
        icon={CalendarDays}
      />
      <StatCard
        label="Modules completed"
        value={`${modulesDone} of ${CONSUMER_MODULES.length}`}
        icon={BookOpenCheck}
      />
      <StatCard label="Sessions held" value={`${held} of ${SPACES_CATCHUP_COUNT}`} icon={CalendarCheck} />
      <StatCard
        label="Next session"
        value={next?.date ? formatDate(next.date) : '\u2014'}
        icon={CalendarClock}
      />
      {/* A reflection that isn't due yet is an absent value, not a status worth
          naming, so this tile substitutes an em dash for `annotationStatusLabel`'s
          "Not yet". The label map itself is left alone — it is shared. */}
      <StatCard
        label="Session reflection"
        value={
          latestAnnotationState(dyad) === 'not-yet'
            ? '\u2014'
            : annotationStatusLabel[latestAnnotationState(dyad)]
        }
        icon={NotebookPen}
      />
    </div>
  )
}

/** Modules / Sessions / Sleep data coming in — three labelled groups of
 *  label-value rows for one pairing. Everything is derived from the store's
 *  live session-completion and plan slices plus the dyad's own engagement and
 *  health logs. */
function ModulesAndSessionsCard({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]

  const moduleNumber = (moduleId: string) =>
    CONSUMER_MODULES.findIndex((m) => m.id === moduleId) + 1
  /** "Module 2, 3" — the word once, then bare numbers. Repeating "Module" per
   *  entry made a three-module row long enough to wrap the value column. */
  const names = (ids: string[]) => {
    if (ids.length === 0) return 'None'
    const numbers = ids.map(moduleNumber).sort((a, b) => a - b)
    return `Module ${numbers.join(', ')}`
  }

  const doneCount = dyad.moduleEngagement.filter((m) => m.status === 'completed').length
  const inProgress = dyad.moduleEngagement.filter((m) => m.status === 'in-progress').map((m) => m.moduleId)
  /* "Left incomplete" is derived, not stored — `ConsumerModuleRecordStatus`
     only has not-started / in-progress / completed. A module counts as left
     behind once its own catch-up session has been held without it being
     finished. `SessionsPlanOverview` and the consumer record page's timeline
     apply the identical rule; if you change it, change it in all three or they
     will disagree on screen about the same module. */
  const leftIncomplete = dyad.moduleEngagement
    .filter((m) => {
      const n = moduleNumber(m.moduleId)
      const sessionHeld = completed.some((c) => displaySessionNumber(c.session) === n)
      return sessionHeld && m.status !== 'completed'
    })
    .map((m) => m.moduleId)

  const held = catchupSessionsCompleted(completed)
  const rescheduled = (plan?.sessions ?? []).filter((s) => s.rescheduled)
  const durations = dyad.sessionRecordings.map((r) => r.durationMin).filter((n) => n > 0)
  const avgLength =
    durations.length > 0
      ? `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} min`
      : 'No recordings'

  const nights = (log: { synced: boolean; diaryEntry?: string }[]) => log.length
  const diary = (log: { diaryEntry?: string }[]) => log.filter((e) => !!e.diaryEntry).length
  const synced = (log: { synced: boolean }[]) => log.filter((e) => e.synced).length
  const totalNights = Math.max(nights(dyad.patientLog), nights(dyad.carerLog))
  const pleName = dyad.patient?.name.split(' ')[0]
  const carerName = dyad.carer.name.split(' ')[0]

  function Group({ title, rows, last }: { title: string; rows: ReactNode; last?: boolean }) {
    return (
      <div className={cn('flex flex-col gap-4', !last && 'border-b border-hairline pb-4')}>
        <p className="text-caption-medium text-ink-muted">{title}</p>
        <dl className="flex flex-col gap-2">{rows}</dl>
      </div>
    )
  }
  function Row({ label, value, split }: { label: string; value: string; split?: string }) {
    return (
      <div className="flex items-center gap-3">
        <dt className="min-w-0 flex-1 text-caption text-ink-muted">{label}</dt>
        {split && <span className="shrink-0 text-fine text-purple-500">{split}</span>}
        <dd className="shrink-0 text-caption-medium text-ink tabular-nums">{value}</dd>
      </div>
    )
  }

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="bg-purple-50 p-6">
        <h3 className="text-body-md text-ink">Modules and sessions</h3>
        <p className="mt-1 text-caption text-ink-muted">
          How this pairing is moving through the study
        </p>
      </div>
      <div className="flex flex-col gap-4 border-t border-hairline p-6">
        <Group
          title="Modules"
          rows={
            <>
              <Row label="Completed" value={`${doneCount} of ${CONSUMER_MODULES.length} modules`} />
              <Row label="Left incomplete" value={names(leftIncomplete)} />
              <Row label="In progress" value={names(inProgress)} />
            </>
          }
        />
        <Group
          title="Sessions"
          rows={
            <>
              <Row label="Held" value={`${held} of ${SPACES_CATCHUP_COUNT} sessions`} />
              <Row
                label="Rescheduled"
                value={
                  rescheduled.length === 0
                    ? '0'
                    : `${rescheduled.length} · ${rescheduled
                        .map((s) => `Session ${displaySessionNumber(s.session)}`)
                        .join(', ')}`
                }
              />
              {/* The frame's second row here read "Re-scheduled 0" beside
                  "Rescheduled 2". Confirmed as a duplicate, not a cancellation
                  row: there is exactly one reschedule figure, and no
                  cancellation state exists in the data model at all. Dropped
                  rather than rendering a hardcoded 0 for a concept the study
                  does not record. */}
              <Row label="Average length" value={avgLength} />
            </>
          }
        />
        <Group
          title="Sleep data coming in"
          last
          rows={
            <>
              <Row
                label="Sleep diary"
                value={`${diary(dyad.patientLog) + diary(dyad.carerLog) > 0 ? Math.max(diary(dyad.patientLog), diary(dyad.carerLog)) : 0} of ${totalNights} nights`}
                split={
                  dyad.patient
                    ? `${pleName} ${diary(dyad.patientLog)} · ${carerName} ${diary(dyad.carerLog)}`
                    : `${carerName} ${diary(dyad.carerLog)}`
                }
              />
              <Row
                label="Fitbit sync"
                value={`${Math.max(synced(dyad.patientLog), synced(dyad.carerLog))} of ${totalNights} nights`}
                split={
                  dyad.patient
                    ? `${pleName} ${synced(dyad.patientLog)} · ${carerName} ${synced(dyad.carerLog)}`
                    : `${carerName} ${synced(dyad.carerLog)}`
                }
              />
            </>
          }
        />
      </div>
    </Card>
  )
}

/**
 * "Latest updates" — the things about this pairing that need a human to act.
 *
 * Shares its shape with `ConsumerDetailPage.tsx`'s "Needs attention" card
 * (`Card` + `purple-50` header + hairline divider + `destructive`-dot list);
 * the two are meant to read as one pattern.
 *
 * Two rules, and both are easy to break by adding "one more useful row":
 *
 * 1. **Attention only, never a log.** Routine facts — a module finished on
 *    time, a session held as planned, a reflection shared — belong in the
 *    sessions table below. Add them here and this card becomes a worse second
 *    copy of that table.
 * 2. **Log style, not prose.** An identifier plus ` · ` qualifiers, never a
 *    sentence: "Session 2 · held 5 Aug · Module 2 not completed", not "Session 2
 *    was held while Module 2 was still incomplete."
 *
 * Every item is derived, nothing seeded, so an empty card genuinely means
 * nothing needs attention.
 */
function LatestUpdatesCard({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]
  const items: { date?: string; text: string }[] = []

  const moduleNumber = (moduleId: string) =>
    CONSUMER_MODULES.findIndex((m) => m.id === moduleId) + 1

  // Session plan never created.
  if (!isPlanSet(plan)) items.push({ text: 'Session plan · not created' })

  // A catch-up held without its module finished — a protocol departure.
  dyad.moduleEngagement.forEach((m) => {
    const n = moduleNumber(m.moduleId)
    const rec = completed.find((c) => displaySessionNumber(c.session) === n)
    if (rec && m.status !== 'completed') {
      items.push({
        date: rec.completedDate,
        text: `Session ${n} · held ${formatDate(rec.completedDate)} · Module ${n} not completed`,
      })
    }
  })

  // Rescheduled sessions.
  ;(plan?.sessions ?? [])
    .filter((s) => s.rescheduled)
    .forEach((s) => {
      items.push({
        date: s.date,
        text: `Session ${displaySessionNumber(s.session)} · rescheduled${
          s.date ? ` · now ${formatDate(s.date)}` : ''
        }`,
      })
    })

  // Device data gaps, per person — the split matters, since a carer not
  // syncing is a different finding from the PLE not syncing.
  ;[
    { label: dyad.patient?.name.split(' ')[0], log: dyad.patientLog },
    { label: dyad.carer.name.split(' ')[0], log: dyad.carerLog },
  ].forEach(({ label, log }) => {
    if (!label || log.length === 0) return
    const unsynced = log.filter((e) => !e.synced).length
    if (unsynced >= 3) {
      items.push({ text: `Fitbit sync · ${label} · ${unsynced} of ${log.length} nights missing` })
    }
  })

  // Reflection outstanding once Session 1 has been held.
  const session1 = completed.find((c) => c.session === 1)
  if (session1 && latestAnnotationState(dyad) !== 'shared') {
    items.push({
      date: session1.completedDate,
      text: `Annotation summary · not shared · Session 1 held ${formatDate(session1.completedDate)}`,
    })
  }

  // Newest first; undated items lead, since "not created" has no date and is
  // the most current state of all.
  const sorted = [...items].sort((a, b) => (b.date ?? '9999').localeCompare(a.date ?? '9999'))

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="flex items-start justify-between gap-4 bg-purple-50 p-6">
        <div className="min-w-0">
          <h3 className="text-body-md text-ink">Latest updates</h3>
          <p className="mt-1 text-caption text-ink-muted">Items that need your attention</p>
        </div>
        {sorted.length > 0 && (
          <span className="shrink-0 rounded-md bg-purple-500 px-2.5 py-1 text-fine text-white">
            {sorted.length} new
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4 border-t border-hairline p-6 pt-4">
        {sorted.length === 0 ? (
          /* Keep `EmptyState` copy to one short line. It is a resting state,
             not an error and not a CTA — a two-clause sentence here reads as
             unfinished body text. */
          <EmptyState icon={CircleCheckBig} copy="Nothing needs attention" />
        ) : (
          <ul className="flex flex-col gap-4 py-2">
            {sorted.map((a) => (
              <li key={a.text} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive"
                />
                <p className="min-w-0 flex-1 text-caption text-ink">{a.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

/**
 * Assigned Consumers — everything about ONE coach-consumer pairing: KPIs,
 * modules/sessions, attention items, the read-only session plan, and the
 * coach's shared reflection.
 *
 * Which consumer is a page-level concern, not this component's: the picker is a
 * sticky `purple-50` band the page renders through `ResearchShell`'s
 * `heroBelow` slot, so the selection survives scrolling and is shared with the
 * Overview tab's row-click. This tab only receives the resolved id.
 *
 * "Assign consumer" / "Transfer consumer" live in the page hero, not here, so
 * they are reachable from every tab. Do not add a second copy.
 */
/* One intro per sub-tab: the tab-level copy ("Study progress for this pairing")
   stopped being true the moment the panel could also show Fitbit and diary
   data, and one line describing both would describe neither.
   Only the `progress` entry is rendered — the other two sub-tabs show no intro
   at all, because their own first card already carries a title saying the same
   words. */
const CONSUMER_SUBTAB_INTRO = {
  progress: {
    title: 'Study progress for this pairing',
    subtitle: 'How this consumer and coach are moving through the study together',
  },
  health: {
    title: 'Consumer sleep and health data',
    subtitle: 'Fitbit sync status and sleep diary entries for both members of this dyad',
  },
  reflection: {
    title: "Coach's reflection",
    subtitle: 'What this coach has reflected on after their sessions with this consumer',
  },
} as const

const CONSUMER_SUBTABS = [
  { id: 'progress', label: 'Study progress' },
  { id: 'health', label: 'Consumer sleep & health data' },
  /* The coach's own reflection sits last and on its own: it is the one thing on
     this panel authored by the coach rather than derived from the consumer's
     record, so it read oddly as the tail of a column of derived cards. */
  { id: 'reflection', label: "Coach's reflection" },
] as const
type ConsumerSubtab = (typeof CONSUMER_SUBTABS)[number]['id']

function ConsumersDetailsTab({
  coach,
  selectedId,
  subtab,
}: {
  coach: Coach
  selectedId: string
  /** Owned by the page, not here: the sub-tab row sits ABOVE the tab-level
   *  `TabIntro`, and that block is rendered by the page. */
  subtab: ConsumerSubtab
}) {
  const { consumerDyads } = useResearch()
  const dyads = consumerDyads.filter((d) => d.coachId === coach.id)
  const selected = dyads.find((d) => d.id === selectedId) ?? dyads[0]

  if (dyads.length === 0) {
    return (
      <Card className="gap-0 rounded-lg py-0">
        <EmptyState icon={Users} copy="No consumers assigned yet" />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <div
        role="tabpanel"
        id="spaces-consumer-subpanel"
        aria-labelledby={`spaces-consumer-subtab-${subtab}`}
        className="flex flex-col gap-10"
      >
      {subtab === 'health' ? (
        /* Fitbit sleep data + sleep diary notes, imported wholesale from the
           consumer record page rather than reassembled here. */
        selected && <HealthDataHubTab dyad={selected} />
      ) : subtab === 'reflection' ? (
        /* `key` forces a remount when the picker changes, so no per-consumer
           state can survive a swap and be attributed to the wrong person. */
        selected && (
          <ConsumerReflectionCard key={`refl-${selected.id}`} coach={coach} dyad={selected} />
        )
      ) : (
      <div className="flex flex-col gap-10">
      {selected && <StudyProgressKpis dyad={selected} />}

      {/* The timeline REPLACES `SessionsPlanOverview`'s table here — same facts
          per session, read as a journey. That component is untouched and still
          serves `DyadSection`.

          ⚠️ `minmax(0, …)` on both tracks is load-bearing. An `fr` track's
          automatic minimum is `auto`, so the timeline's horizontally-scrolling
          card row grows its own track past its share and pushes the sibling
          down to whatever is left — measured 80/20 instead of the intended
          60/40, and `min-w-0` on the CHILD does not fix it, because the
          overflow is in the track. The two cards are height-matched: the row
          stretches (no `items-start`) and `LatestUpdatesCard` carries `h-full`,
          so the shorter card grows rather than leaving a ragged bottom edge. */}
      {selected && (
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
          <div className="min-w-0">
            <StudyProgressTimelineCard dyad={selected} />
          </div>
          <div className="min-w-0">
            <LatestUpdatesCard dyad={selected} />
          </div>
        </div>
      )}

      {/* `items-start`: each card sizes to its own content instead of both
          stretching to the taller one. Do not add a fixed height here. */}
      {selected && (
        <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-2">
          <ModulesAndSessionsCard dyad={selected} />
          <ModuleCompletionOverviewCard dyad={selected} />
        </div>
      )}

      {selected && <StudyLogSection key={`log-${selected.id}`} dyad={selected} />}
      </div>
      )}
      </div>
    </div>
  )
}

/**
 * "Transfer consumer" — moves the currently-selected dyad to another coach.
 *
 * Self-contained dialog + toast, mounted by the page so it works from any tab.
 * Operates on the page's `effectiveDyadId`, i.e. whatever the Assigned
 * Consumers picker has selected.
 *
 * Transfer targets are restricted to coaches with a `SpacesCoach` row whose
 * `joinedStatus` is `'joined'` and who have not withdrawn — a consumer must
 * never land on a coach who is not actually delivering.
 */
function TransferConsumerDialog({
  open,
  onClose,
  coach,
  dyad,
}: {
  open: boolean
  onClose: () => void
  coach: Coach
  dyad: ConsumerDyad | undefined
}) {
  const { coaches, spacesCoaches, transferDyad } = useResearch()
  const [confirming, setConfirming] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const transferTargets = spacesCoaches
    .filter((sc) => sc.coachId !== coach.id && sc.joinedStatus === 'joined')
    .map((sc) => coaches.find((c) => c.id === sc.coachId))
    .filter((c): c is Coach => !!c && c.status !== 'withdrawn')
  const transferTarget = transferTargets.find((c) => c.id === targetId)

  useEffect(() => {
    if (open) {
      setTargetId(transferTargets[0]?.id ?? '')
      setConfirming(false)
    }
    // only re-seed the selection when the dialog opens, not on every roster change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!confirmation) return
    const timer = window.setTimeout(() => setConfirmation(null), 4000)
    return () => window.clearTimeout(timer)
  }, [confirmation])

  return (
    <>
      <ConfirmDialog
        open={open && !confirming}
        title="Transfer consumer"
        body="Choose the coach who will take over this consumer's SPACES delivery."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        confirmDisabled={!dyad || transferTargets.length === 0}
        onConfirm={() => {
          if (targetId) setConfirming(true)
        }}
        onClose={onClose}
      >
        {!dyad ? (
          <p className="text-caption text-ink-faint">No consumer is selected to transfer.</p>
        ) : transferTargets.length === 0 ? (
          <p className="text-caption text-ink-faint">
            No other joined coach is available to transfer to right now.
          </p>
        ) : (
          <div className="space-y-4">
            <dl>
              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <dt className="text-caption text-ink-faint">Current coach</dt>
                <dd className="text-caption text-ink">{coach.fullName}</dd>
              </div>
              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <dt className="text-caption text-ink-faint">Consumer</dt>
                <dd className="text-caption text-ink">{dyadTitle(dyad)}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-1">
              <label htmlFor="transfer-target-coach" className="text-fine text-ink-faint">
                Transfer to
              </label>
              <div className="relative">
                <select
                  id="transfer-target-coach"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className={selectClass}
                >
                  {transferTargets.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={open && confirming}
        title={`Transfer to ${transferTarget?.fullName ?? ''}?`}
        body={`${dyad ? dyadTitle(dyad) : 'This consumer'} moves from ${coach.fullName} to ${transferTarget?.fullName ?? ''}. Session history, health data, and reflections stay with the consumer.`}
        confirmLabel="Transfer consumer"
        cancelLabel="Go back"
        onConfirm={() => {
          if (!transferTarget || !dyad) return
          transferDyad(dyad.id, transferTarget.id)
          onClose()
          setConfirmation(`${dyadTitle(dyad)} transferred to ${transferTarget.fullName}.`)
        }}
        onClose={() => setConfirming(false)}
      />

      {confirmation && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-[60] mx-auto w-fit max-w-[90vw] rounded-full bg-ink px-5 py-3 text-caption font-semibold text-white shadow-card"
        >
          {confirmation}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------------ */
/* Supervision Hub                                                           */
/* ------------------------------------------------------------------------ */

/** Display labels for `AnnotationShareState`. Exported, but nothing outside
 *  this file imports it in this package. */
export const annotationStatusLabel: Record<AnnotationShareState, string> = {
  shared: 'Shared',
  'not-shared': 'Not shared',
  'not-yet': 'Not yet',
}

/**
 * The coach's post-practice annotation summary for one consumer, as the
 * researcher sees it.
 *
 * Data-model facts worth knowing before changing this:
 *  - A coach can have **at most one** annotation summary per consumer. The
 *    field is an array (`dyad.annotationSummaries`) but the store's
 *    `submitPostPracticeAnnotation` replaces rather than appends. The `.map`
 *    below is defensive, not evidence of multiples.
 *  - Only `shared` entries are rendered here. Sharing is the coach's decision
 *    at every timepoint; a not-shared summary must stay invisible to research.
 *  - The reflection is written after **Session 1**, so the empty state has to
 *    distinguish "no reflection shared yet" from "Session 1 hasn't happened
 *    yet". Those are different facts and only one needs chasing.
 *  - There is no write path in this package. The coach authors it in the Coach
 *    Delivery Portal, which is not part of this handover.
 *
 * The section title and sub copy sit on the page canvas, outside the card, so
 * the card can be a plain document with no header band.
 */
function ConsumerReflectionCard({ coach, dyad }: { coach: Coach; dyad: ConsumerDyad }) {
  const { sessionCompletion } = useResearch()
  const firstName = coach.fullName.split(' ')[0]
  const session1Done = (sessionCompletion[dyad.id] ?? []).some((s) => s.session === 1)

  const shared = dyad.annotationSummaries.filter((e) => e.shared)

  return (
    /* One row per SIPTEA component, the component name in `primary` on a fixed
       180px track and the answer beside it. Component labels come from the
       stored `ReflectionComponentAnswer.label` — do not remap or abbreviate
       them; they are the framework's own six component names. */
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-title text-ink">Session reflection</h2>
        <p className="text-body text-ink">
          Post session 1 reflection shared by {firstName}
        </p>
      </div>

      {shared.length === 0 ? (
        <Card className="gap-0 rounded-lg py-0">
          <EmptyState
            icon={NotebookPen}
            copy={
              session1Done
                ? 'No reflection shared yet'
                : 'Session 1 hasn’t happened yet'
            }
          />
        </Card>
      ) : (
        shared.map((entry) => (
          <Card key={entry.id} className="gap-0 rounded-sm py-0">
            {/* Date/time + Shared chip, not a tinted header band — the section
                title outside the card already names what this is. */}
            <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-5 py-4">
              <p className="text-caption-medium text-ink">
                {formatDate(entry.date)} · {formatTime(entry.time)}
              </p>
              <Chip tone="success" label="Shared" />
            </div>
            <dl>
              {entry.components.map((c, i) => (
                <div
                  key={c.label}
                  className={cn(
                    'flex flex-col gap-2 px-5 py-5 sm:flex-row sm:gap-6',
                    i > 0 && 'border-t border-hairline',
                  )}
                >
                  <dt className="text-caption-medium text-primary sm:w-[180px] sm:shrink-0">
                    {c.label}
                  </dt>
                  <dd className="min-w-0 flex-1 text-body leading-[1.4] text-ink">{c.answer}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))
      )}
    </section>
  )
}

/**
 * ⚠️ SHARED ACROSS TWO PAGES IN TWO FILES. Supervision-note creation form plus
 * the notes-log table.
 *
 * Call sites:
 *   1. This page's Supervision Logs tab (`SupervisionHub`, below).
 *   2. `CoachProfilePage.tsx`'s Supervision Notes tab, for a **trainee**.
 *
 * Both pass exactly `coach`, `fullWidthStack`, `hideNotesHeader` and
 * `recordsHeading`. Any change here lands on both pages, and the failure mode
 * is a layout regression a typecheck cannot see. Open both before editing.
 *
 * ⚠️ FIVE PROPS HAVE NO CALLER IN THIS PACKAGE — `dyadId`, `notesHeading`,
 * `notesSubline`, `emptyMessage` and `rightSlot`. Their per-prop notes below
 * describe Coach Delivery Portal callers that are not part of this handover.
 * Two consequences:
 *   - The `rightSlot` layout branch is doubly dead: nothing passes it, and both
 *     callers pass `fullWidthStack`, which takes priority over it regardless.
 *   - Nothing passes `dyadId`, so the per-consumer scoping path never runs and
 *     every caller sees the coach-wide record list.
 * They were left in rather than unwound because removing layout branches from a
 * component shared across two files is exactly how an invisible spacing bug
 * ships. Do it as a deliberate pass with both pages open, or not at all.
 *
 * ⚠️ ATTACHMENTS ARE NOT STORED. "Attach File" reads `e.target.files` and keeps
 * only `f.name` as a string; the `File` object is discarded. The UI then lists
 * the filename, which reads exactly like a successful upload — a researcher
 * will reasonably believe the document is saved. It is not. This is the
 * document-storage integration boundary.
 *
 * Notes themselves also record **no author**. `addSupervisionNote` writes title,
 * date, time, body and attachment names against a `coachId` and nothing else. A
 * real study record needs an author id; there is no user identity to supply one
 * in this package.
 */
export function SupervisionRecords({
  coach,
  dyadId,
  notesHeading = 'Add new note',
  notesSubline = 'Remember to click Save after writing your notes.',
  recordsHeading = 'Supervision records',
  emptyMessage = 'No supervision notes yet. The first one you add appears here.',
  rightSlot,
  fullWidthStack,
  hideNotesHeader,
}: {
  coach: Coach
  dyadId?: string
  /** Copy overrides so a caller can retitle the form and table without forking
   *  the component. Defaults are generic and name-free so they fit both a
   *  researcher's supervision notes and a coach's per-consumer session notes.
   *  No caller in this package overrides `notesHeading` / `notesSubline`. */
  notesHeading?: string
  notesSubline?: string
  recordsHeading?: string
  emptyMessage?: string
  /** Puts arbitrary content in the grid's right-hand column and pushes the
   *  records table to its own full-width row below. No caller here — and
   *  `fullWidthStack` takes priority over it, so this branch cannot run. */
  rightSlot?: ReactNode
  /** Full-width note-creation card with the records table stacked below it,
   *  instead of the side-by-side grid. Both callers in this package use it: a
   *  half-width form sitting alone in a 2-column grid with nothing beside it
   *  reads as broken. Wins over `rightSlot` if both are somehow passed. */
  fullWidthStack?: boolean
  /** Drops the card's own "Add new note" header band. Both callers pass it
   *  because their `TabIntro` block directly above already says "write and save
   *  notes here", and repeating it inside the card is the same sentence twice.
   *  A caller with no tab-level intro should leave it off. */
  hideNotesHeader?: boolean
}) {
  const { supervisionNotes, addSupervisionNote } = useResearch()
  const notes = supervisionNotes
    .filter((n) => n.coachId === coach.id && (dyadId === undefined || n.dyadId === dyadId))
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(TODAY)
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5))
  const [notesBody, setNotesBody] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null)

  /* Records table. The heading sits on the page canvas, outside the card, so
     the card is a `yellow-50` shell with a `purple-50` header row and white
     data rows and no outer border — the tint carries the edge. Because there is
     no header band inside the card, there is nowhere for a sub-line to live;
     the caller's `TabIntro` carries that message instead. */
  const recordsCard = (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-body-md text-ink">{recordsHeading}</h2>
      <Card className="gap-0 overflow-hidden rounded-lg border-0 bg-yellow-50 py-0 shadow-card">
        {notes.length === 0 ? (
          <p className="bg-card px-8 py-6 text-caption text-ink-muted">{emptyMessage}</p>
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
  )

  /* 44px fields (well over the app's 36px control floor), 16px side padding,
     `caption-medium` `ink-faint` label above each. Shared verbatim by both
     callers — the note form is the same form everywhere, so it moves together
     or not at all. */
  const fieldLabel = 'text-caption-medium text-ink-faint'
  const fieldInput =
    'h-11 w-full rounded-sm border border-hairline bg-card px-4 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

  const notesCard = (
    <Card
      className="gap-0 self-start rounded-lg border border-parchment bg-card py-0 shadow-card"
    >
      {!hideNotesHeader && (
        <div className="bg-purple-50 p-6">
          <h2 className="font-display text-title">{notesHeading}</h2>
          <p className="mt-1 text-caption text-ink-muted">{notesSubline}</p>
        </div>
      )}

      <div className={cn('p-8', !hideNotesHeader && 'border-t border-hairline')}>
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              if (!title.trim() || !notesBody.trim()) return
              addSupervisionNote(coach.id, {
                title,
                date,
                time,
                notes: notesBody,
                attachments,
                ...(dyadId !== undefined ? { dyadId } : {}),
              })
              setTitle('')
              setNotesBody('')
              setAttachments([])
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="note-title" className={fieldLabel}>
                Title
              </label>
              <input
                id="note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={fieldInput}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="note-date" className={fieldLabel}>
                  Date
                </label>
                <input
                  id="note-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="note-time" className={fieldLabel}>
                  Time
                </label>
                <input
                  id="note-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="note-notes" className={fieldLabel}>
                Notes
              </label>
              {/* `bg-parchment`, not white — the fill is what distinguishes the
                  one free-text field from the single-line inputs above it. */}
              <textarea
                id="note-notes"
                value={notesBody}
                onChange={(e) => setNotesBody(e.target.value)}
                required
                className="h-40 w-full resize-y rounded-sm border border-hairline bg-parchment p-4 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="note-attachments"
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-primary px-6 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-within:ring-2 focus-within:ring-ring active:scale-[0.97]"
                >
                  Attach File
                  <input
                    id="note-attachments"
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
  )

  return (
    <div className="space-y-6">
      {fullWidthStack ? (
        <>
          {notesCard}
          {recordsCard}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {notesCard}
            {rightSlot ?? recordsCard}
          </div>
          {rightSlot && recordsCard}
        </>
      )}
    </div>
  )
}

/**
 * Supervision Logs — the researcher's notes about this coach as a whole, not
 * scoped to any one consumer (hence no `dyadId`). Identical to the trainee
 * record page's Supervision Notes tab; both reuse `SupervisionRecords` above.
 *
 * The negative top margin is a spacing correction, not decoration. The shared
 * tabpanel wrapper adds a section gap before every tab's content, which is
 * correct when the next thing is a new section but too much directly under
 * `TabIntro`. **The right value depends on this page's own wrapper gap**
 * (`gap-10`, 40px), so do not copy the trainee page's `-mt-8` here — that one is
 * tuned for its `gap-14` wrapper and would leave only 8px. Both land on the
 * same visible 24px.
 */
function SupervisionHub({ coach }: { coach: Coach }) {
  return (
    <div className="-mt-4">
      <SupervisionRecords
        coach={coach}
        fullWidthStack
        hideNotesHeader
        recordsHeading="Previous notes"
      />
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * The page shell: hero band, tab row, and the state two tabs share.
 *
 * Gate: a coach is only reachable here if they have a `SpacesCoach` row. No row
 * means they have not been onboarded into SPACES delivery, and the route
 * redirects to the roster.
 *
 * Two pieces of state live at page level on purpose:
 *  - `assignOpen` / `transferOpen` — the two caseload actions sit in the hero so
 *    they work from any tab, so the page owns their dialogs and toasts.
 *  - `selectedDyadId` — shared across tabs, so clicking a row on Overview
 *    carries that consumer into Assigned Consumers instead of each tab
 *    independently resetting to the first dyad.
 */
export function SpacesCoachProfilePage() {
  const { coachId } = useParams()
  const { coaches, spacesCoaches, consumerDyads } = useResearch()
  const [tab, setTab] = useState<Tab>(() => {
    const requested = new URLSearchParams(window.location.search).get('tab')
    return (TABS as readonly string[]).includes(requested ?? '') ? (requested as Tab) : 'Overview'
  })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  /* "Transfer consumer" moved out of the hero and down into the consumer band:
     it acts on THE SELECTED CONSUMER, not on the coach, and beside "Assign
     consumer" it read as a coach-level action with no clue which consumer it
     would move. Beside it, a quick view of that consumer's identity and contact
     details in a slide-in panel, so a researcher can check who they are without
     leaving the page they are reading. */
  const [detailsOpen, setDetailsOpen] = useState(false)
  /* Deep link, for the consumer record page's "View study progress" CTA: that
     page no longer owns a study-progress view, so its button has to land here
     on the right tab WITH THE RIGHT CONSUMER ALREADY SELECTED. `?tab=` /
     `?dyad=` / `?sub=`, each validated against the real list rather than
     trusted, all lazy initialisers so the page is correct on first paint. The
     params are a starting point only: switching tabs does not rewrite the URL. */
  const [searchParams] = useSearchParams()
  const [consumerSubtab, setConsumerSubtab] = useState<ConsumerSubtab>(() => {
    const requested = searchParams.get('sub')
    return CONSUMER_SUBTABS.some((t) => t.id === requested)
      ? (requested as ConsumerSubtab)
      : 'progress'
  })

  const spacesCoach = spacesCoaches.find((sc) => sc.coachId === coachId)
  const coach = spacesCoach ? coaches.find((c) => c.id === spacesCoach.coachId) : undefined

  const dyads = coach ? consumerDyads.filter((d) => d.coachId === coach.id) : []
  const [selectedDyadId, setSelectedDyadId] = useState(() => searchParams.get('dyad') ?? '')
  /* A `?dyad=` that is not on this coach's caseload is ignored rather than
     honoured: it would set the `<select>` to a value none of its `<option>`s
     carry, which renders as a blank control. */
  const effectiveDyadId =
    (dyads.some((d) => d.id === selectedDyadId) ? selectedDyadId : '') || dyads[0]?.id || ''

  const viewDyad = (dyadId: string) => {
    setSelectedDyadId(dyadId)
    setTab('Assigned Consumers')
  }

  if (!spacesCoach || !coach) return <Navigate to="/research/spaces-coaches" replace />

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
      /* Solid `purple-700` record-page hero band: white type, yellow active tab
         underline. All three researcher record pages share it — change it in
         all three or not at all. `CoachProfilePage` carries the measured
         derivation of `pt-10` and the tab row's `mt-[33px]`; deliberately no
         bottom padding, because the band's bottom edge IS the active tab's
         underline. */
      heroClassName="bg-purple-700 px-6 pt-10 md:px-20 md:pt-10"
      /* The consumer picker goes through `heroBelow`, NOT as the tab panel's
         first child. That slot is the only one outside the shell's padded,
         max-width content container; rendered inside it the band inherits the
         page gutter and stops short of both edges instead of running
         full-bleed. Only rendered on the tab that has a consumer to select. */
      heroFlushBelow
      heroBelow={
        tab === 'Assigned Consumers' && dyads.length > 0 ? (
          /* `sticky top-12` keeps the band pinned under the global header so
             the consumer whose data you are reading stays named on screen while
             it scrolls. `top-12`/`z-20` are copied from the shell's `topBanner`
             slot, which is known to stick correctly inside `motion.main`
             despite that element's transform — do not guess new values. */
          /* ⚠️ The padding sits on the OUTER box and the max-width container
             INSIDE it — the exact nesting `ResearchShell` uses for page content
             (`px-6 md:px-20`, then `mx-auto max-w-[1320px]`). Order matters and
             getting it backwards is not cosmetic: with the padding inside the
             capped box the label lands 80px right of every heading below it
             once the viewport exceeds 1320 + gutters, because the centring and
             the gutter then stack instead of the gutter being absorbed. */
          <div className="sticky top-12 z-20 bg-purple-50 px-6 shadow-card md:px-20">
            {/* Label + dropdown left, on the page's content gutter; the two
                consumer actions right-aligned on the same row. */}
            <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 flex-wrap items-center gap-4">
              <label htmlFor="dyad-select" className="text-body-md text-primary">
                Consumer selected:
              </label>
              <div className="relative w-full sm:w-[452px]">
                <select
                  id="dyad-select"
                  value={effectiveDyadId}
                  onChange={(e) => setSelectedDyadId(e.target.value)}
                  className="h-14 w-full appearance-none rounded-sm border border-hairline bg-card px-3 pr-9 text-body-md text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {dyads.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.patient
                        ? `PLE: ${d.patient.name}, Carer: ${d.carer.name}`
                        : `Carer: ${d.carer.name}`}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
              </div>
              {/* Both actions are scoped to the consumer named to their left,
                  which is why they are not in the hero beside "Assign consumer"
                  — that one is about the coach. `shrink-0` so a long dyad label
                  never compresses either control below the 36px floor. */}
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  View consumer details
                </button>
                {coach.status !== 'withdrawn' && (
                  <button
                    type="button"
                    onClick={() => setTransferOpen(true)}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/8 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                  >
                    Transfer consumer
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : undefined
      }
      hero={
        <>
          <Link
            to="/research/spaces-coaches"
            className="-my-3 flex w-fit items-center gap-1 rounded-sm py-3 text-caption-medium text-white outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Back to Coach Management
          </Link>

          {/* 48px below the back link, matching the other two record pages. */}
          <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              {/* The "Coach:" eyebrow says what kind of record this is. It
                  matters most on a deep link, where nothing else does. All
                  three record pages carry their own equivalent. */}
              <p className="text-body-md text-parchment">Coach:</p>
              <h1 className="font-display text-display-lg text-white">{coach.fullName}</h1>
              {/* No participant ID, employer or sub copy here: those live on
                  Profile details, and none of them is something you act on from
                  the top of the page. */}
            </div>
            {/* Inverted button pair, and it has to be. The app's canonical
                filled and outline buttons both resolve to `primary`, which is
                this band's own colour — a filled `bg-primary` button would be
                invisible on it. So the primary action is white-filled with
                `primary` text (10.62:1) and the secondary a white outline,
                preserving the same filled-vs-outline hierarchy. Do not
                "restore" the standard classes here. */}
            {coach.status !== 'withdrawn' && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-white px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-parchment focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  Assign consumer
                </button>
                {/* "Transfer consumer" used to sit here as the outline half of
                    the pair. It moved down into the consumer band — see
                    `detailsOpen` above for why. */}
              </div>
            )}
          </div>

          <div
            role="tablist"
            aria-label="SPACES coach profile sections"
            className="mt-[33px] flex items-end gap-8 overflow-x-auto"
          >
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
                  aria-controls={`spaces-tabpanel-${i}`}
                  id={`spaces-tab-${i}`}
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
                      layoutId="spaces-coach-profile-tab-underline"
                      className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-yellow-300"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </>
      }
    >

      <div
        role="tabpanel"
        id={`spaces-tabpanel-${TABS.indexOf(tab)}`}
        aria-labelledby={`spaces-tab-${TABS.indexOf(tab)}`}
        /* Top margin drops to 0 on the tab that shows the consumer band,
           because three spacers stack there — the shell's content inset, this
           margin, and `TabIntro`'s own padding — for roughly double the
           intended gap. Every other tab keeps the margin: with no band, it is
           the only thing separating the content from the hero. */
        className={cn(
          'flex flex-col gap-10',
          tab === 'Assigned Consumers' && dyads.length > 0 ? 'mt-0' : 'mt-16',
        )}
      >
        {/* Two tabs are excluded from the shared intro block, for different
            reasons. Overview renders its own `TabIntro` *inline*, paired beside
            the Coach Details card in the same row. Profile details renders none
            at all: every card below it carries a header band naming itself, so
            a page title above them says the same words a third time. */}
        {/* The sub-tab row sits ABOVE the tab intro, directly under the
            consumer band: the split it describes ("how is this pairing going"
            vs "what does their sleep data say" vs "what did the coach write")
            governs everything below it, including the intro copy, so it reads
            as the first thing on the panel rather than a divider inside it.
            `flushStart` pulls it left by its own tab padding so the first
            label lands on the content gutter. `layoutId` must not collide with
            the hero row's own underline. */}
        {tab === 'Assigned Consumers' && dyads.length > 0 && (
          /* `mb-6` on top of the tabpanel's `gap-10`: 40px read as too tight
             under a row that governs the whole panel. 40 + 24 + `TabIntro`'s
             own 16 = 80px. */
          <div className="mb-6">
          <UnderlineTabs
            tabs={CONSUMER_SUBTABS}
            active={consumerSubtab}
            onChange={setConsumerSubtab}
            ariaLabel="Consumer views"
            layoutId="spaces-consumer-subtab-underline"
            idPrefix="spaces-consumer-subtab"
            panelId="spaces-consumer-subpanel"
            flushStart
          />
          </div>
        )}
        {/* No intro row at all on the sleep & health and reflection sub-tabs:
            their own first card already carries a real title and sub copy
            immediately below, so the block restated the sub-tab label a third
            time. The two consumer actions live in the band, not here, so
            nothing is lost with it. */}
        {tab !== 'Profile details' &&
          tab !== 'Overview' &&
          !(tab === 'Assigned Consumers' && consumerSubtab !== 'progress') && (
          <TabIntro
            {...(tab === 'Assigned Consumers'
              ? CONSUMER_SUBTAB_INTRO[consumerSubtab]
              : TAB_INTRO[tab])}
          />
        )}
        {tab === 'Overview' && <OverviewTab coach={coach} onViewDyad={viewDyad} />}
        {tab === 'Assigned Consumers' && (
          <ConsumersDetailsTab
            coach={coach}
            selectedId={effectiveDyadId}
            subtab={consumerSubtab}
          />
        )}
        {tab === 'Supervision Logs' && <SupervisionHub coach={coach} />}
        {tab === 'Profile details' && <ProfileDetailsTab coach={coach} />}
      </div>

      <AssignConsumerDialog open={assignOpen} onClose={() => setAssignOpen(false)} coachId={coach.id} />

      <SlideOverPanel
        open={detailsOpen}
        title="Consumer details"
        subtitle="A quick look at who this consumer is, without leaving this page."
        onClose={() => setDetailsOpen(false)}
      >
        {/* The consumer record page's own CONTACT CARD, one per dyad member,
            rather than a second identity treatment built for this panel.
            Stacked, not side by side: the panel is 480px, where that page's
            two-column grid gives each card ~216px and wraps every email
            mid-word.
            Notes are deliberately NOT here. This is a quick view, and a
            freeform field with a save path is not something to edit from a
            panel opened to check a phone number — it stays on the consumer's
            own record, which the CTA below goes to. */}
        {(() => {
          const d = dyads.find((x) => x.id === effectiveDyadId)
          if (!d) return null
          return (
            <div className="flex flex-col gap-6">
              {d.patient && <ContactDetailsCard role="PLE" person={d.patient} />}
              <ContactDetailsCard role="Carer" person={d.carer} />
              {/* Everything this panel leaves out is one link away rather than
                  duplicated into it. */}
              <Link
                to={`/research/consumers/${d.id}?tab=${encodeURIComponent('Profile details')}`}
                className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/8 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Go to consumer profile details
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          )
        })()}
      </SlideOverPanel>

      <TransferConsumerDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        coach={coach}
        dyad={dyads.find((d) => d.id === effectiveDyadId) ?? dyads[0]}
      />

    </ResearchShell>
  )
}
