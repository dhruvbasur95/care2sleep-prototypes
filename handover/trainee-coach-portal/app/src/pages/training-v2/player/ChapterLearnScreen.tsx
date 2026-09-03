import { useLayoutEffect, useState } from 'react'
import type { Chapter } from '@/data/moduleContent'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'
import { VideoPlaceholder } from './VideoPlaceholder'

/**
 * Chapter Learn screen — video template applied 1 or 2 times per chapter
 * (labelled "Part 1 of 2"/"Part 2 of 2" when there are 2). `body` is the
 * screen's own short framing line, not sourced from the video-coverage
 * text (see `VideoPlaceholder`'s doc comment). Continue gated until all of
 * this chapter's Learn videos are watched.
 */
export function ChapterLearnScreen({
  chapter,
  onReadyChange,
}: {
  chapter: Chapter
  onReadyChange?: OnReadyChange
}) {
  const [watched, setWatched] = useState<boolean[]>(() => chapter.learnVideos.map(() => false))
  const allWatched = watched.every(Boolean)

  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: allWatched })
  }, [allWatched, onReadyChange])

  return (
    <SlideLayout
      eyebrow="Learn"
      title={chapter.title}
      body="Watch this before continuing."
      isCurrent={Boolean(onReadyChange)}
    >
      <div className="mt-6 space-y-8">
        {chapter.learnVideos.map((video, i) => (
          <div key={i}>
            {video.label && (
              <p className="mb-3 text-fine font-semibold text-ink-faint">{video.label}</p>
            )}
            <VideoPlaceholder
              label={`Chapter ${chapter.number} Learn video${video.label ? `: ${video.label}` : ''}`}
              durationLabel={video.durationLabel}
              alreadyWatched={watched[i]}
              onWatched={() => setWatched((prev) => prev.map((w, idx) => (idx === i ? true : w)))}
            />
          </div>
        ))}
      </div>
    </SlideLayout>
  )
}
