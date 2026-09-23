import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppHeader } from '@/components/AppHeader'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { PATHWAY_MODULES_V2 } from '@/data/trainingPathwayV2'
import { MODULE_CONTENT } from '@/data/moduleContent'
import { buildPlayerSteps, type PlayerStep } from '../playerSteps'
import { ScrollCue } from '@/components/shared/ScrollCue'
import { getModuleStepIndex, setModuleStepIndex, resetModuleProgress } from '../moduleProgressStore'
import {
  ModulePlayerNav,
  OUTLINE_RAIL_COLLAPSED_PX,
  OUTLINE_RAIL_OPEN_PX,
} from './ModulePlayerNav'
import { ModulePlayerFooter, type FooterReadyState, type OnReadyChange } from './ModulePlayerFooter'
import { useScrollGate, type SlideGateState } from './slideGate'
import { BlockSlide } from './BlockSlide'
import { ModuleFeedbackSlide } from './ModuleFeedbackSlide'
import { ModuleCompleteScreen } from './ModuleCompleteScreen'
import { nextModuleFromOutro } from './blocks/BlockRenderer'

/** The row's own inset, frame `665:942`. The wash is measured from the rail's
 *  right edge, which is this plus the rail's width. */
const ROW_PADDING_PX = 24
/** Frame `2065:1877`, as ratios of the rail's right edge — see the note at the
 *  call site for why they are ratios and not the frame's own percentages. */
const WASH_SOLID_RATIO = 256 / 354
const WASH_FADE_RATIO = 602 / 354

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
}

/**
 * Route element for `/training-v2/module/:moduleId/play`. Only fully wired
 * for `building-blocks-good-sleep` (design-tokens.md §26; re-keyed from the Round
 * 1-era `sleep-basics` id once Option B's home page moved to its own real
 * 11-module dataset, `data/trainingPathwayV2.ts`) — any other module id
 * renders a simple "not available yet" state, since no other module has
 * populated `MODULE_CONTENT`. Looks the module up in `PATHWAY_MODULES_V2`
 * (Option B's own dataset), not `data/portal.ts`'s shared `modules` —
 * `getModule()` there has no entry for the new id, and this player must
 * never read from the shared array Option A still depends on.
 */
export function ModulePlayerPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const restart = searchParams.get('restart') === '1'
  // The overview page's own module id, e.g. `population-understanding`,
  // which may differ from this route's `moduleId` (a demo redirect can
  // point several overview pages at the same real content). Falls back to
  // this player's own `moduleId` when opened without that context (e.g. a
  // direct URL), so "Exit" still lands somewhere sensible either way.
  const fromModuleId = searchParams.get('from') ?? moduleId

  const module = moduleId ? PATHWAY_MODULES_V2.find((m) => m.id === moduleId) : undefined
  const content = moduleId ? MODULE_CONTENT[moduleId] : undefined

  const didInitRestart = useRef(false)
  if (moduleId && restart && !didInitRestart.current) {
    resetModuleProgress(moduleId)
    didInitRestart.current = true
  }

  const steps = content ? buildPlayerSteps(content) : []
  const [stepIndex, setStepIndex] = useState<number>(() =>
    moduleId ? (restart ? 0 : getModuleStepIndex(moduleId)) : 0,
  )

  // Clamp in case stored progress somehow exceeds the current step count
  // (e.g. content shape changed). Belt-and-braces, not expected in practice.
  useEffect(() => {
    if (stepIndex > steps.length - 1) setStepIndex(Math.max(0, steps.length - 1))
    // Only re-check when the step count itself could differ (module load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length])

  function goToStep(next: number) {
    setStepIndex(next)
    if (moduleId) setModuleStepIndex(moduleId, next)
  }

  function goNext() {
    goToStep(Math.min(stepIndex + 1, steps.length - 1))
  }

  function goPrevious() {
    goToStep(Math.max(stepIndex - 1, 0))
  }

  // The one global Continue control's readiness — only ever driven by
  // whichever slide is currently active (see `renderStep`'s `onReadyChange`
  // wiring below). Its default ('Continue', disabled) is a safe first
  // paint before that slide's own effect reports in.
  // The outline rail's collapsed state lives here, not in the rail: the footer
  // offsets its slide buttons by the rail's *current* width to keep them
  // centred on the content column.
  const [outlineOpen, setOutlineOpen] = useState(true)
  // Leaving mid-module is confirmed, because the control sits beside the two
  // slide buttons and one stray click otherwise drops the coach out of the
  // module entirely. The dialog says the progress is kept, which is true —
  // `setModuleStepIndex` has persisted every step already.
  const [confirmExit, setConfirmExit] = useState(false)

  // The scrolling element — for the "Scroll to see more" cue and for the scroll
  // half of the slide gate. The player is a fixed-height flex column, so
  // `<main>` is what overflows, not the window.
  const mainRef = useRef<HTMLElement>(null)

  const [footerState, setFooterState] = useState<FooterReadyState>({ canContinue: false })
  const handleReadyChange = useCallback<OnReadyChange>((state) => setFooterState(state), [])

  /**
   * A `module.md` slide **is** gated (direct instruction, 2026-09-18). It used
   * to report `canContinue: true` unconditionally from here, on the reasoning
   * that a slide is content and nothing on it has to be completed — that is now
   * reversed: reading or watching is gated on reaching the bottom of the slide,
   * and a slide carrying interactive blocks is gated on those blocks being
   * worked through. See `slideGate.tsx` for the full rule and why it latches.
   *
   * The two shell steps still report their own state through `onReadyChange`,
   * as before. The **last step is never gated** — its control means "leave the
   * player", and there is nothing left to complete behind it.
   */
  const currentStep = steps[Math.min(Math.max(stepIndex, 0), steps.length - 1)]
  const currentKind = currentStep?.kind
  const currentSlideId = currentStep?.kind === 'slide' ? currentStep.slide.id : `step-${stepIndex}`

  /**
   * Every slide starts at the top.
   *
   * `<main>` is a single persistent scroll container — only its *contents* are
   * swapped — so its `scrollTop` survives a slide change. Found by walking the
   * module with the gate in place: after scrolling to the bottom of a long
   * slide, the next slide arrived already scrolled down, which both started the
   * coach part-way into content they had not seen and satisfied that slide's
   * scroll gate the instant it mounted.
   *
   * Layout-effect, not an effect: it has to land before the browser paints, or
   * the new slide is visibly drawn at the old offset and then jumps.
   */
  useLayoutEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [stepIndex])

  // Measured against `<main>`, which is the element that scrolls — the slide
  // itself has no scrollbar of its own to watch.
  const scrollSatisfied = useScrollGate(mainRef, currentSlideId)
  const [slideGate, setSlideGate] = useState<SlideGateState>({ ready: false, reason: 'scroll' })
  const handleGateChange = useCallback((state: SlideGateState) => setSlideGate(state), [])

  useEffect(() => {
    if (currentKind !== 'slide') return
    setFooterState({
      canContinue: slideGate.ready,
      label: 'Next slide',
      lockedReason: slideGate.reason,
    })
  }, [currentKind, stepIndex, slideGate.ready, slideGate.reason])

  function exitToTimeline() {
    navigate(fromModuleId ? `/training-v2/module/${fromModuleId}/overview` : '/delivery/learning')
  }

  /** My Learning. The completion step's footer control and the "Coming up
   *  next" card's second CTA both say "Go to my learnings" and both land here
   *  — one label, one destination, two places it is offered.
   *
   *  ⚠️ Deliberately NOT `exitToTimeline`, which returns to whichever module
   *  overview the player was opened from. This control names a destination, so
   *  it goes there. */
  function goToLearning() {
    navigate('/delivery/learning')
  }

  // Every step advances via `goNext` except the module's own last step,
  // whose "continue" actually means "leave the player" — computed here so
  // no individual screen needs to know or care which action Continuing
  // triggers. On that step it is My Learning, because that is what the
  // control says (direct instruction, 2026-09-18).
  function handleFooterClick() {
    if (steps[stepIndex]?.kind === 'complete') {
      goToLearning()
    } else {
      goNext()
    }
  }

  // Arrow keys move between slides, the same two moves the footer's Previous /
  // Next pair makes — the player shows one slide at a time now, so there is no
  // scrolling for the arrows to compete with.
  //
  // Ignored while focus is inside a field or a native control that owns the
  // arrows itself (a knowledge-check textarea, a select), otherwise typing in
  // one would skip the slide out from under the coach. Forward still respects
  // the current slide's own readiness — a key must not do what the disabled
  // Next button will not.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement as HTMLElement | null
      if (
        el &&
        (el.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
          el.getAttribute('role') === 'slider')
      ) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (!footerState.canContinue) return
        e.preventDefault()
        handleFooterClick()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (stepIndex === 0) return
        e.preventDefault()
        goPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!module || !content) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader portal="training-v2" />
        <main className="mx-auto max-w-[560px] px-6 py-20 text-center">
          <h1 className="font-display text-title">Not available yet</h1>
          <p className="mt-2 text-body text-ink-faint">
            This module doesn't have its player content built yet.
          </p>
          <button
            type="button"
            onClick={exitToTimeline}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
          >
            Back to your modules
          </button>
        </main>
      </div>
    )
  }

  const safeStepIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1)

  function renderStep(s: PlayerStep, onReadyChange?: OnReadyChange) {
    switch (s.kind) {
      case 'slide':
        return (
          <BlockSlide
            slide={s.slide}
            railOpen={outlineOpen}
            scrollSatisfied={scrollSatisfied}
            onGateChange={handleGateChange}
          />
        )
      case 'feedback':
        return <ModuleFeedbackSlide onReadyChange={onReadyChange} railOpen={outlineOpen} />
      case 'complete':
        return (
          <ModuleCompleteScreen
            module={module!}
            moduleNumber={PATHWAY_MODULES_V2.findIndex((m) => m.id === module!.id) + 1}
            outroBlocks={content!.outroSlide.blocks}
            railOpen={outlineOpen}
            // Into the module the card names — its id comes from the same
            // helper the card's own copy reads, so the button and the line
            // above it cannot point at different modules. Falls back to the
            // module list if the number does not resolve.
            actions={{
              onContinueNextModule: () => {
                const next = nextModuleFromOutro(
                  content!.outroSlide.blocks.find((b) => b.tag === 'chapter-outro') as never,
                )
                if (next) navigate(`/training-v2/module/${next.id}/overview`)
                else exitToTimeline()
              },
            }}
            onReadyChange={onReadyChange}
          />
        )
    }
  }

  /**
   * The warm wash behind the outline rail.
   *
   * Frame `2065:1877` puts it on the shell root as
   * `linear-gradient(to left, #fffcfa 60.157%, #fff8e5 83.057%)` — read
   * left-to-right, solid `yellow-50` for the first 16.943% of a 1512px frame
   * (256px), fully back to `--background` by 39.843% (602px).
   *
   * ⚠️ **Those percentages are not transcribed, because the gradient has to
   * move with the rail** (direct instruction). The frame's numbers describe one
   * rail state — 330px open, inset 24, so its right edge is at 354 — which
   * makes them ratios of that edge rather than of the viewport:
   *
   *   solid ends  256 / 354 = 0.7237
   *   fade ends   602 / 354 = 1.7017
   *
   * Collapse the rail to 76 and the whole wash follows it in, which is the
   * behaviour asked for and something a viewport percentage could not do.
   *
   * It is rendered as a **sized layer with a fixed internal gradient**, not as
   * a `background-image` on the root with computed stops: `background-image` is
   * not animatable, so the wash would jump while the rail glided. A width is,
   * and it carries the rail's own 200ms ease-out so the two move as one thing.
   */
  const railRight = ROW_PADDING_PX + (outlineOpen ? OUTLINE_RAIL_OPEN_PX : OUTLINE_RAIL_COLLAPSED_PX)
  const washWidth = railRight * WASH_FADE_RATIO

  return (
    // `isolate` so the wash below can sit at `-z-10` — behind every slide,
    // header and footer, but still above the root's own `bg-background`.
    <div className="relative isolate flex h-screen flex-col overflow-hidden bg-background">
      {/* Desktop only. The rail itself is `hidden lg:block`, so below `lg` there
          is no side nav for the wash to sit behind or move with — gating it on
          anything else would leave a warm band with nothing to explain it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden transition-[width] duration-200 ease-out lg:block"
        style={{
          width: washWidth,
          // 0.7237 / 1.7017 = the frame's solid-yellow stop expressed inside
          // this layer rather than against the viewport.
          backgroundImage: `linear-gradient(to right, var(--color-yellow-50) 0, var(--color-yellow-50) ${((WASH_SOLID_RATIO / WASH_FADE_RATIO) * 100).toFixed(2)}%, transparent 100%)`,
        }}
      />

      <AppHeader portal="training-v2" />

      {/* Frame `665:942`: 24px around the row, 32px between the outline card
          and the content column. The top progress bar this row used to sit
          under is gone — the frame no longer draws it, and its Exit control
          now lives in the footer as "Go Back Home". */}
      <div className="flex min-h-0 flex-1 gap-8 p-6">
        {/* The outline rail. Backwards-only: `goToStep` persists through
         *  `setModuleStepIndex`, which never regresses a stored index, so
         *  re-reading an earlier chapter cannot cost a coach their progress. */}
        <ModulePlayerNav
          content={content}
          moduleNumber={PATHWAY_MODULES_V2.findIndex((m) => m.id === module!.id) + 1}
          moduleTitle={module.title}
          stepIndex={stepIndex}
          furthestIndex={Math.max(stepIndex, moduleId ? getModuleStepIndex(moduleId) : 0)}
          onJump={goToStep}
          open={outlineOpen}
          onToggleOpen={() => setOutlineOpen((v) => !v)}
          progressPercent={Math.round((safeStepIndex / Math.max(steps.length - 1, 1)) * 100)}
        />

        {/* One slide at a time, and no scrolling (direct instruction) — the
            player used to keep every visited slide mounted in a scroll stack
            (the old §29/§31 behaviour). A coach moves with the footer's
            Previous / Next pair, the outline rail, or the arrow keys. */}
        {/* `overflow-y-auto`, not `hidden`: the scroll *stack* is gone, but a
            single slide can still be taller than the area on a short window —
            measured, 3 of Chapter 1's 7 slides overflow a 622px content area
            at an 802px window. Clipping them would put real content out of
            reach with no way to get to it. Nothing scrolls when a slide fits,
            which is every slide at the frame's own height. */}
        {/* `relative` is load-bearing: `ScrollCue` pins to this container's own
            bottom-right rather than the viewport's, so it sits over the slide
            column and never over the outline rail or the footer. */}
        <div className="relative flex min-w-0 flex-1 flex-col">
        <main id="main-content" ref={mainRef} className="min-w-0 flex-1 overflow-y-auto">
          {/* Clamped at render, not only in the effect above: stored progress
              past the end of the step machine (a shortened module, a hand-set
              key) used to be harmless because the old stack *sliced* the array.
              Indexing it directly blanks the page a whole paint before the
              clamp effect can run. */}
          <motion.div key={safeStepIndex} {...stepMotion} className="h-full">
            {renderStep(steps[safeStepIndex], handleReadyChange)}
          </motion.div>
        </main>
        {/* Slides can now be taller than the content area — a Know What slide
            carrying four `<Text block_3>` strategy write-ups genuinely is.
            Direct instruction: that is fine, but say so, with the same cue the
            Consumer Portal uses. `variant="app"` because the coach portal is on
            `--primary`, not `consumer-primary`. */}
        {/* `bottom-0`, overriding the shared cue's own `bottom-6`. Direct
            instruction: sit it lower, bottom-aligned to where the side nav
            ends. Measured, the outline rail and this content column are
            siblings in one row and end on the same line (both 712 at an 820px
            window), so the rail's bottom edge IS the container's — no offset
            needed, and no magic number that would drift if the footer changed
            height. It is passed here rather than changed in `ScrollCue`
            because that component's other caller, the Consumer Portal shell,
            measures the *window* and pins `fixed` to the viewport, where 24px
            of clearance is still right. */}
        <ScrollCue containerRef={mainRef} variant="app" className="bottom-0" />
        </div>
      </div>

      <ModulePlayerFooter
        label={footerState.label ?? 'Next slide'}
        disabled={!footerState.canContinue}
        lockedReason={footerState.lockedReason ?? null}
        onClick={handleFooterClick}
        onPrevious={stepIndex > 0 ? () => goToStep(stepIndex - 1) : undefined}
        onExit={() => setConfirmExit(true)}
        railWidth={outlineOpen ? OUTLINE_RAIL_OPEN_PX : OUTLINE_RAIL_COLLAPSED_PX}
      />

      <ConfirmDialog
        open={confirmExit}
        title="Leave this module?"
        body="Your progress is saved. You can come back and pick up from exactly where you left off."
        confirmLabel="Go back home"
        cancelLabel="Stay here"
        onConfirm={exitToTimeline}
        onClose={() => setConfirmExit(false)}
      />
    </div>
  )
}
