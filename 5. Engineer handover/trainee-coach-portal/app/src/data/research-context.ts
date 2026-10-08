import { createContext, useContext } from 'react'
import type { ResearchStore } from './research-store'

/**
 * `ResearchContext`/`useResearch` split out of `research-store.tsx`
 * (Round 6.2.1 fix, take 2). The first attempt at this fix only moved the
 * plain `TODAY`/`formatDate`/`formatTime` exports out, but that wasn't
 * enough: Vite's React Fast Refresh plugin flags `useResearch` itself as a
 * "non-component" export the moment it sits in the same module as the
 * `ResearchProvider` component, regardless of what else is or isn't
 * exported alongside it. Every edit to `research-store.tsx` (or anywhere
 * that cascades into re-evaluating it) was still logging
 * `hmr invalidate ... "useResearch" export is incompatible` and forcing
 * `ResearchProvider` to remount with fresh initial state — silently wiping
 * all in-memory session data (e.g. a just-submitted annotation summary)
 * even though the browser never does a full page reload.
 *
 * Moving `ResearchContext` + `useResearch` here — a module with zero
 * component exports — makes this file (and, once nothing but the
 * component itself is exported from research-store.tsx) both files
 * Fast-Refresh-safe.
 */
export const ResearchContext = createContext<ResearchStore | null>(null)

export function useResearch(): ResearchStore {
  const ctx = useContext(ResearchContext)
  if (!ctx) throw new Error('useResearch must be used inside ResearchProvider')
  return ctx
}
