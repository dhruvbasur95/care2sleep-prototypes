import { CalendarPlus } from 'lucide-react'
import { DeliveryShell } from '@/components/delivery/DeliveryShell'
import {
  InertButton,
  MeetingsSection,
  type ScheduleRow,
} from '@/components/shared/MeetingsSection'
import { useCoachStage } from '@/data/coachStage'
import { useResearch } from '@/data/research-context'
import { upcomingGroupSessions } from '@/data/research'
import { dyadsForCoach } from '@/data/spaces'
import {
  nextSessionRowsForDyads,
  upcomingSessionRowsForDyads,
} from '@/pages/delivery/DeliveryHomePage'

const COACH_ID = 'helen-zhang'

/**
 * Coach Delivery Portal — My meetings (Round 29, direct instruction).
 *
 * The day-grouped meetings table started on Home for both coach stages, then
 * moved here to its own sidebar destination directly after Home. Its title and
 * schedule action live in the page hero rather than inline above the tabs, so
 * `MeetingsSection` renders with `showHeader={false}`.
 *
 * The rows differ by stage, which is the whole reason this page reads the
 * stage at all:
 * - **trainee** — their cohort's group practice sessions.
 * - **coach** — their consumers' planned catch-ups and ad-hoc meetings.
 *
 * Both are built from the same sources Home's own KPI and attention cards
 * count, so a coach can never see one number here and a different one there.
 */
export function DeliveryMeetingsPage() {
  const stage = useCoachStage()
  const { consumerDyads, sessionPlans, sessionCompletion } = useResearch()
  const trainee = stage === 'trainee'

  const dyads = dyadsForCoach(COACH_ID).map(
    (seedDyad) => consumerDyads.find((d) => d.id === seedDyad.id) ?? seedDyad,
  )

  const traineeRows: ScheduleRow[] = upcomingGroupSessions.map((g) => ({
    key: `group-${g.date}-${g.time}`,
    title: g.title,
    attendeeNames: [g.withWhom],
    sessionType: 'Group practice',
    date: g.date,
    time: g.time,
    meetingId: g.meetingId,
    zoomLink: g.zoomLink,
  }))

  /* Round 40, direct instruction: a session mapped to a client gets no Edit or
     Delete here. The two sources are kept separate rather than merged first
     precisely so that distinction survives — they were being flattened into one
     `'Client session'` label, which is also why both carried the same actions.

     A planned session's date lives in the session plan and is changed there,
     where the module target date and the rest of the arc move with it. An
     ad-hoc meeting is this coach's own one-off and stays fully editable. */
  /* Both helpers are called **one dyad at a time** rather than over the whole
     caseload. They flatten the dyad away internally, and every row here needs
     to name the client whose record "View details" opens — recovering that from
     `r.key` would be parsing an id back out of a string this page does not own.
     The helpers themselves are untouched; their other two callers do not need
     the dyad and still pass the full list. */
  const plannedRows: ScheduleRow[] = dyads.flatMap((d) =>
    nextSessionRowsForDyads([d], sessionPlans, sessionCompletion).map((r) => ({
      key: r.key,
      title: r.title,
      attendeeNames: r.subtitle ? [r.subtitle] : [],
      sessionType: 'Planned client session',
      date: r.date,
      time: r.time,
      meetingId: r.meetingId,
      zoomLink: r.zoomLink,
      readOnly: true,
      detailsHref: `/delivery/consumers/${d.id}`,
      hideStart: true,
    })),
  )

  const adHocRows: ScheduleRow[] = dyads.flatMap((d) =>
    upcomingSessionRowsForDyads([d], sessionPlans).map((r) => ({
      key: r.key,
      title: r.title,
      attendeeNames: r.subtitle ? [r.subtitle] : [],
      sessionType: 'Ad-hoc meeting',
      date: r.date,
      time: r.time,
      meetingId: r.meetingId,
      zoomLink: r.zoomLink,
      /* An ad-hoc meeting is with a client too, so it gets the same route
         through, and the same reason for not starting from here. It keeps Edit
         and Delete — only the *planned* rows are owned by the session plan. */
      detailsHref: `/delivery/consumers/${d.id}`,
      hideStart: true,
    })),
  )

  const coachRows: ScheduleRow[] = [...plannedRows, ...adHocRows]
    .filter((r) => r.date)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  return (
    /* Round 40, direct instruction: streamlined onto the same page shape as My
       Notes and My Learning. The yellow hero band this page carried since Round
       29 was the only one left in the coach portal — every other destination
       puts its title in the content column as `display-lg text-primary` over a
       `sub-greeting`, with the shell's flush 64px inset. Restoring the nav entry
       is what made the difference visible: two nav rows apart, one page opened
       inside a tinted band and the others did not. */
    <DeliveryShell
      accountLabel="Helen Zhang"
      // Same flush column and 64px top inset as Home, My Learning and My Notes.
      contentClassName="px-0 pt-16 md:px-0 md:pt-16"
    >
      <div className="flex flex-col gap-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* Round 40: "My meetings" -> "My schedule", matching the nav label
                the entry was restored under. A nav row and the page it opens
                must not name themselves differently. Sentence case, like
                "My notes" — the nav is title case, the pages are not. */}
            <h1 className="font-display text-display-lg text-primary">My schedule</h1>
            <p className="text-sub-greeting leading-[1.4] text-ink">
              {trainee
                ? 'Your group practice and placement sessions, grouped by day.'
                : 'Your client sessions and ad-hoc meetings, grouped by day.'}
            </p>
          </div>
          {/* Same inert treatment as every other drawn-but-unwired control in
              this app: focusable, announced, and visually indistinguishable
              from a live primary pill. */}
          <InertButton
            label="Schedule new meeting"
            appearance="active"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
          >
            <CalendarPlus aria-hidden="true" className="size-4" strokeWidth={2} />
          </InertButton>
        </div>

        <MeetingsSection
          rows={trainee ? traineeRows : coachRows}
          showHeader={false}
          idNamespace="delivery-meetings"
        />
      </div>
    </DeliveryShell>
  )
}
