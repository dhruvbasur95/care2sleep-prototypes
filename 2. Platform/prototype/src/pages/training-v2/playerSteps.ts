import type { ModuleContent, Slide } from '@/data/moduleContent'

/**
 * The module player's flat, ordered step machine.
 *
 * ## One module.md slide = one player step
 * The authoring format already decides where the breaks go: every
 * `| Slide N |` row in a `module.md` file is one screen, and the tagged
 * blocks underneath it stack inside that screen in source order. So this
 * file does not invent a structure — it flattens the parsed slide tree and
 * tags each step with the outline section it belongs to.
 *
 * ## Why there is no arithmetic here any more
 * The previous version computed step positions from constants
 * (`STEPS_PER_CHAPTER = 8`, `chapterStepRange`, `outroStepIndex`) because
 * every chapter had an identical shape. Real chapters do not: a chapter
 * repeats its Know How / You Might Also Hear / Your turn / Transition unit
 * once per scenario, and Module 6's three chapters have 1, 1 and 2
 * scenarios — 9, 8 and 11 slides. Any fixed multiplier is wrong for at
 * least one of them, and wrong silently: the outline rail would point at
 * the wrong slides rather than fail.
 *
 * Positions are therefore **found**, not calculated — `sectionRanges()`
 * walks the built array. Adding or removing a scenario is a data change
 * with no arithmetic to update anywhere.
 *
 * `moduleProgressStore.ts` still persists only the *index* into this array.
 */
export type PlayerStep =
  /** A real slide parsed from module.md. */
  | { kind: 'slide'; slide: Slide; section: 'intro' | 'summary' }
  | { kind: 'slide'; slide: Slide; section: 'chapter'; chapterIndex: number }
  /** Shell steps with no module.md slide behind them — the trainee's own
   *  end-of-module rating (Round 22) and the completion screen. Both belong
   *  to the "Summary" outline section. */
  | { kind: 'feedback'; section: 'summary' }
  | { kind: 'complete'; section: 'summary' }

/**
 * intro slide → every chapter's slides in order → outro slide → feedback →
 * complete.
 */
export function buildPlayerSteps(content: ModuleContent): PlayerStep[] {
  const steps: PlayerStep[] = [{ kind: 'slide', slide: content.introSlide, section: 'intro' }]

  content.chapters.forEach((chapter, chapterIndex) => {
    chapter.slides.forEach((slide) => {
      steps.push({ kind: 'slide', slide, section: 'chapter', chapterIndex })
    })
  })

  steps.push({ kind: 'slide', slide: content.outroSlide, section: 'summary' })
  steps.push({ kind: 'feedback', section: 'summary' })
  steps.push({ kind: 'complete', section: 'summary' })

  return steps
}

export interface SectionRange {
  start: number
  end: number
}

/**
 * Where each outline section begins and ends in the built step array —
 * derived by walking it, never by multiplying a per-chapter constant.
 *
 * Read by the player's outline rail **and** the module overview page's
 * outline rows, so the two surfaces cannot disagree about where a chapter
 * starts (the failure this project keeps hitting whenever one fact is
 * rendered off two independently-written sources).
 */
export function sectionRanges(content: ModuleContent): {
  intro: SectionRange
  chapters: SectionRange[]
  summary: SectionRange
} {
  const steps = buildPlayerSteps(content)
  const chapters: SectionRange[] = content.chapters.map(() => ({ start: -1, end: -1 }))
  let intro: SectionRange = { start: 0, end: 0 }
  let summaryStart = steps.length - 1

  steps.forEach((step, i) => {
    if (step.section === 'intro') {
      intro = { start: Math.min(intro.start === -1 ? i : intro.start, i), end: i }
    } else if (step.section === 'chapter') {
      const range = chapters[step.chapterIndex]
      if (range.start === -1) range.start = i
      range.end = i
    } else if (step.section === 'summary') {
      summaryStart = Math.min(summaryStart, i)
    }
  })

  return { intro, chapters, summary: { start: summaryStart, end: steps.length - 1 } }
}

/** Shared 3-state progress language, so the outline rail and the module
 *  overview page report exactly the same state for the same section. */
export type ChapterProgressState = 'completed' | 'current' | 'locked'

export function rangeProgress(
  stepIndex: number,
  { start, end }: SectionRange,
): { state: ChapterProgressState; progressPercent?: number } {
  const state: ChapterProgressState =
    stepIndex > end ? 'completed' : stepIndex >= start ? 'current' : 'locked'
  const span = Math.max(end - start, 1)
  const progressPercent =
    state === 'current' ? Math.round(((stepIndex - start) / span) * 100) : undefined
  return { state, progressPercent }
}
