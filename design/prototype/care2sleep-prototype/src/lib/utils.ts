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
        "text-display-sm",
        "text-sub-greeting",
        "text-sub-greeting-semibold",
        "text-title",
        "text-body-md",
        "text-body",
        "text-caption-medium",
        "text-caption",
        "text-fine",
        // Consumer Portal only — defined in `consumer-tokens.css`, not
        // `index.css`. Same rule applies: it must be listed here or it is
        // dropped wherever `cn()` also passes a text colour.
        "text-consumer-lead",
        "text-consumer-heading",
        "text-consumer-card-title",
        // Round 43 — the flat 22 previous-lesson title. See `consumer-tokens.css`.
        "text-consumer-card-title-sm",
        // The fluid steps added with the mobile frame (`787:1286`). Each is a
        // `clamp()` spanning 375 -> 1200, so there is no longer a paired
        // `md:`/`-lg` half to register alongside them — see the block comment
        // in `consumer-tokens.css`. `text-consumer-card-title-lg` was deleted
        // there and is deliberately not listed here.
        "text-consumer-display",
        "text-consumer-lesson",
        "text-consumer-eyebrow",
        "text-consumer-chip",
        // Round 48 — the flat 16/600 emphasis line under a card intro.
        "text-consumer-body-strong",
        // Round 44 — the sleep diary flow's own steps. See `consumer-tokens.css`.
        "text-consumer-question",
        "text-consumer-answer-name",
        "text-consumer-progress",
        "text-consumer-unit",
        // Round 49 — Need Help's own steps. See `consumer-tokens.css`.
        "text-consumer-section",
        "text-consumer-body",
        "text-consumer-faq",
        "text-consumer-crisis",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
