import { ChevronLeft } from 'lucide-react'
import {
  SegmentedProgressBar,
  type SegmentedProgressBarSegment,
} from '@/components/ui/segmented-progress-bar'
import {
  chapterProgress,
  edgeStepProgress,
  outroStepIndex,
  feedbackStepIndex,
  STEPS_PER_CHAPTER,
} from '../playerSteps'

/**
 * Combined exit control + whole-module progress bar for the module player
 * shell (design-tokens.md §29) — supersedes the old chapter-only
 * `ModulePlayerProgressBar` (§26) and the separate, un-stuck "Exit" bar
 * `<div>` that used to sit above it as two independent pieces.
 *
 * Wraps the generic, domain-agnostic `SegmentedProgressBar`
 * (`@/components/ui/segmented-progress-bar.tsx`) with this app's own module
 * shape: one segment per chapter — weighted `STEPS_PER_CHAPTER` (8) against
 * the intro/outro caps' weight of 1, so a segment's width on screen matches
 * how much of the module it actually represents — plus a text label above
 * it ("Chapter 2 of 3" / "Module intro" / "Module outro" / "Module
 * complete") derived from the same `stepIndex` the player itself persists.
 * One bar now shows both signals a coach previously had to read off two
 * separate indicators: where they are in the *whole* module, and how far
 * through the *current* chapter they are.
 *
 * A normal (non-scrolling) block above the player's scrollable slide area
 * — `ModulePlayerPage.tsx` lays the whole shell out as a fixed-height flex
 * column (`h-screen`), with only the slide stack itself scrolling, so this
 * bar and the app header above it are simply always on screen without
 * needing `position: sticky` or any measured-height offset math (Round
 * 7.1.2's second pass — the first pass used a sticky app-header-relative
 * offset, since replaced by this simpler layout once manual scroll-snap
 * navigation made an internal scroll container the better fit anyway).
 */
export function ModulePlayerHeader({
  stepIndex,
  totalChapters,
  onExit,
}: {
  stepIndex: number
  totalChapters: number
  onExit: () => void
}) {
  const outroIndex = outroStepIndex(totalChapters)
  // Round 22 direct edit: a new `feedback` step sits between outro and
  // complete — without its own case here, `stepIndex > outroIndex` swallowed
  // both the feedback step and the real complete step under "Module
  // complete", a real bug caught live (the header read "Module complete"
  // while the coach was still on the feedback slide, one step early).
  const feedbackIndex = feedbackStepIndex(totalChapters)
  const introState = edgeStepProgress(stepIndex, 0).state
  const outroState = edgeStepProgress(stepIndex, outroIndex).state
  const feedbackState = edgeStepProgress(stepIndex, feedbackIndex).state
  const chapters = Array.from({ length: totalChapters }, (_, i) => chapterProgress(stepIndex, i))

  const locationLabel =
    stepIndex === 0
      ? 'Module intro'
      : stepIndex > feedbackIndex
        ? 'Module complete'
        : stepIndex === feedbackIndex
          ? 'Module feedback'
          : stepIndex === outroIndex
            ? 'Module outro'
            : `Chapter ${chapters.findIndex((c) => c.state === 'current') + 1} of ${totalChapters}`

  const segments: SegmentedProgressBarSegment[] = [
    { state: introState, weight: 1 },
    ...chapters.map((c) => ({
      state: c.state,
      progressPercent: c.progressPercent,
      weight: STEPS_PER_CHAPTER,
    })),
    { state: outroState, weight: 1 },
    { state: feedbackState, weight: 1 },
  ]

  return (
    // `bg-background`, not `bg-card`: the player's canvas matches the trainee
    // pages' own warm `#fffcfa` (direct instruction), so a white bar here would
    // read as a separate surface floating on it.
    <div className="shrink-0 border-b border-hairline bg-background px-6 py-3 md:px-8">
      <div className="mx-auto flex max-w-[900px] items-center gap-4">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full pr-3 pl-1 text-caption-medium text-ink-muted outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Exit
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-caption font-semibold text-ink">{locationLabel}</p>
          <SegmentedProgressBar segments={segments} className="mt-2" aria-label={locationLabel} />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {locationLabel}
      </p>
    </div>
  )
}
