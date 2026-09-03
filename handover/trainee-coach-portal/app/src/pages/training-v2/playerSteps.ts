import type { ModuleContent } from '@/data/moduleContent'

/**
 * The module player's flat, ordered step machine — generic over chapter
 * count (works for Module 4's 2 chapters today, N chapters later without a
 * shape change). Each `PlayerStep` is one top-level screen the player can
 * land on; `moduleProgressStore.ts` persists only the *index* into this
 * array, never per-question/per-video state.
 */
export type PlayerStep =
  | { kind: 'intro' }
  | { kind: 'chapter-marker'; chapterIndex: number }
  | { kind: 'learn'; chapterIndex: number }
  | { kind: 'case'; chapterIndex: number; caseIndex: number }
  | { kind: 'knowledge-check'; chapterIndex: number }
  | { kind: 'what-to-expect'; chapterIndex: number }
  | { kind: 'chapter-complete'; chapterIndex: number }
  | { kind: 'outro' }
  | { kind: 'feedback' }
  | { kind: 'complete' }

/**
 * intro → for each chapter [chapter-marker, learn, case×3, knowledge-check,
 * what-to-expect, chapter-complete] → outro → feedback → complete.
 *
 * `feedback` (Round 22 direct edit) is the trainee's own end-of-module
 * rating + comment (`ModuleFeedbackSlide.tsx`) — always the single step
 * right after `outro` and right before `complete`, regardless of chapter
 * count (see `feedbackStepIndex` below).
 */
export function buildPlayerSteps(content: ModuleContent): PlayerStep[] {
  const steps: PlayerStep[] = [{ kind: 'intro' }]

  content.chapters.forEach((chapter, chapterIndex) => {
    steps.push({ kind: 'chapter-marker', chapterIndex })
    steps.push({ kind: 'learn', chapterIndex })
    chapter.cases.forEach((_, caseIndex) => {
      steps.push({ kind: 'case', chapterIndex, caseIndex })
    })
    steps.push({ kind: 'knowledge-check', chapterIndex })
    steps.push({ kind: 'what-to-expect', chapterIndex })
    steps.push({ kind: 'chapter-complete', chapterIndex })
  })

  steps.push({ kind: 'outro' })
  steps.push({ kind: 'feedback' })
  steps.push({ kind: 'complete' })

  return steps
}

/** Fixed step count for one chapter's run of the machine above:
 *  chapter-marker, learn, case×3, knowledge-check, what-to-expect,
 *  chapter-complete. Holds for any chapter since `Chapter.cases` is a fixed
 *  "exactly 3" per `data/moduleContent.ts`'s own documented invariant. Lets
 *  callers (the module overview page) compute chapter/outro step ranges
 *  without needing a module's full `ModuleContent` (just its chapter
 *  count) — used to derive outline-row state from the same stored step
 *  index the player itself reads. */
export const STEPS_PER_CHAPTER = 8

export function chapterStepRange(chapterIndex: number): { start: number; end: number } {
  const start = 1 + chapterIndex * STEPS_PER_CHAPTER
  return { start, end: start + STEPS_PER_CHAPTER - 1 }
}

export function outroStepIndex(chapterCount: number): number {
  return 1 + chapterCount * STEPS_PER_CHAPTER
}

/** The feedback step always sits immediately after outro, one before
 *  `complete` — see `buildPlayerSteps`'s own doc comment. */
export function feedbackStepIndex(chapterCount: number): number {
  return outroStepIndex(chapterCount) + 1
}

/** Shared 3-state progress language (`ModuleOverviewPage`'s outline rows,
 *  the module player's own header bar, §29) so both surfaces agree on
 *  exactly the same percentage for the chapter a coach is currently in —
 *  previously computed inline and separately in each place. */
export type ChapterProgressState = 'completed' | 'current' | 'locked'

export function chapterProgress(
  stepIndex: number,
  chapterIndex: number,
): { state: ChapterProgressState; progressPercent?: number } {
  const { start, end } = chapterStepRange(chapterIndex)
  const state: ChapterProgressState =
    stepIndex > end ? 'completed' : stepIndex >= start ? 'current' : 'locked'
  const progressPercent =
    state === 'current' ? Math.round(((stepIndex - start) / (end - start)) * 100) : undefined
  return { state, progressPercent }
}

/** Same 3-state shape as `chapterProgress`, for a single-step marker (the
 *  module intro at step 0, the module outro at `outroStepIndex(chapterCount)`)
 *  rather than an 8-step chapter span — there's no internal sub-progress to
 *  report for a one-step marker, just whether it's behind, on, or ahead. */
export function edgeStepProgress(stepIndex: number, markerIndex: number): { state: ChapterProgressState } {
  return {
    state: stepIndex > markerIndex ? 'completed' : stepIndex === markerIndex ? 'current' : 'locked',
  }
}
