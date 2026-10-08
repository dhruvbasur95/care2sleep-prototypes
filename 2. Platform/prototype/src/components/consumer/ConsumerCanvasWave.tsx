import { useEffect, useState, type ReactNode } from 'react'
import { useContentRevealToken } from '@/data/consumerMenuReveal'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion'

/**
 * The pale wave that sits behind a Consumer Portal page's opening block.
 *
 * Extracted at its second caller (Home, then the My Lessons / Need Help
 * in-progress pages, direct instruction: "in my learnings, keep the big wavy
 * pillow"). The caller must supply `overflow-clip` and `relative`.
 *
 * ── TWO EXPORTS, NOT ONE STRETCHED SHAPE ─────────────────────────────────
 *
 * Figma supplies a **purpose-drawn export per breakpoint** — `789:1932`
 * ("Background vector_Desktop +", 1281 x 239) and `789:1930` ("Background
 * vector_Iphone se", 375 x 176). Each is exactly its frame's own band, so both
 * render at `width: 100vw` with the height following from the viewBox and
 * nothing is stretched at all.
 *
 * That is worth stating plainly because the two previous attempts both tried to
 * serve every width from the single `home-wave.svg` (1692.75 x 997.596), and
 * that export carries `preserveAspectRatio="none"` — its box *is* its geometry,
 * so any box you hand it shears the curve rather than cropping it:
 *
 *   - `-14.81% / 132.14%` of the padded content column gave a 432 x 998 box on
 *     a phone: a 2.3x vertical stretch.
 *   - "fix" it to `100vw` and it becomes 375 x 998 — a **4.5x** squash, which is
 *     what turned the gentle crest into narrow spikes ("background pillow
 *     skewed, broken").
 *
 * There is no ratio that satisfies both ends, which is presumably why the
 * designer drew two. `home-wave.svg` had no readers left and is deleted.
 *
 * ── The one number that is not from a frame ──────────────────────────────
 *
 * `top` is the band's own y **minus the header**. Both frames position against
 * the whole page (desktop band 0 -> 239, mobile 8 -> 184) while this renders
 * inside a content column that starts below the header (72px since Round 47
 * halved the logo; `--consumer-header-h` is the source), so the offset has
 * to lose that 96 or the crest lands a header lower and cuts through the line
 * under the greeting. That was measured, not guessed — a first pass transcribed
 * the frame value directly and clipped the date line by exactly 96px.
 *
 * ⚠️ The two assets swap at `sm` (640px) and their depths differ, so there is a
 * visible step if you drag a window across that width: the phone export is 47%
 * of its width tall against the desktop export's 19%. It is only reachable by
 * resizing — no device sits at the boundary — and the alternative is stretching
 * one of them again, which is the bug this replaces.
 */
export function ConsumerCanvasWave({
  headerPx = 72,
  variant = 'home',
}: {
  headerPx?: number
  /**
   * Round 49 — Need Help (frame `982:8558`) draws the **same curve in a
   * different paint**: `982:8559` is a radial `#FBF5E6 -> #FFCC4D -> #FFB846`
   * gold band where Home's is a flat `#FBF5E6`. A variant rather than a second
   * component, because everything that makes this thing correct — the
   * clip-never-squash sizing, the `maxWidth: none` preflight override, the
   * `headerPx` offset — is identical and would have to be kept in step.
   *
   * ⚠️ **`help` has no mobile export.** Figma supplies one asset for this frame
   * (1323.88 x 247) where Home has a purpose-drawn phone band as well, so below
   * `sm` the gold variant renders the desktop curve held at its own width and
   * cropped by the viewport — the same "clip, never squash" rule the desktop
   * asset already follows at tablet widths, and the only alternative to
   * shearing it. Swap in a real phone export when one is drawn; do not stretch
   * this one to fit.
   */
  variant?: 'home' | 'help'
}) {
  // ⚠️ No `display` here. It lived in this object once and silently broke the
  // breakpoint swap: an inline style beats a class, so `hidden` never applied
  // and **both** exports rendered at once — measured, not spotted, because the
  // desktop one is only 70px tall on a phone and hid behind the mobile one.
  // Visibility is the classes' job; this object is geometry only.
  const common = {
    width: '100vw',
    height: 'auto' as const,
    // `maxWidth: none` is load-bearing: Tailwind's preflight sets
    // `img { max-width: 100% }`, which clamps a full-bleed export to its
    // parent's padded width.
    maxWidth: 'none' as const,
    position: 'absolute' as const,
    left: '50%',
    transform: 'translateX(-50%)',
  }

  if (variant === 'help') {
    /*
     * ── The gold band, and why the phone half is a MASK ───────────────────
     *
     * Figma has one export for this frame (`982:8559`, 1323.88 x 247) and no
     * phone counterpart — confirmed against the file's own metadata, where
     * `982:8558 Home_Desktop` is the only Need Help artboard. Home, by
     * contrast, ships two purpose-drawn bands and swaps them at `sm`.
     *
     * Two passes at serving both widths from the one export failed, and both
     * failures are worth recording because each looked like the obvious fix:
     *
     *   1. `max(100vw, 1281px)` at every width. At 375 that is a **239px** band
     *      ending at y 265 against a title starting at 221 — the heading sat
     *      *inside* the gold. Home's own band ends 10px clear of it.
     *   2. Holding it at 943px, the width that reproduces Home's 176px depth.
     *      The depth was then right and the **curve was wrong**: a 943px-wide
     *      crest cropped to 375 is very nearly a straight edge, reported as
     *      "background weavy is not matching home and module page".
     *
     * Stretching the export to 375 x 176 is the third option and the worst —
     * it carries `preserveAspectRatio="none"`, so that shears the curve into
     * spikes, which is the bug the two-export split exists to prevent.
     *
     * So the phone band takes its **shape from Home's own committed export**
     * (`home-wave-mobile.svg`, used as a CSS mask, so it is the identical curve
     * by construction rather than by a redraw) and its **paint from this
     * frame's own export** — the two endpoints below were sampled off
     * `help-wave-desktop.svg` rasterised to a canvas, not eyeballed and not
     * copied from the gradient's stop list, which is a radial in a coordinate
     * space that does not map onto a 375-wide box.
     *
     * Measured down the export's vertical centre: rgb(253,223,147) at the top
     * to rgb(255,197,75) at the bottom. Horizontally it varies by only ~18 per
     * channel (edges slightly deeper than the middle), which at 375px wide is
     * below the threshold of a visible difference — hence a linear vertical
     * gradient rather than a reconstructed radial.
     *
     * Replace the whole mobile branch with a real phone export the moment one
     * is drawn; this is a faithful stand-in, not a preference.
     */
    return (
      <>
        <div
          aria-hidden="true"
          className="pointer-events-none block sm:hidden"
          style={{
            ...common,
            height: undefined,
            aspectRatio: '375 / 176',
            top: 8 - headerPx,
            background:
              'linear-gradient(180deg, rgb(253,223,147) 0%, rgb(254,213,108) 45%, rgb(255,197,75) 100%)',
            WebkitMaskImage: 'url(/illustrations/consumer-welcome/home-wave-mobile.svg)',
            maskImage: 'url(/illustrations/consumer-welcome/home-wave-mobile.svg)',
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        />
        <img
          src="/illustrations/consumer-help/help-wave-desktop.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none hidden sm:block"
          style={{ ...common, width: 'max(100vw, 1281px)', top: -headerPx }}
        />
      </>
    )
  }

  return (
    <>
      {/* Frame `789:1930` — 375 x 176, band at page y 8. */}
      <img
        src="/illustrations/consumer-welcome/home-wave-mobile.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none block sm:hidden"
        style={{ ...common, top: 8 - headerPx }}
      />
      {/*
        Frame `789:1932` — 1281 x 239, band at page y 0.

        ⚠️ `min(...)` on the width is what keeps this visible on a tablet. The
        export is drawn at 1281 wide, and at `width: 100vw` its height scales
        down with it — at iPad Mini's 768 that is a 143px-tall band of which only
        **47px** clears the header, which reads on screen as the wave having
        disappeared entirely (reported at 768x1024).

        Holding the box at its own 1281 whenever the viewport is narrower keeps
        the band at its drawn depth and lets the viewport crop it, which is the
        same "clip, never squash" rule the phone export follows. Above 1281 it
        goes full-bleed as before.
      */}
      <img
        src="/illustrations/consumer-welcome/home-wave-desktop.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none hidden sm:block"
        style={{ ...common, width: 'max(100vw, 1281px)', top: -headerPx }}
      />
    </>
  )
}

/**
 * The awake pillow mascot that sits on that wave — frame `761:3269`, at its own
 * 138.158 x 90. A different export from the welcome screen's sleeping pillow.
 *
 * It is alive (direct instruction: "can you add some life to the face, it
 * randomly moves, becomes more happy, curious, and then goes back to its
 * original state", then "just the face, and gentle movement to pillow").
 *
 * Three layers, split out of the one flat export **byte for byte** — each
 * `<path>` lifted verbatim and given the original file's own unmodified `<svg>`
 * open tag, so all three keep the export's full 138.158 x 90 coordinate space
 * and register perfectly by construction, with no offsets to transcribe. Same
 * technique as the sleeping pillow's zzz (§84.2).
 *
 * WHY EXPRESSIONS ARE BUILT FROM TRANSLATION AND ONE ROTATION, AND NOT MORE:
 * because each layer spans the whole box, `scale` and `rotate` on a *layer*
 * pivot about the box's centre rather than the feature's own, so a scaled brow
 * visibly slides sideways. Translation is origin-independent. The head tilt that
 * carries "curious" is therefore applied to the **whole mascot**, which is one
 * element with its own box, so rotating it is safe and reads as a tilt.
 *
 * The cycle is genuinely random rather than a fixed loop: a neutral hold of
 * 3.5-7s, then one of the two expressions for ~1.4s, then back. A fixed sequence
 * at this size reads as a repeating animation; the irregular gap is what makes it
 * read as a face doing something of its own accord.
 */

/**
 * The zzz animation, shared with `ConsumerWelcome`'s sleeping pillow (direct
 * instruction: "use the same zzz animation ... as done in welcome screen when
 * pillow is sleeping"). Exported from here rather than duplicated, so "the same"
 * is enforced by the module graph instead of by care.
 *
 * The three glyphs are byte-for-byte splits of the *sleeping* pillow's export
 * and therefore live in its 210.646 x 188 coordinate space, not the awake
 * pillow's 138.158 x 90 — which is why the awake mascot renders them in their
 * own scaled box floating above its head rather than as sibling layers.
 */
export const Z_LAYERS = [
  { src: 'z-small', delay: 0 },
  { src: 'z-medium', delay: 0.45 },
  { src: 'z-large', delay: 0.9 },
]
export const Z_PATH = { y: [4, 0, -3, -8], opacity: [0, 1, 1, 0] }
export const Z_TIMES = [0, 0.18, 0.62, 1]
export const Z_CYCLE_S = 3.6

/** Expression states. `browY`/`faceY` are px within the mascot's own box; `tilt`
 *  is degrees on the whole mascot. Values are small on purpose — the pillow is
 *  138px wide, and Round 34's lesson is that small shapes need enough travel to
 *  register, but a face has a much lower threshold than a rotating doodle: 2-4px
 *  on a 90px-tall head is a clear change of expression. */
const EXPRESSIONS = {
  neutral: { browY: 0, faceY: 0, tilt: 0 },
  /** Brows and features lift together — the whole face reads as brightening. */
  happy: { browY: -2.5, faceY: -1.5, tilt: 0 },
  /** Brows up further, features barely move, head tilts. */
  curious: { browY: -4, faceY: -0.5, tilt: 4 },
  /**
   * Asleep (direct instruction: "randomly make the pillow sleep ... and eyes
   * turn upside down, as done in welcome screen when pillow is sleeping", "and
   * then it wakes up randomly, after a couple of seconds").
   *
   * The eyes are their own layer and flip vertically **about their own centre**,
   * which is the whole trick: a `scaleY(-1)` on a full-box layer would mirror
   * the box and drop the eyes to the chin. The eyes' vertical midpoint measures
   * 36.57 in the export's 90px space — 40.64% — so that is the transform origin.
   * The nose and mouth are a separate layer and do not flip.
   */
  asleep: { browY: 1, faceY: 0, tilt: 0 },
} as const

export type Expression = keyof typeof EXPRESSIONS
export { EXPRESSIONS }

/** Measured from `awake-eyes.svg`: the eyes span y 31.31-41.83 of 90. */
const EYE_FLIP_ORIGIN = 'center 40.64%'
/** The z glyphs come from the sleeping pillow's 210x188 export; this brings them
 *  down to the awake pillow's scale. */
const Z_SCALE = 0.5

const EXPRESSION_MS = 1400
/** A nap runs 4.5-6.5s (direct instruction: "sleeping time can be increased by
 *  couple of seconds" — it was 2.2-4.0). Long enough that the zzz completes more
 *  than one full 3.6s cycle, which is what makes the nap read as a state the
 *  pillow is in rather than a flicker on its way back to awake. */
const SLEEP_MIN_MS = 4500
const SLEEP_MAX_MS = 6500
const NEUTRAL_MIN_MS = 3500
const NEUTRAL_MAX_MS = 7000

const MASCOT_LAYER = {
  position: 'absolute' as const,
  inset: 0,
  width: 138.158,
  height: 90,
  // Preflight's `img { max-width: 100% }` clamps an over-wide export to its box;
  // these are exactly box-width, but the rule is kept for consistency with the
  // other split assets, where it is load-bearing.
  maxWidth: 'none' as const,
}

/**
 * The mascot's expression clock, on its own so more than one avatar can be
 * driven by it — direct instruction for the session-feedback thank-you screen:
 * "re-use pillow avatar animation for last page avatar ... from home page or
 * sleeping diary page". Exported as a hook rather than copied, so "the same
 * animation" is enforced by the module graph and any future tuning reaches both
 * avatars at once.
 *
 * `nap` opts out of the sleeping expression. The thank-you screen passes
 * `false`: a pillow that dozes off mid-sentence while thanking someone for
 * their feedback reads as the app losing interest, and the nap is also the one
 * expression needing a separately flipped eye layer.
 */
export function useMascotExpression({ nap = true }: { nap?: boolean } = {}) {
  const reduceMotion = useReducedMotion()
  const [expression, setExpression] = useState<Expression>('neutral')

  useEffect(() => {
    if (reduceMotion) return
    let timer: number
    const toExpression = () => {
      // Three candidates, picked per cycle. `Math.random` is fine here — the
      // constraint against it in this project applies to Workflow scripts,
      // which must be resumable.
      //
      // Sleeping is the least frequent of the three and holds longer than the
      // other two, because it is the only one that changes what the face *is*
      // rather than how it is set; a nap every other cycle would read as a
      // broken asset.
      const roll = Math.random()
      const next: Expression = nap
        ? roll < 0.3
          ? 'asleep'
          : roll < 0.65
            ? 'happy'
            : 'curious'
        : roll < 0.5
          ? 'happy'
          : 'curious'
      setExpression(next)
      timer = window.setTimeout(
        toNeutral,
        next === 'asleep' ? SLEEP_MIN_MS + Math.random() * (SLEEP_MAX_MS - SLEEP_MIN_MS) : EXPRESSION_MS,
      )
    }
    const toNeutral = () => {
      setExpression('neutral')
      timer = window.setTimeout(
        toExpression,
        NEUTRAL_MIN_MS + Math.random() * (NEUTRAL_MAX_MS - NEUTRAL_MIN_MS),
      )
    }
    timer = window.setTimeout(toExpression, NEUTRAL_MIN_MS)
    return () => window.clearTimeout(timer)
  }, [reduceMotion, nap])

  // Slow and soft: an expression that snaps reads as a glitch on a face this
  // small. The same symmetric curve the rest of this portal's motion uses.
  const featureTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const }

  return { expression, reduceMotion, featureTransition, ...EXPRESSIONS[expression] }
}

/** `withPencil` is the My Lessons variant (frame `771:3718`) — the pillow plus a
 *  pencil and a contact shadow. Opt-in rather than a second component, because
 *  the expressions, the nap, the zzz and the breath are all identical and a fork
 *  would have to be kept in step with every one of them. */
export function ConsumerMascot({
  withPencil = false,
  withQuestion = false,
  ground,
  zzzTone = 'grey',
}: {
  withPencil?: boolean
  withQuestion?: boolean
  /**
   * Round 47 — the zzz glyphs' tone. The assets are natively **white**; Home
   * darkens them with a `brightness(0.55)` filter because white all but
   * disappears on its pale canvas. On the trainee module intro banner the
   * pillow sits on `primary`, where that filter makes them a dirty grey
   * against the purple, so `'white'` simply drops the filter — it restores the
   * asset's own colour rather than adding a second recolour.
   */
  zzzTone?: 'grey' | 'white'
  /**
   * Round 47 — an explicit ground-shadow asset, for callers whose canvas is
   * neither Home's cream wave nor Need Help's gold one. The trainee module
   * intro banner sits on `purple-50` and the frame draws the floor **white**
   * (direct instruction), where Home's `#EADECC` reads as a dirty smudge.
   *
   * Same construction as `help-ground.svg`: `awake-ground.svg` with the one
   * `fill` changed and nothing else — same box, same `cx`/`cy`/`rx`/`ry` — so
   * it registers with the pillow by construction rather than by transcribed
   * offsets. Verified byte-identical apart from the fill.
   */
  ground?: string
} = {}) {
  const { expression, reduceMotion, featureTransition, browY, faceY, tilt } =
    useMascotExpression()
  const asleep = expression === 'asleep'

  return (
    <motion.div
      className="relative shrink-0"
      // The head tilt, plus the gentle movement of the pillow itself ("gentle
      // movement to pillow"): a 1.5% breath and a 2px float on a 5s loop, offset
      // from the expression clock so the two never look like one event.
      // `transformOrigin` at the bottom so the pillow swells upward instead of
      // sinking through its own resting shadow.
      style={{ width: 138.158, height: 90, transformOrigin: 'center bottom' }}
      animate={
        reduceMotion
          ? { rotate: 0 }
          : { rotate: tilt, scale: [1, 1.015, 1], y: [0, -2, 0] }
      }
      transition={{
        rotate: featureTransition,
        scale: reduceMotion
          ? { duration: 0 }
          : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        y: reduceMotion ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {/*
        `awake-body.svg` was ONE asset carrying the wide ground-shadow ellipse
        and the pillow together. It is split here — `awake-ground.svg` is that
        ellipse verbatim, `awake-pillow.svg` the pillow group plus the `<defs>`
        filter it references — because the My Lessons contact shadow has to paint
        BETWEEN them, which a single asset cannot express.

        Measured, this matters: 15% of the contact ellipse's footprint lands on
        the pillow's own yellow body (the other 85% on the ground shadow), so
        drawing it after a combined body asset put a dark blob over the pillow's
        lower edge. Invisible in a screenshot at 138px, obvious in the pixels.

        The composite is unchanged for Home — same shapes, same order, one more
        `<img>`. `awake-body.svg` is kept as the flat source these were split
        from, the same reason `pillow-mascot.svg` is kept (see the README).
      */}
      {/*
        Round 49 — Need Help's ground shadow is the **same ellipse in a darker
        paint**: `982:8811` is `#966316` where Home's is `#EADECC`. It has to be,
        because this page's wave is gold rather than cream and a pale shadow
        vanishes into it.

        `help-ground.svg` is `awake-ground.svg` with the one `fill` changed and
        nothing else — same box, same `cx`/`cy`/`rx`/`ry` — so it registers with
        the pillow by construction. The frame's own ellipse node sits at the
        bottom of a 138.158 x 97.79 group where this one sits at the bottom of a
        138.158 x 90 box; those are the same relative position, so transcribing
        the frame's `mt: 82` would have moved a correct shadow. §84.2 again:
        derive from the asset that already registers, never from a second set of
        numbers.
      */}
      <img
        src={
          ground ??
          (withQuestion
            ? '/illustrations/consumer-help/help-ground.svg'
            : '/illustrations/consumer-welcome/awake-ground.svg')
        }
        alt=""
        aria-hidden="true"
        style={MASCOT_LAYER}
      />

      {/*
        ── The My Lessons variant: a pencil and a contact shadow ─────────────
        Round 43, frame `771:3718`, direct instruction: "For lessons, I added a
        pencil + shadow. Just add this to my lesson avatar. animation of pillow
        remains same."

        The frame exports the whole avatar as ONE flat SVG, which would have
        thrown away the four-layer split the expressions depend on. So the two
        additions were lifted out of that export **byte for byte** — the pencil
        is its `<g id="Group 23">` verbatim and the shadow its `<ellipse
        id="Ellipse 3">` verbatim, each given the export's own unmodified `<svg>`
        open tag. The frame's box is 138.158 x 90, *exactly* the box the existing
        layers already use, so all six register by construction with no offsets
        to transcribe — the §84.2 technique, and the reason a mask and its
        outline have landed apart three times in this project when they were
        transcribed instead.

        Two things checked rather than assumed. The export's one `<defs>` filter
        is referenced only by the pillow **body**, so neither extracted layer
        needs it and both are self-contained. And `awake-body.svg` already
        contains the wide `Ellipse 2` ground shadow at identical coordinates —
        the only genuinely new shadow is this smaller, darker contact ellipse,
        which is why the body asset is untouched and this is additive.

        Both are plain `<img>`, not `motion.img`: they ride the wrapper's own
        breath and tilt (as the existing ground shadow already does) but take
        none of the face's `y` animation. A pencil leaning on the pillow does
        not raise its eyebrows. No existing animation changed.
      */}
      {withPencil && (
        <img
          src="/illustrations/consumer-welcome/lessons-shadow.svg"
          alt=""
          aria-hidden="true"
          style={MASCOT_LAYER}
        />
      )}

      {/* The pillow itself, above both shadows — see the split note above. */}
      <img src="/illustrations/consumer-welcome/awake-pillow.svg" alt="" aria-hidden="true" style={MASCOT_LAYER} />

      {/* Nose and mouth. */}
      <motion.img
        src="/illustrations/consumer-welcome/awake-features.svg"
        alt=""
        aria-hidden="true"
        style={MASCOT_LAYER}
        animate={{ y: faceY }}
        transition={featureTransition}
      />
      {/* Eyes — their own layer so they can turn over without taking the rest of
          the face with them. See `EXPRESSIONS.asleep`. */}
      <motion.img
        src="/illustrations/consumer-welcome/awake-eyes.svg"
        alt=""
        aria-hidden="true"
        style={{ ...MASCOT_LAYER, transformOrigin: EYE_FLIP_ORIGIN }}
        animate={{ y: faceY, scaleY: asleep ? -1 : 1 }}
        transition={featureTransition}
      />
      <motion.img
        src="/illustrations/consumer-welcome/awake-brows.svg"
        alt=""
        aria-hidden="true"
        style={MASCOT_LAYER}
        animate={{ y: browY }}
        transition={featureTransition}
      />

      {/* Last, because the export paints `Group 23` last — the pencil leans in
          front of the pillow's lower edge. */}
      {withPencil && (
        <img
          src="/illustrations/consumer-welcome/lessons-pencil.svg"
          alt=""
          aria-hidden="true"
          style={MASCOT_LAYER}
        />
      )}

      {/*
        ── The Need Help variant: a question-mark speech bubble ──────────────
        Round 49, frame `982:8558`, node `982:8826` ("Sticker 1"), direct
        instruction: "avatar will need updating, it has new vector".

        The export is a standalone 52.776 x 46.481 SVG, so unlike the pencil
        there was nothing to split out of a flat avatar — it is committed
        verbatim and positioned by the frame's own two offsets.

        Those offsets are the frame's, not eyeballed: within `982:8810` the
        pillow container sits at `ml 17.46` and the sticker at `ml 80.44` inside
        it, so the sticker's left edge is 17.46 + 80.44 = **97.9** in the same
        138.158-wide space `MASCOT_LAYER` uses, at `mt 0`. Its own wrapper is
        56.702 x 50.992 with the 52.776 x 46.481 artwork centred and rotated
        -5.1deg — the rotation is on an inner element with its own box, so it
        pivots about the sticker rather than about the mascot (the §84.2 reason
        the face layers translate instead of rotating).

        A plain `<img>`, like the pencil: it rides the wrapper's breath and tilt
        and takes none of the face's `y`. A speech bubble does not blink.

        ⚠️ It overflows the 138.158 box to the right, out to 154.6 — which is
        why `ConsumerMascotFigure` widens its own box for this variant rather
        than letting the sticker hang outside a centred column and pull the
        pillow visually off-centre.
      */}
      {withQuestion && (
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 97.9, top: 0, width: 56.702, height: 50.992 }}
        >
          {/*
            It moves (direct instruction: "under need help button, animation the
            question mark and chate chat bubble also"). Everything else on this
            mascot is alive — the brows, the eyes, the tilt, the breath — so a
            frozen bubble was the one static thing on it.

            The bubble and the mark animate **as one element**, which is both
            what a speech bubble does physically and the safe way to do it here:
            the export interleaves its four paths (bubble fill, mark, bubble
            outline, mark highlight), so splitting it into two layers to animate
            them separately would reorder the paint and change how the mark sits
            against the outline. §84.2's rule cuts the other way for once — the
            asset is only guaranteed to register with itself.

            ⚠️ Amplitude is deliberately large for the size: -5.1deg (its own
            drawn rest angle) to +3deg is an **8.1deg** swing, and the float is
            3px. Round 34's lesson is that rotations under ~8deg are invisible
            on small shapes and that deltas which cancel read as no movement at
            all, and this shape is 52px. The 3.2s loop is also deliberately
            coprime-ish with the pillow's own 5s breath, so the two never sync
            into looking like one event.
          */}
          <motion.img
            src="/illustrations/consumer-help/help-question.svg"
            alt=""
            aria-hidden="true"
            style={{ width: 52.776, height: 46.481, maxWidth: 'none' }}
            animate={
              reduceMotion
                ? { rotate: -5.1, y: 0 }
                : { rotate: [-5.1, 3, -5.1], y: [0, -3, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        </div>
      )}

      {/* The zzz, only while asleep. Its own box above the pillow's head,
          scaled from the sleeping pillow's coordinate space — see `Z_LAYERS`.
          `AnimatePresence` so the glyphs fade rather than vanish on waking. */}
      <AnimatePresence>
        {asleep && !reduceMotion && (
          <motion.div
            key="zzz"
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{ left: '46%', top: -38, width: 210.646 * Z_SCALE, height: 188 * Z_SCALE }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {Z_LAYERS.map(({ src, delay }) => (
              <motion.img
                key={src}
                src={`/illustrations/consumer-welcome/${src}.svg`}
                alt=""
                // Grey, not the asset's own white (direct instruction: "the zzz
                // in home page needs to be in grey"). The glyphs are shared with
                // the welcome screen, where white is correct because they sit on
                // a deep purple wave; on Home's pale canvas white is all but
                // invisible. A `brightness` filter rather than a second set of
                // grey exports — the source is a flat white shape, so scaling
                // its channels down is an exact recolour, and one asset stays
                // one asset. 0.55 lands on ~#8c8c8c: present, not assertive.
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  maxWidth: 'none',
                  filter: zzzTone === 'white' ? undefined : 'brightness(0.55)',
                }}
                initial={{ opacity: 0 }}
                animate={Z_PATH}
                transition={{
                  duration: Z_CYCLE_S,
                  delay,
                  repeat: Infinity,
                  times: Z_TIMES,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * The mascot **as a page's hero figure** — the sized, breakpoint-scaled box the
 * bare `ConsumerMascot` has to sit in. Extracted at its second caller (Round 43,
 * direct instruction: "the hero section i.e. weavy background + avatar,
 * streamline across all pages. We use what we have done in home section").
 *
 * It was Home's alone, written inline there, and the in-progress pages rendered
 * `<ConsumerMascot />` raw. Measured, that is two different heroes: at 367px the
 * bare mascot renders at its full desktop 138x90 against Home's scaled 89x58,
 * and it sits 32px lower. Nothing about that was visible in a screenshot of
 * either page on its own — only in the two side by side.
 *
 * The mascot is 89.035 x 58 on mobile against 138.158 x 90 on desktop — a
 * uniform 0.6444 scale, identical on both axes.
 *
 * Applied as a `transform` inside a box that reserves the *scaled* size, rather
 * than by resizing the art: the mascot's own layers are absolutely positioned
 * and its floating "z"s sit at fixed px offsets (`top: -38`), so changing its
 * width would move those out of register while a transform carries them along.
 *
 * `origin-bottom-left` is right at every width even on a centred page: the inner
 * box is 138px scaled to exactly the outer box's 89px, so pinning it left fills
 * that box rather than offsetting it. What gets centred is the box.
 */
export function ConsumerMascotFigure({
  withPencil = false,
  withQuestion = false,
}: { withPencil?: boolean; withQuestion?: boolean } = {}) {
  return (
    /*
     * Round 49 — the question variant's box is **16.4px wider** (154.6 against
     * 138.158, and 99.6 against 89 once scaled), because the sticker overflows
     * the mascot's own box to the right. The frame does the same thing: its
     * group `982:8810` is 154.6 wide inside a centred `items-center` column, so
     * the pillow sits ~8px left of centre and the bubble carries the balance.
     * Sizing the box to the *pillow* instead would centre the pillow and let the
     * bubble hang into the gutter, which reads as a layout slip.
     */
    <div
      className={cn(
        'flex h-[58px] items-end sm:h-[90px]',
        withQuestion ? 'w-[99.6px] sm:w-[154.6px]' : 'w-[89px] sm:w-[138px]',
      )}
    >
      <div className="origin-bottom-left scale-[0.6444] sm:origin-bottom sm:scale-100">
        <ConsumerMascot withPencil={withPencil} withQuestion={withQuestion} />
      </div>
    </div>
  )
}

/**
 * Seats a page's opening block **on** the wave's crest, at every desktop width.
 *
 * The mascot used to float above the line. Measured on Home at 1062: the wave's
 * lowest painted row under the mascot sits at page y 289.75 and the pillow's
 * base at 269.15, so it hung **20.6px** clear of the curve it is meant to rest
 * on (direct instruction, with the gap drawn over the live page: "move the
 * avatar and all content below it down, so that it sits on the line").
 *
 * ── Why a formula and not a 20.6px nudge ──────────────────────────────────
 *
 * The wave export is 1281 x 239 and renders full-bleed, so past its own width
 * its height grows with the viewport (269 at 1440, 358 at 1920) while the
 * content stays put. Two facts make the seat exact at any width:
 *
 *     wave height H     = max(18.657vw, 239px)   // 239/1281, floored at 1281
 *     crest under mascot = 0.95711 x H            // measured, 4x supersampled
 *     block start -> base = 208.15px              // constant: both the wave and
 *                                                 // the mascot hang off the same
 *                                                 // content box, so a taller
 *                                                 // header moves them together
 *
 * so the offset that lands base on crest is `0.95711 x H - 208.15px`, which is
 * 20.6px at the frame's own width and grows with the curve above it.
 *
 * This **replaces** the previous `max(0px, calc(18.657vw - 239px))`, which
 * tracked the wave's *growth* rather than its crest: it was a no-op at 1281 (so
 * the 20.6px gap survived) and slightly overshot past it, closing the gap to
 * ~15px by 1920. The drift was real but invisible — it is the seat that was
 * wrong, not the tracking.
 *
 * ⚠️ `sm:` is load-bearing, not tidiness. Below 640px a *different* export is in
 * play (375 x 176) and the mascot renders at 0.6444 scale; measured there, the
 * base already sits 10px **below** the crest, so this offset would push a
 * correct phone layout down. Keep the breakpoint in step with the export swap in
 * `ConsumerCanvasWave` and the scale swap in `ConsumerMascotFigure`.
 *
 * It moves the *content*, never the wave, which is absolutely positioned and not
 * in this block's flow.
 */
/* ⚠️ The trailing constant is 248.15, not the derived 208.15 — a deliberate
   **40px lift** (direct instruction: "move avatar + hello and welcome title up a
   little"). The derivation above still stands; this just sits the block 40px
   above the crest rather than exactly on it, which is the look that was asked
   for now that the hero is left-aligned and no longer centred over the crest.
   To put it back on the crest, restore 208.15 — that is the whole change. */
export const CONSUMER_CREST_TRACKING =
  'sm:mt-[calc(0.95711*max(18.657vw,239px)-248.15px)]'

/**
 * The space between a page's hero block and the content under it.
 *
 * The frames' own 48, plus 24 **from `lg` only** — Round 43 direct instruction
 * "increase vertical space by 24px on all pages", then "just for desktop view".
 * A phone keeps 48: the extra 24 buys separation on a wide canvas and only
 * costs a scroll on a 375px screen, where the hero already fills most of the
 * viewport.
 *
 * Scoped to the whole portal, which is why it is one exported constant rather
 * than a number typed into three pages. All three consumer pages read it, so
 * the next adjustment is one edit and cannot land on only two of them.
 */
export const CONSUMER_HERO_TO_CONTENT = 'gap-12 lg:gap-[72px]'

/**
 * A Consumer Portal page's opening block: the mascot, a title and one sub line,
 * sitting on the wave.
 *
 * Extracted in Round 43 at its second real caller (Home, then My Lessons) —
 * the same instruction that produced `ConsumerMascotFigure`: "the hero section
 * i.e. weavy background + avatar, streamline across all pages. We use what we
 * have done in home section". Home's own greeting now renders through this, so
 * "the same hero" is enforced by the module graph rather than by care.
 *
 * ⚠️ **Alignment is per page, via `align`.**
 *
 * Home is `left` (direct instruction: "we will need to left align the avatar +
 * copy below it"), which is what lets its greeting sit opposite the Need help
 * button. My Modules and Need Help stay `center`, the original treatment
 * (direct instruction: "in module page, the avatar + copy can be centre aligned
 * in desktop ... same for need help").
 *
 * `center` is not centred at every width — it is the original split: left on a
 * phone, where a centred column of two long lines reads as a poster, and
 * centred from `sm`, where the mascot sits over the wave's crest.
 *
 * The wave never moves either way: it is painted by `ConsumerCanvasWave` behind
 * this block, not by this block.
 *
 * The `sm:gap-12` is still Home's (a direct instruction) rather than either
 * frame's 32 — at 32 the mascot's own drop shadow nearly touches the cap height
 * of the title below it.
 */
export function ConsumerPageHero({
  title,
  sub,
  action,
  align = 'center',
  withPencil = false,
  withQuestion = false,
}: {
  title: string
  /**
   * Optional. My Profile is a title-only hero (direct instruction: "no sub text
   * below the page title, hide it"), so the `<p>` is not rendered at all rather
   * than rendered empty — an empty paragraph still occupies its own line box
   * and would leave the title sitting 24px higher than the mascot expects,
   * which reads as a mistake rather than as a deliberate omission.
   */
  sub?: ReactNode
  /**
   * Optional control on the right of the title row (Home's "Need help").
   *
   * A slot rather than a baked-in button: only Home asks for one, and the Help
   * page itself must not offer a link to where it already is. It stacks under
   * the title below `sm` and sits opposite it from `sm` up.
   */
  action?: ReactNode
  /**
   * Where the mascot and copy sit from `sm` up. Defaults to `center`, the
   * original treatment, so a page opts *in* to the left-aligned variant rather
   * than inheriting it. Below `sm` both are left-aligned regardless.
   */
  align?: 'left' | 'center'
  /** My Lessons' avatar carries a pencil — see `ConsumerMascot`. */
  withPencil?: boolean
  /** Need Help's avatar carries a question-mark bubble — see `ConsumerMascot`. */
  withQuestion?: boolean
}) {
  return (
    /* ⚠️ **No `max-w` of its own** (direct instruction: "remove the side
       padding to make sure the avatar + text align with other contents on the
       page"). It used to carry `max-w-[1057px]`, which was harmless while the
       block was centred but became a visible inset the moment it went
       left-aligned: the parent content column is 1320 wide, so a 1057 cap
       centred inside it pushed the mascot and copy 132px right of every section
       heading below them, measured at 1680.

       The readable-line-length job that cap was doing belongs to the copy, not
       to the block — these are one short title and one short sub line, and the
       page's own column is already the measure everything else obeys.

       (This comment is a plain block comment, not `{...}`-wrapped: it sits
       between `return (` and the JSX, which is an expression position. A JSX
       expression comment here is a second expression and does not parse.) */
    <div
      className={cn(
        'flex w-full flex-col items-start gap-4 sm:gap-12',
        align === 'center' && 'sm:items-center',
      )}
    >
      <ConsumerMascotFigure withPencil={withPencil} withQuestion={withQuestion} />
      {/* The title row. `justify-between` only matters when there is an
          `action` to sit opposite the copy, which today is Home alone. */}
      <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        {/* ⚠️ `w-full` on the centred variant is load-bearing. `min-w-0` alone
            lets the block shrink to its content, so `text-center` then centres
            the copy inside that shrunken box — which parks it left of the page
            rather than on its centre line. This regressed exactly that way when
            the row was introduced for Home's Need help button. */}
        <div
          className={cn(
            'flex min-w-0 flex-col gap-2 text-left',
            align === 'center' && 'w-full sm:text-center',
          )}
        >
          {/* `consumer-display` (28 -> 40), not the app-wide `display-lg`: that
              token is a flat 40px, which is 12px too large on a 375px screen. */}
          <h1 className="text-consumer-display text-ink">{title}</h1>
          {sub !== undefined && <p className="text-consumer-lead text-ink-muted">{sub}</p>}
        </div>
        {action !== undefined && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

/**
 * Fade-and-rise for everything **below** the wave and mascot (direct
 * instruction: "when I switch tabs, only animate the content below the pillow +
 * background").
 *
 * This is the third pass at page-transition motion in one session, and the
 * shape of the answer is worth recording. `ConsumerShell` animated the whole
 * `<main>`, which meant the header, the wave and the mascot all faded on every
 * tab change and read as a full page reload; suppressing that outright fixed the
 * reload but left the swap completely inert. Scoping the entrance to the content
 * region is what gives a tab change a sense of movement while the page's own
 * furniture — chrome, backdrop, mascot — holds still, which is what makes it
 * feel like a tab rather than a navigation.
 *
 * No latch here, unlike `ConsumerShell`'s `pageIntroPlayed`: this one is
 * *supposed* to play on every arrival. Each page remounts on navigation, so a
 * plain `initial`/`animate` pair is all it takes.
 */
export function ConsumerContentReveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const controls = useAnimationControls()
  const revealToken = useContentRevealToken()

  /**
   * Plays on mount, and **replays** whenever the hamburger drawer closes, so
   * the content moves in as the shutter goes up.
   *
   * ⚠️ **Driven by controls, NOT by remounting on a `key`.** Keying this
   * subtree off the token would have been one line, and it would throw away
   * every child's state on every menu close — a half-typed sleep-diary answer,
   * an open card, the scroll position. Replaying the same values through
   * `useAnimationControls` leaves the tree mounted.
   *
   * ⚠️ Because `animate` is a controls object rather than a target, framer
   * plays **nothing** on mount by itself — the effect below is what does it, so
   * it is deliberately keyed on `revealToken` rather than running once. Closing
   * by *navigating* remounts the page and takes the same path, so the X, Escape
   * and a row tap all animate identically.
   */
  useEffect(() => {
    if (reduceMotion) {
      controls.set({ opacity: 1, y: 0 })
      return
    }
    void controls.start({ opacity: [0, 1], y: [10, 0] })
  }, [revealToken, reduceMotion, controls])

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={controls}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
