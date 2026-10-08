/**
 * Whether the trainee has already been past the first-run welcome flow in this
 * sitting.
 *
 * ## Why it is a module-scoped `let` and not React state
 * Every page under `/delivery` mounts its **own** `DeliveryShell`, so a plain
 * `useState` meant the destination page mounted a fresh shell, read `false`,
 * and replayed the whole welcome flow. A module-level flag survives in-app
 * navigation and still resets on a real page load, which is the intended
 * behaviour (Round 30, direct instruction: the flow is deliberately **never
 * persisted**, so a reviewer sees it once per load).
 *
 * ## Why it lives here rather than inside `DeliveryShell`
 * It was in `DeliveryShell.tsx` until 2026-09-28. The Coach Training Portal's
 * module pages have to set it (see `markOnboardingSeen`), and importing a
 * mutator out of the shell *component* would couple `/training-v2` to the
 * delivery shell's render tree for the sake of one boolean. Same reasoning
 * that put `data/coachPathway.ts` in its own file.
 */
let onboardingDismissed = false

export function isOnboardingDismissed(): boolean {
  return onboardingDismissed
}

/**
 * Record that the welcome flow has been dealt with — either because the
 * trainee completed or skipped it, or because they have arrived from
 * somewhere only a non-first-run trainee can be.
 *
 * ⚠️ **The second case is the reason this is exported.** The module player and
 * the module overview page live under `/training-v2`, which is **outside** the
 * delivery shell, and all three of their exits land on `/delivery/learning`.
 * A reviewer who opens the player directly — a reload, a fresh tab, or the
 * `localStorage` progress hack the handover documents — never passes through
 * `/delivery`, so this flag was still `false` when they finished the module and
 * pressed "Go to my learnings". The welcome flow then played for the first
 * time, on the way out of a module they had just completed. Reported directly,
 * 2026-09-28: *"last slide button i.e. go back to learnings restarts the
 * prototype, and do not go back to my learning page"* — it did navigate, but
 * what it navigated to was the four-screen welcome flow covering the page.
 *
 * Marking it on the way out is the narrow fix: it does not persist anything
 * (a real reload still replays the flow, which is the instruction), it only
 * says that *this* arrival is not a first run. Being inside a module is proof
 * of that — the only route to one is through My Learning.
 */
export function markOnboardingSeen(): void {
  onboardingDismissed = true
}
