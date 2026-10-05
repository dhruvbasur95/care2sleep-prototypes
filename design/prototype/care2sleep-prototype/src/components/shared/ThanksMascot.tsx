import { motion } from 'framer-motion'
import { useMascotExpression } from '@/components/consumer/ConsumerCanvasWave'
import { ART } from '@/components/shared/FeedbackPillow'

/**
 * The thank-you pillow — the mascot that closes the consumer's post-session
 * feedback flow.
 *
 * **Extracted from `SessionFeedbackModal` at its second caller** (direct
 * instruction, 2026-10-02: the trainee's reflection modal should *"add the
 * pillow avatar, check thank you screen for after consumer shares their post
 * session feedback"*). Same rule `FeedbackPillow`, `Toast`, `MeetingsSection`
 * and `AnswerOutcome` were extracted under, and the same reason it matters
 * here: the three layers, the 138.158 x 90 box and the 5s beat were all
 * measured against frame `951:6954`, and a second copy would drift on the first
 * re-export.
 *
 * Nothing about it changed in the move. It is deliberately **not** re-themed
 * for the trainee portal: the pillow is the one piece of Care2Sleep character
 * art the product has, and a recoloured copy would read as a different
 * mascot rather than the same one saying thank you again.
 *
 * ## Four layers, not one asset
 * Body, face and brows are separate SVGs so the expression can animate
 * independently of the body's idle sway — `useMascotExpression` drives `faceY`,
 * `browY` and `tilt`, and the body carries its own slow scale/rise. One flat
 * export would freeze the face.
 *
 * ## The base was missing, and had been since this flow shipped
 * The composite `thanks.svg` contains an `#EADECC` ellipse — the ground the
 * pillow sits on — that appears in **none** of `thanks-body`, `-face`, `-brows`
 * or `-eyes`. Splitting the export dropped it, so the consumer's own thank-you
 * screen has been rendering a floating pillow (reported 2026-10-02: *"thank you
 * screen avatar missing the bottom base"*). `thanks-base.svg` is that ellipse,
 * extracted from the composite verbatim — same viewBox, same geometry, same
 * fill — rather than redrawn.
 *
 * It sits **outside the animated wrapper on purpose.** It is the ground, not
 * part of the pillow: swaying and rising with the body would read as the floor
 * moving. So the base is a static sibling and only the three pillow layers
 * animate above it.
 *
 * `nap: false` is the caller contract inherited from the feedback modal: the
 * sleeping expression changes what the face *is* rather than how it is set, and
 * a mascot that dozes off on a thank-you screen reads as a broken asset.
 *
 * Every motion path is `useReducedMotion`-guarded inside the hook and here, so
 * a reduced-motion reader gets the artwork with no sway and no expression
 * cycling.
 */
export function ThanksMascot({ className }: { className?: string }) {
  const { reduceMotion, featureTransition, browY, faceY, tilt } = useMascotExpression({
    nap: false,
  })
  /* The three layers stack in one box. `maxWidth: 'none'` is load-bearing:
     the app's global `img { max-width: 100% }` reset would otherwise shrink an
     absolutely-positioned layer to its container and pull the face off the
     body. */
  const layer = {
    position: 'absolute' as const,
    inset: 0,
    width: 138.158,
    height: 90,
    maxWidth: 'none' as const,
  }
  return (
    <div
      aria-hidden="true"
      className={className ?? 'relative shrink-0'}
      style={{ width: 138.158, height: 90 }}
    >
      {/* The ground. Static — see the note above. */}
      <img src={`${ART}/thanks-base.svg`} alt="" style={layer} />
      <motion.div
        className="absolute inset-0"
        style={{ width: 138.158, height: 90, transformOrigin: 'center bottom' }}
        animate={
          reduceMotion ? { rotate: 0 } : { rotate: tilt, scale: [1, 1.015, 1], y: [0, -2, 0] }
        }
        transition={{
          rotate: featureTransition,
          scale: reduceMotion
            ? { duration: 0 }
            : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
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
    </div>
  )
}
