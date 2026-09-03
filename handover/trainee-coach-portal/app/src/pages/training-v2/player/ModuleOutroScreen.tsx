import { useLayoutEffect, useState } from 'react'
import type { ModuleContent } from '@/data/moduleContent'
import type { OnReadyChange } from './ModulePlayerFooter'
import { SlideLayout } from './SlideLayout'

/** Module outro — "Your turn to practice". Module 4's actual outro
 *  vignette (verbatim, shown as the slide's `body`) + a free-text response
 *  field, unscored — this is a rehearsal beat, not a full assessed
 *  practice (per the source framework doc). Not persisted anywhere beyond
 *  local component state. Continue is never gated on writing a response —
 *  there's no single correct answer.
 *
 *  Footer label is plain "Continue" (Round 22 direct edit) — a new
 *  `feedback` step (`ModuleFeedbackSlide.tsx`) now sits between this screen
 *  and `complete`, so this is no longer the module's actual last step. */
export function ModuleOutroScreen({
  content,
  onReadyChange,
}: {
  content: ModuleContent
  onReadyChange?: OnReadyChange
}) {
  const [response, setResponse] = useState('')

  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: true, label: 'Continue' })
  }, [onReadyChange])

  return (
    <SlideLayout
      eyebrow="Your turn to practice"
      title="Your turn to practice"
      body={content.outro.vignette}
      isCurrent={Boolean(onReadyChange)}
    >
      <div className="mt-6">
        <p className="text-body font-semibold text-ink">{content.outro.prompt}</p>

        <div className="mt-6 flex flex-col gap-1.5">
          <label htmlFor="module-outro-response" className="text-fine font-semibold text-ink-faint">
            Your response
          </label>
          <textarea
            id="module-outro-response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={6}
            placeholder="There's no single correct answer. Write what you'd ask or do first."
            className="w-full rounded-sm border border-hairline bg-card px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          />
          {/* Authorial grading guidance shown as gentle help text, not a
           *  scored rubric — this is a rehearsal, not an assessment. */}
          <p className="text-fine text-ink-faint">{content.outro.guidance}</p>
        </div>
      </div>
    </SlideLayout>
  )
}
