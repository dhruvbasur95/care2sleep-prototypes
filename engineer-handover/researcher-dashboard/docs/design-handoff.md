# Developer handoff — Care2Sleep Research Dashboard

This spec describes what the Research Dashboard **actually renders**, measured
from the running app (`npm run dev`, port 5199) via `getComputedStyle` and
canvas rasterisation. It is not a transcription of Tailwind classes, and it is
not a Figma read. Where a measured value contradicts a project note or a code
comment, the measured value is the one recorded here and the contradiction is
listed in *Open items* at the end.

Companion document: **`docs/design-tokens.md`** is the token index. This file
does not repeat it in full — it states the values an engineer needs in-line and
goes deeper on layout, components, states, responsive behaviour and motion.

**Scope.** Eight routes, one portal. The Coach Delivery Portal, Consumer Portal
and coach training portal are not part of this package and no screen here links
to them.

| Route | Screen |
|---|---|
| `/research/schedule` | Home (sidebar label "My Home"; `/` redirects here) |
| `/research/trainees` | Trainee Management |
| `/research/coaches/:coachId` | Trainee record — 5 tabs |
| `/research/spaces-coaches` | Coach Management |
| `/research/spaces-coaches/:coachId` | Coach record — 4 tabs (Assigned Consumers has 3 sub-tabs) |
| `/research/consumers` | Consumer Management |
| `/research/consumers/:dyadId` | Consumer record — 1 tab (row hidden) |
| `/research/account` | My Profile |

**What this is.** A coded design prototype. State is a React context over
seeded fixtures — no backend, no auth, no persistence beyond one `localStorage`
key. Read `app/src/App.tsx`'s header comment and
`app/src/components/shared/InertButton.tsx` before estimating: the second is
the index of every control that is drawn but has no write path.

---

## 1. Design tokens

Source of truth: `app/src/index.css`. Tailwind v4, `@theme inline` — note that
**`@theme inline` does not emit CSS custom properties at runtime**, so
`var(--color-purple-700)` resolves to nothing in the browser. Only the
`:root` block tokens (`--primary`, `--background`, `--ring`, …) are real
runtime variables. This matters if you write dynamic styles.

### 1.1 Colour — brand

`--primary` is **purple `#4A278F`** (`purple-700`). Every brand-coloured
element resolves here. White on it measures **10.62:1** (AAA).

| Token | Value | Where it actually appears |
|---|---|---|
| `--color-purple-50` | `#f3efff` | List-page hero band; every table header row |
| `--color-purple-200` | `#e4d6ff` | = `--color-card-header` |
| `--color-purple-300` | `#c2a3ff` | — no reader |
| `--color-purple-400` | `#a070ff` | `--color-link-on-dark` (no reader — see Open items) |
| `--color-purple-500` | `#8447ff` | StatCard icon; PLE role badge |
| `--color-purple-700` | `#4A278F` | **`--primary`** — buttons, record-page hero band, active nav |
| `--color-purple-900` | `#200061` | `--color-primary-hover` |
| `--color-purple-950` | `#08001a` | — no reader |
| `--color-on-purple-muted` | `#c4b5fc` | Idle tab labels on the purple hero band. **Measured 5.74:1** on `purple-700` |
| `--color-yellow-50` | `#fff8e5` | Section shells |
| `--color-yellow-100` | `#fff0cc` | **StatCard fill** (measured), contact-detail panels |
| `--color-yellow-200` | `#ffe299` | Meetings-table day header |
| `--color-yellow-300` | `#ffcc4d` | **Record-page active tab underline.** 7.08:1 on the purple band |
| `--color-yellow-400` | `#ffb600` | Carer role badge, timeline markers |
| `--color-alert-pastel` | `#e45f5b` | Attention-section icons and count badge |

The ramp has deliberate gaps (no `purple-100/600/800`, no `yellow-*` above
400). It is an 8-step brand ramp, not a synthesised 11-step one — do not
interpolate new steps.

### 1.2 Colour — neutrals and canvas

**The page canvas is warm `#fffcfa`, not white.** Cards and the sidebar are
pure `#ffffff`. That difference is the entire reason the canvas tint exists —
but measured, **card-on-canvas is only 1.02:1**, so the card's border and
shadow are doing all the separation work. Do not remove either.

| Token | Value | Role |
|---|---|---|
| `--background` | `#fffcfa` | Page canvas (warm) |
| `--card` / `--popover` | `#ffffff` | Cards, sidebar, header menus |
| `--color-ink` | `#1a1a1a` | Primary text |
| `--color-ink-muted` | `#333333` | Secondary text, card-header subtitles |
| `--color-ink-faint` | `#6d6d6d` | Meta text, timestamps, placeholders |
| `--color-parchment` / `--color-pearl` / `--color-divider-soft` / `--muted` / `--secondary` / `--accent` | `#f5f5f7` | **All six are the same colour.** One off-white in the app |
| `--color-hairline` / `--border` / `--input` | `#e0e0e0` | Every rule, border and divider |
| `--color-header` | `#000000` | Global header bar |
| `--color-on-dark-muted` | `#cccccc` | Header account-menu label |
| `--color-success` | `#1f7d37` | |
| `--destructive` | `#d70015` | |
| `--ring` | `#5300fa` | Focus ring — deliberately brighter than `--primary` |

**Measured text contrast** (canvas rasterisation, WCAG relative luminance).
Bold = fails AA 4.5:1.

| | white `#ffffff` | canvas `#fffcfa` | off-white `#f5f5f7` | card-header `#e4d6ff` | yellow-100 `#fff0cc` | purple-50 `#f3efff` | purple-700 `#4A278F` |
|---|---|---|---|---|---|---|---|
| `ink` | 17.40 | 17.04 | 15.98 | 12.73 | 15.41 | 15.42 | **1.64** |
| `ink-muted` | 12.63 | 12.37 | 11.60 | 9.24 | 11.18 | 11.19 | **1.19** |
| `ink-faint` | 5.17 | 5.07 | 4.75 | **3.78** | 4.58 | 4.58 | **2.05** |
| `primary` | 10.62 | 10.39 | 9.75 | 7.77 | 9.40 | 9.40 | **1.00** |
| `primary-hover` | 17.02 | 16.66 | 15.63 | 12.45 | 15.06 | 15.07 | **1.60** |
| white | — | — | — | — | — | — | 10.62 |

Two rules fall straight out of that table:

- **`ink-faint` must never be used on the card-header band** (3.78:1). Use
  `ink-muted`. This is a live constraint, not a theoretical one.
- `ink-faint` on `yellow-100` and `purple-50` clears AA by 0.08. If either hex
  moves, re-measure rather than assuming.

### 1.3 Type

**Inter throughout**, self-hosted via `@fontsource-variable/inter`. `--font-sans`
and `--font-display` both resolve to Inter but stay separate tokens.

**Every `--text-*` line height is `normal`** — one exception, `caption` at
`130%`, and `display-xl` at `1.05`. Do not reintroduce ratios; the app's old
1.1–1.43 ratios were drift, and `normal` is what matches the Inter metrics the
design was drawn in.

| Token | Size | Weight | Letter-spacing | Line height | Measured use |
|---|---|---|---|---|---|
| `display-xl` | 56px | 500 | −1px | 1.05 | No reader in this package |
| `display-lg` | 40px | 500 | 0 | normal | **Every page `<h1>`** — list heroes and record-page names |
| `display-md` | 32px | 500 | −0.374px | normal | **StatCard values** (measured 32/500) |
| `sub-greeting` | 18px | 400 | 0 | normal | Hero sub-copy only. A card's sub-line is `caption` |
| `title` | 22px | 500 | 0 | normal | Card titles, `TabIntro` heading |
| `body-md` | 16px | 600 | 0 | normal | Emphasised body, record eyebrow |
| `body` | 16px | 400 | 0 | normal | Body copy, `TabIntro` sub-copy |
| `caption-medium` | 14px | 500 | −0.224px | normal | **All buttons**, table `<th>` |
| `caption` | 14px | 400 | −0.224px | **130%** (18.2px) | Table `<td>`, meta copy |
| `fine` | 12px | **600** | −0.12px | normal | Chips, timestamps, counts |

Two things that are not steps and are deliberate:

- **15px** is the tab type size (`text-[15px]`), used by `UnderlineTabs` only.
  Buttons moved to `caption-medium` (14px) and tabs did not, so **buttons and
  tabs are diverged**. Measured: section tab 15px/600 selected, 15px/500 idle;
  button 14px/500.
- Record-page tabs are a third size again — measured **14px/500 selected,
  14px/400 idle**. They are built inline, not through `UnderlineTabs`.

There is **no responsive type scale**. `<h1>` measures 40px at 1600px, 768px
and 473px alike.

### 1.4 Spacing, radii, shadows

**Spacing is stock Tailwind.** There are no custom spacing tokens. The values
that recur and are load-bearing are given in §2.

| Radius token | Value | Use |
|---|---|---|
| `--radius-xs` | 4px | Third-level nesting inside a card |
| `--radius-sm` | 8px | Utility buttons, inputs, panels inside cards |
| `--radius-md` | 11px | Capsules |
| `--radius-lg` / `--radius-xl` | 16px | **Cards** |
| `--radius-2xl` / `3xl` / `4xl` | 24 / 28 / 32px | — |

Nesting rule: a rounded element inside a card takes **half** its parent's
radius (16px card → 8px inner panel → 4px inner-inner). `StatCard` is a
deliberate literal `rounded-[12px]`, not `--radius-md`'s 11px.

| Shadow token | Value | Use |
|---|---|---|
| `--shadow-card` | `2px 4px 16px 0 rgba(230,194,127,0.2)` | Every `<Card>`, by default |
| `--shadow-notice-card` | `4px 4px 12px 0 rgba(0,0,0,0.06)` | Attention cards |
| `--shadow-float` | `3px 5px 30px rgba(0,0,0,0.22)` | No reader — kept as a system value |

`--shadow-card` is a **warm gold**, offset down-and-right — not a neutral
whisper. Verified live on a card: `rgba(230,194,127,0.2) 2px 4px 16px 0px`.
A grey shadow reads as dirt against the warm canvas.

---

## 2. Layout system

### 2.1 Shell

Every page mounts its own `ResearchShell` instance
(`components/research/ResearchShell.tsx`).

```
┌─ header  h=48px, bg #000000, position:sticky, z-30, full-bleed ──────────┐
├──────────┬───────────────────────────────────────────────────────────────┤
│ aside    │ motion.main  #main-content  tabIndex={-1}  min-w-0 flex-1     │
│ sticky   │  ├─ topBanner   (optional, sticky top-12, z-20)               │
│ top-12   │  ├─ hero        (full-bleed band)                             │
│ z-10     │  ├─ heroBelow   (optional second full-bleed strip)            │
│ 64/240px │  └─ content     px-6 pb-16 md:px-20                           │
└──────────┴───────────────────────────────────────────────────────────────┘
```

**Measured at 1600px viewport:**

| | Value |
|---|---|
| Header height | 48px, `#000000`, sticky, z-30 |
| Sidebar collapsed / expanded | **64px / 240px**, sticky `top-12`, `h-[calc(100dvh-3rem)]`, white, 1px right hairline |
| `<main>` width | 1536px (collapsed) / 1360px (expanded) |
| Content column max-width | **1320px**, centred (`mx-auto max-w-[1320px]`) |
| Content gutter | 24px (`px-6`), **80px at `md`+** (`md:px-20`) |
| Content bottom padding | 64px (`pb-16`) |

⚠️ The **hero band and the content column share the same `max-w-[1320px]` and
`md:px-20` gutter**. They must move together — otherwise a record page and the
roster it opens from visibly misalign as you navigate.

⚠️ `<main>` carries `tabIndex={-1}`. Two things depend on it: the header's
"Skip to main content" link, and `NotificationHubView`'s fallback focus target
when it hides itself on the last dismiss. A bare `id` is not a focus target.

⚠️ **Anything in `useState` in the shell resets on navigation**, because each
page mounts its own instance. The sidebar's collapsed flag uses `localStorage`
for exactly this reason.

### 2.2 Hero band — two treatments

**List pages** (Home, Trainee/Consumer/Coach Management, My Profile) — via
`ResearchPageHero` inside `ResearchShell`'s `hero` slot:

- Surface `bg-purple-50` `#f3efff`, passed as `heroClassName`
- Padding measured **`80px 80px 40px`** at `md`+ (`px-6 pt-16 md:px-20 md:pt-20`
  + `pb-8 md:pb-10` from `heroNoSeam`)
- `<h1>` `display-lg` 40/500 in `purple-700`; sub-copy `sub-greeting` 18/400
  `ink`, capped at `72ch`
- Title→sub-copy gap 8px (`mt-2`)
- **`heroNoSeam` is required** on any hero that does not end in a tab row.
  Without it the band has no bottom padding and sits flush against content.

**Record pages** (trainee, consumer, coach) — built inline, *not* via
`ResearchPageHero`:

- Surface `bg-purple-700` `#4A278F`, `border-b border-hairline`
- Padding measured **`40px 80px 0`**; band height **259px** (trainee record)
- Back link → white `caption-medium`, then eyebrow (`Trainee:`) `body-md` 16/600
  in `parchment` (9.75:1), then `<h1>` `display-lg` 40/500 white (10.62:1)
- Tab row `mt-[33px]`, `items-end`, `gap-8`; tabs `min-h-11` (44px)
- Active tab white + `yellow-300` 3px underline; idle `on-purple-muted`

Two numbers in that hero are load-bearing and commented as such in code:

- **`mt-[33px]`** — the design specifies 48px to the tab *text*, but a
  `min-h-11` button bottom-aligns its text 15px lower inside the box. 48−15=33,
  and 33+44 is also what closes the band at its intended height. Do not "tidy"
  it to `mt-12`.
- **`-my-3 py-3` + `flex w-fit`** on the back link (not `inline-flex`). An
  inline-level box sits in a line box whose strut is taller than its text, so
  the negative margins never fully cancel and the band renders ~7px taller.

### 2.3 Spacing between hero and content

Three mutually exclusive closes, in priority order (`ResearchShell`):

| Case | Hero bottom | Content top |
|---|---|---|
| `heroBelow` present, `heroFlushBelow` | none | tightened |
| `heroBelow` present, no flush | `pb-8 md:pb-10` | — |
| `heroNoSeam` (plain title hero) | `pb-8 md:pb-10` (40px) | `pt-16 md:pt-20` (80px) |
| Default (hero ends on a tab row) | `border-b border-hairline`, no padding | **0** — the seam supplies the separation |

Measured on the trainee record page: content div padding `0px 80px 64px` —
zero top inset, because the tab row's underline *is* the seam.

### 2.4 Sidebar

`components/research/ResearchSidebar.tsx`. Five destinations: Home, Trainee
Management, Consumer Management, Coach Management, My Profile.

- Collapsed **64px** / expanded **240px**; `transition-[width] 200ms cubic-bezier(0,0,0.2,1)`
- Nav items measured **215×44px** when expanded
- Collapsed state persists to `localStorage['c2s-research-nav-collapsed']` —
  **a fixed key, not namespaced by user or environment.** This is the only
  persistence in the package
- Collapsed items are real `NavLink`s wrapped in a styled `Tooltip`
  (`side="right"`), not a native `title` — native tooltips appear too slowly to
  serve as the only label
- The toggle carries `aria-expanded` and a swapped `aria-label`

**Active-state inconsistency, worth knowing before you touch it:** Consumer and
Coach Management stay highlighted on their own record pages because those live
under the same path prefix. The trainee drill-in is at `/research/coaches/:id`
while its nav item points at `/research/trainees` — a *different* prefix — so
**Trainee Management loses its active state on a trainee record page**. This is
a routing artefact, not a styling bug.

---

## 3. The three canonical button styles

All three are **36px tall** (`h-9`) — measured, all instances. The 36px floor
outranks any smaller height in a design. Note `h-9` is a *height*, not a
minimum: a flex child needs `shrink-0` or flex-shrink will compress it below
the floor.

### 3.1 Primary filled

```
h-9 rounded-full bg-primary px-[18px] text-caption-medium text-white
hover:bg-primary-hover
```

**Measured:** h 36px · bg `rgb(74,39,143)` · white · 14px/500 · ls −0.224px ·
padding `0 18px` · radius fully round. **21 call sites.**

Use: the one primary action on a surface. Home's `Schedule session`, meetings
`Start`, wizard `Continue`/`Add trainee`.

### 3.2 Primary outline

```
h-9 rounded-full border border-primary px-[18px] text-caption-medium text-primary
hover:bg-primary/5
```

**Measured:** h 36px · transparent · `rgb(74,39,143)` text · 1px
`rgb(74,39,143)` border · 14px/500 · padding `0 18px`. **11 call sites.**

Use: secondary action beside a filled one, and every attention-card CTA
(`Assign a coach`, `Check sync`, `View invite`) where it renders `w-full`.

### 3.3 Utility

```
h-9 rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted
hover:bg-divider-soft
```

**Measured:** h 36px · bg `#f5f5f7` · `rgb(51,51,51)` text · 8px radius ·
padding `0 16px`. **4 call sites.**

Use: small inline actions — `Edit`/`Delete` on a meeting row, `Change password`,
certificate `Download`/`Share`.

⚠️ **`bg-pearl` is a cool grey (`#f5f5f7`) and the canvas is warm (`#fffcfa`).**
Inside a white card it is correct. Sitting directly on the page canvas it reads
as a foreign patch — use a transparent fill there instead.

⚠️ **Measured divergence:** `MeetingsSection.tsx:57` is the one utility button
using `text-caption` (14/**400**) where the other three use `text-caption-medium`
(14/**500**). Confirmed live on Home's `Edit`/`Delete`: `fontWeight: 400`,
`lineHeight: 18.2px`. See *Open items*.

### 3.4 Quick-action pill (Home only)

A fourth shape exists on Home's purple bar and is not one of the three:

```
h-9 rounded-sm bg-card px-5 text-caption-medium text-primary-hover
hover:bg-purple-50
```

**Measured:** h 36px · white fill · `rgb(32,0,97)` text · 8px radius · padding
`0 20px`. It sits on `bg-primary`, so its focus ring carries
`ring-offset-primary` — **that offset colour must stay in step with the bar's
own background**, or the ring's offset is painted in a colour that is no longer
there.

### 3.5 Inert controls — read this before estimating

The design deliberately draws controls with **no write path**. The convention:
a focusable `<button aria-disabled="true">` carrying an `sr-only` " (coming
soon)". `components/shared/InertButton.tsx` is the shared implementation and
its doc comment is the to-build list.

`appearance` controls how inert it *looks*, never how inert it *is*:

| | Rendering |
|---|---|
| `dimmed` (default) | muted, `cursor-default`. The `Edit`/`Delete` pair |
| `active` | **visually identical to a live control**, hover and press included. `cursor-pointer` is required — a `<button>` computes to `cursor: default`, so an inert pill beside real `<a>` pills gives itself away on hover without it |

⚠️ `grep -rn InertButton src` returns only 6 of ~14 inert controls. Eight more
follow the same convention hand-rolled (links and icon buttons). Use
`grep -rn "coming soon" src` for the fuller sweep. Do not treat absence from
`InertButton.tsx` as proof a control is live.

The bell in `AppHeader` is the one control that **breaks** the convention: it
is a `<span>`, keyboard-unreachable, relying on a native `title`.

---

## 4. Card contract

One primitive: `components/ui/card.tsx`. There is **no `CardHeader`/`CardContent`
sub-component API** — the six stock shadcn parts were deleted. Every card is a
bare `<Card>` plus utility classes.

**Defaults every card gets — never repeat these at a call site:**

| | Measured |
|---|---|
| Radius | **16px** (`rounded-xl` → `--radius-xl`) |
| Outline | **1px solid `#f5f5f7`** (`border border-parchment`) |
| Shadow | `rgba(230,194,127,0.2) 2px 4px 16px 0px` |
| Background | `#ffffff` |
| Overflow | `hidden` |

- The outline is a **border, not a ring**. A ring paints *outside* the box; a
  border is part of it — which is what makes `overflow-hidden` clip a
  full-bleed child band to the corner radius. Do not swap it back to `ring-*`.
- **Absence is opt-in**: a card with no outline passes `border-0`; one with no
  shadow passes `shadow-none`.
- Modals and menu popups are *not* cards and keep `ring-1 ring-hairline`.

### 4.1 The header-band rule (§35a) — and where it no longer holds

The documented house pattern: a `bg-card-header` (`#e4d6ff`) band as the card's
**first child**, then `border-t border-hairline`, then the content section.
Card titles are sentence case. Band `border-radius: 0` so the card's own 16px
clips it.

**Measured reality: only 8 real call sites use `bg-card-header`**, and they are
concentrated in My Profile and the add-trainee wizard. The Round 23 record-page
rebuild replaced the band with a **`purple-50` (`#f3efff`) table header row with
no bottom stroke** — the tint *is* the boundary. That is a real, frame-driven
divergence and it is now the majority pattern (55 `bg-purple-50` uses).

An engineer rebuilding a card needs to know which of the two they are matching.
See *Open items*.

Documented exception to the band rule: pure message+CTA cards with no distinct
content section.

⚠️ Card-header subtitles must use `text-ink-muted`. `ink-faint` measures
**3.78:1** on the band and fails AA.

---

## 5. Component inventory

### 5.1 Shared — change once, changes everywhere

| Component | Props | Notes |
|---|---|---|
| `ResearchShell` | `children`, `hero?`, `heroNoSeam?`, `heroClassName?`, `heroBelow?`, `heroFlushBelow?`, `topBanner?` | Page chassis. All slots optional; every default reproduces the plain list-page layout. `topBanner` is **not** wrapped by the max-width div — a caller must match the content width itself |
| `ResearchPageHero` | `title`, `subtitle`, `action?`, `actionAlign?: 'start' \| 'end'` | All five list pages. Renders **contents only** — the band's surface and padding belong to the shell. `actionAlign='start'` top-aligns the CTA with the title (Home's `Need help`); default `end` bottom-aligns it with the sub-copy |
| `StatCard` | `label`, `value?`, `valueLabel?`, `icon`, `breakdown?`, `breakdownLayout?: 'inline' \| 'stacked'` | The yellow KPI tile. **28 instances / 6 files.** Measured 318×120px in a 4-up row, `gap-4`, `bg #fff0cc`, `rounded-[12px]`, `p-4`, value 32/500 |
| `UnderlineTabs` | `tabs`, `active`, `onChange`, `ariaLabel`, `layoutId`, `idPrefix`, `panelId` | Section-level tabs. Fully controlled — owns no state |
| `SearchInput` | `id`, `label`, `value`, `onChange`, `placeholder`, `className?`, `widthClassName?` | Measured 340×36px, fully-round, 1px `#e0e0e0`, `pl-10 pr-4`. Every caller passes `sm:w-[340px]` |
| `EmptyState` | `icon`, `copy`, `className?` | 48px `bg-primary/10` circle + 20px `primary` icon + one `caption`/`ink-muted` line |
| `InertButton` | `label`, `className`, `children?`, `appearance?` | See §3.5 |
| `MeetingsSection` | `rows: ScheduleRow[]`, `title?`, `idNamespace` | Day-grouped Upcoming/Scheduled table. `idNamespace` **must be unique per mounted instance** (`framer-motion` `layoutId`) |
| `NotificationHubView` | `title?`, `items`, `uniformHeight?`, `hideWhenEmpty?`, `onEmptyChange?` | The attention section |
| `WizardProgressRail` | `steps`, `current`, `ariaLabel`, `liveTextVisible?`, `liveTextSuffix?` | |
| `WizardStepHeading` | `step`, `stepCount`, `heading`, `subtitle?`, `headingRef?` | Plus `STEP_CONTENT_GAP` for the space below |
| `modalFooter` | `MODAL_FOOTER_SURFACE`, `_COMPACT` | Surface only — call sites add layout |
| `Card` | `className?`, `size?: 'default' \| 'sm'` | `size` tightens `--card-spacing` only |

### 5.2 Research-specific — shared across pages

| Component | Props | Notes |
|---|---|---|
| `StatusChip` — `Chip` | `tone`, `label` | Six tones (§6.4). Also `CoachStatusChip`, `CertificationChip`, `InviteStatusChip` bind a domain enum to a tone |
| `TabIntro` | `title`, `subtitle` | Per-tab heading on all three record pages — **15 panels** |
| `ConfirmDialog` | `open`, `title`, `body`, `confirmLabel`, `cancelLabel`, `destructive?`, `singleAction?`, `confirmDisabled?`, `onConfirm`, `onClose`, `children?` | |
| `ResearchSidebar` | — | |
| `ResearchNotificationHub` | — | Builds study-wide notices, renders through `NotificationHubView` |
| `SessionsPlanOverview` | `dyad` | **Read-only by requirement, not omission** — researchers must not mark sessions complete or unlock modules. Do not add an action column |
| `AddCoachTraineeModal`, `OnboardCoachDialog` | — | The only two working write paths in the package |

### 5.3 Page-local — do not import across pages

- `SupervisionRecords` is defined in `SpacesCoachProfilePage.tsx` and imported
  by `CoachProfilePage.tsx`. `RecordRowDivider` is defined in
  `CoachProfilePage.tsx` and imported back. **This is a circular import.** It
  resolves today only because both are function declarations used at render
  time; any module-evaluation-time dependency across the cycle breaks at load.
- `dyadHealthAlerts` / `hasRecentGap` are exported from `ConsumerDetailPage.tsx`
  and imported by `components/research/ResearchNotificationHub.tsx` — a
  component depending on a page module. The >48h sync-gap rule therefore lives
  in the presentation layer.
- The **"Key updates" panel is copy-pasted**, not shared, between
  `CoachProfilePage` and `ConsumerDetailPage`. Wiring one and not the other is
  a live risk — extract before implementing.
- `inputClass` is redeclared privately in **seven** files.

### 5.4 Present but unreachable

`PlanSessionsModal.tsx` and `EditSessionPlanModal.tsx` (~1,470 lines combined)
have **no mount point**. Both carry ⚠️ headers. Two store actions
(`bulkSetSessionPlan`, `toggleSession`) grep as wired but their only callers sit
in these files — a `grep` shows callers and misleads.

---

## 6. Interaction states

### 6.1 Focus — one ring, app-wide

`focus-visible:ring-2 focus-visible:ring-ring` (129 / 120 occurrences), plus
`focus-visible:ring-offset-2` on 38 controls that sit on a tinted surface.

- `--ring` `#5300fa` measures **7.64:1 on white**, **7.48:1 on the canvas** —
  comfortable.
- ⚠️ **On a filled primary button the ring measures only 1.39:1 against the
  button's own fill.** It is legible only because it extends past the button
  edge onto the page. Any filled-primary button that gets `ring-inset`, or sits
  flush inside a purple container without an offset, loses its focus indicator.
  This is why `--ring` is a brighter purple than `--primary` in the first place,
  and why the ring must never be moved inside.
- Nine controls use `focus-visible:ring-white` (on dark/purple surfaces).
- One uses `focus-visible:ring-offset-primary` — Home's quick-action pills.

**Focus-to-`<body>` is this codebase's most-repeated defect.** Any control that
unmounts on click (dismiss, submit, step-advance, Edit/Cancel toggle) must move
focus somewhere deliberate. There are six deliberate rescues across the record
pages alone. Two rules learned the hard way:

- Inside a modal it is worse than usual: the Tab trap is a `keydown` handler on
  the panel, so once focus reaches `<body>` the trap stops receiving events and
  Tab escapes to the page behind.
- A pager/stepper rescue **must run in an effect, not the click handler** — in
  the handler the sibling button is still disabled from the previous render.

### 6.2 Hover — measured composited values

⚠️ **A tint below ~8% opacity composites to an invisible change.** Verify the
composited colour, never the presence of the class.

| Hover | Composited over white card | Δ per channel | Composited over canvas |
|---|---|---|---|
| `hover:bg-primary/5` (outline pill) | `#f6f4f9` | −9, −11, −6 | `#f6f1f4` |
| `bg-primary/8` (chip fills) | `#f1eef6` | −14, −17, −9 | `#f1ebf1` |
| `bg-primary/10` (EmptyState badge) | `#ede9f4` | −18, −22, −11 | `#ede6ef` |
| `hover:bg-purple-50` (quick-action pill) | `#f3efff` | −12, −16, 0 | — |
| `hover:bg-divider-soft` (utility) | `#f5f5f7` | −10, −10, −8 | — |
| `hover:bg-primary-hover` (filled) | `#200061` | large | — |

`hover:bg-primary/5` at a ~9–11 per-channel shift is **at the edge of
perceptible**. It is present and measurable, but it will be reported as "no
hover state" by some users on some displays. Flagged in *Open items*.

### 6.3 Active / disabled

- **Active:** `active:scale-[0.97]` on utility buttons and the notification
  dismiss-all. Not applied to pill buttons.
- **Transitions measured:** `color, background-color, border-color, outline-color,
  text-decoration-color, fill, stroke` at **150ms `cubic-bezier(0.4,0,0.2,1)`**
  is the dominant pattern (Tailwind `transition-colors`). Sidebar width is
  **200ms `cubic-bezier(0,0,0.2,1)`**.
- **Disabled:** there are almost no truly `disabled` controls. The pattern is
  `aria-disabled="true"` + `sr-only " (coming soon)"` — see §3.5. A genuinely
  disabled wizard button uses `confirmDisabled` on `ConfirmDialog`.

### 6.4 Status chips — measured, all six

`Chip` geometry is **`h-[27px]` explicitly, not padding-derived**. The 1px
border is drawn *inside* the box, which `box-sizing: border-box` only
reproduces when the height is stated; padding alone gives 29px. Measured:
27px tall, `px-4` (16px), fully round, `text-fine` 12/600.

| Tone | Fill on white card | Text | Text CR (card) | Text CR (canvas) |
|---|---|---|---|---|
| `success` | `#edf5ef` | `#1f7d37` | **4.67** | 4.57 |
| `neutral` | `#efefef` | `#333333` | **10.99** | 10.74 |
| `muted` | `#f5f5f7` | `#6d6d6d` | **4.75** | 4.75 |
| `warning` | `#fffbeb` | `#973c00` | **6.84** | 6.84 |
| `next` | `#eeebf3` | `#200061` | **14.43** | 14.11 |
| `destructive` | `#fcebed` | `#d70015` | **4.68** | 4.58 |

All six clear AA. The **8% fill opacity is counter-intuitive and load-bearing**:
these text colours sit close in lightness to their own tints, so *raising*
opacity toward the usual 10–20% pulls contrast **under** 4.5:1. Lower opacity
lightens the background, which raises contrast against dark text.

⚠️ **On `purple-50` (a table header row) `success` drops to 3.86:1 and
`destructive` to 4.00:1** — both fail AA. Chips inside a tinted header row are
not currently a pattern, but do not introduce one without re-measuring.

The chip **border measures only 1.2–1.55:1 against its own fill** — it is
decorative, not a boundary. Do not rely on it to separate a chip from a
same-tone background.

**State is never carried by colour alone** — the label always says it. Do not
give a tone its own geometry, and do not hand-roll a chip elsewhere.

### 6.5 Tabs

Two implementations, deliberately different:

**`UnderlineTabs`** (section-level). Implements the full WAI-ARIA tabs pattern:
roving tabindex (only the selected tab is `tabIndex={0}`), Arrow/Home/End moving
focus **and** selection with an explicit `.focus()` call, `aria-selected` +
`aria-controls`. The caller **must** render a matching `role="tabpanel"` with
`id={panelId}` and `aria-labelledby`. Measured: 42.5px tall, `px-4 py-2.5`,
15px/600 selected `primary` / 15px/500 idle `ink`, 2px `bg-primary` underline
inset 16px.

**Record-page tabs** (built inline in each record page). Measured: 44px
(`min-h-11`), 14px/500 white selected / 14px/400 `on-purple-muted` idle, 3px
`bg-yellow-300` underline full-width. `layoutId` is per-page
(`"coach-profile-tab-underline"`).

⚠️ `layoutId` and `idPrefix` must be **unique per mounted tab row**. Two rows
sharing one id make framer-motion animate a single underline flying between
them.

---

## 7. Responsive behaviour — measured, and it is not good

**Honest summary: this dashboard is desktop-only. None of the three shells
adapt below desktop width.** The sidebar has no responsive class of any kind —
no `md:hidden`, no drawer, no overlay. It occupies 64px or 240px at every
viewport.

Measured at three widths, Trainee Management:

| | 1600px | 768px (tablet) | 473px (see note) |
|---|---|---|---|
| Page horizontal scroll | no | no | no |
| Sidebar | 64 / 240px | **64 / 240px — unchanged** | **64px — unchanged** |
| `<main>` width | 1536 / 1360px | 704 / **528px** | 311px |
| Content gutter | 80px each side | **80px each side** | 24px each side |
| Content usable | 1320px | **368px** (sidebar expanded) | 263px |
| KPI grid | 4 cols (`xl`) | 2 cols (`sm`) | 1 col |
| `<h1>` | 40px | **40px** | **40px** |
| Table wrapper | 1198px | **366px** | 261px |
| Table `min-width` | 840px | 840px | 840px |
| Horizontal scroll factor | 0.70× (fits) | **2.30×** | **3.22×** |

**The tablet case is the bad one.** At 768px with the sidebar expanded:
240px sidebar + 160px of gutters = **400px of chrome on a 768px viewport**.
Content is **47.7% of the viewport**. The `md:px-20` 80px gutter kicks in at
exactly 768px — the breakpoint where there is least room for it.

Two mitigations already work correctly and should be preserved:

- Tables scroll **inside their own `overflow-x-auto` wrapper**, so the page
  body never scrolls horizontally at any width. Verified at all three.
- Tab rows scroll horizontally (`overflow-x-auto`) rather than wrapping.

⚠️ **Note on the 473px column.** The preview tool enforces a viewport floor of
~473px, so a true 375px phone width was **not reachable and is not measured
here**. Everything in that column is at 473px. A real 375px device will be
worse: main would be 311px, content usable ~263px, scroll factor ~3.2× — and
the 240px sidebar, if expanded, would leave ~87px of content.

**A 3560px sleep-diary grid exists** on the consumer record inside a ~936px
container. It is a tabbable `role="region"` so it is keyboard-reachable — do
not remove that when restyling.

---

## 8. Motion

`framer-motion`, wrapped app-wide in `<MotionConfig reducedMotion="user">`
(`App.tsx`). **Do not remove it** — several screens animate on mount and this
is what makes every framer-motion animation honour the OS
`prefers-reduced-motion` setting.

| Element | Trigger | Animation | Duration / spring | Easing |
|---|---|---|---|---|
| Page (`motion.main`) | Route change | `opacity 0→1`, `y 8→0`; exit `opacity→0` | 300ms | `easeOut` |
| Tab underline (`UnderlineTabs`) | Tab select | `layoutId` shared-element slide | **spring, `stiffness: 500, damping: 35`** | — |
| Record-page tab underline | Tab select | `layoutId` per page | same spring | — |
| Modal backdrop | Open/close | `opacity 0→1` | 150ms | default |
| Modal panel | Open/close | `opacity 0→1`, `y 8→0`; exit `opacity→0` | 200ms | `easeOut` |
| Sidebar width | Toggle | `width` 64↔240px | 200ms | `cubic-bezier(0,0,0.2,1)` |
| Colour/background/border | Hover, focus | `transition-colors` | 150ms | `cubic-bezier(0.4,0,0.2,1)` |
| Button press | `:active` | `scale(0.97)` | 150ms | `cubic-bezier(0.4,0,0.2,1)` |

`AnimatePresence` is keyed on `location.pathname` with `mode="wait"`, so each
route transition runs the shell's exit before the next page's enter.

**Reduced-motion contract, two layers:**

1. `MotionConfig reducedMotion="user"` — framer-motion animations.
2. A CSS `@media (prefers-reduced-motion: reduce)` block in `index.css` forcing
   `animation-duration: 0.01ms`, `animation-iteration-count: 1` and
   `transition-duration: 0.01ms` on `*`, `*::before`, `*::after`.

Together these cover both systems. Any hand-rolled `requestAnimationFrame`
animation would be covered by **neither** — guard it manually.

**Two motion traps recorded in code, both real bugs that shipped:**

- `AnimatePresence` keeps an exiting panel **mounted through its exit
  animation**. `ConfirmDialog`'s focus restore therefore tests "is focus still
  inside the *closing* panel", not "is focus on `<body>`" — a body check never
  matches and silently loses focus. It also defers via `requestAnimationFrame`
  so a two-step flow's new panel can claim focus first.
- **Animated `height: 0` is not concealment.** Collapsed accordion content stays
  focusable and in the accessibility tree unless it also gets `inert` +
  `aria-hidden`. This shipped as 11 invisible tab stops once.

---

## 9. Edge cases and empty states

### 9.1 Tables

Every table distinguishes **"no data at all"** from **"no search match"** —
`RosterPage:275`, `ConsumerManagementPage:310`, `SpacesRosterPage:202`.
Preserve the distinction; a single "No results" for both was the earlier
behaviour and read as broken.

| Table | Empty (no data) | Empty (filtered) | Min width |
|---|---|---|---|
| Trainee roster | per-tab copy | "no match" copy | 840px |
| Consumer roster | per-state copy | "no match" copy | 980px |
| Coach roster / Waiting | per-tab copy | "no match" copy | 980px |
| Consumer caseload | `EmptyState` "No consumers assigned yet" | — | — |
| Meetings (Upcoming) | "Nothing scheduled today or tomorrow." | — | — |
| Meetings (Scheduled) | "Nothing scheduled further out." | — | — |
| Session plan | `EmptyState` "No session plan yet" | — | — |
| Supervision notes | "No supervision notes yet. The first one you add appears here." | — | — |
| Study log | `EmptyState` "No recorded events yet" | — | — |
| Fitbit data | "No Fitbit data synced yet for this consumer." | — | — |
| Attention section | "Nothing needs your attention right now." | — | — |

⚠️ Table `min-width` values (840 / 980px) are **tuned by measurement**. Raising
one overflows the card and silently pushes the trailing chevron column out of
view inside `overflow-x-auto` — it scrolls rather than visibly breaking. Do not
add per-column pixel widths.

### 9.2 Row and cell behaviour

- Rows navigate on click **and** contain a real `<Link>` for keyboard
  reachability. That inner link must keep `stopPropagation` or activating it
  fires both handlers.
- Multi-attendee rows use `align-top` on every cell. Table-default
  `vertical-align: middle` floats the single-value cells to the block's vertical
  centre instead of aligning with the first attendee's name.
- `dyad.patient` (the PLE) is **optional** — carer-only enrolments are real, and
  every consumer layout must degrade to one person. In the roster's Consumer
  Details cell the PLE name is the link when a PLE exists and the Carer name
  becomes the link when one does not, so **every row carries exactly one link**.
- Absent values render `—`, never an omitted row.

### 9.3 The `EmptyState` contract

Tinted 48px circle + 20px icon + **one short line**. It is a *resting* state —
not an error, not a call to action. Anything needing a button or an explanation
of what went wrong is a different block. The badge is `aria-hidden` and the icon
decorative, so `copy` must stand alone.

### 9.4 Loading

**There is no loading state anywhere, because there is no async work.** All data
is in memory and synchronous. The two `Loader2` interstitials in
`PlanSessionsModal` are **fake 700ms timers** with nothing behind them — and
that component has no mount point regardless. A real build will need loading and
error states designed from scratch for every table and every write path; none
exist to copy.

### 9.5 Notification dismissal

Dismissal in `NotificationHubView` is **component-local `useState`** and is not
persisted. Dismissed notices reappear on any navigation or reload, and "Dismiss
all" is purely visual. A researcher will read this as a bug.

`hideWhenEmpty` + `onEmptyChange` exist because a margin belongs to the element
declaring it: the hub can collapse its own box but cannot reach its sibling's
`mt-24`. Home passes `className={attentionEmpty ? '' : 'mt-24'}` — without the
conditional, "Study overview" sits under a 96px hole.

The `hideWhenEmpty` branch returns an `sr-only` live region rather than `null`,
so the "Dismissed all N alerts" announcement survives the component hiding
itself.

### 9.6 Long text

- Hero sub-copy is capped at **`72ch`**.
- Chips carry `whitespace-nowrap` and `shrink-0`.
- KPI tiles are `min-h-[120px]`, not a hard height — a tile stretches to the
  tallest in its row rather than clipping. `breakdown` renders parts **beside**
  the number, never stacked, because a second line overflows the fill and forces
  every other tile in the row to reserve an invisible matching line.
- The Learning Progress KPI row's fourth column is a **fixed 400px**, not an
  equal quarter: that tile has three sub-columns and clips to an ellipsis at
  equal widths.
- No character limits are enforced anywhere. Names, employers and note bodies
  are unbounded.

---

## 10. Accessibility notes

Carried forward from ~20 rounds of review. A design that conflicts with one of
these loses.

- **36px minimum control height** (`h-9`). Measured: every button in the package
  is 36px. Flex children need `shrink-0` or flex-shrink compresses them below it.
- **44px** on nav items and record-page tabs (`min-h-11`).
- **Focus must never fall to `<body>`.** See §6.1.
- **Every decorative icon carries `aria-hidden="true"`.**
- **Every label/number pair is a real `<dl>`/`<dt>`/`<dd>`** — `StatCard` most
  visibly. A label and number that are only *visually* a pair announce as a bare
  digit. `order-2` reverses the visual order while leaving `dt` before `dd` in
  the DOM; do not reorder the markup to match.
- **Contrast is measured, not calculated** — from painted pixels, compositing
  translucent fills first. `index.css` documents four separate cases where a
  "verified" number did not survive a real recompute.
- **No avatars** app-wide — with one live exception, see *Open items*.
- Data shown on screen must be internally consistent. Two surfaces showing the
  same fact must read the same field; the classic failure here is a KPI counting
  `status` while the column beside it renders `inviteStatus`.

**Known, accepted AA failure:** the attention-section "N alerts" count badge is
white on `alert-pastel` `#e45f5b` at **3.45:1**. Requested explicitly over an
earlier `text-ink` treatment that cleared at 5.04:1. Two one-line remedies are
recorded at the call site.

---

## 11. Open items for the design owner

Each of these is a real unresolved decision or a measured divergence. None is
papered over above.

1. **Two card-header patterns are live.** The documented §35a rule is a
   `bg-card-header` `#e4d6ff` band + hairline divider (8 call sites). The Round
   23 record-page rebuild uses a `purple-50` `#f3efff` header row with **no**
   bottom stroke (55 uses, now the majority). An engineer building a new card
   has no rule telling them which to match. **Pick one, or state the split
   explicitly** (e.g. "band on form cards, tinted row on data tables").

2. **Buttons and tabs are diverged, and record-page tabs are a third size.**
   Buttons are `caption-medium` 14/500. `UnderlineTabs` is `text-[15px]`.
   Record-page tabs measure 14/500 selected, 14/400 idle. Three type
   treatments for two control classes. This is flagged in the project notes as
   a known open item, not an oversight — but it is still open.

3. **One utility button diverges from the other three.**
   `MeetingsSection.tsx:57` uses `text-caption` (14/**400**); `PasswordChangeCard`,
   `ResearchAccountPage` and `CoachProfilePage` use `text-caption-medium`
   (14/**500**). Measured live on Home's `Edit`/`Delete`. One of the four is
   wrong — probably the single one.

4. **`hover:bg-primary/5` is at the threshold of perceptible.** Measured Δ of
   −9,−11,−6 per channel over white. It is the hover state for all 11 outline
   pills, including every attention-card CTA. Either accept it as documented, or
   raise it to `/8` (Δ −14,−17,−9) — the chip fills already prove `/8` is safe
   for contrast.

5. **The dashboard does not adapt below desktop.** No sidebar drawer, no type
   scale, an 80px gutter that engages at exactly 768px, and content at 47.7% of
   a tablet viewport. This is pre-existing and app-wide, not a Research
   Dashboard defect — but it needs a decision: **is tablet in scope?** If yes it
   is a design round, not a fix.

6. **Focus ring on a filled primary button is 1.39:1 against the button's own
   fill.** It works only because it extends past the edge. Any future
   `ring-inset`, or a filled button flush inside a purple container, silently
   loses its focus indicator. Consider a white ring on filled-primary, matching
   the nine controls that already do this on dark surfaces.

7. **`—` vs a `muted` chip for absent values.** Consumer Management has two
   different "absent" treatments in adjacent columns: bare `destructive` text
   ("Not assigned") and a muted `Chip`. Resolving it means overturning a
   signed-off decision one way or the other.

8. **One placeholder graphic is the portrait for every trainee and every coach**
   (`/avatars/participant-placeholder.svg`, rendered at `CoachProfilePage` and
   `SpacesCoachProfilePage`). It is also the only exception to the app-wide
   no-avatars rule. The graphic is deliberately abstract and carries no real
   person's likeness, but the data model has no image field at all, so every
   record shows the same portrait. **Add a per-person image field or remove the
   portrait before any real data.**

9. **The trainee nav item loses its active state on a trainee record page**,
   because the record lives at `/research/coaches/:id` while the nav points at
   `/research/trainees`. Consumer and Coach Management do not have this problem.
   Either move the route or special-case the nav.

10. **`Certified` (Trainee Management's third tab) renders a hardcoded "No data
    available."** and reads no data at all, though certified records exist in
    scope. This is a deliberate product decision — certified coaches are managed
    under Coach Management — and it is a one-line "fix" that would reverse it.
    Recorded here so it survives the next reader.

11. **Chips fail AA on `purple-50`.** `success` 3.86:1, `destructive` 4.00:1 on
    a table header row. Not currently a pattern; do not introduce one without
    re-measuring.

12. **Tokens with no reader.** `purple-300`, `purple-950`, `--color-link-on-dark`,
    `--shadow-float`, `--color-chart-cat-1..7`. Each is kept deliberately and
    documented in `index.css` — confirm they should ship rather than assuming.

13. **`localStorage['c2s-research-nav-collapsed']` is unnamespaced.** It needs a
    per-user key once real auth exists.

14. **Notification dismissal has no backing store** (§9.5). Decide whether
    per-user dismissal is in scope; the UI already implies it is.

15. **No loading or error states exist anywhere** (§9.4). Every table and every
    write path will need them designed, with nothing in the prototype to copy.

---

## 12. Verification

Everything numeric above was measured in Chrome against the running app at
`http://localhost:5199`, at 1600px unless a width is stated:

- Computed styles read via `getComputedStyle` on live nodes.
- Colours rasterised through a `<canvas>` 2D context to resolve Tailwind v4's
  `oklab()` and `color-mix()` output to true sRGB bytes, then composited over
  the real surface before applying the WCAG relative-luminance formula. An
  earlier pass that parsed the `oklab()` string numerically produced garbage —
  do not do that.
- Responsive figures taken by resizing the viewport and re-measuring, not by
  reading breakpoint classes.
- **Not verified:** true 375px mobile (tool viewport floor ~473px), and any
  print stylesheet (none exists).

No file in the package was modified while producing this document. Two
temporary probe elements were injected into the live DOM and removed in the same
call; nothing persisted past a reload.
