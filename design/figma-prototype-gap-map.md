# Figma ↔ prototype gap map — Trainee & Coach
**Audited 2026-10-05, live from Figma `xhAPgU8I5GzG9UDPHqJrnj` and the running prototype.**

Goal: 1:1 mapping. No edits to Figma font/colour styles. All states present. Clean
organisation. Engineer-facing annotations on every frame.

## Conventions (read before writing anything)

- **Sections**: SOLID fill `#1a1a1a` at **opacity 0.8** — ⚠️ measured from the live file
  (`00 · Components`, `2044:1043`). An older note said `#000000`; it is `#1a1a1a`.
  Nested sub-sections use white @ 0.5. Names are `NN · Name`.
- **Annotations** — the established format, copied verbatim from the only two that exist
  (`2074:8484`, `2131:7478`):
  ```
  2026-09-30 · NEW
  Feedback report row, the other end of the researcher's Stage CP upload. Download unwired — nothing stored.
  ```
  ```
  2026-10-02 · CHANGED
  Row carries a High or Medium priority chip, on neutral/off-white.
  Was: no chip, Purple/50 fill.
  ```
  So: `YYYY-MM-DD · NEW|CHANGED`, then what it is and what an engineer must know
  (what is wired, what is not, what it replaced).
- **Bind published styles. Never write a raw hex, font size or weight.** Figma is the
  source of truth for colour and type; do not add or amend a style without permission.
- **Every container is auto-layout** (`figma.createAutoLayout()`), and every created
  container gets `fills = []` or it paints an invisible white block.
- Annotate **in the same `use_figma` call that creates the frame**, never as a trailing pass.

---

## TRAINEE — page `2. Trainee_dashboard` (`2038:1043`)

Structure is good: sections `00 · Components` … `08 · Confetti`, frames well named.

⚠️ **Correction to this audit's own first pass.** It reported "1 annotation" per page.
That was wrong: the walk only descended one level, so every annotation on a nested node
was missed. The real figures at audit time were **28 nodes annotated on the trainee page
and 9 on the coach page**. Frame-*level* coverage was genuinely near zero, which is what
mattered, but the headline number was not.

| Section | Prototype states | In Figma | Gap |
|---|---|---|---|
| 01 Onboarding | 4 screens | 4 | — |
| 02 Home | 7 stage cards, 6 derived hero states, certification | 9 | **reflection banner (Add / Resume / "has been shared"), Stage H pending-assessment, certification burst** |
| 03 Tour | 7 steps | 7 | — |
| 04 My Learning | Part A/B gated | 2 | — |
| 05 My Notes | empty / populated / viewer / delete | 4 | — |
| 06 My Profile | read / editing / opted out | 3 | — |
| 07 Module | overview, player | 2 | **overview "coming soon"; player rail expanded + collapsed, chapter slide, case scenario, knowledge check, summary, Go-Back-Home confirm** |
| **NEW · SIPTEA reflection** | welcome ×3 · question (baseline) · question (midline, 1 recall) · question (endline, 2 recall) · Show more · review · thank-you · cancel confirm ×2 | **0** | **~10 frames — the whole wizard** |

## COACH — page `3. Coach_dashboard` (`2114:7421`)

**Annotations at audit time: 9 nodes (not 1 — see the correction above).**

| Section | Prototype states | In Figma | Gap |
|---|---|---|---|
| 01 Coach Home | default / priorities empty / no caseload / no search match | 4 | — |
| 02 Coach tour | 5 steps | 5 | — |
| 03 My Schedule | empty / scheduled | 2 | — |
| 04 Client detail | 5 tabs | 6 | **reflection review dialog + share toggle** |
| 05 Session plan wizard | welcome, 3 steps, review, loading | 6 | — |
| **NEW · Annotation wizard** | 6 SIPTEA steps · review · share · toast | **0** | **~4 frames** |
| **NEW · Edit session plan** | 1 modal | **0** | **1 frame** |

---

## Scale

~25–30 new frames and ~60 annotations. This is **more than one session's work** and is
sequenced in the handover rather than claimed as done.


---

## Outcome, 2026-10-05

**Coach page — complete and verified.** 7 new frames in `06 · Annotation wizard` and
`07 · Client detail dialogs`; all 8 sections single-column at `x: 0`, numeric order,
200px gaps; **41 annotations**, one line each, only one over 15 words (pre-existing,
inside a section that was ringfenced). Child IDs identical before and after; no orphans.

**Trainee page — in progress at session close.** Delivered and verified: the reflection
wizard section (11 frames), the real `thanks.svg` mascot (no placeholder), real
`pen-line`/`list-checks`/`send` glyphs, the cropped review-table rows fixed
(`resize()` had pinned cells to a 10px FIXED height), Home in pathway order with 7 new
reflection-banner frames, and a two-column layout. Still being worked at close: the
per-stage section split, banner UI/placement, the pending-assessment pill, and the
timeline rails.

### Two traps found here, worth not rediscovering
- **Cloning a node clones its annotations.** A cloned frame silently carried the source
  tab's annotations, so it showed three notes of which one described it.
- **`resize()` pins both axes to FIXED.** That is what clipped the review rows; the fix
  is `layoutSizingVertical = 'HUG'` *after* any resize.


---

## Outcome, 2026-10-06 — re-sync of the coach view to Round 56

The coach page was complete and verified on 2026-10-05; Round 56 then changed the
coach view substantially the same day. This entry covers mirroring those changes.

### Delivered and verified

**Coach page `3. Coach_dashboard` (`2114:7421`) — now 10 sections, single column at
`x: 0`, 200px gaps, numeric order, every frame annotated (61 annotations, none over
15 words).** Sections renumbered so a reader finds a surface by name, not by build
order:

| Section | Frames | State |
|---|---|---|
| `00 · Coach components` | 32 | **+20**: 16 lucide icon components, 4 debrief doodles |
| `01 · Coach Home` | 4 | unchanged |
| `02 · Coach tour` | 5 | unchanged |
| `03 · My Schedule` | 2 | unchanged |
| `04 · Client detail` | 9 | **+3** banner frames; checklist inside the planned frame swapped |
| `05 · Pre-session checklist` | 14 | **new** |
| `06 · Client detail dialogs` | 2 | renumbered from 07 |
| `07 · Session plan wizard` | 6 | renumbered from 05 |
| `08 · Coach reflection wizard` | 13 | **rebuilt** — the 5 stale `Annotation wizard` frames deleted |
| `09 · Planning transcript flow` | 4 | **new** |

**A · Pre-session checklist.** Tab row 3 → 5 (`Fitbit data · Sleep diary data ·
Module recap · Client module reflection · Previous session notes`), panel a fixed
440px with one scroller. 14 card-level frames (1192 wide, the whole
`PreSessionChecklist` card so the active tab reads), all with real data pulled from
the running app rather than invented: Fitbit Average×Comparative / Average×PLE /
Night×Comparative / Night×Carer / empty; Sleep diary populated + empty; Module recap
populated + unwritten-summary + no-module; Client module reflection populated + empty;
Previous session notes populated + empty.

⚠️ **The Fitbit table in the old Figma frame was wrong, not just stale** — it showed
`REM % · Deep % · Light % · Duration · Disturbances`. The real columns are
`Total sleep time · Time in bed · Sleep efficiency · Sleep latency · WASO ·
Early morning awakening`. Anything built from that frame would have been wrong.

**B · Coach reflection wizard.** 13 frames replacing 5: gate, dead end, welcome,
question 1, questions 2–6, review, transcript (empty), transcript (uploading), transcript (attached), mark
complete, thank you, the non-destructive leave confirm, and the help dialog. The
question is `title` (20/500) left-aligned and numbered; the SIPTEA chip is centred
above it; the progress bar is 8 circles (6 questions + Review + Transcript) and is
drawn, not described. The old frames showed a vertical `WizardProgressRail` in a
`Purple/50` box and a red "Discard confirm" — both gone from the prototype.

**C · Planning transcript flow.** Welcome → upload → thank you → leave confirm, with
no gate, no questions, no review, no stepper. Its entry point, the yellow
`Your session plan is ready` banner, sits in `04 · Client detail`.

**D · Client detail banners.** Three card-level frames: debrief `Add reflection`,
debrief `Resume reflection`, planning `Upload transcript`. The artwork is the real
`BannerBlob` (cloned from the Home welcome banner, gold `#C28C03` back sheet) plus
the four real `/illustrations/debrief/*.svg` exports imported as components.

**E · Researcher page `1. Researcher_dashboard` (`443:5287`).** It did have frames
for this, so they were treated:
- `reflections table` rebuilt to **seven rows**, Session 6 down to Planning. Planning
  carries a transcript and dashes in the other two columns; Session 1's consumer
  feedback is a `Skipped` chip; unheld sessions are all dashes; no pager.
- The same seven-row table replaces the 4-row background copy inside all three
  `— View ...` frames; those frames and their scrims grew 175px to match.
- `Coach profile / Session reflection — View reflection` now renders the shared
  `ReflectionReviewTable` (header `SIPTEA component` / `Coach's answer`, 24px SIPTEA
  disc per row, no per-row Edit) instead of the bespoke 180px label column.
- Row strokes moved `#f5f5f7` → `neutral/lighter-grey` `#e0e0e0`, which is what the
  prototype paints, and `View`/`Download` gained the underline they carry at rest.

### Verified
- Every new frame re-read with `use_figma` after writing and compared against the
  live DOM by **measurement**, not screenshot: checklist card 1192×671.4 against the
  app's 1192×669.4, header 104 exact, panel 440 exact, tab labels within 1px, Fitbit
  column widths within 2.6px of `getBoundingClientRect`, wizard panel 920×820 exact,
  progress bar 420×28 exact. All 40 reflection ticks were read back out of Figma and
  diffed against the live DOM, person by person.
- Final sweep: **10 sections, 91 frames, 62 annotations, 0 issues** — single column
  at `x: 0`, numeric order, 200px gaps, no stray page children, no duplicate node
  ids, every frame annotated, none over 15 words.
- An **independent verification agent**, given only the prototype and the Figma page,
  was run against the whole build. It found 3 HIGH, 1 MEDIUM and 2 LOW. All six were
  checked against the source before acting; all six are fixed:

| # | Finding | Fix |
|---|---|---|
| 1 | **Module recap fallback drew an impossible state.** `lesson` gates the number cell *and* the summary cell, so a fallback summary forces `Not numbered` — and `daytime-habits` is the one module that *has* an episode, so it can never reach the fallback at all. | Rebuilt on a module that genuinely lacks one: `Not numbered` / `Understanding sleep and dementia` / `Completed` / fallback sentence. |
| 2 | **Sleep diary empty drew a window caption that cannot render.** The caption is gated `averaging && windowDates.length > 0`; `windowDates` derives from `dates`, so when the log is empty the caption is absent. (Contrast the Fitbit empty state, where keeping the controls *is* correct — those gate on the dyad, not the window.) | Caption removed from that frame only. |
| 3 | **The cancel dialog's "Your answers are saved" copy sat over an unanswered question screen.** On that screen the app says `You have not answered anything yet…` with a `Close` button. | The screen behind now carries a written answer, so the drawn copy and buttons are the ones the app produces. |
| 4 | The dropzone's **`uploading` stage had no frame** — a third state with its own markup and live region. | New `Reflection · 6b Transcript (uploading)`. |
| 5 | Module-recap chip drawn only as `In progress`; Fitbit `Average × Carer` and the fourth cancel-dialog body undrawn. | `Completed` now drawn (fix 1). The other two are **deliberate sampling** — `× Carer` is structurally identical to `× PLE`, and the fourth cancel body differs by one clause; recorded here rather than drawn. |
| 6 | Frame named `Question 1 of 6` over a bar reading `Step 1 of 8` — the exact two-counters-disagreeing trap. | Renamed `Reflection · 3 Question 1 (Shared understanding)`. |

The verifier found **no copy mismatches at all** across the 14 checklist frames, 13
reflection-wizard frames, 4 planning-transcript frames, 3 banners and the researcher
page, and confirmed every Fitbit value, all 40 reflection ticks and all four copies of
the seven-row researcher table cell for cell.

### Deviations recorded rather than hidden
- **15px tab labels are raw** (54 Semi Bold + 170 Medium occurrences). The app's tab
  rows are `text-[15px]`; the file has no 15px text style and styles may not be added
  without permission. Pre-existing convention, matched rather than changed.
- **SIPTEA component hexes and tinted chips are raw.** `S #c85a32 · I #2e8f82 ·
  P #dfa934 · T #c4547c · E #4a90c4 · A #7c9a3a` have no styles, and an 8%/20% tint
  cannot be expressed on a bound style — the file's own `plan-chip` already uses
  flattened composites (`#e8f3ea` / `#cfe6d5`), and this follows it.
- **The Care2Sleep logo's 13 vector paths carry a raw `#3a00ad`** in every chassis
  clone. Inherited from the existing chassis, not introduced here.
- **`Illustration / session-plan-calendar` still paints `#8447ff`**, the *old*
  `Purple/500` from the superseded file key. Pre-existing, on the no-plan frame, and
  left alone because it is imported artwork — but it is a live colour drift.
- Icon and art components in `00 · Coach components` carry no annotations, matching
  the 8 pre-existing icon components there.

### Traps found here, worth not rediscovering
- **Setting `fontName` after `setTextStyleIdAsync` silently detaches the style.**
  46 headings ended up as raw 20/Medium this way — and `title` is *already*
  Inter Medium 20, so the override was both unnecessary and destructive. Audit for
  `textStyleId === ''` after any text pass; do not trust that it looks right.
- **`resize()` pins BOTH axes to FIXED** (the 2026-10-05 trap, hit again in a new
  form): `layoutSizingHorizontal = 'FILL'` *before* `resize(10, 200)` leaves the node
  10px wide. It collapsed four file dropzones and the help placeholder to a sliver.
  Set the sizing modes *after* every resize.
- **A rotated auto-layout child sizes its parent by its rotated bounding box.** The
  debrief banner came out 172.5px instead of 160. Wrap the rotated artwork in an
  unrotated fixed-size box and make the rotated node an ABSOLUTE child of it.
- **`createNodeFromSvg` returns GROUPs for `<g>` elements, and GROUP has no
  `constraints`.** The whole script rolls back on the throw, so guard with
  `'constraints' in child` or strip `<g>` wrappers from the SVG first.
- **A CSS negative margin has no auto-layout equivalent.** The checklist tab row
  overhangs its wrapper by `-ml-4`; the faithful reproduction is an ABSOLUTE child at
  `x: -16` inside a fixed-height wrapper, not a smaller padding on the parent (which
  moves the wrapper's own bottom rule 16px too far left).

### Still open
- The **trainee page** items listed in the 2026-10-05 entry are untouched: the
  per-stage section split, banner UI/placement, the pending-assessment pill, and the
  timeline rails.
- The researcher transcript viewer has **no separate frame for the Planning row**
  (`Session transcript: Planning`). It is the same dialog with a different title, so
  it was treated as one state, not two.

### Flagged in the prototype, not changed
Verification surfaced one thing that is **not** a drawing error — Figma and the
prototype agree — but is worth a product call. The coach's *Previous session notes*
panel shows a note titled **`Session 1: Onboarding`** while the upcoming session is
**Session 4**, so the note on screen is not the previous session's. Its title also
says "Onboarding", a label the rest of the app replaced with "Planning". The panel
picks the newest `autoGenerated` note for the dyad, and only one exists in the seed.
Seed data, not markup — left alone because the prototype is signed off.

---

## Follow-up, 2026-10-06 — My reflections, and two defects the user caught

### Prototype change mirrored into Figma
Direct instruction against an annotated screenshot of the coach's **My reflections**
tab: remove the reflection excerpt column, make the session number compulsory, and
rename `Date Added` → `Date Shared`. Done in the prototype (see
`progress-log.md` Round 57) and mirrored in `Client detail · My reflections`
(`2190:3932`): the `Reflection` column deleted from the header and all three rows,
`Date Shared` now the flexible column at 880px with `px-8`, `Session` widened
140 → 200, and the `View` links corrected to `Purple/500` **with the underline they
carry at rest** — they were `Purple/700` and undecorated.

### Two defects found by the user, both mine
1. **The checklist and member tab underlines were not sitting on the rule.** I built
   them as in-flow children under a vertically-centred label, which left ~10.7px of
   dead space between the underline and the tablist's hairline. The app anchors them
   `absolute … bottom-0`. Fixed on **57 tabs** by making the underline an ABSOLUTE
   child at `y = tabHeight - 2`. The page-level tab rows were already correct — the
   earlier session built those properly, so this was not a shared pattern error.
2. **A stale three-tab checklist survived in `Edit session plan · Modal`**
   (`06 · Client detail dialogs`). My rebuild swept sections `04` and `05` and the
   wizard chassis, and missed this one; it still read
   `Fitbit data · Sleep diary notes · Previous session notes`. Swapped for the
   current five-tab card. **It was only found because fixing (1) walked every tab on
   the page and flagged one at an odd height** — the alignment complaint surfaced a
   content defect nothing else had.
   A page-wide check now confirms **0 checklists with anything other than five tabs**.

Six member/checklist tabs on `Client detail · Client sleep & health data` were also
43px against the 41.4px everywhere else (pre-existing); normalised.

**Re-swept after the fixes: 10 sections, 91 frames, 62 annotations, 0 issues, 0
stray page children.**

### Added to the open list
`04 · Client detail`'s six tab frames paint `Purple/700` where the app paints
`primary` `#3a00ad` — `Back to Home`, the client names, the idle tab labels. Only
the `View` links in the rebuilt table were corrected. A one-pass sweep, not done.

---

## Follow-up 2, 2026-10-06 — the session plan wizard rebuilt, two missing page states, logical order

Reported: *"session planner wizard screens completely broken in figma, and not
matching at all"*, *"planning transcript screen also not matching"*, *"post session
screen with banner asking user to add reflection also missing"*.

### `07 · Session plan wizard` — rebuilt, all 6 frames
**The break was structural, not cosmetic.** Live, the panel is
`h-[85vh] max-h-[820px] max-w-[888px]` — a **constant 888×820** with the content
scrolling inside and the footer pinned. The Figma panels hugged their content, so
they measured 451 / 544 / 520 / 716 / 525 / 133 and the footer floated to a
different place on every screen. Content was wrong too: step 1 drew a single small
weekday row where the app has three numbered question cards and a dashed summary.

Rebuilt against the running app:
- **Welcome** — `display-md` heading, 640px blurb, and the real four-step row:
  160px columns 32px apart with a 2px connector running between the first and last
  circle centres, each circle 56px carrying its lucide glyph
  (`CalendarDays` amber, `BookOpen` green, `Video` and `ListChecks` purple).
- **Step 1** — three question cards (`rounded-sm`, 1px `parchment`, `purple-50`,
  a `2px 4px 16px rgba(85,85,85,.08)` shadow) holding the 5-day weekday picker at
  the live 147.6×68, the first-session date and the two time fields, then the dashed
  `primary` summary card.
- **Step 2** — six unlock days, each labelled with the days it leaves before the
  catch-up, plus the catch-up read-back line.
- **Step 3** — the Zoom link band and the six-step walkthrough carousel with its
  `‹ Step 1 of 6 ›` nav and screenshot placeholder.
- **Step 4** — the plan summary with its four bolded facts, then the real six-week
  planner table (`Week · Module available · Session · Catch-up date and time ·
  Action`) with a per-week `Modify`.
- **Loading** — full-panel, footer removed, progress bar and percentage.

New `Icon / book-open` component (lucide, bound to `neutral/black`).

### Two page states that had no frame
- **`Client detail · Coaching workspace (session held)`** — the post-session state
  the user asked for: the yellow debrief banner above the session card, a
  `Completed` chip beside the session name, and `Join Zoom session` in its inert
  attended form. Previously only the banner existed, as a card-level frame.
- **`Client detail · Coaching workspace (plan just created)`** — the page carrying
  the planning banner.

### Planning transcript flow re-chassised
Its four frames sat over **Bruce Whitfield's ordinary client page**. The flow is
only ever reached from the page whose plan was just created, so all four now sit
over `Coaching workspace (plan just created)` — the yellow `Your session plan is
ready` banner is visible behind the modal, which is the whole context for the
screen.

### Logical order
Sections renumbered to the order a coach meets them, not the order they were built:
`07 Session plan wizard → 08 Planning transcript flow → 09 Coach reflection wizard`
(plan the sessions, file that planning transcript, then reflect after each session).
Previously the reflection wizard sat between them.

**Swept after: 10 sections, 94 frames, 64 annotations, 0 issues, 0 stray page
children, 0 checklists with anything but five tabs. Wizard panels measure
888×820 ×6 and 920×820 ×17 — each matching its own live modal.**

### Trap worth keeping
**A modal whose live height is fixed must be drawn fixed.** Every one of these six
frames was individually plausible and collectively wrong, because a hugging panel
silently encodes "this dialog resizes to its content" — the opposite of what the
app does, and the reason the footer appeared to wander. Check the panel's own
height class (`h-[85vh] max-h-[...]`) before drawing a modal, not just its width.

---

## Full audit, 2026-10-06 — every coach frame checked, every finding fixed

An independent agent audited the four sections nobody had re-verified
(`01 Coach Home`, `02 Coach tour`, `03 My Schedule`, and `04`'s six tab frames)
against the live app. It returned 4 HIGH, 2 MEDIUM, 1 LOW. Each was re-checked
against the running prototype before acting; all are fixed.

| # | Finding | Fix |
|---|---|---|
| 1 | **`Client sleep & health data`'s Fitbit table was stale in the same way the checklist's had been** — `Date · Member · Sync status · REM % · Deep % · Light % · Duration · Disturbances`, including a `Sync status` column with 40+ chips the prototype has never had. Live is `Date · Member · Total sleep time · Time in bed · Sleep efficiency · Sleep latency · WASO · Early morning awakening`. **Two frames in one file disagreed.** | Replaced with the correct eight-column table and its real values. |
| 2 | **`Client Profile Details` was missing nine fields** that render for every dyad — PLE `Sleep issues`, `Current medications relevant to sleep`, `Years since diagnosis at enrolment`, `Dementia type`, `Comorbidities`; Carer `Sleep issues`, `Current medications relevant to sleep`, `Primary carer`, `Own health conditions` — plus a `Status` row in Study information. | All ten rows added with live values; every record row top-aligned so a wrapping label no longer drags its value down. |
| 3 | **Bruce's `Next Session Date` read `22 Jul 2026`; live is `2 Sep 2026`** — and the same frames already said `2 Sep 2026` twice elsewhere. | Corrected on all 8 clients-table rows across sections 01 and 02. |
| 4 | **The sleep-diary state had no frame at all**, and `2142:9436`'s annotation described a "13-question Consensus Sleep Diary grid" the app does not have. Live it is a **9-question, one-night-at-a-time** table with its own three tiles, a date stepper and `Night 18 of 18 on record`. | New frame `Client sleep & health data · Sleep diary notes`; annotation rewritten. |
| 5 | **Coach tour step 1 drew a `Previous` button** that does not exist on step 1. | Hidden on the coachmark instance (instance children cannot be deleted). |
| 6 | **`Purple/700` `#4A278F` where the app paints `--primary` `#3a00ad`.** Measured live by rasterising painted pixels: the greeting, the `My schedule` h1, hero client names, the **active** record tab, `Back to Home`, the session name, `View`/`Edit` links and the Home welcome banner fill are all `#3a00ad`. Idle tab labels are correctly `neutral/dark-grey` — the agent corrected my assumption there. | Swept page-wide: **223 fills + 103 strokes**. `Purple/700` now has zero uses on this page. |
| 7 | `"4 Sept 2026"` — a four-letter month the app never produces. | → `4 Sep 2026`. |

Also found while fixing #5: a **stale four-column reflections table** survived on the
page behind `Client detail · Reflection review dialog`, still carrying the removed
`Reflection` excerpt and `Date Added`. Swapped for the current one.

**Final sweep: 10 sections, 95 frames, 65 annotations, 0 issues, 0 `Purple/700`
uses, 0 stale checklists, 0 stray page children.**

### A mistake worth recording
Fixing #5 I wrote a loop that walked up from the `Previous` text looking for an
ancestor whose name matched `/button/i`, and deleted what it found. No ancestor
matched, so it walked to the top and **deleted the entire step-1 tour overlay** —
scrim, spotlight and coachmark. Nothing in the API undoes that. It was rebuilt
from the live tour (spotlight 1208×117.3 at 264,128; card 320 wide at 272,248.3),
which is more accurate than what was there, but that was luck rather than design.
**Never let an upward-walk fallback terminate at the root: bound it, and assert the
node you are about to remove is the one you meant.**

---

## 2026-10-07 — The unified button system (app + Figma + docs)

Direct instruction: *"update your design token books for buttons in here, then update
buttons master component in figma to mirror, then update researcher dashboard page, to
check if the new buttons system master component is working or not"*, with the shape
given as *"Primary, secondary, ghost, each with static, hover, deactive state"*,
*"a colour is not a variant"*, and sizing settled at **40 for researcher/trainee/coach,
48 for consumer**.

### What was wrong, measured
- **App:** 50 distinct button class signatures in the researcher files alone — three
  radii, nine fills, heights of 32/36/44 for the same kind of action, and "Edit details"
  rendered four different ways on four pages.
- **Figma:** the `Button` set carried **15 `Style` values across 90 variants**, and the
  word "filled" meant three different things (`Filled`, `Outline filled`, `White filled`).

### Delivered
| | |
|---|---|
| `design-tokens.md` | new **§99**; `button-primary`/`-secondary`/`-utility`/`-destructive` and the 36px control-height rule struck in place with pointers |
| `CLAUDE.md` | Buttons row rewritten onto the five axes |
| `buttonSystem.ts` | the one source — `btn({ variant, tone, state, size, surface })` |
| `buttonStyles.ts` | **defines nothing**; the six old names are thin wrappers over `btn()` so there is no second system |
| `/button-system` | spec page rendered from `btn()` itself, with a dashed hit-area toggle |
| Figma `Button` | **15 styles → 3 variants**; 90 → **84** variants on `Style × Tone × Size × State` |
| Researcher app | 74 call sites migrated; `ConfirmDialog`, `TablePager`, `MeetingsSection`, both account cards and Research Home's quick actions all on the system |
| Researcher Figma | **259 instances**, zero Utility, all 40px, zero broken |

### Three defects the spec page exposed, all by rasterising painted pixels
1. **`secondary`'s hover painted white** — identical to its resting state. The resting and
   hover paints are both unprefixed in the `hover` state, so `bg-white` and `bg-primary/10`
   collide and **stylesheet order decides, not source order**. Fixed by composing through
   `cn()`. This is the most repeatable trap in the system.
2. **A solid tone's hover must darken, never fade.** `bg-success/90` composites to
   `rgb(53,138,75)`; white on it is **4.30:1** against a 4.67:1 resting state — fading walked
   a passing button *under* AA. Now `color-mix(… black 12%)`.
3. **`deactive` on a brand band measured 2.28:1.** Exempt from 1.4.3, but invisible. Now 4.14:1.

### Migration order that avoided breakage
Six styles disappeared, so **every instance was re-pointed onto its keeper first**
(researcher + trainee pages), *then* the variants were deleted, *then* the survivors were
renamed to add `Tone`. Zero instances were ever left on a missing component. The trainee
pass hit the held-node trap (`setProperties` destroys nested instances and invalidates a
`findAll` array) — fixed by collecting ids and re-fetching, and by skipping `I…;…` nested
ids, which cannot be re-pointed independently of their parent.

### Verified
`tsc -b` and `oxlint` clean; Vite clean; 8 researcher routes — zero utility buttons, every
pill 40px, no horizontal page scroll, worst live contrast **5.38:1**. Modals checked
(`ConfirmDialog`, Onboard coach, Add coach trainee) — all 40px.

### Left open
- **Trainee and coach Figma pages** still carry their own instance heights (36/44); their
  app surfaces are not migrated. Only the researcher dashboard was in scope for the check.
- **6 `layout-audit` findings are pre-existing**, unchanged by this work: 4 table-header
  wraps on Consumer Management (from the in-flight Session Plan / Modules Completed
  columns) and 2 known checkbox false positives on the consumer record page.
- `components/ui/button.tsx` is the stock shadcn Button with **zero callers**; it is not
  this system and should probably go.
