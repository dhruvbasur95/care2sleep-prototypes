/**
 * ⚠️ **This module no longer defines anything.**
 *
 * The app's button system is `buttonSystem.ts` — one
 * `btn({ variant, tone, state, size, surface })`. See `design-tokens.md` §99
 * for the spec and CLAUDE.md's Buttons row for the standing rule.
 *
 * The names below are the pre-2026-10-07 vocabulary. They survive only as
 * **thin wrappers over `btn()`**, so there is exactly one definition of each
 * treatment and no second system to drift from — direct instruction,
 * 2026-10-07: *"there is no old redundant button system in documentation"*. The
 * same applies to the code: a constant that re-states a class string **is** a
 * second system, whatever the comment above it says.
 *
 * **Do not add to this file.** New call sites take `btn(...)` directly. These
 * exist so the migration can run surface by surface rather than as one
 * unreviewable sweep, and each should disappear as its callers move.
 */
import { btn } from './buttonSystem'

/**
 * Was: the app-wide ghost button, colour supplied by the call site via
 * `cn(GHOST_BUTTON, 'text-…')`.
 *
 * Now `ghost` at the app's own height. The hover is still an underline and
 * nothing else — that rule moved into the system rather than being restated
 * here. Callers that compose a colour on top still work: `cn()` resolves the
 * later text colour over the tone's own.
 *
 * ➜ Replace with `btn({ variant: 'ghost', tone: … })`.
 */
export const GHOST_BUTTON = btn({ variant: 'ghost' })

/**
 * Was: the wizard-footer cancel — ghost, muted ink. The Cancel in all six
 * wizard footers and the reflection modal.
 *
 * ➜ Replace with `btn({ variant: 'ghost', tone: 'neutral' })`.
 */
export const GHOST_BUTTON_MUTED = btn({ variant: 'ghost', tone: 'neutral' })

/**
 * Was: the filled pill a wizard footer pairs with the ghost cancel.
 *
 * `min-w-[120px]` stays at this alias rather than folding into the system: it
 * exists so Back and Next keep the same width when their labels do not, which
 * is a footer-layout concern, not a property of the button.
 *
 * ⚠️ Do **not** reach for `disabled` inside a focus-trapped modal — the traps
 * query `button:not([disabled])`, so a button that disables while focused drops
 * focus to `<body>` and silently changes the trap's last element. Use
 * `aria-disabled` with a no-op handler (which CLAUDE.md already mandates for
 * unwired controls) and `state: 'deactive'` for the paint.
 *
 * ➜ Replace with `cn(btn(), 'min-w-[120px]')`.
 */
export const PILL_PRIMARY = `${btn({ variant: 'primary' })} min-w-[120px]`

/** Was: the outline pill beside it. ➜ `cn(btn({ variant: 'secondary' }), 'min-w-[120px]')`. */
export const PILL_OUTLINE = `${btn({ variant: 'secondary' })} min-w-[120px]`

/**
 * Was: "Outline filled" — the treatment the Research Dashboard's utility
 * buttons moved onto on 2026-10-07, before the system existed.
 *
 * ➜ Replace with `btn({ variant: 'secondary' })`, which is the same thing.
 */
export const OUTLINE_FILLED_BUTTON = btn({ variant: 'secondary' })

/**
 * The **help button** — a red secondary pill with a question-mark glyph.
 *
 * Expressed through the system on the `consumer` surface, which is where its
 * 48px height and 16/600 label come from. Secondary rather than primary for the
 * reason it exists: a solid red block at this size reads as an error state,
 * where the control is an offer of help.
 *
 * The caller supplies the glyph (`MessageCircleQuestionMark`, `size-5`) and the
 * label. The coach home instance is deliberately **inert** — there is no coach
 * help destination — while the transcript step's is a real button; the styling
 * is shared, the behaviour is not.
 *
 * ➜ Replace with
 * `btn({ variant: 'secondary', tone: 'destructive', surface: 'consumer' })`.
 */
export const HELP_BUTTON = btn({
  variant: 'secondary',
  tone: 'destructive',
  surface: 'consumer',
})
