import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Calendar,
  CalendarPlus,
  CircleCheckBig,
  CircleHelp,
  ClipboardCheck,
  Handshake,
  RefreshCw,
  Scale,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import {
  ResearchPrioritiesSection,
  type ResearchPriorityItem,
} from '@/components/research/ResearchPrioritiesSection'
import { StatCard } from '@/components/shared/StatCard'
import { MeetingsSection, type ScheduleRow } from '@/components/shared/MeetingsSection'
import { useResearch } from '@/data/research-context'
import { upcomingGroupSessions, type Coach } from '@/data/research'
import { isPlanSet } from '@/data/spaces'
import { TODAY } from '@/data/format'

/**
 * Research Dashboard Home — rebuilt in **Round 21** from a supplied Figma
 * frame (file `s6OLTSd4nc9V9W9lT1oBTO`, node `1:38`), against the new brand
 * palette from that same file's palette frame (`23:2053`).
 *
 * The frame carries no Figma variables (`get_variable_defs` on it returns
 * `{}` — raw hex throughout), but every hex it uses turns out to be a real
 * swatch off the palette frame, so this page is written entirely against the
 * ramp tokens in `index.css` rather than against literals:
 *
 * | Frame hex  | Palette swatch     | Token used here            |
 * |------------|--------------------|----------------------------|
 * | `#f4efff`  | (band tint)        | `purple-50`                |
 * | `#8447ff`  | Purple Lighter 2   | `purple-500`                |
 * | `#c2a3ff`  | Purple Lighter 4   | `purple-300`                |
 * | `#3a00ad`  | Purple **Primary** | `primary`                  |
 * | `#200061`  | Purple Darker 1    | `primary-hover`            |
 * | `#fff0cc`  | Yellow Lighter 1   | `yellow-100`                |
 * | `#f2f2f2`  | (neutral)          | `muted`                    |
 * | `#e5e7eb`  | (neutral)          | `hairline`                 |
 * | `#f5f3fa`  | (neutral)          | `parchment`                |
 * | `#555`     | (neutral)          | `ink-faint`                |
 * | `#374151`  | (neutral)          | `ink-muted`                |
 * | `#2d8cff`  | — (Zoom blue)      | `purple-500` (blue→purple)  |
 *
 * The frame's `#e45f5b` alert badge is the one hex with no palette equivalent
 * — the ramps cover purple, yellow and neutrals only — so it stays on this
 * app's existing `destructive`, the same concept a shade harsher.
 *
 * Type: the frame's 56px hero, 24px section headings, 20px hero subtitle and
 * 13px labels had no equivalent in this project's scale, so each renders with the
 * *closest existing token* rather than a new step (56→`display-lg`, 24→`title`,
 * 20→`title` at normal weight, 18/16→`body`, 13→`caption`), with the frame's own
 * weight and tracking applied on top. Buttons keep the app-wide `text-[15px]`
 * convention, which already matches the frame exactly.
 *
 * Spacing is transcribed from the frame's own measurements: hero `pt-64 pb-32`,
 * quick-links `py-16`, content `pt-64`, 56px between the three content
 * sections, 24px heading→content within each, 16px between sibling cards,
 * 32px between day tables, 8px day-header→rows, rows `px-24 py-20`. Shadows
 * appear on exactly one element in the whole frame (the alert cards) and
 * nowhere else, so nothing else here carries one.
 *
 * Where the frame's mock data and this prototype's real data disagree, real
 * data wins and the divergence is called out:
 * - The frame shows a `02:00 PM - 03:00 PM` range; no session in `research.ts`
 *   carries a duration, so the time column shows the real start time with a
 *   `Melbourne time` sub-line (the study is Monash-based) rather than
 *   fabricating an end time.
 * - `Start` is a real link to the session's own Zoom URL. `Edit`, `Delete`,
 *   `Schedule session` and `Need help` have no write path or destination — none
 *   is designed for this surface yet — so they render as focusable
 *   `aria-disabled` buttons with an `sr-only` cue, this app's established
 *   treatment for a designed-but-unwired control (Round 6.1's "Schedule a
 *   session", Round 10's "View recording").
 * - The frame's `Upcoming` / `Scheduled` tabs are unlabelled as to what
 *   divides them. Split here at a real, non-overlapping boundary: `Upcoming`
 *   is today and tomorrow (matching the frame's own `Today` / `Tomorrow` group
 *   headers), `Scheduled` is everything further out.
 *
 * Two deliberate divergences, both to keep an existing rule:
 * - The frame's row buttons are 32px and its alert CTA 33px; both are raised to
 *   36px (`h-9`), the control-height floor this app has enforced in three
 *   separate rounds (3.1 at 28px, 10 at 32px, 18 at 24px).
 * - Button labels use this project's sentence casing and terminology
 *   ("Onboard trainees", not the frame's "Onboard Trainees").
 */

/** Stage O (guided group practice) is scheduled per cohort — see
 *  `upcomingGroupSessions`. Every other kind of session on this table is
 *  individual: one row, one meeting, one set of attendees. */
const GROUP_PHASE = 4
const INDIVIDUAL_SESSION_PHASES = [5, 7, 8] // Stage A, Stage H, certified/SPACES supervision

/** A trainee still in training, not yet graduated into SPACES delivery — the
 *  same `currentPhase < 8` rule `RosterPage` scopes its roster by, so the
 *  "Active trainees" tile and that page can't disagree. */
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

/** Merges cohort-wide Stage O sessions with every individual session (Stage
 *  A/H trainees, certified-coach supervision) into one row per real meeting,
 *  dropping anything not actually booked — a coach with nothing scheduled
 *  isn't a row on a schedule. Sorted chronologically, so the day grouping
 *  below can just walk the list in order. */
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


/** The frame's `Edit` / `Delete` / `Schedule session` / `Need help` /
 *  `Schedule meeting` controls: drawn, but with no write path or destination
 *  behind them yet. Focusable and announced rather than silently dead.
 *
 *  Round 28 — `appearance`:
 *  - `dimmed` (default) keeps the muted look: `cursor-default`, and callers
 *    pass their own `opacity-*`. Used by the row `Edit`/`Delete` pair.
 *  - `active` renders **identically to a live control**, hover and press
 *    included, on direct instruction ("make it non functional but in active
 *    state"). Used by the two scheduling CTAs and `Need help`.
 *
 *    `cursor-pointer` is part of that and is not incidental: a `<button>`
 *    computes to `cursor: default` by default, so the inert "Schedule meeting"
 *    pill was giving itself away on hover next to the two `<a>` Onboard pills
 *    beside it, which get `pointer` for free. Measured, not assumed.
 *
 *  `aria-disabled` and the `sr-only` cue stay on in BOTH appearances, and that
 *  matters more in `active` than in `dimmed`: with the visual signal removed,
 *  the accessible one is the only thing left telling a screen-reader or
 *  keyboard user that a control which looks and hovers like a button will not
 *  do anything. Dropping it would be the "silently dead button" this project's
 *  own rules prohibit. */
function InertButton({
  label,
  className,
  children,
  appearance = 'dimmed',
}: {
  label: string
  className: string
  children?: ReactNode
  appearance?: 'dimmed' | 'active'
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      className={cn(className, appearance === 'dimmed' ? 'cursor-default' : 'cursor-pointer')}
    >
      {children}
      {label}
      <span className="sr-only"> (coming soon)</span>
    </button>
  )
}

/* ------------------------------------------------------------------------ */
/* Quick actions bar — full-bleed, flush under the welcome band (`23:1422`)  */
/* ------------------------------------------------------------------------ */

/** The frame's white pill (`25:3`): 8px radius, 20px/10px padding, 8px icon
 *  gap, `caption-medium` label in Purple/900. */
const QUICK_LINK_PILL =
  'inline-flex h-9 items-center gap-2 rounded-sm bg-card px-5 text-caption-medium text-primary-hover outline-none transition-colors'

/** Hover/focus/press. Applied to the two live links AND to the inert
 *  "Schedule meeting" pill, which is deliberately indistinguishable from them
 *  — see `InertButton`'s `appearance` note. */
const QUICK_LINK_INTERACTIVE =
  'hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:scale-[0.97]'

function QuickLinksBar() {
  return (
    // Round 28: bar surface moved `purple-500` -> **`primary`** (Purple/700,
    // #4a278f), re-read from the frame rather than assumed. White on it is
    // 10.62:1. The focus ring's own offset colour moved with it, or the ring
    // would be drawn against a surface that is no longer there.
    <div className="bg-primary px-6 py-4 md:px-16">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-4">
        {/* "Quick links" -> "Quick actions" on direct instruction. */}
        <p className="text-body-md whitespace-nowrap text-white">Quick actions:</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/research/trainees" className={cn(QUICK_LINK_PILL, QUICK_LINK_INTERACTIVE)}>
            <UserPlus aria-hidden="true" className="size-4" strokeWidth={2} />
            Onboard trainees
          </Link>
          {/* Consumer intake moved to REDCap, so this pill no longer promises
              an onboarding flow the destination page doesn't have. It stays a
              live link — Consumer Management is still the place you go — but
              the label and glyph name what actually happens there now.
              "Onboard trainees" above is untouched: trainee intake is still
              a platform-side wizard. */}
          <Link to="/research/consumers" className={cn(QUICK_LINK_PILL, QUICK_LINK_INTERACTIVE)}>
            <RefreshCw aria-hidden="true" className="size-4" strokeWidth={2} />
            Sync consumers
          </Link>
          {/* Third pill, added from frame `329:3756`.
              Icon is deliberately NOT the frame's: `329:3757` reuses the exact
              same person glyph as the two Onboard pills beside it, which is a
              copy-paste in the frame rather than a choice — a person icon on
              "Schedule meeting" describes the wrong noun. `CalendarPlus` is
              used instead, the same lucide glyph the frame itself draws on its
              own `btn-schedule-session` (`1:1033`, `calendar-plus`), so the two
              scheduling actions on this page share one icon.

              Inert for the same reason "Schedule session" below is: there is
              no scheduling write path on this surface yet. Having one of the
              two be a live link and the other dead would be worse than both
              being honestly unwired. */}
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

/** The frame's `add-new-button` (`329:3751`), moved out of the Quick Links bar
 *  and into the welcome band on direct instruction.
 *
 *  The frame draws a 2px-stroked 48px-radius pill in Purple/700 — which is
 *  this app's own **primary-outline** canonical button almost exactly, so it
 *  renders as that rather than as the frame's own chrome (1px border, the
 *  app's 36px height floor against the frame's 41px). */
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
/* Study overview (`1:926`)                                                  */
/* ------------------------------------------------------------------------ */

/* The tiles are the shared `components/shared/StatCard.tsx`, not a local copy.
   Home had its own near-identical `StatCard` since Round 21; the shared one has
   since grown the `valueLabel` + `breakdown` props Trainee Management and
   Consumer Management already use, which is exactly what the eight tiles below
   need, so the fork is retired rather than taught the same trick twice. */

/** Eight tiles, per the researcher-dashboard open-items document.
 *
 *  Where a figure can be derived from the prototype's own seed data it is —
 *  total consumers, coaches and trainees, coach-assignment and session-plan
 *  coverage, sessions this week — so this row cannot contradict the Consumer,
 *  Trainee and Coach Management pages that count the same things.
 *
 *  The parts with **no field behind them** are the week-on-week deltas and the
 *  completed-study count. Those are dummy constants, marked below: the study
 *  has no enrolment-timestamp or completion field yet, and this round is a UI
 *  pass, not a data one. `[No change this week if none]` in the source document
 *  is why a zero delta renders as words rather than "+0". */
const DUMMY = {
  consumersAddedThisWeek: 1,
  coachesAddedThisWeek: 0,
  traineesAddedThisWeek: 1,
  completedStudy: 1,
  completedAddedThisWeek: 0,
} as const

/** `[No change this week if none]` — a zero delta is a sentence, not a digit,
 *  and it carries a direction so the tile can tint it and pick its arrow.
 *
 *  These tiles stay on `StatCard`'s default `inline` breakdown. `stacked` was
 *  tried, since its own doc comment recommends it for word-valued breakdowns —
 *  measured here it is worse, not better: in a 4-up row "No change" wraps onto
 *  two lines inside its column and "Consumers" truncates to "Consu...". Inline
 *  wraps the whole part onto a second row instead, which fits. */
function weekDelta(n: number): {
  label: string
  value: string
  srValue?: string
  trend: 'up' | 'down' | 'flat'
} {
  return {
    label: 'This week',
    /* Direct instruction: a zero delta is the dash alone, not the words "No
       change" — the `Minus` glyph the `flat` trend already renders says it, and
       a 9-character string beside a 24px number read as a second, competing
       figure. The words survive for screen readers via `srValue`, which is the
       only place they were carrying information a sighted reader could not get
       from the glyph. */
    value: n === 0 ? '' : n > 0 ? `+${n}` : `${n}`,
    srValue: n === 0 ? 'No change' : undefined,
    trend: n === 0 ? 'flat' : n > 0 ? 'up' : 'down',
  }
}

function StudyOverview({
  consumerCount,
  activeConsumerCount,
  traineeCount,
  activeTraineeCount,
  coachCount,
  activeCoachCount,
  consumersWithCoach,
  consumersOnboarded,
  sessionsThisWeek,
}: {
  consumerCount: number
  activeConsumerCount: number
  traineeCount: number
  activeTraineeCount: number
  coachCount: number
  activeCoachCount: number
  consumersWithCoach: number
  consumersOnboarded: number
  sessionsThisWeek: number
}) {
  /* Guarded: a study with no onboarded coaches would otherwise render `NaN`
     here, and a KPI tile showing NaN is worse than one showing nothing. */
  const avgPerCoach = coachCount === 0 ? '—' : (consumerCount / coachCount).toFixed(1)

  return (
    <section>
      <h2 className="font-display text-title text-ink">Study overview</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total consumers"
          value={consumerCount}
          valueLabel="Total"
          icon={Users}
          breakdown={[
            { label: 'Active', value: activeConsumerCount },
            weekDelta(DUMMY.consumersAddedThisWeek),
          ]}
        />
        <StatCard
          label="Total coaches"
          value={coachCount}
          valueLabel="Total"
          icon={Award}
          breakdown={[
            { label: 'Active', value: activeCoachCount },
            weekDelta(DUMMY.coachesAddedThisWeek),
          ]}
        />
        <StatCard
          label="Total trainees"
          value={traineeCount}
          valueLabel="Total"
          icon={UserCheck}
          breakdown={[
            { label: 'Active', value: activeTraineeCount },
            weekDelta(DUMMY.traineesAddedThisWeek),
          ]}
        />
        <StatCard
          label="Fully completed study"
          value={DUMMY.completedStudy}
          valueLabel="Consumers"
          icon={CircleCheckBig}
          breakdown={[weekDelta(DUMMY.completedAddedThisWeek)]}
        />
        <StatCard
          label="Coach assigned to consumer"
          value={`${consumersWithCoach} of ${consumerCount}`}
          icon={Handshake}
        />
        <StatCard
          label="Consumer onboarding started"
          value={`${consumersOnboarded} of ${consumerCount}`}
          icon={ClipboardCheck}
        />
        <StatCard label="Your sessions this week" value={sessionsThisWeek} icon={Calendar} />
        <StatCard label="Average consumers per coach" value={avgPerCoach} icon={Scale} />
      </div>
    </section>
  )
}

/* MeetingsSection moved to `components/shared/MeetingsSection.tsx` in Round 29
   when the Coach Delivery Portal's Home became its second caller. `ScheduleRow`
   is now imported from there too — this page still builds the rows. */

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

/** Dummy attention rows spanning all four classifications in the
 *  researcher-dashboard open-items document — Staffing and assignment,
 *  Progress and engagement, Certification and training, Data issues.
 *
 *  **Twelve of the seventeen, not all of them** (direct instruction, twice):
 *  the first pass was one per category, then widened to "some more, to show
 *  the pagination use case". Twelve fills three pages of four, which is what
 *  makes the pager reviewable; the full seventeen-row classification is
 *  documentation for the build and lives in the Figma dev section rather than
 *  on this surface.
 *
 *  All twelve are **dummy**, named after real seed records only so the copy
 *  reads like the real thing. None has a trigger behind it: there is no
 *  consumer `lastActive`, no knowledge-check accuracy, no projected study-end
 *  date and no per-session reflection flag in the data layer. Wiring those is
 *  a separate pass — this round is UI. The `to` targets are real routes, so
 *  every row still goes somewhere sensible. */
function attentionItems(): ResearchPriorityItem[] {
  return [
    // --- Staffing and assignment ---
    {
      id: 'staffing-no-coach',
      priority: 'High',
      title: 'No coach assigned',
      note: 'Harold Ableson & Diane Ableson have been onboarded but have no coach linked.',
      to: '/research/consumers',
    },
    {
      id: 'staffing-certified-not-onboarded',
      priority: 'Medium',
      title: 'Coach certified but not onboarded',
      note: 'Mei-Ling Chen has passed certification but has not been converted to an active coach record.',
      to: '/research/spaces-coaches',
    },
    {
      id: 'staffing-trainee-invite',
      priority: 'Medium',
      title: 'Trainee invite pending',
      note: "Priya Raman's platform invite has not been accepted after 7 days.",
      to: '/research/trainees',
    },
    {
      id: 'staffing-consumer-invite',
      priority: 'Medium',
      title: 'Consumer invite pending',
      note: "Arthur Ngata & Tania Ngata's invite has not been accepted after 7 days.",
      to: '/research/consumers',
    },
    // --- Progress and engagement ---
    {
      id: 'progress-no-plan',
      priority: 'Medium',
      title: 'No session plan built',
      note: 'Dorothy Kellerman & Frank Kellerman have a coach assigned but no session plan created.',
      to: '/research/consumers',
    },
    {
      id: 'progress-inactive-consumer',
      priority: 'High',
      title: 'Consumer not active for 7 days',
      note: 'Dorothy Kellerman has not been active in the platform for 7 days.',
      to: '/research/consumers',
    },
    {
      id: 'progress-module-incomplete',
      priority: 'Medium',
      title: 'Module incomplete after session held',
      note: "Bruce Whitfield's Session 3 has passed but its linked module still shows incomplete.",
      to: '/research/consumers',
    },
    {
      id: 'progress-session-not-held',
      priority: 'High',
      title: 'Coaching session not held this week',
      note: "This week's session for Eleanor Sinclair & Margaret Sinclair did not go ahead.",
      to: '/research/consumers',
    },
    {
      id: 'progress-trainee-accuracy',
      priority: 'Medium',
      title: 'Knowledge-check accuracy below threshold',
      note: "Marcus Webb scored 48% on Module 4, under the 60% threshold.",
      to: '/research/trainees',
    },
    {
      id: 'progress-inactive-trainee',
      priority: 'High',
      title: 'Trainee not active for 7 days',
      note: 'Noah Fenwick has not been active in the platform for 7 days.',
      to: '/research/trainees',
    },
    // --- Certification and training ---
    {
      id: 'certification-ready',
      priority: 'Medium',
      title: 'Trainee ready for final assessment',
      note: 'Lauren Mitchell has completed all prior stages and is waiting on Stage H.',
      to: '/research/trainees',
    },
    // --- Data issues ---
    {
      id: 'data-fitbit-sync',
      priority: 'High',
      title: 'Fitbit not synced in 48+ hours',
      note: "Bruce Whitfield's wearable data has not synced since 19 September.",
      to: '/research/consumers',
    },
  ]
}

export function ResearchHomePage() {
  const { coaches, consumerDyads, spacesCoaches, sessionPlans, researcherProfile } = useResearch()
  const firstName = researcherProfile.fullName.split(' ')[0]

  /** Set when the last attention row is dismissed, so the gap this section
   *  owns closes with it rather than leaving a 96px hole between Study
   *  overview and the meetings table. */
  const [attentionEmpty, setAttentionEmpty] = useState(false)

  const rows = scheduledRows(coaches)

  const trainees = coaches.filter((c) => c.currentPhase < GRADUATED_PHASE)
  const activeTraineeCount = trainees.filter((c) => c.inviteStatus === 'active').length
  const activeConsumerCount = consumerDyads.filter((d) => Boolean(d.coachId)).length
  const consumersWithCoach = activeConsumerCount
  const consumersOnboarded = consumerDyads.filter((d) => isPlanSet(sessionPlans[d.id])).length

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
          // Top-aligned, not bottom: in the frame the button (`329:3751`) and
          // the title block (`329:3750`) both sit at y=64, so it lines up with
          // the title, not with the foot of a two-line sub copy 40px below.
          actionAlign="start"
          action={<NeedHelpButton />}
        />
      }
    >
      {/* Section order is **Study overview -> attention -> meetings** (direct
          instruction). Round 28 had put attention first, on the reasoning that
          the thing asking for action should lead. That reasoning was tied to
          the old hub, which carried a "Dismiss all" and so behaved like an
          inbox to clear; with that control gone the attention list is a
          standing read, and the study's own headline figures lead instead. */}
      <StudyOverview
        consumerCount={consumerDyads.length}
        activeConsumerCount={activeConsumerCount}
        traineeCount={trainees.length}
        activeTraineeCount={activeTraineeCount}
        coachCount={spacesCoaches.length}
        activeCoachCount={spacesCoaches.length}
        consumersWithCoach={consumersWithCoach}
        consumersOnboarded={consumersOnboarded}
        sessionsThisWeek={sessionsThisWeek}
      />

      {/* The 96px offset is this page's own spacing (Round 28), not the frame's
          56px. Dropped to 0 once every row is dismissed: the section unmounts
          itself, and a wrapper still holding a margin would leave the hole
          behind it. */}
      <div className={attentionEmpty ? '' : 'mt-24'}>
        <ResearchPrioritiesSection items={attentionItems()} onEmptyChange={setAttentionEmpty} />
      </div>

      <div className="mt-24">
        <MeetingsSection rows={rows} idNamespace="research-home-meetings" />
      </div>

    </ResearchShell>
  )
}
