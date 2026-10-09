import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
 *
 * ## Why the ends are `aria-disabled`, not `disabled`
 *
 * The real `disabled` attribute removes a control from the tab order, and the
 * browser **blurs it the instant the attribute appears**. Tab to "Next page",
 * press it until you reach the last page, and focus lands on `<body>` — the
 * keyboard user's place in the page is gone, and a screen reader simply stops
 * announcing. Measured 2026-10-08 on the Research Home attention list.
 *
 * `aria-disabled` keeps the control focusable and announced as unavailable, so
 * focus stays exactly where the user put it. The trade is that the click still
 * fires, so **every handler guards its own edge** — without that, "Next" at the
 * last page would call `onPageChange(lastPage + 1)`.
 *
 * This is the project's most-repeated defect class (focus falling to `<body>`),
 * and `buttonStyles.ts` already recommended this exact fix for controls inside
 * a focus trap. The paint is unchanged — the `disabled:` utilities simply moved
 * to their `aria-disabled:` equivalents.
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

  /**
   * Ghost icon, neutral tone, **36px** — direct instruction 2026-10-09, aligning
   * the app to the Figma frames rather than the other way round.
   *
   * ⚠️ This deliberately overrides the button system's `icon` size (40). The
   * 36px step was retired app-wide in Round 28, so `size-9` here is a local
   * exception, not a return to that step — do not copy it onto other controls.
   * It still clears WCAG 2.2's 24px minimum and this project's own 36px
   * control floor, so nothing is lost on the accessibility side; what changes
   * is that a pager button is now 4px smaller than every other icon button.
   */
  const PAGER_BUTTON = {
    variant: 'ghost',
    tone: 'neutral',
    size: 'icon',
    className:
      'size-9 aria-disabled:cursor-not-allowed aria-disabled:text-ink-faint aria-disabled:opacity-40',
  } as const

  return (
    <div className="flex items-center justify-end gap-2">
      <p aria-live="polite" className="mr-2 text-caption text-ink-muted">
        {from}–{to} of {total}
        <span className="sr-only"> {itemLabel}</span>
      </p>
      <Button
        type="button"
        onClick={() => {
          if (atStart) return
          onPageChange(0)
        }}
        aria-disabled={atStart}
        aria-label="First page"
        {...PAGER_BUTTON}
      >
        <ChevronFirst aria-hidden="true" className="size-4" strokeWidth={2.25} />
      </Button>
      <Button
        type="button"
        onClick={() => {
          if (atStart) return
          onPageChange(page - 1)
        }}
        aria-disabled={atStart}
        aria-label="Previous page"
        {...PAGER_BUTTON}
      >
        <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.25} />
      </Button>
      <Button
        type="button"
        onClick={() => {
          if (atEnd) return
          onPageChange(page + 1)
        }}
        aria-disabled={atEnd}
        aria-label="Next page"
        {...PAGER_BUTTON}
      >
        <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.25} />
      </Button>
      <Button
        type="button"
        onClick={() => {
          if (atEnd) return
          onPageChange(lastPage)
        }}
        aria-disabled={atEnd}
        aria-label="Last page"
        {...PAGER_BUTTON}
      >
        <ChevronLast aria-hidden="true" className="size-4" strokeWidth={2.25} />
      </Button>
    </div>
  )
}
