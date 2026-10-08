import { useLayoutEffect, useState } from 'react'
import type { CaseExample } from '@/data/moduleContent'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'
import { VideoPlaceholder } from './VideoPlaceholder'

/**
 * `case-example-screen` (design-tokens.md §26, unified in §30/Round
 * 7.1.2) — one scenario per screen, both formats now sharing the same
 * title + body + content shape: `body` is always the case's plain
 * `vignette` field, never the source doc's `dramatizedScene` text (a
 * production brief describing how to *stage* the scene, not learner-
 * facing copy — the same distinction `VideoPlaceholder`'s doc comment
 * makes for Learn videos). Video format renders `VideoPlaceholder` below
 * the vignette, gated the same as a Learn video. Written format renders a
 * reveal-on-tap "What would you do?" prompt below it — Continue is never
 * gated on the reveal itself for written cases.
 */
export function CaseExampleScreen({
  caseExample,
  index,
  onReadyChange,
}: {
  caseExample: CaseExample
  /** 0-based position among this chapter's 3 cases, for the "Case example
   *  {n} of 3" eyebrow. */
  index: number
  onReadyChange?: OnReadyChange
}) {
  const [watched, setWatched] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const isVideo = caseExample.format === 'video'
  const canContinue = isVideo ? watched : true

  useLayoutEffect(() => {
    onReadyChange?.({ canContinue })
  }, [canContinue, onReadyChange])

  return (
    <SlideLayout
      eyebrow={`Case example ${index + 1} of 3`}
      title={`Scenario ${caseExample.scenarioNumber}: ${caseExample.slotLabel}`}
      body={caseExample.vignette}
      isCurrent={Boolean(onReadyChange)}
    >
      <div className="mt-6">
        {isVideo && caseExample.video ? (
          <VideoPlaceholder
            label={`Case example: Scenario ${caseExample.scenarioNumber}`}
            durationLabel={caseExample.video.durationLabel}
            onWatched={() => setWatched(true)}
          />
        ) : (
          <div className="space-y-4">
            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                What would you do?
              </button>
            ) : (
              <div role="status" className="space-y-2 border-t border-hairline pt-4">
                <p className="text-body font-semibold text-ink">
                  <span className="text-ink-faint">Coach: </span>“{caseExample.coachResponse}”
                </p>
                <p className="text-caption text-ink-faint">{caseExample.rationale}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SlideLayout>
  )
}
