/**
 * Round 1 dummy data — domain-realistic placeholder content only.
 * Copy source: design/ux-copy.md. Terminology per CLAUDE.md
 * (Coach / Consumer / Annotation summary).
 */

export type ModuleStatus = 'not-started' | 'in-progress' | 'completed'

export type SlideKind = 'content' | 'video' | 'scenario' | 'knowledge-check'

export interface Slide {
  id: string
  title: string
  kind: SlideKind
  body: string[]
}

export interface TrainingModule {
  id: string
  title: string
  description: string
  status: ModuleStatus
  /** 0–100; only meaningful for in-progress modules */
  progress: number
  /**
   * [wash, top-left bloom, bottom-right bloom] — composed by `ModuleCard`
   * into a soft two-bloom gradient thumbnail (Apple-style soft light), a
   * stand-in for real module photography until Round 1's asset pipeline
   * exists.
   */
  cover: {
    colors: readonly [string, string, string]
  }
  slides: Slide[]
  /** Approx. minutes to complete — Round 7 addition, used by the new
   *  Coach Training Portal's module timeline cards. */
  estimatedMinutes: number
}

export const coach = {
  firstName: 'Helen',
  fullName: 'Helen Zhang',
  initials: 'HZ',
  role: 'Coach',
  organisation: "St Brigid's Aged Care",
  participantId: 'C2S-C-010',
  trainingStage: 'Phase 8: Entry into SPACES delivery',
  email: 'h.zhang@stbrigids.example.au',
}

/** Shared slide shell — slide content itself is out of Round 1 scope. */
function makeSlides(moduleId: string, topic: string): Slide[] {
  const p = (n: number) => [
    `Placeholder content for "${topic}". In later rounds this slide will hold the real learning material for this part of the module: text, imagery and activities drawn from the Care2Sleep content team's work.`,
    `This is paragraph ${n} of dummy body text so the canvas has a realistic reading length. It should read comfortably at 17px with relaxed leading, and the page should scroll naturally when content runs long.`,
  ]
  return [
    {
      id: `${moduleId}-s1`,
      title: "Welcome and what you'll learn",
      kind: 'content',
      body: p(1),
    },
    { id: `${moduleId}-s2`, title: 'Key ideas', kind: 'content', body: p(2) },
    {
      id: `${moduleId}-s3`,
      title: 'Watch: a coaching conversation',
      kind: 'video',
      body: p(3),
    },
    {
      id: `${moduleId}-s4`,
      title: 'Scenario: try it yourself',
      kind: 'scenario',
      body: p(4),
    },
    {
      id: `${moduleId}-s5`,
      title: 'Check your understanding',
      kind: 'knowledge-check',
      body: p(5),
    },
    {
      id: `${moduleId}-s6`,
      title: "Summary and what's next",
      kind: 'content',
      body: p(6),
    },
  ]
}

export const modules: TrainingModule[] = [
  {
    id: 'sleep-basics',
    title: 'Sleep Basics for Dementia Care',
    description:
      'Why sleep changes with dementia, and what healthy sleep looks like.',
    status: 'completed',
    progress: 100,
    cover: { colors: ['#1c2b4a', '#5b7fa6', '#f0d9a8'] },
    slides: makeSlides('sleep-basics', 'Sleep Basics for Dementia Care'),
    estimatedMinutes: 12,
  },
  {
    id: 'coach-role',
    title: 'Understanding the Coach Role',
    description:
      'What sleep coaching is and how it differs from clinical care.',
    status: 'completed',
    progress: 100,
    cover: { colors: ['#e8dcc8', '#c98a5e', '#8fa89a'] },
    slides: makeSlides('coach-role', 'Understanding the Coach Role'),
    estimatedMinutes: 10,
  },
  {
    id: 'siptea-framework',
    title: 'The SIPTEA Framework',
    description:
      "The six components you'll use in every coaching conversation.",
    status: 'in-progress',
    progress: 65,
    cover: { colors: ['#2e2a4d', '#8b7fc7', '#c9b8e8'] },
    slides: makeSlides('siptea-framework', 'The SIPTEA Framework'),
    estimatedMinutes: 15,
  },
  {
    id: 'shared-understanding',
    title: 'Building Shared Understanding',
    description: 'Starting where the consumer is: listening, goals, and trust.',
    status: 'in-progress',
    progress: 30,
    cover: { colors: ['#e9f2ec', '#6fa88a', '#e8c9a0'] },
    slides: makeSlides('shared-understanding', 'Building Shared Understanding'),
    estimatedMinutes: 14,
  },
  {
    id: 'difficult-emotions',
    title: 'Navigating Difficult Emotions',
    description:
      'Supporting consumers and carers through frustration, grief and worry.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#f3e4e2', '#c97b6e', '#e8b98f'] },
    slides: makeSlides('difficult-emotions', 'Navigating Difficult Emotions'),
    estimatedMinutes: 13,
  },
  {
    id: 'environments-routines',
    title: 'Sleep Environments and Routines',
    description:
      'Practical changes to light, noise, timing and daily rhythm.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#f2e6c8', '#e0a458', '#6b5b45'] },
    slides: makeSlides('environments-routines', 'Sleep Environments and Routines'),
    estimatedMinutes: 11,
  },
  {
    id: 'working-with-carers',
    title: 'Working with Carers',
    description: 'Coaching the carer–consumer pair without taking sides.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#dce8ec', '#5a8ca3', '#a7c4b8'] },
    slides: makeSlides('working-with-carers', 'Working with Carers'),
    estimatedMinutes: 12,
  },
  {
    id: 'sleep-data',
    title: 'Using Sleep Data in Conversations',
    description:
      'Reading sleep diaries and Fitbit summaries with a coaching lens.',
    status: 'not-started',
    progress: 0,
    cover: { colors: ['#232838', '#4a6fa1', '#7fd1c9'] },
    slides: makeSlides('sleep-data', 'Using Sleep Data in Conversations'),
    estimatedMinutes: 14,
  },
]

