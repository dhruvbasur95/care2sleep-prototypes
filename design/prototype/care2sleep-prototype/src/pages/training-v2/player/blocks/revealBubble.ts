/**
 * The click-to-reveal answer bubble, as path data rather than an `<img>`.
 *
 * Frames `2665:23779` / `2665:23780`. Exported from Figma and stored here for
 * the same reason `pillowFrame.ts` and `blobFrame.ts` store theirs: **an
 * `<img>` cannot be recoloured**, and the bubble has to change fill on hover
 * (direct instruction, 2026-09-17: *"on hover use purple 300"*). Rendered
 * inline, the fill is just `currentColor`.
 *
 * This is genuine export data, not hand-drawn geometry — the standing
 * never-draw-an-icon rule is about authoring vectors, not about where an
 * exported path is stored.
 *
 * The open blob is the closed one **mirrored vertically** (its first y goes
 * 0.897 -> 176.603 and so on), which is why the two are separate strings rather
 * than one path with a transform: the export already did the flip, and
 * re-deriving it would be transcribing what Figma already decided.
 */
/**
 * ⚠️ **Cropped to the path's real bounds, NOT the export's own `0 0 289 250`.**
 *
 * Measured from the path data: both blobs span x -0.77..290.51 and y
 * -0.20..177.70 — so **the bottom 72px of the exported viewBox is empty**, and
 * the artboard is taller than anything drawn in it.
 *
 * Stretching the uncropped viewBox to fill a box therefore paints the bubble
 * across only the top 71% of it, which caused both of the defects reported on
 * 2026-09-17: "Click to see" looked off-centre (it was centred in the *box*,
 * which sits lower than the *shape*), and a revealed answer overflowed the
 * bubble for the same reason. Cropping makes the painted shape and the layout
 * box the same thing, so centring and padding finally mean what they say.
 *
 * 1px of margin all round keeps the stroke-free edges from being clipped by
 * rounding.
 */
export const ANSWER_VIEWBOX = '-1 -1 292.3 179.7'

/** The blob's own aspect, for the minimum box the closed state draws. */
export const ANSWER_W = 290
export const ANSWER_H = 178

/** Closed: the plain blob. */
export const ANSWER_CLOSED_D =
  "M61.1303 0.89722C45.6852 1.92659 29.8928 2.94894 17.678 16.4295C7.5695 27.5834 3.54492 43.6233 1.6209 59.8113C-0.773828 79.9405 -0.1855 101.014 1.26781 121.179C2.57403 139.285 5.85718 156.918 19.9137 165.95C36.0649 176.321 63 177.5 63 177.5C63 177.5 135.614 175.778 176.113 174.777C190.587 174.41 225.878 174.333 239.629 173.621C250.319 173.071 261.117 173.451 270.231 165.879C285.146 153.484 287.264 127.792 288.247 108.164C289.553 81.9005 290.506 53.5646 278.986 29.8537C272.855 17.2474 262.652 9.21688 251.137 5.10644C239.629 0.995993 227.943 0.904291 216.282 0.74213C191.84 0.417806 167.593 0.255624 143.275 0.0159067C122.187 -0.195609 101.917 1.78562 80.6409 1.02417C74.5158 0.805601 67.8261 0.445988 61.1303 0.89722Z"

/** Revealed: the same blob mirrored. */
export const ANSWER_OPEN_D =
  "M61.1303 176.603C45.6852 175.573 29.8928 174.551 17.678 161.07C7.5695 149.917 3.54492 133.877 1.6209 117.689C-0.773828 97.5595 -0.1855 76.4855 1.26781 56.3211C2.57403 38.2154 5.85718 20.582 19.9137 11.5503C36.0649 1.17904 63 0 63 0C63 0 135.614 1.72173 176.113 2.72318C190.587 3.0898 225.878 3.16729 239.629 3.87939C250.319 4.42933 261.117 4.04867 270.231 11.6209C285.146 24.0157 287.264 49.7077 288.247 69.3364C289.553 95.5995 290.506 123.935 278.986 147.646C272.855 160.253 262.652 168.283 251.137 172.394C239.629 176.504 227.943 176.596 216.282 176.758C191.84 177.082 167.593 177.244 143.275 177.484C122.187 177.696 101.917 175.714 80.6409 176.476C74.5158 176.694 67.8261 177.054 61.1303 176.603Z"

/** The five strokes the revealed state adds around the blob's lower edge.
 *  `primary`, 2.5 wide, round caps and joins — the frame's own values. */
export const ANSWER_SPARKLES: string[] = [
  "M246.198 203.478L244.893 198.405",
  "M268.592 190.139L264.951 186.434",
  "M220.146 202.594L221.548 197.592",
  "M281.541 166.802L276.29 166.231",
  "M197.546 188.398L201.872 185.364"
]

export const SPARKLE_STROKE_W = 2.5

/**
 * The outline the three chat bubbles carry, read off `bubble-1/2/3.svg` rather
 * than guessed: `#333333`, 3.5 wide, round caps and joins, miter limit 2 —
 * identical on all three.
 *
 * Direct instruction, 2026-09-17: *"add the same stroke we have to chat bubble
 * to this blob."* The answer blob shipped without one, so the two halves of the
 * exchange read as different kinds of object.
 *
 * ⚠️ It must be drawn `vectorEffect="non-scaling-stroke"`. This blob is
 * stretched to its copy on both axes, and a scaling stroke would come out
 * thicker on the wide axis than the tall one — the outline would visibly taper
 * around the shape, which is exactly what the chat bubbles' own baked-in stroke
 * never does.
 */
export const BUBBLE_STROKE = '#333333'
export const BUBBLE_STROKE_W = 3.5
