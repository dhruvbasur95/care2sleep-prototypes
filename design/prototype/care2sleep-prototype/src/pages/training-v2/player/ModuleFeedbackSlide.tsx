import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FEEDBACK_MOODS, FeedbackPillow } from '@/components/shared/FeedbackPillow'
import { WaveDivider } from '@/components/delivery/WaveDivider'
import { SectionEyebrow } from './blocks/BlockRenderer'
import { SLIDE_COLUMN_COLLAPSED_PX, SLIDE_COLUMN_OPEN_PX } from './BlockSlide'
import type { OnReadyChange } from './ModulePlayerFooter'

/**
 * Module feedback — `playerSteps.ts`'s `feedback` step, the last one before
 * "Module complete".
 *
 * Frame `2695:1055` "Feedback Block". **This replaced the 0-5 star rating and
 * "Rating"/"Comments" form outright** (direct instruction, 2026-09-18: *"get
 * rid of the current old version"*), so nothing of the Round 22 version is
 * left — no stars and no field labels. It also left `SlideLayout` with one
 * caller, then none, and that file is now deleted.
 *
 * ## The pillows are the consumer portal's own
 * Direct instruction: *"re-use the feedback pillows we used in consumer view
 * for sharing session feedback"*. They now live in
 * `components/shared/FeedbackPillow.tsx`, extracted from `SessionFeedbackModal`
 * at this second caller rather than copied — every number in that file was
 * measured against a frame and a second copy would drift on the first
 * re-export. `FEEDBACK_MOODS` carries the five moods, their labels and their
 * selected fills, so this file invents no colour of its own.
 *
 * **The card around the pillow is local, and deliberately so.** The consumer's
 * is a 60vw row-reversed strip that becomes a column at `sm`; this is one of
 * five equal `flex-1` cards in the slide column. Different layout, not
 * different colour — which is the case this project's standing rules say to
 * build locally rather than serve with a flag.
 *
 * ## What the frame does not draw
 * A selected state. The frame has all five cards at rest, so selection reuses
 * the consumer's proven treatment: the mood's own fill, a 3px **outline** at
 * `-3px` offset rather than a border (a border takes the card from 1 to 3px and
 * visibly shifts the label), and the beat narrowing to the chosen pillow.
 *
 * Both answers stay optional and neither is persisted — the same "ungraded,
 * ephemeral" contract the step has had since Round 22. Continue is never gated.
 */
export function ModuleFeedbackSlide({
  onReadyChange,
  railOpen = true,
}: {
  onReadyChange?: OnReadyChange
  railOpen?: boolean
}) {
  const [mood, setMood] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    onReadyChange?.({ canContinue: true, label: 'Complete module' })
  }, [onReadyChange])

  // Focus the slide's own heading, never `<body>` — the player swaps one slide
  // for another and a screen-reader user gets no other signal.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div
      className="mx-auto flex h-full w-full flex-col py-10 transition-[max-width] duration-200 ease-out"
      style={{ maxWidth: railOpen ? SLIDE_COLUMN_OPEN_PX : SLIDE_COLUMN_COLLAPSED_PX }}
    >
      {/* The frame's own block inset, and its two gaps with one change: **56px**
          between the three sections rather than the frame's 40 (direct
          instruction, 2026-09-18), which is the cards -> rule and rule -> free
          -text block spacing. The header -> cards gap is 40, also raised from
          the frame's 24. */}
      <div className="mb-auto flex w-full flex-col items-center gap-14 p-10">
        {/* 40px above the mood cards, not the frame's 24 (direct instruction,
            2026-09-18). */}
        <div className="flex w-full flex-col gap-10">
          <div className="flex w-full flex-col items-center gap-10">
            <SectionEyebrow icon={MessageSquareHeart} label="Module feedback" />
            <div className="flex w-full flex-col gap-2 text-center">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-display-md text-ink text-balance outline-none"
              >
                How was this module?
              </h1>
              <p className="text-body text-ink-muted text-balance">
                Your rating and comments help us improve future modules. Both are optional.
              </p>
            </div>
          </div>

          {/* `min-w-0` on the row AND on every card: a flex child defaults to
              `min-width: auto`, so the widest label would size the track and
              push the document into a horizontal scroll rather than wrapping
              inside its own box. This project has shipped that three times. */}
          {/* ⚠️ **The frame draws no phone layout, and five equal tracks is not
              one.** Measured at 375px, each card came out **37px wide holding a
              56px pillow** — the artwork overlapped its neighbours and the
              labels ran into each other. `layout-audit.js` passed it clean:
              nothing overflowed and nothing scrolled, which is exactly the
              too-narrow-panel blind spot the free-text bubble hit before.
              Found by looking at a 375px screenshot.

              The fix is the consumer modal's own answer for the same artwork —
              below `sm` each mood is a full-width row with its label left and
              its pillow right, so the set reads as a list rather than five
              slivers. */}
          <div
            role="group"
            aria-label="How was this module?"
            className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:gap-4"
          >
            {FEEDBACK_MOODS.map((m, i) => {
              const on = mood === m.id
              // Every pillow beats until a choice is made, then only the chosen
              // one does — the consumer row's own rule, read off the selection
              // itself so the two can never get out of step.
              const beat = mood === null || on
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMood(on ? null : m.id)}
                  style={
                    on
                      ? {
                          backgroundColor: m.fill,
                          outline: `3px solid ${m.border}`,
                          outlineOffset: '-3px',
                        }
                      : undefined
                  }
                  className={cn(
                    // The frame's card: 206.2 tall, 24px radius, 12px sides and
                    // its own 39.28px vertical inset, centred on both axes.
                    'flex min-w-0 flex-1 flex-row-reverse items-center justify-between gap-4 rounded-[24px] px-4 py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:h-[206.2px] sm:flex-col sm:justify-center sm:px-3 sm:py-[39.28px]',
                    on
                      ? 'border border-transparent'
                      // Hover, which the frame does not draw (direct
                      // instruction, 2026-09-18: "hover state missing from
                      // feedback cards"). **Byte-identical to the consumer
                      // modal's own hover on this same card** — direct
                      // correction the same day: a first pass also darkened the
                      // 1px border to the mood's own shade, on the reasoning
                      // that white -> parchment is only a ~10-per-channel shift.
                      // That is a real concern in general, but not a licence to
                      // diverge here: the two rows are the same control with the
                      // same artwork, and one of them hovering differently is
                      // the drift this pillow was extracted to prevent.
                      : 'border border-hairline bg-white hover:bg-parchment',
                  )}
                >
                  <FeedbackPillow
                    art={m.art}
                    label={m.label}
                    selected={on}
                    glow={m.glow}
                    beat={beat}
                    index={i}
                  />
                  <span className="text-sub-greeting-semibold text-ink">{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* The frame's "Rule right" is byte-identical to `module/wave-rule.svg`
            — same path, same 1201-unit box — so this is `WaveDivider`'s own
            label-less `brand` rule rather than a sixth committed wave. */}
        <WaveDivider tone="brand" className="w-full" />

        <div className="flex w-full flex-col gap-8 rounded-[16px] bg-purple-50 p-10">
          <label htmlFor="module-feedback-comment" className="text-body text-ink">
            Tell us more to help improve your future sessions
          </label>
          <textarea
            id="module-feedback-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What worked, what didn't, anything you'd change?"
            className="h-[160px] w-full resize-y rounded-[16px] border border-parchment bg-white p-6 text-body text-ink outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
    </div>
  )
}
