import { useSyncExternalStore } from 'react'

/**
 * Coach Delivery Portal first-run tour (Round 32) — the coachmark walkthrough
 * that starts the moment a trainee finishes the welcome flow with "Go to my
 * dashboard".
 *
 * Figma: `637:10622` (step 1) · `637:10621` (2) · `637:10623` (3) ·
 * `637:10624` (4) · `637:10625` (5).
 *
 * **All copy lives here, never in the component.** That is the one structural
 * lesson worth keeping from Round 17's researcher tour (built, then deleted in
 * Round 28): its copy was rewritten three times on direct feedback, and a data
 * file is the difference between a copy pass touching one file and touching
 * every step's markup.
 *
 * `anchor` is the value of a `data-tour` attribute on a real element. Nothing
 * here knows about layout — the component measures whatever it finds and
 * places the card around it — so re-pointing a step at a different element is
 * a one-string change.
 */
export interface DeliveryTourStep {
  /** Matches `[data-tour="…"]` on the element to spotlight. */
  anchor: string
  title: string
  body: string
  /**
   * Preferred side of the anchor for the card. The component still overrides
   * this when the preferred side has no room — a preference, not a promise.
   */
  prefer?: 'right' | 'left' | 'bottom' | 'top'
  /**
   * Overrides the advance button's label on this step. Round 40.
   *
   * The trainee's step 1 is an invitation — a generic "welcome to your
   * dashboard" card the onboarding flow hands straight into — so it reads
   * "Start tour". The coach's step 1 is a real content step, reached by
   * pressing "Take tour" on the banner, and a card that says "Start tour"
   * *after* the tour has visibly started is telling the coach the opposite of
   * what happened. Per-step rather than per-tour, because the distinction is a
   * property of the step, not of which walkthrough it belongs to.
   */
  cta?: string
}

export const DELIVERY_TOUR_STEPS: DeliveryTourStep[] = [
  {
    anchor: 'home-greeting',
    title: 'Welcome to your dashboard',
    cta: 'Start tour',
    body: 'This is your home base for training. From here, you can get to your modules, track your progress, and join your meetings.',
    prefer: 'bottom',
  },
  {
    anchor: 'training-pathway',
    title: 'Your training journey',
    // The frame writes "the five stages"; the rail draws six. Rather than ship
    // a number that contradicts the thing it is pointing at — the exact defect
    // Round 30 found in this same frame family and Round 31 found again on the
    // certification card — the count is interpolated from the rail itself at
    // render time. See `tourStepBody()`.
    body: 'This shows the {stageCount} stages you will complete on your way to becoming a certified coach. You are currently on Stage 1.',
    prefer: 'bottom',
  },
  {
    anchor: 'learning-progress',
    // Frame `637:10623` titles this "My learning tab" and describes the tab
    // itself — but the card it points at on Home is not the tab, and the tab
    // gets its own step later (step 5). Retitled on direct instruction so the
    // copy describes the thing it is spotlighting.
    //
    // Retitled a second time once this slot stopped being the learning-progress
    // card: it now changes with the stage (resources before a group session,
    // feedback after an assessment, the reflection prompt, the certificate).
    // Naming one stage's version would be wrong on five of the seven.
    title: 'Your stage details',
    body: 'This card changes with the stage you are in. Look here for what you need right now, whether that is your progress, resources to prepare with, your feedback, or a session link.',
    prefer: 'right',
  },
  {
    anchor: 'meeting',
    title: 'My meeting',
    body: 'Your supervisor will schedule meetings here. When one is coming up, you will see the link and details to join.',
    prefer: 'left',
  },
  {
    anchor: 'nav-learning',
    title: 'My Learning',
    body: 'Come back to this tab anytime to see all your modules and pick up where you left off.',
    prefer: 'right',
  },
  // The last two steps have no frame of their own (direct instruction: reuse
  // the same card, write the text). Copy follows the frames' voice — second
  // person, what the tab is for, one thing the coach can do there — and is
  // written against what each page actually contains today, not what it might.
  {
    anchor: 'nav-notes',
    title: 'My Notes',
    body: 'Write down anything you want to remember from your training. Your notes stay here for you to come back to.',
    prefer: 'right',
  },
  {
    anchor: 'nav-profile',
    title: 'My Profile',
    body: 'Your contact details and study information live here. Once you are certified, this is where you download your certificate.',
    prefer: 'right',
  },
]

/**
 * The **certified-coach** tour (Round 40, direct instruction), opened by the
 * welcome banner's "Take tour" rather than by the onboarding flow.
 *
 * Four steps, in the order the coach named: what the dashboard tells them,
 * what needs them, who they are working with, and the tab that is new to them.
 * The trainee's array above is untouched — two stages of one portal have
 * genuinely different dashboards, and one array switching on stage would have
 * meant every step carrying a condition.
 *
 * `/design:ux-copy` + `/design:user-research`: one shape for all four, so the
 * tour reads as one voice — **sentence one names the thing, sentence two says
 * what the coach does there.** Second person, no exclamation marks, no
 * "simply"/"just", and nothing longer than two short sentences. The trainee
 * tour above already follows that shape; this matches it rather than inventing
 * a second register a few weeks later in the same product.
 */
export const COACH_TOUR_STEPS: DeliveryTourStep[] = [
  {
    /* Round 40, direct instruction: the tour was **opening on a content step**,
       so "Quick overview" arrived with no preamble and read as if it had cut
       in. A welcome step first — anchored on the greeting, the same place the
       trainee tour starts — gives the walkthrough somewhere to begin and sets
       what is coming.

       Not "Welcome to your dashboard": the banner the coach just pressed says
       almost exactly that, and a tour that opens by repeating the card that
       launched it reads as a loop. This one says what the next few screens are
       for instead. */
    anchor: 'home-greeting',
    title: 'A quick look around',
    /* No written count. The card's own "Step 1 of N" already states it and is
       derived from the array — a number in prose here is the sentence this
       project has shipped wrong three times. */
    body: 'Everything you need as a coach now lives on this page. A few short stops, and you can leave at any time.',
    prefer: 'bottom',
  },
  {
    anchor: 'quick-overview',
    title: 'Quick overview',
    body: 'Your caseload at a glance. Check here for how many clients you have, sessions held, and what still needs planning.',
    prefer: 'right',
  },
  {
    anchor: 'priorities',
    title: 'This week\u2019s priorities',
    body: 'The few things that need your attention this week. Select any one to go straight to that client.',
    prefer: 'left',
  },
  {
    anchor: 'clients-table',
    title: 'Clients assigned to you',
    body: 'Everyone on your caseload. Select a client to plan their sessions, write case notes and review their sleep data.',
    /* `right`, not `top` (direct instruction): the table is full width, so a
       card above it lands on top of its own heading and the coach cannot read
       what the step is pointing at. */
    prefer: 'right',
  },
  {
    anchor: 'nav-schedule',
    title: 'My Schedule',
    /* `/design:ux-copy`, direct instruction: this tab is for **seeing** what is
       booked, quickly — not for starting a session. "Every session and meeting
       you have booked sits here" read as an invitation to run the session from
       the schedule, which is not where that happens: a coach joins from the
       client's own record, where the session plan, the notes and the sleep data
       are. The second sentence now says so rather than leaving it implied. */
    body: 'A quick view of everything you have booked, grouped by day. Open the client\u2019s record when it is time to join.',
    prefer: 'right',
  },
]

/**
 * Fills the one interpolated token in the step copy. Kept trivial on purpose —
 * this is not a template system, it is one count that must not be able to
 * disagree with the rail beside it.
 */
export function tourStepBody(step: DeliveryTourStep, stageCount: string): string {
  return step.body.replace('{stageCount}', stageCount)
}

/**
 * Module scope, not component state — and that is load-bearing for the same
 * reason `onboardingDismissed` is (see `DeliveryShell`): every page under
 * `/delivery` mounts its own shell, so a flag held in one would reset the
 * moment the tour moved the coach to another page. Round 29 shipped exactly
 * that bug with the onboarding flag and it replayed the whole welcome flow.
 *
 * Not persisted, matching the welcome flow it follows: a refresh returns to
 * onboarding, and onboarding is what starts this. A real first-run gate would
 * store a flag keyed to the coach.
 */
let active = false
let index = 0
/** Which walkthrough is running. Held here rather than derived from the coach
 *  stage, so a caller opens the tour it means to open — the banner's "Take
 *  tour" and the onboarding hand-off are different entry points. */
let steps: DeliveryTourStep[] = DELIVERY_TOUR_STEPS
const listeners = new Set<() => void>()

/** One snapshot object per change, because `useSyncExternalStore` compares by
 *  identity — returning a fresh object every call would loop forever. */
let snapshot = { active, index, steps }

function emit() {
  snapshot = { active, index, steps }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useDeliveryTour() {
  return useSyncExternalStore(subscribe, () => snapshot)
}

export function startDeliveryTour(which: DeliveryTourStep[] = DELIVERY_TOUR_STEPS) {
  active = true
  index = 0
  steps = which
  emit()
}

export function endDeliveryTour() {
  active = false
  index = 0
  emit()
}

export function goToTourStep(next: number) {
  if (next < 0 || next >= steps.length) {
    endDeliveryTour()
    return
  }
  index = next
  emit()
}
