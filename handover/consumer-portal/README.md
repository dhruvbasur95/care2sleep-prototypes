# Care2Sleep — Consumer Portal handover

This package contains a runnable design prototype of the Care2Sleep **Consumer
Portal**, plus the documentation an engineer needs to build the real thing.

The prototype **is** the specification: it is the reference for what a consumer
sees, what each screen means, how it moves, and how the data fits together. It is
not a starting codebase — there is no backend, no authentication and no
persistence behind it. It is intended for the engineer who will design the schema
and build the production application.

---

## Scope

**This package ships the Consumer Portal only** — the interface used by the
people receiving sleep coaching: a person living with dementia and their carer,
sharing one account.

The other three interfaces in the full Care2Sleep prototype — the **Research
Dashboard**, the **Coach Delivery Portal** and the coach training portal — are
**not** part of this handover. They were **removed outright**, 98 source files,
rather than shipped with a note asking you to ignore them. Where the remaining
code or its comments mention them, treat that as historical context explaining
why something behaves the way it does, not as a pointer to something you can
open.

Three consequences worth stating plainly:

- **There is no portal switcher and no way to change role.** Every route in
  `App.tsx` is something a consumer can reach. The "Switch portal" row that still
  appears in the account menu and the hamburger drawer navigates to `/`, which
  redirects straight back — a dead loop, listed for deletion in
  `docs/orchestration-flows.md` §2.
- **One component survived the cut into a neutral home.**
  `components/research/` is gone; its only survivor, `ConfirmDialog`, now lives
  in `components/shared/`. No file remains in a `research/` directory, because
  that directory name would tell you something untrue about who owns the code.
- **A large amount of inherited data-layer surface remains**, and it is
  deliberate rather than an oversight — see [State of the code](#state-of-the-code).

**56 source files, ~16.4k lines** (23.2k including CSS). `public/` holds 103
files, 2.4MB, all illustrations and logos, every referenced path verified.

---

## Quickstart

Requires Node 20+ and npm. Built and verified on Node 24.

```bash
cd app
npm install
npm run dev
```

Then open the URL Vite prints. **There is no sign-in step.**

Other commands, all from `app/`:

```bash
npm run build     # tsc -b && vite build
npm run lint      # oxlint
```

### Four traps, before you judge what you are looking at

**1. The welcome flow and the first-run tour are not persisted, so both replay on
every full page load — before you reach Home.** You will click through four
welcome screens and then five tour screens every single time. There is no Skip on
the welcome flow. That both *exist* is the design; that they *replay* is
prototype scaffolding and must be replaced by a server-side per-account flag. See
`docs/orchestration-flows.md` §1.1 and §1.2.

The flows only render over **Home**. The other five pages pass
`showWelcome={false}`, which also marks the flow passed for the session — so
deep-linking to `#/consumer/dyad-011/diary` is the fast way in while you work.

**2. `/` redirects to one hardcoded demo consumer.** `/`, `/consumer` and every
unmatched path all land on `/consumer/dyad-011` — **Bruce Whitfield (PLE) and
Joan Whitfield (carer)**, one week after their third coaching session. In
production the `:dyadId` segment comes from the authenticated session; that
redirect is the seam where it happens. There is no 404 design.

Routing is `HashRouter`, so URLs look like `…/#/consumer/dyad-011`. One
consequence: an in-page `<a href="#…">` rewrites `location.hash`, which the
router then tries to match as a route. The portal's one in-page jump is a
scripted scroll plus a `.focus()` instead.

**3. The clock is frozen** at `TODAY = '2026-08-26'` in `src/data/format.ts:45`.
Every fixture is authored around it. `docs/data-model.md` covers what depends on
it; `docs/seed-invariants.mjs` asserts it and will reproduce seven real failures
if you move it back. Home's greeting reads `TODAY` rather than the real clock
**deliberately** — two clocks on one screen produced "Today is Mon, 14 September"
above a session "Scheduled" for 2 September.

**4. `tsc` passing is not proof the app builds.** Vite's parser is stricter in
places — a JSX comment inside an attribute list passes `tsc --noEmit` and blanks
the page. If you change JSX, confirm the dev server reports no transform error as
well.

And one thing that is **not** a bug in the app: **if an animation looks frozen,
check whether your browser tab is in the background.** Backgrounded tabs can
suspend `requestAnimationFrame`, which is the clock framer-motion uses for
transforms — so every transform animation measures as `transform: none`,
indistinguishable from a real defect. It has already produced one false finding
on this package. `docs/motion-spec.md` §11 Trap 10 explains how to measure
properly.

---

## Documentation

Read them in this order.

| Document | What it answers |
|---|---|
| [`docs/engineering-overview.md`](docs/engineering-overview.md) | How the app is put together: architecture, directory map, the routes, how a page renders, conventions to follow, known traps, and what to build first. **Start here.** |
| [`docs/orchestration-flows.md`](docs/orchestration-flows.md) | Every multi-step flow as an explicit state machine — states, triggers, what persists, what an interrupted flow does, and where focus goes on every transition. **§2 is the demo-trigger table: read it before you touch anything**, because several state changes here are reachable only through scaffolding that will not exist in production, and one of them is a button labelled as if it does something else entirely. |
| [`docs/motion-spec.md`](docs/motion-spec.md) | **The most detailed document in the package.** Every animation with its trigger, its measured timeline, the source lines that carry it, what it structurally depends on, what to change to tune it, and its reduced-motion behaviour. §0 is a pasteable constants block — the shared vocabulary of easings, durations, springs and loop periods. §11 is the traps: eleven things that will be wrong on a naive rebuild, none of them inferable from reading the code. |
| [`docs/data-model.md`](docs/data-model.md) | Every type and field with its meaning in the study's domain, stored vs. derived, the single source of truth for each fact, testable invariants, what the seed persona demonstrates, and the open questions a schema has to resolve. |
| [`docs/integration-points.md`](docs/integration-points.md) | Every seam where a real backend or third party attaches — auth, the clock, diary writes, module progress, feedback, Fitbit, Zoom, consent, opt-out, and content delivery — with the request and response shape each would need. |
| [`docs/design-handoff.md`](docs/design-handoff.md) | The measured visual spec: layout system, button styles, card contract, component inventory, interaction states, responsive behaviour, empty states, and open items for the design owner. Everything numeric was read from the running app, not from Figma. |
| [`docs/design-tokens.md`](docs/design-tokens.md) | The colour, type, radius and shadow tokens, and the component rules that are not tokens. Mirrors `app/src/index.css` and `app/src/consumer-tokens.css`, which are authoritative if the two disagree. |
| [`docs/wave-and-blob-shapes.md`](docs/wave-and-blob-shapes.md) | The illustration geometry: the wave bands and their two-exports-per-breakpoint rule, the torn-paper blob frames, the mascot's seating on the wave crest, and the layer splits the animations depend on. Read it before rebuilding any illustrated screen. |

Three runnable scripts ship alongside them:

| Script | How to run | Pass condition |
|---|---|---|
| [`docs/layout-audit.js`](docs/layout-audit.js) | paste into the browser console on any page, then call `layoutAudit()` (or `layoutAudit('#main-content')` to scope it) | **an empty array**. It checks eight things measurement catches and eyes do not — page-level horizontal scroll, a table wider than its own container (which silently hides trailing columns), a form control not filling its wrapper, short table text wrapping because a column is squeezed, pagination dots under WCAG 2.2's 24px floor, controls under the app's own 36px floor, elements past the viewport edge, and uneven heights across sibling tiles |
| [`docs/type-scale-check.mjs`](docs/type-scale-check.mjs) | `node docs/type-scale-check.mjs` from the package root | exit 0. Enforces the type scale's invariants: one interpolation range (375→1200), no rank reversals, nothing below 16px, nothing above weight 600. **Currently passing** — 6 distinct rendered sizes at 375px, 12 at 768, 8 at desktop |
| [`docs/seed-invariants.mjs`](docs/seed-invariants.mjs) | `npx tsx docs/seed-invariants.mjs` from the package root — **it imports TypeScript, so plain `node` cannot run it** | exit 0. Asserts the seed is internally consistent against the frozen clock: no session completed on a future date, no module activity ahead of the session that unlocks it, and so on. **Currently passing — 100 invariants hold.** Move `TODAY` back to its previous value and it reproduces the original 7 failures |

---

## Study context

Enough Care2Sleep to read the rest of the documentation without prior knowledge.

- **Care2Sleep** is a Monash University research intervention study. It trains
  aged care workers as sleep coaches and pairs them with people living with
  dementia and their carers, who receive structured sleep coaching over a series
  of video sessions.

- A **consumer** is a person receiving the coaching — modelled as a **dyad**: the
  **PLE** (Person with Lived Experience, the member living with dementia) and
  their **carer**. Some dyads are **carer-only**, with no co-enrolled PLE, and
  that case is real in the UI: the diary asks one column instead of two, and the
  reflection never grows a `ple` key. **Never "patient", and never "PLWD".**

- **Both members share one account.** The carer is the account holder, and the
  diary is filled in "on behalf of you both". This is why every diary question
  and every reflection answer is keyed by member.

- **Terminology is audience-dependent across the wider project**: researcher-facing
  surfaces say *consumer*, coach-facing surfaces say *client*. **The Consumer
  Portal is the third audience and uses neither** — it addresses the reader
  directly as "you". Internal identifiers keep "consumer" (`ConsumerDyad`,
  `dyadId`, `/consumer/:dyadId`); those are code, not copy.

- **COACH** is the certification pathway a trainee completes before working with
  real consumers: Content learning → Observation → Application → Community of
  practice → Hands-on assessment. It does not appear in this portal, but it is
  why a `Coach` record carries a training history — of which **this portal reads
  exactly six fields**, and must not be given more.

- **SPACES** is live delivery, which a coach enters only once certified. Each
  consumer gets **7 sessions**: one planning meeting plus one catch-up after each
  of 6 content modules. In this portal the planning session is shown by name and
  never numbered, so the six catch-ups read as "Session 1" to "Session 6" —
  numbering is offset by one between the UI and the data, and
  `docs/data-model.md` is explicit about which is which.

- **Modules** are the consumer's own learning content — **always "modules", never
  "lessons"**, on every consumer-facing surface. The header tab is "My Modules",
  cards read "Module 4" and "Play module". Internal identifiers keep "lesson"
  (`LessonCards`, `lessons.ts`, the `/learning` route) for the same reason
  `ConsumerDyad` keeps "consumer".

- **The audience is explicitly not digitally literate.** That is a design
  constraint, not a nicety, and it shows up throughout: plain language, no
  icon-only controls, no gestures, large targets, one action per screen, a
  16px type floor, and a text-size control that **cannot go below 100%**.

---

## State of the code

This is a **coded design prototype**, built and reviewed over many rounds of
design iteration. The screens, copy, layout, interaction states and motion are
real and deliberate — a great deal of that detail was settled by measurement
rather than by eye, and the reasoning is recorded in comments in the files
themselves. **Treat those comments as the specification**; several of them record
a thing that was built, measured, found wrong and rebuilt, and they will stop you
repeating it.

### What is real

Every screen and its states; all navigation; the read paths across the whole data
model; the derived logic (session numbering, module release, progress figures,
the diary's four computed answers); the welcome flow; the five-step tour; the
hamburger drawer; the accessibility text-scaling; the session-plan strip with all
four cell states reachable; and **three genuine write paths** — submitting the
sleep diary, opting out of the study, and editing PLE or carer personal details.

The sleep diary in particular works end to end: all 9 questions × both members,
submitted, with Home flipping to its completed state immediately.

### What is mocked or absent

- **No backend, no network, no persistence of any kind.** No `localStorage`, no
  `sessionStorage`, no fetch. State lives in one React context over seeded
  fixtures plus four module-scoped stores. **Reloading restores the seed
  exactly.**

  The consequence worth hearing as one sentence: *a hard reload mid-flow drops
  the reader into the full four-screen welcome and loses their answers* — and
  completing that welcome navigates to Home, so they do not even return to where
  they were. **There is no resume path from any interruption anywhere in the
  portal.**

- **No authentication.** `/` redirects to a hardcoded `dyad-011`. "Log out"
  removes a `sessionStorage` key that nothing ever writes and returns you to the
  same consumer. `data/auth.ts` is vestigial and is named for a training portal
  that is not in this package.

- **Feedback and reflection answers land nowhere.** The session-feedback modal
  collects a mood and free text and "Submit Feedback" advances a step — there is
  **no feedback store slice at all**. The module reflection collects five
  questions × every member, gates completion on all of them, offers a live
  editable review screen and a share-with-coach consent choice, and then
  **discards every bit of it**. These are the two places in the portal that take
  real input and throw it away.

  One thing to know when you build the reflection's endpoint, rather than
  anything you need to resolve now: `sharedWithCoach` has no destination in the
  data model, and the coach's own SIPTEA `annotationSummaries` is **not** it —
  that is the coach's record of their own practice, not a place to put a
  consumer's answers. Whoever designs the real schema picks a home for both.
  Nothing in this prototype depends on it.

- **No module progress is written.** `stage` and `furthest` reset on every entry,
  so a reader who leaves mid-module restarts it.

- **Only one of six modules has content.** `daytime-habits` (Module 4) is
  populated; the other five return `null` from `moduleLesson()`, their cards
  render focusable `aria-disabled` CTAs with an `sr-only` reason, and their routes
  `<Navigate replace>` to `/learning`.

- **There is no video and no audio anywhere in the package.** The player is a
  grey placeholder, the audio mode is a placeholder, and the transcript is a
  hand-abridged 10-line extract of a ~90-line production script. Chapter
  timestamps are **estimated** at 140 words/min, not measured from an edit.

- **Fitbit data is seeded and read by nothing.** `HealthLogEntry` carries
  `synced`, `remPercent`, `deepPercent`, `lightPercent`, `durationMin` and
  `disturbances`, and the seed generates 18 nights per person including a
  deliberate two-night sync gap. Grepping every component and page for those
  fields returns **zero render sites**. The Consumer Portal writes the log and
  never reads it — the coach and researcher portals are the readers. Flag this as
  a scope decision, not an oversight, if a consumer is ever meant to see it.

- **Zoom links exist and are rendered nowhere.** `SessionPlanRow.meetingId` and
  `zoomLink` are generated and seeded for `dyad-011`'s rows, and no consumer
  surface shows either. The visible "Join video call" button is a demo switch
  that toggles the feedback banner instead — see below.

- **Consent documents are seeded and not rendered.** Notification preferences
  have a store action and no consumer caller; the card was removed from My
  profile. Ad-hoc meetings are modelled with no consumer surface.

- ⚠️ **The "Join video call" button on Home does not join anything.** It toggles
  the post-session feedback banner, standing in for a "session finished" signal
  the platform does not have yet. It is annotated at the call site and it is the
  first row of `docs/orchestration-flows.md` §2. Splitting it into a real Join
  anchor plus a server-driven banner is a one-line revert on the anchor half.

- ⚠️ **The research contact phone number is a UK Ofcom drama-range number on an
  Australian study**, and the contact email does not match the seed researcher.
  Replace both before any participant sees them. **The two crisis numbers (000
  and Beyond Blue 1300 22 4636) are real and current and must not be swapped for
  demo values.**

- **Every FAQ answer says it has not been written yet.** The questions are
  plausible placeholders; the answers were deliberately not fabricated. Content
  task for the research team.

- **The help page's search is switched off** behind
  `const SEARCH_ENABLED: boolean = false`. The matcher is real and works; the
  field is not rendered. Ship it or delete it and the three pieces it gates.

### Inherited surface, not dead code

**40 of 47 `ResearchStore` members and roughly 60 data exports have no caller in
this package.** That is a consequence of removing three portals, not rot, and it
is called out here because the honest options differ:

- **Do not bulk-delete.** Several — `toggleSession`, `unlockModuleManually`,
  `addDiaryEntry` — are the natural write paths a real backend would call, and
  `addDiaryEntry` in particular pairs with the live `submitSleepDiary`.
- **The Consumer Portal imports exactly one thing from `research.ts`: `type
  Coach`**, a type-only import erased at compile time. Everything else in that
  1,517-line file reaches the app solely through the store's coach roster.
  `research.ts` + `trainingPathwayV2.ts` ≈ 1,790 lines supporting one `coaches`
  array.
- **The decision to make is deliberate, either way:** keep the store as a
  documented cross-portal seam, or split it so the Consumer Portal depends on a
  seven-member interface. Silently shipping 39 unreachable actions is the only
  option that is not defensible.

`docs/data-model.md` lists which exports are genuinely deletable, which only need
to lose the `export` keyword, and the two that **look** unreferenced and must
stay — `isPlanSet` and `moduleUnlockState` are the guards the module page should
be calling and is not.

### Known and not fixed

- **4 oxlint warnings**, all `react(only-export-components)` in
  `ConsumerCanvasWave.tsx` (lines 236, 241, 242, 313). That file exports the
  shared mascot hook and the "z"-glyph constants alongside its components, which
  is a fast-refresh DX note, **not a defect**. `tsc -b` is clean, `strict: true`
  is on, and the browser console is clean in a fresh tab across every surface.

- **`@fontsource-variable/atkinson-hyperlegible-next` is installed, imported and
  tokenised as `--font-consumer-wordmark`, and renders nowhere.** It is kept
  rather than deleted because the token carries a documented open question:
  should this legibility-first typeface be the portal's body face, given an
  audience defined by difficulty reading? **That is a product decision, not
  cruft.** Resolve it or remove the dependency.

- **The module flow's exit control says "Go home" but returns to My Modules**
  when the module was opened from there (`?from=modules`), which is the common
  case. Documented at the call site with two one-line fixes; left as a product
  decision about which behaviour is wanted.

- **Chapter timestamps and the video duration are estimates**, and the transcript
  is abridged. Both are replaced on the first real edit.

- **There is no 404 design.** The catch-all route sends every unmatched path to
  `dyad-011`, which also masks the five module routes that bounce for lack of
  content.

### Two things to read before changing anything

**`docs/orchestration-flows.md` §2** — the demo-trigger table. Between them, the
rows in it cover the mistakes this codebase invites: scaffolding rebuilt as
product, a control whose label describes a different action, and a flow that
replays because a flag was never persisted.

**`docs/motion-spec.md` §11** — the traps. Eleven mechanisms that are invisible in
the source and will be rebuilt wrong. The one that has already cost this package
a real defect: **`AnimatePresence initial={false}` propagates through
`PresenceContext` to every descendant, so an infinite keyframe animation snaps to
its final frame and never loops — and an explicit `initial` prop does not
override it.**
