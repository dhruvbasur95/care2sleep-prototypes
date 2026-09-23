import { MODULE_CONTENT, type ModuleContent } from './moduleContent'

/**
 * Content for the Module Overview page (`ModuleOverviewPage.tsx`) — the
 * page a coach lands on before entering the player.
 *
 * ## It is derived, not authored
 * This file used to hold its own hand-written chapter list, its own chapter
 * titles, and three invented "By the end of this module" outcome bullets.
 * That is the drift this project keeps having to undo: the overview page and
 * the player's outline rail are two renderings of **one** module structure,
 * and the moment they are written independently they disagree — the first
 * time a scenario is added to a chapter, or a chapter is retitled.
 *
 * So everything structural now comes straight out of `MODULE_CONTENT`, the
 * same parse the player runs on. The only thing stored here is the one thing
 * `module.md` genuinely does not carry: a rough duration per section.
 *
 * ## Where the page's prose comes from
 * The module.md "MODULE SETUP" / "Module brief" table — which sits outside
 * the slide sequence and is not a slide. Direct instruction (2026-09-15):
 * its **Core message** replaces the old invented outcomes card, and its
 * **Core skills** list becomes its own card. Nothing on this page is written
 * by hand any more except the duration estimates below.
 */

/** Rough section durations. The authoring format carries no timings at all,
 *  so these are estimates, not source content — the one hand-written thing
 *  left on this page, and flagged as such. Keyed by slide id so a chapter
 *  gaining a scenario does not silently shift someone else's estimate. */
/**
 * The only hand-written content left on the overview page.
 *
 * **Reviewed and deliberately kept, 2026-09-16.** module.md carries no duration
 * anywhere (workflow §6.1 item 6), so these cannot be derived from the source,
 * and a slide count is not a time — a 40-word transition and a five-minute video
 * are both one slide. Inventing a formula would produce a confident number with
 * nothing behind it.
 *
 * What the §C note asked for instead — that they read as estimates — the UI
 * already does, in both places they appear: the hero says "Estimated Time:
 * Approx. N min" and every row is prefixed "~". So this closes as *labelled*,
 * not as *sourced*; a duration row in the authoring template is still the real
 * fix.
 */
const DURATIONS: Record<string, string> = {
  intro: '~2 min',
  'chapter-1': '~15 min',
  'chapter-2': '~15 min',
  'chapter-3': '~20 min',
  outro: '~3 min',
}

export interface ModuleOverviewChapter {
  id: string
  number: number
  title: string
  durationLabel: string
  /** How many slides this chapter actually has — derived, so a
   *  multi-scenario chapter reports its real length. */
  slideCount: number
}

export interface ModuleOverviewContent {
  moduleId: string
  /** The MODULE SETUP table's Core message. */
  coreMessage: string
  coreSkillsIntro: string
  coreSkills: string[]
  introDurationLabel: string
  chapters: ModuleOverviewChapter[]
  outroDurationLabel: string
}

function deriveOverview(content: ModuleContent): ModuleOverviewContent {
  return {
    moduleId: content.moduleId,
    coreMessage: content.setup.coreMessage,
    coreSkillsIntro: content.setup.coreSkillsIntro,
    coreSkills: content.setup.coreSkills,
    introDurationLabel: DURATIONS.intro,
    chapters: content.chapters.map((chapter) => ({
      id: `ch${chapter.number}`,
      number: chapter.number,
      title: chapter.title,
      durationLabel: DURATIONS[`chapter-${chapter.number}`] ?? '~15 min',
      slideCount: chapter.slides.length,
    })),
    outroDurationLabel: DURATIONS.outro,
  }
}

export const MODULE_OVERVIEW_CONTENT: Record<string, ModuleOverviewContent> =
  Object.fromEntries(
    Object.entries(MODULE_CONTENT).map(([id, content]) => [id, deriveOverview(content)]),
  )
