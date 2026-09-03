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
  type AdHocMeeting,
  type ConsumerDyad,
  type HealthLogEntry,
  type PersonProfile,
  type ReflectionComponentAnswer,
  type ResearchNote,
  type SessionCompletionRecord,
  type SessionPlan,
  type SessionPlanRow,
  type SleepDiaryAnswers,
  type SpacesCoach,
  type SpacesSessionRecording,
  type SupervisionNote,
} from './spaces'
import { TODAY, formatDate } from './format'
import { ResearchContext } from './research-context'

/**
 * Round 2 in-memory state for the Research Dashboard.
 * Holds the coach roster and EOI queue so approve/decline, withdraw,
 * reassign, contact edits and certificate generation are real (session-
 * scoped) state changes, per the Round 2 Definition of Done. Nothing
 * persists across a reload — this is a prototype, not a backend.
 */

/**
 * `TODAY`/`formatDate`/`formatTime` (moved to `./format`) and
 * `ResearchContext`/`useResearch` (moved to `./research-context`) used to
 * live here, but this file also exports `ResearchProvider` (a component).
 * Mixing component and non-component exports in one module defeats React
 * Fast Refresh: Vite flags ANY non-component export — even `useResearch`
 * itself, a hook — as making the whole module refresh-incompatible, so
 * every edit anywhere that cascaded into re-evaluating this heavily-
 * imported file forced `ResearchProvider` to remount with fresh initial
 * state, silently wiping all in-memory session data (e.g. a just-submitted
 * annotation summary) even though the browser never did a full page
 * reload. This file now exports only `ResearchProvider`, a single
 * component, making it a clean Fast Refresh boundary (Round 6.2.1 fix,
 * take 2 — the first attempt only moved the plain constants and missed
 * that `useResearch` needed to move too).
 */

export interface ResearchStore {
  coaches: Coach[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  /** Direct-onboarding "Add coach trainee" wizard — replaces the old EOI
   *  approve/decline flow. Returns the new coach's id. */
  addCoachTrainee: (input: CoachTraineeInput) => string
  withdrawCoach: (coachId: string) => void
  updateContact: (coachId: string, patch: { email: string; phone: string }) => void
  /** Completed COACH phase numbers per coach id (Round 2.2 phase pipeline). */
  phaseCompletion: Record<string, number[]>
  /** Completion date per stage number, where one is known — see `initialPhaseDates`. */
  phaseCompletionDates: Record<string, Record<number, string>>
  /** Tick / untick a phase in a coach's pipeline. */
  togglePhase: (coachId: string, phase: number) => void
  /** Record the Placement 2 outcome once received from the expert assessor. */
  recordCertificationOutcome: (
    coachId: string,
    outcome: 'pass' | 'remediation-required',
  ) => void

  // --- Round 3: Coaches (SPACES delivery oversight) ------------------------
  spacesCoaches: SpacesCoach[]
  consumerDyads: ConsumerDyad[]
  supervisionNotes: SupervisionNote[]
  /** The researcher's own notes on a dyad — deliberately separate from
   *  `supervisionNotes`/`addSupervisionNote`, which require a coach.
   *  A researcher writes these regardless of coach assignment. */
  researchNotes: ResearchNote[]
  /** Invite a certified coach into SPACES: creates an invited/not-joined row. */
  inviteCoach: (coachId: string) => void
  /** Update a dyad's patient or carer card fields (the "assign/update consumer details" affordance). */
  updateDyadPerson: (
    dyadId: string,
    who: 'patient' | 'carer',
    patch: Partial<PersonProfile>,
  ) => void
  /** Update a dyad's sleep goals, caregiving context, or additional notes. */
  updateDyadOverview: (
    dyadId: string,
    patch: Partial<Pick<ConsumerDyad, 'sleepGoals' | 'caregivingContext' | 'notes'>>,
  ) => void
  /** Update a coach's own free-text notes on a dyad (Assigned Consumers tab) —
   *  a distinct field from `notes`/`updateDyadOverview`, never overwrites it. */
  updateDyadCoachNotes: (dyadId: string, coachNotes: string) => void
  /** Add a new consumer (dyad) to a coach's caseload; `patient` omitted for a carer-only consumer. */
  addConsumer: (
    coachId: string,
    input: {
      patient?: Omit<PersonProfile, 'relationship'>
      carer: PersonProfile
      sleepGoals: string
      caregivingContext: string
    },
  ) => void
  /** Move a dyad to a different coach — the "no longer participating" hand-off. */
  transferDyad: (dyadId: string, newCoachId: string) => void
  /** Completed SPACES sessions (with date/time) per dyad id. */
  sessionCompletion: Record<string, SessionCompletionRecord[]>
  /** Tick / untick a session in a dyad's tracker. */
  toggleSession: (dyadId: string, session: number) => void
  /** Session planning (Round 14) — a whole-arc plan per dyad, present (rows
   *  may just be unset) the moment a dyad exists, kept separate from
   *  `dyad.sessionPlan` seed data, mirroring `sessionCompletion`'s
   *  relationship to `sessionsCompleted`. */
  sessionPlans: Record<string, SessionPlan>
  /** Set/edit one session row's date, time, and/or module target date; flags
   *  `rescheduled: true` if the date or time changes after already being
   *  set. Manual, single-row — never shifts other rows. */
  updateSessionPlanRow: (dyadId: string, session: number, patch: Partial<SessionPlanRow>) => void
  /** Set all 7 rows at once — the cadence-based first-time planning assist. */
  bulkSetSessionPlan: (dyadId: string, rows: SessionPlanRow[]) => void
  /** Manually-unlocked module indices per dyad id (Round 14.1) — a coach can
   *  grant a module early, ahead of marking its unlocking session complete.
   *  Additive/live, mirrors `sessionCompletion`'s relationship to seed data. */
  manualModuleUnlocks: Record<string, number[]>
  unlockModuleManually: (dyadId: string, moduleIndex: number) => void
  /** Add a one-off meeting outside the fixed 7-session plan; generates its
   *  meeting id/Zoom link (no real Zoom API in this prototype). */
  addAdHocMeeting: (dyadId: string, meeting: { title: string; date: string; time: string }) => void
  addSupervisionNote: (
    coachId: string,
    note: {
      title: string
      date: string
      time: string
      notes: string
      attachments: string[]
      dyadId?: string
      session?: number
    },
  ) => void
  /** Round 36 — edit an existing note in place. The Coach Delivery Portal's
   *  Session Notes tab lets a coach correct a case note after the fact
   *  (direct instruction); every other caller is append-only and simply does
   *  not use this. Patches by id rather than replacing the record, so a note's
   *  `coachId`/`dyadId` scoping cannot be rewritten by an edit form. */
  updateSupervisionNote: (
    noteId: string,
    patch: Partial<Pick<SupervisionNote, 'title' | 'notes' | 'session' | 'date' | 'time'>>,
  ) => void
  /** Add a researcher note to a dyad — no coach required. */
  addResearchNote: (
    dyadId: string,
    note: { title: string; date: string; time: string; notes: string; attachments: string[] },
  ) => void
  /** Researcher-uploaded recordings per coach id (Session Recordings tab's
   *  Upload control) — additive to `sessionRecordingsFor()`'s derived list. */
  manualRecordings: Record<string, SessionRecording[]>
  addManualRecording: (coachId: string, recording: SessionRecording) => void
  /** Coach-side write path for the post-practice SIPTEA reflection
   *  (Round 6.2 — Coach Delivery Portal My Reflections tab). Writes the same
   *  two fields the researcher-facing Annotation Vault already reads —
   *  no parallel data path (plan §8a). */
  submitPostPracticeAnnotation: (
    dyadId: string,
    components: ReflectionComponentAnswer[],
    shared: boolean,
    /** The internal SPACES session number the reflection is about, when the
     *  wizard was opened from a session debrief. Round 40. */
    session?: number,
  ) => void
  /** Edit a saved reflection, or change only its share setting (Round 40 — the
   *  My reflections tab's review dialog does both). Patches **by id** so an
   *  edit cannot rewrite the entry's session, stamp, or the rest of the list. */
  updateAnnotationSummary: (
    dyadId: string,
    entryId: string,
    patch: { components?: ReflectionComponentAnswer[]; shared?: boolean },
  ) => void

  // --- Round 4: Consumer Management ------------------------------------------
  /** Enrol a new consumer (dyad) into the study, ahead of coach assignment — `coachId` is absent until assigned from the Coach view.
   *  Returns the new dyad's id so the enrollment wizard can attach any consent documents queued during its own Consent step. */
  enrollConsumer: (input: {
    patient?: Omit<PersonProfile, 'relationship'>
    carer: PersonProfile
    sleepGoals: string
    caregivingContext: string
    notes?: string
    consentDocumentFilenames?: string[]
  }) => string
  /** Add a researcher-uploaded consent document (dummy filename) to a dyad's consent repository. */
  addConsentDocument: (dyadId: string, filename: string) => void
  /** Remove a document from a dyad's consent repository. */
  removeConsentDocument: (dyadId: string, documentId: string) => void
  /** Add a manually-uploaded session recording to a dyad's own record — the
   *  Session Recordings tab's Upload control, mirrored on both the Consumer
   *  Management and Coach Management sides of the same dyad. */
  addDyadSessionRecording: (dyadId: string, recording: SpacesSessionRecording) => void

  // --- Round 5: Consumer Portal ----------------------------------------------
  /** Consumer-side write to today's sleep-diary entry (Digital Sleep Diary) — the
   *  first place this data is dyad-writable rather than seed-only. */
  addDiaryEntry: (dyadId: string, who: 'patient' | 'carer', entry: string) => void
  /** Consumer-side submit of today's 9 Consensus Sleep Diary answers (Round 44
   *  fill-in flow) — writes each member's `diary` onto their own health-log
   *  entry for `TODAY`, the same rows the researcher's and coach's diary views
   *  already read. `patient` omitted for a carer-only dyad. */
  submitSleepDiary: (
    dyadId: string,
    answers: { patient?: SleepDiaryAnswers; carer: SleepDiaryAnswers },
  ) => void

  // --- Round 6.2.1: Account tabs (researcher / coach / consumer) ---------------
  researcherProfile: typeof initialResearcher
  updateResearcherContact: (patch: { email: string; phone: string }) => void
  updateResearcherNotificationPreferences: (prefs: NotificationPreferences) => void
  updateCoachNotificationPreferences: (coachId: string, prefs: NotificationPreferences) => void
  updateDyadNotificationPreferences: (dyadId: string, prefs: NotificationPreferences) => void
  /** Consumer-initiated study withdrawal from the Account tab's opt-out card. */
  setDyadOptOut: (dyadId: string, reason: string) => void
}

/** Placeholder Zoom meeting id/link generator (session planning, Round 14) —
 *  no real Zoom API in this prototype; matches the existing seed data's
 *  placeholder shape. Shared by ad-hoc meetings and newly-dated plan rows. */
function generateMeetingCreds(): { meetingId: string; zoomLink: string } {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9)
  return {
    meetingId: `${suffix.slice(0, 3)} ${suffix.slice(3, 6)} ${suffix.slice(6)}`,
    zoomLink: `https://zoom.us/j/${suffix}`,
  }
}

/**
 * Seed a coach's completed-phase set: every phase before their current one is
 * done; a completed coach also has their current phase done; any coach with an
 * assessment outcome has Placement 2 (phase 7) done so the record reflects it.
 */
function initialPhases(c: Coach): number[] {
  const done = new Set<number>()
  for (let p = 1; p < c.currentPhase; p++) done.add(p)
  if (c.status === 'completed') done.add(c.currentPhase)
  if (c.certification.outcome !== 'not-yet-assessed') done.add(7)
  return [...done].sort((a, b) => a - b)
}

/**
 * Best-known completion date per COACH stage, for the trainee Overview's
 * horizontal pathway timeline.
 *
 * Derived rather than stored as its own seed field: the dates already exist in
 * the records that *prove* each stage happened, so reading them back keeps the
 * timeline honest — Stage C is dated by the last module the trainee finished,
 * Stage O by the last group session they actually attended, Stage H by the
 * Placement 2 assessment. Placement 1 and Community of practice have no dated
 * artefact in this dataset, so they are deliberately left undated and the
 * timeline shows them as complete without inventing a date.
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
  /** Researcher-uploaded recordings, keyed by coach id — additive to
   *  `sessionRecordingsFor()`'s derived list (Session Recordings tab's
   *  Upload control). */
  const [manualRecordings, setManualRecordings] = useState<Record<string, SessionRecording[]>>({})
  const [sessionCompletion, setSessionCompletion] = useState<Record<string, SessionCompletionRecord[]>>(
    () => Object.fromEntries(initialDyads.map((d) => [d.id, [...d.sessionsCompleted]])),
  )
  const [sessionPlans, setSessionPlans] = useState<Record<string, SessionPlan>>(() =>
    Object.fromEntries(initialDyads.map((d) => [d.id, d.sessionPlan ?? emptySessionPlan()])),
  )
  const [manualModuleUnlocks, setManualModuleUnlocks] = useState<Record<string, number[]>>({})
  const [researcherProfile, setResearcherProfile] = useState(initialResearcher)

  const patchCoach = useCallback(
    (coachId: string, patch: (c: Coach) => Coach) => {
      setCoaches((prev) => prev.map((c) => (c.id === coachId ? patch(c) : c)))
    },
    [],
  )

  const addCoachTrainee = useCallback(
    (input: CoachTraineeInput): string => {
      const participantId = nextParticipantId(coaches)
      const id = `coach-${Date.now()}`
      const coach = coachFromTraineeInput(input, id, participantId, TODAY)
      setCoaches((prev) => [...prev, coach])
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
      // Marking a stage complete stamps today's date so the Overview
      // timeline has something to show for it; reverting clears the stamp
      // rather than leaving a date behind on a stage that is no longer
      // complete. Derived from `prev` inside this updater rather than from
      // the `phaseCompletion` value in scope, so the callback needs no
      // dependency and can't act on a stale read.
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
   * Records the Placement 2 (SIPTEA competency checklist) outcome once the
   * research coordinator has received it from the expert assessor — the
   * assessor has no direct portal access (per user-roles.md), so the
   * coordinator logs the result here. Round 2.2.9: previously there was no
   * way to move a coach off "not-yet-assessed" anywhere in the UI.
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
        moduleEngagement: CONSUMER_MODULES.map((m) => ({ moduleId: m.id, status: 'not-started' as const })),
        sessionRecordings: [],
      }
      setConsumerDyads((prev) => [...prev, dyad])
      setSessionCompletion((prev) => ({ ...prev, [id]: [] }))
      setSessionPlans((prev) => ({ ...prev, [id]: emptySessionPlan() }))
    },
    [],
  )

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

  const addDyadSessionRecording = useCallback((dyadId: string, recording: SpacesSessionRecording) => {
    setConsumerDyads((prev) =>
      prev.map((d) =>
        d.id === dyadId ? { ...d, sessionRecordings: [...d.sessionRecordings, recording] } : d,
      ),
    )
  }, [])

  const transferDyad = useCallback((dyadId: string, newCoachId: string) => {
    setConsumerDyads((prev) =>
      prev.map((d) => (d.id === dyadId ? { ...d, coachId: newCoachId } : d)),
    )
  }, [])

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

  const updateSessionPlanRow = useCallback(
    (dyadId: string, session: number, patch: Partial<SessionPlanRow>) => {
      setSessionPlans((prev) => {
        const plan = prev[dyadId] ?? emptySessionPlan()
        const row = plan.sessions.find((s) => s.session === session)
        const alreadySet = !!row?.date
        // Generate this row's own Zoom meeting id/link the first time it's
        // dated, same as an ad-hoc meeting does on creation.
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
            // Round 14.1 fix: a bulk save (e.g. re-planning via the wizard's
            // "Edit plan" entry point) previously never flagged `rescheduled`
            // the way a single-row edit already did — an identical date
            // change made through this path silently skipped the
            // "Rescheduled" indicator a coach would otherwise see.
            const rescheduled =
              prevRow?.date && r.date && prevRow.date !== r.date ? true : r.rescheduled
            return { ...r, ...creds, rescheduled }
          }),
        },
      }
    })
  }, [])

  const unlockModuleManually = useCallback((dyadId: string, moduleIdx: number) => {
    setManualModuleUnlocks((prev) => {
      const current = prev[dyadId] ?? []
      if (current.includes(moduleIdx)) return prev
      return { ...prev, [dyadId]: [...current, moduleIdx] }
    })
  }, [])

  const addAdHocMeeting = useCallback(
    (dyadId: string, meeting: { title: string; date: string; time: string }) => {
      const newMeeting: AdHocMeeting = {
        id: `adhoc-${Date.now()}`,
        ...meeting,
        ...generateMeetingCreds(),
      }
      setSessionPlans((prev) => {
        const plan = prev[dyadId] ?? emptySessionPlan()
        return { ...prev, [dyadId]: { ...plan, adHocMeetings: [...plan.adHocMeetings, newMeeting] } }
      })
    },
    [],
  )

  const addDiaryEntry = useCallback((dyadId: string, who: 'patient' | 'carer', entry: string) => {
    setConsumerDyads((prev) =>
      prev.map((d) => {
        if (d.id !== dyadId) return d
        const logKey = who === 'patient' ? 'patientLog' : 'carerLog'
        const log = d[logKey]
        const todayIndex = log.findIndex((e) => e.date === TODAY)
        const nextLog =
          todayIndex >= 0
            ? log.map((e, i) => (i === todayIndex ? { ...e, diaryEntry: entry } : e))
            : [...log, { date: TODAY, synced: false, diaryEntry: entry }]
        return { ...d, [logKey]: nextLog }
      }),
    )
  }, [])

  const submitSleepDiary = useCallback(
    (dyadId: string, answers: { patient?: SleepDiaryAnswers; carer: SleepDiaryAnswers }) => {
      // Same today-or-append shape as `addDiaryEntry` above, applied per
      // member — the questionnaire covers both of them in one sitting, so the
      // write is one action rather than two calls a caller could half-make.
      const writeDiary = (log: HealthLogEntry[], diary: SleepDiaryAnswers): HealthLogEntry[] => {
        const todayIndex = log.findIndex((e) => e.date === TODAY)
        return todayIndex >= 0
          ? log.map((e, i) => (i === todayIndex ? { ...e, diary } : e))
          : [...log, { date: TODAY, synced: false, diary }]
      }
      setConsumerDyads((prev) =>
        prev.map((d) => {
          if (d.id !== dyadId) return d
          return {
            ...d,
            patientLog: answers.patient ? writeDiary(d.patientLog, answers.patient) : d.patientLog,
            carerLog: writeDiary(d.carerLog, answers.carer),
            // Stamps the submission itself — see `diarySubmittedOn`. The log
            // alone cannot carry this, because the seed already writes a diary
            // on TODAY for every dyad.
            diarySubmittedOn: TODAY,
          }
        }),
      )
    },
    [],
  )

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
        session?: number
      },
    ) => {
      setSupervisionNotes((prev) => [
        { id: `sup-${Date.now()}-${coachId}`, coachId, ...note },
        ...prev,
      ])
    },
    [],
  )

  const updateSupervisionNote = useCallback(
    (
      noteId: string,
      patch: Partial<Pick<SupervisionNote, 'title' | 'notes' | 'session' | 'date' | 'time'>>,
    ) => {
      setSupervisionNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...patch } : n)))
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

  const submitPostPracticeAnnotation = useCallback(
    (
      dyadId: string,
      components: ReflectionComponentAnswer[],
      shared: boolean,
      session?: number,
    ) => {
      setConsumerDyads((prev) =>
        prev.map((d) =>
          d.id === dyadId
            ? {
                ...d,
                /* Round 40: **prepend**, where Round 13 replaced. A coach now
                   writes a reflection after every session, so the one-per-
                   consumer cap this action used to enforce would silently
                   destroy the previous session's reflection on every save.
                   Newest first, which is what `latestAnnotationState()` and
                   the My reflections table both already assume. */
                annotationSummaries: [
                  {
                    id: `ann-${Date.now()}`,
                    session,
                    components,
                    shared,
                    date: TODAY,
                    time: new Date().toTimeString().slice(0, 5),
                  },
                  ...d.annotationSummaries,
                ],
              }
            : d,
        ),
      )
    },
    [],
  )

  const updateAnnotationSummary = useCallback(
    (
      dyadId: string,
      entryId: string,
      patch: { components?: ReflectionComponentAnswer[]; shared?: boolean },
    ) => {
      setConsumerDyads((prev) =>
        prev.map((d) =>
          d.id === dyadId
            ? {
                ...d,
                /* Patch by id and spread the existing entry, so changing the
                   share toggle cannot drop the session, the stamp, or the
                   answers — the same reasoning as `updateSupervisionNote`. */
                annotationSummaries: d.annotationSummaries.map((a) =>
                  a.id === entryId ? { ...a, ...patch } : a,
                ),
              }
            : d,
        ),
      )
    },
    [],
  )

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

  const setDyadOptOut = useCallback((dyadId: string, reason: string) => {
    setConsumerDyads((prev) =>
      prev.map((d) => (d.id === dyadId ? { ...d, optedOut: { reason, date: TODAY } } : d)),
    )
  }, [])

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
      unlockModuleManually,
      addAdHocMeeting,
      addSupervisionNote,
      updateSupervisionNote,
      manualRecordings,
      addManualRecording,
      submitPostPracticeAnnotation,
      updateAnnotationSummary,
      enrollConsumer,
      addConsentDocument,
      removeConsentDocument,
      addDyadSessionRecording,
      addDiaryEntry,
      submitSleepDiary,
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
      unlockModuleManually,
      addAdHocMeeting,
      addSupervisionNote,
      updateSupervisionNote,
      manualRecordings,
      addManualRecording,
      submitPostPracticeAnnotation,
      updateAnnotationSummary,
      enrollConsumer,
      addConsentDocument,
      removeConsentDocument,
      addDyadSessionRecording,
      addDiaryEntry,
      submitSleepDiary,
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
