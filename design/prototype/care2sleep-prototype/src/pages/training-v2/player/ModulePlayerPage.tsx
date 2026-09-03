import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppHeader } from '@/components/AppHeader'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { PATHWAY_MODULES_V2 } from '@/data/trainingPathwayV2'
import { MODULE_CONTENT } from '@/data/moduleContent'
import { buildPlayerSteps, type PlayerStep } from '../playerSteps'
import { getModuleStepIndex, setModuleStepIndex, resetModuleProgress } from '../moduleProgressStore'
import {
  ModulePlayerNav,
  OUTLINE_RAIL_COLLAPSED_PX,
  OUTLINE_RAIL_OPEN_PX,
} from './ModulePlayerNav'
import { ModulePlayerFooter, type FooterReadyState, type OnReadyChange } from './ModulePlayerFooter'
import { ModuleIntroScreen } from './ModuleIntroScreen'
import { ChapterMarkerScreen } from './ChapterMarkerScreen'
import { ChapterLearnScreen } from './ChapterLearnScreen'
import { CaseExampleScreen } from './CaseExampleScreen'
import { KnowledgeCheckScreen } from './KnowledgeCheckScreen'
import { WhatToExpectScreen } from './WhatToExpectScreen'
import { ChapterCompleteScreen } from './ChapterCompleteScreen'
import { ModuleOutroScreen } from './ModuleOutroScreen'
import { ModuleFeedbackSlide } from './ModuleFeedbackSlide'
import { ModuleCompleteScreen } from './ModuleCompleteScreen'

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
}

/**
 * Route element for `/training-v2/module/:moduleId/play`. Only fully wired
 * for `understanding-sleep` (design-tokens.md §26; re-keyed from the Round
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

  const [footerState, setFooterState] = useState<FooterReadyState>({ canContinue: false })
  const handleReadyChange = useCallback<OnReadyChange>((state) => setFooterState(state), [])

  function exitToTimeline() {
    navigate(fromModuleId ? `/training-v2/module/${fromModuleId}/overview` : '/delivery/learning')
  }

  // Every step advances via `goNext` except the module's own last step,
  // whose "continue" actually means "leave the player" — computed here so
  // no individual screen needs to know or care which action Continuing
  // triggers.
  function handleFooterClick() {
    if (steps[stepIndex]?.kind === 'complete') {
      exitToTimeline()
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

  const totalChapters = content.chapters.length
  const safeStepIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1)

  function renderStep(s: PlayerStep, onReadyChange?: OnReadyChange) {
    switch (s.kind) {
      case 'intro':
        return <ModuleIntroScreen content={content!} onReadyChange={onReadyChange} />
      case 'chapter-marker':
        return (
          <ChapterMarkerScreen chapter={content!.chapters[s.chapterIndex]} onReadyChange={onReadyChange} />
        )
      case 'learn':
        return (
          <ChapterLearnScreen chapter={content!.chapters[s.chapterIndex]} onReadyChange={onReadyChange} />
        )
      case 'case':
        return (
          <CaseExampleScreen
            caseExample={content!.chapters[s.chapterIndex].cases[s.caseIndex]}
            index={s.caseIndex}
            onReadyChange={onReadyChange}
          />
        )
      case 'knowledge-check':
        return (
          <KnowledgeCheckScreen chapter={content!.chapters[s.chapterIndex]} onReadyChange={onReadyChange} />
        )
      case 'what-to-expect':
        return (
          <WhatToExpectScreen chapter={content!.chapters[s.chapterIndex]} onReadyChange={onReadyChange} />
        )
      case 'chapter-complete':
        return (
          <ChapterCompleteScreen
            chapter={content!.chapters[s.chapterIndex]}
            isLastChapter={s.chapterIndex === totalChapters - 1}
            onReadyChange={onReadyChange}
          />
        )
      case 'outro':
        return <ModuleOutroScreen content={content!} onReadyChange={onReadyChange} />
      case 'feedback':
        return <ModuleFeedbackSlide onReadyChange={onReadyChange} />
      case 'complete':
        return <ModuleCompleteScreen module={module!} onReadyChange={onReadyChange} />
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
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
        <main id="main-content" className="min-w-0 flex-1 overflow-y-auto">
          {/* Clamped at render, not only in the effect above: stored progress
              past the end of the step machine (a shortened module, a hand-set
              key) used to be harmless because the old stack *sliced* the array.
              Indexing it directly blanks the page a whole paint before the
              clamp effect can run. */}
          <motion.div key={safeStepIndex} {...stepMotion} className="h-full">
            {renderStep(steps[safeStepIndex], handleReadyChange)}
          </motion.div>
        </main>
      </div>

      <ModulePlayerFooter
        label={footerState.label ?? 'Next slide'}
        disabled={!footerState.canContinue}
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
