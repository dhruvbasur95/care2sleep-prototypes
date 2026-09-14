/**
 * The three summary-card pillows, as PATHS rather than as three `<img>` files.
 *
 * Round 49, direct instruction: "for all summary card, there are pillow with
 * placeholder images, add image there, use the stock default image we are using
 * everywhere". The pillows were flat cream shapes standing in for artwork; each
 * now frames the portal's own `lesson-cover.jpg`.
 *
 * ── Why the `d` lives here and not in an SVG file ─────────────────────────
 *
 * Because a photo inside a shape needs that shape **twice** — once as a
 * `clipPath` for the image, once as the visible stroke on top — and this
 * project has shipped a photo outside its own outline three separate times by
 * deriving those two from different sources (§78.1; Rounds 30, 31 and 34).
 * `components/delivery/blobFrame.ts` is the fix that stuck: one path, rendered
 * twice in one inline SVG, so the stroke cannot drift from the image it frames
 * at any scale, rotation or skew. This is that same pattern for the pillows.
 *
 * Each `d` below was extracted **programmatically** from the committed
 * `card-pillow-N.svg`, not retyped, and each keeps its file's own `viewBox` —
 * including the `-3 -3` origin, which exists because the hand-added 6px centred
 * stroke sits half outside the path's own bounds and would otherwise be shaved
 * flat on every edge.
 *
 * ⚠️ The three source SVGs are now unreferenced by the app. They are kept as
 * the export these came from, the same reason `awake-body.svg` and
 * `pillow-mascot.svg` are kept. **A re-export from Figma drops the hand-added
 * stroke and reverts the viewBox** — reapply both together, then re-extract.
 */
export type PillowFrame = {
  /** The path's own coordinate space, `-3 -3 W H`. */
  viewBox: string
  /** Post-stroke intrinsic size — see the viewBox note above. */
  width: number
  height: number
  d: string
}

/** The stroke the committed SVGs carry: `purple-300`, 6px, centred, round
 *  joins. One constant, because all three share it. */
export const PILLOW_STROKE = '#c2a3ff'
export const PILLOW_STROKE_W = 6
export const PILLOW_STROKE_LINEJOIN = 'round'

/**
 * The cream the pillows were filled with before they held a photo. Still
 * painted **under** the image, so a slow or failed image load shows the shape
 * the card was designed around rather than a hole in it.
 */
export const PILLOW_FILL = '#FBF5E6'

export const PILLOW_FRAMES: Record<1 | 2 | 3, PillowFrame> = {
  1: {
    viewBox: '-3 -3 330.265 254.48',
    width: 330.265,
    height: 254.48,
    d: 'M48.9663 234.998C38.4286 236.697 21.8594 248.592 11.9456 237.513C7.99395 233.095 6.67674 225.891 8.47925 220.113L14.2334 201.898C16.7292 194.014 17.0758 186.741 14.1641 178.993C2.44778 147.592 3.34903 113.404 9.31117 80.5759C11.1137 70.6527 10.0738 62.0888 6.19145 52.8452C1.33854 40.7469 -3.79167 27.0855 4.0423 18.4536C11.8763 9.8217 25.9497 15.1911 37.1114 19.745C40.6471 21.1723 45.4306 21.784 48.9663 20.4926L66.9914 13.9677C112.817 -2.61637 205.923 -5.33507 252.511 10.7053C274.418 18.2497 286.065 3.90846 303.397 5.06391C312.41 5.67561 318.718 12.9482 316.639 21.2402L312.687 37.0767C310.815 44.6211 307.903 53.5248 310.469 61.2731C323.779 101.374 322.323 130.94 314.351 171.652C312.618 180.624 313.588 188.305 317.817 196.325C323.294 206.656 327.662 219.366 320.59 227.114C313.034 235.406 296.256 230.58 283.292 227.25C276.637 225.551 269.704 224.939 263.118 227.93C239.755 238.397 241.549 246.005 164.361 248.3C87.1736 250.594 78.4348 230.134 48.9663 234.998Z',
  },
  2: {
    viewBox: '-3 -3 359.16 212.86',
    width: 359.16,
    height: 212.86,
    d: 'M53.3298 195.636C41.853 197.051 23.8073 206.953 13.0101 197.73C8.70631 194.052 7.27171 188.054 9.23484 183.245L15.5018 168.08C18.2199 161.517 18.5975 155.462 15.4263 149.012C2.6659 122.871 3.64747 94.4092 10.1409 67.0796C12.104 58.8185 10.9715 51.689 6.74318 43.9937C1.45782 33.9219 -4.12955 22.5487 4.40252 15.3626C12.9346 8.17658 28.2621 12.6466 40.4184 16.4377C44.2692 17.626 49.479 18.1352 53.3298 17.0601L72.9611 11.6281C122.87 -2.17813 224.273 -4.44145 275.013 8.91216C298.872 15.1929 311.557 3.2538 330.433 4.21571C340.249 4.72496 347.12 10.7794 344.855 17.6825L340.551 30.8664C338.512 37.1471 335.341 44.5595 338.135 51.01C352.632 84.394 351.046 109.008 342.363 142.901C340.475 150.37 341.533 156.764 346.138 163.441C352.103 172.041 356.86 182.622 349.159 189.073C340.928 195.976 322.656 191.959 308.537 189.186C301.288 187.771 293.738 187.262 286.565 189.752C261.12 198.466 263.073 204.8 179.008 206.71C94.9418 208.62 85.4243 191.587 53.3298 195.636Z',
  },
  3: {
    viewBox: '-3 -3 323.237 301.82',
    width: 323.237,
    height: 301.82,
    d: 'M47.905 279.77C37.5957 281.793 21.3856 295.953 11.6867 282.764C7.8207 277.504 6.53203 268.927 8.29547 262.049L13.9249 240.363C16.3666 230.977 16.7057 222.319 13.8571 213.094C2.39472 175.711 3.27645 135.01 9.10936 95.9271C10.8728 84.1133 9.85543 73.9178 6.05726 62.9131C1.30953 48.51 -3.70949 32.2457 3.95469 21.9693C11.6189 11.6929 25.3873 18.0853 36.307 23.5067C39.7661 25.206 44.446 25.9342 47.905 24.3968L65.5394 16.6288C110.372 -3.11484 201.46 -6.3515 247.038 12.7448C268.471 21.7266 279.865 4.65309 296.821 6.02867C305.639 6.75692 311.811 15.4151 309.776 25.2869L305.91 44.1405C304.079 53.1222 301.23 63.7223 303.739 72.9468C316.762 120.688 315.337 155.886 307.538 204.355C305.842 215.036 306.792 224.18 310.929 233.728C316.287 246.028 320.56 261.159 313.642 270.383C306.249 280.255 289.835 274.51 277.152 270.545C270.641 268.522 263.859 267.794 257.415 271.354C234.558 283.816 236.313 292.873 160.799 295.605C85.2842 298.337 76.7348 273.979 47.905 279.77Z',
  },
}
