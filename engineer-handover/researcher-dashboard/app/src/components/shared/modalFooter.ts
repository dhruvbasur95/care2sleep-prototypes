/**
 * The shaded, full-bleed bar that closes off the bottom of every modal in the
 * app. Every dialog has one; that consistency is the point.
 *
 * These constants carry only the *surface* — background, bleed, padding,
 * bottom corner radius. Each call site adds its own layout
 * (`flex justify-between gap-3`, etc.) through `cn()`. Do not put layout here.
 *
 * ⚠️ THREE THINGS MUST LINE UP or the footer visibly breaks the panel:
 *
 *  1. **Pick the variant matching the panel's padding.** The bleed is negative
 *     margins that must exactly cancel the panel's own padding.
 *     `MODAL_FOOTER_SURFACE` is for `p-6 md:p-8` panels (`PlanSessionsModal`,
 *     `EditSessionPlanModal`, `AddCoachTraineeModal`);
 *     `MODAL_FOOTER_SURFACE_COMPACT` is for `ConfirmDialog`'s `p-6`-only
 *     panel. Using the wide one on a `p-6` panel bleeds the footer *past* the
 *     panel edge at `md`+.
 *  2. **The panel must carry `overflow-hidden`**, or the negative margins poke
 *     out past its rounded corners.
 *  3. That `overflow-hidden` is safe for focus rings — the footer buttons'
 *     rings sit well inside the panel — but re-check if you tighten the
 *     padding.
 */
export const MODAL_FOOTER_SURFACE =
  '-mx-6 -mb-6 rounded-b-lg bg-pearl px-6 py-4 md:-mx-8 md:-mb-8 md:px-8'

export const MODAL_FOOTER_SURFACE_COMPACT = '-mx-6 -mb-6 rounded-b-lg bg-pearl px-6 py-4'
