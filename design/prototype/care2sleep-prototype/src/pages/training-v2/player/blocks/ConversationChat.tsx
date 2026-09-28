import { useEffect, useRef } from 'react'
import type { ConversationTurn } from '@/data/moduleContent'
import { ScrollCue } from '@/components/shared/ScrollCue'
import { cn } from '@/lib/utils'
import { CONVERSATION_GROUND } from './conversationGround'

const ART = `${import.meta.env.BASE_URL}illustrations/conversations/`

/**
 * The tallest the chat gets before it scrolls.
 *
 * Direct instruction, 2026-09-28: the container height is set and the chat
 * scrolls inside it. 464 is `<Case scenario block_2>`'s own placeholder height
 * in Figma.
 *
 * A `max-height`, not a `height`: a fixed one left a short conversation sitting
 * above a band of empty container, reported as *"a grey box showing"*. Capping
 * means a long case still stops here and scrolls, while a short one ends where
 * the chat ends.
 */
const BOX_H = 464

/**
 * How wide a run's bubble column may get, as a share of the row.
 *
 * ⚠️ **Never 100%.** Left to hug, a long line stretched to 586px in a 720px box
 * — reported as the bubbles being broken, and correctly: a chat bubble that
 * spans the full width stops reading as one side of a conversation.
 *
 * Varied rather than one constant (direct instruction: *"randomise them, but
 * none should be 100%"*), and keyed on the run index so it is **stable across
 * renders** — `Math.random()` here would reshuffle the whole conversation on
 * every keystroke elsewhere on the slide.
 *
 * These are a share of the ROW, and the row includes the 86px avatar indent —
 * so the widest bubble measures well under the cap. 82% of the row leaves ~69%
 * of the box once the indent is taken off.
 */
const RUN_WIDTHS = ['max-w-[82%]', 'max-w-[70%]', 'max-w-[78%]', 'max-w-[74%]']

/**
 * The coach/client conversation as a **live chat**, not a baked image.
 *
 * ## Why this is components where block_1 is an image
 * Block_1's rule was "always render conversation as an image", and for its 1-3
 * turn conversations that is right — the composition is bespoke per pattern.
 * Chapter 3 runs to eight turns, and as an image that failed on the one thing
 * that matters: the type. A 993px-wide export fits into a ~720px column, so
 * everything in it renders at **0.725 scale** — measured at **9.1px** on screen,
 * and the instruction was that the font cannot be reduced below block_1's.
 * Authoring bigger type only trades that against an ever-taller export.
 *
 * Direct instruction, 2026-09-28: *"if images are tricky, create this
 * interactive chat based block as part of case scenario 2"*. As components the
 * type is real app type at real size, it reflows at any width, and the scroll
 * is native. Only the two portraits stay as art.
 *
 * ## Layout
 * WhatsApp-style, from the user's own Figma version: the coach on the left and
 * the client on the right, and an avatar under the **last bubble of each
 * speaker's run** rather than beside every line — eight turns cannot each carry
 * their own portrait.
 */
export function ConversationChat({ turns }: { turns: ConversationTurn[] }) {
  const boxRef = useRef<HTMLDivElement>(null)

  // ⚠️ Send the chat back to its first line whenever the case changes.
  //
  // This box is its own scroller, and React reuses the same DOM node between
  // cases — only `turns` changes — so `scrollTop` survives the swap. A coach
  // who reads case 4 to the end and presses Next lands on case 5 already
  // scrolled part-way down it, with the opening lines above the fold.
  // Measured before the fix: case 5 arrived at `scrollTop: 888`, exactly where
  // case 4 was left, on the same node.
  //
  // Reported 2026-09-28: *"the next case does not auto scroll up by default
  // when I go to next scenario"* — *"since its a chat style block with chat
  // inside scroller window"*. The slide-level scroll is a separate fix in
  // `YourTurnMcq`; BOTH are needed, because they are two different scrollers.
  //
  // Not `key={index}` on the caller: remounting would throw away the node and
  // replay the entrance animation on every case. Resetting one number does
  // exactly what is wanted and nothing else.
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = 0
  }, [turns])

  // Group consecutive lines from one speaker. The avatar belongs to the RUN,
  // not to every line — eight turns cannot each carry their own portrait.
  const runs: { who: ConversationTurn['who']; lines: string[] }[] = []
  for (const turn of turns) {
    const last = runs[runs.length - 1]
    if (last && last.who === turn.who) last.lines.push(turn.text)
    else runs.push({ who: turn.who, lines: [turn.text] })
  }

  return (
    <div className="relative">
      <div
        ref={boxRef}
        // A scrollable region with no focusable content inside is unreachable
        // by keyboard otherwise — a real WCAG 2.1.1 failure, the same one the
        // sleep-diary grid had to be fixed for.
        tabIndex={0}
        role="region"
        aria-label="Conversation"
        // A set height (direct instruction), not a cap: every case then opens
        // the same size and the chat scrolls inside it, rather than the slide
        // reflowing as you move between cases. The grey that made a fixed
        // height look wrong earlier is gone — the box carries the
        // conversation's own gradient now.
        style={{ height: BOX_H }}
        className={cn(
          'overflow-y-auto rounded-lg px-10 py-6 outline-none focus-visible:ring-2 focus-visible:ring-ring',
          CONVERSATION_GROUND,
        )}
      >
        <ol className="m-0 flex list-none flex-col gap-10 p-0">
          {runs.map((run, r) => {
            const isCoach = run.who === 'coach'
            return (
              <li
                key={r}
                // ⚠️ A COLUMN whose bubbles are indented past the avatar, not a
                // row that sits level with it. In the Figma version the coach's
                // portrait starts where the bubbles END and its right edge
                // meets their left edge — so the bubble reads as up-and-right
                // of the avatar (up-and-left for the client).
                //
                // Bottom-aligning them side by side put the portrait level with
                // the last line instead: reported twice, as *"the chat bubbles
                // are on top right of avatar in figma, not on top"* and then
                // *"not positioned correctly, top right or top left"*.
                className={cn('flex flex-col', isCoach ? 'items-start' : 'items-end')}
              >
                <span
                  className={cn(
                    'flex min-w-0 flex-col gap-4',
                    RUN_WIDTHS[r % RUN_WIDTHS.length],
                    // The indent is the avatar's own column, so the portrait
                    // tucks into the space beneath the bubbles rather than
                    // pushing them sideways. **56**, down from 86 — the wider
                    // inset pushed the bubbles away from the portrait they
                    // belong to, so the tail pointed at a gap.
                    isCoach ? 'items-start ps-14' : 'items-end pe-14',
                  )}
                >
                  {run.lines.map((line, i) => (
                    <span key={i} className="relative max-w-full">
                      <p
                        className={cn(
                          // `body-md` — 16/600 (direct instruction), matching
                          // block_1's Semi Bold bubble type rather than the 14
                          // Regular this started as.
                          'rounded-[12px] bg-white px-3 py-2.5 text-body-md leading-[1.35] shadow-[0_9px_25px_rgba(6,28,61,0.08)]',
                          isCoach ? 'text-primary' : 'text-ink',
                        )}
                      >
                        {/* Who is speaking is carried by the side and the
                            avatar, neither of which a screen reader gets in
                            order. Announced once per run, on its first line. */}
                        {i === 0 && (
                          <span className="sr-only">
                            {isCoach ? 'Coach: ' : 'Care partner: '}
                          </span>
                        )}
                        {line}
                      </p>
                      {/* The conical tail, on the last line of the run only —
                          it points down at the portrait below it, and a tail on
                          every stacked line reads as several speakers. */}
                      {i === run.lines.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute top-full size-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-white',
                            isCoach ? 'left-5' : 'right-5',
                          )}
                        />
                      )}
                    </span>
                  ))}
                </span>
                <span className="mt-1 flex flex-col items-center gap-0.5">
                  <img
                    src={`${ART}${isCoach ? 'coach' : 'carer'}-avatar.png`}
                    alt=""
                    aria-hidden="true"
                    // 64px, up from 40. At 40 the faces were unreadable, and
                    // they are the only thing telling the speakers apart beyond
                    // which side they sit on.
                    className="h-16 w-auto"
                  />
                  {/* `caption`, not `fine` (direct instruction) — `fine` is
                      12/600, both too small here and the wrong weight beside a
                      600 bubble. */}
                  <span aria-hidden="true" className="text-caption text-ink-muted">
                    {isCoach ? 'Coach' : 'Care partner'}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      <ScrollCue
        containerRef={boxRef}
        variant="app"
        size="compact"
        // Not the default "Scroll to see more". The player pins a cue of its
        // own to the whole slide, and both can be visible at once — naming the
        // conversation is what tells the two scrollers apart.
        label="Scroll the conversation"
        className="right-auto left-1/2 -translate-x-1/2"
      />
    </div>
  )
}
