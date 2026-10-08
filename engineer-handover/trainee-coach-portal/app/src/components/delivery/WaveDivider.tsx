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
export function WaveDivider({ label, className }: { label: string; className?: string }) {
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
