import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { TODAY, formatDateLong } from '@/data/format'
import {
  SLEEP_DIARY_QUESTIONS,
  type SleepDiaryAnswers,
  type SleepDiaryQuestion,
} from '@/data/spaces'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'

/**
 * Consumer sleep diary fill-in flow — Round 44.
 *
 * Frames: `811:10934` / `792:4292` (welcome, desktop / iPhone SE),
 * `811:10747` / `805:9508` + the `810:*` series (questions), `812:11076` /
 * `814:11665` (thank you). No tablet frames were supplied — tablet is the
 * desktop layout on the fluid type scale (§85.1), which is what every other
 * consumer surface already does between 640 and 1280.
 *
 * One route (`/consumer/:dyadId/diary`), three stages in page state:
 * welcome -> the 9 directly-answered Consensus Sleep Diary questions -> thank
 * you. The questions, their order, their answer fields and their number/time
 * formats all come from `SLEEP_DIARY_QUESTIONS` in `data/spaces.ts` — the
 * researcher's table, the coach's summary and this questionnaire read one
 * list, so they cannot drift (the reason the list moved out of
 * `ConsumerDetailPage` this round).
 *
 * ── Input formats (the "best industry practice" pass) ────────────────────
 *
 * Numbers are `type="text" inputmode="numeric"`, not `type="number"`: the
 * numeric keypad still comes up on a phone, but there is no spinner to nudge
 * a value by accident, no scroll-wheel silently changing an answer under the
 * pointer, and no `e`/`+`/`-` characters a number field legally accepts —
 * all three are documented failure modes for older, less digitally literate
 * users, which is exactly this portal's audience note. Non-digits are
 * stripped on input rather than rejected on submit.
 *
 * Times are native `type="time"`: iOS and Android hand these to their own
 * wheel/clock pickers, which is the most familiar, largest-target time entry
 * this audience has; desktop browsers render segmented HH:MM fields matching
 * the frame's own "HH : MM" placeholder. The data model stores the diary's
 * paper-format "h:mm am/pm" strings, so values convert on submit
 * (`to12Hour`), never in the field.
 *
 * ── Motion ────────────────────────────────────────────────────────────────
 *
 * Only the question block animates. The chrome a reader anchors on — header,
 * progress row, Back/Next — never moves, so the eye has a fixed frame around
 * the change (the same reasoning as the module player's persistent footer).
 * Steps slide in the direction of travel (Next: in from the right; Back: in
 * from the left) with the answer rows staggering a beat behind the question,
 * and the progress fill runs on a spring. Everything collapses to a plain
 * crossfade under `prefers-reduced-motion`.
 *
 * Focus moves to the incoming question's heading on every step change —
 * announced step changes rather than silence is this project's
 * most-repeated defect class, fixed here the same way `SlideLayout` does it.
 */

/* ------------------------------------------------------------------------ */
/* Constants                                                                 */
/* ------------------------------------------------------------------------ */

/** The 9 directly-answered questions, in order — the questionnaire's steps. */
const QUESTIONS = SLEEP_DIARY_QUESTIONS.filter(
  (q): q is SleepDiaryQuestion & { field: keyof SleepDiaryAnswers } => !q.computed && !!q.field,
)

/** This portal's own pill CTA (Home's `CTA` constant, duplicated classes —
 *  same geometry: 48px pill, `text-body-md`). */
const CTA =
  'flex h-12 items-center justify-center rounded-3xl px-5 text-body-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2'

const CTA_PRIMARY = `${CTA} bg-consumer-primary text-white`
const CTA_OUTLINE = `${CTA} border-2 border-consumer-primary bg-white text-consumer-primary`

/** "22 July 2026" — the welcome line's date, from the app's frozen demo
 *  `TODAY` (the date the store writes the answers under), not the real
 *  clock. Displaying one date and saving under another is the two-surfaces
 *  disagreement this file is otherwise built to avoid. */
const DIARY_DATE = formatDateLong(TODAY).split(', ')[1]

/** "HH:MM" (a native time input's value) -> the diary's own "h:mm am/pm". */
function to12Hour(value: string): string {
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const meridiem = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${meridiem}`
}

type Stage = 'welcome' | 'questions' | 'done'
type Who = 'patient' | 'carer'
type Draft = Record<Who, Partial<Record<keyof SleepDiaryAnswers, string>>>

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
        `top: -160` is that page -64 less the 96px header this renders below.
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
        style={{ left: '50%', transform: 'translateX(-50%)', width: '100vw', height: 470, top: -160 }}
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
const ACTIVE_SCALE = 1.08
const ACTIVE_TRANSITION = { type: 'spring' as const, stiffness: 300, damping: 24 }
/**
 * Growth is anchored to the box's LEFT edge, not its centre (direct
 * instruction: "left align it for mobile and tablet so that it does not get
 * cropped out of screen").
 *
 * Centre-origin grows both ways, and on a phone the row has no room on the
 * right — the field ran past the column and the step's `overflow-x-clip` cut
 * it off. Anchoring left means the extra width only ever goes into the slack
 * that the fixed field widths below deliberately leave there.
 */
const ACTIVE_ORIGIN = 'left center'
/**
 * The numeric field's base width at each breakpoint, so the `min` label can be
 * pushed by exactly the amount the box grows.
 *
 * `scale` is a transform: it paints the box larger without reflowing anything,
 * so the unit sitting beside it stayed put and the enlarged field ran
 * underneath it. Translating the unit by the same delta keeps the pair
 * together and still costs no layout. Only the numeric questions have a unit —
 * the time fields have nothing to displace.
 */
const NUMBER_FIELD_W = { base: 136, sm: 208 }
const unitShiftFor = (wide: boolean) => (ACTIVE_SCALE - 1) * (wide ? NUMBER_FIELD_W.sm : NUMBER_FIELD_W.base)

/**
 * Selected state is a SOLID STROKE, not a filled box (direct correction: "when
 * I said solid blue state, I ment the outline stroke not the entire white
 * field"). A first pass filled the whole field purple with white text; the
 * field stays white and only its outline thickens.
 *
 * Both states keep the same full-strength `consumer-primary` border colour and
 * differ only in weight. Fading the idle border instead would have put the
 * field's only boundary under the 3:1 that a graphical indicator needs —
 * `consumer-primary/40` on white measures about 2.3:1.
 */
const FIELD_BASE =
  'min-h-11 rounded-lg border-consumer-primary bg-white text-center text-[22px] leading-[1.3] font-medium text-ink outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 px-2 py-2 sm:py-3.5'
const FIELD_ACTIVE = 'border-[3px]'
const FIELD_IDLE = 'border sm:border-2'

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
/* Welcome + thank-you (one hero layout, two contents)                       */
/* ------------------------------------------------------------------------ */

function HeroScreen({
  mascotClassName,
  title,
  children,
  headingRef,
}: {
  mascotClassName: string
  title: string
  children: React.ReactNode
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  return (
    // The canvas is `purple-50`, so this has to reach the fold or the app's
    // own warm `--background` shows as a cream block under it. Same rule the
    // questions step uses, and the same paired breakpoint: `ConsumerHeader` is
    // 96px only at `min-[1200px]`, below which its tab row makes it 157px.
    <div className="relative flex min-h-[calc(100dvh-157px)] flex-col items-center px-6 pb-16 min-[1200px]:min-h-[calc(100dvh-96px)]">
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
      <div className="relative mt-12 sm:mt-20">
        <DiaryMascot className={mascotClassName} />
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

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

export function ConsumerDiaryPage() {
  const { dyadId } = useParams()
  const navigate = useNavigate()
  const { consumerDyads, submitSleepDiary } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)

  const [stage, setStage] = useState<Stage>('welcome')
  const [qIndex, setQIndex] = useState(0)
  /** +1 = travelling forward (Next), -1 = back — steers the slide direction. */
  const [direction, setDirection] = useState(1)
  const [draft, setDraft] = useState<Draft>({ patient: {}, carer: {} })
  const [showHint, setShowHint] = useState(false)
  /** Round 44 left the X discarding answers with no confirmation (§87.6). */
  const [exitOpen, setExitOpen] = useState(false)
  const exitButtonRef = useRef<HTMLButtonElement | null>(null)

  /** Drives `unitShiftFor` — the numeric field's base width changes at `sm`,
   *  and the unit has to travel by whatever that field actually grows. A media
   *  query rather than a Tailwind class, because this feeds a `framer-motion`
   *  animation target rather than CSS. */
  const [wideField, setWideField] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const sync = () => setWideField(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const reducedMotion = useReducedMotion()

  const headingRef = useRef<HTMLHeadingElement | null>(null)

  // Focus the incoming step's heading on every stage/step change. An effect,
  // not rAF — rAF is throttled in a hidden/preview tab (Round 30's fix).
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [stage, qIndex])

  const members = useMemo(() => {
    if (!dyad) return []
    const rows: { who: Who; name: string }[] = []
    if (dyad.patient) rows.push({ who: 'patient', name: dyad.patient.name.split(' ')[0] })
    rows.push({ who: 'carer', name: dyad.carer.name.split(' ')[0] })
    return rows
  }, [dyad])

  if (!dyad) return <Navigate to="/consumer" replace />

  const question = QUESTIONS[qIndex]
  const total = QUESTIONS.length
  const isFirst = qIndex === 0
  const isLast = qIndex === total - 1

  const answersFor = (who: Who, field: keyof SleepDiaryAnswers) => draft[who][field] ?? ''
  const setAnswer = (who: Who, field: keyof SleepDiaryAnswers, value: string) => {
    setShowHint(false)
    setDraft((prev) => ({ ...prev, [who]: { ...prev[who], [field]: value } }))
  }

  /** Every present member has a non-empty answer for the current question. */
  const stepComplete = members.every((m) => answersFor(m.who, question.field).trim() !== '')

  const goHome = () => navigate(`/consumer/${dyad.id}`)

  const next = () => {
    if (!stepComplete) {
      // The button stays focusable (`aria-disabled`, not `disabled`) so the
      // reason it does nothing is discoverable; clicking it surfaces the hint.
      setShowHint(true)
      return
    }
    setShowHint(false)
    if (!isLast) {
      setDirection(1)
      setQIndex((i) => i + 1)
      return
    }
    // Finish: convert the drafts into the data model's own shapes and write
    // both members in one action.
    const build = (who: Who): SleepDiaryAnswers => {
      const read = (field: keyof SleepDiaryAnswers) => draft[who][field] ?? ''
      return {
        napMin: Number(read('napMin')),
        outOfSleepWindowMin: Number(read('outOfSleepWindowMin')),
        bedtime: to12Hour(read('bedtime')),
        sleepLatencyMin: Number(read('sleepLatencyMin')),
        wakeCount: Number(read('wakeCount')),
        awakeDuringNightMin: Number(read('awakeDuringNightMin')),
        outOfBedDuringNightMin: Number(read('outOfBedDuringNightMin')),
        wakeTime: to12Hour(read('wakeTime')),
        outOfBedTime: to12Hour(read('outOfBedTime')),
      }
    }
    submitSleepDiary(dyad.id, {
      patient: dyad.patient ? build('patient') : undefined,
      carer: build('carer'),
    })
    setStage('done')
  }

  const back = () => {
    if (isFirst) return
    setShowHint(false)
    setDirection(-1)
    setQIndex((i) => i - 1)
  }

  /* ── Motion variants ──────────────────────────────────────────────────── */

  // The step block slides in the direction of travel; under reduced motion it
  // crossfades in place. `custom` carries the direction so the exiting step
  // reads it at exit time, not the value it mounted with.
  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: reducedMotion ? 0 : 64 * dir }),
    center: {
      opacity: 1,
      x: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
        when: 'beforeChildren' as const,
        staggerChildren: reducedMotion ? 0 : 0.07,
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: reducedMotion ? 0 : -64 * dir,
      transition: { duration: 0.18, ease: 'easeIn' as const },
    }),
  }

  // Children (the question, then each answer row) rise a beat behind the
  // block, which is what makes the transition read as orchestrated rather
  // than one flat swap.
  const riseVariants = {
    enter: { opacity: 0, y: reducedMotion ? 0 : 16 },
    center: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 380, damping: 34 },
    },
    exit: { opacity: 0 },
  }

  const stageMotion = {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  /* ── Screens ──────────────────────────────────────────────────────────── */

  return (
    <ConsumerShell
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      // Purple/50, the diary frames' own canvas on all three screens — not
      // Home's warm radial. Padding is per-stage, so the shell contributes none.
      contentClassName="relative overflow-clip bg-purple-50 p-0"
      optedOut={dyad.optedOut}
    >
      <AnimatePresence mode="wait" initial={false}>
        {stage === 'welcome' && (
          <motion.div key="welcome" {...stageMotion}>
            <HeroScreen
              // 274px renders the art at the frames' own 263 (the export
              // carries 15px of shadow bleed: solid art is 373 of its 388).
              mascotClassName="w-[200px] sm:w-[274px]"
              title="Sleep Diary"
              headingRef={headingRef}
            >
              <p className="text-consumer-eyebrow text-ink">
                Fill in for <span className="font-medium">{DIARY_DATE}</span>
              </p>
              <p className="text-consumer-eyebrow mt-2 max-w-[644px] text-ink">
                This takes about 5 minutes and covers both of you. One of you can fill it in on
                behalf of you both. There are no right or wrong answers, just answer as honestly as
                you can.
              </p>
              {/* 56 + the parent's 8 = the frame's 64 (`812:11486`). Mobile
                  keeps its previous 32, which is enough on a 375px screen. */}
              <div className="mt-6 flex w-full max-w-[448px] flex-col gap-4 sm:mt-14">
                <button type="button" className={CTA_PRIMARY} onClick={() => setStage('questions')}>
                  Fill in Sleep Diary
                </button>
                <button type="button" className={CTA_OUTLINE} onClick={goHome}>
                  Go Back
                </button>
              </div>
            </HeroScreen>
          </motion.div>
        )}

        {stage === 'questions' && (
          <motion.div
            key="questions"
            {...stageMotion}
            // The column fills the viewport below the header so Back/Next rest
            // on the fold. `ConsumerHeader` is 96px only at `min-[1200px]` —
            // below that its tab row adds 61px (157 total), a real 61px
            // overshoot when this was a flat calc against 96 (measured at 375).
            className="mx-auto flex min-h-[calc(100dvh-157px)] w-full max-w-[1121px] flex-col px-6 pt-6 pb-6 sm:px-10 sm:pt-20 sm:pb-10 min-[1200px]:min-h-[calc(100dvh-96px)] xl:px-0"
          >
            {/* Progress row — persistent chrome, never animates with the step. */}
            <div className="flex items-center gap-6 sm:gap-14">
              <button
                type="button"
                ref={exitButtonRef}
                onClick={() => setExitOpen(true)}
                aria-label="Leave the sleep diary"
                // Black disc, white glyph (direct instruction), not the
                // purple-300 disc it shipped with — and a 24px glyph rather
                // than 16px, which read as a speck inside a 44px target.
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
              >
                <X className="size-6" strokeWidth={2} aria-hidden="true" />
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={total}
                  aria-valuenow={qIndex + 1}
                  aria-label={`Question ${qIndex + 1} of ${total}`}
                  className="relative h-[7px] flex-1 overflow-hidden rounded-3xl bg-purple-200 sm:h-[9px]"
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-3xl bg-consumer-primary"
                    initial={false}
                    animate={{ width: `${((qIndex + 1) / total) * 100}%` }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 210, damping: 28 }
                    }
                  />
                </div>
                <p aria-hidden="true" className="text-consumer-progress whitespace-nowrap text-ink">
                  {qIndex + 1} / {total}
                </p>
              </div>
            </div>

            {/* The animated step — question + answer rows. `popLayout` mounts
                the incoming step immediately, so the heading focus effect above
                always finds the element it is meant to land on. */}
            {/* 72px from the progress row to the question (direct
                instruction), down from 96. Mobile scales with it — 62 -> 48,
                the same ~25% cut — because a phone has less room above the
                fold, not more. */}
            <div className="relative flex flex-1 flex-col overflow-x-clip pt-12 sm:pt-[72px]">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                  key={qIndex}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex w-full flex-col sm:items-center"
                >
                  <motion.h1
                    ref={headingRef}
                    tabIndex={-1}
                    variants={riseVariants}
                    // `text-balance` — no orphans (standing rule). Q7 left
                    // "night?" alone on a second line; balancing evens the two
                    // lines instead of breaking one word early.
                    className="text-consumer-question w-full text-balance text-ink outline-none sm:text-center"
                  >
                    Q{qIndex + 1}. {question.label}
                  </motion.h1>
                  {/*
                    18px explainer (direct instruction). `consumer-eyebrow` is
                    already the portal's 18px step (clamped 16 -> 18), so this
                    adds no token.

                    It is `aria-describedby` on both inputs rather than a loose
                    paragraph: a screen-reader user tabbing straight into the
                    field would otherwise never hear it. Only rendered where a
                    question has one — Q5, Q8 and Q9 were called out as needing
                    none, and help under an already-clear question is noise.
                  */}
                  {question.help && (
                    <motion.p
                      id={`diary-help-${qIndex}`}
                      variants={riseVariants}
                      // 800, not 720: Q2's line measures 759px at 18px Inter,
                      // so the old clamp broke it one word early and left
                      // "sleep." alone on a second line. 800 fits the longest
                      // of the four explainers on one line and still holds a
                      // readable measure well inside the 1121px column.
                      className="text-consumer-eyebrow mt-3 w-full max-w-[800px] text-balance text-ink-muted sm:text-center"
                    >
                      {question.help}
                    </motion.p>
                  )}
                  <div className="mt-[70px] flex w-full flex-col gap-7 sm:mt-[72px] sm:items-center sm:gap-[52px]">
                    {/*
                      Whose turn it is. `members` is already PLE-then-carer, so
                      the first one without an answer is the one being asked —
                      which makes this derive from the answers themselves
                      rather than a second piece of state that could disagree
                      with them. Once both are filled nobody is emphasised, so
                      the pair settles rather than leaving the carer's box
                      permanently enlarged.
                    */}
                    {members.map((m) => {
                      const inputId = `diary-${m.who}-${question.field}`
                      const value = answersFor(m.who, question.field)
                      const activeWho = members.find((x) => !answersFor(x.who, question.field))?.who
                      const isActive = activeWho === m.who
                      return (
                        <motion.div
                          key={m.who}
                          variants={riseVariants}
                          className="flex w-full items-center gap-8 sm:w-auto"
                        >
                          <label
                            htmlFor={inputId}
                            className="text-consumer-answer-name w-[97px] shrink-0 text-ink"
                          >
                            {m.name}:
                          </label>
                          {question.kind === 'time' ? (
                            <motion.input
                              id={inputId}
                              type="time"
                              aria-describedby={question.help ? `diary-help-${qIndex}` : undefined}
                              value={value}
                              onChange={(e) => setAnswer(m.who, question.field, e.target.value)}
                              animate={reducedMotion ? undefined : { scale: isActive ? ACTIVE_SCALE : 1 }}
                              transition={ACTIVE_TRANSITION}
                              style={{ transformOrigin: ACTIVE_ORIGIN }}
                              // `w-[172px] flex-none` on a phone rather than
                              // `flex-1`: a field that already fills the row
                              // has nowhere to grow into. This leaves ~26px of
                              // trailing slack for the 8% emphasis.
                              className={cn(
                                FIELD_BASE,
                                isActive ? FIELD_ACTIVE : FIELD_IDLE,
                                // `w-[172px] flex-none` on a phone rather than
                                // `flex-1`: a field that already fills the row
                                // has nowhere to grow into.
                                'w-[172px] flex-none sm:w-[208px]',
                              )}
                            />
                          ) : (
                            <div className="flex min-w-0 flex-1 items-center gap-4 sm:flex-none">
                              <motion.input
                                id={inputId}
                                type="text"
                                aria-describedby={question.help ? `diary-help-${qIndex}` : undefined}
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="Approx."
                                animate={reducedMotion ? undefined : { scale: isActive ? ACTIVE_SCALE : 1 }}
                                transition={ACTIVE_TRANSITION}
                                style={{ transformOrigin: ACTIVE_ORIGIN }}
                                value={value}
                                onChange={(e) =>
                                  setAnswer(
                                    m.who,
                                    question.field,
                                    // Digits only — stripped on input, not
                                    // rejected on submit (see doc comment).
                                    e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                                  )
                                }
                                className={cn(
                                  FIELD_BASE,
                                  isActive ? FIELD_ACTIVE : FIELD_IDLE,
                                  'w-[136px] min-w-0 flex-none sm:w-[208px]',
                                )}
                              />
                              <motion.span
                                className="text-consumer-unit shrink-0 text-consumer-primary"
                                animate={
                                  reducedMotion
                                    ? undefined
                                    : { x: isActive ? unitShiftFor(wideField) : 0 }
                                }
                                transition={ACTIVE_TRANSITION}
                              >
                                {question.unit}
                              </motion.span>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* The incomplete-step hint — appears only after Next is pressed
                  with an answer missing; a live region so it is announced. */}
              <div aria-live="polite" className="mt-6 min-h-6 text-center">
                {showHint && (
                  <p className="text-consumer-eyebrow text-consumer-primary">
                    Please fill in an answer for{' '}
                    {members.length === 2 ? 'both of you' : 'this question'} before moving on.
                  </p>
                )}
              </div>
            </div>

            {/* Back / Next — persistent chrome. Back on the first question is
                aria-disabled (direct instruction), never removed: a control
                that vanishes and reappears as you travel reads as a bug. */}
            <div className="mt-8 flex w-full items-start gap-6 sm:gap-28">
              <button
                type="button"
                onClick={back}
                aria-disabled={isFirst}
                className={cn(CTA_OUTLINE, 'flex-1', isFirst && 'cursor-default opacity-40')}
              >
                Back
                {isFirst && <span className="sr-only"> (not available on the first question)</span>}
              </button>
              <button
                type="button"
                onClick={next}
                aria-disabled={!stepComplete}
                className={cn(CTA_PRIMARY, 'flex-1', !stepComplete && 'opacity-70')}
              >
                {isLast ? 'Finish' : 'Next'}
                {!stepComplete && <span className="sr-only"> (answer this question first)</span>}
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done" {...stageMotion}>
            <HeroScreen
              // Frames `811:10934` / `816:12478` draw the mascot at an
              // IDENTICAL 263 art width on both screens, so this now matches
              // the welcome screen. That reverses Round 44's own direct
              // instruction ("Desktop thank you screen avatar is a little
              // bigger", which put it at 388) — the newer frames win, but it
              // is a deliberate reversal rather than drift.
              mascotClassName="w-[220px] sm:w-[274px]"
              title="Thank you for filling in today's sleep diary"
              headingRef={headingRef}
            >
              <p className="text-consumer-eyebrow mt-2 max-w-[644px] text-ink">
                Remember to complete your lesson of the week, if not done already. We will see you
                again tomorrow to fill in the sleep diary.
              </p>
              <div className="mt-6 flex w-full max-w-[448px] flex-col sm:mt-14">
                <button type="button" className={CTA_PRIMARY} onClick={goHome}>
                  Go Back Home
                </button>
              </div>
            </HeroScreen>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        Exit confirmation — closes §87.6's first open item ("the X exit button
        discards answers without confirming").

        It sits OUTSIDE the `AnimatePresence` on purpose: the step blocks mount
        and unmount as the questionnaire advances, and a dialog owned by one of
        them would be torn down mid-transition.

        Copy is deliberately not "Are you sure?" — both buttons name their own
        outcome, so nobody has to work out which one loses their answers, and
        the second sentence says the diary can be filled in again later. For an
        audience living with dementia, an unexplained loss reads as a mistake
        they cannot undo; saying it is repeatable is what makes leaving a
        normal choice rather than an alarming one.
      */}
      <ConfirmDialog
        open={exitOpen}
        title="Leave the sleep diary?"
        body="Your answers will not be saved. You can fill in the sleep diary again later today."
        confirmLabel="Leave without saving"
        cancelLabel="Keep filling it in"
        // Red (direct instruction). Losing typed answers is the consequential
        // path, and the error tone is what separates it at a glance from the
        // outline "Keep filling it in" beside it.
        destructive
        onConfirm={goHome}
        onClose={() => setExitOpen(false)}
      />
    </ConsumerShell>
  )
}
