# Orchestration flows — Care2Sleep Consumer Portal

Every multi-step flow in the portal as an explicit state machine, **written so it
can be rebuilt from this document alone**. Each one gives you its states, its
transitions and their triggers, what persists at each step, what happens when the
flow is interrupted (browser Back, a reload mid-flow, closing a modal halfway),
and where keyboard focus goes on every transition.

**[§2 is the demo-trigger table](#2-demo-triggers-vs-production-behaviour) — read
it before you touch anything.** Several state changes in this prototype are
reachable only through review scaffolding that will not exist in production, and
at least one of them is a button labelled as if it does something else entirely.

Companion documents: `motion-spec.md` (the animation each transition plays),
`data-model.md` (the types and the store these flows read and write),
`integration-points.md` (the backend seams they will need).

---

## Contents

- [§0 The route table and the chassis](#0-the-route-table-and-the-chassis)
- [§1 The flows](#1-the-flows)
  - [1.1 The first-run welcome and its handoff into Home](#11-the-first-run-welcome-and-its-handoff-into-home)
  - [1.2 The first-run onboarding tour](#12-the-first-run-onboarding-tour)
  - [1.3 The sleep diary](#13-the-sleep-diary)
  - [1.4 A module](#14-a-module)
  - [1.5 The session-feedback banner and modal](#15-the-session-feedback-banner-and-modal)
  - [1.6 Need help](#16-need-help)
  - [1.7 Opt out of the study](#17-opt-out-of-the-study)
  - [1.8 The hamburger drawer](#18-the-hamburger-drawer)
  - [1.9 The accessibility menu](#19-the-accessibility-menu)
- [§2 Demo triggers vs. production behaviour](#2-demo-triggers-vs-production-behaviour)
- [§3 Cross-cutting facts](#3-cross-cutting-facts)

---

# §0 The route table and the chassis

`src/App.tsx` — seven route entries, all consumer. **There is no portal switcher
and no role switch**; the Research Dashboard and Coach Delivery Portal were
removed from this package outright.

| Path | Page | File |
|---|---|---|
| `/` → `/consumer/dyad-011` | redirect, `replace` | `App.tsx:50` |
| `/consumer` → `/consumer/dyad-011` | redirect, `replace` | `App.tsx:51` |
| `/consumer/:dyadId` | Home | `ConsumerHomePage.tsx` |
| `/consumer/:dyadId/learning` | My Modules | `ConsumerLessonsPage.tsx` |
| `/consumer/:dyadId/module/:moduleId` | a module — 4 stages + a completion screen | `ConsumerModulePage.tsx` |
| `/consumer/:dyadId/diary` | the sleep diary — 3 stages | `ConsumerDiaryPage.tsx` |
| `/consumer/:dyadId/help` | Need help | `ConsumerHelpPage.tsx` |
| `/consumer/:dyadId/account` | My profile | `ConsumerAccountPage.tsx` |
| `*` → `/consumer/dyad-011` | catch-all; **there is no 404 design** | `App.tsx:76` |

Routing is **`HashRouter`** (`main.tsx:9`), so URLs look like
`…/#/consumer/dyad-011`. One consequence worth knowing before you write any
in-page anchor: **a fragment link (`<a href="#resource-card">`) rewrites
`location.hash`, which the router then tries to match as a route.** The one
in-page jump in the portal is therefore a scripted `window.scrollTo` plus a
`.focus()`, not an anchor (`ConsumerModulePage.tsx:804`).

**Three structural facts every flow below depends on.**

**1. Every in-app navigation unmounts and remounts the whole page subtree.**

```tsx
// App.tsx:46
<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>…</Routes>
</AnimatePresence>
```

That includes `ConsumerShell` and the header. **Anything that must survive a
navigation therefore cannot be component state.** Hence the four module-scoped
stores:

| Store | Holds | Why it cannot be state |
|---|---|---|
| `data/consumerMenuReveal.ts:23` | the content-reveal pulse token | read by whichever page mounts next |
| `data/consumerMenuReveal.ts:62` | the drawer's open state | the drawer outlives the navigation it triggers |
| `data/consumerOnboarding.ts:25` | the tour's open state | the welcome *navigates* before opening the tour |
| `data/consumerTextScale.ts:43` | the text-size index | must survive every page change |
| `ConsumerShell.tsx:35` | `welcomeDismissed` | a plain module `let`, not a store — nothing needs to re-render on it |
| `ConsumerShell.tsx:86` | `pageIntroPlayed` | same |

All four stores are read through `useSyncExternalStore`. **None of them is
persisted to `localStorage`, `sessionStorage` or anywhere else**, so all of them
reset on a full page load. §3.1.

**2. `ConsumerMenuDrawer` is mounted above `<Routes>`** (`App.tsx:89`), so it
outlives a navigation and can close and navigate in the same frame. §1.8.

**3. The welcome flow renders instead of the page, not inside it.**
`ConsumerShell.tsx:391-399` swaps the whole page body for `ConsumerWelcome` when
the flow has not been passed. **Only Home allows this**; the other five pages
pass `showWelcome={false}` (`ConsumerLessonsPage.tsx:70`,
`ConsumerModulePage.tsx:1421`, `ConsumerDiaryPage.tsx:315`,
`ConsumerHelpPage.tsx:514`, `ConsumerAccountPage.tsx:226`). §1.1 says why.

---

# §1 The flows

## 1.1 The first-run welcome and its handoff into Home

**File** `src/components/consumer/ConsumerWelcome.tsx`, rendered by
`ConsumerShell.tsx:398`.

**Gate** the module-scoped `let welcomeDismissed` (`ConsumerShell.tsx:35`).
**Not persisted**, so the flow replays on every full page load.

**Structure** one component, four steps on a horizontally travelling rail. **All
four stay mounted at once** so the rail can span them; the three that are not
current are `inert` + `aria-hidden`.

### States

| # | Title | Primary CTA | Back |
|---|---|---|---|
| 0 | Welcome to Care2Sleep | **Get started** | — (none on step 0) |
| 1 | Make a session plan with your coach | Next | Go back |
| 2 | Complete your modules each week | Next | Go back |
| 3 | Fill in your sleep diary each day | **Go to dashboard** | Go back |

**There is no Skip.** A reader either walks the four screens or reloads.

### Transitions

```
        Get started        Next            Next         Go to dashboard
  0 ───────────────► 1 ───────────► 2 ───────────► 3 ─────────────────► EXITING
  ▲                  │              │              │
  └──── Go back ─────┴─ Go back ────┴─ Go back ────┘

  EXITING ──(420ms fade; 180ms under prefers-reduced-motion)──► onContinue()
```

`leave()` (`:542`) is **guarded against a double press** — the CTA stays on
screen during the fade, and firing `onContinue` twice would dismiss the flow
mid-exit.

### What persists

**Nothing, at any step.** The step index is `useState`. Only the final handover
writes anything, and only to a module-scoped flag.

### The handover

```tsx
// ConsumerShell.tsx:313
const dismissWelcome = useCallback(() => {
  welcomeDismissed = true
  setWelcomed(true)
  navigate(`/consumer/${dyadId}`, { replace: true })   // ⚠️ explicit destination
  openConsumerOnboarding()                             // opens the tour, §1.2
}, [navigate, dyadId])
```

**`replace: true`** so browser Back does not walk into the flow just completed.

**⚠️ The explicit destination is a bug fix, not bookkeeping.** Flipping the flag
alone merely *uncovers* whatever page the reader entered on. The welcome renders
over every consumer surface, so arriving on `/help` and finishing the welcome
left you on Help having just been told "welcome to your dashboard".

**⚠️ `ConsumerShell.tsx:263` (`if (!showWelcome) welcomeDismissed = true`) is
the second half of that fix.** Landing on `/diary`, `/learning`, `/help` or
`/account` with a fresh module state used to render the whole five-screen welcome
over that route — and its final CTA navigates to Home, so the reader never
reached the page they asked for. Now those pages both suppress the flow **and**
mark it passed for the session.

### Interrupted flow

| Interruption | Result |
|---|---|
| Browser **Back** mid-flow | nothing to go back to — the flow never pushed a history entry; Back leaves the app |
| **Reload** mid-flow | restarts at step 0 |
| Closing a modal halfway | n/a — there is no modal in this flow |

### Focus

`useEffect` keyed on `step` (`:469`) focuses `headingRefs.current[step]` with
`preventScroll`.

**An effect is correct here, unusually**, because all four headings are already
mounted and nothing races. (Compare §1.2 and §1.4, which need a callback ref —
`motion-spec.md` §11 Trap 2.)

**It is still mandatory, not polish:** advancing makes the step holding the
just-clicked button `inert`, and an inert element cannot hold focus, so without
it focus drops to `<body>` on every step.

---

## 1.2 The first-run onboarding tour

**File** `src/components/consumer/ConsumerOnboardingTour.tsx`.

**Opened only by the welcome flow's handover.** There is **no other entry point
and no re-entry point** — skipping it means not seeing it again until a reload.

**Why its open state is module-scoped** (`data/consumerOnboarding.ts:25`): the
handover *navigates* to Home, which unmounts the `ConsumerShell` that opened the
tour. A flag held in shell state would be destroyed by the very navigation meant
to reveal the modal, and it would never appear. It is read through
`useSyncExternalStore` so `ConsumerShell.tsx:269` re-renders when it flips.

### States — five screens in one fixed 577×716 panel

| # | Eyebrow | Title |
|---|---|---|
| 0 | `Hello Joan & Bruce` | Welcome to your dashboard |
| 1 | `2/5` | Your tasks for today |
| 2 | `3/5` | Your session plan |
| 3 | `4/5` | Know your coach |
| 4 | `5/5` | In case you run into any issues |

**The counter and the five dots are derived from `STEPS` (`:75`), never
written.** The source frames said "3/4" on two different screens and drew the
first dot active on all five.

### Transitions

```
  n ──Next──► n+1                         (n < 4)
  n ──Go back──► n-1                      (the control is absent on screen 0)
  4 ──Start my journey──► CLOSED
  any ──Skip / Escape / backdrop click──► CLOSED

  CLOSED ──reopened──► step resets to 0   (effect at :154)
```

### What persists

**Nothing.**

### Side effects while open

- **Page scroll is locked** — `document.documentElement.style.overflow =
  'hidden'` plus a right-padding compensation for the removed scrollbar
  (`:170-182`). Without the padding the page jumps ~15px wider the instant the
  modal opens.
- **`ScrollCue` is suppressed** (`ConsumerShell.tsx:483`,
  `showScrollCue && !tourOpen`) — a cue inviting a scroll on a locked page is an
  affordance that does nothing, and it sits exactly where the modal's footer is.

### Interrupted flow

| Interruption | Result |
|---|---|
| **Escape** or a backdrop click | closes; identical to Skip |
| Browser **Back** | the tour is not a route; Back navigates the page *underneath* it and the tour closes with the unmount |
| **Reload** | the whole first-run sequence replays from the welcome flow |

### Focus

- The incoming heading is focused from a **callback ref** (`:210`), not an
  effect. Under `AnimatePresence mode="wait"` the incoming heading mounts a
  commit *later* than the step change, so an effect keyed on `step` focuses the
  *outgoing* heading and every transition lands on `<body>`. `focusedStep` stops
  a re-render stealing focus back off whatever the reader has since tabbed to.
- **Tab is trapped** inside the panel (`:206`); **Escape closes**.
- **On close, focus goes to `#main-content`** (`ConsumerShell.tsx:286`).
  **There is deliberately no focus-restore to an opener** — the opener is the
  welcome's final CTA, which has unmounted by the time the tour is visible. A
  code comment that claimed a restore was corrected.
- **`ConsumerShell`'s own welcome-focus effect is gated `&& !tourOpen`**
  (`:338`), or it would yank focus out of the modal a commit after the modal
  focused its own heading — measured, and it left Tab reaching the page behind
  the dim with Escape doing nothing.

---

## 1.3 The sleep diary

**File** `src/pages/consumer/ConsumerDiaryPage.tsx`. One route, three stages held
in page state: `welcome → questions → done`.

### States and transitions

```
  welcome ──"Fill in Sleep Diary"──► questions(q=0)
  welcome ──"Go Back"──► navigate(/consumer/:id)

  questions(q) ──Next──► questions(q+1)      [q < 8 AND stepComplete]
  questions(q) ──Back──► questions(q-1)      [q > 0]
  questions(8) ──Finish──► submitSleepDiary(...) ; stage = 'done'

  questions(q) ──X (exit)──► exitOpen = true
      exitOpen ──"Leave without saving"──► navigate(/consumer/:id)   [answers DISCARDED]
      exitOpen ──"Keep filling it in"────► exitOpen = false          [answers kept]

  done ──"Go home"──► navigate(/consumer/:id)
```

**The 9 steps are derived, never restated** (`:75`):
`SLEEP_DIARY_QUESTIONS.filter(q => !q.computed && q.field)`. Questions 10–13 of
the Consensus Sleep Diary are **derived at render time and never asked** — see
`data-model.md`.

**The date the diary is filled *for*** is `DIARY_DATE` (`:91`), formatted from
the frozen `TODAY`.

### Gating

`stepComplete` (`:210`) requires **every present member** to have a non-empty
answer:

```tsx
const stepComplete = members.every((m) => answersFor(m.who, question.field).trim() !== '')
```

The footer renders **`aria-disabled`, not `disabled`**, with a `BlockedHint`
reason — *"Please fill in an answer for both of you before moving on."* —
rather than hiding the control. `next()` **re-checks the guard** (`:222`);
without that second check `Number('')` writes `NaN` into the store.

### What persists at each step

**Nothing.** The draft lives in one `useState` (`:161`):
`Draft = Record<'patient' | 'carer', Partial<SleepDiaryAnswers-as-strings>>`.

**The only write is the single `submitSleepDiary` call at `:244`, on Finish.** It
writes both members' answers in one action, so a caller cannot half-make the
write.

### Interrupted flow

| Interruption | Result |
|---|---|
| **X (exit)** | a `ConfirmDialog` asks first; confirming discards and goes Home |
| Browser **Back** | leaves the route **immediately, with no confirmation**. Answers lost |
| **Reload** | restarts at `welcome`, answers lost, **and the portal welcome flow replays first** — so the reader does not even return to the diary (§3.1) |

**⚠️ The exit `ConfirmDialog` is mounted OUTSIDE the `AnimatePresence`**
(`:686`), so it is not torn down mid-step-transition. Moving it inside makes the
dialog vanish when the step behind it swaps.

### Input handling — three deliberate choices

- **Numbers are `type="text" inputmode="numeric"`**, not `type="number"`: a
  numeric keypad, no spinner, no scroll-wheel changes, and no `e`/`+`/`-`.
  Non-digits are stripped on input.
- **Times are native `type="time"`** and convert to the data model's
  `"h:mm am/pm"` **on submit** via `to12Hour` (`:96`) — never in the field, which
  would fight the reader as they type.
- **A carer-only dyad has one column, not two**, and `stepComplete` reads
  `members`, so the gate follows automatically.

### Focus

`useEffect` on `[stage, qIndex]` (`:184`) focuses `headingRef` with
`preventScroll`, then `window.scrollTo(0, 0)`.

**An effect, not a `requestAnimationFrame`** — rAF is throttled in a hidden or
backgrounded tab, and this must not depend on that (`motion-spec.md` §11
Trap 10). It is safe as an effect because the stepper uses
`AnimatePresence mode="popLayout"` (`:448`), so the incoming step mounts
immediately. **If you change that to `mode="wait"`, this must become a callback
ref in the same edit.**

### Verified end to end

All 9 questions × 2 members, Finish, thank-you screen, then Home flipping to
*"Thanks for filling in today's sleep diary"*. **This write works.**

---

## 1.4 A module

**File** `src/pages/consumer/ConsumerModulePage.tsx`.
**Route** `/consumer/:dyadId/module/:moduleId?from=modules`.

Four progress stages plus a completion screen, all in page state.

### States and transitions

```
  welcome ──"Start learning" / "Go next"──► video
  video   ──"Go next"──► summary
  summary ──"Go next"──► reflection
  reflection ──"Finish module"──► done       [gated — see below]
  done ──"Go home"──► navigate(/consumer/:id)          ALWAYS home

  welcome ──"Go back"──► moduleExitTo(id, from)        // /learning if ?from=modules, else Home
  video | summary | reflection ──"Go back"──► previous stage
  done ──"Go back"──► reflection
```

**`STAGES = ['welcome','video','summary','reflection']` (`:92`); `done` is
deliberately NOT a fifth quarter**, so the progress bar reads 100% on reflection
rather than 80%. `stageProgress` (`:102`) derives the figure, because the source
frame drew a 46.5% bar labelled "100% complete".

**`furthest` (`:1234`) is held separately from `stage`** so returning to an
earlier screen never rolls a label back — the welcome CTA says "Start learning"
the first time and "Go next" afterwards.

### Guard on entry

`moduleLesson(moduleId)` returning `null` — index < 1, or no content —
`<Navigate replace>`s to `/consumer/:id/learning` (`:1303`). **Only
`daytime-habits` (Module 4) has content today**, so five of the six module routes
bounce, indistinguishably from a bad URL. There is no "this module is not ready"
screen.

### ⚠️ A known label/destination mismatch

`EXIT_LABEL` is `'Go home'` (`:721`) but `moduleExitTo` (`:702`) returns **My
Modules** when `?from=modules`, which is the common case. It is documented at the
call site with two one-line fixes (branch the label, or drop the `from` param).
**Left as a product decision, not a bug to fix silently.**

### The video stage's sub-state

`mode: 'video' | 'audio' | 'transcript'` plus `activeChapter`, both local to the
stage — so **they reset if the reader steps back to welcome and forward again**.

There is no video asset anywhere in the package: the player is a grey
placeholder, the transcript is an abridged 10-line extract of a ~90-line script,
and chapter `startsAt` values are estimated at 140 words/min.

### The summary stage

Four flip cards (`ModuleSummaryCards.tsx`), each holding `flipped` locally.
Below them sits `ResourceCard`, whose "Download the guide" button is
`aria-disabled` with an `sr-only` "(coming soon)" (`ResourceCard.tsx:276`) —
**the standing treatment for a control a frame draws but nothing has wired.**

Copy above the cards can jump to it via `scrollToResourceCard()` (`:804`), which
scrolls *and* focuses the card itself, so it works as a real skip link rather
than a mouse-only convenience.

### The reflection stage's sub-state

Five questions **plus a sixth index that is the review screen**
(`REVIEW_INDEX = questions.length`, `ModuleReflection.tsx:385`).

**Held on the page, not the stage** (`ConsumerModulePage.tsx:1248-1262`), so
stepping back to Summary and forward again does not lose answers or reset the
place.

```
  q0 … q4 ──Next──► next question           [gated per question]
  q4 ──"Review answers"──► REVIEW
  REVIEW: every question's rows again, LIVE — answers editable in place
          REVIEW also reveals the share card
  any ──"Go back"──► previous index
```

- Answers are **multi-select**, keyed `answers[questionId][who]` where `who` is
  `'ple'` or `'carer'`. **A carer-only dyad never grows a `ple` key.**
- **Per-question gating:** every present member must have ≥1 option. The blocked
  reason names who is missing — *"Joan has not answered yet."*
- **The share choice is `boolean | null`, never defaulted.** A default would
  answer a consent question on the reader's behalf.
- **`Finish module` is blocked until every member × every question is answered**
  (`reflectionIncomplete`, `:1389`) **and** the share choice is made (`:1396`).

### What persists

**Nothing, at any stage.** `ConsumerModulePage` calls `useResearch()` for
`consumerDyads` only (`:1217`) and **never invokes an action**. Module progress,
reflection answers and the share flag all die with the page.

The file states the reason at `:1244`: *"There is no store slice for a consumer's
reflection answers yet, and inventing one would put a number on a researcher's
screen that no coach has ever discussed."*

That is the right call for a prototype: the flow exists so the screens and their
states can be reviewed, not so the answers can be stored. `integration-points.md`
describes the two endpoints a real build would add, and notes that the coach's
SIPTEA `annotationSummaries` is not where a consumer's answers belong.

### Interrupted flow

| Interruption | Result |
|---|---|
| Browser **Back** | leaves the module immediately, **no confirmation**, all state lost |
| **Reload** | restarts at `welcome`. The portal welcome is **not** shown (`showWelcome={false}`), and that also marks the welcome passed for the session |
| **Go home** in the yellow bar | leaves at any point, **no confirmation** |

**Note the asymmetry with the diary**, which *does* confirm on exit. The diary
guards a single day's data that cannot be re-derived; a module can be replayed.
That is the rationale, and it is worth keeping when you add persistence.

### Focus

The incoming stage heading is focused from a **callback ref** (`:1313`). An
effect keyed on `stage` was built first and **measured dropping focus to
`<body>` on every change** — the stage machine is `mode="wait"`.

`advance`/`retreat` also call `window.scrollTo({ top: 0, behavior: 'instant' })`,
because heading focus uses `preventScroll`.

### Direction-aware chrome

The yellow module bar and the white flow footer show and hide on scroll
direction. That is motion, and its six rules, its thresholds and its structural
requirements are in **`motion-spec.md` §5.2**. Two facts belong here because they
affect the flow: **every stage resets to both-visible on entry** (otherwise a
reader lands on a page whose only way forward is off-screen), and **the hidden
bar is never `aria-hidden`** — it holds the only Go home control, and a
screen-reader user has no scroll direction with which to restore it.

---

## 1.5 The session-feedback banner and modal

**Files** `src/components/consumer/SessionFeedbackBanner.tsx` +
`SessionFeedbackModal.tsx`; the trigger is on `ConsumerHomePage.tsx`.

### ⚠️ How it is reached today

**Pressing "Join video call" on Home's next-session card toggles the banner**
(`ConsumerHomePage.tsx:467` → `:654` → `:502`). It does **not** open Zoom. See
[§2](#2-demo-triggers-vs-production-behaviour) — the client asked specifically
that this be called out, and it is the first row of that table.

### States and transitions

```
  banner hidden ──"Join video call"──► banner shown (above "Your tasks for today")

  banner ──"Share my thoughts"──► modal opens at 'mood'
  banner ──"Skip"──► skipConfirmOpen
      skipConfirmOpen ──"Skip this feedback"──► banner hidden
      skipConfirmOpen ──"Go back"──► dialog closes, banner stays

  ── inside the modal (SessionFeedbackModal.tsx:45) ──
  mood ──Continue──► details        [blocked until a mood is chosen]
  mood ──Cancel──► closed
  details ──"Submit Feedback"──► thanks       ← ⚠️ NO WRITE HAPPENS HERE
  details ──"Go Back"──► mood
  thanks ──Close──► closed
  any ──Escape / backdrop click──► closed

  reopening resets to 'mood' with nothing chosen (:414)
```

**Five mood states** (`MOODS`, `:68`): Very good / Good / Okay / Not Great /
Very Bad. Each is a committed Figma export with its own resting **and selected**
artwork — the selected pillow is a *different export*, not a tinted one.

### What persists

**Nothing.** `mood` and `details` are `useState` (`:408-409`). **"Submit
Feedback" advances the step and writes nowhere. There is no feedback store slice
at all.**

### Interrupted flow

| Interruption | Result |
|---|---|
| **Escape** / backdrop | closes; everything typed is lost with no confirmation |
| Reopening | resets to `mood`, nothing chosen |
| Browser **Back** | navigates the page underneath; the modal unmounts |
| **Reload** | the banner is gone too — it is `useState` on Home |

### Focus

- The heading is focused from a **callback ref per step** (`:475`).
- **Tab is trapped**; Escape closes.
- On close, focus is restored to the trigger **only if focus is still inside the
  closing panel** (`:441`) — otherwise the restore would yank the reader back
  from wherever they have since navigated.

### One thing to get right when you wire it

`sessionNumber` must be **the internal number of the session just completed**,
not the next one. Home derives the banner's ordinal from the last *completed*
session (`ConsumerHomePage.tsx:531`), and that derivation was wrong once — it
read `nextPlannedSession`, so the banner announced *"You finished your 4th
session"* directly above a card reading *"Coaching session: 4 of 6 · Scheduled"*.
**Verified correct today: the banner reads "You finished your 3rd session".**

---

## 1.6 Need help

**File** `src/pages/consumer/ConsumerHelpPage.tsx`.

**Not a header tab.** Reached from the account menu, the hamburger drawer, Home's
closing "Click here to get help" link, and the opt-out card's inline link.

**Not a multi-step flow.** One page, four regions:

| Region | Source | State |
|---|---|---|
| **Contact card** | `RESEARCH_CONTACT` (`:70`) | rendered as `tel:` and `mailto:` links |
| **FAQ** | `FAQ_SECTIONS` (`:98`), four sections of 4 / 5 / 3 / 2 questions | each row an independent `open` boolean with `aria-expanded` + `aria-controls` |
| **Search** | `questionMatches` (`:254`) | **not rendered** — gated behind `const SEARCH_ENABLED: boolean = false` (`:229`) |
| **Crisis lines** | `CRISIS_LINES` (`:78`) | "Call 000" and Beyond Blue "Call 1300 22 4636" |

Three content facts that must not be lost in a rebuild:

- ⚠️ **The research phone number is a UK Ofcom drama-range number on an
  Australian study.** It is a stand-in and must be replaced before any
  participant sees it. The email (`rosemary.vance@monash.example.edu`) also does not
  match the seed researcher (`Claire Donnelly`).
- ⚠️ **The two crisis numbers are real and current Australian numbers and must
  not be swapped for demo values.**
- **Every FAQ answer body is an honest "this answer has not been written yet"
  line.** The questions are plausible placeholders; the answers were deliberately
  not fabricated. This is a content task for the research team, not a code task.

**The search matcher is real** — word overlap, stop words dropped, `some` not
`every` — but the field is not rendered. The file's own note: if the flag is
still `false` next time, delete it and the three pieces it gates.

**The FAQ row's accordion motion** (chevron rotation, panel height, and why the
panel unmounts rather than animating to `height: 0`) is in `motion-spec.md` §8.2.

---

## 1.7 Opt out of the study

**File** `src/pages/consumer/ConsumerAccountPage.tsx:66-200`.

### States and transitions

```
  idle ──"Opt out of the study"──► step='message'

  step='message' ──Continue──► step='confirm'        (nothing written yet)
  step='message' ──Cancel────► closed, message cleared

  step='confirm' ──"Go back"──► step='message'       (the message is PRESERVED)
  step='confirm' ──"Yes, opt out"──► setDyadOptOut(dyadId, message || 'No message left')
                                     step = null ; justOptedOut = true
```

**⚠️ The two steps are two mutually-exclusive `ConfirmDialog`s, not one dialog
whose props switch.** That is deliberate: the incoming step has to actually
mount, so its focus-on-open effect runs. Switching props in place leaves focus on
the old step's button.

**The message is optional on purpose.** A direct instruction removed the reason
dropdown (*"do not ask for a reason for optout"*), and making the message
required would be asking for a reason by another name. It rides the existing
`optedOut.reason` string, which the researcher's own surface still labels
"Reason" — a naming compromise, flagged rather than hidden.

### What persists

`setDyadOptOut` writes `{ reason, date }` **in memory only**, stamped with the
frozen `TODAY`. A reload restores the seed and the consumer is opted back in.

### What changes portal-wide afterwards

| Surface | Change |
|---|---|
| **Every consumer page** | a persistent, **non-dismissible** red `OptedOutBanner` at the top of `main` (`ConsumerShell.tsx:42,441`), which takes over the `topBanner` slot entirely |
| **My profile** | the opt-out card is replaced by *"You have opted out — You opted out on {date}. Someone from the research team will be in touch with you."* |
| **Everything else** | **nothing** |

**⚠️ That last row is the load-bearing product fact.** Direct correction,
recorded at `ConsumerHomePage.tsx:347` and `ConsumerAccountPage.tsx:46`:
*"optingout for consumer does noting on their end"*. **Sessions, modules, the
diary and the coach card all keep working.** An earlier build withheld the Zoom
link and said access was gone, which is a consequence the platform does not
deliver. Opting out **records a request**; the research team follows it up
off-platform.

Two consequences for whoever builds this for real: the endpoint **must notify the
research team**, because the copy promises "someone will be in touch" and that
promise *is* the entire behaviour; and nothing in the UI should start gating
content on `optedOut` without a product decision to change that.

### Interrupted flow

| Interruption | Result |
|---|---|
| **Cancel** at step 1 | closed, message cleared |
| **"Go back"** at step 2 | returns to step 1 with the message intact |
| **Escape** / backdrop at either step | closes the whole flow; nothing written |
| **Reload** after confirming | the opt-out is gone — nothing persists |

### Focus

Confirming **unmounts the card that triggered it**, so `ConfirmDialog`'s restore
has nothing to return to. `justOptedOut` gates an effect (`:97`) that focuses the
new "You have opted out" heading.

**The gate matters:** keying the effect on `dyad.optedOut` instead would yank
focus mid-document for an already-opted-out consumer merely *arriving* on the
page.

### Also on this page

`ConsumerPersonCard` ×2 (PLE first, then carer), each with a local `editing`
boolean editing exactly `name`, `age`, `email` and `phone`, committing through
`updateDyadPerson`. **That write is real** (in memory). A research participant
editing their own record needs an audit trail — see `integration-points.md`.

---

## 1.8 The hamburger drawer

**File** `src/components/consumer/ConsumerMenuDrawer.tsx`, **mounted once above
the router** (`App.tsx:89`).

**Open state is the module-scoped `consumerMenuReveal` store**
(`consumerMenuReveal.ts:62`), **not** shell state, because navigating unmounts
every shell. The drawer's Menu trigger is `min-[1200px]:hidden`, so below 1200px
**this drawer IS the navigation**.

### States and transitions

```
  closed ──header Menu button──► openConsumerMenu(dyadId)

  open ──row tap──► closeConsumerMenu() ; navigate(to) ; rAF → focus #main-content
  open ──X or Escape──► pulseContentReveal() ; closeConsumerMenu() ; rAF → focus [aria-label="Menu"]
  open ──"Log out"──► signOutOfTraining() ; navigate('/')      ← see §2
```

**Rows** (`:74`): Home · My Modules · My profile · Need help · **Switch portal**.

**Log out is deliberately not a row** — it sits centred below the list as a red
pill, because the header's desktop cluster is hidden below 1200px and a phone
would otherwise have no way out.

### ⚠️ The two close paths differ, and the difference is the whole design

- **A row tap** (`:172`) navigates **and** closes in the same frame. The new page
  mounts underneath and plays its own `ConsumerContentReveal` on mount while the
  shutter is still rising — one overlapping gesture, ~400ms. It does **not**
  pulse the reveal signal: the mount already animates it, and pulsing too would
  animate the *outgoing* page.
- **X / Escape** (`:192`) is not a navigation, so there is no mount to animate.
  It fires `pulseContentReveal()` **as the close starts**. Firing it on
  `onExitComplete` put the content's entrance at 440ms — after the shutter had
  gone — reading as two events rather than one.

`pulseContentReveal` **increments a token rather than flipping a boolean**, so
consecutive closes each fire without needing a reset render.

### Side effects while open

Scroll lock via root `overflow: hidden` + scrollbar-gap padding (`:97`); Tab
trapped (`:117`); Escape closes with `stopPropagation`.

### Interrupted flow

| Interruption | Result |
|---|---|
| **Escape** | closes, focus returns to the Menu button |
| Browser **Back** while open | the drawer survives the navigation (it is above the router) and stays open over the new page |
| **Reload** | closed — the store is not persisted |

### Focus

- The close button is focused from a **callback ref** (`:93`), not an effect —
  under `AnimatePresence` the drawer mounts a commit later than the state change.
- On dismiss, **the Menu trigger is re-found by query, not by a ref** (`:192`),
  because this component outlives the header that owns the trigger and a captured
  ref can point at a node a navigation has replaced.

---

## 1.9 The accessibility menu

**File** `src/components/consumer/AccessibilityMenu.tsx`. A `@base-ui/react`
`Popover` in the header, anchored to a virtual rect at the header's bottom edge.
Trigger is a 44px white disc with a 2px `ink` ring.

Three tiles, all wired to the module-scoped text-scale store
(`data/consumerTextScale.ts`):

| Tile | Action | Spent when |
|---|---|---|
| Increase Text | `increaseTextSize()` | at the top of the ladder (150%) |
| Decrease Text | `decreaseTextSize()` | at 100% |
| Reset Text | `resetTextSize()` | already at 100% |

**The ladder is `[1, 1.125, 1.25, 1.375, 1.5]`** (`consumerTextScale.ts:36`) —
five rungs, 12.5% apart, **starting at 100%**.

**⚠️ It must not go below 1, and this is a corrected defect.** The ladder
previously began at 0.875, which multiplied this portal's 16px floor down to 14px
on every body-copy element — a setting that made text *less* readable, offered to
an audience defined by not being able to read it, and in direct breach of the
portal's own "nothing below 16px" rule. **"Decrease" now means "step back down
toward 100%", never below it.**

A 12.5% step is also deliberate: a 5% step reads as nothing happening and invites
a second press.

### Announcement and disabled state

The current percentage is rendered in an `aria-live="polite"` span (`:319`), so a
press has an announced result even for a reader who cannot see the change.

**A spent tile is `aria-disabled`, not `disabled`** — it keeps its tab stop and
says why via `sr-only` text. `disabled` would drop it out of the tab order
mid-interaction, moving the two controls either side of it under a reader's
fingers.

### How the scale is applied

```tsx
// ConsumerShell.tsx:437
<motion.main style={{ zoom: scale }} />
```

**Scoped to `<main>`, so the header — and therefore this menu — holds still while
it is being used.** `zoom` is used rather than a root font-size because this
portal sizes much of its type in literal px; a font-size change would move half
the page and leave half put.

**⚠️ The hamburger drawer needed an explicit fix to follow this.** It is mounted
above the routes in `App.tsx`, so it inherited nothing from `<main>`'s `zoom`.
Below 1200px that drawer *is* the navigation, so a reader at 150% got a
full-size menu. It now scales with the control.

### Persistence

**None.** A reader who needs 150% gets 100% again on their next visit. This is
the single most user-hostile consequence of §3.1 and the first one worth fixing.

---

# §2 Demo triggers vs. production behaviour

Everything in this table is prototype scaffolding. **An engineer will otherwise
rebuild some of it by mistake, or ship it.**

The first row is the one the client asked to have called out by name.

| What you click | What it changes | What drives it in the real product | `file:line` | Keep or delete |
|---|---|---|---|---|
| ⚠️ **"Join video call"** on Home's next-session card | **Toggles the post-session feedback banner.** It does **not** open Zoom, and nothing about it says so on screen | Two separate things: a real `<a href={row.zoomLink}>` join link, and a **session-finished signal** from the coach marking the session complete, which is what should raise the feedback banner | `ConsumerHomePage.tsx:467` (the button), `:654` (the handler), `:502` (the state). The comment at `:451` calls it *"a demo switch standing in for the 'session finished' signal the platform does not have yet"* | **Delete.** Split into a real Join anchor and a server-driven banner. `zoomLink` is already on the record, so the anchor is a one-line revert |
| **"Skip"** on the feedback banner | Hides the banner for this page instance only | A server-recorded decline, so the prompt does not return for that session | `ConsumerHomePage.tsx` (`skipConfirmOpen`) | Keep the confirm dialog, wire the outcome |
| **"Submit Feedback"** in the feedback modal | Advances to the thank-you screen. **Writes nothing** | `POST` mood + free text | `SessionFeedbackModal.tsx` (the `details → thanks` transition) | Keep the UI, add the write |
| **"Finish module"** | Navigates to the completion screen. **No progress, no reflection answers and no share flag are written** | `POST` module completion + reflection answers + share consent | `ConsumerModulePage.tsx:1353` | Keep the UI, add the write |
| **Any module CTA other than Module 4** | Renders a focusable, `aria-disabled` button with an `sr-only` "(coming soon — this module is not available yet)" | Every module has content | `LessonCards.tsx:135-160` | **Keep the degradation; it is honest.** Preserve the `aria-disabled` + `sr-only` convention when you wire them |
| **"Download the guide"** (module summary) | Nothing — `aria-disabled` + `sr-only` "(coming soon)" | A real PDF endpoint | `ResourceCard.tsx:276` | Keep the treatment, wire the file |
| **"Switch portal"** (account menu and drawer) | `navigate('/')`, which redirects **straight back** to `/consumer/dyad-011` | A real portal switcher, or nothing — a consumer has one portal | `ConsumerHeader.tsx:37`, `ConsumerMenuDrawer.tsx:79` | **Delete.** It is a dead loop in this package |
| **"Log out"** (header pill and drawer) | `signOutOfTraining()` removes a `sessionStorage` key **nothing ever sets**, then `navigate('/')` → straight back in | Real session termination | `ConsumerHeader.tsx:553`, `ConsumerMenuDrawer.tsx:357`, `data/auth.ts:11` | **Keep the seam, replace the body.** `auth.ts` is vestigial and comprehensively misnamed — it is named for a training portal that is not in this package |
| **Any URL at all** | `/`, `/consumer`, and every unmatched path all land on `dyad-011` | `:dyadId` comes from the authenticated session | `App.tsx:50,51,76` | **Keep as a documented seam** (`integration-points.md` §1), delete the hardcoded id |
| **Reloading the page** | Replays the 4-screen welcome flow, then the 5-step tour, on **every** load | Both shown once per account, server-side | `ConsumerShell.tsx:35`, `consumerOnboarding.ts:25` | Keep the flows, add persistence |
| **Text size buttons** | Work correctly; **reset on reload** | Persist per device | `consumerTextScale.ts:43` | Keep, add persistence |
| **Help page search** | Not rendered at all; the matcher exists and works | Real FAQ search | `ConsumerHelpPage.tsx:229` | Ship it or delete the flag and its three gated pieces |
| **Every FAQ answer** | Opens onto "this answer has not been written yet" | Real answers from the research team | `ConsumerHelpPage.tsx:98` | Content task, not code |
| **Research contact phone** | `tel:` to a **UK drama-range number** on an Australian study | The real study number | `ConsumerHelpPage.tsx:70` | ⚠️ **Replace before any participant sees it** |
| **Coach portrait** | A placeholder illustration for **every** coach | A real photo, or a deliberate no-photo design | `CoachCard.tsx:141` | Product decision |
| **The video player** | A grey block. **No video or audio asset exists anywhere in `public/`** | Real video + audio + captions behind a signed URL | `EpisodePanel.tsx:391` | See `integration-points.md` |
| **Chapter timestamps** | Estimated at 140 words/min from the script | Real cut points from the edit | `consumerLessonContent.ts:47` | Replace on first cut |
| **Every date on screen** | Derived from a frozen `TODAY = '2026-08-26'` | The real clock, in the consumer's own timezone | `data/format.ts:45` | **The highest-impact seam.** See `data-model.md` and `integration-points.md` |

**No state cyclers, role switchers or stage switchers remain in this package.**
Home had a demo state cycler; it was replaced with a real link into the module.

---

# §3 Cross-cutting facts

## 3.1 Nothing persists, and the welcome flow compounds it

**There is no `localStorage`, no `sessionStorage`, no network and no persistence
of any kind.** State lives in one React context over seeded fixtures, plus four
module-scoped stores. Reloading restores the seed exactly.

Both facts are deliberate and documented (`research-store.tsx:47`,
`consumerOnboarding.ts`), but they **compound** in a way worth hearing as one
statement:

> **A hard reload mid-flow drops the reader into the full four-screen welcome and
> loses their answers.**

Measured: reloaded at `#/consumer/dyad-011/diary` after answering Q1 → `<h1>` =
"Welcome to Care2Sleep", diary answers gone. Completing the welcome then
navigates to `/consumer/:id` (`ConsumerShell.tsx:313`), **so the reader does not
even return to the diary.**

The navigation itself is correct — it fixes a real earlier bug — but the
combination means **there is no resume path from any interruption anywhere in the
portal**. Three separate things need to change to fix it: per-account persistence
of the two first-run flags, a draft store for the diary and the reflection, and a
resume destination.

## 3.2 Which writes are real

| Write | Action | Real? |
|---|---|---|
| Sleep diary, all 9 questions × both members | `submitSleepDiary` | ✅ writes to the store; Home reflects it immediately. Verified end to end |
| Opt out of the study | `setDyadOptOut` | ✅ writes; the red banner appears portal-wide |
| Edit PLE / carer details | `updateDyadPerson` | ✅ writes `name`, `age`, `email`, `phone` |
| Module progress | — | ❌ no action exists |
| Reflection answers | — | ❌ collected, gated, reviewable, editable — then discarded |
| Share-with-coach consent | — | ❌ no destination exists in the data model |
| Session feedback (mood + comment) | — | ❌ no store slice at all |

Everything else the consumer sees is a **read** off seeded data.

## 3.3 Focus, in one table

This project's most-repeated defect is focus falling to `<body>` after a control
unmounts. Every transition below was measured.

| Transition | Mechanism | Lands on |
|---|---|---|
| Welcome step change | `useEffect` on `step` (`ConsumerWelcome.tsx:469`) | the incoming `<h1>` |
| Welcome → Home | shell effect gated `&& !tourOpen` (`ConsumerShell.tsx:338`) | `#main-content` — or **nothing**, when the tour is opening |
| Tour step change | **callback ref** (`ConsumerOnboardingTour.tsx:210`) | the incoming `<h2>` |
| Tour close (any route) | `dismissTour` (`ConsumerShell.tsx:286`) | `#main-content` |
| Diary stage / question change | `useEffect` on `[stage, qIndex]` (`:184`) | the stage or question heading |
| Module stage change | **callback ref** (`ConsumerModulePage.tsx:1313`) | the incoming heading |
| Summary card flip | effect guarded on the **previous value** (`ModuleSummaryCards.tsx:692`) | the back's title, or the front's button |
| Feedback modal step change | **callback ref** (`SessionFeedbackModal.tsx:475`) | the incoming heading |
| Feedback modal close | conditional restore (`:441`) | the trigger, **only if** focus was still inside the panel |
| Drawer open | **callback ref** (`ConsumerMenuDrawer.tsx:93`) | the close button |
| Drawer row tap | `rAF` after navigate (`:172`) | `#main-content` on the new page |
| Drawer X / Escape | `rAF`, trigger re-found by **query** (`:192`) | the Menu button |
| Opt-out confirmed | effect gated on `justOptedOut` (`ConsumerAccountPage.tsx:97`) | the "You have opted out" heading |
| Resource-card jump link | `scrollTo` + `.focus()` (`ConsumerModulePage.tsx:812`) | the card itself |

**The rule that decides between the two mechanisms:** under
`AnimatePresence mode="wait"` the incoming node mounts a commit *later* than the
state change, so an effect keyed on the step focuses the outgoing element and
never fires again — use a **callback ref**, which is keyed on the element. Where
every target stays mounted (the welcome's four headings, the diary's `popLayout`
stepper, the flip card's two faces), an effect is correct. Full explanation in
`motion-spec.md` §11 Trap 2.

## 3.4 Inert controls — the house convention

Around a dozen controls are designed, visible, and not yet wired. **They all
follow one convention**, and it should be preserved when you wire them:

> focusable · `aria-disabled="true"` · an `sr-only` reason · **never** the
> `disabled` attribute, and **never** silently dead.

`disabled` drops an element out of the tab order mid-interaction, moving the
controls either side of it under a reader's fingers; it also strips the
accessible name from some screen readers. `aria-disabled` conveys the same state
and keeps the element addressable.

Three "Play module" CTAs on My Modules were the exception until recently — styled
48px buttons with a real `aria-label` and **no handler at all**, announcing a
working feature to a screen reader. They now follow the convention
(`LessonCards.tsx:135-160`).
