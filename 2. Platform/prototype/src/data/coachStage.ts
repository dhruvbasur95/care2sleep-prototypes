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
 *
 * **It survives a page reload** (direct instruction, 2026-11-11: "fix the page
 * reloading issue"). It used to reset to `trainee` on every real load, and the
 * dev server reloads the whole page whenever an edit cannot hot-swap — so a
 * reviewer on the coach view was thrown back to the trainee view after most
 * edits and had to switch again. The choice is kept in `sessionStorage`: per
 * browser tab, gone when the tab closes, so a fresh visit still opens at
 * `trainee`. Every read and write is wrapped — storage can be blocked, and the
 * demo must still work without it.
 */
export type CoachStage = 'trainee' | 'coach'

const STORAGE_KEY = 'care2sleep.coachStage'

function readStored(): CoachStage {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'coach' ? 'coach' : 'trainee'
  } catch {
    return 'trainee'
  }
}

let stage: CoachStage = readStored()
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setCoachStage(next: CoachStage) {
  if (next === stage) return
  stage = next
  try {
    sessionStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage blocked: the switch still works for this page load.
  }
  listeners.forEach((fn) => fn())
}

export function useCoachStage(): CoachStage {
  return useSyncExternalStore(
    subscribe,
    () => stage,
    () => stage,
  )
}
