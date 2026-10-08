/**
 * The resource card's torn-paper photo frame, as ONE path — the same technique
 * `components/delivery/blobFrame.ts` uses for the trainee onboarding card, and
 * for the same reason.
 *
 * Direct instruction: "For card image we re-use one from trainee, but update it
 * as I have made some subtle tweaks." The tweaks are real rather than cosmetic,
 * which is why this is a second constant and not an edit to `BLOB_PATH`:
 * measured, the two paths have a different number of points (251 against 246),
 * so the trainee's onboarding blob would have changed shape if this had been
 * written over it. The stroke changed too — `yellow-200` here against the
 * onboarding card's purple, which is what makes it sit on the yellow card.
 *
 * ── WHY ONE PATH, RENDERED TWICE ──────────────────────────────────────────
 *
 * Figma exports this artwork as three separate files, and two of them are the
 * same blob at **different sizes**: the photo mask comes out 320.278 x 245.993
 * against this outline's 323.845 x 256.432, positioned relative to each other
 * by hand-transcribed offsets (the frame puts the photo card at ml 4.55 and the
 * outline at ml 15.48). Transcribing both is how this project has shipped a
 * photo sitting outside its own frame three separate times — Round 31, again in
 * Round 30's onboarding, and again in Round 34.
 *
 * So the outline path below is rendered twice inside ONE inline SVG: once as a
 * `clipPath` for the photograph, once as the visible stroke. Same `d`, same
 * viewBox, same element, so they cannot drift at any size or rotation, and the
 * stroke scales with the card for free because it rides the same transform.
 */
export const RESOURCE_BLOB_PATH =
  'M159.496 4.78223C194.002 4.01145 228.153 7.47974 250.583 15.4746V15.4756C262.881 19.912 272.439 17.8476 280.718 15.1006C289.217 12.2805 295.128 9.41185 302.499 9.94531L302.511 9.94629C308.914 10.3942 312.884 15.6742 311.603 21.1934V21.1963L307.767 37.7539V37.7559C306.928 41.3881 305.615 46.1008 304.924 50.6543C304.219 55.2964 304.022 60.4614 305.646 65.4785V65.4795C318.646 106.274 317.134 136.26 309.348 178.444C307.34 188.737 308.47 197.862 313.186 207.301L313.197 207.324C315.841 212.545 318.063 218.041 318.858 223C319.653 227.954 318.928 231.638 316.677 234.21L316.662 234.227L316.648 234.243C314.475 236.772 310.495 237.826 304.116 237.214C297.886 236.616 290.952 234.595 284.313 232.786H284.314C277.158 230.785 269.004 229.892 260.893 233.672L260.885 233.676C255.585 236.158 246.946 238.492 236.203 240.591C225.566 242.669 213.226 244.451 200.746 245.944C175.878 248.92 150.687 250.722 137.792 251.447H137.573L137.431 251.456C116.165 252.762 97.8335 249.554 82.9746 246.23C75.7135 244.607 68.8034 242.838 63.2598 241.705C57.7357 240.576 52.4545 239.814 48.123 240.543L48.1035 240.547L48.083 240.55C44.9274 241.11 41.4963 242.419 38.3867 243.636C35.1053 244.92 32.0004 246.178 28.9316 247.045C22.7698 248.785 18.6254 248.451 15.5176 244.81L15.4893 244.776L15.46 244.743L15.2041 244.44C12.6094 241.235 11.6218 235.558 13.0049 230.988L13.0088 230.977L13.0127 230.964L18.6641 211.923L18.6699 211.905C21.295 202.933 21.8145 194.469 18.6074 185.073L18.584 185.007C7.2621 153.383 8.15659 118.493 13.9463 84.7178L13.9453 84.7168C15.9122 73.4944 14.7954 63.7281 10.6592 53.2373L10.6504 53.2139L10.6416 53.1914L9.70508 50.8584C7.55604 45.4234 5.69748 40.0648 4.98242 35.1367C4.17219 29.5523 4.93894 25.3144 7.62598 22.2061C10.0784 19.3692 13.5704 18.5131 18.6406 19.2939C23.8418 20.095 29.5999 22.4732 35.373 24.9043V24.9053C39.5275 26.6592 45.5922 27.5659 50.6143 25.8496L50.6895 25.8242L50.7637 25.7959L68.7295 18.9658L68.7285 18.9648C90.9328 10.5409 125.001 5.55277 159.496 4.78223Z'

/** The path's own coordinate space — the SVG scales via viewBox, so these are
 *  the only two numbers a caller needs. */
export const RESOURCE_BLOB_W = 323.845
export const RESOURCE_BLOB_H = 256.432

/** Authored stroke: 9.35467 in a 323.845 viewBox, so it scales proportionally
 *  rather than thinning out as the card grows. `#FFE299` is `yellow-200`. */
export const RESOURCE_BLOB_STROKE_W = 9.35467
export const RESOURCE_BLOB_STROKE = '#FFE299'

/**
 * The offset blob sitting behind the photo, filled `yellow-400` (#FFB600).
 *
 * A genuinely different shape from the outline, not the same path nudged — so
 * it keeps its own `d`. It is decoration behind the frame rather than something
 * the photograph is registered against, so the one-source rule above does not
 * apply to it: nothing can visibly drift out of it.
 */
export const RESOURCE_BLOB_BACKDROP_PATH =
  'M137.717 256.125C93.9141 258.816 62.4244 242.879 48.8999 245.156C38.4034 247.018 21.8511 259.436 11.96 247.846C7.9229 243.293 6.71176 235.635 8.52848 229.633L14.1805 210.592C16.6028 202.313 17.0065 194.863 14.1805 186.584C2.47275 153.883 3.48204 118.078 9.3359 83.9279C11.1526 73.5795 10.1433 64.6799 6.30804 54.9525C1.26161 42.5344 -3.78483 28.2536 4.08761 19.1471C11.96 10.0405 25.8882 15.8356 37.1922 20.5958C40.6238 22.0446 45.4684 22.6655 49.1018 21.4237L67.0671 14.5938C112.889 -2.7915 205.743 -5.48208 252.17 11.0753C273.971 18.9401 285.679 4.03843 302.836 5.28023C311.718 5.90114 318.178 13.5589 316.159 22.2516L312.324 38.809C310.507 46.6737 307.479 55.9873 310.103 64.059C323.426 105.866 321.811 136.705 313.939 179.34C312.122 188.653 313.131 196.725 317.37 205.211C322.82 215.973 327.261 229.219 320.196 237.291C312.727 245.984 295.973 240.809 283.054 237.291C276.393 235.428 269.53 234.807 262.869 237.912C239.453 248.881 163.757 254.676 137.919 256.125H137.717Z'

export const RESOURCE_BLOB_BACKDROP_FILL = '#FFB600'
