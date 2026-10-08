import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Plain `twMerge` doesn't know about this project's custom named font-size
 * scale (`text-caption`, `text-fine`, etc. — defined via `--text-*` in
 * `index.css`'s `@theme`, per design-tokens.md §2). Tailwind generates real
 * `text-caption`/`text-fine`/`text-title`/`text-body`/`text-display-*`
 * utilities from those tokens, but tailwind-merge's default config has no
 * way to know they're font-size (not colour) utilities, so it silently
 * drops one of them whenever a call site merges e.g. `text-caption` with a
 * colour class like `text-ink-muted` (both start with `text-`, so it
 * bucketed them into the same "conflicting" group and kept only the last).
 * Registering them under the `font-size` group fixes that at the root
 * rather than reworking every call site that combines size + colour.
 */
/**
 * ⚠️ **This list must contain EVERY `--text-*` step in `index.css`.** A token
 * missing from it is not a cosmetic problem — it is silently dropped at any
 * `cn()` call site that also passes a text colour, and the element falls back
 * to inherited type with no error anywhere. Round 21.3 rewrote the type scale
 * and this list was not updated with it, so `text-body-md` on the trainee
 * Contact-details values rendered 14px/400 instead of 16px/600. Caught by
 * reading `getComputedStyle`, not by looking — the class was right there in
 * the markup the whole time. Add the token here in the same commit that adds
 * it to `index.css`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display-xl",
        "text-display-lg",
        "text-display-md",
        "text-sub-greeting",
        "text-sub-greeting-semibold",
        "text-title",
        "text-body-md",
        "text-body",
        "text-caption-medium",
        "text-caption",
        "text-fine",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
