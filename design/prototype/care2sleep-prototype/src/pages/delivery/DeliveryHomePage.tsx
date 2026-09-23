import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Award,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CircleHelp,
  CalendarX,
  Check,
  ChevronRight,
  ClipboardCheck,
  Drama,
  FileText,
  HeartHandshake,
  Lock,
  MessageSquare,
  NotebookPen,
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
import { PrioritiesSection, type PriorityItem } from '@/components/delivery/PrioritiesSection'
import { EmptyState } from '@/components/shared/EmptyState'
import { InertButton } from '@/components/shared/MeetingsSection'
import { StatCard } from '@/components/shared/StatCard'
import { useCoachStage } from '@/data/coachStage'
import { PATHWAY_STAGE_COPY } from '@/data/coachPathway'
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
                      i > 0 && 'border-t border-parchment',
                    )}
                  >
                    <td className="px-6 py-3">
                      <div className="flex min-h-11 flex-col justify-center gap-0.5 text-caption">
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
                      <ChevronRight aria-hidden="true" className="inline size-4 text-ink-faint" />
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
 * "Need help" (Round 40, direct instruction) — both coach stages.
 *
 * The Research Dashboard's Home has carried this since Round 28 and this is the
 * same control, same treatment, same place: top-right of the greeting row. It
 * has no destination yet, so it takes this app's documented unwired treatment —
 * focusable and announced, never a silently dead button. `InertButton` is
 * imported from `MeetingsSection`, which is where it already lives.
 */
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
   because a banner CTA a third taller than every other button on the same
   screen read as a different kind of control rather than an emphasised one.
   Full-bleed below `sm` (direct instruction): the pill drops its fixed width
   there rather than keeping it and centring the gap, because at 375px minus the
   shell's own padding a ~220px button leaves an odd sliver either side and
   reads as misaligned against the centred copy above it. */
const BANNER_CTA =
  'inline-flex h-9 w-full shrink-0 items-center justify-center rounded-full border border-primary bg-white px-[18px] text-caption-medium text-primary outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring'

const STAGE_ART = '/illustrations/stage'

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
 * is baked into the file: `purple-500` behind the purple banner, `yellow-400`
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

function StageBlob({
  variant,
  className,
}: {
  variant: keyof typeof STAGE_BLOBS
  className?: string
}) {
  const v = STAGE_BLOBS[variant]
  const rad = (Math.abs(v.rotate) * Math.PI) / 180
  // Rotating the composition grows its footprint. Computed rather than
  // transcribed (the Round 30 rule) — `w·|cosθ| + h·|sinθ|` reproduces the
  // frames' own 188.727x146.762 and 165.525x127.505 to within 0.01px, so the
  // box stays honest if any of these numbers are ever revised.
  const boxW = v.width * Math.cos(rad) + v.height * Math.sin(rad)
  const boxH = v.width * Math.sin(rad) + v.height * Math.cos(rad)

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
            width: `calc(${v.width}px * var(--blob-scale))`,
            height: `calc(${v.height}px * var(--blob-scale))`,
            transform: `rotate(${v.rotate}deg)`,
          }}
        >
          <div
            className="relative origin-top-left"
            style={{
              width: v.width,
              height: v.height,
              transform: 'scale(var(--blob-scale))',
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
                  src="/illustrations/onboarding/photo.jpg"
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
  1: 'You will join live sessions with a facilitator and other coaches to practice your skills together. Wait for your supervisor, they will be contacting you soon.',
  2: 'You will take turns role-playing as the "coach" and the "simulated consumer (peer)" using structured role-play briefs that escalate in complexity across the sessions.',
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
  5: 'You will run independent coaching sessions with simulated clients while an expert assesses your practical competency in real time. Wait to hear from your supervisor for next steps.',
}

/**
 * Which stages get a "how did it go?" prompt once they are behind the coach.
 *
 * Stage 1 (Content Learning) is absent because it is modules, not a session —
 * there is nothing to write up. **Stage 4 (Hands-on Assessment) is built and
 * deliberately withheld** (direct instruction): its banner renders correctly if
 * added here, so turning it on is one number, but it is not shown for now.
 */
const STAGES_WITH_NOTES = new Set([1, 2])

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
 * `purple-300` fill with a `purple-500` stroke, both matching the frame's own
 * tokens exactly. Text is plain `ink` here rather than the white the Stage 1
 * banner uses, because this ground is light.
 */
function StageExpectBanner({ index }: { index: number }) {
  const stage = PATHWAY_STAGES[index]
  if (!stage) return null

  return (
    <section
      className="flex flex-col items-center gap-6 overflow-hidden rounded-lg border border-purple-500 bg-purple-300 py-6 pl-4 pr-6 text-ink shadow-card xl:flex-row xl:items-center xl:justify-between"
      data-node-id="638:11947"
    >
      <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-6 xl:flex-row xl:items-start">
        <StageBlob variant="expect" className="self-center [--blob-scale:0.36] sm:[--blob-scale:0.75] xl:[--blob-scale:1] xl:self-start" />
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
        className={cn(BANNER_CTA, 'cursor-not-allowed xl:w-auto')}
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
 * `yellow-300` ground rather than the reflection banner's `yellow-200`: this is
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
      className="relative flex flex-col items-center gap-8 overflow-hidden rounded-lg border border-parchment bg-yellow-300 py-12 pl-6 pr-12 text-ink shadow-card xl:flex-row xl:items-center"
      data-node-id="647:13277"
    >
      <Confetti play />

      {/* Above the confetti, so pieces fall behind the photo and the copy. */}
      <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col items-center gap-8 xl:flex-row xl:items-center">
        <StageBlob variant="certified" className="self-center" />
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
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* lucide, not the frame's exported glyph (CLAUDE.md). */}
              <Award aria-hidden="true" className="size-6" strokeWidth={1.75} />
              Download my certificate
            </button>
            {/* Unwired — there is no "about SPACES delivery" destination yet. */}
            <button
              type="button"
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
              className="inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-primary bg-white px-[18px] text-caption-medium text-primary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring xl:w-[152px]"
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
 * "after" banner: once a stage is behind the coach, a prompt to write up how it
 * went, with a real Dismiss.
 *
 * Same yellow ground as the reflection banner, and the same `yellow-300`
 * correction applies — the frame's stroke style is *named* `yellow/400` but its
 * hex `#FFCC4D` is this app's `yellow-300`.
 */
function StageNotesBanner({ index, onDismiss }: { index: number; onDismiss: () => void }) {
  const stage = PATHWAY_STAGES[index]
  const dismissRef = useRef<HTMLButtonElement>(null)
  if (!stage) return null

  return (
    <section
      className="flex flex-col items-center gap-6 overflow-hidden rounded-lg border border-yellow-300 bg-yellow-200 py-4 pl-4 pr-6 text-purple-950 shadow-card xl:flex-row xl:items-center xl:justify-between"
      data-node-id="638:11876"
    >
      <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-6 xl:flex-row xl:items-center">
        <StageBlob variant="notes" className="self-center [--blob-scale:0.36] sm:[--blob-scale:0.75] xl:[--blob-scale:1] xl:self-start" />
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-center xl:text-left">
          {/* Frame wording varies per stage ("Peer Role-Play session go?" vs
              "guided group practice go?"); normalised onto the rail's label so
              all three read the same way and match the timeline. */}
          <p className="text-title">How did {stage.label} go?</p>
          <p className="text-body leading-[1.4] opacity-90">
            Add some notes so you remember what to focus on next time.
          </p>
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-col items-center gap-2 xl:w-auto xl:flex-row">
        {/* Lands on My Notes with the title already filled in and the cursor in
            the note box (direct instruction), so the coach arrives ready to type
            rather than having to restate which session they are writing about.
            The title is the rail's own stage label, which is also what the
            heading above this button says. */}
        <Link
          to={`/delivery/notes?title=${encodeURIComponent(`${stage.label} - how it went`)}`}
          className={cn(BANNER_CTA, 'xl:w-auto')}
        >
          Add notes
        </Link>
        {/* Dismiss unmounts this banner, so focus would fall to `<body>` —
            this project's most-repeated defect, shipped in six separate rounds.
            The parent moves focus to the pathway heading instead; see
            `TraineeHome`. */}
        <button
          ref={dismissRef}
          type="button"
          onClick={onDismiss}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full px-[18px] text-caption-medium text-primary underline underline-offset-2 outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring xl:w-auto"
        >
          Dismiss
        </button>
      </div>
    </section>
  )
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
function TrainingBanner({ reflecting }: { reflecting: boolean }) {
  const resuming = resumableModule()

  if (reflecting) {
    return (
      <section
        // Same geometry as the resume state, different palette: `yellow-200`
        // fill, `yellow-300` stroke, `purple-950` text. The CTA is the identical
        // white/`primary` pill all three states use — the frame keeps it purple
        // on the yellow ground rather than restyling it, which is also what
        // makes the three states read as one component changing clothes.
        //
        // **`yellow-300`, not `yellow-400`**, despite the frame's stroke style
        // being *named* `yellow/400`: its hex is `#FFCC4D`, which is this app's
        // `yellow-300`. The Figma names never caught up with the Round 21.3
        // renumbering, so the value is the authority and the name is not — the
        // app's own `yellow-400` is `#FFB600`, a visibly oranger line.
        className="flex flex-col items-center gap-6 overflow-hidden rounded-lg border border-yellow-300 bg-yellow-200 py-4 pl-4 pr-6 xl:flex-row xl:items-center xl:gap-12"
        data-node-id="607:8003"
      >
        <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-3 xl:flex-row xl:items-center">
          {/* `StageBlob`, not the plain `BannerBlob` — this banner was the only
              stage banner without the sticker layer (direct instruction).
              The **`notes`** variant specifically, because its back sheet is
              `back-yellow.svg`: this banner shares the `yellow-200` ground with
              the notes banner, where `expect`'s purple sheet would read as a
              foreign patch. */}
          <StageBlob variant="notes" className="self-center [--blob-scale:0.36] sm:[--blob-scale:0.75] xl:[--blob-scale:1] xl:self-start" />
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-center text-purple-950 xl:text-left">
            {/* Direct instruction. Sentence case per CLAUDE.md's copy rule, so
                "reflection" is lower case here — Title Case surviving that rule
                has been flagged as a defect in a previous round's critique.
                (The frame said "Self-reflection time!", an earlier pass "My
                reflection time!".) */}
            <h2 className="font-display text-display-md">Share your reflection</h2>
            <ReflectionPrompt className="text-body leading-[1.4] opacity-90" />
          </div>
        </div>
        {/* Unwired: the reflective-conversation flow does not exist yet (the
            Baseline/Midline/Endline tool is still a placeholder elsewhere in the
            app). Focusable `aria-disabled` with an `sr-only` reason per
            CLAUDE.md, never a silently dead button. */}
        <button
          type="button"
          aria-disabled="true"
          onClick={(e) => e.preventDefault()}
          // Primary filled, matching the Stage 5 card's own CTA below (direct
          // instruction). The two are the same action from two entry points, so
          // they carry the same weight rather than one reading as secondary.
          // Overridden here only — the other banner states keep `BANNER_CTA`'s
          // outline pill.
          className={cn(
            BANNER_CTA,
            'cursor-not-allowed border-primary bg-primary text-white hover:bg-primary-hover xl:w-[216px]',
          )}
        >
          {REFLECTION_CTA_LABEL}
          <span className="sr-only"> (coming soon)</span>
        </button>
      </section>
    )
  }

  if (resuming) {
    return (
      <section
        // `py-4 pl-4 pr-6` and a 165px height, both the frame's own: this state
        // is shorter than the intro purely because the blob is, and the frame
        // tightens the padding to match rather than leaving it floating in the
        // taller box.
        className="flex flex-col items-center gap-6 overflow-hidden rounded-lg bg-primary py-4 pl-4 pr-6 xl:flex-row xl:items-center xl:gap-12"
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
          className={cn(BANNER_CTA, 'xl:w-[216px]')}
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
        <Link to="/delivery/learning" className={cn(BANNER_CTA, 'xl:w-[232px]')}>
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
 * Icons are lucide, never the frame's exported SVGs (CLAUDE.md), and three were
 * changed from the frame's own choice to be **stage-specific** (direct
 * instruction) rather than generic:
 *
 * - `role-play` -> `Drama`. The export is literally a circle with an X through
 *   it, which every other UI in this app uses for "error" or "dismissed" — in a
 *   *progress* rail it read as a failed stage. `Drama`'s theatre masks are what
 *   role-play actually means.
 * - `message-square` -> `NotebookPen`. A speech bubble says "conversation"; the
 *   reflection is something the coach *writes*. This also matches the icon
 *   Round 19.1 already settled on for the app's own reflection panel, so the
 *   two surfaces now name the same concept with the same glyph.
 * - `video` -> `HeartHandshake`. `Video` is correct about the medium but it is
 *   the same glyph as the "Join Zoom" button further down this very page, so on
 *   one screen it meant both "a stage of your training" and "a button that
 *   opens a call". The stage is about delivering the intervention, not about
 *   the camera.
 *
 * `book-open`, `users`, `clipboard-check` and `award` were already specific and
 * are kept.
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
const STAGE_ICONS = [BookOpen, Users, Drama, ClipboardCheck, NotebookPen, HeartHandshake]

const PATHWAY_STAGES: PathwayStage[] = PATHWAY_STAGE_COPY.map((s, i) => ({
  ...s,
  icon: STAGE_ICONS[i],
}))

/** Index of the reflection stage, resolved by label rather than hardcoded to 4
 *  so reordering or inserting a stage cannot silently point the banner switch at
 *  the wrong one. */
export const REFLECTION_STAGE_INDEX = PATHWAY_STAGES.findIndex(
  (s) => s.label === 'My Reflection',
)

/**
 * The reflective-conversation flow has **two entry points** — the Stage 5
 * banner at the top of Home and the Stage 5 card below it — and the coach can
 * use either (direct instruction). They must open the same thing, so the label
 * lives here rather than being typed twice.
 *
 * Still unwired: the reflective-conversation tool does not exist yet (the
 * Baseline/Midline/Endline tool is a placeholder elsewhere in the app). When it
 * lands, wire **both** call sites — they are the same action.
 */
const REFLECTION_CTA_LABEL = 'Share my reflection'

/**
 * The reflection prompt, rendered by **both** entry points — the banner and the
 * Stage 5 card — so the two cannot drift apart (direct instruction: streamline
 * the card to the banner's copy).
 *
 * The stage it names is read off the rail rather than written in: the frame
 * hardcodes "Hands-on Assessment", which is only correct while reflection sits
 * at position 5.
 */
function ReflectionPrompt({ className }: { className?: string }) {
  const previousStage = PATHWAY_STAGES[REFLECTION_STAGE_INDEX - 1]?.label
  return (
    <p className={className}>
      You have completed your <span className="font-bold">{previousStage}</span> stage. We would now
      like you to reflect back on your experience.{' '}
      {/* Direct instruction. It lives in the shared prompt rather than only on
          the card, because "this is required of you" is not a fact that should
          be visible from one entry point and not the other. */}
      <span className="font-bold">Completing this reflection is mandatory.</span>
    </p>
  )
}

/** The stages whose Home card has its own variant. Resolved by label rather
 *  than hardcoded, for the same reason `REFLECTION_STAGE_INDEX` is: reordering
 *  or inserting a stage must not silently point these at the wrong one. */
const GROUP_PRACTICE_STAGE_INDEX = PATHWAY_STAGES.findIndex(
  (s) => s.label === 'Guided Group Practice',
)
const PEER_ROLE_PLAY_STAGE_INDEX = PATHWAY_STAGES.findIndex((s) => s.label === 'Peer Role-Play')
const ASSESSMENT_STAGE_INDEX = PATHWAY_STAGES.findIndex((s) => s.label === 'Hands-on Assessment')
const LIVE_INTERVENTION_STAGE_INDEX = PATHWAY_STAGES.findIndex(
  (s) => s.label === 'Live Intervention',
)

const STAGE_COUNT_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'] as const

/** The frame's own timeline width. The six stage columns are `flex-1` and the
 *  certification column a fixed 205px, which at this width resolves each stage
 *  to the frame's 155.67px exactly: (1379 - 205 - 6x40) / 6. */
const TIMELINE_W = 1379

function TrainingPathway({
  activeStage,
  onSelectStage,
  headingRef,
}: {
  activeStage: number
  onSelectStage: (index: number) => void
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
            {PATHWAY_STAGES.map((s, i) => (
              <div key={s.label} className="flex h-9 min-w-0 flex-1 items-center justify-center">
                <s.icon
                  aria-hidden="true"
                  className={cn('size-7', i <= activeStage ? 'text-purple-500' : 'text-ink-faint')}
                  strokeWidth={1.5}
                />
              </div>
            ))}
            <div className="flex h-9 w-[205px] shrink-0 items-center justify-center">
              <Award
                aria-hidden="true"
                className={cn(
                  'size-7',
                  activeStage >= PATHWAY_STAGES.length ? 'text-purple-500' : 'text-ink-faint',
                )}
                strokeWidth={1.5}
              />
            </div>
          </div>

          <div className="relative flex items-start gap-10" style={{ width: TIMELINE_W }}>
            {/* The rule is a **gradient**, not a flat tint: `purple-500` at the
                left fading to `hairline` by the right, so the run of completed
                pathway reads as warmer than what is still ahead. Frame values:
                left 64.75, width 1212.75, 1.5px, centred on the 36px dot. */}
            <div
              aria-hidden="true"
              className="absolute top-[17.25px] h-[1.5px] rounded-full"
              style={{
                left: 64.75,
                width: 1212.75,
                backgroundImage:
                  'linear-gradient(to right, var(--color-purple-500), var(--color-hairline))',
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
                      <span className="text-caption-medium leading-4 text-ink-faint">{s.stage}</span>
                      <span
                        className={cn(
                          'h-10',
                          isActive
                            ? 'text-[18px] font-bold text-purple-500'
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
            <div className="relative flex w-[205px] shrink-0 flex-col items-center gap-5">
              <PathwayDot active={activeStage === PATHWAY_STAGES.length} />
              <button
                type="button"
                onClick={() => onSelectStage(PATHWAY_STAGES.length)}
                aria-current={activeStage === PATHWAY_STAGES.length ? 'step' : undefined}
                className={cn(
                  'w-full cursor-pointer rounded-sm text-center text-body-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeStage === PATHWAY_STAGES.length
                    ? 'font-bold text-purple-500'
                    : 'text-ink-faint',
                )}
              >
                Congratulations!
                <br />
                You are now a certified
                <br />
                Sleep Coach!
              </button>
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
 * The asset is a 36px `purple-200` disc carrying an SVG drop-shadow filter:
 * `feMorphology erode 6` -> a -6px spread, `feOffset dy 6`, `feGaussianBlur
 * stdDeviation 8` -> a 16px CSS blur (blur is 2x the standard deviation), and
 * `feColorMatrix` 0.518/0.278/1 at 0.2 alpha -> `purple-500` at 20%.
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
        active && 'bg-purple-200 shadow-[0_6px_16px_-6px_rgba(132,71,255,0.2)]',
      )}
    >
      {/* A completed stage takes the active dot's own `purple-500` core but not
          its halo — the halo is what says "you are here", so it has to stay
          unique to one column. That gives the rail a run of purple behind the
          marker and grey ahead of it, which is the same thing the connector's
          own purple-to-hairline gradient already says. The frame has no
          completed state to transcribe, so this is built from its two existing
          dot states rather than invented as a third.
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
          done ? 'size-7' : 'size-6',
          active || done ? 'bg-purple-500' : 'bg-hairline',
        )}
      >
        {done && <Check className="size-3.5 text-white" strokeWidth={4} />}
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
  /** Optional second line. Rows grow to fit rather than clipping — the frame's
   *  64px is padding plus one line, not a fixed height. */
  detail?: string
  /** Overrides the list's action label for this row. */
  action?: string
  /** Overrides the list's icon for this row. */
  icon?: LucideIcon
  /** A real handler makes the row a working control; without one it renders as
   *  the project's unwired treatment (`aria-disabled` + an `sr-only` cue). */
  onSelect?: () => void
}

function StageList({
  heading,
  items,
  action,
  icon: Icon,
}: {
  heading: string
  items: readonly StageListItem[]
  action: string
  icon: LucideIcon
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <p className="text-body-md text-ink">{heading}</p>

      <ul className="flex list-none flex-col gap-2.5 p-0">
        {items.map((item) => {
          const RowIcon = item.icon ?? Icon
          const wired = !!item.onSelect
          return (
            <li key={item.name}>
              <button
                type="button"
                aria-disabled={wired ? undefined : 'true'}
                onClick={item.onSelect}
                className={cn(
                  'flex w-full items-center gap-3 rounded-sm border border-yellow-100 bg-yellow-50 px-3 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  wired && 'transition-colors hover:bg-yellow-100',
                )}
              >
                {/* The icon names the item, the label names the action — which
                    is why this is not a download glyph (direct instruction). */}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-card">
                  <RowIcon aria-hidden="true" className="size-5 text-primary" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body-md text-ink">{item.name}</span>
                  {item.detail && <span className="text-caption text-ink-muted">{item.detail}</span>}
                </span>
                <span className="shrink-0 text-caption-medium text-primary">
                  {item.action ?? action}
                  {/* Only the unwired rows carry the cue. */}
                  {!wired && <span className="sr-only"> (coming soon)</span>}
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
 * The locked session CTA — `676:2212`, hidden in the frame and built on direct
 * instruction. Also shared by Stages 2 and 3.
 *
 * Locked rather than absent, so the trainee can see the session exists and when
 * it opens. The caption carries the reason **visibly**; the `sr-only` span puts
 * it in the button's own accessible name too, because a caption sitting after a
 * control is not announced with it.
 */
function LockedSessionCta({ label }: { label: string }) {
  // The same record `MeetingCard` renders, so the two cannot disagree about
  // when the session is.
  const session = upcomingGroupSessions[0]

  return (
    // `mt-auto` pins the CTA to the bottom of the card. Every stage's card is
    // the same height (see `HomeStageCard`), so without it the CTA would sit
    // wherever that stage's content happened to end and move between stages.
    <div className="mt-auto flex flex-col items-center gap-3 px-6 py-4">
      <button
        type="button"
        aria-disabled="true"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-pearl px-[18px] text-caption-medium text-ink-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Lock aria-hidden="true" className="size-4" />
        {label}
        <span className="sr-only">
          {session
            ? ` (link activates on ${formatDate(session.date)}, the day of the session)`
            : ' (no session scheduled yet)'}
        </span>
      </button>
      <p className="text-caption text-ink-faint">Link activates on day of session</p>
    </div>
  )
}

/** The Stage 2 (Guided group practice) body — Figma `676:2187`. */
const GROUP_SESSION_RESOURCES: StageListItem[] = [
  { name: 'Session guidelines' },
  { name: 'SIPTEA component reference card' },
  { name: 'Peer feedback templates' },
]

function GroupSessionPrepCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="Group session prep"
      subtitle="Get ready for your upcoming online group session"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList
          heading="Important resources"
          items={GROUP_SESSION_RESOURCES}
          action="Download"
          icon={FileText}
        />
        <LockedSessionCta label="Join group session" />
      </div>
    </HomeStageCard>
  )
}

/**
 * The Stage 3 (Peer role-play) body. No frame — same template as Stage 2 with
 * its own resource list, on direct instruction.
 *
 * **"client", not "consumer"**: this is a coach-facing surface, and CLAUDE.md's
 * audience-dependent rule (Round 30) reserves "consumer" for researcher-facing
 * copy. The coach portal was verified at 0 occurrences of "consumer" and this
 * keeps that true. Flagged rather than silent, because the terminology table
 * also defines "Simulated consumer" as a role name — the two rules meet here.
 */
const PEER_ROLE_PLAY_RESOURCES: StageListItem[] = [
  {
    name: 'Simulated client profiles',
    detail: 'Sleep history, caregiving context and goals, plus your assigned observer',
  },
  { name: 'Session agenda' },
]

function PeerRolePlayPrepCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="Role-play session prep"
      subtitle="Get ready for your upcoming peer role-play session"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList
          heading="Important resources"
          items={PEER_ROLE_PLAY_RESOURCES}
          action="Download"
          icon={FileText}
        />
        <LockedSessionCta label="Join role-play session" />
      </div>
    </HomeStageCard>
  )
}

/**
 * The Stage 4 body. No frame — built from a written brief on direct
 * instruction.
 *
 * **One report, not four.** The brief names four sources of developmental
 * feedback (simulated clients, the expert assessor, cohort peers, the research
 * team observer), but the research team *collates* them — the trainee receives
 * a single consolidated report, so this is one row and not a list of four.
 * Showing four would imply four separate artefacts to chase, and would leak the
 * research team's own working structure onto a trainee's dashboard.
 *
 * The sources still appear, as the report's description: knowing the feedback
 * came from everyone in the room is the part that matters to a trainee.
 *
 * "clients", not "consumers" — coach-facing surface, per the audience rule.
 */
const PLACEMENT_FEEDBACK: StageListItem[] = [
  {
    name: 'Placement feedback report',
    detail: 'Collated by the research team from your clients, assessor, peers and observer',
  },
]

/**
 * The certification body — the state past Stage 6, when the coach has finished
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
      detail: 'Your Care2Sleep sleep coach certificate',
      action: 'Download',
      icon: Award,
      onSelect: onDownloadCertificate,
    },
    {
      name: 'What happens next',
      detail: 'How client assignment and supervision work now that you are certified',
      action: 'View',
    },
  ]

  return (
    <HomeStageCard
      nodeId="676:2187"
      title="You are a certified sleep coach"
      subtitle="Congratulations on completing the COACH pathway"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList heading="Important resources" items={items} action="View" icon={FileText} />
      </div>
    </HomeStageCard>
  )
}

/**
 * The Stage 6 (Live intervention) body. No frame — direct instruction: reuse
 * Stage 4's format with an intervention agenda.
 *
 * **At Stage 6 the trainee is still in training.** They run sessions
 * independently, but with *simulated* clients and an expert assessor watching —
 * this is not the live delivery portal with real clients, which is Phase 8 and
 * a different portal entirely. Round 32 fixed exactly this mis-reading in the
 * Stage 6 banner; the copy here keeps that premise.
 */
const LIVE_INTERVENTION_RESOURCES: StageListItem[] = [
  {
    name: 'Intervention agenda',
    detail: 'What to cover in each session, and what your assessor is looking for',
  },
]

function LiveInterventionCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="Live intervention prep"
      subtitle="Get ready to run your sessions independently"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList
          heading="Important resources"
          items={LIVE_INTERVENTION_RESOURCES}
          action="Download"
          icon={FileText}
        />
        {/* This stage runs sessions too, so it takes the same locked Zoom CTA —
            matching Stage 4, whose format this reuses. */}
        <LockedSessionCta label="Join intervention session" />
      </div>
    </HomeStageCard>
  )
}

/**
 * The Stage 5 (My reflection) body. No frame — direct instruction: a card that
 * lets the trainee give their reflection, opening the **same** flow as the
 * banner at the top of the page so they can start from either.
 */
function ReflectionCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="My reflection"
      subtitle="Look back on how your training has gone so far"
    >
      <div className="flex flex-1 flex-col gap-2">
        {/* **No yellow panel on this stage** (direct instruction): heading, then
            the copy directly beneath it, then the CTA after a gap. The other
            stages use the panel because they list discrete items a coach picks
            from; this stage is one prompt and one action, and boxing a single
            paragraph adds a container around nothing. */}
        <div className="flex flex-col gap-3 px-6 py-4">
          <p className="text-body-md text-ink">Share your reflection</p>
          <ReflectionPrompt className="text-body leading-[1.4] text-ink-muted" />
        </div>

        {/* Bottom-pinned like every other stage's CTA, so the control sits in
            the same place whichever stage the coach is on. Same action as the
            banner's CTA, so the label comes from the same constant; unwired for
            now, with the project's standard treatment. */}
        <div className="mt-auto flex items-center justify-center px-6 py-4">
          <button
            type="button"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
            className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {REFLECTION_CTA_LABEL}
            <span className="sr-only"> (coming soon)</span>
          </button>
        </div>
      </div>
    </HomeStageCard>
  )
}

function PlacementFeedbackCard() {
  return (
    <HomeStageCard
      nodeId="676:2187"
      title="Hands-on assessment outcome"
      subtitle="Your consolidated feedback, prepared by the research team"
    >
      <div className="flex flex-1 flex-col gap-2">
        <StageList
          heading="Important resources"
          items={PLACEMENT_FEEDBACK}
          action="View"
          icon={MessageSquare}
        />
        {/* This stage has a scheduled session too (direct instruction), so it
            takes the same locked Zoom CTA as Stages 2 and 3. */}
        <LockedSessionCta label="Join assessment session" />
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
                <Video aria-hidden="true" className="size-4" />
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
  const [dismissedNotes, setDismissedNotes] = useState<number[]>([])
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

  // The stage *before* the current one is the one there is something to write
  // up about — "what you can expect in this stage + add notes for previous
  // session" (direct instruction). So the prompt for Guided Group Practice
  // appears once the coach has moved on to Peer Role-Play, not while they are
  // still in it.
  //
  // Worth flagging: frame `637:10671` pairs Stage 2's expect banner with Stage
  // 2's *own* notes banner, which is the other reading. That frame's rail also
  // shows Stage 1 as "Ongoing" underneath a banner announcing Stage 2, so it is
  // a layout reference rather than a coherent state, and the written brief wins.
  // Flipping to same-stage pairing is changing `activeStage - 1` to
  // `activeStage` on the next line.
  const notesStage = activeStage - 1
  const showNotes =
    activeStage > 0 && STAGES_WITH_NOTES.has(notesStage) && !dismissedNotes.includes(notesStage)

  function dismissNotes(index: number) {
    setDismissedNotes((prev) => [...prev, index])
    // The control unmounts with the banner, so focus has to be sent somewhere
    // deliberate or it falls to `<body>`.
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
        {showNotes && (
          <StageNotesBanner index={notesStage} onDismiss={() => dismissNotes(notesStage)} />
        )}
        {activeStage === PATHWAY_STAGES.length ? (
          <CertificationBanner onDownloadCertificate={downloadCertificate} />
        ) : activeStage === 0 || activeStage === REFLECTION_STAGE_INDEX ? (
          <TrainingBanner reflecting={activeStage === REFLECTION_STAGE_INDEX} />
        ) : (
          STAGE_BANNER_COPY[activeStage] && <StageExpectBanner index={activeStage} />
        )}
      </div>

      <WaveDivider label="Track your progress here" />
      <TrainingPathway
        activeStage={activeStage}
        onSelectStage={setActiveStage}
        headingRef={pathwayHeadingRef}
      />

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
            (`HomeStageCard`); only the title, sub copy and body change.
            Stages 4-6 are not built yet and fall back to Stage 1's body — add
            a case here as each one arrives, one stage at a time. */}
        {activeStage === PATHWAY_STAGES.length ? (
          <CertifiedCard onDownloadCertificate={downloadCertificate} />
        ) : activeStage === GROUP_PRACTICE_STAGE_INDEX ? (
          <GroupSessionPrepCard />
        ) : activeStage === PEER_ROLE_PLAY_STAGE_INDEX ? (
          <PeerRolePlayPrepCard />
        ) : activeStage === ASSESSMENT_STAGE_INDEX ? (
          <PlacementFeedbackCard />
        ) : activeStage === REFLECTION_STAGE_INDEX ? (
          <ReflectionCard />
        ) : activeStage === LIVE_INTERVENTION_STAGE_INDEX ? (
          <LiveInterventionCard />
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
): PriorityItem[] {
  const items: PriorityItem[] = []

  /* Notes are **one short line** (direct instruction, twice: say something
     after the names, then simplify). The title already names the kind of job,
     so the note carries only what the title cannot — who, and the one date or
     action that matters. Two full sentences of guidance ("Read their sleep
     data before you meet") were the wordy version; a coach preparing for a
     session does not need to be told to read the data. */

  // 1. Newly assigned clients.
  for (const d of dyads) {
    if (!d.coachAssignedDate) continue
    if (d.coachAssignedDate < addDays(TODAY, -NEW_ASSIGNMENT_DAYS)) continue
    items.push({
      id: `new-${d.id}`,
      title: 'New client assigned',
      note: `${dyadFirstNames(d)}. Plan their sessions.`,
      to: `/delivery/consumers/${d.id}`,
    })
  }

  // 2. The next booked session per client.
  for (const d of dyads) {
    const next = nextPlannedSession(sessionPlans[d.id], sessionCompletion[d.id] ?? [])
    if (!next?.date) continue
    items.push({
      id: `next-${d.id}`,
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
              matching `PrioritiesSection`'s own. That one is 36px because it
              carries the alerts pill and "Dismiss all"; a bare `<h2>` beside it
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

        <PrioritiesSection items={priorities} className="min-w-0" />
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
