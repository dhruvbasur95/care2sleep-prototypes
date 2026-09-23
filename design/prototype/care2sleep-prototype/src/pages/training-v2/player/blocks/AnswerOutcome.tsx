import type { Ref } from 'react'

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
  panelRef,
}: {
  message: string
  panelRef?: Ref<HTMLDivElement>
}) {
  const base = `${import.meta.env.BASE_URL}illustrations/quote-bubbles/`

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="status"
      // The frame's 64px side inset is sized to a 993px-wide panel. A `Your
      // turn` block's column is 576 on desktop and ~300 on a phone, where 2x64
      // left barely 170px of copy width and the message wrapped to one word per
      // line, 25 lines deep. `layout-audit.js` cannot see that — nothing
      // overflows and nothing scrolls — so the inset steps down with the
      // viewport instead of being transcribed flat.
      className="relative flex rounded-[16px] bg-yellow-100 px-4 py-4 outline-none sm:px-8 lg:px-16"
    >
      {/* `min-h` rather than a fixed height: a message runs from one line to
          ten depending on the question and the viewport, and the container
          grows with it instead of the shape being stretched to fit.

          `py-6`: with none, the last line of a long message sat on the
          container's own bottom edge. */}
      <p className="flex min-h-[112px] w-full flex-col justify-center rounded-[16px] border border-ink-muted bg-purple-200 px-6 py-6 text-sub-greeting leading-[1.4] text-primary lg:px-12">
        {message}
      </p>
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
