/**
 * The client's own goals, as the Consumer Portal shows them on Home
 * (`ClientGoalsCard`, Figma `4942:25528`, 2026-11-12).
 *
 * ⚠️ **DUMMY, view-level, and deliberately NOT linked to the coach's goal
 * setting** (direct instruction, 2026-11-12: *"for clients, we will not link
 * goals set at coach view, we will show default goals i.e. no linking"*). So
 * this file does not read `data/goalSetting.ts`, and its questions are the
 * client's own sentence starters rather than the coach's questions: the same
 * conversation, written for the person it belongs to. Every client sees the
 * same default answers. Which sessions have goals follows that client's own
 * timeline (`sessionCompletion`), so a future session shows the empty state.
 */

/** Planning session — the client's seven sentence starters (direct
 *  instruction, 2026-11-12). The coach's planning wizard asks eight questions
 *  in its own words; the two lists are not meant to line up. */
export const CLIENT_PLANNING_QUESTIONS = [
  'I decided to take part in Care2Sleep because…',
  'I’m hoping that…',
  'If my sleep improved, I would feel…',
  'If my sleep improved, I would be able to…',
  'The first thing I would like to change about my sleep is…',
  'I will know it’s working when…',
  'Something that might get in my way is…',
] as const

/** Sessions 1-6 — the same five every time. */
export const CLIENT_SESSION_QUESTIONS = [
  'One small step I feel confident starting with is…',
  'I will do it (when and where)…',
  'What will help me do it is… (a reminder, a person, a change to my room)',
  'Something that might get in my way is…',
  'If something gets in my way, I will…',
] as const

/** ⚠️ DUMMY — the one planning answer set every client shows. */
const DEFAULT_PLANNING_ANSWERS = [
  'We want our days to feel easier, and we are both tired of broken nights.',
  'We will wake up less in the night, and fall asleep sooner.',
  'Calmer at bedtime, and more patient with each other during the day.',
  'Get back to the weekly community group, and take a morning walk together.',
  'Going to bed at the same time every night.',
  'It takes less time to fall asleep, and we feel rested in the morning.',
  'Long afternoon naps, and evenings when family visits run late.',
]

/** ⚠️ DUMMY — the one session answer set every client shows. The first answer
 *  is long on purpose: it is the "client wrote a lot" case, which is what the
 *  note's 4-line clamp and its Show all button exist for. */
const DEFAULT_SESSION_ANSWERS = [
  'Getting outside in the morning light for 15 minutes after breakfast. My daughter Sarah said she would come with me on Saturdays, and on the other days Bruce will walk with me if his knee is up to it. If it is too cold we will stand on the front porch with our tea for a few minutes instead, because the light still helps.',
  'Every morning around 9 am, after breakfast, with a short walk to the letterbox and back.',
  'A note on the fridge, and my shoes left by the back door the night before.',
  'Cold or rainy mornings, and days with early appointments.',
  'Sit by the brightest window instead, or move my walk to after lunch.',
]

/** The panel heading — one per kind of session, never per session number
 *  (direct instruction: "Keep each session title to What I'll try this week"). */
export const CLIENT_PLANNING_GOALS_TITLE = 'What matters to me'
export const CLIENT_SESSION_GOALS_TITLE = 'What I’ll try this week'

export function clientGoalNotes(isPlanning: boolean): { question: string; answer: string }[] {
  const questions = isPlanning ? CLIENT_PLANNING_QUESTIONS : CLIENT_SESSION_QUESTIONS
  const answers = isPlanning ? DEFAULT_PLANNING_ANSWERS : DEFAULT_SESSION_ANSWERS
  return questions.map((question, i) => ({ question, answer: answers[i] ?? '' }))
}
