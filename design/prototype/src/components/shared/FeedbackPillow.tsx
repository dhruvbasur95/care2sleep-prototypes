import { type CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * The five feedback pillows — the artwork, their moods, and the idle beat that
 * animates their faces.
 *
 * **Extracted from `SessionFeedbackModal` at its second caller** (direct
 * instruction, 2026-09-18: the trainee module player's feedback slide should
 * *"re-use the feedback pillows we used in consumer view for sharing session
 * feedback"*). That is the same rule `AnswerOutcome`, `Toast` and
 * `MeetingsSection` were extracted under, and it matters more than usual here:
 * every value below was measured against a frame, several of them twice, and a
 * second copy would start drifting on the first re-export.
 *
 * ## What moved and what did not
 * Only the pillow moved. **The card around it stays with its caller**, because
 * the two genuinely differ in layout rather than in colour: the consumer's is a
 * 60vw row-reversed strip on a phone that becomes a column at `sm`, the module
 * player's is one of five equal `flex-1` cards in an 880px slide column. This
 * file's own standing rules say to build that locally rather than add a flag
 * that switches off the behaviour making the shared component correct for its
 * other caller.
 *
 * ## The animation is app-wide, not consumer-only
 * The `consumer-pillow-*` keyframes live in `consumer-tokens.css`, which
 * `index.css` imports globally — so the beat runs in the module player too. The
 * class names keep their `consumer-` prefix: renaming them would touch the
 * stylesheet, both callers and the keyframes, for no behavioural gain.
 */
/**
 * The five options, in the frames' own order and wording, each carrying its own
 * resting and selected treatment.
 *
 * ⚠️ **Every pillow is a committed Figma export and nothing recolours one** —
 * direct instruction: "no deviation in pillow colors, shadows, or their faces".
 * The selected pillows are *different exports*, not the resting ones tinted or
 * filtered, because that is what frame `951:6600` supplies: they are drawn
 * larger (125.79 x 96.61 against 110.169 x 84.6168) and carry their own
 * shading. Swapping the `src` is the only way to keep the faces and shadows
 * exactly as drawn.
 *
 * `fill` and `border` are frame `951:6600`'s own hexes, one pair per mood.
 * These five greens/yellows/oranges/reds are the only literals in this file:
 * unlike the chrome colours they have no equivalent anywhere in this app's
 * palette, which has no green ramp at all, and inventing tokens for a
 * five-value scale used on one screen would be worse than naming them here.
 */
export const FEEDBACK_MOODS = [
  // `glow` is the selected pillow's drop-shadow colour, from the effect panel.
  // Four of the five are the card's own border colour; "very good" is not, so
  // it is carried separately rather than derived.
  { id: 'very-good', label: 'Very good', art: 'verygood', fill: '#c8ebcc', border: '#266b2e', glow: '12,65,17' },
  { id: 'good', label: 'Good', art: 'good', fill: '#e7ffde', border: '#4d8c38', glow: '77,140,56' },
  { id: 'okay', label: 'Okay', art: 'okay', fill: '#fdf8db', border: '#b29914', glow: '178,153,20' },
  { id: 'not-great', label: 'Not Great', art: 'notgreat', fill: '#fef0de', border: '#b8590d', glow: '184,89,13' },
  { id: 'very-bad', label: 'Very Bad', art: 'verybad', fill: '#ffe2e0', border: '#801f1a', glow: '128,31,26' },
] as const

/**
 * How long each pillow's idle beat takes, per mood.
 *
 * Five different durations on purpose: with one shared duration all five
 * pillows move on the same frame, which reads as the row twitching rather than
 * as five pillows each with a life of its own. Paired with a per-index delay in
 * `BEAT_DELAY`, no two beats land together at any point in the loop. The
 * keyframes themselves are in `consumer-tokens.css`.
 */
const BEAT_DURATION: Record<string, string> = {
  verygood: '3.2s',
  good: '3.6s',
  okay: '4.2s',
  notgreat: '3.8s',
  verybad: '4.6s',
}
const BEAT_DELAY = (index: number) => `${(index * 0.37).toFixed(2)}s`

/**
 * The selected pillow's outer shadow, per mood — the frames' own effect values.
 *
 * All five pillows carry the same geometry and differ only in colour:
 * **X -3, Y 12, blur 36, spread 0, 50% opacity**, colour per mood (see `glow`
 * above). Supplied from Figma's effect panel, because the exported SVGs cannot
 * carry it: each isolated export (`951:7199`/`7211`/`7223`/`7235`/`7247`) holds
 * exactly one filter, `filter0_ii`, and it is two *inner* shadows with its
 * region clipped to the pillow's own box (`x="0" width="125.79"`) — an outer
 * shadow has nowhere to live in an export bounded to that node.
 *
 * ⚠️ **Blur is halved, and that is not a mistake.** Figma's blur is a diameter;
 * `filter: drop-shadow()` takes a *standard deviation*, so Figma's 36 is 18
 * here. This project has the reverse of the same trap recorded in
 * `design-tokens.md` §66 for `box-shadow`, where the mapping *is* 1:1.
 *
 * ⚠️ **The lengths are `cqw`, so the shadow scales with the pillow.** The
 * effect was authored against the selected pillow's 125.79px width, and the
 * pillow renders anywhere from 56px on a phone to 110px on a desktop; fixed px
 * would leave a phone with a shadow twice as deep as its own pillow. Each
 * length is its share of that width — 3/125.79, 12/125.79, 18/125.79 — against
 * a container established on the pillow box itself, so one declaration is
 * correct at every size and stays correct if the pillow is ever resized again.
 */
const GLOW = (rgb: string) =>
  `drop-shadow(-2.3848cqw 9.5397cqw 14.3119cqw rgba(${rgb},0.5))`

// `BASE_URL`, not a root-absolute path: the app is served from a sub-path and
// `/illustrations/...` 404s there. The consumer copy of this line was one of the
// 51 such paths still open across the codebase; moving it here fixes these five.
export const ART = `${import.meta.env.BASE_URL}illustrations/consumer-feedback`

/**
 * The pillow. One box for both states so selecting a card cannot reflow the
 * grid: the selected export is 14.18% larger than the resting one
 * (125.79 / 110.169), and that growth is applied as a `scale` on the same box
 * rather than a bigger box — which also makes it the one thing to animate when
 * motion is added.
 */
const SELECTED_ART_SCALE = 125.79 / 110.169

/**
 * How far each mood's brows and features travel at the peak of the beat, in the
 * pillow's own 110.169 x 84.6168 units.
 *
 * ⚠️ **The emotion intensifies; it never changes.** Direct instruction: "I want
 * their faces to also animate, happy becomes slightly more happy, and so on and
 * so forth". So the sign follows the mood — the two happy pillows lift, the two
 * unhappy ones sink, and "okay" barely moves, which is what keeps it reading as
 * okay. A pillow never borrows another pillow's expression, because the label
 * beside it is a promise about what the user is choosing.
 *
 * ⚠️ **Translation only, and that is a constraint rather than a preference.**
 * Each layer spans the whole pillow box, so `scale` or `rotate` on a *layer*
 * pivots about the box centre and a scaled brow visibly slides sideways. This
 * is the same reasoning — and the same numbers' order of magnitude — as
 * `ConsumerCanvasWave`'s `EXPRESSIONS`, which learned it the hard way.
 */
const FACE_BEAT: Record<string, { brow: number; face: number }> = {
  verygood: { brow: -8, face: -2.6 },
  good: { brow: -6.5, face: -2 },
  okay: { brow: -4, face: -1 },
  notgreat: { brow: 5, face: 1.6 },
  verybad: { brow: 6.5, face: 2.4 },
}

/**
 * One dial for how strongly the expression intensifies at the peak. Multiplies
 * every number in `FACE_BEAT`, so the moods keep their relative order and only
 * the overall presence changes -- turn it down to soften all five at once.
 *
 * WARNING: **Why the numbers above are ~2.6x what they were, on an instruction
 * that said "increase the presence by ~20%".** The face was measured, not
 * eyeballed: at the peak it travelled `-2.364%` of an 84px box -- **2.0px** --
 * while the body underneath it moved `translateY(-9%)`, about **7.6px**, in the
 * same direction. The face was therefore riding an 8px move with a 2px
 * differential of its own, which is why it was reported as having no animation
 * at all. A literal 1.2x would have taken it to 2.4px and stayed invisible, so
 * "20% more presence" is read as the *expression* reading 20% stronger, which
 * is a property of the brow-to-eye gap rather than of this multiplier. This is
 * the standing rule that "nothing is animating" usually means it is animating
 * too little.
 */
const FACE_INTENSITY = 1

/**
 * WARNING: **The expression lives in the gap between the brows and the face,
 * not in how far either one travels.** Both layers used to move almost together
 * (brow -3 against face -2, a differential of 1 unit -- about 1px), so the
 * features translated as a block and a happy pillow just moved rather than
 * looking happier. The brow now travels roughly 3x the face, which opens and
 * closes the brow-to-eye distance, and that is the part a viewer actually reads
 * as an emotion intensifying.
 *
 * The face art cannot carry more than this: each mood's `-face.svg` is four
 * paths with the nose, eyes and mouth in one export and no separable mouth
 * group, so a smile cannot be made to curve further. Widening this gap is the
 * strongest expression change available without re-cutting the assets.
 */
const faceBeat = (art: string) => {
  const { brow, face } = FACE_BEAT[art]
  return { brow: brow * FACE_INTENSITY, face: face * FACE_INTENSITY }
}

/** The pillow box's own height, in its own units. */
const PILLOW_UNITS_H = 84.6168
/**
 * The height of "very bad"'s face layer **expressed in pillow units**, which is
 * not its viewBox height.
 *
 * Its face is a separate 34.2244 x 34.0473 export rendered at 29.30% of the
 * pillow's width, so on screen it occupies
 * `0.2930 x 110.169 x (34.0473 / 34.2244) = 32.128` pillow units of height. A
 * percentage translate resolves against that rendered box, so the raw viewBox
 * height is the wrong denominator — measured, it left this mood travelling 6%
 * short of every other one (2.35px where 2.5 was intended).
 */
const VERYBAD_FACE_UNITS_H = 32.128

/**
 * A layer's travel as a percentage of its **own** box, from a distance given in
 * pillow units.
 *
 * Percentages rather than px because the pillow renders anywhere from 56px on a
 * phone to 110px on a desktop and the expression has to hold at both. The
 * conversion matters for "very bad": its face is a separate 34.0473-tall export
 * rather than a full-box layer, so the same percentage would move it 2.5x less
 * far than every other mood's. Dividing by the layer's own height is what makes
 * one table of numbers correct for both shapes.
 */
const travel = (units: number, layerH: number) => `${((units / layerH) * 100).toFixed(3)}%`

export function FeedbackPillow({
  art,
  label,
  selected,
  glow,
  beat,
  index,
  sizeClassName,
  shadow = true,
}: {
  art: string
  label: string
  selected: boolean
  glow: string
  /** Whether this pillow should be running its idle beat right now. */
  beat: boolean
  index: number
  /**
   * Overrides the pillow's own responsive width. Both existing callers are
   * *forms* where the pillow is the thing being chosen and wants all the room
   * its card allows; the researcher's read-only record of an already-made
   * choice does not (direct instruction, 2026-09-21: "reduce avatar size").
   * Additive — omitted, the width is byte-identical to before.
   */
  sizeClassName?: string
  /**
   * The selected pillow's coloured drop shadow. On by default, because in both
   * form callers it is what makes the chosen pillow lift off its card.
   * Switched off for the researcher's record view (direct instruction, same
   * day: "hide shadow"), where nothing is being chosen and the glow reads as
   * decoration around a data point.
   */
  shadow?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const base = selected ? `sel-${art}` : art
  const verybad = art === 'verybad'
  const faceH = verybad ? VERYBAD_FACE_UNITS_H : PILLOW_UNITS_H
  const { brow, face } = faceBeat(art)
  const running = beat && !reduceMotion

  /* The face layers move on the same clock as the body underneath them, so the
     whole pillow reads as one gesture rather than two things twitching — same
     duration, same delay, same keyframe positions, all from CSS. */
  const featureLoop = (units: number) => ({
    className: cn('absolute', running && 'consumer-pillow-feature'),
    style: {
      ...facePlacement,
      '--feature-y': travel(units, faceH),
      '--beat-duration': BEAT_DURATION[art],
      '--beat-delay': BEAT_DELAY(index),
    } as unknown as CSSProperties,
  })

  /* "Very bad" keeps its face in a small box of its own, placed as percentages
     of the pillow box so it stays in register at either size — the alternative
     is two transcribed px offsets per state, which is the drift this project has
     shipped three times. Resting 43.72 / 20.93 of 110.169 x 84.6168; selected
     49.92 / 23.9 of 125.79 x 96.61 — the same fractions. */
  const facePlacement = verybad
    ? { left: '39.68%', top: '24.73%', width: '29.30%' }
    : { inset: 0, width: '100%' }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative block shrink-0 origin-bottom transition-transform duration-200 ease-out motion-reduce:transition-none',
        sizeClassName ?? 'w-[56px] sm:w-full sm:max-w-[min(110px,16dvh)]',
      )}
      style={{
        aspectRatio: '110.169 / 84.6168',
        transform: selected ? `scale(${SELECTED_ART_SCALE})` : undefined,
        containerType: 'inline-size',
      }}
    >
      {/* The beat and the shadow ride the same element: the outer box owns the
          size, the container for `cqw`, and the selected scale-up, so its
          transform is already spoken for. Keeping the loop off that transform
          also means selecting a pillow cannot interrupt its animation.

          The shadow is on the pillow, not on the card — direct instruction,
          correcting a first pass that put a `box-shadow` on the button: "its not
          the button that gets shadow, but the pillow inside it". `drop-shadow`
          follows the artwork's own alpha, so it hugs the pillow shape rather
          than boxing it, and it sits here so it falls from the whole avatar
          rather than from each layer separately. */}
      <span
        className={cn(
          'absolute inset-0 block transition-[filter] duration-200 ease-out motion-reduce:transition-none',
          running && 'consumer-pillow-beat',
        )}
        style={
          {
            filter: selected && shadow ? GLOW(glow) : undefined,
            animationName: running ? `consumer-pillow-${art}` : undefined,
            '--beat-duration': BEAT_DURATION[art],
            '--beat-delay': BEAT_DELAY(index),
          } as CSSProperties
        }
      >
        {/* Three layers, split out of the one flat export **byte for byte** —
            every `<path>` lifted verbatim and given the export's own unmodified
            `<svg>` open tag, so all three keep its full coordinate space and
            register perfectly by construction, with no offsets to transcribe.
            The same technique as the awake mascot's own four-layer split, and
            the reason the face can move at all. */}
        <img
          src={`${ART}/${verybad ? `${base}-base` : `${base}-body`}.svg`}
          alt=""
          className="absolute inset-0 size-full"
        />
        <img src={`${ART}/${base}-face.svg`} alt="" {...featureLoop(face)} />
        <img src={`${ART}/${base}-brows.svg`} alt="" {...featureLoop(brow)} />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

