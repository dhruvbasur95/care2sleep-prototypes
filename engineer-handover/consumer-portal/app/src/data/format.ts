/**
 * Shared date/time formatting helpers + the prototype's fixed "today" constant.
 *
 * Split out of `research-store.tsx` (Round 6.2.1 fix) so these plain
 * constants/functions no longer live in the same module as `ResearchProvider`/
 * `useResearch`. That file mixes component and non-component exports, which
 * defeats React Fast Refresh: Vite can't hot-update a module exporting both,
 * so ANY edit to research-store.tsx (or a file that forces it to re-evaluate)
 * falls back to a full silent page reload — invisibly remounting
 * `ResearchProvider` and wiping all in-memory session state (e.g. a just-
 * submitted annotation summary) back to seed data. Since `formatDate`/
 * `formatTime`/`TODAY` are imported directly by ~10 page components, keeping
 * them in `research-store.tsx` meant almost any edit anywhere in the app's
 * data layer could trigger this reset. Moving them here (a file with no
 * component exports at all) removes that cascade at the root, rather than
 * patching around it.
 */

/**
 * Prototype "today". **The whole package's sense of time comes from here.**
 *
 * ⚠️ This is a FROZEN CLOCK, and it is the single most important thing to know
 * about the seed data. Every "completed" / "scheduled" / "overdue" judgement in
 * the portal compares an ISO string against this constant — nothing calls
 * `new Date()` except Home's greeting (see `ConsumerHomePage`, and note that
 * the two disagreeing is deliberate there, not a bug in this file).
 *
 * It was `2026-07-22`, which had drifted BEHIND the seed: `dyad-011` carried
 * sessions completed on 5 Aug and 19 Aug, two coach reflections dated the same,
 * and three module activity dates in August — all of them in this constant's
 * future. Seven data invariants failed, and it was visible on screen as
 * "Completed — Session 02 — Wed 5 Aug" sitting in a portal whose today was July.
 *
 * `2026-08-26` is not arbitrary. The dyad's plan runs weekly on Wednesdays, so
 * this is exactly one week after the last completed session (Wed 19 Aug) and
 * one week before the next scheduled one (Wed 2 Sep) — the moment in the arc
 * where a consumer has finished a catch-up and is working through the module
 * before the next one.
 *
 * **When you replace the seed with a real backend, delete this and the
 * comparisons that read it** — see `docs/integration-points.md` §2. Until then,
 * if you move it, run `docs/seed-invariants.mjs`, which asserts that no
 * completed thing is in the future and no scheduled thing is in the past.
 */
export const TODAY = '2026-08-26'

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${d} ${months[(m ?? 1) - 1]} ${y}`
}

/** Sleep length as "6h 12m".
 *
 *  Round 39. `ConsumerDetailPage` already inlines this exact expression in
 *  three places (`FitbitLogTable`, the comparative table, and its CSV row
 *  builder); this exists so the coach's pre-session snapshot is not a fourth
 *  copy. Folding those three onto it is a mechanical follow-up, deliberately
 *  not done here — it would put three unrelated tables in this diff. */
export function formatSleepDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/**
 * Long form with the weekday spelled out — "Tuesday, 8 September 2026".
 *
 * Round 39, for the coach's "Upcoming session details" card (frame
 * `728:4571`). The weekday is the point: a coach reading *when is my next
 * session* thinks in days of the week, and `formatDate`'s "8 Sep 2026" makes
 * them work that out. Every other surface keeps the compact form — this is
 * deliberately not a replacement.
 *
 * Built from the ISO string's own parts rather than `new Date(iso)` +
 * `toLocaleDateString`, for the timezone reason documented on
 * `toLocalISODate` below: parsing "2026-09-08" yields UTC midnight, which is
 * the *previous* day's evening anywhere ahead of UTC (e.g. Melbourne), so the
 * weekday would be wrong by one for every date in the app. The weekday index
 * comes from a UTC-constructed Date, which is safe because it is read back
 * with `getUTCDay()`.
 */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const weekday = days[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${weekday}, ${d} ${months[m - 1]} ${y}`
}

/** Session times are stored 24-hour ("14:00") — render 12-hour with AM/PM
 *  so a bare hour never reads as ambiguous between morning and afternoon. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/** Formats a `Date` as a local "YYYY-MM-DD" — `toISOString()` converts to
 *  UTC first, which silently shifts the date by a day in timezones ahead of
 *  UTC (e.g. Melbourne); this reads the Date's own local components instead. */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}
