/**
 * Coach trainee record page — the drill-in behind Trainee Management.
 *
 * Route: `/research/coaches/:coachId` (`App.tsx`), reached from `RosterPage`.
 * Five tabs: Overview, Learning Progress, Stage Management, Supervision Notes,
 * Personal details. This is the largest file in the package.
 *
 * Cross-file wiring, both directions:
 *   - It **imports** `SupervisionRecords` from `SpacesCoachProfilePage.tsx`.
 *   - It **exports** `RecordRowDivider`, which both `SpacesCoachProfilePage.tsx`
 *     and `ConsumerDetailPage.tsx` import. That makes this file and the SPACES
 *     one a **circular import** — fine today (both sides are function
 *     declarations used only at render), but do not add a module-evaluation-time
 *     dependency across it. Break the cycle by moving the shared piece into
 *     `components/` if you need to.
 *   - `SlideCard`, `NoDetailsAvailable`, `LearningFlagsCard`,
 *     `CohortComparisonLine`, `paceIndicator` and `learningFlags` are all
 *     exported with **no importer in this package**. The last four are also
 *     unrendered here — see the preservation notes at their definitions.
 *
 * Two model facts the whole page turns on:
 *
 * 1. **A trainee's stage lives in two places.** `Coach.currentPhase` is seeded
 *    and never written; the researcher's ticks go to the store's separate
 *    `phaseCompletion` / `phaseCompletionDates` slices. They are seeded from
 *    `currentPhase` once at boot and diverge from there. Read `currentPhase`
 *    for "where are they", read `phaseCompletion` for "what has been ticked".
 *    A backend should collapse these into one table.
 *
 * 2. **`inviteStatus` gates almost everything.** A trainee created by the "Add
 *    coach trainee" wizard starts `'pending'`, and pending is currently a
 *    terminal state — nothing in this package can flip it to `'active'`. Four
 *    of the five tabs render `NoDetailsAvailable` while pending. Wiring an
 *    accept-invite endpoint is what makes this page fully live.
 *
 * Every learning figure here is derived from real `ModuleRecord` /
 * `AnnotationSummary` / `ModuleQuestionBank` fields. Nothing invents a
 * schedule field, a SIPTEA score, or a benchmark. Keep it that way.
 */
import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu } from '@base-ui/react/menu'
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Clock,
  Download,
  LayoutDashboard,
  Link2,
  Lock,
  Mail,
  Milestone,
  MoreVertical,
  Star,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { SupervisionRecords } from '@/pages/research/SpacesCoachProfilePage'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { CertificationChip, Chip } from '@/components/research/StatusChip'
import { StatCard } from '@/components/shared/StatCard'
import { Card } from '@/components/ui/card'
import { TabIntro } from '@/components/research/TabIntro'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  MODULE_GROUPS,
  PATHWAY_MODULES_V2,
} from '@/data/trainingPathwayV2'
import {
  getQuestionBank,
  stageLabel,
  stageShortName,
  stageZoomSession,
  STUDY_PHASES,
  type AnnotationSummary,
  type Coach,
  type ModuleQuestionBank,
  type ModuleRecord,
} from '@/data/research'
import { useResearch } from '@/data/research-context'
import { formatDate, formatTime } from '@/data/format'

/** Tab order. This array drives the visible tab-bar order and keyboard
 *  Home/End only — the tab shown on arrival is set separately in
 *  `CoachProfilePage`'s own `useState`.
 *
 *  Casing is intentional and inconsistent-looking: the app-wide sentence-case
 *  rule explicitly exempts tab labels, so the two-word tabs stay Title Case
 *  while "Personal details" does not. There is no Session Recordings tab here;
 *  the SPACES coach page carries its own, independently. */
const TABS = [
  'Overview',
  'Learning Progress',
  'Stage Management',
  'Supervision Notes',
  'Personal details',
] as const
type Tab = (typeof TABS)[number]

/** Per-tab title + sub copy (Figma `93:7`). The tab row names the section in
 *  two words; this says what it is for and what the researcher does with it. */
const TAB_INTRO: Record<Tab, { title: string; subtitle: string }> = {
  Overview: {
    title: 'Trainee overview details',
    subtitle: 'Get a quick sense of where the trainee is and what actions are needed from you',
  },
  'Learning Progress': {
    title: 'Learning progress overview',
    subtitle: 'See which modules this trainee has finished and what they are working through now',
  },
  'Stage Management': {
    title: 'Manage stage progress for this trainee',
    subtitle:
      'Track where your trainee is in their coach certification journey. Mark each stage as complete to advance them to the next one.',
  },
  'Supervision Notes': {
    title: 'Supervision notes',
    subtitle: 'Write and save notes from your supervision sessions with this trainee',
  },
  'Personal details': {
    title: 'Personal details',
    subtitle: 'Contact information and participation record for this trainee',
  },
}

/** The stage pipeline shows exactly the 5 phases that map to a COACH
 *  certification stage: C, O, A, CP, H. Phases 1-2 (Recruitment, Enrolment) are
 *  already done by the time anyone is on the roster and phase 8 (Entry into
 *  SPACES delivery) is post-certification, so none of the three is a stage a
 *  researcher marks complete here.
 *
 *  Filtering on `stageCode` rather than a number range is what guarantees that.
 *  Do not replace it with a range — the mapping is what defines a stage, and a
 *  range silently admits new phases. */
const PIPELINE_PHASES = STUDY_PHASES.filter((p) => p.stageCode)

/** All 5 pipeline stages gate certification. Certification unlocks only when
 *  every one of them is ticked. */
const CERT_REQUIRED_PHASES = PIPELINE_PHASES.map((p) => p.number)

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

function moduleTitle(moduleId: string): string {
  return PATHWAY_MODULES_V2.find((m) => m.id === moduleId)?.title ?? moduleId
}

/** ⚠️ A GUESSED DENOMINATOR. The real curriculum (`trainingPathwayV2.ts`) has
 *  no per-module slide count, so an in-progress module's percentage is computed
 *  against this flat 6 — inherited from a superseded dataset where every module
 *  happened to have 6 slides. It is not a fact about any current module.
 *  Replace it with a real per-module length before anyone treats these
 *  percentages as data. */
const NOMINAL_SLIDE_COUNT = 6

/** Module completion as a percentage. 100 / 0 for completed / not-started are
 *  exact; anything in between is an estimate — see `NOMINAL_SLIDE_COUNT`. */
function completionRate(record: ModuleRecord): number {
  if (record.status === 'completed') return 100
  if (record.status === 'not-started') return 0
  return Math.round(((record.slidesCompleted ?? 0) / NOMINAL_SLIDE_COUNT) * 100)
}

// ---------------------------------------------------------------------------
// Learning Progress derivations.
//
// Every function in this block is a pure function of real `Coach` /
// `ModuleRecord` / `AnnotationSummary` / `ModuleQuestionBank` fields. None of
// them invents a schedule, a score, or a benchmark the data does not carry, and
// each returns `null` or an empty array rather than a plausible-looking zero
// when there is nothing to compute from. Preserve that discipline: a fabricated
// 0% on a research dashboard is worse than a blank.
//
// These belong in the data layer if a backend is ever going to compute any of
// them. They live here only because nothing else needs them yet.
// ---------------------------------------------------------------------------

/**
 * Per-module knowledge-check accuracy (%), or `null` when the module is not
 * completed or has no question-bank entry to score against.
 *
 * ⚠️ The join is **positional**: `knowledgeCheckAnswers[i]` answers
 * `bank.knowledgeCheck[i]`. A length mismatch between the two silently
 * mis-scores rather than erroring. Only 8 of the 11 modules have a bank at all,
 * so three always score `null`.
 */
function moduleAccuracy(
  record: ModuleRecord,
  bank: ModuleQuestionBank | undefined,
): number | null {
  if (record.status !== 'completed' || !bank || bank.knowledgeCheck.length === 0) return null
  const answers = record.knowledgeCheckAnswers ?? []
  const correct = bank.knowledgeCheck.filter(
    (q, i) => answers[i]?.selectedIndex === q.correctIndex,
  ).length
  return Math.round((correct / bank.knowledgeCheck.length) * 100)
}

/** One completed, scoreable module — the shared input for average-accuracy,
 *  the trend chart, and the SIPTEA breakdown below. */
interface ModuleAccuracyEntry {
  moduleId: string
  title: string
  accuracy: number
}

/**
 * Completed modules that also have a question bank, in curriculum order. The
 * shared input for average accuracy, the module breakdown list and the SIPTEA
 * breakdown.
 *
 * Legitimately empty for a trainee still in Content learning, or one whose
 * completed modules all happen to be among the three with no question bank
 * (`building-blocks-good-sleep`, `retraining-brain-sleep`,
 * `resetting-body-clock`). Callers must handle empty rather than assume a row.
 */
function completedModulesWithBank(coach: Coach): ModuleAccuracyEntry[] {
  const entries: ModuleAccuracyEntry[] = []
  for (const module of PATHWAY_MODULES_V2) {
    const record = coach.moduleRecords.find((r) => r.moduleId === module.id)
    if (!record) continue
    const bank = getQuestionBank(module.id)
    const accuracy = moduleAccuracy(record, bank)
    if (accuracy === null) continue
    entries.push({ moduleId: module.id, title: module.title, accuracy })
  }
  return entries
}

/** Straight mean of the accuracy values from `completedModulesWithBank`.
 *  Returns `null` on an empty array — never 0, never NaN. */
function averageAccuracy(entries: ModuleAccuracyEntry[]): number | null {
  if (entries.length === 0) return null
  const sum = entries.reduce((total, e) => total + e.accuracy, 0)
  return Math.round(sum / entries.length)
}

export type PaceIndicator = 'behind' | 'on-track'

/**
 * ⚠️ EXPORTED, RENDERED NOWHERE. Its tile was removed from Learning Progress as
 * confusing at a glance; the helper is preserved deliberately, not dead by
 * accident.
 *
 * A deliberately narrow flag: "behind" means past Stage C with at least one
 * module still unfinished, which is the only clean invariant this data
 * supports. There is no "on pace while still in Content learning" signal
 * because no per-module target date exists anywhere in the model — do not
 * invent one from elapsed time.
 */
export function paceIndicator(coach: Coach): PaceIndicator {
  const hasIncompleteModule = coach.moduleRecords.some((r) => r.status !== 'completed')
  if (coach.currentPhase > 3 && hasIncompleteModule) return 'behind'
  return 'on-track'
}

/** The 6 SIPTEA letters, in canonical order. */
type SipteaLetter = 'S' | 'I' | 'P' | 'T' | 'E' | 'A'

/** Core coaching skill(s) each SIPTEA letter maps to, per
 *  `research/Coaching Module Structure.md`. 'Repair' maps to no letter and
 *  is never included here. I and T have no mapped core skill. */
const SIPTEA_SKILLS: Record<SipteaLetter, string[]> = {
  S: ['Building Rapport', 'Active Listening'],
  I: [],
  P: ['Problem Solving'],
  T: [],
  E: ['Empathy vs. Sympathy'],
  A: ['Goal Setting'],
}

/** Real, confirmed full name for each SIPTEA component, per CLAUDE.md's
 *  SIPTEA table. */
const SIPTEA_LABELS: Record<SipteaLetter, string> = {
  S: 'Shared understanding',
  I: 'Implementation intent',
  P: 'Problem identification',
  T: 'Tailoring',
  E: 'Emotion navigation',
  A: 'Action and goals',
}

/**
 * Which SIPTEA components each curriculum module covers, per
 * `research/Coaching Module Structure.md`.
 *
 * ⚠️ MODULE IDS DO NOT MATCH THEIR TITLES. Titles were reassigned in a later
 * curriculum revision and the ids were never re-keyed, so e.g.
 * `program-structure-onboarding` is titled "SIPTEA framework". This map is
 * keyed by **id**, and the doc rows were matched to modules by title and
 * content, never by id or by the doc's own ordinal numbering (which has itself
 * been renumbered repeatedly). Expect any id-versus-title reasoning here to
 * look wrong at a glance and be right.
 *
 * One entry is decided by elimination rather than a content match:
 * `setting-stage-sleep` takes `['E','T','A']` from the doc's "Calm mind and
 * body" row, which is the one doc row and the one module left over once the
 * other ten pair by title. Treated as final. If a future revision adds a real
 * stress/relaxation module, redo the elimination.
 */
const DOC_MODULE_SIPTEA_LETTERS: Record<string, SipteaLetter[]> = {
  'portal-orientation': ['S'],
  'population-understanding': [],
  'program-structure-onboarding': ['S', 'I', 'P', 'T', 'E', 'A'],
  'siptea-framework-v2': ['S', 'I'],
  'understanding-sleep': ['S', 'P', 'T'],
  'building-blocks-good-sleep': ['S', 'T', 'A'],
  'retraining-brain-sleep': ['S', 'E', 'T'],
  'resetting-body-clock': ['I', 'T', 'A'],
  'setting-stage-sleep': ['E', 'T', 'A'],
  'managing-fatigue': ['S', 'P', 'A'],
  'keeping-sleep-on-track': ['S', 'E', 'A'],
}

const SIPTEA_LETTER_ORDER: SipteaLetter[] = ['S', 'I', 'P', 'T', 'E', 'A']

/** Per-component identity colour for the SIPTEA badge. Six fixed hues so each
 *  component reads as its own thing — an identity mapping, not a data-driven
 *  scale, so never reorder or reuse these to mean something else.
 *
 *  Scoped exception to the app's quiet-palette rule. Five of the six are
 *  literal Tailwind hues rather than tokens from `index.css`; `T` happens to
 *  land on `purple-50` exactly. */
const SIPTEA_LETTER_STYLE: Record<SipteaLetter, string> = {
  S: 'bg-blue-100 text-blue-800',
  I: 'bg-emerald-100 text-emerald-800',
  P: 'bg-amber-100 text-amber-800',
  T: 'bg-purple-50 text-violet-800',
  E: 'bg-red-100 text-red-800',
  A: 'bg-cyan-100 text-cyan-700',
}

/** 4-tier colour scale for a knowledge-check accuracy percentage: 90+ green,
 *  75-89 yellow, 50-74 orange, below 50 red. Scoped to the two Learning
 *  Progress cards; a scoped exception to the app's quiet chip palette.
 *
 *  Keep the `-700` shades. Yellow and orange at `-600` measure under 4.5:1
 *  against white and fail AA — this was measured, not assumed. Tailwind's
 *  default swatches are not accessible by default. */
function accuracyColorClass(pct: number): string {
  if (pct >= 90) return 'text-green-700'
  if (pct >= 75) return 'text-yellow-700'
  if (pct >= 50) return 'text-orange-700'
  return 'text-red-700'
}

interface SipteaComponentBreakdown {
  letter: SipteaLetter
  label: string
  skills: string[]
  totalMapped: number
  assessedCount: number
  averageAccuracy: number | null
}

/**
 * For each of the 6 SIPTEA letters, computes: the mapped core skill(s)
 * (empty for I/T); `totalMapped` — how many `PATHWAY_MODULES_V2` modules
 * the doc maps to that letter; `assessedCount` — how many of those the
 * coach has actually completed with real knowledge-check bank data
 * (`completedModulesWithBank`); and `averageAccuracy` — the real mean
 * accuracy across just that assessed set, or `null` when nothing has been
 * assessed yet. Never fabricates a percentage: `averageAccuracy` is always
 * `null` for I and T (no question-bank content maps to them today) and for
 * any letter with `assessedCount === 0`.
 */
function sipteaBreakdown(coach: Coach): SipteaComponentBreakdown[] {
  const withBank = completedModulesWithBank(coach)
  const assessedModuleIds = new Set(withBank.map((e) => e.moduleId))

  return SIPTEA_LETTER_ORDER.map((letter) => {
    const mappedModuleIds = PATHWAY_MODULES_V2.filter((m) =>
      (DOC_MODULE_SIPTEA_LETTERS[m.id] ?? []).includes(letter),
    ).map((m) => m.id)
    const assessedEntries = withBank.filter(
      (e) => mappedModuleIds.includes(e.moduleId) && assessedModuleIds.has(e.moduleId),
    )
    return {
      letter,
      label: SIPTEA_LABELS[letter],
      skills: SIPTEA_SKILLS[letter],
      totalMapped: mappedModuleIds.length,
      assessedCount: assessedEntries.length,
      averageAccuracy: averageAccuracy(assessedEntries),
    }
  })
}

/**
 * Mean of same-cohort peers' own average accuracy, or `null` if no peer has
 * qualifying data.
 *
 * ⚠️ Every coach in the seed data shares one cohort, so today this is
 * arithmetically the whole roster's average. That is a data limitation, not a
 * bug here. Also note "cohort" was removed as a user-facing concept — the field
 * still exists, but nothing on screen says it.
 */
function cohortAverageAccuracy(coach: Coach, allCoaches: Coach[]): number | null {
  const peerAverages = allCoaches
    .filter((c) => c.id !== coach.id && c.cohort === coach.cohort)
    .map((c) => averageAccuracy(completedModulesWithBank(c)))
    .filter((a): a is number => a !== null)
  if (peerAverages.length === 0) return null
  return Math.round(peerAverages.reduce((total, a) => total + a, 0) / peerAverages.length)
}

/** UI judgment call, not derived data: a scenario response shorter than
 *  this is flagged as notably brief. */
const SHORT_RESPONSE_THRESHOLD = 40

/** UI judgment call, not derived data: an accuracy drop between two
 *  consecutive scored modules bigger than this is flagged as notable. */
const ACCURACY_DROP_THRESHOLD_POINTS = 25

type LearningFlag =
  | { kind: 'missed-question'; moduleId: string; moduleTitle: string }
  | { kind: 'short-response'; moduleId: string; moduleTitle: string; length: number }
  | { kind: 'accuracy-drop'; fromModuleTitle: string; toModuleTitle: string; dropPoints: number }

/**
 * Flags: (1) any completed module where at least one knowledge-check
 * question was missed, named by module title; (2) any completed module
 * whose `scenarioResponse` is shorter than `SHORT_RESPONSE_THRESHOLD`
 * characters; (3) any pair of consecutive (in `completedModulesWithBank`
 * order) modules whose accuracy drops by more than
 * `ACCURACY_DROP_THRESHOLD_POINTS`. Returns an empty array when there are
 * zero completed-with-bank modules — never fabricates a flag.
 *
 * ⚠️ EXPORTED, RENDERED NOWHERE. Its only caller, `LearningFlagsCard`, was
 * removed from the Learning Progress tab on researcher feedback. Preserved
 * deliberately for possible reuse; not dead by accident.
 */
export function learningFlags(coach: Coach): LearningFlag[] {
  const withBank = completedModulesWithBank(coach)
  if (withBank.length === 0) return []

  const flags: LearningFlag[] = []

  for (const module of PATHWAY_MODULES_V2) {
    const record = coach.moduleRecords.find((r) => r.moduleId === module.id)
    if (!record || record.status !== 'completed') continue

    const bank = getQuestionBank(module.id)
    if (bank) {
      const answers = record.knowledgeCheckAnswers ?? []
      const missedOne = bank.knowledgeCheck.some(
        (q, i) => answers[i]?.selectedIndex !== q.correctIndex,
      )
      if (missedOne) {
        flags.push({ kind: 'missed-question', moduleId: module.id, moduleTitle: module.title })
      }
    }

    if (record.scenarioResponse && record.scenarioResponse.length < SHORT_RESPONSE_THRESHOLD) {
      flags.push({
        kind: 'short-response',
        moduleId: module.id,
        moduleTitle: module.title,
        length: record.scenarioResponse.length,
      })
    }
  }

  for (let i = 1; i < withBank.length; i++) {
    const dropPoints = withBank[i - 1].accuracy - withBank[i].accuracy
    if (dropPoints > ACCURACY_DROP_THRESHOLD_POINTS) {
      flags.push({
        kind: 'accuracy-drop',
        fromModuleTitle: withBank[i - 1].title,
        toModuleTitle: withBank[i].title,
        dropPoints,
      })
    }
  }

  return flags
}

/** UI judgment call, not derived data: how different two consecutive shared
 *  summaries' lengths need to be (as a fraction of the earlier one) before
 *  calling out a "roughly longer/shorter" structural note instead of
 *  "roughly similar length". */
const ANNOTATION_LENGTH_NOTE_RATIO = 0.2

interface AnnotationProgressionEntry {
  timepoint: AnnotationSummary['timepoint']
  exists: boolean
  shared: boolean
  /**
   * A structural note comparing this entry to the previous existing timepoint,
   * set only when both exist.
   *
   * ⚠️ This must NEVER synthesize commentary on the content of a reflection —
   * no tone, theme or sentiment. Only two disclosed structural facts are
   * allowed: a change in shared/not-shared status, and an approximate length
   * comparison between two consecutive *shared* summaries. Lengths are never
   * compared across a not-shared entry, because its text is not visible to
   * research in the first place.
   */
  note?: string
}

/**
 * Baseline/midline/endline in order, each as `{timepoint, exists, shared}`
 * plus an honestly-labelled structural note where both the current and the
 * previous *existing* entry are present.
 */
function annotationProgression(coach: Coach): AnnotationProgressionEntry[] {
  const timepoints: AnnotationSummary['timepoint'][] = ['baseline', 'midline', 'endline']
  const byTimepoint = new Map(coach.annotationSummaries.map((a) => [a.timepoint, a]))

  const entries: AnnotationProgressionEntry[] = []
  let previous: AnnotationSummary | undefined

  for (const timepoint of timepoints) {
    const current = byTimepoint.get(timepoint)
    const entry: AnnotationProgressionEntry = {
      timepoint,
      exists: !!current,
      shared: !!current?.shared,
    }

    if (current && previous) {
      if (current.shared !== previous.shared) {
        entry.note = current.shared
          ? 'Now shared with the research team (the previous entry was not shared).'
          : 'Not shared with the research team (the previous entry was shared).'
      } else if (current.shared && previous.shared && current.summary && previous.summary) {
        const diff = current.summary.length - previous.summary.length
        const threshold = previous.summary.length * ANNOTATION_LENGTH_NOTE_RATIO
        if (Math.abs(diff) <= threshold) {
          entry.note = 'Roughly similar length to the previous shared summary.'
        } else {
          entry.note = diff > 0
            ? 'Roughly longer than the previous shared summary.'
            : 'Roughly shorter than the previous shared summary.'
        }
      }
    }

    entries.push(entry)
    if (current) previous = current
  }

  return entries
}

/**
 * Pending-invite banner, pinned above the hero through `ResearchShell`'s
 * `topBanner` slot.
 *
 * A trainee created by the "Add coach trainee" wizard starts
 * `inviteStatus: 'pending'`, and four of the five tabs are inert until they
 * accept. Nothing in this package can flip that flag, so today pending is a
 * terminal state and this banner never clears — wiring an accept-invite
 * endpoint is what resolves it.
 *
 * Amber, not red: this is informational, not destructive. It is the one
 * sanctioned amber in the app; every status chip stays on the
 * success/neutral/muted palette.
 */
function PendingInviteBanner({ coach }: { coach: Coach }) {
  return (
    <div role="status" className="border-b border-amber-200 bg-amber-100 px-6 py-3 md:px-8">
      <div className="mx-auto flex max-w-[1320px] items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-800" />
        <p className="text-caption font-semibold text-amber-900">
          {coach.fullName} hasn't accepted their platform invite yet. Their training and tracking
          details aren't available until they do.
        </p>
      </div>
    </div>
  )
}


/* ------------------------------------------------------------------------ */
/* Personal details                                                          */
/* ------------------------------------------------------------------------ */

/**
 * The rule between two record rows.
 *
 * It is its own element rather than a `border-b` because it is not a border: it
 * is a 16px band with a hairline centred inside it and inset 24px from each
 * edge. A `border-b` would sit flush against the next row and run the full card
 * width, which is a visibly different thing. Do not "simplify" it away.
 *
 * ⚠️ Imported by BOTH `SpacesCoachProfilePage.tsx` and `ConsumerDetailPage.tsx`
 * — all three record pages share this row vocabulary. The SPACES import makes a
 * circular dependency with this file (see the file header).
 */
export function RecordRowDivider() {
  return (
    <div aria-hidden="true" className="flex h-4 items-center px-6">
      <span className="h-px w-full bg-hairline" />
    </div>
  )
}

/**
 * Personal details tab — two stacked cards: Study information (participation
 * facts + Withdraw) and Personal details (the one editable card).
 *
 * Only email and phone are writable, through `updateContact`. Employer, role
 * and years in aged care are recruitment facts collected by the onboarding
 * wizard and are shown but not editable; the form says so.
 *
 * "Withdraw" is a soft state change (`status: 'withdrawn'` plus a note) — no
 * action in this package deletes anything. Its label and confirmation copy
 * differ for a pending invite, because cancelling an unaccepted invite and
 * withdrawing an active participant are different acts.
 */
function PersonalDetails({ coach }: { coach: Coach }) {
  const { updateContact, withdrawCoach } = useResearch()
  const pending = coach.inviteStatus === 'pending'
  const [dialog, setDialog] = useState<'withdraw' | null>(null)
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(coach.email)
  const [phone, setPhone] = useState(coach.phone)

  // DO NOT REMOVE. Both Save and Cancel unmount the instant `editing` flips
  // back, dropping keyboard and screen-reader focus to `<body>`. The
  // `wasEditing` ref is what distinguishes "just left edit mode" from first
  // mount, so this does not steal focus on page load. The consumer record
  // page's `PersonRecordCard` carries the identical fix.
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  useEffect(() => {
    if (editing) {
      wasEditing.current = true
    } else if (wasEditing.current) {
      wasEditing.current = false
      editButtonRef.current?.focus()
    }
  }, [editing])

  const participation = [
    { label: 'Participant ID', value: coach.participantId },
    { label: 'Current stage', value: stageLabel(coach.currentPhase) },
    { label: 'Enrolment date', value: formatDate(coach.enrolmentDate) },
  ]

  // Must mirror every field `AddCoachTraineeModal` collects. Nothing gathered
  // at onboarding should silently disappear once the person is on the roster —
  // if you add a field to the wizard, add it here.
  const contactFields = [
    { label: 'Full name', value: coach.fullName, breakAll: false },
    { label: 'Email', value: coach.email, breakAll: true },
    { label: 'Phone', value: coach.phone },
    { label: 'Aged care employer', value: coach.employer },
    { label: 'Role at employer', value: coach.roleAtEmployer },
    { label: 'Years in aged care', value: `${coach.yearsInAgedCare} years` },
  ]

  return (
    /* Two stacked full-width cards: a `purple-50` header band with an action
       pinned right, over 40px label/value rows separated by `RecordRowDivider`.
       All three record pages share this vocabulary. Field names use the
       project's own terms — Participant ID and Enrolment date, never "User ID"
       or "Join date". */
    <div className="flex flex-col gap-10">
      {/* Study information */}
      <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Study information</h2>
          {coach.status !== 'withdrawn' && (
            /* KEEP THE FILL OPAQUE. `bg-card`, never `bg-destructive/8`: a
               translucent 8% tint on the `purple-50` header band composites to
               roughly rgb(241,220,236), against which `destructive` measures
               4.15:1 and fails AA. On the opaque white fill it is 5.38:1.
               Measured from painted pixels, not calculated from the hex. */
            <button
              type="button"
              onClick={() => setDialog('withdraw')}
              className="inline-flex h-9 shrink-0 items-center rounded-sm border border-destructive bg-card px-4 text-caption-medium text-destructive outline-none transition-colors hover:bg-destructive/8 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              {pending ? 'Withdraw invite' : 'Withdraw from study'}
            </button>
          )}
        </div>
        <dl className="flex flex-col py-4">
          {participation.map((f, i) => (
            <Fragment key={f.label}>
              {i > 0 && <RecordRowDivider />}
              <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
                <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">{f.label}</dt>
                <dd className="text-caption text-ink">{f.value}</dd>
              </div>
            </Fragment>
          ))}
          {/* Withdrawal must be visible as a fact, not just as a missing
              button. Without this row a withdrawn trainee's card looks the
              same as an active one minus a control, even though
              `withdrawalNote` already holds a full sentence for the purpose. */}
          {coach.status === 'withdrawn' && (
            <>
              <RecordRowDivider />
              <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-start sm:gap-0 sm:py-2">
                <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">Status</dt>
                <dd className="text-caption text-destructive">
                  {coach.withdrawalNote ?? 'Withdrawn from the study.'}
                </dd>
              </div>
            </>
          )}
        </dl>
      </Card>

      {/* Personal details */}
      <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Personal details</h2>
          {!editing && !pending && (
            <button
              ref={editButtonRef}
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 shrink-0 items-center rounded-sm bg-card px-4 text-caption-medium text-primary outline-none transition-colors hover:bg-parchment focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Edit details
            </button>
          )}
        </div>

        {editing ? (
          <form
            className="flex flex-col gap-4 p-6"
            onSubmit={(e) => {
              e.preventDefault()
              updateContact(coach.id, { email, phone })
              setEditing(false)
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-email" className="text-caption-medium text-ink-faint">
                Email
              </label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-phone" className="text-caption-medium text-ink-faint">
                Phone
              </label>
              <input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <p className="text-caption text-ink-faint">
              Aged care employer, role, and years in aged care are set at
              recruitment and aren't editable here.
            </p>
            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-6 text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail(coach.email)
                  setPhone(coach.phone)
                  setEditing(false)
                }}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary px-6 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="flex flex-col py-4">
            {contactFields.map((f, i) => (
              <Fragment key={f.label}>
                {i > 0 && <RecordRowDivider />}
                <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
                  <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">{f.label}</dt>
                  <dd className={cn('min-w-0 text-caption text-ink', f.breakAll && 'break-all')}>
                    {f.value}
                  </dd>
                </div>
              </Fragment>
            ))}
          </dl>
        )}
      </Card>


      <ConfirmDialog
        open={dialog === 'withdraw'}
        title={
          pending
            ? `Withdraw ${coach.fullName}'s invite?`
            : `Withdraw ${coach.fullName} from the study?`
        }
        body={
          pending
            ? "Their invite is cancelled and their status changes to Withdrawn. They won't be able to accept it after this. This is reversible in the prototype only."
            : 'Their status changes to Withdrawn and their records are kept per their consent. This is reversible in the prototype only.'
        }
        confirmLabel={pending ? 'Withdraw invite' : 'Withdraw coach'}
        cancelLabel="Keep active"
        destructive
        onConfirm={() => {
          withdrawCoach(coach.id)
          setDialog(null)
        }}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Learning Progress                                                         */
/* ------------------------------------------------------------------------ */

/** One content unit inside the Learning Progress review canvas, styled like a
 *  training slide.
 *
 *  Exported, but no file outside this one imports it in this package.
 *
 *  `header` is an additive escape hatch: supplied, it replaces the plain
 *  title/tag row with a full-bleed band (with a fixed `min-h`, so a row of
 *  sibling cards keeps their bands aligned regardless of title length) and
 *  renders `children` below a divider. Omitted, the default path is untouched —
 *  keep it that way when extending. */
export function SlideCard({
  title,
  tag,
  header,
  headerClassName,
  className,
  children,
}: {
  title: string
  tag?: string
  header?: React.ReactNode
  /** Overrides the header band's default `min-h-[92px]` — for callers that
   *  need several `SlideCard`s to share one equal header-band height
   *  regardless of each card's own description length (e.g. a row of
   *  sibling cards in a grid, where `min-h-[92px]` alone only guarantees a
   *  *minimum*, not equality, once one card's description wraps to more
   *  lines than another's). */
  headerClassName?: string
  className?: string
  children: React.ReactNode
}) {
  if (header) {
    return (
      <div className={cn('overflow-hidden rounded-lg bg-pearl', className)}>
        <div className={cn('flex min-h-[92px] flex-col justify-center bg-card-header p-6', headerClassName)}>
          {header}
        </div>
        <div className="border-t border-hairline">{children}</div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg bg-card p-5 shadow-card ring-1 ring-hairline md:p-6', className)}>
      {/* Tag above the title, left-aligned — not opposite it on the same
          baseline. */}
      <div className="flex flex-col gap-2">
        {tag && <span className="text-fine text-ink-faint">{tag}</span>}
        <h3 className="text-body leading-[1.24] font-semibold tracking-[-0.374px]">
          {title}
        </h3>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

/** Star-rating scale. Must match whatever the coach-facing feedback control
 *  writes, or ratings render against the wrong denominator. */
const RATING_MAX = 5

/**
 * One module's per-trainee answers, presented as the training portal's own
 * slides would be — one card per unit.
 *
 * Only the three slides that carry a per-trainee answer are reproduced:
 * scenario task, knowledge check, module feedback. The module's other slides
 * (welcome, key ideas, video, summary) are identical boilerplate for every
 * trainee and have no research value on this page.
 *
 * The slide count is computed rather than hardcoded, because the knowledge
 * check only renders for the 8 modules that have a question bank — a fixed
 * "Slide N of 3" would be wrong on the other three.
 */
function ModuleSlides({ coach, record }: { coach: Coach; record: ModuleRecord }) {
  const bank = getQuestionBank(record.moduleId)
  const firstName = coach.fullName.split(' ')[0]

  if (record.status !== 'completed') {
    return (
      <div className="rounded-lg bg-card p-6 text-center ring-1 ring-hairline">
        <p className="text-caption text-ink-faint">
          {record.status === 'in-progress'
            ? `${firstName} is part-way through this module. Their responses appear here once submitted.`
            : `No response yet. ${firstName} hasn't reached this task.`}
        </p>
      </div>
    )
  }

  const answers = record.knowledgeCheckAnswers ?? []
  const correct =
    bank?.knowledgeCheck.filter(
      (q, i) => answers[i]?.selectedIndex === q.correctIndex,
    ).length ?? 0

  // Deliberately show the answer, not the quiz. The scenario prompt and the
  // knowledge check's full option list are omitted: a researcher reviewing
  // many trainees wants "what did they say" and "right or wrong", not the
  // training UI replayed back at them. Do not add them back.
  const totalSlides = bank ? 3 : 2

  return (
    <>
      <SlideCard title="Scenario task" tag={`Slide 1 of ${totalSlides}`}>
        <p className="text-caption leading-[1.6] text-ink">{record.scenarioResponse}</p>
      </SlideCard>

      {bank && (
        <SlideCard title="Knowledge check" tag={`Slide 2 of ${totalSlides}`}>
          <p className="text-caption font-semibold text-ink-muted">
            {correct} of {bank.knowledgeCheck.length} correct
          </p>
          <ul className="mt-3 space-y-2">
            {bank.knowledgeCheck.map((q, qi) => {
              const isCorrect = answers[qi]?.selectedIndex === q.correctIndex
              return (
                <li
                  key={qi}
                  className="flex items-start justify-between gap-3 rounded-sm border border-hairline px-3 py-2"
                >
                  <p className="text-caption text-ink">
                    {qi + 1}. {q.question}
                  </p>
                  <span
                    className={cn(
                      'inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-fine font-semibold',
                      isCorrect ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle2 aria-hidden="true" className="size-3" />
                    ) : (
                      <XCircle aria-hidden="true" className="size-3" />
                    )}
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </li>
              )
            })}
          </ul>
        </SlideCard>
      )}

      <SlideCard title="Module feedback" tag={`Slide ${totalSlides} of ${totalSlides}`}>
        {!record.feedbackRating && !record.feedbackComment ? (
          <p className="text-caption text-ink-faint">
            {firstName} didn't leave feedback for this module.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {record.feedbackRating ? (
              <div
                role="img"
                aria-label={`${record.feedbackRating} out of ${RATING_MAX} stars`}
                className="flex items-center gap-0.5"
              >
                {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((star) => (
                  <Star
                    key={star}
                    aria-hidden="true"
                    className={cn(
                      'size-4',
                      star <= record.feedbackRating!
                        ? 'fill-primary text-primary'
                        : 'fill-none text-ink-faint',
                    )}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
            ) : (
              <p className="text-fine text-ink-faint">No rating given.</p>
            )}
            {record.feedbackComment && (
              <p className="text-caption leading-[1.6] text-ink">{record.feedbackComment}</p>
            )}
          </div>
        )}
      </SlideCard>
    </>
  )
}

/** One annotation-summary timepoint as a single slide card.
 *
 *  Three distinct states, and they must stay distinct: not yet reached, reached
 *  but not shared, and shared. Coaches control sharing at every timepoint, so a
 *  withheld summary's text is never rendered — only the fact that it was
 *  withheld. */
function AnnotationSlide({
  coach,
  timepoint,
  shortLabel,
}: {
  coach: Coach
  timepoint: 'baseline' | 'midline' | 'endline'
  shortLabel: string
}) {
  const firstName = coach.fullName.split(' ')[0]
  const a = coach.annotationSummaries.find((s) => s.timepoint === timepoint)

  return (
    <SlideCard title={`${shortLabel} annotation summary`}>
      {!a ? (
        <p className="text-caption text-ink-faint">
          Not yet reached. {firstName} completes this reflective conversation
          at a later timepoint.
        </p>
      ) : (
        <p className="text-caption leading-[1.6] text-ink-muted">
          {a.shared
            ? a.summary
            : `${firstName} has chosen not to share this summary. Coaches control sharing at every timepoint.`}
        </p>
      )}
    </SlideCard>
  )
}

type ReviewSelection =
  | { kind: 'module'; moduleId: string }
  | { kind: 'annotation'; timepoint: 'baseline' | 'midline' | 'endline' }

/** The three trainee-side annotation timepoints, as rows in the Learning
 *  Progress rail. Title Case here to match the slide headings they open; the
 *  sentence-case sibling list is `ANNOTATION_TIMEPOINTS` below, used by the
 *  Overview tab. Two lists on purpose, different casing, same three
 *  timepoints. */
const REVIEW_ITEMS: { timepoint: 'baseline' | 'midline' | 'endline'; label: string; shortLabel: string }[] = [
  { timepoint: 'baseline', label: 'Baseline Review', shortLabel: 'Baseline' },
  { timepoint: 'midline', label: 'Midline Review', shortLabel: 'Midline' },
  { timepoint: 'endline', label: 'Endline Review', shortLabel: 'Endline' },
]

/** The "not available yet" state for tabs that have nothing to show before a
 *  trainee accepts their platform invite. Four of this page's five tabs use it.
 *  Each caller supplies its own icon, heading and body so the message says what
 *  will appear there, rather than one generic line everywhere.
 *
 *  Exported, but nothing outside this file imports it today. */
export function NoDetailsAvailable({
  icon: Icon,
  heading,
  body,
}: {
  icon: typeof BookOpen
  heading: string
  body: string
}) {
  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="flex flex-col items-center gap-3 px-10 py-16 text-center">
        <span
          aria-hidden="true"
          className="flex size-16 items-center justify-center rounded-full bg-primary/10"
        >
          <Icon className="size-8 text-primary" />
        </span>
        <p className="text-body font-semibold text-ink">{heading}</p>
        <p className="max-w-sm text-caption text-ink-faint">{body}</p>
      </div>
    </Card>
  )
}

/**
 * The three annotated-SIPTEA-guide timepoints a **trainee** record can carry,
 * and the COACH phase each becomes due after: baseline after Content learning,
 * midline after Guided group practice, endline after Placement 2. The fourth
 * timepoint, post-practice, belongs to a certified coach delivering SPACES and
 * has no slot on `Coach.annotationSummaries`.
 *
 * `dueAfterPhase` is the phase a trainee must have **reached** before a missing
 * summary counts as overdue rather than simply not yet applicable. The copy
 * names the stage, not the number: "Due after Guided group practice" is
 * actionable, "Due after phase 5" is not.
 *
 * Separate from `REVIEW_ITEMS` above on purpose — that list is Title Case to
 * match slide headings, these are sentence case and use the project's own term,
 * "annotation summary" (never "report").
 */
const ANNOTATION_TIMEPOINTS: {
  timepoint: 'baseline' | 'midline' | 'endline'
  label: string
  dueAfterPhase: number
  dueAfter: string
}[] = [
  {
    timepoint: 'baseline',
    label: 'Baseline annotation summary',
    dueAfterPhase: 4,
    dueAfter: 'Content learning',
  },
  {
    timepoint: 'midline',
    label: 'Midline annotation summary',
    dueAfterPhase: 5,
    dueAfter: 'Guided group practice',
  },
  {
    timepoint: 'endline',
    label: 'Endline annotation summary',
    dueAfterPhase: 8,
    dueAfter: 'Placement 2',
  },
]

/**
 * The "Key updates" list on the Overview tab. 6-8 rows for an active trainee.
 *
 * Two rules to preserve when adding a row:
 *
 * 1. **Read every figure through the helper that already owns it**
 *    (`averageAccuracy` / `completedModulesWithBank`, `sipteaBreakdown`,
 *    `stageZoomSession`, `stageLabel`) — never recompute locally. This panel
 *    restates facts the Learning Progress tab and the sessions table also show,
 *    and two surfaces deriving one fact from two fields is this codebase's
 *    most-repeated bug.
 * 2. **A not-yet-reached annotation timepoint still gets a row**, naming the
 *    stage that unlocks it. "Not due yet" and "due but missing" are different
 *    things and only one needs chasing; omitting the row collapses them.
 *
 * Terminology: these are **annotation summaries**, never "reviews" or
 * "reports".
 */
function overviewKeyUpdates(coach: Coach): { label: string; value: string; tone?: string }[] {
  const updates: { label: string; value: string; tone?: string }[] = []

  // Deliberately no "Current stage" row: the white sub-panel immediately to the
  // left of this list already shows it, and `stageLabel`'s own "Stage C:
  // Learning" would render as "Current stage: Stage C: Learning".

  // What they are working through now, and what they last finished.
  const inProgress = coach.moduleRecords.find((r) => r.status === 'in-progress')
  if (inProgress) updates.push({ label: 'Ongoing module', value: moduleTitle(inProgress.moduleId) })

  const completed = coach.moduleRecords.filter((r) => r.status === 'completed')
  const lastCompleted = completed[completed.length - 1]
  if (lastCompleted)
    updates.push({ label: 'Last completed module', value: moduleTitle(lastCompleted.moduleId) })

  // The two learning-quality figures the Learning Progress tab also publishes,
  // through the same helpers that tab uses. Never recompute them here.
  const accuracy = averageAccuracy(completedModulesWithBank(coach))
  if (accuracy !== null)
    updates.push({ label: 'Avg. knowledge check accuracy', value: `${accuracy}%` })

  const sipteaAssessed = sipteaBreakdown(coach).filter((s) => s.averageAccuracy !== null).length
  if (sipteaAssessed > 0)
    updates.push({ label: 'SIPTEA components assessed', value: `${sipteaAssessed} of 6` })

  // The three annotation timepoints. Three distinct outcomes, and they must
  // stay three: submitted, not due yet (naming the stage that unlocks it), and
  // overdue (flagged `destructive`).
  for (const { timepoint, label, dueAfterPhase, dueAfter } of ANNOTATION_TIMEPOINTS) {
    const summary = coach.annotationSummaries.find((a) => a.timepoint === timepoint)
    if (summary) {
      updates.push({ label, value: summary.shared ? 'Shared' : 'Approved, not shared' })
    } else if (coach.currentPhase < dueAfterPhase) {
      // "Due after X", never "Not due until X": a trainee at Stage C is
      // *inside* Content learning, so "Not due until Content learning" reads as
      // though they have not started it. "Due after" is true at every phase.
      updates.push({ label, value: `Due after ${dueAfter}` })
    } else {
      updates.push({ label, value: 'Not submitted yet', tone: 'text-destructive' })
    }
  }

  // What is booked next. Same `stageZoomSession` source the sessions table
  // reads, so the two cannot disagree.
  const nextSession = stageZoomSession(coach).find((s) => s.phase >= coach.currentPhase)
  if (nextSession)
    updates.push({
      label: 'Next session',
      // Use the stage's short label, not `session.title`. Real titles carry
      // their own colon ("Group practice 5: Consolidation and readiness
      // check"), which produced rows with three colons in them. The short label
      // is also what the sessions table prints, so both name it the same way.
      value: `${stageLabel(nextSession.phase).split(': ')[1] ?? stageLabel(nextSession.phase)} · ${formatDate(nextSession.date)} · ${formatTime(nextSession.time)}`,
    })

  return updates
}

/**
 * Overview — the tab a researcher lands on. Read-only in full; its only
 * controls are the two links across to the tabs that own the data.
 *
 * Three sections: the trainee's identity card, a learning-progress card with
 * the derived "Key updates" list, and the horizontal COACH pathway timeline
 * paired with the upcoming-sessions table.
 */
function Overview({
  coach,
  onGoToTab,
}: {
  coach: Coach
  /** Switches the profile's own tab row — the Overview's three sections each
   *  link through to the tab that owns that data. */
  onGoToTab: (tab: Tab) => void
}) {
  const { phaseCompletion, phaseCompletionDates } = useResearch()

  if (coach.inviteStatus === 'pending')
    return (
      <NoDetailsAvailable
        icon={LayoutDashboard}
        heading="Overview will appear here"
        body="Contact details, learning progress and stage tracking appear once this trainee accepts their invite."
      />
    )

  const sectionCta =
    'inline-flex h-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary px-5 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]'

  const completedPhases = phaseCompletion[coach.id] ?? []
  const dates = phaseCompletionDates[coach.id] ?? {}
  const modulesDone = coach.moduleRecords.filter((r) => r.status === 'completed').length
  const totalModules = PATHWAY_MODULES_V2.length
  // Still read here for the pathway timeline's `currentModule` label; the
  // annotation summaries it used to sit beside moved into `overviewKeyUpdates`.
  const inProgress = coach.moduleRecords.find((r) => r.status === 'in-progress')

  const keyUpdates = overviewKeyUpdates(coach)

  return (
    // 40px between sections. The consumer record page's Overview uses the same
    // value; the two are meant to share one rhythm.
    <div className="flex flex-col gap-10">
      {/* Intro copy left, Trainee Details card right. The card is a fixed
          568.5px and does not flex; the intro takes the remainder. The SPACES
          coach page's Overview mirrors this row exactly. */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <TabIntro {...TAB_INTRO.Overview} />
        </div>
      <section className="flex flex-col lg:w-[568.5px] lg:shrink-0">
        {/* Trainee Details card. The vertical `yellow-100` -> white gradient is
            why the detail rows carry no white panel of their own: the card's
            lower half is already white. There is no "Contact details" heading —
            the card leads with the trainee's name instead.

            ⚠️ PLACEHOLDER ASSET. `participant-placeholder.svg` is a neutral
            abstract portrait rendered for EVERY trainee here and every coach on
            `SpacesCoachProfilePage.tsx`. There is no image field on `Coach` to
            hold a real headshot, so one graphic stands in for everyone.
            Add that field, or remove the portrait, before real participants are
            loaded. (An earlier revision shipped a stock photograph of a real
            person here; it was removed — do not reintroduce a likeness that
            does not belong to the person on the record.)

            The avatar is also a scoped exception to the app-wide "no avatars"
            rule, granted for these two cards only. It is not licence to
            reintroduce avatars anywhere else. */}
        <Card className="gap-0 rounded-lg border border-parchment bg-gradient-to-b from-yellow-100 to-white py-0 shadow-card">
          <div className="flex flex-col gap-6 p-6">
            {/* `items-start`: the avatar top-aligns with the name, it does not
                centre against the whole name+rows stack. */}
            <div className="flex items-start gap-6">
              <span
                aria-hidden="true"
                className="block size-[104px] shrink-0 overflow-hidden rounded-full"
              >
                <img
                  src="/avatars/participant-placeholder.svg"
                  alt=""
                  width={104}
                  height={104}
                  className="size-full object-cover"
                />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* `px-2` matches the rows block below, so the name's left edge
                    lines up with the "Trainee ID" label under it. */}
                <p className="truncate px-2 text-title text-ink">{coach.fullName}</p>
                {/* Three grid tracks — 110px label / 24px colon / value — so
                    the colons align in their own column. The colon is its own
                    `aria-hidden` span outside both `dt` and `dd`, so it never
                    becomes part of either accessible name. */}
                <dl className="grid grid-cols-1 gap-x-0 gap-y-2 p-2 sm:grid-cols-[110px_24px_1fr] sm:items-center">
                  {[
                    { label: 'Trainee ID', value: coach.participantId, breakAll: false },
                    { label: 'Email', value: coach.email, breakAll: true },
                    { label: 'Phone', value: coach.phone, breakAll: false },
                  ].map((f) => (
                    <Fragment key={f.label}>
                      <dt className="text-caption-medium text-ink">{f.label}</dt>
                      <span aria-hidden="true" className="hidden text-body-md text-ink sm:block">
                        :
                      </span>
                      <dd className={cn('min-w-0 text-caption text-ink', f.breakAll ? 'break-all' : 'truncate')}>
                        {f.value}
                      </dd>
                    </Fragment>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </section>
      </div>

      {/* Learning progress card: a flex-1 "Progress:" panel beside a fixed
          640px "Key updates" panel. The consumer record page's Overview carries
          the same pair — keep them in step. */}
      <section>
        <Card className="gap-0 rounded-lg border border-parchment bg-card py-0 shadow-card">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="min-w-0 flex-1 text-title text-ink">
                Trainee&rsquo;s learning journey progress
              </h2>
              <button
                type="button"
                onClick={() => onGoToTab('Learning Progress')}
                className={sectionCta}
              >
                View more
              </button>
            </div>

            {/* Splits at `xl`, not `lg`. The right panel is a fixed 640px and
                the left needs ~409px beside it, so a two-column row only fits
                once the content column passes ~1100px. Below that they stack
                rather than wrapping the stats row. */}
            <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col gap-6 rounded-sm bg-parchment p-4">
                <p className="flex h-6 items-center text-body-md text-ink">Progress:</p>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    {/* Fixed-height row with `justify-between` on both columns:
                        labels pinned top, values pinned bottom. That is what
                        puts a 39px count and a 19px date on a shared baseline
                        without either column knowing the other's type size. */}
                    <div className="flex h-16 items-start justify-between gap-4">
                      <div className="flex h-full flex-col justify-between">
                        <p className="text-caption text-ink-muted">Modules completed:</p>
                        <p className="text-display-md whitespace-nowrap text-ink">
                          {modulesDone} of {totalModules}
                        </p>
                      </div>
                      <div className="flex h-full flex-col items-start justify-between">
                        <p className="text-caption whitespace-nowrap text-ink-muted">Last active:</p>
                        <p className="text-body-md whitespace-nowrap text-ink">
                          {coach.lastActive ? formatDate(coach.lastActive) : 'Never signed in'}
                        </p>
                      </div>
                    </div>
                    {/* `role="img"` + `aria-label`, not a bare div: the bar is
                        the only rendering of this ratio in the panel that a
                        screen reader can reach as one fact. */}
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-purple-200"
                      role="img"
                      aria-label={`${modulesDone} of ${totalModules} modules completed`}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(modulesDone / totalModules) * 100}%` }}
                      />
                    </div>
                  </div>
                  {/* The one white surface inside the parchment panel, which is
                      what makes the current stage read as the card's headline
                      fact. Note this shows `coach.currentPhase` (the seeded
                      field), while the pathway timeline below shows
                      `phaseCompletion` (the writable store slice) — see the
                      file header on why those are two different things. */}
                  <div className="flex h-18 items-center gap-2 rounded-sm bg-card p-3">
                    <p className="text-body-md text-ink">Current Stage:</p>
                    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-purple-50 px-3 text-caption-medium text-ink">
                      {stageShortName(coach.currentPhase)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key updates panel. Rows come from `overviewKeyUpdates` — read
                  its doc before adding one. */}
              <div className="flex flex-col gap-6 overflow-hidden rounded-sm bg-parchment p-4 xl:w-[640px] xl:shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="text-body-md whitespace-nowrap text-ink">Key updates</p>
                    {/* White on `purple-500` measures 4.85:1 — clears AA, with
                        little margin. Do not lighten the fill. */}
                    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-purple-500 px-2 text-caption-medium text-white">
                      {keyUpdates.length} {keyUpdates.length === 1 ? 'update' : 'updates'}
                    </span>
                  </div>
                  {/* UNWIRED — needs a backend. "Read" is not a state anything
                      in this app persists; wiring this needs a per-user
                      notification read-state store. The identical control on
                      the consumer record page's Key updates panel is a
                      copy-paste, not a shared component — wire both together.
                      `-my-3 py-3` keeps the row 24px tall while still giving
                      the control a 41px pointer target. */}
                  <button
                    type="button"
                    aria-disabled="true"
                    className="-my-3 shrink-0 rounded-sm py-3 text-caption-medium text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Mark all as read
                    <span className="sr-only"> (coming soon)</span>
                  </button>
                </div>
                {/* Capped height, not auto: a trainee with more updates scrolls
                    rather than stretching the card past its sibling. */}
                <ul className="flex max-h-[174px] min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xs bg-card p-3">
                  {keyUpdates.map((u) => (
                    <li
                      key={u.label}
                      className="flex shrink-0 items-center justify-between gap-4 border-b border-purple-200 px-px py-3"
                    >
                      <p className="min-w-0 flex-1 text-body text-ink">
                        {u.label}: <span className={u.tone ?? 'text-primary'}>{u.value}</span>
                      </p>
                      {/* UNWIRED — and nobody has specified what this menu
                          should contain. Do not build it until someone does.
                          `-my-2.5` is load-bearing: the button must stay a real
                          36x36 hit target (the app's control floor) while
                          contributing only 16px to the row, so the row height
                          is set by its text line. Remove it and rows grow to
                          61px, which drops one update out of the scroller. */}
                      <button
                        type="button"
                        aria-disabled="true"
                        className="-my-2.5 flex size-9 shrink-0 items-center justify-center rounded-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MoreVertical aria-hidden="true" className="size-4" />
                        <span className="sr-only">More options for {u.label} (coming soon)</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* The pathway and the sessions table are ONE card with two sections, not
          two sibling cards, and the table's heading sits inside it. Deliberate
          exception to the app-wide "a card holding a table carries its title
          outside" rule: here the table is the second half of the pathway story
          ("where they are" -> "what is booked next"), not a standalone data
          surface. */}
      <section>
        <Card className="gap-0 rounded-lg border border-parchment bg-card py-0 shadow-card">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <h2 className="font-display text-title text-ink">
                    Trainee certification pathway
                  </h2>
                  <p className="text-caption text-ink">
                    Track where the trainee is in their coach certification journey
                  </p>
                </div>
                <button type="button" onClick={() => onGoToTab('Stage Management')} className={sectionCta}>
                  Go to Stage Management
                </button>
              </div>
              {/* DO NOT REDUCE THE PADDING on the scroller below. The
                  in-progress marker's ping ring expands to twice the marker's
                  size, and an `overflow-x-auto` element clips vertically too
                  (per spec) — the padding is what keeps the ring from being
                  cut off. */}
              <div className="rounded-lg bg-parchment">
                {/* DO NOT REMOVE `min-w-0`. Without it this scroller is sized by
                    the 720px timeline inside it, which forces the WHOLE PAGE
                    into horizontal scroll at narrow widths. Invisible in a
                    screenshot; caught only by measurement. */}
                <div className="min-w-0 overflow-x-auto px-12 py-10">
                  <StageTimeline
                    coach={coach}
                    completedPhases={completedPhases}
                    dates={dates}
                    currentModule={inProgress ? moduleTitle(inProgress.moduleId) : undefined}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                {/* Two copy constraints here, both easy to break:
                    - This table is READ-ONLY. Do not write a title or subtitle
                      that tells the researcher to schedule something; there is
                      no scheduling write path anywhere in this package.
                    - Do not name who books these sessions. Stage O is a cohort
                      group practice arranged by the research team, and the
                      placements involve simulated consumers and an expert
                      assessor. An earlier version asserted "coaches book these"
                      and was simply wrong. */}
                <h2 className="text-body-md text-ink">Upcoming stages and sessions</h2>
                <p className="text-caption text-ink">
                  Keep track of where this trainee is up to, and take the relevant actions
                </p>
              </div>
              {/* Nested radius: half the parent card's, with a `hairline`
                  border rather than the softer `parchment` cards use, so the
                  table reads as a contained grid rather than a second card. */}
              <Card className="gap-0 overflow-hidden rounded-sm border border-hairline py-0 shadow-none">
                <ZoomSessions coach={coach} completedPhases={completedPhases} />
              </Card>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

/** The only stages that involve a Zoom session: Stage O's cohort group practice
 *  and the trainee's own two placements. Stage C is self-paced and Stage CP has
 *  no scheduled session, so neither appears — a "no session" row for a stage
 *  that never has one reads as something missing rather than not applicable. */
const SESSION_PHASES = [4, 5, 7] as const

/**
 * Stage readiness and session bookings for the stages ahead.
 *
 * **READ-ONLY BY DESIGN.** A researcher cannot start, schedule or join anything
 * from this table, and no copy on this page should imply otherwise. Meeting ID
 * and an Action column were both removed for that reason.
 *
 * Readiness and booking are deliberately **two independent columns**, because
 * it is their combination that tells a researcher whether to act:
 *
 *   ready? booked? -> reading
 *   no     no       not due yet                      quiet
 *   YES    no       ready, nothing booked            the one row worth chasing
 *   yes    yes      on track                         quiet
 *   n/a    yes      booked ahead of readiness        quiet
 *
 * Only the genuinely blocked row takes the `warning` tone; everything not yet
 * due stays `muted`. A single "not scheduled" status column made every future
 * row amber, which is how the colour stopped meaning anything. Do not merge
 * them back.
 *
 * `stageZoomSession` is the single source for "is this stage booked" and is
 * also what the Overview's Key updates and the Home page's schedule read, so
 * none of those surfaces can disagree.
 */
function ZoomSessions({ coach, completedPhases }: { coach: Coach; completedPhases: number[] }) {
  const booked = stageZoomSession(coach)
  const TH_CELL = 'py-5 text-caption-medium text-ink'

  return (
    <div className="min-w-0 overflow-x-auto">
      {/* Column widths are PERCENTAGES, not fixed px, and that is the fix for a
          real bug: with fixed px columns this table overflowed its container at
          a 1440px viewport and pushed the last column off screen. Percentages
          are exact at the design width and degrade proportionally instead of
          clipping. Below the `min-w` the table genuinely scrolls. Do not
          convert these back to px. */}
      <table className="w-full min-w-[860px] border-collapse text-left">
        <colgroup>
          <col className="w-[19.76%]" />
          <col className="w-[21.34%]" />
          <col className="w-[20.5%]" />
          <col className="w-[20.5%]" />
          <col className="w-[17.9%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-hairline bg-purple-50">
            <th scope="col" className={cn(TH_CELL, 'pl-8')}>
              Stage
            </th>
            <th scope="col" className={TH_CELL}>
              Session
            </th>
            <th scope="col" className={TH_CELL}>
              Trainee readiness
            </th>
            <th scope="col" className={TH_CELL}>
              Session booked
            </th>
            <th scope="col" className={cn(TH_CELL, 'pr-8')}>
              Scheduled for
            </th>
          </tr>
        </thead>
        <tbody>
          {SESSION_PHASES.map((phase, i) => {
            const session = booked.find((b) => b.phase === phase)
            const done = completedPhases.includes(phase)
            // Ready = the trainee has actually reached this stage. `done`
            // outranks it: a finished stage isn't "ready", it's over.
            const ready = !done && coach.currentPhase >= phase
            // The one combination that needs a human to chase someone.
            const blocked = ready && !session
            return (
              <tr key={phase} className={cn(i > 0 && 'border-t border-hairline')}>
                {/* The stage is the row's identity, everything else is detail —
                    hence the weight difference. */}
                <td className="py-5 pl-8 text-body-md whitespace-nowrap text-ink">
                  {stageShortName(phase)}
                </td>
                <td className="py-5 text-caption text-ink-faint">
                  {session ? session.title : stageLabel(phase).split(': ')[1] ?? stageLabel(phase)}
                </td>
                <td className="py-5">
                  {done ? (
                    <Chip tone="muted" label="Stage complete" />
                  ) : ready ? (
                    <Chip tone="next" label="Ready now" />
                  ) : (
                    <Chip tone="muted" label="Not yet" />
                  )}
                </td>
                <td className="py-5">
                  {session ? (
                    <Chip tone="success" label="Booked" />
                  ) : (
                    /* `warning` ONLY when the trainee is ready and nothing is
                       booked. A stage not yet due stays `muted`, or every
                       future row goes amber and the colour stops signalling
                       anything. */
                    <Chip tone={blocked ? 'warning' : 'muted'} label={done ? 'No record' : 'Not booked'} />
                  )}
                </td>
                <td className="py-5 pr-8 text-caption whitespace-nowrap text-ink-faint">
                  {session ? (
                    `${formatDate(session.date)} · ${formatTime(session.time)}`
                  ) : blocked ? (
                    /* Name what is missing rather than leaving a bare dash on
                       the one row that needs attention. */
                    <span className="text-ink-faint">Needs a date</span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Horizontal COACH pathway timeline.
 *
 * The connector is drawn BEHIND the markers as one absolutely-positioned track,
 * not as per-item borders. That is what stops the line breaking between two
 * stages whose labels differ in length.
 *
 * State is never carried by colour alone: complete has a tick glyph and a date,
 * current has a ring plus its own "In progress" label, upcoming is hollow with
 * "Not started". Keep all three redundant cues if you restyle it.
 *
 * Completion comes from the store's `phaseCompletion` slice, and dates from
 * `phaseCompletionDates`. A completed stage with no date renders "Completed"
 * without one rather than inventing a date — two of the five stages have no
 * record that could prove when they finished.
 */
function StageTimeline({
  coach,
  completedPhases,
  dates,
  currentModule,
}: {
  coach: Coach
  completedPhases: number[]
  dates: Record<number, string>
  /** The module this trainee is part-way through, shown under Stage C while
   *  that stage is the one in progress — "In progress" alone said which stage
   *  they were on but not what they were actually working through. */
  currentModule?: string
}) {
  const count = PIPELINE_PHASES.length
  const lastIndex = count - 1

  return (
    // Markers are positioned by percentage, not centred in equal columns. With
    // equal columns the first and last markers each sit half a column in from
    // the ends, leaving dead space at both edges of a timeline meant to span
    // the section. At `i / (count - 1)` the first is flush left, the last flush
    // right, and every connector segment is the same length.
    <ol className="relative min-w-[720px] pb-1">
      {/* Connector track. Its `top` is the markers' vertical midpoint: half the
          marker height less half the line — recompute it if either changes. */}
      <span aria-hidden="true" className="pointer-events-none absolute top-[23px] right-[24px] left-[24px]">
        {PIPELINE_PHASES.slice(0, lastIndex).map((phase, i) => (
          <span
            key={phase.number}
            className={cn(
              'absolute h-0.5',
              completedPhases.includes(phase.number) ? 'bg-success/80' : 'bg-ink-faint/50',
            )}
            style={{ left: `${(i / lastIndex) * 100}%`, width: `${100 / lastIndex}%` }}
          />
        ))}
      </span>

      {PIPELINE_PHASES.map((phase, i) => {
        const done = completedPhases.includes(phase.number)
        const current = !done && coach.currentPhase === phase.number
        const first = i === 0
        const last = i === lastIndex
        return (
          <li
            key={phase.number}
            className={cn(
              'absolute top-0 flex w-[20%] flex-col',
              first && 'left-0 items-start text-left',
              last && 'right-0 items-end text-right',
              !first && !last && 'items-center text-center',
            )}
            style={first || last ? undefined : { left: `${(i / lastIndex) * 100}%`, marginLeft: '-10%' }}
          >
            <span className="relative z-10 flex size-12 shrink-0 items-center justify-center">
              {/* Pulse ring on the stage in progress, expanding from behind the
                  marker so the marker itself stays legible. `motion-reduce:hidden`
                  is required: a looping animation is exactly what a
                  reduced-motion preference asks to be spared. */}
              {current && (
                <span
                  aria-hidden="true"
                  className="absolute inline-flex size-12 animate-ping rounded-full bg-primary/40 motion-reduce:hidden"
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  'relative flex size-12 items-center justify-center rounded-full',
                  done && 'bg-success text-white',
                  current && 'border-2 border-primary bg-card',
                  !done && !current && 'border border-purple-200 bg-card',
                )}
              >
                {done ? (
                  <Check className="size-6" />
                ) : (
                  <span className={cn('size-3 rounded-full', current ? 'bg-primary' : 'bg-purple-200')} />
                )}
              </span>
            </span>
            <p className="mt-6 text-body-md text-ink">{stageShortName(phase.number)}</p>
            <p className="text-caption text-ink-muted">{phase.shortLabel}</p>
            {/* The state line must say what the date MEANS. A bare date under a
                tick is ambiguous between completed-on, started-on and due-on. */}
            <p
              className={cn(
                'mt-2',
                // Three states, three treatments. The stage in progress is the
                // one fact a researcher scans this row for, so it takes the
                // primary colour and weight; a completed stage's date drops to
                // supporting detail rather than competing with it.
                done && 'text-fine text-ink-muted',
                current && 'text-caption-medium text-primary',
                !done && !current && 'text-caption text-ink',
              )}
            >
              {done
                ? dates[phase.number]
                  ? `Completed on: ${formatDate(dates[phase.number])}`
                  : 'Completed'
                : current
                  ? 'In progress'
                  : 'Not started'}
            </p>
            {/* Only under Stage C, and only while it is in progress: the module
                is what "in progress" actually means there. Every other stage's
                work is the session itself, which the table below covers. */}
            {current && phase.number === 3 && currentModule && (
              <p className="mt-1 text-caption text-ink-muted">{currentModule}</p>
            )}
          </li>
        )
      })}
      {/* DO NOT DELETE. Every stage above is absolutely positioned, so this
          invisible item is the only thing giving the `<ol>` any height. Remove
          it and the timeline collapses to zero. Keep its shape in sync with a
          real stage's tallest possible content. */}
      <li aria-hidden="true" className="invisible flex flex-col">
        <span className="size-12" />
        <p className="mt-6 text-body font-semibold">&nbsp;</p>
        <p className="text-caption">&nbsp;</p>
        <p className="mt-2 text-caption font-medium">&nbsp;</p>
      </li>
    </ol>
  )
}

/** One tracker row's shared shape — a module row or an annotation-summary
 *  row render identically, just built from different source data. */
interface TrackerRow {
  key: string
  label: string
  status: string
  success: boolean
  active: boolean
  onSelect: () => void
}

/** Shared row-button list for every group in the Engagement tracker, so the row
 *  markup exists in exactly one place. */
function TrackerRowList({ rows }: { rows: TrackerRow[] }) {
  return (
    <ul>
      {rows.map((row, i) => (
        <li key={row.key}>
          {i > 0 && <Separator className="my-1 bg-divider-soft" />}
          <button
            type="button"
            onClick={row.onSelect}
            aria-current={row.active ? 'true' : undefined}
            className={cn(
              'flex w-full min-h-11 items-center gap-2 rounded-sm px-3 py-2 text-left text-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              row.active
                ? 'font-semibold text-primary'
                : 'text-ink-muted hover:bg-pearl',
            )}
          >
            <span className="min-w-0 flex-1">{row.label}</span>
            <span
              className={cn(
                'shrink-0 text-fine tabular-nums',
                row.success ? 'text-success' : 'text-ink-faint',
              )}
            >
              {row.status}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * One collapsible group in the Engagement tracker.
 *
 * The header is deliberately built from a different vocabulary than any row
 * state: a tint no row uses, a full step up in type scale, taller padding, and
 * its own seam. If a header only differs from an active row by font weight, an
 * expanded section reads as two items in one list rather than a group label
 * over its contents.
 *
 * ⚠️ The `inert` + `aria-hidden` on the collapsed panel is REQUIRED, not
 * belt-and-braces. The panel animates to `height: 0` with `overflow: hidden`,
 * which hides it **visually only** — without these, every row inside a closed
 * section stays focusable and in the accessibility tree, so a keyboard user
 * tabs through invisible controls that silently change the detail canvas.
 * Confirmed live: focusing a row inside a collapsed section landed on a real
 * 320x44 box. Animated `height: 0` is not concealment.
 */
function TrackerSection({
  title,
  rows,
  open,
  onToggle,
  isFirst = false,
  isLast = false,
}: {
  title: string
  rows: TrackerRow[]
  open: boolean
  onToggle: () => void
  /** Whether this section sits at the tracker's physical top/bottom edge, so
   *  its own corners round to match the parent Card. The card is a scroll
   *  container, so whichever element is actually at the edge gets clipped to
   *  that curve — hence per-section flags rather than a fixed rule about first
   *  and last children. */
  isFirst?: boolean
  isLast?: boolean
}) {
  const completed = rows.filter((r) => r.success).length
  const panelId = useId()
  return (
    <div className="border-b border-hairline last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'flex min-h-12 w-full items-center gap-2 border-b border-hairline px-3 py-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
          // The open section reads as active against its `parchment` collapsed
          // siblings; without this every header looks identical regardless of
          // state.
          open ? 'bg-purple-50 hover:bg-purple-100' : 'bg-parchment hover:bg-parchment/70',
          isFirst && 'rounded-t-lg',
          // Only round the bottom when this is the last section AND collapsed,
          // i.e. when the header is genuinely the last visible element. If the
          // last section is open its rows sit at the card's bottom edge
          // instead, and rounding here too shows a stray curve mid-list.
          isLast && !open && 'rounded-b-lg',
        )}
      >
        <span className="min-w-0 flex-1 text-body font-semibold text-ink">
          {title}
        </span>
        <span className="shrink-0 text-caption font-medium tabular-nums text-ink-faint">
          {completed}/{rows.length}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 text-ink-faint transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div
          id={panelId}
          role="region"
          aria-label={title}
          aria-hidden={!open}
          inert={!open}
          className={cn(
            'py-1',
            // When the last section is expanded its rows form the card's bottom
            // edge, so clip them with `overflow-hidden` rather than trying to
            // round whichever row happens to be last.
            isLast && 'overflow-hidden rounded-b-lg',
          )}
        >
          <TrackerRowList rows={rows} />
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Learning Progress synthesis view                                          */
/* ------------------------------------------------------------------------ */

/** The Learning Progress card chassis: a tinted header band over a hairline
 *  divider over content. Card titles are sentence case, app-wide. */
function SynthesisCard({
  title,
  subtitle,
  headerClassName,
  subtitleClassName,
  className,
  children,
}: {
  title: string
  subtitle?: string
  /** Overrides the header band's default `bg-purple-50`, the record pages'
   *  header convention. */
  headerClassName?: string
  /** Overrides the subtitle's default type/tone. */
  subtitleClassName?: string
  /** Overrides the card's default radius. */
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn('gap-0 rounded-lg py-0', className)}>
      <div className={cn('bg-purple-50 p-6', headerClassName)}>
        {/* Card titles here are a step SMALLER than the tab's own intro heading
            above them, so the intro stays the visual anchor for the tab. Do not
            promote them to `text-title`. */}
        <h2 className="font-display text-body-md text-ink">{title}</h2>
        {subtitle ? (
          <p className={cn('mt-1 text-caption text-ink-muted', subtitleClassName)}>{subtitle}</p>
        ) : null}
      </div>
      {/* `flex-1` is required when this card is height-matched to a taller
          sibling: `Card`'s `h-full` stretches only the outer box, so without it
          this content section keeps its natural height and leaves dead space
          inside the taller box.
          Content stays top-aligned, not centred. The SIPTEA table is always 6
          rows while the module list grows with completed-module count, so the
          shorter side keeps its leftover space at the bottom. That is an
          accepted trade-off of matching two different-length lists to one
          height, not a bug to chase. */}
      <div className="flex-1 border-t border-hairline p-6 pt-4">{children}</div>
    </Card>
  )
}

const LEARNING_FLAG_COPY: Record<LearningFlag['kind'], (flag: LearningFlag) => string> = {
  'missed-question': (flag) =>
    flag.kind === 'missed-question'
      ? `Missed at least one knowledge-check question on "${flag.moduleTitle}".`
      : '',
  'short-response': (flag) =>
    flag.kind === 'short-response'
      ? `Scenario response on "${flag.moduleTitle}" is notably brief (${flag.length} characters).`
      : '',
  'accuracy-drop': (flag) =>
    flag.kind === 'accuracy-drop'
      ? `Knowledge-check accuracy dropped ${flag.dropPoints} points from "${flag.fromModuleTitle}" to "${flag.toModuleTitle}".`
      : '',
}

/** ⚠️ EXPORTED, RENDERED NOWHERE. Removed from the Learning Progress tab on
 *  researcher feedback; preserved deliberately for possible reuse alongside its
 *  `learningFlags` helper, not dead by accident.
 *
 *  Renders nothing at all (not an empty card) when there are no flags. The icon
 *  uses `destructive`, the app's semantic tone for an alert callout — amber is
 *  reserved for the pending-invite state and must not be reused here. */
export function LearningFlagsCard({ flags }: { flags: LearningFlag[] }) {
  if (flags.length === 0) return null
  return (
    <SynthesisCard title="Attention needed">
      <ul className="space-y-3">
        {flags.map((flag, i) => (
          <li key={i} className="flex items-start gap-2">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-caption text-ink-muted">{LEARNING_FLAG_COPY[flag.kind](flag)}</p>
          </li>
        ))}
      </ul>
    </SynthesisCard>
  )
}

/**
 * The Learning Progress KPI row: four tiles directly under the shared
 * `TabIntro`, with no heading of its own — it is part of the intro block, not a
 * separate section.
 *
 * Three are plain `StatCard`s, unmodified: it is a shared component used
 * identically on Home, Trainee Management and Consumer Management, so its
 * type and weight choices are not overridden here.
 *
 * The fourth, "Reviews shared", is local rather than a `StatCard` variant
 * because it has no single number — it is a Baseline/Midline/Endline
 * breakdown of three word values stacked label-over-value. `StatCard`'s
 * `breakdown` prop baseline-aligns short numeric parts and is the wrong shape
 * for it.
 */
function LearningKpiRow({
  coach,
  completedCount,
  totalModules,
  averageAccuracyValue,
  sipteaAssessedCount,
}: {
  coach: Coach
  completedCount: number
  totalModules: number
  averageAccuracyValue: number | null
  sipteaAssessedCount: number
}) {
  return (
    /* LOAD-BEARING, not cosmetic: 3 flexible tiles plus a FIXED 400px "Reviews
       shared" tile, never 4 equal quarters. That tile has three sub-columns of
       its own; at equal quarters each gets too little width and every value
       clips to an ellipsis. The 400px track gives each sub-column ~117px, which
       fits the longest real value. */
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_400px]">
      <StatCard
        label="Modules completed"
        value={`${completedCount} of ${totalModules}`}
        icon={BookOpen}
      />
      <StatCard
        label="Avg. knowledge check accuracy"
        value={averageAccuracyValue === null ? '—' : `${averageAccuracyValue}%`}
        icon={CheckCircle2}
      />
      <StatCard
        label="SIPTEA understanding"
        value={`${sipteaAssessedCount} of 6`}
        icon={Clock}
      />
      <ReviewsSharedTile coach={coach} />
    </div>
  )
}

/** "Reviews shared" — the fourth KPI tile. Same outer shell as `StatCard` for
 *  visual parity in the row, with a bespoke three-column body for the
 *  Baseline/Midline/Endline timepoints.
 *
 *  Three states, and collapsing any two of them loses information: "Yes"
 *  (shared), "No" (exists but withheld — the one worth chasing) and an em dash
 *  (not yet reached). The dash carries an `sr-only` "Not yet reached", because a
 *  screen reader landing on a bare dash in a `<dd>` gets nothing. */
function ReviewsSharedTile({ coach }: { coach: Coach }) {
  const entries = annotationProgression(coach)
  return (
    <div className="h-full min-h-[120px] rounded-[12px] bg-yellow-100 p-4">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-caption text-ink">Reviews shared</p>
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center">
            <TriangleAlert className="size-[18px] text-purple-500" />
          </span>
        </div>
        <dl className="mt-auto flex gap-4">
          {entries.map((entry) => {
            const item = REVIEW_ITEMS.find((i) => i.timepoint === entry.timepoint)
            const notReached = !entry.exists
            const value = notReached ? '—' : entry.shared ? 'Yes' : 'No'
            return (
              <div key={entry.timepoint} className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <dt className="truncate text-caption-medium text-ink-faint">
                  {item?.shortLabel}
                </dt>
                <dd className="truncate text-title text-ink">
                  {notReached ? (
                    <>
                      <span aria-hidden="true">{value}</span>
                      <span className="sr-only">Not yet reached</span>
                    </>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </div>
  )
}

/**
 * Module-by-module knowledge-check accuracy, in curriculum order.
 *
 * A list, not a chart, and deliberately so: every value is readable without
 * hover or focus, and titles are never truncated. The empty state fires only at
 * zero entries — a single completed module is worth showing on its own.
 *
 * The sub copy names what this MEASURES (module understanding), not what it is,
 * so it reads as a pair with the SIPTEA card beside it.
 */
function ModuleBreakdownCard({ entries }: { entries: ModuleAccuracyEntry[] }) {
  return (
    <SynthesisCard
      title="Knowledge-check accuracy"
      subtitle="Overall understanding of each module's content."
      subtitleClassName="text-body text-ink"
      className="h-full rounded-[12px]"
    >
      {entries.length === 0 ? (
        <p className="text-caption text-ink-faint">
          No completed modules with a knowledge check yet.
        </p>
      ) : (
        <div className="flex h-full flex-col gap-8">
          <p
            id="module-breakdown-heading"
            className="shrink-0 border-b border-ink-faint pb-3.5 text-body-md text-ink"
          >
            Module breakdown
          </p>
          {/* `justify-between` + `flex-1`: when this card is the shorter side of
              a height-matched pair, the rows keep their own size and only the
              gaps between them absorb the slack — instead of one dead block
              collecting below the last row. `gap-8` is the floor. */}
          <ul
            className="flex flex-1 flex-col justify-between gap-8"
            aria-labelledby="module-breakdown-heading"
          >
            {entries.map((e) => (
              <li key={e.title} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-caption-medium">
                  <span className="min-w-0 flex-1 truncate text-ink">{e.title}</span>
                  <span className={cn('shrink-0', accuracyColorClass(e.accuracy))}>
                    {e.accuracy}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-parchment">
                  <div
                    className="h-full rounded-full bg-purple-400"
                    style={{ width: `${e.accuracy}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SynthesisCard>
  )
}

/**
 * SIPTEA breakdown — all 6 components, always. Each row shows its mapped core
 * skills and the real average accuracy across only the modules this trainee has
 * actually completed with question-bank data.
 *
 * **Never shows a percentage when nothing has been assessed.** Two components
 * (I and T) have no question-bank content mapped to them at all and so always
 * render a dash; so does any component the trainee has not reached. A
 * fabricated 0% would read as a failing score rather than an absent one.
 *
 * The subject of this page is a **trainee**, not a coach, and this card shows
 * one person, not a cohort — keep the copy singular and trainee-facing.
 */
function SipteaBreakdownCard({ coach }: { coach: Coach }) {
  const breakdown = sipteaBreakdown(coach)

  return (
    <SynthesisCard
      title="SIPTEA component breakdown"
      subtitle="Understanding of each SIPTEA framework component."
      subtitleClassName="text-body text-ink"
      className="h-full rounded-[12px]"
    >
      {/* An ARIA table over CSS Grid, not a real `<table>`, and that is
          deliberate: a `<table>`'s row heights are driven by its own layout
          algorithm, so there is no way to make only the gaps between rows
          flexible. This card is height-matched to its sibling, and the rows
          need to keep their size while the gaps absorb the slack. The ARIA
          roles are what keep it a table to assistive tech — do not drop them,
          and keep `role="row"` / `"columnheader"` / `"cell"` in sync if you
          change the structure. */}
      <div role="table" className="flex h-full flex-col">
        <div role="row" className="grid shrink-0 grid-cols-[220px_1fr_140px] border-b border-ink-faint pb-3.5">
          <span role="columnheader" className="text-body-md text-ink">
            SIPTEA
          </span>
          <span role="columnheader" className="text-body-md text-ink">
            Skills
          </span>
          <span role="columnheader" className="text-right text-body-md whitespace-nowrap text-ink">
            Check Accuracy
          </span>
        </div>
        <div role="rowgroup" className="flex flex-1 flex-col justify-between">
          {breakdown.map((item, i) => (
            <div
              key={item.letter}
              role="row"
              className={cn(
                'grid grid-cols-[220px_1fr_140px] items-center py-3.5',
                i < breakdown.length - 1 && 'border-b border-hairline',
              )}
            >
              <div role="cell" className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full text-[20px]',
                    SIPTEA_LETTER_STYLE[item.letter],
                  )}
                >
                  {item.letter}
                </span>
                <span className="text-caption-medium text-ink">{item.label}</span>
              </div>
              <div role="cell">
                <ul className="flex flex-col gap-1">
                  {(item.skills.length > 0
                    ? item.skills
                    : ['No core skill maps to this component']
                  ).map((skill) => (
                    <li key={skill} className="list-disc text-caption text-ink ms-[21px]">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
              <div role="cell" className="pr-4 text-right">
                <span
                  className={cn(
                    'text-caption-medium',
                    item.averageAccuracy === null
                      ? 'text-ink-faint'
                      : accuracyColorClass(item.averageAccuracy),
                  )}
                >
                  {item.averageAccuracy === null ? '–' : `${item.averageAccuracy}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SynthesisCard>
  )
}

/** ⚠️ EXPORTED, RENDERED NOWHERE. Removed from the Learning Progress tab on
 *  researcher feedback; preserved deliberately alongside `cohortAverageAccuracy`.
 *
 *  Compares this trainee's average accuracy against their cohort's, with an
 *  honest fallback string when either side has no qualifying data — never a
 *  fabricated benchmark. Note "cohort" is no longer a user-facing concept
 *  anywhere else in the app. */
export function CohortComparisonLine({
  coach,
  averageAccuracyValue,
  cohortAverage,
}: {
  coach: Coach
  averageAccuracyValue: number | null
  cohortAverage: number | null
}) {
  if (averageAccuracyValue === null) {
    return (
      <p className="text-caption text-ink-faint">
        No completed modules with a knowledge check yet to compare against {coach.cohort}.
      </p>
    )
  }
  if (cohortAverage === null) {
    return (
      <p className="text-caption text-ink-faint">
        This trainee: {averageAccuracyValue}% · No other {coach.cohort} coach has qualifying
        data yet.
      </p>
    )
  }
  return (
    <p className="text-caption text-ink-faint">
      This trainee: {averageAccuracyValue}% · {coach.cohort} average: {cohortAverage}%
    </p>
  )
}

/**
 * Learning Progress tab. Top to bottom: KPI row, two insight cards, then a
 * master-detail region — an accordion rail of every module and annotation
 * timepoint on the left, and the selected item's actual content on the right.
 *
 * Below `lg` the accordion is replaced by a labelled `<select>` carrying the
 * same rows; both drive one `selection` state.
 */
function LearningProgress({ coach }: { coach: Coach }) {
  const { coaches } = useResearch()
  const ordered = PATHWAY_MODULES_V2
    .map((m) => coach.moduleRecords.find((r) => r.moduleId === m.id))
    .filter((r): r is ModuleRecord => Boolean(r))
  const firstNonEmpty =
    ordered.find((r) => r.status !== 'not-started')?.moduleId ?? ordered[0]?.moduleId ?? ''
  const [selection, setSelection] = useState<ReviewSelection>({
    kind: 'module',
    moduleId: firstNonEmpty,
  })

  // Open the group holding the trainee's current module — the same one
  // `selection` starts on — and collapse everything else, so the rail does not
  // dump every group open on arrival.
  const defaultOpenKey =
    MODULE_GROUPS.find((g) => g.moduleIds.includes(firstNonEmpty))?.key ??
    MODULE_GROUPS[0]?.key ??
    'foundational'
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    [defaultOpenKey]: true,
  }))
  // Single-open accordion: opening one section closes any other, and toggling
  // the open one collapses it, leaving all closed.
  const toggleSection = (key: string) =>
    setOpenSections((prev) => (prev[key] ? {} : { [key]: true }))

  // Drives a "Show more" cue when the rail has rows below the fold, so the last
  // rows (always the annotation timepoints) don't sit silently out of view.
  const trackerRef = useRef<HTMLDivElement>(null)
  const [hasMoreBelow, setHasMoreBelow] = useState(false)

  const updateHasMoreBelow = () => {
    const el = trackerRef.current
    if (!el) return
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
  }

  useEffect(() => {
    updateHasMoreBelow()
    window.addEventListener('resize', updateHasMoreBelow)
    return () => window.removeEventListener('resize', updateHasMoreBelow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach.id])

  // DO NOT MOVE THIS GUARD ABOVE THE HOOKS. Every hook above must run
  // unconditionally (Rules of Hooks); the early return sits here, before the
  // heavier derived data below.
  if (coach.inviteStatus === 'pending')
    return (
      <NoDetailsAvailable
        icon={BookOpen}
        heading="Learning progress will appear here"
        body="Module engagement shows up automatically once this trainee accepts their invite and starts training."
      />
    )

  const selectedRecord =
    selection.kind === 'module'
      ? ordered.find((r) => r.moduleId === selection.moduleId)
      : undefined
  const selectedReviewItem =
    selection.kind === 'annotation'
      ? REVIEW_ITEMS.find((i) => i.timepoint === selection.timepoint)
      : undefined

  // Every figure below comes from the derivation block near the top of this
  // file. Do not recompute any of them inline.
  const completedCount = ordered.filter((r) => r.status === 'completed').length
  const totalModules = ordered.length
  const withBank = completedModulesWithBank(coach)
  const averageAccuracyValue = averageAccuracy(withBank)
  // How many of the 6 SIPTEA components have at least one genuinely assessed
  // module behind them — never a fabricated count.
  const sipteaAssessedCount = sipteaBreakdown(coach).filter(
    (item) => item.averageAccuracy !== null,
  ).length
  // Computed for `CohortComparisonLine`, which is currently not rendered. The
  // `void` keeps `noUnusedLocals` quiet without deleting the computation.
  const cohortAverage = cohortAverageAccuracy(coach, coaches)
  void cohortAverage

  // Row shape shared by the desktop accordion and the mobile `<select>`, so the
  // two can never offer different sets of rows.
  function moduleRow(r: ModuleRecord) {
    const rate = completionRate(r)
    return {
      key: r.moduleId,
      label: moduleTitle(r.moduleId),
      status: `${rate}%`,
      success: rate === 100,
      active: selection.kind === 'module' && selection.moduleId === r.moduleId,
      onSelect: () => setSelection({ kind: 'module' as const, moduleId: r.moduleId }),
    }
  }

  const byId = new Map(ordered.map((r) => [r.moduleId, r]))

  // Groups come from `MODULE_GROUPS` in curriculum order — never a hardcoded
  // list of tiers. That data file is the single definition of what the
  // curriculum contains, so no surface can disagree about it.
  const moduleGroupSections = MODULE_GROUPS.map((g) => ({
    key: g.key,
    title: g.title,
    rows: g.moduleIds
      .map((id) => byId.get(id))
      .filter((r): r is ModuleRecord => Boolean(r))
      .map(moduleRow),
  })).filter((section) => section.rows.length > 0)

  const reviewRows = REVIEW_ITEMS.map((item) => {
    const a = coach.annotationSummaries.find((s) => s.timepoint === item.timepoint)
    return {
      key: item.timepoint,
      label: item.label,
      status: !a ? 'Not yet' : a.shared ? 'Shared' : 'Not shared',
      success: Boolean(a?.shared),
      active: selection.kind === 'annotation' && selection.timepoint === item.timepoint,
      onSelect: () =>
        setSelection({ kind: 'annotation' as const, timepoint: item.timepoint }),
    }
  })

  return (
    // The negative top margin pulls the KPI row closer to the tab intro,
    // because it belongs to that intro block rather than being a new section.
    // The shared wrapper's gap and `TabIntro`'s own padding are both used by the
    // other tabs, so the correction is made here rather than by shrinking
    // either of those. Measured live, not calculated.
    <div className="-mt-8 space-y-14">
      {/* The KPI row must be the first visible content on this tab,
          unconditionally. */}
      <LearningKpiRow
        coach={coach}
        completedCount={completedCount}
        totalModules={totalModules}
        averageAccuracyValue={averageAccuracyValue}
        sipteaAssessedCount={sipteaAssessedCount}
      />
      {/* `LearningFlagsCard` and `CohortComparisonLine` were both removed from
          this tab on researcher feedback. Both components and their derivation
          helpers are preserved above, deliberately unused — see their docs. */}
      {/* UNEQUAL WIDTHS ARE THE FIX, not a style choice. At a 50/50 split the
          SIPTEA table's three columns are too narrow and its longest skill
          label wraps onto three lines. Caught by measurement, not by eye — do
          not "tidy" this into an even split.
          Heights stretch (the flex default): the SIPTEA table is reliably
          taller, and the shorter card should match it rather than end short. */}
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full lg:w-[420px] lg:shrink-0">
          <ModuleBreakdownCard entries={withBank} />
        </div>
        <div className="w-full min-w-0 lg:flex-1">
          <SipteaBreakdownCard coach={coach} />
        </div>
      </div>

      {/* This heading block must stay ABOVE the grid, not inside its left
          column. Put it in the column and only that column shifts down by the
          heading's height, so the detail canvas top-aligns with the heading text
          instead of with the card beside it and leaves a visible notch. It also
          describes the whole master-detail region, not just the left list.
          `hidden lg:block` because below `lg` the rail is replaced by the
          labelled `<select>` above. */}
      <div className="hidden lg:block">
        <h2 className="font-display text-title">Module engagement tracker</h2>
        <p className="mt-1 text-caption text-ink-faint">
          Every module and reflection timepoint, grouped by curriculum tier.
        </p>
      </div>
      {/* Pulls this grid closer to the heading directly above it, overriding the
          outer container's section gap for this one pair only. */}
      <div className="-mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Below `lg` the accordion rail is replaced by this labelled select,
            built from the same `moduleGroupSections` / `REVIEW_ITEMS` data, so
            the two can never offer different rows. */}
        <div className="lg:hidden">
          <label htmlFor="review-select" className="text-fine text-ink-faint">
            Review
          </label>
          <select
            id="review-select"
            value={
              selection.kind === 'module'
                ? `module:${selection.moduleId}`
                : `annotation:${selection.timepoint}`
            }
            onChange={(e) => {
              const [kind, id] = e.target.value.split(':')
              setSelection(
                kind === 'module'
                  ? { kind: 'module', moduleId: id }
                  : { kind: 'annotation', timepoint: id as 'baseline' | 'midline' | 'endline' },
              )
            }}
            className="mt-1 h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          >
            {moduleGroupSections.map((section) => (
              <optgroup key={section.key} label={section.title}>
                {section.rows.map((row) => (
                  <option key={row.key} value={`module:${row.key}`}>
                    {row.label} ({row.status})
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Annotation summaries">
              {REVIEW_ITEMS.map((item) => (
                <option key={item.timepoint} value={`annotation:${item.timepoint}`}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* The rail is capped and scrollable to match the detail canvas's own
            viewport-relative cap. Without the cap the rail's natural height
            stretches the grid row past the canvas's max-height, leaving dead
            space beside it. The "Show more" cue below fades in whenever there
            is content past the fold. */}
        <div className="relative hidden self-start lg:block">
          <Card
            ref={trackerRef}
            onScroll={updateHasMoreBelow}
            className="max-h-[70vh] gap-0 overflow-y-auto rounded-lg py-0 ring-hairline"
          >
            <nav aria-label="Engagement tracker">
              {/* Sections come from `MODULE_GROUPS` — the curriculum's own tiers
                  — plus a final "Annotation summaries" group for the three
                  reflection timepoints, which need a boundary of their own
                  rather than being tacked onto the end of the module list.
                  `nav` carries NO padding on purpose. An earlier version used
                  padding to keep sections clear of the Card's rounded corners,
                  which meant any future padding change would silently
                  reintroduce a square-corner-against-round-corner mismatch. The
                  corners are now handled directly by each section's own
                  `isFirst`/`isLast`, so the fix holds regardless of padding or
                  which section is expanded. */}
              <div>
                {moduleGroupSections.map((section, index) => (
                  <TrackerSection
                    key={section.key}
                    title={section.title}
                    rows={section.rows}
                    open={Boolean(openSections[section.key])}
                    onToggle={() => toggleSection(section.key)}
                    isFirst={index === 0}
                  />
                ))}
                <TrackerSection
                  title="Annotation summaries"
                  rows={reviewRows}
                  open={Boolean(openSections.reflective)}
                  onToggle={() => toggleSection('reflective')}
                  isFirst={moduleGroupSections.length === 0}
                  isLast
                />
              </div>
            </nav>
          </Card>
          <button
            type="button"
            aria-hidden={!hasMoreBelow}
            tabIndex={hasMoreBelow ? 0 : -1}
            onClick={() => {
              const el = trackerRef.current
              if (!el) return
              el.scrollBy({ top: el.clientHeight * 0.6, behavior: 'smooth' })
            }}
            className={cn(
              // KEEP THE FADE AT 5%. Above roughly 8% the white overlay washes
              // the rows beneath it below WCAG AA — the success-green "Shared"
              // status text drops under 4.5:1. The opaque pill is the real
              // affordance; the gradient is only a soft seam.
              'absolute inset-x-0 bottom-0 flex justify-center rounded-b-lg bg-gradient-to-t from-card/5 to-transparent pt-8 pb-2 transition-opacity duration-200',
              hasMoreBelow ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <span className="flex items-center gap-1 rounded-full bg-card px-3 py-1 text-fine font-semibold text-primary shadow-card ring-1 ring-hairline">
              Show more
              <ChevronDown aria-hidden="true" className="size-3.5" />
            </span>
          </button>
        </div>

        {/* The detail canvas. It is the container itself — no outer card — and
            scrolls internally. Deliberately no title or status above it: the
            selected rail row already names what is shown. Its fill is
            `parchment`, a real surface token; do not reach for `hairline`,
            which is a border token. */}
        {selectedRecord ? (
          <div className="max-h-[70vh] min-h-[320px] space-y-4 overflow-y-auto rounded-lg bg-parchment p-4 pb-6 shadow-none md:p-6 md:pb-8">
            <ModuleSlides coach={coach} record={selectedRecord} />
          </div>
        ) : selectedReviewItem ? (
          <div className="max-h-[70vh] min-h-[320px] space-y-4 overflow-y-auto rounded-lg bg-parchment p-4 pb-6 shadow-none md:p-6 md:pb-8">
            <AnnotationSlide
              coach={coach}
              timepoint={selectedReviewItem.timepoint}
              shortLabel={selectedReviewItem.shortLabel}
            />
          </div>
        ) : (
          <div className="rounded-lg bg-parchment p-6">
            <p className="text-caption text-ink-faint">No module records yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Stage Management                                                          */
/* ------------------------------------------------------------------------ */

/** One phase's pending action, awaiting confirmation. */
interface PendingPhaseAction {
  phase: number
  name: string
  action: 'complete' | 'incomplete'
}

/**
 * The stage pipeline — the ONE place a researcher actually changes a trainee's
 * progress. Every other surface on this page reads that state; this writes it.
 *
 * Writes go to `togglePhase`, which flips the store's `phaseCompletion` slice
 * and stamps or clears `phaseCompletionDates`. It never touches
 * `Coach.currentPhase` — see the file header on why those are separate.
 *
 * Two safeguards, both deliberate:
 *  - Every change is confirmation-gated. Marking a stage complete advances a
 *    participant through a certification pathway; it is not an undo-able toggle.
 *  - **Once certification is recorded as Pass, every stage locks.** A certified
 *    record must not be silently altered underneath the outcome that depends on
 *    it. Record a different outcome first to unlock.
 */
function StagePipeline({ coach }: { coach: Coach }) {
  const { phaseCompletion, togglePhase } = useResearch()
  const completed = phaseCompletion[coach.id] ?? []
  const firstName = coach.fullName.split(' ')[0]
  const [pending, setPending] = useState<PendingPhaseAction | null>(null)

  // Drives BOTH the "Ongoing" chip and which row shows "Mark complete", so the
  // label and the button can never point at different rows. -1 when every stage
  // is complete.
  const firstIncompleteIndex = PIPELINE_PHASES.findIndex(
    (p) => !completed.includes(p.number),
  )

  return (
    <Card
      className="h-full gap-0 rounded-lg border border-parchment bg-card py-0 shadow-card"
    >
      {/* A real table header row, not a card title block — the tab intro above
          the card already carries the title.
          `purple-50`, NOT `--color-card-header` (`purple-200`, a visibly darker
          step). No bottom stroke: the tint is the boundary, so a hairline under
          it would be a second, redundant one. Deliberate divergence from the
          app-wide "one hairline under every card title" rule.
          `ink-muted` on this band measures 11.19:1. */}
      <div className="flex items-center justify-between rounded-t-lg bg-purple-50 p-6">
        <p className="w-[180px] text-caption-medium text-ink-muted">Stage &amp; progress</p>
        <p className="w-[160px] text-center text-caption-medium text-ink-muted">Action</p>
      </div>

      {/* This card is height-matched to its taller sibling, so the five rows
          must absorb the leftover height. Each ROW GROWS (`flex-1` on the
          `<li>`, `min-h-16` as the floor) — the list must NOT add gaps between
          them. `justify-between` here would break the timeline: the connector is
          a `flex-1` span inside each row's own track, so it only draws a
          continuous line if rows stay flush and absorb slack internally. */}
      <div className="flex flex-1 flex-col px-6 py-4">
        {coach.certification.outcome === 'pass' && (
          <p className="mb-2 flex items-center gap-1.5 text-fine text-ink-muted">
            <Lock aria-hidden="true" className="size-3.5" />
            All stages are locked while certification is Pass.
          </p>
        )}
        <ol className="flex flex-1 flex-col">
          {PIPELINE_PHASES.map((phase, i) => {
            const done = completed.includes(phase.number)
            const last = i === PIPELINE_PHASES.length - 1
            const lockedByPass =
              coach.certification.outcome === 'pass' && CERT_REQUIRED_PHASES.includes(phase.number)
            // "Ongoing" is the first stage not yet ticked, derived from the same
            // index the "Mark complete" button uses, so the chip and the button
            // can never point at different rows.
            const ongoing = !done && i === firstIncompleteIndex
            return (
              /* Fixed-height rows with vertically centred content. The height is
                 tuned for the two-line stage label plus its chip; dropping it
                 packs five rows into a dense block. */
              <li key={phase.number} className="flex min-h-16 flex-1 items-center gap-4">
                {/* The connector is split ABOVE and BELOW the marker (each
                    `flex-1`, transparent at the two open ends), not a single run
                    below it. That split is what lets fixed-height rows still
                    draw one continuous line through all five nodes. */}
                <div className="flex h-full w-7 shrink-0 flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'w-[1.5px] flex-1',
                      i === 0 ? 'bg-transparent' : done ? 'bg-success/80' : 'bg-ink-faint/80',
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full',
                      done ? 'bg-success text-white' : 'border border-ink-faint bg-card',
                    )}
                  >
                    {done ? (
                      <Check className="size-4" />
                    ) : (
                      <span className="size-2 rounded-full bg-divider-soft" />
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    // Do not lighten these connector tones. `divider-soft` and
                    // `success/40` both measure under 2:1 against the row's white
                    // background, short of WCAG 1.4.11's 3:1 floor for a UI
                    // boundary. Measured, not estimated.
                    className={cn(
                      'w-[1.5px] flex-1',
                      last ? 'bg-transparent' : done ? 'bg-success/80' : 'bg-ink-faint/80',
                    )}
                  />
                </div>

                {/* Stage label plus an explicit action. The marker dot is NEVER
                    a toggle — advancing a trainee through a certification stage
                    is not something a stray click should do. */}
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    {/* The status chip sits on the stage TITLE's line, not
                        centred against the whole two-line block, where it floats
                        between the two lines and belongs to neither. */}
                    <div className="flex items-center gap-4">
                      {/* Inline sizes: neither 15px nor 13px is a named step in
                          the type scale, and neither is worth minting a token
                          for one row. Do not add `leading-none` — collapsing
                          both lines to their font size makes the label block
                          visibly cramped. */}
                      <p className="text-[15px] font-bold whitespace-nowrap text-ink">
                        {stageShortName(phase.number)}
                      </p>
                      {/* Always the shared `<Chip>`, never a local pill. The
                          design's own status pill is off-palette and measures
                          3.66:1 (an AA failure), and hand-rolling it would add a
                          second chip geometry to an app that has one.
                          `next` for Ongoing is the same tone the Overview tab
                          uses for "Ready now", so both tabs describe the same
                          state identically. */}
                      {(done || ongoing) && (
                        <Chip tone={done ? 'success' : 'next'} label={done ? 'Complete' : 'Ongoing'} />
                      )}
                    </div>
                    <p className="text-[13px] whitespace-nowrap text-ink-faint">
                      {phase.shortLabel}
                    </p>
                  </div>

                  {done && lockedByPass ? (
                    <span
                      title={`Locked. ${firstName}'s certification is recorded as Pass. Record a different outcome to unlock editing.`}
                      className="flex size-9 shrink-0 items-center justify-center text-ink-faint"
                    >
                      <Lock aria-hidden="true" className="size-4" />
                      <span className="sr-only">
                        Locked. {firstName}'s certification is recorded as Pass. Record a
                        different outcome to unlock editing.
                      </span>
                    </span>
                  ) : done ? (
                    <Menu.Root>
                      <Menu.Trigger
                        aria-label={`More actions for ${stageShortName(phase.number)}: ${phase.shortLabel}`}
                        className="flex size-9 shrink-0 items-center justify-center rounded-sm text-ink-faint outline-none transition-colors hover:bg-pearl hover:text-ink focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                      >
                        <MoreVertical aria-hidden="true" className="size-4" />
                      </Menu.Trigger>
                      <Menu.Portal>
                        <Menu.Positioner side="bottom" align="end" className="z-50 outline-none">
                          <Menu.Popup className="min-w-[200px] rounded-sm bg-card p-1 text-caption shadow-card ring-1 ring-hairline outline-none">
                            <Menu.Item
                              onClick={() =>
                                setPending({
                                  phase: phase.number,
                                  name: phase.shortLabel,
                                  action: 'incomplete',
                                })
                              }
                              className="flex min-h-9 cursor-pointer items-center rounded-sm px-3 text-ink-muted outline-none data-[highlighted]:bg-pearl data-[highlighted]:text-ink"
                            >
                              Mark as incomplete
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setPending({
                          phase: phase.number,
                          name: phase.shortLabel,
                          action: 'complete',
                        })
                      }
                      // The app's utility-button family. Do not restyle it into
                      // a primary CTA: marking a stage complete is a
                      // confirmation-gated administrative action, not the page's
                      // headline call to action.
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-sm bg-pearl px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                    >
                      Mark complete
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.action === 'complete'
            ? `Mark ${stageShortName(pending.phase)} complete?`
            : `Mark ${pending ? stageShortName(pending.phase) : ''} as incomplete?`
        }
        body={
          pending?.action === 'complete'
            ? `Confirms ${stageShortName(pending.phase)}: ${pending.name} is done for ${firstName}.`
            : `Reverts ${pending ? stageShortName(pending.phase) : ''}: ${pending?.name} to not yet complete for ${firstName}. Use this if a stage was marked complete in error.`
        }
        confirmLabel={pending?.action === 'complete' ? 'Mark complete' : 'Mark as incomplete'}
        cancelLabel="Cancel"
        destructive={pending?.action === 'incomplete'}
        onConfirm={() => {
          if (pending) togglePhase(coach.id, pending.phase)
          setPending(null)
        }}
        onClose={() => setPending(null)}
      />
    </Card>
  )
}

/**
 * The certification card's illustration panel, shared by the locked and earned
 * states (direct instruction: the certificate is **not** hidden once every
 * stage is complete — it stays, at full opacity, with its rosette turned
 * green).
 *
 * Two real exported SVGs, both committed rather than hotlinked from the 7-day
 * Figma asset URL. This is an illustration, not an icon, so the app-wide
 * "icons come from lucide" rule doesn't reach it and there's no lucide
 * equivalent to reach for.
 *
 * `certificate-earned.svg` is `certificate.svg` with only the rosette's three
 * yellow steps replaced — the purple body is untouched. The greens are
 * **derived from the single `--color-success` token**, composited over white at
 * 35% / 65% / 100%, rather than inventing a three-step green ramp this palette
 * does not have:
 *
 *   #FFE299 (yellow-200) -> #B1D2B9   success @ 35%
 *   #FFCC4D (yellow-300) -> #6DAA7D   success @ 65%
 *   #FFB700 (~yellow-400) -> #1F7D37  success @ 100%
 *
 * If `--color-success` ever moves, regenerate the file from `certificate.svg`
 * with the same three mixes rather than hand-editing these hexes.
 */
function CertificateIllustration({ earned }: { earned: boolean }) {
  return (
    /* Full-width panel with the artwork centred. A fixed-width panel leaves a
       dead gutter beside it now that the card sits in a half-width column and
       stacks image above text. */
    <div className="w-full shrink-0 rounded-sm bg-yellow-100 p-4">
      <img
        src={earned ? '/illustrations/certificate-earned.svg' : '/illustrations/certificate.svg'}
        alt=""
        width={240}
        height={205}
        // Scales with the column: the SVG has a real `viewBox`, so `w-full
        // h-auto` keeps its ratio at any size, capped so it does not dominate a
        // wide screen.
        //
        // The dimming is DECORATIVE ONLY. The "N of 5 stages complete" line and
        // the outcome chip carry the same state in text, so nothing here is
        // conveyed by opacity or colour alone.
        className={cn(
          'mx-auto block h-auto w-full max-w-[300px] transition-opacity duration-300',
          earned ? 'opacity-100' : 'opacity-60',
        )}
      />
    </div>
  )
}

/**
 * Certification outcome — the write path for Placement 2's result.
 *
 * Locked until every one of the 5 pipeline stages is ticked; the locked state
 * says how many remain rather than hiding the card.
 *
 * Recording stays available for any outcome other than Pass, so a remediation
 * result is not a dead end and can be reassessed. Recording Pass, by contrast,
 * locks the whole stage pipeline (see `StagePipeline`).
 *
 * ⚠️ The Download / Share link / Send email buttons in the Pass state are
 * PROTOTYPE-ONLY. They only set a confirmation message; no certificate artifact
 * exists in the data model. `CertificationRecord.certificateGenerated` and
 * `.certificateDate` are declared, read by nothing, and are the intended hooks
 * for a real certificate service.
 */
function CertificationOutcome({ coach }: { coach: Coach }) {
  const { phaseCompletion, recordCertificationOutcome } = useResearch()
  const completed = phaseCompletion[coach.id] ?? []
  const doneCount = CERT_REQUIRED_PHASES.filter((p) => completed.includes(p)).length
  const unlocked = doneCount === CERT_REQUIRED_PHASES.length
  const cert = coach.certification
  const firstName = coach.fullName.split(' ')[0]
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [pendingOutcome, setPendingOutcome] = useState<
    'pass' | 'remediation-required' | null
  >(null)

  if (!unlocked) {
    return (
      /* Locked state. Every colour is an existing token — do not mint new ones
         to match a design's raw hexes. */
      <Card
        className="h-full gap-0 rounded-lg border border-parchment bg-yellow-50 py-0 shadow-card"
      >
        {/* Always stacked, illustration first. Side by side is cramped once the
            card sits in a half-width column. */}
        <div className="flex h-full flex-col gap-8 p-6">
          <CertificateIllustration earned={false} />
          <div className="flex min-w-0 flex-1 flex-col gap-6 p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Lock aria-hidden="true" className="size-[22px] shrink-0 text-ink" />
                {/* Inline size: not a named step in the scale, and not worth
                    minting a token for one card title. */}
                <h2 className="font-display text-[24px] font-bold tracking-[-0.24px] text-ink">
                  Certification outcome
                </h2>
              </div>
              <p className="text-body leading-[1.45] text-ink-muted">
                Certification unlocks once all training stages through Placement 2 are
                complete. Tick stages off in the pipeline to unlock it.
              </p>
            </div>
            <p className="text-body-md text-ink">
              {doneCount} of {CERT_REQUIRED_PHASES.length} stages complete
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    /* Earned state. It keeps the SAME illustration panel as the locked state,
       at full opacity with a green rosette — the certificate must not vanish at
       the moment it becomes true, or the transition reads as the artwork
       disappearing rather than as an achievement. */
    <Card
      className="h-full gap-0 rounded-lg border border-parchment bg-card py-0 shadow-card"
    >
      <div className="flex h-full flex-col gap-8 p-6">
        <CertificateIllustration earned />
        <div className="min-w-0 flex-1">
        {/* Outcome chip on the title's line; the assessed date on its own line
            below, since it is a detail about the outcome rather than part of
            the heading. */}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-title">Certification outcome</h2>
          <CertificationChip outcome={cert.outcome} />
        </div>
        {cert.assessedDate && (
          <p className="mt-2 text-caption text-ink-faint">
            Assessed {formatDate(cert.assessedDate)}
          </p>
        )}

        {cert.outcome === 'not-yet-assessed' && (
          <p className="mt-4 text-caption leading-[1.6] text-ink-muted">
            All stages are ticked, but no Placement 2 outcome has been recorded
            yet. Record the outcome once the expert assessor's SIPTEA
            competency checklist comes back.
          </p>
        )}
        {cert.outcome === 'remediation-required' && (
          <>
            {cert.note && (
              <div className="mt-4 rounded-sm border border-hairline bg-pearl p-4">
                <p className="text-fine font-semibold text-ink-muted">Assessor note</p>
                <p className="mt-1 text-caption leading-[1.6] text-ink-muted">
                  {cert.note}
                </p>
              </div>
            )}
            <p className="mt-4 text-caption leading-[1.6] text-ink-muted">
              Once {firstName} completes remediation and is reassessed, record
              the updated outcome below — this can be recorded again if
              remediation is needed more than once.
            </p>
          </>
        )}
        {/* Recording stays open for any outcome other than Pass, so both a
            first assessment and a later reassessment after remediation are
            possible. Remediation must not be a one-way dead end. */}
        {cert.outcome !== 'pass' && (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPendingOutcome('pass')}
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Record Pass
            </button>
            <button
              type="button"
              onClick={() => setPendingOutcome('remediation-required')}
              className="inline-flex h-9 items-center gap-2 rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Record remediation required
            </button>
          </div>
        )}

        {cert.outcome === 'pass' && (
          <>
            <p className="mt-4 text-caption leading-[1.6] text-ink-muted">
              {firstName} passed the Placement 2 assessment and is certified as a
              Care2Sleep sleep coach.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActionMsg('Certificate downloaded (prototype).')}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
              >
                <Download aria-hidden="true" className="size-4" />
                Download
              </button>
              <button
                type="button"
                onClick={() => setActionMsg('Shareable certificate link copied.')}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                <Link2 aria-hidden="true" className="size-4" />
                Share link
              </button>
              <button
                type="button"
                onClick={() => setActionMsg(`Certificate emailed to ${coach.email}.`)}
                className="inline-flex h-9 items-center gap-2 rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                <Mail aria-hidden="true" className="size-4" />
                Send email
              </button>
            </div>
            {actionMsg && (
              <p
                className="mt-3 flex items-center gap-1.5 text-caption font-semibold text-success"
                role="status"
              >
                <CheckCircle2 aria-hidden="true" className="size-4" />
                {actionMsg}
              </p>
            )}
          </>
        )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingOutcome !== null}
        title={
          pendingOutcome === 'pass'
            ? `Record a Pass for ${coach.fullName}?`
            : `Record remediation required for ${coach.fullName}?`
        }
        body={
          pendingOutcome === 'pass'
            ? `${firstName} will be certified as a Care2Sleep sleep coach. This should only be recorded once the expert assessor's SIPTEA competency checklist confirms it.`
            : `${firstName}'s certification is put on hold pending remediation. You can add the assessor's detailed note afterwards.`
        }
        confirmLabel={pendingOutcome === 'pass' ? 'Record Pass' : 'Record remediation required'}
        cancelLabel="Cancel"
        onConfirm={() => {
          if (pendingOutcome) recordCertificationOutcome(coach.id, pendingOutcome)
          setPendingOutcome(null)
        }}
        onClose={() => setPendingOutcome(null)}
      />
    </Card>
  )
}

function StageManagement({ coach }: { coach: Coach }) {
  if (coach.inviteStatus === 'pending')
    return (
      <NoDetailsAvailable
        icon={Milestone}
        heading="Stage progress will appear here"
        body="Certification stage tracking starts once this trainee accepts their invite."
      />
    )

  return (
    <div className="flex flex-col gap-6">
      {/* This tab renders its own intro inline rather than through the panel's
          shared block, because it pairs the intro with a right-aligned link.
          Overview does the same for its own reason. */}
      <div className="flex flex-col gap-8 pt-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="font-display text-title text-ink-muted">
            {TAB_INTRO['Stage Management'].title}
          </h2>
          <p className="text-body text-ink">{TAB_INTRO['Stage Management'].subtitle}</p>
        </div>
        {/* UNWIRED — and unlike most inert controls here, what it needs is a
            product decision (help centre? mailto? support form?), not an API.
            Research Home's own "Need help" pill is the same open question;
            resolve them together. */}
        <button
          type="button"
          aria-disabled="true"
          className="-my-3 shrink-0 rounded-sm py-3 text-caption-medium text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Need Help?
          <span className="sr-only"> (coming soon)</span>
        </button>
      </div>
      {/* Height matching depends on `h-full` on BOTH cards, not on the grid's
          `items-stretch` default — without it each sizes to its own content and
          the shorter leaves a ragged bottom edge.
          Not an even split: the pipeline holds five two-line rows plus a
          right-aligned action and needs the room, and narrowing the
          certification column is also what scales the certificate artwork,
          which is `w-full` and therefore sized by this ratio rather than by a
          fixed number. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.75fr_1fr]">
        <StagePipeline coach={coach} />
        <CertificationOutcome coach={coach} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Supervision notes                                                         */
/* ------------------------------------------------------------------------ */

/**
 * Supervision Notes — the researcher's notes about this trainee as a whole.
 *
 * Reuses `SupervisionRecords` from `SpacesCoachProfilePage.tsx` verbatim, no
 * fork; that page's Supervision Logs tab is the other caller and any change
 * lands on both. No `dyadId` is passed, because these notes are about the
 * trainee, not about any one consumer.
 *
 * ⚠️ Attachments are captured by filename only and never stored — see
 * `SupervisionRecords`' own doc.
 */
function SupervisionNotesTab({ coach }: { coach: Coach }) {
  if (coach.inviteStatus === 'pending')
    return (
      <NoDetailsAvailable
        icon={ClipboardList}
        heading="Supervision notes will appear here"
        body="Notes from supervision sessions with this trainee appear here once they accept their invite."
      />
    )

  return (
    // Closes most of the shared tabpanel wrapper's section gap below
    // `TabIntro`. The value is tuned to THIS page's wrapper gap — the SPACES
    // coach page's equivalent tab uses a smaller pull-up for the same visible
    // result, because its wrapper gap differs. Do not copy either number across.
    <div className="-mt-8">
      <SupervisionRecords
        coach={coach}
        fullWidthStack
        hideNotesHeader
        recordsHeading="Previous notes"
      />
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * The page shell: hero band, tab row, and the tab-panel switch.
 *
 * An unknown `:coachId` redirects to the roster. A pending-invite trainee gets
 * a persistent banner above the hero, and four of the five tabs render their
 * own "not available yet" state.
 */
export function CoachProfilePage() {
  const { coachId } = useParams()
  const { coaches } = useResearch()
  const [tab, setTab] = useState<Tab>('Overview')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const coach = coaches.find((c) => c.id === coachId)
  // The heading is a `tabIndex={-1}` focus target, which is why it carries a
  // ref. Keep both if you restructure the hero.
  const headingRef = useRef<HTMLHeadingElement>(null)
  if (!coach) return <Navigate to="/research/trainees" replace />

  const onTabKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next: number
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    setTab(TABS[next])
    tabRefs.current[next]?.focus()
  }

  return (
    <ResearchShell
      /* Solid `purple-700` record-page hero. All three researcher record pages
         share this treatment. The insets override the shell's defaults through
         `heroClassName`, which `cn()` merges last.
         NO BOTTOM PADDING, deliberately: the band's bottom edge IS the active
         tab's underline. That is also why `heroNoSeam` is absent here — the tab
         row closes the band out. Adding bottom padding breaks both. */
      heroClassName="bg-purple-700 px-6 pt-10 md:px-20 md:pt-10"
      topBanner={coach.inviteStatus === 'pending' ? <PendingInviteBanner coach={coach} /> : undefined}
      hero={
        <>
          {/* `-my-3 py-3` gives this link a 41px pointer target while
              contributing only its text height to the flow, so the band's
              geometry below is unchanged. Adding a `min-h` instead pushes the
              whole band down. */}
          <Link
            to="/research/trainees"
            /* `flex w-fit`, NOT `inline-flex`. An inline-level box sits in a
               line box whose strut is taller than the text, so the negative
               margins never fully cancel and the band comes out several px
               taller. Block-level flex has no strut. */
            className="-my-3 flex w-fit items-center gap-2 rounded-sm py-3 text-caption-medium text-white outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft aria-hidden="true" className="size-3" />
            Back to roster
          </Link>

          {/* Identity above, tabs in their own row below — a right-aligned tab
              bar gets crowded by long names.
              The "Trainee:" eyebrow says what kind of record this is, which
              matters on a deep link where nothing else does. `parchment`
              measures 9.75:1 on this band and white 10.62:1.
              No participant ID and no lifecycle chip: the ID is a lookup key
              already on the roster and on Personal details, and the chip
              duplicates the state the pending-invite banner announces. */}
          <div className="mt-12 flex flex-col gap-2">
            <p className="text-body-md text-parchment">Trainee:</p>
            <h1 ref={headingRef} tabIndex={-1} className="font-display text-display-lg text-white outline-none">
              {coach.fullName}
            </h1>
          </div>

          <div
            role="tablist"
            aria-label="Coach profile sections"
            /* DO NOT "TIDY" `mt-[33px]` INTO `mt-12`. The design puts 48px
               between the name block and the tab TEXT, but these tabs carry
               `min-h-11` for the 44px touch-target floor, which bottom-aligns
               their text 15px lower inside the button. The margin absorbs that
               difference (48 - 15 = 33) so the text lands where it should, and
               33 + 44 is also what closes the band out at its intended height.
               Both other record pages carry the identical number. */
            className="mt-[33px] flex items-end gap-8 overflow-x-auto"
          >
            {TABS.map((t, i) => {
              const active = t === tab
              return (
                <button
                  key={t}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`tabpanel-${i}`}
                  id={`tab-${i}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={cn(
                    'relative flex min-h-11 shrink-0 items-end pb-3 whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white',
                    active
                      ? 'text-caption-medium text-white'
                      : 'text-caption text-on-purple-muted hover:text-white',
                  )}
                >
                  {t}
                  {active && (
                    <motion.span
                      layoutId="coach-profile-tab-underline"
                      /* Yellow, not `primary`: `primary` IS this band's colour
                         and would be invisible on it. The `layoutId` must stay
                         unique per mounted tab row — `framer-motion` animates
                         between elements sharing one. */
                      className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-yellow-300"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </>
      }
    >
      {/* Withdrawn banner */}
      {coach.status === 'withdrawn' && coach.withdrawalNote && (
        <Card className="mt-8 gap-0 rounded-lg bg-pearl py-0">
          <div className="p-5">
            <p className="text-caption font-semibold text-ink-muted">
              {coach.fullName} withdrew from the study.
            </p>
            <p className="mt-1 text-caption text-ink-faint">
              {coach.withdrawalNote}
            </p>
          </div>
        </Card>
      )}

      <div
        role="tabpanel"
        id={`tabpanel-${TABS.indexOf(tab)}`}
        aria-labelledby={`tab-${TABS.indexOf(tab)}`}
        // All three record pages use this same 40px section rhythm. Changing it
        // here means changing it on the other two.
        className="mt-16 flex flex-col gap-10"
      >
        {/* Three tabs opt out of the shared intro block, for different reasons.
            Overview and Stage Management each render their own `TabIntro`
            INLINE, because each pairs it with something on the same row.
            Personal details renders none at all: both of its cards carry a
            header band naming themselves, so a third title would say the same
            words a third time. */}
        {tab !== 'Overview' && tab !== 'Stage Management' && tab !== 'Personal details' && (
          <TabIntro {...TAB_INTRO[tab]} />
        )}
        {tab === 'Overview' && (
          <Overview
            coach={coach}
            onGoToTab={(next) => {
              setTab(next)
              // DO NOT REMOVE. The button that triggered this unmounts with the
              // Overview panel, dropping keyboard focus to `<body>`. Focus moves
              // to the tab it just activated, which stays mounted and is where a
              // keyboard user expects to land.
              tabRefs.current[TABS.indexOf(next)]?.focus()
            }}
          />
        )}
        {tab === 'Learning Progress' && <LearningProgress coach={coach} />}
        {tab === 'Stage Management' && <StageManagement coach={coach} />}
        {tab === 'Supervision Notes' && <SupervisionNotesTab coach={coach} />}
        {tab === 'Personal details' && <PersonalDetails coach={coach} />}
      </div>

    </ResearchShell>
  )
}
