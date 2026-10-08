import { useSyncExternalStore } from 'react'

/**
 * A one-shot signal that the hamburger drawer has closed, so the page content
 * underneath can play its entrance as the drawer rises off it.
 *
 * Direct instruction: "match the drawer close motion with page content move in
 * transition, it should look like when the shutter (hamburger drawer) goes up,
 * the content moves in."
 *
 * ⚠️ **Module-scoped, not state in a shell.** The drawer is rendered by
 * `ConsumerHeader` and the content by each page — sibling trees with no common
 * owner below the router, and every page mounts its **own** shell instance, so
 * a flag held in a shell would reset on navigation. This project has shipped
 * that exact bug once (Round 29's onboarding flag replaying the whole welcome
 * flow), and the standing rule is a module-scoped value with
 * `useSyncExternalStore` for readers that must re-render.
 *
 * A monotonically increasing token rather than a boolean: consecutive closes
 * must each fire, and a boolean would need resetting, which is a second render
 * and a race.
 */
let token = 0
const listeners = new Set<() => void>()

/** Called when the drawer closes, by whatever closed it. */
export function pulseContentReveal() {
  token += 1
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

const read = () => token

export function useContentRevealToken() {
  return useSyncExternalStore(subscribe, read, read)
}

/* ────────────────────────────────────────────────────────────────────────────
   The hamburger drawer's own open state.

   ⚠️ **It lives here, and above the router, for one reason: the drawer has to
   survive navigation.** Selecting a page used to unmount it mid-animation —
   every consumer page mounts its own `ConsumerShell`, so `navigate()` takes the
   header and the drawer with it. Deferring the navigation until the exit
   finished fixed the vanish but produced a 400ms shutter, then a page swap,
   then a 450ms content fade: reported as "there is a delay ... it looks choppy,
   rough, and not well choreographed", which it was — three sequential events
   where one gesture was asked for.

   With the state here and the drawer mounted once at the router level, a row
   tap can navigate **and** close in the same frame: the new page mounts
   underneath and plays its own entrance while the shutter is still rising over
   it. One overlapping gesture, ~400ms, no seam.
   ──────────────────────────────────────────────────────────────────────────── */

type MenuState = { open: boolean; dyadId: string | null }
let menu: MenuState = { open: false, dyadId: null }
const menuListeners = new Set<() => void>()

function emitMenu() {
  menuListeners.forEach((l) => l())
}

export function openConsumerMenu(dyadId: string) {
  menu = { open: true, dyadId }
  emitMenu()
}

export function closeConsumerMenu() {
  if (!menu.open) return
  menu = { ...menu, open: false }
  emitMenu()
}

function subscribeMenu(l: () => void) {
  menuListeners.add(l)
  return () => menuListeners.delete(l)
}

const readMenu = () => menu

export function useConsumerMenu() {
  return useSyncExternalStore(subscribeMenu, readMenu, readMenu)
}
