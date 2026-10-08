import { useRef } from 'react'
import type { CaseScenarioCase } from '@/data/moduleContent'
import { ScrollCue } from '@/components/shared/ScrollCue'
import { YourTurnMcq } from './YourTurnMcq'
import { SipteaSkillsCovered } from './SipteaSkillChip'
import { ConversationChat } from './ConversationChat'

/**
 * The image box's fixed height.
 *
 * Direct instruction, 2026-09-28: the container height is set and the chat
 * scrolls inside it. 464 is `<Case scenario block_2>`'s own placeholder height
 * in Figma, and block_1's 8 conversations are all 465 — so one number serves
 * both variants and block_1's images, which are shorter than this, never
 * scroll at all.
 */
const IMAGE_BOX_H = 464

/** Where a case's conversation artwork lives. Composed from the case's own
 *  bare STEM, the convention `chapter-intro`'s hero already follows — never
 *  store a path or an extension in the content. */
const CONVERSATION_ART = `${import.meta.env.BASE_URL}illustrations/conversations/`

/**
 * `<Case scenario block_1>` — frames `3214:3164` (default) and `3214:19765`
 * (answer submitted), built 2026-09-28.
 *
 * ## It is the MCQ block plus two things
 * Direct instruction: *"This block is re-using MCQ block but adds a couple of
 * components to it."* Structurally that is exactly what the two frames are — I
 * diffed them against `Multiple choice / Default` node for node, and the title,
 * sub copy, 292x48 option pills, dark Submit, graded red/green states, yellow
 * footer and Next/Previous pair are all identical. The delta is an image above
 * the question and a `Skills covered:` row inside the answer outcome.
 *
 * So this composes `YourTurnMcq` through two render props rather than forking
 * it. That component carries three rounds of hard-won behaviour — grading by
 * option letter, the `relative`-on-the-label scroll fix, two focus moves that
 * keep focus off `<body>`, and the slide gate — none of which is worth
 * reimplementing for a block whose interaction is the same interaction.
 *
 * ## The conversation is ONE image, never composed live
 * Direct instruction, 2026-09-28: *"Always render conversation as an image, not
 * individual components, so that the image scales responsively."* Each case is
 * a single flattened export of its own frame in the Figma file (`Conversation —
 * case 1`…`8`), built from one of four speaker-pattern templates:
 *
 * | Pattern | Cases |
 * |---|---|
 * | Carer -> Coach          | 1 |
 * | Coach only              | 8 |
 * | Coach -> Carer          | 2, 3, 4, 5 |
 * | Coach -> Carer -> Coach | 6, 7 |
 *
 * Composing the portraits and bubbles as live DOM would reintroduce every rule
 * the artwork already satisfies — bubbles overlapping a portrait's outer edge
 * but never a face, no two bubbles colliding, portraits resizing so three turns
 * fit the same fixed height — as runtime layout that would have to hold at
 * every width. As one image they are settled by construction.
 *
 * ## The fixed aspect ratio is the requirement, not a side effect
 * *"The parent image container height does not change"* — so the box is locked
 * to the frame's own 993x465 (`ASPECT`), and a narrower viewport scales the
 * whole composition down rather than reflowing it.
 *
 * ⚠️ **Consequence worth knowing: baked-in text does not reflow.** At 993px the
 * bubbles read fine; at a 375px phone the band is ~176px tall and the bubble
 * text renders around 6px. `alt` carries the full conversation so a screen
 * reader is unaffected, but a small-screen treatment (a portrait-orientation
 * export, or falling back to the text below a breakpoint) is still an open
 * item. Flagged at build time, not discovered later.
 */
export function CaseScenarioBlock({
  label,
  cases,
  labelledBy,
  variant = 'block-1',
}: {
  /** The eyebrow's stem — `Case scenario`, numbered per case. */
  label: string
  cases: CaseScenarioCase[]
  labelledBy: string
  /** `block-2` draws its options as chat bubbles — see the block's own type. */
  variant?: 'block-1' | 'block-2'
}) {
  return (
    <YourTurnMcq
      questions={cases}
      labelledBy={labelledBy}
      renderHeader={(index) => {
        const case_ = cases[index]
        return (
          // 16px eyebrow-to-image, the frame's own `Frame 384` gap. The 40px to
          // the question below comes from the parent's `gap-10`, also the
          // frame's.
          <div className="flex flex-col gap-4">
            {/* Carries the position the pagination pills would have carried,
                so replacing them loses nothing — for a screen reader either.
                `aria-hidden` would be wrong here for exactly that reason. */}
            <p className="text-title text-primary">
              {label} {index + 1}/{cases.length}
            </p>
            {/* Block_2's conversations are live chat; block_1's are artwork.
                See `ConversationChat` for why the two differ. */}
            {case_.turns?.length ? (
              <ConversationChat turns={case_.turns} />
            ) : (
              <ConversationImage case_={case_} />
            )}
          </div>
        )
      }}
      renderOutcomeFooter={(index) => <SipteaSkillsCovered skills={cases[index].tags} />}
      optionVariant={variant === 'block-2' ? 'bubble' : 'pill'}
    />
  )
}

/**
 * The conversation artwork in a fixed-height box that scrolls.
 *
 * Chapter 3's conversations run to eight turns, so their exports are 471-675
 * tall against a 464 box. Rather than shrinking every image to fit its longest
 * case, the box is a constant height and the chat scrolls inside it, with the
 * player's own `ScrollCue` pinned to the box so "there is more below" is stated
 * rather than left to be discovered.
 *
 * `ScrollCue` takes a `containerRef` precisely because the module player scrolls
 * its own element rather than the window — the same reason it was generalised
 * out of the Consumer Portal. Reused, not rebuilt.
 *
 * The cue hides itself once there is nothing left to scroll, so a short case
 * (Chapter 3 case 2 is 282 tall, all of block_1 is 465) shows no cue and no
 * scrollbar — the box simply fits.
 */
function ConversationImage({ case_ }: { case_: CaseScenarioCase }) {
  const boxRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative">
      <div
        ref={boxRef}
        // `tabIndex` + a name: a scrollable region with no focusable content
        // inside is unreachable by keyboard otherwise, which is a real WCAG
        // 2.1.1 failure — the same one the sleep-diary grid was fixed for.
        tabIndex={0}
        role="region"
        aria-label="Conversation"
        // `maxHeight`, not `height`. A fixed height leaves a short conversation
        // sitting above a band of empty container — reported as "a grey box
        // showing", and it was `bg-pearl` behind an image only 341px tall in a
        // 464px box. Capping instead means a tall case still stops at 464 and
        // scrolls, while a short one simply ends where the chat ends.
        //
        // No background either: with the cap there is nothing left to show
        // through, and a fill behind a transparent-edged export only reappears
        // the moment an image is ever a different aspect.
        style={{ maxHeight: IMAGE_BOX_H }}
        className="w-full overflow-y-auto rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={`${CONVERSATION_ART}${case_.image}.jpg`}
          // The conversation IS the content, not decoration — the question
          // below is unanswerable without it, and the text is baked into the
          // export, so `alt` is a screen reader's only route to it.
          alt={case_.conversation}
          // Full width, natural height: the image scrolls rather than being
          // squashed, so the type stays at the size it was exported at.
          className="block w-full"
          loading="lazy"
          decoding="async"
        />
      </div>
      {/* Same relabel as the live-chat box: this one scrolls the conversation,
          the player's own cue scrolls the slide. */}
      <ScrollCue
        containerRef={boxRef}
        variant="app"
        label="Scroll the conversation"
        className="bottom-4"
      />
    </div>
  )
}
