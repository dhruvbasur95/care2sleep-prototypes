/**
 * THE SPACES DELIVERY DOMAIN — everything about live intervention delivery:
 * consumers and their carers, the coaches assigned to them, the 7-session arc,
 * the consumer-facing content modules, Fitbit and sleep-diary data, and the
 * notes written about all of it.
 *
 * Its counterpart is `research.ts`, which owns the COACH training pathway. A
 * coach's identity (name, employer, certification) lives THERE; this file adds
 * only what is specific to delivery, joined by `Coach.id` via
 * `SpacesCoach.coachId` and `ConsumerDyad.coachId`.
 *
 * SEED vs LIVE. `spacesCoaches`, `consumerDyads`, `supervisionNotes` and
 * `researchNotes` are initial values only. `research-store.tsx` copies them
 * into React state at boot; pages read the store copy. Two fields on
 * `ConsumerDyad` go stale immediately and deliberately — `sessionsCompleted`
 * and `sessionPlan` are lifted into their own store slices at boot and never
 * written back. Never read either from a dyad object.
 *
 * THE THING THAT WILL CATCH YOU OUT: one module has three different numbers.
 *
 *   internal session N  -->  displayed to everyone as "Session N-1"
 *   internal session 1  -->  displayed as "Planning", never as a number
 *   module at index N   -->  UNLOCKED BY internal session N
 *   module at index N   -->  REVIEWED BY internal session N+1
 *   module at index N   -->  displayed to the consumer as "Module N+1"
 *
 * Internal session numbers are 1-7 and are never renumbered — they key stored
 * data everywhere. Nothing internal may reach UI copy: route every displayed
 * number through `displaySessionNumber()` or, when the input might be 1,
 * `sessionRowLabel()`. And "N of 6" figures use `catchupSessionsCompleted()`,
 * which excludes the unnumbered Planning session, against
 * `SPACES_CATCHUP_COUNT` — not `SPACES_SESSIONS.length`.
 *
 * NO DEVICE, NO ZOOM, NO FILES. `HealthLogEntry[]` on a dyad is where a
 * nightly Fitbit sync would land; there is no Fitbit client. Zoom meeting ids
 * and links are fabricated but render as real, clickable `zoom.us` URLs.
 * `ConsentDocument` stores a filename only — the uploaded file is discarded.
 *
 * People, organisations and clinical narratives here are fabricated.
 */

import { toLocalISODate } from './format'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * The two onboarding axes on a `SpacesCoach`: has the coach been invited into
 * SPACES delivery, and have they actually joined.
 *
 * ⚠️ EFFECTIVELY WRITE-ONLY. `inviteCoach` sets both on every onboarding, but
 * no screen displays either — their chips and label maps were dropped as
 * zero-reader code. The single exception is `joinedStatus`, which gates who
 * appears as a transfer target for a consumer. So today a researcher onboards
 * a coach and is never told whether that coach accepted or joined.
 *
 * Keep the types and the fields — that state is genuinely recorded and a real
 * build will want to surface it — but do not assume it is visible.
 */
export type InvitationStatus = 'invited' | 'accepted' | 'declined'
export type JoinedStatus = 'not-joined' | 'joined'

/**
 * The fixed 7-session SPACES arc: one Planning session plus one catch-up per
 * consumer module.
 *
 * `number` is the INTERNAL key, 1-7. It keys `sessionCompletion`,
 * `sessionRecordings`, `sessionPlans` and every seeded dyad — never renumber
 * it, and never render it. See the numbering table in the file header.
 *
 * Internal session 1 ("Planning") is the coach and consumer's first meeting,
 * where they agree the module target dates and the catch-ups that follow. It
 * is NOT the "Getting started" onboarding module (`CONSUMER_MODULES[0]`),
 * which is separate always-available content the consumer can open at any
 * time. Planning is never shown as a number.
 *
 * Internal sessions 2-7 are the catch-ups the consumer reads as Sessions 1-6:
 * the coach reviews the module just finished, and completing the session
 * unlocks the next module — see `moduleUnlockState`.
 */
export interface SpacesSession {
  number: number
  name: string
}

export const SPACES_SESSIONS: SpacesSession[] = [
  { number: 1, name: 'Planning' },
  { number: 2, name: 'Post-Module 1' },
  { number: 3, name: 'Post-Module 2' },
  { number: 4, name: 'Post-Module 3' },
  { number: 5, name: 'Post-Module 4' },
  { number: 6, name: 'Post-Module 5' },
  { number: 7, name: 'Post-Module 6' },
]

/** Internal session number -> the number a user reads. ONLY safe for the 6
 *  real catch-ups (internal 2-7). Passing 1 yields 0, and "Session 0" must
 *  never appear anywhere — use `sessionRowLabel()` when the input could be 1. */
export function displaySessionNumber(internalNumber: number): number {
  return internalNumber - 1
}

/** THE display label for any session, including the Planning one: "Planning"
 *  or "Session 1".."Session 6". Prefer this over `displaySessionNumber()`
 *  whenever the input is not provably a catch-up — iterating `SPACES_SESSIONS`,
 *  or reading a legacy `upcomingSession` that may still hold a stale 1.
 *
 *  It labels a session; it does not decide whether that session is a real
 *  upcoming item. For that, use `nextUpcomingSessionEntry()`. */
export function sessionRowLabel(internalNumber: number): string {
  return internalNumber === 1 ? 'Planning' : `Session ${displaySessionNumber(internalNumber)}`
}

/** A session the coach has marked complete, with when it happened. Both date
 *  and time are shown, so both are stored — the date is the ordering key.
 *
 *  Completion is expected to be prefix-closed: if session N is complete, every
 *  session below N is too. Every "next session" helper assumes this. */
export interface SessionCompletionRecord {
  session: number
  completedDate: string
  completedTime: string
}

/**
 * THE denominator for every "N of 6" session figure a user sees — the count of
 * numbered catch-ups, one fewer than `SPACES_SESSIONS` because Planning is not
 * numbered.
 *
 * Do not use `SPACES_SESSIONS.length` for a progress figure. It produced a
 * dyad reading "1 of 7 sessions completed" directly beside "Next Session:
 * Session 1" — two numbers about one consumer that cannot both be true.
 */
export const SPACES_CATCHUP_COUNT = SPACES_SESSIONS.length - 1

/**
 * THE source of truth for "how many sessions has this consumer done" — counts
 * only the 6 numbered catch-ups, never the Planning session.
 *
 * Planning is already represented separately by the "Session Plan: Created"
 * chip, so counting it here would report it twice. Use this on every surface
 * showing the figure; hand-counting `sessionsCompleted.length` is the bug it
 * exists to prevent.
 */
export function catchupSessionsCompleted(completed: SessionCompletionRecord[]): number {
  return completed.filter((c) => c.session !== 1).length
}

/**
 * ⚠️ LEGACY. A dyad's single "next session" field, from before whole-arc
 * session planning existed. Superseded by `SessionPlan`, kept only as a
 * fallback for a dyad that has no plan yet.
 *
 * Older seed values can still hold `session: 1` from before the numbering
 * correction, which would render as "Session 0". Every reader must go through
 * `nextUpcomingSessionEntry()`, which guards against exactly that. Do not read
 * this field directly.
 */
export interface UpcomingSession {
  session: number
  date: string
  time: string
  meetingId: string
  zoomLink: string
}

/**
 * One row of a dyad's session plan. `date`/`time` are undefined until planned;
 * a plan with every row dated is "set" (`isPlanSet`).
 *
 * `moduleTargetDate` applies only to internal sessions 2-7 — it is the date
 * the consumer should have finished the module that this catch-up reviews.
 * It MUST fall strictly before the row's own `date`: the consumer completes
 * the module, then the coach catches up on it, never the reverse. That holds
 * by construction because `generatePlanRows()` is the only writer of fresh
 * dates and per-row date editing was removed from the wizard.
 *
 * `moduleTargetDate` is a target the coach communicates, NOT the unlock
 * trigger. What actually unlocks a module is completing the previous session —
 * see `moduleUnlockState`.
 */
export interface SessionPlanRow {
  session: number
  date?: string
  time?: string
  moduleTargetDate?: string
  /** Flagged when a row's date changes after already being set, shown as a
   *  "Rescheduled" indicator. Manual and single-row — rescheduling one session
   *  never cascades to later ones.
   *
   *  ⚠️ Two writers disagree about when to set this. `bulkSetSessionPlan`
   *  compares old and new dates, which matches the contract;
   *  `updateSessionPlanRow` sets it for ANY patch to an already-dated row, so
   *  editing only `moduleTargetDate` falsely reports the session as moved.
   *  Latent only because that action has no caller. Prefer deriving this from
   *  a change history rather than storing a boolean two paths can disagree on. */
  rescheduled?: boolean
  /** Fabricated, generated when the row is first dated. Renders as a live
   *  `zoom.us` link — see the file header. */
  meetingId?: string
  zoomLink?: string
}

/** A one-off meeting outside the fixed 7-session arc — a deliberately separate
 *  concept. It does not count toward SPACES completion and unlocks no module.
 *  Zoom credentials fabricated, same as a plan row's. */
export interface AdHocMeeting {
  id: string
  title: string
  date: string
  time: string
  meetingId: string
  zoomLink: string
}

/** A dyad's whole-arc plan: always 7 rows (some possibly undated) plus any
 *  ad-hoc meetings. The live copy lives in the store's `sessionPlans` map,
 *  keyed by dyad id; `ConsumerDyad.sessionPlan` is only the seed and goes
 *  stale the moment anything is edited. */
export interface SessionPlan {
  sessions: SessionPlanRow[]
  adHocMeetings: AdHocMeeting[]
}

/** All 7 rows, unset — the starting point for any dyad with no plan yet. */
export function emptySessionPlan(): SessionPlan {
  return {
    sessions: SPACES_SESSIONS.map((s) => ({ session: s.number })),
    adHocMeetings: [],
  }
}

// --- PLAN GENERATION -------------------------------------------------------
//
// A coach never fills in 13 dates by hand. The whole arc cascades from just two
// answers — which weekday each module becomes available, and which weekday the
// catch-up follows on — because the SPACES protocol fixes the cadence at
// weekly. That is why cadence is a constant here and not a question.

/** Fixed by the study protocol. Coaches meet consumers weekly; this is not a
 *  configurable preference. */
export const WEEKLY_CADENCE_DAYS = 7

/** Selectable weekdays for the two plan-generation questions. `value` follows
 *  `Date#getDay()` (1 = Monday … 5 = Friday), listed Monday-first to read
 *  naturally in the calendar-style picker.
 *
 *  Weekends are excluded on purpose: module unlocks and catch-ups only happen
 *  on working days. Re-adding Saturday/Sunday changes what dates
 *  `generatePlanRows` can produce. */
export const DAY_OF_WEEK_OPTIONS = [
  { label: 'Monday', short: 'Mon', value: 1 },
  { label: 'Tuesday', short: 'Tue', value: 2 },
  { label: 'Wednesday', short: 'Wed', value: 3 },
  { label: 'Thursday', short: 'Thu', value: 4 },
  { label: 'Friday', short: 'Fri', value: 5 },
]

/** Monday-first ordinal (1-7) for a `Date#getDay()` value — used only to
 *  compare two weekdays' relative position within a calendar week (e.g. "is
 *  this catch-up day before the module's own day this week"), never stored. */
export function mondayFirstOrdinal(weekday: number): number {
  return weekday === 0 ? 7 : weekday
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toLocalISODate(d)
}

/** The next date on/after `fromIso` falling on `weekday` (`Date#getDay()`,
 *  0 = Sunday … 6 = Saturday). `strictlyAfter` forces a later date even when
 *  `fromIso` already falls on `weekday` — required for a catch-up, which must
 *  never land the same day as the module it reviews. */
export function nextWeekday(fromIso: string, weekday: number, strictlyAfter = false): string {
  const d = new Date(`${fromIso}T00:00:00`)
  let diff = (weekday - d.getDay() + 7) % 7
  if (diff === 0 && strictlyAfter) diff = 7
  return addDays(fromIso, diff)
}

/**
 * THE source of truth for a generated plan. Builds all 7 rows from the two
 * weekday answers plus the planning session's own date.
 *
 * This is what guarantees `moduleTargetDate < date` on every row: module dates
 * and catch-up dates advance on the same weekly stride from two anchors, and
 * the catch-up anchor is forced strictly after the module anchor. Nothing else
 * writes fresh plan dates, so the invariant cannot be violated by construction
 * — restoring per-row date editing would give that up and needs its own
 * validation.
 */
export function generatePlanRows(
  session0Date: string,
  moduleWeekday: number,
  catchupWeekday: number,
  catchupTime: string,
): SessionPlanRow[] {
  const module1Date = nextWeekday(session0Date, moduleWeekday)
  // Strictly after the module's own date — the consumer needs at least a day
  // to finish it before the coach catches up on it.
  const catchup1Date = nextWeekday(module1Date, catchupWeekday, true)
  return SPACES_SESSIONS.map((s, i) => {
    // The Planning session is happening now, not on the weekly cascade, and it
    // reviews no module — so it carries no `moduleTargetDate`.
    if (s.number === 1) {
      return { session: 1, date: session0Date, time: catchupTime }
    }
    const cycleIndex = i - 1 // 0-based: the first catch-up is index 0
    const moduleTargetDate = addDays(module1Date, cycleIndex * WEEKLY_CADENCE_DAYS)
    const date = addDays(catchup1Date, cycleIndex * WEEKLY_CADENCE_DAYS)
    return { session: s.number, date, time: catchupTime, moduleTargetDate }
  })
}

/** THE definition of "this consumer has a session plan": every row dated.
 *  Drives the "Session Plan: Created / Not yet" chip, the "no sessions
 *  planned" KPI, the gate on module content, and the no-plan notification.
 *  All four read this one predicate, so they cannot disagree. */
export function isPlanSet(plan: SessionPlan | undefined): boolean {
  return !!plan && plan.sessions.every((s) => !!s.date)
}

/** The earliest dated, not-yet-completed row. Excludes the Planning session
 *  unconditionally: nothing asking "what is next" should ever be handed
 *  Planning back as if it were a numbered, schedulable item. (In practice a
 *  plan and a completed Planning session are created together, so the case
 *  should not arise — the exclusion is a guard, not a workaround.) */
export function nextPlannedSession(
  plan: SessionPlan | undefined,
  completed: SessionCompletionRecord[],
): SessionPlanRow | undefined {
  if (!plan) return undefined
  return plan.sessions
    .filter((s) => s.session !== 1 && !!s.date && !completed.some((c) => c.session === s.session))
    .sort((a, b) => a.session - b.session)[0]
}

/**
 * THE source of truth for "which session is next" — as a whole record, so a
 * surface showing the number and the date side by side reads both from one
 * resolution. Deriving the date from a second, hand-rolled copy of this
 * fallback chain is how two columns about one consumer start disagreeing.
 *
 * Resolution order: the plan's next dated, incomplete row, else the legacy
 * `upcomingSession` field for a dyad with no plan yet.
 *
 * DO NOT REMOVE the `session >= 2` guard on the legacy branch. Some seeded
 * dyads still carry `upcomingSession.session === 1` from before the numbering
 * correction, and without it that resolves to `displaySessionNumber(1) === 0`
 * and renders as "Session 0" — which is not a thing. A dyad whose only pending
 * item is the planning meeting correctly reads as having nothing scheduled,
 * matching `nextPlannedSession`'s own exclusion.
 */
export function nextUpcomingSessionEntry(
  plan: SessionPlan | undefined,
  completed: SessionCompletionRecord[],
  legacyUpcoming?: UpcomingSession,
): { session: number; date?: string; time?: string } | undefined {
  return (
    nextPlannedSession(plan, completed) ??
    (legacyUpcoming &&
    legacyUpcoming.session >= 2 &&
    !completed.some((c) => c.session === legacyUpcoming.session)
      ? legacyUpcoming
      : undefined)
  )
}

/** The next session's DISPLAY number. Delegates to `nextUpcomingSessionEntry`
 *  on purpose, so the number and the date can never come from two different
 *  resolutions of the same question. */
export function nextUpcomingSessionNumber(
  plan: SessionPlan | undefined,
  completed: SessionCompletionRecord[],
  legacyUpcoming?: UpcomingSession,
): number | undefined {
  const next = nextUpcomingSessionEntry(plan, completed, legacyUpcoming)
  return next ? displaySessionNumber(next.session) : undefined
}

// ---------------------------------------------------------------------------
// SPACES coach roster
// ---------------------------------------------------------------------------

/**
 * A certified coach's SPACES delivery record — the fact that they have been
 * onboarded into live delivery, and nothing else. `coachId` joins to
 * `research.ts`'s `coaches` for all identity.
 *
 * Referential rule: `coachId` must resolve to a coach with
 * `certification.outcome === 'pass'`, and the invite/join dates should follow
 * that coach's own assessment date.
 *
 * Existence of this row is what makes a coach "onboarded". Coach Management
 * builds its active roster from this array alone, which means a consumer
 * assigned to a coach WITHOUT a row here has an invisible caseload — see the
 * note on Dorothy Kellerman's dyad below, where the fixtures do exactly that.
 */
export interface SpacesCoach {
  id: string
  coachId: string
  invitationStatus: InvitationStatus
  joinedStatus: JoinedStatus
  invitedDate: string
  joinedDate?: string
}

/** Exactly two onboarded coaches, demonstrating the two states Coach
 *  Management has to show: one carrying a real caseload (Helen), one onboarded
 *  with nobody assigned (Fatima). Adding more rows adds no new case. */
export const spacesCoaches: SpacesCoach[] = [
  {
    id: 'spaces-helen-zhang',
    coachId: 'helen-zhang',
    invitationStatus: 'accepted',
    joinedStatus: 'joined',
    invitedDate: '2026-07-21',
    joinedDate: '2026-07-22',
  },
  {
    id: 'spaces-fatima-haidari',
    coachId: 'fatima-haidari',
    invitationStatus: 'accepted',
    joinedStatus: 'joined',
    invitedDate: '2026-05-20',
    joinedDate: '2026-05-22',
  },
  // DO NOT add a row for mei-ling-chen. She is certified but deliberately not
  // onboarded, which is what populates the "Waiting to be onboarded" tab and
  // gives the Onboard flow a candidate to act on. Onboarding her empties both.
]

// ---------------------------------------------------------------------------
// CONSUMERS
// ---------------------------------------------------------------------------

/** One member of a consumer dyad. Used for both the PLE (Person with Lived
 *  Experience — the dyad member with dementia) and the carer; `relationship`
 *  is what distinguishes them, being set only on the carer.
 *
 *  Contact details are realistically only ever populated for the carer, who is
 *  the person actually operating the consumer-facing portal. */
export interface PersonProfile {
  name: string
  age: number
  /** Carer only — their relationship to the PLE. */
  relationship?: string
  background: string
  email?: string
  phone?: string
}

/** ⚠️ Structurally identical to `research.ts`'s `NotificationPreferences` and
 *  declared twice. Nothing errors, so a change to one copy stays invisible.
 *  Collapse to a single shared definition before designing a schema. */
export interface NotificationPreferences {
  email: boolean
  sms: boolean
}

/**
 * ONE PERSON, ONE NIGHT. The unit of all sleep data. A dyad keeps two parallel
 * logs — `patientLog` for the PLE and `carerLog` for the carer — each ordered
 * by ascending date with no duplicates and no date after `TODAY`.
 *
 * This array is the FITBIT INTEGRATION BOUNDARY: it is where a nightly device
 * sync would deposit its readings. There is no Fitbit client anywhere in this
 * package; every entry here is seeded.
 *
 * Two independent sources of data live on one entry, and conflating them is
 * the mistake to avoid:
 *   - Device readings (`remPercent`/`deepPercent`/`lightPercent`/
 *     `durationMin`/`disturbances`) exist ONLY when `synced` is true. A missed
 *     sync means no reading at all, not a zero.
 *   - The carer's own manual entries (`diaryEntry` free text, `diary`
 *     structured answers) are independent of `synced` — a diary can be filled
 *     in on a night the device failed, and can be missing on a night it worked.
 */
export interface HealthLogEntry {
  date: string
  /** Did the device report for this night. Gates the five Fitbit fields below. */
  synced: boolean
  /** REM sleep, % of total sleep time. The three percentages sum to ~100. */
  remPercent?: number
  /** Deep (slow-wave) sleep, % of total sleep time. */
  deepPercent?: number
  /** Light sleep, % of total sleep time. */
  lightPercent?: number
  durationMin?: number
  disturbances?: number
  /** The carer's free-text note for the night. Independent of `synced`. */
  diaryEntry?: string
  /** The 9 directly-answered Consensus Sleep Diary questions for this person
   *  and night. Independent of `synced`; absent means the diary simply was not
   *  filled in. Questions 10-13 are NEVER stored — always derived at render by
   *  `computeSleepDiary`. */
  diary?: SleepDiaryAnswers
}

/** The Consensus Sleep Diary's 9 DIRECTLY-ANSWERED questions, for one person
 *  on one night. This is a standard published instrument — the numbering and
 *  the formulas below are its, not this project's, so do not "simplify" them.
 *
 *  Times here are free-form "h:mm am/pm" strings matching the paper diary,
 *  NOT the 24-hour `"HH:MM"` used everywhere else in this codebase. Parse them
 *  with `parseTimeToMinutes`. */
export interface SleepDiaryAnswers {
  /** Q1 — nap length yesterday, minutes. */
  napMin: number
  /** Q2 — minutes in bed outside the sleep window doing something other than sleep. */
  outOfSleepWindowMin: number
  /** Q3 — time closed eyes intending to fall asleep last night, e.g. "10:00 pm". */
  bedtime: string
  /** Q4 — sleep latency: minutes to fall asleep last night. */
  sleepLatencyMin: number
  /** Q5 — number of night wakings, not including the final one. */
  wakeCount: number
  /** Q6 — total minutes awake during the wakings counted in Q5. */
  awakeDuringNightMin: number
  /** Q7 — total minutes out of bed during the wakings counted in Q5. */
  outOfBedDuringNightMin: number
  /** Q8 — time woke up for the last time this morning, e.g. "7:00 am". */
  wakeTime: string
  /** Q9 — time got out of bed for the last time this morning, e.g. "7:30 am". */
  outOfBedTime: string
}

/** Consensus Sleep Diary questions 10-13. ALWAYS DERIVED, NEVER STORED — this
 *  is a real rule, not an implementation detail. Persisting them would let a
 *  stored total drift from the answers it was computed from, and the whole
 *  point of these four is that they are a function of the other nine.
 *
 *  Note there is no validation: an inconsistent bedtime/out-of-bed pair yields
 *  a negative total sleep time rather than an error. Worth asserting
 *  `sleepOpportunityMin > 0` and `0 <= sleepEfficiencyPercent <= 100` on real
 *  input. */
export interface SleepDiaryComputed {
  /** Q10 — minutes awake in bed between the final wake time (#8) and getting
   *  out of bed for the last time (#9). */
  minutesAwakeInBed: number
  /** Q11 — total Sleep Opportunity: minutes between bedtime (#3) and final
   *  out-of-bed time (#9). */
  sleepOpportunityMin: number
  /** Q12 — Total Sleep Time: #11 minus sleep latency (#4), minus time awake
   *  during the night (#6), minus time awake in bed this morning (#10). */
  totalSleepTimeMin: number
  /** Q13 — Sleep Efficiency: Total Sleep Time (#12) / Sleep Opportunity (#11), as a percentage. */
  sleepEfficiencyPercent: number
}

/** Parses a "h:mm am/pm" diary time (e.g. "10:00 pm", "7:00 am") into minutes
 *  since midnight (0-1439). Returns 0 for anything unparseable. */
export function parseTimeToMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
  if (!match) return 0
  const [, hourStr, minuteStr, meridiem] = match
  let hour = parseInt(hourStr, 10) % 12
  if (meridiem.toLowerCase() === 'pm') hour += 12
  return hour * 60 + parseInt(minuteStr, 10)
}

/** Minutes from `startTime` to `endTime`, assuming `endTime` may fall on the
 *  following calendar day (e.g. a 10:00pm bedtime to a 7:30am out-of-bed
 *  time) — wraps across midnight whenever `endTime` reads earlier in the day
 *  than `startTime`. */
function minutesFromTo(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  return end >= start ? end - start : 1440 - start + end
}

/** THE source of truth for Consensus Sleep Diary questions 10-13. Formulas are
 *  the published instrument's, verbatim:
 *  - Q10 = minutes awake in bed between #8 (final wake) and #9 (out of bed)
 *  - Q11 = Sleep Opportunity = minutes between #3 (bedtime) and #9 (out of bed)
 *  - Q12 = Total Sleep Time = #11 − #4 (latency) − #6 (awake during night) − #10
 *  - Q13 = Sleep Efficiency = (#12 / #11) × 100 */
export function computeSleepDiary(answers: SleepDiaryAnswers): SleepDiaryComputed {
  const minutesAwakeInBed = minutesFromTo(answers.wakeTime, answers.outOfBedTime)
  const sleepOpportunityMin = minutesFromTo(answers.bedtime, answers.outOfBedTime)
  const totalSleepTimeMin =
    sleepOpportunityMin - answers.sleepLatencyMin - answers.awakeDuringNightMin - minutesAwakeInBed
  const sleepEfficiencyPercent =
    sleepOpportunityMin > 0 ? (totalSleepTimeMin / sleepOpportunityMin) * 100 : 0
  return { minutesAwakeInBed, sleepOpportunityMin, totalSleepTimeMin, sleepEfficiencyPercent }
}

/** Whether a dyad's latest reflection has been released to the research team.
 *  `'not-yet'` means no reflection exists at all — distinct from one written
 *  but withheld, and the two must not be shown the same way. */
export type AnnotationShareState = 'shared' | 'not-shared' | 'not-yet'

/** One SIPTEA component's answer within a reflection.
 *
 *  `label` MUST be one of the 6 SIPTEA component names spelled exactly as the
 *  reflection wizard writes them (Shared understanding, Implementation intent,
 *  Problem identification, Tailoring, Emotion navigation, Action and goals).
 *  The wizard is the only writer and every display surface renders the stored
 *  string verbatim, so a typo appears as a seventh component. */
export interface ReflectionComponentAnswer {
  label: string
  answer: string
}

/**
 * The coach's POST-PRACTICE annotation summary for one consumer — the fourth
 * of the study's four reflection timepoints. The other three (baseline,
 * midline, endline) happen during training and live in `research.ts` as
 * `AnnotationSummary`, with a free-text body instead of per-component answers.
 * The two types do not reference each other.
 *
 * Written after the coach's first session with that consumer, and capped at
 * ONE per consumer — the array type is historical, and the store's write path
 * replaces rather than appends. Sharing is the coach's choice.
 *
 * The array is ordered most-recent-first; `latestAnnotationState` reads
 * index 0.
 */
export interface AnnotationSummaryEntry {
  id: string
  components: ReflectionComponentAnswer[]
  shared: boolean
  date: string
  time: string
}

/** A consent form recorded against a dyad. FILENAME ONLY — no file is stored
 *  anywhere, and the upload/remove UI was dropped, so this is display-only
 *  evidence read for its date. The document-storage integration boundary. */
export interface ConsentDocument {
  id: string
  filename: string
  /** ISO date. Read as the consumer's consent date on several surfaces. */
  uploadedDate: string
}

/** One consumer-facing content module. Distinct from the coach's own training
 *  curriculum (`trainingPathwayV2.ts`) — different ids, different count, both
 *  called "modules" in UI copy. */
export interface ConsumerModule {
  id: string
  title: string
  /** Uniform at 6, matching the coach curriculum's slide count so completion
   *  percentages are computed the same way on both sides. */
  slideCount: number
}

/**
 * The 7-entry consumer content library, IN UNLOCK ORDER — index is meaningful,
 * so never reorder or splice this array.
 *
 * Index 0 is a pre-module: always available from enrolment, gated by nothing.
 * Indices 1-6 are the named modules, each unlocked by its own catch-up session
 * and displayed to the consumer as "Module 1".."Module 6". See the numbering
 * table in the file header, and `moduleUnlockState` for the rule.
 */
export const CONSUMER_MODULES: ConsumerModule[] = [
  { id: 'getting-started', title: 'Getting started with Care2Sleep', slideCount: 6 },
  { id: 'understanding-sleep-dementia', title: 'Understanding sleep and dementia', slideCount: 6 },
  { id: 'calming-bedtime-routine', title: 'Building a calming bedtime routine', slideCount: 6 },
  { id: 'managing-nighttime-waking', title: 'Managing nighttime waking', slideCount: 6 },
  { id: 'daytime-habits', title: 'Daytime habits that support sleep', slideCount: 6 },
  { id: 'carer-own-sleep', title: "Looking after your own sleep", slideCount: 6 },
  { id: 'using-sleep-data', title: 'Using your sleep diary and Fitbit data', slideCount: 6 },
]

/** A module's position in the unlock sequence. -1 if not found. */
export function moduleIndex(moduleId: string): number {
  return CONSUMER_MODULES.findIndex((m) => m.id === moduleId)
}

export type ModuleUnlockState = 'locked' | 'unlocked'

/**
 * THE module gating rule. Index 0 (the pre-module) is always unlocked; module
 * index N unlocks when internal session N is complete, or when the coach has
 * granted it early.
 *
 * Mind the offsets — module N is unlocked by session N but REVIEWED by session
 * N+1, and shown to the consumer as "Module N+1". Three numbers, one module.
 *
 * `manualUnlocks` covers the real case where a session happened but has not
 * been logged yet, so the coach grants access ahead of the tick. There is no
 * un-unlock.
 */
export function moduleUnlockState(
  index: number,
  completed: SessionCompletionRecord[],
  manualUnlocks: number[] = [],
): ModuleUnlockState {
  if (index <= 0) return 'unlocked'
  return completed.some((c) => c.session === index) || manualUnlocks.includes(index)
    ? 'unlocked'
    : 'locked'
}

export type ConsumerModuleRecordStatus = 'not-started' | 'in-progress' | 'completed'

/**
 * A dyad's engagement with one consumer module. Exactly one record per entry
 * in `CONSUMER_MODULES` (7), always.
 *
 * Three rules a fixture or a backend must respect, all of them things a reader
 * would otherwise see contradicted on screen:
 *   - A module with ANY progress must be unlocked. `status !== 'not-started'`
 *     implies `moduleUnlockState` says unlocked.
 *   - No plan, no progress. Module content only opens once a session plan
 *     exists (`isPlanSet`), so an unplanned consumer's records are all
 *     not-started. By extension: no coach -> no plan -> no progress.
 *   - "In progress" is only possible BEFORE the module's own catch-up. Once
 *     that session has been held the module is complete or it was left
 *     incomplete — never still in progress.
 * `status === 'completed'` also implies `slidesCompleted === slideCount`.
 */
export interface ConsumerModuleRecord {
  moduleId: string
  status: ConsumerModuleRecordStatus
  /** ISO date last opened. Present once started; always <= TODAY. */
  lastActivityDate?: string
  /** Slides viewed, out of the module's `slideCount`. */
  slidesCompleted?: number
}

/** Metadata for a recorded SPACES delivery session. STORED on the dyad, unlike
 *  `research.ts`'s `SessionRecording`, which is derived. No media exists — see
 *  the file header. */
export interface SpacesSessionRecording {
  id: string
  /** INTERNAL session number 1-7. Route through `sessionRowLabel` to display. */
  session: number
  title: string
  date: string
  /** "HH:MM". Optional — older seeded rows predate the field. */
  time?: string
  durationMin: number
}

/**
 * THE CONSUMER RECORD — one enrolled consumer, which the study models as a
 * *dyad*: a Person with Lived Experience (the member with dementia) and their
 * carer. `patient` holds the PLE and is ABSENT for a carer-only consumer, a
 * carer participating without a co-enrolled PLE. `carer` is always present.
 *
 * (The field is named `patient` for historical reasons; the term used
 * everywhere else, including all UI copy, is PLE. Never "patient" or "PLWD".)
 *
 * Two fields here are SEED-ONLY and go stale the moment anything is edited:
 * `sessionsCompleted` and `sessionPlan` are copied into the store's own
 * `sessionCompletion` / `sessionPlans` maps at boot and never written back.
 * Read those maps, not these fields. (Verified: no page reads either directly,
 * and it needs to stay that way.)
 *
 * Nothing is ever deleted. Withdrawal, opt-out and coach transfer are all soft.
 */
export interface ConsumerDyad {
  id: string
  /** FK to `Coach.id`. Absent until a coordinator assigns one — consumers are
   *  enrolled before assignment. Ideally the target should also have a
   *  `SpacesCoach` row; the fixtures break that for one dyad, see below. */
  coachId?: string
  /** ISO date of that assignment. Present iff `coachId` is, and <= TODAY.
   *  Several surfaces show it, and `transferDyad` does NOT update it — a
   *  transferred dyad keeps its original assignment date. */
  coachAssignedDate?: string
  /** The Person with Lived Experience. Absent for a carer-only consumer. */
  patient?: PersonProfile
  carer: PersonProfile
  sleepGoals: string
  caregivingContext: string
  /** "Additional notes", set by the research coordinator at intake. */
  notes?: string
  /** The COACH's own notes on this consumer. Deliberately a separate field
   *  from `notes` above, which the coordinator owns and several other surfaces
   *  render — a coach editing their notes must never overwrite intake notes. */
  coachNotes?: string
  /** ⚠️ SEED ONLY. Live completion is the store's `sessionCompletion[dyadId]`. */
  sessionsCompleted: SessionCompletionRecord[]
  /** Most-recent-first. Capped at one entry by the write path. */
  annotationSummaries: AnnotationSummaryEntry[]
  /** The PLE's nightly log. Present iff `patient` is. */
  patientLog: HealthLogEntry[]
  carerLog: HealthLogEntry[]
  consentDocuments: ConsentDocument[]
  /** Exactly one record per entry in `CONSUMER_MODULES`. */
  moduleEngagement: ConsumerModuleRecord[]
  sessionRecordings: SpacesSessionRecording[]
  /** ⚠️ LEGACY fallback for a dyad with no plan. Read only via
   *  `nextUpcomingSessionEntry`, never directly — see `UpcomingSession`. */
  upcomingSession?: UpcomingSession
  /** ⚠️ SEED ONLY. Live plan is the store's `sessionPlans[dyadId]`. */
  sessionPlan?: SessionPlan
  /** The carer's preferences — they hold the account. Defaults at render. */
  notificationPreferences?: NotificationPreferences
  /** Set when the consumer withdraws from the study. One-way: there is no
   *  un-opt-out. The reason comes from a fixed dropdown and the study team
   *  follows up off-platform; nothing further happens in-app. */
  optedOut?: { reason: string; date: string }
  /**
   * Hides this dyad from the Consumer Management roster ONLY. It stays fully
   * real everywhere else — the coach's caseload, its session plan, every other
   * count.
   *
   * That roster is curated to one consumer per state it needs to demonstrate;
   * a dyad duplicating a state already shown there just inflates the KPI row.
   * Exactly one list filters on this. It is a visibility flag, not an
   * "archived" or "deleted" state, and should not become one.
   */
  omitFromConsumerRoster?: boolean
}

// ---------------------------------------------------------------------------
// SEED BUILDERS for health logs. Not domain model — they exist so a dyad's
// 18-night log is not written out by hand. Each one encodes a real distinction
// the UI has to handle (device gap vs missing diary vs neither).
// ---------------------------------------------------------------------------

/** A 5-night rotating base pattern of diary answers Q1-9, cycled to fill any
 *  log length. Wake count (Q5) is supplied per call instead of fixed here, so
 *  it can track that log's own `disturbances` — a night the device counted 5
 *  disturbances should not carry a diary claiming 2 wakings. */
const DIARY_DAY_BASE: Array<Omit<SleepDiaryAnswers, 'wakeCount'>> = [
  {
    napMin: 60,
    outOfSleepWindowMin: 30,
    bedtime: '10:00 pm',
    sleepLatencyMin: 45,
    awakeDuringNightMin: 60,
    outOfBedDuringNightMin: 25,
    wakeTime: '7:00 am',
    outOfBedTime: '7:30 am',
  },
  {
    napMin: 30,
    outOfSleepWindowMin: 15,
    bedtime: '9:45 pm',
    sleepLatencyMin: 30,
    awakeDuringNightMin: 40,
    outOfBedDuringNightMin: 15,
    wakeTime: '6:45 am',
    outOfBedTime: '7:10 am',
  },
  {
    napMin: 0,
    outOfSleepWindowMin: 20,
    bedtime: '10:15 pm',
    sleepLatencyMin: 60,
    awakeDuringNightMin: 70,
    outOfBedDuringNightMin: 30,
    wakeTime: '7:15 am',
    outOfBedTime: '7:45 am',
  },
  {
    napMin: 45,
    outOfSleepWindowMin: 10,
    bedtime: '9:30 pm',
    sleepLatencyMin: 25,
    awakeDuringNightMin: 30,
    outOfBedDuringNightMin: 10,
    wakeTime: '6:30 am',
    outOfBedTime: '6:50 am',
  },
  {
    napMin: 20,
    outOfSleepWindowMin: 25,
    bedtime: '10:00 pm',
    sleepLatencyMin: 20,
    awakeDuringNightMin: 20,
    outOfBedDuringNightMin: 5,
    wakeTime: '7:00 am',
    outOfBedTime: '7:15 am',
  },
]

/** One night's full diary answers, cycling `DIARY_DAY_BASE` and threading in
 *  a wake count that matches that night's disturbances. */
function diaryAnswersFor(dayIndex: number, wakeCount: number): SleepDiaryAnswers {
  return { ...DIARY_DAY_BASE[dayIndex % DIARY_DAY_BASE.length], wakeCount: Math.max(0, wakeCount) }
}

/** Builds a health log ending on TODAY, one night per free-text entry supplied
 *  — a longer `diaryEntries` array simply reaches further back. The end date is
 *  hardcoded to match `format.ts`'s TODAY; both move together. */
function healthLog(
  startRem: number,
  startDuration: number,
  startDisturbances: number,
  diaryEntries: string[],
  allSynced = true,
): HealthLogEntry[] {
  const endDate = '2026-07-22'
  const dates = Array.from({ length: diaryEntries.length }, (_, i) =>
    addDays(endDate, i - (diaryEntries.length - 1)),
  )
  return dates.map((date, i) => {
    const synced = allSynced || i % 3 !== 2
    const rem = startRem + (i % 2 === 0 ? 1 : -1) * i
    const disturbances = Math.max(0, startDisturbances - Math.floor(i / 2))
    return {
      date,
      synced,
      // A missed sync means no device reading that day — the sleep-diary
      // entry (manual, independent of Fitbit) still comes through.
      remPercent: synced ? rem : undefined,
      deepPercent: synced ? Math.max(8, 22 - Math.floor(rem / 4)) : undefined,
      lightPercent: synced ? Math.max(30, 100 - rem - Math.max(8, 22 - Math.floor(rem / 4))) : undefined,
      durationMin: synced ? startDuration + (i % 3 === 0 ? -20 : 15) : undefined,
      disturbances: synced ? disturbances : undefined,
      diaryEntry: diaryEntries[i],
      diary: diaryAnswersFor(i, disturbances),
    }
  })
}

/** Turns the most recent `days` nights into an unresolved DEVICE sync gap —
 *  the condition the sync alerts exist to surface. Every Fitbit field is
 *  dropped because there was no reading; the manual diary answers and free
 *  text survive, because a carer can still fill in the diary on a night the
 *  device failed. Keeping those is the point of the helper, not an oversight. */
function withSyncGap(log: HealthLogEntry[], days: number, diaryNotes: string[]): HealthLogEntry[] {
  const cutoff = log.length - days
  return log.map((entry, i) =>
    i >= cutoff
      ? { date: entry.date, synced: false, diaryEntry: diaryNotes[i - cutoff], diary: entry.diary }
      : entry,
  )
}

/** Blanks one night's structured diary answers — the carer forgot to log it.
 *  A DIFFERENT failure from a device sync gap, and the diary grid must show
 *  both: the device fields and the free-text note for that night are left
 *  untouched. All 13 questions, including the 4 derived ones, render as "—"
 *  when `diary` is absent, so no display-side special-casing is needed. */
function withMissingDiaryOn(log: HealthLogEntry[], date: string): HealthLogEntry[] {
  return log.map((entry) => (entry.date === date ? { ...entry, diary: undefined } : entry))
}

/** Builds a full engagement record set: explicit entries as written, every
 *  other module not-started. Guarantees one record per `CONSUMER_MODULES`
 *  entry, which every consumer of `moduleEngagement` relies on. Mirrors
 *  `research.ts`'s `fillRecords`.
 *
 *  Not exported, so the store's two new-dyad paths (`addConsumer`,
 *  `enrollConsumer`) hand-roll the same seeding inline. Three copies of one
 *  rule; export this and call it from all three rather than adding a fourth. */
function consumerModuleEngagement(explicit: ConsumerModuleRecord[]): ConsumerModuleRecord[] {
  const covered = new Set(explicit.map((r) => r.moduleId))
  return [
    ...explicit,
    ...CONSUMER_MODULES.filter((m) => !covered.has(m.id)).map(
      (m): ConsumerModuleRecord => ({ moduleId: m.id, status: 'not-started' }),
    ),
  ]
}

// ---------------------------------------------------------------------------
// THE CONSUMER FIXTURES — seed value for the store's `consumerDyads` slice.
// Read from the store, never by importing this array.
//
// Five dyads, each demonstrating one state the UI must handle:
//   dyad-014  assigned, nothing started (coach caseload only)
//   dyad-011  mid-arc, with a device sync gap, a missing diary night, and
//             modules deliberately out of step with sessions
//   dyad-012  coach assigned, no plan built — the "plan sessions" entry case
//   dyad-013  all 7 sessions and all 7 modules complete
//   dyad-030  enrolled, no coach assigned
// Deleting one removes a case from the demo.
//
// INVARIANTS these fixtures are meant to satisfy:
//   1. `coachId` resolves to a certified coach that ALSO has a `SpacesCoach`
//      row. (dyad-012 breaks this deliberately — see its note.)
//   2. `coachAssignedDate` present iff `coachId`, and <= TODAY.
//   3. `sessionsCompleted` sessions are unique, in 1..7, prefix-closed, with
//      non-decreasing `completedDate` — all <= TODAY.
//   4. `moduleEngagement` covers all 7 `CONSUMER_MODULES`; see that type for
//      the three progress rules (unlocked / plan exists / not in-progress
//      after its own catch-up).
//   5. `patientLog` present iff `patient`; logs date-ascending, unique dates,
//      latest <= TODAY. `synced: false` means no Fitbit fields at all.
//   6. Session plan rows: `moduleTargetDate < date` for sessions 2-7; a dated
//      row also carries Zoom credentials.
//
// KNOWN VIOLATION of rules 3 and 5: dyad-011 has sessions and module activity
// dated weeks after TODAY. See its note.
// ---------------------------------------------------------------------------
export const consumerDyads: ConsumerDyad[] = [
  // Assigned but nothing has happened yet. Every absence here is correct, not
  // an unfilled gap: no plan because the coach has not built one, no
  // reflection because it is not due until after the first session, no logs
  // and no module progress because content is gated on the plan.
  //
  // Sorts to the top of the caseload table for free — that table orders by
  // completed session count and this is the only dyad at zero.
  {
    id: 'dyad-014',
    coachId: 'helen-zhang',
    omitFromConsumerRoster: true,
    // Must stay before TODAY: a future assignment date clamps "Days in study"
    // to 0, which reads as a broken figure rather than a new consumer.
    coachAssignedDate: '2026-07-15',
    patient: {
      name: 'Arthur Ngata',
      age: 81,
      background:
        'Early-stage Alzheimer’s, lives with his daughter. Wakes several times a night and gets up to check the doors.',
      email: 'arthur.ngata@example.com',
      phone: '0412 664 108',
    },
    carer: {
      name: 'Tania Ngata',
      age: 52,
      relationship: 'Daughter',
      background:
        'Works day shifts and sleeps lightly, listening out for her father getting up. Newly enrolled, hasn’t met her coach yet.',
      email: 'tania.ngata@example.com',
      phone: '0412 664 109',
    },
    sleepGoals: 'Settle Arthur back to bed without a long night-time search of the house.',
    caregivingContext: 'Lives with her father; no overnight support.',
    sessionsCompleted: [],
    annotationSummaries: [],
    patientLog: [],
    carerLog: [],
    consentDocuments: [],
    moduleEngagement: consumerModuleEngagement([]),
    sessionRecordings: [],
    // No `sessionPlan` and no `upcomingSession` on purpose — "Session Plan:
    // Not yet" and an em dash for the next session is the honest state for a
    // consumer whose coach has not planned their arc.
  },
  // The mid-arc case, and the one carrying most of the edge conditions: an
  // unresolved device sync gap, one night with no diary answers, and modules
  // deliberately out of step with sessions (one never started though its
  // catch-up went ahead).
  //
  // ⚠️ DATA DEFECT: sessions 3 and 4 below are marked complete on 2026-08-05
  // and 2026-08-19, weeks AFTER TODAY (2026-07-22), and two module
  // `lastActivityDate`s are likewise in August. A researcher sees sessions
  // recorded as done that have not happened. Re-date or remove them; the
  // narrative this dyad is meant to show is one catch-up completed, not three.
  {
    id: 'dyad-011',
    coachId: 'helen-zhang',
    // Two days after consent, before the planning session — the order the arc
    // actually runs in.
    coachAssignedDate: '2026-06-22',
    patient: {
      name: 'Bruce Whitfield',
      age: 81,
      background:
        'Living with moderate Alzheimer’s disease; resides at home with his wife. Wakes most nights between 2–4am and resettles with reassurance but resists returning to bed some nights.',
      email: 'bruce.whitfield@example.com',
      phone: '0412 887 209',
    },
    carer: {
      name: 'Joan Whitfield',
      age: 78,
      relationship: 'Spouse',
      background:
        'Bruce’s primary carer; reports her own sleep is fragmented around his waking. Wears a Fitbit alongside him to track her own rest.',
      email: 'joan.whitfield@example.com',
      phone: '0412 887 213',
    },
    sleepGoals:
      'Reduce Bruce’s 2–4am waking episodes and help Joan get at least one unbroken sleep block per night.',
    caregivingContext:
      'Joan cares for Bruce full-time with a home-care package covering 6 hours/week of respite. No overnight support currently in place.',
    // No reflection written yet — the "ready to add a reflection" state, which
    // only unlocks once the first session is done. Internal 1 is Planning and
    // does not count toward the "N of 6" figure.
    sessionsCompleted: [
      { session: 1, completedDate: '2026-06-24', completedTime: '10:00' },
      { session: 2, completedDate: '2026-07-22', completedTime: '10:00' },
      { session: 3, completedDate: '2026-08-05', completedTime: '10:00' },
      { session: 4, completedDate: '2026-08-19', completedTime: '10:00' },
    ],
    annotationSummaries: [],
    // 18 nights, deliberately: the diary grid needs enough dates to genuinely
    // overflow horizontally, which is what exercises its sticky question
    // column. One mid-range night (2026-07-13) has no diary answers — placed
    // mid-range rather than at an edge so it reads as a real gap and not an
    // artifact of the window. That night's device reading and free-text note
    // survive; only the structured answers are missing. The last two nights
    // are an unresolved device sync gap, which is what keeps the sync alert
    // visible on load.
    patientLog: withMissingDiaryOn(
      withSyncGap(
        healthLog(72, 340, 4, [
          'Settled fairly easily, one brief stir.',
          'Up once around 2am, resettled with reassurance.',
          'Restless most of the night.',
          'Quiet night, slept through.',
          'Woke twice, unsettled both times.',
          'One waking, resettled quickly.',
          'Long wake period around 3am.',
          'Slept well, no reported waking.',
          'Diary questions weren’t filled in last night.',
          'Brief stir only.',
          'Restless from about 2am, up twice.',
          'Settled quickly after 2am waking.',
          'Long wake period, wouldn’t return to bed for an hour.',
          'One brief waking only.',
          'Quiet night, no reported waking.',
          'Two short wakings, resettled each time.',
          'Device wasn’t on the charger; no reading.',
          'Still not syncing; Joan will check the app tonight.',
        ]),
        2,
        ['Device wasn’t on the charger; no reading.', 'Still not syncing; Joan will check the app tonight.'],
      ),
      '2026-07-13',
    ),
    carerLog: withSyncGap(
      healthLog(68, 300, 2, [
        'Slept most of the night.',
        'Woke briefly with Bruce.',
        'Broken sleep, up several times.',
        'Slept through.',
        'Up twice overnight.',
        'One waking only.',
        'Very broken night.',
        'Good night’s sleep.',
        'Exhausted, woke with every stir.',
        'Slept reasonably well.',
        'Woke with Bruce twice.',
        'Slept through his 2am waking.',
        'Very broken, up most of the night.',
        'Better night, one waking.',
        'Slept well.',
        'Up twice, briefly each time.',
        'Fitbit hasn’t synced the last couple of nights.',
        'Still showing no new data.',
      ]),
      2,
      ['Fitbit hasn’t synced the last couple of nights.', 'Still showing no new data.'],
    ),
    consentDocuments: [
      { id: 'consent-011-a', filename: 'whitfield-dyad-consent-signed.pdf', uploadedDate: '2026-06-20' },
    ],
    // The "attended the sessions, skipped some modules" case. Module status is
    // deliberately INDEPENDENT of session status — a consumer can turn up to
    // the catch-up without having done the module, and that gap is exactly
    // what a researcher needs to see.
    //
    // The `not-started` entries below are modules whose own catch-up has
    // already been held, which is what makes "left incomplete" true of them
    // rather than merely "not yet reached". Keep that alignment: marking a
    // module incomplete when its session has not happened contradicts the
    // sessions table on the same page.
    moduleEngagement: consumerModuleEngagement([
      { moduleId: 'getting-started', status: 'completed', lastActivityDate: '2026-06-20', slidesCompleted: 6 },
      { moduleId: 'understanding-sleep-dementia', status: 'not-started' },
      { moduleId: 'calming-bedtime-routine', status: 'not-started' },
      { moduleId: 'managing-nighttime-waking', status: 'completed', lastActivityDate: '2026-08-16', slidesCompleted: 6 },
      { moduleId: 'daytime-habits', status: 'in-progress', lastActivityDate: '2026-08-19', slidesCompleted: 3 },
    ]),
    sessionRecordings: [
      { id: 'rec-011-1', session: 1, title: 'Onboarding: Whitfield dyad', date: '2026-06-24', time: '10:00', durationMin: 45 },
    ],
    upcomingSession: {
      session: 2,
      // Dated TODAY on purpose, so the "session today" state is visible on
      // first load without anyone having to navigate to it.
      date: '2026-07-22',
      time: '10:00',
      meetingId: '812 4456 7723',
      zoomLink: 'https://zoom.us/j/8124456723',
    },
    // A seeded plan bypasses `bulkSetSessionPlan`, which is what normally
    // mints a row's Zoom credentials. Every dated row therefore has to carry
    // its own `meetingId`/`zoomLink` here — without them the session roadmap
    // silently shows no join link for any row except the one that happens to
    // match the legacy `upcomingSession` field above.
    sessionPlan: {
      sessions: [
        { session: 1, date: '2026-06-24', time: '10:00' },
        {
          session: 2,
          date: '2026-07-22',
          time: '10:00',
          moduleTargetDate: '2026-07-14',
          meetingId: '812 4456 7723',
          zoomLink: 'https://zoom.us/j/8124456723',
        },
        {
          session: 3,
          date: '2026-08-05',
          time: '10:00',
          moduleTargetDate: '2026-07-28',
          meetingId: '834 1927 5510',
          zoomLink: 'https://zoom.us/j/8341927510',
        },
        {
          session: 4,
          date: '2026-08-19',
          time: '10:00',
          moduleTargetDate: '2026-08-11',
          meetingId: '857 3364 9182',
          zoomLink: 'https://zoom.us/j/8573649182',
        },
        {
          session: 5,
          date: '2026-09-02',
          time: '10:00',
          moduleTargetDate: '2026-08-25',
          meetingId: '879 6620 3345',
          zoomLink: 'https://zoom.us/j/8796203345',
        },
        {
          session: 6,
          date: '2026-09-16',
          time: '10:00',
          moduleTargetDate: '2026-09-08',
          meetingId: '891 2287 6631',
          zoomLink: 'https://zoom.us/j/8912276631',
        },
        {
          session: 7,
          date: '2026-09-30',
          time: '10:00',
          moduleTargetDate: '2026-09-22',
          meetingId: '903 5541 8827',
          zoomLink: 'https://zoom.us/j/9035418827',
        },
      ],
      adHocMeetings: [],
    },
  },
  // The "coach assigned, plan not built" case — the entry point for session
  // planning, and the reason this dyad has no plan and no upcoming session.
  {
    id: 'dyad-012',
    // Two days after consent. Present so the timeline's "Coach assigned"
    // timepoint has a real date rather than "Not recorded".
    coachAssignedDate: '2026-07-12',
    // ⚠️ VIOLATES the referential rule on `SpacesCoach`: Mei-Ling Chen is
    // certified but has NO `SpacesCoach` row, because she is the fixture's
    // waiting-to-be-onboarded candidate. Coach Management builds its roster
    // from `spacesCoaches` alone, so her caseload of one is invisible there,
    // and onboarding her makes a consumer appear that was never assigned
    // through the UI.
    //
    // Accepted as fixture data, but a backend must DECIDE the rule explicitly:
    // either forbid assigning a consumer to a non-onboarded coach (making the
    // FK target the SpacesCoach table), or model "assigned before onboarding"
    // as a real state of its own.
    coachId: 'mei-ling-chen',
    patient: {
      name: 'Dorothy Kellerman',
      age: 76,
      background:
        'Vascular dementia, lives with her son. Sundowning most evenings from around 5pm, settles late (often after 11pm).',
      email: 'dorothy.kellerman@example.com',
      phone: '0413 664 118',
    },
    carer: {
      name: 'Frank Kellerman',
      age: 49,
      relationship: 'Son',
      background:
        'Works full-time and cares for Dorothy in the evenings and overnight. New to caregiving in the last 8 months.',
      email: 'frank.kellerman@example.com',
      phone: '0413 664 552',
    },
    sleepGoals: 'Shift Dorothy’s settle time earlier and reduce evening agitation.',
    caregivingContext:
      'Frank is Dorothy’s sole carer; no formal in-home support yet, an aged-care assessment is pending.',
    sessionsCompleted: [],
    annotationSummaries: [],
    patientLog: healthLog(58, 290, 6, [
      'Agitated from 5:30pm, settled 11:40pm.',
      'Similar pattern, slightly earlier settle.',
      'Difficult evening, TV left on till midnight.',
      'Settled by 11pm after dimming the lounge lights.',
      'Best evening yet, asleep by 10:30pm.',
    ]),
    carerLog: healthLog(
      55,
      280,
      3,
      [
        'Exhausted, stayed up managing Dorothy.',
        'Slightly better.',
        'Poor night, work day after.',
        'Slept while Dorothy settled early.',
        'Good night.',
      ],
      false,
    ),
    consentDocuments: [
      { id: 'consent-012-a', filename: 'kellerman-dyad-consent-signed.pdf', uploadedDate: '2026-07-10' },
    ],
    // MUST stay empty. Module content is gated on a session plan existing, and
    // this dyad has none, so any progress here is a state the platform cannot
    // produce.
    moduleEngagement: consumerModuleEngagement([]),
    sessionRecordings: [],
    // MUST have no `upcomingSession`. This dyad once carried a stale
    // `{ session: 1 }` from before the numbering correction, which rendered as
    // a literal "Session 0" in every table that falls back to this field.
    // Nothing is scheduled for this consumer yet, which is the whole point of
    // the case — leave the field absent rather than filling it in.
  },
  // The completed case: all 7 sessions and all 7 modules done, a reflection
  // written and shared, and nothing upcoming. The only dyad that exercises the
  // finished state of every session and module surface.
  {
    id: 'dyad-013',
    coachId: 'helen-zhang',
    coachAssignedDate: '2026-04-03',
    patient: {
      name: 'Eleanor Sinclair',
      age: 84,
      background:
        'Mixed vascular/Alzheimer’s dementia, lives at home with her daughter. Early presentation was frequent 3am waking with confusion about the time of day; settled well over the course of the program.',
      email: 'eleanor.sinclair@example.com',
      phone: '0416 220 741',
    },
    carer: {
      name: 'Margaret Sinclair',
      age: 57,
      relationship: 'Daughter',
      background:
        'Eleanor’s primary carer, works part-time around caregiving. Was near burnout at intake; reports much better rest now the overnight waking has eased.',
      email: 'margaret.sinclair@example.com',
      phone: '0421 664 908',
    },
    sleepGoals: 'Reduce Eleanor’s 3am confused waking and help Margaret recover a full night’s sleep.',
    caregivingContext:
      'Margaret is Eleanor’s sole live-in carer; a home-care package with 4 hours/week of respite started midway through the program.',
    sessionsCompleted: [
      { session: 1, completedDate: '2026-04-08', completedTime: '11:00' },
      { session: 2, completedDate: '2026-04-22', completedTime: '11:00' },
      { session: 3, completedDate: '2026-05-06', completedTime: '11:00' },
      { session: 4, completedDate: '2026-05-20', completedTime: '11:30' },
      { session: 5, completedDate: '2026-06-03', completedTime: '11:00' },
      { session: 6, completedDate: '2026-06-17', completedTime: '11:00' },
      { session: 7, completedDate: '2026-07-01', completedTime: '11:00' },
    ],
    // One reflection per consumer, scoped to the coach's first session with
    // them and written in the coach's own first-person voice. Its six `label`
    // strings must match the SIPTEA component names the reflection wizard
    // writes, exactly — see `ReflectionComponentAnswer`.
    annotationSummaries: [
      {
        id: 'ann-013-1',
        components: [
          {
            label: 'Shared understanding',
            answer:
              'Margaret and I agreed straight away that the 3am confused waking was the priority, and that felt like a genuinely shared read of the problem. She’d already tried a few things herself before we spoke. The one gap: I wanted to start with the bedtime routine first, and Margaret initially just wanted to jump straight to the 3am waking itself.',
          },
          {
            label: 'Implementation intent',
            answer:
              'We got as far as “start the wind-down at 8pm” but not much further. I should have pinned down what the wind-down actually consists of — Margaret left the call knowing the time but not really the steps.',
          },
          {
            label: 'Problem identification',
            answer:
              'Margaret raised that Bruce resists the routine on nights she works late, which we talked through. What I did not raise: she has no overnight support at all, so any plan that needs her awake at 3am is fragile.',
          },
          {
            label: 'Tailoring',
            answer:
              'Dropped the standard advice about a fixed wake time — Margaret’s shifts make that impossible. Kept the bedtime end of it, which is the part she can actually control.',
          },
          {
            label: 'Emotion navigation',
            answer:
              'Margaret was close to burnout when we spoke; it came through more in how flat she sounded than in anything she said outright. I held off on any practical suggestions until I’d properly acknowledged that, which felt like the right call before asking her to take anything else on.',
          },
          {
            label: 'Action and goals',
            answer:
              'Agreed to start with one small, consistent change (the bedtime routine) rather than several at once, given how stretched Margaret already was. One step feels right — two would have been too much this week.',
          },
        ],
        shared: true,
        date: '2026-04-09',
        time: '09:30',
      },
    ],
    patientLog: healthLog(78, 360, 1, [
      'Settled by midnight, no waking.',
      'Quiet night throughout.',
      'Brief stir around 2am, resettled unaided.',
      'Slept through.',
      'Slept through, best night in weeks.',
    ]),
    carerLog: healthLog(74, 420, 0, [
      'Slept through, first full night in a while.',
      'Good night.',
      'Woke briefly with Eleanor’s stir, back to sleep quickly.',
      'Slept through.',
      'Slept through.',
    ]),
    consentDocuments: [
      { id: 'consent-013-a', filename: 'sinclair-dyad-consent-signed.pdf', uploadedDate: '2026-04-01' },
    ],
    // Every module completed, each `lastActivityDate` landing after the
    // session that unlocked it — the ordering the unlock rule requires.
    moduleEngagement: consumerModuleEngagement([
      { moduleId: 'getting-started', status: 'completed', lastActivityDate: '2026-04-05', slidesCompleted: 6 },
      { moduleId: 'understanding-sleep-dementia', status: 'completed', lastActivityDate: '2026-04-15', slidesCompleted: 6 },
      { moduleId: 'calming-bedtime-routine', status: 'completed', lastActivityDate: '2026-04-29', slidesCompleted: 6 },
      { moduleId: 'managing-nighttime-waking', status: 'completed', lastActivityDate: '2026-05-13', slidesCompleted: 6 },
      { moduleId: 'daytime-habits', status: 'completed', lastActivityDate: '2026-05-27', slidesCompleted: 6 },
      { moduleId: 'carer-own-sleep', status: 'completed', lastActivityDate: '2026-06-10', slidesCompleted: 6 },
      { moduleId: 'using-sleep-data', status: 'completed', lastActivityDate: '2026-06-24', slidesCompleted: 6 },
    ]),
    sessionRecordings: [
      { id: 'rec-013-1', session: 1, title: 'Onboarding: Sinclair dyad', date: '2026-04-08', time: '11:00', durationMin: 46 },
      { id: 'rec-013-2', session: 2, title: 'Post-Module 1: Sinclair dyad', date: '2026-04-22', time: '11:00', durationMin: 42 },
      { id: 'rec-013-3', session: 3, title: 'Post-Module 2: Sinclair dyad', date: '2026-05-06', time: '11:00', durationMin: 45 },
      { id: 'rec-013-4', session: 4, title: 'Post-Module 3: Sinclair dyad', date: '2026-05-20', time: '11:30', durationMin: 48 },
      { id: 'rec-013-5', session: 5, title: 'Post-Module 4: Sinclair dyad', date: '2026-06-03', time: '11:00', durationMin: 44 },
      { id: 'rec-013-6', session: 6, title: 'Post-Module 5: Sinclair dyad', date: '2026-06-17', time: '11:00', durationMin: 47 },
      { id: 'rec-013-7', session: 7, title: 'Post-Module 6: Sinclair dyad', date: '2026-07-01', time: '11:00', durationMin: 43 },
    ],
    // No `upcomingSession` — the program is complete. The plan below mirrors
    // the real completion dates exactly; the two must not diverge.
    sessionPlan: {
      sessions: [
        { session: 1, date: '2026-04-08', time: '11:00' },
        { session: 2, date: '2026-04-22', time: '11:00', moduleTargetDate: '2026-04-14' },
        { session: 3, date: '2026-05-06', time: '11:00', moduleTargetDate: '2026-04-28' },
        { session: 4, date: '2026-05-20', time: '11:30', moduleTargetDate: '2026-05-12' },
        { session: 5, date: '2026-06-03', time: '11:00', moduleTargetDate: '2026-05-26' },
        { session: 6, date: '2026-06-17', time: '11:00', moduleTargetDate: '2026-06-09' },
        { session: 7, date: '2026-07-01', time: '11:00', moduleTargetDate: '2026-06-23' },
      ],
      adHocMeetings: [],
    },
  },

  // The unassigned case: enrolled by the research coordinator, no coach yet.
  // The Fitbit was set up at technical intake, ahead of assignment, and has
  // stopped syncing for the last two nights — so this dyad also demonstrates
  // that a sync alert is independent of having a coach.
  {
    id: 'dyad-030',
    patient: {
      name: 'Harold Ableson',
      age: 79,
      background:
        'Mixed vascular/Alzheimer’s dementia, lives at home with his daughter. Recently started calling out for his late wife around midnight, then struggles to resettle.',
      email: 'harold.ableson@example.com',
      phone: '0417 903 268',
    },
    carer: {
      name: 'Diane Ableson',
      age: 52,
      relationship: 'Daughter',
      background:
        'Moved in with her father six months ago to care for him full-time; new to overnight caregiving and finding the midnight waking especially distressing.',
      email: 'diane.ableson@example.com',
      phone: '0417 903 815',
    },
    sleepGoals: 'Reduce Harold’s midnight distress calling and help Diane feel less alone managing it overnight.',
    caregivingContext:
      'Diane is Harold’s sole live-in carer; a home-care package assessment was submitted but hasn’t been actioned yet.',
    sessionsCompleted: [],
    annotationSummaries: [],
    consentDocuments: [
      { id: 'consent-030-a', filename: 'ableson-dyad-consent-signed.pdf', uploadedDate: '2026-07-15' },
    ],
    // MUST stay empty. No coach means no plan, and module content is gated on
    // a plan — a consumer part-way through a module while still waiting for a
    // coach is a state the platform cannot produce.
    moduleEngagement: consumerModuleEngagement([]),
    sessionRecordings: [],
    // Written out night by night rather than via `healthLog()` because the
    // sync gap here falls on specific dates ending at TODAY.
    patientLog: [
      { date: '2026-07-18', synced: true, remPercent: 19, deepPercent: 16, lightPercent: 65, durationMin: 310, disturbances: 5, diaryEntry: 'Called out for his wife around midnight, took a while to settle.', diary: diaryAnswersFor(0, 5) },
      { date: '2026-07-19', synced: true, remPercent: 21, deepPercent: 15, lightPercent: 64, durationMin: 295, disturbances: 6, diaryEntry: 'Similar pattern, briefly agitated.', diary: diaryAnswersFor(1, 6) },
      { date: '2026-07-20', synced: true, remPercent: 20, deepPercent: 16, lightPercent: 64, durationMin: 300, disturbances: 5, diaryEntry: 'Similar night, no major change.', diary: diaryAnswersFor(2, 5) },
      { date: '2026-07-21', synced: false, diaryEntry: 'Device wasn’t on the charger; no reading.', diary: diaryAnswersFor(3, 5) },
      { date: '2026-07-22', synced: false, diaryEntry: 'Still not syncing; Diane will check the app tonight.', diary: diaryAnswersFor(4, 4) },
    ],
    carerLog: [
      { date: '2026-07-18', synced: true, remPercent: 20, deepPercent: 14, lightPercent: 66, durationMin: 330, disturbances: 2, diaryEntry: 'Up with Dad twice.', diary: diaryAnswersFor(0, 2) },
      { date: '2026-07-19', synced: true, remPercent: 22, deepPercent: 13, lightPercent: 65, durationMin: 320, disturbances: 2, diaryEntry: 'Exhausted but slept in patches.', diary: diaryAnswersFor(1, 2) },
      { date: '2026-07-20', synced: true, remPercent: 21, deepPercent: 14, lightPercent: 65, durationMin: 340, disturbances: 1, diaryEntry: 'Slightly better night.', diary: diaryAnswersFor(2, 1) },
      { date: '2026-07-21', synced: true, remPercent: 19, deepPercent: 15, lightPercent: 66, durationMin: 310, disturbances: 3, diaryEntry: 'Broken sleep again.', diary: diaryAnswersFor(3, 3) },
      { date: '2026-07-22', synced: true, remPercent: 20, deepPercent: 15, lightPercent: 65, durationMin: 335, disturbances: 1, diaryEntry: 'Reasonable night.', diary: diaryAnswersFor(4, 1) },
    ],
  },
]

// ---------------------------------------------------------------------------
// NOTES
//
// Two note types with near-identical shapes, deliberately kept separate — see
// `ResearchNote` at the bottom of this section for why.
//
// NEITHER RECORDS AN AUTHOR. For a research record this is a real gap: there
// is no user id on a note and no identity model to supply one.
// `attachments` stores FILENAMES ONLY — the uploaded file is discarded, so the
// UI listing a filename reads as a successful upload that never happened.
// ---------------------------------------------------------------------------

/** A note attached to a coach. `coachId` is REQUIRED — that is the distinction
 *  from `ResearchNote`. Adding a `dyadId` narrows the note to one consumer on
 *  that coach's caseload; without it, the note is about the coach generally. */
export interface SupervisionNote {
  id: string
  coachId: string
  /** Optional. When set, must name a dyad currently assigned to `coachId`. */
  dyadId?: string
  title: string
  date: string
  time: string
  notes: string
  /** Filenames only. Nothing is stored. */
  attachments: string[]
}

/** Three seeded notes: two coach-level, one scoped to a dyad so the
 *  consumer-scoped notes table has rows rather than an empty state.
 *
 *  A note under one coach discussing a dyad assigned to a different coach
 *  reads as a data error — keep the narratives aligned with the caseloads in
 *  `consumerDyads` above if either changes. */
export const supervisionNotes: SupervisionNote[] = [
  {
    id: 'sup-001',
    coachId: 'helen-zhang',
    title: 'First supervision: Kellerman dyad',
    date: '2026-07-21',
    time: '14:00',
    notes:
      'Helen is holding structure well in her first dyad. Flagged that she moved to the nap-timing suggestion fairly early in the session, and discussed slowing the shared-understanding phase down even when a cause seems obvious. She agreed to name what she noticed before proposing anything at the next session. No safety concerns raised.',
    attachments: ['session-1-kellerman-notes.pdf'],
  },
  {
    id: 'sup-002',
    coachId: 'helen-zhang',
    title: 'Check-in: Kellerman dyad, Frank’s capacity',
    date: '2026-07-22',
    time: '10:30',
    notes:
      'Brief check-in after Helen raised a concern about Frank’s capacity to continue as sole overnight carer. Advised she keep documenting observations and that the research coordinator will flag the pending aged-care assessment for follow-up. Not a SPACES scope issue, but worth tracking.',
    attachments: [],
  },
  // The one dyad-scoped note. It is what gives the consumer-scoped notes table
  // something to render other than its empty state.
  {
    id: 'sup-007',
    coachId: 'helen-zhang',
    dyadId: 'dyad-011',
    title: 'Session 1: Onboarding',
    date: '2026-06-24',
    time: '10:00',
    notes:
      'Good first session with Bruce and Joan. Stayed with Joan’s exhaustion before moving to anything practical; that felt like the moment trust built for the rest of the conversation. Confirmed the daytime-napping pattern as a likely driver of the overnight waking; agreed with the family to trial a firmer 3pm nap cut-off before Session 2.',
    attachments: [],
  },
]

/**
 * A researcher's own note about a consumer. `dyadId` is required and there is
 * no coach at all — that is the whole reason this is a separate type.
 *
 * A researcher needs to write about a consumer regardless of whether a coach
 * has been assigned yet, which a `SupervisionNote` cannot express: its
 * `coachId` is required. Making that field optional instead would have forced
 * every existing reader of `supervisionNotes` to handle an authorless note it
 * never actually receives. Two narrow types beat one loose one here.
 */
export interface ResearchNote {
  id: string
  dyadId: string
  title: string
  date: string
  time: string
  notes: string
  /** Filenames only. Nothing is stored. */
  attachments: string[]
}

/** Intentionally empty — the researcher-notes surface starts at its empty
 *  state, and notes are added live during a session. */
export const researchNotes: ResearchNote[] = []

// ---------------------------------------------------------------------------
// DERIVED VALUES
// ---------------------------------------------------------------------------

/** A dyad's reflection status, derived from the most recent entry rather than
 *  a stored flag. Distinguishes "written but withheld" from "none written" —
 *  do not collapse those two, they mean different things to a researcher. */
export function latestAnnotationState(dyad: ConsumerDyad): AnnotationShareState {
  const latest = dyad.annotationSummaries[0]
  if (!latest) return 'not-yet'
  return latest.shared ? 'shared' : 'not-shared'
}
