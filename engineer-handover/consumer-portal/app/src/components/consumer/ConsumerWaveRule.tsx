import { cn } from '@/lib/utils'

/**
 * The hand-drawn squiggle rule that separates "Lesson of the week" from
 * "Previous lessons" — frames `792:2580` (desktop, 920.731 x 6) and `792:2031`
 * (mobile, 328.482 x 6).
 *
 * ── Two exports, for the reason `ConsumerCanvasWave` documents ────────────
 *
 * Both exports carry `preserveAspectRatio="none"`, so the box **is** the
 * geometry: hand one a different width and the wavelength changes with it
 * rather than the curve being cropped. Figma supplies a purpose-drawn export
 * per breakpoint — identical amplitude, different length — so each renders near
 * its own drawn width and the squiggle keeps its period. Serving both from one
 * file is what turned the background wave into spikes twice (§85.2).
 *
 * ⚠️ These are NOT the squiggle the coach portal's `WaveDivider` uses (not
 * shipped in this package). That asset is the same designer's curve and even
 * carries the same `Vector 1 - Wave` layer name, but it is stroked `#A070FF`
 * against a white card. These are `#3A00AD` — this portal's own
 * `consumer-primary` — on a warm canvas. Reusing the coach asset here would
 * have been a silent colour change, which is why matching the glyph was not
 * enough. If you ever consolidate the two portals' artwork, that is the trap.
 */
export function ConsumerWaveRule({ className }: { className?: string }) {
  return (
    <>
      <img
        src="/illustrations/consumer-home/wave-rule-mobile.svg"
        alt=""
        aria-hidden="true"
        className={cn('block h-1.5 w-full sm:hidden', className)}
      />
      <img
        src="/illustrations/consumer-home/wave-rule-desktop.svg"
        alt=""
        aria-hidden="true"
        className={cn('hidden h-1.5 w-full sm:block', className)}
      />
    </>
  )
}
