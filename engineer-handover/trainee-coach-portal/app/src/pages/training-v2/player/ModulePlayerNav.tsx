import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, CircleCheck, Flag, Menu, PanelLeftClose } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import type { ModuleContent } from '@/data/moduleContent'
import { chapterStepRange, outroStepIndex } from '../playerSteps'

/**
 * The module player's left navigation rail — frame `665:944`.
 *
 * The breakdown is one row per *section*, never one per player step:
 *
 *   Module N / <title> / progress bar + %
 *     Introduction
 *     Chapter 1 … N   (expandable — its own steps sit underneath, on a tree)
 *     Summary
 *
 * Every row's step index comes from `playerSteps.ts`'s own helpers — the same
 * functions the header bar and the module overview page's outline rows read —
 * so the three surfaces cannot disagree about where a chapter starts.
 *
 * "Summary" is one row covering the outro, feedback and complete steps: from a
 * coach's point of view those are the module wrapping up, not three separate
 * places to navigate to.
 *
 * Frame divergences, all deliberate:
 * - **The 44px icon container is the collapse control.** The frame draws a book
 *   glyph in it and no collapsed state; the rail has to collapse (direct
 *   instruction), and this app already says "collapse" with `PanelLeftClose` in
 *   both portal sidebars. Position and geometry are the frame's.
 * - **The badges carry no number** (direct instruction) — a solid disc, light
 *   grey until reached, `purple-200` while live, green with a tick once the
 *   section is behind the coach.
 * - **The chevrons are 20px, not the frame's 12x6 vector**, which reads as a
 *   hairline at real size.
 * - **A full 1px stroke, not the frame's `border-r`.** A single stroked edge on
 *   a floating 16px-radius card reads as a rendering fault.
 * - **A progress bar + % replaces nothing in the frame** — it was asked for
 *   directly and sits between the module name and the frame's wave rule.
 */
/** The rail's two widths. Exported because the footer has to know the current
 *  one to keep its slide buttons centred on the content column — the numbers
 *  cannot live in only one of the two files. `330` is frame `665:944`. */
export const OUTLINE_RAIL_OPEN_PX = 330
export const OUTLINE_RAIL_COLLAPSED_PX = 76

type NavSection = {
  label: string
  subtitle?: string
  stepIndex: number
  /** Present on chapter rows only: the steps the chevron reveals. */
  substeps?: { label: string; stepIndex: number }[]
}

function buildNavSections(content: ModuleContent): NavSection[] {
  return [
    { label: 'Introduction', stepIndex: 0 },
    ...content.chapters.map((chapter, i) => {
      const { start } = chapterStepRange(i)
      // The chapter's own run of the step machine, in `buildPlayerSteps`'s
      // order: marker, learn, case x3, knowledge check, what to expect,
      // chapter complete. The marker is the chapter row itself, so the list
      // below starts one past it.
      const substeps = [
        'Learn',
        ...chapter.cases.map((_, c) => `Case example ${c + 1}`),
        'Knowledge check',
        'What to expect',
        'Chapter complete',
      ].map((label, s) => ({ label, stepIndex: start + 1 + s }))

      return {
        label: `Chapter ${chapter.number}`,
        subtitle: chapter.title,
        stepIndex: start,
        substeps,
      }
    }),
    { label: 'Summary', stepIndex: outroStepIndex(content.chapters.length) },
  ]
}

export function ModulePlayerNav({
  content,
  moduleNumber,
  moduleTitle,
  stepIndex,
  furthestIndex,
  onJump,
  open,
  onToggleOpen,
  progressPercent,
}: {
  content: ModuleContent
  moduleNumber: number
  moduleTitle: string
  /** Where the coach is reading right now. */
  stepIndex: number
  /** The furthest step reached in this module, ever. Separate from
   *  `stepIndex` because jumping back to re-read Chapter 1 must not make
   *  Chapter 2 unreachable again — it has already been done. */
  furthestIndex: number
  onJump: (step: number) => void
  /** Collapsed state is owned by `ModulePlayerPage`, not held here: the
   *  footer has to offset its slide buttons by this rail's *current* width to
   *  keep them centred on the content column, and a flag private to this
   *  component left them 127px off centre whenever it was collapsed. */
  open: boolean
  onToggleOpen: () => void
  /** How far through the module's steps the coach is, 0-100. */
  progressPercent: number
}) {
  const sections = buildNavSections(content)

  // The section a coach is currently inside: the last one that has started.
  const activeIndex = sections.reduce(
    (acc, section, i) => (stepIndex >= section.stepIndex ? i : acc),
    0,
  )
  const reachedIndex = sections.reduce(
    (acc, section, i) => (furthestIndex >= section.stepIndex ? i : acc),
    0,
  )
  // The chapter a coach is in opens by default; any other can be opened too.
  const [expanded, setExpanded] = useState<number | null>(null)
  const openIndex = expanded ?? activeIndex

  return (
    <nav
      aria-label="Module outline"
      className={cn(
        // Frame `665:944`: a floating white card, 338px, 16px radius, the
        // app's warm card shadow. Collapse uses the portal sidebars' own
        // motion — an animated width with `overflow-hidden`, 200ms ease-out.
        'hidden shrink-0 overflow-x-hidden overflow-y-auto rounded-lg border border-parchment bg-card pb-6 shadow-card transition-[width] duration-200 ease-out lg:block',
        'px-4',
      )}
      style={{ width: open ? OUTLINE_RAIL_OPEN_PX : OUTLINE_RAIL_COLLAPSED_PX }}
    >
      {/* Sticky, so the module's name stays reachable once a long outline
          scrolls. `-mx-4` bleeds it to the card's edges and it carries the
          rail's own 24px top padding (the nav dropped `pt`), so the inset above
          it survives scrolling instead of sliding away under the header. */}
      <div
        className={cn(
          'sticky top-0 z-10 -mx-4 flex items-center bg-card pt-6 pb-4',
          open ? 'justify-between px-8' : 'justify-center px-4',
        )}
      >
        {open && <p className="min-w-0 flex-1 text-caption-medium text-ink">Module outline</p>}
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={open}
          className="flex size-11 shrink-0 items-center justify-center rounded-[12px] text-ink-faint outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? (
            <PanelLeftClose aria-hidden="true" className="size-[18px]" />
          ) : (
            // Collapsed, the control is the only thing in the rail's header, so
            // it reads as a plain menu rather than a panel-specific glyph.
            <Menu aria-hidden="true" className="size-5" />
          )}
          <span className="sr-only">
            {open ? 'Collapse module outline' : 'Expand module outline'}
          </span>
        </button>
      </div>

      {/* Collapsed, the rail is a progress marker, not a stack of anonymous
          discs — a flag and "done of total", which says where the coach is
          without any of the labels that give a disc its meaning. */}
      {!open && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <Flag aria-hidden="true" className="size-5 text-primary" />
          <p className="text-body-md text-ink tabular-nums">
            {activeIndex}/{sections.length}
            <span className="sr-only"> sections complete</span>
          </p>
        </div>
      )}

      {open && (
        <div className="mt-4 flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1">
            <p className="text-caption-medium text-ink-faint">Module {moduleNumber}</p>
            <p className="text-body-md text-ink">{moduleTitle}</p>
          </div>
          {/* Module progress, in place of the frame's hand-drawn rule: the bar
              and the number read the same `progressPercent`, so they cannot
              disagree. */}
          <div className="flex items-center gap-3">
            <Progress
              value={progressPercent}
              aria-label={`${moduleTitle} progress`}
              className="min-w-0 flex-1 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-hairline"
            />
            <span className="shrink-0 text-fine tabular-nums text-ink-muted">{progressPercent}%</span>
          </div>

          {/* The frame's hand-drawn rule, the same asset the trainee Home and
              My Notes dividers use — here with no label. It closes the module
              block off from the section list; the progress row above replaced
              it once by mistake rather than sitting with it. */}
          <img src="/illustrations/home/wave.svg" alt="" aria-hidden="true" className="h-1 w-full" />
        </div>
      )}

      {open && (
      <ol className="mt-8 flex flex-col gap-4">
        {sections.map((section, i) => {
          const state = i === activeIndex ? 'current' : i <= reachedIndex ? 'reached' : 'ahead'
          // Finished — every section before the one being read now. A reached
          // section *after* the current one (jumped back from) is not "done"
          // in the sense the tick means, so it keeps the purple disc.
          const done = state === 'reached' && i < activeIndex
          const isOpen = open && section.substeps !== undefined && openIndex === i

          return (
            // Expanded, the whole chapter — its own row *and* its steps — sits
            // on one tinted block, so the steps read as belonging to it rather
            // than as loose siblings of the next chapter.
            <li
              key={section.label}
              className={cn(
                'flex flex-col rounded-[12px]',
                isOpen && 'bg-purple-50 pt-2 pb-4',
              )}
            >
              <div
                className={cn(
                  'flex items-center rounded-[12px]',
                  state === 'current' && !isOpen && 'bg-purple-50',
                )}
              >
                <button
                  type="button"
                  disabled={state === 'ahead'}
                  aria-current={state === 'current' ? 'step' : undefined}
                  // A chapter opens on its first sub-part rather than its own
                  // title card (direct instruction) — but never ahead of where
                  // the coach has actually been, so on a chapter reached for
                  // the first time it still lands on the card.
                  onClick={() =>
                    onJump(
                      section.substeps && furthestIndex >= section.substeps[0].stepIndex
                        ? section.substeps[0].stepIndex
                        : section.stepIndex,
                    )
                  }
                  className={cn(
                    'flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-[12px] py-3 pl-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    open ? 'pr-4' : 'justify-center px-0',
                    state === 'reached' && '[&_span]:transition-colors hover:[&_span]:text-primary',
                    state === 'ahead' && 'cursor-default',
                  )}
                >
                  {/* A plain solid disc, no number (direct instruction).
                   *  Grey until the section has been reached, purple once it
                   *  is live, green with a tick once it is done. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full',
                      done && 'bg-success text-white',
                      !done && state === 'ahead' && 'bg-hairline',
                      !done && state !== 'ahead' && 'bg-purple-200',
                    )}
                  >
                    {done && <Check className="size-3.5" strokeWidth={3} />}
                  </span>

                  {open ? (
                    <span className="flex min-w-0 flex-col gap-1">
                      <span
                        className={cn(
                          'text-body-md',
                          state === 'current' ? 'text-primary' : 'text-ink-muted',
                        )}
                      >
                        {section.label}
                      </span>
                      {section.subtitle && (
                        <span
                          className={cn(
                            'text-caption leading-[1.3]',
                            state === 'current' ? 'text-primary' : 'text-ink-muted',
                          )}
                        >
                          {section.subtitle}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="sr-only">{section.label}</span>
                  )}
                </button>

                {open && section.substeps && (
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="mr-1 flex size-9 shrink-0 items-center justify-center rounded-[12px] outline-none transition-colors hover:bg-purple-200/50 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        // The frame's 12x6 vector reads as a hairline at this
                        // size; 20px is the app's own chevron weight.
                        'size-5 transition-transform duration-200',
                        state === 'current' ? 'text-primary' : 'text-ink-faint',
                        isOpen && 'rotate-180',
                      )}
                    />
                    <span className="sr-only">
                      {isOpen ? `Hide ${section.label} steps` : `Show ${section.label} steps`}
                    </span>
                  </button>
                )}
              </div>

              {/* Expand / collapse animates its own height, both ways, on one
                  symmetric ease — an asymmetric curve is most of what reads as
                  a "springy" or abrupt open (Round 32's own finding). The list
                  unmounts on exit, so collapsed steps are never left focusable
                  behind a zero-height box. */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="substeps"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    {/* A tree: one trunk dropping from under the chapter's own
                        disc (12px row padding + half a 24px disc = 24px), with
                        an elbow out to each step. Drawn with borders on the rows
                        themselves rather than one absolute rule, so the trunk
                        always ends at the last elbow however many steps there
                        are. */}
                <ol className="mr-3 ml-6 flex flex-col">
                  {section.substeps!.map((sub) => {
                    const subState =
                      sub.stepIndex === stepIndex
                        ? 'current'
                        : sub.stepIndex <= furthestIndex
                          ? 'reached'
                          : 'ahead'
                    // Behind the coach, so genuinely finished — the step being
                    // read right now has not been completed yet.
                    const subDone = sub.stepIndex < stepIndex
                    return (
                      <li
                        key={sub.label}
                        className={cn(
                          'relative pl-4',
                          // Square elbows, not curved (direct instruction): a
                          // trunk that runs full height, stopping halfway down
                          // the last step so it ends on that step's own elbow.
                          'before:absolute before:top-0 before:left-0 before:w-px before:bg-ink-faint before:content-[""]',
                          'before:h-full last:before:h-1/2',
                          'after:absolute after:top-1/2 after:left-0 after:h-px after:w-3 after:bg-ink-faint after:content-[""]',
                        )}
                      >
                        <button
                          type="button"
                          disabled={subState === 'ahead'}
                          aria-current={subState === 'current' ? 'step' : undefined}
                          onClick={() => onJump(sub.stepIndex)}
                          className={cn(
                            'relative flex min-h-9 w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                            subState === 'current' && 'bg-purple-200/60 text-caption-medium text-primary',
                            subState === 'reached' && 'text-ink-muted hover:text-primary',
                            subState === 'ahead' && 'cursor-default text-ink-muted',
                          )}
                        >
                          {/* Only rendered once the step is finished — no
                           *  reserved slot on the others (direct instruction),
                           *  which was leaving 24px of dead space in front of
                           *  every unticked label. */}
                          {subDone && (
                            <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
                          )}
                          {sub.label}
                          {subDone && <span className="sr-only"> (complete)</span>}
                        </button>
                      </li>
                    )
                  })}
                </ol>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>
      )}
    </nav>
  )
}
