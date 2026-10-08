# Design tokens — Care2Sleep Consumer Portal

The complete token system as it now stands, with every value measured rather than
transcribed.

**Source of truth, in this order:**

1. `app/src/consumer-tokens.css` — everything this portal defines for itself
   (18 type steps, 11 colours, the header height, the canvas gradient, the
   pillow keyframes).
2. `app/src/index.css` — the app-wide layer this portal inherits from
   (neutrals, the purple/yellow ramps, radii, shadows, `--background`).
3. `app/src/lib/utils.ts` — the `cn()` / `tailwind-merge` registry. A type token
   missing from it is silently dropped at runtime. See §1.5.

This document does not repeat per-surface layout; that is `design-handoff.md`.
Wavy and organic artwork has its own document, `wave-and-blob-shapes.md`.

---

## 0. Read this before you trust anything you see in a browser

**The CSS build in this package currently fails.** `app/src/index.css:723` is:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
```

`border-border` needs a `--color-border` (or `--border`) theme entry. The
colour dedupe removed it — `#e0e0e0` already had a name (`--color-hairline`),
and one hex now has exactly one token. There is no `--border` declaration
anywhere in `src/` any more, so Tailwind throws:

```
Cannot apply unknown utility class `border-border`
```

Reproduced two ways: requesting the stylesheet from the dev server returns a
500 carrying that message, and compiling `src/index.css` directly with the
package's own `tailwindcss@4.3.3` fails with it.

The consequence is not cosmetic and it is easy to be fooled by: **a dev server
that was already running keeps serving its last successful build.** The page at
`http://localhost:5220` is currently painting a *pre-fix* stylesheet — it still
carries `--text-consumer-lead: clamp(1rem, …)` (the old 16→20 ramp) and a
`.bg-pearl` rule for a token that no longer exists. Everything in this document
was measured against a **fresh compile of the current source**, not against that
stale sheet.

Two ways to get a correct build:

- Give `border-border` a target again — restore `--color-border: var(--color-hairline)`
  in the `@theme` block, **or**
- change that one line to `@apply border-hairline outline-ring/50`, which is
  what the deleted `--border` resolved to anyway (`index.css:171` documents the
  mapping `neutral/lighter-grey #e0e0e0 -> --color-hairline, --border`).

This is left for the owning engineer to decide rather than patched here, because
it is a one-line change in a file this handover was asked not to edit. Until it
is made, `npm run build` fails and the dev server silently serves stale CSS.

**How to re-measure anything below.** Colours: Tailwind v4 emits `oklab()`/
`oklch()` and `color-mix()`, so parsing a computed colour string as RGB returns
nonsense. Paint the computed value into a 1×1 canvas twice — once over white,
once over black — recover alpha as `a = 1 − Σ|Cw−Cb| / 765` and the opaque
colour as `Cb / a`, then composite that onto whatever is actually behind it
before applying the WCAG formula. Type: read `getComputedStyle().fontSize` on a
probe element carrying the class, at each width.

---

## 1. Typography

### 1.1 The scale

18 tokens, all `--text-consumer-*`, all defined in `consumer-tokens.css`. Sizes
below are **measured** from `getComputedStyle` on a probe element at each
viewport width, against a fresh build.

| Token | 375 | 768 | 1200 | 1440 | Weight | Line-height | Tracking | Uses | Where |
|---|---|---|---|---|---|---|---|---|---|
| `display` | 28 | 33.72 | 40 | 40 | 500 | `normal` | 0 | 8 | Every page `<h1>`; the welcome and completion heroes |
| `question` | 24 | 31.62 | 40 | 40 | 500 | 1.4 | 0 | 2 | The sleep-diary question, one per screen |
| `section` | 24 | 27.81 | 32 | 32 | 500 | **−0.374px** | 0 | 3 | Need Help FAQ section titles |
| `card-title` | 22 | 24.86 | 28 | 28 | 500 | `normal` | 0 | 21 | Card headlines app-wide — the widest-used large step |
| `progress` | 20 | 23.81 | 28 | 28 | 600 | 1.3 | 0 | 2 | The diary's "n / 9" counter |
| `answer-name` | 20 | 23.81 | 28 | 28 | 500 | 1.4 | 0 | 2 | The diary's per-person row label ("Helen:") |
| `transcript` | 20 | 21.91 | 24 | 24 | 400 | 1.5 | 0 | 2 | The episode transcript — longest reading surface |
| `heading` | 20 | 20.95 | 22 | 22 | 500 | 1.3 | 0 | 12 | Page section `<h2>`s ("Your tasks for today") |
| `card-title-sm` | 20 | 20.95 | 22 | 22 | 500 | `normal` | 0 | 5 | Previous-module titles; drawer rows; coach-modal name |
| `unit` | 18 | 19.91 | 22 | 22 | 500 | `normal` | 0 | 2 | The unit beside a diary numeric answer ("min") |
| `lead` | 18 | 18.95 | 20 | 20 | 500 | 1.3 | 0 | 7 | Hero sub-lines; card intro lines |
| `lesson` | 18 | 18.95 | 20 | 20 | 500 | 1.3 | 0 | 14 | "Module 4" identifiers; modal section `<h2>`s; account-menu rows |
| `crisis` | 18 | 18.95 | 20 | 20 | 600 | 1.3 | 0 | 2 | Need Help crisis numbers ("Call 000") |
| `faq` | 18 | 18 | 18 | 18 | 500 | 1.4 | 0 | 2 | An FAQ row's question — **flat** |
| `chip` | 16 | 16.95 | 18 | 18 | 600 | 1.4 | 0 | 4 | "Module complete" chip labels |
| `eyebrow` | 16 | 16.95 | 18 | 18 | 400 | 1.4 | 0 | 41 | Card eyebrows and body copy — the most-used step |
| `body-strong` | 16 | 16 | 16 | 16 | 600 | 1.4 | 0 | 20 | Emphasis lines, field labels, session badges — **flat** |
| `body` | 16 | 16 | 16 | 16 | 400 | 1.4 | 0 | 6 | Flat body copy (footer, FAQ sub copy) — **flat** |

`line-height: normal` is Inter's own metric (≈1.21). It is a real value here,
not an omission — five steps use it deliberately so headline blocks sit tight.

Distinct rendered sizes: **6** at 375, **12** at 768, **8** at 1200 and 1440.
The 768 figure is high because that is the middle of the interpolation band and
nothing is drawn there; see §1.3.

### 1.2 The scale contract — an enforceable rule, not a convention

Five rules. All five are checked by `docs/type-scale-check.mjs`, which **exits
non-zero** on a breach and prints the offending token.

```
node docs/type-scale-check.mjs            # defaults to app/src/consumer-tokens.css
node docs/type-scale-check.mjs <path>     # or point it somewhere else
```

1. **RANGE.** Every fluid token interpolates across the same viewport range,
   **375 → 1200px**. No exceptions. A token that finishes growing early crosses
   its neighbours somewhere in the middle, which is exactly where nobody looks.
   Two tokens used to do this — `chip` finished at 891 and `crisis` at 787 —
   and both were re-ranged.
2. **RANK.** For any two tokens, if one is larger at 375 it is never smaller at
   1200. Ties are fine; reversals never. A scale that reorders itself between
   breakpoints is not a scale.
3. **FLOOR.** Nothing renders below **16px** at any width. This portal's readers
   are people living with dementia and their carers; 16 is a floor, not a target.
4. **CEILING.** Nothing is heavier than **600**. Where a Figma frame draws 700
   (the Need Help crisis numbers) the ceiling wins and the divergence is recorded
   at the token.
5. **NO FLAT.** A flat token inside a fluid scale is what breaks rule 2. Three
   are allowed and each carries its reason in the checker's own `ALLOWED_FLAT`
   map: `body` ("the reading size *is* the floor"), `body-strong` (the same step
   at 600) and `faq` (one step above body at every width). Adding a fourth means
   editing that map with a reason — do not widen the rule silently.

Current state, from a live run:

```
Scale is coherent: one interpolation range, no rank reversals, nothing below the floor.
```

### 1.3 Why 375 and 1200, and why the middle has to be a rule

**The designs exist at exactly two widths and nowhere else** — an iPhone SE
artboard at 375 and a desktop artboard at 1281 (the portal's own breakpoint,
1200, is what the clamps are anchored to). There is no tablet frame for any
surface in this portal.

So every width between 375 and 1200 is *interpolation*, not design. Something
has to govern it, and the choice is between a rule and a guess. An earlier pass
guessed: it paired two classes per call site (`text-consumer-card-title
md:text-consumer-card-title-lg`), which had three failures worth knowing about
because they are the failures a reviewer will propose reintroducing:

- it had **two** steps, not three — `md:` and up were identical, so "tablet"
  never existed at all;
- a call site that forgot the second half silently kept the mobile size forever,
  and nothing catches that;
- it switched at `md` (768) while this portal's layout switches at 1200, so type
  and layout changed at different widths.

One `clamp()` per token fixes all three. There is no second half to forget, and
tablet is where the line between the two real anchors passes rather than a value
someone picked.

### 1.4 Adding a step

For a step that is `M`px at 375 and `X`px at 1200:

```
slope     = (X - M) / (1200 - 375) * 100        -> vw
intercept = M - (X - M) * 375 / 825             -> px, then / 16 -> rem
           clamp( M/16 rem , intercept + slope vw , X/16 rem )
```

Worked example, `--text-consumer-card-title` (22 → 28):

```
slope     = 6 / 825 * 100                    = 0.7273vw
intercept = 22 - 6 * 375 / 825 = 19.2727px   = 1.2045rem
--text-consumer-card-title: clamp(1.375rem, 1.2045rem + 0.7273vw, 1.75rem);
```

**The intercept is in `rem`, not `px`, and that is load-bearing.** A clamp whose
preferred value is pure `vw` ignores the reader's own browser font-size setting
and fails WCAG 1.4.4 (Resize Text). Keeping a `rem` term means browser zoom and
a larger default font still move the type. For this audience that is not a
theoretical concern.

Every step also needs its three companions, or the utility inherits them:

```css
--text-consumer-foo: clamp(…);
--text-consumer-foo--line-height: 1.4;
--text-consumer-foo--letter-spacing: 0;
--text-consumer-foo--font-weight: 500;
```

Then run `node docs/type-scale-check.mjs` **and** add the class name to the
registry in §1.5, in the same commit.

### 1.5 The `cn()` / `tailwind-merge` registry — the silent-drop rule

`app/src/lib/utils.ts` extends `tailwind-merge` with a `font-size` class group
listing every custom type utility:

```ts
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [
    "text-display-xl", … ,
    "text-consumer-lead", "text-consumer-heading", "text-consumer-card-title",
    … "text-consumer-crisis",
  ] } },
})
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

**A `--text-*` token missing from that array is silently dropped** at any `cn()`
call site that also passes a text colour: both classes start with `text-`, so
plain `tailwind-merge` buckets them as conflicting and keeps only the last. The
element then falls back to inherited type, the class sits correctly in the DOM,
and nothing errors anywhere. This has already cost this project one whole step
(a 16/600 value rendering at 14/400) and it was found by reading
`getComputedStyle`, not by looking.

All 18 consumer steps are currently registered — verified against the source.
When you add a step, add it here too, in the same commit.

### 1.6 Typeface

Everything renders in **Inter Variable**, self-hosted via
`@fontsource-variable/inter` and imported at `index.css:16`. Measured on a live
page: the set of distinct `font-family` first-choices across every element in
the DOM is exactly `["Inter Variable"]`.

`--font-consumer-wordmark` (Atkinson Hyperlegible Next) is declared at
`consumer-tokens.css:76` and the package is imported at `:58`, but **no element
uses it** — `document.fonts.check('16px "Atkinson Hyperlegible Next Variable"')`
returns `false`, because nothing requests it. The header wordmark it was meant
for is a committed SVG.

This is deliberately kept rather than deleted. The token carries an open product
question: Atkinson is a legibility-first typeface drawn for the Braille
Institute, with commonly-confused letterforms kept distinct, which is a
defensible body face for *this* audience specifically. Deciding that is a
product call, not cruft removal. If the answer is yes, it is a rename to
`--font-consumer-sans` plus a `font-consumer-*` swap at the shell — not a
rebuild. Do not widen it on a guess.

---

## 2. Colour

### 2.1 Three things that are counter-intuitive, stated up front

**(a) The `purple-50…500` ramp *is* the consumer brand. `bg-purple-*` call
sites are correct and must not be "fixed".**

The portal's own brand token is `--color-consumer-primary: #3a00ad`. The ramp
steps it sits on share its hue and saturation exactly:

| Token | Hex | H | S | L |
|---|---|---|---|---|
| `consumer-primary` | `#3a00ad` | 260° | 100% | 34% |
| `purple-50` | `#f3efff` | 260° | 100% | 97% |
| `purple-200` | `#e4d6ff` | 260° | 100% | 92% |
| `purple-300` | `#c2a3ff` | 260° | 100% | 82% |
| `purple-400` | `#a070ff` | 260° | 100% | 72% |
| `purple-500` | `#8447ff` | 260° | 100% | 64% |
| **`--primary` (coach/researcher)** | `#4a278f` | **262°** | **57%** | **36%** |

The coach `--primary` is the outlier, not the ramp. A reviewer scanning for
"app tokens leaking into the consumer portal" will flag the 45 `bg-purple-*`
sites; they are the brand at its light end and there is no consumer-scoped
equivalent to move them to.

**(b) The coach purple is not painted anywhere in this package.** Measured two
ways: `#4a278f` and `#200061` appear in a fresh build *only* as the
`--color-purple-700` / `--color-purple-900` declarations inside the theme block,
never inside a utility rule; and a strict grep over `src/` finds exactly one
`-primary` reference, in a code comment. The one place it used to paint — the
confirm button of a consumer `ConfirmDialog` — was fixed, and rasterising that
button live now returns `#3a00ad` against a `#3a00ad` Cancel border. Two purples
9px apart in one dialog footer is gone.

**(c) Every hex has exactly one definition, and `pearl` no longer exists.**
11 duplicated hexes were collapsed to 0. `pearl` was `parchment`'s hex under a
second name and its 13 call sites moved to `parchment`; a strict grep now
returns **0** `pearl` utility uses. Note that the *running* dev server still
serves a `.bg-pearl` rule — that is the stale build described in §0, not a
surviving token. A fresh compile contains `bg-pearl` zero times.

### 2.2 Tokens this portal defines

Painted values rasterised through a 1×1 canvas from a live page. Call-site
counts are strict greps over `src/**/*.tsx|ts` for any Tailwind colour prefix
(`bg-`, `text-`, `border-`, `ring-`, `stroke-`, `fill-`, `outline-`, …).

| Token | Authored | Painted | Sites | Job |
|---|---|---|---|---|
| `--color-consumer-primary` | `#3a00ad` | `#3a00ad` | **169** | The brand. Fills, text, borders, every focus ring. |
| `--color-consumer-canvas` | `#fffdfa` | `#fffdfa` | 6 | Page canvas — the **centre** stop of the radial, see §2.5 |
| `--color-consumer-canvas-edge` | `#fff9f0` | `#fff9f0` | 0 direct | The radial's **outer** stop; painted at every canvas corner |
| `--color-consumer-menu` | `#fffcf6` | `#fffcf6` | 1 | The full-screen drawer's ground. A third warm off-white, and deliberately none of the others |
| `--color-consumer-lesson-complete` | `#bcfbab` | `#bcfbab` | 3 | The only green in the portal. "Module complete" chips |
| `--color-consumer-footer` | `var(--color-ink-muted)` | `#333333` | 1 bg | The dark footer band. Same hex as `ink-muted`, named separately because that is a *text* token and this is a surface |
| `--color-consumer-footer-ink` | `#f1f1f1` | `#f1f1f1` | 2 | Footer copy, plus its rule at 50% |
| `--color-consumer-accent` | `#f55b42` | — | **0** | Orphan. White on it measures **3.25:1** and fails AA at 16/600, which is why the header Log out moved to `destructive` |
| `--color-consumer-panel` | `#ece9f7` | — | **0** | Orphan, self-documented — the frame that used it was revised |
| `--color-consumer-wave-light` | `#d0bdf6` | — | **0** | Record-only: the value lives inside `wave.svg` |
| `--color-consumer-wave-deep` | `#2a0379` | — | **0** | Record-only, same |

Four of those orphans are deliberate and documented at the token. Leave them.

### 2.3 App-wide tokens this portal paints

| Token | Painted | Sites | Job |
|---|---|---|---|
| `--color-ink` | `#1a1a1a` | 127 | Body ink |
| `--color-ink-muted` | `#333333` | 30 | Secondary copy |
| `--color-ink-faint` | `#6d6d6d` | 8 | Placeholders, the disabled-tile tint, a few rules |
| white | `#ffffff` | 110 | Cards, header, inverted text |
| `--color-parchment` | `#f5f5f7` | 31 | Card strokes, input fills, the modal footer band |
| `--color-hairline` | `#e0e0e0` | 19 | Rules and 1px card borders |
| `--color-purple-50` | `#f3efff` | 29 | Ghost-hover fill; diary canvas; transcript sheet |
| `--color-purple-200` | `#e4d6ff` | 6 | Diary card, chapter carousel, reflection body |
| `--color-purple-300` | `#c2a3ff` | 3 | Pillow stroke; mobile progress track |
| `--color-purple-400` | `#a070ff` | 1 | Welcome rail nodes |
| `--color-yellow-100` | `#fff0cc` | 3 | "Follow along" card; session badges |
| `--color-yellow-200` | `#ffe299` | 6 | Nav active pill; coach-card band; feedback banner |
| `--color-yellow-300` | `#ffcc4d` | 4 | Rescheduled badge; next-session emphasis |
| `--color-yellow-400` | `#ffb600` | 2 | Transcript highlighter; resource backdrop blob |
| `--destructive` | `#d70015` | 23 | Log out, opt-out, "get help" link, rescheduled strike |
| `--background` | `#fffcfa` | 1 | The shell root under every page |
| `--card` | `#ffffff` | 29 | Card fills |
| `--color-card-header` | `#e4d6ff` | 2 | Inherited alias for `purple-200` |

**Raw black appears 5 times and every one is an alpha scrim or shadow**, which
is the correct idiom for that job: `bg-black/25` on three modal backdrops,
`bg-black/50` on the video scrim, `border-black/10` on the opted-out banner.
Plus two `#000` stops inside mask gradients. There is no `text-black` left.

### 2.4 Contrast, measured

Opaque pairs, computed on the painted hexes:

| Pair | Ratio |
|---|---|
| white on `consumer-primary` | **11.78:1** |
| `consumer-primary` on canvas `#fffdfa` | 11.60:1 |
| `consumer-primary` on white | 11.78:1 |
| `consumer-primary` on `purple-50` | 10.43:1 |
| `consumer-primary` on `purple-200` | 8.61:1 |
| `consumer-primary` on `lesson-complete` `#bcfbab` | 9.83:1 |
| `consumer-primary` on `yellow-200` | 9.30:1 |
| `consumer-primary` on `yellow-300` | 7.85:1 |
| `ink` on canvas | 17.14:1 |
| `ink` on `yellow-200` | 13.75:1 |
| `ink` on `yellow-400` (highlighter) | 9.90:1 |
| `ink-muted` on canvas | 12.44:1 |
| `ink-faint` on white | 5.17:1 |
| `ink-faint` on canvas | 5.10:1 |
| `ink-faint` on `parchment` | **4.75:1** — the tightest normal-text pass in the portal |
| `destructive` on white | 5.38:1 |
| white on `destructive` | 5.38:1 |
| `footer-ink` on `consumer-footer` | 11.19:1 |

Translucent fills, rasterised and composited (Tailwind emits these as
`color-mix(in oklab, …)`, so sRGB arithmetic on the authored hex is wrong):

| Fill | Over | Painted | Note |
|---|---|---|---|
| `bg-destructive/10` | canvas | `#fbe3e3` | `ink` on it 14.25:1 |
| `bg-consumer-primary/65` | white | `#7f59ca` | white on it **5.02:1** — the blocked-forward pill, passes |
| `bg-consumer-primary/40` | white | `#b099de` | white on it **2.48:1** — disabled confirm, exempt |
| `bg-parchment/50` | white | `#fafafb` | card footer |
| `bg-consumer-footer-ink/50` | `#333333` | `#929292` | the footer rule |
| `bg-white/20` | `consumer-primary` | `#6133bd` | video play button; white label 7.73:1 |
| `text-ink/55` | `parchment` | `#7c7c7d` | **3.83:1** — see below |

Two values that need stating plainly rather than filed as passes:

- **`text-ink/55` on `parchment` is 3.83:1 and does not clear AA.** It is the
  accessibility menu's disabled-tile label. It ships because the control carries
  `aria-disabled` and WCAG 1.4.3 exempts inactive controls — so the honest word
  is *exempt*, not *passes*. (A comment in that file once claimed 4.61:1 and
  "clears AA"; both halves were wrong and re-measuring is what caught it. The
  source now records 3.78:1; this measurement gives 3.83:1 — same conclusion,
  and the difference is alpha-recovery rounding.) **If this tint is ever reused
  on an enabled control it must darken first.**
- The five session-feedback mood outlines are graphical indicators and need 3:1
  against their own fill. Measured: very good 5.03, good 3.86, **okay 3.96**,
  not great 4.19, very bad 8.08. "Okay" is the one that was retuned rather than
  transcribed — the frame's `#b29914` measures **2.63:1** on its own `#fdf8db`
  fill, so on the single card a reader had just chosen, the thing telling them
  they had chosen it was the hardest to see. `#8f7a10` is the same hue at 3.96.
  The four committed `okay-*.svg` files keep `#B39914` for their line work and
  are deliberately untouched.

### 2.5 The canvas is a gradient, not a colour

```css
@utility bg-consumer-canvas {
  background-color: var(--color-consumer-canvas-edge);
  background-image: radial-gradient(
    85.4% 95.2% at 50% 35.1%,
    var(--color-consumer-canvas) 10.13%,
    var(--color-consumer-canvas-edge) 100%
  );
}
```
`consumer-tokens.css:555`. Warm off-white at the centre easing to a warmer cream
at the edges. Written as a `@utility` rather than a `@theme` colour because
Tailwind's `--color-*` namespace holds colours, not gradients, and a call site
wants one class. The `background-color` is the flat fallback and is the *edge*
stop, so a failure degrades to the darker of the two rather than flashing white.

Note there are two page-canvas values in play: pages paint
`bg-consumer-canvas`, while the shell root under them is `--background`
`#fffcfa`. They differ by 1–2 per channel and are never adjacent.

---

## 3. The text-size control and the `zoom` model

### 3.1 What it is

`AccessibilityMenu.tsx` — a 44px `PersonStanding` trigger in the header opening
a 320px popover with exactly three tiles: **Increase Text**, **Decrease Text**,
**Reset Text**. Each tile is 100px tall, `rounded-[12px]`, `bg-parchment`.
A live `aria-live="polite"` percentage sits in the section heading row.

The ladder is in `app/src/data/consumerTextScale.ts`:

```ts
const STEPS = [1, 1.125, 1.25, 1.375, 1.5] as const
const DEFAULT_INDEX = 0
```

Five rungs — **100% / 113% / 125% / 138% / 150%** — one step of 12.5%.

State is a module-scoped `let index` plus a `Set` of listeners, read through
`useSyncExternalStore`. It is **not** React state and **not** persisted: a fresh
load is always 100%. That is a real product gap worth naming rather than a
subtlety — a reader who needs 150% needs it every visit.

**The ladder has no rung below 1.0, and must not gain one.** Its lowest rung was
once 0.875, which multiplied this portal's 16px floor down to 14px on every body
element — a setting that made text *less* readable, offered to an audience
defined by not being able to read it.

### 3.2 Why `zoom` and not root font-size

```tsx
// ConsumerShell.tsx — the skipWelcome branch
<motion.main id="main-content" tabIndex={-1}
  className="min-w-0 flex-1 outline-none"
  style={{ zoom: scale }}
>
```

This portal sizes plenty of things in literal px — the diary's 22px field text,
the module bar, arbitrary heights. Scaling a root `font-size` only moves
`rem`-based steps, so a reader who pressed "Increase Text" would watch half the
page grow and half of it stay put, which reads as broken rather than as an
accessibility feature. `zoom` scales everything the box contains, so the result
is honest.

**The trade, stated plainly:** `zoom` scales layout as well as text, so this is
closer to a page magnifier than to a pure text resize, and it is *not* what WCAG
1.4.4 means by resizing text. Browser zoom and a larger default font size remain
the compliant path; this control is an in-product convenience on top.

**Two measured consequences an engineer will hit:**

1. **`getComputedStyle(el).fontSize` does not change.** Measured at 150%: the
   page `<h1>` still reports `28px`. You cannot detect the setting by reading
   type; read `useTextScale()`.
2. **Rects stay in viewport pixels.** At 375 × zoom 1.5 the `<h1>` rect went
   327 → 303px, because the *layout* viewport shrank to 250 CSS px and the
   result is scaled back up. `document.documentElement.scrollWidth` stayed 375
   at every rung, and `layoutAudit()` returned empty at 150%.

### 3.3 Why it is scoped to `<main>`

Because the control lives in the header. A button that grows under the finger
pressing it is its own usability problem, and the menu would walk away from the
pointer mid-interaction. Measured: at 150%, `getComputedStyle(header).zoom` is
`1` and the header stays 133px while `main` is at `1.5`.

### 3.4 Why the drawer applies it separately — and the rule that follows

```tsx
// ConsumerMenuDrawer.tsx:~249
<motion.div role="dialog" aria-modal="true" aria-label="Menu"
  style={{ zoom: scale }}
  className="bg-consumer-menu fixed inset-0 z-50 flex flex-col overflow-y-auto outline-none"
>
```

The drawer is mounted in `App.tsx` **above** `<Routes>`, so that it outlives a
navigation and can close while the next page mounts underneath it. That places
it outside `<main>`, so it inherited no zoom at all. Below 1200px that drawer
**is** the navigation — a reader who scaled the page up in order to read it was
then handed unscaled navigation to get anywhere.

Measured after the fix: drawer `zoom` `1.5`, rows 108px (72 × 1.5), no
horizontal scroll, audit clean.

> **The rule:** any surface mounted outside `<main>` needs this same line. That
> currently means the drawer. It would also mean any future portal, toast or
> global sheet.

Two surfaces are knowingly *not* zoomed and neither is a bug: the welcome flow
(`!skipWelcome` branch renders a plain `<main>` with no zoom — the reader has
not reached the header control yet) and `ConsumerOnboardingTour` (a sibling of
`motion.main` inside the shell). Both are first-run-only.

---

## 4. Spacing, radii, shadows, breakpoints

### 4.1 Spacing

No custom spacing scale — Tailwind's 4px base throughout. The values that repeat
enough to be conventions:

| Constant | Value | Where |
|---|---|---|
| `CONSUMER_PAGE_GUTTER` | `px-6 min-[1200px]:px-20` (24 → 80) | `ConsumerShell.tsx`; the header and footer read it so the three agree |
| `SHELL` | `mx-auto w-full max-w-[1320px] px-6 min-[1200px]:px-20` | `ConsumerFlowFooter.tsx`; the module flow's row |
| `CONSUMER_HERO_TO_CONTENT` | `gap-12 lg:gap-[72px]` (48 → 72) | Hero block to content, all three wave pages |
| `CARD_PAD` | `px-4 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-10` | `ConsumerCard.tsx` |
| Section stack | `gap-14` (56px) | Between page sections inside `ConsumerContentReveal` |
| Content column cap | `max-w-[1320px]` shell, `max-w-[1121px]` page content, `max-w-[1057px]` hero | Three different caps, deliberately — see `design-handoff.md` §2 |

The content cap's history is worth knowing so it is not re-litigated: 1100 →
1600 → 1536 → **1320**, each step after live feedback that the previous one was
still too wide on a genuinely large screen.

### 4.2 Radii

`index.css:429`. Consumer surfaces mostly bypass these with arbitrary values,
so both columns matter:

| Token | Value | Consumer use |
|---|---|---|
| `--radius-xs` | 4px | — |
| `--radius-sm` | 8px | Ghost hit areas, drawer rows, inputs, small panels |
| `--radius-md` | 11px | — |
| `--radius-lg` / `--radius-xl` | 16px | Cards (`rounded-lg`), modal panels |
| `--radius-2xl` | 24px | Flip cards, chapter carousel |
| `--radius-3xl` | 28px | Account trigger, ScrollCue, drawer Log out |
| `--radius-4xl` | 32px | Completion chips |

The pill radius on buttons is written as the arbitrary `rounded-[28px]` in the
module flow and as `rounded-3xl` on page CTAs. **Both compute to 28px** — they
are the same shape spelled two ways, not two conventions. The nav pill is
`rounded-[40px]`.

The nesting convention: a rounded element inside a card gets **half** its
parent's radius. 16px cards pair with `rounded-sm` (8px), and one level deeper
with `--radius-xs` (4px).

### 4.3 Shadows

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `2px 4px 16px 0 rgba(230,194,127,0.2)` | Every card. Warm gold, offset down-and-right |
| `--shadow-float` | `3px 5px 30px rgba(0,0,0,0.22)` | `ScrollCue` only — the one thing that genuinely hovers above the page |
| `--shadow-notice-card` | `4px 4px 12px 0 rgba(0,0,0,0.06)` | Inherited; unused here |

`shadow-card` is warm on purpose. The page surface is a warm off-white and the
hero cards are yellow; a neutral grey shadow on those reads as dirt.

Two consumer surfaces carry one-off shadows rather than the token, both because
they sit on purple rather than on the warm canvas: the next-session cell
(`shadow-[2px_5px_10px_rgba(85,85,85,0.25)]`) and the carousel chevrons and
active chapter thumb (`shadow-[2px_8px_16px_0px_rgba(85,85,85,0.4)]`). The
sticky module bar and flow footer use `filter: drop-shadow(2px 4px 8px
rgba(230,194,127,0.2))` — a filter rather than a box-shadow, because they are
translated bands and a filter follows the shape.

**One note on transcribing a shadow from Figma: Figma's `radius` maps 1:1 to
CSS `box-shadow` blur, but to *half* that as a `filter: drop-shadow()` standard
deviation.** The session-feedback pillow glow halves its Figma 36 to 18 for
exactly this reason.

### 4.4 Breakpoints

This portal's own switch is **1200px**, written as `min-[1200px]:` — 65 uses,
more than any other. It is where the header moves its nav from a row beneath the
bar into the bar itself, and where the "Tap" / "Click" verb swaps.

Full inventory from the source:

| Width | Spelling | Uses | What switches |
|---|---|---|---|
| 1281 | `min-[1281px]:` | 13 | Home's `744px 1fr` grid; 256px CTAs; session-plan cells; coach-card Read More |
| **1200** | `min-[1200px]:` | **65** | The portal breakpoint: nav position, gutters, verbs, flow-footer shell |
| 1100 | `min-[1100px]:` | 8 | The session-feedback banner's row direction only |
| 1024 | `lg:` / `min-[1024px]:` | 95 / 11 | Module card layouts; Home's task grid; summary-card columns |
| 900 | `min-[900px]:` | 9 | Resource card; feedback modal padding |
| 768 | `md:` / `min-[768px]:` | 22 / 20 | Shell default gutters; reflection footer; tooltip anchoring |
| 640 | `sm:` / `min-[640px]:` | 149 / 19 | The wave-asset swap; card padding; mascot scale |

**640 and 1200 are the two that carry structural meaning.** 640 is where every
wave asset swaps from its phone export to its desktop one *and* where the mascot
changes scale — those three must move together or the hero comes apart; see
`wave-and-blob-shapes.md`. 1200 is the header.

Two conventions to keep:

- **Never mix a named breakpoint variant with an arbitrary-property one on the
  same custom property.** `[--x:1.6] sm:[--x:1.25] min-[1200px]:[--x:1]`
  resolved to **1.25 at 1680px** — Tailwind v4 emits arbitrary-property
  utilities in a different order from named-breakpoint ones, specificity ties,
  and source order decides it the wrong way round. Write them all as
  `min-[Npx]:`. Full account in `wave-and-blob-shapes.md`.
- **Write every breakpoint as a literal class.** Tailwind scans source text, so
  a composed `` `${VAR}:block` `` generates no CSS at all and fails silently.

---

## 5. Quick reference — what to touch when

| You want to | Edit | Then |
|---|---|---|
| Add or change a type step | `consumer-tokens.css` (4 lines) | add the class to `lib/utils.ts`; run `node docs/type-scale-check.mjs` |
| Add a colour | `consumer-tokens.css` `@theme inline` | rasterise it against every surface it lands on before quoting a contrast number |
| Change the page canvas | the `@utility bg-consumer-canvas` block | remember `--background` is a second, near-identical value on the shell root |
| Change the header height | `--consumer-header-h` | four surfaces measure against it; the live value is republished as `--consumer-chrome-h` by `ConsumerHeader`'s `ResizeObserver` |
| Add a text-size rung | `data/consumerTextScale.ts` `STEPS` | never below 1.0 |
| Mount a new surface outside `<main>` | that component | give it `style={{ zoom: scale }}` from `useTextScale()` |
