/**
 * Shared button styles that CLAUDE.md's own Buttons row does not name.
 *
 * That row lists three canonical styles — primary filled, primary outline and
 * utility — and says nothing about a **ghost** button: no fill, no border, the
 * label alone. The app has one anyway, in footers and inline actions, and the
 * silence is exactly why three different versions of it grew in three
 * different rounds before anyone compared them.
 */

/**
 * The app-wide **ghost button**.
 *
 * Two rules, both direct instructions (2026-10-05):
 *
 * 1. **Hover is an underline and nothing else** — *"the color remains same as
 *    default state, on hover there is an underline. Colors remains as is for
 *    what they are, where they are."* No fill, no colour shift. The colour is
 *    the call site's to choose; the hover is not.
 * 2. **The shape is the pill** — chosen from a side-by-side of the two
 *    variants that existed: an 81x44 `rounded-full` pill (1 site, the trainee
 *    reflection modal) against a 45x44 bare text label (6 sites, five
 *    wizards). *"always go with option A."*
 *
 * ⚠️ This replaced `hover:bg-parchment` at the reflection modal, which was
 * **painting nothing at all**: `--color-parchment`, `--color-pearl`,
 * `--color-divider-soft`, `--muted` and `--secondary` are all `#f5f5f7`, and
 * the button sits on the `bg-pearl` `MODAL_FOOTER_SURFACE`. Rasterised through
 * a 1x1 canvas, the footer and the hover target were the identical
 * `rgb(245,245,247)`. The class was in the DOM and the pixels never moved.
 *
 * **`min-h-11`, not `h-11`**, so a wrapped label grows the box rather than
 * overflowing it — and because every call site already used `min-h-11`, this
 * changes no footer's height. What it does change is the label's inset: the
 * pill's `px-[18px]` moves it 18px in from the footer's content edge, which is
 * what option A looks like.
 *
 * Note the height is deliberately **44px against the research wizards' 36px
 * primary buttons**. That mismatch is pre-existing — those cancels were
 * already `min-h-11` — and 36px is CLAUDE.md's floor, not its cap.
 *
 * Colour is NOT baked in. Compose it: `cn(GHOST_BUTTON, 'text-ink-muted')`.
 */
export const GHOST_BUTTON =
  'inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-[18px] text-caption-medium outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring'

/** The footer cancel every wizard-shaped modal shares: `GHOST_BUTTON` in the
 *  app's muted ink. Split out so a call site reads as what it is rather than
 *  repeating the colour six times. */
export const GHOST_BUTTON_MUTED = `${GHOST_BUTTON} text-ink-muted`

/**
 * The two **pill buttons** a wizard footer pairs with the ghost cancel.
 *
 * Extracted at their second caller (Round 55): both reflection wizards now use
 * them, where they had been a copy of the same two strings in each file. They
 * are CLAUDE.md's canonical "primary filled" and "primary outline", at the
 * 44px the reflection modals use rather than the research wizards' 36px —
 * 36px is that rule's floor, not its cap, and these sit beside a 44px
 * `GHOST_BUTTON`.
 *
 * `min-w-[120px]` keeps Back and Next the same width as each other when their
 * labels are not: a footer whose two controls jump size between screens reads
 * as the layout shifting rather than the step changing.
 *
 * The disabled fill on `PILL_PRIMARY` is for a genuinely unavailable control.
 * ⚠️ Do **not** reach for `disabled` inside a focus-trapped modal — the traps
 * query `button:not([disabled])`, so a button that disables while focused drops
 * focus to `<body>` and silently changes the trap's last element. Use
 * `aria-disabled` with a no-op handler, which is also what CLAUDE.md already
 * mandates for unwired controls.
 */
export const PILL_PRIMARY =
  'inline-flex h-11 min-w-[120px] shrink-0 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-ink-faint'

export const PILL_OUTLINE =
  'inline-flex h-11 min-w-[120px] shrink-0 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring'

/**
 * The **help button** — a red outline pill with a question-mark glyph.
 *
 * Extracted at its second caller (Round 55) from `NeedHelpButton` in
 * `DeliveryHomePage`, where it arrived 2026-10-01 by direct instruction to
 * match the Consumer Portal's own Need help control. Outline rather than
 * filled for the reason it exists: a solid red block at this size reads as an
 * error state, where the control is an offer of help. `destructive` measures
 * 4.80:1 on white, so the label clears AA.
 *
 * Nothing consumer-scoped leaks either way — `destructive` and `text-body-md`
 * are app-wide tokens the Consumer Portal happens to share.
 *
 * The caller supplies the glyph (`MessageCircleQuestionMark`, `size-5`) and the
 * label. Note the home-page instance is deliberately **inert** — there is no
 * coach help destination — while the transcript step's is a real button that
 * opens a dialog; the styling is shared, the behaviour is not.
 */
export const HELP_BUTTON =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-3xl border border-destructive bg-white px-5 text-body-md text-destructive outline-none transition-all hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 active:scale-[0.97]'
