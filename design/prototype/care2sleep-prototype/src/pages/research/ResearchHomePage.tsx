import { useState, type ReactNode } from 'react'
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
import { MeetingsSection, type ScheduleRow } from '@/components/shared/MeetingsSection'
import { useResearch } from '@/data/research-context'
import { upcomingGroupSessions, type Coach } from '@/data/research'
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

/** The frame's `stat-card` (`1:341`) transcribed exactly: 120px tall, 16px
 *  padding, 12px radius, Yellow Lighter 1 fill, no border and no shadow; a
 *  label/icon row on top, then the value below it.
 *
 *  Deliberately not the shared `KpiTile`: that component bottom-anchors its
 *  value and always reserves a subtext line beneath it (both load-bearing for
 *  the baseline alignment its own doc comment explains), which is a different
 *  layout from this card's simple top-down stack. Forcing one to render the
 *  other would have meant a flag that switches off the very behaviour that
 *  makes it correct on the two pages already using it. */
function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="h-[120px] flex-1 rounded-md bg-yellow-100 p-4">
      {/* `<dl>` term/definition, per the accessibility fix Round 20 made to
          `KpiTile` for this same label/number pairing — a screen reader landing
          on the number alone otherwise gets a bare digit with nothing tying it
          to its label. */}
      <dl className="flex h-full flex-col gap-2">
        <div className="flex items-center justify-between">
          <dt className="text-caption font-medium text-ink">{label}</dt>
          {/* Same lucide glyphs, same `size-5`, same default stroke as the
              shared `KpiTile` renders on Trainee/Consumer Management, so all
              three KPI rows in the dashboard read as one family. The frame's
              own 32px icon box is kept as the wrapper so the icon lands on the
              frame's optical position. */}
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center">
            <Icon className="size-5 text-purple-500" />
          </span>
        </div>
        <dd className="font-display text-display-lg font-medium text-ink">{value}</dd>
      </dl>
    </div>
  )
}

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

/* MeetingsSection moved to `components/shared/MeetingsSection.tsx` in Round 29
   when the Coach Delivery Portal's Home became its second caller. `ScheduleRow`
   is now imported from there too — this page still builds the rows. */

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

export function ResearchHomePage() {
  const { coaches, consumerDyads, spacesCoaches, sessionPlans, researcherProfile } = useResearch()
  const firstName = researcherProfile.fullName.split(' ')[0]

  /** Set by the attention hub when its last notice is dismissed — see its
   *  `onEmptyChange` note and the `mt-24` it controls below. */
  const [attentionEmpty, setAttentionEmpty] = useState(false)

  const rows = scheduledRows(coaches)

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
          // Top-aligned, not bottom: in the frame the button (`329:3751`) and
          // the title block (`329:3750`) both sit at y=64, so it lines up with
          // the title, not with the foot of a two-line sub copy 40px below.
          actionAlign="start"
          action={<NeedHelpButton />}
        />
      }
    >
      {/* Round 28, direct instruction: the attention section moved ABOVE
          "Study overview". A deliberate divergence from frame `1:38`, which
          orders them the other way round — and the better order for this
          surface: "Study overview" is standing context that does not change
          hour to hour, while these are the items asking the researcher to do
          something today. The thing that needs action leads. */}
      <div>
        <ResearchNotificationHub
          coaches={coaches}
          dyads={consumerDyads}
          sessionPlans={sessionPlans}
          onEmptyChange={setAttentionEmpty}
        />
      </div>

      {/* The frame's own section offsets are 56px; raised to 96px (`mt-24`) on
          direct feedback that the sections read as too tightly packed. A
          deliberate divergence from the frame, and the only spacing value on
          this page that isn't transcribed from it.

          Round 28: dropped to 0 once the attention section hides itself, so
          "Study overview" rises into the position that section occupied
          instead of sitting under a 96px hole. The hub collapses its own box
          but cannot reach the margin its sibling owns — hence the callback. */}
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
