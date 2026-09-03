import { useLayoutEffect } from 'react'
import type { Chapter } from '@/data/moduleContent'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'

/** Chapter-complete checkpoint — `SlideLayout`'s `centered` variant
 *  (design-tokens.md §30). Footer label differs depending on whether
 *  another chapter follows or this was the last one before the module
 *  outro. */
export function ChapterCompleteScreen({
  chapter,
  isLastChapter,
  onReadyChange,
}: {
  chapter: Chapter
  isLastChapter: boolean
  onReadyChange?: OnReadyChange
}) {
  const label = isLastChapter ? 'Continue to your turn to practice' : `Start chapter ${chapter.number + 1}`

  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: true, label })
  }, [label, onReadyChange])

  return (
    <SlideLayout
      variant="centered"
      title={`Chapter ${chapter.number} complete`}
      body={`Nice work. You've covered ${chapter.title}.`}
      isCurrent={Boolean(onReadyChange)}
    />
  )
}
