import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
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
  Download,
  MoreVertical,
  NotebookPen,
  Paperclip,
  Search,
  Users,
  Video,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/SearchInput'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
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
import { RecordRowDivider } from '@/pages/research/CoachProfilePage'
import { Card } from '@/components/ui/card'
import { TabIntro } from '@/components/research/TabIntro'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { type Coach, type NotificationPreferences } from '@/data/research'
import {
  CONSUMER_MODULES,
  SPACES_CATCHUP_COUNT,
  SPACES_SESSIONS,
  catchupSessionsCompleted,
  displaySessionNumber,
  isPlanSet,
  latestAnnotationState,
  moduleUnlockState,
  nextUpcomingSessionEntry,
  type AnnotationShareState,
  type ConsumerDyad,
  type PersonProfile,
  type SessionCompletionRecord,
} from '@/data/spaces'
import { useResearch } from '@/data/research-context'
import { formatDate, formatTime, TODAY } from '@/data/format'

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
        {/* Frame node `297:1802` — the card's own header is plain white with the
            title/sub on the left and the search field on the right; the
            `purple-50` tint moves down onto the table's real `<thead>` below.
            A documented, frame-driven divergence from §35a (the card-header
            band): the tint is the boundary, so a second one above it would
            read as two headers. Same call Round 23 made on Stage Management. */}
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
            /* Three genuinely different empty states. A search that matches
               nothing is not the same as a tab with nobody in it, and neither
               is the same as a coach with no caseload at all — one message for
               all three would be false in two of the cases. All three now use
               the shared icon-led treatment (Round 27), with the icon carrying
               the difference: a search glass for a query, a check for a tab
               that is legitimately empty. */
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
          /* Frame node `297:1811`: the table sits in its own bordered, 16px
             rounded container inside the card — not flush against the card's
             own edge. `overflow-hidden` is what clips the tinted `<thead>` to
             the rounded corners.
             No shadow, on direct instruction. The frame does draw one here
             (`2px 4px 16px rgba(230,194,127,0.2)` — the same `shadow-card`
             the parent card carries), but nesting the card shadow inside a
             card that already has it reads as a second floating surface.
             `shadow-none` is explicit rather than merely omitted, since this
             is a deliberate divergence from the frame, not an oversight. */
          <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-parchment shadow-none">
            {/* 820px -> 930px when the Session Plan column was added, then
                -> 1080px when the frame's Session Date column joined it. The
                floor has to grow with the column count or a new cell squeezes
                a neighbour into a wrap at narrow widths. */}
            <table className="w-full min-w-[1080px] border-collapse text-left">
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
                  {/* Frame node `297:1816` names this "Annotation summary" —
                      adopted over the previous bare "Annotation", matching this
                      project's own terminology table (an annotation summary is
                      the artifact; "annotation" alone is the act). */}
                  <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                    Annotation summary
                  </th>
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
                  <td className="px-4 py-3">
                    <Chip
                      tone={latestAnnotationState(d) === 'shared' ? 'success' : 'muted'}
                      label={annotationStatusLabel[latestAnnotationState(d)]}
                    />
                  </td>
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

  const professionalFields = [
    { label: 'Partner org', value: coach.employer },
    { label: 'Role at employer', value: coach.roleAtEmployer },
    { label: 'Years in aged care', value: `${coach.yearsInAgedCare} years` },
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
    'inline-flex h-9 shrink-0 items-center rounded-sm border bg-card px-4 text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
    'border-destructive text-destructive hover:bg-destructive/8',
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
export function PersonCard({
  title,
  person,
  showRelationship,
  onSave,
}: {
  title: string
  person: PersonProfile
  showRelationship: boolean
  onSave: (patch: Partial<PersonProfile>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  const [age, setAge] = useState(String(person.age))
  const [relationship, setRelationship] = useState(person.relationship ?? '')
  const [background, setBackground] = useState(person.background)

  return (
    <Card className="gap-0 self-start rounded-lg py-0">
      <div className="bg-card-header p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-title">{title}</h3>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 items-center rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Edit details
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-hairline p-6 pt-4">
        {editing ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              onSave({
                name,
                age: Number(age) || person.age,
                ...(showRelationship ? { relationship } : {}),
                background,
              })
              setEditing(false)
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-fine text-ink-faint">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-fine text-ink-faint">Age</label>
                <input
                  type="number"
                  min={0}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {showRelationship && (
              <div className="flex flex-col gap-1">
                <label className="text-fine text-ink-faint">Relationship to PLE</label>
                <input
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-fine text-ink-faint">Background</label>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={4}
                className="w-full rounded-sm border border-hairline bg-card px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
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
                  setName(person.name)
                  setAge(String(person.age))
                  setRelationship(person.relationship ?? '')
                  setBackground(person.background)
                  setEditing(false)
                }}
                className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl>
            {[
              { label: 'Name', value: person.name },
              { label: 'Age', value: String(person.age) },
              ...(showRelationship
                ? [{ label: 'Relationship to PLE', value: person.relationship ?? '—' }]
                : []),
              { label: 'Background', value: person.background },
            ].map((f, i) => (
              <div key={f.label}>
                {i > 0 && <Separator className="bg-divider-soft" />}
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-caption text-ink-faint">{f.label}</dt>
                  <dd className="text-caption leading-[1.6] text-ink">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Card>
  )
}

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
/* Exported (Round 39) so the coach's own client page can render the create-plan
   path directly. `SessionTracker` left that page when the Coaching workspace tab
   was rebuilt, which took the only way to create a plan anywhere in the coach
   portal with it — a client with no plan became a dead end. The banner is the
   whole of that path, so it is what the page renders rather than the full
   tracker coming back. */
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
  return (
    <Card className="flex-row items-center gap-12 overflow-hidden border-parchment bg-primary py-12 pr-12 pl-6 max-lg:flex-col max-lg:items-start max-lg:gap-8 max-lg:p-8">
      {/* The wrapper is load-bearing, not tidiness. `Card` carries
          `has-[>img:first-child]:pt-0` and `*:[img:first-child]:rounded-t-xl`
          — media-card rules for artwork meant to bleed to the top edge. A
          bare `<img>` here is that first child and tripped them: measured,
          the banner's top padding came out **0 where the frame says 48**,
          which reads as "the art sits a bit high" rather than as a bug. The
          wrapper takes the first-child slot so neither rule fires.
          Decorative: the sentence beside it already carries the meaning. */}
      <div className="shrink-0 max-lg:w-full">
        <img
          src="/illustrations/session-plan-calendar.svg"
          alt=""
          aria-hidden="true"
          className="h-[184.992px] w-[319.89px] max-lg:h-auto max-lg:w-full max-lg:max-w-[320px]"
        />
      </div>
      {/* `min-w-0` — a flex child defaults to `min-width: auto`, so without it
          the copy sizes the row instead of wrapping inside it. This project
          has shipped a real horizontal page scroll that way three times. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-6 px-4 max-lg:px-0">
        <div className="flex flex-col gap-2 text-white">
          {/* No full stop — direct instruction. */}
          <h3 className="font-display text-display-md text-balance">No session plan created yet</h3>
          {/* Copy pass, Round 37. Three changes off the frame's own wording,
              each against a convention this portal already holds:
                - "Select the button below to create one." is cut. The button
                  is the next thing on the page and says what it does, so the
                  sentence only sends a coach looking for a control they can
                  already see (the Round 36 empty-state rule).
                - "your step 1 is to" is cut. It implies a numbered sequence
                  the UI never shows; "before your first session" carries the
                  same ordering in plain language.
                - "coaching journey" -> "work". Round 17 rewrote this portal's
                  copy away from marketing voice three times.
              And it restores the rule the old empty state carried and the
              frame dropped — what a plan actually *does* — so the absence
              reads as a step not yet taken rather than something missing.
              No contractions, per the Round 32 sweep. */}
          <p className="text-body leading-[1.4] text-white/90">
            To start your work with{' '}
            {dyad.patient && (
              <>
                <strong className="font-bold">{dyad.patient.name}</strong> and{' '}
              </>
            )}
            <strong className="font-bold">{dyad.carer.name}</strong>, create a coaching session
            plan with them. It sets when each module unlocks and when you will meet to catch up.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            ref={ctaRef}
            type="button"
            onClick={onCreate}
            className="inline-flex h-11 min-w-[232px] items-center justify-center rounded-full border border-primary bg-white px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-parchment focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.97]"
          >
            Create session plan
          </button>
          {/* Round 40, direct instruction: a secondary "Why is this necessary?".
              It opens a real explanation rather than taking this app's unwired
              treatment — the answer is domain knowledge the product already
              holds, so a button that asks a question and then does nothing
              would be the worst of the options. White-outline on the purple
              band, the same pairing the coach Home banner's own two CTAs use. */}
          <button
            type="button"
            onClick={() => setWhyOpen(true)}
            className="inline-flex h-11 min-w-[232px] items-center justify-center rounded-full border border-white px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.97]"
          >
            Why is this necessary?
          </button>
        </div>
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
  // `tabIndex={-1}`) heading instead, same pattern as `SlideLayout`'s
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
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            Edit plan
          </button>
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
                            <button
                              type="button"
                              aria-disabled="true"
                              className="relative inline-flex h-9 shrink-0 cursor-not-allowed items-center rounded-sm bg-pearl px-4 text-caption-medium text-ink-faint outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Mark session complete
                              <span className="sr-only">
                                {' '}
                                for Session {displayNumber}. Available once{' '}
                                {row?.date ? formatDate(row.date) : 'the scheduled date'} has passed
                              </span>
                            </button>
                          )}
                          {!done && !isFuture && (
                            <button
                              type="button"
                              onClick={() =>
                                setPending({ session: session.number, name: session.name, action: 'complete' })
                              }
                              className="relative inline-flex h-9 shrink-0 items-center rounded-sm bg-pearl px-4 text-caption-medium text-primary outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                            >
                              Mark session complete
                              <span className="sr-only"> for Session {displayNumber}</span>
                            </button>
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
 *  other copy lives unexported inside `ResearchNotificationHub`. */
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
      {/* `annotationStatusLabel` is shared with the Coach Delivery Portal, so
          the "Not yet" label stays as it is there; only this tile substitutes
          the em dash, since a reflection that isn't due yet is an absent value
          rather than a status worth naming. */}
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

/** Frame node `297:3495` — three labelled groups of label/value rows, each
 *  group separated by a `hairline` rule. */
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
  /* "Left incomplete" is derived, not a stored status: the union only has
     not-started / in-progress / completed. A module counts as left behind once
     its own catch-up session has already been held without it being finished —
     the same rule the sessions table renders as its "Incomplete" chip, so the
     two cannot disagree. */
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
 * Frame node `297:3575` "Latest updates".
 *
 * Built on Consumer Management's own "Needs attention" card
 * (`ConsumerDetailPage.tsx`) on direct instruction — same `Card` + `purple-50`
 * header + `border-t` divider + `destructive`-dot bullet list, so the two read
 * as one pattern rather than two feed styles.
 *
 * Two rules this card follows, both from direct instruction:
 *
 * 1. **Attention only.** It is not a study log. Routine facts — a module
 *    finished on time, a session held as planned, a reflection shared — belong
 *    to the sessions table below and are deliberately excluded, or this card
 *    becomes a second, worse copy of it.
 * 2. **Log style, not prose.** An identifier plus ` · ` qualifiers, no
 *    sentences ("Session 2 · held 5 Aug · Module 2 not completed", never
 *    "Session 2 was held while Module 2 was still incomplete"). This is the
 *    same correction already applied to the consumer study log in Round 25
 *    ("the details sounds like ai"), and it is why nothing here is written as
 *    a narrated event.
 *
 * Every item is derived from the record. Nothing is seeded, so an empty card
 * genuinely means nothing needs attention.
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
    /* `h-full` + a `flex-1` content section: this card shares a row with the
       study-progress timeline and the two heights must match (direct
       instruction). The card is the shorter of the two, so it grows into the
       row's height rather than the timeline shrinking to it. */
    <Card className="h-full gap-0 rounded-lg py-0">
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
      <div className="flex flex-1 flex-col gap-4 border-t border-hairline p-6 pt-4">
        {sorted.length === 0 ? (
          /* Icon-led empty state on direct instruction. The copy is one short
             line — the previous two-clause sentence naming the coach read as
             unfinished body text rather than a resting state. */
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
  /* Direct instruction: the coach's own reflection moves out of the study
     progress stack and onto its own sub-tab, last. It is the one thing on this
     panel authored by the coach rather than derived from the consumer's
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
  /** Owned by the page, not by this component: direct instruction puts the
   *  sub-tab row **above** the tab-level `TabIntro`, and that block is
   *  rendered by the page. */
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
      {selected && <StudyProgressKpis dyad={selected} />}

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

      {/* The two breakdown cards keep their own equal-width row below. */}
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

/** Exported for reuse by the Coach Delivery Portal's My Reflections tab
 *  (Round 6.2) — a coach-facing history list needs the same display label. */
export const annotationStatusLabel: Record<AnnotationShareState, string> = {
  shared: 'Shared',
  'not-shared': 'Not shared',
  'not-yet': 'Not yet',
}

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
  const session1Done = (sessionCompletion[dyad.id] ?? []).some((s) => s.session === 1)

  const shared = dyad.annotationSummaries.filter((e) => e.shared)

  return (
    /* Round 27, frame `306:155` node `297:2237`. The section title and sub copy
       sit on the page canvas, *outside* the card — the same external-title
       pattern `SleepDiaryFeed` and the sessions table already use — and the
       body is a plain document: one row per SIPTEA component, the component
       name in `primary` on a fixed 180px track, the answer beside it. No
       `purple-50` header band, because there is no header to band. */
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
            {/* Date/time and the Shared chip sit above the rows rather than in
                a tinted band: the frame's own doc has no header, and the
                surrounding section title already names what this is. */}
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

  /* Round 23, frame `174:5` (nodes `172:1824`/`172:1765`). The heading moves
     OUT of the card onto the page canvas (`body-md`, 16px above it), and the
     card becomes a `yellow-50` shell with a `purple-50` header row and white
     data rows — no outer border, the tint carries the edge. Columns are the
     frame's fixed widths with Title flexing.
     Note this drops the records sub-line: with the heading outside the card
     there is no header band left to hold it, and the trainee page's `TabIntro`
     already says what this table is. */
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
      heroClassName="bg-purple-700 px-6 pt-10 md:px-20 md:pt-10"
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
          <div className="sticky top-12 z-20 bg-purple-50 px-6 shadow-card md:px-20">
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
                  which is why they are not in the hero beside "Assign
                  consumer" — that one is about the coach. `shrink-0` so a long
                  dyad label never compresses either control below the app's
                  36px floor. */}
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
                <button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-white px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-parchment focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  Assign consumer
                </button>
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
