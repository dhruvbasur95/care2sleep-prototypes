import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The "nothing here yet" state: a tinted circular badge, an icon, one short
 * line under it.
 *
 * Callers: `SessionsPlanOverview`, `SpacesCoachProfilePage`,
 * `ConsumerDetailPage`. These are meant to read as one pattern, so use this
 * rather than writing a variant — a bare sentence of grey text reads as
 * unfinished copy rather than a deliberate state, which is why this exists.
 *
 * ⚠️ Keep `copy` to one short line. This is a *resting* state: not an error,
 * not a call to action. Anything needing a button, or an explanation of what
 * went wrong, is a different block and does not belong here.
 *
 * The badge is `aria-hidden` and the icon is decorative — all meaning is in
 * `copy`, so `copy` must stand alone.
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
