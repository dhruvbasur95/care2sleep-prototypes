import { useLayoutEffect } from 'react'
import type { Chapter } from '@/data/moduleContent'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'

/** `what-to-expect-screen` (design-tokens.md §26) — static reference list,
 *  no interaction, no gating. Opens with the chapter's one-line SIPTEA tag
 *  as the screen's own heading. */
export function WhatToExpectScreen({
  chapter,
  onReadyChange,
}: {
  chapter: Chapter
  onReadyChange?: OnReadyChange
}) {
  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: true })
  }, [onReadyChange])

  return (
    <SlideLayout
      eyebrow="What to expect from consumer, what you can do"
      title={chapter.siptaTag}
      isCurrent={Boolean(onReadyChange)}
    >
      <div className="mt-6 divide-y divide-hairline border-t border-hairline">
        {chapter.whatToExpect.map((item, i) => (
          <div key={i} className="py-5">
            <p className="text-body font-semibold text-ink">
              Consumer might say: “{item.consumerMightSay}”
            </p>
            <p className="mt-1.5 text-body text-ink-muted">→ You can: {item.youCanDo}</p>
          </div>
        ))}
      </div>
    </SlideLayout>
  )
}
