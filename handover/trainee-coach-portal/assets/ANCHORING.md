# Artwork asset pack and anchoring guide

Care2Sleep — Coach Delivery Portal (trainee onboarding, home banners, certification).

This document exists because the artwork in this app is **composed, not placed**. Several
pieces — the onboarding doodle layer especially — have no per-element coordinates anywhere
in the code: their position is baked into path coordinates inside a shared artboard. Handed
a flat `doodles.svg` you cannot place, resize, or animate any one of them. This pack splits
them out and tells you exactly where each one sits.

Every number below is measured from the source or read back from the running app at
`localhost:57953`. Where a value looks arbitrary, the line says what it compensates for.
Anything that could not be determined is called out as a gap rather than guessed.

**Animation timings are out of scope here — see `motion-spec.md`.** The one exception is
rotation (§3), because in this composition rotation *is* anchoring: the doodles rotate about
their own centres and the resting angle differs per screen.

---

## 0. What is in this pack

```
assets/
├── ANCHORING.md            ← this file
├── doodles/                ← NEW. 9 individually placeable SVGs (§1–§3)
├── onboarding/             blob-back.svg, doodles.svg (the original flat layer), photo.jpg
├── home/                   banner-back.svg, banner-back-gold.svg, banner-mask.svg,
│                           banner-outline.svg, wave.svg
├── stage/                  back-purple, back-yellow, badge, check, cloud, rosette,
│                           sparkle, star, star-bubble
├── debrief/                doodle-badge, doodle-check, doodle-cloud, doodle-sparkle
├── tour/                   chart-line.svg, left-doc.svg
├── confetti/               f01.png … f20.png (§6)
├── certificate/            certificate.svg, certificate-earned.svg
├── enroll/                 enroll-dyad-main/front.svg, enroll-carer-main/front.svg
└── misc/                   session-plan-calendar.svg
```

Filenames are preserved from `public/illustrations/` so any asset can be traced back to its
call site. Where each group is consumed:

| Group | Consumed by |
|---|---|
| `onboarding/`, `doodles/` | `DeliveryOnboarding.tsx`, `Doodles.tsx` (4-screen first-run flow) |
| `home/` | `BannerBlob` in `DeliveryHomePage.tsx`; `wave.svg` also in `WaveDivider.tsx` and `ModulePlayerNav.tsx` |
| `stage/` | the stage "what to expect" / "notes" banners in `DeliveryHomePage.tsx` |
| `debrief/` | session-debrief banner (`DeliveryConsumerDetailPage.tsx`, `SpacesCoachProfilePage.tsx`) |
| `tour/` | `DeliveryTour.tsx` coachmarks |
| `confetti/` | `Confetti.tsx`, certification card |
| `certificate/` | `DeliveryAccountPage.tsx`, `DeliveryHomePage.tsx`, `CoachProfilePage.tsx` |
| `enroll/`, `misc/` | Research Dashboard wizards (`EnrollConsumerDialog.tsx`, `SpacesCoachProfilePage.tsx`) |

`onboarding/photo.jpg` (533×800, 104 KB) is **shared**: the onboarding cards, the home
banner blob and the stage banners all use this one image. It is a resample of an 8.4 MB
original; keep it at 533×800 or larger — the largest painted card is ~206 px wide but the
crop (§5) draws from a region taller than the card.

---

## 1. Coordinate system — read this before placing anything

### The parent

The doodle layer is a **single `<svg>` absolutely positioned inside the onboarding artwork
block**, and it is the *last* child of that block, so it paints above all three photo cards.

```
artwork block   position: relative; display: flex; align-items: center; justify-content: center
                height: 178.426px  (fixed — see §5)
                width:  auto, sized by the card row; centred on the page
                        512.92px (screen 1) · 521.48px (screen 2) · 503.95px (screens 3–4)

doodle layer    position: absolute; top: 50%; left: 50%; translate(-50%, -50%)
                width:  560.018px    ( = 700.023 × ART_SCALE )
                height: 200.865px    ( = 251.081 × ART_SCALE )
                pointer-events: none
```

Measured live on screen 1: block `512.9 × 178.42`, layer `560.02 × 200.86`, layer offset
`-23.56, -11.22` from the block's top-left. That negative offset is expected and correct —
**the doodle layer is wider and taller than the card row and deliberately overhangs it.**
Both are centred, so the layer's position on the page is identical on all four screens even
though the card row's width changes.

### The artboard, and what the path coordinates mean

Every doodle path carries coordinates in the **original Figma artboard space**:

```
artboard: 700.023 × 251.081   (viewBox "0 0 700.023 251.081")
```

That artboard has **no padding — it is exactly the union bounding box of the nine doodles.**
Verified: `star-left` touches x = 0, `cloud-topleft` touches y = 0, `cloud-bottomright`
ends at x = 633 + 67.023 = 700.023, `star-right` ends at y = 213 + 38.081 = 251.081. So the
four extremes of the artboard are each defined by one doodle, and any re-export that changes
one of those four shapes changes the artboard.

**The mapping onto the rendered layout is one uniform scale and nothing else:**

```
rendered_px = artboard_units × ART_SCALE          ART_SCALE = 1 / 1.25 = 0.8
```

There is no per-doodle `left`/`top` anywhere in the code, no percentage positioning, no
transform other than the shared `translate(-50%, -50%)` on the layer and each doodle's own
rotation. **Position is entirely a property of the path data.** That is the whole reason a
flat export cannot be pulled apart by hand, and the whole reason this pack exists.

### How to rebuild it from the extracted files

Each file in `doodles/` keeps its **original artboard coordinates in its `viewBox`**, e.g.

```xml
<svg width="67.023" height="48.287" viewBox="180.401 0 67.023 48.287"> <!-- cloud-topleft -->
```

so the file is self-contained and renders correctly on its own (verified — §2), while the
`viewBox` min-x / min-y *is* its artboard position. Two equivalent ways to place them:

**A. Percentage placement** (recommended — survives any layer size):

```css
.doodle {
  position: absolute;
  left:   calc(var(--x) / 700.023 * 100%);
  top:    calc(var(--y) / 251.081 * 100%);
  width:  calc(var(--w) / 700.023 * 100%);
  height: calc(var(--h) / 251.081 * 100%);
  transform: rotate(var(--deg));      /* about the element's own centre — §3 */
}
```

**B. Re-inline into one SVG.** Drop each file's `<path>` elements back into a single
`<svg viewBox="0 0 700.023 251.081">`, one `<g>` per doodle, and rotate each `<g>` with
`transform-box: fill-box; transform-origin: center`. This is what the app does today
(`Doodles.tsx`) and it is the lowest-risk path if you are reproducing the app exactly:
the path data in these files is **verbatim** from the component, so re-inlining is lossless.

Note for option B: `transform-box: fill-box` is load-bearing. Without it the rotation origin
is the whole 700 × 251 canvas and the outer doodles swing across the layout instead of
spinning in place.

### Fills

Doodle paths are **fill-only — no strokes anywhere**, so nothing needs stroke-width scaling.
Three fill values are in use and all three are preserved byte-for-byte in the extracted files:

| Fill | Used by |
|---|---|
| `#D9B321` (gold) | `star-left`, `star-right` |
| `#261D2A` (near-black) | the ink outline of every other doodle, and the second path of both clouds |
| `white` | the cloud bodies only (first path of each cloud) — sits *under* its `#261D2A` outline |

The two cloud files each contain **two paths in a fixed order**: white body first, then the
`#261D2A` line-work. Do not reorder them; the body would paint over the outline.

---

## 2. The nine doodles — anchoring table

`x, y, w, h` are the doodle's own `getBBox()` **in artboard units** (read from the live DOM,
3 dp). "Rendered" is the same box at `ART_SCALE = 0.8`, i.e. px inside the 560.018 × 200.865
layer. All nine appear on **all four onboarding screens** — the layer's composition is fixed
and only rotation changes (§3).

| Key (file) | Glyph actually drawn | x | y | w | h | left % | top % | Rendered px (w × h @ 0.8) | Rendered offset (x, y) |
|---|---|---|---|---|---|---|---|---|---|
| `star-left` | gold 5-point star | 0 | 118 | 36.180 | 38.081 | 0.000 % | 46.997 % | 28.94 × 30.46 | 0.00, 94.40 |
| `cloud-topleft` | looped doodle cloud | 180.401 | 0 | 67.023 | 48.287 | 25.771 % | 0.000 % | 53.62 × 38.63 | 144.32, 0.00 |
| `cloud-bottomright` | looped doodle cloud | 633.000 | 202 | 67.023 | 48.287 | 90.426 % | 80.452 % | 53.62 × 38.63 | 506.40, 161.60 |
| `sparkle-a` | **thick open ring** | 92.401 | 224 | 14.595 | 14.585 | 13.200 % | 89.214 % | 11.68 × 11.67 | 73.92, 179.20 |
| `tick-right` | **8-spoke asterisk** | 680.467 | 126.555 | 19.197 | 19.871 | 97.206 % | 50.404 % | 15.36 × 15.90 | 544.37, 101.24 |
| `star-right` | gold 5-point star | 484.000 | 213 | 36.180 | 38.081 | 69.140 % | 84.834 % | 28.94 × 30.46 | 387.20, 170.40 |
| `sparkle-b` | **8-spoke asterisk** | 346.000 | 24 | 19.197 | 19.871 | 49.427 % | 9.559 % | 15.36 × 15.90 | 276.80, 19.20 |
| `asterisk-a` | **4-point sparkle** | 564.401 | 23 | 23.570 | 23.758 | 80.626 % | 9.161 % | 18.86 × 19.01 | 451.52, 18.40 |
| `asterisk-b` | **4-point sparkle** | 250.401 | 227 | 23.570 | 23.758 | 35.770 % | 90.409 % | 18.86 × 19.01 | 200.32, 181.60 |

**Four of the nine keys do not describe the shape they name.** `sparkle-a` is a ring;
`tick-right` and `sparkle-b` are asterisks; `asterisk-a` and `asterisk-b` are four-point
sparkles. This is confirmed visually, not inferred. **The names are kept anyway** — they are
the keys of `DOODLE_SPIN` (§3) and renaming them would silently break the rotation mapping,
which is the thing this document is trying to make safe. Treat the key as an id and this
column as the description.

Two pairs are the same vector at the same size, differing only in position: the two clouds
(both 67.023 × 48.287) and the two asterisks (both 23.570 × 23.758); the two gold stars are
likewise identical (36.180 × 38.081), as are `tick-right` / `sparkle-b` (19.197 × 19.871).
Nine files, five distinct shapes.

### Z-order

The doodle layer is a **single element**, appended after all three photo cards with no
`z-index` on anything, so **every doodle paints above every card**, including above the
purple stroke and the white backing sheet. There is no interleaving — no doodle sits behind
a card. If you need one behind, that is a new composition, not a re-ordering.

---

## 3. Rotation — `DOODLE_SPIN`

Each doodle rotates a few degrees **about its own bounding-box centre** on each screen
change. The stored values are **per-step deltas**, and the applied rotation is the
**cumulative sum up to the current screen** — a doodle carries on from where the previous
screen left it rather than snapping back to zero.

```
rotation(name, step) = sum of DOODLE_SPIN[name][0 .. step]
```

Index 0 is always 0: nothing rotates on arrival at screen 1.

**An engineer implementing this needs the absolute column, not the delta column.** Both are
given; the deltas are included so the intent is auditable.

| Key | Δ s1 | Δ s2 | Δ s3 | Δ s4 | **abs s1** | **abs s2** | **abs s3** | **abs s4** |
|---|---|---|---|---|---|---|---|---|
| `star-left` | 0 | +14 | 0 | −9 | **0°** | **+14°** | **+14°** | **+5°** |
| `cloud-topleft` | 0 | −10 | 0 | +12 | **0°** | **−10°** | **−10°** | **+2°** |
| `cloud-bottomright` | 0 | 0 | +13 | 0 | **0°** | **0°** | **+13°** | **+13°** |
| `sparkle-a` | 0 | +18 | 0 | 0 | **0°** | **+18°** | **+18°** | **+18°** |
| `tick-right` | 0 | 0 | −15 | +11 | **0°** | **0°** | **−15°** | **−4°** |
| `star-right` | 0 | −12 | 0 | +16 | **0°** | **−12°** | **−12°** | **+4°** |
| `sparkle-b` | 0 | 0 | −17 | 0 | **0°** | **0°** | **−17°** | **−17°** |
| `asterisk-a` | 0 | +10 | +14 | 0 | **0°** | **+10°** | **+24°** | **+24°** |
| `asterisk-b` | 0 | 0 | 0 | +20 | **0°** | **0°** | **0°** | **+20°** |

The set is deliberately **sparse** — four or five of the nine move on any given step, never
all nine — so the layer reads as incidental drift rather than a synchronised carousel. The
values are hand-picked, not randomised at runtime, so every load and every screenshot is
identical.

### Two rules these values exist to satisfy

Both were learned by measuring a first pass that was reported as *"only two doodles move,
the clouds don't move"* — when in fact all nine were rotating. Do not re-derive them:

1. **Under about 8° is invisible** on shapes this small. The first pass used 3–9° and only
   the two 9° entries registered to the eye at all.
2. **Deltas must not cancel.** `cloud-topleft` originally went −3 then +4: a net **1° across
   the entire four-screen flow**, so it genuinely never appeared to move even though the
   transform was changing every step. Check the **absolute** column, not the deltas — each
   doodle must end somewhere clearly away from where it started.

The corollary for review: *"nothing is animating"* on this layer usually means it is
animating too little. Measure the computed transform before rewriting anything.

---

## 4. The photo-card blob — the single most important rule in this pack

### The rule

> **A mask and the outline that frames it must be derived from one source. Never transcribe
> both. Render one path twice — once as a `clipPath`, once as a stroked `<path>` — in one
> inline SVG.**

### Why it is stated as a rule

Deriving the two separately has shipped a visibly broken result **three times** in this
project:

| Round | What happened | Measured error |
|---|---|---|
| 30 | onboarding card: mask exported at 178.772 × 137.307, outline at 180.762 × 143.134, aligned by six hand-transcribed offsets | photo outside its own outline |
| 31 | every blob variant: the frames' own numbers put mask and outline on different rects | photo overhung the stroke by **9–10 px** |
| 34 | onboarding again: Figma's per-card `mask-position` does not scale with the card | middle card **~19 px** out of register |

In all three the symptom is the same and unmistakable: the photograph spills past the purple
line that is supposed to frame it. It is not a rendering bug, a rounding issue or a browser
difference — it is two numbers that were never guaranteed to agree.

The current implementation makes the guarantee structural. There is no alignment to verify
after an export, because there is nothing to align: the clip and the stroke are the same `d`
in the same `viewBox`, on the same element, so they cannot disagree at any scale or rotation
— including at every intermediate frame of an animation, not just at the four resting states.

### The path

`BLOB_PATH` is a single closed path, 21 segments, given in full in
`design/prototype/care2sleep-prototype/src/components/delivery/blobFrame.ts`. It is not
reproduced here to guarantee there is only ever one copy of it — copying it into this
document would be committing the exact mistake this section is about. Copy it from that file.

```
BLOB_W         = 180.762            viewBox "0 0 180.762 143.134"
BLOB_H         = 143.134
aspect         = 180.762 / 143.134 = 1.26289
BLOB_STROKE_W  = 4.09282
stroke ratio   = 4.09282 / 180.762 = 0.022642 of card width  ← constant across every card size
BLOB_STROKE    = #A070FF
```

The stroke ratio being constant is why **one scaled SVG reproduces all twelve exported card
variants, outline weight included** — the stroke rides the same `viewBox` transform, so it
thickens and thins proportionally for free. Nothing needs a per-size stroke value.

### Structure to reproduce

```
<svg viewBox="0 0 180.762 143.134" style="overflow: visible">
  <defs><clipPath id="blob-clip-UNIQUE"><path d="{BLOB_PATH}"/></clipPath></defs>
  <image href="photo.jpg" x="-18.51" y="-46.9" width="215.789" height="323.645"
         preserveAspectRatio="xMidYMid slice" clip-path="url(#blob-clip-UNIQUE)"/>
  <path d="{BLOB_PATH}" fill="none" stroke="#A070FF" stroke-width="4.09282"
        stroke-linejoin="round"/>
</svg>
```

Three details that are load-bearing:

- **`overflow: visible`.** The stroke is centred on the path, so its outer half falls outside
  the `viewBox` and would otherwise be clipped along every edge.
- **The `clipPath` id must be unique per instance.** SVG ids are global to the document and
  three cards are on screen at once; the app generates one per component instance. Two cards
  sharing an id silently clip both to whichever definition won.
- **No `overflow: hidden` on the container.** An earlier version had one and it clipped the
  mask window itself, slicing the photo inside its own torn frame. Found by measurement, not
  visible as an obvious break.

### The one place this pattern is *not* used — and why that is a live risk

`home/banner-mask.svg` + `home/banner-outline.svg` are still a **separate mask and outline
pair** (`BannerBlob` in `DeliveryHomePage.tsx`). That composition is a single static instance
that never animates between sizes, so the frame's numbers went in as-is — but the frame's own
values *did* disagree (mask `352.958 × 269.221` at `38.441, 100.903` against a
`353.325 × 279.776` outline: the window 10.5 px short and pushed 9 px down), and the shipped
code carries a **hand-computed `mask-position: 36.185px 91.511px`** derived from the outline's
position rather than the mask's. It is correct today and it is commented, but it is the only
place left in the artwork where the two can drift.

**If `home/banner-mask.svg` or `home/banner-outline.svg` is ever re-exported, that
`mask-position` must be re-derived — it will not survive a re-export.** The durable fix, if
you touch this composition, is to convert it to the `BLOB_PATH` pattern above.

The same trap is documented for the debrief banner (`728:4986`), whose frame mask
`134.006 × 102.014` and outline `135.318 × 107.15` also do not describe the same rect. That
banner sidesteps it by reusing `BannerBlob` at ~0.41 scale rather than transcribing its own
numbers. Do the same.

---

## 5. `ART_SCALE` and the three card sizes

### The constant

```
ART_SCALE = 1 / 1.25 = 0.8
```

A collective reduction of the **whole artwork block** — all three cards *and* the doodle
layer — applied on top of each card's own scale factor.

**It must multiply into the layout box, not merely into the transform.** A plain
`transform: scale(0.8)` on the container paints smaller but leaves the original box behind,
so the copy and CTA row below would not move up and the block would sit in a pool of dead
space. In the app it multiplies into each card's `scale` *and* into the width/height its
wrapper animates to, so the block's **layout** height shrinks with it. It is also what the
doodle layer's `560.018 × 200.865` comes from (§1).

Because it rides the same transform every layer already shares, the mask stays registered
with its outline exactly as it does at 1×.

### Base card geometry

The smallest card's geometry; every other card is this times a scale factor.

```
inner box       192.259 × 153.44        (the card's own layout box, pre-rotation, pre-scale)
backing box     188.808 × 153.44        white sheet wrapper
backing sheet   180.762 × 143.134       blob-back.svg, rotated a further +3.35°
stroke/photo    left 6.84, top 8.06     offset of the blob SVG inside the inner box
                180.762 × 143.134
photo (inside the blob viewBox)
                x −18.51, y −46.9, 215.789 × 323.645, preserveAspectRatio="xMidYMid slice"
```

The photo's negative offset and oversize are the frames' own crop: the source image is taller
than the card and the subject sits high in it. `slice` is SVG's `object-fit: cover`.

### The four sizes

Expressed as multiples of `BLOB_W = 180.762`:

| Name | Export width | Factor | × ART_SCALE | Painted inner box |
|---|---|---|---|---|
| `sm` | 152.489 | 0.843590 | 0.674872 | 129.75 × 103.55 |
| `md` | 180.762 | 1.000000 | 0.800000 | 153.81 × 122.75 |
| `lg` | 218.455 | 1.208523 | 0.966818 | 185.88 × 148.35 |
| `xl` | 241.711 | 1.337178 | 1.069743 | 205.67 × 164.14 |

### Per-screen card states

`marginRight` is the frames' inter-card gap; it is scaled by `ART_SCALE` too, so the row keeps
the frames' spacing-to-card ratio rather than looking loosely spread at the reduced size.
Screens 1–2 space the cards by 16; **screens 3–4 overlap them by −8**. A negative CSS `gap`
is invalid, which is why the value lives on the child as a margin.

| Screen | Card | Size | Rotation | Painted box (rotated) | marginRight (× 0.8) |
|---|---|---|---|---|---|
| 1 | left | `md` | −1° | 155.93 × 125.42 | +12.80 |
| 1 | middle | `lg` | +5° | 198.10 × 163.98 | +12.80 |
| 1 | right | `sm` | −2° | 133.29 × 108.02 | 0 |
| 2 | left | `md` | +5.57° | 165.00 × 137.10 | +12.80 |
| 2 | middle | `lg` | −4.1° | 196.01 × 161.26 | +12.80 |
| 2 | right | `sm` | +2.93° | 134.87 × 110.05 | 0 |
| 3 & 4 | left | `md` | +5.57° | 165.00 × 137.10 | −6.40 |
| 3 & 4 | middle | **`xl`** | −4.1° | 216.88 × 178.43 | −6.40 |
| 3 & 4 | right | `sm` | +2.93° | 134.87 × 110.05 | 0 |

Screens 3 and 4 share their artwork **exactly** — only copy and the CTA differ.

### The middle card's growth between screens 2 and 3

`lg → xl`, i.e. **1.208523× → 1.337178×** of base (0.966818 → 1.069743 after `ART_SCALE`).

This is the reason the cards are **one scaled SVG rather than twelve exported assets**.
Figma exports a separate blob per card per screen, but all twelve are the same shape — every
card's aspect is 1.26288 and every outline's stroke is 0.022642 of its own width — so one
element scaled reproduces all of them. Swapping between two exported PNG/SVG assets mid-flight
is a hard cut; scaling one element is continuous, which is what lets the size change animate
at all.

### Rotated bounding boxes — derive, do not transcribe

Each card's wrapper box is the **bounding box of the rotated card**, computed rather than
copied from the frame:

```
boxW = w·|cos θ| + h·|sin θ|
boxH = w·|sin θ| + h·|cos θ|
```

This reproduces all twelve frame values to within 0.011 px (e.g. 192.259 × 153.44 at 5°
scaled 1.209 → 247.62 × 204.98 against the frame's 247.623 × 204.98). It has to be computed,
not transcribed, because the wrapper must resize **continuously** while the rotation animates.

### `ART_BLOCK_H` — why the block has a fixed height

```
ART_BLOCK_H = max over all screens and cards of boxH = 178.426 px
```

(Measured live: 178.42.) It comes from screens 3–4's `xl` middle card. The row is pinned to
this on **every** screen so the copy and CTA row below do not ride up and down as the middle
card grows. Derived from the same `boundingBox` the cards lay themselves out with, so it
cannot fall out of step with them.

The copy block below uses the same idea in a different form: every screen's text is stacked
in one grid cell, all but the live one `invisible`, so the cell reserves the tallest. **If you
reproduce that, the invisible sizers must carry the identical classes as the live markup** —
`text-balance` included. Omitting it once let the sizer title wrap to two lines where the live
title wrapped to one, reserving a phantom line that pushed the CTA row down.

### Lead-card nudge

The leading card is shifted left by **12 px**, applied as `margin-left: −12` **and**
`margin-right: +12` on the same element. Both halves are required: the row's total width is
then unchanged, so the flex centring does not shift the whole group in compensation — which
is what a plain single-sided margin did, moving all three cards to fix one.

---

## 6. Confetti — 20 PNG frames, and the transparency trap

### The files

```
confetti/f01.png … f20.png     1400 × 1080 each, RGBA
total                          415,467 bytes (~406 KB) for the set
```

Hand-keyed by the designer and exported as a frame sequence. The per-file size curve confirms
it is a genuine burst rather than a loop: ~7.7 KB at f01, peaking around f05 as the confetti
fills the frame, tapering back to ~7 KB by f20 as it falls out.

PNG over the alternatives, each rejected for a measured reason: a **GIF** export came back
3840 × 142 (a 27:1 ribbon) and GIF's 1-bit alpha would fringe every piece against the card's
yellow; **SVG frames** are smaller over the wire but each carries 100+ paths and swapping them
re-rasterises all of it every tick, where a bitmap blit stays smooth on the low-end devices
this audience uses.

### Playback contract

| Parameter | Value |
|---|---|
| Frames | 20, in order, looping |
| Frame duration | 130 ms (~7.7 fps, 2.6 s per pass) |
| Passes per round | 8 back-to-back (~20.8 s, measured 20.8 s) |
| Pause between rounds | 10,000 ms (measured 10.0 s) |
| Repeat | indefinitely while the card is on screen |
| Reduced motion | **skip entirely** — do not hold a static frame; a frozen mid-burst reads as a bug |

Two implementation requirements, both deliberate:

- **All 20 `<img>` elements are mounted at once and only `opacity` switches between them.**
  Swapping a single `<img>`'s `src` decodes mid-animation and stalls; this way every frame is
  decoded before the first paint of a round.
- **The frames unmount during the pause.** Twenty decoded 1400 × 1080 bitmaps is the expensive
  part; dropping them between rounds hands that memory back. The files stay in the HTTP cache,
  so the next round re-decodes rather than re-downloads.

Placement: the card's **left half, full height**, `object-fit: cover`. At the card's
1096 × 400 that is a 548 × 398 box, within a whisker of the artwork's own 1.296 aspect, so
`cover` crops ~25 px of height and distorts nothing. Stretching it across the full card
(`object-fill`) compressed the burst 2.7× vertically and every piece read as a flattened
smear. 130 ms was reached by slowing twice: 45 ms read as a flicker, 80 ms was still hurried.

### The transparency trap — this WILL recur on re-export

**A Figma PNG export being RGBA does not mean it is transparent.** Figma baked a solid
`#f5f5f5` plate into every variant, so all 1,512,000 pixels of each exported frame came back
**fully opaque** despite the file being RGBA. The symptom is not subtle: the confetti arrives
sitting on a grey rectangle instead of over the yellow card.

The committed frames in this pack have had the plate stripped and their anti-aliased edges
un-blended from it. **Re-exporting from Figma reintroduces it** unless the variant backgrounds
are cleared in the file first.

**How to check — count the alpha channel, do not look at the file:**

```python
from PIL import Image
im = Image.open('confetti/f05.png').convert('RGBA')
a  = im.getchannel('A').tobytes()
print(len(a), a.count(0), round(100 * a.count(0) / len(a), 2), '% fully transparent')
```

Expected values for the committed frames (verified for this pack):

| Frame | Pixels | Fully transparent | % |
|---|---|---|---|
| f01 | 1,512,000 | 1,511,973 | 100.00 % |
| f05 | 1,512,000 | 1,462,313 | **96.71 %** (the densest frame) |
| f20 | 1,512,000 | 1,512,000 | 100.00 % |

**A re-export reading 0 % on every frame is the failure.** If you see that: clear the variant
backgrounds in Figma and export again; if that is not possible, strip the plate and un-blend
the anti-aliased edges against it, and re-run the check. Do not ship a frame at 0 %.

---

## 7. Re-export checklist

Run this whenever any of this artwork is regenerated from Figma.

**Doodles**

- [ ] The artboard is still `700.023 × 251.081`. If any of the four extreme doodles changed
      (`star-left` at x = 0, `cloud-topleft` at y = 0, `cloud-bottomright` ending at x = 700.023,
      `star-right` ending at y = 251.081), the artboard changed and **every** entry in the §2
      table must be re-measured.
- [ ] Re-measure each doodle's `getBBox()` inside the new artboard and update §2. Do not
      eyeball; the values are 3 dp for a reason.
- [ ] Fills are still `#D9B321` / `#261D2A` / `white` and each cloud still has its white body
      path **before** its `#261D2A` outline path.
- [ ] Paths are still fill-only. A stroke appearing on a doodle means `getBBox()` no longer
      equals the painted extent and the tight `viewBox` will clip it.
- [ ] The nine `DOODLE_SPIN` keys still exist and still map to the same shapes. If a shape was
      renamed in Figma, keep the code key and note it in §2 — do not rename the key.
- [ ] Every absolute rotation in §3 still ends clearly away from 0° per doodle (no cancelling
      deltas), and no non-zero delta is under ~8°.

**Blob / photo cards**

- [ ] `BLOB_PATH`, `BLOB_W`, `BLOB_H` and `BLOB_STROKE_W` still come from **one** source file.
- [ ] Stroke ratio is still `BLOB_STROKE_W / BLOB_W ≈ 0.022642` and the card aspect still
      `≈ 1.26289`. If either drifts, the "one scaled SVG reproduces all cards" claim is void
      and the card sizes in §5 must be re-derived.
- [ ] **No new separate mask asset was introduced.** One path, rendered twice, in one inline
      SVG. This is the check that has failed three times.
- [ ] The blob SVG still has `overflow: visible` and each instance still has a unique
      `clipPath` id.
- [ ] If `home/banner-mask.svg` or `home/banner-outline.svg` was re-exported, the hand-computed
      `mask-position: 36.185px 91.511px` in `BannerBlob` was **re-derived from the outline's
      position**, not carried over.
- [ ] Screenshot the onboarding cards at every screen and confirm no photo edge crosses its
      purple stroke — at rest *and* mid-transition on screens 2→3, where the middle card grows.

**Confetti**

- [ ] Still 20 frames, still 1400 × 1080, still named `f01`–`f20`.
- [ ] Alpha counted on at least f01, the densest mid frame, and f20. **Not 0 % transparent.**
- [ ] Total set size still in the ~400 KB range; a large jump usually means the plate is back.

**Layout, after any change**

- [ ] `ART_BLOCK_H` recomputed from the new card set (`max` of the rotated box heights), not
      left at 178.426.
- [ ] `document.documentElement.scrollWidth === window.innerWidth` — the doodle layer is wider
      than the card row by design and has produced a real horizontal page scroll before. Any
      new flex/grid container in this composition needs `min-w-0` on the container *and* its
      cells.
- [ ] Nothing in the artwork became focusable. Every layer here is decorative and carries
      `aria-hidden="true"`.

---

## 8. Known gaps

Stated rather than guessed:

- **The onboarding `<svg>`'s `viewBox` is the only record of the original Figma artboard
  size.** `700.023 × 251.081` is confirmed identical in the component and in the flat
  `onboarding/doodles.svg` export, and it equals the union bbox of the nine doodles — but the
  Figma node id for the doodle group itself is recorded only as *"node group 'Group 4'"* in a
  code comment. If you need to reopen the source group in Figma, that comment plus the parent
  frames (`607:8208`, `621:8679`) is all that exists here.
- **Doodle key ↔ glyph names are wrong for four of nine** (§2). The correct glyph is
  documented; the underlying Figma layer names were not recoverable from the code.
- **The `stage/`, `debrief/`, `tour/` and `enroll/` assets are inventoried and copied but not
  individually anchored** in this document. They are single static compositions with their
  coordinates written literally at their call sites, not a shared-artboard system, so they do
  not have the problem this pack was written to solve. `stage/` in particular is a seven-layer
  sticker composition — if you need it anchored to the same standard, that is a follow-up.
- **Card `left` positions are not given as absolute coordinates** because there are none: the
  three cards are flex children of a centred row and their positions fall out of their own
  boxes plus `marginRight` (§5). Screen-1 measured offsets from the block's left edge were
  −12.00 / 168.72 / 379.62, but those are outputs, not inputs — do not hardcode them.
