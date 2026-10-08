import { useEffect, useState, type ReactNode, type Ref } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * The Consumer Portal's completion hero — the deep-purple wave band, the pillow
 * mascot standing at its trough, and a centred title-plus-body column.
 *
 * Extracted from `ConsumerDiaryPage` in Round 47 at its **second** caller: the
 * module's own completion screen (frame `915:3850`) is the same screen with
 * different words, and its illustration is this one, layer for layer. Copying
 * it across would have set two versions of a six-layer composition running in
 * parallel, which is exactly the drift §89.14 records `PersonCard` causing.
 *
 * Everything below is the diary's own code moved verbatim — the wave's fixed
 * depth (§88.1), the six-layer mascot and its blinking (§88.2), the straddle
 * offsets, and the measured spacing rhythm. The doc comments travel with it
 * because the numbers they explain are the reason nothing here is round.
 */

/* ------------------------------------------------------------------------ */
/* Wave band + mascot (welcome and thank-you screens)                        */
/* ------------------------------------------------------------------------ */

/**
 * The deep-purple gradient band that opens the welcome and thank-you screens.
 *
 * Two purpose-drawn exports, one per breakpoint, each rendered at its own
 * aspect ratio with the viewport cropping rather than the box stretching —
 * §85.2's "clip, never squash" rule, which is the fix for the sheared-wave
 * bug this portal shipped twice ("the background weavy issue"). Desktop is
 * floored at its drawn 1281 so a tablet crops it instead of shrinking the
 * band to a sliver; mobile swaps in below `sm`.
 *
 * Both frames position the band against the whole page (y 0, running behind
 * the white header), and this renders inside a content column that starts
 * below the 96px header — so the offset loses that 96, the same correction
 * `ConsumerCanvasWave` documents.
 */
function DiaryWaveBand() {
  return (
    <>
      <img
        src="/illustrations/consumer-diary/diary-wave-mobile.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none block sm:hidden"
        style={{
          height: 'auto',
          // Tailwind preflight's `img { max-width: 100% }` clamps a full-bleed
          // export to its parent's padded width — §84.2's finding.
          maxWidth: 'none',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          top: -96,
        }}
      />
      {/*
        Desktop — frames `811:10934` / `816:12478`.

        FIXED HEIGHT, FLUID WIDTH. This is `ConsumerWelcome`'s own anchoring
        ("Horizontal is percentage-based so the wave widens with the viewport,
        which is what a wave should do"), and adopting it here is the fix for
        the band ballooning on a wide screen.

        The previous pass scaled the whole export with the viewport
        (`width: max(100vw, 1281px)`, `height: auto`), so its depth grew with
        width: 469px at 1281, **703px at 1920** — measured, and at that depth
        the band swallowed the title, leaving "Sleep Diary" and the date as
        dark ink on deep purple. Holding the height constant keeps the crest a
        fixed distance below the header at every width.

        The export is the frame's own untrimmed artwork (1869.39 x 1296.05,
        node `811:10936`) rather than the old 1281 x 469 crop, and it carries
        `preserveAspectRatio="none"` — which is what lets it stretch to a wider
        box instead of letterboxing. Same shape either way: the two exports'
        path data differ by exactly the filter-box origin (289.746, 828.018).

        Geometry is the frame's own, flattened from its two levels of insets:
          band   1281 x 368 at page y -64  (`811:10935`)
          image  left -22.63%, width 145.96%   (-289.9 .. 1579.8 of 1281)
                 top -827px, height 1295px     (its own px, since h is fixed)
        `top` is that page -64 less the header, so it is derived from the same
        `--consumer-header-h` every other header-dependent number now reads.
        It was a hardcoded -160 against a 96px header; leaving it would have put
        the crest 24px low the moment Round 47 shortened the header, which is
        exactly the failure the module bar's own `top-24` produced.
        At 1281 it reproduces the frame 1:1; wider, only the width grows.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute hidden overflow-hidden sm:block"
        // 470, not the frame's own 368: the band is only a CLIP WINDOW, and the
        // image inside is pinned in px, so a taller window moves nothing — it
        // just leaves the wave's soft drop shadow the ~106px of room the old
        // 1281 x 469 crop gave it. At 368 the clip lands 4px under the deepest
        // trough and cuts that shadow off square.
        style={{ left: '50%', transform: 'translateX(-50%)', width: '100vw', height: 470, top: 'calc(-64px - var(--consumer-header-h))' }}
      >
        <img
          src="/illustrations/consumer-diary/diary-wave-desktop.svg"
          alt=""
          style={{
            position: 'absolute',
            left: '-22.63%',
            width: '145.96%',
            top: -827,
            height: 1295,
            maxWidth: 'none',
            display: 'block',
          }}
        />
      </div>
    </>
  )
}

/**
 * The pillow-with-mug-and-books mascot. One flattened export (`812:11516`,
 * the thank-you frame's own, the largest of the six draws) rather than five
 * positioned layers — a mask/outline pair transcribed separately has drifted
 * apart three times in this project (§78.1), and nothing here animates
 * per-layer, so there is nothing a flat file gives up.
 *
 * `size` is the rendered width: the welcome screens draw it smaller than the
 * thank-you screen ("Desktop thank you screen avatar is a little bigger" —
 * direct instruction), and mobile smaller than desktop.
 */
/**
 * Layer boxes, as PERCENTAGES of the frames' own 263 x 145.5 mascot box
 * (`812:11398` / `816:12506`). Percentages rather than px so the whole
 * assembly scales with the container width and nothing has to be re-derived
 * per breakpoint.
 *
 * The pillow's box is the interesting one. The frame's pillow export is this
 * project's existing `pillow-mascot.svg` — proven, not assumed: its path data
 * maps onto the frame's by a single transform, verified on three independent
 * paths to +/-0.01px:
 *
 *     frame_x = 1.1694 * pillow_x + 9.711
 *     frame_y = 1.1694 * pillow_y - 38.82
 *
 * which, once the frame's own -13.22 / -32.38 layer offset is folded in, puts
 * the export's 210.646 x 188 box at container (-3.509, -71.20) scaled 1.1694.
 * So the diary pillow renders the SAME three animated layers the welcome
 * screen uses (direct instruction: "re-use the face features in pillow here"),
 * rather than a second flat copy that would drift from it.
 */
const M = {
  ground: { left: '-1.270%', top: '73.155%', width: '102.547%', height: '28.899%' },
  pillow: { left: '-1.334%', top: '-48.935%', width: '93.662%', height: '151.100%' },
  books: { left: '56.989%', top: '31.299%', width: '41.763%', height: '68.705%' },
  booksTexture: { left: '68.589%', top: '36.790%', width: '13.457%', height: '23.292%' },
  /** Group 26's box — the mug, and the steam that was split out of it. */
  mug: { left: '57.422%', top: '8.399%', width: '40.932%', height: '91.603%' },
} as const

const LAYER = { position: 'absolute' as const, maxWidth: 'none' as const, display: 'block' as const }

/**
 * The answer box belonging to whoever is being asked right now grows slightly
 * (direct instruction: "by default we show PLE name first then carer, so make
 * the white box bigger for PLE, and when answered, scale it back to default,
 * and increase for carer").
 *
 * 1.08 on a 208px box is ~17px of extra width — above the threshold where a
 * change this small stops registering at all (Round 34's lesson). It is a
 * transform rather than a width change so the row's layout never reflows,
 * which would nudge the label and the unit beside it.
 */

/** The welcome screen's own breath period. */
const BREATH_S = 4

/**
 * Face expressions, ported from Home's `ConsumerMascot` (direct instruction:
 * "just bring in face expression to the pillow as we have on home screen").
 *
 * ⚠️ Home has a fourth state, `asleep`, which flips the eyes over and raises
 * the `z` glyphs. It is deliberately absent: this pillow is awake with a cup
 * of tea, and "no sleeping animation for this one" was an explicit call.
 *
 * `browY`/`faceY` are PER CENT of the layer box, not Home's px. Home's values
 * are tuned to a 90px-tall head; this pillow renders about 2.4x that, so
 * copying the px would have produced a third of the movement — the Round 34
 * failure of animating too little to see.
 *
 * Only translation and one rotation, for Home's own reason: each layer spans
 * the whole box, so `scale` on a layer pivots about the box centre rather than
 * the feature's, and a scaled brow visibly slides sideways. The tilt is
 * applied to the whole pillow, which is one element with its own box.
 */
const EXPRESSIONS = {
  neutral: { browY: 0, faceY: 0, tilt: 0 },
  /** Brows and features lift together — the whole face reads as brightening. */
  happy: { browY: -2.2, faceY: -1.3, tilt: 0 },
  /** Brows up further, features barely move, head tilts. */
  curious: { browY: -3.4, faceY: -0.5, tilt: 4 },
} as const
type DiaryExpression = keyof typeof EXPRESSIONS

const EXPRESSION_MS = 1400
const NEUTRAL_MIN_MS = 3500
const NEUTRAL_MAX_MS = 7000

/**
 * The pillow with its mug and books.
 *
 * Six layers rather than the flat `diary-mascot.svg` Round 44 shipped, because
 * two things now have to move independently: the steam, and the pillow's face.
 *
 * ⚠️ NO SLEEPING ANIMATION HERE (direct instruction). The welcome screen's
 * pillow is asleep and carries the `z` glyphs; this one is awake with a cup of
 * tea, so it takes the same body/face/brow layers and the same breath, and
 * none of the `Z_LAYERS`.
 *
 * Travel is expressed in per-cent of each layer's own box, not px: the art
 * renders at ~1.22x its natural size on desktop and ~0.89x on a phone, so px
 * travel would mean a different amount of movement at each width.
 */
function DiaryMascot({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  const loop = (duration: number) => ({ duration, repeat: Infinity, ease: 'easeInOut' as const })

  // Home's own cycle: a neutral hold of 3.5-7s, then one of the two
  // expressions for ~1.4s, then back. The irregular gap is the point — a fixed
  // sequence reads as a repeating animation rather than a face doing something
  // of its own accord.
  const [expression, setExpression] = useState<DiaryExpression>('neutral')
  useEffect(() => {
    if (reduceMotion) return
    let timer: number
    const toExpression = () => {
      setExpression(Math.random() < 0.5 ? 'happy' : 'curious')
      timer = window.setTimeout(toNeutral, EXPRESSION_MS)
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
  // Slow and soft: an expression that snaps reads as a glitch on a face this
  // small. The same symmetric curve the rest of this portal's motion uses.
  const featureTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const }

  return (
    <div className={cn('relative aspect-[263/145.5]', className)} aria-hidden="true">
      {/* The frame draws a WIDER ground shadow than the pillow's own, so it
          reaches under the books too — `816:12507`, the pillow's own ellipse
          at 1.413x rather than the 1.1694x the pillow itself takes. */}
      <img src="/illustrations/consumer-diary/diary-ground.svg" alt="" style={{ ...LAYER, ...M.ground }} />

      {/*
        The pillow: breath on the outer box, head tilt on the inner one, and
        the expression carried by the face and brow layers inside that.

        Nesting matters. The breath has to scale and float the WHOLE pillow
        including its features, while the tilt has to rotate the whole pillow
        about its base without the features counter-rotating — so they are two
        boxes, not one element trying to animate both with the features
        applying their own offsets on top.

        3.5%, not the welcome screen's 1.8%. Measured, that value moved this
        pillow 4.6px across a 4s cycle and was reported as "no motion" — the
        Round 34 lesson exactly.
      */}
      <motion.div
        style={{ position: 'absolute', ...M.pillow, transformOrigin: 'center bottom' }}
        animate={reduceMotion ? undefined : { scale: [1, 1.035, 1], y: [0, -3, 0] }}
        transition={reduceMotion ? undefined : loop(BREATH_S)}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: 'center bottom' }}
          animate={{ rotate: tilt }}
          transition={featureTransition}
        >
          <img
            src="/illustrations/consumer-welcome/pillow-body.svg"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', maxWidth: 'none' }}
          />
          <motion.img
            src="/illustrations/consumer-welcome/pillow-face.svg"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', maxWidth: 'none' }}
            animate={{ y: `${faceY}%` }}
            transition={featureTransition}
          />
          <motion.img
            src="/illustrations/consumer-welcome/pillow-brows.svg"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', maxWidth: 'none' }}
            animate={{ y: `${browY}%` }}
            transition={featureTransition}
          />
        </motion.div>
      </motion.div>

      <img src="/illustrations/consumer-diary/diary-books.svg" alt="" style={{ ...LAYER, ...M.books }} />
      <img
        src="/illustrations/consumer-diary/diary-books-texture.svg"
        alt=""
        style={{ ...LAYER, ...M.booksTexture }}
      />
      <img src="/illustrations/consumer-diary/diary-mug.svg" alt="" style={{ ...LAYER, ...M.mug }} />

      {/*
        Steam. Split out of Group 26 byte for byte — the two `fill="white"`
        wisps (`Vector_17`/`Vector_18`), given that group's own unmodified
        `<svg>` open tag so it keeps the same 107.65 x 133.282 coordinate space
        and registers with the mug by construction, with no offsets to
        transcribe (§84.2, and the reason a mask and its outline have landed
        apart three times in this project).

        Treatment is deliberately the simple one (direct instruction: "easy
        option -> show white fade from bottom to top. thats all"): a vertical
        mask holds the wisps solid where they leave the cup and fades them out
        toward the top.

        ⚠️ STATIC and at full opacity, both by direct instruction ("keep opacity
        100% else it wont be visible", then "keep it static, make it white
        increase opacity"). An earlier pass breathed it between 0.5 and 1 and at
        0.5 white-on-purple all but disappeared, so the fade is the whole
        effect — there is deliberately no motion here.

        The solid stop is 70%, not 35%: at 35% the gradient started eating the
        wisps barely above the cup and most of the plume rendered as a ghost.
        The top 30% still fades out, which is what keeps it reading as steam
        dispersing rather than a hard-edged shape.
      */}
      <img
        src="/illustrations/consumer-diary/diary-steam.svg"
        alt=""
        style={{
          ...LAYER,
          ...M.mug,
          maskImage: 'linear-gradient(to top, #000 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, #000 70%, transparent 100%)',
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* The hero layout: one shape, used by three screens                        */
/* ------------------------------------------------------------------------ */

export function CompletionHero({
  mascotClassName,
  mascot,
  artOverlap = false,
  title,
  children,
  headingRef,
}: {
  /** Only meaningful for the default mascot; a caller supplying its own `mascot`
   *  sizes it itself. */
  mascotClassName?: string
  /** Overrides the pillow-and-books mascot. The module's completion screen
   *  passes the rosette badge instead; everything else about the screen — the
   *  wave, the straddle, the spacing rhythm — is the same, which is the whole
   *  reason this takes a slot rather than being forked. */
  mascot?: ReactNode
  /** Lets the art sit slightly over the title beneath it, **at 1200 and up
   *  only** — below that it takes extra clearance instead. Direct instruction
   *  for the badge, whose ribbons end in a point that reads better tucked
   *  behind the heading on a wide screen and as a collision on a narrow one. */
  artOverlap?: boolean
  title: string
  children: ReactNode
  /** `Ref`, not `RefObject`: the diary hands this a `useRef` and the module
   *  page a **callback** ref, which is what it needs under
   *  `AnimatePresence mode="wait"` (§89.3). Both are valid `ref` values. */
  headingRef: Ref<HTMLHeadingElement>
}) {
  return (
    // The canvas is `purple-50`, so this has to reach the fold or the app's
    // own warm `--background` shows as a cream block under it. Same rule the
    // questions step uses, and the same paired breakpoint: `ConsumerHeader` is
    // `--consumer-header-h` only at `min-[1200px]`; below that the header's
    // tab row adds 61px on top of it. Both terms read the token rather than the
    // 96 / 157 they used to hardcode, so Round 47's shorter header moved them
    // together instead of leaving the fold 24px out.
    <div className="relative flex min-h-[calc(100dvh-var(--consumer-header-h)-61px)] flex-col items-center px-6 pb-16 min-[1200px]:min-h-[calc(100dvh-var(--consumer-header-h))]">
      <DiaryWaveBand />
      {/*
        The mascot STRADDLES the wave — it stands at the trough rather than
        below it, which is what the frames draw and what makes the art read as
        sitting on the wave instead of floating under it.

        Desktop is the frame's own `pt-80`: art top at page 176, base at 321.5,
        against a trough at 300. The 48 here is that 80 less the 32px of shadow
        bleed above the art in the export (solid art starts at y45 of its 388,
        which is 31.8 at this render width) — the box is not the art.
      */}
      <div
        className={cn(
          'relative mt-12 sm:mt-20',
          /* The overlap is desktop-only. Direct instruction: "make sure the
             badge does not overlap in tablet or mobile view, add some space for
             these ports" — and it is the right call, because the text column
             below is much taller once it wraps on a narrow screen, so art
             tucked behind its first line reads as a collision there rather than
             as a layered composition. Below 1200 the badge gets extra clearance
             instead; at 1200 and up it tucks. */
          artOverlap && 'z-10 mb-6 min-[1200px]:mb-[-56px]',
        )}
      >
        {mascot ?? <DiaryMascot className={mascotClassName} />}
      </div>
      {/* 56, not the frame's 64: the export carries ~8px of bleed BELOW the art
          too (249 of 260), and that counts as layout height. */}
      {/* Base rhythm is the frames' tightest step (title -> date, 8px); the
          two wider steps below add to it — date -> body 8+8=16, body -> CTA
          8+56=64. Frame nodes `811:11009` (gap 16) and `812:11486` (gap 64). */}
      <div className="relative mt-8 flex w-full max-w-[772px] flex-col items-center gap-2 text-center sm:mt-16">
        <h1 ref={headingRef} tabIndex={-1} className="text-consumer-display text-balance text-ink outline-none">
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}
