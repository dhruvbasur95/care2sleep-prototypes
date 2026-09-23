# Care2Sleep — Design Tokens

**Purpose:** Project-wide design token source for all Care2Sleep prototype rounds and portals. Created in Round 1 (Coach Training Portal); later rounds extend this file — do not fork or recreate it.

**Source:** `design/DESIGN-apple.md` — adopted at the **token level only** (color, typography, spacing, radii, elevation). The source documents apple.com's marketing site; its literal components (product tiles, buy configurator, marketing heroes) do not map to a dashboard and are **not** reproduced here. Tokens below are re-expressed as dashboard-appropriate component specs.

**Status:** v55 (see §65 for the latest; this summary paragraph itself lags far behind, trailing off around §28 — check the numbered sections and the Change log table below for the authoritative recent history) — v2 covered Round 1 (Training Dashboard + Module shell); v3 added the Round 2 Research Dashboard patterns (§9); v4 was a system-wide density/shadow decision (36px controls, soft card shadow); v5 added §10 `sidebar-nav`; v6 added §11 (Trainees area); v7 added §12 (sub-round refinements); v8 added §13 (Round 3, Coaches/SPACES area); v9 added §14 (Round 3 post-signoff sidebar-accordion + `cn()`/`tailwind-merge` fix); v10 added §15 (Round 3.1, Coaches-area post-signoff feature additions — Coach Profile tab, add/transfer-consumer dialogs, carer-only `dyad-card` variant, gated `withdraw-participant`); v11 added §16 (Round 4, Consumer Management area — table, enroll dialog, consent repository, module-engagement tab, Fitbit sync monitor, sleep diary feed, coach-matching gate); v12 added §17 (Round 4.1, cross-portal UI refinements — sidebar-nav parity/tooltips, `display-md`-capped titles, avatar removal, `section-tabs` relocation + sliding underline, full-bleed `bg-pearl` hero band, unified header account `Menu`, reworked `module-card`); v13 added §18 (Round 1.1, Coach Training Portal SSO sign-in gate — `signin-backdrop` token, 4-step `sign-in-flow`, `training-auth-gate` mechanism); v14 added §19 (Round 5, the Consumer Portal Health & Sleep Dashboard, the first round for this portal — `consumer-shell`, no-seam `pearl-band`, horizontal `session-roadmap`, `digital-sleep-diary`, `unified-data-visualization`, `trend-analysis`, `upcoming-schedule`, session-completion date/time shared-field extension); v15 added §20 (Round 5.1, Consumer Portal Home + Health & Sleep refinements — `--color-highlight` token, `topBanner` sticky slot, forked researcher/consumer `fitbit-sync-monitor` copy, `formatTime` helper, card height-balance pattern). v16 added §21 — Round 6.1 (Phase 1), Coach Delivery Portal Home page widget system: a new `widget-tile`/`widget-picker` pattern — a default grid of real/inert monogram-icon tiles (Coach Training Portal, Gmail, Calendar, Zoom) plus a dashed-border "+ Add widget" tile opening a `ConfirmDialog`-chassis picker (Slack, Microsoft Teams, Outlook, Google Drive) whose rows add further decorative tiles to the grid — no fabricated brand SVGs anywhere, every icon is a `lucide-react` glyph in a brand-tinted square badge. v17 adds §22 — Round 6.1.1 (direct chat-edit batch, same page): supersedes §21's no-fabricated-logos rule for the 3 default non-training tiles only (Gmail/Calendar/Zoom now render real downloaded brand PNGs, sourced from the round's own Figma reference — picker-added tools are unaffected, still generic lucide-react glyphs); new shared `search-input` component (replaces two hand-rolled variants across the Research Dashboard and this portal); consumers-table View/Session-Link column consistency fixes; an extracted shared `downloadCsv` helper; and a scrollable `upcoming-sessions` list with a tuned partial-next-item peek. v18 adds §23 — Round 6.2 (Coach Delivery Portal, Consumer Detail View): a new `wizard-progress-rail` pattern for the "Add annotation summary" modal's 6-step SIPTEA wizard — a declared divergence from `session-tracker`'s (§13) dot/tick/connector-line grammar, same marker/connector shapes and existing color tokens (`bg-success`, `bg-primary`, `border-hairline`, `bg-divider-soft`), reused for transient wizard-step progress (not-yet-reached / current / answered) instead of a persisted, revertible data record; a required "Step N of 6" accessible name is flagged for Phase 4; and a pattern-level (not code-level) description of the 4 additional interaction rules a multi-step wizard needs on top of the reused `ConfirmDialog` chassis. **v19 adds §24 — Round 6.2.1 (reopened Round 6.2, direct chat-edit batch, no pre-written scope plan): a new `account-tab` pattern — every portal's sidebar gains a plain leaf-area "Account" destination reusing the existing `AreaLink`/`NavLink` grammar verbatim (`DeliverySidebar` refactored from one hardcoded link into the same array-driven pattern `ConsumerSidebar` already used, to support it); two new shared components, `NotificationPreferencesCard` (Email/SMS checkboxes) and `PasswordChangeCard` (current-password → email-a-reset-link, modeled on `SignInPage`'s own forgot-password flow — never an inline new-password field); a new destructive-toned `opt-out-card` pattern (soft `border-destructive/30`/`bg-destructive/5` tint while offering the choice, escalating to a solid-fill persistent banner once acted on — the softer treatment for an *offer*, the stronger one for a *consequence*); and a `heroNoSeam` extension to `ResearchShell` (it lacked this prop; `DeliveryShell`/`ConsumerShell` already had it) for a `hero` with no tab row underneath it, since the shell's tab-seam assumption (zero bottom padding, seam = the tab row's own edge) otherwise leaves a plain title+subtitle hero flush against the content below.** §24 also folds in a same-day continuation of the same Round 6.2.1 batch: `SupervisionRecords`'s new `rightSlot` prop + a bottom-aligned "Schedule a session" button, the Consumer Portal Home's "Upcoming schedule" → "Upcoming sessions" retitle/reposition, both "Assigned coach" cards' Name-as-field fix, an app-wide "Patient" → "PLWD" terminology sweep, annotation entries no longer repeating the consumer's name per entry (with the "Previously shared annotation summaries" section removed from the Delivery Portal's per-consumer page), and a `PasswordChangeCard` focus-management accessibility fix. v20 added §25 — Round 6.3 (Coach Training Portal, new version / "Option B", first round for this new route family): a fork point (`/training/choose`) between the untouched Option A and the new Option B; a forced-linear `certification-pathway-stepper`; a `module-timeline` rebuilt mid-round after direct feedback that its first pass (rainbow tag chips, duplicated "Module N" headings) read as a generic AI-generated dashboard — the fix replaces invented decoration with real data (a `slideComposition()` content breakdown from actual slide types, a `consumerParallelTitle()` line shown only for the 2 of 6 modules with a genuine match against real `CONSUMER_MODULES` content) and demotes "Module N" to a secondary eyebrow behind each module's real title; and a `module-preview-modal`. The rebuild was preceded by a 2-proposal design panel + judge/synthesis specifically to counter the generic-pattern failure mode being corrected — first misapplied to the wrong page by a typo misreading, fully reverted, then correctly applied. **v21 adds §26 — Round 7 (Coach Training Portal Option B, module content player, first build of what happens after "Start module"): a new `/training-v2/module/:id/play` route rendering a data-driven chapter loop (module intro → per-chapter Learn/Case examples/Knowledge check/What to expect/chapter-complete → module outro → module complete), fully content-populated for Module 4 ("Understanding Sleep") only. New `module-player-progress-bar` (horizontal cousin of §23's `wizard-progress-rail`, same 3-state colour language); `video-placeholder` (gradient thumbnail + duration badge + the video's real "Covers…" teaching text shown as visible copy + a simulated watch-through, standing in for all 6 of Module 4's video slots since no real assets exist); `case-example-screen` (3 sequential sub-screens, one video-format + two written reveal-on-tap); `knowledge-check-step` (one question at a time, True/False buttons or a free-text self-check, immediate answer reveal); `what-to-expect-screen` (static SIPTEA-tagged reference list); and 4 plain transitional screens. `sleep-basics` was chosen as the Module 4 stand-in (flagged, not silently decided) since none of the app's 6 existing pathway modules is literally numbered "Module 4" yet.** **v23 adds §28 — Round 7.1 (direct chat-edit batch, no pre-written scope plan): a new `module-overview` template (`ModuleOverviewPage.tsx`, Figma node `1:1433`, route `/training-v2/module/:id/overview`) replacing `ModulePreviewModal.tsx` outright — full-bleed hero (badge/title/description/estimated time over `moduleArt()` + a `bg-black/70` overlay) with hero and outline-section content sharing one left edge, plus a "Module outline:" row list (module intro → per-chapter rows → module outro, completed/current/locked, each row's separator-glued `MetaLine` meta text) beside a "By the end of this module" outcomes card; degrades gracefully (hero only + "Module breakdown coming soon.") for any module id without populated outline content. `ModuleTimeline.tsx`'s cards were rebuilt again to match Figma nodes `59:2244`/`59:2270` (marker colour corrected — completed = `bg-success` checkmark, current = solid `bg-primary` fill, no lock badge on the marker itself; cover art ~46% card width; every card CTA now routes to the new overview page, replacing the old modal/direct-to-player branch). `ModulePlayerPage.tsx`'s Exit button became `?from=`-aware, returning to the specific overview page it was launched from rather than always the home timeline. Design critique (initial pass) found and fixed 2 real, minor issues: `MetaLine`'s separator was glued to the *start* of each part, which could strand a lone leading "·" opening a new line on a narrow-width wrap (3-part rows only) — re-glued to the *end* of the preceding part instead; and `ModuleTimeline.tsx`'s two primary-fill buttons (module-card CTA, Certificate download) were missing `hover:bg-primary-hover`, present on every other primary button app-wide including this same round's own `ModuleOverviewPage.tsx` — added to both. Accessibility review (initial pass) found and fixed 1 major issue: arriving at the overview page left focus stranded on `<body>` with no announced context — fixed with a focus-managed `<h1>` keyed on `moduleId`. No new colour/type/radius tokens.** Extend only when a new round introduces a genuinely new pattern.

---

## 1. Color tokens

### Brand & interactive

| Token | Value | Use |
|-------|-------|-----|
| `primary` | `#0066cc` | **The single interactive accent.** All links, primary CTAs, active nav states, progress-bar fill, focus-signal root. No second accent color exists. |
| `primary-focus` | `#0071e3` | Keyboard focus ring only (`outline: 2px solid`) |
| `primary-on-dark` | `#2997ff` | Links/interactive text on dark surfaces only (e.g. the dark header). Never on light surfaces. |

### Surfaces

| Token | Value | Use |
|-------|-------|-----|
| `canvas` | `#ffffff` | Card fill, in-module content canvas, side nav panel |
| `canvas-parchment` | ~~`#f5f5f7`~~ `#ffffff` | Default page background (dashboard body), footer bar. **Corrected (2026-08-13, independent audit):** `--background` (the real driver of `bg-background`, used app-wide across every shell) was changed white per a same-session app-wide background-color pass; this row still showed the pre-change value. Note `--color-parchment` (`#f5f5f7` in `index.css`) is untouched and now appears to have zero live callers (`bg-parchment` doesn't match anywhere in `src/`) — likely dead, not re-verified further here. |
| `surface-pearl` | `#fafafc` | Secondary/ghost button fill |
| `surface-black` | `#000000` | Global header/nav bar only — the one place pure black appears |

> The dark tile surfaces (`#272729` etc.) from the source are marketing-section surfaces; they are **not used** in the dashboard. Surface rhythm in an app comes from parchment page ↔ white card, not alternating dark bands.

### Text

| Token | Value | Use |
|-------|-------|-----|
| `ink` | `#1d1d1f` | Headlines and body text on light surfaces |
| `ink-muted-80` | `#333333` | Secondary body text |
| `ink-muted-48` | `#6e6e73` | Muted metadata, captions, disabled labels. *(Adjusted from source `#7a7a7a` to `#6e6e73` — Apple's own footnote gray — so 14px muted text passes WCAG AA 4.5:1 on white and parchment.)* |
| `on-dark` | `#ffffff` | Text on the black header |
| `body-muted-on-dark` | `#cccccc` | Secondary text on the black header |
| `on-primary` | `#ffffff` | Text on Action Blue fills |

### Hairlines & borders

| Token | Value | Use |
|-------|-------|-----|
| `hairline` | `#e0e0e0` | 1px card borders, side nav divider, input borders |
| `divider-soft` | `#f0f0f0` | Softest separators (row dividers inside cards) |

### Semantic (dashboard extension)

The source system has no status colors; a training dashboard needs progress states. Rule: **stay quiet** — status is conveyed by neutral tones + one success green, never by adding rival accents. **Four deliberate, narrowly-scoped exceptions exist:** `state-warning` (amber, Round 9, §30) for `InviteStatusChip`'s "Pending" state and its paired banner; `badge-purple` (Round 9.1, §31) for the Coach Training Portal's "Baseline Reflection" milestone badge, distinguishing it from every numbered "MODULE N" badge and from the Certificate's own black badge; `diary-green`/`diary-yellow` (Round 12, §34) for the Sleep Diary Notes grid's PLWD/Carer row identity — the one exception in this list not chosen unprompted, but explicitly requested and confirmed directly after the alternative (two neutral gray tints) was offered and declined; `session-next-indigo` (Round 14.1, §36) for the Session Plan table's "next session" row — offered as a new scoped accent alongside a "reuse existing colors" alternative and a "decorative only" alternative, and confirmed directly; `notification-hub-green` (Round 18, §47) for the Coach Delivery Portal Home's `NotificationHub` card — a green tint confirmed directly after two other passes (a blue/bordered list, then a green tile grid) were tried and rejected on layout grounds, not color. None of the five opens the palette generally — every other chip/status/badge/row treatment in the app still follows the quiet rule above.

| Token | Value | Use |
|-------|-------|-----|
| `state-success` | `#1f7d37` | "Finished" module state (checkmark, label), Pass/Approved chips. *(Corrected from `#248a3d` in the Round 2 accessibility review — the original measured only 4.40:1 on white and 4.22:1 on pearl, failing AA for the 12–14px text it labels. `#1f7d37` measures 5.19:1 white / 4.98:1 pearl / 4.77:1 parchment.)* |
| `state-neutral` | `#6e6e73` | "Not started" state label |
| `state-progress` | `#0066cc` | "In progress" — reuses `primary`, expressed through the **progress-bar fill only**. State *text labels* stay in neutral ink (`ink-muted-80`, semibold) so blue text remains an exclusively interactive signal |
| `state-warning` | Tailwind `amber-50`/`amber-200`/`amber-800` (chip); `amber-100`/`amber-200`/`amber-900` (banner) | **Round 9, one-off exception — see §30.** Pending-invite chip + banner only. Not a general-purpose warning token; do not reach for it elsewhere without a new, equally-scoped justification. |
| `badge-purple` | `#6d28d9` | **Round 9.1, one-off exception — see §31.** Coach Training Portal home-timeline "Baseline Reflection" badge only (`Sparkles` icon, white text — 7.1:1, AAA). Not a general-purpose second accent; do not reach for it elsewhere without a new, equally-scoped justification. |
| `diary-green` | Tailwind `green-50`/`green-100`/`green-200` | **Round 12, one-off exception — see §34.** Sleep Diary Notes grid's PLWD row only — `green-50` row wash, `green-100` + `ring-green-200` "note card." Not a general-purpose token; do not reach for it elsewhere. |
| `diary-yellow` | Tailwind `yellow-50`/`yellow-100`/`yellow-200` | **Round 12, one-off exception — see §34.** Sleep Diary Notes grid's Carer row only — `yellow-50` row wash, `yellow-100` + `ring-yellow-200` "note card." Not a general-purpose token; do not reach for it elsewhere. |
| `session-next-indigo` | Tailwind `indigo-50`/`indigo-200`/`indigo-400`/`indigo-600`/`indigo-700` | **Round 14.1, one-off exception — see §36.** `session-plan-table`'s (§13/§36) "next session" row only — the earliest not-yet-completed planned session, via `nextPlannedSession()`. `bg-indigo-50` row wash on the whole `<tr>`, `bg-indigo-600` filled marker (reusing the wizard-rail's own "current step" number-in-circle grammar), and a `Chip tone="next"` (`border-indigo-200 bg-indigo-50 text-indigo-700`). Also used for `PlanSessionsModal`'s own current-step rail marker. Not a general-purpose token; do not reach for it elsewhere. |
| `primary-hover` | `#0055ab` | Hover fill for primary pill CTAs (added Round 1 design critique, C1) |

---

## 2. Typography tokens

**Font stack:**
Display sizes (≥21px): `"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
Body/UI (<21px): `"SF Pro Text", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
On Apple platforms this resolves to real SF Pro; elsewhere it falls back to the platform system face.

Weight ladder is **300 / 400 / 600** — weight 500 and 700 are deliberately absent. Negative letter-spacing at display sizes; never below 12px.

| Token | Size / weight / line-height / tracking | Dashboard use |
|-------|----------------------------------------|---------------|
| `display-lg` | 40px / 600 / 1.10 / 0 | Page title on dashboard ("Welcome, [name]") — desktop |
| `display-md` | 34px / 600 / 1.20 / -0.374px | Page title — tablet; profile page title. *(Line-height tightened from source 1.47 → 1.20: 1.47 was a marketing-page artifact; app page titles need display leading.)* |
| `title` | 21px / 600 / 1.19 / +0.231px | Section headings ("Your modules"), in-module slide titles |
| `body-strong` | 17px / 600 / 1.24 / -0.374px | Module card titles, emphasized inline text |
| `body` | 17px / 400 / 1.47 / -0.374px | Default body copy, slide content |
| `caption` | 14px / 400 / 1.43 / -0.224px | Metadata, progress labels, side nav items |
| `caption-strong` | 14px / 600 / 1.29 / -0.224px | Side nav section labels, badge text |
| `button` | 15px / 400 / 1.0 / -0.24px | Primary/secondary pill CTA labels. *(Reduced from 17px/-0.374px in v4 — the user found 17px too large for the button scale.)* |
| `button-utility` | 14px / 400 / 1.29 / -0.224px | Utility/compact button labels (header actions, back/next) — unchanged in v4; only the control height dropped to 36px |
| `fine-print` | 12px / 400 / 1.3 / -0.12px | Placeholder tags, legal, footer notes |
| `nav-link` | 12px / 400 / 1.0 / -0.12px | Global header nav links |

---

## 3. Spacing tokens

Base unit 8px; structural layout snaps to 8/12/16/24/32/48.

| Token | Value | Dashboard use |
|-------|-------|---------------|
| `space-xxs` | 4px | Icon–label gaps |
| `space-xs` | 8px | Within-component stacking |
| `space-sm` | 12px | Compact padding (chips, list rows) |
| `space-md` | 16px | Default gap between related elements. *(Snapped from source 17px — 17px was a typographic artifact, not a layout unit.)* |
| `space-lg` | 24px | Card internal padding, grid gutters |
| `space-xl` | 32px | Between sections within a page region |
| `space-xxl` | 48px | Major section separation |
| `space-section` | 64px | Top-of-page breathing room below header. *(Reduced from source 80px — 80px is marketing-tile padding; a working dashboard warrants slightly tighter air.)* |

**Container:** dashboard content max-width 1200px, centered, 32px side padding (24px at tablet). Module grid: 3 columns desktop → 2 columns tablet (≤1023px).

---

## 4. Radius tokens

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 8px | Compact utility buttons, inner images, input fields |
| `radius-md` | 11px | Secondary capsule buttons |
| `radius-lg` | 18px | **Cards** — module cards, utility/placeholder cards, side nav panel |
| `radius-pill` | 9999px | **Primary action grammar** — pill CTAs, progress bar track/fill, avatar, search |

Rule: don't mix grammars. Cards are `lg`, actions are `pill`, compact utility is `sm`. Nothing in between except `md` for the pearl capsule.

---

## 5. Elevation tokens

**Philosophy (v4): cards lift off the page with a soft hairline shadow; everything else stays flat.** Buttons, headers, nav, footer, and inset panels get **no shadows** — their hierarchy still comes from surface-color change (parchment page ↔ white card) and 1px hairline borders. The v1–v3 "no shadow on any chrome" rule is superseded for **cards only**, per the user's v4 decision; the restraint elsewhere is unchanged.

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | none | Page regions, header, footer, program/section bars, inset panels (pearl boxes inside cards) |
| Card | `1px hairline (#e0e0e0)` ring **+** `shadow-card` (`0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)`) | **All cards** — module cards, placeholder cards, roster/EOI/profile/oversight cards, portal-switcher tiles, the generated certificate. The "soft hairline shadow" the user asked for: hairline border kept, soft shadow added |
| Hairline-only | `1px solid hairline (#e0e0e0)` | Inputs, side nav, the confirm-dialog panel (a modal over a scrim — no card shadow needed) |
| Imagery shadow | `rgba(0,0,0,0.22) 3px 5px 30px` | Reserved for photographic/illustrative imagery resting on a surface. **Never on buttons or text.** |

---

## 6. Motion tokens

Source system's only micro-interaction is press-scale. Extended minimally for a routed app:

| Token | Value | Use |
|-------|-------|-----|
| `press` | `transform: scale(0.97)`, 150ms ease-out | Active/press state on every button and clickable card |
| `page-transition` | opacity 0→1 + y 8px→0, 300ms ease-out | Dashboard ↔ in-module ↔ profile route changes |
| `slide-transition` | opacity + x ±16px, 250ms ease-out | Slide-to-slide within a module |
| `progress-fill` | width, 400ms ease-out | Progress bar value changes |

Respect `prefers-reduced-motion: reduce` — disable transforms, keep opacity fades ≤100ms.

---

## 7. Component specs (Round 1)

Dashboard re-expressions of the source tokens — **not** Apple's marketing components.

### `header` (global nav)
- Background `surface-black`, height 48px, full-bleed, flat (no shadow, no border)
- Left: Care2Sleep wordmark + "Coach Training Portal" label in `nav-link` on `on-dark`
- Right cluster: notification bell (inert placeholder), account menu, each ≥44×44px hit area. ~~Account/logout menu (inert placeholder), coach avatar (clickable → profile)~~ — superseded in Round 4.1 (§17): the avatar is gone everywhere, and the account item is now a real `Menu` dropdown (Edit profile / Sign out), shared verbatim by both portals
- Interactive text on this surface uses `primary-on-dark` if colored; icons in `on-dark`
- **Layout variants:** default is centered at the shared `max-w-[1200px]` content column (Dashboard, Profile — matches those pages' own centered content). A `fullBleed` variant drops the max-width and uses `px-4 md:px-8` directly against the viewport edge, for pages whose content itself is edge-to-edge (the in-module page — see `module-footer` below). The two variants must always pair with a page layout that uses the same horizontal padding scheme, so header and footer/content insets line up exactly at every viewport width.

### `module-card`
- Surface `canvas`, border `1px hairline`, radius `radius-lg` (18px), padding `space-lg` (24px), **no shadow**
- Cover image: top, `radius-sm` (8px) inner radius
- Title in `body-strong`; state metadata in `caption`
- Progress: see `progress-bar`; state label colors per semantic tokens
- CTA: `button-primary` (pill) with state-dependent label (Start / Resume / Re-start)
- Entire card clickable; press state `press`; keyboard focusable with `primary-focus` ring
- **Round 4.1 (§17) reworked most of this spec** — see §17 for the current cover/metadata/progress/CTA shape; this entry is kept for the shared chassis (surface, border, radius, no-shadow, whole-card click target), which is unchanged

### `button-primary` *(v4 sizing)*
- Fill `primary`, text `on-primary` in `button` typography (15px), radius `radius-pill`, padding ~9px × 18px, **height 36px** *(reduced from 44px/17px/22px in v4)*
- Press: `press` scale; focus: 2px `primary-focus` outline (offset 2px); no hover-documented state beyond subtle darken

### `button-secondary`
- Transparent fill, text `primary`, 1px `primary` border, radius `radius-pill`, same 36px height/padding — the "ghost pill" for paired/secondary actions

### `button-utility` *(v4 sizing)*
- Fill `surface-pearl` (or `ink` on dark surfaces), text `ink-muted-80` / `on-dark`, `button-utility` typography (14px, unchanged), radius `radius-sm`, **height 36px** *(reduced from 44px in v4)*

### Control height (v4)
- **36px is the standard height for all interactive controls** — primary/secondary/utility buttons, select menus, search and text inputs — so button-and-select rows (roster filters, profile edit form) align. Icon-only buttons follow suit (`size-9`); the inert header avatar/bell and the standalone drawer-close stay at 44px.
- This relaxes the previous self-imposed 44px touch-target floor. It remains **WCAG 2.1 AA compliant** (2.1 AA has no target-size criterion — 2.5.5 is AAA) and **WCAG 2.2 AA compliant** (2.5.8 requires ≥24px). Flagged as a deliberate density trade-off in the Round 2 review addenda.

### `progress-bar`
- Track: `divider-soft`, 6px height, radius `radius-pill`
- Fill: `primary`, radius `radius-pill`, `progress-fill` motion
- Always paired with a text label (`caption`) — never color-only
- ARIA: `role="progressbar"` with `aria-valuenow/min/max` and accessible name

### `side-nav` (in-module)
- Surface `canvas`, right border `1px hairline`, width 280px (desktop, fixed — does not shrink or center), collapsible into an overlay drawer at tablet/mobile (< `lg`)
- Sits flush against the left viewport edge — the in-module page layout is edge-to-edge (no centered max-width, no side gutters either side of nav/canvas); only the canvas's own reading column is inset (see `content-canvas`)
- Current module name in `caption-strong`; slide list items in `caption`, 44px min row height
- Active slide: `primary` text + left 2px `primary` indicator; completed slides: `state-success` check icon
- "Next module" preview row at bottom in `ink-muted-48`

### `content-canvas` (in-module)
- Surface `canvas`, fills all remaining width beside the side nav (adaptive — not capped), with an inner max-width 760px centered reading column for slide text (readability guardrail, not a page-width constraint)
- Slide title in `title`; body in `body`

### `module-footer` (in-module controls) — v2, revised from Figma reference (frame `4934:85994`, "Global Nav")
- **Dark bar** (`surface-black`, matching `header`), full-bleed, fixed to viewport bottom, `fullBleed` padding (`px-4 md:px-8`) so its edges line up exactly with the `fullBleed` header above
- **Left:** Home pill (translucent white/15 fill, white/70 border, white text/icon) → dashboard. On screens below `lg`, a second circular icon button ("Open slide list") sits beside it — this is the tablet/mobile trigger for the side-nav drawer, since the persistent side nav is hidden below `lg`
- **Center:** current slide title (white, `caption`/semibold) with the module progress bar directly below (white/90 track, `primary` fill — **not** the source Figma's orange, per the single-accent rule), capped at `max-w-[70%]` of its column so the bar doesn't run the full row width; a "`N`% complete" label sits to the right of the bar
- **Right:** circular Back icon button + white "Next"/"Finish module" pill (dark text on white — the one place `ink` text appears on a light fill inside a dark bar), pinned to the true right edge via `ml-auto` independent of the center column's width
- All controls 44×44px minimum (the Figma reference used 40px; bumped to meet this doc's touch-target floor) and use `button` typography (17px/400), not `button-utility` — these are pill-shaped action controls, not compact utility rects, so they follow the primary-action type scale
- Supersedes the earlier frosted parchment sticky bar (light theme) from v1 — the in-module page is now a black-header/black-footer sandwich around the white canvas, and no separate title/Support sub-bar exists between the header and the side-nav/canvas row

### Card shadow (v4)
- All cards (the `Card` component) carry `shadow-card` in addition to their 1px hairline ring — see §5. This is applied once on the shared component, so every card across both portals lifts consistently. Inset pearl panels *inside* a card do not get their own shadow.

### `placeholder-card` (inert Round 1 elements)
- Same chassis as `module-card` but non-interactive: no press state, not focusable, `aria-hidden` on decorative icons
- Carries a visible "Coming soon" tag in `fine-print` on `surface-pearl` chip — placeholders must not read as broken buttons

---

## 8. Do / Don't (dashboard adaptation rules)

| ✅ Do | ❌ Don't |
|------|---------|
| Use `primary` for every interactive signal | Introduce a second accent; status green is for state labels only, never CTAs |
| Hairline borders + surface change for hierarchy; **soft `shadow-card` on cards** (v4) | Shadows on buttons, nav, headers, or inset panels — cards are the only chrome that lifts |
| `radius-pill` = action grammar; `radius-lg` = card grammar | Mix radii grammars |
| Body at 17px/400/1.47 | Weight 500 anywhere; body below 1.47 leading |
| Make placeholders visibly inert ("Coming soon" chip) | Style inert elements as clickable (blue, pill, underline) |
| 36px standard control height (v4), ≥24px everywhere (WCAG 2.2 AA) | Tiny precision-only targets; controls below 24px |

---

## 9. Component specs (Round 2 — Research Dashboard)

New patterns this round only; everything else reuses §7 as-is. Layout architecture (top-nav app, record pages with right-aligned tabs, left module rail) follows the user-supplied Figma reference at the *structure* level only — every visual value below is from this file's tokens. **Round 4.1 (Dhruv, UI edit):** record-page tabs are no longer right-aligned beside the identity block — see the `section-tabs` amendment in §9 below.

### `data-table`
- Lives inside the card chassis (`canvas`, `1px hairline`, `radius-lg`, no shadow); the card gets `overflow-x-auto` so wide tables scroll inside themselves at tablet widths — the page never scrolls horizontally
- Header row: `caption-strong` in `ink-muted-80`, bottom border `hairline`; body rows separated by `divider-soft`, min 44px row height
- Clickable rows: pointer cursor + `surface-pearl` hover; the row's *name link* is the single keyboard tab stop (aria-label "View {name}'s profile"); a right chevron in `ink-muted-48` signals drill-in
- State is never conveyed by dimming a row (fails contrast) — always by a `status-chip`

### `status-chip`
- Chassis: `surface-pearl` fill, `1px hairline`, `radius-pill`, 24px height, `fine-print` (12px) text — a *label*, not a control, so it may sit under 44px
- Three tones only: **success** (`state-success`, semibold — Completed / Pass / Approved), **neutral** (`ink-muted-80`, semibold — Active / Enrolled / Pending review / Remediation required), **muted** (`ink-muted-48` — Withdrawn / Declined / Not yet assessed / Not started)
- Never a rival accent, never colour-only — tone + text always travel together

### `section-tabs`
- Program/section/record-tab grammar: text item with a 2px `primary` underline indicator on the active item; active text `primary` semibold (`caption` scale for section/record tabs, `body-strong` for program tabs), inactive `ink-muted-80`; min-height 44px
- Record pages (coach profile) use the ARIA tabs pattern (roving tabindex + arrow keys); shell-level section nav uses plain links — same look, different semantics
- **Round 4.1 (Dhruv, UI edit):** on record pages (Coach Profile, SPACES Coach Profile, Consumer Detail), the tab row no longer sits right-aligned beside the name/subtitle block in one flex row — a long dyad or coach name crowded the tabs against the edge. The tab row now sits on its own line below the identity block (`mt-6`), full-width; tab styling itself (underline indicator, ARIA roving-tabindex) is unchanged.

### `confirm-dialog`
- Backdrop `rgba(0,0,0,0.25)`; panel `canvas`, `radius-lg`, `1px hairline`, no shadow, max-width 440px
- Title `title` scale naming the person ("Approve Karen Bailey?"); body `caption` in `ink-muted-80` stating the consequence; buttons repeat the verb — never OK/Cancel
- Cancel = `button-secondary` (ghost pill); confirm = `button-primary`, or `button-destructive` for destructive confirms
- Focus moves to the panel on open, returns to the trigger on close; Tab cycles inside; Escape closes

### `button-destructive` *(new colour use)*
- `destructive` `#d70015` fill, `on-primary` text, pill radius, same metrics as `button-primary` — white on `#d70015` ≈ 5.4:1, AA-safe
- Reserved for the *confirm* button inside a destructive confirm-dialog (withdraw, decline). Never appears on a page surface — page-level destructive triggers stay quiet (`button-utility` with `destructive` text) so red keeps its warning value
- **Round 3.1:** the SPACES "Withdraw participant" trigger (§15) briefly broke this rule with a solid `button-destructive` fill on the page surface. Flagged in the design-critique addendum; the user confirmed reverting to the quiet-trigger rule rather than keeping the exception — the trigger now uses `button-utility` (`bg-pearl` + `text-destructive`, quiet), matching "Withdraw coach" exactly. No exception stands.

---

## 10. Component specs (Round 2.1 — Research Dashboard hub navigator)

The Research Dashboard is a **hub**: its primary navigation is a collapsible left sidebar, not a top program bar. Introduced in Round 2.1 at the user's request. Reuses the §7 `side-nav` visual grammar; only the structure below is new.

### `sidebar-nav`
- **Chassis:** `canvas` panel, right border `1px hairline`, flat (no shadow — it's chrome, not a card). Sticky below the header (`top-12`), full remaining viewport height, its own `overflow-y-auto`.
- **Two widths:** expanded **240px** (`w-60`) shows icons + labels + the active area's sub-links; collapsed **64px** (`w-16`) is an icon-only rail. `transition-[width] 200ms ease-out`. Collapse state persists in `localStorage` (`c2s-research-nav-collapsed`) so it survives route changes and reloads.
- **Collapse toggle:** a 36px icon button at the top of the panel — `aria-expanded`, `aria-controls`, and an action-describing `aria-label` that flips. Panel-left icons (`PanelLeftClose`/`PanelLeftOpen`).
- **Areas (top level):** the three participant populations — **Consumers**, **Trainees**, **Coaches** — each an icon + `caption`/semibold label. Exactly one is active per build (Round 2.1: Trainees); the rest are **inert placeholders** reusing the §7 `placeholder-card` pattern (muted `ink-faint` label + a "Soon" pill chip when expanded). Inert areas are `aria-disabled` `<span>`s — never links — with an `sr-only` "(coming soon)".
- **Active area + sub-links:** the active area is a non-link group header when expanded; its sub-views (Coaches, Expressions of interest, Training oversight) are indented `NavLink`s at 44px min row height. Active sub-link = `primary` text + semibold + a 2px `primary` left indicator bar (never colour-only). When collapsed, the area collapses to a single icon that links to its default view; sub-links hide.
- **Count badge:** a sub-link may carry a `primary`-fill pill badge (white `primary-foreground` text, 11px semibold) for a pending count — used on Expressions of interest to preserve the pending-EOI signal after the roster's EOI card was removed. Always mirrored in an `aria-label` ("N pending").
- **Retires:** the Round 2 top program bar (Program 1/Program 2 tabs) and the horizontal section-tab strip. Global coach search moved out of the header to sit above the roster table on the Coaches view.

### Naming
- "Program 1 / Program 2" is **not used** anywhere in the Research Dashboard as of Round 2.1 — the areas are **Consumers / Trainees / Coaches**. ⚠️ Note: "Trainees" conflicts with the `CLAUDE.md` terminology rule ("Coach — never 'trainee'"); adopted here on the user's explicit instruction and flagged for a terminology reconciliation.

---

## 11. Component specs (Round 2.2 — Research Dashboard, Trainees area)

New patterns introduced by the user's Round 2.2 refinements to the coach record. Reuse existing grammar (`card`, `data-table`, `status-chip`, `separator`); only the structures below are new.

### `module-accordion` (Training Review rail)
- The coach-profile module rail is an **accordion**, not a flat list. Each module is a `min-h-11` header button: a `ChevronDown` (rotates 180° when open), the module title, and a right-aligned **completion-rate %** (`fine`, tabular-nums; `success` at 100%, else `ink-faint`).
- Expanding reveals the module's **slides** as an indented ordered list. Each slide row: a 16px status dot (filled `success/15` + `Check` when done, else hollow `hairline` ring) + slide title (`ink-muted` done / `ink-faint` pending).
- A `separator` (`divider-soft`) sits between each module. Clicking a header both **selects** the module (drives the right-hand answer pane) and **toggles** its slide list — `aria-current` for selection, `aria-expanded` for the disclosure.
- Below `<lg` the rail collapses to the existing labelled `<select>` (value shows "Module title — NN%").
- **Completion rate** is module-level, derived from `slidesCompleted / slides.length` (completed = 100%, not-started = 0%). Replaces the old per-module completed-date label.

### `annotation-block` (in the rail)
- Annotation summaries live **inside** the Training Review rail card (below the modules, top-bordered), not in a separate card. Fixed three-timepoint layout — **Baseline / Midline / Endline** — each a `caption`/semibold label + the summary text, or "Not yet reached." when absent, or the not-shared notice when the coach withheld it. **No "approved …" date label** (removed Round 2.2).

### `recording-card` (Session recordings)
- Full-width card below the module grid. Grid of recording tiles (`sm:grid-cols-2`), each: a 36px `Video` glyph tile (`ring-hairline`), a **Phase N** chip + `source · NN min` meta, the session title (`caption`/semibold), and `date · participants` (`fine`). Records only — no fake play button (nothing inert announced as interactive). Empty state when the coach has no recordings yet.

### `phase-timeline` (Trainee Tracking)
- Vertical timeline of the 8 COACH phases. Each row: a **28px toggle marker** on a left rail + a phase label. Marker is a real `button` with `aria-pressed` and an action-describing `aria-label` ("Mark complete: Phase 4 — …"); done = `success` fill + `Check`, pending = `hairline` ring + phase number. A 1px connector runs between markers (`success/40` when the phase above is done, else `divider-soft`).
- Toggling is session state (`togglePhase` in `research-store`). Seeded from `currentPhase` (+ Placement 2 for any assessed coach, + current phase for completed coaches).

### `certification-gate` (Trainee Tracking, right)
- The Certification-outcome card is **locked** until phases **1–7** (through Placement 2) are all ticked — Phase 8 is post-certification and not a gate. Locked state: `pearl` card, `Lock` glyph, explanation, and an "N of 7 phases complete" counter. Unlocked + `pass`: outcome chip + assessed date + pass copy + **Download / Share link / Send email** actions (primary / secondary / utility), each giving inline `role="status"` feedback. Remediation/not-yet-assessed show the outcome without download actions. Replaces the Round 2 "Generate certificate" action + generated-certificate document card (both removed).

### Retires (Round 2.2)
- Removed the **Training oversight** sidebar sub-link + page — cohort phase tracking is now the per-coach `phase-timeline`. Sidebar `traineeLinks` is now Coaches + Expressions of interest only.
- Global **header is now `sticky top-0 z-30`** on every portal, so it no longer scrolls away leaving a gap above the `sticky top-12` sidebar.
- Coach profile tab labels: `Training progress` → **Training Review**, `Certification` → **Trainee Tracking**.
- EOI detail: multi-card bento → single **read-only EOI form**; motivation + availability fields dropped from the view.

### Naming ⚠️
- Round 2.2 doubles down on "Trainee" ("Trainee Tracking" tab). The **"Trainees" vs CLAUDE.md "never trainee"** conflict (flagged §10, Round 2.1) is **still unresolved** and now more load-bearing — needs a terminology decision.

---

## 12. Component specs (Round 2.2, sub-rounds 2.2.1–2.2.9 — iterative refinements)

Patterns introduced across the batch of targeted edits following the base Round 2.2 build. Extends §10 (`sidebar-nav`) and §11 (Training Review / Trainee Tracking) rather than forking them.

### `sidebar-nav` — hierarchy + naming update (supersedes §10 naming)
- Areas renamed **Consumer Management / Training Pipeline / Coaches** (was Consumers / Trainees / Coaches) — Title Case throughout, resolving the Round 2.1 "Coaches" (roster sub-view) vs "Coaches" (certified area) label collision. Training Pipeline's two pages are, in pathway order, **Recruitment (EOI)** then **Trainee progress**.
- The active group header (Training Pipeline) carries a static, `aria-hidden` `ChevronDown` — a decorative "this expands into pages below" affordance, not a per-section collapse control (the sidebar's one global collapse toggle is unchanged).
- Its two child pages sit inside a `border-l border-hairline` **tree connector** (`ml-[18px] … pl-3`), so nesting reads as a tree rather than a flat list; the active-row indicator is a small bar at `-left-[13px]`, landing on the connector line itself.
- Leaf placeholder areas (Consumer Management, Coaches) are demoted to `font-medium` (was `font-semibold`) and carry no chevron — visually recede relative to the one active, expandable group.

### `select-chevron` (native `<select>` replacement)
- Native browser-drawn select arrows ignore `padding-right` and sit flush against the border. Fix: `appearance-none` on the `<select>` + a manually-positioned `ChevronDown` (`absolute right-3 … pointer-events-none`) in a `relative` wrapper — gives a real, controllable gap (12px) between the arrow and the border. Applied to the roster's Status/Phase/Cohort filters; the reassign-cohort dialog select and the Training Review mobile module-select still use the native arrow (same latent issue, not yet touched).

### `engagement-tracker` (Training Review rail, supersedes §11 `module-accordion`)
- The accordion (module → expand → slide sub-items) was replaced by a **single flat list**: modules first, then the 3 reflective-summary rows (Baseline/Midline/Endline Review), **no section-header text, no dropdown** between the two groups — literally one continuous set of selectable rows, each showing a trailing state (`NN%` for modules; Shared/Not shared/Not yet for reviews).
- The card's own title — "Engagement tracker" (was "Modules") — gets `border-b border-divider-soft` + extra bottom padding so it reads as a heading, not another row.
- Selecting any row (module or reflective summary) drives the same right-hand canvas.

### `slide-canvas` (Training Review content pane, supersedes §11's canvas notes)
- The canvas is the **direct container** — no outer white `Card` wrapping it. Its fill is `bg-hairline` (`#e0e0e0`, the darkest neutral in the palette — checked the full token set before using it; nothing new was invented) against the white (`bg-card`) slide cards it holds, with **no shadow** (`shadow-none` explicit) — a recessed surface, not another elevated card.
- No title or status chip repeats above the canvas — the tracker row's own active/highlighted state already names the selection.
- Padding is deliberately bottom-heavy (`p-4 pb-6 md:p-6 md:pb-8`, not symmetric) so the last slide card never reads as flush against the container edge.
- **Height-matching fix:** the tracker `Card` and the canvas both carry `max-h-[70vh] overflow-y-auto`. Without this on *both* columns, CSS Grid's auto-row-sizing resolves the shared row to whichever column is naturally taller — if only the canvas is capped, an uncapped, taller tracker list stretches the row past the canvas's cap, leaving blank dead space in the grid cell. Matching the cap on both sides means neither can force the row past what the other can render; verified by measuring both columns' `getBoundingClientRect().bottom` at a reduced viewport (0px gap).

### `phase-pipeline` — dot markers + explicit actions (supersedes §11 `phase-timeline`)
- Timeline markers are **dots/tick state only, never numbers** — a small `divider-soft` dot (not done) or a `success`-filled circle with `Check` (done); the phase number lives only in the adjacent "Phase N" text label.
- Each **not-done** phase has an explicit **"Mark complete"** utility button (`h-9`, `text-[14px]`/`-0.224px` — the documented utility-button scale). Each **done** phase (not locked) has a **kebab menu** (`MoreVertical` trigger, also `size-9`) built on `@base-ui/react/menu` (already a project dependency) with a single "Mark as incomplete" item — inherits correct WAI-ARIA menu-button semantics (`aria-haspopup="menu"`, `aria-expanded`, `role="menu"`/`"menuitem"`) for free.
- **Every** state change — complete or revert — opens `ConfirmDialog`; revert uses the `destructive` (red) variant, complete does not, consistent with the "red is scarce" rule.
- **Locked-on-Pass:** once the coach's certification outcome is `pass`, the 7 gating phases replace the kebab with a `Lock` icon (a non-interactive `<span>`, no role/tabindex) — no revert possible. Communicated three ways: a visible note under the card heading, the icon itself, and a `title` + `sr-only` explanation. Phase 8 (post-certification) is never gated and keeps its normal kebab. This was a user-directed policy choice (confirmed via a direct question, not assumed) protecting a certified record from being silently altered.
- Row-control sizing was initially built at `h-8`/`size-8` (32px) — caught in the Round 2.2 accessibility addendum as inconsistent with the system's own 36px convention (§ v4) and corrected to `h-9`/`size-9` before sign-off.

### `certification-recording` (Trainee Tracking, supersedes §11 `certification-gate` actions)
- New capability: **"Record Pass"** / **"Record remediation required"** buttons, each behind their own `ConfirmDialog`, available whenever `outcome !== 'pass'` — covers both the first assessment (`not-yet-assessed`) and any later re-assessment after remediation. Previously there was no way, anywhere in the UI, to move a coach off `not-yet-assessed` — this closes that dead end and closes the remediation loop (remediation-required → reassess → Record Pass → Download/Share/Email actions appear).

### Data-integrity note
- Personal details' Contact details card now mirrors every field the EOI form originally collected (Email, Phone, Aged care employer, Role at employer, Years in aged care) — this surfaced and fixed a real gap: `yearsInAgedCare` existed on the `Eoi` type but was never carried onto `Coach`, so it was silently dropped at onboarding. Now part of the `Coach` type and threaded through `coachFromEoi()`.

---

## 13. Component specs (Round 3 — Research Dashboard, Coaches / SPACES delivery oversight)

Activates the sidebar's third area. Reuses `data-table`, `status-chip`, `confirm-dialog`, `phase-pipeline`, and `engagement-tracker` grammar as-is; only the structures below are new.

### `sidebar-nav` — Coaches area activation (extends §10/§12)
- **Coaches** changes from `AreaPlaceholder` to a single active **leaf link** — unlike Training Pipeline (a group with 2 child pages), Coaches has one destination (the Coach Management Table); the coach profile is a row-click drill-in, not a nav destination, so it never grows a sub-list.
- New `AreaLink` component: same icon + `caption`/semibold row as `AreaHeader`, but rendered as a real `NavLink` (active = `primary` text/semibold + left indicator bar, matching a `pipelineLinks` row) at every collapse state — no chevron, since there's nothing to expand. Route: `/research/spaces-coaches`.

### ~~`workload-chip` (extends `status-chip`)~~ — retired in Round 3.1, see §15
~~Same chassis as `status-chip`, reusing its existing 3-tone system exactly (no 4th tone introduced): **Light** = muted, **Moderate** and **Full** both = neutral — the label text (not an extra visual weight) is what distinguishes Moderate from Full, consistent with the project's "state + text always travel together, never colour-only" rule. Qualitative only, per the Round 3 judgment call (no numeric caseload cap until `portal-feature-map.md`'s max-caseload question resolves).~~

### `coach-invite-dialog` (extends `confirm-dialog`)
- Same `confirm-dialog` chassis (title names the action, body states the consequence, `children` slot holds the form) — not a new modal pattern. **Round 3.1:** the coach field is now a typed email match against the certified-but-not-yet-invited pool rather than a `<select>` (§15), and the workload field was removed entirely. Confirm label "Send invite" (primary pill); creates an `invited` / `not-joined` row in the Coach Management Table.

### `dyad-card` (Consumers Registry)
- Two `Card`s side by side at desktop (`grid-cols-2`), stacked at tablet (`<lg`) — **patient card** and **carer card**, each its own definition list (name, age/relationship, background) in the existing `dl`/`Separator` grammar from `Participation record`. Never merged into one card — the dyad's two people keep visually distinct chassis even though they're one consumer record.
- Consumer overview (sleep goals, caregiving context) is a third read-only `Card` below the dyad pair, no edit affordance anywhere in it (data originates with the research coordinator at consumer onboarding).

### `session-tracker` (Consumers Registry, supersedes nothing — direct reuse of §12 `phase-pipeline`)
- Identical component, restyled copy only: 7 rows (Session 1 — Onboarding, Sessions 2–7 — post-Module 1–6), same dot/tick markers, "Mark complete" utility button, kebab "Mark as incomplete", `ConfirmDialog` on every change. No lock-on-Pass equivalent — SPACES sessions have no certification gate.

### `annotation-vault` (Supervision Hub, direct reuse of §12 `engagement-tracker` + `slide-canvas`)
- Rail lists one row per consumer's Session 1 post-practice annotation (label = consumer/dyad name, trailing state Shared/Not shared/Not yet, exactly like the Baseline/Midline/Endline rows it's modelled on). Canvas renders the summary via the same `SlideCard` component. A coach with no live consumers yet shows the rail's existing empty-state treatment.

### `supervision-notes` (Supervision Hub, new — no existing note-taking pattern to reuse)
- **Note-creation form**: a `Card` containing Title (text input), Date (date input), Time (time input, defaulting to the current time client-side — arbitrary entry, not session-mapped), Notes (textarea), Attachments (file input, dummy filenames only per the Round 3 judgment call — no real upload/storage), Save (`button-primary`). All inputs use the existing `inputClass` (36px, hairline border).
- **Notes log**: a `data-table` below/alongside — Title, Date, Time, Attachments (count), a `Download` utility icon-button per row producing a placeholder `role="status"` confirmation (no real file, consistent with the certificate-download precedent in §12 `certification-gate`).

### `health-data-log` (Health Data Hub — new layout, flagged by the user as needing its own pass)
- **Not a chart.** A `data-table`-style daily log, one per dyad member (Patient / Carer), toggled by a small two-item segmented control (reuses `section-tabs` visual grammar, not a new tab pattern) above a single table region — avoids building two permanently-visible tables that would crowd a tablet viewport.
- Columns: Date, Fitbit sync (a `status-chip`-style dot + "Synced"/"Not synced" — success/muted tones only), REM %, Duration, Disturbances, Sleep-diary snippet (truncated text, `title` attr for full text).
- **Lightweight trend affordance**: REM % and Duration each carry a small inline delta vs. the prior logged day — a `ChevronUp`/`ChevronDown`/`Minus` glyph (12px, `ink-faint`) beside the value, not colour-coded (avoids implying good/bad — a trend is informational, not a status). No sparkline, no chart library introduced.
- Card chassis, `overflow-x-auto` like every other table — never a page-level horizontal scroll.

---

## 14. Component specs (Round 3 post-signoff — sidebar-nav accordion + a shared utility fix)

User feedback after Round 3 sign-off touched built UI (per `claude-code-action-plan.md` Phase 5's re-open rule) — logged here rather than silently folded into §13, since it changes previously-documented behaviour.

### `sidebar-nav` — Training Pipeline becomes a route-driven accordion (supersedes §12's "static, non-toggleable chevron" note)
- Training Pipeline's sub-list is no longer always-rendered. It's a **route-driven accordion**: expanded exactly while the current page belongs to it (either of its 2 pages, or a Program 1 coach profile drilled into from the roster), and it **collapses the instant a different area (e.g. Coaches) is selected** — no manual per-section toggle state, the URL is the single source of truth for expanded/collapsed.
- The header itself is now a real link (previously a static, non-interactive `<div>`): clicking it while collapsed opens the group at its **first pathway step, Recruitment (EOI)** — not "Trainee progress", which was the old default target for the collapsed-sidebar icon.
- The chevron rotates -90° when collapsed, 0° when expanded — it's no longer purely decorative text as §12 described; it now reflects real state, though the *click target* is still the whole header row, not the chevron specifically (no independent icon-only toggle button was introduced).
- **Animated** with Framer Motion: `height: 0 → 'auto'` + `opacity: 0 → 1`, 200ms ease-out, wrapped in `AnimatePresence`. Inherits the app's global `<MotionConfig reducedMotion="user">` — no separate reduced-motion handling needed.
- **A defect chain and how it was resolved:** the animating wrapper needs `overflow` clipping so content doesn't flash while height animates from 0. Using `overflow-hidden` (both axes) also clipped the active-row indicator bar, which by design sits at a *negative* left offset so it lands on the tree-connector line — invisible or reduced to a sliver. Fixed by scoping to **`overflow-y-hidden` only** (the animation only needs vertical clipping; the indicator's intentional horizontal bleed was never the thing needing containment). Even after that fix, the original 2px bar read as "barely there" landing exactly on the connector line's pixel — widened to **4px** (`before:w-1`, was `before:w-0.5`) at the same `-13px` offset, which reads clearly without moving away from the connector line it's meant to accent.

### `cn()` utility — custom font-size tokens registered against `tailwind-merge` (app-wide fix, not sidebar-specific)
- **Root cause of an app-wide latent bug:** the shared `cn()` helper (`lib/utils.ts`) wraps `clsx` + `twMerge`. `twMerge`'s default config has no awareness of this project's custom named font-size scale (`text-caption`, `text-fine`, `text-title`, `text-body`, `text-display-md`, `text-display-lg` — real Tailwind utilities generated from `--text-*` in `index.css`'s `@theme`, per §2). Any call site that merged one of these with a text-**colour** class (e.g. `cn('text-caption', isActive ? 'text-primary' : 'text-ink-muted')`) had the size class silently dropped — both start with `text-`, and `twMerge` bucketed them into the same "conflicting" group, keeping only the last one. This surfaced as the sidebar's inactive sub-links rendering at the browser default 16px instead of the intended 14px.
- **Fix:** `lib/utils.ts` now uses `extendTailwindMerge`, registering the six custom size tokens above under the `font-size` class group so they're never treated as colliding with colour utilities again. This is a general fix, not a per-component patch — any other place in the app combining these tokens with a colour class via `cn()` benefits from the same fix, though a full app-wide sweep for other instances of the pattern wasn't performed (flagged here in case one surfaces later).

---

## 15. Component specs (Round 3.1 — Coaches area, post-signoff feature additions)

Reopens the signed-off Round 3 per `claude-code-action-plan.md` Phase 5. New use cases: assigning a consumer post-onboarding, transferring a consumer when a coach leaves the study, and a carer-only consumer (no co-enrolled patient). Retires `workload-chip` entirely (struck through in §13, not deleted).

### `coach-profile-tab` (new — first tab in the SPACES coach profile, supersedes the profile header's 3 status chips)
- Two side-by-side `Card`s at desktop (`grid-cols-2`, stacked `<lg`): **SPACES participation** (Invitation/Joined chips, Invited/Joined dates, partner org, a "Manage record" sub-section) and **Contact details** (the same editable email/phone pattern as the Training Pipeline profile's Contact details card, reusing `updateContact`). Uneven card height between the two (participation typically taller) matches the existing Training Pipeline `Participation record`/`Contact details` precedent — not a new inconsistency.
- Below both: a full-width **Consumers** `Card` — `data-table` (Consumer, Sessions, Annotation, actions) with an "Add consumer" primary-pill trigger in the card header (hidden once the coach is withdrawn) and per-row **View** (jumps to Consumers Registry with that dyad selected) / **Transfer** text-actions, each `h-9` (36px) matching the system's control-height convention.
- The profile header's `InvitationStatusChip`/`JoinedStatusChip`/`WorkloadStatusChip` trio (§13) is removed — that status now lives once, in this tab's participation card, rather than duplicated in both places.

### `add-consumer-dialog` / `transfer-consumer-dialog` (extend `confirm-dialog`)
- Same chassis, no new modal pattern. Add-consumer's form is long enough that it exposed a **real `confirm-dialog` defect**: the panel had no height cap, so tall `children` content could overflow the viewport with the Cancel/confirm buttons pushed off-screen. Fixed at the chassis level (not per-dialog): the panel is now `flex flex-col max-h-[85vh]`, with only the `children` region `overflow-y-auto` — title, body, and the action row stay pinned, matching how every other dialog in the app already behaved when its content was short enough not to expose the bug.
- Add-consumer's **carer-only toggle** (a labelled checkbox, "Carer-only consumer (no patient)") hides the Patient fieldset and the carer's "Relationship to patient" field when checked — there's no patient to be related to. Transfer's target-coach list excludes the current coach and any coach who is `withdrawn` or not yet `joined`.

### `dyad-card` (extends §13) — carer-only variant
- When `ConsumerDyad.patient` is absent, the Patient `Card` doesn't render and the grid drops to a single full-width Carer card (`lg:grid-cols-2` conditional on `patient` existing) rather than leaving a half-width gap. A `Chip` (`tone="muted"`, "Carer only") sits next to the consumer's name wherever the dyad is named as a unit — the dyad-section heading and the Coach Profile tab's Consumers table.
- **Health Data Hub's Patient/Carer member toggle now conditionally renders**: a `role="tablist"` with a single tab was flagged in the Round 3.1 design-critique pass as a real semantic smell (a tablist implies a choice; one option is not a choice) — the toggle is now omitted entirely when there's nothing to switch between, and the log renders directly under the "carer" log with no dead control above it.

### `withdraw-participant` (Coach Profile's "Manage record")
- Reuses the existing `withdrawCoach` action and `Coach.status` field (Training Pipeline's own "Withdraw coach" concept) rather than inventing a parallel SPACES-only status — "no longer participating" *is* `status: 'withdrawn'`.
- **Gated, not just warned:** the trigger renders `disabled` (native attribute, not just visual) while the coach's caseload is non-empty, with helper text stating the precondition and the fix ("Can't withdraw {name} yet — transfer all {n} consumers on their caseload to another coach first."). This replaced an earlier version that just showed a sentence in place of the button — per user feedback, a visibly-disabled control with a reason reads more clearly than a control disappearing outright.
- **Colour:** `button-utility` throughout, matching "Withdraw coach" exactly — enabled is `bg-pearl` + `text-destructive` (quiet), disabled is `bg-pearl` + `text-ink-faint` (no red at all). An earlier version of this pass used a solid `button-destructive` fill when enabled; flagged in design critique as a §9-rule violation and reverted on the user's confirmation (2026-07-24) rather than kept as an exception.

---

## 16. Component specs (Round 4 — Research Dashboard, Consumer Management)

Activates the sidebar's last remaining inert area. Reuses `data-table`, `status-chip`, `confirm-dialog`, `dyad-card` (§13/§15), and `engagement-tracker`/`slide-canvas` (§12) as pattern references only — this scope is standalone from Round 3/3.1's Coaches area, per the round-4 plan's explicit scope boundary.

### `sidebar-nav` — Consumer Management activation (extends §10/§12/§13)
- **Consumer Management** changes from the last `AreaPlaceholder` to a single active **leaf link**, identical treatment to how Coaches activated in Round 3 — one destination (the Consumer Management Table), the consumer detail view is a row-click drill-in, not a nav destination. Route: `/research/consumers`. The now-unused `AreaPlaceholder` component was deleted rather than left dead in the file — every sidebar area is active as of this round.

### `consumer-management-table` (extends `data-table`, §9)
- Same chassis as the Coach Management Table. Columns: Consumer (name(s), "Carer only" chip where applicable), Current phase (em dash while unassigned, "Session N — Name" once a coach is assigned — reuses a new `spacesPhaseLabel()` helper shared with the Coach Matching tab so the two never drift), Coach (name, or "Pending assignment" in `ink-faint`). Unlike the Coach Management Table, this table lists **every** enrolled consumer regardless of assignment state — there's no equivalent to "hasn't been invited yet" to exclude.

### `enroll-consumer-dialog` (extends `confirm-dialog`; direct structural reuse of the Coaches area's `AddConsumerDialog`)
- Identical fields, carer-only toggle, and validation copy to the Coaches-area "Add consumer" dialog — the only difference is the absence of a coach field, since enrollment happens ahead of assignment in this flow. Creates a dyad with `coachId` absent.

### `consent-repository` (new — no existing pattern to reuse)
- A `Card` inside the Consumer Details tab: header row (title + description, "Upload" trigger), then a list of uploaded documents (`FileText` icon + filename + uploaded date + a `size-9` `Trash2` delete button), or an empty state. "Upload" is a real `<label>` wrapping an `sr-only` (not `display:none`) `<input type="file" multiple>` — genuinely keyboard-reachable, with the visible label carrying a `focus-within:ring-2` so the hidden input's focus is still visibly indicated. Dummy filenames only (no real file storage), matching the project's established attachment-handling precedent (Supervision Records, §13).

### `module-engagement-tab` (direct reuse of §12 `engagement-tracker` + `slide-canvas`)
- Same rail + canvas grammar, scoped to exactly the 6 `CONSUMER_MODULES` (a new, Consumer-Portal-specific module set — distinct from the 8 coach-training modules in `portal.ts`) — no baseline/midline/endline rows, no Session recordings card (both explicitly out of scope per the round-4 plan). The canvas shows an engagement summary (status, last-viewed date, slides-viewed/total) rather than scenario/knowledge-check answers, since no consumer-authored slide content exists (Consumer Portal isn't built yet) — this is a deliberately thinner canvas than the coach-side one, not a partial implementation of it.

### `fitbit-sync-monitor` (extends §13 `health-data-log`)
- Same daily-log-table chassis, extended with Deep %/Light % columns alongside the existing REM %/Duration/Disturbances/sync-status. **Data Health Alerts are folded directly into this card** (per-member inline note, `TriangleAlert` + `text-destructive` on the existing `bg-pearl` chassis) rather than a separate section — computed by a shared `dyadHealthAlerts()`/`hasRecentGap()` helper that flags either a 2+-day sync gap or a 2+-day sleep-diary gap, trailing-window (i.e. an *unresolved, as-of-today* gap, not any historical gap in the 5-day log).
- The same alert computation also drives a **page-level dismissible banner** (`role="status"`, `bg-pearl` chassis, `size-9` dismiss button) shown above the tab content on every tab, not just Health Data Hub — resets (un-dismisses) when navigating to a different consumer.

### `sleep-diary-feed` (new — no existing pattern to reuse)
- A `Card` below the Fitbit Sync Monitor: one column per dyad member (never merged, per the plan), each a bordered list of day rows. Each row is a real `<button aria-expanded>` (`min-h-11`) showing the date + a rotating `ChevronDown`; expanding reveals the diary text or a "No diary entry logged for this day" fallback. A "Download CSV" `button-utility` per member exports that member's full log as a client-side `Blob` (`URL.createObjectURL`) — genuinely `disabled` (native attribute) when the log is empty, not just visually muted.

### `coach-matching-gate` (new — pending/assigned states; a read-only `session-tracker` variant)
- **Unassigned:** a single centered empty-state message inside the standard card chassis — no interactive controls at all (assignment happens from the Coaches area, not here).
- **Assigned:** an "Assigned coach" card (name + employer, explicit "reassignment isn't done here" copy — see §17, the avatar this card used to show is gone), a **read-only** `session-tracker` (identical dot/tick visual grammar to §13's interactive version, but every row is a decorative `aria-hidden` marker with zero buttons/kebabs — the caption states "View only — synced from {coach}'s own tracker" so the missing controls read as intentional, not broken), and a "Session records" card reusing the `recording-card` tile grammar (§11) keyed to SPACES session numbers instead of COACH phases.

---

## 17. Component specs (Round 4.1 — cross-portal UI refinements)

Not a new feature area — a round of direct chat-iteration UI edits requested against the already-built Research Dashboard and Coach Training Portal, reviewed and applied one at a time rather than scoped in a pre-written plan (same "captured retrospectively" pattern as Round 3.1, §15). Touches both portals; no new colour/type/radius tokens, everything expressed in existing ones.

### `sidebar-nav` — inactive-state parity + collapsed tooltips (extends §10/§12/§14)
- **Training Pipeline**'s header (`AreaHeader`) was hardcoded `font-semibold text-ink` at every render state — including while a *different* area (e.g. Coaches) was active — so it permanently read as "selected." Its expanded-sidebar text now follows the exact same default/active convention as the leaf areas (`AreaLink`): muted/regular by default, `font-semibold text-primary` only while its own section is active.
- **Collapsed (icon-only) nav** previously relied on the native `title` attribute for a hover label — slow to appear, unstyled, and native-tooltip positioning is unreliable near a viewport edge. Replaced with the app's own `Tooltip` primitive (base-ui, installed but unused anywhere in the app until now), rendered via a `Portal` (so the nav's `overflow-y-auto` can't clip it) to the right of the icon. One shared `TooltipProvider` wraps the collapsed nav so hovering between the 3 icons reads as one continuous group rather than 3 independent open-delays.

### Page titles — `display-lg` retired from every page `<h1>` (extends §2)
- Every page-level title (`text-display-md md:text-display-lg`) had it read too large once seen next to real content at desktop width. The `md:` bump to `display-lg` (40px) is dropped everywhere — page titles now render at a uniform `display-md` (34px) at every breakpoint. Detail/profile-page titles (a coach's or dyad's name), which were already single-tier `display-md`, are untouched — dropping them further would collide with the 21px `title` scale already used for in-page section headers.

### Avatar — removed from every render site (extends §7 `header`, §13/§15/§16 profile headers)
- The initials-circle (`Avatar`/`AvatarFallback`) is gone from all 10 places it rendered: both header account areas, the Training Portal profile page, the EOI table + detail header, the Coach roster table + Coach Profile header, the SPACES Coach Management table + SPACES Coach Profile header, and the Consumer Detail "Coach Matching" tab's assigned-coach card. The Training Portal header's "Your profile" control — previously an icon-only circular hit-target built *around* the avatar — is now a plain "Profile" text link, matching the header's other controls ("Switch portal", "Account") rather than leaving an empty circle. The `initials` field itself stays on `Coach`/`Eoi` records (it's genuine shared data, also consumed by `coachFromEoi()`) — only the avatar UI consuming it is gone. The `Avatar` primitive itself (`components/ui/avatar.tsx`) is untouched, since it's a generic, reusable shadcn component, not specific to these instances.

### `section-tabs` — moved below the identity block, sliding underline (supersedes the Round 2 "record pages with right-aligned tabs" architecture note, §9 opening)
- On every record page (Coach Profile, SPACES Coach Profile, Consumer Detail), the tab row no longer sits right-aligned beside the name/subtitle in one flex row — a long dyad/coach name crowded the tabs against the card edge. The tab row now sits on its own line below the identity block (`mt-6`), full-width, with a `-ml-3` correction so the first tab's *text* (not its click-target padding) lines up flush with the heading/breadcrumb above it.
- The active-tab underline indicator was an instant CSS `after:` pseudo-element that jump-cut between tabs. Replaced with a `motion.span` tagged with a shared `layoutId` per tab group — Framer Motion animates a smooth FLIP transition between the old and new tab automatically. Applied to all 5 tab groups in the app that use this grammar: the 3 record-page tab rows plus the Patient/Carer member-toggle tabs inside Health Data Hub (Consumer Detail and SPACES Coach Profile) — same visual grammar, so it gets the same animation treatment. Spring config `{ stiffness: 500, damping: 35 }` — a quick, tight slide, not an exaggerated bounce.

### Record-page + Training Dashboard hero — full-bleed `bg-pearl` band (new)
- The identity block (back-link + name/subtitle + tab row, on record pages; the "Welcome back" greeting, on the Training Dashboard) now sits inside a full-bleed `bg-pearl` band with a `border-hairline` bottom seam, spanning edge-to-edge across the content area (from the sidebar's right edge to the viewport edge on Research Dashboard pages, which have a sidebar; true viewport edge-to-edge on the Training Dashboard, which doesn't) — independent of the page's own centered content column, which still renders inset inside the band via its usual `max-w` wrapper.
- On record pages, the band has **zero bottom padding** below the tab row — its bottom edge is the tab row's own bottom edge, so the active tab's sliding underline sits right on the seam. `ResearchShell` gained an optional `hero` prop for this (pages that don't pass one render exactly as before, unaffected); the Training Dashboard, which has no shared shell, gets the same band inline since only one page needed it.

### Header account menu — real `Menu` dropdown, shared by both portals (extends §7 `header`)
- Both portals' account area was an inert "Account (coming soon)" placeholder (Research) or a placeholder plus a separate "Profile" link (Training) — two different, partly-dead patterns. Unified into one shared block (`Switch portal` link + notification bell + one `Menu.Root` dropdown), reusing the exact `Menu`/`Trigger`/`Portal`/`Positioner`/`Popup`/`Item` composition already established for Coach Profile's "more actions" kebab (§12). Trigger shows the signed-in person's name + a chevron that rotates on open.
- **"Edit profile"** behaves per-portal, since the underlying pages differ in readiness: Training → a real link to the existing `/training/profile`; Research → still `disabled` ("Coming soon"), since a researcher profile page doesn't exist yet. **"Sign out"** works identically on both — navigates to the portal switcher, the closest stand-in for a logged-out state in a prototype with no real auth.

### `module-card` — reworked (supersedes most of §7's `module-card` entry)
- **Cover:** the flat tint + centered lucide icon is replaced by `moduleArt()`, composing a module's 3-colour palette (`cover.colors`, replacing the old `cover.tint`/`cover.icon` fields) into a soft two-bloom radial-gradient wash — an Apple-marketing-style soft-light composition standing in for real module photography, which doesn't exist yet in this prototype (no image pipeline, and sourcing real stock photography would mean fabricating an external asset URL, which this project avoids).
- **New header row** above the title: "Module {n}" (left, derived from array position, not stored data) and a status chip (right, `bg-pearl`/`ring-hairline`, reusing the `status-chip` chassis from §9) reading Not started / In progress / Completed.
- **Progress row redesigned:** the checkmark + "Completed" text is gone. The row is now always "x/N slides" (left, via the already-existing but previously-unused `completedSlideCount()` helper) and a bare "xx%" (right) — the same two derived numbers regardless of status, replacing a 3-way text branch. The progress bar's `state-success` fill on a completed module is kept (color still pairs with the new status chip's text, so the "never colour-only" rule in §8 still holds).
- **CTA** changed from `w-fit` to full card-width (`w-full`), filling the card's padded content area.
- **Shadow** dropped (`shadow-none`) for this card only — added via `className`, not by changing the shared `Card` component, so every other card in the app keeps its `shadow-card` (§4/§8).
- **Description** clamped to 2 lines (`line-clamp-2`) so a long description can't grow one card taller than its grid siblings.

---

## 18. `sign-in-flow` + `training-auth-gate` (new — Round 1.1, Coach Training Portal SSO sign-in)

A mocked single-sign-on gate in front of the Coach Training Portal, styled as "Okta Verify." No real identity provider — this is a fully client-side mock, matching the fidelity of every other flow in this prototype.

### `signin-backdrop` (new token)
- `--color-signin-backdrop: #0a1a3a` — a deep navy in the same hue family as `primary` (`#0066cc`), pushed dark enough to read as a full-bleed backdrop rather than a second accent. **Scoped to exactly one screen** (`/training/signin`) — not a general-purpose dark-surface token available elsewhere. `primary` remains the system's only accent; it appears on this screen only inside the white card (button fill, icon glyph), at full saturation, same as everywhere else.

### `sign-in-flow` (new component spec)
- **Page chassis:** full-viewport (`min-h-screen`) flex-centered column on `bg-signin-backdrop`. No `AppHeader` — there's no session yet, so "Switch portal"/account chrome don't apply. A small text-only "Care2Sleep" brand lockup (`font-display text-[17px] font-semibold`, white) sits above the card, the only other element on the backdrop.
- **Card:** the shared `Card` component reused verbatim (`shadow-card` + `ring-hairline`, §5/§8) — no new shadow invented. Fixed `max-w-[400px]`, centered.
- **Four steps, one component, local state (`Step = 'email' | 'password' | 'forgot' | 'verify'`):**
  1. **email** — headline, supporting line, one `dialog-input` (below), primary-pill submit disabled until non-empty.
  2. **password** — an identity line ("Signing in as {email}.") with an inline "Not you?" reset link, a `dialog-input` password field paired with a "Forgot password?" link above it, primary-pill submit disabled until non-empty.
  3. **forgot** — a `dialog-input` email field + "Send reset link" (disabled until non-empty) + "Back to sign in"; submitting swaps to an account-existence-ambiguous `role="status"` confirmation ("If an account exists for {email}, we've sent instructions...") with a `Mail` icon badge and the same "Back to sign in" link — a deliberate security pattern (never confirms/denies whether an account exists), not a stopping-short shortcut.
  4. **verify** — the Okta Verify push-approval screen: a `ShieldCheck` icon badge, "Approve this sign-in in Okta Verify" headline, the primary-pill "Sign in with Okta Verify" CTA (completes sign-in, no artificial delay — matches this prototype's established instant-resolution convention for every other mocked action), a "Use a different account" reset link, and a footnote for a missing notification.
- **Icon badges:** `size-12` circle, `bg-primary/10` fill, `text-primary` glyph (`ShieldCheck` for the Okta Verify step, `Mail` for the reset-sent confirmation) — the same treatment already established on `PortalSwitcherPage`'s portal tiles, just reused at a slightly larger size for a single hero icon.
- **Text links** ("Not you?", "Forgot password?", "Back to sign in", "Use a different account"): `min-h-11` (44px) touch target, `text-primary`, `hover:underline` — same convention as every other inline text-link in the app (e.g. `EoiDetailPage`'s "Back to EOIs").
- **`dialog-input` (new reference name for an existing pattern):** formalizes the one real editable-input precedent already in the app (`InviteCoachDialog.tsx`) as a named pattern: `h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring`, paired with a `text-fine text-ink-faint` `<label htmlFor>`. Any future real form field (this app has had exactly one before this round) should match this spec rather than inventing a new input treatment.

### `training-auth-gate` (new mechanism, not a visual component)
- A `sessionStorage` key (`care2sleep.trainingAuth`) stands in for an SSO session, read by a `RequireTrainingAuth` wrapper component used per-route in `App.tsx`. Unauthenticated → `<Navigate to="/training/signin" replace />` (the same redirect idiom already used by `EoiDetailPage`/`ModulePage` for a missing record). Scoped to the Coach Training Portal only — the Research Dashboard has no gate.
- The header's existing "Sign out" (both portals, §17) also clears this flag before navigating to `/` — signing out anywhere ends the shared mocked session, the correct SSO simulation, and means a later visit to `/training` re-triggers the gate.

---

## 19. Component specs (Round 5 — Consumer Portal, Health & Sleep Dashboard)

The first round for the Consumer Portal (previously "Not started" — see `handover.md`'s interface table). New sidebar-navigated portal, structured like the Research Dashboard hub — not the Coach Training Portal's top-nav shell. Directly reuses §10 `sidebar-nav`, §16 `fitbit-sync-monitor`/`sleep-diary-feed` grammar, and §13 `session-tracker`'s dot/tick marker language; only the structures below are new.

### `consumer-shell` (new — Research-Dashboard-style hub, scoped to 2 active surfaces)
- Same chassis as `ResearchShell` (§10 `sidebar-nav`): global header + collapsible left sidebar + optional full-bleed `hero` band. Sidebar carries exactly 2 links — **Home**, **Health & Sleep** — both single-destination leaves, so no accordion is needed. **Learning Dashboard has no sidebar entry at all**, confirmed by the user — it lives only as a card on the Home page (below), with its CTA deactivated since no Learning Dashboard spec exists yet to link out to.
- `AppHeader` gains a `consumer` portal variant — the same Switch-portal/bell/account-menu cluster as `training`/`research`, with a new `accountLabel` prop threading the signed-in dyad's carer name into the account menu (this portal has no static coach/researcher import to fall back on).

### `pearl-band` — no-seam variant (extends §17)
- The Home page's Welcome section reuses the full-bleed `bg-pearl` hero band verbatim, but **without** the token spec's usual bottom `border-hairline` seam — a deliberate one-off, logged here rather than silently forked, matching the plan's explicit call-out.

### `session-roadmap` (new — horizontal variant, supersedes nothing)
- A **horizontal** stacked timeline across the 7 SPACES sessions: the same dot/tick markers as the vertical `session-tracker` (§13), connected by a horizontal line instead of vertical, session number + name below each marker, `overflow-x-auto` at narrow widths. Reads the same `research-store` `sessionCompletion` state as the existing vertical tracker — a new *shape* only, not a new data source. Paired with a read-only **completion record table** (session / status / date & time / Join-if-scheduled) below it. **Gated**: the whole section is omitted entirely (not shown disabled) until all 6 `CONSUMER_MODULES` are `completed` AND `coachId` is set, per the user's "should only show after" instruction.

### `upcoming-schedule` (new)
- A details-left/CTA-right row — date + time, session title, "Session with {coach}", Meeting ID on the left; a single `Join` pill on the right, opening `ConsumerDyad.upcomingSession.zoomLink`. The same row shape is reused by the `session-roadmap`'s completion table for its one "next" row, so both surfaces read off the same `upcomingSession` field rather than duplicating it.

### `digital-sleep-diary` (new — first consumer-writable diary surface)
- A single-day entry form (textarea defaulting to today's existing entry if present, Save button) scoped to the signed-in dyad member — the first place `HealthLogEntry.diaryEntry` is written by anyone other than seed data, via a new `addDiaryEntry` store action. The Research Dashboard's `SleepDiaryFeed` (§16) stays read + CSV-export only, unaffected.

### `unified-data-visualization` (new)
- A combined table, one row per date: that day's key Fitbit reading and diary entry side by side — the join the Research Dashboard's toggle-open diary rows only did informally, made the primary view here.

### `trend-analysis` (new — first charting library in the codebase)
- **Real line charts**, via `recharts` (new dependency), composed directly rather than through the full shadcn `chart.tsx` primitive layer (not otherwise exercised in this codebase). REM % renders on a left axis; Duration (hours) and Disturbances share a right axis so their smaller-magnitude values don't visually flatten against REM's 0–100 scale. Confirmed by the user as a deliberate break from every prior "trend" surface in this app (Round 3's non-chart trend glyphs, §13 `health-data-log`) — not a default reversion.

### Shared-field update — session completion date/time (extends §13 `session-tracker`, §16 `coach-matching-gate`)
- `ConsumerDyad.sessionsCompleted` extended from a bare `number[]` to `{ session, completedDate, completedTime }[]`. Both the Coaches area's interactive `session-tracker` (`SpacesCoachProfilePage.tsx`) and the Consumer Management area's read-only `coach-matching-gate` variant (`ConsumerDetailPage.tsx`) now display the date/time alongside the existing dot/tick marker — same `research-store` `sessionCompletion` state and `toggleSession` action, richer shape only. `toggleSession` now stamps `TODAY` + the current client time when marking a session complete.

---

## §20 — Round 5.1, Consumer Portal Home + Health & Sleep refinements (direct chat iteration)

A rapid sequence of 13 direct edits against the signed-off Round 5 Consumer Portal, no pre-written scope plan (same format as Round 4.1's §17). Full detail in `round-5.1-consumer-portal-home-health-sleep-refinements-prototype-plan.md`; this section covers only the genuinely new tokens/patterns.

### `--color-highlight` (new token)
- Soft pale yellow (`#fdf6e0`) — the app's first non-primary/non-success color. Scoped to exactly one card (the Home page's Learning Dashboard card, paired with a gradient-wash cover reusing `ModuleCard`'s `moduleArt()`), documented in `index.css` as a deliberate one-off, same exception pattern as §18's `signin-backdrop`. `primary` remains the system's only general-purpose accent.

### `topBanner` slot (extends `consumer-shell`, §19)
- `ConsumerShell` gained an optional `topBanner` prop — a sticky (`top-12`, stacking directly under the header's 48px height) full-width bar scoped to `main`'s own column, deliberately not full page width so it can't overlap the sidebar's own `sticky top-12` positioning. First use: `TodaySessionBanner`, a dismissible reminder shown only when the dyad has a session scheduled for the prototype's `TODAY`, solid `bg-primary` fill (not the usual quiet `bg-pearl` alert treatment) so it reads as a time-sensitive interrupt rather than another card.

### Forked researcher/consumer copy (extends `fitbit-sync-monitor`, §16)
- `FitbitSyncMonitor`/`FitbitLogTable` gained optional `description`/`emptyMessage`/`memberLabels` props, all falling back to the original Research Dashboard wording when omitted. The Consumer Portal now passes plain-language copy and first names (not "Patient"/"Carer" — see CLAUDE.md's consumer terminology rule) through these props; the Research Dashboard's own call site is unchanged. A genuine bug ("Dummy data for this round," a build note that had leaked into shipped UI text) was removed from the shared default regardless of portal — not a per-audience choice.

### `formatTime` (new helper, extends `formatDate`)
- Converts the seed data's 24-hour time strings ("14:00") to 12-hour + AM/PM ("2:00 PM"), same plain-string-parsing style as `formatDate` (no `Date` object, no timezone dependency). Applied everywhere a session time renders on the Consumer Portal Home page.

### Card height-balance pattern (bug fix, not a new token)
- The Home page's 2-up card grid stretches both cards to match the taller sibling via CSS grid, but neither card's inner content grew to fill that height — a pre-existing gap made newly visible by the Learning Dashboard's new background color. Fixed with a reusable shape: a `flex-1 flex-col` content wrapper, with either a bottom-anchored action (`flex-1 justify-end` around a trailing button) or a vertically-centered short message (`flex-1 flex-col justify-center`), rather than a fixed margin that only works for one card's natural height.

---

## 21. Component specs (Round 6.1, Phase 1 — Coach Delivery Portal Home, widget system)

The Figma reference's "Quick links" tile grid is not a static shortcut grid — confirmed by the user as a genuine **widget system**: a fixed set of default tiles shown on first load, plus a "+ Add widget" tile that opens a picker of further mock tools to add. This is a new interaction pattern (add tiles to a grid, a picker surface) distinct from every other pattern in this file — `module-card`, `data-table`, and `placeholder-card` are all static, non-configurable chassis. Reuses `placeholder-card`'s inert-tile convention (§7) and the `ConfirmDialog` chassis (§9) as its two building blocks; only the structures below are new.

### `widget-tile` (the grid unit)
- **Chassis:** same card grammar as `placeholder-card`/`module-card` — `canvas` fill, `1px hairline` ring, `radius-lg` (18px), `shadow-card`, `space-lg` (24px) padding. Grid: `sm:grid-cols-2 lg:grid-cols-4`, `space-lg` gap — 4 columns at desktop so the 4 default tiles + the add-tile wrap to a clean second row of one.
- **Anatomy (top to bottom):** an icon badge (see below), then the tile label in `body-strong`, left-aligned. No description line, no CTA row — this tile is denser than `module-card`/`placeholder-card`, matching the Figma reference's compact "quick link" density.
- **Icon badge:** `size-10` **square**, `radius-sm` (8px) — deliberately *not* the `rounded-full` circle used by `PortalTile`/`PlaceholderCard`'s icon badges (§7), so a widget tile is never visually confused with a portal-switcher tile or an inert placeholder at a glance. Fill is the tool's brand-tint at `/10` opacity, icon glyph at full brand-tint color, `size-5`, `strokeWidth={1.75}` — same proportions as the existing `bg-primary/10` + `text-primary` badge convention, just square and per-tool-tinted instead of always-primary.
- **Two states, same chassis:**
  - **Real tile** (Coach Training Portal only): the whole card is one `Link` tab stop to `/training`, `press` motion (§6), `primary-focus` ring on focus. Label reads "Coach Training Portal" in full — never a bare "Training", so it's unambiguous which portal it opens given this page lives inside the *other* portal.
  - **Inert tile** (Gmail, Calendar, Zoom, and anything added via the picker): non-interactive, not focusable, `aria-disabled="true"` on the tile — the exact `placeholder-card` convention (§7), including its visible **`Coming soon`** tag (`fine-print` on a `surface-pearl`/`bg-card` chip, top-right of the tile) so an inert widget never reads as a broken link. No real external destinations exist anywhere in this codebase, so every non-training tile — default or added — is inert; this is a deliberate, permanent state for those tiles, not a "not wired up yet" gap for engineering to close.

### `widget-tile--add` (the add-tile, distinct visual state)
- Same `size-10`/`radius-lg`/grid-cell footprint as `widget-tile` so it sits in the grid without disrupting its rhythm, but its chassis is inverted to read as an action, not content: `bg-transparent` (no `canvas` fill), **`border-2 border-dashed border-hairline`** (quiet, no shadow), centered `Plus` icon (`size-5`, `text-ink-faint`) above the label **"Add widget"** (`caption-strong`, `text-ink-faint`). Hover/focus: border and icon/label shift to `text-primary`/`border-primary` (still dashed) — the one piece of interactive color signal, consistent with `primary` being the system's single accent.
- A real `button` (opens the picker), `press` motion, `primary-focus` ring — genuinely interactive, unlike the inert default tiles beside it. Always the last cell in the grid.

### `widget-picker` (dialog opened by the add-tile)
- **Shell:** the existing `ConfirmDialog` chassis (§9) reused as-is — backdrop, panel (`canvas`, `radius-lg`, `1px hairline`, `max-h-[85vh]` with only its row-list region scrolling), focus-trap, Escape-to-close. No new dialog primitive invented. Title: **"Add a widget"**. No body consequence line is needed (this dialog has a row-list `children` slot instead of the usual prose body — an established `ConfirmDialog` usage shape already seen in `AddConsumerDialog`/`InviteCoachDialog`), so the body slot is used for a single short instruction line instead of a consequence statement. No footer confirm/cancel pair — each row carries its own action, so the dialog's own dismiss is the panel's close control (`Escape`, backdrop click, or a small "Close" text link in place of the usual Cancel/Confirm row).
- **Row chassis:** `min-h-11` (44px) list rows, `divider-soft` between rows, `space-sm` (12px) horizontal padding. Each row: the same square `size-10`/`radius-sm` brand-tinted icon badge as the grid tile (identical treatment, so a tool's identity is visually consistent whether it's sitting in the picker or already added to the grid) + the tool name (`body`) + a right-aligned **"Add"** `button-utility` (36px, `bg-pearl`, `text-ink-muted-80`).
- **On "Add":** appends a new inert `widget-tile` (the `Coming soon` variant) to the Home page's grid, immediately before the add-tile, and the row's own "Add" button flips to a disabled **"Added"** state (`text-ink-faint`, no longer clickable) so the picker reflects grid state if reopened without a page reload. **This is decorative only** — added tiles never carry a real destination, since nothing beyond `/training` has one anywhere in this codebase. Flagged explicitly here so the engineering pass doesn't wire a fake link or `href` for any picker tool: every added tile renders through the exact same inert-tile code path as the default Gmail/Calendar/Zoom tiles, just parameterized by name/icon/tint.
- **Empty/exhausted state:** if every picker tool has already been added, the row list is replaced by a single centered line, **"You've added every available widget."** — matching the project's established pattern of a plain-language empty state rather than hiding the dialog's body entirely (e.g. the Coach Management invite dialog's "every certified coach has already been invited" precedent, §13).

### Default widget set + mock picker set — icon/tint spec (binding for engineering)
No brand SVGs are fabricated or downloaded anywhere in this pattern — every tile uses a generic `lucide-react` glyph inside the brand-tinted square badge above, the same "don't fabricate an external asset" rule already applied to module cover art (§17 `module-card`, Round 4.1 decisions log). These are clearly generic monogram-style stand-ins, not real brand marks.

| Tile | Status | Icon (`lucide-react`) | Tint (badge `/10` fill + icon color) |
|------|--------|------------------------|----------------------------------------|
| Coach Training Portal | Real — links to `/training` | `GraduationCap` | `primary` (`#0066cc`) — the one tile that's genuinely part of this app, so it wears the app's own accent rather than a mock brand color |
| Gmail | Inert default | `Mail` | Gmail red `#ea4335` |
| Calendar | Inert default | `Calendar` | `#0066cc`-adjacent neutral blue `#4285f4` (kept distinct from `primary` itself, so it reads as a mock third-party blue, not the app's own accent) |
| Zoom | Inert default | `Video` | Zoom blue `#2d8cff` |
| Slack | Picker-only, adds an inert tile | `MessageSquare` | Slack aubergine `#611f69` |
| Microsoft Teams | Picker-only, adds an inert tile | `Users` | Teams purple `#6264a7` |
| Outlook | Picker-only, adds an inert tile | `Calendar` | Outlook blue `#0078d4` (Outlook reuses the `Calendar` glyph, same as the default Calendar tile — the tint is what distinguishes them if both are ever on-grid at once; acceptable since neither is a real destination) |
| Google Drive | Picker-only, adds an inert tile | `HardDrive` | Drive green `#0f9d58` |

### Copy decisions (Round 6.1, Phase 1)
- "Coach Training Portal" (never a bare "Training") — the tile sits inside the *Delivery* portal, so the destination portal must be named unambiguously; this matches this file's own past decision to never use bare "Training"/"Coach" labels where a coach could be reading from the other portal's context.
- "Gmail" (not the generic "Email") — the user's explicit correction: since the tile is styled with Gmail's own brand tint, the label should name the specific mocked product rather than describe its category, consistent with how Slack/Teams/Outlook/Drive are all named as specific products, not generic categories ("Chat", "Storage").
- "Add widget" / "Added" — mirrors the plain present-tense verb pattern already used for other one-shot state flips in this app (e.g. "Invite" tiles, "Download" confirmations) rather than a longer confirmation phrase.

---

## 22. Component specs (Round 6.1.1 — Coach Delivery Portal Home, direct chat-edit batch)

**⚠️ Supersedes §21's "no fabricated brand SVGs anywhere, every icon is a `lucide-react` glyph" rule — for the 3 default non-training widget tiles only.** Per direct user request, Gmail/Calendar/Zoom now render their real brand marks (downloaded PNGs, sourced from this round's own referenced Figma file's "Quick links" icons — not fabricated, not hotlinked from an external URL) instead of a generic tinted glyph. This does **not** extend to picker-added tools (Slack/Microsoft Teams/Outlook/Google Drive), which remain generic `lucide-react` glyphs in a brand-tinted badge exactly per §21 — no request was made to source real logos for those, so §21's rule still governs them. Coach Training Portal is unaffected (still `GraduationCap`, `primary` tint, unrelated to this exception).

### `widget-tile` — real-logo variant (extends §21)
- New optional `logoSrc` field on `WidgetTileData` (`src/components/delivery/WidgetGrid.tsx`), checked before `icon`/`tint`. When present, the tile renders a plain `<img>` (`size-10 object-contain`, no wrapping tint badge — the source logos already carry their own brand color/background, e.g. Zoom's is a solid rounded-square mark) instead of the square tinted-glyph badge. Assets live at `public/logos/gmail.png`, `google-calendar.png`, `zoom.png`.
- The "Coming soon" tag is now removed from all 4 default tiles (previously only the real Coach Training Portal tile lacked it) — a deliberate visual-polish call for this batch of edits, not a functional change; every non-training default tile is still permanently decorative with no real destination, per §21's original rule, just without the tag signaling it. **Accessibility correction (Phase 4):** removing the tag's visible text also silently removed the only cue — visible or accessible — that these roleless, non-focusable `<div>` tiles are inert (`aria-disabled` has no defined effect without an ARIA role). Restored via an `sr-only " (coming soon)"` suffix on the label, matching `DeliverySidebar.tsx`'s existing identical convention for its own inert nav items; applies to picker-added tiles too, since they share the same `WidgetTile` component.
- Tile label font reduced from `body` (17px) to `caption` (14px) — denser, matching the "quick link" density §21 already called for but had slightly overshot on type size.
- Hover state added to all 4 default tiles (real and inert alike): `hover:-translate-y-0.5 hover:shadow-md`, transition-all 150ms; the real Coach Training Portal tile additionally gets `hover:ring-primary/30` (a color signal reserved for the one tile with a genuine destination, consistent with §21's existing full-contrast-vs-muted-label distinction for real vs. inert tiles).

### `search-input` (new shared component)
- `src/components/SearchInput.tsx` — the pill input + leading `Search` icon + visible label pattern first established ad hoc for the Research Dashboard's Coach roster search (§9-era) is now a single shared component, taking `id`/`label`/`value`/`onChange`/`placeholder`/`className`. Used by `RosterPage.tsx` (Research Dashboard) and `DeliveryHomePage.tsx`'s consumers-table toolbar (Coach Delivery Portal) — replacing two independently hand-rolled variants (the Delivery one previously had no icon, no visible label, and a squared-off rather than pill shape) with one component, per the user's explicit "I do not want the same component with multiple variants" instruction. Any future area needing a search field should use this component rather than hand-rolling another variant.

### Consumers-table column consistency (Coach Delivery Portal `ConsumersTable`, extends §21)
- **View column:** changed from visible "View" text + a "Coming soon" tag to a bare right-aligned `ChevronRight` icon with an `sr-only` "Open profile" column header — matching the Research Dashboard's `ConsumerManagementPage.tsx` row-chevron convention verbatim (same icon, same `text-ink-faint` tone, same right-alignment, same `sr-only` label text — corrected from an initial "View profile" wording mismatch caught in the Phase 3 re-review). No destination is wired yet (consumer-profile detail is still deferred to a future `round-6.N`), so the chevron is currently decorative, matching this batch's broader "promote inert affordances from a tag to a quieter, more polished visual cue" direction (see the widget tiles above and "Schedule a session" below).
- **Zoom → Session Link:** column renamed "Session Link"; cell changed from an icon-only button (blue when available, grey-disabled placeholder when not) to the Consumer Portal's icon+text "Join Zoom" link pattern (`ConsumerHomePage.tsx`'s 7-Session Roadmap completion table) — renders nothing at all when a dyad has no `upcomingSession`, rather than a disabled-icon placeholder, matching that reference exactly.
- **Toolbar layout:** the search input and Export button now sit horizontally next to each other (`items-end` alignment, so the button baseline-aligns with the input rather than the taller label+input block), and that whole toolbar row sits beside the "Your consumers" title block (`justify-between`) instead of stacked on its own row beneath it.
- **"Add consumer" removed entirely** — was inert/out of scope for this portal (assignment happens from the Research Dashboard's Coaches area); "Export" is now a real, working CSV download of the visible (search-filtered) rows, using the new shared `downloadCsv` helper below.

### `downloadCsv` (extracted shared helper)
- `src/lib/csv.ts` (new) — the CSV-escaping + `Blob`/`URL.createObjectURL` download logic, previously a private, unexported function inside `ConsumerDetailPage.tsx` (Research Dashboard's Sleep Diary Feed CSV export), is now a shared export. `ConsumerDetailPage.tsx` was refactored to import it rather than keep its own copy; the Coach Delivery Portal's newly-enabled Export button is the second consumer. No behavior change to the existing Research Dashboard export — verified still working after the extraction.

### `upcoming-sessions` — scrollable list (extends §21's Home-page layout)
- The Upcoming sessions panel's session list (`DeliveryHomePage.tsx`, `UpcomingSessionsPanel`) is now vertically scrollable (`max-h-[189px] overflow-y-auto`, `pr-1` gutter) rather than growing the card to fit every session unbounded — matching this round's own Figma reference, which specified a scroll region for this exact panel (a dedicated "scroll" indicator layer inside the frame) that wasn't carried into the original Round 6.1 build. The "Schedule a session" button stays pinned outside/below the scrollable region, always visible regardless of scroll position. Tuned (via live pixel measurement, not guessed) so a second session card is deliberately ~30% visible before the scroll clip — a peek affordance signaling more content below, per direct user request. **Re-tuned once** during the Phase 3 re-review: the initial `252px` value was measured against a transient/incompletely-font-loaded render (a taller, wrapped-text version of the row); re-measured after a full reload with the webfont cached and retuned to `189px` for a true ~30% (confirmed 30.1%) — a reminder that this project's font-loading timing can shift measured element heights, so pixel-tuned values are worth re-verifying after a cold reload, not just after the page's own fade-in transition settles. Confirmed via the Phase 4 accessibility pass that the scroll region is keyboard-reachable (native focus-scroll on the "Join Zoom" links) and that a screen reader's linear reading gets both day-groups' full content regardless of the visual clip.
- New second-session seed data (`src/data/spaces.ts`, `dyad-012` now has an `upcomingSession`) demonstrates this panel with multiple sessions across multiple day-groups for the first time — previously only one dyad (`dyad-011`) had an upcoming session, so the multi-session/scroll case was unexercised.

### `schedule-a-session` (state change, not a new pattern)
- The "Schedule a session" row changed from a disabled `<div aria-disabled>` + "Coming soon" tag to a real enabled-looking `<button>` styled as an outlined-primary CTA (`border-primary text-primary`, `CalendarPlus` icon) — same "promote from tagged-placeholder to a polished-but-still-inert control" treatment as the widget tiles above. No destination/handler exists yet (no scheduling feature has been scoped). **Accessibility correction (Phase 4):** a real, focusable `<button>` with zero `onClick` and no disabled cue is a genuine "dead button" — worse than every other inert control this round, which is either non-focusable or carries a cue. Resolved with `aria-disabled="true"` (unlike native `disabled`, this doesn't remove it from the tab order or grey it out) plus an `sr-only " (not yet available)"` suffix — keeps the button looking and behaving exactly as requested (real, focusable, not visually disabled) while giving assistive tech a real signal that clicking it does nothing yet.

---

## §23. Component specs (Round 6.2 — Coach Delivery Portal, Consumer Detail View: `wizard-progress-rail`)

The new "Add annotation summary" modal (`AddAnnotationSummaryModal`, My Annotations tab, `DeliveryConsumerDetailPage.tsx`) needs a vertical step indicator for its 6-step SIPTEA wizard. `SessionTracker` (§13/§8, `SpacesCoachProfilePage.tsx`) already has a vertical dot/tick/connector-line grammar, but it's built for a **data display** — done/not-done state of 7 real, persisted SPACES sessions, editable at any time, in any order, with a "Mark as incomplete" revert path. The wizard's rail reuses the same visual language deliberately, but the underlying thing it represents is different enough to warrant its own token entry rather than a silent reuse: a **wizard progress rail** — current step / upcoming step / answered step, in a fixed one-directional sequence, with no persisted per-step record and no revert (the wizard is complete-only — nothing saves until the final confirmation screen, per the scope plan's resolved decision #1). Declaring the divergence here so nobody reading `SessionTracker`'s code later assumes the wizard rail's states map onto it 1:1.

### `wizard-progress-rail` (new component spec)

**Shared grammar with `session-tracker` (kept identical):**
- Same **size-7** (`size-7 shrink-0`) `rounded-full` step marker, same vertical `<ol>` layout (`flex flex-col`, one `<li>` per step, `flex gap-3` per row: marker column + content column).
- Same connector line between markers: `w-px flex-1`, `my-1`, hidden after the last step.
- Same `Check` icon (`lucide-react`, `size-4`) inside a filled marker for a "done" state.

**Where it diverges — 3 states, not 2:**

| State | Marker fill | Marker glyph | Connector below | When |
|---|---|---|---|---|
| **Answered** (step already completed within this wizard session) | `bg-success text-white` — reuses `SessionTracker`'s exact "done" fill, no new color | `Check`, `size-4` | `bg-success/40` — reuses `SessionTracker`'s exact "done" connector tone | Steps 1..N-1 once the coach has typed a response and advanced past them |
| **Current** (the step being answered right now) | `bg-primary text-white` — reuses the system's single interactive accent (`primary`, `#0066cc`), not a new token | The step number (e.g. `2`), not a `Check` — it isn't answered yet | `bg-divider-soft` (not-yet-reached tone — nothing "done" exists below the current step) | Exactly one step at a time |
| **Not-yet-reached** | `border border-hairline bg-card` — reuses `SessionTracker`'s exact "not-done" fill | `span.size-2.rounded-full.bg-divider-soft` — reuses `SessionTracker`'s exact "not-done" dot glyph | `bg-divider-soft` | Steps after the current one |

No new color tokens are introduced — `bg-success`, `bg-success/40`, `bg-primary`, `border-hairline`/`bg-card`, and `bg-divider-soft` are all pre-existing (§1). The only net-new visual decision is using `bg-primary` (rather than a success/neutral tone) to mark the "current" step, since the wizard needs a third distinguishable state `SessionTracker` never had to express, and `primary` is this system's only sanctioned way to signal "the interactive thing happening right now" (matching its use for active nav state and progress-bar fill, §1).

**Why no "revert"/persisted-per-item state:** `SessionTracker`'s dots are backed by a real per-session record (`sessionCompletion`) that a coach can toggle back and forth via a kebab menu + `ConfirmDialog` on every change — the tracker is a durable data display, viewable at any time regardless of session. The wizard rail has no such record: nothing about a step's "answered" state survives closing the modal before the final confirmation screen, because the whole wizard is complete-only (scope plan §5, resolved decision #1). So the rail only ever needs to represent transient in-session progress, never a persisted or toggle-able fact — there is deliberately no fourth state for "answered, but changed your mind," since Back/Next (below) already covers revisiting an answer within the same open modal.

**Accessible name (binding requirement, implementation is Phase 2's job):** the rail as a whole needs a real accessible name conveying step position — not just 6 unlabeled colored dots. Minimum bar: each step marker (or the rail's live-updating region) must expose text equivalent to **"Step {n} of 6: {component label}"** (e.g. "Step 2 of 6: Component I" — see `ux-copy.md`'s Round 6.2 section for the exact per-step label strings). This can be an `aria-label` on the current step's marker, an `aria-live="polite"` region elsewhere in the modal that updates on Next/Back, or equivalent — the point flagged here for Phase 4 to check is that a screen reader user gets the same "which step, out of how many" information a sighted user gets from the rail's color states, not that any specific ARIA pattern is mandated.

### Modal chassis: `AddAnnotationSummaryModal` owns its own dialog chassis; the nested discard confirm reuses `ConfirmDialog` directly

**Correction (Phase 5 sign-off, 2026-07-27):** this section originally said `AddAnnotationSummaryModal` "reuses `ConfirmDialog`'s existing chassis." That's only true of the *nested* discard confirmation — the wizard's own outer dialog is a separate implementation in `AddAnnotationSummaryModal.tsx` that replicates the same visual/behavioral pattern (backdrop, centered panel, `max-h-[85vh]`, `role="dialog"`/`aria-modal`/`aria-labelledby`, focus-trap, Escape, return-focus) rather than importing `ConfirmDialog` (`src/components/research/ConfirmDialog.tsx`) directly. This is deliberate, not an oversight: `ConfirmDialog`'s content is a fixed title/body/children shape with a Cancel/Confirm (or `singleAction`) footer, and — critically — it unmounts its content whenever `open` is false (`{open && (...)}` inside `AnimatePresence`), which is correct for every existing single-screen use but would be wrong for a 6-step wizard whose own `open` prop only toggles the *whole modal*, not each step; the wizard needs its content to swap 7 times (6 steps + review) without that lifecycle ever tearing down. So `AddAnnotationSummaryModal` hand-builds an equivalent chassis it can drive itself, and separately renders one real `<ConfirmDialog>` for the nested "Discard this annotation summary?" step, which *is* a genuine single-screen confirm and reuses the component as-is. The 4 interaction-rule differences below are accurate as written; only the "reuses `ConfirmDialog`'s existing chassis" framing in the original paragraph was imprecise.

**What `ConfirmDialog` does *not* have today, that a multi-step wizard needs layered on top (pattern-level — Phase 2 implements):**

- **Multi-screen state within one open dialog.** Every existing `ConfirmDialog` use is single-screen: one title, one body, one action (or a `singleAction` row-list like the widget picker). The wizard needs to change its title/body/content **without closing and reopening the dialog** as the coach moves through steps — the dialog's own open/close lifecycle (and therefore its focus-trap setup/teardown) stays put across all 6 steps + the confirmation screen; only the `children` content swaps.
- **Next/Back navigation that isn't Cancel/Confirm.** `ConfirmDialog`'s footer today is binary: Cancel+Confirm, or a single "close" link (`singleAction`). The wizard needs a **3-slot footer pattern**: Back (disabled/absent on step 1), Next (steps 1–5; becomes "Review" or equivalent on step 6, per `ux-copy.md`), and a way to abandon the wizard entirely (a quiet "Cancel"-style exit, distinct from "Back" — Back moves within the wizard, Cancel leaves it). None of these are a "confirm the record-changing action" button in `ConfirmDialog`'s sense until the very last screen.
- **Escape must not silently destroy answers mid-wizard.** `ConfirmDialog`'s Escape-closes-immediately behavior is safe for its existing uses because none of them holds multi-step unsaved input — an add-consumer form, for instance, is one screen, so closing it loses at most one screen's worth of not-yet-submitted input, same as clicking outside a native `<dialog>`. A 6-step wizard with **no partial save** (scope plan §5, decision #1) has a materially bigger loss on the line: hitting Escape on step 5 discards 5 answered steps, not one. The pattern needed is a **confirm-before-discard step**: Escape (and backdrop-click, and the exit control above) should route through a lightweight "Discard this annotation summary? Your answers won't be saved." confirmation — reusing `ConfirmDialog` itself, nested one level, as that confirmation — rather than closing immediately, *except* on step 1 or the initial empty state, where there's nothing yet to lose. This mirrors the project's existing standing rule that record-changing actions always state their consequence (§9 `confirm-dialog` origin, Round 2) — abandoning 5 answered steps is exactly that kind of consequence, just framed as a loss instead of a change.
- **A true terminal state, not a repeatable action.** ~~Every other `ConfirmDialog` use can be reopened immediately after closing (reopen the same add-consumer dialog, try again). The wizard's final confirmation screen, once submitted, ends in "Add annotation summary" being disabled for this dyad going forward (one-time-per-consumer, per the scope plan §2d) — so the modal's last screen is a genuine dead end for this dyad, not a reusable form.~~ **Superseded, Round 6.2.1:** the one-time-per-consumer gate was removed at the user's explicit direction — a coach can now submit any number of annotation summaries for the same consumer over time (data model changed from a single `annotationState`/`annotationSummary` field to `annotationSummaries: AnnotationSummaryEntry[]`, each independently timestamped and shared/not-shared). The trigger's only remaining gate is "Session 1 complete," which is unrelated to how many times it's already been used. The wizard chassis itself (multi-screen state, Back/Next/Cancel, discard-confirm) is unaffected by this change — only the "true terminal state" framing above no longer applies.

These four rules are described at the pattern level (states: step 1 / mid-wizard step / final confirmation screen; transitions: Next, Back, attempted-exit → discard-confirm, submit → terminal) rather than as code, per the brief — Phase 2 owns the actual `AddAnnotationSummaryModal` implementation, including whatever local step-index state and nested-dialog wiring it needs.

---

## §24. Component specs (Round 6.2.1 — cross-portal Account tab + consumer opt-out)

Reopened Round 6.2 per a batch of direct chat-edit requests spanning all three portals, no pre-written scope plan (same format as Rounds 3.1/4.1/5.1/6.1.1). New patterns:

### `account-tab` (new sidebar leaf area, all 3 portals)
- Every portal's sidebar gains one plain leaf-area destination, "Account," reusing the existing `AreaLink` (Research)/`NavLink`-array (Delivery, Consumer) grammar verbatim — no new nav markup shape. `DeliverySidebar.tsx` was refactored from one hardcoded `Home` link into the same `links`-array pattern `ConsumerSidebar.tsx` already used, purely to support adding a second entry cleanly (no visual change to the existing Home item).
- Each portal's Account page follows the same card order: **Profile details** (name/role/etc. read-only, contact fields editable via the established `CoachProfilePage.tsx` Contact-details edit/Save/Cancel pattern) → **Notification preferences** → **Password**. The Consumer Portal's page is additive, not inconsistent: it shows both dyad members (via the existing `PersonCard`, unchanged) plus a Contact details card (the carer is the account holder) and the opt-out card below.

### `notification-preferences-card` (new shared component)
- `Email`/`SMS` checkboxes — real native `<input type="checkbox">` wrapped in a `<label>` (implicit association, no separate `id` needed), `min-h-11` label row for touch target. No separate edit-mode toggle (unlike the profile-details cards) since two checkboxes don't need one; "Save changes" only appears once the local selection differs from what's saved, and a "Saved." confirmation replaces it afterward.

### `password-change-card` (new shared component)
- Industry-standard pattern, modeled directly on this app's own `SignInPage.tsx` forgot-password flow: **never set a new password inline.** The card asks for the *current* password (confirms identity), then states a reset link will be emailed — there is no "new password" field anywhere in this component, matching the same security-conscious shape `SignInPage`'s "Check your email" step already established (Mail-icon badge, `role="status"` confirmation).

### `opt-out-card` (new, Consumer Portal only, destructive-toned)
- Two states in one card: an **offer** (reason dropdown + a `ConfirmDialog`-gated destructive button, `border-destructive/30`/`bg-destructive/5` soft tint — the same restrained soft-tint weight already used for `text-destructive` elsewhere, not a jarring full block) and, once acted on, a **recorded outcome** (date + reason, same soft card, no more form). The consequence itself is escalated separately: a persistent, non-dismissible red banner (`OptedOutBanner`, solid `bg-destructive`, white text, `role="status"`, matching `TodaySessionBanner`'s existing shape minus the dismiss button, since this reflects a standing account state rather than a one-time reminder) shown on every Consumer Portal page via a new `optedOut` prop on `ConsumerShell`, which overrides whatever `topBanner` a page would otherwise show. Opting out also removes "Join Zoom" access from the Upcoming Sessions card and the 7-Session Roadmap table on the Home page.
- Computed contrast: `#d70015` (`text-destructive`/`bg-destructive` in either direction against white) measures 5.38:1, clearing AA for both normal and large text — no new color token, reusing the existing `destructive` value.

### `heroNoSeam` — extended to `ResearchShell` (was already on `DeliveryShell`/`ConsumerShell`)
- §17/§9's `hero` pearl band assumes a tab row sits at the very bottom of its content, so the band has **zero bottom padding of its own** by design — its "seam" is the tab row's own bottom edge. A `hero` with no tab row (a plain title+subtitle, like the new Account pages) doesn't have anything to provide that visual terminus, so without `heroNoSeam` the band renders flush against the content below with no gap at all. `ResearchShell.tsx` didn't have this prop before this round (only `DeliveryShell`/`ConsumerShell` did, from the Round 5/6.1 welcome-band precedent) and was extended to match exactly. **Rule of thumb for future pages:** does this `hero`'s content end in a tab row? If yes, leave `heroNoSeam` unset. If no, always pass it.

### Further Round 6.2.1 direct-edit follow-ups (same batch, continued same day)

- **`upcoming-sessions` retitle + placement (Consumer Portal Home)** — the Home page's card was titled "Upcoming schedule" (the original §19 name) while the Coach Delivery Portal's equivalent card is "Upcoming sessions" (§21); retitled to match, and moved from the page's second row into the top row beside Learning Dashboard, mirroring the Delivery Portal Home's `WidgetGrid`/`UpcomingSessionsPanel` side-by-side placement. The row's internal copy order was also reshuffled to match Delivery's shape (session title → who it's with → time/meeting-id line), folding the date into the fine line since this card has no day-group header to carry it the way Delivery's multi-consumer list does.
- **`SupervisionRecords` gains an optional `rightSlot` prop** — when provided (only the Coach Delivery Portal's Session Logs tab does), it takes the grid's right-hand column instead of the "Session records" card, which moves to its own full-width row below; omitted everywhere else (the Research Dashboard's Supervision Hub), the component's original side-by-side notes/records layout is untouched. Session Logs now reads Session notes | Scheduled Sessions on top, Session records below. The same panel's "Schedule a session" button is now wrapped so it always sits flush with the card's bottom edge (a `flex-1` spacer around the session list absorbs any extra height a taller sibling card gives it), rather than floating directly under a short list.
- **"Assigned coach" Name-as-field** — both instances of this card (Consumer Portal's "My assigned coach," Research Dashboard's "Assigned coach" in Coach Matching) had the coach's name as a bold subtitle line above the field list; moved into the `dl` as the first field, consistent with every other field on the card.
- **App-wide "Patient" → "PLWD" terminology swap** — every remaining user-visible instance of "Patient" (a CLAUDE.md terminology violation) replaced with "PLWD": `PersonCard`'s `title` prop (4 call sites — Research Dashboard's Consumers Registry + Consumer Management, Coach Delivery Portal, Consumer Portal's Account page), the "Relationship to PLWD" field label (inside `PersonCard` itself, plus the Add/Enroll consumer dialogs' own copy of the same field), the Fitbit Sync Monitor member-tab default label + fallback, the Sleep Diary Feed column label, and the Add/Enroll consumer dialogs' checkbox/validation/body copy. The Consumer Portal's own pre-existing "first name, not a role label" convention (§19/Round 5.1, `MemberToggle`) is untouched — it never showed "Patient" to begin with, so there was nothing to swap there.
- **Annotation entries no longer repeat the consumer's name per entry** — both the Coach Delivery Portal's "Your annotation summaries" card and the Research Dashboard's Annotation Vault used to repeat `"{dyad} — Post-practice annotation summary"` as every entry's own heading; now the consumer's name is stated once (the page `<h1>` for the coach's own card, one caption line above the entry list for the researcher's multi-consumer vault), and each entry's own header is just its date/time + shared status. The Coach Delivery Portal's "Previously shared annotation summaries" section (other consumers, for reference) was removed from the per-consumer page entirely, per the user's explicit choice — it showed cross-consumer content out of scope for a page about one specific consumer.
- **`PasswordChangeCard` focus management (accessibility fix)** — the card swaps content across 3 states (idle/open/sent) without moving focus, so triggering a transition dropped a keyboard/screen-reader user to `<body>`, the same class of gap this project's Round 6.2 report noted-but-left-unfixed for the annotation wizard's post-submit case. Fixed here with two focus moves: into the current-password input on open (a real `useRef`+`useEffect`, not `autoFocus`, since the input isn't present on first mount), and onto the "Check your email" confirmation heading (`tabIndex={-1}`, `outline-none`) once sent.

---

## §25. Component specs (Round 6.3 — Coach Training Portal, new version / "Option B")

A brand-new, parallel version of the Coach Training Portal, built alongside the existing untouched one (`/training`) — the first round for this new route family. No pre-written scope plan (same format as Rounds 3.1/4.1/5.1/6.1.1/6.2.1); full narrative in `design/prototype/round-6.3-coach-training-portal-new-version-prototype-plan.md`.

### `training-version-fork` (new pattern)
- A plain navigation fork point (`TrainingPortalChoicePage.tsx`, `/training/choose`), no auth/role logic — both real entry paths into the Coach Training Portal (the root portal switcher's tile, the Coach Delivery Portal's widget tile) route here first, then to either `/training` (Option A, untouched) or `/training-v2` (Option B). `RequireAuth.tsx`'s sign-in redirect was generalized from two hardcoded portal checks to a first-path-segment derivation — the prior `pathname.startsWith('/delivery')` check would have wrongly matched `/training-v2` too, since `'/training-v2'.startsWith('/training')` is `true`.

### `certification-pathway-stepper` (new, `training-v2` hero)
- A compact horizontal marker+connector stepper across all 6 modules + a locked Certificate step, collapsing to a plain text-and-bar `SimplePathwayProgress` below `sm`. Forced-linear by design: exactly one module ever reads as "current" (the first incomplete one, via `moduleState()` in the new `pathway.ts`), regardless of how many modules the underlying shared data independently marks `in-progress` — this pathway enforces an order the real content today doesn't. A display-only override function pair (`displayStatus`/`displayProgress`) lets this version show one module (Module 3) as not-started without touching the shared `modules` record Option A still reads unmodified — the round's own opening rule ("we do not touch the current one") made a display-layer override the only acceptable mechanism, not a data edit.

### `module-timeline` (new, `training-v2` lower fold) — rebuilt mid-round, see decision below
- A vertical marker/connector rail (reusing `session-tracker`'s (§13) dot/connector grammar at a larger, 48px scale, since these carry the same thematic icons as the hero stepper) with one landscape `Card` per module beside each marker (image left at `sm`+, stacking image-on-top below `sm` — a real mobile-overflow bug from a fixed-width image was caught and fixed at this round's own sign-off, see the design-critique report) and a narrower portrait `CertificateCard` at the end.
- **Module identity:** each card's own real title is the sole primary heading everywhere (hero stepper, timeline card, preview modal) — "Module N" survives only as a small secondary eyebrow inside the card, never a standalone duplicate heading repeating the same title+description above it.
- **Content-type distinction, from real data:** `slideComposition()` (`pathway.ts`) derives a plain-text breakdown (`"3 lessons · 1 video · 1 scenario · 1 check"`) from each module's own `Slide.kind` data — replaces an earlier, now-removed "Key skills gained" tag-chip pattern that had cycled through 4 invented background/text colour pairs, breaking the single-accent-colour rule (§1) to manufacture visual variety on content that wasn't real.
- **Coach/consumer relationship, shown only where real:** `consumerParallelTitle()` (`pathway.ts`) looks up a genuine 1:1 topic match against `CONSUMER_MODULES` (real Round 4 data) for exactly 2 of the 6 coach modules, rendering one plain "Consumers learn this too: {title}" line only where a match exists — the other 4 coach-competency-only modules (coaching technique, not sleep content itself) correctly show nothing, rather than a forced fake link.
- **Reachable-but-unwired CTAs read as fully active, not disabled:** "Restart module"/"Start module N" render as ordinary solid-primary buttons with no `aria-disabled` and no dimming — only a genuinely locked (forced-linear-blocked) CTA gets the muted treatment, the `Lock` glyph, and an `sr-only` reason. Found and fixed mid-round: these reachable CTAs previously still carried `aria-disabled="true"` inherited from the locked-CTA pattern, a real sighted/screen-reader mismatch (see the accessibility report).

### `module-preview-modal` (new, `training-v2`)
- Opened from a not-started module's "Start module N" CTA. Its own hand-built dialog chassis (backdrop/focus-trap/Escape/return-focus, same mechanism as `ConfirmDialog`) rather than importing `ConfirmDialog` itself, since that component always renders a title-then-body pair above its children and this modal needs a cover image *above* the title plus one long CTA instead of a Cancel/Confirm pair — same reasoning `AddAnnotationSummaryModal` (§23) used for its own one-off chassis. Shows the module's real title, a "What you'll learn" section, the same real `slideComposition()`/`consumerParallelTitle()` lines the timeline card shows (kept in sync via the shared `pathway.ts` helpers, not a forked copy), and a full-width "Start with this module" CTA (inert — no module detail page exists yet on this version).

### Decision: a design panel, not a single-pass rebuild, for the module-timeline fix
- Direct feedback midway through the round named the built timeline's rainbow tag chips and "Module N" labelling as reading like a generic AI-generated dashboard — a fair, specific call. Rather than immediately rebuilding from one self-review, two independent design proposals were generated and judged/synthesized first, specifically because the failure mode being corrected (defaulting to decorative "dashboard" patterns) is exactly the class of problem a single self-review is prone to repeat. The synthesis's validated principles — no decorative chips, status via glyph/weight only, real data over invented content, syllabus-style restraint — were then applied directly to the actual `module-timeline` rebuild above.
- **A real process mistake, corrected:** the panel was first run and implemented against the wrong surface (`ConsumerHomePage.tsx`'s `LearningDashboardCard`, Consumer Portal Home) due to a literal misreading of a typo ("consumer" for "current"). Fully reverted — `ConsumerHomePage.tsx` restored to its exact pre-round state — once caught; the validated *principles* were not wasted, only the misapplied implementation.

### Retired this round
- **`skills` field**, added to `TrainingModule` (`data/portal.ts`) for the now-removed tag-chip pattern, deleted entirely from the interface and all 8 module entries once nothing referenced it — not left unused.
- **`OnboardingTour.tsx`**, a 3-step first-run spotlight tour, built and fixed (focus-trap/return-focus, matching `ConfirmDialog`'s pattern) mid-round, then deleted entirely — component, wiring, and its page-level `id` anchors — per a later direct instruction to remove it. No dead code left behind.

No new colour tokens this round — the one place a new palette was introduced (the tag chips) was removed entirely, not re-coloured; everything in the final state draws only from `primary`, `success`, and the existing `ink-*` neutral scale.

---

## §26. Component specs (Round 7 — Coach Training Portal Option B, module content player)

The first build of what happens *after* a coach confirms "Start module" on the §25 `module-timeline` — a chapter-by-chapter content player at a new route, `/training-v2/module/:id/play`. Generic/data-driven, but only Module 4 ("Understanding Sleep," standing in as `sleep-basics` in `data/portal.ts` — see the round's own decisions log for why) is content-populated this round. Full narrative in `design/prototype/round-7-coach-training-portal-module-player-prototype-plan.md`.

### `module-player-progress-bar` (new, horizontal cousin of `wizard-progress-rail`, §23)
- Persistent bar pinned to the top of the player shell, visible on every screen. Two rows: a plain text line ("Chapter {n} of {total}"), then — only while inside a chapter's own sub-steps (Learn/Case examples/Knowledge check/What to expect) — a horizontal 6-dot row (Learn → Case 1 → Case 2 → Case 3 → Knowledge check → What to expect). Hidden (text line only) on the module intro, chapter-marker, chapter-complete, module outro, and module-complete screens, since those sit *between* chapters rather than inside one.
- Reuses `wizard-progress-rail`'s exact 3-state colour language (`bg-success` done / `bg-primary` current / `border-hairline bg-card` not-yet-reached) rotated to a horizontal `<ol class="flex">` with a horizontal connector (`h-px flex-1`) instead of a vertical one — no new colour tokens, same declared-divergence reasoning as §23 (a transient, complete-only, in-session progress display, not a persisted/revertible record).
- Accessible name follows §23's binding pattern: an `aria-live="polite"` region stating "Chapter {n} of {total}, step {m} of 6: {step label}" updates on every step change, so a screen-reader user gets the same position information the dot row gives sighted users.

### `video-placeholder` (new, shared by module intro, Learn, and video-format case examples — 6 slots in Module 4)
- No real assets exist yet. Chassis: a muted two-bloom gradient card (`moduleArt`-style wash, §7's `module-card` cover technique, not a fabricated screenshot or stock frame) at 16:9, a centered circular play button, and a duration badge (`fine-print` on a `bg-black/40` chip, top-right) pulled verbatim from the source doc's own estimate (e.g. "~4-5 min") — never invented.
- Directly beneath the thumbnail, the video's actual teaching content renders as plain visible text (`caption`, `ink-muted-80`) — the "Covers: …" copy for Learn videos, or the dramatized-scene description for case-example videos, both lifted verbatim from `Module 4.md`. This is the load-bearing decision: the placeholder still delivers the real lesson content even with no video asset, rather than a bare "video coming soon" box (same non-final-asset convention as `moduleArt()`, Round 4.1 decisions log).
- Tapping play starts a short simulated progress fill (a few seconds, `progress-fill` motion token, §6) across a thin bar under the thumbnail; on completion the video is marked watched, which is what satisfies the Learn/case-video gating decision below. Re-tappable (pause/resume) but not skippable — no scrub bar, since there's no real timeline to scrub.
- Accessible name: the play button states "Play: {short label}" (e.g. "Play: Chapter 1 Learn video"), and the completed state is announced via the same live region the gating Continue button reads its disabled state from — a non-clickable placeholder must never be announced as a native `<video>` element with real controls it doesn't have.

### `case-example-screen` (new) — 3 sequential sub-screens per chapter, two formats
- One scenario slot per screen (Scenario 1/2/3, generically labelled per the framework doc — "Scenario 1 — Carer caring for someone with sleep issues," never a named persona), single "Continue" progression between them, not a 3-card grid.
- **Video format** (exactly one scenario per chapter, rotated per the source doc): renders the `video-placeholder` component above, gated the same as a Learn video.
- **Written format** (the other two): vignette shown immediately (`body`, quoted), then a `button-secondary` "What would you do?" prompt. Tapping it reveals the coach's modelled response (`body-strong`, quoted, attributed "Coach:") plus a bracketed SIPTEA rationale line (`caption`, `ink-muted-48`, e.g. "[S] Notices and names whose sleep problem it actually is…") directly beneath — a simple local reveal (`useState`, no dialog, no route change), matching the project's existing "disclosure over navigation" preference for small in-place reveals. Once revealed, stays revealed if the coach navigates back to this screen within the same session (no re-hiding).
- Continue is available immediately on a written case (reading the vignette is enough to proceed) — only the reveal-on-tap *content* is gated behind the tap, not forward progression. Only the video-format case gates Continue on watch-through, per the Learn-video rule.

### `knowledge-check-step` (new) — one question at a time, immediate reveal
- Renders exactly one of a chapter's 5 questions per screen, in source order (mixing `[Factual]`/`[Applied]`/`[Factual + applied]` tags, shown as a small `fine-print` label above the question — real taxonomy from `Module 4.md`, not invented). A short progress cue ("Question {n} of 5") sits above the question text.
- Two answer-capture shapes, chosen by question type rather than fabricating multiple-choice distractors the source doc never specifies: a **True/False** question (Ch1 Q1) renders two `button-secondary`-style choice buttons; every other question (open factual or applied recall) renders a free-text `<textarea>` self-check — the coach types their own answer, then taps "Show answer" (no grading; this is a prototype self-check, not an assessment). Either interaction immediately reveals the source doc's own **Answer** text (`body-strong`) directly beneath, before advancing — never withheld until the end of the set.
- After the 5th question's answer is revealed, a short "Chapter {n} knowledge check complete" summary line closes the set before the Continue button appears — mirrors the step-based confirmation beat already established by `wizard-progress-rail`'s wizard (§23, Round 6.2), rather than one long all-at-once quiz screen. Flagged in the round's decisions log as a judgment call for sign-off, not a pre-confirmed requirement.

### `what-to-expect-screen` (new) — static reference list, no interaction beyond Continue
- Opens with the chapter's one-line SIPTEA tag (`title` scale, e.g. "This is mostly S work" — verbatim from the source doc) as the screen's own heading, then a plain list of consumer-line → coach-action pairs (`body-strong` "Consumer might say:" quote, `body` "→ You can:" guidance beneath), separated by `divider-soft` rows inside the existing card chassis — no chips, no colour-coding per pair, since the SIPTEA tag above already carries the "which stage" signal once per chapter.

### `chapter-marker-screen` / `chapter-complete-screen` / `module-outro-screen` / `module-complete-screen` (new, transitional beats)
- All four reuse the same plain centered-card layout: a short heading, 1–2 lines of body copy, one primary CTA. No new visual language — these exist to give the chapter loop clear start/end punctuation, per the round's own screen sequence, not to introduce new chrome.
- `module-outro-screen` is the one exception with real interaction: Module 4's actual outro vignette (verbatim) plus a free-text `<textarea>` response field (unscored, matching the source doc's own "no single correct answer" framing) before the "Complete module" CTA.

### Gating + resume mechanics (pattern-level; `moduleProgressStore.ts` is Phase 2's implementation)
- Learn videos and video-format case examples gate their screen's Continue button on watch-through (real or simulated) — confirmed via `AskUserQuestion` before this round's plan was written. Written cases, knowledge-check questions, and the What-to-expect/outro screens never block Continue on an interaction, only on having been *viewed* (i.e., the coach must land on the screen, not complete an action, except the outro's response field which is optional prose, not a gate).
- Progress is persisted client-side (this app has no backend) keyed by module id, recording the highest step reached. Reopening a module via the timeline's "Resume"-equivalent CTA returns to that step, not step 1; a genuinely fresh "Start module" always begins at step 0. This is a `localStorage` read/write, the same persistence tier already used by `sidebar-nav`'s collapse state (§10) and the training auth gate (§18) — no new storage mechanism introduced.
- **Module identity note (flagged for Phase 5 sign-off, not silently decided):** none of the app's existing 6 Option-B pathway modules is literally numbered "Module 4" — that numbering belongs to the research doc's full eventual curriculum, not this prototype's placeholder module list. `sleep-basics` ("Sleep Basics for Dementia Care") was chosen as the Module 4 stand-in since it's the one honest content match (already cross-referenced by `consumerParallelTitle()`, §25) and its raw `data/portal.ts` status is `completed` — reusing §25's own `DISPLAY_OVERRIDES` mechanism (Option-B-display-only, so `/training` Option A is unaffected) to show it as not-started by default, then layering live `moduleProgressStore` state on top so the timeline card's status/CTA/progress genuinely reflect play-through. This does **not** touch `firstIncompleteIndex`/`moduleState()` (§25) — doing so would re-lock `coach-role`, which sits after `sleep-basics` and is unrelated to this round's scope — so the hero's compact stepper (§25, unchanged) will keep reading `sleep-basics` as "completed" regardless of live play progress on the timeline below it. A known, scoped inconsistency between the two surfaces for this one demo module, not a regression for any other module.

No new colour tokens this round — `video-placeholder`, the reveal-on-tap case format, and the knowledge-check self-check all draw on existing `primary`/`success`/`ink-*`/`divider-soft` tokens and the existing `Card`/`button-secondary`/`textarea` chassis.

---

## §27. Component specs (direct UI update — Coach Training Portal Option B home page redesign, Figma node 1:840)

A direct chat-edit redesign of the Option B home page (`TrainingPortalV2Page.tsx`) and its module timeline (`ModuleTimeline.tsx`), from a Figma wireframe — not a formal review-gated round, no pre-written scope plan (same format as Rounds 3.1/4.1/5.1/6.1.1/6.2.1). Cover-art photography in the wireframe was explicitly ignored per direct instruction; every card still uses `moduleArt()`'s gradient wash.

### Real 11-module curriculum, new Option-B-only dataset
- `PATHWAY_MODULES` (`pathway.ts`) now sources from a new `data/trainingPathwayV2.ts` (`PATHWAY_MODULES_V2`, a fresh 11-entry array — id/title/description/estimatedMinutes/status/progress/cover colours, no `slides` field) instead of `data/portal.ts`'s shared `modules.slice(0, 6)`. `/training` (Option A) is untouched — it still reads the shared 8-item `modules` array directly, so it was never at risk of the module count changing under it.
- **Re-keyed:** the one module with a real content player (Round 7) moved from the Round-1-era id `sleep-basics` to `understanding-sleep`, matching its real curriculum position ("Understanding Sleep," module 5 of 11). `data/moduleContent.ts`'s `MODULE_CONTENT` key and `pathway.ts`'s `MODULE_PLAYER_ID` were re-keyed together; the content payload itself (chapters, cases, knowledge checks, outro — all verbatim Module 4 content) was not touched. Two dependent player files needed a small, precise follow-up fix once the id changed (not just the two files named in the brief): `ModulePlayerPage.tsx`'s module lookup moved from `getModule()` (`data/portal.ts`, which has no `understanding-sleep` entry) to `PATHWAY_MODULES_V2.find()`; `ModuleCompleteScreen.tsx`'s `module` prop type was relaxed from the full `data/portal.ts` `TrainingModule` to a minimal `{ title: string }` shape (the only field it reads); `VideoPlaceholder.tsx`'s fallback-cover-colour lookup was repointed the same way (it silently fell back to a neutral wash otherwise, a real bug, not just a stale comment).
- **Retired `MODULE_ICON`** (`pathway.ts`'s old per-module thematic icon map, keyed to the old 6-module ids) entirely — both the timeline and the hero's compact stepper (since removed, see below) now show plain module numbers instead of topic glyphs, which reads better across an ordered 11-item curriculum than distinct icons per topic.

### `module-timeline` card — rebuilt again (numbered-marker landscape card)
- **Marker:** same 48px chassis/3-state colour language as §25's original (`completed` = filled `bg-primary` + white number; `current` = white fill + `border-primary` + primary-coloured number; `upcoming` = muted `bg-divider-soft` + muted number + lock badge) — now showing the module's plain sequence number instead of a thematic icon.
- **New `ModuleBadge`:** a small, dense black "MODULE {n}" pill (20px height, 12px white text, `bg-black`, `radius-pill`) — a new component, distinct from this app's usual uppercase-eyebrow "Module N" text convention (§25/§4.1's `module-card`).
- **Card chassis divergence, declared:** `radius-md` (11px), not this app's documented card `radius-lg` (18px, §4) — bound explicitly by the Figma reference for this one new card pattern only; `shadow-card` still applies, same values as everywhere else.
- Content order: black pill badge → title (17px semibold) → description (14px) → "Approx. {n} min" (14px, faint) → a "Module progress" label/percent row with the existing 6px `Progress` track (reused, not rebuilt) → the status CTA. Cover art on the right (image-right, not image-left as §25's card had it), same `moduleArt()` gradient technique, stacking below `sm` for the same fixed-width-image overflow reason §25 documented.
- **Dropped:** `slideComposition()`/`consumerParallelTitle()` lines — the new dataset has no `slides` field to derive either from, and the Figma reference doesn't show them. Both functions were removed from `pathway.ts` entirely (dead code, not left unused) along with the `ModulePreviewModal` lines that rendered them.
- **Forced-linear lock, no per-module exception:** §25/§26's `timelineRowState()` previously special-cased the one player-wired module (`sleep-basics`) to always read as reachable, overriding the forced-linear lock so it stayed demoable. Per explicit direct instruction, this exception was removed — `timelineRowState()` now always returns the real `moduleState(index)` with no override, for every module including `understanding-sleep`. Combined with the demo status spread below, this means the Round-7 player is genuinely locked by default (see decision note below) — a deliberate, flagged behavior change from §25/§26, not an oversight.

### Demo status spread (`data/trainingPathwayV2.ts`)
- Module 1 (Portal Orientation) `completed`; modules 2–11 `not-started`. `moduleState()`'s existing forced-linear rule (first incomplete = `current`, everything after = `upcoming`/locked) computes module 2 (Population Understanding) as the one reachable "current" module, and modules 3–11 as locked — all dynamically derived from the dataset's own `status` field, not a hardcoded per-card visual state.
- **Flagged consequence:** module 5 ("Understanding Sleep," the one module with a real content player) is locked in this default demo state, not reachable from the timeline, until a coach progresses through modules 2–4 (or someone manually adjusts demo status/`localStorage`). The player itself is unaffected and fully functional at its route — confirmed live by navigating directly to `/training-v2/module/understanding-sleep/play` — only the timeline's CTA gating changed.

### Hero simplified — horizontal stepper removed
- The Figma reference (node 1:840) has no compact/horizontal duplicate of the pathway progress shown in the vertical timeline below — just heading → subhead → CTA → a plain "Current progress: {n}/{total} modules complete" text line → straight into the timeline. §25's `CertificationPathway`/`SimplePathwayProgress`/`StepIcon` (the horizontal marker+connector stepper this hero briefly grew, including a mid-task numbered-marker reskin to match the new card style) were all removed entirely once this was flagged, along with `pathway.ts`'s `PATHWAY_STEPS`/`PathwayStep` export that only that stepper consumed (confirmed via grep before deleting, since `pathway.ts` is shared with the timeline). The hero's `max-w-[1200px] 2xl:max-w-[1600px]` one-off wide column (added solely to give the 7/11-step stepper room to breathe) reverted to this app's normal `max-w-[1200px]` shell width now that nothing needs the extra room.
- The "X/6" hero copy bug (present in the Figma source itself, contradicting its own 11 visible module cards) is fixed by deriving the count from `PATHWAY_MODULES.length` everywhere, never hardcoded — already true of §25's original heading, carried forward unchanged.

No new colour tokens this update — the black pill badge uses literal `bg-black`/`text-white` (an intentional one-off per the Figma reference, not a new semantic token), and everything else draws on existing `primary`/`success`/`ink-*`/`divider-soft`/`radius-md`/`radius-pill` tokens.

---

## §28. Component specs (Round 7.1 — Coach Training Portal Option B, Module Overview page)

A direct chat-edit batch (no pre-written scope plan, same format as Rounds 3.1/4.1/5.1/6.1.1/6.2.1/6.3's own follow-up edits) building the screen a coach lands on after clicking a module card's CTA — the first generic per-module "hub" template in this app, and the retirement of the old preview-modal pattern.

### `module-overview` (new template, `ModuleOverviewPage.tsx`, Figma node 1:1433)
- Full-bleed hero: `moduleArt()`'s gradient wash + a `bg-black/70` overlay (same technique as every other module cover, no fabricated photography), with a "Back to my learnings" link, a `bg-pearl`/`text-ink` "Module {n}" badge (`w-fit`, not stretched), `display-md` white title, `body` white/90 description, and a `fine` white/80 "Estimated Time" line.
- **Padding lives on the centered content box inside the hero, not the full-bleed background wrapper** — this is what keeps the hero's title and the outline section's "Module outline:" heading sharing one left edge (`x=184` at desktop, verified live) at every breakpoint. This was a real bug earlier in the round's own build (padding on the outer wrapper double-stacked with the box's own centering margin) and stays fixed.
- Below the hero: a two-column layout at `lg`+ (row list left, outcomes card right, `376px` fixed width), stacking outcomes-below-outline at `<lg`. A module with no populated outline content (`MODULE_OVERVIEW_CONTENT` has no entry for it) still renders the real hero, with a plain "Module breakdown coming soon." message in place of the outline/outcomes layout — the template degrades gracefully rather than erroring.

### `MetaLine` (new, `ModuleOverviewPage.tsx`, per-row meta text)
- Renders a row's meta parts (e.g. "Module introduction", "Completed", "~1 min") joined by "·" separators, wrapping via `flex flex-wrap`.
- **Separator-gluing rule, corrected this round:** each "·" is glued to the *end* of the part before it, not the start of the part after — so a narrow-width wrap can only ever strand a trailing "·" at the end of a line (reads as a naturally continuing sentence), never a leading orphaned "·" opening the next line (reads as a stray bullet point). Found on the one 3-part row in the app ("Module introduction · Completed · ~1 min") at 375px; 2-part rows were never affected. Design-critique fix, verified at 375px and 1440px.

### `module-timeline` card — CTA hover state (fix, `ModuleTimeline.tsx`)
- The rebuilt landscape card's module-CTA button and the Certificate card's "Download certificate" button (both `bg-primary text-white` fills) were missing `hover:bg-primary-hover`, present on every other primary-fill button in this app (including this same round's own `ModuleOverviewPage.tsx` row CTAs). Design-critique fix — both now carry `hover:bg-primary-hover`, restoring the app-wide convention documented at `button-primary` above ("no hover-documented state beyond subtle darken" — this is that darken, expressed as the existing token everywhere else already uses it).

### Player Exit → overview (mechanism, `ModulePlayerPage.tsx`)
- The player route now reads an optional `?from={overviewModuleId}` query param, set by `ModuleOverviewPage.tsx`'s own "Start"/"Resume"/"Restart"/"Continue" CTAs when navigating into the player. "Exit" reads it back and returns to that specific overview page (falling back to the player's own `:moduleId` if opened via a direct URL with no `from`), rather than always landing on the home timeline. Necessary because `realPlayerContentId()`'s demo redirect means more than one overview page can point at the same underlying player route (e.g. both module 2's and module 5's overview pages link into `understanding-sleep`'s player) — a plain "go home" fallback would have lost which specific overview page the coach came from.

Design critique (initial pass) found and fixed the `MetaLine` and CTA-hover issues above; accessibility review (initial pass, same day) found and fixed a focus-management gap (arriving at the overview page left focus on `<body>` with no announced context — fixed with a focus-managed `<h1>` keyed on `moduleId`). No new colour/type/radius tokens this round.

---

## §29. Component specs (Round 7.1.2 — Coach Training Portal Option B, module player rebuild)

A direct chat-edit batch against the already-signed-off Round 7 module player (`ModulePlayerPage.tsx`), no pre-written scope plan (same format as Rounds 3.1/4.1/5.1/6.1.1/6.2.1/6.3/7.1). Two connected pieces of work: first, replacing the player's horizontal single-screen-swap navigation with a vertical scroll-stack and the chapter-only progress bar with a whole-module one; then, once that landed, a second pass rebuilding the slide template itself (no more Card wrapper, one shared layout, a global Continue control) plus a content-correctness fix. Design critique and accessibility review (both run live against the actual built UI, not spec-only) each found and fixed one real defect — see their own sections below.

### `module-player` vertical scroll-stack navigation (replaces the horizontal `AnimatePresence` swap)
- Previously: `ModulePlayerPage.tsx` rendered exactly one `PlayerStep` at a time, cross-fading/sliding horizontally (`x: 16 → 0`, exit `x: -16`) via `AnimatePresence mode="wait"` on Continue.
- Now: every visited step (`steps.slice(0, stepIndex + 1)`) stays mounted and stacks vertically in document order; "Continue" appends the next step below the current one and the page auto-scrolls down to it, rather than swapping the view in place. Each step keeps its own component identity (stable `key={i}`) across re-renders, so a screen's local state (e.g. a Learn video's watched/unwatched state, a knowledge-check's typed answer) is preserved once scrolled past, not reset.
- **Single-slide-per-viewport, then real scroll-snap on top of it:** each stacked step wrapper carries `min-h-full` (relative to `<main>`'s own fixed height — see the layout model below), so a short slide still reserves a full screen's worth of scroll room and two different slides are never visible together. Per direct follow-up, manual scrolling was then hardened further with real CSS `scroll-snap-type: y mandatory` / `scroll-snap-align: start` on `<main>` and each slide, so a coach can never rest mid-scroll between two slides — release the scroll gesture anywhere and it settles fully on one slide or the next. A slide with more content than one screen (e.g. a Learn video + its full body text) still scrolls internally past that point, which is expected and explicitly confirmed acceptable — the guarantee is "always a full slide, never a partial one," not "every slide is exactly one screen."
- Motion changed from horizontal (`x`) to vertical (`y: 16 → 0`) fade-up on mount, matching the new vertical navigation direction; no `exit` animation is needed since steps are no longer removed from the DOM.
- **Programmatic scroll is manual, not `scrollIntoView` — a real bug caught in this round's own design critique.** `scrollIntoView()` walks up the ancestor chain and can nudge *any* scrollable ancestor, including one with `overflow: hidden` (hidden only disables user-driven scroll/scrollbars, not JS-driven `scrollTop`) — against this round's `h-screen` shell (below), it was gradually shifting the whole flex column and pushing the header off-screen after repeated navigation. Fixed by computing the exact delta between the target slide and `<main>` via `getBoundingClientRect()` and calling `mainRef.current.scrollTo({ top, behavior: 'smooth' })` directly — this only ever touches `<main>`'s own scroll position, never an ancestor. Verified clean across 7+ rapid navigations post-fix.

### Player shell layout model — fixed-height flex column, not measured sticky offsets
- **Superseded within this same round:** the scroll-stack's first pass measured the app header's and nav bar's heights live via `ResizeObserver` (to compute a `scrollMarginTop`/`min-height` offset for `position: sticky` chrome) — needed because the header wraps to two lines on narrow viewports. Once manual scroll-snap navigation made an internal scroll container the right fit anyway, this was replaced with something simpler: `ModulePlayerPage.tsx`'s root is now `flex h-screen flex-col overflow-hidden`, with the app header, `ModulePlayerHeader`, and `ModulePlayerFooter` as ordinary fixed-size flex children and `<main>` (`flex-1 overflow-y-auto`) absorbing exactly whatever space is left. None of the three chrome pieces need `position: sticky`/`fixed` or any measured-height math any more — flexbox correctly reserves their space regardless of how tall the header grows, and only `<main>` ever scrolls.
- This is also what fixed the scroll-leak bug above without any extra guard: since the outer shell no longer relies on scroll position for its own layout (its height is exactly `100vh`, full stop), there was nothing left for a stray ancestor-scroll to visibly break — but the manual `scrollTo` fix stands as the correct fix regardless of this layout, since `overflow: hidden` alone was never a real guarantee.

### `module-player-header` (new, `ModulePlayerHeader.tsx` — supersedes `module-player-progress-bar`, §26, and the separate un-stuck "Exit" `<div>` that used to sit above it)
- Combines what were two independent, non-sticky pieces (an Exit-button bar, and a chapter-only progress bar) into one component, always on screen per the layout model above. Directly requested after the scroll-stack change made the old non-sticky chrome scroll away with the very first slide — a coach several slides deep had no way to see their position or exit without scrolling back to the top.
- **Whole-module progress, not chapter-only:** wraps the new generic `SegmentedProgressBar` (below) with this app's own module shape — one segment per chapter (weighted `STEPS_PER_CHAPTER` = 8 against the intro/outro caps' weight of 1, so each segment's on-screen width matches how much of the module it actually represents), plus a text label above it ("Chapter 2 of 3" / "Module intro" / "Module outro" / "Module complete") derived from the same persisted `stepIndex`. Chosen over the alternative (a flat "Step 12 of 19" bar stacked above the existing chapter dots) specifically because the combined bar needs to be permanently-visible chrome — stacking two separate indicators would cost that vertical space twice for no extra signal, since one segmented bar already encodes both "which chapter" (segment position) and "how far into it" (segment fill) at once.
- Accessible name follows the same binding pattern as §23/§26: an `aria-live="polite"` `sr-only` paragraph carries the same location label the visible heading shows, so a screen-reader user is told "Chapter 2 of 3" (etc.) as it changes, without needing to inspect the visual bar.

### `module-player-footer` (new, `ModulePlayerFooter.tsx`) — one global Continue control
- Per direct instruction, every slide's own hand-rolled "Continue" button (each with its own gating logic and styling) is gone, replaced by one control the player renders exactly once. A slide reports its own readiness — `{ canContinue, label? }` — via an `onReadyChange` callback that `ModulePlayerPage.tsx` wires into *only* the current (bottom-most, active) slide; already-completed slides still mounted above it get `undefined` and can't touch the footer. `label` lets a slide override the default "Continue" text ("Start chapter 2", "Complete module", "Back to your modules") without the footer needing to know why.
- **Governs outer step advancement only.** A slide's own *local* sub-navigation — knowledge-check's "Next question" (moving between 5 questions that are all one single step), a case's "What would you do?" reveal — stays an ordinary in-slide button, deliberately separate from this global control.
- Centered, `max-w-[480px]` wide (a same-day direct follow-up — the first pass was left-aligned at content width). A normal flex child at the bottom of the player shell (see the layout model above), not `position: fixed`/`sticky`.

### `segmented-progress-bar` (new, generic UI primitive — `src/components/ui/segmented-progress-bar.tsx`)
- A domain-agnostic "stories-style" progress bar: an ordered list of segments, each independently `'completed'` / `'current'` / `'locked'`, each independently weighted (flex-grow) so segments representing more underlying steps render wider than ones representing fewer. Built specifically so it can be lifted out of this codebase wholesale — it has no knowledge of "modules" or "chapters," only of `segments`, and its only external dependency is the `cn` classname helper (any `clsx`/`tailwind-merge` wrapper is a drop-in substitute). Full usage docs (props table, extraction notes, a copy-pasteable example) live as a doc-comment at the top of the file itself, not only here, since a design-tokens doc doesn't travel with the file if it's copied into another project.
- Exactly 3 Tailwind classes carry its visual language, matching this app's existing 3-state convention: `bg-success` (completed), `bg-primary` (current segment's fill), `bg-divider-soft` (empty track / locked segment). No new colour tokens.
- A `'current'` segment with no explicit `progressPercent` defaults to fully lit (100%), not empty — the right default for a single-step marker (this app's intro/outro caps) where there's no internal sub-progress to speak of; a `'current'` segment representing a multi-step chapter passes its own computed `progressPercent` and fills proportionally instead.
- Purely presentational (no internal state, no timers): the caller supplies `segments` and `aria-label`; individual segments are `aria-hidden` (decorative), matching the pattern above where the accessible announcement is owned by the composing component, not the bar itself.

### `slide-layout` (new canonical template — `SlideLayout.tsx`) — mandatory going forward
- Every one of the 9 screen components previously hand-rolled its own copy of the same `mx-auto max-w-[...] px-6 py-10` wrapper plus an eyebrow/`<h1>`/body block, each with small inconsistencies, and wrapped its actual content in a `Card` (a white box with a ring/shadow). Per direct instruction, that's gone: **a slide's content sits directly on the page canvas — never in an additional bounding box purely to contain it.** `SlideLayout` is the one shared shell now; every future slide should start from it, not a fresh hand-rolled `<div>`.
- Two variants, not a free-form prop bag: `standard` (top-aligned, `max-w-[720px]`, every content slide) and `centered` (vertically centered, `max-w-[560px]`, only the 3 short transitional "punctuation" beats — chapter marker/complete, module complete). `TransitionScreen.tsx`, the old shared Card-based layout for those 3 beats, is deleted outright, folded into this variant.
- Does not render a Continue button — that's `module-player-footer`'s job now, not each slide's own.
- **Focus management + heading structure (accessibility-review fix):** with every visited slide mounted at once, rendering all of them as `<h1>` left a screen reader's heading list full of equally-ranked "page titles," and advancing to a new slide (or a new knowledge-check question) gave keyboard/screen-reader users no signal at all — the control that triggered the change unmounted or changed shape, and focus silently fell back to `<body>`. Fixed with one mechanism that covers both: `SlideLayout` takes an `isCurrent` prop (each screen derives it as `Boolean(onReadyChange)`, since that's already only truthy for the active slide) that renders `<h1>` for the current slide and `<h2>` for already-completed ones, and moves focus (`tabIndex={-1}`, `.focus()`) to its own heading whenever `title` changes — which fires correctly both when a brand-new `SlideLayout` mounts for a new outer step, and when one long-lived instance's `title` changes internally (knowledge-check's 5 questions). Verified live for both trigger types.

### Content-correctness fix — video slides no longer show production-brief text as if it were the lesson
- §26's original `video-placeholder` showed the source doc's own video-coverage text beneath the thumbnail, reasoning that a coach should still get the real lesson content even with no video asset. On inspection this was wrong for the Learn videos specifically: the source doc is explicit that this text ("Covers: ...") is *"a placeholder describing what the video would need to cover — not a full script"* — a production brief for whoever eventually shoots the video, written in third person, never meant to be read verbatim by a coach as the lesson itself.
- `VideoPlaceholder.tsx` no longer renders any text at all — it's a pure video shell (thumbnail, duration badge, play/watched control). Each video-format slide's genuinely learner-appropriate framing moved to `SlideLayout`'s own `body`, sourced per case rather than uniformly: the module intro's `body` is the video's real spoken lines (a genuine transcript, appropriate to show); a Learn slide's `body` is a plain, non-source-derived line ("Watch this before continuing."); a video-format case example's `body` is the same clean `vignette` field a written-format case already used — not the source doc's `dramatizedScene` text, which (like `covers`) is a staging/production note that also duplicated the separate `rationale` field's pedagogical point. `covers`/`dramatizedScene` stay in `data/moduleContent.ts` with doc comments explaining they're production references, not deleted — a future video producer still needs them, they're just never rendered.
- Net effect: the two case-example formats (video vs. written) now render from the exact same shape — eyebrow, scenario title, plain vignette as body, then either the video placeholder or the reveal-on-tap interaction — rather than the video format showing a longer, differently-worded block.

No new colour/type/radius tokens this round — everything draws on existing `primary`/`success`/`divider-soft`/`ink-*`/`hairline` tokens.

### Design critique (run live against the built UI)
Found and fixed 1 real defect: the `scrollIntoView`-through-`overflow:hidden` scroll-leak bug documented above (caught mid-review, fixed, then re-verified clean across a deliberate rapid-navigation stress test). Also flagged, not fixed: a multi-row "What to expect" list's last item can be cut off at the fixed footer's edge with no scroll-affordance hint that more content follows — logged for a future pass, not blocking. Confirmed working well: the video template's consistency across intro/Learn/case slides now that all three share one shape, and promoting the knowledge-check question itself to the slide's `<h1>` (previously a smaller line inside a card).

### Accessibility review (run live against the built UI)
Found and fixed 2 real defects, both documented above under `slide-layout`'s own section: no focus management when advancing between slides (`2.4.3`), and an unbounded multiple-`<h1>` structure from keeping every visited slide mounted (`2.4.6`/`1.3.1`). Both verified fixed live — focus lands on the new heading for both an outer step transition and an internal knowledge-check question change; exactly one `<h1>` exists at any time regardless of how many slides are stacked above it.

### Shared chapter-progress math (`playerSteps.ts`) — de-duplicated, not reimplemented
- `chapterProgress(stepIndex, chapterIndex)` extracts the exact `completed`/`current`/`locked` + progress-percent formula that `ModuleOverviewPage.tsx`'s outline rows already computed inline (`stepIndex > end ? 'completed' : stepIndex >= start ? 'current' : 'locked'`, percent via `(stepIndex - start) / (end - start)`) — both surfaces now call the one function, so a coach never sees two different percentages for the same chapter on the overview page versus the player header.
- `edgeStepProgress(stepIndex, markerIndex)` is the equivalent 3-state check for a single-step marker (module intro at step 0, module outro at `outroStepIndex(chapterCount)`) rather than an 8-step chapter span — used only by the player header; `ModuleOverviewPage.tsx`'s own bespoke intro/outro lines were left as-is (not worth the churn of a second refactor in a file this round didn't otherwise need to touch).
- Removed as dead code once its only consumer (`ModulePlayerProgressBar.tsx`) was deleted: `CHAPTER_SUBSTEP_LABELS` and `chapterSubstepPosition()` (the old 6-dot-row sub-step labelling, no longer shown anywhere now that the whole-module segmented bar replaced it).

---

## §30. Pending-invite pattern (Round 9 — Research Dashboard direct-onboarding trainee management)

New `InviteStatus` axis (`'pending' | 'active'`) on a coach trainee, separate from the pre-existing `CoachStatus` (study-lifecycle status). A trainee added via the new "Add coach trainee" wizard starts `pending` until they accept their platform invite.

**`InviteStatusChip`** (`components/research/StatusChip.tsx`) — the one place `state-warning` (amber) appears. `pending` → `border-amber-200 bg-amber-50 text-amber-800`; `active` → the existing quiet `neutral` tone (no new token needed for that half). Contrast measured 6.88:1 (computed from the real OKLCH theme values, not the older sRGB hex approximation this doc used pre-Tailwind-v4) — clears AAA, not just AA.

**`PendingInviteBanner`** (`pages/research/CoachProfilePage.tsx`) — `bg-amber-100 text-amber-900 border-amber-200`, a `TriangleAlert` icon, pinned above the page's hero via a new `topBanner` prop added to `ResearchShell.tsx` that is a byte-for-byte reuse of `ConsumerShell.tsx`'s existing `topBanner` slot (`ConsumerShell` already had this for its own "session today"/opted-out banners — `ResearchShell` didn't, until this round). Amber rather than that portal's `destructive` red, since a pending invite is an informational/pending state, not a destructive one. Contrast measured 8.17:1.

**Why amber earns an exception to §1's "stay quiet" rule:** reusing `neutral` for "Pending" would have made the whole point of the new Status column moot — the column exists specifically to draw a researcher's eye to trainees who haven't accepted yet, scanning a roster of otherwise-identical rows. Scoped exactly as narrowly as the Round 6.1.1 real-brand-logo exception (3 widget tiles, no others) — this doesn't reopen the palette generally.

**Cascading gated-profile behavior**, all keyed on `coach.inviteStatus === 'pending'`:
- Hero's `CoachStatusChip` (the *other* status axis) is suppressed — showing "Active" (lifecycle) directly under a "Pending" (invite) banner read as a direct contradiction in design critique; the banner already owns this communication, so the hero chip is redundant-to-contradictory while pending.
- Personal details: "Reassign cohort" and "Edit details" are omitted from the DOM entirely (not `disabled`) — a deliberate departure from this app's other established "not yet available" pattern (`aria-disabled` + focusable + `sr-only` explanation, e.g. the pre-Round-9 "Go to Coach Delivery Portal" button). Judged acceptable here specifically because the banner, which precedes this content in reading order, already supplies the "why" — unlike that older button's case, where no equivalent page-level explanation existed. "Withdraw coach" stays, relabeled "Withdraw invite" with adjusted `ConfirmDialog` copy, same underlying action.
- Training Review / Trainee Tracking tabs both short-circuit to a shared `NoDetailsAvailable` empty state instead of their normal content — there's nothing to review or track before a trainee has even accepted their invite.

### Design critique + accessibility review
Both run directly by the orchestrating session (two subagent delegation attempts each stalled — traced to the `Claude_Preview` MCP server disconnecting mid-session, an infrastructure issue, not a finding). Design critique found and fixed 1 real issue (the hero-chip contradiction above); accessibility review found 0 defects, with 2 items weighed as judgment calls and resolved as consistent with existing patterns rather than new gaps (`role="status"` on a load-time-present banner, matching `ConsumerShell`'s own identical treatment; the omit-vs-`aria-disabled` divergence, judged context-dependent-appropriate rather than an inconsistency worth unifying). See `design/reviews/round-9-portal-cleanup-and-trainee-management-{design-critique,accessibility}-report.md`.

---

## §31. Stage-naming simplification + home-timeline milestone cards (Round 9.1 — Research Dashboard + Coach Training Portal)

A direct chat-edit batch spanning two connected areas, no pre-written scope plan (same format as §30 and the rounds before it).

**Batch A — Research Dashboard "Current Stage" renaming:** `StudyPhase` gained an optional `stageCode` (`'C'|'O'|'A'|'CP'|'H'`) and a `shortLabel`, replacing the old `phaseLabel()` (always "Phase N — Official Name") with `stageLabel()`/`stageShortName()` — phases with a `stageCode` render as `Stage X — Word`; the 3 phases without one (Recruitment, Enrolment, Entry into SPACES delivery) keep the legacy `Phase N — Name` format, since they aren't COACH stages per CLAUDE.md's own table. `CoachProfilePage`'s Stage pipeline (`PhasePipeline` → renamed `StagePipeline`) now derives its visible rows via `STUDY_PHASES.filter((p) => p.stageCode)` rather than a hardcoded number range — showing only the 5 lettered stages, never Phases 1/2/8. Coach Profile tabs reordered/renamed: Learning Progress (was Training Review) → Stage Management (was Trainee Tracking) → Personal details, in that priority order, with Learning Progress now the default tab. Trainee Management's roster trimmed to coaches still `currentPhase < 8` (a business rule — graduated coaches are tracked instead under Coaches/SPACES delivery — not a hardcoded row cap), pinned order Priya Raman → Marcus Webb → Lauren Mitchell → the rest. `InviteStatusChip`/`CoachStatusChip`'s "Active" tone corrected from `neutral` (grey) to `success` (green) — the existing `state-success` token, just applied to a state that was previously left out of it.

**Batch B — Coach Training Portal Option B home timeline:** a new "Baseline Reflection" milestone card (locked, static — the real reflective-conversation flow isn't built yet) inserted between the last module and the Certificate, per the COACH framework's own baseline-timepoint placement (CLAUDE.md: after Content learning, before Guided group practice). Both this new card and the existing Certificate card were rebuilt onto `TimelineModuleCard`'s landscape chassis (previously both portrait) so all three card kinds — numbered module, Certificate, Baseline Reflection — read as one system; each gets its own pill badge via a new shared `Badge` component (`icon`/`label`/`tone`), generalizing the original one-off "MODULE N" pill. `badge-purple` (§1) is this round's one new colour token, used only by Baseline Reflection's badge. Separately: the rail marker resized 48px → 40px with its number set in exact `body-strong` typography (was an ad hoc `text-body font-semibold` combination); the marker-to-card gap now matches the scroll column's own left padding at every breakpoint (`gap-6/8/10` mirroring `px-6/8/10`), rather than a flat 16px that read as lopsided against a 24–40px inset; the "Go to Coach Delivery Portal" button repositioned top-right above the hero title for tablet/mobile only (via unprefixed `order`/`self-end`, reverting to `lg:self-start` for desktop's original top-left placement, unchanged); the "Your learning journey" `<h2>` restored at `lg`+ (had been `lg:hidden` since the original two-column redesign).

### Design critique + accessibility review
Both run directly by the orchestrating session. Design critique found 0 defects (2 minor notes: a cosmetic card-height difference between Baseline Reflection and its progress-bar-bearing neighbours, correct given the genuine content difference; `AppHeader`'s pre-existing 375px text-wrap, confirmed out of scope/untouched this round). Accessibility review found 0 defects (1 judgment call: the button's CSS-`order` reposition now spans all breakpoints instead of just desktop — resolved as extending an already-accepted Round 7.1 pattern, not a new gap). Computed contrast: `badge-purple` 7.1:1 (AAA); `state-success` re-verified against its new "Active" use, 5.19:1 white / 4.98:1 pearl (AA, unchanged token). See `design/reviews/round-9.1-trainee-stage-naming-and-training-timeline-cards-{design-critique,accessibility}-report.md`.

---

## §32. "My Schedule" home page + Session Recordings table redesign (Round 10 — Research Dashboard)

A direct chat-edit batch spanning two connected areas, no pre-written scope plan (same format as §30/§31 and the rounds before them).

**Batch A — "My Schedule" (`ResearchHomePage.tsx`, `/research/schedule`, new first sidebar item):** reuses the Coach Delivery Portal home page's layout — widget grid + upcoming-sessions panel + a full-width table below — scoped to the researcher's own upcoming Zoom sessions instead of a coach's consumer caseload. Two structural generalizations made this reuse possible without a third copy-pasted variant: **`UpcomingSessionsPanel`** was extracted from `DeliveryHomePage.tsx` into `src/components/shared/UpcomingSessionsPanel.tsx` (generic `{key, title, subtitle?, date, time, meetingId, zoomLink}[]` rows, `subtitle` now optional) once a third caller needed it, with `DeliveryHomePage.tsx`/`DeliveryConsumerDetailPage.tsx` updated to build rows and pass them in rather than owning the display logic; **`WidgetGrid`** gained an optional `tiles` prop (`DEFAULT_TILES` now exported) so a caller can render a subset — My Schedule passes every default tile except Coach Training Portal, since researchers have no destination there.

**Cohort-vs-individual session modelling**, the core new data shape: Stage O (Guided group practice) is scheduled per cohort, not per trainee — a new `CohortUpcomingSession`/`upcomingGroupSessions` (research.ts) models one Zoom meeting shared by every trainee in a cohort at that phase, rendered as a single table row listing every attendee's name stacked (`flex-col`, one `<span>` each), not one duplicated row per trainee. Stage A/H placements and certified-coach supervision check-ins stay individual (`Coach.upcomingSession?: TraineeUpcomingSession`, one meeting per person). `buildScheduleRows()` merges both shapes into one row-per-real-meeting list shared by the table and the panel, so the two surfaces never disagree about what "a session" is. The panel further compresses a multi-attendee row's title via `formatAttendeeNames()` — "A, B" for 1–2 names, "A, B +N" for 3 or more — since the panel is a compact card list, unlike the table which always lists every name in full. A `sessionType` per row (Group Practice / Placement Assessment / Coach Supervision, via `sessionTypeLabel(phase)`) is a plain-text column, not a chip — an earlier chip-per-row treatment was tried and reverted after direct feedback that it read as noise in a dense table. `Cohort` renders `—` for certified coaches (`currentPhase === 8`) rather than the literal cohort value, since cohort membership is a COACH-pathway training concept that stops applying once a coach is certified.

**`ScheduleTable` only shows scheduled sessions**, not a roster — a deliberate departure from `ConsumersTable`'s "every consumer, scheduled or not" convention. Once certified coaches (mostly with no supervision booked yet) joined the same table, listing every eligible coach/trainee as "Not yet scheduled" would have drowned out the sessions that actually matter; the page is framed as "your schedule," not a directory. **"Copy Link"** (ghost-style button, `Copy`/`Check` lucide icons) sits after the Session Link column — copies the Zoom URL to the clipboard for the researcher to share through whatever channel fits, since there's no settled specification yet for who besides the researcher/coach/trainee can join a session. Hardened against a real failure mode: `navigator.clipboard.writeText()` can reject (denied permission, insecure context, restrictive iframe policy) — falls back to a legacy `execCommand('copy')` path, and if that also fails, surfaces a genuine "Copy failed" button state plus an `aria-live="polite"` announcement, rather than a button that does nothing on an unlucky browser.

**Batch B — Session Recordings table redesign (`CoachProfilePage.tsx`, tab name unchanged):** the Round 2.2 tile grid (`recording-card`, §11 — 2-column cards, no CTA, no way to add a recording) is replaced with a real table (Session name / Date / Time / View recording), gated behind the same pending-invite `NoDetailsAvailable` guard as before. `SessionRecording` (research.ts) gained a `time: "HH:MM"` field (sibling types `TraineeUpcomingSession`/`CohortUpcomingSession`/`SupervisionNote` already had one; this type never did) — `sessionRecordingsFor()`'s three phase branches now stamp a plausible fixed time per generated record. **"View recording"** is a real, focusable `aria-disabled` button with an `sr-only "(not yet available)"` suffix, matching `UpcomingSessionsPanel`'s existing "Schedule a session" convention — a deliberate supersession of §11's original "no fake CTA" rule now that recordings have a real destination concept (a Zoom recording link), even though the link itself isn't wired up yet. **"Upload recording"** reuses `ConsentRepository`'s (§16) exact accessible pattern — a real `<label>` wrapping an `sr-only` `<input type="file" multiple>` — backed by new `manualRecordings: Record<string, SessionRecording[]>` context state and an `addManualRecording(coachId, recording)` action, since `sessionRecordingsFor()` is a pure derived function with no write path of its own; a selected file's name becomes the recording's title, dated/timed to now. **Export** reuses `downloadCsv` verbatim.

**New empty-state pattern — the first icon-based one in this app.** Every other empty state (§11's own recording-card included) is a line of text inside a bordered `Card`, which read as sparse/unfinished once this table's toolbar (title, Upload, Export) sat above a near-empty card. The fix: a large `bg-primary/10` circular badge (reusing the existing active-nav-link tint, not a new accent) around a `Video` icon (`size-8 text-primary`, `aria-hidden`), centered, with one line of muted text below ("No recordings yet.") — no explanation of why or how. After a direct follow-up, this now sits *inside* the same card the populated table uses (header + content in one `Card`, matching `ConsumersTable`/`ScheduleTable`'s own chassis) rather than the flat, card-less treatment first shipped — full consistency with the rest of the app's data-table pattern won out over a bespoke "empty states aren't cards" rule.

### Design critique + accessibility review
Both run directly by the orchestrating session. Design critique found and fixed 2 real issues: multi-attendee table rows used table-default `vertical-align: middle` (fixed to `align-top` across every cell); the My Schedule hero subtitle undersold its own scope after certified-coach supervision joined the table (reworded). Accessibility review found and fixed 2 real issues: "Copy Link"/"View recording" were both 32px, short of this app's 36px control-height convention (raised to `h-9`, the same gap class Round 3.1 fixed once already); "Copy Link" had no error handling around a fallible browser API, a genuine silent-failure risk in real (if not this session's own) browser conditions — fixed with the `execCommand` fallback + "Copy failed" state described above. See `design/reviews/round-10-my-schedule-and-session-recordings-{design-critique,accessibility}-report.md`.

---

## §33. Coaches area redesign (Round 11 — Research Dashboard)

A long direct chat-edit batch, no pre-written scope plan (same format as §30/§31/§32 and the rounds before them), spanning the whole Coaches (SPACES delivery oversight) area.

**Coach Management table + `OnboardCoachDialog`:** "Invite new coach" renamed "Onboard new coach." The invite flow (`OnboardCoachDialog.tsx`) changed from a typed-email match against the certified-not-yet-invited pool (§13's original `coach-invite-dialog`) to a `<select>` dropdown of the same pool, with a 2-step select-then-confirm-summary shape ("Onboard {name}?") ending in a bottom-center toast — deliberately a walkthrough, not a wired write path, confirmed with the user. Table columns changed from Coach/Invitation/Joined/Partner org/Consumers to Coach Name/Coach ID/Coach Email/Consumer Caseload — a plainer, more scannable set per direct feedback that the old columns repeated information already visible elsewhere.

**`SpacesCoachProfilePage.tsx` — 5 tabs, renamed and reordered:** **Overview** (a basic identity card — Name/Email/Coach ID/Phone, no invitation/joined framing since that only ever applied during onboarding — plus a Consumer Caseload table with Assign consumer/View details actions) → **Assigned Consumers** (new: a global "Consumers" picker card, always visible regardless of which consumer is selected, carrying the Assign consumer + Transfer consumer actions; everything below it is the dynamic per-selection part) → **Shared Annotations** (renamed from "Annotation Vault," §13; generic subtitle, no coach/consumer name in the intro copy) → **Supervision Logs** (renamed from "Supervision Hub"; now uses `SupervisionRecords`'s `rightSlot` prop — §24's own pattern, originally built for the Delivery Portal's Session Logs tab — so a Scheduled Sessions card sits top-right and the full Supervision Records table moves to its own full-width row below) → **Profile details** (new: the complete Participation record + Contact details + "Withdraw coach," renamed from "Withdraw participant" per direct instruction).

**Consumer Details card — a genuine consolidation, not just a rename.** Replaces the old two-`PersonCard`s-plus-`ConsumerOverview` layout (§15/original) with one plain card: PLWD/Carer identity as Name/Email/Phone fields only, always shown with a "—" placeholder when a value is missing (previously the row was omitted entirely, which read as a layout bug rather than "no value") — age, relationship, and every narrative field (background × 2, sleep goals, caregiving context) fold into one shared, editable "Notes" section with a grey (`bg-pearl`) background instead of their own individual structured rows. **Data-model consequence, not just a UI one:** a new `coachNotes` field (+ `updateDyadCoachNotes` store action) was added specifically so this field's save path never touches `dyad.notes` — the pre-existing "Additional notes" field `ConsumerOverview` (§15, unchanged) shows verbatim on 3 *other* surfaces (Consumer Management, Coach Delivery Portal, Consumer Portal Account). Design critique caught this collision live, as a real reproduced duplication bug, before it shipped.

**New "Assign consumer" flow** replaces the old manual, hand-typed `AddConsumerDialog.tsx` (deleted — fully orphaned once its only caller was replaced). Same 2-step select-then-confirm-summary shape as `OnboardCoachDialog`, but a real write path: picks an already-enrolled-but-unassigned consumer (`coachId` absent — the same "enrol ahead of assignment" pool `enrollConsumer`/Consumer Management already produces) from a dropdown labelled "PLWD: X · Carer: Y" (or "Carer: Y (carer only)" for a carer-only consumer) so which role is which is never ambiguous inside a plain-text `<option>`, then commits via the existing, coachId-agnostic `transferDyad` action — no new assignment-specific store action was needed, since `transferDyad` already works identically whether a dyad previously had a coach or not.

**New shared `ConfirmDialog` primitive — `confirmDisabled`.** Both `OnboardCoachDialog` and the new `AssignConsumerDialog`/inline Transfer flow left their step-1 confirm button ("Continue"/"Onboard coach") fully enabled with an empty candidate pool, so clicking it did nothing — the same dead-button class Round 6.1.1 already flagged and fixed once ("Schedule a session"). Fixed once, generically, in `ConfirmDialog.tsx` itself via a new `confirmDisabled?: boolean` prop (renders `disabled` + a muted `bg-primary/40`/`cursor-not-allowed` style), rather than three separate per-flow guards — any future dropdown-then-confirm flow built on this chassis should reach for this prop by default.

**`ConfirmDialog` focus-restore race, also fixed in the shared component.** Any 2-step confirm flow built from two sibling `ConfirmDialog` instances (step 1 / step 2, swapping `open` in the same transition) could leave keyboard focus stranded on background content after "Go back" — a race between the closing instance's trigger-focus-restore effect and the reopening instance's own panel-focus effect, whichever ran second in that commit won. Fixed by deferring the close-side restore one animation frame and only firing it if nothing else has already claimed focus (`document.activeElement === document.body`) — this protects every current and future flow on this chassis, not just the three this round happened to introduce (Onboard/Assign/Transfer).

### Design critique + accessibility review
Both run as `general-purpose` subagents per `design/claude-code-action-plan.md` Phase 3/4. Design critique found and fixed 2 real issues: the `coachNotes`/`dyad.notes` field collision described above (🔴 high — reproduced live as a genuine cross-surface data-duplication bug); the empty-pool dead confirm button (🟡 moderate). Accessibility review found and fixed 2 real issues: the focus-restore race on "Go back" (🔴 critical — reproduced live via a real focus ring landing on background content); the merged Notes textarea had no accessible label (🟠 major — fixed with a real `<label htmlFor>`). All 4 fixes were re-verified live (computed DOM state, dispatched keyboard navigation, and a direct Consumer Management cross-check) after being applied, not just re-read. See `design/reviews/round-11-coaches-area-redesign-{design-critique,accessibility}-report.md`.

---

## §34. Consumer/Coach detail restructure + Sleep Diary spreadsheet grid (Round 12 — Consumer Management + Coach Management)

A large direct chat-edit batch, no pre-written scope plan (same format as §30–§33 and the rounds before them), spanning the Consumer Management table, the enrollment wizard, the Consumer Detail Page's full tab structure, and both the Fitbit Sync Monitor and Sleep Diary cards (reused across all 3 portals).

**Sidebar + Consumer Management table.** The Research Dashboard sidebar's "Coaches" leaf renamed "Coach Management" (matching the page it already linked to). `ConsumerManagementPage.tsx`'s table: "Consumer" → "Consumer Details" (stacked `PLWD:`/`Carer:` lines, same grammar the Coach Caseload table already used — a carer-only row now shows just its `Carer:` line, no "Carer only" chip); "Coach" → "Assigned Coach"; the old single "Current phase" column split into "Sessions Completed" (X of 7) and "Upcoming Session" (Session N or —), the latter also added to `SpacesCoachProfilePage.tsx`'s own Consumer Caseload table right after Sessions Completed, so both tables mirror the same fields for the same dyad.

**`EnrollConsumerDialog.tsx` — single form → multi-step wizard.** Rebuilt on the exact chassis `AddCoachTraineeModal.tsx`/`AddAnnotationSummaryModal.tsx` already established: Consumer type (Dyad/Carer-only, decides whether the PLWD step exists at all) → PLWD details → Carer details (now carries Email/Phone — fields `PersonProfile` already had, previously surfaced nowhere on the researcher side) → Sleep & caregiving (now carries an optional Additional notes field) → Consent (a real drag-and-drop dropzone, `<label>`-wrapped focusable file input, PDF/DOC/DOCX only, a `role="alert"` rejection message for other file types) → Review. Per direct feedback that the dialog felt cramped, its chassis grew from `max-w-[720px]`/`max-h-[85vh]` to `w-full max-w-[920px]`/`h-[85vh] max-h-[820px]`, and the progress rail's markers grew `size-7`→`size-9` with wider spacing (`gap-3`→`gap-4`, `pb-5`→`pb-8`, sidebar column `220px`→`280px`) — applied identically to `AddCoachTraineeModal.tsx`. Per further feedback that the rail's per-step labels read as both repetitive (identical text shown twice — once in the rail, once as the step heading) and too vague ("Consumer type" didn't say what decision was being made), each step now carries two separate strings: a short 2–3 word `navLabel` for the rail ("Consumer type," "PLWD details") and a fuller instructional `heading`/`subtitle` pair shown beside the fields ("Choose dyad or carer only" / "Select how this consumer is enrolling in the study.") — applied to both wizards. The rail's `aria-live="polite"` "Step N of M: {label}" text, previously shown as visible (and therefore duplicate) text under the current step, is now `sr-only` in both wizards — the announcement still fires for screen readers, sighted users just don't see it twice. `AddAnnotationSummaryModal.tsx` received only the sizing/rail-spacing treatment, deliberately not the label-split or `sr-only` conversion — its 6 step labels are fixed SIPTEA framework component names, not vague copy needing clarification.

**`ConsumerDetailPage.tsx` — 4 tabs → 6.** Old: Consumer Details / Module Engagement / Health Data Hub / Coach Matching. New: **Overview** (reuses `SpacesCoachProfilePage.tsx`'s `ConsumerDetailsCard`, now exported, plus a read-only Session tracker moved here from the old Coach Matching tab with its subtitle made generic — no coach name, since a consumer can be viewed before a coach is even assigned) → **Assigned Coach** (Coach Matching, renamed, trimmed to just the coach-detail card now that the tracker and recordings moved elsewhere) → **Learning Progress** (renamed from Module Engagement, same component) → **Sleep & Health Data** (renamed from Health Data Hub) → **Session Recordings** (new — see below) → **Profile details** (new: full editable PLWD/Carer identity — Name/Age/Relationship/Email/Phone/Background — in two columns, plus "Consent records," renamed from "Consent repository" per direct correction). The hero collapsed from one `text-display-md` line ("Bruce Whitfield & Joan Whitfield") to two stacked lines inside one `<h1>` at `text-title` ("PLWD: Bruce Whitfield" / "Carer: Joan Whitfield," `gap-1.5` between them), and the old session-phase subtitle line beneath it was removed entirely per direct instruction. The page-level dismissible Fitbit-sync-gap banner (above the tab row) now only renders while the Sleep & Health Data tab is active, rather than on every tab.

**New shared `DyadSessionRecordingsCard.tsx`.** Mirrors the Trainee Management Session Recordings tab's real-table pattern (§32) — Session name/Date/Time/View recording columns, an Upload control, CSV Export, an icon-based empty state — but scoped to one consumer dyad's own `sessionRecordings` array (`SpacesSessionRecording` gained an optional `time` field; a new `addDyadSessionRecording` store action appends manually-uploaded rows). Used directly by the Consumer Detail Page's new Session Recordings tab, and reused by an identically-positioned new tab on `SpacesCoachProfilePage.tsx` (placed before Profile details, per direct instruction) behind that page's own consumer picker — the same dyad reads byte-identical from both the consumer's own page and their coach's.

**Fitbit Sync Monitor → "Fitbit sleep data," + a Comparative tab.** Renamed per direct instruction. Gained a new, default-selected "Comparative" tab (shown first, before PLWD/Carer, only when the dyad has a patient) — a paired-row table (`ComparativeFitbitTable`) where each date spans 2 rows via a merged `rowSpan` Date cell (PLWD then Carer), with alternating-date-group `bg-pearl` shading, same 7 columns as the individual per-person tables. Chosen over cramming two people's values into one cell (breaks down for a status chip + a formatted duration) or doubling the column count (breaks down at 13 columns for 2 people × 6 metrics). A new `showComparative` prop (default `true`) turns this off specifically for the Consumer Portal's own controlled usage, whose local `member` state type (`'patient' | 'carer'`) has no way to represent a third 'comparative' value. A new CSV "Export" button was added to the card header, exporting whichever view is currently active, at all 3 reuse sites. A `showAlerts` prop (already existing, added in the same session for a different fix) was turned off at the Research Dashboard's own tab and the Consumer Portal's Health & Sleep page — both already show the same signal via their own page-level "sync gap" banner elsewhere — but stays on (default) at the Coach Delivery Portal, which has no such banner.

**Sleep Diary — card grid, then a true spreadsheet grid.** First redesigned from a click-to-expand accordion into a scannable 2-column card grid (title renamed "Sleep Diary Feed" → "Sleep Diary Notes," subtitle simplified), styled after journaling apps like Day One and Grid Diary — informed by a live web-search pass, not just internal convention. Then, per direct feedback that a card grid can't scale to a real month of entries, rebuilt again into a genuine spreadsheet: Member (PLWD/Carer) is a frozen `position: sticky; left: 0` first column (both the `<th scope="col">` header cell and each row's `<th scope="row">`), dates run left-to-right across the header row inside a horizontally-scrolling (`overflow-x-auto`) container. **New tokens, §1: `diary-green`/`diary-yellow`** — the PLWD row washed `bg-green-50` with actual notes rendered as a darker `bg-green-100`/`ring-green-200` "note card" (drop-shadow via `shadow-card`); the Carer row identically in yellow. This is the one exception in this file's semantic-tone list that was *explicitly requested*, not proposed: offered two neutral gray tints first (per the standing "quiet, no rival accents" rule), the user asked for real pastel green/yellow with a lighter row wash and a darker note-card hue instead, confirmed directly before implementing. A single "Download CSV" button (replacing two separate per-person buttons) exports the full grid, matching what's on screen.

### Design critique + accessibility review
Both run as `general-purpose` subagents per `design/claude-code-action-plan.md` Phase 3/4. Design critique found and fixed 2 real issues: the new default-selected Comparative tab computed zero sync-gap alerts regardless of `showAlerts`, since the per-member check only ever read a single patient/carer log — silently dropping the Coach Delivery Portal's only sync-gap warning, the one call site that depends on it (🟡 moderate, fixed by aggregating both members' gaps in the comparative branch); all 10 seeded `sessionRecordings` entries across 5 dyads were missing the new `time` field, so the Time column this round introduced always rendered "—" (🟢 minor, backfilled realistic times). One judgment call flagged, not fixed: the Consumer Detail Page hero's new `text-title` size now diverges from the sibling Coach Profile hero's `text-display-md` — a future-round decision, not a build defect. Accessibility review found and fixed 2 real issues: the Fitbit "Dyad member" tablist's arrow-key handler updated `aria-selected` but never moved DOM focus, so repeated `ArrowRight` presses got stuck oscillating and could never reach a third tab (🟠 major, fixed with a ref array + `.focus()` call, plus previously-unhandled `Home`/`End` support); the new two-line stacked hero `<h1>` computed a run-on accessible name with no separator between lines (`"...WhitfieldCarer:..."`) (🟠 major, fixed with an explicit spaced `aria-label` + `aria-hidden` on the visual spans). Computed contrast on the new tokens: `text-ink` on `green-100`/`yellow-100` (note cards) 15.31:1/15.68:1; `text-ink-faint` on `green-50`/`yellow-50` (row wash, which paints through unset-background cells) 4.85:1/4.90:1 — both pass AA, the second pairing with less headroom. One pre-existing, out-of-scope bug was found and flagged rather than fixed here: the Consumer Portal's own `MemberToggle` (Round 5/5.1, untouched this round) has the identical focus-not-following-selection gap. All 4 fixes were re-verified live after being applied. See `design/reviews/round-12-consumer-coach-detail-restructure-{design-critique,accessibility}-report.md`.

---

## §35. My Reflections rebuild (structured `ReflectionFields`, single-reflection cap) + `card-header-divider` mandatory card-title/content divider + sentence-case titles (Round 13 — cross-portal)

**My Reflections tab rebuild (Coach Delivery Portal).** `DeliveryConsumerDetailPage.tsx`'s two stacked "Add an annotation summary"/"Your annotation summaries" cards replaced with a single `ReflectionCard` carrying 3 states — locked ("Reflections unlock after your first session"), ready ("Add your reflection"), complete ("Your reflection") — none of which name the consumer or the SIPTEA framework in their locked/ready copy (the page header above already names who this is; "SIPTEA" is internal jargon a coach doesn't need surfaced). The complete state moved the date/time + a real `Chip` (Shared/Not shared, reused tokens) below the title, and renders each SIPTEA component answer as its own non-editable `dt`/`dd` field via a new shared `ReflectionFields` component (`AddAnnotationSummaryModal.tsx`) instead of one flattened paragraph — the same component also renders the wizard's own review screen, so that screen is now a true WYSIWYG preview of what gets saved, not a separately-formatted approximation. The data model changed accordingly: `AnnotationSummaryEntry.summary: string` → `components: ReflectionComponentAnswer[]` (`{label, answer}[]`), and `submitPostPracticeAnnotation` now replaces rather than prepends — a coach can only ever have **one** reflection per consumer, enforced in `research-store.tsx`, not just by hiding the "Add reflection" CTA once one exists. The same `ReflectionFields`/`Chip` treatment was applied to the Research Dashboard's `AnnotationVault` ("Shared Annotations") view of the same data, which also gained a real empty-state fix: it previously always said "Session 1 hasn't happened yet" even when session 1 *was* done and the coach simply hadn't written a reflection — now distinguishes "not yet reached" from "no reflection yet."

## §35a. `card-header-divider` — mandatory card-title/content divider + sentence-case titles (Round 13 — cross-portal)

A new mandatory structural rule for every card built on the shared `<Card>` primitive (`@/components/ui/card`) that carries its own `<h2>`/`<h3 className="font-display text-title">` heading — this file's first genuinely cross-portal structural rule (§1–§34 are mostly per-component specs; this one governs *every* card app-wide going forward, not just the ones touched this round).

**The rule.** Any card with a title (with or without a body/subtitle `<p>` under it) gets exactly one `border-t border-hairline` divider between its header block and its content section (a `<table>`, a `<dl>`, a `<form>`, or a list), with `p-6 pt-4` spacing on the content side. The **one exception**: a card whose entire body is prose message(s) plus at most one action button, with no distinct table/`dl`/form/list section below — e.g. "Certification outcome" (`CoachProfilePage.tsx`), "You've opted out" (`ConsumerAccountPage.tsx`), "Learning dashboard" (`ConsumerHomePage.tsx`), and the Coach Delivery Portal's Reflections tab locked/ready empty state (§35 above) — those stay divider-free. A card can be conditionally in-or-out of the rule depending on which of its own states is showing: `PasswordChangeCard`'s idle/sent states are message+one-button (no divider); its "open" state renders a real form (divider present only then).

**Structure:**
```
<Card ...>
  <div className="p-6">                                {/* or "flex flex-wrap items-center justify-between gap-4 p-6" if there's a top-right action button/link — the divider goes below the WHOLE row, button included, e.g. Consumer caseload + "Assign consumer" */}
    <h2 className="font-display text-title">{Title, sentence case}</h2>
    <p className="mt-1 text-caption text-ink-faint">{body — optional}</p>
  </div>
  <div className="border-t border-hairline ...">        {/* attach to whatever the content wrapper already is (overflow-x-auto div, etc.) — never an empty spacer div */}
    {table / dl / form / list}
  </div>
</Card>
```
For table cards, `border-t` goes on the table's outer wrapper, not the `<thead><tr>` itself — that row keeps only its own `border-b` (a different concern: separating the header-row text from the body rows, not the title from the content).

**Sentence-case titles — a separate, broader rule.** Every card's own `<h2>`/`<h3>` title is sentence case (capitalize only the first letter, proper nouns/acronyms — PLWD, SPACES, Fitbit, Zoom — keep their own casing), regardless of whether that card qualifies for the divider above. This does **not** extend to table `<th>` column headers, tab-strip labels, or page-level `<h1>` heroes — only a card's own title.

**How it was executed.** A user-annotated screenshot specified the divider placement and spacing; the rule was first scoped to title+body cards only, then explicitly widened by direct follow-up to cover title-only cards too (e.g. `Coach details`, `Participation record`, `Contact details`, the `PLWD`/`Carer` profile cards, `ConsumerDetailsCard`) once the first pass was underway. Applied via a 5-agent Workflow per pass (one agent per portal with non-overlapping file ownership — shared components like `ConsumerDetailsCard`/`FitbitSyncMonitor`/`NotificationPreferencesCard` assigned to whichever portal's files physically define them, so no two agents touch the same file — plus a cross-portal check agent that re-reads every touched file and fixes small issues directly, plus an independent watchdog auditor that re-derives compliance from the written spec and does its own live visual spot-checks). Round 1 (title+body) found 15/0/8 changes across Research/Delivery/Consumer with the check agent finding 1 non-code issue (no Node/npm in this sandbox to run a type-check — substituted with a full manual re-read) and the watchdog finding 3 real deviations, all folded into round 2's brief. Round 2 (widened to title-only) found 1/1/3 changes plus the round-1 leftovers, watchdog finding 1 more high-severity miss (two Account pages' `ProfileDetailsCard`, not in either round's file lists since neither agent's brief named them) plus 1 low-confidence judgment call (`PasswordChangeCard`'s conditional divider), both resolved directly by the orchestrating session rather than a third workflow round.

### Design critique + accessibility review
Both run directly by the orchestrating session (live browser verification, not a static read) — see `design/reviews/round-13-reflections-rebuild-and-card-divider-sweep-{design-critique,accessibility}-report.md` for the full reports, covering both the My Reflections rebuild (§35) and the divider/sentence-case sweep (§35a). Design critique found and fixed 3 issues carried over from the divider sweep's own watchdog passes: the two missed `ProfileDetailsCard` instances (🔴 high), `PasswordChangeCard`'s divider made conditional (🟢 minor), and the reflection-gating bug described below (🟡 moderate, actually fixed during the build itself, re-verified in this pass). Accessibility review found and fixed 1 real defect that neither the design critique nor the automated workflow's own checks caught, because it only manifests by completing a real interaction end to end: submitting a reflection unmounted the "Add reflection" trigger button the instant the card flipped to its complete state, so the modal's own trigger-focus-return `.focus()`'d a detached DOM node and silently dropped focus to `<body>` (🔴 critical) — fixed with a `headingRef`/`useEffect` pair moving focus onto the card's own new heading, the same pattern this file's `PasswordChangeCard` already uses for its own state transitions.

## §36. Session Plan redesign — guided wizard, `session-next-indigo`, manual module unlock, Session 0-6 renumbering, shared `WizardProgressRail` (Round 14.1 — Research Dashboard + Coach Delivery Portal, cross-portal)

Direct coach feedback on Round 14's `session-tracker` (§13) build, given across several iterations in one session: the first-time "Plan sessions" flow (raw inline inputs) was confusing and unguided mid-Zoom-call; a rebuilt version using per-row pencil-icon inline editing was explicitly rejected ("keep it simple... I do not want a similar style interface with pen icons"); a second rebuilt version using a colored "Next session" hero card was also explicitly rejected ("UI does not follow design theme... get rid of it... I would prefer a table format with all CTAs under their respective columns"); and the coach identified a genuine domain-model error carried over from Round 14 — Session 1 was named/treated as "Onboarding" (implying it happens first, with no module prerequisite), when the real SPACES model is that the coach's first meeting (now **Session 0**, "Planning") is where module completion target dates and the post-module catch-up sessions get agreed, and the always-unlocked "onboarding module" content is a separate, unrelated thing a consumer can start anytime.

**Session 0-6 display renumbering.** `SPACES_SESSIONS` (`data/spaces.ts`) keeps its internal 1-7 numbering unchanged — every existing seed record (`sessionCompletion`, `sessionRecordings`, `sessionPlans`, annotations) stays keyed 1-7, avoiding a data migration across every seeded dyad. A new `displaySessionNumber(n) = n - 1` is the single conversion point; every UI surface now shows "Session 0" through "Session 6" via this function, never the raw internal number. Session 1's `name` changed from `'Onboarding'` to `'Planning'`. `moduleTargetDate`'s pairing shifted to match: it now lives on internal session numbers 2-7 (displayed Session 1-6, i.e. `SessionPlanRow`'s own session number, matching which module that catch-up reviews) rather than 1-6, so a module's target date sits on the row that actually reviews that module. This convention had to be propagated to **six other pre-existing surfaces** beyond the Session Plan card itself — the Coach Management Overview tab's caseload table, the Consumer Management roster, the Coach Delivery Portal Home's consumer table, the Consumer Portal's day-of banner/upcoming-card/7-session roadmap, and the Learning Progress tab's locked-module copy — all still reading the raw internal number until the round's own design critique caught the mismatch live (the same booked session read as two different numbers depending which screen was open) and fixed all six.

**No hero card — a real `<table>`.** `SessionTracker` (`SpacesCoachProfilePage.tsx`) is now a single `<table>` (columns: Session — containing the §13 dot/connector timeline marker plus the heading, kept deliberately rather than dropped, per direct request to preserve "the vertical timeline" — Date & time, Module, Zoom, and an unlabeled Mark-complete/kebab action column). The "next" row (`nextPlannedSession()`, an existing helper that had sat unused since Round 14) gets `bg-indigo-50` row tint + `Chip tone="next"` instead of a separate box — see `session-next-indigo`, §1. Completed rows collapse to one line; a "Reviews {module}: {locked+Unlock module | CompletionChip}" line appears per row for sessions 1-6.

**Manual module unlock — new capability, not a wire-up.** No override mechanism existed anywhere in the codebase before this round (confirmed by grep). New `manualModuleUnlocks: Record<dyadId, number[]>` store state + `unlockModuleManually()` action (`research-store.tsx`), read by `moduleUnlockState()`'s new optional third parameter. Lets a coach grant a module early — e.g. the unlocking session already happened but hasn't been logged yet — via a plain-text "Unlock module" action + `ConfirmDialog`, correctly display-numbered. Read by `ModuleEngagementTab` too, so a manual unlock made from the Session Plan card is reflected there automatically.

**`plan-sessions-wizard`** (`PlanSessionsModal.tsx`, new) — a 3-step modal on the `AddCoachTraineeModal`/`EnrollConsumerDialog` chassis (own backdrop/focus-trap, `max-w-[920px]`/`h-[85vh]`). Step 1 (Session 0 date/time + a static "Session 0 · Planning → Session 1 · Module 1 → …" sequence strip), Step 2 (cadence + a live 2-line date preview), Step 3 (review) — the last converted from bordered-card blocks to a compact `<table>` specifically so all 7 rows fit without an internal scrollbar, per direct instruction ("this section should not be scrollable"). Reused for both first-time planning (`mode="create"`) and the populated card's new "Edit plan" button (`mode="edit"`, opens straight to the pre-filled review table; a confirm-gated "Back to cadence" regenerate protects against silently discarding real edits). `bulkSetSessionPlan` gained a `rescheduled`-diffing fix so an edit round-trip sets the same indicator a single-row change already did, and preserves every row's `zoomLink`/`meetingId` unchanged (re-verified via real DOM `href` comparison, not just visual read).

**New shared `wizard-progress-rail`** (`src/components/shared/WizardProgressRail.tsx`) — extracted from 4 previously-separately-duplicated copies of the identical dot/connector rail (this wizard, `AddCoachTraineeModal`, `EnrollConsumerDialog`, `AddAnnotationSummaryModal`), specifically to add a mobile-only horizontal layout (markers in a row with connecting lines, labels `hidden` below `md` since the step's own heading in the content pane already says what's active) per direct instruction to apply "on every pop-up modal screen where we are using this template." Desktop rendering is byte-identical to the four prior copies (verified no regression across all 4 wizards). Parameterised for the two small pre-existing divergences: `currentTone` (`indigo` for this wizard only, `primary` elsewhere) and `liveTextVisible` (`AddAnnotationSummaryModal`'s one visible-copy convention, `sr-only` everywhere else).

**Design critique** (fresh pass against this final iteration — a first pass against the now-superseded hero-card iteration is preserved as historical record, `round-14.1-session-plan-redesign-design-critique-report.md`) found and fixed the six-surface renumbering gap above (🔴 high) live, not by static read; flagged two lower-severity, not-fixed items (two surfaces still reading a legacy single-session field that could drift from the live plan after a real edit; six stale "Onboarding" seed strings predating both this round and Round 14's own rename). **Accessibility review** found and fixed 3 real issues: "Unlock module" dropped focus to `<body>` on confirm (🔴 critical — the row's trigger swaps to a status chip, the one action in this component that hadn't yet gotten the same `rowHeadingRefs` redirect fix every other transition already has); every "Mark complete" button shared an identical, undifferentiated accessible name across 5-6 rows (🟡 moderate, fixed with a `sr-only` "— Session N" suffix, matching the existing kebab-menu/Join-Zoom convention); "Unlock module" measured under the app's 36px control-height convention (🟢 minor). Computed contrast, verified live: `text-ink`/`text-ink-faint` on `bg-indigo-50` 15.05:1/4.54:1; white on `bg-indigo-600` (marker) 6.29:1; `text-indigo-700` on `bg-indigo-50` (chip) 7.07:1 — all AA, most AAA. Both review reports + index rows in `design/reviews/`.

## §37. Session Plan wizard reordered — cadence → module timing → first catch-up → review, plus `Loader2` build/save interstitials (Round 14.2 — Coach Delivery Portal / Research Dashboard, `PlanSessionsModal`)

Direct feedback on §36's freshly-built wizard, reopened the same week: the question order read backwards against how the real Session 0 conversation actually goes ("it should start from how often are you planning to meet"), and both committing to the review table and saving the finished plan felt instant, with no sense that the system was doing anything.

**Reordered questions.** `PlanSessionsModal.tsx`'s 3 question steps are now, in order: (1) "How often are you planning to meet?" (cadence — unchanged `CADENCE_OPTIONS`), (2) "When do you plan for each module to be done?" (new `MODULE_TIMING_OPTIONS`, `data/spaces.ts` — a fraction-of-the-gap preference, replacing a hardcoded 0.5 multiplier the coach previously had no input into at all), (3) "When do you plan to catch up first?" (Session 1's actual date/time). Previously step 1 asked for "Session 0's date" — but Session 0 *is* today's live planning session, not a separate thing to schedule, so that question is gone; `generatePlanRows()`'s signature changed from one shared start-anchor to explicit `session0Date`/`session1Date`/`session1Time`/`cadenceDays`/`moduleFraction` params, with Session 0 always defaulting to today and remaining editable only on the review table (matching how a coach actually fills this in — live, during the session itself, never scheduled ahead of time).

**Two new loading interstitials**, both deliberately fake timers (`generating`/`saving` state, `LOADING_MS` = 700ms — no real async work backs either one, purely to make "the system is building/saving this" legible instead of an instant, jarring screen swap): a `Loader2`-spinner "Building your session plan…" pane replaces the step content between the last question (step 3, "Build my plan") and the review table; the review table's own final button swaps to a spinner + "Creating your plan…" (`create` mode) / "Saving changes…" (`edit` mode) label, disabling Cancel/Back and the regenerate-confirm path for the same span before the plan actually commits via `bulkSetSessionPlan`. Escape and backdrop-click are now blocked for the duration of either loading state, so a coach can't dismiss the dialog mid-build or mid-save.

Scoped entirely to the wizard's own question flow and these two loading states — `SessionTracker`'s read-only rendering, `moduleTargetInvalid()`, and the stored `SessionPlanRow`/`SessionPlan` shapes are all unchanged. No new colour tokens (`Loader2` reuses `text-primary`/`animate-spin`, this app's first spinner use). Verified live end to end in both `create` mode (a fresh plan, Dorothy Kellerman/`dyad-012`) and `edit` mode (regenerate-confirm still fires correctly on a populated plan); `tsc -b`/`oxlint` clean (the one pre-existing, unrelated `ModuleOverviewPage.tsx` error untouched).

## §38. Fixed weekly cadence + day-of-week questions (domain-model correction), vertical review timeline, question-step breathing room (Round 14.3 — Coach Delivery Portal / Research Dashboard, `PlanSessionsModal`)

Direct feedback on §37's just-shipped reorder, same week: "as per project plan, they will need to meet every week" (cadence isn't a coach choice at all — the project plan fixes it) and "Step 2 - Module timing is too specific, and also, all the options are irrelevant. Consumers needs to do their module completion before they catchup with coach" — a genuine domain-model correction (the wizard's own generated dates had the module-target date landing AFTER its catch-up, the reverse of the real cycle: *module becomes available → consumer completes it → coach catches up on it → completing that catch-up unlocks the next module*). The corrected flow, given directly: "coach will ask when do you want your module to be available... we show days (mon, tue...) and coach can select that, next we ask based on module completion when should they catchup during what week (this is where coach can also select time), then show me complete journey in time line style."

**Cadence is no longer a question.** `CADENCE_OPTIONS` removed; a new `WEEKLY_CADENCE_DAYS = 7` constant is the fixed weekly rhythm every date cascades on. The wizard is now 2 questions, not 3.

**Module-timing question replaced with a day-of-week picker.** `MODULE_TIMING_OPTIONS` (§37's fraction-of-the-gap picker) removed entirely — "all the options are irrelevant" — replaced by a new `DAY_OF_WEEK_OPTIONS` (Monday…Sunday, `Date#getDay()` values) used by both new questions: (1) "When should each module become available?" (`moduleWeekday`), (2) "When should you catch up after each module?" (`catchupWeekday` + a time input, unchanged mechanic). `generatePlanRows()` rewritten around a new `nextWeekday(fromIso, weekday, strictlyAfter?)` helper (`data/spaces.ts`): Module 1's available date is the next occurrence of `moduleWeekday` on/after Session 0 (today); the first catch-up is the next occurrence of `catchupWeekday` *strictly after* the module's own date (never the same day — the consumer needs at least a day to finish it); every later module/catch-up pair repeats exactly 7 days after the previous one.

**`moduleTargetInvalid()` direction corrected — a real, pre-existing bug, not just a copy fix.** The function had required a module's target date to fall *after* its catch-up's own date ever since Round 14 first introduced it; the coach's correction confirms this was backwards the whole time — the consumer finishes the module *before* the coach catches up on it, never the reverse. Flipped to `targetDate >= sessionDate` (invalid), matching a new `dayBefore()` helper (`data/format.ts`, mirroring the existing `dayAfter()`) that caps the "Module available" input's `max` at the day before its own catch-up. The review step's field itself is relabeled "Module available" (was "Module target") to match the corrected semantics.

**Review step rebuilt as a vertical timeline**, per "show me complete journey in time line style" — a `<table>` (§37) replaced with an `<ol>` of marker-and-connector rows (dot + line, the same visual language `SessionTracker`'s own Session column already established, §36) with each session's editable Date/Time/Module-available fields laid out beneath its heading rather than in table cells.

**Spacing pass, same round** (flagged directly against a screenshot: "Visually it feels cramped all components too closely added. It needs to be properly spaced out" — the two question steps in particular read as a tight cluster of text sitting atop a large, awkward void). Fixed two ways rather than one: (1) increased the internal rhythm between the step counter/heading/subtitle/field group throughout (`mt-1`→`mt-2`/`mt-3`, `mt-4`→`mt-8`); (2) the two question steps' content now sits in a `flex flex-1 flex-col justify-center` wrapper so the whole block centers vertically in the available pane instead of anchoring to the top with dead space below — paired with restoring a decorative "Session 0 · Planning → Session 1 · Module 1 → …" sequence strip (originally part of §37's now-removed module-timing step) under the Module Availability question, so the pane reads as informative rather than empty. The review step (naturally taller, needs to stay scrollable) keeps its original top alignment.

No new colour/type/radius tokens. Verified live end to end in `create` mode (Dorothy Kellerman/`dyad-012`): both weekday questions, the live preview text, the full 7-row timeline's cascading math (module-available always landing before its own catch-up, every pair exactly 7 days after the previous), and a real save round-trip reflected correctly in `SessionTracker`. `tsc -b`/`oxlint` clean (the one pre-existing, unrelated `ModuleOverviewPage.tsx` error untouched); no separate design-critique/accessibility-review pass run this round either (same scope call as §37).

## §39. Calendar-style `WeekdayPicker`, week-wise review timeline, Session 0 removed from the wizard, centering reverted (Round 14.4 — Coach Delivery Portal / Research Dashboard, `PlanSessionsModal`)

Direct feedback against 2 annotated screenshots, reopening §38's day-of-week questions the same day they shipped: the review timeline still felt cramped ("Visually it feels cramped... refer the second screenshot" — this time circling the timeline's own week rows, not the question steps); the steps needed clearer, more explanatory copy speaking to the coach on the consumer's behalf; the weekday `<select>` dropdowns should be a "calendar format," not a dropdown; §38's centering fix should be reverted outright ("Do not centre align content"); the catch-up day picker needed a specific day-blocking rule; Session 0 shouldn't appear on the review screen at all; and the review screen itself needed a full redo into "a calendar view but in time line format."

**`WeekdayPicker`** (new, local to `PlanSessionsModal.tsx`) — a `role="radiogroup"` row of 7 `role="radio"` day tiles (`DAY_OF_WEEK_OPTIONS`, now carrying a `short` label for the tile face alongside the existing full `label`), replacing both weekday `<select>` dropdowns from §38. Disabled tiles get `aria-disabled` (not native `disabled`, keeping them in the tab order per this app's established "visible-but-inert" pattern, §21/§27) plus an `aria-label` stating the reason ("Monday, not available yet").

**Copy rewritten** to speak in terms of the consumer, not an abstract system setting: "What day should the consumer's next module become available?" / "Now let's plan when you will need to catch up," each with a plain-language subtitle explaining what the answer controls.

**Centering reverted.** §38's `flex flex-1 flex-col justify-center` wrapper is gone; both question steps are top-aligned again. This isn't a contradiction of the spacing fix two rounds prior — the day-tile picker plus richer copy now genuinely fill the pane, so the empty-void problem centering had tried to paper over doesn't recur.

**Catch-up day blocking** — a new `mondayFirstOrdinal(weekday)` helper (`data/spaces.ts`, Monday=1…Sunday=7) disables any catch-up weekday whose same-week position is on-or-before the module weekday's own position (module=Tuesday greys Monday+Tuesday; module=Friday greys Monday-Friday, leaving Saturday/Sunday open). Documented directly as a judgement call: the coach's own two examples don't reduce to one fully consistent rule (the Friday example described something that read as blocking into a second week too), so this is the simplest defensible reading, flagged in the handover for confirmation rather than either guessed at silently or blocked on a clarifying question.

**Session 0 removed from the wizard's review screen.** The timeline now maps only `SPACES_SESSIONS.filter(s => s.number >= 2)` — 6 weeks, not 7. Session 0 is unchanged everywhere else (`SessionTracker`'s own card, `bulkSetSessionPlan`, `sessionCompletion`) — this is a display-only change scoped to the wizard, per the coach's own framing: "planning is the day when coach and consumer get together and they plan for session 1... session planner should not have session 0."

**Review step rebuilt as a week-wise timeline**, per "show me complete journey in time line format. Module unlock day, Session day, and time properly labeled." Each week is one marker+connector row (same visual language as `SessionTracker`'s own Session column) containing two labelled cards side by side — "Module N unlocks" (weekday + date, read-only — now purely a function of the single `moduleWeekday` answer) and "Session N catch-up" (weekday + date, read-only, + an editable Time input — the one remaining per-week override). Per-row date editing from §38 was dropped entirely; every date is now derived from exactly 2 weekday answers, so editing a single row's date no longer fits the model — a coach who needs a genuine exception regenerates via "Back," or uses the pre-existing manual module-unlock action on the outer `SessionTracker` card.

**Dead code removed.** With per-row date editing gone, `moduleTargetInvalid()` (§38) had no remaining caller — deleted, along with its `dayBefore()` helper (`data/format.ts`) and the now-also-orphaned `dayAfter()` it had quietly stranded when §38 switched from one to the other.

No new colour/type/radius tokens. Verified live end to end in `create` mode (Dorothy Kellerman/`dyad-012`, module=Tuesday/catch-up=Friday): the day-tile picker's disabled state and accessible names, the corrected live preview text, the full week-wise timeline's cascading dates (Module 1 unlocks Tuesday 28 Jul; Session 1 catch-up Friday 31 Jul; every later week exactly 7 days on), a real save round-trip reflected in `SessionTracker`, and `edit` mode (re-seeds correctly, "Back" returns to the catch-up step with the right day disabled, "start over" regenerate-confirm still fires). `tsc -b`/`oxlint` clean (the one pre-existing, unrelated `ModuleOverviewPage.tsx` error untouched); no separate design-critique/accessibility-review pass run this round either — now 4 direct-edit rounds against this same component (§36→§39) without one, flagged explicitly in the handover as worth doing rather than a 5th silent iteration.

## §40. First design-critique + accessibility pass on the Plan Sessions wizard — shared-rail connector-line bug, rail-scroll fix, pearl footer, toggle-button day picker (Round 14.5 — Coach Delivery Portal / Research Dashboard, `PlanSessionsModal` + `WizardProgressRail`)

Direct request, against a live annotated screenshot: "do design critique, and accessibility check for this wizard... its not well designed, especially the left column. It scrolls with the content, is not well spaced out, the vertical line is missing between steps. The footer button needs a pearl background too much space padding below the buttons... the content... not properly placed creating a lot of blank empty space below." The first formal review pass against this wizard across its 4 prior direct-edit rounds (§36→§39) — run directly by the orchestrating session, computed rather than eyeballed throughout.

**Design critique, 4 fixes (2 high, 2 moderate).** (1) The rail scrolled with the content because both columns shared one `overflow-y-auto` container (`grid ... overflow-y-auto ... md:grid-cols-[240px_1fr]`) — moved the scroll behavior onto the content column alone; the rail column now stays fixed while content scrolls (verified via `scrollTop` manipulation + `getBoundingClientRect()` before/after). (2) The connector line between rail steps computed at **0px height** — a real bug in the **shared** `WizardProgressRail.tsx` (used by 3 other wizards too): `md:items-start` on each `<li>` overrides the flex row's default `align-items: stretch`, so the marker+connector column never stretches to match the label column, leaving the connector's `flex-1` nothing to grow into. Fixed at the shared-component level (`md:items-stretch`), re-verified live on `AddCoachTraineeModal` too — no regression, same latent bug fixed for free. (3) The footer had no visual separation and ~32px of dead space beneath the buttons (the modal's own `p-8` bottom padding, on top of the button row) — rebuilt as an edge-bled `bg-pearl` band (negative margins matching the panel's own padding, `rounded-b-lg`, tighter `py-4`) requiring the panel itself to gain `overflow-hidden` to clip it cleanly; re-verified the new `overflow-hidden` doesn't clip either button's own focus ring (16-32px clearance measured on all sides). (4) The day-picker's actual interactive control looked under-weighted relative to the blank space around it — wrapped in a bordered `p-6` card with a visible "Day of the week" label and grown tiles (64px→80px), without vertical-centering (explicitly rejected the prior round) or decorative filler.

**Accessibility review, 2 fixes (1 high, 1 moderate).** (1) `WeekdayPicker` used `role="radiogroup"`/`"radio"` with every tile independently `tabIndex=0` — a fake-radio anti-pattern: ARIA radios require roving tabindex + arrow-key navigation, which this never implemented, so the DOM announced a contract it didn't fulfil. Fixed by switching to a **single-select toggle-button group** (`role="group"`, `aria-pressed`, no roving-tabindex requirement) — a standard pattern for exactly this shape, keeping the existing `aria-disabled`-not-`disabled` "visible but inert" convention (§21/§27) for greyed-out days. (2) Disabled tiles measured **2.35:1** contrast, computed live (`opacity-60` stacked on `text-ink-faint`) — WCAG 1.4.3 technically exempts inactive components, but these tiles are deliberately kept focusable/described specifically so a user perceives them, undermining that exemption's rationale. Fixed by dropping the opacity multiplier; the same `text-ink-faint`/`bg-pearl` pairing at full opacity re-measures **4.86:1**, an already-calibrated AA-passing combination used elsewhere in the app.

No new colour/type/radius tokens — `bg-pearl` on the footer and `border-hairline`/`rounded-lg` on the answer card are existing tokens in a newly-applied spot. Both review reports + index rows in `design/reviews/` (`round-14.5-plan-sessions-wizard-*.md`). `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched).

## §41. Day-picker answer card: filled surface, no outline; both weekday questions now require an explicit choice (Round 14.6 — Coach Delivery Portal / Research Dashboard, `PlanSessionsModal`)

Direct feedback against a live screenshot of §40's bordered answer card: "I do not like the outline stroke style. Also, next button should only be activated after user selects on of the days."

**Answer card restyled.** The `border border-hairline` outline around each question step's day-picker card (§40) is gone; the card is now a filled `bg-pearl` surface with no border — a softer "surface," not an "outlined box," in keeping with this app's "quiet, no rival accents" visual language.

**Both weekday questions now start unanswered, not pre-selected.** `moduleWeekday`/`catchupWeekday` changed from defaulting to Monday/Friday to `number | null`, starting at `null`; `WeekdayPicker` renders with no tile selected until the coach actually clicks one. "Next" (step 1→2) is disabled while `moduleWeekday === null`; "Build my plan" (step 2→3) is disabled while `catchupWeekday === null`. The step-0 "For example, choosing…" caption and step-1's live preview line both now render conditionally, only once a real selection exists — previously they always rendered against a default value the coach may never have actively chosen. `edit` mode is unaffected: it always seeds both values from the dyad's real, already-saved plan, so they're never `null` there.

No new colour/type/radius tokens. Verified live: a fresh `create`-mode open shows all 7 tiles unselected on both question steps and both "Next"/"Build my plan" genuinely `disabled` (checked via the DOM's own `.disabled` property, not just visual muting); selecting a day enables the button and updates the caption/preview; a full save round-trip and `edit`-mode re-open (pre-filled from live data, both buttons enabled immediately since real values already exist) both re-verified. `tsc -b`/`oxlint` clean (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched).

**Design critique + accessibility review addenda run per `design/claude-code-action-plan.md`** (re-opening Round 14.5's own reports, since this round reopens that same reviewed scope): both pass. Design critique flagged one minor, not-fixed item — Step 3's own "Module N unlocks"/"Session N catch-up" mini-cards still use the bordered style Steps 1-2 just moved away from, left alone because the white "Session catch-up" card would lose its only visible boundary if stripped of its border without also gaining a fill, a worse regression than the inconsistency itself. Accessibility review found 0 failures (native `disabled` on "Next"/"Build my plan" is the correct pattern here, cleanly exempt from contrast requirements) and logged one non-blocking note — the answer card's `bg-pearl`-vs-`bg-card` boundary now measures 1.04:1, barely perceptible, acceptable since it's decorative grouping with no information conveyed only through the edge. Addenda in `design/reviews/round-14.5-plan-sessions-wizard-{design-critique,accessibility}-report.md`; 2 new rows in `design/reviews/reviews-index.md`.

---

## §42. Step-topic color system (`plan-module`/`plan-catchup`), weekend removal, editable review-step dates, `next`/`rescheduled` chips (Round 15 — Coach Delivery Portal / Research Dashboard, `PlanSessionsModal`)

Direct instruction, run through a 5-agent Workflow audit (color-system research, a heuristic design critique, and two end-user personas — a coach live on a Zoom call, and a researcher auditing a saved plan later — synthesized into one spec): "Current version is okay, but not great. It's dull, boring, lacks proper spacing, no visual difference... Maybe green is consumer and yellow is coach... I want an engaging, simple, and easy to use schedule planner."

**Color mapping — by step topic, not by person.** The audit found the literal "green=consumer / yellow=coach" framing doesn't fit: every field in this wizard is a jointly-agreed answer (Step 2's own subtitle says "what time works for you both"), and green/yellow already mean something else in this app (`diary-green`/`diary-yellow` = PLWD/Carer in the Sleep Diary, §34). Confirmed with the user before building: color now tracks *what a field is about*, not who answered it — green = every "Module availability" field (Step 1's day picker, Step 3's "Module N unlocks" card), a new warm accent = every "Session Catch-up" field (Step 2's day + time, Step 3's "Session N catch-up" card).

**Two new dedicated tokens, not a reuse of `success`/raw Tailwind amber.** `--color-plan-module: #4ade80` and `--color-plan-catchup: #facc15` — a direct follow-up request for "a more lively happy pastel green" and "not a dull organic green" after the first pass reused `success` (which meant "completed" app-wide, a mismatch the audit had already flagged) and raw `amber-*` (which collides with the Research Dashboard's "Pending" invite chip, §1). Both are paired with dark `text-ink`, never white — computed contrast: white-on-`plan-module` clears only ~3.3:1, white-on-`plan-catchup` only ~2:1, while `ink` clears 9.6:1+ on either. Card washes/borders use the same two base tokens via opacity modifiers (`bg-plan-module/15`, `border-plan-catchup/50`, etc.) rather than a hand-picked shade per surface, matching how `success`/`badge-purple` are already used elsewhere in this file — every grey caption text sitting on a wash was individually contrast-checked (4.6:1–4.9:1 range, all clear AA) before shipping, not assumed.

**`WeekdayPicker` gained a `tone: 'green' | 'amber'` prop** driving both its selected-tile fill and its blocked-tile wash, so Step 1 and Step 2's day pickers (previously visually identical — the coach persona's own "did I go backwards?" complaint) now read as two distinct step identities. Selected-tile `shadow-md` removed (elevation is reserved for cards per §5).

**Weekends removed from `DAY_OF_WEEK_OPTIONS`** — module unlocks and catch-ups only ever happen on working days, per direct instruction; now Mon-Fri (5 tiles), not Mon-Sun (7). Surfaced a real edge case: the existing catch-up day-blocking rule, when the module day is the week's *last* working day (Friday), would grey out every remaining option, leaving nothing pickable — fixed so blocking is skipped entirely once the module day is the last working day (every choice necessarily falls in the following week anyway, which `nextWeekday(..., strictlyAfter: true)` already handles correctly). A second edge case caught live during testing: going "Back" to change the module day after already picking a catch-up day could leave a now-invalid catch-up day silently selected underneath its own blocked mark — fixed with a `useEffect` that clears `catchupWeekday` when it becomes invalid.

**Step 3 (review) — the audit's single highest-impact finding.** Both per-week mini-cards were pixel-identical (`rounded-sm border-hairline bg-card p-3` for both "Module N unlocks" and "Session N catch-up") and reverted to bare native `<input type="date">`/`<input type="time">` after Steps 1-2 built a custom tile picker specifically because a plain control wasn't engaging — this is the most literal form of "no visual difference" in the whole wizard, and also closes a `rounded-sm`-vs-`rounded-lg` inconsistency logged as a known, deliberately-unresolved item since §41 (a filled surface — now available via the same two tokens — was the fix that note anticipated but didn't have). Both mini-cards now: use `rounded-lg` + the matching topic tint + `p-4` (was `p-3`, chip-density padding on a card holding a label+control) + a `gap-4` gutter (was `gap-3`); recolor their label to a readable dark tint (`text-green-700`/`text-amber-700`, contrast-checked at 4.7-4.8:1 on the new washes) while the date/time *value* itself bumps to `text-body font-semibold text-ink` — the answer, not its caption, is now the dominant element. **Both dates became directly editable** (previously only catch-up time was — a real UX gap the researcher persona and a direct question ("how do I change module and session dates?") both caught independently): `patchRowDate`/`patchRowModuleTargetDate` added alongside the existing `patchRowTime`; a module date landing on/after its own week's catch-up date is now blocked from saving (`rowDateInvalid()`, extending `rowsIncomplete`) with an `AlertTriangle`+`text-destructive` callout (not plain amber-700 text, which would now blend into the card's own amber wash). ~~The bare weekday caption under each date (e.g. "Monday") is now the full weekday+date (`weekdayLabel(iso), formatDate(iso)`) — closes a real bug this same change surfaced: `weekdayLabel()` looked day names up from the now-5-day `DAY_OF_WEEK_OPTIONS`, silently returning nothing for a freely-edited Saturday/Sunday date; fixed with a full 7-day `FULL_WEEKDAY_LABELS` lookup independent of the picker's own Mon-Fri list.~~ **Correction (Round 15 continued, 2026-08-10):** this paragraph was wrong — the final audit's code-read found zero references to `weekdayLabel`/`FULL_WEEKDAY_LABELS` anywhere in `src/`, and the shipped mini-cards never grew a weekday caption at all, just the plain "On:"/"At:" labels (themselves fixed in the same follow-up session — see the change log below). Left struck through rather than deleted so this file's own history stays honest about the mismatch, per the audit's own recommendation not to silently take either doc at face value. The next upcoming, not-yet-completed week now gets the app's existing `session-next-indigo` marker + `<Chip tone="next" label="Next" />` (mirroring `SessionTracker`'s own precedent, §36) instead of every week reading identically; the pre-existing `rescheduled` flag (already in `SessionPlanRow`, never rendered here) now surfaces via `<Chip tone="muted" label="Rescheduled" />`. The review step's own subtitle is now mode-aware — `edit` mode reads "This plan is already active..." rather than the `create`-mode "nothing is saved until you do" phrasing, which the researcher persona flagged as misleading when opened purely to audit an already-live plan.

No em dashes in any new/edited copy (house style, reconfirmed directly this round).

Verified live end to end: Step 1/2 tile selection + shadow-free fill, Step 2's day→time gating unaffected by the recolor, the Friday-blocks-everything edge case (confirmed all 5 days open once module day = Friday), the stale-catch-up-day auto-clear, every mini-card's contrast pairing (computed via canvas pixel compositing, not assumed), the invalid-date warning callout appearing/clearing correctly, a full `create`-mode save round-trip, and `edit`-mode re-open showing the mode-aware subtitle and correct `Next` chip placement. `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched).

---

## §43. Session Plan timeline rebuild — SUPERSEDED, see §44 (Round 16 — Research Dashboard / Coach Delivery Portal, `SessionTracker`)

**⚠️ Superseded the same round.** This timeline was reopened and explicitly rejected later in Round 16 ("I am really not liking this UI, its overwhelming, and too cluttered") and replaced with a table — see §44 below for what's actually live. Kept here, not deleted, as the historical record of what was tried.

Direct instruction, against a live screenshot of `SessionTracker` (the "Session plan" card, §13/§36's own `session-tracker`/`session-next-indigo` pattern): "simplify the session plan table... a very simple timeline style format... Similar to how we simplified the session planner UI, I want to replicate same experience here also," plus two standing complaints — the real module title shown per row ("I do not like modules especially module names") and the "Unlock module" control ("too small").

**Table → timeline.** The dense `<table>` (5 columns: Session/Date & time/Module/Zoom/Complete) is replaced with an `<ol>` vertical timeline — numbered/checked circular markers + connectors — reusing `PlanSessionsModal`'s own review-step timeline verbatim rather than inventing a second pattern (same marker sizing, same connector treatment, same `done ? 'bg-success/40' : 'bg-divider-soft'` conditional this file's own §36/§42 already established for `session-tracker`/the wizard). Each row now reads top-to-bottom instead of column-to-column: heading + chips, then date/time, then (only while not yet done) a module-status strip, with Join Zoom / Mark complete / kebab-menu actions moved into one inline action row beside the heading rather than their own table columns.

**Session 0 (Planning) removed from the timeline entirely** — direct instruction, since it has no module of its own and read as a mismatched entry beside 6 real module catch-ups. Consequence, caught before shipping rather than left as a silent regression: this table was previously the *only* place a coach could mark Session 0 complete, and doing so is what let `nextPlannedSession()` ever advance to Session 1 — remove the row with no other change and a freshly-planned dyad would show no "Next session" at all, forever. Fixed at the source instead: `PlanSessionsModal.handleSubmit` now marks Session 0 complete automatically the instant a plan is first created (`mode === 'create'` only, guarded on it not already being complete — safe, since no UI path lets Session 0 complete before a plan exists) — Session 0 **is** the planning meeting the wizard just walked through, so by the time it's submitted, that meeting has, by definition, already happened.

**Module status simplified.** `ModuleStatusLine` dropped "Reviews {the real module title}:" for a plain "Module {N}" reference — the real title still lives on the Learning Progress tab, which is where showing it is the point; here it read as clutter this operational card doesn't need. "Unlock module" is now a real, properly-sized `h-9` outline button (was a small inline text hyperlink) inside a bordered status strip, not floating text. The confirm dialog this button opens still names the real module title (`Unlock {title} for {dyad}?`) — a one-off, deliberate confirmation moment is exactly where naming the specific target is good UX, unlike the always-visible row.

**"Next" → "Next session"** (`Chip` label text only, this component's own usage — the shared `Chip` component and its other 2 call sites, `PlanSessionsModal`'s own review timeline and `ConsumerDetailPage`'s read-only mirror, are untouched).

Verified live end to end: a fresh `create`-mode plan for the standing unplanned demo case (Dorothy Kellerman) correctly shows Session 1 (not Session 0) as "Next session" immediately after saving, with focus landing on that row's own heading (the `onSaved` callback's `rowHeadingRefs` target moved from internal session 1 to session 2, since session 1 no longer renders a row); marking Session 1 complete correctly advances the "Next session" chip to Session 2 and unlocks Module 1; the "Unlock module" confirm flow and its focus-restore both still work; the same shared `SessionTracker` component renders and opens the wizard identically from both the Research Dashboard's Coach Management tab and the Coach Delivery Portal's own consumer-detail page. `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched). No new tokens — reuses `success`/`divider-soft`/the existing `next` chip tone and `session-next-indigo` marker treatment.

---

## §44. `SessionTracker` ("Session plan") rebuilt from a table through 2 rejected redesigns back to a table, indigo/purple swept to `primary`, new `destructive` chip tone (Round 16 continued — Research Dashboard / Coach Delivery Portal)

**Supersedes §43 above** — the timeline §43 documents was itself reopened and rejected later the same round; this section documents what's actually live.

Direct chat-edit session, no pre-written scope plan, with an unusually high rate of built-then-rejected iterations — documented in full below specifically so a future session doesn't re-attempt a design already tried and turned down.

**The churn, in order (for the record — none of the intermediate shapes are live):** (1) table → the vertical timeline §43 documents, per "I want a very simple timeline style format... replicate same experience" as the wizard. (2) Direct follow-up asked for the timeline's per-row content rebuilt as 3 side-by-side mini-cards (Module/Zoom→"Meeting"/Completion), styled like the wizard's own topic-tinted cards, after "I liked the card style approach from session planner" — this pass also ran a real `/design:ux-copy` + `/design:user-research` critique (see below) and fixed a genuine logic bug it surfaced. (3) Both the timeline AND the card grid were then explicitly rejected in the same session: "I am really not liking this UI, its overwhelming, and too cluttered. I want to revert back to a very simple table version," with a precise 6-column spec (Session Number / Date / Time / Module status / Session Link / Action button) — the table shape below is that spec, refined twice more by direct follow-up. **Lesson for next time:** when a component already reads as "done" (this one had 6+ prior signed-off rounds, §13/§36), a request to "simplify" or "make it feel like X" is worth confirming the target shape narrowly before building a full alternative layout — this session built two complete alternative UIs before landing back near the original.

**Real, kept fixes threaded through every version, including the final table** (not style — do not regress these when this component is next touched): **Session 0 (Planning) has no row of its own.** It has no module of its own and reads as a mismatched entry beside 6 real module catch-ups. Consequence caught and fixed, not left dangling: this table used to be the *only* place a coach could mark Session 0 complete, and doing so is what let `nextPlannedSession()` ever advance past it — `PlanSessionsModal.handleSubmit` now marks Session 0 complete automatically the instant a plan is first created (`mode === 'create'` only, guarded against double-firing) — Session 0 *is* the planning meeting the wizard just walked through, so submitting it means that meeting has already happened. **The Session Link column goes quiet once a session is done** (direct user question: "if session 1 is complete, then why still there is a join zoom session?") — each row's `zoomLink` is its own one-time meeting id, never a shared recurring link, so a completed row shows plain "Session held" text, not a dead/misleading "Join Zoom."

**The `/design:ux-copy` + `/design:user-research` critique** (run during the rejected card-grid version, but its finding survives into the final table): the 3-card version's own titles weren't parallel — "Module N" / "Zoom" / "Mark complete"→"Completed" — the third card's title *changed with state*, which is what actually produced "it says zoom, then what is complete?" confusion, not vague wording. The fix that generalizes: **a column/label's name should describe a fixed concept, never the current state of that concept** — the final table's "Module status" column separately holds a `Chip` label (state) under a constant header (concept), never conflating the two the way the rejected card title did.

**Final table shape.** Columns: Session number (chips: "Rescheduled" only — "Next" was tried and removed, see below) / Date & time (merged into one column, comma-separated: "22 Jul 2026, 10:00 AM" — was two separate columns) / Module status / Session link / Action, the last two header cells `text-center` (was `text-right` — direct correction: "column title not centre aligned to content") matching the Action column's own `justify-center` content. **Module status is a `Chip` label for all 3 states** (`Complete`/`Incomplete`/`Locked` — collapsed from `CompletionChip`'s finer not-started/in-progress distinction, which stays useful on Learning Progress but isn't the point here). **New `destructive` chip tone** (`border-destructive/20 bg-destructive/10 text-destructive`, StatusChip.tsx) — direct instruction that "Incomplete" needed "an error state," not just another neutral label; a third narrow exception to the "quiet chips" rule alongside `warning`/`next`. **"Unlock module" moved twice and ended up removed as a permanent button entirely**: first into the Module status cell as its own secondary/outline button directly under "Locked" (direct instruction, "make it secondary") — then reverted one message later ("I still don't like the unlock module CTA below the label, it makes the table look clunky... too many buttons") into the Action column's overflow (kebab) menu instead, alongside "Mark as incomplete." **Action column now shows at most 2 controls**: a solid `primary` "Mark session complete" button (only while not done — the one thing a coach does on nearly every row, so it's the only permanently-visible button, per direct instruction "button styles should be based on their importance") plus a kebab that only renders when it actually has something in it (`locked || done`) — "Unlock module" when locked, "Mark as incomplete" when done, both, or neither. Kebab always sits to the right of the button in DOM order (direct correction: "the three dots should be on right not left"). Body-cell text bumped `text-fine` (12px) → `text-caption` (14px) throughout — direct correction that this table's font size didn't match the established convention every other data table in this app already uses for body cells (`ConsumerManagementPage.tsx` et al.).

**Indigo/purple removed app-wide, direct instruction ("remove purple token wherever used, stick with the blue primary token")** — not scoped to this table: `WizardProgressRail`'s `currentTone` prop (the only caller was `PlanSessionsModal`, so the whole `'indigo'` branch and prop were deleted, not just recoloured) and every `bg-indigo-600`/`bg-indigo-50` "next" marker across `PlanSessionsModal.tsx`, `SpacesCoachProfilePage.tsx`, and `ConsumerDetailPage.tsx`'s own read-only mirror table are now `bg-primary`/`bg-primary/5`. `StatusChip.tsx`'s `next` tone recoloured to `border-primary/20 bg-primary/10 text-primary` (was `border-indigo-200 bg-indigo-50 text-indigo-700`).

**§44 addendum (2026-08-10, same day, continued follow-up batch) — 4 more direct-feedback fixes against this same table, then the "Edit plan" entry point split into its own component, then a formal design-critique/accessibility-review pass (the one flagged as an open follow-up in the paragraph above), all now closed.** (1) **Action column right-aligned** — `justify-center`/`text-center` on the header and cell both changed to `justify-end`/`text-right`, so the kebab sits flush against the table's right edge ("the three dots should be on right not left" was fixed once already this round per the paragraph above, but the column itself was still centered, not right-aligned — a distinct, later correction). (2) **"Mark as incomplete" is now researcher-only** — a new `viewerRole: 'researcher' | 'coach'` prop on `SessionTracker` (threaded through `DyadSection`), defaulting to `'researcher'`; the Delivery Portal passes `'coach'`, dropping the kebab item entirely for a coach viewing their own completed session (and collapsing the kebab to nothing when that was its only reason to render). (3) **A session can't be marked complete before its own date** — new `isFuture` check (`row.date > TODAY`); future rows render a real, focusable `aria-disabled="true"` button (matching `DyadSessionRecordingsCard.tsx`'s own "View recording" precedent) rather than being hidden. (4) **CTA restyle** — the solid `bg-primary` pill swapped for the `bg-pearl`/`text-primary`/`rounded-sm` pattern already live in `CoachProfilePage.tsx`'s Stage Management pipeline, direct feedback that the new pill didn't match the researcher dashboard's own established convention.

**"Edit plan" split into a new `EditSessionPlanModal.tsx`**, replacing the old behavior of reopening `PlanSessionsModal` at its review step for an already-active plan — direct feedback that a coach amending a real plan shouldn't have to see or step through the "Module availability"/"Session Catch-up" questions (or the wizard's 2-column rail chassis) just to change a date. New component: single heading + plain-language subtitle, no rail, a real `<table>` mirroring `SessionTracker`'s own column set (Session number/Date/Time) instead of the wizard's topic-tinted card treatment. A completed row renders read-only with its real `sessionCompletion` timestamp. Save is blocked on a missing date/time, a date on/before the previous row's, or — a bidirectional check added the same day after a direct follow-up question ("what about when session has been completed?") — a date on/after a *later* row's date if that later row is already done, since completion in this app isn't gated on session order (a coach can complete Session 4 while Session 2 is still open). `PlanSessionsModal.tsx` itself is now create-only — the `mode` prop and every `'edit'` branch, the edit-only "Start over" `ConfirmDialog`, and the resulting dead `validWeekday()` helper were all removed outright. A real crash was caught live during this work (not just code-reviewed): `EditSessionPlanModal`'s `rows` state started as `[]` and was only seeded in a `useEffect`, but `open` can flip `true` on the very same render the component first mounts with, before that effect runs — fixed with a lazy `useState(seedRows)` initializer.

**Design-critique + accessibility-review pass (Phase 3/4), the first covering any part of Round 16 — run directly by the orchestrating session.** Design critique: clean, 0 findings, across both the table and the new modal on both portals. Accessibility review found and fixed 1 real issue: the future-disabled "Mark session complete" button was missing `focus-visible:ring-2 focus-visible:ring-ring` (present on every other interactive control in the table, and on the `DyadSessionRecordingsCard.tsx` precedent it was modeled on) — a keyboard user tabbing onto it got zero visual confirmation of focus. Found and re-verified via a real Tab-key sequence (not `.focus()`, which reported differently), fixed, and re-confirmed via the same method. One false alarm was investigated and ruled out during this pass: the automated testing tool's synthesized Enter key doesn't reliably trigger native `<button>` activation in this environment (confirmed against a plain button with no ARIA menu involved), so "the kebab won't open on Enter" is a tool limitation, not an app regression — see the accessibility report for the full test. Both reports + index rows in `design/reviews/`. `tsc -b`/`oxlint` clean throughout.

---

## §45. `onboarding-tour` — spotlight coachmark overlay + new `--shadow-float` token (Round 17 — Research Dashboard)

The app's first coachmark/spotlight pattern. Eight per-surface tours, 33 steps, all copy in `data/researchTours.ts`. Full rationale in `design/prototype/round-17-research-dashboard-onboarding-tour-prototype-plan.md`.

**New token — `--shadow-float: 3px 5px 30px rgba(0, 0, 0, 0.22)`.** This is *not* a new value: it is §5's documented "Imagery shadow", which the doc has carried since v4 but which had never actually been added to `index.css`. Round 17 adds it as a real token and **extends its permitted use from imagery-only to the tour tooltip**. Rationale: §5 reserves this shadow for "photographic/illustrative imagery resting on a surface", and a card genuinely hovering above a dimmed page is the one other thing in this app that rests *above* a surface rather than sitting on it. `shadow-card`'s whisper of elevation is calibrated for a card lying on the parchment page and reads as flat against a 62%-black dim. **The "never on buttons or text" half of §5's rule is unchanged.** The tour card was briefly shipped with Tailwind's untokenized `shadow-lg`; that is corrected here.

| Part | Spec |
|------|------|
| Overlay + spotlight | One viewport `<svg>`, portalled to `<body>`: a `#000` / `opacity 0.62` rect masked by a full-bleed white rect minus a black `rx=8` rect at the anchor's bounds. **Not** a `box-shadow` spread — that renders at a fraction of its declared alpha (measured: 0.55 and 0.7 indistinguishable) and was replaced after live measurement. The portal is load-bearing: `motion.main`'s transform otherwise becomes the containing block for `position: fixed`, offsetting the overlay by exactly the sidebar width and header height. |
| Halo | `ring-2 ring-primary/40` on its own element — Tailwind implements `ring-*` *as* a box-shadow, so it cannot ride on the masked SVG rect. |
| Card | `360px`, `radius-lg`, `bg-card`, `ring-1 ring-hairline`, **`shadow-float`**, `p-5`. Icon badge `40px` `bg-primary/10` top-left, **`Skip tour` top-right**, footer = counter left + `Back`/`Next`(`Done`) right. |
| Motion | Continuous `y: [0, -3, 0]` over `4.5s`, `easeInOut`, infinite — a sub-perceptible float that reads as "hovering" without competing with the copy. Entrance is opacity-only (a `y` slide-in would fight the loop's first frame). Reduced motion is handled globally by `App.tsx`'s `<MotionConfig reducedMotion="user">`. |
| Quiet-control hover | `Skip tour` uses `hover:bg-pearl hover:text-ink`, matching `ResearchSidebar`'s `AreaLink`. A text-colour-only hover was tried first and is too subtle to register as interactive on a white card. |

**Sidebar icon rule, made explicit this round.** `ResearchSidebar`'s nav uses **metaphor objects for the three managed populations** and reserves a **person icon for the signed-in user**: `GraduationCap` (trainees, still learning) → `BadgeCheck` (coaches, certified and delivering) → `HeartHandshake` (consumers, receiving care), with `UserRound` for My Profile and `Home` for My Home. The first two are deliberately readable as one progression — certification is the actual gate between those two populations.

Coach Management took two attempts. It previously used `UserRoundCheck`, which was indistinguishable from `UserRound` at 20px (they differ only by a small check badge); that collision was structural, not cosmetic, because a second person silhouette can never read as "a population" beside a person silhouette meaning "you". `HeadsetIcon` resolved the collision but read as a call-centre agent — wrong register for a research dashboard. `BadgeCheck` is the keeper: non-person base shape, and its meaning is the one thing that actually defines the population. Note the lesson is *not* "avoid check marks" — `BadgeCheck` has one too. It's that the **base shape** must differ.

"My Schedule" was renamed **"My Home"** (icon `Calendar` → `Home`) in the same pass, since the page carries a widget grid and snapshot table as well as the schedule; its route stays `/research/schedule` deliberately, as it's internal and renaming would churn every link and tour anchor for no visible gain.

**Anchoring** is a `data-tour="<id>"` attribute on 30 real elements — no wrappers except where an element wasn't attachable, no behaviour or layout change anywhere. Two shared components (`SessionTracker`, `SupervisionRecords`) render in the Coach Delivery Portal too, so their anchors are gated (`viewerRole === 'researcher'`, and a new optional `tourAnchor` prop respectively) — verified by grep that no `data-tour` leaks into the other three portals.

---

## §46. Shared `modal-footer` surface + `WizardProgressRail` sizing/ratio convention (Round 17.2 — cross-portal, every pop-up modal)

**Problem:** `PlanSessionsModal`/`EditSessionPlanModal` had a full-bleed, shaded `bg-pearl` footer (negative-margin bleed to the panel edge, `rounded-b-lg`, `py-4`) closing off their rounded bottom corners; every other modal in the app (`ConfirmDialog`, `AddCoachTraineeModal`, `EnrollConsumerDialog`, `AddAnnotationSummaryModal`) instead sat its footer directly on the same white background as its own body, separated only by a `mt-6` gap — direct feedback: "all pop-up modals need to have a footer, similar to how we did for the session planner... consistent app wide."

**Fix — new shared file, `src/components/shared/modalFooter.ts`:**

```ts
export const MODAL_FOOTER_SURFACE =
  '-mx-6 -mb-6 rounded-b-lg bg-pearl px-6 py-4 md:-mx-8 md:-mb-8 md:px-8'
export const MODAL_FOOTER_SURFACE_COMPACT = '-mx-6 -mb-6 rounded-b-lg bg-pearl px-6 py-4'
```

Two variants because the app's modals come in two panel paddings: `MODAL_FOOTER_SURFACE` for the `p-6 md:p-8` wizard-shaped panels (all 5 rail-bearing modals), `MODAL_FOOTER_SURFACE_COMPACT` for `ConfirmDialog`'s smaller, `p-6`-only panel (no `md:p-8` — using the wide variant there would bleed the footer past the panel's own edge at `md`+). Composed via `cn()` alongside each modal's own layout classes (`flex justify-between`/`justify-end`, `gap-3`, etc.) — the constant only ever carries the visual surface, never layout, so each modal's existing button arrangement (two-button, single-link) is untouched. **Every panel using either variant must also carry `overflow-hidden`** so the footer's negative margins don't visibly poke past the panel's own `rounded-lg` corners — added to all 4 previously-missing panels this round. Live-verified this doesn't clip focus rings (16px clearance measured, see the round's accessibility report) or break the existing Tab-trap wraparound (verified both directions with real key presses).

**`WizardProgressRail.tsx` sizing, iterated three times on direct feedback in one session — final state is the only one that matters, but the sequence is worth keeping so a future round doesn't re-litigate an already-rejected middle step:**

| Step | Rail/content split | Marker size (desktop/mobile) | Vertical step gap |
|------|---------------------|-------------------------------|--------------------|
| Before this round | `280px_1fr` (3 modals) / `240px_1fr` (`PlanSessionsModal`, inconsistent) | `size-9`/`size-7` (36px/28px) | `md:pb-8` |
| First pass | Unified `350px_1fr` fixed pixels (`280 × 1.25`, the literal "~25% wider" ask) | `size-8`/`size-6` (32px/24px) | `md:pb-12` |
| Second pass | `2fr_3fr` (40/60, fr-based so it scales with the panel instead of a fixed px) | unchanged | unchanged |
| **Final** | **`3fr_7fr` (30/70)** — direct feedback the rail was still too wide relative to content | unchanged | unchanged, **plus** the rail's own wrapper `md:pr-8`→**`md:pr-4`** |

The last change (`pr-8`→`pr-4`) is not a width change — it's a **left/right balance fix**. The rail column's own right-padding (before the divider `border-r`) and the grid's `gap-8` (after the divider, before content) were nominally equal (32px + 1px border ≈ 32px), but read as visually asymmetric once the column itself got narrower — direct feedback: "the spacing between the vertical stroke and content on left and right are not same. Reduce on left to balance it out." Trusted the visual report over the nominal-equality calculation; `pr-4` (16px) now reads balanced against the unchanged 32px grid-gap on the other side. Every modal that renders `WizardProgressRail` alongside a content pane must use `md:grid-cols-[3fr_7fr] md:gap-8` on the wrapping grid, and `shrink-0 md:border-r md:border-divider-soft md:pr-4` on the rail's own wrapper — both are now the single, non-modal-specific convention; don't reintroduce a fixed-pixel split or a bespoke padding value in a future modal.

**`PlanSessionsModal.tsx`'s top-level `<h2>` title was the one outlier at a smaller size** (`text-caption font-semibold text-ink-faint`, a muted breadcrumb, while every other modal's fixed title used `font-display text-title text-ink`) — corrected to match. The **welcome/intro screen's own hero heading is a deliberate exception**, sized up further to `text-display-md` (34px, up from `text-title`'s 21px) since it's acting as a one-time hero title shown before the rail ever mounts, not a title stacked directly above a same-size step heading the way every other modal's fixed title is. That heading also gained **`text-balance`** (Tailwind's `text-wrap: balance` utility) after direct feedback flagged a widow — "Welcome! Let's plan your consumer's sessions" was wrapping as "…your consumer's" / "sessions", stranding the last word alone; `text-balance` re-distributes the wrap to "…your" / "consumer's sessions" instead. Graceful degradation only (Chrome 114+/Safari 17.5+/Firefox 121+); a non-supporting browser just gets the old greedy wrap back, not a visual break.

**Intro-screen icon badges enlarged** (`size-9`/`size-4` icon → `size-14`/`size-7`) per direct feedback, with the vertical gap to the "Step N"/title/description text block below increased (`mt-3`→`mt-6`). A number badge was briefly stacked on the icon itself (small circle, bottom-right corner) before direct follow-up feedback asked for the numbers to sit **above the titles instead, not on the icons** — replaced with a plain "Step N" `<p>` as its own line, matching the copy pattern "Step 1"/"Step 2"/"Step 3" (no colon, no title repeated on the same line — the title is already its own line directly below). Two of the three step names were also renamed for clarity, applied identically in both `INTRO_STEPS[].name` (the preview) and `STEPS[].navLabel` (the real per-step rail) so the wording never changes mid-flow: **"Module availability" → "Module unlock day"**, **"Session Catch-up" → "Catch-up timing"** (direct feedback: the old names "read as internal field names, not something a coach immediately understands"). "Review plan" was left unchanged — not flagged as confusing.

**New "Session Planned" column** (`DeliveryHomePage.tsx`'s "Consumers assigned to you" table + its CSV export) reuses the existing success/muted `Chip` tone convention already established by the sibling "Annotation" column one table over (`SpacesCoachProfilePage.tsx`) — `isPlanSet(sessionPlans[dyad.id])` drives Yes (`success`) / No (`muted`), not a new tone pair.

**Session Plan card gains a `viewerRole`-conditional title/subtitle/CTA split**, on top of Round 16's existing `viewerRole` prop. Coach view is unchanged. Researcher view: title becomes **"Coach's session plan"** (third-person, no personal names, matching this file's own established "this coach's SPACES caseload" pattern); "Edit plan"/"Create session plan" are omitted entirely (a real conditional, not `disabled`) since planning is the coach's own workflow with their consumer, not the research team's; subtitle reads **"This coach's planned and completed sessions."** for a planned dyad — corrected mid-round from an initial "A read-only view of…" once design critique caught that the card is not, in fact, read-only (the researcher-only "Mark as incomplete" override and the same "Mark session complete" button both remain live and unchanged) — see the round's design-critique report for the live repro.

---

## §47. `NotificationHub` — green-tinted notice carousel replacing the Coach Delivery Portal Home widget grid (Round 18 — Coach Delivery Portal, direct chat-edit batch)

**Problem:** the old Gmail/Calendar/Zoom/Coach Training Portal shortcut widget grid (§21/§22) was removed outright per direct feedback ("coaches won't be needing any widgets"), leaving the Home page's left column empty.

**Fix — new `src/components/delivery/NotificationHub.tsx`:** a real, data-driven notification center (Fitbit/diary sync-gap alerts, "add your reflection" reminders, upcoming-Zoom heads-up, missing-session-plan prompts) built from the coach's actual caseload via `buildNotifications()` — never a placeholder count. Iterated twice on direct feedback before landing: a blue/bordered vertical list (rejected — too blue, too list-like) → a green tile grid of `<Link>`s to the consumer (rejected — notices shouldn't navigate, too many equal-weight icons, an open-ended grid should paginate instead) → the shipped shape: a new one-off **`notification-hub-green`** tint (`bg-green-50` card, `bg-green-100`/`text-green-700` icon badges — the fifth documented exception to §1's "quiet, no rival accents" rule, same category as `diary-green`/`session-next-indigo`), non-navigating item cards (icon top-left, message below, a real per-item dismiss `X`, local component state only — nothing is persisted), laid out 2×2 per "page" inside a horizontally snapping scroll carousel with dot pagination below. Sync/diary alerts keep the app-wide `text-destructive` tone so real urgency still reads through the calmer green.

**Two real bugs found and fixed by this round's own build, before this review began** (already live-verified, not just re-read): a `ResizeObserver` re-anchors `scrollLeft` to the current page on container resize (otherwise a width change left the carousel torn between two pages); `p-2` padding was added around each page's card grid so `overflow-x-auto` (which per spec forces `overflow-y: auto` too) stops clipping the cards' own `shadow-card`.

**This design-critique pass (Round 18) found and fixed 2 more real issues**, both reproduced live by actually dismissing notifications down from 5 to 1, not assumed from a static read:

1. Each page's grid was hard-set to `min-h-[224px]` + `grid-rows-2` — a flat 2-full-row height regardless of how many items the page actually held. A page with 1-2 items (the ordinary state after a coach clears a few notices) left a large, conspicuously empty green area beneath the card(s), reading as broken rather than a genuinely shorter page. Fixed by dropping `grid-rows-2` (letting the grid size its own rows to the real item count) and lowering the floor to `min-h-[104px]` — one real card's own measured height, not an artificial 2-row minimum. Re-verified live at 4, 3, 2, and 1 remaining items: each now renders a tightly-sized box, no dead space.
2. The per-item dismiss (`X`) button was `size-6` (24px) — this app has an established, repeatedly-enforced dismiss/close-button precedent at `size-9` (36px), e.g. `ConsumerDetailPage.tsx`/`ConsumerHealthPage.tsx`'s own "Dismiss alert" button (also `text-ink-faint`, `hover:bg-*`, same shape). Raised to `size-9`/`size-4`-icon to match rather than introducing a third one-off size; re-verified live, no crowding against the small card's own `p-4` padding or the icon badge above it.

**Also verified clean:** the carousel's re-chunking on dismiss (items from a later page correctly flow up and the pagination dot count correctly drops from 2→1 with no stale index) is real and reactive, not just visually plausible; the "You're all caught up" empty state renders centered on the same green surface once the last item is cleared; the green tint's contrast (title 16.08:1, `ink-faint` subtitle/caption text 4.84:1–4.66:1 depending on element) passes AA with real headroom, computed live via canvas OKLCH readback since the token renders as `oklch()`, not `rgb()`.

**Flagged, not fixed — a judgment call, not a Round 18 defect:** the new `/delivery/learning` tab is a second, newly-added entry point into the already-signed-off, multi-round-hardened `/training-v2` module-overview/player flow (Rounds 7/7.1/7.1.2/8/9), which was built assuming a single entry point. Live-reproduced: a coach who opens a module from `/delivery/learning`, then clicks "Back to my learnings" on the overview page, lands on the standalone Coach Training Portal home (`/training-v2`) rather than back on `/delivery/learning` — `ModuleOverviewPage.tsx`'s `backToTimeline()` hardcodes `navigate('/training-v2')` regardless of entry point. Not a dead end (a "Go to Coach Delivery Portal" button is present there), but a real, one-click detour out of the portal the coach thought they were still in. Left unfixed this round: a correct general fix means threading a return-destination through three hops (`ModuleTimeline.tsx` → `ModuleOverviewPage.tsx` → `ModulePlayerPage.tsx`'s own `?from=` exit param), all explicitly declared "unmodified this round" and belonging to a different, already-hardened round's scope — recommended as a follow-up rather than an in-pass fix to a signed-off flow.

**Addendum — accessibility pass (Round 18, run in parallel with the design-critique pass above; both edited `NotificationHub.tsx` and were confirmed to coexist cleanly with no conflict):** found and fixed 2 Major + 1 Moderate, all live-verified with real OS-dispatched key presses, not synthetic `dispatchEvent`. **Major 1:** the resize-recovery `ResizeObserver` effect (documented above) fires an unprompted `scrollTo` on its own guaranteed first callback — which also fires on every `page` state change, including first mount — and that unprompted call intermittently raced the browser's native focus-driven scroll, dropping keyboard focus to `<body>` mid-Tab-sequence through the dismiss buttons; reproduced 3× with rapid real Tab presses right after page load, confirmed to vanish with a ~2s delay. Fixed by tracking and skipping the guaranteed first callback per observer instance; re-verified with the identical rapid-Tab sequence 3× post-fix (including a fresh tab, ruling out HMR residue), zero drops in either Tab direction. **Major 2:** dismissing a tile removed its DOM node with zero screen-reader announcement — no `aria-live` region existed anywhere in the component. Fixed by reusing this app's own established `role="status" aria-live="polite"` sr-only pattern (`WidgetGrid.tsx`'s widget-picker "X added..." precedent); re-verified live, dismissing a real item correctly announced "Dismissed: {message}." **Moderate:** `ModuleTimeline`'s pre-existing current-module `scrollIntoView({block:'center'})` effect assumes an independent scroll pane (true on `/training-v2`'s two-column sticky-rail layout) but not on the new single-scroll-container `/delivery/learning` page — reproduced live, the whole page jumped straight to Module 2 on load, hiding the "Learning" heading with no indication a jump occurred. Fixed with a new `autoCenterCurrent` prop on `ModuleTimeline` (default `true`, preserving `/training-v2` unchanged), set to `false` from `DeliveryLearningHomePage.tsx`; re-verified both pages live post-fix. Also verified clean: contrast on the green/destructive icon-badge pairs (4.48-4.50:1) and message text (16.83:1); the active pagination dot's contrast against the green card (3.08:1) passes but with very little margin — logged as a note, not a defect; roving-tabindex on the renamed Session Notes/Consumer Profile Details tabs; the PLWD/Carer hero's manually-authored `aria-label` still correctly prevents run-on concatenation after this round's equal-size restyle, on both portals.

---

## §48. Coach Training Portal retired into the Coach Delivery Portal's Learning tab, curriculum regrouped into tier canvases, module cards rebuilt as a carousel, app-wide content-width increase (Round 19 — cross-portal, direct chat-edit batch, no pre-written scope plan)

**Problem/scope, in one line:** the standalone Coach Training Portal (`/training-v2`) is retired — a coach's learning journey now lives inside the Coach Delivery Portal's own "Learning" tab — and that tab, plus the module curriculum it displays, went through many rounds of direct live iteration before landing.

**1. Portal retirement (no new tokens).** `TrainingPortalV2Page.tsx` deleted outright; its Portal Switcher tile removed; `App.tsx` routes cleaned up (the module overview/player routes stay, now reached only from the Learning tab); `AppHeader.tsx`'s wordmark link for that header variant repointed from the now-dead `/training-v2` to `/delivery/learning`; `WidgetGrid.tsx`'s dead "Coach Training Portal" tile removed from `DEFAULT_TILES`; `ResearchHomePage.tsx` simplified accordingly (the tile-filtering logic it needed is now dead too). The overview (`ModuleOverviewPage.tsx`) and in-module player (`ModulePlayerPage.tsx`) pages are unchanged in their own internals — only their entry point moved.

**2. New Learning tab** (`DeliveryLearningHomePage.tsx`, `/delivery/learning`) — a `grid-cols-[1fr_360px]` split: `ModuleTimeline` on the left, a sticky right column holding a new `LearningProgressCard` ("Your progress" — one count + one percent + one `Progress` bar, deliberately a single representation of progress rather than layering redundant ones, an early pass had done that and it read as 3 overlapping facts for the same truth) stacked above the existing `AiReflectionPanel` placeholder. Both cards travel and stop together — sticky positioning lives on the outer column wrapper (`lg:sticky lg:top-24 lg:self-start`), not the inner "AI reflection" `Card` alone (an earlier pass had it there, and the two cards visually decoupled — one scrolling away while the other caught up and stuck on its own). `top-24` (96px = the 48px header + a deliberate 48px gap) is corrected up twice from an initial `top-6` (which rendered partly *behind* the header, since 24px is less than the header's own 48px height) through an intermediate `top-16` (16px gap, still not enough breathing room per direct feedback) to the final 48px gap. Hero title/subtitle rewritten via `/design:ux-copy` (see `ux-copy.md`'s own new Round 19 section) — landed on "Keep learning, {name}" + a real, numbers-checked curriculum summary read from `trainingPathwayV2.ts` rather than assumed.

**3. Curriculum regrouped into 2 tier canvases + 2 standalone cards.** `trainingPathwayV2.ts`'s `MODULE_GROUPS` now holds exactly the tiers with more than one module — **Foundational modules** (4) and **Sleep modules** (7) — each rendered by `ModuleTimeline.tsx`'s `ModuleGroupCanvas` as a flat, shadowless, borderless colored panel (see new tokens below) replacing the old numbered-marker vertical timeline entirely. The curriculum's 4 Foundational titles were retitled to match this project's real curriculum-overview doc (`Know the project, know your client` / `Your coaching toolkit` / `SIPTEA framework` / `Onboarding and getting set up`) while ids were deliberately left unchanged (`pathway.ts`'s `DEMO_PLAYER_REDIRECTS` keys off one of them specifically); the 7 Sleep-modules titles already matched. A new 12th module, `sleep-modules-practice` ("The practice after the sleep modules"), was added for the Practice tier — which, being a single-module tier, is **not** one of `MODULE_GROUPS` and gets no canvas at all: `ModuleTimeline.tsx` renders it as a standalone `PracticeModuleCard` (built on `CertificateCard`'s own full-width chassis, "similar to certificate," per direct instruction — a single-module tier doesn't need a canvas + header + one-item carousel wrapping it).

**New tokens — `--color-tier-foundational` (`#eff6ff`) / `--color-tier-sleep` (`#f0fdf4`)** (`index.css`): one pastel tint per tier, replacing a flat shared `bg-muted` so the two sections read as distinct at a glance rather than a repeated grey box. Chosen as named tokens (matching `badge-purple`/`plan-module`/`plan-catchup`'s precedent) rather than raw Tailwind blue-50/green-50 utilities. Contrast re-verified against the new, *lighter* backgrounds rather than assumed carried-over from `bg-muted`: the tier header's `text-ink-faint` count label — previously measured elsewhere in this file at a marginal 4.45:1 on `#f0f0f0` — ~~now clears 5.09:1 (foundational) / 5.29:1 (sleep), both with genuine AA margin, not a bare pass~~. **Correction (2026-08-13, independent audit):** the 5.09:1/5.29:1 figures above don't hold up under an independent recompute from the actual hex values — the real numbers are **4.66:1 (foundational) / 4.84:1 (sleep)**, matching the two other comments already inside `ModuleTimeline.tsx` itself. Both still clear the 4.5:1 AA text floor, but with the same thin order of margin as the 4.45:1 near-miss this paragraph already flags as risky — not a "genuine margin" pass. Left struck through rather than deleted so this file's own history stays honest about the mismatch, per this project's own established convention for this kind of correction (see e.g. the Round 15 audit entries above).

**4. Module cards rebuilt as a horizontal carousel, then iterated to full size/state parity.** New `ModuleScrollRow` component: a native `overflow-x-auto`/`snap-x snap-mandatory` row per tier, with overlaying prev/next chevrons (`hidden md:flex`, real-measured 36×36px per this app's icon-button convention) and dot pagination below (reusing `NotificationHub.tsx`'s existing carousel-dot visual language — the app's one prior horizontal-scroll pagination pattern — adapted so one dot = one card, not one page). Both chevrons and dots are genuinely conditional on real `scrollLeft`/`scrollWidth` measurement (re-checked via `ResizeObserver`), not just visually disabled — a tier that fits without overflow gets neither. A thin dashed "learning path" line (`border-ink-faint`, `aria-hidden`, 4.45:1 against the tier's own background) sits behind each row as a decorative progression motif, explicitly *not* the numbered-circle/connector-rail treatment already rejected elsewhere in this file.

`TimelineModuleCard`'s own size/state treatment went through several full iterations before landing on genuine parity across every state, all via direct live feedback:
- **The current (in-progress) module's card was tried at 3 different distinguishing treatments, all three explicitly rejected**, in order: an outset `ring-primary` (clipped by the scroll row's own `overflow-x-auto` boundary on edge cards, and read as visual noise); a `border-l-4` side border (rejected outright as ugly); a size increase + a softened `shadow-float`-derived lift (rejected per a later, direct "I want all modules to look consistent regardless of their current state... current module make it similar to other modules"). **There is now a `STANDING RULE` comment directly on the `Card` element** stating no stroke/border/ring/outline/shadow/size difference should mark the current card again — respect it before reopening this. The only remaining current-state signal is the module's own badge/status-chip/CTA text.
- **Every card (current, completed, locked) now shares one fixed footprint** — `w-56 sm:w-64` (224/256px), `h-36` cover, `h-[58px]` title block (`line-clamp-2` only caps a title's height, it doesn't reserve room for 2 lines, so a genuinely one-line title was measured rendering shorter than its 2-line siblings until this was fixed), `shadow-card` at every state, no `Progress` bar at any state (dropped project-wide from this card, not just from a "compact" size that no longer exists). These are the *former compact* dimensions scaled up ~15%, not the former *current* dimensions scaled down — the current card was corrected as the outlier, not treated as the target shape.
- **A real, measured typography bug**: the "MODULE N" badge was visually outweighing the title because the title was rendering at `font-weight: 400` in a Display-face style at 17px (this project's own §2 spec reserves the Display face for ≥21px; the Display face renders visually heavier at an identical numeric weight, which is what read as "too bold" even once corrected). Fixed to plain `font-sans font-semibold` at every card size — verified via computed style, not eyeballed.
- **Locked cards' "deactivated" treatment was corrected from a flat opacity reduction to a real muted-token treatment**, after direct feedback that opacity dimmed the content but a thin 1px border kept reading as a crisp, undimmed edge floating over washed-out content ("I can see the stroke behind... I want a more deactivate[d] state style") — matching this project's own already-documented precedent against opacity-as-disabled (§39, `WeekdayPicker`'s disabled tiles). Now: `ring-divider-soft` instead of `ring-hairline`, `grayscale` on the cover art instead of translucency, and title/badge swapped to the exact already-AA-verified `bg-divider-soft`/`text-ink-muted` pairing the locked CTA button already used (11.09:1) — no opacity utility anywhere on the card.
- **"Approx. N min" moved to an opaque white status chip** (top-right of the cover art, matching `VideoPlaceholder.tsx`'s duration-badge position one layer up the hierarchy) — built fully opaque (`bg-white`/`text-ink`) so contrast is guaranteed regardless of whatever gradient wash sits behind it, and doubles as the completed/locked indicator (check/lock icon), making it the one place a module's status renders from the image alone while scanning a row.
- New `Badge` `tone="muted"` reuses the same already-verified `bg-divider-soft`/`text-ink-muted` pairing for the locked-state "MODULE N" pill, rather than inventing a new muted-badge color.

**5. App-wide content-column width increase.** `DeliveryShell.tsx`/`ResearchShell.tsx`/`ConsumerShell.tsx` (+ 3 independent banner components that duplicate the shell's own max-width rather than being wrapped by it: `ConsumerShell.tsx`'s `OptedOutBanner`, `ConsumerHomePage.tsx`'s `TodaySessionBanner`, `CoachProfilePage.tsx`'s pending-invite banner) all widened from `max-w-[1100px]`, which left a large unused gutter on wide viewports regardless of the sidebar's collapsed/expanded width (this cap sits entirely inside `main`'s own remaining space, independent of the sidebar). Corrected twice on live feedback before landing: `1600px` (first pass, "drastically" reduced the padding) → `1536px` (Tailwind's own `2xl` value, giving back 32px/side) → **`1320px`** (still too wide at 1536 on a genuinely wide screen; landed here as a deliberate middle ground between the too-narrow original and the two too-wide passes). All 6 files' doc comments carry this full correction history — read it before changing this value again rather than re-deriving from scratch.

**Formal review (Round 19's own Phase 3/4, per `design/claude-code-action-plan.md`, both fresh independent agents):**
- **Design critique**: 1 High fixed (the carousel's mount-time auto-center effect computed an offset that almost never landed on a valid scroll-snap point, so the row silently re-snapped back to an earlier module on every fresh load — fixed to scroll straight to the target's own `offsetLeft`, the same technique `goToCard()` already used correctly); 1 High flagged not fixed (none of this app's 3 shared sidebars adapt below desktop width — confirmed pre-existing and app-wide, reproduces identically on the untouched `/delivery` Home, recommended as its own follow-up round rather than a bolt-on here); 2 Notes (hero copy was mid-iteration when checked, now settled; the current card's lack of visual distinction is a settled decision, not an oversight to reopen).
- **Accessibility**: 1 Critical fixed (the same auto-center effect's `scrollIntoView` call was walking past the row's own axis and scrolling the *whole page* to its absolute bottom on every fresh load of `/delivery/learning` — the identical bug class Round 18 already fixed once via `autoCenterCurrent`, reintroduced through a new code path once `/training-v2` stopped being this component's caller; fixed with a manual, container-scoped `scrollLeft` write); 1 Major fixed (both chevrons unconditionally unmount at the exact scroll boundary reached by using them as designed, dropping keyboard focus to `<body>` — fixed with an `onBlur`/`relatedTarget`-null redirect to the sibling chevron or the row container); 2 Minor fixed (chevrons measured 28×28px against this app's 36px convention, raised; the locked "Locked" CTA text measured 4.450:1, a narrow AA miss, swapped `text-ink-faint`→`text-ink-muted`, now 11.09:1).

Both reports + index rows: `design/reviews/round-19-coach-delivery-learning-tab-and-app-wide-width-{design-critique,accessibility}-report.md`.

---

## §49. Module-card numeral-overlay template promoted app-wide, `AiReflectionPanel` reframed as "Baseline reflection," app-wide white background (Round 19.1 — Coach Delivery Portal Learning tab, long direct-chat-edit session, no pre-written scope plan)

**Problem/scope, in one line:** Round 19's Learning tab kept iterating live, well past its own sign-off — a one-card numeral-overlay trial was promoted into the permanent `TimelineModuleCard` template across all 11 Foundational+Sleep modules, the `AiReflectionPanel` placeholder became a real, gated "Baseline reflection" tool, and two more app-wide token/layout corrections landed alongside a long tail of copy/spacing refinement. Dispatched almost entirely through background agents against live one-line feedback and annotated screenshots rather than inline edits — see `design/logs/progress-log.md`'s own entry for this round for the full blow-by-blow; this section covers the design-system-relevant substance.

**1. Numeral-overlay template, generalized from a single-card trial.** `TimelineModuleCard` now overlays a large bold white numeral bottom-left on every card's own cover-art image (`text-6xl`, `aria-hidden`, purely decorative reinforcement of position a sighted reader already gets from the status chip). Legibility went through 3 iterations: a computed white/dark-`ink` color switch per cover (rejected — user wanted plain white everywhere) → a hard 4-corner shadow stack mimicking a text-stroke (rejected live, "the stroke around the number is ugly") → the shipped state, `shadow-card`'s own token values as a soft text-shadow, explicitly accepted as imperfect on the palest placeholder-gradient covers ("that's fine, future version will be having an image instead of placeholder gradient, with a subtle overlay") — a deliberate, disclosed tradeoff, not an unexamined gap; a doc comment on the overlay flags this for whoever swaps in real photos later. The old "MODULE N" pill badge (`Badge`/`ModuleBadge` components) was deleted outright — not hidden — once the numeral made it redundant on every card, not just one. The status chip (Completed/Locked/In progress/Approx. N min) moved from top-right to bottom-right to pair with the numeral.

**2. Two real bugs found and fixed inside this same card, both root-caused rather than patched.** (a) A 4-round-long "dead space between title and button" complaint turned out to be an invisible (`visibility:hidden`, not `display:none`) "MODULE N" badge span sitting between the cover image and the title, still occupying ~41px of real layout space from a since-superseded height-parity technique — deleting that span outright (safe now that the numeral overlay makes it redundant *uniformly*, unlike the original single-card asymmetry that made deletion unsafe the first time this exact class of bug appeared) closed the gap; the remaining space was set to an exact, measured 16px, and every card (completed/locked/in-progress) still renders identical height afterward (348.02px, re-verified independently). (b) A locked module (Sleep's real "Understanding Sleep" card) was silently inheriting Foundational module 2's live progress data and rendering "11% complete" despite being genuinely locked, traced to a demo data-redirect collision in `pathway.ts` (`realPlayerContentId('understanding-sleep')` falls through to resolving to itself, the exact same id module 2's own redirect points at) — fixed by short-circuiting to the module's own real `locked` state at the `TimelineModuleCard` call site before ever consulting the live-player-aware `displayStatus`/`displayProgress` functions, scoped to this one caller so `PracticeModuleCard`/`CertificateCard`'s own use of those shared functions is untouched. The deeper redirect collision itself is left in place, documented as a known architectural issue for a future dedicated fix.

**3. Title alignment reopened and re-settled.** The title box (`h-[58px] line-clamp-2`) had been vertically centered (`items-center`) earlier in Round 19 specifically to fix a short-vs-long-title asymmetry (a 1-line title used to sit flush top with all its slack dumped below, next to a 2-line title that filled the box). Direct feedback asked for top-alignment again regardless of that known tradeoff — confirmed and accepted explicitly ("make sure the text inside text container is top aligned," with the asymmetry risk pre-confirmed as acceptable) — verified this time at the actual glyph level via `Range.selectNodeContents()` against each title's own text node, not just the container `<div>`'s `items-start` class: every one of the 11 real cards measures an identical 2.00px offset from the box's top edge.

**4. An in-progress module gained a visible progress bar + percentage, reserved via the same `invisible`-space technique as the badge-deletion fix above.** The chip text stays generic "In progress" (per the original ask, "don't tell how much") — the real percentage now lives as its own caption directly above the bar instead.

**5. `AiReflectionPanel` reframed from an "AI"-branded static placeholder into a real, gated "Baseline reflection" tool** (`src/components/shared/AiReflectionPanel.tsx`, sole caller `DeliveryLearningHomePage.tsx`). Copy dropped every visible "AI" mention — the underlying annotated-SIPTEA-guide mechanism genuinely does use an AI-guided conversation + AI-generated summary per this project's own `CLAUDE.md`, just not surfaced as an "AI feature" to the coach — icon swapped `Sparkles` (reads as AI magic) → `NotebookPen`. Gates on `isCertified` (all 12 modules complete, the same flag `CertificateCard` already used) for exactly 2 states, scoped deliberately to just the first of this project's 4 real reflection timepoints (baseline/midline/endline/post-practice) — the other 3 are an explicit future follow-up, not built here. **New token, `--color-reflection-panel: #f5f3ff`** (`index.css`) — a pale purple wash, constant across both states (an earlier version varied it by state; direct feedback asked for a constant purple with the state difference carried entirely by the button), following the exact pattern `--color-tier-foundational`/`--color-tier-sleep` (§48) already established: a dedicated light-wash token for the surface, paired with the pre-existing `badge-purple` for the icon accent rather than reusing `badge-purple` itself as a raw background fill (too saturated for a full card wash, and outside that token's own documented one-off scope). The locked/active CTA button surfaced 2 real bugs, both fixed: (a) the button's own accessible label read "Start reflection" in BOTH states — a disabled button claiming an available action, an active contradiction, not just unpolished copy — fixed to show the user's own literal specified text, "Finish all modules to unlock," while locked; (b) the locked button's `bg-divider-soft` grey (borrowed from `CertificateCard`'s locked-button precedent, calibrated for a plain white card) had poor visual separation against this card's own now-constant pale-purple background — fixed to `border-badge-purple/70 bg-white text-badge-purple`, reusing existing tokens rather than adding a new one. Copy for both states went through 2 more `/design:ux-copy` passes to explicitly state the unlock condition and the mandatory-per-certification framing (grounded in the real COACH-framework requirement, not phrased as personal compliance pressure) — direct instruction, "the copy is very important." Card height increased ~15% (280px→322px) via padding/gap increases, not a hardcoded override, per direct request.

**6. Two more app-wide corrections, both verified across all 4 portals.** `--background` (`index.css`) changed from `#f5f5f7` (light grey) to `#ffffff` (white) — the tier tints and `bg-muted` are separate tokens, confirmed unaffected; a spot-check for any card-vs-page-separation regression (fill-color contrast vs. the shared `Card` component's own `ring`/`shadow-card`, which every card already carries regardless of background) found none, since no card in this app relies on fill-color contrast alone. `DeliveryLearningHomePage.tsx`'s right-hand column narrowed a further ~10% on top of Round 19's own reduction, from `[1fr_360px]` to **`[1fr_324px]`**.

**7. App-wide hero-subtitle type bump**, a separate mechanical sweep completed this round: page-level hero subtitles (the line directly beneath a page's own `<h1>`, in every portal shell's `hero` prop) bumped `text-caption` (14px) → `text-body` (17px) — scoped carefully via a real inventory distinguishing genuine page-hero subtitles from same-class-combination text elsewhere (modal step subtitles, card subtitles, tab descriptions), which were deliberately left untouched. Independently re-verified twice this round (once mid-session, once at the very end) with a full-codebase scan for any remaining `text-caption text-ink-faint` sitting within 2 lines of an `<h1>` — zero, confirmed complete app-wide.

**A dead-code finding, fixed:** `pathway.ts` still exported `CERTIFICATE_ICON` with zero live importers, cited by a doc comment elsewhere as an example of something already cleanly removed when it hadn't been — deleted for real, along with its now-orphaned `Award` import, so the comment's own claim is accurate again.

**Formal review** (`design/claude-code-action-plan.md` Phase 3/4, 2 fresh independent `general-purpose` agents, deliberately not self-review, matching this project's own repeated practice):

- **Design critique — 1 Medium flagged not fixed, 1 Low fixed, 3 Low/Note reported only, 2 confirming Notes, 1 disclosed methodology caveat.** Medium: `PracticeModuleCard`/`CertificateCard` don't carry a status chip at all (status lives only in the CTA label), breaking the chip convention this round established on all 11 `TimelineModuleCard` instances — correctly identified as a deliberate, documented in-session scope decision (the numeral/chip promotion was explicitly scoped to `TimelineModuleCard` only), so the reviewer flagged it as a product call rather than silently extending the chip or ignoring the inconsistency. **Open, unresolved as of this write-up** — needs a direct decision: extend the chip to these 2 cards, or accept the inconsistency knowingly. Low, fixed: `PracticeModuleCard`/`CertificateCard`'s CTA buttons still carried the old pre-refactor `text-[15px] tracking-[-0.24px]` instead of the `text-caption` convention every module card now uses — fixed on both, `tsc -b`/`oxlint` clean. Reported only, not fixed: `AiReflectionPanel`'s CTA has the identical stale type-scale (a different component family, out of scope for the mechanical fix above — needs its own pass); the `SequenceMarker`'s placement isn't structurally identical between the tinted-canvas tiers and Practice's plain standalone card (already reasoned through and accepted in-session, not new); numeral legibility on the palest covers confirmed weak-but-acceptable, matching the already-disclosed tradeoff in §49.1 above, not a new finding. Confirming: tier-tint-vs-white-background contrast computes near-zero by strict WCAG math but reads fine live since it's a decorative wash, not text; the locked-progress redirect-collision fix (§49.2b) confirmed live with no leak. Caveat, explicitly not reported as a confirmed defect: CTA click-navigation testing via the automation tool gave inconsistent results (coordinate-click/keyboard-Enter failed, direct `element.click()` succeeded) — the reviewer could not determine whether this is a real bug or a tooling artifact, and correctly declined to guess either way.
- **Accessibility — 1 Critical fixed and re-verified, 1 Note reported only, everything else confirmed clean.** Critical: `ModuleScrollRow`'s chevron controls could silently drop keyboard focus to `<body>` when a chevron unmounts at its own scroll boundary — reproduced with real trusted clicks, confirmed via a document-level focusout/focusin listener showing zero event fired in the broken case, and distinguished from a tooling artifact via a control test against `NotificationHub.tsx`'s own, already-fixed identical bug class (which fired correctly every time). Root cause: the existing fix depended on a `blur`/`focusout` event that can fail to dispatch while the row is still mid-smooth-scroll-animation. Fixed by switching to memoized callback refs, which React invokes synchronously on unmount regardless of whether any DOM event fires — closes the race structurally rather than betting on catching an event; re-verified 3/3 clean plus the exact rapid-double-click stress case that broke the prior fix. **Disclosed, not claimed as covered:** the left chevron's mirror case wasn't independently reproduced to failure the same way (tooling noise, not a contrast issue) — confident by construction since it's structurally identical code, but flagged honestly as not independently exercised; keyboard-Enter-specific testing also gave inconsistent automation-tooling results, recommended as a manual human spot-check follow-up rather than claimed as verified. Note, not fixed: a stale code comment on the decorative dashed "learning path" line cites old pre-tier-tint contrast numbers — the real live contrast is fine (4.66:1/4.85:1), only the comment text is outdated. Confirmed clean: all 11 contrast values checked across this whole session's work independently recomputed and matched exactly; the locked-module ARIA wiring has no stale-state path possible; the app-wide white background confirmed to only ever *improve* contrast, never regress it, since nothing in this app renders bare against the page background without its own `Card`/`ring`/text-color already accounted for; the deleted-badge/16px-gap cleanup confirmed via grep with zero dangling references.

Both reports + index rows: `design/reviews/round-19.1-module-card-template-and-baseline-reflection-{design-critique,accessibility}-report.md`.

**Verification environment note, carried forward from Round 19:** no reachable `node` binary in this sandbox — confirmed directly this round, not assumed, by finding the vendored `node_modules/.bin/tsc`/`oxlint` binaries and running them by full path, both failing with `env: node: No such file or directory`. `tsc`/`oxlint` cleanliness for this round's changes **cannot be verified** in this environment; someone with real node access needs to run both before that box can be checked. Every other verification claim in this section (contrast, focus behavior, layout measurement, dead-code grep) was made via live browser/DOM measurement or direct source grep, not `tsc`/lint.

---

## §50. `--color-card-header-blue` — the app's first genuinely cross-portal *surface* rule; `Chip` tone unification; `KpiTile`; the accordion tracker; app-wide spacing increase (Round 20 — cross-portal, ~64-change direct chat-edit batch, no pre-written scope plan)

**Problem/scope, in one line:** §35a (Round 13) established that every card gets exactly one hairline divider between its title block and its content section — a *structural* rule with no visual weight behind it, so a card header still looked like the content it sat above. Round 20 gives that structure a surface, and in doing so lands the strongest cross-portal unification move this project has made; alongside it, three separately-iterated new patterns (KPI tiles, an accordion master-detail tracker, a second notification hub) and a system-wide spacing increase.

**1. `--color-card-header-blue` (`#eaf3fc`) — new token, app-wide.** A pale blue tint filling the §35a card-header block (the title/subtitle/action-row region *above* the `border-t border-hairline` divider) and never the content section below it. Follows the exact `tier-foundational`/`tier-sleep`/`reflection-panel` precedent — a named token, not a raw Tailwind utility — and is deliberately a **different hex from `tier-foundational` (`#eff6ff`)** despite sitting in the same pale-blue family, so the two never read as one token reused for two unrelated jobs.

Contrast, computed from the WCAG relative-luminance formula and then independently re-derived twice (once by this round's accessibility reviewer from live rasterised pixels, since Tailwind v4 ships `oklch()` and the authored hex is not what the browser paints; once by the orchestrating session from the raw hex) — **all three passes agree**:

| Foreground on `#eaf3fc` | Ratio | Verdict |
|---|---|---|
| `ink` `#1d1d1f` (card titles) | 15.01:1 | AAA |
| `ink-muted` `#333333` (subtitles) | 11.27:1 | AAA |
| `success` `#1f7d37` | 4.63:1 | AA |
| `destructive` `#d70015` | 4.80:1 | AA |
| `ink-faint` `#6e6e73` | **4.52:1** | AA, but barely |

**`ink-faint` at 4.52:1 is the one to watch** — it clears AA by 0.02, the same order of near-miss this file already flags for `tier-foundational`/`tier-sleep`, and `ink-faint` is this app's most-used low-contrast token. If this token's hex ever shifts even slightly darker, that pairing fails. Flagged rather than "fixed" by darkening the text, because the value is correct today and a preemptive change would diverge `ink-faint` from every other surface it sits on.

**Coverage, verified rather than asserted:** 47 uses across 21 files and all 3 portals, every one of them `bg-card-header-blue p-6` (or `p-4` inside modals) as the `Card`'s **first child**, with the card carrying `overflow-hidden` and the header itself `border-radius: 0` — so the band's corners are always clipped by the card's own `rounded-lg` rather than fighting it with a second radius. No bleed into content or empty-state regions anywhere. Cards that correctly carry *no* blue are exactly §35a's own documented exceptions (message+CTA cards with no distinct content section: Certification outcome, Learning dashboard, the consumer's Upcoming sessions card, the Reflections locked/ready state), plus the two green notification hubs and the master-detail slide surfaces.

**2. `Chip` tone unification (`StatusChip.tsx`).** Every tone now renders the same visual treatment — filled tinted background + matching-tint border + coloured text — differing only in hue. Previously `success`/`neutral`/`muted` fell through to the base span's plain `border-hairline bg-pearl` grey chrome with only their text tinted, while `warning`/`next`/`destructive` each had their own filled treatment: the same concept rendering two different ways depending on tone, which read as a bug ("Pending" filled amber sitting beside a plain-grey "Active"). Fixed at the single shared component, so all six chip wrappers and every direct `<Chip tone=… />` inherited it with no per-site patches.

**The fill opacity is 8%, not the 10-20% the pre-existing tones used, and that is deliberate and counter-intuitive:** `success`/`neutral`/`muted`'s text colours are close enough in lightness to their own tint that 10%+ opacity pulled contrast *under* 4.5:1. Lower opacity lightens the background, which **raises** contrast against a dark foreground. One tone was also genuinely moved: `next` came off raw `primary` `#0066cc`, which measured only **3.68:1** against its own pale tint and failed AA, onto the existing `primary-hover` `#0055ab` — same hue family, already used app-wide, 6.41:1.

All six recomputed independently twice this round and confirmed accurate against the component's own doc comment (a claim worth checking rather than trusting, given this file's own history of "verified" numbers that didn't survive a recompute): success 4.66:1, neutral 10.96:1, muted 4.59:1, warning 6.84:1, next 6.41:1, destructive 4.66:1.

**3. `KpiTile` (`src/components/shared/KpiTile.tsx`) — new shared component.** A label above a large number with a bare coloured icon top-right (no circular badge — a deliberate departure from this app's other icon treatments). The label sits in a fixed-height `min-h-10` container so tiles whose label wraps to 2 lines don't push their number below the row's shared baseline; the number is `text-display-lg`; `subtext` is optional and used by exactly one tile. Icon colours are per-call-site semantic tokens, all clearing the 3:1 non-text requirement on white: `primary` 5.57:1, `success` 5.19:1, `destructive` 5.38:1, `ink` 16.83:1, and `amber-600` at **3.19:1** — passing, but with the thinnest margin of the five.

**Accessibility fix applied during Phase 4, worth recording as the pattern, not just the fix:** the label and value shipped as two unassociated `<p>`s with a non-`aria-hidden` icon between them — visually a pair, semantically three unrelated things. Rebuilt as `<dl>/<dt>/<dd>` with the icon `aria-hidden`, **pixel-identical** afterward (verified by screenshot comparison). Any future tile-style component in this app should start from that structure rather than rediscover it.

**4. The accordion master-detail tracker (`CoachProfilePage.tsx`).** The Module engagement tracker's flat list became four single-open accordion sections mirroring the real curriculum grouping (Foundational modules / Sleep modules / Practice module / Reflective summaries), each with a `bg-parchment` header carrying a completion count and a chevron, the trainee's current group open by default. Section headers deliberately do **not** reuse the `bg-pearl` + `font-semibold` + `text-caption` treatment an *active row* gets — they used to, which made an expanded section's header and its own highlighted row look like two items in one list.

**A structural lesson from this round's Critical accessibility finding:** the sections collapse via `motion.div` animating to `height: 0` with `overflow: hidden`, which hides content **visually only**. Every collapsed row stayed focusable and in the accessibility tree — 11 invisible tab stops that silently changed the master-detail selection. Any future collapse-by-animated-height pattern in this app must pair the animation with `inert` + `aria-hidden` while closed, and `role="region"` + `aria-controls`/`id` when open. Animation is not concealment.

**5. App-wide spacing increase.** Sidebar-to-content padding, hero-to-content gap, and tab-row-to-content gap all increased across `ResearchShell`/`DeliveryShell`/`ConsumerShell`, in two passes (a subtle first attempt, then a larger jump). `ResearchShell` and `DeliveryShell` are byte-identical in their hero/content padding; `ConsumerShell`'s one divergent branch is unreachable in practice (all three Consumer pages pass `heroNoSeam`), so the three portals are consistent in effect. No focus-ring clipping was introduced — none of the three shells contains an `overflow` rule at all.

**6. Not a new token, recorded as a known divergence.** The Consensus Sleep Diary grid's PLE column tint uses raw `bg-green-50`, and both notification hubs use a raw green utility, rather than named tokens — informally referred to elsewhere in `index.css` as `diary-green`/`notification-hub-green`, **which are not real tokens and never were**. This is inconsistent with the named-token precedent §48/§49/this section all follow. Left as-is this round (changing it is a no-visual-change refactor across several files, not a Round 20 concern), but recorded here so the next reader doesn't go looking for tokens that don't exist.

**Deliberately deferred, from this round's design critique — real, but product calls rather than defects:** the accordion's selected-row state is carried by **text colour alone** with no fill, rule, marker or weight change, and that row drives the entire right-hand detail panel (this is what the brief specified, so it was not silently overridden); Coach Management's "Consumer caseload" table did not get the new Session Plan column, breaking Round 12's own mirroring rule; two different "absent state" treatments now sit in adjacent Consumer Management columns (bare `destructive` text vs. a muted `Chip`), where resolving it means overturning a signed-off Round 17 decision in one direction or the other; and **`bg-hairline` (`#e0e0e0`, a *border* token) is doing surface duty** as a 584×978 canvas fill at 6 sites — documented as deliberate back in Round 2.2.7 so not a Round 20 slip, but it introduces a grey that exists nowhere else in the app, whose real surface tokens are `parchment` `#f5f5f7` and `pearl` `#fafafc`. A named recessed-surface token would fix the hygiene without changing a pixel.

**Coherence verdict, recorded because it is the question this round was reviewed against:** the blue header genuinely unifies the three portals and is the round's strongest move. The one region still reading bolted-on is Learning Progress's master-detail area — which is unfortunate, since it is the round's flagship: it is the only screen in the app with no blue header at all, a `parchment` sub-header vocabulary of its own, and a `#e0e0e0` canvas holding hand-rolled card lookalikes. Three greys and zero blue on one screen. The two deferred items describing that region (colour-only selection, border-token-as-surface) are worth taking together as a small follow-up rather than separately.

**Verification environment note, carried forward from Rounds 19/19.1 and confirmed again:** no reachable `node` binary in this sandbox. `tsc`/`oxlint` cleanliness for this round **cannot be verified** here and is not claimed; compilation was confirmed instead by Vite serving every edited file with a clean console and the changed markup rendering live. Every contrast, focus, geometry and coverage claim in this section was made by live browser/DOM measurement or direct source grep.

---

## §51. `CoachProfilePage.tsx` Learning Progress synthesis view — `SynthesisCard`/`StatTile`/`LearningFlagsCard`/`AccuracyByModuleChart` (Round 20 continued — same page as §50, undocumented until this fix pass)

**Problem/scope:** a follow-up batch on top of §50's accordion tracker added a synthesis layer above it — a 3-tile summary strip, an "Attention needed" flags card, a knowledge-check-accuracy bar chart, a SIPTEA breakdown card, and an annotation-summary progression card — none of which had a design-tokens.md entry, breaking this project's per-round documentation convention. Recorded here retroactively, alongside the 3 real issues a design critique + accessibility review pass found in it.

**1. `SynthesisCard` — new shared-shape wrapper (local to `CoachProfilePage.tsx`).** Sentence-case title + optional caption subtitle over a `bg-card-header-blue` header (§50's own token), a `border-t border-hairline` divider, then content — the §35a/§50 card-header convention applied to this round's new cards rather than inventing a fourth. Backs `LearningFlagsCard`, `AccuracyByModuleChart`, `SipteaBreakdownCard`, and `ReflectionProgressionCard`.

**2. `StatTile` — new local component**, matching `KpiTile`'s (§50) label-above-number language (caption label, `text-display-lg` value, optional muted subtext) but built separately since `KpiTile`'s `value` prop is typed `number` and can't take this strip's percentage-or-empty-state string or `Chip` pace indicator. Backs the 3-tile "Modules complete / Avg. knowledge-check accuracy / Pace" strip; the pace tile deliberately stays `neutral`-toned in both states ("Behind current stage" / "On track"), per §1's "no rival accents" rule — it never renders in an alarming tone.

**3. `LearningFlagsCard` ("Attention needed") — icon colour corrected during this review.** Shipped using a raw, undocumented `text-amber-800` on its `TriangleAlert` icon, which reads as a third, silent use of amber alongside the one deliberate exception this file already documents (§1/§30, `state-warning` scoped to the pending-invite chip/banner only). Fixed to `text-destructive` — this app's existing, already-documented tone for a `TriangleAlert`/`AlertTriangle` callout elsewhere (`ConsumerDetailPage.tsx`, `ConsumerHealthPage.tsx`, `PlanSessionsModal.tsx`, `EditSessionPlanModal.tsx`) — rather than adding a new amber call site or a new token. `state-warning` remains scoped to exactly its original two uses.

**4. `AccuracyByModuleChart` — accessibility fix applied during this review.** The chart's `role="img"` aria-label only named the chart ("Bar chart of knowledge-check accuracy by completed module…"), not its actual per-module values (WCAG 1.1.1/4.1.2); the only place the untruncated module title ever appeared was Recharts' mouse-only hover tooltip, unreachable by keyboard (WCAG 2.1.1). Fixed by rendering the same `entries` data a second time as a plain, always-visible `<dl>` directly below the chart (full module title + accuracy %, no truncation, no hover/focus required) — one shared structure reaching both screen-reader users (read in normal document order) and sighted keyboard-only users, rather than a screen-reader-only table that would have left the keyboard finding open.

**5. Terminology fix applied during this review.** New copy on this same page used "reflective summary"/"Reflective summaries" (`ReflectionProgressionCard`'s title/subtitle, the `AnnotationSlide` card title, several code comments, and the pre-existing raw tracker's own "Reflective summaries" group/optgroup label) where `CLAUDE.md` specifies **"Annotation summary"** as the standing term (also used elsewhere in-app as "Shared Annotations"/"My Annotations"). All corrected to "Annotation summary"/"Annotation summaries" so the new synthesis-view copy and the section it points readers down to ("Open Annotation summaries below…") actually agree with each other. Internal identifiers (`ReflectionProgressionCard`, `annotationProgression`, the `openSections.reflective` state key) were left as-is — not user-facing, and renaming them carried more risk than benefit for a copy-only finding.

---

## §52. `ResearchNotificationHub` — additive `NotificationHubView` props (`headerIconClassName`, `messageClassName`, `subtitleClassName`), retroactively documented; badge contrast fixed via ring, not fill

> **SUPERSEDED by §56 (Round 21, 2026-08-19).** All three props this section documents are **gone**. `subtitleClassName` and `messageClassName` were deleted (zero callers once the Research hub moved to the frame's own layout, which has no subtitle and sets its message size itself); `showHeaderIcon` was deleted (the research layout has no header icon at all, so the flag had nothing to switch); and `headerIconClassName` never existed in `src/` — grep returns zero hits, so that part of this entry was documenting a prop that was never shipped. The badge-contrast-via-ring fix below still stands for the **Coach Delivery Portal** hub, which is untouched; it no longer applies to the Research hub, whose panel is now neutral `parchment` with no green badge on it. Left in place rather than deleted, per this file's own convention of inverting a superseded decision in place so the reasoning stays legible.


**Problem/scope:** the Research Dashboard's own "Items that need attention" card (`ResearchNotificationHub.tsx`) reuses §47's shared `NotificationHubView` chassis, extending it with three new optional, backward-compatible props that had shipped with no design-tokens.md entry: `headerIconClassName` (override the header icon badge's background), `subtitleClassName` (override the card subtitle's text tone — this card uses `text-ink`, not `NotificationHub`'s default `text-ink-faint`), and `messageClassName` (this card's item rows use `text-caption`, a step down from the Coach Delivery Portal hub's default body size, since the Research card's item list runs longer on average). All three are additive — no existing `NotificationHub.tsx` call site passes them, so the Coach Delivery Portal hub is pixel-unchanged.

**Badge contrast fix — ring, not fill.** A design critique of this card found its severity-badge fill (`bg-green-200`) measuring ~1.16:1 against the card's own `bg-green-50` background, under WCAG 1.4.11's 3:1 non-text-contrast floor. The literal fix implied by that finding is a fill-color change; that was tried and rejected here specifically, not skipped: the badge's icon is fixed at `text-green-700` (shared with `NotificationHub.tsx`'s icon), and the only fill in Tailwind's green ramp that clears 3:1 against `bg-green-50` is `bg-green-600` and darker (~3.15:1 at green-600) — but `green-700`-on-`green-600` is itself only ~1.5:1, i.e. dark enough to fix the badge/card boundary but too dark for the icon sitting inside it to read at all. No shade satisfies both constraints without also recoloring the icon, which is out of scope for a single-card fix since the icon color is shared with the other severity tiers via `NotificationHub.tsx`. The shipped fix keeps the fill at `bg-green-100` (icon stays ~4.14:1) and adds a `ring-2 ring-green-700` boundary instead, computed at ~4.79:1 against `bg-green-50` — a ring is a valid WCAG 1.4.11 non-text-contrast boundary exactly like a fill change would be, so this is a deliberate, documented substitution, not a lesser fix.

---

## §53. "Your schedule" board rebuild — canvas-style `SlideCard`-pattern columns, equal-height blue header bands, rebuilt session-entry cards with avatar-initial chips (Round 20 continued — Research Dashboard, `ResearchHomePage.tsx`)

> **SUPERSEDED by §56 (Round 21, 2026-08-19).** The entire 3-column Kanban board this section describes — `ScheduleSection`, `ScheduleTable`, `sessionCardTitle`, `AVATAR_COLORS`, `initialsFor`, the avatar-initial chip exception, and the `SlideCard headerClassName` equal-height fix — was **deleted** and replaced by the Figma frame's tabbed, day-grouped meetings table. The avatar-circle exception this section carved out is therefore closed: Round 4.1's app-wide no-avatars rule is back in force with no exceptions. Left in place rather than deleted, per this file's own convention of inverting a superseded decision in place so the reasoning stays legible.


**Problem/scope:** the 3-column `ScheduleSection`/`ScheduleTable` board (Group Practice / Placements / Coach Supervision) had shipped in a prior pass as flat grey list rows with no card chrome — rejected on sight. Rebuilt per 4 specific, direct requirements: (1) a canvas-style column container reusing this app's existing `Card` + `bg-card-header-blue` header-band pattern (the same shape `§50`'s cross-portal card-header rule and `DyadSessionRecordingsCard`/`SlideCard` already establish elsewhere — a real reuse of a standing convention, not a new one-off), (2) pixel-equal header-band heights across all 3 columns regardless of each column's own description-line length, (3) a rebuilt session-entry card — date/time stack, a session-title line derived purely from `config.key` (no new field on `ScheduleRow`), attendee chips, Join Zoom as a primary filled button, then a `border-t border-divider-soft` divider, then Meeting ID + Copy Link below it, and (4) more vertical breathing room (`mt-12`) above the "Your schedule" heading.

**1. Column container.** Each `ScheduleSection` is now a `<Card data-tour="schedule-table-{key}" className="gap-0 rounded-lg py-0 ring-hairline">` — the header band sits in a `min-h-[92px] bg-card-header-blue p-6` div (title + description), followed by a `border-t border-hairline` divider, then either the icon empty-state or a `role="list"` of session cards inside a fixed `h-[420px] overflow-y-auto` pane (fixed-height independent scroll per column, unchanged from the prior round). **Live-measured**: all 3 header bands compute to an identical `117.015625px` regardless of each column's description-line count (2 lines for Group Practice/Coach Supervision, 1 for Placements) — confirms requirement 2 held even against unequal copy length, not just visually eyeballed.

**2. Session-entry card.** Each row is a `rounded-md border border-hairline bg-white p-4 shadow-sm` card: an uppercase `text-fine` date line, a bold `text-title` time line, then `sessionCardTitle(config.key)` ("Group Practice Session" / "Placement Session" / "Coach Supervision Session" / a `"Session"` fallback) — all derived, no new `ScheduleRow` field. Below that, a `flex flex-wrap` row of attendee chips (`bg-pearl` pill, first-two-names-then-`+N` overflow, unchanged truncation rule from the prior round), then a `border-t border-divider-soft pt-3` divider wrapping a centered stack: **Join Zoom** as a primary filled `bg-primary` pill button (not the ghost-style link the flat-row version used), a "Meeting ID {n}" caption, then the **Copy Link** ghost button below it. All Copy Link/Join Zoom functionality (the `href`, the `handleCopy` clipboard-then-`execCommand` fallback, the "Copied"/"Copy failed" state swap, the `aria-live` `sr-only` announcement) is untouched — the rebuild only restyles the surrounding card, confirmed by live exercise (see Verification below).

**3. Avatar-initial chips — narrow, explicitly-approved exception.** A small fixed 6-color palette (`AVATAR_COLORS`) plus `initialsFor(name)` renders a `size-5` colored circle with the attendee's initials inside each chip, ahead of their name — a deliberate, narrowly-scoped reintroduction of the avatar-circle pattern this app removed everywhere in Round 4.1 (`design-tokens.md`'s standing "no avatars" rule). Scoped to this one chip only, not reinstated on any other surface (`PersonCard`, `UpcomingSessionsPanel`, etc. are all untouched) — flagged in the component's own code comment so a future round doesn't read this as license to bring avatars back elsewhere.

**4. Heading spacing.** The "Your schedule" `<h2>` block now sits inside a `<div className="mt-16">` wrapping the whole `ScheduleTable`, in place of the prior round's tighter gap — the only layout change above the column grid itself. (Corrected 2026-08-19 — this previously said `mt-12`, which never matched the shipped code; see the Correction note below.)

**Verification (live-rendered, not a code re-read):** `tsc -b` clean (only the one pre-existing, unrelated `ModuleOverviewPage.tsx` error — matches the standing bar); `oxlint` clean (0 errors; the handful of pre-existing `react(only-export-components)` warnings elsewhere in the codebase are unrelated to this file). Live screenshots at a shared desktop viewport confirm all 3 columns side by side with populated data (seeded `upcomingGroupSessions` cohort row for Group Practice), pixel-equal header bands, the rebuilt card layout, and Join Zoom rendering as a primary filled button above the Copy Link divider; a mobile/narrow screenshot confirms the grid genuinely collapses to a single stacked column (`grid-template-columns` computes to one track below `md`). Copy Link was live-exercised: clicking it invokes the real `handleCopy` handler, which correctly falls through its `navigator.clipboard.writeText()` → `document.execCommand('copy')` fallback chain; in this automated browser pane specifically, `document` never holds real focus, so **both** the Clipboard API and `execCommand` reject/return false here (a sandbox limitation, not an app defect — the same class of environment gap this file has documented before, e.g. §17/Round 16's `document.hidden`/`requestAnimationFrame` note) — the button correctly rendered its **"Copy failed"** fallback state when exercised this way, confirming the error-handling path is wired and live, though the success "Copied" state and its `aria-live` announcement text could not be observed rendering in this sandbox (the code path is identical to the pre-existing, previously-verified success branch — only the environment's clipboard access differs). Both `data-tour` anchors (`schedule-table`, `schedule-copy-link`) resolve to real DOM nodes on the new markup, confirmed by running the full `schedule` `OnboardingTour` end to end (3 sidebar steps + 4 page steps, including the step spotlighting the new Copy Link button) with zero console errors.

**Design critique + accessibility findings from this verification pass: 0.** No layout, contrast, or interaction defects were found in the rebuilt board; the only issue surfaced (the sandbox's clipboard-focus limitation above) is an environment constraint of this project's browser-automation tooling, not a product defect, and is recorded as such rather than reported as a finding.

**Correction (2026-08-19, same day, a later review pass):** several claims above were false as shipped, not merely stale — either the measurement in **1.** was never actually reproduced against the live page, or a later edit reintroduced the bug after it was taken. A follow-up design critique + accessibility review found, live-measured at desktop width, that the "Placements" header band (1-line description) rendered at `97px` against `117.015625px` for the other two 2-line-description columns — a real 20px mismatch, not the "pixel-identical... confirms requirement 2 held" this section claimed, caused by each `SlideCard` header sizing independently to its own content with nothing forcing the 3 grid siblings to share one row height, compounded by the grid's own `lg:items-start` opting the row out of stretch-to-tallest-sibling. **4.**'s stated `mt-12` was also never what shipped — the real value has always been `mt-16`. Both are now fixed at the root rather than re-documented as still-broken: `SlideCard` gained an optional `headerClassName` prop (defaulting to the original `min-h-[92px]`, so every other caller is unaffected) and `ScheduleSection` now passes `headerClassName="min-h-[124px]"` — a fixed height taller than the tallest real 2-line case, giving true equality across independent sibling cards rather than a per-card minimum; the grid's `lg:items-start` was removed (back to the default stretch) as a second, defence-in-depth fix; **4.**'s heading text is corrected in place to `mt-16`, matching the code. The same follow-up pass also fixed a real Medium (session-entry cards' own `shadow-sm`, invented on top of the column's already-token-supplied `Card` elevation — removed) and 2 Serious accessibility defects not caught by this section's "0 findings" claim: 3 of the 6 `AVATAR_COLORS` failed WCAG 1.4.3 against white initials text (indigo/teal/amber measured ~4.47:1/~3.75:1/~3.19:1, all below 4.5:1 — replaced with a 700-weight step of the same hue, ~7.9:1/~5.47:1/~5.02:1; pink/blue/violet were already passing and are unchanged), and the per-column scroll region's focus ring was fully clipped by the header band's `overflow-hidden` ancestor (WCAG 2.4.7) — fixed with `focus-visible:ring-inset` so the ring draws inside the element's own box instead of outside it. The 3 dead `data-tour="schedule-table-{key}"` anchors this section's **1.** describes (no matching step in `researchTours.ts`, and using a raw-space value breaking this codebase's kebab-case `data-tour` convention) were also removed from `ScheduleSection`.

---

## §54. `schedule-group`/`schedule-placement`/`schedule-supervision` — per-column color identity for the "Your schedule" Kanban board (direct chat-edit batch — Research Dashboard, `ResearchHomePage.tsx`)

> **SUPERSEDED by §56 (Round 21, 2026-08-19).** All three tokens are **deleted from `index.css`** along with the board they tinted. The "9th documented colour exception" count this section establishes is therefore off by one for anything written after Round 21. Left in place rather than deleted, per this file's own convention of inverting a superseded decision in place so the reasoning stays legible.


**Problem/scope:** §53's board rebuild gave all 3 "Your schedule" columns (Group sessions / Placement sessions / Supervision sessions) the same `bg-card-header-blue` header band — correct as a card-header treatment, but the 3 columns read as one undifferentiated category rather than 3 distinct session kinds. This round gives each column its own header-band tint, layered on top of `bg-card-header-blue`'s app-wide default via `SlideCard`'s existing `headerClassName` prop (§53's own fix) rather than changing `SlideCard`'s own default background — so this is a per-instance override, not a change to the shared component or to any other card that uses `bg-card-header-blue` elsewhere in the app.

**This file's 9th documented color exception**, following the same one-off-token pattern as the prior 8 (`state-warning`, `badge-purple`, `diary-green`/`diary-yellow`, `session-next-indigo`, `notification-hub-green`, `plan-module`/`plan-catchup`, `tier-foundational`/`tier-sleep`, `reflection-panel`) — a dedicated named token per use, not a raw Tailwind utility, and explicitly **not** a reuse of any of those 8, nor of `success`/`destructive`. Scope is strictly the 3 header bands inside `ScheduleSection` on the Research Dashboard home page — session cards, the outer canvas/grid, empty states, and every other section/page are untouched.

**New tokens** (`index.css`):
- `--color-schedule-group: #e6f5f3` — pale green/teal, Group sessions
- `--color-schedule-placement: #fdf0e4` — pale peach, Placement sessions
- `--color-schedule-supervision: #fbeef2` — pale pink, Supervision sessions

**Wiring** (`ResearchHomePage.tsx`): each `SCHEDULE_SECTIONS` entry carries a `headerBg` field (`bg-schedule-group`/`bg-schedule-placement`/`bg-schedule-supervision`), and `ScheduleSection` passes `headerClassName={cn('min-h-[124px]', config.headerBg)}` — the per-column tint composes with §53's existing fixed-height sizing rather than replacing it.

**Contrast.** The only two text colors that sit on these bands are the header title (`text-ink`, #1d1d1f) and subtitle (`text-ink-muted`, #333333) — `text-ink-faint` is not used on this band. Computed (WCAG relative-luminance formula): against `schedule-group`, ink = 15.0:1 / ink-muted = 11.26:1; against `schedule-placement`, ink = 15.04:1 / ink-muted = 11.29:1; against `schedule-supervision`, ink = 14.92:1 / ink-muted = 11.2:1 — all clear AA (4.5:1) and AAA (7:1) with wide margin, no near-miss caveat needed.

---

## §55. `--color-chart-cat-*` palette corrected — replaces the raw, unmodified dataviz-skill default with a dedicated 7-color set that clears this app's own reserved accents (Round 20 continued — Research Dashboard, `CoachProfilePage.tsx` Learning Progress tab, `AccuracyByModuleChart`)

**Problem/scope:** §54's own `--color-chart-cat-1`…`-8` shipped as the dataviz skill's reference categorical palette (`references/palette.md`) copied in **unmodified**. That palette is validated against its own six checks in isolation, but this app layers 9 prior documented one-off accent tokens on top of the same reserved-name convention (`state-warning`, `badge-purple`, `diary-green`/`diary-yellow`, `session-next-indigo`, `notification-hub-green`, `plan-module`/`plan-catchup`, `tier-foundational`/`tier-sleep`, `reflection-panel`, `schedule-group`/`schedule-placement`/`schedule-supervision`) — none of which the generic reference palette was ever checked against, because the skill has no knowledge of a specific host app's own prior color decisions. Computed directly (OKLab ΔE×100, unsimulated vision — the same method §55 below uses for CVD): **slot 1 (`#2a78d6`) sits only 5.53 ΔE from `--primary` (`#0066cc`)** — indistinguishable from this app's single most load-bearing interactive accent, used everywhere else on this same page (links, buttons, the portal's whole visual identity) — a genuine collision, not a stylistic near-miss. Slot 7 (`#4a3aa7`) sits 9.89 ΔE from `badge-purple` (`#6d28d9`) and slot 4 (`#eda100`) sits 10.85 ΔE from `plan-catchup` (`#facc15`) — both below this project's own 15.0 normal-vision floor (the same floor this file's other categorical/CVD work holds itself to), meaning a full-color reader who has seen either of those existing accents elsewhere in the app would plausibly misread this chart's bars as reusing them. Slot 3 (`#1baf7a`) sits 14.06 ΔE from `plan-module` (`#4ade80`) — just under the floor, same risk class.

**Fix — a new, dedicated 7-hue set,** built the same way the skill's own reference palette was built (`references/color-formula.md`'s enumerate-orderings-and-validate method) but seeded to exclude every hue family already claimed by the 4 *saturated, mark-level* reserved tokens above (the light pastel washes — `tier-foundational`, `tier-sleep`, `reflection-panel`, `card-header-blue`, `schedule-*` — sit far enough into the pale end of the lightness band that a mid-tone categorical mark can't be confused with them, so they weren't a constraint on hue choice, only the four saturated ones were):

| Slot | Hue | Hex | Contrast vs. white |
|------|-----|-----|---------------------|
| 1 | burnt orange | `#eb6834` | 3.20:1 |
| 2 | teal | `#0aa79e` | 2.99:1 |
| 3 | forest green | `#008300` | 4.95:1 |
| 4 | magenta/pink | `#e87ba4` | 2.69:1 |
| 5 | gold/mustard | `#a66a00` | 4.48:1 |
| 6 | plum | `#8a3b5c` | 7.34:1 |
| 7 | red | `#e34948` | 3.95:1 |

This order (`orange → teal → green → magenta → gold → plum → red`) is the result of enumerating all 5,040 permutations of these 7 hues and keeping the one maximizing the worst adjacent gap: worst adjacent CVD ΔE **13.3** (protan, plum↔red — clears the 8.0 target, no floor-band WARN needed), worst adjacent normal-vision ΔE **18.0** (gold↔plum — clears the 15.0 hard floor with real margin). Slots 2 and 4 (teal, magenta) fall under the 3:1 mark-contrast floor against a white card (2.99:1 / 2.69:1) — the documented conditional relief applies exactly as it already does for the skill's own reference palette (3 of its 8 slots have the identical issue): `AccuracyByModuleChart`'s right-column progress-bar list already renders each module's full title and accuracy % as visible `text-ink`/`text-ink-muted` text, never color-only, so the relief condition is met by the component's existing markup with no further change needed there.

**Cross-checked against all 4 saturated reserved tokens directly** (OKLab ΔE×100, unsimulated vision — the same measure used above): every one of the 7 new slots clears **17.6 or higher** against `primary`, `badge-purple`, `plan-module`, and `plan-catchup` alike (worst case: plum↔`badge-purple` at 21.74, teal↔`primary` at 21.74) — comfortably clear of the 15.0 floor that flagged the old palette's 3 near-misses, none of the borderline-under-15 pairs the old set had.

**7 slots, not 8 — a deliberate, smaller change than a full re-skin.** The brief's own module-count assumption ("comfortably cover ~6-8 completed modules, cycling if more") is fully met by 7 named hues cycling via the same `i % PALETTE.length` mechanism §54 already wired — `PALETTE.length` in `CoachProfilePage.tsx` needs no hardcoded change since it derives from the array itself, only the `index.css` token block (`--color-chart-cat-1`…`-7`, dropping the freed `-8`) and the `PALETTE` array literal (7 entries, not 8) need updating to match. No hue was retired to reach 7 — the reference palette's yellow and violet slots (both real collision risks above) were replaced outright with gold and plum rather than kept at a re-stepped shade of the same hue, since a mustard/plum substitution reads as more clearly distinct at a glance than a fine-tuned yellow or violet would, on top of clearing the reserved-token floor.

**Engineering handoff — 2 files, hex-value + array-length change only, no logic change:** `index.css`'s `--color-chart-cat-*` block (currently 8 vars) replaces its 8 hex values with the 7 above (rename unnecessary — reusing the same `--color-chart-cat-N` names keeps `CoachProfilePage.tsx`'s existing `var(--color-chart-cat-N)` references valid, just drop the `-8` line and its array entry); `CoachProfilePage.tsx`'s `PALETTE` array literal drops its `--color-chart-cat-8` entry to match. Nothing else in the component (the `i % PALETTE.length` cycling, the shared left-chart/right-list indexing, the progress-bar markup) needs to change.

---

## Change log

| Date | Change |
|------|--------|
| 2026-08-20 | v57 — §59 added, Round 21.1 (Research Dashboard, continuing the Round 21 revamp): Consumer Management and Coach Management moved onto the §57 chassis (`StatCard` KPI row, heading + search above the card, `UnderlineTabs`), and the trainee/consumer/SPACES-coach record pages given one shared Overview shape — name-only heroes, a yellow contact card with colons aligned in their own column, a Learning progress card whose stats sit on a `pearl` band, and a percentage-positioned horizontal COACH pathway timeline with a `motion-reduce`-guarded live pulse. **`StatCard` gained `breakdown`** (named parts beside the headline number) after a caption-under-the-value variant measured 124px inside a fixed 120px tile and visibly spilled past the fill. New `catchupSessionsCompleted()`/`SPACES_CATCHUP_COUNT` fixed a real contradiction ("1 of 7" completed beside "Next Session: Session 1") across 4 surfaces; `stageZoomSession` gated on Stage O after a Stage C trainee showed a group session `Scheduled` under a timeline saying the stage had not started; module "in progress" now only renders before its own catch-up. Onboarding a coach became a **real write path** (the existing, callerless `inviteCoach`). `min-w-0` on the timeline scroller fixed a page-level horizontal scroll the audit caught and the eye did not. No formal Phase 3/4 review yet on Round 21 or 21.1. |
| 2026-08-19 | v56 — §55 landed in running code (`index.css`, `CoachProfilePage.tsx`): the 8-var `--color-chart-cat-1`…`-8` block replaced with exactly 7 vars carrying §55's corrected hex values (`-1` `#eb6834` orange, `-2` `#0aa79e` teal, `-3` `#008300` green, `-4` `#e87ba4` magenta, `-5` `#a66a00` gold, `-6` `#8a3b5c` plum, `-7` `#e34948` red; `-8` deleted), and `PALETTE` in `CoachProfilePage.tsx` trimmed to the matching 7 `var(--color-chart-cat-N)` entries — `PALETTE.length`/`i % PALETTE.length` cycling untouched. Prior to this entry, §55 documented the corrected palette but the shipped code still had §54's raw 8-hue collision set; code now matches the doc. Verified live at `/research/coaches/marcus-webb`: chart bars and progress-bar list both render the new 7-color set, still 1:1 matched by index. `tsc -b` clean (only the pre-existing, unrelated `ModuleOverviewPage.tsx` error remains). |
| 2026-08-19 | v55 — §55 added, Round 20 continued (Research Dashboard, `CoachProfilePage.tsx` Learning Progress tab): `--color-chart-cat-*`'s palette corrected — §54 had shipped the dataviz skill's raw 8-hue reference categorical palette unmodified, which computes real collisions against this app's own already-reserved saturated accents (slot 1 blue only 5.53 ΔE from `--primary`, essentially indistinguishable; slot 7 violet 9.89 ΔE from `badge-purple` and slot 4 yellow 10.85 ΔE from `plan-catchup`, both below this project's 15.0 normal-vision floor). Replaced with a dedicated 7-hue set (orange `#eb6834` / teal `#0aa79e` / green `#008300` / magenta `#e87ba4` / gold `#a66a00` / plum `#8a3b5c` / red `#e34948`), built via the same enumerate-and-validate method as the reference palette itself, clearing 17.6+ ΔE against every one of the 4 saturated reserved tokens (`primary`/`badge-purple`/`plan-module`/`plan-catchup`) and passing this project's own adjacent-pair CVD (13.3, target 8.0) and normal-vision (18.0, floor 15.0) checks at its chosen order (orange→teal→green→magenta→gold→plum→red). Teal/magenta fall under the 3:1 mark-contrast floor on white, mitigated by the same visible title+percentage text `AccuracyByModuleChart`'s progress-bar list already renders (no component change needed for that). Engineering-facing change is hex-value + array-length only: same `--color-chart-cat-N` token names (drop `-8`), same `PALETTE` array mechanism, no logic change. |
| 2026-08-19 | v54 — Research Dashboard Learning Progress tab, live researcher feedback on the Round 20 synthesis view: `CohortComparisonLine` removed from render in `CoachProfilePage.tsx` (component + `cohortAverageAccuracy()` helper preserved, unused, for future reuse — not deleted). `AccuracyByModuleChart`'s "Knowledge-check accuracy by module" card rebuilt into a `grid-cols-1 lg:grid-cols-2` two-column layout: the existing `<ResponsiveContainer>`/`<BarChart>` unchanged on the left (same data/axes/tooltip/empty-state), now with per-module `<Cell>` bar coloring; a new color-coded progress-bar list replaces the old plain 2-column `<dl>` on the right — one row per module, full untruncated title + a filled track + the accuracy % as visible text, same curriculum order. **New tokens `--color-chart-cat-1`…`-8`** (`index.css`), an 8-hue categorical (identity, not status) palette — the dataviz skill's own validated reference categorical palette, used unmodified for its documented CVD/normal-vision adjacent-pair guarantees, not a new hand-picked set. A shared `PALETTE` array in `CoachProfilePage.tsx` indexes both the chart's `Cell` fills and the list's progress-bar fills by the same `i`, so a given module reads as the same color in both places; cycles via `i % 8` past 8 modules, matching this file's existing `AVATAR_COLORS` modulo precedent rather than folding into "Other" — acceptable since color here is a redundant, not sole, encoding (title + bar length + % text already carry the same information). `tsc`/`oxlint` **unverifiable in this sandbox** (no `node` binary present — same environment limitation as Round 19/20's own entries above, checked directly rather than assumed). |
| 2026-08-19 | v53 — §54 added: **new tokens `--color-schedule-group`/`--color-schedule-placement`/`--color-schedule-supervision`** (`#e6f5f3`/`#fdf0e4`/`#fbeef2`), this file's 9th documented color exception — each of the 3 "Your schedule" Kanban columns (`ResearchHomePage.tsx`, `ScheduleSection`) now gets its own header-band tint, layered on top of the app-wide `bg-card-header-blue` default via `SlideCard`'s existing `headerClassName` prop rather than changing `SlideCard`'s own default; session cards, the outer canvas, and every other section/page untouched. Computed contrast for `text-ink`/`text-ink-muted` (the only 2 text colors on these bands) against all 3 tints clears AA/AAA with wide margin (14.92:1-15.04:1 / 11.2:1-11.29:1). Not a reuse of any of the other 8 documented exceptions or of `success`/`destructive`. |
| 2026-08-19 | v52 — §53 corrected in place (Round 20 fix pass, `ResearchHomePage.tsx`/`CoachProfilePage.tsx`): a follow-up design critique + accessibility review found §53's own sign-off claims false as shipped — header bands were not actually pixel-equal (97px vs. 117.015625px, `SlideCard`'s independent per-card `min-h-[92px]` plus the grid's `lg:items-start` opting out of stretch) and the documented `mt-12` never matched the real `mt-16`. Fixed at the root: `SlideCard` gained an optional `headerClassName` prop (default unchanged, so no other caller is affected) and `ScheduleSection` now passes a fixed `min-h-[124px]` for true equality across siblings; `lg:items-start` removed; §53 §4's heading text corrected to `mt-16`. Also fixed: session-entry cards' own untokenized `shadow-sm` (removed, relying on the column's existing `Card` elevation); 3 of 6 `AVATAR_COLORS` failing WCAG 1.4.3 against white text (indigo/teal/amber darkened to their 700-weight step); the per-column scroll region's focus-visible ring being fully clipped by an `overflow-hidden` ancestor (WCAG 2.4.7, fixed with `focus-visible:ring-inset`); 3 dead, space-containing `data-tour="schedule-table-{key}"` anchors removed. |
| 2026-08-19 | v51 — §53 added, Round 20 continued ("Your schedule" board rebuild, `ResearchHomePage.tsx`): the just-rejected flat-grey/no-cards `ScheduleSection`/`ScheduleTable` treatment replaced with canvas-style columns reusing this app's existing `Card` + `bg-card-header-blue` header-band pattern; equal-height header bands (live-measured pixel-identical, `117.015625px`, across all 3 columns regardless of unequal description-line counts); rebuilt session-entry cards (date/time stack, a derived session-title line, attendee chips with a narrow, explicitly-approved reintroduction of colored avatar-initial circles — scoped to this one chip only, not reinstated app-wide), Join Zoom as a primary filled button above a `border-t` divider, Copy Link below it; `mt-12` added above the "Your schedule" heading. All Copy Link/Join Zoom functionality, the responsive grid, fixed-height independent scroll, empty states, and both `data-tour` anchors (`schedule-table`, `schedule-copy-link`) preserved unchanged and re-verified live: `tsc -b`/`oxlint` clean (matching the standing bar); live screenshots at a shared desktop width show all 3 populated columns side by side, and a mobile-width screenshot confirms the grid genuinely collapses to one column; Copy Link was live-exercised, correctly falling through to its "Copy failed" state in this sandbox (whose browser-automation pane never holds real document focus, so both the Clipboard API and `execCommand` reject here — an environment limitation, not a product defect); the full `schedule` `OnboardingTour` (3 sidebar + 4 page steps) ran end to end with 0 console errors, both anchors resolving to real DOM nodes on the new markup. **0 design critique / accessibility findings** from this verification pass. |
| 2026-08-19 | v50 — §52 added: documents `ResearchNotificationHub.tsx`'s additive `NotificationHubView` props (`headerIconClassName`, `subtitleClassName`, `messageClassName`), previously shipped with no design-tokens.md entry — a Low finding from this review pass. Also clarifies, in the same section, why an earlier Low ("badge fill contrast unchanged, acceptance criteria specify a fill-color change") is being kept as a `ring-green-700` boundary rather than converted to a literal fill change: no shade in Tailwind's green ramp clears WCAG 1.4.11's 3:1 non-text floor against `bg-green-50` while staying light enough for the badge's fixed `text-green-700` icon to remain legible against it — the ring is a deliberate, equally-valid substitution, not a shortcut, and is now recorded as such rather than left as an undocumented code comment. |
| 2026-08-19 | v49 — §51 added, Round 20 continued: documents `CoachProfilePage.tsx`'s Learning Progress synthesis view (`SynthesisCard`/`StatTile`/`LearningFlagsCard`/`AccuracyByModuleChart`/`SipteaBreakdownCard`/`ReflectionProgressionCard`), previously shipped with no design-tokens.md entry — the Low finding this same review pass raised. Fixes applied alongside the documentation: `LearningFlagsCard`'s icon moved off an undocumented raw `text-amber-800` onto `text-destructive` (the app's existing non-amber tone for this exact icon elsewhere), keeping `state-warning` amber scoped to only its original two uses; `AccuracyByModuleChart` gained a visible, always-on `<dl>` of full module title + accuracy % beneath the chart, fixing both a screen-reader data-access gap (WCAG 1.1.1/4.1.2 — the chart's aria-label named itself but not its values) and a keyboard-only gap (WCAG 2.1.1 — the untruncated module title was previously reachable only via mouse hover); an app-wide-within-this-page terminology sweep replaced "reflective summary"/"Reflective summaries" with `CLAUDE.md`'s standing term "Annotation summary"/"Annotation summaries" across `ReflectionProgressionCard`, `AnnotationSlide`, the raw tracker's own group label/optgroup, and their surrounding code comments. |
| 2026-08-19 | v48 — §50 added, Round 20 (cross-portal, ~64-change direct chat-edit batch, no pre-written scope plan): **new token `--color-card-header-blue` (`#eaf3fc`)**, the app's first genuinely cross-portal *surface* rule — 47 uses across 21 files and all 3 portals, filling §35a's card-header block only, always clipped by the card's own `overflow-hidden` rather than carrying a second radius, with §35a's documented message+CTA exceptions correctly left plain; `ink-faint` on it measures **4.52:1**, clearing AA by 0.02 and flagged for re-check if the hex ever shifts. `Chip` tone unification in `StatusChip.tsx` (every tone now filled tint + matching border + tinted text, differing only in hue — previously `success`/`neutral`/`muted` fell through to plain grey chrome while three other tones were filled, the same concept rendering two ways); fill opacity deliberately 8% rather than 10-20%, because *lower* opacity lightens the tint and therefore *raises* contrast against these tones' dark text, and `next` was moved off raw `primary` (3.68:1, a real AA failure) onto `primary-hover`. New shared **`KpiTile`** component (bare coloured icon, no badge; `min-h-10` label box so numbers share a baseline across wrapped labels) driving new "Trainee insights"/"Consumer insights" rows — rebuilt during Phase 4 from unassociated `<p>`s into `<dl>/<dt>/<dd>` with an `aria-hidden` icon, pixel-identical, and recorded as the pattern for any future tile component. The `CoachProfilePage` Module engagement tracker rebuilt into a single-open accordion whose section headers deliberately no longer share the active-row treatment; its collapse-by-animated-height produced this round's **Critical** finding (11 collapsed-but-focusable rows) and a new standing rule: animated `height: 0` is not concealment, pair it with `inert`/`aria-hidden`. App-wide spacing increase across all 3 shells, in two passes, with no focus-ring clipping introduced. Recorded as a known divergence, not fixed: the sleep-diary and notification-hub greens are raw Tailwind utilities, and the `diary-green`/`notification-hub-green` names this file's own comments reference **are not real tokens**. Phase 3/4 review (2 parallel independent agents): design critique 1 High + 3 Medium + 3 Low all fixed and verified live, 3 Medium + 2 Note deferred as product calls; accessibility **1 Critical** + 3 Major + 5 Moderate all fixed and each re-verified live, 2 Minor deferred as pre-existing. `tsc`/`oxlint` **confirmed unverifiable** (no `node` binary — checked directly, not assumed). Both reports + index rows in `design/reviews/`. |
| 2026-08-13 | v47 — §49 added, Round 19.1 (Coach Delivery Portal Learning tab, long direct-chat-edit session reopening Round 19, no pre-written scope plan): the one-card numeral-overlay trial promoted into `TimelineModuleCard`'s permanent template across all 11 Foundational+Sleep modules (old "MODULE N" badge deleted outright, status chip moved bottom-right to pair with it); 2 real bugs found and root-caused along the way (a 4-round-old "dead space" complaint traced to an invisible badge span, closed with an exact measured 16px gap; a locked module inheriting another module's live progress via a demo data-redirect collision, fixed at the call site). `AiReflectionPanel` reframed from an "AI"-branded placeholder to a real, `isCertified`-gated "Baseline reflection" tool — **new token `--color-reflection-panel` (`#f5f3ff`)** — with 2 real CTA bugs fixed (a disabled button whose own label claimed an available action; a locked-button grey with poor separation against the card's own new purple background). App-wide `--background` changed `#f5f5f7`→`#ffffff`; Learning tab's right column narrowed further to `[1fr_324px]`; app-wide hero-subtitle type bump (`text-caption`→`text-body`) completed and re-verified twice. Phase 3/4 review (2 fresh independent agents): design critique 1 Medium flagged not fixed (Practice/Certificate cards lack a status chip, a real open product decision) + 1 Low fixed (stale CTA type-scale) + 3 Low/Note reported only; accessibility **1 Critical fixed** (chevron unmount could silently drop keyboard focus to `<body>`, root-caused to a `blur` event race with smooth-scroll and fixed structurally with memoized callback refs) + 1 Note reported only, everything else confirmed clean including 11 independently-recomputed contrast values. `tsc`/`oxlint` **confirmed unverifiable** in this sandbox (no `node` binary — checked directly by running the vendored binaries by full path, not assumed from a PATH issue). Both reports + index rows in `design/reviews/`. |
| 2026-08-13 | v46 — §48 added, Round 19 (cross-portal, no pre-written scope plan): standalone Coach Training Portal (`/training-v2`) retired — its home page deleted, Portal Switcher tile removed, learning journey moved into the Coach Delivery Portal's own "Learning" tab (`DeliveryLearningHomePage.tsx`), which gained a new sticky right column (`LearningProgressCard` above `AiReflectionPanel`). Curriculum regrouped into 2 tier canvases (**new tokens `--color-tier-foundational`/`--color-tier-sleep`**) + 2 standalone cards for the single-module Practice tier and the Certificate; module cards rebuilt as a horizontal carousel (`ModuleScrollRow` — chevrons, dot pagination, a decorative "learning path" line) and, after several fully-rejected current-card treatments (ring, side-border, size+shadow), landed on genuine size/typography parity across every card state — see §48 for the standing rule against reintroducing a stroke/size distinction. App-wide shell content-width corrected `1100px` → `1600px` → `1536px` → **`1320px`** across `DeliveryShell`/`ResearchShell`/`ConsumerShell` + 3 banner components. Phase 3/4 review (2 fresh independent agents): design critique 1 High fixed (carousel auto-center scroll-snap bug) + 1 High flagged not fixed (pre-existing app-wide sidebar non-responsiveness, out of scope); accessibility 1 Critical fixed (auto-center scrolling the whole page to its bottom on load) + 1 Major fixed (chevron-unmount focus loss) + 2 Minor fixed (chevron touch-target size, locked-CTA contrast). Both reports + index rows in `design/reviews/`. |
| 2026-08-11 | v45 — §47 addendum, Round 18 accessibility pass (run in parallel with the design-critique pass, same round): found and fixed 2 Major + 1 Moderate in `NotificationHub.tsx`/`ModuleTimeline.tsx`/`DeliveryLearningHomePage.tsx`. Major: the carousel's resize-recovery `ResizeObserver` fired an unprompted `scrollTo` on its own guaranteed first callback, intermittently racing native focus-driven scroll and dropping keyboard focus to `<body>` mid-Tab-sequence — fixed by skipping that first callback. Major: dismissing a notification had zero screen-reader announcement — fixed with this app's existing `role="status" aria-live="polite"` sr-only pattern. Moderate: `ModuleTimeline`'s current-module auto-scroll, reused as-is on the new single-scroll-container `/delivery/learning` page, jumped the whole page on load — fixed with a new `autoCenterCurrent` prop (default `true`, opted out only from the new page). Both this pass and the design-critique pass above edited `NotificationHub.tsx` concurrently; verified to coexist cleanly. Report + index row in `design/reviews/`. |
| 2026-08-11 | v44 — §47 added, Round 18 (Coach Delivery Portal, direct chat-edit batch, no pre-written scope plan): the old widget-grid Home column replaced with `NotificationHub.tsx`, a real data-driven notice carousel (green tint — new, fifth §1 exception, `notification-hub-green`); new "Learning" sidebar tab (`DeliveryLearningHomePage.tsx`, reuses `ModuleTimeline`/`PATHWAY_MODULES` in a single-column layout); per-consumer detail page tabs renamed ("Session Logs"→"Session Notes," "Profile Details"→"Consumer Profile Details"); `UpcomingSessionsPanel`'s empty state centered on a `bg-pearl` box across all 3 reuse sites; the PLWD/Carer hero (`DeliveryConsumerDetailPage.tsx`/`ConsumerDetailPage.tsx`) finalized to equal-size names + smaller/lighter labels, `items-center` per line. Design critique (this pass) found and fixed 2 real issues: the notice carousel's per-page grid forced a flat 2-row height regardless of real item count, leaving conspicuous dead space once a coach dismissed down to 1-2 items (fixed — rows now size to content, `min-h-[104px]` floor); the per-item dismiss button was 24px against this app's own established 36px dismiss-button precedent (raised to match). One item flagged, not fixed: the new Learning tab is a second entry point into the already-signed-off `/training-v2` overview/player flow, whose own "Back to my learnings" link hardcodes a return to the standalone Training Portal home rather than back to `/delivery/learning` — recommended as a follow-up rather than modifying a different round's hardened, multi-round-reviewed flow in-pass. Report + index row in `design/reviews/`. |
| 2026-08-11 | v43 — §46 added, Round 17.2 (cross-portal, no pre-written scope plan; the session identified as the second of the two concurrent sessions Round 17's own handover had reserved numbers for). **New shared file, `src/components/shared/modalFooter.ts`** (`MODAL_FOOTER_SURFACE`/`_COMPACT`) — every pop-up modal in the app now shares the same full-bleed `bg-pearl` footer treatment `PlanSessionsModal`/`EditSessionPlanModal` already had; applied to `ConfirmDialog.tsx`, `AddCoachTraineeModal.tsx`, `EnrollConsumerDialog.tsx`, `AddAnnotationSummaryModal.tsx`. `WizardProgressRail.tsx`'s marker size, rail/content column ratio, and vertical step spacing all changed, iterated three times on direct feedback to a final `3fr_7fr` (30/70) split + `pr-4` rail padding (see §46 for the full before/first-pass/second-pass/final table — don't re-derive an intermediate step as if it were current). `PlanSessionsModal.tsx`'s fixed title corrected from an outlier `text-caption` to match every other modal's `text-title`; its welcome-screen hero bumped further to `text-display-md` + `text-balance` (fixes a real widow); intro icons enlarged; step labels renamed ("Module availability"→"Module unlock day", "Session Catch-up"→"Catch-up timing") in both the preview and the real per-step rail. `SpacesCoachProfilePage.tsx`'s Session Plan card gained a `viewerRole`-conditional title/subtitle/CTA split (researcher view: "Coach's session plan," Edit/Create omitted, third-person copy — corrected mid-round after design critique caught a false "read-only" claim). `DeliveryHomePage.tsx` gained a "Session Planned" Yes/No column reusing the existing success/muted `Chip` convention. Phase 3/4 review (run directly by the orchestrating session, which already held full first-hand context of every change): design critique found and fixed 1 High (the false "read-only" copy claim); accessibility 0 findings, verified with real OS-dispatched Tab/Shift+Tab presses confirming the focus trap and footer focus-ring clearance both survive the new `overflow-hidden` panels. Both reports + 2 index rows in `design/reviews/`. `tsc --noEmit`/`oxlint` clean throughout. |
| 2026-08-11 | v42 — Round 17.1 (cross-portal consistency + copy cleanup, no pre-written scope plan; identified mid-session as one of the two concurrent sessions Round 17's own handover had reserved numbers for but couldn't name). **No new section, no new tokens** — `EditSessionPlanModal.tsx`'s week-wise timeline redesign reuses `TOPIC_CARD_CLASS` (§42) verbatim, and the pearl-hero-band/table-header pattern applied to 3 more Research Dashboard list pages plus `ConsumerHealthPage.tsx` is the same `ResearchShell`/`ConsumerShell` `hero`/`heroNoSeam` mechanism documented since Round 4.1 §4/§6, not a new one. Two conventions worth noting for future rounds: (1) **"Label — Sub-label" two-part constructs now use a colon, not an em dash** — `stageLabel()`'s "Stage C: Learning" is the reference; apply the same to any future session/module/status label pairing. (2) Standalone `'—'` used as an empty-value placeholder (e.g. `person.email || '—'`) is a distinct, correct convention, explicitly **not** covered by the em-dash-removal sweep — don't "fix" these in a future pass. Full round detail in `design/claude-handover/handover.md`'s Current-state row and `design/logs/progress-log.md`. Phase 3/4 review (2 sequential agents): design critique clean (0 findings); accessibility found and fixed 1 Critical + 1 Major, both in `EditSessionPlanModal.tsx`'s focus management (Shift+Tab escaping the trap on first press; post-save focus jumping to a hardcoded row instead of the edited one) — both reports + 2 index rows in `design/reviews/`. `tsc -b`/`oxlint` clean throughout. |
| 2026-08-11 | v41 — §45 added, Round 17 (Research Dashboard first-run onboarding tour, written scope plan): the app's first coachmark/spotlight pattern — 8 per-surface tours, 33 steps, SVG-masked dim portalled to `<body>`, `data-tour` anchoring on 30 elements with cross-portal gating. **One new token, `--shadow-float`** — §5's long-documented but never-implemented "Imagery shadow" value, now real, with its permitted use extended from imagery-only to this floating tooltip (the "never on buttons or text" rule is unchanged). Corrects an untokenized Tailwind `shadow-lg` shipped in the first pass. Also records the rejected `box-shadow`-spread overlay technique (renders at a fraction of declared alpha) and the `position: fixed`/transformed-ancestor bug that made the portal necessary. Copy went through three full rewrites on direct feedback — marketing-voice titles → informative labels, then definitional bodies → capability/expectation, then formal register → conversational with the study's own lifecycle as a spine; all three superseded principles are struck and inverted in place in `ux-copy.md` rather than deleted. |
| 2026-08-10 | v40 — §44 addendum, Round 16 continued further (same day): 4 more direct-feedback fixes to `SessionTracker` (right-aligned Action column, coach-vs-researcher `viewerRole` gating on "Mark as incomplete," `isFuture`-disabled CTA, `bg-pearl` CTA restyle); "Edit plan" split into a new, single-panel `EditSessionPlanModal.tsx` (no rail, no cadence questions, mirrors the live table's own columns) with a bidirectional chronological-order check; `PlanSessionsModal.tsx` simplified to create-only. First formal design-critique/accessibility-review pass covering any part of Round 16: design clean (0 findings), accessibility found and fixed 1 real issue (missing focus ring on the new disabled CTA). No new tokens. Full detail above, appended to §44. |
| 2026-08-10 | v39 — §44 added, Round 16 continued (same day, same round as v38/§43 below — §43's timeline was reopened and explicitly rejected: "I am really not liking this UI, its overwhelming, and too cluttered"): `SessionTracker` rebuilt a second time, through a rejected 3-mini-card grid, back to a `<table>` matching a precise 6-column direct spec, refined twice more by follow-up (font size, column alignment, "Session"→"Session number," Action-column button hierarchy). New `destructive` chip tone (`StatusChip.tsx`). Indigo/purple swept to `primary` app-wide. Full detail above — read §44, not §43, for what's actually shipped. |
| 2026-08-10 | v38 — §43 added, Round 16 (`SessionTracker`'s "Session plan" card rebuilt from a table into a timeline, direct instruction, no pre-written scope plan): **superseded the same day by v39/§44 above** — full detail retained below as historical record. No new tokens. |
| 2026-08-10 | v37 continued — Round 15's own final read-only audit (3 report files under `design/reviews/round-15-plan-sessions-final-audit-*.md`, 1 critical/3 high/7 medium/7 low/4 note) fixed in a same-day follow-up session, all against `PlanSessionsModal.tsx` unless noted. **Critical:** every transition that unmounted the just-clicked control (welcome→Step 0, "Back" to step 0, entering either loading interstitial) dropped keyboard focus to `<body>` while `trapKeys`'s Tab-handling was simultaneously disabled for the whole `busy` duration — fixed with 3 focus-redirect effects (`introHeadingRef`/`stepHeadingRef`/`loadingHeadingRef`, the same pattern as `SessionTracker`'s `rowHeadingRefs`/`PasswordChangeCard`/`ReflectionCard`) plus a `trapKeys` change that keeps trapping Tab while busy (only Escape stays suppressed) and pins focus in place when there's nothing focusable to cycle to. **High:** regenerating an existing plan no longer anchors dates to the original plan's historical creation date — the unused, buggy `session0Date` state was removed outright and `generatePlanRows` now always anchors to `TODAY`; all 18 review-step date/time inputs got unique accessible names ("Module {week} unlocks on:" / "Session {week} catch-up on:" / "Session {week} catch-up at:", were 3 duplicated "On:"/"On:"/"At:" labels); the catch-up time-input control migrated off its leftover raw-Tailwind-amber palette onto the `plan-catchup` token family and `rounded-sm` (was the file's only `rounded-md`); the "topic-colored card" pattern's 3 different opacity recipes (`/40+/15`, `/50+/15`, `/30+/10`) unified into one shared `TOPIC_CARD_CLASS` constant used everywhere. **Medium:** `SpacesCoachProfilePage.tsx`'s consumer picker (and the Delivery Portal's own per-consumer detail page) now `key={dyad.id}`s the wizard's container, closing the dyad-swap stale-draft risk; the review step's date/time inputs are still unrestricted `<input type="date">` fields, so a new `validWeekday()` guard makes the edit-mode weekday re-derivation defensive against a saved weekend date instead of silently producing an unmatchable `0`/`6`; the stale-catch-up-day auto-clear and the row-level date-order warnings both gained live-region announcements (`aria-live="polite"` status text, `role="alert"` on the callouts); the disabled-tile contrast pairing (measured 4.516:1, eroded from Round 14.5's calibrated 4.86:1) restored margin by swapping `text-ink-faint` for `text-ink-muted`; the catch-up time control's real \~25px input inside a ~51px visual box (13px of dead space each side, not fixed by alignment alone — the gap was the wrapper's own padding, not a stretch problem) fixed with explicit `h-11`/`h-9` sizing instead; the review-step timeline connector now reuses `SessionTracker`'s own conditional `bg-success/40`/`bg-divider-soft` state pairing instead of a flat neutral; the persistent dialog title and the current step's heading no longer read as one doubled heading (dialog title demoted to a quiet `text-caption` eyebrow); Step 0's card label rewritten to match Step 1's sentence register. **Low/note:** intro heading demoted `text-display-md`→`text-title` and its own accessible-name tag corrected `h3`→`h2` (matches the step screens' own `h2`); the two structurally-identical confirmation captions standardized on `text-caption text-ink-muted`; the loading interstitial's live region is now a single persisted node (text updates in place) rather than a fresh mount every time `busy` flips true; 3 near-identical `patchRow*` setters unified into one generic `patchRow(session, patch)`; `WeekdayPicker`'s previously-unreferenced `id`/`idPrefix` plumbing kept, now documented as an intentional future test-selector hook; the doc comment's stale "Building your plan…" quote and its now-false "per-row date editing was dropped" paragraph both corrected. **Deliberately left as documented judgment calls, not fixed:** the intro screen's fully-centered single-column layout vs. the other 3 screens' rail+content chassis, and the sub-perceptible `mt-6`/`mt-8`/`mt-3`/`mt-2` spacing deltas between the intro screen and the rest — both flagged by the audit as "not urgent, may be intentional." `design-tokens.md` §42's own weekday-caption claim (below) is corrected in place rather than the phantom feature being retroactively built. `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched). |
| 2026-08-10 | v37 — §42 added, Round 15 (Plan Sessions wizard step-topic recolor + weekend removal + editable review-step dates + `next`/`rescheduled` chips): full detail above. New tokens `--color-plan-module`/`--color-plan-catchup`. |
| 2026-08-06 | v36 — §41 added, Round 14.6 (direct feedback against a live screenshot: "I do not like the outline stroke style. Also, next button should only be activated after user selects on of the days"): the day-picker answer card's `border border-hairline` outline replaced with a filled `bg-pearl` surface, no border; `moduleWeekday`/`catchupWeekday` changed from defaulting to Monday/Friday to `number \| null` starting at `null`, so no day comes pre-selected — "Next"/"Build my plan" now genuinely disabled until the coach makes an explicit choice on each step, re-enabling once they do; the step-0 example caption and step-1 live preview both render conditionally on a real selection existing. `edit` mode unaffected (always seeds from real data). Design critique + accessibility review addenda run per the project's action plan (re-opening Round 14.5's reports): both pass — 1 minor flagged-not-fixed consistency note (Step 3's mini-cards keep their border, changing them risked a worse regression) and 1 non-blocking note (the answer card's own boundary now measures 1.04:1, decorative only). `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched) |
| 2026-08-06 | v35 — §40 added, Round 14.5 (direct user request for a design critique + accessibility check against an annotated screenshot — the first formal review pass on this wizard across its 4 prior direct-edit rounds): design critique found and fixed 4 real issues — the rail scrolling with the content (both columns shared one `overflow-y-auto`, now split so only content scrolls); the connector line between rail steps computing at 0px height, a bug in the **shared** `WizardProgressRail` component (`md:items-start` broke the flex-stretch its `flex-1` connector needs) silently affecting all 4 wizards using it, fixed once at the shared-component level; the footer's lack of visual separation + excess bottom whitespace, rebuilt as an edge-bled `bg-pearl` band; the day-picker's under-weighted visual presence, fixed with a bordered answer-card + larger tiles, not centering. Accessibility review found and fixed 2 real issues — `WeekdayPicker`'s `role="radiogroup"`/`"radio"` claiming ARIA radio semantics without the roving-tabindex/arrow-key contract those roles require (switched to a `role="group"` toggle-button pattern instead); disabled day tiles measuring 2.35:1 contrast from a stacked `opacity-60`, fixed by dropping the opacity (re-measures 4.86:1, an already-calibrated pairing). No new tokens. Both review reports + index rows in `design/reviews/`. `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched) |
| 2026-08-06 | v34 — §39 added, Round 14.4 (direct chat-edit batch reopening §38's wizard the same day, against 2 annotated screenshots, no pre-written scope plan): new `WeekdayPicker` (7-tile calendar-style row, `role="radiogroup"`/`radio`) replaces both weekday `<select>` dropdowns; question copy rewritten to speak in terms of the consumer with plain-language explanations; §38's vertical-centering fix reverted (question steps top-aligned again, now filled by real content instead of needing the centering crutch); new `mondayFirstOrdinal()` helper drives a catch-up-day blocking rule (greys same-week days on/before the module day) — flagged as a judgement call given an internally ambiguous spec; Session 0 removed from the wizard's review screen entirely (unchanged everywhere else); review step rebuilt into a week-wise timeline (Module-unlock day + Session catch-up day/time, each clearly labelled, time the only remaining per-week edit); `moduleTargetInvalid()`/`dayBefore()`/`dayAfter()` deleted as dead code once per-row date editing was removed. `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched); no separate design-critique/accessibility-review pass run this round either — 4 direct-edit rounds deep (§36→§39) without one |
| 2026-08-06 | v33 — §38 added, Round 14.3 (direct chat-edit batch reopening §37's wizard, no pre-written scope plan): domain-model correction — cadence is fixed at every week per the project plan (`CADENCE_OPTIONS` removed, `WEEKLY_CADENCE_DAYS = 7`), and module completion happens BEFORE the catch-up that reviews it, not after (§37's `MODULE_TIMING_OPTIONS` fraction picker removed — its own generated dates had this backwards). Wizard reduced to 2 questions: which day of the week each module becomes available (new `DAY_OF_WEEK_OPTIONS`), and which day + time to catch up once it's done; `generatePlanRows()` rewritten around a new `nextWeekday()` helper so every date cascades weekly from those two choices. `moduleTargetInvalid()`'s comparison direction flipped (was requiring target-after-session since Round 14 — a real pre-existing bug, not new) to require target-before-session, paired with a new `dayBefore()` helper (`data/format.ts`); the review field relabeled "Module target" → "Module available" to match. Review step rebuilt from a `<table>` into a vertical timeline (`<ol>`, marker+connector rows matching `SessionTracker`'s own visual language) per direct request to "show me complete journey in time line style." Same-round spacing fix after direct screenshot feedback ("feels cramped... needs to be properly spaced out"): increased internal rhythm throughout, and the 2 question steps now vertically center their content in the available pane (previously top-anchored with an empty void below on the sparser steps), with a restored decorative session/module sequence strip filling that space usefully under the first question. `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched); no separate design-critique/accessibility-review pass run this round (same scope call as §37) |
| 2026-08-06 | v32 — §37 added, Round 14.2 (direct chat-edit batch reopening §36's wizard, no pre-written scope plan): `PlanSessionsModal.tsx`'s question order changed to cadence → module timing → first catch-up date/time → review (previously Session-0-date → cadence → review) — Session 0's date is no longer asked at all, since it's today's own live planning session, not something to schedule; new `MODULE_TIMING_OPTIONS` (`data/spaces.ts`) gives the coach a real choice over how far into each cadence gap a module's target date sits, replacing a hardcoded 0.5-of-gap constant; `generatePlanRows()` decoupled Session 0's date from the Session-1-onward cadence cascade. Added two fake-timer loading interstitials (`generating`/`saving`, 700ms each) — a spinner pane between the last question and the review table, and a spinner+label swap on the review table's final confirm button — both blocking Escape/backdrop-dismiss for their duration. No changes to `SessionTracker`, `moduleTargetInvalid()`, or the stored plan data shapes. `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched) |
| 2026-08-06 | v31 — §36 added, Round 14.1 (Session Plan redesign, direct chat-edit batch spanning several rejected iterations, no pre-written scope plan): Session 0-6 display renumbering (`displaySessionNumber()`, internal 1-7 keys unchanged) after a genuine domain-model correction — Session 0 ("Planning") is the coach's first meeting, not the always-unlocked "onboarding module"; propagated to 6 pre-existing surfaces beyond the Session Plan card itself once a design-critique pass caught the same session reading two different numbers depending which screen was open. `session-tracker` (§13) rebuilt as a real `<table>` — no hero card (an intermediate hero-card iteration was explicitly rejected: "UI does not follow design theme") — with a new **`session-next-indigo`** token (§1) tinting the next-session row instead. New manual-module-unlock capability (`unlockModuleManually`, no prior override mechanism existed). New `plan-sessions-wizard` (`PlanSessionsModal.tsx`) — a 3-step guided modal (Session 0 date/time → cadence + live preview → an editable review table, converted from bordered cards specifically to avoid a nested scrollbar) reused for both first-time planning and a new "Edit plan" amend entry point. New shared **`wizard-progress-rail`** component extracted from 4 previously-duplicated copies, adding a mobile-only horizontal stepper layout applied to all 4 wizards using this chassis. Design critique found and fixed a 🔴 high six-surface renumbering-propagation gap, live, not by static read. Accessibility review found and fixed 3 real issues, the most severe a critical focus-loss on "Unlock module" confirm. Both review reports + index rows in `design/reviews/` (an earlier, now-superseded design-critique report against the rejected hero-card iteration is preserved as historical record). `tsc -b`/`oxlint` clean throughout (one unrelated, pre-existing `ModuleOverviewPage.tsx` error untouched) |
| 2026-08-05 | v30 — §35/§35a added, Round 13 (direct chat-edit batch, no pre-written scope plan, spanning the Coach Delivery Portal and all 3 portals): **My Reflections rebuild** (§35) — `DeliveryConsumerDetailPage.tsx`'s two stacked cards replaced with one 3-state `ReflectionCard` (locked/ready/complete), name- and jargon-free locked/ready copy, date/Shared-chip moved below the "Your reflection" title, and each SIPTEA answer rendered as its own `dt`/`dd` field via new shared `ReflectionFields` instead of a flattened paragraph; `AnnotationSummaryEntry.summary: string` → `components: ReflectionComponentAnswer[]`; a coach can now only ever have one reflection per consumer, enforced in `research-store.tsx`; the same `ReflectionFields`/`Chip` treatment reused on the Research Dashboard's `AnnotationVault`, which also gained a real empty-state fix (distinguishing "not yet reached" from "no reflection yet"). **`card-header-divider`** (§35a) — a new mandatory, cross-portal structural rule: every `<Card>`-wrapped title now gets exactly one `border-t border-hairline` divider before its content (table/`dl`/form/list), consistent `p-6 pt-4` spacing, except pure message+CTA cards with no distinct content section; every card title is now sentence case. Run via a 5-agent Workflow in two widening passes (title+body, then title-only after direct follow-up) — one agent per portal with non-overlapping file ownership, a cross-portal check agent, and an independent watchdog auditor each round. Design critique found and fixed 3 issues (two missed Account-page `ProfileDetailsCard` instances, high; `PasswordChangeCard`'s divider made conditional on its form state, minor; a reflection-gating bug reading a stale seed value instead of the live session-completion store, moderate, fixed during the build itself). Accessibility review found and fixed 1 critical defect found only by completing the real submit flow end to end: the reflection modal's trigger-focus-return `.focus()`'d a detached DOM node (the "Add reflection" button, unmounted the instant the card flips to complete), dropping focus to `<body>` — fixed with a `headingRef`/`useEffect` pair, the same pattern `PasswordChangeCard` already uses. Both review passes run directly by the orchestrating session |
| 2026-08-04 | v29 — §34 added, Round 12 (direct chat-edit batch spanning Consumer Management and Coach Management, no pre-written scope plan): sidebar's "Coaches" renamed "Coach Management"; Consumer Management table restructured (Consumer Details split into `PLWD:`/`Carer:` lines, "Coach"→"Assigned Coach", "Current phase" replaced by "Sessions Completed"/"Upcoming Session"), mirrored on the Coach Caseload table. `EnrollConsumerDialog.tsx` rebuilt from a single form into a multi-step wizard on the same chassis as `AddCoachTraineeModal.tsx` (dialog enlarged to `920px`/`h-[85vh]`, rail markers to `size-9`, rail labels shortened to 2–3 words with the fuller instructional phrasing moved to the step heading + a new subtitle, the "Step N of M" rail text made `sr-only` to remove a visible duplicate while keeping the screen-reader announcement) — carries Email/Phone (previously missing from `PersonProfile`) and a real drag-and-drop consent dropzone (PDF/DOC/DOCX only). `AddCoachTraineeModal.tsx` got the identical size/rail/`sr-only` treatment; `AddAnnotationSummaryModal.tsx` got only the size/rail treatment, deliberately not the heading/subtitle split or `sr-only` conversion, since its step labels are fixed SIPTEA framework terms, not vague copy. `ConsumerDetailPage.tsx` restructured from 4 tabs to 6 (Overview/Assigned Coach/Learning Progress/Sleep & Health Data/Session Recordings/Profile details): **Overview** reuses `SpacesCoachProfilePage.tsx`'s `ConsumerDetailsCard` (now exported) plus a read-only Session tracker moved here with a generic subtitle; **Profile details** is new — full editable PLWD/Carer identity (Name/Age/Relationship/Email/Phone/Background) in two columns plus "Consent records" (renamed from "Consent repository"); the hero collapsed from one `text-display-md` line to two stacked `text-title` lines (`PLWD:`/`Carer:`), the old session-phase subtitle removed, and the page-level Fitbit-sync banner now only shows on the Sleep & Health Data tab. New shared `DyadSessionRecordingsCard.tsx` (Session name/Date/Time/View recording, Upload, CSV Export, icon empty state — mirroring the Trainee Management Session Recordings pattern) is used by both the consumer's own new Session Recordings tab and a new identically-positioned tab on `SpacesCoachProfilePage.tsx` (before Profile details, behind a consumer picker) — same dyad, byte-identical content from both sides. `FitbitSyncMonitor` renamed "Fitbit sleep data," gained a default-selected "Comparative" tab (paired PLWD/Carer rows per date via a merged `rowSpan` date cell + alternating-group shading) behind a new `showComparative` prop (off for the Consumer Portal's incompatible controlled `member` type), a new CSV "Export" button at all 3 reuse sites, and a `showAlerts` prop turned off at the Research Dashboard and Consumer Portal (both already have a page-level sync-gap banner) but left on at the Coach Delivery Portal (which has none). `SleepDiaryFeed` rebuilt twice: first into a card grid (journaling-app style, notes always visible, no accordion), then — after direct feedback that a card grid wouldn't scale past a handful of days — into a true spreadsheet grid: Member is a frozen (`position: sticky`) first column, dates run left-to-right in a horizontally-scrolling container. New `diary-green`/`diary-yellow` tokens (§1) tint the PLWD/Carer rows — the one exception in this file's semantic-tone list that was explicitly requested rather than proposed (offered two neutral gray tints first, per the "quiet, no rival accents" rule; the user asked for real pastel green/yellow instead, confirmed directly). Design critique found and fixed 2 real issues (the new Comparative tab silently suppressing the Coach Delivery Portal's only sync-gap warning; all 10 seeded session recordings missing the new `time` field, always rendering "—"); accessibility review found and fixed 2 real issues (the Fitbit "Dyad member" tablist's arrow keys updating selection without moving focus, stranding keyboard users on a 3-tab set; the new two-line stacked hero `<h1>` computing a run-on accessible name with no separator) and flagged one pre-existing, out-of-scope bug (`ConsumerHealthPage.tsx`'s own `MemberToggle` has the same focus-not-following-selection gap) as a follow-up task rather than fixing it silently. Both review passes run as `general-purpose` subagents |
| 2026-08-04 | v28 — §33 added, Round 11 (direct chat-edit batch spanning the whole Coaches area, no pre-written scope plan): Coach Management's "Invite new coach" → "Onboard new coach," its dialog changed from a typed-email match to a certified-coach dropdown-select + 2-step confirm (still a walkthrough, not a wired write path); table columns simplified to Coach Name/Coach ID/Coach Email/Consumer Caseload. `SpacesCoachProfilePage.tsx`'s tabs renamed/reordered to Overview/Assigned Consumers/Shared Annotations/Supervision Logs/Profile details; a new global "Consumers" picker card carries Assign/Transfer actions independent of which consumer is selected; the old 2-`PersonCard`s-plus-`ConsumerOverview` layout consolidated into one "Consumer Details" card (Name/Email/Phone identity fields with "—" placeholders, one shared editable grey-background "Notes" field); Supervision Logs adopted §24's existing `rightSlot` pattern (Scheduled Sessions top-right, records table full-width below). Manual `AddConsumerDialog` replaced by a new "Assign consumer" flow (pick an unassigned consumer from a dropdown labelled by PLWD/Carer role, confirm, commit via the existing `transferDyad`); `AddConsumerDialog.tsx` deleted as fully orphaned. New `coachNotes` field/`updateDyadCoachNotes` action keeps the new Notes field's saves from colliding with the pre-existing `dyad.notes`/`ConsumerOverview` field read by 3 other surfaces. `ConfirmDialog` gained a shared `confirmDisabled` prop (fixes a dead-button-on-empty-pool class of bug once, generically) and a fixed focus-restore race that could strand keyboard focus on "Go back" across any 2-step confirm flow built on this chassis. Design critique found and fixed 2 real issues (the `coachNotes` collision, high severity; the dead confirm button, moderate); accessibility review found and fixed 2 real issues (the focus-restore race, critical; an unlabeled Notes textarea, major). Both review passes run as `general-purpose` subagents |
| 2026-08-04 | v27 — §32 added, Round 10 (direct chat-edit batch spanning two connected areas, no pre-written scope plan): **Batch A — new "My Schedule" home page** (`ResearchHomePage.tsx`, `/research/schedule`, first sidebar item) reusing the Delivery Portal's widget-grid/upcoming-sessions/table layout, scoped to trainee Stage O (cohort-wide)/A/H sessions plus certified-coach supervision; `UpcomingSessionsPanel` extracted to `src/components/shared/` on its third caller; `WidgetGrid` gained an optional `tiles` prop; new `CohortUpcomingSession`/`upcomingGroupSessions` model a Stage O session as one meeting shared by a whole cohort (one row, every attendee's name stacked) rather than one row per trainee; `ScheduleTable` shows only actually-scheduled sessions, not a full roster; new ghost "Copy Link" action with a real `execCommand` fallback + "Copy failed" state for when `navigator.clipboard.writeText()` rejects. Sidebar reordered (My Schedule, Trainee Management, Consumer Management, Coaches, My Profile); "Account" renamed "My Profile" across all 3 portals. **Batch B — Session Recordings table redesign** (`CoachProfilePage.tsx`): the old tile grid replaced with a real table (Session name/Date/Time/View recording), a new `time` field on `SessionRecording`, an Upload control reusing `ConsentRepository`'s accessible file-input pattern (`manualRecordings` context state), CSV export, and this app's first icon-based empty state (`bg-primary/10` circular `Video` badge + one line), folded into the same card the populated table uses. Design critique found and fixed 2 real issues (multi-attendee row vertical alignment, hero subtitle accuracy); accessibility review found and fixed 2 real issues (32px→36px control height on 2 new buttons, matching a gap class Round 3.1 already fixed once; Copy Link's missing clipboard-failure handling, a genuine silent-failure risk). Both review passes run directly by the orchestrating session |
| 2026-08-04 | v26 — §31 added, Round 9.1 (direct chat-edit batch spanning two connected areas, no pre-written scope plan): **Batch A — Research Dashboard "Current Stage" renaming:** `STUDY_PHASES` gained `stageCode`/`shortLabel`; `phaseLabel()` replaced by `stageLabel()`/`stageShortName()` (`Stage X — Word` for the 5 COACH-lettered phases, legacy `Phase N — Name` format for the 3 that aren't); Stage Management's pipeline (`PhasePipeline` → `StagePipeline`) now derives its rows via `.filter((p) => p.stageCode)`, showing only Stage C/O/A/CP/H, never Phases 1/2/8; Coach Profile tabs reordered/renamed to Learning Progress (was Training Review, now default) → Stage Management (was Trainee Tracking) → Personal details; Trainee Management trimmed to `currentPhase < 8` coaches (a business rule, not a row cap), pinned order Priya Raman → Marcus Webb → Lauren Mitchell → the rest; "Active" status pill corrected `neutral` → `success` (green) for both `InviteStatusChip` and `CoachStatusChip`. **Batch B — Coach Training Portal home timeline:** new locked "Baseline Reflection" milestone card inserted between the last module and the Certificate; both it and the Certificate rebuilt onto the landscape module-card chassis with their own pill badges via a new shared `Badge` component — new `badge-purple` token (§1) for Baseline Reflection's badge only; rail marker resized 48px→40px with exact `body-strong` number typography; marker-to-card gap rebalanced to match the column's own left padding at every breakpoint; "Go to Coach Delivery Portal" button repositioned top-right above the title for tablet/mobile only (desktop unchanged); "Your learning journey" heading restored at `lg`+ (was `lg:hidden`). Design critique found 0 defects (2 minor, non-blocking notes); accessibility review found 0 defects (1 judgment call, resolved as consistent with an existing pattern). Both review passes run directly by the orchestrating session |
| 2026-08-04 | v25 — §30 added, Round 9 (direct chat-edit batch spanning two connected areas, no pre-written scope plan): **Batch A — portal cleanup:** Coach Delivery Portal's mocked Okta Verify sign-in gate removed entirely (`RequireAuth.tsx`/`SignInPage.tsx` deleted, `data/auth.ts` trimmed to just `signOutOfTraining`); Coach Training Portal "Option A" and its `/training/choose` fork-chooser retired outright now that Option B is the only version being developed (`DashboardPage.tsx`/`ModulePage.tsx`/`ProfilePage.tsx`/`ModuleSideNav.tsx`/`TrainingPortalChoicePage.tsx` deleted; `ModuleCard.tsx` trimmed to just its still-shared `moduleArt()` export; `AppHeader.tsx`'s dead `'training'` portal variant removed); the portal switcher's and Delivery Portal's own "Coach Training Portal" links repointed straight to `/training-v2`; the Training Portal's "Go to Coach Delivery Portal" button activated (was permanently `aria-disabled`). **Batch B — Research Dashboard, direct-onboarding trainee management:** Recruitment (EOI) review queue removed entirely (pages/routes/data/store actions/chip); new "Add coach trainee" wizard (`AddCoachTraineeModal.tsx`, 2 steps + review, modeled directly on `AddAnnotationSummaryModal.tsx`'s chassis) replaces it — a trainee is now added straight onto the roster at Phase 2, no research-side review step; sidebar's "Training Pipeline" (a 2-child accordion) collapsed to a single "Trainee Management" leaf now that Recruitment is gone (dead `AreaHeader` component deleted, `AreaLink` gained an `end` prop for the one leaf whose route is a prefix of every sibling route); roster table columns simplified to `Trainee Name | Trainee ID | Status | Cohort | Phase` per direct feedback. New `InviteStatus` (`'pending'`/`'active'`) axis + `state-warning` token — see §30 for the full pattern, the rationale for this one deliberate exception to the "quiet, no rival accents" rule, and its cascading effects on a pending trainee's own profile page (suppressed hero status chip, omitted edit affordances, gated Training Review/Trainee Tracking tabs). Design critique found and fixed 1 real issue (a hero-chip contradiction on pending profiles); accessibility review found 0 defects. Both review passes run directly by the orchestrating session after repeated subagent-delegation stalls traced to the `Claude_Preview` MCP server disconnecting mid-session |
| 2026-08-03 | v24 — §29 added, Round 7.1.2 (direct chat-edit batch against the Round 7 module player, no pre-written scope plan, signed off with a full design critique + accessibility review pass): `ModulePlayerPage.tsx`'s horizontal single-screen `AnimatePresence` swap replaced with a vertical scroll-stack + real CSS scroll-snap (every visited step stays mounted, Continue appends + auto-scrolls down, `scroll-snap-type: y mandatory` guarantees manual scrolling always lands on a full slide, never partway between two). Player shell rebuilt as a fixed-height flex column (`h-screen flex-col`, only `<main>` scrolls) — simpler and more robust than the round's own first-pass `ResizeObserver`-measured sticky-offset approach, which it supersedes in place. New `ModulePlayerHeader.tsx` combines the old separate Exit bar + chapter-only progress bar into one component, wrapping a new generic, domain-agnostic `SegmentedProgressBar` UI primitive (`src/components/ui/segmented-progress-bar.tsx`, self-documented for standalone extraction) — one segment per chapter shows both whole-module position and current-chapter fill in a single bar. New `ModulePlayerFooter.tsx` — one global, centered Continue control replacing all 9 slides' individually hand-rolled buttons, driven by an `onReadyChange` report from whichever slide is current; local sub-navigation (knowledge-check's "Next question," a case's reveal) stays in-slide. New canonical `SlideLayout.tsx` template (standard/centered variants) — every slide now sits directly on the page canvas, no more `Card` wrapper; `TransitionScreen.tsx` deleted, folded into it. Content-correctness fix: `VideoPlaceholder.tsx` no longer renders the source doc's "Covers:"/"Dramatised scene:" production-brief text as if it were the lesson — video-format case examples now show the clean `vignette` field as body text (matching written cases), Learn videos show a plain framing line, module intro shows the real spoken transcript. New shared `chapterProgress()`/`edgeStepProgress()` helpers (`playerSteps.ts`) de-duplicate progress math `ModuleOverviewPage.tsx` previously computed inline; dead 6-dot-row helpers removed once their only consumer was deleted. Design critique (run live) found and fixed 1 real bug: `scrollIntoView()` was leaking scroll through the outer `overflow: hidden` shell (which blocks user-scroll but not JS `scrollTop`), gradually pushing the header off-screen after repeated navigation — fixed with a manual `<main>`-only `scrollTo` delta calculation, verified clean across a rapid-navigation stress test. Accessibility review (run live) found and fixed 2 real defects: no focus management when advancing between slides (keeping every visited slide mounted meant the control that triggered a change simply unmounted, dropping focus to `<body>`) and an unbounded multiple-`<h1>` structure from the same mounting strategy — both fixed together in `SlideLayout` (focus moves to the active slide's own heading on every `title` change; only the current slide renders `<h1>`, completed ones demote to `<h2>`). No new colour/type/radius tokens |
| 2026-08-03 | v23 — §28 added, Round 7.1 (direct chat-edit batch, no pre-written scope plan): new `module-overview` template (`ModuleOverviewPage.tsx`, Figma node `1:1433`, route `/training-v2/module/:id/overview`) replacing `ModulePreviewModal.tsx` outright — full-bleed hero sharing one left edge with the "Module outline:" row list below it (module intro → per-chapter rows → module outro, completed/current/locked states) beside a "By the end of this module" outcomes card, degrading gracefully to a plain "coming soon" message for any module with no populated outline content. `ModuleTimeline.tsx` cards rebuilt again against Figma nodes `59:2244`/`59:2270` (marker colour corrected — completed = green checkmark, current = solid blue fill, no lock badge on the marker; cover art ~46% width; every CTA now routes to the new overview page). `ModulePlayerPage.tsx`'s Exit button made `?from=`-aware so it returns to the specific overview page it was launched from, not always the home timeline — needed because `realPlayerContentId()`'s demo redirect lets more than one overview page point at the same underlying player route. Design critique (initial) found and fixed 2 minor issues: `MetaLine`'s separator glued to the start of each part (could strand an orphaned leading "·" on a narrow-width wrap of the one 3-part row) — re-glued to the end of the preceding part instead; `ModuleTimeline.tsx`'s two primary-fill buttons were missing the app-wide `hover:bg-primary-hover` state — added to both. Accessibility review (initial) found and fixed 1 major issue: no focus management on arrival at the overview page — fixed with a focus-managed `<h1>` keyed on `moduleId`. No new colour/type/radius tokens |
| 2026-08-03 | v22 — §27 added, direct UI update (Coach Training Portal Option B home page redesign, Figma node 1:840, no pre-written scope plan): `PATHWAY_MODULES` re-sourced from a new Option-B-only 11-module dataset (`data/trainingPathwayV2.ts`), `data/portal.ts`'s shared `modules` untouched so `/training` (Option A) is unaffected; the Round-7 player module re-keyed `sleep-basics` → `understanding-sleep` (`data/moduleContent.ts`, `pathway.ts`'s `MODULE_PLAYER_ID`, plus a necessary follow-up fix in `ModulePlayerPage.tsx`/`ModuleCompleteScreen.tsx`/`VideoPlaceholder.tsx` once `getModule()`'s shared-data lookup no longer resolved the new id — content payload itself untouched); `module-timeline` card rebuilt again with numbered markers (retiring `MODULE_ICON` entirely), a new small black "MODULE {n}" pill badge, and a declared `radius-md` divergence from the system's card `radius-lg` rule; `slideComposition()`/`consumerParallelTitle()` removed from `pathway.ts` and the preview modal (no `slides` field in the new dataset). Demo status spread (module 1 completed, module 2 current, modules 3–11 locked) is fully dynamic from `moduleState()`, with no per-module exception any more for the player-wired module — a direct-instruction change from §25/§26's prior "always reachable" override, whose flagged consequence is that the Round-7 player is locked-by-default until a coach reaches module 5 in order. The hero's horizontal `CertificationPathway`/`SimplePathwayProgress` compact stepper (and `pathway.ts`'s `PATHWAY_STEPS`/`PathwayStep` export) were removed entirely after a second direct correction, since the Figma reference has no such element — the hero now ends with a plain "Current progress: {n}/{total} modules complete" line straight into the vertical timeline; the hero's one-off wide `max-w` column (added only for the stepper's breathing room) reverted to this app's normal shell width. The wireframe's own stale "X/6" hero-copy bug is fixed by deriving the module count everywhere, never hardcoded. No new colour tokens (the pill badge's `bg-black`/`text-white` is a literal one-off, not a new token) |
| 2026-08-03 | v21 — §26 added, Round 7 (Coach Training Portal Option B, module content player — first build of the screens after "Start module"): new `/training-v2/module/:id/play` route and data-driven chapter loop, content-populated for Module 4 ("Understanding Sleep") only, all other pathway modules unchanged. New `module-player-progress-bar` (horizontal `wizard-progress-rail` cousin, §23, same 3-state colour language, no new tokens); `video-placeholder` (muted gradient thumbnail + duration badge + the video's real "Covers…" text shown as visible copy, standing in for all 6 of Module 4's video slots — no real assets exist); `case-example-screen` (3 sequential sub-screens, one video-format case rotated per chapter + two written reveal-on-tap cases); `knowledge-check-step` (one question at a time — True/False buttons or a free-text self-check per question type, immediate answer/explanation reveal, a closing "knowledge check complete" summary); `what-to-expect-screen` (SIPTEA-tagged static reference list); 4 plain transitional screens (chapter marker/complete, module outro with a free-text response field, module complete). Progress persisted client-side (`localStorage`, same tier as `sidebar-nav`'s collapse state and the training auth gate) for resume-where-left-off. `sleep-basics` chosen as the Module 4 stand-in via §25's existing `DISPLAY_OVERRIDES` mechanism (Option-B-display-only, Option A unaffected) — flagged as a judgment call for Phase 5 sign-off, since no module in this prototype's placeholder data is literally numbered "Module 4," and the hero's compact stepper (§25, unchanged) will keep reading this module as "completed" regardless of live play progress on the timeline card below it, a known scoped inconsistency |
| 2026-07-28 | v20 — §25 added, Round 6.3 (Coach Training Portal, new version / "Option B" — first round for this new route family): `training-version-fork` fork-point chooser (`/training/choose`) between the untouched Option A (`/training`) and the new Option B (`/training-v2`); `RequireAuth.tsx` redirect logic generalized to a first-path-segment derivation; new `certification-pathway-stepper` (forced-linear hero stepper + mobile fallback, `pathway.ts`'s `moduleState()` as the one shared source of truth also read by the timeline below it); new `module-timeline` (vertical marker/connector rail + landscape module cards + a portrait certificate card) and `module-preview-modal`. **Rebuilt mid-round** following direct feedback that the first-built timeline (rainbow "Key skills gained" tag chips cycling 4 invented colour pairs, a duplicated "Module N"/title/description heading) read as a generic AI-generated dashboard: real module title is now the sole primary heading everywhere; a real per-module content breakdown (`slideComposition()`, from actual `Slide.kind` data) replaces the invented tags; an explicit "Consumers learn this too" line (`consumerParallelTitle()`, against real `CONSUMER_MODULES` data) appears only for the 2 of 6 modules with a genuine topic match, never forced onto the other 4 coach-competency-only modules. The rebuild was preceded by a 2-proposal design panel + judge/synthesis rather than a single self-review, specifically to counter the repeated-generic-pattern failure mode being corrected — the panel was first misapplied to the wrong surface (Consumer Portal Home) due to a typo misreading, fully reverted once caught, before being correctly applied to this round's own scope. Design critique (sign-off pass) additionally caught and fixed a real mobile-overflow bug (fixed-240px-image landscape cards never fit a genuine phone-width viewport) and a progress-row cramping issue, both now responsive below `sm`. Accessibility review caught and fixed an `aria-disabled`/visual mismatch on reachable CTAs, and (on a since-removed component, a 3-step onboarding tour built and then deleted per direct instruction) a missing focus-trap. The `skills` field (`data/portal.ts`) was deleted entirely once superseded, not left unused. No new colour tokens — the only new palette (the tag chips) was removed, not re-coloured |
| 2026-07-28 | v19 — §24 added, Round 6.2.1 (reopened Round 6.2, direct chat-edit batch, no pre-written scope plan): new `account-tab` sidebar leaf added to all 3 portals (reuses existing `AreaLink`/`NavLink`-array grammar verbatim; `DeliverySidebar.tsx` refactored from a hardcoded single link into the array pattern to support it); new shared `NotificationPreferencesCard` (Email/SMS checkboxes) and `PasswordChangeCard` (current-password → email-a-reset-link, modeled on `SignInPage`'s forgot-password flow, no inline new-password field); new destructive-toned `opt-out-card` (Consumer Portal only — soft-tint offer state escalating to a solid, persistent `OptedOutBanner` once acted on, matching `TodaySessionBanner`'s shape minus the dismiss button; removes Zoom-link access on the Home page); `heroNoSeam` extended to `ResearchShell.tsx` (already present on `DeliveryShell`/`ConsumerShell`) so a plain non-tabbed `hero` gets proper bottom padding instead of the tab-seam mode's zero padding. Also: §23's "true terminal state" note struck through and superseded — the one-time-per-consumer annotation-summary gate it described was removed this round (data model changed to `annotationSummaries: AnnotationSummaryEntry[]`, unlimited entries, each independently timestamped/shared). No new color tokens; computed contrast for the destructive-red reuse (5.38:1) logged in the accessibility addendum. **Same-day follow-ups, same batch (see §24's own "Further Round 6.2.1 direct-edit follow-ups" section for detail):** Consumer Portal Home's "Upcoming schedule" card retitled "Upcoming sessions" + moved to the top row (parity with the Delivery Portal's placement); `SupervisionRecords` gained an optional `rightSlot` prop so the Delivery Portal's Session Logs tab can place "Scheduled Sessions" top-right and "Session records" full-width below, and its "Schedule a session" button is now always bottom-aligned regardless of sibling card height; both "Assigned coach" cards (Consumer Portal, Research Dashboard) moved the coach's name from a subtitle into the field list; a full app-wide "Patient" → "PLWD" terminology sweep; annotation entries no longer repeat the consumer's name per entry, and the Delivery Portal's "Previously shared annotation summaries" (other consumers) section was removed from the per-consumer page entirely; `PasswordChangeCard` gained real focus management across its idle/open/sent states (an accessibility-review fix, not a design-critique one) |
| 2026-07-27 | v18 — §23 added, Round 6.2 (Coach Delivery Portal, Consumer Detail View — My Annotations tab's 6-step wizard): new `wizard-progress-rail` component spec — a deliberate, declared divergence from `session-tracker`'s (§13/§8) dot/tick/connector-line grammar, reused for wizard step progress instead of a persisted data display. Same marker/connector shapes and the same `bg-success`/`bg-success/40` "answered" and `border-hairline`/`bg-card`/`bg-divider-soft` "not-yet-reached" fills as `session-tracker`; adds a third state, "current" (`bg-primary text-white`, step number instead of a checkmark), that `session-tracker` never needed. No new color tokens. Documents a binding accessible-name requirement ("Step {n} of 6: {component label}") for Phase 4 to check. Specifies the wizard modal's own hand-built chassis (backdrop/focus-trap/Escape/return-focus/`max-h-[85vh]`, replicating `ConfirmDialog`'s pattern rather than importing it, since `ConfirmDialog` unmounts its content on close and the wizard's content must persist across 7 screens — corrected 2026-07-27, see §23's chassis section) plus 4 additional pattern-level interaction rules on top: multi-screen state within one open dialog (title/body/content swap per step, dialog lifecycle stays open), a 3-slot Back/Next/Cancel footer instead of the usual Cancel/Confirm pair, an Escape/exit path that routes through a nested confirm-before-discard step (since the wizard has no partial save — abandoning mid-wizard would otherwise silently lose every answered step), and a true one-time terminal state once submitted (gates re-opening the trigger for this dyad, a data fact rather than a chassis change) |
| 2026-07-27 | v17 — §22 added, Round 6.1.1 (direct chat-edit batch against the already-signed-off Round 6.1 Home page, no pre-written scope plan — same format as Rounds 3.1/4.1/5.1): Gmail/Calendar/Zoom widget tiles now render real downloaded brand-logo PNGs (sourced from the round's own Figma reference, `public/logos/`) instead of a generic tinted `lucide-react` glyph — **supersedes §21's "no fabricated brand SVGs" rule for these 3 tiles only**; picker-added tools are unaffected. "Coming soon" tag removed from all 4 default widget tiles; label font reduced to `caption`; hover states (`-translate-y-0.5`/`shadow-md`, plus a `ring-primary/30` on the one real tile) added to all 4. New shared `search-input` component (`SearchInput.tsx`) replaces two independently hand-rolled search fields (Research Dashboard's Coach roster, this portal's consumers table) — one component, not per-area variants. Consumers table: "View" column now a bare `ChevronRight` (matching `ConsumerManagementPage.tsx`'s row-chevron convention, `sr-only` header); "Zoom" renamed "Session Link" and reuses the Consumer Portal's icon+text "Join Zoom" pattern; "Add consumer" removed entirely (out of scope for this portal); "Export" enabled, wired to a real CSV download via a newly-extracted shared `downloadCsv` helper (`lib/csv.ts`, also now used by the pre-existing Research Dashboard sleep-diary export, removing a duplicate implementation); toolbar's search+Export now sit horizontally beside the card's title block instead of stacked below it. Upcoming sessions panel's list is now vertically scrollable (`max-h-[252px]`), matching the round's own Figma reference's originally-specified scroll region that wasn't carried into the Round 6.1 build; a second `upcomingSession` added to `dyad-012` (Kellerman) demonstrates the multi-session/multi-day-group case for the first time, with the scroll region tuned so the second card peeks ~30% as a scroll cue. "Schedule a session" promoted from a disabled placeholder row to a real-looking (still inert) outlined button |
| 2026-07-27 | v16 — §21 added, Round 6.1 Phase 1 (Coach Delivery Portal Home page, widget system — a correction to the prior analysis pass's "static shortcut grid" read of the Figma reference, confirmed by the user as a real add/remove widget pattern): new `widget-tile` chassis (reuses `placeholder-card`'s inert convention + tag, square `radius-sm` brand-tinted icon badge distinct from the circular `PortalTile`/`PlaceholderCard` badge) with exactly one real tile (Coach Training Portal → `/training`) and default inert tiles (Gmail, Calendar, Zoom); `widget-tile--add` (dashed-border quiet action tile, distinct from both the solid real and inert states); `widget-picker` (reuses the `ConfirmDialog` chassis as-is, no new dialog primitive — row-list body slot, `min-h-11` rows, per-row "Add"→"Added" state, exhausted-state copy) listing 4 further mock tools (Slack, Microsoft Teams, Outlook, Google Drive). Every tile/row icon is a generic `lucide-react` glyph in a brand-tinted square badge — no fabricated brand SVGs, matching the module-cover-art precedent (§17). Explicitly documented that every added-via-picker tile is decorative only (same inert code path as the defaults) since nothing but `/training` has a real destination anywhere in this codebase — flagged so engineering doesn't wire a fake link. |
| 2026-07-27 | v15 — §20 added, Round 5.1 (Consumer Portal Home + Health & Sleep refinements, direct chat iteration, no pre-written scope plan — same format as Round 4.1): new one-off `--color-highlight` token (`#fdf6e0`) scoped to the Learning Dashboard card; `topBanner` sticky slot added to `consumer-shell` (scoped to `main`'s column, not full page width, to avoid the sidebar's own sticky offset), first used by a new dismissible "session today" banner; `fitbit-sync-monitor` gained optional `description`/`emptyMessage`/`memberLabels` props so the Consumer Portal gets plain-language, first-name copy while the Research Dashboard keeps its original wording (a deliberate fork, decided via `AskUserQuestion`) — also fixed a real bug ("Dummy data for this round" had leaked into shipped UI text) in the shared default, regardless of portal; new `formatTime` helper (12-hour + AM/PM); a reusable card height-balance pattern fixing a pre-existing CSS-grid dead-space bug (up to 200px in one state) affecting the Home page's 2-up card row. Design critique found and fixed 2 real defects (the height-balance bug, a full-name/first-name inconsistency in the Fitbit alert); accessibility review found and fixed 1 real defect (banner subtext contrast, 4.12:1 → 4.83:1 after `text-white/80` → `text-white/90`) — see `design/reviews/consumer-portal-round-5.1-*-report.md` |
| 2026-07-27 | v14 — §19 added, Round 5 (Consumer Portal, Health & Sleep Dashboard — first round for this portal): `consumer-shell` (Research-Dashboard-style sidebar, 2 leaves, no accordion, Learning Dashboard has no sidebar entry at all); `AppHeader` gained a `consumer` variant + `accountLabel` prop; `pearl-band` no-seam variant for the Home page's Welcome section; horizontal `session-roadmap` (new shape, existing `sessionCompletion` data) + `upcoming-schedule` row (shared by the roadmap's next-session row); `digital-sleep-diary` (first consumer-writable diary surface, new `addDiaryEntry` store action); `unified-data-visualization`; `trend-analysis` (first charting library — `recharts`, dual-axis real line charts, a deliberate break from the app's prior non-chart trend-glyph convention). Shared-field change: `sessionsCompleted` extended to carry completion date/time, read by both this portal and the Research Dashboard's existing `session-tracker`/`coach-matching-gate` views (`toggleSession` now stamps a real timestamp) |
| 2026-07-24 | v13 — §18 added, Round 1.1 (Coach Training Portal, mocked Okta Verify SSO sign-in gate): new one-off `signin-backdrop` token (`#0a1a3a`, scoped to a single pre-auth screen, no second accent introduced); `sign-in-flow` component spec covering a 4-step email→password→forgot-password→Okta-Verify-approval flow, built entirely from already-documented parts (`Card`/`shadow-card`, hand-rolled `button-primary`, the app's one prior real-input precedent now formalized as `dialog-input`); `training-auth-gate` mechanism (`sessionStorage` + `<Navigate replace>`, mirrored by the header's Sign out). Design critique + accessibility addenda together found and fixed 3 real defects during the round's expansion (1 crash from a missing `cn()` import, 2 minor touch-target gaps) — see `design/reviews/coach-training-portal-round-1.1-*-report.md` |
| 2026-07-24 | v12 — §17 added, Round 4.1 (cross-portal UI refinements, direct chat iteration, both portals): sidebar-nav inactive-state parity fix (Training Pipeline no longer permanently bold) + collapsed-nav tooltips (base-ui `Tooltip`, previously unused, replacing the native `title` attribute); every page `<h1>` capped at `display-md`, the `display-lg` desktop bump retired; the initials-avatar removed from all 10 render sites app-wide (`initials` data field kept, only the UI consuming it removed); `section-tabs` moved below the identity block on every record page (supersedes the Round 2 right-aligned-tabs architecture note) with a `layoutId`-driven sliding underline replacing the instant CSS one, applied to all 5 tab groups sharing this grammar; a full-bleed `bg-pearl` hero band added to every record page and the Training Dashboard, seam flush with the tab row; both portals' header account area unified into one real `Menu` dropdown (Edit profile / Sign out) replacing two different partly-dead placeholder patterns; `module-card` reworked — gradient-wash cover (`cover.colors` replaces `cover.tint`/`cover.icon`) stands in for real module photography, new Module-N + status-chip header row, "x/N slides" + bare "xx%" progress row replaces the checkmark/"Completed" text, full-width CTA, shadow dropped (this card only), description clamped to 2 lines. No new colour/type/radius tokens |
| 2026-07-24 | v11 — §16 added, Round 4 (Consumer Management area, standalone from Round 3/3.1's Coaches area): sidebar's last inert placeholder activated (`AreaPlaceholder` component deleted, now unused); `consumer-management-table` (extends `data-table`); `enroll-consumer-dialog` (direct structural reuse of the Coaches-area add-consumer form, no coach field); `consent-repository` (new — add/delete/upload, dummy filenames); `module-engagement-tab` (direct reuse of `engagement-tracker`/`slide-canvas`, scoped to a new 6-module `CONSUMER_MODULES` set, no review rows, no recordings card); `fitbit-sync-monitor` (extends `health-data-log` with Deep %/Light % columns, folds in Data Health Alerts as a per-member inline note computed by a shared `dyadHealthAlerts()` helper, which also drives a page-level dismissible banner); `sleep-diary-feed` (new — per-member toggle-open day rows + client-side CSV export); `coach-matching-gate` (new — pending/assigned states, a read-only `session-tracker` variant with zero interactive controls when unassigned). Design critique found and fixed 1 issue (2 instances): a subject-verb agreement bug in empty-state copy for compound dyad names, fixed by rephrasing rather than conditional pluralization. Accessibility review found 0 defects — verified live via dispatched keyboard events (roving-tabindex arrow-key nav) and DOM inspection (native `disabled`, genuinely-tabbable hidden file input, no falsely-interactive read-only controls). No new colour/type/radius tokens — everything expressed in existing tokens, including reusing `ConsumerDyad.patient`'s optional-field pattern from §15 for a new use (unassigned-consumer support, `coachId` now also optional) |
| 2026-07-24 | v10 — §15 added, Round 3.1 (Coaches area, post-signoff feature additions): new `coach-profile-tab` (participation + contact details + a Consumers data-table with Add consumer/View/Transfer); `add-consumer-dialog` (carer-only toggle) and `transfer-consumer-dialog`, both `confirm-dialog` extensions; `confirm-dialog` chassis fixed to cap at `max-h-[85vh]` with only its `children` region scrolling (was overflowing the viewport on long forms); `dyad-card` gained a carer-only variant (`patient` now optional, single full-width Carer card, "Carer only" chip, Health Data Hub's member toggle now hidden when there's only one member instead of rendering a single-tab tablist); `withdraw-participant` reuses `Coach.status`/`withdrawCoach` and is now gated (disabled, not hidden, while the coach's caseload is non-empty), styled `button-utility` (quiet `text-destructive`, matching "Withdraw coach") after an initial solid-`button-destructive` version was flagged in design critique as a §9-rule violation and reverted on confirmation. `workload-chip` retired (struck through in §13); Coach Management Table's Workload column and the invite dialog's workload field both removed. Design critique caught 3 real issues, all fixed: table row-actions at 28px (below the system's 36px control-height convention), the single-item tablist described above, and the destructive-fill rule violation |
| 2026-07-23 | v9 — §14 added, Round 3 post-signoff fixes from direct user feedback on the built UI: Training Pipeline's sidebar sub-list converted from an always-rendered list to a real route-driven accordion (open exactly on its own routes, closes when another area is selected; header now a real link defaulting to Recruitment (EOI); animated via Framer Motion; chevron rotates with state) — supersedes §12's "static chevron, not a per-section toggle" note. Active-indicator bar widened 2px→4px after its clipping (by the animation wrapper's `overflow-hidden`) and subsequent under-visibility (once un-clipped at 2px) were both fixed across two feedback passes; parent scoped to `overflow-y-hidden` so only the height animation clips, not the intentionally-offset indicator. Also fixed an app-wide latent bug in the shared `cn()` utility: `tailwind-merge` didn't recognise the project's custom `text-caption`/`text-fine`/`text-title`/`text-body`/`text-display-*` tokens as font-size utilities, so it silently dropped them whenever merged with a text-colour class — registered them under `tailwind-merge`'s `font-size` group via `extendTailwindMerge` |
| 2026-07-23 | v8 — §13 added for Round 3 (Research Dashboard, Coaches / SPACES delivery oversight): sidebar Coaches area activated as a single-page `AreaLink` leaf (was `AreaPlaceholder`); `workload-chip` (Light/Moderate/Full, qualitative-only per judgment call); `coach-invite-dialog` (confirm-dialog chassis + form, draws from certified-not-yet-invited coaches); `dyad-card` (separate patient/carer cards, read-only overview); `session-tracker` (direct §12 `phase-pipeline` reuse, 7 SPACES sessions, no lock-on-Pass); `annotation-vault` (direct §12 `engagement-tracker`/`slide-canvas` reuse, one row per consumer's post-practice summary); `supervision-notes` (new — note-creation form + notes-log table, dummy attachments); `health-data-log` (new — per-dyad-member daily log table with non-chart trend glyphs, explicitly not a chart per the user's flag). No new colour/type/radius tokens — everything expressed in existing tokens |
| 2026-07-23 | v7 — §12 added for Round 2.2 sub-rounds 2.2.1–2.2.9: sidebar rename (Consumer Management/Training Pipeline) + hierarchy (chevron, tree-connector, demoted placeholder weight); custom `select-chevron` (native arrow ignores padding); `engagement-tracker` flat list (accordion removed, no section-header text); `slide-canvas` as a direct, shadow-free, `hairline`-filled container with matched-height scroll regions (fixes a CSS Grid dead-space defect); `phase-pipeline` dot/tick markers + explicit Mark-complete/kebab-menu actions + confirm-dialog-on-every-change + lock-on-Pass; `certification-recording` (Record Pass / Record remediation required, closing a real UI dead end and the remediation loop). One control-sizing defect (32px/13px vs. the system's 36px/14px) found and fixed in the same pass, not deferred. Terminology conflict (§10/§11) still open |
| 2026-07-23 | v6 — §11 added for Round 2.2 (Research Dashboard, Trainees area): `module-accordion` (module rail → accordion + slide sub-items + module-level completion-rate %), `annotation-block` (annotations moved into the rail, split Baseline/Midline/Endline, "approved" label removed), `recording-card` (full-width Session recordings across phases), `phase-timeline` (vertical phase tracker with per-phase toggle) and `certification-gate` (cert card locked until phases 1–7; Download/Share/Email replace Generate-certificate). Header made `sticky top-0`. Tabs renamed Training Review / Trainee Tracking. Training oversight page removed. EOI detail → single form. No new colour/type/radius tokens. "Trainees" terminology conflict still open |
| 2026-07-23 | v5 — §10 `sidebar-nav` added for the Research Dashboard's collapsible left-hand hub navigator (Round 2.1). Retires the Round 2 top program bar + horizontal section tabs; "Program 1/2" naming dropped in favour of Consumers / Trainees / Coaches. Reuses §7 `side-nav` grammar; no new colour/type/radius tokens. Flagged the "Trainees" vs CLAUDE.md terminology conflict |
| 2026-07-22 | v1 created for Round 1 (Coach Training Portal — Training Dashboard + Module shell). Adapted from `DESIGN-apple.md`: dropped dark-tile surfaces and marketing components; snapped 17px spacing to 16px; reduced section padding 80→64px; darkened muted gray `#7a7a7a`→`#6e6e73` for AA contrast; added semantic state colors, motion tokens, and dashboard component specs |
| 2026-07-22 | v4 — system-wide design decision from the user (post-Round-2), applies to **both portals**: (1) control height 44px → **36px** and pill-label type 17px → **15px** (`button` token, §7 button specs, §8 Do/Don't) — buttons, selects, and inputs all 36px; relaxes the self-imposed 44px floor but stays WCAG 2.1 AA (no AA target-size criterion) and 2.2 AA (≥24px). (2) All cards gain a soft hairline shadow — new `shadow-card` token (`0 1px 2px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.06)`), applied on the shared `Card` component; §5 elevation philosophy revised (cards lift, other chrome stays flat). Added `Switch portal` link to the Coach Training Portal header so the switcher is reachable from either portal |
| 2026-07-22 | v3 — `state-success` corrected `#248a3d` → `#1f7d37` (Round 2 accessibility review measured the original at 4.40:1 on white / 4.22:1 on pearl — under the 4.5:1 AA floor for the 12–14px labels it colours; the v1 "AA-compliant" note was wrong). Applies retroactively to Round 1's "Completed" labels via the shared CSS token — see the Round 1 accessibility report addendum |
| 2026-07-22 | v3 — Round 2 (Research Dashboard) extensions: §9 added with `data-table`, `status-chip`, `section-tabs`, `confirm-dialog`, `button-destructive` (first sanctioned use of `#d70015` as a fill, dialog-confirm only). Round 2 design critique folded in: pearl utility buttons corrected pill→`radius-sm` per the §4 grammar; row-dimming banned in favour of chips (AA contrast) |
| 2026-07-22 | v2 — in-module page rebuilt per user-supplied Figma reference (frame `4934:85994`): `module-footer` replaced (frosted light bar → dark full-bleed bar with Home, section title + progress, Back/Next); removed the separate title/Support sub-bar entirely (Support deferred, "Slides" drawer trigger relocated into the footer for <`lg`); `side-nav`/`content-canvas` changed from a centered `max-w-[1400px]` layout to edge-to-edge (side nav flush left, canvas fills remaining width, inner 760px reading column kept for text only); added `header` `fullBleed` variant so the header's padding matches edge-to-edge pages exactly; corrected two footer-button deviations found during a design-system compliance pass — touch targets 40px→44px, typography ad hoc 14px/600→documented `button` token (17px/400) |

## §56. Brand palette swap (purple + yellow), Inter app-wide, and the Research Dashboard Home rebuild (Round 21 — Figma file `s6OLTSd4nc9V9W9lT1oBTO`, frames `1:38` + `23:2053`)

The largest token-layer change since v1. Two Figma frames drove it: a palette
sheet (`23:2053`) and the Research Dashboard Home page (`1:38`). Per direct
instruction the palette landed **first**, then the page was built against it.

### The ramps

Transcribed verbatim from the palette frame — no interpolated or invented steps,
so any colour in the app can be traced to a real swatch.

| Token | Hex | Palette label |
|---|---|---|
| `--color-purple-l6` | `#f4efff` | *(not on the sheet — the Home frame's own welcome-band tint)* |
| `--color-purple-l5` | `#e4d6ff` | Lighter 5 |
| `--color-purple-l4` | `#c2a3ff` | Lighter 4 |
| `--color-purple-l3` | `#a070ff` | Lighter 3 |
| `--color-purple-l2` | `#8447ff` | Lighter 2 |
| `--color-purple-l1` | `#5300fa` | Lighter 1 |
| `--primary` | `#3a00ad` | **Primary** |
| `--color-purple-d1` | `#200061` | Darker 1 |
| `--color-purple-d2` | `#08001a` | Darker 2 |
| `--color-yellow-l2` | `#fff8e5` | Lighter 2 |
| `--color-yellow-l1` | `#fff1cc` | Lighter 1 |
| `--color-yellow` | `#ffe299` | **Primary** |
| `--color-yellow-d1` | `#ffcc4d` | Darker 1 |
| `--color-yellow-d2` | `#ffb700` | Darker 2 |

**Neutrals, greys and blacks are untouched** — `ink`, `ink-muted`, `ink-faint`,
`parchment`, `pearl`, `hairline`, `divider-soft`, `muted`, `header` all carry
their pre-Round-21 values.

### Repointed off blue

| Token | Was | Now | Why |
|---|---|---|---|
| `--primary` | `#0066cc` | `#3a00ad` | the palette's own Purple Primary. **11.78:1** with white, measured live — the swap *gained* contrast on every filled CTA |
| `--color-primary-hover` | `#0055ab` | `#200061` | still "one step darker than primary," which the hover states and the `next` chip tone both depend on |
| `--ring` | `#0071e3` | `#5300fa` | deliberately brighter than `primary` so a focus ring stays visible sitting on a filled primary button |
| `--color-link-on-dark` | `#2997ff` | `#a070ff` | lightest ramp step still reading as brand hue on the black header |
| `--color-chart-accuracy-light` | `#a8cdf0` | `#c2a3ff` | this chart pairs its light shade directly against `--primary`; a light *blue* would have left the app's one two-tone chart off-palette |

`--color-tier-foundational` (`#eff6ff`) and `--color-tier-sleep` (`#f0fdf4`) were
**deliberately left alone**: they are a categorical blue/green *pair* on the Coach
Delivery Portal's Learning tab, and repointing one half breaks the pairing.
Flagged rather than swept.

### Renamed: `--color-card-header-blue` → `--color-card-header`

Repointed `#eaf3fc` → `#e4d6ff` (Purple Lighter 5), with all 20 call sites
renamed mechanically. The name had to change with the value — a token called
`card-header-blue` holding a purple is the kind of lie a later round has to
re-derive.

**This produced a real AA regression, found and fixed in-round.** §50 had already
flagged `ink-faint` on the old blue band as a marginal 4.52:1 "to re-check if
this hex ever shifts." It shifted. Measured from real painted pixels in the
browser (not calculated): `ink-faint` on the new band is **3.71:1 — fails AA**.
26 card-header subtitles were moved to `ink-muted` (**9.24:1**, measured);
`ink` titles measure **12.31:1**.

> Two cautions worth carrying forward. (1) My own arithmetic first put that
> figure at 4.16:1; the browser said 3.71:1. This file now carries a *third*
> instance of a "verified" contrast number that didn't survive an independent
> recompute — compute these from what the browser paints, via
> `getComputedStyle` on a live element, never from the authored hex.
> (2) The sweep used a 14-line forward scan from each `bg-card-header`, which
> reached one line past the band in roughly ten places, darkening a content-
> section caption from `ink-faint` to `ink-muted`. Harmless (darker = more
> contrast) but unintended, and not individually verified — a structural
> match on the band's closing tag would have been the right tool.

### New: `--shadow-notice-card`

`4px 4px 12px 0 rgba(0,0,0,0.06)` — the Home frame's `alert-card` shadow,
transcribed exactly. It gets its own token rather than borrowing `shadow-card`
because that one is a symmetric `0 1px 2px / 0 2px 8px` whisper while this is
offset down-and-right: a visibly different direction of light. **It is the only
shadow anywhere in frame `1:38`**, which is the point — see the standing rule in
`CLAUDE.md` that absence of a shadow is as binding as presence.

### Type: Inter app-wide

`tsc --noEmit` and `oxlint` **both run clean in this sandbox** — worth stating
plainly because CLAUDE.md's Round 19.1/20 entries record them as "confirmed
unverifiable (no `node` binary)". There is a node binary, at
`$HOME/.local/node/bin` (the same PATH `.claude/launch.json` already exports to
start the dev server); it just isn't on the default PATH. Every claim in this
section was typechecked, not only rendered.

`--font-sans` and `--font-display` both move from SF Pro Text/Display to
**Inter**, self-hosted via `@fontsource-variable/inter` (no CDN dependency, no
FOUT, full 100–900 range from one variable file). SF Pro only ever rendered on
Apple hardware anyway — everywhere else the stack silently fell through to
`system-ui` — and every Figma frame this project now builds from is drawn in
Inter. The two tokens stay separate despite resolving to the same family: ~200
`font-display` usages encode real heading-vs-body intent.

**The type scale gained 6 steps — and this reversed a decision made earlier the
same day, which is worth recording because the first version was wrong for a
measurable reason.**

Pass 1 followed a "closest existing step" instruction: 56→`display-lg` 40,
24→`title` 21, 20→`title`, 18/16→`body` 17, 13→`caption` 14, each with the
frame's weight/tracking bolted on. Measuring all 16 text elements live rather
than eyeballing them showed 5 off by 1-3px **and several weights simply not
matching** — a 24px/500 Figma heading rendering as 21px/600 doesn't read as a
1-off approximation, it reads as a different type system.

Pass 2 (shipped) adds the frame's real steps, each carrying the frame's own
weight and letter-spacing as the token default, so a call site gets correct
typography from the token alone instead of stacking three override classes on an
approximate one:

| Token | Size / weight | Used for |
|---|---|---|
| `--text-display-xl` | 56 / 700 | the hero greeting |
| `--text-heading` | 24 / 500 | all three section headings |
| `--text-subtitle` | 20 / 400 | the hero subtitle |
| `--text-lead` | 18 / 700 | "Quick links:" |
| `--text-md` | 16 / 600 | day headers, the alert-count badge |
| `--text-label` | 13 / 400 | stat labels, alert messages, row meta lines |

15px is deliberately **not** a token: buttons and tabs already use the app-wide
`text-[15px]` convention, which matches the frame exactly.

**Verified, not asserted:** all 18 measured elements now match the frame's size
*and* weight exactly (18 pass / 0 fail), read back from `getComputedStyle` on the
live page. The standing rule in `CLAUDE.md` was rewritten to match, with its
superseded first version noted in place.

The earlier pass had also swept its (approximate) treatment across the 8 other
Research Dashboard pages; those pages keep the larger/bolder hero and subtitle
that sweep gave them, so Home isn't typographically alone.

### `NotificationHubView` gains one `layout` prop

`'delivery'` (default, unchanged) vs `'research'` (the frame's shape: heading +
alert-count badge *outside* a `parchment` panel, tiles 4-across, 4px pill-bar
pagination, bordered white cards with a full-width CTA). **One prop, not six** —
the two layouts diverge visually but share every behaviour that took two
accessibility rounds to get right (dismiss focus-return, the `aria-live`
announcement, the carousel's `ResizeObserver` re-anchor). Forking would have
duplicated all three. Three now-unused props (`subtitleClassName`,
`showHeaderIcon`, `messageClassName`) were deleted in the same pass.

`NotificationItem` gains optional `actionLabel`/`actionTo`. Round 18's rule that
"these are notices, not navigation" is about the *tile* not being a link; an
explicit labelled CTA is a different affordance, and all 5 research notice
categories have a real destination, so these are real `<Link>`s.

### Later the same round — 7 direct-feedback corrections

Each was measured live before and after, not eyeballed:

1. **Buttons → the app's own three canonical styles.** The frame's bordered-rect
   buttons were replaced: alert-card CTAs → primary-outline pill, row
   Edit/Delete → the `bg-pearl` utility button, Start and "Schedule session" →
   primary-filled pill. The frame decides where a button goes and what it says;
   the app decides how it looks. This is now a standing rule in `CLAUDE.md`.
2. **All page titles → weight 500.** `display-xl`/`display-lg`/`display-md`
   token weights changed 700/600/600 → 500, and the 6 `font-bold` overrides the
   earlier type sweep had added to research page titles were stripped so the
   token is the single source.
3. **Pastel alert red.** New `--color-alert-pastel: #e45f5b` (the frame's own
   soft red) replaces `destructive` on the attention section's alert icons and
   count badge. `destructive` keeps every other job app-wide — those are real
   errors and shouldn't soften.
4. **⚠️ The count badge's white text is a known AA failure**, accepted on direct
   instruction. White on `#e45f5b` measures **3.45:1** against a 4.5:1
   requirement (16px/600 is not "large text"). An earlier pass used `text-ink`
   *because* it clears at 4.88:1; white was then requested explicitly. Two
   one-line fixes are recorded at the call site: keep white and deepen the fill
   to `#cc4340` (4.73:1, still clearly softer than `destructive`), or revert to
   `text-ink`. Flagged, not silently shipped.
5. **Pagination gap 16px → 8px.** The bars were already pixel-correct (24×4
   active, 8×4 inactive) but `gap-2` on the row *plus* `px-1` on each button
   double-counted. Now `gap-0` + `px-1`, which yields exactly 8px between bars
   while keeping the hit areas adjacent with no dead zone.
6. **Sliding tab underline restored.** The frame draws a static colour-only
   active tab; the app's `framer-motion` `layoutId` underline was reinstated by
   reusing the record-page pattern verbatim (same spring, same `h-0.5
   bg-primary`). Verified moving: x 320 → 433.5 on switch.
7. **A first pagination attempt using `bg-clip-content` was wrong and is
   recorded as such** — it depended on Tailwind's border-box height maths in a
   way that rendered incorrectly. Replaced with the boring version: a padded
   button wrapping a child `<span>` that draws the bar.

### Deleted

`--color-schedule-group`/`-placement`/`-supervision` (§50's per-column tints for
the 3-column "Your schedule" Kanban board, which the frame's tabbed day-grouped
table replaces). Zero readers left in `src/`. Deleted rather than kept "for
future reuse": a token scoped by its own doc comment to a deleted component
isn't reusable, it's an unexplained colour.

---

---

## §57. Trainee Management rebuilt from Figma `23:1453`; `ResearchPageHero` / `StatCard` / `UnderlineTabs` extracted; a real stage-vs-progress data invariant enforced (Round 21 continued)

The second frame of the page-by-page revamp, plus the extractions its overlap
with Home forced.

### Three components extracted, each at the moment it got a second caller

| Component | Why |
|---|---|
| `research/ResearchPageHero.tsx` | The hero's type treatment changed **four** times in one session (purple band → `display-xl` → weight 500 → one step smaller). With the markup copy-pasted across five pages, each change needed five edits and drifted between them — the user caught exactly that: "I can see you have reduced font title for this page but not for all tabs." Now one component; all 5 research tabs verified identical at **40px / 500 / `purple-l2`**, sub copy **20px / 400**. |
| `shared/StatCard.tsx` | Home's "Study overview" and Trainee Management's "Trainees overview" are the *same* yellow tile in both frames. Kept separate from the older `KpiTile` rather than adding a flag: `KpiTile` bottom-anchors its value and reserves a subtext line, both load-bearing for the shared-baseline alignment it exists to provide. `KpiTile` still serves Consumer Management. |
| `shared/UnderlineTabs.tsx` | Direct instruction for the new roster tabs was "operate same as one for schedule sessions," so Home's meetings tabs and Trainee Management's roster tabs share one implementation — sliding `layoutId` underline, roving tabindex, Left/Right/Home/End. Verified moving: x 320 → 433.5. |

### Page changes

"Trainee Management" → **"Manage trainees"**; "Trainee insights" → "Trainees
overview"; white `KpiTile` row → yellow `StatCard`s; all three filter selects,
"Clear filters", and the `bg-card-header` band removed, leaving a title + search
row **above** the card — so this table is a **documented exception to §35a**: its
header isn't inside the card at all. New **Active trainees / Certified** tabs,
with Certified deliberately showing "No data available" (certified coaches are
managed under Coach Management). New section sub-lines on both this page and
Home's meetings section, at `text-body` — a one-off 16px was tried and reverted
on the correct objection that 17px *is* the default token.

### Frame vs. instruction: the instruction won, twice

Frame `23:1453` still draws **Needs Help** and **Date Raised** columns (nodes
`23:1943`/`23:1945`, populated with Marcus Webb's "Yes" and "18 Jul 2026"), and a
5th **Needs support** KPI tile. All three were removed on direct instruction. The
underlying `needsSupport`/`supportRaisedDate` fields are untouched — they still
drive the trainee profile banner and Home's notification hub — so this is a
presentation change, not a data-model one.

### The substantive part: `Modules Completed` + `Last Active`, synced to stage

Adding these columns turned an invisible data problem into a visible one, which
is the useful thing about putting derived state on screen. `lastActive` is a new
optional `Coach` field; absent means never signed in, rendered "Never".

The invariant: **Current Stage and Modules Completed are two views of the same
progress and must agree.** Reaching Stage O (Guided group practice) requires
finishing Content learning; an unaccepted invite means no learning at all. Two
real violations, both fixed **at the data layer** rather than papered over in the
column:

- **Priya Raman** — `inviteStatus: 'pending'` yet 2 modules complete + 2 in
  progress. A Round 9.1 audit flagged this and it was deliberately left alone at
  the time; that call no longer holds now the roster prints "Modules completed"
  beside her "Invite pending" chip. Zeroed, `lastActive` omitted.
- **Aisha Mohamed** — Stage O with only 8/12 complete. A Round 9.1-continued
  audit *reports having fixed this*, so it either never took or regressed.

Fixed via a new `fillRecordsComplete(explicit, date)` beside `fillRecords`,
which closes every module *not* explicitly listed — so the invariant can't drift
as the curriculum grows. Note the subtlety it does **not** cover: an explicit
`inProgress()` record survives it, which is why Aisha still measured 11/12 after
the first pass and needed one entry closed by hand. Verified by script across all
6 trainees: **ALL CONSISTENT**.

### Two layout bugs found by measurement, not by looking

- **`SearchInput` had `sm:w-[280px]` hardcoded on the `<input>`**, silently
  capping the field regardless of its wrapper: the 340px field this frame asks
  for rendered as a 280px input in a 340px box with 60px of dead space — the
  "empty space?" report. Width lifted to the wrapper as a `widthClassName` prop
  with the old value as default, so no caller changes and two competing `sm:w-*`
  classes never fight at equal specificity.
- **The table's fixed column widths totalled 958px inside an 893px card.** It
  overflowed, scrolling the chevron column out of sight and squeezing names onto
  two lines. Removing every fixed width and letting only genuinely-unwrappable
  cells carry `whitespace-nowrap` fixed all three symptoms at once: table now
  893px in an 893px card, chevron visible, names on one line.

`tsc --noEmit` and `oxlint` clean throughout.

---

---

## §58. `needsSupport` deleted app-wide; the module/stage invariant made airtight; `design/layout-audit.js` added (Round 21 continued)

Three follow-ups, each closing something the previous pass left open.

### 1. The support flag is gone, not just hidden

Round 21's first Trainee Management pass removed the **Needs Help** column, the
**Date Raised** column and the **Needs support** KPI tile, but explicitly noted
the underlying fields were "untouched." Direct instruction then went further —
"get rid of any need support data, no longer needed" — so `Coach.needsSupport`
and `Coach.supportRaisedDate` are **deleted from the data model**, along with
everything that read them:

- the seeded values on Marcus Webb
- `NeedsSupportBanner` on the trainee profile, its dismiss state, and the
  `topBanner` branch that composed it with the pending-invite banner (which now
  renders directly)
- the study-wide "flagged as needing support" notice in
  `ResearchNotificationHub`, plus its `supportItems` bucket and `LifeBuoy` import
- the now-unused `X` icon import left behind on `CoachProfilePage`

Nothing in the app tracks a support flag now. `headingRef` on the trainee profile
is deliberately **kept**: the needs-support banner introduced it, but it is also
the heading-focus target the Round 20 accessibility work established for that
page independently.

> Process note worth keeping: deleting the banner with a brace-matching script
> cut from the wrong offset and left an orphaned JSX fragment — a real syntax
> error that broke the whole app. It was caught immediately because `tsc` and
> `oxlint` are run after every edit, which is the only reason it cost a minute
> rather than a session. Automated multi-line deletions need a compile check, not
> a glance.

### 2. `fillRecordsComplete` now actually enforces the invariant

The version added earlier only synthesised records for modules **absent** from
its explicit list, so an explicit `inProgress(...)` entry passed straight through
and still violated "Stage O implies Content learning complete." Aisha Mohamed
measured 11/12 at Stage O for exactly that reason and had to be patched by
hand — which is the drift the helper exists to prevent.

It now maps *every* module in the curriculum and **promotes** any explicit
non-completed record, preserving whatever real response and date it already
carried, and clearing `slidesCompleted` (meaningful only while in progress).
Verified across all 6 trainees: **ALL CONSISTENT**, with no completed record
carrying a stale partial slide count.

### 3. `design/layout-audit.js` — layout bugs become detectable

Direct instruction: "make sure there are no layout bugs in future iterations."
Since the three bugs in question all looked *fine* in a screenshot, the answer is
a measurement pass, not more care. Seven checks: page horizontal scroll, table
wider than its container, control not filling its wrapper, short table text
wrapping from a squeezed column, controls under 36px, elements past the viewport,
and uneven heights across 3+ sibling tiles. Now **step 5 of the frame workflow in
`CLAUDE.md`, and not optional**.

**It found two real bugs within minutes of being written**, both on the
already-"finished" Home page:

- the alert-card CTA rendered at **31px** despite carrying `h-9` — it is a flex
  child of a fixed-height card, and `h-9` is a height, not a minimum, so
  flex-shrink compressed it below the enforced 36px floor. Fixed with `shrink-0`.
- the carousel pagination hit area measured **22px**, under WCAG 2.2 AA's 24x24
  (2.5.8). Raised to 26px via padding; the visible 6px bar is unchanged.

**Calibrating it mattered more than writing it.** The first run reported **37
findings on a page that was correct** — an audit that cries wolf gets ignored,
which would defeat the point. Three root causes, all now documented as
CALIBRATION NOTEs in the file itself:

| Symptom | Cause | Fix |
|---|---|---|
| Every table cell "3 lines" | `height / line-height` includes the cell's own `py-3` padding | measure line boxes via `Range.getClientRects()` |
| `0 of 12` cells still "3 lines" | `getClientRects().length` returns one rect per **text node**, and JSX renders `{n} of {N}` as three | count **distinct rect tops** |
| Skip-link + every table name link "under 36px" | `.sr-only` elements and plain text links in cells aren't tap targets | exclude both; pagination dots judged against WCAG 2.2's 24px instead of the app's 36px |
| Trainee profile "uneven grid heights" | a 2-column master/detail split is *meant* to be uneven | only flag rows of **3+** siblings |

Final state: **0 findings across all 7 research pages** (Home, Trainee
Management, Consumer Management, Coach Management, My Profile, and two trainee
profiles). `tsc --noEmit` and `oxlint` clean.

---

---

## §59. Consumer + Coach Management on the shared chassis; the record-page Overview pattern; `StatCard.breakdown` (Round 21.1)

**Round 21.1 (2026-08-20)** continues the revamp: the two remaining Research Dashboard list pages moved onto the chassis §57 established, and the three record pages behind them got one shared Overview shape.

### `StatCard` gained `breakdown`

`breakdown?: { label, value }[]` renders named parts **beside** the headline number, baseline-aligned. Consumer Management's tile uses it with no `value` at all — "Consumer breakdown · PLE 4 · Carer 4".

A caption line *under* the value was built first and is the wrong shape for this card, recorded here so it isn't retried: the value is `mt-auto`-pushed to the bottom of a fixed 120px tile, so a caption either overflows the fill (**measured at 124px**, text visibly spilling below the yellow) or forces every other tile in the row to reserve an invisible line just to keep the numbers on one baseline. Inline costs no vertical space, so tiles with and without a breakdown stay identical.

### The record-page Overview pattern

All three record pages (trainee, consumer, SPACES coach) now open on the **name alone** — no participant ID, no employer, no lifecycle chip. Measured spacing: name → sub copy 16px (was 8px under a 40px title, which is what read as crowded), sub copy → tab row 32px.

The trainee and consumer Overview tabs share one shape:

| Region | Treatment |
|---|---|
| **Contact details** | `bg-yellow` card, `rounded-lg`. Rows are one shared grid (`sm:grid-cols-[max-content_1fr]`) so every value starts on the same x; the colon is pushed to the label track's right edge with `ml-auto` so all colons line up in their own column. Label and value share one size (17px) and one colour (`ink`), separated by weight. No icons — they only repeated the label. Consumer variant puts each dyad member on a `bg-yellow-l1` panel. |
| **Learning progress** | White card. Stats sit on a `bg-pearl` band (`flex-1` + `justify-center` so it fills the card's remaining height), labels and values on two aligned rows via a 2-column grid, then a full-width progress bar. Capped at 420px the bar stopped short of the card edge and a 12-of-12 trainee read as unfinished. Below the band, a bulleted list with `marker:text-ink` and emphasised values in `text-primary`. |
| **Card headers** | Title + optional CTA on a `min-h-9` row, so a card with a 36px CTA and one without still sit their titles on the same line (measured: both at `top: 403`). |

### Horizontal COACH pathway timeline (trainee only) — card titled "Coach certification pathway"

Markers are positioned by **percentage** — stage `i` at `i / (count - 1)` — so the first sits flush left and the last flush right. Centred-in-equal-columns left visible dead space at both ends. 48px markers; connector track drawn behind them at their own vertical midpoint (`top-[23px]` = half the marker less half the 2px line). The current stage carries an `animate-ping` ring at `bg-primary/40`, `motion-reduce:hidden`. State line: `Completed on: {date}` / `In progress` (`text-primary`, semibold) / `Not started`.

**The band's `px-10 py-12` is load-bearing, not decorative:** the ping expands to twice the marker's size and the scroll container clips it, because an `overflow-x-auto` element clips vertically too (per spec, `overflow-y` computes to `auto`).

### Layout-audit finding worth keeping

The timeline's scroll container needed **`min-w-0`**. Without it the 720px content sized the container, which forced the *whole page* into horizontal scroll and pushed the sessions table's trailing column off-screen. Neither symptom is visible in a screenshot; `design/layout-audit.js` caught both. Any scroller holding `min-w`-ed content in a flex/grid chain needs this.

### Where headings live: inside vs outside the card

Settled this round after going both ways:

- **Card holds a table** → heading + sub copy sit **outside**, on the page canvas (Consumer Management, Trainee Management, and both record pages' "Scheduled sessions"). This is §35a's documented exception.
- **Card holds anything else** → heading, sub copy and CTA all sit **inside** (Contact details, Learning progress, Certification pathway).


---

## §60. The type scale replaced wholesale from Figma's published text styles; 5 steps removed, 3 added (Round 21.3)

**v50.** The app's type scale is no longer a set of steps derived from individual Figma *frames* (Round 21's method, §56). It is now transcribed verbatim from the Figma file's own **published local text styles**, read via `getLocalTextStylesAsync()` on file `s6OLTSd4nc9V9W9lT1oBTO`. Ten styles, and these ten are the whole scale — there is no longer any step in `index.css` that does not exist in Figma.

### The scale

| Token | Size | Weight | Tracking | Notes |
|---|---|---|---|---|
| `display-xl` | 56 | 500 Medium | -1px | Defined, **currently unused** in JSX — kept because it is a published Figma style |
| `display-lg` | 40 | 500 Medium | 0 | Page `<h1>` in every hero |
| `display-md` | 32 | 500 Medium | -0.374px | Was **34px** |
| `sub-greeting` | 20 | 400 Regular | 0 | Hero sub-line only (see below) |
| `title` | 24 | 400 Regular | 0 | Was **21px / 600 / +0.231px** |
| `body-md` | 16 | 600 Semi Bold | 0 | **New** |
| `body` | 16 | 400 Regular | 0 | Was **17px / -0.374px** |
| `caption-semibold` | 14 | 600 Semi Bold | -0.224px | **New** |
| `caption` | 14 | 400 Regular | -0.224px | Unchanged |
| `fine` | 12 | 400 Regular | -0.12px | Unchanged |

Line heights are the one thing **not** taken from Figma: it reports `AUTO` for all ten, so the app keeps its own ratios rather than inheriting a browser default that differs from Figma's own auto-height calculation.

### Five steps were removed, and where each went

`heading`, `subtitle`, `lead`, `md` and `label` have no equivalent among the published styles. Per direct instruction, each call site moved to the closest surviving class **matching its weight**, not merely its size:

| Removed | Was | Moved to | Why |
|---|---|---|---|
| `heading` | 24/500/-1px | `text-title font-medium` | Same 24px; `title` defaults to 400, so the 500 is kept explicitly. This is also the app-wide card-title treatment asked for directly ("all titles 24px, medium Inter") |
| `subtitle` | 20/400 | `text-sub-greeting` | Exact match — see below |
| `lead` | 18/700 | `text-body-md` | 600 is the nearest available weight, 16px the nearest size |
| `md` | 16/600 | `text-body-md` | Exact 1:1 match |
| `label` | 13/400 | `text-caption` | Weight matches exactly. 14px chosen over `fine`'s 12px — both are 1px away, and rounding small meta text *up* is the safer call for legibility |

### `sub-greeting` arrived mid-migration and made `subtitle` a rename, not a resize

`subtitle` (20/400) was removed and its 5 call sites mapped to `title` (24/400) — the closest weight-matching class at the time. `sub-greeting` (20/400, identical spec) was then added to the Figma styles, so those call sites moved again, to `text-sub-greeting`. Net effect for them: a **rename**, not a size change. The new name is the better one because it says what the step is *for*.

**Scope rule: `sub-greeting` is for the sub-line under a page's greeting/title in a hero band, and nothing else.** A card's sub-line is `caption`. It is currently on exactly 3 heroes — `ResearchPageHero` (which serves every Research Dashboard page), `DeliveryHomePage`, `ConsumerHomePage`.

### `body` / `body-md` and `caption` / `caption-semibold` are regular/semi-bold pairs

Each pair is one size, two weights. Figma initially reported both `body` and `body-md` as 16 Semi Bold, which was confirmed directly as not the intent ("I want two body — regular and semi-bold"), so `body` was built at 400.

**Resolved — the Figma style has since been corrected too.** Both sides now read `body` 16/Regular and `body-md` 16/Semi Bold, verified by API. An earlier version of this section warned not to re-read the Figma style because it was out of date; that no longer applies.

### Every hardcoded pixel size was folded into the scale

The migration also removed **all 138** `text-[Npx]` arbitrary values that duplicated or approximated a step — including 62 instances of `text-[14px] font-semibold tracking-[-0.224px]`, which was `caption-semibold` spelled out longhand, and 28 of `text-[14px] tracking-[-0.224px]`, which was `caption`. Redundant `tracking-[-1px]` overrides sitting beside `title`/`display-lg` were stripped too: both now carry tracking `0` from the token, so the override was actively fighting it.

**`text-[15px]` is the sole surviving arbitrary size (96 uses) and is deliberate** — the app-wide button and tab convention, which matches Figma exactly.

### Verification

All ten tokens were confirmed by reading `getComputedStyle` off live injected elements, not by trusting the CSS. This mattered: the two new compound-name tokens (`body-md`, `caption-semibold`) were the real risk, since a Tailwind v4 `--text-*` key containing a hyphen could plausibly have been mis-parsed against its own `--font-weight` suffix. Both resolve correctly. `display-xl` reported a false failure in that harness purely because it has no JSX call site, so the JIT never generated the utility — the token is fine.

### Blast radius

`body` (17→16, plus losing its -0.374px tracking) and `title` (21/600 → 24/400) are used in the **hundreds** across all four portals. This is the widest-reaching typographic change the project has made, and it lands on pages the Round 21 revamp has not otherwise touched — the entire Coach Delivery Portal and Consumer Portal inherit it automatically. All three portals were spot-checked live and render coherently. `tsc` and `oxlint` clean throughout.

---

## §61. Colour aligned to Figma's published styles; brand ramps renamed to Tailwind numeric (Round 21.3)

**v51.** Same method as §60 did for type: colours now come from the Figma file's own **published paint styles** (`getLocalPaintStylesAsync`), not from individual frames.

### Neutrals — six styles, four already exact

| Figma style | Hex | App token | Changed? |
|---|---|---|---|
| `neutral/white` | `#ffffff` | `--background`, `--card` | already exact |
| `neutral/off-white` | `#f5f5f7` | `parchment`, `--accent` | already exact |
| `neutral/black` | `#1a1a1a` | `ink` | **yes** — was `#1d1d1f` |
| `neutral/dark-grey` | `#333333` | `ink-muted` | already exact |
| `neutral/light-grey` | `#6d6d6d` | `ink-faint` | **yes** — was `#6e6e73` |
| `neutral/lighter-grey` | `#e0e0e0` | `hairline`, `--border` | already exact |

**Two Figma styles were edited to resolve conflicts, rather than the app silently diverging:**

1. **`neutral/light-grey` `#999999` → `#6d6d6d`.** `ink-faint` is the app's most-used secondary *text* colour (~322 call sites). `#999999` measured **2.85:1 on white** — failing AA (4.5:1) and even the 3:1 graphical floor, on every surface. `#6d6d6d` is the lightest neutral grey clearing 4.5:1 on all four core light surfaces (white 5.17, pearl 4.96, parchment 4.75, divider-soft 4.54), found by search. It also **fixes a long-standing 4.45:1 near-miss** on `divider-soft` documented in `ModuleTimeline.tsx`, and is a *true* neutral where `#6e6e73` carried a blue cast.

   ⚠️ A first attempt proposed **`#767676` and it was wrong** — checked against white only (4.54:1); it fails on pearl 4.36, parchment 4.17, divider-soft 3.99. This file already carries three notes about "verified" contrast numbers that did not survive recompute. This is a fourth. **Check every surface a token actually paints on.**

2. **`neutral/black` fill `#000000` → `#1a1a1a`.** The style's fill said `#000000` but its own *description* said `#1a1a1a`. Taking the fill at face value briefly made `ink` pure black; the description was the intent, confirmed directly. Both sides now hold `#1a1a1a`. **A Figma style's fill and its description can disagree — check both.**

### The two orphan greys were folded into the ramp

`pearl` `#fafafc` and `divider-soft`/`--muted` `#f0f0f0` had no Figma equivalent. On instruction both moved to the closest available grey. `parchment`, `pearl`, `divider-soft`, `--muted`, `--secondary` and `--accent` now all resolve to **one** value, `#f5f5f7` — the names are kept as aliases (collapsing ~200 call sites is churn with no visual benefit) but they are no longer distinct colours.

Mapped by **role, not raw distance**, and that mattered twice:
- `pearl`'s nearest step is actually plain **white** (7.68 vs off-white's 8.66 — near-tied). White was rejected: 107 `bg-pearl` panels sit *on* white cards and would have vanished.
- `divider-soft`'s 29 border/rule/ring uses could not follow its 85 fill uses to off-white — `#f5f5f7` on white is **1.06:1**, an invisible rule. Those call sites migrated to `hairline` (`#e0e0e0`), the step that exists for that job.

### Brand ramps renamed to Tailwind numeric

The `l6/l5/…/d1/d2` names are gone. They had become actively misleading: Figma's labels were `Lighter 5` = `#f3efff` and `Lighter 6` = `#e4d6ff` — the "6" *darker* than the "5" — while this file mapped them the opposite way. Nothing in "Lighter 4" told you where it sat relative to `primary`.

| Purple | Hex | | Yellow | Hex |
|---|---|---|---|---|
| `purple-50` | `#f3efff` | | `yellow-50` | `#fff8e5` |
| `purple-200` | `#e4d6ff` | | `yellow-100` | `#fff0cc` |
| `purple-300` | `#c2a3ff` | | `yellow-200` | `#ffe299` |
| `purple-400` | `#a070ff` | | `yellow-300` | `#ffcc4d` |
| `purple-500` | `#8447ff` | | `yellow-400` | `#ffb600` |
| `purple-700` | `#3a00ad` | | | |
| `purple-900` | `#200061` | | | |
| `purple-950` | `#08001a` | | | |

Steps are assigned monotonically by **measured relative luminance**, using Tailwind's own violet/amber ramps as the reference for what each number means. Gaps (no `purple-100/600/800`) are deliberate and honest — this is an 8-step brand ramp, not a synthesised 11-step one. Nothing is interpolated; every value is a real Figma swatch.

**Three 1-hex-step drifts were corrected** in the sync: `purple-50` `#f4efff`→`#f3efff`, `yellow-100` `#fff1cc`→`#fff0cc`, `yellow-400` `#ffb700`→`#ffb600`.

**`--color-purple-l1` (`#5300fa`) was deleted** — no Figma style backed it and it had zero call sites. Removed rather than carried forward as `purple-600`, an unexplained step nobody uses.

`--primary` (`#3a00ad`) and `--color-primary-hover` (`#200061`) stay as semantic tokens alongside `purple-700`/`purple-900`. Deliberate: a button says `bg-primary` because it is the brand action colour, not because it is the 700 step.

### Verification

Every token confirmed from painted pixels via `getComputedStyle`, not read from source. Note the JIT reports a **false negative** for any token with no call site (`display-xl`, `bg-purple-400` — the latter is only ever used as `hover:bg-purple-400`); an unused utility is simply never generated, which is not the same as a broken token. Two stale contrast claims that the `ink` change invalidated were recomputed and corrected in place: `ink` on `alert-pastel` is **5.04:1** (was documented 4.88) and on `card-header` **12.73:1** (was documented 13.8). `tsc`/`oxlint` clean.

---

## §62. Contact details / Learning journey cards on the trainee + consumer Overview tabs, rebuilt from Figma frames `45:39`/`45:92`/`45:484` through many live-feedback passes (Round 21.2)

**v52.** Both Overview cards were rebuilt from their own Figma frames, then iterated live against the user's own Figma edits across roughly a dozen small follow-ups in one sitting — each one read back from the file via `use_figma`, never assumed from memory. Final state, both trainee and consumer:

- **Outer card**: `yellow-100` (was `yellow-50` in the first pass), `rounded-[28px]`, `p-6` (was `px-10 py-9` — corrected once, then corrected back down to 24px uniform padding after the frame itself changed).
- **Avatar + detail rows now share ONE surface** inside the card, not two. This went through three shapes in one sitting: two separate tinted boxes → one `yellow-200` panel holding both → **no inner fill at all**, avatar and rows sitting directly on the card's own `yellow-100`, separated only by a rule. Each version was read from Figma, not guessed.
- **Divider between avatar and rows**: a real 1px line (`93:9`), restroked twice during the session — `yellow-400` (`#ffb600`) → **`purple-900`** (`#200061`). Not a neutral hairline either time; a grey rule on this yellow surface reads as a smudge.
- **Avatar ring**: a genuine 2px **linear-gradient** stroke (`#fcda9b` held to 52.6%, blending to white, `strokeAlign: INSIDE`), not a flat ring. CSS has no gradient border, so it's built as a gradient-filled circle with 2px padding and the photo clipped inside — which also reproduces `INSIDE` alignment exactly, since the ring eats into the 101px circle rather than growing it.
- **Avatar shadow**: read from the node's own `effects`, not inferred from the exported PNG — offset `2/8`, blur `14`, `rgba(127,94,10,0.3)`, a warm gold at 30% rather than a neutral black (a grey shadow on a yellow surface reads as dirt).
- **⚠️ App-wide "no avatars" exception, still narrowly scoped to this one card.** Reintroduced on direct instruction ("override, and follow figma design"), same category as Round 20's since-retired attendee-chip exception. One fixed stock photo (`public/avatars/trainee-avatar.jpg`, swapped from an initially-female frame asset to a male one on follow-up, since the demo trainee is male) — not a per-trainee headshot; the dataset has none.
- **Typography, read from bound styles, not eyeballed**: card title `title` (24/500); name/PLE:/Carer: `sub-greeting` (20/400, briefly tried at `display-md` 32 before the user re-bound the Figma node to `sub-greeting` and it was corrected to match); detail-row **labels and colons are `body-md`** (16/600), **values are `body`** (16/400) — a mid-session correction after an earlier pass had put both label and value at `body` following an unrelated "md → body regular" instruction that turned out to apply to values only.
- **Learning journey card**: heading renamed to the frame's own "Learning journey" (not "Learning progress" — the tab it links to keeps its own name); stats panel restyled to match (label `caption`/`ink-muted`, "of N" promoted to `display-md` beside the number, number no longer extra-bold); **Key updates panel recoloured `#fef7f7` (pink) → `parchment` `#f5f5f7`** once the frame repainted it to match the stats panel above it, closing out the short-lived `--color-key-update-panel` token entirely (deleted from `index.css` — zero remaining readers, confirmed by grep before removal).
- **Both cards shadow-free.** `<Card>` applies `shadow-card` by default; the frame carries no shadow on either card, so both now pass `shadow-none` explicitly. This is the fix for a "the shadow doesn't match" report — the app's own default was the mismatch, not a missing effect.
- **Vertical centring, not top alignment.** Both cards stretch in their `grid` row to match whichever is taller; the frame centres each card's own content within that stretched height (`flex-1 justify-center` on the content block) rather than leaving the extra space to pool at the bottom, while the card *title* stays pinned to a shared `min-h-11` header row so both titles land on the same line as the neighbouring card's "View more" button.

Applied identically to `CoachProfilePage.tsx` (trainee) and `ConsumerDetailPage.tsx` (consumer) — the consumer card additionally shows a `Name` row per dyad member and uses `PLE:`/`Carer:` in place of the trainee's bare name.

## §63. Trainee record-page shell rebuilt from frame `45:161`; the "Upcoming stages and sessions" table redesigned from a single ambiguous status into readiness + booking (Round 21.2 continued)

**v53.** Second half of the same page. Full top-down audit against `45:161`, then applied section by section:

- **Hero**: new "Trainee:" eyebrow above the name (`title`/`ink-faint` — settled on `ink-faint` after the frame's own fill, `#6d6d6d`, turned out to be exactly `neutral/light-grey`, the value landed on together during the earlier contrast investigation). Back-link → semibold. Tabs → 16px semibold active / regular inactive (`caption-semibold`/`caption`, not the `body-md` first tried), 32px gaps, underline width matched to the frame's `strokeBottomWeight: 3`.
- **Pathway card retitled** "Coach certification pathway" → **"Trainee certification pathway"**, new sub copy from the frame. **The sessions table was moved *inside* this card** as a second section — a documented, deliberate exception to §35a's "a card holding a table carries its title outside" rule, because here the table is the second half of one story (where the trainee is → what's booked next), not a standalone data surface.
- **Timeline markers were invisible** — `bg-divider-soft` had been silently repointed to `#f5f5f7` by the Round 21.3 grey consolidation (§61), the exact colour of the panel behind the markers. Fixed to `purple-200`, a real ramp step, not a patch.
- **The "Stage specific actions needed" table was redesigned**, not just re-skinned, following a `/design:user-research` pass: the old single `Status` column only reported *booking*, so "not due for months" and "ready right now, nothing booked" rendered identically — every future row showed the same amber "Not scheduled" chip, which is why the section needed a nag subtitle telling researchers to remember to schedule. Split into **Trainee readiness** (`Ready now` / `Not yet` / `Stage complete`) and **Session booked** (`Booked` / `Not booked`), with `warning` tone reserved for the one combination that actually needs a human — ready **and** unbooked — and `muted` everywhere else. **`Meeting ID` and `Action` columns removed**: Meeting ID only helps someone about to join the call (not a researcher), and Action held a "Start" link plus a "Schedule" button — the latter is a capability researchers are explicitly not meant to have from this page. Retitled **"Upcoming stages and sessions"** after "Stage specific actions needed" was found to promise an action the page can't deliver, and to claim actions were needed even when everything was booked and on track.
- **Sub copy went through 4 versions in one sitting**, worth recording because two failed for reasons that generalise: v1 (the frame's own) told the researcher to do something this page deliberately can't do (schedule a session); v2 was accurate but restated the two column headers directly beneath it, spending a line saying nothing new; v3 asserted an unverified fact ("Coaches book these sessions") that is likely wrong for the cohort-scheduled Stage O session; v4 — **"Keep track of where this trainee is up to, and take the relevant actions"** — states the job without naming who books, the honest position since the platform has no scheduling write path to point at.
- **A researcher cannot schedule or start a session from this table, on direct instruction.** The unscheduled-row cell that used to hold a drawn-but-unwired "Schedule" button now renders a plain em dash.

## §64. App-wide record-page consistency sweep: `TabIntro`, unified tab treatment across all 3 researcher record pages, button-height audit, card padding (Round 21.3 continued)

**v54.** Four separate consistency passes, each triggered by a direct visual report rather than a self-initiated audit — logged together because each is small but all four are app-wide.

- **New shared `components/research/TabIntro.tsx`** — per-tab title + sub copy (frame `93:7`: `title`/`ink` + `body`/`ink`, 8px gap, `py-4` added on direct instruction) now sits above every tab's own content on all **three** researcher record pages (trainee, consumer, SPACES coach) — **15 tab panels total**, each with real copy naming what that tab is for, not a placeholder. Built as one component specifically because the identical per-page-header pattern has drifted across five pages once already in this project (the reason `ResearchPageHero` was extracted in Round 21) — a per-tab copy-paste here would have been five chances to diverge before anyone noticed, times three pages. Title colour corrected `ink-muted` → **`ink`** (black) same day, on a direct side-note report.
- **Card padding: 32px → 24px.** The pathway/table card had drifted to `p-8` while its own frame specifies `[24,24,24,24]`; corrected, and the container's internal `px/py` were found transposed (`px-10 py-12` where the frame is `[40 top/bottom, 48 left/right]`) and fixed to `px-12 py-10`. Section gaps (tab-intro → cards → pathway) and the cards-row gap were both found at 32/40px against the frame's real 56px and corrected across all three record pages.
- **Tab row unified across all 5 tab-bar instances app-wide** — the three researcher record pages, the shared `UnderlineTabs` (used by 3 list pages), and the two PLE/Carer member-switchers. Underline stroke `h-0.5` → `h-[3px]` everywhere; tab buttons switched `items-center` → `items-end` with `pb-3`, which was the actual fix for "the gap between text and underline isn't consistent" — centring a fixed-height touch target left ~15px of dead space above the stroke, `items-end` collapses it to the frame's real 9px.
- **Button-height audit, run across all 4 portals, not assumed.** A live report ("View more" vs. "Go to Stage Management" rendering at visibly different heights) turned out to be **this session's own regression** — the app was already uniform at 36px (`h-9`), a floor enforced across three earlier rounds (3.1/10/18), and a frame-literal `py-2.5` implementation of "View more" had introduced a 43px outlier. Fixed by keeping the app's 36px height and adopting only the frame's *typography* (14px semibold, 1.5px border) — satisfies both the frame and the pre-existing floor. The audit this prompted found **three more real, unrelated offenders**: Research Home's Quick Links pills (40px, `py-2.5` with no explicit height), the Coach Delivery Home "Add ad-hoc meeting" CTA (44px, `h-11`), and the Learning tab's "Finish all modules to unlock" pill (39px, `min-h-9 py-2`) — all three fixed to `h-9`. Final measured state: **43 pill/rect buttons across 8 pages spanning all 4 portals, 100% at 36px, zero offenders** (script-driven `getBoundingClientRect()` sweep, not a visual scan).

## §65. Three trainee record-page tabs (Learning Progress, Stage Management, Personal details) authored directly in Figma from the app's own code, using only published styles and real auto-layout (Round 21.3 continued)

**v55.** The user asked to "push and recreate" these three tabs from a specific Figma page (`93:11`, "Page 3"); reading it via `use_figma` twice returned **zero child nodes** both times — not a sync issue, since other pages in the same file read correctly in the same session. Confirmed directly with the user rather than guessed, and the user asked for the frames to be authored fresh rather than the request being silently reinterpreted.

Built as three top-level auto-layout frames on Page 3 (`Trainee — Learning Progress`, `Trainee — Stage Management`, `Trainee — Personal details`), each a faithful design translation of the real `LearningProgress`/`StageManagement`/`PersonalDetails` React components in `CoachProfilePage.tsx` — not a guess at new content. Every text node is bound to a real published text style (`title`/`body`/`body-md`/`caption`/`caption semi-bold`/`fine`); every fill is bound to a real published paint style (`neutral/*`, `Purple/*`, `Yellow/*`); **every button is its own auto-layout pill frame** (padding + corner radius + a text child), not a rectangle with text placed on top, per direct instruction. Content is representative rather than exhaustive — a realistic sample of rows per section (e.g. 2 modules per curriculum tier, not the full ~12), flagged as such rather than presented as complete.

Two fixes made mid-build, not left for a second pass: `createAutoLayout()` frames default to a white fill in the Plugin API, which showed through as an unwanted white strip behind the bar-chart placeholder and each SIPTEA row sitting on the `Purple/50` panel — stripped via a targeted `fills = []` pass across both node types before final screenshot review.

---

## §66. The trainee record page rebuilt from Figma `152:176`: a purple hero band, the warm `Card shadow`, `--background` off white, `--primary` = `purple-700`, and every line height moved to `normal` (Round 23)

**Frame:** `152:176` "Trainee management_inner page_1", file `s6OLTSd4nc9V9W9lT1oBTO`.
**Do-not-change list given with the frame:** side nav, global header, and the
`inner-pathway-container` (the grey box holding the 5-stage horizontal
timeline). All three were left untouched; the pathway box already measured the
frame's own `px-48 py-40` from Round 21.3, so nothing needed to move there.

### The five global items

Every one of these propagates beyond the trainee page, which is the point — the
frame's page structure is shared across the three researcher record pages.

| Token | Was | Now | Why |
|---|---|---|---|
| `--primary` | `#3a00ad` | `#4A278F` (`purple-700`) | Settles the divergence the Round 22 handover left open. The frame uses `Purple/700` for *every* brand-coloured element and nothing uses `#3a00ad`. White on it is **10.62:1** (was 11.8:1) — still AAA, so no filled control regressed. |
| `--background` | `#ffffff` | `#fffcfa` | The frame's page canvas is a warm off-white, sampled as the modal value over a clean 65×150 region. No Figma paint style backs it; it is a literal in the frame. The sidebar and cards stay pure white, so the tint is what separates canvas from card. |
| `--shadow-card` | `0 1px 2px / 0 2px 8px` neutral black | `2px 4px 16px rgba(230,194,127,0.2)` | Figma's own published `Card shadow` effect style. Warm gold, offset down-and-right. |
| Card border | `ring-1 ring-hairline` (`#e0e0e0`) | `border border-parchment` (`#f5f5f7`) | Per-card, not on the `Card` default — see "what was deliberately *not* swept" below. |
| All `--text-*--line-height` | 1.1–1.43 ratios | `normal` | See below. This is the one to watch. |

### Line heights: the previous note was wrong, and it was the whole vertical drift

`index.css` had said Figma reports `AUTO` for every text style, so the app kept
its own ratios rather than "inheriting a browser default that differs from
Figma's own auto-height calculation." Measured against this frame, they do not
differ — both are Inter's own metrics:

| step | Figma node height | old ratio gave | `normal` gives |
|---|---|---|---|
| `display-lg` (40px) | 48 | 44.0 (1.1) | 48 |
| `display-md` (32px) | 39 | 38.4 (1.2) | 39 |
| `title` (22px) | 27 | 26.4 (1.2) | 27 |
| `body-md` (16px) | 19 | 22.4 (1.4) | 19 |
| `body` (16px) | 19 | 22.4 (1.4) | 19 |
| `caption` (14px) | 17 | 20.0 (1.43) | 17 |
| `fine` (12px) | 15 | 15.6 (1.3) | 15 |

So they were drift, not a considered divergence — and they were the systematic
reason blocks landed a few px off the frame everywhere. With `normal`, the hero
band measures **259px against the frame's 257** (two 1px font-metric roundings)
rather than 264, and no compensating magic numbers are needed anywhere.

⚠️ **This is the sweeping one.** `body` and `caption` are used in the hundreds
across all four portals and multi-line copy is now ~15% tighter. It is what the
design specifies, but it is the change most likely to be felt outside the
trainee page. Reverting is restoring the ratios in the table above; nothing else
depends on it. `display-xl` (56px) keeps its explicit `1.05` — not exercised by
this frame, and a tight ratio on a 56px display line is a real choice.

### The record-page hero band

`Header Section` (`152:211`), applied to **all three** researcher record pages:
solid `purple-700`, `pt-10` / `md:px-20`, no bottom padding (the band's bottom
edge *is* the active tab's underline), 48px between blocks. White name at
`display-lg`, `parchment` eyebrow at `body-md`, `caption-semibold` white active
tab, `caption` `--color-on-purple-muted` idle tabs, **`yellow-300` active
underline** (`primary` would be invisible on the band).

Two numbers in there are load-bearing and should not be "tidied":

- **`mt-[33px]` on the tab row, not `mt-12`.** The frame puts 48px between the
  name block and the tab *text*, drawing each tab as a bare 17px line + 12px
  bottom padding. Our tabs carry `min-h-11` for the 36px control floor, which
  bottom-aligns the text 15px lower inside the button — so the margin absorbs
  it (48 − 15 = 33). It also closes the band at exactly 257px, because
  33 + 44 lands there.
- **`-my-3 py-3` + `flex w-fit` on the back link.** The frame draws it as a bare
  17px text line; any `min-h` pushes the whole band's geometry down. Negative
  margin keeps the flow box at 17px while the padding still gives a 41px
  target. It must be **block-level** `flex`, not `inline-flex`: as an inline box
  it sits in a line box whose strut is taller than the text, so the negative
  margins never fully cancelled and the band came out 7px tall.

`SpacesCoachProfilePage`'s two hero CTAs are the only buttons the revamp puts
*inside* a band, and the frame doesn't cover them. Both canonical styles resolve
to `primary`, which is now the band's own colour — a filled `bg-primary` button
would have been invisible. The pair is **inverted** rather than restyled: white
fill + `primary` text for the primary action, white outline + white text for the
secondary, preserving the same hierarchy.

### New tokens

- `--color-on-purple-muted: #c4b5fc` — the frame's idle tab label. Not on the
  published Purple ramp (`purple-300` `#c2a3ff` is a different hue) and no paint
  style backs it. Named for the surface it paints *on*, since that is all a call
  site needs to know. **5.75:1** on `purple-700`.
- `--radius-xs: 4px` — the Key-updates list container inside a `rounded-sm`
  (8px) panel: the half-of-my-parent rule one level deeper.
- `--text-fine-semibold` (12/600/−0.12) — the frame's status badges. **Added as
  a second step rather than flipping `--text-fine--font-weight` to 600**, which
  is what a literal re-sync would do: Figma's single `fine` style *is* now Semi
  Bold, but `text-fine` has 175 call sites and is the app's quiet 12px meta type
  across three other portals. Open question for the user; if app-wide semi-bold
  is the intent, this token becomes redundant.

### Page structure

- **`Frame 108`** — the tab's intro copy and the Trainee Details card now share
  one 32px-gap row (the card at the frame's 568.5px, the intro taking the rest).
  So `CoachProfilePage` renders `<TabIntro>` **inline inside `Overview`** and
  suppresses the panel-level one for that tab only; the other four tabs are
  unchanged.
- **Section gaps are 24px**, not 64px.
- **Trainee Details card** — vertical `yellow-100`→white gradient (which is why
  the detail rows no longer need their own white panel: the card's lower half
  *is* white), 1px `parchment` border, warm shadow. The "Contact details"
  heading is gone; the card leads with the name at `title`. Detail rows are the
  frame's literal three tracks (`110px 24px 1fr`) with the colon as its own
  `aria-hidden` span outside both `dt` and `dd`, so it never joins either
  accessible name. **The avatar's gradient ring and gold shadow are removed** —
  node `152:469` is a plain 104px ellipse with an image fill, no strokes, no
  effects (verified against the node and by rendering the card in isolation).
- **Learning Progress card** — now full width, two `parchment` panels 24px
  apart: a flex-1 "Progress:" panel (stats row on a shared baseline via
  `h-16 justify-between`, a 6px `purple-200` track, a white 72px Current-Stage
  sub-panel) and a fixed 640px "Key updates" panel. Splits at `xl`, not `lg` —
  640 + ~409 only fits past ~1100px.
- **Sessions table** — fixed `<colgroup>` widths, `py-5` rows with the 32px side
  inset carried by the first and last cell only, header type on `ink-faint`,
  Stage at `body-md`, Session/Scheduled-for at `caption` `ink-faint`.

### Measured result

| element | frame | live |
|---|---|---|
| hero band | 257 | 259 |
| intro + card row | 174 | 176 |
| Trainee Details card | 568.5 × 174 | 569 × 176 |
| detail-row grid tracks | 110 / 24 / 240.5 | 110 / 24 / 240.5 |
| Learning Progress card | 1121 × 358 | 1288* × 364 |
| both inner panels | 254 | 254 |
| progress track | 6px | 6px |
| Current-Stage sub-panel | 72 | 72 |
| status badge | 74 × 27 | 75 × 27 |
| Key-updates list | 174 | 174 |
| section gaps | 24 | 24 / 23 |

\* width differs because the app's content column is 1320px capped, not the
frame's 1512px artboard. The +6 on the card height is the 36px control floor
applied to the "View more" button (frame draws 32px) — a documented
non-negotiable that outranks the frame.

`design/layout-audit.js` returns empty on the rebuilt page.

### What was deliberately *not* swept

- **The `Card` component's own default** still ships `ring-1 ring-foreground/10`.
  86 call sites pass `ring-hairline`; repointing the default would have been a
  much larger blast radius than this frame justifies. The frame's
  `border-parchment` treatment is applied per-card on the pages the revamp has
  reached.
- **List pages keep their `purple-50` hero.** The frame covers a record page;
  nothing here says what a list page's band should be.
- **The frame's female avatar.** Round 22 swapped to a male photo on explicit
  direct instruction ("this card's own demo trainee, Marcus Webb, is male") and
  the frame most likely predates that. Flagged, not silently reverted.
- **`Chip`'s other five tones** keep their hues; only the geometry (27px,
  `px-4`, 12/600) and the `muted` tone follow the frame. `muted` moving to flat
  `parchment` + `hairline` is a small contrast *gain*: 4.75:1 vs 4.59:1.

### Content the frame invents, and what replaced it

The frame draws five Key-updates rows, three of which are placeholder copy
("Action items: Next steps for sleep improvement", "Sleep hygiene: Optimizing
your environment", "Weekly check-in: Progress and reflections") — none a real
Care2Sleep concept, and two describing *consumer* sleep content rather than a
trainee's record. New `overviewKeyUpdates()` takes the panel's shape from the
frame and derives its content from the real record: ongoing module → annotation
summaries by timepoint → last completed module → next booked session. That
reaches four or five rows for an active trainee without fabricating anything.
Terminology follows CLAUDE.md, not the frame: "Baseline review" is an
**annotation summary**.

"Mark all as read" and the per-row kebabs have no write path and render as
focusable `aria-disabled` controls with `sr-only` "(coming soon)" cues. The
kebab carries `-my-2.5` so it stays a real 36×36 target while contributing only
16px to the frame's 43px row — without it the row grew to 61px and one fewer
update fit in the scroller.

---

## §67. Learning Progress, Stage Management, Supervision Notes and Personal details rebuilt; card outline + radius fixed at the root (Round 23 continued)

Frames: `93:188` (Learning Progress), `172:742` (Stage Management), `174:5`
(Supervision Notes), `174:291` (Personal details). Same do-not-change list as
§66 throughout: side nav, global header, and the horizontal pathway box.

### The card contract, fixed once in `Card` rather than 52 times

Direct instruction: **every card has a 16px outer radius and a
`neutral/off-white` outline stroke.** Implemented on the shared component:

```
- rounded-xl ... shadow-card ring-1 ring-foreground/10
+ rounded-xl border border-parchment ... shadow-card
```

`rounded-xl` already resolved to 16px via `--radius-xl`, so only the outline
moved. **Ring -> border is deliberate, not incidental**: the frames draw a
*stroke*, and a ring paints outside the box where a border is part of it. Call
sites that genuinely want no outline now pass `border-0`.

Follow-through, all mechanical:
- the now-inert `ring-hairline` / `ring-0` / `ring-1` overrides were stripped
  from `<Card>` call sites across **25 files**;
- the two radius outliers (`rounded-[24px]` on the consumer Learning-journey
  card, `rounded-[16px]` on a yellow contact card) became `rounded-lg`;
- literal `rounded-[16px]` inner panels became `rounded-lg` — same value, now
  expressed as the token;
- the one card that deliberately has no outline (`bg-green-50`, Delivery Portal)
  gained an explicit `border-0` so it didn't silently acquire one.

Verified live: every card reports `16px` radius + `1px rgb(245,245,247)`.

Modal/dialog panels and menu popups keep their own `ring-1 ring-hairline` — they
are not cards, and the instruction was about cards.

### Type: `fine` is now Semi Bold app-wide

`--text-fine--font-weight` 400 -> **600**, on direct instruction ("update the
font globally"), matching Figma's own `fine` style, which changed since the
Round 21.3 sync. ~175 call sites across all four portals: chips, status badges,
table meta, timestamps, counts. A first pass added a second
`--text-fine-semibold` step by analogy with `caption`/`caption-semibold`; that
was **removed** — Figma has exactly one `fine`, and carrying two here would have
the app claiming a distinction the design system doesn't make. Nothing about it
is load-bearing for layout: 12px at `normal` leading is 15px tall at either
weight.

Also: **KPI card titles moved `caption-semibold` -> `caption`** (`StatCard` and
the bespoke "Reviews shared" tile), matching a Figma style change.

### Learning Progress (`93:188`)

- KPI tiles: `rounded-[12px]`, 16px gaps, `caption-semibold` labels, 18px icons,
  and `h-full min-h-[120px]` instead of a hard `h-[120px]` so the row stretches
  to its tallest tile rather than clipping them all.
- The row is **`1fr 1fr 1fr 400px`**, not four equal quarters. Load-bearing, not
  cosmetic: with the frame's larger type on "Reviews shared" (`title` 22px
  values, up from `caption-semibold` 14px), equal quarters clipped every value
  to "Pendi…". The 400px track gives its three sub-columns exactly the frame's
  112px.
- The Round 21.3 note justifying that tile's *smaller* type is superseded and
  marked so — it was written when the tile had to fit a fixed 120px card.
- Slide-card tags moved above the title, left-aligned (was opposite it on the
  same baseline).
- **Em dash, not "Pending"**, for an unreached reflection timepoint, with an
  `sr-only` "Not yet reached" so the original reason "Pending" existed (a screen
  reader landing on a bare dash) is handled without changing what is drawn.
  `No` is kept for a review that exists but is unshared — a different state, and
  collapsing both to a dash would hide the one worth chasing.

### Stage Management (`172:742`)

- Two cards, **`1.75fr 1fr`**, height-matched via `h-full` on both. Not an even
  split: the pipeline holds five two-line rows plus a right-aligned action, and
  narrowing the certification column is what scales the certificate artwork down
  (it is `w-full` on a real `viewBox`, so its size is a consequence of the ratio).
- The `bg-card-header` title block is gone; its job moved to the tab intro, and
  the frame replaces it with a real table header row ("Stage & progress" /
  "Action"). That band is **`purple-50`** with `ink-muted` labels (11.19:1) and
  **no bottom stroke** — a documented, frame-driven divergence from §35a's "one
  hairline under every card title": the tint is the boundary, and a hairline
  under a tinted band would be a second, redundant one.
- Rows: the timeline is **reused as-is** on direct instruction, re-seated into
  fixed-height rows. The connector is now split *above and below* each marker
  (each `flex-1`, transparent at the two open ends) — that is what lets a
  fixed-height row still draw one continuous line through all five nodes.
- Rows **grow** (`flex-1` + `min-h-16`) rather than the list adding gaps. That
  distinction is load-bearing: `justify-between` would spread the rows apart and
  break the timeline, because the connector only draws continuously if rows stay
  flush and absorb slack internally. Row height went 52 -> 64 -> flexible on
  direct feedback; dead space below the last row dropped from ~210px to 16px.
- **Ongoing / Complete labels** use the shared `<Chip>`, not the frame's own
  pill. The frame draws 11/700 in a 19px box, which would have been a *fourth*
  status-chip geometry; the app's rule is that the frame decides placement and
  wording while the shared component decides appearance. It also fixed an a11y
  gap: the frame's raw `#218c21` on `#d9f2de` measures **3.66:1**. Ours are
  `success` 4.67:1 (Complete) and `next` purple 14.4:1 (Ongoing) — `next` chosen
  on direct instruction to match Overview's own "Ready now".
- Chips sit on the **stage-title line, 16px after it**, not centred against the
  two-line block where they floated between both lines and belonged to neither.
- **Certification card**: the certificate is *not* hidden once every stage is
  ticked (direct instruction) — it stays, at 100% opacity, with its rosette
  turned green. Two committed SVGs in `public/illustrations/`;
  `certificate-earned.svg` replaces only the rosette's three yellow steps with
  `--color-success` composited over white at 35% / 65% / 100% — the same
  alpha-mix the chips use, rather than inventing a three-step green ramp this
  palette doesn't have. Regenerate from `certificate.svg` with those mixes if
  `success` ever moves.
- "Not yet assessed" moved onto the card title's line and is now **`destructive`**
  (direct instruction), which also reddens the SPACES coach Profile-details row
  — judged correct, not collateral: same blocked state, and `destructive` is
  already this app's "nothing has happened and it should have" tone.

### Supervision Notes (`174:5`) — shared, so all three callers moved

`SupervisionRecords` is reused by this tab, the SPACES coach Supervision Logs
tab, and the Coach Delivery Portal's Session Notes tab. The form is the same form
everywhere, so it moved together:
- card `p-32` / `gap-24`; fields 44px tall, 8px radius, 16px padding, with a
  `caption-semibold` `ink-faint` label 8px above;
- the Notes textarea is 160px on **`parchment`** — the frame fills that one
  field to separate the free-text input from the single-line ones;
- Attach File / Save note became `px-6` pills; "No files attached" sits below a
  divider at `caption-semibold`.
- Records: the heading moved **out** of the card onto the page canvas
  (`body-md`, 16px above). The card is `yellow-50` with a `purple-50` header row
  and white rows, no outer border. Columns are the frame's fixed widths with
  Title flexing.
- **`recordsSubline` was deleted**, not left as a dead prop: with the heading
  outside the card there is no header band to hold a sub-line, and its one
  override (the Delivery Portal's "Your own notes, most recent first.") went
  with it.

### Personal details (`174:291`)

Two stacked cards 40px apart, each a `purple-50` header band (64px, 24px sides,
`title` heading, action pinned right) over 40px label/value rows.

**`RecordRowDivider` is its own component** for a real reason: the frame's rule
between rows is a **16px band with a hairline centred in it, inset 24px** — not
a `border-b`, which would sit flush against the next row and run the card's full
width.

The tab-level `TabIntro` is suppressed here (direct instruction): both cards
carry a header band naming themselves, so a third title repeated the same words.

**The frame's content is a researcher's own profile** ("Claire Donnelly /
Research coordinator / Monash University"), borrowed from a My Profile screen.
This is a *trainee* record, so the real fields stay, and "User ID" / "Join date"
keep the project's own terms — **Participant ID** and **Enrolment date**.

One measured fix: the "Withdraw from study" button's fill is opaque `bg-card`,
**not** `bg-destructive/8`. A translucent 8% tint sitting on the `purple-50`
band composites to a pinkish `rgb(241,220,236)`, where `destructive` is only
**4.15:1** — an AA failure. On white it is **5.38:1**, and it matches the white
"Edit details" button on the sibling card.

### Process note worth carrying forward

A `{/* … */}` comment placed inside a JSX *attribute list* is invalid, and
**`tsc --noEmit` passed it while Vite's oxc parser rejected it** — the page went
blank behind a green typecheck. Caught from `preview_logs`, not from `tsc`.
`tsc` alone is not proof the app still builds here; check the dev server's own
errors too.

---

## §68. Consumer record page Overview rebuilt from Figma `194:2555`: one contact card per dyad member, a clamped Background with a real expand, the assigned coach in the hero, 40px section rhythm, and `caption` back on an explicit line height (Round 24)

**Frame:** `194:2555` "Consumer management_inner page_1", file `s6OLTSd4nc9V9W9lT1oBTO`.
**Unchanged on direct instruction:** the sessions plan table (labels, columns,
statuses) — it already matched the outer visuals and was not touched.

### Two app-wide changes

| Token / rule | Was | Now | Why |
|---|---|---|---|
| Overview section rhythm | 24px (`gap-6`) | **40px** (`gap-10`) | Direct instruction; the frame's own `Frame 108` -> `Learning Progress Card` -> `Frame 137` offsets are 40. Applied to the **trainee** Overview too, so the two record pages keep one rhythm. |
| `--text-caption--line-height` | `normal` | **`130%`** | Direct instruction — Figma's `caption` style moved off AUTO. 14 x 1.3 = **18.2px** against `normal`'s ~17px. The **only** step off `normal`; `caption-semibold` is a separate Figma style and still reports AUTO, so it was deliberately left alone. Multi-line `caption` copy gains ~1px per line app-wide. |

### The header band

`Frame 107` (node `194:2595`) turns the two stacked identity lines into one
row, 24px apart, split by a 1px `white/40` rule. Labels are `body-md`
`parchment` (9.75:1 on the band), names `title` white. The rule is
`hidden sm:block`: below `sm` the pair wraps, and a vertical divider between
two wrapped lines sits in the wrong place.

**Assigned coach** (`Frame 136`, node `194:3037`) was added to the band on a
live frame update mid-round, 16px under the identity row: a
`caption-semibold` `parchment` label plus a 32px pill.

- assigned -> the frame's own `purple-200` fill, `ink` text, **12.73:1**
- unassigned -> the frame draws no such state, and `destructive` red is
  unreadable on a purple band. A translucent `white/15` pill with `parchment`
  text carries it instead: **6.51:1** measured over the *composited* surface,
  not the authored value.

Measured live: band gaps 16px and 33px (the `mt-[33px]` convention from §66,
which resolves to the frame's 48px optical gap), pill 32px.

### Contact details: one card per person

`Frame 136` (node `194:2829`) replaces the single card that held both people in
stacked white panels with **two equal-width cards, 32px apart**, on the trainee
card's own chassis: a vertical `yellow-100` -> white gradient, 1px `parchment`
border, the warm card shadow, and the frame's three literal row tracks
(`110px 24px 1fr`) with the colon as its own `aria-hidden` span outside both
`dt` and `dd`.

Each card leads with the person's **own name** at `title`, so the "Contact
details" heading is gone — the same call the trainee card made. What now
distinguishes the two is a **role badge**, not a `PLE:`/`Carer:` line:

- `PLE` -> `purple-500` fill, white text, **4.85:1**
- `Carer` -> `yellow-400` fill, `ink` text, **9.90:1**

Deliberately **not** a `<Chip>`. These are identity labels, not status, and the
frame gives them the brand's two hues rather than any of the six status tones —
so routing them through `StatusChip` would have meant either inventing two more
tones or mislabelling a role as a state. Rows are Email / Phone / Background;
consumers carry no participant ID, so the trainee card's third row has no
equivalent.

### The Background row's "Show more" — the round's one net-new behaviour

The frame draws Background capped at 3 lines with an ellipsis, which silently
loses the rest of a genuinely long clinical note. Clamped to 3 lines as drawn,
with a toggle that reveals the full text.

Three details are load-bearing:

- **The toggle only renders when the text actually overflows** — measured
  (`scrollHeight > clientHeight`), not inferred from a character count, and
  **re-measured through a `ResizeObserver`**, because whether 3 lines are
  enough depends entirely on the card's width. On `dyad-011` exactly one card
  gets a toggle (the carer's note fits); on `dyad-030` both do. That difference
  is the measurement working, not an inconsistency.
- **It sits inside the value column, directly under the text** (`-ml-2` pulls
  the button's own padding back so its label starts on the value column's x —
  verified identical at 487px). It was first built at the card's left edge
  below the whole panel and moved on annotated feedback: a toggle at the card
  edge reads as belonging to the *card*, not to the text it expands.
- **Focus never leaves the button.** It does not unmount on click, and
  `aria-expanded` flips — verified by real clicks in both directions with
  `activeElement` reads. This is the defect class this project has shipped in
  six separate rounds, so it was checked rather than assumed.

Clamped height measures **55px** = 3 x 18.2, the new `caption` metric.

### Learning progress card

Node `194:2632`, superseding the half-width version that shared a row with the
contact card. Now full width and structurally the same as the trainee's own
(§66): a flex-1 "Progress:" panel and a fixed 640px "Key updates" panel, 24px
apart, splitting at `xl` rather than `lg` for the same reason.

The white 72px sub-panel is the trainee card's "Current Stage" slot. A consumer
has no COACH stage, and the frame fills it with the fact that does apply:
**Total sessions completed**, counted through `catchupSessionsCompleted()`
(Round 21.1) so it excludes the unnumbered Planning session and cannot
disagree with the sessions table directly below it.

**Key updates content is derived, not transcribed.** The frame draws five rows,
three of which are placeholder copy ("Action items: Next steps for sleep
improvement", "Sleep hygiene: Optimizing your environment", "Weekly check-in:
Progress and reflections") — none a real Care2Sleep concept and none backed by
a field on `ConsumerDyad`. New `consumerKeyUpdates()` takes the panel's shape
from the frame and derives every row from the record: ongoing module ->
assigned coach -> last completed module (+ its real date) -> next booked
session -> session plan status, with `destructive` on the three genuinely
absent states. Same call §66 made for the trainee's version of this panel.

"Mark all as read" and the per-row kebabs have no write path and render as
focusable `aria-disabled` controls with `sr-only` "(coming soon)" cues; the
kebab keeps §66's `-my-2.5` so it stays a real 36x36 target while contributing
only 16px to the row.

### Verified

`design/layout-audit.js` returns **empty** on the rebuilt page in both the
collapsed and expanded Background states, and on the trainee Overview at
1600px. `tsc --noEmit` and `oxlint` clean.

⚠️ **One pre-existing finding, out of scope, not fixed:** at a **1440px**
viewport the trainee Overview's "Upcoming stages and sessions" table reports
`table-overflows-container` (1000px table in a 988px container) plus a squeezed
"Waiting final assessment" cell. It is clean at 1600px, which is where Round 23
verified it, and nothing in this round touches that table's width — the only
Round 24 change to `CoachProfilePage.tsx` is the 24px -> 40px section gap.
Flagged rather than silently widened.

### §68a. Both sessions tables: proportional columns, and the `purple-50` header band (Round 24 continued)

Two tables moved together — the trainee page's "Upcoming stages and sessions"
(`152:685`) and the consumer page's "Sessions plan overview" (`194:2860`).

**The overflow fix, and why proportions rather than px.** The trainee table was
`min-w-[1000px]` with four *fixed* px columns, so at a 1440px viewport — where
this card's container measures **988px** — it overflowed and pushed
"Scheduled for" off screen, with "Waiting final assessment" wrapping in a
squeezed Session column. Both were real `layout-audit.js` findings, and the
class is the one the audit exists for: **a table wider than its container
silently hides trailing columns.**

Fixed by transcribing the frame's widths as **proportions of the frame's own
table width** instead of px:

| table | frame widths | as `<col>` |
|---|---|---|
| trainee (1073px) | 180 / flex / 220 / 220 / 160, 32px inset | 19.76 / 21.34 / 20.5 / 20.5 / 17.9 % |
| consumer (988px) | 110 / 230 / 110 / 150 / 190 / 150, 24px inset | 15.99 / 23.28 / 11.13 / 15.18 / 19.23 / 15.18 % |

The design is then exact at the frame's own width and **degrades
proportionally** rather than clipping. Measured: at 1440px the trainee table is
988px in a 988px container with Session at **211px** (which is what keeps
"Waiting final assessment" on one line); at 1600px, 1148px with Session at
245px. `min-w` dropped 1000 -> 860, below which it genuinely scrolls.

**The header band.** Both column-header rows are now **`purple-50`** with `ink`
labels — measured **15.42:1** — the same treatment §67 gave Stage Management's
table. One difference between the two, taken from the nodes rather than
normalised: the trainee header **keeps** its `hairline` bottom rule (node
`152:686` draws one), the consumer header has **none** (node `194:2861` does
not — the tint is the boundary, §35a's documented frame-driven exception). The
consumer table's row rules also move `hairline` -> `parchment` per the frame.

**Copy.** The consumer section is retitled to the frame's own **"Sessions plan
overview"** (was "Scheduled sessions"). Its sub copy is the frame's first half
only: the full string is "Where this consumer is in their study journey, along
with their assigned coaches", and the second half describes a coach column this
table does not have (its six are Session / date & time / Module / Module status
/ Module completed on / Session status), says "coaches" plural where a consumer
has exactly one, and duplicates the assigned-coach pill now sitting in the
header band above. Flagged rather than transcribed.

The trainee section's own title and sub copy already matched the frame
(`body-md` "Upcoming stages and sessions" over a `caption` line) and were not
touched.

`layout-audit.js` empty on both pages at **1440 and 1600**; `tsc`/`oxlint`
clean. This closes the pre-existing finding §68 handed forward.

---

## §69. The consumer Learning Progress tab rebuilt from Figma `210:2`: KPI row, module-completion donut, a bookended study-progress timeline, and a top-10 study log (Round 25)

**Frame:** `210:2` "Consumer management_inner page_2" — KPI row `212:3986`, chart row
`212:4185`, timeline `212:4665`, study log `212:4840`.

Built as a **new component** (`LearningProgressTab`), not a rebuild of
`ModuleEngagementTab`: that one is shared with the Coach Delivery Portal's own
Learning Progress tab, and this frame is a researcher view. Rebuilding it would
have silently changed the coach's page too, so it stays and keeps serving
`/delivery`.

### Naming — settled, after being ruled out first

The tab is **"Study Progress"**, and the intro heading is "Study progress
overview" — the frame's own labels. Worth recording the sequence, because the
first instruction was the opposite: "we will not call it study progress" ruled
it out, the tab was built as "Learning Progress", and it was then confirmed as
"Study Progress" directly. Only the **consumer** record page is renamed; the
trainee record page and the Coach Delivery Portal keep their own
"Learning Progress" tabs, which really are about modules alone. The component
is still `LearningProgressTab` — an internal name, deliberately not churned.

The frame's sub copy is trainee copy ("which modules this trainee has
finished") and was rewritten: "Where this consumer is up to across their
modules and coach sessions".

### The timeline's colour system — tokens, not the frame

| State | Card fill | Stroke | Marker |
|---|---|---|---|
| Complete (module done + session held) | `primary/8` | `parchment` | `primary` |
| Attention (module incomplete **or** session rescheduled) | `destructive/8` | `parchment` | `destructive` |
| In progress | `primary/8` | `parchment` | `primary` |
| Not reached | `parchment` | `parchment` | `hairline` |
| **Milestone timepoint** | `yellow-100` | `parchment` | `yellow-400` |

Four instructions shaped this and each superseded the last, so the order
matters:

1. Greens and reds come from **this app's tokens** (`success` `#1f7d37`,
   `destructive` `#d70015`, `primary` `#4A278F`), never the frame's hexes.
2. **Status labels sit on white**, never on the card's own tint. The frame
   painted green-on-green and red-on-red; the badge is now a white pill with
   coloured text + 1px border. Measured on white: `success` **5.19:1**,
   `destructive` **5.38:1**, `primary` **10.58:1**.
3. **Every** card's stroke is off-white `parchment`. The tinted borders it
   replaces were saying the same thing as the fill twice.
4. **A completed card is purple, not green.** So the fill groups "on track"
   (complete or in progress) against red for "needs attention" and neutral for
   "not reached" — and the *badge* keeps green for Complete, which is what
   still separates a finished cycle from a running one. **Green now exists only
   at status level, never as a surface.**

`attention` deliberately outranks everything: a module left incomplete or a
session moved stays red even though the session ran, because that is the thing
a researcher is looking for.

⚠️ **Accepted contrast exception:** the `yellow-400` milestone marker measures
**1.76:1** against the page, under WCAG 1.4.11's 3:1 for a graphical object —
and `yellow-400` is the darkest step this ramp has. Accepted because the marker
is `aria-hidden` decoration and the card beside it carries the whole meaning in
text. Flagged rather than silently swapped for a colour that wasn't asked for,
the same call Round 21 made on the Home "N alerts" badge.

### The timeline's shape

Nine or ten columns on one spine, all **240 x 191** for cycles:

**Consumer onboarded → Coach assigned → Study started → Sessions 1-6 → Study end**

- The three openers and the closer are **milestones, not cycles**: they carry
  two rows at most, hug their content (**96-123px**, no `flex-1`) and sit
  shorter than the session cards, which keep `flex-1` and therefore stay
  identical to each other.
- **Milestones carry no date above the marker** — the date lives inside the
  card. The 56px date block is still rendered *empty* for them, which is what
  keeps every marker landing on the spine.
- Session cards keep the date/time above the marker.
- An unplanned session used to have a **white dot and white connector on a
  white page**, so its column read as broken; both are now `hairline` —
  present and aligned like every other node, just quiet.
- `min-w-0` on the scroller is load-bearing: without it the row sizes the
  container and forces the whole page into horizontal scroll.

### The timeline follows the consumer — it stops at the next step (Round 25 continued)

Direct instruction, and it is the change that makes this a *progress* view
rather than a diagram of the protocol. The timeline draws **everything reached
plus the one next step**, then stops:

| State | Cards drawn |
|---|---|
| Onboarded, no coach | Consumer onboarded · **Coach assigned** |
| Coach assigned, no plan | Consumer onboarded · Coach assigned · **Sessions planned** |
| Plan created | all of the above · Sessions 1-6 · Study end |

Once the session plan exists the whole arc is determined, so from that point
everything is shown as before. Verified across all four seeded dyads:
`dyad-030` gets 2 cards, `dyad-012` gets 3, `dyad-011`/`dyad-013` get 10.

**The next step renders as genuinely incomplete** — neutral `upcoming`
treatment, not the yellow milestone one. A yellow "done"-looking card reading
"Coach: Not assigned" would have said two contradictory things at once, so
`tone` is now derived per milestone (`isOnboarded` / `isCoachAssigned` /
`isPlanned` / `allHeld`) rather than hardcoded.

⚠️ **Naming corrected mid-round:** this third milestone was first "Session plan
created", then renamed "Study started" when the user said study start *is* the
session-plan date — and then corrected back to **"Sessions planned"**, because
the *step* after coach assignment is session planning; "Study started" named its
consequence rather than the thing the researcher is waiting on. It still carries
the same derived date (the planning session, internal session 1 / displayed
Session 0), so only the label moved.

**The next step is labelled "Next"** above its marker — in the slot the session
columns spend on their date, and otherwise empty for a milestone, which is why
that slot existed at all (the 56px block is kept for every column so the markers
stay on the spine). Rendered in `primary`, so the one thing a researcher might
act on is the only coloured label in the row.

Three follow-on fixes this forced:

- The section's sub copy promised "every catch-up session through to study end",
  which is only true once a plan exists. Reworded to "Everything this consumer
  has reached, plus the step that comes next", which holds in every state.
- The spine is `left-0 right-0` of the card row, and that row was `w-max` — so
  a two-card timeline drew a stub of a line. The row is now
  **`w-max min-w-full`**, i.e. max(content, container): the spine runs the full
  width at 100% when truncated, and a full arc still overflows and scrolls.
  Measured 1226px spine in a 1226px container.
- `dyad-012` had a coach but no `coachAssignedDate`, so its "Coach assigned"
  card read "Mei-Ling Chen" beside "Not recorded" — a visible data gap in a
  card that is otherwise complete. Seeded (12 Jul, two days after consent).

### Dates: what is real, and the one field that had to be added

| Timepoint | Source |
|---|---|
| Consumer onboarded | earliest `consentDocuments[].uploadedDate` — the record that *proves* onboarding happened; there is no enrolment-date field |
| Coach assigned | **new `ConsumerDyad.coachAssignedDate`** |
| Sessions planned | the planning session's own date (internal session 1, displayed Session 0) — per the SPACES model that *is* when the plan is created, so it is derived, not stored |
| Study end | last planned catch-up. Labelled **"Completed on"** once all six are held, **"Projected"** until then — never a completion date it cannot know |

**`coachAssignedDate` is the round's one data-model addition.** It was added
rather than rendering an em dash: every surface that wanted this date (this
timepoint, the Overview hero's coach pill, the Key-updates row) had to fake it,
and the gap had already been flagged twice. Seeded for the two assigned dyads,
ordered consistently with the arc (consent -> assignment -> planning session).

### Study log

Purple-50 header band with no bottom rule, matching the Overview sessions table
so the two tables on this record read as one system. **Top 10 events**, with a
primary-outline pill — "Show previous N events" / "Show recent only",
`aria-expanded`, 36px — and a "Showing 10 of N" count. Export uses the app's
utility button and the app-wide "Export" label.

**A flag chip appears only for the two cases the brief names** — a rescheduled
session (`warning`) and an incomplete module (`destructive`). Every other row's
Flag cell is empty apart from an `sr-only` "No flag", so the column stays
scannable instead of decorating every row.

Events are derived, never stored: module opened/completed from
`moduleEngagement`, session held from the completion records, module
available from the *triggering* session's completion date paired with
`moduleTargetDate`, plus rescheduled, incomplete, coach assigned and consent.
"Module available" was added specifically because without it the richest dyad
had only 9 events and the show-previous control could never appear.

**Every `detail` reads as a system log entry, not prose** (direct instruction:
"the details sounds like ai"). No verbs, no sentences, no explanation — an
identifier, then ` · ` separated qualifiers, in the same `Module N — Title` /
`Session N` shape the timeline uses:

| event | detail |
|---|---|
| Module opened / completed | `Module 3 — Managing nighttime waking` |
| Module available | `Module 4 — Daytime habits that support sleep · due 25 Aug 2026` |
| Session held | `Session 3 · Module 3` |
| Session rescheduled | `Session 3 · moved to 19 Aug 2026` |
| Module incomplete | `Module 2 — Building a calming bedtime routine · Session 2 held` |

The last one is what prompted the rule: it previously read "Building a calming
bedtime routine **was not finished when** Session 2 was held", a full sentence
restating what the `event` column already says. `detail` only has to name
*which thing*. The always-available pre-module has no number, so
`logModuleLabel()` returns its bare title rather than "Module 0".

### The sessions table moved from Consumer Management to Coach Management (Round 25 continued)

Direct instruction, and it is a **move, not a copy**. The "Sessions plan
overview" table was extracted out of the consumer Overview tab into
`components/research/SessionsPlanOverview.tsx`, removed from the consumer
record page entirely, and now renders on **Coach Management → Assigned
Consumers**, where it replaces the researcher's view of `SessionTracker`.

The reason that swap is right rather than a duplication: **researchers are not
allowed to mark a session complete**, and `SessionTracker`'s whole purpose is
that write path — Mark session complete, Mark as incomplete, Unlock module,
Join Zoom. Rendering it to a researcher offered actions they should not have.
The new table is read-only by construction (every cell derived), so it is the
honest researcher-facing equivalent.

Implemented as a real conditional in `DyadSection`, not a disabled state:

```
viewerRole === 'coach' ? <SessionTracker …/> : <SessionsPlanOverview …/>
```

`SessionTracker` is **untouched** and still serves the Coach Delivery Portal,
which shares `DyadSection` — marking a session complete is exactly the point
there. Verified live on the researcher side: no "Mark session complete", no
"Join Zoom", no kebab.

### Chart row: two cards after the donut was cut (Round 25 continued)

This row went through four instructions in one sitting and the end state is
simpler than any intermediate one, so only the end state matters — but the
sequence is worth recording because the donut was built, restacked, then cut:

1. The donut card was **restacked** — chart first, legend beneath, both full
   width — replacing a side-by-side split that squeezed the legend into half a
   card.
2. A third card joined the row (`xl:grid-cols-3`).
3. Its rows were reduced to **`Module 1`…`Module 6`** with no titles, which is
   what the truncation had been caused by, and the state word was replaced with
   a **percentage**.
4. The **donut card was removed as repetitive** — once the breakdown carried
   the overall rate, its bar and every module's state, the donut was a second
   rendering of the same four numbers. The row is back to
   `lg:grid-cols-2`, and the `recharts` import, the `donut` array and the
   `notStarted` count went with it.

**Module completion overview** is what remains: the overall completion rate as
a `display-md` percentage with an 8px `purple-100`/`primary` bar, then all seven
modules, each on **one row** — label, a **96px** bar, and the percentage in its
own 40px right-aligned column, so bars and figures stay in aligned columns down
the list and the label takes the slack. Percentages are coloured by state
(`success` / `destructive` / `primary` / `ink-faint`), and each carries an
`sr-only` state name, because a bare "0%" does not say whether it is
not-yet-available or a module the catch-up ran without.

Index 0 keeps a short name ("Getting started") rather than becoming "Module 0" —
it is the always-available pre-module and genuinely has no number.

⚠️ **The per-module bar is binary — full for Complete, empty otherwise — and
that is a data limit, not a shortcut.** A module is now a single video, so
there is no fraction to draw: partial progress would need watch-through, which
`ConsumerModuleRecord` does not carry. It is deliberately **not** driven by the
legacy `slidesCompleted` field, which describes a slide deck this content model
no longer has. The state word carries what the bar cannot ("In progress",
"Incomplete", "Locked"). Same root gap as the "2 hrs" KPI below.

### Overview tab: next scheduled session (Round 25 continued)

The consumer Overview's "Consumer's learning journey progress" card gained a
second row in its white sub-panel: **"Next scheduled session:"** with the
**date inside the pill**, matching the "Total sessions completed:" row above it
so the panel reads as one pair of facts. That first row also moved from a bare
count to **`x/y`** (`0/6`) on direct instruction. The denominator is
`SPACES_CATCHUP_COUNT` (**6**, not 7) so it agrees with the "Sessions held 3 of
6" KPI and every other surface — Round 21.1 fixed a real bug caused by counting
the unnumbered Planning session here, which made a dyad read "1 of 7" beside
"Next session: Session 1". The panel's fixed `h-18` was removed —
it was sized for a single row and would have clipped the second. The date is
the first planned catch-up with no completion record; an undated row is not
"next", it is unscheduled, which the pill says instead.

### Study log: pagination, a column picker, and the Export control (Round 25 continued)

**Pagination replaced the show-all disclosure**, 10 per page — and the labels
run **backwards in time, because the log does**. Page 1 is the ten most recent
events, so paging forward shows *older* ones: the controls are **"Newer"** and
**"Previous 10"**, never "Next". Calling it Next would have implied the
opposite direction to the one the table actually moves in. The footer reads
`Showing 11–13 of 13 events`.

⚠️ **A real defect was found here by measurement, and it is worth recording as a
pattern.** Paging to either end disables the very button just pressed, and a
`disabled` control cannot hold focus — the browser drops it to `<body>`. This
project's most-repeated defect class, caught by a live `activeElement` read.
The first fix was wrong too: calling `.focus()` on the sibling inside the click
handler does nothing, because at that moment the sibling is still disabled from
the previous render. It has to happen in a **`useEffect` keyed on the page**,
with a ref recording which direction was pressed. Verified in both directions.

**Export** was promoted from the quiet `bg-pearl` utility chrome to the
primary-outline pill, matching the pager beside it. `ink-muted` on `pearl`
measures 4.83:1 — passing — but it read as *disabled* next to a real control,
which is the accessibility problem that actually mattered ("export button not
accessible").

**A column picker** sits beside Export as a 36px icon button, opening a **modal**
(not an inline panel) built on the shared `ConfirmDialog` in its `singleAction`
mode — the mode Round 6.1 added for exactly this shape, a list whose rows each
carry their own action. Reusing it inherits the app's focus trap, Escape
handling, footer treatment and the chassis-level focus-restore fixes from Rounds
11 and 14; verified that closing returns focus to the gear trigger.

The modal is **two panels**: **Available** (`parchment`) on the left for hidden
columns, **Current view** (`purple-50`) on the right for what the table shows,
in order. `purple-50` because that panel represents the live table, and it is
the tint the table's own header band carries. Chips carry a grip handle and the
label only — **no +/- glyph**, which described the action rather than the state
and read as wrong. Native HTML5 drag-and-drop, no library: drag across to
show/hide, drop onto a chip inside Current view to reorder, click to move.
Pointer drag is unusable by keyboard, so a focused chip in Current view also
reorders on ArrowLeft/ArrowRight and every change is announced through a live
region. The last visible column cannot be hidden — an empty table is not a view.

**`LOG_COLUMNS` is the single ordered source** — `<colgroup>` widths, `<thead>`
labels, cell renderers, alignment and the CSV row builder all read from it, and
the picker only mutates order and a `visible` flag. Adding a column later is one
entry in that list and nothing else, which is the point of building it this way.

### Deliberate divergence from the frame

Its "Avg. time to complete" tile reads **"2 hrs"**. There is no time-on-content
field on `ConsumerModuleRecord` (status, `slidesCompleted`, `lastActivityDate`
only), so hours cannot be computed without inventing them. The tile shows
**days from a module becoming available to being completed**, which is real. If
time-on-content is wanted it needs a field, and that is a decision to make
before enrolment starts rather than after.

Two more honest-derivation notes: **Days in study** is anchored to the first
and last *recorded* dates rather than `TODAY`, because this dataset's session
dates already run ahead of `TODAY` (`2026-07-22`); and no "overdue by N days"
figure is computed anywhere for the same reason.

### Verified

`layout-audit.js` empty. `tsc -b` clean apart from the known pre-existing
`ModuleOverviewPage.tsx` error; `oxlint` clean. Card geometry read back from
the live DOM: milestones 96/123/96/96, all six cycles 240 x 191, every stroke
`rgb(245,245,247)`.

⚠️ **Process note worth keeping:** `tsc --noEmit` passed a genuinely missing
import (`SPACES_CATCHUP_COUNT`) that blanked the page at runtime. **`tsc -b` is
the check that caught it** — the same class of trap §66 recorded for the
JSX-attribute comment, and a second reason not to trust `--noEmit` alone here.

---

## §70. Consumer Sleep & Health Data tab: Sleep Diary Notes rebuilt to a single-night view; sync banner removed; Session Recordings swapped for Notes; Profile details rebuild started but not finished (Round 25 continued)

Frame referenced: `210:267` ("Consumer management_inner page_3"), section
`275:5936` — used as a reference for the *shape* of the diary card (a date
stepper + a two-answer-column table), not copied literally; every colour and
type value still comes from this app's own tokens per the standing rule.

### Sleep Diary Notes: one night, not eighteen columns

`SleepDiaryFeed` (shared by the Consumer Management and Coach Delivery Portal
Health Data Hub tabs) was rebuilt from an ~18-date horizontal-scroll grid into a
**single-night view with a date stepper** — direct instruction: "we now show
the notes from previous day only... The user can toggle between dates, or
export data."

- Opens on the **most recent night on record**, clamped rather than reset so
  switching dyads never indexes past a shorter log.
- Stepper is `◀ [date badge] ▶`, the badge a filled `primary` pill (white text,
  10.62:1) — the one filled surface in the row, since it is the card's anchor.
- **Export downloads the night on screen, not the whole log.** A one-night
  card silently producing an 18-day CSV would be a surprise; the filename
  carries the date so a folder of these stays legible.
- Rows are the same 13 Consensus questions as before (1-9 answered, 10-13
  **always derived** via `computeSleepDiary`, never stored). Table header is
  now `purple-50` with no bottom rule, matching every other table on this
  record (§68a/§69).
- **"Auto-calculated" badge is purple** (`purple-50` fill, `primary` text,
  10.62:1), not the grey it shipped as — direct instruction, and it ties the
  badge to the question number beside it, which was already `primary`.
- A missing answer renders as a plain em dash on the page canvas, not a filled
  pill around nothing.
- **Focus-rescue pattern reused verbatim from the study log's pager** (§69):
  stepping to either end of the date range disables the button just pressed,
  which would drop focus to `<body>`; a `useEffect` keyed on the date index
  hands focus to the sibling button instead. Same bug class, same fix, applied
  proactively this time rather than found by measurement.
- The now-orphaned `DIARY_COLUMN_TINT` (the pastel-green/plain-white
  per-column treatment the old wide grid used) was deleted along with the
  grid — nothing renders per-column tint any more, since a single night has no
  "column" concept the way 18 dates did.

### "Data not synced" banner removed from this page

Direct instruction. The page-level banner (built on `dyadHealthAlerts`) sat
above the tab content warning about Fitbit sync gaps; removed because the
Fitbit sync monitor card directly below it already carries the same signal —
the banner was a second voice for one fact. `dyadHealthAlerts` itself is
**untouched**: the Delivery Portal's `NotificationHub` and the Research
Dashboard's `ResearchNotificationHub` both still read it, and removing the
function would have broken both.

### Tab swap: Session Recordings → Notes

Direct instruction: "get rid of session recording tab... instead add Note tab
(this is exactly same as we did for trainees, but different tab name, title
name)." Done by a background agent, then verified live in this session.

- `TABS` array: `'Session Recordings'` → `'Notes'`, same position (4th of 5).
- Renders `SupervisionRecords` (the same shared component the trainee page's
  "Supervision Notes" tab and the Delivery Portal's "Session Notes" tab both
  use) with `fullWidthStack` + `hideNotesHeader`, **plus `dyadId={dyad.id}`**
  so notes are scoped to this consumer — matching the Delivery Portal's own
  per-consumer call site rather than the trainee page's per-trainee one.
- `TAB_INTRO.Notes`: "Notes" / "Write and save notes from your sessions about
  this consumer."
- **Unassigned-consumer case handled explicitly**: `SupervisionRecords`
  requires a real `coach` (notes are keyed by author), so a dyad with no coach
  gets an icon empty state ("assign a coach to start adding notes") rather
  than a broken form or a type error.
- `DyadSessionRecordingsCard` was **not deleted** — it is still live on the
  Coach Management side (`SpacesCoachProfilePage.tsx`'s own Session Recordings
  tab) — only this page's use of it was removed.
- Verified live: tab row now reads Overview · Study Progress · Sleep & Health
  Data · **Notes** · Profile details.

### 40px vertical rhythm, all tabs on this record page

Direct instruction, matching the trainee record page: the tabpanel wrapper
moved from `gap-14` (56px) to **`gap-10` (40px)**, and the two tabs that were
still on an ad hoc `space-y-6` (`HealthDataHubTab`, `ProfileDetailsTab`) were
converted to the same `flex flex-col gap-10` stack. Confirmed live —
`getComputedStyle(panel).rowGap` reads `40px` on the Sleep & Health Data tab.

### ⚠️ Not done: Profile details tab card rebuild — pick this up first next session

The plan was to bring `ProfileDetailsTab` onto the same `purple-50` header
band / `RecordRowDivider` card vocabulary §67 gave the trainee page's Personal
details tab (two cards there; this page would need one per dyad member plus
Consent records, since a dyad is two people). **Two attempts to dispatch this
as a background agent were interrupted before any edit landed** — the first by
an API error, the second by the user cancelling the tool call to close the
session. `ProfileDetailsTab` is therefore still in its **pre-Round-25 form**:
functionally complete (editable PLE/Carer fields via `updateDyadPerson`,
Consent records section) but not yet on the shared card pattern. Nothing was
partially edited — the file is clean, just untouched on this one tab.

### Verified

`tsc -b` clean (only the known pre-existing `ModuleOverviewPage.tsx` error);
`oxlint` clean on every touched file
(`ConsumerDetailPage.tsx`/`SpacesCoachProfilePage.tsx`/`spaces.ts`/`ConsumerManagementPage.tsx`).
Sleep diary stepper, purple badge, removed banner, and the Notes tab all
confirmed live in the browser this session. Profile details tab not
re-verified because it was not touched.

---

## §71. SPACES coach record page rebuilt from Figma `285:6310` + `306:155`; new shared `EmptyState`; `heroFlushBelow`; the real SIPTEA component names (Round 27)

**No new colour or type tokens.** Every value reuses an existing one. The two
new things are a shared component and a shell prop.

### `components/shared/EmptyState.tsx` (new)

Icon-led empty state: a `size-12` `bg-primary/10` circle, a `size-5`
`text-primary` icon inside it, one short line of `text-caption text-ink-muted`
below, centred, `px-6 py-10`. Geometry follows the app's first icon empty state
(Round 10, the Session Recordings table).

Extracted on the **second** request for the same treatment, then applied to
nine surfaces in one pass rather than waiting for a third:

| File | Surface |
|---|---|
| `SpacesCoachProfilePage` | Latest updates · coach with no caseload · Overview table: no caseload / no search match / empty tab |
| `ConsumerDetailPage` | Needs attention · Study log · module records · Fitbit data · diary entries |
| `SessionsPlanOverview` | No session plan yet |

Rules: `copy` is **one short line** — it is a resting state, not an error and
not a call to action. Where several empty states sit near each other, the
**icon** carries the difference (a search glass for "no match", a check for a
legitimately-empty tab), not a longer sentence. Deliberately *not* applied to
inline cell placeholders ("No link yet") or dialog-internal messages, which are
not card empty states.

### `ResearchShell` — `heroFlushBelow` (new, opt-in, default off)

Does two things for a hero that already closes itself:

1. removes the hero's own `pb-8 md:pb-10`, so `heroBelow` sits flush against it
2. tightens the content wrapper's top inset from `pt-16 md:pt-20` (80px) to
   `pt-10 md:pt-12` (48px)

Why both: the record-page hero ends on its tab row, which already closes the
band with its own `pb-3` (Round 23 measured the band at exactly 257px on that
basis), so the extra 40px read as dead space. And three spacers were stacking
below the band — content inset (48) + the tabpanel's `mt-16` (64) + `TabIntro`'s
`pt-4` (16) = 128px where the frame has 64px. The prop handles the first two;
the page drops the tabpanel margin to `mt-0` on the tab that shows the band.

Opt-in specifically so Home's Quick Links bar keeps its gap.

**The band must go through `heroBelow`, not the tab panel.** That slot is the
only position outside the shell's padded, max-width content container — inside
it, the band inherits the page gutter and stops short of both edges. Measured
after the move: `right: 1440` against a `1440` viewport.

### Sticky consumer band

`sticky top-12 z-20 bg-purple-50 shadow-card`. `top-12`/`z-20` match the shell's
own `topBanner` slot, which already sticks correctly inside `motion.main`
despite its transform — worth knowing, because Round 17 found that same
transform silently breaks `position: fixed`. Verified pinned at 48px through a
1200px scroll; label contrast 9.4:1.

Geometry from the frame: content **centred** in the band (`items-center
justify-center`, not aligned to the page gutter), 16px gap, control 56×452 at
`--radius-sm` (8px).

### SIPTEA component names (the four placeholders retired)

`AddAnnotationSummaryModal`'s `STEPS` carried `Component I/P/T/A` as labels
since Round 6.2. Replaced with the real names from CLAUDE.md's SIPTEA table:
**Implementation intent · Problem identification · Tailoring · Action and
goals**, each with a question in the same register as the two that were already
real (grounded in the session, asking what the coach did rather than what the
component means).

**Changed in the seed data at the same time, and this pairing is load-bearing:**
the wizard *writes* `AnnotationSummaryEntry.components[].label`, so if the seed
strings and `STEPS` diverge, one SIPTEA component renders under two different
names across the two portals. A mid-session attempt to prefix the seed labels
with letters (`S: `, `I: `) broke exactly that, and also clipped the 180px label
track — both fixed by removing the prefixes. **If you edit either list, diff it
against the other.**

### Reflection section shape (frame `306:155` node `297:2237`)

Section title + sub copy on the page canvas, **outside** the card (the same
external-title pattern `SleepDiaryFeed` and the sessions tables use); the body
is a plain document — one row per component, name in `text-primary` on a fixed
180px track, answer beside it, `border-t border-hairline` between rows. **No
`purple-50` header band**, because there is no header to band: a documented
divergence from §35a, same class as Round 23's Stage Management call.

### One frame value deliberately not copied

Frame `306:155` pins "Latest updates" to `h-[480px]`, which produces a large
empty block under its last item whenever it is the shorter of the two cards
(usually). The pair uses `items-start` instead, so each card sizes to its own
content.

---

## §72. Round 28 — `caption-medium` replaces `caption-semibold` and becomes the app-wide button step; the onboarding tour deleted; Research Home rebuilt from `1:38`; the enrolment wizard rebuilt from `334:36`; `WizardStepHeading` extracted (2026-08-25)

A long direct chat-edit session, no pre-written scope plan. Four token-level
changes reach all 4 portals; the rest is the Research Dashboard.

### 72.1 `--text-caption-semibold` → `--text-caption-medium`, weight 600 → 500

Figma's own style moved from Semi Bold to Medium. **The token was renamed with
it**, not just reweighted — a step still spelled "semibold" while rendering 500
is the same actively-misleading name the purple ramp was renamed to escape in
§61. 177 occurrences across 16 files.

The rename also touched `lib/utils.ts`'s `cn()` font-size registry. That list is
load-bearing and easy to forget: §60 records a whole token being silently
dropped by `tailwind-merge` at every call site that also passed a text colour,
with the correct class sitting untouched in the markup. Renaming without
updating it would have reproduced that exactly.

### 72.2 `caption-medium` is now the app-wide button type step

Direct instruction: **primary, secondary and ghost buttons all use
`caption-medium`** (14/500/-0.224). This replaces the `text-[15px]
tracking-[-0.24px]` convention that had held since Round 21.

| Family | Was | Count |
|---|---|---|
| Pill buttons + ghost text buttons | `text-[15px] tracking-[-0.24px]` | 83 |
| Utility buttons | `text-caption` (14/400) | 24 |
| Explicit weight overrides stripped | `font-semibold` / `font-bold` | 2 |

Two things worth carrying forward:

- **`text-[15px] tracking-[-0.24px]` turned out to be an exact button
  selector.** It matched 83 sites and cleanly excluded the tab row, a
  stage-label `<p>` and two doc comments. Searching on the *pair* rather than
  the size alone is why no non-button was caught.
- **An explicit `font-*` beats the token.** Two buttons carried
  `font-semibold`/`font-bold` on top of the new step and kept rendering 600
  until those were removed. Measured, not assumed — the same trap the wizard
  rail hit later in the same session.

**Known divergence, flagged not fixed:** tabs still sit at `text-[15px]`.
CLAUDE.md previously paired buttons and tabs on one convention; that pairing is
now broken. The instruction named buttons only, so tabs were left alone.

### 72.3 `--text-sub-greeting` 20px → 18px

Figma style change. Three call sites (`ResearchPageHero`, Delivery Home,
Consumer Home), so it reaches every research page through the shared hero.

### 72.4 Research hero title `purple-500` → `purple-700`

Frame `1:38`'s greeting node (`1:48`) is painted `#4a278f`. Changed in
`ResearchPageHero`, so all five research pages moved together — which is why
that component was extracted in Round 21. Measured **9.40:1** on the
`purple-50` band (AAA).

Spelled `purple-700`, not `primary`, even though the two now resolve to the same
hex: this is a heading, not a brand *action*, and `index.css` keeps both
spellings for exactly that distinction.

### 72.5 The Research Dashboard onboarding tour, deleted

Round 17's 8-tour / 33-step coachmark system is gone on direct instruction.
Three files deleted (`data/researchTours.ts`, `OnboardingTour.tsx`,
`useOnboardingTour.ts`), plus **35 `data-tour` anchors**, 8 mounts,
`ResearchPageHero`'s `dataTour` prop, `SlideCard`'s `'data-tour'` pass-through,
`SupervisionRecords`' `tourAnchor` prop, and My Profile's `GuidedToursCard`.

**Verified on a cleared `localStorage`** — the only honest test, since the tour
only ever fired on first visit. All eight surfaces plus My Profile: zero
`data-tour` elements, zero dialogs, zero full-viewport SVG overlays.

Two notes. A stale `c2s-research-tours-seen` key survives in browsers that ran
the old build; nothing reads it, so it is inert. And `ResearchEmptyState` was
briefly deleted as "orphaned" and restored — it had a real reader. Grep before
deleting means grep for *readers*, not just for the definition.

### 72.6 Research Home, from frame `1:38`

- **`Need help` moved into the welcome band**, top-aligned with the title. The
  frame puts the button (`329:3751`) and the title block (`329:3750`) both at
  y=64 — aligned to the title's top edge, not the foot of a two-line sub copy
  40px below. `ResearchPageHero` gained **`actionAlign`** (default `end`), so
  the other four heroes are byte-identical.
- **A third quick action, "Schedule meeting."** The frame's icon (`329:3757`)
  reuses the same person glyph as the two Onboard pills — a copy-paste, not a
  choice. `CalendarPlus` is used instead, the glyph the frame itself draws on
  its own `btn-schedule-session` (`1:1033`).
- **Quick actions bar surface `purple-500` → `primary`** (Purple/700), re-read
  from the frame rather than assumed. The focus ring's offset colour moved with
  it. Label renamed "Quick links:" → "Quick actions:".
- **Meetings section:** sub copy removed (the frame's header row holds only a
  title and a button — measured, its one text node is `1:1031`); day header
  `bg-muted` → **`yellow-200` + `ink`** (13.75:1); table container gained a 1px
  `parchment` stroke + the frame's own Card shadow.
- **Section order: attention above Study overview**, on instruction. A
  deliberate divergence from the frame, and the better order here — study
  overview is standing context, the attention list is what needs action today.

### 72.7 `InertButton` gained an `appearance` prop

`dimmed` (default) keeps the muted look. **`active` renders identically to a
live control** — hover, focus ring, press — on direct instruction ("make it non
functional but in active state"), used by both scheduling CTAs and `Need help`.

`cursor-pointer` is part of `active` and is not incidental: a `<button>`
computes to `cursor: default`, so the inert pill gave itself away on hover next
to the two `<a>` Onboard pills, which get `pointer` free. Caught by measuring.

`aria-disabled` + the `sr-only` "(coming soon)" cue stay on in **both**
appearances, and matter *more* in `active`: with the visual signal deliberately
removed, the accessible one is all that is left.

### 72.8 "Dismiss all", and a reusable colour-temperature finding

New control after the alert badge in `NotificationHubView`'s research layout.
It took three corrections, each traced by measurement:

| Report | Measured cause | Fix |
|---|---|---|
| "grey and background is yellow" | `pearl` is `#f5f5f7`, a **cool** grey, on the **warm** `#fffcfa` canvas | ghost, no fill |
| "no visible hover state" | `primary/5` composites to a ~9-per-channel shift — real in the DOM, invisible on screen | `purple-50` + underline |

**Standing rule from the first row:** `bg-pearl` is correct *inside a white
card*, where there is no temperature clash. On a page canvas it reads as a
foreign grey patch. Any `bg-pearl` control sitting directly on `--background`
is suspect.

**And from the second:** an opacity that small is not a hover state, it is a
rounding error. Measure the composite, don't trust that a class exists.

### 72.9 Hiding a section, and the focus it takes with it

`hideWhenEmpty` (Research only) removes the whole attention section once every
notice is dismissed, rather than leaving an empty state.

Three things this needed that are not obvious:

1. **It does not `return null`.** The `aria-live` region must stay mounted or
   the "Dismissed all N alerts." announcement is destroyed in the same tick it
   is set. It renders an `sr-only` paragraph — no visual footprint,
   announcement intact.
2. **The existing focus target unmounts with it.** The component focused its own
   heading when the list emptied; under `hideWhenEmpty` that heading is gone, so
   the call silently did nothing and focus fell to `<body>`. Falls back to
   `#main-content`, which required giving `ResearchShell`'s `<main>` a
   `tabIndex={-1}` — **that also fixes the pre-existing "Skip to main content"
   link**, which pointed at a bare `id` and so could not move focus at all.
3. **The parent owns the gap.** The section can collapse its own box but not the
   `mt-24` its sibling reserves, so a ~96px hole survived. New `onEmptyChange`
   callback (fired from an effect, never during render) lets the page drop it.
   Verified: Study overview's section top lands on the exact y the attention
   wrapper occupied.

Pagination also moved `mt-6` → `mt-2` and the panel to `px-6 pt-6 pb-3`
(278px → **250px**). The gap *read* as ~39px against an authored 28px because
the dot row carries ~11px of transparent hit-area padding above its 6px bar —
the same authored-vs-painted gap as the panel's now-asymmetric bottom padding
(12 + 11 ≈ the 24 on top).

### 72.10 The enrolment wizard, from frame `334:36`

**Cards side by side**, 280px fixed height, 20px gap, 16px padding,
`rounded-md`, 12px internal gap. Icon container 120px tall, full width,
`rounded-sm`. Selected = `purple-50` + **1.5px `purple-900`** + `purple-300`
cover; default = white + 1px `hairline` + `purple-200` cover. The 1.5px-vs-1px
stroke is the frame's own, and is what stops the card resizing when picked.

**The artwork is the frame's own exported assets**, committed to
`public/illustrations/` (4 SVGs, following Round 23's certificate pair),
positioned with the frame's percentage insets. The negative bottom insets are
transcribed, not typos — the figures are drawn taller than the container and
clipped, which is the composition the frame shows.

A first pass built the cover as a 40px badge top-left. The user's sketch over
the live page corrected it to a full-width cover; **the sketch was clearer than
the written instruction had been**, and asking for one earlier would have saved
a pass.

**Three Figma values had no token and were substituted**, per the instruction to
stay on our system rather than mint new ones:

| Frame | Substituted |
|---|---|
| `#e6e8ec` card border | `hairline` |
| `#5e6366` / `#4a4c50` text | `ink-muted` |
| Card title 18/700 | `body-md` (16/600) — nearest emphasised-body step |

`rounded-md` computes to **11px** against the frame's 12px. Accepted, matching
StatCard's own call for the same value in Round 21 — recorded rather than
silently rounded.

### 72.11 A consent gate, and the consent upload removed

**New Step 2, "Consent check"**, immediately after the dyad/carer choice —
the cheapest point to discover the answer is no, before four screens of personal
details. Selecting "No, I have not obtained consent" blocks progress with a
persistent `role="status"` explanation and an `aria-disabled` Next.

**Radios, not checkboxes**, despite the instruction saying checkbox: the two
options are mutually exclusive, so two checkboxes would claim both can be
ticked. Native `<input type="radio">` also brings arrow keys and grouping free —
which matters here, because the Consumer type step directly above uses
hand-rolled `role="radiogroup"`/`role="radio"` **without** the roving-tabindex
contract those roles require. That is the exact defect §40 fixed on
`WeekdayPicker`. It is pre-existing and is flagged, not copied.

Separately and later the same session: **the consent-document upload step was
removed entirely** (consent forms are no longer stored on the platform) and
**Review took its place as the last step**. Review is now a *real* step rather
than a screen appearing after the last one, so "Step 6 of 6" counts what the
researcher is looking at, and `reviewing` is derived from the step index rather
than being separate state the two could disagree on.

**A latent bug this surfaced:** `CARER_ONLY_STEPS` indexed into `DYAD_STEPS`
positionally (`[0], [2], [3], [4]`) and silently mis-mapped the moment a step
was inserted above it. Now a key-based filter, which maintains itself.

### 72.12 New shared `WizardStepHeading` — all 4 wizards

The `Step N of M` + heading + subtitle block, transcribed from `pane-headings`
(`334:37`) and then extracted once a second wizard needed it. All four wizards
on `WizardProgressRail` had hand-rolled it and had already drifted — the same
reason the rail itself was extracted in §36.

| | Was | Now |
|---|---|---|
| Step counter | `caption`/600 `ink-faint` | `caption-medium` `ink-muted` |
| Subtitle | `caption` `ink-faint` | `body` `ink-muted` |
| Counter → heading | 4px | **16px** |
| Text block → content | 16px | **32px** |

`STEP_CONTENT_GAP` is exported from the same file deliberately: the frame's
`content-pane` gap is 24px but the block's own `pb-2` sits between them, so the
**painted** result is 32px. Anyone verifying should measure 32, not 24.

**Two divergences kept rather than flattened:**

- **`PlanSessionsModal`'s heading is a focus target** (`stepHeadingRef` +
  `tabIndex={-1}`, from §40/§42). Moving it into a shared component would have
  silently dropped that. The component takes an optional `headingRef`; verified
  live that focus still lands on the `<h3>`.
- **`AddAnnotationSummaryModal`'s third line is the SIPTEA question**, not sub
  copy. A first pass rendered it as step *content* to keep it `ink` rather than
  `ink-muted` — **which put the 32px gap in the wrong place**, between the
  heading and the question, leaving the textarea flush under it. Corrected on
  direct instruction: the question rides in the `subtitle` slot (4px under the
  heading) and the 32px falls *after* it. **The separation belongs between
  "read this" and "do this", not inside the reading** — worth remembering the
  next time a step's third line is content rather than description. `subtitle`
  stays optional; nothing currently omits it.

The wizard rail's own step labels also moved to `caption-medium`, dropping their
`font-semibold` — which would otherwise have overridden the token's 500.

`AddAnnotationSummaryModal` also **lost `liveTextVisible`**, the app's only
visible rail live-text. It rendered "Step N of 6: {label}" under the current
rail item, repeating the label directly above it *and* the content pane's own
"Step N of 6" + heading — three copies of one fact on a single screen. Now
`sr-only`, matching the other three wizards; still announced, just not drawn.

`AddCoachTraineeModal` additionally gained a **Review** step, matching the
enrolment wizard.

### 72.13 Open items

- **The alert badge is still 3.45:1** (white on `alert-pastel`), the exception
  accepted in §57. Moving 16px → 14px does **not** change the bar: neither size
  is "large text", so it required 4.5:1 before and still does.
- **Tabs are diverged from buttons** (§72.2).
- **"Join Zoom" renders at two weights on one Consumer Portal page** — the
  banner CTA moved to 500 with the rename, the four in-table links are still
  600. Same label, same action, one screen.
- **Consumer type's `role="radiogroup"` keyboard gap** (§72.11), pre-existing.
- **`consentDocuments` is orphaned in the store** — nothing writes to it now.
- **No formal Phase 3/4 review** on Rounds 21, 21.1, 21.2, 21.3, 23 or 28.

---

## §73. Round 29 — the Coach Delivery Portal revamp: floating yellow sidebar, a first-run onboarding flow, a trainee/coach stage switch, themed attention cards, and `MeetingsSection` extracted (2026-08-26)

**Version: v58.** A long direct chat-edit session, no pre-written scope plan,
driven by ~40 instructions arriving mid-turn (many as freehand annotations over
the live page). Five Figma frames were implemented: `369:6442` (shell),
`410:1481` (onboarding, 5 slides), `410:1507` (My Training), `419:2315`
(trainee Home), plus the researcher caseload card reused as a visual reference.

### The shell — coach portal only

`DeliverySidebar` stops being a flush white panel and becomes a **floating
card**: `yellow-200`, 16px radius, `shadow-card`, **200px** wide, inset 24px by
`DeliveryShell` with a 16px gap to the content column. This is the first
deliberate divergence between the three portal shells;
`ResearchShell`/`ConsumerShell` are untouched.

Measured deltas from frame `370:6647`: 240 -> 200px wide, 20 -> 24px icons,
10 -> 16px icon/label gap, 14 -> 16px labels, and a **56px row pitch** (frame
item tops 32/88/144). Rows are 36px, not the frame's bare 24px — the control
floor — so the nav's own top inset is **26px**, not 32, to land the first icon
on the frame's 108px line (64 + 26 + 18). Active `primary`/600, idle `ink`/400.
Hover and collapsed-selected are **`yellow-100`**: a *lighter* tint reads on
`yellow-200` where a darker one muddies, and `pearl` is a cool grey that reads
as a foreign patch on a warm card (the Round 28 lesson).

**Shell props added**, both mirroring `ResearchShell` so the two portals stay in
step: `heroClassName` (overrides the band surface) and `heroFlushBelow` (for a
hero that closes itself with a tab row).

**Spacing, and the number that matters.** These were got wrong twice before
being measured off the live researcher pages: a plain hero is followed by
**80px** of content inset on top of the band's own 40px bottom padding, and a
tab-closed hero tightens to **48px**. Delivery had drifted to a frame-literal
56px on one variant and was then overcorrected to 16px on the other. Both now
match `ResearchShell` exactly. Side padding went 64 -> **48px** on hero and
content; the page gained a 24px right inset so both outer edges match.

### First-run onboarding (frames `410:1481`)

A 5-slide welcome carousel, **trainee stage only**, rendered in place of page
content with the sidebar **forced collapsed** for its duration. It is
deliberately **not persisted** — every refresh returns to it, because the flow
is the thing under review and a `localStorage` flag would make it a one-shot.
The dismissal flag is **module-scoped, not component state**: every `/delivery`
page mounts its own `DeliveryShell`, so a `useState` replayed the whole flow the
moment the final CTA started routing to another page.

The header was first suppressed for the flow (the frame is drawn without one)
and then **restored on instruction** — keeping it means every coach screen
shares one chrome and the sidebar never shifts. That retired the sidebar's
second sticky offset, so there is now one offset in every state.

Pagination reuses `NotificationHub`'s dot control (6px bar, 20px when current,
26px hit area). `-my-2.5` cancels the button padding in layout so the painted
bar-to-button gap stays the frame's 56px rather than reading as 46.

### `data/coachStage.ts` — the demo stage switch

A `useSyncExternalStore` module store flipping the portal between **trainee**
(no caseload; Home is about their own learning) and **coach** (certified;
Home is about their consumers). `CoachStageSwitcher` is a fixed bottom-right
`radiogroup` with real roving arrow keys — this project shipped a hand-rolled
`role="radiogroup"` without that contract once already (`WeekdayPicker`, fixed
in Round 14.5), so it was done properly from the start here.

It is a **review tool, not product chrome**, and is labelled "Demo view". If a
real certification write path ever lands, delete it rather than repurpose it.

### `components/delivery/AttentionCards.tsx` — themed attention cards

Replaces the Round 18 `NotificationHub` tiles on coach Home. White card on a
`parchment` canvas with a `purple-200` stroke, a **theme** as the title (My
Training, Reflection due, My Meetings, Session plan missing) and the item as the
body, then a meta line and/or a CTA.

- **`min-h-44`, not the frame's fixed 160px.** The frame assumes a 19px title
  row, a 2-line body and a 33px CTA; ours has a 36px CTA and a 36px kebab hit
  area, which overflowed a fixed height and pushed the CTA into the body text.
  `min-h` + `items-stretch` lets the row grow to the tallest card instead.
- Padding and gaps were then **opened up from the frame's 16px** to `p-5` / 24px
  before the bottom group, on feedback that the cards read as cluttered — the
  frame's rhythm was tuned for the shorter CTA.
- The kebab is the card's **real dismiss control**. The frame draws a menu
  affordance and specifies no menu; rather than ship a dead one it does the one
  thing these cards need. `-my-2.5 -mr-2` keeps a 36px hit area without letting
  it set the row height.
- **Dismiss all** copies the researcher hub exactly: badge first, button after,
  12px apart, `primary` ghost with an underline hover — *not* the `bg-pearl`
  utility style, whose cool grey clashes with the warm canvas.
- Clearing everything **hides the section outright** (`hideWhenEmpty`, matching
  Round 28). Two things this forced: the `className` goes on the section, not a
  wrapper, or a `null` child leaves a 56px ghost margin; and focus falls back to
  `#main-content` when the last item goes, because the heading it would
  otherwise land on unmounts with the section.

### `components/shared/MeetingsSection.tsx` — extracted

Pulled out of `ResearchHomePage.tsx` (~150 lines: `ScheduleRow`, `groupByDay`,
`dayLabel`, `InertButton`, `MeetingRow`, the tabs) the moment the coach portal
became its second caller. `idNamespace` keeps two mounted instances from sharing
a `framer-motion` `layoutId`; `showHeader={false}` lets a caller put the title
and action in its own page hero instead. Research Home verified non-regressive
after the move.

### Pages

- **`/delivery` Home** — rebuilt for both stages on the researcher's own
  three-section rhythm: KPI row -> attention section -> consumers table. The
  trainee's table is necessarily an `EmptyState` (no consumer is assigned before
  certification). The coach's KPI row is 4 tiles, the fourth being **Session
  plans not created**, derived from the same `isPlanSet` the attention cards and
  the table's own column read — three surfaces, one field.
- **`/delivery/meetings` — new**, second in the sidebar. Hero carries the title
  and an inert **Schedule new meeting**; tabs and table below.
- **`/delivery/learning`** — rebuilt from `410:1507`: "My Training", the
  progress card moved into the hero, a 4-tab row (My modules / My reflections /
  Feedback / Certification) inside the hero, and tier headers lifted out of the
  tinted canvas onto the page.
- **`/delivery/account`** — aligned to `ResearchAccountPage`. Every `className`
  in the two files now matches except the hero, which is intentional.

### Curriculum and data

- **The Practice module is gone** ("there is no more any practice module"),
  removed at the data layer rather than hidden: the 12th `PATHWAY_MODULES_V2`
  entry, `PRACTICE_MODULE_ID`, `PracticeModuleCard`, the Research Dashboard's
  own accordion section, and two `research.ts` seed rows. The curriculum is
  **11 modules** (4 + 7), and both portals read the same `MODULE_GROUPS`, so
  they cannot disagree about what it contains. The frame still reads "1/12"
  beside tier counts of 1/4 and 0/7 — arithmetic that only worked while Practice
  existed.
- **Tier canvases** are now `purple-50` / `yellow-50`, retiring
  `--color-tier-foundational` / `--color-tier-sleep` (a blue/green pair
  predating the brand ramps). Zero readers, grep-confirmed before deleting.
- **Tier letter badges**: 56px pill, `title` 22/500. The frame draws both
  letters white — fine on `primary` (10.62:1) and a real failure on
  `yellow-400`, where white measures **1.76:1**. The yellow tier takes `ink`
  (9.90:1), already this app's pairing for that swatch since Round 24.
- **Gating labels** beside each tier title ("You start here", "Locked, complete
  Part A first") derive from `firstIncompleteIndex` — the same value that locks
  the module cards — so a label cannot contradict the rows beneath it.

### `StatCard` — `breakdownLayout`

New opt-in `'inline' | 'stacked'`, defaulting to today's inline behaviour so
Consumer Management is untouched. The trainee's "Reviews shared" tile has *word*
values ("Yes", "–") rather than digits, and three inline label+value pairs
overflowed onto a second line — which is what read as an unbalanced KPI row.
Stacked puts the label above its value in equal columns.

### `design/layout-audit.js` — one calibration

The control-height exemption was a `Page ` **prefix** test and is now a match on
`"<page|step> N of M"` anywhere in the label. Two real pagination controls were
reporting as failures on correct surfaces: the onboarding carousel ("Step 1 of
5", 26px) and `ModuleTimeline`'s own dots ("Go to page 1 of 2", 24px — a size
its own code comment documents as deliberately matching the 2.5.8 floor). Only
the first was new; **the module dots had been reporting on My Training all
along**, which is worth knowing before trusting any past "audit clean" claim
about that page. Still label-driven, not geometry-driven, so a genuine
bare-icon button at 24px keeps reporting.

### Measured, not eyeballed

Contrast recomputed from **composited** pixels, which mattered: the `next` chip
tone is an 8% translucent fill, so a naive read returned a meaningless
148,000,000:1. Real values — "You start here" 13.95:1, "Locked…" 4.75:1, tier
badges 10.62 / 9.90:1, sidebar labels 8.39 / 13.75:1, yellow-50 hero title and
tabs 16.42 / 10.02:1. `layout-audit.js` empty on every rebuilt surface.

### Known, deliberate, not oversights

- **My Training / My Profile stay greyed and inert during onboarding** — the
  only remaining difference between the two sidebar states now that the header
  no longer disappears.
- **The trainee "Reflection due" card is the one item not derived from real
  state** — no reflection due-date field exists on a coach record. It needs one
  before it can honestly claim a deadline.
- **`CertificateCard` is exported but unrendered**, parked for the Certification
  tab whose frame is still to come. Delete it if that changes.
- The coach consumers table kept its own columns and its working CSV Export
  rather than copying the researcher's Annotation-summary column and dropping
  Export — the instruction was a visual alignment.
- Tabs remain at `text-[15px]` while buttons are `caption-medium` (the Round 28
  divergence), and `UnderlineTabs`' internal padding was left alone rather than
  diverged per-frame for My Training.

---

## §74. Round 30 — the trainee experience rebuilt end to end: onboarding, Home, My Learning, module overview; audience-dependent terminology; the shell's frame-driven column grid (2026-08-27)

**Session shape.** `/run` to resume, then a long direct chat-edit session, no
pre-written scope plan. Six Figma frames: `607:8208` + `621:8679` (onboarding,
4 variants), `542:1597` (trainee Home), `588:5833` (My Learning), `631:9401`
(module overview), plus `542:1598` (side nav). Several instructions arrived
mid-turn as freehand annotations over the live page. No formal Phase 3/4 review.

### The shell's column grid is now the frame's, and it is asymmetric

Frame `542:1597` states the columns at its own 1281px width:

```
24 (left) + 200 (sidebar) + 48 (gap) + 961 (content) + 48 (right) = 1281
```

`DeliveryShell`'s row is therefore `gap-12 py-6 pr-12 pl-6` — **24 left, 48
right**. That imbalance is deliberate and is the same correction Round 29 had
made by hand against the older shell frame; it is now carried by the frame
itself. Live measurement reproduces all five numbers exactly.

**One thing not to repeat.** The content column's inner `px-6 md:px-12` was
removed as well, because the frame runs `welcome-header` flush to the column's
left edge. That is correct *for a page with no hero band* and wrong for every
other page in the portal: the four hero-bearing pages ended up with their band
text at 48px and the body beneath it at 0 — a visible 48px step, found by
measuring, not by looking. The default is restored; trainee Home and My Learning
opt out through a new additive `contentClassName` prop. Omit it and every other
page is byte-identical.

### `sr-only` inside a horizontal scroller widens the document

The most useful finding of the round, and a genuinely non-obvious one.

My Learning's module CTAs carried the module title in an `sr-only` span for a
fuller accessible name. Tailwind's `sr-only` is `position: absolute` with
`white-space: nowrap`; inside the horizontally-scrolling card row it escaped the
clip and pushed **`document.documentElement.scrollWidth` to 2399px against a
1281px viewport** — a real, user-visible horizontal page scroll, confirmed by
actually calling `window.scrollTo(500, 0)` and reading `scrollX` back.

Isolated by bisection rather than reasoning: hiding every `.sr-only` dropped it
straight to 1281.

**Rule: never put `sr-only` text inside a horizontally-scrolling row. Use
`aria-label` on the control instead** — it carries the same information to a
screen reader and generates no box at all.

Note this is a *different* failure from the `min-w-0` one below, and fixing
`min-w-0` alone did not resolve it — both were present at once.

### `min-w-0` again, on both new carousels

The tier carousels sized their flex ancestors to their content until `min-w-0`
was added down the chain. Same failure Round 21.1 hit on the trainee pathway
timeline. Any flex column that contains an `overflow-x-auto` needs it.

### Terminology is now audience-dependent

**Researcher-facing surfaces say "consumer"; coach-facing surfaces say
"client".** Same people, different reader. Recorded in CLAUDE.md's terminology
table as the durable rule. Verified by scanning rendered text:

| Surface | "consumer" | "client" |
|---|---|---|
| Coach Home (both stages) | 0 | yes |
| Coach meetings, all 5 client-detail tabs | 0 | yes |
| Research Dashboard list + record pages | yes | 0 |

The load-bearing part is the shared components. `ModuleEngagementTab`,
`SleepDiaryFeed` and `ConsumerDetailsCard` render in *both* portals and cannot
hardcode either word — each now takes the `viewerRole: 'researcher' | 'coach'`
prop `SessionTracker` established in Round 17.2. `DyadSection` already had that
prop and simply was not threading it down; one line fixed the last straggler
("Consumer details" -> "Client details", coach side only).

**Internal identifiers keep "consumer"** — `ConsumerDyad`, `dyadId`,
`/delivery/consumers/:id`. Code, not copy.

### Onboarding: 4 screens, animated, no card

Rebuilt from `607:8208`/`621:8679`. **There is no card** — artwork, copy and one
CTA sit directly on the canvas, and the sidebar is unmounted for the duration.
The frames drop the pagination dots, Skip and (on screen 1) Back.

**The artwork is one asset, not twelve.** Figma exports a separate blob per card
per screen, but every one is the same shape: aspect `1.26288` throughout, and
every outline's stroke width is exactly `0.022642` of its own width. One SVG
scaled reproduces all of them, stroke weight included. That is what makes the
size change *animatable* — the middle card grows `1.209x -> 1.337x` between
screens 2 and 3, and swapping between two exported assets mid-flight is a hard
cut.

**Alignment is structural.** All three layers (backing, masked photo, outline)
sit inside one transformed parent, so `rotate` and `scale` move them together
and registration cannot drift at an intermediate value. Sampled mid-growth, the
outline's `left` and the mask's `mask-position` are constant at every frame.

**A bug in the Figma file, not in the code:** every dimension of the three cards
is an exact multiple of the smallest one — inner box, backing, photo box, image
offsets, stroke position, all within 0.01px. Only the middle card's
`mask-position` is not: `42.915, 70.675` where the scale says `23.77, 62.39`,
putting its photo ~19px right and ~8px low of its own outline. Geometry is now
derived from one base x a scale factor so the three cannot drift apart again,
but **the frame itself is still wrong**.

Wrapper bounding boxes are derived, not transcribed, because they have to
resize continuously as rotation animates:

```
bbox(w, h, θ) = [ w·|cosθ| + h·|sinθ|,  w·|sinθ| + h·|cosθ| ]
```

All seven distinct wrapper boxes across the four screens reproduce their frame
within **0.011px**.

Motion: cards on a spring (`stiffness 90, damping 16, mass 0.9`) so they settle
rather than snap; copy crossfades faster (220ms) so it resolves before the cards
stop. Both collapse to zero under `useReducedMotion()`.

### The onboarding -> Home handoff

`DeliveryShell` wraps the swap in `AnimatePresence mode="wait"` — the welcome
flow finishes leaving (260ms, `easeIn`) before the dashboard arrives (340ms,
`easeOut`); crossfading them on top of each other reads as a flicker. The
sidebar fades in alongside.

**`initial={false}` on the sidebar's `AnimatePresence` is load-bearing:** every
`/delivery` page mounts its own shell, so without it the nav would fade in again
on every in-app navigation. With it, only a *change* of presence animates.

Verified the fade does not break the sidebar's `sticky`: 804px aside inside a
1232px stretched wrapper (the row's content box after `p-6`), 428px of travel,
`transform: none` at rest.

**And the destination bug.** "Go to My Dashboard" called `onComplete()` with no
path, which only uncovers whatever page the flow was covering — and the flow
covers *every* `/delivery` page. Entering on `/delivery/learning` therefore
landed on My Learning, which is not what the button says. It now names
`/delivery` explicitly.

### Trainee Home

KPI row, "Your this week's to do" and the clients table all **removed** on
direct instruction, so this page no longer mirrors the researcher's
KPI/attention/table rhythm. The greeting is page content, not a hero band — the
frame's `welcome-header` is transparent with its own 64px top inset, and the
greeting is `purple-700`, not ink.

Sections, each separated by a flat 48px: hero banner -> wave divider -> training
pathway -> learning-progress / meeting pair. Banner 961x354, pathway 961x354,
cards 524 / 397 with a 40px gap, equal height.

**The pathway marker was wrong once and is worth recording.** The first pass read
the active dot as a flat halo ring. The export is a 36px `purple-200` disc
carrying an SVG drop-shadow filter:

| Figma filter | CSS |
|---|---|
| `feMorphology erode 6` | `-6px` spread |
| `feOffset dy 6` | `0 6px` |
| `feGaussianBlur stdDeviation 8` | `16px` blur (2x the standard deviation) |
| `feColorMatrix .518/.278/1 @ .2` | `rgba(132,71,255,0.2)` |

Both dots also carry a **3px white ring** (`stroke="white" stroke-width="3"` on
a r=10.5 circle) that the first pass dropped. It is invisible against the card
and it is what breaks the connector line where it passes behind each marker.

The timeline was then revised in Figma mid-round: 5 columns -> **7** (6 stages +
certification), most renamed, 1379px inside a 959px card, so it scrolls. The
connector is a **gradient**, `purple-500` fading to `hairline`.

**Stage 3 "Peer Role-Play" uses a circle-with-an-X** (`CircleX`) — reproduced
faithfully, but every other UI uses that glyph for "error" or "dismissed", so in
a progress rail it reads as a failed stage. Almost certainly a placeholder.

### My Learning

The four tabs (My modules / My reflections / Feedback / Certification) are
**gone** — three were "not ready yet" empty states, so the row had one
destination and nothing to switch to.

**Module names follow the real curriculum, not the frame** (direct instruction).
The frame repeats two placeholder titles — "Onboarding and getting set up"
appears three times, and all of Part B duplicates Part A. Live data is
`MODULE_GROUPS` over `PATHWAY_MODULES`. Every count in the frame — 1/4, 0/7,
1/11 — matches that data exactly, which suggests the frame *was* drawn against
it and only the card titles drifted.

Lock state is derived, never authored per card: `moduleState(index)` off the
flat curriculum gives completed -> current -> upcoming. Part B's gate reads the
same fact at tier level rather than a second flag that could disagree.

Two deliberate substitutions:
- **Covers stay as this app's per-module `moduleArt()` gradients.** The frame
  uses one stock photo on all eleven cards; the frame's *treatment* — the dark
  bottom wash that makes the white numeral legible — is what carried over.
- **Purple-tinted card shadow** `2px 4px 16px rgba(102,42,213,0.1)`, as the
  frame specifies, not the app's warm gold — these sit on a `purple-50` canvas
  where gold reads as a stain.

### Module overview

Hero lost its centred max-width: the frame runs it full-bleed and its 112px
gutter is what aligns the title with "Module outline:" below. Title moved
`display-md` -> `display-lg`. Outline rows are the frame's plain two-column
shape; the old green check badge and `success/10` row tint are gone, because
the frame marks completion in the meta line only — the list is a running order,
not a status board.

The outcomes card moved `pearl` -> `yellow-50`/`yellow-100` with small dot
bullets replacing green check badges (a check badge on a list of *outcomes*
reads as a list of completed items).

**"Why is this important?" was built and then removed.** The frame draws a
second section filled with the same sentence pasted twice. It was implemented
against a real new `whyImportant` field rather than a second render of the
objectives, then removed on direct instruction along with that field.
`OutcomesSection` remains a component, so a second section is a one-line
addition if it returns.

### Sidebar

`yellow-200` -> **`purple-200`**, with the frame's **neutral** grey shadow
`2px 4px 16px rgba(85,85,85,0.1)` rather than the app's warm gold — a gold cast
reads as a smudge on purple. Hover/active moved to `purple-50`, the ramp's own
neighbour (there is no `purple-100`). Contrast: active `primary` **7.77:1**,
idle `ink` **12.73:1**.

Nav reduced to **Home / My Learning / My Profile**. "My meetings" is gone from
the nav — its content now has a home on the Home page's own "My meeting" card —
but **the route is deliberately still mounted**. The collapse toggle is kept and
visible; the frame only has it hidden.

### CTA height on the trainee platform

Trainee-platform CTAs moved to **44px**, which is also the frame's own height.
Worth stating plainly because it looks like a rule violation and is not: the
36px control height is a **floor, not a cap**.

### New assets

`public/illustrations/onboarding/` — `blob-back.svg`, `blob-mask.svg`,
`blob-outline.svg`, `doodles.svg`, `photo.jpg`. Twelve exported blobs collapsed
to three files once they proved to be one shape at four scales; the three doodle
exports were byte-identical (`md5 87b187a7…`) so one static layer serves all
four screens. The photo arrived as an 8.4MB 2731x4096 JPEG and is committed
resampled to 533x800 / 104KB — still well above the 218px it renders at on a 2x
display.

`public/illustrations/home/` — `banner-back.svg`, `banner-mask.svg`,
`banner-outline.svg`, `wave.svg`.

### Verification

`tsc -b` and `oxlint` clean throughout. `design/layout-audit.js` empty on every
rebuilt surface at 1281px. No console errors. **No formal Phase 3/4 review** —
the backlog now spans Rounds 21, 21.1, 21.2, 21.3, 23, 25, 26, 27, 28, 29 and 30.

---

## §75. Round 31 — the trainee flow completed: six derived banner states, a frame-sequence confetti animation, My Notes, and My profile rebuilt (2026-08-28)

A very long direct chat-edit session, no pre-written scope plan, ~35 instructions
arriving mid-turn. Built and live-verified by measurement; **no formal Phase 3/4
review** — the backlog now spans twelve rounds.

### The Home hero is six derived states, not a flag

| State | Trigger | Frame |
|---|---|---|
| Begin your training journey | default, Stage 1, nothing started | `544:3011` |
| Resume where you left | a module is part-way through | `588:5767` |
| You are now in: Stage N | Stages 2–4 | `638:11947/11948/11949` |
| How did {stage} go? | the stage *before* the current one | `638:11875/11876/11877` |
| My reflection time! | Stage 5 | `607:8003` |
| Congratulations | the certification column | `647:13277` |

Every switch is derived. `resumableModule()` reads the same live progress the
module cards read, so the banner cannot claim a module is under way while its
card disagrees — the "two surfaces, one fact, two fields" trap this file keeps
recording. It reads **only the current module**, never a scan: live progress is
keyed by *content* id and `DEMO_PLAYER_REDIRECTS` points module 2 at module 5's
content, so a scan would report locked module 5 as in-progress the moment a coach
touched module 2. That is the Round 19.1 collision, sidestepped structurally.

**Notes pair with the *previous* stage** (`activeStage - 1`), per the written
brief. Frame `637:10671` pairs Stage 2's expect banner with Stage 2's own notes
banner — the other reading — but that frame's rail also shows Stage 1 as
"Ongoing" underneath a banner announcing Stage 2, so it is a layout reference
rather than a coherent state. Flipping is one character, commented at the call
site.

### The blobs: one composition, four scales, and a mask bug worth remembering

All four photo blobs on this page are the same torn-paper artwork at different
scales — 0.436 (stage banners), 0.383 (notes), 0.9166 (certification), 1.0
(Stage 1). The Figma exports *look* like separate assets but are not: outline and
mask come back per-variant with identical aspect (1.26289 and 1.30197 in every
export), and check/badge/sparkle have identical paths **and** fills, differing
only in export size. Seven files serve all of it; only the back sheets are
genuinely per-variant, because the fill is baked in.

**Two real defects, both invisible in a screenshot:**

1. **`overflow-hidden` on the photo container clipped the mask window.** The mask
   reaches past its container — 169.07 and 129.84 against a 163.663 × 122.128 box
   — so clipping sliced the photo *inside* its own torn frame along a straight
   edge unrelated to the artwork.
2. **The mask and the outline did not land on the same rect.** They are one torn
   path — a window and a stroke — so they must coincide. The frames' own numbers
   do not: the stage window is 158.996 × 123.028 at x 11.8 against a 154.036 ×
   121.971 outline at x 7.4, so the photo overhung the stroke by 9px right and
   8px bottom; `BannerBlob`'s was 10.5px short and 9px low. **Both now derive the
   mask from the outline** (`outline.x − photo.x − photo.boxX`), so that class of
   drift is impossible.

### Confetti: a 20-frame PNG sequence

`components/delivery/Confetti.tsx`, frames in `public/illustrations/confetti/`
(20 × 1400×1080, **440KB**). The size curve confirms a genuine burst rather than
a loop: ~8KB at frame 1, peaking by frame 5, tapering to ~8KB by frame 20.

**Format, decided by measurement, not preference:**
- **GIF rejected** — the first export came back **3840×142**, a 27:1 ribbon whose
  pieces vanished against the purple; and GIF's 1-bit alpha fringes every piece.
  No encoder exists in this sandbox anyway (no ffmpeg/ImageMagick/gifsicle).
- **SVG frames rejected** — smaller over the wire, but 100+ paths re-rasterised
  every tick. A bitmap blit is what keeps this smooth on low-end devices.
- **A particle library rejected** — it would discard the designer's own artwork.

**The transparency trap, and it will recur.** Figma baked a solid `#f5f5f7`
plate into every variant: all 1,512,000 pixels of each frame came back opaque
despite being RGBA, which is why the confetti first arrived on a grey card
instead of over the yellow. The committed frames have had it removed and their
anti-aliased edges un-blended from it (96.7% transparent now, 522KB → 406KB).
**Re-exporting from Figma reintroduces it** unless the variant backgrounds are
cleared there first.

**Playback**, tuned across four rounds of direct feedback: 130ms/frame (45ms read
as a flicker, 80ms was still hurried), **8 continuous passes then a 10s pause,
repeating**. Verified live: 20.8s of play, exactly 10.0s of pause, repeating.
The pause is not cosmetic — dropping to `frame === -1` **unmounts every `<img>`**,
handing back twenty decoded 1400×1080 bitmaps between rounds instead of holding
them for as long as the coach sits on the page. Files stay in the HTTP cache, so
the next round re-decodes rather than re-downloads.

**Geometry**: the card's **left half, full height**. At 1096×400 that is a
548×398 box, within a whisker of the artwork's own 1.296 aspect, so
`object-cover` crops ~25px and distorts nothing. Stretching across the full card
(`object-fill`) compressed the burst 2.7× vertically and every piece read as a
flattened smear. Skipped entirely under `prefers-reduced-motion` — a frozen
mid-burst would read as a bug.

### My Notes (`/delivery/notes`, frame `638:12057`)

Write box above a paged table. **Deep-linked** from the stage notes banner as
`?title=…`, which pre-fills the title and focuses the note box; the param is
consumed once and stripped so Back returns to Home and a refresh does not
re-fill a cleared box. Delete is gated by a `destructive` `ConfirmDialog`; View
opens a read-only viewer built on that same dialog (so it inherits the Round
11/14 focus fixes) at **720px**, since 440px turned a paragraph into a ribbon.

**`table-fixed` is load-bearing here.** The one-line body excerpt under each
title sized the Title column under auto layout, pushing the table to **1428px
inside an 864px container** and wrapping every date onto three lines —
`layout-audit.js` caught both.

### My profile (frame `641:12888`)

Hero band dropped; the title is page content in `purple-700`, matching Home, My
Learning and My Notes. Password card removed on instruction (and the sub copy
with it). New **Study details** card — Trainee ID, Certified on, Download
certificate — all derived from the coach's certification record, including
whether the download exists: `certificateGenerated` is the *researcher's* action,
so a coach who passed but has no issued certificate sees an honest "not ready"
line. Helen's seed said `false` despite her passing and already delivering as a
certified coach elsewhere in the data; corrected to `true` with an issue date.

**New `OptOutCard`**, red throughout: `destructive/10` header, `destructive/5`
body, `destructive/30` border, alert icon, outline button. **The title is `ink`,
not `destructive`** — red-on-red measured **4.51:1**, clearing AA by 0.01, and
22px/500 is not WCAG large text (that needs 24px, or 18.66px bold). A heading
whose legibility depends on a rounding error is not worth the shout. Now 14.57:1.

**Two measurement notes worth carrying forward:**
- **Tailwind v4 emits `oklab()`**, so parsing `getComputedStyle().backgroundColor`
  as RGB returns nonsense — a first read of the opt-out header came back
  `(230,230,230)`, a neutral grey. Rasterise through a 1×1 canvas to get the true
  painted pixel.
- Focus after confirming opt-out needed a **timeout, not a `requestAnimationFrame`**:
  one frame was too early and `document.activeElement` was still the *closing*
  dialog panel, which then unmounts and drops focus to `<body>`.

### New shared components and props

| New | Where | Note |
|---|---|---|
| `WaveDivider` | `components/delivery/` | Extracted from `DeliveryHomePage` at its second caller |
| `Toast` | `components/shared/` | Extracted at its **fifth** caller; the four originals still inline it |
| `TablePager` | `components/shared/` | 36px hit areas, not the reference's 22px — Round 21 caught that exact failure against WCAG 2.2's 24px floor. Range label is a live region |
| `Confetti` | `components/delivery/` | See above |
| `OptOutCard` | `components/delivery/` | See above |

All new props on existing shared components are defaulted so every prior caller
is byte-identical: `ConfirmDialog.panelClassName`,
`NotificationPreferencesCard.headerClassName`, `TrainingPathway.headingRef`,
`BannerBlob.rotateDeg`/`backSheet`/`scaleClassName`.

### Pathway rail

Icons made stage-specific: `CircleX` → **`Drama`** for Peer Role-Play (the export
is a circle with an X, which every other UI in this app uses for "error" — in a
*progress* rail it read as a failed stage), `MessageSquare` → **`NotebookPen`**
for My Reflection (matching the glyph Round 19.1 chose for the reflection panel),
`Video` → **`HeartHandshake`** for Live Intervention (`Video` was the same glyph
as the Join Zoom button further down the same page). Completed stages get a
28px purple dot with a tick at 4.85:1; the halo stays unique to "You are here",
which is what the "Ongoing" chip now says. Every stage **and the certification
column** is clickable — a demo control in the same category as
`CoachStageSwitcher`. The "Complete all five stages" sub copy is now **counted
off the rail** rather than written down; the frame said five above a timeline
drawing six.

### Responsive

The Stage 1 banner stacks below `xl` (not `lg` — the shell's column is the
constraint, not the viewport: at 1024px the content column is ~704px and a 405px
blob leaves the copy ~250px, which is where the title wraps one word per line),
centres below `sm`, and the CTA goes full-bleed there. The blob scales through a
single `--blob-scale` variable on a `transform: scale()` shell rather than three
copies of eleven interdependent measurements — the mask scales for free.

---

## §76. Round 32 — the first-run tour: seven coachmarks over the trainee dashboard, plus responsive stacking and copy fixes (2026-08-28)

A direct chat-edit session, no pre-written scope plan, ~20 instructions arriving
mid-turn — several as freehand annotations over the live page. Five Figma frames
(`637:10621`, `637:10622`, `637:10623`, `637:10624`, `637:10625`), all of them
one component in five states.

### What shipped

**`components/delivery/DeliveryTour.tsx` + `data/deliveryTour.ts`** — a
coachmark walkthrough that opens when the welcome flow's final CTA is used, and
only then: `completeOnboarding(to?)` starts it on the presence of `to`, which
Skip omits. Seven steps: the greeting, the pathway card, the learning-progress
card, the meeting card, then the My Learning / My Notes / My Profile nav rows.
The last two have no frame — direct instruction was to reuse the card and write
the text.

**Anchors are `data-tour` attributes on real elements.** Nothing in the
component knows about layout: it queries the attribute, measures whatever it
finds, and places the card around it. Re-pointing a step is a one-string change
in the data file. All copy lives in the data file too — the one structural
lesson worth keeping from Round 17's deleted researcher tour, whose copy was
rewritten three times.

**The stage count is interpolated, not written.** Frame `637:10621` says "the
five stages" over a rail that draws six. `tourStepBody()` fills `{stageCount}`
from `PATHWAY_STAGES` at render, so the card cannot contradict the rail beside
it. This is also why the component is mounted in `DeliveryHomePage` rather than
`DeliveryShell` — the shell cannot import `PATHWAY_STAGES` without a cycle.

### Five things that were only visible by measuring

1. **`.focus()` on a `visibility: hidden` element silently does nothing.** The
   card is hidden until placed (so it never flashes at the top-left corner), and
   a first pass focused it on `active` alone. Measured, `activeElement` was
   still `#main-content`: the tour opened with focus *outside* the dialog, so
   Tab went to the page behind the dim — the exact failure the trap exists for.
2. **An index-keyed focus guard fires against the outgoing card.** Adding
   `mode="wait"` means the incoming card mounts ~300ms *after* the index
   changes. The guard ran early, marked the step done, and then refused to fire
   when the real card arrived. Focus landed on the page's "Skip to main content"
   link on every step after the first. The guard now keys on the **card
   element**, which cannot exist before there is something to focus.
3. **A mask `rect` has no layout box.** `getBoundingClientRect()` on it returns
   0, so a first attempt to prove the spotlight was animating "showed" it frozen.
   framer-motion animates SVG `x`/`y` as a **CSS transform** and `width`/`height`
   as attributes with a `px` suffix — read those, not the `x`/`y` attributes.
4. **Skip was 17px.** The frame draws it as a bare text node. Raised to `h-9`
   with `-my-2` so the header row still measures the frame's own 20px.
5. **The console tool returns a retained buffer that survives `location.reload()`
   and `console.clear()`.** Four errors looked current; the `finish` body quoted
   in them predated an edit made minutes earlier, which is how they were
   identified as stale. A fresh tab was clean. **Verify console state in a new
   tab, not a reloaded one.**

### The motion, tuned across five rounds of feedback

Every value here was set by a direct report and then measured. Recorded in full
because the end state looks arbitrary without the path.

| Symptom reported | Cause | Fix |
|---|---|---|
| "instant transition" out of onboarding | *Not* instant — measured at 600ms. But `mode="wait"` passes through a fully blank canvas, and a fast blank frame reads as a cut | 0.26/0.34 -> **0.4/0.55** |
| "short lag before the tour starts" | A 1050ms start delay, chosen with a comfort margin | **590ms** — the reveal's own end plus two frames |
| "the tooltip just flys in randomly" | One persistent card animating `top`/`left`, sliding diagonally between two unrelated anchors | `key={index}` + remount; fade in place |
| "too fast" (x2) | 0.2s, then 0.42s | **0.5s in / 0.3s out** |
| "too springy" | The *curve*, not the duration: `[0.16, 1, 0.3, 1]` is an expo-out that sprints then crawls, and at 10px travel + a scale-up it lands as a pop | **`[0.4, 0, 0.2, 1]`**, 4px travel, no scale |
| "instant and hard" before the greeting card | The dim itself appeared at full strength in one frame | The **whole overlay** fades, 0.45s, in and out |

Two notes worth keeping. **The spotlight glide was the larger half of
"smoother"** — the card was already fading while the hole underneath it snapped
between boxes in a single frame, and that is what the eye caught. And **two
different easings on two things moving together is most of what reads as
springy**: the hole now shares the card's curve deliberately.

`AnimatePresence` wraps the **whole portal**, not a subtree inside it — a
component that returns `null` when inactive can never play an exit, which is why
everything below that boundary tolerates a `step` of `undefined`.

### Scroll lock

`overflow: hidden` on `documentElement` while the tour runs, chosen over a
wheel/touch blocker because it stops *user* scrolling while leaving
**programmatic** scrolling intact — and the component's own `scrollIntoView`
depends on that. Body padding compensates for the removed scrollbar; without it
the page jumps ~15px wider the instant the tour opens, moving every anchor it is
about to measure. Both restore on cleanup (verified: `overflow: visible`, empty
padding).

### Committed assets

`public/illustrations/tour/left-doc.svg` + `chart-line.svg` — the frame's own
exports. The rest of the illustration is plain rectangles, which is what they
are in Figma.

### Contrast (rasterised, not calculated)

Step label `on-purple-muted` on `primary` **5.74:1**; Skip `parchment` 9.75:1;
title, body and both buttons 10.62:1.

### Also this round

- **`DeliveryHomePage`'s learning-progress / meeting pair stacks below `xl`.**
  The frame's row needs `524 + 40 + ~360 = ~924px` of content column and the
  shell reserves 320px of chrome, so it only fits from ~1244px up.
- **The trainee greeting's hard `<br>` replaced by `max-w-[640px]`.** The string
  measures 1189px on one line at 18px Inter; a 640px cap gives two even lines at
  every width the shell produces. The `<br>` produced a *third* line once the
  column narrowed, because the first half then wrapped on its own.
- **Stage 6 gained a "what to expect" banner.** It had none, because no frame
  was ever supplied. A first pass derived the copy from Phase 8 (entry into
  SPACES delivery) and was wrong: **Stage 6 is still training** — "Live
  Intervention" names the live *assessment*, with simulated clients and an
  expert assessor, not a real caseload. Corrected on instruction, and the code
  comment now says so, since the next person to touch it would otherwise
  inherit the wrong premise from a comment that reads authoritative.
- **Contractions removed from all six stage banners and the certification
  card.** "You'll" -> "You will", and a genuine run-on in the certification card
  ("...along the way they'll be in touch...") split into two sentences.
- **"See all my modules" / "Go to My Learnings" -> "Go to My Learning"** on both
  Home CTAs, matching the sidebar tab label.

---

## §77. Round 33 — the module player rebuilt: an outline rail, a frame-driven layout, one slide at a time, and a new footer (2026-08-28)

Frames: `519:10455` (the player, pulled three times as the user edited it
mid-round), `665:944` (the outline rail), `665:942` (the content row),
`665:1012`/`665:1013` (the slide column), `519:10494` (the footer).

Built and live-verified by measurement; **no formal Phase 3/4 review** — the
backlog now spans fourteen rounds (21, 21.1, 21.2, 21.3, 23, 25, 26, 27, 28, 29,
30, 31, 32, 33). A direct chat-edit session, no pre-written scope plan, ~30
instructions arriving mid-turn, most as freehand annotations over the live page.

### What shipped

**New `pages/training-v2/player/ModulePlayerNav.tsx`** — a floating white card
(330px, 16px radius, `parchment` stroke, the app's warm card shadow) listing the
module's *sections*, never its steps:

```
Module outline                    [collapse]
Module 5 / Understanding Sleep
[========            ] 32%
~~~~~ wave rule ~~~~~
  ● Introduction
  ● Chapter 1 / How sleep works        ⌄
      ├ Learn                    ✓
      ├ Case example 1           ✓
      └ …
  ● Chapter 2 / Sleep across the lifespan…  ⌄
  ● Summary
```

- Every row's step index comes from `playerSteps.ts`'s existing helpers
  (`chapterStepRange`, `outroStepIndex`), the same functions the module overview
  page's outline rows read, so the two surfaces cannot disagree.
- **"Summary" is one row** covering outro + feedback + complete. Three steps, one
  destination as far as a coach is concerned.
- **Chapters expand** to their own steps on a tree (square elbows; curves were
  built and removed on instruction), each jumpable. `AnimatePresence` +
  `height: auto`, 280ms, symmetric `[0.4, 0, 0.2, 1]`. The list **unmounts** on
  exit, so collapsed steps are never left focusable behind a zero-height box
  (§50's standing rule).
- **Backwards-only.** A row is live once reached; `furthestIndex` is separate
  from `stepIndex` precisely so jumping back to re-read Chapter 1 does not make
  Chapter 2 unreachable again. Safe because `setModuleStepIndex` never regresses
  a stored index.
- **A chapter opens on its first sub-part**, not its title card — but never
  ahead of where the coach has actually been, so a chapter reached for the first
  time still lands on the card.
- **Discs, not numerals** (numbers were added, then removed): light grey
  `hairline` until reached, `purple-200` while live, `success` + tick once
  behind the coach. Completed sub-steps take a 16px `CircleCheck` in `success`,
  **rendered only when earned** — a reserved slot left 24px of dead space in
  front of every unticked label.
- **Collapsed = 76px**: hamburger, a `primary` flag, and `N/4`. Not a column of
  anonymous discs.
- **Sticky header.** The rail is the scroll container, so its own `pt` would
  scroll away under a sticky child; the 24px moved onto the sticky header
  itself, which `-mx-4` bleeds to the card edges.

**`ModulePlayerPage`** — one slide at a time. The Round 7.1.2 scroll-stack (every
visited slide mounted, `snap-y`, a measured `scrollTo` delta) is gone. Arrow
keys move between slides, ignored while focus is in a field, and forward
respects the same readiness the Next button does.

**`ModulePlayerFooter`** rebuilt from `519:10494` — an 84px `purple-50` band:
`Go Back Home` (house glyph, hover fills `primary` with white icon + label,
confirmation-gated) and a centred `Previous slide` / `Next slide` pair, 272x44,
24px apart.

**`SlideLayout`** — the standard variant moved from a 720px top-aligned column
to the frame's **656px, centred both axes** via `my-auto` (not
`justify-center`, which would push the top of a taller slide out of reach of
the scroll container).

### Measured against the frame

| | Frame | Live |
|---|---|---|
| Content row | y 48, p 24, gap 32 | 48 / 24 / 32 |
| Outline card | x 24, w 330 | 24 / 330 |
| Content area | x 386, w 1102 | 386 / 1102 |
| Slide column | 656px, 211px in | 656 / 211 |
| Footer | h 84, `#f3efff` | 84 / `#f3efff` |
| Slide pair | 272x44, 24px apart | 272x44 / 24 |

### Four things worth reading before touching this

1. **A fixed offset cannot centre against a collapsible rail.** The footer
   reserved a hardcoded 330px while the rail's open state lived privately inside
   `ModulePlayerNav`. Expanded the two happened to agree; collapsed, the slide
   pair sat **127px** off the content column's centre. The state moved up to the
   page, the widths are exported constants both files read, and the footer
   reserves `railWidth + 32`. Measured 937 = 937 expanded, 810 = 810 collapsed.
   A stray flex `gap-8` then added 32px on top of the reserved gutter — hence
   `lg:gap-0` from `lg` up.
2. **Indexing the step array directly blanks the page.** The old stack *sliced*
   it, so stored progress past the end of the step machine was harmless.
   `steps[stepIndex]` is a whole paint earlier than the clamp effect, so it now
   clamps at render (`safeStepIndex`).
3. **"Remove scrolling" cannot mean `overflow: hidden` here.** Measured, 3 of
   Chapter 1's 7 slides exceed a 622px content area at an 802px window. The
   stack is gone; `overflow-y-auto` stays as the only thing keeping that content
   reachable. Nothing scrolls when a slide fits.
4. **Light grey fails as a structural indicator on a tint.** `hairline` on
   `purple-50` measures **1.2:1**; the tree lines are `ink-faint` at 4.58:1. The
   *discs* were then returned to light grey on instruction — flagged, since a
   1.27:1 disc is decoration, not a state cue, and the row's text colour is what
   actually carries the state.

### Contrast (rasterised)

Tree lines on the tinted block 4.58:1 · current row `primary` on `purple-50`
15.42:1 · sub-step labels `ink-muted` 11.19:1 · current sub-step `primary`
9.40:1 · tick `success` on white 5.19:1 · Go Back Home 10.62:1 · Previous slide
9.40:1 · disabled Next `ink-muted` 10.38:1 (the frame's own treatment measured
1.98:1, and `ink-faint` 4.25:1).

### Deliberate divergences from the frame

- The 44px icon container is the **collapse control** (`PanelLeftClose` /
  `Menu`), not the frame's book glyph — the rail has to collapse and this app
  already says "collapse" with that icon in both portal sidebars.
- **A full 1px stroke**, not the frame's `border-r`; one stroked edge on a
  rounded floating card reads as a rendering fault.
- **The three footer pills use this app's canonical button styles**
  (`caption-medium`, 1px outline), not the frame's 16/600 and 2px stroke.
  Widths, heights, order and icons are the frame's.
- Chevrons at **20px**; the frame's 12x6 vector is a hairline at real size.
- The **progress bar + %** and the **exit confirmation** are additions, both
  asked for directly.

### Left open

- **The chapter content model is on hold at the user's request.** The stated
  shape is topics (multiple) / skills in scenario / why it matters, replacing
  the current Learn / Case example x3 / Knowledge check / What to expect /
  Chapter complete. Changing it touches `playerSteps.ts` *and*
  `data/moduleContent.ts`; the mapping was not guessed at.
- **`ModulePlayerHeader.tsx` is orphaned** — the frame dropped the top progress
  bar and its Exit moved into the footer. Left in place rather than deleted.
- **Completed and not-yet-reached sub-steps now render the same `ink-muted`**
  (the last instruction of the round). The green tick is the only resting
  difference between them.
- `/training-v2/module/:id/play` is still only populated for
  `understanding-sleep`; nothing about that changed here.

---

## §78. Round 34 — the onboarding flow: one-path photo frames, a scaled-down artwork block, fixed copy/CTA position, cumulative doodle rotation, and a choreographed handoff (2026-08-29)

Frames: none. Every change in this round came from direct instruction or
freehand annotation over the live page, so there is nothing to re-pull from
Figma — **this section is the specification.**

Built and live-verified by measurement; **no formal Phase 3/4 review** — the
backlog now spans fifteen rounds (21, 21.1, 21.2, 21.3, 23, 25, 26, 27, 28, 29,
30, 31, 32, 33, 34). Files touched: `components/delivery/DeliveryOnboarding.tsx`,
`components/delivery/DeliveryShell.tsx`, two new files
(`components/delivery/blobFrame.ts`, `components/delivery/Doodles.tsx`), and one
new data module (`data/coachPathway.ts`).

### 78.1 The photo frame is now ONE path — read this before touching the cards

**This is the third time this project has shipped a photo sitting outside the
line meant to frame it** (Round 31 found it on every blob variant; it regressed
in Round 30's onboarding and was found again here). The standing rule in
CLAUDE.md — *a mask and the outline that frames it must be derived from one
source; never transcribe both* — was correct and kept being worked around
rather than followed.

**Root cause, measured.** The photo was masked by `blob-mask.svg` and framed by
`blob-outline.svg`. They are **different shapes**:

| file | intrinsic size |
|---|---|
| `blob-mask.svg` | 178.772 x 137.307 |
| `blob-outline.svg` | **180.762 x 143.134** |

On top of that the mask was positioned by four hand-transcribed numbers
(`maskW/maskH/maskX/maskY`) against the outline's own two (`strokeX/strokeY`).
Six numbers, two shapes, one alignment that could only ever be approximately
right — and it was ~1px out horizontally and ~5px vertically at 1x, which the
Round 34 scale-down made obvious.

**The fix is structural, and it is what to copy.** The path lives once, in
`components/delivery/blobFrame.ts`, and is rendered **twice inside a single
inline SVG** — once as a `clipPath` for the photo, once as the visible stroke:

```tsx
<svg
  className="absolute"
  aria-hidden="true"
  focusable="false"
  viewBox={`0 0 ${BLOB_W} ${BLOB_H}`}
  style={{
    left: BASE.strokeX, top: BASE.strokeY,
    width: BASE.backW, height: BASE.backH,
    overflow: 'visible',           // the stroke is centred on the path; its
  }}                               // outer half would clip at the viewBox edge
>
  <defs>
    <clipPath id={clipId}><path d={BLOB_PATH} /></clipPath>
  </defs>
  {/* `slice` is SVG's `object-fit: cover` */}
  <image
    href={`${ART}/photo.jpg`}
    x={BASE.imgX} y={BASE.imgY} width={BASE.imgW} height={BASE.imgH}
    preserveAspectRatio="xMidYMid slice"
    clipPath={`url(#${clipId})`}
  />
  <path d={BLOB_PATH} fill="none" stroke={BLOB_STROKE}
        strokeWidth={BLOB_STROKE_W} strokeLinejoin="round" />
</svg>
```

- `clipId` comes from **`useId()`**, not an index. Two cards sharing a
  `clipPath` id is a document-global collision.
- `blob-mask.svg` and `blob-outline.svg` are **deleted** (grep-confirmed zero
  runtime readers). The outline's `d` is preserved verbatim in `blobFrame.ts`,
  so nothing was lost.
- `blob-back.svg` (the white sheet behind, rotated a further 3.35deg) is
  untouched and still an `<img>`. It is a genuinely different shape and never
  had to register with anything.

**Stroke scaling is now automatic and needs no thought.** The stroke is authored
`4.09282` in a `180.762` viewBox — the 0.0226-of-width ratio the frames keep
constant across every card size. Because the whole SVG sits inside the card's
shared CSS transform, the stroke scales with the card for free. There is no
`vector-effect="non-scaling-stroke"` anywhere and none should be added.

### 78.2 `ART_SCALE` — one number scales the whole artwork block

```ts
const ART_SCALE = 1 / 1.25   // "scale this section down by 1.5x", then eased back
```

It multiplies into three places and nothing else:

```ts
const scale = state.scale * ART_SCALE                      // each card
marginLeft/-Right: state.marginRight * ART_SCALE            // the inter-card gap
style={{ width: 700.023 * ART_SCALE, height: 251.081 * ART_SCALE }}  // doodles
```

**Why it is not a `transform: scale()` on the container.** A transform leaves
the original layout box behind, so the copy and CTAs below would not move up —
and moving them up was the point. Each card's **bounding box is derived from the
already-scaled size**, so the block's layout height shrinks with it.

Verified at `1/1.5` before it was eased back: doodles 700.023 -> 466.68 and
251.081 -> 167.38, card boxes 247.63 -> 165.08, 194.91 -> 129.94, 166.60 ->
111.07. Every value exactly 1.5x. **To retune, change the divisor and nothing
else.**

`LEAD_CARD_NUDGE = 12` shifts the leading card left without moving its siblings,
by applying `-12` left and `+12` right on the same element. Total row width is
unchanged, so the flex centring does not shift the whole group in compensation —
which is what a plain margin would have done, moving all three to fix one.

### 78.3 The copy and CTAs hold one position on all four screens

Direct instruction: the text container and the buttons must not move up or down
between screens. Two independent causes, two fixes.

**(a) The card row.** Pinned to the tallest state it ever reaches, derived from
the same `boundingBox` the cards lay themselves out with:

```ts
const ART_BLOCK_H = Math.max(
  ...SCREENS.flatMap((s) => s.cards.map((c) => {
    const k = c.scale * ART_SCALE
    return boundingBox(BASE.innerW * k, BASE.innerH * k, c.rotate).height
  })),
)
```

**(b) The copy block.** A **single grid cell holding every screen's text at
once** — three invisible copies size the cell to the tallest, the live one
animates on top:

```tsx
<motion.div className="grid w-full shrink-0 justify-items-center pb-10" …>
  {SCREENS.map((s, i) => (
    <div key={i} aria-hidden="true"
         className="invisible col-start-1 row-start-1 flex w-full flex-col gap-2 text-center">
      <p className="text-display-lg text-balance">{s.title}</p>
      <p className="text-sub-greeting text-balance leading-[1.4]">{s.body}</p>
      {s.note && <p className="text-body-md">{s.note}</p>}
    </div>
  ))}
  <AnimatePresence mode="wait" initial={false}>{/* live copy, same cell */}</AnimatePresence>
</motion.div>
```

**The sizers MUST carry the same classes as the live copy — `text-balance`
included.** A first pass omitted it on the sizer title only; the title wrapped
to two lines there and one line live, and the block reserved a phantom line that
pushed the CTA row down. That is the whole bug, and it is easy to reintroduce by
editing one and not the other.

Sized this way rather than with a fixed px height on purpose: the height depends
on where the copy wraps, which changes with viewport width, so a magic number
would only be correct at one size.

**Spacing.** The artwork-to-copy gap is `gap-12` (48px), down from the frame's
80px, because pinning the row to its tallest state reserves the taller middle
card on every screen. The copy block carries its own 40px below it (`pb-10`)
rather than the row using a second gap, so the copy-to-CTA distance is fixed
independently of the block's height.

**Measured, all four screens identical:** CTA top `566.5`, heading top `346.4`,
artwork `178.42`, copy block `172.1`. Adding the "Good luck." line changed none
of them (screen 2's longer body still governs the reserve).

### 78.4 Doodles — cumulative, sparse rotation

`components/delivery/Doodles.tsx` is a generated transcription of
`doodles.svg`'s `Group 4` as **nine addressable units** (7 single paths + 2
two-path cloud groups). It is a component and not an `<img>` for exactly one
reason: individual doodles rotate per screen, and a flat image can only rotate
as a whole. `doodles.svg` is retained as the transcription source but is no
longer read at runtime.

```tsx
// Rotate each doodle about its OWN centre. `fill-box` is what makes the origin
// the path's bounding box rather than the 700x251 canvas — without it the outer
// doodles swing across the layout instead of spinning in place.
const SPIN_ORIGIN = { transformBox: 'fill-box', transformOrigin: 'center' } as const

const rotation = (name) =>
  (DOODLE_SPIN[name] ?? []).slice(0, step + 1).reduce((a, b) => a + b, 0)
```

Rotation is **cumulative** — `rotation()` sums every delta up to the current
step — so a doodle carries on from where the previous screen left it rather than
snapping back to zero.

**Two rules the delta table has to respect.** Both were learned from a first pass
reported as *"only 2 doodles move, clouds don't move"* when measurement showed
all nine were rotating:

1. **Under ~8deg is invisible** at this size. The first pass used 3-9deg and only
   the two 9deg ones registered.
2. **Deltas must not cancel.** The top-left cloud went `-3` then `+4` — a net
   **1deg across the entire flow**, so it genuinely never appeared to move.

Current table (index 0 unused; nothing rotates on arrival at screen 1):

```ts
const DOODLE_SPIN: Record<string, number[]> = {
  'star-left':          [0,  14,   0,  -9],
  'cloud-topleft':      [0, -10,   0,  12],
  'cloud-bottomright':  [0,   0,  13,   0],
  'sparkle-a':          [0,  18,   0,   0],
  'tick-right':         [0,   0, -15,  11],
  'star-right':         [0, -12,   0,  16],
  'sparkle-b':          [0,   0, -17,   0],
  'asterisk-a':         [0,  10,  14,   0],
  'asterisk-b':         [0,   0,   0,  20],
}
```

Four or five of nine move per step, never all — the sparseness is what makes it
read as incidental drift rather than a synchronised carousel. Values are
hand-picked, **not randomised at runtime**, so every load and every screenshot
is identical.

**How to verify a change** (the naive probe is wrong — `querySelectorAll('g')`
picks up the clouds' nested inner groups and mis-maps every index):

```js
const svg = document.querySelector('[data-node-id] svg[viewBox^="0 0 700"]')
const units = [...svg.children].filter(n => n.tagName === 'g')   // direct children only
units.map(g => { const t = getComputedStyle(g).transform; if (t === 'none') return 0
  const [a, b] = t.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number)
  return Math.round(Math.atan2(b, a) * 180 / Math.PI) })
```

### 78.5 The handoff into the dashboard

Direct instruction, in the user's own order: *fade out, and while fading, scale
the artwork down, the text fades, the buttons disappear — then subtly the
dashboard appears.*

**The welcome flow plays its own exit before handing over.** `DeliveryOnboarding`
owns this, not the shell:

```ts
const EXIT_MS = 820

const leave = useCallback((to?: string) => {
  if (reduceMotion) { onComplete(to); return }
  setExiting(true)
  window.setTimeout(() => onComplete(to), EXIT_MS)
}, [onComplete, reduceMotion])
```

Three parts leave on their own clocks:

| part | transition when `exiting` |
|---|---|
| buttons | `duration: 0.2` — first and fastest |
| copy | `duration: 0.34, delay: 0.06` |
| artwork | `duration: EXIT_MS/1000`, `scale: 1 -> 0.78`, `opacity -> 0` |

The buttons go first deliberately: leaving the button the coach just pressed
sitting there while everything else departs reads as the press not registering.
Both buttons take `disabled={exiting}` so the exit cannot be re-triggered.

**Measured exit:** buttons half gone by 81ms and clear by 241ms · copy gone at
401ms · artwork gone at 802ms at its final 0.78 · dashboard appears 882ms.

**The two screens overlap.** `mode="wait"` was removed from the shell — it ran
them strictly in sequence and passed through a *fully blank canvas*, which is
what Round 32 had already identified as making the handoff read as a cut. Both
now live in one grid cell, the welcome flow on the higher layer:

```tsx
<div className="grid min-w-0">
  <AnimatePresence initial={false}>
    {showOnboarding && (
      <motion.div key="onboarding" className="z-10 col-start-1 row-start-1 min-w-0" … />
    )}
  </AnimatePresence>
  {!showOnboarding && (
    <motion.div key="page" className="col-start-1 row-start-1 min-w-0"
      initial="out" animate="in"
      variants={{ in: { transition: { staggerChildren: 0.16,
                                      delayChildren: PAGE_REVEAL_DELAY_S } } }}>
      {/* hero and body are the staggered children, each `variants={pageRise}` */}
    </motion.div>
  )}
</div>
```

**`min-w-0` on the container AND both cells is load-bearing.** A grid item
defaults to `min-width: auto`, so Home's 1379px pathway rail sized the track
instead of scrolling inside its own card and pushed the document to **1456px
against a 1131px viewport** — a real horizontal page scroll, and the third time
this project has hit it (Round 21.1's timeline, Round 30's carousels). It is
invisible in a screenshot except as a cut-off logo.

**Timings, and why they are written as a sum:**

```ts
const PAGE_REVEAL_DELAY_S = 0.3
const SIDEBAR_REVEAL_DELAY_S = PAGE_REVEAL_DELAY_S
const dismiss = { duration: 0.25, ease: 'easeInOut' }              // empty wrapper only
const reveal  = { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
const pageRise = { out: { opacity: 0, y: 12 }, in: { opacity: 1, y: 0 } }

const TOUR_START_DELAY_MS = (PAGE_REVEAL_DELAY_S + 0.16 + 0.85) * 1000 + 40
```

- `dismiss` is short because by the time it runs the flow has already played
  itself off screen; a long fade there is a second, invisible wait.
- **The sidebar shares the page's delay.** It was arriving the instant
  `showOnboarding` flipped — a new element appearing underneath a screen that
  had not left yet ("the side nav is popping in"). Measured after the fix: absent
  until 881ms, holds at 0, fades in from ~1200ms with the hero.
- **`TOUR_START_DELAY_MS` is a sum, not a literal.** It was `590` when the
  handoff was a plain 0.4/0.55 crossfade; every number underneath it has since
  changed. A coachmark measured while the page still carries a `transform` lands
  beside its anchor rather than on it, so this must move whenever the reveal
  does. Its clock starts when the flow calls back, which is already `EXIT_MS`
  after the click.

### 78.6 New `data/coachPathway.ts` — the stage count is derived, never written

The onboarding said *"five developmental stages"* and named **active simulation**
and **community feedback** — neither of which exists — over a rail that draws
**six**. Round 31 and Round 32 both hit the same sentence being wrong; this is
the structural fix.

```ts
export const PATHWAY_STAGE_COUNT_WORD: string   // "six"
export const PATHWAY_STAGE_SENTENCE: string     // "content learning, …, and live intervention"
export const PATHWAY_STAGE_COPY: PathwayStageCopy[]
```

`DeliveryHomePage` now builds its rail from the same list, zipping its icons on
by index (icons are presentation, not copy, so they stay in the page):

```ts
const STAGE_ICONS = [BookOpen, Users, Drama, ClipboardCheck, NotebookPen, HeartHandshake]
const PATHWAY_STAGES = PATHWAY_STAGE_COPY.map((s, i) => ({ ...s, icon: STAGE_ICONS[i] }))
```

**It has to be a data module, not an import from the page.** The chain runs
`DeliveryHomePage -> DeliveryShell -> DeliveryOnboarding`, so the onboarding
reaching back for the page's constant closes a cycle. Round 32 hit this same
constraint when the tour needed the count.

**Known rough edge:** the derived sentence renders *"…hands-on assessment, my
reflection, and live intervention"*, and "my reflection" reads oddly in prose.
It is the rail's own label. Fixing it means either renaming the stage or giving
each stage a separate prose name — a product call, not guessed at here.

### 78.7 Verification checklist for this surface

Copy-paste these; all four must hold.

```js
// 1. No horizontal page scroll (the min-w-0 regression)
document.documentElement.scrollWidth === window.innerWidth

// 2. Copy and CTA hold position — run on each of the 4 screens, expect identical
const r = document.querySelector('[data-node-id]')
;({ cta: [...document.querySelectorAll('button')]
      .filter(b => /Go next|Go to my dashboard/.test(b.textContent))[0]
      .getBoundingClientRect().top,
    h1: document.querySelector('h1').getBoundingClientRect().top,
    art: r.children[0].getBoundingClientRect().height,
    grid: r.children[1].getBoundingClientRect().height })
// => { cta: 566.5, h1: 346.4, art: 178.42, grid: 172.1 } on all four

// 3. layoutAudit() returns [] on every screen
// 4. Console clean IN A FRESH TAB — the preview console keeps a retained buffer
//    that survives reload and console.clear(); stale HMR errors from mid-edit
//    look current. (CLAUDE.md standing rule, hit again this round.)
```

`tsc -b` and `oxlint` clean throughout. **`tsc` passing is still not proof the
app builds** — this round hit a Vite-only failure (`Failed to resolve import
"@/data/coachPathway"`) that `tsc -b` passed, because the import was written
before the file existed. Always read `preview_logs` too, and check the
timestamps: the errors there were stale by the time they were read.

---

## §79. Round 35 — the trainee Home card becomes per-stage: seven variants on one constant container, plus a shared row list and a locked session CTA (2026-08-29)

Frames: `676:2187` (the Stage 2 card, re-pulled once mid-round when its header
gained a stage eyebrow), `676:2188` (that header), `544:3011` (the "Begin your
training journey" hero, re-pulled after it gained stickers). **Stages 3-7 have
no frame** — they were specified in chat, so this section is their only
specification.

Built and live-verified by measurement; **no formal Phase 3/4 review** — the
backlog now spans sixteen rounds (21, 21.1, 21.2, 21.3, 23, 25, 26, 27, 28, 29,
30, 31, 32, 33, 34, 35). One file: `pages/delivery/DeliveryHomePage.tsx`, plus a
copy change in `data/deliveryTour.ts` and one new committed asset.

### 79.1 The shape: one container, seven bodies

The left-hand card on trainee Home is now **per-stage**. The container is
constant and lives in `HomeStageCard`; a variant supplies a title, a sub copy
and a body, and cannot drift the chrome.

| `activeStage` | Card title | Body | Bottom CTA |
|---|---|---|---|
| Content Learning | My learning progress | progress bar + 3 stat tiles | `Go to My Learning` (filled) |
| Guided Group Practice | Group session prep | 3 resource rows | locked `Join group session` |
| Peer Role-Play | Role-play session prep | 2 resource rows | locked `Join role-play session` |
| Hands-on Assessment | Hands-on assessment outcome | 1 feedback row | locked `Join assessment session` |
| My Reflection | My reflection | prompt, **no rows** | filled `Share my reflection` |
| Live Intervention | Live intervention prep | 1 resource row | locked `Join intervention session` |
| *(past Stage 6)* | You are a certified sleep coach | certificate + next steps | **none** |

Stage indexes are resolved **by label**, never hardcoded — the same rule
`REFLECTION_STAGE_INDEX` already followed, so reordering or inserting a stage
cannot silently point a variant at the wrong one:

```ts
const GROUP_PRACTICE_STAGE_INDEX = PATHWAY_STAGES.findIndex((s) => s.label === 'Guided Group Practice')
const PEER_ROLE_PLAY_STAGE_INDEX = PATHWAY_STAGES.findIndex((s) => s.label === 'Peer Role-Play')
const ASSESSMENT_STAGE_INDEX     = PATHWAY_STAGES.findIndex((s) => s.label === 'Hands-on Assessment')
const LIVE_INTERVENTION_STAGE_INDEX = PATHWAY_STAGES.findIndex((s) => s.label === 'Live Intervention')
```

**`data-tour="learning-progress"` sits on the shell, not on a variant.** The
first-run tour points a step at this slot; on a variant it would break the moment
another stage rendered, and a missing anchor fails silently.

### 79.2 Frame `676:2187`, measured 16/16 exact

Everything maps to existing tokens — `--color-purple-50` **is** the frame's
`#f3efff` for both the header band and the rows, and `--radius-sm` is its 8px.
No new tokens.

| | frame | live |
|---|---|---|
| card radius / stroke | 16 / `#f5f5f7` | 16 / `rgb(245,245,247)` |
| header | h120, p24, gap 4 | 120 / 24 / 4 |
| title · subtitle | 22/500 · 16/400 lh1.4 | 22/500 · 16/400, 22.4px |
| section overline | 16/600 | 16/600 |
| list gap | 10 | 10 |
| row | h64, r8, p14/12, gap 12 | 64 / 8 / `14px 12px` / 12 |
| icon area | 36, r8 | 36 / 8 |
| row name · action | 16/600 · 14/500 ls-0.224 | identical |

### 79.3 Shared pieces (extracted at their second and third callers)

- **`StageList`** — heading + rows. Takes `heading`, `items`, a default `action`
  label and a default `icon`. `StageListItem` carries an optional `detail`
  second line, and optional per-row `action` / `icon` / `onSelect` overrides.
  **`onSelect` is what separates a real control from a dummy one:** a row with a
  handler is a live button; a row without one renders `aria-disabled` with an
  `sr-only` "(coming soon)" cue. Only the certificate row is wired.
- **`LockedSessionCta`** — the padlock pill plus its caption. Reads
  `upcomingGroupSessions[0]`, the same record `MeetingCard` renders, so the two
  cannot disagree about when the session is.
- **`ReflectionPrompt`** — the reflection copy, rendered by **both** the Stage 5
  banner and the Stage 5 card. The stage it names comes off the rail
  (`PATHWAY_STAGES[REFLECTION_STAGE_INDEX - 1]`), because the frame hardcodes
  "Hands-on Assessment" and that is only true while reflection sits at 5.
  `REFLECTION_CTA_LABEL` is shared for the same reason: two entry points, one
  action, one string.

### 79.4 Row surface

`bg-yellow-50` + `border border-yellow-100`, radius 8, **no shadow**. Shadows
were added on instruction and then removed: with the `shadow-card` gold on a
white card the rows stopped reading as a set. The outline alone separates them.
The same treatment was applied to Stage 1's three stat tiles and to the meeting
card's Zoom panel, so the three yellow surfaces on this page match.

Contrast (rasterised): row name 16.42:1 · action `Purple/700` 10.02:1 · detail
line 11.92:1 · locked CTA label 11.6:1 · caption `ink-faint` 5.17:1.

### 79.5 Card height — why there is no `min-h`

Direct instruction was "use Stage 1 as the default height", and a `min-h` was
tried twice before being removed:

1. `min-h-[361px]` — wrong, because the first Stage 1 measurement was taken
   mid-render. Stage 1 is **492**.
2. `min-h-[492px]` — correct number, wrong outcome: Stage 5 is 361 natural, so
   it gained **131px of dead space**.

Natural heights at the frame's 524px card width: **492 / 542 / 488 / 412 / 361 /
412 / 377**, and the meeting card beside it is 412.

The shipped answer has no number at all — the row is `xl:items-stretch` and the
meeting card already carried `self-stretch`, so **both columns stretch to the
taller of the two**. Measured across all seven states, the stage card and the
meeting card are exactly equal every time. Each stage body is
`flex flex-1 flex-col` and each CTA block carries `mt-auto`, so the CTA lands on
the card's bottom edge whichever stage is showing.

**Stage 1 is the one documented exception to "the bottom slot is the stage's own
Zoom session"** — its `Go to My Learning` keeps that slot.

### 79.6 `544:3011` — the Begin banner's stickers

The revised hero uses **`certified`'s base geometry exactly** (sheet, photo and
outline match to the decimal; badge / cloud / sparkle land on identical
coordinates), so the new `begin` variant spreads from it rather than
transcribing a second copy. Two things are deliberately **not** inherited, both
caught by comparing against the frame's own screenshot:

- **`back-purple.svg`**, not `certified`'s yellow sheet — this banner is
  `primary` purple, where the gold sheet reads as a smudge. `expect`, the other
  purple surface, uses the same purple sheet.
- **`star-bubble.svg`** where `certified` carries its rosette. This app's
  `star.svg` is a bare 20x21 star, not the bubble-with-a-star the frame draws,
  so the frame's own export is committed to
  `public/illustrations/stage/star-bubble.svg` (79.165x69.723) rather than
  substituting a nearly-right glyph.

`StageBlob`'s `variant` prop is now `keyof typeof STAGE_BLOBS`, so adding a
variant no longer means editing a second union.

### 79.7 Copy

- The stage sentence and the resource names are all sentence case per the copy
  rule; "Share your Reflection" was requested with a capital R and shipped lower
  case, because Title Case surviving that rule has been a critique finding
  before.
- **"clients", not "consumers"**, in Stages 3 and 4. The brief said "simulated
  consumer profiles", but Round 30 made terminology audience-dependent and the
  coach portal was verified at **zero** occurrences of "consumer". This is a
  genuine collision with the terminology table, which also defines "Simulated
  consumer" as a role name — flagged, not silently resolved.
- **The tour's step 3 was retitled** (`data/deliveryTour.ts`): it pointed at
  "My learning progress", which is now only one of seven things that slot shows.
  It is now "Your stage details", describing a card that changes with the stage.
- "Completing this reflection is mandatory" lives in the **shared**
  `ReflectionPrompt`, so it appears at both entry points. A requirement should
  not be visible from one and not the other.

### 79.8 Two bugs this round introduced and fixed

Both came from one careless bulk `replace` of
`<div className="flex flex-col gap-2">` -> `flex flex-1 flex-col gap-2`, which
was meant to hit the seven stage bodies and hit **nine** elements:

1. **`SectionHeading`** — a shared heading used by both the trainee and coach
   stages, which would have grown inside any flex row it sits in.
2. **The meeting card's Zoom panel inner block** — `flex-1` inside a column
   parent, which pushes the Join Zoom button down as the panel grows.

Neither was visible in a screenshot. The lesson is the ordinary one: a
whole-file string replace needs its hit count checked against the number of
places you meant to change, and the extras read individually.

### 79.9 Left open

- **The rail labels Stage 4 "Hands-on Assessment"** and the card is titled to
  match, but the four-source collated feedback is *Community of practice* in the
  COACH framework, which this rail does not have. The rail may be what needs
  adjusting — a product call.
- `public/illustrations/home/banner-back-gold.svg` is now **orphaned** (0
  runtime readers) after the reflection banner moved to `StageBlob`. Left in
  place rather than deleted, as a real Figma export.
- Resource rows are dummy cards by instruction — no download path exists. Only
  the certificate row is wired, to the same `downloadCertificate` the
  certification banner uses (verified live: it fires a real
  `care2sleep-certificate.svg`).
- Onboarding is still never persisted, so every HMR reload replays the four
  welcome screens and the tour. This makes stage verification slower than it
  should be and is the most annoying thing about working on this page.

### 79.10 The Figma frames, and a tooling constraint worth knowing

Seven cards — one per stage — were drawn into section `683:2371` ("Stage
Containers", file `s6OLTSd4nc9V9W9lT1oBTO`) by three agents working in parallel,
each given a distinct x so they could not collide. Absolute y is `-2971` on all
seven, x steps by 604 from 833. **Section children take RELATIVE coordinates** —
the section origin is (753, -3091), so relative (80, 120) lands at absolute
(833, -2971); two agents hit this and corrected it by reading positions back.

All auto layout, no absolute positioning inside the cards, and **zero styles
created, edited or deleted** (verified by before/after counts: 10 text / 19
paint / 1 effect). The brief told the agents to use raw hex for the yellows and
greys because no styles existed; the agents found that `yellow/50` (#FFF8E5),
`yellow/100` (#FFF0CC), `neutral/light-grey` (#6D6D6D) and
`neutral/lighter-grey` (#E0E0E0) **do** exist and bound those instead. That was
the right call and is what shipped.

**The constraint: `use_figma` could not resolve `676:2187`.** The MCP read tools
returned that node and its icon children in full, twice. Inside the plugin
sandbox it resolved to null on every page — including from an agent that walked
all 8 pages calling `setCurrentPageAsync` on each first, which is the supported
way to load a page — and `loadAllPagesAsync` is denied in that sandbox. **The
cause is still unknown**; the "unloaded pages" hypothesis was tested and
disproved, and a branch file key is the untested candidate. Recorded in
CLAUDE.md's tooling section.

The consequence was real: two agents substituted a `notebookPen` glyph for
`file-text` because they could not clone the original. Both flagged the
substitution rather than hiding it, which is what made it recoverable. The fix —
and the pattern for next time — is to fetch the frame's **own exported SVG**
from the `localhost:3845/assets/…` URL `get_design_context` returns and import
it with `figma.createNodeFromSvg`. That is a genuine export, so it satisfies the
never-hand-draw-an-icon rule, and it sidesteps node resolution entirely.

---

## §80. Round 36 — the coach's client record: one shared profile-details component, session-mapped case notes, and four tabs instead of six (2026-08-30)

**Built and live-verified by measurement; no formal Phase 3/4 review** (backlog
now seventeen rounds: 21, 21.1, 21.2, 21.3, 23, 25, 26, 27, 28, 29, 30, 31, 32,
33, 34, 35, 36). A direct chat-edit session, no pre-written scope plan, **no
Figma frames** — this section is therefore the only specification of what
shipped. Seven instructions, five of them arriving mid-turn, two as freehand
annotations over the live page.

**Files:** `pages/delivery/DeliveryConsumerDetailPage.tsx`,
`pages/research/ConsumerDetailPage.tsx`, `data/spaces.ts`,
`data/research-store.tsx`.

---

### §80.1 The tab row: six became four

| Before | After | Why |
|---|---|---|
| Overview | Overview **+ the reflection card** | Direct instruction |
| Session Notes | Session Notes *(rebuilt, §80.3)* | Direct instruction |
| Learning Progress | *removed* | Reads off the researcher's Coach Management record instead |
| Sleep & Health Data | **Client sleep & health data** | Coach-facing surfaces say "client" |
| My Reflections | *removed as a tab* | It held exactly one card |
| Client Profile Details | Client Profile Details *(rebuilt, §80.2)* | Direct instruction |

`ModuleEngagementTab` is **not** deleted — the researcher's
`SpacesCoachProfilePage` still renders it. Only the import here went.

The reflection card now sits directly under the session tracker it is written
about, so a coach ticks a session complete and the prompt to reflect on it is
the next thing on the page rather than a tab away.

---

### §80.2 `ProfileDetailsSections` — one component, two permission levels

Before this round the coach's profile tab rendered two bare `ProfilePersonCard`s
while the researcher's rendered Study information + two `PersonRecordCard`s +
Notification preferences. **Same record, two card vocabularies, already visibly
drifted.** The fix is not to copy the researcher's markup across — it is to
export the researcher's tab body and give it a role:

```tsx
export function ProfileDetailsSections({
  dyad,
  viewerRole = 'researcher',
}: {
  dyad: ConsumerDyad
  viewerRole?: 'researcher' | 'coach'
})
```

Same `viewerRole` contract `SessionTracker` established in Round 17.2 and
`ModuleEngagementTab`/`SleepDiaryFeed` adopted in Round 30.

**Three differences, and they are not the same kind of thing:**

| Difference | Kind | Treatment |
|---|---|---|
| Withdraw from study | **Permission** | Button *absent* for a coach |
| Notification preferences | **Permission** | Whole card *absent* for a coach |
| Edit PLE / Carer details | **Permission** | New `readOnly` prop on `PersonRecordCard` |
| Assigned-coach name links to the coach record | **Routing** | Plain text for a coach — the target is `/research/spaces-coaches/:id`, a Research Dashboard route the Coach Delivery Portal must never send anyone into |

**Absent, not disabled.** A control a coach may never use is not a control, and
a greyed-out "Withdraw from study" invites the question of who can press it.

`ProfilePersonCard` (182 lines) was **deleted** — the coach page was its only
reader, so switching orphaned it. Its `Separator` import went with it; that was
the import's only use in a 3,900-line file.

---

### §80.3 Session Notes — case notes mapped to sessions

Rebuilt on the trainee My Notes page's shape (`DeliveryNotesPage`, frames
`638:12057` / `641:12593` / `641:12650`): **write box → wave rule → table.**

Removed: the `rightSlot` "Upcoming sessions" panel (direct instruction) and the
ad-hoc-meeting dialog, whose only trigger was that panel's Add control. The
store's `addAdHocMeeting` action is **left in place** — a data-layer capability
with no current UI owner is not the same as dead code inside a page.

`SupervisionRecords` was **not** forked or flagged. Its shape genuinely differs
here (a session field, an edit path, a wave rule, a different table), and per
CLAUDE.md's own rule that is the case for building locally rather than adding
flags that switch off the behaviour making a shared component correct for its
other two callers.

**Three deliberate departures from the trainee page**, all because these are a
client's case notes rather than a coach's private scratchpad:

1. **Every note maps to a session.** Required field, leads the table.
2. **Notes are editable** (direct instruction). A coach writing up a session
   from memory gets details wrong; the trainee page's read-only viewer is wrong
   for a record that has to be accurate.
3. **No delete.** The trainee page's table carries one. A client's case note is
   a clinical record — flagged rather than silently matched to "same format",
   and a few lines to add if the study wants it.

**Only completed sessions are offered.** A note about a session nobody has held
is not a thing, and offering the whole 7-row plan would invite one.
`sessionCompletion` is seeded from every dyad's own `sessionsCompleted` at store
init, so `sessionCompletion[dyad.id] ?? []` is the complete list and not just
live toggles.

**Render through `sessionRowLabel()`, never as a bare number.** Internal
numbering has 1 = Planning, so a raw number is off by one *and* wrong for the
planning session, which has no number at all.

**The zero-sessions case is real and must be handled.** `dyad-014` has none.
The form is replaced by an explanatory line rather than rendered with a required
field that has no valid option:

> Case notes are written against a session. Once you have held your first
> session with this client, you can add notes here.

**A note predating this round has no session** and renders `—`, not
"Session NaN".

---

### §80.4 Data layer

`SupervisionNote` gained `session?: number` — optional and additive for the same
reason `dyadId` is: the researcher's coach-level supervision notes are not about
any one session, and existing seed notes are left unset.

New `updateSupervisionNote(noteId, patch)`, patching **by id** rather than
replacing the record, so an edit form cannot rewrite a note's
`coachId`/`dyadId` scoping. Registered at both provider-value sites (the value
object and its dependency array) — a scripted insert with an asserted hit count
of exactly 2, per the Round 35 lesson about unchecked bulk replaces.

The edit dialog can set a session but never **unset** one: the "Not linked to a
session" option only renders when the note already has no session.

---

### §80.5 One TypeScript note worth keeping

```tsx
const canSave = session !== '' && title.trim().length > 0 && body.trim().length > 0
...
if (!canSave) return
addSupervisionNote(COACH_ID, { session, ... })   // `session` is `number` here
```

TypeScript's **aliased-condition narrowing** (4.4+) carries `session !== ''`
through the `const`, so a second `session === ''` guard after the early return
is not defensive — it is dead, and `tsc` reports it as `TS2367: no overlap`. The
error is the compiler proving the guard unnecessary, not a type mismatch.

---

### §80.6 Verification

`tsc -b` and `oxlint` clean throughout. Vite `preview_logs` clean (per §66's
lesson that a green typecheck is not proof the app builds). Console clean **in a
fresh tab**, per §76's lesson about the retained buffer. `design/layout-audit.js`
**empty** on Session Notes and Client Profile Details, both coach and
researcher; `documentElement.scrollWidth === window.innerWidth` on both.

Exercised through the real UI rather than asserted:

| Path | Result |
|---|---|
| Save note | row added, mapped to the chosen session, toast fires |
| Save → focus | lands on the list heading, **not** `<body>` |
| Edit → seed | dialog seeds session/title/body from the note |
| Edit → save | row updates, toast fires, focus safe |
| `dyad-014` (0 sessions) | form hidden, explanatory copy shown |
| `dyad-013` (7 sessions) | 7 options, empty table |
| Legacy note | renders `—` |
| Coach profile tab | zero Edit buttons, no withdraw, no prefs, no `/research` links |
| Researcher profile tab | Edit details ×2, withdraw, prefs card — all intact |
| Terminology | 0 "consumer" in the coach portal |

**Two pre-existing audit findings on the researcher page** — `control-not-filling-wrapper`
on the notification-preferences checkboxes (`input.peer.size-7`, 28px inside an
880px form). Genuine false positives: a 28px checkbox is meant to be 28px. That
component was only wrapped in a conditional this round, never edited, so they
predate it. Recorded here rather than "fixed" by loosening the check.

---

### §80.7 Open items

- **No delete on case notes** — deliberate, needs a product call.
- **Seed notes have no session**, so the column shows `—` on first load.
  Mapping them is a seed-data edit, not a code change.
- **"Assigned coach" / "Coach email" show a coach their own details** on their
  own client's record. Mildly redundant, kept because "replicate the exact same
  cards" was the instruction.
- **`addAdHocMeeting` has no UI caller** in any portal.
- **`/delivery/meetings`** remains mounted but unlinked (from Round 30).

---

## §81 Round 37 — coach shell alignment, the sticky tab row, and the client Overview swap

**Built and live-verified by measurement; no formal Phase 3/4 review** (backlog now
eighteen rounds). A direct chat-edit session, no pre-written scope plan, ~18
instructions arriving mid-turn, most as freehand annotations over the live page.
**No Figma frames — this section is the only specification of what shipped.**

### §81.1 Terminology

The coach's per-client tab **"Session Notes" -> "Case notes"**. Everything *inside*
that tab already said "case note" (the write card's heading, the wave divider, the
component doc); the tab label was the last surface still disagreeing with the rest
of its own screen.

### §81.2 One shell treatment across the coach portal

The trainee pages had settled on a pattern the coach pages had not adopted:
content column flush (`contentClassName="px-0 pt-16 md:px-0 md:pt-16"`), no hero
band, title `display-lg` in `primary` over `sub-greeting` in `ink`, 8px apart, in a
`gap-12` stack.

- **My Notes** and **My profile** were passing no `contentClassName` at all, so
  they took the shell's hero-less default — 48px in, 80px down — while Home and My
  Learning ran flush at 64px. One shell, two left edges.
- **Coach Home** lost its `rounded-xl bg-yellow-50` band (Round 29's); the greeting
  is now page content, and the title moved `ink` -> `primary` because with the band
  gone the colour is what carries the hierarchy.
- **The client record page** lost the portal's last `bg-pearl` band — a cool grey
  panel on the warm `#fffcfa` canvas.

Measured after: all four nav pages' `h1` at **left 272, top 149, 40px, `purple-700`**.

**Trap worth keeping:** `heroNoSeam`'s padding is applied *after* `heroClassName`
in the shell's own `cn()`, so a `pb-0` passed through `heroClassName` **loses**. The
client page uses `heroFlushBelow` purely for its `pb-0`. `contentClassName` *is*
last in the content `cn()`, so overrides there do win. The two props are not
symmetrical — check which one you are fighting before adding a `!`.

### §81.3 The sticky tab row

The tab row moved **out of the hero and into the content column**. That is
structural, not cosmetic: `position: sticky` is scoped to its own parent's box, so
inside the hero the row unsticks and scrolls away the moment the hero does — the
exact behaviour being fixed.

- Parks at **`TABS_STICKY_TOP_PX = 48 + 24`**: the sticky `AppHeader`'s height plus
  `DeliveryShell`'s own `py-6`, so its top edge lines up with the side nav's rather
  than sitting on an offset of its own. The constant is shared by the CSS offset
  and the sentinel's `rootMargin` — they must agree or the chrome switches at the
  wrong scroll position.
- `-mx-6 px-6`: the box bleeds 24px past the content column each side so the labels
  stay flush with the back link, the names and the cards below in **both** states.
  The bleed lands in the shell's own 48px column gap and 48px right pad, so it
  cannot cause a horizontal page scroll — measured.
- Baseline rule `purple-700` at **1px** (tried 2px, then 1.5px, settled back at
  1px — the change that mattered was the colour, not the weight). **Hidden while
  parked** via `border-transparent`, not by dropping `border-b`, so the row's
  height cannot change by 1px at the changeover.
- Active indicator **5px in both states**. A pass that thickened it only while
  parked was reverted: a marker that resizes as you scroll draws attention to the
  scroll rather than to which tab is selected.

### §81.4 Three bugs that were only findable by measuring

1. **A `[]`-deps mount effect cannot see an element the shell has not rendered
   yet.** The stuck-state `IntersectionObserver` read `stickySentinelRef.current`
   as `null` on first commit — this page mounts while the welcome flow may still be
   up, and `DeliveryShell` renders `children` only once onboarding is done — then
   never ran again because its deps never change. The row stuck correctly and the
   chrome never appeared. **A callback ref** fires when the node actually arrives,
   whenever that is. Same lesson as Round 19.1's carousel.
2. **Two sibling `motion.div`s reconcile by position.** Adding the blur strip in
   front of the existing card layer handed it the card's live motion state; its
   `animate` only set `opacity`, so the inherited transform was never cleared.
   Measured `matrix(0.98, 0, 0, 0.98, 0, -4)` — which lifted the strip 3.8px above
   the header and left a **~4px band directly above the tabs with no blur at all**,
   reported twice as "missing gap" before it was measured. The strip is now a plain
   `div` with a CSS opacity transition; there was nothing there CSS could not do.
3. **`tsc -b` passed a file Vite's oxc parser rejected**, blanking the page — the
   third time this project has hit it. Both a genuinely missing `useCallback`
   import and a transient mid-edit JSX imbalance showed up only in `preview_logs`.
   Also re-confirmed: **that log buffer is retained** and shows errors minutes
   stale; check a timestamp before believing one.

### §81.5 The stuck chrome, and the gap above it

The white card is an **absolutely-positioned layer**, not classes toggled on the
box: fill, stroke and shadow cross-fade with **zero reflow**, so the labels cannot
shift a pixel as the row parks. It scales up from 98% and rises 4px as it fades;
`initial={false}` so a page loaded already scrolled shows it outright.

The 24px gap the row keeps off the header is covered by a separate strip carrying
`backdrop-blur-sm` **and** a canvas-coloured gradient — the blur defocuses what is
behind, the gradient lifts it toward the page colour. Deliberately **subtle**: a
first pass ran to fully opaque `background` with `blur-md` and read as a hard wipe
rather than a fade. It tops out at 70%.

### §81.6 The client Overview swap

The consolidated **"Client details"** card was replaced by the consumer record
page's own per-person **`ContactDetailsCard`** (Round 24) — one card per dyad
member, each led by the person's name with a PLE/Carer badge. The researcher's
consumer Overview and the SPACES coach page's details panel already used it, so all
three surfaces now show a client's identity in one treatment instead of two.

Composed **directly** in the coach page rather than through `DyadSection`, because
that component pairs `ConsumerDetailsCard` with the tracker and is shared with the
researcher's page — swapping the card inside it would have changed a surface the
instruction was not about.

`SessionTracker` gained an optional `className` (additive; every existing caller
omits it) so the coach page can pass `self-stretch` — the card's own `self-start`
left it **434px inside a 1120px column**. Its header is hidden for a **coach with
nothing planned**: the empty state below already says "No session plan yet" and
explains why, so the header restated it directly above.

### §81.7 Verification

`tsc -b` and `oxlint` clean (only pre-existing `only-export-components` warnings).
Vite `preview_logs` clean. Console clean **in a fresh tab**. `design/layout-audit.js`
**empty** on coach Home and all four client tabs, with no horizontal page scroll
(1440/1440). Tab keyboard roving re-checked with a real dispatched `ArrowRight`.
The Case notes save path was exercised through the real UI: row added, toast fired,
and focus landed on the list heading rather than `<body>`.

Known pre-existing false positive, recorded rather than "fixed": My Notes reports
three `table-cell-text-wrapping` on its View/Download cell. Both controls measure at
top 573 in a 210px cell — the documented inline-flex Range artifact (§ the audit
file's own third calibration note), and that table was not touched this round.

### §81.8 Open items

- **`DyadSection` is now orphaned** — grep-confirmed **zero** JSX call sites, and
  with it `ConsumerDetailsCard` and `SessionsPlanOverview`, which nothing else
  renders. All three live in `SpacesCoachProfilePage.tsx`. **Not deleted**, because
  the standing instruction this round was to leave the researcher page alone.
- **Going forward the coach's session-plan card must not depend on the researcher
  page** (direct instruction). `SessionTracker` is 387 lines and is *only* ever
  rendered with `viewerRole="coach"` — the researcher branch of `DyadSection`
  renders `SessionsPlanOverview` instead — so it already belongs in the coach
  portal. Extracting it to `components/delivery/` is the next action. This round
  touched that component only additively (an optional `className`, and a
  `showHeader` scoped to `viewerRole === 'coach'`), so the researcher's rendering is
  byte-identical, but the coupling is still there.
- `/delivery/meetings` still mounted but unlinked; `addAdHocMeeting` still has no UI
  caller (both from Round 36).


## §81 — Round 38: the Plan Sessions wizard, rebuilt meeting-first

**Type**
- New step **`--text-sub-greeting-semibold`** (18/600), the semibold partner to `sub-greeting`, named on the `caption`/`caption-medium` precedent. Registered in `cn()`'s `tailwind-merge` font-size list — without that it is silently dropped wherever a text colour is also passed (the Round 21.3 bug).
- **`--text-body--line-height: normal -> 1.4`**, matching the Figma style's own edit. A sanctioned exception to Round 23's "every step is `normal`", like `caption` at 130% (Round 24). **Wide reach:** `body` is used in the hundreds across all four portals.
- Shared `WizardStepHeading`'s step counter moved `ink-muted -> ink-faint` (5.17:1). Reverses Round 28; reaches the other three wizards.
- New additive `headingClassName` prop on `WizardStepHeading`; omitted, the other wizards render byte-identically.

**This wizard only**
- Panel `max-w`: 920 -> 1120 -> 1008 -> **808** -> **888**, every step a multiple of 8.
- Left rail and the visible "Plan sessions" title removed; the dialog keeps its accessible name via `aria-label`.
- `PLAN_STEP_GAP` (32px) between the step heading and its first card, against the shared `STEP_CONTENT_GAP`'s 24px. The review step uses 16px instead, because what follows it is a summary rather than a control.
- `SUMMARY_CARD` — the dashed read-back card, **no shadow**, extracted at its third call site.

**New component: `SessionDateCalendar`**
- Month grid, hand-built to the project's tokens rather than a date-picker dependency. `weekday` restricts selection to one day (step 1); `weekday={null}` allows any day (review-step editing) and drops the per-date fill, which otherwise read as a wall of purple.
- **Portalled to `document.body` with `position: fixed`.** Load-bearing: the review table's wrapper carries `overflow-hidden` for its rounded corners and the modal body scrolls, so an absolutely-positioned panel is clipped by both and the calendar never appears — exactly how it was reported.
- Unselectable dates are plain `<td>` text, not disabled buttons: they are not controls, so they should not be in the tab order.

**Welcome screen** — spacing and type from Figma `719:1806` (that frame is a reference for those only; copy, icons and tone colours are the project's). Step circles use **opaque** fills (`#fff0cc`, `#e2f5ec`, `purple-50`), not `/25`-`/30` washes: the connector runs behind them at `z-0` and showed straight through a translucent fill.

---

## §82 — Round 39: the coach's Coaching workspace rebuilt as a pre-session checklist, and the session-debrief → reflection → complete flow (2026-08-31)

Frames: `728:4388` (Coaching workspace), `737:1806` (previous-session note card), `728:4984` + `728:5066` (session-debrief banner and its artwork group). A very long direct-chat session, no pre-written scope plan, ~40 instructions arriving mid-turn, most as freehand annotations over the live page. **No formal Phase 3/4 review.**

### What shipped

**Coaching workspace (`/delivery/consumers/:dyadId`)** is now three blocks: an **Upcoming session details** card, the `Before session` wave rule, and **Your pre-session checklist** with three tabbed panels (Fitbit data / Sleep diary notes / Previous session notes). The after-session half — a wave rule, `SessionTracker` and `ReflectionCard` — was built, then removed on instruction.

**Session-debrief banner** (frame `728:4984`), above the upcoming card once a session has been attended. `yellow-200` on a `yellow-400` stroke. Its CTA opens the SIPTEA reflection wizard, which now carries a **gate** ("Did Session N go ahead?"), the 6 questions, an **editable review table**, and a **mark-complete confirmation**.

**Client sleep & health data** got a button-style view switcher (Fitbit / diary), a yellow `StatCard` KPI row per view, and a "Sleep and health data overview" heading. Sleep-diary **auto-calculated questions are hidden from coaches** (9 rows, not 13) and both coach surfaces read the same rule.

### The nine things worth reading before touching this work

1. **`SessionPlannerTable` exists so two screens cannot drift.** "Edit session plan" is now literally the wizard's review step — same component, same `purple-50` header, same drawer. The edit modal had been carrying the Round 14.4 green/amber timeline, which *was* a faithful copy of the review step until the review step was redesigned into a table and this file was not. **That is the second time one plan has been shown in two vocabularies here.** Copying markup across is what causes it; the table lives in one file and both callers render it.

2. **A mask/outline pair must come from one source — so reuse `BannerBlob`, do not transcribe the frame.** Frame `728:4986`'s own numbers put its mask (134.006×102.014 at 25.546,43.15) and outline (135.318×107.15) on *different* rects. `BannerBlob` (exported from `DeliveryHomePage` this round) already solves that alignment and has a gold back sheet for yellow grounds.

3. **Doodle positions are fractions of the frame's artwork box, not px.** The photo underneath is `BannerBlob`'s coordinate space (a 404.97px base × `--blob-scale`), not the frame's 165.52px group, so only a relative system lets the two agree. They are also **top-left** coordinates — a first pass centred them with `translate(-50%,-50%)` and every doodle sat half outside the banner.

4. **`divide-x` computed to `0px` here.** The confirm screen's vertical separators were reported invisible twice: first because `divide-parchment` (#f5f5f7) composites to nothing on a white panel, then because `divide-x` itself produced no border. Explicit `border-l border-hairline` per cell after the first, measured at 1px `rgb(224,224,224)`.

5. **`parchment` is invisible on the warm canvas — again.** The health-data switcher's `parchment` track was in the DOM and unseeable on `#fffcfa`. It is `purple-50` on a `purple-200` stroke now. This is the same trap Round 28 recorded for `bg-pearl` and a `primary/5` hover.

6. **`StatCard`'s `breakdownLayout="stacked"` lays out `grid-cols-3` regardless of part count.** Two parts each got a third of the tile, so "39 min" and "7 of 7" wrapped to two lines at 32px and the three tiles ended up different heights. `inline` fits two-part tiles on one line — measured, all three at 161px.

7. **Two step counters on one screen must agree.** Adding Review and Mark-complete to the rail made it announce "Step 1 of 8" while the pane showed "Step 1 of 6" — a screen-reader user got a different total from a sighted one. `stepCount` now reads `railStepsFor(...).length`.

8. **Completing a session unmounts the banner whose CTA opened the wizard**, so the wizard's own focus-return target is already disconnected when it fires. Measured: focus on `<body>`. It lands on the upcoming card's heading instead — this project's most-repeated defect, hit again.

9. **Marking a session complete has NOTHING to do with module unlocking** (direct correction). A confirmation bullet claimed it did. Recording it because CLAUDE.md's own SPACES notes state the unlock rule in a way that invites exactly that sentence.

### Deliberately not done — do not treat as oversights

- **The tab row is unchanged at four tabs.** Frame `728:4388` draws three (dropping Case notes and Client Profile Details, adding Coach's reflection); the user kept the existing row. So the frame's own "Coach's reflection" tab does not exist, which is why the reflection is reached from the banner.
- **`ReflectionCard` was deleted**, not parked. An earlier pass kept it `export`ed purely to dodge a "declared but never read" error — an export with no importer is dead code wearing a keyword.
- **`TOPIC_CARD_CLASS` was deleted** from `PlanSessionsModal` (zero readers once the timeline went), and `PLAN_TH` was unexported.
- **Two filled primary pills sit on the workspace tab** (hero "Edit session plan" and "Join Zoom session"), a consequence of the direct instruction to make the hero CTA primary.
- **Trainee `BANNER_CTA` moved 44px → 36px**, reversing Round 30's own direct instruction. The frames still draw 44.
- **`attendedSessions` is page state, never persisted** — a demo stand-in for the clock, so a reload clears it.
- **The frame's 4 doodles are committed** to `public/illustrations/debrief/`; the frame's own photo/back-sheet exports are not, because `BannerBlob` supplies them.
- **`addAdHocMeeting`** still has no UI caller in any portal.

### Verification

`tsc -b` and `oxlint` clean throughout. `design/layout-audit.js` **empty** on workspace, banner, gate, review, confirm, all three checklist panels, both health views, case notes and profile — no horizontal page scroll (1174 = 1174) in any state. Contrast rasterised through a canvas (Tailwind v4 emits `oklab()`). The whole flow was exercised through the real UI: join → banner → gate → 6 questions → review → save → confirm → complete, with the plan advancing to Session 5 and focus landing on a heading rather than `<body>`.

---

## §83 — Round 40: the certified-coach dashboard, an audience-wide "auto generated" label, and a per-client reflections log (2026-08-31)

Frame `739:5550` (coach Home) plus a long run of direct chat edits across the
Coach Delivery Portal. No formal Phase 3/4 review.

### Token changes (app-wide, all 4 portals)

| Token | Before | After | Why |
|---|---|---|---|
| `--text-title` | 22px / 500 | **20px** / 500 | Direct instruction; Figma's own `title` style moved. Used in the hundreds across all 4 portals. Verified against `layout-audit.js` on 7 surfaces — no table or card started wrapping because of it (proved by re-running the audit with the old value patched back in live: identical finding counts). |
| `Chip` tones | 6 | **7** — new `yellow` | `border-yellow-300 bg-yellow-50 text-ink`. Added to the shared component rather than hand-rolled at its call site so it inherits the one 27px/`px-4`/`text-fine` geometry all tones share. Text is `ink`, not a dark yellow: the ramp tops out at `yellow-400` (#ffb600), a mid-tone that is nowhere near AA on `yellow-50`. **16.0:1** measured. |
| `ConfirmDialog` sub-line | `mt-3` / `caption` | **`mt-1` / `body`** | Direct instruction. Changed on the shared chassis, not one dialog — every modal in the app keeps one title/sub-line treatment. |

### `purple-100` resolves — to a colour that is not ours

The priorities row hover is `purple-200`, which is what was wanted. But the
investigation behind it produced a **correction worth recording, and a
pre-existing defect**.

`index.css` defines the brand ramp as `50 → 200 → 300 → 400 → 500 → 700 → 900 →
950` and documents the gaps ("no purple-100/600/800") as deliberate. The
conclusion drawn from that — *"`bg-purple-100` does not exist"* — is **wrong**.
Tailwind v4 ships its own default palette, so an undefined brand step does not
fail; it falls through to stock Tailwind:

| Class | Painted | Source |
|---|---|---|
| `bg-purple-50` | `rgb(243, 239, 255)` | brand ramp |
| `bg-purple-100` | `rgb(243, 232, 255)` | **Tailwind default — not in our palette** |
| `bg-purple-200` | `rgb(228, 214, 255)` | brand ramp |

The stock value is a different hue (7 units more magenta in green) and appears
in no Figma swatch. Nothing errors, nothing looks obviously wrong, and it is
therefore worse than a missing token would be.

**Four pre-existing call sites paint it today** and are flagged, not changed —
picking the replacement is a per-site design judgment, and three are on
researcher pages outside this round's scope:

- `components/research/SlideOverPanel.tsx:130` — close button hover
- `pages/research/ConsumerDetailPage.tsx:1753` — progress-bar track
- `pages/research/ConsumerDetailPage.tsx:1992` — a 2px rule
- `pages/research/CoachProfilePage.tsx:2051` — accordion header hover

The general rule this exposes: **a gap in a brand ramp is not a guard rail.**
Any `bg-<colour>-<step>` that the project has not defined silently renders
Tailwind's own. Checking a swatch against `index.css` is not enough — measure
the painted pixel.

### New: `components/delivery/PrioritiesSection.tsx`

The frame's "This week's priorities" list. **Replaces `AttentionSection`'s card
grid on coach Home** rather than being a variant of it — a wrapping grid of
themed cards with per-card CTAs and a flat list of two-line rows in one box are
different shapes, not different colours, and one component serving both would
have meant a flag switching off the layout that makes the card version correct.
`AttentionCards.tsx` was deleted (grep-confirmed zero readers).

Landed shape, after seven rounds of direct feedback:

- **Row = title over note.** `caption-medium` over `body`, 12px apart, rows 16px
  apart. Both `ink`. Told apart by weight alone — no colour coding and no
  per-row icon, both ruled out explicitly.
- **The card is the control, not the text.** A stretched link
  (`after:absolute after:inset-0`) rather than an `<a>` wrapping the row,
  because the kebab is a real button and nesting one inside a link is invalid
  and unreachable by keyboard. Kebab sits above the overlay on `z-10`, top
  right. Hover deepens the fill; no underline, no shadow.
- **Fixed 272px list.** Not a cap. The box is one half of a two-column row, so
  shrinking it to fit one priority would drag the KPI grid beside it down every
  time a coach dismissed something.
- **Dismiss all does not remove the box.** Both other attention hubs in the app
  hide themselves when empty; both sit above content that closes up behind
  them. This one would leave a 456px hole. The empty state is also the more
  honest end state — "nothing needs your attention this week" answers the
  heading, where a vanished section answers nothing.

### `layout-audit.js` — calibration for stretched links

A stretched link reports its own text box, not its real target: the priority
title measured **17px** while the clickable card was **502×75**. Verified with
`document.elementFromPoint` at the card's corners and centre (every probe
returns the `<a>`; the kebab stays separately clickable). The 36px check now
exempts an anchor whose own `::after` is a zero-inset absolute overlay — the one
idiom that decouples an element's box from its hit area. A short bare `<a>` with
no such overlay keeps reporting.

**The same check caught a real defect first**: the rows' links were genuinely
24px inside a 46px row. Padding dropped 12px → 6px and the link took `min-h-9`,
landing the row at 48px against the frame's 46.

### Coach Home layout

Frame's two-column row, 48px gap: 2×2 KPI grid left, priorities right. Both
columns measure 358px because `items-start` was **removed** (grid items stretch
by default) and the tile grid takes `flex-1` + `auto-rows-fr`. The priorities
column sets the height — its list has a ceiling, the tiles have only a
`min-h-[120px]` floor and can absorb the slack. The KPI heading carries a fixed
`min-h-9` to line up with the priorities header, which is 36px because it holds
the alerts pill and Dismiss all; a bare `<h2>` measured ~25px and started the
tiles 11px above the list.

Section rhythm is a flat **48px**, matching the trainee dashboard: the fragment's
children are flex items of the page's own `gap-12`, so the `mt-14`s were deleted
rather than retuned.

### Nav: My Schedule restored, coach-only

`/delivery/meetings` had been mounted-but-unlinked since Round 30. New
`coachOnly` flag on `DeliveryLink` — distinct from `pending`, which means "built
later" where this means "not yours yet". The page was streamlined onto the same
shape as My Notes and My Learning (no hero band; `display-lg text-primary` over
a sub-line, flush 64px inset) — it was the last hero band left in the portal,
and restoring the nav entry is what made the difference visible.

**Client-mapped rows lose Edit, Delete and Start Session.** Three separate
direct instructions, one principle: a schedule is for *seeing* what is booked.
A planned session's dates live in the session plan and are edited there;
"Delete" has no honest meaning for a session the protocol requires; and joining
belongs in the client record, where the plan, the notes and the sleep data are.
"View details" becomes the row's primary action and is the route to the place
the Join control actually lives. Rendered **absent**, not disabled — the coach's
Profile details tab precedent. The Research Dashboard's own rows are untouched:
a researcher joining a group practice has no client record to prepare from.

### `MeetingsSection`

Tab counts (`Upcoming (0)` / `Scheduled (1)`) computed from one predicate that
also drives the visible list, so a tab cannot claim a count over an empty table.
Parenthesised rather than the count badge the Case notes filters carry —
`UnderlineTabs` takes a plain string label and widening it to a ReactNode would
change every tab row in four portals for one page. Empty state moved to the
shared `EmptyState` inside the app's white + `parchment` + `shadow-card`
surface; it had been a hand-rolled near-copy at its own larger geometry on a
bare slab.

### Data model

- `SupervisionNote.autoGenerated?: boolean` — **its own field, not derived from
  `session`.** "Which session is this about" and "who wrote it" are two facts;
  deriving one from the other is the two-fields-one-label trap, and it breaks the
  first time a coach writes up a session by hand.
- `AnnotationSummaryEntry.session?: number`, and the **one-per-consumer cap from
  Round 13 is gone**. `submitPostPracticeAnnotation` now *prepends*; capping it
  would have destroyed the previous session's reflection on every save. New
  `updateAnnotationSummary` patches by id so the share toggle cannot drop the
  session, the stamp or the answers.
- `ScheduleRow.readOnly` / `detailsHref` / `hideStart` — all additive, all
  default-off, so the Research Dashboard's rows are byte-identical.

### One measurement lesson

The My reflections dialog held a **snapshot** of the entry rather than its id, so
the share toggle wrote to the store and went on rendering the pre-toggle value —
a dead-looking control that a screenshot showed nothing wrong with. It now holds
the id and reads the live entry, and the re-seed effect keys on `entry?.id` so a
toggle cannot wipe an in-progress edit.

A second, related lesson about *testing*: reading `aria-checked` synchronously
after `.click()` returns the pre-render DOM. The first report of this bug was
right about the bug and wrong about the evidence.

---

## §84 — Round 41: the Consumer Portal's own brand, a first-run welcome screen, and Home rebuilt (2026-08-31)

**Frames:** `748:878` (welcome), `748:1314`/`761:3171` (header), `761:3170` (Home).
**Verification:** `tsc -b`/`oxlint` clean throughout; Vite `preview_logs` checked
separately (a green typecheck is still not proof the app builds here);
`layout-audit.js` **empty** at 1281px and 375px on every rebuilt surface, with
`documentElement.scrollWidth === innerWidth` at both.

### 84.1 A second token file, deliberately

`src/consumer-tokens.css` is new and is imported by `index.css` rather than
merged into it (direct instruction: "instead of following design tokens, follow
Figma, create a new font + colour token file, keep documenting side by side").
Its own header carries the full side-by-side table; the summary is that **the
Consumer Portal is now on a parallel brand**:

| | consumer (Figma) | app-wide (`index.css`) |
|---|---|---|
| brand action | `#3a00ad` | `--primary` `#4a278f` |
| destructive / sign-out | `#f55b42` | `--destructive` `#d70015` |
| page canvas | radial `#fffdfa` → `#fff9f0` | `--background` `#fffcfa` (flat) |
| wordmark family | Atkinson Hyperlegible Next | Inter |

`#3a00ad` is not a new hex to this repo — it is exactly the `--primary` this app
used before Round 23 moved it to `purple-700`. The consumer frames were drawn
against the older value. That is why it needs a *name* rather than a literal:
"the brand purple" now depends on which frame you are reading. **This is a
divergence to reconcile, not a permanent second design system.**

Four new type steps, all registered in `lib/utils.ts`'s `font-size` group in the
same commit (a `--text-*` token missing from that list is silently dropped
wherever `cn()` also passes a text colour — Round 21.3's lesson):
`consumer-lead` 20/400/1.3, `consumer-heading` 22/500/1.3,
`consumer-card-title` 24/500/-0.374 (the mobile step for every 32px card title:
"in mobile view we need to reduce font. what is 32 becomes 24px"), plus
`--color-consumer-panel` `#ece9f7`.

**Accepted AA failure, recorded not hidden:** white on `#f55b42` measures
**3.44:1**. Shipped as drawn, with the two available fixes written at the token.
Same standing as Round 21's 3.45:1 alerts badge.

### 84.2 Splitting one export into animatable layers

The pillow arrived as one flattened SVG. To animate the zzz, the face and the
eyebrows independently, it was split **byte for byte** — each `<path>` lifted
verbatim and given the original file's own unmodified `<svg>` open tag, so every
layer keeps the export's full 210.646 × 188 coordinate space and the six images
stack in perfect register *by construction*. No offsets to transcribe, so no way
for them to drift — the same principle `blobFrame.ts` applies (§78.1), reached
from the opposite direction.

The constraint that falls out of it: because each layer spans the whole box,
`scale` and `rotate` pivot about the *box's* centre, not the glyph's, so a
scaling z visibly slides sideways. Only `x`/`y`/`opacity` are safe on a split
layer. The body may scale because it is what the box is drawn around.

**Two measured amplitude findings.** An eyebrow twitch built at 1.6px was
sampled live at 120ms intervals and spent most of its travel under half a pixel
— animating in the DOM, invisible on screen (Round 34's finding, again). It is
4px now. And Tailwind's preflight `img { max-width: 100% }` silently clamped
*both* intentionally-over-wide exports to their own boxes, squashing the pillow
1.4% and the wave 0.14%; the inline widths were correct in the DOM the whole
time, and it was only caught by diffing `getComputedStyle().width` against them.
`maxWidth: 'none'` is load-bearing on every over-wide asset here.

### 84.3 An absolute wave, and the 96px that is easy to lose

Both waves are anchored by their **top** with a fixed px offset, not stretched
to their container: the crest has to hold its distance from the header at any
viewport height, and a percentage height slides it with the page.

Home's wave is positioned by the frame against the **whole page** (its box runs
-758.6 → 239.0, so the crest lands 239px down, just above the greeting at 266).
Rendered inside a content column that starts *below* the 96px header, the
frame's own number has to lose that 96 — a first pass transcribed it directly
and the date line was clipped by exactly one header height. `ConsumerCanvasWave`
now owns that correction so it cannot be re-derived wrongly; it takes a
`headerPx` prop rather than baking the number in.

### 84.4 `layout-audit.js` calibration: `overflow-clip`

`element-past-viewport`'s ancestor exemption gained `overflow-clip`. The
exemption's premise is "something above this clips it", and `overflow-clip`
clips at least as hard as `overflow-hidden`. Leaving it out reported the
welcome screen's deliberately over-wide 1439px wave twice, with
`scrollWidth === innerWidth` proving no page scroll. Narrow on purpose: an
over-wide element with **no** clipping ancestor still reports.

### 84.5 Route remounts replay every entrance — twice over

`App.tsx` wraps `<Routes>` in `AnimatePresence mode="wait"` keyed on the
pathname, so **every in-app navigation unmounts and remounts the whole page,
header included.** That surfaced as three separate complaints in one session
("selecting a different tab loads the page again including header", "this
section should not keep on reload", "nor should the header buttons reload").

Both fixes are module-scoped one-way latches (`navIntroPlayed`,
`pageIntroPlayed`) rather than state, for the same reason `ConsumerShell`'s
welcome flag is: state lives in the component that keeps being thrown away.
They reset on a real refresh, which is the requested behaviour.

**Suppressing only the arrival was not enough**, and that is the part worth
remembering: under `mode="wait"` the incoming page is held back until the
outgoing one finishes its 300ms fade, so the header was *absent* for that beat
and reappeared. The exit had to go too. The proper fix is for the header to sit
above the animated route swap entirely — a change to the shared chassis
affecting all four portals, so it is flagged here rather than taken.

### 84.6 What the instructions overturned, and what was tried and dropped

Recorded so none of it gets re-proposed as an obvious improvement:

- **The left sidebar is gone.** It was emptied one instruction at a time —
  Health & Sleep deleted, Home promoted into the header, My Profile moved into
  the account menu — and a rail with nothing in it is not a design.
  `ConsumerSidebar.tsx` and `ConsumerHealthPage.tsx` were deleted
  (grep-confirmed at zero other readers); the Fitbit and sleep-diary components
  that page rendered are shared and keep their researcher/coach callers.
- **The zzz motion path** (an arc drifting up and to the right, sampled off a
  quadratic) was built on instruction and removed on the next one. In place now.
- **Two icon entrance animations** — a spring-scale pop, then a
  squash-and-stretch rise from the bottom edge — both built on instruction, both
  rejected. The plain state change is the decision.
- **My Learning / Need Help were `aria-disabled` first**, which is this
  project's standing treatment for an unwired control. That was the wrong call
  here: a disabled tab cannot be selected, so the selected-tab state was
  unreachable, and two of three items refusing to respond reads as broken rather
  than unfinished. They are real routes onto `ConsumerInProgressPage`, which
  says plainly that it is being built.
- **Copy comes from the frame**, not the instruction: "My Home"/"My Learnings"
  became "Home"/"My Learning" per `761:3308`/`761:3310`.

### 84.7 Open

- **Is Atkinson Hyperlegible Next the wordmark face or the portal's body face?**
  In `748:878` it appears on the wordmark and nowhere else — every other string
  is Inter. Registered narrowly as `--font-consumer-wordmark`. Widening it is a
  rename plus three call sites; it was not done on a guess.
- The 192px module cover and 328px session panel are **empty in the frame and
  empty here** — reserved imagery, left as flat tinted blocks rather than filled
  with a stand-in, because a placeholder that looks finished is the harder thing
  to notice later.
- Play Module and Fill In Diary have no destination (the consumer's diary write
  path lived on the deleted Health & Sleep tab). Both are `aria-disabled` with
  `sr-only` cues.
- The welcome screen is **not persisted**, matching the trainee flow: a reviewer
  sees it on every full page load.

### 84.8 The `tsc`-passes-oxc-rejects trap, again

Round 23 documented that a `{/* … */}` comment inside a JSX *attribute list*
passes `tsc --noEmit` and is rejected by Vite's oxc parser. This round hit the
sibling case twice: **a `//` line comment between an opening `(` and the JSX
element it wraps** — both after `return (` and inside a ternary's `) : (` —
which `tsc -b` accepts and oxc rejects with "Expected `,` or `)`". Both times
the typecheck was clean and the page was blank.

Safe placements: above the `return`, inside the element as a `{/* … */}` child,
or as a `//` comment on its own line *inside* the attribute list (which is fine
— it is the `{/* … */}` form that breaks there). `tsc` passing is still not
proof the app builds; read `preview_logs`.

### 84.9 The coach card: two drawn variants, one proportional component

Frames `761:3469` (in place on Home), `761:3597` (Desktop view) and `761:3578`
(Mobile view) — `components/consumer/CoachCard.tsx`.

**The two variants are the same composition at two sizes, not two layouts.**
Every number in both frames is transcribed as a fraction of their shared 584px
width, and the region uses `aspect-ratio` rather than a height. That is not
tidiness — it is the fix for a real bug. With the region height, the portrait and
the blob all in fixed px, a 327px-wide card on a 375px screen kept its 276px
region and 486px blob, so the yellow filled the whole top of the card and the
curve sat far below the portrait. Fractions mean there is nothing left to keep in
step by hand.

Three things worth carrying forward:

- **The blob's rotated bbox is derived, not transcribed.** Figma reports the
  *rotated* box while the export is the *unrotated* shape plus its own filter
  bleed; `BLOB_SHAPE` recovers one from the other and reproduces the frame's
  615.94 × 485.65 to within 0.05px. Same principle as `blobFrame.ts` (§78.1).
- **The portrait is anchored by its bottom, and that is load-bearing.** Its job
  is to straddle the blob's curve, so when the size came down 200 → 160 on
  instruction it had to shrink *upward*; scaling about the centre would have
  lifted it clear of the curve and lost the overlap the composition is built on.
  It was also the source of the reported crop — it had been a child of the blob's
  `overflow-clip` region, so the clip cut off exactly the part meant to overhang.
- **A nudge asked for by eye was later confirmed by the frame — in one axis.**
  "Move the yellow pillow more top left" was applied as x −48 / up 28. The frame
  that arrived afterwards moved the same shape **−47.97 on x** and about 30px the
  *other* way on y. Horizontal read: right to 0.03px. Vertical read: backwards.
  The frame's values are used now; the episode is a fair summary of which
  eyeballed adjustments to trust.

**Open on this card:** the portrait is one stock face standing in for every
coach, and a `Coach` record has no photo field — so there is nothing to wire it
to, and it also sits against this app's standing app-wide "no avatars" rule
(Round 4.1, reinstated Round 21). A designed portrait on a card whose whole job
is "here is the person you will talk to" is a different thing from an avatar chip
in a table row, and the frame is explicit, so it ships as drawn with the conflict
recorded rather than resolved on the frame's behalf. It wants a real field before
it reaches a participant.

The blob's purple stroke was reduced 8 → 3 in the committed SVG on instruction
("reduce outline stroke") — a parameter change on the designer's own path, not
authored geometry, and it will be undone by any re-export.

**Superseded — read §84.10 instead.** Frame `761:3170` was updated again and the
blob was removed from the design entirely. Everything above about rotated bboxes,
per-breakpoint blob placements, the corner-gap inset and the stroke edit is
history: it describes a shape that is no longer drawn. The portrait-anchoring and
clipping lessons still apply and are restated below.

### 84.10 The same two cards again, simplified — and what that cost

Frames `761:3444` / `761:3449` / `771:3665`, the third revision of this row.

**The design got smaller and the code got much smaller with it.** "Your next
session" and "Meet your coach" now sit **side by side** — 540.5px each with a
40px gap inside the 1121px column — and both cards shed their illustration:

- the session card's 328px `consumer-panel` block is **gone**; the card is body
  only, and `--color-consumer-panel` now has zero call sites
- the coach card's yellow **blob is gone**, replaced by a flat 104px
  `yellow-200` band, and the portrait dropped 200 → 160 → **90.66px**
- the coach card's type came down a step throughout: eyebrow `body-md` (16/600),
  name 20/600 at 1.3, contact rows `body` (16/400 at 1.4) with 24px icons

Measured against the frames: sections 540.5 each at x 80 and 660.5 (gap 40),
band 104, portrait 90.7 straddling the band by 44.7 (frame: 44.66), both cards
368.5 tall via `flex-1` where the frame draws both at 365. `layout-audit.js`
empty at 1281px and 375px; no horizontal scroll at either.

**The lesson worth keeping is about sequencing, not geometry.** Between the
second and third revision this card absorbed roughly a dozen eyeballed
corrections — move the blob up, more top-left, reduce the stroke, close the
corner gap, reduce the portrait, reduce the dead space, twice — and every one of
them was work against a shape the next frame deleted. Two things would have cost
less: asking whether a frame revision was coming before iterating on a shape by
eye, and noticing that a run of "move it a bit" corrections on one element is
itself a signal that the element is unsettled in the *design*, not just in the
build. One nudge is a fix; six is a message.

**Two findings from that stretch do survive**, because they are about structure
rather than numbers:

- **A portrait that straddles an edge must not live inside the element that
  clips.** Its white ring extends ~13px past its own box, so clipping at the
  region sliced the ring flat — reported twice as "the avatar is getting
  clipped", diagnosed by measuring the ring's overhang against the region's
  edge. The card's own `overflow-hidden` is enough; nothing inside needs to clip.
- **When a composition must scale, every number in it has to be a fraction of
  one base.** Fixed px for the region, the portrait and the blob kept their
  drawn sizes inside a 327px card and the illustration swamped it. That problem
  disappeared with the blob — a flat band has no shape to distort — which is
  worth noting on its own: the simpler design removed the need for the
  machinery, rather than the machinery being made to work.

### 84.11 The streamlined type pass, and two stale numbers it exposed

The whole of frame `761:3170` was re-read after the designer normalised sizes,
weights and letter spacing. The type scale is materially simpler than it was:

| where | before | now |
|---|---|---|
| greeting date line | 20/400/1.3 | **20/500/1.3** (the frame's `Title` style) |
| section headings | 22/500/1.3 | unchanged |
| card eyebrows | 22/500/1.3 | **18/400/1.4** (`sub-greeting`) |
| card titles | 32/500/-0.374 | **28/500/normal** — tracking dropped |
| coach name | 20/600/1.3 | **18/600/1.3** |
| contact rows, buttons, nav | 16 | unchanged |

Token consequences: `--text-consumer-lead` reweighted 400 → 500;
`--text-consumer-card-title` lost its letter spacing and gained a paired
`--text-consumer-card-title-lg` (28px) in place of `display-md`, because the
desktop step is no longer an app step. Both registered in `cn()`'s font-size
group in the same commit. A new `EYEBROW_18` constant carries the eyebrow pair so
four call sites cannot drift.

Also this pass: two 52px icon slots (frame `771:3701`/`771:3704`) drawn as bare
`#d9d9d9` squares — reproduced as lucide glyphs in `consumer-primary` rather than
as grey squares, since the square is a placeholder and not a treatment; a **Read
More** control on the coach card (`771:3707`), which is exactly this app's
canonical primary-outline pill; and the session card's eyebrow becoming the
literal label "Session date and time:", which retired the session-number
derivation that card used to carry.

**Two stale transcriptions surfaced only because the design changed around
them**, and both are the same mistake: a number that was correct when copied and
became wrong when its context moved.

- **`lg:h-[420px]` on the task row.** The original frame pinned that row; the
  streamlined one does not. Keeping it meant the diary card — whose copy grew to
  four lines in the same pass — pushed its button 19px past its own
  `overflow-hidden` edge. Invisible as a layout error; it read as a clipped
  button.
- **`flex-1` as a way to bottom-align.** `flex: 1 1 0%` lets a column child
  shrink *below* its content, so pairing it with `justify-between` did not push
  the CTAs down, it let the card stop growing. `mt-auto` is the correct tool: it
  consumes slack that exists and is a no-op where none does, so the card grows
  instead of overflowing. Measured after: both CTAs bottom at 896.6 with 41px of
  card padding below each, cards equal at 480px.

The general lesson, and the second time this session has produced it: **a
transcribed constant needs re-checking whenever the frame it came from is
revised, not only when it looks wrong.** `justify-between` on the diary card drew
complaints in both directions (touching on mobile, ~170px apart on a laptop)
before a fixed gap replaced it — one property, two opposite symptoms, because the
value depended on a sibling's height that had itself changed.

### 84.12 Round 41 close-out — orphan sweep, final state, and what is left open

**Orphan sweep, run file by file rather than from memory.**

Deleted (grep-confirmed zero readers before removal):
`ConsumerSidebar.tsx`, `ConsumerHealthPage.tsx`, and two now-superseded asset
intermediates (`pillow-mascot-body.svg`, `awake-face.svg` — each replaced by a
finer split). Every remaining mention of the two deleted components is prose in a
doc comment, verified individually; none is code.

Kept deliberately, each with the reason written where a reader will find it:

| thing | why it stays |
|---|---|
| `pillow-mascot.svg`, `pillow-awake.svg` | the flat source exports every split layer came from — the only way to re-split without a fresh export. See the new `illustrations/consumer-welcome/README.md`. |
| `coach-card-blob.svg` | one line from restoring the blob if frame `771:3665` reverts |
| `--color-consumer-panel` | zero call sites since the session card dropped its panel; the value is what a restore needs |
| `--color-consumer-wave-light/-deep` | never applied in CSS by design — they document the committed wave asset's own palette |
| `addAdHocMeeting` (store) | a data-layer capability with no current UI owner, which is not the same as dead code |

**Two stale cross-portal comments are recorded rather than edited:**
`NotificationHub.tsx:260` and `CoachProfilePage.tsx:2188` both cite
`ConsumerHealthPage.tsx` as a live example. Those files belong to signed-off
rounds and this project's convention is not to silently rewrite another round's
notes — but the citation now points at a deleted file, so it is a one-line fix
for whoever next touches either file.

**Final verified state.** `tsc -b` and `oxlint` clean (the only warnings are
`only-export-components`, a pre-existing pattern across all four portals).
Vite `preview_logs` clean. Console clean **in a fresh tab**, per Round 32's
retained-buffer lesson. `design/layout-audit.js` **empty at 1440px and 375px**,
with `scrollWidth === innerWidth` at both. Focus after the welcome → Home
handoff lands on `#main-content`, not `<body>` — this project's most-repeated
defect, checked again at close.

Measured against the frames at close: sections 540.5 each with a 40px gap; both
task CTAs bottom at 875.7 with 41px of card padding below each; cards equal
height; coach band 104 with the portrait 90.7 overhanging by 44.7; type 22/500,
18/400, 28/500, 20/500 on desktop dropping to 16/600, 18/400, 24/500, 18/400 on
mobile. Contrast on everything new: 11.78:1 (white on `consumer-primary`, and
the Read More outline on white).

**What is open, in the order it should be picked up:**

1. **`#f55b42` with white text is 3.44:1 and fails AA.** Shipped as drawn, with
   two fixes written at the token. This is the one real accessibility debt in the
   round.
2. **The coach portrait is one stock face with no field behind it**, and it sits
   against the app-wide no-avatars rule. Needs a `Coach.photoUrl` (or the rule
   formally amended for this surface) before a participant sees it.
3. **The module duration is derived, not known** — `slideCount` x an assumed
   2.5 min/slide, tuned so the 6-slide modules match the frame's "15mins".
   Wants a real `durationMin`.
4. **Five unwired controls**, all focusable `aria-disabled` with `sr-only` cues:
   Play Module, Fill in sleep diary, Read More, and the My Learning / Need Help
   pages behind their tabs.
5. **`TODAY` is frozen at 2026-07-22** while the greeting now reads the real
   clock, so a session dated 22 July reads as past. Moving the seed constant is a
   four-portal change and was out of scope.
6. **Atkinson Hyperlegible Next is registered as a wordmark-only token.** Whether
   it is meant to be the portal's body face is still unanswered.
7. **No Phase 3/4 review** has been run on this round, and the backlog now spans
   eighteen (21, 21.1, 21.2, 21.3, 23, 25-36, 41).

**The process note worth carrying into the next session.** This round absorbed
roughly forty separate instructions, many as freehand annotations, and the two
things that cost the most time were both avoidable: iterating by eye on an
element the designer was still revising (the coach card's blob, ~a dozen
corrections, then deleted), and trusting transcribed constants after the frame
around them moved (`lg:h-[420px]`, which silently clipped a button). Both have a
cheap tell — a run of "move it a bit" notes on one element, and any number copied
from a frame that has since been re-pulled.

---

## §85 — Round 42: the Consumer Portal's fluid type scale, per-breakpoint wave exports, and the lesson card's three states (2026-09-01)

Driven by an updated set of Figma frames plus, for the first time in this
portal, a **second full-page frame at a second width**: `787:1286`
(`Home_IphoneSE`, 375) alongside `761:3170` (Home, desktop, 1281), and
`787:1774` (`Home_IphoneSE`, the welcome screen).

### §85.1 Fluid type — the thing to reuse on every other consumer tab

**This replaces the paired-class approach entirely. Do not reintroduce a
`text-x md:text-y` pair on a consumer surface.**

Every consumer type step is now a single token whose `font-size` is a `clamp()`
interpolating between the two frames. One class per call site, a real value at
tablet, and no second half for a call site to forget.

| Token | 375 | 1200 | Weight / line-height | Used for |
|---|---|---|---|---|
| `--text-consumer-display` | 28 | 40 | 500 / normal | the page greeting |
| `--text-consumer-heading` | 20 | 22 | 500 / 1.3 | section headings |
| `--text-consumer-card-title` | **22** | 28 | 500 / normal | card titles, session rows |
| `--text-consumer-lesson` | 18 | 20 | 500 / 1.3 | "Lesson N", coach name, welcome body |
| `--text-consumer-lead` | 16 | 20 | 500 / 1.3 | the greeting's "Today is …" |
| `--text-consumer-eyebrow` | 16 | 18 | 400 / 1.4 | card eyebrows, diary body |
| `--text-consumer-chip` | 14 | 18 | 600 / 1.4 | the "Lesson complete" chip |

**The formula**, so a new step can be added without re-deriving it. For a step
that is `M`px at 375 and `X`px at 1200:

```
slope     = (X - M) / (1200 - 375) * 100        -> vw
intercept = (M - (X - M) * 375 / 825) / 16      -> rem
clamp( M/16 rem , intercept + slope vw , X/16 rem )
```

Two things about it that are load-bearing:

- **The intercept is in `rem`, not `px`.** A clamp whose preferred value is pure
  `vw` ignores the reader's own font-size setting and fails WCAG 1.4.4 (Resize
  Text). This portal's audience is the one with the explicit note about it.
- **Anchors are 375 and 1200**, the iPhone SE frame and this portal's own
  desktop breakpoint. Outside that range the clamp holds flat, which is what
  `clamp` is for.

Deviations from the frames, both on direct instruction and both recorded because
they are the only places the table above is not purely transcribed:

- `card-title`'s mobile anchor is **22, not the frame's 24** ("any font that is
  24px to 22px, maintain same weight"). Weight and line height untouched.
- `consumer-lesson` is the shared 18 → 20 step and serves three roles. The coach
  name takes it with `font-semibold` (desktop 20 was a direct instruction), the
  welcome body with `font-normal`. Reused rather than cloned: the size ramp is
  the thing worth naming once, and weight is a one-utility override.

The mobile frame gives its three section headings **three different sizes** (20 /
18 / 22) for one repeated element. That is frame drift — the desktop frame draws
all three at 22 — and it is normalised to one step.

⚠️ **Every `--text-*` must also be listed in `lib/utils.ts`'s `font-size` class
group.** A token missing from that list is silently dropped by `tailwind-merge`
at any `cn()` site that also passes a text colour. Round 21.3 lost a whole step
this way.

`--text-consumer-card-title-lg` was **deleted** — it existed only as the desktop
half of the old pair.

### §85.2 The wave: clip, never squash

`home-wave.svg` carried `preserveAspectRatio="none"`, so **its box is its
geometry** — hand it a box and it shears rather than crops. Two attempts to serve
every width from that one export both failed, the second worse than the first:
`132.14%` of the padded column gave 432×998 on a phone (2.3× stretch), and
"fixing" it to `100vw` gave 375×998 — a **4.5× squash**, which is what turned the
gentle crest into spikes.

There is no ratio that satisfies both ends. The resolution is Figma's own: a
**purpose-drawn export per breakpoint** — `789:1932` (1281×239) and `789:1930`
(375×176), plus `789:1935` for the welcome screen. Each renders at `width: 100vw`
with height from its own viewBox, so nothing is stretched. `home-wave.svg` is
deleted.

Three further measured corrections:

- The desktop export's height scales with viewport width, so below 1281 the band
  gets shallower — at iPad Mini's 768 only **47px** cleared the header and it read
  as missing. Its width is floored at its own 1281 so the viewport crops it.
- The welcome export sits in a clip window with percentage insets; a first pass
  applied its nested `-4.75%` bottom extension **twice**, pushing the curve past
  the clip and cutting it off flat.
- **Do not put `display` in the shared inline-style object.** An inline style
  beats a class, so `hidden` never applied and both exports rendered at once —
  invisible, because the desktop one is only 70px tall on a phone.

### §85.3 Content that has to track a full-bleed asset

Because the desktop wave grows past 1281 while the content does not, the pillow
drifted off the crest (5px above it at 1281, 35px at 1440). The content block
carries `marginTop: max(0px, calc(18.657vw - 239px))` — the wave's own growth
(`239/1281 = 18.657%` of viewport, less the frame's 239), floored at 0 so it is a
no-op below 1281 and on mobile. Verified at −5px against the crest at 1281, 1440
and 1920.

### §85.4 Two Tailwind traps this round hit

- **A composed class generates no CSS.** Tailwind scans source *text*, so
  `` `${WIDE}:block` `` is not a class. Every breakpoint in `ConsumerHeader` is a
  literal.
- **Arbitrary `min-[…]:` variants and named breakpoints do not interleave by
  width.** `md:grid-cols-2` beat `min-[1281px]:grid-cols-[744px_1fr]` even at
  1400 where both matched. Use one family or the other for a given property —
  here, `min-[768px]:` and `min-[1281px]:` together. Separately,
  `minmax(0,1fr)` inside an arbitrary value does not parse; `1fr` does.

### §85.5 Layout and colour

- Task row: 1 column → 2 equal columns at 768 → the frame's `744px 1fr` at 1281.
  It was `lg:flex-row` with a fixed 744px card, which at iPad landscape left the
  diary card **80px wide**.
- New `--color-consumer-lesson-complete` `#bcfbab` — the chip fill, a sixth
  deliberate exception to the "quiet, no rival accents" rule. With
  `consumer-primary` text it measures **9.83:1** on painted pixels.
- The next-session card is stroked `hairline`, not `parchment` — the frames'
  own choice, and the only card of the four with no tinted region of its own.
- The mobile header is now logo-left / hamburger-right with **no tab row**, per
  `787:1329`. ⚠️ That overrides an earlier direct instruction ("the logo takes
  centre, and the three buttons act as page tabs") and hides three destinations
  behind an icon for an audience with an explicit plain-language note. Flagged
  at the call site as the one change to revert if the tab row was meant to stay.

### §85.5a Late corrections in the same round

All from direct instruction, all after the sections above were first written —
recorded here rather than folded in silently, because several of them **reverse**
a decision made earlier in the same round:

- **The mobile tab row is back.** `787:1329` draws no tab row and the build
  followed it, moving Home / My Learning / Need Help into the hamburger. Reverted
  ("just bring mobile header out as we have in tablet + mobile before"): hamburger
  left, logo centred, three tabs as a full-width row beneath the bar. The frame
  loses here on purpose — this was already flagged as the weaker pattern for this
  portal's audience. **§85.5's last bullet is superseded by this.**
  - The header grows 96 → 157 below 1200. Nothing needed an offset: the header is
    `sticky` and therefore in normal flow, and `ConsumerCanvasWave` positions
    against the content column rather than the page, so the wave, mascot and every
    section below moved down by exactly the row's 61px with all internal
    relationships intact (wave→mascot +18, wave→greeting 34, both the frame's).
- **The "Lesson complete" tick is a composed disc, not `CircleCheck`.** That icon
  strokes its circle and its mark with one `currentColor`, so a white tick forces
  a white ring — and the frame has no ring ("there is no white outline stroke").
  A `rounded-full` purple span wrapping a white lucide `Check` is the only way to
  colour disc and mark independently.
- `~N mins left` moved 600 → 500. The progress bar is **full width, stacked below
  the caption** up to 1280 and only takes the frame's 264px beside it at 1281+.
- Card CTAs are **full width up to 1280**, taking the frame's 256px only at 1281+.
- The coach card's "Read More" stays **below the contact rows** through tablet
  (was `sm:`, now `min-[1281px]:`), and the coach card takes the session card's
  `hairline` stroke rather than `parchment`. ⚠️ The lesson and diary cards still
  carry `parchment` per the frames, so the four are no longer uniform — worth a
  decision next session.
- The session and coach cards bottom-align their CTAs (`flex-1` + `mt-auto`), so
  all four cards' buttons sit on their card's bottom edge as the lesson and diary
  cards already did. Measured equal at 1024.
- Mobile welcome: the pillow→heading gap ended at 80px after three passes — 24
  read as cramped, the frame's own 48 still did.

### §85.6 Verified

`tsc -b` and `oxlint` clean. `design/layout-audit.js` empty and no horizontal
scroll at 375×667, 667×375, 768×1024, 1024×768, 1281×900, 1400×900, 1920×900.
Type measured at each: 28/20/22/16 at 375 → 34/21/25/17 at 768 → 37/22/27/18 at
1024 → 40/22/28/18 at 1281+.

Assets deleted as orphans (grep-confirmed zero readers): `home-wave.svg`,
`logo-mark.svg`, `wordmark-moon-{ellipse,dot,crescent}.svg`.

**Testing note:** `document.hidden === true` on the preview pane throttles
`requestAnimationFrame`, so framer-motion entrances never complete and the
welcome copy reads `opacity: 0` in automated checks while rendering correctly in
a real browser. Round 16's finding, still current.

## §86 — Round 43: the Consumer Portal's My Lessons page, one shared hero, and six card states from three (2026-09-01)

**Frames:** `771:3711` (desktop My Lessons, 1281) · `792:2080` (mobile, 375) ·
`792:2310`/`792:2390`/`792:2429` (the week's lesson: start / resume / complete) ·
`792:2454`/`792:2337`/`792:2362` (a previous lesson: the same three) ·
`786:4211` (the previous-lessons list, re-pulled mid-round after the designer
edited it).

**Verification:** `tsc -b` and `oxlint` clean throughout (only the pre-existing
`only-export-components` warnings). Vite `preview_logs` checked separately — a
green typecheck is still not proof the app builds here, and this round proved it
again (below). `layout-audit.js` **empty** on Home, My Lessons and Need Help at
both 1281 and 375, with `scrollWidth === innerWidth` at both.

### 86.1 The hero is now one component, and it was not before

Round 43 opened with "streamline the hero across all pages, we use what we have
done in home section". The wave already *was* shared. The mascot was not, and
measuring the two pages side by side is the only way that showed up:

| | wave bottom | mascot |
|---|---|---|
| Home @1440 | 269 | bottom 263, on the crest |
| My Learning @1440 | 269 | bottom **234**, floating 35px above it |
| Home @375 | — | 89 x 58 |
| My Learning @375 | — | **138 x 90**, the desktop art on a phone |

Home carried two things inline that the placeholder pages never got: the
mascot's `0.6444` mobile scale wrapper, and a `calc` tracking the wave's growth
past 1281. Both are now `ConsumerMascotFigure` and `CONSUMER_CREST_TRACKING`,
and Home consumes them — so this is enforced by the module graph, not by care.
`ConsumerPageHero` followed at its second caller and Home's greeting renders
through it too. After: both pages measure figure top 174 / bottom 264 at 1440
and 89 x 58 at 375, identically.

**`CONSUMER_HERO_TO_CONTENT`** (`gap-12 lg:gap-[72px]`) and the section gap
(`gap-4 lg:gap-6`) are constants for the same reason. Both moved on direct
instruction during the round — 48 -> 72 "just for desktop view", and 32 -> 24
between a section title and its cards.

### 86.2 Six frames are three states against two surfaces

They ship as **two** components sharing `LessonPlayCta`, `LessonProgress` and
two complete indicators. Building six would have guaranteed a later change to
the progress bar reached four of them.

Each card is **one element tree with responsive classes**, not a mobile copy and
a desktop copy, even though the compositions differ a lot: on mobile the week's
lesson is a filled purple card with the photo inside it and a previous lesson
has **no photo at all**; on desktop both become a bordered tile with text beside
it on the bare canvas. It is one order of content in two surface treatments, and
two trees would mean every copy fix and aria change had to be made twice.

### 86.3 Type — four exact matches, two outliers, one genuinely new step

Four of the frames' mobile/desktop pairs land on an existing Round 42 clamp
**exactly**: 28/40 `consumer-display`, 22/28 `consumer-card-title`, 18/20
`consumer-lesson`, 16/18 `consumer-eyebrow`. Strong evidence the frames were
drawn against the shipped system.

Two are outliers and deliberately did **not** get tokens — the section heading
(flat 22 vs `consumer-heading`'s 20 -> 22) and the chip (flat 16 vs
`consumer-chip`'s 14 -> 18). Both are exact at desktop and 2px under at 375.
A token each would give this portal two section-heading and two chip steps
differing only on a phone, which is the drift Round 42 existed to end.

One step **was** added: **`--text-consumer-card-title-sm`, a flat 22/500**, the
only consumer step that does not interpolate. A previous lesson's title is 22 at
both widths while the week's lesson grows 22 -> 28, and that difference is what
makes the featured card the louder of the two on a wide screen. Registered in
`lib/utils.ts`'s `font-size` group in the same commit — a `--text-*` token
missing from that list is silently dropped by `tailwind-merge` wherever `cn()`
also passes a text colour, which this call site does (Round 21.3's lesson).

### 86.4 Data — the two pages cannot name different lessons

New `components/consumer/lessons.ts`. Home used to pick "the first module not
yet completed" inline; a page headed "Lesson of the week" can only sensibly mean
the newest released. Two pages, one fact, two answers. Both now read
`releasedLessons(dyad)`, whose `[0]` is the featured card and whose tail is the
list below it — one ordering, so the two sections cannot both claim a lesson or
drop one between them.

"Released" is read off `moduleEngagement`, **not** `moduleUnlockState`: Round 39
recorded a direct correction that "marking a session complete has nothing to do
with module unlocking", and the demo dyad agrees with the correction — Lesson 4
is genuinely in progress while session 4 is still upcoming. Reading the unlock
helper would hide a lesson the consumer has demonstrably opened.

Consumer lessons **start at Lesson 1** (direct instruction). `CONSUMER_MODULES[0]`
is the always-available pre-module — real content that coach-facing surfaces
still count, but not one of the consumer's lessons, so it never appears here and
no label can read "Lesson 0".

The headline count is derived from `NUMBERED_LESSON_COUNT`. Both frames get it
wrong in different ways — desktop says "6 lesson in total" (no plural) and
mobile renders " lesson in total" with the number dropped entirely, a Figma
variable that did not resolve.

### 86.5 Three defects worth keeping

**1. `justify-center` silently reinterprets itself when flex-direction flips.**
`LessonProgress` was a column with `justify-center` (vertical). Adding
`lg:flex-row` for the desktop treatment made that same class **horizontal**, and
the figure and bar centred themselves in the content column — reported as
"broken". Measured, the label sat at x=901 against a title at x=804, exactly the
97px track width. `lg:justify-start` is load-bearing. Flipping direction
reinterprets every alignment class on the element.

**2. A JSX comment above the returned element is not a comment.** `return (`
followed by `{/* … */}` and then `<div>` is two children in an expression
position. `tsc -b` reported it; more importantly **Vite had been serving stale
code for several minutes** while the browser showed the last good module, which
is why a measurement taken in that window read the old class list. Same family
as Round 23's comment inside an attribute list. Check `preview_logs` *and*
`curl` the module — a 200 with real output is the proof.

**3. A synthetic hover is not a CSS `:hover`.** The pane's `hover` action moves
the pointer but `cta.matches(':hover')` stayed false, so the CTA-hover image
highlight could not be verified that way. It was verified by **reading the
generated rule out of `document.styleSheets`** — both
`group-has-[button:hover]` and `group-has-[button:focus-visible]` resolve to
`border-color: rgb(58, 0, 173)`. `focus-visible` is carried alongside hover
deliberately: a hover-only affordance is invisible to a keyboard user, and this
portal's audience is the one this project has an explicit note about.

### 86.6 Assets and divergences

Two new committed exports, `wave-rule-desktop.svg` (920.731 x 6) and
`wave-rule-mobile.svg` (328.482 x 6). Both carry `preserveAspectRatio="none"`,
so the box **is** the geometry and each must render near its own drawn width —
the same "clip, never squash" rule as the background waves (§85.2). They are
**not** `/illustrations/home/wave.svg`: that is the same designer's squiggle
with the same layer name, but stroked `#A070FF` for the coach portal. These are
`#3A00AD`. Matching the glyph was not enough to make it the right asset.

Recorded divergences, each on direct instruction against the live page rather
than the frame: rows are **64px** apart, not `786:4211`'s 48; the previous tile
is **326 x 250** (derived — 399 x 250/306 = 325.98, and keeping
`aspect-[399/306]` makes it exact); its stroke is `hairline`, not purple; the
week's tile stroke went **3px -> 4px**; every tile carries the warm Card shadow;
and the week's lesson number is `ink` on desktop, not the frame's
`consumer-primary`.

CTA labels are sentence case and identical at every width — "Play lesson",
"Resume lesson", "Play again" — where the desktop frame shortens the featured
one to "Play". One control with two names across a resize is worse than losing
four characters. `#008302` maps to the app's `success` (`#1f7d37`) per the
standing rule that a frame hex with no palette equivalent keeps the semantic
token; it is also the darker of the two.

### 86.7 Left open

1. **Nothing plays.** Every CTA is live in the DOM but there is no consumer
   module player to open, so `LessonPlayCta`'s `onClick` is optional and only
   Home's demo cycler passes one. This is the round's biggest gap.
2. **Lesson 2's seed state breaks a domain rule on purpose.** It is
   `in-progress` with its catch-up already held, on instruction, so the resume
   state is reachable on a previous lesson. Flagged at the seed.
3. **Home's card still uses `DEMO_PROGRESS`** (a constant) while My Lessons
   reads real slide counts, so the same lesson can show two different bars.
   Home's cycler is documented as a review tool; this goes when the player lands.
4. **"Previous weeks' lessons"** takes a plural possessive. If the apostrophe
   reads as fussy for this audience, "Lessons from previous weeks" says the same
   thing with no punctuation.
5. **No Phase 3/4 review** on this round; the backlog now spans nineteen.

### 86.8 The My Lessons avatar — a pencil and a contact shadow (frame `771:3718`)

Direct instruction: "For lessons, I added a pencil + shadow. Just add this to my
lesson avatar. animation of pillow remains same."

The frame exports the whole avatar as **one flat SVG**, which would have thrown
away the four-layer split the expressions, the nap and the zzz all depend on. So
the two additions were lifted out of it **byte for byte** — the pencil is its
`<g id="Group 23">` verbatim, the shadow its `<ellipse id="Ellipse 3">` verbatim,
each given the export's own unmodified `<svg>` open tag. The frame's box is
138.158 x 90, *exactly* the box the existing layers use, so all seven register by
construction with no offsets to transcribe (§84.2). Verified: every layer reports
an identical rect, at both widths.

Two things were checked rather than assumed. The export's single `<defs>` filter
is referenced only by the pillow **body**, so neither extracted layer needs it.
And `awake-body.svg` already contained the wide `Ellipse 2` ground shadow at
identical coordinates — the only genuinely new shadow is the smaller, darker
contact ellipse.

**`awake-body.svg` had to be split, and measurement is the only reason that was
found.** The contact ellipse belongs *between* the ground shadow and the pillow,
which one combined asset cannot express. Rasterising its footprint against
`awake-body.svg` showed **85% of it lands on the ground shadow and 15% on the
pillow's own yellow body** — so drawing it after a combined asset painted a dark
blob over the pillow's lower edge. At 138px that is invisible in a screenshot.
It is now `awake-ground.svg` + `awake-pillow.svg` (the group plus its `<defs>`),
with `awake-body.svg` kept as the flat source, the same reason
`pillow-mascot.svg` is kept.

**Both composites were then proved by pixel diff at 4x**, which is the check
worth repeating on any future split:

| composite | vs | opaque px | differing | max channel delta |
|---|---|---|---|---|
| the 7 My Lessons layers | the frame's flat export | 149,668 | **1** | 148 (one AA pixel) |
| Home's 5 layers | the original flat `awake-body` stack | 149,668 | **0** | **0** |

So the pencil variant reproduces the frame exactly, and Home is untouched by the
split. `withPencil` is an opt-in prop on `ConsumerMascot` / `ConsumerMascotFigure`
/ `ConsumerPageHero` rather than a second component — the expressions, nap, zzz
and breath are identical and a fork would have to be kept in step with all of
them. Both new layers are plain `<img>`, not `motion.img`: they ride the
wrapper's breath and tilt (as the ground shadow already did) and take none of the
face's `y` animation, because a pencil leaning on a pillow does not raise its
eyebrows. **No existing animation was changed** — re-measured after the change at
14 distinct wrapper transforms with the eyes and brows still cycling 4 states.

### 86.9 The complete indicator became one object in two tones (frame `787:1271`)

Direct instruction: "updated lesson complete colors". The desktop indicator was
a green line — `CircleCheck` plus `#008302` text with no pill, which shipped
mapped onto the app's `success` (#1f7d37) per the frame-hex rule. The updated
frame replaces it with a **`yellow-200` (#FFE299) pill carrying a 30px
`consumer-primary` disc, a white check and `consumer-primary` text at 18/600**.

The point worth recording is not the colour, it is that this **collapses two
treatments into one**. Desktop and mobile now show the same object in different
tones rather than a pill on one and a text line on the other, so it renders
through the same `LessonCompleteChip` as the mobile chips instead of being its
own component. `LessonCompleteChip` gained a `label` prop (mobile "Complete",
desktop "Lesson complete" — both the frames' own wording, each with the room its
layout gives it) and now takes the disc size from the caller, since mobile draws
24px and desktop 30px.

`CircleCheck` left the imports with the green line; the disc is still a composed
element rather than that glyph, because `CircleCheck` draws its ring and tick in
one `currentColor` and every one of these pills wants a solid disc behind a
contrasting mark.

**Measured live:** pill `rgb(255,226,153)`, label `rgb(58,0,173)` at 18px/600,
disc 30px, contrast **9.3:1** (AAA), zero `text-success` nodes left on the page.
Mobile still shows the purple "Complete" chip with the yellow pill correctly
`hidden`. `layout-audit.js` empty at 1281 and 375, no horizontal scroll.

## §87 — Round 44: the Consumer Portal's sleep diary fill-in flow (2026-09-01)

**Frames:** `811:10934` / `792:4292` (welcome, desktop / iPhone SE), `811:10747`
/ `805:9508` + the `810:*` series (questions), `812:11076` / `814:11665` (thank
you). No tablet frames were supplied — tablet is the desktop layout on the
fluid scale, my call as directed.
**Verification:** `tsc -b` / `oxlint` clean; Vite `preview_logs` clean; console
clean **in a fresh tab** (Round 32's retained-buffer lesson);
`design/layout-audit.js` **empty on every screen of the flow at 375, 768 and
1281** — all 9 question steps plus welcome and thank-you at each width — with
`documentElement.scrollWidth === innerWidth` throughout. The full flow was
exercised end to end through the real UI and the submitted answers verified
verbatim in the coach's own Sleep diary view for 22 Jul 2026.

### 87.1 One question list, now genuinely shared

`SLEEP_DIARY_QUESTIONS` moved from `ConsumerDetailPage.tsx` into
`data/spaces.ts` the moment the consumer flow became a second reader. Rows 1-9
gained `field: keyof SleepDiaryAnswers`, `kind: 'number' | 'time'` and a `unit`
('min'/'times'); rows 10-13 keep `computed: true` and are never asked. The
researcher table, the coach summary and the consumer questionnaire all read
this one list — the questionnaire's steps are literally
`SLEEP_DIARY_QUESTIONS.filter(q => !q.computed)`, so adding or rewording a
question changes every surface at once.

New store action `submitSleepDiary(dyadId, { patient?, carer })` writes each
member's `diary` onto their `TODAY` health-log entry — the same
today-or-append shape as `addDiaryEntry`, one action for both members so a
caller cannot half-submit a dyad. `patient` is optional for carer-only dyads.

### 87.2 Input formats (the industry-practice pass)

- **Numbers are `type="text" inputmode="numeric"`, never `type="number"`** —
  numeric keypad on phones without the spinner, the scroll-wheel silently
  changing an answer under the pointer, or the `e`/`+`/`-` characters a number
  field legally accepts. Non-digits are stripped on input (capped 4 digits).
- **Times are native `type="time"`** — iOS/Android hand these to their own
  pickers, the most familiar large-target entry for this audience; desktop
  renders segmented HH:MM matching the frame's own placeholder. Converted to
  the data model's "h:mm am/pm" only on submit (`to12Hour`).
- Next is `aria-disabled` (focusable, discoverable) until every present member
  has an answer; clicking it early surfaces a polite `aria-live` hint. The
  final step's CTA says **"Finish"**, a deliberate deviation from the frames'
  ninth "Next".
- **Q1's Back is `aria-disabled`, not removed** (direct instruction) — a
  control that vanishes and reappears as you travel reads as a bug.

### 87.3 Motion

Only the question block animates; the progress row and Back/Next footer are
persistent chrome, so the eye has a fixed frame around the change. Steps slide
in the direction of travel (`AnimatePresence mode="popLayout"`, `custom`
carrying the direction so the exiting step reads it at exit time), the answer
rows stagger 70ms behind the question, and the progress fill runs on a spring.
Everything collapses to plain crossfades under `useReducedMotion`. Focus moves
to the incoming question's heading on every step change (effect, not rAF).
`popLayout` rather than `wait` is load-bearing twice over: the incoming step
mounts immediately (so the focus effect finds it — Round 32's element-timing
lesson) and the page never passes through a blank frame.

### 87.4 The wave, done the §85.2 way

The purple gradient band is **two purpose-drawn exports**
(`public/illustrations/consumer-diary/diary-wave-{desktop,mobile}.svg`, from
nodes `812:11077` / `792:6212`), each rendered at its own aspect ratio with
the viewport cropping — desktop floored at `max(100vw, 1281px)`. Nothing is
ever stretched, which is the whole "background weavy issue" fix. ⚠️ Both
exports (and the mascot) came out of Figma with **baked background plates** —
a `#F5F5F5` sizing rect plus the page-canvas rect — stripped in place; a
re-export will reintroduce them (Round 31's PNG lesson, now confirmed for SVG).

The mascot (`diary-mascot.svg`, node `812:11516` — the thank-you frame's
largest draw) is **one flattened export**, not five positioned layers: nothing
animates per-layer, and a mask/outline pair transcribed separately has drifted
three times in this project. Sized per screen: welcome 200/280px, thank-you
220/388px ("thank you screen avatar is a little bigger"). Its `#F3EFFF`
ground-ellipse stroke is artwork, not a plate — it disappears against the
flow's own `purple-50` canvas by design.

### 87.5 Tokens and layout

Four new fluid steps in `consumer-tokens.css`, all §85.1 clamps (anchors
375→1200, rem intercepts) and all registered in `cn()`'s font-size group:
`consumer-question` 20→40/500/1.4, `consumer-answer-name` 20→28/500/1.4,
`consumer-progress` 18→28/600/1.3, `consumer-unit` 18→22/500. The flow's
canvas is `purple-50` (the frames' own), not Home's warm radial.

**The question column's height calc must track the header's breakpoint:**
`ConsumerHeader` is 96px only at `min-[1200px]` — below that its tab row makes
it 157px, and a flat `calc(100dvh-96px)` pushed Back/Next 61px past the fold
at 375 (measured, then fixed with a paired `min-[1200px]:` calc).

### 87.6 Left open deliberately

- The X exit button discards answers without confirming — a confirm dialog is
  a product call for an audience note that says one action per screen.
- Answers are session state; a reload mid-flow starts over (all of this
  portal's state is in-memory).
- The welcome/thank-you screens keep the app's full `ConsumerHeader` (tabs +
  account) although frames `811:10934`/`812:11076` draw a Sign-Out-only
  header — one header treatment portal-wide beats a per-screen fork, and the
  question frames themselves draw the full tabs.
- Q5's frame unit reads "times"; the shared list stores it that way.

---

## §88 — Round 45: the sleep diary flow refined — a fixed-depth wave, a layered mascot, plainer questions, and the completed-diary card (2026-09-02)

**Frames:** `811:10934` (welcome, desktop), `816:12478` (thank you, desktop),
`818:12819` (Home's completed-diary card). Everything else in this round came
from direct instruction against the live page, so **this section is the spec**
for it — there is nothing to re-pull from Figma.

**Verification:** `tsc -b` / `oxlint` clean throughout; Vite `preview_logs`
clean; every change below measured live rather than eyeballed. ⚠️ **Not run:**
`design/layout-audit.js` on any of the three diary screens or the Home card,
and no Phase 3/4 review.

### 88.1 The wave: fixed height, fluid width

Round 44 rendered the desktop wave at `width: max(100vw, 1281px)` with
`height: auto`, so its **depth grew with viewport width** — 469px at 1281,
**703px measured at 1920**. At that depth the band swallowed the title block
and "Sleep Diary" plus its date line rendered as dark ink on deep purple.

The fix is `ConsumerWelcome`'s own anchoring, adopted here: **fixed height,
percentage width** ("its crest has to land a fixed distance below the header
regardless of how tall the viewport is... Horizontal is percentage-based so the
wave widens with the viewport, which is what a wave should do"). The band is a
368px-tall clip window at page y −64; the image inside is positioned by the
frame's own insets, flattened from its two levels:

```
band   100vw x 368, top -160 (page -64, less the 96px header)
image  left -22.63%, width 145.96%   (-289.9 .. 1579.8 of 1281)
       top -827px, height 1295px     (px, since the band height is fixed)
```

Deepest point of the shape now holds at **299px on every width** (measured at
1281 and 1920), with 153px of clearance to the title.

**Three findings worth keeping.**

1. **The frames' wave is not a new shape.** It is the same artwork exported
   untrimmed rather than cropped — the two exports' path data differ by exactly
   the filter-box origin (289.746, 828.018), verified before committing. The
   redesign is purely that the shape sits **64px higher**.
2. **The untrimmed export has no internal `clip-path` and carries
   `overflow="visible"`**, so its drop-shadow filter spilled far past the shape
   and the whole hero filled with lavender. The old 1281x469 crop clipped that
   internally; the band now does it in CSS. This is what "it looks broken now"
   was.
3. **The clip window is 470px, not the frame's 368.** The band is only a
   window and the image inside is pinned in px, so a taller window moves
   nothing — it just leaves the soft shadow the ~106px of room the old crop
   gave it. At 368 the clip lands 4px under the deepest trough and cuts the
   shadow off square.

The hero also gained `min-h-[calc(100dvh-157px)]` / `min-[1200px]:…-96px)]` —
the canvas is `purple-50`, so without it the app's warm `--background` showed
as a cream block under the fold. Same paired breakpoint the questions step
already used (§87.5).

### 88.2 The mascot is six layers, not one flat export

Round 44 shipped `diary-mascot.svg`, one flattened file (§87.4). Two things now
have to move independently — the steam, and the face — so it is composed:

```
ground ellipse  diary-ground.svg        (frame `816:12507`)
pillow          pillow-body / -face / -brows   ← the WELCOME screen's own
books           diary-books.svg         (Group 27)
book texture    diary-books-texture.svg (Group 25)
mug             diary-mug.svg           (Group 26, less the steam)
steam           diary-steam.svg         (Group 26's two `fill="white"` wisps)
```

**The pillow is the welcome screen's existing asset, proven rather than
assumed.** The frame's pillow export maps onto `pillow-mascot.svg` by a single
transform, checked on three independent paths to ±0.01px:

```
frame_x = 1.1694 * pillow_x + 9.711
frame_y = 1.1694 * pillow_y - 38.82
```

Folding in the frame's own −13.22 / −32.38 layer offset puts the export's
210.646 x 188 box at container (−3.509, −71.20) scaled 1.1694. So the diary
renders the *same three animated layers* the welcome screen does rather than a
second copy that would drift from it (direct instruction: "re-use the face
features in pillow here"). Layer boxes are **percentages of the frames' 263 x
145.5 mascot box**, so the whole assembly scales with the container and nothing
is re-derived per breakpoint. All six measured on target (container 274 x
151.6; ground −3.5/110.9; pillow −3.6/−74.2; books 156.1/47.4; mug 157.3/12.7).

The steam was split out of Group 26 **byte for byte** — its two `fill="white"`
paths given that group's own unmodified `<svg>` open tag, so it keeps the same
107.65 x 133.282 space and registers with the mug by construction (§84.2, and
the reason a mask and its outline have landed apart three times here).

**The avatar itself did not change.** The live flat export and the frames'
layers are the same pillow, ellipse, mug and books, differing only in export
scale (pillow 1.620x vs 1.169x, ellipse 1.967x vs 1.413x — same ratio). What
the frames change is its **rendered size**: an identical 263px art width on
both screens, which reverses Round 44's own direct instruction ("Desktop thank
you screen avatar is a little bigger", which put it at 388). Deliberate
reversal, commented at the call site.

### 88.3 Motion: measured before believing either report

- **"The avatar has no motion" was wrong, and right in effect.** Sampled over
  4s the pillow was animating across 13 distinct transforms — at **1.8%**
  (~4.6px), below the threshold where it registers. Raised to 3.5% plus a 3px
  float. Round 34's lesson, third occurrence.
- **Face expressions** ported from Home's `ConsumerMascot`: neutral →
  happy/curious on its own irregular cycle (3.5–7s neutral, 1.4s expression),
  brow lift, face lift, 4° head tilt. Values are **per cent, not Home's px** —
  this pillow renders ~2.4x the height of Home's 90px head, so copying pixels
  would have given a third of the movement. Home's fourth state, `asleep`, is
  deliberately absent ("no sleeping animation for this one").
- **Breath and tilt are separate nested boxes.** One element cannot scale-and-
  float the whole pillow while also rotating it about its base without the
  features fighting each other.
- **The steam is STATIC and at full opacity**, by two direct instructions
  ("keep opacity 100% else it wont be visible", then "keep it static, make it
  white increase opacity"). A vertical mask holds it solid to 70% and fades the
  top 30%. An earlier pass breathed it 0.5→1 and at 0.5 white-on-purple all but
  disappeared.

### 88.4 The questions: artifacts out, explainers in

Wording is **untouched** (direct instruction: "do not change questions. they
remain as is"). Only the paper-form bookkeeping went, because none of it can
mean anything on screen: `(minutes)` on Q1 and Q4, where a `min` label already
sits beside the input, and the `#5` cross-references on Q6 and Q7, which point
at a row number the consumer never sees.

New optional `help` on `SleepDiaryQuestion` — an 18px explainer under the
question, rendered through the existing `consumer-eyebrow` token (no new
token). On Q1–Q4 only; **Q5, Q8 and Q9 were called out as needing none**, and
help under an already-clear question is noise. Wired as `aria-describedby` on
both inputs, so someone tabbing straight into a field still hears it. The
researcher's Consensus Sleep Diary grid reads `label` and ignores `help`.

`max-w` on that line is **800px, not 720**: Q2's explainer measures 759px at
18px Inter, so the old clamp broke it one word early and orphaned "sleep."

### 88.5 Turn-taking emphasis, and why it is a stroke

The field belonging to whoever is being asked grows to **1.08** and takes a
**3px** border against the idle 2px. Both states keep the same full-strength
`consumer-primary` border colour and differ only in weight — fading the idle
border would put the field's only boundary at about **2.3:1**, under the 3:1 a
graphical indicator needs.

⚠️ A first pass filled the active field solid purple with white text and was
corrected: "when I said solid blue state, I ment the outline stroke not the
entire white field."

Which field is active is derived from **which answer is still empty**, not from
separate state, so it cannot disagree with the answers; once both are filled
neither is emphasised and the pair settles.

Two layout consequences, both found on a phone:

- **The scale cropped on mobile.** The field was `flex-1` and already filled
  the row, so centre-origin growth pushed it past the column and
  `overflow-x-clip` cut it off. Growth is now anchored **left** (`ACTIVE_ORIGIN`)
  and the fields carry fixed mobile widths (172 time / 136 numeric) that leave
  trailing slack. At 375 the active field ends at x=339 against a 351 column edge.
- **`scale` is a transform, so it does not reflow** — the `min` label stayed
  put and the enlarged field ran underneath it. The unit now translates by
  exactly `(1.08 − 1) x fieldWidth` (16.64px at `sm`+), derived from the real
  base width per breakpoint.

### 88.6 Exit confirmation

Closes §87.6's first open item. Reuses the shared `ConfirmDialog`, and sits
**outside** the questionnaire's `AnimatePresence` — a dialog owned by a step
block would be torn down mid-transition. Confirm is `destructive` (red,
measured **5.38:1** white-on-red from rasterised pixels). Focus enters the
dialog on open and returns to the X on cancel, verified live.

**`ConfirmDialog`'s footer is now full-width below `sm`** — an app-wide change
across **16 files** in all four portals. The wrapped, right-aligned pair of
mismatched-width pills was poor on a phone everywhere, not only here; from `sm`
the row is byte-identical to before. The `singleAction` text-link variant keeps
`self-end` so it does not stretch its underline across the panel.

### 88.7 Home's completed-diary card (frame `818:12819`)

Shell, fill, padding, radius, shadow and icon all unchanged; only the copy
differs, and the eyebrow label and CTA are absent. **Dimensions verified
identical in both states** — diary card 337 x 513, lesson card 744 x 513 —
because the card is `flex-1 self-stretch` and the row's height is the taller
sibling's either way.

⚠️ **`done` cannot be inferred from the health log**, which is the obvious
place to look and was the first pass. `healthLog()` seeds a `diary` on every
date it generates and its `endDate` is `'2026-07-22'`, which **is** `TODAY` —
so every dyad loaded with today's entry populated and the card showed
"Thanks for filling in…" before anyone had touched it. Caught by reloading to a
fresh store, not by reading the code. New `ConsumerDyad.diarySubmittedOn`,
stamped by `submitSleepDiary`, records the **submission event** instead and
leaves the seeded 18-date history the researcher and coach grids read
untouched. Stripping today's seed diary would have blown a hole in those tables.

### 88.8 Standing rule added: no orphans

Added to CLAUDE.md's frame-implementation table (Copy row): a heading or short
copy block must never leave a single word alone on its last line. `text-balance`
on headings and short paragraphs. **Check the rendered result at 375, 768 and
1281** — `balance` is width-dependent, so a line that balances on desktop can
still orphan on a phone. Applied to the question heading, the explainer and the
welcome/thank-you `h1`.

### 88.9 Left open deliberately

- **The steam has no motion at all** — the fade is the whole effect, per direct
  instruction. Animating the mask upward would give it rise without dimming.
- **`layout-audit.js` has not been run** on any diary screen or the Home card.
- **No Phase 3/4 review**, continuing the backlog.
- **`diary-mascot.svg` is now orphaned** — the flat export the layered mascot
  replaced. Left in place as the transcription source, the same call §78's
  `doodles.svg` took.
- Mobile and tablet keep Round 44's own wave export and mascot sizes; **no
  mobile frames were supplied** for any of this round's changes.

---

## §89 — Round 46: the consumer module's inner pages, and "My Modules" (2026-09-07)

Frames `818:12862` (welcome) and `819:13049` (video), file `s6OLTSd4nc9V9W9lT1oBTO`.
Summary and Reflection have **no frames** and ship as WIP screens. There are **no
mobile or tablet frames for any of the four**, so every value below `min-[1200px]`
is derived and is flagged as such at its call site.

### 89.1 New surface: `/consumer/:dyadId/module/:moduleId`

One page, four stages (`welcome → video → summary → reflection`) on `stage`
state, not four routes — the chassis `ConsumerDiaryPage` already established for
this portal's other multi-step flow.

Two additive `ConsumerShell` slots, both defaulting to today's behaviour so no
other page moved a pixel:

| Slot | Default | Why this page needs it |
|---|---|---|
| `showNav` | `true` | Both frames draw the bare wordmark + Sign Out header. A module is somewhere you are *inside*; leaving the portal tabs up invites wandering out of a video with no idea whether your place was kept. |
| `contentFullBleed` | `false` | Three surfaces are edge-to-edge in the frames — the photo band, the yellow bar, the white footer. The shell's `max-w-[1320px]` capped all three, so on a wide laptop each stopped 128px short of the window and read as a broken layout. A page that opts in re-applies the cap to its own *content* (`SHELL`), which is the pattern `OptedOutBanner` already used. |
| `showScrollCue` | `true` | **Added, then unused.** It existed because the footer was pinned and the cue landed on its CTA. Once the footer stopped being sticky (below) the collision went with it and the page returned to the default. The slot stays on `ConsumerShell` — one additive line, and the next page with a pinned bottom control will want it. |

**Nothing on these screens is sticky except the global header.** The module bar
and the footer were both built pinned first — `sticky top-24` and `sticky
bottom-0` — which is what frame `819:13049` looks like. Both were unpinned on
direct instruction ("dont make footer sticky", then "also dont make header
stickey", annotated over the yellow bar). The frame is an 886px artboard
clipping its own carousel behind a bar, not a design for a page that scrolls:
pinned, the footer permanently covered the bottom of the chapter row, and
between three fixed bands roughly a quarter of a short laptop viewport was
chrome. The page's `min-h-[calc(100vh-96px)]` column stays, so the footer is
still pushed to the bottom of the window on a short stage rather than floating
halfway up it — that was never the sticky positioning's job.

### 89.2 The photo band — one asset, and do not split it

**The photo and the yellow wave are a single Figma vector**: one torn-wave path
carrying the photograph as an image fill and `yellow/500` #FFB600 as a stroke,
exported as one PNG. It ships as one image for exactly that reason. This project
has shipped a mask sitting a few px out of register with the outline meant to
frame it **three times** (Rounds 30, 31, 34, §78.1), every time from
transcribing the two independently. Here they were never two shapes.

The cost, stated: the photo is baked in, so every module shows the same
photograph. That already matched the portal — `LessonCards` uses one shared
`lesson-cover.jpg` across all six cards. A per-module photo is a new Figma
export, not a code change. **Confirmed as the intended trade-off by direct
instruction before it was built.**

`public/illustrations/consumer-lesson/lesson-hero-wave.webp`, 2000x699. **This
repo's first WebP**, and the reason is arithmetic: the shape needs a real alpha
channel and a photograph with alpha can only be PNG or WebP — 1,976 KB optimised
PNG against **136 KB** WebP, in a repo whose largest asset was 196 KB. Alpha was
counted before shipping (273,342 fully transparent pixels), per Round 31's lesson
that a Figma RGBA export is often opaque over a baked plate.

Geometry, all relative to the clip window so it scales with nothing to re-derive:

```
window      aspect 1281 / (380 x SCALE),  capped at min(42vh, 480px)
image       width 104.70476% of the window  (1341.268 / 1281)
anchored    bottom, lifted 1.51043% of its own height
            (-93 + 465.962 = 372.962 against a 380 window -> 7.038px)
skew        -0.82deg, the frame's own
SCALE       1.6 / 1.25 / 1  at 0 / 640 / 1200
```

**Three findings here that a screenshot passed and a measurement caught:**

1. **A named breakpoint variant lost to an arbitrary-property one.**
   `[--wave-s:1.6] sm:[--wave-s:1.25] min-[1200px]:[--wave-s:1]` resolved to
   **1.25 at a 1680px viewport** — Tailwind v4 emits arbitrary-property
   utilities in a different order from named-breakpoint ones, specificity is
   equal, and source order decided it the wrong way. The band came out 623px
   deep instead of 498. All three are `min-[Npx]:` now. **Do not mix the two
   kinds on one custom property.**
2. **`HEIGHT_CAP = min(42vh, 480px)` is load-bearing on a real laptop.** A
   purely width-proportional band assumes the frame's 982px-tall artboard, where
   380 is 38% of the body. On a 1500x772 laptop the same ratio gives a **445px**
   band in a ~700px viewport and pushes the module name, its description and
   both CTAs below the fold — reported from a real machine, and a Figma artboard
   cannot show it because it has no viewport. Capping the *height* is safe in a
   way capping the width would not be: the image is bottom-anchored at a
   container-set width, so a shorter window crops the top of the photograph and
   leaves the wave curve pixel-identical. 42vh lands within 2px of the frame's
   own 380 at 1281x900, which is the check that it is not arbitrary.
3. `maxWidth: none` on the image, or Tailwind's preflight `img { max-width:
   100% }` clamps the deliberately oversized shape back to the window and
   flattens the curve. Same trap `ConsumerWelcome`'s `LAYER_STYLE` documents.

### 89.3 Focus: a callback ref, not an effect

The stage-change focus move was built first as `useRef` + `useEffect` keyed on
`stage`, and **measured dropping focus to `<body>` on every single transition** —
this project's most-repeated defect, six rounds. The cause is Round 32's lesson
one layer up: under `AnimatePresence mode="wait"` the incoming node mounts a
commit **later** than the state change, so the effect ran while the outgoing
stage was still the only thing in the tree, focused the old heading or nothing,
and never ran again.

A **callback ref** is keyed on the element, which cannot exist too early. React
invokes it synchronously when the heading attaches, whichever commit that is.
Re-measured after the fix: H1 on every one of the three stage changes, and
`<main>` (the shell's deliberate landing spot) on Finish.

### 89.4 Content is derived, the frames' episode copy is not placeholder

The frames are a template: the header says "Module 1: Understanding Sleep" over
chapters titled "How to Stop AI From Killing Everyone" and "Prediction for 2027".
Module identity is read from `CONSUMER_MODULES` at render time instead, so the
page cannot disagree with My Modules about which module it is.

**But the two frames' own episode copy was kept**, because it is real: "Why does
sleep feel impossible when you need it most?" is the question the supplied
script's intro opens on, and the sub copy naming "what sleep drive is and how
daily habits affect your nights" describes that script exactly. Only the module
header and the chapter titles were stock.

Chapters come from the real production script
(`BuildingBlocksOfGoodSleep_step4_script.docx.md`) — six, not the frames' seven,
because the script has INTRO + four chapters + CLOSE. **`startsAt` is derived,
not invented**: each chapter timed at 140 words/minute of narration plus 1.2s per
`[pause]` the script marks, giving 20:15 total. Replace with real timestamps the
moment the video is cut.

`data/consumerLessonContent.ts` is keyed by module **id**, not index — the
pre-module sits at index 0 and every "Module N" label is the index, so an index
key would silently point one module off the moment the curriculum gains an entry.

### 89.5 Divergences from the frames, and why

| Frame | Shipped | Reason |
|---|---|---|
| Welcome CTA "Continue" with a trailing chevron | **"Start learning"**, no chevron | Direct instruction. It is the one control in the flow that *begins* something rather than advancing through it, so it says what it does and does not borrow the footer's forward arrow. |
| Copy block and CTAs separated only by `justify-between` | `gap-16` as well | `justify-between` separates by whatever slack the viewport has left, and on a window where the band, title and a three-line description nearly fill the height there is none — the pill ended up directly under the last line of copy ("almost getting clubbed into the text"). The gap is a floor `justify-between` can add to but never eat into. 64 against the frame's own 120, which is what a 982px artboard could afford. |
| Continue 48 over Go back 40 | both **48** | Two stacked pills of identical width at two heights read as a mistake — the same complaint raised against Home in this round. |
| Chapter thumbnails: 7 stock photos of a man at a bookshelf | `lesson-cover.jpg` at `objectPosition: center 29.7%` | Direct instruction. The crop centre is `LearningTaskCard`'s own — a plain `object-cover` of a 666x1000 portrait into a 180x108 box lands on a shoulder. |
| Audio = music note, Transcript = quote mark | `Headphones`, `FileText` | Direct instruction: "use your own icons, figma is for reference only". `Headphones` says listen and `FileText` says read; a quote mark standing in for "a written version" is the wrong kind of clever for this audience. |
| Icons at 16px, lucide default stroke | **20px at stroke 2.25** | Direct instruction ("too small, thin"). A 2-unit stroke on a 24-unit grid rendered into a 16px box paints 1.33 device px, genuinely lighter than the 16/600 label beside it. |
| Go home fixed `w-128` | `min-w-32` + `shrink-0` on the glyph | This app's content needs ~130px; at a hard 128 the flex line overflowed and the `<svg>`, a flex item like any other, absorbed it by squashing. |
| Footer "Back" pill, `hidden` in the frame | stays hidden | Agrees with this portal's audience note: one action per screen. The browser's own Back still works. **Flagged as a product call, not settled.** |
| No chevrons on the carousel | left/right chevrons | Direct instruction. Black fill, white glyph, the thumbnails' own `2px 8px 16px rgba(85,85,85,0.4)` rather than the app's warm gold, which reads as a smudge on the purple panel (Round 30's call for the trainee sidebar). **Both stay mounted and go `aria-disabled`/`opacity-0` at the ends rather than unmounting** — Round 19.1's Critical was a chevron that dropped focus to `<body>` on unmount, and a control that never unmounts cannot. |
| Bar: title left, bar + % right, one row | **below 640**: icon-only Go home, then Module N / title / % / bar stacked beside it | Direct instruction, twice. The label becomes `sr-only`, not absent, so the accessible name and the 48px hit area survive. ⚠️ This portal's audience note argues against icon-only controls; a deliberate exception on instruction. |
| — | entrance animation on first mount | Direct instruction ("no motion transition to the welcome page"). Cause was `ConsumerShell`'s module-scoped `pageIntroPlayed` latch, added in Round 41 so tab switches do not replay a fade. Correct for tabs, wrong for a flow you enter. Fixed by dropping `initial={false}` on **this page's** `AnimatePresence` rather than unwinding the shell's latch, which would bring the flicker back on all four tabs. |

### 89.6 "My Lessons" -> "My Modules", portal-wide

Direct instruction: "we call them My modules, not my lessons, so update
everywhere". This overturns Round 43's own naming, and the frames corroborate it
— both say "Module".

Changed: the header nav label, the page title, "Module of the week", "6 modules
in total", "Previous weeks' modules", the empty state, both card CTAs ("Play
module" / "Resume module"), "Module complete" in two places, "This week's
module" / "Complete this week's module", and `LessonView.label` (`Module N`),
which is the single field every surface reads.

**Internal identifiers deliberately keep "lesson"** — `LessonCards`,
`LessonView`, `releasedLessons`, `lessons.ts`, the `/learning` route. They are
code, not copy, and renaming them is a large diff with no user-visible effect:
the same call this project already made for `ConsumerDyad`/`dyadId` under the
consumer/client rule.

### 89.7 Two Home fixes bundled in

- **Button heights unified at 48.** Measured on Home, the three task-card CTAs
  were **56 / 48 / 48** ("Resume module", "Fill in sleep diary", "Join video
  call") in a row of identical cards, with the coach card's "Read More" a fourth
  value at 44. `LessonPlayCta` moved `h-14` -> `h-12` and `CoachCard`'s control
  `h-11` -> `h-12`; all four now measure 48. A deliberate divergence from frames
  `792:2310`/`786:4179`, since 48 is what everything else in the portal uses.
- **The demo state cycler is gone.** Home's Play control walked
  start -> resume -> complete on every click, with the resume bar pinned to a
  hardcoded `DEMO_PROGRESS = 143/264`. Both now come from `releasedLessons` and
  the control is a real `<Link>`. What that costs: Home shows only the state the
  demo dyad's Module 4 is genuinely in — the other two are still reachable on My
  Modules, which renders every released module in its own real state.
  `LessonPlayCta` gained a `to` prop and renders an `<a>` when it has one,
  because a button calling `navigate()` breaks middle-click, open-in-new-tab and
  the status bar.

### 89.9 Verification

`tsc -b` and `oxlint` clean (16 pre-existing `only-export-components` warnings,
none in this round's files). Vite `preview_logs` clean — a green typecheck is
still not proof the app builds (§Round 23). Console clean **in a fresh tab**, per
Round 32's retained-buffer lesson. `design/layout-audit.js` **empty on every
stage at 1500, 1400, 1281, 768 and 375**, both card faces included, with `documentElement.scrollWidth === innerWidth`
at every width. Contrast rasterised through a 1x1 canvas (Tailwind v4 emits
`oklab()`, so parsing the computed string as RGB returns nonsense — Round 31):
14 measurements across the new surfaces, **lowest 8.61:1** (the active chapter
title, `consumer-primary` on `purple-200`), everything else 11:1 or better.

### 89.10 Direction-aware chrome

Direct instruction: the module bar comes back on scroll **up**, the footer comes
in on scroll **down**. This is the resolution of the two reversals above rather
than a third position — pinned permanently ate a quarter of a short laptop
viewport, unpinned left a long page with no way out and no way on without
scrolling to an end. Each band is now present exactly when you are heading
toward what it does.

`sticky` + `translateY`, not `fixed`: `fixed` takes both bands out of flow and
the content then needs top and bottom padding equal to two heights that change
with the viewport — a measurement to keep in sync, which is how spacing drifts.

Rules, in priority order:

```
page does not scroll  -> both visible
at the top            -> bar visible, footer hidden
at the bottom         -> footer visible, bar hidden
scrolling up          -> bar visible, footer hidden
scrolling down        -> bar hidden, footer visible
arriving at a stage   -> both visible, until the first scroll
```

The two end rules are not the direction rules restated: you can arrive at the
bottom while scrolling down and then rubber-band, and without them the footer
would flick away at the moment you reached the thing it offers. The arrival rule
exists because deriving the initial state from scroll position hides the footer
on a screen nobody has scrolled yet — the reader lands on a page whose only way
forward is off-screen. `DIRECTION_THRESHOLD = 8` is measured against an anchor
set at the last flip rather than the last event, so a slow drag still
accumulates; without it single-pixel momentum jitter flips the bands.

**⚠️ The transition property is `translate`, not `transform`, and getting it
wrong is silent.** Tailwind v4 emits `translate-y-*` as the standalone CSS
`translate` property. `getComputedStyle(el).transform` reads `none` on an
element that is visibly offset, while its `translate` carries
`0px calc(-100% - 96px)`. A first pass declared the transition on `transform`,
so the class toggled, the band moved to the right place, and it **teleported** —
a transition on a property that never changes. Only reading both properties back
catches it. Verified after the fix by sampling mid-flight: 70ms into a flip the
bar's bottom edge measured 33px against 0 hidden and 177 shown.

The bar is `-translate-y-[calc(100%+96px)]` rather than `-100%`: its own height
parks it *behind* the 96px global header but still inside the viewport, where
its drop shadow bleeds out from under the white bar.

Neither band is `aria-hidden` while hidden. The bar holds the only Go home and
the footer the only Continue, and a screen-reader user has no scroll direction
to bring them back with — only their paint moves.

### 89.11 Summary screen and the flip cards

Frames `882:2067` (screen + card front) and `900:2244` (card back). Content is
the supplied `BuildingBlocksOfGoodSleep_activities_v2.md`.

**The cards are the doc's own "CHAPTER SUMMARY CARDS"**, four of them, one per
numbered chapter. The frame draws three identical cards all reading "01 / The
Building Blocks of Sleep" — one card duplicated as a layout study. The screen's
lead paragraph is the doc's MODULE CORE MESSAGE quoted verbatim, which is also
what the frame prints; the frame's trailing "Clikc on each of the cards below
to" is a typo and an unfinished sentence, so it is finished here.

**Titles come from `chapters`, not from the card data** — a `chapterId` lookup,
so this screen and the video carousel cannot name the same chapter two ways.
That is also why the doc's own casing ("Waiting Until You're Sleepy") is not
carried: the chapter list already settled on sentence case with contractions
spelled out. Bullet *bodies* stay verbatim — author's production copy, not UI
chrome — so contractions live inside a card and not in its title. Deliberate.

**The three UI styles** are three hand-drawn pillow vectors
(`902:2341`/`902:2348`/`902:2355`), each at its own size and rotation, committed
as SVGs and cycled across the four cards. Each width is a share of the card's
356px inner width rather than a px value, so it scales with a fluid card.
Rotation is the frame's; the -0.82deg skew is one shared constant, the same tilt
the hero wave carries.

**Grid stack, not an absolutely positioned back.** Both faces occupy one grid
cell, so a card is as tall as its taller face and **nothing reflows when it
turns**. Front-in-flow with `absolute inset-0` behind would size the card to the
front alone, and these backs are taller than their fronts (609 against 553 in
the frames), so every flip would resize the card mid-rotation.

#### The card-height thread, and the four shapes it went through

Getting the cards down took five rounds of direct instruction. The rejected
shapes are recorded because each is individually reasonable and would otherwise
be re-attempted.

| Shape | What it produced |
|---|---|
| Panel sized to content | 878px cards at three across. |
| Panel `h-70` + `mt-auto` footer | Slack landed as a **gap between the panel and Download resource** — annotated as dead space. |
| Panel `min-h-70 flex-1` | The same slack moved **inside** the panel: a 420px box holding 300px of text, reported from a real laptop as a large empty pale box. |
| Panel content-height + `items-start` | Every card its own size, so no dead space anywhere — but `layout-audit.js` flagged `grid-row-uneven-heights` (684 / 635 / 710 in one row). That check is calibrated to zero false positives here, so it was treated as a finding rather than loosened. |
| **Shipped:** one fixed panel height per breakpoint, footer not `mt-auto`, cards stretched to a shared row height | Slack falls **below Download resource**, where it is just more of the card's own fill. |

Panel heights step with the breakpoint — **200 / 260 / 300** — because a phone
card is narrow enough that its title and lead wrap to six lines before the list
starts, so one value cannot serve both ends. Direct instruction: "I dont want to
see cards with a lot of height on tablet and mobile view."

#### Four more fixes from a full-viewport sweep

Sweeping 320 → 1920 rather than checking three widths found three things a
spot-check missed, all in the single-column band:

1. **The card filled the whole content column** — 1151px wide at 1199, 976 at
   1024. A reflection card that wide is not a card. The list is
   `max-w-[560px] mx-auto` while there is one column, released at 1200, so a
   card reads at roughly the same size in either band.
2. **The artwork grew with it.** Sized purely as a share of the card's inner
   width, the pillow rendered ~1000px across at 1199 and the *front* became the
   tallest face on the page — card heights of 833 / 730 / **951** / 833 behind a
   280px panel. `PILLOW_MAX_W = 340` (just above the frame's own 324 at its
   404px card, so the desktop layout is untouched) clamps it.
3. **The three pillow aspects made cards unequal.** 324x248, 353x207 and
   317x296 sized by width alone left style 3 rendering 343px tall against style
   2's 217, so card 3 ran 14px taller than its neighbours. `PILLOW_MAX_H_VARS`
   (180 / 220 / 260) caps the height too; CSS scales a replaced element
   proportionally when both a width and a `max-height` bind, so aspect survives
   and only the largest shape moves.
4. **`useEqualHeaders` replaced a hardcoded header reserve.** A `min-h-38`
   applied only at 1200+ was right for one width and one set of titles: it
   over-reserved 32px on two desktop cards and did nothing on a phone, where
   card 4's title wraps an extra line and its card ran 23px taller (552 against
   529 at 320). The hook measures the tallest header in the set and publishes it
   as `--card-hdr-h` on the list. Two details are load-bearing — it measures an
   **inner** element, because measuring the box that is itself being inflated by
   `min-height` reads the inflated value back and never settles; and it observes
   **every header**, not just the list, because a webfont swapping in reflows
   text inside a box that never resizes, which is exactly when a title gains a
   line.

`PILLOW_SCALE_VARS` shrinks the front artwork to 0.66 / 0.8 / 1 across the same
breakpoints. Scaling the **width** is what reduces the height: each vector is
sized as a share of the card's inner width with `height: auto`, so its aspect
does the rest and the three shapes stay in proportion to one another.

#### The lead copy, and the pillow stroke

The bold line under each card's title is capped at **two lines** (direct
instruction), which at the 371px desktop card is roughly 65 characters —
measured, not estimated: 88 characters wrapped to three. All four leads went
from 133-171 characters to 56-63, and all four now render on two lines at
desktop and one at 560. Copy is in `ux-copy.md`.

**No em dashes anywhere in copy** (direct instruction, and it restores the
app-wide sweep Round 17.1 ran). Two bullets kept theirs from the source doc and
now use a colon; one `aria-label` did too.

The committed pillow SVGs carry a **hand-added `purple-300` centred stroke**
that the Figma exports do not. Adding it meant growing each file's `viewBox` and
intrinsic size by the stroke width, because a centred stroke sits half outside
the path's bounds and an `<img>` clips to the viewBox — without that the outline
is shaved flat on every edge. `PILLOW_STYLES`' widths are the post-stroke
intrinsics (324.265 -> 330.265, 353.16 -> 359.16, 317.237 -> 323.237), which
keeps the pillow itself the size the frame drew it. **A re-export drops both and
they must be reapplied together**, the same trap as the confetti transparency.

#### Hover

Hovering or focusing a card's front swells its pillow by 1.07 and nothing else
moves. It is a `scale()` composed into the artwork's own transform — the image
already carries a rotate and a skew, so a Tailwind `scale-*` utility would
replace them rather than add to them, and a transform is painted rather than
laid out, so the card's height and the grid's tracks cannot react. Measured:
0.999 -> 1.069 -> 0.999 with card height and row tops unchanged throughout.

**⚠️ Driven from React state, not CSS `:hover`.** The first pass used
`motion-safe:hover:[--pillow-hover:1.07]` and Tailwind emitted **no rule at
all** — verified by walking every stylesheet for the property name and finding
zero matches, while the class sat in the DOM and setting the variable by hand
scaled the image correctly. Arbitrary *properties* work here unprefixed or under
`min-[Npx]:` (`--pillow-s`, `--wave-s` both do); stacked under
`motion-safe:hover:` they do not. `onMouseEnter`, not `onPointerEnter`: the
pointer events never fired under automated hover.

#### Measured, every viewport

All four cards identical, panels identical and top-aligned, `layout-audit.js`
empty and `scrollWidth === innerWidth` at every row:

| viewport | cols | card w | card h | panel |
|---|---|---|---|---|
| 320 | 1 | 272 | 552 | 200 |
| 375 | 1 | 327 | 484 | 200 |
| 414 | 1 | 366 | 484 | 200 |
| 639 | 1 | 560 | 439 | 200 |
| 768 | 1 | 560 | 500 | 260 |
| 1024 | 1 | 560 | 501 | 260 |
| 1199 | 1 | 560 | 501 | 260 |
| 1200 | 3 | 331 | 590 | 300 |
| 1512 | 3 | 371 | 590 | 300 |
| 1920 | 3 | 371 | 590 | 300 |

Against the starting point: **878 -> 590** at desktop, **880 -> 484** at 375,
**951 -> 501** at 1199. The front face is never the taller of the two at any
width, the artwork stays inside its card, and "Click to flip" stays visible.

(Heights above are from the sweep that closed the geometry; the lead-copy and
stroke passes after it took desktop to **545** and 375 to **461**, with the same
uniformity at every row.)

⚠️ **Two measurement traps, both instrument rather than app.** A probe that
grouped cards into rows by `Math.round(getBoundingClientRect().top)` reported
`cols: 1` at desktop while the grid was demonstrably `370.664px x 3` — negative
tops become string object keys and sort after integer-like ones, so
`Object.values(rows)[0]` returned the second row. And **programmatic
`element.focus()` dispatches no focus event in this harness**: `activeElement`
was correct, listeners on `focus` and `focusin` never fired, and the focus-raise
looked broken. A real OS Tab press proved it works. Read
`gridTemplateColumns` and the raw rects before believing a derived count, and
use real key presses before believing focus is broken.

#### The scroll hint

Not a Show more toggle — direct instruction ("it should not [be] show more or
show less. It should be a scroll detector, scroll to see more"). An expand
control was built first and replaced.

It lives **inside** the scroll panel, `sticky bottom-0` (also direct
instruction), with negative side margins bleeding its `purple-50` fill to the
panel's edges. The panel carries `pb-0` and the list inside supplies the bottom
padding: a `sticky bottom-0` child aligns to its container's **padding** box,
not its border box, so a `pb-4` on the panel leaves a 16px band underneath the
hint where the scrolling text shows through.

**It is a real button that scrolls the list**, because as a plain div it read as
clickable and clicking it flipped the card — the back's background handler only
spares `button, a`. Reported exactly that way. It is `aria-hidden` +
`tabIndex={-1}`, a pointer-only affordance: the panel itself is a focusable
region an AT user can arrow through, so a button duplicating that is noise. And
it is `h-9`, the app's floor — `layout-audit.js` caught it at its natural 17px.

Visibility is measured, on scroll and via a `ResizeObserver` watching **both the
panel and the list inside it**: the panel's own box can hold still while its
content reflows (a webfont swapping in), and observing only the panel misses it.

#### Flipping back

The visible "Flip back" pill was removed on instruction; **clicking anywhere on
the back** turns it over. Two guards: not on a `button, a` (Download resource
and the scroll hint live there), and not on a drag — pointer-up compared against
pointer-down, ignoring anything past 6px, so scrolling the list or selecting a
line to read it does not throw the reader out of the card.

The back cannot be a `<button>` like the front is, since it contains buttons, so
this is a click handler on a div. Keyboard parity comes from an `sr-only` "Flip
back to the front of this card" button plus Escape while focus is on that face.
The instruction was to remove the button, not the route back.

**⚠️ `inert` takes a boolean in React 19, and `inert=""` is falsy there.** The
first pass wrote the React 18 form with a `@ts-expect-error` (older React types
lacked the prop) and the attribute never reached the DOM — `hasAttribute('inert')`
returned `false` on a face already carrying `aria-hidden`. Every hidden back's
Download and Flip back controls were tabbable. React 19's types declare
`inert?: boolean`, so the suppression comment was also hiding the compiler saying
so. Re-measured after the fix: all four backs inert at rest, front inert once
turned.

Flipping **moves focus** (front button -> back title, and back), because the
control that was clicked turns away. An effect is safe here where it was not for
the page's stages: both faces are always mounted, so the target exists when the
flag changes.

The front is a `<button>` covering the whole face; the back is a `div` with its
own controls, because a button inside a button is invalid and the back carries
Download resource and the scroll hint. "Download resource" is an `aria-disabled`
control with an `sr-only` "(coming soon)" — no resource exists yet.

The grid went three across -> two across -> three across, all on direct
instruction. Two across was an attempt to cut card height; the height turned out
to come from the panel stretching rather than from the column count, so three
returned once that was fixed. The single-column band reaches all the way to
**1200** rather than stopping at 640: at 768 two columns give a 348px card,
narrower than the phone's own single-column card, so the "tablet" layout was
worse than the phone one and was reported as broken.

Three divergences worth recording: the card title uses `consumer-card-title`
(28/500 at desktop) rather than the frame's `display-md` 32/500/-0.374, because
this portal's own card-title step moved to 28 and dropped its tracking in §85 and
these are card titles; the module bar's progress bar sits **beside** the "%
complete" caption at every width, after a pass that put it below on mobile — on
its own line near the band's lower edge a full 100% bar read as a second rule
under the band ("the lower stroke becomes progress bar"); and "Download
resource" keeps a full-strength fill rather than being dimmed, since the
`sr-only` "(coming soon)" is what marks an unwired control and dimming only
costs contrast (Round 28).

The footer gains a **Go back** beside Continue from Summary on (frame
`882:2185`). The video screen keeps its single action, which is its own frame's
`hidden` Back pill being specific rather than inconsistent.

The frame's 75px `#d9d9d9` square becomes a lucide `NotebookPen` in
`consumer-primary` with no badge — Home's own `CardIcon` precedent (§88), per
direct instruction ("add icon blue coloer as you did in home page").

**⚠️ Naming collision, flagged not resolved:** this screen is headed "Module
reflections" (the frame's own words) while the *next* stage is the Reflection
screen, whose five multiple-choice questions are in the same doc under
"REFLECTION QUESTIONS". Two consecutive screens both called reflection. The
frame is explicit so its wording ships, but this wants a product call — the
doc's own name for these is "chapter summary cards".

### 89.12 Close-out sweep

Removed rather than left: `LessonPlayCta.onClick` (its only caller was Home's
demo state cycler, replaced by a real link in this round, so it was a second
unused way to wire one control), and `export` on `MODULE_EPISODES` /
`MODULE_INTROS`, which only `moduleLesson` reads. One genuinely **stale comment**
was corrected in place rather than deleted: `LearningTaskCard`'s note still
described `DEMO_PROGRESS` as the live source of both progress figures and
claimed the card reads "~7 mins left", when both now come from
`releasedLessons`.

Verified across the whole portal — Home, My Modules, sleep diary, Need Help, My
Profile, and all four module stages including every card flipped: `layout-audit.js`
**empty on all ten surfaces**, no horizontal scroll on any, **zero occurrences of
"lesson"** in rendered text, **zero em dashes** in rendered text, and focus on a
real heading (never `<body>`) at every stage change. `tsc -b` clean; `oxlint` 16
warnings, all the pre-existing `only-export-components` ones and none in a
consumer file. No orphaned exports in `components/consumer`, and every committed
`consumer-lesson` asset is referenced.

### 89.13 Portal-wide type sweep

Direct instruction: "match what we have decided on home + other pages. Use
consumerhome as the basis, and streamline all pages for consumers including
sleep diary and module pages."

**Home is the scale**, measured off the live page:

| px / weight | token | role |
|---|---|---|
| 40 / 500 | `consumer-display` | page title |
| 28 / 500 | `consumer-card-title` | card title |
| 22 / 500 | `consumer-heading` | section heading |
| 20 / 500 | `consumer-lead` | lead line, panel title |
| 20 / 600 | `consumer-lead`/`consumer-lesson` + semibold | emphasised figure, number above a title |
| 18 / 400 | `consumer-eyebrow` | eyebrow, sub copy |
| 16 / 600 | `body-md` | button, pill label |
| 16 / 400 | `body` | body text, caption |

**Nothing below 16, and nothing above 600.** That is the finding the sweep turned
on: the portal's own scale has no 14px or 12px step and no bold, so any of those
is app-scale leakage rather than a decision.

Seven violations found by dumping every rendered `(font-size, weight)` pair on
every consumer surface and diffing against Home:

| Where | Was | Now |
|---|---|---|
| Summary card number "01" | `text-[24px] font-bold` (24/700) | `consumer-lesson font-semibold` (20/600) — the same treatment the module welcome gives "Module 4" |
| Summary card bullet emphasis | `font-bold` (700) | `font-semibold` (600) |
| Scroll hint | `caption-medium` (14/500) | `body-md` (16/600) |
| Module bar "% complete" | `caption-medium` (14/500) | `body` (16/400) |
| Carousel chapter titles | `caption-medium` (14/500) | `body` (16/400) |
| Carousel timestamp badges | `fine font-medium` (12/500) | `body-md` (16/600) |
| Need Help page | `display-lg` + `sub-greeting` (app tokens) | `consumer-display` + `consumer-lead` |

**My Profile was the biggest offender** and had never been migrated — a Round
6.2.1 page still entirely on the app scale: a 32px title against Home's 40,
`text-title`, and 14s and 12s throughout. Its page-local type is now on the
consumer scale.

⚠️ **Three shared components initially kept their 14s**: `PersonCard` (from
`SpacesCoachProfilePage`), `NotificationPreferencesCard` and
`PasswordChangeCard`, all rendering in other portals too — 17 sub-16 nodes, all
on My Profile. **Resolved in §89.14 on the next instruction**: `PersonCard`
moved to the Consumer Portal (it had no other caller at all), and the other two
took a `variant` prop. Left here as the trail, since the reasoning for stopping
at the portal boundary was wrong and the correction is the interesting part.

Verified after: every module stage and every portal page reads only from the
table above, `layout-audit.js` empty at 375 / 768 / 1512, no horizontal scroll,
and the summary cards still uniform at each width (545 / 455 / 440).

### 89.14 Consumer Portal made internally consistent

Direct instruction: "make consumer portal consistent, regardless of what has
been extracted from researcher portal, make sure the UI is consistent in
consumer portal." The §89.13 type sweep had stopped at the shared-component
boundary and flagged it; this went through it.

**`PersonCard` moved, because the sharing was fiction.** It was exported from
`SpacesCoachProfilePage` and imported across the portal boundary by
`ConsumerAccountPage` — but a grep found exactly two render sites and both were
that consumer page. No researcher or coach surface had used it for some time. So
it was a researcher-styled component with only a consumer caller, which is
precisely why My Profile was the last consumer page showing 14px labels, app
purple and 36px controls. It is now
`components/consumer/ConsumerPersonCard.tsx` on this portal's own values, and
the original was **deleted** (133 lines) rather than left behind — a shared
component nobody shares is a second copy waiting to drift. The researcher file
keeps a comment saying where it went.

**The two genuinely shared cards took a `variant` prop instead.**
`NotificationPreferencesCard` (3 portals) and `PasswordChangeCard` (2) each got
a `TONE` table and `variant?: 'app' | 'consumer'`, defaulting to `app`. Same
pattern as `viewerRole` on `SessionTracker` and `ProfileDetailsSections`: one
component, one behaviour, surface values chosen by who is looking.

| | app | consumer |
|---|---|---|
| title | `text-title` 20/500 | `consumer-heading` 22/500 |
| body / labels | `caption` 14, `fine` 12 | `body` 16 |
| buttons | `caption-medium` 14, `h-9` | `body-md` 16, `h-12` |
| brand | `primary` #4a278f | `consumer-primary` #3a00ad |
| focus ring | `ring-ring` | `ring-consumer-primary` |
| button shape | `rounded-full` / `rounded-sm` | the portal's 28px pills |

**My Profile lost its hero band.** It was the only consumer page using the
shell's `hero` slot, which paints `bg-pearl` — the app's *cool* grey — across
the top of a portal whose canvas is the warm `consumer-canvas`. Every other page
here puts its title straight on the canvas. The band is gone and the title sits
where Home's does.

Also swept: the page's own `bg-primary`/`text-primary`/`border-primary`/
`ring-ring` to consumer equivalents and its controls 36 -> 48; the compact nav
tab row (14 -> 16); the opted-out banner (14 -> 16); Home's "~N mins to
complete" caption (14 -> 16); and `hover:bg-pearl` -> `hover:bg-purple-50` in
the header, its account menu and `ScrollCue`, since pearl is the cool grey the
temperature rule warns about.

**`--text-consumer-chip`'s floor moved 14 -> 16.** It clamps 14 -> 18 from
frames `787:1516`/`787:1449`, so on a 375px screen the "Module complete" chip
bottomed out at 14 while every label around it held 16 — the last sub-16 text in
the portal, and a hole in the floor the scale is supposed to have. The frame's
14 loses deliberately: the floor exists because of this portal's audience note,
and 2px on one chip is a better trade than a scale with an exception. Recomputed
with §85.1's own clamp formula.

**Verified.** Across Home, My Modules, the diary, Need Help, My Profile and all
three built module stages, at 375 / 768 / 1440:
`layout-audit.js` empty, no horizontal scroll, **zero off-scale type** (nothing
under 16px, nothing over weight 600) and **zero app-brand purple** — the only
`#f5f5f7` left anywhere is `border-parchment`, the `Card` component's own
default stroke.

**The other portals are untouched, measured not assumed.** The researcher
account page still renders the shared cards at 20/500 titles, 14px labels, 36px
`pearl` buttons and app purple; the coach profile page renders and its tabs work
after the deletion. Its `layout-audit.js` findings there are pre-existing —
`git diff` on that file is 133 deletions and a 10-line comment, nothing else —
and one of them (`control-not-filling-wrapper` on a checkbox) is the documented
false positive from Round 36.

### 89.15 Left open

- Reflection is a WIP screen awaiting its frame. Its content is already known —
  the activities doc's five multiple-choice questions.
- At three across the cards measure ~850px tall, because the back was drawn
  against a 468px card and three columns at 1400 give ~397. The fronts carry a
  lot of empty purple below the pillow as a result. Shorter cards mean either
  two across on desktop or smaller body text on the back; both are product calls.
- Audio and Transcript are real single-select toggles with pressed states but do
  **not** change the panel — direct instruction: "for now make them functional,
  i.e. add interactive states, but do not wire them. I will share the UI for
  each." Built as `aria-pressed` toggles in a `role="group"`, **not**
  `role="radiogroup"`, which carries a roving-tabindex and arrow-key contract
  this project has already shipped unimplemented once (`WeekdayPicker`, fixed in
  Round 14.5).
- Five of the six modules have no episode content, so their cards' Play control
  is a plain button that does nothing rather than a link into an empty player.
- `CONSUMER_MODULES[4]` is still titled "Daytime habits that support sleep"; the
  supplied script's own heading is "Building Blocks of Good Sleep". Both describe
  the content accurately and renaming was not asked for, so the curriculum name
  stands — a one-line change if the script's title should win.

---

## §90 — Round 47: the consumer module's reflection activity, and three summary-screen corrections (2026-09-07)

Frame `910:2367` ("Module page template"), plus a run of direct instructions
arriving mid-turn, several as freehand annotations over the live page. Content
is the supplied `BuildingBlocksOfGoodSleep_activities_v2.md`.

This closes the fourth and last stage of `/consumer/:dyadId/module/:moduleId`.
§89 is still the spec for the other three.

### 90.1 The activity

`components/consumer/ModuleReflection.tsx`, rendered by a new `ReflectionStage`
in `ConsumerModulePage` that replaces the `InProgressStage` placeholder (that
component is now deleted, along with its `Hammer` import).

One question at a time inside one card. The card is the frame's `#f3efff` on a
`#f5f5f7` stroke with the Card shadow at 16px radius — **every hex in this
frame already had a token**: `purple-50`, `purple-200`, `purple-300`,
`parchment`, `ink`, `ink-muted`. No new tokens this round.

| Region | Value |
|---|---|
| Panel | `bg-purple-200`, 32px/40px inset (24/32 below 768) |
| Progress row | 5 segments, `w-10 h-2`, `rounded-[16px]`, 8px gap |
| Question | `consumer-card-title` (22 -> 28 / 500), `ink` |
| Sub | `consumer-eyebrow` (16 -> 18 / 400), `ink` |
| Answer pill | `min-h-12`, `rounded-[28px]`, `body-md`, 24px trailing mark |
| Card nav | `min-h-12`, `rounded-[28px]`, black not purple |

### 90.2 Five things the frame does not say, all direct instructions

1. **Multi-select.** The frame's own sub copy says "Choose one or more options",
   which the doc's one-of phrasing does not. `aria-pressed` toggle buttons in a
   `role="group"` — the §89.15 call again, not `role="radiogroup"`, whose
   roving-tabindex contract this project has shipped unimplemented once already.
2. **No Go back on the first question, no Next on the last.** The card never
   shows a control that would land you outside it; leaving is the module
   footer's job.
3. **Next is inert until the question has an answer**, and **Finish until every
   question does.** Both `aria-disabled`, not `disabled`, so the control a
   reader is waiting for stays findable and says why.
4. **The pips are a progress bar, not a stepper** — every segment up to and
   including the current one stays solid, so the row fills. 8px tall, down from
   the frame's 10.
5. **Below 1200 the card's nav fills the row and splits it evenly, aligned
   left**; at 1200 and up it is the frame's two 136px pills on the right.

### 90.3 Four defects found by measuring

- **`flex-basis: 0` resolves against the content box**, so Go back's 1px outline
  made it 2px wider than a borderless Next: 135.5 against 133.5 at 375, with
  `flex-1` and `min-w-0` on both. `border border-transparent` on the filled pill
  equalises the boxes; measured 134.5 / 134.5 after. Invisible in a screenshot
  and the exact thing "equally divided" was asking for.
- **The frame's own 136px width wraps its own label.** 136 less 40px of padding,
  a 16px gap and a 16px chevron leaves 64px; "Go back" needs ~66 at 16/600. It
  is a `min-w` here, with `whitespace-nowrap`; measured 137.5 at 1440.
- **The disabled Finish failed AA at `/55`.** Rasterised over the footer's white
  (Tailwind v4 emits `oklab`, so the computed string is not RGB): 55% paints
  `rgb(147,115,210)` and the white label lands at **3.73:1**. `/65` paints
  `rgb(127,89,202)` at **5.02:1**. The card's own disabled Next is `bg-ink/60`
  on `purple-50` at **4.96:1**.
- **A block comment in a JSX attribute list.** The `continueBlockedReason`
  expression was first written inline with a `/* … */` above it, between two
  attributes. `tsc -b` passed and the page rendered, but the prop never reached
  the component — the gate simply did not apply. Lifted to a `blockedReason`
  const above the JSX. This is §Round 23's trap in a second form: a comment in
  an attribute position is not safe here even when nothing turns blank.

### 90.4 Motion, and the focus that goes with it

The question block uses the sleep diary's own `stepVariants` / `riseVariants`
verbatim (§87.3): the block slides 64px in the direction of travel on a spring
while its children rise a beat behind it on a 0.07 stagger, collapsing to a
crossfade under reduced motion. Direct instruction was to match what the portal
already does, and the diary is this portal's other one-question-at-a-time flow.

Direction comes from a **ref compared against the incoming index during render**,
not state — state would need a second render to be right, and the exiting block
reads the value at exit time through `custom`.

The clip around it is `overflow-x-clip` with `-mx-1 px-1`: `clip` leaves the
vertical axis visible where `hidden` would not, and the 4px buys back what an
option pill's `ring-offset-2` focus ring needs at the column edges.

**Focus is load-bearing rather than decorative here.** The question `<h2>` takes
focus on every change through a callback ref keyed to the element, skipping the
mount that arrives with the stage (that one belongs to the stage's `<h1>`).
Without it, pressing Next on question four unmounts the button under the cursor
that pressed it — the focus-to-`<body>` defect this project has shipped in six
rounds. Measured `H2` at every one of the five steps, `activeElement !== body`.

### 90.5 Content

`MODULE_REFLECTIONS` in `data/consumerLessonContent.ts`, keyed by module and read
through `moduleReflection()`, so a module with no questions cannot render a flow
with nothing in it. Five questions, the doc's own, with three conventions
applied on the way in and nothing else reworded:

1. Contractions spelled out ("there's" -> "there is", "I'm" -> "I am").
2. No em dashes; two questions carried one and are repunctuated, not reworded.
3. Q3's prompt has no main clause in the doc ("In the afternoon, and you sit
   down for a minute") and is written as "It is the afternoon, and you sit down
   for a minute".

Verified on the rendered stage: **zero em dashes, zero en dashes, zero
contractions**, and the only `(size, weight)` pairs present are 16/400, 16/600,
18/400 and 28/500 — all on §89.13's table.

### 90.6 Three summary-screen corrections, bundled

- **"Module reflections" -> "Module summary"**, and its icon `NotebookPen` ->
  `BookOpen`. Both had to move together: `NotebookPen` is this app's reflection
  mark across all four portals and reflection is now a real stage one screen on,
  so two stages would have shared one glyph and one word.
- **New intro copy**, supplied directly, with "summaries" -> "summarise" and
  "listened" -> "listened to". Its first sentence is still
  `episode.coreMessage`, read from the data so it cannot drift from the cards it
  describes.
- **"Click to flip" -> "Tap to flip" below 1200**, on the cards and on that
  intro line's verb. Two spans with one `display: none` rather than React state:
  CSS-hidden text is excluded from the accessible name, so the button announces
  the verb on screen, and there is nothing to keep in sync with a resize. Same
  device split gives the footer "Finish" below 768 and "Finish module" above it.

### 90.7 The mobile pillow

Direct instruction: bigger on a phone, without touching its container or the
card. So only `--pillow-s` moved, 0.66 -> 0.88, and `--pillow-max-h` stayed at
180 — the height cap is what guarantees the card cannot grow. Measured at 375:
artwork 174x138 -> 232x184 inside an **unchanged** 279x215 container and an
**unchanged** 327x440 card. 0.88 is a ceiling, not a round number: the widest
pillow (style 2, 1.009 of the column) rotated 4.51deg and swelled by the
hover/focus scale reaches 211px of the container's 215.

The `min-[640px]:[--pillow-s:0.8]` step is now *below* the base value, which
looks like a mistake and is not: the container grows with the card, so the
artwork still gets bigger, measured 232x184 at 375 against 345x233 at 768.

### 90.8 Verification

`tsc -b` clean; `oxlint` 16 warnings, all the pre-existing
`only-export-components` ones, none in a consumer file. Vite `preview_logs`
clean — a green typecheck is not proof the app builds. Console clean **in a
fresh tab**, per Round 32's retained-buffer lesson. `layout-audit.js` **empty**
on the reflection and summary stages at 375, 768 and 1440, with
`scrollWidth === innerWidth` at all three. The whole five-question flow was
walked forwards and backwards through the real UI, not asserted.

⚠️ **Harness note.** Synthetic pointer clicks from the browser tool did not
reach this page's buttons at all this session — the call reported success and
nothing fired. Programmatic `.click()` did, and is what every measurement above
was driven with. Worth knowing before concluding a control is dead.

### 90.10 The blocked-control hint (added after the first pass)

`components/consumer/BlockedHint.tsx`, wrapping both inert controls: the card's
Next and the footer's Finish.

**It replaces `cursor: not-allowed`, rather than joining it.** Direct
instruction: "when I try to click it, there is a hover deactive icon that we
show, swap that". That cursor is the problem it solves — it says "no" and
nothing about why, in a glyph the browser draws and this project cannot word.

**Two rejected passes are worth recording, because the reasoning was wrong both
times.** The first put the sentence permanently under the button, on the
argument that hover does not exist on touch. It was rejected in the footer and
again in the card. The instruction was a hover tip and the sentence sitting
there always reads as a page-level warning rather than as something belonging to
one control. Touch is handled inside the tip instead: an `aria-disabled` button
still fires a real `click`, so it opens on that too and closes on the next
`pointerdown` outside.

| Copy | Where |
|---|---|
| "Please choose an answer first." | card's Next |
| "Please answer all questions first." | footer's Finish |

Chosen from a `/design:ux-copy` pass, option C. The `sr-only` parentheticals both
controls carried are **gone** — the button's `aria-describedby` points at the tip
itself, so there is one sentence rather than a second copy that can drift.

**Three defects found while building it, all measured:**

- **An empty black box after Finish activated.** The wrapper does not unmount
  when a control unblocks, so `open` survived into a state with nothing to say,
  and the tip rendered with an empty string. Reported from the live page as "a
  black box after finish module button activates". Fixed twice over: no `reason`
  now renders no tip at all, and an effect keyed on `reason` resets the flag.
- **The tip overflowed the viewport at 375.** Centred on the footer's Finish —
  which sits right of the viewport centre, because Go back takes the left — a
  260px tip ran 142 to 402 against a 375 viewport. `center` now means
  right-anchored below 768 and centred above; measured 91 to 351 at 375, and
  exactly centred (0px offset) at 1440.
- **React's `onMouseEnter` does not fire from a dispatched `mouseenter`.** It is
  delegated through `mouseover`/`mouseout`, so a synthetic `mouseenter` opened
  nothing and made a working tip look dead. Verified with `mouseover`.

### 90.11 Option copy is left-aligned below 1200

Direct instruction. The frame centres every answer label, which is right while
they fit on one line; a centred label that wraps to two leaves a ragged edge on
both sides, and at 375 in a single column several of them wrap. Left-aligned
below 1200 (`justify-start` + `text-left`), the frame's centring from 1200 up.
Measured `left` at 375 and 1041, `center` at 1440.

### 90.12 The welcome screen joined the flow's footer

Direct instruction, then refined across roughly eight follow-ups against the
live page. What landed:

| | Before | After |
|---|---|---|
| Yellow module bar | absent | **still absent** — see below |
| Forward / back | two stacked pills in the content | the shared `ModuleFooter` |
| Band height cap | `min(42vh, 480px)` | `min(32vh, 380px)` |
| Content spacing | `justify-between` + `gap-16` + `pb-20` | a plain column, `gap-10` |

**The bar went on and came straight back off.** The first pass put it on welcome
too, reading 25%. The next instruction removed it: "there is no need to show
header on first page, just footer is fine". That is the right call and worth the
round trip — the bar carries Go home and a progress figure, and on a screen you
have not started, "25% complete" is a claim about work nobody has done. The
footer stays, because that screen does need a way forward. `stageProgress` is
untouched throughout; welcome simply never shows its term.

**The band height took four passes** — 42 -> 30 -> 24 -> 27 -> 32 vh, each one a
look at the live page rather than a calculation. It settles at
`min(32vh, 380px)`: 288px at 1440x900, 285 at 768x1024, 247 at the 772px laptop
height this project has had a report from.

**Every stage now has a back control.** Round 46 shipped the video screen with
Continue alone, following frame `819:13080`, whose Back pill (`875:1162`) the
designer set `hidden` — flagged at the time as a product call, with the
competing reading written down (a consumer with dementia should never be in a
flow with no visible way back). Round 47 settled it that way by instruction.

**The labels are now a matched set**, which they were not before:

| Stage | Back | Forward |
|---|---|---|
| welcome | **Go home** (house glyph, leaves the module) | Start learning |
| video · summary | Go back | **Go next** |
| reflection | Go back | Finish module / Finish |

"Go next" replaced "Continue" so the pair names one kind of move in two
directions. Welcome's back says "Go home" in sentence case, not the
instruction's "Go Home" — the yellow bar has said "Go home" since Round 46, and
two casings of one label in one flow is the drift rather than the fix. Its
destination follows the label (`toHome`, not My Modules): a button that says
home and lands somewhere else is a lie the reader has no way to check.

**Widths are uniform across all four stages** — 384 forward, 152 back at 1440
and 768; below 768 the back pill sizes to its own content (138-147) so both stay
on one line. An intermediate pass made welcome's pair equal-width and stacked;
that was reversed on instruction ("make it consistent for all screens").

**Three defects found by measuring, none visible in a screenshot:**

- **"Start learning" wrapped to two lines at 375.** With Go back fixed at 152px
  the forward pill got ~159 of a 327 row. The 152 is a floor from 768 up only
  now, and both pills carry `whitespace-nowrap` so it cannot come back quietly.
- **The equal-width pass was not equal.** At 768 the outline pill's `shrink-0`
  let it hold 384 while the primary absorbed the whole shrink at 320. Fixed with
  `flex-1` + `shrink` on both — then made moot when equal widths were reversed,
  but the mechanism is the point: `shrink-0` on one of two flex siblings means
  the *other* one pays.
- **The house glyph did not match the bar's**, reported directly. The bar draws
  `size-5` at `strokeWidth 2.25`; the footer's chevron slot is `size-4` at the
  lucide default. A local `HomeGlyph` wrapper puts its class last in `cn` so it
  wins the size while keeping the slot's `shrink-0`. Measured identical (20px
  box, stroke 2.25) in both places afterwards.

**Measured after, all four stages:** `layout-audit.js` empty and
`scrollWidth === innerWidth` at 375, 768, 1440 and 1440x772; every footer CTA on
one line at 48px; welcome's content and both controls above the fold with no
page scroll at every size; focus still landing on each stage's own heading.

### 90.12b Superseded first pass

Direct instruction: "streamline module welcome screen with other screens. bring
in the header, and use footer from the next screen, the image section height can
be reduced, so that the content does not get pushed way down."

Welcome was the one stage with neither band. It had its own two stacked
full-width pills sitting in the content instead, plus `justify-between`, a 64px
floor gap and `pb-20` that existed only to keep them off the copy. All of that
is gone.

| | Before | After |
|---|---|---|
| Yellow module bar | absent | present, reading **25% complete** |
| Forward / back | two stacked pills in the content | the shared `ModuleFooter` |
| Band height cap | `min(42vh, 480px)` | `min(30vh, 360px)` |
| Content spacing | `justify-between` + `gap-16` + `pb-20` | a plain column, `gap-10` |

`stageProgress` is **unchanged** — 25% simply continues the 25 / 50 / 75 / 100
series the other three already showed, and the bar was the only reason nobody
had seen the first term.

**Two consequences worth naming rather than burying.**

1. **Start learning gains the footer's chevron**, reversing an earlier call in
   this flow that gave it none on the grounds that it begins rather than
   advances. One footer used four times cannot also be four footers, and the
   label already carries that distinction.
2. **Welcome's Go back leaves the module** (to My Modules) rather than stepping
   a stage. There is nothing behind stage one, and `retreat` would silently do
   nothing — so the footer's `onBack` is `toModules` there and `retreat`
   everywhere else, with video keeping its single action as its own frame draws.

**One defect found by measuring at 375.** With Go back fixed at 152px the
forward pill got ~159 of a 327 row, and "Start learning" wrapped to two lines
inside a 48px pill. The 152 is now a floor from 768 up only; below it Go back
sizes to its own content (measured 138) and the forward pill takes 173, one
line. Both pills carry `whitespace-nowrap` so this cannot come back quietly.

**Measured after, welcome stage:**

| Viewport | Band | CTA above the fold | Page scrolls |
|---|---|---|---|
| 1440 x 772 | ~232 | yes (bottom 756) | no |
| 1440 x 900 | 270 | yes (bottom 884) | no |
| 768 x 1024 | 285 | yes (bottom 1008) | no |
| 375 x 812 | — | yes (bottom 796) | no |

`layout-audit.js` empty and `scrollWidth === innerWidth` at every one, focus
still landing on the welcome `<h1>`, and all four stages re-walked at 375 with
no wrapped label on any footer CTA.

### 90.13 The header shrank, and four other surfaces measured against it

Direct instruction: "reduce logo by 0.5x this should reduce page header height",
then "reduced by a lot, increase by a little". Landed at `LOGO_SCALE = 0.65` —
137 x 34 desktop against the frames' 211 x 52 — with the frames' own numbers
kept as the source and multiplied, so they stay checkable and the scale is one
edit. The `vw` term in the clamp is scaled by the same factor, so both crossover
points are unchanged and the curve is identical, just smaller.

**A smaller logo does not shrink a fixed-height bar.** The header was `h-24`, so
the logo change alone would have left a 96px bar around a 34px lockup. The bar
is now **72px**, and the number lives in one place — a new
`--consumer-header-h` in `consumer-tokens.css` — because **five** surfaces
measure against it:

| Surface | Was | Now |
|---|---|---|
| `ConsumerHeader`'s bar | `h-24` | `h-[var(--consumer-header-h)]` |
| Module page's column | `calc(100vh-96px)` x2 | `calc(100vh-var(--consumer-header-h))` |
| `ConsumerWelcome`'s column | `calc(100vh-96px)` x2 | same |
| Diary's question column | `calc(100dvh-157px)` / `-96px` | `calc(100dvh-var(--consumer-header-h)-61px)` / `-var(...)` |
| `ConsumerCanvasWave` | `headerPx = 96` | `headerPx = 72` |
| Diary's wave crest | `top: -160` | `calc(-64px - var(--consumer-header-h))` |

**Two regressions this caused, both found rather than predicted.**

- **A 24px band of dead canvas between the header and the yellow module bar**,
  reported from the live page. The bar is `sticky top-24` — 96, the header's old
  height — so it stuck 24px too low. Now `top-[var(--consumer-header-h)]`, and
  measured flush (header bottom 72, bar top 72, gap 0). `ConsumerShell`'s two
  `sticky top-24` slots had the same bug and were fixed with it.
- **The logo link fell to 34px, under this project's 36px floor, on every page
  in the portal.** It had always inherited its height from the lockup, which was
  52px and never a question. `layout-audit.js` caught it on all five pages;
  nothing about it is visible, because the artwork is unchanged. Fixed with
  `min-h-9` on the link, which moves the box and never the logo.

Both are the same lesson in two shapes: **a number derived from the header's
height cannot be written down anywhere but the header.** The token exists so the
next change to that bar is one edit rather than six.

**Verified across Home, My Modules, the diary, Need Help, My Profile and all
four module stages, at 375 and 1440:** header 72 everywhere, logo link 36,
`layout-audit.js` empty on every page, no horizontal scroll anywhere, and the
diary's wave crest sitting flush under the header rather than 24px low.

### 90.14 "Start learning" only the first time

Direct instruction: go past the welcome screen and come back, and it should not
still be offering to start something already started. A `furthest` index is held
alongside `stage` — separately, for the reason `ModulePlayerNav`'s own
`furthestIndex` is (§77): re-reading an earlier screen must never roll a label,
or a destination, backwards. Welcome's forward control reads "Start learning"
while `furthest === 0` and "Go next" after. Measured across a full
forward-and-back walk: Start learning -> Go next -> (back) Go next -> Go next.

### 90.15 The module completion screen

Frame `915:3850`, which is the sleep diary's own thank-you screen with different
words, plus `915:4218` for its illustration.

**`CompletionHero` is a real extraction, not a copy.** The wave band, the
six-layer mascot and the centred title column moved out of `ConsumerDiaryPage`
into `components/consumer/ConsumerCompletionHero.tsx` at their **second**
caller — 408 lines, doc comments and all, because the numbers they explain are
the reason nothing in there is round. Copying them would have set two versions of
a six-layer composition running in parallel, which is §89.14's `PersonCard`
exactly. The diary's page keeps its input-field constants and imports the hero
back.

`done` is a fifth screen but **not a fifth quarter**: `STAGES` still holds the
four that carry progress, so the bar reads 100% on reflection rather than 80%,
and `done` renders with no bar and no footer at all.

**The illustration is the rosette badge**, not the pillow-and-books mascot the
diary uses — direct instruction, and it reads correctly: a rosette is what you
get for finishing something, where a pillow with a mug and a stack of books is
what you get for keeping a diary. `CompletionHero` takes a `mascot` slot for it
rather than being forked, since everything else about the screen is identical.

**The breath is on the whole badge, and that is deliberate.** It is the diary's
own 4s `scale: [1, 1.035, 1]` / `y: [0, -3, 0]` loop on the same easing. What
differs is the target: the diary's pillow is one of six separate layers so it can
breathe alone, while this rosette is a single flattened vector with the pillow
inside it. Pulling the pillow out to animate it separately is precisely the
split this project has shipped misaligned three times (§78.1), and at this size
the difference cannot be seen. Verified live mid-cycle:
`matrix(1.01174, 0, 0, 1.01174, 0, -1.00626)`.

**The overlap is desktop-only.** Direct instruction allowed the badge to sit
subtly over the title, then restricted it: "make sure the badge does not overlap
in tablet or mobile view". Below 1200 the text column is much taller once it
wraps, so art tucked behind its first line reads as a collision rather than a
composition. Measured: 7px clear at 1440, **56px** at 375, **88px** at 768, and
`overlaps: false` at both narrow widths.

**Two stale strings fixed on the diary's own screen**, found while borrowing it:
"your **lesson** of the week" -> "module of the week" (Round 46 renamed this
portal-wide and §89.12 recorded zero occurrences of "lesson" in rendered text —
wrong: this screen sits behind nine answered questions and the sweep never
reached it), and its title-case "Go Back Home" -> "Go home".

**Verified** by finishing the real flow rather than deep-linking: focus lands on
the completion `<h1>`, type entirely on the consumer scale (16/600, 18/400,
20/600, 40/500), zero em dashes, zero contractions beyond possessives,
`layout-audit.js` empty and no horizontal scroll at 375 / 768 / 1440. New
committed asset: `public/illustrations/consumer-lesson/module-complete-badge.svg`
(267 x 297.589, the frame's own export).

### 90.16 Close-out sweep

Removed rather than left: `InProgressStage` and its `Hammer` import (the
reflection placeholder it rendered is now a real screen); `toModules`, whose
last caller went when welcome's back control became "Go home"; the `sameWidth`
prop and its stacked-pair styling, reversed on instruction the same session;
`cursor-not-allowed` on both blocked consumer controls, which `BlockedHint`
replaces by design; and the `sr-only` parentheticals on those two controls,
which were a second copy of a sentence now rendered once.

Un-exported, having no reader outside their own file: `DiaryWaveBand` and
`DiaryMascot` (only `CompletionHero` composes them — they were exported by the
extraction script, not by intent), plus the `ModuleChapter` and
`ReflectionOption` types.

**Two stale doc comments corrected in place** rather than deleted, because what
they got wrong is the interesting part: `ConsumerModulePage`'s header still said
"Summary and Reflection are deliberately unbuilt" and "four stages" (it is five
screens, four of which carry progress), and `ConsumerShell`'s still described
the header as `h-24`/96px and its slots as `sticky top-24`. Every remaining
mention of `top-24` or 96px in this portal is now inside a comment explaining
the history, never in a live class.

**Verified at close, at 375 / 768 / 1440:** the whole five-stage module flow
walked end to end (`layout-audit.js` **0 findings** at every stage, focus on a
real heading at every change, never `<body>`); Home, My Modules, the diary, Need
Help, My Profile and the module page each showing **zero** rendered "lesson",
zero em dashes, zero sub-16px or over-600 type, and zero app-brand purple; no
horizontal scroll anywhere; every committed `consumer-lesson` and
`consumer-diary` asset referenced. The researcher and coach portals were checked
and render unchanged on their own 48px header. `tsc -b` clean; `oxlint` 16
warnings, all the pre-existing `only-export-components` ones and none in a file
this round touched. Fresh-tab console clean, Vite logs clean.

### 90.9 Left open

- **Answers are session state.** A reload starts over and nothing reaches the
  coach's record. There is no store slice for a consumer's reflection answers,
  and inventing one would put a figure on a researcher's screen that no coach
  has ever discussed. Same call, same reason, as the sleep diary's (§87.6).
- **The inactive pips measure 1.54:1** (`purple-300` on `purple-200`) — the
  frame's own pairing. The active segment is 8.68:1 and the count is also
  carried as `sr-only` "Question N of M", so the information is available in
  text; the tint is left as drawn rather than overridden without a call.
- **A single card nav button takes the full width below 1200** (first and last
  questions), which follows from "100% equally divided" plus "left aligned" but
  was not separately confirmed. A natural-width left-aligned pill is a one-line
  change.
- Five of the six modules still have no reflection questions, so the stage
  renders nothing for them. `moduleReflection()` returns an empty list rather
  than a broken one-step flow.

## §91 — Round 48: the session-feedback modal — responsive stacking, the pillows' real drop shadows, and motion (2026-09-09)

Continues the session-feedback work. Everything here was verified by measurement
in the running app, not by looking at a screenshot; `design/layout-audit.js`
returns empty at 375x667, 667x375, 768x1024 and 1281x800.

### 91.1 The stack, per viewport

| Width | Mood options | Footer |
|---|---|---|
| < 640 | vertical list, copy first then pillow, `60vw` centred (min 200, max 280) | stacked, full width to a 420px cap, primary first |
| >= 640 | the frames' 5-across row | row, primary right, 384 / 152 |

Four things worth keeping:

- **The panel is a full-screen sheet below 640 and the frames' 1115 x 674 card
  above it.** Inset as a card on a phone, the wrapper's 16px plus the panel's
  24px left the footer buttons at 295 of 375 — reported as "on smaller screens
  these buttons take ~80% width". Full-bleed with `px-5` they reach 335 (89%),
  and nothing is spent on a margin a phone does not need.
- **The footer is *not* sticky** (direct instruction). It sits inside the
  scrolling region, so on a phone it scrolls up with the options it belongs to.
  On a tall panel `scrollHeight === clientHeight`, so the whole group is centred
  by `m-auto` and the space under the footer is the panel's own padding, not
  slack — checked, because it looks like slack.
- **⚠️ Height-dependent sizes are `min(px, dvh)` values, not stacked media
  variants.** Landscape phones were the one real failure in the sweep: at
  667x375 the frames' 202px cards and 72px panel padding needed 217px of
  scrolling to reach the footer. Expressing them as `min(202px, 30dvh)`,
  `min(48px, 5dvh)`, `min(72px, 7dvh)` and `min(110px, 16dvh)` cut that to 98px
  (844x390: 210 -> 71) and scales continuously. Written as single values on
  purpose — §89's lesson is that mixing named-breakpoint and arbitrary variants
  on one property resolves by source order, and a `max-height` variant stacked
  on `min-[900px]:` is exactly that trap.
- **A phone-only `min-w`/`max-w` must be switched off at `sm`.** Left
  unprefixed, the 200px floor applied to the 5-across grid cells too and forced
  a real horizontal page scroll at 768.

### 91.2 The selected pillow's drop shadow

All five: **X -3, Y 12, blur 36, spread 0, 50%**, colour per mood
(`#0C4111` / `#4D8C38` / `#B29914` / `#B8590D` / `#801F1A` — four of them the
card's own border colour, "very good" is not).

- **⚠️ Blur is halved.** Figma's blur is a diameter; `filter: drop-shadow()`
  takes a standard deviation, so 36 becomes **18**. This is the mirror of §66's
  `box-shadow` finding, where the mapping *is* 1:1 — the two do not agree, and
  which one applies depends on the CSS property.
- **⚠️ An outer shadow cannot survive a node-bounded SVG export, so do not
  conclude from the export that there isn't one.** Three passes were spent on
  this. Every export — the cards, then five isolated pillows (`951:7199`,
  `7211`, `7223`, `7235`, `7247`) — carries exactly one filter, `filter0_ii`,
  and it is two *inner* shadows, with its region clipped to the pillow's own box
  (`x="0" width="125.79"`). `get_design_context` on the card, the container and
  the image node returns fill and stroke only; `get_variable_defs` returns `{}`.
  Meanwhile Figma's own render plainly showed a colour-matched halo. The
  intermediate guess — a shadow tinted from each filter's `feColorMatrix` — was
  visually close and numerically wrong, and was replaced the moment the real
  values arrived. Ask for the effect panel's numbers; do not reverse-engineer
  them from ink bounds.
- **The lengths are `cqw`, so the shadow scales with the pillow.** The effect was
  authored against the 125.79px selected pillow, which renders at 56px on a
  phone; fixed px would give a phone a shadow twice as deep as its own pillow.
  Each length is its share of that width (3/125.79 etc.) against a container
  established on the pillow box — measured at 1281 as -2.623 / 10.494 / 15.743px
  against a 110px pillow, matching the arithmetic to three decimals.

### 91.3 The selected stroke is an outline, not a border

The frame's selected card has a 3px stroke against the resting 1px. As a border
that cost 2px of the card's own padding and **the label stepped 2px right the
moment a mood was chosen** — invisible unless you diff the two states. It is now
`outline: 3px solid` at `outlineOffset: -3px` over a permanent 1px transparent
border: same pixels, no layout. `focus-visible:ring-*` is a box-shadow here, so
the two never contend. Verified: every label holds at x=92 in both states.

### 91.4 Motion

- **Each pillow performs one beat and settles, on a loop** — "just one change and
  then move to default, and this loops". Rest until 62%, peak at 76%, settled by
  100%; five different durations (3.2-4.6s) plus a per-index delay, because one
  shared duration reads as the row twitching rather than five pillows each with
  a life of its own.
- **All five beat until a choice is made, then only the chosen one does.** The
  flag is `mood === null || selected`, read from the selection itself rather than
  held separately, so the row cannot get out of step and clearing a choice
  restores all five.
- **The faces move too, and the emotion intensifies without ever changing** —
  "happy becomes slightly more happy". The two happy pillows lift, the two
  unhappy ones sink, "okay" barely moves. Each pillow is now three layers —
  body, brows, face — **split out of the flat export byte for byte**, every
  `<path>` verbatim under the export's own unmodified `<svg>` open tag, the same
  technique as the awake mascot's four-layer split, so they register by
  construction. 9 paths in, 9 paths out, per file.
- **⚠️ Translation only.** Each layer spans the whole box, so `scale`/`rotate` on
  a layer pivots about the box centre and a scaled brow visibly slides sideways.
  Same constraint, and same order of magnitude of values, as §84's `EXPRESSIONS`.
- **⚠️ framer-motion never parsed percentage `y` keyframes here.** It wrote
  `transform: none` and left it: 5.2s of sampling showed the body's CSS beat
  running while the face measured 0 the entire time, which is the only reason the
  failure was visible rather than plausible. The face layers moved to CSS, where
  the per-layer peak is a `var()` inside the keyframe — resolved at
  computed-value time, so one keyframe set serves both layers and all five moods
  while the *interpolation* still happens between resolved transforms. **A class
  alone is not an animation**: the shared rule set duration and delay but no
  `animation-name`, and that silent gap cost a second measurement round.
- **A percentage translate resolves against the layer's own box, which is not
  always the pillow's.** "Very bad"'s face is a separate 34.2244 x 34.0473 export
  rendered at 29.30% width, so it occupies 32.128 pillow units of height, not
  34.047. Using the raw viewBox left that one mood travelling 6% short of every
  other (2.35px where 2.5 was intended).
- **Each screen animates in and out** (`AnimatePresence mode="wait"`, 0.26s, out
  upward / in from below). `mode="wait"` rather than an overlap, because the
  panel is one fixed box and two screens crossing inside it would overlap their
  own copy.
- **⚠️ The heading focus moved from an effect to a callback ref**, which is
  forced by that wrapper: the incoming heading mounts a commit later than the
  step change, so an effect keyed on `step` focuses the outgoing heading and
  every transition lands on `<body>`. Measured after the change: focus lands on
  "Anything else you want to add?" and "Thank you for your feedback!" in turn.

### 91.5 The thank-you avatar shares the Home mascot's clock

Direct instruction: "re-use pillow avatar animation for last page avatar ... from
home page or sleeping diary page". `ConsumerCanvasWave` now exports
**`useMascotExpression`**, extracted from `ConsumerMascot` rather than copied, so
one implementation drives both avatars and future tuning reaches both;
`EXPRESSIONS` supplies the same `browY`/`faceY`/`tilt`, which land unchanged
because `thanks.svg` shares the mascot's 90-unit height. `thanks.svg` was split
into the same three layers.

`nap: false` is the one difference, and it is a content decision: the pillow
should not doze off while thanking someone for their feedback. Home was
re-verified after the extraction — all five layers present, brows reaching -4,
the head tilting 4° -> 0, the float running.

---

## §92 — Round 49: the Consumer Portal's Need Help page, and the two header submenus (2026-09-11)

Frame `982:8558` (desktop, 1281). No mobile frame, so everything below `lg` is
derived and measured. New page at `/consumer/:dyadId/help`, reached from the
account menu rather than a header tab (Round 48 moved it there).

### 92.1 The hero is the portal's own, with two swapped assets

The user's own framing settled the scope: "I can see the background weavy +
avatar already there, you just need to update the background + avatar shadow
below", then "avatar will need updating, it has new vector". Nothing about the
hero was rebuilt.

| Layer | Home | Need Help |
|---|---|---|
| Wave | `home-wave-desktop.svg`, flat `#FBF5E6` | `help-wave-desktop.svg`, radial `#FBF5E6 -> #FFCC4D -> #FFB846`, 1323.88 x 247 |
| Ground shadow | `awake-ground.svg` `#EADECC` | `help-ground.svg` `#966316` |
| Sticker | none (My Modules has a pencil) | `help-question.svg`, 52.776 x 46.481 |

`ConsumerCanvasWave` gained `variant: 'home' \| 'help'`; `ConsumerMascot`,
`ConsumerMascotFigure` and `ConsumerPageHero` gained `withQuestion`, mirroring
`withPencil` exactly.

**`help-ground.svg` is `awake-ground.svg` with one `fill` changed and nothing
else.** The frame's own ellipse node sits at the bottom of a 138.158 x 97.79
group where the app's sits at the bottom of a 138.158 x 90 box — the *same*
relative position — so transcribing the frame's `mt: 82` would have moved a
shadow that was already correct. §84.2's rule: derive from the asset that
already registers, never from a second set of numbers.

**The sticker overflows the mascot's box to the right, out to 154.6**, so
`ConsumerMascotFigure` widens its own box by 16.4px for this variant
(`w-[99.6px] sm:w-[154.6px]`). The frame does the same thing — its group is
154.6 wide inside a centred column, so the pillow sits ~8px left of centre and
the bubble carries the balance. Sizing the box to the pillow instead would
centre the pillow and let the bubble hang into the gutter.

**The bubble animates as one element** (direct instruction). -5.1deg (its drawn
rest angle) to +3deg is an 8.1deg swing with a 3px float on a 3.2s loop, offset
from the pillow's 5s breath. Round 34's threshold is the reason for the
amplitude: rotations under ~8deg are invisible on a 52px shape. Measured live
across 8 frames — rotation -4.46deg to +2.88deg, `y` -0.24 to -2.95 — rather
than assumed from the classes being present.

The bubble and the mark are **not** split into two layers. The export
interleaves its four paths (bubble fill, mark, bubble outline, mark highlight),
so splitting would reorder the paint. §84.2 cuts the other way here: the asset
is only guaranteed to register with itself.

**⚠️ `variant="help"` has no mobile export.** Figma supplies one asset for this
frame where Home has a purpose-drawn phone band as well, so below `sm` the gold
variant renders the desktop curve held at its own width and cropped — the same
"clip, never squash" rule the desktop asset already follows at tablet widths.
Swap in a real phone export when one is drawn; do not stretch this one.

### 92.2 Four new type steps

None of the existing consumer steps matched, and the standing rule is to add the
Figma value rather than round onto a near neighbour (Round 21 lost 5 of 16
elements that way). All four registered in `lib/utils.ts`'s font-size group in
the same commit — the list Round 21.3 found silently eating a whole token.

| Token | Value | Why not an existing step |
|---|---|---|
| `--text-consumer-section` | 24 -> 32, 500, -0.374px | Sits between `card-title` (-> 28) and `display` (-> 40). Lower anchor derived, not transcribed: 24 holds the same 4px step below `display`'s 28 that the desktop pair holds at 40/32 |
| `--text-consumer-body` | flat 16, 400 | `consumer-eyebrow` grows to 18; the frame draws this at 16 at its own 1281, and 16 is the portal floor so there is nothing to interpolate down to |
| `--text-consumer-faq` | flat 18, 500, 1.4 | `consumer-lesson` is wrong twice — it grows to 20, and runs 1.3 |
| `--text-consumer-crisis` | 18 -> 20, **600** | See below |

**`consumer-crisis` is 600 where the frame draws 700.** This portal's scale has
a documented ceiling of 600 and nothing else in it is bolder; one 700 would be
the only one in the portal, so the ceiling wins. The line still reads as the
loudest thing in its block — it is the only 600 among 400s.

Verified by measurement at 375 / 768 / 1281: **zero** rendered text nodes under
16px or over weight 600.

### 92.3 Deliberate divergences from the frame

1. **The trailing vertical rule is dropped.** The crisis row draws a divider
   after Beyond Blue with nothing to its right (`982:8878`). Two items take one
   rule. Implemented as a per-item border rather than a rendered divider node,
   so the rule cannot outlive the item it separates.
2. **The 52px white square is a glyph**, per direct instruction. It is
   `MessageCircleQuestionMark`, **not** `LifeBuoy` — the portal settled this
   twice already (the coach profile modal, "this icon does not make any sence",
   and again in `ConsumerMenuDrawer`), and the user's own instruction was to use
   what the hamburger drawer uses. Drawn as the glyph in white rather than a
   white plate holding a glyph, so it belongs to the card's all-white content.
3. **Copy corrected**: "essentials information" -> "essential information",
   "Care2sleep" -> "Care2Sleep", "About program" -> "About the program". Two sub
   copy lines also trail off mid-sentence in an ellipsis, which is a Figma text
   box running out of room rather than intended copy; both are finished.
4. **The rows are real accordions.** The frame draws a collapsed state only, and
   a chevron that does nothing is a silently dead control. Each opens onto an
   honest "This answer has not been written yet" rather than fabricated copy.
5. **Questions are dummy content**, written to be plausible for this study and
   counted **4 / 5 / 3 / 2** (direct instruction: "show some variation, not
   necessarily it will be same number for all sections"), so the layout is
   exercised against uneven sections rather than a tidy 3-3-3-3 the real content
   will not match. The frame's three identical "Question" rows per section could
   not ship as drawn regardless: three controls sharing one accessible name is
   unusable with a screen reader.

### 92.4 The mobile FAQ card is derived, not transcribed

Direct instruction: "in mobile view, add background white + shadow + purple
header 50 to section". Below `lg` each section becomes a card — white body, warm
`shadow-card`, title block on a `purple-50` band. It is derived from a pattern
this app already has rather than invented: §35a's own card-header contract.

It earns its place. Once the columns stack, a title and its questions sit in one
undifferentiated run with three more sections behind them and nothing tells a
reader where one stops. On desktop the 80px column gap does that job, which is
why the card is not carried up there. Every card property is cancelled
explicitly at `lg` rather than being written `lg:`-first, so the mobile default
cannot be lost to a later edit.

**The email cannot wrap** (direct instruction). At 16/600 the address measures
~250px and the row's chrome another 84, so the frame's fixed 320px column broke
it onto a second line with one orphaned character; the column now sizes to fit
(`lg:w-auto lg:min-w-[320px]`) and the row is `whitespace-nowrap`. The earlier
`break-all` had to go with it — it made the wrap silent instead of preventing
it. Padding drops to `px-5` on a phone, which is what keeps it inside 375.

### 92.5 The two header submenus are now one pattern

Three direct instructions, all against the account dropdown and all applied to
the accessibility card too.

**Position.** "It should show below the header, and not overlay (just like it is
done for accessibility sub menu)." The account menu now hangs off the same
virtual anchor `AccessibilityMenu` already built, for the same measured reason:
below 1200 the header is the bar PLUS the nav tab row, so anchoring to the
trigger drops the card 8px under the bar and straight **on top of** the tabs —
opaque card, invisible in a screenshot. `bottom` comes from the `<header>`,
`right` from the trigger (which already sits on this portal's gutter, 24 below
1200 and 80 above). Measured at 1281: header bottom 72, popup top **84**. At
768: 133 and **145**. Both 12px, both with the popup's right edge exactly on the
trigger's.

**Rows.** "Re-use the big icons (make them small just a little), and improve the
sub menu page buttons." The three items are now the hamburger drawer's own rows
— icon, label, trailing chevron — one step down at every size, because this
sits in a 320px card rather than a full-screen sheet: icons `size-7` against the
drawer's `size-8`, chevron `size-6` against `size-7`, label `consumer-lesson`
against `card-title-sm`, row 60px against 72. They are now driven from an
`ACCOUNT_ROWS` list so they cannot drift from the drawer's own bottom three.

**Card chrome.** "Visually align the accessibility sub menu as done for sub menu
for my account." Both are now 320 / `rounded-lg` / `parchment` stroke / white /
`shadow-card`. The frame's 348 loses to 320 — one of the two had to move, and
the narrower still fits a 375 screen inside this portal's gutter without
relying on the max-width clamp.

**The close button.** "Accessibility sub menu close button does not visually
align across the app." It did not, measurably: the portal had **three** close
buttons — the drawer's 44px round `consumer-primary` with `X` at `size-7`, the
coach profile modal's 44px round with `X` at `size-6`, and this one, a 36px box
holding a 12px `X` inside a filled 24px grey disc used nowhere else. It is now
the drawer's. That drops the frame's grey disc, which is right twice over: the
36px control floor already outranked the frame's 24px target, and a portal
cannot have one glyph mean "close" in three costumes. `-mt-2 -mr-2` keeps the
*glyph* on the card's 24px inset rather than the button box — the box is 44
around a 28px `X`, so 8px is padding, and pulling back by exactly that leaves
the mark where the padding says while the hit area grows into the corner.

**Motion.** "Introduce a subtle animation when they are displayed, or closed."
One shared constant, `SUBMENU_CARD_MOTION`: a 4px drop and a fade over 200ms,
same easing and same distance in both directions — two curves on one element is
most of what reads as springy (Round 32). Driven by Base UI's own
`data-starting-style` / `data-ending-style` rather than `framer-motion`, because
the library unmounts the popup on close and an exit animation has to be
something it can wait for. `motion-reduce:transition-none` rather than a
`motion-safe:` prefix on each state class — stacking a media variant on a
data-attribute variant is the combination this project has already watched fail
to compile silently.

### 92.6 Orphan deleted

`ConsumerInProgressPage.tsx` had exactly two callers ever — My Modules (real
since Round 43) and Need Help. Both are now real pages, so it is deleted and
`App.tsx`'s two stale comments about it corrected rather than left pointing at a
file that no longer exists.

### 92.7 Verification

`tsc -b` and `oxlint` clean throughout; Vite `preview_logs` carry no transform
error (a green typecheck is not proof the app builds here). `design/layout-audit.js`
**empty** at 375, 768 and 1281. No horizontal page scroll at any of the three
(`scrollWidth === innerWidth`). Zero font-rule violations. The accordion was
exercised through the real UI: `aria-expanded` toggles, the panel mounts and
**unmounts** (animated `height: 0` is not concealment — Round 20's Critical),
and focus stays on the trigger in both directions rather than falling to
`<body>`.

### 92.8 The search field (frame `982:8583`, added mid-round)

A pill search between the reader and the FAQs. The frame puts it **below** the
blue card at a 96px inset (929px of pill) and drops the Content stack's gap from
56 to 40 to fit it. Both were built, then both were overridden by direct
instruction: "move the search bar above blue card, reduce its width, and revert
the spacing how it was below the blue card, and FAQ's".

Shipped state — search (720px, centred) -> **72px** -> blue card -> **56px** ->
each FAQ section, 56 apart. The 72 is a second instruction ("add some vertical
space between the search bar and blue card"): the search is one control and the
card is a dense block of contact detail, and at 56 the two read as one unit.
Everything below the card keeps the frame's own 56, so there is one rhythm and a
single deliberate exception rather than the frame's two-container split.

**It does real work.** The standing rule against silently dead controls binds
hardest on a search box — it is the first thing a reader types into, and one
that swallows a sentence and does nothing is worse than no search at all. It
filters the twelve questions live, hides sections that fall empty, and shows a
plain "nothing matches" line rather than four headings over four empty lists.

**Word overlap, not `includes()`.** The placeholder is "Describe your issue",
which invites a sentence, and a substring match returns nothing for a sentence
against a question phrased any other way — the classic search box that looks
broken while working exactly as written. The query is split, stop words and
1-2 letter fragments dropped, and a question matches if **any** surviving word
appears in it (`some`, not `every`: a reader describing a problem will use
several words the list does not have, and requiring all of them is the same
empty result by a longer route). Verified live: "my fitbit is not syncing"
resolves to the one Fitbit question; "session" to four; "zzzzz" to the empty
state; clearing restores all fourteen rows.

**One real defect, found by measuring.** The Clear button only renders while
there is a value, so clicking it **unmounts the control that was clicked** and
focus fell straight to `<body>` — this project's most-repeated defect, and an
earlier version of the code comment beside it asserted the opposite. Focus now
moves to the input, which is where a reader who just cleared a search is going
anyway. Re-verified: `document.activeElement` is the input, not `<body>`.

Additions the frame does not draw, all for the same reason — it draws one
resting state: a focus ring, the Clear button, and an always-mounted
`aria-live` result count. The count matters most: filtering silently removes
whole sections, and a region that only mounts once there are results announces
nothing on the transition *into* zero results, which is the case a
screen-reader user most needs told.

Measured at 1176: pill 720 and centred, gaps 72 / 56 / 56. At 375: pill 327 x
59, no horizontal scroll while typing a long sentence, Clear at 36px. Audit
empty and zero font violations at 375, 768 and 1176.

### 92.9 Corrections made the same round

Four fixes, all found by measurement against Home rather than by looking.

**The gold band's phone half is a mask, not the desktop export.** Figma has one
export for this frame and no phone counterpart — confirmed against the file's
metadata, where `982:8558 Home_Desktop` is the only Need Help artboard. Two
passes at serving both widths from it failed, and both are recorded in the
component because each looked like the obvious fix:

| Attempt | Result at 375 |
|---|---|
| `max(100vw, 1281px)` | 239px band ending at y 265, title starting at 221 — **the heading sat inside the gold** |
| Hold at 943px (the width that gives Home's 176px depth) | Depth right, **curve wrong** — a 943px crest cropped to 375 is nearly a straight edge |

Stretching to 375 x 176 is worse still: the export carries
`preserveAspectRatio="none"`, so that shears the curve into the spikes the
two-export split exists to prevent.

The shipped answer takes **shape from Home's own committed export**
(`home-wave-mobile.svg` as a CSS mask, so it is the identical curve by
construction) and **paint from this frame's export** — two endpoints sampled off
`help-wave-desktop.svg` rasterised to a canvas: `rgb(253,223,147)` at the top to
`rgb(255,197,75)` at the bottom. Horizontal variation measured ~18 per channel,
below the visible threshold at 375px wide, so a linear vertical gradient rather
than a reconstructed radial (the export's own stops are a radial in a coordinate
space that does not map onto a 375-wide box). Verified: Need Help, Home and My
Modules now measure **identical** at 375 — wave 176 tall ending at 245, mascot
base 238 at left 24, h1 top 255, 10px of clearance.

**The email breaks at the `@` below `sm`.** "Email should not wrap" was given
against the desktop card, where a fixed 320px column broke it mid-word and left
a single "u" alone; the column now sizes to its content and one line holds from
`sm` up. On a 375 phone one line is arithmetically impossible — the address
alone is **237px**, plus a 24px icon, a 12px gap and 40px of pill padding =
**313px** of content in a **261px** pill, and stripping every scrap of padding
still leaves it ~30px short. `whitespace-nowrap` was not preventing the wrap, it
was **hiding** it: the text painted outside its own pill and the page's
`overflow-clip` swallowed the evidence. It now breaks only at the `@` via a
`<wbr>`, giving "rosemary.vance@" over "monash.edu".

**⚠️ A verification gap worth carrying forward.** This page sets `overflow-clip`
on its content container (the full-bleed wave needs it), and that makes
`document.documentElement.scrollWidth === window.innerWidth` **true while
content is visibly cut off** — so `layout-audit.js`'s horizontal-scroll check
reported clean on both the email spill and the band overlap. On any surface with
a full-bleed clipped element, also walk `main *` for rects outside the viewport
and compare each element's `scrollWidth` against its own box; the audit's
page-level check is not sufficient there.

**The search is built and switched off.** Direct instruction, "remove the search
bar for now". A `SEARCH_ENABLED` flag rather than a deletion, because the pieces
behind it are correct and still type-checked; flipping it restores the 720px
pill above the card. If it is still `false` next time this page is opened,
delete it and the three pieces it gates rather than letting a permanent flag
pretend to be temporary.

**One non-fix, recorded because it was reported as a bug.** "Why did you get rid
of other FAQs + section" — nothing was removed. All four sections and fourteen
questions were intact in the source throughout; the browser tab was showing a
**stale HMR crash**, and a hard reload restored it. The giveaway was in the
console alongside it: a reload failure for `ConsumerInProgressPage`, a file
deleted earlier in the round. Round 32's retained-buffer lesson again — check a
fresh tab before believing either the console or the rendered DOM after a run of
hot updates.

### 92.10 Left open deliberately

- **No mobile export for the gold wave** (§92.1, §92.9). Below `sm` the band is
  Home's curve masked with this frame's sampled colours. Faithful, but a
  stand-in — replace it with a real phone export the moment one is drawn.
- **The search is switched off behind `SEARCH_ENABLED`** (§92.9), not deleted.
- **The FAQ answers are all one placeholder line.** The questions are plausible
  dummy content; none has been reviewed by the research team and no answer has
  been written. The page says so rather than inventing copy.
- **The contact phone number is a UK Ofcom drama-range number** on an Australian
  study — the frame's own value, kept as a visible stand-in. The two crisis
  numbers, by contrast, are real and current and should not be swapped for demo
  values.
- **No Phase 3/4 review** has been run on this round.


---

## §93 — Round 49 continued: the Consumer Portal footer, pillow photos, and two welcome-flow fixes (2026-09-11)

### 93.1 The footer (frame `988:9113`)

A `#333` band over a 50%-opacity `#F1F1F1` rule, carrying the Monash lockup and
an Acknowledgement of Country. New `components/consumer/ConsumerFooter.tsx`.

**Three surfaces only** — Home, My Modules, Need Help (direct instruction).
`ConsumerShell` takes `showFooter` and **defaults it `false`**: opt-in, because
three of six surfaces carry it and a `true` default would hand one to every flow
built later. My Profile was not named; the sleep diary and a module's inner
pages are *flows* with their own chrome (the module's bar and footer are
direction-aware) and a second darker footer under that is two competing
page-bottoms.

**New tokens.** `--color-consumer-footer` `#333333` and
`--color-consumer-footer-ink` `#f1f1f1`. The first is the same hex as the
app-wide `ink-muted`, and is named anyway: that is a **text** token, and Round
20 already found `bg-hairline` — a *border* token — doing duty as a 584x978
canvas fill and flagged it because the name stops describing the job. A dark
surface is a new role in this portal.

**New shared constant `CONSUMER_PAGE_GUTTER`** (`px-6 md:px-20`), exported from
`ConsumerShell`. The footer is a full-bleed band whose contents must line up
with the page above it, and the shell's own default (`md:px-16`) is 16px
narrower than what Home, My Modules, Need Help and My Profile all actually pass.
Built on the shell default it would have put the lockup 16px inside every card
edge above it. Measured: logo left 80, card left 80.

**⚠️ The type is 16px where the frame sets 12.** The portal's scale has a hard
floor of 16 and a ceiling of weight 600, and that floor is an accessibility
decision for an audience the project has an explicit note about. 12 would be by
some margin the smallest text in the portal. Weight drops 500 -> 400 with it:
500 at 12px is compensating for the size. Flagged to the user as a one-line
revert rather than taken silently. Contrast rasterised at **11.19:1**.

The logo is a **real brand mark** exported from the frame and committed to
`public/logos/` — the narrow pre-existing exception to never-hand-draw-an-icon
(Round 6.1.1), same folder as the Gmail/Calendar/Zoom logos.

It renders **inside `<main>`**, so the accessibility text-scale `zoom` reaches
it. The acknowledgement is readable copy, not chrome; a footer holding at 100%
while the page grew would become the hardest thing to read at the exact moment
someone asked for bigger text.

### 93.2 The summary cards' pillows now frame a photo

Direct instruction: "for all summary card, there are pillow with placeholder
images, add image there, use the stock default image we are using everywhere".
The stock image is `consumer-home/lesson-cover.jpg` — already on all six module
cards, Home's task card and the module page header.

New `components/consumer/pillowFrame.ts`, and it is **`blobFrame.ts`'s pattern,
not a second mask asset**: each pillow's `d` is rendered twice in one inline SVG
— once as the `clipPath` the photo is cut to, once as the stroke over it — so
the outline cannot drift from the image it frames at any scale, rotation or
skew. §78.1 is the reason: this project has shipped a photo hanging outside its
own outline three separate times by deriving a mask and its frame independently.

The three `d` strings were extracted **programmatically** from the committed
`card-pillow-N.svg`, not retyped, and each keeps its file's own `-3 -3` viewBox
origin — which exists because the hand-added 6px centred stroke sits half
outside the path's bounds and would otherwise be shaved flat.

Three details worth keeping: `preserveAspectRatio="xMidYMid meet"` on the root
replaces the source file's `none`, because `--pillow-max-h` can make the box
shorter than natural aspect and `none` would squash the pillow (`meet` is what
the `<img>` it replaces did by default); the `<image>` uses `slice` so the photo
fills and crops; and the cream `PILLOW_FILL` is still painted **under** the
image, so a slow or failed load shows the shape the card was designed around
rather than a hole. `clipPath` ids come from `useId` — a fixed id would have
every pillow on the page clipped by whichever mounted last.

Verified live: 4 summary pillows plus the pre-existing resource card = 5 clip
paths, **5 unique ids**, 5 stroke paths, both images resolving (666x1000 and
800x1200).

### 93.3 Two welcome-flow fixes

**Home and My Modules are hidden during the welcome journey** (direct
instruction). This restores the gate Round 48 removed — and the reason Round 48
removed it is now fixed properly rather than worked around. Hiding the nav
collapsed the bar's `1fr auto 1fr` grid to two children (`AnimatePresence`
renders no wrapper of its own), so the account cluster fell into the **middle**
track and floated mid-bar. `ConsumerHeader` now holds the middle track open with
an empty grid-only child. The navigation argument and the layout bug had been
wearing one flag. Measured at 1281: account pill at 914-1095, identical to where
it sits with the nav present.

**Finishing a module no longer replays the welcome screen.** Reported as a
routing bug and it was not one — the module's exit was already navigating to
Home correctly. `welcomeDismissed` was only ever set by the welcome screen's own
Continue, and the module flow passes `showWelcome={false}`, so a reader who
finished a module reached Home with the flag still `false` and met the first-run
welcome *after having used the app*. `ConsumerShell` now records the welcome as
seen whenever a page opts out of it.

That write happens **during render, not in an effect**: the next thing the
component does is read `skipWelcome`, and an effect runs a commit too late — the
welcome would paint for a frame on the way past. It is idempotent and targets a
module-scoped flag rather than state, so it schedules no render.

Verified: a hard reload straight into a module shows no welcome; leaving it
lands on `#/consumer/dyad-011` with "Hello Joan & Bruce" and no welcome; the
tabs return on Home.

### 93.4 Verification

`tsc -b` and `oxlint` clean. `layout-audit.js` **empty** on Home, My Modules and
Need Help at 1281, zero font violations, no horizontal scroll on any.

### 93.5 Left open

- The footer's 16px vs the frame's 12px (§93.1) — a deliberate rule call,
  reversible in one line.
- `card-pillow-{1,2,3}.svg` are now unreferenced by the app, kept as the export
  the paths came from (same reason `awake-body.svg` is kept). **A re-export from
  Figma drops the hand-added stroke and reverts the viewBox** — reapply both,
  then re-extract.
- No Phase 3/4 review on this round.


---

## §94 — Round 49 continued: the Consumer Portal welcome journey and its timeline (2026-09-11)

Frames `988:9229` (first step) and `988:9290` (a middle step). Four screens
replacing the single first-run welcome, on a horizontal track with a rail
running through it.

### 94.1 The flow

Four screens: welcome, session plan, a module each week, the sleep diary. Go
back from screen 2 on, `Take me to my portal` last, **no Skip and no progress
dots beyond the pagination** (direct instruction).

Copy notes are in `ux-copy.md`; two rules are load-bearing in the component:
the count in the welcome sentence is derived from `WELCOME_STEPS.length`
(`NUMBER_WORDS`, the same guard `PATHWAY_STAGE_COUNT_WORD` gives the coach
portal — a written count has been wrong three times here), and screen 3 states
the cycle in the order it happens (module opens -> you finish it -> then the
session), which Round 14.3 once had enforced backwards.

### 94.2 The timeline, and the four shapes that failed first

The shipped rail is **one segment per gap between two steps**, each a circle,
a bar and a circle, living inside the track so it travels with the text on the
same tween. It is worth recording what it is not, because each rejected shape
looked correct until measured:

| Attempt | Why it failed |
|---|---|
| A pair of pieces flanking the current step | They belonged to that step, so they travelled away with it and nothing joined one step to the next |
| One continuous bar, knocked out by a canvas fill on each step | Four 688.5px blocks painting over the bar left only the 168.5px between two of them — the line broke into stubs |
| The same bar, one centred non-fading fill | The section paints a **radial gradient** (measured: `radial-gradient(85.4% 95.2% at 50% 35.1%, ...)`), so a flat `#fffdfa` rectangle matched only at its centre and showed as a pale 857x32 band across the text |
| The bar animated separately from the track | Gave the stroke a life of its own; the instruction was one shared movement |

**Drawing the gap instead of covering it** removes all four problems: no fill to
mismatch a gradient, no knockout to break the line, nothing extra to animate.

**The stride is at least the viewport**, not the frames' flat 857 — the single
most important number here. A travelling rail can only live between two steps,
so that gap (`stride - textW`) has to cover the space either side of a centred
block (`vw - textW`), which happens only when `stride >= vw`. At 857 on a 1281
screen the gap is 168.5 against 592.5, which is why every earlier attempt either
stopped ~127px short of each edge or needed a fill faking continuity.

Geometry, all published as custom properties so the rail, circles and text
cannot disagree: `--stride` (>= viewport), `--text-w` (688.5, or `vw - 48`),
`--rail-gap` 56 (the frames draw 78-90; built tangent it read as crowded). The
bar tucks `-mx-0.5` under each circle so no hairline shows at a fractional
device pixel ratio, and the circles are `relative` so they paint over that
overlap. Colours are all published tokens — `purple-400` circles, a
`purple-200` -> `yellow-200` -> `purple-200` bar.

**The numbered node**: 64px against the plain 32, numeral at `consumer-heading`,
on the circle to the reader's left from the second screen onward. The welcome
screen carries none — it is the way in, not one of the three steps its own copy
promises, so the numbering runs 1, 2, 3.

⚠️ White on `purple-400` measures **3.06:1**. Acceptable only because the rail
is `aria-hidden` and the numeral decorative, with position carried by the
`sr-only` "Step N of 4". Do not reuse that pairing on anything a reader must
read.

### 94.3 Motion

**A tween, not a spring, and that is the fix for "too fast".** Three rounds of
lengthening a spring's duration (0.8 -> 1.15 -> 1.6 -> 2.2s) barely changed how
fast it looked, because a spring front-loads: it covers most of the distance in
an early burst then creeps, and the perceived speed is that initial velocity. A
symmetric ease-in-out at **1.8s** spreads the movement evenly, so the whole
duration is visible motion — slower to read while being shorter on paper. If a
spring is wanted back, lower the *stiffness*; that is the knob that governs how
hard it leaves.

**The text has no motion of its own** (direct instruction, after a rise-and-fade
was built and removed). The track carries it; a second independently-timed
movement on top read as a slideshow. No fade is needed to hide the other steps
either — a cell is one stride wide, so the nearest neighbour sits a full screen
away.

⚠️ **A lazy `useState` initialiser, not a constant.** `stride` used to start at
857 and be corrected to the viewport by an effect; that correction is a state
change, and the track animates on state change, so the welcome screen slid ~200px
sideways on first paint. Reading the viewport during the first render means the
track's first `animate` target is already its resting position. Verified: ten
samples through first paint, one position.

> ⚠️ **Correction, 2026-09-14 (Round 50).** This fixed the *target* but not the
> *starting point*, and the screen still slid in from the left on every arrival
> — `animate` with no `initial` starts from the value in the DOM, which is
> `transform: none`, i.e. x = 0. Measured in an iframe booted at a real 1281px
> width: x ran **0 -> -640.5 over the full 1.8s** on mount. The "ten samples
> through first paint, one position" above is not wrong so much as mistimed —
> the same mistake was made again in Round 50 and caught by re-probing. See
> §95.5(3). The initialiser stays; `initial={false}` / a seeded `MotionValue` is
> the other half.

### 94.4 Two layout traps worth carrying forward

**`overflow-hidden` clips both axes.** The track wrapper needs it for the
horizontal clip (the track is four viewports wide), and that sliced the 64px
numbered node — which overhangs the track's own top edge by ~16px — into a pill.
`overflow-x: hidden` alone is not the fix: CSS computes the other axis to `auto`
and adds a vertical scrollbar. `py-10 -my-10` grows the clip box and leaves
layout untouched.

**A full-bleed child inside `items-center` must not also be `left-1/2
-translate-x-1/2`.** Flex has already centred it; adding the usual full-bleed
incantation double-counts. Measured at 768 it put the row's left edge at **-80**
and clipped the title off-screen.

### 94.5 Accessibility

All four steps stay mounted so the rail can span them, so the three that are not
current are **`inert` + `aria-hidden`** — off-screen is not out of the
accessibility tree, and without it they keep their tab stops (Round 20's
Critical). Verified: 3 inert at every step.

Focus moves to the current step's `<h1>` on every change — required, not
cosmetic, because advancing makes the step holding the just-clicked button
inert and an inert element cannot hold focus. An effect is correct here (all
steps mounted, so the element already exists); a callback ref was correct in the
earlier remount-per-step build. Verified on all four steps and on Go back.

Every animation path is reduced-motion guarded: the track collapses to
`duration: 0`, the pagination to `motion-reduce:transition-none`, and the
artwork's own loops were already guarded.

### 94.6 Verification

`tsc -b` and `oxlint` clean. `layout-audit.js` **empty** and zero font-rule
violations on all four welcome steps at 1281 and at 375 / 768, and on Home, My
Modules, Need Help and My Profile. No horizontal page scroll anywhere. Rail
segments measured tangent to the text edges and reaching both viewport edges on
the middle steps, absent left of step 1 and right of step 4.

### 94.7 Left open

- ⚠️ **`ConsumerWelcome.tsx` was truncated by a bad edit mid-round** and rebuilt:
  the original was restored from git (so the wave, mascot and doodle artwork are
  byte-exact) and this round's work re-applied on top. It verifies clean, but it
  was re-applied rather than continuously edited, so a fine-tuning value from the
  last few exchanges could have been missed.
- **The Need Help search is built and switched off** behind `SEARCH_ENABLED`
  (§92.9), not deleted. If it is still `false` next round, delete it and the
  three pieces it gates.
- **`public/__mock-reflection.html` and `public/__probe-modal.js`** are
  unreferenced debug artefacts dated 2026-09-09, from a previous session. Left
  alone rather than deleted, but they would ship.
- No Phase 3/4 review on this round.

---

## §95 — Round 50: the Consumer Portal's onboarding tour, and the welcome flow's handover (2026-09-14)

**Built and live-verified by measurement. No formal Phase 3/4 review.**

Five Figma frames — `991:9446` (greeting), `992:9666`, `992:9724`, `995:9931`,
`995:10173` — became one modal shell with five screens, opening automatically
once the welcome flow hands over to Home. The round also reworked the welcome
flow's own motion, copy and spacing across ~25 direct instructions, most
arriving mid-turn as annotated screenshots from a real machine.

### §95.1 — New files

| File | What it is |
|---|---|
| `components/consumer/ConsumerOnboardingTour.tsx` | The five-screen modal. Its own chassis, not `ConfirmDialog` (which unmounts content on close). |
| `data/consumerOnboarding.ts` | Module-scoped open state + `useSyncExternalStore`. |
| `public/illustrations/consumer-onboarding/*.png` | The frames' own five exports, 994x686 — exactly 2x their 497x343 layout box. |

`dyadFirstNames()` was extracted into `data/spaces.ts` at its second caller:
Home's greeting built "Joan & Bruce" inline and the tour's `991:9446` needs the
identical string.

### §95.2 — Why the open state is module-scoped

Finishing the welcome now **navigates** to Home, and every consumer page mounts
its own `ConsumerShell` — so the shell that opens the tour unmounts immediately
afterwards. A flag in shell state would be destroyed by the very navigation
meant to reveal the modal. Round 29 shipped the neighbouring bug (a shell-held
flag replaying the whole welcome flow); the standing rule is a module-scoped
value read through `useSyncExternalStore`.

### §95.3 — The frames' own errors, all derived instead

1. **The counter.** `995:9931` and `995:10173` **both** read "3/4". Computed
   from position, never written.
2. **The dots.** All five frames draw the first dot active, including the ones
   whose own counter says 2/4 and 3/4.
3. **The greeting.** `991:9446` reads the placeholder `Hello <> & <>`.
4. **Go back on screen 1.** Drawn on all five; nothing sits behind the first, so
   the slot is *absent* rather than disabled — `ConsumerWelcome`'s own call.
5. **Four dots, five screens.** Settled by direct instruction ("I want default
   welcome to dashboard to be counted as a page"): one dot per screen, counter
   runs 2/5..5/5, and both derive from `STEPS` so neither can go stale.

### §95.4 — Type and colour mapped with nothing added

Unusually, **no new tokens**. Every hex was already a token byte for byte
(`#3a00ad` `consumer-primary`, `#333333` `ink-muted`, `#1a1a1a` `ink`,
`#6d6d6d` `ink-faint`) and every type step already existed:

| Frame | Token |
|---|---|
| 32 / 500 / -0.374 / normal | `consumer-section` (exact) |
| 16 / 400 / 1.4 | `consumer-body` (exact) |
| 16 / 600 / 1.4 | `consumer-body-strong` (exact) |
| 18 / 500 / 1.4 | `consumer-eyebrow` + `font-medium` |

Later in the round the welcome's two buttons moved `text-body-md` ->
`text-consumer-body-strong`. Both are 16/600 so nothing moved on screen, but an
app token on a consumer surface is leakage, not a decision. Measured across both
surfaces afterwards: 40/500, 32/500, 20/400, 18/500, 16/600, 16/400 — nothing
below 16px, nothing above 600.

### §95.5 — Six defects found by measuring, not looking

1. **Focus fell to `<body>` on close.** There is no opener to restore to — the
   tour opens itself. Now lands on `#main-content`.
2. **The tour opened with focus outside its own dialog.** The shell's
   post-welcome focus effect ran a commit *after* the modal mounted and pulled
   focus back to `main`, so Tab reached the page behind the dim. Round 32's
   Critical by a different route. Fixed with `welcomed && !tourOpen`.
3. **The welcome slid in from the left on every arrival.** `animate` with no
   `initial` starts from the DOM's own `transform: none` (x = 0) and tweens to
   the target — measured in an iframe booted at a real 1281px: 0 -> -640.5 over
   the full 1.8s. `readGeom`'s lazy initialiser (§94) fixed the *target*, not the
   *starting point*, and its note claimed otherwise. Now a `MotionValue` seeded
   at rest; re-measured as one single x for 2.2s after mount.
   ⚠️ **An earlier read of this said "no mount motion" and was wrong** — it
   sampled after the 1.8s had finished. A reload plus a new tool call is not a
   fast enough probe; an iframe is.
4. **A horizontal scrollbar inside the modal on a phone.** A `-mx-2` on Skip
   made the header row 8px wider than its container, and `overflow-y-auto`
   computes `overflow-x` to `auto` — 8px of overhang became a grey bar across
   the card.
5. **"Go back" wrapped to two lines.** The frame's 136px minus its 20px padding
   and 16px gap leaves ~64px for a label needing ~66.
6. **Header and footer were 140px out of alignment.** Not the padding, which is
   what was changed first and did not fix it: the header bar is full-bleed with
   a gutter, while the footer additionally had `mx-auto max-w-[1320px]`, so at
   1600 the Monash lockup sat at x=220 against the header's 80. Cap removed;
   both now at 80.

### §95.6 — Motion on the welcome flow

- **Below 1200 the track does not travel.** One frame, then the incoming step
  fades up over 450ms. Desktop keeps the 1.8s slide.
- **Stroke leads the text** by `TEXT_LAG_S` 0.05 — the rail and the words are no
  longer on one transform. ⚠️ Read the lag as a *distance*: the gap is delay x
  current velocity, and 0.12 put them ~170px apart mid-travel.
- **Gradient parallax** `RAIL_PARALLAX` 0.95. ⚠️ Counter-intuitive: apparent
  speed is `1 - RAIL_PARALLAX`, so **raising** the number calms it. 0.85 left the
  gradient running at 15% of a 1281px travel and read as "moving a lot, too fast".
- **Curve** `[0.65,0,0.35,1]` -> `[0.37,0,0.63,1]`, duration untouched at 1.8s.
  Peak velocity 2.0x average -> 1.57x; peak velocity is what reads as speed.
- **Rail dots have no entrance.** A scale-in was built on instruction and removed
  on the next look — they are the fixed points the stroke travels between.

### §95.7 — Layout decisions worth keeping

- **Pagination sits outside the scroller**, as a `shrink-0` sibling of the
  footer in a fixed-height panel: y is constant at 664 on all five screens and
  it cannot be scrolled out of view.
- **The modal is a card at every width**, never a full-bleed sheet. Built as a
  sheet first, following `SessionFeedbackModal`'s phone treatment, and reported
  back as "I cannot see it as a pop-up modal" — filling the screen removes the
  dim and the radius, which are the two things that say *modal*. Phone cap is
  96px short of the viewport, not 32: at 32 the margin was 16px a side, which
  you have to look for.
- **The tour footer stacks below `sm`.** Side by side, the primary had ~87px for
  a label needing ~150.
- **The welcome's pagination is `sticky` only from 1200.** It was sticky at every
  width and pinned itself over Go back on a phone. A first fix reserved 112px of
  empty space under the CTAs; this supersedes it and the reserve is gone.
- **Welcome vertical spacing is reduced below 1200**, including `flex-1
  justify-center` becoming desktop-only — taking the slack on a tablet opened a
  ~150px hole between the mascot and the title.

### §95.8 — Closed from §94

The two unreferenced debug artefacts §94 flagged as "left alone rather than
deleted, but they would ship" (`public/__mock-reflection.html`,
`public/__probe-modal.js`) were **deleted** this round. Both were untracked and
grep-confirmed unreferenced.

### §95.9 — Verification, and what is NOT verified

`tsc -b` and `oxlint` clean; `layout-audit.js` empty at 375x667, 375x812,
768x1024, 1281x620, 1281x900 and 1600x900; no horizontal page scroll at any of
them; the five-screen walk exercised through the real UI at each width.

⚠️ **The Skip button's hover is NOT measured.** A synthetic mouse move never set
`:hover` in this harness, and a `document.styleSheets` walk reached only 176
rules with zero hover rules of any kind — it is not seeing Tailwind's sheet, so
that scan proves nothing either way. `hover:bg-parchment` is a standard utility
and `bg-parchment` resolves to `rgb(245,245,247)`, but the state itself wants a
look on a real machine. The rest-state colour was rasterised: `ink-muted` on
white, 12.63:1.

### §95.10 — Left open

- No Phase 3/4 review on this round.
- The tour is **not persisted**, matching the welcome it follows, so a reviewer
  meets both on every full page load. Deliberate.
- This is the **second** consumer modal carrying `SessionFeedbackModal`'s focus
  chassis with no shared component. Extracting one means editing a signed-off
  file and was not done in the same pass that introduced this one; a third
  caller should force it.
- Page *content* is still capped at `max-w-[1320px]` while the header and footer
  are now full-bleed, so above ~1480 the footer aligns with the header rather
  than with the content column above it. Moving content to match is a separate
  change.

---

## §96 — Round 51: the module player rebuilt on the `module.md` block vocabulary (2026-09-15)

The Coach Training Portal's module player now renders clinician-authored content directly from the `Coaching modules master/` authoring format, instead of the Round 7 Module 4 shape. The Round 33 shell (330px outline rail, centred slide column, 84px `purple-50` footer) is unchanged — this replaces what goes *inside* it.

### Why the old content model had to go

Round 7's `ModuleContent` baked one fixed chapter shape into its types: `learnVideos`, exactly 3 `cases`, exactly 5 `knowledgeCheck` questions, 5 `whatToExpect` rows, and a `STEPS_PER_CHAPTER = 8` constant that every position was computed from. That shape does not exist in the real authoring format. A chapter repeats its Know How / You Might Also Hear / Your turn / Transition unit **once per scenario**, and Module 6's three chapters have 1, 1 and 2 scenarios — 8, 8 and 12 slides.

**Any fixed multiplier is wrong for at least one chapter, and wrong silently**: the outline rail and the overview page would point at the wrong slides rather than fail. Positions are now *found* by walking the built step array (`sectionRanges()`), never calculated. Adding a scenario is a data change with no arithmetic to update anywhere.

### The model

A module is slides; a slide is an ordered `Block[]`; a `Block` is a discriminated union keyed by its module.md tag. **One `| Slide N |` row in the source = one player step.** Nothing counts blocks or assumes positions — Module 6 Chapter 3's second Know How genuinely omits the `<Intro block_2>` its first one has, and that renders as authored.

### One outline, two renderings

`sectionRanges()` in `playerSteps.ts` is the single source for both the player's side nav **and** the module overview page's outline rows. Previously the overview page multiplied its own constant. Two surfaces rendering one fact off two independently-written sources is this project's most-repeated bug, and here it would have surfaced the first time a chapter gained a scenario.

`data/moduleOverviewContent.ts` is likewise now **derived** from `MODULE_CONTENT` rather than hand-authored. Its only remaining hand-written values are the per-chapter duration estimates, because the authoring format carries no timings at all.

### Block composition: Figma for layout, this app for styling

Direct instruction. Each block's field order, grouping, and which parts sit on a tinted panel vs. a plain card follow the Figma component (file `xhAPgU8I5GzG9UDPHqJrnj`, canvas `2577:19500`) exactly; type scale, colour tokens, radii and shadows are the portal's own. The block reference itself calls those templates "intentionally low-fidelity — a first pass to validate the workflow", so transcribing their type would import a system nobody chose.

Three deliberate divergences:
- **Core skills are a wrapping chip list, not the frame's three circular badges.** The frame draws exactly 3; real chapters carry 11, 15 and 17. Three fixed circles cannot hold seventeen, and truncating would drop authored content.
- **Interactive blocks are bare placeholders** — a labelled card naming the pattern, nothing inside (direct instruction, overriding workflow §3a's "preserve the content in the stub"). The content stays in the data file for whoever builds the real components.
- **Video blocks show no duration badge.** `VideoPlaceholder.durationLabel` became optional: module.md carries no runtime, and a fabricated number on screen is worse than none.

### Current block spacing (measured, and the thing to fix next)

Blocks have **no padding of their own**. All vertical rhythm comes from one uniform 24px gap between siblings.

| | Measured |
|---|---|
| Slide column | 880px wide, 40px top / 40px bottom, 32px sides (24px below `md`) |
| Gap between any two blocks | **24px**, regardless of which two block types meet |
| Every text block's own padding | **0 / 0** |
| LeadPanel (the purple band *inside* `module-intro`, `chapter-intro`, `chapter-opening`, `chapter-outro`) | 28px top/bottom, 32px sides, 16px radius |
| Video block's `Card` | 12px all round |
| Interactive placeholder's `Card` | 32px all round |
| Chapter-outro "Coming up next" `Card` | 24px all round |

880px rather than `SlideLayout`'s 656px: the Figma composite blocks are 879px, and a 17-chip skills list or a three-up quote row does not fit 656px without wrapping into a column of slivers.

**Later the same round, on instruction:** each block now carries **40px on all four sides** and the gap between blocks went **24px -> 40px**. A temporary `DEBUG_BLOCK_OUTLINES` flag in `BlockSlide.tsx` draws a dashed stroke on each block box while the spacing is tuned — `outline`, not `border` or `ring`, because an outline paints outside the box without taking layout, so switching it on cannot move the spacing it is being used to measure. The slide column keeps its own 40px/32px padding for now, so blocks are 816px inside the 880px column; flagged rather than changed, since only the block numbers were specified.

**The column now widens when the outline rail collapses.** It was fixed at 880px, so collapsing the rail (330 -> 76px) just left 254px of dead space either side. `SLIDE_COLUMN_COLLAPSED_PX` is **derived** as `880 + (OUTLINE_RAIL_OPEN_PX - OUTLINE_RAIL_COLLAPSED_PX)` rather than written as `1134` — the two numbers have to move together, and Round 33 already shipped one bug from a hardcoded offset that stopped matching this same collapsible rail (the footer, 127px off centre). The column is `w-full` with that value as `max-width`, so a viewport too narrow for it simply caps at the available width (measured 1124px at a 1280px viewport) rather than overflowing. It transitions over the rail's own 200ms ease-out so the two move together.

The footer needed no change: it already reserves `railWidth + 32` and centres its slide pair in what remains. Measured, the pair's centre matches the column's centre to **0px** in all three cases — rail open (column 880, centre 1101), rail collapsed (column 1134, centre 974), and collapsed at a 1280px viewport (column 1124). `layout-audit.js` empty and no horizontal page scroll in every state.

### `ScrollCue` moved to `components/shared`

Slides can now exceed the content area (a Know What slide carrying four `<Text block_3>` strategy write-ups genuinely does), so the Consumer Portal's cue became the answer here too (direct instruction). Two things generalised on the move and nothing else: a `containerRef` (the player scrolls its own `<main>`, not the window — the cue is `absolute` in that case and `fixed` otherwise) and a `variant: 'app' | 'consumer'`, because the Consumer Portal is on `consumer-primary` and nothing app-wide may leak into it, or the reverse. The consumer call site renders identically.

### Three defects found by measurement, not by looking

1. **55 string literals had the wrong apostrophe.** The source mixes straight `'` and curly `’`; the transcription had normalised everything to curly. Caught by a new `verify-transcription.py`, which checks that every string of copy in the built data appears verbatim in the source. This is the mandated second pass, mechanised — it is not a check the eye passes.
2. **Duplicate React key.** Slide labels are not unique: a multi-scenario chapter has a "Transition" slide per scenario, and the rail keyed sub-steps by label. Console errors on every render. Key by step index.
3. **Slides with no heading at all.** You Might Also Hear and Your turn slides are *only* interactive placeholders, so there was no `<h1>` and nowhere for focus to land on arrival — the focus-to-`<body>` class this project has shipped in six rounds. The placeholder's pattern name is now a real heading.

### Deleted

The nine Round 7 screens (`ModuleIntroScreen`, `ChapterMarkerScreen`, `ChapterLearnScreen`, `CaseExampleScreen`, `KnowledgeCheckScreen`, `WhatToExpectScreen`, `ChapterCompleteScreen`, `ModuleOutroScreen`), the orphaned `ModulePlayerHeader` (unreferenced since Round 33), and `OutcomesSection` — whose only call site was an outcomes card whose three bullets were **invented** in Round 7.1, not sourced. Every word on the overview page is now traceable to the source file. `SlideLayout` stays, serving the two shell steps (feedback, complete) that have no module.md slide behind them.

Verified: `tsc -b` and `oxlint` clean, `layout-audit.js` empty on every slide type, no horizontal page scroll, console clean in a fresh tab, focus on the slide's own `<h1>` on every change, 30 built slides against 30 source slide rows, and all 336 strings verbatim.


### §96 continued — block type scale, spacing, and transition slides (2026-09-16)

All by direct instruction, applied to the block renderers only (nothing app-wide).

**Type roles inside a block** — Label `body-md` (16/600) · Title `display-md` (32/500) · Sub title `sub-greeting-semibold` (18/600) · Body `body` (16/400).

**Spacing chain** — Label ──24px── Title ──8px── Sub title ──8px── Body. Where a role is absent the next gap applies, so a Title followed directly by Body (the Module intro block has no Sub title) is 8px.

**Transition slides.** A slide whose *only* block is a `<Text block _Sub title>` is a transition beat — detected structurally, never by matching the slide's authored label. It renders centred, with an icon above, and its text bound to `<Text block _Title>`: read from Figma (`2584:1043`) as Inter Medium 32/500, letter-spacing −0.374, `neutral/black`, which is exactly `display-md` + `ink`, so it mapped to existing tokens rather than needing a new step.

The icon is the Consumer Portal's `CardIcon` treatment — a bare glyph, **no plate or tinted circle**, `size-10`, `strokeWidth={1.75}` — and is **chosen per slide against that slide's own copy**, not fixed for the pattern (`TRANSITION_ICONS` in `BlockRenderer.tsx`). Module 6: `Blocks`, `Search`, `Scale`, `SunMoon`. `icon` is the one block field module.md does not supply, so `verify-transcription.py` excludes it as authored.

**Figma mirror.** "Transition slide block" (`2596:1050`) was created in the block library's composite stack, in module.md slide order, matching the code. Its icon came in as the real lucide `footprints` vector via `figma.createNodeFromSvg` — a genuine export, never redrawn — and its layer is named as a per-slide swap slot. **`use_figma` resolved every node id the read tools returned**, which contradicts the Round 35 note above; that failure did not reproduce.

**Two findings recorded rather than acted on:**

1. ~~**`--text-sub-greeting` (18/400) disagrees with Figma's own `sub-greeting` style (18/500).**~~ **Resolved the same day — see below.**
2. **A page-scroll report that does not reproduce cleanly.** At 1100×560, `documentElement.scrollHeight` is 905 against a 560px viewport, yet `body.scrollHeight` is 560 and **no element has a box past the viewport with an unclipped ancestor**. The overflow is on `<html>`, outside the app's tree — consistent with the preview pane's viewport emulation, but it was reported from a real machine, so it stays open. Full working in `Coaching modules master/next-session-prompt.md` §A1, including the two false leads already eliminated.


### §96 continued — `sub-greeting` resynced to Figma, app-wide (2026-09-16)

**`--text-sub-greeting` weight 400 → 500.** Direct instruction to "streamline the subtitle 18md everywhere", which turned a naming question into a token correction.

The question was what "Sub title → 18md" meant; it shipped first as 18/600 on the reasoning that `-md` already means 600 here (`body-md` is 16/600). Figma settled it the other way: it publishes a style named **`sub-greeting` at 18px / Medium (500)**, which "18md" names exactly.

That surfaced the real problem. **The app's token of the same name was 18/400 — nothing in Figma has ever been 18/400.** It was picked up when Round 28 moved this step 20px → 18px and was drift, not a decision. So the fix was a resync rather than a local override, which is the same call Rounds 21.3 and 28 made whenever an app token and its Figma style disagreed.

What moved:
- the token, 400 → 500;
- the five block Sub-title call sites, from `sub-greeting-semibold` onto `sub-greeting`;
- **10 pre-existing call sites that inherit the token** — `ResearchPageHero` sub-copy, `DeliveryOnboarding` body, and sub-lines on My schedule, My profile, My Learning, My Notes and trainee Home. Each was already reaching for Figma's `sub-greeting`, so they became correct rather than merely changed.

`sub-greeting-semibold` (18/600) **stays**. Figma publishes it too, and its one remaining caller is the Plan Sessions wizard's step *heading* (Round 38) — a heading role, not a Sub title, so it is outside what "subtitle 18md" governs.

Both steps were already in `cn()`'s `tailwind-merge` font-size registry, so no call site silently dropped its size class — the Round 21.3 failure this project has hit once before.

Verified: block Sub titles and all 10 inherited sites render 18/500 live; `layout-audit.js` empty on the research home, My schedule, the player and the module overview; no horizontal page scroll; `tsc -b` and `oxlint` clean; the module transcription check still passes 336/336.

---

## §90 — `--primary` returns to `#3a00ad`; the module outro block rebuilt (2026-09-16)

### `--primary` `#4A278F` -> `#3a00ad`, app-wide

Direct instruction: *"primary purple is no longer the key token, it is 3A00AD."*

This **reverses §66/Round 23**, which had moved `--primary` the other way on the
strength of frame `152:176` using `Purple/700` for every brand-coloured element.
Both decisions now sit in `index.css` next to the token, the older one left intact
above the newer rather than overwritten — the reasoning for Round 23's call is
still the reasoning, it simply no longer wins.

It was asked as a **phased** rollout ("first only the trainee modules overview and
inner pages") and answered at the token, which is app-wide in one step. That was
chosen with the consequence stated, and it is recorded here because the phasing was
the original framing and someone will otherwise read the app-wide diff as a slip.

| | Old | New |
|---|---|---|
| `--primary` | `#4A278F` | `#3a00ad` |
| White on it | 10.62:1 | **11.82:1** |

Contrast was recomputed from the hex rather than carried over. Nothing regresses:
every filled control gains. `--ring` (`#5300fa`) stays brighter than `--primary`
and `--color-primary-hover` (`#200061`) stays darker, so the focus-ring-on-primary
and hover relationships §66 depended on both still hold.

One side effect worth naming: `--color-consumer-primary` is **the same hex**. The
two portals now share a value while keeping separate tokens. That is not a licence
to cross-reference them — the standing rule that nothing app-wide may leak into the
Consumer Portal, or the reverse, is about which token a surface may *name*, and it
is unchanged. What moved is what `--primary` points at.

**Verified live:** rasterised through a 1x1 canvas (Tailwind v4 emits `oklab()`, so
parsing the computed string as RGB returns nonsense) — painted `rgb(58, 0, 173)`.

### The module outro block

Rebuilt from a Figma template Dhruv authored mid-session (`2594:19665`). The block
library doc (`Coaching modules master/block-types-reference.md` -> "The module outro
block") is the spec; only the app-side decisions are recorded here.

- **Two proportions are derived, not transcribed.** The frame is 1281px wide;
  the player's card is **720px** at an open rail. A literal 330px pillow takes 47%
  of that and squeezes the module name to three lines with the CTAs stacked, so it
  renders at the frame's own ratio (27.5% of inner width) instead. Measured 179px
  live, CTAs back on one row.
- **The photo, its yellow wave AND its 4px `#FFCC4D` border are ONE export.**
  Same construction rule as `ConsumerModuleHeroWave`. The WebP is genuinely
  transparent below the crest (checked, per the Round 31 baked-plate trap).
- **That baked border is why the band is neither cropped nor rounded.** A first
  pass capped it with `max-h-[280px] object-cover`, which was safe while the
  export was a bare photo; against a baked border, cropping slices it off the
  cropped edges and a CSS radius rounds the corners straight through it. The
  Round 46 tall-band risk a cap guards against does not apply here — the band is
  bounded by the **slide column** (880px, 1134px collapsed), not the viewport, so
  its height tops out near 353px rather than growing without limit. Worth
  generalising: *a height cap is a viewport-proportionality fix, and a band
  constrained by a fixed-width column was never exposed to that problem.*
- **The template was revised four times on the day it landed** (spacing 40 -> 80
  -> 40, a 24px band-to-copy gap, title `display-lg` -> `display-md`, and the
  "Coming up next" number/name rows collapsed to one 18/500 line). The two outer
  gaps now differ — 24 and 40 — so the band, copy block and card cannot be
  flattened into one evenly-gapped column. They briefly were, and only the later
  revision exposed it. Full spec: `block-types-reference.md` -> "The module outro
  block".
- **Both CTAs are wired**, to the player's own two moves (advance a step; leave with
  progress kept — every step is already persisted). They take `caption-medium`, not
  the frame's 16/600, per the standing button rule, and the inverted white-fill /
  white-outline pair §67 established for the purple hero band. `OutroButton` falls
  back to `aria-disabled` + an `sr-only` cue if ever left unwired.
- Contrast measured on the painted pixels: **11.78:1** on all three pairs.

### A player defect worth generalising

The module player's whole page scrolled, and it had nothing to do with the player's
layout. Three `sr-only` spans in the outline rail had no positioned ancestor;
Tailwind's `sr-only` is `position: absolute`, so their containing block was the
*initial* one. They escaped every `overflow` clip up to `<html>` and added their
offset to the viewport's scrollable overflow.

The signature is distinctive and worth recognising: **`documentElement.scrollHeight`
overflows while `body.scrollHeight` is correct, and no element actually overflows.**
A hunt for the offending box returns nothing, because there isn't one — an
absolutely-positioned box whose containing block is the ICB contributes to the
viewport's scrollable overflow, not the body's. `<html>`'s scrollHeight equals the
*last* such span's bottom, exactly, which is why the number grows with rail height,
chapter count and browser zoom.

Round 30 hit the same trap horizontally (`sr-only` inside My Learning's carousel
widening the document to 2399px). This is its vertical twin. Fixed with `relative`
on the two buttons holding the spans.

---

## §97 — The module player's rail wash (2026-09-17)

A horizontal warm gradient behind the module player's outline rail, **moving
with the rail**. Frame `2065:1877` (trainee module player shell); only its
background was in scope ("check background..only").

### The frame's value, and why it is not transcribed

The frame puts it on the shell root as:

```
linear-gradient(to left, #fffcfa 60.157%, #fff8e5 83.057%)
```

Read left-to-right on the frame's own 1512px artboard: solid `yellow-50`
(`#fff8e5`) for the first **16.943%** (256px), fully back to `--background`
(`#fffcfa`) by **39.843%** (602px).

⚠️ **Those percentages describe one rail state and could not do what was asked.**
The instruction was that the wash *"moves with side nav"*, and a viewport
percentage cannot — collapse the rail and the wash would sit exactly where it
was. The frame's numbers are therefore re-expressed as **ratios of the rail's
right edge** (24px row inset + 330px rail = 354):

```
solid ends   256 / 354 = 0.7237
fade ends    602 / 354 = 1.7017
```

Measured live: rail open (330) -> wash 602px, exactly the frame. Rail collapsed
(76) -> wash 170px. Both derived, neither written.

### It is a sized layer, not a computed `background-image`

`background-image` **is not animatable**, so recomputing the stops on collapse
would make the wash jump while the rail glided. A width is animatable, so the
wash is a fixed-width layer holding a constant internal gradient
(`yellow-50` -> `yellow-50` at 42.52% -> `transparent`), carrying the rail's own
`transition-[width] duration-200 ease-out`. The two now move as one thing.

42.52% is `0.7237 / 1.7017` — the frame's solid stop expressed inside the layer
rather than against the viewport.

### Stacking

The layer is `-z-10` inside a `relative isolate` root, so it paints **above** the
root's `bg-background` and **below** every slide, the header and the footer.
Verified by walking `elementFromPoint` down from a point in the visible band: the
whole chain is `rgba(0,0,0,0)` until the root's own `rgb(255,252,250)`, so
nothing opaque covers it.

### Desktop only, and an open question

Gated `hidden lg:block` — **the same breakpoint the rail itself uses**
(`ModulePlayerNav` is `hidden … lg:block`). Below `lg` there is no side nav for
the wash to sit behind or move with, so a warm band there would have nothing to
explain it. Verified: 768px and 375px both render `display: none`.

⚠️ **The instruction said "desktop and tablets".** Tailwind's `lg` is 1024, so a
768-1023px tablet gets **neither** the rail nor the wash today. Extending the
wash down to `md` would mean deciding what it follows when there is no rail —
a separate call, flagged rather than guessed.

---

## §98 — Module player: the end of a module (2026-09-18)

A long direct chat-edit session across the module player's last three screens, with
~14 instructions arriving mid-turn, several as freehand annotations over the live
page. One Figma frame (`2695:1055` "Feedback Block"), everything else derived.

### New shared component: `components/shared/FeedbackPillow.tsx`

The five feedback pillows — artwork, moods, selected fills, idle beat — **extracted
from `SessionFeedbackModal` at their second caller**, the same rule `AnswerOutcome`,
`Toast` and `MeetingsSection` were extracted under. The consumer file imports them
back under their old names (`FEEDBACK_MOODS`, `MoodArt`) so its body is unchanged.

It matters more than usual here: every number in that file was measured against a
frame, several of them twice, and a second copy would drift on the first re-export.

**Only the pillow moved.** The card around it stays with its caller, because the two
genuinely differ in *layout* rather than colour — the consumer's is a 60vw
row-reversed strip that becomes a column at `sm`; the module player's is one of five
equal `flex-1` cards in an 880px slide column. That is the case the standing rules
say to build locally rather than serve with a flag.

The `consumer-pillow-*` keyframes live in `consumer-tokens.css`, which `index.css`
imports globally, so the beat runs in the module player too. The class names keep
their `consumer-` prefix: renaming them would touch the stylesheet, both callers and
the keyframes for no behavioural gain.

**Five of the 51 broken asset paths closed** on the way — the pillows' `ART` was
root-absolute and 404s off a sub-path.

### Two measurement lessons

**`text-balance` does nothing past four lines.** The module-summary paragraph runs to
six and was reported as orphaning. Every engine that ships `text-wrap: balance` caps
it at four lines, so the class was inert. `text-pretty` is the rule for a paragraph
that long — it leaves the earlier lines alone and only pulls a word down to stop a
one-word last line. Measured after: 3 words on the last line at 1512, 4 at 375.

**`layout-audit.js` cannot see a row that is merely too cramped.** Five `flex-1` mood
cards at 375px measured **37px wide holding 56px pillows** — overlapping artwork,
colliding labels — and the audit returned empty, because nothing overflowed and
nothing scrolled. This is the second time that blind spot has hit (the free-text
feedback bubble was the first). **Look at a 375px screenshot; the audit is not a
substitute for it.**

### Reuse beats improvement

The mood card's hover is `hover:bg-parchment`, byte-identical to the consumer card.
A first pass *also* darkened the border to the mood's own shade, reasoning that
white -> parchment is only a ~10-per-channel shift and therefore near-invisible —
which is true in general and was the wrong call here. Two copies of one control
hovering differently is the drift the shared file exists to prevent. Corrected on
direct instruction: **"use consistent components, remember this, until I
specifically ask"** — now a standing rule, not a one-off.

### `SlideLayout` deleted

The player's old eyebrow/title/body chassis. It was reviewed on 2026-09-16 and
deliberately kept for "the two shell steps that have no module.md slide behind
them — feedback and complete"; both outgrew it this round, leaving it at **zero
callers**. `BlockSlide` is now the player's only slide chassis, and the five comments
elsewhere that cited `SlideLayout`'s focus pattern now cite `BlockSlide`'s.

### The outro band is two layers now, and that is not a §78.1 violation

The re-exported band (frame `2598:1043`) is a 1281x360 box carrying a radial purple
gradient with the 1281x327.92 export pinned to its top. The export's own lower
corners are **genuinely transparent** — the alpha channel was counted, not assumed —
and the gradient is what shows through them.

The photo and its wave are still one export. The gradient is the *backdrop* it is
drawn over, transcribed verbatim from the frame (a `userSpaceOnUse` radial with a
matrix transform, which CSS's own `radial-gradient()` cannot express) rather than
re-derived as a flat fill, which would band visibly where the two meet.

### One label, one destination

The "Coming up next" card ended the session with **one** CTA. Its sibling's label
went *Resume back later -> Back to your modules -> Go back home -> Go to my
learnings* across four instructions, chasing the player footer's own primary, before
the button itself was deleted as repetitive. The lesson is in the sequence: when a
control keeps needing a new name to distinguish it from another control, the second
control is the problem.

Every rename moved its destination with it. A button reading "home" that lands on the
module list is the copy-vs-behaviour mismatch this project's reviews keep catching.

### §98a — `--primary` is settled at `#3a00ad` (2026-09-18)

Direct instruction: *"from now on #3a00ad is the primary, not purple 700."*

The code needed no change — `index.css` has said `#3a00ad` since the 2026-09-16
reversal. What was wrong was the **standing rule** in the app's `CLAUDE.md`, which
still carried Round 23's "`--primary` is `purple-700` `#4A278F`" and is the line a
future session reads as current law. Corrected, along with `index.css`'s own comment
block and the module-folder handover.

Worth recording *why* this drifted twice rather than just what it is now. Round 23
moved the token because frame `152:176` painted every brand element `Purple/700` and
nothing `#3a00ad` — reasonable at the time, and exactly the wrong inference. **A
frame using `Purple/700` is a call site to map onto `--primary`, not a reason to
repoint `--primary`.** That is now the written rule, so the next set of frames
cannot restart the loop. `--color-purple-700` stays on the ramp for anything that
genuinely wants that step.

One consequence to keep straight: `#3a00ad` is also `--color-consumer-primary`'s
hex, so the two portals now share a painted value while keeping separate tokens.
The Consumer Portal rule — never `--primary` on a consumer surface — is about
**provenance, not colour**, and still holds. Do not "simplify" by merging them.

**Still open:** `#3a00ad` is not a published Figma paint style. The block library's
own labels use it as a raw fill, which is why there was nothing in the file to point
at when the question came up. Publishing it as a named style — beside `Purple/700`,
not replacing it — would close the loop properly.
