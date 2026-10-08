#!/usr/bin/env node
/**
 * Care2Sleep Consumer Portal — seed-data invariant check.
 *
 *   npx tsx docs/seed-invariants.mjs
 *
 * Exits 0 when the seed is internally consistent, 1 with a report when it is
 * not. Run it after ANY change to `TODAY` or to `data/spaces.ts`.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * There is no backend. The portal's entire sense of time is one frozen constant
 * (`data/format.ts`'s `TODAY`), and every "completed" / "scheduled" / "overdue"
 * label is a string comparison against it. That makes a whole class of bug
 * possible that no type checker can see: seed data drifting past the clock, so
 * the UI cheerfully renders a session "Completed" on a date that has not
 * happened yet, or "Scheduled" for one that already passed.
 *
 * That is not hypothetical — it is what this package was handed. `TODAY` was
 * 2026-07-22 while the demo consumer had sessions completed on 5 Aug and 19 Aug
 * and three module activity dates in August: seven failing invariants, all
 * visible on screen.
 *
 * The standing project rule is that data shown on screen must be internally
 * consistent, and that two surfaces showing the same fact must read the same
 * field. This script enforces the first half mechanically.
 */
import { TODAY } from '../app/src/data/format.ts'
import { consumerDyads } from '../app/src/data/spaces.ts'

const fail = []
const ok = []
const check = (cond, msg) => (cond ? ok.push(msg) : fail.push(msg))

console.log(`Seed invariants — frozen clock TODAY = ${TODAY}\n`)

for (const d of consumerDyads) {
  const who = `${d.id}`

  for (const s of d.sessionsCompleted ?? [])
    check(
      s.completedDate <= TODAY,
      `${who}: session ${s.session} is marked COMPLETED on ${s.completedDate}, which is after TODAY`,
    )

  for (const m of d.moduleEngagement ?? [])
    if (m.lastActivityDate)
      check(
        m.lastActivityDate <= TODAY,
        `${who}: module "${m.moduleId}" has lastActivityDate ${m.lastActivityDate}, after TODAY`,
      )

  for (const [label, log] of [['patientLog', d.patientLog], ['carerLog', d.carerLog]])
    for (const e of log ?? [])
      check(e.date <= TODAY, `${who}: ${label} entry dated ${e.date}, after TODAY`)

  /* ⚠️ Staleness, not just future-dating. The "no entry after TODAY" check
     above passes happily on a log that stopped a year ago, and that is exactly
     how a real bug hid here: `healthLog()` had `TODAY` transcribed as a literal
     rather than read, so when the clock moved forward every dyad's log silently
     ended 35 days behind it. Nothing rendered it, so nothing complained. */
  for (const [label, log] of [['patientLog', d.patientLog], ['carerLog', d.carerLog]]) {
    const latest = (log ?? []).map((e) => e.date).sort().at(-1)
    if (!latest) continue
    const daysStale = Math.round((Date.parse(TODAY) - Date.parse(latest)) / 86400000)
    check(
      daysStale <= 2,
      `${who}: most recent ${label} entry is ${latest}, ${daysStale} days before TODAY — the log should run up to the clock`,
    )
  }

  const done = new Set((d.sessionsCompleted ?? []).map((s) => s.session))
  for (const row of d.sessionPlan?.rows ?? []) {
    if (done.has(row.session)) continue
    check(
      row.date >= TODAY,
      `${who}: session ${row.session} is NOT completed but is scheduled for ${row.date}, before TODAY`,
    )
  }

  for (const r of d.annotationSummaries ?? [])
    check(r.date <= TODAY, `${who}: reflection dated ${r.date}, after TODAY`)

  // A module cannot still read "in progress" once its own catch-up has been held.
  for (const row of d.sessionPlan?.rows ?? []) {
    if (!done.has(row.session) || !row.moduleId) continue
    const m = (d.moduleEngagement ?? []).find((x) => x.moduleId === row.moduleId)
    if (!m) continue
    check(
      m.status !== 'in-progress',
      `${who}: module "${row.moduleId}" is still "in-progress" but its session ${row.session} is already complete`,
    )
  }
}

console.log(`${ok.length} invariant(s) hold.`)
if (fail.length) {
  console.error(`\n${fail.length} FAILING:\n`)
  for (const f of fail) console.error('  ' + f)
  process.exit(1)
}
console.log('Seed is internally consistent.')
