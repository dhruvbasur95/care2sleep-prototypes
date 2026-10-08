import { createContext, useContext } from 'react'
import type { ResearchStore } from './research-store'

/**
 * The accessor for the app's single store. Every page and component reads
 * state through `useResearch()`; the state itself and all its write actions
 * live in `research-store.tsx`, and the `ResearchStore` shape is the contract
 * between them.
 *
 * DO NOT move `ResearchContext` or `useResearch` back into
 * `research-store.tsx`. That module exports the `ResearchProvider` component,
 * and Vite's React Fast Refresh flags a hook sitting alongside a component as
 * a non-component export that makes the whole module un-refreshable — so an
 * edit anywhere that cascades into re-evaluating it remounts the provider with
 * fresh seed state and silently wipes everything the user has done in the
 * session. The browser shows no reload, so the symptom looks like data loss
 * rather than a rebuild. Keeping this file free of component exports is what
 * prevents it. (`format.ts` is split out for the same reason.)
 */
export const ResearchContext = createContext<ResearchStore | null>(null)

export function useResearch(): ResearchStore {
  const ctx = useContext(ResearchContext)
  if (!ctx) throw new Error('useResearch must be used inside ResearchProvider')
  return ctx
}
