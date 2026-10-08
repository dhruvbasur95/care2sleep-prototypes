import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MotionValue } from 'framer-motion'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Z_CYCLE_S,
  Z_LAYERS,
  Z_PATH,
  Z_TIMES,
} from '@/components/consumer/ConsumerCanvasWave'

/**
 * Consumer Portal first-run welcome screen — Figma frame `748:878`
 * (`Home_trainee_1`; the node name is the designer's, the screen is the
 * consumer's).
 *
 * The same shape as the trainee's own welcome flow (`DeliveryOnboarding`,
 * Round 34): artwork, one heading, one line of copy, one CTA, on the plain
 * canvas with no card and no side nav. It is deliberately NOT built on that
 * component — this is one screen, not four, with a different canvas, a
 * different brand purple and a full-width illustration behind the artwork
 * rather than a photo card. Sharing the chassis would mean adding flags to
 * switch off most of what makes `DeliveryOnboarding` correct for the trainee.
 *
 * Measurements are frame-exact and transcribed, not eyeballed:
 *   content area   1121px wide (1281 - 2x80 padding), 80 top / 112 bottom
 *   mascot         207.645 x 185, centred, 16px below the content top
 *   mascot -> copy 104px
 *   heading        display-lg  (Inter 40 / 500 / normal) #1a1a1a
 *   copy           consumer-lead (Inter 20 / 400 / 1.3)  #1a1a1a
 *   heading -> copy 8px, copy -> CTA 40px
 *   CTA            240 x 48, radius 28, consumer-primary, Inter 16/600 white
 *
 * The one departure from the frame is `ART_LIFT` — see its own note.
 */

/**
 * How far the whole artwork block sits above its frame position, in px.
 *
 * Direct instruction, arrived at over three passes: "move the pillow + text +
 * CTA section up in desktop view, the copy + CTA sits very low", then "move the
 * blue pillow + pillow avatar section up", then "move the big blue pillow also
 * up". The frame's layout is top-anchored with all of its slack falling below
 * the button, so at any viewport taller than the 982px it was drawn at the copy
 * drifts toward the middle of the page with a growing void beneath it.
 *
 * **This is one constant applied to two things, and that is the point.** The
 * wave and the pillow are drawn in contact — the pillow's base rests on the
 * crest — so lifting one without the other leaves the pillow floating above the
 * shape it is sleeping on. A first pass moved the pillow by changing the
 * section's top padding and left the wave where it was, which is exactly that
 * bug. Deriving both offsets from this single value makes the mismatch
 * impossible, the same reasoning `blobFrame.ts` applies to the onboarding photo
 * and its outline (§78.1). Change this number, not the two call sites.
 */
const ART_LIFT = 60

/** The frame's own values, before the lift above is applied. */
const SECTION_PAD_TOP = 80
const WAVE_TOP = -850.703

/* ⚠️ `textRise` / `textTransition` were deleted when the welcome became a
 * four-step track: the steps now cross-fade with a CSS `transition-opacity`
 * matched to the track's own tween, so the framer variants had no readers left.
 * The artwork below still uses `framer-motion` directly and is untouched. */

/* `Z_LAYERS`, `Z_PATH`, `Z_TIMES` and `Z_CYCLE_S` now live in
 * `ConsumerCanvasWave` and are imported above. They moved when the awake mascot
 * on Home needed the same animation for its own sleep state (direct instruction:
 * "use the same zzz animation ... as done in welcome screen") — sharing the
 * module makes "the same" structural instead of a promise.
 *
 * The behaviour they describe is unchanged: each z fades in, lifts a few px and
 * fades out **in place**. A drifting arc was built on instruction and removed on
 * the next one ("remove the pathway"); recorded so it is not re-proposed.
 * `y`/`opacity` only — each glyph spans the whole export box, so `scale` and
 * `rotate` would pivot about the box's centre and slide the glyph sideways.
 */

/**
 * The pillow is asleep, so it breathes (direct instruction: "add some sleeping
 * motion to the face, and very subtle breathing also", "as if the pillow is
 * sleeping, add some life to it", "play with eyebrows also").
 *
 * Three layers on three clocks, which is what stops it reading as one image
 * pulsing:
 *
 * - **Body** carries the breath: a 1.8% scale over 4s, `transformOrigin` at
 *   `center bottom` so the pillow swells upward instead of sinking through the
 *   shadow ellipse it is resting on. 1.8% is ~3.7px on a 208px pillow — under
 *   the ~8deg/8px threshold Round 34 found for "nothing is animating" on
 *   rotation, but visible here because it is a continuous smooth cycle rather
 *   than a discrete step, and confirmed by watching it rather than assuming.
 * - **Face** rides that breath at slightly less travel than the surface it sits
 *   on, which is what makes it read as printed on a stretching object.
 * - **Eyebrows** are deliberately NOT on the breath cycle: a 7s loop that is
 *   still for most of its length and then twitches once. Involuntary and
 *   occasional is the whole idea — put them on the 4s breath and the face
 *   pumps.
 *
 * Only `y` animates on the face and brows, for the same box-centre pivot reason
 * as the z's above. The body may scale because it is what the box is drawn
 * around, so its own centre and the box's coincide.
 */
const BREATH_S = 4
const BROW_S = 7

const LAYER_STYLE = {
  position: 'absolute' as const,
  left: -2.99,
  top: 0,
  width: 210.646,
  height: 188,
  // `maxWidth: none` is load-bearing, not defensive: Tailwind's preflight sets
  // `img { max-width: 100% }`, which silently clamped this 210.646px export to
  // its 207.645px box and compressed the pillow horizontally. Found by
  // comparing `getComputedStyle().width` against the inline width, which had
  // been sitting correct in the DOM the whole time.
  maxWidth: 'none' as const,
}

/** The frames' own spacing reference (`988:9229` / `988:9290`) and text-block
 *  width. The live stride is at least the viewport — see `setGeom`. */
const WELCOME_STRIDE = 857
const WELCOME_TEXT_W = 688.5
/** A floor so a very narrow window still leaves the rail somewhere to live. */
const WELCOME_MIN_GAP = 168.5
/** Breathing room between a text block and the circle nearest it. The frames
 *  draw ~78-90px; built tangent it read as crowded. */
const WELCOME_RAIL_GAP = 56

/**
 * How many screens follow the welcome itself, **as a word**, derived from the
 * array rather than typed into the sentence that uses it.
 *
 * ⚠️ A written count has disagreed with what is on screen three separate times
 * in this project (Rounds 31, 32, 34), which is why `data/coachPathway.ts`
 * exports `PATHWAY_STAGE_COUNT_WORD` for the coach portal. Same rule here: add a
 * fifth screen and the welcome copy corrects itself.
 */
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'] as const

/**
 * The welcome journey — four screens (direct instruction: "after the default one
 * -> talk about session plan -> Modules that needs to be done each week -> Sleep
 * diary that needs to be filled everyday").
 *
 * One commitment per screen, in ascending order of what it asks: a plan is *made
 * for you* -> something arrives *weekly* -> something is needed *daily*. The
 * heaviest ask lands last, and this portal's audience note (readers who are not
 * digitally literate) is why each screen carries a single idea.
 *
 * ⚠️ Screen 3 states the cycle in the order it happens — a module opens, you
 * finish it, *then* you talk it over. Round 14.3 found this enforced backwards
 * once already, and copy that sets the wrong expectation is contradicted by the
 * app a week later.
 *
 * ⚠️ No contractions: the whole Consumer Portal has three, and Round 32 removed
 * them from the coach portal's equivalent flow deliberately.
 */
type WelcomeStep = {
  title: string
  body: string
  /** The primary control's label. Only the last screen names a destination. */
  cta: string
  /**
   * An optional closing sentence appended to `body`. Omit the leading verb —
   * the renderer supplies "Tap " or "Click " depending on viewport.
   */
  hint?: string
}

const WELCOME_STEPS: WelcomeStep[] = [
  {
    title: 'Welcome to Care2Sleep',
    body:
      'This is a space for you and your carer or family member to work on sleep together, ' +
      'alongside your coach.',
    /* "Welcome to Care2Sleep" keeps its own CTA (direct instruction: "for
       default welcome to care2sleep slide revert back to get started"). The
       three that follow say Next — this one is the way in, not one more step,
       and its own hint sentence names it. */
    cta: 'Get started',
    // Filled in below, once the array's own length is known.
    hint: '',
  },
  {
    title: 'Make a session plan with your coach',
    body:
      'You will meet your coach and pick days and times that suit you. Your coach then books ' +
      'every session, so you always know what is coming and when.',
    cta: 'Next',
  },
  {
    title: 'Complete your modules each week',
    body:
      'Every week a short module opens up for you to watch and work through. Once you have ' +
      'finished it, you and your coach talk it over together in your next session.',
    cta: 'Next',
  },
  {
    title: 'Fill in your sleep diary each day',
    body:
      'Each morning, tell us how you slept. It takes a couple of minutes, and it is what shows ' +
      'you and your coach what is changing.',
    /* The last slide names its destination rather than saying Next (direct
       instruction: "for last button go to dashboard"). It is the only one of
       the four that leaves the flow, and it is what hands over to Home and the
       onboarding tour. */
    cta: 'Go to dashboard',
  },
]

const STEP_COUNT_WORD = NUMBER_WORDS[WELCOME_STEPS.length - 1] ?? String(WELCOME_STEPS.length - 1)
// Interpolated from the first step's own CTA rather than written, so the
// sentence cannot end up naming a button that no longer says that. It has
// already earned that twice: the label went Continue -> Get started -> Next.
WELCOME_STEPS[0].hint = `${WELCOME_STEPS[0].cta} to see how it works, in ${STEP_COUNT_WORD} short steps.`

/**
 * The live geometry: how far one step travels, and how wide its text is.
 *
 * ⚠️ **The stride is at least the viewport**, not the frames' flat 857. That is
 * what lets the rail both travel with the text and reach both screen edges: a
 * travelling rail can only live in the gap between two steps, and that gap
 * (`stride - textW`) only covers the space either side of a centred block
 * (`vw - textW`) when `stride >= vw`. At 857 on a 1281 screen the gap is 168.5
 * against 592.5 of space, which is why earlier attempts either stopped short of
 * the edges or needed a fill faking continuity.
 *
 * Guarded for SSR/first-render safety, and shared by the initialiser and the
 * resize listener so the two cannot compute it differently.
 */
function readGeom() {
  const vw = typeof window === 'undefined' ? WELCOME_STRIDE : window.innerWidth
  const textW = Math.min(WELCOME_TEXT_W, vw - 48)
  return { stride: Math.max(vw, textW + WELCOME_MIN_GAP), textW }
}

/**
 * The width at and above which the flow *travels*.
 *
 * This portal's own desktop breakpoint (the `min-[1200px]` the copy's
 * Tap/Click switch and the module pages already use), not Tailwind's `md`.
 * Below it the steps cross-fade in place instead (direct instruction: "on
 * tablet and mobile, no slide in motion, when I click continue, just ease
 * fadein and show").
 *
 * The rail is gated on the same query rather than on `md`, because a
 * travelling timeline that no longer travels is not a timeline — it would jump
 * a whole stride between one frame and the next. Below 1200 the pagination
 * dots carry position on their own, which is what they already did on a phone.
 */
/**
 * The stroke's parallax — how much of the track's own travel the gradient
 * cancels out (direct instruction: "add parralex effect to the stroke
 * gradient, it currently looks like it moves left or right, and not giving
 * timeline effect").
 *
 * The diagnosis is exact: the rail lives *inside* the track, so its gradient
 * travelled at the track's speed, pixel for pixel. A texture moving in perfect
 * lockstep with the thing it is painted on has no parallax at all — the whole
 * assembly reads as one sheet sliding sideways, which is what was reported.
 *
 * The fix is to move the gradient *against* the travel by `RAIL_PARALLAX` of
 * it, so its apparent speed is the remaining `1 - RAIL_PARALLAX` — a far layer
 * drifting slowly behind a near one. At 0.85 the stroke crawls at 15% of the
 * text's speed, which is what makes it read as a long rail being travelled
 * along rather than a bar being dragged.
 *
 * ⚠️ **Higher is calmer, which is the counter-intuitive part.** A colour's
 * apparent speed is `1 - RAIL_PARALLAX` of the travel, so raising this number
 * *reduces* what the eye sees. 0.85 left the gradient running at 15% of a
 * 1281px travel and was reported as "the stroke is moving a lot, and too
 * fast"; 0.95 drops that to 5% — a slow drift against the text rather than a
 * sweep along the bar.
 *
 * ⚠️ Still not 1.0. A full cancel pins the gradient in the viewport, and a
 * stroke perfectly still while everything else moves reads as a rendering fault
 * rather than as depth.
 *
 * `RAIL_GRADIENT_PX` is the repeat period. The gradient's two ends are both
 * purple, so tiles abut purple-to-purple and the seam is invisible — which is
 * what lets the shift run unbounded without the rail ever running out of
 * gradient.
 */
/**
 * How far behind the stroke the text starts, in seconds (direct instruction:
 * "very slightly toggle the movement of the timeline and text block, i.e off
 * time it, the stroke moves first then text").
 *
 * ⚠️ This is why the text is no longer carried by the track's own transform.
 * The rail and the words lived inside one `motion.div` and moved on one tween —
 * deliberately, as "one shared movement, not a second animation of its own" —
 * and two things on one transform cannot be off-timed at all. The text now
 * rides a second value animated with this delay, applied as the *difference*
 * from the track, so it still ends exactly where the track puts it and the
 * cells' own geometry is untouched.
 *
 * ⚠️ **Read this as a distance, not as a duration.** The gap on screen is the
 * delay times the *current* velocity, and a 1.8s ease-in-out peaks around
 * 1423px/s — so 0.12s put the stroke ~170px ahead mid-travel, measured, which
 * was reported as "too much of movement". 0.05 lands nearer 70px: visible as a
 * lead, not as two blocks coming apart. Retune this number rather than the
 * track's duration if the lead ever needs changing again.
 *
 * Wide only. Below 1200 the travel is a single frame, and a delay there would
 * be a stutter rather than a lead.
 */
const TEXT_LAG_S = 0.05

const RAIL_PARALLAX = 0.95
const RAIL_GRADIENT_PX = 600

const WIDE_QUERY = '(min-width: 1200px)'

function readWide() {
  return typeof window === 'undefined' ? true : window.matchMedia(WIDE_QUERY).matches
}

/**
 * A circle on the rail.
 *
 * ⚠️ **No numerals.** They moved onto the titles themselves (direct
 * instruction: "add numbers to titles itself, and remove numbers from
 * circles"), which supersedes the earlier "add numbers to left stroke for all
 * steps after step 1" / "increase number and circle size". Every node is now
 * the same plain dot, so the rail carries continuity and the heading carries
 * position. The `label`/`numbered` props went with the numerals rather than
 * being left as unused arguments.
 *
 * That also retires a documented contrast exception: white on `purple-400`
 * measured 3.06:1 and was only defensible because the numeral was decorative
 * inside an `aria-hidden` rail. There is no text on the rail at all now.
 *
 * A segment sits between two steps, so its left circle touches the step before
 * it and its right circle the step after.
 *
 * Sized 16px against the bar's 4px (direct instruction: "reduce cirle size
 * also", then "reduce circles and stroke width"), down from 32px against 8px.
 *
 * `relative` so the node paints above the bar's 2px overlap.
 */
function RailNode() {
  /* ⚠️ **No entrance animation.** A scale-in + fade-in per move was built here
     on instruction and removed on the next look ("remove animation from
     circles, not looking good"). The dots are the fixed points the stroke
     travels between; anything that makes them appear *arrive* competes with the
     parallax for the same job and reads as two timelines at once. */
  return <span className="relative size-4 shrink-0 rounded-full bg-purple-400" />
}

/**
 * The fade a step carries as it travels.
 *
 * Direct instruction: "add fade out and fade in effect to text as they move out
 * on left, and while come in on right. map the effect timing / transition to
 * the left right movement".
 *
 * ⚠️ **Driven by the track's position, not by a timer.** That is the whole
 * point of the instruction's second sentence, and it is why this is a
 * `useTransform` off `trackX` rather than another `animate` with its own
 * duration. A second timed animation is what made an earlier version of this
 * screen read as a slideshow (see the note inside the cell), and it would drift
 * the moment a reader pressed again mid-travel — a timer restarts, a position
 * does not.
 *
 * The cell's own centre sits at `x + (index + 0.5) * stride` relative to the
 * viewport centre, so `d` is simply how far this step is from the middle of the
 * screen. Opaque until `FADE_FULL`, gone by `FADE_GONE`.
 *
 * ⚠️ `FADE_GONE` is past 0.5 on purpose. The steps are exactly one stride
 * apart, so a band closing at 0.5 puts *both* neighbours at zero at the halfway
 * point and the screen goes blank mid-travel for a beat. At 0.62 they cross at
 * ~27% each and the handover is continuous.
 *
 * Below 1200 there is no travel to map to — the track jumps in one frame — so
 * the time-based cross-fade stays in place there.
 */
const FADE_FULL = 0.18
const FADE_GONE = 0.62

function CellFade({
  textX,
  offsetX,
  stride,
  index,
  wide,
  active,
  transition,
  children,
}: {
  textX: MotionValue<number>
  offsetX: MotionValue<number>
  stride: number
  index: number
  wide: boolean
  active: boolean
  transition: { duration: number; ease?: readonly [number, number, number, number] }
  children: React.ReactNode
}) {
  /* ⚠️ Mapped to `textX`, the block's OWN position, not the track's. Since the
     two were off-timed they disagree mid-travel, and a fade that describes the
     text has to follow the text — otherwise the words start fading before they
     have begun to move. */
  const travelOpacity = useTransform(textX, (v) => {
    const d = Math.abs(v + (index + 0.5) * stride) / stride
    return Math.max(0, Math.min(1, (FADE_GONE - d) / (FADE_GONE - FADE_FULL)))
  })

  return (
    <motion.div
      className="flex w-full max-w-[var(--text-w)] flex-col items-center gap-6 min-[1200px]:gap-10"
      /* `initial={false}` for the same reason as the track: on arrival every
         cell is already at its resting opacity and offset, and only a move
         animates. */
      initial={false}
      style={wide ? { opacity: travelOpacity, x: offsetX } : undefined}
      animate={wide ? undefined : { opacity: active ? 1 : 0 }}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}

/**
 * The welcome flow plays itself off the screen before handing over to Home.
 *
 * Without this the screen was swapped out inside a single frame: `onContinue`
 * flipped the shell's flag, this whole section unmounted, and Home mounted and
 * ran its own 0.3s entrance with nothing having left. Reported as the home page
 * showing up "almost instantly". Fading this out first turns the changeover
 * into one continuous dissolve through the canvas — the same architecture the
 * coach portal's `DeliveryOnboarding` uses, where the shell's own comment notes
 * that by the time it runs "the welcome flow has already played itself off
 * screen".
 *
 * Reduced motion gets the same crossfade, shorter. Deliberately not zero: the
 * preference asks for movement to go away, not for state changes to become
 * instantaneous, and an opacity fade carries no motion vector.
 */
const EXIT_MS = 420
const EXIT_REDUCED_MS = 180

export function ConsumerWelcome({ onContinue }: { onContinue: () => void }) {
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([])

  /**
   * Focus the current step's heading on arrival and on every step change.
   *
   * An effect is right here, where a callback ref was right while the block
   * remounted per step: all four steps stay mounted so the rail can span them,
   * so the heading already exists when `step` changes and there is nothing to
   * race.
   *
   * Still not optional. Advancing makes the step carrying the button that was
   * just clicked `inert`, and an inert element cannot hold focus — without this
   * it drops to `<body>`, this project's most-repeated defect. It also does the
   * announcement: the incoming `<h1>` takes focus, so the new title is read.
   *
   * `preventScroll` keeps the viewport still — focusing an element at the top of
   * a fresh page scrolled the artwork out of frame in Rounds 18 and 19.
   */
  useEffect(() => {
    headingRefs.current[step]?.focus({ preventScroll: true })
  }, [step])

  /**
   * Read in JS rather than left as a CSS `calc()`, because framer cannot
   * interpolate custom properties; the same numbers are published back as
   * `--stride` / `--text-w` so the rail, the circles and the text cannot
   * disagree. See `readGeom`.
   */
  /**
   * ⚠️ **Seeded with a lazy initialiser, not a constant** (direct instruction:
   * "no motion to welcome screen").
   *
   * It used to start at the frames' 857 and be corrected to the real viewport by
   * the effect below. That correction is a state change, and the track animates
   * on state change — so the welcome screen slid sideways on first paint, from
   * a half-stride of 428.5 to one of 640.5 at 1281. A 200px lurch on arrival,
   * caused entirely by initialising to a value that was never going to be right.
   *
   * Reading the viewport during the first render means the track's very first
   * `animate` target is already its resting position. The effect stays, but
   * only for resize.
   *
   * ⚠️ **This was only half of that fix, and the note used to claim it was all
   * of it** ("so framer has nothing to move"). A correct target is not the same
   * as a correct starting point: with no `initial`, framer still began from the
   * DOM's own `transform: none` and slid in from x = 0. See `initial={false}`
   * on the track itself.
   */
  const [{ stride, textW }, setGeom] = useState(readGeom)
  useEffect(() => {
    const onResize = () => setGeom(readGeom())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* Seeded from a lazy initialiser for the same reason the geometry is: a
     constant that the first effect then corrects is a state change, and a state
     change here swaps the transition mid-flight. */
  const [wide, setWide] = useState(readWide)
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY)
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  /**
   * The travel.
   *
   * ⚠️ **A tween, not a spring** — and that is the actual fix for "its too
   * fast", after three rounds of lengthening a spring's duration failed to
   * help. A spring front-loads: it covers most of the distance in an early burst
   * then creeps to rest, and what reads as "speed" is that initial velocity. So
   * 0.8 -> 1.15 -> 1.6 -> 2.2s kept lengthening an imperceptible tail while the
   * fast part stayed fast.
   *
   * A symmetric ease-in-out spreads the movement evenly — slow start, peak in
   * the middle, slow settle — so the whole 1.8s is visible motion. If a spring
   * is ever wanted back for its physicality, lower the *stiffness* rather than
   * raising the duration; that is the knob that governs how hard it leaves.
   *
   * ⚠️ **Smoothed from `[0.65, 0, 0.35, 1]` to `[0.37, 0, 0.63, 1]`** (direct
   * instruction: "further smoothen, ease in the movements"), and the duration
   * was deliberately left alone. The two curves take the same 1.8s; what
   * separates them is peak velocity, which is 2.0x the average on the old cubic
   * and 1.57x on this sine — about 22% calmer through the middle, which is the
   * part the eye actually reads as speed. Reaching for the duration instead is
   * the mistake this note already records once.
   */
  // Guarded against a second press: the CTA stays on screen while the fade
  // runs, and firing `onContinue` twice would dismiss the flow mid-exit.
  const leave = useCallback(() => {
    setExiting((already) => {
      if (already) return already
      window.setTimeout(onContinue, reduceMotion ? EXIT_REDUCED_MS : EXIT_MS)
      return true
    })
  }, [onContinue, reduceMotion])

  /* Below 1200 the track still carries the step into place, but it does it in
     one frame — the movement the reader sees is the incoming text fading up,
     not a screen-wide slide.

     Memoised because it is an effect dependency below: rebuilt every render, it
     would restart the travel animation on each one. */
  const trackMotion = useMemo(
    () =>
      reduceMotion || !wide
        ? { duration: 0 }
        : { duration: 1.8, ease: [0.37, 0, 0.63, 1] as const },
    [reduceMotion, wide],
  )

  /* Below 1200 only. On a wide screen the cells take their opacity from the
     track's own position instead — see `WelcomeStepCell`. */
  const cellMotion = useMemo(
    () => ({ duration: 0.45, ease: [0.4, 0, 0.2, 1] as const }),
    [],
  )

  /**
   * The travel, as a `MotionValue` rather than an `animate` prop.
   *
   * It has to be a value the rest of the screen can *read*, because three
   * separate things are now mapped to the track's position rather than timed
   * alongside it: the stroke's parallax, and each cell's fade out to the left
   * and in from the right ("map the effect timing / transition to the left
   * right movement"). Reading one source means they cannot drift out of step
   * with the movement they describe — including mid-flight, if a reader presses
   * again before the 1.8s is up.
   *
   * ⚠️ Seeded at the resting target, so the mount plays nothing: `animate()` to
   * a value it already holds is a no-op. This is what `initial={false}`
   * expressed before, and it must not be lost — see the note on `readGeom`.
   */
  const trackTarget = -(stride / 2 + step * stride)
  const trackX = useMotionValue(trackTarget)
  useEffect(() => {
    const controls = animate(trackX, trackTarget, trackMotion)
    return () => controls.stop()
  }, [trackX, trackTarget, trackMotion])

  /* Against the travel, so the stroke's apparent speed is `1 - RAIL_PARALLAX`.
     A string rather than a number: framer appends `px` only for properties it
     knows, and `backgroundPositionX` is not one of them. */
  const railShift = useTransform(trackX, (v) => `${-v * RAIL_PARALLAX}px`)

  /* The text's own position, the same target reached `TEXT_LAG_S` later. The
     cells sit inside the track, so what they actually need is the *gap* between
     the two — apply `textX - trackX` on top of the track's transform and the
     result is a block sitting at `textX`. */
  const textX = useMotionValue(trackTarget)
  useEffect(() => {
    const controls = animate(
      textX,
      trackTarget,
      wide && !reduceMotion ? { ...trackMotion, delay: TEXT_LAG_S } : trackMotion,
    )
    return () => controls.stop()
  }, [textX, trackTarget, trackMotion, wide, reduceMotion])
  const textOffset = useTransform([trackX, textX], ([t, x]: number[]) => x - t)


  return (
    <motion.section
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{
        duration: exiting ? (reduceMotion ? EXIT_REDUCED_MS : EXIT_MS) / 1000 : 0,
        ease: 'easeOut',
      }}
      // `min-h` rather than a fixed height: the frame is 886px tall under a
      // 96px header at 982px, but a real viewport is any height, and the
      // frame's own layout is top-anchored with the slack falling below the CTA.
      className="bg-consumer-canvas relative flex min-h-[calc(100vh-96px)] flex-col items-center overflow-clip px-6 pb-4 md:px-20 min-[1200px]:pb-10"
      style={{ paddingTop: SECTION_PAD_TOP - ART_LIFT }}
    >
      {/* The wave (frame `761:3137`), anchored by its TOP rather than stretched
          to the container: its crest has to land a fixed distance below the
          header regardless of how tall the viewport is, and a percentage height
          would slide the crest with the page. Horizontal is percentage-based so
          the wave widens with the viewport, which is what a wave should do.
          The 1439px shape overhangs the 1281px frame on both sides by design;
          `overflow-clip` on the section is what makes that safe, and is why
          this screen cannot produce the horizontal page scroll that missing
          `min-w-0` has caused three times in this project.

          Decorative — the copy below carries the whole message. */}
      {/*
        Phone only — frame `789:1935` ("Background vector", the welcome screen's
        own iPhone SE export, 521.651 x 523.068).

        Same lesson as `ConsumerCanvasWave`: the desktop `wave.svg` carries
        `preserveAspectRatio="none"`, so handing it a phone-shaped box shears the
        curve instead of cropping it. Figma draws a separate shape for this
        width, and the frame uses it as an **oversized image inside a clip
        window** rather than scaling it to fit — which is why the geometry below
        is a window plus four percentage offsets rather than a width and height.

        The window is the frame's own 375 x 255 at page y 24 (it starts *behind*
        the 96px header, which is why `top` is negative once this renders inside
        the section). Everything is expressed relative to the window, so the
        whole assembly scales with the viewport with nothing to re-derive:
          window   100vw wide, 68vw tall            (255 / 375)
          image    left -19.37%, top -79.99%        (`789:1936`'s own insets)
                   width 139.1%, height 187.5%      (521.651 / 375, and
                                                     478.07 / 255)

        ⚠️ The height is **187.5%, not 196.4%**. `789:1936`'s insets give a
        456.39px box and the nested `-4.75%` bottom extension takes the image
        itself to 478.07 — 187.5% of the 255px window. A first pass applied that
        4.75% twice, once inside the 456.39 -> 478.07 step and again on top,
        which stretched the shape ~9px past the clip and cut the curve off flat
        against the window's bottom edge ("blue wave getting cropped in mobile").
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute block overflow-hidden sm:hidden"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          height: '68vw',
          top: 24 - 96,
        }}
      >
        <img
          src="/illustrations/consumer-welcome/welcome-wave-mobile.svg"
          alt=""
          style={{
            position: 'absolute',
            left: '-19.37%',
            top: '-79.99%',
            width: '139.1%',
            height: '187.5%',
            maxWidth: 'none',
            display: 'block',
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute hidden sm:block"
        style={{
          left: '-6.145%',
          width: '112.35%',
          top: WAVE_TOP - ART_LIFT,
          height: 1137.956,
        }}
      >
        <img
          src="/illustrations/consumer-welcome/wave.svg"
          alt=""
          // 107.234% / 100.144% is the export's own drop-shadow bleed past the
          // shape's box — the frame reports the same overhang. Transcribed
          // rather than rounded, because the crest is what it positions.
          // `maxWidth: none` for the same preflight reason as `LAYER_STYLE`.
          style={{ display: 'block', width: '100.144%', height: '107.234%', maxWidth: 'none' }}
        />
      </div>

      {/* ⚠️ Every vertical step below is reduced under 1200 (direct instruction:
            "reduce the vertical spacing for tablet and mobile"). The frame's
            104px mascot-to-copy gap is a desktop number — on a phone it pushed
            the copy and CTA down a screen that has none to spare, and it was
            what made the flow overflow the viewport in the first place. The
            desktop values are untouched, and the breakpoint is this portal's
            own `min-[1200px]`, not `sm` — tablet gets the reduced spacing too,
            which `sm:` would have excluded. */}
      <div className="relative flex w-full max-w-[1121px] flex-1 flex-col items-center gap-6 pt-2 pb-2 min-[1200px]:gap-[104px] min-[1200px]:pt-4 min-[1200px]:pb-16">
        {/* The mascot's LAYOUT box is the frame's 207.645 x 185; the exports are
            210.646 x 188 because of their own shadow bleed, and the frame
            offsets them left by 1.44% to keep the pillow itself centred. The
            two are deliberately separated — a first pass made the oversized
            image the flex item directly, and the 3px of shadow bleed then
            counted as layout height and pushed the heading 3px past its frame
            position. Measured, not spotted. */}
        {/* The pillow is 171.729 x 153 on mobile (`787:1901`) against 207.645 x
            185 on desktop — a uniform 0.827 on both axes. Same technique as the
            home mascot: a box that reserves the *scaled* size with a transform
            inside it, rather than resizing the art, because the layers are
            absolutely positioned in the export's own coordinate space and the
            floating "z"s sit at fixed offsets that a width change would break.
            `origin-bottom` keeps it standing on the same baseline. */}
        <div className="flex h-[153px] w-[172px] shrink-0 items-end sm:h-[185px] sm:w-[208px]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="relative shrink-0 origin-bottom scale-[0.827] sm:scale-100"
          style={{ width: 207.645, height: 185 }}
        >
          {/* Breathing pillow. `transformOrigin` is the load-bearing part: the
              default `center` swells the pillow downward as well as up and it
              sinks into its own resting shadow. */}
          <motion.img
            src="/illustrations/consumer-welcome/pillow-body.svg"
            alt=""
            aria-hidden="true"
            style={{ ...LAYER_STYLE, transformOrigin: 'center bottom' }}
            animate={reduceMotion ? undefined : { scale: [1, 1.018, 1] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: BREATH_S, repeat: Infinity, ease: 'easeInOut' }
            }
          />
          {/* The face rides the breath at less travel than the surface it is
              printed on. */}
          <motion.img
            src="/illustrations/consumer-welcome/pillow-face.svg"
            alt=""
            aria-hidden="true"
            style={LAYER_STYLE}
            animate={reduceMotion ? undefined : { y: [0, -1.2, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: BREATH_S, repeat: Infinity, ease: 'easeInOut' }
            }
          />
          {/* Eyebrows: still, then one twitch, then still again. The `times`
              array is what makes it occasional rather than rhythmic — the move
              occupies 15% of a 7s loop. */}
          <motion.img
            src="/illustrations/consumer-welcome/pillow-brows.svg"
            alt=""
            aria-hidden="true"
            style={LAYER_STYLE}
            // -4px, not the 1.6px a first pass used. Sampled live at 120ms
            // intervals, that version's whole travel was under half a pixel for
            // most of the twitch and peaked at 1.6 — animating in the DOM and
            // invisible on screen, which is exactly the failure Round 34
            // documented for rotations under ~8deg. Measure the amplitude, do
            // not reason about it.
            animate={reduceMotion ? undefined : { y: [0, 0, -4, -1, 0] }}
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: BROW_S,
                    repeat: Infinity,
                    times: [0, 0.5, 0.58, 0.65, 1],
                    ease: 'easeInOut',
                  }
            }
          />
          {Z_LAYERS.map(({ src, delay }) => (
            <motion.img
              key={src}
              src={`/illustrations/consumer-welcome/${src}.svg`}
              alt=""
              aria-hidden="true"
              style={LAYER_STYLE}
              // Reduced motion gets all three at rest and fully visible: the
              // glyphs are part of the illustration, so suppressing the loop
              // must not amount to deleting them.
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : Z_PATH}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: Z_CYCLE_S,
                      delay,
                      repeat: Infinity,
                      times: Z_TIMES,
                      ease: 'easeOut',
                    }
              }
            />
          ))}
        </motion.div>
        </div>

        {/* Heading leads, copy follows one beat behind, CTA last — the trainee
            flow's own `staggerChildren: 0.08`, extended to the button because
            the instruction names the copy *and* the CTA as one arriving block. */}
        {/*
          `flex-1 justify-center` — the fix for "so much dead space below the
          CTA" on a tall viewport (reported on iPad portrait, 768x1024).

          The section is `min-h-[calc(100vh-96px)]`, so on any viewport taller
          than the content there is slack. It used to **all** fall below the CTA,
          because this column was top-anchored: at iPad portrait that is ~340px
          of empty canvas under the button, and the screen reads as unfinished.

          Centring the whole composition instead would be the obvious move and is
          wrong here: the wave is absolutely positioned against the section's own
          top so its purple band meets the header, and floating the group down
          would open a strip of bare canvas above the purple. The mascot has to
          stay with the wave.

          So the slack goes to the one block that can absorb it — this one takes
          the leftover height and centres its content inside it, which splits the
          space above and below the copy instead of dumping it all at the bottom.
          On a short viewport there is no leftover and this is a no-op.
        */}
        {/* ⚠️ `flex-1 justify-center` is desktop-only. It exists to absorb a tall
            desktop viewport's slack and centre the copy in it; below 1200 there
            is no slack worth centring, and taking it opened a ~150px hole
            between the mascot and the title on a tablet. Was `sm:`. */}
        <div className="flex w-full flex-col items-center gap-6 min-[1200px]:flex-1 min-[1200px]:justify-center min-[1200px]:gap-10">
          {/*
            ⚠️ `py-10 -my-10` is **clip headroom, not spacing**. The wrapper needs
            `overflow-hidden` for the horizontal clip (the track is four
            viewports wide), but that clips vertically too, and the 64px numbered
            node overhangs the track's own top edge by ~16px — measured, it was
            being sliced into a pill. `overflow-x: hidden` alone is not the fix:
            CSS computes the other axis to `auto` and adds a vertical scrollbar.
            Padding the clip box and pulling the same off the margin grows the
            clip region and leaves layout untouched.
          */}
          <div
            className="relative w-screen overflow-hidden py-10 -my-10"
            style={{
              ['--stride' as string]: `${stride}px`,
              ['--text-w' as string]: `${textW}px`,
              ['--rail-gap' as string]: `${WELCOME_RAIL_GAP}px`,
            }}
          >
            <motion.div
              className="relative ml-[50%] flex w-max"
              /*
                ⚠️ **`style`, not `animate`** — and the welcome screen must
                arrive already in place (direct instruction: "remove the move in
                animation from just welcome text for desktop screen, when I
                click get started the motion resumes").

                This used to be `animate={{ x }}` with no `initial`, and it slid
                in from the left on every arrival. The reason was NOT the
                geometry: `readGeom`'s lazy initialiser (see its own note) makes
                the first target correct from the first render, and that was
                verified. It is that a `motion` element with `animate` and no
                `initial` starts from the value in the DOM — `transform: none`,
                i.e. x = 0 — and tweens to the target. Measured in an iframe
                booted at a real 1281px width: x ran 0 -> -640.5 over the full
                1.8s on mount.

                Driving a `MotionValue` seeded at the resting target has the
                same effect and buys the read access the parallax and the cell
                fades need. Re-measured after the change: one single x for the
                whole 2.2s after mount, and a press still runs -640.5 ->
                -1921.5 over 1.8s.

                ⚠️ Do not "fix" a future mount slide by touching `readGeom`
                again — that lever was already pulled once for this same
                symptom, and this is the half it could not reach.
              */
              style={{ x: trackX }}
            >
              {/*
                ── The rail ─────────────────────────────────────────────────
                One segment per gap between two steps, living **inside the
                track** so it travels with the text on the same tween — one
                shared movement, not a second animation of its own.

                Each segment is a circle, a bar, a circle, inset `--rail-gap`
                from the two text blocks it spans.

                ⚠️ **No fill and no knockout anywhere.** Four earlier shapes each
                needed one and each broke: a per-step pair travelled away with
                its own step; a continuous bar with per-step fills shattered into
                168px stubs; the same bar with one centred fill showed as a pale
                band, because the section paints a *radial gradient* (measured)
                that a flat `#fffdfa` rectangle matches only at its centre; and
                animating the bar separately gave the stroke a life of its own.
                Drawing only the gap removes the need for all of it.

                `N - 1` segments for `N` steps, so the first step has nothing to
                its left and the last nothing to its right — as frame `988:9229`
                draws the welcome screen.

                ⚠️ `md` and up only — "in mobile only show pagination, no
                timeline".
              */}
              {WELCOME_STEPS.slice(1).map((s, i) => (
                <div
                  key={`rail-${s.title}`}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2 hidden h-8 items-center min-[1200px]:flex"
                  style={{
                    left: `calc(${i} * var(--stride) + (var(--stride) + var(--text-w)) / 2 + var(--rail-gap))`,
                    width: 'calc(var(--stride) - var(--text-w) - 2 * var(--rail-gap))',
                  }}
                >
                  <RailNode />
                  {/* `-mx-0.5` — the bar tucks 2px under the circle at each end
                      ("space between the circle and stroke make it -2px"), so no
                      hairline of canvas shows at a fractional device pixel
                      ratio. The circles are `relative`, so they paint over it.

                      `backgroundPositionX` is the parallax — see
                      `RAIL_PARALLAX`. The explicit `backgroundSize` sets the
                      repeat period; without it the gradient is one element-width
                      wide and the shift would drag a single stretched sweep
                      across instead of a travelling rhythm. */}
                  <motion.span
                    className="-mx-0.5 h-1 min-w-0 flex-1 rounded-full bg-[linear-gradient(to_right,var(--color-purple-200),var(--color-yellow-200),var(--color-purple-200))]"
                    style={{
                      backgroundSize: `${RAIL_GRADIENT_PX}px 100%`,
                      backgroundPositionX: railShift,
                    }}
                  />
                  <RailNode />
                </div>
              ))}

              {WELCOME_STEPS.map((s, i) => {
                const active = i === step
                return (
                  <div
                    key={s.title}
                    className="flex w-[var(--stride)] shrink-0 justify-center px-6 md:px-0"
                    /* ⚠️ Every step stays mounted so the rail can span them, so
                       the three that are not current MUST be inert. The fade
                       hides them visually only: without this they keep their tab
                       stops and their headings stay in the accessibility tree,
                       which is Round 20's Critical exactly. */
                    {...(active ? {} : { inert: true, 'aria-hidden': true })}
                  >
                    {/*
                      ⚠️ **The text has no animation of its own** (direct
                      instruction: "remove motion to text part"). A rise-and-fade
                      was built here and removed: the track already carries the
                      words across, and a second, independently-timed movement on
                      top of that is what made it read as a slideshow rather than
                      a scroll.

                      No fade is needed to hide the other steps either. A cell is
                      one stride wide and the stride is at least the viewport, so
                      the nearest neighbour's text sits a full screen away and is
                      simply not on screen — verified at 375 too, where the
                      stride floor keeps it 332px from centre against a 187.5px
                      half-viewport.

                      They are still `inert` (on the cell above): off-screen is
                      not the same as out of the accessibility tree, and without
                      it they keep their tab stops. That is Round 20's Critical.
                    */}
                    <CellFade
                      textX={textX}
                      offsetX={textOffset}
                      stride={stride}
                      index={i}
                      wide={wide}
                      active={active}
                      transition={cellMotion}
                    >
                      {/* The frame's own 8px between title and copy. */}
                      <div className="flex w-full flex-col gap-2 text-center text-ink">
                        <h1
                          ref={(node) => {
                            headingRefs.current[i] = node
                          }}
                          tabIndex={-1}
                          className="text-consumer-display text-balance outline-none"
                        >
                          {/* ⚠️ The number is **derived from the step's own
                              position**, never written into the copy (direct
                              instruction: "add numbers to titles itself").
                              `i`, not `i + 1`: the welcome screen is the way in
                              rather than one of the steps, so it carries no
                              number and the three that follow run 1, 2, 3 —
                              which is what its own "three short steps" promises
                              and what the rail's numerals used to say. Writing
                              them into `WELCOME_STEPS` would let the copy and
                              the position disagree the moment a step moves. */}
                          {i > 0 && `${i}. `}
                          {s.title}
                        </h1>
                        <p className="text-consumer-lesson font-normal text-balance">
                          {s.body}
                          {s.hint && (
                            <>
                              {' '}
                              {/* "Tap" below the portal's own 1200 breakpoint,
                                  "Click" above it — `ModuleSummaryCards`' Round 47
                                  convention. Two spans with one `display: none`
                                  rather than a string switched in React: hidden
                                  text is excluded from what a screen reader
                                  renders, so exactly one verb is announced and
                                  nothing tracks a resize. */}
                              {/* Bold on direct instruction. `font-semibold` is
                                  600, this portal's heaviest permitted weight —
                                  its scale tops out there, and a `font-bold`
                                  here would be the first 700 on a consumer
                                  surface. */}
                              <span className="font-semibold">
                                <span className="min-[1200px]:hidden">Tap </span>
                                <span className="hidden min-[1200px]:inline">Click </span>
                                {s.hint}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Back sits to the LEFT of the primary on a wide screen and
                          BELOW it on a phone (`flex-col-reverse`), so the forward
                          action is the first control a thumb reaches either way.
                          Step 1 has no Back: nothing is behind it, and the slot is
                          absent rather than disabled.

                          The frames draw a single 240 x 48 Continue and no Back at
                          all; Back is a direct instruction, and the primary keeps
                          the frame's own 240 x 48. */}
                      <div className="flex w-full flex-col-reverse items-center justify-center gap-3 sm:flex-row sm:gap-4">
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => setStep(i - 1)}
                            /* Chevrons, spacing AND type step match
                               `ConsumerOnboardingTour`'s footer exactly (direct
                               instruction: "add chevrons to welcome screen buttons
                               where we have go back, next"). The two flows run back
                               to back, so a reader meets both footers within a
                               minute of each other.

                               ⚠️ `consumer-body-strong`, not the app's `body-md`.
                               Both are 16/600, so nothing moved on screen — but
                               this portal is on its own scale and an app token on a
                               consumer surface is leakage, not a decision, even
                               when the two happen to agree today. */
                            className="text-consumer-body-strong flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-[28px] border border-consumer-primary bg-white px-4 whitespace-nowrap text-consumer-primary outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 sm:w-40"
                          >
                            <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
                            Go back
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            i === WELCOME_STEPS.length - 1 ? leave() : setStep(i + 1)
                          }
                          disabled={exiting}
                          className="bg-consumer-primary text-consumer-body-strong flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-[28px] px-4 text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 sm:w-60"
                        >
                          <span className="min-w-0 flex-1 text-center">{s.cta}</span>
                          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                        </button>
                      </div>
                    </CellFade>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </div>

        {/*
          ── Step pagination ─────────────────────────────────────────────────
          `SessionPlanStrip`'s treatment exactly — 10px circles, a 28px active
          pill, `consumer-primary` against `hairline`, the same 300ms transition
          dropped under `motion-reduce` — shown at every width, where the strip's
          own is compact-only.

          ⚠️ **Indicators, not buttons.** The strip's dots are real controls
          because they are the keyboard path to a card you would otherwise scroll
          past. Here Go back and Continue already move between screens, and a dot
          that jumps forward is a Skip by another name, which this flow was told
          not to have. So the list is `aria-hidden` and the position is carried by
          an `sr-only` line — a better announcement than four unlabelled dots.

          `mt-auto` pins it to the bottom of the section (the viewport); the
          section's own bottom padding was cut 112 -> 40, which is what closed the
          gap under the CTA rather than removing the pin.

          ⚠️ **`sticky` only from 1200, and that is a correction.** It was sticky
          at every width, to keep the dots at the bottom of the viewport when the
          flow ran taller than the screen. That is fine on a desktop, where the
          flow fits and the dots never actually leave their resting place — and
          wrong on anything smaller, where the content DOES overflow, so the dots
          pinned themselves over the Go back button ("in mobile welcome screens,
          pagination overlapping with buttons"). A first fix reserved 112px of
          empty space under the CTAs for the pinned row to land on; this
          supersedes it and that reserve is gone (direct instruction: "for
          welcome screens in mobile or tablet, do not make the pagination sticky,
          map it below the buttons").

          Below 1200 the row is ordinary flow after the buttons — which is where
          it reads correctly anyway, since the reader arrives at it last.
          `min-[1200px]` is this portal's own desktop breakpoint, the one the
          Tap/Click switch and the slide rail already use.
        */}
        <div className="mt-auto flex w-full shrink-0 flex-col items-center pt-4 pb-4 min-[1200px]:sticky min-[1200px]:bottom-0 min-[1200px]:pt-10 min-[1200px]:pb-8">
          <p className="sr-only" aria-live="polite">
            Step {step + 1} of {WELCOME_STEPS.length}
          </p>
          <ol aria-hidden="true" className="flex items-center gap-1">
            {WELCOME_STEPS.map((s, i) => (
              <li key={s.title} className="flex h-9 w-6 items-center justify-center">
                <span
                  className={cn(
                    'h-2.5 rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none',
                    i === step ? 'w-7 bg-consumer-primary' : 'w-2.5 bg-hairline',
                  )}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </motion.section>
  )
}
