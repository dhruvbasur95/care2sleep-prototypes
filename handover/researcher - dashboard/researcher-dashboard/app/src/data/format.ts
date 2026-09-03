/**
 * The application clock and its display formatters.
 *
 * Imported directly by ~10 page components as well as by `research.ts` /
 * `spaces.ts` / `research-store.tsx`. Everything here is a plain constant or
 * pure function — no React, no state.
 *
 * DO NOT move these back into `research-store.tsx`. That module exports the
 * `ResearchProvider` component; Vite's React Fast Refresh treats any module
 * with both component and non-component exports as un-refreshable, so an edit
 * anywhere that cascades into re-evaluating it silently remounts the provider
 * and resets all in-memory state to seed data. This file exists purely to keep
 * that cascade out of the provider's module. (`research-context.ts` exists for
 * the same reason.)
 *
 * DATE/TIME CONVENTIONS ACROSS THE DATA LAYER
 * - Dates are bare `YYYY-MM-DD` strings, compared with `>` / `localeCompare`.
 *   No `Date` objects are stored anywhere.
 * - Times are 24-hour `"HH:MM"` strings — with one exception: the Consensus
 *   Sleep Diary (`spaces.ts`'s `SleepDiaryAnswers`) stores free-form
 *   `"10:00 pm"` strings, parsed by `parseTimeToMinutes`. Two time formats
 *   coexist in one schema; check which one a field uses before comparing.
 */

/**
 * The app's "now". A frozen constant, not `new Date()` — the whole seed
 * dataset is authored around this date, so replacing it with a real clock
 * requires re-dating the fixtures at the same time.
 *
 * It is not cosmetic. It drives the Upcoming/Scheduled split on the home page,
 * "sessions this week", pending-invite ageing, the "certified this period" KPI
 * window, the guard that blocks marking a future session complete, and the
 * timestamp on every store write. Treat it as the single injection point for a
 * real clock.
 *
 * Known inconsistency: the store's `toggleSession` stamps `completedDate` from
 * `TODAY` but `completedTime` from the real machine clock, so one record can
 * carry two notions of "now". The note-creation forms do the same. Pick one
 * clock before wiring a backend.
 */
export const TODAY = '2026-07-22'

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${d} ${months[(m ?? 1) - 1]} ${y}`
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
