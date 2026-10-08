import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Inert Round 1 placeholder — design-tokens.md §7 `placeholder-card`.
 * Deliberately non-interactive: no press state, not focusable, and the
 * visible tag says why. Must not read as a broken button.
 */
export function PlaceholderCard({
  icon: Icon,
  title,
  body,
  tag,
}: {
  icon: LucideIcon
  title: string
  body: string
  tag: string
}) {
  return (
    <Card className="gap-0 rounded-lg bg-pearl py-0">
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-divider-soft"
          >
            <Icon className="size-5 text-ink-faint" strokeWidth={1.75} />
          </span>
          <Badge
            variant="secondary"
            className="rounded-full border border-hairline bg-card px-2.5 text-fine text-ink-faint"
          >
            {tag}
          </Badge>
        </div>
        <div className="space-y-1">
          <h3 className="text-body leading-[1.24] font-semibold tracking-[-0.374px] text-ink-muted">
            {title}
          </h3>
          <p className="text-caption text-ink-faint">{body}</p>
        </div>
      </div>
    </Card>
  )
}
