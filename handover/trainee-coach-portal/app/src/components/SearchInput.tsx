import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shared search-field pattern (pill input, leading icon) — originally the
 * Research Dashboard's Coach roster search (Round 2.1); now the one
 * search-field component every table toolbar reuses, rather than each area
 * hand-rolling its own variant (Round 6.1.1, Coach Delivery Portal's
 * consumers table).
 *
 * `label` is kept as a real `<label htmlFor>` for screen readers but never
 * shown visibly (`sr-only`) — direct instruction: a caption reading "Search"
 * sitting above a field whose own placeholder already says "Search
 * coaches…"/"Search your consumers…" is redundant, purely decorative
 * clutter once you can see the field, not a second source of information.
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
  /** Round 21 — the field's own width at `sm`+ .
   *
   *  This used to be hardcoded as `sm:w-[280px]` on the `<input>` itself, which
   *  silently capped the field at 280px no matter what width its wrapper was
   *  given: Trainee Management asked for a 340px field (per its Figma frame) and
   *  got a 280px input sitting in a 340px box with 60px of dead space to its
   *  right — the "empty space?" defect. Moving the width up to the wrapper as a
   *  real prop lets a caller change it without two competing `sm:w-*` classes
   *  fighting at equal CSS specificity, where the winner depends on stylesheet
   *  order rather than intent. Default matches the previous behaviour, so the
   *  Coach Delivery Portal's call site is unchanged. */
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
