# Wavy and organic shapes — how they work, and what breaks them

Every curved, torn or blobby shape in the Consumer Portal is a **committed Figma
export**. Nothing here is hand-drawn, and nothing should be redrawn. What makes
these shapes hard is not the artwork — it is the sizing maths around it, and the
handful of behaviours that are invisible in a screenshot and obvious in a
measurement.

This document assumes you have the repo open. It does not reproduce whole
components; it tells you **which asset a shape uses, how its maths is derived,
which numbers are knobs and which are load-bearing, what to change to tune it,
and what breaks if you get it wrong** — then cites `file:line` so you can read
the rest in place.

§1–§11 are the shapes. **§12 is the payload.** §13 is the checklist.

---

## 1. The welcome wave — `ConsumerWelcome.tsx`

**Assets** `public/illustrations/consumer-welcome/wave.svg` (1441.24 × 1220.2,
desktop) and `welcome-wave-mobile.svg` (521.651 × 523.068, phone).
**Renders in** `ConsumerWelcome.tsx:672-711`.

Two purpose-drawn exports, swapped at `sm` (640px). Both carry
`preserveAspectRatio="none"` — see trap §12.2 for why that forces two files.

**Desktop.** The wrapper is positioned, the image fills it:

```tsx
// ConsumerWelcome.tsx:690-711
<div aria-hidden="true" className="pointer-events-none absolute hidden sm:block"
  style={{ left: '-6.145%', width: '112.35%', top: WAVE_TOP - ART_LIFT, height: 1137.956 }}>
  <img src="/illustrations/consumer-welcome/wave.svg" alt=""
    style={{ display: 'block', width: '100.144%', height: '107.234%', maxWidth: 'none' }} />
</div>
```

*How the numbers are derived.* `left`/`width` are the frame's own overhang — the
1439px shape hangs past the 1281px artboard on both sides by design. The
`100.144% / 107.234%` on the image is the export's **own drop-shadow bleed** past
the shape's box; the frame reports the same overhang, so it is transcribed rather
than rounded, because the crest is what those two numbers position.

*Anchoring.* The wrapper is anchored by its **top**, at a fixed px offset, and
its height is a fixed 1137.956 — not a percentage. The crest has to land a fixed
distance below the header whatever the viewport height is, and a percentage
height would slide it with the page. Horizontal *is* percentage-based, so the
wave widens with the viewport. That asymmetry is the design: a wave should get
wider, not deeper.

*Knobs vs load-bearing.* `ART_LIFT` (`:57`, currently `60`) is the **one knob**.
Everything else is transcribed.

> **`ART_LIFT` is one constant applied to two things, and that is the point.**
> The wave and the sleeping pillow are drawn in contact — the pillow's base rests
> on the crest. The section's top padding is `SECTION_PAD_TOP - ART_LIFT`
> (`:625`) and the wave's top is `WAVE_TOP - ART_LIFT` (`:697`). A first pass
> moved the pillow by changing the section padding alone and left the wave where
> it was, which left the pillow floating above the shape it is sleeping on.
> **Change this number, never the two call sites.**

Measured at 1440 × 900: wrapper `top: -910.703` (= `-850.703 - 60`), image
1620.16 × 1220.27 at x −88.48. At 768 the same image renders 864.09 × 1220.27 —
the height is held and only the width tracks, exactly as intended.

**Phone.** A window plus four percentage insets, because the frame uses the shape
as an oversized image inside a clip window rather than scaling it to fit:

```tsx
// ConsumerWelcome.tsx:667-689
<div aria-hidden="true"
  className="pointer-events-none absolute block overflow-hidden sm:hidden"
  style={{ left:'50%', transform:'translateX(-50%)', width:'100vw', height:'68vw', top: 24 - 96 }}>
  <img src="/illustrations/consumer-welcome/welcome-wave-mobile.svg" alt=""
    style={{ position:'absolute', left:'-19.37%', top:'-79.99%',
             width:'139.1%', height:'187.5%', maxWidth:'none', display:'block' }} />
</div>
```

*Derivation.* The window is the frame's own 375 × 255 at page y 24, expressed
relative to the viewport so it scales: `100vw` wide, `68vw` tall (255/375). The
four insets are the frame's own. `top: 24 - 96` is the page position less the
header, because this renders inside a section that starts below the header.

> **The height is 187.5%, not 196.4%.** The frame's insets give a 456.39px box
> and a nested −4.75% bottom extension takes the image itself to 478.07 — which
> is 187.5% of the 255px window. A first pass applied that 4.75% *twice*, once
> inside the 456.39 → 478.07 step and again on top. The shape stretched ~9px past
> the clip and the curve was cut off flat against the window's bottom edge,
> reported as "blue wave getting cropped in mobile".

Measured at 375 × 812: window 375 × 255 at y 0, image 521.63 × 478.13 at
x −72.63. Both match the arithmetic to 0.02px.

---

## 2. The page hero wave — `ConsumerCanvasWave.tsx`

**Assets** `consumer-welcome/home-wave-desktop.svg` (1281 × 239) and
`consumer-welcome/home-wave-mobile.svg` (375 × 176) for the `home` variant;
`consumer-help/help-wave-desktop.svg` (1323.88 × 247) for the `help` variant.
**Renders in** `ConsumerCanvasWave.tsx:51-196`. Callers: Home, My Modules,
My profile, Need Help.

Both home exports are exactly their own frame's band, so **both render at
`width: 100vw` with the height following from the viewBox and nothing is
stretched at all.**

```tsx
// ConsumerCanvasWave.tsx:79-89 — shared geometry, no `display` in here (see below)
const common = {
  width: '100vw', height: 'auto' as const,
  maxWidth: 'none' as const,                       // trap §12.6
  position: 'absolute' as const, left: '50%', transform: 'translateX(-50%)',
}
```

**The one number that is not from a frame** is `top`. Both frames position the
band against the whole page (desktop 0 → 239, mobile 8 → 184) while this renders
inside a content column that starts below the header — so the offset loses the
header height:

```tsx
// :171 and :192
style={{ ...common, top: 8 - headerPx }}      // mobile
style={{ ...common, width: 'max(100vw, 1281px)', top: -headerPx }}   // desktop
```

`headerPx` defaults to 72 and is the same number as `--consumer-header-h`. A
first pass transcribed the frame value directly and clipped the date line under
the greeting by exactly one header height.

**`max(100vw, 1281px)` on the desktop export is what keeps it visible on a
tablet.** The export is drawn at 1281 wide, so at `width: 100vw` its *height*
scales down with the viewport: at 768 that is a 143px band of which only ~47px
clears the header, which reads on screen as the wave having disappeared. Holding
the box at its own 1281 whenever the viewport is narrower keeps the band at its
drawn depth and lets the viewport crop it. Measured at 768: the image is 1281 ×
239 at x −256.5 — full depth, cropped, not squashed. This is the portal's
**clip, never squash** rule.

**The `help` variant's phone band is a CSS gradient behind a mask, not an
image**, and that needs explaining before someone "fixes" it:

```tsx
// ConsumerCanvasWave.tsx:134-151
background:
  'linear-gradient(180deg, rgb(253,223,147) 0%, rgb(254,213,108) 45%, rgb(255,197,75) 100%)',
WebkitMaskImage: 'url(/illustrations/consumer-welcome/home-wave-mobile.svg)',
maskImage:       'url(/illustrations/consumer-welcome/home-wave-mobile.svg)',
WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
aspectRatio: '375 / 176', top: 8 - headerPx,
```

Figma supplies **one** export for the Need Help frame and no phone counterpart.
Two attempts at serving both widths from it failed, and both looked like the
obvious fix:

1. `max(100vw, 1281px)` at every width — at 375 that is a 239px band ending at
   y 265 against a title starting at 221, so the heading sat *inside* the gold.
2. Holding it at 943px, the width that reproduces Home's 176px depth — the depth
   was then right and the **curve** was wrong: a 943px crest cropped to 375 is
   very nearly a straight edge.

So the phone band takes its **shape from Home's own committed export** (used as
a mask, so it is the identical curve by construction rather than by a redraw)
and its **paint from this frame's own export** — the two gradient endpoints were
sampled off `help-wave-desktop.svg` rasterised to a canvas, not eyeballed and
not read off the gradient's stop list, which is a radial in a coordinate space
that does not map onto a 375-wide box.

Measured at 375: the gold band is 375 × 176 at y 69, computed background
`linear-gradient(rgb(253,223,147) 0%, rgb(254,213,108) 45%, rgb(255,197,75) 100%)`,
mask `home-wave-mobile.svg`. **Replace the whole mobile branch with a real phone
export the moment one is drawn.** This is a faithful stand-in, not a preference.

> **Do not put `display` into `common`.** It lived there once and silently broke
> the breakpoint swap: an inline style beats a class, so `hidden` never applied
> and **both** exports rendered at once. It was not spotted, it was measured —
> the desktop one is only ~70px tall on a phone and hid behind the mobile one.
> Visibility is the classes' job; that object is geometry only.

**The swap is at `sm` (640) and the two depths differ**, so dragging a window
across that width shows a step: the phone export is 47% of its width tall against
the desktop export's 19%. No device sits at the boundary, and the alternative is
stretching one of them again.

---

## 3. Seating content on the crest — `CONSUMER_CREST_TRACKING`

**Defined at** `ConsumerCanvasWave.tsx:738`. Used by Home, My Modules, Need Help
and My profile.

```
sm:mt-[calc(0.95711*max(18.657vw,239px)-208.15px)]
```

The mascot used to float above the line. Measured on Home at 1062px: the wave's
lowest painted row under the mascot sat at page y 289.75 and the pillow's base at
269.15 — **20.6px** clear of the curve it is meant to be resting on.

*Why a formula and not a 20.6px nudge.* The export is 1281 × 239 and renders
full-bleed, so past its own width its height grows with the viewport (269 at
1440, 358 at 1920) while the content stays put. Three facts make the seat exact
at any width:

```
wave height H        = max(18.657vw, 239px)   // 239/1281, floored at its own width
crest under mascot   = 0.95711 × H            // measured, 4× supersampled
block start -> base  = 208.15px               // constant: the wave and the mascot
                                              // hang off the same content box
```

so the offset is `0.95711 × H − 208.15px` — 20.6px at the frame's own width, and
growing with the curve above it.

This replaced a `max(0px, calc(18.657vw - 239px))`, which tracked the wave's
*growth* rather than its crest: a no-op at 1281 (so the 20.6px gap survived) and
a slight overshoot past it. **It is the seat that was wrong, not the tracking** —
do not reintroduce a growth-tracking version.

> **`sm:` here is load-bearing, not tidiness.** Below 640 a *different* export is
> in play (375 × 176) and the mascot renders at 0.6444 scale; measured there, the
> base already sits 10px **below** the crest, so this offset would push a correct
> phone layout down. **Keep this breakpoint in step with the export swap in
> `ConsumerCanvasWave` and the scale swap in `ConsumerMascotFigure`** — those
> three are one decision.

It moves the *content*, never the wave, which is absolutely positioned and not in
the block's flow.

---

## 4. The squiggle rule — `ConsumerWaveRule.tsx`

**Assets** `consumer-home/wave-rule-desktop.svg` (920.731 × 6) and
`wave-rule-mobile.svg` (328.482 × 6). **Renders in** `ConsumerWaveRule.tsx:25-42`
— the whole component:

```tsx
<img src="/illustrations/consumer-home/wave-rule-mobile.svg"  alt="" aria-hidden="true"
     className={cn('block h-1.5 w-full sm:hidden', className)} />
<img src="/illustrations/consumer-home/wave-rule-desktop.svg" alt="" aria-hidden="true"
     className={cn('hidden h-1.5 w-full sm:block', className)} />
```

Two files for one 6px rule looks like waste and is not. Both carry
`preserveAspectRatio="none"`, so **the box is the geometry**: hand one a
different width and the wavelength changes with it rather than the curve being
cropped. Figma supplies a purpose-drawn export per breakpoint — identical
amplitude, different length — so each renders near its own drawn width and the
squiggle keeps its period. Serving both from one file is what turned this and the
background wave into spikes.

Measured at 1440: the desktop file renders 830.05 × 6 (against its drawn 920.731,
so ~10% compressed — within tolerance). At 375: the mobile file renders 327 × 6
against its drawn 328.482. Both are within a few per cent of their own drawn
length, which is the whole point of having two.

> **Do not swap in the coach portal's `WaveDivider` asset.** It is the same
> designer's curve and even carries the same `Vector 1 - Wave` layer name, but it
> is stroked `#A070FF` against a white card. These are `#3A00AD` — this portal's
> own `consumer-primary` — on a warm canvas. Matching the glyph is not enough;
> reusing it would be a silent colour change. If the two portals' artwork is ever
> consolidated, that is the trap.

---

## 5. The module welcome band — `ModuleHeroWave.tsx`

**Asset** `consumer-lesson/lesson-hero-wave.webp`, 2000 × 699 (aspect 2.86123),
132 KB. **Renders in** `ModuleHeroWave.tsx:144-185`.

### The photo and the yellow wave are ONE asset, and that is the point

In Figma the band is a single vector: a torn-wave path carrying the photo as an
image fill and `yellow/500` `#FFB600` as a **stroke**. It exports as one file
with the curve already cut and the line already drawn on it, so **the stroke
physically cannot land off the photo's edge.** See trap §12.1 for why that
matters so much here.

*The cost, stated plainly:* the photo is baked in, so every module's welcome
screen shows the same photograph. Giving a module its own photo means a new
export from Figma with that photo in the fill — not a code change.

*Why WebP, this repo's first.* The shape needs a real alpha channel (the canvas
shows through below the wave) and a photograph with alpha can only be PNG or
WebP. The same image is ~1,976 KB as an optimised PNG and 136 KB as WebP.

*Alpha verified, not assumed.* Decoding the committed file and counting the alpha
channel: **149,678 of 1,398,000 pixels fully transparent (10.7%)**, 9,983 partial,
the rest opaque. That is real transparency. See trap §12.8 for why this has to be
counted on every re-export.

### The geometry is all one scale

The frame draws a 1281 × 380 clip window with the shape hanging out of it on
every side: 1341.268 × 465.962 at left −27.65, top −93, skewed −0.82°. Only the
middle band is visible, which is why the export's own top and side yellow edges
never appear on screen.

Every number is expressed **relative to the window**, so the composition scales
with the viewport and nothing has to be re-derived at a second width
(`ModuleHeroWave.tsx:82-91`):

```ts
const IMAGE_W     = 104.70476   // 1341.268 / 1281 — shape width as a share of the window
const BASE_LIFT   = 1.51043     // (465.962 - 380 + 93) / 465.962 — base above the window's edge
const SKEW_DEG    = -0.82       // the frame's own skew
const WINDOW_RATIO = 380 / 1281 // the window's height as a share of its width
```

and applied as one transform on one element (`:162-181`):

```tsx
<img src="/illustrations/consumer-lesson/lesson-hero-wave.webp" alt=""
  style={{
    position:'absolute', left:'50%', bottom:0,
    width: `calc(${IMAGE_W}% * var(--wave-s))`, height:'auto',
    maxWidth:'none',                                   // trap §12.6
    transform: `translateX(-50%) translateY(-${BASE_LIFT}%) skewX(${SKEW_DEG}deg)`,
  }} />
```

Read that transform right to left: skew the shape as the frame does, lift it so
its base lands 7.038px above the window's edge, then centre it. **One transform,
so the three cannot drift.**

### The two knobs

```ts
// :141-142 — one multiplier per breakpoint, carried as a custom property
const SCALE_VARS = '[--wave-s:1.6] min-[640px]:[--wave-s:1.25] min-[1200px]:[--wave-s:1]'
// :122
const HEIGHT_CAP = 'min(32vh, 380px)'
```

`--wave-s` multiplies the window's height and the image's width **together**,
which is what keeps it a scale rather than a stretch. Desktop is the frame's own
`1`; the other two are derived, because no mobile or tablet frame exists for this
screen. At 375 the desktop proportion would give a 111px band, too thin to read
as a photograph; 1.6 puts it at ~178px with identical framing.

It is a custom property so there is exactly **one** `<img>` in the DOM rather
than one per breakpoint — three hidden copies of a 136 KB photo is a real cost on
the phone that needs it least, and three copies of the markup is how an invisible
sizer drifts from the live one.

`HEIGHT_CAP` is the viewport-height ceiling and is load-bearing on a real laptop.
Full account in trap §12.3.

The container is a **container query**, not `vw`, and needs two nested boxes:

```tsx
// :154-161
<div aria-hidden="true" className={cn('w-full [container-type:inline-size]', SCALE_VARS, className)}>
  <div className="relative w-full overflow-hidden"
       style={{ height: `min(calc(${WINDOW_RATIO * 100}cqw * var(--wave-s)), ${HEIGHT_CAP})` }}>
```

`cqw` reads the container, which is what the geometry is actually relative to; on
any surface where the page column stops being the whole viewport, `vw` would size
the wave against the window instead. Two boxes are required rather than stylistic:
`cqw` resolves against an *ancestor* container, so the element declaring
`container-type` cannot use it to size itself.

**Measured, all four widths** (viewport heights 812 / 1024 / 900 / 900):

| Viewport | `--wave-s` | Window | Bound by |
|---|---|---|---|
| 375 × 812 | 1.6 | 375 × 177.98 | width (`29.664cqw × 1.6`) |
| 768 × 1024 | 1.25 | 768 × 284.77 | width |
| 1200 × 900 | 1 | 1200 × 288 | **the 32vh cap** |
| 1440 × 900 | 1 | 1440 × 288 | **the 32vh cap** |

At 1440 the image renders 1515.28 wide — `1440 × 1.0470476 = 1507.75` plus 7.54px
of bounding-box growth from the skew across a 527px-tall image. If you measure
and get 1507.75, you measured before the skew.

*To tune it:* change `SCALE_VARS` or `HEIGHT_CAP`. **Never the individual
offsets** — offsets drift apart, a single multiplier cannot. Same idiom as
`ART_LIFT` in §1.

---

## 6. The diary / completion wave band — `ConsumerCompletionHero.tsx`

**Assets** `consumer-diary/diary-wave-mobile.svg` (375 × 247) and
`diary-wave-desktop.svg` (1869.39 × 1296.05). **Renders in**
`ConsumerCompletionHero.tsx:40-118` (`DiaryWaveBand`). Callers: the sleep diary's
welcome and thank-you screens, and the module completion screen.

This is the same two-export, clip-never-squash rule as §2, with one difference
that is worth understanding because it is the opposite of §1's:

> **Fixed height, fluid width.** The previous pass scaled the whole export with
> the viewport (`width: max(100vw,1281px)`, `height: auto`), so its depth grew
> with width: 469px at 1281, **703px at 1920** — measured. At that depth the band
> swallowed the title, leaving "Sleep Diary" and the date as dark ink on deep
> purple. Holding the height constant keeps the crest a fixed distance below the
> header at every width.

```tsx
// :92-114 — a clip window in px, with the image pinned in px inside it
<div aria-hidden="true" className="pointer-events-none absolute hidden overflow-hidden sm:block"
  style={{ left:'50%', transform:'translateX(-50%)', width:'100vw',
           height: 470, top: 'calc(-64px - var(--consumer-header-h))' }}>
  <img src="/illustrations/consumer-diary/diary-wave-desktop.svg"
    style={{ position:'absolute', left:'-22.63%', width:'145.96%',
             top:-827, height:1295, maxWidth:'none', display:'block' }} />
</div>
```

*Derivation.* The frame's band is 1281 × 368 at page y −64; the image's insets
flatten to left −22.63%, width 145.96%, top −827px, height 1295px. `top` is that
page −64 less the header, read from `--consumer-header-h` rather than hardcoded —
it was once a literal `-160` against a 96px header, and shortening the header
would have put the crest 24px low.

**The window is 470, not the frame's own 368, and that is deliberate.** The
window is only a clip; the image inside is pinned in px, so a taller window moves
nothing — it just leaves the wave's soft drop shadow the ~106px of room it needs.
At 368 the clip lands 4px under the deepest trough and cuts that shadow off
square.

The export is the frame's **untrimmed** artwork (1869.39 × 1296.05) rather than a
1281 × 469 crop, and it carries `preserveAspectRatio="none"` — which is what lets
it stretch to a wider box instead of letterboxing. The two exports' path data
differ by exactly the filter-box origin (289.746, 828.018), so they are the same
shape.

**Measured at 1440 × 900:** window 1440 × 470 at `top: -136px` (= −64 − 72); image
2101.82 × 1295 at x −325.87. Every number reproduces the arithmetic.
**At 375:** the mobile export renders 375 × 247, `top: -96` relative to the
content column.

---

## 7. The coach-profile hero wave — `CoachProfileModal.tsx`

**Asset** `consumer-coach/coach-hero-wave.svg` (760.376 × 387.04, fill `#3A00AD`).
**Renders in** `CoachProfileModal.tsx:236-250`.

This is the one wave in the portal that is **deliberately stretched**, and it is
the exception that proves §12.2's rule.

```tsx
// :116-117
const WAVE_W_PCT = (760.376 / 612) * 100   // 124.245% — wave against the card's width
const WAVE_H_PCT = (387.04 / 250) * 100    // 154.816% — wave against the purple region's height

// :241-250
<img src="/illustrations/consumer-coach/coach-hero-wave.svg" alt="" aria-hidden="true"
  className="pointer-events-none absolute bottom-0 left-1/2 max-w-none"
  style={{ width: `${WAVE_W_PCT}%`, height: `${WAVE_H_PCT}%`,
           transform: 'translateX(-50%) skewX(-0.82deg)' }} />
```

Its export carries `preserveAspectRatio="none"`, so sizing it to 124.245% ×
154.816% of the hero fills that box exactly at every card width instead of
letterboxing. The curve flattens slightly on narrow cards. **On a decorative band
inside a fixed-height modal hero that is the right trade** — the two things that
make it safe are that the hero's height is bounded and that nothing is registered
against the curve. Neither is true of the full-bleed page waves, which is why
they get two files each.

> **The hero must have a definite height, and that is why it is two fixed values
> rather than content-driven** (`h-[224px] sm:h-[250px]`, `:236`). The wave's
> percentage height resolves against the hero's own box, and a percentage height
> against an `auto` containing block resolves to `auto` and collapses.

The `-0.82°` skew is the frame's and is applied **on the same element as the
centring transform**, so there is one transform on one element.

---

## 8. The summary-card pillows — `pillowFrame.ts` + `ModuleSummaryCards.tsx`

**Source of the paths** `components/consumer/pillowFrame.ts`.
**Source SVGs** `consumer-lesson/card-pillow-1.svg` (330.265 × 254.48),
`-2.svg` (359.16 × 212.86), `-3.svg` (323.237 × 301.82) — **now unreferenced by
the app**, kept as the exports the paths were extracted from.
**Renders in** `ModuleSummaryCards.tsx:298-341`.
**Photo** `consumer-home/lesson-cover.jpg` (666 × 1000).

### Why the `d` lives in a `.ts` file and not in an SVG

Because a photo inside a shape needs that shape **twice** — once as a `clipPath`
for the image, once as the visible stroke on top. This is the one-source rule in
§12.1, and this is the pattern that implements it:

```tsx
// ModuleSummaryCards.tsx:300-340 — one SVG, `frame.d` rendered three times
<svg viewBox={frame.viewBox} preserveAspectRatio="xMidYMid meet" className="h-auto"
     style={{ width: `calc(${pillow.width*100}% * var(--pillow-s))`,
              maxWidth: PILLOW_MAX_W, maxHeight: 'var(--pillow-max-h)',
              transform: `rotate(${pillow.rotate}deg) skewX(${PILLOW_SKEW}deg) scale(${scale})`,
              transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
  <defs><clipPath id={clipId}><path d={frame.d} /></clipPath></defs>
  <path d={frame.d} fill={PILLOW_FILL} />          {/* under the photo — see below */}
  <image href={PILLOW_PHOTO} clipPath={`url(#${clipId})`}
         preserveAspectRatio="xMidYMid slice"
         x={-3} y={-3} width={frame.width} height={frame.height} />
  <path d={frame.d} fill="none" stroke={PILLOW_STROKE}
        strokeWidth={PILLOW_STROKE_W} strokeLinejoin={PILLOW_STROKE_LINEJOIN} />
</svg>
```

Same `d`, same viewBox, same element — so the stroke cannot drift from the image
it frames at any size, rotation or skew, and it scales with the card for free
because it rides the same transform.

Four details that are each load-bearing:

- **`clipId` comes from `useId()`.** Four cards render three shapes and two faces
  each; a fixed id would have every pillow on the page clipped by whichever one
  mounted last.
- **The cream `PILLOW_FILL` path is painted *under* the image**, so a slow or
  failed image load shows the shape the card was designed around rather than a
  hole in it.
- **`preserveAspectRatio="xMidYMid meet"` on the root replaces the source file's
  own `none`.** `--pillow-max-h` can make the rendered box shorter than the
  natural aspect, and `none` would squash the pillow when it does. The `<image>`
  uses `slice`, so the photo fills the shape and crops.
- **`x={-3} y={-3}`** places the photo against the viewBox's `-3 -3` origin —
  see the next paragraph.

### The `-3 -3` viewBox, and the trap on re-export

```ts
// pillowFrame.ts:41-50
export const PILLOW_STROKE = '#c2a3ff'   // purple-300, hand-added
export const PILLOW_STROKE_W = 6
export const PILLOW_STROKE_LINEJOIN = 'round'
export const PILLOW_FILL = '#FBF5E6'
```

The committed SVGs carry a **hand-added `purple-300` 6px centred stroke** that
the Figma exports do not. A centred stroke sits half outside the path's own
bounds, and an `<img>` clips to the viewBox — so adding it meant growing each
file's viewBox and intrinsic size by the stroke width, which is where `-3 -3` and
the post-stroke widths come from:

| Style | Figma export | Committed (post-stroke) | viewBox |
|---|---|---|---|
| 1 | 324.265 × 248.48 | 330.265 × 254.48 | `-3 -3 330.265 254.48` |
| 2 | 353.16 × 206.86 | 359.16 × 212.86 | `-3 -3 359.16 212.86` |
| 3 | 317.237 × 295.82 | 323.237 × 301.82 | `-3 -3 323.237 301.82` |

> **A re-export from Figma drops the stroke and reverts the viewBox.** Reapply
> both together, then re-extract the `d` **programmatically** — these were
> extracted from the files, never retyped. Same standing trap as the transparency
> in §12.8.

### Sizing knobs

```ts
// ModuleSummaryCards.tsx:107-197
const PILLOW_STYLES = {                      // width = share of the card's 356px inner width
  1: { width: 330.265/356, rotate: -2.14 },
  2: { width: 359.16/356,  rotate: 3 },
  3: { width: 323.237/356, rotate: -4.51 },
}
const PILLOW_SKEW = -0.82                    // the designer's tilt, same as the hero wave
const PILLOW_SCALE_VARS  = '[--pillow-s:0.88] min-[640px]:[--pillow-s:0.8] min-[1200px]:[--pillow-s:1]'
const PILLOW_MAX_W       = 340
const PILLOW_MAX_H_VARS  = '[--pillow-max-h:180px] min-[640px]:[--pillow-max-h:220px] min-[1200px]:[--pillow-max-h:260px]'
const PILLOW_HOVER_SCALE = 1.07
```

- **Scaling the width is what reduces the height.** Each vector is sized as a
  share of the card's inner width with `height: auto`, so its aspect does the
  rest and the three shapes stay in proportion to one another. Capping the height
  directly would need `w-auto` and would throw away the frame's per-shape width
  shares.
- **`PILLOW_MAX_W` exists because a percentage alone has no ceiling.** In the
  single-column band at 1199 the card was **1151px** wide, so a 99%-of-inner-width
  pillow rendered ~1000px across and the card's *front* face became the tallest
  thing on the page. 340 is a little above the frame's own 324, so the desktop
  three-across layout is untouched and only the wide band clamps.
- **`--pillow-max-h` is what makes the three styles interchangeable rather than
  merely similar.** Their aspects differ a lot (324×248, 353×207, 317×296), so
  sizing by width alone left style 3 rendering 343px tall against style 2's 217.
  CSS scales a replaced element proportionally when both a width and a
  `max-height` bind, so the aspect survives and only the largest shape moves.
- **`PILLOW_HOVER_SCALE` is composed into the artwork's own transform**, and it
  has to be: the image already carries a rotate and a skew, so a Tailwind
  `scale-*` utility would *replace* them rather than add to them. It is driven
  from React state, not a CSS `:hover` — see trap §12.5.

Measured at 375: the artwork is 227 × 180 inside an unchanged 279 × 215 container
inside an unchanged 327 × 440 card.

---

## 9. The resource card's torn-paper blob — `resourceBlobFrame.ts` + `ResourceCard.tsx`

**Source of the paths** `components/consumer/resourceBlobFrame.ts`.
**Photo** `consumer-resource/guide-photo.jpg` (800 × 1200).
**Stickers** `consumer-resource/sticker-s1.svg`, `-s2.svg`, `-s3.svg`,
`sparkle.svg`. **Renders in** `ResourceCard.tsx:92-215`.

Same one-path technique as §8, and this one documents the failure mode directly:

> Figma exports this artwork as three files, and two of them are the same blob at
> **different sizes**: the photo mask comes out 320.278 × 245.993 against the
> outline's 323.845 × 256.432, positioned relative to each other by hand-transcribed
> offsets (the frame puts the photo card at `ml 4.55` and the outline at `ml 15.48`).

```tsx
// ResourceCard.tsx:141-172 — one path, rendered twice, in one SVG
<svg viewBox={`0 0 ${RESOURCE_BLOB_W} ${RESOURCE_BLOB_H}`} className="absolute"
     style={{ left: pctX(15.48), top: pctY(14.45),
              width: pctX(323.845), height: pctY(256.432) }} fill="none">
  <defs><clipPath id="resource-blob-clip"><path d={RESOURCE_BLOB_PATH} /></clipPath></defs>
  <image href="/illustrations/consumer-resource/guide-photo.jpg" x="0" y="0"
         width={RESOURCE_BLOB_W} height={RESOURCE_BLOB_H}
         preserveAspectRatio="xMidYMid slice" clipPath="url(#resource-blob-clip)" />
  <path d={RESOURCE_BLOB_PATH} fill="none"
        stroke={RESOURCE_BLOB_STROKE} strokeWidth={RESOURCE_BLOB_STROKE_W} />
</svg>
```

`preserveAspectRatio="xMidYMid slice"` on the `<image>` is the SVG equivalent of
`object-cover`: the source is an 800 × 1200 portrait and the box is landscape, so
it crops rather than squashing.

**The stroke width is authored in the viewBox's units** (`9.35467` in a 323.845
space, `resourceBlobFrame.ts:39`), so it scales proportionally with the card
rather than thinning out as the card grows. If you ever set a stroke in px here,
it will be wrong at every size but one.

**This is a second constant, not an edit to the trainee portal's `BLOB_PATH`, and
that is deliberate**: measured, the two paths have a different number of points
(251 against 246), so writing one over the other would have changed the other
shape. The stroke differs too — `yellow-200` here against the onboarding card's
purple.

**The backdrop blob is a genuinely different shape and keeps its own `d`**
(`RESOURCE_BLOB_BACKDROP_PATH`, filled `yellow-400`, rotated 3.35°). The
one-source rule does **not** apply to it, and the reason is worth internalising:
nothing is registered against it, so nothing can visibly drift out of it. The
rule is about a mask and the outline that frames it — not about every shape in a
composition.

### The rotated-bounding-box construction

```ts
// ResourceCard.tsx:52-55
const ART_W = 370.81
const ART_H = 276.83
const pctX = (v: number) => `${((v / ART_W) * 100).toFixed(3)}%`
const pctY = (v: number) => `${((v / ART_H) * 100).toFixed(3)}%`
```

Frame `941:5856` rotates the assembled artwork 4.45°, and its 391.17 × 304.759
container is the **rotated bounding box** of a 370.81 × 276.83 inner box — which
checks out: `370.81·cos4.45 + 276.83·sin4.45 = 391.2` and
`370.81·sin4.45 + 276.83·cos4.45 = 304.8`. So the inner box is what the pieces
are positioned in, and the outer one only reserves room for the rotation.

Every sticker follows the same construction — its wrapper is its *own* rotated
bounding box and the vector inside is centred at its own size and then turned
(`ResourceCard.tsx:57-91`), which is why each takes both a `boxW/boxH` and a
`vectorW`. If you add a sticker and give it only one width, it will drift as the
card resizes.

**Everything is a percentage of the artwork box**, so the whole illustration
scales with the card instead of overflowing a narrow one. The outer wrapper is
`min-[900px]:w-[391px]` with `aspectRatio: '391.17 / 304.759'`.

---

## 10. The coach-card blob — committed, unreferenced, one line to restore

**Asset** `consumer-welcome/coach-card-blob.svg` (609.221 × 471.652).
**Not rendered.** `CoachCard.tsx:14-22` records why.

Frame `771:3665` replaced the yellow blob with a flat `yellow-200` band, 104px
tall, and *all* of the rotated-bbox derivation, per-breakpoint placements,
corner-gap inset and stroke-width editing went with it:

```tsx
// CoachCard.tsx:49-58, 132
const BAND_H = 104
const PORTRAIT = { size: 104, left: 32, top: 51.33 }
…
<div className="relative w-full bg-yellow-200" style={{ height: BAND_H }}>
```

The export stays committed because restoring the shape is a one-line change and
an uncommitted asset is not.

> **The band is not the clipping element, and that was a real bug.** The
> portrait's white ring extends past its own box, and clipping at the band sliced
> the bottom of that ring flat — reported twice as "the avatar is getting
> clipped", and found by measuring the ring's overhang rather than by looking.
> The card's own `overflow-hidden` keeps everything inside the rounded corners;
> nothing else needs to clip. The same shape of mistake will recur with any
> straddling element.

The portrait export is larger than the circle it fills (116.564 against 104)
because of its own white ring and shadow, so it is **centred on the circle, not
aligned to it** — `left`/`top` are `((1 − 116.564/104) / 2) × 100 = −6.04%` and
the size is `112.08%` (`CoachCard.tsx:142-153`). That is the same class of
derivation as §9's rotated bounding box: derive the offset from the ratio, never
transcribe it.

---

## 11. Organic multi-layer figures — the split-layer technique

Not waves, but the same family of problem: a shape that has to stay in register
with itself while parts of it move.

**The mascots.** `public/illustrations/consumer-welcome/README.md` is the
authority. Every layer was produced by lifting `<path>` elements **verbatim** out
of a flat export and giving them that file's own unmodified `<svg>` open tag — so
every layer keeps its source's full coordinate space and the set stacks in
perfect register **with no offsets to transcribe**.

- Sleeping pillow (welcome): `pillow-body / -face / -brows`, plus
  `z-small / -medium / -large`, all in the 210.646 × 188 space of
  `pillow-mascot.svg`.
- Awake pillow (Home, My Modules, Need Help): `awake-ground / -pillow /
  -features / -eyes / -brows`, all in the 138.158 × 90 space of
  `awake-body.svg`.

The two flat sources (`pillow-mascot.svg`, `pillow-awake.svg`) have **no code
references and must not be deleted** — they are the only way to re-split without
a fresh export.

Three consequences worth knowing before you touch one:

- **Layers translate; they do not scale or rotate.** Each layer spans the whole
  box, so `scale` or `rotate` on a *layer* pivots about the box's centre rather
  than the feature's own, and a scaled brow visibly slides sideways. Translation
  is origin-independent. The head tilt is therefore applied to the **whole
  mascot**, which is one element with its own box.
- **A flip needs its own origin.** The asleep state turns the eyes over with
  `scaleY(-1)` about `center 40.64%` — the eyes' measured vertical midpoint
  (31.31–41.83 of 90) in the export's space. A `scaleY(-1)` on a full-box layer
  would mirror the box and drop the eyes to the chin (`ConsumerCanvasWave.tsx:273-274`).
- **Resize by transform, never by width.** `ConsumerMascotFigure`
  (`ConsumerCanvasWave.tsx:~683-700`) reserves the *scaled* box and applies
  `scale-[0.6444]` inside it, because the layers are absolutely positioned in the
  export's own coordinate space and the floating "z"s sit at fixed px offsets
  (`top: -38`) that a width change would move out of register. The welcome pillow
  does the same at `scale-[0.827]`.

**A derived variant must come from the asset that already registers, never from a
second set of numbers.** Need Help's ground shadow is `awake-ground.svg` with one
`fill` changed and nothing else — same box, same `cx`/`cy`/`rx`/`ry` — so it
registers by construction. Transcribing the frame's own `mt: 82` for it would
have moved a correct shadow, because the frame's ellipse sits at the bottom of a
138.158 × 97.79 group where this one sits at the bottom of a 138.158 × 90 box.

**The mood pillows** (`SessionFeedbackModal.tsx`) are the same idea with two extra
rules: the selected states are **different exports**, never the resting ones
tinted or filtered; and the glow is sized in `cqw` so it scales with the pillow —
`drop-shadow(-2.3848cqw 9.5397cqw 14.3119cqw rgba(...))` — because fixed px would
leave a phone with a shadow twice as deep as its own pillow.

---

## 12. Traps

This is the part that cannot be read off the source. Every one of these has cost
this project real time.

### 12.1 A mask and the outline that frames it must come from ONE path

**This project has shipped a photo sitting outside its own outline three separate
times.** Every occurrence had the same cause: Figma exports the mask and the
outline as two files at two sizes, positioned relative to each other by
hand-transcribed offsets, and the two sets of numbers drift.

The measured evidence, from the resource card's own export set: mask 320.278 ×
245.993, outline 323.845 × 256.432, placed at `ml 4.55` and `ml 15.48`
respectively. Transcribe both and the photo overhangs its frame by 9–10px on
every variant. Nobody spots that in a screenshot; it reads as "the illustration
looks a bit off".

**The fix is structural, not better numbers.** Render **one** path **twice inside
one inline SVG** — once as a `clipPath` for the image, once as the visible
stroke:

```
<defs><clipPath id={uniqueId}><path d={PATH}/></clipPath></defs>
<image  …  clipPath={`url(#${uniqueId})`} />
<path d={PATH} fill="none" stroke={…} strokeWidth={…} />
```

Same `d`, same `viewBox`, same element. They cannot drift at any size, rotation
or skew — and the stroke scales with the container for free, because it rides the
same transform. The two correct implementations to copy are
`ModuleSummaryCards.tsx:300-340` (with `pillowFrame.ts`) and
`ResourceCard.tsx:141-172` (with `resourceBlobFrame.ts`).

`ModuleHeroWave.tsx` solves the same problem a different way and is worth
understanding as the other valid answer: there the photo and its yellow stroke
were **never two shapes** — Figma exports them as one image with the curve cut
and the line drawn on it, so the stroke physically cannot land off the edge.
**Do not "improve" that by splitting it into a CSS photo under an SVG wave.**

Three corollaries:

- Give the `clipPath` a **`useId()`** id when more than one can be on screen.
- Paint a **fallback fill path under the image**, so a failed load shows the
  shape rather than a hole.
- The rule applies to a mask and *its* outline. A decorative shape behind the
  frame (the resource card's backdrop blob) keeps its own `d`, because nothing is
  registered against it.

### 12.2 `preserveAspectRatio="none"` makes the box the geometry

Every wave export in this portal carries it. It means the SVG has **no intrinsic
aspect ratio behaviour at all**: hand it a different-shaped box and the curve
*shears* rather than being cropped or letterboxed. The wavelength changes with
the width.

That is why there is a purpose-drawn export per breakpoint, and why serving one
file at both widths broke it twice:

- `-14.81% / 132.14%` of the padded content column gave a 432 × 998 box on a
  phone — a **2.3×** vertical stretch.
- "Fixing" that to `100vw` made it 375 × 998 — a **4.5×** squash, which is what
  turned the gentle crest into narrow spikes, reported as "background pillow
  skewed, broken".

There is no ratio that satisfies both ends. That is presumably why the designer
drew two.

**The rule that follows is "clip, never squash":** hold the export at or near its
drawn width and let the viewport crop it. `max(100vw, 1281px)` in
`ConsumerCanvasWave.tsx:192` is exactly that; so is the fixed-height window in
`ConsumerCompletionHero.tsx:100`.

**The one sanctioned exception** is `CoachProfileModal`'s hero (§7), where the
band is decorative, its height is bounded, and nothing is registered against the
curve. If you want to stretch a wave, those three conditions are the test.

### 12.3 A width-proportional hero band needs a viewport-HEIGHT cap

A Figma artboard has no viewport, so a band drawn at 380 of a 982-tall frame
looks like 38% of the page there. On a real **1500 × 772** laptop the same
width-proportional ratio gives a **445px** band in a ~700px viewport — **63% of
the screen** — and the module name, its description and both CTAs all fall below
the fold. Reported from a real machine; the frame cannot show it.

```ts
// ModuleHeroWave.tsx:122
const HEIGHT_CAP = 'min(32vh, 380px)'
```

**Cap the height, not the width.** The image is anchored to the window's bottom
edge at a width set by the container, so a shorter window **crops the top of the
photograph and leaves the wave curve — the thing that must not be messed with —
pixel-identical.** Capping the width would distort it instead.

Measured: at 1200 × 900 and 1440 × 900 the cap is what binds (288px, not the
356/427px the width would give). At 375 × 812 and 768 × 1024 the width binds and
the cap is inert. That is the correct shape for a cap — it should only bite on
viewports shorter or wider than the one the frame was drawn at.

The value has been tuned four times (42vh/480 → 30 → 24 → 27 → 32vh/380) against
the live page, as chrome was added above and below the band. It is a knob;
`min(Nvh, Mpx)` is the form.

### 12.4 Never mix a named breakpoint variant with an arbitrary-property one

```
[--wave-s:1.6] sm:[--wave-s:1.25] min-[1200px]:[--wave-s:1]
```

Measured live, that resolved to **`1.25` at a 1680px viewport**. The band came out
623px deep instead of 498.

**Mechanism:** Tailwind v4 emits arbitrary-property utilities in a different part
of the stylesheet from named-breakpoint ones. The two rules have **equal
specificity**, so the cascade falls through to source order — and source order
put the `sm:` rule after the `min-[1200px]:` one. It is not that one variant is
stronger; it is that nothing decides, so the file order does, invisibly.

**Write them all as `min-[Npx]:`.** Both current cases do:

```ts
ModuleHeroWave.tsx:142    '[--wave-s:1.6] min-[640px]:[--wave-s:1.25] min-[1200px]:[--wave-s:1]'
ModuleSummaryCards.tsx:143 '[--pillow-s:0.88] min-[640px]:[--pillow-s:0.8] min-[1200px]:[--pillow-s:1]'
ModuleSummaryCards.tsx:197 '[--pillow-max-h:180px] min-[640px]:[--pillow-max-h:220px] min-[1200px]:[--pillow-max-h:260px]'
```

Note `min-[640px]:` is the same width as `sm:` and is spelled the long way *on
purpose*. If you tidy it to `sm:`, you reintroduce the bug.

This is invisible in a screenshot unless you happen to be at a width where the
wrong value shows — check by reading the custom property back:
`getComputedStyle(el).getPropertyValue('--wave-s')`.

### 12.5 An arbitrary *property* can silently fail to compile under stacked variants

```
motion-safe:hover:[--pillow-hover:1.07]
```

Tailwind emitted **no CSS rule at all** for that. Verified by walking every
stylesheet looking for the property name and finding zero matches — while the
class sat correctly in the DOM, and setting the variable by hand scaled the image
correctly. Nothing errors; the feature is simply inert.

Unprefixed arbitrary properties work. `min-[Npx]:`-prefixed ones work (§12.4 is
proof — they compile, they just order badly against named variants). Stacked with
`motion-safe:hover:` they do not.

**Do not go hunting for which variant combinations survive the scanner.** Drive
the custom property from React state instead, so it cannot silently fail to
compile:

```tsx
// ModuleSummaryCards.tsx:236-240, 309 — the shipped fix
const [raised, setRaised] = useState(false)
const scale = !reduceMotion && raised ? PILLOW_HOVER_SCALE : 1
…
transform: `rotate(${pillow.rotate}deg) skewX(${PILLOW_SKEW}deg) scale(${scale})`
```

The same reasoning is recorded at `CoachProfileModal.tsx:121-128`, where the
portrait's two size pairs are written as responsive classes at the call sites
rather than as a custom property — and where a first pass used
`var(--coach-portrait)` **without ever defining it**.

### 12.6 Preflight's `img { max-width: 100% }` silently clamps an oversized export

These illustrations are **deliberately wider than their container** — that is how
a full-bleed band and a torn frame with shadow bleed work. Tailwind's preflight
sets `img { max-width: 100% }`, which clamps them back to the parent's padded
width and flattens the curve or compresses the shape.

It is silent in every way that matters: the inline `width` sits correct in the
DOM the whole time. It was found by comparing `getComputedStyle().width` against
the inline value, which is the only way to see it.

**Every oversized `<img>` in this portal carries `maxWidth: 'none'`**, and each
one is commented as load-bearing rather than defensive:
`ConsumerCanvasWave.tsx:85`, `ModuleHeroWave.tsx:175`, `ConsumerWelcome.tsx:109`
(`LAYER_STYLE`) and `:707`, `ConsumerCompletionHero.tsx:50` and `:111`,
`CoachProfileModal.tsx:241` (as the `max-w-none` class).

### 12.7 Clipping: `overflow-clip` vs `overflow-hidden`, and where the clip belongs

These bands are wider than the viewport and several carry drop-shadow filters
that spill further still. Something must clip them or they produce a real
horizontal page scroll.

Two distinctions that matter:

- **`overflow-clip` is the right default on a page container.** `overflow-hidden`
  makes the box a *scroll container*: it clips and it also becomes scrollable
  programmatically, it establishes a new formatting context, and per spec setting
  one axis to `hidden` computes the other to `auto` — which is how you end up
  with an unexpected vertical scrollbar. `overflow-clip` clips and nothing else.
  Page shells use `overflow-clip` (`ConsumerHomePage`, `ConsumerLessonsPage`,
  `ConsumerHelpPage`, `ConsumerAccountPage`, `ConsumerWelcome`'s section);
  `overflow-hidden` is used where the box genuinely *is* a clip window with
  something pinned inside it (`ModuleHeroWave.tsx:159`,
  `ConsumerCompletionHero.tsx:92`, `ConsumerWelcome.tsx:672`).
- **Clip at the element that owns the rounded corner, not at the nearest
  ancestor.** §10's white ring was sliced flat because the clip was put on the
  yellow band it straddles instead of on the card.

A shadow needs room inside its own clip. Two measured cases: the diary band's
window is 470px rather than the frame's 368 so the wave's soft shadow has ~106px
of room (§6), and the session-plan scroller carries `py-4` because `overflow-x:
auto` also clips the *vertical* axis and the next-session cell's
`2px 5px 10px` shadow reaches 15px below the card.

Check with `document.documentElement.scrollWidth === window.innerWidth`. Measured
clean on all six surfaces at 375, 768, 1200 and 1440.

### 12.8 `sr-only` inside a horizontally-scrolling row widens the whole document

Tailwind's `sr-only` is `position: absolute` + `white-space: nowrap`. Inside a
horizontal scroller it **escapes the clip** and pushes the document wider —
measured once at `documentElement.scrollWidth` **2399px against a 1281px
viewport**, a real user-visible horizontal page scroll, confirmed by calling
`window.scrollTo(500, 0)` and reading `scrollX` back.

It was isolated by **bisection, not by reasoning**, and that mattered: a second
independent cause (`min-w-0` missing on the carousels) was present at the same
time, and fixing it changed nothing. Hiding every `.sr-only` dropped the width
straight to 1281.

**Put the accessible name on the element as `aria-label` instead** — same
information to a screen reader, no box. The rule is written into three components
that contain scrollers (`SessionPlanStrip.tsx:520-523`, the chapter carousel in
`ConsumerModulePage.tsx`, and `ModuleSummaryCards`); the chapter carousel's own
`sr-only` text sits deliberately *outside* the scroller.

The related rule: **a new grid or flex container needs `min-w-0` on the container
*and* its cells.** Items default to `min-width: auto`, so one wide child sizes the
track instead of scrolling inside its own box. That has produced a real
horizontal page scroll three times in this project.

### 12.9 An RGBA export is not necessarily transparent

A Figma PNG export came back **RGBA with all 1,512,000 pixels opaque**, over a
baked `#f5f5f7` plate. The artwork looked right in isolation and arrived on
screen sitting in a grey rectangle.

**Count the alpha channel before trusting an export**, and do it again on every
re-export, because Figma will reintroduce the plate:

```js
const img = new Image(); img.src = '/illustrations/…';
await img.decode();
const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
const d = x.getImageData(0, 0, c.width, c.height).data;
let transparent = 0, partial = 0;
for (let i = 3; i < d.length; i += 4) { if (d[i] === 0) transparent++; else if (d[i] < 255) partial++; }
console.log({ size: [c.width, c.height], transparent, partial, total: d.length / 4 });
```

Run against the committed module hero band just now:

```
{ size: [2000, 699], transparent: 149678, partial: 9983, total: 1398000 }
```

10.7% fully transparent, ~0.7% anti-aliased edge. That is a real alpha channel.
A baked plate shows as `transparent: 0`.

Fixing one means stripping the plate **and** un-blending the anti-aliased edges,
and it has to be redone every time.

### 12.10 Three smaller ones, each of which has cost a round

- **Do not put `display` into a shared inline style object.** An inline style
  beats a class, so a `hidden sm:block` pair stops working and both breakpoint
  variants render at once (§2). Geometry in the object, visibility in the classes.
- **Tailwind v4 emits `translate-y-*` as the standalone CSS `translate`
  property, not `transform`.** `getComputedStyle(el).transform` reads `none` on
  an element that is visibly offset. A first pass transitioned `transform`, so
  the class toggled, the band moved to the right place, and it **teleported**
  instead of sliding. `ConsumerFlowFooter.tsx:64` transitions `translate` for
  exactly this reason. A screenshot cannot show it; only reading both properties
  back can.
- **Figma's shadow `radius` maps 1:1 to CSS `box-shadow` blur, but to *half*
  that as a `filter: drop-shadow()` standard deviation.** The mood-pillow glow
  halves Figma's 36 to 18. Getting this backwards doubles or halves every soft
  edge in a composition.

---

## 13. Checklist — adding or re-exporting a wave or blob

**Before you export**

- [ ] Does the shape frame a photo? If so, export it as **one** vector with the
      image as a fill and the line as a stroke (as `lesson-hero-wave.webp` is),
      **or** export the outline alone and render it twice in one inline SVG
      (§12.1). Never two files.
- [ ] Does it need to work at both 375 and ≥1200? If it carries
      `preserveAspectRatio="none"`, ask the designer for **one export per
      breakpoint** (§12.2). Do not plan to stretch one.
- [ ] If the shape carries a hand-added stroke, note that a re-export drops it
      and reverts the viewBox — reapply both together (§8).

**When the file lands**

- [ ] Commit it under `app/public/illustrations/consumer-*/`.
- [ ] If it is a raster: **count the alpha channel** with the snippet in §12.9.
      `transparent: 0` means a baked plate.
- [ ] If it is a photograph with alpha, WebP over PNG — an order of magnitude on
      file size (§5).
- [ ] Extract any `d` you need **programmatically**. Never retype a path.

**Wiring it up**

- [ ] Express every offset as a **share of one box**, so the composition scales
      with one number (§5, §9). Derive ratios; do not transcribe absolute
      positions from the frame.
- [ ] Give the oversized `<img>` **`maxWidth: 'none'`** (§12.6).
- [ ] One transform on one element, composed in the right order — not a stack of
      wrappers that can drift (§5).
- [ ] If the shape has per-breakpoint sizing, use **one custom property** and
      write **every** variant as `min-[Npx]:` (§12.4). Never `sm:` alongside.
- [ ] If it changes on hover or focus, drive it from **React state**, not a
      stacked-variant arbitrary property (§12.5).
- [ ] Visibility lives in classes; the shared style object holds geometry only
      (§12.10).
- [ ] A `clipPath` id that can appear more than once on a page comes from
      `useId()` (§12.1).
- [ ] Decorative: `alt=""` **and** `aria-hidden="true"`, plus
      `pointer-events-none` on anything overlaying content.

**Before you call it done — measure, do not look**

- [ ] `document.documentElement.scrollWidth === window.innerWidth` at **375,
      768, 1200 and 1440** (§12.7).
- [ ] Read the custom property back at a width **above** your largest
      breakpoint: `getComputedStyle(el).getPropertyValue('--wave-s')` (§12.4).
- [ ] Read the painted size back and check it against your own arithmetic —
      remember a skew grows the bounding rect (§5).
- [ ] Check it on a **short** viewport, not just a narrow one: 1500 × 772 is the
      case that produced the height cap (§12.3).
- [ ] If anything is stroked or masked, sample the edge at two sizes and confirm
      the stroke still hugs the image.
- [ ] Run `layoutAudit()` from `docs/layout-audit.js` — an empty array is the
      pass condition. (Currently empty on every consumer surface at all four
      widths, and at 150% text size.)
- [ ] Check the console **in a fresh tab**. The preview tool's console reader
      returns a retained buffer that survives `location.reload()` and
      `console.clear()`.
