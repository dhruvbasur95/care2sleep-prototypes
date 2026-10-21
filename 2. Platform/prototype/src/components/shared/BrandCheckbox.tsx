import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The app's checkbox: a 28px rounded box in the brand purple with a white
 * tick. It began as the Research Dashboard's own notification checkbox
 * (`SpacesCoachProfilePage`) and moved here on its second caller (direct
 * instruction, 2026-10-21: the trainee/coach profile's native 16px boxes were
 * *"not consistent to researcher dash"*). One definition, so the two cannot
 * drift again.
 *
 * A real `<input type="checkbox">` with `appearance-none`, so keyboard,
 * form and screen-reader behaviour are the browser's own; the tick is a
 * decorative glyph shown by `peer-checked`.
 */
export function BrandCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
  className,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Read-only display (e.g. a withdrawn coach's record): still shows the
   *  value, cannot change it. */
  disabled?: boolean
  className?: string
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 text-caption text-ink',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative inline-flex size-7 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-7 shrink-0 cursor-pointer appearance-none rounded-[6px] border border-hairline bg-card outline-none transition-colors checked:border-purple-500 checked:bg-purple-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Check
          aria-hidden="true"
          className="pointer-events-none absolute size-4 text-white opacity-0 peer-checked:opacity-100"
          strokeWidth={2.25}
        />
      </span>
      {label}
    </label>
  )
}
