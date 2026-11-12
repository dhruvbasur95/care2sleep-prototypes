import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Previous chevron · pagination dots · next chevron — the Consumer Portal's one
 * horizontal-scroller control.
 *
 * Extracted verbatim from `SessionPlanStrip` at its second caller
 * (`ClientGoalsCard`, 2026-11-12; direct instruction: the goals card's chevrons
 * "should visually match how we have done for tablet view for session plan").
 * The geometry, the dots and their animation are unchanged; see the strip's
 * history for why each number is what it is.
 *
 * What changed on extraction, on direct instruction ("make sure the bottom
 * right chevrons have deactive, hover, and click states"):
 *
 *   - **Deactive** is the button system's own `state: 'deactive'` paint (white,
 *     `hairline` stroke, `ink-faint` glyph), replacing the strip's
 *     `disabled:opacity-40` — a fade the system does not use anywhere else.
 *   - It is `aria-disabled`, **not** `disabled`. A chevron reaches its end
 *     while it has focus (the user is pressing it), and a `disabled` button
 *     drops focus to `<body>` — this project's most-repeated defect. The click
 *     is ignored instead, and the button stays focusable.
 *   - **Hover** and **click** (`active:scale-[0.97]`) come from the system.
 *     The deactive arm cancels the press so an inert control does not move.
 *
 * `nextVariant: 'primary'` (the goals card, 2026-11-12: "make right chevron
 * primary style"): next is the solid button, and at the end of the row it
 * takes the system's own primary deactive. Previous stays the outline one —
 * a variant that moved the solid fill to previous at the end was tried and
 * declined the same day ("actually no this is fine").
 */

/* The shape classes are repeated inside each `cn(buttonVariants(...))` on
   purpose: hoisted into their own constant they read to `guard:buttons` as a
   hand-written button recipe (pill radius + height, no system call). */
const CHEVRON = cn(
  buttonVariants({ variant: 'secondary', size: 'icon', surface: 'consumer' }),
  'flex size-12 rounded-full transition-colors',
)
const CHEVRON_PRIMARY = cn(
  buttonVariants({ variant: 'primary', size: 'icon', surface: 'consumer' }),
  'flex size-12 rounded-full transition-colors',
)
const CHEVRON_DEACTIVE = cn(
  buttonVariants({ variant: 'secondary', state: 'deactive', size: 'icon', surface: 'consumer' }),
  'flex size-12 rounded-full transition-colors',
  'active:scale-100',
)
const CHEVRON_PRIMARY_DEACTIVE = cn(
  buttonVariants({ variant: 'primary', state: 'deactive', size: 'icon', surface: 'consumer' }),
  'flex size-12 rounded-full transition-colors',
  'active:scale-100',
)

export function CarouselNav({
  count,
  active,
  atStart,
  atEnd,
  onStep,
  onGoTo,
  previousLabel,
  nextLabel,
  dotLabel,
  showDots = true,
  nextVariant = 'secondary',
  className,
}: {
  count: number
  active: number
  atStart: boolean
  atEnd: boolean
  onStep: (direction: 1 | -1) => void
  onGoTo: (index: number) => void
  previousLabel: string
  nextLabel: string
  dotLabel: (index: number) => string
  /** The goals card hides them (direct instruction, 2026-11-12). */
  showDots?: boolean
  nextVariant?: 'secondary' | 'primary'
  className?: string
}) {
  const previousClass = atStart ? CHEVRON_DEACTIVE : CHEVRON
  const nextClass =
    nextVariant === 'primary'
      ? atEnd ? CHEVRON_PRIMARY_DEACTIVE : CHEVRON_PRIMARY
      : atEnd ? CHEVRON_DEACTIVE : CHEVRON

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        onClick={() => !atStart && onStep(-1)}
        aria-disabled={atStart || undefined}
        aria-label={previousLabel}
        className={previousClass}
      >
        <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </button>

      {/* Real buttons: each jumps to its own item. The visible dot is 10px but
          the control is 24 x 36 (WCAG 2.2 2.5.8, and this app's 36px floor). */}
      {showDots && (
        <ol className="flex items-center gap-1">
          {Array.from({ length: count }, (_, i) => {
            const isActive = i === active
            return (
              <li key={i} className="flex">
                <button
                  type="button"
                  onClick={() => onGoTo(i)}
                  aria-label={dotLabel(i)}
                  aria-current={isActive ? 'true' : undefined}
                  className="flex h-9 w-6 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-2.5 rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none',
                      isActive ? 'w-7 bg-consumer-primary' : 'w-2.5 bg-hairline',
                    )}
                  />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <button
        type="button"
        onClick={() => !atEnd && onStep(1)}
        aria-disabled={atEnd || undefined}
        aria-label={nextLabel}
        className={nextClass}
      >
        <ChevronRight aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </button>
    </div>
  )
}
