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
 *  Dashboard card). */
export function moduleArt([wash, bloomA, bloomB]: readonly [string, string, string]) {
  return {
    backgroundColor: wash,
    backgroundImage: `radial-gradient(140% 160% at 12% 8%, ${bloomA} 0%, transparent 55%), radial-gradient(140% 160% at 88% 95%, ${bloomB} 0%, transparent 60%)`,
  }
}
