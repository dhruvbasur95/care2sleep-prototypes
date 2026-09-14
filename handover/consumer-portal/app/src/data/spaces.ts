/**
 * Round 3 dummy data — Research Dashboard, Coaches (SPACES delivery oversight).
 * Domain-realistic placeholder content only; no real people or organisations.
 * Terminology per CLAUDE.md (Coach / Consumer / Annotation summary / Certification).
 *
 * SPACES coaches reference an identity already in `research.ts`'s certified
 * pool (`Coach.certification.outcome === 'pass'`) by id — this file only adds
 * the SPACES-specific delivery-oversight fields, matching the project's
 * pattern of state living in `research-store.tsx` and seed data living beside
 * it in `data/`.
 */

import { TODAY, toLocalISODate } from './format'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type InvitationStatus = 'invited' | 'accepted' | 'declined'
export type JoinedStatus = 'not-joined' | 'joined'

export const invitationStatusLabels: Record<InvitationStatus, string> = {
  invited: 'Invited',
  accepted: 'Accepted',
  declined: 'Declined',
}

export const joinedStatusLabels: Record<JoinedStatus, string> = {
  'not-joined': 'Not joined',
  joined: 'Joined',
}

/** The 7 SPACES sessions: 1 planning session + 1 catch-up per module.
 *
 *  Numbering (Round 14.1 correction): `number` is the internal 1-7 key used
 *  everywhere data is stored/keyed (`sessionCompletion`, `sessionRecordings`,
 *  `sessionPlans`, etc.) — never renumbered, to avoid a data migration
 *  across every seeded dyad. What a coach actually SEES is `number - 1`
 *  ("Session 0" through "Session 6") — see `displaySessionNumber()`. Session
 *  0 (internal 1, "Planning") is the coach+consumer's first meeting, where
 *  they agree module completion target dates and the post-module catch-up
 *  sessions that follow each one — it is NOT the "onboarding module"
 *  (`CONSUMER_MODULES[0]`, "Getting started with Care2Sleep"), which is a
 *  separate, always-unlocked piece of content the consumer can start
 *  anytime, independent of this session. Sessions 1-6 (internal 2-7) are the
 *  post-module catch-ups: Session N happens once the consumer finishes
 *  Module N, and completing it unlocks Module N+1 — see `moduleUnlockState`. */
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

/** The session number as a coach sees it (0 for the planning session, 1-6
 *  for the post-module catch-ups) — the internal `SpacesSession.number`
 *  (1-7) is never shown directly in UI copy. Only use this for the 6 real
 *  catch-ups (internal 2-7); the planning session's own *number* (0) is
 *  never surfaced as "Session 0" anywhere a coach/researcher/consumer reads
 *  it (`SessionTracker` excludes it as a row entirely) — use
 *  `sessionRowLabel()` instead when a specific session (including
 *  possibly the planning one) needs a real display label. */
export function displaySessionNumber(internalNumber: number): number {
  return internalNumber - 1
}

/** The label a coach/researcher/consumer actually reads for a given
 *  session, including the planning one — "Planning" (never "Session 0"),
 *  or "Session {displaySessionNumber(internalNumber)}" for the 6 real
 *  catch-ups. Use this instead of `displaySessionNumber()` directly
 *  whenever the internal number being labeled could be 1 (e.g. iterating
 *  the full `SPACES_SESSIONS` list, or reading a legacy `upcomingSession`
 *  field that predates the Round 14.1 numbering correction) — see
 *  `nextUpcomingSessionNumber()`'s own doc comment for the related "is this
 *  even a real upcoming *item*" question, which this function doesn't
 *  answer on its own. */
export function sessionRowLabel(internalNumber: number): string {
  return internalNumber === 1 ? 'Planning' : `Session ${displaySessionNumber(internalNumber)}`
}

/** One completed SPACES session, with the date/time it was completed —
 *  Round 5 (Consumer Portal): extends the field from a bare session number so
 *  the 7-Session Roadmap's completion record table has something to show.
 *  Shared with the Research Dashboard's own session-tracker views, which
 *  display the same date/time (see `SessionTracker` / `CoachMatchingTab`). */
export interface SessionCompletionRecord {
  session: number
  completedDate: string
  completedTime: string
}

/**
 * How many *numbered* sessions a consumer works through — the 6 post-module
 * catch-ups a coach and consumer read as "Session 1" through "Session 6".
 * One less than `SPACES_SESSIONS`, whose first entry is the unnumbered
 * Planning session (see `sessionRowLabel`).
 */
export const SPACES_CATCHUP_COUNT = SPACES_SESSIONS.length - 1

/**
 * Completed sessions as a "N of 6" progress figure, excluding the Planning
 * session.
 *
 * Round 21 fix. Every "Sessions Completed" column counted raw records against
 * `SPACES_SESSIONS.length`, so a dyad whose only completed record was the
 * Planning session read "1 of 7" directly beside "Next Session: Session 1" —
 * two numbers about the same consumer that cannot both be true as a reader
 * takes them. Planning is not one of the numbered sessions and is already
 * represented by its own "Session Plan: Created" chip, so it is excluded here
 * rather than renumbered.
 */
export function catchupSessionsCompleted(completed: SessionCompletionRecord[]): number {
  return completed.filter((c) => c.session !== 1).length
}

/** The dyad's next scheduled SPACES session — Round 5 (Consumer Portal).
 *  Doesn't exist anywhere yet since the Coach Delivery Portal (the natural
 *  owner of scheduling) isn't built; dummy data only. Title and coach name
 *  are derived at render time from `SPACES_SESSIONS`/`coaches` rather than
 *  stored twice. */
export interface UpcomingSession {
  session: number
  date: string
  time: string
  meetingId: string
  zoomLink: string
}

/** One session's plan — set by the coach (session planning, Round 14) during
 *  Session 0 (Planning) and editable afterward. `date`/`time` stay undefined
 *  until planned; `moduleTargetDate` only applies to internal session
 *  numbers 2-7 (displayed Sessions 1-6) — the date the module that catch-up
 *  reviews (module `number - 1`) becomes available/should be done by.
 *  Domain-model correction (Round 14.3): the consumer completes the module
 *  BEFORE the coach catches up on it, never the reverse, so
 *  `moduleTargetDate` always falls strictly BEFORE this row's own `date` —
 *  true by construction, since `generatePlanRows()` is the only writer of
 *  fresh dates (Round 14.4 removed per-row date editing from the wizard).
 *  The actual unlock trigger is completing the
 *  *previous* session (see `moduleUnlockState`); this field is just the
 *  target the coach communicates to the consumer. */
export interface SessionPlanRow {
  session: number
  date?: string
  time?: string
  /** Optional session end time (Round 38, Zoom-style "from … to" booking in
   *  the plan wizard) — additive; every earlier surface renders `time` alone
   *  and is unaffected when this is absent. */
  endTime?: string
  moduleTargetDate?: string
  /** True once this row is edited after already being set — shown as a
   *  "Rescheduled" indicator. Rescheduling is manual, single-row, no cascade
   *  to later rows. */
  rescheduled?: boolean
  /** The date this row held before it was last moved — what the consumer's
   *  session-plan strip renders as "was Wed 22 Oct" (frame `930:5248`).
   *
   *  Additive and optional for the same reason `endTime` is: every surface
   *  built before this renders `rescheduled` as a bare flag and is unaffected
   *  when it is absent. It exists because `rescheduled: boolean` records *that*
   *  a row moved but not *from when*, and the frame draws the old date — a
   *  strikethrough with nothing struck through is not a state. */
  previousDate?: string
  /** Generated once the row is first dated (mirrors `AdHocMeeting`'s
   *  placeholder pattern — no real Zoom API in this prototype). */
  meetingId?: string
  zoomLink?: string
}

/** A one-off meeting outside the fixed 7-session plan — doesn't count toward
 *  SPACES completion or unlock any module. Meeting ID/Zoom link are
 *  generated client-side (no real Zoom API in this prototype), matching the
 *  existing seed data's placeholder pattern. */
export interface AdHocMeeting {
  id: string
  title: string
  date: string
  time: string
  meetingId: string
  zoomLink: string
}

/** A dyad's whole-arc session plan — present (if only with unset rows) once
 *  the coach starts planning; lives in `sessionPlans` (`research-store.tsx`),
 *  not mutated on `ConsumerDyad` directly, mirroring how `sessionCompletion`
 *  is kept separate from the `sessionsCompleted` seed field. */
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

/** First-time planning assist (session planning, Round 14; guided-wizard
 *  redesign, Round 14.1; question-order + loading-state redesign, Round 14.2;
 *  fixed-weekly-cadence + day-of-week redesign, Round 14.3) — per the real
 *  SPACES delivery protocol, coaches meet consumers every week, so cadence is
 *  no longer a question at all (`WEEKLY_CADENCE_DAYS`, fixed). The coach
 *  instead picks two things: which day of the week each module becomes
 *  available, and which day + time they'll catch up once it's done. Every
 *  other session date and each gated module's target date cascades from
 *  those two weekday choices, so a coach is never handed 13 blank fields to
 *  fill by hand. */
export const WEEKLY_CADENCE_DAYS = 7

/** `value` matches JS `Date#getDay()` (1 = Monday … 5 = Friday); listed
 *  Monday-first for a natural reading order in the calendar-style day
 *  picker (Round 14.4 — replaces a plain `<select>`). Weekends excluded
 *  (Round 15, direct instruction) — module unlocks and catch-ups only ever
 *  happen on working days. */
export const DAY_OF_WEEK_OPTIONS = [
  { label: 'Monday', short: 'Mon', value: 1 },
  { label: 'Tuesday', short: 'Tue', value: 2 },
  { label: 'Wednesday', short: 'Wed', value: 3 },
  { label: 'Thursday', short: 'Thu', value: 4 },
  { label: 'Friday', short: 'Fri', value: 5 },
]

/** All seven days, for the **module unlock day** only (Round 38, direct
 *  instruction: "dyads might want to learn on Sat or Sun"). The catch-up stays
 *  on `DAY_OF_WEEK_OPTIONS` because that one is a coach's working meeting,
 *  whereas the module simply appears in the client's portal — nobody has to be
 *  at work for that, and a carer's free time is often the weekend. */
export const DAY_OF_WEEK_OPTIONS_ALL = [
  ...DAY_OF_WEEK_OPTIONS,
  { label: 'Saturday', short: 'Sat', value: 6 },
  { label: 'Sunday', short: 'Sun', value: 0 },
]

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toLocalISODate(d)
}

/** The next date on/after `fromIso` that falls on `weekday` (`Date#getDay()`
 *  convention, 0 = Sunday … 6 = Saturday). Pass `strictlyAfter` to require a
 *  date later than `fromIso` even when `fromIso` itself is already on
 *  `weekday` — used for a catch-up, which must never land the same day as
 *  the module it reviews. */
export function nextWeekday(fromIso: string, weekday: number, strictlyAfter = false): string {
  const d = new Date(`${fromIso}T00:00:00`)
  let diff = (weekday - d.getDay() + 7) % 7
  if (diff === 0 && strictlyAfter) diff = 7
  return addDays(fromIso, diff)
}

/** Meeting-first plan generation (Round 38 — reverses the Round 14.3-15
 *  question order at the data level too). The weekly catch-up meeting is the
 *  plan's anchor: `firstCatchupDate` is the coach's explicitly chosen first
 *  session (any future occurrence of the meeting weekday, no longer silently
 *  the nearest one), and every later session lands weekly after it. Each
 *  module's target date is then derived BACKWARDS from the session that
 *  reviews it: `session date - runway`, where runway is the number of days
 *  between the chosen module weekday and the meeting weekday, wrapping the
 *  week — so a Friday module ahead of a Thursday catch-up correctly yields 6
 *  days, not an invalid same-week ordering. Same-day is excluded in the UI
 *  (the client must finish the module before the session); the `|| 7` guard
 *  below is defensive only. Week 1's module can land before the plan is even
 *  created when the first session is only days away — it clamps to
 *  `session0Date` (arrives immediately) rather than shifting the whole plan,
 *  so the meeting dates a coach agreed with their client are never silently
 *  moved. */
export function generatePlanRows(
  session0Date: string,
  firstCatchupDate: string,
  moduleWeekday: number,
  catchupTime: string,
  catchupEndTime?: string,
): SessionPlanRow[] {
  const catchupWeekday = new Date(`${firstCatchupDate}T00:00:00`).getDay()
  const runway = (catchupWeekday - moduleWeekday + 7) % 7 || 7
  return SPACES_SESSIONS.map((s, i) => {
    // Session 0 (Planning, s.number === 1) is today's live planning session
    // — it carries no module target of its own, and its date is fixed
    // separately from the Session-1-onward weekly cascade below.
    if (s.number === 1) {
      return { session: 1, date: session0Date, time: catchupTime, endTime: catchupEndTime }
    }
    const cycleIndex = i - 1 // 0-based: displayed Session 1 is index 0
    const date = addDays(firstCatchupDate, cycleIndex * WEEKLY_CADENCE_DAYS)
    let moduleTargetDate = addDays(date, -runway)
    if (moduleTargetDate < session0Date) moduleTargetDate = session0Date
    return { session: s.number, date, time: catchupTime, endTime: catchupEndTime, moduleTargetDate }
  })
}

/** True once every row has a date — i.e. the coach has planned the whole arc
 *  (rows can still be individually rescheduled afterward). */
export function isPlanSet(plan: SessionPlan | undefined): boolean {
  return !!plan && plan.sessions.every((s) => !!s.date)
}

/** The earliest planned row not yet marked complete — supersedes reading
 *  `dyad.upcomingSession` directly wherever a plan exists. Excludes the
 *  planning session (internal 1) even if it were somehow still dated and
 *  incomplete at the same time (shouldn't happen in practice — creating a
 *  plan and completing the planning session happen together, see
 *  `PlanSessionsModal.handleSubmit`) — nothing that reads "the next
 *  session" should ever be handed the planning session back as if it were
 *  a real, numbered, schedulable item. */
export function nextPlannedSession(
  plan: SessionPlan | undefined,
  completed: SessionCompletionRecord[],
): SessionPlanRow | undefined {
  if (!plan) return undefined
  return plan.sessions
    .filter((s) => s.session !== 1 && !!s.date && !completed.some((c) => c.session === s.session))
    .sort((a, b) => a.session - b.session)[0]
}

/** The next not-yet-completed, dated real session across a dyad's plan (or
 *  its legacy `upcomingSession` field as a fallback, for a dyad with no
 *  plan yet), as the DISPLAY number a coach/researcher actually reads —
 *  shared by every "Upcoming Session" table column that used to duplicate
 *  this same `nextPlannedSession(...) ?? legacyUpcoming` fallback inline
 *  (`ConsumerManagementPage.tsx`'s roster, `SpacesCoachProfilePage.tsx`'s
 *  consumer caseload table). The planning session (internal 1) is
 *  deliberately excluded from the legacy-field fallback here too — some
 *  older seed dyads (e.g. Dorothy Kellerman, pre-Round-14.1) still carry an
 *  `upcomingSession.session === 1`, which without this guard resolves to
 *  `displaySessionNumber(1) === 0` and renders as a nonsensical "Session 0"
 *  in these tables. A dyad whose only pending item is the planning meeting
 *  reads as having nothing scheduled yet, same as a dyad with no
 *  `upcomingSession` at all — this matches `nextPlannedSession`'s own
 *  exclusion above. */
/**
 * The next upcoming session as a whole record — plan row first, legacy
 * `upcomingSession` field as the fallback — rather than just its number.
 *
 * Round 27: extracted so a surface showing the session *number* and its
 * *date* side by side (frame `285:6310`'s "Upcoming Session" + "Session Date"
 * columns) reads both off one resolution of "which session is next". Deriving
 * the date from a second, hand-rolled copy of the fallback chain is exactly
 * how this project's most-repeated bug class starts — two surfaces, one fact,
 * two fields that drift. `nextUpcomingSessionNumber` now delegates here, so
 * there is a single source for the whole answer.
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

export function nextUpcomingSessionNumber(
  plan: SessionPlan | undefined,
  completed: SessionCompletionRecord[],
  legacyUpcoming?: UpcomingSession,
): number | undefined {
  const next = nextUpcomingSessionEntry(plan, completed, legacyUpcoming)
  return next ? displaySessionNumber(next.session) : undefined
}

/**
 * Consumer Management Table's "current phase" column (Round 4) — blank while
 * unassigned (no coach yet), otherwise the SPACES session the consumer is
 * currently up to. `completed` is that dyad's `sessionCompletion` entry.
 */
export function spacesPhaseLabel(hasCoach: boolean, completed: SessionCompletionRecord[]): string {
  if (!hasCoach) return '—'
  if (completed.length === 0) return 'Not yet started'
  const next = Math.max(...completed.map((c) => c.session)) + 1
  const nextSession = SPACES_SESSIONS.find((s) => s.number === next)
  return nextSession ? `Session ${nextSession.number}: ${nextSession.name}` : 'All sessions complete'
}

// ---------------------------------------------------------------------------
// SPACES coach roster
// ---------------------------------------------------------------------------

/**
 * A certified Program 1 coach's SPACES delivery record. `coachId` joins back
 * to `research.ts`'s `coaches` array for identity (name, employer, etc.) —
 * this record holds only what's specific to live delivery oversight.
 */
export interface SpacesCoach {
  id: string
  coachId: string
  invitationStatus: InvitationStatus
  joinedStatus: JoinedStatus
  invitedDate: string
  joinedDate?: string
}

export const spacesCoaches: SpacesCoach[] = [
  // Round 21 — trimmed to two onboarded coaches on direct instruction, so the
  // Coach Management roster demonstrates exactly two states: a coach carrying
  // a real caseload, and a coach onboarded with nobody assigned yet. Robert
  // Tan, Chloe Fitzgerald, Samuel Okafor and Ingrid Sorensen were removed —
  // four rows that all read the same as Fatima's.
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
  // mei-ling-chen intentionally left uninvited — she's the one candidate the
  // "Onboard new coach" picker's certified-but-not-yet-onboarded pool surfaces,
  // and the only row in the "Waiting to be onboarded" tab.
]

// ---------------------------------------------------------------------------
// Consumer dyads
// ---------------------------------------------------------------------------

export interface PersonProfile {
  name: string
  age: number
  /** Carer only — relationship to the person with dementia. */
  relationship?: string
  background: string
  /** Account tab (Round 6.2.1) — realistically only ever set for the carer,
   *  the dyad member who actually operates the Consumer Portal. */
  email?: string
  phone?: string
}

/** Round 6.2.1 — shared shape for the new Account tabs (researcher/coach/consumer). */
export interface NotificationPreferences {
  email: boolean
  sms: boolean
}

export interface HealthLogEntry {
  date: string
  synced: boolean
  remPercent?: number
  /** Deep (slow-wave) sleep, % of total sleep time — Round 4 addition. */
  deepPercent?: number
  /** Light sleep, % of total sleep time — Round 4 addition. */
  lightPercent?: number
  durationMin?: number
  disturbances?: number
  diaryEntry?: string
  /** The 9 directly-answered Consensus Sleep Diary questions for this
   *  person/date (Round — Sleep diary notes rebuild). Independent of Fitbit
   *  `synced` status, same as `diaryEntry` above — a manual diary answer can
   *  still come through on a day the device didn't sync. Questions 10-13 are
   *  never stored; they're always derived from these 9 via `computeSleepDiary`. */
  diary?: SleepDiaryAnswers
}

/** Consensus Sleep Diary questions 1-9 (the directly-answered ones) for one
 *  person on one night/morning. Times are free-form "h:mm am/pm" strings,
 *  parsed by `parseTimeToMinutes` — matches the reference paper diary's own
 *  format rather than a 24h `HH:MM` field. */
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

/** The 4 always-derived Consensus Sleep Diary values (Q10-13) — computed
 *  live from Q1-9, never stored. */
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

/** Derives Consensus Sleep Diary questions 10-13 from a person's 9 direct
 *  answers for one night. Formulas match the standard diary exactly:
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

/** One Consensus Sleep Diary question. Rows 1-9 are directly answered and
 *  carry the `SleepDiaryAnswers` field they read/write plus how a consumer
 *  answers them (`kind`/`unit`); rows 10-13 are `computed` and never stored. */
export interface SleepDiaryQuestion {
  label: string
  /** Derived at render time via `computeSleepDiary` — no field, never asked. */
  computed?: boolean
  /** The `SleepDiaryAnswers` field this question reads/writes (rows 1-9 only). */
  field?: keyof SleepDiaryAnswers
  /** How the consumer answers it: a numeric field or a time-of-day picker. */
  kind?: 'number' | 'time'
  /** Unit label rendered beside a numeric field. */
  unit?: 'min' | 'times'
  /**
   * Consumer-facing explainer under the question (Round 45, direct
   * instruction: "Add a 18px sub copy as explainer text that clearly informs
   * user"). Only on the questions that need one — Q5, Q8 and Q9 were called
   * out as needing none, and a line of help under a question that is already
   * clear is noise.
   *
   * Consumer flow only. The researcher's Consensus Sleep Diary grid reads
   * `label` and ignores this.
   */
  help?: string
}

/** The 13 standard Consensus Sleep Diary questions, in order.
 *
 *  Round 44: moved here from `ConsumerDetailPage.tsx` the moment the Consumer
 *  Portal's own fill-in flow became a second reader — the researcher table,
 *  the coach's summary view and the consumer's questionnaire must all name a
 *  question identically, and two copies of this list is how they would stop
 *  doing so. Questions 1-9 are directly answered (`SleepDiaryAnswers`); 10-13
 *  are always derived via `computeSleepDiary`, never stored. */
export const SLEEP_DIARY_QUESTIONS: SleepDiaryQuestion[] = [
  // Round 45, direct instruction: "do not change questions. they remain as
  // is." The only edits are the paper-form artifacts that cannot mean anything
  // on screen — "(minutes)", where a `min` label already sits beside the input,
  // and the "#5" cross-references, which point at a row number the consumer
  // never sees. Wording is otherwise untouched.
  {
    label: 'How long did you nap yesterday?',
    help: 'Add up all the naps you had during the day. If you did not nap, enter 0.',
    field: 'napMin',
    kind: 'number',
    unit: 'min',
  },
  {
    label: 'How many minutes outside your sleep window were spent in bed doing something other than sleep?',
    help: 'For e.g., reading, watching television, or resting in bed when you were not trying to sleep.',
    field: 'outOfSleepWindowMin',
    kind: 'number',
    unit: 'min',
  },
  {
    label: 'What time did you close your eyes with the intention of falling asleep last night?',
    help: 'The time you settled down to sleep, not the time you got into bed.',
    field: 'bedtime',
    kind: 'time',
  },
  {
    label: 'How long did it take you to fall asleep last night?',
    help: 'Your best guess is fine.',
    field: 'sleepLatencyMin',
    kind: 'number',
    unit: 'min',
  },
  {
    label: 'How many times did you wake up during the night, not including the last time?',
    field: 'wakeCount',
    kind: 'number',
    unit: 'times',
  },
  {
    label: 'How many minutes total were you awake during the night?',
    field: 'awakeDuringNightMin',
    kind: 'number',
    unit: 'min',
  },
  {
    label: 'How many minutes were you out of bed during the night?',
    field: 'outOfBedDuringNightMin',
    kind: 'number',
    unit: 'min',
  },
  { label: 'What time did you wake up this morning (for the last time)?', field: 'wakeTime', kind: 'time' },
  {
    label: 'What time did you get out of bed for the last time this morning?',
    field: 'outOfBedTime',
    kind: 'time',
  },
  { label: 'How many minutes were you awake in bed between #8 and #9?', computed: true },
  { label: 'In total, how long was your Sleep Opportunity, in minutes? (time between #3 and #9)', computed: true },
  { label: 'Overall, how much Total Sleep Time did you get, in minutes? (#11 − #4 − #6 − #10)', computed: true },
  { label: 'Sleep Efficiency = Total Sleep Time (#12) / Sleep Opportunity (#11), as a percentage', computed: true },
]

export type AnnotationShareState = 'shared' | 'not-shared' | 'not-yet'

/** One SIPTEA-component answer within a reflection — structured storage
 *  (rather than one flattened string) is what lets every display surface
 *  render each component as its own labeled, non-editable field instead of
 *  parsing text back apart. */
export interface ReflectionComponentAnswer {
  label: string
  answer: string
}

/** A coach's post-practice reflection for a consumer (Round 6.2.1,
 *  restructured Round 13), independently shared or kept private and stamped
 *  with when it was written.
 *
 *  **Round 40: no longer capped at one per consumer.** Round 13 enforced
 *  exactly one, which was right when a reflection was a one-off about the
 *  coach's first session. A coach now writes one after *every* session, so the
 *  cap is gone from the store and this is a real list. */
export interface AnnotationSummaryEntry {
  id: string
  /** The internal SPACES session number this reflection is about. Optional and
   *  additive: entries written before Round 40 have none, and the table renders
   *  them without a session rather than guessing one. Internal numbering
   *  (1 = Planning) — render it through `sessionRowLabel()`, never as a bare
   *  number. */
  session?: number
  components: ReflectionComponentAnswer[]
  shared: boolean
  date: string
  time: string
}

/** A researcher-uploaded consent form (Round 4 — Consumer Management, Consent repository). Dummy filenames only. */
export interface ConsentDocument {
  id: string
  filename: string
  uploadedDate: string
}

/** One of the 6 consumer-facing content modules (Consumer Portal) — Round 4. */
export interface ConsumerModule {
  id: string
  title: string
  /** Matches the coach-training slide count (6) so completion-rate math stays consistent app-wide. */
  slideCount: number
}

export const CONSUMER_MODULES: ConsumerModule[] = [
  // Index 0 — the always-unlocked pre-module (session planning, Round 14):
  // available from enrolment, no session or plan needed to unlock it. Its
  // own follow-up is Session 1 (Onboarding). See `moduleUnlockState`.
  { id: 'getting-started', title: 'Getting started with Care2Sleep', slideCount: 6 },
  { id: 'understanding-sleep-dementia', title: 'Understanding sleep and dementia', slideCount: 6 },
  { id: 'calming-bedtime-routine', title: 'Building a calming bedtime routine', slideCount: 6 },
  { id: 'managing-nighttime-waking', title: 'Managing nighttime waking', slideCount: 6 },
  { id: 'daytime-habits', title: 'Daytime habits that support sleep', slideCount: 6 },
  { id: 'carer-own-sleep', title: "Looking after your own sleep", slideCount: 6 },
  { id: 'using-sleep-data', title: 'Using your sleep diary and Fitbit data', slideCount: 6 },
]

/** A module's position in the unlock sequence (0 = pre-module, 1-6 = the
 *  named modules, in `CONSUMER_MODULES` order). -1 if not found. */
export function moduleIndex(moduleId: string): number {
  return CONSUMER_MODULES.findIndex((m) => m.id === moduleId)
}

export type ModuleUnlockState = 'locked' | 'unlocked'

/** Module 0 (the pre-module) is always unlocked. Module N (1-6) unlocks once
 *  the coach marks SPACES session N complete — that session reviews the
 *  module the consumer just finished and plans the next one.
 *
 *  `manualUnlocks` (Round 14.1) — a coach can grant early access to a module
 *  ahead of marking its unlocking session complete (e.g. the session already
 *  happened but hasn't been logged yet). Defaults to none so every existing
 *  call site is unaffected until it opts in. */
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

/** A dyad's engagement with one consumer-facing module — Round 4. */
export interface ConsumerModuleRecord {
  moduleId: string
  status: ConsumerModuleRecordStatus
  /** ISO date last viewed, present once the module has been opened. */
  lastActivityDate?: string
  /** Slides viewed, out of the module's `slideCount` — drives the completion rate. */
  slidesCompleted?: number
}

/** A recorded SPACES session (Zoom / videoconference) shared by the assigned coach — Round 4, Coach Matching tab. */
export interface SpacesSessionRecording {
  id: string
  /** SPACES session number (1–7), matches `SPACES_SESSIONS`. */
  session: number
  title: string
  date: string
  /** "HH:MM" — optional since older seed rows predate this field. */
  time?: string
  durationMin: number
}

/**
 * Both dyad members' first names, carer first — "Joan & Bruce".
 *
 * Extracted at its second caller: the Consumer Portal's Home greeting built
 * this inline, and the first-run onboarding tour's own greeting (frame
 * `991:9446`, authored as the placeholder "Hello <> & <>") needs the identical
 * string. Two surfaces greeting the same two people from two copies of the same
 * expression is precisely the drift this project keeps having to unpick, and
 * the ordering — carer first — is a real decision worth holding in one place.
 *
 * A carer-only dyad has no PLE, so this greets one person rather than printing
 * a dangling ampersand. Neither frame has a carer-only state to copy.
 */
export function dyadFirstNames(dyad: ConsumerDyad) {
  return [dyad.carer, dyad.patient]
    .filter(Boolean)
    .map((p) => p!.name.split(' ')[0])
    .join(' & ')
}

export interface ConsumerDyad {
  id: string
  /** Absent until the research coordinator assigns a coach (Round 4 — Consumer Management enrolls consumers before assignment). */
  coachId?: string
  /** Round 25 — the date the coach above was assigned. Added because the
   *  Learning Progress timeline's "Coach assigned" timepoint needs a real
   *  date, and there was none: every surface that wanted one (this timeline,
   *  the Overview hero's coach pill, the Key updates row) had to render an em
   *  dash. Only meaningful alongside `coachId`; absent for an unassigned
   *  consumer. */
  coachAssignedDate?: string
  /** Absent for a carer-only consumer — a carer participating without a co-enrolled person with dementia. */
  patient?: PersonProfile
  carer: PersonProfile
  sleepGoals: string
  caregivingContext: string
  notes?: string
  /** The coach's own free-text notes on this consumer (Assigned Consumers tab,
   *  Round 11) — kept separate from `notes` ("Additional notes", set at
   *  research-coordinator intake and shown by `ConsumerOverview` elsewhere)
   *  so a coach editing this never silently overwrites that field. */
  coachNotes?: string
  sessionsCompleted: SessionCompletionRecord[]
  /** Most-recent-first — new entries are prepended on submit (Round 6.2.1). */
  annotationSummaries: AnnotationSummaryEntry[]
  patientLog: HealthLogEntry[]
  carerLog: HealthLogEntry[]
  /** Round 4 additions — Consumer Management (Research Dashboard). */
  consentDocuments: ConsentDocument[]
  moduleEngagement: ConsumerModuleRecord[]
  sessionRecordings: SpacesSessionRecording[]
  /** Round 5 addition — Consumer Portal Home page "Upcoming sessions" card.
   *  Superseded by `sessionPlan` once one exists for this dyad (see
   *  `nextPlannedSession`); kept as a fallback for any dyad with nothing
   *  planned yet. */
  upcomingSession?: UpcomingSession
  /** Session planning (Round 14) — seed-only initial value; the live copy
   *  coaches read/write lives in `sessionPlans` (`research-store.tsx`), keyed
   *  by dyad id, mirroring `sessionCompletion`'s relationship to
   *  `sessionsCompleted`. */
  sessionPlan?: SessionPlan
  /** Account tab (Round 6.2.1) — the carer's (the account holder's) notification
   *  preferences. Additive/optional; defaults applied at render if absent. */
  notificationPreferences?: NotificationPreferences
  /** Set once the dyad opts out of the study from the Account tab. Reason is
   *  drawn from a fixed dropdown; the study team is expected to follow up
   *  directly rather than any further action happening in-app. */
  optedOut?: { reason: string; date: string }
  /**
   * The date the consumer last submitted the sleep diary **through the portal**
   * (Round 45). Drives Home's completed-diary card.
   *
   * ⚠️ This cannot be inferred from the health log, which is the obvious place
   * to look. `healthLog()` seeds a `diary` on every date it generates and its
   * last date IS `TODAY`, so "today's log has a diary" is true for every dyad
   * on a fresh load and the unfilled card would never be reachable. This
   * records the submission event, which is the thing the card is actually
   * about, and leaves the seeded history the researcher and coach grids read
   * completely untouched.
   */
  diarySubmittedOn?: string
  /**
   * Round 27, direct instruction: keep this dyad off the Consumer Management
   * roster while leaving it everywhere else, including the coach record page.
   *
   * Round 17 curated that roster to exactly four consumers, one per state it
   * needs to demonstrate. The zero-session dyad added for the coach page's
   * "Ongoing" caseload tab is a fifth that duplicates a state already covered
   * there (Dorothy Kellerman is the assigned-but-not-started case), so on that
   * roster it only inflates the KPI row and adds a row that teaches nothing.
   *
   * Deliberately a roster-visibility flag, not an "archived" or "hidden"
   * state: the dyad is fully real in the caseload, the session plan and every
   * count. Exactly one list filters on it.
   */
  omitFromConsumerRoster?: boolean
}

/** One 5-night base pattern of Consensus Sleep Diary Q1-9 answers per day
 *  index (0-4), reused as the starting point for every seeded health log —
 *  reasonable, varied values a real short stretch of nights might show. Wake
 *  count (Q5) is threaded in separately per call (`diaryAnswersFor`) since it
 *  should track that log's own `disturbances` pattern rather than being
 *  fixed here. */
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

/** Builds one day's full `SleepDiaryAnswers` from `DIARY_DAY_BASE`, with the
 *  wake count (Q5) supplied by the caller so it tracks that log's own
 *  `disturbances`-driven pattern. */
function diaryAnswersFor(dayIndex: number, wakeCount: number): SleepDiaryAnswers {
  return { ...DIARY_DAY_BASE[dayIndex % DIARY_DAY_BASE.length], wakeCount: Math.max(0, wakeCount) }
}

/** Builds a health log ending on `format.ts`'s `TODAY`, one day per entry in
 *  `diaryEntries` (5 days by default; a longer `diaryEntries` array — e.g.
 *  dyad-011's, extended for the sleep-diary card's horizontal-scroll demo —
 *  simply reaches further back).
 *
 *  ⚠️ `endDate` READS `TODAY`; it used to be the string `'2026-07-22'` copied
 *  out by hand while this very comment claimed it read the constant. The moment
 *  `TODAY` moved forward to `2026-08-26`, every dyad's health log silently
 *  ended 35 days before the app's own clock — a "latest reading" more than a
 *  month stale, with nothing in the type system or the invariant script to
 *  catch it (`seed-invariants.mjs` only asserts entries are not in the FUTURE).
 *
 *  It went unnoticed because **no surface in the Consumer Portal reads the
 *  health log at all** — Fitbit data has zero render sites here. That makes
 *  this a trap rather than a visible bug: the first engineer to build the
 *  Fitbit view would have inherited month-old data and no clue why. Derive
 *  demo dates, never transcribe them. */
function healthLog(
  startRem: number,
  startDuration: number,
  startDisturbances: number,
  diaryEntries: string[],
  allSynced = true,
): HealthLogEntry[] {
  const endDate = TODAY
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

/** Overrides the most recent `days` entries of a health log to an unresolved
 *  Fitbit sync gap — Round 5 (Consumer Portal demo State B), matching the
 *  `dyad-030` sync-gap precedent from Round 4. Fitbit fields are dropped (no
 *  device reading), but the manual sleep-diary answers (`diary`) — same as
 *  the free-text `diaryEntry` — still come through independent of sync. */
function withSyncGap(log: HealthLogEntry[], days: number, diaryNotes: string[]): HealthLogEntry[] {
  const cutoff = log.length - days
  return log.map((entry, i) =>
    i >= cutoff
      ? { date: entry.date, synced: false, diaryEntry: diaryNotes[i - cutoff], diary: entry.diary }
      : entry,
  )
}

/** Marks one date's Consensus Sleep Diary answers (Q1-9) as never filled in
 *  for a health log — a realistic "forgot to log the diary that night" gap,
 *  distinct from a Fitbit sync gap (`withSyncGap`). `sleepDiaryCellValue`
 *  already renders '—' for every one of the 13 diary questions (including
 *  the 4 auto-calculated ones, which can't be computed without the raw
 *  answers) whenever `diary` is `undefined`, so no display-side
 *  special-casing is needed here or in `SleepDiaryFeed`/its CSV export.
 *  Fitbit fields and the free-text `diaryEntry` for that date are left
 *  untouched — a synced device reading and a coach's/carer's free-text note
 *  are both independent of whether the structured diary questions got
 *  answered. */
function withMissingDiaryOn(log: HealthLogEntry[], date: string): HealthLogEntry[] {
  return log.map((entry) => (entry.date === date ? { ...entry, diary: undefined } : entry))
}

/** Seeds all 6 consumer modules not-started, then overrides with explicit progress — mirrors `research.ts`'s `fillRecords`. */
function consumerModuleEngagement(explicit: ConsumerModuleRecord[]): ConsumerModuleRecord[] {
  const covered = new Set(explicit.map((r) => r.moduleId))
  return [
    ...explicit,
    ...CONSUMER_MODULES.filter((m) => !covered.has(m.id)).map(
      (m): ConsumerModuleRecord => ({ moduleId: m.id, status: 'not-started' }),
    ),
  ]
}

export const consumerDyads: ConsumerDyad[] = [
  // ---------------------------------------------------------------------------
  // Round 27 — a dummy consumer on Helen Zhang's caseload with **zero sessions
  // completed**, added on direct instruction so the coach Overview's new
  // "Ongoing" caseload tab demonstrates a just-assigned case alongside a
  // mid-arc one. Deliberately minimal: no session plan, no reflection, no
  // module engagement, no logs. Every one of those absences is the correct
  // state for a consumer whose first session hasn't happened, not a gap left
  // unfilled — a plan the coach hasn't built yet, and a post-practice
  // reflection that isn't due until after Session 1.
  //
  // Sorts first in the caseload table for free: that table orders by completed
  // session count ascending, and this is the only dyad at 0.
  // ---------------------------------------------------------------------------
  {
    id: 'dyad-014',
    coachId: 'helen-zhang',
    omitFromConsumerRoster: true,
    // Before `TODAY` on purpose: a date in the future clamps "Days in study"
    // to 0, which reads as a bug rather than as a new consumer. (The literal
    // date is left as-is rather than re-derived — it only has to be in the
    // past, and `seed-invariants.mjs` is what enforces that.)
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
    // No `sessionPlan` and no `upcomingSession`: the coach hasn't planned this
    // consumer's arc yet, so the table's Session Plan reads "Not yet" and both
    // Upcoming Session and Session Date read an em dash. That is the honest
    // state, and it is the second distinct row shape this tab now shows.
  },
  {
    id: 'dyad-011',
    coachId: 'helen-zhang',
    // Two days after consent (20 Jun), before the 24 Jun planning session —
    // consistent with the order the arc actually runs in.
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
    // Round 40: no longer the "nothing written yet" case — this dyad now
    // carries a reflection per completed catch-up (see `annotationSummaries`
    // below), which is what the My reflections tab is built to list. The
    // empty-reflection state is still demonstrated by dyad-012 and dyad-014.
    // Learning just started and there's a live 48h+
    // Fitbit sync gap so the Sync Problem Alert still shows by default
    // (Round 5 precedent), independent of session/reflection state.
    // Round 21 — this dyad is the roster's "underway" case: planning session
    // plus the first numbered catch-up (internal 2 = "Session 1") done, so the
    // row reads 1 of 6 completed with Session 2 scheduled next, and Module 2
    // in progress between them.
    sessionsCompleted: [
      { session: 1, completedDate: '2026-06-24', completedTime: '10:00' },
      { session: 2, completedDate: '2026-07-22', completedTime: '10:00' },
      { session: 3, completedDate: '2026-08-05', completedTime: '10:00' },
      { session: 4, completedDate: '2026-08-19', completedTime: '10:00' },
    ],
    /* Round 40 — one reflection per completed catch-up (internal 2/3/4 =
       Session 1/2/3), so the My reflections tab demonstrates the thing it is
       for: a list that grows session by session. Newest first, matching the
       order `submitPostPracticeAnnotation` prepends in.

       Share state is deliberately mixed — two shared, one not — because the
       review dialog's whole job is changing that, and a table where every row
       says the same thing cannot show it working.

       Labels carry the `S:`/`I:` prefix because that is what
       `buildReflectionComponents` writes. dyad-013's older seed uses bare
       labels; these match what a coach actually saving a reflection produces,
       which is the version worth demonstrating. */
    annotationSummaries: [
      {
        id: 'ann-011-3',
        session: 4,
        shared: true,
        date: '2026-08-19',
        time: '11:05',
        components: [
          {
            label: 'S: Shared understanding',
            answer:
              'Joan and I are now describing the same problem in the same words, which was not true at Session 1. Bruce contributed more this time — he said the hallway light "means morning", which none of us had picked up.',
          },
          {
            label: 'I: Implementation intent',
            answer:
              'We agreed to swap the hallway bulb for a warm low one and that Joan would do it on the Saturday. Concrete enough that I did not need to follow up.',
          },
          {
            label: 'P: Problem identification',
            answer:
              'The day-centre bus naps are still unresolved and I let that sit again rather than raising it. Third session running.',
          },
          {
            label: 'T: Tailoring',
            answer:
              'Dropped the standard advice about blackout curtains — Joan needs to see Bruce at night. The bulb change does the same job without taking that away.',
          },
          {
            label: 'E: Emotion navigation',
            answer:
              'Joan cried briefly when she said she had stopped expecting a full night. I stayed with it rather than moving to the plan, and she came back to the conversation herself.',
          },
          {
            label: 'A: Action and goals',
            answer:
              'One change only — the bulb — before Session 4. That is the right size; the last time we set two, neither happened.',
          },
        ],
      },
      {
        id: 'ann-011-2',
        session: 3,
        shared: false,
        date: '2026-08-05',
        time: '10:52',
        components: [
          {
            label: 'S: Shared understanding',
            answer:
              'I went in assuming the 3am waking was the priority and Joan wanted to talk about her own sleep. I redirected too quickly and only noticed afterwards.',
          },
          {
            label: 'I: Implementation intent',
            answer:
              'Vague. We said "earlier wind-down" without ever naming a time, which is why nothing changed between sessions.',
          },
          {
            label: 'P: Problem identification',
            answer:
              'Joan works two late shifts a fortnight. Any plan that needs her awake and consistent at 9pm is fragile and I did not say so.',
          },
          {
            label: 'T: Tailoring',
            answer: 'Very little tailoring this session — mostly general advice. Worth redoing.',
          },
          {
            label: 'E: Emotion navigation',
            answer:
              'Missed the moment entirely. She named exhaustion and I answered with a strategy.',
          },
          {
            label: 'A: Action and goals',
            answer:
              'No clear action agreed. I will open Session 3 by naming that and starting again from what matters to her.',
          },
        ],
      },
      {
        id: 'ann-011-1',
        session: 2,
        shared: true,
        date: '2026-07-22',
        time: '10:48',
        components: [
          {
            label: 'S: Shared understanding',
            answer:
              'Good first working session. Joan described the overnight pattern in detail and we agreed the daytime napping is the likely driver.',
          },
          {
            label: 'I: Implementation intent',
            answer:
              'Agreed a 3pm nap cut-off. We did not talk about what to do instead of the nap, which is the part that turned out to matter.',
          },
          {
            label: 'P: Problem identification',
            answer:
              'I flagged that the cut-off would be hard on day-centre days. Joan thought it would be fine; it was not.',
          },
          {
            label: 'T: Tailoring',
            answer:
              'Kept the plan to one change rather than the full sleep-hygiene list, because Joan is already carrying a lot.',
          },
          {
            label: 'E: Emotion navigation',
            answer:
              'Joan was apologetic about "not having tried harder". I named how much she is already doing before we went any further.',
          },
          {
            label: 'A: Action and goals',
            answer: 'Trial the 3pm cut-off and note what happens in the diary. Right-sized.',
          },
        ],
      },
    ],
    // Extended to 18 nights (2026-07-05 through 2026-07-22, TODAY) so the
    // Sleep diary notes card's PLE/Carer date grid genuinely needs
    // horizontal scroll to demonstrate the sticky "Question" column.
    // Day 9 (2026-07-13) — Joan didn't get a chance to fill in Bruce's
    // sleep-diary questions that night, a realistic "PLE's diary answers
    // missing" gap (`withMissingDiaryOn`), picked mid-range rather than at
    // either edge so it reads as a genuine gap, not an artifact of the
    // 18-date window itself. His Fitbit reading and free-text note that day
    // are unaffected — the device still synced independent of the diary.
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
    // Session planning (Round 14): modules unlock as their matching session
    // is marked complete, not independently ahead of schedule — Bruce & Joan
    // have only Session 1 done, so only the pre-module and Module 1 are
    // actually unlocked/completed; Modules 2-6 stay locked (not-started,
    // via consumerModuleEngagement's fallback) until Sessions 2-6 land.
    // Round 21 — this dyad is the roster's "attended everything, skipped a
    // module" case: 3 of 7 modules finished, Module 3 missed entirely even
    // though its catch-up session went ahead, and Module 5 currently in
    // progress ahead of its own session. It also honours the real rule that a
    // module is only ever "in progress" *before* its catch-up: once that
    // session has been held the module is complete or incomplete, never still
    // in progress.
    moduleEngagement: consumerModuleEngagement([
      { moduleId: 'getting-started', status: 'completed', lastActivityDate: '2026-06-20', slidesCompleted: 6 },
      // Round 27: a second missed module, so "Left incomplete" demonstrates
      // more than one value. Its own catch-up (Session 2) has already been
      // held, which is what makes "left incomplete" true — Module 4 was asked
      // for instead, but its session has not happened yet, so calling it
      // incomplete would contradict the sessions table one section below.
      { moduleId: 'understanding-sleep-dementia', status: 'not-started' },
      // Round 43, direct instruction: "show lesson 2 as in process". 2 of 6
      // slides is what makes the consumer's own card read "10 mins left" — the
      // figure frame `792:2337` draws — because 15 x (1 - 2/6) = 10 exactly,
      // rather than the figure being typed in beside a bar that disagrees.
      //
      // ⚠️ Its catch-up (Session 3) has already been held, and the seed's own
      // rule elsewhere is that a module is only "in progress" *before* its
      // catch-up. This dyad now breaks that rule deliberately, on instruction,
      // so the in-progress state is reachable on a previous lesson.
      { moduleId: 'calming-bedtime-routine', status: 'in-progress', lastActivityDate: '2026-08-12', slidesCompleted: 2 },
      { moduleId: 'managing-nighttime-waking', status: 'completed', lastActivityDate: '2026-08-16', slidesCompleted: 6 },
      { moduleId: 'daytime-habits', status: 'in-progress', lastActivityDate: '2026-08-19', slidesCompleted: 3 },
    ]),
    sessionRecordings: [
      { id: 'rec-011-1', session: 1, title: 'Onboarding: Whitfield dyad', date: '2026-06-24', time: '10:00', durationMin: 45 },
    ],
    upcomingSession: {
      session: 2,
      // Matches TODAY (format.ts) — State B's seed data puts this
      // session today so the "session today" banner is visible on first
      // load, same precedent as the Fitbit sync-gap alert (Round 5).
      date: '2026-07-22',
      time: '10:00',
      meetingId: '812 4456 7723',
      zoomLink: 'https://zoom.us/j/8124456723',
    },
    // Session planning (Round 14) — a full plan already exists; Session 1's
    // date matches its actual completion, the rest follow a ~2-week cadence.
    // Design critique fix: a plan created live via "Plan sessions" gets a
    // real meetingId/zoomLink per row from `bulkSetSessionPlan`'s own
    // generation step — but this plan is seeded directly (never passed
    // through that action), so without these fields the Consumer Portal's
    // 7-session roadmap silently showed no "Join Zoom" link for every
    // session except the one that happened to match the legacy single
    // `upcomingSession` field. Backfilled here to match what live planning
    // would have produced.
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
          // The one moved row in this dyad's plan, so the consumer plan strip's
          // "Rescheduled" state (frame `930:5239`) is reachable from a fresh
          // load rather than only after someone edits a date by hand. Moved two
          // days later, off the fixed weekly Wednesday cadence every other row
          // sits on — which is what makes it read as a real reschedule.
          session: 6,
          date: '2026-09-18',
          previousDate: '2026-09-16',
          rescheduled: true,
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
  {
    id: 'dyad-012',
    // Assigned two days after consent (10 Jul). Seeded so the timeline's
    // "Coach assigned" card doesn't read "Not recorded" for a dyad that
    // visibly has a coach.
    coachAssignedDate: '2026-07-12',
    // Round 21: assigned to Mei-Ling Chen, who is certified but sits in Coach
    // Management's "Waiting to be onboarded" tab rather than its active
    // roster. That keeps both rosters reading exactly as specified — one
    // unassigned consumer here, one coach with 2 and one with 0 there — at the
    // cost of a coach holding a consumer before being onboarded. Accepted
    // explicitly as prototype seed data, not a modelled state.
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
    // Use case: no sessions delivered yet and deliberately unplanned (see
    // `sessionPlan` comment below) — Helen's caseload demonstrates the
    // "0 of 7" starting state, with nothing scheduled at all.
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
    // Session planning (Round 14): the planning session hasn't happened yet,
    // so Module 1 is still locked — Dorothy's real engagement so far is with
    // the always-unlocked pre-module only.
    // Round 21: cleared to nothing started. This dyad is the demo case for
    // "coach assigned, session plan not built yet", and module content only
    // opens once that plan exists — the planning session is what schedules the
    // modules — so mid-module progress here was an impossible state.
    moduleEngagement: consumerModuleEngagement([]),
    sessionRecordings: [],
    // No `upcomingSession` (Session 0 leak fix): this field used to carry a
    // stale `{ session: 1, ... }` value left over from before Round 14.1's
    // numbering correction (back when "session 1" meant the very first
    // meeting, in *display* terms — post-correction, internal 1 is the
    // planning session and displays as "Session 0"). Every "Upcoming
    // Session" table that fell back to this field for an unplanned dyad
    // (`ConsumerManagementPage.tsx`'s roster, `SpacesCoachProfilePage.tsx`'s
    // consumer caseload table, `DeliveryHomePage.tsx`'s consumer table) was
    // rendering a literal "Session 0" for Dorothy as a result — found live,
    // fixed at the root by both removing this stale value and adding a
    // `session >= 2` guard to `nextUpcomingSessionNumber()` so no future
    // seed mistake like this one can leak the same way again. Dorothy is
    // genuinely meant to have nothing scheduled yet — she's the demo case
    // for the "Plan sessions" first-time cadence assist, the moment a coach
    // uses the Session Plan card before any plan exists — so having no
    // `upcomingSession` at all is the correct state, not a gap to fill.
  },
  {
    id: 'dyad-013',
    coachId: 'helen-zhang',
    coachAssignedDate: '2026-04-03',
    // Use case: all 7 SPACES sessions complete — Helen's caseload
    // demonstrates the finished state, no `upcomingSession` remaining.
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
    // A coach can only ever have one reflection per consumer — it's scoped
    // to their first session with that consumer, written in Helen's own
    // first-person voice as structured per-component answers.
    annotationSummaries: [
      {
        id: 'ann-013-1',
        components: [
          {
            label: 'Shared understanding',
            answer:
              'Margaret and I agreed straight away that the 3am confused waking was the priority, and that felt like a genuinely shared read of the problem. She’d already tried a few things herself before we spoke. The one gap: I wanted to start with the bedtime routine first, and Margaret initially just wanted to jump straight to the 3am waking itself.',
          },
          /* Round 27: the four placeholder components are named for real, and
             their answers written as a coach would actually reflect on them
             rather than "Too early to say" x3 — which read as unfinished seed
             data on a card whose whole purpose is showing a real reflection.
             Labels match `AddAnnotationSummaryModal`'s `STEPS` exactly; the
             wizard writes these strings, so a mismatch would show up as two
             different names for one component across the two surfaces. */
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
    // Session planning (Round 14): every date below already lands after its
    // unlocking session's completion date, so no consistency fix was needed
    // here beyond adding the pre-module.
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
    // No `upcomingSession` — the program is complete.
    // Session planning (Round 14) — a full plan mirroring the real
    // sessionsCompleted dates; all 7 sessions and every module are done.
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

  // ---------------------------------------------------------------------------
  // Round 4 addition — Consumer Management: a consumer enrolled by the research
  // coordinator ahead of SPACES coach assignment (`coachId` absent), so the
  // roster demonstrates the not-assigned state.
  //
  // Round 17 trimmed this dataset to exactly four consumers, one per state the
  // Consumer Management roster needs to demonstrate: not assigned (this one),
  // zero sessions (dyad-012), one session (dyad-011), all seven (dyad-013).
  // Removed with it: dyad-015/016/017 (mid-progress caseloads for Robert Tan,
  // Chloe Fitzgerald and Samuel Okafor — those three coaches now correctly show
  // an empty caseload, same as Fatima Haidari and Ingrid Sørensen already did)
  // and dyad-031/032 (two more unassigned consumers, redundant once one
  // demonstrates the state). No other file referenced any of the five.
  // ---------------------------------------------------------------------------
  {
    id: 'dyad-030',
    // Unassigned — enrolled but no coach invited into their care yet.
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
      { id: 'consent-030-a', filename: 'ableson-dyad-consent-signed.pdf', uploadedDate: '2026-08-19' },
    ],
    // Session planning (Round 14): unassigned, no sessions yet, so Module 1
    // can't be unlocked — only the always-unlocked pre-module has progress.
    // Round 21: cleared to nothing started. This consumer has no coach yet,
    // and module content only opens once a coach is assigned — a consumer
    // part-way through a module while still waiting for a coach is a state the
    // platform cannot produce. Fixed here in the seed rather than hidden at
    // render, per this project's own standing rule about impossible data.
    moduleEngagement: consumerModuleEngagement([]),
    sessionRecordings: [],
    // Fitbit set up at technical intake, ahead of coach assignment — the
    // device has stopped syncing for the last 2 days (unresolved as of
    // TODAY, 2026-08-26) to demonstrate the Data Health Alerts banner on an
    // unassigned consumer.
    patientLog: [
      { date: '2026-08-22', synced: true, remPercent: 19, deepPercent: 16, lightPercent: 65, durationMin: 310, disturbances: 5, diaryEntry: 'Called out for his wife around midnight, took a while to settle.', diary: diaryAnswersFor(0, 5) },
      { date: '2026-08-23', synced: true, remPercent: 21, deepPercent: 15, lightPercent: 64, durationMin: 295, disturbances: 6, diaryEntry: 'Similar pattern, briefly agitated.', diary: diaryAnswersFor(1, 6) },
      { date: '2026-08-24', synced: true, remPercent: 20, deepPercent: 16, lightPercent: 64, durationMin: 300, disturbances: 5, diaryEntry: 'Similar night, no major change.', diary: diaryAnswersFor(2, 5) },
      { date: '2026-08-25', synced: false, diaryEntry: 'Device wasn’t on the charger; no reading.', diary: diaryAnswersFor(3, 5) },
      { date: '2026-08-26', synced: false, diaryEntry: 'Still not syncing; Diane will check the app tonight.', diary: diaryAnswersFor(4, 4) },
    ],
    carerLog: [
      { date: '2026-08-22', synced: true, remPercent: 20, deepPercent: 14, lightPercent: 66, durationMin: 330, disturbances: 2, diaryEntry: 'Up with Dad twice.', diary: diaryAnswersFor(0, 2) },
      { date: '2026-08-23', synced: true, remPercent: 22, deepPercent: 13, lightPercent: 65, durationMin: 320, disturbances: 2, diaryEntry: 'Exhausted but slept in patches.', diary: diaryAnswersFor(1, 2) },
      { date: '2026-08-24', synced: true, remPercent: 21, deepPercent: 14, lightPercent: 65, durationMin: 340, disturbances: 1, diaryEntry: 'Slightly better night.', diary: diaryAnswersFor(2, 1) },
      { date: '2026-08-25', synced: true, remPercent: 19, deepPercent: 15, lightPercent: 66, durationMin: 310, disturbances: 3, diaryEntry: 'Broken sleep again.', diary: diaryAnswersFor(3, 3) },
      { date: '2026-08-26', synced: true, remPercent: 20, deepPercent: 15, lightPercent: 65, durationMin: 335, disturbances: 1, diaryEntry: 'Reasonable night.', diary: diaryAnswersFor(4, 1) },
    ],
  },
]

// ---------------------------------------------------------------------------
// Supervision notes
// ---------------------------------------------------------------------------

export interface SupervisionNote {
  id: string
  coachId: string
  /** Absent for coach-level notes (the existing Supervision Hub tab); present
   *  once scoped to one consumer (Round 6.2 — Coach Delivery Portal Session
   *  Logs tab). Optional and additive — existing seed notes are left unset. */
  dyadId?: string
  /** Round 36 — the internal SPACES session number this note is *about*, so a
   *  coach's case notes read against the session they belong to rather than
   *  being a flat, undated pile. Optional and additive for the same reason
   *  `dyadId` is: the researcher's own coach-level supervision notes are not
   *  about any one session, and the existing seed notes are left unset.
   *  Internal numbering (1 = Planning), so render it through
   *  `sessionRowLabel()` — never as a bare number. */
  session?: number
  /** Round 40 — this note was drafted by the AI from a session rather than
   *  typed by the coach, so every surface that shows it can say so.
   *
   *  Deliberately its **own** field rather than derived from `session`. Those
   *  are two different facts: "which session is this about" and "who wrote
   *  it". Deriving one from the other is exactly the two-fields-one-label trap
   *  this project keeps hitting (Round 9, Round 20's Active-trainees KPI), and
   *  it would break the first time a coach writes up a session by hand — which
   *  the Coaching workspace path is expected to allow.
   *
   *  Optional and additive for the same reason `dyadId` and `session` are:
   *  everything written before this existed was typed by a coach, so absent
   *  means coach-authored and no seed note needs backfilling. */
  autoGenerated?: boolean
  title: string
  date: string
  time: string
  notes: string
  attachments: string[]
}

export const supervisionNotes: SupervisionNote[] = [
  {
    id: 'sup-001',
    coachId: 'helen-zhang',
    title: 'First supervision: Kellerman dyad',
    date: '2026-07-21',
    time: '14:00',
    // Round 21: reworded off the Whitfields, who moved to Fatima Haidari's
    // caseload — a supervision note under Helen discussing a dyad she is not
    // assigned to would read as a data error.
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
  // Round 6.2.1 — mock coach-authored Session notes, scoped to dyad-011 via
  // `dyadId`, so the Coach Delivery Portal's Session Logs tab (Session Logs
  // records table) has real rows to demonstrate instead of the empty state.
  {
    id: 'sup-007',
    coachId: 'helen-zhang',
    dyadId: 'dyad-011',
    title: 'Session 1: Onboarding',
    /* Round 39: was unset, which now reads as an "Ad-hoc" chip on a note whose
       own title says "Session 1" — two fields about the same note contradicting
       each other on screen. Internal 2 is displayed Session 1 (see
       `sessionRowLabel`). */
    session: 2,
    /* Round 40: session case notes are drafted by the AI from the session
       itself — this is the seeded example of one. */
    autoGenerated: true,
    date: '2026-06-24',
    time: '10:00',
    notes:
      'Good first session with Bruce and Joan. Stayed with Joan’s exhaustion before moving to anything practical; that felt like the moment trust built for the rest of the conversation. Confirmed the daytime-napping pattern as a likely driver of the overnight waking; agreed with the family to trial a firmer 3pm nap cut-off before Session 2.',
    attachments: [],
  },
  /* Round 40 — a coach-typed ad-hoc note on the same dyad, so the Case notes
     tab's provenance filter has a real row on *both* sides of it rather than
     one populated tab and one permanently empty one. This is also the case the
     ad-hoc write box exists for: something that happened between sessions. */
  {
    id: 'sup-008',
    coachId: 'helen-zhang',
    dyadId: 'dyad-011',
    title: 'Phone call: Joan, nap cut-off not holding',
    date: '2026-07-01',
    time: '16:20',
    notes:
      'Joan rang between sessions. The 3pm nap cut-off is holding on most days but not on the two days Bruce goes to the day centre, where he sleeps on the bus home. Suggested she stop trying to prevent that one and note it in the diary instead, so we can look at it together at Session 2 rather than treat it as a failure. She sounded relieved. No new concerns.',
    attachments: [],
  },
]

// ---------------------------------------------------------------------------
// Research notes
// ---------------------------------------------------------------------------

/** The researcher's own notes on a consumer dyad — deliberately NOT a
 *  `SupervisionNote`: those are always authored by, and scoped to, a coach
 *  (`coachId` is required on that type), but a researcher needs to write a
 *  note about a dyad regardless of whether one has been assigned yet. Kept
 *  as its own type + store slice rather than making `SupervisionNote.coachId`
 *  optional, which would have meant auditing every existing reader of that
 *  array (Supervision Hub, the trainee record page's Supervision Notes tab,
 *  the Coach Delivery Portal's Session Logs) for a case they don't actually
 *  need to handle. */
export interface ResearchNote {
  id: string
  dyadId: string
  title: string
  date: string
  time: string
  notes: string
  attachments: string[]
}

export const researchNotes: ResearchNote[] = []

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function dyadsForCoach(coachId: string): ConsumerDyad[] {
  return consumerDyads.filter((d) => d.coachId === coachId)
}

/** A dyad's overall annotation status for roster/nav badges (Round 6.2.1) —
 *  derived from the most recent entry now that a dyad can carry several,
 *  rather than a single stored field. `'not-yet'` means no entry exists. */
export function latestAnnotationState(dyad: ConsumerDyad): AnnotationShareState {
  const latest = dyad.annotationSummaries[0]
  if (!latest) return 'not-yet'
  return latest.shared ? 'shared' : 'not-shared'
}
