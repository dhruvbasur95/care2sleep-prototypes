import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMascotExpression } from './ConsumerCanvasWave'

/**
 * The post-session feedback flow, as a modal. Frames `951:6673` (choose a
 * feeling), `951:6776` (say more), `951:6954` (thank you).
 *
 * Two steps and a confirmation, opened from the Home banner's "Share my
 * thoughts".
 *
 * ── COLOUR ────────────────────────────────────────────────────────────────
 *
 * Direct instruction: "use the hexcodes as used in these frames". Every hex in
 * the three frames is **already a token in this app, byte for byte**, so the
 * tokens are used and the painted colour is identical to the frame:
 *
 *     #3a00ad -> consumer-primary      #1a1a1a -> ink
 *     #e0e0e0 -> hairline              #f5f5f7 -> parchment
 *
 * That is the point of checking rather than pasting: the instruction exists to
 * stop the app's own `--primary` (#4a278f) being substituted for the consumer
 * purple, and `consumer-primary` *is* #3a00ad. Written as literals these would
 * paint the same and lose the link.
 *
 * ── TYPE ──────────────────────────────────────────────────────────────────
 *
 * The frames' `display-lg` (40/500), `Title` (20/500/1.3), `body-md` (16/600)
 * and `body` (16/400) map onto this portal's own steps exactly at desktop —
 * `consumer-display`, `consumer-lead`, `consumer-chip`, `body` — and each one
 * clamps down for a phone rather than staying at its 40px frame value.
 *
 * ── The chassis is this component's own ───────────────────────────────────
 *
 * Not `ConfirmDialog`: that takes a title and a body and unmounts its content
 * on close, which a three-screen flow cannot use (the same reason
 * `AddAnnotationSummaryModal` built its own). What *is* borrowed is its
 * focus work, which is the part with the scars — trap Tab, close on Escape,
 * and restore focus to the trigger on close only when focus is still inside
 * the closing panel.
 */

type Step = 'mood' | 'details' | 'thanks'

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
const MOODS = [
  // `glow` is the selected pillow's drop-shadow colour, from the effect panel.
  // Four of the five are the card's own border colour; "very good" is not, so
  // it is carried separately rather than derived.
  { id: 'very-good', label: 'Very good', art: 'verygood', fill: '#c8ebcc', border: '#266b2e', glow: '12,65,17' },
  { id: 'good', label: 'Good', art: 'good', fill: '#e7ffde', border: '#4d8c38', glow: '77,140,56' },
  // ⚠️ "Okay" is the one mood whose border was RETUNED rather than transcribed.
  // The frame's own `#b29914` measures **2.63:1** against this card's `#fdf8db`
  // fill (rasterised, not calculated) and the selected outline is a graphical
  // indicator, which WCAG puts at 3:1 — so on the one card a reader had chosen,
  // the thing telling them they had chosen it was the hardest to see. `#8f7a10`
  // is the same hue at 3.96:1. Every other mood already passed.
  // It also closed a near-miss worth knowing about: the four committed "okay"
  // SVGs carry `#B39914` for the pillow's line work — one channel away from the
  // old border, clearly one design intent that had drifted into two values.
  // Those are artwork and are deliberately untouched; the border is now visibly
  // its own thing, for a stated reason.
  { id: 'okay', label: 'Okay', art: 'okay', fill: '#fdf8db', border: '#8f7a10', glow: '143,122,16' },
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

const ART = '/illustrations/consumer-feedback'

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

function MoodArt({
  art,
  label,
  selected,
  glow,
  beat,
  index,
}: {
  art: string
  label: string
  selected: boolean
  glow: string
  /** Whether this pillow should be running its idle beat right now. */
  beat: boolean
  index: number
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
      className="relative block w-[56px] shrink-0 origin-bottom transition-transform duration-200 ease-out motion-reduce:transition-none sm:w-full sm:max-w-[min(110px,16dvh)]"
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
            filter: selected ? GLOW(glow) : undefined,
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

/**
 * The thank-you screen's avatar — frame `951:6971`, the pillow at its own
 * 138.158 x 90.
 *
 * ⚠️ **It runs the Home and My Modules mascot's animation, not a copy of it** —
 * direct instruction: "re-use pillow avatar animation for last page avatar ...
 * from home page or sleeping diary page". `useMascotExpression` is that clock,
 * exported from `ConsumerCanvasWave` so both avatars are driven by one
 * implementation and any future tuning reaches both; `EXPRESSIONS` supplies the
 * same `browY`/`faceY`/`tilt` values, which land unchanged here because this
 * export shares the mascot's 90-unit height. The breath and float below are the
 * mascot's own too — a 1.5% swell and a 2px rise on a 5s loop, deliberately off
 * the expression clock so the two never look like one event.
 *
 * `nap: false` is the one difference, and it is a content decision rather than a
 * technical one: the pillow should not doze off while thanking someone.
 *
 * The three layers are byte-for-byte splits of `thanks.svg` — its `<g
 * id="Vector">` plus the two fold paths as the body, `<g id="Group_4">` as the
 * brows, and the nose, eye group and mouth as the face — each given the export's
 * own unmodified `<svg>` open tag, so they register by construction.
 */
function ThanksMascot() {
  const { reduceMotion, featureTransition, browY, faceY, tilt } = useMascotExpression({
    nap: false,
  })
  const layer = {
    position: 'absolute' as const,
    inset: 0,
    width: 138.158,
    height: 90,
    maxWidth: 'none' as const,
  }
  return (
    <motion.div
      aria-hidden="true"
      className="relative shrink-0"
      style={{ width: 138.158, height: 90, transformOrigin: 'center bottom' }}
      animate={
        reduceMotion ? { rotate: 0 } : { rotate: tilt, scale: [1, 1.015, 1], y: [0, -2, 0] }
      }
      transition={{
        rotate: featureTransition,
        scale: reduceMotion ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        y: reduceMotion ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <img src={`${ART}/thanks-body.svg`} alt="" style={layer} />
      <motion.img
        src={`${ART}/thanks-face.svg`}
        alt=""
        style={layer}
        animate={{ y: faceY }}
        transition={featureTransition}
      />
      <motion.img
        src={`${ART}/thanks-brows.svg`}
        alt=""
        style={layer}
        animate={{ y: browY }}
        transition={featureTransition}
      />
    </motion.div>
  )
}

/* ── Buttons, at the frames' own widths ─────────────────────────────────── */

const PILL =
  'text-body-md flex h-12 items-center justify-center gap-2 rounded-[28px] px-5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2'
/** 152px in all three frames. */
const PILL_BACK = `${PILL} w-full max-w-[420px] shrink-0 border border-consumer-primary bg-white text-consumer-primary hover:bg-purple-50 sm:w-[152px] sm:max-w-none`
/** 384px in both step footers. */
const PILL_FORWARD = `${PILL} w-full max-w-[420px] bg-consumer-primary text-white hover:opacity-90 sm:w-[384px] sm:max-w-none`

export function SessionFeedbackModal({
  open,
  sessionOrdinal,
  onClose,
}: {
  open: boolean
  /** Fills the frame's `<>`: "your 4th session". */
  sessionOrdinal: string
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>('mood')
  const [mood, setMood] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const focusedStep = useRef<string | null>(null)
  const titleId = useId()

  /* Every open starts at the beginning with nothing chosen. Without this a
     reader who closed on the thank-you screen would reopen onto it. */
  useEffect(() => {
    if (!open) return
    setStep('mood')
    setMood(null)
    setDetails('')
  }, [open])

  /**
   * Focus the step's own heading on every step change, and restore focus to the
   * trigger on close.
   *
   * Keyed on the step as well as `open` because each screen replaces the whole
   * panel body: without it, a reader who pressed Continue would be left with
   * focus on a button that no longer exists, which is this project's
   * most-repeated defect.
   */
  useEffect(() => {
    if (!open) {
      focusedStep.current = null
      return
    }
    triggerRef.current = document.activeElement as HTMLElement | null
    return () => {
      /* oxlint-disable-next-line react-hooks/exhaustive-deps -- reading
         `panelRef.current` inside the cleanup is the POINT here, not the
         mistake the rule is describing. The rule assumes you wanted the node as
         it was when the effect ran; this cleanup needs the panel as it is at
         CLOSE time, because the only question it asks is "is focus still inside
         the thing that is disappearing?". Copying the ref into a local at
         effect-run time — the rule's suggested fix — would answer that question
         about a stale node and hand focus back to the trigger even when the
         reader has since tabbed somewhere else entirely. */
      const closing = panelRef.current
      const active = document.activeElement
      const stillInside = !!closing && !!active && closing.contains(active)
      const trigger = triggerRef.current
      if (trigger && (!active || active === document.body || stillInside)) {
        trigger.focus({ preventScroll: true })
      }
    }
  }, [open])

  /**
   * ⚠️ **The heading is focused from a callback ref, not an effect.**
   *
   * Each screen now animates out while the next animates in
   * (`AnimatePresence mode="wait"`), which means the incoming heading mounts a
   * commit *later* than the step change. An effect keyed on `step` therefore
   * runs while the outgoing screen is still the only one in the tree: it
   * focuses the heading that is on its way out, never runs again, and every
   * transition lands on `<body>`. A callback ref is keyed on the *element*,
   * which cannot exist too early. This project has shipped and measured both
   * (see the standing rules in CLAUDE.md).
   *
   * `focusedStep` is what stops a re-render of the same screen from stealing
   * focus back off whatever the reader has since tabbed to.
   */
  const headingRef = useCallback(
    (node: HTMLHeadingElement | null) => {
      if (!node || focusedStep.current === step) return
      focusedStep.current = step
      node.focus({ preventScroll: true })
    },
    [step],
  )

  const trapKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled])',
      ),
    ]
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const heading =
    step === 'mood'
      ? `How satisfied are you with your ${sessionOrdinal} session?`
      : step === 'details'
        ? 'Anything else you want to add?'
        : 'Thank you for your feedback!'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/25"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* No padding on a phone: the panel is a full-screen sheet there, so
              the wrapper must not inset it. From `sm` the panel becomes a card
              again and the wrapper gives it its margin. */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
            <motion.div
              ref={panelRef}
              onKeyDown={trapKeys}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              /*
                **One fixed size for all three screens** — direct instruction:
                "keep the modal dimensions fixed, and not change it based on
                next screen", using "second slide as fixed width and height".
                Frame `951:6776` is 1115 x 674, so that is the panel at every
                step, and the shortest screen (the thank-you) no longer shrinks
                the box the reader is looking at.

                ⚠️ **A full-screen sheet on a phone, the frame's card from `sm`
                up.** Height is the viewport's below 640 (direct instruction:
                "the modal height should be viewport specific, don't make it
                iphone se specific") and the frame's own 674 above it, still
                capped at the viewport so a short laptop cannot overflow.

                The sheet also fixes the footer's width. Inset as a card, the
                wrapper's 16px plus the panel's 24px left the buttons at 295 of
                375 — reported as "on smaller screens these buttons take ~80%
                width". Full-bleed with `px-5` they reach 335, which is 89%, and
                no padding is wasted on a margin nobody needs on a phone.

                `dvh`, not `vh`: a mobile browser's own chrome is already
                subtracted, so the panel does not sit under the address bar.

                Two earlier attempts are recorded because both were wrong in
                ways worth not repeating: `min-h` gated at 900 left the three
                steps at 440 / 596 / 341 on a phone, and an ungated 674px
                minimum ran off the bottom of an iPhone SE (667 tall).

                The panel itself is `overflow-hidden` and the **content region
                below scrolls**, which is what keeps the footer reachable at any
                height instead of pushed past the fold.

                The 16px radius and the 64/72 padding are the frames' own,
                stepped down below 900 — but not to nothing: the cards were
                sitting almost flush to the panel edge at `px-3` (direct
                instruction: "add more side padding to button container").
              */
              className="pointer-events-auto flex h-[100dvh] w-full max-w-[1115px] flex-col items-center overflow-hidden rounded-none bg-white px-5 py-6 sm:h-[674px] sm:max-h-[calc(100dvh-3rem)] sm:rounded-lg sm:px-10 sm:py-[min(48px,5dvh)] min-[900px]:px-16 min-[900px]:py-[min(72px,7dvh)]"
            >
              {/* The scrolling region. `min-h-0` is what makes it actually
                  scroll — a flex child defaults to `min-height: auto` and would
                  otherwise grow past the panel instead of overflowing inside it.
                  The inner `m-auto` centres the stack when it is shorter than
                  the box and lets it scroll from the top when it is taller,
                  where `justify-center` would clip the first screenful. */}
              <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
                {/* ⚠️ **Each screen animates in and out** — direct instruction:
                    "I want transition motion to each of the screen, its
                    currently static". `mode="wait"` rather than an overlap,
                    because the panel is one fixed box and two screens crossing
                    inside it would overlap their own copy. The move is small and
                    forward-reading: the outgoing screen leaves upward, the
                    incoming one arrives from below, on this portal's own
                    symmetric curve. `initial={false}` so opening the modal plays
                    the panel's entrance only, not both at once.

                    Focus is handled by `headingRef` above, which is a callback
                    ref precisely because of this wrapper. */}
                <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.26, ease: [0.4, 0, 0.2, 1] }}
                  className="m-auto flex w-full flex-col items-center gap-8 py-1 sm:gap-10"
                >
              {step === 'thanks' && <ThanksMascot />}

              <div className="flex w-full flex-col gap-4">
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  id={titleId}
                  className="text-consumer-display text-balance text-center text-ink outline-none"
                >
                  {heading}
                </h2>
                {step !== 'mood' && (
                  <p className="text-consumer-lead text-balance text-center text-ink">
                    {step === 'details'
                      ? 'Tell us more to help improve your future sessions'
                      : 'We appreciate your help in making this a better program.'}
                  </p>
                )}
              </div>

              {step === 'mood' && (
                /* **Always one row of five** — direct instruction ("I want all
                   pillows in one single row"), replacing a grid that wrapped to
                   2-3 columns below 900. Five equal tracks at every width, so
                   the scale reads as a scale: the pillows shrink together
                   rather than the last two dropping to a second line where they
                   look like a different question. The gap and the card padding
                   come down with the viewport to buy that room, and the labels
                   are allowed to wrap. */
                <div
                  role="group"
                  aria-labelledby={titleId}
                  /*
                    ⚠️ **No horizontal scrolling.** Three shapes were tried here
                    and the first two are recorded because each failed for a
                    measurable reason:

                      5 equal tracks at every width — each card **54px** wide at
                        375, reported as "very hard to interact with";
                      a snapping scroll row — 104px cards, but it puts the last
                        two options behind a swipe, and this portal's readers are
                        explicitly not assumed to discover gestures.

                    What ships is a **vertical list on a phone with each row laid
                    out horizontally, copy first then pillow** (direct
                    instruction). Every option is then a full-width row: the
                    largest target of the three, all five visible at once, and no
                    gesture to learn. From `sm` there is room for the frames' own
                    five-across grid, pillow above label.
                  */
                  className="flex w-full flex-col items-center gap-3 sm:grid sm:grid-cols-5 sm:items-stretch sm:gap-4 min-[900px]:gap-6"
                >
                  {MOODS.map((m, i) => {
                    const on = mood === m.id
                    /* ⚠️ **Every pillow beats until a choice is made, then only
                       the chosen one does** — direct instruction: "by default, I
                       want all pillow faces to be animated... After I select,
                       the animation only happens to the selected state face."
                       Reading `mood === null` rather than a separate flag means
                       the row cannot get out of step with the actual selection,
                       and clearing a selection restores all five. */
                    const beat = mood === null || on
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setMood(m.id)}
                        /* Frame `951:6600`: each mood's own fill and a 3px
                           stroke in its own darker shade. The resting state is
                           a **1px** `hairline` on white — direct instruction,
                           down from the frame's own 2px.
                
                           ⚠️ **The selected stroke is an `outline`, not a
                           border, and that is load-bearing.** As a border it
                           took the card from 1px to 3px, and measurement showed
                           the label stepping 2px to the right the moment a mood
                           was chosen — the card's outer box is fixed, so the
                           extra 2px came out of its own padding and shifted
                           everything inside. An outline drawn at `-3px` offset
                           paints in exactly the same place and costs no layout,
                           so selecting a pillow no longer nudges its own label.
                           `focus-visible:ring-*` is a box-shadow here, so the
                           two never contend for the same property. */
                        style={
                          on
                            ? {
                                backgroundColor: m.fill,
                                outline: `3px solid ${m.border}`,
                                outlineOffset: '-3px',
                              }
                            : undefined
                        }
                        className={cn(
                          /* Centred on both axes inside a card of the frame's
                             own 201.617px height — direct instruction. Without
                             the fixed height there is no vertical centre to
                             align to, and the cards were sizing to their own
                             content so a two-line label made one taller.

                             Vertical padding is above the frame's own 40px at
                             desktop (48) — direct instruction to give the pillow
                             and its label more room top and bottom.

                             ⚠️ The 202px height starts at `sm`. Below it, five
                             tracks leave each card ~52px wide, and a 202px box
                             that narrow is a column, not a card — it left the
                             pillow floating in a tall empty strip. On a phone
                             the height comes from the content. */
                          'flex w-[60vw] min-w-[200px] max-w-[280px] flex-row-reverse items-center justify-between gap-3 rounded-[16px] px-4 py-3 outline-none sm:w-auto sm:min-w-0 sm:max-w-none sm:flex-col sm:justify-center sm:gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 sm:min-h-[min(202px,30dvh)] sm:gap-4 sm:rounded-[24px] sm:px-3 sm:py-[min(40px,4dvh)] min-[900px]:px-6 min-[900px]:py-[min(48px,5dvh)]',
                          on
                            ? 'border border-transparent'
                            : 'border border-hairline bg-white hover:bg-parchment',
                        )}
                      >
                        <MoodArt
                          art={m.art}
                          label={m.label}
                          selected={on}
                          glow={m.glow}
                          beat={beat}
                          index={i}
                        />
                        <span className="text-consumer-chip min-w-0 flex-1 text-balance text-left text-ink sm:flex-none sm:text-center">
                          {m.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {step === 'details' && (
                /* Frame `951:6951` — the notepad panel, 280px tall on
                   `parchment` with a `hairline` edge and an 8px radius. A real
                   textarea: the frame draws its placeholder as static text. */
                <>
                  <label htmlFor="session-feedback-details" className="sr-only">
                    Anything else you want to add? Optional.
                  </label>
                  <textarea
                    id="session-feedback-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Add more details ...(Optional)"
                    className="text-body h-[280px] w-full resize-none rounded-[8px] border border-hairline bg-parchment p-4 text-ink outline-none placeholder:text-ink focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
                  />
                </>
              )}

              {/* The frames' own footer: centred, 16px between the pair.
                  ⚠️ **No `mt-auto`.** Pinning it to the panel's lower edge is
                  what put ~200px of dead space under the pillows on the
                  shortest screen — reported as "too much dead space between the
                  bottom footer and the content above". The panel centres its
                  whole stack instead (`justify-center`), so the slack a fixed
                  674px leaves is split above and below rather than all landing
                  in one gap. */}
              {/* **Stacked and full width on a phone, a row from `sm`** —
                  direct instruction. A side-by-side pair at 375 gave Cancel 96px
                  and Continue 187px, both under the frame's own sizes and both
                  cramped.

                  **The primary action comes first only when stacked** — direct
                  instruction, clarifying an earlier pass that had reordered both
                  layouts. So: DOM order is primary-then-secondary, which puts
                  the primary on top on a phone, and `sm:flex-row-reverse` puts
                  it back on the right in the row, where the frames draw it.

                  The trade-off, stated rather than hidden: DOM and visual order
                  agree on a phone and disagree in the desktop row, where a
                  keyboard user reaches the primary before the secondary it sits
                  to the right of. That is the better half to give up — this
                  portal's readers are mostly on touch, and reaching the main
                  action first is not a misleading focus order. Doing it the
                  other way round (`flex-col-reverse` on mobile) would put the
                  mismatch on the surface that matters more.

                  ⚠️ **Not a sticky footer.** It sits *inside* the scrolling
                  region — direct instruction: "on mobile continue, and cancel
                  should be below the options, do not make it a sticky footer".
                  So on a phone the pair scrolls up with the options it belongs
                  to instead of floating over them. On desktop the panel is tall
                  enough that nothing scrolls, so it renders exactly where the
                  frames draw it either way. */}
              <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row-reverse sm:gap-4 sm:py-4">
                {step === 'mood' && (
                  <>
                    {/* Inert until a feeling is chosen — the standing treatment,
                        so it stays focusable and says why rather than vanishing. */}
                    <button
                      type="button"
                      aria-disabled={!mood}
                      onClick={mood ? () => setStep('details') : undefined}
                      className={cn(PILL_FORWARD, !mood && 'opacity-60')}
                    >
                      Continue
                      {!mood && <span className="sr-only"> (choose how it went first)</span>}
                      <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
                    </button>
                    <button type="button" onClick={onClose} className={PILL_BACK}>
                      Cancel
                    </button>
                  </>
                )}
                {step === 'details' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep('thanks')}
                      className={PILL_FORWARD}
                    >
                      Submit Feedback
                      <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
                    </button>
                    <button type="button" onClick={() => setStep('mood')} className={PILL_BACK}>
                      <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
                      Go Back
                    </button>
                  </>
                )}
                {step === 'thanks' && (
                  <button type="button" onClick={onClose} className={PILL_BACK}>
                    Close
                  </button>
                )}
                </div>
                </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
