# Care2Sleep — Research Dashboard handover

This package contains a runnable design prototype of the Care2Sleep **Research
Dashboard**, plus the documentation an engineer needs to build the real thing.
The prototype is the specification: it is the reference for what the researcher
sees, what each screen means, and how the data fits together. It is not a
starting codebase — there is no backend, no authentication and no persistence
behind it. It is intended for the engineer who will design the schema and build
the production application.

---

## Scope

**This package ships the Research Dashboard only.**

The full Care2Sleep design prototype contains four portals. The other three —
the **Coach Delivery Portal**, the **Consumer Portal**, and the **coach training
portal** — are **not** part of this handover. They are not included, not
linked to, and not available. Where the code or its comments mention them, treat
it as historical context explaining why a shared component behaves the way it
does, not as a pointer to something you can open.

Some data structures here describe work those portals own — a coach's
post-practice reflection, a consumer's sleep-diary entry, session planning.
They are documented because the researcher *reads* that data, and because a real
backend has to store it. The write paths for them are not in this package.

---

## Quickstart

Requires Node 20+ and npm.

```bash
cd app
rm -rf node_modules      # currently a symlink to the authoring machine's prototype
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`). The app opens
on the Research Dashboard home page; there is no sign-in step.

Other commands, all run from `app/`:

```bash
npm run build     # tsc -b && vite build
npm run lint      # oxlint
```

Two notes on the install:

- `app/node_modules` currently exists as a **symlink** into the authoring
  machine's copy of the original prototype. It will not resolve on your machine.
  Remove it before installing, as above.
- **There is no lockfile.** `npm install` will resolve fresh versions against
  the ranges in `package.json`. Commit the lockfile it generates.

`tsc` passing is not proof the app builds — Vite's parser is stricter in places.
If you change JSX, confirm the dev server reports no transform error as well.

---

## Documentation

| Document | What it answers |
|---|---|
| [`docs/engineering-overview.md`](docs/engineering-overview.md) | How the app is put together: architecture, directory map, the eight routes, how a page renders, conventions to follow, known traps, and what to build first. **Start here.** |
| [`docs/data-model.md`](docs/data-model.md) | Every type and field with its meaning in the study's domain, stored vs. derived, the store's actions and their callers, which function is the single source of truth for each fact, testable invariants, what each seed persona demonstrates, and the open questions a schema has to resolve. |
| [`docs/integration-points.md`](docs/integration-points.md) | Every seam where a real backend or third-party service attaches — the store's whole action surface (including the third of it with no caller), auth, REDCap, Fitbit, Zoom, file upload, CSV, notifications and the clock — with the exact file, function and data shape for each. |
| [`docs/design-tokens.md`](docs/design-tokens.md) | The colour, type, radius and shadow tokens, and the component rules that are not tokens. Mirrors `app/src/index.css`, which is authoritative if the two disagree. |
| [`docs/design-handoff.md`](docs/design-handoff.md) | The measured visual spec: layout system, the three button styles, card contract, component inventory, interaction states, responsive behaviour, motion, empty states, and 15 open items for the design owner. Everything numeric was read from the running app, not from Figma. |
| [`docs/accessibility-report.md`](docs/accessibility-report.md) | A WCAG 2.1 AA audit of all eight routes: 9 open defects with measured contrast values and fixes, plus what was verified as already passing so it is not re-tested. |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | What changed in this package between hand-off revisions, why, and which documents each change invalidates. **Read this first if you have an earlier copy.** |
| [`docs/layout-audit.js`](docs/layout-audit.js) | The project's own layout-measurement script. Paste into the browser console and call `layoutAudit()`; an empty result is the pass condition. The accessibility report's re-test instructions refer to this file. |

---

## Directory layout

```
researcher-dashboard/
├── README.md                  this file
├── docs/
│   ├── engineering-overview.md
│   ├── data-model.md
│   ├── integration-points.md
│   ├── design-tokens.md
│   ├── design-handoff.md
│   ├── accessibility-report.md
│   ├── CHANGELOG.md
│   └── layout-audit.js
└── app/                       the runnable prototype
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig*.json
    ├── public/                favicon, certificate illustrations, one avatar
    └── src/
        ├── App.tsx            routes + the route map comment
        ├── main.tsx
        ├── index.css          all design tokens
        ├── data/              seed fixtures + the whole store (6 files)
        │   ├── research.ts        COACH pathway: coaches, modules, certification
        │   ├── spaces.ts          SPACES delivery: consumers, sessions, sleep data
        │   ├── research-store.tsx all mutable state and every write action
        │   ├── trainingPathwayV2.ts the 11-module coach curriculum
        │   ├── format.ts          the clock (TODAY) and formatters
        │   └── research-context.ts useResearch()
        ├── pages/research/    the 8 routes
        ├── components/
        │   ├── research/      dashboard-specific components
        │   ├── shared/        reusable pieces
        │   ├── account/       profile + password cards
        │   └── ui/            card, separator, tooltip
        └── lib/               cn() and CSV export
```

The eight routes: Home (`/research/schedule`), Trainee Management, trainee
record (5 tabs), Coach Management, coach record (4 tabs — Assigned Consumers
carries 3 sub-tabs and is where one coach-consumer pairing is read end to end),
Consumer Management, consumer record (1 visible tab), and My Profile.

**Read [`docs/CHANGELOG.md`](docs/CHANGELOG.md) before the other documents if
you have seen an earlier copy of this package** — the consumer record page was
substantially reduced and its content moved onto the coach record page.

---

## Study context

Enough to read the rest of the documentation without prior knowledge.

- **Care2Sleep** is a Monash University research intervention study. It trains
  aged care workers as sleep coaches and pairs them with people living with
  dementia and their carers, who receive structured sleep coaching over a series
  of video sessions.

- A **coach** is an aged care worker being trained by the study. A **consumer**
  is a person receiving the coaching — modelled as a *dyad*: the **PLE**
  (Person with Lived Experience, the member with dementia) and their **carer**.
  Some consumers are carer-only, with no co-enrolled PLE. Never "patient",
  "client" or "PLWD".

- **COACH** is the five-stage pathway a coach completes before working with real
  consumers: **C**ontent learning → **O**bservation (guided group practice) →
  **A**pplication (Placement 1) → **C**ommunity of practice →
  **H**ands-on assessment (Placement 2). Passing Placement 2 awards
  **certification** — never "graduation".

- **SPACES** is live delivery, which a coach enters only once certified. Each
  consumer gets **7 sessions**: one planning meeting plus one catch-up after
  each of 6 content modules. Completing a session unlocks the next module.

- **SIPTEA** is the six-component in-session coaching framework (Shared
  understanding, Implementation intent, Problem identification, Tailoring,
  Emotion navigation, Action and goals). It is the shared language across
  training, assessment and supervision. Coaches write reflective **annotation
  summaries** against it at four points in the pathway — AI-generated, then
  reviewed and approved by the coach, and shared at the coach's own discretion.
  Never call these "reports".

The Research Dashboard is the study team's view across all of this: who is where
in the pathway, who has been certified, which consumers are assigned to which
coach, and how delivery is progressing.

---

## State of the code

This is a **coded design prototype**, built and reviewed over roughly thirty
rounds of design iteration. The screens, copy, layout, interaction states and
accessibility behaviour are real and deliberate — a great deal of that detail
was settled by measurement rather than by eye, and the reasoning is recorded in
comments in the files themselves. Treat those as the specification.

What is **real**: every screen and its states; all navigation; the read paths
across the whole data model; the derived logic (stage labels, session numbering,
module unlocking, progress figures, alert rules); and a handful of genuine write
paths — adding a coach trainee, onboarding a certified coach into SPACES,
assigning and transferring consumers, ticking stages, recording a certification
outcome, and writing notes.

What is **mocked or absent**:

- **No backend, no network, no persistence.** State lives in one React context
  over seeded fixtures. Reloading the page restores the seed data exactly.
- **No authentication, and no authorisation model at all.** The signed-in
  researcher is a hardcoded object and "Sign out" is inert. `role` on it is a
  display string; nothing in the code branches on it. The study's own roles
  (research coordinator, supervisor, expert assessor) and its data-access rules
  — notably that an expert assessor sees only the endline annotation summary,
  and that researchers do not see a coach's own delivery session notes — are
  **not specified anywhere in this package**. Get that matrix from the study
  team before designing auth; it is the one input the docs cannot supply.
- **Known accessibility defects.** `docs/accessibility-report.md` records 9 open
  WCAG 2.1 AA findings, one Critical: no route reflows at 320px, because the
  sidebar never collapses. Everything else audited passes, and the report says
  which checks not to repeat.
- **The clock is frozen** at `TODAY = '2026-07-22'`. The fixtures are authored
  around it, so moving to a real clock means re-dating them in the same change.
- **Zoom links are fabricated** — and they render as real, clickable `zoom.us`
  anchors, not inert placeholders.
- **No Fitbit client.** All sleep data is seeded.
- **File uploads keep the filename only.** The file itself is discarded, though
  the UI reads as a successful upload.
- **There is no working way to add a consumer.** Intake moved to REDCap and
  there is no REDCap client; the store's `enrollConsumer` action is the intended
  import target and currently has no caller.
- **Around a dozen controls are deliberately inert** — designed, visible, and
  not yet wired. They follow one convention: focusable, `aria-disabled`, with a
  screen-reader-only "(coming soon)" cue. `app/src/components/shared/InertButton.tsx`
  documents each one and what it is waiting on; `grep -rn "coming soon" src` is
  the fuller sweep, since several are hand-rolled rather than using that
  component.
- **Some code is retained but unreachable**, most notably the session-planning
  wizard. It is heavily-iterated product logic kept because a researcher-side
  planning flow may return. Files in that state carry a header saying so.

Two things to read before changing anything: §8 of the engineering overview
(known constraints and traps) and §1 of the data model (the three things that
get modelled wrong). Between them they cover the defects this codebase has
actually shipped more than once — chiefly two screens deriving one fact from two
different fields, and session numbering, which is offset three different ways.

The data model also lists **known defects in the seed fixtures** — several
records carry dates in the future relative to the frozen clock. They are
documented rather than silently corrected, because fixing them properly means
re-dating the whole fixture set at once.
