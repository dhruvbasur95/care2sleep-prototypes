import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The one search field. Every table toolbar in the dashboard uses it — Trainee
 * Management, Consumer Management, Coach Management, and the coach record's
 * consumer caseload. Do not hand-roll another; two variants of this drifted
 * apart once already.
 *
 * `label` is a real `<label htmlFor={id}>`, always rendered, always `sr-only`.
 * The placeholder already says what the field searches, so a visible caption
 * repeating it is clutter — but the label is what a screen reader announces,
 * so it must stay in the DOM. `id` must therefore be unique per mounted
 * instance.
 *
 * The component is fully controlled: it owns no state, and the caller decides
 * whether the query lives in page state or in the store.
 */
export function SearchInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  widthClassName = 'sm:w-[280px]',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  /**
   * The field's width at `sm`+, applied to the **wrapper**.
   *
   * Width must go here and never on the inner `<input>`, which is `w-full` by
   * design. Putting a `sm:w-*` on the input instead caps the field at that
   * width inside whatever box the wrapper was given, leaving visible dead
   * space beside it — and if both carry one, they collide at equal CSS
   * specificity and the winner depends on stylesheet order.
   *
   * Default is 280px; every current caller passes `sm:w-[340px]`.
   */
  widthClassName?: string
}) {
  return (
    <div className={cn('flex w-full flex-col gap-1', widthClassName, className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-full border border-hairline bg-card pr-4 pl-10 text-caption text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  )
}
