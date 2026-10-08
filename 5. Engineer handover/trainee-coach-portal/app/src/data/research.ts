import { PATHWAY_MODULES_V2 } from './trainingPathwayV2'

/**
 * Round 2 dummy data — Research Dashboard (coach management side).
 * Domain-realistic placeholder content only; no real people or organisations.
 * Terminology per CLAUDE.md (Coach / Consumer / Annotation summary / Certification).
 *
 * State transitions (adding a coach trainee, certificate generation) are
 * handled in React state by the pages that consume this data — these
 * exports are the initial in-memory dataset only.
 */

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export type CoachStatus = 'enrolled' | 'active' | 'withdrawn' | 'completed'

/**
 * Whether a coach trainee has accepted their platform invite yet — a
 * separate axis from `CoachStatus` (the study-lifecycle status). A trainee
 * is created `pending` by the "Add coach trainee" wizard; almost everything
 * on their profile is inert until they accept and become `active` — see
 * `CoachProfilePage`'s pending-invite banner and its Learning Progress/Stage
 * Management empty states.
 */
export type InviteStatus = 'pending' | 'active'

export const inviteStatusLabels: Record<InviteStatus, string> = {
  pending: 'Invite pending',
  active: 'Active',
}

export type CertificationOutcome =
  | 'not-yet-assessed'
  | 'pass'
  | 'remediation-required'

/** COACH study lifecycle phase the coach is currently in (1–8). */
export interface StudyPhase {
  number: number
  name: string
  /** COACH certification-stage code (C/O/A/CP/H) for the 5 phases that map
   *  to one; undefined for the 3 phases outside the COACH stage sequence
   *  (Recruitment, Enrolment, Entry into SPACES delivery). */
  stageCode?: string
  /** Short display word used once a phase has a `stageCode` — replaces the
   *  long "Phase N — Official Name" format with "Stage X — Word" (Round 9.1:
   *  researchers found the old phase names too long for the roster table). */
  shortLabel: string
}

export const STUDY_PHASES: StudyPhase[] = [
  { number: 1, name: 'Recruitment', shortLabel: 'Recruitment' },
  { number: 2, name: 'Enrolment and platform access', shortLabel: 'Enrolment and platform access' },
  { number: 3, name: 'Content learning', stageCode: 'C', shortLabel: 'Learning' },
  { number: 4, name: 'Guided group practice', stageCode: 'O', shortLabel: 'Group Practice' },
  { number: 5, name: 'Placement 1', stageCode: 'A', shortLabel: 'Placement 1' },
  { number: 6, name: 'Community of practice', stageCode: 'CP', shortLabel: 'Community Practice' },
  { number: 7, name: 'Placement 2 and certification', stageCode: 'H', shortLabel: 'Waiting final assessment' },
  { number: 8, name: 'Entry into SPACES delivery', shortLabel: 'Entry into SPACES delivery' },
]

/** Short bold identifier: "Stage X" for the 5 COACH-mapped phases, else "Phase N". */
export function stageShortName(n: number): string {
  const p = STUDY_PHASES.find((p) => p.number === n)
  if (!p) return `Phase ${n}`
  return p.stageCode ? `Stage ${p.stageCode}` : `Phase ${p.number}`
}

/** Full "Current Stage" display label (replaces the old `phaseLabel`, which
 *  called every phase "Phase N — Official Name" — too long per Round 9.1
 *  research-team feedback). COACH-mapped phases become "Stage X: Word";
 *  the 3 phases outside the COACH stage sequence keep the legacy format.
 *  Em dash swapped for a colon app-wide (direct instruction) — see the
 *  matching update in `CLAUDE.md`'s terminology table, which documents this
 *  exact format. */
export function stageLabel(n: number): string {
  const p = STUDY_PHASES.find((p) => p.number === n)
  if (!p) return `Phase ${n}`
  return p.stageCode ? `Stage ${p.stageCode}: ${p.shortLabel}` : `Phase ${p.number}: ${p.name}`
}

// ---------------------------------------------------------------------------
// In-module answers (Phase 3 — Content learning)
// ---------------------------------------------------------------------------

/** One knowledge-check question, shared across the cohort for a module. */
export interface KnowledgeCheckQuestion {
  question: string
  options: string[]
  /** Index into options */
  correctIndex: number
}

/** The scenario prompt + knowledge check bank for one training module. */
export interface ModuleQuestionBank {
  moduleId: string
  scenarioPrompt: string
  knowledgeCheck: KnowledgeCheckQuestion[]
}

/**
 * Question bank re-keyed onto the real 12-module curriculum
 * (`src/data/trainingPathwayV2.ts`) — one scenario task and two
 * knowledge-check questions per module, carried over from the 8 original
 * Round 1 placeholder modules (`src/data/portal.ts`) where a real curriculum
 * module covers substantially the same ground. Mapping (old id → new id):
 * sleep-basics → understanding-sleep, coach-role → portal-orientation,
 * siptea-framework → program-structure-onboarding, shared-understanding →
 * population-understanding, difficult-emotions → managing-fatigue,
 * environments-routines → setting-stage-sleep, working-with-carers →
 * siptea-framework-v2, sleep-data → keeping-sleep-on-track. The 4 modules
 * with no old counterpart (building-blocks-good-sleep, retraining-brain-sleep,
 * resetting-body-clock) have no question bank entry —
 * `ModuleSlides` degrades gracefully for these (scenario response shown
 * without a prompt/knowledge-check when a coach has one, "not yet reached"
 * otherwise).
 */
export const moduleQuestionBank: ModuleQuestionBank[] = [
  {
    moduleId: 'understanding-sleep',
    scenarioPrompt:
      'Edna, 84, living with Alzheimer’s, naps for long stretches during the day and is awake between 2–4am most nights. Her daughter asks you whether this is "just part of dementia". How would you respond as her sleep coach?',
    knowledgeCheck: [
      {
        question:
          'Which change to sleep architecture is most typical in dementia?',
        options: [
          'More deep (slow-wave) sleep',
          'Less deep sleep and more night-time awakenings',
          'No change: sleep is unaffected by dementia',
          'Longer unbroken sleep at night',
        ],
        correctIndex: 1,
      },
      {
        question:
          'A consumer’s total sleep need in later life is best described as…',
        options: [
          'Dramatically lower: 4 hours is normal',
          'Similar to mid-life, but often more fragmented',
          'Double that of a younger adult',
          'Irrelevant to daytime function',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 'portal-orientation',
    scenarioPrompt:
      'During a session, a carer asks you whether their husband should increase his melatonin dose. How do you respond in a way that stays within the coach role?',
    knowledgeCheck: [
      {
        question: 'Which of these sits OUTSIDE the sleep coach role?',
        options: [
          'Helping a consumer set a realistic wind-down routine',
          'Adjusting or advising on medication doses',
          'Reflecting a carer’s frustrations back with empathy',
          'Reviewing a sleep diary together',
        ],
        correctIndex: 1,
      },
      {
        question: 'When a question is clinical, the coach should…',
        options: [
          'Answer from personal experience',
          'Redirect to the consumer’s GP or treating team, and refocus on behavioural strategies',
          'Look it up during the session',
          'End the session immediately',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 'program-structure-onboarding',
    scenarioPrompt:
      'Pick two SIPTEA components and describe a moment from your own care work where each one would have changed how a conversation went.',
    knowledgeCheck: [
      {
        question: 'SIPTEA is best described as…',
        options: [
          'A medication protocol',
          'The coaching competency framework used across training, feedback and supervision',
          'A sleep diary format',
          'A research consent process',
        ],
        correctIndex: 1,
      },
      {
        question: 'The "E" in SIPTEA stands for…',
        options: [
          'Evaluation',
          'Emotion navigation',
          'Escalation',
          'Environment',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 'population-understanding',
    scenarioPrompt:
      'Frank, a carer, opens your first session with: "Nothing works, we’ve tried everything, I don’t know why we’re doing this." Write the first three things you would say or do to build shared understanding before proposing anything.',
    knowledgeCheck: [
      {
        question: 'Shared understanding is primarily built by…',
        options: [
          'Presenting the evidence for sleep hygiene early',
          'Listening for the consumer’s own goals and reflecting them back before suggesting strategies',
          'Setting the agenda for the consumer to keep sessions efficient',
          'Completing the sleep diary on their behalf',
        ],
        correctIndex: 1,
      },
      {
        question: 'A good first-session goal is one that is…',
        options: [
          'Chosen by the coach from best practice',
          'Meaningful to the consumer and small enough to try this week',
          'Focused on eliminating all night waking',
          'Deferred until Fitbit data is available',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 'managing-fatigue',
    scenarioPrompt:
      'Midway through a session, a carer begins crying and says she feels guilty for getting angry at her mother at 3am. What do you do in the next two minutes?',
    knowledgeCheck: [
      {
        question: 'When strong emotion surfaces in a session, the coach should first…',
        options: [
          'Return to the agenda to keep the session on track',
          'Acknowledge and make room for the emotion before any problem-solving',
          'Suggest the carer seek counselling and move on',
          'Take notes silently until it passes',
        ],
        correctIndex: 1,
      },
      {
        question: 'Carer guilt around night-time frustration is…',
        options: [
          'Rare, and a red flag on its own',
          'Common, and worth normalising explicitly',
          'Outside the scope of a sleep conversation',
          'A reason to pause the intervention',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 'setting-stage-sleep',
    scenarioPrompt:
      'A consumer’s bedroom has a bright hallway light left on all night for safety, a TV that runs until midnight, and no consistent bedtime. Propose two changes, and explain how you would raise them without prescribing.',
    knowledgeCheck: [
      {
        question: 'Which environmental change most directly supports night-time sleep?',
        options: [
          'Brighter evening lighting',
          'Reducing light and noise in the sleep space overnight',
          'Moving dinner later',
          'Longer daytime naps',
        ],
        correctIndex: 1,
      },
      {
        question: 'Morning light exposure matters because it…',
        options: [
          'Has no effect on sleep',
          'Anchors the circadian rhythm, supporting sleepiness at night',
          'Replaces the need for a routine',
          'Only helps younger adults',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 'siptea-framework-v2',
    scenarioPrompt:
      'In a joint session, the carer keeps answering questions you direct to the person living with dementia. How do you keep both people in the conversation without embarrassing either?',
    knowledgeCheck: [
      {
        question: 'In a carer–consumer pair, the coach’s stance should be…',
        options: [
          'Aligned with the carer, who manages the routine',
          'Alongside both, without taking sides',
          'Aligned with the person living with dementia',
          'Neutral by staying silent',
        ],
        correctIndex: 1,
      },
      {
        question: 'If the carer and consumer want different goals, the coach should…',
        options: [
          'Pick the more clinically sound goal',
          'Surface the difference openly and look for a shared starting point',
          'Alternate goals between sessions',
          'Defer the goal to the research team',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    moduleId: 'keeping-sleep-on-track',
    scenarioPrompt:
      'A consumer’s Fitbit shows 5.5 hours of sleep, but the carer’s diary says "a good night". How would you open a conversation that uses both without making either feel wrong?',
    knowledgeCheck: [
      {
        question: 'When diary and Fitbit data disagree, the coach should treat this as…',
        options: [
          'A device error to report',
          'A conversation starter: both capture something real and different',
          'Proof the diary is unreliable',
          'A reason to stop using the diary',
        ],
        correctIndex: 1,
      },
      {
        question: 'Sleep data in coaching is used to…',
        options: [
          'Grade the consumer’s compliance',
          'Notice patterns together and inform the next small experiment',
          'Set fixed targets the consumer must meet',
          'Replace the consumer’s own account',
        ],
        correctIndex: 1,
      },
    ],
  },
]

export function getQuestionBank(moduleId: string): ModuleQuestionBank | undefined {
  return moduleQuestionBank.find((b) => b.moduleId === moduleId)
}

// ---------------------------------------------------------------------------
// Per-coach training records
// ---------------------------------------------------------------------------

export type ModuleRecordStatus = 'not-started' | 'in-progress' | 'completed'

/** A coach's answer to one knowledge-check question. */
export interface KnowledgeCheckAnswer {
  /** Index of the option the coach selected */
  selectedIndex: number
}

/** One coach's record against one training module. */
export interface ModuleRecord {
  moduleId: string
  status: ModuleRecordStatus
  /** ISO date, present when completed */
  completedDate?: string
  /** The coach's written scenario-task response, present once submitted */
  scenarioResponse?: string
  /** One entry per question in the module's knowledge-check bank */
  knowledgeCheckAnswers?: KnowledgeCheckAnswer[]
  /** The coach's own end-of-module feedback (Round 22) — a 0-5 star rating
   *  and an optional free-text comment, given on the module's own
   *  `ModuleFeedbackSlide` in `training-v2/player`. Independent of each
   *  other (a coach can leave a comment with no rating, or vice versa) and
   *  both absent when the coach didn't reach or use this slide at all —
   *  never fabricated for a module that has no real feedback. */
  feedbackRating?: number
  feedbackComment?: string
  /**
   * Slides finished within an in-progress module (Round 2.2). Drives the
   * module-level completion rate shown in the Learning Progress accordion.
   * Omitted for completed (all slides) and not-started (0) modules.
   */
  slidesCompleted?: number
}

/** Annotation summary at one timepoint. Coach controls sharing. */
export interface AnnotationSummary {
  timepoint: 'baseline' | 'midline' | 'endline'
  /** ISO date the coach approved the summary */
  approvedDate: string
  /** Whether the coach chose to share this summary with the research team */
  shared: boolean
  /** Present only when shared */
  summary?: string
}

/**
 * A recorded session (Zoom / videoconference) held for a coach across the
 * COACH phases (Round 2.2). Prototype metadata only — no real media.
 * Visible to the research team + expert assessor per the data-access rules.
 */
export interface SessionRecording {
  id: string
  /** COACH phase this recording belongs to (4, 5, 7, …) */
  phase: number
  title: string
  /** ISO date */
  date: string
  /** "HH:MM" */
  time: string
  durationMin: number
  source: 'Zoom' | 'Videoconference'
  /** Short participant label, e.g. "Cohort 1 group" or "Simulated consumer" */
  participants: string
}

export interface GroupSessionAttendance {
  sessionId: string
  attended: boolean
}

export interface CertificationRecord {
  outcome: CertificationOutcome
  /** ISO date of the Placement 2 assessment, when assessed */
  assessedDate?: string
  /** Set true after the researcher generates the certificate */
  certificateGenerated: boolean
  /** ISO date the certificate was generated */
  certificateDate?: string
  /** Short note shown alongside a remediation outcome */
  note?: string
}

/** Round 6.2.1 — shared shape for the new Account tabs (researcher/coach/consumer). */
export interface NotificationPreferences {
  email: boolean
  sms: boolean
}

/** A scheduled Zoom session for one coach trainee at Stage A or H — shown on
 *  the researcher's My Schedule home page. Placement 1 and Placement 2 are
 *  individual placements (one trainee, one simulated consumer), unlike Stage
 *  O's group practice, which is scheduled per cohort — see
 *  `CohortUpcomingSession` below. Same shape family as `spaces.ts`'s
 *  `UpcomingSession`, plus `withWhom` since a trainee session has no "dyad
 *  title" to display (observer for Stage A, expert assessor for Stage H). */
export interface TraineeUpcomingSession {
  /** Which COACH stage this session belongs to — 5 (Placement 1) or 7
   *  (Placement 2 and certification). Lets the trainee Overview's Zoom
   *  sessions list say which stage is booked and which still isn't, without a
   *  second source of truth alongside this field. */
  phase?: number
  title: string
  /** ISO date */
  date: string
  /** "HH:MM" */
  time: string
  withWhom: string
  meetingId: string
  zoomLink: string
}

/** A scheduled Zoom session for Stage O (Guided group practice) — one
 *  session, shared by every trainee in the given cohort, mirroring how
 *  `groupSessions` already models past group practice sessions. Shown on the
 *  researcher's My Schedule home page as a single row listing every
 *  attendee, not one row per trainee. */
export interface CohortUpcomingSession {
  title: string
  /** ISO date */
  date: string
  /** "HH:MM" */
  time: string
  withWhom: string
  meetingId: string
  zoomLink: string
  cohort: string
}

export const upcomingGroupSessions: CohortUpcomingSession[] = [
  {
    title: 'Group practice 5: Consolidation and readiness check',
    date: '2026-07-22',
    time: '13:00',
    withWhom: 'Dr Sarah Whitfield (Facilitator)',
    meetingId: '839 2201 5567',
    zoomLink: 'https://zoom.us/j/8392201567',
    cohort: 'Cohort 1',
  },
]

/**
 * The Zoom session booked for a given COACH stage, if there is one.
 *
 * Only three stages involve a session at all: Stage O is a cohort-wide group
 * practice (shared by every trainee in that cohort), and Stages A and H are the
 * trainee's own placement sessions. Stage C is self-paced content and Stage CP
 * has no scheduled session, so both return `undefined` and the Overview's list
 * skips them rather than showing an empty row.
 *
 * Reads the same two fields the Research Dashboard home page already schedules
 * from — the cohort list and the trainee's own `upcomingSession` — so the two
 * surfaces can't disagree about whether something is booked.
 */
export function stageZoomSession(
  coach: Coach,
): (TraineeUpcomingSession & { phase: number })[] {
  const sessions: (TraineeUpcomingSession & { phase: number })[] = []

  // Only while the trainee is actually at Stage O. The cohort session belongs
  // to the cohort, not to every member of it forever: without this guard a
  // Stage C trainee's Scheduled sessions table showed a group practice booked
  // for them while the pathway timeline directly above said Stage O hadn't
  // started — the same `currentPhase === GROUP_PHASE` rule the Research
  // Dashboard home page already applies when it builds that session's
  // attendee list.
  for (const group of upcomingGroupSessions) {
    if (group.cohort !== coach.cohort || coach.currentPhase !== 4) continue
    sessions.push({
      phase: 4,
      title: group.title,
      date: group.date,
      time: group.time,
      withWhom: group.withWhom,
      meetingId: group.meetingId,
      zoomLink: group.zoomLink,
    })
  }

  const own = coach.upcomingSession
  if (own?.phase && own.date && own.time && own.zoomLink) {
    sessions.push({ ...own, phase: own.phase })
  }

  return sessions
}

export interface Coach {
  id: string
  participantId: string
  fullName: string
  initials: string
  email: string
  phone: string
  employer: string
  roleAtEmployer: string
  /** Carried over from the EOI form — dropped by earlier onboarding logic (Round 2.2.4 fix). */
  yearsInAgedCare: number
  cohort: string
  /** ISO date of enrolment (Phase 2 complete) */
  enrolmentDate: string
  status: CoachStatus
  /** Has this trainee accepted their platform invite yet? See `InviteStatus`. */
  inviteStatus: InviteStatus
  /** Current COACH lifecycle phase number (1–8) */
  currentPhase: number
  /** Present for withdrawn coaches */
  withdrawalNote?: string
  /* Round 21 — `needsSupport` / `supportRaisedDate` removed entirely on direct
     instruction ("get rid of any need support data, no longer needed"). They
     drove a roster column, a KPI tile, a dismissible profile banner and a
     study-wide notification, all of which are gone; the fields would otherwise
     have sat here unread. */
  /** Round 21 — ISO date this trainee last did anything on the platform, shown
   *  as the roster's "Last active" column (Figma frame `23:1453`). Absent means
   *  never signed in, which is the correct state for an unaccepted invite: the
   *  column renders "Never" rather than a fabricated date. Always <= `TODAY`. */
  lastActive?: string
  moduleRecords: ModuleRecord[]
  /** Notes from the demonstration video analysis task, once submitted */
  demoVideoNotes?: string
  annotationSummaries: AnnotationSummary[]
  groupSessionAttendance: GroupSessionAttendance[]
  certification: CertificationRecord
  /** Account tab (Round 6.2.1) — additive, defaults applied at render if absent. */
  notificationPreferences?: NotificationPreferences
  /** My Schedule (Research Dashboard home) — an individual Stage A/H
   *  trainee's next scheduled Zoom session, when one has been set. Stage O
   *  sessions are cohort-wide instead — see `upcomingGroupSessions`. */
  upcomingSession?: TraineeUpcomingSession
}

/** Phase 4 — Guided group practice: the scheduled group sessions. */
export interface GroupSession {
  id: string
  title: string
  /** ISO date */
  date: string
  facilitator: string
  /** Short facilitator record note for the oversight table */
  facilitatorNote: string
}

export const groupSessions: GroupSession[] = [
  {
    id: 'gs-1',
    title: 'Group practice 1: Opening a coaching conversation',
    date: '2026-06-30',
    facilitator: 'Dr Sarah Whitfield',
    facilitatorNote:
      'Full group worked through first-session openings in pairs; strong engagement, two coaches asked for extra practice on goal-setting language.',
  },
  {
    id: 'gs-2',
    title: 'Group practice 2: Using SIPTEA in the moment',
    date: '2026-07-07',
    facilitator: 'Dr Sarah Whitfield',
    facilitatorNote:
      'Role-plays anchored to SIPTEA components; group tended to jump to advice-giving early. Flagged for reinforcement next session.',
  },
  {
    id: 'gs-3',
    title: 'Group practice 3: Navigating emotion',
    date: '2026-07-14',
    facilitator: 'Dr Sarah Whitfield',
    facilitatorNote:
      'Simulated carer-distress scenarios; noticeable improvement in sitting with emotion before problem-solving.',
  },
  {
    id: 'gs-4',
    title: 'Group practice 4: Working with data and wrap-up',
    date: '2026-07-21',
    facilitator: 'Dr Sarah Whitfield',
    facilitatorNote:
      'Sleep-diary and Fitbit conversation practice; group ready to progress to Placement 1 pending individual sign-offs.',
  },
]

// --- helpers to build records tersely --------------------------------------

const CORRECT: KnowledgeCheckAnswer[] = [{ selectedIndex: 1 }, { selectedIndex: 1 }]
/** One wrong answer on the first question. */
const ONE_WRONG: KnowledgeCheckAnswer[] = [{ selectedIndex: 0 }, { selectedIndex: 1 }]

function done(
  moduleId: string,
  completedDate: string,
  scenarioResponse: string,
  knowledgeCheckAnswers: KnowledgeCheckAnswer[] = CORRECT,
  feedback?: { rating?: number; comment?: string },
): ModuleRecord {
  return {
    moduleId,
    status: 'completed',
    completedDate,
    scenarioResponse,
    knowledgeCheckAnswers,
    feedbackRating: feedback?.rating,
    feedbackComment: feedback?.comment,
  }
}

function inProgress(moduleId: string, slidesCompleted = 3): ModuleRecord {
  return { moduleId, status: 'in-progress', slidesCompleted }
}

function notStarted(moduleId: string): ModuleRecord {
  return { moduleId, status: 'not-started' }
}

/** Fill any modules not explicitly listed as **completed** on `completedDate`.
 *
 *  Round 21 — makes a real COACH-pathway invariant structural instead of
 *  hand-maintained: a trainee only reaches Stage O (Guided group practice,
 *  phase 4) *after* finishing Content learning, so a phase >= 4 trainee with
 *  some modules still not-started is inconsistent by definition. Aisha Mohamed
 *  had exactly that (8/12 complete at Stage O) — the same defect a Round 9.1
 *  data audit reported fixing, which means it either never took or regressed.
 *  Using this helper rather than hand-writing the remaining `done()` entries
 *  means it can't silently drift again as the module list grows.
 *
 *  Deliberately kept separate from `fillRecords` below rather than added as a
 *  flag: the two express opposite intents (still-learning vs. finished), and a
 *  boolean at the call site would read as an implementation detail instead of a
 *  statement about where the trainee is in the pathway. */
function fillRecordsComplete(explicit: ModuleRecord[], completedDate: string): ModuleRecord[] {
  const byId = new Map(explicit.map((r) => [r.moduleId, r]))
  return PATHWAY_MODULES_V2.map((m) => {
    const own = byId.get(m.id)
    // No `own` -> synthesise a completed record. `own` already completed ->
    // keep it verbatim, so its real written response and date survive.
    if (own === undefined) return done(m.id, completedDate, GENERIC_MODULE_RESPONSES[m.id] ?? '')
    if (own.status === 'completed') return own
    // `own` present but NOT completed -> promote it. This is the case the first
    // version of this helper missed: it only synthesised records for modules
    // *absent* from `explicit`, so an explicit `inProgress(...)`/`notStarted(...)`
    // entry passed straight through and still violated the invariant. Aisha
    // Mohamed measured 11/12 at Stage O for exactly that reason and had to be
    // patched by hand — which is precisely the drift this helper exists to make
    // impossible. Any response/answers already on the record are preserved.
    return {
      ...own,
      status: 'completed' as const,
      completedDate: own.completedDate ?? completedDate,
      scenarioResponse: own.scenarioResponse ?? GENERIC_MODULE_RESPONSES[m.id] ?? '',
      knowledgeCheckAnswers: own.knowledgeCheckAnswers ?? CORRECT,
      // `slidesCompleted` is meaningful only for an in-progress module; a
      // completed record must not carry a partial slide count.
      slidesCompleted: undefined,
    }
  })
}

/** Fill any modules not explicitly listed with not-started records. */
function fillRecords(explicit: ModuleRecord[]): ModuleRecord[] {
  const covered = new Set(explicit.map((r) => r.moduleId))
  return [
    ...explicit,
    ...PATHWAY_MODULES_V2.filter((m) => !covered.has(m.id)).map((m) => notStarted(m.id)),
  ]
}

const attendedAll: GroupSessionAttendance[] = groupSessions.map((s) => ({
  sessionId: s.id,
  attended: true,
}))

const noSessions: GroupSessionAttendance[] = groupSessions.map((s) => ({
  sessionId: s.id,
  attended: false,
}))

// ---------------------------------------------------------------------------
// Round 3 addition: coaches who completed Phase 7 (Placement 2) and passed
// certification earlier than this dataset's other records, forming the pool
// of "already-certified Program 1 coaches" that the SPACES Coaches area draws
// its invite-eligible candidates from (see round-3-…-prototype-plan.md, open
// question 1). Module content is intentionally uniform across these six —
// their training-review detail isn't surfaced anywhere in the SPACES UI;
// only their identity fields (name, employer, certification) matter there.
// Declared before `coaches` so the roster below can spread it in directly.
// ---------------------------------------------------------------------------

const GENERIC_MODULE_RESPONSES: Record<string, string> = {
  'understanding-sleep':
    'Rather than treating one bad night as the problem, I’d look at the whole 24-hour pattern with the family (daytime naps, light exposure, evening routine) before suggesting any single change.',
  'portal-orientation':
    'I’d keep the conversation in my lane (practical routines and environment, not medication or diagnosis) and redirect clinical questions to the GP or nurse practitioner without dismissing the concern.',
  'program-structure-onboarding':
    'A shared-understanding moment I keep coming back to: asking a carer what a "normal" night used to look like before offering any strategy, so the plan starts from their reality, not a checklist.',
  'population-understanding':
    'I’d name the exhaustion first, ask what "coping" has actually involved for them, and only then ask what a slightly easier week might look like. Strategies come last, not first.',
  'managing-fatigue':
    'When a carer becomes tearful, I stop the agenda and let the emotion be there without rushing to fix it, returning to practical steps only once they’re ready and have given the go-ahead.',
  'setting-stage-sleep':
    'Two changes I’d raise as questions, not instructions: a softer hallway light, the TV off an hour before bed, so the family stays the decision-maker.',
  'siptea-framework-v2':
    'When a carer keeps answering for the person with dementia, I give the carer their own clear task so both people feel included without either being corrected in front of the other.',
  'keeping-sleep-on-track':
    'When the diary and the Fitbit disagree, I treat both as true and worth exploring rather than picking one as correct. The mismatch is often the useful finding, not an error to resolve.',
  // The 4 modules with no Round 1 counterpart — generic but domain-realistic
  // completion narratives so already-certified coaches show full engagement
  // across the whole real 12-module curriculum, not just the 8 legacy ones.
  'building-blocks-good-sleep':
    'I’d help the family land on one or two consistent daily anchors (a fixed wake time, morning light, a wind-down routine) rather than a long list of changes at once, since consistency matters more than any single habit.',
  'retraining-brain-sleep':
    'When a consumer spends long stretches awake in bed, I’d suggest getting up for a calm, low-light activity rather than staying in bed "trying" to sleep, so the bed stays associated with sleep rather than wakeful frustration.',
  'resetting-body-clock':
    'I’d anchor the day around consistent morning light and a fixed wake time first, since realigning the body clock does more for night-time sleep than anything done in the evening alone.',
}

function certifiedModuleRecords(dateStr: string): ModuleRecord[] {
  return PATHWAY_MODULES_V2.map((m) => done(m.id, dateStr, GENERIC_MODULE_RESPONSES[m.id] ?? ''))
}

const certifiedCoaches: Coach[] = [
  {
    id: 'fatima-haidari',
    inviteStatus: 'active',
    participantId: 'C2S-C-020',
    fullName: 'Fatima Haidari',
    initials: 'FH',
    email: 'f.haidari@hillcrest.example.au',
    phone: '0407 555 129',
    employer: 'Hillcrest Aged Care',
    roleAtEmployer: 'Enrolled nurse',
    yearsInAgedCare: 11,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-02-16',
    status: 'completed',
    currentPhase: 8,
    moduleRecords: certifiedModuleRecords('2026-03-20'),
    demoVideoNotes:
      'Demonstration video analysis submitted 2026-03-24. Clear structure, strong pacing; noted for staying with the consumer’s own words before reframing.',
    annotationSummaries: [
      { timepoint: 'baseline', approvedDate: '2026-03-25', shared: true, summary: 'Fatima starts confident in structured routines, less sure how to slow down when a family gets emotional.' },
      { timepoint: 'midline', approvedDate: '2026-04-20', shared: true, summary: 'Group practice sharpened Fatima’s opening questions; she now checks the family’s own goal before proposing anything.' },
      { timepoint: 'endline', approvedDate: '2026-05-18', shared: true, summary: 'Fatima names emotion navigation as her strongest growth area heading into SPACES delivery. She no longer rushes to reassure.' },
    ],
    groupSessionAttendance: attendedAll,
    certification: { outcome: 'pass', assessedDate: '2026-05-18', certificateGenerated: false },
    // Certified/SPACES coaches can also have a scheduled Zoom session with
    // the researcher — supervision, not COACH-pathway placement (My
    // Schedule, Round 10.2). Same individual `upcomingSession` shape as a
    // Stage A/H trainee.
    upcomingSession: {
      title: 'Supervision check-in',
      date: '2026-07-23',
      time: '15:30',
      withWhom: 'Claire Donnelly (Supervisor)',
      meetingId: '771 4409 2286',
      zoomLink: 'https://zoom.us/j/7714409286',
    },
  },
  // Round 21: Robert Tan, Chloe Fitzgerald, Samuel Okafor and Ingrid Sorensen
  // were deleted outright on direct instruction — four certified records that
  // added nothing the two remaining coaches don't already demonstrate. Mei-Ling
  // Chen is kept as the one certified-but-not-onboarded coach, so Coach
  // Management's "Waiting to be onboarded" tab and its Onboard flow still have
  // a real candidate.
  {
    id: 'mei-ling-chen',
    inviteStatus: 'active',
    participantId: 'C2S-C-025',
    fullName: 'Mei-Ling Chen',
    initials: 'MC',
    email: 'm.chen@correaridge.example.au',
    phone: '0417 555 258',
    employer: 'Correa Ridge Aged Care',
    roleAtEmployer: 'Personal care assistant',
    yearsInAgedCare: 5,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-03-23',
    status: 'completed',
    currentPhase: 8,
    moduleRecords: certifiedModuleRecords('2026-04-24'),
    demoVideoNotes:
      'Demonstration video analysis submitted 2026-04-27. Assessor noted natural warmth with carers; suggested more direct language when raising safety concerns.',
    annotationSummaries: [
      { timepoint: 'baseline', approvedDate: '2026-04-28', shared: true, summary: 'Mei-Ling builds rapport easily; wants more confidence raising environment/safety changes directly.' },
      { timepoint: 'midline', approvedDate: '2026-05-25', shared: true, summary: 'Mei-Ling reports role-play helped her name safety concerns plainly while still asking permission first.' },
      { timepoint: 'endline', approvedDate: '2026-06-22', shared: true, summary: 'Mei-Ling says she now raises environment changes as clear questions rather than hedging, without losing warmth.' },
    ],
    groupSessionAttendance: attendedAll,
    certification: { outcome: 'pass', assessedDate: '2026-06-22', certificateGenerated: false },
  },
]

// ---------------------------------------------------------------------------
// The coach roster
// ---------------------------------------------------------------------------

export const coaches: Coach[] = [
  {
    id: 'helen-zhang',
    inviteStatus: 'active',
    participantId: 'C2S-C-010',
    fullName: 'Helen Zhang',
    initials: 'HZ',
    email: 'h.zhang@stbrigids.example.au',
    phone: '0421 555 480',
    employer: "St Brigid's Aged Care",
    roleAtEmployer: 'Enrolled nurse',
    yearsInAgedCare: 8,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-05-04',
    status: 'completed',
    currentPhase: 8,
    moduleRecords: [
      done(
        'portal-orientation',
        '2026-05-21',
        'I would not give an opinion on the melatonin dose. That belongs with the GP. I’d say something like "that’s a really good question for his doctor, and it’s worth asking. What I can help with is what happens around the medication: his evenings, the bedroom, the routine." That keeps trust while staying inside the coach role.',
      ),
      done(
        'population-understanding',
        '2026-06-05',
        'First, I’d acknowledge it directly: "It sounds like you’re exhausted, and you’ve been carrying this for a long time." Second, I’d ask what "everything" has included, not to critique it, but to honour the effort. Third, I’d ask what a slightly better week would look like for him, not a perfect one. No strategies until all three of those have happened.',
      ),
      done(
        'program-structure-onboarding',
        '2026-05-29',
        'Shared understanding: a resident’s wife once told me he was "being difficult" at night, and I jumped straight to suggestions. If I had asked what nights used to look like for them first, she would have felt heard instead of judged. Emotion navigation: a colleague’s handover about a tearful family meeting: naming the exhaustion in the room before talking plans would have changed the whole meeting.',
      ),
      done(
        'siptea-framework-v2',
        '2026-06-19',
        'I’d use body language first: turning towards the person with dementia and using her name. If the carer keeps stepping in, I’d give him a real job: "Frank, I’m going to ask Dorothy a few things, and then I really want your view of the same nights, because you see what she can’t." Both people stay valued; nobody is corrected in front of the other.',
      ),
      done(
        'understanding-sleep',
        '2026-05-18',
        'I would tell Edna’s daughter that broken nights are common with Alzheimer’s but they are not something we just accept. The long daytime naps and the 2–4am waking are feeding each other, so rather than treating the night as the problem, I’d suggest we look at the whole 24 hours together (what her mornings look like, when the naps happen, what the evenings are like) and find one small thing to change first.',
      ),
      done(
        'building-blocks-good-sleep',
        '2026-06-26',
        'I’d help the family settle on one consistent daily anchor first, morning light and a fixed wake time, rather than trying to fix the evening and the night at the same time. Consistency does more work than any single change.',
      ),
      done(
        'retraining-brain-sleep',
        '2026-06-28',
        'When a consumer is lying awake and frustrated, I’d suggest getting up for a calm, low-light activity rather than staying in bed willing sleep to come, so the bed keeps its association with sleep rather than with wakeful worry.',
      ),
      done(
        'resetting-body-clock',
        '2026-06-30',
        'I’d start with the mornings, consistent wake time and real light exposure, before touching the evening routine at all. Realigning the body clock from the morning end usually moves the whole 24-hour pattern.',
      ),
      done(
        'setting-stage-sleep',
        '2026-06-16',
        'The two changes I’d raise are a dimmer or motion-sensor light for the hallway, and moving the TV off in the last hour before bed. I’d raise them as questions, not fixes: "I’m curious about the hallway light. Has anyone ever tried a softer one?" That way, the family stays the decision-maker and safety concerns stay on the table.',
      ),
      done(
        'managing-fatigue',
        '2026-06-12',
        'I would stop the agenda completely and let her cry without rushing her. Then I’d normalise it: "Getting angry at 3am after months of broken sleep doesn’t make you a bad daughter; it makes you a human being who is exhausted." I’d only return to strategies once she’d settled, and I’d ask her permission first.',
      ),
      done(
        'keeping-sleep-on-track',
        '2026-06-23',
        'I’d put both on the table as equally true: "The diary says it felt like a good night, and the watch counted five and a half hours. I think both of those are telling us something." Then I’d ask the carer what made it feel good. Often "good" means fewer disturbances for the carer, and that’s a finding, not an error.',
      ),
    ],
    demoVideoNotes:
      'Demonstration video analysis submitted 2026-06-24. Correctly identified the coach’s reflective-listening moves and flagged the missed opportunity to invite the consumer’s own goal. Strong use of SIPTEA language throughout.',
    annotationSummaries: [
      {
        timepoint: 'baseline',
        approvedDate: '2026-06-25',
        shared: true,
        summary:
          'Helen enters practice most confident in rapport-building and structured routines, and least confident in sitting with distress without moving to fix it. Wants to work on slowing down her first sessions.',
      },
      {
        timepoint: 'midline',
        approvedDate: '2026-07-22',
        shared: true,
        summary:
          'Helen reports the group practice shifted how she opens conversations. She now leads with the consumer’s account rather than the diary. Emotion navigation remains her focus for placements; she notes she still feels a pull to reassure too quickly.',
      },
      {
        timepoint: 'endline',
        approvedDate: '2026-07-30',
        shared: true,
        summary:
          'After Placement 2, Helen reflects that emotion navigation has become her strength rather than her worry. She credits the habit of naming the feeling in the room before moving to strategy. She feels ready to hold structure and warmth together heading into SPACES delivery.',
      },
    ],
    groupSessionAttendance: attendedAll,
    certification: {
      outcome: 'pass',
      assessedDate: '2026-07-30',
      // Generated, with a date. Helen is the portal's signed-in persona and is
      // already delivering as a certified SPACES coach elsewhere in this data,
      // so a passed assessment with no issued certificate was the inconsistent
      // state — and it left My profile's "Download certificate" permanently
      // gated with nothing to demonstrate.
      certificateGenerated: true,
      certificateDate: '2026-07-31',
    },
  },
  {
    id: 'priya-raman',
    inviteStatus: 'pending',
    participantId: 'C2S-C-014',
    fullName: 'Priya Raman',
    initials: 'PR',
    email: 'p.raman@banksiagrove.example.au',
    phone: '0417 555 093',
    employer: 'Banksia Grove Aged Care',
    roleAtEmployer: 'Personal care assistant',
    yearsInAgedCare: 4,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-05-04',
    status: 'active',
    currentPhase: 3,
    // Round 21 stage-sync fix: Priya has NOT accepted her platform invite
    // (`inviteStatus: 'pending'`), so she cannot have completed any learning —
    // she has never signed in. She previously carried 2 completed + 2
    // in-progress modules. That mismatch was flagged by a Round 9.1 data audit
    // and deliberately left alone at the time, but the roster now *displays* a
    // "Modules completed" column right beside her "Invite pending" chip and her
    // "—" stage, so the contradiction is on screen rather than buried in data.
    // Zeroed, and `lastActive` is deliberately absent -> "Never".
    moduleRecords: fillRecords([]),
    // Stage C (currentPhase 3) — baseline reflection isn't due until Content
    // learning is complete and Guided group practice (Stage O) begins, so no
    // reflection timepoint has been reached yet.
    annotationSummaries: [],
    groupSessionAttendance: noSessions,
    certification: { outcome: 'not-yet-assessed', certificateGenerated: false },
  },
  {
    id: 'marcus-webb',
    inviteStatus: 'active',
    participantId: 'C2S-C-011',
    fullName: 'Marcus Webb',
    initials: 'MW',
    email: 'm.webb@yarraview.example.au',
    phone: '0439 555 615',
    employer: 'Yarra View Aged Care',
    roleAtEmployer: 'Leisure and lifestyle officer',
    yearsInAgedCare: 6,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-05-04',
    status: 'active',
    lastActive: '2026-07-15',
    currentPhase: 3,
    moduleRecords: fillRecords([
      done(
        'understanding-sleep',
        '2026-05-20',
        'I would explain that dementia does change sleep (lighter sleep, more waking), so her instinct is right, but the pattern Edna is in can still shift. The afternoon naps are likely borrowing from the night. I’d suggest we start by making mornings brighter and more active and see what that does before touching anything else.',
        CORRECT,
        { rating: 5, comment: 'Loved the case examples — they made the sleep-cycle explanation actually click for me.' },
      ),
      done(
        'portal-orientation',
        '2026-05-26',
        'That’s a GP question and I’d say so plainly but warmly. I’m not able to advise on doses, and I’d be doing them a disservice if I guessed. What I can do is help them track how nights actually look so the GP has real information to work with.',
      ),
      done(
        'program-structure-onboarding',
        '2026-06-03',
        'Emotion navigation: a resident’s son once shouted at me about his dad’s falls, and I got defensive. With SIPTEA language I’d now treat that anger as fear and meet it there first. Shared understanding: our activity plans used to be built from the care plan, not the person; asking residents what a good day looks like changed everything, and it’s the same move in coaching.',
        ONE_WRONG,
        { rating: 3, comment: 'Good content but pretty text-heavy — some of this could work better as a short video.' },
      ),
      done(
        'population-understanding',
        '2026-06-10',
        'One: let the statement land, "You’re tired of trying things that don’t stick. That’s fair." Two: ask him to tell me about the worst night this week, just to understand it, not to fix it. Three: ask what he’d settle for, not a perfect night, but a night that would feel like a win. Then stop talking and listen.',
      ),
      done(
        'managing-fatigue',
        '2026-06-15',
        'First two minutes: put my notes down, soften my voice, and tell her that what she’s feeling has a name, carer exhaustion, and that guilt at 3am is something almost every carer in this study describes. I would not offer a single strategy until she indicated she was ready. If she wanted to end early, that would be fine too.',
        CORRECT,
        { rating: 4 },
      ),
      inProgress('setting-stage-sleep', 3),
    ]),
    demoVideoNotes:
      'Demonstration video analysis submitted 2026-06-17. Good eye for pacing; identified where the coach talked over the consumer. Analysis of the goal-setting segment was thinner, worth revisiting before Placement 1.',
    // Stage C (currentPhase 3) — still in Content learning, so no reflection
    // timepoint (baseline onward) has been reached yet.
    annotationSummaries: [],
    groupSessionAttendance: noSessions,
    certification: { outcome: 'not-yet-assessed', certificateGenerated: false },
  },
  {
    id: 'aisha-mohamed',
    inviteStatus: 'active',
    participantId: 'C2S-C-012',
    fullName: 'Aisha Mohamed',
    initials: 'AM',
    email: 'a.mohamed@silverwattle.example.au',
    phone: '0426 555 271',
    employer: 'Silver Wattle Community Care',
    roleAtEmployer: 'Home care coordinator',
    yearsInAgedCare: 10,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-05-04',
    status: 'active',
    lastActive: '2026-07-21',
    currentPhase: 4,
    // Round 21 stage-sync fix: Aisha is at Stage O (phase 4), which is only
    // reachable after Content learning is complete, but 4 of the 12 modules
    // were still not-started. `fillRecordsComplete` closes the remainder on the
    // date below rather than hand-adding 4 `done()` entries, so this can't drift
    // again if the module list grows.
    moduleRecords: fillRecordsComplete([
      done(
        'understanding-sleep',
        '2026-05-19',
        'I’d validate her first. She’s been watching her mum closely and that matters. Then I’d explain that while dementia changes sleep, a 2–4am waking window this consistent usually has levers we can pull: light, activity, nap timing. I’d frame it as detective work we do together rather than a verdict.',
      ),
      done(
        'portal-orientation',
        '2026-05-25',
        'I’d be honest that medication is outside what a sleep coach can advise on, and that the GP needs to make that call with the full picture. I’d offer to help prepare for that appointment: a week of diary notes is far more useful to a GP than "he doesn’t sleep". Then I’d steer us back to routines and environment.',
      ),
      done(
        'program-structure-onboarding',
        '2026-06-02',
        'Shared understanding: a client’s husband refused respite care for months. When I finally asked what respite meant to him, he said "giving up". Naming that changed the conversation. Emotion navigation: I often see clients’ children argue in front of them; staying with the feeling under the argument (fear of loss) rather than the logistics would have served them better.',
      ),
      done(
        'population-understanding',
        '2026-06-09',
        'First: agree with him, "You’re right to be sceptical; you know this situation better than I do." Second: ask what trying everything has cost him, because the exhaustion is the real story. Third: ask permission to start small, "Would you be willing to pick one night this week to try one thing, and judge me on that?" Trust before technique.',
      ),
      done(
        'managing-fatigue',
        '2026-06-14',
        'I’d let the tears come and resist filling the silence. Then: "Thank you for trusting me with that. Anger at 3am is what sleep deprivation does to loving people." I’d check whether she wants to keep going today or stop here, and either answer is a good session. The strategy list can wait a week; her feeling safe with me cannot.',
      ),
      done(
        'setting-stage-sleep',
        '2026-06-19',
        'I’d suggest a low warm night-light for the hallway instead of the bright one, and a wind-down anchor to replace the TV: same time, same chair, same music. I’d raise both by asking the family what each thing is protecting (safety, company) so the replacement keeps the protection but loses the sleep cost.',
      ),
      done(
        'siptea-framework-v2',
        '2026-06-20',
        'I’d name the exhaustion first, before any strategy. Carers who feel judged stop telling me the truth about the nights. Then I’d ask what support they already have and what’s stopping them from using it, rather than assuming they haven’t tried.',
      ),
      done(
        'keeping-sleep-on-track',
        '2026-06-21',
        'I’d bring the Fitbit and the diary into the room together rather than treating one as "the real answer." When they disagree, that gap is itself useful information to ask the family about, not a problem to resolve before the conversation starts.',
      ),
      // Net-new sleep modules with no Round 1 counterpart — Aisha's own
      // engagement pattern (all 8 mapped modules completed) carries forward
      // into the real curriculum's remaining sleep modules as active, ongoing
      // progress rather than resetting her to a standing start.
      // Round 21 stage-sync fix: was `inProgress(...)`, which is inconsistent
      // with Stage O — reaching Guided group practice requires Content learning
      // to be finished. `fillRecordsComplete` can't reach an *explicit* record,
      // only absent ones, so this one had to be closed by hand.
      done(
        'building-blocks-good-sleep',
        '2026-06-26',
        'The levers I keep coming back to are light, movement, and a consistent wake time — they cost nothing and they compound. I\u2019d rather get those three steady for a fortnight than add a fourth thing that gives the family something else to fail at.',
      ),
    ], '2026-06-26'),
    demoVideoNotes:
      'Demonstration video analysis submitted 2026-06-22. Exceptional detail: mapped every coach move to a SIPTEA component and proposed an alternative phrasing for the closing summary. Shared with the group (with permission) as an exemplar.',
    annotationSummaries: [
      {
        timepoint: 'baseline',
        approvedDate: '2026-06-23',
        shared: true,
        summary:
          'Aisha comes in with strong coordination experience and confidence across most components; her stated growth edge is letting silence do the work instead of managing the conversation. She has asked for direct feedback on this in group practice.',
      },
      {
        timepoint: 'midline',
        approvedDate: '2026-07-21',
        shared: true,
        summary:
          'Aisha reports deliberate practice with pausing and reports it is changing what consumers volunteer. Group feedback confirms it. Next focus: holding structure when a session runs emotional and long.',
      },
    ],
    groupSessionAttendance: attendedAll,
    certification: { outcome: 'not-yet-assessed', certificateGenerated: false },
    // Stage O sessions are cohort-wide, not individual — see `upcomingGroupSessions`.
  },
  {
    id: 'daniel-osei',
    inviteStatus: 'active',
    participantId: 'C2S-C-013',
    fullName: 'Daniel Osei',
    initials: 'DO',
    email: 'd.osei@coastalridge.example.au',
    phone: '0417 555 349',
    employer: 'Coastal Ridge Aged Care',
    roleAtEmployer: 'Lifestyle coordinator',
    yearsInAgedCare: 5,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-05-04',
    status: 'active',
    lastActive: '2026-07-22',
    currentPhase: 4,
    // Second Stage O trainee in Cohort 1 — demonstrates a group practice
    // session with more than one attendee (My Schedule, Round 10.1).
    moduleRecords: fillRecords(
      // 12 real modules, 2 sets of 6 (was 2 sets of 4 for the old 8-module
      // curriculum) — `i % 6`/`i < 6` split evenly across May/June without
      // repeating a date within either half.
      PATHWAY_MODULES_V2.map((m, i) =>
        done(
          m.id,
          `2026-0${i < 6 ? 5 : 6}-${String(10 + (i % 6) * 3).padStart(2, '0')}`,
          i === 0
            ? 'I’d start by asking what a "normal night" looked like before the diagnosis, since families often compare current sleep to a baseline that was already changing. Then I’d separate what’s dementia-related from what’s just an unhelpful habit that built up around it. The second kind is usually the easier win.'
            : `Scenario response submitted ${i < 6 ? 'May' : 'June'} 2026, on file. Daniel’s written responses were consistently grounded in specific shifts he could name and try, rather than general principles.`,
          CORRECT,
        ),
      ),
    ),
    demoVideoNotes:
      'Demonstration video analysis submitted 2026-06-21. Clear, well-organised notes; identified most SIPTEA components in play but under-called emotion navigation moments specifically, flagged as a group practice focus area.',
    annotationSummaries: [
      {
        timepoint: 'baseline',
        approvedDate: '2026-06-22',
        shared: true,
        summary:
          'Daniel is methodical and prepares thoroughly before sessions. His stated growth edge is staying with a family’s emotion in the moment rather than moving straight to the practical fix he’s already spotted.',
      },
      {
        timepoint: 'midline',
        approvedDate: '2026-07-21',
        shared: true,
        summary:
          'Daniel reports consciously slowing down before offering a fix, with mixed success under time pressure. Group feedback matches his own read. Next focus: sitting with emotion in a longer, harder conversation.',
      },
    ],
    groupSessionAttendance: attendedAll,
    certification: { outcome: 'not-yet-assessed', certificateGenerated: false },
  },
  {
    id: 'noah-fenwick',
    inviteStatus: 'active',
    participantId: 'C2S-C-015',
    fullName: 'Noah Fenwick',
    initials: 'NF',
    email: 'n.fenwick@coastalridge.example.au',
    phone: '0428 555 762',
    employer: 'Coastal Ridge Aged Care',
    roleAtEmployer: 'Personal care assistant',
    yearsInAgedCare: 4,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-05-04',
    status: 'active',
    lastActive: '2026-07-20',
    currentPhase: 4,
    // Third Stage O trainee in Cohort 1 — pushes the group practice session
    // to 3 attendees, exercising the panel's "+N" truncation (My Schedule,
    // Round 10.1).
    moduleRecords: fillRecords(
      PATHWAY_MODULES_V2.map((m, i) =>
        done(
          m.id,
          `2026-0${i < 6 ? 5 : 6}-${String(10 + (i % 6) * 3).padStart(2, '0')}`,
          i === 0
            ? 'I’d ask what’s changed recently rather than assuming it’s "just the dementia": a new medication, a house move, even daylight saving can shift a sleep pattern this fast. Ruling those out first keeps us from over-fitting the story to the diagnosis.'
            : `Scenario response submitted ${i < 6 ? 'May' : 'June'} 2026, on file. Noah’s responses were shorter than most but consistently on-target.`,
          CORRECT,
        ),
      ),
    ),
    demoVideoNotes:
      'Demonstration video analysis submitted 2026-06-21. Solid fundamentals across the board; no standout strengths or gaps flagged.',
    annotationSummaries: [
      {
        timepoint: 'baseline',
        approvedDate: '2026-06-22',
        shared: true,
        summary:
          'Noah is quietly confident and asks good clarifying questions. He hasn’t yet identified a clear growth edge of his own, flagged as something to surface explicitly in group practice.',
      },
      {
        timepoint: 'midline',
        approvedDate: '2026-07-21',
        shared: true,
        summary:
          'Noah has settled on holding structure in longer conversations as his focus, after group feedback noted he sometimes lets a session drift. Practising a gentle way back on-topic.',
      },
    ],
    groupSessionAttendance: attendedAll,
    certification: { outcome: 'not-yet-assessed', certificateGenerated: false },
  },
  {
    id: 'lauren-mitchell',
    inviteStatus: 'active',
    participantId: 'C2S-C-009',
    fullName: 'Lauren Mitchell',
    initials: 'LM',
    email: 'l.mitchell@banksiagrove.example.au',
    phone: '0408 555 834',
    employer: 'Banksia Grove Aged Care',
    roleAtEmployer: 'Personal care assistant',
    yearsInAgedCare: 7,
    cohort: 'Cohort 1',
    enrolmentDate: '2026-05-04',
    status: 'active',
    lastActive: '2026-07-22',
    currentPhase: 7,
    moduleRecords: fillRecords(
      // 12 real modules, 2 sets of 6 (was 2 sets of 4 for the old 8-module
      // curriculum).
      PATHWAY_MODULES_V2.map((m, i) =>
        done(
          m.id,
          // Resets the day-of-month per month-half (i % 6) instead of
          // accumulating across all 12 modules — the un-reset version
          // (`10 + i * 3`) produced an invalid day-of-month in a 30-day month.
          `2026-0${i < 6 ? 5 : 6}-${String(10 + (i % 6) * 3).padStart(2, '0')}`,
          i === 0
            ? 'I would explain to the daughter that yes, dementia changes sleep, but the current pattern isn’t fixed. The naps and the night waking are two ends of the same problem. I’d want to look at Edna’s daytime first (more morning light and activity) before we worry about the nights themselves.'
            : `Scenario response submitted ${i < 6 ? 'May' : 'June'} 2026, on file. Lauren’s written responses across modules were consistently practical and grounded in floor experience; see expert assessor notes for the Placement 2 discussion of depth on reflective components.`,
          i === 2 || i === 4 ? ONE_WRONG : CORRECT,
        ),
      ),
    ),
    demoVideoNotes:
      'Demonstration video analysis submitted 2026-06-20. Identified practical coaching moves well; reflective analysis of why the moves worked was brief. Discussed in supervision ahead of Placement 1.',
    annotationSummaries: [
      {
        timepoint: 'baseline',
        approvedDate: '2026-06-24',
        shared: true,
        summary:
          'Lauren is confident in the practical strategies and building rapport quickly. She identifies written reflection as her least comfortable ground and prefers demonstrating skills in person.',
      },
      {
        timepoint: 'midline',
        approvedDate: '2026-07-20',
        shared: true,
        summary:
          'Lauren reports growing comfort with SIPTEA language in live practice. She remains more fluent in doing than in articulating why, flagged as her focus heading into placements.',
      },
      {
        timepoint: 'endline',
        approvedDate: '2026-08-02',
        shared: true,
        summary:
          'Lauren now moves fluidly between doing and articulating: Placement 2 showed her naming SIPTEA components in the moment, not just reconstructing them afterward. Her own flagged growth area from midline is the one point she has asked the expert assessor to weigh most closely in the certification decision.',
      },
    ],
    groupSessionAttendance: [
      { sessionId: 'gs-1', attended: true },
      { sessionId: 'gs-2', attended: true },
      { sessionId: 'gs-3', attended: true },
      { sessionId: 'gs-4', attended: false },
    ],
    certification: { outcome: 'not-yet-assessed', certificateGenerated: false },
    upcomingSession: {
      phase: 7,
      title: 'Placement 2: Expert assessment',
      date: '2026-07-24',
      time: '11:00',
      withWhom: 'Simulated consumer · Expert assessor',
      meetingId: '904 1178 3342',
      zoomLink: 'https://zoom.us/j/9041178342',
    },
  },
  ...certifiedCoaches,
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getCoach(id: string): Coach | undefined {
  return coaches.find((c) => c.id === id)
}

/**
 * Session recordings held for a coach across the COACH phases (Round 2.2).
 * Derived from phase progress: Phase 4 group practice (per attendance),
 * Placement 1 (Phase 5+) and Placement 2 (Phase 7+). Prototype metadata only.
 */
/** `dateStr` minus `days`, as a `YYYY-MM-DD` string. */
function daysBefore(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** For an already-certified coach, the live/current-cohort `liveDate` can
 *  postdate their own certification (they finished the pathway before the
 *  current cohort's sessions even happened) — in that case, anchor the
 *  recording as a historical offset before their own certification instead
 *  of a date that would sort as more recent than their own Placement 2
 *  recording. Coaches still mid-pathway (no `assessed` yet, or whose real
 *  dates already precede it) keep the real, current-cohort date untouched. */
function historicalOr(liveDate: string, assessed: string | undefined, offsetDays: number): string {
  return assessed && liveDate > assessed ? daysBefore(assessed, offsetDays) : liveDate
}

export function sessionRecordingsFor(coach: Coach): SessionRecording[] {
  const recs: SessionRecording[] = []
  const assessed = coach.certification.assessedDate

  // Phase 4 — Guided group practice: one recording per session the coach attended.
  // Gated on currentPhase too — a coach still at Stage C and below hasn't reached
  // Guided group practice yet, so no recording should surface even if seed
  // attendance data is present.
  if (coach.currentPhase >= 4) {
    groupSessions.forEach((gs, i) => {
      const attended = coach.groupSessionAttendance.some(
        (a) => a.sessionId === gs.id && a.attended,
      )
      if (attended) {
        recs.push({
          id: `${coach.id}-${gs.id}`,
          phase: 4,
          title: gs.title,
          date: historicalOr(gs.date, assessed, 56 - i * 7),
          time: '10:00',
          durationMin: 60,
          source: 'Zoom',
          participants: `${coach.cohort} group · ${gs.facilitator}`,
        })
      }
    })
  }

  // Phase 5 — Placement 1: recorded simulated-consumer sessions
  if (coach.currentPhase >= 5) {
    recs.push(
      {
        id: `${coach.id}-p1-onboarding`,
        phase: 5,
        title: 'Placement 1: Session 1 (onboarding) with simulated consumer',
        date: historicalOr('2026-07-02', assessed, 21),
        time: '09:00',
        durationMin: 45,
        source: 'Zoom',
        participants: 'Simulated consumer · Observer present',
      },
      {
        id: `${coach.id}-p1-module`,
        phase: 5,
        title: 'Placement 1: Module session with simulated consumer',
        date: historicalOr('2026-07-09', assessed, 14),
        time: '14:00',
        durationMin: 50,
        source: 'Zoom',
        participants: 'Simulated consumer · Peer observer',
      },
    )
  }

  // Phase 7 — Placement 2: the assessed session (live to the expert assessor)
  if (coach.currentPhase >= 7) {
    recs.push({
      id: `${coach.id}-p2-assessment`,
      phase: 7,
      title: 'Placement 2: Assessed coaching session',
      date: coach.certification.assessedDate ?? '2026-07-18',
      time: '13:00',
      durationMin: 55,
      source: 'Videoconference',
      participants: 'Simulated consumer · Expert assessor',
    })
  }

  return recs.sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)))
}

/** The researcher account shown in the dashboard header — also the seed value
 *  for the Account tab's live, editable profile (Round 6.2.1). */
export const researcher = {
  fullName: 'Claire Donnelly',
  initials: 'CD',
  role: 'Research coordinator',
  organisation: 'Monash University',
  email: 'c.donnelly@monash.example.edu',
  phone: '0400 221 987',
  notificationPreferences: { email: true, sms: false } as NotificationPreferences,
}

export const statusLabels: Record<CoachStatus, string> = {
  enrolled: 'Enrolled',
  active: 'Active',
  withdrawn: 'Withdrawn',
  completed: 'Completed',
}

export const certificationLabels: Record<CertificationOutcome, string> = {
  'not-yet-assessed': 'Not yet assessed',
  pass: 'Pass',
  'remediation-required': 'Remediation required',
}

/**
 * Next sequential `C2S-C-NNN` participant ID, derived from the current
 * roster's highest existing number. Shared by the "Add coach trainee" wizard
 * (a live preview before submit) and `addCoachTrainee` itself (the actual
 * assignment), so there's exactly one place this formula lives.
 */
export function nextParticipantId(coaches: Coach[]): string {
  const maxId = Math.max(
    ...coaches.map((c) => Number(c.participantId.replace('C2S-C-', '')) || 0),
  )
  return `C2S-C-${String(maxId + 1).padStart(3, '0')}`
}

/**
 * Fields the "Add coach trainee" wizard collects directly (personal details
 * + aged care details) — the direct-onboarding replacement for the old
 * "approve an EOI" flow. A trainee is onboarded once at Phase 2 (Enrolment
 * and platform access); Phase 1 (Recruitment) is assumed to have already
 * happened outside this platform. These same aged-care-employer fields are
 * carried unchanged through the eventual coach transition (a later round's
 * scope) — see `CoachProfilePage`'s "set at recruitment and aren't editable
 * here" contact-details note.
 */
export interface CoachTraineeInput {
  fullName: string
  email: string
  phone: string
  employer: string
  roleAtEmployer: string
  yearsInAgedCare: number
  cohort: string
}

export function coachFromTraineeInput(
  input: CoachTraineeInput,
  id: string,
  participantId: string,
  enrolmentDate: string,
): Coach {
  const initials = input.fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return {
    id,
    participantId,
    fullName: input.fullName,
    initials,
    email: input.email,
    phone: input.phone,
    employer: input.employer,
    roleAtEmployer: input.roleAtEmployer,
    yearsInAgedCare: input.yearsInAgedCare,
    cohort: input.cohort,
    enrolmentDate,
    status: 'enrolled',
    // Every newly-added trainee starts pending — the wizard is the invite
    // step itself, not an already-accepted enrolment.
    inviteStatus: 'pending',
    currentPhase: 2,
    moduleRecords: fillRecords([]),
    annotationSummaries: [],
    groupSessionAttendance: noSessions,
    certification: { outcome: 'not-yet-assessed', certificateGenerated: false },
  }
}
