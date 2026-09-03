import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

/**
 * Thin rule between rows in a definition list or a stacked form section.
 * Wraps base-ui's `Separator`, which emits the correct `role="separator"` /
 * `aria-orientation` for a decorative or semantic divider.
 *
 * Used by `AddCoachTraineeModal`'s review sections and the three record/profile
 * pages' `dl` field lists. Most dividers in the app are a plain `border-t
 * border-hairline` on the element itself; reach for this only when the rule
 * needs to be its own node (e.g. between mapped list items, where a border
 * would also draw on the first or last one).
 */
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
