# Design tokens

Every token below is defined in **`app/src/index.css`**, which is the single
source of truth. This file is a readable index of it — if the two ever
disagree, `index.css` is right.

Tokens are consumed as Tailwind v4 utilities: `--color-purple-700` is
`bg-purple-700` / `text-purple-700`, `--text-title` is `text-title`,
`--radius-lg` is `rounded-lg`.

Spacing is stock Tailwind (`p-4`, `gap-6`, …). There are no custom spacing
tokens.

---

## Colour

### Brand — purple

`--primary` is `purple-700`. Every brand-coloured element uses it.

| Token | Value | Used for |
|---|---|---|
| `--color-purple-50` | `#f3efff` | Page hero band, table header rows |
| `--color-purple-200` | `#e4d6ff` | — |
| `--color-purple-300` | `#c2a3ff` | — |
| `--color-purple-400` | `#a070ff` | Links on dark surfaces |
| `--color-purple-500` | `#8447ff` | — |
| `--color-purple-700` | `#4A278F` | **`--primary`**. Buttons, record-page hero band, active nav |
| `--color-purple-900` | `#200061` | `--primary-hover` |
| `--color-purple-950` | `#08001a` | — |
| `--color-on-purple-muted` | `#c4b5fc` | Idle tab labels on the purple hero band |
| `--color-card-header` | `#e4d6ff` | The card header band above a card's divider |

### Brand — yellow

| Token | Value | Used for |
|---|---|---|
| `--color-yellow-50` | `#fff8e5` | Section shells |
| `--color-yellow-100` | `#fff0cc` | Contact-detail panels |
| `--color-yellow-200` | `#ffe299` | Day header rows |
| `--color-yellow-300` | `#ffcc4d` | Active tab underline on the purple band |
| `--color-yellow-400` | `#ffb600` | — |

KPI tiles (`StatCard`) are `yellow-100` with a purple icon.

### Neutrals

| Token | Value | Used for |
|---|---|---|
| `--background` | `#fffcfa` | Page canvas. **Warm, not white** |
| `--card` | `#ffffff` | Card surfaces |
| `--color-ink` | `#1a1a1a` | Body text (a soft black, not `#000`) |
| `--color-ink-muted` | `#333333` | Secondary text |
| `--color-ink-faint` | `#6d6d6d` | Tertiary text. Lightest grey that still clears AA |
| `--color-parchment` | `#f5f5f7` | Card border, textarea fill |
| `--color-pearl` | `#f5f5f7` | Inset panels **inside** a white card |
| `--color-hairline` | `#e0e0e0` | Dividers, input borders |
| `--color-header` | `#000000` | The global top bar |

> `pearl` is a cool grey and `--background` is warm. `pearl` reads correctly
> inside a white card and reads as a foreign patch directly on the page canvas.

### Semantic

| Token | Value | Used for |
|---|---|---|
| `--color-success` | `#1f7d37` | Completed / active status chips |
| `--destructive` | `#d70015` | Errors, "Not assigned", withdraw actions |
| `--color-alert-pastel` | `#e45f5b` | The attention-section alert count badge |
| `--ring` | `#5300fa` | Focus ring |

---

## Type

Family is **Inter** everywhere, self-hosted via `@fontsource-variable/inter`.
`--font-sans` and `--font-display` both resolve to Inter.

**Every step's line height is `normal`** except `display-xl` (`1.05`) and
`caption` (`130%`). Do not reintroduce ratios.

| Token | Size | Weight | Letter-spacing | Used for |
|---|---|---|---|---|
| `--text-display-xl` | 56px | 500 | -1px | Largest hero titles |
| `--text-display-lg` | 40px | 500 | 0 | Record-page name in the hero band |
| `--text-display-md` | 32px | 500 | -0.374px | Page hero titles |
| `--text-title` | 22px | 500 | 0 | Section and card headings |
| `--text-sub-greeting` | 18px | 400 | 0 | Hero sub-lines |
| `--text-body-md` | 16px | 600 | 0 | Emphasised body, field values |
| `--text-body` | 16px | 400 | 0 | Body copy |
| `--text-caption-medium` | 14px | 500 | -0.224px | **All button labels**, chips |
| `--text-caption` | 14px | 400 | -0.224px | Table cells, secondary copy |
| `--text-fine` | 12px | 600 | -0.12px | Status chips, meta text |

Tab labels are `text-[15px]`, not a token — a known divergence from buttons.

---

## Radius

| Token | Value | Used for |
|---|---|---|
| `--radius-xs` | 4px | — |
| `--radius-sm` | 8px | Utility buttons, quick-action pills |
| `--radius-md` | 11px | — |
| `--radius-lg` | 16px | **Cards** (the `Card` component's own default) |
| `--radius-2xl` | 24px | — |
| `--radius-3xl` | 28px | — |
| `--radius-4xl` | 32px | — |

Pill buttons use `rounded-full`, not a token.

---

## Shadow

| Token | Value | Used for |
|---|---|---|
| `--shadow-card` | `2px 4px 16px rgba(230,194,127,0.2)` | Cards. A warm gold, offset down-and-right |
| `--shadow-float` | `3px 5px 30px rgba(0,0,0,0.22)` | Floating overlays |
| `--shadow-notice-card` | `4px 4px 12px rgba(0,0,0,0.06)` | Attention cards |

Shadow presence is deliberate per element. A card that should be flat passes
`shadow-none` explicitly.

---

## Component rules that are not tokens

These are conventions the code enforces rather than CSS variables, but you
need them to build a consistent screen.

**Cards** — 16px radius plus a 1px `parchment` stroke, both from the `Card`
component's default. Don't repeat them at a call site. A card with no outline
passes `border-0`.

**Buttons** — three styles, all `text-caption-medium`, all `h-9`:

| Style | Classes |
|---|---|
| Primary filled | `h-9 rounded-full bg-primary px-[18px] text-caption-medium text-white hover:bg-primary-hover` |
| Primary outline | same pill + `border border-primary text-primary hover:bg-primary/5` |
| Utility | `h-9 rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted` |

Never put an explicit `font-semibold`/`font-bold` on a button — it overrides
the token and renders 600.

**36px minimum control height** (`h-9`). `h-9` is a height, not a minimum: a
flex child in a fixed-height container needs `shrink-0` or flex-shrink will
compress it below the floor.

**Tabs** — a sliding `framer-motion` `layoutId` underline, spring
`stiffness: 500, damping: 35`. Two variants, and they are not
interchangeable:

| Where | Underline |
|---|---|
| Section tabs on the page canvas (`UnderlineTabs`) | `h-0.5 bg-primary` |
| Record-page tabs on the purple hero band | `h-[3px] bg-yellow-300` |

`primary` would be invisible on the purple band, which is why the record-page
variant exists. Each mounted tab row needs its own unique `layoutId`.

---

## Two measurement warnings

1. **Contrast must be measured from painted pixels**, not calculated from the
   hex above. Tailwind v4 ships `oklch()`, so what the browser paints is not
   always the authored value. Read `getComputedStyle`, then apply the WCAG
   relative-luminance formula. For a translucent fill, composite the ancestor
   layers first.
2. **A tint below roughly 8% opacity is not a visible state change.**
   `hover:bg-primary/5` over the page canvas composites to about a 9-per-channel
   shift — present in the DOM, invisible on screen.

See `accessibility-report.md` for measured values.
