# Care2Sleep — Trainee & Coach Portal: engineering overview

Read this first.

This document orients you: what the package is, how it is put together, how a
screen actually renders, the conventions you must keep, and the traps that will
otherwise cost you a day. It deliberately does **not** restate the schema, the
animation table or the token list — those have their own documents.

| Document | What it answers |
|---|---|
| `orchestration-flows.md` | Eleven flows as explicit state machines. **§1 is the demo-trigger table — read it before you touch anything.** |
| `data-model.md` | Every type and field, stored vs. derived, invariants, seed personas. |
| `integration-points.md` | Every seam a backend or third party attaches to: the store's 32 actions, auth, Zoom, Fitbit, upload, CSV, the clock. |
| `motion-spec.md` | All 30 animations with exact durations, easings and exit behaviour. |
| `design-handoff.md` / `design-tokens.md` | The measured visual spec and the token tables. |
| `CHANGELOG.md` | What changed between hand-off revisions of this package. |
| `layout-audit.js` | The layout-measurement script. See §10. |

Everything below was verified against the code in this package on **2026-08-31**.

---

## 1. What this is, and what it is not

A **runnable design prototype of the Care2Sleep Coach Delivery Portal**. It
covers one person's journey through two stages:

- **Trainee** — an aged care worker working through the COACH certification
  pathway: the welcome flow, the training dashboard, the six-stage pathway rail,
  My Learning, the module player, My Notes, My Profile.
- **Coach** — the same person once certified, delivering SPACES sessions: the
  coach dashboard, the client list, the per-client record, My Schedule, case
  notes and reflections.

**The prototype is the specification.** Its screens, copy, states, spacing and
accessibility behaviour are deliberate, settled over roughly forty rounds of
design iteration, much of it by measurement rather than by eye. The reasoning is
recorded in comments in the files themselves. Treat those comments as part of
the spec — see §8.7.

### What it is not

| Not present | What that means in practice |
|---|---|
| **No backend** | No server, no API client, no network call. The only `fetch()` in the source pulls a local SVG so the certificate download has a file to hand over (`DeliveryHomePage.tsx`, `downloadCertificate`). |
| **No authentication or authorisation** | The signed-in coach is the hardcoded string `'helen-zhang'` in four page files, plus a second, independent identity object in `data/portal.ts`. "Sign out" clears a `sessionStorage` key nothing ever writes (`data/auth.ts`). No route is guarded. |
| **No persistence** | State is React `useState` inside one context over seeded fixtures. A reload restores the seed data exactly. Two `localStorage` keys are the only exceptions (§2.3). |
| **No database** | `data/research.ts` and `data/spaces.ts` are TypeScript fixture arrays — curated demo records, not a schema export. |
| **No tests** | No test runner, no test file, no CI config. |
| **Not a starting codebase** | It is the reference you design a real schema and build a production app *from*. |

It is also not fully wired inside its own scope, and that is deliberate:
**around 21 controls are drawn but have no write path**, and **7 of the store's
32 actions have no caller** while still having live *read* paths. Both are
catalogued in `integration-points.md`. They are unfinished features and
specification of intent — not bugs to quietly delete.

---

## 2. Architecture

### 2.1 Stack

| Piece | Version | Notes |
|---|---|---|
| React | 19 | `StrictMode` on. |
| TypeScript | ~6.0 | `tsc -b` is the typecheck; see the trap in §8.1. |
| Vite | 8 | `@vitejs/plugin-react`. Rolldown-based; its parser is stricter than `tsc`. |
| Tailwind CSS | v4 | Via `@tailwindcss/vite`. All tokens are CSS custom properties in `src/index.css` — there is no `tailwind.config.js`. |
| framer-motion | 12 | Every animation. Wrapped globally in `MotionConfig reducedMotion="user"` at the root. |
| react-router-dom | 7 | `BrowserRouter`, plus `AnimatePresence` keyed on `location.pathname` for route transitions. |
| `@base-ui/react` | 1.6 | Only the header account menu (`Menu.Root`) uses it. |
| lucide-react | 1.25 | **The only icon source.** Never a hand-written `<svg>` or a Figma-exported glyph. |
| recharts | 3.10 | Charting; present as a dependency. |

Fonts are self-hosted through `@fontsource-variable/inter`. Inter is the whole
type family; `--font-sans` and `--font-display` both resolve to it but stay
separate tokens.

### 2.2 State: one context over fixtures

There is exactly **one** application store.

```
data/research.ts        seed fixtures — coaches, the researcher, group sessions
data/spaces.ts          seed fixtures — dyads, coaches, notes, session plans,
                        plus most of the derived helpers (1,697 lines)
data/research-store.tsx <ResearchProvider> — useState over copies of the above
data/research-context.ts the context object + the useResearch() hook
```

`ResearchProvider` wraps the whole app in `App.tsx`. Any component reads it with
`useResearch()`. The store exposes 32 members: state slices (`coaches`,
`consumerDyads`, `supervisionNotes`, `sessionCompletion`, `sessionPlans`,
`phaseCompletion`, `manualModuleUnlocks`, …) and the actions that mutate them.

Two structural details worth knowing before you edit anything in `data/`:

1. **`research-store.tsx` exports exactly one thing — the `ResearchProvider`
   component — on purpose.** Mixing a component and a non-component export in
   one module defeats React Fast Refresh: Vite falls back to a silent full
   reload, remounting the provider and wiping all in-memory state mid-session.
   That is why `TODAY`/`formatDate` live in `data/format.ts` and `useResearch`
   lives in `data/research-context.ts`. Do not move them back.
2. **The store is seeded from copies, not references** — reloading the page is
   the reset button, and there is no other one.

### 2.3 Everything outside the context

Five smaller pieces of state live outside the context, all module-scoped rather
than component-scoped. The reason is the same in every case and it is
load-bearing: **every page under `/delivery` mounts its own `DeliveryShell`**,
so anything held in `useState` inside a shell resets the moment the user
navigates. This has already produced a real bug (the onboarding flow replaying
after its CTA started routing to another page).

| Module | Holds | Persisted? |
|---|---|---|
| `data/coachStage.ts` | `trainee` \| `coach` — the demo stage switch. `useSyncExternalStore`. | No |
| `data/coachNotes.ts` | The trainee's My Notes list. `useSyncExternalStore`. | No |
| `data/deliveryTour.ts` | Tour step array + index. | No |
| `components/delivery/DeliveryShell.tsx` | `onboardingDismissed`, a plain module `let`. | No |
| `pages/training-v2/moduleProgressStore.ts` | Module-player step index per module. | **Yes — `localStorage`** |

There are **two** `localStorage` keys in the package, not one:

- module-player progress (`moduleProgressStore.ts`), and
- the sidebar's collapsed flag (`DeliverySidebar.tsx`, `COLLAPSE_KEY`).

Nothing else persists across a reload.

---

## 3. Directory map

Paths are relative to the package root.

```
docs/                    This document and its companions, plus layout-audit.js
_audit/                  The source audit documents these docs were written from
assets/                  Source artwork + ANCHORING.md (how the illustrations compose)
app/                     The runnable Vite app
```

Inside `app/`:

```
public/
  illustrations/         Committed SVG/PNG artwork: onboarding, home, stage,
                         tour, debrief, confetti (a 20-frame PNG sequence),
                         certificate.svg / certificate-earned.svg
  logos/                 Three real downloaded brand PNGs (Gmail/Calendar/Zoom)
  avatars/               One trainee photo, used by the onboarding photo card
  _audit/layout-audit.js Served copy of the audit script, so you can load it
                         from the running app at /_audit/layout-audit.js
src/
  main.tsx               Root render. Wraps the app in MotionConfig + Router.
  App.tsx                The whole route table (§4).
  index.css              THE design system. Every colour, type step, radius and
                         shadow token. Authoritative over design-tokens.md.
  lib/                   cn() (clsx + tailwind-merge, with the font-size
                         registry) and downloadCsv().
  data/                  Fixtures, the store, and every derived helper. See §2.
  components/
    ui/                  Primitives: button, card, badge, avatar, progress,
                         separator, tooltip, segmented-progress-bar.
    shared/              Components used by more than one surface, plus the six
                         extracted out of the (now absent) researcher pages.
    delivery/            Coach-portal-only chrome: shell, sidebar, onboarding,
                         tour, doodles, confetti, priorities, stage switcher.
    account/             The two profile cards (notification prefs, password).
    AppHeader.tsx        The global top bar. SearchInput, ModuleCard,
    SearchInput.tsx      PlaceholderCard sit alongside it.
  pages/
    PortalSwitcherPage   The "/" landing card.
    delivery/            The six /delivery routes.
    training-v2/         Module overview page, the pathway helpers, the
                         localStorage progress store, and:
      player/            The in-module player: page, outline rail, footer,
                         slide layout, and one component per slide type.
```

**No file remains in a `research/` or `consumer/` directory.** That directory
name would tell you something untrue about who owns the code. Six components
that the coach portal genuinely renders were extracted or moved into
`components/shared/`; see `CHANGELOG.md` for the exact list.

---

## 4. The routes

All of them, from `App.tsx`. There are no others, and no route is guarded.

| Path | Component | What the screen is for |
|---|---|---|
| `/` | `PortalSwitcherPage` | Landing page. A single Coach Delivery Portal card. |
| `/delivery` | `DeliveryHomePage` | **Two entirely different dashboards** — see below. |
| `/delivery/learning` | `DeliveryLearningHomePage` | My Learning: Part A / Part B gated curriculum carousels over the real 11 modules. |
| `/delivery/notes` | `DeliveryNotesPage` | My Notes — the trainee's own notebook. Accepts `?title=` to pre-fill and focus the write box. |
| `/delivery/meetings` | `DeliveryMeetingsPage` | My Schedule. **Coach stage only** — the sidebar hides it for a trainee via a `coachOnly` nav flag. |
| `/delivery/consumers/:dyadId` | `DeliveryConsumerDetailPage` | The per-client record. Five tabs: Coaching workspace, Case notes, Client sleep & health data, My reflections, Client Profile Details. |
| `/delivery/account` | `DeliveryAccountPage` | My Profile: personal details, study details, notification preferences, opt-out. |
| `/training-v2/module/:moduleId/overview` | `ModuleOverviewPage` | A module's hero, outline and outcomes. The hub between a My Learning card and the player. |
| `/training-v2/module/:moduleId/play` | `ModulePlayerPage` | The in-module player. Full-viewport — no `DeliveryShell`. Returns to the page named in `?from=`. |
| `*` | `<Navigate to="/" replace>` | Unknown paths land on the switcher. |

### `/delivery` renders two different dashboards

`DeliveryHomePage` reads `useCoachStage()` and branches. The two branches share
a greeting block and the shell props, and nothing else:

- **`trainee`** → `TraineeHome`: a derived hero banner (six states), the COACH
  pathway rail, a per-stage card, a learning-progress card and a meeting card.
- **`coach`** → the welcome banner, a 2×2 KPI grid paired with
  `PrioritiesSection`, a `WaveDivider`, and the clients table.

The switch is the **"Demo view: Trainee / Coach"** control at bottom right
(`CoachStageSwitcher`). It is a review tool, not product chrome, and it resets
to `trainee` on every page load. In production the driver is the coach's real
certification state. Do not repurpose the switcher as a role switch — delete it
when a real certification write path exists.

Also note: `/training-v2` itself is **not** a route. The standalone coach
training portal home was retired; only the two module routes remain under that
prefix, reached from My Learning.

---

## 5. How a page renders — `/delivery` end to end

`/delivery` is the richest route in the package. The chain is:

**1 — Root.** `main.tsx` renders `<MotionConfig reducedMotion="user">` →
`<BrowserRouter>` → `<App/>`. `App.tsx` adds `<ResearchProvider>` and an
`AnimatePresence` keyed on `location.pathname`, then matches the route.

**2 — Page component.** `DeliveryHomePage` runs first:

```
const stage = useCoachStage()                     // module singleton
const { consumerDyads } = useResearch()           // context
const dyads = dyadsForCoach(COACH_ID)             // seed helper …
  .map(seed => consumerDyads.find(d => d.id === seed.id) ?? seed)
```

That last line is the pattern to copy: **seed data supplies the caseload, the
store supplies the live version of each record.** Reading only the seed would
miss edits made this session; reading only the store would miss the
coach-to-dyad relation, which lives in the fixtures.

**3 — Shell.** Both branches render `<DeliveryShell accountLabel="Helen Zhang"
contentClassName="px-0 pt-16 md:px-0 md:pt-16">`. The shell owns:

- the **first-run onboarding gate** — while `onboardingDismissed` is false it
  renders `DeliveryOnboarding` *instead of* `children` and suppresses
  `AppHeader` entirely;
- the **tour handoff** — its `completeOnboarding(to)` navigates, then starts the
  first-run tour after `TOUR_START_DELAY_MS`, a delay written as the sum of the
  reveal timings it must clear rather than as a literal;
- the header, the floating `purple-200` sidebar card, the content column grid
  (`24 + 200 + 48 + 961 + 48` at 1281px, hence the deliberately asymmetric
  `pl-6 pr-12`), and `CoachStageSwitcher`.

**4 — Stage branch.** `stage === 'trainee'` renders `<TraineeHome/>`; otherwise
the coach greeting, `CoachWelcomeBanner`, `<CoachHome dyads={dyads}/>` and
`<DeliveryTour/>`.

**5 — Derived helpers, not stored fields.** Almost nothing on this page is read
straight off a record. The trainee branch calls `resumableModule()`,
`completedModulesCount` and `realPlayerContentId()` from
`pages/training-v2/pathway.ts`; the coach branch calls `dyadsForCoach`,
`isPlanSet`, `nextPlannedSession`, `nextUpcomingSessionNumber`,
`catchupSessionsCompleted`, `sessionRowLabel` and `SPACES_CATCHUP_COUNT` from
`data/spaces.ts`. **When two surfaces show the same fact, they must call the
same helper.** Every recorded instance of two screens contradicting each other
in this project came from two fields being read where one derivation was
wanted.

**6 — Components.** `HomeStageCard` + `StageList` + `LockedSessionCta` render
the per-stage card (one constant container, seven variants — indices resolved
**by label**, never by number, so inserting a stage cannot silently repoint a
banner). `PrioritiesSection`, `StatCard`, `MeetingsSection`, `WaveDivider`,
`Chip`, `EmptyState` and `Confetti` do the rest.

---

## 6. Conventions to follow

These are house style, established by measurement and repeated review. A design
that conflicts with one of them loses.

### 6.1 The three canonical button styles

The app decides how a button looks; a design decides where it goes and what it
says. All three carry `text-caption-medium` (14px / 500 / -0.224px tracking) —
never a hardcoded size or tracking, and never `font-semibold`, which silently
overrides the token.

| Style | Classes |
|---|---|
| Primary filled | `h-9 rounded-full bg-primary px-[18px] text-caption-medium text-white hover:bg-primary-hover` |
| Primary outline | the same pill with `border border-primary text-primary hover:bg-primary/5` |
| Utility | `h-9 rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted hover:bg-divider-soft` |

`bg-pearl` is a cool grey. It is correct inside a white card and reads as a
foreign patch directly on the warm `--background` (`#fffcfa`) page canvas — a
utility button sitting on the canvas wants a transparent fill.

### 6.2 The 36px control-height floor — a floor, not a cap

`h-9` (36px) is the minimum for any interactive control, over anything a design
specifies. Two consequences that have both shipped as real bugs:

- `h-9` is a *height*, not a `min-height`. A flex child in a fixed-height
  container needs `shrink-0`, or flex-shrink compresses it below the floor.
- Because it is a floor, **trainee CTAs are 44px** and that is correct, not
  drift. Do not "normalise" them down.

### 6.3 The card contract

`Card` supplies a **16px outer radius and a 1px `parchment` stroke by default**.
Do not repeat `rounded-lg border border-parchment` at a call site, and do not
reach for `ring-*` — a ring paints outside the box where a border is part of it.
A card that genuinely wants no outline passes `border-0`. `Card` also defaults to
`shadow-card` (a warm `2px 4px 16px rgba(230,194,127,0.2)`); a flat card must
pass `shadow-none` explicitly. Modals and menu popups are not cards.

Every `Card`-wrapped title gets exactly one `bg-card-header` band with a
`border-t border-hairline` divider above its content section. Documented
exception: pure message-plus-CTA cards with no distinct content section.

### 6.4 Sentence case

Card titles, headings and body copy are sentence case. This does not apply to
table column headers or tab labels.

### 6.5 The `viewerRole` prop pattern

Components rendered by more than one audience take
`viewerRole: 'researcher' | 'coach'` rather than hardcoding a noun or a
permission. In this package it is carried by `ProfileDetailsSections`,
`SleepDiaryFeed`, `SessionPlanEmptyBanner` and `SessionTracker`.

The distinctions it encodes are not all the same kind of thing, and the
difference matters:

- **Permissions** (withdraw from study, notification preferences, edit details)
  render **absent** for a coach, never disabled. A control a coach may never use
  is not a control, and a greyed-out "Withdraw from study" invites the question
  of who can press it.
- **Routing** (the assigned-coach name links to a Research Dashboard route)
  renders as plain text for a coach.

The `'researcher'` branch has no caller in this package. **Keep it.** It is the
specification of what a coach may *not* do, and forking the component to give
one audience different cards is exactly the drift it was created to end.

### 6.6 The unwired-control convention — preserve it

A control that is designed but has no write path yet renders as a **focusable
`<button>` with `aria-disabled="true"` and an `sr-only` "(coming soon)" cue** —
never a silently dead button, never a native `disabled`, and never omitted.
`InertButton` in `components/shared/MeetingsSection.tsx` is the canonical
implementation.

There are roughly 21 of these, and the discipline is complete: **zero
`href="#"`, zero `onClick={() => {}}`, zero handler-less buttons in the
package.** When you wire one, keep the pattern for the next one. Do not tidy
these away as dead code — they are the specification of intended behaviour.

(One exception exists and is a real defect, not the convention: the module
player's `ModulePlayerNav` uses native `disabled` with no accessible cue.)

---

## 7. Terminology that is load-bearing in code

**Terminology is audience-dependent.** Coach-facing surfaces say **client**;
researcher-facing surfaces say **consumer**. Same people, different reader. That
is why shared components take `viewerRole` instead of a string.

**Internal identifiers keep "consumer".** `ConsumerDyad`, `dyadId`,
`/delivery/consumers/:id`, `ConsumerDyad.patient`, `patientLog` — these are code,
not copy. Renaming them is a large diff with no user-visible effect. Do not read
them as terminology violations.

Other terms that carry meaning:

| Term | Rule |
|---|---|
| **Coach** | The aged care worker. Never "trainee" in product copy — "trainee" is a stage, not a job title. |
| **PLE** | Person with Lived Experience: the dyad member with dementia. Never "patient", never "PLWD". |
| **Annotation summary** | The coach's reflective output. **Never "report".** A reflection is written from a session debrief, not at will — no surface should list "write your reflection" as a standing to-do. |
| **Auto generated** | The label on a case note the platform drafted. **Never "AI generated"** in coach-facing copy, even though an AI drafts it. |
| **SIPTEA components** | Always "components" — never "criteria" or "dimensions". |
| **Certification** | Awarded on passing Placement 2. Never "graduation". |

**Never hardcode the number of COACH stages.** Read `PATHWAY_STAGE_COUNT_WORD`
and `PATHWAY_STAGE_SENTENCE` from `data/coachPathway.ts`. That sentence has been
written wrong three separate times — the design frames still say "five stages"
over a rail that draws six. `coachPathway.ts` lives in `data/` rather than in
`DeliveryHomePage` because the import chain
`DeliveryHomePage → DeliveryShell → DeliveryOnboarding` means the onboarding
flow cannot reach back into the page for the constant without closing a cycle.

Related: the rail itself is **six stages plus a certification column**, so it
draws seven columns. If a document says "seven stages", it is counting the
certification column.

---

## 8. Known traps

Each of these will cost you time if you meet it cold.

### 8.1 `tsc` passing is not proof the app builds

Vite's parser is stricter than TypeScript's in places. A `{/* … */}` comment
placed inside a JSX *attribute list* passed `tsc --noEmit` cleanly and was
rejected by Vite's transform — the page went blank behind a green typecheck.

After any JSX change, check **both**: run `npm run build`, and read the dev
server's own transform log. A blank page with a clean typecheck is this
failure, not a React bug.

Related: use `tsc -b`, not `tsc --noEmit`. With this project's config, plain
`--noEmit` silently checks zero files.

### 8.2 Three unconnected models of "has this coach completed this module"

This is the single most consequential schema decision in the package.

| Model | Where | Scope |
|---|---|---|
| `Coach.moduleRecords` | `data/research.ts` | Per coach. In this package it is read only by the store's `initialPhaseDates` derivation — nothing renders it. |
| `PATHWAY_MODULES_V2[].status` | `data/trainingPathwayV2.ts` | **A global constant, identical for every coach.** This is what My Learning, the pathway helpers and every progress figure on Home actually read. |
| A `localStorage` step index | `pages/training-v2/moduleProgressStore.ts` | Per module, per browser. What the player resumes from. |

They are not connected, and they disagree. In the full four-portal prototype the
disagreement was visible on screen — the researcher view reported 11 of 11
complete for the signed-in coach while her own My Learning page showed 1 of 11.
Removing the researcher pages hid the symptom; **all three models are still
here.**

Collapse them into one per-user module-progress record. That decision also
settles where knowledge-check answers and module feedback live — the player
currently persists neither. `ModuleFeedbackSlide` collects a star rating and a
comment and **discards both**; it is the only control in the portal that takes
real input and throws it away. The knowledge check likewise has no pass/fail
gate: you can answer every question wrong and proceed.

One more thing in the same file: `DEMO_PLAYER_REDIRECTS` in
`pages/training-v2/pathway.ts` points module 2 (`population-understanding`) at
module 5's content, because `understanding-sleep` is the **only** module with
authored content. Ten of eleven modules are empty. Any progress figure in the
portal is therefore partly fictional.

### 8.3 Session numbering — never render a raw number

Internally a dyad has 7 sessions numbered 1–7. **Session 1 is the unnumbered
"Planning" meeting**, so internal 2 is the client's "Session 1".

- `displaySessionNumber(n)` returns `n - 1`.
- `sessionRowLabel(n)` returns `'Planning'` for 1 and `'Session {n-1}'`
  otherwise. **Use this one.**
- `SPACES_CATCHUP_COUNT` is 6, not 7, and `catchupSessionsCompleted()` counts
  only the numbered catch-ups.

Rendering `session` directly produces the nonsensical "Session 0" and is off by
one everywhere else. Counting raw completion records produced a real bug where
one screen read "1 of 7" beside another reading "Next: Session 1".

### 8.4 Two write paths use the real wall clock, not the frozen `TODAY`

`TODAY = '2026-07-22'` (`data/format.ts`) is the frozen clock every fixture is
authored around. Two write paths ignore it and call `new Date()`, and a third
saves `date: TODAY` with a wall-clock `time`. The visible symptom: a note you
save lands weeks *after* everything else in the same table, and the gap widens
every day the package sits on a shelf.

A production build needs **one injectable clock** with every date path routed
through it, and the fixtures re-anchored in one pass. Related seed defect:
`dyad-011` carries sessions marked *completed* on future dates.

### 8.5 The signed-in coach is hardcoded in several places

`const COACH_ID = 'helen-zhang'` appears in four page files
(`DeliveryHomePage`, `DeliveryAccountPage`, `DeliveryMeetingsPage`,
`DeliveryConsumerDetailPage`). That is defensible — it is a record id standing
in for a session lookup.

What is not defensible, and will bite you, is that there is **a second identity
object** for the same person in `data/portal.ts` (`export const coach`), plus
hardcoded display strings (`accountLabel="Helen Zhang"`, `COACH_FIRST_NAME =
'Helen'`) at six call sites. Two independent representations of one user is how
a name ends up differing between the header and the page under it.

There is also no authorisation model at all. The study's own data-access matrix
— who may read a coach's client case notes, the endline-annotation-only rule for
expert assessors — **is not specified anywhere in this package.** It has to come
from the study team, and everything else is gated on it.

### 8.6 Files carrying `⚠️ UNREACHABLE IN THIS PACKAGE`

Three files carry that header comment and are retained on purpose:

- `pages/training-v2/ModuleTimeline.tsx` (~1,760 lines) — the old curriculum
  list, superseded by My Learning's carousels. Kept for its lock/unlock visual
  language and its auto-centring escape hatch, both of which were real defect
  fixes. **Read it for its rules; do not wire it back up.**
- `pages/training-v2/player/ModulePlayerHeader.tsx` — the player's old top bar,
  kept as the reference for a progress-bar treatment rendered nowhere else.
- `components/delivery/WidgetGrid.tsx` — the retired shortcut-tile system. Its
  widget-picker announcement is the origin of this app's
  `role="status" aria-live="polite"` sr-only pattern, which live components
  still follow. Deleting the file is safe; keep the pattern.

A fourth is flagged differently: `components/shared/UpcomingSessionsPanel.tsx`
carries `⚠️ COMPONENT UNUSED — only its TYPE is imported`. `DeliveryHomePage`
imports `UpcomingSessionRow` from it for typing; the component has no caller.
The day-grouped table that replaced it is `components/shared/MeetingsSection.tsx`.
**Move the type before you delete the file.**

Deleting any of these four is safe. Do not delete them by accident.

### 8.7 The comments are the specification

This is not a stylistic preference. Several comments in this codebase encode
fixes that were established by measurement, and more than one of them was
re-broken when the code was later "cleaned up". Examples you will meet:

- `DeliveryShell.tsx` carries a literal
  **"🚫 DO NOT ADD A SKIP BUTTON HERE"**. The trainee welcome flow is mandatory
  by study requirement. The optional `to` argument on `completeOnboarding` is
  retained orphaned capability from when a Skip did exist — it is not a hook
  awaiting reconnection.
- `TOUR_START_DELAY_MS` is written as a **sum of the timings it must clear**,
  not a literal, because every number it depends on has changed at least once.
  A coachmark measured mid-transform lands beside its anchor.
- Focus is moved deliberately at ~a dozen places where a control unmounts on
  activation. **Focus falling to `<body>` is this project's most-repeated
  defect** — it has shipped in six separate rounds. Assume it and test it.
- Stage indices are resolved by **label**, never by number
  (`REFLECTION_STAGE_INDEX` and friends), so reordering a stage cannot silently
  repoint a banner.
- `min-w-0` appears on grid and flex containers *and their cells* because items
  default to `min-width: auto`, and one wide child sizing its track has produced
  a real horizontal page scroll three times.

If a comment explains why a number is what it is, changing the number without
reading it is how the defect comes back.

### 8.8 Smaller ones, in one list

- **The welcome flow replays on every page load** and covers every `/delivery`
  route. Its final CTA hard-navigates to `/delivery` regardless of the URL you
  entered, so **no coach-portal page can be deep-linked** while it is in place.
  Fine for a demo; blocking for QA or a pilot.
- **Zoom links are fabricated** and render as real, clickable `zoom.us` anchors.
- **File upload discards the file.** The consent-document path is fully
  orphaned: stored and rendered, but with no reachable write.
- **CSV export runs client-side, is unlogged, and exports identified health
  data.** That is a governance problem before it is an engineering one.
- **No route reflows below desktop width.** The sidebar never collapses and the
  fixed chrome sums to 320px, so at a 375px viewport the content column is 55px
  wide, and at 320px it is zero, with real horizontal page scroll. This needs a
  responsive shell, not a patch.
- **The coach is simultaneously certified and at Stage 1.** `/delivery/account`
  shows a certification date (8 days after the frozen clock) and an enabled
  certificate download, while `/delivery` shows Stage 1 of the pathway.
  `DeliveryAccountPage` is the only coach-portal page with no stage branch, so
  no demo setting produces a self-consistent coach.
- **`/delivery/consumers/:dyadId` has one ownership check and it is wrong** —
  see `integration-points.md` §2.3.

---

## 9. What to build first

In order, with the reason. The first two unblock everything else.

1. **Identity, roles and the data-access matrix.** Not an engineering decision —
   the answers come from the study team. Every screen in this package assumes a
   single hardcoded user with unlimited rights; nothing about permissions can be
   designed until the matrix exists. Build authentication, a session, and a real
   `coachId` lookup replacing `COACH_ID` and `data/portal.ts`'s second identity
   object.
2. **One per-user module-progress record.** §8.2. Three models disagree today,
   and the same decision settles where knowledge-check answers and module
   feedback are stored — the player persists neither. Everything the trainee
   experience shows is derived from this one record.
3. **Session completion as an audited event, not a toggle.** Completing a
   session unlocks content for a participant in a clinical study. It needs a
   who, a when and an immutable record, not a boolean.
4. **The clock, and re-anchoring the fixtures.** One injectable clock, every
   date path through it. Doing this late means re-authoring impossible records
   (§8.4) that have accumulated in the meantime.
5. **Zoom.** Fabricated links currently render as live anchors — the highest-risk
   mock in the package because it looks entirely real.
6. **Persistence for the seven no-caller actions.** `addConsumer`,
   `updateSessionPlanRow`, `addAdHocMeeting`, `addManualRecording`,
   `addConsentDocument`, `removeConsentDocument`, `addDyadSessionRecording`.
   Each already has a live read path, so consent documents, session recordings
   and ad-hoc meetings render today with a severed write.
7. **A responsive shell.** §8.8. It is a Critical accessibility finding and it
   affects every route at once, so it is cheaper before the surface area grows.
8. **Fitbit** — including collapsing the two disagreeing sync-gap rules into one.
9. **The AI annotation tool.** The study's central reflective instrument is
   currently a six-field form. Design it against `research/SIPTEA Framework.docx`,
   not against the form.
10. **Attachments and CSV export.** Both are governance questions first.

---

## 10. How to verify a change

Run all four. None of them is redundant.

```bash
cd app

npm run build     # tsc -b && vite build — the real check
npm run lint      # oxlint
```

Verified in this package on 2026-08-31 with Node v24.18.0:

- `npm run build` — exit 0. `tsc -b` in ~3.5s; `vite build` in ~0.7s, 918 kB main
  chunk. Vite warns the chunk exceeds 500 kB; there is no code splitting. Fine
  for a prototype, worth addressing in production.
- `npm run lint` — exit 0, **7 pre-existing `react(only-export-components)`
  warnings** across five files (`ui/button.tsx`, `ui/badge.tsx`,
  `delivery/WidgetGrid.tsx`, `shared/SessionPlannerTable.tsx`, and
  `delivery/DeliveryHomePage.tsx` ×3). They are fast-refresh advisories on files
  exporting a helper alongside a component. That is the baseline — if you see 8,
  one is yours.

**Third: read the dev server's transform log.** `npm run dev`, then watch it.
Per §8.1, a clean typecheck does not mean Vite accepted your JSX.

**Fourth: run the layout audit.** With the page open, paste `docs/layout-audit.js`
into the browser console and call `layoutAudit()` — or load the served copy at
`/_audit/layout-audit.js`. **An empty result is the pass condition**; anything
returned is a real finding until proven otherwise.

It checks seven things measurement catches and eyes do not: page-level
horizontal scroll, a table wider than its own container (which silently hides
trailing columns), a form control not filling its wrapper, short table text
wrapping because a column is squeezed, controls under the 36px floor, elements
past the viewport edge, and uneven heights across three or more sibling tiles.
It is calibrated to zero false positives on the surfaces it was written against;
if it fires on a page you believe is correct, read its `CALIBRATION NOTE`
comments before loosening a check, and record why in the file if you do.

One check it cannot do for you: **contrast is measured, not calculated.** Read
painted pixels and apply the WCAG formula. Two specific hazards here — Tailwind
v4 emits `oklab()`/`oklch()`, so parsing a computed colour string as RGB returns
nonsense (rasterise through a 1×1 canvas instead); and a translucent fill has no
meaningful `background-color` of its own, so composite the ancestor layers
before measuring.

Finally: **check the console in a fresh tab.** Browser-automation console
readers return a retained buffer that survives both `location.reload()` and
`console.clear()`, which has caused stale errors to be filed as current more
than once.
