import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu } from '@base-ui/react/menu'
import {
  BookOpenCheck,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  MoreVertical,
  NotebookPen,
  FileText,
  Paperclip,
  Search,
  Trash2,
  Users,
  Video,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/SearchInput'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import {
  ReflectionReviewTable,
  rowsFromStored,
} from '@/components/shared/ReflectionReviewTable'
/* The consumer's own five-point scale, imported rather than retyped: the
   researcher must never read a wording the consumer was never shown. Its
   source of truth is the post-session feedback flow itself
   (`components/consumer/SessionFeedbackModal.tsx`). */
import { FEEDBACK_MOODS } from '@/components/shared/FeedbackPillow'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { PlanSessionsModal } from '@/components/research/PlanSessionsModal'
import { EditSessionPlanModal } from '@/components/research/EditSessionPlanModal'
import { SessionsPlanOverview } from '@/components/research/SessionsPlanOverview'
import { SlideOverPanel } from '@/components/research/SlideOverPanel'
/* Direct instruction: the study-progress timeline, the study log and the
   Fitbit/sleep-diary pair all move here off the Consumer Management record
   page, which no longer shows them. Imported from that page rather than
   copied — two renderings of one fact is the failure mode this project
   keeps hitting, and these are the same three surfaces. */
import {
  ContactDetailsCard,
  HealthDataHubTab,
  ModuleCompletionOverviewCard,
  StudyLogSection,
  StudyProgressTimelineCard,
} from '@/pages/research/ConsumerDetailPage'
import { Chip, CertificationChip, CoachStatusChip } from '@/components/research/StatusChip'
import { RECORD_GRID, RecordFieldList, RecordInput } from '@/components/research/RecordFields'
import { Card } from '@/components/ui/card'
import { TabIntro } from '@/components/research/TabIntro'
import { TablePager } from '@/components/shared/TablePager'
import { Toast } from '@/components/shared/Toast'
import {
  ResearchPrioritiesSection,
  type ResearchPriorityItem,
} from '@/components/research/ResearchPrioritiesSection'
import { Separator } from '@/components/ui/separator'
import { downloadText } from '@/lib/csv'
import { sessionTranscript, transcriptAsText } from '@/data/transcript'
import { cn } from '@/lib/utils'
import { type Coach, type NotificationPreferences } from '@/data/research'
import {
  CONSUMER_MODULES,
  SPACES_CATCHUP_COUNT,
  PLANNING_SESSION,
  SPACES_SESSIONS,
  catchupSessionsCompleted,
  displaySessionNumber,
  sessionRowLabel,
  isPlanSet,
  moduleUnlockState,
  nextUpcomingSessionEntry,
  type AnnotationSummaryEntry,
  type ConsumerDyad,
  type HealthLogEntry,
  type PersonProfile,
  type SessionCompletionRecord,
  type SessionPlan,
  type SupervisionNote,
} from '@/data/spaces'
import { useResearch } from '@/data/research-context'
import { formatDate, formatTime, TODAY } from '@/data/format'
import { SIPTEA_INITIALS, SIPTEA_NAMES } from '@/data/siptea'
import { OUTLINE_FILLED_BUTTON } from '@/components/shared/buttonStyles'
import { btn } from '@/components/shared/buttonSystem'
import { Button } from '@/components/ui/button'

/* Round 27: "Shared Annotations" removed as a tab on direct instruction. A
   coach's shared reflections are per-consumer, so a coach-wide tab had to
   carry its own consumer picker — a second picker for the same selection the
   "Assigned Consumers" tab already owns. The content now renders inside that
   tab, scoped to whichever consumer is selected there.

   Note: Figma frame `285:6310` draws the tab row as Overview / Study Progress /
   Supervision Notes / Profile Details. Those labels are inherited chrome — the
   frame is named "Consumer management_inner page_1", its side nav highlights
   Trainee Management, and "Study Progress" is the *consumer* record page's tab
   name (Round 25, confirmed consumer-only) while "Supervision Notes" is the
   *trainee* page's. The tab set below follows the direct instruction instead. */
const TABS = ['Overview', 'Assigned Consumers', 'Supervision Logs', 'Profile details'] as const
type Tab = (typeof TABS)[number]

/** Per-tab title + sub copy (Figma `93:7`). */
const TAB_INTRO: Record<Tab, { title: string; subtitle: string }> = {
  Overview: {
    title: 'Coach overview details',
    subtitle: 'Get a quick sense of this coach\u2019s caseload and how delivery is going',
  },
  /* Round 27, frame `306:155` node `297:1950`. The frame draws this title with
     no sub copy at all; a subtitle is kept because all 15 tab panels across the
     three record pages carry one, and dropping it here alone would make this
     the only tab whose intro is a bare line. */
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

/** Replaces the old manual "Add consumer" form (`AddConsumerDialog` — hand-
 *  typed PLE/Carer fields) — consumers are enrolled on the Consumer
 *  Management side first (`enrollConsumer`); this dialog only assigns an
 *  already-enrolled, still-coach-less dyad to this coach via `transferDyad`
 *  (coachId-agnostic, so it works equally as a first assignment). Same
 *  two-step select-then-confirm-summary shape as `OnboardCoachDialog`. */
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

/** Coach-centric landing tab: a basic identity card plus a table-based view
 *  of every consumer on this coach's caseload. The "Assign consumer" action
 *  lives here since it's tied directly to that table.
 *  The complete identity/contact record (and "Withdraw coach") moved
 *  out to its own "Profile details" tab — this one stays a quick, basic
 *  glance. A coach no longer carries an "invited/joined" framing on their
 *  own profile once they're active in SPACES, so that status has no home
 *  here either. */
/** The "Assigned consumers" caseload tabs (Round 27, direct instruction).
 *  Same two-state shape as Coach Management's own roster tabs. */
const CASELOAD_TABS = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'complete', label: 'Study complete' },
] as const
type CaseloadTab = (typeof CASELOAD_TABS)[number]['id']

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
  // Ordered least-to-most progressed (0 sessions → all sessions done), same
  // convention as the Coach Delivery Portal's own consumer table.
  const dyads = consumerDyads
    .filter((d) => d.coachId === coach.id)
    .sort((a, b) => (sessionCompletion[a.id] ?? []).length - (sessionCompletion[b.id] ?? []).length)

  const withdrawn = coach.status === 'withdrawn'
  const firstName = coach.fullName.split(' ')[0]

  /* Frame node `297:1683` KPI values, all derived — never seeded.

     The frame's own numbers contradict each other ("Consumers assigned 4"
     beside "Sessions completed 9 of 12", where 12 is 2 consumers x 6
     catch-ups), which is consistent with the rest of its chrome being
     inherited from a trainee frame. Deriving all four means the row cannot
     disagree with the table directly beneath it — the exact defect Round 20's
     design critique found on Trainee Management, where a KPI counted one field
     and the column beside it rendered another. */
  const coachSince = spacesCoaches.find((sc) => sc.coachId === coach.id)?.joinedDate
  const sessionsDone = dyads.reduce(
    (n, d) => n + catchupSessionsCompleted(sessionCompletion[d.id] ?? []),
    0,
  )
  const sessionsTotal = dyads.length * SPACES_CATCHUP_COUNT
  const studyComplete = dyads.filter(
    (d) => catchupSessionsCompleted(sessionCompletion[d.id] ?? []) >= SPACES_CATCHUP_COUNT,
  ).length
  /* "Session reflections x of y" (direct instruction). The denominator is
     `sessionsDone`, NOT the 6-per-consumer total: the coach owes one SIPTEA
     reflection per session actually held (Notion, coach overview), so a coach
     who is up to date reads "9 of 9" and one who is behind reads "7 of 9".
     Against the plan total it would read "9 of 18" for a fully up-to-date
     coach, which names a debt that does not exist.
     Both halves are derived from the same two sources the table below renders,
     so the tile cannot disagree with it. */
  const reflectionsDone = dyads.reduce((n, d) => n + d.annotationSummaries.length, 0)

  /* Caseload tabs, on direct instruction and following the same pattern as
     Coach Management's own roster ("Active coaches" / "Waiting to be
     onboarded"): the shared `UnderlineTabs`, which already carries the sliding
     `layoutId` underline, roving tabindex and arrow keys.

     The split reads off `catchupSessionsCompleted` against
     `SPACES_CATCHUP_COUNT` — the same derivation the "Sessions completed"
     column and the "Study completed" KPI above already use, so a consumer
     showing "6 of 6" in the table cannot appear under "Ongoing". */
  const ongoingDyads = dyads.filter(
    (d) => catchupSessionsCompleted(sessionCompletion[d.id] ?? []) < SPACES_CATCHUP_COUNT,
  )
  const completeDyads = dyads.filter(
    (d) => catchupSessionsCompleted(sessionCompletion[d.id] ?? []) >= SPACES_CATCHUP_COUNT,
  )
  const tabDyads = caseloadTab === 'ongoing' ? ongoingDyads : completeDyads

  /* Direct instruction (Notion, coach overview): "for the tabs like ongoing,
     study complete can you add the numbers as well. For example, ongoing (2)."
     `UnderlineTabs` already renders an optional `count` — the same prop Coach
     Management's own roster tabs use — so this is the count, not a second
     label format. Counts are the *unsearched* tab totals: a tab's number is a
     property of the caseload, and recomputing it under an active query would
     make both tabs' numbers change as the researcher types. */
  const caseloadTabsWithCounts = CASELOAD_TABS.map((t) => ({
    ...t,
    count: t.id === 'ongoing' ? ongoingDyads.length : completeDyads.length,
  }))

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
      {/* Round 27, frame `285:6310` (node `297:1725`): the tab's intro copy on
          the left, the Coach Details card on the right, 32px apart. Identical
          row structure to the trainee record page's Overview (frame `152:176`,
          node `152:232`) — the card is the frame's own 568.5px and does not
          flex, the intro column takes the rest, and both stack below `lg`. */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <TabIntro {...TAB_INTRO.Overview} />
        </div>
        <section className="flex flex-col lg:w-[568.5px] lg:shrink-0">
          {/* Frame node `285:6493` "Trainee Details Card" — the same chassis as
              the trainee page's own card: vertical `yellow-100` -> white
              gradient (the card's lower half *is* white, which is why the
              detail rows carry no panel of their own), 1px `parchment` border,
              warm `shadow-card`, and a plain 104px avatar with no ring and no
              shadow.
              ⚠️ Scoped exception to the app-wide "no avatars" rule (Round 4.1),
              on the same footing as the trainee card's: the frame draws it, and
              the two record pages would otherwise disagree on the same card.
              One fixed stock photo, not a per-coach headshot — the dataset has
              none. See the note in the closing summary: the trainee card's own
              avatar is currently under an unresolved review, so this is a
              second call site for a decision that is still open. */}
          <Card className="gap-0 rounded-lg border border-parchment bg-gradient-to-b from-yellow-100 to-white py-0 shadow-card">
            <div className="flex flex-col gap-6 p-6">
              <div className="flex items-start gap-6">
                <span
                  aria-hidden="true"
                  className="block size-[104px] shrink-0 overflow-hidden rounded-full"
                >
                  <img
                    src="/avatars/trainee-avatar.jpg"
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
                  {/* Three real grid tracks — 110px label / 24px colon / value —
                      matching the frame's own `row-label`/`row-separator`/
                      `row-value` structure, so the colons align in their own
                      column rather than trailing each label. */}
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
                    {/* Frame node `297:1850` adds a "Certification" row whose
                        value is a download link. There is no certificate
                        artifact in the data model, so per this project's
                        standing rule an unwired control ships as a focusable
                        `aria-disabled` button with an `sr-only` cue — never a
                        silently dead link, and never omitted. */}
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

      {/* Frame node `297:1683` "kpi-row" — 4 tiles, 16px apart. Uses the shared
          `StatCard`, which already *is* this tile (yellow-100, 12px radius,
          16px padding, 32px icon box in `purple-500`), so nothing is forked.

          Icons are this project's own lucide glyphs, not the frame's exports.
          The frame's four are `users`, `user-check`, `user-check`,
          `alert-triangle` — the middle two are the same glyph twice and the
          last is a warning triangle on a positive count, so they read as
          placeholders. Mapped to semantically correct equivalents on direct
          instruction to update them. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
        {/* Added on direct instruction, and it is where the "Annotation
            summary" column that used to sit in the table below now reports
            from: the per-consumer share state moved back inside the consumer's
            own record, so the coach-level fact a researcher needs on this tab
            is the count, not a per-row chip. */}
        <StatCard
          label="Session reflections"
          value={`${reflectionsDone} of ${sessionsDone}`}
          icon={NotebookPen}
        />
        <StatCard label="Study completed" value={studyComplete} icon={CircleCheckBig} />
      </div>

      {/* Direct instruction: "align with other views, in other views the table
          does not have white background".

          This section used to be ONE white `Card` holding the title, search,
          tabs *and* a second bordered container around the table — a white box
          inside a white box, which is why the table read as sitting on a
          different surface from every other table in the dashboard. It now
          follows `RosterPage` / `ConsumerManagementPage` / `SpacesRosterPage`
          exactly: title + search + tabs on the page canvas (`#fffcfa`), and a
          single plain `Card` holding nothing but the table. One chassis, four
          tables. */}
      <section className="flex flex-col gap-6">
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
          tabs={caseloadTabsWithCounts}
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
          <Card className="gap-0 rounded-lg py-0">
          {dyads.length === 0 ? (
            <EmptyState icon={Users} copy="No consumers assigned yet" />
          ) : visibleDyads.length === 0 ? (
            /* Three genuinely different empty states. A search that matches
               nothing is not the same as a tab with nobody in it, and neither
               is the same as a coach with no caseload at all — one message for
               all three would be false in two of the cases. All three now use
               the shared icon-led treatment (Round 27), with the icon carrying
               the difference: a search glass for a query, a check for a tab
               that is legitimately empty. */
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
          ) : (
          /* Bare scroller. The second bordered container that used to sit here
             (frame node `297:1811`) went with the outer card: with the table
             now alone inside one plain `Card`, a border here would draw a
             second outline 1px inside the card's own. Matches `RosterPage`'s
             `<Card gap-0 rounded-lg py-0><div overflow-x-auto>` exactly. */
          <div className="overflow-x-auto overflow-y-hidden">
            {/* 820px -> 930px when the Session Plan column was added, then
                -> 1080px when the frame's Session Date column joined it, then
                back to 920px when "Annotation summary" was removed. The floor
                tracks the column count in both directions — leaving it at 1080
                after dropping a column makes the table scroll for space it no
                longer needs. */}
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="bg-purple-50">
                  <th scope="col" className="px-6 py-4 text-caption-medium text-ink">
                    Consumer Details
                  </th>
                  {/* Round 20 deferred this column, and Round 26's audit carried
                      it forward: Round 12's own mirroring rule says this table
                      and Consumer Management's must show the same fields for the
                      same dyad, and this was the one field only that page had.
                      Placed before "Sessions Completed" to match Consumer
                      Management's own column order, and reading the same
                      `isPlanSet(sessionPlans[…])` with the same success/muted
                      Chip tones — two surfaces showing one fact off one field,
                      which is the failure mode this project keeps hitting when
                      they drift onto two. */}
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Session Plan
                  </th>
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Sessions Completed
                  </th>
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Upcoming Session
                  </th>
                  {/* Frame node `297:1818` adds this column. Read off the same
                      `nextUpcomingSessionEntry()` resolution as "Upcoming
                      Session" beside it, so the number and its date can never
                      describe two different sessions. */}
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Session Date
                  </th>
                  {/* The "Annotation summary" column was REMOVED here on direct
                      instruction — "within table do not show annotation
                      summary, that remains inside". A reflection's share state
                      is a per-consumer fact and now reports in two places that
                      own it: the "Session reflections" KPI above (the coach-level
                      count) and the consumer's own Coach's reflection sub-tab
                      (the entries themselves). Do not reinstate it here. */}
                  {/* Round 27: the "Actions" / "View details" column became a
                      right chevron on direct instruction, matching Consumer
                      Management's and Trainee Management's own rosters — a
                      clickable row with a chevron affordance at its right
                      edge, and an `sr-only` header rather than a visible one. */}
                  <th scope="col" className="relative px-4 py-4">
                    <span className="sr-only">View consumer</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleDyads.map((d, i) => (
                  /* Round 27: the whole row is the click target with a hover
                     tint, matching Consumer Management's and Trainee
                     Management's rosters — previously only the chevron was
                     clickable here, so this was the one table in the app where
                     clicking a row did nothing. The chevron below keeps its own
                     handler (with `stopPropagation`, so a click on it fires
                     once, not twice) because it is the keyboard route in: this
                     table's consumer names are plain text, not `<Link>`s, so a
                     bare clickable `<tr>` would be mouse-only. */
                  <tr
                    key={d.id}
                    onClick={() => onViewDyad(d.id)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-pearl',
                      i > 0 && 'border-t border-hairline',
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
                  {/* Round 14.1 correction, still load-bearing: this column
                      used to read the legacy `d.upcomingSession` field's raw
                      internal session number directly, which made this table
                      contradict the Assigned Consumers tab one click away
                      (e.g. "Session 2" here, "Session 1 · Next" there, for the
                      same dyad). Round 27 moved both this column and the new
                      Session Date beside it onto one `nextUpcomingSessionEntry`
                      call — the plan first, the legacy field as a fallback, and
                      never the planning session (internal 1), which would
                      otherwise render as a nonsensical "Session 0". */}
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
                  <td className="px-4 py-3 text-right">
                    {/* The chevron is a real focusable button, not the bare
                        decorative icon the other rosters use. Those tables sit
                        on pages whose consumer names are `<Link>`s, so a
                        keyboard user always has a route in; this table's names
                        are plain text, so removing the "View details" button
                        and leaving only a clickable `<tr>` would have made the
                        row mouse-only — a real keyboard regression, and this
                        project's most-repeated defect class. Same visual
                        result, no lost affordance. */}
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDyad(d.id)
                      }}
                      aria-label={`View ${dyadTitle(d)}`}
                      variant="ghost"
                      tone="neutral"
                      size="icon"
                    >
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
          )}
          </Card>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Profile details                                                          */
/* ------------------------------------------------------------------------ */

/** Local sibling of `ConsumerDetailPage.tsx`'s own `DyadNotificationPreferencesCard`
 *  — same fields, same behaviour, same `purple-50` header, styled to match
 *  "as done for consumers" rather than the plain `bg-card-header` shared
 *  `components/account/NotificationPreferencesCard.tsx` the Coach Delivery
 *  Portal's own Account page uses. Reads/writes `coach.notificationPreferences`
 *  via the store's existing `updateCoachNotificationPreferences` — that field
 *  and action already exist (Round 6.2.1's cross-portal Account tab), just
 *  with no researcher-facing surface until now. */
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
            <Button
              type="submit"
            >
              Save changes
            </Button>
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

/* ------------------------------------------------------------------------ */
/* Withdraw coach                                                            */
/* ------------------------------------------------------------------------ */

/** The reasons a research coordinator withdraws a SPACES coach. Modelled on
 *  the Consumer Portal's own `OPT_OUT_REASONS` (which the consumer picks for
 *  themselves) but written from the coordinator's side, since this is a
 *  record *about* the coach rather than a statement *by* them. "Other" is
 *  what the free-text detail box is for. */
const WITHDRAWAL_REASONS = [
  'Left their aged care employer',
  'No longer has capacity to deliver sessions',
  'Health or personal circumstances have changed',
  'Withdrew from the study at their own request',
  'Research team decision',
  'Other',
]

/** All three steps of the withdrawal share one panel size, wider and roomier
 *  than the 440px / `p-6` confirm-dialog default. The first pass used the
 *  default and it did not survive its own worst case: a caseload is a *list*,
 *  and a 440px column of one dropdown per consumer is unreadable well before
 *  a coach with ten of them. The size is on the flow, not on one step, so the
 *  three do not resize under the researcher as they move through.
 *
 *  `p-8` overrides the chassis' own `p-6` — `cn()` merges `panelClassName`
 *  last, so a padding passed here wins rather than fighting it. */
const WITHDRAW_PANEL = 'max-h-[85vh] min-h-[min(620px,85vh)] w-full max-w-[820px] p-8'
/** Lets the content area absorb the height `min-h` adds, so the footer stays
 *  pinned to the bottom instead of floating with white space beneath it. */
const WITHDRAW_CONTENT = 'flex-1'
/** Re-bleeds the pearl footer to the edges of a `p-8` panel — see
 *  `ConfirmDialog.footerClassName`. */
const WITHDRAW_FOOTER = '-mx-8 -mb-8 px-8'

/**
 * The withdraw-a-coach flow (Round 46, direct instruction). Three steps on
 * the shared `ConfirmDialog` chassis, the same sequential-dialog pattern
 * `OnboardCoachDialog` and this page's own `TransferConsumerDialog` use:
 *
 *   1. **Transfer consumers** — the caseload as one table, a coach dropdown
 *      per row. This restores the rule that used to sit on the button as a
 *      hard `disabled` (with a "transfer them first" hint underneath), which
 *      told the researcher what was wrong but gave them no way to fix it from
 *      here. It is now a step in the flow rather than a wall in front of it.
 *      Skipped entirely for a coach with an empty caseload — a step with
 *      nothing in it is not a step.
 *
 *      An earlier pass offered a "move them all to the same coach" shortcut
 *      behind a radio group; it was removed on direct instruction. The
 *      shortcut saved clicks on a large caseload but made the researcher
 *      answer a question about *how* to assign before they could assign
 *      anything, which is the opposite of simple on the common case of two
 *      or three consumers.
 *   2. **Reason** — a required reason plus optional detail, written into the
 *      coach's `withdrawalNote` and rendered back on the Study details card.
 *   3. **Confirm** — the reason directly under the title, then the same
 *      caseload table again with each consumer's new coach in place of the
 *      picker. Direct instruction, and it replaced a version grouped by
 *      receiving coach: confirming against the shape you just filled in beats
 *      confirming against a recap worded differently from the screen that
 *      produced it.
 *
 * The transfers commit at the same moment the withdrawal does, on the final
 * confirm — cancelling at step 2 or 3 must leave the caseload untouched, and
 * a flow that moved consumers as you clicked through would half-apply itself.
 */
function WithdrawCoachDialog({
  open,
  onClose,
  onWithdrawn,
  coach,
  dyads,
}: {
  open: boolean
  onClose: () => void
  /** Confirming unmounts the "Withdraw coach" button that opened this flow —
   *  the card swaps it for a "Withdrawn" chip — so `ConfirmDialog`'s own
   *  focus-restore has nothing left to return to and focus lands on `<body>`.
   *  Measured, not assumed: this project's most-repeated defect class. The
   *  caller moves focus somewhere deliberate instead. */
  onWithdrawn: () => void
  coach: Coach
  dyads: ConsumerDyad[]
}) {
  const { coaches, spacesCoaches, transferDyad, withdrawCoach } = useResearch()

  /** Same pool as this page's Transfer consumer action: joined SPACES coaches
   *  who are not this coach and have not themselves withdrawn. Derived from
   *  the same two collections, so the two surfaces cannot offer different
   *  candidates for the same move. */
  const transferTargets = spacesCoaches
    .filter((sc) => sc.coachId !== coach.id && sc.joinedStatus === 'joined')
    .map((sc) => coaches.find((c) => c.id === sc.coachId))
    .filter((c): c is Coach => !!c && c.status !== 'withdrawn')

  const needsTransfer = dyads.length > 0
  const [step, setStep] = useState<'transfer' | 'reason' | 'confirm'>(
    needsTransfer ? 'transfer' : 'reason',
  )
  /** dyad id -> receiving coach id. Deliberately starts empty rather than
   *  defaulting every consumer to the first candidate: a pre-filled
   *  destination on a screen this consequential is a choice nobody made. */
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    if (!open) return
    setStep(needsTransfer ? 'transfer' : 'reason')
    setTargets({})
    setReason('')
    setDetail('')
    // re-seed only when the dialog opens, not on every roster change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const placed = dyads.filter((d) => targets[d.id]).length
  const targetName = (id: string) => transferTargets.find((c) => c.id === id)?.fullName ?? ''

  /** The stacked PLE/Carer cell, shared by step 1's picker table and step 3's
   *  summary table so the two cannot describe the same dyad differently. */
  const consumerCell = (d: ConsumerDyad) => (
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
  )
  const canTransfer = transferTargets.length > 0
  const allPlaced = placed === dyads.length

  /* "Other" means the free-text box *is* the reason, so it stands alone;
     any other reason keeps the box as a separate "Additional comments" note
     rather than being glued onto the end of the reason with a dash. Both the
     confirm screen's bullets and the stored `withdrawalNote` are built from
     this one pair, so the record cannot say something the researcher did not
     see before confirming. */
  const trimmedDetail = detail.trim()
  const reasonPrimary = reason === 'Other' ? trimmedDetail : reason
  const extraComments = reason === 'Other' ? '' : trimmedDetail
  const reasonNote = extraComments
    ? `${reasonPrimary}. Additional comments: ${extraComments}`
    : reasonPrimary

  const commit = () => {
    dyads.forEach((d) => {
      const to = targets[d.id]
      if (to) transferDyad(d.id, to)
    })
    withdrawCoach(coach.id, reasonNote || reason)
    onClose()
    onWithdrawn()
  }

  return (
    <>
      {/* Step 1 — transfer the caseload */}
      <ConfirmDialog
        open={open && step === 'transfer'}
        title={`Move ${coach.fullName.split(' ')[0]}'s consumers to another coach`}
        body={
          canTransfer
            ? `${dyads.length === 1 ? 'This consumer needs' : `All ${dyads.length} consumers need`} a new coach before the withdrawal can go ahead. Session history, health data, and reflections stay with the consumer.`
            : 'This caseload has to move to another coach first, and no other joined coach is available right now.'
        }
        confirmLabel="Continue"
        cancelLabel="Cancel"
        confirmDisabled={!canTransfer || !allPlaced}
        panelClassName={WITHDRAW_PANEL}
        footerClassName={WITHDRAW_FOOTER}
        contentClassName={WITHDRAW_CONTENT}
        onConfirm={() => setStep('reason')}
        onClose={onClose}
      >
        {!canTransfer ? (
          <p className="text-caption text-ink-faint">
            Onboard another coach into SPACES delivery, then come back to this.
          </p>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {/* Direct instruction: the caseload is the whole step. One table,
                one dropdown per consumer, no mode choice — the "move them all
                to the same coach" shortcut and its radio group are gone, so
                there is nothing to decide before the researcher can start
                assigning. Capped and scrolled so a large caseload cannot push
                the footer off-screen.
                The Consumer cell uses the page's own stacked PLE/Carer
                grammar rather than a flattened "A & B" string, so a dyad
                reads the same here as it does everywhere else.
                A Sessions-completed column was built here and removed on
                direct instruction: this step is about where a consumer goes
                next, and their session count does not bear on that choice. */}
            <p id="withdraw-caseload-heading" className="text-fine text-ink-faint">
              {dyads.length === 1
                ? 'Consumer assigned to this coach'
                : 'Consumers assigned to this coach'}
            </p>
            <div className="max-h-[300px] overflow-auto rounded-lg border border-parchment shadow-card">
              <table
                aria-labelledby="withdraw-caseload-heading"
                /* Width floor + a scrolling container. Without it the panel's
                   327px at 375px viewport left the Consumer column at 101px
                   and every name wrapped across three lines — caught by
                   `layout-audit.js`, invisible at desktop width. Scrolling a
                   narrow table beats crushing it, and matches how every other
                   table in this dashboard behaves below desktop. */
                className="w-full min-w-[440px] border-collapse text-left"
              >
                <thead className="sticky top-0 z-10">
                  <tr className="bg-purple-50">
                    <th scope="col" className="px-4 py-3 text-caption-medium text-ink">
                      Consumer
                    </th>
                    <th scope="col" className="px-4 py-3 text-caption-medium text-ink">
                      New assigned coach
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dyads.map((d) => (
                    <tr key={d.id} className="border-t border-hairline align-middle">
                      <th scope="row" className="px-4 py-3 text-left font-normal">
                        {consumerCell(d)}
                      </th>
                      <td className="px-4 py-3">
                        <label htmlFor={`withdraw-transfer-${d.id}`} className="sr-only">
                          New assigned coach for {dyadTitle(d)}
                        </label>
                        <div className="relative">
                          <select
                            id={`withdraw-transfer-${d.id}`}
                            value={targets[d.id] ?? ''}
                            onChange={(e) =>
                              setTargets((prev) => ({ ...prev, [d.id]: e.target.value }))
                            }
                            className={selectClass}
                          >
                            <option value="">Choose a coach…</option>
                            {transferTargets.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.fullName}
                              </option>
                            ))}
                          </select>
                          <SelectChevron />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dyads.length > 1 && (
              // A live count, because with a scrolling table the un-placed
              // consumer holding Continue disabled can be off-screen.
              <p role="status" className="text-fine text-ink-faint">
                {placed} of {dyads.length} placed
              </p>
            )}
          </div>
        )}
      </ConfirmDialog>

      {/* Step 2 — why */}
      <ConfirmDialog
        open={open && step === 'reason'}
        title="Why is this coach withdrawing?"
        body="This is kept on their record and shown on their profile."
        confirmLabel="Continue"
        cancelLabel={needsTransfer ? 'Go back' : 'Cancel'}
        confirmDisabled={!reason || (reason === 'Other' && !detail.trim())}
        panelClassName={WITHDRAW_PANEL}
        footerClassName={WITHDRAW_FOOTER}
        contentClassName={WITHDRAW_CONTENT}
        onConfirm={() => setStep('confirm')}
        onClose={() => (needsTransfer ? setStep('transfer') : onClose())}
      >
        <div className="flex flex-col gap-6 py-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="withdraw-reason" className="text-fine text-ink-faint">
              Reason
            </label>
            <div className="relative">
              <select
                id="withdraw-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={selectClass}
              >
                <option value="">Select a reason…</option>
                {WITHDRAWAL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="withdraw-detail" className="text-fine text-ink-faint">
              {reason === 'Other' ? 'What happened?' : 'Anything to add? (optional)'}
            </label>
            <textarea
              id="withdraw-detail"
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="w-full rounded-sm border border-hairline bg-card px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </ConfirmDialog>

      {/* Step 3 — the point of no return */}
      <ConfirmDialog
        open={open && step === 'confirm'}
        /* Direct instruction: generic review copy — no personal name, and no
           "SPACES", which is internal framework vocabulary rather than
           something the sentence needs. The coach's name is already the page
           heading behind this dialog, and the rows below name everyone the
           action touches, so repeating it in the title added nothing. */
        title="Review and confirm"
        body="Check the details below before withdrawing this coach. Their status changes to no longer participating, and their records are kept per their consent."
        confirmLabel="Withdraw coach"
        cancelLabel="Go back"
        destructive
        /* Belt and braces on the flow's own invariant. Step 1's Continue is
           already gated on every consumer being placed, so this should never
           bite through the UI — but `commit` skips an unplaced consumer, and
           the state that would produce (a withdrawn coach still holding a
           consumer) is precisely what this step exists to prevent. Cheaper to
           make it unreachable than to detect it later. */
        confirmDisabled={!allPlaced}
        panelClassName={WITHDRAW_PANEL}
        footerClassName={WITHDRAW_FOOTER}
        contentClassName={WITHDRAW_CONTENT}
        onConfirm={commit}
        onClose={() => setStep('reason')}
      >
        {/* Direct instruction: the reason sits directly under the title, as a
            bulleted point, and the caseload table follows a clear gap below —
            the withdrawal is what this screen confirms, and where the
            consumers land is the consequence of it, so that is the order they
            read in. The table is the same one step 1 filled in, with each
            consumer's new coach in place of the picker: confirming against
            the shape you just completed beats confirming against a recap
            worded differently. Both tables render the consumer through
            `consumerCell`, so they cannot drift. */}
        <div className="flex flex-col gap-6 py-2">
          <div className="flex flex-col gap-2">
            <p className="text-fine text-ink-faint">Reason for withdrawal</p>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li className="text-caption text-ink">{reasonPrimary || reason}</li>
              {extraComments && (
                <li className="text-caption text-ink">
                  <span className="text-ink-faint">Additional comments:</span> {extraComments}
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <p id="withdraw-summary-heading" className="text-fine text-ink-faint">
              Where each consumer goes
            </p>
            <div className="max-h-[300px] overflow-auto rounded-lg border border-parchment shadow-card">
              <table
                aria-labelledby="withdraw-summary-heading"
                className="w-full min-w-[440px] border-collapse text-left"
              >
                <thead className="sticky top-0 z-10">
                  <tr className="bg-purple-50">
                    <th scope="col" className="px-4 py-3 text-caption-medium text-ink">
                      Consumer
                    </th>
                    <th scope="col" className="px-4 py-3 text-caption-medium text-ink">
                      New assigned coach
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dyads.map((d) => (
                    <tr key={d.id} className="border-t border-hairline align-middle">
                      <th scope="row" className="px-4 py-3 text-left font-normal">
                        {consumerCell(d)}
                      </th>
                      <td className="px-4 py-3 text-caption text-ink">
                        {targetName(targets[d.id])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </>
  )
}

/** The complete coach record, four stacked `purple-50`-header cards with
 *  `RecordRowDivider` rows — **Study details** (the study-participation
 *  facts: Coach ID, enrolment date, certification, plus the Withdraw coach
 *  action — direct instruction, matching the trainee record page's own
 *  "Study information" card being first and carrying the withdraw button),
 *  then Personal details (identity/contact), Professional details
 *  (aged-care employment facts), then Notification preferences (a coach
 *  also gets the same card the consumer record page's own Profile details
 *  tab has, `DyadNotificationPreferencesCard`). No invitation/joined status
 *  here — that framing only applied while the coach was being onboarded
 *  into SPACES. */
function ProfileDetailsTab({ coach }: { coach: Coach }) {
  const { consumerDyads, updateContact, updateCoachNotificationPreferences } = useResearch()
  const dyads = consumerDyads.filter((d) => d.coachId === coach.id)

  /** Focus target after a withdrawal — see `WithdrawCoachDialog.onWithdrawn`.
   *  The Study details heading is the right landing place: it is the card
   *  whose contents just changed, and unlike the trigger it survives the
   *  change. */
  const studyHeadingRef = useRef<HTMLHeadingElement>(null)
  const [editingContact, setEditingContact] = useState(false)
  const [email, setEmail] = useState(coach.email)
  const [phone, setPhone] = useState(coach.phone)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  // The "Edit details" trigger unmounts the moment `editingContact` flips —
  // the same focus-to-`<body>` bug class this project has shipped in six
  // separate rounds (most recently the trainee record page's identical
  // "Edit details" toggle, confirmed still present live). Fixed here rather
  // than left to recur a seventh time: focus the email field on entering
  // edit mode, and hand it back to the trigger button on cancel.
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

  // Study details — the facts that belong to this coach's participation in
  // the study itself, mirroring the trainee record page's "Study
  // information" card (Participant ID / Current stage / Enrolment date):
  // there's no "Current stage" once a coach is certified and delivering
  // SPACES, so Certification takes that slot instead.
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

  /* Labels are the Notion brief's own wording (coach profile details tab:
     "Add Aged-care organisation, Role at organisation, years of work
     experience at the time of enrolment").

     Renamed on the trainee record page and in the onboarding wizard in the
     same pass, because the brief also says this tab is "same as trainee" — and
     the three fields were previously called "Partner org" here, "Aged care
     employer" there, and "Years in aged care" in both, which is one field
     under three names across four surfaces.

     ⚠️ The brief asks whether the years figure could be **calculated** from
     the enrolment date. It already is as-at-enrolment — the number is captured
     in `AddCoachTraineeModal` at onboarding and never updated — which is why
     the label says so rather than implying a live figure that would drift as
     the study runs. A real derivation needs a field this data model does not
     have (the date they started in aged care), and computing it would be
     `enrolmentDate - careerStartDate`. Not added: the standing rule for this
     pass is dummy data only, no data-layer work. */
  const professionalFields = [
    { label: 'Aged-care organisation', value: coach.employer },
    { label: 'Role at organisation', value: coach.roleAtEmployer },
    { label: 'Years of work experience at enrolment', value: `${coach.yearsInAgedCare} years` },
  ]

  // Withdraw button classes match the trainee/consumer record pages' own
  // withdraw button exactly (`bg-card` so the pill reads white against the
  // `purple-50` band — the class that was missing here before, which is why
  // it didn't match).
  //
  // The active-caseload gate that used to *disable* this button is gone: it
  // told the researcher what was wrong and gave them no way to fix it from
  // here. The rule itself survives as step 1 of `WithdrawCoachDialog`, which
  // makes them place every consumer with another coach before it will let the
  // withdrawal through — so the button is always live, and the constraint is
  // enforced inside the flow rather than in front of it.
  const withdrawButtonClass = cn(
    'inline-flex h-9 shrink-0 items-center rounded-full border bg-white px-[18px] text-caption-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
    'border-destructive text-destructive hover:bg-destructive/10',
  )

  return (
    <div className="flex flex-col gap-10">
      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2 ref={studyHeadingRef} tabIndex={-1} className="font-display text-title text-ink outline-none">
            Study details
          </h2>
          {withdrawn ? (
            <CoachStatusChip status={coach.status} />
          ) : (
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className={withdrawButtonClass}
            >
              Withdraw coach
            </button>
          )}
        </div>
        {/* Round 47: the shared "title + text field" vocabulary
            (`RecordFields`), applied to every profile-details surface on
            direct instruction. */}
        <RecordFieldList
          className="p-6"
          fields={studyFields.map((f) => ({ key: f.label, label: f.label, value: f.node }))}
        />
        {withdrawn ? (
          <p className="px-6 pb-4 text-caption text-ink-faint">
            {firstName} is no longer participating in the study
            {coach.withdrawalNote ? `. ${coach.withdrawalNote}` : '.'}
          </p>
        ) : null}
      </Card>

      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Personal details</h2>
          {!editingContact && (
            <button
              ref={editContactButtonRef}
              type="button"
              onClick={() => setEditingContact(true)}
              className={OUTLINE_FILLED_BUTTON}
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
            <div className={RECORD_GRID}>
              <RecordInput
                inputRef={emailInputRef}
                id="spaces-contact-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
              />
              <RecordInput
                id="spaces-contact-phone"
                label="Phone"
                type="tel"
                value={phone}
                onChange={setPhone}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
              >
                Save changes
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEmail(coach.email)
                  setPhone(coach.phone)
                  setEditingContact(false)
                }}
                variant="secondary"
                className="shrink-0"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <RecordFieldList
            className="p-6"
            fields={personalFields.map((f) => ({ key: f.label, label: f.label, value: f.value }))}
          />
        )}
      </Card>

      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <div className="flex min-h-16 items-center bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Professional details</h2>
        </div>
        <RecordFieldList
          className="p-6"
          fields={professionalFields.map((f) => ({ key: f.label, label: f.label, value: f.value }))}
        />
      </Card>

      <CoachNotificationPreferencesCard
        coach={coach}
        onSave={(prefs) => updateCoachNotificationPreferences(coach.id, prefs)}
      />

      <WithdrawCoachDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onWithdrawn={() => studyHeadingRef.current?.focus()}
        coach={coach}
        dyads={dyads}
      />
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Consumers Registry                                                        */
/* ------------------------------------------------------------------------ */

/** Editable patient/carer card — the "assign/update consumer details" affordance (plan §2a).
 *  Exported for reuse by the Consumer Management dyad-card (Round 4), which reuses this exact
 *  patient/carer card grammar (design-tokens.md §13/§16 `dyad-card`). */
/* `PersonCard` lived here until Round 46 and now lives in the Consumer Portal
 * as `components/consumer/ConsumerPersonCard.tsx`.
 *
 * It was exported from this file as a shared component, but a grep at close-out
 * found exactly two render sites and both were `ConsumerAccountPage` — no
 * researcher or coach surface had used it for some time. So it was a
 * researcher-styled component with only a consumer caller, which is why the
 * consumer My Profile page was the last one rendering 14px labels, app purple
 * and 36px controls. It moved to where its caller lives and took that portal's
 * own scale with it; nothing here needs it back. */


interface PendingSessionAction {
  session: number
  name: string
  action: 'complete' | 'incomplete'
}

interface PendingUnlock {
  moduleIdx: number
  moduleTitle: string
  session: number
}

/** One row's module status — sessions 2-7 only (the module a session
 *  follows). Collapsed to exactly 3 states per direct instruction (Complete/
 *  Incomplete/Locked) — the finer not-started-vs-in-progress distinction
 *  from `CompletionChip` lives on the Learning Progress tab, where it's the
 *  point; this table only needs to answer "can the coach review this yet."
 *
 *  All 3 states render as the same `Chip` label shape ("Incomplete" gets the
 *  `destructive` tone — a real error-state treatment, not just another
 *  neutral label). "Unlock module" briefly lived in this cell as its own
 *  button, directly under "Locked" — reverted per direct follow-up ("still
 *  don't like the Unlock module CTA below the label, it makes the table
 *  look clunky... too many buttons"): this column is now a pure status
 *  label again, and the actual unlock action moved into the Action column's
 *  overflow menu (see `SessionTracker`'s own row rendering) alongside
 *  "Mark as incomplete" — both are occasional override actions, not the
 *  one thing a coach does on every row, so neither needs a permanently
 *  visible button. */
function ModuleStatusCell({
  dyad,
  session,
  completed,
  manualUnlocks,
}: {
  dyad: ConsumerDyad
  session: number
  completed: SessionCompletionRecord[]
  manualUnlocks: number[]
}) {
  const idx = session - 1
  const mod = CONSUMER_MODULES[idx]
  if (!mod) return <span className="text-caption text-ink-faint">—</span>
  const locked = moduleUnlockState(idx, completed, manualUnlocks) === 'locked'
  const record = dyad.moduleEngagement.find((r) => r.moduleId === mod.id)
  const complete = record?.status === 'completed'
  return (
    <Chip
      tone={locked ? 'muted' : complete ? 'success' : 'destructive'}
      label={locked ? 'Locked' : complete ? 'Complete' : 'Incomplete'}
    />
  )
}

/**
 * The coach's "you have not planned this client's sessions yet" banner —
 * Figma frame `683:2408`, Round 37. Replaces the icon-badge empty state that
 * used to sit inside the Session plan card, and is the entry point into
 * `PlanSessionsModal`.
 *
 * **Coach-only.** Every sentence in it is addressed to the person who does the
 * planning ("your coaching journey", "your step 1"), so the researcher's
 * read-only view of the same tracker keeps its own neutral empty state. This
 * is the `viewerRole` split `SessionTracker` already draws everywhere else.
 *
 * The frame's own numbers, transcribed rather than eyeballed: gap 48,
 * `pl-24 pr-48 py-48`, art 319.89x184.992, text column gap 24 with `px-16`,
 * title-to-body gap 8. Three deliberate substitutions per CLAUDE.md's
 * standing rules:
 *
 *  - The **fill, stroke, radius and shadow are the `Card` component's own
 *    defaults** (16px, 1px `parchment`, the warm `shadow-card`) — the frame
 *    specifies exactly those, so this is `<Card>` recoloured, not a bespoke
 *    box that happens to match today.
 *  - The **CTA is this app's inverted-on-purple pill**, the same one the
 *    consumer and SPACES coach record heroes use, not the frame's own button
 *    chrome. Its 44px height is the frame's; the 36px rule is a floor, not a
 *    cap.
 *  - `leading-[1.4]` on the body is a **local override of `--text-body`'s
 *    app-wide `normal`**. Round 23 established that Figma's `AUTO` and the
 *    browser's `normal` are the same metric, but this style declares an
 *    explicit 1.4 — measured, the frame's 3-line block is 66px, i.e. 22px a
 *    line against 16px text. So it is a real value, not drift.
 *
 * The illustration is the frame's **own exported SVG**, downloaded and
 * committed to `public/illustrations/` (the Round 23 certificate / Round 28
 * enrolment precedent). Never hand-drawn and never a lucide substitute: it is
 * a 62-vector composition, not an icon.
 */
/** The banner's two steps. Copy only — the per-step body is chosen in the
 *  render by `key`, because step 1's detail is a data panel and step 2's is a
 *  pair of controls, which do not share a shape.
 *
 *  Step 2's wording is checked, not asserted: "weekly" is real
 *  (`WEEKLY_CADENCE_DAYS` is the constant `PlanSessionsModal` spaces every
 *  catch-up by), and no session or module *count* appears anywhere, because
 *  `SPACES_CATCHUP_COUNT` is derived and the consumer module list carries an
 *  always-unlocked pre-module ahead of the named ones — a hardcoded number is
 *  the two-surfaces-disagree bug this project keeps hitting. */
const STEPS = [
  {
    key: 'contact' as const,
    title: 'Step 1: Get in touch with your client',
    instruction: 'Call or email them to arrange a time for your onboarding session.',
  },
  {
    key: 'plan' as const,
    title: 'Step 2: Create the session plan together',
    instruction:
      'During the onboarding session, you will decide when the modules become available to your client and when you will both meet for your weekly sessions.',
  },
]

export function SessionPlanEmptyBanner({
  dyad,
  ctaRef,
  onCreate,
}: {
  dyad: ConsumerDyad
  ctaRef: React.RefObject<HTMLButtonElement | null>
  onCreate: () => void
}) {
  const [whyOpen, setWhyOpen] = useState(false)
  /* `items-center` on the row, with `max-lg:items-start` for the stacked
     state: the calendar sits at the vertical centre of the banner on desktop.
     It was moved to `items-start` earlier the same day and moved back by
     direct instruction — both states have been seen live, so this is a
     settled preference rather than an untested default.

     A plain block comment, not a JSX one: this sits beside the root element of
     a `return`, where a JSX comment is a second child with no parent. `tsc`
     catches it, but as a cascade of syntax errors pointing at lines nowhere
     near the cause. And never write a JSX comment's own delimiters inside a
     block comment — the closing pair ends the comment early, which is a second,
     even noisier cascade. */
  return (
    /* Round 40's banner, rebuilt 2026-10-01 from the "option 3" review card
       after a three-way comparison (direct instruction: swap this version in,
       connect all buttons properly). What changed and why:

         - The prose/data/prose sandwich became a **two-step vertical
           timeline**. The old card stated the sequence in a paragraph, put the
           contact details in a panel between two paragraphs, and parked both
           CTAs in a footer ~200px below the sentence explaining when to press
           them. Each step now carries its own detail: contact rows on step 1,
           the buttons on step 2.
         - Contact details lost their `Name:` row — the sub copy names the
           client one line above, and a third mention read as a mail merge.
         - The heading stopped naming what was missing ("No session plan
           created yet") and names what the coach is here to do.

       `items-start`, not `items-center`: the column is taller than it was, and
       a 185px calendar at its vertical midpoint sat ~200px clear of the title
       it belongs with. */
    <Card className="flex-row items-start gap-12 overflow-hidden border-parchment bg-primary py-12 pr-12 pl-6 max-lg:flex-col max-lg:gap-8 max-lg:p-8">
      {/* The wrapper is load-bearing, not tidiness. `Card` carries
          `has-[>img:first-child]:pt-0` and `*:[img:first-child]:rounded-t-xl`
          — media-card rules for artwork meant to bleed to the top edge. A bare
          `<img>` here is that first child and tripped them: measured, the
          banner's top padding came out **0 where the frame says 48**, which
          reads as "the art sits a bit high" rather than as a bug. */}
      <div className="shrink-0 max-lg:w-full">
        <img
          src="/illustrations/session-plan-calendar.svg"
          alt=""
          aria-hidden="true"
          className="h-[184.992px] w-[319.89px] max-lg:h-auto max-lg:w-full max-lg:max-w-[320px]"
        />
      </div>

      {/* `min-w-0` — a flex child defaults to `min-width: auto`, so without it
          the copy sizes the row instead of wrapping inside it. This project has
          shipped a real horizontal page scroll that way three times. */}
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 max-lg:px-0">
        <div className="flex flex-col gap-2 text-white">
          {/* No full stop — direct instruction. "your new client" singular: a
              dyad is ONE client everywhere else in this portal, and the sub
              copy below names both people anyway. "a session plan", not "your"
              — the plan is the client's, made together. */}
          <h3 className="font-display text-display-md text-balance">
            Creating a session plan with your new client
          </h3>
          {/* The sub copy carries the assignment and the shape of what follows
              and stops there; the two steps below say what to do. */}
          <p className="text-body leading-[1.4] text-white/90">
            You have been assigned{' '}
            <strong className="font-bold text-white">
              {dyad.patient ? `${dyad.patient.name} and ${dyad.carer.name}` : dyad.carer.name}
            </strong>
            . There are two steps before your first session.
          </p>
        </div>

        {/* The vertical timeline. The dotted rule is a painted
            `repeating-linear-gradient`, NOT `border-dotted`: CSS derives a
            dotted border's dot spacing from its width, so stroke and gap cannot
            be set independently. 1.5px wide, 3px of ink then 8px of nothing.
            It rides a zero-height flex child that absorbs the row's slack, so
            it always reaches from one marker to the next however much copy a
            step carries — a fixed height breaks the moment an email wraps. */}
        <ol className="flex flex-col">
          {STEPS.map((step, i) => (
            <li key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                {/* 40px, `yellow-200`, `ink` numeral. Never white on these
                    tints — they are light enough that white fails AA on all of
                    them, which is why the record-page hero's active tab
                    underline uses the same pairing. */}
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-200 text-body-md text-ink"
                >
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="w-[1.5px] flex-1 bg-[repeating-linear-gradient(to_bottom,#ffffff66_0_3px,transparent_3px_11px)]"
                  />
                )}
              </div>
              {/* NOT `last:pb-0`. `last:` is `:last-child` against the `<li>`,
                  where this content column IS the last child — so the modifier
                  matched every step and zeroed the gap on all of them. Two
                  separate "increase the spacing" passes moved a number that was
                  being overridden. Keyed on the index instead. The 64px lives
                  INSIDE the row so the dotted rule spans it; a `gap` on the
                  `<ol>` would leave the line broken between steps. */}
              <div
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-start gap-2',
                  i < STEPS.length - 1 && 'pb-16',
                )}
              >
                <p className="text-body-md text-white">{step.title}</p>
                <p className="text-body leading-[1.4] text-white/90">{step.instruction}</p>
                <div className="mt-2">
                  {step.key === 'contact' ? (
                    /* A white card with a `yellow-200` stroke, tying it to the
                       markers beside it, and `purple-50` value fields. `w-fit`
                       so it hugs its two rows; `max-w-full` so the hug can
                       never become an overflow, since an email is one long
                       unbreakable token. Equal field width falls out of the
                       grid rather than a number — the `1fr` track sizes to the
                       longer value and both rows share it. */
                    <div className="w-fit max-w-full rounded-sm border border-yellow-200 bg-white p-4 shadow-[0_2px_4px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.18)]">
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 leading-[1.4]">
                        <dt className="flex items-center text-body text-ink-muted">Email:</dt>
                        <dd className="min-w-0 rounded-xs bg-purple-50 px-3 py-2 text-body-md break-words text-ink">
                          {/* "Not provided" rather than an em dash: this
                              audience reads a dash as a missing value it should
                              go hunting for. */}
                          {dyad.carer.email ?? 'Not provided'}
                        </dd>
                        <dt className="flex items-center text-body text-ink-muted">Phone:</dt>
                        <dd className="min-w-0 rounded-xs bg-purple-50 px-3 py-2 text-body-md break-words text-ink">
                          {dyad.carer.phone ?? 'Not provided'}
                        </dd>
                      </dl>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4">
                      {/* `ctaRef` stays on this button: `DeliveryConsumerDetailPage`
                          and `SessionTracker` both focus it when the wizard
                          closes, and dropping the ref would land focus on
                          `<body>` — this project's most-repeated defect. */}
                      <Button
                        ref={ctaRef}
                        type="button"
                        onClick={onCreate}
                        tone="inverse"
                        className="min-w-[232px]"
                      >
                        Create session plan
                      </Button>
                      {/* Opens the real explanation below, not an unwired
                          control: the answer is domain knowledge the product
                          already holds, so a button that asks a question and
                          then does nothing would be the worst option. */}
                      <Button
                        type="button"
                        onClick={() => setWhyOpen(true)}
                        variant="secondary"
                        tone="inverse"
                        className="min-w-[232px]"
                      >
                        Why is this necessary?
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Round 40, direct instruction: rebuilt. The first pass was a narrow
          `ConfirmDialog` with three long bullets that each argued a mechanism —
          it answered "how the plan works" when the question on the button is
          "why do I have to do this, and what happens next".

          Now two short sections with a heading each: **why** and **what to
          expect**. Wider panel (560 -> 720) so a line is a readable length
          rather than four words, and the banner's own calendar artwork with the
          debrief doodles around it, so the modal is visibly the same object the
          coach pressed the button on.

          Spacing is the app's own scale throughout: 32px between the artwork
          and the copy, 24px between the two sections, 8px between a heading and
          its lines, 12px between lines. No one-off values. */}
      <ConfirmDialog
        open={whyOpen}
        title="Why you plan sessions first"
        body="A short plan up front is what the whole programme runs on."
        confirmLabel="Close"
        cancelLabel="Close"
        singleAction
        /* Round 40, direct instruction: wider (720 -> 840) with more room around
           the content — but **the panel keeps `ConfirmDialog`'s own `p-6`**.
           `MODAL_FOOTER_SURFACE_COMPACT` bleeds the footer edge-to-edge with
           `-mx-6 -mb-6`, sized to exactly that padding; raising the panel to
           `p-10` left a 16px white margin around the grey footer bar. The extra
           breathing room is added to the *content* instead (`px-4 pb-4` below),
           which is what was asked for and leaves the footer flush. */
        panelClassName="w-full max-w-[840px]"
        onConfirm={() => setWhyOpen(false)}
        onClose={() => setWhyOpen(false)}
      >
        {/* 32px below the dialog's own sub-line — `ConfirmDialog` puts no gap
            between its body text and its children, so the artwork was sitting
            directly under the sentence. */}
        <div className="mt-8 flex flex-col gap-10 px-4 pb-4 md:flex-row md:items-start">
          {/* Decorative — every word of the meaning is in the copy beside it.
              The doodles are positioned as percentages of the artwork box, so
              they hold their arrangement at any width. */}
          {/* The doodles sit **inside** the artwork's own box, not on negative
              insets. The dialog panel clips its content, so anything hung off
              the outside edge was being cut — which is what "image getting
              cropped" was. The box is padded instead and every doodle is
              positioned within 0-100% of it, so nothing can leave. */}
          <div
            aria-hidden="true"
            className="relative mx-auto w-[260px] shrink-0 px-6 py-5 md:mx-0"
          >
            <img src="/illustrations/session-plan-calendar.svg" alt="" className="w-full" />
            <img
              src="/illustrations/debrief/doodle-cloud.svg"
              alt=""
              className="absolute left-0 top-0 w-[20%]"
            />
            <img
              src="/illustrations/debrief/doodle-check.svg"
              alt=""
              className="absolute right-0 top-[28%] w-[18%]"
            />
            <img
              src="/illustrations/debrief/doodle-sparkle.svg"
              alt=""
              className="absolute bottom-0 left-[8%] w-[12%]"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <section className="flex flex-col gap-2">
              <h3 className="text-body-md text-ink">Why it is necessary</h3>
              {/* `/design:ux-copy`, Round 40, direct instruction. The previous
                  line ("Modules unlock off the plan") described a mechanism and
                  led with the system, so a coach had to work out what the plan
                  *was* before the sentence made sense. This leads with the two
                  people and the two decisions they make together, which is what
                  the plan actually is, and puts the consequence last. */}
              <p className="text-body text-ink-muted">
                You and your client agree this together: when each module becomes available to
                them, and when the two of you meet to talk it through. Nothing opens up for them
                until it is set.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-body-md text-ink">What to expect</h3>
              <ul className="flex list-disc flex-col gap-3 pl-5 text-body text-ink-muted">
                <li>Three questions, together with your client. It takes a few minutes.</li>
                {/* Catch-up first, then modules — that is `PlanSessionsModal`'s own
                    step order ("Catch-up meeting" then "Module unlock day").
                    The line had it the other way round, so a coach reading this
                    and then opening the wizard met the questions in the
                    opposite order to the one they had just been promised. */}
                <li>You pick a day to catch up and a day for modules, and we build the dates.</li>
                {/* The wizard's real last step is Review, where every date is
                    editable before anything is saved — so "review, personalise
                    and confirm" is what happens, and "you can change it later"
                    is the reassurance that follows it rather than the whole
                    point. */}
                <li>
                  Review the plan, personalise it and confirm. You can change it later too.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </ConfirmDialog>
    </Card>
  )
}

/** A real `<table>` — direct instruction reverting the several intervening
 *  redesigns (a vertical timeline, then a 3-mini-card-per-session grid) as
 *  "overwhelming, and too cluttered... I want to revert back to a very
 *  simple table version," with an explicit column list: Session Number /
 *  Date / Time / Module status / Session Link / Action button. No rail, no
 *  markers, no cards — plain rows. Two things carried forward from the
 *  intervening rounds because they're real fixes, not style: **Session 0
 *  (Planning) still isn't its own row** — it has no module of its own and
 *  reads as a mismatched entry next to 6 real module catch-ups;
 *  `PlanSessionsModal.handleSubmit` marks it complete automatically the
 *  moment a plan is first created (see its own comment there), so there's
 *  no dangling way to complete it that this table would otherwise need to
 *  expose. And the **Session Link column goes quiet once a session is
 *  done** (direct user question: "if session 1 is complete, then why still
 *  there is a join zoom session?") — each row's `zoomLink` is its own
 *  one-time meeting id, never a shared recurring link, so there's nothing
 *  left to rejoin once the session has happened.
 *
 *  No certification gate (SPACES sessions have no lock-on-Pass equivalent).
 *  Session planning (Round 14) is still this card's entry point for
 *  planning the whole arc via `PlanSessionsModal`.
 *
 *  Exported for direct reuse by the Coach Delivery Portal's per-consumer
 *  detail page (Round 6.2) — the coach's own interactive tracker, now
 *  surfaced from the coach's own portal in addition to this Coaches area.
 *
 *  `viewerRole` (Round 16 continued, direct feedback) distinguishes the two
 *  reuse sites: a coach can't undo their own already-submitted completion
 *  ("Mark as incomplete" is researcher-only, an override for correcting
 *  mistakes after the fact — not part of a coach's normal workflow) and
 *  can't mark a session complete before its own scheduled date has arrived
 *  (that restriction applies regardless of viewer, since a session that
 *  hasn't happened yet has nothing to confirm). */
export function SessionTracker({
  dyad,
  viewerRole = 'researcher',
  className,
}: {
  dyad: ConsumerDyad
  viewerRole?: 'researcher' | 'coach'
  /**
   * Extra classes for the card itself. Additive — every existing caller omits
   * it and keeps the `self-start` width below byte-identical. The coach's
   * client page passes `self-stretch` because this card is the only thing in
   * its row there and shrink-to-fit left it 434px inside a 1120px column.
   */
  className?: string
}) {
  const { sessionCompletion, toggleSession, sessionPlans, manualModuleUnlocks, unlockModuleManually } =
    useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]
  const planned = isPlanSet(plan)
  const unlocks = manualModuleUnlocks[dyad.id] ?? []
  const [pending, setPending] = useState<PendingSessionAction | null>(null)
  const [pendingUnlock, setPendingUnlock] = useState<PendingUnlock | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)

  // Accessibility: the "Mark complete" button ↔ kebab-menu swap after a
  // complete/incomplete confirm changes the row's own action control, so
  // `ConfirmDialog`'s own trigger-focus-return has nothing left to restore
  // focus to — land on the row's own (otherwise non-interactive,
  // `tabIndex={-1}`) heading instead, same pattern as `BlockSlide`'s
  // per-slide heading focus.
  const rowHeadingRefs = useRef<Record<number, HTMLParagraphElement | null>>({})
  const planCtaRef = useRef<HTMLButtonElement>(null)

  /** Focus a session row's heading once that row actually exists.
   *
   *  Round 38 fix, found by polling `activeElement` after a real save: the
   *  create-plan paths used a single `requestAnimationFrame`, assuming the
   *  next frame already had the table branch committed. It is a race, and it
   *  loses often enough to reproduce — saving a plan left focus on `<body>`
   *  with the row heading present and focusable the whole time. Saving swaps
   *  a whole branch (empty-state banner -> table), so the ref genuinely does
   *  not exist yet when the wizard calls back.
   *
   *  Retries across frames and keys on the ELEMENT rather than a frame count,
   *  which is this project's own standing rule (`design-tokens.md`; the
   *  Round 32 coachmark bug). Bounded so a target that never mounts cannot
   *  spin forever. */
  const focusRowHeading = (session: number, framesLeft = 10) => {
    requestAnimationFrame(() => {
      const el = rowHeadingRefs.current[session]
      if (el) {
        el.focus()
        return
      }
      if (framesLeft > 0) focusRowHeading(session, framesLeft - 1)
    })
  }

  /* A coach with nothing planned gets the Round 37 banner *instead of* the
     card, not inside it: the banner is itself a `<Card>` with the frame's own
     purple fill, and nesting it in this one would paint a white ring around
     it. Returning early also keeps the branch honest — there is no header, no
     table and no completion machinery to render in this state, only the way
     in to the wizard. The researcher's read-only view falls through to the
     normal card below and keeps its own empty state. */
  if (!planned && viewerRole === 'coach') {
    return (
      <div className={className}>
        <SessionPlanEmptyBanner
          dyad={dyad}
          ctaRef={planCtaRef}
          onCreate={() => setWizardOpen(true)}
        />
        <PlanSessionsModal
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          dyad={dyad}
          /* Saving flips `planned`, so the next paint is the table branch
             below and this ref resolves — same first-real-row target the
             card's own wizard mount uses (internal session 2). */
          onSaved={() => focusRowHeading(2)}
        />
      </div>
    )
  }

  return (
    <Card className={cn('gap-0 self-start rounded-lg py-0', className)}>
      {/* Always shown in this branch. The one case that used to hide it — a
          coach with nothing planned — now returns the Round 37 banner above
          and never reaches here. */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card-header p-6">
        <div>
          {/* Session planning is the coach's own workflow with their consumer
              — a researcher is viewing it, not running it, so this card gets
              its own read-only title/subtitle rather than reusing the
              coach-directed copy verbatim ("Mark each session complete as it
              happens" reads as an instruction to the viewer, which isn't true
              for a researcher). Third-person, no personal names — matches
              this file's own existing "this coach's SPACES caseload" pattern
              (Consumer caseload card) rather than naming the coach or
              consumer directly. */}
          <h3 className="font-display text-title">
            {viewerRole === 'coach' ? 'Session plan' : "Coach's session plan"}
          </h3>
          <p className="mt-1 text-caption text-ink-muted">
            {viewerRole === 'coach'
              ? planned
                ? 'Mark each session complete as it happens.'
                : 'No sessions planned yet.'
              : planned
                ? "This coach's planned and completed sessions."
                : "This coach hasn't planned any sessions yet."}
          </p>
        </div>
        {/* Editing (and, below, creating) a plan is a coach-only action — a
            researcher can review it here but not change it. */}
        {planned && viewerRole === 'coach' && (
          <Button
            type="button"
            onClick={() => setWizardOpen(true)}
            variant="secondary"
            className="shrink-0"
          >
            Edit plan
          </Button>
        )}
      </div>

      <div className="border-t border-hairline">
        {!planned ? (
          /* Researcher-only by construction: a coach with no plan returned the
             banner above. So this state describes rather than instructs, and
             carries no CTA — a researcher cannot create a plan.

             Worth knowing before touching it: **no live surface reaches this
             today.** Since Round 25 `DyadSection` swaps a researcher onto
             `SessionsPlanOverview` entirely, so both `<SessionTracker>` call
             sites in the app are coach-role. It is kept as the honest
             rendering of this component's own `viewerRole='researcher'`
             default rather than deleted, since deleting it would leave that
             default painting an empty card. */
          <div className="flex flex-col items-center gap-3 bg-white p-6 py-10 text-center">
            <span
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-full bg-primary/15"
            >
              <CalendarPlus className="size-7 text-primary" />
            </span>
            <div>
              <p className="text-body font-semibold text-ink">No session plan yet</p>
              <p className="mx-auto mt-1 max-w-sm text-caption text-ink-faint">
                Catch-up sessions can&rsquo;t be scheduled until the coach has planned when each
                module unlocks and when they&rsquo;ll meet with the consumer.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  <th scope="col" className="px-4 py-3 text-caption-medium text-ink-muted">
                    Session number
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption-medium text-ink-muted">
                    Date &amp; time
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption-medium text-ink-muted">
                    Module status
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption-medium text-ink-muted">
                    Session link
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption-medium text-ink-muted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Session 0 (Planning) excluded — see this component's own doc
                    comment above for why, and `PlanSessionsModal.handleSubmit`
                    for where its completion now happens instead. */}
                {SPACES_SESSIONS.filter((s) => s.number >= 2).map((session, i) => {
                  const record = completed.find((c) => c.session === session.number)
                  const done = !!record
                  const row = plan?.sessions.find((s) => s.session === session.number)
                  const displayNumber = displaySessionNumber(session.number)
                  const idx = session.number - 1
                  const mod = CONSUMER_MODULES[idx]
                  const locked = mod ? moduleUnlockState(idx, completed, unlocks) === 'locked' : false
                  // A coach can't mark a session complete before its own
                  // scheduled date — nothing to confirm yet. Applies to both
                  // viewers; there's no "researcher override" for this one
                  // since it's not a mistake to correct, just a date that
                  // hasn't arrived.
                  const isFuture = !!row?.date && row.date > TODAY
                  // Only one action reads as "the thing to do on this row" — Mark
                  // session complete. Unlock module / Mark as incomplete are both
                  // occasional overrides, so they live behind a kebab instead of
                  // their own permanent buttons (direct follow-up: "too many
                  // buttons making the table confusing... button styles should be
                  // based on their importance"). The kebab itself only renders
                  // when there's actually something in it — and "Mark as
                  // incomplete" is a researcher-only override (direct feedback:
                  // a coach shouldn't be able to undo their own completion), so
                  // for a coach viewer it drops out of the menu entirely once
                  // that's the only thing that would've been in it.
                  const canMarkIncomplete = done && viewerRole !== 'coach'
                  const hasOverflow = locked || canMarkIncomplete
                  return (
                    <tr key={session.number} className={cn(i > 0 && 'border-t border-hairline')}>
                      <td className="px-4 py-3 align-top">
                        <p
                          ref={(el) => {
                            rowHeadingRefs.current[session.number] = el
                          }}
                          tabIndex={-1}
                          className={cn(
                            'flex flex-wrap items-center gap-2 text-caption font-semibold outline-none',
                            done ? 'text-ink' : 'text-ink-muted',
                          )}
                        >
                          Session {displayNumber}
                          {row?.rescheduled && !done && <Chip tone="muted" label="Rescheduled" />}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top text-caption text-ink-muted">
                        {row?.date ? `${formatDate(row.date)}, ${formatTime(row.time ?? '00:00')}` : '—'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ModuleStatusCell dyad={dyad} session={session.number} completed={completed} manualUnlocks={unlocks} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        {done ? (
                          <span className="text-caption text-ink-faint">Session held</span>
                        ) : row?.zoomLink ? (
                          <a
                            href={row.zoomLink}
                            target="_blank"
                            rel="noreferrer"
                            className="relative inline-flex w-fit items-center gap-1 text-caption font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Video aria-hidden="true" className="size-3.5" />
                            Join Zoom
                            <span className="sr-only"> for Session {displayNumber}</span>
                          </a>
                        ) : (
                          <span className="text-caption text-ink-faint">No link yet</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 align-top text-right"
                      >
                        <div className="flex items-center justify-end gap-2">
                          {!done && isFuture && (
                            <Button
                              type="button"
                              aria-disabled="true"
                              variant="secondary"
                              tone="neutral"
                              state="deactive"
                              className="relative shrink-0"
                            >
                              Mark session complete
                              <span className="sr-only">
                                {' '}
                                for Session {displayNumber}. Available once{' '}
                                {row?.date ? formatDate(row.date) : 'the scheduled date'} has passed
                              </span>
                            </Button>
                          )}
                          {!done && !isFuture && (
                            <Button
                              type="button"
                              onClick={() =>
                                setPending({ session: session.number, name: session.name, action: 'complete' })
                              }
                              variant="secondary"
                              tone="neutral"
                              className="relative shrink-0"
                            >
                              Mark session complete
                              <span className="sr-only"> for Session {displayNumber}</span>
                            </Button>
                          )}
                          {hasOverflow && (
                            <Menu.Root>
                              <Menu.Trigger
                                aria-label={`More actions for Session ${displayNumber} (${session.name})`}
                                className="flex size-9 shrink-0 items-center justify-center rounded-sm text-ink-faint outline-none transition-colors hover:bg-pearl hover:text-ink focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                              >
                                <MoreVertical aria-hidden="true" className="size-4" />
                              </Menu.Trigger>
                              <Menu.Portal>
                                <Menu.Positioner side="bottom" align="end" className="z-50 outline-none">
                                  <Menu.Popup className="min-w-[200px] rounded-sm bg-card p-1 text-caption shadow-card ring-1 ring-hairline outline-none">
                                    {locked && mod && (
                                      <Menu.Item
                                        onClick={() =>
                                          setPendingUnlock({ moduleIdx: idx, moduleTitle: mod.title, session: idx })
                                        }
                                        className="flex min-h-9 cursor-pointer items-center rounded-sm px-3 text-ink-muted outline-none data-[highlighted]:bg-pearl data-[highlighted]:text-ink"
                                      >
                                        Unlock module
                                      </Menu.Item>
                                    )}
                                    {canMarkIncomplete && (
                                      <Menu.Item
                                        onClick={() =>
                                          setPending({
                                            session: session.number,
                                            name: session.name,
                                            action: 'incomplete',
                                          })
                                        }
                                        className="flex min-h-9 cursor-pointer items-center rounded-sm px-3 text-ink-muted outline-none data-[highlighted]:bg-pearl data-[highlighted]:text-ink"
                                      >
                                        Mark as incomplete
                                      </Menu.Item>
                                    )}
                                  </Menu.Popup>
                                </Menu.Positioner>
                              </Menu.Portal>
                            </Menu.Root>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create (no plan yet) and Edit (plan already active) are two
          deliberately separate components, not one wizard reopened at a
          different step — see `EditSessionPlanModal`'s own doc comment for
          why. `planned` can't change while either is open (saving one
          closes it before the other could ever matter), so gating `open`
          this way is safe. */}
      <PlanSessionsModal
        open={wizardOpen && !planned}
        onClose={() => setWizardOpen(false)}
        dyad={dyad}
        onSaved={() =>
          // Session 0 (Planning) no longer has its own row/ref in this
          // timeline (its own completion now happens automatically, inside
          // the wizard itself) — the first real row is internal session 2.
          focusRowHeading(2)
        }
      />
      {/* No `onSaved` focus override here, unlike the create-flow wizard
          above: that one always lands on the first real row because saving
          it is the first time any row exists at all — a fixed target is the
          only sensible one. Editing an *existing* plan can touch any subset
          of its 6 rows in one save, so there's no single "the row that
          changed" to jump to; a hardcoded `rowHeadingRefs.current[2]` here
          previously sent focus to Session 1's heading even when e.g. Session
          4 was the row actually edited — a real, reproduced defect (Round
          17.1 accessibility review). Leaving `onSaved` unset falls back to
          this modal's own built-in, already-correct trigger-focus-return
          (back to "Edit plan"), matching Round 16's verified behavior. */}
      <EditSessionPlanModal
        open={wizardOpen && planned}
        onClose={() => setWizardOpen(false)}
        dyad={dyad}
      />

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.action === 'complete'
            ? `Mark Session ${pending && displaySessionNumber(pending.session)} complete?`
            : `Mark Session ${pending && displaySessionNumber(pending.session)} as incomplete?`
        }
        body={
          pending?.action === 'complete'
            ? `Confirms Session ${displaySessionNumber(pending.session)} (${pending.name}) is done for ${dyadTitle(dyad)}.`
            : `Reverts Session ${pending && displaySessionNumber(pending.session)} (${pending?.name}) to not yet complete for ${dyadTitle(dyad)}.`
        }
        confirmLabel={pending?.action === 'complete' ? 'Mark complete' : 'Mark as incomplete'}
        cancelLabel="Cancel"
        destructive={pending?.action === 'incomplete'}
        onConfirm={() => {
          if (pending) {
            const session = pending.session
            toggleSession(dyad.id, session)
            requestAnimationFrame(() => rowHeadingRefs.current[session]?.focus())
          }
          setPending(null)
        }}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        open={pendingUnlock !== null}
        title={`Unlock ${pendingUnlock?.moduleTitle} for ${dyadTitle(dyad)}?`}
        body={`This gives ${dyadTitle(dyad)} access to this module before ${
          pendingUnlock &&
          // Session 0 leak fix: Module 1's own unlock trigger is the
          // planning session itself (internal session 1) — `pendingUnlock.
          // session` here IS that trigger's internal number (see the doc
          // comment below), so running it through `displaySessionNumber()`
          // for Module 1 produced "before Session 0 is marked complete,"
          // a session number this app never otherwise shows anyone. Every
          // other module's trigger is a real, numbered catch-up, so only
          // this one case needs the special phrasing.
          (pendingUnlock.session === 1
            ? 'the planning session is completed'
            : `Session ${displaySessionNumber(pendingUnlock.session)} is marked complete`)
        }. Normally that's what unlocks it.`}
        confirmLabel="Unlock module"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (pendingUnlock) {
            // Accessibility fix (Round 14.1): confirming removes the row's own
            // "Locked · Unlock module" trigger (it flips to a status chip in
            // the same commit), so `ConfirmDialog`'s generic trigger-focus-
            // return has nothing left to restore focus to — same underlying
            // gap as the Mark-complete/incomplete flow below, same fix:
            // land on that row's own heading instead. `pendingUnlock.session`
            // is the module's array index (`idx`), i.e. one less than the
            // triggering row's internal session number.
            const targetSession = pendingUnlock.session + 1
            unlockModuleManually(dyad.id, pendingUnlock.moduleIdx)
            requestAnimationFrame(() => rowHeadingRefs.current[targetSession]?.focus())
          }
          setPendingUnlock(null)
        }}
        onClose={() => setPendingUnlock(null)}
      />
    </Card>
  )
}

/** Consolidated replacement for this tab's own PLE/Carer/overview view —
 *  identity (Name/Email/Phone) is read-only, since that stays owned by the
 *  research coordinator via `PersonCard` on the Consumer Management side.
 *  Deliberately local rather than a fork of `PersonCard` — that stays
 *  untouched since Consumer Management and the Consumer Portal's own
 *  Account page still reuse it for their own editable views.
 *
 *  Redesigned per direct feedback that repeating Background/Sleep
 *  goals/Caregiving context/Additional notes as four separate structured
 *  fields per person read as repetitive and hard to scan. They're folded
 *  into one shared, editable "Notes" section instead — editing it writes
 *  the whole merged text back to `dyad.notes` (the one genuinely freeform
 *  field), not back to the original structured fields individually.
 *
 *  Exported for direct reuse by the Consumer Management detail view's own
 *  Overview tab — the same consolidated identity/notes card, viewed from
 *  the consumer's own page instead of the coach's. */
export function ConsumerDetailsCard({
  dyad,
  /** Renders the card's contents without the `Card` chrome or its own
   *  `purple-50` title band — for the "View consumer details" slide-in panel,
   *  whose own header already carries that title on the same tint. A flag
   *  rather than a fork: it strips chrome, it does not change what the card
   *  is or how any other caller reads. */
  bare = false,
  viewerRole = 'researcher',
}: {
  dyad: ConsumerDyad
  bare?: boolean
  /** The person receiving coaching is a "consumer" to a researcher and a
   *  "client" to a coach (CLAUDE.md terminology). This card renders in both
   *  portals, so the title cannot be hardcoded. */
  viewerRole?: 'researcher' | 'coach'
}) {
  const { updateDyadCoachNotes } = useResearch()
  const [editingNotes, setEditingNotes] = useState(false)

  // `dyad.coachNotes` is a field of its own (Round 11 design-critique fix) —
  // deliberately never written back into `dyad.notes` ("Additional notes"),
  // a separate legacy field other surfaces may still read. Saving here
  // used to overwrite that shared field with this merged blob, corrupting
  // it everywhere else the moment a coach edited this card once. Once a
  // coach note has been saved, it's the single source of truth here — only
  // seed from the legacy structured fields (background/sleep goals/
  // caregiving context/notes) the first time, so a save doesn't re-combine
  // and duplicate them on every future render.
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

  const body = (
      <div className={cn(bare ? 'pt-0' : 'border-t border-hairline p-6 pt-4')}>
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
              className={OUTLINE_FILLED_BUTTON}
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
              <Button
                type="submit"
              >
                Save changes
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setNotesText(seedNotes())
                  setEditingNotes(false)
                }}
                variant="secondary"
              >
                Cancel
              </Button>
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
  )

  if (bare) return body

  return (
    <Card className="gap-0 overflow-hidden rounded-lg py-0">
      <div className="bg-purple-50 p-6">
        <h2 className="font-display text-title text-ink">
          {viewerRole === 'coach' ? 'Client details' : 'Consumer details'}
        </h2>
      </div>
      {body}
    </Card>
  )
}

/** Fitbit Sync Monitor (Round 6.2.1's fold-in of the old "Health Data Hub"
 *  tab) was removed from this tab per direct feedback — a coach reviewing
 *  their own caseload here doesn't need the Fitbit sync/diary log; that
 *  data still lives on the Consumer Management side.
 *
 *  Exported for direct reuse by the Coach Delivery Portal's own Overview
 *  tab, which needs the identical Consumer Details + Session tracker pairing
 *  rather than a forked copy. `viewerRole` passes straight through to
 *  `SessionTracker` — see its own doc comment. */
export function DyadSection({
  dyad,
  viewerRole = 'researcher',
}: {
  dyad: ConsumerDyad
  viewerRole?: 'researcher' | 'coach'
}) {
  return (
    <div className="flex flex-col gap-10">
      <ConsumerDetailsCard dyad={dyad} viewerRole={viewerRole} />
      {/* Round 25, direct instruction. A **researcher** gets the read-only
          "Sessions plan overview" table, moved here off the Consumer
          Management record page; a **coach** keeps `SessionTracker`.
          The split exists because researchers are not allowed to mark a
          session complete, and that write path — Mark session complete / Mark
          as incomplete / Unlock module / Join Zoom — is the whole reason
          `SessionTracker` exists. Rendering it to a researcher offered actions
          they should not have; this is a real conditional swap, not a disabled
          state. `SessionTracker` itself is untouched and still serves the
          Coach Delivery Portal, where marking a session complete is the
          point. */}
      {viewerRole === 'coach' ? (
        <SessionTracker dyad={dyad} viewerRole={viewerRole} />
      ) : (
        <SessionsPlanOverview dyad={dyad} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Assigned Consumers — study progress for one pairing (frame `306:155`)      */
/* ------------------------------------------------------------------------ */

/** Whole days between two ISO dates. Local rather than imported: the only
 *  other copy lived unexported inside `ResearchNotificationHub`, deleted in the
 *  researcher-dashboard UI pass. */
function daysBetweenDates(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** Frame node `297:1952` — 5 KPI tiles. Every value derived; the frame's own
 *  numbers disagree with its own table (it shows "Next session 16 Aug 2026",
 *  which is Module 3's *completion* date, while its table has Session 4 on
 *  2 Sep; and "Days in study 12" against a Session 1 held 22 Jul). */
function StudyProgressKpis({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const held = catchupSessionsCompleted(completed)
  const modulesDone = dyad.moduleEngagement.filter((m) => m.status === 'completed').length
  const next = nextUpcomingSessionEntry(sessionPlans[dyad.id], completed, dyad.upcomingSession)
  const daysIn = dyad.coachAssignedDate ? daysBetweenDates(dyad.coachAssignedDate, TODAY) : undefined

  return (
    /* Two columns (direct instruction: "KPIs stack 2x2"), because this grid
       now shares its row with the attention panel and five tiles across left
       each about 110px, clipping their own labels.
       Five tiles over two columns would leave a ragged empty cell in the last
       row — the gap flagged directly on a screenshot — so the fifth tile spans
       both columns instead. The block stays a clean rectangle at every
       breakpoint, and no tile is dropped to make the arithmetic work. */
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*:last-child]:sm:col-span-2">
      {/* An absent value renders an em dash, not a wordy placeholder
          ("None scheduled" / "Not started" / "Not yet") — direct instruction,
          and it matches how every table on the three record pages already
          renders a missing cell. */}
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
      {/* Was a Shared / Not shared status. Direct instruction (Notion, study
          progress tab): "in the session reflection, remove the shared. All
          reflections will be seen by researcher by default" — which leaves a
          status tile reporting a distinction that no longer exists. It now
          counts, in the same "x of y" form as the coach-level tile on the
          Overview tab, against sessions actually held: one SIPTEA reflection
          is owed per session, so a coach who is up to date reads "3 of 3". */}
      <StatCard
        label="Session reflections"
        value={`${dyad.annotationSummaries.length} of ${held}`}
        icon={NotebookPen}
      />
    </div>
  )
}

/** Frame node `297:3495` — two labelled groups, separated by a `hairline` rule.
 *
 * Round 47. Three direct instructions, all from a live annotation:
 *   1. **"Average length" removed.** Also the Notion brief's own wording:
 *      *"we will need to remove the average length from the Sessions and sleep
 *      data since we won't have the length."* The `durationMin`-derived
 *      `avgLength` computation went with it rather than being left dead.
 *   2. **Both group titles are `body-md`, not `caption`**, and renamed to
 *      "Session details" / "Fitbit and sleep diary details".
 *   3. **The sleep-data group is a real table.** It used to be two label/value
 *      rows carrying a third, tiny purple "split" string:
 *
 *        Sleep diary        Arthur 0 · Tania 0    0 of 0 nights
 *
 *      Reported directly as unscannable, and precisely: *"I do not know what
 *      number after names, and 0 of 0 night means."* Both objections were fair.
 *      The name-and-number pairs were a table squeezed into a caption, and
 *      "0 of 0 nights" put a count and its own denominator in one cell without
 *      ever saying what the denominator was.
 *
 *      The fix is to give each fact its own axis: **people are columns,
 *      measures are rows, and every cell is a single plain integer.** The
 *      denominator became its own row ("Nights tracked"), so nothing has to be
 *      read as a ratio and the unit is stated once instead of four times.
 *      A dyad with no data yet now reads "Nights tracked 0" — true and
 *      self-explanatory — which is why there is no separate empty state.
 */
function ModulesAndSessionsCard({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion, sessionPlans } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  const plan = sessionPlans[dyad.id]

  const held = catchupSessionsCompleted(completed)
  const rescheduled = (plan?.sessions ?? []).filter((s) => s.rescheduled)

  /* Per-person, never merged. The previous version reported
     `Math.max(patient, carer)` as the headline figure, which is a number
     neither person actually has — a dyad where the PLE logged 2 nights and the
     carer 9 read "9", implying the pairing was nine nights in. Each column now
     carries its own counts and its own denominator, because the two logs are
     independent records and can legitimately differ in length.
     **A real figure moved here, and it was a bug.** Both the old rows and this
     table's first draft counted `diaryEntry` — a free-text note — while the
     surface that actually renders the sleep diary (`ConsumerDetailPage`'s
     Consensus grid) reads `diary`, the 9 answered questions. The seed models a
     missing diary by clearing `diary` and leaving `diaryEntry` in place, so the
     two disagreed by exactly that night: measured across every dyad, Bruce
     Whitfield's PLE log is 18 nights with `diaryEntry=18` but `diary=17`, and
     this card was reporting a full 18 of 18 over a grid showing the gap. Every
     other person in the dataset scores identically on both fields, which is why
     it never showed up before. Counting `diary` is what makes the two surfaces
     read the same field — CLAUDE.md's own non-negotiable, and this project's
     most-repeated bug class. */
  /* Names only, no "PLE:" / "Carer:" prefix (direct instruction). The role is
     already established by the consumer picker at the top of this page, which
     reads "PLE: Arthur Ngata, Carer: Tania Ngata" a few hundred px above. */
  const columns = [
    ...(dyad.patient ? [{ key: 'ple', heading: dyad.patient.name, log: dyad.patientLog }] : []),
    { key: 'carer', heading: dyad.carer.name, log: dyad.carerLog },
  ]

  const measures: { key: string; label: string; count: (log: HealthLogEntry[]) => number }[] = [
    { key: 'tracked', label: 'Nights tracked', count: (log) => log.length },
    { key: 'diary', label: 'Sleep diary entries', count: (log) => log.filter((e) => !!e.diary).length },
    { key: 'synced', label: 'Fitbit nights synced', count: (log) => log.filter((e) => e.synced).length },
  ]

  function Group({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
    return (
      <div className={cn('flex flex-col gap-4', !last && 'border-b border-hairline pb-4')}>
        {/* `body-md`/`ink` on direct instruction — these were `caption-medium`
            on `ink-muted`, a step quieter than the rows they label. */}
        <p className="text-body-md text-ink">{title}</p>
        {children}
      </div>
    )
  }
  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-center gap-3">
        <dt className="min-w-0 flex-1 text-caption text-ink-muted">{label}</dt>
        <dd className="shrink-0 text-caption-medium text-ink tabular-nums">{value}</dd>
      </div>
    )
  }

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="bg-purple-50 p-6">
        {/* Retitled with the Modules group: a card headed "Modules and
            sessions" that shows no modules is a worse read than a narrower
            title that is true. */}
        <h3 className="text-body-md text-ink">Sessions and sleep data</h3>
        <p className="mt-1 text-caption text-ink-muted">
          How this pairing is moving through the study
        </p>
      </div>
      <div className="flex flex-col gap-4 border-t border-hairline p-6">
        {/* The "Modules" group was REMOVED here on direct instruction (Notion,
            study progress tab): "for the modules and sessions, remove the
            modules portion, it's a repeat of the consumer module completion
            overview". It was — `ModuleCompletionOverviewCard` sits in the same
            row and renders every module's own state, so this group restated
            three of its figures in a second vocabulary. Removing it also ends
            the risk of the two disagreeing, which is this project's most
            repeated bug.
            `doneCount` / `inProgress` / `leftIncomplete` went with it. */}
        <Group title="Session details">
          <dl className="flex flex-col gap-2">
            <Row label="Held" value={`${held} of ${SPACES_CATCHUP_COUNT} sessions`} />
            {/* Direct instruction: the row must say how many moved AND show each
                one's planned date against its new date. It used to render
                "1 · Session 5" — a count and a bare session name, from which a
                researcher could not tell what moved or by how much.
                `previousDate` is a real populated field on `SessionPlanRow`, not
                a stub, so the before/after is derived rather than invented.
                `sessionRowLabel()` names the session, never a raw number:
                internal session 6 displays as "Session 5", and the planning
                session has no number at all. */}
            <Row
              label="Rescheduled"
              value={
                rescheduled.length === 0
                  ? '0'
                  : `${rescheduled.length} ${rescheduled.length === 1 ? 'session' : 'sessions'}`
              }
            />
            {rescheduled.length > 0 && (
              <div className="flex flex-col gap-2 rounded-xs bg-parchment p-3">
                {rescheduled.map((r) => (
                  <div key={r.session} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 text-caption text-ink-muted">
                      {sessionRowLabel(r.session)}
                    </span>
                    {/* A row can carry `rescheduled: true` with no
                        `previousDate` (the flag predates the field), so the
                        name stands alone rather than rendering "undefined →". */}
                    {r.previousDate && r.date ? (
                      <span className="shrink-0 text-caption-medium text-ink tabular-nums">
                        {formatDate(r.previousDate)}
                        <span aria-hidden="true" className="px-1.5 text-ink-muted">
                          &rarr;
                        </span>
                        <span className="sr-only">moved to</span>
                        {formatDate(r.date)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-caption text-ink-muted">Date not recorded</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* The frame's second row here read "Re-scheduled 0" beside
                "Rescheduled 2". Confirmed as a duplicate, not a cancellation
                row: there is exactly one reschedule figure, and no
                cancellation state exists in the data model at all. Dropped
                rather than rendering a hardcoded 0 for a concept the study
                does not record. */}
          </dl>
        </Group>
        <Group title="Fitbit and sleep diary details" last>
          {/* Nested radius: 8px inside the card's own 16px, `hairline` rather
              than `parchment`, matching every other contained grid in this
              dashboard. `min-w-0` on the scroller so a two-column table can
              never size the card and push the page into horizontal scroll. */}
          <div className="min-w-0 overflow-x-auto rounded-sm border border-hairline">
            <table className="w-full min-w-[320px] border-collapse text-left">
              <caption className="sr-only">
                Sleep diary and Fitbit coverage for each member of this pairing
              </caption>
              <thead>
                <tr className="bg-purple-50">
                  {/* An empty corner cell, not a made-up "Measure" header:
                      the row headers below name themselves. */}
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Measure</span>
                  </th>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className="px-4 py-3 text-right text-caption-medium text-ink"
                    >
                      {c.heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measures.map((m) => (
                  <tr key={m.key} className="border-t border-hairline align-middle">
                    <th
                      scope="row"
                      className="px-4 py-3 text-left text-caption font-normal text-ink-muted"
                    >
                      {m.label}
                    </th>
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className="px-4 py-3 text-right text-caption-medium text-ink tabular-nums"
                      >
                        {m.count(c.log)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Group>
      </div>
    </Card>
  )
}

/**
 * "Latest updates" for one pairing, as `ResearchPriorityItem[]`.
 *
 * Direct instruction: *"streamline latest updates, as done for researcher home
 * page, use same component."* This was a bespoke `LatestUpdatesCard` — a
 * `purple-50` header over a red-dot bullet list of ` · `-joined log strings —
 * which is a third attention pattern in an app that already settled on one
 * (`ResearchPrioritiesSection` on Research Home, `PrioritiesSection` in the
 * coach portal). The card is gone; only the derivation survives, reshaped into
 * the rows that component takes.
 *
 * What the swap changes, beyond looks: every row now carries a real High/Medium
 * priority from the Notion alert classification, a kebab Dismiss with the
 * focus contract that component already owns, and paging via `TablePager`
 * rather than an unbounded list.
 *
 * Every item is still derived from the record. Nothing is seeded, so an empty
 * list genuinely means nothing needs attention — and the component returns
 * `null` in that case, which is why there is no empty state here any more.
 */
function dyadPriorityItems(
  dyad: ConsumerDyad,
  completed: SessionCompletionRecord[],
  plan: SessionPlan | undefined,
): ResearchPriorityItem[] {
  const items: ResearchPriorityItem[] = []
  const to = `/research/consumers/${dyad.id}`
  const moduleNumber = (moduleId: string) =>
    CONSUMER_MODULES.findIndex((m) => m.id === moduleId) + 1

  /* Titles and priorities are the Notion alert classification's own, so a row
     here and the same alert on Research Home read identically rather than as
     two independent wordings of one condition. */

  // Session plan never created.
  if (!isPlanSet(plan))
    items.push({
      id: 'no-plan',
      priority: 'Medium',
      title: 'No session plan built',
      note: 'This consumer has a coach assigned but no session plan created.',
      to,
    })

  // A catch-up held without its module finished — a protocol departure.
  dyad.moduleEngagement.forEach((m) => {
    const n = moduleNumber(m.moduleId)
    const rec = completed.find((c) => displaySessionNumber(c.session) === n)
    if (rec && m.status !== 'completed') {
      items.push({
        id: `module-incomplete-${m.moduleId}`,
        priority: 'Medium',
        title: 'Module incomplete after session held',
        note: `Session ${n} was held on ${formatDate(rec.completedDate)} and Module ${n} is still incomplete.`,
        to,
      })
    }
  })

  // Rescheduled sessions.
  ;(plan?.sessions ?? [])
    .filter((s) => s.rescheduled)
    .forEach((s) => {
      items.push({
        id: `rescheduled-${s.session}`,
        priority: 'Medium',
        title: 'Session rescheduled',
        note: `Session ${displaySessionNumber(s.session)} has been moved${
          s.date ? ` to ${formatDate(s.date)}` : ''
        }.`,
        to,
      })
    })

  /* Device data gaps, per person — the split matters, since a carer not
     syncing is a different finding from the PLE not syncing. High, per the
     classification's "Fitbit not synced in 48+ hours". */
  ;[
    { label: dyad.patient?.name.split(' ')[0], log: dyad.patientLog },
    { label: dyad.carer.name.split(' ')[0], log: dyad.carerLog },
  ].forEach(({ label, log }, i) => {
    if (!label || log.length === 0) return
    const unsynced = log.filter((e) => !e.synced).length
    if (unsynced >= 3) {
      items.push({
        id: `fitbit-${i}`,
        priority: 'High',
        title: 'Fitbit not synced',
        note: `${label} is missing ${unsynced} of ${log.length} nights of wearable data.`,
        to,
      })
    }
  })

  /* Reflection outstanding once Session 1 has been held. Reads "not added",
     not "not shared": sharing is no longer a state a researcher waits on —
     every reflection is visible to the research team by default (Notion,
     study progress tab), so the only outstanding thing is whether one exists. */
  const session1 = completed.find((c) => c.session === 1)
  if (session1 && dyad.annotationSummaries.length === 0) {
    items.push({
      id: 'reflection-missing',
      priority: 'Medium',
      title: 'Coach reflection not added after session',
      note: `Session 1 was held on ${formatDate(session1.completedDate)} and no SIPTEA reflection has been logged.`,
      to,
    })
  }

  /* High before Medium, so the row that needs chasing leads. The component
     renders four to a page, which is why the order matters rather than being
     cosmetic. */
  return items.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'High' ? -1 : 1))
}

/** The "Assigned Consumers" tab's own consumer picker — global (always
 *  visible, never swapped out for dyad-specific content) so the dyad
 *  selection carries over to everything below it. Everything below this
 *  card (the details card, session tracker) is the dynamic part that
 *  re-renders per selection; this card is the one constant.
 *
 *  The "Assign consumer"/"Transfer consumer" actions used to live in this
 *  card's own header, side by side with "Assign consumer" duplicated again
 *  up in the page hero — consolidated so there's exactly one place for both
 *  actions (the hero, `SpacesCoachProfilePage`), which also owns their
 *  dialogs/toast now so they're reachable from any tab, not just this one.
 *  This card is back to just the title/subtitle + picker. */
/* One intro per sub-tab: the tab-level copy ("Study progress for this
   pairing") stopped being true the moment the panel could also show Fitbit and
   diary data, and a single line describing both would describe neither. */
const CONSUMER_SUBTAB_INTRO = {
  /* No `subtitle` (direct instruction): this title heads the KPI grid, and the
     five tiles already name themselves. The other two sub-tabs keep theirs —
     they head a switch and a table, which do need saying. */
  progress: {
    title: 'Study progress for this pairing',
  },
  /* `health` and `reflection` had entries here too and neither was ever
     rendered — only `.progress` is spread (see `ConsumersDetailsTab`). Both
     sub-tabs carry their own section heading on the canvas instead, and the
     `reflection` entry had already drifted out of step with the heading it
     duplicated. Removed rather than corrected. */
} as const

/**
 * Rows per page in the Coach's reflection table — **the whole arc**, so there
 * is no page two.
 *
 * It was 5, from when the table listed only sessions that had actually
 * happened and could be any length. The arc is now a fixed seven (Planning
 * plus six catch-ups), so 5 split it into a full page and a two-row remainder
 * for every consumer in the study, and the pager stayed on screen to offer
 * that. Seven shows the arc in one read and `TablePager` hides itself, since
 * it only renders when there is more than a page.
 */
const REFLECTIONS_PER_PAGE = SPACES_SESSIONS.length

const CONSUMER_SUBTABS = [
  { id: 'progress', label: 'Study progress' },
  { id: 'health', label: 'Consumer sleep & health data' },
  /* Direct instruction: the coach's own reflection moves out of the study
     progress stack and onto its own sub-tab, last. It is the one thing on this
     panel authored by the coach rather than derived from the consumer's
     record, so it read oddly as the tail of a column of derived cards. */
  /* Tab label keeps "and transcripts" (direct instruction). Only the table's
     own heading dropped it — the heading names who authored what, the tab
     names everything the panel holds. */
  { id: 'reflection', label: 'Session reflection and transcripts' },
] as const
type ConsumerSubtab = (typeof CONSUMER_SUBTABS)[number]['id']

function ConsumersDetailsTab({
  coach,
  selectedId,
  subtab,
}: {
  coach: Coach
  selectedId: string
  /** Owned by the page, not by this component: direct instruction puts the
   *  sub-tab row **above** the tab-level `TabIntro`, and that block is
   *  rendered by the page. */
  subtab: ConsumerSubtab
}) {
  const { consumerDyads, sessionCompletion, sessionPlans } = useResearch()
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
        /* Round 27: the former "Shared Annotations" tab's content, now scoped
           to this tab's own selected consumer. Deliberately rendered here
           rather than inside `DyadSection` — that component is exported and
           reused by the Coach Delivery Portal, where a researcher-facing view
           of the coach's own shared/not-shared state does not belong. */
        selected && (
          <ConsumerReflectionCard key={`refl-${selected.id}`} coach={coach} dyad={selected} />
        )
      ) : (
      <div className="flex flex-col gap-10">
      {/* Round 27, frame `306:155`: the "Consumers" picker card is gone from the
          tab body — the frame moves consumer selection into a full-bleed
          `purple-50` band directly under the hero (node `297:1883`), which is
          what `ResearchShell`'s own `heroBelow` slot exists for. The page owns
          that band now, so it stays visible while this tab's content scrolls
          and the tab no longer opens on a card that is only a control. */}
      {/* Direct instruction, in order: the KPI row, the timeline, the two
          breakdown cards, latest updates, then the study log. The coach's own
          reflection is no longer in this stack — it has its own sub-tab.

          The timeline **replaces the "Sessions plan overview" table**, which is
          hidden here. Both render the same six facts per session; the timeline
          reads them as a journey, which is what a researcher scanning one
          pairing is after. `SessionsPlanOverview` is untouched and still serves
          `DyadSection`.

          Round 27's "Consumer details" card stays gone from this tab —
          identity and contact now open in the "View consumer details" panel
          instead. */}
      {/* Direct instruction: the KPI row and the attention section are stacked
          **horizontally**, and the attention panel's height matches the KPI
          column's.

          The height match is structural rather than a px value — the row is a
          stretched grid, the KPI column sets the height from however many rows
          its tiles wrap to, and `fillHeight` makes the attention panel `h-full`
          with a scrolling list. Add a sixth KPI and both sides still agree.

          The KPI grid drops from 5 columns to 3 here: five tiles across plus a
          420px panel beside them leaves each tile ~110px, which clips
          "Modules completed" and its value. Three columns wrap 5 tiles to two
          rows, which is also what gives the panel a usable height.

          `minmax(0, …)` on both tracks: an `fr` track's automatic minimum is
          `auto`, so a wide child (the attention rows' note lines) would grow
          its track past its share and push the sibling down — the same trap
          this tab's own timeline/updates row hit before. */}
      {/* `gap-10` (40px), matching the two breakdown cards’ own row below
          (`items-stretch gap-10`) — direct instruction: the column seam should
          read like the gap between cards, not the 16px gap between tiles
          inside one card-sized block. 24px matched neither. */}
      {selected && (
        <div className="grid grid-cols-1 items-stretch gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div className="flex min-w-0 flex-col gap-6">
            <TabIntro {...CONSUMER_SUBTAB_INTRO.progress} />
            <StudyProgressKpis dyad={selected} />
          </div>
          {/* The attention panel takes its height from the column beside it,
              with no magic number anywhere.

              `absolute inset-0` is load-bearing: `items-stretch` sizes a grid
              row to its **tallest** child, so an `h-full` panel holding three
              alerts would set the row height and stretch the KPI column to
              match — the opposite of what was asked for. An absolutely
              positioned child contributes nothing to the row's height, so the
              left column is the sole height authority and the panel fills
              exactly that box, scrolling inside it (`fillHeight`). Add a KPI,
              or let the intro wrap, and the two still agree.

              `xl:` only: below the breakpoint the two stack, where filling a
              sibling's height would just clip alerts. */}
          <div className="relative min-w-0">
            <div className="xl:absolute xl:inset-0">
              <ResearchPrioritiesSection
                key={`priorities-${selected.id}`}
                fillHeight
                /* This panel is absolutely positioned to match the KPI column's
                   height, so it cannot collapse the way Home's copy does — an
                   empty one left a bordered card with nothing in it. */
                emptyCopy="Nothing needs your attention for this pairing."
                items={dyadPriorityItems(
                  selected,
                  sessionCompletion[selected.id] ?? [],
                  sessionPlans[selected.id],
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* Direct instruction: the timeline and latest updates sit side by side,
          60/40, updates on the right.

          The two cards are height-matched: the row stretches (no
          `items-start`) and `LatestUpdatesCard` carries `h-full`, so the
          shorter card grows to the timeline rather than leaving a ragged
          bottom edge.

          `minmax(0, …)` on both tracks is load-bearing, not tidiness. An `fr`
          track's automatic minimum is `auto`, so a track whose content is wide
          — and the timeline card holds a horizontally-scrolling row of session
          cards — grows past its own share and pushes the sibling down to
          whatever is left. Measured at 1680px that shipped as **80/20**, not
          the 60/40 asked for, and `min-w-0` on the *child* does not fix it
          because the overflow is in the track, not the box. `minmax(0, 6fr)`
          drops the track's floor to zero so the ratio actually holds and the
          scroll stays inside the card rather than dragging the whole page into
          horizontal scroll — the exact bug `layout-audit.js` was written to
          catch on the trainee pathway.

          `items-start`: each card sizes to its own content rather than both
          stretching to the taller one. Latest updates is usually much the
          shorter (a few attention items against a full session arc). */}
      {/* Full width now that "Latest updates" has moved above it as the shared
          attention section. The 60/40 split existed only to pair the two; with
          the timeline alone the extra ~40% is width the horizontally-scrolling
          session row can actually use, so fewer pairings need to scroll at
          all. */}
      {selected && (
        <div className="min-w-0">
          <StudyProgressTimelineCard dyad={selected} />
        </div>
      )}

      {/* The two breakdown cards keep their own equal-width row below.
          `items-stretch` (direct instruction: "both containers should take
          equal height"): these two hold different amounts of content — the
          left is two short groups and a 3-row table, the right is a 7-module
          list — so under `items-start` each hugged its own content and the row
          ended in a ragged step. Stretching makes the grid row's height the
          taller of the two and both cards fill it, so the row closes flush.
          The cards' own internals are unaffected; only the outer surface grows. */}
      {selected && (
        <div className="grid grid-cols-1 items-stretch gap-10 xl:grid-cols-2">
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

/** The "Transfer consumer" flow, split out of `ConsumersDetailsTab` (Round:
 *  hero consolidation) so it can be triggered from the page hero regardless
 *  of which tab is active — self-contained dialog + toast, same grammar as
 *  `AssignConsumerDialog` above. Operates on whichever dyad is currently
 *  selected in the Assigned Consumers tab's own picker (passed in as `dyad`,
 *  the page's `effectiveDyadId` resolved to a record). */
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

/** One consumer's own post-session feedback, as a researcher reads it. */
type ConsumerSessionFeedback = {
  /** A `FEEDBACK_MOODS` id — never a label written here. */
  mood: (typeof FEEDBACK_MOODS)[number]['id']
  /** The optional free text. Empty when they answered the mood only. */
  comment: string
}

/**
 * ⚠️ **DUMMY DATA.** The consumer's post-session feedback, derived rather than
 * stored.
 *
 * The write path already exists and is signed off:
 * `components/consumer/SessionFeedbackModal.tsx` asks two questions after a
 * session — a mood on the fixed five-point `FEEDBACK_MOODS` scale, then an
 * optional comment — and lets the consumer skip, which is a real answer rather
 * than a gap. What it does **not** have is an `onSubmit`: nothing is
 * persisted, and `ConsumerDyad` carries no field for it.
 *
 * **What replaces this:** a `sessionFeedback: ConsumerSessionFeedbackEntry[]`
 * on `ConsumerDyad` (session, mood id, comment, date), written by that modal
 * and read here instead of `dummyConsumerFeedback`. Delete this function and
 * the two pools below; nothing else in this file changes, because the mood
 * *labels* already come from `FEEDBACK_MOODS`.
 *
 * Keyed off the dyad id and session number so it is stable across renders and
 * across the two dialogs that show it — a random draw would let the table and
 * the viewer disagree about the same session.
 */
const DUMMY_FEEDBACK_COMMENTS = [
  'The breathing wind-down is the part that stuck. We have done it four nights running.',
  'Helpful, though we ran out of time before getting to the afternoon naps.',
  'I understood it on the call but could not remember the steps that evening.',
  'Good to hear that the early waking is normal at this stage. That took the pressure off.',
  'We talked more about my own sleep this time, which I had not expected to need.',
]

/** Weighted toward the positive end, with one poor rating in the rotation, so
 *  a full six-session arc shows the scale's range rather than one value. */
const DUMMY_FEEDBACK_MOODS = ['very-good', 'good', 'good', 'okay', 'very-good', 'not-great'] as const

function dummyHash(seed: string): number {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** `undefined` means the consumer was asked and skipped — which the flow
 *  explicitly allows ("We will not ask about this session again"), so it is a
 *  recorded outcome, not missing data. */
function dummyConsumerFeedback(dyadId: string, session: number): ConsumerSessionFeedback | undefined {
  const h = dummyHash(`${dyadId}:${session}`)
  if (h % 9 === 0) return undefined
  return {
    mood: DUMMY_FEEDBACK_MOODS[h % DUMMY_FEEDBACK_MOODS.length],
    comment: h % 3 === 0 ? '' : DUMMY_FEEDBACK_COMMENTS[h % DUMMY_FEEDBACK_COMMENTS.length],
  }
}

/**
 * ⚠️ **DUMMY DATA.** One coach reflection, reused wherever a held session has
 * no real one.
 *
 * Direct instruction, 2026-10-05: *"use repetitive data for each reflection"*,
 * explicitly in preference to seeding more — *"no need to add anything to
 * database"*. Two dyads carry fewer reflections than held sessions and two
 * carry none at all, so without a shared fallback a researcher opening most
 * consumers found a column of dashes where the study's main artefact should
 * be.
 *
 * It is deliberately **one** reflection rather than a rotation: repeated
 * identical text reads as placeholder, which is what it is. A rotation would
 * read as five real coaches writing five real things.
 *
 * **What replaces this:** nothing here changes when real reflections land —
 * `claimReflection` already prefers a dyad's own, by session, and only falls
 * through to this when there is none. Delete the builder and the final
 * `?? dummyReflection(n, held)` and the column simply goes back to dashes.
 */
/** The six answers, one per component, written to read like a real coach's
 *  account of one ordinary session rather than lorem. Same session throughout,
 *  so the six hang together when a researcher reads the table down. */
const DUMMY_REFLECTION_ANSWERS: Record<(typeof SIPTEA_INITIALS)[number], string> = {
  S: 'We came back to the same thing she raised in the first call: she is not worried about her own sleep, she is worried about what happens if she does not hear him get up. Naming that out loud changed the tone of the rest of the session.',
  I: 'We agreed she would move the hallway light onto a timer before the weekend, so the route to the bathroom is lit without her having to wake fully to check.',
  P: 'The risk is the weekend itself. Her daughter visits on Saturday and the routine goes out of the window, so I asked her to treat Sunday as the first real night rather than Saturday.',
  T: 'Dropped the wind-down reading I would usually suggest here. She reads to him already and adding a second thing at the same hour would have competed with it.',
  E: 'She was flat at the start and apologised twice for not having done more since we last spoke. I let that sit rather than reassuring her straight away, and she got to it herself about ten minutes in.',
  A: 'One change only, the hallway light, before our next session. We will look at the early waking after that, not alongside it.',
}

/* Stamped with the **session's own held date**, not `TODAY`. A fixed stamp
   would read as a reflection written before the session it describes the
   moment a demo date sits after today — the seed already has held dates on
   both sides of `TODAY` (2026-07-22), so that is a live case rather than a
   hypothetical one. */
const dummyReflection = (session: number, heldDate: string): AnnotationSummaryEntry => ({
  id: `ann-demo-${heldDate}`,
  /* Carries the session it stands in for, now that `session` is required on
     the entry. It is what the viewer's own title reads off, so a dummy that
     guessed here would title itself after the wrong session. */
  session,
  date: heldDate,
  time: '10:30',
  components: SIPTEA_INITIALS.map((initial) => ({
    label: `${initial}: ${SIPTEA_NAMES[initial]}`,
    answer: DUMMY_REFLECTION_ANSWERS[initial],
  })),
})

/** The consumer's own label for a mood id. Looked up, never written. */
const moodLabel = (id: ConsumerSessionFeedback['mood']) =>
  FEEDBACK_MOODS.find((m) => m.id === id)?.label ?? id

/** Direct reuse of the Learning Progress (formerly Training Review)
 *  `engagement-tracker` + `slide-canvas` grammar (design-tokens.md §13
 *  `annotation-vault`) — one consumer's post-practice (Session 1) reflection;
 *  a coach can only ever have one per consumer.
 *
 *  Round 27: was the whole "Shared Annotations" tab, keyed to a coach and
 *  carrying its own consumer picker (a `<select>` below `lg`, a nav list
 *  above). Now scoped to a single dyad and rendered inside the "Assigned
 *  Consumers" tab, which already owns that selection — the two pickers drove
 *  the same `selectedDyadId`, so one of them was always redundant. Dropping
 *  the picker also removed this component's only reason to know about the
 *  coach's *other* consumers; it now takes just the dyad it displays, plus the
 *  coach for the possessive copy. */
function ConsumerReflectionCard({ coach, dyad }: { coach: Coach; dyad: ConsumerDyad }) {
  const { sessionCompletion } = useResearch()
  const firstName = coach.fullName.split(' ')[0]
  /* The table lists all seven sessions whether or not they have happened,
     so `rows.length` can no
     longer be the empty test — it is always seven. A client with no plan
     shows seven rows of dashes, which is the honest reading of "assigned, no
     sessions planned" rather than an empty state hiding the arc. */
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [transcriptId, setTranscriptId] = useState<string | null>(null)
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  /* Both document columns offer the same pair of actions, so they share one
     control style — a text link at the app's 36px control height. Round 58
     moved the value itself to the module-scoped `ROW_TEXT_ACTION` when
     `SupervisionRecords` became its second caller; the local name stays so
     this component's eight uses read unchanged. */
  const DOC_ACTION = ROW_TEXT_ACTION

  /* The dialog's Download is this app's canonical primary-filled pill, not the
     table's text link (direct instruction). In the table it is one of four
     equal-weight actions; in the viewer it is the only thing to do besides
     close, so it carries the weight. */
  const DOC_ACTION_PRIMARY = btn()

  /* When the session itself was held — the same `sessionCompletion` record the
     Session Plan writes, so this column and the tracker cannot disagree. An
     entry with no session mapped, or one whose session is not marked complete,
     has no held date to show rather than a fabricated one. */
  const completed = sessionCompletion[dyad.id] ?? []

  const fileStem = (label: string) => label.replace(/\s+/g, '-').toLowerCase()

  /* The transcript is the same dummy conversation for every session — see
     `data/transcript.ts` for what replaces it. Names are the pairing's own so
     the document reads as theirs. */
  const transcriptFor = () =>
    sessionTranscript({
      coach: coach.fullName,
      ple: dyad.patient?.name,
      carer: dyad.carer.name,
    })

  const downloadReflection = (label: string, e: AnnotationSummaryEntry) => {
    const heading = `${coach.fullName} — reflection — ${label} (${formatDate(e.date)})`
    const body = e.components.map((c) => `${c.label}\n${c.answer}\n`).join('\n')
    downloadText(`reflection-${dyad.id}-${fileStem(label)}.txt`, `${heading}\n\n${body}`)
  }

  const downloadTranscript = (label: string) => {
    const heading = `${dyadTitle(dyad)} — ${label} — session transcript`
    downloadText(
      `transcript-${dyad.id}-${fileStem(label)}.txt`,
      transcriptAsText(transcriptFor(), heading),
    )
  }

  /* The consumer's two answers as a plain document, matching the other two
     downloads on the row. Skipped is written out rather than omitted — a
     researcher reading the file needs to see that they were asked. */
  const downloadFeedback = (label: string, f: ConsumerSessionFeedback | undefined) => {
    const heading = `${dyadTitle(dyad)} — ${label} — consumer feedback`
    const body = f
      ? `Session feedback:\n${moodLabel(f.mood)}\n\nAdditional comments:\n${
          f.comment || 'Nothing added'
        }\n`
      : 'The consumer was asked for feedback on this session and chose to skip it.\n'
    downloadText(`consumer-feedback-${dyad.id}-${fileStem(label)}.txt`, `${heading}\n\n${body}`)
  }

  /* EVERY reflection. Direct instruction (Notion, study progress tab): "in
     the session reflection, remove the shared. All reflections will be seen by
     researcher by default."

     **Round 55 finished the job**: the `shared` field is gone from the data
     model too. The coach's own wizard no longer offers the choice, so there is
     no longer a flag that could disagree with this list.

     Newest first. The store prepends and the seed is written in that order, so
     this is a stable read rather than a reorder — but sorting anyway means a
     hand-edited seed cannot silently put the list out of order. */
  const reflections = [...dyad.annotationSummaries].sort((a, b) =>
    `${a.date} ${a.time}` < `${b.date} ${b.time}` ? 1 : -1,
  )

  /* ── One row per SESSION in the plan — all seven ──────────────────────────
     The row used to be a coach reflection, which was right while the coach was
     the only author. Now that the consumer shares feedback on the same
     session, a reflection-keyed row would hide every piece of feedback on a
     session the coach has not written up yet — the consumer answers within
     minutes of the call, the coach may take days, so that gap is the normal
     case rather than an edge one.

     Round 55, direct instruction: *"planning + 6 sessions, for researcher,
     they will see all of this under session reflection and transcript tab"*,
     with *"show a — for missing fields"*. So the row set is the **whole
     arc**, not just the sessions already held: a researcher reading this tab
     is asking "what do we have for this pairing", and a table that lists only
     what exists cannot answer it — four rows look complete until you count
     them. Seven rows with dashes say where the study actually is.

     **Session 6 at the top, Planning at the bottom** (direct instruction,
     2026-10-05) — the live end of the arc first, which is what a researcher
     opening this tab is looking for.

     ⚠️ Do not "fix" this to chronological. It was briefly flipped on a
     misreading of the report *"I do not see planning... it always starts
     with session 2"*, which was about the rows being **missing**, not about
     the order: the arc is seven rows and the pager showed five, so Planning
     and Session 1 were stranded on page two. `REFLECTIONS_PER_PAGE` is what
     fixed that, and it is why both can hold at once. */
  const sessionKeys = SPACES_SESSIONS.map((s) => s.number).sort((a, b) => b - a)

  /* ── Every held session has a coach reflection ────────────────────────────
     Direct instruction: *"Coach reflection is mandatory, they will no longer
     be able to not share."* So this column has no empty state — a held session
     without a reflection is not a product state, and rendering a dash there
     said it was.

     Real reflections are matched by their own `session` first, so the document
     a researcher opens is genuinely the one the coach wrote. ⚠️ **DUMMY:** the
     seed still carries fewer reflections than held sessions on some dyads, so
     any session short of a real one reuses the dyad's first reflection as its
     document.

     2026-10-06: the `spare` pool is **gone**. It existed for reflections with
     no `session`, and `session` is now required on `AnnotationSummaryEntry` —
     so the filter could only ever return `[]`, and a `shift()` off an empty
     array is dead code pretending to handle a case the type forbids. When the
     seed carries one reflection per held session, `fallback` goes the same way
     and this becomes a plain `find`. */
  const fallback = reflections[0]
  /* Real first, by its own session, so the document a researcher opens is
     genuinely the one the coach wrote. Then this dyad's first entry, then
     `dummyReflection` — which is what makes the column populated for the dyads
     carrying no reflections at all. */
  const claimReflection = (n: number, heldDate: string) =>
    reflections.find((r) => r.session === n) ?? fallback ?? dummyReflection(n, heldDate)

  type ReflectionRow = {
    key: string
    session?: number
    label: string
    heldDate?: string
    /** Never absent on a held session — see `claimReflection`. */
    reflection?: AnnotationSummaryEntry
    /** Only ever asked for once a session has actually happened. */
    feedback?: ConsumerSessionFeedback
    feedbackAsked: boolean
  }

  const rows: ReflectionRow[] = [
    ...sessionKeys.map((n) => {
      /* The real completion record and nothing else.
         ⚠️ A view-level fill briefly stood in here, showing Planning and
         Session 1 as held for every consumer. It is gone: the two dyads that
         needed it now carry real plans and real completions in the seed
         (direct instruction, *"every client will have a session plan"*), and
         Arthur Ngata is deliberately exempt — he is the *"client assigned but
         no session planned"* case, so his rows must read as dashes rather
         than being papered over. A fill here would also have put this card
         out of step with the Consumer Management roster, which counts the
         same sessions from the same store. */
      const held = completed.find((c) => c.session === n)?.completedDate
      /* The Planning session carries a transcript and nothing else (direct
         instruction, 2026-10-05: *"no coach reflection, no consumer feedback,
         only session transcript"*). It is the one meeting where no coaching
         has happened yet — the pair are agreeing a calendar — so there is
         nothing for either of them to account for.

         `claimReflection` is deliberately **not called** for it rather than
         called and discarded: it deals unmapped reflections out of a shared
         pool with `shift()`, so calling it here would silently consume one
         that belongs to a real session. */
      const planning = n === PLANNING_SESSION
      return {
        key: `s-${n}`,
        session: n,
        label: sessionRowLabel(n),
        heldDate: held,
        reflection: planning || !held ? undefined : claimReflection(n, held),
        feedback: held && !planning ? dummyConsumerFeedback(dyad.id, n) : undefined,
        feedbackAsked: !!held && !planning,
      }
    }),
  ]

  const lastPage = Math.max(0, Math.ceil(rows.length / REFLECTIONS_PER_PAGE) - 1)
  useEffect(() => {
    if (page > lastPage) setPage(lastPage)
  }, [page, lastPage])
  const visible = rows.slice(page * REFLECTIONS_PER_PAGE, (page + 1) * REFLECTIONS_PER_PAGE)
  const viewing = rows.find((r) => r.key === viewingId) ?? null
  const transcriptRow = rows.find((r) => r.key === transcriptId) ?? null
  const feedbackRow = rows.find((r) => r.key === feedbackId) ?? null

  return (
    /* Direct instruction: "under coach reflection add back table view as done
       for coaches when they add reflection after each session."

       This is the Coach Delivery Portal's own "My reflections" table
       (`DeliveryConsumerDetailPage.tsx`) — same columns, same excerpt rule,
       same row-opens-a-dialog contract — so a coach and a researcher looking at
       the same reflections see the same list. It replaces a stack of fully
       expanded reflection documents, which at one card per session grew to a
       page the researcher had to scroll past rather than scan.

       Two deliberate differences from the coach's version, both permissions
       rather than taste: there is **no Share status column** (nothing to show
       now that every reflection is visible by default) and the dialog is
       **read-only** (a coach's reflection is their own account of a session; a
       researcher reads it, and an editable textarea here would say otherwise).
       The section title and sub copy sit on the page canvas, outside the card,
       matching `SleepDiaryFeed` and the sessions table. */
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-title text-ink outline-none"
        >
          Session reflections shared by coach and consumer
        </h2>
        {/* No sub label (direct instruction, twice). The heading says what the
            table is; the columns say what each row holds. Note it deliberately
            does not name the transcript, which is the session's own record
            rather than either party's account of it. */}
      </div>

      {/* No empty state any more: every consumer's arc is Planning followed by
          Session 1, 2, 3 (direct instruction, 2026-10-05), and the two opening
          rows are always populated — so there is no state in which this tab
          has nothing to show. */}
      {(
        <Card className="gap-0 rounded-lg py-0">
          <div className="overflow-x-auto">
            {/* `table-fixed` is load-bearing: under auto layout the one-line
                excerpt sizes the Reflection column off its longest row and
                pushes the table well past its container — the same bug the
                coach portal's own notes table hit (Round 31). */}
            <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-purple-50">
                  {/* Even fifths. Every column now holds a short, similar value
                      — two dates and three action pairs — so there is nothing
                      variable left to absorb slack and equal tracks read as
                      balanced. Column names are the study's own (direct
                      instruction). */}
                  <th scope="col" className="w-1/5 px-6 py-4 text-caption-medium text-ink">
                    Session number
                  </th>
                  <th scope="col" className="w-1/5 px-4 py-4 text-caption-medium text-ink">
                    Session held date
                  </th>
                  <th scope="col" className="w-1/5 px-4 py-4 text-caption-medium text-ink">
                    Coach reflection
                  </th>
                  <th scope="col" className="w-1/5 px-4 py-4 text-caption-medium text-ink">
                    Consumer feedback
                  </th>
                  <th scope="col" className="w-1/5 px-4 py-4 text-caption-medium text-ink">
                    Session transcript
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => (
                  <tr
                    key={row.key}
                    className={cn('align-top', i > 0 && 'border-t border-hairline')}
                  >
                    <td className="px-6 py-5 text-caption-medium text-ink">
                      {/* Never a bare number — internal 1 is "Planning", and a
                          reflection written before sessions were mapped has no
                          session at all, which is a real absence. */}
                      {row.label}
                    </td>
                    <td className="px-4 py-5 text-caption whitespace-nowrap text-ink-muted">
                      {row.heldDate ? formatDate(row.heldDate) : '\u2014'}
                    </td>

                    {/* The three document columns read alike: each is either a
                        View/Download pair or a single short reason it is
                        absent. An em dash means nothing has been written yet;
                        "Skipped" means the consumer was asked and declined,
                        which is an answer rather than a gap. */}
                    <td className="px-4 py-5">
                      {row.reflection ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <button
                            type="button"
                            onClick={() => setViewingId(row.key)}
                            className={DOC_ACTION}
                          >
                            View<span className="sr-only"> coach reflection for {row.label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadReflection(row.label, row.reflection!)}
                            className={DOC_ACTION}
                          >
                            Download
                            <span className="sr-only"> coach reflection for {row.label}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-caption text-ink-muted">{'\u2014'}</span>
                      )}
                    </td>

                    <td className="px-4 py-5">
                      {!row.feedbackAsked ? (
                        <span className="text-caption text-ink-muted">{'\u2014'}</span>
                      ) : row.feedback ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <button
                            type="button"
                            onClick={() => setFeedbackId(row.key)}
                            className={DOC_ACTION}
                          >
                            View<span className="sr-only"> consumer feedback for {row.label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadFeedback(row.label, row.feedback)}
                            className={DOC_ACTION}
                          >
                            Download
                            <span className="sr-only"> consumer feedback for {row.label}</span>
                          </button>
                        </div>
                      ) : (
                        /* Badge, not plain text (direct instruction), on the
                           shared `Chip` in its `destructive` tone — this app's
                           one chip geometry, already contrast-measured. */
                        <Chip tone="destructive" label="Skipped" />
                      )}
                    </td>

                    <td className="px-4 py-5">
                      {row.heldDate ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <button
                            type="button"
                            onClick={() => setTranscriptId(row.key)}
                            className={DOC_ACTION}
                          >
                            View<span className="sr-only"> transcript for {row.label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadTranscript(row.label)}
                            className={DOC_ACTION}
                          >
                            Download<span className="sr-only"> transcript for {row.label}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-caption text-ink-muted">{'\u2014'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {rows.length > REFLECTIONS_PER_PAGE && (
        <TablePager
          page={page}
          pageSize={REFLECTIONS_PER_PAGE}
          total={rows.length}
          onPageChange={setPage}
          itemLabel="sessions"
        />
      )}

      <ConfirmDialog
        open={!!viewing?.reflection}
        title={viewing ? `${firstName}\u2019s reflection: ${viewing.label}` : ''}
        body={
          viewing?.reflection
            ? `${formatDate(viewing.reflection.date)}  ·  ${formatTime(viewing.reflection.time)}`
            : ''
        }
        /* Direct instruction: the same Download the row offers, top right of
           the header — a researcher reading a document wants to keep it
           without closing and hunting for the row again. */
        headerAction={
          viewing?.reflection && (
            <button
              type="button"
              onClick={() => downloadReflection(viewing.label, viewing.reflection!)}
              className={DOC_ACTION_PRIMARY}
            >
              Download<span className="sr-only"> this reflection</span>
            </button>
          )
        }
        confirmLabel="Close"
        cancelLabel="Close"
        /* One control, not a Cancel/Confirm pair: this dialog shows a document
           and asks nothing, so there is nothing to confirm. */
        singleAction
        panelClassName="max-h-[85vh] w-full max-w-[860px]"
        onConfirm={() => {
          setViewingId(null)
          /* The dialog unmounts and its trigger — the row's View button — may
             have re-rendered, so focus lands on this section's heading rather
             than `<body>`. This project's most-repeated defect. */
          headingRef.current?.focus({ preventScroll: true })
        }}
        onClose={() => {
          setViewingId(null)
          headingRef.current?.focus({ preventScroll: true })
        }}
      >
        {viewing?.reflection && (
          /* The app's one rendering of a reflection (direct instruction,
             2026-10-05: *"when the researcher gets to see coaches reflections,
             use same template"*). This was a bespoke `<dl>` — the component
             name in `primary` on a fixed 180px track — and the fourth markup
             for the same object: the trainee wizard, the coach wizard and the
             coach's own saved viewer were already this table.

             **No `onEdit`, which is the whole of what makes it read-only.**
             There is no separate flag, so a researcher cannot be handed an
             editor by mistake — a coach's reflection is their account of a
             session, and an editable field here would say otherwise.

             `rowsFromStored`, not `rowsFromAnswers`: a saved entry's labels
             were written by whichever version of the wizard was live at the
             time (the seed holds both `'S: Shared understanding'` and a bare
             `'Shared understanding'`), so the component is read back off each
             label rather than assumed from its position. */
          <ReflectionReviewTable
            rows={rowsFromStored(viewing.reflection.components)}
            /* Not the default "Your answer" — the researcher is reading
               someone else's. */
            answerHeading="Coach's answer"
            /* A saved record, so a blank is final rather than pending. Same
               wording the coach's own viewer of this entry uses. */
            emptyLabel="Not answered."
          />
        )}
      </ConfirmDialog>

      {/* Transcript viewer. Same chassis as the reflection viewer so the two
          documents on this row read alike. Content is the shared dummy Zoom
          transcript — `data/transcript.ts` records what replaces it. */}
      <ConfirmDialog
        open={!!transcriptRow}
        title={transcriptRow ? `Session transcript: ${transcriptRow.label}` : ''}
        body={
          transcriptRow?.heldDate
            ? `${dyadTitle(dyad)}  ·  ${formatDate(transcriptRow.heldDate)}`
            : ''
        }
        headerAction={
          transcriptRow && (
            <button
              type="button"
              onClick={() => downloadTranscript(transcriptRow.label)}
              className={DOC_ACTION_PRIMARY}
            >
              Download<span className="sr-only"> this transcript</span>
            </button>
          )
        }
        confirmLabel="Close"
        cancelLabel="Close"
        singleAction
        panelClassName="max-h-[85vh] w-full max-w-[860px]"
        onConfirm={() => {
          setTranscriptId(null)
          headingRef.current?.focus({ preventScroll: true })
        }}
        onClose={() => {
          setTranscriptId(null)
          headingRef.current?.focus({ preventScroll: true })
        }}
      >
        {transcriptRow && (
          <div className="flex flex-col gap-4 rounded-sm border border-hairline p-5">
            {transcriptFor().map((line, i) => (
              <div key={i} className="flex flex-col gap-1 sm:flex-row sm:gap-6">
                <p className="text-fine whitespace-nowrap text-ink-faint sm:w-[168px] sm:shrink-0">
                  <span className="tabular-nums">{line.time}</span>{' '}
                  <span className="text-caption-medium text-ink">{line.speaker}</span>
                </p>
                <p className="min-w-0 flex-1 text-body leading-[1.5] text-ink">{line.text}</p>
              </div>
            ))}
          </div>
        )}
      </ConfirmDialog>

      {/* Consumer feedback viewer. Same chassis as the other two documents on
          the row, so all three read alike. Its two fields are the consumer's
          own questions, quoted as they were asked — the researcher should see
          the prompt, not a researcher-side paraphrase of it. */}
      <ConfirmDialog
        open={!!feedbackRow}
        title={feedbackRow ? `Consumer feedback: ${feedbackRow.label}` : ''}
        body={
          feedbackRow?.heldDate
            ? `${dyadTitle(dyad)}  ·  ${formatDate(feedbackRow.heldDate)}`
            : ''
        }
        headerAction={
          feedbackRow && (
            <button
              type="button"
              onClick={() => downloadFeedback(feedbackRow.label, feedbackRow.feedback)}
              className={DOC_ACTION_PRIMARY}
            >
              Download<span className="sr-only"> this feedback</span>
            </button>
          )
        }
        confirmLabel="Close"
        cancelLabel="Close"
        singleAction
        panelClassName="max-h-[85vh] w-full max-w-[860px]"
        onConfirm={() => {
          setFeedbackId(null)
          headingRef.current?.focus({ preventScroll: true })
        }}
        onClose={() => {
          setFeedbackId(null)
          headingRef.current?.focus({ preventScroll: true })
        }}
      >
        {feedbackRow?.feedback && (
          <dl className="rounded-sm border border-hairline">
            <div className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:gap-6">
              <dt className="text-caption-medium text-primary sm:w-[180px] sm:shrink-0">
                Session feedback:
              </dt>
              <dd className="min-w-0 flex-1 text-body leading-[1.4] text-ink">
                {moodLabel(feedbackRow.feedback.mood)}
              </dd>
            </div>
            <div className="flex flex-col gap-2 border-t border-hairline px-5 py-5 sm:flex-row sm:gap-6">
              <dt className="text-caption-medium text-primary sm:w-[180px] sm:shrink-0">
                Additional comments:
              </dt>
              <dd className="min-w-0 flex-1 text-body leading-[1.4] text-ink">
                {feedbackRow.feedback.comment || (
                  <span className="text-ink-muted">Nothing added</span>
                )}
              </dd>
            </div>
          </dl>
        )}
      </ConfirmDialog>
    </section>
  )
}

/** New pattern (design-tokens.md §13 `supervision-notes`) — note-creation
 *  form + a notes-log table, distinct from the session tracker: arbitrary,
 *  non-session-mapped entries.
 *
 *  Exported for direct reuse by the Coach Delivery Portal's per-consumer
 *  detail page (Round 6.2 — Session Logs tab). The optional `dyadId` prop
 *  scopes both halves to one consumer's own session notes — a categorically
 *  different note type from this component's existing coach-wide use here
 *  in the Supervision Logs tab (researcher-authored supervision/observation
 *  notes), not a parallel view of the same data. Omitted, behavior is
 *  byte-for-byte identical to before this round: notes save without a
 *  `dyadId` and the table shows every note for the coach regardless of it. */
/**
 * The researcher tables' shared **text action** — a `primary` label underlined
 * at rest, at the app's 36px control height.
 *
 * Hoisted to module scope in Round 58 at its second caller. It had been a
 * local `DOC_ACTION` inside `SessionReflectionsTab`, and `SupervisionRecords`
 * now needs the identical treatment for its own row action; a second copy of
 * the same string is how the hero treatment drifted across five pages once
 * already. `DOC_ACTION` still exists under its own name at that call site —
 * only its value moved, so none of its eight uses changed.
 *
 * Note this is a **link** treatment, not a ghost button: CLAUDE.md's rule is
 * that a control underlined *at rest* is a link, and that underline is this
 * control's only non-colour affordance (WCAG 1.4.1). Correct here for the same
 * reason it is correct in the reflections table — these are the researcher's
 * in-table actions and they read as one system.
 */
const ROW_TEXT_ACTION =
  'inline-flex h-9 items-center rounded-xs text-caption-medium text-primary underline underline-offset-2 outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring'

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
  /** Round 6.2 — Coach Delivery Portal Session Logs tab overrides
   *  "Supervision records"-family strings ("Session Notes"/etc.) without
   *  forking this component; omitted, every string matches this file's
   *  original copy. notesHeading/notesSubline are shared verbatim by every
   *  caller — generic, name-free copy that fits both the researcher's own
   *  supervision notes and a coach's per-consumer session notes. */
  notesHeading?: string
  notesSubline?: string
  recordsHeading?: string
  /* `recordsSubline` deleted in Round 23: frame `174:5` moves the records
     heading out of the card onto the page canvas, so there is no header band
     left to hold a sub-line. Removed rather than left as a dead prop — its one
     override (the Delivery Portal's "Your own notes, most recent first.") went
     with it. */
  emptyMessage?: string
  /** Round 6.2.1 — when provided, renders in the grid's right-hand column
   *  instead of the Session records card, which then moves to its own
   *  full-width row below the grid (Coach Delivery Portal Session Logs tab:
   *  Scheduled Sessions takes the top-right slot; Session records moves
   *  down). Omitted everywhere else, so the Research Dashboard's Supervision
   *  Hub keeps its original side-by-side notes/records layout untouched. */
  rightSlot?: ReactNode
  /** Round 22 — the trainee record page's own "Supervision notes" tab wants
   *  neither the side-by-side layout (no `rightSlot` to show) nor a
   *  half-width note-creation card sitting oddly alone in a 2-col grid: the
   *  note-creation card should take the full row width, with the records
   *  table stacked in its own full-width row below. Mutually exclusive with
   *  `rightSlot` in practice — no caller needs both, so this simply takes
   *  priority when both are somehow passed. */
  fullWidthStack?: boolean
  /** Round 22 — the trainee record page's own "Supervision notes" tab
   *  already states "write and save notes here" in its own `TabIntro`
   *  (the tab intro block sits directly above this card, so the message is
   *  never lost) — repeating "Add new note"/`notesSubline` immediately
   *  below it inside the card read as the same sentence twice. Omitted
   *  everywhere else, so Supervision Hub and Session Logs — which have no
   *  such tab-level intro carrying that message — keep their header band. */
  hideNotesHeader?: boolean
}) {
  const { supervisionNotes, addSupervisionNote, deleteSupervisionNote } = useResearch()
  const notes = supervisionNotes
    .filter((n) => n.coachId === coach.id && (dyadId === undefined || n.dyadId === dyadId))
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(TODAY)
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5))
  const [notesBody, setNotesBody] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  /* Round 58 — `downloadMsg` survives, but it no longer belongs to a row: the
     row's Download writes a real file, so it needs no status line. What does
     need one is an **attachment**, which has no bytes behind it in this
     prototype — the seeded names are filenames, not files. It is announced in
     the viewer rather than silently doing nothing. */
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null)
  const [viewing, setViewing] = useState<SupervisionNote | null>(null)
  const [deleting, setDeleting] = useState<SupervisionNote | null>(null)
  /* Held separately from `deleting` so the confirm dialog keeps the copy that
     names the note through `AnimatePresence`'s exit, rather than blanking
     mid-fade. Same reason `DeliveryNotesPage` holds its own. */
  const [deletingShown, setDeletingShown] = useState<SupervisionNote | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  /* Focus target after a delete. The row — and the Delete button that opened
     the dialog — unmounts with the note, so `ConfirmDialog`'s focus-restore
     has nothing to return to and focus lands on `<body>`. Measured live, not
     assumed: this project's most-repeated defect class, and
     `DeliveryNotesPage` already solved it exactly this way. */
  const recordsHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (deleting) setDeletingShown(deleting)
  }, [deleting])

  /* A real file, not a stub: the note's own text is in hand, so there is
     nothing to fake. Shared `downloadText` rather than a second hand-rolled
     Blob — `DeliveryNotesPage` predates that helper and still has its own. */
  function downloadNote(n: SupervisionNote) {
    /* 2026-10-06, direct instruction: ONE download that takes the note and
       every attachment together, rather than a control per file. The seed
       carries attachment filenames, not bytes, so what is written is the note
       plus a manifest of what the bundle would contain — named `.txt`, not
       `.zip`, because a text file wearing a `.zip` extension fails to open
       and that is worse than being plain about it. Swapping in a real archive
       is a one-function change here once an encoder is added. */
    const slug = n.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const manifest = n.attachments.length
      ? `\nAttachments (${n.attachments.length}):\n${n.attachments.map((f) => `  - ${f}`).join('\n')}\n`
      : ''
    downloadText(
      `${slug}.txt`,
      `${n.title}\n${formatDate(n.date)} ${n.time}\n\n${n.notes}\n${manifest}`,
    )
  }

  /* Round 23, frame `174:5` (nodes `172:1824`/`172:1765`). The heading moves
     OUT of the card onto the page canvas (`body-md`, 16px above it), and the
     card becomes a `yellow-50` shell with a `purple-50` header row and white
     data rows — no outer border, the tint carries the edge. Columns are the
     frame's fixed widths with Title flexing.
     Note this drops the records sub-line: with the heading outside the card
     there is no header band left to hold it, and the trainee page's `TabIntro`
     already says what this table is. */
  /* Round 23, frame `174:5` (nodes `172:1824`/`172:1765`). The heading moves
     OUT of the card onto the page canvas (`body-md`, 16px above it), and the
     card becomes a `yellow-50` shell with a `purple-50` header row and white
     data rows — no outer border, the tint carries the edge.

     Round 58 replaced the row's single icon-only Download with a real Actions
     column — **View · Download · Delete** — on the model the trainee's own
     My Notes table already uses (`DeliveryNotesPage.tsx`), so the two notes
     tables in this app read as one pattern rather than two. Direct
     instruction; an accordion drawer was built first and discarded in favour
     of the modal ("lets keep it simple, open pop-up modal instead").

     `table-fixed` is load-bearing here for the same reason it is there: under
     auto layout a long title sizes the Title column and pushes the table past
     its container. Fixed layout pins the four trailing columns and gives Title
     the remainder, which is also what gives `line-clamp-2` a width to clamp
     against. */
  const recordsCard = (
    <section className="flex flex-col gap-4">
      <h2
        ref={recordsHeadingRef}
        tabIndex={-1}
        className="font-display text-body-md text-ink outline-none"
      >
        {recordsHeading}
      </h2>
      <Card className="gap-0 overflow-hidden rounded-lg border-0 bg-yellow-50 py-0 shadow-card">
        {notes.length === 0 ? (
          <p className="bg-card px-8 py-6 text-caption text-ink-muted">{emptyMessage}</p>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            {/* Measured, not guessed. `layout-audit.js` caught a first pass at
                `min-w-[840px]`: inside this page's 817px container at a 1041px
                viewport the table overran by 23px and two Attachments cells
                wrapped. Actions is the one width that cannot move — its three
                controls measure 178px and the cell carries the row's own 32px
                right padding, so 210 is the content, not padding. The other
                three were trimmed to their real content instead
                (150/80/110 against ~85/38/86px of text), which brings the
                floor to 760 and leaves Title 267px at that width. Audit empty
                at 1041 and 1440. */}
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
              <colgroup>
                <col />
                <col className="w-[150px]" />
                <col className="w-[80px]" />
                <col className="w-[110px]" />
                <col className="w-[210px]" />
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
                  <th scope="col" className="py-4 pr-8 text-caption-medium text-ink-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  /* `align-top`: the Actions cell is 36px of control against a
                     ~20px line of text, and the default middle alignment floats
                     the date and time to the row's vertical centre instead of
                     lining up with the first line of a two-line title — the
                     same defect Round 10 fixed on the multi-attendee table. */
                  <tr key={n.id} className="border-b border-hairline bg-card align-top">
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
                    <td className="py-4 pr-8">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setViewing(n)}
                          className={ROW_TEXT_ACTION}
                        >
                          View
                          <span className="sr-only">: {n.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadNote(n)}
                          className={ROW_TEXT_ACTION}
                        >
                          Download
                          <span className="sr-only">: {n.title}</span>
                        </button>
                        {/* An icon, not a word, and `destructive` rather than
                            `primary`: this is the one action in the row that
                            cannot be taken back and should not read like its
                            two harmless neighbours — the same call
                            `DeliveryNotesPage` made. Icon-only needs its name
                            supplied some other way, so it carries a real
                            `aria-label` naming the note, plus a `title` giving
                            sighted users the same label on hover. `-my-1.5`
                            cancels the 36px box's effect on row height rather
                            than shrinking it below this project's control
                            floor. */}
                        <Button
                          type="button"
                          onClick={() => setDeleting(n)}
                          aria-label={`Delete note: ${n.title}`}
                          title="Delete note"
                          variant="ghost"
                          tone="destructive"
                          size="icon"
                          className="shrink-0"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  )

  /* Round 23, frame `174:5` (node `172:1565`). Fields are now 44px tall with
     an 8px radius, 16px side padding and a `caption-medium` `ink-faint`
     label 8px above them; the card itself carries 32px padding and 24px between
     fields. Shared by all three callers (this page's Supervision Logs, the
     trainee page's Supervision Notes, the Coach Delivery Portal's Session
     Notes) — the form is the same form everywhere, so it moves together. */
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
              {/* `bg-parchment`, not white — the frame fills the textarea to
                  distinguish the one free-text field from the single-line
                  inputs above it. */}
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
                  className={btn({ variant: 'secondary' })}
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
                <Button
                  type="submit"
                >
                  Save note
                </Button>
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

      <SupervisionNoteViewer
        note={viewing}
        downloadMsg={downloadMsg}
        onDownload={downloadNote}
        onClose={() => {
          setViewing(null)
          setDownloadMsg(null)
        }}
      />

      {/* Deleting is irreversible — there is no undo and no bin — so it is
          gated. `destructive` gives the confirm button the red treatment, and
          the copy names the note and states the consequence rather than asking
          "Are you sure?", per this project's own dialog-copy rule. */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete this note?"
        body={
          deletingShown ? `"${deletingShown.title}" will be removed. You cannot undo this.` : ''
        }
        confirmLabel="Delete note"
        cancelLabel="Keep note"
        destructive
        onConfirm={() => {
          if (deletingShown) deleteSupervisionNote(deletingShown.id)
          setDeleting(null)
          setToast('Note deleted.')
          // Send focus to the records heading rather than letting it fall to
          // `<body>`. It is always mounted — the heading sits outside the card,
          // so it survives the table collapsing to its empty state.
          recordsHeadingRef.current?.focus()
        }}
        onClose={() => setDeleting(null)}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

/**
 * The read-only supervision-note viewer.
 *
 * Built on `ConfirmDialog` rather than a new chassis, for the reason
 * `DeliveryNotesPage`'s own viewer gives: that component already carries this
 * project's hard-won modal behaviour — the Round 11 two-step focus-restore
 * race, the Round 14 `AnimatePresence` exit fix, the Tab trap and Escape — and
 * a hand-rolled dialog would have to reproduce all of it.
 *
 * **Not `singleAction`.** This dialog has two things to do, so it uses the
 * two-button footer: Close in the cancel slot, **Download** in the confirm
 * slot, which is this app's canonical primary-filled pill. That is the same
 * call `DOC_ACTION_PRIMARY` documents on this page — in a table Download is
 * one of three equal-weight actions and reads as a link; in a viewer it is the
 * only thing to do besides close, so it carries the weight. `onConfirm` does
 * **not** close: `ConfirmDialog` leaves that entirely to the caller, so
 * downloading leaves the note on screen, which is what you want when the next
 * thing you may do is open an attachment.
 *
 * **No editing** (matching the trainee's My Notes viewer): a saved note is a
 * record of what the researcher thought at the time.
 */
function SupervisionNoteViewer({
  note,
  downloadMsg,
  onDownload,
  onClose,
}: {
  note: SupervisionNote | null
  downloadMsg: string | null
  onDownload: (note: SupervisionNote) => void
  onClose: () => void
}) {
  // Held rather than read straight through, so the panel keeps its content
  // while `AnimatePresence` plays the exit instead of blanking for the fade.
  const [shown, setShown] = useState<SupervisionNote | null>(note)
  useEffect(() => {
    if (note) setShown(note)
  }, [note])

  return (
    <ConfirmDialog
      open={!!note}
      title={shown?.title ?? ''}
      body={shown ? `${formatDate(shown.date)}  ·  ${shown.time}` : ''}
      confirmLabel="Download"
      cancelLabel="Close"
      // Wider than the confirm-dialog default: 440px turns a paragraph into a
      // ribbon, and this is a document to read, not a question to answer.
      panelClassName="max-h-[85vh] w-full max-w-[720px]"
      onConfirm={() => shown && onDownload(shown)}
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        {/* The notepad: the same `parchment` surface and hairline the write box
            above the table uses, so a saved note reads as the same object it
            was typed into — just without a cursor. `whitespace-pre-wrap` keeps
            the researcher's own line breaks. */}
        <div className="min-h-[200px] rounded-sm border border-hairline bg-parchment p-4">
          <p className="whitespace-pre-wrap text-body leading-[1.4] text-ink">{shown?.notes}</p>
        </div>

        {/* Attachments live here rather than in the row (direct instruction).
            The table's own column still carries the count, which is what tells
            you there is something in here worth opening.

            2026-10-06, direct instruction: each attachment is a LABEL, not a
            row with its own action. Same chip this app already uses for the
            Stage CP feedback report (`purple-50` pill, `fine`, `primary`), so
            an attached file looks the same wherever it is shown. The per-file
            Download is gone — the dialog's single footer Download takes
            everything at once, which is also the only thing that can honestly
            be offered when a note has several files. */}
        {!!shown?.attachments.length && (
          <section className="flex flex-col gap-3">
            <h3 id="note-attachments-heading" className="text-caption-medium text-ink-faint">
              Attachments
            </h3>
            <ul aria-labelledby="note-attachments-heading" className="flex flex-wrap gap-2">
              {shown.attachments.map((file) => (
                <li key={file} className="flex min-w-0">
                  <span className="inline-flex h-[27px] min-w-0 max-w-[320px] items-center gap-1.5 rounded-full bg-purple-50 px-3 text-fine text-primary">
                    <FileText aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="truncate">{file}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Always rendered so it is a stable live region: a `role="status"`
            that mounts at the same moment its text appears is announced
            unreliably, because the region has to exist before the change. */}
        <p role="status" className="min-h-5 text-caption font-semibold text-success">
          {downloadMsg}
        </p>
      </div>
    </ConfirmDialog>
  )
}

/** Exact replica of the Trainee Management record page's own "Supervision
 *  Notes" tab (`SupervisionNotesTab`, `CoachProfilePage.tsx`) — same
 *  `SupervisionRecords` reuse, same `fullWidthStack`/`hideNotesHeader`/
 *  `recordsHeading` props. The "Scheduled sessions" card
 *  (`UpcomingSessionsPanel`, via `rightSlot`) is gone — direct instruction —
 *  which is also what makes `fullWidthStack` correct here: that prop exists
 *  specifically for a `SupervisionRecords` caller with no `rightSlot` to sit
 *  beside.
 *
 *  Pull-up is `-mt-4` (16px), not the trainee page's `-mt-8` (32px): this
 *  page's tabpanel wrapper is `gap-10` (40px, same as Consumer Management),
 *  not the trainee page's `gap-14` (56px) — pulling up by 32px would leave
 *  only 8px here. 16px lands on the same 24px gap below `TabIntro` the
 *  trainee page's own tab uses, matching Consumer Management's identical
 *  `NotesTab` (`ConsumerDetailPage.tsx`) rather than copying a number tuned
 *  for a different wrapper. */
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

/** SPACES coach profile — drill-in from the Coach Management Table (plan §2). */
export function SpacesCoachProfilePage() {
  const { coachId } = useParams()
  const { coaches, spacesCoaches, consumerDyads } = useResearch()
  /* Deep link, for the consumer record page's "Study progress" CTA: that page
     no longer owns a study-progress view, so its button has to land here on
     the right tab **with the right consumer already selected** — dropping a
     researcher on this coach's Overview and asking them to find the consumer
     again would make the button a worse version of the existing coach link.
     `?tab=` / `?dyad=` / `?sub=`, all validated against the real lists rather
     than trusted, and all lazy initialisers so the page is correct on first
     paint. The params are a starting point only: switching tabs afterwards
     does not rewrite the URL. */
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => {
    const requested = searchParams.get('tab')
    return (TABS as readonly string[]).includes(requested ?? '') ? (requested as Tab) : 'Overview'
  })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  // Round: relocated from the "Consumers" card header (Assigned Consumers
  // tab) into the page hero (same row as the coach's name/subtitle) — both
  // "Assign consumer" and "Transfer consumer" now live here as the single
  // place for these actions, reachable from any tab, so their open state
  // lives here rather than inside `ConsumersDetailsTab`.
  const [assignOpen, setAssignOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  /* Direct instruction: "Transfer consumer" moves down to the consumer-selected
     band, because it acts on **the selected consumer** rather than on the coach
     — sitting in the hero beside "Assign consumer" it read as a coach-level
     action and gave no clue which consumer it would move. Beside it, a quick
     view of that consumer's own identity/contact/notes in a slide-in panel, so
     you can check who they are without leaving the page you are reading. */
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [consumerSubtab, setConsumerSubtab] = useState<ConsumerSubtab>(() => {
    const requested = searchParams.get('sub')
    return CONSUMER_SUBTABS.some((t) => t.id === requested)
      ? (requested as ConsumerSubtab)
      : 'progress'
  })

  const spacesCoach = spacesCoaches.find((sc) => sc.coachId === coachId)
  const coach = spacesCoach ? coaches.find((c) => c.id === spacesCoach.coachId) : undefined

  // Shared across all tabs so picking a consumer in one carries over to the
  // others, rather than each tab resetting to the first dyad independently.
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
      // Round 21: band surface only. These 3 drill-in pages keep their
      // `display-lg` name heading and their tab row — a 56px purple title
      // above a tab row reads far too heavy, and the heading here is a
      // person/dyad name rather than a page title.
      /* Round 23, frame `152:176`: the record-page hero band is a global item
         from the trainee page — solid `Purple/700`, white type, yellow active
         underline, 40px top / 80px side insets. Applied here so the three
         researcher record pages stay one treatment; see `CoachProfilePage` for
         the measured derivation of `pt-10` and the tab row's `mt-[33px]`. */
      heroClassName="bg-primary px-6 pt-10 md:px-20 md:pt-10"
      /* Round 27, frame `306:155` node `297:1883`. Consumer selection is a
         full-bleed `purple-50` band flush under the hero. It goes through
         `heroBelow` rather than being rendered as the tab panel's first child,
         because that slot is the only one outside the shell's own padded,
         max-width content container — inside it, the band inherited the page
         gutter and stopped short of both edges. Only on the tab that has a
         consumer to select. */
      heroFlushBelow
      heroBelow={
        tab === 'Assigned Consumers' && dyads.length > 0 ? (
          /* `sticky top-12` keeps the band pinned under the global header while
             the page scrolls, so the consumer whose data you are reading stays
             named on screen — direct instruction. `top-12` and `z-20` match the
             shell's own `topBanner` slot, which already sticks correctly inside
             `motion.main` despite its transform. */
          /* The padding sits on the OUTER box and the max-width container
             *inside* it — the exact nesting `ResearchShell` uses for page
             content (`px-6 md:px-20` then `mx-auto max-w-[1320px]`). Order
             matters and getting it backwards is not cosmetic: with the padding
             inside the capped box the label landed 80px right of every heading
             below it once the viewport exceeded 1320 + gutters, because the
             centring and the gutter then stack instead of the gutter being
             absorbed by the centring. Measured, not guessed. */
          <div className="sticky top-12 z-20 bg-purple-200 px-6 shadow-card md:px-20">
            {/* Direct instruction, superseding the frame's own centred group:
                the label + dropdown sit **left**, on the page's content gutter,
                with the two consumer actions right-aligned on the same row.
                The `px-6 md:px-20` + `mx-auto max-w-[1320px]` pair is copied
                from `ResearchShell`'s own content container rather than
                approximated, so the label starts on exactly the same x as every
                heading and card below it — this band is full-bleed and sits
                outside that container, which is the whole reason it needs its
                own copy of those numbers. */}
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
                  className="h-9 w-full appearance-none rounded-sm border border-hairline bg-card px-3 pr-9 text-body-md text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
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
                  which is why they are not in the hero beside "Assign
                  consumer" — that one is about the coach. `shrink-0` so a long
                  dyad label never compresses either control below the app's
                  36px floor. */}
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                >
                  View consumer details
                </Button>
                {coach.status !== 'withdrawn' && (
                  <Button
                    type="button"
                    onClick={() => setTransferOpen(true)}
                    variant="secondary"
                  >
                    Transfer consumer
                  </Button>
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

          {/* Round 23: 48px below the back link, matching the other two record
              pages. */}
          <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              {/* Round 27, frame `285:6310` (node `285:6486`): the name gains a
                  "Coach:" eyebrow, `body-md` in `parchment` on the purple band.
                  The trainee record page has had its "Trainee:" equivalent
                  since Round 21.3; this page was the one of the three record
                  pages still opening on a bare name. */}
              <p className="text-body-md text-parchment">Coach:</p>
              <h1 className="font-display text-display-lg text-white">{coach.fullName}</h1>
              {/* No sub copy, and no participant ID or employer: both facts
                  live on the Profile details tab, and neither is something you
                  act on from the top of the page. Matches the trainee and
                  consumer record pages, which also open on the name alone. */}
            </div>
            {/* Round 23 — these two CTAs are the only ones the revamp puts
                *inside* a hero band, and the frame doesn't cover them (the
                trainee and consumer heroes have no CTA). The app's canonical
                filled/outline pair both resolve to `primary`, which is now the
                band's own colour — a filled `bg-primary` button would have been
                invisible on it. So the pair is inverted rather than restyled:
                the primary action becomes white-filled with `primary` text
                (10.62:1) and the secondary a white outline with white text,
                which preserves the same filled-vs-outline hierarchy the rest of
                the app uses. */}
            {coach.status !== 'withdrawn' && (
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  tone="inverse"
                >
                  Assign consumer
                </Button>
                {/* "Transfer consumer" used to sit here as the outline half of
                    the pair. It moved to the consumer-selected band on direct
                    instruction — see `detailsOpen` above. */}
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
        /* Round 27: the tabpanel's own top margin drops to 0 on the tab that
           shows the consumer band. Three spacers were stacking below it —
           the shell's content inset (48px), this margin (64px) and
           `TabIntro`'s own `pt-4` (16px) — for 128px of gap where the frame
           has 64px. The other tabs keep the margin: they have no band, so
           this is the only thing separating them from the hero. */
        className={cn(
          'flex flex-col gap-10',
          tab === 'Assigned Consumers' && dyads.length > 0 ? 'mt-0' : 'mt-16',
        )}
      >
        {/* Profile details renders no intro — direct instruction, matching the
            trainee record page's identical "Personal details" tab: every card
            below carries a real header band naming itself, so a page title
            above them would repeat the same words a third time. */}
        {/* Round 27, frame `285:6310`: Overview renders its own `TabIntro`
            inline, paired beside the Coach Details card in the same row — the
            trainee record page's Overview already does exactly this
            (`CoachProfilePage.tsx`, frame `152:176`), so the two record pages
            keep one treatment. */}
        {/* Direct instruction: the sub-tab row sits **above** the tab intro,
            directly under the consumer band — the split it describes ("how is
            this pairing going" vs "what does their sleep data say") governs
            everything below it, including the intro copy, so it reads as the
            first thing on the panel rather than as a divider inside it.
            The shared `UnderlineTabs` rather than a second copy of the hero's
            own tab row; its `layoutId` must not collide with that row's. */}
        {tab === 'Assigned Consumers' && dyads.length > 0 && (
          /* `mb-6` on top of the tabpanel's own `gap-10`: 40px read as too
             tight under a row that governs the whole panel below it (direct
             instruction). 40 + 24 + `TabIntro`'s own 16 = 80px. */
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
        {/* Direct instruction: **no intro row at all** on the sleep & health
            sub-tab. Its own first card ("Fitbit sleep data") already carries a
            real title and sub copy immediately below, so the block restated the
            sub-tab label a third time — the same precedent the consumer record
            page's own Sleep & Health Data tab set. The two consumer actions go
            with it; they stay on the Study progress sub-tab, which is where the
            panel opens. */}
        {/* The Study progress sub-tab renders its own intro INSIDE the left
            column of its KPI row (direct instruction: the KPI block and the
            attention block are two containers stacked horizontally, so they
            have to start on the same line). Leaving it here would put the
            heading full width above both and misalign their top edges. */}
        {tab === 'Supervision Logs' && <TabIntro {...TAB_INTRO[tab]} />}
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
        {/* Direct instruction: the consumer record page's own **contact card**,
            one per dyad member, rather than a second identity treatment built
            for this panel. Stacked rather than side by side — the panel is
            480px, where that page's two-column grid would give each card
            ~216px and wrap every email mid-word.
            Notes are deliberately **not** here: this is a quick view, and a
            freeform field with a Save path is not something to edit from a
            panel you opened to check a phone number. It stays on the consumer's
            own record, which the CTA below goes to. */}
        {(() => {
          const d = dyads.find((x) => x.id === effectiveDyadId)
          if (!d) return null
          return (
            <div className="flex flex-col gap-6">
              {d.patient && <ContactDetailsCard role="PLE" person={d.patient} />}
              <ContactDetailsCard role="Carer" person={d.carer} />
              {/* Everything this panel leaves out — profile details, consent,
                  the consumer's own record — is one link away rather than
                  duplicated into the panel. */}
              <Link
                to={`/research/consumers/${d.id}?tab=${encodeURIComponent('Profile details')}`}
                className={btn({ variant: 'secondary' })}
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
