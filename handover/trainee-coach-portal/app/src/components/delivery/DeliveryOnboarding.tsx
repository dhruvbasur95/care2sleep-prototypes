import { useCallback, useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  BLOB_H,
  BLOB_PATH,
  BLOB_STROKE,
  BLOB_STROKE_W,
  BLOB_W,
} from '@/components/delivery/blobFrame'
import { PATHWAY_STAGE_COUNT_WORD, PATHWAY_STAGE_SENTENCE } from '@/data/coachPathway'
import { Doodles } from '@/components/delivery/Doodles'

/**
 * Coach Delivery Portal first-run onboarding (Figma `621:8679` — the four
 * `OnboardingScreens` variants: Default / Variant2 / Variant3 / Variant4).
 *
 * Round 29 built this as an 817x544 card with a flat `purple-200` art band.
 * The frames replace that entirely: **there is no card**. Artwork, copy and the
 * CTA row sit directly on the page canvas, and `DeliveryShell` no longer mounts
 * the sidebar while the flow runs, so this screen is the only thing on it.
 *
 * The frames also drop the pagination dots and Skip. Back returns from screen 2
 * onward. The `sr-only` "Step N of 4" line survives because with the dots gone
 * it is the only carrier of position for a screen reader.
 *
 * ## The artwork, and why it is one asset rather than twelve
 *
 * Three photo cards sit in a row under a fixed doodle layer. Figma exports each
 * card at each screen as its own blob — but the exports are all the same shape:
 * every card's aspect is 1.26288, and every outline's stroke width is exactly
 * 0.022642 of its own width, so the stroke thickness is already proportional.
 * One SVG scaled therefore reproduces all of them, outline weight included.
 *
 * That matters for more than tidiness. The middle card **grows** between screen
 * 2 and 3 (1.209x -> 1.337x). Swapping between two exported assets mid-flight
 * is a hard cut; scaling one element is continuous, which is what lets the size
 * change animate at all.
 *
 * ## Alignment
 *
 * Every inner offset is `BASE` times the card's scale, so the photo's mask stays
 * locked to its outline at *every* intermediate value of the animation, not just
 * at the four resting states. This is deliberate: Figma's own `mask-position`
 * values do not scale with the card, and following them literally is what put
 * screen 1's middle card ~19px out of register with its own outline.
 *
 * Assets are real Figma exports committed to `public/illustrations/onboarding/`,
 * the same committed-asset path Round 23 used for the certificate and Round 28
 * for the enrolment illustrations. The photo is the same dummy image on all
 * three cards (direct instruction), committed resampled from 8.4MB to 533x800.
 */

const ART = '/illustrations/onboarding'

/**
 * The smallest card's geometry, transcribed from `621:8649`. Every other card
 * on every screen is this times a scale factor — verified against all four
 * frames, where each derived value lands within 0.01px of the export.
 */
const BASE = {
  innerW: 192.259, innerH: 153.44,
  backBoxW: 188.808, backBoxH: 153.44, backW: BLOB_W, backH: BLOB_H,
  strokeX: 6.84, strokeY: 8.06,
  /** The photo's size and offset **inside the frame's own viewBox**, which keeps
   *  the frames' crop: the source image is taller than the card and the subject
   *  sits high in it. */
  imgW: 215.789, imgH: 323.645, imgX: -18.51, imgY: -46.9,
}

/**
 * A collective reduction of the whole artwork block — all three cards and the
 * doodle layer — applied on top of the frames' own per-card scales (direct
 * instruction: "scale this section down by 1.5x", then eased back a step when
 * 1.5 read as too small — the divisor is the one number to nudge).
 *
 * It multiplies into each card's `scale`, and each card's bounding box is
 * derived from that same scaled size, so the block's **layout** height shrinks
 * with it rather than only its painted size. That is the point: a plain
 * `transform: scale()` on the container would leave the original box behind and
 * the copy and CTAs would not move up.
 *
 * Because it rides the same transform every layer already shares, the mask stays
 * registered with its outline exactly as it does at 1x.
 */
const ART_SCALE = 1 / 1.25

/** The four card sizes the frames use, as multiples of `BASE`. */
const SIZE = {
  sm: 152.489 / 180.762,
  md: 1,
  lg: 218.455 / 180.762,
  xl: 241.711 / 180.762,
}

/**
 * A rotated box's own bounding box — what the frame calls the card wrapper.
 * Derived rather than transcribed: the wrapper has to resize continuously as
 * the rotation animates, and this reproduces all twelve frame values exactly
 * (e.g. 192.259x153.44 at 5deg scaled 1.209 -> 247.62x204.98, frame 247.623x204.98).
 */
function boundingBox(w: number, h: number, deg: number) {
  const rad = (Math.abs(deg) * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return { width: w * cos + h * sin, height: w * sin + h * cos }
}

interface CardState {
  rotate: number
  scale: number
  /** Frames 3 and 4 overlap the cards by 8px where 1 and 2 space them by 16px.
   *  A negative `gap` is invalid CSS, so the frames put it on the child. */
  marginRight: number
}

/**
 * Nudges the leading card left without moving the other two (direct
 * instruction: "move this pillow image to left subtly so the three images
 * balance out visually").
 *
 * Applied as `-OFFSET` left and `+OFFSET` right on the same element, so the
 * row's total width is unchanged and the flex centring does not shift the whole
 * group in compensation — which is what a plain margin would have done, moving
 * all three to fix one.
 */
const LEAD_CARD_NUDGE = 12

interface Screen {
  node: string
  title: string
  body: string
  /** An optional second line below the body, at `body-md`. */
  note?: string
  cards: [CardState, CardState, CardState]
}

/** Screens 3 and 4 share their artwork exactly — only copy and the CTA differ. */
const SETTLED: [CardState, CardState, CardState] = [
  { rotate: 5.57, scale: SIZE.md, marginRight: -8 },
  { rotate: -4.1, scale: SIZE.xl, marginRight: -8 },
  { rotate: 2.93, scale: SIZE.sm, marginRight: 0 },
]

const SCREENS: Screen[] = [
  {
    node: '621:8678',
    title: 'Welcome to Care2Sleep',
    body: 'You are embarking on a journey to become a certified sleep coach. Together, we will support people living with dementia and their carers in achieving better, healthier sleep.',
    cards: [
      { rotate: -1, scale: SIZE.md, marginRight: 16 },
      { rotate: 5, scale: SIZE.lg, marginRight: 16 },
      { rotate: -2, scale: SIZE.sm, marginRight: 0 },
    ],
  },
  {
    node: '621:8680',
    // Frame: "The COACH Training Pathway". Sentence case per CLAUDE.md; COACH
    // stays capitalised because it is the framework's acronym.
    title: 'The COACH training pathway',
    // "real families" -> "real clients" on direct instruction. This is a coach-
    // facing surface, so "client" is the correct term under the split
    // terminology rule (see CLAUDE.md): researcher-facing copy says consumer,
    // coach-facing copy says client. Same people, different audience.
    // Count and stage names are both derived from the pathway the dashboard's
    // own rail draws. The frame's copy named five stages, and named a different
    // five than exist ("active simulation", "community feedback"), against a
    // rail of six — the recurring "authored instead of derived" defect.
    body: `You will progress through ${PATHWAY_STAGE_COUNT_WORD} developmental stages: ${PATHWAY_STAGE_SENTENCE}, all designed to build your skills and confidence before you meet real clients.`,
    cards: [
      { rotate: 5.57, scale: SIZE.md, marginRight: 16 },
      { rotate: -4.1, scale: SIZE.lg, marginRight: 16 },
      { rotate: 2.93, scale: SIZE.sm, marginRight: 0 },
    ],
  },
  {
    node: '621:8779',
    // Frame: "Coaching Your Clients". Sentence case per CLAUDE.md's copy rule;
    // "clients" is correct here — this is coach-facing, and the frame had it
    // right. An earlier pass changed it to "consumers" against the then-global
    // ban on "client", which the split terminology rule has since replaced.
    title: 'Coaching your clients',
    body: 'Once certified, you will be assigned real clients via your live delivery portal. You will support them online through a structured 7-session SPACES programme, starting with an onboarding session followed by six interactive sleep modules.',
    cards: SETTLED,
  },
  {
    node: '621:8814',
    title: 'Explore your dashboard',
    body: 'Click below to enter your dashboard, take a quick orientation tour, and get yourself familiar.',
    note: 'Good luck.',
    cards: SETTLED,
  },
]

/**
 * The tallest the card row ever gets, across all four screens. The row is pinned
 * to this so the copy and CTAs below it do not ride up and down as the middle
 * card grows between screens 2 and 3 (direct instruction: keep their position
 * fixed). Derived from the same `boundingBox` the cards lay themselves out with,
 * so it cannot fall out of step with them.
 */
const ART_BLOCK_H = Math.max(
  ...SCREENS.flatMap((s) =>
    s.cards.map((c) => {
      const k = c.scale * ART_SCALE
      return boundingBox(BASE.innerW * k, BASE.innerH * k, c.rotate).height
    }),
  ),
)

/** Entrance delays for the three cards on screen 1 (direct instruction: "very
 *  subtle pop in randomly"). Deliberately irregular and out of left-to-right
 *  order — an even stagger reads as a mechanical sweep — but fixed rather than
 *  randomised, so the flow looks the same every load and in every screenshot. */
const POP_IN_DELAYS = [0.14, 0.02, 0.26]

function PhotoCard({
  state,
  transition,
  popIn,
  nudge = 0,
}: {
  state: CardState
  transition: Record<string, unknown>
  /** Entrance delay in seconds, or `null` for no entrance. */
  popIn: number | null
  /** Shift this card left by this many px without moving its siblings. */
  nudge?: number
}) {
  // The delay must apply to the entrance and nothing after it, or every later
  // screen change would sit waiting on it too.
  const [popped, setPopped] = useState(popIn === null)
  // `useId` rather than an index: two cards must never share a clipPath id, and
  // ids are global to the document.
  const clipId = `blob-clip-${useId()}`
  const scale = state.scale * ART_SCALE
  const box = boundingBox(BASE.innerW * scale, BASE.innerH * scale, state.rotate)

  return (
    <motion.div
      className="flex shrink-0 items-center justify-center"
      // The inter-card gap scales with the cards, so the row keeps the frames'
      // spacing-to-card ratio instead of looking loosely spread at the new size.
      animate={{
        ...box,
        marginLeft: -nudge,
        marginRight: state.marginRight * ART_SCALE + nudge,
      }}
      initial={false}
      transition={transition}
    >
      {/* Rotation and scale ride on one transform, so the layers below keep
          their register with each other throughout the animation.

          The pop-in multiplies into that same transform: entering at 0.86 of the
          card's own scale rather than a flat 0.86, so a card never overshoots
          the size it is settling to. */}
      <motion.div
        className="relative"
        style={{ width: BASE.innerW, height: BASE.innerH }}
        initial={popIn === null ? false : { opacity: 0, scale: scale * 0.86, rotate: state.rotate }}
        animate={{ rotate: state.rotate, scale, opacity: 1 }}
        onAnimationComplete={() => setPopped(true)}
        transition={
          popped
            ? transition
            : { ...transition, delay: popIn ?? 0, opacity: { duration: 0.34, delay: popIn ?? 0 } }
        }
      >
        {/* White sheet, rotated a further 3.35deg so it peeks out from under the
            photo on two edges — the "stacked polaroid" tilt. */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center"
          style={{ width: BASE.backBoxW, height: BASE.backBoxH }}
        >
          <img
            src={`${ART}/blob-back.svg`}
            alt=""
            aria-hidden="true"
            style={{ width: BASE.backW, height: BASE.backH, transform: 'rotate(3.35deg)' }}
          />
        </div>

        {/* Photo and purple stroke in ONE svg, both off `BLOB_PATH`.
            Direct instruction: "add stroke to the image instead of overlaying a
            separate vector of the same shape — we keep struggling with mapping
            the stroke." Nothing to map any more: the clip and the stroke are the
            same `d` in the same viewBox, so they cannot disagree.

            `overflow: visible` because the stroke is centred on the path and its
            outer half would otherwise be clipped by the viewBox edge. */}
        <svg
          className="absolute"
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${BLOB_W} ${BLOB_H}`}
          style={{
            left: BASE.strokeX,
            top: BASE.strokeY,
            width: BASE.backW,
            height: BASE.backH,
            overflow: 'visible',
          }}
        >
          <defs>
            <clipPath id={clipId}>
              <path d={BLOB_PATH} />
            </clipPath>
          </defs>
          {/* `slice` is SVG's `object-fit: cover`. */}
          <image
            href={`${ART}/photo.jpg`}
            x={BASE.imgX}
            y={BASE.imgY}
            width={BASE.imgW}
            height={BASE.imgH}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
          <path
            d={BLOB_PATH}
            fill="none"
            stroke={BLOB_STROKE}
            strokeWidth={BLOB_STROKE_W}
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  )
}

/** Frame `621:8676` etc. Per CLAUDE.md the frame decides where a button goes and
 *  what it says; the app decides how it looks. These are the canonical primary
 *  filled / primary outline pills at the frame's own 240px width. */
/** Where the final slide's CTA lands the coach — Home, the "dashboard" its own
 *  label names (direct instruction). */
const HOME_PATH = '/delivery'

const PILL =
  'h-9 w-60 shrink-0 rounded-full text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring'

/** Rise-and-fade for the title and the copy beneath it. `y` is small on purpose:
 *  Round 32's tour found that most of what reads as "springy" is travel plus a
 *  sharp curve, not duration, and 10px over a symmetric ease reads as smooth. */
const textRise = {
  out: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
}

/**
 * The final CTA plays the flow off the screen before handing over (direct
 * instruction: fade out, and *while* fading, scale the artwork down, fade the
 * copy, drop the buttons — then let the dashboard appear).
 *
 * The three parts leave on their own clocks rather than as one block: the
 * buttons go first and quickest (they are what was just clicked, so leaving
 * them behind reads as the click not registering), the copy follows, and the
 * artwork shrinks across the whole exit so there is still something moving
 * when the rest has gone.
 */
const EXIT_MS = 820

export function DeliveryOnboarding({
  onComplete,
}: {
  /** Called with a path to navigate to, or nothing to just reveal this page. */
  onComplete: (to?: string) => void
}) {
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)
  const reduceMotion = useReducedMotion()
  const screen = SCREENS[step]
  const isFirst = step === 0
  const isLast = step === SCREENS.length - 1

  const leave = useCallback(
    (to?: string) => {
      if (reduceMotion) {
        onComplete(to)
        return
      }
      setExiting(true)
      window.setTimeout(() => onComplete(to), EXIT_MS)
    },
    [onComplete, reduceMotion],
  )

  // A callback ref rather than an effect: React invokes it synchronously on
  // mount, where an effect scheduled against an exiting element can fire against
  // a stale node. Keyed on `step` so identity changes exactly once per screen,
  // which is what makes it re-fire.
  //
  // Moving focus here is what announces the new screen. This project's most
  // repeated defect is focus falling to `<body>` when the control that caused a
  // change unmounts, and Back does exactly that on the way to screen 1.
  const focusHeading = useCallback((el: HTMLHeadingElement | null) => {
    el?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // The artwork settles rather than snapping; the copy is a quicker crossfade so
  // it has resolved by the time the cards stop moving.
  const artTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 90, damping: 16, mass: 0.9 }
  // Softened on direct instruction ("make it more subtle"): the travel drops
  // 8px -> 3px and the curve moves off `easeOut` — which front-loads its speed
  // and reads as a dart — onto the symmetric `[0.4, 0, 0.2, 1]` Round 32 landed
  // on for the tour after the same "too springy" note. Slightly longer, because
  // a smaller move over a longer time is what reads as subtle.
  const textTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const }

  return (
    <div
      // Frame `621:8678`: 80px between the artwork and the text block, 112px
      // side gutters. The top inset came down from the frame's own 152px across
      // four direct instructions (152 -> 120 -> 96 -> 72 -> 48), to stop the CTA
      // sitting so low on the screen. Note 48 here paints as a 72px gap below
      // the header: `DeliveryShell`'s own 24px inset sits above this box.
      // The copy block carries its own 40px below it (`pb-10`) rather than the
      // row using a second gap, because the copy and the CTA row must stay a
      // fixed distance apart while the copy block's height is pinned by its
      // sizers.
      //
      // The artwork-to-copy gap is 48px, down from the frame's 80px: pinning the
      // card row to its tallest state (so nothing below it moves) reserves the
      // height of screens 3-4's larger middle card on every screen, which pushed
      // the CTA down. Continues the same downward tuning the top inset already
      // went through (152 -> 120 -> 96 -> 72 -> 48).
      className="flex min-h-[calc(100dvh-3rem-48px)] flex-col items-center gap-12 px-28 pt-12 pb-6"
      role="region"
      aria-label={`Welcome to Care2Sleep, step ${step + 1} of ${SCREENS.length}`}
      data-node-id={screen.node}
    >
      {/* Pinned to the tallest the row ever gets, so the middle card growing
          between screens 2 and 3 does not push the copy and CTAs down. */}
      {/* The artwork shrinks as it goes, across the full exit — the slowest of
          the three parts, so the screen still has movement in it once the copy
          and buttons have gone. */}
      <motion.div
        className="relative flex shrink-0 items-center justify-center"
        style={{ height: ART_BLOCK_H }}
        animate={{ scale: exiting ? 0.78 : 1, opacity: exiting ? 0 : 1 }}
        transition={{ duration: exiting ? EXIT_MS / 1000 : 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {screen.cards.map((state, i) => (
          <PhotoCard
            key={i}
            state={state}
            transition={artTransition}
            // Only screen 1 pops in — it is the flow's entrance. Later screens
            // are already on stage and simply rearrange.
            popIn={reduceMotion ? null : POP_IN_DELAYS[i]}
            nudge={i === 0 ? LEAD_CARD_NUDGE : 0}
          />
        ))}

        {/* Stars, sparkles and clouds as one 700x251 layer centred over all
            three cards. The frames export a doodle layer per screen and all four
            files are byte-identical, so the layer's *position* is fixed — but
            individual doodles now rotate a few degrees on each screen change,
            which is why this is a component rather than the `<img>` it was. */}
        <Doodles
          step={step}
          transition={artTransition}
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
          style={{ width: 700.023 * ART_SCALE, height: 251.081 * ART_SCALE }}
        />
      </motion.div>

      {/* The copy block is a single grid cell holding every screen's text at
          once: the three inert copies are invisible and size the cell to the
          tallest screen, so the CTA row below never moves as the body changes
          length (direct instruction: keep the text container and the buttons at
          a fixed position).

          Sized this way rather than with a fixed px height because the number
          depends on where the copy wraps, which changes with viewport width —
          a magic number would only be correct at one size. */}
      <motion.div
        className="grid w-full shrink-0 justify-items-center pb-10"
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: exiting ? 0.34 : 0.3, delay: exiting ? 0.06 : 0, ease: 'easeOut' }}
      >
        {SCREENS.map((s, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="invisible col-start-1 row-start-1 flex w-full flex-col gap-2 text-center"
          >
            {/* These must carry the SAME classes as the live title and copy
                below, `text-balance` included — without it the title wraps to
                two lines here and one there, and the block reserves a phantom
                line that pushes the CTA row down. */}
            <p className="text-display-lg text-balance">{s.title}</p>
            <p className="text-sub-greeting text-balance leading-[1.4]">{s.body}</p>
            {s.note && <p className="text-body-md">{s.note}</p>}
          </div>
        ))}

        <AnimatePresence mode="wait" initial={false}>
          {/* Title leads, copy follows one beat behind (direct instruction).
              Both rise into place rather than the block moving as one. */}
          <motion.div
            key={step}
            className="col-start-1 row-start-1 flex w-full flex-col gap-2 self-start text-center text-ink"
            initial="out"
            animate="in"
            exit="out"
            variants={{ in: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.h1
              ref={focusHeading}
              tabIndex={-1}
              className="text-display-lg text-balance outline-none"
              variants={textRise}
              transition={textTransition}
            >
              {screen.title}
            </motion.h1>
            {/* `sub-greeting` is 18/400, matching the frame's own named style —
                but the frame sets its line height to 1.4 where this app's token
                is `normal` (~1.21). Applied locally rather than moving the
                token, which every portal hero sub-line also reads. */}
            <motion.p
              className="text-sub-greeting text-balance leading-[1.4]"
              variants={textRise}
              transition={textTransition}
            >
              {screen.body}
            </motion.p>
            {screen.note && (
              <motion.p className="text-body-md" variants={textRise} transition={textTransition}>
                {screen.note}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="flex w-full shrink-0 flex-col items-center gap-10">

        <p className="sr-only" role="status">
          Step {step + 1} of {SCREENS.length}
        </p>

        {/* Frame gap is 24px. Back is absent on screen 1.
            On the way out these go first and fastest — leaving the button the
            coach just pressed sitting there while everything else leaves reads
            as the press not having registered. */}
        <motion.div
          className="flex shrink-0 items-center gap-6"
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: exiting ? 0.2 : 0.3, ease: 'easeOut' }}
        >
          {!isFirst && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={exiting}
              className={cn(PILL, 'border border-primary bg-card text-primary hover:bg-primary/10')}
            >
              {/* Frame says "Go Back"; sentence case per CLAUDE.md's copy rule. */}
              Go back
            </button>
          )}
          <button
            type="button"
            // "Go to My Dashboard" navigates to Home **explicitly**, rather
            // than calling `onComplete()` with no path.
            //
            // The no-path version only reveals whatever page the flow was
            // covering, and this flow covers *every* `/delivery` page — every
            // one of them mounts its own `DeliveryShell`. So arriving on
            // `/delivery/learning` and finishing the welcome landed the coach on
            // My Learning, which is not what the button says. Naming the
            // destination makes it true from wherever the flow was entered.
            onClick={() => (isLast ? leave(HOME_PATH) : setStep((s) => s + 1))}
            disabled={exiting}
            className={cn(PILL, 'bg-primary text-white hover:bg-primary-hover')}
          >
            {isLast ? 'Go to my dashboard' : 'Go next'}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
