import { useLayoutEffect, useState } from 'react'
import type { ModuleContent } from '@/data/moduleContent'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'
import { VideoPlaceholder } from './VideoPlaceholder'

/**
 * Module intro — "Situations you might encounter". This is the **video
 * template's reference implementation** (design-tokens.md §30): title +
 * body + video placeholder, nothing else. `body` is the video's own real
 * spoken lines, quoted — a genuine transcript of what plays, not the
 * source doc's production-brief text (see `VideoPlaceholder`'s doc
 * comment for why that distinction matters). Continue (the global footer)
 * is gated until the placeholder plays through.
 */
export function ModuleIntroScreen({
  content,
  onReadyChange,
}: {
  content: ModuleContent
  onReadyChange?: OnReadyChange
}) {
  const [watched, setWatched] = useState(false)

  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: watched })
  }, [watched, onReadyChange])

  return (
    <SlideLayout
      eyebrow="Module intro"
      title="Situations you might encounter"
      body={content.introLines.map((line) => `“${line}”`).join('  ')}
      isCurrent={Boolean(onReadyChange)}
    >
      <div className="mt-6">
        <VideoPlaceholder
          label="Module intro"
          durationLabel={content.introDurationLabel}
          onWatched={() => setWatched(true)}
        />
      </div>
    </SlideLayout>
  )
}
