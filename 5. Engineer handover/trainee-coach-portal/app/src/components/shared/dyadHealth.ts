/**
 * Dyad-level derived helpers shared across portals.
 *
 * Extracted verbatim from the Research Dashboard's `ConsumerDetailPage.tsx`
 * for the coach-portal handover package: that page is not part of this
 * package, but these helpers are read by coach-portal surfaces. Behaviour is
 * unchanged — only the file they live in.
 */
import type { ConsumerDyad, HealthLogEntry } from '@/data/spaces'

/** A dyad's display title. Lives here rather than being duplicated in the
 *  two extracted components that both need it (`ProfileDetailsSections`,
 *  `SleepHealthData`) — two copies of one string format is exactly the drift
 *  this project keeps paying for. */
export function dyadTitle(dyad: ConsumerDyad): string {
  return dyad.patient ? `${dyad.patient.name} & ${dyad.carer.name}` : dyad.carer.name
}

/** A run of 2+ consecutive days (most recent first) failing a check — the
 *  ">48 hours" threshold from plan §2c, expressed against the 5-day daily log. */
export function hasRecentGap(log: HealthLogEntry[], failing: (e: HealthLogEntry) => boolean): boolean {
  if (log.length < 2) return false
  return log.slice(-2).every(failing)
}

/** Data Health Alerts (plan §2c). Checks both dyad members independently,
 *  since sync/diary gaps aren't necessarily shared.
 *
 *  As of Round 37 neither this page nor the Coach Delivery Portal's own
 *  renders a sync banner beside the Fitbit table — the remaining readers are
 *  both notification hubs and the Consumer Portal's page-level banner. */
export function dyadHealthAlerts(dyad: ConsumerDyad): string[] {
  const members: { label: string; log: HealthLogEntry[] }[] = []
  if (dyad.patient) members.push({ label: dyad.patient.name, log: dyad.patientLog })
  members.push({ label: dyad.carer.name, log: dyad.carerLog })

  const alerts: string[] = []
  for (const m of members) {
    if (hasRecentGap(m.log, (e) => !e.synced)) {
      alerts.push(`${m.label}’s Fitbit hasn’t synced in over 48 hours.`)
    }
    if (hasRecentGap(m.log, (e) => !e.diaryEntry)) {
      alerts.push(`${m.label}’s sleep-diary entries have stopped for over 48 hours.`)
    }
  }
  return alerts
}
