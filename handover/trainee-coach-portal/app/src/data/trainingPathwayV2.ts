/**
 * Round 8 (direct UI update, Coach Training Portal Option B home page
 * redesign) — an Option-B-only real curriculum dataset, entirely separate
 * from `data/portal.ts`'s shared `modules` array.
 *
 * Why a separate file: `pathway.ts`'s old `PATHWAY_MODULES` sliced the first
 * 6 entries off the shared `modules` array, which `/training` (Option A)
 * also reads directly. Expanding that shared array to 11 items would have
 * changed Option A's module count too — a real behavior change to a portal
 * version this project has a hard standing rule never to touch. This file
 * gives Option B its own entry list (id/title/description/
 * estimatedMinutes/status/progress/cover colors) with no `slides` field —
 * this card style doesn't show slide composition, so there's nothing to
 * derive it from.
 *
 * New round — retitled/regrouped to match the project's updated curriculum
 * overview (3 named tiers: Foundational modules, Sleep modules, Practice
 * module), replacing the earlier flat 11-item list with 12 items in the same
 * relative order (the 7 Sleep-modules titles already matched the curriculum
 * doc exactly; only the first 4 — now the Foundational tier — needed
 * retitling, and a new 12th entry was added for the Practice tier). Ids on
 * the first 4 entries are intentionally left unchanged from their pre-rename
 * values (`portal-orientation`, `population-understanding`, etc.) even
 * though they no longer match their new titles verbatim — `pathway.ts`'s
 * `DEMO_PLAYER_REDIRECTS` keys off `population-understanding` specifically,
 * and renaming ids purely for cosmetic id/title symmetry risked silently
 * breaking that redirect for no real benefit (ids are internal keys, never
 * shown to a coach). See `MODULE_GROUPS` below for the tier grouping itself.
 *
 * Module 5 ("Understanding Sleep") is keyed `'understanding-sleep'` — the
 * one module Round 7 already built a full content player for for (previously
 * the Round 1-era `'sleep-basics'` id in `data/portal.ts`). See
 * `MODULE_PLAYER_ID` in `pathway.ts` and `MODULE_CONTENT` in
 * `data/moduleContent.ts`, both re-keyed to match.
 *
 * Demo status spread (forced-linear, `moduleState()` in `pathway.ts` derives
 * "current"/"upcoming" dynamically from whichever module is
 * first-incomplete — the `status` values below are the one source of truth
 * that drives it, not a hardcoded per-card visual state): module 1 ("Know
 * the project, know your client") completed; module 2 ("Your coaching
 * toolkit") not-started, making it the one reachable "current" module (the
 * first incomplete one); every module after it not-started, all
 * locked/upcoming since they sit after the first incomplete module.
 *
 * Consequence worth flagging: this puts module 5 ("Understanding Sleep" —
 * the one module Round 7 built a full content player for) behind the
 * forced-linear lock by default. It only becomes reachable once a coach
 * progresses through the rest of the Foundational tier first (or someone
 * manually adjusts demo status/localStorage) — not a bug, just where the
 * module currently sits in the real curriculum order per direct instruction.
 */

export type TrainingModuleV2Status = 'not-started' | 'in-progress' | 'completed'

export interface TrainingModuleV2 {
  id: string
  title: string
  description: string
  status: TrainingModuleV2Status
  /** 0–100; only meaningful for in-progress modules. */
  progress: number
  /** [wash, top-left bloom, bottom-right bloom] — same `moduleArt()` gradient
   *  wash technique every other module card in this app uses. */
  cover: {
    colors: readonly [string, string, string]
  }
  estimatedMinutes: number
}

export const PATHWAY_MODULES_V2: TrainingModuleV2[] = [
  {
    id: 'portal-orientation',
    title: 'Know the project, know your client',
    description:
      "Get to know the Care2Sleep project and the people you'll be supporting — coaches, consumers, and their carers.",
    status: 'completed',
    progress: 100,
    cover: { colors: ['#1c2b4a', '#5b7fa6', '#f0d9a8'] },
    estimatedMinutes: 35,
  },
  {
    id: 'population-understanding',
    title: 'Your coaching toolkit',
    description:
      "The core coaching skills, tools and resources you'll draw on throughout every session.",
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#e8dcc8', '#c98a5e', '#8fa89a'] },
    estimatedMinutes: 35,
  },
  {
    id: 'program-structure-onboarding',
    title: 'SIPTEA framework',
    description:
      'Introduction to the SIPTEA coaching framework and how to apply it throughout the program.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#2e2a4d', '#8b7fc7', '#c9b8e8'] },
    estimatedMinutes: 35,
  },
  {
    id: 'siptea-framework-v2',
    title: 'Onboarding and getting set up',
    description:
      "Get comfortable with the platform interface and the tools you'll use throughout your training.",
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#e9f2ec', '#6fa88a', '#e8c9a0'] },
    estimatedMinutes: 35,
  },
  {
    id: 'understanding-sleep',
    title: 'Understanding Sleep',
    description:
      'Core concepts of sleep science, sleep cycles, and what healthy sleep looks like.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#f3e4e2', '#c97b6e', '#e8b98f'] },
    estimatedMinutes: 35,
  },
  {
    id: 'building-blocks-good-sleep',
    title: 'Building Blocks of Good Sleep',
    description:
      'Foundational habits and behaviours that support consistent, quality sleep.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#f2e6c8', '#e0a458', '#6b5b45'] },
    estimatedMinutes: 35,
  },
  {
    id: 'retraining-brain-sleep',
    title: 'Retraining Your Brain Where to Sleep',
    description:
      'Techniques for strengthening the association between the bed and sleep.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#dce8ec', '#5a8ca3', '#a7c4b8'] },
    estimatedMinutes: 35,
  },
  {
    id: 'resetting-body-clock',
    title: 'Resetting Your Body Clock',
    description:
      'Strategies for aligning circadian rhythms and improving sleep-wake timing.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#232838', '#4a6fa1', '#7fd1c9'] },
    estimatedMinutes: 35,
  },
  {
    id: 'setting-stage-sleep',
    title: 'Setting the Stage for Sleep',
    description:
      'Creating the right environment and routine to prepare for restful sleep.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#eef0e6', '#8a9a5b', '#d8c7a1'] },
    estimatedMinutes: 35,
  },
  {
    id: 'managing-fatigue',
    title: 'Understanding and Managing Fatigue',
    description:
      'Recognising fatigue, its impact, and practical management strategies for carers.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#f0e2e6', '#b4728f', '#e8c9a8'] },
    estimatedMinutes: 35,
  },
  {
    id: 'keeping-sleep-on-track',
    title: 'Keeping Sleep on Track',
    description:
      'Maintaining progress, troubleshooting setbacks, and sustaining healthy sleep habits.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#1e2f2b', '#3f6d5e', '#a8d8c9'] },
    estimatedMinutes: 35,
  },
]
// Round 29, direct instruction: "there is no more any practice module". The
// 12th entry (`sleep-modules-practice`) and the Practice tier it belonged to
// are gone, so the curriculum is 11 modules — 4 Foundational + 7 Sleep, which
// is what `MODULE_GROUPS` below already sums to. The Figma frame still reads
// "1/12 modules complete" beside tier counts of 1/4 and 0/7; that arithmetic
// only worked while Practice existed, so the live count is 11 and the frame's
// total is stale.

/**
 * The 2 named curriculum tiers with more than one module (Foundational
 * modules / Sleep modules), per this project's curriculum overview doc —
 * grouping metadata only; `moduleIds` order within each tier must match each
 * module's actual position in `PATHWAY_MODULES_V2` above, since the
 * forced-linear lock state (`pathway.ts`'s `moduleState()`) is computed from
 * that flat array's index, not from anything tier-relative. Consumed by
 * `ModuleTimeline.tsx` to render one canvas per tier. Round 29: these two
 * tiers are now the *whole* curriculum — the Practice tier and its single
 * module were removed on direct instruction, so 4 + 7 = 11 modules total.
 */
export interface ModuleGroup {
  key: string
  title: string
  subtitle?: string
  moduleIds: string[]
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    key: 'foundational',
    title: 'Foundational modules',
    // Rewritten via a real /design:ux-copy pass to match Sleep's own
    // subtitle voice below, per direct instruction ("yes i want copy tone
    // to be consistent") after Sleep's copy was rewritten for a separate,
    // unrelated jargon complaint and the two no longer read as one pair.
    // Old copy ("Essential knowledge to begin coaching, module by module.")
    // was dry/descriptive, third-person-ish — a content-category label, not
    // something addressed to the coach. Rewritten to the same "The [what]
    // you'll [verb] to/before [outcome]" construction Sleep's subtitle
    // uses, speaking directly to the coach about what this tier sets them
    // up to do rather than just naming the content category. "Shared
    // language" is a deliberate, accurate callback to this project's own
    // established SIPTEA terminology (CLAUDE.md: "used as the shared
    // language across all training, assessment, feedback, and
    // supervision"), not an invented phrase — this tier's 4 modules are
    // Portal Orientation, Population Understanding, Program Structure &
    // Technical Onboarding, and the SIPTEA Framework itself, so "orientation
    // and shared language" accurately covers all 4 without listing them.
    // "...module by module" kept verbatim, still the shared phrase tying
    // both subtitles together as one sequence.
    subtitle: "The orientation and shared language you'll need before you start coaching, module by module.",
    moduleIds: [
      'portal-orientation',
      'population-understanding',
      'program-structure-onboarding',
      'siptea-framework-v2',
    ],
  },
  {
    key: 'sleep',
    title: 'Sleep modules',
    // Rewritten via a real /design:ux-copy pass — direct feedback that the
    // previous copy ("Core curriculum... The chapter structure (Opening,
    // Know What, Know How, Know Why) applies to this tier only.") exposed
    // the content team's own internal instructional-design chapter-naming
    // scheme to coaches who don't need it, reading like content-design
    // documentation instead of orientation copy ("too technical... what
    // should I expect from these modules"). Rewritten to answer that
    // question directly — what this tier actually covers and why it
    // matters — with zero mention of "chapters," "Opening/Know What/Know
    // How/Know Why," or any other internal naming. Still reuses "module by
    // module" from the Foundational tier's own subtitle for the same
    // consistency reason as before, but the surrounding register shifted
    // from dry/descriptive to benefit-oriented ("what you'll use to help
    // consumers") — flagged back as its own open question (not silently
    // applied) whether Foundational's own subtitle should get a matching
    // tone pass now that the two no longer share a register, just a phrase.
    subtitle: "The science and techniques you'll use to help consumers sleep better, module by module.",
    moduleIds: [
      'understanding-sleep',
      'building-blocks-good-sleep',
      'retraining-brain-sleep',
      'resetting-body-clock',
      'setting-stage-sleep',
      'managing-fatigue',
      'keeping-sleep-on-track',
    ],
  },
]

// `PRACTICE_MODULE_ID` was removed with the Practice tier (Round 29). Its two
// readers — `ModuleTimeline`'s standalone `PracticeModuleCard` and the Research
// Dashboard's module-engagement accordion — were removed with it, so both the
// coach's and the researcher's view of the curriculum stay in agreement.
