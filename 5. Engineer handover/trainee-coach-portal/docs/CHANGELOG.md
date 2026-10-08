# Changelog — Care2Sleep Trainee & Coach Portal handover

What changed in this package between hand-off revisions, why, and what an
engineer comparing it against an earlier copy of the prototype needs to know to
follow the diff.

Entries are newest first.

---

## 2026-08-31 — First hand-off revision: cut to one portal

### What this package is

A runnable design prototype of the Care2Sleep **Coach Delivery Portal**,
covering one person's journey through two stages — **trainee** (working through
the COACH certification pathway) and **coach** (certified, delivering SPACES
sessions to real clients) — plus the documentation to build the production app
from it.

The prototype is the specification. It is not a starting codebase: there is no
backend, no authentication and no persistence behind it. See
`docs/engineering-overview.md`.

### It was cut from the full four-portal prototype

The source is a single application hosting four portals: the Research Dashboard,
the Consumer Portal, the coach training portal and the Coach Delivery Portal.
**Only the Coach Delivery Portal and the coach's learning journey ship here.**

The other portals were **removed outright** rather than shipped with a note
asking you to ignore them. If you have an earlier copy of the prototype, this is
the diff.

#### Removed — 25 files, ~19,000 lines

| Path | Files |
|---|---|
| `src/pages/research/` | 8 — `ResearchHomePage`, `RosterPage`, `CoachProfilePage`, `ConsumerManagementPage`, `ConsumerDetailPage`, `SpacesRosterPage`, `SpacesCoachProfilePage`, `ResearchAccountPage` |
| `src/pages/consumer/` | 3 — `ConsumerHomePage`, `ConsumerHealthPage`, `ConsumerAccountPage` |
| `src/components/research/` | 11 remaining after the six moves below — `ResearchShell`, `ResearchSidebar`, `ResearchPageHero`, `ResearchNotificationHub`, `TabIntro`, `SlideOverPanel`, `SessionsPlanOverview`, `AddCoachTraineeModal`, `EnrollConsumerDialog`, `OnboardCoachDialog`, `TransferConsumerDialog` |
| `src/components/consumer/` | 2 — `ConsumerShell`, `ConsumerSidebar` |
| `src/components/delivery/NotificationHub.tsx` | 1 — despite the directory, its only caller was the Research Dashboard |

**No file remains in a `research/` or `consumer/` directory.** That directory
name would have told you something untrue about who owns the code.

#### Moved into `src/components/shared/` — imports changed, bodies unchanged

Six components that the coach portal genuinely renders were already in
`components/research/`. They moved as-is:

`ConfirmDialog`, `StatusChip`, `PlanSessionsModal`, `EditSessionPlanModal`,
`SessionPlannerTable`, `SessionDateCalendar`.

#### Extracted into `src/components/shared/` — lifted out of researcher *page* files

Four more were not components in their own right at all: they were exports
buried inside two enormous researcher page modules (`ConsumerDetailPage.tsx`,
4,101 lines, and `SpacesCoachProfilePage.tsx`, 3,620 lines), which the coach
portal was importing wholesale.

| New file | What it holds |
|---|---|
| `shared/SleepHealthData.tsx` | `FitbitSyncMonitor`, `FitbitAveragesTable`, `SleepDiaryFeed` |
| `shared/ProfileDetailsSections.tsx` | The whole Profile details tab body |
| `shared/dyadHealth.ts` | `dyadHealthAlerts`, `hasRecentGap`, `dyadTitle` |
| `shared/SessionPlanEmptyBanner.tsx` | The "no session plan yet" banner |

Their bodies and comments are unchanged — only the imports moved.

**Their `viewerRole: 'researcher' | 'coach'` prop is deliberately preserved.** It
is not dead configuration now that the researcher pages are gone: it encodes a
real permissions distinction, and the `'researcher'` branch is the specification
of what a coach may *not* do. One consequence to know about — that branch links
to `/research/spaces-coaches/:id`, a route that does not exist here. It is
unreachable in this package and would need its route back alongside any future
researcher view.

#### Routes

`src/App.tsx` now registers `/`, `/delivery/*` and `/training-v2/*` only. Every
`/research/*` and `/consumer/*` route was removed with the pages behind them.
`/` is the portal switcher, now showing a **single** Coach Delivery Portal card;
its grid drops to one column and is capped at the tile's own width, because a
lone tile in the old two-column row left a visibly empty cell beside it.

#### `src/data/` was deliberately left intact

`data/research.ts` and `data/research-store.tsx` still ship in full. They still
have real readers: the store is the app's only state container, and derived
helpers on the coach side (`initialPhaseDates`, `upcomingGroupSessions`, the
`Coach` record behind My Profile) read researcher-shaped fixtures. Trimming them
would have been a data-model change disguised as a file deletion.

### Accessibility fixes applied in this package

Five fixes were made here that are **not** in the source prototype, which is
frozen. Each is marked in the code with a `HANDOVER PACKAGE ONLY` comment
stating what was measured and why.

1. **The header account menu had no accessible name below 640px.**
   `AppHeader.tsx`. The visible name is `hidden sm:inline`, so under 640px it
   leaves the accessibility tree, leaving only an `aria-hidden` chevron — the
   only unnamed control on the page. Now carries
   `aria-label="{name} — account menu"` at every width. *(WCAG 4.1.2)*

2. **Three focus-to-`<body>` losses fixed.** Each is a control that unmounts the
   moment it is activated, this project's most-repeated defect class. *(WCAG
   2.4.3)*
   - `KnowledgeCheckScreen.tsx` — answering a question.
   - `VideoPlaceholder.tsx` — playing a placeholder video.
   - `DeliveryAccountPage.tsx` — the profile Edit / Save / Cancel cycle. Focus
     now moves into the first editable field on entering edit mode and back onto
     "Edit details" on leaving it, with a `wasEditing` ref so the return branch
     cannot fire on first mount.

3. **`ModuleOverviewPage.tsx` had no `<main>` landmark**, so `AppHeader`'s "Skip
   to main content" link pointed at nothing and did nothing on that route —
   measured. Every other route has one. Added as a pure landmark wrapper: no
   layout, no styling, no change to what renders. *(WCAG 2.4.1)*

4. **`MotionConfig reducedMotion="user"` added at the root** (`main.tsx`). An
   audit measured 30 distinct animations in this portal, of which **11 read
   `prefers-reduced-motion` nowhere and animated regardless**. One was worse than
   not honouring it: the Plan Sessions loading spinner *froze* under the setting,
   giving a user who asked for less motion a stalled progress indicator instead
   of a calmer one. Applied at the root rather than at 11 call sites because the
   source prototype is frozen and a root wrapper touches no component. Components
   already guarding on `useReducedMotion()` are unaffected — this is a floor, not
   an override. See `docs/motion-spec.md` §1 for the list.

### Coach welcome banner re-arms on stage entry — review scaffolding

`DeliveryHomePage.tsx`. Selecting **Coach** in the demo stage switcher now always
lands on the tour-banner state.

Two things previously made that untrue, and both are demo-review problems rather
than product ones. `showWelcome` is a single piece of state shared by both
stages, in a component that stays mounted across a stage switch — so the
hide-on-tour-end effect fired when the *trainee* tour ended and hid the *coach*
banner before a reviewer had ever seen it, which is why the banner appeared to be
missing at random. And dismissing it once left no route back short of a full page
reload.

**This is scaffolding, not product.** In production the banner is a real
first-run state driven by a per-coach server flag (`docs/orchestration-flows.md`
§1), not something that re-arms every time a view is opened. **Delete the effect
when that flag exists.**

### Corrected stale comments

Three comments described behaviour the code had stopped doing. They were
corrected rather than left, because each would have led an engineer to the wrong
conclusion. All three corrections say in place what they replaced.

- **`DeliveryShell.tsx` — the onboarding Skip.** Two comments still described a
  Skip button and a "Get started" label, neither of which exists: Skip was
  removed in Round 34 and the label is "Go to my dashboard". Replaced with an
  explicit **"🚫 DO NOT ADD A SKIP BUTTON HERE"** note: the trainee welcome flow
  is mandatory by study requirement, and the optional `to` argument on
  `completeOnboarding` is retained orphaned capability from when a Skip did
  exist — not a hook awaiting reconnection. The focus behaviour the old comment
  described is real and still required, and is stated as such.
- **`DeliveryHomePage.tsx` — `CoachWelcomeBanner`.** The comment said the coach
  tour "does not exist yet" and that "Take tour" was `aria-disabled`. Both were
  made obsolete by Round 40. Both CTAs are wired; "Take tour" opens
  `COACH_TOUR_STEPS`. An engineer reading the stale version would have concluded
  there was no coach tour to build against.

### Unreachable files, flagged rather than deleted

Four files were given header comments instead of being removed, because each
holds product logic worth reading and none is safe to delete by accident:

- `pages/training-v2/ModuleTimeline.tsx` (~1,760 lines) — `⚠️ UNREACHABLE`
- `pages/training-v2/player/ModulePlayerHeader.tsx` — `⚠️ UNREACHABLE`
- `components/delivery/WidgetGrid.tsx` — `⚠️ UNREACHABLE`
- `components/shared/UpcomingSessionsPanel.tsx` — `⚠️ COMPONENT UNUSED — only
  its TYPE is imported`. `UpcomingSessionRow` is live. **Move the type before
  deleting the file.**

### Verification at hand-off

Run from `app/`, Node v24.18.0:

- `npm run build` — exit 0 (`tsc -b` ~3.5s; `vite build` ~0.7s, 918 kB main
  chunk, with Vite's standard >500 kB advisory).
- `npm run lint` — exit 0, **7 pre-existing `react(only-export-components)`
  warnings** across five files. That is the baseline.

### Documents this revision invalidates

None of the companion documents were written against the four-portal tree, so
none is stale. Two notes, though:

- `README.md` describes `components/delivery/NotificationHub.tsx` as shipping in
  the package. It does not — it was removed in this revision.
- `README.md` also lists "11 of 30 animations do not honour
  `prefers-reduced-motion`" under mocked-or-absent. That is now fixed at the root
  (see above); `docs/motion-spec.md` §1 remains the correct reference for *which*
  11 were affected and why the root wrapper is the right fix.
