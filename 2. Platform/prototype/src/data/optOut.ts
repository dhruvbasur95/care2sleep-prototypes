import { useSyncExternalStore } from 'react'

/**
 * Whether the signed-in trainee/coach has opted out of the study.
 *
 * Module-scoped, not `useState` in a page or shell: every `/delivery` page
 * mounts its own shell, so a flag stored there would reset on the first
 * navigation (CLAUDE.md's standing rule). The red banner across the top of the
 * portal (`OptedOutBanner`) and the opt-out card on My Profile both read it.
 * Prototype only — a reload clears it.
 */
let optedOut = false
const listeners = new Set<() => void>()

export function setOptedOut(value: boolean) {
  optedOut = value
  listeners.forEach((l) => l())
}

export function useOptedOut(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => optedOut,
  )
}
