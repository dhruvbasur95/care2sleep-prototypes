import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  BellRing,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Info,
  Moon,
  NotebookPen,
  NotebookText,
  Timer,
  Video,
} from 'lucide-react'
import { DeliveryShell } from '@/components/delivery/DeliveryShell'
import {
  AddAnnotationSummaryModal,
  ReflectionReviewTable,
} from '@/components/delivery/AddAnnotationSummaryModal'
import { WaveDivider } from '@/components/delivery/WaveDivider'
import { BannerBlob } from '@/pages/delivery/DeliveryHomePage'
import { Chip } from '@/components/research/StatusChip'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { TablePager } from '@/components/shared/TablePager'
import { Toast } from '@/components/shared/Toast'
import { SegmentedSwitch } from '@/components/shared/SegmentedSwitch'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { cn } from '@/lib/utils'
/* `SessionTracker`'s import went with the Round 39 removal of the after-session
   half of the Coaching workspace tab. The component itself is untouched and
   still rendered by the researcher's `SpacesCoachProfilePage`. */
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { EditSessionPlanModal } from '@/components/research/EditSessionPlanModal'
import { PlanSessionsModal } from '@/components/research/PlanSessionsModal'
import { SessionPlanEmptyBanner } from '@/pages/research/SpacesCoachProfilePage'
import {
  SleepDiaryFeed,
  FitbitAveragesTable,
  FitbitSyncMonitor,
  ProfileDetailsSections,
} from '@/pages/research/ConsumerDetailPage'
import {
  dyadsForCoach,
  displaySessionNumber,
  isPlanSet,
  nextPlannedSession,
  sessionRowLabel,
  SPACES_CATCHUP_COUNT,
  type AnnotationSummaryEntry,
  type ConsumerDyad,
  type SessionCompletionRecord,
  type SupervisionNote,
} from '@/data/spaces'
import { useResearch } from '@/data/research-context'
import { formatDate, formatDateLong, formatSleepDuration, formatTime, TODAY } from '@/data/format'

const COACH_ID = 'helen-zhang'

/** Five per page, matching the trainee My Notes page's own pager. */
const NOTES_PER_PAGE = 5

/* Round 36, direct instruction. Three changes, all removals rather than
   rearrangements:
     - "Learning Progress" is gone. The client's module progress reads off the
       researcher's own Coach Management record instead.
     - "My Reflections" is gone as a *tab*; the reflection card moved into
       the first tab, directly under the session tracker it is written about.
       It was one card in an otherwise empty tab.
     - "Sleep & Health Data" -> "Client sleep & health data" (coach-facing
       surfaces say "client", CLAUDE.md terminology).

   Round 37, direct instruction: "Overview" -> "Coaching workspace". Once the
   two contact cards came off it, the tab stopped being a summary of the client
   and became the place a coach does the work — run the session plan, mark a
   session held, write the reflection that follows. "Overview" named the old
   contents; this names what it is for. */
/* Round 40, direct instruction: "My reflections" sits **before** Client Profile
   Details. That order is also the working order — the first four tabs are what
   a coach does around a session (prepare, write up, read the data, reflect),
   and the client's own record is reference material behind them. */
const TABS = [
  'Coaching workspace',
  'Case notes',
  'Client sleep & health data',
  'My reflections',
  'Client Profile Details',
] as const
type Tab = (typeof TABS)[number]

/**
 * Where the tab row parks, in px from the top of the viewport.
 *
 * `AppHeader` is itself `sticky` and measures 48px, so anything smaller slides
 * underneath it. The remaining 24px is `DeliveryShell`'s own `py-6` — the exact
 * gap the side nav card keeps below the header — so when the row parks, its top
 * edge lines up with the sidebar's (direct instruction) rather than sitting on
 * an offset of its own.
 *
 * Shared by the CSS offset and the sentinel's `rootMargin` — they have to agree
 * or the chrome switches on at the wrong scroll position.
 */
const TABS_STICKY_TOP_PX = 48 + 24

function dyadTitle(dyad: ConsumerDyad): string {
  return dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name
}

/* ------------------------------------------------------------------------ */
/* Sleep & Health Data                                                       */
/* ------------------------------------------------------------------------ */

const HEALTH_VIEWS = [
  { id: 'fitbit', label: 'Fitbit sleep data' },
  { id: 'diary', label: 'Sleep diary notes' },
] as const
type HealthView = (typeof HEALTH_VIEWS)[number]['id']

/** The window both KPI rows summarise. */
const HEALTH_KPI_NIGHTS = 7

/** Mean of the defined values only, or `undefined` if none are.
 *
 *  Skipping absent values rather than counting them as zero is the same rule
 *  `FitbitAveragesTable` follows, and for the same reason: an unsynced night has
 *  no REM figure at all, and treating it as 0 would drag every average toward
 *  zero and read as a sleep problem that is really a flat battery. */
function meanOf(values: (number | undefined)[]): number | undefined {
  const present = values.filter((v): v is number => v !== undefined)
  if (present.length === 0) return undefined
  return present.reduce((a, b) => a + b, 0) / present.length
}

/**
 * The yellow KPI row above each health section (direct instruction: "show some
 * fitbit relevant KPIs before the table, re-use same yellow cards", and the same
 * for sleep diary notes).
 *
 * Reuses the app's own `StatCard` — the frames' yellow tile — rather than a new
 * one, with a PLE/Carer `breakdown` per tile: everything a coach reads here is
 * two people's figure side by side, which is exactly what `breakdown` is for.
 * Carer-only dyads get a single part, since `people` is built off the dyad.
 *
 * Rendered by the tab, **above** the section, so neither `FitbitSyncMonitor` nor
 * `SleepDiaryFeed` needed a prop for it — both are shared with the researcher
 * and Consumer portals, and the instruction was explicit that the researcher
 * stays as it is. Nothing about those components changed.
 *
 * The window is a fixed `HEALTH_KPI_NIGHTS` and the labels say so, deliberately
 * independent of the Fitbit section's own date-range select: that select is
 * internal state, and a KPI silently retitling itself as a table filter changes
 * would be two different claims sharing one number.
 */
function HealthKpiRow({ dyad, view }: { dyad: ConsumerDyad; view: HealthView }) {
  const people = [
    ...(dyad.patient ? [{ key: 'PLE', log: dyad.patientLog }] : []),
    { key: 'Carer', log: dyad.carerLog },
  ].map((p) => ({ ...p, window: p.log.slice(-HEALTH_KPI_NIGHTS) }))

  const fmt = (v: number | undefined, suffix = '') =>
    v === undefined ? '—' : `${Math.round(v)}${suffix}`
  /* A count's mean is genuinely fractional — "0.4 wakings a night" is a real
     reading, and rounding it to 0 would claim undisturbed sleep. */
  const fmtCount = (v: number | undefined) =>
    v === undefined ? '—' : Number.isInteger(v) ? String(v) : v.toFixed(1)

  const tiles =
    view === 'fitbit'
      ? [
          {
            label: `Average sleep · last ${HEALTH_KPI_NIGHTS} nights`,
            icon: Moon,
            parts: people.map((p) => {
              const m = meanOf(p.window.map((e) => e.durationMin))
              return { label: p.key, value: m === undefined ? '—' : formatSleepDuration(Math.round(m)) }
            }),
          },
          {
            label: 'Average REM',
            icon: Activity,
            parts: people.map((p) => ({
              label: p.key,
              value: fmt(meanOf(p.window.map((e) => e.remPercent)), '%'),
            })),
          },
          {
            label: 'Average disturbances a night',
            icon: BellRing,
            parts: people.map((p) => ({
              label: p.key,
              value: fmtCount(meanOf(p.window.map((e) => e.disturbances))),
            })),
          },
        ]
      : [
          {
            label: 'Average time to fall asleep',
            icon: Timer,
            parts: people.map((p) => ({
              label: p.key,
              value: fmt(meanOf(p.window.map((e) => e.diary?.sleepLatencyMin)), ' min'),
            })),
          },
          {
            label: 'Average night wakings',
            icon: BellRing,
            parts: people.map((p) => ({
              label: p.key,
              value: fmtCount(meanOf(p.window.map((e) => e.diary?.wakeCount))),
            })),
          },
          {
            label: `Nights logged · last ${HEALTH_KPI_NIGHTS}`,
            icon: NotebookPen,
            parts: people.map((p) => ({
              label: p.key,
              value: `${p.window.filter((e) => e.diary).length} of ${p.window.length}`,
            })),
          },
        ]

  return (
    /* `min-w-0` on the grid **and** its cells: items default to
       `min-width: auto`, so one wide tile sizes the track instead of fitting
       inside it. This project has shipped a real horizontal page scroll that way
       three times. */
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <div key={t.label} className="min-w-0">
          {/* `inline`, not `stacked`. Measured: `stacked` lays the parts out in
              `grid-cols-3` regardless of how many there are, so two parts each
              got a third of the tile — narrow enough that "39 min" and "7 of 7"
              wrapped onto two lines at 32px and the three tiles ended up
              different heights. `inline` sits each label beside its own number
              on a wrapping row, which these two-part tiles fit on one line. */}
          <StatCard label={t.label} icon={t.icon} breakdown={t.parts} />
        </div>
      ))}
    </div>
  )
}

/**
 * Round 39, direct instruction: the two sections no longer stack. A top-right
 * button switcher shows one at a time.
 *
 * The two are alternatives in practice — objective device data vs. what the
 * client wrote down — and both are tall tables, so stacking them meant the
 * diary was permanently below the fold of an 18-night Fitbit log. Switching
 * also means only one of the two owns the viewport at a time, which is the
 * whole reason the page reads as less cluttered.
 *
 * `SleepDiaryFeed` keeps its own title here (no `compact`): with the Fitbit
 * section hidden there is no card header above it doing that job, unlike the
 * pre-session checklist.
 */
function SleepHealthDataTab({ dyad }: { dyad: ConsumerDyad }) {
  const [view, setView] = useState<HealthView>('fitbit')
  return (
    <div className="flex flex-col gap-6">
      {/* The switcher sits on its own row, right-aligned, above whichever
          section is showing. It is deliberately NOT inside either section's
          own header row: both already put a date control and Export there, and
          a third control in that cluster read as one more filter on the table
          rather than the thing that chooses the table. */}
      {/* Title left, switcher right (direct instruction). The row was
          `justify-end` with the switcher floating alone above the tiles; the
          heading gives it something to be the control *for*, and names the
          section the KPI row summarises. "Sleep and health data overview" — the
          tab above already establishes whose data this is, so it does not
          repeat "Client". */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="min-w-0 font-display text-title text-ink">
          Sleep and health data overview
        </h2>
        <SegmentedSwitch
          options={HEALTH_VIEWS}
          active={view}
          onChange={setView}
          ariaLabel="Sleep data view"
          idPrefix="client-health-view"
          panelId="client-health-panel"
        />
      </div>
      <div
        id="client-health-panel"
        role="tabpanel"
        aria-labelledby={`client-health-view-${view}`}
      >
        {/* KPIs first, then the section's own title / tabs / table (direct
            instruction). 56px below the row, raised from 40px on direct
            feedback — the KPI tiles are a summary of the section beneath them,
            and at 40px they read as part of its header rather than as their own
            band. */}
        <div className="flex flex-col gap-14">
          <HealthKpiRow dyad={dyad} view={view} />
          {view === 'fitbit' ? (
            <FitbitSyncMonitor dyad={dyad} tabsMatchPageRow />
          ) : (
            <SleepDiaryFeed dyad={dyad} viewerRole="coach" />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Case notes  (tab was "Session Notes" until Round 36.1 — a coach calls these
   case notes; the tab was the last surface still saying otherwise)          */
/* ------------------------------------------------------------------------ */

/**
 * Round 36, direct instruction — rebuilt on the trainee My Notes page's shape
 * (`DeliveryNotesPage`, frames `638:12057`/`641:12593`/`641:12650`): a write
 * box, the hand-drawn wave rule, then a table of everything written before.
 *
 * Three deliberate departures from that page, all because these are a client's
 * **case notes** rather than a coach's private scratchpad:
 *
 *  1. **Every note is mapped to a session.** A case note is always about a
 *     session that happened, so the session is a required field rather than a
 *     free-text title alone, and it leads the table. Only sessions the dyad has
 *     actually *completed* are offered — a note about a session nobody has held
 *     yet is not a thing, and offering the whole 7-row plan would invite one.
 *  2. **Notes are editable** (direct instruction). A coach writing up a session
 *     from memory gets details wrong; the trainee page's read-only viewer is
 *     wrong for a record that has to be accurate.
 *  3. **No delete.** The trainee page's own notes are disposable and its table
 *     carries a Delete. A client's case note is a clinical record — this is
 *     flagged rather than silently matched to "same format", and is a one-line
 *     addition if the study wants it.
 *
 * The previous "Upcoming sessions" panel that sat beside the form is gone
 * (direct instruction), and the ad-hoc-meeting dialog went with it — that
 * panel's "Add" control was its only trigger. The store's `addAdHocMeeting`
 * action is left in place; it is a data-layer capability with no UI owner
 * right now, not dead code inside this page.
 */
function SessionNotesTab({ dyad }: { dyad: ConsumerDyad }) {
  const { supervisionNotes, sessionCompletion } = useResearch()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  /* `sessionCompletion` is seeded from every dyad's own `sessionsCompleted`
     at store init, so this is the complete list, not just live toggles.
     Sorted ascending so the edit dialog's own session picker reads
     Planning -> Session 1 -> ... The *write* form no longer takes it: a new
     case note here is always ad-hoc (Round 39). */
  const completedSessions = [...(sessionCompletion[dyad.id] ?? [])].sort(
    (a, b) => a.session - b.session,
  )

  const notes = supervisionNotes
    .filter((n) => n.coachId === COACH_ID && n.dyadId === dyad.id)
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))

  return (
    <div className="flex flex-col gap-12">
      <AddSessionNoteCard
        dyad={dyad}
        onSaved={() => {
          // The Save button goes disabled underneath the coach the instant the
          // form clears, so it is a dead end for focus. Send focus to the list
          // heading — that is what says *where the note went* to a keyboard or
          // screen-reader user. Same pairing the trainee notes page uses.
          setConfirmation('Note saved.')
          headingRef.current?.focus()
        }}
      />

      <WaveDivider label="Your previous case notes" />

      <SessionNotesTable
        notes={notes}
        completedSessions={completedSessions}
        headingRef={headingRef}
        onEdited={() => {
          setConfirmation('Note updated.')
          headingRef.current?.focus()
        }}
      />

      <Toast message={confirmation} onDismiss={() => setConfirmation(null)} />
    </div>
  )
}

const noteFieldLabel = 'text-caption-medium text-ink-muted'
const noteFieldInput =
  'h-11 w-full rounded-sm border border-hairline bg-white px-4 text-body text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'
const noteFieldTextarea =
  'h-40 w-full resize-y rounded-sm border border-hairline bg-parchment p-4 text-body text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

/**
 * The write box — `641:12593`'s shape: title, body, save.
 *
 * **Round 39, direct instruction: no session field.** Case notes here are
 * ad-hoc notes; notes about a specific session will be written from the
 * Coaching workspace instead. Removing the select takes two things with it that
 * only existed to serve it:
 *
 *  - The "no sessions held yet" branch. It replaced the whole form with an
 *    explanation, because a required field had no valid option. An ad-hoc note
 *    needs no session, so every client can now be written about from day one —
 *    which is the case that most wants a note ("first call did not connect").
 *  - The `completedSessions` prop. Nothing in this card reads it any more.
 *
 * Notes saved here carry no `session`, so the table below labels them Ad-hoc.
 * The field stays optional on `SupervisionNote` for the workspace path to set.
 */
function AddSessionNoteCard({
  dyad,
  onSaved,
}: {
  dyad: ConsumerDyad
  onSaved: () => void
}) {
  const { addSupervisionNote } = useResearch()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  // `now` is captured once per mount rather than read at submit time, so the
  // stamp shown in the header is the same instant that gets saved — a coach who
  // reads "10:51 am" and then writes for two minutes should not find 10:53 in
  // the table. Same reasoning as the trainee notes page.
  const [now] = useState(() => new Date())

  const canSave = title.trim().length > 0 && body.trim().length > 0

  return (
    <section className="flex flex-col items-end gap-6 overflow-hidden rounded-lg border border-parchment bg-white p-8 shadow-card">
      <div className="flex w-full items-start justify-between gap-6">
        {/* Round 40, direct instruction: say that this writes an **ad-hoc**
            note. Without it the card read as the way to write up a session,
            which it is not — session notes arrive auto-generated. The second
            line is what makes the table's two kinds legible from the one
            surface a coach actually types on. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-display text-title text-ink">Add an ad-hoc case note</h2>
          <p className="text-caption text-ink-muted">
            Session notes are generated for you. Use this for anything in between.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-body-md text-ink">
          <span>
            {now.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span aria-hidden="true" className="size-1 rounded-full bg-ink" />
          <span>
            {now
              .toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
              .toLowerCase()}
          </span>
        </div>
      </div>

      <form
          className="flex w-full flex-col items-end justify-end gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSave) return
            /* No `session` — see this card's own comment. The field is left
               undefined rather than set to a placeholder, because "no session"
               is the true state of an ad-hoc note and the table reads it
               directly. */
            addSupervisionNote(COACH_ID, {
              title: title.trim(),
              date: TODAY,
              time: new Date().toTimeString().slice(0, 5),
              notes: body.trim(),
              attachments: [],
              dyadId: dyad.id,
            })
            setTitle('')
            setBody('')
            onSaved()
          }}
        >
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="case-note-title" className={noteFieldLabel}>
              Give a title to your note
            </label>
            <input
              id="case-note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title here"
              className={noteFieldInput}
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <label htmlFor="case-note-body" className={noteFieldLabel}>
              Notes
            </label>
            <textarea
              id="case-note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write here"
              className={noteFieldTextarea}
            />
          </div>

          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-[248px]"
          >
            Save note
          </button>
        </form>
    </section>
  )
}

/**
 * Round 40 — the provenance filter above the table (direct instruction: "an
 * option to filter my adhoc ones vs AI generated"). The notes are drafted by
 * the AI; the label a coach reads says **Auto generated**, per a follow-up
 * instruction — the coach cares that they did not type it, not what wrote it.
 *
 * Each predicate matches **exactly what the row renders**, which is why they
 * are not written as complements of one another:
 *
 *  - `adhoc` reads `session === undefined`, which is precisely the condition
 *    the Session column draws its "Ad-hoc" chip on.
 *  - `auto` reads `autoGenerated`, which is precisely the condition the Title
 *    column draws its "Auto generated" chip on.
 *
 * So neither filter can ever disagree with the label a coach can see. They are
 * disjoint today and would still each be truthful if that stopped being so (an
 * auto-drafted ad-hoc note would simply appear under both) — where an
 * `!autoGenerated` "Ad-hoc" predicate would start quietly filing coach-typed
 * session notes under a chip they do not carry.
 */
const NOTE_FILTERS = [
  { id: 'all', label: 'All notes', match: () => true },
  { id: 'adhoc', label: 'Ad-hoc', match: (n: SupervisionNote) => n.session === undefined },
  { id: 'auto', label: 'Auto generated', match: (n: SupervisionNote) => n.autoGenerated === true },
] as const

type NoteFilterId = (typeof NOTE_FILTERS)[number]['id']

/* Round 40, direct instruction: white card + outline + shadow, for the
   populated table *and* the empty state. Both were `bg-yellow-50` with neither
   a stroke nor a shadow, which left the section reading as a tinted patch on
   the canvas rather than as a card — while the write box directly above it was
   a real card. Declared once so the two states cannot drift: an empty table
   and a full one are the same surface with different contents. */
const NOTES_SURFACE = 'overflow-hidden rounded-lg border border-parchment bg-white shadow-card'

/** `641:12650`'s table with a Session column leading it, and Edit alongside
 *  View. `table-fixed` is load-bearing here for the same reason it is on the
 *  trainee page: under auto layout the body excerpt sizes the Title column and
 *  pushes the table past its own container. */
function SessionNotesTable({
  notes,
  completedSessions,
  headingRef,
  onEdited,
}: {
  notes: SupervisionNote[]
  completedSessions: SessionCompletionRecord[]
  headingRef: React.Ref<HTMLHeadingElement>
  onEdited: () => void
}) {
  const [viewing, setViewing] = useState<SupervisionNote | null>(null)
  const [editing, setEditing] = useState<SupervisionNote | null>(null)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<NoteFilterId>('all')

  const activeFilter = NOTE_FILTERS.find((f) => f.id === filter) ?? NOTE_FILTERS[0]
  const filtered = notes.filter(activeFilter.match)

  const lastPage = Math.max(0, Math.ceil(filtered.length / NOTES_PER_PAGE) - 1)
  // Adding a note while parked deep in the list would otherwise leave the pager
  // pointing past the end, showing an empty table with no way back. Narrowing
  // the filter does the same thing, and is caught by the same guard.
  useEffect(() => {
    if (page > lastPage) setPage(lastPage)
  }, [page, lastPage])

  const visible = filtered.slice(page * NOTES_PER_PAGE, (page + 1) * NOTES_PER_PAGE)

  return (
    <section className="flex flex-col gap-4">
      <h2 ref={headingRef} tabIndex={-1} className="sr-only outline-none">
        Your previous case notes
      </h2>

      {/* Changing the filter swaps the whole table with no other cue, and the
          pager's own live region only exists past five notes — so on a short
          list a screen-reader user would hear nothing at all. */}
      <p aria-live="polite" className="sr-only">
        {`${filtered.length} ${filtered.length === 1 ? 'note' : 'notes'} shown.`}
      </p>

      {/* The filter row only earns its space once there is something to filter.
          A single note with three buttons above it is chrome, not a control.
          `role="group"` + `aria-pressed` toggles rather than a `role="radio"`
          set: this project shipped a hand-rolled radiogroup without the
          roving-tabindex/arrow-key contract those roles require once already
          (Round 14.5, `WeekdayPicker`), and toggles carry no such promise. */}
      {notes.length > 1 && (
        <div role="group" aria-label="Filter case notes" className="flex flex-wrap gap-3">
          {NOTE_FILTERS.map((f) => {
            const active = f.id === filter
            const count = notes.filter(f.match).length
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(f.id)
                  setPage(0)
                }}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-[18px] text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-hairline bg-white text-ink-muted hover:bg-purple-50',
                )}
              >
                {f.label}
                {/* The count is still part of the button's own label — "AI
                    generated, 1" is what a screen reader announces, and an
                    empty bucket is visible before the coach spends a click
                    finding out. Round 40, direct instruction: give it a label
                    style rather than leaving it as loose text, where at the
                    same size and weight as the word beside it "Ad-hoc 1" read
                    as part of the name. */}
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-fine',
                    active ? 'bg-white/20 text-white' : 'bg-purple-50 text-primary',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        /* The empty state gets the **same card** the populated table sits in
            (direct instruction: "missing card"). It was bare on the page canvas
            while the write box directly above it was a card, so the section
            looked like it had lost its container rather than like it had no
            rows. `rounded-lg bg-yellow-50` is the table's own wrapper, reused
            verbatim so the two states are the same surface. */
        <div className={NOTES_SURFACE}>
          {/* "No notes yet" and "no notes *of this kind*" are different facts,
              and showing the first while a filter is on would read as the
              client's whole history having vanished. */}
          <EmptyState
            icon={NotebookText}
            copy={
              notes.length === 0
                ? 'No case notes yet.'
                : `No ${activeFilter.label.toLowerCase()} case notes yet.`
            }
          />
        </div>
      ) : (
        <div className={NOTES_SURFACE}>
          <table className="w-full table-fixed text-caption">
            <thead>
              <tr className="bg-purple-50 text-ink-muted">
                <th scope="col" className="w-[140px] py-3.5 pl-8 text-left font-medium">
                  Session
                </th>
                <th scope="col" className="px-8 py-3.5 text-left font-medium">
                  Title
                </th>
                <th scope="col" className="w-[140px] px-0 py-3.5 text-left font-medium">
                  Date
                </th>
                <th scope="col" className="w-[100px] px-0 py-3.5 text-left font-medium">
                  Time
                </th>
                <th scope="col" className="w-[150px] py-3.5 pr-8 text-left font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((note) => (
                /* `last:border-b-0` — the row rule is a divider *between* rows;
                   on the last one it drew a second line 1px above the card's
                   own new bottom stroke. */
                <tr
                  key={note.id}
                  className="border-b border-hairline bg-white align-top last:border-b-0"
                >
                  <td className="py-6 pl-8 text-caption-medium text-ink">
                    {/* A note predating the Round 36 session field has none —
                        render an em dash rather than "Session NaN". */}
                    {/* Round 39: a note with no session is **Ad-hoc**, not an
                        em dash (direct instruction: "in table below, show that
                        its an adhoc note"). Every note written from this tab is
                        now ad-hoc; a session-numbered row is one written from
                        the Coaching workspace, which is the distinction this
                        column exists to carry. An em dash read as missing data
                        where it is in fact the note's real kind. */}
                    {/* Round 40, direct instruction: plain text, not a chip.
                        "Ad-hoc" and "Session 1" are the same kind of answer to
                        the same column's question, and only one of them being
                        a pill made it read as a status rather than a value. */}
                    {note.session === undefined ? 'Ad-hoc' : sessionRowLabel(note.session)}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      {/* Round 40 — provenance sits on the title line, beside
                          the thing it describes, rather than in the Session
                          column: that column answers "which session", and a
                          second chip in it would have one cell carrying two
                          unrelated facts. `yellow` per direct instruction —
                          the brand yellow, and now the only chip on the row
                          once the Session cell went to plain text. */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-caption-medium text-ink">{note.title}</span>
                        {note.autoGenerated && <Chip tone="yellow" label="Auto generated" />}
                      </div>
                      <span className="truncate text-caption text-ink-faint">{note.notes}</span>
                    </div>
                  </td>
                  <td className="py-6 text-ink">{formatDate(note.date)}</td>
                  <td className="py-6 text-ink">{note.time}</td>
                  <td className="py-6 pr-8">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setViewing(note)}
                        className="rounded-xs text-caption-medium text-primary underline underline-offset-2 outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(note)}
                        className="rounded-xs text-caption-medium text-primary underline underline-offset-2 outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > NOTES_PER_PAGE && (
        <TablePager
          page={page}
          pageSize={NOTES_PER_PAGE}
          total={filtered.length}
          onPageChange={setPage}
          itemLabel="notes"
        />
      )}

      <SessionNoteViewerDialog note={viewing} onClose={() => setViewing(null)} />
      <EditSessionNoteDialog
        note={editing}
        completedSessions={completedSessions}
        onClose={() => setEditing(null)}
        onSaved={onEdited}
      />
    </section>
  )
}

/** Read-only viewer, on `ConfirmDialog`'s chassis for the same reason the
 *  trainee page's is: that component already carries this project's hard-won
 *  focus-restore, `AnimatePresence` exit and Tab-trap behaviour. */
function SessionNoteViewerDialog({
  note,
  onClose,
}: {
  note: SupervisionNote | null
  onClose: () => void
}) {
  // Held rather than read straight through, so the panel keeps its content
  // while `AnimatePresence` plays the exit instead of blanking mid-fade.
  const [shown, setShown] = useState<SupervisionNote | null>(note)
  useEffect(() => {
    if (note) setShown(note)
  }, [note])

  return (
    <ConfirmDialog
      open={!!note}
      title={shown?.title ?? ''}
      body={
        shown
          ? [
              shown.session === undefined ? 'Ad-hoc' : sessionRowLabel(shown.session),
              formatDate(shown.date),
              shown.time,
              // Provenance belongs here too: this is the surface a coach reads
              // the note *body* on, which is exactly where knowing it was drafted automatically
              // it changes how carefully it gets read.
              ...(shown.autoGenerated ? ['Auto generated'] : []),
            ].join('  ·  ')
          : ''
      }
      confirmLabel="Close"
      cancelLabel="Close"
      singleAction
      panelClassName="max-h-[85vh] w-full max-w-[720px]"
      onConfirm={onClose}
      onClose={onClose}
    >
      <div className="min-h-[280px] rounded-sm border border-hairline bg-parchment p-4">
        <p className="whitespace-pre-wrap text-body leading-[1.4] text-ink">{shown?.notes}</p>
      </div>
    </ConfirmDialog>
  )
}

/** Edit an existing case note (direct instruction). Session, title and body are
 *  all editable; the note's date/time stamp is not — it records when the note
 *  was written, and rewriting that would make the record less true, not more. */
function EditSessionNoteDialog({
  note,
  completedSessions,
  onClose,
  onSaved,
}: {
  note: SupervisionNote | null
  completedSessions: SessionCompletionRecord[]
  onClose: () => void
  onSaved: () => void
}) {
  const { updateSupervisionNote } = useResearch()
  const [shown, setShown] = useState<SupervisionNote | null>(note)
  const [session, setSession] = useState<number | ''>('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  // Re-seed the form from the note being opened. Keyed on `note.id` rather than
  // the object so re-renders of the same note don't blow away in-progress edits.
  useEffect(() => {
    if (!note) return
    setShown(note)
    setSession(note.session ?? '')
    setTitle(note.title)
    setBody(note.notes)
  }, [note])

  const canSave = title.trim().length > 0 && body.trim().length > 0

  return (
    <ConfirmDialog
      open={!!note}
      title="Edit case note"
      body=""
      confirmLabel="Save changes"
      cancelLabel="Cancel"
      confirmDisabled={!canSave}
      panelClassName="max-h-[85vh] w-full max-w-[720px]"
      onConfirm={() => {
        if (!shown || !canSave) return
        updateSupervisionNote(shown.id, {
          title: title.trim(),
          notes: body.trim(),
          ...(session === '' ? {} : { session }),
        })
        onClose()
        onSaved()
      }}
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="edit-note-session" className={noteFieldLabel}>
            Which session is this note about?
          </label>
          <div className="relative">
            <select
              id="edit-note-session"
              value={session}
              onChange={(e) => setSession(e.target.value === '' ? '' : Number(e.target.value))}
              className={cn(noteFieldInput, 'appearance-none pr-10')}
            >
              {/* Only offered when the note genuinely has no session — an older
                  record. Never a way to *unset* one that is already mapped. */}
              {session === '' && <option value="">Not linked to a session</option>}
              {completedSessions.map((s) => (
                <option key={s.session} value={s.session}>
                  {sessionRowLabel(s.session)} · held {formatDate(s.completedDate)}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-faint"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="edit-note-title" className={noteFieldLabel}>
            Title
          </label>
          <input
            id="edit-note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={noteFieldInput}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="edit-note-body" className={noteFieldLabel}>
            Notes
          </label>
          <textarea
            id="edit-note-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={noteFieldTextarea}
          />
        </div>
      </div>
    </ConfirmDialog>
  )
}

/* ------------------------------------------------------------------------ */
/* Reflections                                                               */
/* ------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------ */
/* My reflections                                                            */
/* ------------------------------------------------------------------------ */

/**
 * Round 40, direct instruction — a new tab listing every reflection this coach
 * has written about this client, growing one row per session.
 *
 * No Figma frame. It is built on the Case notes tab's own shape (title, then a
 * white card holding a table with a `purple-50` header) rather than a new one,
 * because they are the same kind of surface: a running record of what the coach
 * wrote, one row per entry, opened in a dialog. Two tabs a click apart that
 * both list the coach's own writing should not look like two different
 * products.
 *
 * The reflections themselves are still written from the session-debrief banner
 * on the Coaching workspace tab — this tab reads and edits, it does not create.
 * That is deliberate: a reflection is about a session that happened, so its
 * entry point belongs beside the session, not on a list of past ones.
 */
function ReflectionsTab({ dyad }: { dyad: ConsumerDyad }) {
  /* The **id**, not the entry. Holding the object froze a snapshot taken at
     click time, so the dialog's share toggle wrote to the store and then went
     on rendering the pre-toggle value — it read as a dead control. Caught by
     reading `aria-checked` back after a click; a screenshot showed nothing,
     because the switch simply stayed where it was. */
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [page, setPage] = useState(0)

  /* Newest first. The store prepends, and the seed is written in that order, so
     this is a stable read rather than a sort — but sorting anyway means a
     hand-edited seed cannot put the list out of order silently. */
  const entries = [...dyad.annotationSummaries].sort((a, b) =>
    `${a.date} ${a.time}` < `${b.date} ${b.time}` ? 1 : -1,
  )

  const lastPage = Math.max(0, Math.ceil(entries.length / NOTES_PER_PAGE) - 1)
  useEffect(() => {
    if (page > lastPage) setPage(lastPage)
  }, [page, lastPage])

  const visible = entries.slice(page * NOTES_PER_PAGE, (page + 1) * NOTES_PER_PAGE)
  const sharedCount = entries.filter((e) => e.shared).length
  const viewing = entries.find((e) => e.id === viewingId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-title text-ink outline-none">
          My reflections
        </h2>
        {/* Says what the list is and what the coach controls, in two clauses.
            The share sentence is here rather than only inside the dialog
            because "who sees this" is the question a coach has *before* they
            open a row. */}
        <p className="text-body text-ink-muted">
          {entries.length === 0
            ? 'Your reflections after each session will appear here.'
            : `Your reflections after each session. ${sharedCount} of ${entries.length} shared with the research team.`}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className={NOTES_SURFACE}>
          {/* Names where reflections come from. An empty state that only says
              "none yet" leaves a coach looking for an Add button this tab
              deliberately does not have. */}
          <EmptyState
            icon={NotebookPen}
            copy="No reflections yet. Add one after your next session."
          />
        </div>
      ) : (
        <div className={NOTES_SURFACE}>
          <table className="w-full table-fixed text-caption">
            <thead>
              <tr className="bg-purple-50 text-ink-muted">
                <th scope="col" className="w-[140px] py-3.5 pl-8 text-left font-medium">
                  Session
                </th>
                <th scope="col" className="px-8 py-3.5 text-left font-medium">
                  Reflection
                </th>
                {/* Round 40, direct instruction. Both headers were ambiguous
                    against their own column: "Date" beside a Session column
                    read as the session's date rather than the reflection's,
                    and "Shared" over a cell that can say "Private" named one
                    of the two values instead of the question. */}
                <th scope="col" className="w-[150px] px-0 py-3.5 text-left font-medium">
                  Date Added
                </th>
                <th scope="col" className="w-[150px] px-0 py-3.5 text-left font-medium">
                  Share status
                </th>
                <th scope="col" className="w-[110px] py-3.5 pr-8 text-left font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-hairline bg-white align-top last:border-b-0"
                >
                  <td className="py-6 pl-8 text-caption-medium text-ink">
                    {/* Never a bare number — internal 1 is "Planning". An entry
                        written before Round 40 has no session at all, which is
                        a real absence rather than a zero. */}
                    {entry.session === undefined ? '—' : sessionRowLabel(entry.session)}
                  </td>
                  <td className="px-8 py-6">
                    {/* The first component's answer as the row's excerpt: it is
                        the coach's own opening sentence about the session, and
                        a reflection has no title of its own to show instead. */}
                    <span className="line-clamp-2 text-caption text-ink-muted">
                      {entry.components[0]?.answer ?? ''}
                    </span>
                  </td>
                  <td className="py-6 text-ink">{formatDate(entry.date)}</td>
                  <td className="py-6">
                    <Chip
                      tone={entry.shared ? 'success' : 'destructive'}
                      label={entry.shared ? 'Shared' : 'Private'}
                    />
                  </td>
                  <td className="py-6 pr-8">
                    <button
                      type="button"
                      onClick={() => setViewingId(entry.id)}
                      className="rounded-xs text-caption-medium text-primary underline underline-offset-2 outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length > NOTES_PER_PAGE && (
        <TablePager
          page={page}
          pageSize={NOTES_PER_PAGE}
          total={entries.length}
          onPageChange={setPage}
          itemLabel="reflections"
        />
      )}

      <ReflectionReviewDialog
        entry={viewing}
        dyadId={dyad.id}
        onClose={() => setViewingId(null)}
        onSaved={(message) => {
          setConfirmation(message)
          /* The dialog unmounts on save and its trigger — the row's View
             button — may have re-rendered, so focus goes to the tab's own
             heading rather than being left on `<body>`. This project's
             most-repeated defect. */
          headingRef.current?.focus()
        }}
      />

      <Toast message={confirmation} onDismiss={() => setConfirmation(null)} />
    </div>
  )
}

/**
 * A saved reflection, opened from the table (direct instruction: "open just the
 * review part with option to edit", plus "a toggle up top ... to update share
 * settings").
 *
 * It is the wizard's review screen and nothing else — same `ReflectionFields`
 * list, so what a coach approved at the end of the wizard is exactly what they
 * see here. Editing swaps that list for the same six textareas rather than
 * reopening the six-step wizard: re-walking six steps to fix one sentence is
 * the reason the Round 16 "Edit plan" modal was split off the plan wizard, and
 * this is the same shape of problem.
 *
 * The share toggle commits **immediately**, while the answers commit on Save.
 * That split is deliberate. Sharing is one reversible fact a coach may want to
 * change without touching a word of what they wrote, and burying it behind an
 * edit-then-save cycle would make the common case the long one.
 */
function ReflectionReviewDialog({
  entry,
  dyadId,
  onClose,
  onSaved,
}: {
  entry: AnnotationSummaryEntry | null
  dyadId: string
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { updateAnnotationSummary } = useResearch()
  // Held rather than read straight through, so the panel keeps its content
  // while `AnimatePresence` plays the exit instead of blanking mid-fade.
  const [shown, setShown] = useState<AnnotationSummaryEntry | null>(entry)
  const [drafts, setDrafts] = useState<string[]>([])

  /* Keyed on `entry?.id`, not `entry`. The parent now looks the entry up from
     the store on every render, so toggling share hands down a **new object**
     for the same reflection — re-seeding on the object would wipe any in-
     progress edit the moment the coach touched the toggle. */
  useEffect(() => {
    if (!entry) return
    setShown(entry)
    setDrafts(entry.components.map((c) => c.answer))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id])

  if (!shown) return null

  const live = entry ?? shown

  const handleSave = () => {
    updateAnnotationSummary(dyadId, live.id, {
      components: live.components.map((c, i) => ({
        ...c,
        // An answer emptied entirely keeps the wizard's own placeholder rather
        // than becoming a blank field, so a saved reflection always reads as a
        // record rather than as a half-filled form.
        answer: drafts[i]?.trim() || '(no response recorded)',
      })),
    })
    onClose()
    onSaved('Reflection updated.')
  }

  return (
    <ConfirmDialog
      open={!!entry}
      title={
        live.session === undefined
          ? 'Your reflection'
          : `Your reflection: ${sessionRowLabel(live.session)}`
      }
      body={`${formatDate(live.date)}  ·  ${live.time}`}
      confirmLabel="Save changes"
      cancelLabel="Cancel"
      panelClassName="max-h-[85vh] w-full max-w-[860px]"
      onConfirm={handleSave}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {/* The toggle, up top. `role="switch"` with a real `aria-checked` and a
            visible on/off label — this app has no Switch primitive, and a
            colour-only track would be the one state cue, which §1 forbids. */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-hairline bg-parchment p-4">
          <div className="min-w-0">
            {/* Round 40, direct instruction: `body-md` over grey `caption`. */}
            <p className="text-body-md text-ink">Share with the research team</p>
            <p className="mt-0.5 text-caption text-ink-muted">
              {live.shared
                ? 'The research team can read this reflection.'
                : 'Only you can read this reflection.'}
            </p>
          </div>
          {/* Round 40, direct instruction: the first pass was "too clunky" — a
              filled purple pill wrapping a track *and* a redundant "Shared"
              label, three treatments saying one thing. This is the bare track.
              The 36px hit area is the button; the 24px track is what it draws
              inside, so the floor is met without a control that looks like a
              button wearing a switch. State is not carried by colour alone —
              the sub-line to its left changes with it. */}
          <button
            type="button"
            role="switch"
            aria-checked={live.shared}
            onClick={() => updateAnnotationSummary(dyadId, live.id, { shared: !live.shared })}
            className="inline-flex h-9 shrink-0 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="sr-only">Share with the research team</span>
            {/* Round 40, direct instruction: name the outcome, do not leave the
                track to carry it. It also removes the last colour-only cue —
                a coach who cannot separate the red from the green now reads
                the word. Order is track-then-word so the word sits nearest the
                edge of the card and the two read as one control. */}
            <span
              aria-hidden="true"
              className={cn(
                /* Round 40, direct instruction: green for shared, red for
                   private, on the toggle and on the table's own chip so the
                   two surfaces read the same. Note this is the app's one
                   place where `destructive` is not an error or a danger — it
                   marks "not visible to anyone else", which is why the text
                   beside it says so in words rather than leaving red to
                   carry a meaning it does not usually have here. */
                'relative h-6 w-11 rounded-full transition-colors',
                live.shared ? 'bg-success' : 'bg-destructive',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all',
                  live.shared ? 'left-[22px]' : 'left-0.5',
                )}
              />
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'text-caption-medium',
                live.shared ? 'text-success' : 'text-destructive',
              )}
            >
              {live.shared ? 'Shared' : 'Private'}
            </span>
          </button>
        </div>

        {/* The wizard's own review screen, verbatim — the same shared table,
            editable in place. Direct instruction: this must not be a different
            UI from the one the coach approved the reflection on. That also
            removes the need for a read-only mode and an "Edit reflection"
            button: the review screen has always been editable, so a saved
            reflection opening in the same screen simply is the edit path. */}
        <ReflectionReviewTable
          answers={drafts}
          idPrefix={`saved-reflection-${live.id}`}
          onChange={(i, value) => setDrafts((prev) => prev.map((d, j) => (j === i ? value : d)))}
        />
      </div>
    </ConfirmDialog>
  )
}

/* Round 39 cleanup: `ReflectionCard` was DELETED here.

   It carried three states (locked / ready / complete) for the old "My
   Reflections" tab, then for the after-session half of the Coaching workspace.
   Both are gone — reflections are now written from the session-debrief banner
   through `AddAnnotationSummaryModal`, which owns its own review and
   mark-complete screens — so the card had zero callers. An earlier pass in this
   round kept it `export`ed purely to dodge a "declared but never read" error,
   which is exactly the stale code this sweep exists to remove: an export with
   no importer is dead code wearing a keyword.

   Nothing is lost. `ReflectionFields` still renders a saved reflection for the
   researcher's Annotation Vault and inside the wizard itself; this page simply
   no longer imports it. */

/* ------------------------------------------------------------------------ */
/* Coaching workspace — upcoming session + pre-session checklist             */
/* (Round 39, frame `728:4388`)                                              */
/* ------------------------------------------------------------------------ */

/**
 * "How did Session N go?" — frame `728:4984`.
 *
 * Shown above the Upcoming session details card once a session's time has
 * passed, asking the coach to write it up. It is the bridge between a session
 * being *due* and being *complete*: the plan cannot mark itself held, so this is
 * what turns a passed appointment into a record.
 *
 * **Trigger is clicking Join Zoom (direct instruction, prototype only).** The
 * real trigger is the clock passing the session's end time, which a prototype
 * with a frozen `TODAY` cannot demonstrate — so joining the call stands in for
 * "the session happened". `attended` is page state, deliberately not persisted:
 * it is a demo affordance, not a data model, and writing it to the store would
 * make it look like one.
 *
 * The artwork is `BannerBlob`, the trainee Home banner's own blob-framed photo,
 * at 0.41 scale with the gold back sheet (white would vanish on `yellow-200`),
 * plus the frame's 4 doodles (`728:4993`/`4998`/`5006`/`5009`) over it.
 *
 * The doodles are the frame's **own exported SVGs**, committed to
 * `public/illustrations/debrief/` — never hand-drawn, per this project's
 * standing icon rule. Their positions and sizes are expressed as fractions of
 * the frame's own 143.775px artwork grid rather than as absolute px, because
 * the photo underneath is `BannerBlob`'s geometry (a 404.97px base scaled by
 * `--blob-scale`), not the frame's. Fractions are what let the two coordinate
 * systems agree at any scale; transcribing the frame's pixels would have pinned
 * the doodles to a box the photo does not occupy.
 *
 * The whole group shares one `rotate(4.45deg)` on the wrapper — the frame's own
 * tilt — so `BannerBlob` is passed `rotateDeg={0}` and the doodles tilt with the
 * photo instead of against it.
 */
const DEBRIEF_ART_W = 165.52489170782655
const DEBRIEF_ART_H = 127.50460888892121

/* Each doodle's **bounding box** inside the frame's own 165.52 x 127.50 artwork
   group (`728:5066`), as fractions of it.
   Fractions rather than px because the photo underneath is `BannerBlob`'s
   geometry, not the frame's, so only a relative system lets the two agree.
   These are top-left coordinates — a first pass centred them with
   `translate(-50%, -50%)` and every doodle sat half outside the banner, which
   is what "doodles are going outside banner" was. */
const DEBRIEF_DOODLES = [
  { file: 'doodle-cloud.svg', x: 30.39037629457085, y: 3.236641609753285, w: 32.59057776478221, h: 25.707882371690175 },
  { file: 'doodle-check.svg', x: 134.1676789868896, y: 40.422475763213754, w: 27.58449883782214, h: 24.806622195217187 },
  { file: 'doodle-badge.svg', x: 1.9725637496641415, y: 89.97455968437112, w: 30.936404166278862, h: 27.788882184218892 },
  { file: 'doodle-sparkle.svg', x: 116.18443522128644, y: 109.32344588591792, w: 14.070913879663749, h: 14.070913879663749 },
].map((d) => ({
  file: d.file,
  left: `${(d.x / DEBRIEF_ART_W) * 100}%`,
  top: `${(d.y / DEBRIEF_ART_H) * 100}%`,
  width: `${(d.w / DEBRIEF_ART_W) * 100}%`,
  height: `${(d.h / DEBRIEF_ART_H) * 100}%`,
}))
function SessionDebriefBanner({
  sessionNumber,
  date,
  time,
  onAddReflection,
}: {
  sessionNumber: number
  date?: string
  time?: string
  onAddReflection: () => void
}) {
  return (
    <div
      /* `yellow-200` on a `yellow-400` stroke, 16px radius, the app's own card
         shadow — the frame's values, all existing tokens. `pl-4 pr-6` is the
         frame's asymmetry: the artwork bleeds closer to the left edge than the
         CTA does to the right. */
      /* Round 40, direct instruction: below `xl` the artwork, copy and CTA
         stack and centre, and the artwork shrinks with them. Same breakpoint
         and same rule as the trainee Home banners — these are the same kind of
         object (image first, then copy, then one action) and were the only two
         places in the portal where that object behaved differently below
         desktop. */
      className="flex flex-col items-center gap-6 rounded-lg border border-yellow-400 bg-yellow-200 px-4 py-4 shadow-card xl:flex-row xl:flex-wrap xl:items-center xl:justify-between xl:pr-6"
    >
      <div className="flex min-w-0 flex-1 flex-col items-center gap-6 [--blob-scale:0.3] sm:[--blob-scale:0.36] xl:flex-row xl:[--blob-scale:0.41]">
        {/* One rotated wrapper for photo + doodles, so they tilt together.
            `shrink-0` because it sits in a flex row beside the copy. */}
        <div className="relative shrink-0" style={{ transform: 'rotate(4.45deg)' }}>
          <BannerBlob scaleClassName="" rotateDeg={0} backSheet="banner-back-gold.svg" />
          {DEBRIEF_DOODLES.map((d) => (
            <img
              key={d.file}
              src={`/illustrations/debrief/${d.file}`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute"
              /* The bounding box straight from the frame — no centring
                 transform, and no per-doodle rotation: these boxes are already
                 the *rotated* groups' bounds, so the export fills them at the
                 angle the frame draws. Rotating again would double it. */
              style={{ left: d.left, top: d.top, width: d.width, height: d.height }}
            />
          ))}
        </div>
        {/* `min-w-0` on the text column: without it the copy sizes the row
            instead of wrapping inside it, which is how this project has shipped
            a real horizontal page scroll three times. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-center text-purple-950 xl:text-left">
          <h2 className="font-display text-title">How did Session {sessionNumber} go?</h2>
          <p className="text-body opacity-90">
            {/* The frame hardcodes "Tuesday 8 September at 2:00 PM"; this reads
                the row's own date and time, so the sentence cannot disagree with
                the card directly below it. */}
            {date ? (
              <>
                This session was planned for{' '}
                <span className="font-bold">
                  {formatDateLong(date)}
                  {time ? ` at ${formatTime(time)}` : ''}
                </span>
                . If it went ahead, add a short reflection on how it went to mark it complete.
              </>
            ) : (
              <>
                If this session went ahead, add a short reflection on how it went to mark it
                complete.
              </>
            )}
          </p>
        </div>
      </div>
      {/* `h-9`, not the frame's own 44px (direct instruction: consistent with
          the other buttons). Every other control on this page — the hero's Edit
          session plan, Join Zoom, Reschedule — is 36px, and a 44px pill beside
          them read as a different class of control rather than a louder one.
          The same instruction moved the trainee banners' own CTA off 44px too;
          see `BANNER_CTA` in `DeliveryHomePage` for that reversal. */}
      <button
        type="button"
        onClick={onAddReflection}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
      >
        {/* Two words, and the shorter label is also the truer one: this button
            opens the reflection wizard — it does not complete anything. The
            confirmation screen inside that wizard owns completion and has its
            own "Mark session complete". The previous
            "Add reflection & complete session" promised an outcome one click
            could not deliver.
            It also matches `ReflectionCard`'s own button verbatim; two controls
            that open the same wizard should not read differently. */}
        Add reflection
      </button>
    </div>
  )
}

/**
 * The next session, on its own (frame `728:4560`).
 *
 * Replaces the full 6-row `SessionTracker` table as the *first* thing on this
 * tab. A coach opening a client's record is almost always preparing for one
 * specific session — the next one — and the whole plan is still on the page
 * below, plus behind the hero's own "Edit session plan".
 *
 * **Every number here is derived from one record.** The frame's own header says
 * "Session 3 of 6" above a body reading "Session 2", which cannot both be true;
 * `nextPlannedSession` is the single source for both, so they cannot disagree.
 * That helper also excludes the unnumbered Planning session, which is why this
 * never renders "Session 0".
 */
function UpcomingSessionCard({
  dyad,
  onReschedule,
  attended,
  onJoin,
  headingRef,
}: {
  dyad: ConsumerDyad
  onReschedule: () => void
  /** Focus target after the debrief wizard closes. Completing a session unmounts
   *  the banner that opened it, so the wizard's own trigger-focus-return has
   *  nothing left to restore to — this heading is what stays. */
  headingRef?: React.Ref<HTMLHeadingElement>
  /** True once the coach has joined this session's call — see
   *  `SessionDebriefBanner` for why joining is the prototype's stand-in for the
   *  clock passing the session's end time. */
  attended: boolean
  onJoin: () => void
}) {
  const { sessionPlans, sessionCompletion } = useResearch()
  const plan = sessionPlans[dyad.id]
  const completed = sessionCompletion[dyad.id] ?? []
  const next = nextPlannedSession(plan, completed)

  /* Three genuinely different states, not one card with blanks in it:
       - no plan at all      -> nothing to be upcoming; `SessionTracker` below
                                owns the way in to the wizard, so this card
                                does not offer a second one.
       - plan, nothing left  -> all 6 catch-ups held.
       - plan with a next    -> the frame's own layout. */
  if (!isPlanSet(plan) && !next) {
    return (
      <Card className="gap-0 rounded-lg py-0">
        <div className="bg-purple-50 px-6 py-4">
          <h2 className="font-display text-title text-ink">Upcoming session details</h2>
        </div>
        <div className="border-t border-hairline">
          <EmptyState icon={CalendarClock} copy="No sessions planned yet" />
        </div>
      </Card>
    )
  }

  const heldCount = completed.filter((c) => c.session !== 1).length

  return (
    <Card className="gap-0 rounded-lg py-0">
      {/* Frame `728:4561`: `purple-50` band, title left, count right.
          `purple-50` (`#f3efff`) and NOT `bg-card-header` (`#e4d6ff`) — direct
          instruction, and it is what the frame paints. The two tokens are close
          enough to read as the same colour in a screenshot and are 20 points
          apart per channel; `card-header` is the §35a app-wide header fill,
          while every header in this frame is `Purple/50`. Same on the checklist
          card below, and it is why the tables' own header rows (already
          `purple-50`) now match the band above them. */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-purple-50 px-6 py-4">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-title text-ink outline-none">
          Upcoming session details
        </h2>
        <p className="text-caption-medium text-ink">
          {next
            ? `Session ${displaySessionNumber(next.session)} of ${SPACES_CATCHUP_COUNT}`
            : `${heldCount} of ${SPACES_CATCHUP_COUNT} held`}
        </p>
      </div>

      <div className="border-t border-hairline px-6 py-5">
        {next ? (
          /* `items-start` + `justify-between`, and the CTA column `shrink-0`:
             the frame's own two-column split, with the left block free to wrap
             at narrow widths rather than squeezing the buttons. */
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-caption-medium text-ink-muted">Next session:</p>
                {/* Direct instruction: a Completed label after the session
                    number once the session has been attended.
                    Worth recording the tension rather than hiding it: the
                    banner's own CTA is "Write note & complete session", so on
                    this screen the session is not *complete* until the note is
                    written — the chip is saying the session itself happened.
                    Kept as asked; if it should read "Held" or "Awaiting notes"
                    that is a one-word change here. */}
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-title text-primary">
                    {sessionRowLabel(next.session)}
                  </p>
                  {attended && <Chip tone="success" label="Completed" />}
                </div>
              </div>
              {/* A real `<dl>` — these are four label/value pairs, and the
                  project's standing rule is that a visible label beside a
                  value is `<dt>`/`<dd>`, not two `<p>`s that merely look
                  like a pair. */}
              <dl className="flex flex-wrap gap-x-6 gap-y-4">
                <div className="flex flex-col gap-2">
                  <dt className="text-caption-medium text-ink-muted">Session date</dt>
                  <dd className="text-body-md text-ink">
                    {next.date ? formatDateLong(next.date) : 'Not set'}
                  </dd>
                </div>
                <div className="flex flex-col gap-2">
                  <dt className="text-caption-medium text-ink-muted">Session time</dt>
                  <dd className="text-body-md text-ink">
                    {next.time
                      ? /* The frame reads "2:00 PM - 2:PM", which is a typo in
                           the frame. `endTime` is optional on `SessionPlanRow`
                           (added Round 38), so a row without one renders the
                           start alone rather than a dangling dash. */
                        next.endTime
                        ? `${formatTime(next.time)} - ${formatTime(next.endTime)}`
                        : formatTime(next.time)
                      : 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 flex-col gap-4">
              {/* A dated session always has a `zoomLink` in this data
                  (`bulkSetSessionPlan` generates one with the date), but the
                  field is optional on the type — so the unwired case renders
                  as a focusable `aria-disabled` control with an `sr-only`
                  cue rather than a dead button or a missing one. */}
              {/* Deactivated once the session has been attended (direct
                  instruction) — a call you have already been on is not a call
                  to join, and leaving it live invites a coach to re-enter a
                  finished meeting. `aria-disabled` on a still-focusable button
                  with an `sr-only` reason, never a silently dead control or a
                  removed one: the row still needs to show that a link existed. */}
              {attended ? (
                <button
                  type="button"
                  aria-disabled="true"
                  className="inline-flex h-9 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-divider-soft px-[18px] text-caption-medium text-ink-faint outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Video aria-hidden="true" className="size-4" />
                  Join Zoom session
                  <span className="sr-only">(this session has already been held)</span>
                </button>
              ) : next.zoomLink ? (
                /* A `<button>`, not a link to `zoomLink` (direct instruction:
                   "no need to open zoom tab, just show banner"). Joining is the
                   prototype's trigger for "the session happened", and opening a
                   real Zoom URL in a new tab on every demo click was noise in
                   front of the thing being demonstrated. The row still shows the
                   control, and `next.zoomLink` still gates it — a session with
                   no meeting link falls through to the inert branch below. */
                <button
                  type="button"
                  onClick={onJoin}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  <Video aria-hidden="true" className="size-4" />
                  Join Zoom session
                </button>
              ) : (
                <button
                  type="button"
                  aria-disabled="true"
                  className="inline-flex h-9 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-divider-soft px-[18px] text-caption-medium text-ink-faint outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Video aria-hidden="true" className="size-4" />
                  Join Zoom session
                  <span className="sr-only">(no meeting link yet)</span>
                </button>
              )}
              <button
                type="button"
                onClick={onReschedule}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
              >
                Reschedule
              </button>
            </div>
          </div>
        ) : (
          <p className="text-body text-ink-muted">
            All {SPACES_CATCHUP_COUNT} catch-up sessions have been held. Nothing left to schedule.
          </p>
        )}
      </div>
    </Card>
  )
}

/** How many recent nights both checklist summaries average over.
 *
 *  One constant for both panels on purpose: a Fitbit average over 7 nights
 *  beside a diary average over 5 would be two different claims presented as one
 *  summary, and nothing on screen would say so. */
const CHECKLIST_AVERAGE_NIGHTS = 7

/**
 * The Fitbit summary for the checklist — **the same table**, averaged.
 *
 * Direct instruction: reuse the existing table rather than invent one, and show
 * averages per dyad member instead of a night-by-night grid. So this is a thin
 * wrapper around `FitbitAveragesTable`, which lives beside `FitbitLogTable` in
 * `ConsumerDetailPage` and mirrors it column for column.
 *
 * An earlier pass in this round built a bespoke 3-column "last 5 nights" table
 * here; it was removed, not adapted. Reusing the real table means this panel
 * cannot drift from the full log a coach sees one tab away.
 */
function ClientFitbitSummary({ dyad }: { dyad: ConsumerDyad }) {
  const people = [
    ...(dyad.patient ? [{ key: 'PLE', name: dyad.patient.name, log: dyad.patientLog }] : []),
    { key: 'Carer', name: dyad.carer.name, log: dyad.carerLog },
  ]

  /* The window actually averaged, off the union of both members' logs — the
     same basis `FitbitAveragesTable` slices per member, so the label cannot
     claim a range the table did not use. */
  const windowDates = [...new Set([...dyad.patientLog, ...dyad.carerLog].map((e) => e.date))]
    .sort()
    .slice(-CHECKLIST_AVERAGE_NIGHTS)

  return (
    <div className="flex flex-col gap-3">
      {/* The same from/to label the diary panel carries, for the same reason:
          an average with no stated window is an unfalsifiable number. Both
          panels average `CHECKLIST_AVERAGE_NIGHTS`, so they read identically. */}
      {windowDates.length > 0 && (
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
      {/* No `Card`, so no shadow (direct instruction) — a stroked container on
          the checklist card's own white surface. `overflow-x-auto` because the
          reused table carries the log table's `min-w-[760px]`.
          `rounded-sm` is the app's 8px token (direct instruction), not the
          16px `rounded-lg` a card would use: this is a table inside a card,
          and repeating the parent's own radius made it read as a second card. */}
      <div className="overflow-hidden rounded-sm border border-parchment">
        <div className="overflow-x-auto">
          <FitbitAveragesTable people={people} nights={CHECKLIST_AVERAGE_NIGHTS} />
        </div>
      </div>
      {/* `mt-3` on top of the wrapper's own `gap-3` — 24px clear of the table
          (direct instruction). The extra sits on this element rather than in
          the wrapper's gap because the gap also sets the range-label-to-table
          spacing above, which is correct at 12px and should not move with it. */}
      <p className="mt-3 text-fine text-ink-faint">
        The full night-by-night log is on the Client sleep &amp; health data tab.
      </p>
    </div>
  )
}

/**
 * The coach's own most recent case notes for this client, read-only.
 *
 * Reads the same `supervisionNotes` store the Case notes tab writes to, so
 * this panel cannot drift from it. Read-only on purpose: this is a checklist
 * item ("have I re-read what happened last time"), and putting a second write
 * form here would give one record two editors on one page.
 */
function PreviousSessionNotesPanel({ dyad }: { dyad: ConsumerDyad }) {
  const { supervisionNotes } = useResearch()
  const NOTES_SHOWN = 3
  const notes = supervisionNotes
    .filter((n) => n.dyadId === dyad.id)
    .slice()
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))

  if (notes.length === 0) {
    return <EmptyState icon={NotebookText} copy="No case notes written yet" />
  }

  const shown = notes.slice(0, NOTES_SHOWN)

  return (
    /* Frame `737:1806`, with three direct-instruction departures from it: the
       card is `yellow-50` on a `yellow-100` stroke rather than white on
       parchment, it carries no shadow, and the "All case notes" line sits
       **below** the card instead of inside it.

       The yellow pair is doing the separating work the removed shadow used to:
       a warm tinted panel reads as distinct from the white checklist card it
       sits inside, where a white-on-white card with no shadow would have had
       only a hairline to distinguish it.

       Everything else is the frame, and every colour in it maps to an existing
       token exactly — `#1a1a1a` ink, `#333333` ink-muted, `#e0e0e0` hairline,
       `#8447ff` purple-500, `#4a278f` primary — so nothing new was added. */
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {shown.map((note) => (
        <li
          key={note.id}
          className="flex flex-col gap-4 rounded-sm border border-yellow-100 bg-yellow-50 p-6"
        >
          <div className="flex flex-col gap-4">
            {/* Title left, date right. `items-start` with the date `shrink-0`
                and the title free to wrap: at the frame's own width both sit on
                one line, but a long note title must not push the date out of
                the card. The frame's `whitespace-nowrap` on the title would do
                exactly that. */}
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              {/* The note's own title, which is the whole heading — the
                  session/ad-hoc `Chip` an earlier pass in this round put here
                  is gone, per the frame. Nothing is lost by it: these titles
                  already name their session, and the Case notes tab's table
                  carries the mapped session as its own column. */}
              {/* `body-md` (16/600), not the frame's own 22px `title` (direct
                  instruction). At 22px the note title outweighed the checklist
                  card's own heading two rows above it, and these are list
                  items inside a card rather than section headings. */}
              <h4 className="min-w-0 text-body-md text-ink">{note.title}</h4>
              {/* `ink`, not the frame's `purple-500` (direct instruction). A
                  side benefit worth recording: `purple-500` on `yellow-50`
                  measured 4.58:1, the tightest number on this surface and only
                  just over AA. `ink` is 16.42:1. */}
              <p className="shrink-0 text-caption-medium text-ink">
                {formatDate(note.date)} · {formatTime(note.time)}
              </p>
            </div>
            {/* Full text, not clamped. The frame renders the whole note, and a
                coach re-reading last session before this one needs the detail
                rather than a three-line teaser. */}
            <p className="text-body whitespace-pre-line text-ink-muted">{note.notes}</p>
          </div>
        </li>
        ))}
      </ul>

      {/* Direct instruction: below the card, not inside it. That is also the
          more honest place for it — the sentence is about the whole list, and
          inside a card it read as a property of that one note. It renders once
          here regardless of how many notes are shown, so the separator the
          frame drew inside the card is no longer needed to divide it from the
          note body above. */}
      <div className="flex items-center gap-2">
        <Info aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <p className="text-caption-medium text-ink-muted">
          {notes.length > NOTES_SHOWN
            ? `Showing the ${NOTES_SHOWN} most recent of ${notes.length}. All case notes are on the `
            : 'All case notes are on the '}
          {/* Not a link: this panel sits inside a tab panel on the same page,
              and the Case notes tab is a sibling of the tab this is inside —
              there is no URL to point at, so a real anchor would be a lie.
              Styled as emphasis, and the sentence names the tab so it is
              followable. */}
          <span className="font-semibold text-primary">Case notes tab</span>.
        </p>
      </div>
    </div>
  )
}

const CHECKLIST_TABS = [
  { id: 'fitbit', label: 'Fitbit data' },
  { id: 'diary', label: 'Sleep diary notes' },
  { id: 'notes', label: 'Previous session notes' },
] as const
type ChecklistTab = (typeof CHECKLIST_TABS)[number]['id']

/**
 * "Your pre-session checklist" (frame `728:4616`).
 *
 * The frame draws the panel as a 280px grey placeholder — the three views are
 * filled here from data that already exists in the app, per direct
 * instruction. The 280px is therefore a placeholder height, not a contract:
 * the diary in particular needs more than that, and clipping real content to
 * hit the frame's number would be the wrong way round.
 *
 * Card titles are sentence case (§35a), so the frame's "Sleep Diary Notes"
 * becomes "Sleep diary notes".
 */
function PreSessionChecklist({ dyad }: { dyad: ConsumerDyad }) {
  const [tab, setTab] = useState<ChecklistTab>('fitbit')

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="bg-purple-50 p-6">
        <h2 className="font-display text-title text-ink">Your pre-session checklist</h2>
        {/* Round 40, direct instruction: too wordy. The sentence spent 17 of
            its 19 words re-listing the three tab labels sitting directly
            beneath it, leaving "before you meet" — the only thing it actually
            told a coach — at the very end. Deliberately no count ("all three"):
            a written number over a derived row is the sentence this project
            has shipped wrong three times. */}
        <p className="mt-1 text-body text-ink-muted">Review these before you meet.</p>
      </div>
      {/* `gap-10` (40px) between the tab row and the panel — raised from 16px
          in two steps on direct instruction. 40px is the rhythm this page
          already uses between its own top-level sections, so the tab row now
          reads as separated from its panel by the same beat rather than a
          value picked for this one spot.
          It is the flex gap rather than a margin on the panel so all three
          panels get it identically — a margin would have to be repeated on
          each and would drift. */}
      <div className="flex flex-col gap-10 border-t border-hairline px-6 pt-4 pb-6">
        {/* `UnderlineTabs` here rather than the `SegmentedSwitch` above: these
            three are levels of the same task (things to read before a
            session), which is what a tab row means, and the frame draws them
            as tabs with the same active underline. `flushStart` puts the first
            label on the card's own 24px gutter instead of 16px inside it. */}
        <UnderlineTabs
          tabs={CHECKLIST_TABS}
          active={tab}
          onChange={setTab}
          ariaLabel="Pre-session checklist"
          layoutId="delivery-pre-session-checklist-underline"
          idPrefix="pre-session-tab"
          panelId="pre-session-panel"
          flushStart
        />
        <div
          id="pre-session-panel"
          role="tabpanel"
          aria-labelledby={`pre-session-tab-${tab}`}
        >
          {tab === 'fitbit' && <ClientFitbitSummary dyad={dyad} />}
          {/* Three flags, three separate reasons:
                `compact`       — drops the section's own "Sleep diary notes"
                                  title, which the card header and the tab
                                  label above already say twice. Also drops
                                  the table's card shadow.
                `viewerRole`    — hides the 4 auto-calculated questions. The
                                  rule lives in `SleepDiaryFeed`, so this panel
                                  and the Client sleep & health data tab cannot
                                  disagree about which questions a coach sees.
                `averageNights` — means over the same window as the Fitbit
                                  panel, instead of one night. */}
          {tab === 'diary' && (
            <SleepDiaryFeed
              dyad={dyad}
              viewerRole="coach"
              compact
              averageNights={CHECKLIST_AVERAGE_NIGHTS}
            />
          )}
          {tab === 'notes' && <PreviousSessionNotesPanel dyad={dyad} />}
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------------ */
/* Profile Details                                                           */
/* ------------------------------------------------------------------------ */

/* Round 36, direct instruction: this tab now renders the *same*
   `ProfileDetailsSections` the researcher's Consumer Management profile tab
   does — Study information, then PLE and Carer personal details — rather than
   the two bare `ProfilePersonCard`s it carried before. Those cards were a
   second, simpler vocabulary for the same record, and the two surfaces had
   already drifted apart visually.

   `viewerRole="coach"` is what removes the two things a coach has no
   permission for: withdrawing the client from the study, and editing their
   notification preferences. Both are absent rather than disabled — a control
   you may never use is not a control. See that component for the third,
   non-permission difference (the assigned-coach link). */

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

/** Coach Delivery Portal per-consumer detail view (Round 6.2) — drill-in from
 *  the Home page's "Your consumers" table. Gated to the signed-in coach's
 *  own caseload. */
export function DeliveryConsumerDetailPage() {
  const { dyadId } = useParams()
  const { consumerDyads, sessionPlans, sessionCompletion, toggleSession } = useResearch()
  const [tab, setTab] = useState<Tab>('Coaching workspace')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  /* Lives on the page, not inside `UpcomingSessionCard`, because two controls
     open the same modal: the card's own "Reschedule" and the hero's "Edit
     session plan" (frame `728:4725`). One piece of state, one modal. */
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const editPlanBtnRef = useRef<HTMLButtonElement>(null)
  /* Creating a plan is a separate modal from editing one — the wizard asks the
     cadence questions that only make sense before a plan exists. */
  const [createPlanOpen, setCreatePlanOpen] = useState(false)
  const createPlanBtnRef = useRef<HTMLButtonElement>(null)
  /* Internal session numbers the coach has joined the call for. Page state, not
     the store: this is the prototype's stand-in for the clock passing a
     session's end time (direct instruction), so persisting it would dress a
     demo affordance up as a data model. A Set so a dyad with two sessions
     joined in one visit cannot collapse to one. */
  const [attendedSessions, setAttendedSessions] = useState<number[]>([])
  /* The debrief wizard, opened only from the banner's CTA. Separate from the
     per-client reflection card's own instance: that one writes a reflection with
     no session to complete, this one does both. */
  const [debriefOpen, setDebriefOpen] = useState(false)
  const upcomingHeadingRef = useRef<HTMLHeadingElement>(null)

  /* Is the tab row currently parked under the header?
     Direct instruction: the white card chrome is a *stuck* treatment only — at
     rest the row sits on the page canvas like every other tab row in the app.
     CSS alone cannot express "is stuck", so a zero-height sentinel is rendered
     immediately above the sticky element and observed with the sticky offset as
     a negative `rootMargin`: the moment the sentinel crosses that line the row
     has taken the top, and `isIntersecting` flips.
     An IntersectionObserver rather than a scroll listener on purpose — it does
     not fire per frame during a scroll, so there is no work to throttle.

     A **callback ref**, not `useRef` + a `[]` effect. This page mounts while
     the welcome flow may still be up, and `DeliveryShell` renders its
     `children` only once onboarding is done — so on a trainee-stage load the
     sentinel does not exist at first commit, a mount effect reads `null`,
     bails, and never runs again because its deps never change. Measured: the
     row stuck correctly and the chrome never appeared. A callback ref fires
     when the node actually arrives, whenever that is, and again with `null`
     when it leaves. */
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [tabsStuck, setTabsStuck] = useState(false)

  const stickySentinelRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setTabsStuck(!entry.isIntersecting), {
      rootMargin: `-${TABS_STICKY_TOP_PX}px 0px 0px 0px`,
    })
    io.observe(el)
    observerRef.current = io
  }, [])

  useEffect(() => () => observerRef.current?.disconnect(), [])

  const ownDyad = dyadsForCoach(COACH_ID).find((d) => d.id === dyadId)
  const dyad = ownDyad ? consumerDyads.find((d) => d.id === dyadId) ?? ownDyad : undefined

  if (!dyad) return <Navigate to="/delivery" replace />

  /* One read of "does this client have a plan", used by both the hero's Edit
     control and the workspace tab's own branch — two places deciding that
     separately is how one ends up offering to edit a plan the other says does
     not exist. */
  const planned = isPlanSet(sessionPlans[dyad.id])
  /* The one next-session read the banner, the card's `attended` flag and the
     join handler all share. Three separate reads is how a banner ends up
     announcing a different session from the card beneath it. */
  const nextSession = nextPlannedSession(sessionPlans[dyad.id], sessionCompletion[dyad.id] ?? [])

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
    <DeliveryShell
      accountLabel="Helen Zhang"
      // Direct instruction: match the trainee dashboard's shell. This was the
      // portal's last `bg-pearl` band — a cool grey panel behind the page title
      // on a warm `#fffcfa` canvas, while every nav page put its title straight
      // on the canvas. The band is now transparent and flush, so the back link,
      // the name and the tab row share the content column's own left edge.
      // `heroFlushBelow` keeps the tab rule as the block's bottom edge and
      // tightens the gap under it to 48px, the same pairing the researcher
      // record pages use.
      // `heroFlushBelow` purely for its `pb-0` on the hero. `heroNoSeam` would
      // be the closer name now that the tab row has moved into the content
      // column, but the shell applies its 40px bottom pad *after* `heroClassName`
      // in the same `cn()`, so a `pb-0` passed there loses and the gap between
      // the client's name and the tab row measured 72px — the hero's 40px plus
      // the column's 16px plus the row's own 16px, three insets stacking where
      // one was wanted.
      heroFlushBelow
      heroClassName="bg-transparent px-0 md:px-0"
      // Overrides `heroFlushBelow`'s own 48px. `contentClassName` *is* last in
      // the shell's content `cn()`, so this one does win. Both breakpoints are
      // named because the shell sets a `md:` variant that would otherwise take
      // over at desktop width.
      contentClassName="px-0 md:px-0 pt-4 md:pt-4"
      hero={
        /* Frame `728:4421`: the back link and the names are one left-hand
           column, with "Edit session plan" right-aligned and bottom-aligned
           against the names row (`items-end` — the frame puts the 40px button
           at y=44 in an 84px block, i.e. flush with the names' baseline block,
           not with the back link above it). */
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
          <Link
            to="/delivery"
            className="inline-flex min-h-11 items-center gap-1 rounded-sm text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Back to Home
          </Link>

          <div className="mt-4">
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
            <h1
              className="flex flex-col gap-1.5 text-ink"
              aria-label={
                dyad.patient
                  ? `PLE: ${dyad.patient.name} Carer: ${dyad.carer.name}`
                  : `Carer: ${dyad.carer.name}`
              }
            >
              {dyad.patient && (
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="text-body text-ink-faint">PLE:</span>
                  <span className="font-display text-title text-primary">{dyad.patient.name}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <span className="text-body text-ink-faint">Carer:</span>
                <span className="font-display text-title text-primary">{dyad.carer.name}</span>
              </span>
            </h1>
          </div>
          </div>

          {/* Only rendered once a plan exists — there is nothing to *edit*
              otherwise, and creating one is the wizard `SessionTracker` puts
              behind its own empty-state banner further down the page. An
              always-present button that sometimes means "create" would be
              two actions wearing one label.

              Note this duplicates `SessionTracker`'s own "Edit plan" CTA,
              which is still on the page below. The frame draws this control,
              and the standing rules say a drawn control is not omitted — but
              two buttons opening one modal on one screen is a real
              observation, flagged rather than quietly resolved either way. */}
          {planned && (
            <button
              type="button"
              ref={editPlanBtnRef}
              onClick={() => setPlanModalOpen(true)}
              /* Primary filled (direct instruction), not the frame's own
                 outline pill — this is the page's one top-level action, and the
                 outline treatment left it reading as secondary against the
                 filled "Join Zoom session" in the card below it. */
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Edit session plan
            </button>
          )}
        </div>
      }
    >
      {/* Sticky tab row (direct instruction). It has to live in the **content
          column**, not in the hero: `position: sticky` is scoped to its own
          parent's box, so inside the hero block the row would unstick and
          scroll away the moment the hero did — which is exactly the behaviour
          being fixed. Here its parent is the page body, so it holds the top
          for the whole scroll.

          It parks at `TABS_STICKY_TOP_PX` — see that constant for why the
          number is the header's height plus the shell's own gutter.

          The card treatment (white fill, `parchment` stroke, card shadow) is
          applied **only while stuck** — at rest the row sits on the page canvas
          like every other tab row in the app, and the chrome appears when it
          needs to separate itself from content passing underneath. The
          transition is on colour and shadow only, so nothing reflows as it
          switches. `px-6` is held in both states so the labels do not shift
          sideways at the changeover. */}
      <div ref={stickySentinelRef} aria-hidden="true" />
      {/* `-mx-6 px-6`: the box bleeds 24px past the content column on each side
          so the tab labels stay flush with the back link, the names and the
          cards below, in both states. The bleed lands in the shell's own 48px
          column gap on the left and 48px right pad, so it cannot cause a
          horizontal page scroll — measured. */}
      <div
        className="sticky z-20 -mx-6 mb-12 px-6 pt-4"
        style={{ top: TABS_STICKY_TOP_PX }}
      >
        {/* The white card is its **own absolutely-positioned layer** rather
            than classes toggled on the box itself. That is what makes the
            transition safe: fill, stroke and shadow cross-fade with **zero**
            reflow, so the tab labels cannot shift by a pixel at the moment the
            row parks — animating the box's own border/padding would move them.

            It scales up from 98% and rises 4px as it fades, so the chrome reads
            as settling into place rather than blinking on. `initial={false}`
            means a page that loads already scrolled shows the card outright
            instead of playing the arrival at mount. Same symmetric
            `[0.4, 0, 0.2, 1]` curve Round 32 settled the tour on — two things
            moving together on one easing is most of what stops a transition
            reading as springy. */}
        {/* The 24px strip between the header and the card. The card holds a
            gap off the header so its top edge lines up with the side nav's,
            which leaves a window that page content scrolls cleanly through.
            Blurring it (rather than filling it) keeps that alignment while
            stopping text from reading sharply in the gap.

            `backdrop-blur` needs something to blur *behind* it, so this is a
            separate layer from the card above — the card's own fill is opaque
            and would hide the effect entirely.

            Two effects stacked, which is what makes it read as content
            *dissolving* rather than sliding under a panel: `backdrop-blur`
            defocuses whatever is behind, and the canvas-coloured gradient on
            top lifts it toward the page colour.

            Deliberately **subtle** (direct instruction): a first pass ran the
            gradient to fully opaque `background` with `blur-md` and read as a
            hard wipe — the strip looked like a solid bar rather than a fade.
            It now tops out at 70%, so the content is still faintly there at
            the header edge, and the blur is the lighter `sm`. */}
        {/* A plain div with a CSS opacity transition, **not** a `motion.div`.
            As a motion sibling it inherited the card layer's own animated
            `scale: 0.98 / y: -4` — React reconciles these two siblings by
            position, so adding this one in front handed it the card's existing
            motion state, and its `animate` only set `opacity`, so the transform
            was never cleared. Measured: `matrix(0.98, 0, 0, 0.98, 0, -4)`,
            which lifted the strip 3.8px above the header and left a ~4px band
            directly above the tabs with no blur at all — exactly the sliver
            that was reported twice. There is nothing here CSS cannot do. */}
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 -top-6 -z-10 h-6 bg-gradient-to-t from-background/0 via-background/25 to-background/70 backdrop-blur-sm transition-opacity duration-200',
            tabsStuck ? 'opacity-100' : 'opacity-0',
          )}
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-sm border border-parchment bg-card shadow-card"
          initial={false}
          animate={
            tabsStuck
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.98, y: -4 }
          }
          transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
        />
        <div
          role="tablist"
          aria-label="Client detail sections"
          /* The rule under the whole row. It used to come from the hero band's
             own `border-b`; once the band went transparent the row had only the
             active tab's 3px purple mark and no baseline to sit on. On the
             tablist so the rule is the tab row's own edge, and the active
             indicator (`bottom-0` on a button whose box ends here) paints
             directly on top of it.
             `purple-700` at 1px (direct instruction — tried at 2px, then
             1.5px, settled back at 1px), up from `purple-200`: the change that
             mattered was the colour, not the weight. Note the knock-on: the
             active tab's own indicator is
             the *same* `primary` colour, so at its old 3px it would have read
             as barely thicker than the baseline it sits on. It is 4px below to
             keep the active tab distinguishable — the label's weight and colour
             carry the rest. */
          className={cn(
            'flex items-end gap-8 overflow-x-auto border-b transition-colors duration-200',
            // Hidden while parked (direct instruction): the card's own bottom
            // stroke already closes the row there, and two rules 1px apart read
            // as a double line. `border-transparent` rather than dropping
            // `border-b`, so the row's height does not change by 1px at the
            // changeover and the tabs cannot jog.
            tabsStuck ? 'border-transparent' : 'border-primary',
          )}
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
                  aria-controls={`delivery-consumer-tabpanel-${i}`}
                  id={`delivery-consumer-tab-${i}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={cn(
                    'relative flex min-h-11 shrink-0 items-end pb-3 whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'text-caption-medium text-primary' : 'text-caption text-ink-muted hover:text-ink',
                  )}
                >
                  {t}
                  {active && (
                    <motion.span
                      layoutId="delivery-consumer-detail-tab-underline"
                      /* 5px in **both** states (direct instruction). A pass that
                         thickened it only while parked was reverted: the marker
                         changing size as you scroll draws attention to the
                         scroll rather than to which tab is selected.
                         `-bottom-0.5` keeps it overlapping the row's baseline
                         rule at rest so the two read as one mark, not two. */
                      className="absolute inset-x-0 -bottom-0.5 h-[5px] rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              )
            })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`delivery-consumer-tabpanel-${TABS.indexOf(tab)}`}
        aria-labelledby={`delivery-consumer-tab-${TABS.indexOf(tab)}`}
        /* No own top margin — the gap above it is the sticky tab row's `mb-8`.
           It used to carry `mt-16` on top of the shell's own inset, which
           double-counted to 112px. */
      >
        {/* `key={dyad.id}` — same defensive fix as `SpacesCoachProfilePage.tsx`'s
            own consumer picker (Round 15 final audit): this route reuses the
            same page component across different `:dyadId` params rather than
            remounting, so without a key the wizard nested inside `DyadSection`
            could carry stale draft state from a previously-viewed consumer. */}
        {/* Round 36, direct instruction: the reflection card moved out of its
            own tab and sits here, directly under the session tracker it is
            written about — a coach finishes a session, ticks it, and the
            prompt to reflect on it is the next thing on the page rather than
            a tab away. */}
        {/* Round 39, frame `728:4388`. The tab is now a checklist: what is
            coming up, then what to read before it. Nothing else.

            An earlier pass in this round kept an "After session" half below the
            checklist (an `after session` wave rule, `SessionTracker`, and
            `ReflectionCard`) on the reasoning that the frame stops above the
            fold. Direct instruction removed all three — the frame's reading was
            the intended one.

            **Two consequences, flagged rather than worked around**, because
            both are reachability losses rather than layout changes:
              - `SessionTracker` was the only surface in the app that can mark a
                SPACES session complete. Nothing in the coach portal can now.
                The researcher's own `SpacesCoachProfilePage` still renders it,
                so the component and its write path are untouched.
              - `ReflectionCard` (below, deliberately NOT deleted) has no caller
                on this page any more, so a coach cannot write or read a
                reflection here. The frame's own tab row draws a "Coach's
                reflection" tab, which is where it belongs; that tab was left
                out because the tab row is out of scope this round. Restoring it
                is one line. */}
        {tab === 'Coaching workspace' && (
          <div key={dyad.id} className="flex flex-col gap-10">
            {/* Round 39, direct instruction: **with no plan, the banner is the
                whole tab.** No upcoming-session card, no wave rule, no
                checklist.

                That is the right shape rather than just the asked-for one:
                every one of those three describes preparing for a specific
                scheduled session, and until a plan exists there is no session
                to prepare for. The checklist would have been a coach reviewing
                Fitbit data ahead of a meeting nobody has booked.

                This also closes a real dead end. `SessionTracker` carried this
                banner and left this page when the tab was rebuilt earlier in
                the round, so a client with no plan showed "No sessions planned
                yet" and offered no way to make one — `PlanSessionsModal` had no
                reachable caller in the coach portal at all. */}
            {planned ? (
              <>
                {/* Frame `728:4984`, above the Upcoming session details card
                    (direct instruction). Only once the session has been
                    attended — before that there is nothing to write up. */}
                {nextSession && attendedSessions.includes(nextSession.session) && (
                  <SessionDebriefBanner
                    sessionNumber={displaySessionNumber(nextSession.session)}
                    date={nextSession.date}
                    time={nextSession.time}
                    /* Direct instruction: this opens the SIPTEA reflection
                       wizard, which then carries its own confirmation screen for
                       marking the session complete. An earlier pass sent the
                       coach to the Case notes tab; that tab is now ad-hoc notes
                       only, so it was the wrong destination for a session
                       write-up as well as a weaker one.

                       Copy says **reflection**, not note (direct instruction):
                       a coach does not hand-write session notes at all — the
                       note itself is to be AI-generated per the plan — so what
                       they contribute here is the SIPTEA reflection. */
                    onAddReflection={() => setDebriefOpen(true)}
                  />
                )}
                <UpcomingSessionCard
                  dyad={dyad}
                  headingRef={upcomingHeadingRef}
                  onReschedule={() => setPlanModalOpen(true)}
                  attended={!!nextSession && attendedSessions.includes(nextSession.session)}
                  onJoin={() =>
                    setAttendedSessions((prev) =>
                      nextSession && !prev.includes(nextSession.session)
                        ? [...prev, nextSession.session]
                        : prev,
                    )
                  }
                />
                <WaveDivider label="Before session" />
                <PreSessionChecklist dyad={dyad} />
              </>
            ) : (
              <SessionPlanEmptyBanner
                dyad={dyad}
                ctaRef={createPlanBtnRef}
                onCreate={() => setCreatePlanOpen(true)}
              />
            )}
          </div>
        )}
        {/* Mounted at page level, not inside a tab — the hero's own trigger is
            visible on every tab, so a modal living inside the Coaching
            workspace panel would unmount underneath its opener. */}
        <EditSessionPlanModal
          open={planModalOpen}
          onClose={() => setPlanModalOpen(false)}
          dyad={dyad}
          /* Saving replaces the whole plan, so both triggers may have
             re-rendered. The hero button is the one that always exists while
             a plan does, so focus lands there rather than on the card's
             Reschedule, which a completed final session would remove. */
          onSaved={() => editPlanBtnRef.current?.focus()}
        />
        {/* The session debrief: the SIPTEA reflection wizard plus a
            confirmation screen that marks the session held. Mounted at page
            level for the same reason the plan modals are — its trigger lives in
            a tab panel that would unmount underneath it. */}
        {nextSession && (
          <AddAnnotationSummaryModal
            open={debriefOpen}
            onClose={() => setDebriefOpen(false)}
            dyadId={dyad.id}
            dyadTitle={dyadTitle(dyad)}
            /* The internal number, so the saved reflection lands on the right
               row of the My reflections table. `completeSession.label` below is
               the same session as display copy — the two are deliberately not
               derived from each other. */
            session={nextSession.session}
            completeSession={{
              /* `sessionRowLabel`, never a bare number — internal 1 is
                 "Planning" and every other value is off by one from what a
                 coach reads. */
              label: sessionRowLabel(nextSession.session),
              date: nextSession.date,
              time: nextSession.time,
              /* `toggleSession` is the same store action `SessionTracker`'s own
                 "Mark session complete" calls, so the plan and this wizard
                 cannot disagree about what completing a session means. */
              onConfirm: () => {
                toggleSession(dyad.id, nextSession.session)
                /* Measured: focus landed on `<body>` here. Completing the
                   session unmounts the banner whose CTA opened the wizard, so
                   the wizard's own focus-return target is already disconnected
                   by the time it fires — this project's most-repeated defect.
                   The card's heading is what survives, and it is also what
                   *says* the outcome (the upcoming session has moved on).
                   `requestAnimationFrame` because the completion re-render has
                   to commit before the heading exists in its new state. */
                requestAnimationFrame(() => upcomingHeadingRef.current?.focus())
              },
            }}
          />
        )}

        {/* The create wizard. Saving flips `planned`, which unmounts the banner
            and its CTA entirely — so focus goes to the hero's "Edit session
            plan", the control that exists precisely once a plan does, rather
            than to a button that has just disappeared. Landing on `<body>` is
            this project's most-repeated defect. */}
        <PlanSessionsModal
          open={createPlanOpen}
          onClose={() => setCreatePlanOpen(false)}
          dyad={dyad}
          onSaved={() => requestAnimationFrame(() => editPlanBtnRef.current?.focus())}
        />
        {tab === 'Case notes' && <SessionNotesTab key={dyad.id} dyad={dyad} />}
        {tab === 'My reflections' && <ReflectionsTab key={dyad.id} dyad={dyad} />}
        {tab === 'Client sleep & health data' && <SleepHealthDataTab dyad={dyad} />}
        {tab === 'Client Profile Details' && (
          <ProfileDetailsSections dyad={dyad} viewerRole="coach" />
        )}
      </div>
    </DeliveryShell>
  )
}
