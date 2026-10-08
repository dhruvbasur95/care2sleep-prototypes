/**
 * Client-side, per-module progress persistence for the module player
 * (design-tokens.md §26 "Gating + resume mechanics"). Stores only the
 * highest top-level `PlayerStep` index reached — never per-question or
 * per-video granularity, so a resumed Learn/Case/Knowledge-check step
 * always restarts its own internal state from the beginning.
 *
 * Same storage tier as `sidebar-nav`'s collapse state and the training auth
 * gate (§10/§18) — plain `localStorage`, no new persistence mechanism.
 * `localStorage` (not `sessionStorage`) is deliberate here: progress should
 * survive a closed tab/browser restart, unlike the auth session.
 */

function key(moduleId: string): string {
  return `training-v2:module-progress:${moduleId}`
}

export function getModuleStepIndex(moduleId: string): number {
  const raw = localStorage.getItem(key(moduleId))
  if (!raw) return 0
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

/**
 * Modules the coach has actually opened **in this browser session**.
 *
 * Deliberately module-scoped memory rather than `localStorage`, and that is the
 * whole point: the coach Home banner's "Resume where you left" state is gated
 * on this, and a refresh must return the demo to its default "Begin your
 * training journey" banner (direct instruction) — the same
 * never-persisted treatment the Round 30 onboarding flow gets.
 *
 * It cannot simply read the stored step index instead: that is `localStorage`
 * by design (progress survives a closed tab, per this file's own note above),
 * so it would keep the banner in its resumed state across refreshes forever.
 * The two facts are genuinely different — "how far in are they" persists,
 * "have they picked it up this sitting" does not.
 *
 * Module scope, not React state: every `/delivery` page mounts its own shell,
 * so a flag held in a component would reset on in-app navigation — which is
 * precisely the trip from the player back to Home that has to carry it.
 */
const startedThisSession = new Set<string>()

export function wasStartedThisSession(moduleId: string): boolean {
  return startedThisSession.has(moduleId)
}

/** Only ever moves forward — never regresses from a stored higher index. */
export function setModuleStepIndex(moduleId: string, index: number): void {
  // Unconditional, and outside the `index > current` guard below on purpose: a
  // coach returning to a module they had already finished in a previous session
  // never advances the stored index, but they have still started it now.
  startedThisSession.add(moduleId)

  const current = getModuleStepIndex(moduleId)
  if (index > current) {
    localStorage.setItem(key(moduleId), String(index))
  }
}

export function resetModuleProgress(moduleId: string): void {
  localStorage.removeItem(key(moduleId))
}
