/**
 * The onboarding photo card's torn-paper frame, as ONE path.
 *
 * Transcribed from the Figma export `blob-outline.svg`, which is now deleted:
 * the card renders this path twice in a single inline SVG — once as a clip for
 * the photo, once as the visible purple stroke. Same `d`, same viewBox, same
 * element, so the stroke cannot drift from the image it frames at any scale or
 * rotation.
 *
 * That is the point. Previously the photo was masked by a separately-exported
 * `blob-mask.svg` (a genuinely different shape: 178.772x137.307 against this
 * 180.762x143.134) and the stroke was a third file overlaid on top, positioned
 * by four hand-transcribed offsets. The photo spilled outside its own outline —
 * the exact defect CLAUDE.md records from Round 31 and warns not to repeat:
 * *a mask and the outline that frames it must be derived from one source.*
 * Deriving both from this constant is what makes that guarantee structural
 * rather than something to re-verify after every export.
 */
export const BLOB_PATH =
  'M89.0146 2.10547C108.303 1.67463 127.446 3.60979 140.061 8.10645V8.10742C146.756 10.5229 151.949 9.40753 156.512 7.89355C161.171 6.34753 164.629 4.67996 168.889 4.98828H168.894C172.767 5.25918 175.283 8.49356 174.479 11.957V11.958L172.338 21.2002V21.2012C171.861 23.2647 171.14 25.8449 170.759 28.3584C170.371 30.9105 170.274 33.6949 171.143 36.377V36.3779C178.438 59.2707 177.581 76.1109 173.225 99.7119C172.127 105.338 172.743 110.304 175.317 115.458L175.322 115.469C176.808 118.402 178.079 121.53 178.536 124.384C178.993 127.235 178.597 129.49 177.186 131.103L177.174 131.116C175.773 132.747 173.3 133.315 169.696 132.969C166.154 132.629 162.22 131.48 158.532 130.476H158.531C154.6 129.378 150.21 128.915 145.862 130.941L145.858 130.943C142.834 132.36 137.953 133.673 131.951 134.846C125.995 136.009 119.092 137.006 112.119 137.841C98.2168 139.504 84.1362 140.511 76.9336 140.916H76.8076L76.7451 140.92C64.7985 141.654 54.5069 139.851 46.1914 137.991C42.1073 137.078 38.291 136.099 35.1973 135.467C32.1121 134.836 29.2581 134.435 26.9551 134.822L26.9463 134.823L26.9375 134.825C25.2402 135.126 23.3764 135.835 21.6318 136.518C19.8124 137.229 18.0485 137.944 16.3027 138.437C12.8001 139.427 10.1889 139.306 8.23242 137.014L8.20703 136.984L8.05078 136.799C6.46435 134.842 5.90131 131.469 6.71875 128.769L6.72266 128.758L9.87695 118.13L9.87891 118.122C11.3198 113.198 11.5958 108.595 9.85156 103.485L9.84668 103.471L9.8418 103.457L9.54883 102.622C3.49263 85.0635 4.03872 65.794 7.22754 47.1914C8.30721 41.0329 7.69714 35.6863 5.4248 29.9229L5.4209 29.9121L5.41699 29.9023L4.89355 28.5986C3.68956 25.5543 2.6314 22.5105 2.22266 19.6934C1.75856 16.4946 2.17949 13.9347 3.83008 12.0254C5.378 10.2351 7.56364 9.76102 10.4912 10.2119C13.4761 10.6717 16.7562 12.0301 19.9639 13.3809V13.3818C22.1956 14.324 25.4337 14.7953 28.0693 13.8945L28.1025 13.8838L28.1348 13.8711L38.1602 10.0586L38.1611 10.0596C50.6402 5.32485 69.7298 2.53625 89.0146 2.10547Z'

/** The path's own coordinate space. The SVG scales via viewBox, so these are the
 *  only two numbers a caller needs. */
export const BLOB_W = 180.762
export const BLOB_H = 143.134

/** Authored stroke, 4.09282 in a 180.762 viewBox — the 0.0226 of card width the
 *  frames keep constant across every card size, so it scales proportionally. */
export const BLOB_STROKE_W = 4.09282
export const BLOB_STROKE = '#A070FF'
