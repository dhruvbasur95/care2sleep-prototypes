import { useSyncExternalStore } from 'react'

/**
 * Is the Consumer Portal's first-run onboarding tour open?
 *
 * The tour is the five-screen modal that follows the welcome flow — frames
 * `991:9446`, `992:9666`, `992:9724`, `995:9931`, `995:10173`.
 *
 * ⚠️ **Module-scoped, not `useState` in the shell, and that is load-bearing.**
 * Finishing the welcome now *navigates* to Home, so the shell that opened the
 * tour unmounts immediately afterwards — every consumer page mounts its own
 * `ConsumerShell`. A flag held in shell state would be destroyed by the very
 * navigation that is supposed to reveal the tour, and the modal would never
 * appear. This project has shipped the neighbouring bug once already (Round 29,
 * where a shell-held flag replayed the whole welcome flow on each navigation),
 * and the standing rule is a module-scoped value read through
 * `useSyncExternalStore` wherever a reader has to re-render.
 *
 * Deliberately **not persisted**, matching `welcomeDismissed` in
 * `ConsumerShell` and the trainee flow before it: this is a prototype under
 * review, and a first-run screen that only ever appears once per browser is a
 * screen nobody can look at twice. A reviewer therefore meets it on every full
 * page load, which is the intended trade rather than an oversight.
 */
let open = false

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

/** Called by the welcome flow as it hands over to Home. */
export function openConsumerOnboarding() {
  if (open) return
  open = true
  emit()
}

/** Skip, Escape, the backdrop, and the final CTA all land here. */
export function closeConsumerOnboarding() {
  if (!open) return
  open = false
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const read = () => open

export function useConsumerOnboardingOpen() {
  return useSyncExternalStore(subscribe, read, read)
}
