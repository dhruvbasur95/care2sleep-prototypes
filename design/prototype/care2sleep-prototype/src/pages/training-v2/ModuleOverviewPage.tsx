import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Progress } from '@/components/ui/progress'
import { moduleArt } from '@/components/ModuleCard'
import { cn } from '@/lib/utils'
import { PATHWAY_MODULES_V2 } from '@/data/trainingPathwayV2'
import { MODULE_OVERVIEW_CONTENT } from '@/data/moduleOverviewContent'
import { MODULE_CONTENT } from '@/data/moduleContent'
import { PRACTICE_SKILLS_INTRO } from './player/blocks/BlockRenderer'
import { livePlayerStatus, realPlayerContentId } from './pathway'
import { SIPTEA_BG, SIPTEA_INITIALS, splitChapterSkills } from '@/data/siptea'
import { getModuleStepIndex } from './moduleProgressStore'
import { rangeProgress, sectionRanges } from './playerSteps'

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
 * `building-blocks-good-sleep` has real outline content this round
 * (`data/moduleOverviewContent.ts`) — any other module id renders the same
 * hero (real title/description/time already exist for all 11 in
 * `trainingPathwayV2.ts`) with a plain "coming soon" placeholder below it,
 * so the template degrades gracefully rather than erroring.
 *
 * Row state (completed/current/locked) is derived from the same stored
 * step index the in-module player reads (`moduleProgressStore` +
 * `playerSteps.ts`'s chapter-range helpers) — resolved through
 * `realPlayerContentId()` so module 1's page reflects the same live
 * progress as `building-blocks-good-sleep` itself, per that module's demo
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
  // e.g. module 2's overview links into `building-blocks-good-sleep`'s player).
  // The player reads it back so its "Exit" returns here, not to
  // `realId`'s own overview page or a generic home-timeline fallback.
  function goToPlayer(opts?: { restart?: boolean }) {
    const params = new URLSearchParams({ from: thisModuleId })
    if (opts?.restart) params.set('restart', '1')
    navigate(`/training-v2/module/${realId}/play?${params.toString()}`)
  }

  let rows: OutlineRow[] = []
  /** `undefined` until the coach has started — the hero shows no bar at 0%. */
  let modulePercent: number | undefined

  const playerContent = MODULE_CONTENT[realId]

  if (overview && playerContent) {
    const stepIndex = getModuleStepIndex(realId)
    // The same ranges the player's own outline rail reads, off the same step
    // machine — so the two outlines cannot disagree about where a chapter
    // starts or how long it is. This page previously multiplied a
    // `STEPS_PER_CHAPTER` constant, which silently mislabels every row from
    // the first multi-scenario chapter onwards.
    const ranges = sectionRanges(playerContent)

    /**
     * The outline offers exactly ONE control, and it always says the same two
     * things (direct instruction, 2026-09-18: *"always say start or resume
     * module. Map this button to only that part of chapter, where the user is
     * currently, i can resume from anywhere"*).
     *
     * It had been five labels — `Start`, `Restart`, `Resume`,
     * `Start Chapter N` and `Continue` — chosen per row type, which made the
     * same action read as five different ones depending on where the coach had
     * got to. Two labels, switched on one fact.
     *
     * `Resume learning`, not `Resume module` (direct instruction later the same
     * day: *"dont say resume module, say resume learning"*). The pair is
     * deliberately asymmetric and both halves are quoted instructions: you
     * start a *module*, and you resume your *learning*.
     */
    const resumeLabel = stepIndex > 0 ? 'Resume learning' : 'Start module'

    /**
     * Whole-module progress for the hero, shown only once the coach has
     * actually started (direct instruction, 2026-09-18: *"I want to know how
     * much entire module I have completed, after I start module, show a
     * progress bar with %completed"*).
     *
     * `livePlayerStatus()` rather than a percentage computed here: it already
     * divides the stored step index by the step machine's own length, which is
     * the identical formula `ModulePlayerPage` feeds its outline rail. Three
     * surfaces now report one number from one function — the rail inside the
     * player, the My Learning card, and this hero — so they cannot drift.
     */
    const live = livePlayerStatus(thisModuleId)
    modulePercent = live && live.progress > 0 ? live.progress : undefined

    /**
     * Where it goes is unchanged and is the other half of the instruction:
     * `goToPlayer()` names no step, and the player opens at the coach's own
     * stored index. The button is rendered on the CURRENT row for the same
     * reason — the row it sits beside is the section that index falls in, so
     * the control's position is a readout of where they are rather than a
     * second, separately-computed claim about it.
     */

    const introDone = stepIndex > ranges.intro.end
    const introRow: OutlineRow = {
      key: 'intro',
      title: playerContent.introSlide.navLabel,
      metaParts: introDone
        ? ['Module introduction', 'Completed', overview.introDurationLabel]
        : ['Module introduction', overview.introDurationLabel],
      state: introDone ? 'completed' : 'current',
      // No `Restart` once the intro is behind them: restarting is the opposite
      // of resuming, and a control that throws away progress does not belong
      // in a row whose only job is "pick up where you are".
      cta: introDone
        ? undefined
        : { label: resumeLabel, variant: 'primary', onClick: () => goToPlayer() },
    }

    const chapterRows: OutlineRow[] = overview.chapters.map((chapter, i) => {
      const { state, progressPercent } = rangeProgress(stepIndex, ranges.chapters[i])
      const previousLabel =
        i === 0 ? 'the module intro' : `Chapter ${overview.chapters[i - 1].number}`
      // Real slide count, so a 2-scenario chapter reports its actual length
      // rather than a fixed per-chapter number.
      const lengthLabel = `${chapter.slideCount} slides`

      return {
        key: chapter.id,
        title: chapter.title,
        metaParts:
          state === 'completed'
            ? [`Chapter ${chapter.number}`, 'Completed', lengthLabel]
            : state === 'current'
              ? [`Chapter ${chapter.number}`, `${progressPercent}% complete`, lengthLabel]
              : [`Chapter ${chapter.number}`, chapter.durationLabel, lengthLabel],
        state,
        progressPercent,
        cta:
          state === 'current'
            ? { label: resumeLabel, variant: 'primary', onClick: () => goToPlayer() }
            : undefined,
        lockHint: state === 'locked' ? `Complete ${previousLabel} to unlock` : undefined,
      }
    })

    // The outro slide, the feedback step and the completion screen are one
    // "Summary" range in the step machine — the same grouping the player's
    // outline rail uses, so both surfaces agree.
    const summaryState = rangeProgress(stepIndex, ranges.summary).state
    const lastChapterNumber = overview.chapters[overview.chapters.length - 1]?.number
    const summaryRow: OutlineRow = {
      key: 'summary',
      title: playerContent.outroSlide.navLabel,
      metaParts:
        summaryState === 'completed'
          ? ['Module summary and feedback', 'Completed', overview.outroDurationLabel]
          : ['Module summary and feedback', overview.outroDurationLabel],
      state: summaryState,
      cta:
        summaryState === 'current'
          ? { label: resumeLabel, variant: 'primary', onClick: () => goToPlayer() }
          : undefined,
      lockHint:
        summaryState === 'locked' ? `Complete Chapter ${lastChapterNumber} to unlock` : undefined,
    }

    rows = [introRow, ...chapterRows, summaryRow]
  }

  // Whichever row carries the control — there is at most one, on the coach's
  // current section. Reading it back off `rows` rather than rebuilding it is
  // what guarantees the hero and the outline cannot disagree.
  const heroCta = rows.find((row) => row.cta)?.cta

  return (
    <div className="min-h-screen bg-background">
      <AppHeader portal="training-v2" />

      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0" style={moduleArt(module.cover.colors, module.cover.image)} />
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
        <div className="relative px-6 py-14 md:px-12 lg:px-28 lg:py-14">
          {/* `ResearchPageHero`'s own row, copied rather than re-invented
              (direct instruction, 2026-09-18: *"on desktop screens, I want this
              button on right (as we did this for researcher dashoard hero
              part)"*): `justify-between` with `items-end`, its default
              alignment, so the CTA's baseline lands on the hero's last line
              rather than floating against the title.

              **No `flex-wrap`**, which that component does carry. Measured: the
              copy column here runs the hero's full width rather than being a
              short title, so it claimed the whole line and the button wrapped
              onto a second row at the LEFT edge — indistinguishable from "the
              change did not apply" in a screenshot, while
              `justify-content: space-between` had been resolving correctly the
              whole time. Without wrap the column shrinks against its own
              `min-w-0` and the button keeps the right edge.

              The row only applies from `lg`. Below it the hero column is
              already narrow enough that a right-aligned button would sit under
              the copy with a ragged gap beside it, so it stays stacked. */}
          <div className="flex flex-col gap-[22px] lg:flex-row lg:items-end lg:justify-between lg:gap-24">
          <div className="flex min-w-0 flex-col gap-[22px]">
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
              {/* The module's own **Core message**, from `module.md`'s MODULE
                  SETUP table — for the one module with authored content this is
                  what `description` holds, so the slot renders source copy
                  rather than the sentence a first pass invented for it
                  (2026-09-18: *"where is this coming from? it does not exists
                  in module copy i shared"*, then *"keep sub copy provision but
                  hide it"*, then *"move this to below title, unhide the copy i
                  asked you to before"* — the provision was kept for exactly
                  this).

                  It used to sit in a "What this module is about" card in the
                  right-hand column; that card is gone, because the same
                  sentence in two places on one screen is duplication, not
                  emphasis. */}
              {/* `text-balance`: widening the row gap to 96px narrowed this column
                  to 555px and pushed the sentence to three lines with a single
                  short word alone on the last — the orphan this project's own
                  copy rule forbids. Balancing evens the lines instead of
                  breaking one early. */}
              <p className="text-body leading-[1.4] text-white text-balance">
                {module.description}
              </p>
            </div>
          </div>

          {/* The same `<Progress>` this page already renders on its current
              outline row, at the same 1.5px track height and `max-w-[240px]`.
              Two differences, both forced by the surface rather than chosen:
              the track is `bg-white/30` because `divider-soft` is invisible on
              a dark band, and the number is white for the same reason as every
              other line in this hero. */}
          {modulePercent !== undefined && (
            <div className="flex w-full max-w-[240px] flex-col gap-1.5">
              {/* A bare bar and a number say nothing about what is being
                  measured — this sits under an "Estimated Time" line, so 3%
                  could as easily be read as time elapsed (flagged directly,
                  2026-09-18: *"what is this progress about ? add some context
                  before this"*). "Module progress" is this app's own name for
                  the whole-module figure, already used by `ModuleTimeline` and
                  the player's outline rail, so it is not a new label. */}
              {/* Same step as the "Estimated Time" line below it (direct
                  instruction, 2026-09-18) — the two are a pair of hero meta
                  lines, so they read as one level rather than a label and a
                  caption. */}
              <span className="text-caption-medium text-white">Module progress</span>
              <div className="flex items-center gap-3">
                <Progress
                  value={modulePercent}
                  aria-label={`${module.title} progress`}
                  /* The indicator defaults to `bg-primary`, which on this dark
                     band is all but invisible — reported as such. White, via
                     the same `[&_[data-slot=progress-indicator]]` override
                     `ModuleTimeline` already uses to turn its own bar green on
                     certification. */
                  className="min-w-0 flex-1 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-white/30 [&_[data-slot=progress-indicator]]:bg-white"
                />
                <span className="shrink-0 text-fine tabular-nums text-white">
                  {modulePercent}%
                </span>
              </div>
            </div>
          )}

          {/* Below the bar, not above it (direct instruction): the progress
              figure is the live fact a returning coach is looking for, and the
              module's total length is reference beneath it. */}
          <p className="text-caption-medium text-white">
            Estimated Time: Approx. {module.estimatedMinutes} min
          </p>
          </div>

          {/* The same control the outline offers, in the hero (direct
              instruction, 2026-09-18: *"add a CTA here also user can use to
              start or resume learning"*). Deliberately the SAME `heroCta`
              value the outline row renders, not a second computation — two
              controls on one screen claiming different things about where a
              coach is up to is this project's most-repeated class of bug, and
              here it would be one `stepIndex` read against another.

              White-filled rather than the app's `bg-primary` pill: the hero is
              a dark band, and `primary` on it measured too close to the
              backdrop to read as a raised control. */}
          {heroCta && (
            <button
              type="button"
              onClick={heroCta.onClick}
              /* This app's own **inverted hero CTA**, copied verbatim from
                 `SpacesCoachProfilePage.tsx:1651` — the treatment the three
                 researcher record pages already use for a primary action on a
                 dark/purple hero band (Round 23). Not a fourth button style
                 (direct instruction, 2026-09-18: *"make sure the new button
                 complies with buttons we have"*): a first pass here was
                 `h-12/h-14`, `px-8/px-10` and `text-body-md`, none of which is
                 one of this app's three canonical pills.
                 `bg-primary` is what a primary action would normally be, and it
                 is wrong here for the same reason those heroes invert: purple
                 on a dark band reads as a hole rather than a raised control.
                 `min-w-[232px]` is the precedent's own width and is what
                 carries *"increase width to show importance"* — it is already
                 far wider than a default pill, so no new number was invented.
                 `w-fit` below `lg` so it hugs its label when it stacks. */
              className="inline-flex h-11 w-fit shrink-0 items-center justify-center rounded-full bg-white px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-parchment focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.97] lg:min-w-[232px]"
            >
              {heroCta.label}
            </button>
          )}
          </div>
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
            {/* Frame `631:9647`. Direct instruction (2026-09-15): this card's
                old three "By the end of this module" bullets were **invented**
                in Round 7.1, not sourced from anything. They are replaced by
                the module.md "MODULE SETUP" table's own Core message, with its
                Core skills list as a second card below, so every word on this
                page is traceable to the source file. */}
            <div className="flex flex-col gap-8 lg:w-[376px] lg:shrink-0">
              {/* The skills card is now the column's only card, sitting where
                  the yellow "What this module is about" card used to. Its own
                  "Core skills" heading is gone too (direct instruction): the
                  first line inside it already says what the card is. */}
              <div className="flex flex-col gap-4 rounded-lg border border-parchment bg-card p-6 shadow-card">
                {/* The six SIPTEA components get the disc-and-name treatment
                    the chapter-intro block already uses (`BlockRenderer`), and
                    the practice skills stay as pills (direct instruction,
                    2026-09-18: *"re-use the siptea icon + title style here,
                    stack them horizontalyy (reduce the circle + letter
                    initials) ... then show the sub skills in pill style, as
                    is"*).

                    The split comes from `splitChapterSkills()`, the same helper
                    that shared source drives — it reads the authored string
                    (`"S - Shared Understanding"` vs a bare `"Open Questions"`),
                    so this card cannot disagree with the chapter intro about
                    what counts as a component. It is also why the "S - "
                    prefixes disappear from the copy without anything being
                    rewritten: `classifySkill` already returns the name
                    separately from the initial, and the disc now carries the
                    letter the prefix used to. */}
                {(() => {
                  const { components, practice } = splitChapterSkills(overview.coreSkills)
                  /**
                   * Build-side chrome, exactly like `BlockRenderer`'s own
                   * `PRACTICE_SKILLS_INTRO` (direct instruction, 2026-09-18).
                   * It deliberately does NOT live in `moduleContent.ts`:
                   * module.md has no row for it, so `verify-transcription.py`
                   * would correctly fail it for not appearing in the source.
                   *
                   * **"all six" is derived, not written.** SIPTEA has exactly
                   * six components, but a module need not name all of them —
                   * chapter 1 of this very module names three — and a sentence
                   * claiming six over three discs is the class of error this
                   * project has shipped three times with its stage count.
                   */
                  const allSix = components.length === SIPTEA_INITIALS.length
                  const sipteaIntro = allSix
                    ? "In this module, we'll look at all six parts of the SIPTEA framework:"
                    : "In this module, we'll look at these parts of the SIPTEA framework:"
                  return (
                    <>
                      {components.length > 0 && (
                        <p className="text-body-md leading-[1.4] text-ink-muted">
                          {sipteaIntro}
                        </p>
                      )}
                      {components.length > 0 && (
                        /* Horizontal: disc beside the name, one component per
                           row. The chapter-intro version stacks them vertically
                           in a 224px-wide column because it owns a full slide;
                           this card is 376px, where six of those would be a
                           very tall grid. */
                        <ul className="flex flex-col gap-3">
                          {components.map((c) => (
                            <li key={c.raw} className="flex items-center gap-3">
                              {/* 28px against the slide's 88px, and the type
                                  drops with it. Decorative for the same reason
                                  it is there: the initial is the first letter
                                  of the name beside it, so announcing both
                                  reads "S Shared Understanding". */}
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'flex size-7 shrink-0 items-center justify-center rounded-full text-fine leading-none text-white',
                                  SIPTEA_BG[c.initial],
                                )}
                              >
                                {c.initial}
                              </span>
                              <span className="min-w-0 text-caption text-ink">{c.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {practice.length > 0 && (
                        /* `mt-4` on top of the card's own `gap-4`, so the break
                           between the two halves of this card is 32px against
                           the 16px rhythm inside each half (direct instruction,
                           2026-09-18: *"increase vertical spacing"*, annotated
                           on exactly this gap). A wrapper rather than a bigger
                           card gap: the card gap also separates the heading and
                           the two lists, and widening all of it would space out
                           rows that are meant to read as one group. */
                        <div className="mt-4 flex min-w-0 flex-col gap-4">
                          {/* Same step as the SIPTEA lead above it — the two
                              are a matched pair of section leads in one card,
                              so they take one type step. */}
                          <p className="text-body-md leading-[1.4] text-ink-muted">
                            {PRACTICE_SKILLS_INTRO}
                          </p>
                          {/* Plain dot bullets (direct instruction,
                              2026-09-18: *"dont use pillows here for pointsers,
                              use simple bullets"*). The chapter-intro block's
                              own rows use `bullet-square.svg`, the pillow mark,
                              which earns its place on a full slide and reads as
                              a row of icons in a 376px card.

                              The dot is this app's existing one — `size-1.5
                              shrink-0 rounded-full` with a small top margin, as
                              `ResourceCard` and `ModuleSummaryCards` draw it —
                              on `bg-primary` rather than their
                              `bg-consumer-primary`, since that token must never
                              leak out of the Consumer Portal. The margin sits
                              it on the first line rather than centring it
                              against a label that may wrap to three lines.

                              One column, not that block's two: this card is
                              376px and its longest skill already wraps. The
                              `min-w-0` pair is why it wraps at all — a flex item
                              defaults to `min-width: auto`, so the longest
                              label would size the row instead of wrapping in
                              it. */}
                          <ul className="flex min-w-0 flex-col gap-3">
                            {practice.map((skill) => (
                              <li key={skill.raw} className="flex min-w-0 items-start gap-3">
                                <span
                                  aria-hidden="true"
                                  className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary"
                                />
                                <span className="min-w-0 text-caption text-ink">{skill.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[1200px] px-6 py-16 text-center md:px-8">
          <p className="text-body text-ink-faint">Module breakdown coming soon.</p>
        </div>
      )}
    </div>
  )
}
