import { useSyncExternalStore } from 'react'

/**
 * Which stage of the COACH pathway the signed-in coach is being demoed at
 * (Round 29, direct instruction — "a control switch that will allow me to show
 * two different stage").
 *
 * - `trainee` — still working through the curriculum. No consumers assigned
 *   yet, so Home is about their own learning.
 * - `coach`   — certified and delivering. Home is about their caseload.
 *
 * This is a **demo affordance**, not a real account state: the prototype has
 * one coach persona (Helen Zhang) and no certification write path, so a
 * reviewer needs a way to see both Home layouts without seeding two people.
 * `CoachStageSwitcher` is the visible control.
 *
 * Module-level rather than component state, and deliberately so: every page
 * under `/delivery` mounts its own `DeliveryShell`, so a `useState` here would
 * reset the moment the coach navigated — the exact bug the onboarding flag hit
 * when its CTA started routing to another page. `useSyncExternalStore` gives
 * every mounted reader the same value and re-renders them all on a change.
 * It resets to `trainee` on a real page load, matching how onboarding behaves.
 */
export type CoachStage = 'trainee' | 'coach'

let stage: CoachStage = 'trainee'
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setCoachStage(next: CoachStage) {
  if (next === stage) return
  stage = next
  listeners.forEach((fn) => fn())
}

export function useCoachStage(): CoachStage {
  return useSyncExternalStore(
    subscribe,
    () => stage,
    () => stage,
  )
}
