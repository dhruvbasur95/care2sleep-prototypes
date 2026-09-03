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

/** Round 9.1: reordered + renamed so researchers see progress first — Learning
 *  Progress (was Training Review), then Stage Management (was Trainee
 *  Tracking), then Personal details. Session Recordings was split out of
 *  Learning Progress into its own tab after Stage Management (Round 9.1), then
 *  removed from this page entirely per direct instruction — Coach Management's
 *  own `SpacesCoachProfilePage.tsx` carries its own, independent Session
 *  Recordings tab and is unaffected by this removal.
 *
 *  Overview added as the first tab in the list — a placeholder for a future
 *  at-a-glance summary. The default *shown* tab on arrival is set separately
 *  (see `CoachProfilePage`'s own `useState<Tab>('Learning Progress')`) — tab
 *  order in this array only drives the visible tab-bar order and keyboard
 *  Home/End navigation, not which tab is active on first render, so Overview
 *  being first here doesn't change today's landing view. */
/* Round 23, frame `152:176`: "Supervision notes" -> "Supervision Notes". The
   frame title-cases the three two-word tabs (Learning Progress, Stage
   Management, Supervision Notes) and leaves "Personal details" in sentence
   case; the app already matched on three of the four. §35a's sentence-case rule
   explicitly exempts tab labels, so the frame wins here. */
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
    // Round 23, frame `172:742` (nodes `172:799`/`172:800`).
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

/** The Stage pipeline's own visible rows — only the 5 phases that map to an
 *  actual COACH certification stage (Stage C/O/A/CP/H). Phases 1–2
 *  (Recruitment, Enrolment) are already done by the time someone's on the
 *  roster, and Phase 8 (Entry into SPACES delivery) is post-certification —
 *  neither is a stage a researcher marks complete here (Round 9.1). Deriving
 *  this from `stageCode` (rather than a number range) is what guarantees
 *  exactly C/O/A/CP/H show up and nothing else. */
const PIPELINE_PHASES = STUDY_PHASES.filter((p) => p.stageCode)

/** All 5 pipeline stages gate certification — there's no longer a
 *  post-certification pipeline item to exempt (Round 9.1). */
const CERT_REQUIRED_PHASES = PIPELINE_PHASES.map((p) => p.number)

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

function moduleTitle(moduleId: string): string {
  return PATHWAY_MODULES_V2.find((m) => m.id === moduleId)?.title ?? moduleId
}

/** Nominal slide count used to derive an in-progress module's completion %
 *  (Round 2.2). The real 12-module curriculum (`trainingPathwayV2.ts`) has no
 *  per-module slide list of its own — its card style doesn't show slide
 *  composition — so this keeps the same denominator the original 8
 *  Round 1 modules all shared (`makeSlides()` in `data/portal.ts` always
 *  produced exactly 6 slides per module). */
const NOMINAL_SLIDE_COUNT = 6

/** Module-level completion rate (%) for a coach's record (Round 2.2). */
function completionRate(record: ModuleRecord): number {
  if (record.status === 'completed') return 100
  if (record.status === 'not-started') return 0
  return Math.round(((record.slidesCompleted ?? 0) / NOMINAL_SLIDE_COUNT) * 100)
}

// ---------------------------------------------------------------------------
// Learning Progress synthesis helpers (Trainee Management drill-in rebuild).
// Every function below is a pure derivation from real `Coach`/`ModuleRecord`/
// `AnnotationSummary`/`ModuleQuestionBank` seed fields — nothing here invents
// a schedule field, a SIPTEA component name, or a benchmark the seed data
// doesn't actually carry. Do not touch `ModuleSlides`/`AnnotationSlide`/
// `SlideCard`/`TrackerSection`/`TrackerRowList`/`moduleRow`/
// `moduleGroupSections`/`REVIEW_ITEMS` — those own the raw rail/canvas view
// this synthesis sits above.
// ---------------------------------------------------------------------------

/**
 * Per-module knowledge-check accuracy (%), or `null` when the module isn't
 * completed or has no question-bank entry to score against. Uses the exact
 * same correctness comparison already inlined in `ModuleSlides`
 * (`answers[i]?.selectedIndex === q.correctIndex`) — this is not a new rule,
 * just the same one made reusable outside that component.
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
 * Completed modules that also have a question-bank entry, in
 * `PATHWAY_MODULES_V2` curriculum order. Deliberately empty (never
 * fabricated) for a coach with no such module yet — e.g. still at Stage C
 * with nothing completed, or whose completed modules are all among the 4
 * with no question-bank entry (`building-blocks-good-sleep`,
 * `retraining-brain-sleep`, `resetting-body-clock`,
 * the Practice module, removed in Round 29).
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
 * Open Question 1, option (a). This is a binary flag limited to the one
 * clean invariant the data supports: a coach who is past Stage C (Content
 * learning, currentPhase > 3) but still has at least one module that isn't
 * `'completed'`. There is no "on pace while still in Stage C" signal because
 * no per-module target-date field exists anywhere in this data model.
 * Agent B chose this option (a) over the elapsed-time-ratio proxy (b) as the
 * more honest of the two documented choices.
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
 * Which SIPTEA letters each real `PATHWAY_MODULES_V2` module maps to, per
 * `research/Coaching Module Structure.md`. Resolved by matching each doc
 * "Module N" row to the app module it actually describes by title/content
 * (the doc's own ordinal numbering has been renumbered repeatedly per the
 * doc's own notes, so it is not usable as a join key).
 *
 * RESOLVED: `setting-stage-sleep`. This is the one pairing decided by
 * elimination rather than a title or content match — the doc's "Calm mind
 * and body (stress, relaxation)" module does not describe the same topic as
 * the app's "Setting the Stage for Sleep" (an environment/light module).
 * Every one of the other 11 real curriculum modules matches a distinct doc
 * module by title (e.g. `program-structure-onboarding`'s real title,
 * "SIPTEA framework", matches the doc's "SIPTEA framework module" row, not
 * its own id name — the id/title pairing was renamed in a later round and
 * the ids were never re-keyed to match). "Calm mind and body" is the one
 * doc row left over with no title match, and `setting-stage-sleep` is the
 * one real module left over with no doc match, so this is the only
 * consistent pairing left once the other 11 are fixed — treated as final
 * for this build (`['E', 'T', 'A']`), not left ambiguous. If a future
 * curriculum revision adds a dedicated stress/relaxation module, re-run this
 * elimination.
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

/** Per-letter identity colour for the SIPTEA breakdown table's circle badge
 *  (Figma frame `93:188`, node `93:1469`) — six distinct hues so each
 *  component reads as its own thing at a glance, not a data-driven scale.
 *  Explicit, scoped exception to this app's usual quiet/no-rival-accents
 *  palette (design-tokens.md §1), same category as the reflection-panel
 *  purple or the tier-canvas colours: a fixed identity mapping, confirmed
 *  with the user rather than invented. `T` happens to land on this app's own
 *  `purple-50` token exactly; the other five are one-off literal Tailwind
 *  hues lifted straight from the frame, not tokens from `index.css`. */
const SIPTEA_LETTER_STYLE: Record<SipteaLetter, string> = {
  S: 'bg-blue-100 text-blue-800',
  I: 'bg-emerald-100 text-emerald-800',
  P: 'bg-amber-100 text-amber-800',
  T: 'bg-purple-50 text-violet-800',
  E: 'bg-red-100 text-red-800',
  A: 'bg-cyan-100 text-cyan-700',
}

/** 4-tier colour scale for a knowledge-check accuracy percentage — used on
 *  the module-breakdown list and the SIPTEA table's own accuracy column.
 *  Another explicit, scoped exception to the app's usual quiet chip palette
 *  (per-request: "use the current local error tokens for green, yellow,
 *  orange, red"), local to these two Learning Progress cards only. Bands:
 *  90+ green, 75-89 yellow, 50-74 orange, under 50 red. The `-700` shade in
 *  every case, not the more common `-600`, because yellow/orange at `-600`
 *  measure under 4.5:1 against white — verify live rather than assuming
 *  Tailwind's default swatch is accessible here. */
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
 * Mean of the other coaches in the same cohort's own `averageAccuracy`
 * results, or `null` if no cohort peer has any qualifying data. Note: every
 * coach in the current seed data has `cohort: 'Cohort 1'`, so today this is
 * mathematically the same as the whole roster's average — a demo-data
 * limitation, not a bug in this function.
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
 * NOTE (2026-08-19): currently unused by the Learning Progress tab —
 * `LearningFlagsCard` (the only caller) was removed from that tab's render
 * per direct researcher feedback. This helper is intentionally preserved,
 * not dead code. See the removal-site comment in `LearningProgress` below.
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
   * A structural note comparing this entry to the previous *existing*
   * timepoint entry — only set when both exist. This must never synthesize
   * tone/theme/sentiment commentary about the summary text itself — only
   * these disclosed structural facts: a shared/not-shared status change, or
   * an approximate "roughly longer/shorter/similar length" comparison of
   * `summary.length` between two consecutive *shared* entries (never
   * comparing lengths across a not-shared entry, since its text isn't
   * visible to compare).
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
 * Pending-invite banner — a coach trainee created by the "Add coach
 * trainee" wizard starts `inviteStatus: 'pending'` until they accept; almost
 * everything on their profile is inert until then. Pinned above the hero via
 * `ResearchShell`'s `topBanner` slot, matching the Consumer Portal's own
 * top-of-page account-state banner (`ConsumerShell`'s `OptedOutBanner`) —
 * same placement and persistence, but amber rather than that banner's red,
 * since this is a pending/informational state, not a destructive one. This
 * is the one deliberate use of amber in the app; every other status chip
 * still keeps to the documented success/neutral/muted palette.
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

/** Round 23, frame `174:345` (node `194:1858`): the rule between two record
 *  rows is not a 1px border on the row — it is a **16px band with a hairline
 *  centred inside it, inset 24px from each edge**. That distinction is why it
 *  is its own element: a `border-b` would sit flush against the next row and
 *  run the full card width, which is visibly not what the frame draws.
 *
 *  Exported for reuse by the researcher's consumer record page
 *  (`ConsumerDetailPage.tsx`'s Profile details tab), which adopts this same
 *  card/header/row vocabulary — no import cycle, since this file has never
 *  imported from `ConsumerDetailPage.tsx` (only the reverse, e.g. `SlideCard`
 *  above). */
export function RecordRowDivider() {
  return (
    <div aria-hidden="true" className="flex h-4 items-center px-6">
      <span className="h-px w-full bg-hairline" />
    </div>
  )
}

function PersonalDetails({ coach }: { coach: Coach }) {
  const { updateContact, withdrawCoach } = useResearch()
  const pending = coach.inviteStatus === 'pending'
  const [dialog, setDialog] = useState<'withdraw' | null>(null)
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(coach.email)
  const [phone, setPhone] = useState(coach.phone)

  // Both the form's Cancel and Save controls unmount the instant `editing`
  // flips back to `false`, dropping keyboard/screen-reader focus to `<body>`
  // — this project's most-repeated defect class (CLAUDE.md's non-negotiables
  // list). `wasEditing` distinguishes "just left edit mode" from first
  // mount, so this doesn't steal focus on initial page load. Ported from
  // ConsumerDetailPage.tsx's `PersonRecordCard`, which already carries this
  // fix for the equivalent consumer-side card.
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

  // Mirrors every field the "Add coach trainee" wizard collects at
  // onboarding (`AddCoachTraineeModal`'s aged-care-details step) — nothing
  // collected there gets silently dropped once the person is on the roster
  // (Round 2.2.4; wizard replaced the old EOI-approval path).
  const contactFields = [
    // Frame node `194:1855` leads this card with the person's name; the app's
    // version didn't carry it here because the hero above says it. Added: on
    // this tab the card is the record, and a record that never names its
    // subject reads oddly once you're reading it as a form.
    { label: 'Full name', value: coach.fullName, breakAll: false },
    { label: 'Email', value: coach.email, breakAll: true },
    { label: 'Phone', value: coach.phone },
    { label: 'Aged care employer', value: coach.employer },
    { label: 'Role at employer', value: coach.roleAtEmployer },
    { label: 'Years in aged care', value: `${coach.yearsInAgedCare} years` },
  ]

  return (
    /* Round 23, frame `174:345`. Two stacked full-width cards 40px apart, each
       a `purple-50` header band (64px, 24px side padding, `title` heading, an
       action pinned right) over a list of 40px label/value rows separated by a
       16px band with a hairline centred in it and inset 24px.
       The frame's own content is a researcher's profile ("Claire Donnelly /
       Research coordinator / Monash University") borrowed from a My Profile
       screen; this is a *trainee* record, so the real fields stay — and
       "User ID"/"Join date" keep the project's own terms, Participant ID and
       Enrolment date. */
    <div className="flex flex-col gap-10">
      {/* Study information */}
      <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Study information</h2>
          {coach.status !== 'withdrawn' && (
            /* Destructive outline on this app's own `destructive` token, not
               the frame's raw `#cc1a1a`/`#fcebeb` pair.
               **Fill is opaque `bg-card`, not `bg-destructive/8`** — measured,
               not assumed: a translucent 8% tint sitting on the `purple-50`
               header band composites to a pinkish `rgb(241,220,236)`, and
               `destructive` on that is only **4.15:1**, an AA failure. On white
               it is **5.38:1**. It also matches the "Edit details" button on
               the sibling card, which is already white-on-band — so one
               treatment for both buttons on this surface. */
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
          {/* Ported from ConsumerDetailPage.tsx's own Study information
              card: withdrawal is only visible here as "the button is gone" —
              a withdrawn trainee's card otherwise shows no on-screen sign
              they were ever withdrawn, even though `withdrawalNote` already
              holds a full sentence for exactly this case. */}
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

/** A single content unit inside the review canvas, styled like a training slide.
 *  Exported for reuse by the SPACES coach profile's Annotation Vault (Round 3),
 *  which reuses this exact rail-plus-canvas grammar (design-tokens.md §13).
 *
 *  `header` is an additive escape hatch (Research Dashboard home page's
 *  "Your schedule" board, Round 20 rebuild): when supplied it replaces the
 *  plain title/tag row with a full-bleed `bg-card-header` band (a
 *  fixed `min-h` so all 3 schedule columns' bands line up regardless of
 *  title/description length) and `children` renders below a hairline
 *  divider instead of inside the padded title block. The 3 existing
 *  `title`-only callers (this file's own `ModuleSlides`/annotation summary,
 *  `ConsumerDetailPage`, `SpacesCoachProfilePage`) are unaffected — that
 *  path is untouched. */
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
      {/* Round 23, frame `93:188` (nodes `134:1637`/`134:1641`): the slide tag
          sits *above* the title, left-aligned, not opposite it on the same
          baseline. The frame's stack is tag (15px) -> 8px -> title (27px) ->
          8px -> body. */}
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

/** Star-rating display scale shared with the module player's own
 *  `ModuleFeedbackSlide.tsx` (kept as a separate local constant rather than
 *  a cross-file import — this file only ever reads a rating, never writes
 *  one, so there's no shared behaviour to couple, just the same number). */
const RATING_MAX = 5

/**
 * A module's per-coach content, presented as the training portal's own
 * slides would be — one slide card per unit — rather than one merged panel.
 * The scenario task, knowledge check, and module feedback (Round 22) carry
 * per-coach answers; the module's other slides (welcome, key ideas, video,
 * summary) are identical boilerplate for every coach and have no research
 * value here, so they're not reproduced.
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

  // Round 22 direct edit — simplified per direct feedback ("information
  // overload"): each slide now shows just its title, slide number (both
  // already `SlideCard`'s `title`/`tag` props), and the trainee's own
  // response at a glance. The scenario task's prompt/guidance text and the
  // knowledge check's full option list are dropped — a researcher reviewing
  // many trainees wants "what did they say" and "right or wrong", not the
  // full quiz UI replayed back to them.
  //
  // Total slide count is computed, not hardcoded, now that a 3rd slide
  // (Module feedback) always renders alongside a Knowledge check that only
  // renders when the module actually has a question bank — a fixed "Slide N
  // of 2" would have been wrong on either a bank-less module (only 2 real
  // slides render, feedback included) or every module before this round (a
  // pre-existing quirk this fix incidentally also corrects).
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

/** One annotation-summary timepoint, presented as a single slide card. */
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

/** Annotation-summary rows appended after the modules — same flat list, no dropdown (Round 2.2.5). */
const REVIEW_ITEMS: { timepoint: 'baseline' | 'midline' | 'endline'; label: string; shortLabel: string }[] = [
  { timepoint: 'baseline', label: 'Baseline Review', shortLabel: 'Baseline' },
  { timepoint: 'midline', label: 'Midline Review', shortLabel: 'Midline' },
  { timepoint: 'endline', label: 'Endline Review', shortLabel: 'Endline' },
]

/** Shared pending-invite empty state for the tabs that have nothing to
 *  show before a trainee has accepted their platform invite (Learning
 *  Progress, Stage Management) — this app's standard
 *  icon-badge empty-state pattern (a circular `bg-primary/10` badge around
 *  a lucide icon, centered), each tab supplying its own icon/heading/body
 *  rather than one generic line of text. */
/** Exported for direct reuse by ConsumerDetailPage.tsx's `NotesTab`, which
 *  needs the identical "not available yet" treatment for its own "no coach
 *  assigned" gate — previously hand-copied inline rather than imported, so
 *  the two had no way to stay in sync if either changed. */
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

/** Overview tab — a genuine placeholder for a future at-a-glance summary
 *  (caseload snapshot, recent activity, etc.), not yet built. Reuses this
 *  page's own `NoDetailsAvailable` icon-badge empty-state chassis rather than
 *  a blank box, so it reads as an intentional "not built yet" state instead
 *  of a broken one. */
/**
 * Overview tab — Round 21, rebuilt from a placeholder into the tab a
 * researcher actually lands on.
 *
 * Three sections, each under its own `text-title` section title, matching the
 * list pages' own section rhythm rather than being three unlabelled cards:
 *   1. Contact details — how to reach this trainee, with live mailto/tel links.
 *   2. Learning progress — modules completed and when they were last active.
 *   3. Certification pathway — a horizontal timeline of the 5 COACH stages,
 *      dated where a date exists, with a link through to Stage Management.
 *
 * Everything here is read-only. The one control is the link to Stage
 * Management, which is where stages are actually marked complete — this tab
 * shows the state, that tab changes it.
 */
/**
 * The three annotated-SIPTEA-guide timepoints a *trainee* record can carry, and
 * the COACH phase each becomes due after. Straight from CLAUDE.md's own
 * "Annotated SIPTEA guide" table: baseline after Content learning, midline
 * after Guided group practice, endline after Placement 2. (The fourth
 * timepoint, post-practice, belongs to a certified coach delivering SPACES and
 * has no slot on `Coach.annotationSummaries`, so it isn't listed.)
 *
 * `dueAfterPhase` is the phase number the trainee must have *reached* for the
 * timepoint to be overdue rather than simply not yet applicable — i.e. one past
 * the phase that produces it. Deliberately named for the stage rather than the
 * number in the copy, because "Not due until Guided group practice" is
 * something a researcher can act on and "Not due until phase 5" isn't.
 *
 * Kept separate from `REVIEW_ITEMS` above rather than merged into it: that one
 * drives the Learning Progress tab's own review rail and uses Title Case
 * ("Baseline Review") to match its slide headings, whereas these are sentence-
 * case list rows using this project's own term, "annotation summary".
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
 * The "Key updates" list on the Overview tab (frame `152:375`, node `152:608`).
 *
 * The frame draws five rows, but three of its five are invented placeholder copy
 * ("Action items: Next steps for sleep improvement", "Sleep hygiene: Optimizing
 * your environment", "Weekly check-in: Progress and reflections") — none of
 * which is a real Care2Sleep concept, and two of which describe *consumer* sleep
 * content rather than anything on a trainee's record. So the panel's shape is
 * taken from the frame and every row is **project-specific and derived**: COACH
 * stage, module progress, knowledge-check accuracy, SIPTEA coverage, the three
 * annotated-SIPTEA-guide timepoints, and the next booked session. Nothing is
 * fabricated, and nothing is hardcoded.
 *
 * Two deliberate properties:
 * - **Every figure is read through the helper that already owns it**
 *   (`averageAccuracy`/`completedModulesWithBank`, `sipteaBreakdown`,
 *   `stageZoomSession`, `stageLabel`), never recomputed locally. This panel now
 *   restates facts the Learning Progress tab and the sessions table below also
 *   show, and this project's most-repeated bug class is exactly two surfaces
 *   rendering the same fact off two different fields.
 * - **A not-yet-reached annotation timepoint still renders a row**, saying which
 *   stage unlocks it. "Not due yet" and "due but missing" are different things
 *   to a researcher and only one needs chasing; omitting the row collapses them.
 *
 * That reaches 6-8 rows for an active trainee and 5-6 for one still in Content
 * learning, so the frame's full, scrolling list reads correctly on real data.
 *
 * Terminology follows CLAUDE.md, not the frame: the frame's "Baseline review"
 * is an **annotation summary** — the project's own term, and the one used
 * everywhere else in this app.
 */
function overviewKeyUpdates(coach: Coach): { label: string; value: string; tone?: string }[] {
  const updates: { label: string; value: string; tone?: string }[] = []

  // No "Current stage" row, though it was the obvious first one to add: the
  // white sub-panel 24px to the left of this list already says "Current Stage:
  // Stage C", and `stageLabel` renders "Stage C: Learning", so the row read
  // "Current stage: Stage C: Learning" — a double colon restating the fact
  // immediately beside it. The stage still frames the "Due after…" rows below;
  // it just doesn't need saying twice on one card.

  // 1. What they are working through right now, and what they last finished.
  const inProgress = coach.moduleRecords.find((r) => r.status === 'in-progress')
  if (inProgress) updates.push({ label: 'Ongoing module', value: moduleTitle(inProgress.moduleId) })

  const completed = coach.moduleRecords.filter((r) => r.status === 'completed')
  const lastCompleted = completed[completed.length - 1]
  if (lastCompleted)
    updates.push({ label: 'Last completed module', value: moduleTitle(lastCompleted.moduleId) })

  // 3. The two learning-quality figures the Learning Progress tab already
  //    publishes. Derived through the SAME helpers that tab uses
  //    (`averageAccuracy`/`completedModulesWithBank`, `sipteaBreakdown`) rather
  //    than recomputed here — two surfaces showing the same fact must read the
  //    same field, which is a bug class this project has shipped more than once.
  const accuracy = averageAccuracy(completedModulesWithBank(coach))
  if (accuracy !== null)
    updates.push({ label: 'Avg. knowledge check accuracy', value: `${accuracy}%` })

  const sipteaAssessed = sipteaBreakdown(coach).filter((s) => s.averageAccuracy !== null).length
  if (sipteaAssessed > 0)
    updates.push({ label: 'SIPTEA components assessed', value: `${sipteaAssessed} of 6` })

  // 4. The annotated SIPTEA guide's real timepoints. A timepoint the trainee
  //    has not reached yet says so, naming the stage that unlocks it, rather
  //    than being silently absent — "not due" and "due but missing" are
  //    different things to a researcher, and only one of them needs chasing.
  for (const { timepoint, label, dueAfterPhase, dueAfter } of ANNOTATION_TIMEPOINTS) {
    const summary = coach.annotationSummaries.find((a) => a.timepoint === timepoint)
    if (summary) {
      updates.push({ label, value: summary.shared ? 'Shared' : 'Approved, not shared' })
    } else if (coach.currentPhase < dueAfterPhase) {
      // "Due after X", not "Not due until X": a trainee at Stage C is *inside*
      // Content learning, and "Not due until Content learning" reads as though
      // they haven't started it. "Due after" is true at every phase.
      updates.push({ label, value: `Due after ${dueAfter}` })
    } else {
      // Overdue — the trainee is past the stage this reflection is due after
      // and nothing has been submitted. Flagged the same way Consumer's own
      // key-updates list flags an at-risk state (Round 25's `tone` field),
      // rather than rendering identically to every routine update above it.
      updates.push({ label, value: 'Not submitted yet', tone: 'text-destructive' })
    }
  }

  // 5. What is booked next, if anything. Same `stageZoomSession` source the
  //    sessions table below reads, so the two cannot disagree.
  const nextSession = stageZoomSession(coach).find((s) => s.phase >= coach.currentPhase)
  if (nextSession)
    updates.push({
      label: 'Next session',
      // The stage's own short label ("Group practice", "Placement 2"), not
      // `session.title` — the real titles carry their own colon ("Group
      // practice 5: Consolidation and readiness check"), so putting one in the
      // label and another in the title gave a row with three colons in it. The
      // short label is also exactly what the sessions table below prints in its
      // Session column, so the two name the same thing the same way.
      value: `${stageLabel(nextSession.phase).split(': ')[1] ?? stageLabel(nextSession.phase)} · ${formatDate(nextSession.date)} · ${formatTime(nextSession.time)}`,
    })

  return updates
}

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
    // Round 23, frame `152:176`: the three sections are 24px apart (`Frame 108`
    // -> `Learning Progress Card` -> `coach-certification-pathway`), not 64px.
    // Round 24: corrected to 40px on direct instruction — the frame's own
    // spacing was updated in Figma and the consumer Overview now matches, so
    // the two record pages keep one rhythm.
    <div className="flex flex-col gap-10">
      {/* Round 23 — `Frame 108` (node `152:232`). The row is now the tab's intro
          copy on the left and the Trainee Details card on the right, 32px apart.
          The Learning-progress card that used to share this row has moved below
          it at full width. The card is the frame's own 568.5px and does not
          flex; the intro column takes the rest. Stacks below `lg`. */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <TabIntro {...TAB_INTRO.Overview} />
        </div>
      <section className="flex flex-col lg:w-[568.5px] lg:shrink-0">
        {/* Round 22 — "Trainee Details Card" rebuilt from a fresh Figma frame
            (node `136:2285`), superseding Round 21.2's version described
            below. Outer surface lightened again, `yellow-100` -> `yellow-50`
            (the frame's own `background/card` variable, `#fcf6e5` — read via
            `get_variable_defs`, close enough to `yellow-50`'s `#fff8e5` to
            snap to it rather than mint a near-duplicate token, the same
            small-drift call this project already makes routinely). The
            divider between avatar+name and the detail rows is gone; the
            detail rows now sit in their own white panel instead, one level
            of hierarchy the divider used to carry alone.
            ⚠️ Explicit, scoped exception to the app-wide "no avatars" rule
            (Round 4.1, reaffirmed through Round 21.1): reintroduced here on
            direct instruction ("override, and follow figma design"), same
            category as Round 20's since-retired attendee-chip exception —
            confirmed narrow to this one card, not license to bring avatars
            back anywhere else. One fixed stock photo, not a per-trainee
            headshot (the dataset has none) — downloaded and committed to
            `public/avatars/trainee-avatar.jpg` rather than hotlinked. Frame
            node `45:42` used a female stock photo; swapped for a male one
            per direct follow-up, since this card's own demo trainee
            (Marcus Webb) is male. */}
        {/* Round 23 — "Trainee Details Card" (node `152:468`), superseding the
            Round 22 version described below.
            What changed, all measured off the frame rather than adjusted by eye:
            - Surface is a **vertical gradient**, `yellow-100` (#fff0cc, the
              frame's own `Yellow/100`) to white, not the flat `yellow-50` fill.
              The gradient is why there is no longer a separate white panel
              behind the detail rows — the card's own lower half *is* white.
            - 1px `parchment` border + the (now warm) `Card shadow`.
            - "Contact details" heading is gone. The card leads with the
              trainee's name, so a heading naming the card was one line of
              hierarchy the frame spends elsewhere.
            - The avatar's gradient ring and gold drop shadow are gone: node
              `152:469` is a plain 104px ellipse with an image fill, no strokes
              and no effects (verified against the node, and by rendering the
              card in isolation).
            ⚠️ Still a scoped exception to the app-wide "no avatars" rule
            (Round 4.1), on the same direct instruction recorded in Round 22.
            ⚠️ The frame's own asset is a *female* stock photo. Kept the
            committed male one: Round 22 swapped to it on explicit direct
            instruction ("this card's own demo trainee, Marcus Webb, is male"),
            and the frame most likely just predates that. Flagged, not
            silently reverted either way. */}
        <Card className="gap-0 rounded-lg border border-parchment bg-gradient-to-b from-yellow-100 to-white py-0 shadow-card">
          <div className="flex flex-col gap-6 p-6">
            {/* `items-start`, per the frame's own row: the 104px avatar
                top-aligns with the name, it does not centre against the whole
                name+rows stack. */}
            <div className="flex items-start gap-6">
              <span
                aria-hidden="true"
                className="block size-[104px] shrink-0 overflow-hidden rounded-full"
              >
                <img
                  src="/avatars/trainee-avatar.jpg"
                  alt=""
                  width={104}
                  height={104}
                  className="size-full object-cover"
                />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* `px-2` is the frame's own 8px inset on this row and on the
                    rows block below it, so the name's left edge lines up with
                    the "Trainee ID" label under it. */}
                <p className="truncate px-2 text-title text-ink">{coach.fullName}</p>
                {/* Three real grid tracks — 110px label / 24px colon / value —
                    matching the frame's own `row-label` / `row-separator` /
                    `row-value` structure. The colon is its own `<span>` outside
                    both `dt` and `dd` so it is never part of either accessible
                    name, and `aria-hidden` keeps it out of the a11y tree
                    entirely. 18px is the frame's own row pitch (19px rows, 8px
                    gap, less the 9px of leading each 14px line carries). */}
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

      {/* Round 23 — "Learning Progress Card" (node `152:375`), superseding
          Round 21.2's half-width version. Now a full-width card holding two
          `parchment` panels 24px apart: a flex-1 "Progress:" panel and a fixed
          640px "Key updates" panel. Title is the frame's own
          "Trainee's learning journey progress". */}
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

            {/* Splits at `xl`, not `lg`: the right panel is 640px and the left
                needs ~409px beside it, so a two-column row only actually fits
                once the content column is past ~1100px. Below that they stack
                rather than squeezing the stats row's two columns into a wrap. */}
            <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
              {/* Progress panel (`152:381`) */}
              <div className="flex min-w-0 flex-1 flex-col gap-6 rounded-sm bg-parchment p-4">
                {/* `h-6`: the frame gives this label an explicit 24px box
                    (node `152:488`), 5px more than its 19px line — that extra
                    is what makes the panel 254px rather than 249px. */}
                <p className="flex h-6 items-center text-body-md text-ink">Progress:</p>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    {/* `h-16` + `justify-between` is the frame's own 64px stats
                        row: label pinned to the top, value to the bottom, on
                        both sides — which is what puts "5 of 12" (39px tall)
                        and "15 Jul 2026" (19px tall) on a shared baseline
                        without either column knowing the other's type size. */}
                    <div className="flex h-16 items-start justify-between gap-4">
                      <div className="flex h-full flex-col justify-between">
                        <p className="text-caption text-ink-muted">Modules completed:</p>
                        {/* Both halves are `ink` in the frame — the "of 12"
                            is not dimmed to `ink-muted` as the Round 21.2
                            version had it. */}
                        <p className="text-display-md whitespace-nowrap text-ink">
                          {modulesDone} of {totalModules}
                        </p>
                      </div>
                      <div className="flex h-full flex-col items-start justify-between">
                        {/* Frame wording: "Last active:", not "Last activity:". */}
                        <p className="text-caption whitespace-nowrap text-ink-muted">Last active:</p>
                        <p className="text-body-md whitespace-nowrap text-ink">
                          {coach.lastActive ? formatDate(coach.lastActive) : 'Never signed in'}
                        </p>
                      </div>
                    </div>
                    {/* 6px track on `purple-200`, filled `primary` — the frame
                        replaces the old 8px `hairline` track, so the unfilled
                        remainder now reads as part of the same scale rather
                        than as a grey gutter. */}
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
                  {/* Current-stage row (`152:629`): a white 72px sub-panel — the
                      one white surface inside the parchment panel, which is what
                      makes it read as the card's headline fact. */}
                  <div className="flex h-18 items-center gap-2 rounded-sm bg-card p-3">
                    <p className="text-body-md text-ink">Current Stage:</p>
                    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-purple-50 px-3 text-caption-medium text-ink">
                      {stageShortName(coach.currentPhase)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key updates panel (`152:525`) */}
              <div className="flex flex-col gap-6 overflow-hidden rounded-sm bg-parchment p-4 xl:w-[640px] xl:shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="text-body-md whitespace-nowrap text-ink">Key updates</p>
                    {/* `purple-500` fill with white text: 4.85:1, clears AA. */}
                    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-purple-500 px-2 text-caption-medium text-white">
                      {keyUpdates.length} {keyUpdates.length === 1 ? 'update' : 'updates'}
                    </span>
                  </div>
                  {/* No write path: "read" is not a state anything in this app
                      persists. Rendered as a focusable `aria-disabled` control
                      with an `sr-only` cue per the standing rule, rather than a
                      silently dead link or an omission. */}
                  {/* `-my-3 py-3` again: keeps the frame's 24px header row
                      while giving the link a 41px pointer target. */}
                  <button
                    type="button"
                    aria-disabled="true"
                    className="-my-3 shrink-0 rounded-sm py-3 text-caption-medium text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Mark all as read
                    <span className="sr-only"> (coming soon)</span>
                  </button>
                </div>
                {/* Frame draws 5 rows in a fixed-height scroller. Height is
                    capped rather than growing with the list, so a trainee with
                    more updates scrolls instead of stretching the card. */}
                <ul className="flex max-h-[174px] min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xs bg-card p-3">
                  {keyUpdates.map((u) => (
                    <li
                      key={u.label}
                      className="flex shrink-0 items-center justify-between gap-4 border-b border-purple-200 px-px py-3"
                    >
                      <p className="min-w-0 flex-1 text-body text-ink">
                        {u.label}: <span className={u.tone ?? 'text-primary'}>{u.value}</span>
                      </p>
                      {/* Per-row overflow menu, drawn by the frame with nothing
                          behind it yet — same `aria-disabled` + `sr-only`
                          treatment as "Mark all as read".
                          The frame draws this glyph at 20x16 inside a 43px row,
                          which cannot hold a 36px control. `-my-2.5` resolves
                          that without giving up either: the button stays a real
                          36x36 target but contributes only 16px to the row, so
                          the row's height is still set by its 19px text line
                          and measures the frame's 43px. Without it the row grew
                          to 61px and one fewer update fit in the scroller. */}
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

      {/* Title, sub copy and CTA all live inside the card, matching the two
          cards above — the pathway was the only section still carrying its
          heading on the page canvas. */}
      {/* Round 21.3, frame `45:161`: the pathway and the sessions table are now
          ONE card with two sections (48px apart), not two sibling cards. The
          table's heading moved inside with it — a documented, deliberate
          exception to §35a's "a card holding a table carries its title
          outside" rule, because here the table is the second half of the
          pathway story ("here's where they are" → "here's what to book next"),
          not a standalone data surface. */}
      <section>
        {/* Round 23: card surface brought onto the frame's own treatment —
            16px radius (was a hardcoded `rounded-[20px]`, one of the two
            leftover overrides the Round 22 handover flagged), 1px `parchment`
            border, warm `Card shadow`. Section gap is the frame's 24px, not
            48px. */}
        <Card className="gap-0 rounded-lg border border-parchment bg-card py-0 shadow-card">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <h2 className="font-display text-title text-ink">
                    Trainee certification pathway
                  </h2>
                  {/* `ink`, not `ink-muted` — the frame's `header-text` group
                      sets `#1a1a1a` for both the title and this sub line. */}
                  <p className="text-caption text-ink">
                    Track where the trainee is in their coach certification journey
                  </p>
                </div>
                <button type="button" onClick={() => onGoToTab('Stage Management')} className={sectionCta}>
                  Go to Stage Management
                </button>
              </div>
              {/* The band keeps the timeline its own region inside the card.
                  Its `px-10 py-12` is load-bearing as well as visual: the
                  in-progress marker's ping ring expands to twice the marker's
                  size and the scroll container would otherwise clip it (an
                  `overflow-x-auto` element clips vertically too, per spec). */}
              <div className="rounded-lg bg-parchment">
                {/* `min-w-0`: without it this scroller is sized by the 720px
                    timeline inside it, which pushed the whole page into a
                    horizontal scroll at narrow widths (caught by the layout
                    audit, not by eye). */}
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
                {/* Retitled from the frame's "Stage specific actions needed".
                    That title promised an action this page cannot deliver —
                    the table is read-only by design, so there is no button to
                    act with — and it claimed actions were needed even when
                    every stage was booked and on track. "Upcoming stages and
                    sessions" names what the table actually contains and stays
                    true in both states. It also pairs as the forward-looking
                    half of "Trainee certification pathway" above it: that
                    section says where the trainee is now, this one says
                    what is coming and whether it is arranged. */}
                <h2 className="text-body-md text-ink">Upcoming stages and sessions</h2>
                {/* Fourth version of this line. Worth recording why, because
                    two of the three rejected versions failed for reasons that
                    generalise:
                    (1) The frame's "Remember to schedule sessions with trainees
                    as they progress to next stage" told the researcher to do
                    something this page deliberately cannot do.
                    (2) "Whether this trainee is ready for each remaining stage,
                    and whether its session is booked" was accurate but spent a
                    line restating the two column headers directly beneath it.
                    (3) "Coaches book these sessions — follow up on any stage
                    that is ready but not yet booked" **asserted a fact that was
                    not checked and is probably false**: Stage O is a *cohort*
                    group practice, scheduled by the research team, and the
                    placements involve simulated consumers and an expert
                    assessor. Attribution invented, not verified.
                    (4) This version states the job without naming who books —
                    the honest position, since the platform has no scheduling
                    write path to point at. "is up to" matches the consumer
                    page's own "Where this consumer is up to, and what's booked
                    next." "Trainee" not "participant": Round 11 moved off that
                    word, and this page says "Trainee:" in the hero.
                    No trailing period, matching the pathway sub copy above. */}
                <p className="text-caption text-ink">
                  Keep track of where this trainee is up to, and take the relevant actions
                </p>
              </div>
              {/* Round 23: the frame draws this table container at 8px — half
                  its parent card's 16px, the nested-radius rule — with a
                  `hairline` border rather than the softer `parchment` the cards
                  themselves use, so the table reads as a contained grid. */}
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

/** The stages that involve a Zoom session at all: Stage O's cohort group
 *  practice, and the trainee's own two placements. Stage C is self-paced
 *  content and Stage CP has no scheduled session, so neither appears — an
 *  empty "no session" row for a stage that never has one would read as
 *  something missing rather than something not applicable. */
const SESSION_PHASES = [4, 5, 7] as const

/**
 * Stage readiness and session bookings for the stages ahead. **Read-only —
 * a researcher cannot start or schedule anything from this table.**
 *
 * Round 21.3 redesign. The previous version had a single `Status` column that
 * only reported *booking*, which made two very different situations render
 * identically: "Stage A isn't booked and isn't due for months" and "Stage O
 * isn't booked and the trainee is ready right now". Both showed the same amber
 * "Not scheduled", so the amber appeared on every future row and stopped
 * meaning anything — which is what the section's nag subtitle was compensating
 * for.
 *
 * A stage row actually carries two independent facts, and it's their
 * *combination* that tells a researcher whether to act:
 *
 *   ready? booked? -> reading
 *   no     no       not due yet                      quiet
 *   YES    no       BLOCKED: ready, nothing booked   the one row worth chasing
 *   yes    yes      on track, happening on <date>    quiet
 *   n/a    yes      booked ahead of readiness        quiet
 *
 * So readiness and booking are now separate columns, and only the genuinely
 * blocked row takes the `warning` tone. Everything not yet due goes `muted`.
 * That's the whole point of the change: the amber now means something.
 *
 * Two columns were dropped. **Meeting ID** is only useful to someone about to
 * join the call, and a researcher isn't joining. **Action** held a "Start"
 * link and a "Schedule" button, both of which are capabilities the researcher
 * is explicitly not meant to have — after removing them the column was a
 * stack of em dashes, which is noise, not information.
 */
function ZoomSessions({ coach, completedPhases }: { coach: Coach; completedPhases: number[] }) {
  const booked = stageZoomSession(coach)
  // Round 23, frame `152:685`. Header/data rows are `py-20` with the row's own
  // 32px side inset carried by the first and last cell only — the frame's
  // columns sit flush against each other inside that inset, at fixed widths,
  // rather than each carrying its own gutter. Header type moved `ink-muted` ->
  // `ink-faint` (the frame's `neutral/light-grey`).
  // Round 24, frame `152:686`: the header row is now a `purple-50` band with
  // `ink` labels (11.19:1) — the same treatment §67 gave Stage Management's own
  // table header — keeping its `hairline` bottom rule, which that node still
  // draws.
  const TH_CELL = 'py-5 text-caption-medium text-ink'

  return (
    <div className="min-w-0 overflow-x-auto">
      {/* Round 24 — the fix for a real `layout-audit` finding: this table was
          `min-w-[1000px]` with four *fixed* px columns, so at a 1440px viewport
          (a 988px container here) it overflowed and pushed "Scheduled for" off
          screen. The frame's own widths are 180 / flex / 220 / 220 / 160 inside
          a 32px inset, and they are transcribed as **proportions of the frame's
          own 1073px table** rather than px, so the design is exact at the
          frame's width and degrades proportionally instead of clipping:
          (180+32)/1073, 229/1073, 220/1073, 220/1073, (160+32)/1073.
          At 988px the Session column still resolves to ~211px, which is what
          keeps "Waiting final assessment" on one line — the audit's other
          finding. `min-w` is 860px, below which the table genuinely scrolls. */}
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
                {/* Stage is `body-md` (16/600) and Session/Scheduled-for are
                    `caption` on `ink-faint`, per the frame — the stage is the
                    row's identity, the rest is its detail. */}
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
                    /* `warning` ONLY when the trainee is actually ready and
                       nothing is booked. A stage that isn't due yet stays
                       `muted` — otherwise every future row is amber and the
                       colour stops carrying any signal at all. */
                    <Chip tone={blocked ? 'warning' : 'muted'} label={done ? 'No record' : 'Not booked'} />
                  )}
                </td>
                <td className="py-5 pr-8 text-caption whitespace-nowrap text-ink-faint">
                  {session ? (
                    `${formatDate(session.date)} · ${formatTime(session.time)}`
                  ) : blocked ? (
                    /* Says what's missing rather than leaving a bare dash on
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
 * An `<ol>` laid out as equal columns with the connector drawn *behind* the
 * markers, so the line never breaks between two stages whose labels differ in
 * length. Each stage carries one of three states — complete (filled tick, dated
 * where a date exists), current (ringed, "In progress"), or upcoming (hollow) —
 * and the state is never carried by colour alone: complete has a tick glyph,
 * current has a ring plus its own label.
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
    // Markers are positioned by percentage rather than centred inside equal
    // columns: with equal columns the first and last markers each sat half a
    // column in from the ends, leaving visible dead space at both edges of a
    // timeline that is supposed to span the section. Here stage `i` sits at
    // `i / (count - 1)` of the width, so the first is flush left, the last
    // flush right, and every connector segment is the same length.
    <ol className="relative min-w-[720px] pb-1">
      {/* Connector track, drawn behind the markers so no segment can break
          between two stages whose labels differ in length. Sits at the
          markers' own vertical midpoint: half of the 48px marker, less half
          the 2px line. */}
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
              {/* Live pulse on the stage in progress — a ring expanding out
                  from behind the marker, so the marker itself stays put and
                  legible. `motion-reduce:hidden` because a looping animation
                  is exactly what a reduced-motion preference asks to be
                  spared. */}
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
            {/* The state line says what the date *means*: a bare "26 Jun 2026"
                under a tick left it ambiguous whether that was when the stage
                was completed, when it started, or when it is due. */}
            {/* One step below the stage code above it: at `text-body` the
                state line matched the stage's own title, so the column had two
                equally-weighted headlines and no clear reading order. */}
            <p
              className={cn(
                'mt-2',
                // Three states, three treatments, per frame `45:161`. The stage
                // in progress is the one fact a researcher scans this row for,
                // so it takes the primary colour and a semibold weight. A
                // completed stage's line is a *date* — supporting detail, so it
                // drops to `fine`/`ink-muted` rather than competing with the
                // live stage. Upcoming stays plain `caption`/`ink`.
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
            {/* Only under Stage C, and only while it's the stage in progress:
                the module is what "in progress" actually means there. The
                other stages' work is the session itself, which the Zoom
                sessions list below covers. */}
            {current && phase.number === 3 && currentModule && (
              <p className="mt-1 text-caption text-ink-muted">{currentModule}</p>
            )}
          </li>
        )
      })}
      {/* Reserves the height the absolutely-positioned stages need — four text
          lines under a 36px marker. */}
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

/** Shared row-button list, reused for every group in the Engagement tracker
 *  (Foundational modules / Sleep modules / Practice module / Annotation
 *  summaries) so the button markup exists in exactly one place. */
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

/** One collapsible group in the Engagement tracker — a header that reads as
 *  a distinct group label, not just another row. Round 20 fix: the header
 *  used to share the exact same `bg-pearl` + `font-semibold` + `text-caption`
 *  treatment an *active row* gets, so an expanded section's header and its
 *  own highlighted row looked like two items in one list. The header is now
 *  structurally different — a stronger `bg-parchment` tint (never used by
 *  any row state), a full step up in type scale (`text-body`, 17px, vs a
 *  row's `text-caption`, 14px), taller padding for real breathing room, and
 *  its own `border-hairline` seam separating it from the row list below —
 *  not just a font-weight tweak. */
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
  /** Whether this is the very first / very last section rendered in the
   *  tracker card. Used to round this section's own top/bottom corners to
   *  match the parent Card's `rounded-lg` — since the card is a scroll
   *  container (`overflow-y-auto`/`overflow-x-hidden`), whichever element
   *  actually sits at its physical top/bottom edge is clipped to the same
   *  curve, so this stays correct regardless of which section (if any) is
   *  currently open. */
  isFirst?: boolean
  isLast?: boolean
}) {
  const completed = rows.filter((r) => r.success).length
  // Round 20 accessibility review — the collapsed panel animates to
  // `height: 0` with `overflow: hidden`, which hides it visually but leaves
  // every row button in the DOM, focusable and exposed to assistive tech.
  // Confirmed live: `.focus()` on a row inside a *collapsed* section landed
  // successfully on a real 320x44 box, so keyboard users tabbed through 11
  // invisible controls and could silently change the canvas selection.
  // `inert` + `aria-hidden` while closed remove it from both the tab order
  // and the accessibility tree without touching the height animation.
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
          // Open state gets `purple-50` per direct live feedback — the
          // expanded section reads as "active" against its still-`parchment`
          // collapsed siblings, rather than every header looking identical
          // regardless of state.
          open ? 'bg-purple-50 hover:bg-purple-100' : 'bg-parchment hover:bg-parchment/70',
          isFirst && 'rounded-t-lg',
          // Only round the header's own bottom corners when it's both the
          // last section AND collapsed — i.e. only when it's actually the
          // last visible element. If the last section is open, its rows
          // (not the header) sit at the card's bottom edge instead (see the
          // rounded-b-lg below), so rounding the header here too would show
          // a stray curve mid-list.
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
            // When this last section is expanded, its own rows (not the
            // header) form the card's bottom edge — clip them to the same
            // rounded-b-lg curve via overflow-hidden, rather than trying to
            // round the last row specifically (which row is "last" doesn't
            // matter here, the clip handles it either way).
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

/** Sentence-case, pearl-header card title + hairline divider — the §35a
 *  card-header-divider convention every card below follows. */
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
  /** Overrides the header band's default `bg-purple-50`. The default used to
   *  be `bg-card-header` (this app's older, more saturated header purple),
   *  with the two Learning Progress insight cards (Figma `93:188`)
   *  overriding to a literal `purple-50` band; "Attention needed" was the
   *  one caller left on the stale default, so `purple-50` — the record
   *  pages' actual current header convention — became the default instead,
   *  and the two now-redundant overrides were removed at their call sites. */
  headerClassName?: string
  /** Overrides the subtitle's default `text-caption text-ink-muted` — those
   *  same two cards specify 16px regular `ink` (not muted grey), a size/tone
   *  step up from every other `SynthesisCard` subtitle in the app. */
  subtitleClassName?: string
  /** Overrides the card's default `rounded-lg` — those same two cards
   *  specify a literal 12px radius. */
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn('gap-0 rounded-lg py-0', className)}>
      <div className={cn('bg-purple-50 p-6', headerClassName)}>
        {/* Round 22 direct edit: SynthesisCard titles ("Knowledge-check
            accuracy" / "SIPTEA component breakdown") dropped from `text-title`
            (24/500) to `text-body-md` (16/600) per live annotated feedback —
            smaller than the tab's own `title`-sized intro heading above it,
            so the intro heading stays the visual anchor for the whole tab. */}
        <h2 className="font-display text-body-md text-ink">{title}</h2>
        {subtitle ? (
          <p className={cn('mt-1 text-caption text-ink-muted', subtitleClassName)}>{subtitle}</p>
        ) : null}
      </div>
      {/* `flex-1`: when this card is height-matched to a taller sibling
          (the Learning Progress insight cards), `Card`'s own `h-full` only
          stretches the outer box — as a plain flex item with no `flex-grow`,
          this content section would otherwise keep its own natural height,
          leaving dead space below it inside the taller box.
          Deliberately top-aligned, not centered: centering was tried (to
          split leftover space evenly, matching the Contact details/Learning
          journey cards' own Round 21.1 fix) and rejected live — it pushed
          "Module breakdown"/"SIPTEA" down from the top, which reads worse
          than the alternative. The SIPTEA table is always exactly 6 rows
          while the module list grows with completed-module count, so
          whichever side has fewer real rows keeps its own natural leftover
          space at the bottom — an accepted trade-off of matching two
          different-length lists to one height, not a bug to chase further. */}
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

/** Attention-needed block — renders nothing at all (not an empty card) when
 *  `learningFlags(coach)` is empty. Icon uses `text-destructive`, this app's
 *  existing (non-amber) semantic tone for a `TriangleAlert`/`AlertTriangle`
 *  callout (see `ConsumerDetailPage.tsx`/`ConsumerHealthPage.tsx`/
 *  `PlanSessionsModal.tsx`) — `state-warning` amber stays scoped to the
 *  pending-invite chip/banner only (design-tokens.md §1/§30), not reused
 *  here for a third, undocumented purpose.
 *
 *  NOTE (2026-08-19): no longer rendered on the Learning Progress tab —
 *  removed per direct researcher feedback after seeing it live. Preserved
 *  here, unused, for possible future reuse; not dead code. See the
 *  removal-site comment in `LearningProgress` below. */
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

// Pace tile removed (researcher feedback: confusing at a glance) — see
// design/claude-handover/handover.md's "Direct edit (2026-08-19, after Round
// 20 continued)" row and design/logs/progress-log.md's matching entry;
// paceIndicator() itself is untouched and may be reintroduced elsewhere
// later.
/**
 * The Learning Progress tab intro's own KPI row (Figma `93:188`, node
 * `93:450`) — 4 yellow `StatCard` tiles sitting directly under the shared
 * `TabIntro` title/subtitle, no separate heading of its own (this replaces
 * the old "Learning progress insights" heading + `KpiTile` strip, which read
 * as a second section rather than part of the intro). Icons are all reused
 * from elsewhere on this page (`BookOpen`/`CheckCircle2`/`Clock` already
 * cover "modules"/"accuracy"/"not yet reached" concepts here), not the
 * frame's own literal Users/UserCheck glyphs — matching this app's icon
 * rule of translating a frame's glyph intent onto the project's existing
 * set rather than importing new ones for a one-off tile.
 *
 * The first 3 tiles are plain `StatCard`s (unmodified — this is a shared,
 * already-established component used identically on Home/Trainee/Consumer
 * Management, so its own type/weight choices are left alone here). The 4th,
 * "Reviews shared", has no real single-number equivalent — it's a
 * Baseline/Midline/Endline breakdown — and needed its own local layout
 * rather than `StatCard`'s `breakdown` prop, which baseline-aligns a number
 * beside its label for short numeric parts (e.g. "PLE 4"); these three parts
 * are words ("Yes"/"No"/"Pending"), stacked label-over-value per the frame,
 * a genuinely different shape rather than a colour/count variant of the
 * same one.
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
    /* Round 23, frame node `93:450`: the row is 3 flexible tiles plus a fixed
       **400px** "Reviews shared" tile, not 4 equal quarters. That is load-
       bearing, not cosmetic — with the frame's larger type on that tile
       (`title` 22px values), three equal-quarter columns clipped every value to
       "Pendi…". The 400px track gives each of its 3 sub-columns ~117px, which
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

/** "Reviews shared" tile — same `h-[120px] rounded-md bg-yellow-100 p-4`
 *  outer shell as `StatCard` for visual parity in the same grid row, but a
 *  bespoke body: 3 stacked label/value pairs (Baseline/Midline/Endline),
 *  matching the frame's own layout rather than `StatCard`'s single-number
 *  stack. "Pending" (not the frame's literal "–") for a timepoint not yet
 *  reached — a bare dash reads ambiguously to a screen reader landing on
 *  the `<dd>` alone; "Pending" doesn't.
 *
 *  Typography is deliberately smaller than the frame's own 14/24px spec
 *  (`text-fine`/`text-caption-medium` here, not `text-caption-medium`/
 *  `text-title`): the frame let this 4th tile grow wider than its 3
 *  siblings to fit 3 columns at that size, but this app's own established
 *  KPI-row convention (`RosterPage.tsx`/`ConsumerManagementPage.tsx`) is a
 *  uniform grid of equal-width `StatCard`s, and a real desktop measurement
 *  (`getBoundingClientRect`) showed the frame's literal sizes overflowing
 *  the tile by ~74px at that width once forced into an equal column. */
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
            // Round 23, direct instruction: an em dash, not the word "Pending",
            // for a timepoint the trainee hasn't reached — matching the frame,
            // which draws a dash in exactly these slots. The Round 21.3 note
            // arguing for "Pending" was about screen readers landing on a bare
            // dash `<dd>`, which is a real concern; it is handled by the
            // `sr-only` text below rather than by changing what is drawn, so
            // both the visual and the announcement are right.
            // "No" is kept for a review that exists but hasn't been shared:
            // that is a genuinely different state from not-yet-reached, and
            // collapsing both to a dash would hide the one worth chasing.
            const notReached = !entry.exists
            const value = notReached ? '—' : entry.shared ? 'Yes' : 'No'
            return (
              /* Round 23, frame node `93:509`: the frame grew this tile's own
                 type to match the rest of the row rather than shrinking it —
                 labels are `caption-medium` on `ink-faint` (was `fine`
                 semibold on `ink-muted`) and values are `title` 22px (was
                 `caption-medium` 14px). The Round 21.3 note explaining the
                 smaller sizes is superseded: it was written when this tile had
                 to fit inside a fixed 120px card, and `StatCard` now stretches
                 to the tallest tile in the row, so there is room. */
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
 * Module-by-module knowledge-check accuracy list, in curriculum order
 * (Figma `93:188`, node `93:896`) — replaces the earlier bar-chart-plus-list
 * pairing outright, per the frame: it shows just the list, no chart. A
 * single completed module is still worth showing on its own now that
 * there's no "trend" a lone bar chart point would misrepresent, so the
 * empty state only fires at zero entries, not fewer than two.
 *
 * Accessibility carries over from the removed chart version: full titles,
 * no truncation, no hover/focus interaction required to read a value.
 */
function ModuleBreakdownCard({ entries }: { entries: ModuleAccuracyEntry[] }) {
  return (
    /* Sub copy reframed (direct instruction) from *what the chart is* to
       *what it measures*: module understanding. Deliberately parallel with the
       SIPTEA card's own sub-line below, so the two read as a pair of
       understanding measures rather than two unrelated charts. */
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
          {/* `justify-between` + `flex-1`: when this card is the shorter side
              of a height-matched pair, the *rows themselves* stay their own
              fixed size — only the gap between them grows to absorb the
              leftover space, rather than a single dead block collecting
              below the last row. `gap-8` stays as the floor when there's no
              slack to distribute (a no-op in that case). */}
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

/** `dl`-style SIPTEA breakdown covering all 6 letters (S,I,P,T,E,A): each
 *  component's mapped core skill(s), how many of its doc-mapped modules the
 *  coach has completed with real knowledge-check bank data, and the real
 *  average accuracy across just that assessed set. Never shows a
 *  percentage when nothing has been assessed yet (`averageAccuracy ===
 *  null`) — the module-count line always renders regardless. Carries no
 *  on-track/watching/struggling status indicator of its own. Sits beside
 *  the raw rail/canvas drill-in below, not inside it. */
function SipteaBreakdownCard({ coach }: { coach: Coach }) {
  const breakdown = sipteaBreakdown(coach)

  return (
    /* Reframed to name what it measures — SIPTEA framework understanding —
       and parallel in construction with the module card above it.
       Also fixes two things the old line got wrong: "each coach's" (there is
       one person on this page, and they are a trainee, not a coach) and
       "completed modules" (there is no module column; that described what the
       accuracy is derived *from*, not what is on screen). */
    <SynthesisCard
      title="SIPTEA component breakdown"
      subtitle="Understanding of each SIPTEA framework component."
      subtitleClassName="text-body text-ink"
      className="h-full rounded-[12px]"
    >
      {/* Restructured from a real `<table>` to an ARIA-table (role="table"/
          "row"/"columnheader"/"cell") over a CSS Grid, matching the exact
          same 220px/flex/140px columns — needed so the row group can be a
          flex column with `justify-between`. A real `<table>`'s row heights
          are driven entirely by its own layout algorithm; there's no way to
          make just the *gaps* between `<tr>`s flexible while table-driven
          columns are still in play. Rows keep their own fixed size; only the
          space between them grows to fill the card when it's the shorter
          side of a height-matched pair (same fix as the module list beside
          it), rather than leaving one dead block below "Action and goals". */}
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

/** Plain caption line comparing this trainee's average accuracy against
 *  `cohortAverageAccuracy` — an honest fallback string when either side has
 *  no qualifying data, never a fabricated benchmark. */
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

  // Default-open group: whichever section holds the trainee's current/most
  // recent module (the one `selection` itself starts on) — every other
  // section (including Annotation summaries) starts collapsed, so the card
  // doesn't dump all groups open at once on arrival.
  const defaultOpenKey =
    MODULE_GROUPS.find((g) => g.moduleIds.includes(firstNonEmpty))?.key ??
    MODULE_GROUPS[0]?.key ??
    'foundational'
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    [defaultOpenKey]: true,
  }))
  // Single-open accordion: opening a section closes whichever other section
  // was open, so at most one is ever expanded at once. Toggling the already
  // -open section just collapses it, leaving all sections closed.
  const toggleSection = (key: string) =>
    setOpenSections((prev) => (prev[key] ? {} : { [key]: true }))

  // Whether the tracker card has more rows below the current scroll position
  // — drives a "Show more" cue so a row like Endline Review (last in the
  // list) doesn't sit silently below the fold with no hint to keep scrolling.
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

  // Hooks above must run unconditionally (Rules of Hooks) — this guard sits
  // after them, before any of the heavier derived data below.
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

  // Synthesis-view derived data — every value below is a pure function of
  // real seed data (see the "Learning Progress synthesis helpers" block
  // above `PendingInviteBanner`). Nothing here is computed from anything the
  // rail/canvas grid below doesn't already have access to.
  const completedCount = ordered.filter((r) => r.status === 'completed').length
  const totalModules = ordered.length
  const withBank = completedModulesWithBank(coach)
  const averageAccuracyValue = averageAccuracy(withBank)
  // "SIPTEA understanding" KPI tile — how many of the 6 SIPTEA components
  // have at least one real assessed module behind them, never a fabricated
  // count.
  const sipteaAssessedCount = sipteaBreakdown(coach).filter(
    (item) => item.averageAccuracy !== null,
  ).length
  // Preserved for `CohortComparisonLine` (currently unused in render — see
  // that component's removal comment further down this tab). The `void`
  // marks it deliberately unused so `noUnusedLocals` doesn't flag it,
  // without deleting the computation itself.
  const cohortAverage = cohortAverageAccuracy(coach, coaches)
  void cohortAverage

  // Row shape shared by the tracker's grouped sections and the mobile
  // <select> below. One row per module record + one per annotation-summary
  // timepoint (Round 2.2.6's original flat list is now organised into the
  // real curriculum's 3 named tiers — Foundational / Sleep / Practice —
  // instead, per direct instruction to mirror the actual coach curriculum).
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

  // Curriculum-mirroring groups — Foundational modules and Sleep modules, from
  // `MODULE_GROUPS` in their real curriculum order. Round 29 removed the third,
  // standalone "Practice module" section along with the module itself ("there
  // is no more any practice module"); this view and the coach's own My Training
  // page read the same `MODULE_GROUPS`, so they cannot disagree about what the
  // curriculum contains.
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
    // `-mt-8`: the shared tabpanel wrapper (`CoachProfilePage`'s own render,
    // below `TabIntro`) puts a 56px section gap before every tab's content,
    // plus `TabIntro`'s own 16px bottom padding — 72px total, correct when
    // the next thing really is a new section/card. Figma `93:188` puts the
    // KPI row only 40px below the intro subtitle since it's part of the same
    // "Tab intro" block, not a new section, so the full 32px (72-40) is
    // pulled up here rather than shrinking the shared 56px gap or
    // `TabIntro`'s own padding, both used by the other 3 tabs too. Verified
    // by measuring `subtitle.bottom` to `kpiGrid.top` live, not calculated.
    <div className="-mt-8 space-y-14">
      {/* KPI row (Figma `93:188`) — now part of the tab intro itself, no
          separate "Learning progress insights" heading above it (the shared
          `TabIntro` already rendered the section's title/subtitle before
          this component). Must be the very first visible content on this
          tab — unconditionally, not just when there happen to be no active
          learning flags. */}
      <LearningKpiRow
        coach={coach}
        completedCount={completedCount}
        totalModules={totalModules}
        averageAccuracyValue={averageAccuracyValue}
        sipteaAssessedCount={sipteaAssessedCount}
      />
      {/* LearningFlagsCard removed from the Learning Progress tab per direct
          researcher feedback (2026-08-19) after seeing it live in the app.
          The component (defined above, `LearningFlagsCard`) and its
          `learningFlags()` derivation helper are intentionally preserved,
          unused, for possible future reuse — this is not dead code or an
          oversight. */}
      {/* CohortComparisonLine removed from the Learning Progress tab per direct
          researcher feedback dated 2026-08-19 (seen live in the app). The
          `CohortComparisonLine` component (defined above) and the
          `cohortAverageAccuracy()` derivation helper are intentionally
          preserved, unused, for possible future reuse — this is not dead
          code or an oversight. */}
      {/* Figma `93:188` gives these two cards unequal widths (accuracy card
          fixed ~432px, SIPTEA table flexible) rather than a 50/50 split — an
          even split measured too narrow for the SIPTEA table's 3 columns,
          wrapping "Empathy vs. Sympathy" onto 3 lines (caught by
          `layoutAudit()`, not by eye). Matching the frame's own asymmetry
          fixes it rather than fighting it.
          `items-start` dropped (flex default is `stretch`) per direct
          feedback: the SIPTEA table is reliably taller than the module list,
          and the shorter card should match its neighbour's height rather
          than end short. */}
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full lg:w-[420px] lg:shrink-0">
          <ModuleBreakdownCard entries={withBank} />
        </div>
        <div className="w-full min-w-0 lg:flex-1">
          <SipteaBreakdownCard coach={coach} />
        </div>
      </div>

      {/* Round 20 design-critique fix — column top alignment. Round 20 moved
          this title/subtitle out of the tracker Card and into the grid's LEFT
          column, which pushed only that column's card down by the heading
          block's height (measured 85px live): the right-hand detail canvas
          then top-aligned with the heading *text* instead of with the card
          beside it, leaving a visible notch at the canvas's top-left corner.
          Lifting the block above the grid makes both columns start on the same
          line. It also reads more correctly — "…module engagement and
          responses" describes the whole master-detail region, not just the
          left list. Kept `hidden lg:block` so the below-lg layout (which uses
          its own labelled "Review" select instead of the tracker) is byte-for
          -byte unchanged. This block is now the LAST block on the tab, below
          the KPI row and the two insight cards above (Figma `93:188`'s own
          "Module engagement tracker" section — untouched by this round). */}
      <div className="hidden lg:block">
        <h2 className="font-display text-title">Module engagement tracker</h2>
        <p className="mt-1 text-caption text-ink-faint">
          Every module and reflection timepoint, grouped by curriculum tier.
        </p>
      </div>
      {/* `-mt-8`: pulls this grid up from the outer `space-y-14` (56px) to
          24px below the "Module engagement tracker" heading/subtitle above,
          per direct live feedback — scoped to just this one gap, not a
          change to the outer container's other 56px gaps. */}
      <div className="-mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Engagement tracker — flat list at desktop, labelled select below lg */}
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

        {/* Capped + scrollable to match the canvas's own viewport-relative
            cap (Round 2.2.8) — without this, the tracker's natural height
            (11 rows) stretches the grid row past the canvas's max-height,
            leaving dead space below the shorter, capped canvas. A "Show
            more" cue fades in over the bottom edge whenever the list has
            content below the fold (e.g. Endline Review, always the last
            row) and fades out once scrolled into view, so nothing sits
            silently hidden. */}
        <div className="relative hidden self-start lg:block">
          {/* Title + subtitle moved out of the card entirely per direct
              feedback — rendered as a plain heading, not inside any
              bordered/tinted box. The card itself starts directly with the
              accordion sections, no header region or divider inside it.
              That heading block now lives ABOVE the grid rather than in this
              column — see the fix note at the top of this component. */}
          <Card
            ref={trackerRef}
            onScroll={updateHasMoreBelow}
            className="max-h-[70vh] gap-0 overflow-y-auto rounded-lg py-0 ring-hairline"
          >
            <nav aria-label="Engagement tracker">
              {/* Grouped into the real curriculum's own 3 tiers — Foundational
                  modules, Sleep modules, Practice module — mirroring the
                  Coach Delivery Portal's own Learning tab / ModuleTimeline
                  grouping, plus a 4th "Annotation summaries" group for the
                  Baseline/Midline/Endline rows previously tacked on the end
                  of one flat list with no boundary at all (Round 2.2.6).
                  Each group is now a real accordion (Round 20): a bold,
                  pearl-tinted header (not the old grey caption) carrying a
                  completion count and a chevron that flips on open/close,
                  with only one section ever open at a time (opening a
                  section auto-closes whichever other one was open), the
                  trainee's current-module group open by default so the
                  card doesn't dump everything at once.
                  Later the same round: the wrapper no longer has its own
                  rounded-box/ring treatment — that read as a card nested
                  inside the Engagement tracker card. Sections are separated
                  by each TrackerSection's own hairline border-b only, so the
                  whole tracker reads as one flat card with divided rows.
                  Corner-rounding fix: `nav` used to carry a uniform `p-3`,
                  which happened to keep every section comfortably clear of
                  the Card's own rounded corners — but relied on that
                  padding rather than fixing the corners directly, so any
                  future padding change would silently reintroduce a square
                  -corner-against-round-corner mismatch. `nav` now carries no
                  padding at all (later the same round, side gutter removed so sections
                  stretch edge-to-edge within the card); the first/last
                  section's own `isFirst`/`isLast` props round their
                  top/bottom corners (or defer to `overflow-hidden` clipping)
                  to match the Card's `rounded-lg` directly, so the fix holds
                  regardless of which section is expanded or how the nav
                  itself is padded. */}
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
              // The fade is capped at 5% max opacity (Round 2.2.9 fix) — any
              // higher and it washes the row(s) directly underneath below
              // WCAG AA contrast (verified: the success-green "Shared" status
              // text drops under 4.5:1 at as little as ~8% white overlay).
              // The pill itself (opaque bg-card + ring + shadow) is the real,
              // fully legible affordance; the gradient is just a soft seam.
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

        {/* Selected content — the canvas itself is the container now (no
            outer white card wrapping it); it scrolls internally. Its fill was
            `bg-hairline` (a *border* token doing surface duty, #e0e0e0,
            flagged as a known deferred item in Round 20's own handover —
            "introducing a grey that exists nowhere else in an app whose real
            surface tokens are `parchment` and `pearl`") — resolved here per
            direct instruction to the app's real off-white surface token
            instead. No title or status repeated above it — the tracker row
            already names the selection. */}
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

function StagePipeline({ coach }: { coach: Coach }) {
  const { phaseCompletion, togglePhase } = useResearch()
  const completed = phaseCompletion[coach.id] ?? []
  const firstName = coach.fullName.split(' ')[0]
  const [pending, setPending] = useState<PendingPhaseAction | null>(null)

  // Index of the first pipeline row that renders a "Mark complete" button —
  // the same `!done` condition the row itself uses below. -1 when every stage
  // is already complete, in which case no row carries the tour anchor.
  const firstIncompleteIndex = PIPELINE_PHASES.findIndex(
    (p) => !completed.includes(p.number),
  )

  return (
    /* Round 23, frame node `172:1218`. The `bg-card-header` title/subtitle
       block is gone — its job moved to the tab intro above the card, and the
       frame replaces it with a real table header row ("Stage & progress" /
       "Action"). Card surface follows the revamp: 1px `parchment` border, warm
       `Card shadow`, 16px radius. */
    <Card
      className="h-full gap-0 rounded-lg border border-parchment bg-card py-0 shadow-card"
    >
      {/* Re-read from the frame after a live Figma edit: the header band is now
          `Purple/50` (#f3efff) with `neutral/dark-grey` labels, and its bottom
          stroke is **gone** — the tint is what separates the header from the
          rows, so a hairline under it would be a second, redundant boundary.
          Both values are existing tokens; note this is `purple-50`, NOT
          `--color-card-header` (`purple-200` #e4d6ff), which is a visibly
          darker step used by the §35a card-header pattern elsewhere. That
          missing divider is a deliberate, frame-driven divergence from §35a's
          "one hairline under every card title" rule.
          `ink-muted` on this band measures 11.19:1 — AAA. */}
      <div className="flex items-center justify-between rounded-t-lg bg-purple-50 p-6">
        <p className="w-[180px] text-caption-medium text-ink-muted">Stage &amp; progress</p>
        <p className="w-[160px] text-center text-caption-medium text-ink-muted">Action</p>
      </div>

      {/* `flex-1` + the `<ol>` below it: the card is height-matched to its
          taller sibling, so the five rows used to bunch at the top and leave a
          block of dead space underneath. The rows now share the leftover height
          between them instead.
          Each row *grows* (`flex-1` on the `<li>`, `min-h-16` as the floor)
          rather than the list adding gaps between them — that distinction is
          load-bearing. `justify-between` would have spread the rows apart and
          broken the timeline: the connector is a `flex-1` span inside each
          row's own track, so it only draws a continuous line if the rows stay
          flush and absorb the slack internally. */}
      <div className="flex flex-1 flex-col px-6 py-4">
        {coach.certification.outcome === 'pass' && (
          <p className="mb-2 flex items-center gap-1.5 text-fine text-ink-muted">
            <Lock aria-hidden="true" className="size-3.5" />
            All stages are locked while certification is Pass.
          </p>
        )}
        <ol className="flex flex-1 flex-col">
          {/* Only Stage C/O/A/CP/H render here — Phases 1–2 (Recruitment,
              Enrolment) are already done by the time someone's on the
              roster, and Phase 8 (Entry into SPACES delivery) is
              post-certification, so none of the three are a stage a
              researcher marks complete (Round 9.1). */}
          {PIPELINE_PHASES.map((phase, i) => {
            const done = completed.includes(phase.number)
            const last = i === PIPELINE_PHASES.length - 1
            // Once Pass is recorded, every rendered stage is locked against
            // reverting — protects the certified record from being silently
            // altered (Round 2.2.9).
            const lockedByPass =
              coach.certification.outcome === 'pass' && CERT_REQUIRED_PHASES.includes(phase.number)
            // Round 23, frame nodes `179:2`/`172:1226`: the current stage is
            // labelled "Ongoing" and a finished one "Complete". "Ongoing" is
            // the first stage not yet ticked — the same `firstIncompleteIndex`
            // the "Mark complete" tour anchor already derives, so the label and
            // the anchor can never point at different rows.
            const ongoing = !done && i === firstIncompleteIndex
            return (
              /* Every row is the same height with its content vertically
                 centred, replacing the old top-aligned `pt-0.5`/`pb-5` rhythm.
                 The frame draws 52px; raised to **64px** on direct feedback
                 that the list read too tight. 52px left only 10px of slack
                 around the 42px label block, so five rows stacked into a dense
                 block — 64px gives 22px and the stages breathe. Deliberate
                 divergence from the frame, and the label type inside is
                 untouched so nothing got tighter to pay for it. */
              <li key={phase.number} className="flex min-h-16 flex-1 items-center gap-4">
                {/* Timeline marker + connector — reused as-is on direct
                    instruction, only re-seated into the frame's row geometry.
                    The connector is now split above *and* below the marker
                    (each `flex-1`, transparent at the two open ends) rather than
                    a single run below it, which is what lets a fixed-height
                    row still draw one continuous line through all five nodes.
                    Dot/tick states and their colours are unchanged (Round
                    2.2.9), including the contrast-verified connector tones. */}
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
                    // Accessibility fix: `bg-divider-soft`/`bg-success/40` both measured
                    // under 2:1 against this row's own white background, short of the
                    // 3:1 WCAG 1.4.11 floor for a UI boundary.
                    className={cn(
                      'w-[1.5px] flex-1',
                      last ? 'bg-transparent' : done ? 'bg-success/80' : 'bg-ink-faint/80',
                    )}
                  />
                </div>

                {/* Phase label + explicit action (never toggled by clicking the dot) */}
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    {/* Direct instruction: the status label sits on the stage
                        *title's* line, 16px after it — not centred against the
                        whole two-line block, where it floated between the two
                        lines and belonged to neither. */}
                    <div className="flex items-center gap-4">
                      {/* 15/700 and 13/400 per the frame — neither is a named
                          step in the scale (15px is the app's button/tab
                          convention; 13px was retired in Round 21.3), so both
                          are stated inline rather than minting tokens for one
                          row.
                          No `leading-none`: a first pass collapsed both lines
                          to their font size, which measured 30px against the
                          frame's own 36px label block and read visibly cramped.
                          Natural leading gives 18 + 2 + 16 = 36 — the frame's
                          number exactly, with the 2px gap kept. */}
                      <p className="text-[15px] font-bold whitespace-nowrap text-ink">
                        {stageShortName(phase.number)}
                      </p>
                      {/* The shared `<Chip>`, not a local pill.
                          The frame draws these in raw `#d9f2de`/`#218c21` at
                          11/700 in a 19px pill — which is (a) off this app's
                          palette, (b) only 3.66:1, an AA failure at 11px, and
                          (c) a fourth status-chip geometry in an app that
                          already has one. So the frame decides the placement
                          and the wording here and `Chip` decides how it looks,
                          per this project's own standing rule.
                          Tones: `success` for Complete, and — direct
                          instruction — `next` for Ongoing, which is the same
                          purple the Overview tab's "Ready now" already uses for
                          a stage the trainee has reached but not finished, so
                          both tabs describe the same state identically.
                          Trade-off worth knowing: this makes the label 27px
                          rather than the frame's 19px. It fits — the row is
                          64px — and consistency with every other status chip in
                          the app is worth the 8px. */}
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
                      // Frame node `172:1229`: same utility-button family the app
                      // already uses here, with the frame's own 18px side
                      // padding and bold label.
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
 * yellow steps replaced — the purple certificate body is untouched. The greens
 * are **derived from the single `--color-success` token** by compositing it
 * over white at 35% / 65% / 100%, the same alpha-mix technique the status chips
 * already use, rather than inventing a three-step green ramp this palette
 * doesn't have:
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
    /* Full-width panel with the artwork centred in it, rather than a 240px box
       floated left. Now that the card sits in a half-width column and stacks
       image-above-text, a fixed-width panel left a dead gutter beside it. */
    <div className="w-full shrink-0 rounded-sm bg-yellow-100 p-4">
      <img
        src={earned ? '/illustrations/certificate-earned.svg' : '/illustrations/certificate.svg'}
        alt=""
        width={240}
        height={205}
        // Scales with the column instead of being pinned to the frame's 240px
        // export size — the SVG has a real `viewBox`, so `w-full h-auto` keeps
        // the 240:205 ratio at any size. Capped at 400px so it doesn't become
        // enormous on a wide screen.
        //
        // Dimmed while locked so "not earned yet" is legible at a glance, full
        // strength once every stage is ticked. Opacity is decorative only —
        // the "N of 5 stages complete" line and the outcome chip carry the
        // state in text, so nothing here is colour- or opacity-only.
        className={cn(
          'mx-auto block h-auto w-full max-w-[300px] transition-opacity duration-300',
          earned ? 'opacity-100' : 'opacity-60',
        )}
      />
    </div>
  )
}

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
      /* Round 23, frame node `172:1402`. The locked state is now the tab's
         second full-width card: `yellow-50` surface, the frame's certificate
         illustration on a `yellow-100` panel, and the copy beside it. Every
         colour here is an existing token — the frame's own `#4a5262` body grey
         has no equivalent on this palette and maps to `ink-muted`, which is the
         token that already does this job (direct instruction: stick to our
         tokens, don't mint the frame's extras). */
      <Card
        className="h-full gap-0 rounded-lg border border-parchment bg-yellow-50 py-0 shadow-card"
      >
        {/* Always stacked — illustration first, then the text block. The frame
            drew them side by side because the card was full width; in a
            half-width column the 240px panel plus text made both cramped. */}
        <div className="flex h-full flex-col gap-8 p-6">
          <CertificateIllustration earned={false} />
          <div className="flex min-w-0 flex-1 flex-col gap-6 p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Lock aria-hidden="true" className="size-[22px] shrink-0 text-ink" />
                {/* 24/700 with -0.24px tracking, per the frame. Not a named
                    step (Round 21.3 retired the 24px one) and deliberately not
                    re-added for a single card title. */}
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
    /* Earned state. The frame only draws the locked card, so this one keeps its
       own content and adopts the same shell: the revamp's card surface, and —
       per direct instruction — the *same* illustration panel rather than
       dropping it, now at full opacity with a green rosette. Keeping the
       certificate present in both states is what makes the transition read as
       "you earned this", instead of the artwork simply vanishing at the moment
       it becomes true. */
    <Card
      className="h-full gap-0 rounded-lg border border-parchment bg-card py-0 shadow-card"
    >
      <div className="flex h-full flex-col gap-8 p-6">
        <CertificateIllustration earned />
        <div className="min-w-0 flex-1">
        {/* Direct instruction: the outcome chip sits on the title's own line,
            not stacked under it. The assessed date stays on its own line below
            — it is a detail about the outcome, not part of the heading. */}
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
        {/* Recording is open whenever the coach isn't yet certified — covers
            the first assessment (not-yet-assessed) and any later
            re-assessment after remediation (Round 2.2.9), so the outcome
            isn't a one-way dead end. */}
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
    // Round 23, frame `172:742` (node `172:1280`): the two cards are stacked
    // full width, 24px apart — not a 2-column grid. The pipeline's rows are a
    // wide table (stage on the left, action pinned right), which the old
    // half-width column couldn't hold without the action crowding the label.
    <div className="flex flex-col gap-6">
      {/* Intro renders inline here, not at the panel level, because the frame
          pairs it with a right-aligned "Need Help?" link (node `172:1448`) and
          sets a 24px gap to the card below — the same reason Overview renders
          its own. */}
      <div className="flex flex-col gap-8 pt-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="font-display text-title text-ink-muted">
            {TAB_INTRO['Stage Management'].title}
          </h2>
          <p className="text-body text-ink">{TAB_INTRO['Stage Management'].subtitle}</p>
        </div>
        {/* No destination designed for this yet — focusable `aria-disabled`
            with an `sr-only` cue, the same treatment `ResearchHomePage`'s own
            "Need help" quick link already uses. */}
        <button
          type="button"
          aria-disabled="true"
          className="-my-3 shrink-0 rounded-sm py-3 text-caption-medium text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Need Help?
          <span className="sr-only"> (coming soon)</span>
        </button>
      </div>
      {/* Back to two columns on direct instruction, with the two cards
          height-matched. `items-stretch` is the grid default; what actually
          makes it work is `h-full` on both cards (see each one) — without it
          they size to their own content and the shorter one leaves a ragged
          bottom edge next to the taller. */}
      {/* Not an even 50/50: the pipeline holds five two-line rows plus a
          right-aligned action, and the certification card holds one
          illustration and a short paragraph. `1.75fr / 1fr` gives the pipeline
          the room it actually needs and — the reason it was asked for —
          narrows the certification column, which is what scales the
          certificate down (the artwork is `w-full`, so its size is a
          consequence of this ratio, not a fixed number). */}
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
 * Reuses `SupervisionRecords` verbatim (the exact component the Coach
 * Delivery Portal's own Session Logs tab reuses, Round 6.2) — same
 * note-creation form and records table, no fork. No `dyadId` is passed: this
 * tab's notes are the researcher's own supervision notes about the trainee
 * as a whole, the same scope `SpacesCoachProfilePage.tsx`'s "Supervision
 * Logs" tab already uses for a certified coach, not scoped to any one
 * consumer. `fullWidthStack` drops the Scheduled Sessions `rightSlot`
 * entirely and stacks the note-creation card above the records table full
 * -width, rather than the side-by-side layout that slot enables elsewhere.
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
    // `-mt-8`: matches the same shared-tabpanel pull-up convention used by
    // the Learning Progress tab above — closes most of the wrapper's 56px
    // gap between `TabIntro`'s subtitle and this tab's content card, leaving
    // a small deliberate gap rather than zero.
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

/** Coach profile — drill-in from the roster or an approved EOI (plan §5). */
export function CoachProfilePage() {
  const { coachId } = useParams()
  const { coaches } = useResearch()
  const [tab, setTab] = useState<Tab>('Overview')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const coach = coaches.find((c) => c.id === coachId)
  // `headingRef` is retained: it is also the focus target the Round 20
  // accessibility work established for this page's heading, independent of the
  // now-removed needs-support banner that first introduced it.
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
      /* Round 23, frame `152:176` (`Header Section`, node `152:211`) — the
         record-page hero is now a solid `Purple/700` band with white type,
         replacing Round 21's pale `purple-50` wash. `pt-10` (40px) and
         `md:px-20` (80px) are the frame's own measured insets; they override
         the shell's defaults through `heroClassName`, which `cn()` merges last.
         No bottom padding: the band's bottom edge IS the active tab's underline,
         which is why the shell's tab-seam mode (no `heroNoSeam`) is correct here
         and why the frame measures exactly 257px tall. */
      heroClassName="bg-purple-700 px-6 pt-10 md:px-20 md:pt-10"
      topBanner={coach.inviteStatus === 'pending' ? <PendingInviteBanner coach={coach} /> : undefined}
      hero={
        <>
          {/* `-my-3 py-3` is deliberate: the frame draws this link as a bare
              17px text line, and any `min-h` would push the whole band's
              measured geometry down. The negative margin keeps the flow box at
              17px (so the 48px gap below it is the frame's 48px) while the
              padding still gives a 41px pointer/touch target — both the frame
              and the target-size floor, rather than trading one off. */}
          <Link
            to="/research/trainees"
            /* `flex w-fit`, not `inline-flex`: as an inline-level box the
               anchor sits in a line box whose strut is taller than the 17px
               text, so the negative margins never fully cancelled and the band
               came out 7px tall. Block-level flex has no strut, so the 41px
               padded box minus 24px of negative margin contributes exactly the
               frame's 17px to the flow. */
            className="-my-3 flex w-fit items-center gap-2 rounded-sm py-3 text-caption-medium text-white outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft aria-hidden="true" className="size-3" />
            Back to roster
          </Link>

          {/* Record header — identity above, tabs below in their own row (Round
              4.1: long dyad/coach names were crowding a right-aligned tab bar) */}
          {/* Round 21.3, frame `45:161`: the name gains a "Trainee:" eyebrow
              above it (`body-md`, `ink-faint`). The page previously opened
              on the bare name — which read fine on the roster drill-in but not
              from a deep link, where nothing said what kind of record this is.
              The consumer record page has always carried its own PLE:/Carer:
              labels for the same reason; this brings the trainee page in line. */}
          {/* Round 23: 48px below the back link (frame's own gap), and the
              eyebrow/name recoloured for the purple band — `parchment`
              (`neutral/off-white`, 9.75:1 on this band) and white (10.62:1). */}
          <div className="mt-12 flex flex-col gap-2">
            <p className="text-body-md text-parchment">Trainee:</p>
            <h1 ref={headingRef} tabIndex={-1} className="font-display text-display-lg text-white outline-none">
              {coach.fullName}
            </h1>
            {/* Still no participant ID or lifecycle chip: the ID is a lookup
                key already on the roster you arrived from and repeated under
                Personal details, and the chip duplicated a state the
                pending-invite banner announces. */}
          </div>

          <div
            role="tablist"
            aria-label="Coach profile sections"
            /* `mt-[33px]`, not `mt-12`, and the odd number is doing real work.
               The frame puts 48px between the name block and the tab *text*,
               with each tab drawn as a bare 17px line + 12px bottom padding
               (29px total). Our tabs carry `min-h-11` for the 44px target
               floor, which bottom-aligns the text 15px lower inside the button
               — so the top margin absorbs that 15px (48 - 15 = 33) and the text
               lands exactly where the frame puts it. It also makes the band
               257px tall, the frame's own height, because 33 + 44 closes it out
               precisely. Don't "tidy" this back to `mt-12`. */
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
                      /* `yellow-300` (`Yellow/300` #ffcc4d) — the frame's active
                         underline. The yellow is the only warm accent on the
                         band, so it is what marks the selected tab; `primary`
                         would be invisible against `purple-700`. */
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
        // 40px (gap-10), not the previous 56px (gap-14) — the consumer record
        // page's own tabpanel wrapper was already 40px, with a comment
        // claiming this page matched it. Bringing this one down to 40px
        // makes that claim true and gives the two record pages one shared
        // top-level rhythm.
        className="mt-16 flex flex-col gap-10"
      >
        {/* Round 23, frame `152:176`: on Overview the intro block is no longer a
            full-width row above the content — the frame pairs it side by side
            with the Trainee Details card (`Frame 108`, node `152:232`), so
            `Overview` renders its own `TabIntro` inside that row. Every other
            tab keeps the full-width block. */}
        {/* Overview and Stage Management render their own intro inline (each
            pairs it with something on the same row). Personal details renders
            none at all — direct instruction: both of its cards carry a real
            header band naming themselves, so a third title above them repeated
            the same words a third time. */}
        {tab !== 'Overview' && tab !== 'Stage Management' && tab !== 'Personal details' && (
          <TabIntro {...TAB_INTRO[tab]} />
        )}
        {tab === 'Overview' && (
          <Overview
            coach={coach}
            onGoToTab={(next) => {
              setTab(next)
              // The button that triggered this unmounts with the Overview
              // panel, which drops keyboard focus to `<body>` — confirmed live.
              // Focus moves to the tab it just activated, which is always
              // mounted and is where a keyboard user expects to land.
              tabRefs.current[TABS.indexOf(next)]?.focus()
            }}
          />
        )}
        {tab === 'Learning Progress' && <LearningProgress coach={coach} />}
        {tab === 'Stage Management' && <StageManagement coach={coach} />}
        {tab === 'Supervision Notes' && <SupervisionNotesTab coach={coach} />}
        {tab === 'Personal details' && <PersonalDetails coach={coach} />}
      </div>

      {/* Round 17 — deliberately not fired on a pending-invite trainee. Both
          Learning Progress and Stage Management short-circuit to "No details
          available yet" while an invite is pending, so 4 of this tour's 5
          steps would have no anchor to point at. They'd degrade to centred
          cards rather than break, but a first-run user would sit through four
          consecutive cards describing things that aren't on screen — and the
          roster sorts by stage ascending, which puts the pending trainee
          first, making that the *likely* first drill-in rather than an edge
          case. Skipping here leaves the tour unseen, so it fires intact on the
          first active trainee opened instead. */}
    </ResearchShell>
  )
}
