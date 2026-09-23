import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Block } from '@/data/moduleContent'
import { ComingUpNextCard, type OutroActions } from './blocks/BlockRenderer'
import { BlockBox } from './blocks/BlockBox'
import { SLIDE_COLUMN_COLLAPSED_PX, SLIDE_COLUMN_OPEN_PX } from './BlockSlide'
import type { OnReadyChange } from './ModulePlayerFooter'

/**
 * Module complete — the player's last step.
 *
 * Confirms completion, then hands the coach on to the next module. **The
 * "Coming up next" card lives here** (direct instruction, 2026-09-18: *"move
 * the upcoming block to below the text block in that slide"*), and this is its
 * third home in two days: it was the `chapter-outro` tag's second box, then
 * briefly a slide of its own after module feedback. This is the one that makes
 * sense of it — the last thing a finished module says is what the next one is.
 *
 * ## The card's one CTA
 * "Continue with next module" opens the module the card names. Leaving is the
 * footer's job — its primary on this step is "Go to my learnings", and the
 * card had a second pill saying the same thing until it was deleted as
 * repetitive.
 *
 * ## Why it builds its own column
 * This screen and `ModuleFeedbackSlide` used to share `SlideLayout`, a chassis
 * for a heading and a line of body copy. Both outgrew it — the card here wants
 * the block column (880px, 1134 collapsed) where `SlideLayout`'s `centered`
 * variant capped at 560, stacking the pillow above the copy and inheriting the
 * column's `text-center`. Both now use `BlockSlide`'s own column geometry, and
 * `SlideLayout` was deleted at zero callers.
 *
 * Only `.title` is read off `module`, so it still accepts any module-shaped
 * object. `ModulePlayerPage` routes this step's Continue to My Learning rather
 * than `goNext`, so this screen only describes itself.
 */
export function ModuleCompleteScreen({
  module,
  moduleNumber,
  outroBlocks,
  railOpen = true,
  actions,
  onReadyChange,
}: {
  module: { title: string }
  /** Its position in the curriculum, so the copy can name it the way every
   *  other surface does. Supplied by the player, which already computes it for
   *  the outline rail — two surfaces reading one fact off one source. */
  moduleNumber?: number
  outroBlocks?: Block[]
  railOpen?: boolean
  actions?: OutroActions
  onReadyChange?: OnReadyChange
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isCurrent = Boolean(onReadyChange)

  useLayoutEffect(() => {
    // Matches the card's own second CTA word for word (direct instruction,
    // 2026-09-18, annotated on both buttons at once). The destination moves
    // with the label every time it changes — a control whose words and
    // landing page disagree is the mismatch this project's reviews keep
    // catching.
    onReadyChange?.({ canContinue: true, label: 'Go to my learnings' })
  }, [onReadyChange])

  // Focus the slide's own heading, never `<body>`.
  useEffect(() => {
    if (isCurrent) headingRef.current?.focus()
  }, [isCurrent])

  const Heading = isCurrent ? 'h1' : 'h2'
  const outro = outroBlocks?.find((b) => b.tag === 'chapter-outro')

  return (
    <div
      className="mx-auto flex h-full w-full flex-col py-10 transition-[max-width] duration-200 ease-out"
      style={{ maxWidth: railOpen ? SLIDE_COLUMN_OPEN_PX : SLIDE_COLUMN_COLLAPSED_PX }}
    >
      <div className="mb-auto flex w-full flex-col gap-10">
        {/* The screen's own copy keeps the old centred 560px measure —
            a mascot, one heading and one line, which a full-width 880px column
            would leave stranded. 40px under the mascot, 8px under the title. */}
        <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-10 px-6 text-center">
          {/* The frame's own export. It is the consumer feedback flow's
              thank-you pillow with its ground shadow baked in — 16 of its 26
              paths are that file's, byte for byte — and it is committed whole
              rather than assembled from `thanks.svg` plus a CSS ellipse: a
              shape and the shadow it casts are one drawing, and this project
              has shipped the two-transcriptions bug three times (§78.1). */}
          <img
            src={`${import.meta.env.BASE_URL}illustrations/module-complete/mascot.svg`}
            alt=""
            aria-hidden="true"
            className="h-[90px] w-[161px] shrink-0"
          />
          <div className="flex w-full flex-col gap-2">
            <Heading
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-display-md outline-none"
            >
              Module complete
            </Heading>
            {/* The frame names the module the way every other surface does —
                "Module 6: Building Blocks of Good Sleep" — with the name in
                bold. The number comes from the player rather than being
                written here, so this line and the outline rail cannot disagree
                about which module this is. */}
            <p className="text-body text-ink-muted">
              You've finished{' '}
              {moduleNumber ? `Module ${moduleNumber}: ` : ''}
              <strong className="font-semibold">{module.title}</strong>. Your progress is saved.
            </p>
          </div>
        </div>

        {/* `py-0` — sides only. The card is a filled `primary` surface with its
            own 40px inset, so the box's vertical padding would only add air the
            column's own gap already provides. */}
        {outro && (
          <BlockBox className="py-0">
            <ComingUpNextCard block={outro} actions={actions} />
          </BlockBox>
        )}
      </div>
    </div>
  )
}
