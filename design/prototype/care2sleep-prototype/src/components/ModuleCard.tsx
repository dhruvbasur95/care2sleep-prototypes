/**
 * This file used to also export the Coach Training Portal Option A
 * `ModuleCard` component. Option A (and its `/training` route) was retired
 * once Option B became the only version this project develops going
 * forward — `moduleArt` is the one piece of this file other surfaces still
 * depend on (Option B's module timeline/overview/player, and the Consumer
 * Portal's Learning Dashboard card), so it stays here rather than moving,
 * to avoid touching every one of those import sites for no functional
 * reason.
 */

/** Composes a module's 3-colour palette into a soft two-bloom gradient —
 *  see `TrainingModule.cover`'s doc comment for why this stands in for a
 *  real photo. Exported for reuse by other cards wanting the same
 *  gradient-wash cover treatment (e.g. Consumer Portal's Learning
 *  Dashboard card).
 *
 *  `image` is optional and, where present, paints **over** the gradient
 *  rather than replacing it: the gradient stays as the backdrop, so a cover
 *  photo that does not cover its box (a different aspect ratio, a slow
 *  decode, a 404) degrades to the module's own wash instead of to bare
 *  white. Layer order in `background-image` is front-to-back, which is why
 *  the url goes first. */
export function moduleArt(
  [wash, bloomA, bloomB]: readonly [string, string, string],
  image?: string,
) {
  const blooms = `radial-gradient(140% 160% at 12% 8%, ${bloomA} 0%, transparent 55%), radial-gradient(140% 160% at 88% 95%, ${bloomB} 0%, transparent 60%)`
  return {
    backgroundColor: wash,
    backgroundImage: image ? `url("${image}"), ${blooms}` : blooms,
    ...(image ? { backgroundSize: 'cover', backgroundPosition: 'center' } : null),
  }
}
