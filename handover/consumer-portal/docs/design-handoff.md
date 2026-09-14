# Design handoff — Care2Sleep Consumer Portal

A measured visual spec, surface by surface, read from the running app at
**375 × 812**, **768 × 1024**, **1200 × 900** and **1440 × 900**.

**Companion documents.** Token values, the type-scale contract and the
text-size/`zoom` model are in `design-tokens.md`. Every wavy or organic shape —
its asset, its sizing maths and the traps around it — is in
`wave-and-blob-shapes.md`. Neither is repeated here.

---

## 0. Method, and one caveat you must read first

Every number below was read back from `getComputedStyle` or
`getBoundingClientRect` on a painted element. Colours were rasterised through a
1×1 canvas, never parsed from a computed string (Tailwind v4 emits `oklab()`).
Nothing is inferred from a Figma frame.

**The caveat:** the CSS build in this package currently fails on
`@apply border-border` (`app/src/index.css:723`), so a dev server that was
already running is serving its last successful, *pre-fix* stylesheet. Full
account and the one-line fix are in `design-tokens.md` §0. Type measurements here
were taken against a fresh compile of the current source; layout measurements
were taken live, where the two builds do not differ.

**Where a surface has no design at a given width, it is called out as derived.**
Only two widths have frames anywhere in this portal — an iPhone SE artboard at
375 and a desktop artboard at 1281. **There is no tablet frame for any surface.**
Everything at 768 is interpolation.

---

## 1. Global chassis

### 1.1 Routes

`App.tsx`. Hash routing. No sign-in, no portal switcher, no role switch.

| Path | Component |
|---|---|
| `/` · `/consumer` · `*` | `<Navigate to="/consumer/dyad-011" replace />` |
| `/consumer/:dyadId` | `ConsumerHomePage` |
| `/consumer/:dyadId/learning` | `ConsumerLessonsPage` — labelled **My Modules**; the route keeps `/learning` |
| `/consumer/:dyadId/module/:moduleId` | `ConsumerModulePage` |
| `/consumer/:dyadId/diary` | `ConsumerDiaryPage` |
| `/consumer/:dyadId/help` | `ConsumerHelpPage` |
| `/consumer/:dyadId/account` | `ConsumerAccountPage` |

There is **no 404 design**; the wildcard redirects to the seeded dyad.

Two structural facts that are load-bearing:

- `<Routes location={location} key={location.pathname}>` inside
  `<AnimatePresence mode="wait">`. Keying on the *pathname* (not `location.key`)
  means a re-render at the same URL does not replay the page entrance.
- **`<ConsumerMenuDrawer />` is mounted once, above `<Routes>`.** Every page
  mounts its own `ConsumerShell`, so a drawer rendered inside the header
  unmounted the instant a row was tapped and its exit animation never played.
  Sitting above the router it can navigate and close in the same frame. Its open
  state is a module-scoped store, not React state, for the same reason — and it
  is why it needs its own `zoom` (see `design-tokens.md` §3.4).

### 1.2 `ConsumerShell`

```
<div className="min-h-screen bg-background">        // #fffcfa
  <ConsumerHeader showNav={skipWelcome && showNav} … />
  <div className="flex">
    <motion.main id="main-content" tabIndex={-1}
      className="min-w-0 flex-1 outline-none" style={{ zoom: scale }}>
      [optedOut banner]  <div className="sticky top-[var(--consumer-chrome-h)] z-20">…
      [hero slot]        <div className="bg-parchment px-6 pt-16 pb-8 md:px-16 md:pt-20 md:pb-10">…
      [content]          <div className={contentClassName ?? …}>…
      {showFooter && <ConsumerFooter />}
    </motion.main>
    {showScrollCue && !tourOpen && <ScrollCue />}
    <ConsumerOnboardingTour … />
  </div>
</div>
```

Every consumer page overrides `contentClassName`, so the shell's own default
padding (`px-6 pb-16 md:px-16`) is effectively dead on this portal. What each
page passes:

| Page | `contentClassName` |
|---|---|
| Home | `bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-20 md:px-20` |
| My Modules | `bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-24 md:px-20` |
| Need Help | `bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-24 md:px-20` |
| My profile | `bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-24 md:px-20` |
| Sleep diary | `relative overflow-clip bg-purple-50 p-0` |
| Module | `bg-consumer-canvas relative overflow-x-clip p-0` (+ `contentFullBleed`) |

Measured padding, all four widths: `32px 24px 80px` at 375 and `32px 80px 80px`
from 768 up (Home; the others differ only in the 96px bottom). The `md:px-20`
step is at **768**, which does not match the header's own 1200 — see §7.

Page-entrance motion: `initial {opacity:0, y:8} → {opacity:1, y:0}`,
`0.3s easeOut`, behind a module-scoped `pageIntroPlayed` latch so it plays once
per load rather than on every navigation.

**Three different content caps are in play and they are not interchangeable:**

| Cap | Used by |
|---|---|
| `max-w-[1320px]` | the shell's own wrapper; the module flow's `SHELL`; the opted-out banner |
| `max-w-[1121px]` | page content columns (My Modules, Need Help, My profile, diary questions, welcome inner) |
| `max-w-[1057px]` | `ConsumerPageHero` |

Home's content column has **no cap at all** — it is the one page whose sections
run the full padded width. Measured at 1440: Home's `<h2>`s are 1280px wide
against My Modules' 1121px.

### 1.3 `ConsumerHeader`

`sticky top-0 z-30 bg-white shadow-card`. Two parts: a fixed-height bar, and a
tab row that exists only below 1200.

**The bar** — `relative flex h-[var(--consumer-header-h)] items-center
justify-between px-6 min-[1200px]:grid min-[1200px]:grid-cols-[1fr_auto_1fr]
min-[1200px]:px-20`. `--consumer-header-h` is **72px**.

| Width | Header height | Layout |
|---|---|---|
| 375 | **133px** (72 bar + 61 tab row) | hamburger · centred logo · accessibility trigger |
| 768 | **133px** | same |
| 1200 | **72px** | logo · nav · accessibility + account + Log out |
| 1440 | **72px** | same |
| module player, any width | **72px** | `showNav={false}` |

Contents below 1200: a 44px hamburger (`aria-label="Menu"`, `aria-expanded`), a
logo absolutely centred (`absolute left-1/2 -translate-x-1/2`, `min-h-9` so the
hit area clears 36px after the logo was scaled to 0.65), and a 44px
accessibility trigger. From 1200 the grid is `1fr auto 1fr` with the logo in
track 1, the nav in track 2 and the right cluster `col-start-3 justify-self-end`.

> **An empty middle track is load-bearing.** `AnimatePresence` renders no wrapper
> of its own, so with the nav hidden the grid drops to two children and the
> account cluster falls into the middle `auto` track — floating mid-bar instead
> of at the right edge. `{!showNav && <div aria-hidden="true" className="hidden
> min-[1200px]:block" />}` is what prevents that.

**The right cluster (≥1200)** — `gap-4`:

- Accessibility trigger — `size-11`, `rounded-full border-2 border-ink bg-white`,
  `PersonStanding` at `size-6`. Hover `bg-purple-50`; open state
  `data-[popup-open]:bg-purple-50`.
- Account trigger — `h-11 rounded-3xl border-2 border-consumer-primary bg-white
  pr-4 pl-1.5 text-consumer-primary`, containing a 32px `rounded-full
  bg-consumer-primary` initials disc (`text-consumer-body-strong text-white`,
  `aria-hidden`), a `text-body-md` "My account" label, and a `size-4`
  `ChevronDown` that rotates 180° on `group-data-[popup-open]`.
- **Log out — a ghost pill, not the coral one.** `ml-2 h-11 rounded-3xl px-3
  text-body-md text-destructive underline underline-offset-4`, hover
  `bg-destructive/8`. It moved off `--color-consumer-accent` `#f55b42` because
  white on that coral measures **3.25:1** and fails AA at 16/600, where
  `destructive` on white is **5.38:1**. The `underline` is load-bearing: with no
  border and no fill, colour alone would be the only thing separating it from the
  label beside it, and colour alone is what WCAG 1.4.1 forbids as a sole carrier.

**The tab row (<1200)** — `border-t border-parchment px-3 py-2`, measured 61px.
Two tabs only: Home (`House`) and My Modules (`GraduationCap`). Each is `h-11
min-w-[112px] rounded-[40px] text-body-md`, `w-full` in the row variant. The
active pill is `motion.span layoutId={'consumer-nav-pill-' + variant}`,
`bg-yellow-200`, spring `stiffness 500 / damping 35`.

> **The `layoutId` carries `variant`.** `NavTabs` renders twice — once in the bar,
> once in the row — and both are mounted at once with CSS hiding one. Two live
> elements sharing a `layoutId` make framer animate between the hidden copy and
> the visible one.

**`--consumer-chrome-h` is written at runtime by a `ResizeObserver`** on the
`<header>` (`ConsumerHeader.tsx:514-529`), with `--consumer-header-h` as the CSS
fallback. This is the single most important thing to understand about the
chrome:

> `--consumer-header-h` is **the bar only (72px)**. The tab row lives inside the
> same `sticky top-0 z-30` header, so on a page that shows it the header is
> **133px**. Every sticky element offset by the bar alone slid its top 61px under
> an opaque white row and appeared half-cut.
>
> **A media query is not sufficient, and that was measured.** The row is
> `min-[1200px]:hidden`, so a breakpoint looks like enough — but `showNav` is a
> **per-page** choice and the module player turns it off, so at 375 its header is
> 72px and a viewport-based 133 pushed that page's own sticky bar 61px too low.
> The row is animated in and out besides, so its height is not constant even
> within one page. Measuring the real header is the only thing correct on every
> page and mid-animation.

Verified live: `--consumer-chrome-h` reads `133px` on Home at 375 and 768, and
`72px` on Home at 1200/1440 and on the module page at every width.

### 1.4 `ConsumerMenuDrawer` (below 1200 only)

A full-screen sheet: `fixed inset-0 z-50 flex flex-col overflow-y-auto`,
`bg-consumer-menu` `#fffcf6`, with its **own** `style={{ zoom: scale }}`.

- Enter `y: '-100%' → 0`, `0.68s`, `ease [0.32, 0, 0.35, 1]`; exit `0.4s`,
  `ease [0.4, 0, 0.2, 1]`. The two directions carry different easings on
  purpose — a literal `ease-in` was measured holding near the top edge for 160ms,
  then covering the remaining ~1000px in the last third and arriving at full
  speed.
- Close row `flex shrink-0 justify-end px-4 pt-4 pb-8 sm:pb-10`; the button is
  `size-11 rounded-full text-consumer-primary` with `X` at `size-7` and an
  `sr-only` "Close menu".
- Five rows, each `min-h-[72px] w-full rounded-sm px-4`, hover `bg-purple-50`:
  icon `size-8 text-consumer-primary` (`strokeWidth 1.75`), label
  `text-consumer-card-title-sm text-ink`, trailing `ChevronRight size-7`. Order:
  Home, My Modules, My profile, Need help, Switch portal. Per-row entrance
  `{opacity:0,y:8} → {opacity:1,y:0}`, `0.42s`, `delay 0.26 + i*0.09`.
- Log out block `mt-auto … px-4 pt-6 pb-10 sm:px-6`, an `<hr className="mb-6
  border-t border-hairline" />`, then a **filled** destructive pill: `h-12
  rounded-3xl border border-destructive bg-destructive text-white`,
  `sm:w-[280px] sm:self-center`. Deliberately not the header's ghost treatment,
  and deliberately not one of the five rows.

Scroll lock: `documentElement.style.overflow = 'hidden'` plus a
`paddingRight` equal to the removed scrollbar width. Measured open at 375 with
text size at 150%: drawer `zoom 1.5`, rows 108px, root `overflow: hidden`, no
horizontal scroll, `layoutAudit()` empty.

Focus: the close button is focused from a **callback ref**, not an effect —
under `AnimatePresence` the drawer mounts a commit later than the state change,
so an effect keyed on `open` runs before the button exists. On dismiss, focus
returns to `document.querySelector('button[aria-label="Menu"]')` via
`requestAnimationFrame` — **queried, not held in a ref**, because this component
outlives the header that owns the trigger.

### 1.5 `ConsumerFooter`

`role="contentinfo"`, `bg-consumer-footer` `#333333`, `pt-10 pb-12` inside
`CONSUMER_PAGE_GUTTER` (`px-6 min-[1200px]:px-20`). A 1px rule at
`bg-consumer-footer-ink/50` (painted `#929292`), then the Monash lockup
(`h-[30.924px] w-[107.39px]`) and the acknowledgement paragraph
(`text-consumer-body text-consumer-footer-ink lg:max-w-[650px]`), stacked below
`lg` and spread `lg:flex-row lg:justify-between` above it.

Measured heights: 318px at 375, 251px at 768, 188px at 1200 and 1440.

Two deliberate decisions:

- **No `mx-auto max-w-[1320px]`.** The header bar is full-bleed with a gutter; the
  footer used to be additionally capped and centred, so at 1600 its bar began at
  x=140 and the Monash lockup landed at 220 against the header logo's 80 — a
  140px step between two things that should share an edge.
- **The frame sets this copy at 12px/500; it renders at 16px/400**, because the
  portal's floor is 16 and its ceiling is 600. The acknowledgement is
  institutional copy — do not paraphrase, reflow or tighten it.

Rendered on Home, My Modules and Need Help only (`showFooter` is opt-in).

### 1.6 `ConsumerFlowFooter` and the module bar

The sticky chrome for the two linear flows (module, diary). Exports used
portal-wide:

```ts
const PILL = 'flex h-12 items-center justify-center gap-2 rounded-[28px] px-5 text-body-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2'
export const PILL_PRIMARY = `${PILL} bg-consumer-primary text-white`
export const PILL_OUTLINE = `${PILL} border border-consumer-primary bg-white text-consumer-primary`
export const GUTTER = 'px-6 min-[1200px]:px-20'
export const SHELL  = `mx-auto w-full max-w-[1320px] ${GUTTER}`
export const CHROME_TRANSITION = 'translate 220ms cubic-bezier(0.4, 0, 0.2, 1)'
```

Footer bar: `sticky bottom-0 z-20 border-t border-hairline bg-white py-4`, shown
`translate-y-0` / hidden `translate-y-full`, `filter: drop-shadow(2px 4px 8px
rgba(230,194,127,0.2))`. Measured 81px tall at 1440. Back is `PILL_OUTLINE +
shrink-0 gap-4 min-[768px]:w-38`; forward is `PILL_PRIMARY + w-full
justify-between` inside a `BlockedHint` wrapper capped at `max-w-96`.

> **The transitioned property is `translate`, not `transform`.** Tailwind v4
> emits `translate-y-*` as the standalone CSS `translate` property.
> `getComputedStyle(el).transform` reads `none` on an element that is visibly
> offset. A first pass transitioned `transform`: the class toggled, the band
> arrived in the right place, and it **teleported**. A screenshot cannot show
> that.

Blocked state is `aria-disabled` plus `bg-consumer-primary/65` — **never the
`disabled` attribute**, so the control keeps its tab stop and its tooltip. The
composited fill is `#7f59ca`, white on it **5.02:1** (at 55% it would be 3.73:1
and fail). The outline back button uses `opacity-60`, composited 4.86:1.

`BlockedHint` renders the reason as a hover/focus/tap tooltip: `absolute
bottom-full z-30 mb-2 w-max max-w-[260px] rounded-lg bg-ink px-3 py-2 text-body
text-white`. It uses `hidden` rather than an opacity fade, so nothing needs
`inert`. Below 768 it anchors to the button's **right** edge rather than centring
— measured at 375, a 260px tip centred on the footer's Finish button ran from 142
to 402 against a 375 viewport and was cut off.

### 1.7 `ConsumerPageHero` and `ConsumerContentReveal`

```tsx
<div className="flex w-full max-w-[1057px] flex-col items-start gap-4 sm:items-center sm:gap-12">
  <ConsumerMascotFigure … />
  <div className="flex w-full flex-col gap-2 text-left sm:text-center">
    <h1 className="text-consumer-display text-ink">{title}</h1>
    {sub !== undefined && <p className="text-consumer-lead text-ink-muted">{sub}</p>}
  </div>
</div>
```

Left-aligned on a phone (a centred column of two long lines reads as a poster),
centred from `sm` where the mascot sits over the wave's crest. `sub` is optional
and **not rendered at all** when absent (My profile) — an empty `<p>` still
occupies a line box and would leave the title 24px higher than the mascot expects.

The hero-to-content gap is one exported constant, `CONSUMER_HERO_TO_CONTENT =
'gap-12 lg:gap-[72px]'` — 48px on a phone, 72 from `lg`.

`ConsumerContentReveal` fades and rises everything **below** the wave and mascot
(`opacity 0→1`, `y 10→0`, `0.45s`, `ease [0.4,0,0.2,1]`), so a tab change moves
the content while the page's furniture holds still. It replays when the drawer
closes, driven by `useAnimationControls` rather than by remounting on a `key` —
keying it would throw away every child's state on every menu close, including a
half-typed diary answer.

---

## 2. `/` — the welcome flow

`ConsumerWelcome.tsx`. Four screens on a horizontal track, shown once per load,
on Home only. Header present (72px, no nav); **no `zoom`** on this `<main>`.

| # | Title | CTA |
|---|---|---|
| 0 | Welcome to Care2Sleep | **Get started** |
| 1 | 1. Make a session plan with your coach | Next |
| 2 | 2. Complete your modules each week | Next |
| 3 | 3. Fill in your sleep diary each day | **Go to dashboard** |

The step count in screen 0's hint is **derived from the array**, never written:
`NUMBER_WORDS[WELCOME_STEPS.length - 1]` → "in three short steps". A written
count has disagreed with what is on screen three separate times in this project.

**Layout** (`ConsumerWelcome.tsx:614-625`):

```
section  bg-consumer-canvas relative flex min-h-[calc(100vh-96px)] flex-col items-center
         overflow-clip px-6 pb-4 md:px-20 min-[1200px]:pb-10
         style={{ paddingTop: SECTION_PAD_TOP - ART_LIFT }}   // 80 - 60 = 20
inner    relative flex w-full max-w-[1121px] flex-1 flex-col items-center gap-6 pt-2 pb-2
         min-[1200px]:gap-[104px] min-[1200px]:pt-4 min-[1200px]:pb-16
```

Every vertical step is reduced below 1200 — the frame's 104px mascot-to-copy gap
is a desktop number, and on a phone it pushed the copy and CTA off a screen that
has none to spare.

| | 375 | 768 | 1200 | 1440 |
|---|---|---|---|---|
| section | 375 × 716 | 768 × 928 | — | 1440 × 912 |
| `min-height` | 716 | 928 | — | 804 |
| padding | `20px` top, `24px` side | `20px` / `80px` | | `20px` / `80px` |
| mascot box | 174.2 × 155.48 (scale 0.827) | 210.64 × 188 | | 212.38 × 189.55 |
| `<h1>` | 28px, 327 wide | 33.72px, 688.5 wide | | 40px, 688.5 wide |
| sub | `text-consumer-lesson` at 400 | | | 20px |
| primary CTA | 327 × 48 (full width) | 240 × 48 | | 240 × 48 |
| Go back | 327 × 48 | 160 × 48 | | 160 × 48 |

Button row is `flex-col-reverse` below `sm` — stacked with the **primary on
top** — and `sm:flex-row` above. Both pills are `rounded-[28px]` and use
`text-consumer-body-strong` (16/600), not the app's `text-body-md`; they are the
same 16/600 today, but an app token on a consumer surface is leakage.

"Go back" is **absent** on screen 1, not disabled.

**Track mechanics.** All four steps stay mounted so the connecting rail can span
them, which has two consequences: the three that are not current **must** carry
`inert` + `aria-hidden` (the fade hides them visually only), and focus on step
change can use a plain `useEffect` — the heading already exists, so there is
nothing to race. The rail (desktop only) is three segments of `purple-400` nodes
joined by a gradient bar, parallaxed at `RAIL_PARALLAX = 0.95`.

> **Higher `RAIL_PARALLAX` is calmer, which is the counter-intuitive part** — the
> gradient's apparent speed is `1 − RAIL_PARALLAX` of the travel. It is
> deliberately not 1.0: a full cancel pins the gradient in the viewport, and a
> stroke perfectly still while everything else moves reads as a rendering fault.

Track motion is a **tween** (`1.8s`, `ease [0.37, 0, 0.63, 1]`), not a spring.
That is the actual fix for "it's too fast" after three rounds of lengthening a
spring's duration failed — a spring front-loads its travel. If a spring is ever
wanted back for its physicality, lower the *stiffness* rather than raising the
duration.

Pagination is four dots, `h-2.5`, active `w-7 bg-consumer-primary` / inactive
`w-2.5 bg-hairline`, inside 36px `h-9 w-6` list items. They are **indicators, not
buttons** — a dot that jumps forward is a Skip by another name, which this flow
was told not to have. An `sr-only aria-live="polite"` "Step N of 4" carries the
same information. The dot strip is `sticky` only from 1200; below that it pinned
itself over the Go back button.

**The final CTA navigates explicitly to `/consumer/:id`.** Flipping the dismissal
flag alone merely *uncovers* whatever route the reader entered on — arriving at
`/help` and finishing the welcome left you on Help, having just been told
"welcome to your dashboard".

**Every non-Home page passes `showWelcome={false}`**, which both suppresses the
replay and marks the welcome passed for the session. Without it, landing on
`/diary`, `/learning`, `/help` or `/account` with fresh state renders the whole
flow over that route.

The waves are in `wave-and-blob-shapes.md` §1.

---

## 3. Home — `/consumer/:dyadId`

Order: page hero → **Your tasks for today** (feedback banner, then a 1–2 column
task grid) → a two-up row of **Your next session details** / **Meet your coach**
→ **Your coaching session plan** → the help affordance → footer.

Sections sit in `ConsumerContentReveal` with `gap-14` (56px). Section headings
are `text-consumer-heading text-ink` (20 → 22).

### 3.1 Grid behaviour — Home uses 1024 and 1281, not 1200

```
task grid   grid grid-cols-1 gap-6 sm:gap-10
            min-[1024px]:items-stretch min-[1024px]:grid-cols-2
            min-[1281px]:grid-cols-[744px_1fr]
two-up row  grid grid-cols-1 gap-6 sm:gap-10 min-[1024px]:grid-cols-2
```

1024 is where iPad Pro 12.9" portrait pairs the cards while iPad Air (820) and
iPad Pro 11" (834) still stack. 1281 is where the first column can take the
frame's own 744px.

Measured section widths: 327 (375) · 608 (768) · 1040 (1200) · 1280 (1440). The
two-up row's cells: 500 each at 1200, 620 each at 1440.

> `min-w-0` on grid cells is not optional. Items default to `min-width: auto`, so
> one wide child sizes the track instead of scrolling inside its own box — this
> project has shipped a real horizontal page scroll from exactly that omission
> three times.

**There is no fixed row height.** The original frame pinned this row at 420px;
keeping it pushed the diary card's four-line copy 19px past its own
`overflow-hidden` edge.

### 3.2 The two task cards

Both are `CARD_PAD` (`px-4 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-10`) and both put the
CTA at the bottom with **`mt-auto` on the button as a direct child of the card** —
a wrapper breaks it.

**Learning task card** — `bg-consumer-primary`, `border-parchment`:
cover image `h-[192px] w-full object-cover` with `objectPosition: 'center 29.7%'`,
then body `gap-6 sm:gap-10`. Eyebrow `text-consumer-eyebrow text-white`
(state-dependent: "This week's module" when complete, "Complete this week's
module" otherwise), an inline completion chip (`rounded-[32px]
bg-consumer-lesson-complete`, a 30px `bg-consumer-primary` disc with a white
`Check strokeWidth 3.5`, label `text-consumer-chip text-consumer-primary`), the
module label `text-consumer-lesson text-white`, the title
`text-consumer-card-title text-white`, and either a `text-body text-parchment`
duration line or a progress row. CTA: `LessonPlayCta` filled white with
`text-consumer-primary`, full width to 1280 then `min-[1281px]:w-64`.

> The cover's crop centre is derived, not chosen. The frame positions the photo
> absolutely at `h-[581.18%] top-[-122.78%]`, which reproduces its natural aspect
> at the frame's 744px width but ties the image's height to the *container's*, so
> it distorts the moment the card narrows. `29.7%` is where the frame's visible
> band actually sits: y 235.7 → 427.7 of a 1115.9px image, centre 331.7/1115.9.

**Diary task card** — `bg-purple-200`, `CardIcon` `NotebookPen`. Two states:
*todo* shows eyebrow / `text-consumer-card-title` question / body line and a
filled `bg-consumer-primary text-white` CTA; *done* shows a thank-you title and
sub, **and hides the CTA entirely**. `justify-between` was tried and rejected — a
fixed gap is the one arrangement that reads identically at every card height.

> This card reads `diarySubmittedOn`, **not** the health log. `healthLog()` seeds
> a `diary` entry on every date it generates and its last date is `TODAY`, so
> every dyad loads with today's entry already populated and the card showed "done"
> before anyone had filled anything in.

### 3.3 Next session card

`CARD_HAIRLINE` + white, `gap-8`. `CardIcon Video`; title
`text-consumer-card-title` with the count span in `text-consumer-primary`; an
`<hr className="border-t border-hairline" />`; a "Scheduled" eyebrow; then a
`<dl>` whose rows are `text-consumer-card-title` with `<dt className="text-ink">`
and `<dd className="text-consumer-primary">`. CTA full width to 1280, then
`min-[1281px]:w-64`.

Empty state is a single sentence in `text-consumer-eyebrow text-ink-muted`:
"Nothing booked yet. Your coach will schedule your next call with you."

Two things to know: the end time is **derived** (start + one hour), and the Join
button is a **demo switch** — it toggles the post-session feedback banner rather
than opening Zoom. Delete it the moment a real "session complete" signal exists.

### 3.4 Session feedback banner (conditional)

`bg-yellow-200`, `rounded-lg border border-parchment`, `px-4 pt-6 pb-8 sm:px-8
sm:pt-8 sm:pb-10`, stacking until **1100** then `flex-row` with a `gap-[104px]`
between the words and the buttons.

Its button column width is the most carefully derived number on Home, because the
buttons must mirror a module card's CTA at every width:

| Band | Class | Why |
|---|---|---|
| < 1024 | `w-full` | a card is the full row, and this card has the same width and padding, so its content box *is* the CTA width |
| 1024–1100 | `min-[1024px]:max-w-[calc(50%-52px)]` | a card is half the row: `(row − 40 gap)/2 − 64`, re-expressed against this column's own parent |
| ≥ 1100 | `min-[1100px]:max-w-[273px]` | the banner frame's own value |

A flat 384px measured 384 against a 364px card CTA at 1060; the calc lands within
~2px. The card's mobile padding moved `px-5 → px-4` in the same pass, because
with the cap gone the button width *is* the content width and the two cards'
padding has to agree.

Primary "Share my thoughts" is `h-12 rounded-[28px] bg-consumer-primary`;
secondary "Skip for now" is the same pill with `border-2 border-consumer-primary
bg-transparent`, hover `bg-white/60`.

### 3.5 Session plan strip

Owns its own `<h2>` — the whole block hides when no session has a date, and a
heading owned by the page would be left stranded over nothing. The empty test is
`!rows.some(r => r.date)`, **not** `!rows.length`: the store seeds every dyad with
seven undated rows.

A horizontal scroller (`role="region"`, `tabIndex={0}`, `aria-label`) of six
cells, `gap-4` / `min-[1281px]:gap-3`:

| | < 640 | 640–1280 | ≥ 1281 |
|---|---|---|---|
| cell width | `calc((100% - 32px)/1.2)` | `324px` | `flex-1`, min 152 (178 for next) |
| cell min-height | 228 / **248** next | 342 / **372** next | 228 / **248** next |

`(100% − 32px)/1.2` is "show 10% of the neighbour" solved rather than eyeballed —
measured at 375, cells land at 224.2px and the neighbour shows 22.4px, 10.0%.
The switch is at 1281 rather than 1200 because that is where six cells at their
content minimum plus five 16px gaps (1018px) actually fit inside the card.

Badge tones: completed `bg-consumer-lesson-complete text-consumer-primary`; next
`bg-yellow-100 text-consumer-primary`; rescheduled `bg-yellow-300 text-ink`;
scheduled `bg-parchment text-ink-muted`. The rescheduled date keeps a
`line-through` alongside `text-destructive` — colour alone as the carrier of
"this date no longer applies" is what WCAG 1.4.1 forbids.

> `py-4` on the scroller is load-bearing, not rhythm. `overflow-x: auto` clips the
> *vertical* axis too, and the next-session cell's `2px 5px 10px` shadow reaches
> 15px below the card; at `py-2` the bottom 7px was cut off.
>
> **No `sr-only` anywhere inside this row** — see `wave-and-blob-shapes.md` §12.8.

Chevrons are `size-12 rounded-full border border-consumer-primary bg-white`,
`disabled:opacity-40`. Pagination dots are 10px visually inside a **24 × 36**
control.

### 3.6 The help affordance

Desktop (≥1024): one sentence with only the trailing phrase as a link —
"Click here to get help", `text-destructive underline underline-offset-4`,
hover `no-underline`. Below 1024: the copy is the question only, and the action
is a full-width `h-12 rounded-[28px] border border-destructive bg-transparent
text-destructive` button reading "Get help". Red on both treatments, on
instruction.

> Measured: the desktop inline link is **22px tall** and is the only sub-36px
> interactive target on any consumer page apart from the `sr-only` skip link. It
> is an inline phrase inside running text, which is why `layoutAudit()` does not
> flag it and why the phone layout gives the same action a 48px button instead.
> Worth knowing before someone "fixes" it into a block.

---

## 4. My Modules — `/consumer/:dyadId/learning`

Hero (`withPencil`) → **Module of the week** → a `ConsumerWaveRule` → **Previous
weeks' modules** → footer. Content column `max-w-[1121px]`, sections `gap-14`,
section internals `gap-4 lg:gap-6`, previous-module rows `gap-6 lg:gap-16`
(64px on desktop — the frame draws 48, and the live instruction won).

**The wave rule appears twice and behaves differently.** Below `lg` it is a
full-width divider above the "Previous weeks' modules" heading; from `lg` it sits
*beside* the heading in a `flex items-center gap-6` row, inside a `hidden min-w-0
flex-1 lg:block` span. The `min-w-0` is required, or the 920px export sizes the
row and pushes the page into horizontal scroll. Measured at 1440 the inline rule
renders 830.05 × 6; at 375 the mobile file renders 327 × 6.

**Module cards invert between phone and desktop**, which is the thing to get
right:

| | < 1024 | ≥ 1024 |
|---|---|---|
| Featured card | one filled `bg-consumer-primary` card, `rounded-lg`, `shadow-card` | no card at all — `lg:bg-transparent lg:shadow-none lg:rounded-none`, a two-column row |
| Featured photo | full-width `aspect-[1920/1080]` | `lg:w-[61%]` with `lg:border-4 lg:border-consumer-primary lg:rounded-lg lg:shadow-card` |
| Featured title | `text-consumer-card-title text-white` | `lg:text-consumer-primary` |
| Featured CTA | `bg-white text-consumer-primary`, full width | `lg:bg-ink lg:text-white lg:w-auto lg:self-start` |
| Previous card | filled `bg-purple-200` | transparent row; photo `w-[326px] aspect-[399/306] border-[3px] border-hairline` |
| Previous title | `text-consumer-card-title-sm text-ink` | `lg:text-consumer-primary` |

The previous card's 326px is derived, not guessed: the frame's 399 × 306 at a
250px height gives `399 × (250/306) = 325.98`. Keeping `aspect-[399/306]` and
setting only the width is what makes that exact.

The two cards' **completion chips are colour-inverted** on purpose — featured:
`bg-consumer-lesson-complete` disc `bg-consumer-primary` check white label
`text-consumer-primary`; previous: `bg-consumer-primary` disc `bg-white` check
`text-consumer-primary` label white. From `lg` the featured card swaps to a
`bg-yellow-200` pill ("Module complete") instead.

**`LessonPlayCta` is 48px, not the 56 these cards' own frames draw** — a
deliberate divergence so every CTA in the portal matches, recorded so it is not
"corrected" back on the next transcription pass.

**The three unreleased modules are focusable `aria-disabled` buttons** carrying
an `sr-only` "(coming soon — this module is not available yet)". `aria-disabled`
rather than `disabled` is deliberate: a `disabled` button leaves the tab order,
so a screen-reader user never reaches it and never learns the module exists.

Empty state: `text-consumer-lead text-ink-muted` — "Your first module has not
been released yet. Your coach will let you know when it is ready."

Two inconsistencies worth knowing about before you match them to each other:

- The progress-bar gradient is declared in two files with two different angles —
  `LessonCards.tsx:412` is `91.766deg`, `LearningTaskCard.tsx:92` is `90.93deg` —
  while a comment asserts they are identical.
- `LearningTaskCard` steps its padding at **640**; `LessonCards` steps at
  **1024**. Same visual family, different breakpoint.

---

## 5. Module inner pages — `/consumer/:dyadId/module/:moduleId`

Four stages plus a completion screen: `welcome → video → summary → reflection →
done`. Progress is `(index+1)/4` → 25/50/75/100%. `done` deliberately carries no
progress and no chrome.

Shell: `showNav={false}` (so the header is **72px at every width**),
`showWelcome={false}`, `showScrollCue={false}`, `contentFullBleed`. The column is
`flex min-h-[calc(100vh-var(--consumer-header-h))] flex-col`.

Stage transitions are `AnimatePresence mode="wait"`, `{opacity:0,y:8} →
{opacity:1,y:0}` over `0.35s` `[0.4,0,0.2,1]`, exit `0.2s`, skipped entirely under
reduced motion, with a `window.scrollTo({top:0, behavior:'instant'})` on advance
and retreat.

> **The stage heading is focused from a callback ref, not an effect.** Under
> `mode="wait"` the incoming node mounts a commit *later* than the state change,
> so an effect keyed on `stage` focuses the outgoing heading or nothing, never
> runs again, and every transition lands on `<body>`.

### 5.1 Direction-aware chrome

`useScrollChrome` (`ConsumerModulePage.tsx:151-223`). The yellow module bar comes
in on scroll **up**; the footer comes in on scroll **down**.

```
DIRECTION_THRESHOLD = 8    // px of travel before direction flips
EDGE_EPSILON        = 4    // within this of an end counts as at that end

max <= 4         -> { bar: true,  footer: true  }   // page does not scroll
y   <= 4         -> { bar: true,  footer: false }
y   >= max - 4   -> { bar: false, footer: true  }
|y - anchor| >= 8 -> down { bar:false, footer:true } / up { bar:true, footer:false }
```

Both bands reset to shown on every stage change, and under reduced motion the
effect returns immediately so both stay in permanently. **Neither band is ever
`aria-hidden` while translated out** — they hold the only exit and the only
forward control.

Module bar: `sticky top-[var(--consumer-chrome-h)] z-20 border-t border-hairline
bg-yellow-200 py-4`; hidden is `-translate-y-[calc(100%+96px)]`, where the extra
96px clears the header's drop shadow. It carries `data-module-bar=""`, read by
the summary page's skip-link to compute its scroll clearance.

The bar's exit control is a **48px circle below 640** (`size-12 px-0`) and a
labelled pill from 640 (`min-[640px]:min-w-32`), with the label
`sr-only min-[640px]:not-sr-only`.

### 5.2 Welcome stage

No bar, footer only. `ModuleHeroWave` (see `wave-and-blob-shapes.md` §5), then a
centred column at `max-w-[1320px] px-6 min-[1200px]:px-28` — 112px, deliberately
wider than the standard 80px gutter. Label `text-consumer-lesson font-semibold`,
`<h1>` `text-consumer-display text-balance`, intro `text-consumer-eyebrow
text-ink-muted`.

Measured hero band: 375 × 177.98 · 768 × 284.77 · 1200 × 288 · 1440 × 288.

### 5.3 Video stage

`flex flex-col gap-10 py-14` inside `SHELL`. Title `text-consumer-card-title`,
sub `text-consumer-eyebrow text-ink-muted`, then a row that is
`flex-col` until **1200** and `min-[1200px]:flex-row` above it: the episode panel
(`flex-1`, `aspect-[855/481]`) beside a 240px "Follow along" card
(`bg-yellow-100 rounded-sm p-6`).

The three modes are a `role="group"` of `aria-pressed` toggle buttons — Video
(`Video`), Audio (`Headphones`), Transcript (`FileText`) — each `h-10 w-38
rounded-[28px] border border-ink`, active `bg-ink text-white`, inactive
`bg-white text-ink hover:bg-parchment`. Deliberately **not** a radiogroup: that
role carries a roving-tabindex and arrow-key contract this does not implement.

- **Video**: still image, `bg-black/50` scrim, a `size-36` glassy play button
  (`border-2 border-white/70 bg-white/20 backdrop-blur-[2px]`), `aria-disabled`
  with an `sr-only` "(coming soon)".
- **Audio**: a `rgba(32,0,97,0.85)` + `backdrop-blur-[6px]` veil, square album art
  at 27.586% of the panel, title `text-consumer-card-title` white.
- **Transcript**: the same veil with a `bg-purple-50` sheet — `inset-4` below
  1200, and the frame's own percentage insets above it. Rows are
  `text-consumer-transcript` (20 → 24 / 1.5 / 400) with the speaker in
  `font-semibold`. Highlights are `bg-yellow-400` (`#ffb600`, **not** the frame's
  `#ffb846`; `ink` on it measures 9.90:1) with `box-decoration-clone` so a
  wrapped highlight keeps its rounded ends.

The sheet's top and bottom feathers are `pointer-events-none` gradient overlays
at 14% and 62% height. They are **paint, not concealment** — the rows underneath
stay scrollable, focusable and in the accessibility tree.

Chapter carousel: `bg-purple-200 rounded-2xl p-6`, items `w-45` (180px) with
`h-27` (108px) thumbs, `gap-4`, chevron step `(180+16)*2 = 392px`. Active thumb
gets `border-[3px] border-consumer-primary` and a shadow. Chevrons are
`aria-disabled` and **never unmount** at the edges (they go
`pointer-events-none opacity-0`), so focus can never be dropped. Edge detection
is re-measured by a `ResizeObserver` on the scroller.

### 5.4 Summary stage

A 75px icon slot (`BookOpen size-14 strokeWidth 1.75`), `<h1>`
`text-consumer-card-title`, an intro paragraph whose card count comes from
`countWord(summaryCards.length)` and whose verb splits `Tap` / `Click` at 1200 by
CSS (two spans, one `display:none`) — CSS-hidden text is excluded from the
accessible name, so the button announces exactly the verb a reader can see, with
no state to keep in sync with a resize.

Flip cards: `<li className="[perspective:1600px]">` with a
`grid [transform-style:preserve-3d]` rotator; both faces occupy
`col-start-1 row-start-1`, so the card is as tall as the taller face and nothing
reflows on flip. `transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`.

| Band | Grid |
|---|---|
| < 1024 | 1 column, `max-w-[560px]` centred |
| 1024–1199 | `grid-cols-2 auto-rows-fr` |
| ≥ 1200 | `grid-cols-3` |

The single-column band deliberately runs all the way to 1024: at 768 two columns
gave a 348px card, narrower than the phone's own.

Front: `bg-consumer-primary rounded-2xl px-6 pt-6 pb-10`, number
`text-consumer-lesson font-semibold`, title `text-consumer-card-title`, then the
pillow (see `wave-and-blob-shapes.md` §8), then a `text-body-md text-white
underline` flip verb.

Back: `bg-purple-200 rounded-2xl p-6` with a **fixed-height** scroll panel —
`h-50 min-[640px]:h-65 min-[1200px]:h-75` (200 / 260 / 300px), `bg-purple-50
rounded-lg`, `tabIndex={0} role="group"`, with a sticky "more" affordance when
`scrollTop + clientHeight < scrollHeight - 2`. A `useEqualHeaders` hook measures
every `[data-card-header]` and writes `--card-hdr-h` on the `<ul>` so the four
headers share a height.

> Worth stating rather than burying: fixing that height puts roughly two of four
> points below a scroll on this audience's screens, and this portal's own audience
> note argues against hiding content behind a gesture. It is what was asked for.
> If the cards want to be shorter *and* whole, the other lever is two across on
> desktop rather than three.

> **`inert` takes a boolean in React 19, and `inert=""` is falsy there.** A first
> pass wrote the React 18 form and the attribute silently never reached the DOM —
> every hidden back face's controls were tabbable, measured with
> `el.hasAttribute('inert')` returning `false`.

Below the row, the resource card: `bg-yellow-100 rounded-lg border
border-parchment p-6`, stacking until **900** then `min-[900px]:flex-row
min-[900px]:gap-12 min-[900px]:p-10`. 900 is the only place that breakpoint
appears in the flow. Its artwork is in `wave-and-blob-shapes.md` §9.

### 5.5 Reflection stage

Same header shape (`NotebookPen`). The card is `rounded-[16px] border
border-parchment bg-purple-50` wrapping a `bg-purple-200` body at `px-5 py-8
min-[768px]:px-8 min-[768px]:py-10`.

A segmented progress bar of `h-2 w-10 rounded-[16px]` blocks — every segment up
to **and including** the current one stays solid `bg-consumer-primary`, the rest
`bg-purple-300`. Questions cross-fade with `x: ±64 * direction`, spring
`stiffness 320 / damping 32`, `staggerChildren 0.07`; the review step passes no
row variants, because 20 rows staggering reads as a page assembling itself.

Answer rows: `rounded-[16px] border bg-white py-2 pr-2 pl-4`, border
`consumer-primary` once anyone has answered and `purple-300` before. Tick buttons
are `size-14 rounded-[12px] border-2`; **PLE ticks fill `consumer-primary` with a
white check, carer ticks fill `yellow-300` with an `ink` check.**

> **The border stays `consumer-primary` in both states, including when the carer's
> box is filled yellow.** `yellow-300` against the white row measures about
> **1.7:1**, so a yellow-bordered box would have no boundary a reader could see —
> WCAG 1.4.11 wants 3:1 for a control's own edge.

The footer row is a **grid below 1200, not flex**: both buttons carry `flex-1`
with `flex-basis: 0`, but a flex item's default `min-width: auto` floors it at
its own min-content, and "Go back" plus a chevron is wider than half a 375px row.
Measured, Go back clamped to 156px and Next got the 114px left over — and it
stayed 151.5 / 117.5 even with `flex: 1 1 0px !important` forced onto both.

The share card (review step only) is two `min-h-14 rounded-[28px] border-2`
toggles, `grid gap-3 min-[768px]:grid-cols-2`, with **neither preselected** —
`shareWithCoach` starts `null` and the footer blocks until it is answered.

Blocked reasons: "Please answer all questions first." then "Please choose whether
to share your answers first."

### 5.6 Done stage

No bar, no footer. `CompletionHero` with the module badge
(`module-complete-badge.svg`, `w-[176px] sm:w-[218px]`, breathing `scale
[1,1.035,1]` / `y [0,-3,0]` over 4s), a title, one `text-consumer-eyebrow`
paragraph capped at `max-w-[644px]`, and a single `PILL_PRIMARY` in a
`max-w-[448px]` column.

> "Go home" is the exit label, and the destination is **not always home**:
> `moduleExitTo` returns My Modules when the module was opened with
> `?from=modules`. The label is true of one of its two destinations, and the
> routing was deliberately left alone. Two one-line fixes exist if it matters:
> derive the label from `moduleExitTo`'s own branch, or drop the `from` param.

---

## 6. Sleep diary — `/consumer/:dyadId/diary`

Three stages: `welcome → questions → done`. Canvas is `bg-purple-50`, full-bleed,
no scroll cue. The column is
`min-h-[calc(100dvh-var(--consumer-header-h)-61px)]` and
`min-[1200px]:min-h-[calc(100dvh-var(--consumer-header-h))]` — the 61px is the
nav tab row, which only exists below 1200.

> `ConsumerContentReveal` **replaces** the column here, it does not wrap it. An
> extra nested element breaks the `min-h` chain the sticky footer depends on.

**Welcome / done** are `CompletionHero` screens: the deep-purple wave band
(`wave-and-blob-shapes.md` §6), the six-layer tea-and-books mascot, an
`text-consumer-display` title and `text-consumer-eyebrow` copy, then a
`max-w-[448px]` CTA column with `mt-6 sm:mt-14`. Mascot widths `w-[200px]
sm:w-[274px]` (welcome) and `w-[220px] sm:w-[274px]` (done).

**Questions**: a column at `max-w-[1121px]`, `px-6 pt-6 pb-6 sm:px-10 sm:pt-20
xl:px-0`.

- Progress row `flex items-center gap-6 sm:gap-14`: a `size-11 rounded-full
  bg-ink text-white` exit button, a `role="progressbar"` track (`h-[7px]
  sm:h-[9px] rounded-3xl bg-purple-200` with a `bg-consumer-primary` fill), and
  the counter in `text-consumer-progress` (20 → 28 / 600), `aria-hidden` because
  the progressbar already carries "Question n of N".
- Question `<h1>` `text-consumer-question` (24 → 40 / 1.4), `w-full
  text-balance sm:text-center`, `tabIndex={-1}`, focused on every stage and index
  change alongside a scroll to top.
- Optional help line `text-consumer-eyebrow max-w-[800px] text-ink-muted`, wired
  as `aria-describedby` on **both** inputs.
- Answer stack `mt-[70px] gap-7 sm:mt-[72px] sm:gap-[52px]`; each row is
  `flex items-center gap-8 sm:w-auto` with the member name in
  `text-consumer-answer-name` at a fixed `w-[97px]`.
- Fields: `min-h-11 rounded-lg border-consumer-primary bg-white text-center
  text-[22px] leading-[1.3] font-medium`. Idle `border sm:border-2`, **active
  `border-[3px]` plus `scale 1.08` about `left center`**. Time inputs are
  `w-[172px] sm:w-[208px]`; number inputs `w-[136px] sm:w-[208px]`,
  `inputMode="numeric"`, digits stripped, 4 characters max.
- The unit label beside a number is translated by `(1.08 − 1) × fieldWidth` —
  10.88px base, 16.64px at `sm` — driven by a JS `matchMedia('(min-width:640px)')`
  listener rather than a class, because it has to track the same field width the
  scale uses.
- The "active member" is the **first unanswered** one, so once both are filled
  nobody is emphasised.

Exit is a destructive `ConfirmDialog` — "Leave the sleep diary?" / "Leave without
saving" / "Keep filling it in".

**`text-[22px]` on the field is the one raw pixel size left on a consumer
surface.** It sits outside the token scale, so it does not respond to anything the
scale does. Flagged rather than changed.

---

## 7. Need Help — `/consumer/:dyadId/help`

Hero (`withQuestion` — the mascot carries an animated speech bubble) over the
**gold** wave variant, then a purple contact card, then four FAQ blocks, then the
footer. Content column `max-w-[1121px]`, `gap-14`.

**Contact card** — `bg-consumer-primary rounded-[16px] border border-parchment
px-8 pt-8 pb-10 shadow-card`, `gap-10`. A 52px white
`MessageCircleQuestionMark` (`strokeWidth 1.5`), then a row that is `flex-col`
until `lg` and `lg:flex-row lg:items-center lg:gap-12` above it: a
`max-w-[588px]` copy column (eyebrow `text-consumer-eyebrow`, `<h2>`
`text-consumer-card-title text-balance`, sub `text-consumer-eyebrow`) beside a
`lg:min-w-[320px]` contact column of two real `tel:` / `mailto:` rows
(`rounded-[16px] bg-purple-50 px-5 py-4 lg:px-6`, hover `bg-white`, label
`text-consumer-body-strong`). Then a `border-t-2 border-white/40` divider and two
crisis numbers in `text-consumer-crisis` (18 → 20 / **600**, where the frame draws
700 — the portal's weight ceiling wins), separated by `sm:border-l-2
sm:border-white/40`.

> The email address gets a `<wbr>` immediately after the `@` and
> `sm:whitespace-nowrap`: one line from `sm` up, a *controlled* two-line break
> below it. An earlier `whitespace-nowrap` did not prevent the wrap so much as
> hide it — the text painted outside its own pill and the page's `overflow-clip`
> (which the full-bleed wave needs) swallowed the evidence, which is also why a
> `scrollWidth` check reported clean. Measured at 375: the address alone is
> **237px**, plus a 24px icon, a 12px gap and 40px of pill padding = **313px** of
> content in a **261px** pill.

**FAQ blocks** — a card below `lg` (`rounded-[16px] border border-parchment
bg-white shadow-card`, title band `bg-purple-50 px-5 py-6`), and a bare
two-column row above it (`lg:flex-row lg:gap-20`, title column `lg:w-[352px]`,
everything else stripped: `lg:border-0 lg:bg-transparent lg:shadow-none`).
Section `<h2>` is `text-consumer-section` (24 → 32, tracking −0.374px), sub
`text-consumer-body text-ink-faint`.

Rows are `<h3>` wrapping a `<button aria-expanded aria-controls>`; the whole row
is the target, the chevron sits in a `size-9` box and rotates 180° over 0.2s.
**The panel unmounts on close** rather than animating to `height: 0` and staying
in the tree — animated `height: 0` is not concealment.

> **The search is built, working and deliberately not rendered**
> (`SEARCH_ENABLED = false`, `ConsumerHelpPage.tsx:229`). It gates three live
> pieces that still typecheck and still run. If it is still `false` next time this
> page is opened, delete it and the three pieces rather than letting a permanent
> flag pretend to be temporary.

Measured at 1440: hero `<h1>` 40px; FAQ `<h2>`s 32px at x 159.5 (the 1121px
column, centred); contact card `<h2>` 28px in a 588px column.

---

## 8. My profile — `/consumer/:dyadId/account`

Title-only hero (no `sub`), then a one-column **grid** at `max-w-[1121px]`,
`gap-14`: a PLE person card (only when the dyad has one), a carer person card,
and the opt-out card. No footer.

> **A one-column grid, not a flex column.** `ConsumerPersonCard`'s `Card` carries
> `self-start`: in a grid that resolves on the block axis and is harmless, but in
> a flex column it resolves on the *inline* axis and shrinks each card to its
> content width, leaving a ragged right edge.

**`ConsumerPersonCard`** — `Card` with `gap-0 rounded-lg py-0 overflow-hidden`.
Header band `bg-purple-50 px-6 py-[14px]` carrying an `<h3>`
`text-consumer-heading` and an Edit pill (hidden while editing; label
`Edit` / `sm:Edit details` as two spans, not `sr-only`). Body `flex flex-col
gap-5 p-6` holding either a `<dl>` of four read-only fields or a form of four
inputs, both on `grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2`. Labels are
`text-consumer-body-strong`; values sit in a `min-h-12 rounded-sm border
border-parchment bg-parchment px-3 py-2.5 text-body` box, showing `—` when empty.
Pills are `h-12 rounded-3xl` with `active:scale-[0.97]`.

There is **no Background field**, on instruction; `person.background` stays on the
data model and is not cleared on save.

**`OptOutCard`** — `rounded-lg border border-destructive bg-destructive/10 p-6`
(composited `#fbe3e3`), `<h2>` in **`text-ink`, not `text-destructive`** (red on
red measures 4.44:1), copy `text-body text-ink` with an inline underlined link,
and an `h-11 rounded-full bg-destructive px-[18px] text-body-md text-white`
button.

The flow is **two mutually-exclusive `ConfirmDialog` mounts** (`step: 'message' |
'confirm' | null`) rather than one dialog swapping content, so the incoming
step's focus-on-open effect actually runs. Step 2's back path preserves the
message. No reason is asked for; the message is optional.

> Confirming unmounts its own trigger, so focus was measured landing on `<body>`.
> It is now moved deliberately to the opted-out panel's heading
> (`tabIndex={-1}` + a ref). This is the defect class this project has shipped in
> six separate rounds — assume it, and test it by completing the real flow.

Opting out **does nothing on the consumer's end** — neither the dialog nor the
resulting state claims any loss of access. The site-wide banner is
`role="status"`, `bg-destructive`, sticky at `top-[var(--consumer-chrome-h)]`.

---

## 9. Overlays

### 9.1 Accessibility menu

Trigger `size-11 rounded-full border-2 border-ink bg-white`, `PersonStanding
size-6`. Popup `w-[320px] max-w-[calc(100vw-32px)] rounded-lg border
border-parchment bg-white px-6 py-7 shadow-card`, positioned against a **virtual
anchor** that composes the header's `bottom`/`top` with the trigger's
`left`/`right`, `side="bottom" align="end" sideOffset={12}`.

Three tiles in a row, each `min-h-[100px] flex-1 rounded-[12px] border
border-ink-faint bg-parchment text-[16px] font-medium`: Increase / Decrease /
Reset, labels rendered as two lines with a `<br>`, icons `ChevronsUp`,
`ChevronsDown`, `RotateCcw` at `size-5`.

Measured at 375: trigger 44 × 44 at x 307; popup 320px wide at x 31; tiles
84.66 × 100. On a fresh load Decrease and Reset are `aria-disabled` with
`sr-only` reasons, because the ladder starts at its lowest rung.

The disabled tint is `text-ink/55`, **3.83:1 on `parchment`** — exempt because
the control is `aria-disabled`, not a pass. See `design-tokens.md` §2.4.

The full `zoom` model is `design-tokens.md` §3.

### 9.2 `ConfirmDialog`

The one shared modal chassis. Backdrop `fixed inset-0 z-40 bg-black/25`, fade
0.15s. Panel `pointer-events-auto flex flex-col overflow-hidden rounded-lg
bg-card p-6 outline-none ring-1 ring-hairline`, default size `max-h-[90vh]
w-[min(92vw,640px)] p-6 md:p-8`, enter `{opacity:0,y:8} → {opacity:1,y:0}` 0.2s.

Measured at 375: panel **327px** wide (the positioner's own `p-6` caps it before
the 92vw does), `max-height` 730.8px (90vh of 812), radius 16, padding 24;
buttons full width at 279 × 48, stacked; the footer band `#f5f5f7`.

Footer bleed is `MODAL_FOOTER_SURFACE = '-mx-6 -mb-6 rounded-b-lg bg-parchment
px-6 py-4 md:-mx-8 md:-mb-8 md:px-8'`.

> **The bleed's negative margins are sized to the panel's padding, so the two
> cannot be chosen independently**, and any panel using it must carry
> `overflow-hidden` or the margins visibly poke past the rounded corners.

Behaviour:

- On open, `triggerRef = document.activeElement`, then **the panel** is focused
  (not the first control).
- On close, restore is deferred one frame and guarded: only if the current
  active element is nothing, `<body>`, or inside the closing panel.
- Tab wraps over `'button:not([disabled]), a[href], select:not([disabled]),
  input:not([disabled]), textarea:not([disabled])'`. **`textarea` was missing
  until it was measured** — the opt-out message box was reachable once and then
  wrapped past permanently. Keep this selector in step with every natively
  focusable element a dialog can contain.
- **The `variant` prop is gone.** All five call sites passed `variant="consumer"`,
  so the `'app'` branch was dead and was the last thing painting coach-brand
  purple. Verified live: the confirm button now rasterises to `#3a00ad` against a
  `#3a00ad` Cancel border.

**There is no body scroll lock in this chassis**, and the page behind any
`ConfirmDialog` still scrolls. A doc comment in `CoachProfileModal` claims it
inherits one; it does not. (The drawer and the onboarding tour implement their
own.)

### 9.3 Coach profile modal

Rides `ConfirmDialog` with `hideHeader hideFooter singleAction` and
`panelClassName="w-[min(92vw,675px)] max-h-[90vh] overflow-hidden rounded-lg
p-0"`. Hero `h-[224px] sm:h-[250px]` with the stretched wave
(`wave-and-blob-shapes.md` §7), an identity block at `top-[42px] sm:top-14`, and
a portrait straddling the bottom edge at `bottom-[-51px] size-28
sm:bottom-[-65px] sm:size-36` with a `border-[6px] sm:border-8` white ring.
Body `px-5 pt-[75px] pb-8 sm:px-8 sm:pt-[89px]` — the `pt` is the portrait's
overhang (45.139% of its size) plus the frame's own 24.

Two dismiss controls on purpose: a `size-11` X over the hero (which scrolls with
the content) and a Close pill at the end.

> **Contact rows are the whole row at 44px.** A first pass made only the text the
> link and the layout audit caught it at **20px tall**, on the one surface whose
> audience has an explicit "not digitally literate at all" note.

### 9.4 Session feedback modal

Its own chassis, three steps (`mood → details → thanks`). Panel is a **full-screen
sheet on a phone and the frame's card from `sm`**: `h-[100dvh] w-full
rounded-none px-5 py-6` then `sm:h-[674px] sm:max-h-[calc(100dvh-3rem)]
sm:rounded-lg sm:px-10 sm:py-[min(48px,5dvh)] min-[900px]:px-16
min-[900px]:py-[min(72px,7dvh)]`, capped `max-w-[1115px]`.

Mood cards stack below `sm` (`w-[60vw] min-w-[200px] max-w-[280px]`, icon on the
right in a `flex-row-reverse` row) and become a 5-column grid above it
(`sm:min-h-[min(202px,30dvh)] sm:rounded-[24px]`).

> **No horizontal scrolling, and three shapes were tried.** Five equal tracks at
> every width gave **54px** cards at 375, reported as "very hard to interact
> with"; a snapping scroll row gave 104px cards but put the last two options
> behind a swipe. The 202px card height therefore starts at `sm` — below it, a
> 202px box 52px wide is a column, not a card.

Selection is an **`outline`, not a border**: as a border it took the card from
1px to 3px and the label stepped 2px right the moment a mood was chosen.

Every pillow beats until a choice is made, then only the chosen one does. The
five keyframe sets live in `consumer-tokens.css:614-675` with per-mood durations
(3.2–4.6s) so five pillows never move in lockstep, and
`prefers-reduced-motion` kills all of them with `animation: none !important`.

The footer sits **inside** the scrolling region, not sticky, and carries no
`mt-auto` — pinning it to the panel's lower edge put ~200px of dead space under
the pillows on the shortest screen.

Focus goes to the **heading** here (via a callback ref), where `ConfirmDialog`
focuses the panel. Its Tab-trap selector also omits `select`, where
`ConfirmDialog`'s includes it. Two chassis, two contracts — a third caller should
force them together.

### 9.5 First-run onboarding tour

Five screens over a `z-40 bg-black/25` dim. **There is no spotlight** — it is a
fixed 577 × 716 card over a flat dim. Focus moves to the heading on each step via
a callback ref; on close it goes to `#main-content`, never `<body>`, and there is
deliberately **no restore to the opener**, because the opener is the welcome's
final CTA and has already unmounted.

It is a card at every width, never a full-bleed sheet — that was built first and
reported straight back as "in mobile view, I cannot see it as a pop-up modal".
The phone cap is 96px short of the viewport, not 32.

`ScrollCue` is suppressed while the tour is open.

---

## 10. Responsive summary

| | **375** | **768** | **1200** | **1440** |
|---|---|---|---|---|
| Design exists? | yes (iPhone SE frames) | **no — derived** | yes (1281 desktop frames) | derived from 1281 |
| Header | 133px (bar + tab row) | 133px | 72px (nav in bar) | 72px |
| Page gutter | 24px | 80px | 80px | 80px |
| Hero `<h1>` | 28px | 33.72px | 40px | 40px |
| Section `<h2>` | 20px | 20.95px | 22px | 22px |
| Body / eyebrow | 16px | 16.95px | 18px | 18px |
| Hero wave | `home-wave-mobile.svg`, 375 × 176 | desktop export held at 1281 × 239, cropped | 1281 × 239 at x −40.5 | 1440 × 268.66, full bleed |
| Module hero band | 375 × 178 (`--wave-s: 1.6`) | 768 × 285 (1.25) | 1200 × 288 (**32vh cap**) | 1440 × 288 (**cap**) |
| Mascot | 89 × 58 (scale 0.6444) | 138 × 90 | 138 × 90 | 138 × 90 |
| Home task grid | 1 col | 1 col | 2 equal cols | `744px 1fr` |
| Summary cards | 1 col, `max-w-[560px]` | 1 col | 2 cols | 3 cols |
| Nav | drawer + tab row | drawer + tab row | in the bar | in the bar |
| Verb | "Tap" | "Tap" | "Click" | "Click" |
| `layoutAudit()` | empty | empty | empty | empty |
| `scrollWidth` | 375 | 768 | 1200 | 1440 |

Also verified: `layoutAudit()` empty and no horizontal scroll at 375 with the
text size at **150%**, with the drawer open.

---

## 11. Things an engineer would otherwise get wrong

1. **The header's height is measured, not assumed.** Offset sticky things by
   `var(--consumer-chrome-h)`, never by `var(--consumer-header-h)`. §1.3.
2. **Any surface mounted outside `<main>` needs its own `zoom`.** `design-tokens.md` §3.4.
3. **`showWelcome={false}` is required on every non-Home page**, or the welcome
   flow replays over that route and its final CTA sends the reader to Home. §2.
4. **Focus after an `AnimatePresence mode="wait"` swap belongs on a callback
   ref**, never a `useEffect` keyed on the state. The incoming node mounts a
   commit later. §5, §9.4.
5. **Any control that unmounts on click must move focus deliberately.** Six
   rounds of this project have shipped focus landing on `<body>`. Test by
   completing the real flow, not by reading it.
6. **`aria-disabled`, never `disabled`.** A `disabled` button leaves the tab
   order, so a screen-reader user never learns the thing exists. Every blocked
   control here pairs it with an `sr-only` reason or a `BlockedHint`.
7. **Animated `height: 0` is not concealment.** Collapsed content keeps its tab
   stops and its place in the accessibility tree unless it also gets `inert` /
   `aria-hidden`, or unmounts. The FAQ unmounts; the summary card's hidden face
   is `inert`.
8. **`inert` is a boolean in React 19**; `inert=""` is falsy and silently never
   reaches the DOM. §5.4.
9. **Tailwind v4 emits `translate-y-*` as `translate`, not `transform`.**
   Transition the right property or your band teleports. §1.6.
10. **Write every breakpoint as a literal class.** A composed `` `${VAR}:block` ``
    generates no CSS and fails silently.
11. **`min-w-0` on flex and grid cells**, or one wide child sizes the track. §3.1.
12. **No `sr-only` inside a horizontal scroller** — it escapes the clip and
    widens the document. `wave-and-blob-shapes.md` §12.8.
13. **Rasterise before quoting a contrast number.** Tailwind v4 emits `oklab()`;
    parsing a computed string as RGB returns nonsense, and translucent fills must
    be composited against what is actually behind them.
14. **Check the console in a fresh tab.** The preview tool's console reader
    returns a retained buffer that survives `location.reload()` and
    `console.clear()`.
15. **`tsc` passing is not proof the app builds.** A comment inside a JSX
    attribute list passes `tsc --noEmit` and is rejected by Vite's parser. And in
    this package right now, the reverse also holds: the app *appears* to run while
    its CSS build is failing. §0.

### Known gaps, flagged rather than fixed

- The CSS build fails on `@apply border-border` (§0). One line.
- **The text-size setting is not persisted** — every visit starts at 100%.
- `text-[22px]` on the diary's answer fields is the last raw pixel size on a
  consumer surface; it sits outside the scale and responds to nothing.
- The Home desktop "Click here to get help" link is a 22px inline target; the
  phone layout gives the same action a 48px button. §3.6.
- `SEARCH_ENABLED = false` gates a complete, working Need Help search. §7.
- Two modal chassis with two different focus and trap contracts. §9.4.
- `ConsumerContentReveal`'s `initial y: 10` means a geometry measurement taken
  within ~450ms of arrival reads 10px low. Measure at rest.
- The progress-gradient angle differs between `LessonCards` and
  `LearningTaskCard` while a comment claims it does not. §4.
- The shell's content gutter steps at `md` (768) while the header's and footer's
  step at 1200, so between 768 and 1199 page content sits 80px in while header
  content sits 24px in. Moving the content to 1200 is the tidier end state and is
  a separate change.
