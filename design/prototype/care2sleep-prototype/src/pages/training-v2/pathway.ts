import { type ModuleStatus } from '@/data/portal'
import { PATHWAY_MODULES_V2, type TrainingModuleV2 } from '@/data/trainingPathwayV2'
import { MODULE_CONTENT } from '@/data/moduleContent'
import { buildPlayerSteps } from './playerSteps'
import { getModuleStepIndex, wasStartedThisSession } from './moduleProgressStore'

/**
 * Direct UI update (home page redesign, Figma node 1:840) — the real
 * 11-module curriculum, sourced from a new Option-B-only dataset
 * (`data/trainingPathwayV2.ts`) rather than `data/portal.ts`'s shared
 * `modules` array. `/training` (Option A) still reads the untouched
 * 8-item shared array directly; expanding that shared array to 11 items
 * would have changed Option A's module count too, a real behavior change
 * to a portal version this project has a hard rule never to touch.
 *
 * This redesign also retires the per-module thematic icon system
 * (`MODULE_ICON`) for this timeline in favour of plain numbered markers —
 * see `ModuleTimeline.tsx`'s `Marker` component.
 */
export const PATHWAY_MODULES: TrainingModuleV2[] = PATHWAY_MODULES_V2

/** This version is forced-linear: a coach can only be "on" one module at a
 *  time, so exactly one module reads as `current` — the first incomplete
 *  one — even though the underlying data has more than one module marked
 *  `in-progress` (real content today doesn't enforce linear order; this
 *  pathway does). Everything after it is `upcoming` regardless of its own
 *  raw status, until the modules before it are done. */
export const firstIncompleteIndex = PATHWAY_MODULES.findIndex((m) => m.status !== 'completed')
export const isCertified = firstIncompleteIndex === -1
export const completedModulesCount = isCertified ? PATHWAY_MODULES.length : firstIncompleteIndex

export type PathwayState = 'completed' | 'current' | 'upcoming'

export function moduleState(index: number): PathwayState {
  if (firstIncompleteIndex === -1 || index < firstIncompleteIndex) return 'completed'
  if (index === firstIncompleteIndex) return 'current'
  return 'upcoming'
}

/** Display-only override hook, kept for parity with Round 6.3's mechanism
 *  (none of the 11 real modules currently need one — the new dataset's own
 *  `status` values already encode the demo spread directly). This does NOT
 *  touch the shared `modules` record — `/training` (Option A) keeps reading
 *  the real in-progress data unaltered, per the round's own "don't touch
 *  the current version" rule. */
const DISPLAY_OVERRIDES: Record<string, { status: ModuleStatus; progress: number }> = {}

/**
 * The one module fully wired to the real content player (Round 7),
 * re-keyed from the Round 1-era `'sleep-basics'` id to `'understanding-sleep'`
 * once Option B's home page moved to the real 11-module curriculum
 * (`data/trainingPathwayV2.ts`) — see that file's own module 5 entry and
 * `data/moduleContent.ts`'s `MODULE_CONTENT` key, both re-keyed together.
 */
/** The one module with authored player content. Round 47: moved from
 *  `understanding-sleep` (the Round 7 Module 4 content, retired when the
 *  player was rebuilt around the real `module.md` block vocabulary) to
 *  `building-blocks-good-sleep`, built from
 *  `Coaching modules master/Modules/Module 6.md`. */
export const MODULE_PLAYER_ID = 'building-blocks-good-sleep'

/**
 * A temporary, demo-only wiring so one card on My Learning opens the real
 * in-module player and overview content built for `building-blocks-good-sleep`
 * — the only module with authored content — without waiting on the other ten.
 * Not a real curriculum re-mapping.
 *
 * **It points at module 1 (`portal-orientation`), the very first card**
 * (direct instruction, 2026-09-18: *"Module 6 that I have shared will be used
 * for testing purpose, so for now, default it to module 1 in prototype, use the
 * very first card, update name but use module 1"*). It sat on module 2
 * (`population-understanding`) from Round 7.1 until then. Module 1 is the
 * better host for a review build for a structural reason, not just because it
 * is first: under the forced-linear pathway module 1 is reachable from a
 * completely fresh state, so a reviewer opening My Learning can click straight
 * into the content instead of having to satisfy a gate first.
 *
 * The card's own **title and description were updated to the real Module 6
 * content** so the card and the thing it opens agree — the mismatch this map
 * used to carry (module 2's name over Module 6's content) was accepted at the
 * time and is no longer necessary now that the instruction is to rename.
 * Its **id stays `portal-orientation`**: the id is code, keyed on by
 * `PATHWAY_MODULES_V2` order, `moduleState()` and the demo seed, exactly as
 * `ConsumerDyad`/`dyadId` are code under this project's own naming rule.
 *
 * Remove this map (and let `realPlayerContentId` become an identity function)
 * once module 1 has its own authored content, or once this demo need passes.
 */
const DEMO_PLAYER_REDIRECTS: Record<string, string> = {
  'portal-orientation': MODULE_PLAYER_ID,
}

/** Resolves a home-timeline module id to the id its real content/progress
 *  actually lives under — itself, unless redirected above. */
export function realPlayerContentId(moduleId: string): string {
  return DEMO_PLAYER_REDIRECTS[moduleId] ?? moduleId
}

/**
 * Reads live play progress from `moduleProgressStore` + the generic step
 * machine (`buildPlayerSteps`), resolved through `realPlayerContentId` so
 * the redirected demo module (`portal-orientation`) reflects the
 * same live progress as `building-blocks-good-sleep` itself. Returns `undefined`
 * for any module id that doesn't resolve to a real content-bearing module
 * — callers fall back to `DISPLAY_OVERRIDES`/real data in that case.
 */
export function livePlayerStatus(moduleId: string): { status: ModuleStatus; progress: number } | undefined {
  const realId = realPlayerContentId(moduleId)
  const content = MODULE_CONTENT[realId]
  if (!content) return undefined

  const totalSteps = buildPlayerSteps(content).length
  const stepIndex = getModuleStepIndex(realId)
  const lastIndex = totalSteps - 1

  if (stepIndex <= 0) return { status: 'not-started', progress: 0 }
  if (stepIndex >= lastIndex) return { status: 'completed', progress: 100 }
  return { status: 'in-progress', progress: Math.round((stepIndex / lastIndex) * 100) }
}

/**
 * The module a coach is part-way through, or `undefined` if they have not
 * started one — what the coach Home banner switches its whole state on
 * (frame `588:5767`, "Resume where you left").
 *
 * **Only ever the current module**, never a scan across all eleven, and that
 * is the load-bearing part rather than an optimisation. Live progress is keyed
 * by *content* id, and `DEMO_PLAYER_REDIRECTS` points module 1 at the Module 6
 * content, so both read the same store entry — a scan would report locked
 * module 5 as in-progress the moment a coach touched module 2. That is exactly
 * the collision Round 19.1 had to fix on the timeline cards. Reading only
 * `firstIncompleteIndex` sidesteps it structurally: a locked module can never
 * be the answer, because it is never the current one.
 *
 * Going through `livePlayerStatus` rather than a second progress read is the
 * other half — the banner and the module card now derive from one fact, so
 * they cannot disagree about whether a module is under way.
 *
 * Gated on `wasStartedThisSession` so a **refresh returns the banner to its
 * default state** (direct instruction). Stored progress is `localStorage` and
 * outlives the tab, so on its own it would pin the banner to "resume" forever
 * once a module had ever been opened.
 */
export function resumableModule(): TrainingModuleV2 | undefined {
  if (firstIncompleteIndex === -1) return undefined
  const module = PATHWAY_MODULES[firstIncompleteIndex]
  if (!module) return undefined
  if (!wasStartedThisSession(realPlayerContentId(module.id))) return undefined
  return livePlayerStatus(module.id)?.status === 'in-progress' ? module : undefined
}

export function displayStatus(moduleId: string, realStatus: ModuleStatus): ModuleStatus {
  const live = livePlayerStatus(moduleId)
  if (live) return live.status
  return DISPLAY_OVERRIDES[moduleId]?.status ?? realStatus
}

export function displayProgress(moduleId: string, realProgress: number): number {
  const live = livePlayerStatus(moduleId)
  if (live) return live.progress
  return DISPLAY_OVERRIDES[moduleId]?.progress ?? realProgress
}

/**
 * The timeline's own marker/dot state for a module row — always the real,
 * dynamically-computed forced-linear state (`moduleState(index)`), with no
 * per-module exception. Per direct instruction, `MODULE_PLAYER_ID`
 * ("Understanding Sleep," module 5) is not special-cased to always read as
 * reachable: in the current demo status spread (module 1 completed, module
 * 2 current, modules 3–11 locked) it genuinely sits behind the
 * forced-linear lock and shows "Locked" like any other upcoming module,
 * until a coach actually progresses through modules 2–4. Once it does
 * become the current module, `livePlayerStatus()` below still layers real
 * play progress on top of it exactly as before.
 */
export function timelineRowState(index: number, _module: TrainingModuleV2): PathwayState {
  return moduleState(index)
}

export function timelineCtaLabel(status: ModuleStatus, moduleNumber: number): string {
  switch (status) {
    case 'not-started':
      return `Start Module ${moduleNumber}`
    case 'in-progress':
      return 'Resume Module'
    case 'completed':
      return 'Restart Module'
  }
}
