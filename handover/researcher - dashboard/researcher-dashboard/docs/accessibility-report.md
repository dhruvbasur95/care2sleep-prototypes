# Accessibility report — Care2Sleep Research Dashboard

**Standard:** WCAG 2.1 Level AA
**Method:** live audit in the browser against the running app (`http://localhost:5199`), all 8 routes and all tab panels within the 3 record pages
**Date:** 2026-08-26
**Scope:** the handover package at `handover/researcher-dashboard/app` only. No code was changed by this audit.

---

## Summary verdict

**This is an unusually accessible prototype.** The patterns that normally fail — modal focus traps, focus falling to `<body>` on unmount, collapsed accordions leaking into the tab order, unlabelled form controls, icon-only buttons without names — are all implemented correctly here, and I verified each one functionally rather than by reading the source. Contrast is clean on 7 of 8 routes.

There are **9 genuine WCAG 2.1 AA defects**. One is systemic and affects every route (reflow at 320px); two are single-cause and cheap to fix (a double-tinted chip, a missing live region). None of them prevent a sighted mouse user from completing any task, but three of them materially block screen-reader and low-vision users.

| Severity | Count | Headline |
|---|---|---|
| 🔴 Critical | 1 | Every route forces horizontal scrolling at 320px (1.4.10 Reflow) |
| 🟠 Major | 3 | No status message on save; chips fail AA on tinted rows; alert badge at 3.45:1 |
| 🟡 Moderate | 3 | Table header associations; static page title; one heading skip |
| 🟢 Minor | 2 | Dangling `aria-controls` on inactive tabs; notification bell not a real control |

**Blocking for a production build:** the Critical and all three Major items. The Moderate items are cheap and should go in the same pass.

### A note on method, because two of my own early findings were wrong

Contrast here is **measured from rasterised pixels**, not computed from authored hex. Tailwind v4 emits `oklab()` for any colour carrying an opacity modifier (`bg-success/8`), and a naive numeric parse reads the oklab components as sRGB and returns nonsense. I resolve every colour by painting it to a 1×1 canvas over white and over black and solving for colour and alpha, then compositing the full ancestor stack before applying the WCAG relative-luminance formula. The harness was validated against this repo's own published figures and reproduces them exactly: white-on-`#e45f5b` = 3.45:1, white-on-`#4A278F` = 10.62:1, black-on-white = 21:1.

Two findings I initially recorded were retracted after measurement:

- A "4.34:1 Active chip" on Trainee Management — an artefact of the oklab mis-parse. The real value passes.
- A "1.39:1 focus ring on the purple hero band" — I had assumed the global `--ring` token (`#5300fa`) applied. The hero tabs and back link override it to `focus-visible:ring-white`, which measures **10.62:1**. Verified by reading the painted `box-shadow` under real keyboard focus.

Both are recorded here so the numbers below can be trusted, and so nobody re-derives them.

---

## Findings

### 🔴 Critical

#### C1 — Content does not reflow at 320px; all 8 routes scroll horizontally
**WCAG 1.4.10 Reflow (AA)**
**Route:** all 8

The sidebar never collapses and the page never reflows to a single column. Measured `document.scrollWidth` against a 320px viewport:

| Route | scrollWidth @ 320px | Overflowing elements |
|---|---|---|
| `/research/schedule` | 486px | 42 |
| `/research/trainees` | 649px | 38 |
| `/research/spaces-coaches` | 623px | 31 |
| `/research/consumers` | 514px | 35 |
| `/research/spaces-coaches/:id` | 559px | 37 |
| `/research/consumers/:id` | 422px | 7 |
| `/research/coaches/:id` | 422px | 1 |
| `/research/account` | 385px | 3 |

1.4.10 requires content to reflow to a 320px-equivalent viewport without horizontal scrolling. This is the width a user gets at **400% zoom on a 1280px display** — a routine low-vision setting. The page hero (`h1.text-display-lg`, the `max-w-[72ch]` sub-copy) and the hero CTA are the first things to overflow on the list pages; on the record pages it is the `Back to …` link and the two-line PLE/Carer heading.

At **640px** (200% zoom on 1280px) the picture is much better — only `/research/trainees` still overflows, and only by 9px (649 vs 640). So the failure is concentrated below ~640px, which is exactly where the non-adapting sidebar dominates.

**Fix:** collapse `ResearchSidebar` to an off-canvas/overlay pattern below a breakpoint (it already has a collapse mechanism and a persisted flag — the missing piece is a responsive default), let the hero stack, and allow the `72ch` sub-copy to shrink. Data tables may keep their own `overflow-x-auto` — 1.4.10 exempts content that genuinely requires 2D layout, so the tables are not the problem; the shell is. Fixing `/research/trainees`'s 9px at 640px is a separate one-line change.

> This was already flagged during Round 19 as "none of this app's 3 shared sidebars adapt below desktop width," recommended as its own follow-up round, and never done. It is the single largest AA gap in the package.

---

### 🟠 Major

#### M1 — Saving a note produces no status message
**WCAG 4.1.3 Status Messages (AA)**
**Routes:** `/research/consumers/:dyadId` → Notes; `/research/coaches/:coachId` → Supervision Notes; `/research/spaces-coaches/:coachId` → Supervision Logs

Filling and submitting the note form adds a row to the "Previous notes" / records table below, with **no programmatic announcement**. On the Supervision Notes tab I counted the live regions directly: `document.querySelectorAll('[aria-live],[role="status"]').length === 0`. I then polled every 120ms for 2 seconds after clicking **Save note** and captured no announcement text at any point.

Measured: `rowsBefore: 0 → rowsAfter: 1`, focus correctly retained on the **Save note** button, `liveSeen: []`.

A screen-reader user gets no confirmation that their note saved. The new row is rendered further down the page, outside the reading position. This is a Level AA criterion in WCAG 2.1.

**Fix:** the codebase already has the right pattern — `NotificationHubView` announces "Dismissed: …" and "Dismissed all 7 alerts." through an `sr-only` `role="status" aria-live="polite"` region, and it works. Reuse it in `SupervisionRecords` (one change, three call sites) and in `ResearchNotesCard`. Announce something like "Note saved." Consider also clearing/resetting the form fields, which currently retain their values.

---

#### M2 — Status chips fail AA when they sit on a tinted row (double-tinted fill)
**WCAG 1.4.3 Contrast (Minimum) (AA)**
**Routes:** `/research/spaces-coaches/:coachId` → Assigned Consumers → Study progress, and → Consumer sleep & health data
*(These surfaces moved off the consumer record page — see `docs/CHANGELOG.md`. The defect is unchanged; only the route is.)*

| Chip | Text | Composited background | Measured | Required |
|---|---|---|---|---|
| Incomplete | `#d70015` | `#f9d9dc` | **4.09:1** | 4.5:1 |
| Complete | `#1f7d37` | `#eae3de` | **4.08:1** | 4.5:1 |
| Complete | `#1f7d37` | `#e0e5e7` | **4.09:1** | 4.5:1 |
| Synced | `#1f7d37` | `#e4ece8` | **4.31:1** | 4.5:1 |

**Root cause, from the paint stack:** the chip's own `bg-*/8` fill is being applied *on top of another `bg-*/8` fill on its container*. Walking the ancestors of the "Complete" chip returns, bottom-up: `body #fffcfa` → `bg-background #fffcfa` → `bg-card #ffffff` → **`div.bg-destructive/8`** → **`span.bg-success/8`**. Two 8% washes stack, and the composite lands ~0.4 short of AA.

This is not a flaw in `StatusChip`'s tones. The 8% opacity is deliberately calibrated — the code comments correctly note that *raising* it toward 10–20% would pull contrast further down, because these text colours sit close in lightness to their own tints. On a plain white card the same chip measures 4.67:1 and passes. The bug is the **nesting**: a chip calibrated for `bg-card` is being rendered inside a tinted cell.

Worth a second look while you are in there: a green **Complete** chip is rendering inside a **`bg-destructive/8`** (red-tinted) cell. That may be correct — module status and session status are deliberately independent on this table — but a green chip on a red row is worth confirming as intended rather than inherited.

**Fix (pick one):**
1. Make the chip's fill opaque when it sits on a tinted surface (compute the composite once and use a solid token), or
2. Drop the row/cell tint behind a chip — let the chip carry the colour, since it already does, or
3. Darken the chip text specifically in the nested context. `success` would need roughly `#1a6b2f` and `destructive` roughly `#c00013` to clear 4.5:1 against these composites.

Option 2 is the smallest and keeps one chip vocabulary.

---

#### M3 — Alert-count badge is 3.45:1
**WCAG 1.4.3 Contrast (Minimum) (AA)**
**Route:** `/research/schedule` — "Items that need your attention" header

White `#ffffff` on `alert-pastel` `#e45f5b` at 14px/500 measures **3.45:1** against a 4.5:1 requirement.

This is a **known and deliberately accepted** exception, documented in `NotificationHubView` and in the Round 21 notes: it was requested explicitly over an earlier `text-ink` treatment that measured 4.88:1 and passed. I am reporting it because it is a real AA failure and this document has to be accurate about the package's compliance state, not because the decision was uninformed.

**Fix:** either revert to `text-ink` on the pastel fill (4.88:1, previously shipped), or darken the badge fill to about `#c9302c`, which carries white at ~4.6:1 and keeps the white-on-red look that was wanted.

---

### 🟡 Moderate

#### O1 — Data-cell/header associations missing in both tables on Sleep & Health Data
**WCAG 1.3.1 Info and Relationships (AA)**
**Route:** `/research/spaces-coaches/:coachId` → Assigned Consumers → Consumer sleep & health data

Column headers are correct — all 8 `<th scope="col">` on the Fitbit table, all 3 on the diary table. The row-direction associations are not:

- **Fitbit sleep data:** the merged date cell is `<td rowspan="2">16 Jul 2026</td>`, not a `<th>`. Each date spans a PLE row and a Carer row, so the date is functionally a row-group header — but it is a plain data cell, so a screen reader reading the Carer row announces "Synced, 57%, 8%, 35%, 5h 15m, 0" with **no date attached**. The `PLE`/`Carer` cell is likewise a `<td>`.
- **Sleep diary notes:** the question column (`1. How long did you nap…`) is a `<td>`. It is the row header for that row's PLE and Carer answers.

**Fix:** wrap each date pair in its own `<tbody>` and make the date `<th rowspan="2" scope="rowgroup">`; make the member cell `<th scope="row">`; make the diary question cell `<th scope="row">`. No visual change is required — style the `th` to match the current `td`.

---

#### O2 — `document.title` never changes between routes
**WCAG 2.4.2 Page Titled (Level A)**
**Route:** all 8

Every route reports the same title: `"Care2Sleep: Research Dashboard"`. Verified by navigating all 8 routes and reading `document.title` at each — `uniqueTitles: ["Care2Sleep: Research Dashboard"]`.

In a single-page app the title is the primary way a screen-reader user confirms a view change, and it is what appears in browser history and tab lists. Note this is a **Level A** criterion — the lowest bar in the standard.

**Fix:** set the title per route, e.g. `"Manage trainees — Care2Sleep Research Dashboard"`, `"Lauren Mitchell — Care2Sleep Research Dashboard"`. A small `useDocumentTitle` hook in `ResearchShell`, or per page, is enough. The `h1` on each route is already correct and distinct, so the strings already exist.

---

#### O3 — Heading level skips from `h1` to `h3`
**WCAG 1.3.1 Info and Relationships (AA)**
**Route:** `/research/spaces-coaches/:coachId` → Assigned Consumers → Consumer sleep & health data

The heading outline on this tab is `h1` ("PLE: Bruce Whitfield Carer: Joan Whitfield") → `h3` ("Fitbit sleep data") → `h3` ("Sleep diary notes"). There is no `h2`.

This is the only heading-order defect in the package — the other 7 routes and all other tab panels are clean.

**Fix:** promote the two card titles to `h2`, or introduce the tab-panel title as an `h2`. The other tabs use `TabIntro`, which supplies the intermediate level; this tab appears to have had its intro removed without the headings being re-levelled.

---

### 🟢 Minor

#### N1 — Inactive tabs point `aria-controls` at panels that do not exist
**WCAG 4.1.2 Name, Role, Value (AA)**
**Routes:** all 3 record pages (`/research/coaches/:id`, `/research/consumers/:id`, `/research/spaces-coaches/:id`)

Only the active tab panel is rendered. The other tabs keep `aria-controls="tabpanel-N"` pointing at IDs with no element — 3 to 4 dangling references per record page, on every tab.

The tabs themselves are otherwise fully correct: `role="tablist"`, `aria-selected` on every tab, exactly one `tabindex="0"`, and arrow-key roving verified working. Most screen readers degrade gracefully here. Worth noting the Home page tabs do *not* have this problem — both tabs there share a single panel `id` that always exists.

**Fix:** either render all panels and hide inactive ones with the `hidden` attribute (which also fixes the relationship for free), or omit `aria-controls` when the panel is not mounted.

---

#### N2 — The notification bell is a non-focusable `<span>`
**WCAG 4.1.2 Name, Role, Value (AA) / 2.1.1 Keyboard (A)**
**Route:** all (global header)

The bell renders as `<span title="Notifications (coming soon)">` with `tabIndex: -1` and no `aria-label`. It is keyboard-unreachable and relies on the native `title` attribute, which is unreliably surfaced by assistive tech and never on touch.

This is the **only** unwired control in the package that diverges from the project's own convention. The other 13 are all exemplary: I confirmed 7 on Home alone rendering as focusable `<button aria-disabled="true">` at exactly 36px with an `sr-only` " (coming soon)" cue in the accessible name.

**Fix:** make it the same shape as the others — a focusable `<button aria-disabled="true">` with an `sr-only` cue — or, if it is purely decorative for now, remove it. As a `<span>` with a `title`, it reads as an interactive affordance to sighted users and does not exist for anyone else.

---

### Notes — measured, not defects

These came up during the audit, are not WCAG 2.1 AA failures, and are recorded so nobody re-investigates them.

- **Modal background is not `inert`/`aria-hidden`.** 18 focusables remain in the DOM behind the open wizard, and `<body>` keeps `overflow: visible` so the page scrolls behind the modal. In practice this is covered: the dialog carries `aria-modal="true"` (which constrains AT), and the JS Tab trap works — I verified wrap-around in **both** directions with real OS key presses. Adding `inert` to the background would be defence-in-depth, not a fix for a live failure.
- **Pagination dots are 26×28px and 26×14px** on Home. Below this app's own 36px control-height convention, but above WCAG 2.2 SC 2.5.8's 24px floor, and SC 2.5.5 is Level AAA in WCAG 2.1. Not an AA failure. The project's own `layout-audit.js` already classifies labelled pagers this way.
- **`Edit` and `Delete` inert buttons render `cursor: default`** while the other five inert controls render `cursor: pointer`. An affordance inconsistency, not a WCAG issue.
- **Consumer Management wraps three two-word column headers** (`Session Plan`, `Modules Completed`, `Sessions Completed`) onto 2 lines at 1600px. Pre-existing and already recorded in the package's own sanitisation notes. Cosmetic.
- **`/avatars/participant-placeholder.svg` carries `alt=""`.** That is the *correct* accessibility treatment for a decorative placeholder. The remaining problem is a product one already flagged in the package: the same graphic renders as the portrait for every trainee and every coach, because the data model has no image field. Not a WCAG defect; still needs a real per-person image field before real participant data.

---

## Colour contrast — measured results

Every value below is composited from painted pixels through the full ancestor stack.

| Element | Route | Foreground | Background | Ratio | Required | Pass |
|---|---|---|---|---|---|---|
| Alert-count badge | Home | `#ffffff` | `#e45f5b` | 3.45:1 | 4.5:1 | ❌ |
| "Incomplete" chip | Coach → Assigned Consumers → Study progress | `#d70015` | `#f9d9dc` | 4.09:1 | 4.5:1 | ❌ |
| "Complete" chip | Coach → Assigned Consumers → Study progress | `#1f7d37` | `#eae3de` | 4.08:1 | 4.5:1 | ❌ |
| "Complete" chip | Coach → Assigned Consumers → Study progress | `#1f7d37` | `#e0e5e7` | 4.09:1 | 4.5:1 | ❌ |
| "Synced" chip | Consumer → Sleep & Health | `#1f7d37` | `#e4ece8` | 4.31:1 | 4.5:1 | ❌ |
| "Active" chip | Trainee Management | `#1f7d37` | `#edf5ef` | 4.67:1 | 4.5:1 | ✅ |
| Hero title on purple band | all record pages | `#ffffff` | `#4a278f` | 10.62:1 | 4.5:1 | ✅ |
| All body/label/heading text | 7 of 8 routes | — | — | ≥4.5:1 | 4.5:1 | ✅ |

**Focus indicators** (non-text contrast, 3:1 required — measured under real keyboard focus):

| Control | Ring | Against | Ratio | Pass |
|---|---|---|---|---|
| Hero back link | `#ffffff` 2px | `#4a278f` | 10.62:1 | ✅ |
| Hero tab | `#ffffff` 2px | `#4a278f` | 10.62:1 | ✅ |
| Primary CTA | `#ffffff` 2px + `#5300fa` 4px | `#f3efff` | 6.77:1 | ✅ |
| Table row link | `#5300fa` 2px | `#ffffff` | 7.64:1 | ✅ |
| Sidebar collapse button | `#5300fa` 2px | `#fffcfa` | 7.48:1 | ✅ |

---

## What I verified as passing

Listed so the engineer knows what is already covered and does not re-test it.

**Focus management — never falls to `<body>`.** This project's most-repeated historical defect. I clicked each control and read `document.activeElement`:

| Interaction | Result |
|---|---|
| Per-item notification dismiss | → next dismiss button; announced "Dismissed: …" |
| "Dismiss all" (whole section unmounts) | → `main#main-content[tabindex="-1"]`; announced "Dismissed all 7 alerts." |
| Wizard open | → dialog panel |
| Wizard step 1 → 2 | → advance button, retained; announced "Step 2 of 3: …" |
| Escape with data entered | → nested "Discard this coach trainee?" confirm |
| Discard confirmed | → back to the "Add new coach trainee" trigger |
| Inline "Edit details" | → first editable input (`email`) |
| Inline "Cancel" | → back to "Edit details" |
| "Save note" | → retained on Save note |
| Withdraw-coach confirm → Cancel | → back to "Withdraw coach" trigger |

**Modal dialog (Add coach trainee).** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` resolving to "Add coach trainee". Tab from the last control wraps to the first; Shift+Tab from the first wraps to the last — both verified with **real OS key presses**, not synthetic events. Escape is intercepted for a discard confirmation when data has been entered.

**Accordion (Learning Progress) — animated `height: 0` is properly concealed.** Collapsed sections carry both `inert` and `aria-hidden="true"`. I proved it functionally: calling `.focus()` on a control inside a collapsed section leaves `document.activeElement` unchanged (focus blocked); after expanding, `inert` is removed, `aria-hidden` flips to `false`, and the same control takes focus normally. The Round 20 fix is holding.

**Tabs.** Every `role="tablist"` in the package has exactly one `tabindex="0"`, `aria-selected` on every tab, and working roving tabindex — `ArrowRight` moves focus *and* selection, `Home` returns to the first tab. Verified on Home (Upcoming/Scheduled), all 3 record pages, and the nested "Dyad member" (Comparative/PLE/Carer) tablist.

**Target sizes.** No control below 36px anywhere except the two pagination dots (26px, above the 24px WCAG 2.2 floor) and the `sr-only` skip link. The notification-preference checkboxes measure 16×16 but are wrapped in a `<label>` with a **1150×44** activation area and `cursor: pointer` — SC 2.5.8 passes. The consumer/coach Profile-details checkboxes are 28×28, also passing. Record-page tabs are 44px.

**Forms.** Every input, select and textarea across all 8 routes has a programmatic label — zero `input-no-label` findings. Confirmed on the wizard (3 fields), notes forms (Title/Date/Time/Notes/Attach File), and inline contact editing (Email/Phone). The file inputs use the correct visually-hidden-input + real `<label>` pattern.

**Semantics.** Exactly one `h1` per route. No positive `tabindex` anywhere. `<main>` landmark present with `tabindex="-1"`. Skip link resolves to it and can actually move focus. All decorative SVG icons carry `aria-hidden="true"` — zero unhidden icons across every route and tab. KPI tiles are genuine `<dl>/<dt>/<dd>` pairs. `<html lang="en">`.

**Accessible names.** No icon-only control without a name. The sidebar collapse button (visually empty) carries `aria-label="Collapse navigation"`. The two-line PLE/Carer `h1` on the consumer record has an explicit `aria-label="PLE: Bruce Whitfield Carer: Joan Whitfield"` with every visible span `aria-hidden` — it announces correctly, and the unseparated `textContent` string is not what AT receives.

**Unwired controls.** All 13 designed-but-inert controls except the bell (N2) are focusable `aria-disabled="true"` buttons at 36px carrying an `sr-only` " (coming soon)" cue.

**Empty and pending states.** The pending-invite trainee record (`/research/coaches/priya-raman`), including its amber banner, is clean on contrast, semantics and layout. The `Certified` tab's "No data available." is an intentional product decision, not an unfinished state.

**Project layout audit** (`docs/layout-audit.js`, shipped with this package; run at 1600px on every route): empty on 7 of 8. `/research/consumers` returns the 3 header-wrap findings noted above, which match the package's own recorded baseline. No page-level horizontal scroll, no table overflowing its container, no control under the floor, no uneven grid rows.

---

## Recommended order of work

1. **C1 — reflow.** Largest scope, highest impact, and the only item requiring real layout work. Make the sidebar responsive first; most of the rest follows.
2. **M1 — status messages.** Smallest fix with the biggest screen-reader benefit. The pattern already exists in `NotificationHubView`; reuse it in `SupervisionRecords` (one edit, three call sites) and `ResearchNotesCard`.
3. **M2 — chip nesting.** One decision about whether the row tint or the chip tint wins; then it is a class change.
4. **M3 — alert badge.** One token. Needs a product sign-off since the current value was chosen deliberately.
5. **O1, O2, O3 — table scope, page titles, heading levels.** All mechanical, all cheap, all worth doing in the same pass.
6. **N1, N2.** Tidy-ups.

Re-test C1 by running the project's own `layout-audit.js` at 320px, and M1 by polling `[aria-live]` after a save — both are the checks that caught them.
