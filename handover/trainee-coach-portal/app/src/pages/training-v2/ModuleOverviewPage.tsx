import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Progress } from '@/components/ui/progress'
import { moduleArt } from '@/components/ModuleCard'
import { cn } from '@/lib/utils'
import { PATHWAY_MODULES_V2 } from '@/data/trainingPathwayV2'
import { MODULE_OVERVIEW_CONTENT } from '@/data/moduleOverviewContent'
import { realPlayerContentId } from './pathway'
import { getModuleStepIndex } from './moduleProgressStore'
import { chapterProgress, outroStepIndex, feedbackStepIndex, edgeStepProgress } from './playerSteps'

/**
 * Module overview page (Figma node 1:1433) — the hub a coach lands on
 * after clicking a module's card CTA on the home timeline ("Start Module
 * N" / "Resume Module" / "Restart Module"), replacing the old
 * `ModulePreviewModal` overlay outright. Route: `/training-v2/module/:id/overview`.
 *
 * This is the first build of what's meant to be a *generic template* for
 * every module going forward: a full-bleed hero (badge/title/description/
 * estimated time) over `moduleArt()`'s gradient wash (no fabricated
 * photography, same rule as every other cover in this app), then a
 * "Module outline" list (module intro → one row per chapter → module
 * outro) beside a "By the end of this module" outcomes card. Only
 * `understanding-sleep` has real outline content this round
 * (`data/moduleOverviewContent.ts`) — any other module id renders the same
 * hero (real title/description/time already exist for all 11 in
 * `trainingPathwayV2.ts`) with a plain "coming soon" placeholder below it,
 * so the template degrades gracefully rather than erroring.
 *
 * Row state (completed/current/locked) is derived from the same stored
 * step index the in-module player reads (`moduleProgressStore` +
 * `playerSteps.ts`'s chapter-range helpers) — resolved through
 * `realPlayerContentId()` so module 2's page reflects the same live
 * progress as `understanding-sleep` itself, per that module's demo
 * redirect. Per direct instruction, in-module player screens themselves
 * are untouched this round — this page only ever *links into* them
 * (`/training-v2/module/:realId/play`, same URL shape `ModulePlayerPage`
 * already expects).
 *
 * Reached exclusively from the Coach Delivery Portal's Learning tab
 * (`/delivery/learning`) — the standalone Coach Training Portal home this
 * page originally belonged to is retired, so "Back to my learnings" always
 * returns there now (an earlier round branched this on an `origin` query
 * param carrying which of two possible homes a coach came from; with only
 * one left, that branching was removed as dead weight).
 */

type RowState = 'completed' | 'current' | 'locked'

interface OutlineRow {
  key: string
  title: string
  metaParts: string[]
  state: RowState
  progressPercent?: number
  cta?: { label: string; variant: 'ghost' | 'primary'; onClick: () => void }
  lockHint?: string
}

function MetaLine({ parts }: { parts: string[] }) {
  // Each separator is glued to the *end* of the part before it (not the
  // start of the part after) so a narrow-width wrap can only ever strand a
  // trailing "·" at the end of a line, never a leading orphaned "·" opening
  // the next one — the latter reads like a stray bullet point. Found on a
  // 3-part row ("Module introduction · Completed · ~1 min") at 375px,
  // where the old start-glued separator wrapped to its own line as "· ~1
  // min"; 2-part rows were never affected, only this one 3-part row.
  return (
    <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-caption text-ink-muted">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-2">
          <span>{part}</span>
          {i < parts.length - 1 && <span aria-hidden="true">·</span>}
        </span>
      ))}
    </p>
  )
}

function OutlineRowView({ row, number }: { row: OutlineRow; number: number }) {
  return (
    <div className="flex items-center justify-between gap-6" data-node-id="631:9899">
      {/* The step number. `aria-hidden` because the rows are a real `<ol>`,
       *  so a screen reader already announces the position — rendering it
       *  here too would read the ordinal twice on every row. */}
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center self-start rounded-full bg-purple-50 text-caption-medium tabular-nums text-primary"
      >
        {number}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="text-body-md text-ink">{row.title}</h3>
        <MetaLine parts={row.metaParts} />
        {row.state === 'current' && row.progressPercent !== undefined && (
          <Progress
            value={row.progressPercent}
            aria-label={`${row.title} progress`}
            className="mt-1 w-full max-w-[240px] [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-divider-soft"
          />
        )}
      </div>

      {row.cta && (
        <button
          type="button"
          onClick={row.cta.onClick}
          className={cn(
            // The frame draws a 35px pill; 36px is the app's floor, and this is
            // the canonical primary/ghost pair rather than the frame's chrome.
            'inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-caption-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
            row.cta.variant === 'primary'
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'text-ink hover:bg-divider-soft',
          )}
        >
          {row.cta.label}
        </button>
      )}
      {row.lockHint && (
        <span className="flex shrink-0 items-center gap-1.5 text-caption text-ink-faint">
          <Lock aria-hidden="true" className="size-3.5" />
          {row.lockHint}
        </span>
      )}
      {/* The frame marks a completed row only by its meta line ("Completed"),
          with no tinted background or check badge — the row list is a plain
          reading order, not a status board. */}
    </div>
  )
}

/** One titled bullet list inside the outcomes card (frame `631:9648` /
 *  `631:9654`). Both sections are the same shape, so they share one component
 *  rather than being written twice with a chance to drift. */
function OutcomesSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-title text-ink">{title}</h2>
      <ul className="flex flex-col gap-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-1.5 flex size-1 shrink-0 rounded-full bg-ink-muted" />
            <span className="text-caption text-ink-muted">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NotAvailable({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader portal="training-v2" />
      <main className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-display text-title">Not available yet</h1>
        <p className="mt-2 text-body text-ink-faint">This module doesn't have an overview page yet.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
        >
          Back to your modules
        </button>
      </main>
    </div>
  )
}

export function ModuleOverviewPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const moduleIndex = moduleId ? PATHWAY_MODULES_V2.findIndex((m) => m.id === moduleId) : -1
  const module = moduleIndex >= 0 ? PATHWAY_MODULES_V2[moduleIndex] : undefined

  // Accessibility fix (Round 7.1 review): this page is a real navigation
  // destination reached two ways — a home-timeline card click, and the
  // in-module player's "Exit" button — and React Router doesn't remount
  // this component across either transition (same route element, just a
  // changed `:moduleId` param), so the browser never resets focus on its
  // own. Without this, a keyboard/screen-reader user's focus silently
  // stays wherever it was (or drops to `<body>`), the same class of gap
  // already fixed once in `PasswordChangeCard` (Round 6.2.1). Moving focus
  // to this page's own H1 on every module-id change gives a clear,
  // consistent landing point for both entry paths.
  useEffect(() => {
    headingRef.current?.focus()
  }, [moduleId])

  function backToTimeline() {
    navigate('/delivery/learning')
  }

  if (!module) return <NotAvailable onBack={backToTimeline} />

  const realId = realPlayerContentId(module.id)
  const overview = MODULE_OVERVIEW_CONTENT[realId]

  // Captured here rather than read as `module.id` inside `goToPlayer` below.
  // `goToPlayer` is a hoisted `function` declaration, so TypeScript discards
  // the `if (!module) return` narrowing above when analysing its body (the
  // declaration is reachable before the guard runs, even though every real
  // call site is in the JSX rendered after it) — that was the long-standing
  // `TS18048: 'module' is possibly 'undefined'` this file carried for many
  // rounds while being written off as unrelated. Reading the id once, after
  // the guard, is narrowing the compiler can actually see.
  const thisModuleId = module.id

  // `from` carries *this* overview page's own module id (not `realId`,
  // which the demo redirect may point at a different module entirely —
  // e.g. module 2's overview links into `understanding-sleep`'s player).
  // The player reads it back so its "Exit" returns here, not to
  // `realId`'s own overview page or a generic home-timeline fallback.
  function goToPlayer(opts?: { restart?: boolean }) {
    const params = new URLSearchParams({ from: thisModuleId })
    if (opts?.restart) params.set('restart', '1')
    navigate(`/training-v2/module/${realId}/play?${params.toString()}`)
  }

  let rows: OutlineRow[] = []
  let objectives: string[] = []

  if (overview) {
    const stepIndex = getModuleStepIndex(realId)
    const chapterCount = overview.chapters.length
    objectives = overview.objectives

    const introDone = stepIndex > 0
    const introRow: OutlineRow = {
      key: 'intro',
      title: 'Situations you might encounter',
      metaParts: introDone
        ? ['Module introduction', 'Completed', overview.introDurationLabel]
        : ['Module introduction', overview.introDurationLabel],
      state: introDone ? 'completed' : 'current',
      cta: introDone
        ? { label: 'Restart', variant: 'ghost', onClick: () => goToPlayer({ restart: true }) }
        : { label: 'Start', variant: 'primary', onClick: () => goToPlayer() },
    }

    const chapterRows: OutlineRow[] = overview.chapters.map((chapter, i) => {
      const { state, progressPercent } = chapterProgress(stepIndex, i)
      const previousLabel =
        i === 0 ? 'the module intro' : `Chapter ${overview.chapters[i - 1].number}`

      return {
        key: chapter.id,
        title: chapter.title,
        metaParts:
          state === 'completed'
            ? [`Chapter ${chapter.number}`, 'Completed', chapter.durationLabel]
            : state === 'current'
              ? [`Chapter ${chapter.number}`, `${progressPercent}% complete`]
              : [`Chapter ${chapter.number}`, chapter.durationLabel],
        state,
        progressPercent,
        cta:
          state === 'current'
            ? {
                label: progressPercent && progressPercent > 0 ? 'Resume' : `Start Chapter ${chapter.number}`,
                variant: 'primary',
                onClick: () => goToPlayer(),
              }
            : undefined,
        lockHint: state === 'locked' ? `Complete ${previousLabel} to unlock` : undefined,
      }
    })

    // Round 22 direct edit: a new `feedback` step now sits between `outro`
    // and `complete` (`playerSteps.ts`) — `edgeStepProgress` (already used
    // for the intro row elsewhere) replaces the old ad hoc
    // `stepIndex >= completeIdx` check, which only worked because outro and
    // complete used to be adjacent; it silently misclassified the new
    // in-between step as "locked" rather than "completed".
    const outroStart = outroStepIndex(chapterCount)
    const feedbackStart = feedbackStepIndex(chapterCount)
    const outroState = edgeStepProgress(stepIndex, outroStart).state
    const feedbackState = edgeStepProgress(stepIndex, feedbackStart).state
    const lastChapterNumber = overview.chapters[chapterCount - 1]?.number
    const outroRow: OutlineRow = {
      key: 'outro',
      title: 'Your turn to practice',
      metaParts:
        outroState === 'completed'
          ? ['Module outro', 'Completed', overview.outroDurationLabel]
          : ['Module outro', overview.outroDurationLabel],
      state: outroState,
      cta: outroState === 'current' ? { label: 'Continue', variant: 'primary', onClick: () => goToPlayer() } : undefined,
      lockHint: outroState === 'locked' ? `Complete Chapter ${lastChapterNumber} to unlock` : undefined,
    }
    const feedbackRow: OutlineRow = {
      key: 'feedback',
      title: 'Module feedback',
      metaParts:
        feedbackState === 'completed'
          ? ['Module feedback', 'Completed']
          : ['Module feedback', '~1 min'],
      state: feedbackState,
      cta:
        feedbackState === 'current'
          ? { label: 'Continue', variant: 'primary', onClick: () => goToPlayer() }
          : undefined,
      lockHint: feedbackState === 'locked' ? 'Complete Module outro to unlock' : undefined,
    }

    rows = [introRow, ...chapterRows, outroRow, feedbackRow]
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader portal="training-v2" />

      {/* HANDOVER PACKAGE ONLY — accessibility fix, WCAG 2.4.1.
          This page had no `<main>` and no `#main-content`, so `AppHeader`'s
          "Skip to main content" link pointed at nothing and did nothing here —
          measured. Every other route in the portal has one; the player route
          (`ModulePlayerPage.tsx:264`) is the pattern this copies. Purely a
          landmark wrapper: no layout, no styling, no change to what renders. */}
      <main id="main-content" tabIndex={-1} className="outline-none">
      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0" style={moduleArt(module.cover.colors)} />
        <div aria-hidden="true" className="absolute inset-0 bg-black/70" />

        {/* Padding lives here, on the centered content box, not on the
         *  full-bleed background wrapper above — matching the outline
         *  section below exactly, so "Back to my learnings"/the title and
         *  "Module outline:" line up on the same left edge at every
         *  breakpoint (previously the hero's padding was on the outer
         *  wrapper, stacking with this box's own centering margin and
         *  pushing the hero content ~64px further right than the outline
         *  below it). */}
        {/* Frame `631:9632`: 112px gutters, 56px top/bottom, and **no centred
            max-width** — the hero runs the full width of the page, so its 112px
            gutter is what lines the title up with "Module outline:" below. */}
        <div className="relative flex flex-col gap-[22px] px-6 py-14 md:px-12 lg:px-28 lg:py-14">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-16">
              <button
                type="button"
                onClick={backToTimeline}
                className="-m-2 inline-flex w-fit items-center gap-1.5 rounded-full p-2 text-[15px] font-semibold text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowLeft aria-hidden="true" className="size-3.5" />
                Back to Learning
              </button>

              <span className="inline-flex w-fit items-center rounded-full bg-parchment px-2 py-1 text-caption-medium text-ink">
                Module {moduleIndex + 1}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-display-lg text-white outline-none"
              >
                {module.title}
              </h1>
              <p className="text-body leading-[1.4] text-white">{module.description}</p>
            </div>
          </div>

          <p className="text-caption-medium text-white">
            Estimated Time: Approx. {module.estimatedMinutes} min
          </p>
        </div>
      </div>

      {overview ? (
        <div className="px-6 py-16 md:px-12 lg:px-28">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
            <div className="flex min-w-0 flex-col gap-8 lg:flex-1">
              <h2 className="font-display text-title text-ink">Module outline:</h2>
              {/* A standalone hairline between rows, sharing the same
               *  `gap-4` rhythm as the rows themselves (matching the
               *  reference's own separate `Separator` instances) — not a
               *  `divide-y` border fused flush against each row's own edge,
               *  which reads as an underline attached to the row above it
               *  rather than an independent rule with even spacing on both
               *  sides. */}
              <ol className="flex flex-col gap-4">
                {rows.map((row, i) => (
                  <li key={row.key} className="flex flex-col gap-4">
                    {i > 0 && <div aria-hidden="true" className="h-px w-full bg-hairline" />}
                    <OutlineRowView row={row} number={i + 1} />
                  </li>
                ))}
              </ol>
            </div>

            {/* Frame `631:9647`. Yellow, not the old `pearl`; the green check
                badges are gone in favour of the frame's small dot, which stops
                a list of *outcomes* reading as a list of completed items.

                One section. The frame draws a second, "Why is this important?",
                filled with the same sentence pasted twice; it was built briefly
                against a real `whyImportant` field and then removed on direct
                instruction. `OutcomesSection` stays a component so a second
                section is a one-line addition if it comes back. */}
            <div className="flex flex-col gap-8 rounded-lg border border-yellow-100 bg-yellow-50 p-6 shadow-card lg:w-[376px] lg:shrink-0">
              <OutcomesSection title="What you will get from this module" items={objectives} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[1200px] px-6 py-16 text-center md:px-8">
          <p className="text-body text-ink-faint">Module breakdown coming soon.</p>
        </div>
      )}
      </main>
    </div>
  )
}
