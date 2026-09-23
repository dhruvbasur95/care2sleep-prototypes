import { cn } from '@/lib/utils'
/**
 * `566:5406` / `638:12122` — a hand-drawn wave rule either side of a centred
 * label.
 *
 * Extracted from `DeliveryHomePage` at its second caller (My Notes, frame
 * `638:12057`), which uses the identical rule with different wording. The label
 * is the only thing that varies; the asset, the 32px gaps and the 4px rule
 * height are the same in both frames.
 */
/**
 * The two hand-drawn rules this project draws, which are the SAME shape at
 * different weights — not a colour swap, so they are two exports rather than
 * one asset recoloured:
 *
 * | tone | asset | stroke | weight |
 * |---|---|---|---|
 * | `lilac` | `home/wave.svg` | `#A070FF` | 1.4 |
 * | `brand` | `module/wave-rule.svg` | `#3A00AD` | 2 |
 *
 * `lilac` is the shared `Illustration / wave` component's own values and stays
 * the default, so every existing caller renders byte-identical. `brand` is the
 * Chapter intro block's **instance override** of that same component — Figma
 * carries the heavier stroke and the darker purple on the instance, not on the
 * main, which is why reading the main component gives the wrong numbers.
 */
const WAVE_SRC = {
  lilac: 'illustrations/home/wave.svg',
  brand: 'illustrations/module/wave-rule.svg',
} as const

export function WaveDivider({
  label,
  className,
  tone = 'lilac',
}: {
  label?: string
  className?: string
  tone?: keyof typeof WAVE_SRC
}) {
  // Round 47: `label` became optional at its fourth caller. The new Chapter
  // intro block draws the same hand-drawn rule full width with nothing on it,
  // separating the SIPTEA components from the practice skills. Rendering one
  // bare `<img>` rather than two around an empty `<p>` is the difference
  // between one continuous rule and two with a 64px hole in the middle.
  if (!label) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}${WAVE_SRC[tone]}`}
        alt=""
        aria-hidden="true"
        /* `h-[6px]`, the asset's own box, not the `h-1` the labelled branch
           uses. Two separate clips were happening and both are measured:
           squashing a 5px drawing into 4px cut the line's top and bottom, and
           Figma's own export box was itself half a unit too short — the path
           runs y 1.00 to 3.96 and a 2px stroke puts the painted edge at exactly
           0.00, so the crests sat ON the boundary (238 rasterised pixels
           touching the top edge). The committed asset adds 0.5 of clearance
           each side; nothing touches either edge now.

           `preserveAspectRatio="none"` lives in the asset, so stretching to
           the container's width scales X only — which is what keeps a
           near-horizontal 2px stroke reading as 2px at any width. Scaling it
           uniformly would thin the stroke in proportion to the container. */
        className={cn('block h-[6px] w-full', className)}
        data-node-id="2609:22155"
      />
    )
  }
  return (
    /* `className` is additive (Round 40) — every existing caller omits it and
       renders byte-identical. Coach Home needs the rule to carry its own top
       margin so the margin disappears with the divider rather than leaving a
       ghost gap, the same reason the deleted `AttentionSection` took one. */
    <div className={cn('flex items-center gap-8', className)} data-node-id="566:5406">
      <img
        src="/illustrations/home/wave.svg"
        alt=""
        aria-hidden="true"
        className="h-1 min-w-0 flex-1"
      />
      <p className="shrink-0 text-body-md text-ink">{label}</p>
      <img
        src="/illustrations/home/wave.svg"
        alt=""
        aria-hidden="true"
        className="h-1 min-w-0 flex-1"
      />
    </div>
  )
}
