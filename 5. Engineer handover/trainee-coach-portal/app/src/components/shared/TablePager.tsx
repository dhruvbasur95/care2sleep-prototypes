import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Table pager — a "1-10 of 24" range followed by first / previous / next / last.
 *
 * **36px hit areas, not the 22px the reference shows.** Round 21's own audit
 * caught a pagination control at 22px, under WCAG 2.2's 24px floor, and this
 * project's control floor is 36px regardless. The chevrons inside stay 16px, so
 * it still reads as small chrome.
 *
 * The range label is a live region: paging changes the table's whole contents
 * with no other announcement, so without it a screen-reader user gets silence.
 * Buttons are disabled at the ends rather than hidden — a control that vanishes
 * shifts the other three under the pointer mid-click.
 */
export function TablePager({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel = 'items',
}: {
  /** Zero-based. */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** Plural noun for the accessible range description, e.g. "notes". */
  itemLabel?: string
}) {
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1)
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  const atStart = page <= 0
  const atEnd = page >= lastPage

  const btn =
    'inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-ink outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-ink-faint disabled:opacity-40 disabled:hover:bg-transparent'

  return (
    <div className="flex items-center justify-end gap-2">
      <p aria-live="polite" className="mr-2 text-caption text-ink-muted">
        {from}–{to} of {total}
        <span className="sr-only"> {itemLabel}</span>
      </p>
      <button
        type="button"
        onClick={() => onPageChange(0)}
        disabled={atStart}
        aria-label="First page"
        className={cn(btn)}
      >
        <ChevronFirst aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={atStart}
        aria-label="Previous page"
        className={cn(btn)}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={atEnd}
        aria-label="Next page"
        className={cn(btn)}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onPageChange(lastPage)}
        disabled={atEnd}
        aria-label="Last page"
        className={cn(btn)}
      >
        <ChevronLast aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
