import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Award,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarX,
  Check,
  ChevronRight,
  ClipboardCheck,
  HeartHandshake,
  MessageCircleQuestionMark,
  MessagesSquare,
  Search,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { DeliveryShell } from '@/components/delivery/DeliveryShell'
import { WaveDivider } from '@/components/delivery/WaveDivider'
import { DeliveryTour } from '@/components/delivery/DeliveryTour'
import { COACH_TOUR_STEPS, startDeliveryTour, useDeliveryTour } from '@/data/deliveryTour'
import { Confetti } from '@/components/delivery/Confetti'
import {
  ResearchPrioritiesSection,
  type ResearchPriorityItem,
} from '@/components/research/ResearchPrioritiesSection'
import { EmptyState } from '@/components/shared/EmptyState'
import { InertButton } from '@/components/shared/MeetingsSection'
import { StatCard } from '@/components/shared/StatCard'
import { useCoachStage } from '@/data/coachStage'
import { PATHWAY_STAGE_COPY } from '@/data/coachPathway'
import {
  TIMEPOINT_BY_STAGE,
  useReflectionState,
  type ReflectionTimepoint,
} from '@/data/traineeReflections'
import { TraineeReflectionModal } from '@/components/delivery/TraineeReflectionModal'
import { coaches, upcomingGroupSessions, type Coach } from '@/data/research'
import {
  PATHWAY_MODULES,
  completedModulesCount,
  realPlayerContentId,
  resumableModule,
} from '@/pages/training-v2/pathway'
import { type UpcomingSessionRow } from '@/components/shared/UpcomingSessionsPanel'
import { SearchInput } from '@/components/SearchInput'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/research/StatusChip'
import { cn } from '@/lib/utils'
import {
  dyadsForCoach,
  isPlanSet,
  nextPlannedSession,
  displaySessionNumber,
  nextUpcomingSessionEntry,
  sessionRowLabel,
  SPACES_CATCHUP_COUNT,
  addDays,
  catchupSessionsCompleted,
  type ConsumerDyad,
  type SessionCompletionRecord,
  type HealthLogEntry,
  type SessionPlan,
} from '@/data/spaces'
import { useResearch } from '@/data/research-context'
import { formatDate, formatTime, TODAY } from '@/data/format'

const COACH_ID = 'helen-zhang'
const COACH_FIRST_NAME = 'Helen'

function dyadTitle(dyad: ConsumerDyad): string {
  return dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name
}

/**
 * First names only — "Bruce & Joan", not "Bruce Whitfield & Joan Whitfield".
 *
 * Round 40, for the priorities list. A coach carries three clients and knows
 * them by first name; the full pair is 33 characters, which is what pushed
 * every row of that list onto a second line. The full name is still what the
 * clients table and every client record show, so nothing is lost — this is the
 * short form for a place where the name is the *second* half of a line, not
 * its subject.
 */
function dyadFirstNames(dyad: ConsumerDyad): string {
  const first = (name: string) => name.split(' ')[0]
  return dyad.patient
    ? `${first(dyad.patient.name)} & ${first(dyad.carer.name)}`
    : first(dyad.carer.name)
}

/** Builds the shared panel's ad-hoc-meeting rows from a coach's consumer
 *  dyads — exported for direct reuse by the per-consumer detail page
 *  (Round 6.2 — Session Notes tab's Upcoming sessions section), scoped to
 *  one dyad instead of the coach's full caseload. Pair with
 *  `nextSessionRowsForDyads` below for the real planned session too — this
 *  function alone only ever returns the one-off extras. */
export function upcomingSessionRowsForDyads(
  dyads: ConsumerDyad[],
  sessionPlans: Record<string, SessionPlan>,
): UpcomingSessionRow[] {
  return dyads.flatMap((d) =>
    (sessionPlans[d.id]?.adHocMeetings ?? []).map((m) => ({
      key: m.id,
      title: m.title,
      subtitle: dyadTitle(d),
      date: m.date,
      time: m.time,
      meetingId: m.meetingId,
      zoomLink: m.zoomLink,
    })),
  )
}

/** Each dyad's next dated, not-yet-completed planned session as an
 *  `UpcomingSessionRow` — merged alongside `upcomingSessionRowsForDyads`'s
 *  ad-hoc rows so "My upcoming meetings" reflects everything actually on
 *  the calendar, not just the one-off extras (a coach with a real session
 *  today used to see an empty panel here, which read as flatly wrong). */
export function nextSessionRowsForDyads(
  dyads: ConsumerDyad[],
  sessionPlans: Record<string, SessionPlan>,
  sessionCompletion: Record<string, SessionCompletionRecord[]>,
): UpcomingSessionRow[] {
  return dyads.flatMap((d) => {
    const next = nextPlannedSession(sessionPlans[d.id], sessionCompletion[d.id] ?? [])
    if (!next) return []
    return [
      {
        key: `${d.id}-next-session`,
        title: sessionRowLabel(next.session),
        subtitle: dyadTitle(d),
        date: next.date ?? '',
        time: next.time ?? '',
        meetingId: next.meetingId ?? '',
        zoomLink: next.zoomLink ?? '',
      },
    ]
  })
}

/* ------------------------------------------------------------------------ */
/* Your consumers table (full width, below)                                  */
/* ------------------------------------------------------------------------ */

function ConsumersTable({ dyads }: { dyads: ConsumerDyad[] }) {
  const { sessionCompletion, sessionPlans } = useResearch()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  // Ordered least-to-most progressed (0 sessions → all sessions done) so the
  // table reads as a rough delivery-stage ladder rather than seed-data order.
  const filtered = dyads
    .filter((d) => dyadTitle(d).toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (sessionCompletion[a.id] ?? []).length - (sessionCompletion[b.id] ?? []).length)

  /* Round 40, direct instruction: **no export options for coaches.** The CSV
     download this table carried since Round 6.1.1 is gone along with its
     builder — a coach exports nothing; extracting study data is the research
     team's job and their own tables still do it. */

  return (
    // Round 29: restyled to the researcher's own "Assigned consumers" caseload
    // card (`SpacesCoachProfilePage`), on direct instruction — a purely visual
    // alignment, the data and columns are unchanged. The card header is plain
    // white with the title/sub left and the controls right; the `purple-50`
    // tint moves down onto the table's real `<thead>`. That is the same
    // documented, frame-driven divergence from §35a the researcher table makes:
    // the tint is the boundary, so a second band above it would read as two
    // headers.
    /* Round 40, frame `739:6928`: **no card.** The heading, sub copy and search
       sit directly on the page canvas with the table below them — the same
       shape the frame's own `trainee-table-sec` draws, and the same shape My
       Notes and the Case notes tab already use. The Round 29 card wrapper it
       replaces put a white panel around a header that then had a second
       bordered panel inside it. */
    <section className="flex flex-col gap-6" data-tour="clients-table">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {/* Frame `739:6931`/`739:6932` say "Clients assigned to me" and
              "Click on any client to manage their session progress".
              `/design:ux-copy`, Round 40: the subtitle is taken — it says what
              clicking a row does, where "Select clients to track their study
              progress" described neither the gesture nor the outcome. The
              heading keeps **"to you"**: this page addresses the coach in the
              second person throughout ("Manage sessions with your clients",
              "This week's priorities"), and the frame's first person belongs to
              the nav's own "My …" convention, not to page copy. */}
          <h2 className="font-display text-title text-ink">Clients assigned to you</h2>
          <p className="mt-1.5 text-body text-ink">
            Click on any client to manage their session progress
          </p>
        </div>
        <div className="flex items-center gap-3">
            <SearchInput
              id="consumer-search"
              label="Search clients"
              value={query}
              onChange={setQuery}
              placeholder="Search clients"
              widthClassName="sm:w-[340px]"
            />
        </div>
      </div>

      {/* Round 40, direct instruction: white fill, `parchment` stroke and the
          app's card shadow. The `shadow-none` this carried was correct while
          the whole section sat inside a `Card` — a shadow inside a shadow reads
          as a seam. With the card gone the table *is* the surface, and it now
          matches the Case notes and My reflections tables exactly. */}
      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-parchment bg-white shadow-card">
        {/* Two genuinely different empty states, matching the researcher card:
            a search that matches nothing is not the same as a coach with no
            caseload, and one message for both would be false in one of them.
            The icon carries the difference. */}
        {dyads.length === 0 ? (
          <EmptyState icon={Users} copy="No clients assigned yet" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} copy={`No clients match “${query.trim()}”`} />
        ) : (
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead>
              <tr className="bg-purple-50">
                <th scope="col" className="px-6 py-4 text-caption-medium text-ink">
                  Client Details
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Session Planned
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Sessions Completed
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Upcoming Session
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Next Session Date
                </th>
                <th scope="col" className="px-4 py-4 text-caption-medium text-ink">
                  Time
                </th>
                <th scope="col" className="relative px-4 py-4">
                  <span className="sr-only">Open profile</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dyad, i) => {
                const completedRows = sessionCompletion[dyad.id] ?? []
                const sessionsCompleted = catchupSessionsCompleted(completedRows)
                /* Read the whole "next session" answer off ONE resolution.
                   This row used to take its number from the live session plan
                   and its date/time from `dyad.upcomingSession`, the frozen
                   legacy seed field — so editing a plan updated "Session 4"
                   here while the date beside it stayed at its seed value
                   forever. Reported as the session plan date "not working",
                   and from this table that is exactly how it looked.
                   `nextUpcomingSessionEntry` exists for this and already backs
                   the researcher's own caseload table; the coach portal's Home
                   was simply never migrated onto it. The legacy field stays as
                   the fallback for a dyad with no plan yet. */
                const upcoming = nextUpcomingSessionEntry(
                  sessionPlans[dyad.id],
                  completedRows,
                  dyad.upcomingSession,
                )
                const upcomingDisplayNumber = upcoming
                  ? displaySessionNumber(upcoming.session)
                  : undefined
                return (
                  <tr
                    key={dyad.id}
                    onClick={() => navigate(`/delivery/consumers/${dyad.id}`)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-pearl',
                      i > 0 && 'border-t border-hairline',
                    )}
                  >
                    <td className="px-6 py-3">
                      {/* `items-start` — the `Transferred` chip below is a
                          flex child of this column, and without it a pill
                          stretches to the column's full width and reads as a
                          bar. Same fix the researcher's own caseload table
                          carries for the same chip. */}
                      <div className="flex min-h-11 flex-col items-start justify-center gap-0.5 text-caption">
                        {dyad.patient && (
                          <span className="text-ink">
                            <span className="text-ink-faint">PLE:</span>{' '}
                            <Link
                              to={`/delivery/consumers/${dyad.id}`}
                              aria-label={`View ${dyadTitle(dyad)}'s profile`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {dyad.patient.name}
                            </Link>
                          </span>
                        )}
                        <span className="text-ink">
                          <span className="text-ink-faint">Carer:</span>{' '}
                          {dyad.patient ? (
                            dyad.carer.name
                          ) : (
                            <Link
                              to={`/delivery/consumers/${dyad.id}`}
                              aria-label={`View ${dyadTitle(dyad)}'s profile`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {dyad.carer.name}
                            </Link>
                          )}
                        </span>
                        {/* Under the names, after the carer — the same slot,
                            the same yellow and the same shared `Chip` the
                            researcher's caseload table gives a transferred-in
                            consumer, so the flag is one vocabulary across both
                            portals rather than two inventions of it.
                            `mt-1` because the names are a 2px-gap stack and a
                            27px pill butting straight onto them reads as a
                            third name. */}
                        {dyad.transfer && (
                          <span className="mt-1">
                            <Chip tone="yellow" label="Transferred" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isPlanSet(sessionPlans[dyad.id]) ? (
                        <Chip tone="success" label="Created" />
                      ) : (
                        <Chip tone="muted" label="Not yet" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-caption tabular-nums text-ink-muted">
                      {sessionsCompleted} of {SPACES_CATCHUP_COUNT}
                    </td>
                    <td className="px-4 py-3 text-caption text-ink-muted">
                      {upcomingDisplayNumber !== undefined ? (
                        `Session ${upcomingDisplayNumber}`
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-caption text-ink-muted">
                      {/* `date`/`time` are optional on a plan row: a coach can
                          have a session in the plan with no date set yet. Guard
                          on the field, not just on `upcoming`. */}
                      {upcoming?.date ? formatDate(upcoming.date) : <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 text-caption text-ink-muted">
                      {upcoming?.time ? formatTime(upcoming.time) : <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight aria-hidden="true" className="inline size-4 text-ink-faint" strokeWidth={2.25} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

/** Section heading + optional sub copy, shared by both stages. */
/* `SectionHeading` was deleted here (Round 40): the coach Home's own
   "Quick overview" was its last caller, and that row now needs a fixed 36px
   height to line up with the priorities header beside it — which this
   component, with its optional sub-copy slot, was the wrong shape for. */

/**
 * "Need help" (Round 40, direct instruction) — both coach stages, top-right of
 * the greeting row.
 *
 * 2026-10-01, direct instruction: restyled to match the **Consumer Portal's**
 * own Need help control (`ConsumerHomePage`) — the `destructive` red outline
 * pill, `MessageCircleQuestionMark` rather than `CircleHelp`, 48px, 24px radius,
 * `body-md`. Outline rather than filled for the same reason it is there: a solid
 * red block at this size reads as an error state, where the control is an offer
 * of help. `destructive` measures 4.80:1 on white, so the label clears AA.
 *
 * Nothing leaks either way — `destructive` and `text-body-md` are app-wide
 * tokens the Consumer Portal happens to share, not consumer-scale steps.
 *
 * Still **unlinked here** (direct instruction): there is no coach-facing help
 * destination, so it keeps this app's documented unwired treatment — focusable
 * and announced, never a silently dead button. Give it a route and this becomes
 * a `<Link>`. `InertButton` is imported from `MeetingsSection`, where it lives.
 */
function NeedHelpButton() {
  return (
    <InertButton
      label="Need help"
      appearance="active"
      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-3xl border border-destructive bg-white px-5 text-body-md text-destructive outline-none transition-all hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 active:scale-[0.97]"
    >
      <MessageCircleQuestionMark aria-hidden="true" className="size-6" strokeWidth={1.75} />
    </InertButton>
  )
}

const HOME_ART = '/illustrations/home'

/**
 * The banner's photo blob (`544:3013`) — the same torn-paper treatment as the
 * onboarding screens, but its own export: a `purple-50` outline instead of
 * `purple-400`, a white backing, and its own rotations (backing +2.35deg,
 * photo and outline both -1deg).
 *
 * Transcribed rather than derived. The onboarding cards earn their derivation
 * because three of them scale against each other and have to animate between
 * sizes; this is a single static instance, so the frame's numbers go in as-is.
 *
 * Responsiveness is a single `--blob-scale` variable rather than a second set of
 * numbers per breakpoint. Every layer here is absolutely positioned in the
 * frame's own pixel space (and one of them is a mask whose `mask-size` and
 * `mask-position` would have to be scaled in step), so re-authoring the
 * composition at tablet and mobile sizes would mean maintaining three copies of
 * eleven interdependent measurements. One `transform: scale()` on a
 * `origin-top-left` shell scales all of it, including the mask, for free; the
 * outer box carries the *scaled* size so the flow around it stays honest.
 */
/* Exported (Round 39) for the coach's session-debrief banner, which needs the
   identical art on the identical `yellow-200` ground at ~0.41 scale. Reusing it
   rather than transcribing frame `728:4986`'s own numbers is deliberate: that
   frame's mask (134.006x102.014 at 25.546,43.15) and outline (135.318x107.15)
   do NOT describe the same rect, which is the mask-vs-outline drift this
   project has shipped three times. The alignment is already solved here. */
export function BannerBlob({
  scaleClassName,
  rotateDeg = 0,
  backSheet = 'banner-back.svg',
}: {
  scaleClassName: string
  /** Extra whole-composition tilt, applied about the box's centre on top of the
   *  per-layer rotations below. The reflection frame (`607:8005`) wraps the
   *  identical art in `rotate(3deg)` where the other two use `rotate(-1deg)`, a
   *  flat +4deg on every layer — so it is one more turn of the same crank, not a
   *  third set of transcribed angles. */
  rotateDeg?: number
  /** The torn sheet behind the photo. White reads as paper on the purple ground;
   *  the reflection frame swaps in its own gold export because white would
   *  vanish against `yellow-200`. Real exported assets both — never recoloured
   *  by hand, since the two are different vector paths, not one path tinted. */
  backSheet?: string
}) {
  return (
    <div
      className={cn('relative shrink-0 self-center xl:self-start', scaleClassName)}
      style={{
        width: 'calc(404.97px * var(--blob-scale))',
        height: 'calc(306.43px * var(--blob-scale))',
      }}
    >
      <div
        className="absolute inset-0"
        style={rotateDeg ? { transform: `rotate(${rotateDeg}deg)` } : undefined}
      >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: 404.97, height: 306.43, transform: 'scale(var(--blob-scale))' }}
      >
      {/* Sheet, tilted the other way so it reads as paper behind paper. */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 0, top: 0, width: 364.481, height: 294.003 }}
      >
        <img
          src={`${HOME_ART}/${backSheet}`}
          alt=""
          aria-hidden="true"
          style={{ width: 353.325, height: 279.776, transform: 'rotate(2.35deg)' }}
        />
      </div>

      <div
        className="absolute flex items-center justify-center"
        style={{ left: 0.38, top: 15.76, width: 380.239, height: 286.645 }}
      >
        <div style={{ width: 375.407, height: 280.136, transform: 'rotate(-1deg)' }}>
          <div className="relative size-full">
            <div
              className="absolute"
              style={{
                left: -23.2,
                top: -91.67,
                width: 421.791,
                height: 632.609,
                maskImage: `url("${HOME_ART}/banner-mask.svg")`,
                // **Aligned to the outline**, not the frame's own mask numbers.
                // The mask and the outline are one torn path — a window and a
                // stroke — so they have to land on the same rect. The frame's
                // values (352.958x269.221 at 38.441,100.903) do not: the window
                // is 10.5px shorter than the 353.325x279.776 outline and pushed
                // 9px down, which showed as the photo overhanging the white
                // stroke top-left and bottom-left at full size.
                //
                // 36.185/91.511 is the outline's own top-left expressed in this
                // layer's frame: the outline sits at (15.7745, 18.822) and this
                // layer's rotated parent at (2.796, 19.0145), a delta of
                // (12.985, -0.159) once the shared -1deg is taken out, then
                // offset by this box's own (-23.2, -91.67).
                maskSize: '353.325px 279.776px',
                maskPosition: '36.185px 91.511px',
                maskRepeat: 'no-repeat',
                maskMode: 'alpha',
              }}
            >
              <img
                src="/illustrations/onboarding/photo.jpg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none size-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute flex items-center justify-center"
        style={{ left: 13.36, top: 15.76, width: 358.154, height: 285.9 }}
      >
        <img
          src={`${HOME_ART}/banner-outline.svg`}
          alt=""
          aria-hidden="true"
          style={{ width: 353.325, height: 279.776, transform: 'rotate(-1deg)' }}
        />
      </div>
      </div>
      </div>
    </div>
  )
}

/* The app's canonical primary-outline pill, inverted for the purple ground — a
   white fill with a `primary` label, the same pair the record-page hero CTAs
   use on their own purple band.
   **36px (Round 39, direct instruction: "make sure button height is consistent
   with other buttons, update trainee banners also").** This REVERSES Round 30's
   own direct instruction, which set trainee CTAs to 44px to match frames
   `544:3024`/`588:5780`. Recording the reversal rather than quietly restyling:
   the frames still draw 44, and the app now diverges from them here on purpose,
   2026-10-01, direct instruction: **44px, not 36px.** This comment used to
   argue the other way — that a banner CTA taller than every other button on the
   screen read as a different kind of control. On a full-bleed banner it read as
   undersized instead, so the banner CTA is now the trainee portal's own 44px
   height. 36px is a floor, not a cap.
   Full-bleed below `sm` (direct instruction): the pill drops its fixed width
   there rather than keeping it and centring the gap, because at 375px minus the
   shell's own padding a ~220px button leaves an odd sliver either side and
   reads as misaligned against the centred copy above it. */
const BANNER_CTA =
  'inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full border border-primary bg-white px-6 text-caption-medium text-primary outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring'

/**
 * The filled variant, for the reflection banners' "Add my reflections" (direct
 * instruction, 2026-10-02: *"add my reflection buttons update to primary
 * style"*).
 *
 * Deliberately a second constant rather than a change to `BANNER_CTA`: that one
 * still serves four other banner CTAs (the certification "Know more", the two
 * learning links), and repointing it would have restyled all of them.
 *
 * It is CLAUDE.md's canonical **primary filled** pill — `bg-primary` /
 * `text-white` / `hover:bg-primary-hover` / `text-caption-medium` — with two
 * values taken from `BANNER_CTA` instead of the canonical ones, so the two sit
 * in one family where a banner shows both: `h-11` rather than `h-9` (the
 * trainee frames' own height; the 36px rule is a floor, not a cap) and `px-6`
 * rather than `px-[18px]`.
 *
 * `border border-primary` is kept despite being invisible against the fill —
 * without it the content box is 2px wider than the outline variant's, so a
 * filled and an outline pill side by side would not match.
 *
 * White on `primary` `#3a00ad` measures 11.78:1; the pill against the banner's
 * own `yellow-200` is 4.35:1, well past the 3:1 a control boundary needs.
 */
const BANNER_CTA_PRIMARY =
  'inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full border border-primary bg-primary px-6 text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring'

/**
 * The one width every Home banner CTA takes at `xl`, replacing four different
 * per-call-site overrides (`xl:w-[216px]`, `xl:w-[232px]`, `xl:w-[152px]` and
 * `xl:w-auto`) that put five pills at five widths down one column of banners.
 *
 * **The reference is the reflection banner's own pill** (direct instruction),
 * sized to its *widest* label rather than the one on screen today: "Add my
 * reflections" measures 172.04px but the same control reads "Resume my
 * reflections" (197.96px) once a draft exists, so 172 would have overflowed its
 * own pill in a state the component already ships. 200 is the first round value
 * that clears it.
 *
 * `xl:` only — below that breakpoint `BANNER_CTA`'s `w-full` still applies and
 * the stacked banners keep their full-bleed pills.
 */
const BANNER_CTA_WIDTH = 'xl:w-[200px]'

const STAGE_ART = '/illustrations/stage'

/** The picture every blob-framed banner shared before the trainee image bank
 *  existed. Still the default `StageBlob` falls back to, so a caller that passes
 *  no `photo` renders exactly as it did. */
const DEFAULT_BLOB_PHOTO = '/illustrations/onboarding/photo.jpg'

/**
 * The stage banners' own photo blob (`637:10900` expect, `637:11298` notes) —
 * the same torn-paper photo as `BannerBlob`, plus a **sticker layer**: a check
 * badge, a yellow badge, a sparkle, and one variant-only extra (a star on the
 * purple ground, a cloud doodle on the yellow).
 *
 * A separate component rather than five more props on `BannerBlob`. That one
 * scales a *single* composition; this is a genuinely different one — seven
 * layers instead of three — and threading stickers through would have made the
 * shared component carry a feature only two of its five callers use.
 *
 * **What the two variants do share is the artwork**, and that is worth stating
 * because the Figma exports hide it: the outline and mask come back as
 * different files per variant, but their viewBoxes are the same shape at
 * different export sizes (aspect 1.26289 and 1.30197 in all three exports,
 * including `BannerBlob`'s), so they are one vector re-exported, not three
 * drawings. Same for the check/badge/sparkle stickers — identical paths *and*
 * fills, differing only in export size. So this commits one copy of each and
 * scales it. Only the back sheets are genuinely per-variant, because the fill
 * is baked into the file: `purple-500` behind the purple banner, `yellow-500`
 * behind the yellow one.
 *
 * Layout is Figma's own grid-with-margins flattened to absolute positioning,
 * which is what it means. Each variant is authored at its frame's own pixel
 * sizes; `--blob-scale` only handles responsiveness.
 */
interface Sticker {
  src: string
  x: number
  y: number
  w: number
  h: number
  rotate: number
}

interface StageBlobVariant {
  /** Whole-composition tilt. The frame hoists this onto the wrapper, so every
   *  layer's own rotation below is relative to it. */
  rotate: number
  /** Unrotated extent of the composition, i.e. `max(x + w)` over every layer. */
  width: number
  height: number
  back: string
  /** Back sheet: box, then the sheet inside it at its own counter-rotation. */
  sheet: { x: number; y: number; w: number; h: number; innerW: number; innerH: number }
  /** Photo: the container, and the oversized box inside it that the mask cuts a
   *  window into. The mask's own size and position are **derived from the
   *  outline** rather than transcribed — see `StageBlob`. */
  photo: {
    x: number
    y: number
    w: number
    h: number
    boxX: number
    boxY: number
    boxW: number
    boxH: number
  }
  outline: { x: number; y: number; w: number; h: number }
  stickers: Sticker[]
}

const STAGE_BLOBS: Record<'expect' | 'notes' | 'certified' | 'begin', StageBlobVariant> = {
  // `647:13311` — the certification card. The largest of the three (0.9166 of
  // the base artwork against expect's 0.436) and the only one carrying the
  // **rosette**, which is what makes it read as an award rather than a
  // decoration. Sticker positions here are the *image's* top-left, computed by
  // centring each image in the frame's own wrapper box, because at this size the
  // wrapper padding is 5-10px rather than the 2px it is on the small variants.
  certified: {
    rotate: 4.45,
    width: 365.58,
    height: 274.9,
    back: 'back-yellow.svg',
    sheet: { x: 3.23, y: 0, w: 338.259, h: 274.896, innerW: 323.845, innerH: 256.432 },
    photo: {
      x: 3.58,
      y: 14.45,
      w: 344.084,
      h: 256.763,
      boxX: -21.27,
      boxY: -84.02,
      boxW: 386.598,
      boxH: 579.826,
    },
    outline: { x: 15.48, y: 14.45, w: 323.845, h: 256.432 },
    stickers: [
      // **No tick here** (direct instruction). The frame stacks the rosette on
      // top of the check bubble, so the two occupy the same corner and the check
      // only ever showed as a white halo behind the ribbon. On the one card that
      // is *about* being awarded something, the badge should carry that corner
      // by itself.
      { src: 'rosette.svg', x: 285.83, y: 56.57, w: 52.217, h: 91.761, rotate: 2.58 },
      { src: 'badge.svg', x: 4.24, y: 210.38, w: 69.7, h: 61.546, rotate: -8.67 },
      { src: 'cloud.svg', x: 49.56, y: 6.48, w: 70.882, h: 51.067, rotate: 4.55 },
      { src: 'sparkle.svg', x: 274.89, y: 242.06, w: 29.434, h: 29.434, rotate: 4.55 },
    ],
  },

  /**
   * `544:3011` — the "Begin your training journey" hero, which gained stickers
   * in a later revision of that frame.
   *
   * **Its base geometry is `certified`'s, exactly.** Every sheet, photo and
   * outline number in the revised frame matches the certification card's to the
   * decimal, and three of its four stickers land on identical coordinates
   * (badge 4.24,210.38 · cloud 49.56,6.48 · sparkle 274.89,242.06). Spread from
   * `certified` rather than transcribed a second time, so the two cannot drift
   * apart if that geometry is ever corrected.
   *
   * Two things are **not** inherited, both caught by comparing against the
   * frame's own screenshot rather than trusting the spread:
   *
   * 1. **`back-purple.svg`.** `certified` sits on a yellow card and uses the
   *    yellow sheet; this banner is `primary` purple, where that sheet reads as
   *    a gold smudge. `expect` — the other purple surface — uses the same
   *    purple sheet.
   * 2. **`star-bubble.svg`**, where `certified` carries its rosette. This app's
   *    `star.svg` is a bare 20x21 star, not the bubble-with-a-star the frame
   *    draws, so the frame's own export is committed rather than substituting a
   *    glyph that is nearly right (CLAUDE.md: never hand-draw or approximate an
   *    icon). A rosette would be wrong here anyway — this is the start of the
   *    pathway, not the award at the end of it.
   */
  get begin(): StageBlobVariant {
    return {
      ...STAGE_BLOBS.certified,
      back: 'back-purple.svg',
      stickers: [
        // Wrapper box 89.64x81.895 at 281.17,48.73 -> image top-left, the same
        // centring the other `certified` stickers use.
        { src: 'star-bubble.svg', x: 286.41, y: 54.82, w: 79.165, h: 69.723, rotate: -9.55 },
        ...STAGE_BLOBS.certified.stickers.filter((s) => s.src !== 'rosette.svg'),
      ],
    }
  },
  // `637:10900` — the purple "what can you expect" ground.
  expect: {
    rotate: -4.55,
    width: 178.743,
    height: 133.006,
    back: 'back-purple.svg',
    sheet: { x: 1.53, y: 1.34, w: 160.892, h: 130.753, innerW: 154.036, innerH: 121.971 },
    photo: {
      x: 1.7,
      y: 8.21,
      w: 163.663,
      h: 122.128,
      boxX: -10.11,
      boxY: -39.97,
      boxW: 183.884,
      boxH: 275.792,
    },
    outline: { x: 7.36, y: 8.21, w: 154.036, h: 121.971 },
    stickers: [
      { src: 'check.svg', x: 145.65, y: 31.31, w: 29.226, h: 25.74, rotate: -9.55 },
      { src: 'badge.svg', x: 0, y: 99.07, w: 33.153, h: 29.274, rotate: -8.67 },
      { src: 'star.svg', x: 21.51, y: 0, w: 20, h: 21, rotate: 4.55 },
      { src: 'sparkle.svg', x: 130.22, y: 115.94, w: 14, h: 14, rotate: 4.55 },
    ],
  },
  // `637:11298` — the yellow "add notes" ground. Smaller (0.383 of the base
  // artwork against expect's 0.436) and tilted the other way.
  notes: {
    rotate: 4.45,
    width: 157.022,
    height: 115.672,
    back: 'back-yellow.svg',
    sheet: { x: 1.35, y: 0, w: 141.341, h: 114.865, innerW: 135.318, innerH: 107.15 },
    photo: {
      x: 1.5,
      y: 6.04,
      w: 143.775,
      h: 107.288,
      boxX: -8.89,
      boxY: -35.11,
      boxW: 161.54,
      boxH: 242.28,
    },
    outline: { x: 6.47, y: 6.04, w: 135.318, h: 107.15 },
    stickers: [
      { src: 'check.svg', x: 127.95, y: 26.33, w: 25.675, h: 22.612, rotate: -9.55 },
      { src: 'badge.svg', x: 0, y: 85.86, w: 29.124, h: 25.717, rotate: -8.67 },
      { src: 'cloud.svg', x: 19.91, y: 1.57, w: 29.618, h: 21.338, rotate: 4.55 },
      { src: 'sparkle.svg', x: 114.39, y: 100.68, w: 12.299, h: 12.299, rotate: 4.55 },
    ],
  },
}

/**
 * The rotated footprint of a variant's composition.
 *
 * Rotating the composition grows its footprint. Computed rather than
 * transcribed (the Round 30 rule) — `w·|cosθ| + h·|sinθ|` reproduces the frames'
 * own 188.727x146.762 and 165.525x127.505 to within 0.01px, so the box stays
 * honest if any of these numbers are ever revised.
 *
 * Lifted out of `StageBlob` so `sizeTo` can ask for a *second* variant's box
 * without duplicating the formula.
 */
function stageBlobBox(v: StageBlobVariant): { w: number; h: number } {
  const rad = (Math.abs(v.rotate) * Math.PI) / 180
  return {
    w: v.width * Math.cos(rad) + v.height * Math.sin(rad),
    h: v.width * Math.sin(rad) + v.height * Math.cos(rad),
  }
}

function StageBlob({
  variant,
  className,
  sizeTo,
  photo = DEFAULT_BLOB_PHOTO,
}: {
  variant: keyof typeof STAGE_BLOBS
  className?: string
  /**
   * Render this variant at **another variant's footprint**.
   *
   * The stage banners stack on one page, so their artwork reads as one family
   * and has to be one size — but `expect` and `notes` are authored at their own
   * frames' pixel sizes (178.743x133.006 against 157.022x115.672), which is a
   * visible ~23px difference at `--blob-scale:1` and, because the copy column
   * sits directly after the blob, the reason the two banners' text started at
   * different x positions.
   *
   * Derived, never a second transcribed scale: the factor is the ratio of the
   * two `stageBlobBox` widths, so correcting either variant's geometry keeps
   * them matched instead of silently reopening the gap. It multiplies
   * `--blob-scale` rather than replacing it, so a caller's responsive scales
   * stay the single place breakpoints are expressed.
   *
   * **Width is what is matched, and the heights land ~1.4px apart.** The two
   * compositions are not the same aspect (1.3439 against 1.3575 — the Figma
   * exports themselves differ by ~1%), so no single uniform factor can equalise
   * both without distorting the photo. Width is the one that aligns the copy
   * columns, which is what this is for.
   */
  sizeTo?: keyof typeof STAGE_BLOBS
  /**
   * Which picture fills the torn-paper window.
   *
   * Additive and optional on purpose: every banner shared one photo before the
   * trainee image bank existed, so a caller that passes nothing renders
   * byte-identically. **Only the image changes.** The mask and the outline are
   * still both derived from `v.outline` below, which is what stops a new photo
   * from showing outside the line meant to frame it — the §78.1 defect this
   * project has shipped three times. A per-stage picture is a different `src`,
   * not a different geometry.
   */
  photo?: string
}) {
  const v = STAGE_BLOBS[variant]
  const box = stageBlobBox(v)
  // 1 unless the caller asked to match another variant's footprint — see
  // `sizeTo`. Applied everywhere `--blob-scale` is, so it scales the whole
  // composition rather than only its reserved box.
  const match = sizeTo ? stageBlobBox(STAGE_BLOBS[sizeTo]).w / box.w : 1
  const boxW = box.w * match
  const boxH = box.h * match

  return (
    <div
      className={cn('relative shrink-0 [--blob-scale:1]', className)}
      style={{
        width: `calc(${boxW}px * var(--blob-scale))`,
        height: `calc(${boxH}px * var(--blob-scale))`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            width: `calc(${v.width * match}px * var(--blob-scale))`,
            height: `calc(${v.height * match}px * var(--blob-scale))`,
            transform: `rotate(${v.rotate}deg)`,
          }}
        >
          <div
            className="relative origin-top-left"
            style={{
              width: v.width,
              height: v.height,
              transform: `scale(calc(var(--blob-scale) * ${match}))`,
            }}
          >
            {/* Sheet, counter-tilted so it reads as paper behind paper. */}
            <div
              className="absolute flex items-center justify-center"
              style={{ left: v.sheet.x, top: v.sheet.y, width: v.sheet.w, height: v.sheet.h }}
            >
              <img
                src={`${STAGE_ART}/${v.back}`}
                alt=""
                aria-hidden="true"
                style={{
                  width: v.sheet.innerW,
                  height: v.sheet.innerH,
                  transform: 'rotate(3.35deg)',
                }}
              />
            </div>

            {/* **No `overflow-hidden` here**, deliberately. The mask is what
                shapes the photo, and its window reaches past this container on
                the right and bottom — 169.07 and 129.84 against a 163.663 x
                122.128 box for the expect variant. Clipping the container
                therefore slices the photo *inside* its own torn frame, along a
                straight edge that has nothing to do with the artwork. An earlier
                pass had it and that is exactly what it looked like. */}
            <div
              className="absolute"
              style={{ left: v.photo.x, top: v.photo.y, width: v.photo.w, height: v.photo.h }}
            >
              <div
                className="absolute"
                style={{
                  left: v.photo.boxX,
                  top: v.photo.boxY,
                  width: v.photo.boxW,
                  height: v.photo.boxH,
                  maskImage: `url("${HOME_ART}/banner-mask.svg")`,
                  // **Locked to the outline, not transcribed.** The mask and
                  // the outline are the same torn path — one as a window, one
                  // as a stroke — so they have to land on the same rect or the
                  // photo shows outside the line that is supposed to frame it.
                  // The frames' own mask numbers do not do that: expect's window
                  // is 158.996x123.028 starting at x 11.8, against an outline of
                  // 154.036x121.971 starting at 7.4, so the photo overhung the
                  // stroke by 9px on the right and 8px at the bottom. Deriving
                  // both from `outline` makes that class of drift impossible.
                  maskSize: `${v.outline.w}px ${v.outline.h}px`,
                  maskPosition: `${v.outline.x - v.photo.x - v.photo.boxX}px ${
                    v.outline.y - v.photo.y - v.photo.boxY
                  }px`,
                  maskRepeat: 'no-repeat',
                  maskMode: 'alpha',
                }}
              >
                <img
                  src={photo}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none size-full object-cover"
                />
              </div>
            </div>

            <img
              src={`${HOME_ART}/banner-outline.svg`}
              alt=""
              aria-hidden="true"
              className="absolute"
              style={{
                left: v.outline.x,
                top: v.outline.y,
                width: v.outline.w,
                height: v.outline.h,
              }}
            />

            {v.stickers.map((s) => (
              <img
                key={s.src}
                src={`${STAGE_ART}/${s.src}`}
                alt=""
                aria-hidden="true"
                className="absolute"
                style={{
                  left: s.x,
                  top: s.y,
                  width: s.w,
                  height: s.h,
                  transform: `rotate(${s.rotate}deg)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The stages whose Home card and banner have their own variant. Resolved by
 *  label rather than hardcoded, so reordering or inserting a stage cannot
 *  silently point one at the wrong column.
 *
 *  2026-10-01: `REFLECTION_STAGE_INDEX`, `REFLECTION_CTA_LABEL` and the shared
 *  `ReflectionPrompt` were deleted with the My Reflection stage (direct
 *  instruction). Nothing outside this file imported them. */
const LEARNING_BASICS_STAGE_INDEX = PATHWAY_STAGE_COPY.findIndex((s) => s.stage === 'Stage C:')
const OBSERVING_STAGE_INDEX = PATHWAY_STAGE_COPY.findIndex((s) => s.stage === 'Stage O:')
const FIRST_PLACEMENT_STAGE_INDEX = PATHWAY_STAGE_COPY.findIndex((s) => s.stage === 'Stage A:')
const COMMUNITY_FEEDBACK_STAGE_INDEX = PATHWAY_STAGE_COPY.findIndex((s) => s.stage === 'Stage CP:')
const SECOND_PLACEMENT_STAGE_INDEX = PATHWAY_STAGE_COPY.findIndex((s) => s.stage === 'Stage H:')

/**
 * The trainee portal's own stage photography (`public/illustrations/trainee`).
 *
 * Keyed by the rail's own `stage` eyebrow, never by position — the same reason
 * the four index constants above are resolved by label. A banner pointed at a
 * number would silently show another stage's picture the moment a stage is
 * reordered or inserted, and a wrong-but-plausible photo is exactly the kind of
 * drift nobody catches in a screenshot.
 */
const TRAINEE_ART = '/illustrations/trainee'

const STAGE_PHOTO_BY_STAGE: Record<string, string> = {
  'Stage C:': `${TRAINEE_ART}/stage-c.webp`,
  'Stage O:': `${TRAINEE_ART}/stage-o.webp`,
  'Stage A:': `${TRAINEE_ART}/stage-a.webp`,
  'Stage CP:': `${TRAINEE_ART}/stage-cp.webp`,
  'Stage H:': `${TRAINEE_ART}/stage-h.webp`,
}

/** The journey-start picture. Shared by the trainee "Begin your training
 *  journey" banner and the coach welcome banner, which is a direct instruction
 *  rather than a coincidence — the coach banner reuses the trainee banner's
 *  artwork unchanged, so the two read as one treatment. */
const BEGIN_PHOTO = `${TRAINEE_ART}/begin.webp`
const CERTIFIED_PHOTO = `${TRAINEE_ART}/certified.webp`

/** The photo for one rail stage. Falls back to the journey-start picture rather
 *  than rendering an empty window if a stage ever has none of its own. */
function stagePhoto(index: number): string {
  const stage = PATHWAY_STAGE_COPY[index]
  return (stage && STAGE_PHOTO_BY_STAGE[stage.stage]) || BEGIN_PHOTO
}

/**
 * Per-stage banner copy (`638:11947`, `638:11948`, `638:11949`). Keyed by the
 * rail's own stage index so the two cannot drift apart.
 *
 * `expect` is the frame's wording verbatim. One thing to flag rather than
 * quietly rewrite: **Stage 4's copy describes a community-of-practice session**
 * ("meet with other coaches to go over your feedback and refine your approach"),
 * not the hands-on assessment its own heading names. That reads like the wrong
 * paragraph pasted into the frame. It is left as authored — this is domain
 * content, not layout, and it is the research team's call, not mine.
 */
const STAGE_BANNER_COPY: Record<number, string> = {
  // Stage O absorbed both of the old numbered stages this copy used to be split
  // across (guided group practice, peer role-play), so it says both.
  1: 'You will join live sessions with a facilitator and other coaches, taking turns role-playing as the coach and as the client, using structured briefs that build in complexity across the sessions. Wait for your supervisor, they will be contacting you soon.',
  // Stage A is net new — dummy copy, written from the COACH brief for Placement 1.
  2: 'You will run your first coaching sessions with simulated clients while an observer sits in. Your clients, your peers and your observer will all give you feedback afterwards.',
  // Stage CP. Worth recording: this is the paragraph Round 30 shipped under
  // "Hands-on Assessment" and a code comment here flagged as the wrong one
  // pasted into the frame. It was never wrong — it describes a
  // community-of-practice session, which is the stage it now sits on.
  3: 'You will meet with other coaches to go over your feedback and refine your approach together.',
  // Round 32: Stage 6 had no banner because no frame was ever supplied for it,
  // which left the hero slot empty on the last stage of the rail.
  //
  // Worth knowing, because a first pass got it wrong: this stage is **still
  // training**. "Live Intervention" names the live *assessment* — an independent
  // session with simulated clients, watched in real time by an expert assessor —
  // not entry into SPACES delivery. The trainee is not a coach yet and has no
  // real clients, so nothing here may mention a caseload or a delivery portal.
  //
  // "simulated clients" resolves the collision between the terminology table's
  // fixed term "simulated consumer" and the audience rule that coach-facing
  // surfaces say "client" (direct instruction).
  4: 'You will run independent coaching sessions with simulated clients while an expert assesses your practical competency in real time. Wait to hear from your supervisor for next steps.',
}

/**
 * Which stages get the yellow banner once they are behind the trainee —
 * **C, O and H**, direct instruction.
 *
 * This replaces `STAGES_WITH_NOTES` (O, A, CP). The banner is no longer a
 * "write up how it went" notes prompt: it is a reflection the trainee has to
 * answer. A, CP and the certified state now show **no yellow banner at all**.
 *
 * The three are not an arbitrary subset — they are the three in-pathway
 * timepoints of the annotated SIPTEA guide, which CLAUDE.md has carried since
 * long before this change:
 *
 *   Stage C  Learning the basics        -> baseline  (after content learning)
 *   Stage O  Observing and practice ... -> midline   (after guided group practice)
 *   Stage H  Your second placement      -> endline   (after Placement 2)
 *
 * The fourth timepoint, post-practice, falls after the first real client
 * session, which is past this rail entirely — so it is correctly absent. Worth
 * recording, because it means a stage added to the rail does **not**
 * automatically earn a reflection: the set is a schedule, not a default.
 *
 * Stage C's own entry also finally gives `stage-c.webp` a render site — it was
 * generated in Round 51 and has sat dormant since, because the old notes prompt
 * skipped C on the grounds that it is modules rather than a session. A
 * reflection on what you learned does not need a session to have happened.
 *
 * Resolved by label rather than position, per the standing rule.
 */
/**
 * Where the **endline** reflection has got to — the Stage H one, the only
 * reflection on this rail that gates anything.
 *
 *   todo     -> the banner asks for it; certification column is inert.
 *   pending  -> sent, with the assessor. "Pending assessment" shows in the
 *               banner AND under the certification column.
 *   approved -> the assessor passed them. The reflection banner is replaced by
 *               the Congratulations banner and the column activates.
 *
 * Direct instruction, 2026-10-02: *"show congratulations banner + activate the
 * timeline after I have filled the banner (and it got approved by researcher)"*
 * and *"after I click label, hide banner and show congratulation banner"*.
 *
 * Stages C and O carry no state of their own: baseline and midline are
 * reflections the research team reads, not a pass/fail, so "pending assessment"
 * would be the wrong words on either. Placement 2 is the assessed one — the
 * expert assessor scores the SIPTEA competency checklist and the endline
 * reflection is shared with them for that decision — which is why the gate
 * lives here and nowhere else.
 */
type EndlineState = 'todo' | 'pending' | 'approved'

const STAGES_WITH_REFLECTION = new Set([
  LEARNING_BASICS_STAGE_INDEX,
  OBSERVING_STAGE_INDEX,
  SECOND_PLACEMENT_STAGE_INDEX,
])

/**
 * The greeting drops its orientation sub copy for a shorter "welcome back" pair
 * as soon as the coach is **past the very start** — either they have opened a
 * module, or they are on any stage other than the first (direct instruction).
 *
 * So the long "here's what this dashboard is" line survives exactly one
 * situation: Stage 1, nothing begun. Which is the only time it is telling the
 * coach something they do not already know.
 *
 * `resuming` comes from `resumableModule()`, the same read the banner below
 * switches on, so the greeting and the banner cannot contradict each other.
 */
function greetingFor(activeStage: number, resuming: boolean) {
  const started = resuming || activeStage !== 0
  return started
    ? {
        heading: `Welcome back, ${COACH_FIRST_NAME},`,
        sub: <>Ready to continue your training?</>,
      }
    : {
        heading: `Hello ${COACH_FIRST_NAME},`,
        // Round 32: the hard `<br>` that used to sit after "complete" (matching
        // frame `558:4319`) produced a *third* line once the column narrowed,
        // because the first half then wrapped on its own. The break is now done
        // by width instead — see `GREETING_SUB_MAX_W` at the render site — so it
        // stays two lines at every width the shell allows.
        sub: <>Welcome to the Care2Sleep training dashboard. Here, you can complete your modules, track your training progress, and join your meetings.</>,
      }
}

/**
 * `hero-banner_Stage N` (`638:11947` / `638:11948` / `638:11949`) — the "before"
 * banner: what this stage involves, shown while the coach is in it.
 *
 * 2026-10-01, direct instruction: **solid blue**, the same `primary` ground the
 * "Begin your training journey" banner directly above it already uses, replacing
 * the frame's `purple-300` fill and `purple-500` stroke. The stroke goes with
 * it — `purple-500` on `primary` reads as a halo, and neither of the portal's
 * two other `primary` banners carries one.
 *
 * Everything inside moves with the ground: copy inverts to white (`opacity-90`
 * on the secondary lines, as the blue banners do), and the CTA is already
 * `BANNER_CTA`'s white pill, which is the control those banners use.
 *
 * The artwork needs no new asset. `StageBlob`'s `expect` variant already draws
 * `back-purple.svg` behind the photo, which is the **same back sheet the
 * `begin` variant uses on this exact `primary` ground** — so the sheet, the
 * torn-paper outline and all four stickers are already the combination that is
 * known to read correctly on blue, rather than a purple-on-purple pairing that
 * only worked on the lighter fill.
 */
function StageExpectBanner({ index }: { index: number }) {
  const stage = PATHWAY_STAGES[index]
  if (!stage) return null

  return (
    <section
      // 2026-10-01, direct instruction: on a blue banner the CTA sits at the
      // **top right**, not vertically centred against the copy. `items-start`
      // on the row does that; the inner content row is already top-aligned, so
      // nothing else moves. The Begin banner is the stated exception and keeps
      // its CTA inline beneath the copy.
      // `border border-transparent` is a **layout** value, not a colour: the
      // reflection banner below carries a real 1px `yellow-400` stroke, so its
      // content box starts 1px further in than this one's did and the two copy
      // columns could never quite line up. The ground paints under a transparent
      // border (`background-clip: border-box`), so nothing changes on screen.
      //
      // `xl:gap-10` widens the space between the copy column and the CTA from
      // the stacked `gap-6` (direct instruction). Scoped to `xl` so the stacked
      // state keeps its 24px vertical rhythm.
      className="flex flex-col items-center gap-6 overflow-hidden rounded-lg border border-transparent bg-primary py-6 pl-4 pr-6 text-white shadow-card xl:flex-row xl:items-start xl:justify-between xl:gap-10"
      data-node-id="638:11947"
    >
      <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-6 xl:flex-row xl:items-start">
        <StageBlob
          variant="expect"
          photo={stagePhoto(index)}
          className="self-center [--blob-scale:0.36] sm:[--blob-scale:0.75] xl:[--blob-scale:1] xl:self-start"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-6 text-center xl:text-left">
          <div className="flex flex-col gap-1">
            <p className="text-sub-greeting leading-[1.4] opacity-90">You are now in:</p>
            {/* The frame writes "Stage 2 – Guided group practice"; this uses the
                rail's own label and a colon — the app removed em/en dashes from
                headings app-wide, and the rail is the thing this banner is
                describing, so the two should read identically. */}
            <p className="text-title opacity-90">
              {stage.stage.replace(':', '')}: {stage.label}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-body-md">What can you expect?</p>
            <p className="text-body leading-[1.4] opacity-90">{STAGE_BANNER_COPY[index]}</p>
          </div>
        </div>
      </div>
      {/* Unwired, same as the pathway card's own "Learn more" — there is no
          per-stage detail destination yet. */}
      <button
        type="button"
        aria-disabled="true"
        onClick={(e) => e.preventDefault()}
        className={cn(BANNER_CTA, BANNER_CTA_WIDTH, 'cursor-not-allowed')}
      >
        Learn more
        <span className="sr-only"> (coming soon)</span>
      </button>
    </section>
  )
}

/**
 * `hero-banner` (`647:13277`) — the certification state, shown once the coach
 * reaches the end of the pathway (frame `647:13009` puts it in this same Home
 * hero slot, with the rest of the page unchanged).
 *
 * `yellow-400` ground rather than the reflection banner's `yellow-200`: this is
 * the loudest moment in the portal and it should be the warmest surface in it.
 * The blob is the largest of the four on this page and is the only one carrying
 * the rosette.
 *
 * **The confetti fires here**, once, on arrival — see `Confetti`. It sits inside
 * the card's own `overflow-hidden`, so the burst is contained by the card rather
 * than spraying across the page.
 */
function CertificationBanner({ onDownloadCertificate }: { onDownloadCertificate: () => void }) {
  return (
    <section
      className="relative flex flex-col items-center gap-8 overflow-hidden rounded-lg border border-parchment bg-yellow-400 py-12 pl-6 pr-12 text-ink shadow-card xl:flex-row xl:items-center"
      data-node-id="647:13277"
    >
      <Confetti play />

      {/* Above the confetti, so pieces fall behind the photo and the copy. */}
      <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col items-center gap-8 xl:flex-row xl:items-center">
        <StageBlob variant="certified" photo={CERTIFIED_PHOTO} className="self-center" />
        <div className="flex min-w-0 flex-1 flex-col gap-8 px-4 text-center xl:text-left">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-display-md">Congratulations</h2>
            <p className="text-body leading-[1.4] opacity-90">
              You did it. You are now a certified sleep coach
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-body-md">What can you expect?</p>
            <p className="text-body leading-[1.4] opacity-90">
              You will be assigned clients to coach through their program, with a supervisor
              supporting you along the way. They will be in touch with more details soon.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-4 xl:flex-row xl:items-center">
            {/* Real download — the same committed certificate asset My profile's
                Study details card hands over, so the two cannot diverge. */}
            <button
              type="button"
              onClick={onDownloadCertificate}
              // `shrink-0` rather than `flex-1`: grown to fill the row it
              // measured 516px beside its own 200px sibling, which is the one
              // place the banners' CTA widths were still obviously unequal. It
              // is the only banner CTA that cannot take `BANNER_CTA_WIDTH` —
              // label plus the 24px award glyph needs ~226px and 200 would
              // truncate it — so it sits at its content width instead.
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* lucide, not the frame's exported glyph (CLAUDE.md). */}
              <Award aria-hidden="true" className="size-6" strokeWidth={1.75}  />
              Download my certificate
            </button>
            {/* Unwired — there is no "about SPACES delivery" destination yet. */}
            <button
              type="button"
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
              className={cn(
                'inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-primary bg-white px-[18px] text-caption-medium text-primary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                BANNER_CTA_WIDTH,
              )}
            >
              Know more
              <span className="sr-only"> (coming soon)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * `hero-banner_Stage N_notes` (`638:11875` / `638:11876` / `638:11877`) — the
 * "after" banner, **repurposed**: once a stage is behind the trainee, a prompt
 * to answer that stage's reflection.
 *
 * Direct instruction, 2026-10-02: *"re-use the yellow banner that we have added
 * for trainees to add notes, we no longer use them as notes -> these banners
 * will be reflection screens that user needs to answer."* So the chrome, the
 * blob, the ground and the geometry are all unchanged — only the purpose, the
 * copy, the CTA and the gate moved. Three things follow from that:
 *
 * 1. **No Dismiss.** Direct instruction: *"These reflections are necessary, so
 *    they will not have dismiss banners."* The control, the `dismissedNotes`
 *    state and its focus-return handler are all deleted rather than hidden — a
 *    banner that cannot be dismissed has nothing to return focus to, which also
 *    removes one instance of this project's most-repeated defect class rather
 *    than guarding it.
 * 2. **It no longer points at My Notes.** That page is free-text notes, which is
 *    exactly what these have stopped being, so deep-linking there would send a
 *    trainee somewhere that cannot take a reflection. There is no reflection
 *    screen yet, so the CTA is the app's standard unwired control — focusable,
 *    `aria-disabled`, with an `sr-only` cue — per CLAUDE.md, never a silently
 *    dead button and never omitted.
 * 3. Only C, O and H reach this component. See `STAGES_WITH_REFLECTION`.
 *
 * Same yellow ground as before. The off-by-one correction this comment used to
 * carry is **gone**: the app's ramp was renumbered onto Figma's own steps on
 * 2026-10-09, so the frame's `yellow/400` #FFCC4D and this app's `yellow-400`
 * are now the same name for the same colour. See `index.css`'s ramp note.
 */
function StageReflectionBanner({
  index,
  endline,
  onOpen,
  onApprove,
  resumable,
  timepoint,
  ctaRef,
}: {
  index: number
  /** `null` on every stage but H — see `EndlineState`. */
  endline: EndlineState | null
  onOpen: () => void
  onApprove: () => void
  /** A part-finished reflection is in the store, so the CTA offers to resume
   *  rather than to start. Direct instruction: *"add resume state also to the
   *  banner"*. */
  resumable: boolean
  /** Focus target when the wizard closes without submitting. The modal's own
   *  Cancel unmounts with its panel, so `ConfirmDialog`'s focus-restore has
   *  nothing to return to and focus lands on `<body>` — measured, not assumed.
   *  This CTA is where the trainee came from and where Resume now lives. */
  ctaRef?: React.RefObject<HTMLButtonElement | null>
  /** `null` only if a stage reaches this component with no reflection set —
   *  which `STAGES_WITH_REFLECTION` prevents, but the CTA degrades to inert
   *  rather than opening an empty wizard. */
  timepoint: ReflectionTimepoint | null
}) {
  const stage = PATHWAY_STAGES[index]
  if (!stage) return null
  const submitted = endline === 'pending'

  return (
    <section
      // `xl:gap-10`: the same widened copy-to-CTA space the expect banner above
      // takes, so the two read as one column (direct instruction).
      className="flex flex-col items-center gap-6 overflow-hidden rounded-lg border border-yellow-400 bg-yellow-200 py-4 pl-4 pr-6 text-purple-950 shadow-card xl:flex-row xl:items-center xl:justify-between xl:gap-10"
      data-node-id="638:11876"
    >
      <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-6 xl:flex-row xl:items-center">
        {/* `sizeTo="expect"` — same artwork, rendered at the expect banner's
            footprint so the two stacked banners' blobs, and therefore the copy
            columns after them, match. The responsive scales below are
            deliberately identical to that banner's; the match factor is derived
            rather than folded into them. */}
        <StageBlob
          variant="notes"
          sizeTo="expect"
          photo={stagePhoto(index)}
          className="self-center [--blob-scale:0.36] sm:[--blob-scale:0.75] xl:[--blob-scale:1] xl:self-start"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-center xl:text-left">
          {/* Derived from the rail's own label, so the banner and the timeline
              cannot name a stage differently. `shortStageLabel` drops Stage H's
              trailing "(hands-on assessment)" — a parenthetical reads as an
              aside in a column heading and as a stumble in a question. */}
          <p className="text-title">
            {submitted
              ? 'Your reflection has been shared'
              : `How did ${midSentence(shortStageLabel(stage.label))} go?`}
          </p>
          {/* States that the reflection is expected without claiming the app
              enforces it. Nothing here gates stage progress today, and copy
              that promises a block the product does not implement is the kind
              of sentence this project has had to retract before.

              The submitted line names the assessor rather than "the team":
              Placement 2 is assessed by an expert assessor against the SIPTEA
              competency checklist, and the endline reflection is shared with
              them for exactly that decision. */}
          <p className="text-body leading-[1.4] opacity-90">
            {submitted
              ? 'Your assessor is reviewing your second placement. You will hear from them once it has been assessed.'
              : 'Answer a few questions about how this stage went. This reflection is a required part of your training.'}
          </p>
          {/* Direct instruction: in the banner the label sits **below the sub
              copy**, prefixed "Status:", rather than in the CTA slot opposite.
              It belongs with the sentence it qualifies — on the right it read as
              an action in the place the button had just vacated, which is the
              one thing a status is not. The rail's own copy keeps the bare chip:
              there it sits under a column whose heading already supplies the
              subject, so a second label would be noise.

              `mt-2` rather than the stack's `gap-1`: heading and sub copy are
              one block at 4px, and the status is a separate statement about it. */}
          {submitted && (
            <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-body xl:justify-start">
              Status:
              <PendingAssessmentStatus onApprove={onApprove} />
            </p>
          )}
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-col items-center gap-2 xl:w-auto xl:flex-row">
        {submitted ? null : timepoint ? (
          /* Opens the real wizard at this stage's own timepoint. The label
             switches to Resume once a draft exists — same control, same
             destination, so the trainee is not hunting for a second button. */
          <button
            ref={ctaRef}
            type="button"
            onClick={onOpen}
            className={cn(BANNER_CTA_PRIMARY, BANNER_CTA_WIDTH)}
          >
            {resumable ? 'Resume my reflections' : 'Add my reflections'}
          </button>
        ) : (
          /* A stage with no question set — today unreachable, since
             `STAGES_WITH_REFLECTION` and `TIMEPOINT_BY_STAGE` name the same
             three. Kept as the app's standard unwired control rather than an
             omission, so adding a stage to one list and not the other shows up
             on screen instead of silently rendering a button that opens an
             empty wizard. */
          <button
            type="button"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
            className={cn(BANNER_CTA_PRIMARY, BANNER_CTA_WIDTH, 'cursor-not-allowed')}
          >
            Add my reflections
            <span className="sr-only"> (coming soon)</span>
          </button>
        )}
      </div>
    </section>
  )
}

/**
 * "Pending assessment" — the endline's own status indicator, in the banner and
 * under the pathway's certification column.
 *
 * **A one-off, deliberately not the shared `<Chip>`** (direct instruction:
 * *"lets not treat it as a label inside the banner, make this one off component
 * and fix boundary issue"*). Two reasons it earns its own component rather than
 * an eighth tone or a `className` escape hatch on `Chip`:
 *
 * 1. **It is a control, and `Chip` is not.** Every other chip in this app is a
 *    `<span>` stating a fact. This one is pressed, so it needs a real hit area,
 *    a focus ring and an accessible description of what pressing it does — none
 *    of which belong on a component whose whole job is to be inert.
 * 2. **`Chip`'s boundary could not be fixed from outside.** Its tones are 8%
 *    fills with 20% borders, measured as *pairs* against a white card. On the
 *    banner's `yellow-200` the fill measured **1.27:1** and the border
 *    **1.40:1** — both under the 3:1 WCAG asks of a control's boundary, and the
 *    border is the half that cannot be rescued by an opaque fill. Widening
 *    `Chip` to let a call site override its border would have let any surface
 *    break the contrast pairing the component exists to guarantee.
 *
 * So the boundary is fixed by construction instead: an **opaque** `destructive`
 * border, not a 20% one. Measured on both grounds it appears on —
 * **4.25:1** against the banner's `yellow-200`, **5.38:1** against the rail's
 * white card — clearing 3:1 either way. The white fill keeps the red text off
 * whatever is behind it (**5.38:1**, the figure `ResearchPrioritiesSection`
 * already relies on).
 *
 * The dot this carried briefly is **removed** (direct instruction). The opaque
 * border is what does the work anyway — it is the measured fix for the boundary,
 * and the dot was only ever reinforcing it.
 *
 * **36px tall, so the hit area is intrinsic.** The earlier `Chip` version was
 * 27px and needed `min-h-9` plus a cancelling negative margin to reach this
 * app's floor. Sizing the control correctly in the first place removes the
 * hack, and 14/500 `caption-medium` is more legible than `Chip`'s 12/600.
 *
 * **Clicking it is a demo affordance, not product chrome.** In the real product
 * a trainee can no more approve their own certification than mark their own
 * assessment — that write path belongs to the expert assessor on the Research
 * Dashboard. Same category as `CoachStageSwitcher`: delete it when a real write
 * path lands rather than repurposing it.
 */
function PendingAssessmentStatus({ onApprove }: { onApprove: () => void }) {
  return (
    <button
      type="button"
      onClick={onApprove}
      className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border border-destructive bg-white px-4 text-caption-medium whitespace-nowrap text-destructive outline-none transition-colors hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-ring"
    >
      Pending assessment
      {/* The visible text is a status, so the control has to say what pressing
          it does. Plain wording because it is a demo action, not a feature. */}
      <span className="sr-only"> (demo: mark as approved by the assessor)</span>
    </button>
  )
}

/** Drops a trailing parenthetical from a stage label for mid-sentence use:
 *  "Your second placement (hands-on assessment)" -> "Your second placement".
 *  Derived rather than a second hardcoded short name, so it cannot drift from
 *  the rail the way a parallel copy list would. */
function shortStageLabel(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, '')
}

/**
 * `hero-banner` — a `primary` card carrying the photo blob and a single outline
 * CTA, in one of **two states**:
 *
 * - `544:3011` "Begin your training journey", when the coach has not opened a
 *   module yet: the full-size blob, two-line pitch, and a link into My Learning.
 * - `588:5767` "Resume where you left", the moment they are part-way through
 *   one: a **much smaller** blob, the module's own name, and a CTA that returns
 *   them to the exact step they stopped at.
 *
 * A third state — "Share your reflection", on the old My Reflection stage —
 * was deleted on 2026-10-01 with the stage itself (direct instruction).
 *
 * The switch is derived, never a flag — `resumableModule()` reads the same live
 * progress the module cards read, so the banner cannot claim a module is under
 * way while its card disagrees.
 *
 * The two frames differ in blob size and padding but share their responsive
 * rules (direct instruction). Below `xl` the columns stack: blob (and its copy)
 * first, then the CTA. `xl` is the breakpoint rather than `lg` because the
 * shell's own grid is what constrains this, not the viewport — at 1024px the
 * content column is ~704px, and the intro frame's 405px blob plus the gaps
 * leaves the copy ~250px, which is where the title starts wrapping one word per
 * line. Below `sm` the stack also centres.
 */
function TrainingBanner() {
  const resuming = resumableModule()

  if (resuming) {
    return (
      <section
        // `py-4 pl-4 pr-6` and a 165px height, both the frame's own: this state
        // is shorter than the intro purely because the blob is, and the frame
        // tightens the padding to match rather than leaving it floating in the
        // taller box.
        className="flex flex-col items-center gap-6 overflow-hidden rounded-lg bg-primary py-4 pl-4 pr-6 xl:flex-row xl:items-start xl:gap-12"
        data-node-id="588:5767"
      >
        <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-3 xl:flex-row xl:items-center">
          {/* 0.436, not a second set of transcribed numbers. Every measurement
              in the frame's smaller blob — mask size 153.876x117.369 against
              352.958x269.221, its mask position, and all three layer offsets —
              is the intro blob's own value at that exact ratio, so this is
              literally the same composition scaled, and the `--blob-scale`
              shell already reproduces it. Held constant across breakpoints: at
              166x134 it is already smaller than the intro blob's *mobile* size,
              so shrinking it further would leave a thumbnail. */}
          <BannerBlob scaleClassName="[--blob-scale:0.32] sm:[--blob-scale:0.436]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-center text-white xl:text-left">
            <h2 className="font-display text-display-md">Resume where you left</h2>
            <p className="truncate text-body leading-[1.4] opacity-90">
              You were learning: {resuming.title}
            </p>
          </div>
        </div>
        {/* Straight into the player, not the overview — "Resume learning" means
            the step they stopped on, which is what the player restores. `from`
            carries the *timeline* module id so Exit returns to that module's own
            overview, not the redirected content module's (the same reason
            `ModuleOverviewPage` passes it). */}
        <Link
          to={`/training-v2/module/${realPlayerContentId(resuming.id)}/play?from=${resuming.id}`}
          className={cn(BANNER_CTA, BANNER_CTA_WIDTH)}
        >
          Resume learning
        </Link>
      </section>
    )
  }

  return (
    <section
      className="flex flex-col items-center gap-6 overflow-hidden rounded-lg bg-primary px-6 py-6 xl:flex-row xl:items-center"
      data-node-id="544:3011"
    >
      {/* `544:3011` gained stickers in a later revision, so this is `StageBlob`
          rather than the plain `BannerBlob` it used to be. */}
      <StageBlob
        variant="begin"
        photo={BEGIN_PHOTO}
        className="self-center [--blob-scale:0.36] sm:[--blob-scale:0.7] xl:[--blob-scale:1]"
      />
      <div className="flex w-full min-w-0 flex-1 flex-col justify-center gap-6 xl:gap-8 xl:px-4">
        <div className="flex flex-col gap-2 text-center text-white xl:text-left">
          <h2 className="font-display text-display-md">Begin your training journey</h2>
          <p className="text-body leading-[1.4] opacity-90">
            View your modules using the button below, or find them anytime in{' '}
            <span className="font-bold">My Learning</span> tab from the side menu.
          </p>
        </div>
        <Link to="/delivery/learning" className={cn(BANNER_CTA, BANNER_CTA_WIDTH)}>
          Go to My Learning
        </Link>
      </div>
    </section>
  )
}

/**
 * `Pathway` (`588:7432`, re-fetched after the frame was revised) — the COACH
 * pathway as a horizontal rail.
 *
 * The revision grew this from 5 columns to **7** (6 stages + certification) and
 * renamed most of them, so the timeline is now 1379px inside a 959px card and
 * **has to scroll horizontally**. That makes it a keyboard-reachable scroll
 * region: `tabIndex={0}` on a labelled `role="region"`, the fix Round 20 had to
 * make for the sleep-diary grid, which was a real WCAG 2.1.1 failure because a
 * wide scroller with no focusable content cannot be reached by keyboard at all.
 *
 * Icons are lucide, never the frame's exported SVGs (CLAUDE.md), and each names
 * what its stage actually is rather than taking a generic glyph:
 *
 * - C `BookOpen` — self-directed modules.
 * - O `Users` — a group: the guided practice sessions and the peer role-plays
 *   this stage absorbed are both other-people-in-the-room.
 * - A `HeartHandshake` — a first placement is coaching a client. Deliberately
 *   not `Video`, which is the "Join Zoom" glyph further down this same page and
 *   would mean both "a stage of your training" and "a button that opens a call"
 *   on one screen.
 * - CP `MessagesSquare` — community of practice is a conversation between
 *   peers, which is the one place in this rail a speech bubble is literal.
 * - H `ClipboardCheck` — the assessed second placement.
 */
interface PathwayStage {
  icon: LucideIcon
  stage: string
  label: string
}

/** Stage names and count come from `data/coachPathway`, which the onboarding
 *  flow also reads — it states how many stages there are, and an import back to
 *  this page would close a cycle through `DeliveryShell`. Icons stay here
 *  because they are presentation, not copy; they are zipped onto the shared
 *  list by index so a stage can never render another stage's glyph. */
const STAGE_ICONS = [BookOpen, Users, HeartHandshake, MessagesSquare, ClipboardCheck]

const PATHWAY_STAGES: PathwayStage[] = PATHWAY_STAGE_COPY.map((s, i) => ({
  ...s,
  icon: STAGE_ICONS[i],
}))

/**
 * A stage label used **mid-sentence**.
 *
 * The rail's labels are written as standalone titles ("Observing and practice
 * with peers"), so dropping one into a sentence produced "How did Observing and
 * practice with peers go?" — a capital letter stranded mid-clause. These are
 * descriptive phrases, not proper nouns, so they lower-case cleanly.
 *
 * Only the first character changes: "SIPTEA" or any other internal capital in a
 * future label survives untouched.
 */
function midSentence(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1)
}

const STAGE_COUNT_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'] as const

/**
 * Timeline geometry, **derived** so the rule and the dots cannot drift apart.
 *
 * The frame set each stage column at 155.67px with a fixed 205px certification
 * column and 40px (`gap-10`) between every pair. Those three numbers are the
 * frame's; the overall width falls out of them, which is what keeps the rail
 * correct now that the stage count has moved from six to five. Round 30's
 * hardcoded 1379 would have left ~156px of trailing slack.
 */
const STAGE_COL_W = 155.67
const CERT_COL_W = 205
const TIMELINE_GAP = 40
const STAGE_N = PATHWAY_STAGE_COPY.length
const TIMELINE_W = STAGE_N * STAGE_COL_W + CERT_COL_W + STAGE_N * TIMELINE_GAP

/** The connector runs between the **centres** of the first and last markers.
 *  Round 30 transcribed left/width off the frame and they were already ~13px
 *  adrift of the first dot's centre; computing both means they cannot be. */
const RULE_LEFT = STAGE_COL_W / 2
const RULE_W = TIMELINE_W - RULE_LEFT - CERT_COL_W / 2

function TrainingPathway({
  activeStage,
  onSelectStage,
  headingRef,
  endline,
  onApprove,
}: {
  activeStage: number
  onSelectStage: (index: number) => void
  /** Drives the certification column: it only reads "reached" once the
   *  assessor has passed them. See `EndlineState`. */
  endline: EndlineState
  onApprove: () => void
  /** Focus target when a banner above unmounts. `tabIndex={-1}` makes the
   *  heading programmatically focusable without adding a tab stop — the same
   *  heading-focus pattern `PasswordChangeCard` established. */
  headingRef?: React.Ref<HTMLHeadingElement>
}) {
  return (
    <Card className="gap-4 overflow-hidden py-0" data-node-id="588:7432" data-tour="training-pathway">
      <div className="flex items-center justify-between gap-6 bg-purple-50 p-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-title text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Your training journey
          </h2>
          {/* Counted off the rail itself, not written down. The frame says "all
              five stages" above a timeline that draws six, and a hardcoded word
              is exactly how that drifted — this is the same
              two-surfaces-one-fact trap CLAUDE.md keeps flagging, in copy. */}
          <p className="text-body leading-[1.4] text-ink-muted">
            Complete all {STAGE_COUNT_WORD[PATHWAY_STAGES.length] ?? PATHWAY_STAGES.length} stages
            to become a certified coach.
          </p>
        </div>
        {/* Unwired: there is no "about the pathway" destination yet. Per
            CLAUDE.md this renders as a focusable `aria-disabled` control with an
            `sr-only` reason rather than a silently dead button — a button that
            takes focus and then does nothing, with no explanation, is the
            failure mode that rule exists to prevent. Give it a route and this
            becomes a `<Link>`. */}
        <button
          type="button"
          aria-disabled="true"
          onClick={(e) => e.preventDefault()}
          className="inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-primary bg-transparent px-[18px] text-caption-medium text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Learn more
          <span className="sr-only"> (coming soon)</span>
        </button>
      </div>

      <div
        className="overflow-x-auto"
        role="region"
        aria-label="Your training journey timeline"
        tabIndex={0}
      >
        <div className="flex w-max flex-col gap-2 pt-4 pr-12 pb-6 pl-12">
          <div className="flex items-center gap-10" style={{ width: TIMELINE_W }}>
            {/* 2026-10-01, direct instruction: blue for where you are, the
                green semantic for what is done, grey for what is ahead. The
                icon row and the dot row below it switch on the same three
                states, so a column cannot say "done" in one row and "current"
                in the other. */}
            {PATHWAY_STAGES.map((s, i) => (
              <div key={s.label} className="flex h-9 min-w-0 flex-1 items-center justify-center">
                <s.icon
                  aria-hidden="true"
                  className={cn(
                    'size-7',
                    i < activeStage
                      ? 'text-success'
                      : i === activeStage
                        ? 'text-primary'
                        : 'text-ink-faint',
                  )}
                  strokeWidth={1.5}
                />
              </div>
            ))}
            <div
              className="flex h-9 shrink-0 items-center justify-center"
              style={{ width: CERT_COL_W }}
            >
              <Award
                aria-hidden="true"
                className={cn(
                  'size-6',
                  activeStage >= PATHWAY_STAGES.length ? 'text-primary' : 'text-ink-faint',
                )}
                strokeWidth={1.75}
              />
            </div>
          </div>

          <div className="relative flex items-start gap-10" style={{ width: TIMELINE_W }}>
            {/* The rule is a **gradient**, not a flat tint: the brand blue at
                the left fading to `hairline` by the right, so the run of
                pathway already behind the trainee reads warmer than what is
                still ahead. 1.5px, centred on the 36px dot; left and width are
                derived from the column widths above, not transcribed.
                2026-10-01, direct instruction: `purple-500` -> `primary`. */}
            <div
              aria-hidden="true"
              className="absolute top-[17.25px] h-[1.5px] rounded-full"
              style={{
                left: RULE_LEFT,
                width: RULE_W,
                backgroundImage:
                  'linear-gradient(to right, var(--primary), var(--color-hairline))',
              }}
            />

            {PATHWAY_STAGES.map((s, i) => {
              const isActive = i === activeStage
              const isDone = i < activeStage
              return (
                <div
                  key={s.label}
                  className="relative flex min-w-0 flex-1 flex-col items-center gap-5"
                >
                  <PathwayDot active={isActive} done={isDone} />
                  {/* A demo control, in the same category as `CoachStageSwitcher`
                      — it moves the "you are here" marker so the reflection
                      banner state can be reviewed without a real stage-completion
                      write path. Delete it if one ever lands; do not repurpose it
                      into stage navigation, which is not what a coach does here.
                      A real `<button>` rather than a click handler on a `<div>`,
                      so it is keyboard-reachable and announces its state. */}
                  <button
                    type="button"
                    onClick={() => onSelectStage(i)}
                    aria-current={isActive ? 'step' : undefined}
                    className="flex w-full cursor-pointer flex-col items-center gap-6 rounded-sm text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex w-full flex-col items-center gap-1.5">
                      {/* The "Stage C:" eyebrow keeps its size and colour
                          unchanged (direct instruction) — only the title
                          beneath it moves. */}
                      <span className="text-caption-medium leading-4 text-ink-faint">{s.stage}</span>
                      {/* 2026-10-01, direct instruction: a stage title is black
                          unless the stage is still ahead of the trainee, in
                          which case it stays grey. The current stage is the one
                          exception — blue and bold, because it is also what the
                          "You are here" pill below marks.
                          `min-h` rather than a fixed `h-10`: the H label runs to
                          three lines at this column width, and a hard height
                          clipped it. */}
                      <span
                        className={cn(
                          'min-h-10',
                          isActive
                            // Was `text-[18px] font-bold`; no 18/Bold style
                            // exists, so this is `sub-greeting` (18/500).
                            ? 'text-sub-greeting text-primary'
                            : isDone
                              ? 'text-body-md text-ink'
                              : 'text-body-md text-ink-faint',
                        )}
                      >
                        {s.label}
                      </span>
                    </span>
                    {/* Only the current stage carries a pill. Completed stages
                        get no label at all (direct instruction) — the filled dot
                        and purple icon already say it, and a second "Completed"
                        chip on four columns would out-shout the one marker that
                        matters. The frame draws its own 23px pill; the shared
                        chip wins per CLAUDE.md (a fourth chip geometry is worse
                        than a size mismatch), on its `next` tone. */}
                    {isActive && <Chip tone="next" label="You are here" />}
                  </button>
                </div>
              )
            })}

            {/* Certification is a selectable stage too (direct instruction) —
                it is what reaches the "Congratulations" banner. Its index is one
                past the six stages, so `activeStage === PATHWAY_STAGES.length`
                means certified and every stage before it reads complete. */}
            <div
              className="relative flex shrink-0 flex-col items-center gap-5"
              style={{ width: CERT_COL_W }}
            >
              {/* 2026-10-02, direct instruction: the column **activates on the
                  assessor's approval, not on arrival**. Reaching the end of the
                  rail is not the same as passing, and lighting this up the
                  moment the trainee clicks it claimed a certification the
                  assessor had not given. So the active treatment is keyed on
                  `endline === 'approved'`, while `aria-current` stays keyed on
                  `activeStage` — that attribute answers "where am I?", which is
                  a different question from "have I passed?". */}
              <PathwayDot active={endline === 'approved'} />
              <button
                type="button"
                onClick={() => onSelectStage(PATHWAY_STAGES.length)}
                aria-current={activeStage === PATHWAY_STAGES.length ? 'step' : undefined}
                className={cn(
                  'w-full cursor-pointer rounded-sm text-center text-body-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  endline === 'approved'
                    // Was 16/Bold; no 16/Bold style exists, so `body-md` (16/600).
                    ? 'text-body-md text-primary'
                    : 'text-ink-faint',
                )}
              >
                Congratulations!
                <br />
                You are now a certified
                <br />
                Sleep Coach!
              </button>
              {/* Sits under the column, in the slot the stage columns give
                  their "You are here" pill, so the rail keeps one label row. */}
              {endline === 'pending' && <PendingAssessmentStatus onApprove={onApprove} />}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Pathway marker, transcribed from the frame's own `active-dot-outer` export
 * rather than eyeballed — the first pass read the active state as a flat halo
 * ring and lost the glow entirely.
 *
 * The asset is a 36px disc carrying an SVG drop-shadow filter: `feMorphology
 * erode 6` -> a -6px spread, `feOffset dy 6`, `feGaussianBlur stdDeviation 8`
 * -> a 16px CSS blur (blur is 2x the standard deviation), at 20% alpha.
 *
 * 2026-10-01, direct instruction: the halo and core are the brand blue, and a
 * **completed** stage takes the `success` green instead. The halo stays unique
 * to the current stage, so "here" and "done" never look the same.
 *
 * Both states share a **3px white ring** around the core (the export's
 * `stroke="white" stroke-width="3"` on a r=10.5 circle, so 18px of colour
 * inside a 24px outer edge). It is invisible against the card, but it is what
 * breaks the connector line where it passes behind each dot — without it the
 * rule runs straight into the marker.
 */
function PathwayDot({ active, done = false }: { active: boolean; done?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full',
        active && 'bg-purple-200 shadow-[0_6px_16px_-6px_rgba(58,0,173,0.2)]',
      )}
    >
      {/* A completed stage takes the `success` green and no halo — the halo is
          what says "you are here", so it has to stay unique to one column
          (2026-10-01, direct instruction: blue for current, green semantic for
          complete). The frame has no completed state to transcribe, so this is
          built from its two existing dot states rather than invented as a third.
          On top of that, a **tick inside the circle** (direct instruction),
          which is what separates "done" from "here" at a glance now that both
          are the same purple — the halo alone was carrying that distinction.
          A completed dot is 28px against the other states' 24px (direct
          instruction: subtly larger), which is the room the tick needs as much
          as it is emphasis — the 3px white ring eats 6px, so 24px left only
          18px of fill and the check had to sit small inside it. Growing the core
          costs no layout: every dot is centred in the same 36px box, so the
          extra 4px comes out of that box's own slack and the rail does not
          shift. Still under 36px, so the ring keeps breaking the connector line
          the way the frame's own markers do. */}
      <span
        className={cn(
          'flex items-center justify-center rounded-full border-[3px] border-white',
          'size-6',
          done ? 'bg-success' : active ? 'bg-primary' : 'bg-hairline',
        )}
      >
        {done && <Check className="size-4 text-white" strokeWidth={2.25}  />}
      </span>
    </span>
  )
}

/**
 * The left-hand card on trainee Home, as a shell.
 *
 * **The container is deliberately constant across every stage** (direct
 * instruction): same `Card`, same 120px `purple-50` header, same title and
 * subtitle treatment. Only the title, the sub copy and the body change from
 * stage to stage — so a new stage variant supplies those three things and
 * nothing else, and cannot accidentally drift the chrome.
 *
 * `data-tour="learning-progress"` lives here rather than on a variant because
 * the first-run tour points a step at this slot. If it sat on one variant, the
 * tour would break the moment another stage rendered — and a missing anchor
 * fails silently.
 */
function HomeStageCard({
  title,
  subtitle,
  nodeId,
  children,
}: {
  title: string
  subtitle: string
  nodeId: string
  children: React.ReactNode
}) {
  return (
    <Card
      // No `min-h`: the row stretches both columns to the taller of the two
      // (see the `xl:items-stretch` on their wrapper), so the stage card and the
      // meeting card always share an edge and the CTA always lands at the
      // bottom, with no number to keep in sync.
      //
      // A fixed 492px floor (Stage 1's own height) was tried first and left
      // Stage 5 — the shortest at 361px natural — with 131px of dead space.
      // Measured naturals: 492 / 542 / 488 / 412 / 361 / 412, meeting card 412.
      className="w-full gap-4 overflow-hidden py-0 pb-2 xl:w-[524px] xl:shrink-0"
      data-node-id={nodeId}
      data-tour="learning-progress"
    >
      {/* The updated frame `676:2188` adds a "Stage N:" eyebrow above the title.
          Deliberately **not** built (direct instruction): the pathway rail sits
          directly above this card and already names the current stage, so the
          eyebrow restates it a few hundred pixels later. The title alone carries
          the change from stage to stage. */}
      <div className="flex h-[120px] flex-col gap-1 bg-purple-50 p-6">
        <h2 className="font-display text-title text-ink">{title}</h2>
        <p className="text-body leading-[1.4] text-ink-muted">{subtitle}</p>
      </div>
      {children}
    </Card>
  )
}

/** `my-lessons-card` (`542:1644`) — progress bar, three stat tiles, one CTA.
 *  The Stage 1 (Content learning) body. */
function LearningProgressCard() {
  const total = PATHWAY_MODULES.length
  const done = completedModulesCount
  const pct = Math.round((done / total) * 100)

  return (
    <HomeStageCard
      nodeId="542:1644"
      title="My learning progress"
      subtitle="You're doing great! Here's where you're at"
    >
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 px-6 py-4">
          <p className="text-body-md text-ink">Course curriculum progress:</p>
          <div className="flex items-center gap-6">
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-hairline">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="shrink-0 font-display text-title text-ink">{pct}% complete</p>
          </div>
        </div>

        <div className="px-6">
          <div className="h-px bg-hairline" />
        </div>

        <div className="flex flex-col gap-3 px-6 py-4">
          <p className="text-body-md text-ink">More detail</p>
          <div className="flex gap-2.5 text-center">
            <StatTile value={`${done} of ${total}`} label="Lessons done" />
            {/* Neither figure below is derivable from a coach record — there is
                no per-module duration and no enrolment date on the model. Left
                as the frame's own values rather than computed from something
                that would only look real. */}
            <StatTile value="~2 hrs" label="To finish modules" />
            <StatTile value="Day 12" label="Into your training" />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-center px-6 py-4">
          <Link
            to="/delivery/learning"
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go to My Learning
          </Link>
        </div>
      </div>
    </HomeStageCard>
  )
}

/**
 * The resources list shared by the session-prep stages — Figma `676:2200`.
 *
 * Extracted at its second caller (Stages 2 and 3). Every stage from here on
 * hands the trainee references to take away before a scheduled session, so this
 * is the shape that repeats; only the list changes.
 *
 * Rows are **dummy cards** (direct instruction): there is no download path, and
 * generating a file would be fabricating content. They render as the project's
 * standing treatment for an unwired control — a real, focusable `aria-disabled`
 * button with an `sr-only` cue — never a silently dead row.
 */
interface StageListItem {
  name: string
  /** Overrides the list's action label for this row. */
  action?: string
  /** A real handler makes the row a working control; without one it renders as
   *  the project's unwired treatment (`aria-disabled` + an `sr-only` cue). */
  onSelect?: () => void
}

/**
 * 2026-10-01, direct instruction: **the rows carry no icon.** A leading glyph
 * was tried as a white chip, then as a filled blue chip, then as a bare blue
 * top-aligned glyph, and removed — it only ever repeated what the row's own
 * label already said, and it cost ~32px of the label's width on a card that is
 * 524px wide at most. Name on the left, action on the right.
 *
 * 2026-10-01, direct instruction: **the sub copy is gone too.** Rows used to
 * carry an optional second line describing the resource; it was removed for the
 * same reason the icon was — the row name already says what the resource is, and
 * a description under every one turned a short reference list into a wall of
 * text. Every row is now exactly one line, which is why the row is
 * `items-center` and the pill carries no optical top-margin nudge: both existed
 * only to hang a two-line row off its first line.
 */
function StageList({
  heading,
  items,
  action,
}: {
  heading: string
  items: readonly StageListItem[]
  action: string
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <p className="text-body-md text-ink">{heading}</p>

      <ul className="flex list-none flex-col gap-2.5 p-0">
        {items.map((item) => {
          const wired = !!item.onSelect
          const label = item.action ?? action
          return (
            /* 2026-10-01, direct instruction: **the row is no longer the
               control.** It was one big `<button>`, so the whole card lit up on
               hover; now it is a plain row and only the pill reacts.

               That also fixes an accessibility defect the old shape hid: every
               row's control announced itself as just "Download". The pill
               carries an `sr-only` copy of the item name, so each one has a
               distinct accessible name — the same problem Round 20 found with
               buttons named only "Edit". */
            <li
              key={item.name}
              className="flex w-full items-center gap-3 rounded-sm border border-yellow-100 bg-yellow-50 px-3 py-3.5"
            >
              <span className="min-w-0 flex-1 text-body-md text-ink">{item.name}</span>
              {/* Fixed width, so every row's control is the same size and lands
                  on the same x (direct instruction).
                  The hover **fills**: `hover:bg-primary/5` composites to a ~9
                  per-channel shift on this ground, which is present in the DOM
                  and invisible on screen — the trap CLAUDE.md records from
                  Round 28. */}
              <button
                type="button"
                aria-disabled={wired ? undefined : 'true'}
                onClick={item.onSelect}
                className={cn(
                  'flex h-9 w-[104px] shrink-0 items-center justify-center rounded-full border border-primary text-caption-medium text-primary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  'hover:bg-primary hover:text-white',
                  !wired && 'cursor-not-allowed',
                )}
              >
                {label}
                <span className="sr-only">
                  {' '}
                  {item.name}
                  {!wired && ' (coming soon)'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * The five stage card bodies.
 *
 * 2026-10-01, direct instruction. Three things changed together here:
 *
 * 1. **`LockedSessionCta` is gone.** Every stage from O onwards carried a
 *    disabled "Join … session" pill plus a "Link activates on day of session"
 *    caption, sitting directly opposite the meeting card's own live Join Zoom
 *    button. One screen, two controls, one session. The meeting card is the
 *    real one, so the locked pill was deleted outright rather than hidden.
 *    Stage C keeps its own CTA — "Go to My Learning" is a different action, not
 *    a second copy of this one.
 * 2. **Cards are re-cut for the five COACH stages**, with Guided Group Practice
 *    and Peer Role-Play collapsed into one Stage O card and a net-new Stage A.
 * 3. **The feedback report is one row, not two.** See `CommunityFeedbackCard`.
 *
 * ⚠️ Every resource row below is **dummy** (standing instruction): there is no
 * document store and no download path, so they render this project's documented
 * unwired treatment — a real, focusable `aria-disabled` button with an `sr-only`
 * cue — never a silently dead row and never a fabricated file. Wiring one means
 * giving `StageListItem.onSelect` a handler; nothing else changes.
 */

/** Stage O — the guided group sessions and the peer role-plays that run inside
 *  them. "client", not "consumer": coach-facing surface, per CLAUDE.md's
 *  audience-dependent rule. */
const OBSERVING_RESOURCES: StageListItem[] = [
  { name: 'Session guidelines' },
  { name: 'SIPTEA component reference card' },
  { name: 'Peer feedback templates' },
  { name: 'Role-play briefs' },
]

function ObservingPrepCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="Group session prep"
      subtitle="Get ready for your upcoming online sessions with your peers"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList
          heading="Important resources"
          items={OBSERVING_RESOURCES}
          action="Download"
        />
      </div>
    </HomeStageCard>
  )
}

/**
 * Stage A — the first placement. **Net new**: no frame and no prior card, so
 * the rows below are plausible dummy stand-ins for what Placement 1 actually
 * hands a trainee under the COACH brief (simulated clients, an observer in the
 * room, feedback collected from everyone present). Replace them the moment the
 * real placement pack exists.
 */
const FIRST_PLACEMENT_RESOURCES: StageListItem[] = [
  { name: 'Placement brief' },
  { name: 'Session plan template' },
  { name: 'SIPTEA component reference card' },
]

function FirstPlacementCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="First placement prep"
      subtitle="Get ready to coach your first simulated clients"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList
          heading="Important resources"
          items={FIRST_PLACEMENT_RESOURCES}
          action="Download"
        />
      </div>
    </HomeStageCard>
  )
}

/**
 * Stage CP — the community of practice itself.
 *
 * **The feedback report is no longer here.** Direct instruction, 2026-10-02:
 * *"feedback report is getting shared with trainee after trainee has passed
 * stage CP, and they move to stage H, so they see the report while they are now
 * in stage H."* The report was previously this card's only row, which put it in
 * front of a trainee who was still *in* CP — i.e. before the research team had
 * finished collating it. It now lives on `SECOND_PLACEMENT_RESOURCES`, and the
 * reasoning that used to sit here moved with it.
 *
 * ⚠️ These three rows are **dummy** (direct instruction: *"add some dummy
 * resource researcher might want to share with them while they are in stage
 * CP"*). The real per-stage resource list is still formally OPEN in Notion —
 * the page carries unanswered questions on the list itself, its format, and
 * whether it is trainee-specific — so these are placeholders in the same voice
 * as the other stages' rows, not content anyone has signed off.
 */
const COMMUNITY_FEEDBACK_RESOURCES: StageListItem[] = [
  { name: 'Community of practice session guide' },
  { name: 'Peer discussion prompts' },
  { name: 'Reflective practice worksheet' },
]

function CommunityFeedbackCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="Community of practice"
      /* No longer "Your consolidated feedback, prepared by the research team" —
         that named the report, which is not on this card any more. */
      subtitle="Meet your peers to compare notes and sharpen your practice"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList
          heading="Important resources"
          items={COMMUNITY_FEEDBACK_RESOURCES}
          action="Download"
        />
      </div>
    </HomeStageCard>
  )
}

/**
 * Stage H — the assessed second placement.
 *
 * **The trainee is still in training here.** They run sessions independently,
 * but with *simulated* clients and an expert assessor watching. This is not the
 * live delivery portal with real clients, which is Phase 8 and a different
 * portal entirely. Round 32 fixed exactly this mis-reading once already in the
 * Stage banner; the copy here keeps that premise.
 */
/**
 * The **peer community feedback report lands here**, not on the Stage CP card —
 * direct instruction, 2026-10-02: the research team shares it once the trainee
 * has passed CP, so they read it while working through Stage H. It is listed
 * first because it is the thing that has just arrived; the other two are
 * standing references for the placement itself.
 *
 * Two notes carried over from the CP card, both still true:
 *
 * **One report, not four.** The brief names four sources of developmental
 * feedback (simulated clients, the expert assessor, cohort peers, the research
 * team observer), but the research team *collates* them — the trainee receives
 * a single consolidated report. Four rows would imply four artefacts to chase
 * and would leak the research team's working structure onto a trainee's
 * dashboard.
 *
 * ⚠️ The Download is the unwired treatment, not a real file. A direct
 * instruction stands: *"just show an uploaded doc of feedback, do not create
 * any doc"* — nothing is generated and nothing is stored on either side of this
 * handover. The researcher's own end of it is `FeedbackReportDialog`, which is
 * what closes Stage CP.
 */
const SECOND_PLACEMENT_RESOURCES: StageListItem[] = [
  // Named after the stage it comes from, so it follows the 2026-10-05 rename:
  // "Peer community feedback report" -> "Community feedback report". Leaving the
  // "Peer" here would have been the only place that word survived.
  { name: 'Community feedback report', action: 'Download' },
  { name: 'Assessment brief' },
  { name: 'SIPTEA competency checklist' },
]

function SecondPlacementCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="Second placement prep"
      subtitle="Get ready to run your sessions independently"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList
          heading="Important resources"
          items={SECOND_PLACEMENT_RESOURCES}
          action="Download"
        />
      </div>
    </HomeStageCard>
  )
}

/**
 * The certification body — the state past Stage H, when the coach has finished
 * the pathway. Direct instruction: a card to download the certificate and one
 * telling them what happens next, and **no session CTA**, because there is no
 * next training session to join.
 *
 * The certificate row is **really wired** to the same `downloadCertificate` the
 * certification banner uses, so the two entry points produce the same file.
 */
function CertifiedCard({ onDownloadCertificate }: { onDownloadCertificate: () => void }) {
  const items: StageListItem[] = [
    {
      name: 'Your certificate',
      action: 'Download',
      onSelect: onDownloadCertificate,
    },
    { name: 'What happens next', action: 'View' },
  ]

  return (
    <HomeStageCard
      nodeId="676:2187"
      title="You are a certified sleep coach"
      subtitle="Congratulations on completing the COACH pathway"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList heading="Important resources" items={items} action="View" />
      </div>
    </HomeStageCard>
  )
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-sm border border-yellow-100 bg-yellow-50 px-2 py-[18px]">
      <p className="font-display text-title text-primary">{value}</p>
      <p className="text-caption text-ink-muted">{label}</p>
    </div>
  )
}

/** `544:2640` — the coach's next supervisor-scheduled meeting. Real data: the
 *  same `upcomingGroupSessions` the Round 29 attention cards read. */
function MeetingCard() {
  const next = upcomingGroupSessions[0]

  return (
    <Card
      className="min-w-0 flex-1 gap-4 self-stretch overflow-hidden py-0 pb-2"
      data-node-id="544:2640"
      data-tour="meeting"
    >
      <div className="flex h-[120px] flex-col gap-1 bg-purple-50 p-6">
        <h2 className="font-display text-title text-ink">My meeting</h2>
        <p className="text-body leading-[1.4] text-ink-muted">
          You will get links to any meetings scheduled by your supervisor here
        </p>
      </div>

      <div className="flex flex-1 flex-col px-6 py-4">
        {next ? (
          <div className="flex flex-col gap-3">
            <p className="text-caption-medium text-ink-muted">Upcoming: {formatDate(next.date)}</p>
            <div className="flex flex-col gap-6 rounded-sm border border-yellow-100 bg-yellow-50 px-4 py-5">
              <div className="flex flex-col gap-2">
                <p className="text-body-md text-ink">{next.title}</p>
                <p className="text-caption text-ink-faint">
                  <span className="text-caption-medium text-ink-muted">
                    {formatTime(next.time)} ·
                  </span>{' '}
                  Meeting ID {next.meetingId}
                </p>
              </div>
              <a
                href={next.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-sm bg-primary px-5 text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Video aria-hidden="true" className="size-4" strokeWidth={2.25} />
                Join Zoom
              </a>
            </div>
          </div>
        ) : (
          <EmptyState icon={CalendarX} copy="No meetings scheduled yet" />
        )}
      </div>
    </Card>
  )
}

/**
 * Trainee stage, rebuilt from Figma `542:1597`.
 *
 * The Round 29 structure — KPI row, "Your this week's to do", and the
 * (necessarily empty) clients table — is **removed on direct instruction**, so
 * this page no longer mirrors the Research Dashboard's KPI/attention/table
 * rhythm. The greeting is page content rather than a hero band, because the
 * frame has no band: `welcome-header` is transparent with its own 64px top
 * inset, and every section below it is separated by a flat 48px.
 */
function TraineeHome() {
  // Which stage the "you are here" marker sits on, and therefore which banners
  // the page shows. Page-level `useState` on purpose: the banners and the rail
  // are siblings here, and a refresh resetting it to Stage 1 is the intended
  // demo behaviour (direct instruction), the same never-persisted treatment the
  // onboarding flow and the resume banner get.
  const [activeStage, setActiveStage] = useState(0)
  /** See `EndlineState`. Page-level and never persisted, like `activeStage` —
   *  a refresh starting over is the intended demo behaviour. */
  const [endline, setEndline] = useState<EndlineState>('todo')
  /* The reflection wizard. Open state is page-level; the *answers* are not —
     they live in `data/traineeReflections.ts`, because the midline screen
     renders the baseline answers and so they must outlive the modal that
     collected them. */
  const [reflectionOpen, setReflectionOpen] = useState(false)
  const reflectionCtaRef = useRef<HTMLButtonElement>(null)
  const { drafts, submitted: submittedReflections } = useReflectionState()
  const pathwayHeadingRef = useRef<HTMLHeadingElement>(null)
  const greeting = greetingFor(activeStage, !!resumableModule())

  /** Same committed asset My profile's Study details card downloads, so the two
   *  surfaces cannot hand over different certificates. */
  async function downloadCertificate() {
    const res = await fetch('/illustrations/certificate-earned.svg')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'care2sleep-certificate.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  // The stage *before* the current one is the one there is a reflection due on,
  // so Stage C's prompt appears once the trainee has moved on to Stage O, not
  // while they are still working through the modules.
  //
  // Stage H's lands on the certified state (`activeStage === PATHWAY_STAGES.length`),
  // which is correct and is why this is not clamped to the rail's length: the
  // endline reflection is due the moment the second placement is behind them.
  // It renders above the certification banner, so the trainee sees both.
  //
  // Worth flagging: frame `637:10671` pairs Stage 2's expect banner with Stage
  // 2's *own* notes banner, which is the other reading. That frame's rail also
  // shows Stage 1 as "Ongoing" underneath a banner announcing Stage 2, so it is
  // a layout reference rather than a coherent state, and the written brief wins.
  // Flipping to same-stage pairing is changing `activeStage - 1` to
  // `activeStage` on the next line.
  const reflectionStage = activeStage - 1
  const certified = activeStage === PATHWAY_STAGES.length
  /* The endline banner goes once the assessor has passed them — direct
     instruction: "after I click label, hide banner and show congratulation
     banner". The two never share the screen. */
  /* Which reflection the banner on screen is for, resolved through the rail's
     own eyebrow — never an index, so inserting a stage cannot point the wizard
     at the wrong question set. */
  const reflectionTimepoint: ReflectionTimepoint | null =
    reflectionStage >= 0
      ? (TIMEPOINT_BY_STAGE[PATHWAY_STAGE_COPY[reflectionStage]?.stage ?? ''] ?? null)
      : null

  /* Hidden once this stage's reflection has actually been sent — for C and O
     that is the whole end state (direct instruction: the banner hides). Stage H
     keeps its banner through `pending`, because an assessor still has to act,
     and loses it on approval when the Congratulations banner takes the slot. */
  const reflectionSent =
    reflectionTimepoint !== null && submittedReflections[reflectionTimepoint] !== undefined
  const showReflection =
    activeStage > 0 &&
    STAGES_WITH_REFLECTION.has(reflectionStage) &&
    !(certified && endline === 'approved') &&
    !(reflectionSent && reflectionTimepoint !== 'endline')

  /* Approving unmounts the label that was clicked — in the banner it takes the
     whole banner with it — so focus has to be sent somewhere deliberate or it
     falls to `<body>`, this project's most-repeated defect. The pathway heading
     is the nearest stable landmark and is already `tabIndex={-1}` for exactly
     this. */
  function approveCertification() {
    setEndline('approved')
    pathwayHeadingRef.current?.focus()
  }


  /* Closing the wizard after a submit. Stage H goes to `pending`, because its
     reflection is the one an assessor acts on; C and O have nothing to wait
     for, so the banner simply goes. `showReflection` reads
     `submittedReflections`, so for C and O this needs no extra state. */
  function handleReflectionSubmitted() {
    if (reflectionTimepoint === 'endline') setEndline('pending')
    /* The CTA unmounts with the banner, so focus has to be sent somewhere
       deliberate or it falls to `<body>`. */
    pathwayHeadingRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-12">
      {/* `welcome-header` (`558:4319`). The greeting is `Purple/700`, not ink —
          a change from Round 29's yellow band, where it was `text-ink`.
          The long orientation line gives way to a shorter pair once the coach
          has a module under way; see `greetingFor`. */}
      {/* Round 40, direct instruction: "Need help" on the trainee view too, in
          the same top-right slot as the coach stage and the Research Dashboard.
          The `data-tour` anchor stays on the row that holds the greeting, so
          the tour's first step still spotlights the greeting and now includes
          the control beside it — which is the honest thing to point at, since
          both are the page's header. */}
      <div
        className="flex flex-wrap items-start justify-between gap-6"
        data-node-id="558:4320"
        data-tour="home-greeting"
      >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="font-display text-display-lg text-primary">{greeting.heading}</h1>
        {/*
          Round 32: the trainee greeting measures 1189px on one line at
          18px Inter, so a 640px cap lands it on exactly two reasonably even
          lines and holds that shape all the way down to the narrowest column
          the shell produces. Replaces a hard `<br>`, which broke to three.
        */}
        <p className="max-w-[640px] text-sub-greeting leading-[1.4] text-ink">
          {greeting.sub}
        </p>
      </div>
        <NeedHelpButton />
      </div>

      {/* Frame `638:11574` stacks the two banners 16px apart — tighter than the
          page's own 48px rhythm, which is what makes them read as one block
          rather than two unrelated sections.
          **Notes first, then the next stage** (direct instruction), which is the
          reverse of that frame's own order. It reads better as a sequence: close
          off what just happened before being told what is coming. */}
      <div className="flex flex-col gap-4">
        {showReflection && (
          <StageReflectionBanner
            index={reflectionStage}
            /* Only Stage H carries the assessment gate; C and O pass `null`. */
            endline={certified ? endline : null}
            timepoint={reflectionTimepoint}
            resumable={reflectionTimepoint ? drafts[reflectionTimepoint] !== undefined : false}
            ctaRef={reflectionCtaRef}
            onOpen={() => setReflectionOpen(true)}
            onApprove={approveCertification}
          />
        )}
        {certified ? (
          /* Nothing in this slot until the assessor passes them: the
             reflection banner above is the whole hero while the endline is
             outstanding or with the assessor. */
          endline === 'approved' && (
            <CertificationBanner onDownloadCertificate={downloadCertificate} />
          )
        ) : activeStage === 0 ? (
          <TrainingBanner />
        ) : (
          STAGE_BANNER_COPY[activeStage] && <StageExpectBanner index={activeStage} />
        )}
      </div>

      <WaveDivider label="Track your progress here" />
      <TrainingPathway
        activeStage={activeStage}
        onSelectStage={setActiveStage}
        headingRef={pathwayHeadingRef}
        endline={endline}
        onApprove={approveCertification}
      />

      {/* Mounted here rather than inside the banner: the banner unmounts the
          moment a reflection is sent, and a modal that unmounts with the
          control that opened it cannot play its own exit — the thank-you screen
          would vanish instead of being closed. */}
      {reflectionTimepoint && (
        <TraineeReflectionModal
          open={reflectionOpen}
          timepoint={reflectionTimepoint}
          onClose={({ submitted }) => {
            setReflectionOpen(false)
            /* Only the non-submit path needs this: on a submit the banner's CTA
               is gone (C and O lose the banner, H loses the button), and
               `handleReflectionSubmitted` sends focus to the pathway heading
               instead. The delay waits out `ConfirmDialog`'s own 200ms exit —
               the same reason `OptOutCard` uses a timeout rather than a frame;
               measured there as one `requestAnimationFrame` not being enough. */
            if (!submitted) {
              window.setTimeout(() => reflectionCtaRef.current?.focus(), 300)
            }
          }}
          onSubmitted={handleReflectionSubmitted}
        />
      )}

      {/*
        Round 32: the frame's side-by-side pair needs 524 + 40 + ~360 = ~924px of
        content column, and the shell reserves 320px of chrome around it — so the
        row only fits from ~1244px up. Below `xl` the two cards stack full width
        rather than overflowing the column.
      */}
      <div
        className="flex flex-col items-stretch gap-10 xl:flex-row xl:items-stretch"
        data-node-id="542:1643"
      >
        {/* One card slot, one variant per stage. The shell is constant
            (`HomeStageCard`); only the title, sub copy and body change. Stage C
            is the fall-through. */}
        {/* The certified card claims "You are a certified sleep coach", so it
            cannot show while the rail beside it reads "Pending assessment" —
            two surfaces stating the same fact differently is the contradiction
            CLAUDE.md's internal-consistency rule exists to catch. Until the
            assessor passes them they keep the Stage H card, which is the
            placement still being assessed. */}
        {certified && endline === 'approved' ? (
          <CertifiedCard onDownloadCertificate={downloadCertificate} />
        ) : certified ? (
          <SecondPlacementCard />
        ) : activeStage === OBSERVING_STAGE_INDEX ? (
          <ObservingPrepCard />
        ) : activeStage === FIRST_PLACEMENT_STAGE_INDEX ? (
          <FirstPlacementCard />
        ) : activeStage === COMMUNITY_FEEDBACK_STAGE_INDEX ? (
          <CommunityFeedbackCard />
        ) : activeStage === SECOND_PLACEMENT_STAGE_INDEX ? (
          <SecondPlacementCard />
        ) : (
          <LearningProgressCard />
        )}
        <MeetingCard />
      </div>

      {/*
        Round 32: the first-run tour (frames `637:10621`-`637:10625`). Mounted
        here rather than in `DeliveryShell` for two reasons: four of its five
        anchors are on this page, and the one interpolated number in its copy —
        how many stages the rail draws — has to come from `PATHWAY_STAGES`
        itself. The shell cannot import that without a cycle (this page imports
        the shell), and hardcoding it is how the frame ended up saying "five
        stages" over a rail that draws six.

        It renders nothing at all until the tour is actually running.
      */}
      <DeliveryTour
        stageCount={STAGE_COUNT_WORD[PATHWAY_STAGES.length] ?? String(PATHWAY_STAGES.length)}
      />
    </div>
  )
}

/**
 * The coach's welcome banner (frame `739:5586`).
 *
 * Direct instruction: the trainee banner's artwork is reused unchanged and only
 * the copy differs — so this is `StageBlob variant="begin"` on the same
 * `primary` ground, at the same responsive scales the trainee banners use, and
 * the same stacked-and-centred treatment below `xl`.
 *
 * **Both CTAs concern a tour that does not exist yet.** "Take tour" therefore
 * gets this app's documented unwired treatment — focusable, `aria-disabled`,
 * with an `sr-only` cue — rather than a button that silently does nothing.
 * "Skip tour" is wired, because hiding the banner is a real thing this page can
 * do and a Skip that did nothing would be worse than no Skip at all. It is not
 * persisted, matching the trainee onboarding and tour it sits alongside.
 */
function CoachWelcomeBanner({ onSkip, onTakeTour }: { onSkip: () => void; onTakeTour: () => void }) {
  return (
    <section
      className="flex flex-col items-center gap-6 overflow-hidden rounded-lg bg-primary px-6 py-6 xl:flex-row xl:items-center"
      data-node-id="739:5586"
    >
      <StageBlob
        variant="begin"
        photo={BEGIN_PHOTO}
        className="self-center [--blob-scale:0.36] sm:[--blob-scale:0.7] xl:[--blob-scale:1]"
      />
      <div className="flex w-full min-w-0 flex-1 flex-col justify-center gap-8 xl:px-4">
        <div className="flex flex-col gap-2 text-center text-white xl:text-left">
          {/* Direct instruction: the frame's own copy, title and body, kept as
              authored. The title takes this app's sentence case ("Coaching
              dashboard"); the body is verbatim.

              An earlier pass here replaced the body with a shorter
              `/design:ux-copy` rewrite and it was rejected — its "plan sessions,
              prepare for them and write them up" did not say *for whom*, which
              the frame's version does ("sessions with real clients", "before
              your first client is assigned"). Recorded so the trim is not
              proposed a second time: the length was not the problem. */}
          {/* "Coaching Dashboard" capitalised, direct instruction — the one
              Title Case string on a page that is otherwise sentence case. */}
          <h2 className="font-display text-display-md">Welcome to your Coaching Dashboard</h2>
          {/* Round 40, direct instruction: **only the first sentence** is
              `body-md` (16/600); everything after it is plain `body`. Two
              paragraphs rather than a `<span>` inside one, so the weight change
              lands on a whole line and the rest starts on its own — a bolded
              lead clause mid-paragraph reads as emphasis on a phrase rather
              than as a heading for what follows. */}
          <p className="text-body-md leading-[1.4] opacity-90">
            Congratulations on reaching this exciting milestone.
          </p>
          <p className="text-body leading-[1.4] opacity-90">
            You&rsquo;re now ready to begin conducting sessions with real clients. Before your first
            client is assigned, we recommend taking a brief tour to explore the new features and
            tools available in your dashboard.
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center xl:justify-start">
          {/* The frame's own pair: a white-filled pill and a white-outline one,
              both 44px and equal width. 44px is the frame's height and the
              trainee CTAs' own, and the 36px rule is a floor rather than a cap. */}
          {/* Round 40: wired. This was the documented unwired treatment while
              the coach walkthrough did not exist; it now opens `COACH_TOUR_STEPS`. */}
          <button
            type="button"
            onClick={onTakeTour}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full border border-primary bg-white px-[18px] text-caption-medium text-primary outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[209px]"
          >
            Take tour
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full border border-white px-[18px] text-caption-medium text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[209px]"
          >
            Skip tour
          </button>
        </div>
      </div>
    </section>
  )
}

/** A client is "new" for a fortnight after being handed over. */
const NEW_ASSIGNMENT_DAYS = 14

/**
 * The coach's real priorities, read from their own caseload and record.
 *
 * **Round 40, direct instruction — the four things a coach actually wants to
 * see:** a newly assigned client, an upcoming session, their own supervision
 * catch-up, and a client whose Fitbit has stopped syncing. Listed in that
 * order, which is also roughly urgency order.
 *
 * An earlier pass listed **"Write Session N reflection"** for every held
 * session with no reflection against it, and that was a real domain error, not
 * a copy problem: *a reflection is written from the session debrief, not at
 * will*. A coach cannot sit down on a Tuesday and write up Session 3 — the
 * prompt belongs to the session it follows, which is exactly where the debrief
 * banner already puts it. Standing "you owe six reflections" rows invented a
 * workflow the product does not have, and on one client with six held sessions
 * they filled the list on their own. Recorded so it is not reintroduced.
 *
 * Nothing here is generated copy — each row is assembled from one fact the
 * store already holds, which is also why none can drift from the KPI tiles
 * beside them.
 */
function coachPriorities(
  dyads: ConsumerDyad[],
  sessionPlans: Record<string, SessionPlan>,
  sessionCompletion: Record<string, SessionCompletionRecord[]>,
  coach?: Coach,
): ResearchPriorityItem[] {
  const items: ResearchPriorityItem[] = []

  /* Notes are **one short line** (direct instruction, twice: say something
     after the names, then simplify). The title already names the kind of job,
     so the note carries only what the title cannot — who, and the one date or
     action that matters. Two full sentences of guidance ("Read their sleep
     data before you meet") were the wordy version; a coach preparing for a
     session does not need to be told to read the data. */

  /* **`priority` is DUMMY on every row below.** 2026-10-01, direct
     instruction: align this list with the researcher's "Items that need your
     attention", chip included. The researcher's severities come from a real
     source classification; nothing in this portal's data layer classifies a
     coach's own priorities, so each kind carries a fixed severity written here
     by hand.

     The rule applied: High where a client is *waiting on the coach* or the
     platform has stopped telling the truth about them; Medium where something
     is already booked and the row is a heads-up. What would replace it is a
     real severity on whatever produces these — most likely the same
     classification the researcher alerts already read from, extended to the
     coach's caseload. Until then, changing a title here means deciding its
     severity here too. */

  // 1. Newly assigned clients.
  for (const d of dyads) {
    if (!d.coachAssignedDate) continue
    if (d.coachAssignedDate < addDays(TODAY, -NEW_ASSIGNMENT_DAYS)) continue
    items.push({
      id: `new-${d.id}`,
      // Dummy severity. High: nobody has started work on this client yet.
      priority: 'High',
      title: 'New client assigned',
      note: `${dyadFirstNames(d)}. Plan their sessions.`,
      to: `/delivery/consumers/${d.id}`,
    })
  }

  /* 1b. Clients **transferred in**, which rule 1 cannot see.
         `coachAssignedDate` is deliberately not moved by a hand-over — it is
         the date the *original* coach got them, and the researcher's timeline
         pairs it with `originalCoachId` — so a consumer who landed on this
         caseload yesterday still carries an assignment date months old and
         never enters the window above. Without this the dashboard shows the
         client, counts them in "Session plans not created", and then offers
         nothing to act on.

         Keyed on `transfer.date` against the same 14-day window, and only
         while `replanDate` is unset: once the incoming coach has run their own
         planning session the hand-over is done and the row would be telling
         them to do what they just did. */
  for (const d of dyads) {
    if (!d.transfer || d.transfer.replanDate) continue
    if (d.transfer.date < addDays(TODAY, -NEW_ASSIGNMENT_DAYS)) continue
    items.push({
      id: `transfer-${d.id}`,
      // Dummy severity, same rule as 1: the client is waiting on the coach.
      priority: 'High',
      title: 'Client transferred to you',
      /* Names the split rather than just the task. A coach picking this up
         needs to know they are joining an arc in progress, and the figure is
         the frozen `sessionsWithPreviousCoach` every other transfer surface
         quotes — never a live count, which would climb as they hold sessions
         of their own. */
      note: `${dyadFirstNames(d)}. ${d.transfer.sessionsWithPreviousCoach} of ${SPACES_CATCHUP_COUNT} sessions already held. Plan the rest.`,
      to: `/delivery/consumers/${d.id}`,
    })
  }

  // 2. The next booked session per client.
  for (const d of dyads) {
    const next = nextPlannedSession(sessionPlans[d.id], sessionCompletion[d.id] ?? [])
    if (!next?.date) continue
    items.push({
      id: `next-${d.id}`,
      // Dummy severity. Medium: it is booked; this row is a heads-up.
      priority: 'Medium',
      /* `sessionRowLabel`, never a bare number — internal 1 is "Planning". */
      title: `${sessionRowLabel(next.session)} coming up`,
      note: `${dyadFirstNames(d)}, ${formatDate(next.date)}.`,
      to: `/delivery/consumers/${d.id}`,
    })
  }

  // 3. The coach's own supervision catch-up — theirs, not a client's, which is
  //    why the row opens the schedule rather than a client record.
  if (coach?.upcomingSession?.date) {
    items.push({
      id: 'supervision',
      // Dummy severity. Medium: booked, and the coach's own rather than a client's.
      priority: 'Medium',
      title: 'Supervision catch-up',
      note: `With your supervisor, ${formatDate(coach.upcomingSession.date)}.`,
      to: '/delivery/meetings',
    })
  }

  // 4. A client whose Fitbit has stopped reporting. Read off the last entry of
  //    either member's health log — the same `synced` flag the sleep-data tab
  //    and the Fitbit sync monitor read, so the three cannot disagree.
  for (const d of dyads) {
    const logs = [d.patientLog, d.carerLog].filter(Boolean) as HealthLogEntry[][]
    const stalled = logs.some((log) => log[log.length - 1]?.synced === false)
    if (!stalled) continue
    /* The last date that did report, across both members — what a coach needs
       in order to know how big the gap is. */
    const lastSynced = logs
      .flatMap((log) => log.filter((e) => e.synced !== false).map((e) => e.date))
      .sort()
      .pop()
    items.push({
      id: `sync-${d.id}`,
      // Dummy severity. High: the sleep data a session is prepared from has stopped arriving.
      priority: 'High',
      title: 'Fitbit not syncing',
      note: lastSynced
        ? `${dyadFirstNames(d)}, nothing since ${formatDate(lastSynced)}.`
        : `${dyadFirstNames(d)}, no readings yet.`,
      to: `/delivery/consumers/${d.id}`,
    })
  }

  return items
}

/**
 * Certified-coach stage, rebuilt from frame `739:5550` (Round 40).
 *
 * Greeting -> welcome banner -> a two-column row pairing the KPI grid with
 * "This week's priorities" -> wave rule -> the caseload table.
 *
 * The three things the frame keeps are the three that were already here — the
 * KPI tiles, the attention list and the clients table — but the first two moved
 * from stacked full-width sections into one row, and the attention cards became
 * the priorities list. The table is deliberately unchanged: the frame draws it
 * with the *trainee* roster's own column headers as a placeholder, so its own
 * design is the one to keep (direct instruction).
 */
function CoachHome({ dyads }: { dyads: ConsumerDyad[] }) {
  const { sessionPlans, sessionCompletion } = useResearch()

  const sessionsDone = dyads.reduce(
    (n, d) => n + catchupSessionsCompleted(sessionCompletion[d.id] ?? []),
    0,
  )
  // Same `isPlanSet` read the "Session plan missing" attention cards below use,
  // so the tile and the cards can never disagree about how many plans are
  // outstanding — the two-surfaces-one-fact failure this project keeps hitting.
  const plansMissing = dyads.filter((d) => !isPlanSet(sessionPlans[d.id])).length

  const upcomingRows = [
    ...nextSessionRowsForDyads(dyads, sessionPlans, sessionCompletion),
    ...upcomingSessionRowsForDyads(dyads, sessionPlans),
  ]

  /* Helen's own coach record, for her supervision catch-up — the one row on
     this list that is about the coach rather than a client. Read from the
     roster rather than duplicated here, so her supervision appears identically
     on the researcher's own schedule. */
  const coachRecord = coaches.find((c) => c.id === COACH_ID)
  const priorities = coachPriorities(dyads, sessionPlans, sessionCompletion, coachRecord)

  return (
    <>
      {/* Frame `739:7470`: two equal columns 48px apart — the KPI tiles as a
          2x2 grid on the left, the priorities list on the right. `min-w-0` on
          both cells: a grid item defaults to `min-width: auto`, which is how
          this project has produced a real horizontal page scroll three times.
          Stacks below `xl` for the same reason the banner does — at the shell's
          own chrome width, two 456px columns need more than a tablet has. */}
      {/* Round 40, direct instruction: the two columns match height, and the
          KPI grid is the one that grows. Grid items stretch by default, so this
          is `items-start` *removed* rather than a height added — the section
          then fills the row, and `flex-1` + `auto-rows-fr` on the tile grid
          hands that height to the four tiles as two equal rows.

          The priorities column is what sets the height: its list is capped at
          five rows and scrolls, so it has a ceiling, where the tiles have only
          a `min-h-[120px]` floor and can absorb whatever is left. Doing it the
          other way round would make a long priorities list stretch four KPI
          tiles to something absurd. */}
      <div className="grid grid-cols-1 gap-12 xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-4" data-tour="quick-overview">
          {/* "Quick overview", the frame's own title — not the previous "Your
              delivery overview". Shorter, and it no longer competes with the
              priorities heading beside it for what the coach reads first.

              Round 40, direct instruction: the heading row is a **fixed 36px**,
              matching the priorities heading opposite (now
              `ResearchPrioritiesSection`'s `min-h-9`). That one is 36px because
              it carries the alerts pill; a bare `<h2>` beside it
              measured ~25px, so the tiles started 11px above the priorities
              list and the two columns visibly failed to line up. Written out
              rather than reaching for a shared heading component: this row needs a
              fixed height, which a title+sub block is the wrong shape for. */}
          <div className="flex min-h-9 items-center">
            <h2 className="font-display text-title text-ink">Quick overview</h2>
          </div>
          {/* 2x2, not the 4-across row this was. Two per row at every width
              above `sm`, because the column is now half the page. */}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:auto-rows-fr sm:grid-cols-2">
            <StatCard label="Clients assigned" value={dyads.length} icon={Users} />
            <StatCard label="Catch-up sessions held" value={sessionsDone} icon={CalendarDays} />
            <StatCard label="Upcoming meetings" value={upcomingRows.length} icon={CalendarClock} />
            <StatCard label="Session plans not created" value={plansMissing} icon={CalendarX} />
          </div>
        </section>

        {/* 2026-10-01, direct instruction: aligned with the researcher's own
            "Items that need your attention" — same component now, not a
            lookalike. `components/delivery/PrioritiesSection.tsx` is deleted.
            The heading is the only difference between the two portals, and
            "Dismiss all" is gone from both.

            `emptyCopy` rather than letting the section collapse: this box is
            one half of a two-column row, so vacating it would leave the KPI
            tiles beside a hole. `fillHeight` is deliberately NOT set — it moves
            the heading inside the card, and "Quick overview" opposite sits on
            the page canvas, so the two column headings would stop lining up. */}
        <ResearchPrioritiesSection
          items={priorities}
          title={"Your this week\u2019s priorities"}
          dataTour="priorities"
          emptyCopy="Nothing needs your attention this week."
          className="min-w-0"
        />
      </div>

      {/* The frame's wave rule above the table. Same component the trainee Home
          and the coach's own Session Notes tab use.

          **No margin of its own** (Round 40, direct instruction: match the
          trainee dashboard's spacing). This fragment's children are flex items
          of the page's `flex flex-col gap-12`, so every section here is a flat
          48px apart exactly as the trainee Home's are. The `mt-14` these
          carried was a third value on a page that already had two. */}
      <WaveDivider label="Track and manage your clients here" />

      <ConsumersTable dyads={dyads} />
    </>
  )
}

export function DeliveryHomePage() {
  const stage = useCoachStage()
  /* Not persisted, matching the trainee onboarding and tour this sits
     alongside — a reviewer sees the banner on every load. */
  const [showWelcome, setShowWelcome] = useState(true)

  /* Round 40, direct instruction: **finishing the tour hides the banner.** The
     banner exists to offer the tour; once the coach has taken it, leaving a
     card that says "we recommend taking a brief tour" on the page is telling
     them to do the thing they just did.

     Watched as a transition rather than hooked onto the Done button, because
     the tour can also end from Skip or Escape and all three mean the same
     thing here. `startedRef` is what stops the effect firing on mount, when
     `active` is already false and nothing has happened yet. */
  const { active: tourActive } = useDeliveryTour()
  const tourWasStarted = useRef(false)
  useEffect(() => {
    if (tourActive) {
      tourWasStarted.current = true
    } else if (tourWasStarted.current) {
      tourWasStarted.current = false
      setShowWelcome(false)
    }
  }, [tourActive])
  const { consumerDyads } = useResearch()
  const dyads = dyadsForCoach(COACH_ID).map(
    (seedDyad) => consumerDyads.find((d) => d.id === seedDyad.id) ?? seedDyad,
  )
  const trainee = stage === 'trainee'

  // Frame `542:1597` drops the hero band on the trainee view: the greeting is
  // page content on the plain canvas, with the frame's own 64px top inset. The
  // certified-coach stage is not in this frame and keeps its yellow band.
  if (trainee) {
    return (
      <DeliveryShell
        accountLabel="Helen Zhang"
        // Flush left/right and a flat 64px top: the frame's `welcome-header`
        // sits directly on the content column with no band to inset it. Both
        // breakpoints are named because the shell's default sets `md:` variants
        // that would otherwise win at desktop width.
        contentClassName="px-0 pt-16 md:px-0 md:pt-16"
      >
        <TraineeHome />
      </DeliveryShell>
    )
  }

  return (
    <DeliveryShell
      accountLabel="Helen Zhang"
      // Direct instruction: the coach stage now uses the trainee stage's own
      // shell treatment rather than Round 29's yellow band. The greeting is
      // page content on the plain canvas, flush left, 64px down — identical
      // props to the `trainee` branch above, so the two stages of one portal
      // cannot present two different dashboards.
      contentClassName="px-0 pt-16 md:px-0 md:pt-16"
    >
      <div className="flex flex-col gap-12">
        {/* Same greeting block as `TraineeHome`: `display-lg` in `Purple/700`
            over `sub-greeting` in ink, 8px apart. It was `text-ink` on the
            yellow band; on the plain canvas the band is gone, so the title
            colour is what carries the hierarchy. */}
        {/* `data-tour="home-greeting"` — the coach tour's opening step anchors
            here, exactly as the trainee tour's does on its own greeting. Without
            it the component finds no anchor and advances straight past step 1,
            which is how the tour ended up opening on "Quick overview" with no
            preamble at all. */}
        <div
          className="flex flex-wrap items-start justify-between gap-6"
          data-tour="home-greeting"
        >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Frame `739:5584`: "Hello Helen," — the same greeting the trainee
              Home uses, so one portal does not greet the same person two ways
              at two stages. */}
          <h1 className="font-display text-display-lg text-primary">Hello {COACH_FIRST_NAME},</h1>
          {/* Frame `739:5585`, verbatim — consistent with the banner below,
              which also keeps the frame's own wording after a trim was
              rejected there. Naming the three things (sessions, health data,
              progress) is what makes it match the page underneath it. */}
          {/* Round 40, direct instruction: `body` (16/400), not `sub-greeting`
              (18/400). The trainee Home's own greeting keeps `sub-greeting` —
              that one is a single short line under a `display-lg`, where this
              is three clauses and reads better at body size. */}
          <p className="max-w-[640px] text-body leading-[1.4] text-ink">
            Manage sessions with your clients, review their health data, and track progress, all in
            one place.
          </p>
        </div>
        {/* Round 40, direct instruction: top-right of the greeting row, the
            same position and control the Research Dashboard's Home uses. */}
        <NeedHelpButton />
        </div>

        {showWelcome && (
          <CoachWelcomeBanner
            onSkip={() => setShowWelcome(false)}
            onTakeTour={() => startDeliveryTour(COACH_TOUR_STEPS)}
          />
        )}

        <CoachHome dyads={dyads} />

        {/* Round 40: the coach stage gets the tour too, opened by the welcome
            banner's "Take tour". Same component as the trainee's — only the
            step array differs, and the store knows which was opened.
            `stageCount` is unused by `COACH_TOUR_STEPS` (no step interpolates
            it) but is a required prop, so it is passed identically rather than
            made optional for one caller. */}
        <DeliveryTour
          stageCount={STAGE_COUNT_WORD[PATHWAY_STAGES.length] ?? String(PATHWAY_STAGES.length)}
        />
      </div>
    </DeliveryShell>
  )
}
