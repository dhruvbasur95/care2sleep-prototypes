# Motion spec — Care2Sleep Consumer Portal

Every animation in the portal, in the order a consumer meets them.

**How to use this document.** Keep the repo open beside it. Each animation below
gives you: where it lives as `file:line`, what triggers it, a measured timeline,
a tight excerpt of the lines that actually carry the motion, and then the part
you cannot read off the source — what it structurally depends on, what order
things must happen in, what to change if you want to tune it, and what breaks if
you get it wrong.

**[§0](#0-the-system) is the exception and is meant to be pasted.** It is the
shared vocabulary of easings, durations, springs and loop periods. Paste it as a
constants module first; it is the thing that stops a rebuild drifting.

**Every number is measured or read from the code as it stands.** Values marked
**(measured)** were sampled from the running app at `http://localhost:5220`;
values marked **(authored)** were read from source. Where the two disagree both
are given and the shipping one is named. The one systematic exception is
`prefers-reduced-motion`, which this harness cannot emulate — see
[§13](#13-reduced-motion).

**Two things the brief may lead you to look for, which do not exist.**

1. **There is no `<canvas>` animation anywhere.** `ConsumerCanvasWave.tsx` is
   named for the page *canvas*. It contains no `<canvas>` element, no
   `getContext`, and no `requestAnimationFrame` loop of its own.
2. **The first-run tour has no spotlight and no coachmark.** It is a centred
   577×716 card over a flat `black/25` dim, with one screenshot per step.

Companion documents: `orchestration-flows.md` (the state machines these
animations decorate, and the demo-trigger table), `design-tokens.md` (colour,
type, radius, shadow), `wave-and-blob-shapes.md` (the illustration geometry).

---

## Contents

- [§0 The system](#0-the-system) — paste this in first
- [§1 Chrome that is always present](#1-chrome-that-is-always-present)
- [§2 The welcome flow](#2-the-welcome-flow)
- [§3 The first-run tour](#3-the-first-run-tour)
- [§4 Home](#4-home)
- [§5 My Modules and a module's inner pages](#5-my-modules-and-a-modules-inner-pages)
- [§6 The sleep diary](#6-the-sleep-diary)
- [§7 The session-feedback modal](#7-the-session-feedback-modal)
- [§8 Need help](#8-need-help)
- [§9 My profile](#9-my-profile)
- [§10 The mascot system](#10-the-mascot-system--one-clock-four-surfaces)
- [§11 Traps](#11-traps) — the highest-value section; none of it is inferable from the source
- [§12 Assets](#12-assets)
- [§13 Reduced motion](#13-reduced-motion)

---

# §0 The system

Read this section before any other, and paste it in as a module. Everything
after it refers to these names.

## 0.1 The one global switch

```tsx
// src/App.tsx:44
<MotionConfig reducedMotion="user">
  {/* the whole app */}
</MotionConfig>
```

`reducedMotion="user"` is load-bearing and does most of the accessibility work
for free: when the OS asks for reduced motion, framer-motion **drops every
transform and layout animation app-wide** and keeps only opacity and colour. A
component that never calls `useReducedMotion()` is therefore still safe for
*transforms*. Components call it anyway where they need to do something smarter
than "drop it" — the welcome screen keeps a shortened cross-fade rather than
becoming instantaneous, and the sleeping "z" glyphs are pinned **visible** rather
than deleted along with their loop.

**There is a second, global CSS safety net** at `src/index.css:731`, which the
audit preceding this document did not account for:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

It sits at the top level of the stylesheet, **outside every `@layer`**, with
`!important`, so it beats Tailwind utilities. Between the two switches, this is
the real coverage map:

| Mechanism | Count | Covered by |
|---|---|---|
| framer transform / layout animations | 34 | `MotionConfig reducedMotion="user"` |
| CSS `@keyframes` (the five mood pillows) | 12 elements | the global block **and** an explicit `@media` rule at `consumer-tokens.css:670` |
| Tailwind `transition-*` utilities | ~60 sites | the global block (10 sites also write `motion-reduce:transition-none` explicitly) |
| Inline `style={{ transition }}` | 3 sites | the global block (§11 Trap 6 says why they are still worth moving) |
| `scrollTo/scrollBy({ behavior: 'smooth' })` | 6 sites | **1 of 6.** Nothing global can reach these — §11 Trap 5 |

The smooth scrolls are the only genuine gap.

## 0.2 Easing curves — the canonical set

The portal uses **six** curves. Four earn their place; two are one-offs with a
recorded reason. Name them and stop adding more.

```ts
// motion/easing.ts — the whole vocabulary
export const EASE_STANDARD = [0.4, 0, 0.2, 1] as const   // 24 uses. The default. Anything not one of the four below.
export const EASE_TRAVEL   = [0.37, 0, 0.63, 1] as const //  1 use.  Welcome-screen horizontal travel only (sine in-out).
export const EASE_SHUTTER  = [0.32, 0, 0.35, 1] as const //  1 use.  Hamburger drawer OPENING only.
export const EASE_OUT      = 'easeOut'                   //  6 uses. Modal panels, backdrops, one-way fades.
export const EASE_IN       = 'easeIn'                    //  2 uses. The EXIT half of a question-step slide.
export const EASE_LOOP     = 'easeInOut'                 //  9 uses. Every idle loop, without exception.
```

Why the two one-offs exist, so they are not "tidied away":

- **`EASE_TRAVEL`** (`ConsumerWelcome.tsx:560`) rides a 1.8s, 1281px slide.
  `EASE_STANDARD` peaks at ~2.0× average velocity; this sine curve peaks at
  ~1.57×, about 22% calmer through the middle. Over that distance the difference
  is the whole difference between "a page scrolling" and "a slide flicking".
- **`EASE_SHUTTER`** (`ConsumerMenuDrawer.tsx:238`) is a full-height panel
  dropping from the top edge. A literal `ease-in` was tried and measured: it held
  near the top for 160ms, then covered ~1000px in the last third and arrived at
  full speed. `EASE_SHUTTER` keeps the gentle entry and loses the hard arrival.

**The drawer's closing direction is deliberately a different curve and duration
from its opening, and it is the only place in the portal that does this** —
because the close is choreographed against the page underneath it. Everywhere
else, in and out share one curve. Two different easings on two things moving
together is most of what reads as "springy".

## 0.3 Durations — the canonical set

Twenty distinct durations ship today **(measured by sweeping the source)**.
Collapse to these seven, plus the loops:

```ts
export const DUR = {
  instant: 0.15,  // a backdrop fade. Present, not noticed.
  snap:    0.2,   // a modal panel arriving; a chevron turning; a selected state growing
  quick:   0.26,  // one screen cross-fading to another inside a fixed box
  base:    0.35,  // a stage or step arriving on a page
  settle:  0.45,  // page-content reveal; the shutter's own exit
  slow:    0.55,  // a face changing expression
  travel:  1.8,   // the welcome screen's horizontal stride. Nothing else goes near this.
} as const
```

Six ship values do **not** map onto that table and are kept as-is, because each
is calibrated against something specific rather than chosen:

| Value | Where | Calibrated against |
|---|---|---|
| `0.22s` | `ConsumerFlowFooter.tsx:63` `CHROME_TRANSITION` | the 8px scroll threshold that triggers it |
| `0.24s` | `ConsumerHelpPage.tsx:403` FAQ panel height | the panel's own ~30px travel |
| `0.42s` / `0.68s` | `ConsumerMenuDrawer.tsx:297` / `:238` | each other — see §1.5 |
| `0.5s` | `ModuleSummaryCards.tsx:705` card flip | a 180° turn needs the time |
| `0.6s` | `ConsumerHeader.tsx:312` nav-tab item rise | deliberately slow, so a 0.14s stagger reads as a wave |
| `0.32s` | `ModuleSummaryCards.tsx:310` pillow hover (raw CSS) | a hover, which must not outlast the pointer |

## 0.4 Loop periods

Every idle loop is `repeat: Infinity, ease: 'easeInOut'`. The periods are
deliberately **mutually prime-ish**, so two loops on one screen never sync into
looking like one event.

```ts
export const LOOP = {
  scrollCueBob:   1.5,  // ScrollCue chevron
  beatVeryGood:   3.2,  // feedback modal
  helpBubble:     3.2,  // Need help mascot
  zCycle:         3.6,  // sleeping "z" glyphs (welcome + Home nap)
  beatGood:       3.6,
  beatNotGreat:   3.8,
  breathSleeping: 4.0,  // welcome screen pillow
  breathDiary:    4.0,  // completion hero + module-complete badge
  beatOkay:       4.2,
  beatVeryBad:    4.6,
  breathAwake:    5.0,  // Home, My Modules, Need help, feedback thank-you
  browTwitch:     7.0,  // welcome screen brows
} as const
```

**Do not round these to a common value.** Five mood pillows on one row at one
shared duration read as a row twitching rather than as five pillows each with a
life of its own.

## 0.5 Springs

Seven spring configs ship. All use framer's default `mass: 1`.

```ts
export const SPRING = {
  /** A box interpolating between two positions. framer's own tab convention. */
  slide:  { type: 'spring', stiffness: 500, damping: 35 },  // nav pill layoutId
  /** A press acknowledged under the finger. */
  press:  { type: 'spring', stiffness: 500, damping: 30 },  // whileTap on a tick box
  /** A mark appearing. Overshoots ~10% — measured, see §5.5. */
  pop:    { type: 'spring', stiffness: 620, damping: 24 },  // the tick itself
  /** A block of content sliding in from the side. */
  step:   { type: 'spring', stiffness: 320, damping: 32 },  // question-step x
  /** That block's children rising behind it. */
  rise:   { type: 'spring', stiffness: 380, damping: 34 },  // question-step children
  /** A control growing to say "you are here now". */
  focus:  { type: 'spring', stiffness: 300, damping: 24 },  // diary active field
  /** A bar filling. Slowest of the seven on purpose. */
  meter:  { type: 'spring', stiffness: 210, damping: 28 },  // diary progress bar
} as const
```

`step`, `rise` and `focus` each appear in two files and are already
byte-identical in both — `ModuleReflection.tsx:349,368` and
`ConsumerDiaryPage.tsx:262,284` run the same stepper. `slide`, `press`, `pop` and
`meter` have one caller each.

## 0.6 Distances

The portal has exactly four travel distances, and that is worth keeping:

| Distance | Meaning |
|---|---|
| **8px** | anything arriving on a page (`y: 8 → 0`). Stage swaps, modal panels, nav tabs, drawer rows, scroll cue |
| **10px** | page content revealing under the chrome (`ConsumerContentReveal`) |
| **16px** | a child rising behind its parent inside a step |
| **64px** | a whole question-step sliding sideways, signed by direction |

Plus two idle amplitudes: **±2–3px** for a float, **±5px** for the scroll-cue bob.
The diary's stage swap is the one deliberate outlier at **24px**, and §6.1 says
why.

## 0.7 The magnitude rule

A rotation under ~8° on a small shape, or a translation under ~2px, is
**invisible on screen while being present in the DOM** — it gets reported as
"nothing is animating". Three animations here carry deliberately oversized
amplitudes for exactly that reason:

| Animation | Amplitude | Effective on screen |
|---|---|---|
| Help question-bubble rotation | −5.1° → +3° | **8.1° swing (measured −5.05° → +2.96°)** on a 52px shape |
| Welcome brow twitch | `y: −4` | 4px on a 188px box. A first pass used 1.6px and was invisible |
| Diary / completion pillow breath | `scale 1.035` | ~9.6px of width on a 274px mascot. The welcome screen's 1.018 moves it 4.6px and was reported as "no motion" |

**Before concluding something is not animating, read §11 Trap 10.** Three
separate harness behaviours produce that exact false finding here, and one of
them has already cost this project a wrong verdict.

---

# §1 Chrome that is always present

## 1.1 Route transitions — and the page-intro latch

**Where** `src/App.tsx:46` · `src/components/consumer/ConsumerShell.tsx:86,346,407`
**Trigger** route change.

**(measured)** On an in-app tab change, `<main>`'s own opacity stays at **1
throughout** — the page-level fade does **not** play. That is deliberate.

```tsx
// App.tsx:46
<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>…</Routes>
</AnimatePresence>
```

```tsx
// ConsumerShell.tsx:86 — module scope, NOT React state
let pageIntroPlayed = false
// :346
const playPageIntro = !pageIntroPlayed
useEffect(() => { pageIntroPlayed = true }, [])
// :407
<motion.main
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
  initial={playPageIntro ? { opacity: 0, y: 8 } : false}
  exit={playPageIntro ? { opacity: 0 } : undefined}
/>
```

**What this depends on structurally.** `key={location.pathname}` — not
`location.key` — is what makes the exit animation run at all, while leaving a
re-render at the same URL alone. And **every consumer page mounts its own
`ConsumerShell`**, so the latch cannot be React state: state here resets on every
navigation and the entrance replays on every tab press. Module scope resets on a
real page refresh, which is the intent.

**Why the `exit` is dropped too, and not only the `initial`.** Under
`mode="wait"` the incoming page waits for the outgoing 300ms fade, and the header
is inside the page subtree — so the whole bar disappeared for that beat and read
as a reload. Removing only the entrance leaves that half of the bug in place.

**Where the real per-page entrance lives.** §1.2, scoped to the content *below*
the wave and the mascot. If you want a page transition to feel different, change
that, not this.

**Reduced motion** `MotionConfig` drops the `y` and keeps the opacity.

---

## 1.2 `ConsumerContentReveal` — the page's content entrance

**Where** `src/components/consumer/ConsumerCanvasWave.tsx:826-867`; its signal
store is `src/data/consumerMenuReveal.ts:23-41`.
**Trigger** mount (every navigation), **and** a replay pulse when the hamburger
drawer closes without navigating.

| Property | From | To | Duration | Easing |
|---|---|---|---|---|
| `opacity` | 0 | 1 | 0.45s | `EASE_STANDARD` |
| `y` | 10px | 0 | 0.45s | `EASE_STANDARD` |

**(measured)** complete at ~455ms. **(authored)** 0.45s. ✅ match.

```tsx
// ConsumerCanvasWave.tsx:830
const controls = useAnimationControls()
const revealToken = useContentRevealToken()   // a monotonically increasing number

useEffect(() => {
  if (reduceMotion) { controls.set({ opacity: 1, y: 0 }); return }
  void controls.start({ opacity: [0, 1], y: [10, 0] })
}, [revealToken, reduceMotion, controls])

// :859
<motion.div
  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
  animate={controls}
  transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
/>
```

**What to wrap.** Only the content *below* a page's hero. The wave, the mascot
and the greeting must hold still on a tab change, or the navigation reads as a
full page reload. Every consumer page already follows this; keep it.

**Why `useAnimationControls` and not a `key`.** Keying the subtree to force a
replay throws away every child's state on every menu close — a half-typed diary
answer, an open card, the scroll position. Controls leave the tree mounted.

**Why the effect exists at all.** Because `animate` is a controls object rather
than a target, framer plays **nothing** on mount by itself. The effect is what
starts it, which is also why it is keyed on `revealToken` rather than running
once.

**Why the token is a counter, not a boolean** (`consumerMenuReveal.ts:23`).
Consecutive closes must each fire. A boolean needs resetting, which is a second
render and a race.

**Reduced motion** `controls.set(...)` places the content at its final values
with no animation at all.

---

## 1.3 Nav tab row — staggered entrance

**Where** `src/components/consumer/ConsumerHeader.tsx:186-193` (constants),
`:215` (latch), `:295-312` (the animation).
**Trigger** the first render of the session only.

| Property | From | To | Duration | Easing | Delay |
|---|---|---|---|---|---|
| row `delayChildren` | — | — | — | — | **0.45s** |
| per-item `staggerChildren` | — | — | — | — | **0.14s** |
| item `opacity` + `y` | 0, 8px | 1, 0 | 0.6s | `EASE_STANDARD` | (stagger) |

Last tab settles ~1.05s after the first begins. **(authored — §11 Trap 10 says
why this one could not be sampled live; its per-item values are the same shape as
the drawer rows in §1.5, which were measured and matched exactly.)**

```tsx
// ConsumerHeader.tsx:186
const NAV_RISE = { out: { opacity: 0, y: 8 }, in: { opacity: 1, y: 0 } }
const NAV_STAGGER_S = 0.14
const NAV_ENTRANCE_DELAY_S = 0.45
let navIntroPlayed = false                    // :215, module scope as in §1.1

// :295
initial={navIntroPlayed ? false : 'out'}
animate="in"
variants={{ in: { transition: {
  staggerChildren: reduceMotion ? 0 : NAV_STAGGER_S,
  delayChildren:   reduceMotion ? 0 : NAV_ENTRANCE_DELAY_S,
} } }}
// :309 — each <li>
variants={NAV_RISE} transition={itemTransition}   // 0.6s EASE_STANDARD
```

**Why the 450ms hold is not decoration.** Without it the first tab lands while
the welcome pillow is still fading out (§2.5's 420ms exit) and two movements
compete. **If you change the welcome exit duration, change this to match.** They
are a pair, and nothing in the code links them.

**"Linear order" is a per-item delay, not a per-item easing.** Giving each item a
different curve was the first attempt and it reads as inconsistency, not as a
wave.

**The latch is set at `:561`, gated on `showNav`** — a page that renders no tab
row must not consume the one-time entrance on the next page's behalf.

**This deliberately does not suppress the pill slide** (§1.4), which is keyed on
selection rather than on mount.

---

## 1.4 Nav pill — the sliding yellow background

**Where** `ConsumerHeader.tsx:396-403` · **Trigger** route change (the active
`NavLink` changes).

**(measured, 1281px)** `left` 509 → 632 (123px) and `width` 112 → 153.1px, with a
small overshoot to 634.3 at 255ms and at rest 632.0 from ~460ms. Underdamped as
intended. Fill `rgb(255,226,153)` = `yellow-200`.

```tsx
// ConsumerHeader.tsx:396
<motion.span
  aria-hidden="true"
  layoutId={`consumer-nav-pill-${variant}`}   // ⚠️ variant in the id — see below
  className="absolute inset-0 rounded-[40px] bg-yellow-200"
  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 35 }}
/>
```

**The whole mechanism is one `layoutId` shared by both tabs.** framer sees the
same layout identity leave one link and arrive in another, and interpolates the
box between them. A background *class* can only pop.

**What it depends on structurally.** The pill's link needs `position: relative`,
and the label and icon need `relative z-10` — otherwise the fill paints over
them.

**⚠️ The `variant` in the id is mandatory, and this is not defensive.**
`NavTabs` is rendered **twice** — once centred in the bar (`min-[1200px]`), once
as a full-width row beneath it — and **both are mounted at once**, with CSS
hiding one. Two live elements sharing one `layoutId` make framer animate between
the hidden copy and the visible one, which looks like the pill flying in from
nowhere.

**To tune it:** raise `damping` to remove the overshoot, lower `stiffness` to
slow it. Do not add a `duration`; a layout animation with one stops tracking the
real box.

---

## 1.5 Hamburger drawer — the shutter

**Where** `src/components/consumer/ConsumerMenuDrawer.tsx`, mounted **once, above
`<Routes>`** at `App.tsx:89`.
**Trigger** the header's Menu button (`min-[1200px]:hidden`).

| Phase | Property | From | To | Duration | Easing |
|---|---|---|---|---|---|
| Open | panel `y` | −100% | 0 | **0.68s** | `EASE_SHUTTER` |
| Open | row `opacity` + `y` | 0, 8px | 1, 0 | 0.42s | `EASE_STANDARD`, delay `0.26 + i × 0.09` |
| Close | panel `y` | 0 | −100% | **0.4s** | `EASE_STANDARD` |
| Close | page content reveal | see §1.2 | | 0.45s | runs **concurrently from t=0** |

**(measured, opening, 834×900)** panel `y` −900 → 0: 21px by 63ms · 96px by
121ms · 223px by 180ms · 379px by 237ms · 529px by 296ms · 648px by 354ms ·
741px by 413ms · 808px by 471ms · 854px by 530ms · 883px by 587ms · 897px by
646ms · rest at **~690ms**. Row 0 starts at 296ms and settles ~700ms; row 4
starts at ~646ms and settles ~1055ms (delay `0.26 + 4×0.09 = 0.62s` ✅). Close
button focused at t≈9ms.

**(measured, closing)** panel 0 → −900 over **~400ms** while the page's
`ConsumerContentReveal` runs 0→1 / y 10→0 concurrently from t=0 and lands at
~455ms. Both finish together.

```tsx
// ConsumerMenuDrawer.tsx:235
animate={reduceMotion
  ? { opacity: 1, transition: { duration: 0 } }
  : { y: 0,      transition: { duration: 0.68, ease: [0.32, 0, 0.35, 1] } }}
exit={reduceMotion
  ? { opacity: 0, transition: { duration: 0 } }
  : { y: '-100%', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}

// :297 — each row
transition={reduceMotion
  ? { duration: 0 }
  : { duration: 0.42, delay: 0.26 + i * 0.09, ease: [0.4, 0, 0.2, 1] }}
```

**⚠️ The drawer MUST be mounted above the router.** Every consumer page mounts
its own shell, so a drawer inside the header is unmounted by `navigate()` in the
same commit and its exit animation never plays — reported as "the drawer just
vanishes". An earlier fix deferred the navigation to `onExitComplete`, which
produced three sequential events (shutter up → page swap → content fade) and was
reported as *"choppy, rough, and not well choreographed"*. Mounting it above the
router is what lets one gesture overlap. Its open state therefore also lives in
the module-scoped store (`consumerMenuReveal.ts:61-89`), not in shell state, for
the same reason.

**The two dismissal paths are not the same, and the difference is the design.**

```tsx
// :172 — a row: navigate and close in the SAME frame. No reveal pulse: the new
// page mounts underneath and plays its own ConsumerContentReveal on mount, so
// the shutter is still rising over a page that is already moving in. Pulsing as
// well would animate the OUTGOING page.
const go = (row: Row) => {
  closeConsumerMenu()
  navigate(to)
  requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }))
}

// :192 — X or Escape: nothing navigates, so the page underneath has to be told
// to replay. ⚠️ The pulse fires as the close STARTS, not on onExitComplete. From
// onExitComplete the content's entrance began at 440ms — after the shutter had
// entirely gone — and the two read as two events instead of one.
const dismiss = () => {
  pulseContentReveal()
  closeConsumerMenu()
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>('button[aria-label="Menu"]')?.focus())
}
```

**Focus goes on a callback ref (`:93`), not an effect.** Under `AnimatePresence`
the panel mounts a commit *later* than the state change, so a `useEffect` keyed
on `open` runs before the close button exists. §11 Trap 2.

**The Menu trigger is re-queried on dismiss rather than held in a ref (`:192`)**
— this component outlives the header that owns the trigger, so a ref captured on
open can point at a node a navigation has replaced.

**The scroll lock (`:97-106`) is reused verbatim by the tour (§3) and the
feedback modal (§7).** The scrollbar-gap padding is the part people drop: without
it the page jumps ~15px wider the instant the drawer opens, moving every element
underneath it.

**Reduced motion** the panel cross-fades in place with no `y` at all and
`duration: 0`; rows skip their `initial` and simply appear.

---

## 1.6 Accessibility and account submenus — a CSS transition, deliberately

**Where** `src/components/consumer/AccessibilityMenu.tsx:139`, exported and
imported by `ConsumerHeader.tsx:16,796` so both cards read one string.
**Trigger** Base UI popup open/close.
**(measured)** `transition: opacity 0.2s ease-out, transform 0.2s ease-out`;
start/end state `opacity 0, translateY(-4px)`.

```tsx
// AccessibilityMenu.tsx:139
export const SUBMENU_CARD_MOTION =
  'transition-[opacity,transform] duration-200 ease-out ' +
  'data-[starting-style]:opacity-0 data-[starting-style]:-translate-y-1 ' +
  'data-[ending-style]:opacity-0 data-[ending-style]:-translate-y-1 ' +
  'motion-reduce:transition-none'
```

**This is not framer, and it cannot be.** Base UI unmounts the popup on close, so
an exit animation has to be something the library itself can wait for — it
detects a CSS transition and holds the node until it finishes. Reaching for
`AnimatePresence` here means fighting the popup library for ownership of the
unmount.

**Why only 4px and 200ms.** These cards hang 12px below a sticky header and
travel *toward* the reader, so anything larger reads as the card falling out of
the bar rather than opening from it.

**Why `motion-reduce:transition-none` rather than `motion-safe:` on each state
class.** Stacking a media variant on a data-attribute variant is a combination
Tailwind has already been watched failing to compile silently in this project —
§11 Trap 9.

---

## 1.7 `ScrollCue`

**Where** `src/components/consumer/ScrollCue.tsx:38-113`. Mounted by
`ConsumerShell.tsx:483` on every page except the welcome flow, the tour, and any
page with its own sticky footer.
**Trigger** a `scroll`/`resize` listener plus a `ResizeObserver` on
`documentElement`; shows when more than **48px** of scroll remains.

| Property | From | To | Duration | Easing |
|---|---|---|---|---|
| pill `opacity` / `y` (enter and exit) | 0, 8px | 1, 0 | 0.3s | `EASE_STANDARD` |
| chevron `y` (loop) | 0 → 5 → 0 | | **1.5s** | `easeInOut`, `repeat: Infinity` |

**(measured)** pill 220.5 × 56 at `right: 24px; bottom: 24px`. Chevron bob `y`
0 → **4.97** → 0, trough at 446ms, next trough at 1889ms → **period 1443ms ≈
1.5s** ✅.

```tsx
// ScrollCue.tsx:54 — the ResizeObserver is the non-obvious half
const ro = new ResizeObserver(measure)
ro.observe(document.documentElement)

// :100 — the bob is on the GLYPH, not the button
<motion.span
  className="flex"
  animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
  transition={reduceMotion ? undefined : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
>
  <ChevronDown aria-hidden="true" className="size-6" />
</motion.span>
```

**Why the `ResizeObserver` and not just `scroll` + `resize`.** The page's height
changes with no event firing — a card finishing its entrance, an image loading, a
banner dismissed. Without it the cue is decided once, off whatever the layout
happened to be on mount, and then lies.

**Never put `repeat: Infinity` on the element that is also the target.** The bob
lives on an inner span so the button's own hit area stays where the browser put
it. A moving 220×56 target is a real usability problem for this portal's
audience, and it is invisible in review because the pointer follows.

**Use `window.scrollBy`, never `scrollIntoView` (`:69`).** `scrollIntoView`
scrolls *every* scrollable ancestor, and this project has fixed three separate
bugs caused by it picking the wrong one.

**Reduced motion** the pill's enter/exit becomes instant and the bob is not
started at all. The `behavior: 'smooth'` jump on click is **not** guarded — §11
Trap 5.

---

## 1.8 `ConfirmDialog` — the portal's modal signature

**Where** `src/components/shared/ConfirmDialog.tsx:191-211` · **Trigger** `open`.

| Element | Property | From | To | Duration | Easing |
|---|---|---|---|---|---|
| backdrop | `opacity` | 0 | 1 | **0.15s** | linear default |
| panel (enter) | `opacity`, `y` | 0, 8px | 1, 0 | **0.2s** | `easeOut` |
| panel (exit) | `opacity` | 1 | 0 | 0.2s | `easeOut` — **no `y`** |

```tsx
// ConfirmDialog.tsx:194
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} className="fixed inset-0 z-40 bg-black/25" />
// :204
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }} role="dialog" aria-modal="true" />
```

**This backdrop-0.15s + panel-0.2s-easeOut-y8 pair is the portal's modal
signature**, and it is repeated verbatim by `ConsumerOnboardingTour.tsx:244,257`
and `SessionFeedbackModal.tsx:526`. **If you extract one thing from this
document, extract that.** Three files currently carry the same six lines.

**The exit is `opacity` only, on purpose.** Adding a `y` to the exit makes a
dismissal read as the dialog *falling*, which implies something went wrong.

**The focus-trap selector must include `textarea` (`:175`).** It was missing
until it was measured: the opt-out dialog renders a real `<textarea>`, and Tab
wrapped past it permanently after one pass. That is a keyboard trap, not a
cosmetic gap.

**There is no `useReducedMotion()` here, and that is correct** —
`MotionConfig reducedMotion="user"` drops the `y` and keeps the fade, which is
what a dialog wants. Do not add a manual branch.

`CoachProfileModal` (Home → "Read More") adds **no motion of its own** — it
passes `hideHeader`, `panelClassName="p-0"` and a footer override into this
chassis.

---

## 1.9 `BlockedHint` — the "why is this inert" tip

**Where** `src/components/consumer/BlockedHint.tsx`. **No animation at all, on
purpose, and the absence is the specification.**

It renders `<span role="tooltip" hidden={!open}>`. `hidden` gives
`display: none`, so nothing needs `inert`. **An opacity fade would leave the tip
in the accessibility tree** — the same class of defect as animating `height: 0`
and calling it concealment.

Two behaviours to preserve if you rebuild it: it opens on `mouseenter`,
`focusin` **and** `click` (there is no hover on a phone, and a touch on an
`aria-disabled` button still fires a real `click`); and two ways it can stick
open are both closed — an effect resets `open` when `reason` clears, and an
outside `pointerdown` listener is attached only while open.

---

# §2 The welcome flow

`src/components/consumer/ConsumerWelcome.tsx` (1,156 lines). Four screens on one
horizontal track. Seven separate animations, all measured live at 1281×900.

The flow's state machine — what each screen says, what persists, where focus goes
— is in `orchestration-flows.md` §1.

## 2.1 The sleeping pillow — three layers on three clocks

**Where** `ConsumerWelcome.tsx:106-118` (constants), `:736-790` (the layers);
the "z" constants are shared from `ConsumerCanvasWave.tsx:236-243`.

The reason this does not read as one image pulsing is that the three layers are
on **different periods**, and **only the body may scale**.

**(measured, sampled at 180ms over 7s):**

| Layer | Property | Peak measured | Authored | Period measured |
|---|---|---|---|---|
| `pillow-body.svg` | `scale` | **1.0180** | 1.018 | peaks at 2361 and 6347ms → **3986ms ≈ 4.0s** ✅ |
| `pillow-face.svg` | `y` | **−1.200px** | −1.2 | the same 4.0s clock, in phase with the body |
| `pillow-brows.svg` | `y` | **−3.85px** (sampling missed the true peak) | −4 | 7.0s; the move occupies 15% of the loop |
| `z-small/medium/large.svg` | `y` +4 → −8, `opacity` 0→1→1→0 | as authored | — | **3.6s**, offsets 0 / 0.45 / 0.90s (measured gaps 362 and 543ms, mean 0.45) ✅ |

Re-measured for this document at the same viewport: body `scale` peaked at
**1.01800** with a half-period of 2001ms → **4.002s** ✅.

```tsx
// ConsumerWelcome.tsx:106
const BREATH_S = 4
const BROW_S = 7

// :750 — BODY. transformOrigin is the load-bearing part.
style={{ ...LAYER_STYLE, transformOrigin: 'center bottom' }}
animate={reduceMotion ? undefined : { scale: [1, 1.018, 1] }}
transition={{ duration: BREATH_S, repeat: Infinity, ease: 'easeInOut' }}

// FACE — rides the breath at LESS travel than the surface it is printed on
animate={reduceMotion ? undefined : { y: [0, -1.2, 0] }}
transition={{ duration: BREATH_S, repeat: Infinity, ease: 'easeInOut' }}

// BROWS — a different clock, and the move occupies 15% of it
animate={reduceMotion ? undefined : { y: [0, 0, -4, -1, 0] }}
transition={{ duration: BROW_S, repeat: Infinity, times: [0, 0.5, 0.58, 0.65, 1], ease: 'easeInOut' }}
```

```ts
// ConsumerCanvasWave.tsx:236 — shared with Home's napping mascot (§10.2)
export const Z_LAYERS = [
  { src: 'z-small', delay: 0 }, { src: 'z-medium', delay: 0.45 }, { src: 'z-large', delay: 0.9 },
]
export const Z_PATH    = { y: [4, 0, -3, -8], opacity: [0, 1, 1, 0] }
export const Z_TIMES   = [0, 0.18, 0.62, 1]
export const Z_CYCLE_S = 3.6
```

**⚠️ Only the body may `scale` or `rotate`.** Every other layer spans the whole
210.646 × 188 export box, so a scale or rotation applied to a *layer* pivots
about the box's centre rather than the feature's own — a scaled brow visibly
slides sideways. Translation is origin-independent; use it. This is the single
rule that decides whether a rebuild of this piece works.

**Why the face moves less than the body.** That difference is what makes it read
as printed on a stretching object rather than as a second object moving
alongside. Match the travels and the illusion goes.

**Why the brows are on 7s and not 4s.** Put them on the breath and the face
pumps. Still for most of a long loop, then one twitch, is what reads as a
sleeping face.

**⚠️ `LAYER_STYLE` carries `maxWidth: 'none'` (`:109`), and it is not
defensive.** Tailwind preflight sets `img { max-width: 100% }`, which silently
clamped this 210.646px export to its 207.645px box and compressed the pillow
horizontally.

**The mobile size is a `transform: scale(0.827)` on a box that reserves the
scaled size (`:740`), not a width change.** The layers are absolutely positioned
in the export's coordinate space and the "z"s sit at fixed offsets a width change
would break. `origin-bottom` keeps it on the same baseline.

**The z's animate `y`/`opacity` only and fade in place.** A drifting arc was
built on instruction and removed on the next one; recorded so it is not
re-proposed.

---

## 2.2 The travelling track — the four screens

**Where** `ConsumerWelcome.tsx:235` (`readGeom`), `:499` (lazy state), `:556`
(`trackMotion`), `:587-611` (the two motion values), `:596` (the rail).

**(measured, 1281px)** `--stride` = **1281px** (= the viewport), `--text-w` =
**688.5px**. Track `x` at rest **−640.5**; one press runs it to **−1921.5**
(exactly one stride) and it is there by **1821ms**. **(authored)** 1.8s /
`EASE_TRAVEL`. ✅

```tsx
// :311
const TEXT_LAG_S = 0.05
const RAIL_PARALLAX = 0.95

// :556 — ⚠️ A TWEEN, not a spring.
const trackMotion = useMemo(
  () => (reduceMotion || !wide ? { duration: 0 } : { duration: 1.8, ease: [0.37, 0, 0.63, 1] as const }),
  [reduceMotion, wide],
)

// :587 — seeded at the resting target, then animated imperatively
const trackX = useMotionValue(trackTarget)
useEffect(() => {
  const controls = animate(trackX, trackTarget, trackMotion)
  return () => controls.stop()
}, [trackX, trackTarget, trackMotion])

// :602 — the text reaches the same target TEXT_LAG_S later
const textX = useMotionValue(trackTarget)
useEffect(() => {
  const controls = animate(textX, trackTarget,
    wide && !reduceMotion ? { ...trackMotion, delay: TEXT_LAG_S } : trackMotion)
  return () => controls.stop()
}, [textX, trackTarget, trackMotion, wide, reduceMotion])
// :611 — applied as the DIFFERENCE, because the cells live inside the track's transform
const textOffset = useTransform([trackX, textX], ([t, x]: number[]) => x - t)

// :596 — the rail gradient, AGAINST the travel
const railShift = useTransform(trackX, (v) => `${-v * RAIL_PARALLAX}px`)
```

**⚠️ It is a tween, not a spring, and this was learned the expensive way.** Three
rounds of lengthening a spring's duration (0.8 → 1.15 → 1.6 → 2.2s) failed to fix
"too fast", because a spring front-loads: it covers most of the distance in an
early burst then creeps. **If a spring is ever wanted back, lower the
`stiffness`, not the duration.**

**⚠️ `useMotionValue` seeded at the resting target, not `animate={{ x }}`.** A
motion element with `animate` and no `initial` starts from the DOM's own
`transform: none` (x = 0) and tweens to the target — **measured running 0 →
−640.5 over the full 1.8s on every mount**, so the screen slid into place every
time you arrived. Seeding the value fixes that *and* buys the read access the
parallax and the cell fades need.

**⚠️ `readGeom` is a lazy initialiser (`:499`), not a constant corrected in an
effect.** Correcting it in an effect is a state change, and the track animates on
state change — so the screen slid 200px sideways on first paint.

**⚠️ The stride is at least the viewport, not the frames' flat 857 (`:236`).** A
travelling rail can only live in the gap between two steps, and that gap
(`stride − textW`) only covers the space either side of a centred block
(`vw − textW`) when `stride >= vw`.

**`TEXT_LAG_S` is a distance, not a duration.** The gap on screen is the delay ×
the *current* velocity. **(measured)** peak lead **56.3px at t = 912ms**,
mid-travel. The source comment predicts "nearer 70px"; **56px is what ships.**
0.12s was tried and measured at ~170px, which was reported as too much. **To tune
the visible gap, change this value and re-measure the lead — do not compute it.**

**The rail parallax. (measured)** `backgroundPositionX` runs 608.475px →
1825.43px = **+1216.96px** against a track travel of −1281px. 1281 × 0.95 =
1216.95 ✅. So the gradient's *apparent* speed is 1281 − 1216.96 = **64px across
the whole 1281px travel (5%)**.

**⚠️ Higher `RAIL_PARALLAX` is calmer, which is the counter-intuitive part.**
Apparent speed is `1 − RAIL_PARALLAX`. 0.85 left the gradient running at 15% of a
1281px travel and was reported as "too fast"; 0.95 drops it to 5%. **Not 1.0** —
a full cancel pins the gradient in the viewport, and a stroke perfectly still
while everything else moves reads as a rendering fault rather than as depth.

**Two details that make the parallax work at all.** `backgroundSize:
'600px 100%'` sets the repeat period; without it the shift drags one stretched
sweep. And `railShift` returns a **string** — framer appends `px` only for
properties it knows, and `backgroundPositionX` is not one of them. The gradient's
two ends are both purple, so tiles abut purple-to-purple and the seam is
invisible, which is what lets the shift run unbounded.

---

## 2.3 Cell fade — driven by position, not by a timer

**Where** `ConsumerWelcome.tsx:381-382` (constants), `:407-424`.

**(measured)** the outgoing cell holds `opacity 1` until ~506ms and is 0 by
~1113ms; the incoming cell starts at ~912ms and is 1 by ~1416ms. They cross at
~950ms at roughly **0.27 each** — exactly what `FADE_GONE = 0.62` predicts.

```tsx
// :381
const FADE_FULL = 0.18
const FADE_GONE = 0.62

// :407
const travelOpacity = useTransform(textX, (v) => {
  const d = Math.abs(v + (index + 0.5) * stride) / stride   // distance from screen centre, in strides
  return Math.max(0, Math.min(1, (FADE_GONE - d) / (FADE_GONE - FADE_FULL)))
})

// :413 — below 1200px there is no travel to map to, so a timer takes over
style={wide ? { opacity: travelOpacity, x: offsetX } : undefined}
animate={wide ? undefined : { opacity: active ? 1 : 0 }}
transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
```

**⚠️ Map the fade to `textX`, the block's own position — not to `trackX`.** The
two are off-timed by `TEXT_LAG_S`, so they disagree mid-travel, and a fade that
describes the text has to follow the text or the words start fading before they
have begun to move.

**⚠️ `FADE_GONE` is past 0.5 on purpose.** The steps are exactly one stride
apart, so a band closing at 0.5 puts *both* neighbours at zero at the halfway
point and the screen goes blank for a beat. **Lowering this below 0.5 to "tidy"
it reintroduces that.**

**Below 1200px the slide is deliberately gone**, on direct instruction: *"on
tablet and mobile, no slide in motion, when I click continue, just ease fadein
and show"*.

**All four steps stay mounted so the rail can span them, so the three that are
not current must be `inert`** (`:418`). Advancing makes the step carrying the
just-clicked button `inert`, and an inert element cannot hold focus, so the focus
move at `:470` is mandatory rather than polish:

```tsx
// :469 — a plain useEffect is CORRECT here, unusually, because all four headings
// stay mounted and nothing races. Compare §11 Trap 2.
useEffect(() => { headingRefs.current[step]?.focus({ preventScroll: true }) }, [step])
```

`preventScroll` keeps the artwork in frame.

---

## 2.4 Pagination dots

**Where** `ConsumerWelcome.tsx:1145`. A CSS width/colour transition, 300ms
`ease-out`, with `motion-reduce:transition-none`.

`aria-hidden` on the `<ol>`, with position carried by an `sr-only
aria-live="polite"` "Step N of M". **These are indicators, not buttons** — Go
back and Continue already move between screens, and a dot that jumps forward is a
Skip by another name. Do not make them interactive.

---

## 2.5 The handoff into Home

**Where** `ConsumerWelcome.tsx:444-445,542-546,616-619`; the other half is
`ConsumerShell.tsx:313-318,338`.

**(measured)** section `opacity` 1 → 0.80 → 0.57 → 0.40 → 0.25 → 0.11 → 0.03,
gone by **~420ms**; Home and the tour are both mounted at the next sample,
**470ms**.

```tsx
// :444
const EXIT_MS = 420
const EXIT_REDUCED_MS = 180

// :542 — guarded against a second press: the CTA stays on screen during the fade
const leave = useCallback(() => {
  setExiting((already) => {
    if (already) return already
    window.setTimeout(onContinue, reduceMotion ? EXIT_REDUCED_MS : EXIT_MS)
    return true
  })
}, [onContinue, reduceMotion])

// :616
animate={{ opacity: exiting ? 0 : 1 }}
transition={{ duration: exiting ? (reduceMotion ? EXIT_REDUCED_MS : EXIT_MS) / 1000 : 0, ease: 'easeOut' }}
```

**Why the fade exists.** Without it the screen was swapped inside a single frame
— the flag flipped, the section unmounted, and Home ran its own 0.3s entrance
with nothing having left, reported as Home showing up *"almost instantly"*.
Fading this out first turns the changeover into one continuous dissolve through
the canvas.

**The `setTimeout` and the animation duration are two copies of one number.**
They are not linked in code. If you change `EXIT_MS` both move together only
because they read the same constant — keep it that way.

**Reduced motion gets the same cross-fade, shorter (180ms), not zero.** The
preference asks for *movement* to go away, not for state changes to become
instantaneous, and an opacity fade carries no motion vector. **This is the best
single example of the portal's reduced-motion philosophy — copy the reasoning,
not just the number.**

The shell's half, and both details are load-bearing:

```tsx
// ConsumerShell.tsx:313
const dismissWelcome = useCallback(() => {
  welcomeDismissed = true
  setWelcomed(true)
  navigate(`/consumer/${dyadId}`, { replace: true })   // ⚠️ NAME the destination
  openConsumerOnboarding()
}, [navigate, dyadId])

// :338 — ⚠️ `&& !tourOpen`, measured, not assumed
useEffect(() => {
  if (welcomed && !tourOpen) document.getElementById('main-content')?.focus({ preventScroll: true })
}, [welcomed, tourOpen])
```

**Why the destination is named.** Flipping a flag alone only *uncovers* whatever
page the reader entered on. The welcome renders over every consumer surface, so
arriving on `/help` and finishing left you on Help having just been told "welcome
to your dashboard".

**Why `&& !tourOpen`.** The handover both opens the tour and flips `welcomed`, so
this effect ran a commit **after** the modal had focused its own heading, and
pulled focus back out to `<main>`. The tour then opened with `activeElement`
outside its own dialog: Tab reached the page behind the dim and Escape did
nothing.

---

# §3 The first-run tour

**Where** `src/components/consumer/ConsumerOnboardingTour.tsx`. Five screens, no
spotlight. Opened by the welcome handoff and by nothing else.

**(measured)** panel exactly **577 × 716** at `top: 92`, constant on all five
steps. Backdrop `oklab(0 0 0 / 0.25)`. Copy and image cross-fade **out over
186ms, in over 187ms** (~373ms per step). Dot width 8 → 24px over 300ms
`ease-out`. Focus lands on the incoming `<h2>` at the swap (`activeElement` =
`H2:"Your tasks for today"`). ✅ all match the authored values.

| Element | Property | From | To | Duration | Easing |
|---|---|---|---|---|---|
| backdrop (`:244`) | `opacity` | 0 | 1 | 0.15s | linear |
| panel (`:257`) | `opacity`, `y` | 0, 8px | 1, 0 | 0.2s | `easeOut`; exit is opacity only |
| copy block (`:356`) | `opacity` | 0 | 1 | 0.18s each way | `easeOut`, `mode="wait"` |
| screenshot (`:415`) | `opacity` | 0 | 1 | 0.18s each way | `easeOut`, `mode="wait"` |
| active dot (`:464`) | `width` | 8px | 24px | 0.3s | `ease-out` (CSS) |

**The panel chrome is the §1.8 modal signature, verbatim.** Only the four items
below are specific to the tour.

**1. One fixed size for all five screens (`:298`).**

```tsx
className="… flex h-[716px] max-h-[calc(100dvh-96px)] w-full max-w-[577px] flex-col
           items-center overflow-hidden rounded-[24px] bg-white p-5 sm:max-h-[calc(100dvh-48px)] sm:p-10"
```

The box must not resize under the reader as they advance. This is also why the
screenshot sits in an `aspectRatio: '497 / 343'` box (`:412`): the five PNGs
cross-fade inside it, and a replacement at a different ratio reintroduces the
reflow.

**2. Two separate `AnimatePresence mode="wait"` blocks, not one.** The copy
(`:355`) and the picture (`:414`) swap independently, each keyed on its own value
— the copy on `step`, the image on `current.image`. `mode="wait"` on the copy is
the point: **a cross-fade of two different sentences in the same box reads as a
smear**, so the outgoing copy must be gone before the incoming arrives.

**3. The focus callback ref (`:210`) — copy this verbatim.**

```tsx
// ⚠️ A CALLBACK REF, not a useEffect keyed on `step`.
const focusedStep = useRef<number | null>(null)
const headingRef = useCallback((node: HTMLHeadingElement | null) => {
  if (!node || focusedStep.current === step) return
  focusedStep.current = step
  node.focus({ preventScroll: true })
}, [step])
```

Screens cross-fade under `mode="wait"`, so the incoming heading mounts a commit
**later** than the step change. An effect keyed on `step` runs while the outgoing
screen is still the only thing in the tree: it focuses the heading on its way
out, never runs again, and **every transition lands on `<body>`**. A callback ref
is keyed on the **element**, which cannot exist too early. `focusedStep` stops a
re-render of the same screen stealing focus back off whatever the reader has
since tabbed to. §11 Trap 2.

**4. The dots sit outside the scrolling region (`:464`)**, so their `y` is
constant on all five screens and they cannot be scrolled away.

**Closing.** Skip, "Start my journey", Escape or a backdrop click all exit on
opacity only. **There is deliberately no focus-restore to an opener**, and a
comment that claimed otherwise was corrected: the opener is the welcome's final
CTA, which has unmounted by the time the tour is visible. `ConsumerShell.tsx:286`
lands focus on `#main-content` instead. **(measured after Skip)**
`activeElement.id === 'main-content'`, `documentElement.style.overflow === ''`,
no dialog in the DOM. ✅

**Also gated on the tour:** `ScrollCue` is not mounted while it is open
(`ConsumerShell.tsx:483`, `showScrollCue && !tourOpen`). The tour locks the page,
so a cue inviting a scroll that cannot happen is an affordance that does nothing
— and it sits exactly where the modal's footer is.

**Reduced motion** the panel fades with no `y`; copy and image swap instantly
(`duration: 0`); the dots lose their transition via `motion-reduce:transition-none`.

---

# §4 Home

Home's own motion is: the awake mascot (§10), `ConsumerContentReveal` (§1.2),
`ScrollCue` (§1.7), and the session-plan strip below.

`LearningTaskCard`, `CoachCard`, `ConsumerWaveRule`, `ConsumerFooter` and
`SessionFeedbackBanner` have **no animation at all** — `ConsumerWaveRule` is two
static `<img>` exports (one per breakpoint), and the cards carry only
`transition-colors` / `transition-opacity` hover states.

## 4.1 `SessionPlanStrip` — a measured carousel, not an animated one

**Where** `src/components/consumer/SessionPlanStrip.tsx:309-457`.

**(measured, 1281px)** `scrollWidth === clientWidth === 1055` → not overflowing →
chevrons and dots hidden entirely.
**(measured, 834px)** `scrollWidth 2024 / clientWidth 608`, 6 cells, and on
arrival `scrollLeft` is already **878** with the **4th** dot active — the strip
auto-centred on the next session without any page scroll. Dots 10px idle / 24px
active.

**There is no framer-motion in this file, and that is deliberate.** Everything is
`scrollLeft` writes plus one CSS transition on the dots. The strip has to land
exactly on a cell, and a spring cannot promise that.

```tsx
// :309 — ⚠️ rect-relative, NEVER offsetLeft
const centreOn = useCallback((cell: HTMLElement) => {
  const scroller = scrollerRef.current
  if (!scroller) return
  if (scroller.scrollWidth <= scroller.clientWidth) return   // already fits (desktop)
  const delta = cell.getBoundingClientRect().left - scroller.getBoundingClientRect().left
  const centring = (scroller.clientWidth - cell.offsetWidth) / 2
  scroller.scrollLeft = Math.max(0, scroller.scrollLeft + delta - centring)
}, [])

// :435 — every callback ALSO schedules a verification a beat later
const observer = new ResizeObserver(() => {
  if (!userScrolledRef.current) centreOnNext()
  syncScrollState()
  clearTimeout(settleTimer)
  settleTimer = setTimeout(() => { verifyCentred(); syncScrollState() }, 250)
})
observer.observe(scroller)
observer.observe(row)
const firstCell = row.querySelector('li')
if (firstCell) observer.observe(firstCell)
```

**⚠️ `offsetLeft` is the wrong measurement and it fails quietly.** It is measured
from the nearest *positioned* ancestor, which is not this scroller, so it
silently carries some other element's offset — measured 27.5px out at 375px.

**⚠️ A `useEffect` alone centres against the wrong geometry.** Measured, it fires
while the row still has its previous widths and leaves the card **122px off
centre**. The maths is right, the moment is wrong. A `ResizeObserver` is keyed on
the layout actually settling, which covers first paint, webfont swap and every
breakpoint change with one mechanism instead of three guesses at a delay.

**⚠️ One observer callback is still not enough, and this is measured.** Coming
from 820 to 375 the observer ran while the scroller was 271.5px wide, centred
correctly against that, and the box then settled at 293 — leaving the card a
consistent 10.75px off with **no further callback**. Hence the 250ms
verification, which re-centres only if it is off by more than 2px.

**⚠️ Observe the first cell as well as the scroller and the row.** The *cells'*
width is what changes at a breakpoint while the scroller's box may not, so the
row alone can miss it.

**Why real input events, not `scroll`, mark the user as in control.** Our own
`scrollLeft` write fires `scroll`, so tracking `scroll` cannot distinguish us
from a gesture — that is what forced the flag-and-rAF dance that dropped focus
mid-Tab in an earlier carousel in this project. `wheel`, `touchstart`,
`pointerdown` and `keydown` cannot be produced by a programmatic write.

The chevrons (`:360`) and dots (`:374`) use `behavior: 'smooth'` and **set
`userScrolledRef` on press**, so a later width change cannot yank the row back
under the reader's hands. Both are **unguarded for reduced motion** (§11 Trap 5).

---

# §5 My Modules and a module's inner pages

## 5.0 `My Modules` (`/learning`) and `LessonCards`

**No framer-motion in this file at all.** The only motion is a CSS border-colour
change on the desktop cover tile, driven by a `:has()` selector so the *tile*
reacts to the *button* being hovered or focused:

```tsx
className="… border-[3px] border-hairline transition-colors
           group-has-[button:hover]:border-consumer-primary
           group-has-[button:focus-visible]:border-consumer-primary lg:block"
```

The page contributes the hero mascot (§10, with `withPencil`) and
`ConsumerContentReveal`.

---

## 5.1 The module stage machine

**Where** `src/pages/consumer/ConsumerModulePage.tsx:1406` (variants), `:1484`
(the `AnimatePresence`), `:1313` (focus).
**Stages** `welcome → video → summary → reflection → done`.

**(measured)** press Continue at t=0 → outgoing stage fades out over **~200ms** →
the incoming heading is in the DOM at ~230ms with `opacity 0 /
translateY(7.99px)` → settles `opacity 1 / none` at **~598ms**. **(authored)**
exit 0.2s, enter 0.35s `EASE_STANDARD`. ✅

```tsx
// :1406
const stageMotion = reduceMotion ? {} : {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

// :1484 — ⚠️ NO `initial={false}` here, deliberately
<AnimatePresence mode="wait">
  {stage === 'welcome' && <motion.div key="welcome" className="flex flex-1 flex-col" {...stageMotion}>…</motion.div>}
  {/* video :1492 · summary :1498 · done :1504 · reflection :1514 */}
</AnimatePresence>
```

**Why there is no `initial={false}` here, and why the diary has one.**
`ConsumerShell` holds a module-scoped `pageIntroPlayed` latch that suppresses
`<main>`'s entrance after the first render of the session (§1.1) — correct for
tabs, wrong for a module, which is a place you *enter* from a Play control.
Arriving with no movement reads as a page that failed to transition. So the
entrance is owned by this page rather than by unwinding the shell's latch, which
would bring the flicker back on all four tabs.

**That absence is also what keeps the completion badge's infinite loop alive**
(§5.6). §11 Trap 1.

**Focus is on a callback ref (`:1313`)** for the `mode="wait"` reason. An effect
keyed on `stage` was built first and measured dropping focus to `<body>` on every
change. `advance`/`retreat` also call `window.scrollTo({top: 0, behavior:
'instant'})`, because heading focus uses `preventScroll`.

**Reduced motion** `stageMotion` becomes `{}` — the stage simply swaps, with no
fade at all. Note this is a *different* choice from the welcome screen's (§2.5),
which keeps a shortened fade. Both are defensible; §11 Trap 11.

---

## 5.2 Direction-aware chrome — the yellow bar and the white footer

**This is the least obvious animation in the portal and the one most likely to be
rebuilt wrong.**

**Where** `useScrollChrome` at `ConsumerModulePage.tsx:156`; the yellow bar at
`:248-266`; the white footer at `ConsumerFlowFooter.tsx:139-150`;
`CHROME_TRANSITION` at `ConsumerFlowFooter.tsx:63`.

**The rules, in priority order:**

| Condition | Bar | Footer |
|---|---|---|
| page does not scroll (`max <= 4`) | in | in |
| at the top (`y <= 4`) | in | out |
| at the bottom (`y >= max - 4`) | out | in |
| travelled ≥ 8px **up** since the last flip | in | out |
| travelled ≥ 8px **down** since the last flip | out | in |
| `prefers-reduced-motion` | **in, permanently** | **in, permanently** |

**(measured, live, 834×900, on the video stage):**

```
start (y=0, max=380)   bar in   footer in   ← both visible on arrival, by the reset below
scrollBy(+5)  y=5      bar in   footer in   ← under the 8px threshold: no flip
scrollBy(+10) y=15     bar OUT  footer in   ← flipped; translate caught mid-transition
                                               at `calc(-81.1447% - 77.8989px)`
scrollBy(+300) y=315   bar out  footer in   ← at rest: `calc(-100% - 96px)`
scrollBy(-5)  y=310    bar out  footer in   ← under threshold: no flip
scrollBy(-20) y=290    bar IN   footer OUT  ← flipped; footer at `0px 100%`
scrollTo(bottom)       bar out  footer in   ← the END rule, not the direction rule
scrollTo(top)          bar in   footer out
```

```tsx
// ConsumerModulePage.tsx:156 — the shape of the hook
const DIRECTION_THRESHOLD = 8
const EDGE_EPSILON = 4              // "within this of an end" counts as at that end

useEffect(() => {
  setChrome({ bar: true, footer: true })   // every stage STARTS with both visible
  if (reduceMotion) return                 // hiding them IS the animation

  let last = window.scrollY
  let anchor = window.scrollY              // NOT state — see below

  const read = () => {
    const y = window.scrollY
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (max <= EDGE_EPSILON)     { setChrome({ bar: true,  footer: true  }); last = y; anchor = y; return }
    if (y <= EDGE_EPSILON)       { setChrome({ bar: true,  footer: false }); last = y; anchor = y; return }
    if (y >= max - EDGE_EPSILON) { setChrome({ bar: false, footer: true  }); last = y; anchor = y; return }
    if ((y > last && y < anchor) || (y < last && y > anchor)) anchor = last
    const travel = y - anchor
    if (Math.abs(travel) >= DIRECTION_THRESHOLD) {
      setChrome(travel > 0 ? { bar: false, footer: true } : { bar: true, footer: false })
      anchor = y
    }
    last = y
  }

  window.addEventListener('scroll', read, { passive: true })
  window.addEventListener('resize', read)   // a resize can stop a page scrolling, with no scroll event
  return () => { /* remove both */ }
}, [reduceMotion, stage])
```

```tsx
// ConsumerFlowFooter.tsx:63 — ⚠️ the property is `translate`, not `transform`
export const CHROME_TRANSITION = 'translate 220ms cubic-bezier(0.4, 0, 0.2, 1)'

// ConsumerModulePage.tsx:254 — the yellow bar
data-module-bar=""
className={cn('sticky top-[var(--consumer-chrome-h)] z-20 … bg-yellow-200',
              shown ? 'translate-y-0' : '-translate-y-[calc(100%+96px)]')}
style={{ filter: 'drop-shadow(2px 4px 8px rgba(230,194,127,0.2))', transition: CHROME_TRANSITION }}

// ConsumerFlowFooter.tsx:142 — the white footer
className={cn('sticky bottom-0 z-20 … bg-white', shown ? 'translate-y-0' : 'translate-y-full')}
```

**`sticky` + `translate`, never `fixed`.** `fixed` takes the bands out of flow, so
the content underneath needs top and bottom padding equal to two heights that
change with the viewport — a measurement to keep in sync, which is how spacing
drifts. `sticky` keeps each band's original slot reserved and only overlays while
stuck, so hiding one is a transform and nothing else moves. The footer's natural
slot is the end of the content, which is exactly where it should be when you
arrive there.

**⚠️ `last` and `anchor` are locals, not state.** They are read and written on
every scroll event and nothing re-renders off them. State here re-renders the
page at scroll frequency to compute two booleans.

**Why `anchor` exists at all, separate from `last`.** It marks where the *current
run* started, so the threshold measures travel since the last flip rather than
since the last event. Without it a slow drag never accumulates 8px in one step
and never flips.

**Why every stage resets to both-visible.** Deriving the arrival state from the
scroll position would hide the footer on a screen the reader has not scrolled
yet, so they land on a page whose only way forward is off-screen.

**⚠️ The two end rules are not the direction rules restated.** You can arrive at
the bottom while scrolling down and then rubber-band, and without them the footer
flicks away at the moment you reach the thing it offers.

**⚠️ `-100% - 96px`, not `-100%`.** Sliding the bar only its own height leaves it
parked *behind* the global header but still inside the viewport, so its drop
shadow bleeds out from under the white bar.

**⚠️ `aria-hidden` is deliberately NOT set on the hidden bar.** It holds the only
Go home control, and a screen-reader user has no scroll direction to restore it
with. It stays in the accessibility tree and the tab order at all times; only its
paint moves.

`--consumer-chrome-h` (the bar's sticky offset) is written by a `ResizeObserver`
on the real `<header>` at `ConsumerHeader.tsx:519` — §11 Trap 4.

---

## 5.3 Chapter carousel (video stage), the transcript, and the one guarded scroll

**Where** `ConsumerModulePage.tsx:560` (the nudge), `:804-812`
(`scrollToResourceCard`).

```tsx
// :560
const CHAPTER_STEP = (180 + 16) * 2   // two thumbnails plus their gaps
scroller.current?.scrollBy({ left: dir * CHAPTER_STEP, behavior: 'smooth' })
```

**A `ResizeObserver` as well as the scroll listener**: the row's overflow depends
on the container's width, so a resize can move it from "scrollable" to "not"
without any scroll event firing.

**⚠️ Both chevrons stay mounted at the ends and go `aria-disabled` rather than
disappearing. This is not a style preference.** A carousel chevron that unmounts
when it reaches an end drops keyboard focus to `<body>` mid-press; a control that
never unmounts cannot. `aria-disabled` rather than the `disabled` attribute keeps
the tab stop.

**`pb-2 -mb-2` on the scroller buys back the room a focus ring needs** —
`overflow-x: auto` clips vertically too, per spec.

**`EpisodePanel` (the transcript) has no animation.** Its top and bottom feather
is a static `mask-image` gradient, and the source is explicit that it is *paint,
not concealment* — the rows underneath stay scrollable, focusable and in the
accessibility tree.

**The "jump to the take-home guide" link is the one smooth scroll in the portal
that honours the preference. Copy this to the other five (§11 Trap 5):**

```tsx
// :804
const bar = document.querySelector('[data-module-bar]')
// The bar's height is MEASURED, not a fixed offset, so this stays right if its
// padding or copy changes.
const clearance = (bar ? bar.getBoundingClientRect().height : 0) + 88
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
window.scrollTo({
  top: Math.max(0, card.getBoundingClientRect().top + window.scrollY - clearance),
  behavior: reduce ? 'auto' : 'smooth',
})
card.focus({ preventScroll: true })   // a real skip-link, not a mouse-only convenience
```

**Not an `<a href="#…">`**: the app is on a `HashRouter`, and a fragment link
rewrites `location.hash`, which the router then tries to match as a route.

---

## 5.4 Summary flip cards

**Where** `src/components/consumer/ModuleSummaryCards.tsx:699-710` (the flip),
`:257,262,452,455` (the two faces), `:194,240,310` (the pillow hover).

**(measured)** `perspective: 1600px` on the `<li>`; inner grid `transform 0.5s
cubic-bezier(0.4,0,0.2,1)` with `transform-style: preserve-3d`. On click
`rotateY` runs 0 → 1.91° (51ms) → 15.3° (102) → 66° (153) → 104° (204) → 135°
(255) → 155° (306) → 167° (357) → 174.7° (408) → 178.6° (460) → **180° at
511ms**. The front becomes `inert` **in the same frame as the click**, and
`document.activeElement` moves from the front `<button>` to the back's title
`<p>`. ✅

```tsx
// :699 — perspective on the OUTER box, not the rotating one
<li className="[perspective:1600px]">
  <div className={cn('grid h-full [transform-style:preserve-3d]',
                     !reduceMotion && 'transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]')}
       style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}>
    {/* front :257 */} className="… [backface-visibility:hidden]"            inert={hidden}
    {/* back  :452 */} className="… [backface-visibility:hidden] [transform:rotateY(180deg)]" inert={hidden}
  </div>
</li>
```

**⚠️ `perspective` goes on the outer box, never on the element that rotates.**
Applied to the rotating element the vanishing point travels with it, and the card
reads as a flat image spinning rather than an object turning over.

**⚠️ Both faces share one grid cell** (`grid` + `col-start-1 row-start-1`), so
the card is as tall as its taller face and **nothing reflows when it turns**. The
obvious alternative — front in flow, back `absolute inset-0` — sizes the card to
the front alone, and these backs are taller.

**⚠️ `inert` takes a boolean in React 19, and `inert=""` is falsy there.** A
first pass wrote the React 18 form (`inert={hidden ? '' : undefined}` with a
`@ts-expect-error`) and the attribute silently never reached the DOM — every
hidden back's controls were tabbable. `backface-visibility` hides a face
*visually only*; it does nothing for focus or the accessibility tree.

**The focus effect is guarded on the previous value, not on a latch:**

```tsx
// :692
const prevFlipped = useRef(flipped)
useEffect(() => {
  if (prevFlipped.current === flipped) return
  prevFlipped.current = flipped
  ;(flipped ? backTitleRef.current : frontRef.current)?.focus({ preventScroll: true })
}, [flipped])
```

The latch version measured wrong: **StrictMode mounts effects twice** — run one
set the latch and returned, run two saw it already set and focused the front
button of every card in turn, last one winning. So *arriving* on the Summary
screen put focus on the last card instead of the page heading.

**Reduced motion** the transition class is dropped, so the card **snaps** to its
other face. The rotation still happens — that is what `backface-visibility` needs
in order to swap which side is painted — it is just not animated. Shortening the
turn instead would still be a turn, and the turn is the thing the preference is
about.

### The pillow hover raise (front face only)

**(measured)** dispatching a real `mouseover` takes the SVG's scale **1 → 1.07**
and `mouseout` returns it. ✅

```tsx
// :194
const PILLOW_HOVER_SCALE = 1.07
// :240 — driven from React state, NOT a CSS :hover
const scale = !reduceMotion && raised ? PILLOW_HOVER_SCALE : 1
// :310
style={{ transform: `rotate(${pillow.rotate}deg) skewX(${PILLOW_SKEW}deg) scale(${scale})`,
         transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)' }}
```

**⚠️ Driven from React state deliberately.** A first pass set a custom property
with `motion-safe:hover:[--pillow-hover:1.07]` and Tailwind emitted **no rule at
all** for it — verified by walking every stylesheet for the property name and
finding zero matches, while the class sat in the DOM and setting the variable by
hand worked. §11 Trap 9.

It is set from `onMouseEnter`/`onMouseLeave` **and** `onFocus`/`onBlur`, so the
raise is not mouse-only.

Also inside the card back: a sticky "Scroll to see more" button (`aria-hidden`,
`tabIndex={-1}`, pointer-only) calling `el.scrollBy({ …, behavior: 'smooth' })`
at `:634` — unguarded for reduced motion.

---

## 5.5 The reflection card — the portal's most orchestrated transition

**Where** `src/components/consumer/ModuleReflection.tsx:349` (`stepVariants`),
`:368` (`riseVariants`), `:429` (the `AnimatePresence`), `:197-215` (the tick).

Five questions plus a live review screen. **The same motion vocabulary as the
sleep diary's stepper (§6.2) — deliberately, and byte for byte.**

**(measured end to end, press Next at t = 0):**

| t (ms) | What |
|---|---|
| 0 | outgoing block at `opacity 1, x 0` |
| 108 | `opacity 0.63, x −23.7` |
| 208 | `opacity 0, x −64` — **exit complete (180ms, `easeIn`)** |
| ~330 | `mode="wait"` swaps the key; incoming block at `x +57.7`, children at `opacity 0, y 16` |
| 408 | incoming `opacity 0.51, x +35.9` |
| 608 | `opacity 1, x +0.71` |
| **707** | parent settles (`transform: none`) — spring 320/32 |
| **758** | **children begin** (`opacity 0.14, y 14.7`) |
| 1008 | children `opacity 1, y 0.005` |
| **1057** | fully at rest |

```tsx
// :345 — `custom` carries direction so the EXITING step reads it at exit time,
// not the value it mounted with. `lastIndex` is a REF, not state: it is read
// during the same render the new index arrives in.
const lastIndex = useRef(index)
const direction = index >= lastIndex.current ? 1 : -1
lastIndex.current = index

// :349
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: reduceMotion ? 0 : 64 * dir }),
  center: { opacity: 1, x: 0, transition: {
    x: { type: 'spring' as const, stiffness: 320, damping: 32 },
    opacity: { duration: 0.25 },
    when: 'beforeChildren' as const,
    staggerChildren: reduceMotion ? 0 : 0.07,
  } },
  exit: (dir: number) => ({ opacity: 0, x: reduceMotion ? 0 : -64 * dir,
    transition: { duration: 0.18, ease: 'easeIn' as const } }),
}
// :368
const riseVariants = {
  enter:  { opacity: 0, y: reduceMotion ? 0 : 16 },
  center: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 34 } },
  exit:   { opacity: 0 },
}
// :429 — the clip box around it is load-bearing, see below
<AnimatePresence mode="wait" custom={direction} initial={false}>
  <motion.div key={question ? question.id : 'review'} custom={direction} variants={stepVariants} … />
</AnimatePresence>
```

**⚠️ `when: 'beforeChildren'` plus a spring parent means the children wait for
the spring to FULLY SETTLE — measured, that is 707ms, not "immediately".** The
whole orchestration is ~1.06s for the first child and +70ms per staggered row
after it. **That is the single most surprising number in this document.**

**To make it quicker, drop `when: 'beforeChildren'` or give the parent a tween.
Do not shorten the children** — they are already fast; the wait is the parent's.

**The clip box is load-bearing:** `-mx-1 min-w-0 overflow-x-clip px-1`. The
outgoing question is still in the tree for a beat and would otherwise size the
column while it slides. `overflow-x-clip` rather than `hidden` so the vertical
axis stays visible; `-mx-1 px-1` buys back the 4px an option's `ring-offset-2`
focus ring needs at the column edges. §11 Trap 8.

**The review screen deliberately passes no `rowVariants` (`:477`)** — twenty rows
arriving one after another reads as the page assembling itself.

### The tick box — three mechanisms

**(measured, rAF-sampled)** scale `0.400` (9ms) → 0.565 (52) → 0.946 (102) →
**overshoot 1.104 at 151ms** → 1.069 (202) → **undershoot 0.981 at 302ms** →
0.995 (377) → settled ~450ms. So the "pop" is a **+10.4% overshoot** with one
visible bounce.

```tsx
// :197 — the press, under the finger
whileTap={reduceMotion ? undefined : { scale: 0.92 }}
transition={{ type: 'spring', stiffness: 500, damping: 30 }}
// :210 — the mark appearing
initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: 'spring', stiffness: 620, damping: 24 }}
```

Every box also carries `aria-pressed` and an `aria-label` naming **its own person
and answer** — the grid is two members wide, so "Yes" alone is ambiguous.

**⚠️ Do not put a faint "ghost tick" in the empty box.** One was tried at 20%
opacity, on the reasoning that it demonstrates what tapping will do, and was
reported immediately as *"it looks like already the box is ticked"* — a preview
that reads as a state makes the reader think they have already answered.

**The progress rail is a segmented bar, not a stepper.** Every segment up to and
including the current question stays solid (`i <= index`), on a 300ms
`transition-colors`. A stepper that empties behind you tells a reader they have
lost progress they have not lost.

---

## 5.6 Module complete — the rosette badge

**Where** `ConsumerModulePage.tsx:1127`
**(measured)** `scale` 1 → **1.03500** and `y` 0 → **−3.00**, peak at 0ms and
3932ms, trough at ~1965ms → **period 3.93s ≈ 4.0s** ✅.

```tsx
// :1127
animate={reduceMotion ? undefined : { scale: [1, 1.035, 1], y: [0, -3, 0] }}
transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' as const }}
```

**The badge breathes as one object, not pillow-inside-rosette.** The pillow could
be pulled out of the export and animated separately, and that is exactly the
split this project has shipped misaligned three times (§11 Trap 7). At this size
the difference is not visible; the rule is worth more than the nuance.

**This is also the control case for §11 Trap 1.** The same `{scale:[…],
y:[…]}, repeat: Infinity` pattern runs correctly here because the module page's
`AnimatePresence` has no `initial={false}`, while the identical pattern on the
diary's welcome screen did not.

---

# §6 The sleep diary

Three stages: `welcome → questions (×9) → done`.
`src/pages/consumer/ConsumerDiaryPage.tsx`.

## 6.1 Stage machine

**Where** `:294` (variants), `:356` (the `AnimatePresence`).

Identical to §5.1 **except** two things: `y` is **24px, not 8**, and the outer
`AnimatePresence` carries `initial={false}`.

```tsx
// :294
const stageMotion = {
  initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}
// :356
<AnimatePresence mode="wait" initial={false}>   // ⚠️ READ §11 TRAP 1 BEFORE COPYING
```

**24px rather than 8 because these are whole screens**, not a block arriving on a
page — the diary's three stages replace everything between the header and the
footer, and 8px on that much content is imperceptible.

**⚠️ `initial={false}` propagates through `PresenceContext` to every descendant
and will kill any `repeat: Infinity` keyframe animation inside this subtree.** It
did exactly that to the welcome screen's pillow breath, which shipped frozen.
**An explicit `initial` prop does NOT override it.** The fix that ships is in
§10.3; the mechanism is §11 Trap 1. Read it before copying this line anywhere.

## 6.2 Question stepper

**Where** `:262,284` (variants — byte-identical to §5.5's), `:448`.

Spring 320/32 and 380/34, `x: ±64`, `y: 16`, `staggerChildren: 0.07`, exit 0.18s
`easeIn`. One difference:

```tsx
// :448
<AnimatePresence mode="popLayout" custom={direction} initial={false}>
```

**`popLayout`, not `wait`** — the incoming step mounts **immediately**, so the
heading-focus effect always finds the element it is meant to land on. That is why
the diary can safely use an effect (`:191`) where §5.5's siblings need a callback
ref. If you change this to `mode="wait"`, you must change the focus mechanism in
the same edit.

## 6.3 The active-field emphasis

**Where** `:106-130` (constants), `:528` (the input), `:553` (the unit).

**(measured, 834px)** the PLE's field sits at `scale 1.08` with
`transform-origin: 0px 31.3px`, and its unit label translated **+16.64px**. On
answering, the emphasis hands over: at 61ms the first field is 1.055 and the
second 1.025; at 244ms the second **overshoots to 1.0839**; settled by ~305ms.
16.64px = 0.08 × 208 ✅.

```tsx
// :106
const ACTIVE_SCALE = 1.08
const ACTIVE_TRANSITION = { type: 'spring' as const, stiffness: 300, damping: 24 }
const ACTIVE_ORIGIN = 'left center'   // ⚠️ not centre — see below
// :130
const unitShiftFor = (wide: boolean) =>
  (ACTIVE_SCALE - 1) * (wide ? NUMBER_FIELD_W.sm : NUMBER_FIELD_W.base)   // 208 / 136
// :528 · :553
animate={reducedMotion ? undefined : { scale: isActive ? ACTIVE_SCALE : 1 }}
animate={reducedMotion ? undefined : { x: isActive ? unitShiftFor(wideField) : 0 }}
```

**⚠️ Anchored to the box's left edge, not its centre.** Centre-origin grows both
ways, and on a phone the row has no room on the right — the field ran past the
column and the step's `overflow-x-clip` cut it off.

**Why the unit has to move too.** `scale` is a transform: it paints the box
larger without reflowing anything, so the unit beside it stayed put and the
enlarged field ran underneath it. Translating the unit by the same delta keeps the
pair together and still costs no layout. **If you change `ACTIVE_SCALE` or either
field width, `unitShiftFor` follows automatically — keep it derived.**

**`isActive` is derived, not stored**:
`members.find(x => !answersFor(x.who, question.field))?.who`. The emphasis is on
the first member who has not answered yet, so answering moves it to the carer
with no state to keep in sync.

## 6.4 Progress bar

**Where** `:416-432`. **(measured)** width `11.1111%` (1 of 9) on Q1, on a spring.

```tsx
// :425
initial={false}                                 // never animates from 0 on mount
animate={{ width: `${((qIndex + 1) / total) * 100}%` }}
transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 210, damping: 28 }}
```

**The progress row sits outside the animated step block.** It is persistent
chrome and must not slide with the question. It is also a real
`role="progressbar"` with `aria-valuenow`, not a tinted div.

## 6.5 The thank-you screen

Renders the shared `CompletionHero` (§10.3). **(measured)** the pillow breathes
correctly — `scale 1 → 1.035`, `y 0 → −3`, period **3.93s** — because this screen
mounts *after* the first `AnimatePresence` render, so `initial={false}` no longer
applies. **Same component, same props, opposite outcome to the welcome screen.**
That contrast is the proof in §11 Trap 1.

---

# §7 The session-feedback modal

**Where** `src/components/consumer/SessionFeedbackModal.tsx` +
`SessionFeedbackBanner.tsx`. **`SessionFeedbackBanner` has no animation** — it is
a static yellow card with `transition-opacity` and `transition-colors` on its two
buttons. All the motion is in the modal.

**Reachable in the prototype** by pressing **Join video call** on Home (a demo
switch standing in for the "session finished" signal the platform does not have —
`orchestration-flows.md` §2), then **Share my thoughts**.

## 7.1 The state machine's motion

`mood → details → thanks`. Panel **(measured)** 786 × 674 at 834px, **identical
on all three steps** (it is `h-[674px]`, one fixed size; direct instruction:
*"keep the modal dimensions fixed"*).

**(measured step swap)** press Continue at t=0: outgoing `opacity 1, y 0` →
`opacity 0, y −14` at **257ms** → key swaps → incoming `opacity 0.04, y +13.5` at
299ms → `opacity 1, y 0` at **549ms**. **(authored)** 0.26s each way. ✅

```tsx
// :526 — the §1.8 modal signature, verbatim
// :610
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={step}
    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
    transition={{ duration: reduceMotion ? 0.12 : 0.26, ease: [0.4, 0, 0.2, 1] }}
  />
</AnimatePresence>
```

**The move is forward-reading**: the outgoing screen leaves *upward*, the
incoming arrives *from below*. Reverse it and the flow reads as going backwards.

**`mode="wait"` rather than an overlap** because the panel is one fixed box, and
two screens crossing inside it would overlap their own copy.

**`initial={false}` here so opening the modal plays the panel's entrance only**,
not the step's on top of it. **It is safe here and dangerous in §6.1 for one
reason:** no `repeat: Infinity` keyframe animation lives inside this
`AnimatePresence` on its first render. The mood pillows below are CSS, not
framer, which is precisely why Trap 1 cannot reach them.

**Focus is a callback ref per step (`:475`)**; Tab is trapped; on close, focus is
restored to the trigger **only if focus is still inside the closing panel**
(`:441`) — otherwise it yanks the reader back from wherever they have since gone.

## 7.2 The five mood pillows — CSS keyframes, not framer

**Where** `src/consumer-tokens.css:614-674`; the call site is
`SessionFeedbackModal.tsx:255-270,296-315`.

**This is the only CSS `@keyframes` animation in the portal, and the reason is
recorded.** An earlier pass used framer `y` keyframes **in percent** and framer
wrote `transform: none` and left it there, having never parsed the percentage
keyframe array. The body's CSS beat was running at the same moment, which is what
made the failure visible rather than plausible.

Each pillow performs **one small move and settles back**, on a loop. The emotion
never changes — each pillow stays in its own face, and the beat is a movement in
the spirit of that face.

```css
/* consumer-tokens.css:614 — one set per mood. The long rest (0-62%) is what
   makes it read as a BEAT rather than a wobble. */
@keyframes consumer-pillow-verygood {
    0%, 62%, 100% { transform: translateY(0) rotate(0) scale(1, 1); }
    76%           { transform: translateY(-9%) rotate(-2.5deg) scale(0.98, 1.03); }
}
/* good :618  −6%  /  +1.5deg / 0.99,1.02
   okay :622  −2%  /  +2.5deg / 1,1
   notgreat :626 +3% / −2deg  / 1.02,0.97
   verybad  :630 +4% / −3.5deg / 1.03,0.95 */

/* :649 — ONE set serves all five moods AND both feature layers. The peak is a
   var(), which resolves at computed-value time and is therefore free to differ
   per layer, while the INTERPOLATION still happens between the two resolved
   transforms. That is the way around CSS's inability to interpolate an
   unregistered custom property directly. */
@keyframes consumer-pillow-feature {
    0%, 62%, 100% { transform: translateY(0); }
    76%           { transform: translateY(var(--feature-y, 0)); }
}

/* :660 */
.consumer-pillow-beat, .consumer-pillow-feature {
    animation-duration: var(--beat-duration, 3.6s);
    animation-delay: var(--beat-delay, 0s);
    animation-iteration-count: infinite;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: 50% 100%;
    will-change: transform;
}
/* :670 */
@media (prefers-reduced-motion: reduce) {
    .consumer-pillow-beat, .consumer-pillow-feature { animation: none !important; }
}
```

**(measured live, all five running):**

| Mood | `animation-name` | duration | delay |
|---|---|---|---|
| Very good | `consumer-pillow-verygood` | **3.2s** | **0s** |
| Good | `consumer-pillow-good` | **3.6s** | **0.37s** |
| Okay | `consumer-pillow-okay` | **4.2s** | **0.74s** |
| Not great | `consumer-pillow-notgreat` | **3.8s** | **1.11s** |
| Very bad | `consumer-pillow-verybad` | **4.6s** | **1.48s** |

All five `cubic-bezier(0.4,0,0.2,1)`, infinite. `transform-origin` measured
`51.2px 78.65px` = 50% 100% of the pillow box ✅.

**Five different durations plus a 0.37s-per-index delay is the whole trick.**
With one shared duration all five pillows move on the same frame and the row
reads as twitching rather than as five pillows each with a life of its own. No
two beats land together at any point in the loop. **If you add a sixth mood, give
it a duration that is not a small-integer ratio of the other five.**

**`translateY` in per cent is relative to the element's own box**, so one value
holds from a 56px pillow on a phone to a 110px one on a desktop.

The face and brows ride the same clock as the body:

```tsx
// SessionFeedbackModal.tsx:160
const FACE_BEAT: Record<string, { brow: number; face: number }> = {
  verygood: { brow: -8,   face: -2.6 },   // the two happy pillows LIFT
  good:     { brow: -6.5, face: -2 },
  okay:     { brow: -4,   face: -1 },     // "okay" barely moves — that is what keeps it okay
  notgreat: { brow: 5,    face: 1.6 },    // the two unhappy ones SINK
  verybad:  { brow: 6.5,  face: 2.4 },
}
// :96 · :103
const BEAT_DURATION = { verygood: '3.2s', good: '3.6s', okay: '4.2s', notgreat: '3.8s', verybad: '4.6s' }
const BEAT_DELAY = (index: number) => `${(index * 0.37).toFixed(2)}s`
// :261 — the per-layer peak, written as a percentage of THAT layer's own box
style={{ '--feature-y': travel(units, faceH), '--beat-duration': …, '--beat-delay': … }}
```

**(measured `--feature-y`)** verygood face `-3.073%` (= −2.6/84.6168 ✅),
verygood brows `-9.454%` (= −8/84.6168 ✅), good face `-2.364%` ✅, good brows
`-7.682%` ✅.

**⚠️ The expression lives in the GAP between brows and face, not in how far
either travels.** Both layers used to move almost together (brow −3 against face
−2, a differential of ~1px), so the features translated as a block and a happy
pillow just *moved* rather than looking happier. The brow now travels roughly
**3×** the face, which opens and closes the brow-to-eye distance — and that is the
part a viewer reads as an emotion intensifying. **Preserve the ratio, not the
absolute numbers.**

**⚠️ "Very bad"'s face has a different denominator.** It is a separate 34.2244 ×
34.0473 export rendered at 29.30% of the pillow's width, so on screen it occupies
`0.2930 × 110.169 × (34.0473/34.2244) = 32.128` pillow units of height. A
percentage translate resolves against **that** box, so the raw viewBox height is
the wrong denominator — measured, it left this mood travelling 6% short of every
other one.

## 7.3 Selection

**Where** `:129` (`GLOW`), `:141` (`SELECTED_ART_SCALE`), `:280-315`.

**(measured)** clicking a card swaps every layer's `src` from `good-*` to
`sel-good-*`, scales the pillow box to **1.14179** over 200ms `ease-out`, applies
`drop-shadow(rgba(77,140,56,0.5) -2.44px 9.77px 14.65px)`, and **strips the beat
class from the other four** — exactly one `.consumer-pillow-beat` element is left
running.

```tsx
// :141 — the selected export is genuinely LARGER ART, not a tint
const SELECTED_ART_SCALE = 125.79 / 110.169   // = 1.14179
// :129
const GLOW = (rgb: string) => `drop-shadow(-2.3848cqw 9.5397cqw 14.3119cqw rgba(${rgb},0.5))`
// :285 — outer box: size, container, selected scale-up
style={{ aspectRatio: '110.169 / 84.6168',
         transform: selected ? `scale(${SELECTED_ART_SCALE})` : undefined,
         containerType: 'inline-size' }}
// :303 — inner element: the beat AND the glow
className={cn('absolute inset-0 block transition-[filter] duration-200 ease-out motion-reduce:transition-none',
              running && 'consumer-pillow-beat')}
style={{ filter: selected ? GLOW(glow) : undefined,
         animationName: running ? `consumer-pillow-${art}` : undefined, … }}
```

**⚠️ The blur is halved against Figma's, and that is not a mistake.** Figma's
blur is a **diameter**; `filter: drop-shadow()` takes a **standard deviation**,
so Figma's 36 is 18 here.

**⚠️ The lengths are `cqw`, so the shadow scales with the pillow.** The effect was
authored against a 125.79px pillow that renders anywhere from 56px to 110px.
3/125.79, 12/125.79, 18/125.79 against a container established on the pillow box
— hence `containerType: 'inline-size'` on the outer span.

**⚠️ The beat and the glow ride the inner element, not the outer one.** The outer
box owns the size, the container and the selected scale-up, so its transform is
already spoken for. Keeping the loop off that transform also means selecting a
pillow cannot interrupt its own animation.

**Which pillows beat** (`beat = mood === null || on`): every pillow beats until a
choice is made, then only the chosen one does. Reading `mood === null` rather
than a separate flag means the row cannot get out of step with the actual
selection, and clearing a selection restores all five for free.

**The shadow is on the pillow, not the card.** `drop-shadow` follows the
artwork's own alpha, so it hugs the pillow shape rather than boxing it.

## 7.4 The thank-you mascot

Runs the **shared** Home / My Modules mascot clock, with naps turned off:

```tsx
const { reduceMotion, featureTransition, browY, faceY, tilt } = useMascotExpression({ nap: false })
```

**(measured)** `scale 1 → 1.01491`, `y 0 → −1.988`, peak at 2008ms, trough at
4513ms → **period 5.0s** ✅ — identical to Home's.

**`nap: false` is a content decision, not a technical one**: a pillow that dozes
off mid-sentence while thanking someone reads as the app losing interest.

---

# §8 Need help

## 8.1 The question-mark speech bubble

**Where** `ConsumerCanvasWave.tsx:574-590` (the `withQuestion` mascot variant).
**(measured, sampled at 220ms over 3.3s)** rotation runs **+2.96° → −5.05°** (an
**8.01° swing**) and `y` **0 → −2.98px**, peak at 442ms, trough at 2209ms →
**period ≈ 3.2s** ✅.

```tsx
// :579
animate={reduceMotion ? { rotate: -5.1, y: 0 } : { rotate: [-5.1, 3, -5.1], y: [0, -3, 0] }}
transition={reduceMotion ? { duration: 0 } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
```

**The amplitude is deliberately large for the size.** −5.1° (its own drawn rest
angle) to +3° is an **8.1° swing** on a 52px shape, and the float is 3px.
Rotations under ~8° are invisible on small shapes (§0.7). **Do not "calm it
down"** — it will disappear, and be reported as broken.

**The 3.2s loop is deliberately coprime-ish with the pillow's own 5s breath** so
the two never sync into looking like one event.

**The bubble and the mark animate as ONE element.** Both what a speech bubble
does physically, and the safe way to do it here: the export interleaves its four
paths (bubble fill, mark, bubble outline, mark highlight), so splitting it to
animate them separately would reorder the paint.

**⚠️ The `withQuestion` box is 16.4px wider** (154.6 rather than 138.158) because
the sticker overflows the mascot's box to the right. Sizing the box to the
*pillow* would centre the pillow and let the bubble hang into the gutter.

**Reduced motion parks it at its drawn rest angle, −5.1°, not 0** — it is drawn
tilted, and 0 is a pose it never holds.

## 8.2 FAQ accordion

**Where** `src/pages/consumer/ConsumerHelpPage.tsx:389` (chevron), `:403` (panel).

**(measured)** chevron `rotate` 0 → 14.9° (41ms) → 100.7° (83) → 154.7° (124) →
175.0° (166) → **180° at 206ms**. Panel `height` 0 → 2.58px (42ms) → 11.84 (83) →
22.73 (124) → 29.87 (206) → **30.40px at 248ms**, with `opacity` tracking it and
`overflow: hidden`. On close the panel is **gone from the DOM**. ✅

```tsx
// :389
animate={{ rotate: open ? 180 : 0 }}
transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
// :403
<AnimatePresence initial={false}>
  {open && (
    <motion.div
      id={panelId}
      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    />
  )}
</AnimatePresence>
```

**⚠️ The panel unmounts on close rather than animating to `height: 0` and staying
in the tree.** Animated `height: 0` is **not** concealment — the content keeps its
focus order and its place in the accessibility tree unless it *also* gets
`inert`. Unmounting has no such failure mode. This is a standing rule in this
project, not a local preference.

**The whole row is the control, not just the chevron.** A 35px glyph at the far
right of a 700px row is a needlessly small target, and this portal's audience
note — plain language, big targets — is explicit.

`initial={false}` on this `AnimatePresence` is safe: nothing inside it loops.

## 8.3 `ResourceCard` and `resourceBlobFrame`

**No animation.** The rotations — `4.45deg` on the assembled artwork, `3.35deg`
on the backdrop blob, per-sticker `4.55 / −9.55 / −8.67 / 4.55` — are **static**
transforms transcribed from the frame.

The photo and its torn frame are **one path rendered twice** — a `clipPath` and a
stroke in one inline SVG. Do not split them; §11 Trap 7, and
`wave-and-blob-shapes.md` for the geometry.

---

# §9 My profile

**No animation of its own.** `ConsumerPersonCard` is static. The page contributes
`ConsumerContentReveal` (§1.2) and the shell's `ScrollCue` (§1.7); the opt-out
flow opens a `ConfirmDialog` (§1.8). The only other moving parts are
`transition-colors` on the destructive button and `focus-visible` ring changes on
the inputs.

---

# §10 The mascot system — one clock, four surfaces

`useMascotExpression` is exported from `ConsumerCanvasWave.tsx:313` and drives
**Home**, **My Modules** (`withPencil`), **Need help** (`withQuestion`) and the
**feedback thank-you screen** (`nap: false`). **Sharing the hook is what makes
"the same animation" structural rather than a promise** — if you re-implement it
per surface, they will drift.

## 10.1 The expression clock

```tsx
// ConsumerCanvasWave.tsx — the four poses and the four timings
const EXPRESSIONS = {
  neutral: { browY: 0,    faceY: 0,    tilt: 0 },
  happy:   { browY: -2.5, faceY: -1.5, tilt: 0 },   // brows and features lift together
  curious: { browY: -4,   faceY: -0.5, tilt: 4 },   // brows up further, features barely move, head tilts
  asleep:  { browY: 1,    faceY: 0,    tilt: 0 },   // the EYES flip; nothing else
} as const

const EXPRESSION_MS = 1400, SLEEP_MIN_MS = 4500, SLEEP_MAX_MS = 6500
const NEUTRAL_MIN_MS = 3500, NEUTRAL_MAX_MS = 7000

// the roll, inside the timer chain
const next = nap
  ? roll < 0.3 ? 'asleep' : roll < 0.65 ? 'happy' : 'curious'
  : roll < 0.5 ? 'happy' : 'curious'

// slow and soft: an expression that snaps reads as a glitch on a face this small
const featureTransition = reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const }
```

**The cycle is genuinely random rather than a fixed loop**: a neutral hold of
3.5–7s, then one of the expressions for ~1.4s (or 4.5–6.5s for a nap), then back.
**A fixed sequence at this size reads as a repeating animation**; the irregular
gap is what makes it read as a face doing something of its own accord.

**Sleeping is the least frequent and holds longest** because it is the only pose
that changes what the face *is* rather than how it is set. A nap every other
cycle would read as a broken asset.

**Under reduced motion the effect returns early and the face stays neutral
forever** — not frozen mid-expression, which would look like a bug.

## 10.2 The awake mascot

**Where** `ConsumerCanvasWave.tsx:378-643`.

**(measured on Home over 22.4s)** — matrix components, `a` = scale, `b` =
sin(rotation), `ty` = y:

| What | Measured | Authored |
|---|---|---|
| Breath `scale` peak | **1.0150** | 1.015 |
| Float `y` peak | **−2.00px** | −2 |
| Breath / float period | peaks at 4519 / 9544 / 14569 / 19591ms → **5025ms ≈ 5.0s** | 5 |
| `curious` tilt | `b = 0.0707` → **4.05°** | 4 |
| `curious` brow / face | `ty −4.00` / `−0.50` | −4 / −0.5 |
| Expression hold | ~1.4s at full value, 0.55s each way | 1400ms |
| Nap eye flip | `scaleY 1 → −1` over ~0.55s; brows `ty +1`; zzz subtree **mounts** | — |

Three cycles of `curious` and one nap landed in that window; `happy` did not
appear — it is a roll, not a rotation.

```tsx
// :385 — the wrapper carries breath, float AND tilt, on three separate clocks
style={{ width: 138.158, height: 90, transformOrigin: 'center bottom' }}
animate={reduceMotion ? { rotate: 0 } : { rotate: tilt, scale: [1, 1.015, 1], y: [0, -2, 0] }}
transition={{
  rotate: featureTransition,                                                   // follows the expression
  scale:  reduceMotion ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
  y:      reduceMotion ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
}}

// :483 features · :493 eyes · :501 brows — each takes only its own offset
animate={{ y: faceY }}
animate={{ y: faceY, scaleY: asleep ? -1 : 1 }}   // eyes, :498
animate={{ y: browY }}
```

**⚠️ Per-property transitions on one `animate` object is the mechanism here.**
The tilt must follow the expression's 0.55s curve while the breath runs on its
own 5s infinite loop, on the same element. A single `transition` cannot express
that.

**⚠️ The eyes sit on their own layer with `transformOrigin: 'center 40.64%'`
(`:497`).** A `scaleY(-1)` on a full-box layer would mirror the **box** and drop
the eyes to the chin. 40.64% is measured: the eyes span y 31.31–41.83 of 90.

**The zzz only mount while asleep (`:596`)**, inside an `AnimatePresence` so the
glyphs fade rather than vanish on waking. They are the **welcome screen's own
exports**, at `Z_SCALE = 0.5` and `filter: brightness(0.55)` — white is correct
on the welcome screen's deep purple wave and all but invisible on Home's pale
canvas. A brightness filter rather than a second set of exports, because the
source is a flat white shape and scaling its channels down is an exact recolour;
0.55 lands on ~`#8c8c8c`.

**⚠️ `withPencil` and `withQuestion` extras are plain `<img>`, not `motion.img`
(`:465`).** They ride the wrapper's breath and tilt and take none of the face's
`y`. A pencil leaning on the pillow does not raise its eyebrows; a speech bubble
does not blink. (The Need help bubble is the exception and has its own clock —
§8.1.)

## 10.3 `CompletionHero`'s pillow — diary and module completion

**Where** `src/components/consumer/ConsumerCompletionHero.tsx:175` (`BREATH_S`),
`:195` (expressions), `:249-253` (**the fix**), `:305-320` (the two boxes),
`:378` (the steam mask).

Same three face layers as §10.2, **different numbers**, and the difference is
deliberate:

```tsx
// :195 — ⚠️ NO `asleep`: this pillow is awake with a cup of tea.
const EXPRESSIONS = {
  neutral: { browY: 0,    faceY: 0,    tilt: 0 },
  happy:   { browY: -2.2, faceY: -1.3, tilt: 0 },
  curious: { browY: -3.4, faceY: -0.5, tilt: 4 },
}
```

**⚠️ `browY`/`faceY` are PER CENT of the layer box here, not Home's px.** Home's
values are tuned to a 90px-tall head; this pillow renders about 2.4× that, so
copying the px would produce a third of the movement — the §0.7 failure exactly.

**The breath is started imperatively from an effect, and this is a fix, not a
style choice:**

```tsx
// :225
const loop = (duration: number) => ({ duration, repeat: Infinity, ease: 'easeInOut' as const })
// :249
const breath = useAnimationControls()
useEffect(() => {
  if (reduceMotion) return
  breath.start({ scale: [1, 1.035, 1], y: [0, -3, 0] }, loop(BREATH_S))
}, [reduceMotion, breath])
// :305 — note: NO `animate` target and NO `initial` prop on this element
<motion.div style={{ position: 'absolute', …, transformOrigin: 'center bottom' }} animate={breath}>
  {/* :313 INNER box: tilt only */}
  <motion.div className="absolute inset-0" style={{ transformOrigin: 'center bottom' }}
              animate={{ rotate: tilt }} transition={featureTransition}>
    {/* body (static) · face `y: ${faceY}%` · brows `y: ${browY}%` */}
  </motion.div>
</motion.div>
```

**Why the effect.** `AnimatePresence initial={false}` on the diary's stage
switcher (`ConsumerDiaryPage.tsx:356`) writes `initial: false` onto **every**
descendant through `PresenceContext`, so a `repeat: Infinity` keyframe array
jumps to its final frame and never loops. **An explicit `initial` prop does not
override it — that was tried and measured still dead.** An effect runs a commit
*after* mount, by which time presence is no longer initial, so `controls.start()`
animates normally wherever it is mounted. §11 Trap 1.

**(measured after the fix, on the diary WELCOME screen — the screen that used to
be frozen):** `scale` 1 → **1.03498**, `y` 0 → **−2.998px**, samples repeating on
a **4.00s** period. 386 style writes in 3.2s. ✅

**⚠️ Two nested boxes, not one.** The breath has to scale and float the **whole**
pillow including its features; the tilt has to rotate the whole pillow about its
base **without** the features counter-rotating. One element trying to animate
both, with the features applying their own offsets on top, produces a face that
slides off its own pillow.

**The steam is deliberately static and at full opacity** — direct instruction,
twice. An earlier pass breathed it between 0.5 and 1, and at 0.5 white-on-purple
all but disappeared. The whole effect is a one-way mask (`:378`):
`maskImage: 'linear-gradient(to top, #000 70%, transparent 100%)'`. **70%, not
35%**: at 35% the gradient started eating the wisps barely above the cup.

---

# §11 Traps

Eleven things that will be wrong on a naive rebuild. **None of this is inferable
from reading the source.** Each was either found by measurement or is recorded in
the code as having been shipped and fixed.

## Trap 1 — `AnimatePresence initial={false}` silently kills looping animations in the whole subtree

**This shipped as a real defect in this package and has since been fixed. Do not
reintroduce it.**

`initial={false}` on an `AnimatePresence` is published through `PresenceContext`
to **every descendant**, not just the direct child. On the first render of that
`AnimatePresence`, framer treats every `motion` element inside as having
`initial={false}` — it jumps straight to the `animate` target. For a **keyframe
array** the target is the *final* keyframe (`scale: 1, y: 0` → `transform: none`),
and there is nothing left to repeat.

**⚠️ An explicit `initial` prop on the looping element does NOT override it.**
That was the obvious fix, it was tried, and it was measured still dead.

**How it presented.** The sleep-diary welcome screen's pillow did not breathe. Its
breath wrapper's inline style read `transform: none` from the first frame, and a
`MutationObserver` on the `style` attribute recorded **0 writes in 3 seconds** —
so framer was not restarting it in a loop, it was **never scheduling it at all**.

**How it was proven, twice, in opposite directions.** The *same component with the
same props* on the diary's **thank-you** screen breathed correctly, because that
screen mounts later, once presence is no longer "initial". And the module page's
stage `AnimatePresence` has **no** `initial={false}`, so its completion badge —
the same `{scale:[1,1.035,1], y:[0,-3,0]}, duration 4, repeat: Infinity` pattern
— **does** run.

**The fix that ships** (`ConsumerCompletionHero.tsx:249`) is to start the loop
imperatively from an effect, which runs a commit after mount when presence is no
longer initial:

```tsx
const breath = useAnimationControls()
useEffect(() => {
  if (reduceMotion) return
  breath.start({ scale: [1, 1.035, 1], y: [0, -3, 0] },
               { duration: 4, repeat: Infinity, ease: 'easeInOut' })
}, [reduceMotion, breath])

<motion.div animate={breath} />   // no `animate` target, no `initial`
```

**Rule for any rebuild:** never put a `repeat: Infinity` keyframe animation
inside an `AnimatePresence initial={false}` subtree and expect a prop to save it.
Start it from an effect, or remove `initial={false}`.

**Where `initial={false}` currently appears, and whether each is safe:**

| Site | Safe? |
|---|---|
| `ConsumerDiaryPage.tsx:356` (stages) | ⚠️ contains the completion pillow — safe **only** because of the effect above |
| `ConsumerDiaryPage.tsx:448` (question stepper) | ✅ nothing inside loops |
| `ModuleReflection.tsx:429` | ✅ nothing inside loops |
| `SessionFeedbackModal.tsx:610` | ✅ the mood pillows are CSS, not framer |
| `ConsumerHelpPage.tsx:403` (FAQ) | ✅ nothing inside loops |

## Trap 2 — focus belongs on a callback ref, not an effect, under `mode="wait"`

Under `AnimatePresence mode="wait"` the incoming node mounts **a commit later**
than the state change. A `useEffect` keyed on the step or stage runs while the
*outgoing* screen is still the only thing in the tree: it focuses the old heading
or nothing, never runs again, and **every transition lands on `<body>`**. A
callback ref is keyed on the **element**, which cannot exist too early.

**Applies to:** the onboarding tour (`ConsumerOnboardingTour.tsx:210`), the
feedback modal (`:475`), the module stage machine
(`ConsumerModulePage.tsx:1313`), the drawer's close button
(`ConsumerMenuDrawer.tsx:93`).

**Does not apply** where every target stays mounted — the welcome screen's four
headings (`ConsumerWelcome.tsx:469`), the diary's `popLayout` stepper
(`ConsumerDiaryPage.tsx:191`), the flip card's two faces
(`ModuleSummaryCards.tsx:692`). All three correctly use an effect instead. **If
you change a `popLayout` to a `wait`, you must change its focus mechanism in the
same edit.**

The flip card's effect has its own variant of the trap: **guard on the previous
value, not on a "have I run before" latch.** StrictMode mounts effects twice; a
latch made run two focus the last card's front button instead of the page
heading.

## Trap 3 — `translate` is not `transform` in Tailwind v4

`translate-y-*` compiles to the standalone CSS **`translate`** property.
`getComputedStyle(el).transform` reads `none` on an element that is visibly
offset, and its `translate` carries `0px calc(-100% - 96px)`.

A first pass wrote `transition: transform 220ms`, so the class toggled, the band
moved to the right place, and it **teleported**. A screenshot cannot show that;
only reading both properties back can. `CHROME_TRANSITION`
(`ConsumerFlowFooter.tsx:63`) transitions `translate`.

## Trap 4 — the sticky offset is measured, not a media query

`--consumer-chrome-h` is the *real* header height, written from a
`ResizeObserver` at `ConsumerHeader.tsx:519`.

**(measured)** 72px at 1281, 133px at 834. A media query looks sufficient and is
wrong three ways:

1. The tab row's presence is decided **per page** (`showNav`), not per viewport —
   the module flow hides it, so at 375px its header is 72px and a viewport-based
   133px pushes its sticky bar 61px too low.
2. The row is animated in and out by `AnimatePresence`, so its height is not
   constant even within one page.
3. The CSS fallback (`--consumer-chrome-h: var(--consumer-header-h)`) deliberately
   errs 61px **high** for one frame, because erring low would jump a banner down
   and back.

## Trap 5 — five of the six smooth scrolls ignore `prefers-reduced-motion`

| Site | Guarded |
|---|---|
| `ConsumerModulePage.tsx:812` `scrollToResourceCard` | ✅ `matchMedia('(prefers-reduced-motion: reduce)')` → `behavior: 'auto'` |
| `ScrollCue.tsx:69` "Scroll to see more" | ❌ |
| `SessionPlanStrip.tsx:360` chevron step | ❌ |
| `SessionPlanStrip.tsx:374` dot jump | ❌ |
| `ModuleSummaryCards.tsx:634` card-back scroll cue | ❌ |
| `ConsumerModulePage.tsx:560` chapter nudge | ❌ |

**Neither of the two global switches in §0.1 can reach these** — they are browser
scrolls, not framer animations and not CSS. Copy the one guarded implementation's
pattern to the other five, or extract a `smoothScroll()` helper that reads the
media query once. **This is the single real reduced-motion gap in the portal.**

## Trap 6 — three inline `style={{ transition }}` values sit outside the design system

`CHROME_TRANSITION` (two call sites) and
`'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)'` at
`ModuleSummaryCards.tsx:310`. They are correct, and the global CSS block in §0.1
does neutralise them under reduced motion — but they are strings in JSX rather
than tokens, so a tuning pass over the design system misses them.

Worth knowing *why* nobody noticed: each has a second independent guard. The
chrome bands are safe because `useScrollChrome` stops changing the class under
reduce; the pillow hover is safe because `reduceMotion` pins `scale` to 1.

## Trap 7 — never transcribe a mask and the outline that frames it separately

This project has shipped a photo sitting a few px outside its own frame **three
separate times**. Three places in this portal are built to make that impossible,
and each will be "improved" back into the bug by a well-meaning rebuild:

- **`ModuleHeroWave`** — the module welcome band's photo and its yellow wavy edge
  are **ONE Figma vector exported as one WebP**, with the curve already cut and
  the line already drawn on it. Do not split it into a CSS photo under an SVG
  wave.
- **`pillowFrame.ts` / `ModuleSummaryCards`** — one `frame.d` path rendered
  **twice in one inline SVG**: as the `clipPath` the photo is cut to, and as the
  stroke drawn over it.
- **`resourceBlobFrame.ts`** — the same technique for the Need help guide card.
  Its stroke scales with the card for free, because it rides the same transform.

See `wave-and-blob-shapes.md`.

## Trap 8 — the motion depends on DOM structure in five places

- **`perspective` goes on the OUTER box**, never on the element that rotates.
  Applied to the rotating element the vanishing point travels with it and the
  card reads as a flat image spinning. (`ModuleSummaryCards.tsx:702`)
- **Both flip faces share one grid cell** (`grid` + `col-start-1 row-start-1`),
  so the card is as tall as its taller face and nothing reflows mid-turn.
  Front-in-flow + `absolute` back sizes the card to the front alone, and these
  backs are taller.
- **The drawer is mounted above `<Routes>`** (`App.tsx:89`), or `navigate()`
  unmounts it and its exit never plays.
- **The rail and the cells live inside one transformed track**, which is why the
  text's off-timing is applied as a *difference* (`textX − trackX`,
  `ConsumerWelcome.tsx:611`) rather than as its own absolute position.
- **`overflow-x-clip` plus `min-w-0` on a sliding step's container** — the
  outgoing question is still in the tree for a beat and would otherwise size the
  column while it slides. `clip` rather than `hidden` so the vertical axis stays
  visible; `-mx-1 px-1` buys back the focus-ring room the clip eats.
  (`overflow-x: hidden` alone computes the other axis to `auto` and adds a
  scrollbar — that is how the onboarding modal grew a horizontal scrollbar from
  8px of overhang.)

## Trap 9 — Tailwind arbitrary *properties* fail silently under stacked variants

`motion-safe:hover:[--pillow-hover:1.07]` emitted **no CSS rule at all** —
verified by walking every stylesheet for the property name and finding zero
matches, while the class sat in the DOM and setting the variable by hand worked.
Unprefixed and `min-[Npx]:`-prefixed arbitrary properties **do** work.

Two consequences already applied in this codebase, both worth keeping:

- The summary card's pillow hover is driven from **React state**, not a CSS
  variable under a variant (§5.4).
- `SUBMENU_CARD_MOTION` uses `motion-reduce:transition-none` (cancelling
  wholesale) rather than a `motion-safe:` prefix on each `data-[…]` state class
  (§1.6).

**Related rule: never mix a named breakpoint variant with an arbitrary-property
one on the same custom property.**
`[--wave-s:1.6] sm:[--wave-s:1.25] min-[1200px]:[--wave-s:1]` resolved to **1.25
at a 1680px viewport** — Tailwind v4 emits the two kinds in a different order,
specificity is equal, and source order decided it the wrong way round. The band
came out 623px deep instead of 498. Write all of them as `min-[Npx]:`.

## Trap 10 — how to measure this portal's motion, and three false findings it produces

Four harness facts. Each has already produced a wrong conclusion in this package.

**1. framer-motion does NOT drive everything through `requestAnimationFrame`, and
this corrects the audit this document supersedes** — which stated that
`document.getAnimations()` returns 0 on every screen.

**(measured, this document, welcome screen)** `getAnimations()` returns **3**
live `Animation` objects: the three "z" glyphs, `duration: 3600`, delays
`0 / 450 / 900`, keyframes on `opacity` only. framer-motion v12 hands
**opacity-only** animations to the Web Animations API, where the browser can run
them off the main thread. In the same sample the pillow body's `scale` loop
returned `getAnimations().length === 0` on its own element while
`el.style.transform` stepped `scale(1) … scale(1.018) …` frame by frame.

| To measure | Use |
|---|---|
| a framer **transform** animation (scale, y, rotate) | sample `getComputedStyle(el).transform`, or read `el.style.transform`, over time |
| a framer **opacity** animation | `getAnimations()` works, and gives exact timing |
| a **CSS** animation (the five mood pillows) | `getComputedStyle(el).animationName` / `.animationDuration` / `.animationDelay` |
| "is it animating at all?" | a `MutationObserver` on the `style` attribute, counting writes |

**2. `requestAnimationFrame` can be fully suspended while the browser tab is in
the background.** The first pass of the preceding audit sampled a backgrounded
tab and measured every framer animation as frozen at `transform: none` —
**indistinguishable from the real Trap 1 defect**. Before believing any "nothing
is animating" result, check `document.hidden` **and** count rAF ticks; the two do
not always agree. During this document's measurements `document.hidden` was
`true` while rAF ran at 123fps, so `hidden` alone is not a verdict either way.
Front the tab and re-measure.

**3. A programmatic `element.focus()` dispatches no focus event in this
harness.** The summary card's pillow raises on `onFocus`, and `.focus()` left it
at `scale 1` while `document.activeElement` was correct. Likewise React delegates
`onMouseEnter` off `mouseover`/`mouseout`, so a synthetic `mouseenter` does
nothing — dispatch `mouseover` with a `relatedTarget`, or press real keys.

**4. The preview console returns a retained buffer that survives
`location.reload()` and `console.clear()`.** Check the console in a *fresh tab*
before filing an error as current.

## Trap 11 — one portal, two opposite reduced-motion philosophies

Two places make deliberately different calls, and if you unify them you should do
so knowingly:

- The **welcome exit** (§2.5) keeps a **shortened 180ms cross-fade** under
  reduced motion, on the reasoning that the preference asks for *movement* to go
  away, not for state changes to become instantaneous, and an opacity fade
  carries no motion vector.
- The **module stage machine** (§5.1) drops its fade **entirely** —
  `stageMotion` becomes `{}`.

Both are defensible. They are inconsistent.

---

# §12 Assets

Every animation below depends on a specific committed file under
`public/illustrations/consumer-*` (103 files, 2.4MB total). **A re-export from
Figma breaks the ones marked ⚠️, and the breakage is silent.**

## 12.1 Layer splits — byte-for-byte, and why

These were split out of one flat export by lifting each `<path>`/`<g>`
**verbatim** and giving it the original file's **unmodified `<svg>` open tag**,
so every layer keeps the export's full coordinate space and registers with its
siblings *by construction*, with no offsets to transcribe.

| Set | Directory · files | Box | What animates |
|---|---|---|---|
| Sleeping pillow | `consumer-welcome/` · `pillow-body/face/brows.svg` + `z-small/medium/large.svg` | 210.646 × 188 | body `scale`, face `y`, brows `y`, z's `y` + `opacity` |
| Awake mascot | `consumer-home/` · `awake-ground/pillow/features/eyes/brows.svg` | 138.158 × 90 | wrapper `scale`/`y`/`rotate`; features / eyes / brows `y`; eyes `scaleY` |
| My Modules extras | `consumer-home/` · `lessons-shadow.svg`, `lessons-pencil.svg` | same 138.158 × 90 | none — they ride the wrapper |
| Need help extras | `consumer-help/` · `help-ground.svg` (= `awake-ground` with one `fill` changed), `help-question.svg` (52.776 × 46.481, standalone) | — | the bubble rotates + floats |
| Diary mascot | `consumer-diary/` · `diary-ground/books/books-texture/mug/steam.svg` + the sleeping pillow's own three layers | 263 × 145.5 container | pillow only; steam is static behind a mask |
| Feedback pillows | `consumer-feedback/` · 5 moods × `{-body\|-base, -face, -brows}` + 5 × `sel-` equivalents + `thanks-body/face/brows.svg` (45 files) | 110.169 × 84.6168 (selected: 125.79 × 96.61) | CSS beat on the body; `--feature-y` on face and brows |

⚠️ **If any of these is re-exported as one flat file, the animation stops being
possible at all.** The flat sources are kept beside them (`awake-body.svg`,
`pillow-mascot.svg`, `good.svg` and so on) as the provenance of the splits — do
not swap them back in.

⚠️ **The three summary-card pillow SVGs carry a hand-added `purple-300` centred
stroke that Figma does not export**, which required growing each file's `viewBox`
and intrinsic size by the stroke width (a centred stroke sits half outside the
path's bounds, and an `<img>` clips to the viewBox). The widths in
`ModuleSummaryCards.tsx:108`'s `PILLOW_STYLES` are the **post-stroke** values:
324.265 → **330.265**, 353.16 → **359.16**, 317.237 → **323.237**. A re-export
drops the stroke and reverts the viewBox, and **both have to be reapplied
together**.

## 12.2 Backgrounds — two exports per breakpoint, never one stretched

`home-wave-desktop.svg` (1281 × 239) / `home-wave-mobile.svg` (375 × 176);
`wave.svg` / `welcome-wave-mobile.svg`; `diary-wave-desktop.svg` /
`diary-wave-mobile.svg`; `wave-rule-desktop.svg` / `wave-rule-mobile.svg`.

These carry `preserveAspectRatio="none"`, so **the box IS the geometry**: hand
one a different shape and it *shears* rather than cropping. Serving every width
from one file turned the crest into narrow spikes twice. The rule is **clip,
never squash** — `width: max(100vw, 1281px)` holds the desktop export at its
drawn depth and lets the viewport crop it.

`help-wave-desktop.svg` has **no phone counterpart**; below `sm` the gold band is
reconstructed as a linear gradient behind a CSS mask that uses
`home-wave-mobile.svg` for its shape — so it is the identical curve by
construction. Replace that branch with a real phone export when one is drawn.

None of these animate. They are listed because the **mascot's seating depends on
them**:

```ts
/** Seats the hero block ON the wave's crest at every desktop width.
 *  wave height H = max(18.657vw, 239px); crest under the mascot = 0.95711 × H
 *  (measured, 4× supersampled); block start → pillow base = a constant 208.15px. */
export const CONSUMER_CREST_TRACKING = 'sm:mt-[calc(0.95711*max(18.657vw,239px)-208.15px)]'
```

`sm:` is load-bearing, not tidiness: below 640 a *different* export is in play and
the mascot renders at 0.6444 scale, where the base already sits 10px **below**
the crest. Keep that breakpoint in step with the export swap in
`ConsumerCanvasWave` and the scale swap in `ConsumerMascotFigure`.

## 12.3 Raster assets

- **`consumer-lesson/lesson-hero-wave.webp`** — 2000 × 699, the repo's only WebP,
  and the reason is arithmetic: the shape needs a real alpha channel (the canvas
  shows through below the wave), and a photograph with alpha can only be PNG or
  WebP — 1,976 KB as optimised PNG against **136 KB** as WebP. Alpha was verified
  present before shipping (273,342 fully transparent pixels).
  ⚠️ **Count the alpha channel on any re-export**: a Figma RGBA export is very
  often fully opaque over a baked plate.
- **`consumer-onboarding/{dashboard,tasks,session-plan,coach,help}.png`** — the
  tour's five screenshots, at **2× the frame's 497 × 343 box** (994 × 686). The
  `aspectRatio: '497 / 343'` box (§3) is what keeps the panel from reflowing as
  they cross-fade. ⚠️ Replacing one at a different aspect ratio reintroduces the
  reflow.
- **`consumer-resource/guide-photo.jpg`**, **`consumer-coach/coach-portrait.png`**
  — static.

---

# §13 Reduced motion

## 13.1 Status of these statements

**This harness offers no way to emulate `prefers-reduced-motion`.** Every
reduced-motion behaviour described in this document is therefore **authored, not
measured**: the CSS blocks and the `motion-reduce:` classes were confirmed
present in the computed styles, and the framer branches were confirmed by reading
the source. **Confirm them with a real OS toggle before sign-off.** It is the one
verification gap in this spec.

What *was* verified by measurement: that the two global switches exist and are
wired (§0.1), that 10 elements carry `motion-reduce:transition-none`, that the
`.consumer-pillow-*` `@media` block is present at `consumer-tokens.css:670`, and
that the global `index.css:731` block sits outside every `@layer` with
`!important` so it beats Tailwind utilities.

## 13.2 The gap that is real

**Five of the six `behavior: 'smooth'` scroll calls ignore the preference
entirely**, and no global switch can fix them: `MotionConfig` governs
framer-motion, the CSS block governs `animation-*` and `transition-*`, and a
browser-driven scroll is neither. §11 Trap 5 lists the six sites and the one
correct implementation to copy.

## 13.3 What each surface does — the full table

| Surface | Under `prefers-reduced-motion: reduce` |
|---|---|
| Page intro (§1.1) | `y` dropped by `MotionConfig`, opacity fade kept |
| `ConsumerContentReveal` (§1.2) | content **placed at final values**, no animation at all |
| Nav tab stagger (§1.3) | stagger and delay → 0, item duration → 0 |
| Nav pill (§1.4) | `{ duration: 0 }` — the pill jumps |
| Drawer (§1.5) | panel **cross-fades in place with no `y`**, `duration: 0`; rows skip `initial` |
| Submenu cards (§1.6) | `motion-reduce:transition-none` |
| `ScrollCue` (§1.7) | enter/exit instant; **the bob is never started**; ⚠️ its smooth scroll is unguarded |
| `ConfirmDialog` (§1.8) | `y` dropped by `MotionConfig`, fade kept. Footer `active:scale-[0.97]` neutralised by the global CSS block |
| Sleeping pillow (§2.1) | breath, face and brow loops all off; **the three "z" glyphs are pinned VISIBLE**, not deleted |
| Welcome track (§2.2) | `{ duration: 0 }` — the track jumps one stride |
| Cell fade (§2.3) | the below-1200 time-based cross-fade path is taken |
| Welcome exit (§2.5) | **a shortened 180ms cross-fade, not zero** — §11 Trap 11 |
| Tour (§3) | panel fades with no `y`; copy and image swap instantly; dots lose their transition |
| Session plan strip (§4.1) | dots lose their transition; ⚠️ both smooth scrolls unguarded |
| Module stages (§5.1) | **no fade at all** — `stageMotion` becomes `{}` |
| Module chrome (§5.2) | **both bands stay visible permanently** — hiding them *is* the animation |
| Chapter carousel (§5.3) | ⚠️ the nudge is unguarded; the resource-card jump **is** guarded |
| Flip cards (§5.4) | the transition class is dropped, so the card **snaps** to its other face — the rotation still happens, `backface-visibility` needs it |
| Pillow hover (§5.4) | `scale` pinned to 1 |
| Reflection / diary stepper (§5.5, §6.2) | `x: 0` and `y: 0` in the variants; stagger → 0; springs still run but travel nowhere |
| Tick box (§5.5) | `whileTap` dropped; the tick's `initial` skipped |
| Completion badge (§5.6) | loop not started |
| Diary field emphasis (§6.3) | `animate` undefined — field and unit stay put |
| Diary progress bar (§6.4) | `{ duration: 0 }` — the bar jumps |
| Feedback step swap (§7.1) | `y` dropped, duration **0.12s** |
| Mood pillows (§7.2) | `animation: none !important`, from the component's own `@media` block **and** the global one |
| Selection scale + glow (§7.3) | `motion-reduce:transition-none` on both |
| Help bubble (§8.1) | parked at its **drawn rest angle −5.1°**, not 0 |
| FAQ accordion (§8.2) | `{ duration: 0 }`; the panel still unmounts |
| Mascot clock (§10.1) | the effect returns early — the face **stays neutral forever** |
| Awake mascot (§10.2) | `rotate: 0`, breath and float `{ duration: 0 }`; the zzz subtree is gated `asleep && !reduceMotion`, so it never mounts |
| Completion pillow (§10.3) | the imperative `breath.start()` is skipped |

## 13.4 The philosophy to preserve

Three patterns in the table above are this portal's own answers to the question
"what does *reduced* mean here", and they are worth stating as rules rather than
rediscovering:

1. **Suppressing a loop must not amount to deleting the artwork.** The sleeping
   "z"s are pinned *visible*; the help bubble parks at its *drawn* angle, not 0.
2. **A state change is not movement.** The welcome exit keeps a shortened fade
   because an opacity cross-fade carries no motion vector, and making the change
   instantaneous would be answering a different request.
3. **Where hiding something *is* the animation, do not hide it.** The module's
   two chrome bands stay visible permanently rather than teleporting in and out.

---

*Every number in this document was measured against the running app or read from
the source as it now stands. Where a value is still authored-only it is marked as
such, and §13.1 names the single category — reduced motion — where that is true
of a whole section.*
