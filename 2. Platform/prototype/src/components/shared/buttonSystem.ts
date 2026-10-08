/**
 * The app's unified button system — all four portals.
 *
 * ## Why
 *
 * Direct instruction, 2026-10-07: *"you need to reconsider buttons system in
 * app here first — its all over the place"*, *"simplify the button design
 * system"*, *"hence we to create a unified button system"*, and the shape it
 * should take: *"Primary, secondary, ghost, each with static, hover, deactive
 * state"*.
 *
 * Measured before rewriting: the **researcher-facing files alone** held **50
 * distinct button class signatures** — pill / 8px / 16px shapes, nine different
 * fills (`primary`, `pearl`, `card`, `white`, `purple-50`, `purple-200`,
 * `purple-500`, `success`, `primary/40`), and one action ("Edit details")
 * rendered four different ways on four pages.
 *
 * ## The system
 *
 * Five axes, and nothing else:
 *
 * | axis | values | what it means |
 * |---|---|---|
 * | `variant` | `primary` · `secondary` · `ghost` | the weight: solid fill · 1px stroke · label alone |
 * | `tone` | `brand` · `destructive` · `success` · `neutral` · `inverse` · `ink` | the colour. **A colour is not a variant.** |
 * | `state` | `static` · `hover` · `deactive` | mirrors Figma's own `State` axis |
 * | `size` | `sm` 36 · `lg` 44 · `xl` 48 · `icon` · `icon-lg` | 36px is the floor, not the cap |
 * | `surface` | `app` · `consumer` | which portal's brand and type scale |
 *
 * **A colour is not a variant.** That single rule is what collapses the old
 * set: `Utility`, `Utility outline`, `White filled`, `White outline`, `Outline
 * filled`, `Destructive`, `Destructive outline`, `Destructive outline r8`,
 * `Success` and `Quick action` were ten names for three variants in five
 * colours. There is no "destructive button" — there is a `primary` button in
 * the `destructive` tone.
 *
 * **An icon is a slot, not a variant.** The base sets `gap-2`; the caller
 * renders the glyph. `size: 'icon'` is for a control whose *only* content is a
 * glyph — a different shape, not a different style.
 *
 * **`state` is real, not just for the showcase.** `static` carries the hover
 * treatment as a `hover:` pseudo-class, which is what ships. `hover` pins that
 * same treatment on, so a spec page can draw the state without a mouse, and so
 * Figma's `State=Hover` variants can be mirrored from one source rather than
 * transcribed. `deactive` is the disabled look; pair it with `disabled` or
 * `aria-disabled` so it is more than paint.
 *
 * ## Rules folded in, so a call site cannot get them wrong
 *
 * - **36px floor** (`sm`), enforced in Rounds 3.1 / 10 / 18.
 * - **`secondary` carries `bg-white`, not a transparent fill.** Most sit on a
 *   `purple-50` card-header band, where a transparent pill lets the tint through
 *   and reads as a different control from the same button on a white card. The
 *   `inverse` tone is the deliberate exception — it is *for* a coloured band.
 * - **Hover on `secondary` is `/10`, not `/5`.** Over white, `/5` composites to
 *   about a 9-per-channel shift: in the DOM, invisible on screen (Round 28).
 * - **`ghost`'s hover is an underline and nothing else** — direct instruction,
 *   2026-10-05: *"the color remains same as default state, on hover there is an
 *   underline."*
 * - **Never `bg-pearl`.** `--color-pearl`, `--color-parchment`,
 *   `--color-divider-soft`, `--muted` and `--secondary` are all `#f5f5f7`, so
 *   `bg-pearl hover:bg-divider-soft` repaints the identical colour, and the cool
 *   grey reads as a foreign patch on the warm `#fffcfa` canvas. **There is no
 *   grey-filled slot in this system** — that was the `Utility` button, and it is
 *   gone.
 * - **The Consumer Portal keeps its own brand.** `surface: 'consumer'` never
 *   emits `--primary`, `text-caption-*` or `ring-ring`. CLAUDE.md's rule is
 *   about provenance, not the painted colour — `--color-consumer-primary` holds
 *   the same hex today and that is deliberate.
 */

import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonTone = 'brand' | 'destructive' | 'success' | 'neutral' | 'inverse' | 'ink'
export type ButtonState = 'static' | 'hover' | 'deactive'
export type ButtonSize = 'md' | 'lg' | 'icon' | 'icon-lg'
export type ButtonSurface = 'app' | 'consumer'

export const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost']
export const BUTTON_TONES: ButtonTone[] = ['brand', 'destructive', 'success', 'neutral', 'inverse', 'ink']
export const BUTTON_STATES: ButtonState[] = ['static', 'hover', 'deactive']
export const BUTTON_SIZES: ButtonSize[] = ['md', 'lg', 'icon', 'icon-lg']

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none transition-all focus-visible:ring-2 active:scale-[0.97] disabled:pointer-events-none aria-disabled:cursor-not-allowed'

const SURFACE: Record<ButtonSurface, string> = {
  app: 'rounded-full text-caption-medium focus-visible:ring-ring',
  // `rounded-[28px]`, NOT `rounded-3xl` (24). Measured from the running
  // Consumer Portal, where every CTA is 48px at a 28px radius — a true pill at
  // that height. Figma's consumer CTAs are r28 too; the system was the one out.
  consumer: 'rounded-[28px] text-body-md focus-visible:ring-consumer-primary',
}

/**
 * Two heights, not five.
 *
 * Direct instruction, 2026-10-07: *"for Sizes, keep researcher, trainee, and
 * coaches button size same at 44"*, then revised to **40** the same day — so there is no 36px step any more. 36 was
 * CLAUDE.md's floor, and the three staff portals had drifted across 32 / 36 /
 * 44 for the same kind of action. One height per surface removes the choice.
 *
 * 40 still clears the old 36px floor and WCAG 2.2's 24px minimum (2.5.8); the
 * 44px AAA target (2.5.5) was never this project's bar.
 *
 * The Consumer Portal keeps 48, which Round 46 already unified every CTA to.
 */
const SIZE: Record<ButtonSize, string> = {
  /** 40 — researcher, trainee, coach. */
  md: 'h-10 px-[18px]',
  /** 48 — consumer. */
  lg: 'h-12 px-5',
  icon: 'size-10 px-0',
  'icon-lg': 'size-12 px-0',
}

/** The shape of each variant, independent of colour. */
const SHAPE: Record<ButtonVariant, string> = {
  primary: 'border border-transparent',
  secondary: 'border',
  ghost: 'border border-transparent',
}

/**
 * Colour, per surface / variant / tone.
 *
 * `rest` is the resting paint, `hover` the hovered paint. They are declared
 * separately so `state: 'static'` can emit `hover:`-prefixed classes while
 * `state: 'hover'` emits the same classes bare — one definition, two renderings,
 * no chance of a spec page drifting from what ships.
 *
 * ⚠️ A solid tone's hover must DARKEN, never fade. `bg-success/90` composites to
 * `rgb(53,138,75)` over white, and white on that measures **4.30:1** — the resting
 * state is 4.67:1, so fading the fill walked a passing button under AA on hover.
 * Measured from painted pixels on the spec page. `color-mix(... black 12%)` moves
 * the other way and keeps every solid tone above 4.5:1 in both states.
 *
 * A missing combination falls back to the tone's `brand` entry rather than
 * rendering an unstyled button; the showcase lists which are real.
 */
type Paint = { rest: string; hover: string }

const PAINT: Record<ButtonSurface, Record<ButtonVariant, Partial<Record<ButtonTone, Paint>>>> = {
  app: {
    primary: {
      brand: { rest: 'bg-primary text-white', hover: 'bg-primary-hover' },
      destructive: { rest: 'bg-destructive text-white', hover: 'bg-[color-mix(in_oklch,var(--color-destructive),black_12%)]' },
      success: { rest: 'bg-success text-white', hover: 'bg-[color-mix(in_oklch,var(--color-success),black_12%)]' },
      // A white pill on a brand band — Research Home's quick actions.
      inverse: { rest: 'bg-white text-primary-hover', hover: 'bg-purple-50' },
      // No `neutral` fill on purpose: a grey-or-white solid on a white card is
      // invisible as a button, and that slot was the old `Utility` treatment.
      // A quiet action is `secondary · neutral`, which has a stroke to be seen by.
    },
    secondary: {
      brand: { rest: 'bg-white border-primary text-primary', hover: 'bg-primary/10' },
      destructive: { rest: 'bg-white border-destructive text-destructive', hover: 'bg-destructive/10' },
      success: { rest: 'bg-white border-success text-success', hover: 'bg-success/10' },
      neutral: { rest: 'bg-white border-hairline text-ink', hover: 'bg-purple-50' },
      inverse: { rest: 'bg-transparent border-white text-white', hover: 'bg-white/10' },
    },
    ghost: {
      brand: { rest: 'text-primary', hover: 'underline' },
      destructive: { rest: 'text-destructive', hover: 'underline' },
      success: { rest: 'text-success', hover: 'underline' },
      neutral: { rest: 'text-ink-muted', hover: 'underline' },
      inverse: { rest: 'text-white', hover: 'underline' },
    },
  },
  consumer: {
    primary: {
      brand: { rest: 'bg-consumer-primary text-white', hover: 'bg-[color-mix(in_oklch,var(--color-consumer-primary),black_12%)]' },
      // The Consumer Portal's black CTA — "Play module" on a module card, where
      // the button sits on cover art and the brand purple would compete with it.
      ink: { rest: 'bg-ink text-white', hover: 'opacity-90' },
      destructive: { rest: 'bg-destructive text-white', hover: 'bg-[color-mix(in_oklch,var(--color-destructive),black_12%)]' },
      inverse: { rest: 'bg-white text-consumer-primary', hover: 'bg-purple-50' },
    },
    secondary: {
      brand: { rest: 'bg-white border-consumer-primary text-consumer-primary', hover: 'bg-purple-50' },
      destructive: { rest: 'bg-white border-destructive text-destructive', hover: 'bg-destructive/10' },
      inverse: { rest: 'bg-transparent border-white text-white', hover: 'bg-white/10' },
    },
    ghost: {
      brand: { rest: 'text-consumer-primary', hover: 'underline' },
      destructive: { rest: 'text-destructive', hover: 'underline' },
      neutral: { rest: 'text-ink-muted', hover: 'underline' },
    },
  },
}

/** The disabled look, per variant. Paint only — pair it with a real
 *  `disabled`/`aria-disabled`, or it is a lie to assistive tech. */
const DEACTIVE: Record<ButtonVariant, string> = {
  primary: 'bg-ink-faint text-white border-transparent cursor-not-allowed',
  secondary: 'bg-white border-hairline text-ink-faint cursor-not-allowed',
  ghost: 'text-ink-faint cursor-not-allowed',
}

/**
 * The disabled look **on a brand-coloured band**.
 *
 * `ink-faint` on `primary` measures **2.28:1** — found by rasterising the
 * painted pixels of the spec page, not by reading the token. A disabled control
 * is exempt from WCAG 1.4.3, but 2.28:1 is not "muted", it is gone; a coach
 * cannot tell the control exists. White at 40%/55% keeps it legibly present and
 * still obviously unavailable against the 100% static state beside it.
 */
const DEACTIVE_INVERSE: Record<ButtonVariant, string> = {
  primary: 'bg-white/25 text-white/70 border-transparent cursor-not-allowed',
  secondary: 'bg-transparent border-white/40 text-white/55 cursor-not-allowed',
  ghost: 'text-white/55 cursor-not-allowed',
}

export type ButtonStyleProps = {
  variant?: ButtonVariant
  tone?: ButtonTone
  state?: ButtonState
  /** Defaults to the surface's own height: 44 app, 48 consumer. */
  size?: ButtonSize
  surface?: ButtonSurface
}

/**
 * The one entry point: `btn({ variant: 'secondary', tone: 'brand' })`.
 *
 * Returns a class string rather than a component on purpose — these call sites
 * are `<button>`, `<a>`, `<label>` wrapping a file input, and Base UI
 * primitives, and a component would force a `render`/`asChild` escape hatch at
 * most of them.
 */
export function btn({
  variant = 'primary',
  tone = 'brand',
  state = 'static',
  size,
  surface = 'app',
}: ButtonStyleProps = {}): string {
  const resolvedSize: ButtonSize = size ?? (surface === 'consumer' ? 'lg' : 'md')
  const paint = PAINT[surface][variant][tone] ?? PAINT[surface][variant].brand!
  const colour =
    state === 'deactive'
      ? (tone === 'inverse' ? DEACTIVE_INVERSE : DEACTIVE)[variant]
      : state === 'hover'
        ? `${paint.rest} ${paint.hover}`
        : `${paint.rest} ${paint.hover
            .split(' ')
            .map((c) => `hover:${c}`)
            .join(' ')}`
  // `cn` (tailwind-merge), NOT join: in the `hover` state the rest and hover
  // paints are both unprefixed, so `bg-white` and `bg-primary/10` collide and
  // the winner is decided by STYLESHEET order, not source order. Measured on
  // the spec page: the hover column painted rgb(255,255,255) — identical to
  // static, with both classes sitting in the DOM. twMerge drops the loser.
  return cn(BASE, SURFACE[surface], SHAPE[variant], SIZE[resolvedSize], colour)
}

/** Which tone/variant pairs are genuinely defined on a surface — the spec page
 *  reads this so it cannot claim a combination the system does not have. */
export function hasButtonPaint(
  surface: ButtonSurface,
  variant: ButtonVariant,
  tone: ButtonTone,
): boolean {
  return Boolean(PAINT[surface][variant][tone])
}
