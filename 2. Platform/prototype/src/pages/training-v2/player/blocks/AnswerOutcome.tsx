import type { ReactNode, Ref } from 'react'

/**
 * What a `Your turn` question says back once it has been answered — the yellow
 * band, a plain purple message container, and the pillow leaning on it.
 *
 * ## The container is a div, not the drawn blob
 * It used to be `feedback-bubble.svg` — a hand-drawn speech shape with a 3.5px
 * black stroke, stretched with `preserveAspectRatio="none"`. Direct
 * instruction, 2026-09-18: *"just use a simple purple container instead of
 * this skewed box behind the message, avatar remains where it is"*. Stretching
 * an organic outline to fit a message that runs from one line to ten is what
 * made it read as skewed — the corner curvature and the stroke weight scaled
 * with the box, so the same asset looked like a different shape on every
 * question.
 *
 * Both of the export's own colours survive exactly, through tokens rather than
 * raw hexes: its `#E4D6FF` fill **is** `--color-purple-200` and its `#333333`
 * stroke **is** `--color-ink-muted`, so nothing about the painted result
 * changes but the geometry. The stroke stays (direct instruction, 2026-09-18:
 * *"keep the outline stroke"*), and as a border it is a constant weight at
 * every size, which is the actual fix: an SVG stroke inside a
 * `preserveAspectRatio="none"` box is scaled by the box, so the same outline
 * came out thin and stretched on a wide panel and heavy on a narrow one.
 *
 * **1px, not the export's own 3.5.** `border-[3.5px]` existed nowhere else in
 * this app; every bordered box in the player is `rounded-[16px] border
 * border-<token>` (`border-art-edge`, `border-parchment`), so a 3.5px rule here
 * would have been a new stroke weight invented for one block.
 *
 * The avatar is untouched, including its `bottom-0 left-2` offset against the
 * yellow band.
 *
 * Extracted from `YourTurnMcq` at its second caller (direct instruction,
 * 2026-09-17: the free-text pattern should *"re-use the mcq answer outcome
 * component (avatar + purple blob)"*), which is the same rule `Toast`,
 * `useRevealVerb` and `MeetingsSection` were extracted under. The two callers
 * differ only in what the message says: multiple choice grades and picks
 * between the question's own correct/wrong copy, free text records and says so.
 *
 * `role="status"` and `tabIndex={-1}` live here rather than at the call sites
 * because they are not decoration — the control that produced this panel
 * unmounts when it appears, so it is both the announcement and the focus
 * target. A caller passes `panelRef` and focuses it.
 */
export function AnswerOutcome({
  message,
  below,
  panelRef,
}: {
  message: string
  /**
   * Anything the pattern wants inside the purple container **under** the
   * message — the case scenario block's `Skills covered:` chips, and nothing
   * else today.
   *
   * A slot rather than a `skills` prop, because SIPTEA is not this component's
   * business: it says back what a question decided, and the two callers that
   * predate this pass have nothing to put here. Optional, so both of them stay
   * byte-identical.
   */
  below?: ReactNode
  panelRef?: Ref<HTMLDivElement>
}) {
  const base = `${import.meta.env.BASE_URL}illustrations/quote-bubbles/`

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="status"
      // 2026-09-28, frame `3214:19765` re-read: the band is now **`purple-50`**,
      // not `yellow-100`, and its inset is the frame's own asymmetric
      // `16 / 16 / 16 / 56` rather than the symmetric one it used to draw.
      //
      // The 56px is the pillow's room, and the pillow is `lg` and up only — so
      // below `lg` the left inset drops back to 16 with it. That is the same
      // reasoning the old symmetric inset stepped down for, applied to a number
      // the frame now states outright instead of one sized to a 993px panel.
      className="relative flex rounded-[16px] bg-purple-50 p-4 outline-none lg:pl-14"
    >
      {/* `min-h` rather than a fixed height: a message runs from one line to
          ten depending on the question and the viewport, and the container
          grows with it instead of the shape being stretched to fit.

          `py-6`: with none, the last line of a long message sat on the
          container's own bottom edge. */}
      {/* A `div` wrapping a `p`, not a `p` alone: the skills slot carries a
          heading and a list, and neither is legal inside a paragraph — the
          browser would silently close the `<p>` and reparent them, putting the
          chips outside the purple container they are drawn inside.

          `justify-center` still centres a one-line message in the 112px
          minimum; with a slot present the column grows and the 24px gap is the
          frame's own message-to-skills spacing. */}
      {/* 2026-09-28, same re-read: the `#333333` stroke is now **hidden** on the
          frame's own node, the radius is an asymmetric `24 / 8 / 24 / 8`
          (TL/TR/BR/BL), and the container carries its own 40px padding where
          the text used to. The border is removed rather than made transparent —
          a 1px transparent border still occupies a pixel on each side, which
          would leave the 40px inset measuring 41.

          The old stroke is gone from the design, so the Round 47 note about
          `border-[3.5px]` being reduced to 1px is now moot: there is no stroke
          to weight. The fill is untouched, `#e4d6ff` = `purple-200`. */}
      <div className="flex min-h-[112px] w-full flex-col justify-center gap-6 rounded-[24px_8px_24px_8px] bg-purple-200 p-6 lg:p-10">
        <p className="text-sub-greeting leading-[1.4] text-primary">{message}</p>
        {below}
      </div>
      {/* The same pillow the quote rows use, at the frame's own size and its
          bottom-left offset — one shared asset, not a second copy.

          Desktop only. The frame reserves its room through a 64px panel inset
          sized to a 993px panel; below `lg` there is no such room and the pillow
          sat on top of the message. It is decorative and already `aria-hidden`,
          so dropping it loses nothing but the flourish. */}
      <img
        src={`${base}avatar.svg`}
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-2 hidden w-[87px] lg:block"
      />
    </div>
  )
}
