import {
  CONSUMER_MODULES,
  CONSUMER_MODULE_COUNT,
  moduleByNumber,
  type ConsumerDyad,
} from '@/data/spaces'

/**
 * What the Consumer Portal knows about a consumer's lessons — shared by Home's
 * `LearningTaskCard` and the My Lessons page, so the two surfaces cannot name a
 * different lesson as "this week's".
 *
 * That is not hypothetical. Before this file existed, Home picked "the first
 * module not yet completed" inline, which for the demo dyad is Lesson 1 — while
 * the only sensible reading for a page headed "Lesson of the week" is the newest
 * lesson released. Two pages, one fact, two answers, which is this project's
 * most-repeated data bug.
 *
 * ── Why "released" is read off engagement, not off `moduleUnlockState` ──────
 *
 * `moduleUnlockState` says a module unlocks when the coach marks session N
 * complete. Round 39 recorded a direct correction that "marking a session
 * complete has nothing to do with module unlocking", and the demo data agrees
 * with the correction rather than the helper: dyad-011 has Lesson 4 genuinely
 * in progress while session 4 is still the *upcoming* one. Reading the unlock
 * helper here would hide a lesson the consumer has demonstrably opened.
 *
 * So a lesson is "released" if the consumer has touched it, or if it sits below
 * one they have. That can never hide real progress, and it needs no second
 * field that could disagree with `moduleEngagement`.
 */

/** No module carries a duration, so length is `slideCount` x a stated rate.
 *  One constant, read by every surface that prints a "~N mins" figure. */
export const MINUTES_PER_SLIDE = 2.5

/** The three states every lesson card renders — the six Figma frames are these
 *  three against two surfaces (the week's lesson, and a previous lesson). */
export type LessonState = 'start' | 'resume' | 'complete'

export interface LessonView {
  /** The module NUMBER, 1-6. (Was "position in `CONSUMER_MODULES`", which
   *  only coincided with the number while a pre-module sat at index 0.) */
  index: number
  id: string
  title: string
  /** Always "Module N", N >= 1 (Round 46 — this portal says module, not
   *  lesson; see `ConsumerHeader`'s NAV note). */
  label: string
  state: LessonState
  /** Whole minutes for the full lesson. */
  totalMinutes: number
  /** Whole minutes remaining, only meaningful while `state === 'resume'`. */
  minutesLeft: number
  /** 0-1, only meaningful while `state === 'resume'`. */
  progress: number
}

/** The page's own headline count. Now simply the curriculum's size — the
 *  pre-module that made this a special case is gone, and `CONSUMER_MODULE_COUNT`
 *  is itself asserted equal to `SPACES_CATCHUP_COUNT`. Derived so the sentence
 *  cannot drift from the curriculum, which is how "five stages" ended up over a
 *  six-stage rail three times in the coach portal. */
export const NUMBERED_LESSON_COUNT = CONSUMER_MODULE_COUNT

function viewFor(index: number, dyad: ConsumerDyad): LessonView {
  // `index` is the module NUMBER, so the lookup goes through `moduleByNumber`.
  const mod = moduleByNumber(index)!
  const record = dyad.moduleEngagement.find((r) => r.moduleId === mod.id)
  const slides = record?.slidesCompleted ?? 0
  const totalMinutes = Math.round(mod.slideCount * MINUTES_PER_SLIDE)

  // `in-progress` with zero slides viewed is still a start, not a resume: a
  // progress bar at 0% and a "Resume" label both claim something happened.
  const state: LessonState =
    record?.status === 'completed' ? 'complete' : slides > 0 ? 'resume' : 'start'

  const progress = mod.slideCount > 0 ? Math.min(1, slides / mod.slideCount) : 0

  return {
    index,
    id: mod.id,
    title: mod.title,
    label: `Module ${index}`,
    state,
    totalMinutes,
    // Floored at 1: "~0 mins left" on a lesson that is not finished reads as a
    // bug. A finished lesson is `complete` and never prints this.
    minutesLeft: Math.max(1, Math.round(totalMinutes * (1 - progress))),
    progress,
  }
}

/**
 * Every lesson the consumer has been released, newest first.
 *
 * `[0]` is the week's lesson and the rest are the "Previous lessons" list —
 * one ordering, so the featured card and the list below it cannot both claim
 * the same lesson or leave one out between them.
 */
export function releasedLessons(dyad: ConsumerDyad): LessonView[] {
  // The highest module NUMBER this consumer has touched.
  let highestTouched = 0
  CONSUMER_MODULES.forEach((mod, i) => {
    const record = dyad.moduleEngagement.find((r) => r.moduleId === mod.id)
    if (record && record.status !== 'not-started') highestTouched = Math.max(highestTouched, i + 1)
  })

  /* Round 43's instruction — "consumer modules will start from lesson 1. so no
     getting started" — is now satisfied by the data rather than by this loop
     skipping an entry: the pre-module was deleted from the curriculum on
     2026-10-09, so module 1 IS the first module and no label can read
     "Module 0". The guard stays at >= 1 because that is simply where the
     numbering starts. */
  const views: LessonView[] = []
  for (let n = highestTouched; n >= 1; n -= 1) views.push(viewFor(n, dyad))
  return views
}
