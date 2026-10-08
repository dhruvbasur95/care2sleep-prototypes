import { useEffect, useState } from 'react'

/**
 * "Click" on a pointer device, "Tap" on a touch one.
 *
 * Direct instruction, 2026-09-17: *"desktop -> click, Touch devices -> tap."*
 * The verb is a property of the **device**, not of the copy — so every
 * interactive block that invites a press reads the same way on the same
 * machine.
 *
 * Extracted here at its **second caller** (flip cards, then click-to-reveal
 * style 2), which is this project's standing rule for when a thing stops
 * living inside one component.
 *
 * ⚠️ `(hover: none) and (pointer: coarse)`, **not** `'ontouchstart' in window`.
 * A touchscreen laptop answers yes to the latter while still being driven by a
 * mouse, so it would be told to tap. The media query asks the question that
 * actually matters — is the *primary* input coarse and unable to hover — and it
 * is live, so a device that changes input mode relabels rather than being stuck
 * with whatever was true at mount.
 *
 * It returns the verb only. Callers supply their own sentence, because
 * "Click to flip" and "Click to see" are different affordances.
 */
const COARSE_POINTER = '(hover: none) and (pointer: coarse)'

export function useRevealVerb(): 'Click' | 'Tap' {
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COARSE_POINTER).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(COARSE_POINTER)
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches)
    // Re-read on mount as well as on change: the initialiser runs before the
    // browser has necessarily settled its emulation, and a stale `false` would
    // otherwise persist until the next real change event.
    setCoarse(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return coarse ? 'Tap' : 'Click'
}
