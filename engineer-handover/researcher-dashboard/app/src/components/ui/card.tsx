import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The one card primitive. Every card surface in the dashboard is this
 * component plus utility classes — there is no `CardHeader`/`CardContent`
 * sub-component API, and adding one back would be a mistake.
 *
 * The house card pattern is: a `bg-card-header` band as the card's **first
 * child**, then a `border-t border-hairline` divider, then the content
 * section. Stock shadcn's `CardHeader`/`CardContent` pair does not produce
 * that shape, so importing it would silently diverge from all ~50 existing
 * cards. If you want a sub-component API, build one that encodes the
 * header-band pattern rather than restoring the shadcn parts.
 *
 * Defaults every card gets, so no call site should repeat them:
 * 16px outer radius, a 1px `parchment` stroke, and `shadow-card`.
 *
 *  - The outline is a **border, not a ring**. A ring paints outside the box;
 *    a border is part of it, which is what the design calls for and what
 *    makes `overflow-hidden` clip a full-bleed child band to the corner
 *    radius. Do not swap it back to `ring-*`.
 *  - A card that genuinely wants no outline passes `border-0` explicitly, and
 *    one that wants no shadow passes `shadow-none`. Absence is opt-in.
 *
 * `size="sm"` only tightens the internal `--card-spacing`; it changes nothing
 * else.
 */
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl border border-parchment bg-card py-(--card-spacing) text-sm text-card-foreground shadow-card [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

export { Card }
