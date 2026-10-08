/**
 * The app's button component — all four portals.
 *
 * ## Read this before you change anything here
 *
 * **The styling is NOT in this file.** Every class string comes from
 * `btn()` in `@/components/shared/buttonSystem`, which is the single
 * definition of the five axes — `variant` · `tone` · `state` · `size` ·
 * `surface` — and carries ~170 lines of measured rationale for each of them
 * (why `secondary` is `bg-white` and not transparent, why a solid tone's hover
 * must darken rather than fade, why `ghost`'s hover is an underline alone).
 * See `design-tokens.md` §99 for the spec and CLAUDE.md's Buttons row for the
 * standing rule.
 *
 * This file is the **entry point**, not the definition. It exists so that the
 * two names a shadcn-literate engineer reaches for — `Button` and
 * `buttonVariants` — resolve to the real system instead of to starter
 * boilerplate. Until 2026-10-08 this file held an untouched shadcn `cva` block
 * with **zero importers**, which made the project's own documentation false and
 * set a trap: the next person needing a button imports the thing literally
 * called `Button`, finds a generic grey pill, and starts a third system.
 *
 * ## Why it wraps rather than re-implements
 *
 * Converting the lookup tables to `cva` here would have produced two places
 * that both claim to define a button, which is exactly the drift this project
 * spent Round 47 collapsing (50 distinct class signatures across the researcher
 * files alone). Wrapping makes the change *provably* inert: `Button` and
 * `buttonVariants` emit byte-identical class strings to the `btn()` call they
 * replace, because they **are** that call.
 *
 * - `buttonVariants` is `btn` itself, re-exported under shadcn's conventional
 *   name. Not a wrapper — the same function object.
 * - `Button` is `buttonVariants(...)` plus `cn(…, className)`, in that order,
 *   so a caller's own class still wins in `tailwind-merge` exactly as it did
 *   when call sites wrote `cn(btn({…}), 'shrink-0')` by hand.
 *
 * ## Polymorphism: Base UI's `render` prop
 *
 * Several call sites are not `<button>` — a react-router `<Link>`, an `<a>`,
 * a `<label>` wrapping a hidden file input. They take the class-string form
 * (`buttonVariants({…})`), which is shadcn's own documented pattern for links
 * and remains correct here. Where a call site would rather keep the component,
 * `render` accepts the element to render instead:
 *
 * ```tsx
 * <Button variant="secondary" render={<a href={zoomUrl} />}>Join Zoom</Button>
 * ```
 *
 * `render` is Base UI's convention (`@base-ui/react` 1.6 is what this project
 * has installed), implemented here through Base UI's own public `useRender`
 * hook rather than its `Button` primitive. That is deliberate: the primitive
 * wraps `onClick`/`onKeyDown`/`onMouseDown` and emits `data-disabled`, which
 * would be a behaviour change on 95 existing call sites. `useRender` with no
 * `state` adds no attributes and no handlers — with `render` omitted it is
 * `React.createElement('button', props)` and nothing else.
 *
 * ⚠️ **No default `type`.** A bare `<button>` inside a `<form>` defaults to
 * `type="submit"`, and several call sites depend on that. Setting
 * `type="button"` here would silently stop forms submitting.
 *
 * ⚠️ **`state: 'deactive'` is paint only.** Pair it with a real `disabled` or
 * `aria-disabled`. The inert "(coming soon)" controls this project mandates are
 * `aria-disabled` and deliberately **focusable** — never convert one to the
 * `disabled` attribute, which removes it from the tab order.
 */

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'

import { cn } from '@/lib/utils'
import { btn, type ButtonStyleProps } from '@/components/shared/buttonSystem'

export type {
  ButtonVariant,
  ButtonTone,
  ButtonState,
  ButtonSize,
  ButtonSurface,
  ButtonStyleProps,
} from '@/components/shared/buttonSystem'

/**
 * shadcn's conventional name for the class-string function.
 *
 * This is `btn` itself — not a wrapper around it — so
 * `buttonVariants({ variant: 'secondary', tone: 'brand' })` and
 * `btn({ variant: 'secondary', tone: 'brand' })` are the same call.
 * Use it on anything that is not a `<button>`: links, labels, and any third
 * party primitive that takes a `className`.
 */
export const buttonVariants = btn

export type ButtonProps = React.ComponentPropsWithRef<'button'> &
  ButtonStyleProps & {
    /**
     * Render something other than a `<button>` — an `<a>`, a `<label>`, a
     * router `<Link>`. Base UI's convention: pass the element, and this
     * component's props and classes are merged onto it.
     */
    render?: useRender.RenderProp
  }

/**
 * The app's button.
 *
 * `size` defaults to the surface's own height and should normally be left
 * alone: `surface: 'app'` (researcher, trainee, coach) is `md` → 40px, and
 * `surface: 'consumer'` is `lg` → 48px. That defaulting lives in `btn()`, so it
 * cannot drift between the component and the class-string form.
 */
export function Button({
  className,
  variant,
  tone,
  state,
  size,
  surface,
  render,
  ref,
  ...props
}: ButtonProps) {
  return useRender({
    defaultTagName: 'button',
    render,
    ref,
    props: {
      ...props,
      // btn() first, caller's className second — the order every migrated call
      // site already used as `cn(btn({…}), 'extra')`, and the order
      // tailwind-merge needs for the caller's class to win.
      className: cn(buttonVariants({ variant, tone, state, size, surface }), className),
    },
  })
}
