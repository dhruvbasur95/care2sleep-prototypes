/**
 * THE COACH TRAINING CURRICULUM — the catalogue of modules a coach trainee
 * works through during Stage C (Content learning) of the COACH pathway.
 *
 * This is reference data, not per-person data. It answers "what modules exist
 * and in what order"; a given trainee's progress through them lives in
 * `Coach.moduleRecords` (`research.ts`), one record per module, joined on `id`.
 *
 * `PATHWAY_MODULES_V2.length` (currently 11: 4 Foundational + 7 Sleep) is the
 * denominator for every "modules completed" figure the researcher sees — the
 * roster column, the KPI tiles, the Learning Progress accordion. Adding or
 * removing an entry moves all of them at once, which is the point: there is
 * one list.
 *
 * DO NOT rename an `id`. Ids are internal join keys and are load-bearing in
 * two places that will not error if they drift:
 *   - `research.ts`'s `moduleQuestionBank` attaches each module's scenario
 *     prompt and knowledge-check questions by id. Only 8 of the 11 modules
 *     have a bank; the other 3 (`building-blocks-good-sleep`,
 *     `retraining-brain-sleep`, `resetting-body-clock`) score as null rather
 *     than zero, and that is a known content gap, not a data error.
 *   - Every `ModuleRecord.moduleId` in the seed data.
 * The first four ids no longer describe their own titles — `portal-orientation`
 * is titled "Know the project, know your client", `siptea-framework-v2` is
 * "Onboarding and getting set up", and so on. That drift is deliberate and
 * frozen: titles were revised to match the study's curriculum document, ids
 * were not. When joining content to a module, the ID is authoritative and the
 * title is display text.
 *
 * `status` and `progress` on each entry are demo state for the coach's own
 * training portal, which is NOT part of this handover package. The Research
 * Dashboard ignores both fields entirely — it reads `Coach.moduleRecords`. Do
 * not surface them on a researcher screen; they describe nobody in particular.
 *
 * Not to be confused with `spaces.ts`'s `CONSUMER_MODULES` (7 entries), the
 * separate content library the *consumer* works through during SPACES
 * delivery. Different ids, different counts, both called "modules" in UI copy.
 */

export type TrainingModuleV2Status = 'not-started' | 'in-progress' | 'completed'

export interface TrainingModuleV2 {
  /** Internal join key. Frozen — see the file header. Never shown to a user. */
  id: string
  title: string
  description: string
  /** Coach-portal demo state only. The Research Dashboard never reads this;
   *  a trainee's real status is their own `ModuleRecord` in `research.ts`. */
  status: TrainingModuleV2Status
  /** 0–100. Coach-portal demo state only, same caveat as `status`. */
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
// The curriculum is 11 modules. A third "Practice" tier with one module was
// removed; some Figma frames still read "1/12 modules complete" and are stale.
// Derive counts from `PATHWAY_MODULES_V2.length`, never from a literal.

/**
 * The curriculum's named tiers, for display grouping only. Every module in
 * `PATHWAY_MODULES_V2` belongs to exactly one tier, and `moduleIds` must list
 * them in the same relative order as the flat array above: lock state is
 * computed from a module's index in `PATHWAY_MODULES_V2`, not from anything
 * tier-relative, so a tier listing its modules out of order would show a coach
 * one sequence while gating them by another.
 *
 * Invariant worth asserting: the union of every tier's `moduleIds` equals the
 * set of ids in `PATHWAY_MODULES_V2`, with no duplicates and none missing.
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
    // Both tier subtitles deliberately share the construction "The [what]
    // you'll [verb] to/before [outcome], module by module." They are read as a
    // pair on one screen; change them together or not at all. "Shared
    // language" is the study's own term for SIPTEA, not filler.
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
    // Keep the content team's internal chapter naming ("Opening / Know What /
    // Know How / Know Why") out of this copy — it is instructional-design
    // vocabulary, not something a coach needs or recognises.
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

// Both portals read `MODULE_GROUPS`, so the coach's view of the curriculum and
// the researcher's view cannot disagree about what it contains. Keep it that
// way: do not hand-list module ids on a screen.
