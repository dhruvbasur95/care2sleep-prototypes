import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

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
 * inside a content column that starts below the 96px header, so the offset has
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
export function ConsumerCanvasWave({ headerPx = 96 }: { headerPx?: number }) {
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

type Expression = keyof typeof EXPRESSIONS

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

/** `withPencil` is the My Lessons variant (frame `771:3718`) — the pillow plus a
 *  pencil and a contact shadow. Opt-in rather than a second component, because
 *  the expressions, the nap, the zzz and the breath are all identical and a fork
 *  would have to be kept in step with every one of them. */
export function ConsumerMascot({ withPencil = false }: { withPencil?: boolean } = {}) {
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
      const next: Expression = roll < 0.3 ? 'asleep' : roll < 0.65 ? 'happy' : 'curious'
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
  }, [reduceMotion])

  const { browY, faceY, tilt } = EXPRESSIONS[expression]
  const asleep = expression === 'asleep'
  // Slow and soft: an expression that snaps reads as a glitch on a face this
  // small. The same symmetric curve the rest of this portal's motion uses.
  const featureTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const }

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
      <img src="/illustrations/consumer-welcome/awake-ground.svg" alt="" aria-hidden="true" style={MASCOT_LAYER} />

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
                  filter: 'brightness(0.55)',
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
export function ConsumerMascotFigure({ withPencil = false }: { withPencil?: boolean } = {}) {
  return (
    <div className="flex h-[58px] w-[89px] items-end sm:h-[90px] sm:w-[138px]">
      <div className="origin-bottom-left scale-[0.6444] sm:origin-bottom sm:scale-100">
        <ConsumerMascot withPencil={withPencil} />
      </div>
    </div>
  )
}

/**
 * Keeps a page's opening block sitting **on** the wave's crest above 1281px.
 *
 * The wave export is 1281 x 239 and renders full-bleed, so past its own width
 * its height grows with the viewport (269 at 1440, 358 at 1920) while the
 * content stays put. At the frame's width the pillow's base sits 5px above the
 * crest; at 1440 an untracked block floats 35px above it — which is exactly
 * what the in-progress pages did before they shared this.
 *
 * So the offset is not a constant, it tracks the wave's own growth:
 *
 *     wave bottom (page) = viewport x 239/1281 = 18.657vw
 *     extra needed       = that, minus the frame's own 239
 *
 * `max(0px, ...)` floors it, which makes this a no-op at or below 1281 —
 * including on mobile, where a different export is in play and the content is
 * already frame-correct. It moves the *content*, never the wave, which is
 * absolutely positioned and not in this block's flow.
 */
export const CONSUMER_CREST_TRACKING = {
  marginTop: 'max(0px, calc(18.657vw - 239px))',
} as const

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
 * The alignment split is Home's and is deliberate: left-aligned on a phone
 * where a centred column of two long lines reads as a poster, centred from `sm`
 * where the mascot sits over the wave's crest. The `sm:gap-12` is also Home's
 * (a direct instruction) rather than either frame's 32 — at 32 the mascot's own
 * drop shadow nearly touches the cap height of the title below it.
 */
export function ConsumerPageHero({
  title,
  sub,
  withPencil = false,
}: {
  title: string
  sub: ReactNode
  /** My Lessons' avatar carries a pencil — see `ConsumerMascot`. */
  withPencil?: boolean
}) {
  return (
    <div className="flex w-full max-w-[1057px] flex-col items-start gap-4 sm:items-center sm:gap-12">
      <ConsumerMascotFigure withPencil={withPencil} />
      <div className="flex w-full flex-col gap-2 text-left sm:text-center">
        {/* `consumer-display` (28 -> 40), not the app-wide `display-lg`: that
            token is a flat 40px, which is 12px too large on a 375px screen. */}
        <h1 className="text-consumer-display text-ink">{title}</h1>
        <p className="text-consumer-lead text-ink-muted">{sub}</p>
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
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
