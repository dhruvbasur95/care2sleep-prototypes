import { useSyncExternalStore } from 'react'
import { PATHWAY_STAGE_COPY } from './coachPathway'
import { SIPTEA_INITIALS, SIPTEA_NAMES, type SipteaInitial } from './siptea'

/**
 * The trainee's **annotated SIPTEA guide** — the reflection they complete at
 * three points across the COACH pathway.
 *
 * Source: the Notion page *"Trainee dashboard open items to be confirmed"*
 * (last edited 2026-10-02), which answers the long-open item *"Do trainee need
 * to share feedback (reflection) after each stage / If yes then in what format,
 * currently questions are missing"*. The wording below is **that page's own**,
 * transcribed rather than written here.
 *
 * Three timepoints, and they are not independent — each quotes the trainee's
 * earlier answers back at them:
 *
 *   Stage C -> **baseline**  six "why does this matter" questions, asked cold.
 *   Stage O -> **midline**   shows the baseline answer, asks what has changed.
 *   Stage H -> **endline**   shows baseline AND midline, asks what has changed.
 *
 * That is also exactly the schedule CLAUDE.md has carried for the annotated
 * SIPTEA guide since well before these questions existed, and the reason
 * `STAGES_WITH_REFLECTION` is C/O/H and not "every stage": the fourth
 * timepoint, post-practice, falls after the first real client session, which is
 * past the trainee rail entirely.
 *
 * **Stage A deliberately has no set.** Notion supplies none, and inventing six
 * is inventing clinical content (confirmed directly, 2026-10-02). Adding it
 * later is one entry in `TIMEPOINT_BY_STAGE` plus its six questions.
 *
 * **Contractions are spelled out** — Notion writes "Here's", "What's",
 * "they'll". Round 32 removed every contraction from the trainee banners, the
 * certification card, the tour and the onboarding, and Round 46 did the same to
 * a clinician's own consumer-facing questions (§89). Nothing else is reworded:
 * these are the research team's words and the point is that they are
 * recognisable, not tidy.
 */

export type ReflectionTimepoint = 'baseline' | 'midline' | 'endline'

/**
 * Which pathway stage ends in which timepoint, keyed by the rail's own `stage`
 * eyebrow rather than a position — the same rule `STAGE_PHOTO_BY_STAGE` uses,
 * and the reason inserting a stage cannot silently point a reflection at the
 * wrong column.
 */
export const TIMEPOINT_BY_STAGE: Record<string, ReflectionTimepoint> = {
  'Stage C:': 'baseline',
  'Stage O:': 'midline',
  'Stage H:': 'endline',
}

export function timepointForStage(stageEyebrow: string): ReflectionTimepoint | null {
  return TIMEPOINT_BY_STAGE[stageEyebrow] ?? null
}

/** Human name for a timepoint, for the modal's own heading and the review
 *  screen. Not shown on the banner, which names the stage instead. */
export const TIMEPOINT_NAME: Record<ReflectionTimepoint, string> = {
  baseline: 'Baseline reflection',
  midline: 'Midline reflection',
  endline: 'Endline reflection',
}

/**
 * The six Stage C questions, verbatim from Notion, in SIPTEA order.
 *
 * Keyed by initial rather than held as an array, so a question can never drift
 * out of step with the component it belongs to — the order comes from
 * `SIPTEA_INITIALS`, which `data/siptea.ts` already owns.
 */
export const BASELINE_QUESTIONS: Record<SipteaInitial, string> = {
  S: 'Why does Shared Understanding matter, and how should a coach approach a client to really understand their situation?',
  I: 'Why does Implementation Intent matter, and what does a coach need to do to help a client turn a strategy into an actual plan, with a when, where and how?',
  P: 'Why does Problem Identification matter, and what does a coach need to do to help a client surface the things that might get in the way of actually using a strategy?',
  T: "Why does Tailoring matter, and what does a coach need to do to make sure a strategy actually fits a client's routine and situation?",
  E: 'Why does Emotion Navigation matter, and what does a coach need to do to notice and respond to how a client is feeling about a change?',
  A: 'Why does Action and Goals matter, and what does a coach need to do to help a client commit to a small, realistic next step?',
}

/**
 * The midline and endline prompt, verbatim apart from its two contractions.
 *
 * It is one string for both because Notion gives the same sentence at both
 * timepoints — what differs is how many earlier answers are quoted above it,
 * which is data, not copy.
 */
export const GROWTH_PROMPT =
  'Has your understanding of this grown or changed since then? What is different now, if anything?'

/**
 * Notion's own per-component lead-in, shown above the recalled answer at
 * midline and endline: *"Here's what you said earlier about Shared
 * Understanding:"*.
 *
 * **Restored 2026-10-05.** A previous round deleted it and had the recall
 * panel name the *stage* instead, on the grounds that the SIPTEA chip at the
 * top of the screen already names the component. The instruction is to follow
 * Notion: the line comes back, and the panel now carries the stage as well, so
 * the screen says both — which component is being recalled, and which stage
 * the answer came from.
 *
 * The contraction is spelled out ("Here is", not "Here's") per this file's own
 * header rule. The component name comes from `SIPTEA_NAMES`, so it is sentence
 * case and matches the chip directly above it — Notion title-cases it, and the
 * questions themselves keep Notion's casing because they are transcribed
 * verbatim, but a label this project renders itself follows this project's
 * casing.
 */
export function recallLeadIn(initial: SipteaInitial): string {
  return `Here is what you said earlier about ${SIPTEA_NAMES[initial]}:`
}

/**
 * The stage a recalled answer came from, named in full — "Stage C: Learning
 * the basics" (direct instruction, 2026-10-05).
 *
 * Derived from `PATHWAY_STAGE_COPY` rather than written here, so the trainee
 * rail and this panel cannot drift: the rail's own eyebrow is the key, exactly
 * as `TIMEPOINT_BY_STAGE` already uses it in reverse.
 */
export function stageFullName(tp: ReflectionTimepoint): string {
  const eyebrow = STAGE_OF_TIMEPOINT[tp] + ':'
  const entry = PATHWAY_STAGE_COPY.find((p) => p.stage === eyebrow)
  return entry ? `${entry.stage} ${entry.label}` : STAGE_OF_TIMEPOINT[tp]
}

/**
 * **Dummy** earlier answers, shown on the midline and endline screens.
 *
 * Direct instruction, 2026-10-02: *"for this one just add some dummy text, dont
 * wire previous stage answers that I end up writing"*. So these are fixed
 * strings and the recall panel deliberately does **not** read `submitted` — a
 * reviewer walking the demo types placeholder text at Stage C, and echoing
 * "asdf" back at them two stages later demonstrates the mechanism while making
 * the screen unreadable.
 *
 * ⚠️ This is the one place the wizard is not honest about its own data, so it
 * is worth knowing exactly what to change: `EarlierAnswer`'s `answer` prop is
 * handed `DUMMY_EARLIER[tp][initial]` at the one call site in
 * `TraineeReflectionModal`. Swapping that for `submitted[tp]?.[index]` wires it
 * for real, and the store already holds the answers — `submitReflection` writes
 * them and nothing clears them. Nothing else has to change.
 *
 * The text is written as a trainee part-way through the pathway would write it:
 * a few sentences, first person, not a model answer. Endline shows two of
 * these stacked, so the midline set is deliberately shorter and more confident
 * than the baseline set — that progression is the thing the growth prompt asks
 * about, and identical-sounding entries would make the question unanswerable.
 */
export const DUMMY_EARLIER: Record<
  Exclude<ReflectionTimepoint, 'endline'>,
  Record<SipteaInitial, string>
> = {
  baseline: {
    S: 'I think it means finding out what the client actually wants, not what I assume they want. Probably asking open questions and listening more than I talk.',
    I: 'Making the plan specific. If someone says they will try to wind down earlier, that is not really a plan yet.',
    P: 'Asking what might get in the way before it does. I would want to know what has stopped them before.',
    T: 'Changing the advice so it fits their actual life. A shift worker cannot follow the same routine as someone retired.',
    E: 'Noticing when someone is worried or embarrassed about their sleep and not rushing past it.',
    A: 'Agreeing one small thing to try before we next meet, so there is something concrete to come back to.',
  },
  midline: {
    S: 'Practising it changed this for me. I was asking open questions but still steering toward the answer I expected. Shared understanding is checking I have it right, out loud, before moving on.',
    I: 'I now ask when, where and how every time. In role-play the plans that stayed vague were the ones nobody could picture doing.',
    P: 'I used to raise obstacles myself. It works better to ask and wait, even when the silence is uncomfortable.',
    T: 'Tailoring is more than swapping a detail. Twice I had to let go of the strategy I had prepared.',
    E: 'I am slower to move on now. Naming what I notice, rather than reassuring, is what opened the conversation up.',
    A: 'Smaller than I would have picked. My peers kept choosing goals that sounded good and were too big for one week.',
  },
}

/**
 * The welcome screen's instruction blurb, one per timepoint.
 *
 * Written here rather than in the component for the same reason every other
 * string in this flow is (see this file's header), and **per timepoint rather
 * than once** because what the trainee is actually asked to do differs: at
 * baseline the six questions are asked cold, and at midline and endline the
 * screen quotes earlier answers back above each one. A single generic blurb
 * would under-describe two of the three.
 *
 * Contractions are spelled out, matching the questions and Round 32's sweep of
 * every trainee-facing banner, tour and onboarding screen. **No em dashes**
 * (direct instruction, 2026-10-05), which is also the app-wide convention
 * since the Round 17.1 punctuation pass.
 */
export const WELCOME_BLURB: Record<ReflectionTimepoint, string> = {
  baseline:
    'Six questions, one for each SIPTEA component. Tell us what each one means to you and why it matters in coaching. There are no right answers. This is a record of where you are starting from.',
  midline:
    'The same six SIPTEA components, now that you have practised with your peers. We will show you what you wrote at Stage C and ask what has changed.',
  endline:
    'The same six SIPTEA components, one last time. We will show you what you wrote at Stage C and Stage O, and ask what has changed since then.',
}

/* `WELCOME_REASSURANCE` is **removed** (direct instruction, 2026-10-05). It
   sat under the step row saying the trainee could stop and come back, and the
   cancel dialog makes that promise at the moment it actually matters — on the
   way out — rather than before they have typed anything. */


/**
 * The three-step row beneath the blurb, modelled on `PlanSessionsModal`'s own
 * welcome screen, which is this app's only existing precedent for the pattern.
 *
 * Three steps, not six: this describes the **shape of the flow**, and the
 * numbered stepper on every screen after this one already counts the
 * questions. Repeating six here would be the same fact twice, which is exactly
 * why the step count under the progress bar was made `sr-only`.
 */
export const WELCOME_STEPS: { label: string; description: string }[] = [
  { label: 'Answer', description: 'Six questions, one at a time' },
  { label: 'Review', description: 'Check your answers before you share' },
  /* "with the research team", not "with research team" — the article is added
     for grammar; everything else is the instruction's own wording. */
  { label: 'Share', description: 'Your SIPTEA reflection gets shared with the research team' },
]

/** Which earlier timepoints a given one quotes back, oldest first. Endline
 *  shows both, per Notion: "after Stage H, provide both Stage C and Stage O
 *  answers". */
export const QUOTES_BACK: Record<ReflectionTimepoint, ReflectionTimepoint[]> = {
  baseline: [],
  midline: ['baseline'],
  endline: ['baseline', 'midline'],
}

/** Which stage each timepoint belongs to, for labelling a quoted answer. */
export const STAGE_OF_TIMEPOINT: Record<ReflectionTimepoint, string> = {
  baseline: 'Stage C',
  midline: 'Stage O',
  endline: 'Stage H',
}

/** Six answers, indexed to match `SIPTEA_INITIALS`. */
export type ReflectionAnswers = string[]

export const REFLECTION_STEP_COUNT = SIPTEA_INITIALS.length

export function emptyAnswers(): ReflectionAnswers {
  return SIPTEA_INITIALS.map(() => '')
}

/* ── Store ──────────────────────────────────────────────────────────────── */

/**
 * Module-scoped, not page state.
 *
 * Two reasons, and the first is a rule this project already wrote down: every
 * page under a portal mounts its own shell, so anything that must survive
 * in-app navigation cannot be `useState` in one — Round 29 replayed a whole
 * onboarding flow that way. The second is specific to this feature: the midline
 * screen *renders the baseline answers*, so they have to outlive the modal that
 * collected them, and the endline screen outlives both.
 *
 * Never persisted, matching `activeStage` and the onboarding flow — a reload
 * starting over is the intended demo behaviour. A real build would put
 * `submitted` behind the researcher's own store, which is the next piece of
 * work (direct instruction: the researcher dashboard will show these answers).
 */
interface ReflectionState {
  /** Approved and sent. Absent until the trainee submits. */
  submitted: Partial<Record<ReflectionTimepoint, ReflectionAnswers>>
  /** In progress. Present once the trainee has typed anything and closed the
   *  modal without submitting — this is what the banner's Resume state reads. */
  drafts: Partial<Record<ReflectionTimepoint, ReflectionAnswers>>
}

let state: ReflectionState = { submitted: {}, drafts: {} }
const listeners = new Set<() => void>()

function emit() {
  /* A new object each time: `useSyncExternalStore` bails out on
     `Object.is` equality, so mutating in place would leave every reader stale. */
  state = { submitted: { ...state.submitted }, drafts: { ...state.drafts } }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export function useReflectionState(): ReflectionState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Keep a part-finished reflection so the banner can offer Resume. Called when
 *  the modal closes without submitting — including via Cancel, which is why
 *  cancelling is not destructive. */
export function saveReflectionDraft(tp: ReflectionTimepoint, answers: ReflectionAnswers) {
  if (answers.every((a) => !a.trim())) {
    delete state.drafts[tp]
  } else {
    state.drafts[tp] = [...answers]
  }
  emit()
}

/** Submit. The draft is cleared in the same write, so a submitted timepoint can
 *  never also read as resumable. */
export function submitReflection(tp: ReflectionTimepoint, answers: ReflectionAnswers) {
  state.submitted[tp] = [...answers]
  delete state.drafts[tp]
  emit()
}

/** Test/demo reset. Not wired to any control. */
export function resetReflections() {
  state = { submitted: {}, drafts: {} }
  emit()
}
