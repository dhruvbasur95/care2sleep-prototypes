import { useSyncExternalStore } from 'react'
import { PLANNING_SESSION, type SessionCompletionRecord } from '@/data/spaces'
import { TODAY } from '@/data/format'
import type { ReflectionRow } from '@/components/shared/ReflectionReviewTable'

/**
 * Goal setting — the checklist a coach works through **with** the client during
 * a session, on a shared screen (direct instruction, 2026-11-09).
 *
 * The Planning session asks eight questions; every catch-up (Sessions 1-6) asks
 * the same five. Every answer is required. Saving the goals is **not** the same
 * as completing the session — that is still the debrief wizard's job — but it
 * is what unlocks the debrief: the "How did Session N go?" banner now waits for
 * saved goals instead of appearing the moment the coach joins Zoom.
 *
 * ⚠️ **DUMMY, view-level.** Nothing upstream stores goals, so every held
 * session shows `DEFAULT_*_ANSWERS` — one shared copy for every client (direct
 * instruction: *"do not create custom answers… use same default copy for
 * all"*). Goals a coach saves in the app override the default for that one
 * session. Which sessions have goals at all follows the client's own timeline:
 * only sessions in `sessionCompletion`, so a client mid-study shows goals up to
 * where they are and no further.
 */

export const PLANNING_GOAL_QUESTIONS = [
  'What are your motivations for taking part in this project?',
  'What are you hoping will be different?',
  'If sleep improves, what will change?',
  'What would you like to change about sleep?',
  'If your sleep changed, how would you feel?',
  'If your sleep changed, what would you be able to do?',
  'What could we measure to tell it’s working?',
  'What might get in the way of making these changes?',
] as const

export const SESSION_GOAL_QUESTIONS = [
  'What are some small steps you feel confident starting with?',
  'What might this look like in practice?',
  'What might you need to put in place to support you to try this?',
  'Can you think of any barriers that might come about in making these changes?',
  'What do you think could be helpful if you come across some of these barriers?',
] as const

/** ⚠️ DUMMY — the one answer set every client's Planning session shows. */
const DEFAULT_PLANNING_ANSWERS = [
  'We want better sleep so our days feel easier for both of us. We are tired of broken nights and want to feel more rested.',
  'Fewer wake-ups in the night, and less time lying awake before falling asleep.',
  'We would have more energy for walks and seeing family, and fewer short tempers when we are tired.',
  'Going to bed at a more regular time, and settling back to sleep more quickly after waking.',
  'Calmer and less worried at bedtime, and more patient with each other during the day.',
  'Get back to the weekly community group, and take a morning walk together.',
  'The sleep diary and Fitbit: how long it takes to fall asleep, how often we wake, and how rested we feel each morning.',
  'Long afternoon naps, worrying at bedtime, and evenings when family visits run late.',
]

/** ⚠️ DUMMY — the one answer set every client's catch-up sessions show. */
const DEFAULT_SESSION_ANSWERS = [
  'Getting outside in the morning light for 15 minutes after breakfast.',
  'A short walk to the letterbox and back, or a cup of tea on the back step, every morning around 9 am.',
  'A reminder note on the fridge, and shoes left by the back door the night before.',
  'Cold or rainy mornings, and days with early appointments.',
  'Sitting by the brightest window on bad-weather days, and moving the walk to after lunch on appointment days.',
]

export function goalQuestionsFor(session: number): readonly string[] {
  return session === PLANNING_SESSION ? PLANNING_GOAL_QUESTIONS : SESSION_GOAL_QUESTIONS
}

/** Question/answer rows for `ReflectionReviewTable`. Numbered, and with no
 *  SIPTEA disc — `initial: null` is the table's plain-label case. */
export function goalReviewRows(session: number, answers: string[]): ReflectionRow[] {
  return goalQuestionsFor(session).map((q, i) => ({
    initial: null,
    name: `${i + 1}. ${q}`,
    answer: answers[i] ?? '',
  }))
}

/* ── Copy ───────────────────────────────────────────────────────────────── */

/** The session card's title — the user's own wording. */
export const GOAL_CARD_TITLE = 'My Care2Sleep goal setting'
export const GOAL_CARD_DONE_TITLE = 'Great! You have set goals for this session.'

/** The card's sub copy — one line for every session, Planning included:
 *  "before the next session" is true of all seven, and the card sits beside
 *  the session details, so naming the session again was noise.
 *  /design:ux-copy pass 2026-11-09, on direct instruction: lead with the task,
 *  not "Share your screen"; then that it is mandatory (the user's word); then
 *  how. Three short sentences rather than one long one, for readers who are
 *  not confident with text. */
export const GOAL_CARD_BLURB =
  'With your client, set goals to work on before the next session. This is mandatory. Share your screen so they can follow along.'

export function goalWelcomeHeading(sessionLabel: string): string {
  return sessionLabel === 'Planning'
    ? 'Set goals with your client'
    : `Set goals for ${sessionLabel} with your client`
}

export const GOAL_WELCOME_BLURB =
  'Share your screen so your client can see each question. Talk through them together and write answers that fit their daily life. This is a mandatory part of every session.'

/** Four steps for the welcome row — **identical for Planning and Sessions
 *  1-6** (direct instruction, 2026-11-09: no question count, because it differs
 *  between the two and the welcome must not). Step 4 does not promise the coach
 *  can edit — coach editing is out for now. */
export const GOAL_WELCOME_STEPS: { label: string; description: string }[] = [
  { label: 'Share your screen', description: 'Show your client the questions on Zoom.' },
  { label: 'Answer together', description: 'Talk through each question and write down what you agree.' },
  {
    label: 'Save the goals',
    description: 'Every question needs an answer before you can save.',
  },
  {
    label: 'Your client can see them',
    description: 'After the session, the goals appear on your client’s dashboard.',
  },
]

export const GOAL_THANKS_HEADING = 'Thank you for setting goals together'
export function goalThanksBody(sessionLabel: string): string {
  const which = sessionLabel === 'Planning' ? 'the planning session' : sessionLabel
  return `The goals for ${which} are saved. Your client can see them after the session.`
}

/* ── Store ──────────────────────────────────────────────────────────────── */

export interface GoalDraft {
  answers: string[]
  /** Where the coach minimised — resuming during a live call drops them back
   *  on that question, not on the welcome. */
  step: number
}

export interface SavedGoals {
  answers: string[]
  savedDate: string
}

interface GoalState {
  drafts: Record<string, GoalDraft>
  saved: Record<string, SavedGoals>
}

/* Module-scoped, never persisted — the same two reasons as
   `data/coachReflections.ts`: every portal page mounts its own shell, so state
   kept there resets on navigation, and a reload starting clean is the intended
   demo behaviour. */
let state: GoalState = { drafts: {}, saved: {} }
const listeners = new Set<() => void>()

function emit() {
  state = { drafts: { ...state.drafts }, saved: { ...state.saved } }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

const getSnapshot = () => state

export function goalKey(dyadId: string, session: number): string {
  return `${dyadId}:${session}`
}

export function useGoalSetting(): GoalState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Minimising keeps the draft **even when it is blank** — a coach who opened
 *  the flow and minimised it has started it, and the card must say Resume. */
export function saveGoalDraft(dyadId: string, session: number, draft: GoalDraft) {
  state.drafts[goalKey(dyadId, session)] = { answers: [...draft.answers], step: draft.step }
  emit()
}

export function saveGoals(dyadId: string, session: number, answers: string[]) {
  const key = goalKey(dyadId, session)
  state.saved[key] = { answers: answers.map((a) => a.trim()), savedDate: TODAY }
  delete state.drafts[key]
  emit()
}

/**
 * The goals to show for one held session: what the coach saved in the app,
 * else the shared default. `undefined` when the session has not been held —
 * goals follow the client's timeline, never ahead of it.
 */
export function goalsForSession(
  saved: Record<string, SavedGoals>,
  dyadId: string,
  session: number,
  completed: SessionCompletionRecord[],
): string[] | undefined {
  if (!completed.some((c) => c.session === session)) return undefined
  return heldSessionGoals(saved, dyadId, session)
}

/** A session already known to be held — the researcher's table, whose held
 *  dates on a transferred consumer come from the hand-over split rather than
 *  `sessionCompletion`. Saved in the app first, else ⚠️ the DUMMY default. */
export function heldSessionGoals(
  saved: Record<string, SavedGoals>,
  dyadId: string,
  session: number,
): string[] {
  return (
    saved[goalKey(dyadId, session)]?.answers ??
    (session === PLANNING_SESSION ? DEFAULT_PLANNING_ANSWERS : DEFAULT_SESSION_ANSWERS)
  )
}

/** Question/answer pairs as a plain document — the researcher's Download. */
export function goalsAsText(heading: string, session: number, answers: string[]): string {
  const body = goalQuestionsFor(session)
    .map((q, i) => `${i + 1}. ${q}\n${answers[i] || 'Not answered.'}\n`)
    .join('\n')
  return `${heading}\n\n${body}`
}
