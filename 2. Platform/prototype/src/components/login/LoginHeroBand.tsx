/**
 * The login screen's top artwork band, below 1200px — Figma `4216:17282`
 * (tablet, 820 x 280) and `4216:18154` (mobile, 375 x 184).
 *
 * ── What it replaces, and why it is a different thing ────────────────────
 *
 * At 1200 and up the artwork is a full-height panel down the left-hand side.
 * It cannot simply be re-proportioned for a narrow screen: a 724-wide drawing
 * beside a 788-wide column has nowhere to go under 1200, which is exactly why
 * that panel is `hidden` there. The frames answer by moving the artwork to a
 * band across the top — a different composition rather than the same one
 * scaled, hence a different component.
 *
 * ── One export per band, NOT four composed layers ────────────────────────
 *
 * The first cut built this from four parts: a CSS gradient, plus separate
 * exports of the pillow, the wave and the sparkles, each positioned from
 * ratios derived off the frame. It was wrong on screen and worth recording
 * why, because the reasoning that led there was superficially sound:
 *
 *   - **The part exports come back CLIPPED.** The pillow group is 308 x 265
 *     and exported as 309 x 241 — the standing trap in this project, since
 *     the group sits inside a frame with `clipsContent`. Anchoring a clipped
 *     asset by an edge puts it ~24px off, and which edge was lost is not
 *     recoverable from the file.
 *   - **The frames do not agree on placement.** The pillow's top sits at
 *     3.8% of the band height on tablet and 40.9% on mobile, and its width is
 *     1.10x the band height on tablet against 0.82x on mobile. There is no
 *     one ratio; there are two sets of hand-transcribed offsets, which is the
 *     mask-and-outline drift this project has already paid for three times.
 *   - **Z-order matters here.** The wave crosses in front of the pillow's
 *     lower edge while the pillow's face stays above the crest. Composed by
 *     hand that is a third thing to keep in step.
 *
 * Exporting each whole band hands all of that back to Figma, which has the
 * real numbers. The cost is two assets instead of four and a re-export when
 * the artwork changes — cheap against three sets of offsets that silently
 * disagree.
 *
 * ⚠️ **The gradient stays INSIDE these exports**, unlike the desktop panel
 * where it was stripped. There it was a copy of the *page* gradient bleeding
 * into the asset; here it is the band's own fill and part of the drawing.
 * What was stripped from both is the `#F5F5F5` backing plate and the
 * `#FFFCFA` page rect Figma bakes into every export — and, on mobile only,
 * the frame's own `#FFFDFA` canvas fill and its visible black border.
 * A `#FFFDFA` *gradient stop* survives in both and is artwork, not a plate;
 * a blanket colour check flagged it as one, which is why the strip matches
 * `<rect …>` shapes rather than hex strings.
 *
 * ── Why `cover` and not a stretch ────────────────────────────────────────
 *
 * The band is full-bleed at every width while the drawing has a fixed aspect,
 * so something has to give. `cover` scales it to fill and crops the sides,
 * keeping the pillow centred and undistorted — the same trade, and the same
 * reasoning, as the desktop panel's `object-cover`. `background-size: 100%
 * 100%` would fill exactly and squash the pillow at any width but the
 * frame's own.
 *
 * `center bottom` anchors the crop: the wave's crest must stay flush with the
 * band's lower edge, because the page canvas picks up exactly where it ends.
 */

/** The band's own height, per frame. */
const BAND_HEIGHT = { tablet: 280, mobile: 184 } as const

export function LoginHeroBand({ variant }: { variant: 'tablet' | 'mobile' }) {
  return (
    <div
      aria-hidden="true"
      className="w-full shrink-0 bg-no-repeat"
      style={{
        height: BAND_HEIGHT[variant],
        backgroundImage: `url("${import.meta.env.BASE_URL}illustrations/login/hero-band-${variant}.svg")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
      }}
    />
  )
}
