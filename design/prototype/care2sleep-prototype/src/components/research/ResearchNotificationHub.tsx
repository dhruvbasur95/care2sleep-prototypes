import { CalendarX, TriangleAlert, UserX } from 'lucide-react'
import { NotificationHubView, type NotificationItem } from '@/components/delivery/NotificationHub'
import { dyadHealthAlerts } from '@/pages/research/ConsumerDetailPage'
import { isPlanSet, type ConsumerDyad, type SessionPlan } from '@/data/spaces'
import type { Coach } from '@/data/research'
import { TODAY } from '@/data/format'

/**
 * Research Dashboard Home ("My Home", Round 20) — replaces the generic
 * Gmail/Calendar/Zoom/"Add widget" shortcut grid with the same real,
 * data-driven notification pattern Round 18 built for the Coach Delivery
 * Portal's `NotificationHub`. A researcher's "caseload" isn't one coach's
 * consumers — it's every trainee and every consumer in the study — so this
 * derives its own, study-wide notice list rather than reusing
 * `buildNotifications` directly, then renders through the exact same
 * `NotificationHubView` shell (green tint, dismissible tiles, 2x2 carousel)
 * so it reads as the same component family, just wired to different data.
 *
 * Notice types, each skipped entirely when there's no real data behind it
 * (never a placeholder/fabricated notice):
 * - Invite-pending trainees, called out once the invite has sat unanswered
 *   for a while (`inviteStatus === 'pending'`, aged off `enrolmentDate`)
 * - Consumers with no coach assigned yet (mirrors Consumer Management's own
 *   "Not assigned" logic — `!dyad.coachId`)
 * - Consumers with no session plan yet (mirrors Consumer Management's own
 *   "No sessions planned" logic — `!isPlanSet(sessionPlans[dyad.id])`)
 * - Fitbit/diary sync-gap alerts, rolled up study-wide via the exact same
 *   `dyadHealthAlerts` helper the per-consumer detail page and the coach's
 *   own `NotificationHub` already use — no duplicated gap-detection logic.
 *
 * Round 20.2 — traffic-light severity + re-sort (visual/ordering change only,
 * no detection logic touched): each item now also carries a `severity`
 * ('red' | 'amber' | 'green') via the shared, additive, backward-compatible
 * `NotificationItem.severity`/`NotificationItemCard` accent-stroke support in
 * `NotificationHub.tsx`. Researcher-priority mapping: not-assigned consumers
 * are 'red' (most urgent); pending invites and
 * missing session plans are 'amber'; Fitbit/diary sync-gap alerts are
 * deliberately downgraded to 'green' (the lowest/most-routine tier) per
 * direct user instruction — these are the most frequent, business-as-usual
 * category, even though each gap item still carries its historical
 * `tone: 'destructive'` field (kept untouched for any other consumer of this
 * item shape). The final return statement's array-spread order was changed
 * to match this severity ordering (red, red, amber, amber, green) — no
 * comparator/sort call was added, since every item within one category
 * already shares one severity tier.
 *
 * Round 21 (Figma frame `1:38`) — renders through `NotificationHubView`'s new
 * `layout="research"` chassis (heading + alert-count badge above a neutral
 * `parchment` panel, tiles 4-across, bar pagination) and every notice now
 * carries a real `actionLabel`/`actionTo` for the frame's per-card CTA. Each
 * destination is the page a researcher would actually need to open to resolve
 * that notice, so nothing here is an inert placeholder button. The subtitle,
 * header-icon and `text-caption` message overrides the Round 20 call site
 * passed are gone: the frame's attention section has no subtitle or header
 * icon, and `text-caption` is now this layout's own default.
 */

/** A pending invite this long unanswered is worth a researcher's attention;
 *  a same-day pending invite (e.g. one just created through "Add coach
 *  trainee") is normal and not yet notice-worthy. */
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

    // Sync-gap items are deliberately the lowest (green) severity tier, per
    // direct user instruction, even though they keep tone: 'destructive' —
    // these are the most routine/frequent notice category, not the most
    // urgent one.
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
      layout="research"
      title="Items that need your attention"
      uniformHeight={true}
      items={items}
      onEmptyChange={onEmptyChange}
      // Round 28, direct instruction: once every notice is dismissed the whole
      // section goes, rather than leaving an "all caught up" panel behind. It
      // also covers the genuinely-nothing-to-report case on load — a heading
      // announcing items that need attention, above a panel saying there are
      // none, is a section that only ever earns its space when non-empty.
      hideWhenEmpty
    />
  )
}
