# Care2Sleep — Trainee & Coach Portal handover

This package contains a runnable design prototype of the Care2Sleep **Coach
Delivery Portal**, plus the documentation an engineer needs to build the real
thing. The prototype is the specification: it is the reference for what a coach
sees, what each screen means, and how the data fits together. It is not a
starting codebase — there is no backend, no authentication and no persistence
behind it. It is intended for the engineer who will design the schema and build
the production application.

---

## Scope

**This package ships the Coach Delivery Portal only** — but that portal serves
**two audiences**, and both are in scope:

| Audience | Who they are | What they see |
|---|---|---|
| **Trainee** | An aged care worker partway through the COACH certification pathway | The welcome flow, the training dashboard, the six-stage pathway rail (six stages plus a certification column — do not read that as seven stages), My Learning, the module player, My Notes, My Profile |
| **Coach** | The same person once certified, now delivering SPACES sessions to real clients | The coach dashboard, the client list, the per-client record, My Schedule, session notes and reflections |

They are one codebase and one person's journey, which is why they ship together.
In the prototype you switch between them with the **"Demo view: Trainee /
Coach"** control at bottom right — a review tool, not product chrome. See
`docs/orchestration-flows.md` §1.

The other three portals in the full Care2Sleep prototype — the **Research
Dashboard**, the **Consumer Portal**, and the standalone coach training portal —
are **not** part of this handover. Where the code or its comments mention them,
treat that as historical context explaining why a shared component behaves the
way it does, not as a pointer to something you can open.

**There is no researcher or consumer code in this package.** The full prototype's
other portals were removed outright — 25 files and roughly 19,000 lines — rather
than shipped with a note asking you to ignore them.

Six components did have to survive that cut, because the coach portal genuinely
renders them. They were **extracted** out of two researcher *page* files and now
live in `src/components/shared/`:

| New file | What it holds |
|---|---|
| `shared/SleepHealthData.tsx` | `FitbitSyncMonitor`, `FitbitAveragesTable`, `SleepDiaryFeed` |
| `shared/ProfileDetailsSections.tsx` | The whole Profile details tab body |
| `shared/dyadHealth.ts` | `dyadHealthAlerts`, `hasRecentGap`, `dyadTitle` |
| `shared/SessionPlanEmptyBanner.tsx` | The "no session plan yet" banner |

Their bodies and comments are unchanged; only imports moved. **No file remains in
a `research/` directory**, because that directory name would tell you something
untrue about who owns the code.

Two of these carry a `viewerRole: 'researcher' | 'coach'` prop, and it is kept
deliberately. It is not dead configuration — it encodes a real permissions
distinction. A coach may read a client's details but not withdraw them from the
study, not change their notification preferences, and not edit their record; the
researcher branch is the specification of what a coach may *not* do. One
consequence to know about: the researcher branch links to
`/research/spaces-coaches/:id`, a route that does not exist here. That link is
unreachable in this package and would need its route back alongside any future
researcher view.

---

## Quickstart

Requires Node 20+ and npm.

```bash
cd app
npm install
npm run dev
```

Then open the URL Vite prints. There is no sign-in step. The app opens on a
single-card launcher; click **Coach Delivery Portal** to enter at `/delivery`.

**How to reach each of the two audiences**, because neither is obvious and
nothing on screen tells you:

- **Trainee** is the default. `/delivery` opens on the four-screen Care2Sleep
  welcome, then the seven-step tour.
- **Coach** is reached with the **"Demo view: Trainee / Coach"** control at the
  bottom right. Selecting **Coach** always lands on the coach welcome banner, so
  the first-run state is reviewable on demand.

That switcher is **review scaffolding, not product chrome** — in production a
coach's stage is their real certification state. `docs/orchestration-flows.md`
§1 lists all 18 such demo triggers with what drives each one for real.

Other commands, all run from `app/`:

```bash
npm run build     # tsc -b && vite build
npm run lint      # oxlint
```

Three things to know before you judge what you are looking at:

- **The welcome flow replays on every single page load.** Onboarding is not
  persisted anywhere, so you will click through four screens each time, and the
  seven-step tour starts automatically when you finish them. There is no Skip —
  **that is deliberate** and must be preserved; see `docs/orchestration-flows.md`
  §3.3 before you "fix" it. That it *replays* is prototype scaffolding and should
  be replaced by a server-side per-coach flag.
- **`tsc` passing is not proof the app builds.** Vite's parser is stricter in
  places. If you change JSX, confirm the dev server reports no transform error
  as well.
- **The clock is frozen** at `TODAY` in `src/data/format.ts`. Fixtures are
  authored around it. Two write paths already ignore it and use the real wall
  clock, which is why a note you save today lands weeks after everything else in
  the same table.
- **If the welcome flow appears stuck half-faded over the page, your browser tab
  is in the background.** This is not a bug in the app. Backgrounded tabs
  throttle `requestAnimationFrame`, which is the clock `framer-motion` uses to
  finish an exit animation — so the onboarding never completes its handoff and
  sits translucent over whatever route you navigate to. Bring the tab to the
  front and it settles immediately. Worth knowing before you debug it: it caught
  three separate reviewers of this package, and it also invalidates any
  measurement taken from a background tab.

---

## Documentation

Read them in this order.

| Document | What it answers |
|---|---|
| [`docs/engineering-overview.md`](docs/engineering-overview.md) | How the app is put together: architecture, directory map, the routes, how a page renders, conventions to follow, known traps, and what to build first. **Start here.** |
| [`docs/orchestration-flows.md`](docs/orchestration-flows.md) | Every multi-step flow as an explicit state machine, with diagrams, guards and persistence. **§1 is the demo-trigger table — read it before you touch anything**, because several state changes in this prototype are reachable only through scaffolding that will not exist in production. |
| [`docs/motion-spec.md`](docs/motion-spec.md) | Every animation with its exact duration, easing, delay and exit behaviour, and what each is *perceived* as. Written because none of this is recoverable from the code alone. |
| [`assets/ANCHORING.md`](assets/ANCHORING.md) | Where the artwork sits and how it is composed — the extracted doodles, their coordinate space, cumulative rotation, and the photo-card blob rule. Read it before rebuilding any illustrated screen. |
| [`docs/data-model.md`](docs/data-model.md) | Every type and field with its meaning in the study's domain, stored vs. derived, the single source of truth for each fact, testable invariants, what each seed persona demonstrates, and the open questions a schema has to resolve. |
| [`docs/integration-points.md`](docs/integration-points.md) | Every seam where a real backend or third party attaches — the store's whole action surface including the actions with no caller, auth, Fitbit, Zoom, upload, CSV, notifications and the clock. |
| [`docs/design-handoff.md`](docs/design-handoff.md) | The measured visual spec: layout system, button styles, card contract, component inventory, interaction states, responsive behaviour, empty states, and open items for the design owner. Everything numeric was read from the running app, not from Figma. |
| [`docs/design-tokens.md`](docs/design-tokens.md) | The colour, type, radius and shadow tokens, and the component rules that are not tokens. Mirrors `app/src/index.css`, which is authoritative if the two disagree. |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | What changed in this package between hand-off revisions, and which documents each change invalidates. |
| [`docs/layout-audit.js`](docs/layout-audit.js) | The project's own layout-measurement script. Paste into the browser console and call `layoutAudit()`; an empty result is the pass condition. |

---

## Study context

Enough to read the rest of the documentation without prior knowledge.

- **Care2Sleep** is a Monash University research intervention study. It trains
  aged care workers as sleep coaches and pairs them with people living with
  dementia and their carers, who receive structured sleep coaching over a series
  of video sessions.

- A **coach** is an aged care worker trained by the study. A **client** is a
  person receiving the coaching — modelled as a *dyad*: the **PLE** (Person with
  Lived Experience, the member with dementia) and their **carer**. Some are
  carer-only, with no co-enrolled PLE. Never "patient" or "PLWD".

- **Terminology is audience-dependent, and this matters in code.** Coach-facing
  surfaces say **client**; researcher-facing surfaces say **consumer**. Same
  people, different reader. Internal identifiers keep "consumer"
  (`ConsumerDyad`, `dyadId`, `/delivery/consumers/:id`) — those are code, not
  copy. Components shared by both portals take a `viewerRole` prop rather than
  hardcoding either word.

- **COACH** is the pathway a trainee completes before working with real clients:
  Content learning → Observation (guided group practice) → Application
  (Placement 1) → Community of practice → Hands-on assessment (Placement 2).
  Passing the final assessment awards **certification** — never "graduation".
  **Do not hardcode the number of stages anywhere**; read it from
  `data/coachPathway.ts`. That sentence has been written wrong three times.

- **SPACES** is live delivery, which a coach enters only once certified. Each
  client gets **7 sessions**: one planning meeting plus one catch-up after each
  of 6 content modules. Completing a session unlocks the next module.

- **SIPTEA** is the six-component in-session coaching framework (Shared
  understanding, Implementation intent, Problem identification, Tailoring,
  Emotion navigation, Action and goals). Coaches write reflective **annotation
  summaries** against it — never call these "reports". A reflection is written
  from a session debrief, not at will.

---

## State of the code

This is a **coded design prototype**, built and reviewed over roughly forty
rounds of design iteration. The screens, copy, layout, interaction states and
accessibility behaviour are real and deliberate — a great deal of that detail
was settled by measurement rather than by eye, and the reasoning is recorded in
comments in the files themselves. Treat those as the specification.

What is **real**: every screen and its states; all navigation; the read paths
across the whole data model; the derived logic (stage labels, session numbering,
module unlocking, progress figures); and a set of genuine write paths — writing
notes and case notes, submitting a reflection, planning and editing a session
plan, marking sessions complete.

What is **mocked or absent**:

- **No backend, no network, no persistence.** State lives in one React context
  over seeded fixtures. Reloading restores the seed data exactly. The one
  exception is module-player progress, which uses `localStorage`.
- **No authentication, and no authorisation model at all.** The signed-in coach
  is hardcoded — the string `'helen-zhang'` appears in four files, plus a second
  independent identity object in `data/portal.ts`. "Sign out" removes a
  `sessionStorage` key that nothing ever writes. No route is guarded. The
  study's own role and data-access matrix — who may see a coach's client case
  notes, the endline-annotation-only rule for expert assessors — is **not
  specified anywhere in this package**. Get it from the study team; it is the
  one input the docs cannot supply.
- **Three unconnected models of "has this coach completed this module."**
  `Coach.moduleRecords` (per-coach, read only by the Research Dashboard),
  `PATHWAY_MODULES_V2[].status` (a **global constant, identical for every
  coach**), and a `localStorage` step index. They disagree on screen right now:
  the researcher view reports 11 of 11 complete for the signed-in coach while
  her own My Learning page shows 1 of 11. **Collapsing these into one per-user
  record is the single most consequential schema decision in this package**, and
  it also decides where knowledge-check answers and module feedback live — the
  player currently persists neither.
- **The coach is simultaneously certified and at Stage 1.** `/delivery/account`
  shows a certification date and an enabled certificate download while
  `/delivery` shows Stage 1 of the pathway. `DeliveryAccountPage` is the only
  coach-portal page with no stage branch, so **no demo setting produces a
  self-consistent coach.** The certification date is also 8 days after the
  frozen clock.
- **Two write paths use the real wall clock instead of the frozen `TODAY`**, so
  newly saved notes land weeks ahead of every seeded row and the gap widens
  daily. A third saves `date: TODAY` with `time: new Date()`.
- **Seed-data contradictions**, documented rather than silently corrected
  because fixing them properly means re-dating the whole fixture set at once.
  Notably `dyad-011` carries sessions marked completed on future dates.
- **7 of 32 store actions have no caller** — `addConsumer`,
  `updateSessionPlanRow`, `addAdHocMeeting`, `addManualRecording`,
  `addConsentDocument`, `removeConsentDocument`, `addDyadSessionRecording`.
  Every one still has a live *read* path, so consent documents, session
  recordings and ad-hoc meetings all render today with a severed write. These
  are unfinished features, not dead code.
- **The module player's knowledge check has no pass/fail gate.** You can answer
  every question wrong and proceed. `ModuleFeedbackSlide` collects a star rating
  and a comment and **discards both** — the only control in the portal that
  takes real input and throws it away.
- **Around 21 controls are deliberately inert** — designed, visible, not yet
  wired. They follow one convention: focusable, `aria-disabled`, with a
  screen-reader-only "(coming soon)" cue. **Preserve this convention** when you
  wire them; it is the documented house style, not an oversight.
- **Zoom links are fabricated** and render as real, clickable `zoom.us` anchors.
- **No Fitbit client.** All sleep data is seeded.
- **No route reflows below desktop width.** The sidebar never collapses, and the
  fixed chrome sums to 320px, so the content column is 55px wide at a 375px
  viewport and 0px at 320px, with real horizontal page scroll. This is a known
  Critical and needs a responsive shell, not a patch.
- **Several files are retained but unreachable**, including `ModuleTimeline.tsx`
  (~1,700 lines), `ModulePlayerHeader.tsx` and `WidgetGrid.tsx`. Files in that
  state carry a `⚠️ UNREACHABLE IN THIS PACKAGE` header saying what replaced
  them and whether deleting is safe. They are kept because each contains
  heavily-iterated logic worth reading before you rebuild the same thing.

### Accessibility

A measured WCAG 2.1 AA audit was run across every route, both demo stages, the
onboarding and the tour. Contrast was rasterised through a canvas rather than
read from source, because Tailwind v4 emits `oklab()` and the authored hex is
not what the browser paints.

**Fixed in this package** (each verified live, not just re-read):

- The header account button had **no accessible name at all** below 640px — the
  visible name is `hidden sm:inline`, leaving only an `aria-hidden` chevron.
- **Three focus-to-`<body>` losses**: answering a knowledge-check question,
  playing a video placeholder, and Edit/Save/Cancel on My profile. The first two
  shared one cause worth knowing — the focused button became natively
  `disabled`, and browsers drop focus from a disabled element. `aria-disabled`
  plus a guard conveys the same state and keeps the element focusable.
- The module overview page had **no `<main>` landmark**, so the header's "Skip to
  main content" link did nothing there.
- **11 of 30 animations ignored `prefers-reduced-motion`**, and the Plan Sessions
  spinner *froze* under it. Fixed at the root with
  `MotionConfig reducedMotion="user"` (see `src/main.tsx`).

**Known and NOT fixed — one Critical:**

- **No route reflows below 768px** (WCAG 1.4.10). The sidebar has no responsive
  breakpoint, and the fixed chrome sums to 320px, so `<main>` computes to 55px
  wide at a 375px viewport and **0px at 320px**, with real horizontal page
  scroll. This needs a responsive shell, not a patch, which is why it is
  documented rather than worked around. `DeliverySidebar.tsx` and the
  `shrink-0` wrapper in `DeliveryShell.tsx` are the two places to change.

Unwired controls are **not** visually dimmed — they are focusable,
`aria-disabled`, with an `sr-only` "(coming soon)" cue. That is this project's
documented convention, applied consistently; preserve it when you wire them.

Two things to read before changing anything: the engineering overview's known
traps, and **§1 of `docs/orchestration-flows.md`** — the demo-trigger table.
Between them they cover the mistakes this codebase invites: scaffolding
rebuilt as product, two screens deriving one fact from two different fields,
and session numbering, which is offset three different ways.
