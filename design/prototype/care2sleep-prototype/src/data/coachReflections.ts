import { useSyncExternalStore } from 'react'
import { SIPTEA_INITIALS, type SipteaInitial } from './siptea'

/**
 * The **coach's** post-session SIPTEA reflection — the six questions a coach
 * answers after every client session, plus the copy for the flow around them.
 *
 * Source: the Notion page *"Coach dashboard open items to be confirmed"* (last
 * edited 2026-10-01). The wording below is **that page's own**, transcribed
 * rather than written here.
 *
 * ## What this replaced
 * Round 39's six questions, which lived inline in
 * `components/delivery/AddAnnotationSummaryModal.tsx` as a `STEPS` array. Each
 * was a *pair* of sentences ("Where did you land on a shared understanding…?
 * Where did your view differ from theirs?"). Notion supplies one question per
 * component and no sub-copy, so the pairs and the sub-copy are both gone
 * (direct instruction, 2026-10-05: *"Notion has updated list of questions for
 * each SIPTEA step, remove any current question copy + subcopy from here"*).
 *
 * ## Why a module rather than a const in the component
 * The same reason `data/traineeReflections.ts` exists: one file owns every
 * string in one flow, so re-transcribing from Notion is an edit to one place
 * and a reviewer can read the copy without reading the wizard.
 *
 * ## Contractions are spelled out
 * Notion writes "they'll". Round 32 removed every contraction from the trainee
 * banners, the certification card, the tour and the onboarding; Round 46 did
 * the same to a clinician's own consumer-facing questions; and
 * `traineeReflections.ts` applies it to Notion's trainee questions. Nothing
 * else is reworded — these are the research team's words, and the point is
 * that they are recognisable, not tidy.
 *
 * ## Terminology
 * "Client", not "consumer". This is a coach-facing surface, and CLAUDE.md's
 * audience rule has said so since Round 30.
 */

/**
 * The six questions, verbatim from Notion apart from the one contraction.
 *
 * Keyed by initial rather than held as an array, so a question cannot drift out
 * of step with the component it belongs to — the order comes from
 * `SIPTEA_INITIALS`, which `data/siptea.ts` already owns. Same shape as
 * `BASELINE_QUESTIONS` next door, deliberately.
 *
 * Note these are **retrospective** where the trainee's are definitional: the
 * trainee is asked why a component matters, the coach is asked what happened in
 * the session that just finished. That is the real difference between the two
 * flows and the reason they do not share a question set.
 */
export const COACH_SESSION_QUESTIONS: Record<SipteaInitial, string> = {
  S: 'What did you learn today about what matters most to this client?',
  /* Notion: "how they'll try the strategy". */
  I: 'What did you and the client plan for how they will try the strategy?',
  P: 'What did the client say might get in the way of trying the strategy?',
  T: 'What did you change to make the strategy fit this client?',
  E: 'What did you notice about how the client felt about the strategy or change today?',
  A: 'What did the client agree to try before your next session?',
}

/** How many question screens the flow has. Derived, never written: the bar, the
 *  review table and the step machine all count off this. */
export const COACH_REFLECTION_STEP_COUNT = SIPTEA_INITIALS.length

/** An empty answer set. A function, not a shared constant — a module-level
 *  array would be mutated across opens. */
export const emptyCoachAnswers = (): string[] =>
  Array.from({ length: COACH_REFLECTION_STEP_COUNT }, () => '')

/**
 * The welcome screen's blurb.
 *
 * One paragraph, and it names the two things the coach does not already know
 * from the banner that sent them here: the reflection is six questions, and the
 * transcript is required rather than optional. Sharing is stated because it is
 * now compulsory and the coach has no choice to make about it — saying so here
 * is what replaces the share control that used to sit on the review screen.
 */
export const COACH_WELCOME_BLURB =
  'Six questions, one for each SIPTEA component, about the session you have just held. You will then upload the session transcript and mark the session complete. Your reflection and the transcript are both shared with the research team.'

/**
 * The welcome's step row.
 *
 * **Four phases, over a six-circle progress bar** — which is not the
 * disagreement it looks like. The trainee's welcome already lists three phases
 * above the same six circles: the row describes the shape of the flow, the bar
 * counts the questions. The Round 39 bug this superficially resembles
 * (`AddAnnotationSummaryModal`'s pane reading "Step 1 of 6" while its rail
 * announced "Step 1 of 8") was two *counters* disagreeing about one thing.
 *
 * Four columns do not fit the trainee's 180px/48px metrics — see the row's own
 * comment in the wizard for the arithmetic and the 160px/32px precedent.
 */
export const COACH_WELCOME_STEPS: { label: string; description: string }[] = [
  { label: 'Answer', description: 'Six questions, one at a time' },
  { label: 'Review', description: 'Check your answers before you share' },
  { label: 'Upload transcript', description: 'Attach the session recording transcript' },
  { label: 'Complete', description: 'Mark the session as held' },
]

/**
 * What the coach is told to attach.
 *
 * The copy asks for Zoom's own transcript formats; the input accepts anything
 * (both halves deliberate, following `FeedbackReportDialog`'s own documented
 * divergence). A real implementation validates server-side, which is where the
 * safeguard always belonged, and a prototype that rejects a tester's file is
 * testing the wrong thing.
 */
export const TRANSCRIPT_ACCEPT_LABEL = 'VTT or TXT'

/* ── The planning session's transcript-only flow ────────────────────────── */

/**
 * Copy for the **Planning session**, which is the one meeting with a
 * transcript to share and nothing to reflect on.
 *
 * Direct instruction, 2026-10-05: *"after I create plan, show the yellow
 * banner again, but for this one the user only needs to upload the
 * transcripts, no SIPTEA reflection to be added for this one... only show
 * welcome screen, upload screen + thank you screen."*
 *
 * Why there is genuinely nothing to reflect on: the SIPTEA components are all
 * about how a coaching conversation went — what the client wants, how the
 * strategy was planned, what they agreed to try. In the planning session no
 * strategy has been coached yet; the pair are agreeing a calendar. A set of
 * six questions about it would be six questions with no honest answers, which
 * is worse than not asking.
 *
 * The transcript still matters, which is the whole reason this flow exists:
 * the research team needs a record of how the plan was arrived at.
 */
export const PLANNING_WELCOME_HEADING = 'Share your planning session transcript'

export const PLANNING_WELCOME_BLURB =
  'You have just created the session plan with your client. Upload the transcript of that conversation so the research team has a record of how the plan was agreed. There are no reflection questions for this one.'

/** The transcript step's sub copy when there is no reflection to share it
 *  alongside. The full flow's version names both documents. */
export const PLANNING_TRANSCRIPT_SUBCOPY =
  'Attach the transcript of your planning session. It is shared with the research team.'

export const PLANNING_THANKS_HEADING = 'Thank you for sharing the transcript'

export const PLANNING_THANKS_BODY =
  'Your planning session transcript has been shared with the research team.'


/* ── Draft store ────────────────────────────────────────────────────────── */

/**
 * Part-finished coach reflections, so **cancelling is not destructive**.
 *
 * Direct instruction, 2026-10-05: the coach's cancel modal was to match the
 * trainee's, which says *"Your answers are saved."* It could not, honestly,
 * until there was somewhere for them to go — the coach wizard threw its
 * answers away on every close path, and six typed paragraphs behind a
 * red Leave button was the one place in this flow where a mis-click cost real
 * work. So the store came first and the copy followed it, rather than the
 * copy being changed to describe behaviour the app did not have.
 *
 * ## Keyed by dyad **and** session
 * The trainee's equivalent keys by timepoint, because a trainee has exactly
 * one reflection per timepoint for the whole study. A coach writes one per
 * session per client and may have several clients mid-flow at once, so a
 * single-slot store would hand Bruce's half-written answers to Dorothy. The
 * key is built by `coachDraftKey` rather than assembled at each call site.
 *
 * ## Module-scoped, never persisted
 * Same two reasons as `data/traineeReflections.ts`: every page under a portal
 * mounts its own shell, so a flag kept in one resets on in-app navigation
 * (Round 29 replayed a whole onboarding that way) — and a reload starting
 * clean is the intended demo behaviour, matching `activeStage`.
 */
interface CoachDraftState {
  /** Keyed by `coachDraftKey`. Present only once the coach has typed
   *  something, so "has a draft" and "is resumable" are the same question. */
  drafts: Record<string, string[]>
}

let draftState: CoachDraftState = { drafts: {} }
const draftListeners = new Set<() => void>()

function emitDrafts() {
  /* A new object each time — `useSyncExternalStore` bails out on `Object.is`, so
     mutating in place would leave every reader stale. */
  draftState = { drafts: { ...draftState.drafts } }
  draftListeners.forEach((l) => l())
}

function subscribeDrafts(listener: () => void) {
  draftListeners.add(listener)
  return () => draftListeners.delete(listener)
}

function getDraftSnapshot() {
  return draftState
}

/** One client's one session. Exported because both the wizard and the session
 *  card have to name the same slot, and two hand-built template strings is how
 *  they would come to disagree. */
export function coachDraftKey(dyadId: string, session: number): string {
  return `${dyadId}:${session}`
}

export function useCoachReflectionDrafts(): CoachDraftState {
  return useSyncExternalStore(subscribeDrafts, getDraftSnapshot, getDraftSnapshot)
}

/**
 * Keep a part-finished reflection. Called on every close path that is not a
 * submit — Cancel, Escape and the backdrop alike — which is what makes
 * cancelling safe.
 *
 * An all-blank set **deletes** rather than storing six empty strings, so a
 * coach who opens the wizard and immediately closes it is not offered a
 * Resume for nothing.
 */
export function saveCoachReflectionDraft(dyadId: string, session: number, answers: string[]) {
  const key = coachDraftKey(dyadId, session)
  if (answers.every((a) => !a.trim())) {
    delete draftState.drafts[key]
  } else {
    draftState.drafts[key] = [...answers]
  }
  emitDrafts()
}

/** Clear on submit, in the same tick the reflection is written, so a saved
 *  session can never also read as resumable. */
export function clearCoachReflectionDraft(dyadId: string, session: number) {
  delete draftState.drafts[coachDraftKey(dyadId, session)]
  emitDrafts()
}
