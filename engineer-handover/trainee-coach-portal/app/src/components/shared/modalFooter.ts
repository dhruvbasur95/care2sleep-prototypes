/**
 * Shared footer "surface" for every pop-up modal/dialog in this app —
 * previously each modal's footer sat directly on the same white background
 * as its own body with nothing but a `mt-6` gap separating it, while
 * `PlanSessionsModal`'s wizard was the one modal with a full-bleed, shaded
 * `bg-pearl` bar closing off its rounded bottom corners. Direct feedback:
 * "all pop-up modals need to have a footer, similar to how we did for the
 * session planner... consistent app wide." Composed with each modal's own
 * per-usage layout classes (`flex`, `justify-between`/`justify-end`, `gap-3`,
 * etc.) via `cn()` — this constant only ever carries the shared visual
 * treatment (background, rounded corners, bleed, padding), never layout.
 *
 * Two variants exist because the app's modals come in two panel paddings:
 * `MODAL_FOOTER_SURFACE` for the `p-6 md:p-8` wizard-shaped panels
 * (`PlanSessionsModal`, `EditSessionPlanModal`, `AddCoachTraineeModal`,
 * `AddAnnotationSummaryModal`, `EnrollConsumerDialog`) and
 * `MODAL_FOOTER_SURFACE_COMPACT` for `ConfirmDialog`'s smaller, `p-6`-only
 * (no `md:p-8`) panel — using the wide variant there would bleed the footer
 * past the panel's own edge at `md`+ instead of flush with it. Every panel
 * this pairs with must also carry `overflow-hidden` so the footer's negative
 * margins don't visibly poke past the panel's own `rounded-lg` corners.
 */
export const MODAL_FOOTER_SURFACE =
  '-mx-6 -mb-6 rounded-b-lg bg-pearl px-6 py-4 md:-mx-8 md:-mb-8 md:px-8'

export const MODAL_FOOTER_SURFACE_COMPACT = '-mx-6 -mb-6 rounded-b-lg bg-pearl px-6 py-4'
