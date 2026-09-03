/**
 * Round 7.1 (direct UI update, Figma node 1:1433) — content for the new
 * Module Overview page (`ModuleOverviewPage.tsx`), the hub a coach lands
 * on after clicking a module's card CTA on the home timeline, before
 * entering the actual chapter-by-chapter player.
 *
 * Deliberately lighter-weight than `data/moduleContent.ts`'s `ModuleContent`
 * (no learn-video/case/knowledge-check payloads — that's the player's own
 * content, out of scope for this round's "don't touch in-module pages yet"
 * instruction). This is just what the *outline* needs to render: a
 * duration label per section, and the "by the end of this module" outcomes
 * list. Chapter `title`/`number` intentionally mirror `ModuleContent.chapters`
 * 1:1 (same id, title, and count) so the outline never shows a chapter name
 * the player itself doesn't have.
 *
 * Keyed by real content id, same as `MODULE_CONTENT` — `pathway.ts`'s
 * `realPlayerContentId()` resolves a home-timeline module id (e.g.
 * `population-understanding`) to the id this map is actually keyed under
 * (`understanding-sleep`) before looking it up, so module 2's overview page
 * shows this same content per the demo redirect, not a mismatched
 * fabrication of its own.
 */

export interface ModuleOverviewChapter {
  id: string
  number: number
  title: string
  /** A single combined estimate for the whole chapter (Learn + case
   *  examples + knowledge check + what to expect) — distinct from
   *  `ModuleContent.chapters[].learnVideos[].durationLabel`, which is the
   *  Learn video's own runtime only. Made up for this round: reasonable
   *  round numbers, not derived from the player content's finer-grained
   *  timings. */
  durationLabel: string
}

export interface ModuleOverviewContent {
  moduleId: string
  introDurationLabel: string
  chapters: ModuleOverviewChapter[]
  outroDurationLabel: string
  /** "What you will get from this module" — 3 outcomes, grounded in what the
   *  linked chapters actually teach. */
  objectives: string[]
}

export const MODULE_OVERVIEW_CONTENT: Record<string, ModuleOverviewContent> = {
  'understanding-sleep': {
    moduleId: 'understanding-sleep',
    introDurationLabel: '~1 min',
    chapters: [
      { id: 'ch1', number: 1, title: 'How sleep works', durationLabel: '~15 min' },
      {
        id: 'ch2',
        number: 2,
        title: 'Sleep across the lifespan and what can go wrong',
        durationLabel: '~15 min',
      },
    ],
    outroDurationLabel: '~5 min',
    objectives: [
      'Explain how sleep actually works across the night: sleep cycles, NREM/REM stages, and why brief night waking is normal.',
      'Distinguish sleep deprivation from insomnia, and describe how sleep changes with ageing.',
      'Apply a shared-understanding approach when a carer or person living with dementia raises a sleep concern.',
    ],
  },
}
