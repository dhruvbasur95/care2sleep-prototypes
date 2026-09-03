import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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

/** Rise-and-fade for the copy block, matching the trainee welcome flow's own
 *  `textRise` exactly (direct instruction: "the copy + CTA moves in the page
 *  similar to how we did for trainee welcome text"). `y` is deliberately small:
 *  Round 32's tour established that most of what reads as "springy" is travel
 *  plus a sharp curve, not duration, and 10px over a symmetric ease reads as
 *  smooth. Copied rather than shared because the two flows have no common
 *  module and a shared motion constant between two portals' welcome screens
 *  would couple them for no benefit. */
const textRise = {
  out: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
}

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

export function ConsumerWelcome({ onContinue }: { onContinue: () => void }) {
  const reduceMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Focus the heading on arrival. This screen replaces the whole page body, so
  // without it a keyboard or screen-reader user is left wherever focus happened
  // to be — and `<body>` is the usual answer, which is this project's
  // most-repeated defect. `preventScroll` keeps the viewport still: focusing an
  // element at the top of a fresh page has scrolled the artwork out of frame in
  // Rounds 18 and 19.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  // Softened on the trainee flow's own precedent: 3px of travel over the
  // symmetric `[0.4, 0, 0.2, 1]` rather than an `easeOut`, which front-loads
  // its speed and reads as a dart.
  const textTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const }

  return (
    <section
      // `min-h` rather than a fixed height: the frame is 886px tall under a
      // 96px header at 982px, but a real viewport is any height, and the
      // frame's own layout is top-anchored with the slack falling below the CTA.
      className="bg-consumer-canvas relative flex min-h-[calc(100vh-96px)] flex-col items-center overflow-clip px-6 pb-28 md:px-20"
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

      <div className="relative flex w-full max-w-[1121px] flex-1 flex-col items-center gap-20 pt-4 pb-16 sm:gap-[104px]">
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
        <motion.div
          className="flex w-full flex-col items-center gap-10 sm:flex-1 sm:justify-center"
          initial="out"
          animate="in"
          variants={{ in: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } } }}
        >
          <div className="flex w-full flex-col gap-2 text-center text-ink">
            <motion.h1
              ref={headingRef}
              tabIndex={-1}
              variants={textRise}
              transition={textTransition}
              className="text-consumer-display text-balance outline-none"
            >
              Welcome to Care2Sleep
            </motion.h1>
            <motion.p
              variants={textRise}
              transition={textTransition}
              // 18px below `md`, 20px from there (direct instruction: "what is
              // 20 becomes 18"). The 1.3 ratio is carried explicitly because
              // `sub-greeting`'s own line height is `normal`.
              className="text-consumer-lesson font-normal text-balance"
            >
              This is a space for you and your carer or family member to work on sleep together,
              alongside your coach.
            </motion.p>
          </div>

          <motion.button
            variants={textRise}
            transition={textTransition}
            type="button"
            onClick={onContinue}
            className="bg-consumer-primary flex h-12 w-full shrink-0 items-center sm:w-60 justify-center rounded-3xl px-5 text-body-md text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
          >
            Continue
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
