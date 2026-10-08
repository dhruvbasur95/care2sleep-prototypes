# Handoff Spec: Care2Sleep Trainee / Coach Delivery Portal

**Routes covered:** `/delivery`, `/delivery/learning`, `/delivery/notes`, `/delivery/meetings`,
`/delivery/account`, `/delivery/consumers/:dyadId` (5 tabs),
`/training-v2/module/:moduleId/overview`, `/training-v2/module/:moduleId/play`, plus the
4-screen first-run onboarding and the 7-step coachmark tour.

**Companion documents:**
- `design-tokens.md` (this folder) — colour / type / radius / shadow / spacing tokens and
  the component rules that are not tokens. **`src/index.css` is authoritative** over both.
- `motion-spec.md` — all animation, easing, duration and choreography. **This document
  deliberately does not duplicate motion detail.**

---

## 0. How this spec was produced, and how to check it

Every number here was read from the running app via `getComputedStyle` /
`getBoundingClientRect` at `http://localhost:57953`. **Nothing was transcribed from a
design frame and nothing was eyeballed.** Colours were rasterised through a 1×1 canvas
before any contrast maths, because Tailwind v4 emits `oklab()`/`oklch()` and parsing that
as RGB returns nonsense.

Two measurement traps that will bite anyone re-running this:

- **The browser pane suspends `requestAnimationFrame` when its tab is backgrounded**
  (`document.hidden === true`). `framer-motion`'s `AnimatePresence` then never completes an
  exit, so dismissed modals, the tour card and the onboarding overlay appear permanently
  stuck, and entry animations freeze mid-flight (the sidebar measured a phantom
  `translateX(-8px)` and `main` a phantom `y=80`). **Front the tab before measuring.**
  Resting geometry: sidebar `x=24 y=72`, `main` `x=272 y=72`.
- The console reader returns a retained buffer that survives `location.reload()` *and*
  `console.clear()`. Check the console in a fresh tab or you will file stale errors.

Values marked **load-bearing** are structural — changing them breaks something. Everything
else is aesthetic.

---

## 1. Overview

Two audiences share one shell, switched by a demo control, not by a route:

| Stage | Who | Sidebar | Home content |
|---|---|---|---|
| **Trainee** | A coach in COACH certification | Home · My Learning · My Notes · My Profile (4) | Greeting → stage banner → wave divider → 7-stage pathway → stage card + meeting card |
| **Coach** | A certified coach delivering SPACES | + **My Schedule** (5, via a `coachOnly` nav flag) | Greeting → welcome banner → 2×2 KPI grid + priorities → wave divider → clients table |

A **"Demo view: Trainee / Coach"** segmented switcher is fixed bottom-right
(`rounded-full bg-pearl p-1`, 36px buttons). It is a **review tool, not product chrome** —
delete it if a real certification write path lands; do not repurpose it.

**Terminology is audience-dependent and non-negotiable.** Coach-facing surfaces say
**"client"**; researcher-facing surfaces say **"consumer"**. Verified live: zero
occurrences of "consumer" render anywhere in this portal. Internal identifiers keep
"consumer" (`dyadId`, `/delivery/consumers/:id`) — they are code, not copy.

**Audience constraint that outranks visual preference:** coaches and consumers in this
study are not digitally literate. Plain language, no icon-only affordances, no gestures,
large targets, one action per screen.

---

## 2. Layout system

### 2.1 Shell grid — measured at 1440×900

```
y=0    ┌─ AppHeader ──────────────────── 1440 × 48px, #000000, full-bleed ──┐
y=48   ├─ row: display:flex; padding: 24px 48px 24px 24px; gap: 48px ───────┤
y=72   │   aside  x=24   w=200   h=804   sticky, top:72px                   │
y=72   │   main   x=272  w=1120  min-w-0 flex-1 tabIndex=-1                 │
       └────────────────────────────────────────────────────────────────────┘
```

| Value | Measured | Load-bearing? |
|---|---|---|
| Header height | **48px** | Yes — the sidebar's `sticky top` is derived from it (48 + 24) |
| Row padding | **24px top · 48px right · 24px bottom · 24px left** | **Yes.** The left/right asymmetry is intentional, from the design's own column grid. Do not symmetrise it |
| Row gap | **48px** | Yes |
| Sidebar width | **200px** expanded | Yes |
| Sidebar sticky offset | **`top: 72px`** | Yes |
| Content column width | **viewport − 320px** | Yes — see §7 |
| Content max-width | **`max-w-[1320px]`** (`mx-auto`) | No — does not bind below ≈1640px viewport |
| Content vertical inset | **64px top, 64px bottom** (`pt-16 pb-16`) | No |
| Section rhythm | **48px, flat** (`gap-12`) | No, but it is uniform — verified as exactly 48px between all five Home blocks |

`main` carries `tabIndex={-1}`. **This is load-bearing**: without it the "Skip to main
content" link points at a bare `id` and cannot move focus.

### 2.2 Sidebar (floating card, not a rail)

| Property | Measured |
|---|---|
| Surface | `bg-purple-200` **`#e4d6ff`** |
| Radius | **16px** (`rounded-xl`) |
| Shadow | **`2px 4px 16px rgba(85, 85, 85, 0.1)`** — neutral grey, *not* the warm gold `shadow-card` |
| Position | `sticky`, `top: 72px`, `overflow-hidden`, `transition-[width] 200ms ease-out` |
| Nav row | `x=40 w=168` (16px inset), **`min-h-9` 36px**, `rounded-sm` 8px, `-mx-2 px-2` |
| Row pitch | **56px** (36px row + 20px `mt-5`) |
| Idle row | `text-body` **16/400** `ink` — 12.73:1 |
| Active row | `text-body-md` **16/600** `primary`, `aria-current="page"` — 7.77:1 |
| Hover | `bg-purple-50` `#f3efff` |
| Collapse toggle | **36×36** (`size-9`), top-right, `aria-label="Collapse navigation"` |

**The active state is carried by colour + weight only — there is no background change.**
That is deliberate and matches the design. It also means colour alone is not the sole
differentiator (weight changes too), so it satisfies 1.4.1.

### 2.3 Hero pattern — there is no hero band

Unlike the Research Dashboard, **no page in this portal has a hero band.** Every page
opens with an H1 sitting directly on the page canvas:

- Position: **`y = 136`** at every route (main `y=72` + 64px `pt-16`)
- Type: **`display-lg` 40px / 500**
- Colour: **`primary` `#4a278f`** on `/delivery/learning`, `/delivery/notes`,
  `/delivery/meetings`, `/delivery/account`, and the coach-stage Home greeting.
  The consumer-detail page instead renders a two-line `PLE: / Carer:` identity block at
  `y=196` beneath a back link.
- Pages opt out of the shell's band via the additive **`contentClassName`** slot on
  `DeliveryShell`.

Any page-level action sits on the same row, right-aligned, at **`h-9`** (e.g. "Need help",
"Schedule new meeting" — both currently `aria-disabled`).

### 2.4 Full-bleed routes (`/training-v2/*`)

The module overview and player **do not mount `DeliveryShell`** — no sidebar, no content
column. They render `AppHeader` (48px, `portal="training-v2"`) and take the full viewport.

**Module overview** (measured at 1440):

| Region | Measured |
|---|---|
| Hero | full-bleed **1440 × 353.4px**, radial-gradient cover art from `moduleArt()` |
| Gutter | **112px** left and right (symmetric: 112 + 784 + 56 + 376 + 112 = 1440) |
| Hero H1 | `display-lg` 40/500 **white**, `x=112 y=227.5` |
| Back link | `x=104` (`-m-2 p-2` → visual 112), **15px/600 white**, `rounded-full`, 38.5px |
| Outline column | **784px** at `x=112` — a real `<ol>` with numerals |
| Outcomes card | **376px** at `x=952` (`lg:w-[376px]`), `bg-yellow-50`, 1px `yellow-100`, 16px radius, 24px padding, `shadow-card` |
| Outline row | 45.7px (intro) / 62.7px (chapters). **No divider, no tint, no check badge** — completion is signalled in the meta line only. The list is a running order, not a status board |
| Row title | `body-md` 16/600 at `x=164` |
| Row CTA | primary filled pill **36px**, `px-4` |

**Module player** (measured at 1440×900, both rail states):

| Region | Rail open | Rail collapsed |
|---|---|---|
| Rail | `x=24 w=**330** h=720` | `x=24 w=**76** h=720` |
| Content area | `x=386 w=1030` | `x=132 w=1284` |
| Slide column | **656px**, `x=573` | **656px**, `x=446` |
| Prev/Next pair centre | **901** | **774** |
| Content-area centre | **901** ✅ | **774** ✅ |

- Rail: `rounded-xl` 16px, `bg-card`, 1px `border-parchment`, **warm gold `shadow-card`**,
  padding `0 16px 24px`, sticky internal header, own scroll container.
- Slide column: `mx-auto max-w-[656px] px-6 py-10 md:px-8`, centred **on both axes**
  via `my-auto` (not `justify-center`, which would push a tall slide's top out of reach).
- Slide `<h1>`: **`display-md` 32/500**, 592px wide.
- Footer: full-bleed **1440 × 84px** at `y=816`, **`bg-purple-50` `#f3efff`**,
  padding `20px 24px`.
- Footer controls: "Go Back Home" primary-outline pill **178×44** at `x=24`;
  "Previous slide" / "Next slide" **272×44 each, 24px apart**.
- **Load-bearing:** the footer reserves `railWidth + 32` so the Prev/Next pair stays
  centred on the *content area*, not the viewport. `ModulePlayerNav` exports
  `OUTLINE_RAIL_OPEN_PX = 330` and `OUTLINE_RAIL_COLLAPSED_PX = 76` for exactly this; a
  hardcoded offset put the pair **127px off centre** when the rail was collapsed.
- Total height is exactly `100vh`: 48 + 720 + 24 + 84 + 24 = 900. Only the slide area and
  the rail scroll.

### 2.5 Onboarding (4 screens)

Replays on **every load** of `/delivery` in trainee stage — it is never persisted.

| Property | Measured |
|---|---|
| Chrome | `AppHeader` present (48px). **No sidebar.** No dots, no Skip, no Back on screen 1 |
| Canvas | `main` `x=24 y=80 w=1368 h=804`; content `px-28 pt-12 pb-6`, `gap-12` |
| Title | `display-lg` **40/500 `ink`**, centred, `y=354.42` |
| Sub-copy | `sub-greeting` **18/400** `ink`, `y=410.92` |
| CTA row | **`y=551.62` on all four screens** — one measured position, never moves |
| Single CTA | **240×36**, centred on the content-area centre (**x=708**), not the viewport |
| Two CTAs | "Go back" `x=456` · "Go next" `x=720` — **24px apart**, span centred on 708 |
| Screen 4 CTA | "Go to my dashboard" |

**Load-bearing implementation notes:**
- The photo card's torn-paper frame is **one `BLOB_PATH` rendered twice in one inline SVG**
  (`components/delivery/blobFrame.ts`) — once as a `clipPath` for the photo, once as a
  `<path>` for the purple stroke (`#A070FF`, `BLOB_STROKE_W = 4.09282`). **Never
  reintroduce a separate mask asset.** This project has shipped a photo outside its own
  outline three times by transcribing the two independently.
- An **invisible sizer** reserves the tallest title so the CTA row cannot move. The sizer
  copy must carry *identical* classes to the live title — a missing `text-balance` once
  wrapped the sizer to two lines and reserved a phantom line.
- The final CTA must name its destination path explicitly. It previously called
  `onComplete()` with no path, which only uncovers whatever the flow was covering — so
  entering on `/delivery/learning` finished on My Learning.

### 2.6 First-run tour (7 steps)

Opened by onboarding's **final CTA only** — Skip does not start it. Not persisted, no
re-entry point.

| Property | Measured |
|---|---|
| Card | **320px wide**, `bg-primary` `#4a278f`, radius 16px, padding 24px |
| Card shadow | **`0 8px 12px rgba(0,0,0,0.2)`** |
| Step counter | `caption` 14/400 **`on-purple-muted` `#c4b5fc`** — 5.74:1 |
| Title / body | white / `parchment` — 10.62:1 / 9.75:1 |
| "Skip" | text button **44×36**, `rounded-sm`, `parchment` label |
| "Start tour" | white filled pill **112×36**, `primary` label |
| Spotlight | SVG viewport `<rect>` mask, `rx=8`, sized to the anchor |
| Scroll lock | `overflow: hidden` on `<html>` + body padding to compensate for the scrollbar |
| Focus | moves **into the card** (verified: `activeElement` is a node inside `[role="dialog"]`) |

**Load-bearing rules:**
- Anchors are `data-tour` attributes on real elements; **all copy lives in
  `data/deliveryTour.ts`, never in the component.**
- The stage count is interpolated from `PATHWAY_STAGE_COUNT_WORD` / the rail itself,
  **never written as a number.** That sentence has been wrong three separate times.
- Scroll lock must be `overflow: hidden`, not a wheel blocker — the tour's own
  `scrollIntoView` depends on programmatic scrolling still working.
- `data-tour="learning-progress"` sits on the **stage-card shell**, not a variant. On a
  variant the tour breaks the moment a different stage renders, and a missing anchor fails
  silently.

---

## 3. Component inventory

Directory names mislead here. Several components rendered by this portal live under
`components/research/` or are exported from `pages/research/*` — **that is by design and
must not be forked.**

### 3.1 Portal-owned — `src/components/delivery/`

| Component | Props | Notes |
|---|---|---|
| `DeliveryShell` | `accountLabel: string` · `children: ReactNode` · `hero?: ReactNode` · `heroNoSeam?: boolean` = false · `heroClassName?: string` · `contentClassName?: string` · `heroFlushBelow?: boolean` = false | Also gates first-run onboarding. Slot names deliberately mirror `ResearchShell`'s; **spacing numbers must stay in step with it** — 80px inset after a plain hero, 48px after a hero that closes with a tab row |
| `DeliverySidebar` | none | Nav model: `{ to, label, icon, end, pending?, tour?, coachOnly? }`. `pending` → `aria-disabled` + `sr-only "(coming soon)"` |
| `DeliveryOnboarding` | `onComplete: (to?: string) => void` | 4 screens; exit choreography `EXIT_MS = 820` |
| `Doodles` | `step: number` · `transition: Record<string, unknown>` · `className?` · `style?` | 9 addressable units. Rotation via `DOODLE_SPIN` is **cumulative and sparse** — keep deltas above ~8° and non-cancelling or the movement is invisible |
| `blobFrame.ts` | — | Exports `BLOB_PATH`, `BLOB_W = 180.762`, `BLOB_H = 143.134`, `BLOB_STROKE_W = 4.09282`, `BLOB_STROKE = '#A070FF'` |
| `DeliveryTour` | `stageCount: string` | Mounted in `DeliveryHomePage`, not the shell (the shell cannot import the pathway without a cycle) |
| `WaveDivider` | `label: string` · `className?` | Hand-drawn rule either side of a centred label. Its label renders at `body` 16/400 — **not** the `title` 20/500 used by other section headings |
| `Confetti` | `play: boolean` | 20-frame PNG sequence, 130ms/frame, 8 passes → 10s pause, frames **unmounted during the pause**. Not a GIF and not a particle system — see §9 |
| `PrioritiesSection` | `items: PriorityItem[]` · `className?`; `PriorityItem = { id, title, note, to }` | Fixed list height `h-[272px]`. Card measured **536×306**, `rounded-lg border-parchment bg-white p-4 shadow-card`; rows are `purple-50` tiles |
| `OptOutCard` | none | Card stroke composites to `#f3b2b8`. Title uses `ink`, not `destructive` — red-on-red measured 4.51:1, clearing AA by 0.01 on text that is not WCAG "large" |
| `CoachStageSwitcher` | none | Demo control. `rounded-full bg-pearl p-1`, 36px buttons, fixed bottom-right |
| `AddAnnotationSummaryModal` | `open` · `onClose` · `dyadId` · `dyadTitle` · `session?: number` · `completeSession?: { label, date?, time?, onConfirm }` | Also exports `ReflectionFields({ components })` and `ReflectionReviewTable({ answers, idPrefix, onChange })` |
| ⚠️ `NotificationHub` | — | **Lives in `components/delivery/` but is imported only by the Research Dashboard.** A directory/ownership inversion |

### 3.2 Shared — `src/components/shared/`

| Component | Props | Also used by |
|---|---|---|
| `EmptyState` | `icon: LucideIcon` · `copy: string` · `className?` | Research Dashboard. **Keep `copy` to one line** — it is a resting state, not an error and not a CTA |
| `StatCard` | `label` · `value?: number\|string` · `valueLabel?` · `icon: LucideIcon` · `breakdown?: {label,value}[]` · `breakdownLayout?: 'inline'\|'stacked'` = `'inline'` | 5 research pages |
| `TablePager` | `page: number` (0-based) · `pageSize` · `total` · `onPageChange` · `itemLabel?` = `'items'` | **This portal only today.** 36px hit areas — not the 22px a reference will show you. The range label is a live region |
| `Toast` | `message: string \| null` · `onDismiss: () => void` | `role="status"`, self-clearing after 4s. Extracted at its 5th caller; **four earlier call sites still inline it** |
| `UnderlineTabs<T>` | `tabs: readonly {id:T;label:string}[]` · `active` · `onChange` · `ariaLabel` · `layoutId` · `idPrefix` · `panelId` · `flushStart?` = false · `underlineEmphasis?: 'section'\|'page'` = `'section'` | Research Dashboard. Sliding `layoutId` underline + roving tabindex + arrow keys |
| `MeetingsSection` | `rows: ScheduleRow[]` · `title?` = `'Schedule and track your meetings'` · `showHeader?` = true · `idNamespace: string` | Research Dashboard. **`idNamespace` must be unique per mounted instance** — `framer-motion` `layoutId` collides otherwise |
| `InertButton` | `label` · `className` (required) · `children?` · `appearance?: 'dimmed'\|'active'` = `'dimmed'` | — |
| `UpcomingSessionsPanel` | `rows` · `title?` · `emptyMessage?` · `onAddAdHocClick?` · `ctaLabel?` · `ctaVariant?` | **Only its `UpcomingSessionRow` type is imported here**; the component is not rendered in this portal |
| `WizardStepHeading` | `step` (0-based) · `stepCount` · `heading` · `subtitle?` · `headingRef?` · `headingClassName?` | All 4 wizards. Also exports `STEP_CONTENT_GAP = 'mt-6'`. **Do not drop `headingRef`** — it prevents this project's most-repeated defect |
| `WizardProgressRail` | `steps: {key,navLabel,heading?}[]` · `current` · `ariaLabel` · `liveTextVisible?` = false · `liveTextSuffix?` | 3 other wizards |
| `modalFooter.ts` | — | `MODAL_FOOTER_SURFACE` / `_COMPACT`. Callers need `overflow-hidden` so the negative-margin bleed does not poke past the panel's rounded corners |

`ScheduleRow` = `{ key, title, attendeeNames: string[], sessionType, date, time, meetingId, zoomLink, readOnly?, detailsHref?, hideStart? }`.
`readOnly` / `hideStart` / `detailsHref` exist **specifically for the coach's schedule** —
Edit/Delete/Start are rendered *absent* (a permission), not disabled.

### 3.3 Rendered here but defined under `components/research/` or `pages/research/`

**This is the cross-portal surface. Never fork any of these to give one portal different cards.**

| Component | Defined in | Props | Coach-side difference |
|---|---|---|---|
| `Chip` | `components/research/StatusChip.tsx` | `tone: 'success'\|'neutral'\|'muted'\|'warning'\|'next'\|'destructive'\|'yellow'` · `label` | none |
| `ConfirmDialog` | `components/research/ConfirmDialog.tsx` | `open` · `title` · `body` · `confirmLabel` · `cancelLabel` · `destructive?` · `singleAction?` · `confirmDisabled?` · `onConfirm` · `onClose` · `children?` · `panelClassName?` (default 440px / 85vh) | **15 importers across all four portals** |
| `PlanSessionsModal` | `components/research/PlanSessionsModal.tsx` | `open` · `onClose` · `dyad` · `onSaved?` | Create-only |
| `EditSessionPlanModal` | `components/research/EditSessionPlanModal.tsx` | same | Edit-only |
| **`ProfileDetailsSections`** | `pages/research/ConsumerDetailPage.tsx:963` | `dyad` · `viewerRole?: 'researcher'\|'coach'` = `'researcher'` | Withdraw, notification preferences and edit-details render **absent** (permissions, never disabled). Assigned-coach name is plain text, not a `/research/*` link (routing) |
| `SleepDiaryFeed` | `pages/research/ConsumerDetailPage.tsx:3203` | `dyad` · `viewerRole?` · `compact?` · `averageNights?` | `viewerRole="coach"` |
| `FitbitSyncMonitor` | `pages/research/ConsumerDetailPage.tsx:2863` | `dyad` · `member?` · `onMemberChange?` · `description?` · `emptyMessage?` · `memberLabels?` · `showComparative?` = true · `tabsMatchPageRow?` = false | ⚠️ **does not take `viewerRole`** |
| `FitbitAveragesTable` | `pages/research/ConsumerDetailPage.tsx:2630` | `people` · `nights` · `emptyMessage?` | — |
| `SessionPlanEmptyBanner` | `pages/research/SpacesCoachProfilePage.tsx:1303` | `dyad` · `ctaRef` · `onCreate` | — |
| `PersonRecordCard` | `pages/research/ConsumerDetailPage.tsx` | + `readOnly` | Coach may read a client's PLE/Carer details, not change them |

**The three-way distinction that must be preserved when adding a coach view:**
a difference is either a **permission** (render *absent* — a control a coach may never use
is not a control, and a greyed-out "Withdraw from study" invites the question of who can
press it), a **routing** difference (link becomes plain text), or **copy**
(consumer → client). It is never "the same card with things switched off".

### 3.4 Root / UI

| Component | Path | Props |
|---|---|---|
| `AppHeader` | `components/AppHeader.tsx` | `portal?: 'training-v2'\|'research'\|'consumer'\|'delivery'\|'switcher'` = `'training-v2'` · `fullBleed?` = false · `accountLabel?` |
| `SearchInput` | `components/SearchInput.tsx` | `id` · `label` · `value` · `onChange` · `placeholder` · `className?` · `widthClassName?` = `'sm:w-[280px]'` |
| `moduleArt` | `components/ModuleCard.tsx` | `([wash, bloomA, bloomB]) => CSSProperties` |
| `NotificationPreferencesCard` | `components/account/NotificationPreferencesCard.tsx` | `preferences` · `onSave` · `headerClassName?` — **coach passes `bg-purple-50`** |
| `Card` family | `components/ui/card.tsx` | `React.ComponentProps<'div'> & { size?: 'default'\|'sm' }` |
| `Tooltip` family | `components/ui/tooltip.tsx` | base-ui props — sidebar collapsed labels |

### 3.5 Home's per-stage card system (`DeliveryHomePage.tsx`, local)

```ts
HomeStageCard({ title, subtitle, nodeId, children })
StageList({ heading, items: readonly StageListItem[], action, icon })
LockedSessionCta({ label })
ReflectionPrompt({ className? })
StageListItem = { name, detail?, action?, icon?, onSelect? }
```

Seven variants on **one constant container**. Adding a stage = a `StageListItem[]` plus one
line in the switch.

**Load-bearing:** resolve the stage index **by label** from `PATHWAY_STAGES`, never by a
literal number. A `StageList` row is a live control only when it has an `onSelect`; without
one it renders `aria-disabled` + an `sr-only` cue.

Also exported from this file and consumed by two other pages: `BannerBlob`,
`upcomingSessionRowsForDyads`, `nextSessionRowsForDyads`, `REFLECTION_STAGE_INDEX`.

### 3.6 `/delivery/consumers/:dyadId` — five tabs, in render order

| # | Tab | Renders |
|---|---|---|
| 1 | **Coaching workspace** | Planned: `SessionDebriefBanner` → `UpcomingSessionCard` → `WaveDivider "Before session"` → `PreSessionChecklist` (`UnderlineTabs` over Fitbit averages / `SleepDiaryFeed` compact 7-night / previous notes). Unplanned: `SessionPlanEmptyBanner` |
| 2 | **Case notes** | `AddSessionNoteCard` → `WaveDivider "Your previous case notes"` → `SessionNotesTable` (Ad-hoc / Auto-generated filter, `Chip tone="yellow" label="Auto generated"`, `EmptyState`, `TablePager itemLabel="notes"`) → `Toast` |
| 3 | **Client sleep & health data** | `SegmentedSwitch` → `HealthKpiRow` (3 × `StatCard`) → `FitbitSyncMonitor` or `SleepDiaryFeed viewerRole="coach"` |
| 4 | **My reflections** | Table of every reflection + `ReflectionReviewDialog` (shares `ReflectionReviewTable` with the wizard) + share toggle → `TablePager itemLabel="reflections"` |
| 5 | **Client Profile Details** | `ProfileDetailsSections dyad viewerRole="coach"` — and nothing else |

Always mounted at page level, outside any tab: `EditSessionPlanModal`,
`AddAnnotationSummaryModal`, `PlanSessionsModal`.

**Domain rules that constrain this page:**
- A reflection is written **from the session debrief**, not at will. It belongs to the
  session it follows — no surface may list "write your reflection" as a standing to-do.
- Only sessions the dyad has **actually completed** are offered when writing a case note.
  A note about a session nobody held is not a thing.
- Every session label renders through **`sessionRowLabel()`, never a bare number** —
  internal numbering has 1 = Planning, so a raw number is both off by one and wrong for the
  planning session, which has no number at all.
- Case notes have **no Delete**. The trainee's own notes are disposable; a client's case
  note is a clinical record. This is deliberate, not an omission.
- The label is **"Auto generated"**, never "AI generated", in coach-facing copy.

### 3.7 Orphaned — grep-confirmed zero importers

`ModuleTimeline` (~1,745 lines) · `ModulePlayerHeader` · `SegmentedProgressBar` (only
importer was `ModulePlayerHeader`) · `WidgetGrid` · `KpiTile` · `AiReflectionPanel` ·
`PlaceholderCard` · `ui/badge` · **`ui/button`** (the app uses three hand-rolled canonical
button classes, not this) · `ui/avatar` (the no-avatars rule is app-wide).

Comments in `StatCard` and `CoachProfilePage` still describe `KpiTile` as live. **They are
stale.**

---

## 4. Buttons — the three canonical styles

Measured on live controls. Full table in `design-tokens.md` §6.2.

| | Primary filled | Primary outline | Utility |
|---|---|---|---|
| Height | 36px / **44px** | 36px / **44px** | 36px |
| Radius | `rounded-full` | `rounded-full` | `rounded-sm` 8px |
| Padding | `0 18px` | `0 18px` | `0 20px` |
| Fill | `#4a278f` | white / transparent | `#4a278f` |
| Stroke | none | 1px `#4a278f` | none |
| Type | 14 / 500 / -0.224px | same | same |
| Hover | `#200061` | `#f3efff` | `#200061` |

**The 36px floor is a floor, not a cap.** Trainee-facing CTAs render at **44px (`h-11`)**
by design and that is correct: measured on "Go to My Learning" (474×44), "Learn more"
(112×44), "Download certificate" (196×44), "Opt out of the study" (167×44), "Add note"
(248×44), and all three player footer pills (44px).

`h-9` is a *height*, not a minimum. A flex child in a fixed-height container needs
`shrink-0`, or flex-shrink compresses it below the floor — this project shipped a 31px CTA
carrying `h-9` exactly that way.

**A frame's own button chrome always loses.** The design decides *where* a button goes and
*what it says*; the app decides how it looks. The player footer is the worked example: its
widths, heights, order and icons are the frame's; its `caption-medium` type and 1px stroke
are the app's, replacing the frame's 16/600 and 2px stroke.

---

## 5. Interaction states

### 5.1 Every interactive element

| Element | Rest | Hover | Focus-visible | Active | Disabled | Loading |
|---|---|---|---|---|---|---|
| **Primary filled** | `bg-primary` / white | `bg-primary-hover` `#200061` (17.02:1) | `ring-2 ring-ring` 2px `#5300fa`, 0 offset, outside | no distinct style | ⚠️ `aria-disabled` + `cursor: not-allowed` — **no visual change** (§9) | none |
| **Primary outline** | white / 1px `#4a278f` | `bg-purple-50` `#f3efff` (9.40:1) | same | — | ⚠️ same as above | — |
| **Utility ("Join Zoom")** | `bg-primary` / `rounded-sm` | `bg-primary-hover` | same | — | — | — |
| **Sidebar nav (idle)** | `body` 16/400 `ink` | `bg-purple-50` | same (5.59:1 on `purple-200`) | — | `pending` → `aria-disabled` + `sr-only` | — |
| **Sidebar nav (active)** | `body-md` 16/600 `primary`, `aria-current="page"` | `bg-purple-50` | same | — | — | — |
| **Collapse toggle** | `size-9` icon, `ink` | `bg-purple-50` | same | — | — | — |
| **Page tabs** (consumer detail) | `caption` 14/400 `ink-muted` | colour transition | `ring-2 ring-ring` | 2px `bg-primary` underline + `caption-medium` `primary` | — | — |
| **`UnderlineTabs`** | 15px/500 `ink` | colour transition | `ring-2 ring-ring` | 15px/600 `primary`, sliding `layoutId` underline | — | — |
| **Text input** | 44px, `rounded-sm`, 1px `hairline`, white | — | `ring-2 ring-ring` | — | — | — |
| **Textarea** | 160px, `bg-parchment`, `resize-y` | — | same | — | — | — |
| **`SearchInput`** | 36px pill, 1px `hairline`, placeholder `ink-faint` | — | same | — | — | — |
| **Checkbox** | ⚠️ 16×16, accent `primary` | — | `ring-2 ring-ring` | — | — | — |
| **Link-button** ("View"/"Download") | `caption-medium` `primary`, underlined, `underline-offset-2` | `text-primary-hover` | `ring-2 ring-ring`, `rounded-xs` | — | — | — |
| **Delete icon button** | `size-9` (36px), `text-destructive`, `-my-2` | `bg-destructive/10` — **composite before measuring** | `ring-2 ring-ring` | — | — | — |
| **Player Prev/Next** | 272×44 pill | — | `ring-2 ring-ring` | — | ✅ **`aria-disabled` + `text-ink-muted` on `purple-50` (11.19:1) + `sr-only` reason** — the one correct disabled treatment in the portal | — |
| **Module card CTA** | filled pill 36px, full-width | `bg-primary-hover` | `ring-2 ring-ring` | — | locked → `aria-disabled` + lock hint | progress bar + % |
| **Notification tile options** | `size-9` on `purple-50` | `bg-white` | `ring-2 ring-ring` | — | — | — |
| **Tour card CTAs** | "Skip" 44×36 text / "Start tour" 112×36 white pill | — | `ring-2 ring-ring` | — | — | — |

Transition on every colour change: **`transition-colors` 150ms `cubic-bezier(0.4, 0, 0.2, 1)`**.

### 5.2 Rules that will be got wrong otherwise

- **A hover tint at very low opacity is not a state change.** `hover:bg-primary/5` over the
  page canvas composites to a ~9-per-channel shift — present in the DOM, invisible on
  screen, and reported by reviewers as "no hover state". `hover:bg-purple-50` is opaque and
  moves (12, 16, 0). **Measure the composited colour.**
- **`bg-pearl` (`#f5f5f7`) is a cool grey; the canvas (`#fffcfa`) is warm.** `pearl` is
  correct inside a white card and reads as a foreign patch directly on the page. A utility
  button sitting on the canvas wants a transparent fill.
- **Unwired controls are `aria-disabled` buttons with an `sr-only "(coming soon)"` cue** —
  never a silently dead button and never omitted. Six such controls exist in
  `DeliveryHomePage` alone, plus `DeliverySidebar`'s `pending` flag.
- **`cursor: default` on an inert `<button>` beside two `<a>` pills reads as broken.** Use
  `cursor: not-allowed` (23 sites already do).
- **Focus must never fall to `<body>`.** Any control that unmounts on click — dismiss,
  submit, step-advance, tab-change, "Go back" in a two-step confirm — must move focus
  somewhere deliberate, normally the list or panel heading. **This project has shipped this
  bug in six separate rounds. Assume it and test it with real Tab presses.**
- **Animated `height: 0` is not concealment.** Collapsed content stays focusable and in the
  accessibility tree unless it also gets `inert` / `aria-hidden`. The module player's
  chapter tree unmounts on exit for this reason.

---

## 6. Empty, loading and error states

### 6.1 Empty states — `EmptyState` (`icon`, `copy`, one line only)

| Surface | Icon | Copy |
|---|---|---|
| My Notes table | `NotebookText` | "No notes yet." |
| Case notes | `NotebookText` | "No case notes written yet" |
| Coaching workspace | `CalendarClock` | "No sessions planned yet" |
| Home clients table | `Users` | "No clients assigned yet" |
| Home clients search | `Search` | "No clients match “{query}”" |
| Home meetings | `CalendarX` | "No meetings scheduled yet" |
| Priorities | `CheckCircle2` | "Nothing needs your attention this week." |

Two non-`EmptyState` empties, both measured:
- **My Schedule**, both tabs empty: a card **1120×160.2** containing
  "Nothing scheduled today or tomorrow."
- **Module overview** with no populated outline: plain `body` `ink-faint` —
  "Module breakdown coming soon."

**A dyad with zero completed sessions** (`dyad-014`) gets an explanatory line in place of
the case-note form, rather than a form whose required field has no valid option.
**A note predating session mapping renders `—`, never "Session NaN".**

### 6.2 Loading states

There are **no skeletons and no spinners** anywhere in this portal — all data is
synchronous seed data. The only loading affordances in the codebase are the two ~700ms
`Loader2` interstitials inside `PlanSessionsModal` (generating / saving), which hide the
rail and footer entirely for a centred spinner.

**Open item for the design owner:** when this is wired to a real API there is no specified
loading treatment for any page, table or tab. See §9.

### 6.3 Error states

There is **no error state design in this portal.** No validation messages, no failed-save
treatment, no offline state. The nearest things that exist:

- **Form guards are silent**: "Add note" simply stays `aria-disabled` until title and body
  are non-empty. There is no message telling the user why.
- **Destructive confirmation** goes through `ConfirmDialog` with `destructive: true`.
- **Success** is announced by `Toast` (`role="status"`, self-clearing after 4s).
- **Live regions** exist for paging (`TablePager`'s range label), reflection saves,
  onboarding step changes and opt-out, all `aria-live="polite"` / `role="status"`.

`--destructive` `#d70015` (5.38:1 on white) is the token for genuine errors.
`--color-alert-pastel` is the softer Research-Dashboard-only alert red and is **not**
rendered here.

---

## 7. Responsive behaviour

### 7.1 The shell does not adapt

**Measured, and this is the headline finding of the audit.**

`main` width = **viewport − 320px** at every viewport. The sidebar holds a fixed **200px**
with `display: block` down to 320px; it never collapses, stacks, or becomes a drawer.

`24 (pl) + 200 (sidebar) + 48 (gap) + 48 (pr) = 320px of fixed chrome.`

| Viewport | `main` width | Horizontal page scroll? | Notes |
|---|---|---|---|
| 1440 | **1120px** | no | Reference |
| 1280 | **960px** | no | `xl` boundary — Home pair still side by side |
| **1279** | **959px** | no | **Home learning-progress / meeting pair stacks** (`xl:flex-row` → column) |
| 1120 | 800px | no | **My Learning hero stacks** below this (`min-[1120px]:w-auto` on the progress card) |
| 1024 | **704px** | no | Usable |
| 768 | **448px** | no | Cramped but intact |
| 375 | **55px** | **yes** — `scrollWidth 498 > clientWidth 375`; **102 elements overflow** | Unusable |
| **320** | **0px** | **yes** | **Content column collapses to zero width** |

### 7.2 Measured breakpoints

| Breakpoint | Value | What changes |
|---|---|---|
| `xl` | **1280px** | Home's stage-card / meeting-card pair goes row ↔ column (`xl:flex-row xl:items-stretch`, internal `gap-10` = 40px) |
| **`min-[1120px]`** | **1120px** | **Non-standard, chosen by measurement.** My Learning hero: the yellow progress card stacks below the title/copy and goes full width under this |
| `lg` | 1024px | Module overview: outcomes card takes `lg:w-[376px]` beside the outline column |
| `md` | 768px | Player slide column padding `px-6` → `px-8`; Home page padding classes |
| `sm` | 640px | `SearchInput` default `widthClassName` |

Everything else — the shell row, the sidebar, the 48px section rhythm, the 64px page
inset — is **constant at every width.**

### 7.3 What happens at 320px

**The portal does not function.** Measured at a 320px CSS viewport
(`clientWidth === 320`, media queries confirm `≥320 / <375`):

- `main` computes to **0px wide**; the H1 has a 0px box and 97px height.
- `document.scrollWidth` (498) exceeds `clientWidth` (320) — a real horizontal page scroll.
- The sidebar still occupies 200px of a 320px screen.

The portal is **desktop-only in its current state**, and this is a pre-existing, app-wide
condition flagged in Round 19 across all three shells and never fixed. It is the single
largest open item in this handoff.

### 7.4 Contained overflow (correct, do not "fix")

Three regions scroll internally and must keep doing so:

| Region | Content width | Container | Mechanism |
|---|---|---|---|
| Home 7-stage pathway | **1379px** | 1120px card | `overflow-x-auto` + `min-w-0` |
| My Learning Part A carousel | **1280px** | 1072px | `overflow-x-auto` + `min-w-0` |
| My Learning Part B carousel | **2255px** | 1072px | same |

**Load-bearing:** a new grid or flex container needs `min-w-0` on the **container *and* its
cells**. Items default to `min-width: auto`, so one wide child sizes the track instead of
scrolling inside its own box. This has produced a real horizontal page scroll three times.
Check `document.documentElement.scrollWidth === clientWidth`, not a screenshot.

**Related trap:** Tailwind's `sr-only` is `position: absolute` + `white-space: nowrap`, so
inside a horizontally-scrolling row it escapes the clip and widens the whole document
(measured once at 2399px against a 1281px viewport). Module titles in the carousels use
`aria-label` instead of an `sr-only` span for exactly this reason.

---

## 8. Accessibility notes

### 8.1 Verified working

- **Focus indicator:** one pattern app-wide — `ring-2 ring-ring`, 2px `#5300fa`, 0 offset,
  painted outside the box. Confirmed on a real keyboard-focused control:
  `box-shadow: rgb(83,0,250) 0 0 0 2px`. Outer adjacency ≥5.59:1 on every surface it lands on.
- **Skip link:** "Skip to main content" is the first tab stop and can now actually move
  focus, because `main` carries `tabIndex={-1}`.
- **Tour focus:** focus moves into the coachmark card on open. Guard on the card
  **element**, never an index — under `AnimatePresence mode="wait"` the incoming node
  mounts a commit later than the state change.
- **Live regions:** `Toast` (`role="status"`), `TablePager` range label, onboarding step
  changes, reflection save, opt-out — all `aria-live="polite"`.
- **Unwired controls** are focusable `aria-disabled` buttons carrying an `sr-only
  "(coming soon)"` cue.
- **Disabled player pills** carry the reason in the accessible name
  ("Previous slide (this is the first slide)", "Next slide (complete this slide first)").
- **Semantics:** every decorative icon is `aria-hidden="true"`; every label/number pair is a
  real `<dl>`/`<dt>`/`<dd>`; the module-overview outline is a real `<ol>`; **no avatars
  anywhere** (app-wide rule, no exceptions).
- **Row-level hit areas:** the priorities tiles' title links measure 17px tall but carry
  `after:absolute after:inset-0`, making the whole row the target. Not a target-size failure.

### 8.2 Genuine gaps found by measurement

| Severity | Finding | Measured |
|---|---|---|
| **High** | **Disabled state is invisible on filled and outline buttons.** `aria-disabled="true"` changes only the cursor — opacity 1, same fill, same label colour | "Add note", "Need help", "Schedule new meeting" all measured identical to their enabled state (`bg #4a278f`, `color #ffffff`). 23 `cursor-not-allowed` uses; **1** `opacity-` |
| **High** | **Portal unusable below ~768px**; content column is 0px at 320px with real horizontal scroll | §7.3 |
| **Medium** | **Row-action link-buttons are 17px tall** ("View", "Download" in My Notes and Case notes) — below WCAG 2.2 §2.5.8's 24px minimum. Table name links in the coach clients table are 17px too | measured 32×17 and 65×17 |
| **Medium** | **Checkboxes are 16×16** (`size-4`) on My profile — below 24px | measured |
| **Low** | `ink-faint` **must not** be used on `purple-200` or `card-header` — **3.78:1** | §1.6 of tokens doc |
| **Low** | The two disabled player pills are styled inconsistently — "Previous" carries a 1px white border on `purple-50` (invisible), "Next" carries none | measured `bw: 1px bc: #ffffff` vs `bw: 0px` |
| **Low** | `WaveDivider`'s label renders at `body` 16/400 while every other section heading is `title` 20/500 — the same semantic level at two sizes | measured on `/delivery/notes` ("Your previous notes") and Case notes |

### 8.3 Keyboard interactions to preserve

- Module player: **arrow keys** move between slides — ignored while focus is in a field,
  and they respect the same readiness gate the Next button does.
- `UnderlineTabs`: roving tabindex + arrow keys.
- Outline rail: navigation is **backwards-only**, with `furthestIndex` held separately from
  `stepIndex` so re-reading Chapter 1 cannot make Chapter 2 unreachable again.
- Tour: Escape closes; Tab is trapped inside the card; the scroll lock unwinds fully on close.

---

## 9. Open items for the design owner

Grouped by what kind of decision each needs.

### Needs a design decision

1. **Responsive strategy below 1024px.** The shell has none. The sidebar must become a
   drawer, an icon rail, or a top bar, or the portal must be declared desktop-only in
   writing. At 320px the content column is literally 0px wide. *Pre-existing and app-wide
   across all three shells (flagged Round 19, never actioned) — but it lands hardest here,
   because this is the portal used by the least digitally confident audience.*

2. **Disabled buttons need a visual treatment.** Today `aria-disabled` changes only the
   cursor. Every unwired control in the portal is indistinguishable from a working one —
   which is worse than a greyed-out button for an audience told to expect big, obvious,
   one-action-per-screen affordances.

3. **Loading and error states are entirely unspecified.** No skeletons, no spinners, no
   validation copy, no failed-save treatment, no offline state. All current data is
   synchronous seed data, so nothing has forced the question yet; wiring a real API will.

4. **Row-action affordances are 17px text links.** "View" / "Download" / client names are
   below the 24px target minimum and are the primary way into a record. Either give them a
   padded hit area or promote them to the utility button style.

5. **`WaveDivider`'s label sits at a different type step from every other section heading.**
   Decide whether it is a heading (→ `title` 20/500) or a rule label (→ keep 16/400, and
   consider not making it an `<h2>`).

### Knowingly diverged — confirm or correct

6. **Three tab treatments and two type sizes in one portal.** `UnderlineTabs` at 15px,
   the consumer-detail page's hand-rolled row at 14px, and a local `SegmentedSwitch`.
   Buttons moved to `caption-medium` (14/500) in Round 28; tabs did not follow. This is a
   known, recorded open item, not an oversight — but it is still visible.

7. **The "utility" button style as built is not the one documented.** `CLAUDE.md` defines
   it as `bg-pearl / text-ink-muted / px-4`; the live instance ("Join Zoom") is
   `bg-primary / text-white / rounded-sm / px-5`. Either the doc or the button is wrong.

8. **This portal replaces `bg-card-header` (`#e4d6ff`) with `purple-50` (`#f3efff`)** for
   §35a header bands, deliberately and with code comments — but the app-wide rule does not
   record the exception. Either the rule needs the carve-out written into it, or the portal
   needs to fall in line.

9. **Stage 3 "Peer Role-Play" uses a circle-with-an-X glyph.** Reproduced faithfully from
   the design, but every other UI in the app uses that mark for "error", and in a progress
   rail it reads as a *failed* stage.

10. **The coach Home clients table still has its card wrapper** (`rounded-lg
    border-parchment bg-white shadow-card`, measured 1120×257), though the design log
    records it as removed in Round 40.

11. **`FitbitSyncMonitor` and `FitbitAveragesTable` are cross-portal but do not take
    `viewerRole`**, unlike the other six shared components. If either ever needs
    audience-dependent copy, that is a refactor rather than a prop.

### Cleanup, no design input needed

12. **Ten orphaned components**, including a ~1,745-line `ModuleTimeline` and the entire
    `ui/button` primitive the app does not use. Comments in `StatCard` and
    `CoachProfilePage` still describe the orphaned `KpiTile` as live.
13. **`NotificationHub` lives in `components/delivery/` and is imported only by the
    Research Dashboard.**
14. **`Toast` was extracted at its fifth caller; four earlier call sites still inline it**
    (`OnboardCoachDialog`, `AddAnnotationSummaryModal`, `SpacesCoachProfilePage` ×2).
15. **`rounded-2xl` / `rounded-3xl` silently render 0px** — the tokens exist, the utilities
    are never emitted because nothing uses them. A developer writing either class gets
    square corners with no warning.
16. **`--ring`'s doc comment in `index.css` states a rationale that measurement disproves**
    (1.39:1 against a primary fill). The token value is fine; the comment should be
    corrected so nobody "fixes" the ring by moving it inside the button.
17. **`addAdHocMeeting` has no UI caller in any portal** since Round 36 removed the panel
    that triggered it. A data-layer capability with no owner is not the same as dead code —
    but it should be decided either way.
18. **Onboarding and the tour are never persisted**, so both replay on every single load of
    `/delivery`. Reviewers click four screens plus seven coachmarks each time. There is also
    no re-entry point for either once dismissed.
19. **"Know more" and "Learn more" on Home remain unwired** (`aria-disabled`) pending a
    destination, open since Round 31.
