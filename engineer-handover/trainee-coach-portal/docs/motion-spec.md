# Coach Delivery Portal — Motion Specification

**Purpose.** Every animation in the Coach Delivery Portal and the module player it links into, specified precisely enough to rebuild from this document alone. Every number here was read from source or measured in the running app. Nothing is taken from Figma.

**Source of truth.** Code first. Where `design/design-tokens.md` §74–§79 and the code disagree, **the code wins** and the divergence is called out inline.

**Path convention.** All file paths are relative to
`design/prototype/care2sleep-prototype/src/`.

**Library.** `framer-motion` (imported as `framer-motion`, not `motion/react`). Tailwind v4 for CSS transitions. There is no other animation library. There is no CSS `@keyframes` authored in this project — the only keyframe animation used is Tailwind's own `animate-spin`, plus `animate-ping` which lives in the *researcher* portal and is out of scope here.

---

## 0. How to read this document

Each entry gives:

| Field | Meaning |
|---|---|
| **What moves** | The element, and what property is actually changing |
| **Trigger** | The user action or state change that starts it |
| **Properties** | The exact animated properties |
| **Duration** | Milliseconds. Spring animations state constants instead |
| **Easing** | Exact `cubic-bezier` or framer-motion keyword, or spring constants |
| **Delay / stagger** | Milliseconds |
| **Exit** | What happens on the way out — including "nothing", which is a real answer |
| **File:line** | Where it lives |
| **Perceived as** | Plain English. Numbers alone do not tell you whether something reads as a pop or a glide |

### Easing vocabulary used throughout

| Name in code | Cubic-bezier | Character |
|---|---|---|
| `[0.4, 0, 0.2, 1]` | `cubic-bezier(0.4, 0, 0.2, 1)` | **Symmetric ease-in-out.** The project's house curve. Accelerates and decelerates evenly. Reads as a glide |
| `[0.16, 1, 0.3, 1]` | `cubic-bezier(0.16, 1, 0.3, 1)` | **Expo-out.** Sprints then crawls. Reads as a pop. Deliberately removed from the tour; still used for the dashboard reveal |
| `'easeOut'` | framer-motion keyword → `cubic-bezier(0, 0, 0.58, 1)` | Front-loaded. Reads as a dart at large travel |
| `'easeInOut'` | framer-motion keyword → `cubic-bezier(0.42, 0, 0.58, 1)` | Symmetric, gentler than the house curve |
| `ease-out` (Tailwind class) | `cubic-bezier(0, 0, 0.2, 1)` | CSS-only, used for width transitions |
| `ease-linear` (Tailwind class) | `linear` | Used only for the fake video progress bar |

> **The single most-repeated tuning lesson in this codebase**, recorded because it will otherwise be undone: *what reads as "springy" is the curve plus the travel distance, not the duration.* Round 32 was told the tour was "too springy" three times and shortened the duration twice with no effect. The fix was replacing an expo-out with a symmetric curve and cutting travel from 10 px to 4 px. See `DeliveryTour.tsx:464–473`.
>
> **The second lesson:** *two different easings on two things moving together is most of what reads as wrong.* The tour's spotlight and its card were on different curves; matching them was described as the larger half of "smoother".

---

## 1. `prefers-reduced-motion` — what IS and IS NOT honoured

**Read this section before anything else. It is an accessibility fact you are inheriting, and it is currently inconsistent.**

There are **two independent mechanisms**, and they do not cover the same ground.

### 1.1 The global CSS rule — covers CSS only

`index.css:744–753`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This neutralises **every** Tailwind `transition-*` class (hover fills, `active:scale`, the sidebar width transition, the chevron rotation) and `animate-spin`.

**It does not touch framer-motion.** framer-motion animates inline styles from JavaScript on `requestAnimationFrame` — it never emits a CSS transition, so this rule cannot see it. Any framer-motion animation not explicitly guarded still plays at full strength for a reduced-motion user.

> **Note on `animate-spin` under this rule:** setting `animation-duration: 0.01ms` with `animation-iteration-count: 1` does not hide the spinner — it *freezes* it at an arbitrary rotation. The Plan Sessions loading spinner (`PlanSessionsModal.tsx:262`) therefore renders as a static, slightly-rotated arc for the full 700 ms interstitial. That is a defect, not a design.

### 1.2 `useReducedMotion()` — three components only

| Component | File:line | What it guards |
|---|---|---|
| `DeliveryShell` | `components/delivery/DeliveryShell.tsx:139` | The onboarding→dashboard crossfade, sidebar reveal, page rise, and the stagger. All collapse to `{ duration: 0 }` |
| `DeliveryOnboarding` | `components/delivery/DeliveryOnboarding.tsx:372` | Card springs, text rise, doodle rotation, card pop-in, **and the entire choreographed exit** (`leave()` calls `onComplete` immediately, skipping `EXIT_MS`) |
| `DeliveryTour` | `components/delivery/DeliveryTour.tsx:151` | Overlay fade, spotlight glide, card enter/exit, and the `scrollIntoView` behaviour (`'smooth'` → `'auto'`) |

`Confetti` uses a **different** mechanism — a direct `window.matchMedia` read at `components/delivery/Confetti.tsx:58` — and **skips the burst entirely** rather than freezing a frame. The comment explains why: a frozen mid-burst reads as a bug.

### 1.3 What is NOT honoured — the gap you are inheriting

Every framer-motion animation in the following files plays at full strength regardless of the OS setting:

| File | Unguarded motion |
|---|---|
| `pages/training-v2/player/ModulePlayerPage.tsx:27–31, 270` | Slide enter (16 px rise + fade) on **every** slide change |
| `pages/training-v2/player/ModulePlayerNav.tsx:329–337` | Chapter tree height expand/collapse |
| `components/shared/UnderlineTabs.tsx:100–112` | Sliding tab underline spring |
| `components/shared/Toast.tsx:30–42` | Toast enter/exit |
| `components/research/ConfirmDialog.tsx:126–146` | Every confirm dialog in the portal |
| `components/delivery/AddAnnotationSummaryModal.tsx:416–441` | The reflection wizard's backdrop and panel |
| `components/research/PlanSessionsModal.tsx:811–843` | Plan Sessions backdrop and panel |
| `components/research/EditSessionPlanModal.tsx:268–292` | Edit Session Plan backdrop and panel |
| `pages/training-v2/ModuleTimeline.tsx` (carousel) | `scroll-behavior: smooth` and all `scrollTo({behavior:'smooth'})` calls |

**If you are rebuilding this, the honest fix is one shared `useReducedMotion()` read threaded to every `transition` object, or a `MotionConfig reducedMotion="user"` wrapper at the app root.** The latter is one line and would close the whole gap; framer-motion supports it natively and this project does not use it.

---

## 2. Onboarding — the four-screen welcome flow

`components/delivery/DeliveryOnboarding.tsx` (591 lines)

Four screens on a bare canvas. No card, no sidebar, no pagination dots, no Skip. Artwork on top, copy below it, one or two CTAs below that.

### 2.1 The blob artwork — one path rendered twice, and why

**This is the single most important thing in this file, and it has shipped broken three times.**

The photo card is a torn-paper shape. It needs two things drawn from that shape: a **window** the photo shows through, and a **purple stroke** framing it. The naïve implementation exports two assets from Figma — a mask and an outline — and positions them against each other with transcribed offsets.

**That has failed every time it has been tried in this project:**

- **Round 30**: mask exported at `178.772 × 137.307` against an outline of `180.762 × 143.134`. Two genuinely different shapes, aligned by six hand-transcribed offsets. The photo showed outside the line meant to frame it.
- **Round 31**: measured 9–10 px of drift on *every* blob variant.
- **Round 34**: found again after a re-export.

**The fix is structural, not numerical.** `components/delivery/blobFrame.ts` exports one constant:

```ts
export const BLOB_PATH = 'M89.0146 2.10547C108.303 …'   // blobFrame.ts:19-20
export const BLOB_W = 180.762                            // blobFrame.ts:24
export const BLOB_H = 143.134                            // blobFrame.ts:25
export const BLOB_STROKE_W = 4.09282                     // blobFrame.ts:29
export const BLOB_STROKE = '#A070FF'                     // blobFrame.ts:30
```

That single `d` string is rendered **twice inside one `<svg>` with one `viewBox`** (`DeliveryOnboarding.tsx:292–327`):

1. As a `<clipPath>` (`:306–309`), applied to the `<image>` via `clipPath={url(#…)}`.
2. As a `<path fill="none" stroke={BLOB_STROKE} strokeWidth={BLOB_STROKE_W}>` (`:320–326`).

Because they are the same `d` in the same coordinate space in the same element, **they cannot disagree at any scale or rotation**. The stroke also scales with the card automatically, because it rides the same transform.

Two supporting details:

- `overflow: visible` on the `<svg>` (`:302`) — the stroke is centred on the path, so its outer half would otherwise be clipped by the viewBox edge.
- `clipId` comes from React's `useId()` (`:234`), not an index. SVG ids are document-global; two cards sharing one `clipPath` id silently clip both to the same instance.
- The stroke width `4.09282` in a `180.762` viewBox is `0.022642` of the card width. Figma keeps that ratio constant across every card size, which is *why* one scaled SVG reproduces all twelve exported variants, stroke weight included.

**Do not reintroduce a separate mask asset.** If you take one instruction from this document, take that one.

### 2.2 The `ART_SCALE` system

The three cards are laid out from **one base geometry** times a per-card scale times one global scale.

```
BASE (DeliveryOnboarding.tsx:61-69)  — the smallest card, transcribed once
  innerW 192.259   innerH 153.44
  backBoxW 188.808 backBoxH 153.44
  strokeX 6.84     strokeY 8.06
  imgW 215.789     imgH 323.645     imgX -18.51   imgY -46.9

SIZE (:89-94) — per-card multipliers, all expressed as ratios so they are auditable
  sm = 152.489 / 180.762 = 0.84359
  md = 1
  lg = 218.455 / 180.762 = 1.20851
  xl = 241.711 / 180.762 = 1.33717

ART_SCALE (:86) = 1 / 1.25 = 0.8
```

`ART_SCALE` is a **collective reduction of the entire artwork block** — all three cards plus the doodle layer. It arrived by direct instruction ("scale this section down by 1.5x"), was found too small at `1/1.5`, and was eased back to `1/1.25`. **It is the one number to nudge if the artwork needs resizing.**

Critically, `ART_SCALE` multiplies into each card's `scale` **and** into the derived bounding box, so the block's *layout* height shrinks with it, not just its painted size. A plain `transform: scale()` on the container would leave the original box behind and the copy and CTAs below would not move up.

**Effective per-card scale** `k = SIZE[…] × ART_SCALE`:

| Card size | k |
|---|---|
| sm | 0.67487 |
| md | 0.8 |
| lg | 0.96681 |
| xl | 1.06974 |

#### Rotated bounding boxes are derived, never transcribed

```ts
function boundingBox(w, h, deg) {          // :102-107
  const rad = Math.abs(deg) * Math.PI / 180
  return { width:  w*cos(rad) + h*sin(rad),
           height: w*sin(rad) + h*cos(rad) }
}
```

This must be computed rather than hardcoded because **the wrapper has to resize continuously while the rotation animates**. It reproduces all seven distinct frame values to within 0.011 px.

#### The artwork block height is pinned

```ts
const ART_BLOCK_H = max over all screens and cards of
    boundingBox(BASE.innerW*k, BASE.innerH*k, rotate).height   // :202-209
```

**Measured live: `178.422px`.** (Verify: `xl` at `-4.1°` → `164.14·cos(4.1°) + 205.67·sin(4.1°) = 178.43`.)

The row is locked to this height so that the middle card growing between screens 2 and 3 does not push the copy and the CTAs down. Derived from the same function the cards lay themselves out with, so it cannot fall out of step with them.

### 2.3 Per-screen card states

`SCREENS` (`:145–193`), `SETTLED` (`:139–143`).

| Screen | Card 1 (rot / size / marginRight) | Card 2 | Card 3 |
|---|---|---|---|
| 1 "Welcome to Care2Sleep" | `-1°` / md / 16 | `5°` / **lg** / 16 | `-2°` / sm / 0 |
| 2 "The COACH training pathway" | `5.57°` / md / 16 | `-4.1°` / **lg** / 16 | `2.93°` / sm / 0 |
| 3 "Coaching your clients" | `5.57°` / md / **−8** | `-4.1°` / **xl** / **−8** | `2.93°` / sm / 0 |
| 4 "Explore your dashboard" | identical to screen 3 (`SETTLED`) | | |

**The middle card's growth is the flow's one real size animation: `lg → xl`, i.e. `1.20851 → 1.33717`, between screens 2 and 3.** Because it is one element scaling rather than two assets swapping, it animates continuously. That is the entire justification for the derived-geometry system: an asset swap would be a hard cut and could not be animated at all.

`marginRight` goes **negative** on screens 3–4 (`−8`, scaled by `ART_SCALE` → `−6.4 px`) because the frames overlap the cards there where screens 1–2 space them by 16 px. A negative `gap` is invalid CSS, so the offset lives on the child (`:112–114`).

`LEAD_CARD_NUDGE = 12` (`:127`) shifts the leading card left without moving its siblings, applied as `−12` left margin **and** `+12` right margin on the same element (`:246–247`) so the row's total width is unchanged and the flex centring does not compensate by shifting the whole group.

### 2.4 Onboarding animations

#### A. Card entrance ("pop in") — screen 1 only

| | |
|---|---|
| **What moves** | Each `PhotoCard`'s inner transform wrapper: `opacity` and `scale` |
| **Trigger** | Mount of screen 1 |
| **Properties** | `opacity 0 → 1`, `scale (k × 0.86) → k`, `rotate` held at its resting value |
| **Duration** | Spring for scale/rotate; `opacity` is a discrete `0.34 s` tween |
| **Easing** | `type: 'spring', stiffness: 90, damping: 16, mass: 0.9` (`:406`) |
| **Delay / stagger** | `POP_IN_DELAYS = [0.14, 0.02, 0.26]` s (`:215`) — cards 1, 2, 3 |
| **Exit** | None. `popped` state latches `true` on completion (`:263`) so the delay never applies again |
| **File:line** | `:211–215`, `:232`, `:258–268` |
| **Perceived as** | Three cards popping onto the canvas slightly out of order, over about a third of a second. Deliberately **irregular and not left-to-right** — an even stagger reads as a mechanical sweep. Fixed values rather than randomised, so every load and every screenshot is identical. |

> The entrance scale is `scale × 0.86`, **not a flat `0.86`**. Entering at 86 % of the card's *own* target scale means a card never overshoots the size it is settling to (`:255–257`).

#### B. Card rearrangement between screens

| | |
|---|---|
| **What moves** | Wrapper `width`/`height`/`marginLeft`/`marginRight`, and inner `rotate`/`scale` |
| **Trigger** | `step` change (Go next / Go back) |
| **Properties** | All of the above simultaneously, on one shared transform |
| **Duration** | Spring — `stiffness: 90, damping: 16, mass: 0.9` (`:406`). Damping ratio ≈ 0.89, so slightly under-damped: a very small overshoot, no visible bounce |
| **Easing** | n/a (spring) |
| **Delay** | 0 |
| **Exit** | n/a — cards persist across screens |
| **File:line** | `:240–268`, `artTransition` at `:404–406` |
| **Perceived as** | The three cards **settle** into a new arrangement rather than snapping. Sizes, angles and spacing all change together. On screens 2→3 the centre card visibly grows. |

Because rotation and scale ride **one** transform (`:258–262`) and all layers sit inside it, the photo's clip stays locked to its outline at *every intermediate frame*, not just at the four resting states.

#### C. Doodle rotation — cumulative and sparse

`components/delivery/Doodles.tsx`

| | |
|---|---|
| **What moves** | Nine `<motion.g>` groups' `rotate` |
| **Trigger** | `step` change |
| **Properties** | `rotate` only |
| **Duration** | Same spring as the cards (`artTransition` is passed straight through, `Doodles.tsx:57`) |
| **Delay** | 0 |
| **Exit** | None |
| **File:line** | `DOODLE_SPIN` `:43–53`, `rotation()` `:66–67`, `SPIN_ORIGIN` `:22` |
| **Perceived as** | Small incidental drift in the decorative layer — a few stars and clouds turning a little as the screen changes. Never all nine at once. |

**Rotation is cumulative.** `rotation(name)` sums every delta up to and including the current step, so a doodle carries on from where the previous screen left it rather than snapping back to zero.

```
DOODLE_SPIN (degrees, index 0 unused — nothing rotates on arrival at screen 1)
  star-left            [0,  14,   0,  -9]
  cloud-topleft        [0, -10,   0,  12]
  cloud-bottomright    [0,   0,  13,   0]
  sparkle-a            [0,  18,   0,   0]
  tick-right           [0,   0, -15,  11]
  star-right           [0, -12,   0,  16]
  sparkle-b            [0,   0, -17,   0]
  asterisk-a           [0,  10,  14,   0]
  asterisk-b           [0,   0,   0,  20]
```

**Two rules these values must respect, both learned by measurement after a first pass was reported as "only two doodles move, clouds don't move" — when all nine were in fact rotating:**

1. **Deltas under ~8° are invisible** on shapes this small. The first pass used 3–9° and only the two 9° ones registered.
2. **Deltas must not cancel.** The top-left cloud went `−3` then `+4` — a net 1° across the entire flow, so it genuinely never appeared to move. Every doodle now ends clearly away from where it started.

`SPIN_ORIGIN` is `{ transformBox: 'fill-box', transformOrigin: 'center' }`. Without `fill-box`, the origin is the whole 700 × 251 canvas and the outer doodles swing across the layout instead of spinning in place.

The layer is `700.023 × 251.081` at `ART_SCALE`, absolutely centred over all three cards (`DeliveryOnboarding.tsx:466–471`).

#### D. Title and copy rise

| | |
|---|---|
| **What moves** | `<h1>`, body `<p>`, optional note `<p>` — `opacity` and `y` |
| **Trigger** | `step` change |
| **Properties** | `opacity 0 → 1`, `y 10 → 0` px |
| **Duration** | **420 ms** |
| **Easing** | `cubic-bezier(0.4, 0, 0.2, 1)` |
| **Stagger** | `staggerChildren: 0.08` s (80 ms) — title leads, body follows one beat behind, note a beat after that |
| **Exit** | Reverse variant `{ opacity: 0, y: 10 }` under `AnimatePresence mode="wait"` |
| **File:line** | `textRise` `:346–349`, `textTransition` `:412–414`, variants `:504–540` |
| **Perceived as** | The heading lifts into place, the copy follows just behind it. Soft, unhurried, no bounce. |

> This was **softened on direct instruction** ("make it more subtle"). Travel dropped 8 px → 3 px in the original note and now sits at 10 px with the symmetric curve; the easing moved off `easeOut` — which front-loads its speed and reads as a dart — onto `[0.4, 0, 0.2, 1]`. Slightly longer duration, because a smaller move over a longer time is what reads as subtle. Same reasoning the tour arrived at independently.

#### E. The invisible sizer — not an animation, but it is why nothing jumps

`:488–502`. Every screen's copy is rendered **at once** in one CSS grid cell: three inert `aria-hidden` copies plus the live one, all in `col-start-1 row-start-1`. The inert copies size the cell to the tallest screen, so the CTA row below never moves as the body copy changes length.

**The trap, and it has bitten:** the sizer copies must carry the **identical classes** as the live markup. Round 34's sizer title omitted `text-balance`, wrapped to two lines where the live title wrapped to one, and reserved a phantom line that pushed the CTA row down. If you change the live title's classes, change all four.

Sized this way rather than with a fixed `px` height because the number depends on where the copy wraps, which changes with viewport width — a magic number would only be correct at one size.

### 2.5 The choreographed exit into Home

**This is the flow's most complex moment and the client specifically asked for it to be documented. It is a three-part exit with overlapping clocks, handed off to a shell that plays a fourth part on top.**

Trigger: pressing **"Go to my dashboard"** on screen 4 → `leave(HOME_PATH)` (`:377–387`).

```ts
const EXIT_MS = 820                                   // :362
function leave(to) {
  if (reduceMotion) { onComplete(to); return }        // :379-382  ← exit skipped entirely
  setExiting(true)
  window.setTimeout(() => onComplete(to), EXIT_MS)    // :383-384
}
```

The three parts leave on **their own clocks, not as one block**:

| Order | Part | Properties | Duration | Delay | Easing | File:line |
|---|---|---|---|---|---|---|
| 1st | **Buttons** | `opacity 1 → 0` | **200 ms** | 0 | `easeOut` | `:554–557` |
| 2nd | **Copy block** | `opacity 1 → 0` | **340 ms** | **60 ms** | `easeOut` | `:483–486` |
| 3rd | **Artwork** | `scale 1 → 0.78`, `opacity 1 → 0` | **820 ms** (= `EXIT_MS`) | 0 | `cubic-bezier(0.4, 0, 0.2, 1)` | `:443–447` |

**Why this order, in the author's own words (`:351–361`):** *the buttons go first and quickest — they are what was just clicked, so leaving them behind reads as the click not registering. The copy follows. The artwork shrinks across the whole exit so there is still something moving when the rest has gone.*

**Perceived as:** press the button, the buttons vanish almost immediately, the words fade, and the photograph collection shrinks and dissolves toward the centre of the screen while the dashboard rises up underneath it.

#### The handoff — the two screens OVERLAP

`components/delivery/DeliveryShell.tsx:254–351`

At `EXIT_MS` (820 ms) the callback fires, `onboardingDismissed` flips, and the shell swaps children. **Both screens live in one CSS grid cell** (`:273`, both children `col-start-1 row-start-1`) so they stack rather than sitting end to end. The onboarding holds `z-10` on its way out (`:278`).

**This replaced `mode="wait"`,** and the reason matters: `mode="wait"` runs them strictly in sequence, so the canvas passes through a **fully blank frame** at the changeover. Round 32 found that blank frame is what made the handoff read as a *cut* rather than a fade, and lengthened both halves (0.26/0.34 → 0.4/0.55 s) to compensate. Overlapping removes the blank entirely, so the fade-out and the arrival are one movement instead of two.

| Layer | Properties | Duration | Delay | Easing | File:line |
|---|---|---|---|---|---|
| Onboarding wrapper exit | `opacity → 0` | **250 ms** | 0 | `easeInOut` | `dismiss` `:156`, applied `:282` |
| Sidebar | `opacity 0→1`, `x −8 → 0` | **850 ms** | **300 ms** | `cubic-bezier(0.16, 1, 0.3, 1)` | `:232–241`, `reveal` `:160` |
| Hero band (if any) | `opacity 0→1`, `y 12 → 0` | **850 ms** | **300 ms** | `cubic-bezier(0.16, 1, 0.3, 1)` | `pageRise` `:159`, `:308–310` |
| Page body | same | **850 ms** | **300 + 160 = 460 ms** | same | `staggerChildren: 0.16` + `delayChildren: 0.3` at `:299–304` |
| `motion.main` itself | `opacity 0→1`, `y 8 → 0` | **300 ms** | 0 | `easeOut` | `pageMotion` `:60–65` |

Constants:

```ts
const PAGE_REVEAL_DELAY_S    = 0.3   // :38
const SIGEBAR_REVEAL_DELAY_S = PAGE_REVEAL_DELAY_S   // :39  (sidebar and hero land together)
```

The onboarding wrapper's own fade is deliberately **short (250 ms)** because by the time it runs, `DeliveryOnboarding` has already played itself off screen. This is just the empty wrapper leaving; a long fade here would be a second, invisible wait stacked on top (`:152–155`).

`initial={false}` on the sidebar's `AnimatePresence` (`:230`) is load-bearing: **every `/delivery` page mounts its own shell**, so without it the sidebar would fade in again on every in-app navigation. With it, a shell that mounts already-onboarded renders the nav outright and only a *change* of presence animates.

**Full timeline from the click:**

```
   0 ms   click "Go to my dashboard"
   0 ms   buttons begin 200 ms fade
  60 ms   copy begins 340 ms fade
   0 ms   artwork begins 820 ms shrink-to-0.78 + fade
 820 ms   onComplete() → shell swaps children
 820 ms   onboarding wrapper begins 250 ms fade out   ┐ these overlap
 820 ms   main begins 300 ms rise                     │
1120 ms   sidebar + hero begin 850 ms rise            ┘
1280 ms   page body begins 850 ms rise
1970 ms   hero settled
2130 ms   body settled  ← TOUR_START_DELAY_MS lands here
```

`TOUR_START_DELAY_MS = (0.3 + 0.16 + 0.85) × 1000 + 40 = 1310 ms` (`DeliveryShell.tsx:58`), measured **from the callback**, i.e. 2130 ms from the click.

**Live-measured: 2201 ms from click to the tour dialog being in the DOM** (50 ms polling granularity + React commit). Confirms the arithmetic.

**Why the delay is written as a sum rather than a literal (`:50–57`):** *the tour measures the elements it points at, and measuring them mid-fade — while `motion.div` still has a `transform` on the page — is how a coachmark ends up beside where its anchor was.* It was `590 ms` when the handoff was a plain 0.4/0.55 crossfade; every number it depends on has since changed. **If you retune any reveal value above, this expression updates itself. If you replace it with a literal, the tour will break silently.**

---

## 3. The first-run tour — seven coachmarks

`components/delivery/DeliveryTour.tsx` · copy and anchors in `data/deliveryTour.ts`

Two walkthroughs share one component: `DELIVERY_TOUR_STEPS` (**7 steps**, trainee) and `COACH_TOUR_STEPS` (**5 steps**, certified coach). **Live-verified: the trainee tour reports "Step 1 of 7".**

### 3.1 Structural facts that are load-bearing

| Fact | File:line | Why |
|---|---|---|
| **The overlay is portalled to `document.body`** | `:353`, `:571` | `DeliveryShell` renders content inside a `motion.main`. A transformed ancestor becomes the containing block for `position: fixed` descendants, so an overlay rendered in place silently offsets itself and stops covering the sidebar — where three of the seven anchors live |
| **`AnimatePresence` wraps the *whole* portal** | `:366`, `:570` | A component that returns `null` when inactive can never play an exit. This keeps the last subtree alive for the length of the fade, which is why everything below tolerates `step === undefined` |
| **The dim is an SVG rect masked minus a rounded hole** | `:385–421` | Not a giant `box-shadow` spread. Round 17 rejected box-shadow for a reason it later marked *unproven*, so this is not presented as the only way — it is the one known to work here |
| **`pointer-events-none` on the SVG + a sibling click-catcher** | `:385`, `:425–431` | So the hole does not have to be punched out of the click target too |

### 3.2 Tour animations

#### A. Overlay fade — the whole scrim, not just the card

| | |
|---|---|
| **What moves** | The entire portal wrapper's `opacity` — dim, card, arrow, everything |
| **Trigger** | `active` flipping true / false |
| **Properties** | `opacity 0 → 1` |
| **Duration** | **450 ms** |
| **Easing** | `easeOut` |
| **Delay** | 0 (the delay is upstream, in `TOUR_START_DELAY_MS`) |
| **Exit** | `opacity → 0`, same 450 ms |
| **Reduced motion** | `initial={false}`, `{ duration: 0 }` |
| **File:line** | `:368–375` |
| **Perceived as** | The screen gently darkens and the first coachmark appears with it. |

> **This exists because of a specific report: the tour opening felt "instant and hard".** The dashboard arrived on a gentle 850 ms curve and then a full-strength scrim dropped over it in a **single frame**. Fading the scrim — in *and* back out on Done — is what makes the tour open and close as one soft change. Fading only the card was not enough.

Dim colour: `rgba(15, 10, 30, 0.55)` (`:418`).

#### B. Spotlight glide

| | |
|---|---|
| **What moves** | The `<motion.rect>` inside the SVG mask: `x`, `y`, `width`, `height` |
| **Trigger** | Step change, and any anchor re-measure (scroll, resize) |
| **Properties** | All four |
| **Duration** | **500 ms** |
| **Easing** | `cubic-bezier(0.4, 0, 0.2, 1)` — **deliberately identical to the card's** |
| **Delay** | 0 |
| **Exit** | n/a — the rect persists; the whole overlay fades |
| **`initial={false}`** | Yes (`:401`) — so the very first step opens with the hole already around its anchor, rather than playing a shape growing out of the top-left corner |
| **File:line** | `:399–409` |
| **Perceived as** | The lit region slides and reshapes itself from one card to the next. |

Hole geometry: anchor rect inflated by `HOLE_PAD = 8` px on every side (`:38`, `:342–349`), corner radius `HOLE_RADIUS = 8` px (`:42`). 8 px on direct instruction — 16 px (the `Card` radius) read as a much softer shape than the cards it cuts around.

> **Two findings recorded here so they are not rediscovered:**
>
> 1. **The glide is the larger half of "smoother".** Before it, the card was already fading but the spotlight underneath it was snapping between boxes in one frame. That snap is what the eye actually caught.
> 2. **A mask `rect` has no layout box.** `getBoundingClientRect()` on it returns `0`, so an attempt to prove the spotlight was animating "showed" it frozen. framer-motion animates SVG `x`/`y` as a **CSS transform** and `width`/`height` as px-suffixed **attributes**. Inspect the transform, not the rect.

#### C. Coachmark card enter / exit

| | |
|---|---|
| **What moves** | The card: `opacity` and `y` |
| **Trigger** | Step change |
| **Enter** | `opacity 0 → 1`, `y 4 → 0` px · **500 ms** · `cubic-bezier(0.4, 0, 0.2, 1)` |
| **Exit** | `opacity → 0`, `y → −3` px · **300 ms** · `easeInOut` |
| **Mode** | `AnimatePresence mode="wait"` with `key={index}` |
| **File:line** | `:446–473` |
| **Perceived as** | Each coachmark cross-dissolves in place with the faintest hint of upward direction. It does **not** travel. |

**`key={index}` is what stops the card travelling.** A single persistent card animating its own `top`/`left` slid diagonally across the whole viewport between steps — reported as "flys in randomly", and fairly: the path was a straight line between two unrelated anchors and meant nothing. Remounting per step replaces that with a fade in place.

**The exit timing rides on the variant, not the shared `transition` prop** (`:456–458`) — framer-motion has no `exit` key on `transition`, and putting one there is a type error rather than a silent no-op.

> **The tuning history, because it will otherwise be re-litigated.** Four rounds of feedback: "too fast", "too fast" again, then **"too springy"**. The springiness was the **curve**, not the duration. `[0.16, 1, 0.3, 1]` is an expo-out — it sprints then crawls to a halt — and at 10 px of travel plus a `scale` up, that lands as a *pop*. The shipped version is a symmetric ease with **a quarter of the travel and no scale at all**, so what remains is essentially a cross-dissolve with a hint of direction.

#### D. Scroll behaviour

`:214–217`

```ts
el.scrollIntoView({
  block: 'center',
  behavior: reduceMotion || index === 0 ? 'auto' : 'smooth',
})
```

**The opening step scrolls instantly; every later step scrolls smoothly.** This is deliberate and the reason is subtle: the spotlight is a fixed-position hole that re-measures its anchor every 60 ms, so while the page smooth-scrolls the anchor into view **the hole chases it up the viewport** — which read as the highlight "coming from the bottom, bouncy". Its own 500 ms ease running against that travel is what added the overshoot. The entrance is carried instead by the overlay's 450 ms fade.

**Anchor re-measurement:** `setInterval(measure, 60)` for **700 ms** after each step change (`:229–230`), plus listeners on `resize` and capturing `scroll`. One measurement is not enough because the smooth scroll is still running for several frames.

#### E. Scroll lock

`:299–311`

```ts
root.style.overflow = 'hidden'
if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
```

`overflow: hidden` on `<html>` is chosen **over a wheel/touch event blocker** because it stops *user* scrolling while leaving **programmatic** scrolling intact — which this component's own `scrollIntoView` depends on. An event blocker would have had to whitelist its own calls.

The padding compensates for the scrollbar the lock removes. Without it the page jumps ~15 px wider the instant the tour opens, **moving every anchor it is about to measure**. (Live-measured on this machine: `paddingRight` stayed `""` because macOS overlay scrollbars give `scrollbar === 0`. It will fire on Windows.)

#### F. Focus — two bugs worth inheriting the fixes for

`:273–282`

```ts
const focusedFor = useRef<HTMLElement | null>(null)
useEffect(() => {
  if (!active) { focusedFor.current = null; return }
  if (!pos || !cardEl || focusedFor.current === cardEl) return
  focusedFor.current = cardEl
  headingRef.current?.focus({ preventScroll: true })
}, [active, cardEl, pos])
```

1. **`.focus()` on a `visibility: hidden` element silently does nothing.** The card is `visibility: hidden` until placed (`:479`) so it never flashes at the top-left corner. A first pass focused on `active` alone and measured `activeElement` still on `#main-content` — the tour opened with focus **outside its own dialog**, so Tab reached the page behind the dim. Hence the `pos` guard.
2. **The guard must key on the card *element*, not the step index.** Under `mode="wait"` the incoming card mounts ~280 ms *after* the index changes, so an index-keyed guard fired early against the **outgoing** card, marked the step done, and refused to fire for the real one. Measured: focus landed on the page's "Skip to main content" link on every step after the first.

**Live-verified: `document.activeElement.id === 'delivery-tour-title'` immediately on open.**

`cardEl` is React **state**, not a ref (`:160`), for the same `mode="wait"` reason — a ref would still be null (or pointing at the outgoing card) when the placement effect ran.

On finish (`:174–186`): `window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })`, then focus to `#main-content` with `preventScroll: true`. The scroll-to-top exists because the tour scrolls the page to centre each anchor and then locks it, so wherever the last step left it is an arbitrary position the coach never chose.

#### G. Card placement algorithm

`place()` at `:111–144`. Not an animation, but the card's position is what the glide animates *to*.

- Preference order: the step's own `prefer`, then `right`, `bottom`, `left`, `top` (`:122`).
- `ARROW_OFFSET = 11` px (`:36`) — a 16 px square rotated 45° protrudes `16/√2/2 × 2 ≈ 11.3`, rounded to 11.
- `VIEWPORT_MARGIN = 16` px (`:44`).
- `CARD_W = 320` px (`:34`). **Live-measured: `320px`.**
- **Card height is passed in measured, not assumed** (`:106–110`): the frame draws every card at 421 px, but the copy is real and a narrow viewport can wrap it taller. Placing against a hardcoded height is how a card ends up hanging off the bottom of the screen on the one step whose text ran long.
- Clamping happens **last**, so a card that fell back to a cramped side still lands fully on screen.

---

## 4. Confetti — a 20-frame PNG sequence

`components/delivery/Confetti.tsx`

| | |
|---|---|
| **What moves** | Twenty stacked `<img>` elements; only `opacity` switches between them |
| **Trigger** | `play` prop true — set unconditionally by `CertificationBanner` (`DeliveryHomePage.tsx:980`) |
| **Frame rate** | `FRAME_MS = 130` ms/frame ≈ **7.7 fps**, **2.6 s per pass** |
| **Loop** | `PASSES_PER_ROUND = 8` back-to-back passes ≈ **20.8 s**, then `PAUSE_MS = 10_000` (**10 s**), then repeat indefinitely |
| **During the pause** | **All twenty `<img>` elements unmount** (`frame` set to `−1`, gated at `:109`) |
| **Reduced motion** | **Skipped entirely** — `window.matchMedia('(prefers-reduced-motion: reduce)').matches` returns early at `:58`, so nothing renders |
| **File:line** | `:27–43` constants, `:50–95` loop, `:97–124` render |
| **Perceived as** | A burst of confetti erupting over the left half of the congratulations card, falling out, and immediately erupting again — eight times — then a ten-second lull before it starts over. |

### Why not a GIF, and why not a particle system

Both were considered and rejected for measured reasons (`:15–25`):

- **GIF** — a first export from Figma came back **3840 × 142**, a 27:1 ribbon that is unusable, and GIF's 1-bit alpha would fringe every confetti piece against the card's yellow ground. There is also no GIF encoder available in this build environment.
- **SVG frames** — smaller over the wire, but each frame carries 100+ paths and swapping them **re-rasterises all of it every tick**. A bitmap blit is what keeps this smooth on the low-end devices this audience uses.
- **A particle system** — the frames are the designer's own hand-keyed animation. A generative system would not reproduce it, and reproducing it is the point.

The file-size curve confirms it is a genuine burst rather than a loop: ~8 KB at frame 1, peaking around frame 5 as the confetti fills the frame, tapering back to ~8 KB by frame 20 as it falls out. 440 KB for the set at 1400 × 1080.

### Two implementation details that are not optional

**1. All twenty frames are mounted and only `opacity` is switched** (`:110–121`). Swapping a single `<img>`'s `src` would **decode mid-animation and stall**. This way all twenty are decoded before the first paint of a round, and each tick touches only a compositor property.

**2. The pause is what makes this affordable to leave running.** Twenty decoded 1400 × 1080 bitmaps is the expensive part. Dropping to `frame === -1` unmounts every `<img>`, handing that memory back between rounds instead of holding it for as long as the coach sits on the page. The files stay in the HTTP cache, so the next round re-decodes rather than re-downloads.

### The transparency trap — this WILL recur on re-export

**The exported PNGs were not transparent.** Figma baked a solid `#f5f5f5` plate into every variant, so all **1,512,000 pixels** of each frame came back opaque despite being RGBA — measured, not guessed — which is why the confetti first arrived sitting on a grey card instead of over the yellow. The committed frames have had that plate removed and their anti-aliased edges un-blended from it (96.7 % transparent).

**Re-exporting from Figma will reintroduce it** unless the variant backgrounds are cleared there first. **A PNG being RGBA does not mean it is transparent — count the alpha channel.**

### Placement

`:105–108`. `absolute inset-y-0 left-0 w-1/2 overflow-hidden`, images `object-cover`.

**The card's left half, full height** — the burst sits behind the photo and the start of the copy rather than washing over the whole card. At the card's 1096 × 400 that is a 548 × 398 box, within a whisker of the artwork's own 1.296 aspect, so `object-cover` crops ~25 px of height and distorts nothing. **Stretching it across the full card (`object-fill`) compressed the burst 2.7× vertically and every piece read as a flattened smear.**

---

## 5. The module player

`pages/training-v2/player/`

### 5.1 Slide transition

| | |
|---|---|
| **What moves** | The whole slide container: `opacity`, `y` |
| **Trigger** | `safeStepIndex` change — footer Next/Previous, arrow keys, or an outline-rail jump |
| **Properties** | `opacity 0 → 1`, `y 16 → 0` px |
| **Duration** | **250 ms** |
| **Easing** | `easeOut` |
| **Delay** | 0 |
| **Exit** | **None.** There is no `AnimatePresence` — `key={safeStepIndex}` remounts the div, so the outgoing slide is destroyed instantly and the incoming one rises in |
| **Reduced motion** | **Not honoured** |
| **File:line** | `stepMotion` `ModulePlayerPage.tsx:27–31`; applied `:270` |
| **Perceived as** | A hard cut out, then the new slide lifts 16 px into place over a quarter of a second. Slightly asymmetric — you never see the old slide leave. |

The player shows **one slide at a time**. It previously kept every visited slide mounted in a vertical scroll-stack with `scroll-snap-type: y mandatory`; **that whole mechanism was removed in Round 33.** If you find references to a scroll stack or snap points in older documentation, they describe deleted code.

`overflow-y-auto` remains on `<main>` (`:264`) and is deliberate: 3 of Chapter 1's 7 slides genuinely exceed a 622 px content area at an 802 px window, and clipping them would put real content out of reach. Nothing scrolls when a slide fits.

### 5.2 Slide heading focus

`SlideLayout.tsx:84–86`

```ts
useEffect(() => { if (isCurrent) headingRef.current?.focus() }, [title, isCurrent])
```

Focus moves to the slide's own heading whenever `title` changes. Covers both a new `SlideLayout` mounting for a new step **and** one long-lived instance's title changing internally (knowledge check's five questions are all one step). `isCurrent` also decides `h1` vs `h2` — exactly one `<h1>` at a time.

> Note the doc comment above it (`:42–61`) still describes the deleted scroll-stack. The **behaviour** it describes is correct; the *reason* given is stale.

### 5.3 Outline rail expand / collapse (the whole rail)

| | |
|---|---|
| **What moves** | The `<nav>`'s `width` |
| **Trigger** | The 44 px header button (`PanelLeftClose` ⇄ `Menu`) |
| **Properties** | `width: 330px ⇄ 76px` |
| **Duration** | **200 ms** |
| **Easing** | Tailwind `ease-out` = `cubic-bezier(0, 0, 0.2, 1)` |
| **Mechanism** | **CSS transition**, not framer-motion: `transition-[width] duration-200 ease-out` + `overflow-x-hidden` |
| **Reduced motion** | **Honoured** (CSS, so the global rule catches it) |
| **File:line** | `ModulePlayerNav.tsx:136`, `:139`; constants `:45–46` |
| **Perceived as** | The rail slides closed to a narrow strip; its contents clip away rather than reflowing. |

```ts
export const OUTLINE_RAIL_OPEN_PX = 330       // ModulePlayerNav.tsx:45
export const OUTLINE_RAIL_COLLAPSED_PX = 76   // :46
```

**These are exported for a reason.** The footer's Previous/Next pair must stay centred on the *content column*, so it reserves `railWidth + 32` px. A first pass hardcoded 330 px in the footer while the open state lived privately inside the rail — the slide pair then sat **127 px off centre** whenever the rail was collapsed. The collapsed state was lifted to `ModulePlayerPage` (`:98`) and both files read the same two constants. A stray flex `gap-8` then added another 32 px on top, hence `lg:gap-0`.

**A fixed offset cannot centre against a collapsible rail. Do not reintroduce one.**

### 5.4 Chapter tree height animation

| | |
|---|---|
| **What moves** | The `<motion.div>` wrapping a chapter's sub-step list |
| **Trigger** | The chevron button on a chapter row |
| **Properties** | `height: 0 ⇄ 'auto'`, `opacity: 0 ⇄ 1` |
| **Duration** | **280 ms** |
| **Easing** | `cubic-bezier(0.4, 0, 0.2, 1)` — symmetric **both ways** |
| **Exit** | Same values reversed, same duration. **The list unmounts on exit** |
| **`initial={false}`** | Yes (`:329`) — the default-open chapter does not play an expand on mount |
| **Reduced motion** | **Not honoured** |
| **File:line** | `ModulePlayerNav.tsx:329–337`, `overflow-hidden` at `:337` |
| **Perceived as** | The chapter's steps unroll smoothly beneath it, and roll back up the same way. |

**Two things here are accessibility-load-bearing:**

1. **A symmetric ease both ways.** An asymmetric curve is most of what reads as a springy or abrupt open — the same finding the tour arrived at.
2. **The list genuinely unmounts on exit.** This project has a standing rule, earned in Round 20: *animated `height: 0` is not concealment.* Content inside a zero-height `overflow: hidden` box stays **focusable and in the accessibility tree** — Round 20 shipped 11 invisible tab stops that silently changed a master-detail selection. Here the `AnimatePresence` child is removed rather than collapsed, so there is nothing left to focus. **If you rebuild this with a CSS height transition, you must add `inert` + `aria-hidden` while closed.**

### 5.5 Chevron rotation

`ModulePlayerNav.tsx:307–316`. `rotate-180` toggled via class, `transition-transform duration-200`, default Tailwind ease. CSS, so reduced motion is honoured. 20 px glyph, deliberately not the frame's 12 × 6 vector which reads as a hairline.

### 5.6 Footer buttons

`ModulePlayerFooter.tsx`. All CSS only.

- "Go Back Home" (`:97`): `transition-colors`, hover fills `bg-primary` with white icon and label.
- Previous / Next pills (`:118`, `:137`): `272 × 44` px, `transition-all`.

No framer-motion in this file.

### 5.7 The fake video player

`pages/training-v2/player/VideoPlaceholder.tsx`

| | |
|---|---|
| **What moves** | A progress bar's `width`, 0 → 100 % |
| **Trigger** | Pressing Play |
| **Duration** | `SIMULATED_DURATION_MS = 3200` ms (`:18`) |
| **Tick rate** | `setInterval(…, 80)` ms (`:70`) — ~12.5 updates/s |
| **Bar easing** | `transition-[width] duration-100 ease-linear` (`:116`) — each 80 ms tick eases over 100 ms, so the bar reads as continuous rather than stepped |
| **File:line** | `:60–80` timer, `:116` bar |
| **Perceived as** | A thumbnail with a play button; pressing it fills a progress bar over ~3 seconds and the state flips to "Watched". |

> **This is scaffolding.** The badge above the bar displays the source document's real estimate (e.g. "~4–5 min") while the simulated watch-through takes 3.2 seconds. There are no video assets. An engineer must not read `SIMULATED_DURATION_MS` as a design value.

---

## 6. Shared UI motion

### 6.1 Tab underline — `layoutId` spring

| | |
|---|---|
| **What moves** | A single `h-0.5 bg-primary` span, shared across tabs by `layoutId` |
| **Trigger** | Tab selection (click, or arrow keys via roving tabindex) |
| **Properties** | Position and width, via framer-motion's shared-layout system |
| **Duration** | Spring — **`stiffness: 500, damping: 35`** |
| **Damping ratio** | ≈ 0.78 (assuming unit mass) — under-damped, so a very slight settle, no visible bounce |
| **Exit** | n/a |
| **Reduced motion** | **Not honoured** |
| **File:line** | `components/shared/UnderlineTabs.tsx:100–112` |
| **Perceived as** | The purple rule slides briskly under the newly selected tab and settles instantly. |

**`layoutId` must be unique per mounted tab row on a page.** Two rows sharing one id makes framer-motion animate a single underline *between* them, which looks like a bug (`:23–24`). Call sites in this portal:

| Call site | `layoutId` | File:line |
|---|---|---|
| Client detail page tabs | `delivery-consumer-detail-tab-underline` | `pages/delivery/DeliveryConsumerDetailPage.tsx:2382–2390` |
| Pre-session checklist sub-tabs | `delivery-pre-session-checklist-underline` | same file `:1988` |
| Day-grouped meetings tabs | `${idNamespace}-tab-underline` | `components/shared/MeetingsSection.tsx:267` |

`MeetingsSection` takes an `idNamespace` prop **precisely because** it can be mounted more than once on a page.

**Note a live inconsistency:** tab labels are `text-[15px]` (`UnderlineTabs.tsx:94`) while every button in the app is `text-caption-medium` (14/500). This diverged in Round 28 and is a known open item, not an oversight.

### 6.2 Toast

| | |
|---|---|
| **What moves** | `opacity`, `y` |
| **Trigger** | A confirmation message being set |
| **Enter** | `opacity 0 → 1`, `y 8 → 0` px · **180 ms** · `easeOut` |
| **Exit** | Same reversed, 180 ms, under `AnimatePresence` |
| **Auto-dismiss** | `setTimeout(onDismiss, 4000)` — **4 seconds** |
| **Semantics** | `role="status"` — self-announcing |
| **File:line** | `components/shared/Toast.tsx:25`, `:30–42` |
| **Perceived as** | A small pill slides up from just below its resting place, sits for four seconds, and fades away. |

Extracted at its **fifth** caller. **Four earlier call sites still inline their own copy** — `OnboardCoachDialog`, `AddAnnotationSummaryModal` (`:998`, which has *no motion at all*, a plain conditional mount), and twice in `SpacesCoachProfilePage`. Migrating them is a mechanical follow-up that has not been done.

### 6.3 Modal chassis — backdrop and panel

**Every modal in the portal uses the same two values.** They are duplicated across four files rather than shared, so if you change one, change all four.

| | |
|---|---|
| **Backdrop** | `opacity 0 → 1 → 0` · **150 ms** · default ease · `bg-black/25` |
| **Panel enter** | `opacity 0 → 1`, `y 8 → 0` px · **200 ms** · `easeOut` |
| **Panel exit** | `opacity → 0` **only** — `y` is deliberately dropped, so it fades in place rather than sinking |
| **`AnimatePresence` mode** | **None specified** (default `"sync"`) in all four |
| **Reduced motion** | **Not honoured in any of them** |

| File | Backdrop | Panel |
|---|---|---|
| `components/research/ConfirmDialog.tsx` | `:129–137` | `:143–146` |
| `components/delivery/AddAnnotationSummaryModal.tsx` | `:419–427` | `:429–441` |
| `components/research/PlanSessionsModal.tsx` | `:814–822` | `:824–843` |
| `components/research/EditSessionPlanModal.tsx` | `:271–279` | `:281–292` |

> **`AddAnnotationSummaryModal`'s `AnimatePresence` stays mounted regardless of `open`** (`:404–416`) — the `open &&` gate is *inside* it. Re-mounting a fresh `AnimatePresence` on every open lost track of its previous children and produced React duplicate-key console errors on every open.

### 6.4 Loading interstitials — Plan Sessions only

`components/research/PlanSessionsModal.tsx`

```ts
const LOADING_MS = 700   // :201
```

| State | Label | Duration | What is hidden |
|---|---|---|---|
| `generating` | "Building your session plan…" | **700 ms** | The whole step content **and the entire footer** (`:1245`, `!busy &&`) |
| `saving` | "Creating your session plan…" | **700 ms** | Same |

Spinner: `<Loader2 className="size-8 animate-spin text-primary" />` at `:262`. Tailwind `animate-spin` = `spin 1s linear infinite`.

**Both timers are fakes.** No async work backs either one. They exist purely so that "the system is doing something" is legible instead of an instant, jarring screen swap.

The swap between step content and the loading pane is an **instant unmount/mount** — there is no enter/exit animation on the pane itself, only a `min-h-[280px]` to stop the panel collapsing.

**Two defects here you are inheriting:**

- **The timers are cleared on unmount only** (`:512–518`), not when `open` flips false. Closing the modal mid-generate leaves the timeout to fire and commit `bulkSetSessionPlan` on a closed dialog.
- Under reduced motion the spinner **freezes** rather than disappearing (see §1.1).

`EditSessionPlanModal` and `AddAnnotationSummaryModal` have **no interstitials at all** — their saves are synchronous.

### 6.5 Sidebar collapse

| | |
|---|---|
| **What moves** | The `<aside>`'s `width` |
| **Trigger** | The collapse toggle |
| **Duration** | **200 ms** · Tailwind `ease-out` |
| **Mechanism** | CSS `transition-[width]` + `overflow-hidden` |
| **Persistence** | `localStorage` key, read at `DeliverySidebar.tsx:135`, written `:141` |
| **Reduced motion** | **Honoured** (CSS) |
| **File:line** | `DeliverySidebar.tsx:150` |

Same 200 ms / `ease-out` pair as the module player's outline rail. That is deliberate — they are the same kind of object.

### 6.6 Wave divider — no motion

`components/delivery/WaveDivider.tsx`. A static SVG rule either side of a centred label. Contains **zero** animation. Listed here only because it is easy to assume otherwise from the name.

### 6.7 Universal button micro-interactions

Applied by class across the portal, all CSS, all honoured under reduced motion:

| Class | Effect | Typical site |
|---|---|---|
| `transition-colors` | Hover/focus fill change | Every button and link |
| `transition-all` + `active:scale-[0.97]` | 3 % press-down | Primary CTAs, e.g. `DeliveryHomePage.tsx:351`, `ConfirmDialog.tsx:187` |
| `active:scale-[0.98]` | 2 % press-down | `ModulePlayerPage.tsx:173` |
| `focus-visible:ring-2 focus-visible:ring-ring` | Focus ring | Everywhere |

> **Watch for one trap recorded in `CLAUDE.md`:** `hover:bg-primary/5` over the `#fffcfa` page canvas composites to roughly a 9-per-channel shift — present in the DOM, invisible on screen, and reported by reviewers as "no hover state". Measure the *composited* colour; do not trust that the class exists.

### 6.8 The module carousel (`ModuleTimeline.tsx`)

Used by My Learning. A horizontal `snap-x snap-mandatory` scroll row with `scroll-smooth`, chevrons, and dot pagination.

| | |
|---|---|
| **Row** | `snap-x snap-mandatory overflow-x-auto scroll-smooth`, scrollbar hidden (`:1358`) |
| **Cards** | `w-56 shrink-0 snap-start sm:w-64` (`:386`) |
| **Chevron paging** | `el.scrollBy({ left: ±step * visibleCount, behavior: 'smooth' })` (`:1222`) |
| **Dot paging** | `el.scrollTo({ left: target.offsetLeft, behavior: 'smooth' })` (`:1234`) |
| **Dot indicator** | `transition-all` on `h-1.5 rounded-full` (`:1438`) |
| **Edge detection** | `ResizeObserver` (`:1106`) + scroll listener, 2 px tolerance (`:1058–1059`) |
| **Reduced motion** | **Not honoured** — `scroll-behavior: smooth` is not covered by the global CSS rule |

**Three hard-won implementation notes, all recorded in the file's own comments:**

1. **Mount-time centring must assign `el.scrollLeft = target.offsetLeft`, not use a centring calculation** (`:1155–1199`). The row is `snap-mandatory`, so the browser re-snaps any settled position to the *nearest* card's `snap-start`. A centring offset for module 2 computed a value closer to module 1's snap point than to module 2's, and the row silently reverted to module 1 on every fresh load.
2. **`scroll-behavior: smooth` also governs a direct `scrollLeft` assignment**, not just `scrollTo`/`scrollBy` — confirmed live by instrumentation. A `updateEdges()` call immediately after the assignment was reading a stale mid-animation value.
3. **`scrollIntoView` walks up every scrollable ancestor**, not just the intended row (`:1125–1145`). Using it here scrolled the *whole page* to its bottom on load — the identical Round 18/19 bug. Use a container-scoped `scrollLeft`/`scrollTo` instead.

### 6.9 Two layout traps that are not motion but will bite you

Recorded here because they only surface once something moves or scrolls.

1. **`min-w-0` is required on a grid/flex container *and* its cells.** Items default to `min-width: auto`, so one wide child sizes the track instead of scrolling inside its own box. This has produced a real horizontal page scroll **three times** — the pathway timeline, the module carousels, and the onboarding handoff overlay (which pushed the document to 1456 px against a 1131 px viewport). `DeliveryShell.tsx:267–273` documents the fix. **Check `document.documentElement.scrollWidth === window.innerWidth`, not a screenshot.** (Live-verified clean at 780 px viewport during this audit.)
2. **Tailwind's `sr-only` inside a horizontally-scrolling row widens the whole document.** It is `position: absolute` + `white-space: nowrap`, so it escapes the clip. In My Learning's card row it pushed `scrollWidth` to **2399 px** against a 1281 px viewport. The fix was moving module titles to `aria-label`, which carries the same information and generates no box (`DeliveryLearningHomePage.tsx:195–199`).

---

## 7. Complete inventory — every animation, one table

| # | What | File:line | Duration | Easing / spring | Reduced motion |
|---|---|---|---|---|---|
| 1 | Onboarding card pop-in | `DeliveryOnboarding.tsx:258–268` | spring + 340 ms opacity | `s90 d16 m0.9` | ✅ skipped |
| 2 | Onboarding card rearrange | `DeliveryOnboarding.tsx:240–268` | spring | `s90 d16 m0.9` | ✅ `duration 0` |
| 3 | Doodle rotation | `Doodles.tsx:79–156` | spring | `s90 d16 m0.9` | ✅ `duration 0` |
| 4 | Onboarding title/copy rise | `DeliveryOnboarding.tsx:504–540` | 420 ms, 80 ms stagger | `[0.4,0,0.2,1]` | ✅ `duration 0` |
| 5 | Exit — buttons | `DeliveryOnboarding.tsx:554–557` | 200 ms | `easeOut` | ✅ exit skipped |
| 6 | Exit — copy | `DeliveryOnboarding.tsx:483–486` | 340 ms, 60 ms delay | `easeOut` | ✅ exit skipped |
| 7 | Exit — artwork → `scale 0.78` | `DeliveryOnboarding.tsx:443–447` | 820 ms | `[0.4,0,0.2,1]` | ✅ exit skipped |
| 8 | Onboarding wrapper fade-out | `DeliveryShell.tsx:156, 282` | 250 ms | `easeInOut` | ✅ `duration 0` |
| 9 | Sidebar reveal | `DeliveryShell.tsx:232–241` | 850 ms, 300 ms delay | `[0.16,1,0.3,1]` | ✅ |
| 10 | Hero reveal | `DeliveryShell.tsx:308–310` | 850 ms, 300 ms delay | `[0.16,1,0.3,1]` | ✅ |
| 11 | Body reveal | `DeliveryShell.tsx:324–326` | 850 ms, 460 ms delay | `[0.16,1,0.3,1]` | ✅ |
| 12 | `motion.main` mount | `DeliveryShell.tsx:60–65` | 300 ms | `easeOut` | ❌ |
| 13 | Tour overlay fade | `DeliveryTour.tsx:368–375` | 450 ms in / 450 ms out | `easeOut` | ✅ |
| 14 | Tour spotlight glide | `DeliveryTour.tsx:399–409` | 500 ms | `[0.4,0,0.2,1]` | ✅ |
| 15 | Tour card enter | `DeliveryTour.tsx:454, 473` | 500 ms | `[0.4,0,0.2,1]` | ✅ |
| 16 | Tour card exit | `DeliveryTour.tsx:459–463` | 300 ms | `easeInOut` | ✅ |
| 17 | Confetti frame loop | `Confetti.tsx:33–38` | 130 ms/frame × 20 × 8, 10 s pause | step | ✅ skipped entirely |
| 18 | Player slide enter | `ModulePlayerPage.tsx:27–31` | 250 ms | `easeOut` | ❌ |
| 19 | Outline rail width | `ModulePlayerNav.tsx:136` | 200 ms | `ease-out` (CSS) | ✅ |
| 20 | Chapter tree height | `ModulePlayerNav.tsx:329–337` | 280 ms both ways | `[0.4,0,0.2,1]` | ❌ |
| 21 | Chevron rotate | `ModulePlayerNav.tsx:312` | 200 ms | Tailwind default (CSS) | ✅ |
| 22 | Fake video progress | `VideoPlaceholder.tsx:70, 116` | 3200 ms total, 80 ms ticks | `linear` (CSS) | ✅ (bar only) |
| 23 | Tab underline | `UnderlineTabs.tsx:111` | spring | `s500 d35` | ❌ |
| 24 | Toast | `Toast.tsx:38`, 4 s auto-dismiss | 180 ms | `easeOut` | ❌ |
| 25 | Modal backdrop ×4 | see §6.3 | 150 ms | default | ❌ |
| 26 | Modal panel ×4 | see §6.3 | 200 ms in, fade out | `easeOut` | ❌ |
| 27 | Wizard spinner | `PlanSessionsModal.tsx:262` | 1 s infinite | `linear` (CSS) | ⚠️ **freezes** |
| 28 | Sidebar collapse | `DeliverySidebar.tsx:150` | 200 ms | `ease-out` (CSS) | ✅ |
| 29 | Carousel smooth scroll | `ModuleTimeline.tsx:1222, 1234, 1358` | browser default | browser default | ❌ |
| 30 | Button press `active:scale` | app-wide | Tailwind default | Tailwind default (CSS) | ✅ |

**11 of 30 entries are not reduced-motion safe.** All eleven are framer-motion. One (#27) is actively worse under the setting than without it.

---

## 8. Assets referenced by motion

| Path | Used by | Notes |
|---|---|---|
| `public/illustrations/onboarding/photo.jpg` | Onboarding cards, `BannerBlob` | 533 × 800, resampled from 8.4 MB → 104 KB. Same image on all three cards, by direct instruction |
| `public/illustrations/onboarding/blob-back.svg` | Onboarding cards | The white sheet, rotated a further `3.35°` so it peeks out on two edges |
| `public/illustrations/confetti/f01.png` … `f20.png` | `Confetti` | 1400 × 1080, 440 KB total, 96.7 % transparent after de-plating |
| `public/illustrations/tour/left-doc.svg`, `chart-line.svg` | `TourIllustration` | The only two vector pieces; everything else in that block is plain divs |
| `public/illustrations/home/wave.svg` | `WaveDivider`, outline rail | Static |
| `public/illustrations/home/banner-back.svg`, `banner-back-gold.svg`, `banner-outline.svg`, `banner-mask.svg` | `BannerBlob` | **Note:** this is the one place a separate mask asset still exists. Its `maskPosition` (`36.185px 91.511px`) is derived from the outline's own position, **not** transcribed from Figma — the frame's own values put the window 10.5 px shorter and 9 px lower than the stroke. See `DeliveryHomePage.tsx:446–460` |
| `public/illustrations/debrief/doodle-*.svg` | Session debrief banner | Positioned as **fractions** of the frame's artwork grid, not px, because the photo underneath is `BannerBlob`'s geometry not the frame's |
| `public/illustrations/certificate-earned.svg` | Certificate download | Real committed asset, fetched and saved as a Blob |

---

## 9. If you rebuild this — the short list

1. **Never separate the blob's mask from its outline.** One path, one SVG, rendered twice. It has failed three times the other way.
2. **`ART_SCALE` must multiply into the layout box, not just the transform**, or the copy below will not move.
3. **The onboarding→tour delay must stay an expression**, not a literal.
4. **The tour's card and spotlight must share one easing curve.**
5. **Confetti frames must all be mounted with only `opacity` switching**, and must unmount during the pause.
6. **The outline rail's two widths must be readable by the footer**, or the slide buttons drift off centre.
7. **The chapter tree must unmount on collapse**, not just animate to zero height.
8. **Add `MotionConfig reducedMotion="user"` at the app root.** It is one line and closes eleven gaps.
