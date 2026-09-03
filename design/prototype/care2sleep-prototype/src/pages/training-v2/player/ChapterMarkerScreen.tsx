import { useLayoutEffect } from 'react'
import type { Chapter } from '@/data/moduleContent'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'

/** "Chapter {n}: {chapter title}" transition between chapters — one of the
 *  player's 3 short transitional "punctuation" beats, `SlideLayout`'s
 *  `centered` variant (design-tokens.md §30). */
export function ChapterMarkerScreen({
  chapter,
  onReadyChange,
}: {
  chapter: Chapter
  onReadyChange?: OnReadyChange
}) {
  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: true, label: `Start chapter ${chapter.number}` })
  }, [chapter.number, onReadyChange])

  return (
    <SlideLayout
      variant="centered"
      title={`Chapter ${chapter.number}: ${chapter.title}`}
      body="Here's what this chapter covers."
      isCurrent={Boolean(onReadyChange)}
    />
  )
}
