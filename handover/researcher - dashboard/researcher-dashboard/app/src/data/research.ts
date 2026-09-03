import { PATHWAY_MODULES_V2 } from './trainingPathwayV2'

/**
 * THE COACH DOMAIN — types, reference tables and the seeded roster for
 * everything on the COACH certification pathway: a trainee's identity, their
 * progress through the 8 study phases, their module learning records, their
 * reflective annotation summaries, and their certification outcome.
 *
 * Its counterpart is `spaces.ts`, which covers what happens *after*
 * certification: consumers, dyads, and SPACES delivery. The join between them
 * is `Coach.id` — `SpacesCoach.coachId` and `ConsumerDyad.coachId` both point
 * here. Nothing in this file knows about consumers.
 *
 * SEED vs LIVE. Every array exported here is an *initial value*. `research-
 * store.tsx` copies them into React state at boot, and pages read the store
 * copy. Never import `coaches` into a page — you will get the pristine seed,
 * not the user's session.
 *
 * TWO THINGS A NEWCOMER GETS WRONG:
 *
 * 1. `status` and `inviteStatus` are different axes and a coach can disagree
 *    with themselves across them. `status` is the study lifecycle
 *    (enrolled/active/withdrawn/completed); `inviteStatus` is whether they
 *    have ever accepted the platform invite and signed in. Every roster
 *    "Status" column renders `inviteStatus`. Counting one while displaying the
 *    other has produced a KPI tile contradicting the table beneath it more
 *    than once — count the field the column shows.
 *
 * 2. `currentPhase` is read-only. There is no write path for it anywhere. The
 *    researcher's stage ticks go into the store's separate `phaseCompletion`
 *    map, which is seeded *from* `currentPhase` at boot and then diverges. Two
 *    representations of one fact; a backend should keep only one, and the
 *    per-stage completion table is the better candidate.
 *
 * ALSO ABSENT (modelled, never written): all learning progress
 * (`moduleRecords`), `groupSessionAttendance`, `annotationSummaries`,
 * `lastActive`, and `certification.certificateGenerated`/`certificateDate`.
 * These are read-only forever in this build.
 *
 * The people, organisations and written responses below are fabricated. They
 * are domain-realistic on purpose — the responses are the kind of thing a real
 * aged care worker would write — but no participant, employer or facilitator
 * named here is real.
 */

// ---------------------------------------------------------------------------
// Lifecycle enums
//
// Two independent axes. See the file header — mixing them up is this domain's
// most repeated mistake.
// ---------------------------------------------------------------------------

/** Where the coach sits in the *study*: newly enrolled, participating,
 *  withdrawn by the coordinator, or finished the pathway. Nothing about
 *  platform access. */
export type CoachStatus = 'enrolled' | 'active' | 'withdrawn' | 'completed'

/**
 * Whether the trainee has accepted their platform invite and signed in.
 *
 * This is what every roster "Status" column and its matching KPI tile
 * displays. A trainee created by the "Add coach trainee" wizard starts
 * `pending`, and most of their profile is deliberately inert until they accept
 * — no learning progress, no stage management, a persistent banner.
 *
 * `pending` is currently a terminal state: nothing in this build can flip it
 * to `active`, because no invitation is actually sent. A real implementation
 * needs an accept-invite endpoint that sets this and stamps `lastActive`.
 */
export type InviteStatus = 'pending' | 'active'

export const inviteStatusLabels: Record<InviteStatus, string> = {
  pending: 'Invite pending',
  active: 'Active',
}

/** The Placement 2 result. Certification is awarded on `pass` — that is the
 *  only thing that makes a coach eligible for SPACES delivery. */
export type CertificationOutcome =
  | 'not-yet-assessed'
  | 'pass'
  | 'remediation-required'

/**
 * One of the 8 phases of the COACH study lifecycle. `STUDY_PHASES` below is
 * the whole table; `Coach.currentPhase` is an index into it by `number`.
 *
 * Only 5 of the 8 map to a lettered COACH certification stage (C/O/A/CP/H).
 * The other 3 — Recruitment, Enrolment, Entry into SPACES delivery — bracket
 * the pathway rather than forming part of it, which is why they carry no
 * `stageCode` and are excluded from the Stage Management pipeline.
 */
export interface StudyPhase {
  number: number
  /** The study protocol's own full name for the phase. */
  name: string
  /** COACH certification-stage code (C/O/A/CP/H), for the 5 phases that have
   *  one. Undefined marks a phase outside the COACH stage sequence. */
  stageCode?: string
  /** Short display word paired with `stageCode`. Full phase names are too long
   *  for a roster cell, which is why this exists separately from `name`. */
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

/**
 * THE source of truth for the "Current Stage" string a researcher reads —
 * "Stage C: Learning" for a COACH-mapped phase, "Phase 2: Enrolment and
 * platform access" for one outside the sequence.
 *
 * Do not build this label anywhere else. The separator is a colon, and the
 * word "Phase" must not appear in user-facing copy for any of the 5 lettered
 * stages; both are project-wide terminology rules, and hand-rolling the string
 * is how they get broken.
 */
export function stageLabel(n: number): string {
  const p = STUDY_PHASES.find((p) => p.number === n)
  if (!p) return `Phase ${n}`
  return p.stageCode ? `Stage ${p.stageCode}: ${p.shortLabel}` : `Phase ${p.number}: ${p.name}`
}

// ---------------------------------------------------------------------------
// MODULE ASSESSMENT CONTENT (Phase 3 / Stage C — Content learning)
//
// The questions themselves. A trainee's *answers* live on their own
// `ModuleRecord` (`scenarioResponse`, `knowledgeCheckAnswers`), joined here by
// module id.
// ---------------------------------------------------------------------------

/** One multiple-choice knowledge-check question. Same question for every
 *  trainee taking that module. */
export interface KnowledgeCheckQuestion {
  question: string
  options: string[]
  /** Index into `options`. The only definition of a correct answer — module
   *  accuracy on the Learning Progress tab is scored against it. */
  correctIndex: number
}

/** The written scenario task plus the knowledge-check questions for one
 *  training module. Keyed by `TrainingModuleV2.id`. */
export interface ModuleQuestionBank {
  moduleId: string
  scenarioPrompt: string
  knowledgeCheck: KnowledgeCheckQuestion[]
}

/**
 * Assessment content for 8 of the curriculum's 11 modules, keyed by module id.
 *
 * The missing three (`building-blocks-good-sleep`, `retraining-brain-sleep`,
 * `resetting-body-clock`) is a KNOWN CONTENT GAP, not a data error: those
 * modules were added to the curriculum after this bank was written and have no
 * questions yet. Consumers of this data must handle a `undefined` bank —
 * accuracy for such a module scores as null, never as zero, or a trainee looks
 * like they failed something that was never asked.
 *
 * Ids here must match `PATHWAY_MODULES_V2` exactly. Several module ids no
 * longer describe their own titles (see that file's header), so a bank about
 * carer/PLE pair dynamics is attached to `siptea-framework-v2`, now titled
 * "Onboarding and getting set up". Reading the title and assuming the content
 * is misfiled would be a mistake — the id is the join key.
 *
 * `knowledgeCheckAnswers` on a `ModuleRecord` joins to `knowledgeCheck`
 * POSITIONALLY: answer[i] answers question[i]. Changing the order or count of
 * questions in a bank silently re-scores every existing answer set.
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

/** The only lookup into `moduleQuestionBank`. Returns `undefined` for the 3
 *  modules with no content yet — handle that case, don't assume a bank. */
export function getQuestionBank(moduleId: string): ModuleQuestionBank | undefined {
  return moduleQuestionBank.find((b) => b.moduleId === moduleId)
}

// ---------------------------------------------------------------------------
// PER-COACH LEARNING AND REFLECTION RECORDS
//
// All stored, none writable in this build — the coach's own training portal
// owns every write path and is not part of this package.
// ---------------------------------------------------------------------------

export type ModuleRecordStatus = 'not-started' | 'in-progress' | 'completed'

/** A coach's answer to one knowledge-check question. Joined to the question
 *  bank by array position, not by id — see `moduleQuestionBank`. */
export interface KnowledgeCheckAnswer {
  /** Index into that question's `options`. Correct iff it equals `correctIndex`. */
  selectedIndex: number
}

/**
 * One coach's record against one training module. Exactly one record per
 * module in `PATHWAY_MODULES_V2`, always — the seed helpers pad the list so a
 * trainee never has a missing record, and consumers can rely on
 * `moduleRecords.length === PATHWAY_MODULES_V2.length`.
 *
 * The optional fields are not independent of `status`:
 *   completed   -> `completedDate` set, `slidesCompleted` MUST be absent
 *   in-progress -> `slidesCompleted` set, no `completedDate`
 *   not-started -> none of them, and no answers
 * A completed record carrying a partial slide count reads as a module that is
 * both finished and part-done on the same screen.
 */
export interface ModuleRecord {
  /** FK to `TrainingModuleV2.id`. */
  moduleId: string
  status: ModuleRecordStatus
  /** ISO date. Present when and only when completed; always <= TODAY. */
  completedDate?: string
  /** The coach's written answer to the module's `scenarioPrompt`. */
  scenarioResponse?: string
  /** One entry per question in the module's bank, in the same order. */
  knowledgeCheckAnswers?: KnowledgeCheckAnswer[]
  /** The coach's own rating of the module, 0-5. Independent of
   *  `feedbackComment` — either can appear without the other, and both are
   *  absent when the coach simply didn't leave feedback. Never fabricate one:
   *  absent means "not given", not "zero". */
  feedbackRating?: number
  feedbackComment?: string
  /** Slides finished within an IN-PROGRESS module only. Drives the partial
   *  completion figure on Learning Progress. Meaningless for the other two
   *  statuses and deliberately stripped when a record is promoted to
   *  completed. */
  slidesCompleted?: number
}

/**
 * The coach's reflective annotation summary at one COACH timepoint.
 *
 * The study defines four timepoints; this type covers the first three, which
 * happen during training. The fourth (post-practice, written after a coach's
 * first real consumer session) is a structurally different record living in
 * `spaces.ts` as `AnnotationSummaryEntry` — per-consumer, and broken out into
 * one answer per SIPTEA component instead of a single free-text summary. The
 * two types do not reference each other, and a backend consolidating them
 * should expect to reconcile a free-text field with a structured one.
 *
 * Sharing is the coach's decision, per timepoint. `summary` is present only
 * when `shared` is true — an unshared reflection genuinely has no readable
 * content on the researcher's side, which is the access rule, not a data gap.
 * The endline summary is the one the expert assessor sees for certification.
 *
 * Which timepoints exist is determined by how far the trainee has got:
 * Stage C -> none, Stage O -> baseline (then midline), Stage H onward -> all
 * three. Dates must be non-decreasing across baseline -> midline -> endline.
 */
export interface AnnotationSummary {
  timepoint: 'baseline' | 'midline' | 'endline'
  /** ISO date the coach approved the AI-generated summary for storage. */
  approvedDate: string
  /** Whether the coach released this summary to the research team. */
  shared: boolean
  /** Present only when `shared`. */
  summary?: string
}

/**
 * METADATA about a recorded session held for a coach during the COACH phases.
 * There is no media anywhere in this data model — no file, no URL, no storage.
 * Session recordings are a stated research-data requirement of the study, so
 * the shape is here, but the artifact is not.
 *
 * Unlike everything else on a `Coach`, these are never seeded: they are
 * derived on demand by `sessionRecordingsFor()` at the bottom of this file.
 * Access per the study's rules: research team and expert assessor only, never
 * the coach.
 *
 * Not the same thing as `spaces.ts`'s `SpacesSessionRecording`, which is a
 * *stored* record of a delivery session with a consumer.
 */
export interface SessionRecording {
  id: string
  /** COACH phase this recording belongs to (4 group practice, 5 Placement 1,
   *  7 Placement 2). */
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

/** Whether a coach turned up to one scheduled Stage O group practice session.
 *  FK to `GroupSession.id`. Read-only — attendance is recorded outside this
 *  platform — and load-bearing: the last attended session's date is what dates
 *  Stage O on the trainee's pathway timeline. */
export interface GroupSessionAttendance {
  sessionId: string
  attended: boolean
}

/**
 * The coach's Placement 2 assessment result — the record that decides
 * certification, and the only thing that makes a coach eligible for SPACES.
 *
 * `outcome !== 'not-yet-assessed'` implies `assessedDate` is set, and that
 * date must not be in the future: a coach cannot be certified, onboarded and
 * delivering sessions before their own assessment. The seed roster below
 * violates this for one coach — see Helen Zhang.
 *
 * `certificateGenerated` / `certificateDate` are MODELLED BUT NEVER WRITTEN.
 * Nothing reads or sets them; the "Download" control on a coach profile is
 * inert because no certificate artifact exists anywhere in this data model.
 * They are kept because certificate generation is a real study requirement and
 * these are the intended hooks — read them as a specification, not as a live
 * workflow flag. `certificateGenerated` is `false` on every record.
 */
export interface CertificationRecord {
  outcome: CertificationOutcome
  /** ISO date of the Placement 2 assessment. Present iff assessed. */
  assessedDate?: string
  /** Never set in this build. See above. */
  certificateGenerated: boolean
  /** Never set in this build. See above. */
  certificateDate?: string
  /** Short note shown alongside a remediation outcome. */
  note?: string
}

/** Per-account notification channel preferences.
 *
 *  NOTE: `spaces.ts` declares a structurally identical `NotificationPreferences`
 *  for consumer dyads. Structural typing means the duplication never errors, so
 *  it stays invisible until someone changes one copy. Collapse to a single
 *  definition before generating a schema from these types. */
export interface NotificationPreferences {
  email: boolean
  sms: boolean
}

/**
 * SCHEDULING, and why there are two shapes.
 *
 * A trainee's *individual* booking — Placement 1, Placement 2, or (for an
 * already-certified coach) a supervision check-in. One trainee, one session,
 * stored on `Coach.upcomingSession`.
 *
 * Stage O is different: guided group practice is scheduled per COHORT, one
 * meeting many trainees attend, so it cannot live on a coach record without
 * being duplicated N times. It lives in the module-level
 * `upcomingGroupSessions` instead, as a `CohortUpcomingSession`. Anything that
 * asks "what is booked for this trainee" has to consult both — which is what
 * `stageZoomSession()` below exists to do.
 *
 * `withWhom` names the other party, since a trainee session has no dyad title
 * to display: an observer at Placement 1, the expert assessor at Placement 2.
 *
 * The Zoom credentials are FABRICATED but render as real, clickable
 * `https://zoom.us/j/...` links. Clicking one reaches a stranger's meeting or
 * a 404 — they are not inert placeholders. Replacing them with a real Zoom
 * Meetings API call is the integration boundary.
 */
export interface TraineeUpcomingSession {
  /** COACH stage this booking belongs to — 5 (Placement 1) or 7 (Placement 2).
   *  A certified coach's supervision check-in carries none. This is how the
   *  trainee Overview knows which stage is booked and which is not, so do not
   *  infer the stage from the title. */
  phase?: number
  title: string
  /** ISO date. The one field on a coach record allowed to be in the future. */
  date: string
  /** "HH:MM" */
  time: string
  withWhom: string
  meetingId: string
  zoomLink: string
}

/** One Stage O group practice booking, shared by every trainee in `cohort`.
 *  Rendered as a single row listing all attendees, never one row per trainee.
 *  Joined to a coach by (`cohort` matches) AND (that coach is actually at
 *  Stage O) — see `stageZoomSession`. */
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
 * THE source of truth for "does this trainee have a session booked, and for
 * which stage" — merging the cohort-wide Stage O list with the trainee's own
 * individual booking into one answer.
 *
 * Only three of the five COACH stages involve a scheduled session at all:
 * Stage O (group practice), Stage A (Placement 1) and Stage H (Placement 2).
 * Stage C is self-paced and Stage CP has none, so they simply produce no rows.
 *
 * Reads exactly the two fields the home page's schedule reads, so the trainee
 * record and the researcher's schedule cannot disagree about what is booked.
 * Do not re-derive this inline.
 */
export function stageZoomSession(
  coach: Coach,
): (TraineeUpcomingSession & { phase: number })[] {
  const sessions: (TraineeUpcomingSession & { phase: number })[] = []

  // DO NOT REMOVE the `currentPhase !== 4` guard. A cohort's group practice
  // belongs to the cohort at the moment it is at Stage O, not to every member
  // of that cohort forever. Without it, a Stage C trainee's sessions table
  // shows a group practice booked for them directly under a pathway timeline
  // saying Stage O has not started — two contradictory claims on one screen.
  // The home page applies the identical rule when building the attendee list.
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

/**
 * THE CENTRAL RECORD of this domain: one aged care worker on the COACH
 * pathway. The same record serves a trainee mid-training and a certified coach
 * delivering SPACES — certification changes fields, not the type.
 *
 * `id` is the join key for `spaces.ts`'s `SpacesCoach.coachId` and
 * `ConsumerDyad.coachId`. `participantId` is the study's own human-readable
 * identifier (`C2S-C-NNN`, unique, minted by `nextParticipantId`).
 *
 * Everything here is stored. Only a handful of fields have any write path in
 * this build — contact details, notification preferences, withdrawal, and the
 * certification outcome. Learning progress, attendance, annotations,
 * `lastActive` and `currentPhase` are all read-only; see the file header.
 *
 * Every date except `upcomingSession.date` must be <= `TODAY`.
 */
export interface Coach {
  id: string
  /** Study participant ID, `C2S-C-NNN`. Unique across the roster. */
  participantId: string
  fullName: string
  /** Derived from `fullName` once, at creation, then stored. */
  initials: string
  email: string
  phone: string
  /** Aged care partner organisation employing this coach. */
  employer: string
  roleAtEmployer: string
  yearsInAgedCare: number
  /** Training cohort. Not an entity — a plain string, matched by equality
   *  against `CohortUpcomingSession.cohort`. No longer surfaced in the UI, but
   *  still the join for cohort-wide group practice scheduling. */
  cohort: string
  /** ISO date the trainee completed Phase 2 (Enrolment and platform access). */
  enrolmentDate: string
  /** Study lifecycle. NOT what roster Status columns display — see `InviteStatus`. */
  status: CoachStatus
  /** Platform-invite acceptance. This IS what roster Status columns display. */
  inviteStatus: InviteStatus
  /** Current COACH lifecycle phase, 1-8, indexing `STUDY_PHASES`.
   *  Read-only — no action writes it. The researcher's stage ticks go to the
   *  store's `phaseCompletion` map, seeded from this and then free to diverge. */
  currentPhase: number
  /** Set by `withdrawCoach`. Withdrawal is soft: the record stays, per consent. */
  withdrawalNote?: string
  /** ISO date of the trainee's last platform activity. ABSENT MEANS NEVER
   *  SIGNED IN and renders as "Never" — which is the only correct state for an
   *  unaccepted invite. Do not backfill it with a fabricated date. */
  lastActive?: string
  /** Exactly one record per module in `PATHWAY_MODULES_V2`. */
  moduleRecords: ModuleRecord[]
  /** Assessor's notes on the demonstration-video analysis task. Populated on
   *  most trainees and rendered nowhere in this package. */
  demoVideoNotes?: string
  /** Zero to three entries (baseline / midline / endline), gated by how far
   *  the trainee has progressed. See `AnnotationSummary`. */
  annotationSummaries: AnnotationSummary[]
  groupSessionAttendance: GroupSessionAttendance[]
  certification: CertificationRecord
  /** Optional; render-time defaults apply when absent. */
  notificationPreferences?: NotificationPreferences
  /** The trainee's own individual booking (Placement 1 / Placement 2), or a
   *  certified coach's supervision check-in. Stage O bookings are cohort-wide
   *  and live in `upcomingGroupSessions` instead. */
  upcomingSession?: TraineeUpcomingSession
}

/** A Stage O (Guided group practice) session that has already been held.
 *  `groupSessions` is the fixed schedule; `GroupSessionAttendance` on each
 *  coach records who was there. Facilitator notes are the researcher's record
 *  of how the group went, not per-trainee feedback. */
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

// ---------------------------------------------------------------------------
// SEED BUILDERS
//
// Not part of the domain model — these exist so the fixture roster below can be
// written without hand-maintaining 11 module records per coach. `fillRecords`
// and `fillRecordsComplete` in particular are what make two COACH-pathway
// invariants structural rather than something a future edit can quietly break.
// ---------------------------------------------------------------------------

/** Both knowledge-check answers correct. Every bank's `correctIndex` is 1,
 *  which is what makes a shared constant possible. */
const CORRECT: KnowledgeCheckAnswer[] = [{ selectedIndex: 1 }, { selectedIndex: 1 }]
/** One wrong answer on the first question — gives the accuracy figures on the
 *  Learning Progress tab something other than 100% to show. */
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

/**
 * Builds a FULL module record set in which every module is completed, taking
 * the explicitly-written entries verbatim and closing out everything else.
 *
 * ENFORCES A REAL INVARIANT, do not bypass it: a trainee only reaches Stage O
 * (Guided group practice, phase 4) after finishing Content learning, so any
 * coach at `currentPhase >= 4` must have all 11 modules completed. Use this —
 * not a hand-written list of `done()` calls — for every such coach, so the
 * invariant survives modules being added to the curriculum.
 *
 * It promotes explicit non-completed entries as well as filling absent ones.
 * That matters: an earlier version only filled absences, so an explicit
 * `inProgress(...)` slipped through and produced a Stage O trainee with
 * unfinished Content learning.
 *
 * Deliberately separate from `fillRecords` rather than a flag on it. The two
 * state opposite things about where a trainee is, and a boolean at the call
 * site would read as an implementation detail instead of a claim about the
 * pathway.
 */
function fillRecordsComplete(explicit: ModuleRecord[], completedDate: string): ModuleRecord[] {
  const byId = new Map(explicit.map((r) => [r.moduleId, r]))
  return PATHWAY_MODULES_V2.map((m) => {
    const own = byId.get(m.id)
    // Absent -> synthesise. Already completed -> keep verbatim, so the coach's
    // real written response and its real date survive.
    if (own === undefined) return done(m.id, completedDate, GENERIC_MODULE_RESPONSES[m.id] ?? '')
    if (own.status === 'completed') return own
    // Present but unfinished -> promote, preserving any response or answers
    // already recorded.
    return {
      ...own,
      status: 'completed' as const,
      completedDate: own.completedDate ?? completedDate,
      scenarioResponse: own.scenarioResponse ?? GENERIC_MODULE_RESPONSES[m.id] ?? '',
      knowledgeCheckAnswers: own.knowledgeCheckAnswers ?? CORRECT,
      // Required by `ModuleRecord`'s own rule: a completed record must never
      // carry a partial slide count, or it renders as finished and part-done
      // at the same time.
      slidesCompleted: undefined,
    }
  })
}

/** Builds a full module record set for a trainee still IN Content learning:
 *  explicit entries as written, everything else not-started. Guarantees one
 *  record per module, which every consumer of `moduleRecords` relies on. */
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
// ALREADY-CERTIFIED COACHES
//
// Coaches who finished the pathway before this dataset's current cohort. They
// are the pool Coach Management draws SPACES-eligible candidates from, so what
// matters about them is identity and certification, not training detail —
// their module responses are deliberately generic. Declared above `coaches`
// only so the roster can spread them in.
// ---------------------------------------------------------------------------

/** Fallback scenario responses, by module id, for coaches whose individual
 *  training detail is not the point. One entry per module in
 *  `PATHWAY_MODULES_V2` — a missing key yields an empty response, which reads
 *  as an unanswered task. */
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
  // These three modules have no entry in `moduleQuestionBank`, so their
  // scenario responses here answer no visible prompt. That is expected —
  // see the content gap noted on `moduleQuestionBank`.
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

/** Certified coaches, spread into `coaches` below. Both have
 *  `certification.outcome === 'pass'`, which is what makes them eligible for
 *  SPACES; only Fatima has a `SpacesCoach` row, so Mei-Ling is the one
 *  candidate Coach Management's "Waiting to be onboarded" tab has to offer. */
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
    // A certified coach's `upcomingSession` is a SUPERVISION check-in, not a
    // COACH-pathway placement — which is why it carries no `phase`. Same shape,
    // different meaning; anything reading `phase` must handle its absence.
    upcomingSession: {
      title: 'Supervision check-in',
      date: '2026-07-23',
      time: '15:30',
      withWhom: 'Claire Donnelly (Supervisor)',
      meetingId: '771 4409 2286',
      zoomLink: 'https://zoom.us/j/7714409286',
    },
  },
  // KEEP Mei-Ling certified but NOT in `spacesCoaches`. She is the only
  // candidate Coach Management's "Waiting to be onboarded" tab and its Onboard
  // flow have to work with; onboarding her (or adding a `SpacesCoach` row by
  // hand) empties that tab and leaves the flow with nothing to demonstrate.
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
// THE COACH ROSTER — the seed value for the store's `coaches` slice.
//
// Read this from the store, never by importing it. This array is the pristine
// fixture; the store copy is the one the user's session mutates.
//
// Each record is deliberately positioned to demonstrate one state the UI has
// to handle. Reading down: a certified coach delivering SPACES, a trainee whose
// invite was never accepted, a trainee mid-Content-learning, three at Stage O
// (three so a cohort group session has enough attendees to exercise the
// schedule's "+N" truncation), one awaiting final assessment, then the
// already-certified pool. Deleting one removes a case from the demo.
//
// INVARIANTS these fixtures are meant to satisfy — assert them if you write
// tests, and check them before adding a coach:
//   1. inviteStatus 'pending'  => every module not-started, and no `lastActive`.
//      A trainee who never signed in cannot have progress.
//   2. currentPhase >= 4       => every module completed (enforced structurally
//      by `fillRecordsComplete`).
//   3. currentPhase < 4        => no attended group sessions.
//   4. annotationSummaries match the stage: Stage C none; Stage O baseline
//      (then midline); Stage H onward all three. Dates non-decreasing.
//   5. outcome !== 'not-yet-assessed' => `assessedDate` present and <= TODAY.
//   6. outcome === 'pass'      => currentPhase 8 and status 'completed'.
//   7. every date <= TODAY, except `upcomingSession.date`.
//   8. `participantId` unique and matching /^C2S-C-\d{3}$/.
//
// KNOWN VIOLATION, do not treat as intentional: Helen Zhang's assessment and
// endline reflection are dated after TODAY while she is already certified,
// onboarded and delivering — see her record. It also silently suppresses her
// from the "Certified this period" KPI, which computes a negative day count.
// ---------------------------------------------------------------------------

export const coaches: Coach[] = [
  // The fully-certified, actively-delivering coach. She is the only coach in
  // the fixtures carrying a real consumer caseload (3 dyads in `spaces.ts`), so
  // her identity is referenced widely — do not regress her to an earlier stage.
  //
  // ⚠️ DATA DEFECT: `certification.assessedDate` and the endline
  // `approvedDate` are both 2026-07-30, eight days AFTER TODAY, while her
  // SPACES `joinedDate` is 2026-07-22 and her delivered sessions start in
  // June. Certification is awarded on passing Placement 2, so she is recorded
  // as delivering a month before being assessed. Backdate both to before her
  // SPACES onboarding when re-dating the fixtures.
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
      certificateGenerated: false,
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
    // The unaccepted-invite case. `inviteStatus: 'pending'` means she has never
    // signed in, so she MUST have zero module progress and no `lastActive` —
    // invariant 1. The roster shows "Modules completed" beside her "Invite
    // pending" chip, so any progress here contradicts itself on screen.
    moduleRecords: fillRecords([]),
    // Stage C: no reflection timepoint is reached until Content learning is
    // finished and group practice begins. Invariant 4.
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
    // Stage C: still in Content learning, so no reflection timepoint reached.
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
    // At Stage O, so invariant 2 applies: every module must be completed.
    // `fillRecordsComplete` closes out whatever is not written explicitly
    // below, on the date passed at the end of the array — keep it that way
    // rather than hand-adding `done()` entries, so adding a module to the
    // curriculum cannot silently put her back into an impossible state.
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
    // No `upcomingSession` on purpose: a Stage O trainee's booking is
    // cohort-wide and lives in `upcomingGroupSessions`, not here.
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
    // Second of three Stage O trainees in this cohort. All three exist so the
    // cohort group session has enough attendees to exercise the schedule's
    // multi-attendee row and its "+N" truncation.
    moduleRecords: fillRecords(
      // Spreads completion dates over May and June. `i % 6` resets the
      // day-of-month per half; the un-reset form (`10 + i * 3`) overflows into
      // an invalid day in a 30-day month.
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
    // Third Stage O trainee — the one that takes the cohort group session to
    // three attendees. Removing him drops the schedule back to a case the
    // truncation never triggers on.
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
    // The "finished everything, awaiting final assessment" case — Stage H with
    // `outcome: 'not-yet-assessed'` and a booked Placement 2 session below.
    // This is the record the certification write path acts on.
    moduleRecords: fillRecords(
      PATHWAY_MODULES_V2.map((m, i) =>
        done(
          m.id,
          // `i % 6` resets the day-of-month per half. Do not simplify to
          // `10 + i * 3` — that overflows into an invalid day in a 30-day month.
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
// DERIVED VALUES
// ---------------------------------------------------------------------------

/** `dateStr` minus `days`, as a `YYYY-MM-DD` string. */
function daysBefore(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Keeps a derived recording date behind the coach's own certification.
 *
 *  An already-certified coach finished the pathway before the current cohort's
 *  sessions happened, so using the live cohort date would produce a group
 *  practice recording dated AFTER that coach's own Placement 2 — impossible,
 *  and it sorts to the top of their recordings list. This substitutes a
 *  historical offset only when the live date would actually be impossible;
 *  coaches still mid-pathway keep their real dates untouched. */
function historicalOr(liveDate: string, assessed: string | undefined, offsetDays: number): string {
  return assessed && liveDate > assessed ? daysBefore(assessed, offsetDays) : liveDate
}

/**
 * Every session recording a coach should have across the COACH stages,
 * DERIVED — never seeded. It reads records that already exist (group session
 * attendance, phase progress, the certification date) and invents nothing.
 *
 * ⚠️ NO CALLER IN THIS PACKAGE. Its consumer, the trainee record page's
 * Session Recordings tab, was not shipped in this handover. It is kept
 * deliberately: session recordings are a stated research-data requirement, and
 * this is a complete derivation including the `historicalOr()` date guard,
 * which is the non-obvious part. Restore the feature by calling this, not by
 * rebuilding it.
 *
 * Do not read the existence of this function as the existence of the feature.
 * There is no storage, upload or playback path anywhere, and no recording
 * artifact in the data model — only metadata.
 */
export function sessionRecordingsFor(coach: Coach): SessionRecording[] {
  const recs: SessionRecording[] = []
  const assessed = coach.certification.assessedDate

  // Stage O — one recording per group session actually attended. The
  // `currentPhase >= 4` gate is not redundant with the attendance check: seed
  // attendance data can exist on a coach who has not reached Stage O, and
  // without the gate their recordings would appear before the stage did.
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

  // Stage A (Placement 1) — sessions with a simulated consumer.
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

  // Stage H (Placement 2) — the assessed session, watched live by the expert
  // assessor. Dated by the assessment itself wherever one has been recorded.
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

/**
 * THE SIGNED-IN USER — a hardcoded object, because there is no authentication
 * anywhere in this package. Every "you"/"your" surface (the home greeting, My
 * Profile, notes attributed to "Researcher") resolves to this literal.
 *
 * This is the identity boundary. Note in particular that `addResearchNote` and
 * `addSupervisionNote` record NO author id — a real study audit trail needs
 * one, and the field does not exist yet on either note type.
 *
 * Seeds the store's editable `researcherProfile`; read that, not this.
 */
export const researcher = {
  fullName: 'Claire Donnelly',
  initials: 'CD',
  role: 'Research coordinator',
  organisation: 'Monash University',
  email: 'c.donnelly@monash.example.edu',
  phone: '0400 221 987',
  notificationPreferences: { email: true, sms: false } as NotificationPreferences,
}

/** Display labels for the three enums. All consumed by `StatusChip.tsx`; a
 *  screen should never hand-write these strings. Note `statusLabels` and
 *  `inviteStatusLabels` both contain "Active" for different reasons — see the
 *  two-axes warning in the file header. */
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
 * THE source of truth for the `C2S-C-NNN` participant ID format — next in
 * sequence after the roster's highest existing number.
 *
 * Deliberately shared between the wizard's live preview and the store's
 * `addCoachTrainee`, so the ID a researcher is shown before submitting is the
 * ID they actually get. Two implementations of this formula would drift the
 * moment either changed.
 */
export function nextParticipantId(coaches: Coach[]): string {
  const maxId = Math.max(
    ...coaches.map((c) => Number(c.participantId.replace('C2S-C-', '')) || 0),
  )
  return `C2S-C-${String(maxId + 1).padStart(3, '0')}`
}

/**
 * The payload the "Add coach trainee" wizard collects — the ONLY complete
 * write path in this package that creates a record.
 *
 * A trainee is onboarded straight in at Phase 2 (Enrolment and platform
 * access). Phase 1 (Recruitment) is assumed to have happened outside this
 * platform, so there is no expression-of-interest or approval step to model.
 *
 * The employer fields are set at recruitment and are not editable afterward on
 * the profile — they carry through unchanged when the trainee becomes a coach.
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

/**
 * The only constructor for a `Coach`. Derives `initials` from the name, then
 * forces the starting state every new trainee must have: enrolled, invite
 * pending, Phase 2, no learning progress, no attendance, no reflections, not
 * yet assessed. Deliberately no `lastActive` — see that field.
 *
 * Every one of those zeroes is an invariant, not a placeholder. A newly-created
 * trainee that carries progress contradicts their own pending invite.
 */
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
    // The wizard IS the invite step, not an already-accepted enrolment. Note
    // no invitation is actually sent and nothing can clear this — see
    // `InviteStatus`.
    inviteStatus: 'pending',
    currentPhase: 2,
    moduleRecords: fillRecords([]),
    annotationSummaries: [],
    groupSessionAttendance: noSessions,
    certification: { outcome: 'not-yet-assessed', certificateGenerated: false },
  }
}
