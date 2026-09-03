import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BookOpen, CalendarDays, ChevronDown, ListChecks, Loader2 } from 'lucide-react'
import { SessionDateCalendar } from '@/components/research/SessionDateCalendar'
import {
  SessionPlannerTable,
  STEP_TIME_CONTROL,
  TIME_STEP_SECONDS,
} from '@/components/research/SessionPlannerTable'
import { WizardStepHeading } from '@/components/shared/WizardStepHeading'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import {
  DAY_OF_WEEK_OPTIONS,
  DAY_OF_WEEK_OPTIONS_ALL,
  SPACES_CATCHUP_COUNT,
  SPACES_SESSIONS,
  WEEKLY_CADENCE_DAYS,
  addDays,
  displaySessionNumber,
  generatePlanRows,
  nextWeekday,
  type ConsumerDyad,
  type SessionPlanRow,
} from '@/data/spaces'
import { formatDate, formatTime, toLocalISODate } from '@/data/format'

/** The wizard anchors to the REAL current date (Round 38, direct feedback:
 *  "I can still see July"), not the seed world's frozen `TODAY` — a coach
 *  demoing plan creation should see dates they could actually book. The rest
 *  of the app keeps reading `TODAY`; a freshly created plan simply lives a
 *  few weeks ahead of the seeded world, which reads correctly everywhere
 *  (all sessions upcoming, nothing markable complete yet). */
const PLAN_ANCHOR = toLocalISODate(new Date())

/**
 * Guided "Plan sessions" wizard (Round 14.1 — replaces the old raw
 * Session-0-date + cadence inputs that sat directly in the Session Plan
 * card, which direct coach feedback flagged as confusing and unguided,
 * especially mid-Zoom-call with a consumer). Same hand-built dialog chassis
 * as `AddCoachTraineeModal`/`EnrollConsumerDialog` (own backdrop/focus-trap/
 * Escape/return-focus, `h-[85vh]`) — not `ConfirmDialog`, which unmounts its
 * content on close. Two chassis numbers now diverge from the other wizards and
 * are local to this file: the panel is `max-w-[888px]` (they keep 920px), and
 * the step rail is this file's own `StepRail` (they keep the shared, labelled
 * `WizardProgressRail`, which still has 3 callers).
 *
 * Create-only (Round 16 continued, direct feedback): this wizard used to
 * double as the card's "Edit plan" entry point too (`mode="edit"`, opening
 * straight to the review step, pre-filled from the live plan). That's been
 * split out into its own, much smaller `EditSessionPlanModal` — a coach
 * amending an already-active plan shouldn't have to see or step through
 * the module-availability/catch-up-timing questions (or this file's own
 * 2-column rail chassis) just to change a date. This component now only
 * ever runs when no plan exists yet. Nothing touches the store
 * (`bulkSetSessionPlan`) until the final confirm click on the review step.
 *
 * Calendar-style day pickers + week-wise timeline (Round 14.4 — reopens
 * Round 14.3's weekday questions after direct feedback on 4 fronts):
 * (1) each question step now asks in plainer, consumer-facing language and
 * explains itself rather than presenting a bare control; (2) the plain
 * `<select>` weekday dropdowns are replaced with a `WeekdayPicker` — a row
 * of 7 clickable day tiles read as a small calendar strip; (3) a same-week
 * blocking rule on the catch-up picker, REMOVED in Round 38 along with its
 * `mondayFirstOrdinal()` helper — see the meeting-first note below for why
 * it banned the best plans and allowed the worst one; (4) the review step no longer shows Session 0 at
 * all (it's today's live planning meeting, not a scheduled item to review)
 * and is rebuilt as a week-wise timeline — each week's Module-unlock day and
 * Session catch-up day/time shown side by side, clearly labelled, rather
 * than a flat per-row table of raw date/time inputs. Per-row date editing
 * (Round 15 correction — this paragraph previously, incorrectly, said it
 * had been dropped): `moduleTargetDate`, `date`, and `time` are all directly
 * editable per row via one generic `patchRow(session, patch)` setter — see
 * `rowDateInvalid`/`crossWeekInvalid` for the cross-field/cross-week
 * validation this adds.
 *
 * Two loading interstitials (Round 14.2): `generating` (a brief "Building
 * your session plan…" interstitial between the last question and the review
 * timeline) and `saving` (the same treatment on the review step's final
 * confirm click, before the plan actually commits to the store). Both are
 * deliberately fake timers (no real async work backs either one) — see
 * `LOADING_MS` — purely to make "the system is doing something" legible
 * instead of an instant, jarring screen swap. Round 15 fix: entering either
 * interstitial unmounts whatever button triggered it, so focus is moved to
 * `loadingHeadingRef` the moment `busy` flips true — see the focus-management
 * effects below.
 *
 * Numbering (Round 14.1 correction): Session 0 is the planning session —
 * where the coach and consumer agree module completion target dates and the
 * post-module catch-up sessions that follow. It is NOT the same thing as the
 * always-unlocked "onboarding module" content. Sessions 1-6 are the
 * post-module catch-ups (Session N happens once Module N is done, and
 * completing it unlocks Module N+1). See `displaySessionNumber()` and
 * `SPACES_SESSIONS`'s own doc comment in `data/spaces.ts`.
 *
 * Welcome/intro screen (Round 15, `showIntro`) — a one-time explainer ahead
 * of the 3 real steps, previously undocumented here despite being added the
 * same round as the color system below.
 *
 * Meeting-first flow (Round 38 — reverses the question order the wizard had
 * carried since Round 14.2, after a live critique session against a working
 * mock). The weekly catch-up meeting is the real commitment (two calendars,
 * a recurring Zoom appointment), so it is now Step 1; the module day derives
 * from it in Step 2 and can never conflict with it. Four consequences:
 * (1) the old "days before the module are blocked" rule is gone — it banned
 * long-runway options (module Friday, catch-up Monday = 3 days) while
 * allowing 1-day plans, because it treated the calendar week rather than
 * days-to-finish as the unit of meaning; the only hard rule now is that the
 * module day cannot BE the catch-up day (the client must finish the module
 * before the session, which works through it). (2) Step 1 books a Zoom-style
 * "from … to" time pair (`endTime`, new optional `SessionPlanRow` field) and
 * an explicit "First session on" date — the plan's start used to be silently
 * anchored to the nearest weekday occurrence with no way to say "start after
 * their respite week". (3) Step 2's tiles each carry the concrete date the
 * first module would arrive, with one tip line beneath stating days-to-finish
 * — information where the old rule was a wall. (4) The review step leads with
 * a one-sentence summary and renders each week's pair of topic cards
 * read-only, with a per-week "Modify" toggle revealing the editing inputs —
 * 18 always-open inputs invited exactly the per-row micro-editing the wizard
 * exists to remove. Copy says "client" throughout per the Round 30
 * audience-dependent terminology rule (this wizard only ever renders for the
 * coach — the researcher's Session Plan view is read-only).
 *
 * Step-topic colors (Round 15) — `--color-plan-module`/`--color-plan-catchup`
 * (see `design-tokens.md` §42), applied by *topic* (what a field is about),
 * not by who answers it: green for every "Module unlock day" field, amber
 * for every "Catch-up timing" field. `TOPIC_CARD_CLASS` is the one shared
 * class pair every topic-tinted card in this file uses (question cards,
 * review mini-cards) — Round 15's final audit found 3 separate, undocumented
 * opacity recipes doing the same job before this was unified.
 */

type StepKey = 'catchup-meeting' | 'module-unlock-day' | 'review'

const STEPS: { key: StepKey; navLabel: string; heading: string; subtitle: string }[] = [
  {
    key: 'catchup-meeting',
    navLabel: 'Catch-up meeting',
    heading: 'First, agree on your weekly catch-up',
    subtitle:
      'A weekly Zoom session where you and your client go through the module they have just finished. Weekly is the study plan. You choose the day, the first session date, and the time.',
  },
  {
    key: 'module-unlock-day',
    navLabel: 'Module unlock day',
    heading: 'Now, choose the module unlock day',
    subtitle:
      'Each week’s module unlocks in your client’s portal on this day, any day of the week. They need to finish it before the catch-up, so more days in between gives them more time.',
  },
  {
    key: 'review',
    navLabel: 'Review plan',
    heading: 'Review the plan, then confirm',
    subtitle:
      'Check each week below and modify anything that needs it. Nothing is saved until you confirm.',
  },
]

const STEP_COUNT = STEPS.length
const REVIEW_STEP = STEP_COUNT - 1

/** The welcome screen's right-column timeline preview (Round 15) — one row
 *  per real step, icon + name + one-line description, echoing `STEPS`'
 *  own `navLabel`s so the wording stays consistent once a coach reaches the
 *  real steps. `tone` drives the icon badge color, matching each step's own
 *  established topic color (green = Module unlock day, amber = Catch-up
 *  timing); Review plan has no topic color of its own, so it stays neutral.
 *  Names renamed (direct feedback: "Module availability"/"Session Catch-up"
 *  read as internal field names, not something a coach immediately
 *  understands) to name what the coach is actually deciding — a day, and a
 *  day+time — rather than the abstract concept behind it. */
const INTRO_STEPS: {
  icon: typeof CalendarDays
  name: string
  description: string
  tone: 'green' | 'amber' | 'purple'
}[] = [
  {
    icon: CalendarDays,
    name: 'Catch-up meeting',
    description: 'Choose your weekly catch-up date and time.',
    tone: 'amber',
  },
  {
    icon: BookOpen,
    name: 'Module unlock day',
    description: 'Choose the day each module opens for your client.',
    tone: 'green',
  },
  {
    icon: ListChecks,
    name: 'Review plan',
    description: 'Check the weekly dates, then confirm the plan.',
    tone: 'purple',
  },
]

/** Fake delay for both loading interstitials — long enough to read as real
 *  work happening, short enough not to feel like a stall. */
const LOADING_MS = 700

/** The question-step card and control chrome, transcribed from Figma
 *  `722:4222`. Questions sit on `purple-50` cards rather than Round 15's
 *  green/amber topic tints, and Step 2 was aligned onto the same treatment on
 *  direct instruction — so the topic-colour system now survives only in the
 *  review step's paired mini-cards (and `SessionTracker`, which imports
 *  `TOPIC_CARD_CLASS`), where green/amber still separate module from session. `STEP1_SHADOW` is the frame's own
 *  neutral shadow: Figma reports radius 16 and the MCP halves it to 8 when it
 *  writes `drop-shadow`, so 16px is the correct CSS blur (CLAUDE.md, Round 23).
 *  Controls are 36px minimum (`h-9`), which the frame's own ~33px loses to. */
/** A question card. The one the coach is *on* carries `purple-200` and drops
 *  back to `purple-50` once it has an answer, so the highlight walks down the
 *  step as they work (Round 38, direct instruction). It is a real progress
 *  cue rather than decoration, which matters for this audience: at any moment
 *  exactly one card says "you are here", and the last answer hands the
 *  emphasis to the dashed summary card below. */
const stepCard = (active: boolean) =>
  cn(
    'rounded-sm border border-parchment p-4 shadow-[2px_4px_16px_rgba(85,85,85,0.08)] transition-colors',
    active ? 'bg-purple-200' : 'bg-purple-50',
  )
/** 15 minutes, in seconds. `step` on a time input makes the browser's own
 *  picker list quarter-hour increments in a compact, anchored, scrollable
 *  popup — which a `<datalist>` could not do: it rendered all 96 options as
 *  one full-height list starting at midnight, floating over the page
 *  (reported as a bug). Manual typing still works; the field just holds the
 *  coach to quarter hours, the granularity sessions are booked at anyway. */
/** Space between the step's heading block and its first card. 32px, not the
 *  shared `STEP_CONTENT_GAP`'s 24px (direct instruction: "give some space
 *  between the text section and interaction section"). Local so the other
 *  three wizards keep their own spacing. Was 40px while the heading was
 *  `display-md`; trimmed when it dropped to 18px, since the block no longer
 *  needs as much air to separate from what follows. */
const PLAN_STEP_GAP = 'mt-8'

/** The app's shared table-header cell shape (`SpacesRosterPage`'s `TH`),
 *  repeated here rather than imported because that constant is private to a
 *  page module; the values are the app's, not new ones. */
const STEP_QUESTION = 'text-caption-medium text-ink'

/** The dashed read-back card that closes each step. Deliberately **no
 *  shadow** (direct instruction): the question cards above it are lifted off
 *  the page, and a summary is a resting statement rather than another surface
 *  competing for depth — the dashed `primary` outline is the whole signal. */
const SUMMARY_CARD =
  'flex flex-col gap-4 rounded-sm border border-dashed border-primary bg-card p-4'
/* `TOPIC_CARD_CLASS` was removed in Round 39. It paired a green/amber tint per
   topic for the review step's mini-cards and for `EditSessionPlanModal`'s
   week-wise timeline; the review step is a plain table now and that timeline is
   gone, so it had no readers left in this file or anywhere else. */

function LoadingPane({
  label,
  headingRef,
}: {
  label: string
  headingRef: React.RefObject<HTMLParagraphElement | null>
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
      <Loader2 aria-hidden="true" className="size-8 animate-spin text-primary" />
      <p ref={headingRef} tabIndex={-1} className="text-caption font-semibold text-ink-faint outline-none">
        {label}
      </p>
    </div>
  )
}

/** A row of 5 clickable weekday tiles (Mon-Fri only, Round 15 — weekends
 *  removed, since module unlocks/catch-ups only ever happen on working
 *  days) — a calendar-style alternative to a plain `<select>` (Round 14.4,
 *  direct request: "instead of drop down, show all days of the week in a
 *  calendar format"). `disabledValues` greys out days that don't make sense
 *  to pick given a related earlier answer (used for the catch-up question
 *  only). Selected tiles use the green "day" accent (Round 15) and a subtle
 *  shadow to lift them off the page.
 *
 *  A single-select toggle-button group (`role="group"` + `aria-pressed`),
 *  not a native radio group — Round 14.5 accessibility fix: the first build
 *  used `role="radiogroup"`/`"radio"` with every tile independently
 *  `tabIndex=0`, which claims real radio semantics without the roving-
 *  tabindex + arrow-key navigation the ARIA radio pattern requires. A
 *  same-select toggle-button group carries no such requirement and is a
 *  standard, simpler-to-get-right pattern for exactly this shape (5
 *  independently-focusable, mutually-exclusive buttons). Disabled tiles keep
 *  `aria-disabled` (not native `disabled`) so they stay in the tab order and
 *  a screen reader still hears why — this app's established "visible but
 *  inert" convention (§21/§27) — with the reason repeated in `aria-label`.
 *
 *  Blocked days: Round 15 marked these with a full-tile diagonal cross;
 *  Round 38 removed it on direct instruction — the only disabled tile left
 *  is the Learning day step's own catch-up day, which carries a visible
 *  "Catch-up day" caption, so the muted fill plus the caption say why
 *  without a mark that reads as an error state.
 *
 *  `tone` (Round 15 recolor) drives the selected/hover accent — `green`
 *  (`plan-module`) for the Module unlock day question, `amber`
 *  (`plan-catchup`) for the Catch-up timing question — so the whole step a
 *  tile belongs to reads as one consistent color, not a fixed per-field
 *  code. Selected tiles pair their bright fill with dark `text-ink`, not
 *  white — both accent tokens are too light for white text to clear AA. */
function WeekdayPicker({
  value,
  onChange,
  idPrefix,
  groupLabel,
  tone,
  captions,
  options = DAY_OF_WEEK_OPTIONS,
}: {
  value: number | null
  onChange: (value: number) => void
  idPrefix: string
  groupLabel: string
  /** `purple` is the Figma `722:4222` treatment used by Step 1: a taller
   *  white tile with a `purple-300` outline that fills `primary` when chosen.
   *  `green`/`amber` remain the Round 15 topic colours for the other steps. */
  tone: 'green' | 'amber' | 'purple'
  /** Optional one-line caption under each tile's day name (Round 38 — the
   *  Learning day step shows the concrete date the first module would
   *  arrive, so the choice is a real date rather than an abstract weekday).
   *  Kept `aria-hidden`; the same fact is folded into the button's own
   *  `aria-label` so a screen reader hears one coherent name. */
  captions?: Partial<Record<number, string>>
  /** Which days to offer. Defaults to working days; the module unlock day
   *  passes all seven (Round 38) since the client does that on their own time
   *  and a carer's free time is often the weekend. */
  options?: typeof DAY_OF_WEEK_OPTIONS
}) {
  // Tailwind's build-time scanner needs every class name as a literal
  // string — a template-interpolated `border-${accent}` is invisible to it
  // and would silently generate no CSS, so each tone spells its own full
  // class list out rather than building one from a shared `accent` variable.
  const selectedClass =
    tone === 'green'
      ? 'border-plan-module bg-plan-module text-ink'
      : tone === 'purple'
        ? 'border-primary bg-primary text-white'
        : 'border-plan-catchup bg-plan-catchup text-ink'
  const hoverClass =
    tone === 'green'
      ? 'hover:border-plan-module/60'
      : tone === 'purple'
        ? 'hover:border-primary'
        : 'hover:border-plan-catchup/60'
  // The frame's resting tile is white with a `purple-300` outline; the other
  // two tones keep Round 15's hairline border. Height and label size are
  // deliberately BELOW the frame's own 108.8px/22px (direct feedback: "the
  // days font + button height too big") — the frame draws these tiles as the
  // step's hero, but at real size they dwarfed the two questions beneath them.
  const restingClass =
    tone === 'purple'
      ? cn('border-purple-300 bg-card text-ink active:scale-[0.97]', hoverClass)
      : cn('border-hairline bg-card text-ink active:scale-[0.97]', hoverClass)
  const tileSizeClass = tone === 'purple' ? 'h-[68px] rounded-xs' : 'h-24 rounded-sm'
  const labelClass = tone === 'purple' ? 'text-body-md' : ''
  return (
    <div
      role="group"
      aria-label={groupLabel}
      // Columns follow the option count so the row always fills its card —
      // a fixed `grid-cols-7` left an empty seventh column whenever the
      // catch-up day was excluded, which reads as a missing tile.
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className={cn('grid', tone === 'purple' ? 'gap-3' : 'gap-2')}
    >
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            // Not read by any `htmlFor`/test selector anywhere in this
            // codebase today (confirmed by grep) — kept as a future
            // test-selector hook (e.g. `plan-module-day-1`) rather than
            // dropped, since it costs nothing to keep and documents each
            // tile's identity explicitly.
            id={`${idPrefix}-${o.value}`}
            aria-pressed={selected}
            aria-label={captions?.[o.value] ? `${o.label}, ${captions[o.value]}` : o.label}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 overflow-hidden border text-caption-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring',
              tileSizeClass,
              selected ? selectedClass : restingClass,
            )}
          >
            <span
              aria-hidden="true"
              className={labelClass}
            >
              {o.short}
            </span>
            {captions?.[o.value] && (
              <span aria-hidden="true" className={cn('text-fine', !selected && 'text-ink-faint')}>
                {captions[o.value]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function PlanSessionsModal({
  open,
  onClose,
  dyad,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  dyad: ConsumerDyad
  onSaved?: () => void
}) {
  const { sessionCompletion, bulkSetSessionPlan, toggleSession } = useResearch()
  const completed = sessionCompletion[dyad.id] ?? []
  // "You, Arthur Ngata and Tania Ngata" for a full dyad; "You and Tania Ngata"
  // for a carer-only one. Built as the whole phrase rather than just the names
  // because the conjunction differs: a names-only string reads "You, Tania
  // Ngata will meet" the moment there is no PLE.
  const meetingParty = dyad.patient
    ? `You, ${dyad.patient.name} and ${dyad.carer.name}`
    : `You and ${dyad.carer.name}`

  const [step, setStep] = useState(0)
  // `null` until the coach actively picks a day — Round 14.6: no day comes
  // pre-selected, so "Next"/"Build my plan" only enable once a real choice
  // has been made (previously defaulted to Monday/Friday, letting a coach
  // advance without ever having chosen anything).
  const [catchupWeekday, setCatchupWeekday] = useState<number | null>(null)
  const [catchupTime, setCatchupTime] = useState('10:00')
  // Zoom-style "from … to" pair (Round 38) — booking a session without a
  // stated length was only half a question for a client slotting it between
  // care tasks.
  const [catchupEndTime, setCatchupEndTime] = useState('10:45')
  // Index into the next 5 occurrences of the chosen meeting weekday —
  // "First session on" (Round 38). Defaults to the nearest occurrence, which
  // is visible in the control rather than silently assumed.
  // The chosen first session as an ISO date. `undefined` until a catch-up day
  // is picked, at which point it defaults to the first valid occurrence.
  const [firstSessionIso, setFirstSessionIso] = useState<string | undefined>(undefined)
  // The date and time controls both open with a usable default, so "answered"
  // cannot be read off their values — these record that the coach has
  // actually been through them, which is what walks the `purple-200`
  // highlight from one question to the next.
  const [firstSessionTouched, setFirstSessionTouched] = useState(false)
  const [timeTouched, setTimeTouched] = useState(false)
  const [moduleWeekday, setModuleWeekday] = useState<number | null>(null)
  const [rows, setRows] = useState<SessionPlanRow[]>([])
  /* Bumped to force `SessionPlannerTable` to remount, which is how its own
     per-week "Modify" drawer state gets cleared now that the state lives there
     rather than here. Two places need it: reopening the wizard, and
     regenerating the plan from new answers — in both cases a drawer left open
     against the previous set of rows would be stale. */
  const [plannerGeneration, setPlannerGeneration] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  // A one-time welcome screen ahead of the 3 real steps.
  const [showIntro, setShowIntro] = useState(true)
  // Announces the stale-learning-day auto-clear below to screen-reader users
  // (Round 15 final-audit fix, direction flipped in Round 38) — cleared again
  // the moment the coach picks a new day.
  const [moduleDayClearedNotice, setModuleDayClearedNotice] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const timeErrorId = useId()
  const generateTimeoutRef = useRef<number | undefined>(undefined)
  const saveTimeoutRef = useRef<number | undefined>(undefined)
  // Round 15 final-audit critical fix: `showIntro` turning false, `step`
  // decrementing to 0, and `busy` flipping either direction all unmount
  // whatever control the coach just clicked, dropping keyboard focus to
  // `<body>` with the dialog still open on top of it (live-verified 3 ways).
  // Each heading below is `tabIndex={-1}` so it can receive that redirected
  // focus without becoming a stop in normal Tab order — see the 3 effects
  // right after `busy` for exactly when each one fires. Matches this app's
  // own established pattern (`SessionTracker`'s `rowHeadingRefs`,
  // `PasswordChangeCard`, `ReflectionCard`, `SlideLayout`).
  const introHeadingRef = useRef<HTMLHeadingElement>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const loadingHeadingRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus({ preventScroll: true })
      setGenerating(false)
      setSaving(false)
      setShowIntro(true)
      setModuleDayClearedNotice(false)
      setRows([])
      setPlannerGeneration((g) => g + 1)
      setModuleWeekday(null)
      setCatchupWeekday(null)
      setCatchupTime('10:00')
      setCatchupEndTime('10:45')
      setFirstSessionIso(undefined)
      setFirstSessionTouched(false)
      setTimeTouched(false)
      setStep(0)
    } else if (triggerRef.current) {
      triggerRef.current.focus({ preventScroll: true })
      triggerRef.current = null
    }
    // reset/seed logic only depends on the dialog opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(
    () => () => {
      window.clearTimeout(generateTimeoutRef.current)
      window.clearTimeout(saveTimeoutRef.current)
    },
    [],
  )

  const busy = generating || saving

  // Round 15 final-audit critical fix, part 1 of 2 (part 2 is the 3 focus
  // effects right below): redirect focus onto a real heading whenever a
  // transition unmounts the control that was previously focused.
  useEffect(() => {
    if (busy) requestAnimationFrame(() => loadingHeadingRef.current?.focus())
  }, [busy])

  useEffect(() => {
    if (open && showIntro && !busy) requestAnimationFrame(() => introHeadingRef.current?.focus())
  }, [open, showIntro, busy])

  useEffect(() => {
    if (open && !busy && !showIntro) requestAnimationFrame(() => stepHeadingRef.current?.focus())
  }, [open, busy, showIntro, step])

  // Round 15 final-audit critical fix, part 2 of 2: this guard used to
  // return before EVER reaching the Tab-handling logic below whenever
  // `busy` was true, so the dialog's own focus trap was fully OFF for the
  // entire duration a coach is most likely to be waiting and pressing keys
  // — live-verified landing a real Tab press on the page's "Skip to main
  // content" link while the modal stayed open on top of it. Escape still
  // stays suppressed while busy (closing mid-save/generate would be
  // confusing); Tab must keep trapping.
  const trapKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (busy) return
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([aria-disabled="true"]), a[href], select:not([disabled]), input:not([disabled])',
      ),
    ]
    // While busy, the whole footer (every real button) is unmounted, so
    // there's nothing to cycle between — pin focus on whatever is currently
    // focused (the loading pane's own heading) instead of letting Tab fall
    // through to the page behind the dialog.
    if (focusables.length === 0) {
      e.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // The session must end after it starts — HH:MM strings compare correctly
  // as plain strings within one day.
  const timeInvalid = catchupEndTime <= catchupTime

  // The next 5 occurrences of the chosen meeting weekday, strictly after
  // today — Session 0 (the planning meeting producing this plan) is today,
  // so the first real catch-up can never also be today.
  // The earliest first session that works for EVERY unlock day. The longest
  // runway on offer is 6 days (the day after the catch-up), so a first session
  // at least a week out guarantees module 1 can open strictly after today for
  // any choice the coach makes in step 2. Enforcing it here — at the point of
  // choice — is what keeps the two steps consistent: step 1 never promises a
  // start date that step 2 has to move, and step 2 never has to grey out days
  // that are perfectly good patterns.
  const EARLIEST_FIRST_SESSION = addDays(PLAN_ANCHOR, WEEKLY_CADENCE_DAYS)
  const defaultFirstSession =
    catchupWeekday === null ? undefined : nextWeekday(EARLIEST_FIRST_SESSION, catchupWeekday)
  const firstSessionDate = firstSessionIso ?? defaultFirstSession
  // The last of the weekly catch-ups, so the summary can answer "until when?"
  // (direct instruction). Derived from `SPACES_CATCHUP_COUNT` rather than a
  // literal 6 — that constant is itself derived from `SPACES_SESSIONS`, so a
  // change to the arc's length cannot leave this sentence stale.
  const lastSessionDate = firstSessionDate
    ? addDays(firstSessionDate, (SPACES_CATCHUP_COUNT - 1) * WEEKLY_CADENCE_DAYS)
    : undefined

  // Days between a candidate module day and the meeting day, wrapping the
  // week — a Friday module ahead of a Thursday catch-up is 6 days, not an
  // invalid same-week ordering. Never 0 in practice: the meeting day itself
  // is the one disabled tile.
  const runwayFor = (day: number) =>
    catchupWeekday === null ? 0 : (catchupWeekday - day + 7) % 7 || 7
  // THE RULE (Round 38, direct instruction): the client has to be able to
  // finish the module before the first catch-up, so a module day is only
  // offered when module 1 can actually land on its own natural date. If that
  // date is already in the past — "we agreed today that we meet Mondays, so
  // we cannot meet tomorrow" — the plan would have to shorten week 1, which
  // is exactly the promise it must not break. Those days are blocked with
  // the reason on the tile instead of being silently clamped.
  // Correction (direct feedback): an unlock day is a *recurring pattern*, and
  // for a Thursday catch-up every one of Fri/Sat/Sun (previous week) and
  // Mon/Tue/Wed (same week) is a legitimate pattern. Blocking them because
  // week 1 alone could not be delivered removed six valid answers to fix one
  // week. The rule now constrains the START instead: if module 1 could not
  // open in time, the whole plan begins a week later, which is stated rather
  // than done quietly. Only the catch-up day itself is ever unpickable.
  /** The unlock days, ordered *from* the catch-up day: for a Thursday
   *  catch-up this reads Fri, Sat, Sun, Mon, Tue, Wed — the day after the
   *  meeting through to the day before the next one. That is the coach's own
   *  description of the real option set, and ordering it this way removes the
   *  thing they found confusing: a bare Mon-Sun strip forces you to work out
   *  which days fall in the previous week and which in the same week. Here
   *  the sequence simply runs forward and the runway falls from most to
   *  least. The catch-up day is not in the list at all — it is not an option,
   *  so it should not occupy a tile. */
  const moduleDayOptions =
    catchupWeekday === null
      ? []
      : Array.from({ length: 6 }, (_, i) => {
          const value = (catchupWeekday + 1 + i) % 7
          return DAY_OF_WEEK_OPTIONS_ALL.find((o) => o.value === value)!
        })



  // Only the catch-up day is captioned. The per-tile "Available <date>" line
  // was removed on direct instruction, and it was the right call: it showed
  // *module 1's* date, so whenever the first session was only days away
  // several days collapsed to an identical "Available today" and the tile
  // then disagreed with the summary's runway figure — both true, but about
  // different weeks. The recurring fact (days to finish) now lives in the
  // step summary, where it belongs, and the tiles are just days.
  // Only the catch-up day is captioned. A too-soon day is struck through
  // instead of labelled (direct instruction) — the strike says "not available"
  // without adding a second column of text to a row of seven tiles. The reason
  // is still carried in the tile's `aria-label`, so nothing is lost to a
  // screen reader.
  // A struck name alone was reported as too quiet to read as "you cannot pick
  // this" (direct feedback), so an unavailable day now says so in words as
  // well: struck name + "Not available" + a dashed, muted tile. Three signals
  // rather than one, and none of them colour-only.
  // Each tile states what the coach is actually choosing between: how long
  // the client gets. No dates on the tile — those depend on week 1 and were
  // the source of the "Available today" collision this replaced.
  const moduleDayCaptions: Partial<Record<number, string>> = Object.fromEntries(
    moduleDayOptions.map((o) => {
      const r = runwayFor(o.value)
      return [o.value, `${r} ${r === 1 ? 'day' : 'days'}`]
    }),
  )
  const dayLabel = (day: number | null) => DAY_OF_WEEK_OPTIONS_ALL.find((o) => o.value === day)?.label
  const bestModuleDay = (moduleDayOptions.length ? moduleDayOptions : DAY_OF_WEEK_OPTIONS_ALL).reduce(
    (a, b) => (runwayFor(b.value) > runwayFor(a.value) ? b : a),
  )

  // Edge case (Round 15, direction flipped in Round 38): a coach can go
  // "Back" to step 0 and move the meeting onto the day already picked for
  // modules on step 1. Clear it rather than leave the meeting day silently
  // selected underneath its own "Catch-up day" mark.
  useEffect(() => {
    if (moduleWeekday !== null && moduleWeekday === catchupWeekday) {
      setModuleWeekday(null)
      setModuleDayClearedNotice(true)
    }
  }, [catchupWeekday, moduleWeekday])

  const runGenerate = () => {
    if (moduleWeekday === null || catchupWeekday === null || !firstSessionDate) return
    setGenerating(true)
    generateTimeoutRef.current = window.setTimeout(() => {
      // Round 15 final-audit fix, still load-bearing: Session 0 anchors to
      // the wizard's own anchor date, never a persisted one — regenerating must not
      // re-anchor to a historical plan. The first catch-up is the coach's
      // own explicit choice (Round 38), no longer inferred from today.
      setRows(
        generatePlanRows(
          PLAN_ANCHOR,
          firstSessionDate,
          moduleWeekday,
          catchupTime,
          catchupEndTime,
        ),
      )
      setPlannerGeneration((g) => g + 1)
      setStep(REVIEW_STEP)
      setGenerating(false)
    }, LOADING_MS)
  }

  const goNext = () => {
    if (step === 0) {
      if (catchupWeekday === null || timeInvalid) return
      setStep(1)
      return
    }
    if (step === 1) {
      if (moduleWeekday === null) return
      // Regenerating the review table from these answers overwrites
      // whatever is currently in it — harmless here since nothing real
      // exists yet (this component only ever runs before a plan exists;
      // amending an already-active plan is `EditSessionPlanModal`'s job).
      runGenerate()
    }
  }

  // Round 15 final-audit fix: one generic setter replaces 3 near-identical
  // map-and-replace copies (`patchRowTime` predates the other two — the
  // latter were added later in the same round when per-row date editing was
  // reintroduced, duplicating the same shape instead of generalizing it).
  const patchRow = (session: number, patch: Partial<SessionPlanRow>) => {
    setRows((prev) => prev.map((r) => (r.session === session ? { ...r, ...patch } : r)))
  }

  /** Every problem with one week, in the order a coach would notice them.
   *
   *  The review step is where a plan can be broken by hand, so validation has
   *  to cover more than "is it filled in" (Round 38, direct instruction to
   *  factor in edge cases). Each rule below has a real failure behind it:
   *  a module landing on or after its own session means the client is asked
   *  to discuss work they have not been given; a session on or after the NEXT
   *  module means the week it unlocks has already passed; two sessions on one
   *  date is a double-booking; out-of-order dates make "Week 3" a lie. Errors
   *  render in the row's own drawer, so the coach is told where the problem is
   *  rather than only that one exists.
   */
  const rowIssues = (sessionNumber: number): string[] => {
    const row = rows.find((r) => r.session === sessionNumber)
    if (!row) return []
    const week = displaySessionNumber(sessionNumber)
    const prev = rows.find((r) => r.session === sessionNumber - 1)
    const next = rows.find((r) => r.session === sessionNumber + 1)
    const issues: string[] = []

    if (!row.moduleTargetDate || !row.date || !row.time) {
      issues.push(`Week ${week} is missing a date or time.`)
      return issues
    }
    if (row.endTime && row.endTime <= row.time) {
      issues.push(`Session ${week} needs to end after it starts.`)
    }
    if (row.moduleTargetDate >= row.date) {
      issues.push(
        `Module ${week} must be available before the Session ${week} catch-up, so your client can finish it first.`,
      )
    }
    if (next?.moduleTargetDate && row.date >= next.moduleTargetDate) {
      issues.push(`Session ${week} must happen before Module ${week + 1} becomes available.`)
    }
    if (prev?.date && row.date <= prev.date) {
      issues.push(`Session ${week} must come after Session ${week - 1}.`)
    }
    // Two sessions on one day is a double-booking; a session sharing a day
    // with another week's module is the ordering rules above failing in a way
    // worth naming plainly.
    const clash = rows.find((r) => r.session !== sessionNumber && r.date && r.date === row.date)
    if (clash) {
      issues.push(`Session ${week} is on the same day as Session ${displaySessionNumber(clash.session)}.`)
    }
    const moduleClash = rows.find(
      (r) => r.session !== sessionNumber && r.moduleTargetDate && r.moduleTargetDate === row.moduleTargetDate,
    )
    if (moduleClash) {
      issues.push(
        `Module ${week} is available on the same day as Module ${displaySessionNumber(moduleClash.session)}.`,
      )
    }
    return issues
  }

  const rowsIncomplete =
    rows.length === 0 ||
    SPACES_SESSIONS.filter((s) => s.number >= 2).some((s) => rowIssues(s.number).length > 0)


  const handleSubmit = () => {
    if (rowsIncomplete || saving) return
    setSaving(true)
    saveTimeoutRef.current = window.setTimeout(() => {
      bulkSetSessionPlan(dyad.id, rows)
      // Session 0 (Planning) is the meeting that produces this very plan —
      // by the time a coach finishes this wizard, that meeting has already
      // happened. `SessionTracker`'s timeline no longer shows Session 0 as
      // its own row, so mark it complete here rather than leaving no way to
      // do so at all. Only fires if it isn't already complete — safe, since
      // no UI path lets Session 1 be completed before a plan exists.
      if (!completed.some((c) => c.session === 1)) {
        toggleSession(dyad.id, 1)
      }
      setSaving(false)
      onClose()
      onSaved?.()
    }, LOADING_MS)
  }

  return (
    <AnimatePresence>
      {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/25"
              onClick={busy ? undefined : onClose}
              aria-hidden="true"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                ref={panelRef}
                tabIndex={-1}
                onKeyDown={trapKeys}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                role="dialog"
                aria-modal="true"
                aria-label="Plan sessions"
                /* 1120px, not the 920px shared by the other 3 wizards (Round 38,
                   direct feedback: "too narrow, making all details crunched").
                   This wizard carries the widest step content in the app — a
                   5-tile day picker with captions, a From/to time pair, and a
                   review timeline of paired topic cards — where the others show
                   plain stacked fields. `w-full` still caps it on smaller
                   screens, and the modal's own `p-6` inset keeps it clear of the
                   viewport edge. */
                className="pointer-events-auto flex h-[85vh] max-h-[820px] w-full max-w-[888px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline md:p-8"
              >
                {/* Round 15 final-audit fix: a persisted, always-mounted live
                    region for the loading interstitial's own label — the
                    visible `LoadingPane` remounts fresh every time `busy`
                    flips true, and several screen-reader/browser
                    combinations announce a live region unreliably on first
                    paint if it's a brand-new node rather than an existing
                    one whose text just changed. */}
                <p aria-live="polite" role="status" className="sr-only">
                  {busy ? (generating ? 'Building your session plan…' : 'Creating your session plan…') : ''}
                </p>
                {/* Round 15 final-audit fix: announces the stale-catch-up-day
                    auto-clear effect above — going Back and changing the
                    module day used to silently reset an already-picked
                    catch-up day with no notice to screen-reader users. */}
                <p aria-live="polite" role="status" className="sr-only">
                  {moduleDayClearedNotice
                    ? 'Your previous learning day was cleared because it is now your catch-up day.'
                    : ''}
                </p>


                {busy ? (
                  <div className="flex flex-1 items-center justify-center">
                    <LoadingPane
                      headingRef={loadingHeadingRef}
                      label={generating ? 'Building your session plan…' : 'Creating your session plan…'}
                    />
                  </div>
                ) : showIntro ? (
                  /* Spacing and type transcribed from Figma `719:1806`
                     (reference for those only — copy, icons and the project's
                     own tone colours are kept). Frame values: body `pt-72`,
                     56px between the header group and the step flow, 8px
                     inside the header; step columns 180px wide, 72px apart,
                     16px under the 56px icon circle, then 16px to the step
                     name and 8px to its description. */
                  <div className="flex flex-1 flex-col items-center overflow-y-auto px-16 pt-[72px] pb-10 text-center">
                    <div className="flex w-full flex-col items-center gap-14">
                      <div className="flex w-full flex-col items-center gap-2">
                        <h2
                          ref={introHeadingRef}
                          tabIndex={-1}
                          className="text-balance text-display-md font-display text-ink outline-none"
                        >
                          Welcome! Let's plan your client's sessions
                        </h2>
                        <p className="max-w-[640px] text-body text-ink-muted">
                          Set this up together with your client. You'll choose a weekly
                          catch-up and when each module opens, then review the plan. Zoom
                          sessions are automatically created for you.
                        </p>
                      </div>
                      <div className="relative isolate">
                        {/* The frame's connector, running between the first and
                            last circle centres: columns are 180px with a 72px
                            gap, so half a column (90px) inset lands it exactly
                            on the centres, and `top-7` is half the 56px circle.
                            It sits behind the circles via `-z-10` (direct
                            instruction) and is 2px, not a hairline, which was
                            reported as too thin to read at this size. */}
                        <span
                          aria-hidden="true"
                          className="absolute top-[27px] right-[90px] left-[90px] z-0 h-0.5 bg-hairline"
                        />
                      <ol className="flex w-full items-start justify-center gap-[72px]">
                        {INTRO_STEPS.map((s, i) => {
                          const Icon = s.icon
                          // Opaque fills, not `/25`-`/30` washes: the connector runs
                          // behind these circles and was showing straight through a
                          // translucent one. `plan-module`/`plan-catchup` have no pale
                          // solid of their own, so these are light steps at the same
                          // hue; `purple-50` was already opaque.
                          const badgeClass =
                            s.tone === 'green'
                              ? 'bg-[#e2f5ec] text-green-700'
                              : s.tone === 'amber'
                                ? 'bg-yellow-100 text-amber-700'
                                : 'bg-purple-50 text-primary'
                          return (
                            <li key={s.name} className="flex w-[180px] flex-col items-center gap-4">
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full',
                                  badgeClass,
                                )}
                              >
                                <Icon className="size-6" />
                              </span>
                              <div className="flex w-full flex-col items-center gap-4">
                                <p className="text-caption-medium text-ink-faint">Step {i + 1}</p>
                                <div className="flex w-full flex-col gap-2">
                                  <p className="text-body-md text-ink">{s.name}</p>
                                  <p className="text-caption text-ink-muted">{s.description}</p>
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                      </div>
                    </div>
                  </div>
                ) : (
                /* Rail column is the frame's own 173px `purple-50` panel and the
                   gap to the content column its ~35px (`md:gap-8`, 32px). The
                   shared `WizardProgressRail` is no longer used here; the other
                   3 wizards keep it untouched. Deliberately a plain block
                   comment rather than a brace-wrapped JSX comment: this sits in
                   a ternary expression position, where a JSX comment is a syntax
                   error Vite's oxc parser rejects even when `tsc` does not
                   (CLAUDE.md, Round 23). */
                <div className="mt-2 flex min-h-0 flex-1 flex-col">
                  <div className="flex min-h-0 flex-col overflow-y-auto pr-1">
                        <WizardStepHeading
                          step={step}
                          stepCount={STEP_COUNT}
                          heading={STEPS[step].heading}
                          subtitle={STEPS[step].subtitle}
                          headingRef={stepHeadingRef}
                          headingClassName="text-sub-greeting-semibold"
                        />

                        {step === 0 && (
                          <div className={cn(PLAN_STEP_GAP, 'flex flex-col gap-6')}>
                            <div className={cn(stepCard(catchupWeekday === null), 'flex flex-col gap-4')}>
                              <p className={STEP_QUESTION}>1. Which day will you meet?</p>
                              <WeekdayPicker
                                value={catchupWeekday}
                                onChange={(v) => {
                                  setCatchupWeekday(v)
                                  // A stored date belongs to the old weekday, so it cannot
                                  // survive the change — clearing it lets the default for
                                  // the new day take over.
                                  setFirstSessionIso(undefined)
                                }}
                                idPrefix="plan-catchup-day"
                                groupLabel="Which day will you meet?"
                                tone="purple"
                              />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                              <div
                                className={cn(
                                  stepCard(catchupWeekday !== null && !firstSessionTouched),
                                  'flex flex-col gap-4',
                                )}
                              >
                                <label htmlFor="plan-first-session" className={STEP_QUESTION}>
                                  2. When should the first session be?
                                </label>
                                <SessionDateCalendar
                                  id="plan-first-session"
                                  value={firstSessionDate}
                                  onChange={(iso) => {
                                    setFirstSessionIso(iso)
                                    setFirstSessionTouched(true)
                                  }}
                                  weekday={catchupWeekday}
                                  minDate={EARLIEST_FIRST_SESSION}
                                  disabled={catchupWeekday === null}
                                />
                              </div>

                              <div
                                className={cn(
                                  stepCard(
                                    catchupWeekday !== null && firstSessionTouched && !timeTouched,
                                  ),
                                  'flex flex-col gap-4',
                                )}
                              >
                                <p className={STEP_QUESTION}>3. At what time?</p>
                                <div className="flex items-center gap-2">
                                  <label htmlFor="plan-catchup-time" className="sr-only">
                                    Session start time
                                  </label>
                                  <div className="relative flex-1">
                                    <input
                                      id="plan-catchup-time"
                                      type="time"
                                      step={TIME_STEP_SECONDS}
                                      value={catchupTime}
                                      onChange={(e) => {
                                        setCatchupTime(e.target.value)
                                        setTimeTouched(true)
                                      }}
                                      disabled={catchupWeekday === null}
                                      aria-invalid={timeInvalid || undefined}
                                      aria-describedby={timeInvalid ? timeErrorId : undefined}
                                      className={STEP_TIME_CONTROL}
                                    />
                                    <ChevronDown
                                      aria-hidden="true"
                                      className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink"
                                    />
                                  </div>
                                  <span className="shrink-0 text-caption-medium text-ink-muted">to</span>
                                  <label htmlFor="plan-catchup-end-time" className="sr-only">
                                    Session end time
                                  </label>
                                  <div className="relative flex-1">
                                    <input
                                      id="plan-catchup-end-time"
                                      type="time"
                                      step={TIME_STEP_SECONDS}
                                      value={catchupEndTime}
                                      onChange={(e) => {
                                        setCatchupEndTime(e.target.value)
                                        setTimeTouched(true)
                                      }}
                                      disabled={catchupWeekday === null}
                                      aria-invalid={timeInvalid || undefined}
                                      aria-describedby={timeInvalid ? timeErrorId : undefined}
                                      className={STEP_TIME_CONTROL}
                                    />
                                    <ChevronDown
                                      aria-hidden="true"
                                      className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {timeInvalid && catchupWeekday !== null && (
                              <div
                                role="alert"
                                id={timeErrorId}
                                className="flex items-start gap-2 rounded-sm border border-destructive bg-destructive/10 px-4 py-3"
                              >
                                <AlertTriangle
                                  aria-hidden="true"
                                  className="mt-0.5 size-4 shrink-0 text-destructive"
                                />
                                <p className="text-caption text-ink">
                                  <span className="font-semibold">Check the session time.</span> The session needs
                                  to end after it starts.
                                </p>
                              </div>
                            )}

                            {/* The frame's dashed Summary card. It reads back the whole
                                answer in one sentence, so it holds the confirmation copy
                                that used to trail the time card. */}
                            <div className={cn(SUMMARY_CARD, 'mt-4')}>
                              <p className={STEP_QUESTION}>Step 1 summary</p>
                              {catchupWeekday !== null && !timeInvalid && firstSessionDate ? (
                                <p className="text-body text-ink-muted">
                                  {meetingParty} will meet every{' '}
                                  <span className="font-semibold text-primary">{dayLabel(catchupWeekday)}</span>,{' '}
                                  <span className="font-semibold text-primary">
                                    {formatTime(catchupTime)} to {formatTime(catchupEndTime)}
                                  </span>
                                  , from{' '}
                                  <span className="font-semibold text-primary">{formatDate(firstSessionDate)}</span>{' '}
                                  until{' '}
                                  <span className="font-semibold text-primary">{formatDate(lastSessionDate!)}</span>.
                                  Weekly, for {SPACES_CATCHUP_COUNT} sessions.
                                </p>
                              ) : (
                                <p className="text-body text-ink-faint">
                                  Choose a day, a first session date and a time to see the plan summary here.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {step === 1 && (
                          <div className={cn(PLAN_STEP_GAP, 'flex flex-col gap-6')}>
                            {/* Step 1's answers, carried forward (direct instruction).
                                The unlock day is chosen *against* the catch-up, so the
                                coach should not have to go Back to remember what it is.
                                Deliberately a quiet reference strip, not another card:
                                it is settled information, not a question. */}
                            {catchupWeekday !== null && firstSessionDate && (
                              <div className="rounded-sm bg-parchment px-4 py-3">
                                <p className="text-caption text-ink-muted">
                                  Your catch-up: every{' '}
                                  <span className="font-semibold text-primary">{dayLabel(catchupWeekday)}</span>,{' '}
                                  <span className="font-semibold text-primary">
                                    {formatTime(catchupTime)} to {formatTime(catchupEndTime)}
                                  </span>
                                  , from{' '}
                                  <span className="font-semibold text-primary">{formatDate(firstSessionDate)}</span>.
                                </p>
                              </div>
                            )}
                            <div className={cn(stepCard(moduleWeekday === null), 'flex flex-col gap-4')}>
                              <p className={STEP_QUESTION}>1. Which day should each module unlock?</p>
                              <WeekdayPicker
                                value={moduleWeekday}
                                onChange={(v) => {
                                  setModuleWeekday(v)
                                  setModuleDayClearedNotice(false)
                                }}
                                captions={moduleDayCaptions}
                                idPrefix="plan-module-day"
                                groupLabel="Which day should each module unlock?"
                                tone="purple"
                                options={moduleDayOptions}
                              />
                            </div>

                            <div className={cn(SUMMARY_CARD, 'mt-4')}>
                              <p className={STEP_QUESTION}>Step 2 summary</p>
                              <p className="text-body text-ink-muted">
                                {moduleWeekday === null ? (
                                  <>
                                    Most time: {bestModuleDay.label}, with{' '}
                                    <span className="font-semibold text-primary">
                                      {runwayFor(bestModuleDay.value)}{' '}
                                      {runwayFor(bestModuleDay.value) === 1 ? 'day' : 'days'}
                                    </span>{' '}
                                    to finish each module before the catch-up.
                                  </>
                                ) : runwayFor(moduleWeekday) === 1 ? (
                                  <>
                                    Each module is available on a{' '}
                                    <span className="font-semibold text-primary">
                                      {dayLabel(moduleWeekday)}
                                    </span>
                                    , giving them only{' '}
                                    <span className="font-semibold text-primary">1 day</span> to finish it before
                                    you meet, which is very tight.
                                  </>
                                ) : (
                                  <>
                                    Each module is available on a{' '}
                                    <span className="font-semibold text-primary">
                                      {dayLabel(moduleWeekday)}
                                    </span>
                                    , giving them{' '}
                                    <span className="font-semibold text-primary">
                                      {runwayFor(moduleWeekday)}{' '}
                                      {runwayFor(moduleWeekday) === 1 ? 'day' : 'days'}
                                    </span>{' '}
                                    to finish it before you meet.
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {step === REVIEW_STEP && (
                          /* Tighter than the question steps' `PLAN_STEP_GAP`
                             (direct instruction). There, the next thing is a
                             card the coach has to act in; here it is the plan
                             summary, which reads as the completion of the
                             heading's own sentence. */
                          <div className="mt-4">
                            <div className={SUMMARY_CARD}>
                              <p className={STEP_QUESTION}>Plan summary</p>
                              <p className="text-body text-ink-muted">
                                A new module is available each{' '}
                                <span className="font-semibold text-primary">{dayLabel(moduleWeekday)}</span>, and
                                you meet every{' '}
                                <span className="font-semibold text-primary">{dayLabel(catchupWeekday)}</span>,{' '}
                                <span className="font-semibold text-primary">
                                  {formatTime(catchupTime)} to {formatTime(catchupEndTime)}
                                </span>
                                , for {SPACES_CATCHUP_COUNT} weeks. The first module is available{' '}
                                <span className="font-semibold text-primary">
                                  {formatDate(rows.find((r) => r.session === 2)?.moduleTargetDate ?? PLAN_ANCHOR)}
                                </span>
                                .
                              </p>
                            </div>

                            {/* The app's own table shape (`SpacesRosterPage`'s
                                `purple-50` header row, `TH` cells, hairline row
                                rules), not a bespoke one — direct instruction.
                                Editing expands a drawer *below* its own row
                                rather than swapping the row in place, so the
                                values a coach is changing stay on screen while
                                they change them. */}
                            <p className="mt-10 text-caption-medium text-ink">Session planner table</p>
                            {/* Round 39: the table itself now lives in
                                `SessionPlannerTable`, shared verbatim with
                                `EditSessionPlanModal` so the review screen and
                                the edit screen cannot drift apart again. */}
                            <div className="mt-2">
                              <SessionPlannerTable
                                key={plannerGeneration}
                                rows={rows}
                                patchRow={patchRow}
                                rowIssues={rowIssues}
                                minDate={PLAN_ANCHOR}
                                idPrefix="plan-row"
                              />
                            </div>
                          </div>
                        )}
                  </div>
                </div>
                )}

                {!busy && (
                <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-ink-muted outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-3">
                    {showIntro ? (
                      <button
                        type="button"
                        onClick={() => setShowIntro(false)}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                      >
                        Get started
                      </button>
                    ) : (
                      <>
                        {step > 0 && (
                          <button
                            type="button"
                            onClick={() => setStep((s) => Math.max(0, s - 1))}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                          >
                            Back
                          </button>
                        )}
                        {step < REVIEW_STEP ? (
                          <button
                            type="button"
                            onClick={goNext}
                            disabled={
                              step === 0
                                ? catchupWeekday === null || timeInvalid
                                : moduleWeekday === null
                            }
                            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {step === 1 ? 'Build my plan' : 'Next'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={rowsIncomplete}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-divider-soft disabled:text-ink-faint disabled:hover:bg-divider-soft"
                          >
                            Create my session plan
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
  )
}
