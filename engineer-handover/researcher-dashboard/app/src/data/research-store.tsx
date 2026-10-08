import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  coachFromTraineeInput,
  coaches as initialCoaches,
  groupSessions,
  nextParticipantId,
  researcher as initialResearcher,
  type Coach,
  type CoachTraineeInput,
  type NotificationPreferences,
  type SessionRecording,
} from './research'
import {
  CONSUMER_MODULES,
  consumerDyads as initialDyads,
  emptySessionPlan,
  researchNotes as initialResearchNotes,
  spacesCoaches as initialSpacesCoaches,
  supervisionNotes as initialSupervisionNotes,
  type ConsumerDyad,
  type PersonProfile,
  type ResearchNote,
  type SessionCompletionRecord,
  type SessionPlan,
  type SessionPlanRow,
  type SpacesCoach,
  type SupervisionNote,
} from './spaces'
import { TODAY, formatDate } from './format'
import { ResearchContext } from './research-context'

/**
 * THE APPLICATION STATE. One React context holding every mutable thing in the
 * Research Dashboard, plus every action that changes it. There is no backend,
 * no network call and no persistence — reloading the page restores the seed
 * fixtures exactly.
 *
 * This file exports ONLY the `ResearchProvider` component. `TODAY`/`formatDate`
 * live in `./format` and `useResearch` lives in `./research-context` for a
 * reason that is not stylistic: Vite's React Fast Refresh cannot hot-update a
 * module mixing component and non-component exports, so any edit cascading into
 * this heavily-imported file would remount the provider and silently wipe the
 * user's session back to seed data with no visible reload. Do not add a second
 * export here.
 *
 * THE SEED/STORE BOUNDARY. Fixtures in `research.ts` and `spaces.ts` are
 * initial values; this provider copies them into state at boot and pages read
 * the copies. Three slices exist because a module-level array must not be
 * mutated, so each holds live state alongside a seed field that describes the
 * same thing:
 *
 *   `sessionCompletion` <- `ConsumerDyad.sessionsCompleted`
 *   `sessionPlans`      <- `ConsumerDyad.sessionPlan`
 *      Both seed fields go STALE the moment anything is edited. Nothing reads
 *      them today, and it must stay that way.
 *
 *   `phaseCompletion`   <- `Coach.currentPhase`
 *      Different and messier: `currentPhase` is still read live for stage
 *      labels and gating, while `phaseCompletion` carries the per-stage ticks.
 *      `togglePhase` never writes back, so the two CAN disagree — a coach can
 *      have Stage H ticked while `currentPhase` still says Stage O.
 *
 * For a real backend these should be first-class tables, with the duplicated
 * fields on `Coach`/`ConsumerDyad` dropped or made strictly derived views.
 * Keeping both is the two-fields-one-fact pattern this codebase has repeatedly
 * been bitten by.
 *
 * NOTHING IS EVER DELETED. Withdrawal, opt-out and transfer are all soft. There
 * is no un-invite, no un-enrol, no delete-dyad, no delete-note, no un-unlock.
 *
 * EVERY WRITE IS STAMPED FROM `TODAY`, the frozen clock — except
 * `toggleSession`'s `completedTime`, which reads the real machine clock. See
 * `format.ts`.
 *
 * IDS ARE MINTED FROM `Date.now()` and can collide within a millisecond. Fine
 * for a prototype, not a pattern to carry forward — let a server assign ids.
 */

/**
 * RETAINED BUT UNWIRED. A third of this API has no reachable caller. That is
 * known and deliberate, not an oversight, and it matters when reading the store
 * as a specification: the presence of an action does NOT mean the feature
 * exists.
 *
 * Never called by anything:
 *   `enrollConsumer`, `addConsumer`  the consumer enrolment wizard. Consumer
 *                                    Management now offers an inert "Sync with
 *                                    REDCap" control instead, which means THERE
 *                                    IS NO WORKING WAY TO ADD A CONSUMER in
 *                                    this build. `enrollConsumer` is the
 *                                    intended target for a REDCap importer to
 *                                    call, once per synced record.
 *   `updateDyadOverview`             editable sleep-goals / caregiving /
 *                                    intake-notes fields on a consumer record.
 *   `updateSessionPlanRow`           per-row plan edits.
 *   `addConsentDocument`,
 *   `removeConsentDocument`          consent forms are no longer stored on the
 *                                    platform; existing documents are
 *                                    display-only.
 *   `manualRecordings`,
 *   `addManualRecording`             recording upload. Nothing reads the slice
 *                                    either.
 *
 * Called, but only from components that are never mounted:
 *   `bulkSetSessionPlan`,
 *   `toggleSession`                  the session-planning modals. Session
 *                                    planning is the COACH's workflow and that
 *                                    portal is not in this package; a
 *                                    researcher reads a plan read-only and
 *                                    cannot create or amend one. `grep` finds
 *                                    callers for these, which is why they are
 *                                    easy to mistake for live.
 *
 * Deleting any of them is a product call, not cleanup — each encodes a real
 * requirement. Equally, do not wire a new caller without confirming the flow it
 * belongs to is actually coming back.
 */
export interface ResearchStore {
  coaches: Coach[]
  /** Shared search term, used by the trainee roster only. The consumer and
   *  coach rosters keep their own local search state instead. */
  searchQuery: string
  setSearchQuery: (q: string) => void
  /** THE ONLY ACTION THAT CREATES A COACH. Adds a trainee at Phase 2 with a
   *  pending invite, and returns the new id. No invitation is actually sent
   *  and nothing can later mark it accepted — see `InviteStatus`. */
  addCoachTrainee: (input: CoachTraineeInput) => string
  /** Soft withdrawal: sets status and a note. The record is retained per consent. */
  withdrawCoach: (coachId: string) => void
  updateContact: (coachId: string, patch: { email: string; phone: string }) => void
  /** Completed COACH stage numbers per coach id. Seeded from `Coach.currentPhase`
   *  at boot and then free to diverge from it — this map, not `currentPhase`, is
   *  what the Stage Management pipeline reads and writes. */
  phaseCompletion: Record<string, number[]>
  /** Completion date per stage, where one is known or has been stamped. Sparse
   *  by design — some stages have no dated evidence, see `initialPhaseDates`. */
  phaseCompletionDates: Record<string, Record<number, string>>
  /** Tick / untick a stage. Also stamps or clears the matching date. */
  togglePhase: (coachId: string, phase: number) => void
  /** Record the Placement 2 outcome. The expert assessor has no portal access,
   *  so the research coordinator enters the result they were given. This is the
   *  only path from 'not-yet-assessed' to a certification decision. */
  recordCertificationOutcome: (
    coachId: string,
    outcome: 'pass' | 'remediation-required',
  ) => void

  // --- SPACES delivery -----------------------------------------------------
  spacesCoaches: SpacesCoach[]
  consumerDyads: ConsumerDyad[]
  supervisionNotes: SupervisionNote[]
  /** Researcher-authored notes about a dyad. Separate from `supervisionNotes`
   *  because those require a coach and these do not. */
  researchNotes: ResearchNote[]
  /** Onboard a certified coach into SPACES delivery — appends a `SpacesCoach`
   *  row as invited/not-joined. Idempotent by `coachId`. Note the
   *  invitation/joined state it writes is essentially never displayed. */
  inviteCoach: (coachId: string) => void
  /** Edit one dyad member's profile fields. `who: 'patient'` is the PLE. */
  updateDyadPerson: (
    dyadId: string,
    who: 'patient' | 'carer',
    patch: Partial<PersonProfile>,
  ) => void
  /** Update the coordinator-owned intake fields. UNWIRED. */
  updateDyadOverview: (
    dyadId: string,
    patch: Partial<Pick<ConsumerDyad, 'sleepGoals' | 'caregivingContext' | 'notes'>>,
  ) => void
  /** Update the coach's own notes on a dyad. Writes `coachNotes` and never
   *  `notes` — the two are separate fields with separate owners, and conflating
   *  them silently destroys the coordinator's intake notes. */
  updateDyadCoachNotes: (dyadId: string, coachNotes: string) => void
  /** Create a consumer already assigned to a coach. UNWIRED. */
  addConsumer: (
    coachId: string,
    input: {
      patient?: Omit<PersonProfile, 'relationship'>
      carer: PersonProfile
      sleepGoals: string
      caregivingContext: string
    },
  ) => void
  /** Point a dyad at a different coach. Serves both assignment and transfer.
   *  Sets `coachId` ONLY — it does not touch `coachAssignedDate`, so a
   *  transferred dyad keeps the date it was first assigned. */
  transferDyad: (dyadId: string, newCoachId: string) => void
  /** THE live session-completion state, keyed by dyad id. Seeded from
   *  `ConsumerDyad.sessionsCompleted`, which then goes stale. Read this. */
  sessionCompletion: Record<string, SessionCompletionRecord[]>
  /** Tick / untick a session. */
  toggleSession: (dyadId: string, session: number) => void
  /** THE live session plans, keyed by dyad id. Seeded from
   *  `ConsumerDyad.sessionPlan`, which then goes stale. Read this. Every dyad
   *  has an entry from the moment it exists, even if all 7 rows are undated. */
  sessionPlans: Record<string, SessionPlan>
  /** Edit one plan row. Manual and single-row — never shifts later rows.
   *  UNWIRED, and its `rescheduled` handling disagrees with
   *  `bulkSetSessionPlan`'s; see `SessionPlanRow.rescheduled`. */
  updateSessionPlanRow: (dyadId: string, session: number, patch: Partial<SessionPlanRow>) => void
  /** Set all 7 rows at once — how a plan is actually created. */
  bulkSetSessionPlan: (dyadId: string, rows: SessionPlanRow[]) => void
  /** Modules a coach has granted early, per dyad id — for the real case where
   *  a session happened but has not been logged yet. Additive only; there is
   *  no un-unlock. Read-only in this package (see the state declaration). */
  manualModuleUnlocks: Record<string, number[]>
  addSupervisionNote: (
    coachId: string,
    note: {
      title: string
      date: string
      time: string
      notes: string
      attachments: string[]
      dyadId?: string
    },
  ) => void
  /** Add a researcher note to a dyad — no coach required. Records no author. */
  addResearchNote: (
    dyadId: string,
    note: { title: string; date: string; time: string; notes: string; attachments: string[] },
  ) => void
  /** Uploaded recordings per coach id, meant to supplement
   *  `sessionRecordingsFor()`'s derived list. UNWIRED and unread — nothing
   *  writes it and nothing displays it. */
  manualRecordings: Record<string, SessionRecording[]>
  addManualRecording: (coachId: string, recording: SessionRecording) => void
  // --- Consumer enrolment --------------------------------------------------
  /** Enrol a consumer ahead of coach assignment, returning the new dyad's id.
   *  UNWIRED — and this is the gap that matters most, because it leaves no
   *  working way to add a consumer. It is the shape a REDCap importer should
   *  call, once per synced record. */
  enrollConsumer: (input: {
    patient?: Omit<PersonProfile, 'relationship'>
    carer: PersonProfile
    sleepGoals: string
    caregivingContext: string
    notes?: string
    consentDocumentFilenames?: string[]
  }) => string
  /** Record a consent document against a dyad. Filename only — no file is
   *  stored. UNWIRED. */
  addConsentDocument: (dyadId: string, filename: string) => void
  /** UNWIRED. */
  removeConsentDocument: (dyadId: string, documentId: string) => void
  // --- Profiles and preferences --------------------------------------------
  /** The signed-in researcher, editable. Seeded from the hardcoded
   *  `researcher` object — there is no authentication anywhere. */
  researcherProfile: typeof initialResearcher
  updateResearcherContact: (patch: { email: string; phone: string }) => void
  updateResearcherNotificationPreferences: (prefs: NotificationPreferences) => void
  updateCoachNotificationPreferences: (coachId: string, prefs: NotificationPreferences) => void
  updateDyadNotificationPreferences: (dyadId: string, prefs: NotificationPreferences) => void
  /** Consumer-initiated study withdrawal. One-way — there is no un-opt-out. */
  setDyadOptOut: (dyadId: string, reason: string) => void
}

/**
 * THE ZOOM INTEGRATION BOUNDARY. Fabricates a meeting id and link because
 * there is no Zoom API here. Replace this function with a real Meetings API
 * call and the whole app gets real meetings.
 *
 * ⚠️ The links it produces are live `https://zoom.us/j/...` URLs rendered as
 * real anchors. Clicking one reaches a stranger's meeting or a 404 — these are
 * not inert placeholders, and the seeded credentials in `research.ts`/
 * `spaces.ts` behave the same way.
 */
function generateMeetingCreds(): { meetingId: string; zoomLink: string } {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9)
  return {
    meetingId: `${suffix.slice(0, 3)} ${suffix.slice(3, 6)} ${suffix.slice(6)}`,
    zoomLink: `https://zoom.us/j/${suffix}`,
  }
}

/**
 * Projects `Coach.currentPhase` into the completed-stage set the pipeline
 * actually reads: every phase below the current one is done, a `completed`
 * coach also has their current phase done, and any coach with an assessment
 * outcome has Placement 2 done regardless.
 *
 * This runs ONCE, at boot. After that the two representations diverge —
 * `togglePhase` never writes back to `currentPhase`. See the file header.
 */
function initialPhases(c: Coach): number[] {
  const done = new Set<number>()
  for (let p = 1; p < c.currentPhase; p++) done.add(p)
  if (c.status === 'completed') done.add(c.currentPhase)
  if (c.certification.outcome !== 'not-yet-assessed') done.add(7)
  return [...done].sort((a, b) => a - b)
}

/**
 * Best-known completion date per COACH stage, DERIVED from the records that
 * prove each stage happened rather than stored as its own field:
 *
 *   Stage C  <- the last module the trainee finished
 *   Stage O  <- the last group session they actually attended
 *   Stage H  <- the Placement 2 assessment date
 *
 * Stage A and Stage CP have no dated artefact in this data model, so they are
 * DELIBERATELY LEFT UNDATED. The timeline shows them complete with no date
 * rather than inventing one — do not fill the gap with a plausible guess.
 * Every reader must therefore tolerate a missing date.
 */
function initialPhaseDates(c: Coach): Record<number, string> {
  const dates: Record<number, string> = {}

  const moduleDates = c.moduleRecords
    .filter((r) => r.status === 'completed' && r.completedDate)
    .map((r) => r.completedDate as string)
  if (moduleDates.length > 0) dates[3] = moduleDates.sort().at(-1) as string

  const attendedDates = c.groupSessionAttendance
    .filter((a) => a.attended)
    .map((a) => groupSessions.find((g) => g.id === a.sessionId)?.date)
    .filter((d): d is string => !!d)
  if (attendedDates.length > 0) dates[4] = attendedDates.sort().at(-1) as string

  if (c.certification.assessedDate) dates[7] = c.certification.assessedDate

  return dates
}

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [coaches, setCoaches] = useState<Coach[]>(initialCoaches)
  const [searchQuery, setSearchQuery] = useState('')
  const [phaseCompletion, setPhaseCompletion] = useState<
    Record<string, number[]>
  >(() =>
    Object.fromEntries(initialCoaches.map((c) => [c.id, initialPhases(c)])),
  )
  const [phaseCompletionDates, setPhaseCompletionDates] = useState<
    Record<string, Record<number, string>>
  >(() => Object.fromEntries(initialCoaches.map((c) => [c.id, initialPhaseDates(c)])))

  const [spacesCoaches, setSpacesCoaches] = useState<SpacesCoach[]>(initialSpacesCoaches)
  const [consumerDyads, setConsumerDyads] = useState<ConsumerDyad[]>(initialDyads)
  const [supervisionNotes, setSupervisionNotes] = useState<SupervisionNote[]>(
    initialSupervisionNotes,
  )
  const [researchNotes, setResearchNotes] = useState<ResearchNote[]>(initialResearchNotes)
  /** Neither written nor read anywhere. See the unwired list above. */
  const [manualRecordings, setManualRecordings] = useState<Record<string, SessionRecording[]>>({})
  // These two are the shadow slices: each takes a COPY of a seed field at boot,
  // after which the field on the dyad object is stale forever. Every page must
  // read the map, never the dyad field.
  const [sessionCompletion, setSessionCompletion] = useState<Record<string, SessionCompletionRecord[]>>(
    () => Object.fromEntries(initialDyads.map((d) => [d.id, [...d.sessionsCompleted]])),
  )
  const [sessionPlans, setSessionPlans] = useState<Record<string, SessionPlan>>(() =>
    Object.fromEntries(initialDyads.map((d) => [d.id, d.sessionPlan ?? emptySessionPlan()])),
  )
  // Read-only here, and intentionally: granting a module early is the coach's
  // action, and that portal is not in this package. A researcher reads the
  // unlock state but never sets it. Kept as state rather than a constant so
  // restoring a write path is a one-line change.
  const [manualModuleUnlocks] = useState<Record<string, number[]>>({})
  const [researcherProfile, setResearcherProfile] = useState(initialResearcher)

  const patchCoach = useCallback(
    (coachId: string, patch: (c: Coach) => Coach) => {
      setCoaches((prev) => prev.map((c) => (c.id === coachId ? patch(c) : c)))
    },
    [],
  )

  const addCoachTrainee = useCallback(
    (input: CoachTraineeInput): string => {
      // Uses the same `nextParticipantId` the wizard previews, so the id the
      // researcher was shown is the id they get.
      const participantId = nextParticipantId(coaches)
      const id = `coach-${Date.now()}`
      const coach = coachFromTraineeInput(input, id, participantId, TODAY)
      setCoaches((prev) => [...prev, coach])
      // Note `phaseCompletionDates` is not seeded here, unlike `phaseCompletion`.
      // Readers cope (`?? {}` on both sides), but the asymmetry is unintended —
      // do not assume both maps have an entry for every coach id.
      setPhaseCompletion((prev) => ({ ...prev, [coach.id]: initialPhases(coach) }))
      return coach.id
    },
    [coaches],
  )

  const withdrawCoach = useCallback(
    (coachId: string) => {
      patchCoach(coachId, (c) => ({
        ...c,
        status: 'withdrawn',
        withdrawalNote: `Withdrawn by the research coordinator on ${formatDate(TODAY)} (prototype demo action). Records retained per consent.`,
      }))
    },
    [patchCoach],
  )

  const updateContact = useCallback(
    (coachId: string, patch: { email: string; phone: string }) => {
      patchCoach(coachId, (c) => ({ ...c, ...patch }))
    },
    [patchCoach],
  )

  const togglePhase = useCallback((coachId: string, phase: number) => {
    setPhaseCompletion((prev) => {
      const current = prev[coachId] ?? []
      const wasDone = current.includes(phase)
      // Completing a stage stamps today's date; reverting CLEARS it, so a
      // stage that is no longer complete never keeps a completion date behind.
      // Kept inside the updater and read off `prev`, not off the
      // `phaseCompletion` value in scope, so the callback needs no dependency
      // and cannot act on a stale read.
      setPhaseCompletionDates((prevDates) => {
        const next = { ...(prevDates[coachId] ?? {}) }
        if (wasDone) delete next[phase]
        else next[phase] = TODAY
        return { ...prevDates, [coachId]: next }
      })
      const next = wasDone
        ? current.filter((p) => p !== phase)
        : [...current, phase].sort((a, b) => a - b)
      return { ...prev, [coachId]: next }
    })
  }, [])

  /**
   * Records the Placement 2 (SIPTEA competency checklist) outcome. The expert
   * assessor has no portal access of their own, so the research coordinator
   * enters the result they were given — this is the only path off
   * 'not-yet-assessed', and therefore the only way a coach becomes certified.
   *
   * Note it does NOT advance `currentPhase` or set `status: 'completed'`, both
   * of which the fixtures pair with a pass. A backend awarding certification
   * has to decide whether those follow automatically.
   */
  const recordCertificationOutcome = useCallback(
    (coachId: string, outcome: 'pass' | 'remediation-required') => {
      patchCoach(coachId, (c) => ({
        ...c,
        certification: {
          ...c.certification,
          outcome,
          assessedDate: TODAY,
          note:
            outcome === 'remediation-required'
              ? 'Recorded by the research coordinator (prototype demo action). Add the assessor’s detailed note here once available.'
              : undefined,
        },
      }))
    },
    [patchCoach],
  )

  const inviteCoach = useCallback((coachId: string) => {
    setSpacesCoaches((prev) => {
      if (prev.some((sc) => sc.coachId === coachId)) return prev
      return [
        ...prev,
        {
          id: `spaces-${coachId}`,
          coachId,
          invitationStatus: 'invited',
          joinedStatus: 'not-joined',
          invitedDate: TODAY,
        },
      ]
    })
  }, [])

  const updateDyadPerson = useCallback(
    (dyadId: string, who: 'patient' | 'carer', patch: Partial<PersonProfile>) => {
      setConsumerDyads((prev) =>
        prev.map((d) => (d.id === dyadId ? { ...d, [who]: { ...d[who], ...patch } } : d)),
      )
    },
    [],
  )

  const updateDyadOverview = useCallback(
    (
      dyadId: string,
      patch: Partial<Pick<ConsumerDyad, 'sleepGoals' | 'caregivingContext' | 'notes'>>,
    ) => {
      setConsumerDyads((prev) => prev.map((d) => (d.id === dyadId ? { ...d, ...patch } : d)))
    },
    [],
  )

  /** Writes `coachNotes` and nothing else. DO NOT let this reach `notes` — that
   *  is the coordinator's intake field, rendered on several other surfaces, and
   *  an earlier version of this action silently overwrote it. */
  const updateDyadCoachNotes = useCallback((dyadId: string, coachNotes: string) => {
    setConsumerDyads((prev) => prev.map((d) => (d.id === dyadId ? { ...d, coachNotes } : d)))
  }, [])

  const addConsumer = useCallback(
    (
      coachId: string,
      input: {
        patient?: Omit<PersonProfile, 'relationship'>
        carer: PersonProfile
        sleepGoals: string
        caregivingContext: string
      },
    ) => {
      const id = `dyad-${Date.now()}`
      const dyad: ConsumerDyad = {
        id,
        coachId,
        patient: input.patient,
        carer: input.carer,
        sleepGoals: input.sleepGoals,
        caregivingContext: input.caregivingContext,
        sessionsCompleted: [],
        annotationSummaries: [],
        patientLog: [],
        carerLog: [],
        consentDocuments: [],
        // Duplicates `spaces.ts`'s `consumerModuleEngagement`, which is not
        // exported. Two places seeding the same thing — keep them in step, or
        // export that helper and call it from both.
        moduleEngagement: CONSUMER_MODULES.map((m) => ({ moduleId: m.id, status: 'not-started' as const })),
        sessionRecordings: [],
      }
      setConsumerDyads((prev) => [...prev, dyad])
      // A new dyad gets entries in both shadow slices immediately, so no reader
      // has to handle a missing key.
      setSessionCompletion((prev) => ({ ...prev, [id]: [] }))
      setSessionPlans((prev) => ({ ...prev, [id]: emptySessionPlan() }))
    },
    [],
  )

  /** Creates a consumer with NO coach — enrolment and assignment are separate
   *  steps. Returns the new id so a caller can attach consent documents.
   *  UNWIRED; this is the intended target for a REDCap import. */
  const enrollConsumer = useCallback(
    (input: {
      patient?: Omit<PersonProfile, 'relationship'>
      carer: PersonProfile
      sleepGoals: string
      caregivingContext: string
      notes?: string
      consentDocumentFilenames?: string[]
    }) => {
      const id = `dyad-${Date.now()}`
      const dyad: ConsumerDyad = {
        id,
        patient: input.patient,
        carer: input.carer,
        sleepGoals: input.sleepGoals,
        caregivingContext: input.caregivingContext,
        notes: input.notes,
        sessionsCompleted: [],
        annotationSummaries: [],
        patientLog: [],
        carerLog: [],
        consentDocuments: (input.consentDocumentFilenames ?? []).map((filename, i) => ({
          id: `consent-${id}-${i}`,
          filename,
          uploadedDate: TODAY,
        })),
        moduleEngagement: CONSUMER_MODULES.map((m) => ({ moduleId: m.id, status: 'not-started' as const })),
        sessionRecordings: [],
      }
      setConsumerDyads((prev) => [...prev, dyad])
      setSessionCompletion((prev) => ({ ...prev, [id]: [] }))
      setSessionPlans((prev) => ({ ...prev, [id]: emptySessionPlan() }))
      return id
    },
    [],
  )

  const addConsentDocument = useCallback((dyadId: string, filename: string) => {
    setConsumerDyads((prev) =>
      prev.map((d) =>
        d.id === dyadId
          ? {
              ...d,
              consentDocuments: [
                ...d.consentDocuments,
                { id: `consent-${Date.now()}`, filename, uploadedDate: TODAY },
              ],
            }
          : d,
      ),
    )
  }, [])

  const removeConsentDocument = useCallback((dyadId: string, documentId: string) => {
    setConsumerDyads((prev) =>
      prev.map((d) =>
        d.id === dyadId
          ? { ...d, consentDocuments: d.consentDocuments.filter((doc) => doc.id !== documentId) }
          : d,
      ),
    )
  }, [])

  /** Serves both first assignment and transfer between coaches. Note it leaves
   *  `coachAssignedDate` untouched, so after a transfer that date refers to the
   *  ORIGINAL assignment, not this one. */
  const transferDyad = useCallback((dyadId: string, newCoachId: string) => {
    setConsumerDyads((prev) =>
      prev.map((d) => (d.id === dyadId ? { ...d, coachId: newCoachId } : d)),
    )
  }, [])

  /** Marks a session complete or clears it. Note the mixed clock: the date
   *  comes from the frozen `TODAY` while the time comes from the real machine
   *  clock, so one record carries two notions of now. Both should come from a
   *  single timestamp once a real clock exists. */
  const toggleSession = useCallback((dyadId: string, session: number) => {
    setSessionCompletion((prev) => {
      const current = prev[dyadId] ?? []
      const done = current.some((c) => c.session === session)
      const next = done
        ? current.filter((c) => c.session !== session)
        : [
            ...current,
            {
              session,
              completedDate: TODAY,
              completedTime: new Date().toTimeString().slice(0, 5),
            },
          ].sort((a, b) => a.session - b.session)
      return { ...prev, [dyadId]: next }
    })
  }, [])

  /**
   * Edit one plan row. UNWIRED — nothing calls this.
   *
   * ⚠️ It disagrees with `bulkSetSessionPlan` about `rescheduled`. Its contract
   * is "flag it if the date or time changed after already being set", but
   * `alreadySet` only asks whether the row HAD a date, so any patch to a dated
   * row flags it — editing only `moduleTargetDate`, or re-saving an identical
   * date, falsely reports the session as moved. `bulkSetSessionPlan` compares
   * old and new values and gets this right. Latent only because there is no
   * caller; fix it before wiring one up.
   */
  const updateSessionPlanRow = useCallback(
    (dyadId: string, session: number, patch: Partial<SessionPlanRow>) => {
      setSessionPlans((prev) => {
        const plan = prev[dyadId] ?? emptySessionPlan()
        const row = plan.sessions.find((s) => s.session === session)
        const alreadySet = !!row?.date
        // Mint this row's Zoom credentials the first time it is dated, so a
        // dated row always has a join link.
        const creds = !row?.zoomLink && patch.date ? generateMeetingCreds() : {}
        return {
          ...prev,
          [dyadId]: {
            ...plan,
            sessions: plan.sessions.map((s) =>
              s.session === session
                ? { ...s, ...patch, ...creds, rescheduled: alreadySet ? true : s.rescheduled }
                : s,
            ),
          },
        }
      })
    },
    [],
  )

  /** Replaces all 7 rows at once — how a plan is actually created, and the
   *  path whose `rescheduled` handling matches the documented contract. */
  const bulkSetSessionPlan = useCallback((dyadId: string, rows: SessionPlanRow[]) => {
    setSessionPlans((prev) => {
      const existing = prev[dyadId] ?? emptySessionPlan()
      return {
        ...prev,
        [dyadId]: {
          ...existing,
          sessions: rows.map((r) => {
            const prevRow = existing.sessions.find((s) => s.session === r.session)
            const creds = r.date && !r.zoomLink ? generateMeetingCreds() : {}
            // Flag only on a REAL date change, comparing old against new. A
            // bulk save is also how a plan is re-planned, so it has to detect
            // moved sessions rather than assume none moved.
            const rescheduled =
              prevRow?.date && r.date && prevRow.date !== r.date ? true : r.rescheduled
            return { ...r, ...creds, rescheduled }
          }),
        },
      }
    })
  }, [])

  /** Prepends a note, so both note arrays read most-recent-first. Records NO
   *  author — a real study audit trail needs one and the field does not exist. */
  const addSupervisionNote = useCallback(
    (
      coachId: string,
      note: {
        title: string
        date: string
        time: string
        notes: string
        attachments: string[]
        dyadId?: string
      },
    ) => {
      setSupervisionNotes((prev) => [
        { id: `sup-${Date.now()}-${coachId}`, coachId, ...note },
        ...prev,
      ])
    },
    [],
  )

  const addResearchNote = useCallback(
    (
      dyadId: string,
      note: { title: string; date: string; time: string; notes: string; attachments: string[] },
    ) => {
      setResearchNotes((prev) => [{ id: `res-${Date.now()}-${dyadId}`, dyadId, ...note }, ...prev])
    },
    [],
  )

  const addManualRecording = useCallback((coachId: string, recording: SessionRecording) => {
    setManualRecordings((prev) => ({
      ...prev,
      [coachId]: [...(prev[coachId] ?? []), recording],
    }))
  }, [])

  const updateResearcherContact = useCallback((patch: { email: string; phone: string }) => {
    setResearcherProfile((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateResearcherNotificationPreferences = useCallback(
    (prefs: NotificationPreferences) => {
      setResearcherProfile((prev) => ({ ...prev, notificationPreferences: prefs }))
    },
    [],
  )

  const updateCoachNotificationPreferences = useCallback(
    (coachId: string, prefs: NotificationPreferences) => {
      patchCoach(coachId, (c) => ({ ...c, notificationPreferences: prefs }))
    },
    [patchCoach],
  )

  const updateDyadNotificationPreferences = useCallback(
    (dyadId: string, prefs: NotificationPreferences) => {
      setConsumerDyads((prev) =>
        prev.map((d) => (d.id === dyadId ? { ...d, notificationPreferences: prefs } : d)),
      )
    },
    [],
  )

  /** One-way. There is no un-opt-out anywhere, by design — a consumer who
   *  withdraws is followed up off-platform. */
  const setDyadOptOut = useCallback((dyadId: string, reason: string) => {
    setConsumerDyads((prev) =>
      prev.map((d) => (d.id === dyadId ? { ...d, optedOut: { reason, date: TODAY } } : d)),
    )
  }, [])

  // The dependency array below must list every state value and every action.
  // Omitting one hands consumers a stale closure that appears to work until an
  // unrelated re-render papers over it — add both entries together when adding
  // anything to the store.
  const value = useMemo(
    () => ({
      coaches,
      searchQuery,
      setSearchQuery,
      addCoachTrainee,
      withdrawCoach,
      updateContact,
      phaseCompletion,
      phaseCompletionDates,
      togglePhase,
      recordCertificationOutcome,
      spacesCoaches,
      consumerDyads,
      supervisionNotes,
      researchNotes,
      addResearchNote,
      inviteCoach,
      updateDyadPerson,
      updateDyadOverview,
      updateDyadCoachNotes,
      addConsumer,
      transferDyad,
      sessionCompletion,
      toggleSession,
      sessionPlans,
      updateSessionPlanRow,
      bulkSetSessionPlan,
      manualModuleUnlocks,
      addSupervisionNote,
      manualRecordings,
      addManualRecording,
      enrollConsumer,
      addConsentDocument,
      removeConsentDocument,
      researcherProfile,
      updateResearcherContact,
      updateResearcherNotificationPreferences,
      updateCoachNotificationPreferences,
      updateDyadNotificationPreferences,
      setDyadOptOut,
    }),
    [
      coaches,
      searchQuery,
      addCoachTrainee,
      withdrawCoach,
      updateContact,
      phaseCompletion,
      phaseCompletionDates,
      togglePhase,
      recordCertificationOutcome,
      spacesCoaches,
      consumerDyads,
      supervisionNotes,
      researchNotes,
      addResearchNote,
      inviteCoach,
      updateDyadPerson,
      updateDyadOverview,
      updateDyadCoachNotes,
      addConsumer,
      transferDyad,
      sessionCompletion,
      toggleSession,
      sessionPlans,
      updateSessionPlanRow,
      bulkSetSessionPlan,
      manualModuleUnlocks,
      addSupervisionNote,
      manualRecordings,
      addManualRecording,
      enrollConsumer,
      addConsentDocument,
      removeConsentDocument,
      researcherProfile,
      updateResearcherContact,
      updateResearcherNotificationPreferences,
      updateCoachNotificationPreferences,
      updateDyadNotificationPreferences,
      setDyadOptOut,
    ],
  )

  return (
    <ResearchContext.Provider value={value}>{children}</ResearchContext.Provider>
  )
}
