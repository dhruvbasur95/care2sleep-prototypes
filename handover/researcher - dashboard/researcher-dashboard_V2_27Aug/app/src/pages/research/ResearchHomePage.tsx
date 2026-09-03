import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Calendar,
  CalendarPlus,
  CircleHelp,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { ResearchNotificationHub } from '@/components/research/ResearchNotificationHub'
import { InertButton } from '@/components/shared/InertButton'
import { MeetingsSection, type ScheduleRow } from '@/components/shared/MeetingsSection'
import { useResearch } from '@/data/research-context'
import { upcomingGroupSessions, type Coach } from '@/data/research'
import { TODAY } from '@/data/format'

/**
 * Research Dashboard Home — route `/research/schedule` (sidebar label "My
 * Home"), the app's landing page. `App.tsx` redirects `/` here, so this is the
 * first screen a researcher sees.
 *
 * What it renders, top to bottom:
 *  1. Hero band — `ResearchPageHero` in `ResearchShell`'s `hero` slot: a
 *     greeting plus the inert "Need help" pill.
 *  2. Full-bleed purple quick-actions bar, flush under the band via the
 *     shell's `heroBelow` slot.
 *  3. `ResearchNotificationHub` — the study-wide "needs attention" section.
 *  4. "Study overview" — four KPI tiles.
 *  5. `MeetingsSection` — the day-grouped Upcoming/Scheduled meetings table.
 *     This page builds the rows (`scheduledRows` below); that component only
 *     groups and renders them.
 *
 * Data in: the store (`useResearch`) for `coaches`, `consumerDyads`,
 * `spacesCoaches`, `sessionPlans` and `researcherProfile`, plus the static
 * `upcomingGroupSessions` fixture and the frozen `TODAY` constant.
 * Data out: nothing. This page has no write path of any kind.
 *
 * Four things a newcomer will otherwise get wrong:
 *
 * - **`TODAY` (`data/format.ts`) is a hardcoded date, not the real clock.** It
 *   decides the "Your sessions this week" tile here, and the Upcoming (today +
 *   tomorrow) vs Scheduled split inside `MeetingsSection`. Against a real clock
 *   every seeded meeting is in the past, so "Upcoming" reads empty. Swapping in
 *   a real clock means re-dating the seed data in the same change.
 *
 * - **Several controls here are deliberately inert.** "Need help" and
 *   "Schedule meeting" on this page, plus "Schedule session"/"Edit"/"Delete"
 *   inside `MeetingsSection`, all render through `InertButton` and do nothing.
 *   `appearance="active"` makes them visually indistinguishable from live
 *   controls; the only signal is the `sr-only` "(coming soon)" cue. Read
 *   `InertButton`'s doc comment before wiring any of them — it is the index of
 *   every unwired control in the package and what each one is waiting on.
 *
 * - **Every KPI tile is a second rendering of a fact some list page also
 *   shows.** Two surfaces derived from different fields is this codebase's
 *   most-repeated bug class; see the `StudyOverview` call site for which tile
 *   mirrors which page, and for the one that currently disagrees.
 *
 * - **The `StatCard` defined below is a local duplicate** of
 *   `components/shared/StatCard`, which the other three list pages import.
 *   Both draw the same tile. Change one and this page silently diverges.
 */

/* -------------------------------------------------------------------------
 * Study-protocol constants.
 *
 * These encode COACH-pathway rules, not layout. They live here because the
 * package has no config module; a real build should hoist them into one, and
 * `GRADUATED_PHASE` in particular is declared a second time in `RosterPage.tsx`
 * — the KPI tile here and the roster there derive from separate copies of one
 * rule, so a change to either alone makes the tile contradict the table.
 * ------------------------------------------------------------------------ */

/** Stage O (guided group practice) is scheduled per cohort, not per trainee —
 *  one Zoom meeting shared by everyone in the cohort, seeded in
 *  `upcomingGroupSessions`. Every other session kind on this table is
 *  individual: one row, one meeting, one attendee. `scheduledRows` below has to
 *  merge the two shapes, which is the only reason it is more than a `map`. */
const GROUP_PHASE = 4
const INDIVIDUAL_SESSION_PHASES = [5, 7, 8] // Stage A, Stage H, certified/SPACES supervision

/** Phase 8 = Entry into SPACES delivery, i.e. certified and no longer a
 *  trainee. Anyone below it is still in training. */
const GRADUATED_PHASE = 8

/** Window for the "Your sessions this week" tile, inclusive of today. */
const WEEK_DAYS = 7

/** What kind of session a row represents. Stage A and Stage H are both
 *  "Placement assessment" — no numbering, since the number isn't meaningful
 *  outside the COACH pathway's own stage lettering, already shown elsewhere. */
function sessionTypeLabel(phase: number): string {
  switch (phase) {
    case GROUP_PHASE:
      return 'Group practice'
    case 5:
    case 7:
      return 'Placement assessment'
    case 8:
      return 'Coach supervision'
    default:
      return 'Session'
  }
}

/** Builds the meetings table's rows: cohort-wide Stage O sessions merged with
 *  every individual session (Stage A/H trainees, certified-coach supervision),
 *  one row per real meeting.
 *
 *  Two rules the row shape hides, and which any Edit/Delete write path will
 *  have to respect:
 *  - A group row's write target is the cohort's `upcomingGroupSessions` entry,
 *    shared by every attendee. An individual row's is that one coach's
 *    `coach.upcomingSession`. `ScheduleRow` does not record which kind it is.
 *  - `covered` stops a trainee who is in a cohort session from also appearing
 *    as an individual row for the same slot.
 *
 *  Only booked meetings become rows — a coach with nothing scheduled is not a
 *  row on a schedule, which is why the tile counts and this table can differ
 *  from the roster's population counts without being wrong.
 *
 *  Returned sorted chronologically. `MeetingsSection` relies on that: it groups
 *  by day by walking the list and starting a new block whenever the date
 *  changes, so an unsorted list would produce duplicate day headers. */
function scheduledRows(coaches: Coach[]): ScheduleRow[] {
  const rows: ScheduleRow[] = []
  const covered = new Set<string>()

  for (const session of upcomingGroupSessions) {
    const attendees = coaches.filter((c) => c.currentPhase === GROUP_PHASE && c.cohort === session.cohort)
    if (attendees.length === 0) continue
    attendees.forEach((a) => covered.add(a.id))
    rows.push({
      key: `group-${session.cohort}-${session.date}`,
      title: session.title,
      attendeeNames: attendees.map((a) => a.fullName),
      sessionType: sessionTypeLabel(GROUP_PHASE),
      date: session.date,
      time: session.time,
      meetingId: session.meetingId,
      zoomLink: session.zoomLink,
    })
  }

  for (const coach of coaches) {
    if (!INDIVIDUAL_SESSION_PHASES.includes(coach.currentPhase) || covered.has(coach.id)) continue
    const upcoming = coach.upcomingSession
    if (!upcoming?.date || !upcoming.time || !upcoming.zoomLink) continue
    rows.push({
      key: coach.id,
      title: upcoming.title,
      attendeeNames: [coach.fullName],
      sessionType: sessionTypeLabel(coach.currentPhase),
      date: upcoming.date,
      time: upcoming.time,
      meetingId: upcoming.meetingId,
      zoomLink: upcoming.zoomLink,
    })
  }

  return rows.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}


/* ------------------------------------------------------------------------ */
/* Quick actions bar — full-bleed purple strip, flush under the welcome band  */
/* via `ResearchShell`'s `heroBelow` slot.                                    */
/* ------------------------------------------------------------------------ */

const QUICK_LINK_PILL =
  'inline-flex h-9 items-center gap-2 rounded-sm bg-card px-5 text-caption-medium text-primary-hover outline-none transition-colors'

/** Hover/focus/press. Applied to the two live links AND to the inert
 *  "Schedule meeting" pill, which is deliberately indistinguishable from them
 *  — see `InertButton`'s `appearance` note. */
const QUICK_LINK_INTERACTIVE =
  'hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:scale-[0.97]'

function QuickLinksBar() {
  return (
    // Keep `ring-offset-primary` in QUICK_LINK_INTERACTIVE in step with this
    // `bg-primary`: the focus ring is drawn with an offset painted in the bar's
    // own colour, so changing the surface without changing the offset leaves a
    // visible ring gap in the wrong colour. White on `primary` is 10.62:1.
    <div className="bg-primary px-6 py-4 md:px-16">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-4">
        <p className="text-body-md whitespace-nowrap text-white">Quick actions:</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/research/trainees" className={cn(QUICK_LINK_PILL, QUICK_LINK_INTERACTIVE)}>
            <UserPlus aria-hidden="true" className="size-4" strokeWidth={2} />
            Onboard trainees
          </Link>
          {/* Live link, but read the label carefully before wiring anything:
              consumer intake happens in REDCap, so this pill only navigates to
              Consumer Management — where the actual "Sync with REDCap" control
              is itself inert. There is no working consumer-enrolment route in
              this build. "Onboard trainees" above is different: trainee intake
              IS a working platform-side wizard (`AddCoachTraineeModal`). */}
          <Link to="/research/consumers" className={cn(QUICK_LINK_PILL, QUICK_LINK_INTERACTIVE)}>
            <RefreshCw aria-hidden="true" className="size-4" strokeWidth={2} />
            Sync consumers
          </Link>
          {/* INERT. There is no create-meeting write path anywhere in the
              package — no store slice for researcher-created meetings, no
              meeting-provider client. This and `MeetingsSection`'s "Schedule
              session" are two entry points to the same unbuilt flow; wire them
              together, and do not make one live while the other stays dead. */}
          <InertButton
            label="Schedule meeting"
            appearance="active"
            className={cn(QUICK_LINK_PILL, QUICK_LINK_INTERACTIVE)}
          >
            <CalendarPlus aria-hidden="true" className="size-4" strokeWidth={2} />
          </InertButton>
        </div>
      </div>
    </div>
  )
}

/** The hero's "Need help" pill — this app's canonical primary-outline button.
 *
 *  INERT: no help destination has been designed. Unlike the other unwired
 *  controls this is a content/IA decision (help centre? mailto? support form?),
 *  not an API integration. `CoachProfilePage`'s Stage Management tab has a
 *  second "Need Help?" pointing at the same unbuilt destination — resolve both
 *  together.
 *
 *  Do not remove `shrink-0`: this is a flex child in the hero's wrap row, and
 *  without it flex-shrink compresses the pill below the app's 36px control
 *  height floor. */
function NeedHelpButton() {
  return (
    <InertButton
      label="Need help"
      appearance="active"
      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
    >
      <CircleHelp aria-hidden="true" className="size-4" strokeWidth={2} />
    </InertButton>
  )
}

/* ------------------------------------------------------------------------ */
/* Study overview — the four KPI tiles                                       */
/* ------------------------------------------------------------------------ */

/** ⚠️ A LOCAL DUPLICATE of `components/shared/StatCard`, which the other three
 *  research list pages import and whose own doc comment claims (wrongly) that
 *  this page uses it too. The two render the same tile — 120px tall, 16px
 *  padding, `rounded-md`, `yellow-100` fill, no border and no shadow, a
 *  label/icon row over the value — from separate code.
 *
 *  Consequence: a change to the shared component updates Trainee, Consumer and
 *  Coach Management and leaves Home behind, with nothing failing to warn you.
 *  Collapsing onto the shared component is safe (the shared one is a superset:
 *  it adds optional `valueLabel`/`breakdown`/`breakdownLayout` props this page
 *  never passes) and is the recommended cleanup. */
function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="h-[120px] flex-1 rounded-md bg-yellow-100 p-4">
      {/* Keep the `<dl>`/`<dt>`/`<dd>` structure. A label and a number that are
          only visually a pair are three unrelated elements to a screen reader,
          which then announces a bare digit. This applies to every label/value
          pair in the app, not just here. */}
      <dl className="flex h-full flex-col gap-2">
        <div className="flex items-center justify-between">
          <dt className="text-caption font-medium text-ink">{label}</dt>
          {/* The icon is decorative — the `<dt>` beside it already names the
              figure — so it stays `aria-hidden`. */}
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center">
            <Icon className="size-5 text-purple-500" />
          </span>
        </div>
        <dd className="font-display text-display-lg font-medium text-ink">{value}</dd>
      </dl>
    </div>
  )
}

/**
 * The four study-wide KPI tiles. Every one of them restates a figure a list
 * page also derives, so each must be computed from the same field that page
 * renders — the recurring failure here is two surfaces counting two different
 * fields under one label.
 *
 * | Tile                     | Must agree with                                        |
 * |--------------------------|--------------------------------------------------------|
 * | Total consumers          | Consumer Management's roster + its "Consumer breakdown" |
 * | Active trainees          | Trainee Management's "Active trainees" tile and tab     |
 * | Coaches                  | Coach Management's "Total coaches" tile                 |
 * | Your sessions this week   | the meetings table below, within `WEEK_DAYS` of `TODAY` |
 *
 * ⚠️ KNOWN DISAGREEMENT — "Total consumers" passes the unfiltered
 * `consumerDyads.length`, while Consumer Management filters out dyads flagged
 * `omitFromConsumerRoster` before both its rows and its own tiles. One seeded
 * dyad carries that flag, so this tile reads one higher than the roster it
 * summarises. Fix by applying the same filter here, not by removing it there.
 *
 * "Coaches" has the same shape of risk without currently misreporting: it uses
 * `spacesCoaches.length`, whereas Coach Management counts only those rows whose
 * `coachId` resolves to a real `Coach`. They agree today because every row
 * resolves.
 */
function StudyOverview({
  consumerCount,
  activeTraineeCount,
  coachCount,
  sessionsThisWeek,
}: {
  consumerCount: number
  activeTraineeCount: number
  coachCount: number
  sessionsThisWeek: number
}) {
  return (
    <section>
      <h2 className="font-display text-title text-ink">Study overview</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total consumers" value={consumerCount} icon={Users} />
        <StatCard label="Active trainees" value={activeTraineeCount} icon={UserCheck} />
        <StatCard label="Coaches" value={coachCount} icon={Award} />
        <StatCard label="Your sessions this week" value={sessionsThisWeek} icon={Calendar} />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

export function ResearchHomePage() {
  const { coaches, consumerDyads, spacesCoaches, sessionPlans, researcherProfile } = useResearch()
  const firstName = researcherProfile.fullName.split(' ')[0]

  /** Raised by the attention hub when it has no notices left to show. It
   *  controls the top margin on the *next* section — see that `mt-24` below.
   *
   *  Note that notice dismissal itself is component-local state inside
   *  `NotificationHubView` with no backing store, so dismissed notices return
   *  on any navigation or reload. */
  const [attentionEmpty, setAttentionEmpty] = useState(false)

  const rows = scheduledRows(coaches)

  // `inviteStatus`, NOT the separate `CoachStatus` lifecycle field. A coach
  // carries both, and they can disagree — someone can be `status: 'active'`
  // while their platform invite is still `pending`. Trainee Management's Status
  // column and its own "Active trainees" tile both render `inviteStatus`, so
  // counting the other field here makes this tile contradict that page.
  const activeTraineeCount = coaches.filter(
    (c) => c.currentPhase < GRADUATED_PHASE && c.inviteStatus === 'active',
  ).length
  const weekEnd = addDays(TODAY, WEEK_DAYS)
  const sessionsThisWeek = rows.filter((row) => row.date >= TODAY && row.date < weekEnd).length

  return (
    <ResearchShell
      heroClassName="bg-purple-50"
      heroBelow={<QuickLinksBar />}
      hero={
        <ResearchPageHero
          title={`Hello, ${firstName}`}
          subtitle="Welcome to your dashboard, this is where you can get a quick overview of the study, attend to items that need attention, or manage your meetings."
          // Top-aligned with the title rather than bottom-aligned with the sub
          // copy. Home is the only hero that does this; the other four research
          // pages take the `end` default.
          actionAlign="start"
          action={<NeedHelpButton />}
        />
      }
    >
      {/* The attention section leads the page deliberately: "Study overview" is
          standing context that does not change hour to hour, while these are the
          items asking the researcher to act today. */}
      <div>
        <ResearchNotificationHub
          coaches={coaches}
          dyads={consumerDyads}
          sessionPlans={sessionPlans}
          onEmptyChange={setAttentionEmpty}
        />
      </div>

      {/* 96px is this page's standard gap between content sections.

          Do not simplify this to a constant `mt-24`: when the attention
          section above has nothing to show it removes its own box, but a
          margin belongs to the element that declares it, so the hub cannot
          reach this one. Without the conditional, "Study overview" would sit
          under a 96px hole. That is what `attentionEmpty`/`onEmptyChange`
          exist for. */}
      <div className={attentionEmpty ? '' : 'mt-24'}>
        <StudyOverview
          consumerCount={consumerDyads.length}
          activeTraineeCount={activeTraineeCount}
          coachCount={spacesCoaches.length}
          sessionsThisWeek={sessionsThisWeek}
        />
      </div>

      <div className="mt-24">
        <MeetingsSection rows={rows} idNamespace="research-home-meetings" />
      </div>

    </ResearchShell>
  )
}
