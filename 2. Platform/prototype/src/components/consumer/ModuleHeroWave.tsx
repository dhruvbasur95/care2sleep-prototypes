import { cn } from '@/lib/utils'

/**
 * The module welcome screen's photo band with its yellow wavy bottom edge —
 * Round 46, frame `818:12862`, node `819:13018` ("Background vector").
 *
 * ══ READ THIS BEFORE CHANGING ANYTHING HERE ══════════════════════════════
 *
 * **The photo and the yellow wave are ONE asset, and that is deliberate.**
 *
 * In Figma the band is a single vector: a torn-wave path carrying the photo as
 * an image fill and `yellow/500` #FFB600 as a stroke. It exports as one PNG
 * with the curve already cut and the line already drawn on it, so the stroke
 * physically cannot land off the photo's edge.
 *
 * That is the whole reason it is shipped as an image rather than rebuilt as a
 * CSS photo under an SVG wave. This project has shipped a mask sitting a few px
 * out of register with the outline meant to frame it **three separate times**
 * (Rounds 30, 31 and 34 — see `blobFrame.ts` and `design-tokens.md` §78.1), and
 * every one of them came from transcribing the two shapes independently. Here
 * they were never two shapes. Do not "improve" this by splitting them.
 *
 * The cost, stated plainly: the photo is baked in, so every module's welcome
 * screen shows this same photograph. That already matches the rest of the
 * portal — `LessonCards` uses one shared `lesson-cover.jpg` across all six
 * module cards. Giving a module its own photo means a new export from Figma
 * with that photo in the fill, not a code change.
 *
 * ── The asset ─────────────────────────────────────────────────────────────
 *
 * `lesson-hero-wave.webp`, 2000x699, from the frame's own 2670x933 export
 * resampled and re-encoded. **WebP is this repo's first**, and the reason is
 * arithmetic rather than fashion: the shape needs a real alpha channel (the
 * canvas shows through below the wave), and a photograph with alpha can only be
 * PNG or WebP. The same image is 1,976 KB as an optimised PNG and 136 KB as
 * WebP — an order of magnitude, against a repo whose largest committed asset
 * until now was 196 KB. Alpha was verified present before shipping (273,342
 * fully transparent pixels), per Round 31's lesson that a Figma RGBA export is
 * often fully opaque over a baked plate.
 *
 * ── The geometry, and why it is all one scale ─────────────────────────────
 *
 * The frame draws a 1281x380 clip window with the shape hanging out of it on
 * every side: 1341.268 x 465.962 at left -27.65, top -93, skewed -0.82deg. Only
 * the middle band is visible, which is why the export's own top and side yellow
 * edges never appear on screen.
 *
 * Every number below is expressed **relative to the window**, so the whole
 * composition scales with the viewport and there is nothing to re-derive at a
 * second width:
 *
 *   window       aspect 1281 / (380 x SCALE)
 *   image width  104.70476% of the window   (1341.268 / 1281)
 *   anchored     bottom, lifted 1.51043% of its own height
 *                (the shape's base sits 7.038px above the window's bottom edge:
 *                 -93 + 465.962 = 372.962 against a 380 window)
 *   skew         -0.82deg, the frame's own
 *
 * `SCALE` is the ONE knob for narrower screens, and it multiplies the window's
 * height and the image's width together — which is what keeps it a scale rather
 * than a stretch. At 375px the desktop proportion would give a 111px band, too
 * thin to read as a photograph; 1.6 puts it at ~178px with the identical
 * framing, just larger relative to the viewport. Same idiom as `ART_SCALE` in
 * the trainee onboarding and `ART_LIFT` in `ConsumerWelcome`: change the
 * constant, never the individual offsets, because offsets drift apart and a
 * single multiplier cannot.
 *
 * No mobile or tablet frame exists for this screen — the two `SCALE` values
 * below `min-[1200px]` are derived, and are flagged as such rather than
 * presented as transcribed.
 *
 * Horizontal centring is exact to within 2.5px of the frame (the shape's centre
 * sits 2.484px right of the window's at 1281, or 0.19% of its width). Centring
 * it costs a quarter of a pixel at a phone width and removes a magic offset,
 * so it is centred.
 *
 * Decorative: the module name and description below carry the whole message,
 * so the image is `alt=""` and the band is `aria-hidden`.
 */

/** 1341.268 / 1281 — the shape's width as a share of the clip window's. */
const IMAGE_W = 104.70476
/** (465.962 - 380 + 93) / 465.962 — how far the shape's base sits above the
 *  window's bottom edge, as a share of the shape's own height. */
const BASE_LIFT = 1.51043
/** The frame's own skew on the shape. Small (~6.7px of shift across the
 *  shape's height) but transcribed rather than dropped. */
const SKEW_DEG = -0.82

/** The window's own height at scale 1, as a share of its width. */
const WINDOW_RATIO = 380 / 1281

/**
 * A ceiling on how much of the screen the band may take, and it is load-bearing
 * on a real laptop rather than a nicety.
 *
 * A purely width-proportional band assumes the frame's own 982px-tall artboard,
 * where 380px is 38% of the body. On a 1500x772 laptop the same ratio gives a
 * **445px** band in a ~700px viewport — 63% of the screen — and the module
 * name, its description and both CTAs all fall below the fold. Reported from a
 * real machine, and the frame cannot show it because a Figma artboard has no
 * viewport.
 *
 * Capping the *height* is safe here in a way that capping the width would not
 * be: the image is anchored to the window's bottom edge at a width set by the
 * container, so a shorter window crops the top of the photograph and leaves the
 * wave curve — the thing that must not be messed with — pixel-identical.
 *
 * `42vh` lands within 2px of the frame's own 380 at 1281x900, which is a useful
 * check that it is not an arbitrary number: it only starts biting on viewports
 * shorter or wider than the one the frame was drawn at. The 480px stop keeps a
 * very tall, very wide window from turning the band back into a poster.
 */
/* Round 47: 42vh / 480 -> 32vh / 380, settled over four passes (30, 24, 27, 32) against the live page. The welcome screen gained the yellow
   module bar above it and the shared footer below it in this round, ~152px of
   chrome that was not there when the cap was set, and the direct instruction
   was that the band should stop pushing the content down, then that it should
   come down again. At the 772px laptop height this project has already had a
   report from, 42vh was 324px of a 524px content area; 32vh is 247. Still a
   *height* cap, for §89.2's reason: a bottom-anchored image crops rather than
   distorting, so the curve survives. */
const HEIGHT_CAP = 'min(32vh, 380px)'

/**
 * One multiplier per breakpoint, carried as a CSS custom property so there is
 * exactly ONE `<img>` in the DOM rather than one per breakpoint. Three hidden
 * copies of a 136 KB photo is a real cost on the phone that needs it least, and
 * three markup copies is how an "invisible sizer" drifts from the live one
 * (Round 34).
 *
 * Desktop is the frame's own 1. The other two are derived — no mobile or tablet
 * frame exists for this screen.
 */
/* ⚠️ All three breakpoints are written as `min-[Npx]:`, and mixing in a named
   one (`sm:`) is a real bug rather than a style preference. Measured live:
   `[--wave-s:1.6] sm:[--wave-s:1.25] min-[1200px]:[--wave-s:1]` resolved to
   **1.25 at a 1680px viewport**, because Tailwind v4 emits arbitrary-property
   utilities in a different order from named-breakpoint ones and the two rules
   have equal specificity, so source order decided it — the wrong way round.
   The band came out 623px deep instead of 498. Keep them the same kind. */
const SCALE_VARS =
  '[--wave-s:1.6] min-[640px]:[--wave-s:1.25] min-[1200px]:[--wave-s:1]'

export function ModuleHeroWave({ className }: { className?: string }) {
  return (
    // A container query rather than `vw`: this band is the width of the page
    // column, and on any surface where that stops being the whole viewport
    // (a future two-column layout, the preview pane) `vw` would size the wave
    // against the window instead of the box it lives in. `cqw` reads the
    // container, which is the thing the geometry above is actually relative to.
    // Two nested boxes are required, not stylistic: `cqw` resolves against an
    // ancestor container, so the element declaring `container-type` cannot use
    // it to size itself.
    <div
      aria-hidden="true"
      className={cn('w-full [container-type:inline-size]', SCALE_VARS, className)}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: `min(calc(${WINDOW_RATIO * 100}cqw * var(--wave-s)), ${HEIGHT_CAP})` }}
      >
        <img
          src="/illustrations/consumer-lesson/lesson-hero-wave.webp"
          alt=""
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            width: `calc(${IMAGE_W}% * var(--wave-s))`,
            height: 'auto',
            // `maxWidth: none` is load-bearing, not defensive: Tailwind's
            // preflight sets `img { max-width: 100% }`, which would clamp this
            // deliberately oversized shape back to the window and flatten the
            // curve. The same trap `ConsumerWelcome`'s `LAYER_STYLE` documents.
            maxWidth: 'none',
            // Read right to left: skew the shape as the frame does, lift it so
            // its base lands 7.038px above the window's edge, then centre it.
            // One transform, so the three cannot drift.
            transform: `translateX(-50%) translateY(-${BASE_LIFT}%) skewX(${SKEW_DEG}deg)`,
          }}
        />
      </div>
    </div>
  )
}
