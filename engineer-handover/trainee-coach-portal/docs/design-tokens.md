# Design tokens — Care2Sleep Trainee / Coach Delivery Portal

**Scope:** `/delivery/*` and `/training-v2/*` (Coach Delivery Portal + module overview/player).
**Method:** every value below was read from the running app at `http://localhost:57953`
via `getComputedStyle` / `getBoundingClientRect`, with colours **rasterised through a
1×1 canvas** (fill white, fill the computed colour, read the pixel) — never parsed from
the computed string, because Tailwind v4 emits `oklab()`/`oklch()` and parsing that as
RGB returns nonsense.
**Measured at:** viewport 1440×900 unless stated. Date of measurement: 2026-08-31.

---

## 0. Authority

> **`src/index.css` is the single source of truth for token definitions.**
> If this document and `index.css` ever disagree, `index.css` wins and this document is
> stale. Everything here was transcribed *from* `index.css` and then **verified against
> the painted result in the browser** — the rasterised column below is the proof, not a
> second opinion.

Two further authority notes, both learned the hard way in this project:

- The design log (`design/design-tokens.md`, §74–§80) records reasoning that is often more
  useful than the number itself, but it has been wrong about painted values before. Where
  this document and the design log disagree, **the running app wins** and the disagreement
  is called out in §9.
- A green `tsc` is not evidence that anything renders. Nothing in this document is derived
  from a typecheck.

---

## 1. Colour tokens

### 1.1 Rasterisation result

**Every authored hex in `index.css` rasterises byte-identical to its painted value.**
This was checked for all 38 colour tokens; the drift list came back empty. The
authored/painted columns are therefore the same, and only one column is given below.

The reason this check matters anyway: tokens are consumed through Tailwind v4 utilities,
which round-trip through `oklab()`. The round-trip is lossless *for these values*, but a
composited translucent fill (`bg-primary/8`, `bg-destructive/10`) is **not** a token and
must always be measured after compositing — see §1.6.

### 1.2 Brand ramp — purple

Eight steps. The gaps (no `purple-100`/`600`/`800`) are deliberate: this is a real 8-step
brand ramp read from Figma's published `Purple/*` styles, not a synthesised 11-step one.

| Token | Value | Painted | Primary use in this portal |
|---|---|---|---|
| `--color-purple-50` | `#f3efff` | `#f3efff` | Module player footer band; Part A tier canvas; table `<th>` band; card-header bands (portal-local, see §6.3); outline-button hover fill; sidebar nav hover |
| `--color-purple-200` | `#e4d6ff` | `#e4d6ff` | **Sidebar card surface**; also the app-wide `--color-card-header` value (which this portal does *not* use) |
| `--color-purple-300` | `#c2a3ff` | `#c2a3ff` | — (not exercised in this portal) |
| `--color-purple-400` | `#a070ff` | `#a070ff` | `--color-link-on-dark` (global header "Switch portal"); onboarding blob stroke (`BLOB_STROKE`) |
| `--color-purple-500` | `#8447ff` | `#8447ff` | Pathway connector gradient start |
| `--color-purple-700` | `#4A278F` | `#4a278f` | **= `--primary`.** Every brand-coloured element |
| `--color-purple-900` | `#200061` | `#200061` | **= `--color-primary-hover`** |
| `--color-purple-950` | `#08001a` | `#08001a` | — |

### 1.3 Brand ramp — yellow

| Token | Value | Painted | Use |
|---|---|---|---|
| `--color-yellow-50` | `#fff8e5` | `#fff8e5` | My Learning progress card; module-overview outcomes card; My Notes / Case notes table shell; Part B tier canvas |
| `--color-yellow-100` | `#fff0cc` | `#fff0cc` | 1px stroke on both yellow cards above |
| `--color-yellow-200` | `#ffe299` | `#ffe299` | Table day headers (shared `MeetingsSection`) |
| `--color-yellow-300` | `#ffcc4d` | `#ffcc4d` | Active tab underline on a purple hero band (researcher pages); `Chip tone="yellow"` |
| `--color-yellow-400` | `#ffb600` | `#ffb600` | — |

### 1.4 Neutrals

Six styles, mapped 1:1 to Figma's `neutral/*`. Note that `parchment`, `pearl`,
`divider-soft`, `--muted`, `--secondary` and `--accent` **all resolve to the same
`#f5f5f7`** — there is exactly one off-white in the app. The alias names are kept because
they say what the colour is *for*; do not reintroduce a different hex behind one of them.

| Token | Value | Painted | Use |
|---|---|---|---|
| `--color-ink` (`--foreground`) | `#1a1a1a` | `#1a1a1a` | Body text, headings |
| `--color-ink-muted` | `#333333` | `#333333` | Table `<th>` labels, idle tab labels, secondary copy, disabled player pills |
| `--color-ink-faint` | `#6d6d6d` | `#6d6d6d` | Meta lines, placeholders, timestamps. **Do not use on `card-header` / `purple-200` — 3.78:1, fails AA** (§1.6) |
| `--color-parchment` | `#f5f5f7` | `#f5f5f7` | **Card stroke** (`border-parchment`); textarea fill on My Notes |
| `--color-pearl` | `#f5f5f7` | `#f5f5f7` | Alias of parchment. Demo stage-switcher track |
| `--color-divider-soft` | `#f5f5f7` | `#f5f5f7` | Alias of parchment |
| `--color-hairline` (`--border`, `--input`) | `#e0e0e0` | `#e0e0e0` | Input strokes, rules |
| `--color-header` | `#000000` | `#000000` | Global `AppHeader` bar (48px, all portals) |
| `--color-on-dark-muted` | `#cccccc` | `#cccccc` | Account name in the black header |
| `--color-link-on-dark` | `#a070ff` | `#a070ff` | "Switch portal" in the black header |

### 1.5 Semantic and surface

| Token | Value | Painted | Use |
|---|---|---|---|
| `--background` | `#fffcfa` | `#fffcfa` | Page canvas (warm off-white — **not** white) |
| `--card` / `--popover` | `#ffffff` | `#ffffff` | Card and modal surfaces |
| `--primary` | `#4A278F` | `#4a278f` | All three button styles, links, active nav, tab underline |
| `--primary-foreground` | `#ffffff` | `#ffffff` | Label on filled primary |
| `--color-primary-hover` | `#200061` | `#200061` | Hover fill on filled primary; hover text on link-buttons |
| `--ring` | `#5300fa` | `#5300fa` | **The one and only focus indicator colour** (§6.4) |
| `--color-success` | `#1f7d37` | `#1f7d37` | `Chip tone="success"`, completed pathway markers |
| `--destructive` | `#d70015` | `#d70015` | Opt-out card, delete icon buttons, "not shared" chip |
| `--color-on-purple-muted` | `#c4b5fc` | `#c4b5fc` | Step counter inside the tour card (on `primary`) |
| `--color-card-header` | `#e4d6ff` | `#e4d6ff` | App-wide §35a header band — **deliberately unused in this portal**, see §6.3 |
| `--color-alert-pastel` | `#e45f5b` | `#e45f5b` | Research Dashboard only; not rendered here |

### 1.6 Contrast — measured, recomputed from painted pixels

Every ratio below was recomputed in-browser from rasterised pixels and the WCAG
relative-luminance formula. **None are copied from the design log.** Thresholds: 4.5:1
normal text, 3:1 large text (≥24px, or ≥18.66px bold) and graphical indicators.

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `white` | `primary` | **10.62:1** | AAA — filled primary button |
| `white` | `primary-hover` | **17.02:1** | AAA — filled primary, hover |
| `primary` | `card` (white) | **10.62:1** | AAA — outline button, links |
| `primary` | `background` | **10.39:1** | AAA |
| `primary` | `purple-50` | **9.40:1** | AAA — outline button hover fill |
| `primary` | `purple-200` | **7.77:1** | AAA — **active sidebar nav row** |
| `ink` | `purple-200` | **12.73:1** | AAA — idle sidebar nav row |
| `ink` | `card` | **17.40:1** | AAA |
| `ink` | `background` | **17.04:1** | AAA |
| `ink` | `parchment` | **15.98:1** | AAA |
| `ink` | `purple-50` | **15.42:1** | AAA |
| `ink` | `yellow-50` | **16.42:1** | AAA |
| `ink` | `yellow-100` | **15.41:1** | AAA |
| `ink` | `yellow-200` | **13.75:1** | AAA |
| `ink` | `yellow-300` | **11.60:1** | AAA |
| `ink-muted` | `card` | **12.63:1** | AAA |
| `ink-muted` | `parchment` | **11.60:1** | AAA |
| `ink-muted` | `purple-50` | **11.19:1** | AAA — table `<th>`; disabled player pills |
| `ink-muted` | `purple-200` | **9.24:1** | AAA |
| `ink-faint` | `card` | **5.17:1** | AA |
| `ink-faint` | `background` | **5.07:1** | AA |
| `ink-faint` | `parchment` | **4.75:1** | AA (thin margin) |
| `ink-faint` | `purple-50` | **4.58:1** | AA (thin margin) |
| `ink-faint` | `yellow-50` | **4.88:1** | AA |
| **`ink-faint`** | **`purple-200` / `card-header`** | **3.78:1** | ❌ **FAILS AA.** Never put `ink-faint` on the sidebar or on a `card-header` band. Use `ink-muted`. |
| `success` | `card` | **5.19:1** | AA |
| `destructive` | `card` | **5.38:1** | AA |
| `on-purple-muted` | `primary` | **5.74:1** | AA — tour step counter |
| `parchment` | `primary` | **9.75:1** | AAA — tour "Skip" label |
| `yellow-300` | `primary` | **7.08:1** | AAA — active underline on a purple band |
| `link-on-dark` (`#a070ff`) | `header` (`#000`) | **7.99:1** | AAA |
| `on-dark-muted` (`#ccc`) | `header` (`#000`) | **13.86:1** | AAA |
| **`ring`** | **`background`** | **7.48:1** | ✅ passes 3:1 — the focus ring's *outer* adjacency |
| **`ring`** | **`card`** | **7.64:1** | ✅ |
| **`ring`** | **`purple-50`** | **6.77:1** | ✅ |
| **`ring`** | **`purple-200`** | **5.59:1** | ✅ — sidebar focus |
| **`ring`** | **`primary` fill** | **1.39:1** | ⚠️ see note below |

**Focus-ring note (a correction to `index.css`).** The comment on `--ring` claims the value
is "brighter than `--primary` on purpose, so a focus ring stays visible where it sits
directly on a filled primary button." Measured, `#5300fa` on `#4A278F` is **1.39:1** — a
ring drawn *on* a primary fill would be effectively invisible. The pattern works only
because Tailwind's `ring-2` with `--tw-ring-offset-width: 0px` paints **outside** the
border box (verified: `box-shadow: rgb(83,0,250) 0 0 0 2px` on a real keyboard-focused
control), so the indicator's meaningful adjacency is the page surface at 7.48:1, not the
button fill. **Do not "improve" this by moving the ring inside the button.**

**Translucent fills must be composited before measuring.** Two live in this portal:
`hover:bg-destructive/10` (delete icon buttons, My Notes / Case notes) and
`hover:bg-white` (notification tile options button on `purple-50`). A naive read of
`background-color` on either returns a meaningless value. Walk the ancestors, alpha-blend
each layer, then measure.

---

## 2. Typography

Family: **Inter**, self-hosted (`@fontsource-variable/inter`). `--font-sans` and
`--font-display` both resolve to Inter but remain separate tokens.

`--font-sans` / `--font-display`:
`"Inter Variable", "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

All values below are `getComputedStyle` reads on live elements carrying each class.

| Step | Size | Weight | Line-height (computed) | Letter-spacing | Where it renders in this portal |
|---|---|---|---|---|---|
| `display-xl` | 56px | 500 | **58.8px** (`1.05`) | -1px | Not exercised in this portal |
| `display-lg` | 40px | 500 | `normal` → **48.5px** | 0 | **Every page H1**; onboarding screen titles; module-overview hero title |
| `display-md` | 32px | 500 | `normal` → **~39px** | -0.374px | Module player slide `<h1>` |
| `sub-greeting` | 18px | 400 | `normal` → **~22px** | 0 | Onboarding sub-copy |
| `sub-greeting-semibold` | 18px | 600 | `normal` | 0 | Wizard step headings |
| `title` | 20px | 500 | `normal` → **24.5px** | 0 | **Every card / section H2** |
| `body-md` | 16px | 600 | `normal` → **19.5px** | 0 | Active sidebar nav row; module-outline row titles |
| `body` | 16px | 400 | **22.4px** (`1.4`) | 0 | Body copy; idle sidebar nav row; My Notes input + textarea |
| `caption-medium` | 14px | 500 | `normal` → **~17px** | -0.224px | **All three button styles**; table `<th>`; active consumer-detail tab; link-buttons |
| `caption` | 14px | 400 | **18.2px** (`130%`) | -0.224px | Meta text; idle consumer-detail tab; search input |
| `fine` | 12px | **600** | `normal` → **~15px** | -0.12px | Chips, badges, header links, counts |

**Line-height rules worth knowing.** Round 23 set every step to `normal` after measuring
that Figma's `AUTO` *is* the browser's Inter metric (≈1.21×). Three deliberate exceptions
survive and are confirmed by measurement: `display-xl` at `1.05`, `caption` at `130%`,
and `body` at `1.4`. Do not reintroduce ratios on any other step.

**15px is not a step, and it is still in use.** Tabs render at a hardcoded `text-[15px]`
(`MeetingsSection` / `UnderlineTabs`: measured 15px/600 active, 15px/500 idle) and so does
the module-overview "Back to Learning" link (15px/600). Buttons moved to `caption-medium`
(14/500) in Round 28 and tabs did not follow. **This divergence is real, measured, and
unresolved** — see §9.

---

## 3. Radius

Measured by applying each utility to a probe element.

| Token | Value | Measured | Use |
|---|---|---|---|
| `--radius-xs` | 4px | **4px** | Third-level nesting; link-button focus target |
| `--radius-sm` | 8px | **8px** | Inputs, textareas, nav rows, icon buttons, chips-on-tabs, "Join Zoom" |
| `--radius-md` | 11px | **11px** | (computed 11px against a frame's 12px — a knowingly accepted 1px divergence) |
| `--radius-lg` | 16px | **16px** | **Cards** — the card contract radius |
| `--radius-xl` | 16px | **16px** | Alias of `lg`; the sidebar card and player rail use `rounded-xl` |
| `--radius-2xl` | 24px | **0px** ⚠️ | See note |
| `--radius-3xl` | 28px | **0px** ⚠️ | See note |
| `--radius-4xl` | 32px | **32px** | — |
| `rounded-full` | — | **`1.67772e+07px`** | All three pill buttons |

⚠️ **`rounded-2xl` and `rounded-3xl` compute to `0px`.** The tokens are defined in
`index.css`, but Tailwind v4 only emits utilities it finds in the source, and neither class
is used anywhere in the app — so the class name exists in the design system and does
nothing if written. **A developer who writes `rounded-2xl` will silently get square
corners.** This is a JIT artifact, not a broken token, but it is a real trap.

**Nesting rule (standing):** a rounded element nested inside a card takes *half* its
parent's radius. 16px card → `rounded-sm` (8px) inner panel → `rounded-xs` (4px) at the
third level.

---

## 4. Shadow

| Token | Value | Where |
|---|---|---|
| `--shadow-card` | `2px 4px 16px 0 rgba(230, 194, 127, 0.2)` | **Default on every `Card`.** A *warm gold*, offset down-and-right — verified live on Home, My Notes, My profile, the player rail |
| `--shadow-float` | `3px 5px 30px rgba(0, 0, 0, 0.22)` | Reserved for elements resting *above* a surface. Never on buttons or text |
| `--shadow-notice-card` | `4px 4px 12px 0 rgba(0, 0, 0, 0.06)` | Research Dashboard alert card; not rendered here |

Two **portal-local** shadows are not tokens and were measured off the live nodes:

| Element | Measured `box-shadow` | Why it differs |
|---|---|---|
| **Sidebar card** (`aside`) | `rgba(85, 85, 85, 0.1) 2px 4px 16px 0px` | Same geometry as `shadow-card`, **neutral grey not gold** — a gold cast reads as a smudge on the `purple-200` surface |
| **My Learning module cards** | `rgba(102, 42, 213, 0.1) 2px 4px 16px 0px` | Purple-tinted, because these cards sit on a `purple-50` / `yellow-50` tier canvas rather than the page |
| **Tour coachmark card** | `rgba(0, 0, 0, 0.2) 0px 8px 12px 0px` | Straight-down, heavier — it floats over a dimmed page |

**Absence is a spec.** If an element has no shadow in the design it gets `shadow-none`
explicitly; `Card` defaults to `shadow-card`, so a flat card must opt out.

---

## 5. Spacing

There is no bespoke spacing scale. Tailwind's default `--spacing: 0.25rem` (4px) base
applies. The values that are *structural* — i.e. that a developer must not invent — are:

| Measured value | Meaning |
|---|---|
| **48px** | Vertical rhythm between top-level page sections (`gap-12`). Verified as an exact, flat 48px between all five Home blocks |
| **64px** | Page top and bottom inset inside the content column (`pt-16 pb-16`) |
| **24px / 48px** | Shell row padding — **left 24px, right 48px** (deliberately asymmetric, §6.1) |
| **48px** | Shell gap between sidebar and content column |
| **32px** | Module player gap between outline rail and content area |
| **24px** | Card inner padding on tier canvases, tour card, StatCard-style tiles |
| **32px** | Card inner padding on the write-a-note card (`p-8`) |
| **20px** | Sidebar nav row pitch gap (`mt-5`), giving a 56px row-to-row pitch with 36px rows |
| **1320px** | `max-w-[1320px]` cap on the content column (does not bind below ~1640px viewport) |

---

## 6. Component rules that are NOT tokens

These are contracts, not variables. They outrank any design frame.

### 6.1 Shell grid

Measured at 1440×900 with the sidebar expanded:

```
┌─ AppHeader ─────────────────────────────────── 1440 × 48, #000000 ─┐
├── row: flex, padding 24px 48px 24px 24px, gap 48px ────────────────┤
│  aside  x=24  w=200  (sticky, top:72px, h=804)                     │
│  main   x=272 w=1120 (min-w-0, flex-1, tabIndex=-1)                │
└────────────────────────────────────────────────────────────────────┘
```

- **`main` width = viewport − 320px, at every viewport.** Verified linear at
  1440→1120, 1280→960, 1024→704, 768→448, 375→55, 320→**0**.
- The **24px-left / 48px-right asymmetry is deliberate** and load-bearing — it comes from
  the frame's own column grid. Do not "fix" it to symmetric.
- `main` carries `tabIndex={-1}` so the "Skip to main content" link can actually move focus.
- Sidebar is a **floating card**, not a rail: `rounded-xl` (16px), `bg-purple-200`,
  neutral-grey shadow, `sticky top-72px`, `overflow-hidden`, `transition-[width] 200ms`.
- Nav rows: `x=40 w=168` (16px inset each side), `min-h-9` (36px), `rounded-sm`, `-mx-2 px-2`.
- Collapse toggle: `size-9` (36×36) at the sidebar's top-right, `aria-label="Collapse navigation"`.

### 6.2 The three canonical button styles

Measured on live controls. **The 36px floor is a floor, not a cap** — trainee-facing CTAs
render at 44px (`h-11`) by design and that is correct.

| | **Primary filled** | **Primary outline** | **Utility** |
|---|---|---|---|
| Height | `h-9` 36px / `h-11` **44px** | `h-9` 36px / `h-11` **44px** | `h-9` **36px** |
| Radius | `rounded-full` | `rounded-full` | `rounded-sm` **8px** |
| Padding | `px-[18px]` → **0 18px** | `px-[18px]` → **0 18px** | `px-5` → **0 20px** |
| Fill | `bg-primary` `#4a278f` | `bg-white` / transparent | `bg-primary` `#4a278f` |
| Stroke | none | `border border-primary` **1px `#4a278f`** | none |
| Label | `text-caption-medium` white | `text-caption-medium` `#4a278f` | `text-caption-medium` white |
| Type | **14px / 500 / -0.224px** | **14px / 500 / -0.224px** | **14px / 500 / -0.224px** |
| Hover | `bg-primary-hover` `#200061` (17.02:1) | `bg-purple-50` `#f3efff` (9.40:1) | `bg-primary-hover` `#200061` |
| Focus | `ring-2 ring-ring` (2px `#5300fa`, 0 offset, outside) | same | same |
| Transition | `transition-colors` 150ms `cubic-bezier(0.4,0,0.2,1)` | same | same |

**Never put a hardcoded size or tracking on a button.** An explicit `font-semibold` /
`font-bold` *overrides* the token and silently keeps rendering 600 — strip it.

**The measured "utility" style diverges from the documented one.** `CLAUDE.md` defines
utility as `h-9 rounded-sm bg-pearl px-4 text-ink-muted hover:bg-divider-soft`. The only
control in this portal filling that role — "Join Zoom" on Home — measures
`h-9 rounded-sm bg-primary px-5 text-white`, i.e. a **square-cornered filled primary**.
See §9.

**Hover must be a real, composited shift.** `hover:bg-purple-50` on white is a
(12, 16, 0) per-channel move — visible. A tint at `primary/5` composites to roughly a
9-per-channel shift, is present in the DOM and invisible on screen, and this project has
shipped that as "no hover state". Measure the composited colour, never trust the class.

### 6.3 Card contract

Every `Card` carries all of the following **from its own default** — do not repeat them at
a call site, and do not reach for `ring-*` (the design draws a *stroke*; a ring paints
outside the box where a border is part of it):

- `border-radius: 16px`
- `border: 1px solid var(--color-parchment)` `#f5f5f7`
- `box-shadow: 2px 4px 16px 0 rgba(230,194,127,0.2)`
- `background: var(--card)` `#ffffff`

A card that genuinely wants no outline passes `border-0`; a flat card passes `shadow-none`.
Modals and menu popups are **not** cards and keep `ring-1 ring-hairline`.

**Header band + divider (§35a) — portal-local divergence.** App-wide, a card title block
takes `bg-card-header` (`#e4d6ff`) plus a `border-t border-hairline` divider above the
content section. **This portal uses `purple-50` (`#f3efff`) instead**, deliberately and
with in-code comments saying so (`DeliveryAccountPage.tsx:42`,
`DeliveryConsumerDetailPage.tsx:1620`). `NotificationPreferencesCard` is passed
`headerClassName="bg-purple-50"` at the coach call site while every other portal lets it
fall through to `bg-card-header`. Documented §35a exceptions (pure message + CTA cards
with no distinct content section) still apply.

### 6.4 Focus indicator

**One pattern, app-wide, verified on real keyboard focus:**

```
outline-none focus-visible:ring-2 focus-visible:ring-ring
→ box-shadow: rgb(83, 0, 250) 0 0 0 2px   (2px, --ring #5300fa, 0 offset, outside the box)
```

- Programmatic `.focus()` does **not** trigger it — `:focus-visible` needs a keyboard
  interaction. Verify with real Tab presses.
- `.focus()` on a `visibility: hidden` element silently does nothing.
- Focus must never fall to `<body>`. Any control that unmounts on click must move focus
  somewhere deliberate. This project has shipped that bug in six separate rounds.

### 6.5 Tab treatment

Three different tab treatments are live in this portal. This is measured fact, not a
reading of intent:

| Treatment | Where | Height | Type | Active | Idle | Underline |
|---|---|---|---|---|---|---|
| **`UnderlineTabs`** (shared) | `/delivery/meetings` | 42.5px (`py-2.5`) | **15px** | 600 / `primary` | 500 / `ink` | `framer-motion` `layoutId`, `h-0.5 bg-primary`, spring `stiffness 500 / damping 35` |
| **Hand-rolled page tabs** | `/delivery/consumers/:id` | **44px** (`min-h-11`, `pb-3`), `gap-8` | **14px** | `caption-medium` / `primary` | `caption` / `ink-muted` | 2px `bg-primary`, over a full-width 1px `border-purple-700` rule |
| **`SegmentedSwitch`** (local) | Client sleep & health data | 36px | 14px | — | — | none (segmented pill) |

### 6.6 Chips

`Chip` (`components/research/StatusChip.tsx`, rendered in this portal) has **one fixed
geometry**: 27px tall, `px-4`, `text-fine` (12/600). Tones — `success`, `neutral`, `muted`,
`warning`, `next`, `destructive`, `yellow` — all render filled tint + matching-tint border +
coloured text, differing only in hue. Fill opacity is 8%, deliberately lower than it looks
like it should be: these text colours sit close in lightness to their own tint, so 10%+
pulls contrast *under* 4.5:1, and lowering opacity lightens the background, which **raises**
contrast against dark text. A design that draws its own smaller pill loses.

### 6.7 Form controls

| Control | Height | Radius | Fill | Stroke | Type |
|---|---|---|---|---|---|
| Text input (My Notes title) | **44px** (`h-11`) | 8px | `#ffffff` | 1px `hairline` | `body` 16/400 |
| Textarea (My Notes body) | **160px** (`h-40`), `resize-y` | 8px | **`parchment` `#f5f5f7`** | 1px `hairline` | `body` 16/400 |
| `SearchInput` | **36px** (`h-9`) | `rounded-full` | `bg-card` | 1px `hairline` | `caption` 14/400, `pl-10 pr-4` |
| Checkbox | **16px** (`size-4`) ⚠️ | `rounded-xs` | — | `border-hairline` | accent `primary` |

Placeholders are `text-ink-faint`. Every field has a real `<label htmlFor>`.
`SearchInput` width goes through `widthClassName`, **never** on the inner input.

⚠️ Checkboxes measure 16×16 — below WCAG 2.2 §2.5.8's 24px minimum. Pre-existing; see §9.

---

## 7. Motion

Motion is owned by a separate document. **See `motion-spec.md`.**

The only motion facts recorded here are the ones that are token-shaped:

- `--default-transition-duration: 150ms`
- `--default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)`
- `--ease-out: cubic-bezier(0, 0, 0.2, 1)`
- `--animate-spin: spin 1s linear infinite`
- `--animate-ping: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite`
- A global `prefers-reduced-motion: reduce` block clamps all animation and transition
  durations to `0.01ms`.

---

## 8. Orphaned tokens

Defined in `index.css`, **zero readers in this portal** (several have zero readers app-wide).
Listed so nobody re-derives their purpose:

`--color-badge-purple` `#6d28d9` · `--color-highlight` `#fdf6e0` ·
`--color-reflection-panel` `#f5f3ff` (its only consumer, `AiReflectionPanel`, is orphaned) ·
`--color-plan-module` `#4ade80` / `--color-plan-catchup` `#facc15` (Plan Sessions wizard
only) · `--color-signin-backdrop` `#0a1a3a` (the sign-in gate was deleted in Round 9) ·
`--color-chart-cat-1…7` and `--color-chart-accuracy-light` (Research Dashboard chart only) ·
`--color-alert-pastel` `#e45f5b` (Research Dashboard only).

---

## 9. Where the running app disagrees with the design log

Recorded because these are the highest-value findings in this audit. **In all six cases the
running app is what ships; treat this table as the correction.**

1. **`--ring`'s stated purpose is unachievable.** `index.css` says the value is bright
   enough to stay visible *on* a filled primary button. Measured: **1.39:1**. It works
   only because the ring paints outside the box (7.48:1 against the canvas).

2. **`rounded-2xl` / `rounded-3xl` render 0px.** The tokens (24px / 28px) exist; the
   utilities are never emitted because nothing uses them. Writing the class gives square
   corners silently.

3. **The "utility" button style does not match its written definition.** Documented as
   `bg-pearl / text-ink-muted / px-4`; the live instance ("Join Zoom") is
   `bg-primary / text-white / px-5`.

4. **The coach Home clients table still has its card wrapper.** The design log records
   Round 40 as having removed it. Measured live:
   `overflow-x-auto rounded-lg border border-parchment bg-white shadow-card`, 1120×257.

5. **`bg-card-header` is not used in this portal.** The app-wide §35a band token
   (`#e4d6ff`) is replaced by `purple-50` (`#f3efff`) here, deliberately and with code
   comments — but the app-wide rule as written does not say so.

6. **Buttons and tabs are diverged, and tabs are internally diverged too.** Buttons are
   `caption-medium` (14/500) app-wide. `UnderlineTabs` is 15px; the consumer-detail page's
   hand-rolled tab row is 14px. Three tab treatments, two type sizes, one portal.
