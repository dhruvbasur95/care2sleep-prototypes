import { CalendarX, TriangleAlert, UserX } from 'lucide-react'
import { NotificationHubView, type NotificationItem } from '@/components/shared/NotificationHubView'
import { dyadHealthAlerts } from '@/pages/research/ConsumerDetailPage'
import { isPlanSet, type ConsumerDyad, type SessionPlan } from '@/data/spaces'
import type { Coach } from '@/data/research'
import { TODAY } from '@/data/format'

/**
 * Builds the study-wide "needs your attention" list for Research Home and
 * renders it through the shared `NotificationHubView` chassis. This file owns
 * the *rules*; the chassis owns the presentation.
 *
 * A researcher's caseload is every trainee and every consumer in the study, so
 * the four notice types are derived across the whole dataset. Each is skipped
 * entirely when there is nothing real behind it — there are no placeholder or
 * fabricated notices, and a card here always corresponds to a record.
 *
 * ⚠️ EVERY RULE HERE MIRRORS A RULE RENDERED SOMEWHERE ELSE, and they must
 * keep agreeing. A notice saying a consumer has no session plan, above a
 * Consumer Management row that says one exists, is the exact contradiction
 * this codebase has repeatedly shipped:
 *
 *  - not assigned      `!dyad.coachId`, same test Consumer Management's "Not
 *                      assigned" column uses.
 *  - no session plan    `isPlanSet()` from `data/spaces.ts`, the single source
 *                      of truth for the Session Plan chip, the "No sessions
 *                      planned" KPI, and the module-content gate.
 *  - sync gaps          `dyadHealthAlerts()`, the same helper the consumer
 *                      record page renders. Reuse it; do not reimplement.
 *  - pending invite     ages off `enrolmentDate` against `TODAY`.
 *
 * ⚠️ `dyadHealthAlerts` is imported from a **page component**
 * (`pages/research/ConsumerDetailPage`). That is a layering inversion — a
 * shared component depending on a page — and the >48h sync-gap rule it
 * encodes is domain logic that belongs in `data/spaces.ts`. Move both together
 * if you move either. Note also that the helper currently tests the last two
 * *array entries* rather than a real date difference, so it means something
 * different for a log with gaps in it.
 *
 * ⚠️ Nothing resolves a pending-invite notice. There is no invitation email
 * and no accept-invite endpoint, so `inviteStatus` can never leave `pending`
 * and this notice nags forever once a trainee crosses the threshold.
 *
 * Severity is a researcher-priority judgement, not a data property:
 * unassigned consumers are red; pending invites and missing plans amber; sync
 * gaps green, because they are the routine, high-frequency category. Ordering
 * comes from the spread order in the return statement — there is no sort,
 * because every item in a category shares one tier. Add a comparator if that
 * ever stops being true.
 */

/** A pending invite unanswered this long is worth a researcher's attention. A
 *  same-day pending invite — one just created through "Add coach trainee" — is
 *  normal and not yet notice-worthy.
 *
 *  This is study protocol expressed as a constant in a component. It belongs
 *  in shared config alongside the other protocol thresholds scattered across
 *  the pages (the certified-period window, the sync-gap threshold, the
 *  graduated-phase number). */
const PENDING_INVITE_ALERT_DAYS = 21

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime()
  const to = new Date(toIso).getTime()
  return Math.round((to - from) / (1000 * 60 * 60 * 24))
}

function buildResearchNotifications(
  coaches: Coach[],
  dyads: ConsumerDyad[],
  sessionPlans: Record<string, SessionPlan>,
): NotificationItem[] {
  const inviteItems: NotificationItem[] = []
  const gapItems: NotificationItem[] = []
  const notAssignedItems: NotificationItem[] = []
  const noPlanItems: NotificationItem[] = []

  for (const coach of coaches) {
    if (coach.inviteStatus === 'pending' && daysBetween(coach.enrolmentDate, TODAY) >= PENDING_INVITE_ALERT_DAYS) {
      inviteItems.push({
        id: `${coach.id}-invite-pending`,
        icon: UserX,
        message: `${coach.fullName}'s platform invite is still pending.`,
        severity: 'amber',
        actionLabel: 'View invite',
        actionTo: `/research/coaches/${coach.id}`,
      })
    }
  }

  for (const dyad of dyads) {
    const title = dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name

    // Green despite the legacy `tone: 'destructive'`, which nothing reads.
    // Sync gaps are the routine, high-frequency category, not the urgent one.
    dyadHealthAlerts(dyad).forEach((alert, i) => {
      gapItems.push({
        id: `${dyad.id}-gap-${i}`,
        icon: TriangleAlert,
        message: alert,
        tone: 'destructive',
        severity: 'green',
        actionLabel: 'Check sync',
        actionTo: `/research/consumers/${dyad.id}`,
      })
    })

    if (!dyad.coachId) {
      // ⚠️ BROKEN FLOW, not scaffolding. This CTA navigates successfully but
      // lands somewhere with no coach-assignment control: the consumer record
      // page's "Assigned Coach" tab was removed. The only working assign path
      // is from the coach side — /research/spaces-coaches/:id -> Assigned
      // Consumers -> "Assign consumer", which calls `transferDyad`. Repoint
      // this, or restore an assign control on the consumer record.
      notAssignedItems.push({
        id: `${dyad.id}-not-assigned`,
        icon: UserX,
        message: `${title} still has no coach assigned.`,
        severity: 'red',
        actionLabel: 'Assign a coach',
        actionTo: `/research/consumers/${dyad.id}`,
      })
    }

    if (!isPlanSet(sessionPlans[dyad.id])) {
      noPlanItems.push({
        id: `${dyad.id}-no-plan`,
        icon: CalendarX,
        message: `No session plan has been built yet for ${title}.`,
        severity: 'amber',
        actionLabel: 'View consumer',
        actionTo: `/research/consumers/${dyad.id}`,
      })
    }
  }

  return [...notAssignedItems, ...inviteItems, ...noPlanItems, ...gapItems]
}

export function ResearchNotificationHub({
  coaches,
  dyads,
  sessionPlans,
  onEmptyChange,
}: {
  coaches: Coach[]
  dyads: ConsumerDyad[]
  sessionPlans: Record<string, SessionPlan>
  /** Forwarded straight through — see `NotificationHubView`'s own note. Lets
   *  the Home page close the gap this section leaves once it hides itself. */
  onEmptyChange?: (isEmpty: boolean) => void
}) {
  const items = buildResearchNotifications(coaches, dyads, sessionPlans)
  return (
    <NotificationHubView
      title="Items that need your attention"
      uniformHeight={true}
      items={items}
      onEmptyChange={onEmptyChange}
      // The section only earns its space when non-empty: a heading announcing
      // items that need attention, above a panel saying there are none, is
      // worse than no section. Covers both the all-dismissed case and the
      // genuinely-nothing-to-report case on load.
      hideWhenEmpty
    />
  )
}
