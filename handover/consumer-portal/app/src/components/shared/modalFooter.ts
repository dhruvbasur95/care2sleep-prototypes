/**
 * The shared footer "surface" for every pop-up dialog in this portal: a
 * full-bleed, shaded bar closing off the panel's rounded bottom corners.
 *
 * It carries only the shared visual treatment — background, rounded corners,
 * negative-margin bleed, padding. Layout (`flex`, `justify-end`, `gap-3`…)
 * stays at the call site and is composed in with `cn()`. Keep it that way: the
 * moment layout moves in here, one caller needs a variant and the constant
 * starts growing flags.
 *
 * ⚠️ **Any panel using this must also carry `overflow-hidden`**, or the
 * negative margins visibly poke past the panel's own `rounded-lg` corners.
 * `ConfirmDialog` does.
 *
 * ── Why there is only one constant ──────────────────────────────────────────
 * The full Care2Sleep prototype has two, because its modals come in two panel
 * paddings: this one for `p-6 md:p-8` panels, and a `_COMPACT` variant for the
 * researcher `ConfirmDialog`'s `p-6`-only panel — using the wide variant there
 * bled the footer past the panel edge at `md`+. This package ships the Consumer
 * Portal alone, whose dialog is `p-6 md:p-8`, so `_COMPACT` had no caller and
 * was removed rather than left as dead configuration. If you reintroduce a
 * narrower panel, reintroduce the compact constant with it — do not widen this
 * one and do not drop the `md:` step from the panel.
 */
export const MODAL_FOOTER_SURFACE =
  '-mx-6 -mb-6 rounded-b-lg bg-parchment px-6 py-4 md:-mx-8 md:-mb-8 md:px-8'
