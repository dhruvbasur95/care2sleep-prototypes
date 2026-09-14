import { useSyncExternalStore } from 'react'

/**
 * The Consumer Portal's text-size setting.
 *
 * Round 48, direct instruction: the accessibility menu's three controls should
 * "make buttons functional, but do not map it to any spec" — so this is a real
 * working scale rather than a placeholder, but it is deliberately this app's own
 * simple ladder rather than an implementation of WCAG 1.4.4's 200% requirement
 * or any other named target.
 *
 * ── Why module scope and not `useState` ──────────────────────────────────
 *
 * Every page under `/consumer` mounts its OWN `ConsumerShell`, and `App.tsx`
 * remounts the whole route subtree on navigation. A flag stored in component
 * state resets the moment the reader moves from Home to a module — this
 * project's standing rule, and a bug it has shipped twice (Round 29's
 * onboarding, Round 41's welcome). `useSyncExternalStore` is what lets readers
 * re-render off a value that outlives them.
 *
 * Not persisted, matching every other prototype-scoped setting in this portal
 * (the first-run welcome, the trainee onboarding): a reviewer should see the
 * default state on a fresh load.
 */

/** The ladder. One step is 12.5%, which is large enough to be obvious to
 *  someone who reached for this menu because they could not read something —
 *  a 5% step reads as nothing happening and invites a second press.
 *
 *  ⚠️ **The ladder starts at 1 and must not go below it.** It previously began
 *  at 0.875, which multiplied this portal's 16px floor down to 14px on every
 *  body-copy element in the app — a setting that made text *less* readable,
 *  offered to an audience defined by not being able to read it, and in direct
 *  breach of the portal's own "nothing below 16px" rule. "Decrease" now means
 *  "step back down toward 100%", never below it; at 100% the control is
 *  correctly disabled, which is what `canDecrease` is for. */
const STEPS = [1, 1.125, 1.25, 1.375, 1.5] as const

/** Index into `STEPS`. 0 is 100%: the menu exists to make text bigger, and
 *  there is deliberately nothing below the default. */
const DEFAULT_INDEX = 0

let index = DEFAULT_INDEX
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => index

export function increaseTextSize() {
  if (index >= STEPS.length - 1) return
  index += 1
  emit()
}

export function decreaseTextSize() {
  if (index <= 0) return
  index -= 1
  emit()
}

export function resetTextSize() {
  if (index === DEFAULT_INDEX) return
  index = DEFAULT_INDEX
  emit()
}

/**
 * The current scale, plus whether each control can still do anything.
 *
 * `canIncrease`/`canDecrease` are returned rather than left for the menu to
 * work out: a control at the end of the ladder has to say so, and deriving that
 * in the component would put the ladder's length in two files.
 */
export function useTextScale() {
  const i = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    scale: STEPS[i],
    /** "100%", "125%" — shown in the menu so a press has a visible result even
     *  for a reader who cannot see the size change on this particular screen. */
    label: `${Math.round(STEPS[i] * 100)}%`,
    canIncrease: i < STEPS.length - 1,
    canDecrease: i > 0,
    isDefault: i === DEFAULT_INDEX,
  }
}
