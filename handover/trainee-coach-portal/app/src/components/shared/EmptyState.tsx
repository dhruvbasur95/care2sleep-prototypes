import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Icon-led empty state: a circular tinted badge, the icon inside it, and one
 * short line underneath.
 *
 * Round 27, direct instruction — a bare sentence of grey text read as unfinished
 * copy rather than a deliberate "nothing here" state, and the instruction was to
 * use an icon with short copy below it in both the coach record page's "Latest
 * updates" card and Consumer Management's "Needs attention" card. Shared rather
 * than written twice: those two cards are explicitly meant to look like one
 * pattern, and this project has already watched a copy-pasted treatment drift
 * across five pages once (the reason `ResearchPageHero` was extracted).
 *
 * The badge geometry follows the app's first icon empty state (Round 10, the
 * Session Recordings table): a `primary/10` circle around a `primary` icon.
 *
 * Keep `copy` to one short line. This component is for a *resting* state, not
 * an error and not a call to action — anything that needs a button or an
 * explanation of what went wrong belongs in its own block, not here.
 */
export function EmptyState({
  icon: Icon,
  copy,
  className,
}: {
  icon: LucideIcon
  /** One short line. Not a paragraph. */
  copy: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-10 text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10"
      >
        <Icon className="size-5 text-primary" />
      </span>
      <p className="text-caption text-ink-muted">{copy}</p>
    </div>
  )
}
