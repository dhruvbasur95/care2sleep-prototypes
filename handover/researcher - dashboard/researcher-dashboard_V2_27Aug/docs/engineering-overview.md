# Care2Sleep Research Dashboard — engineering overview

Read this first. It tells you what the package is, how to run it, how it is put
together, and which parts will mislead you if you trust them.

Companion documents in this folder:

- `data-model.md` — the reference for designing the real schema: entity
  relationships, every type, invariants, and which seed states are deliberate.
- `integration-points.md` — every seam where a real backend or third-party
  service attaches, with the exact file, function and data shape.
- `design-tokens.md` — the colour, type, radius and shadow tokens, and the
  component rules that are not tokens.

This document is the orientation layer: what the package is, how to run it, how
it fits together, and what will bite you. It deliberately does not restate the
schema or the token tables — follow the links instead.

Everything below was verified against the code in this package on 2026-08-26.
Where a statement could not be verified, it says so.

---

## 1. What this is

A **standalone, runnable extraction of the Care2Sleep Research Dashboard** — the
researcher-facing surface of a larger design prototype. It is the deliverable an
engineer builds the real system from.

It covers eight screens: a home page, three roster pages (coach trainees,
consumers, certified coaches), three record pages behind them, and a profile
page.

### What it is NOT

This matters more than the feature list, because almost everything here *looks*
finished.

| Not present | What that means in practice |
|---|---|
| **No backend** | There is no server, no API client, and no network call of any kind. `grep -rn "fetch(\|axios\|XMLHttpRequest\|WebSocket" src` returns nothing. |
| **No authentication** | No login, no session, no user id. The signed-in researcher is a hardcoded object literal (`researcher` in `src/data/research.ts`). "Sign out" is deliberately inert. |
| **No persistence** | All state is React `useState` inside one context. **Reloading the page discards everything and restores the seed fixtures.** The only thing written to disk is the sidebar's collapsed flag (`localStorage`, key `c2s-research-nav-collapsed`). |
| **No database** | `src/data/research.ts` and `src/data/spaces.ts` are TypeScript fixture arrays — curated demo records, not a schema export and not a migration. |
| **No tests** | There is no test runner, no test file and no CI config in this package. |
| **Not the other portals** | The source prototype hosts four portals. This package ships the Research Dashboard **only**. The coach delivery, consumer and coach training portals are not included, are not linked to, and must not be described as available. |

It is also not fully wired even within its own scope. Roughly **13 controls are
drawn but deliberately have no write path**, and a third of the store's action
surface has no reachable caller. Both are catalogued below — they are the
specification of intended behaviour, not bugs to be quietly deleted.

---

## 2. Quick start

### Prerequisites

Verified on macOS with:

```
node v24.18.0
npm  11.16.0
```

Node 20.19+ or 22.12+ is the practical floor (Vite 8 requirement). Any recent
npm is fine.

### Install

**You must run a real install before the app will work correctly.**

```bash
cd app
npm install
```

Two things to know before you do:

1. **There is no lockfile.** No `package-lock.json`, `yarn.lock` or
   `pnpm-lock.yaml` ships with this package, so `npm install` resolves fresh
   versions inside the ranges in `package.json`. Commit the lockfile it
   generates as your first change, so builds become reproducible.

2. **`app/node_modules` is currently a symlink** pointing outside the package,
   into the authoring machine's original prototype:

   ```
   app/node_modules -> ../../../design/prototype/care2sleep-prototype/node_modules
   ```

   That link will be broken or absent on your machine. Delete it before
   installing:

   ```bash
   cd app && rm -f node_modules && npm install
   ```

   Leaving it in place has a specific, confusing symptom: the dev server starts
   and the app renders, but every font request fails with
   `"... is outside of Vite serving allow list"` and the UI falls back to a
   system font. That is not a CSS bug — it is Vite refusing to serve files from
   outside the project root, which is exactly what the symlink asks it to do. A
   real install inside `app/` resolves it.

### Run

```bash
cd app
npm run dev
```

Vite serves on port 5173 by default. The bundled launch config
(`app/.claude/launch.json`) pins port 5199 instead; either is fine.

Open `http://localhost:5173/` — `/` redirects to `/research/schedule`.

### Verify

All four commands below were run against this package and are reported with
their real behaviour.

```bash
cd app

npm run build     # tsc -b && vite build   — the real check. Exit 0.
npx tsc -b --force  # typecheck only, 46 files. Exit 0, ~2.4s.
npm run lint      # oxlint. Exit 0, 6 warnings (see below).
npx vite build    # bundler only. 2433 modules, exit 0, ~200ms.
```

`npm run lint` reports **6 pre-existing `react(only-export-components)`
warnings** and zero errors. They are fast-refresh advisories on five files that
export a helper alongside a component; they do not fail the build and are not
new.

`vite build` also warns that the main chunk exceeds 500 kB. There is no code
splitting — the whole dashboard is one bundle. Fine for a prototype, worth
addressing in a production build.

---

## 3. Architecture

### Stack

| Layer | Choice | Version in `package.json` |
|---|---|---|
| UI | React | `^19.2.7` |
| Language | TypeScript | `~6.0.2` |
| Build | Vite | `^8.1.1` (resolves to 8.1.5) |
| Routing | react-router-dom | `^7.18.1` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | `^4.3.3` |
| Animation | framer-motion | `^12.42.2` |
| Headless primitives | `@base-ui/react` | `^1.6.0` |
| Icons | lucide-react | `^1.25.0` |
| Class merging | clsx + tailwind-merge | `^2.1.1` / `^3.6.0` |

Tailwind v4 is configured **in CSS, not in a JS config file**. There is no
`tailwind.config.js`; the theme lives in an `@theme` block in `src/index.css`.
`shadcn` is a real dependency — `src/index.css` imports
`shadcn/tailwind.css` — so do not remove it as unused.

### The state model, and why every page reads through `useResearch()`

There is exactly one store. `ResearchProvider` (in `src/data/research-store.tsx`)
wraps the whole route tree in `App.tsx` and holds every mutable value in React
`useState`. Pages reach it through the `useResearch()` hook in
`src/data/research-context.ts`:

```tsx
const { coaches, consumerDyads, togglePhase } = useResearch()
```

There is no Redux, no Zustand, no server cache, no second context. If a value
changes at runtime, it is in this store; if it does not, it is a fixture
imported directly from `src/data/`.

**The provider and the hook live in different files on purpose, and it is not
stylistic.** Vite's React Fast Refresh cannot hot-update a module that exports
both a component and a non-component. `research-store.tsx` exports the
`ResearchProvider` component, so if `useResearch` or `TODAY` also lived there,
any edit cascading into that heavily-imported module would remount the provider
and silently reset the user's session to seed data — with no visible reload, so
it presents as data loss rather than a rebuild. `research-context.ts` and
`format.ts` exist to keep that cascade out. **Do not add a second export to
`research-store.tsx`.**

### The seed/store boundary

Fixtures are *initial values*. The provider copies them into state at boot and
pages read the copies. Three slices duplicate a field that also exists on the
seed record:

| Store slice | Seeded from | Status of the seed field afterwards |
|---|---|---|
| `sessionCompletion` | `ConsumerDyad.sessionsCompleted` | Goes stale immediately. Nothing reads it, and that must stay true. |
| `sessionPlans` | `ConsumerDyad.sessionPlan` | Same. |
| `phaseCompletion` | `Coach.currentPhase` | **Messier.** `currentPhase` is still read live for stage labels and gating, while `phaseCompletion` carries the per-stage ticks. `togglePhase` never writes back, so the two can disagree — a coach can have Stage H ticked while `currentPhase` still says Stage O. |

For a real backend these should be first-class tables
(`coach_stage_completion`, `session_completion`, `session_plan_row`) with the
duplicated fields on `Coach` / `ConsumerDyad` dropped or made strictly derived
views. Keeping both is the two-fields-one-fact pattern this codebase has been
repeatedly bitten by.

**Nothing is ever deleted.** Withdrawal, opt-out and transfer are all soft.
There is no un-invite, no un-enrol, no delete-dyad, no delete-note.

---

## 4. Directory map

```
researcher-dashboard/
├── docs/                        <- you are here
│   ├── engineering-overview.md
│   ├── data-model.md
│   ├── integration-points.md
│   ├── design-tokens.md
│   ├── design-handoff.md
│   ├── accessibility-report.md
│   └── layout-audit.js
└── app/
    ├── index.html               Vite entry. Title and meta describe the
    │                            Research Dashboard only.
    ├── package.json             No lockfile ships with it.
    ├── vite.config.ts           React + Tailwind plugins; `@` -> `./src`.
    ├── tsconfig*.json           Project references. See the tsc trap below.
    ├── .oxlintrc.json           Lint rules (rules-of-hooks, only-export-components).
    ├── .claude/launch.json      Optional dev-server config, port 5199.
    ├── public/
    │   ├── avatars/             One stock portrait. See "Known constraints".
    │   ├── illustrations/       Two certificate SVGs.
    │   └── favicon.svg
    └── src/
        ├── main.tsx             createRoot + StrictMode + BrowserRouter.
        ├── App.tsx              Route table, provider, page transitions.
        ├── index.css            Tailwind v4 @theme: all design tokens.
        ├── data/                THE DATA LAYER — read this before the UI.
        │   ├── research.ts          COACH pathway domain: Coach, stages,
        │   │                        modules, certification, the `researcher`
        │   │                        identity object. Fixtures + helpers.
        │   ├── spaces.ts            SPACES delivery domain: consumer dyads,
        │   │                        sessions, plans, health logs, notes.
        │   ├── research-store.tsx   The single context provider + all actions.
        │   ├── research-context.ts  `useResearch()` only. Kept separate.
        │   ├── format.ts            `TODAY` + date/time formatters. Separate
        │   │                        for the same Fast Refresh reason.
        │   └── trainingPathwayV2.ts The 11-module coach curriculum (reference
        │                            data, never mutated).
        ├── pages/research/      One file per route. The three record pages are
        │                        large (2,300-3,500 lines) and also define
        │                        components other pages import.
        ├── components/
        │   ├── research/        Dashboard-specific: shell, sidebar, hero,
        │   │                    chips, dialogs, notification hub.
        │   ├── shared/          Reusable across screens: StatCard, tabs,
        │   │                    MeetingsSection, InertButton, wizard parts.
        │   ├── account/         Profile page cards (password, notifications).
        │   ├── ui/              Thin shadcn-derived primitives (card,
        │   │                    separator, tooltip).
        │   ├── AppHeader.tsx    Global black bar. Header is not a portal switcher.
        │   └── SearchInput.tsx  Shared table search.
        └── lib/
            ├── utils.ts         `cn()`. Read the trap in section 8.
            └── csv.ts           `downloadCsv()` — client-side export.
```

A note on the page files: `CoachProfilePage.tsx`, `ConsumerDetailPage.tsx` and
`SpacesCoachProfilePage.tsx` are **also a component library**.
`SpacesCoachProfilePage` defines `SupervisionRecords`, which `CoachProfilePage`
imports; `CoachProfilePage` exports `RecordRowDivider`, which the other two
import. That is a genuine circular import. It resolves today only because both
sides are function declarations used at render time. Moving the shared pieces
into `components/` is the fix if you ever add a module-evaluation-time
dependency across the cycle.

---

## 5. Routes

Eight screens, two parameterised. Verified live — every route below was loaded
and rendered with an empty console.

| Path | Component | What it shows |
|---|---|---|
| `/` | — | Redirects to `/research/schedule`. |
| `/research` | — | Redirects to `/research/schedule`. |
| `/research/schedule` | `ResearchHomePage` | Home. Greeting hero, quick-actions bar, "items that need attention" hub, four study KPIs, and the day-grouped meetings table (Upcoming / Scheduled). No write path at all. |
| `/research/trainees` | `RosterPage` | Trainee Management. Coach trainees still inside the COACH pathway (`currentPhase < 8`). KPI row, search, and three tabs: Active trainees / Pending invite / Certified. Owns the "Add coach trainee" wizard. |
| `/research/coaches/:coachId` | `CoachProfilePage` | Trainee record. **5 tabs:** Overview, Learning Progress, Stage Management, Supervision Notes, Personal details. |
| `/research/spaces-coaches` | `SpacesRosterPage` | Coach Management. Onboarded SPACES coaches, plus a "Waiting to be onboarded" tab of certified coaches not yet brought into delivery. Owns the "Onboard coach" dialog. |
| `/research/spaces-coaches/:coachId` | `SpacesCoachProfilePage` | Coach record. **4 tabs:** Overview, Assigned Consumers, Supervision Logs, Profile details. Overview contains a nested Ongoing / Study complete pair; **Assigned Consumers contains three sub-tabs — Study progress / Consumer sleep & health data / Coach's reflection** — and is now where a researcher reads everything about one coach-consumer pairing. Accepts `?tab=`, `?dyad=` and `?sub=` for deep links. Those are section tabs, not page tabs. |
| `/research/consumers` | `ConsumerManagementPage` | Consumer Management. Every enrolled consumer, assigned or not. Entirely read-only. |
| `/research/consumers/:dyadId` | `ConsumerDetailPage` | Consumer record. **1 tab: Profile details** — the tab row hides itself at one entry. Overview, Study Progress, Sleep & Health Data and Notes are all hidden; their components are exported and rendered by `SpacesCoachProfilePage` instead. Accepts `?tab=`. See `docs/CHANGELOG.md`. |
| `/research/account` | `ResearchAccountPage` | My Profile. Editable contact details, notification preferences, password-change stub. |
| `*` | — | Falls back to `/research/schedule` rather than rendering nothing. |

`/research/schedule` is the home path for historical reasons — the page began
as "My Schedule" and became "My Home". The sidebar labels it **Home**. Renaming
the route is safe if you have no external references to it.

---

## 6. How a page renders

Every screen follows the same four-stage pipeline. Learn it once and all eight
read the same way.

```
main.tsx
  └─ BrowserRouter
     └─ App.tsx
        ├─ MotionConfig reducedMotion="user"     honours OS reduced-motion
        ├─ ResearchProvider                      the one store
        └─ AnimatePresence key={pathname}        per-route enter/exit
           └─ <Route> -> a page component
              └─ ResearchShell                   the page chassis
                 ├─ AppHeader                    black bar, skip link
                 ├─ ResearchSidebar              collapsible nav
                 └─ motion.main #main-content    tabIndex={-1}
                    ├─ topBanner?                sticky page-level alert
                    ├─ hero?                     full-bleed band
                    ├─ heroBelow?                second full-bleed strip
                    └─ content column            max-w-[1320px]
```

`ResearchShell` takes optional slots — `hero`, `heroClassName`, `heroNoSeam`,
`heroBelow`, `heroFlushBelow`, `topBanner` — and every default reproduces the
plain list-page layout, so adding one cannot disturb another page. Prefer a new
slot here over a page re-deriving the band's padding and max-width itself.

Two shapes use `hero`:

- **List pages** pass a `ResearchPageHero` (title, sub copy, optional CTA) and
  must also pass `heroNoSeam`. The default assumes the band closes on a tab row
  whose underline sits on the seam; without `heroNoSeam` a plain title+subtitle
  hero ends up flush against the content with zero gap.
- **Record pages** pass a back link, the person's name, and a tab row, and
  deliberately omit `heroNoSeam` — the band's bottom edge *is* the active tab's
  underline.

The content column's `max-w-[1320px]` and `md:px-20` gutter are shared by the
hero band and the content column deliberately. They must move together, or a
record page and the roster it opens from will visibly misalign as you navigate
between them.

---

## 7. Conventions to follow

Drawn from the code, not invented for this document.

**Imports.** Use the `@/` alias (`@/components/shared/StatCard`), configured in
both `vite.config.ts` and `tsconfig`. Relative paths are used only within a
folder.

**Styling.** Tailwind utilities only, composed through `cn()`. Colours,
type steps, radii and shadows come from tokens in `src/index.css` — never a raw
hex, never an arbitrary `text-[15px]` on a button. See `design-tokens.md`.

**Reuse before building.** `StatCard`, `UnderlineTabs`, `SearchInput`,
`StatusChip`, `EmptyState`, `TabIntro`, `ResearchPageHero`, `ConfirmDialog`,
`MeetingsSection`, `WizardProgressRail`, `WizardStepHeading` all exist and have
multiple callers. Prefer adding one well-named prop to a shared component over
forking it.

**Controls are at least 36px tall** (`h-9` or `min-h-9`). This is enforced
app-wide and outranks any smaller value in a design. Note `h-9` is a *height*,
not a minimum — a flex child needs `shrink-0` or flex-shrink will compress it
below the floor.

**A control that unmounts on click must move focus deliberately.** Focus falling
to `<body>` is this codebase's most-repeated defect: it has shipped in six
separate rounds. Inside a modal it is worse than elsewhere, because the Tab trap
is a `keydown` handler on the panel — once focus reaches `<body>` the trap stops
receiving events and Tab escapes to the page behind. There are deliberate focus
rescues in `ConfirmDialog`, `NotificationHubView`, `PasswordChangeCard`,
`AddCoachTraineeModal`'s inline editors, and several page-level pagers. Do not
remove them.

**Unwired controls are never omitted and never silently dead.** A control the
design draws but which has no write path renders as a focusable
`aria-disabled` button with an `sr-only` " (coming soon)" cue. The shared
implementation is `components/shared/InertButton.tsx`, whose doc comment is the
index of every one and what it is waiting on.

**Accessibility basics that are already load-bearing.** Every decorative icon
carries `aria-hidden="true"`; every label/number pair is a real
`<dl>`/`<dt>`/`<dd>`; tab rows implement the full WAI-ARIA tabs contract
(roving tabindex, arrow/Home/End moving focus *and* selection) via
`UnderlineTabs`; collapsed accordion panels get `inert` + `aria-hidden`, because
animating to `height: 0` hides content visually only and leaves it focusable.

**Contrast is measured from painted pixels, not calculated from the authored
hex** — and composited first when a fill is translucent. Tailwind v4 emits
`oklch()`, so the authored value is not what the browser paints.

**Domain vocabulary is not interchangeable.** Coach (never "trainee" for the
person), Consumer (never "patient" or "client"), PLE / Person with Lived
Experience (never "PLWD"), annotation summary (never "report"), certification
(never "graduation"). The seed field is still named `patient` for historical
reasons; the label is always PLE.

---

## 8. Known constraints and traps

These are the things that will actually bite you.

### `tsc --noEmit` checks nothing here — use `tsc -b`

The root `tsconfig.json` has `"files": []` and only project references. Verified
directly:

```
npx tsc --noEmit --listFiles | grep -c "src/"     ->  0     (exit 1)
npx tsc -b --force --listFiles | grep -c "/src/"  ->  46    (exit 0)
```

`--noEmit` type-checks **zero source files** and looks like it passed. Always
use `npx tsc -b --force`, or just `npm run build`.

### `tsc` passing is not proof the app builds

Vite's oxc parser is stricter than TypeScript's. The documented failure in this
project's history is a `{/* … */}` comment placed inside a JSX **attribute
list**: `tsc` accepted it, Vite rejected it, and the page went blank behind a
green typecheck. The mitigation is already in the package —
`npm run build` runs `tsc -b && vite build`, so it catches both. If you are
iterating with the dev server, check its terminal output for transform errors
rather than assuming a clean typecheck means a rendering page.

### Anything that must survive navigation cannot be `useState` in a shell

**Every page mounts its own `ResearchShell` instance.** A flag stored there
resets the moment the user navigates. This has shipped as a real bug before (a
first-run flow replayed itself on every route change). Use the store, or a
module-scoped value, or `localStorage` — which is exactly why
`ResearchSidebar`'s collapsed flag uses `localStorage` rather than state in the
shell above it.

### `cn()` carries a font-size registry that silently drops unknown tokens

`src/lib/utils.ts` extends `tailwind-merge` with an explicit list of this
project's custom `--text-*` steps. tailwind-merge cannot tell
`text-caption` (a size) from `text-ink-muted` (a colour) — both start with
`text-` — so without the registry it buckets them as conflicting and keeps only
the last.

**The list must contain every `--text-*` step in `index.css`.** A token missing
from it is not cosmetic: it is silently dropped at any `cn()` call site that
also passes a text colour, and the element falls back to inherited type with no
error anywhere. This has already happened once — a 16px/600 token rendered as
14px/400 with the correct class sitting in the markup the whole time, found only
by reading `getComputedStyle`. Add the token to `utils.ts` in the same commit
that adds it to `index.css`.

### `TODAY` is a frozen constant, roughly five weeks in the past

`src/data/format.ts` exports `TODAY = '2026-07-22'`. It is not cosmetic. It
drives the Upcoming/Scheduled split on Home, "sessions this week", pending-invite
ageing, the "certified this period" KPI window, the guard blocking completion of
a future session, and the timestamp on every store write.

Against a real clock, every seeded meeting is in the past and "Upcoming" reads
empty. **Replacing it means re-dating the seed fixtures in the same change.** It
is the single injection point for a real clock — treat it as one.

Known inconsistency to resolve at the same time: `toggleSession` stamps
`completedDate` from `TODAY` but `completedTime` from the real machine clock, so
one record can carry two notions of "now".

### The seeded Zoom links are real outbound links

`generateMeetingCreds()` in `research-store.tsx` fabricates
`https://zoom.us/j/<random>` URLs, and the fixtures do the same. These render as
genuine `<a href target="_blank">` anchors. Clicking one reaches a 404 or an
unrelated stranger's meeting. They are not inert placeholders — do not demo them
without saying so.

### A `grep` for store callers will mislead you

`bulkSetSessionPlan` and `toggleSession` have callers, but only inside
`PlanSessionsModal.tsx` and `EditSessionPlanModal.tsx` — and **neither modal has
a mount point**. Verified: `grep -rn "<PlanSessionsModal\|<EditSessionPlanModal"
src` returns nothing. Roughly 1,370 lines of heavily-iterated session-planning
logic compile, look finished, and can never run.

They are retained deliberately. Session planning is the *coach's* workflow; a
researcher reads a plan through the read-only `SessionsPlanOverview` and must
not be able to mark sessions complete. Whether researcher-side planning returns
is a product call. `App.tsx`'s header comment indexes this and the other
unreachable code.

### One placeholder graphic stands in for every person

`/avatars/participant-placeholder.svg` renders as the portrait for **every**
trainee and **every** coach; the data model has no image field at all. The
graphic is deliberately abstract and carries no real person's likeness — an
earlier revision of this package shipped a stock photograph of a real person
here and it was removed. Add a real per-person image field, or remove the
portrait, before any real data goes in. Do not substitute a stock photo.

### Two lifecycle axes on `Coach`, and they are not interchangeable

`status` (`enrolled` / `active` / `withdrawn` / `completed`) is the study
lifecycle. `inviteStatus` (`pending` / `active`) is platform-invite acceptance.
**Every roster "Status" column renders `inviteStatus`.** Counting one while
displaying the other has already shipped once as a KPI tile reading "Active
trainees 6" above a table showing five Active chips. `SpacesCoach` has the same
problem with `invitationStatus` vs `joinedStatus` — both written by
`inviteCoach`, neither displayed anywhere.

### Session and module numbering is offset three ways

The sharpest trap in the domain model. For one module:

- Internal session keys are **1–7**. Key 1 is the unnumbered **Planning**
  session, so the displayed number is always `n − 1`.
- Module index `N` is **unlocked by** internal session `N`, **reviewed by**
  internal session `N + 1`, and **shown to the consumer as** "Module `N + 1`".
- "Sessions completed" counts **6, not 7** — `catchupSessionsCompleted()`
  excludes the Planning session, and `SPACES_CATCHUP_COUNT` (6) is the matching
  denominator.

Never render a raw internal number. Route through `displaySessionNumber()`,
`sessionRowLabel()` and `nextUpcomingSessionEntry()` in `data/spaces.ts`.
Counting raw records once produced "1 of 7" beside "Next session: Session 1" on
the same row.

### Seed data has known, deliberate inconsistencies

The fixtures are curated to demonstrate UI states, and two records are known to
violate the app's own invariants. They are annotated in place at the offending
record:

- One dyad has SPACES sessions recorded as completed on dates **after** `TODAY`.
- One certified coach has a `certification.assessedDate` **after** `TODAY`,
  while already onboarded and delivering sessions.
- One consumer is assigned to a coach who has **no `SpacesCoach` row**, so that
  caseload is invisible on Coach Management until the coach is onboarded.
  Whether a consumer may be assigned to a non-onboarded coach is an unresolved
  referential rule, not a bug to silently fix.

Deleting a fixture record removes a demo case. Each coach and dyad exercises a
specific UI state.

Also worth knowing: the type supports **carer-only** consumers
(`ConsumerDyad.patient` is optional) and every layout guards for it, but **no
seeded dyad currently exercises that case** — all five have a PLE. If you change
the fixtures, keep a carer-only record so those code paths stay exercised.

---

## 9. What to build first

Ordered by what unblocks the most. Items 1–3 are prerequisites for a real
deployment; the rest can proceed in parallel.

`integration-points.md` has the exact file, function and data shape for each.

### 1. Authentication and identity — blocking

There is none. The signed-in researcher is a hardcoded object, no write records
an author, and "Sign out" is inert. This is the first thing to build, because
every subsequent item needs a user id.

Specifically: `addResearchNote` and `addSupervisionNote` record **no author id**,
which is a real gap for a study audit trail, not just a missing feature.

### 2. Persistence — blocking

Everything is in-memory. Reloading discards all work. This means designing the
schema, and the store's action list is the best available specification of what
the write surface needs to be — with the caveat that a third of it has no caller
(see below).

Start from the seed/store boundary in section 3: make
`coach_stage_completion`, `session_completion` and `session_plan_row` real
tables, and drop or derive the duplicated fields on `Coach` / `ConsumerDyad`.

### 3. Consumer enrolment via REDCap — blocking

**There is currently no working way to add a consumer.** The in-app enrolment
wizard was removed and its replacement, the "Sync with REDCap" button on
Consumer Management, is inert. There is no REDCap client anywhere in `src/`.

The intended seam is that button's handler plus the store's `enrollConsumer`
action, which already builds a complete `ConsumerDyad` from a plain input object
and currently has zero callers. Call it once per synced record.

### 4. Fitbit sleep data

`HealthLogEntry[]` on each dyad (`patientLog` / `carerLog`) is the array a
nightly sync job populates. No client exists.

Re-implement the sync-gap rule at the same time: `hasRecentGap()` in
`ConsumerDetailPage.tsx` claims a ">48 hours" threshold but tests the **last two
array entries**, with no reference to their dates. If a log simply stops, the
last two entries may both be synced and no alert fires — exactly the case the
check exists for. It is also the single source of truth for every gap alert in
the app, and it lives in a page component; move it to `data/spaces.ts`.

### 5. Meeting scheduling (Zoom or equivalent)

`generateMeetingCreds()` is the whole integration. Replace it with a real
Meetings API call and the app gets real meetings.

This unblocks four inert controls at once — `Schedule session`,
`Schedule meeting`, and the per-row `Edit` / `Delete` pair. Note the two row
kinds have **different write targets**: group-practice rows are cohort-wide (one
edit affects every attendee), placement and supervision rows are individual. One
handler cannot serve both.

### 6. Document storage

Both file inputs (`SupervisionRecords`, and the consumer record's research
notes) read `e.target.files`, keep `f.name`, and **discard the `File` object**.
The UI then lists the filename, which reads exactly like a successful upload. A
researcher would reasonably believe an attachment is stored. It is not.

### 7. The invitation lifecycle

`addCoachTrainee` is the one genuinely complete create path — but no invitation
is sent and **nothing can flip `inviteStatus` from `pending` to `active`**.
Pending is a terminal state: four of the five trainee-record tabs render a "not
available yet" empty state, the amber banner never clears, and the notification
hub begins nagging after 21 days with no action that can resolve it.

Needs an invitation email plus an accept-invite endpoint writing `inviteStatus`
and `lastActive`.

### 8. Notification read-state and dismissal

Notification dismissal is component-local `useState`. Dismissed notices reappear
on any navigation or reload, and "Dismiss all" is purely visual — a real
researcher will read this as a bug. The four `Mark all as read` / overflow
controls need a per-user store. "Read" is not a state anything here persists.

Note the two "Key updates" panels are **copy-paste, not a shared component**
(`CoachProfilePage` and `ConsumerDetailPage`). Extract before wiring, or wire
both together.

### 9. Certificate generation

`CertificationRecord` already carries `certificateGenerated` and
`certificateDate` fields that **nothing reads or writes** —
`certificateGenerated` is `false` on every record in existence while reading
like a live workflow flag. Those are the intended hooks. There is no certificate
artifact in the data model, which is why the `Download` control is inert.

### 10. Study-protocol constants belong in one place

Several thresholds encode study protocol inside component files:
`PENDING_INVITE_ALERT_DAYS = 21`, `CERTIFIED_WINDOW_DAYS = 60`, `WEEK_DAYS = 7`,
the 48-hour sync-gap rule, `GROUP_PHASE = 4`, and `GRADUATED_PHASE = 8` —
the last **declared twice, in two different files**, so a KPI tile and the table
beneath it derive from separate copies of one rule. De-duplicate that one
immediately; consolidate the rest into a `config/protocol.ts`.

### Known defects worth fixing early

Two are real bugs rather than missing features, both already annotated in code:

- **A dead-end CTA.** The highest-severity notification ("*consumer* still has no
  coach assigned") links to the consumer record, which has **no coach-assignment
  control of any kind**. The only working path is the coach record's Assigned
  Consumers tab. Because it is a live link rather than an inert button, it gives
  no cue that it cannot complete the task it names.
- **Two surfaces, one fact, different numbers.** Home's "Total consumers" tile
  counts every dyad; Consumer Management filters out dyads flagged
  `omitFromConsumerRoster` before both its rows and its own tiles. One seeded
  dyad carries that flag, so Home reads 5 where Consumer Management shows 4. Fix
  by applying the filter on Home — the flag is intentional.

### Deliberate decisions — do not "fix" these

- The trainee roster's **Certified tab renders a hardcoded "No data available."**
  and reads no data, though certified records exist in scope. Certified coaches
  are managed under Coach Management; this roster is scoped to trainees still in
  the pathway. It is a one-line change that would reverse a deliberate call.
- **`SessionsPlanOverview` is read-only by requirement, not omission.**
  Researchers must not mark a session complete or unlock a module. Do not add an
  action column.
- **Researchers do not have access** to a coach's session notes or recordings
  for coach-consumer delivery. The study-progress surfaces deliberately read
  neither.
- The trainee record's upcoming-sessions table is **read-only by design** —
  Meeting ID and an Action column were both removed because researchers are not
  meant to start or schedule sessions from that page.
