import { useSyncExternalStore } from 'react'

/**
 * A coach's progress through each client-module preview (Resources → Client
 * modules → Preview module).
 *
 * Module-scoped, not `useState` in a page: the player and the Resources page
 * are separate routes, and each mounts its own shell, so local state would be
 * gone the moment the coach went back (CLAUDE.md non-negotiable). Session only
 * — a reload clears it, and nothing is written to any record.
 *
 * The coach's preview ends after the Module summary (direct instruction:
 * "do not show question slides"), so it has three stages, not the client's
 * four.
 */
export const PREVIEW_STAGES = ['welcome', 'video', 'summary'] as const
export type PreviewStage = (typeof PREVIEW_STAGES)[number]

export interface PreviewProgress {
  /** Where the coach was when they left — where Resume puts them back. */
  stage: PreviewStage
  complete: boolean
}

let progress: Record<string, PreviewProgress> = {}
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

export function savePreviewProgress(moduleId: string, next: PreviewProgress) {
  progress = { ...progress, [moduleId]: next }
  emit()
}

/**
 * Percentage complete, by stages finished: 0 on the welcome screen, a third
 * per stage after it, 100 only once the coach finishes the summary. The bar in
 * the player and the bar on the Resources card both read this, so the two can
 * never show different numbers for the same visit.
 */
export function previewPercent(p: PreviewProgress | undefined): number {
  if (!p) return 0
  if (p.complete) return 100
  return Math.round((PREVIEW_STAGES.indexOf(p.stage) / PREVIEW_STAGES.length) * 100)
}

export function useAllPreviewProgress(): Record<string, PreviewProgress> {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => progress,
  )
}

/** Read once, outside React's render cycle (the player's initial stage). */
export function getPreviewProgress(moduleId: string): PreviewProgress | undefined {
  return progress[moduleId]
}
