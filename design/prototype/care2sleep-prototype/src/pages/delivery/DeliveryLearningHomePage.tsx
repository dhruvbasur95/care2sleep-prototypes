import { Link } from 'react-router-dom'
import { CircleCheck, Lock } from 'lucide-react'
import { DeliveryShell } from '@/components/delivery/DeliveryShell'
import { moduleArt } from '@/components/ModuleCard'
import { MODULE_GROUPS, type TrainingModuleV2 } from '@/data/trainingPathwayV2'
import {
  PATHWAY_MODULES,
  completedModulesCount,
  livePlayerStatus,
  moduleState,
} from '@/pages/training-v2/pathway'
import { cn } from '@/lib/utils'

/**
 * Coach Delivery Portal "My Learning" (Figma `588:5833`).
 *
 * **The four tabs are gone** (direct instruction) — My reflections, Feedback and
 * Certification were "not ready yet" empty states, and the page is now a single
 * uninterrupted curriculum view, so the tab row had one destination and nothing
 * to switch to.
 *
 * The curriculum is split into two gated parts:
 *   - **Part A** — the 4 Foundational modules, open from the start.
 *   - **Part B** — the 7 Sleep modules, locked until Part A is finished.
 *
 * **Module names come from the real curriculum, not the frame** (direct
 * instruction). The frame's cards repeat two placeholder titles ("Onboarding
 * and getting set up" appears three times, on cards 2, 3 and the whole of Part
 * B); the live data is `MODULE_GROUPS` over `PATHWAY_MODULES`. Every count in
 * the frame — 1/4, 0/7, 1/11 — happens to match that data exactly, which is a
 * good sign the frame was drawn against it.
 *
 * Lock state is derived, never authored per card: `moduleState(index)` runs off
 * the flat `PATHWAY_MODULES` index, so a module is `completed`, `current` (the
 * single first-incomplete one) or `upcoming`. Part B's gate is the same fact
 * read at tier level rather than a second, independent flag that could disagree.
 */

/** Frame `588:7092`: the row is 913px wide and holds 4x305 + 3x20 = 1280px of
 *  cards, so it scrolls. Part B holds 7, so it scrolls further. */
const CARD_W = 305

function tierCounts(moduleIds: string[]) {
  const done = moduleIds.filter(
    (id) => PATHWAY_MODULES.find((m) => m.id === id)?.status === 'completed',
  ).length
  return { done, total: moduleIds.length }
}

/** Frame `588:5878`'s right-hand card. Yellow, unlike everything else on this
 *  page — it is the one element that is about the coach rather than about the
 *  curriculum. */
function ProgressCard() {
  const total = PATHWAY_MODULES.length
  const pct = Math.round((completedModulesCount / total) * 100)

  return (
    <div
      // Full width while stacked, intrinsic (332px) once the hero is a row
      // again. See `HERO_ROW_BP` for where that switch happens and why.
      className="flex h-[130px] w-full shrink-0 flex-col justify-center gap-4 rounded-lg border border-yellow-100 bg-yellow-50 p-6 shadow-card min-[1120px]:w-auto"
      data-node-id="588:6275"
    >
      <h2 className="font-display text-title text-ink">Your progress:</h2>
      <div className="flex w-full flex-col min-[1120px]:w-[282px]">
        <p className="text-body leading-[1.4] text-ink">
          {completedModulesCount} / {total} modules complete
        </p>
        <div className="flex items-center gap-4">
          {/* Stretches to fill the widened card while stacked; pinned back to
              the frame's own 223px at the row breakpoint. */}
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-hairline min-[1120px]:w-[223px] min-[1120px]:flex-none">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="shrink-0 font-display text-title text-primary">{pct}%</p>
        </div>
      </div>
    </div>
  )
}

/** The `Part A` / `Part B` pill pair above each tier canvas (`588:6209`). */
function PartMarkers({ part, unlocked }: { part: 'A' | 'B'; unlocked: boolean }) {
  const pill = 'flex h-7 shrink-0 items-center justify-center rounded-full px-5 text-body-md'

  return (
    <div className="flex items-start gap-2">
      <span className={cn(pill, 'bg-primary text-white')}>Part {part}</span>
      {unlocked ? (
        <span className={cn(pill, 'bg-purple-200 text-primary')}>You start here</span>
      ) : (
        <span className={cn(pill, 'gap-2 bg-parchment text-ink-muted')}>
          <Lock aria-hidden="true" className="size-3" />
          Locked. Complete Part A first
        </span>
      )}
    </div>
  )
}

type CardState = 'completed' | 'current' | 'upcoming'

function ModuleCard({
  module,
  number,
  state,
}: {
  module: TrainingModuleV2
  number: number
  state: CardState
}) {
  const locked = state === 'upcoming'

  /**
   * Live progress, where the module has real player content, so this card and
   * the module overview page it opens cannot disagree about where the coach is.
   *
   * They did: the card read the seed `status`/`progress` while the overview
   * read `getModuleStepIndex`, so six steps into the module the card still said
   * "Start module" beside an overview saying "Resume learning" — one action,
   * two contradictory claims, which is this project's most-repeated defect
   * class and the reason `livePlayerStatus` exists at all.
   *
   * **Guarded on `locked` first, and that order is load-bearing** — the Round
   * 19.1 collision: `livePlayerStatus` resolves through `DEMO_PLAYER_REDIRECTS`,
   * and calling it for `building-blocks-good-sleep` itself finds no key and
   * falls through to the same id module 1's redirect resolves to. Both ids then
   * read one progress-store key, so a locked Sleep-tier card would inherit
   * module 1's real progress and render a filled bar while genuinely locked.
   */
  const live = locked ? undefined : livePlayerStatus(module.id)
  const status = live?.status ?? module.status
  const progress = live?.progress ?? module.progress

  const inProgress = state === 'current' && status === 'in-progress'
  const complete = state === 'completed' || status === 'completed'

  // The frame writes "Approx. 15 min left" on a *completed* card, which cannot
  // be true. Derived here instead: a module still in progress reports what is
  // left, everything else reports its full length.
  const meta = inProgress
    ? `Approx. ${Math.max(1, Math.round((module.estimatedMinutes * (100 - progress)) / 100))} min left`
    : `Approx. ${module.estimatedMinutes} min`

  // The same two labels the module overview page uses, and the same casing
  // (direct instruction, 2026-09-18: *"always say start or resume module"*,
  // then *"dont say resume module, say resume learning"*). This card had a
  // third, `Restart Module`, and Title Case on all three — so the one action
  // read three ways here and two more ways on the page it opens.
  //
  // `Restart` is gone for the reason it went from the outline: it throws away
  // progress, which is the opposite of the resume this control now promises. A
  // finished module keeps the same label; re-entering it lands on its last
  // step, which is where a coach returning to revise would want to be anyway.
  const ctaLabel = inProgress || complete ? 'Resume learning' : 'Start module'

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-4 self-stretch overflow-hidden rounded-lg border border-parchment bg-card pb-6',
        // The frame gives these cards a **purple-tinted** shadow rather than
        // the app's warm gold `shadow-card` — they sit on a `purple-50` canvas,
        // where gold reads as a stain.
        'shadow-[2px_4px_16px_0px_rgba(102,42,213,0.1)]',
      )}
      style={{ width: CARD_W }}
      data-node-id="588:7093"
    >
      <div className="relative h-44 w-full shrink-0">
        {/* The frame uses one stock photo on all eleven cards. Ten of them are
            this app's own per-module gradient art (`moduleArt`, real data on
            every module) rather than a placeholder photo committed eleven
            times; the one module with authored content carries a real
            generated cover, painted over its gradient.

            The frame's dark bottom wash — `linear-gradient` to
            `rgba(24,1,71,0.7)` — is **removed** (direct instruction,
            2026-09-18: *"remove this vignette effect"*). It was there to keep a
            white numeral legible, and that reason had already lapsed: the
            numeral sits in its own `bg-card` tab below, so nothing on the cover
            needs the darkening. On a real illustration it read as a vignette
            over the artwork rather than as part of it. */}
        <div aria-hidden="true" className="absolute inset-0" style={moduleArt(module.cover.colors, module.cover.image)} />
        {/* Sits astride the cover's bottom edge, its own top corners rounded so
            it reads as a tab cut into the image. */}
        <div className="absolute -bottom-1 left-4 flex size-12 flex-col items-center justify-center rounded-t-3xl bg-card pt-2">
          <span className="font-display text-display-md text-purple-500">{number}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-8 px-4">
        <div className="flex h-[72px] flex-col gap-1.5">
          <p className="text-sub-greeting leading-[1.4] text-ink">{module.title}</p>
          <p className="text-caption text-ink-faint">{meta}</p>
        </div>

        <div className="flex flex-col gap-6">
          {complete && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <CircleCheck aria-hidden="true" className="size-[18px] text-success" />
                <p className="text-body-md text-success">Module complete</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                <div className="h-full w-full rounded-full bg-success" />
              </div>
            </div>
          )}

          {inProgress && (
            <div className="flex flex-col gap-2">
              <p className="text-body leading-[1.4] text-ink">{progress}% complete</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {locked ? (
            <div className="flex h-9 w-full items-center justify-center gap-1 rounded-full bg-parchment text-caption-medium text-ink-muted">
              <Lock aria-hidden="true" className="size-3" />
              Locked
            </div>
          ) : (
            <Link
              to={`/training-v2/module/${module.id}/overview`}
              // The module title rides in `aria-label` rather than an `sr-only`
              // span. That is not a style preference: Tailwind's `sr-only` is
              // `position: absolute` + `white-space: nowrap`, and inside this
              // horizontally-scrolling row it escapes the clip and widens the
              // *document* — measured at 2399px against a 1281px viewport, a
              // real horizontal page scroll. `aria-label` adds no box at all.
              aria-label={`${ctaLabel} — ${module.title}`}
              className="flex h-9 w-full items-center justify-center rounded-full bg-primary text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function TierSection({
  part,
  groupKey,
  unlocked,
}: {
  part: 'A' | 'B'
  groupKey: string
  unlocked: boolean
}) {
  const group = MODULE_GROUPS.find((g) => g.key === groupKey)
  if (!group) return null
  const { done, total } = tierCounts(group.moduleIds)

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PartMarkers part={part} unlocked={unlocked} />

      <div className="flex min-w-0 flex-col gap-10 rounded-lg bg-purple-50 px-6 pt-6 pb-8">
        <div className="flex items-end justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-display text-title text-ink">{group.title}</h2>
            <p className="text-body leading-[1.4] text-ink-muted">{group.subtitle}</p>
          </div>
          <p className="shrink-0 text-body-md text-ink-muted">
            {done} / {total} complete
          </p>
        </div>

        {/* Wider than its canvas by design, so it is a real scroll region —
            labelled and `tabIndex={0}` so a keyboard user can reach it at all
            (the WCAG 2.1.1 failure Round 20 found on the sleep-diary grid). */}
        <div
          // `min-w-0` is load-bearing, not defensive. Without it this flex item
          // sizes to its 2255px of cards instead of to its column, and the
          // *whole page* gains a horizontal scrollbar — measured at 2399px
          // against a 1281px viewport. Same failure Round 21.1 hit on the
          // trainee pathway timeline.
          className="min-w-0 overflow-x-auto"
          role="region"
          aria-label={`${group.title} carousel`}
          tabIndex={0}
        >
          <div className="flex w-max items-stretch gap-5 pb-1">
            {group.moduleIds.map((id, i) => {
              const module = PATHWAY_MODULES.find((m) => m.id === id)
              if (!module) return null
              const flatIndex = PATHWAY_MODULES.findIndex((m) => m.id === id)
              // Part B is gated as a whole: even its first module is not
              // reachable while Part A is unfinished, so the tier gate wins
              // over the per-module state.
              const state: CardState = unlocked ? moduleState(flatIndex) : 'upcoming'
              return <ModuleCard key={id} module={module} number={i + 1} state={state} />
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export function DeliveryLearningHomePage() {
  const foundational = MODULE_GROUPS[0]
  const partAComplete = foundational
    ? tierCounts(foundational.moduleIds).done === foundational.moduleIds.length
    : false

  return (
    <DeliveryShell
      accountLabel="Helen Zhang"
      // Same flush content column and 64px top inset as trainee Home — this
      // frame has no hero band either.
      contentClassName="px-0 pt-16 md:px-0 md:pt-16"
    >
      <div className="flex min-w-0 flex-col gap-20">
        {/*
          The hero row stacks below `HERO_ROW_BP` (1120px), title + sub copy
          first, progress card full-width beneath them.

          **1120px is measured, not a Tailwind default.** The row's own width is
          `viewport - 184` (24px shell gutter + 200px sidebar + 48px column gap
          on the left, 48px pad + 24px scrollbar allowance on the right — the
          Round 30 grid), the progress card is intrinsically 332px and the gap
          is 120px, so:

              left column = viewport - 184 - 452 = viewport - 636

          The h1 "Welcome to my learnings" measures **482.4px** unwrapped at
          `display-lg`. It therefore survives on one line only while
          `viewport >= 1118.4`; 1120px is the next whole px with a little
          margin. Below that the title breaks across two lines *and* the sub
          copy runs to 4-5 lines against a 130px card, which is the point the
          two-column arrangement stops being one, so it stacks instead.

          `lg` (1024px) was not used: it is 96px too late and the title is
          already wrapped there.

          The 32px stacked gap is this app's own spacing, not the frame's — the
          frame has no stacked state to transcribe.
        */}
        <div
          className="flex flex-col gap-8 min-[1120px]:flex-row min-[1120px]:items-start min-[1120px]:gap-[120px]"
          data-node-id="588:5878"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="font-display text-display-lg text-primary">Welcome to my learnings</h1>
            <p className="text-sub-greeting leading-[1.4] text-ink">
              Your course curriculum consists of two parts: <strong className="font-bold">Part A</strong>{' '}
              has the foundational modules, while <strong className="font-bold">Part B</strong> has all
              sleep-related modules. Complete all modules of Part A to unlock Part B.
            </p>
          </div>
          <ProgressCard />
        </div>

        <div className="flex min-w-0 flex-col gap-16" data-node-id="588:6274">
          <TierSection part="A" groupKey="foundational" unlocked />
          <TierSection part="B" groupKey="sleep" unlocked={partAComplete} />
        </div>
      </div>
    </DeliveryShell>
  )
}
