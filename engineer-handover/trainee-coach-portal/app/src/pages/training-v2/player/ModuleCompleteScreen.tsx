import { useLayoutEffect } from 'react'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'

/**
 * Module complete — confirms completion, `SlideLayout`'s `centered`
 * variant (design-tokens.md §30). Only reads `.title`, so it accepts any
 * module-shaped object. Footer label reads "Back to your modules";
 * `ModulePlayerPage` routes this one step's Continue action to
 * `exitToTimeline` instead of `goNext` (see that file's own doc comment),
 * so this screen only needs to describe itself, not know where Continue
 * actually goes.
 */
export function ModuleCompleteScreen({
  module,
  onReadyChange,
}: {
  module: { title: string }
  onReadyChange?: OnReadyChange
}) {
  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: true, label: 'Back to your modules' })
  }, [onReadyChange])

  return (
    <SlideLayout
      variant="centered"
      title="Module complete"
      body={`You've finished ${module.title}. Your progress is saved.`}
      isCurrent={Boolean(onReadyChange)}
    />
  )
}
