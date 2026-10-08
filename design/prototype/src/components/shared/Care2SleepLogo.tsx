/**
 * The Care2Sleep wordmark — Figma node `787:1755` (desktop) / `787:1642`
 * (mobile), a **single flattened export** at 210.89 x 52.2682.
 *
 * ── What changed, and what it cost ────────────────────────────────────────
 *
 * This replaces a four-piece composition: a pillow mark, three separate
 * crescent-moon vectors, and the word "Care2Sleep" as **live text** in Atkinson
 * Hyperlegible Next, with the accent hand-positioned over the final "p" from
 * measured frame offsets.
 *
 * The frame now exports the whole lockup as one vector, so the wordmark is
 * outlines rather than text. That is a real trade and it is worth naming:
 *
 *   - **Lost:** the word is no longer selectable, searchable, or present in the
 *     DOM as text. It also no longer re-renders in the reader's own font.
 *   - **Gained:** the accent can no longer drift. The old version's position
 *     assumed the text rendered at exactly 171px, so any change to the family,
 *     size or fallback silently moved the moon off the "p" — a standing hazard
 *     documented in `design-tokens.md` §81 that simply does not exist now.
 *
 * The accessible name is unaffected: every call site wraps this in a link
 * carrying `aria-label="Care2Sleep home"`, so the name was never coming from
 * the glyphs. That is why the swap is safe rather than merely acceptable.
 *
 * Rendered from the committed export, never hand-written as `<path>` — this
 * project's standing rule, and doubly so for a brand mark.
 *
 * ── Why it is shared, not consumer-only ───────────────────────────────────
 *
 * Round 47 (direct instruction) put the same lockup in the trainee and coach
 * header. The standing rule is that a component only the Consumer Portal
 * renders lives under `components/consumer/`; once a second portal renders it,
 * it moves. It is also the one thing in that folder that is genuinely
 * brand-level rather than consumer-branded — the mark is the same mark in every
 * portal.
 *
 * ── Sizing ────────────────────────────────────────────────────────────────
 *
 * The frames draw it at two sizes with an identical aspect ratio
 * (210.89/52.268 = 4.0348; 178.619/44.27 = 4.0347), so this is one asset
 * scaled, not two exports. Width is set and height follows from the SVG's own
 * `viewBox` — no second number to keep in step.
 *
 * The four pieces this replaced (`logo-mark.svg` and the three
 * `wordmark-moon-*.svg`) are **deleted**, not left committed — grep confirmed
 * zero readers. An earlier draft of this note claimed `ConsumerWelcome` still
 * animated the pillow mark; it does not, it uses its own `pillow-*` exports.
 */

/**
 * Frame `787:1755` (desktop) and `787:1642` (mobile), scaled down in Round 47 on
 * direct instruction. Halved first, then reported as "reduced by a lot" and
 * brought back to 0.65 — 137 x 34 on desktop against the frames' 211 x 52.
 *
 * The frames' own numbers are kept as the source and multiplied here rather
 * than overwritten, so they stay checkable and the scale stays one edit. The
 * `vw` term in the clamp is scaled by the same factor, so the two crossover
 * points are unchanged and the curve is identical, just smaller.
 */
const LOGO_SCALE = 0.65
const WIDTH_DESKTOP = 210.89 * LOGO_SCALE
const WIDTH_MOBILE = 178.619 * LOGO_SCALE

export function Care2SleepLogo({
  className,
  maxWidth = WIDTH_DESKTOP,
}: {
  className?: string
  /** Round 47: the app header's bar is shorter than the Consumer Portal's, so
   *  it caps the lockup rather than carrying a second export. The aspect ratio
   *  and the two clamp crossover points are untouched — only the ceiling
   *  moves. */
  maxWidth?: number
}) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}illustrations/consumer-welcome/care2sleep-logo.svg`}
      alt=""
      aria-hidden="true"
      width={maxWidth}
      height={maxWidth / 4.0348}
      className={className}
      style={{
        // `clamp()` rather than a breakpoint: the lockup is a fixed-aspect
        // vector and the only thing that ever squeezes it is a narrow screen,
        // so it tracks the viewport directly instead of stepping at an
        // arbitrary width. 23.8vw is the mobile frame's own 178.619 at 375px
        // after `LOGO_SCALE`, reaching the desktop width at ~443px and holding
        // there — the same two crossover points as before, halved together so
        // the curve is identical, just smaller.
        width: `clamp(${Math.min(WIDTH_MOBILE, maxWidth)}px, ${47.6 * LOGO_SCALE}vw, ${maxWidth}px)`,
        height: 'auto',
        display: 'block',
      }}
    />
  )
}
