import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Lock, PlayCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { moduleArt } from '@/components/ModuleCard'
import { MODULE_GROUPS, type TrainingModuleV2 } from '@/data/trainingPathwayV2'
import { cn } from '@/lib/utils'
import { Chip } from '@/components/research/StatusChip'
import {
  PATHWAY_MODULES,
  isCertified,
  firstIncompleteIndex,
  completedModulesCount,
  timelineRowState,
  displayStatus,
  displayProgress,
  timelineCtaLabel,
} from './pathway'

/**
 * `Badge`/`ModuleBadge` — REMOVED (were: a shared pill-badge chassis and its
 * one "MODULE N" caller). Deleted as part of the "too much dead space above
 * the title" fix on `TimelineModuleCard` (see that component's `Card`-root
 * `className` comment and the removal note at the old call site, right
 * before the title, for the full reasoning): `ModuleBadge` had been reduced
 * to a single, permanently-`invisible` reservation once the numeral overlay
 * + repositioned status chip took over every signal it used to carry, and
 * removing that reservation to close a real 4-times-flagged spacing
 * complaint left this component with zero remaining call sites anywhere in
 * the file. Kept as dead code once before (with a comment explaining why);
 * this time there is no live or planned caller left to justify keeping it
 * — deleted outright rather than left unused, consistent with this file's
 * own established practice elsewhere (e.g. `CERTIFICATE_ICON`'s removal).
 */

/**
 * Numeral overlay, promoted from a single-card trial (Foundational's first
 * module only, id `portal-orientation`) to the permanent template for every
 * `TimelineModuleCard` (direct instruction: "treat this as a template and
 * execute same exact style to all modules... this becomes the updated
 * module card component"). Four pieces, all now unconditional rather than
 * gated on one module id — see each read site's own comment for specifics:
 * the overlay numeral itself (now the module's real tier-local position, not
 * a hardcoded `1`), the `ModuleBadge` suppression, the status chip's
 * bottom-right reposition, and the title's vertical centering within its
 * fixed-height box.
 *
 * **Legibility across every real cover, not just module 1's — color-
 * switching approach tried and reverted, per direct instruction.** Module
 * 1's dark navy wash (`#1c2b4a`) happened to give plain white text a clean
 * 14.06:1, but roughly half this tier's real covers are pale
 * (`#e8dcc8`/`#f3e4e2`/`#eef0e6`/etc.), where plain white computed to only
 * ~1.1-1.4:1. The first fix picked whichever of white/`ink` cleared better
 * contrast per module (a `readableOverlayTextColor()` helper, since removed
 * entirely, not left dormant) — direct feedback rejected that outright
 * ("why is it black and white the numbers / I want all white"), so the
 * numeral is plain `text-white` unconditionally below, and legibility on
 * the pale covers now comes entirely from the `text-shadow` on that same
 * element — see its own comment for the real, honestly-verified result
 * (not assumed from the CSS value alone, since shadow-based contrast has no
 * clean WCAG formula the way flat-color contrast does).
 */

/**
 * Numbers the 3 top-level curriculum blocks (Foundational = 1, Sleep = 2,
 * Practice = 3 — Certificate deliberately excluded, per direct instruction:
 * it's the outcome of finishing all three, not a fourth sequential block)
 * across two structurally different call sites — `ModuleGroupCanvas`'s tier
 * header (a plain text row) and the standalone `PracticeModuleCard`'s own
 * title (no tier-canvas wrapper at all). A deliberately new, small circular
 * marker rather than reusing `ModuleBadge`'s existing pill: that pill
 * already means something specific and different on this exact page
 * ("MODULE N," a numbered *module* inside a tier) — reusing the same pill
 * shape one level up, for tier/block position instead, would read as a
 * second, conflicting "MODULE N" system sitting right next to the real one
 * (most visibly on `PracticeModuleCard`, whose own "MODULE 1" pill was
 * removed earlier this same session for reading as redundant/confusing on
 * a single-module tier). This app has no other live numbered-marker
 * component left to reuse instead — the old rail/connector marker system
 * this file used to have was already removed in an earlier round (see the
 * "no marker-level complete/current/upcoming colour state" note further
 * down this file). `aria-hidden` — purely decorative reinforcement of an
 * order a sighted reader already gets from top-to-bottom position; adds no
 * information a screen reader needs. `bg-ink`/`text-white` for guaranteed
 * contrast regardless of which tier tint or plain white card it sits on.
 */
// Letters, not numerals — direct follow-up instruction ("A"/"B"/"C" instead
// of "1"/"2"/"3"). Kept the prop itself numeric (`number: number`) rather
// than retyping every call site to pass a literal `'A'`/`'B'`/`'C'` string:
// `PracticeModuleCard`'s hardcoded `3` and `ModuleTimeline`'s derived
// `i + 1` for Foundational/Sleep both still express "which position in
// this sequence" most naturally as a number — only the *rendered
// character* needed to change, so that's the one thing this lookup owns.
const SEQUENCE_LETTERS = ['A', 'B', 'C']

/**
 * Round 29 (Figma `413:2008` / `413:2191`): the marker is now a 56px-wide
 * full-height pill carrying the tier letter at `title` (22/500), sitting to
 * the *left* of the tier's title+description block rather than stacked above
 * it, and tinted per tier — purple for Foundational, yellow for Sleep.
 *
 * The frame draws both letters in white. That is fine on `primary`
 * (10.62:1) and a real failure on `yellow-400`, where white measures
 * **1.76:1**. Yellow cannot carry white text at any size. `ink` on
 * `yellow-400` measures 9.90:1 and is already this app's established pairing
 * for that swatch (Round 24's Carer badge), so the yellow tier takes dark
 * text while the purple tier keeps the frame's white.
 */
const TIER_MARKER: Record<string, string> = {
  foundational: 'bg-primary text-white',
  sleep: 'bg-yellow-400 text-ink',
}

function SequenceMarker({ number, tierKey }: { number: number; tierKey: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex w-14 shrink-0 items-center justify-center self-stretch rounded-full text-title',
        TIER_MARKER[tierKey] ?? 'bg-ink text-white',
      )}
    >
      {SEQUENCE_LETTERS[number - 1] ?? number}
    </span>
  )
}

/**
 * Module timeline card — carousel tile redesign (direct instruction,
 * supersedes the big vertical card this doc comment used to describe).
 * Previously every card in a tier rendered at this same large vertical
 * size, full-width, stacked one per row; that shape is now a compact
 * carousel tile shared by every module regardless of state — completed,
 * current, and locked modules are all reference/status only, not something
 * a coach needs to read a paragraph about.
 *
 * **Full size/visual parity across states (direct instruction, supersedes
 * every earlier "current card is bigger" iteration described further down
 * this comment): "I want all modules to look consistent regardless of their
 * current state... current module make it similar to other modules."** The
 * one enlarged "current" card, and every signal that made it look different
 * from its completed/locked siblings, is gone:
 * - **Width/height**: one size at every state — `w-56 sm:w-64` (224/256px),
 *   `h-36` cover, `h-[58px]` title block. These are the *former compact*
 *   dimensions (`w-48 sm:w-56` / `h-32` / `h-[50px]`) scaled up ~15%
 *   (192→224, 224→256, 128→144, 50→58) rather than the former *current*
 *   dimensions scaled down — per direct instruction, "current" was the
 *   outlier being corrected, not the target shape to shrink toward.
 * - **Spacing**: `gap-3` outer / `gap-2` inner at every state (previously
 *   `gap-4`/`gap-2.5` on the current card only).
 * - **Elevation**: `shadow-card` at every state (the current-only inline
 *   `boxShadow` lift described in the now-superseded paragraph below is
 *   removed outright, not just reduced).
 * - **Module progress bar**: dropped entirely, not just from compact tiles.
 *   It used to be the current card's one deliberate exception to fix #6's
 *   "compact tiles drop only the progress bar" rule (a real in-between
 *   percentage genuinely applies to the current module, unlike a
 *   completed/locked tile's binary state) — but keeping it while every card
 *   shares one fixed height would have meant either reintroducing a
 *   current-only height bump (exactly the distinguishing signal this pass
 *   removes) or squeezing it into the shared footprint at the cost of the
 *   title/CTA layout. Dropped for genuine parity; badge/title/status
 *   chip/CTA now carry the same information at every state, matching what
 *   compact tiles already showed.
 * - **CTA text size**: `text-caption` at every state (previously
 *   `text-caption-medium` on the current card only) — the last
 *   remaining state-conditional style on this card.
 *
 * `isCurrent` (derived from state, not a prop `ModuleGroupCanvas` passes in)
 * now drives exactly one thing: the `data-current` attribute `ModuleScrollRow`
 * reads for its mount-time auto-center effect. It carries no visual weight
 * of its own anymore.
 *
 * **Design-quality pass (direct feedback: "way too ugly, unbalanced, no
 * information hierarchy" — later sharpened to a numbered punch list against
 * a live screenshot). Six concrete fixes, all re-derived from this file's
 * own established conventions rather than invented — #1, #2, #3, and #4
 * still apply at every card size; #5 and #6 describe a compact/current split
 * that no longer exists, kept below for history:**
 *
 * 1. **Cover height was irregular** (`h-24 sm:h-28` compact vs `h-32 sm:h-36`
 *    current, on top of the two card widths already differing) — now one
 *    fixed height at every size (`h-36`, post-parity), so cover height never
 *    varies independently of the rest of the card.
 * 2. **The "MODULE N" badge outweighed the title** — a real, measured bug,
 *    not just an impression: the title `<h4>` was rendering at
 *    `font-weight: 400` (verified via computed style), i.e. *lighter* than
 *    the caption/description text below it, while sitting next to a solid
 *    black pill. The title now carries `font-semibold`, matching this doc's
 *    own `body-strong` spec (17px/600, design-tokens.md §2, "module card
 *    titles").
 * 3. **Description was `text-fine` (12px)**, too small to read comfortably
 *    per direct feedback, so this pass first bumped it up. A later,
 *    separate direct instruction then dropped the description line from
 *    the card altogether — title + badge + status chip carry the card's
 *    information now, per fix #6's superseded history below.
 * 4. **"Approx. N min" sat mid-flow, easy to miss while scanning** — moved
 *    to a small status chip over the top-right corner of the cover image,
 *    the same position/role `VideoPlaceholder.tsx`'s duration badge already
 *    occupies one layer up the module hierarchy. Built **opaque**
 *    (`bg-white`/`text-ink`), so a fixed-contrast solid pill guarantees AA
 *    regardless of what module-art wash sits underneath instead of needing
 *    a per-palette contrast check. Doubles as a completed/locked indicator
 *    (check / lock icon) so a coach scanning the row gets status from the
 *    image alone, not just the CTA text — genuinely accessible text, not
 *    `aria-hidden`, since it's now the *only* place this information
 *    renders.
 * 5. *(Superseded — see the parity section above.)* Current-card width used
 *    to read as "just bigger," not a considered ratio, and went through a
 *    flat-1.5x-at-both-breakpoints fix before that whole size difference
 *    was removed outright.
 * 6. *(Superseded — see the parity section above.)* Compact tiles used to
 *    drop only the "Module progress" bar, with the current card as the one
 *    exception that kept it; the bar is now dropped from every card,
 *    current included.
 *
 * The current card's own distinguishing mark went through three rejected
 * attempts before landing on none at all: an outset `ring-primary` (clipped
 * by `ModuleScrollRow`'s `overflow-x-auto` boundary on edge cards, and read
 * as visual noise besides), a `border-l-4` side border (read as ugly,
 * rejected outright), and finally size + a soft shadow lift (rejected too,
 * per the parity instruction above — "current module make it similar to
 * other modules"). All were live, direct feedback, not a hunch. There is no
 * longer any visual signal that distinguishes the current card from its
 * siblings — see the `STANDING RULE` comment on the `Card` itself below
 * before adding any stroke/border/outline/ring/shadow/size difference back
 * for this purpose.
 */
function TimelineModuleCard({
  module,
  index,
  displayNumber,
}: {
  module: TrainingModuleV2
  index: number
  /** The "MODULE N" badge number — defaults to `index + 1` (this module's
   *  position in the flat, forced-linear `PATHWAY_MODULES` array). A group
   *  canvas overrides this to the module's *local* position within its own
   *  tier (e.g. "MODULE 1" for the first Sleep module, not its global
   *  position of 5) — `index` itself still always carries the real global
   *  position, since lock/complete/current state must stay computed against
   *  the one true forced-linear order regardless of tier-local numbering. */
  displayNumber?: number
}) {
  const navigate = useNavigate()
  const state = timelineRowState(index, module)
  const locked = state === 'upcoming'
  const isCurrent = state === 'current'
  // `locked` short-circuits BEFORE `displayStatus` — a real bug, not a
  // hypothetical: `displayStatus`/`displayProgress` (`pathway.ts`) both
  // check `livePlayerStatus()` first, which resolves through
  // `realPlayerContentId()`/`DEMO_PLAYER_REDIRECTS`. That map only has one
  // KEY (`portal-orientation` → `building-blocks-good-sleep`) — calling
  // `realPlayerContentId('building-blocks-good-sleep')` directly (i.e. for its
  // own card, not via the redirect) finds no matching
  // key and falls through to returning `moduleId` unchanged, which is the
  // exact same id `portal-orientation`'s redirect resolves to. Both
  // module ids collide on one progress-store key, so a locked Sleep-tier
  // card was silently inheriting Foundational module 1's real live
  // progress and rendering "11% complete" with a filled bar despite being
  // genuinely locked. `locked` itself (from `timelineRowState`/
  // `moduleState()`, the forced-linear position) is computed independently
  // and is NOT affected by this collision, so checking it first and never
  // calling the live-player-aware functions at all while locked fixes the
  // actual `status`/`completed`/`inProgress`/`progress` values everywhere
  // they're used in this component (chip, bar, caption, CTA label) — not
  // just one UI element's own visibility, which would leave the underlying
  // values wrong for any future element that reads them without
  // independently re-checking `locked` itself. Scoped to this one call
  // site deliberately: `displayStatus`/`displayProgress` are shared with
  // `PracticeModuleCard`/`CertificateCard`, so their own internals are left
  // untouched rather than risking a wider ripple.
  //
  // The actual collision inside `realPlayerContentId()`/
  // `DEMO_PLAYER_REDIRECTS` (`pathway.ts`) is still there — this fixes the
  // symptom at its one real consumer, not the root architectural gap. Worth
  // a dedicated future fix (e.g. making the redirect map bidirectional-aware,
  // or having `livePlayerStatus` refuse to resolve for a module id that IS
  // itself a redirect target reached through a different key) rather than
  // rediscovering this from scratch next time something else calls
  // `livePlayerStatus` for a module a redirect also targets.
  // `'not-started'`, not a made-up `'upcoming'` literal — `ModuleStatus`
  // (`data/portal.ts`) is only `'not-started' | 'in-progress' | 'completed'`,
  // so this has to be a real member of that union to type-check. Doesn't
  // change any rendered copy: the JSX below already special-cases `locked`
  // to show the literal "Locked" text before ever consulting `status` for
  // display purposes, so this value only matters for the internal
  // completed/inProgress/progress derivation immediately below, not for
  // anything a coach sees directly.
  const status = locked ? 'not-started' : displayStatus(module.id, module.status)
  const completed = status === 'completed'
  // Real in-progress signal (direct instruction: "i also want to see the
  // in progress state after i start a module, thats not been implemented
  // yet"). Before this, the status chip only branched on `locked`/
  // `completed`/else — a genuinely started-but-not-finished module (e.g.
  // `building-blocks-good-sleep` mid-player, via `livePlayerStatus()` in
  // `pathway.ts`) fell into the same generic "Approx. N min" branch as a
  // module never opened at all, even though `displayStatus`/
  // `displayProgress` already had the real data. Deliberately NOT the
  // "Module progress" bar dropped from this card earlier this session — a
  // second full progress-bar element would reopen the exact per-state
  // height/shape difference that pass removed. Instead the existing status
  // chip (already the one place completed/locked status renders, per fix
  // #4 below) gets a 4th branch, reusing `displayProgress` — a real number
  // already computed for every module, not new data.
  const inProgress = status === 'in-progress'
  const progress = inProgress ? displayProgress(module.id, module.progress) : 0
  // Numeral overlay — see this file's own doc comment above (module-scope,
  // above `TimelineModuleCard`) for the color-switching-to-plain-white
  // history. `overlayNumber` intentionally reuses the exact same value
  // `ModuleBadge` below is given (`displayNumber ?? index + 1`, this
  // module's *tier-local* position), not the raw global `index`, so the
  // big overlay and the (now-hidden-but-still-present) badge never disagree
  // about which number this card is.
  const overlayNumber = displayNumber ?? index + 1

  // Round 7.1 — every non-locked card CTA now goes to this module's
  // overview page (`ModuleOverviewPage.tsx`) first, regardless of status;
  // that page is the new single hub a coach uses to jump into a specific
  // chapter, restart the intro, etc. Replaces the old direct-to-player /
  // `ModulePreviewModal` split this card used to branch on.
  const handleCtaClick = locked
    ? undefined
    : () => navigate(`/training-v2/module/${module.id}/overview`)

  return (
    /* `shrink-0`/`snap-start` so the card holds its own width inside the
     *  parent `ModuleScrollRow`'s horizontal flex track instead of
     *  stretching or squeezing, and lands cleanly on scroll-snap stops. */
    <Card
      // `data-current` is a plain hook for `ModuleScrollRow`'s mount-time
      // auto-center effect (it needs to find "the" card to center without
      // duplicating this component's own current/locked/completed
      // derivation) — not a style selector, no CSS reads it. It's the only
      // thing `isCurrent` still drives on this card; see the doc comment
      // above for the full "removed every visual distinction" history.
      data-current={isCurrent ? 'true' : undefined}
      // STANDING RULE, not a one-off: no side/edge stroke, border, ring,
      // outline, shadow, or size difference marks the current card. Three
      // different treatments were tried here and all three rejected live as
      // reading badly or contradicting direct feedback: an outset
      // `ring-primary` (clipped by `ModuleScrollRow`'s `overflow-x-auto`
      // boundary on edge cards, and visual noise besides), a `border-l-4`
      // side border (ugly), and finally a size bump + soft shadow lift
      // (explicitly rejected — "current module make it similar to other
      // modules"). Every card, current included, now renders identical
      // dimensions/spacing/elevation via one flat class list, no `isCurrent`
      // branching left in this className or a `style` prop.
      className={cn(
        // `gap-4` (16px), was `gap-3` (12px) — direct instruction, 4th round
        // on the same complaint ("why is there so much padding/dead space on
        // top... this is the fourth time i have flagged this"): "I want the
        // text to be top aligned with proper padding i.e. closer to image
        // with minimum 16px gap." This `gap-3`/`gap-4` here is the ONLY CSS
        // gap between the cover image and the content column below it (this
        // `Card` has exactly 2 direct children), so it alone controls the
        // image-to-title distance now that the invisible `ModuleBadge` span
        // that used to sit between them is gone (see the removal note at
        // that span's old location, right before the title, for why it was
        // safe to delete rather than just re-positioned). Measured live,
        // not assumed: with the badge span still in place, the real
        // image-bottom-to-title-top gap was 12px (this `gap-3`) + 21px
        // (the invisible badge's own `h-5`) + 8px (the inner `gap-2` before
        // the title) = **41px** — nowhere near the ~12-16px a glance at the
        // class list alone would suggest, which is exactly why 3 earlier
        // rounds fixing the *separate* caption/bar reservation below the
        // title never satisfied this complaint: they were fixing the wrong
        // block. Deleting the dead badge span drops that to a flat 12px
        // (`gap-3` alone) — under the requested 16px minimum — so this gap
        // is the one moved to `gap-4` to land exactly on it, using this
        // app's existing spacing scale rather than an arbitrary `gap-[16px]`.
        // Verified live post-fix on a completed, a locked, and an
        // in-progress card: all three now measure exactly 16px from the
        // cover's bottom edge to the title's own top edge, not just "some
        // smaller number."
        'flex w-56 shrink-0 snap-start flex-col gap-4 rounded-md p-4 shadow-card sm:w-64',
        // Locked-state cue — this was a whole-card `opacity-90`/`opacity-95`
        // (see the superseded history in the `TimelineModuleCard` doc
        // comment above) until direct feedback on that exact treatment:
        // "i asked to reduce the opacity of cards locked, but I can see the
        // stroke behind, now, I want a more deactivate[d] state style."
        // Flat opacity dims content and border by the same multiplier, but
        // a thin 1px ring reads as a crisp, high-frequency edge no matter
        // how much its alpha is reduced — it kept looking like an active
        // border floating over washed-out content instead of one
        // coherently "off" object. Rebuilt as a real muted-token treatment
        // instead of another opacity number, matching this project's own
        // precedent against opacity-as-disabled (design-tokens.md §39:
        // `WeekdayPicker`'s disabled tiles stacked `opacity-60` on
        // `text-ink-faint`, measured a failing 2.35:1, and were fixed by
        // dropping the opacity multiplier entirely in favor of an
        // already-calibrated token pairing at full opacity):
        // - Ring swapped from `ring-hairline` (#e0e0e0, a crisp edge on a
        //   white card) to `ring-hairline` (#f0f0f0) below, so the
        //   border itself goes quiet rather than staying sharp while
        //   everything inside it dims.
        // - The cover art gets `grayscale` (see that `<div>`'s own comment)
        //   instead of translucency — color draining reads as "turned off,"
        //   which a flat alpha reduction never actually achieved.
        // - Title and badge both swap to the exact `bg-divider-soft`/
        //   `text-ink-muted` pairing the locked CTA button already uses
        //   (already measured at 11.09:1, see that button's own comment) —
        //   reused, not reinvented, for the same reason as the ring.
        // No opacity utility anywhere on this card anymore.
        locked ? 'ring-1 ring-hairline' : 'ring-hairline',
      )}
    >
      {/* Fixed `h-36` at every size (fix #1 above; bumped from the former
       *  compact `h-32` by ~15% as part of the parity-plus-size-increase
       *  pass) — cover height never varies independently of the rest of
       *  the card, and no longer varies by state either. Not
       *  `aria-hidden`: the status chip inside is real accessible text now
       *  that it's the only place this module's time-estimate/completed/
       *  in-progress/locked status renders (fix #4, extended with a 4th
       *  in-progress branch — see `inProgress`/`progress` above). `bg-white`
       *  (direct instruction, swapped from an initial `bg-black`/
       *  `text-white`) — still fully opaque, so the chip's fill contrast is
       *  fixed regardless of whatever module-art wash sits behind it, same
       *  guarantee the black version had, just inverted.
       *
       *  Text/icon colour is no longer a flat `text-ink` for every state:
       *  direct feedback ("the 'Completed' state... looks too visually
       *  similar to 'Locked'... easy to mistake one for the other at a
       *  glance") was confirmed live before fixing it, not assumed from the
       *  code — a side-by-side screenshot plus a computed-style check
       *  showed the two chips were 100% identical (`bg-white`/`text-ink`/
       *  `text-fine`, only the icon glyph and word differing). Fixed by
       *  reusing this app's own already-established `success` chip
       *  convention (`StatusChip.tsx`'s `Chip` component, `tone="success"`
       *  → `text-success font-semibold`) for the `completed` branch only —
       *  not a new filled/tinted background, which would be a second,
       *  invented "success" treatment alongside the one this app already
       *  has; `text-success` colours the icon too via `currentColor`, so
       *  both the check glyph and the word go green together ("tint the
       *  chip, not just the icon"), matching every other completed/success
       *  signal in this app (design-tokens.md §1's "quiet, no rival
       *  accents — success is the one exception" rule). Locked/in-progress/
       *  not-started stay exactly as they were — this was scoped to
       *  Completed only, per direct instruction ("Locked stays as-is").
       *
       *  `locked && 'grayscale'` desaturates the module-art gradient wash
       *  in place of the old whole-card opacity dim — see this card's own
       *  `className` comment above for why. Applied to this wrapper, not
       *  just the inner art `<div>`, so it also covers the status chip;
       *  harmless there since that chip's own fill/text stay fully opaque
       *  and `grayscale` only desaturates hue, which the locked chip's
       *  white/black pairing has none of to begin with. */}
      <div className={cn('relative h-36 w-full shrink-0 overflow-hidden rounded-sm', locked && 'grayscale')}>
        <div aria-hidden="true" className="absolute inset-0" style={moduleArt(module.cover.colors, module.cover.image)} />
        {/* Numeral overlay, every card (promoted from a module-1-only trial;
         *  see this file's module-scope doc comment above
         *  `TimelineModuleCard` for the color-switching-tried-and-reverted
         *  history). Purely decorative reinforcement of this module's own
         *  tier-local position, same reasoning as `SequenceMarker`'s
         *  `aria-hidden` above: a sighted reader already gets the order
         *  from the "MODULE N" pill (now hidden-not-unrendered, see below)
         *  and top-to-bottom/left-to-right position.
         *
         *  Plain `text-white` on every card, per direct instruction — all
         *  legibility now rides on this shadow alone, since roughly half
         *  this tier's real covers are pale enough that plain white
         *  computed to ~1.1-1.4:1 against the raw wash with no shadow at
         *  all (see the earlier, now-removed per-module color switch this
         *  replaced).
         *
         *  **Revised again, per direct feedback ("the stroke around the
         *  number is ugly, remove that").** The first shadow version
         *  stacked 4 tight, low-blur diagonal offsets to build a hard ring
         *  around each glyph's stroke, plus 2 soft blurred layers
         *  underneath — the 4 hard offsets are what read as an "outlined
         *  text" stroke, which is what got flagged, not the soft layers.
         *  Removed those 4 entirely in favor of a soft-blur-only version.
         *
         *  **Final: "use the most subtle shadow token."** Replaced that
         *  custom soft-blur value with this project's own `--shadow-card`
         *  (`0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)` —
         *  spread dropped, `text-shadow` has no spread parameter unlike
         *  `box-shadow`) rather than inventing another one-off value.
         *  Honestly verified before shipping, not assumed: this token is
         *  roughly 10x weaker than the custom shadow it replaced, and
         *  really is too faint to meaningfully rescue legibility on this
         *  tier's palest covers (checked live, grayscale temporarily
         *  stripped to see the true un-desaturated wash) — the numeral is
         *  technically present but genuinely hard to read against
         *  `#eef0e6`/`#f0e2e6`/`#f3e4e2` specifically. Flagged as a real
         *  tradeoff rather than silently reached-for-something-stronger,
         *  and accepted as-is on direct instruction: these gradient covers
         *  are themselves temporary placeholders, and a future round
         *  swapping them for real photos with their own dark overlay/scrim
         *  resolves the legibility question properly at that point. **A
         *  future real-photo-cover round should revisit whether this
         *  shadow is even still needed once a real image + overlay scrim
         *  is in place** — don't carry it forward unexamined just because
         *  it's already here. */}
        <span
          aria-hidden="true"
          className="absolute bottom-1 left-2 font-display text-6xl leading-none font-bold text-white"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {overlayNumber}
        </span>
        <span
          className={cn(
            // Repositioned bottom-right on every card now (promoted from a
            // numeral-overlay-trial-only move, direct instruction: "move
            // the label bottom right") — pairs with the numeral's bottom-
            // left position, leaving the cover's top edge clean everywhere,
            // not just the one card that used to have a numeral.
            'absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-fine',
            completed ? 'text-success font-semibold' : 'text-ink',
          )}
        >
          {locked ? (
            <Lock aria-hidden="true" className="size-3" />
          ) : completed ? (
            // Bumped from `size-3` (12px, the same size every other chip
            // icon here still uses) to `size-4` (16px) per direct feedback
            // on a live screenshot ("the tick is way too small") — checked
            // live before picking a size: the chip's own height grows only
            // 23.6px → 24px (`getBoundingClientRect`, negligible, no visual
            // shape change), so the icon alone could grow without touching
            // the chip's `py-1` padding or forcing a second, matching size
            // bump anywhere else. Scoped to this one icon only, not
            // Lock/PlayCircle/Clock — the ask was specifically about the
            // completed checkmark carrying a stronger positive signal now
            // that it's coloured `text-success`, not a general chip-icon
            // resize.
            <CheckCircle2 aria-hidden="true" className="size-4" />
          ) : inProgress ? (
            <PlayCircle aria-hidden="true" className="size-3" />
          ) : (
            <Clock aria-hidden="true" className="size-3" />
          )}
          {locked
            ? 'Locked'
            : completed
              ? 'Completed'
              : inProgress
                ? // Direct instruction: "label should say in progress, and
                  // not tell how much" — the real percentage moved to the
                  // new progress bar below the title (see that element's
                  // own doc comment) instead of being stated twice. Still
                  // exposed to assistive tech via that bar's own
                  // `aria-label`, just no longer spelled out in this chip.
                  'In progress'
                : `Approx. ${module.estimatedMinutes} min`}
        </span>
      </div>
      {/* `gap-3` (12px) → `gap-5` (20px) per direct feedback ("increase gap
          between bar and CTA") — this row's `justify-between` means the
          rendered gap is whatever slack remains after both groups'
          natural heights are subtracted from the available height, but
          since every card's `group1` (badge/title/bar/caption) now
          renders at one identical, state-independent height (the whole
          point of the `invisible`-reservation technique throughout this
          card), bumping this value affects every card uniformly, not just
          the in-progress one — verified live across a completed, locked,
          and in-progress card at the new value, not just the one state
          that prompted the ask. */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-5">
        <div className="flex flex-col gap-2">
          {/* REMOVED (was: an `invisible` "MODULE N" pill reserved here on
           *  every card, height/gap kept in layout but hidden — see this
           *  file's git history for the previous comment's full reasoning,
           *  a real height-parity fix at the time). Deleted as part of the
           *  4th-round "too much dead space above the title" fix (see the
           *  `Card` root `className` comment above): once the numeral
           *  overlay + repositioned status chip took over every signal this
           *  pill used to carry, it had exactly one job left — sitting
           *  invisibly between the image and the title, eating 21px
           *  (`h-5`) + an 8px `gap-2` on every single card for literally no
           *  visible purpose. Safe to delete outright rather than move: the
           *  height-parity concern it existed for is about every card
           *  losing/gaining the *same* amount, not about any specific
           *  pixel target — removing it from every card's JSX uniformly
           *  (not conditionally, which is what actually caused the
           *  original height bug this span was created to fix) keeps every
           *  state's card height identical to its siblings, just 29px
           *  (21px + 8px gap) shorter overall than before. `ModuleBadge`/
           *  `Badge` (this file's own components, defined near the top of
           *  this file) are removed too — this was their only remaining
           *  call site anywhere in the file. */}
          {/* Title now the clear anchor of the card (fix #2): `font-semibold`,
           *  matching this doc's own `body-strong` spec (17px/600,
           *  design-tokens.md §2, "module card titles"). Typography stays
           *  identical at every state — no card dimension is state-
           *  conditional anymore either (see the doc comment above).
           *  Verified via computed style, not eyeballed: every variant
           *  measures `font-size: 17px; font-weight: 600`. Deliberately
           *  drops the `font-display` class the title carried before this
           *  pass: design-tokens.md §2 reserves the Display face for sizes
           *  ≥21px ("Display sizes (≥21px)... Body/UI (<21px): SF Pro
           *  Text") — 17px is a Text-face size, and the Display face
           *  renders visually heavier at the same numeric weight, which is
           *  what read as "too bold" even though the computed weight was
           *  already the correct 600. Plain `font-sans` (this app's body
           *  default, unset here) is the size-correct face.
           *
           *  `h-[58px]` (now on the wrapping `<div>`, not the `<h4>` itself
           *  — see below) is load-bearing, not decorative: `line-clamp-2`
           *  only caps a title at *up to* 2 lines, it doesn't reserve room
           *  for 2 — a genuinely one-line title (e.g. "SIPTEA framework")
           *  was measured live rendering its whole card shorter than every
           *  two-line-title sibling in the same row, which is the real
           *  mechanism behind "cards aren't all the same height." Locking
           *  the title block to a fixed height makes every card's content
           *  stack the same height regardless of how long its own title
           *  text happens to be. Bumped from the former `h-[50px]` by ~15%
           *  as part of this pass's overall size increase — same
           *  technique, scaled number.
           *
           *  Vertical centering (`items-center`) was added when the numeral
           *  overlay went from a one-card trial to every card: a
           *  fixed-height box only fixes the *card's* height consistency,
           *  not the *title text's own* visible position inside that box.
           *  Measured live with a real `Range` over the title's text node
           *  (not the `<h4>` block, which returns one rect regardless of
           *  internal wrapping) — a short one-line title (e.g. "Your
           *  coaching toolkit," 21 chars) sat top-aligned in the same 58px
           *  box a long two-line title (e.g. "Know the project, know your
           *  client," 34 chars) filled almost completely, leaving visible
           *  dead space below the short title and a visibly tighter
           *  title-to-button gap on the long one.
           *
           *  **Reverted to `items-start` per direct instruction ("all
           *  titles should also be top aligned not middle"), same pass as
           *  the invisible-badge removal above.** Checked live, side by
           *  side, rather than assuming the original asymmetry either
           *  stays fixed or comes back: with the image-to-title gap now a
           *  tight, literal 16px (this pass's other fix) and the dead
           *  invisible-badge space gone, a short 1-line title
           *  ("Your coaching toolkit") and a long 2-line title ("Know the
           *  project, know your client") both now sit flush at the same
           *  top offset from the image — the short title's own slack still
           *  falls below it exactly as the original bug described, but at
           *  this tighter overall spacing it reads as normal breathing
           *  room before the CTA rather than as an asymmetric "why does
           *  this card look different" gap. Flagging plainly rather than
           *  silently reverting: this is a real, deliberate trade-off
           *  (top-alignment was explicitly requested over the symmetry
           *  centering used to guarantee), not a case where the old bug
           *  turned out to not exist at all.
           *
           *  `locked && 'text-ink-muted'` (replaces the flat `text-ink`)
           *  continues the muted-token treatment into the title, part of
           *  the same "deactivated, not just faded" pass described on the
           *  card's own `className` above — reuses the identical color the
           *  locked CTA button already uses, still comfortably AA (11.09:1
           *  on white, only higher on the lighter `bg-divider-soft` ring). */}
          <div className="flex h-[58px] items-start">
            <h4 className={cn('line-clamp-2 text-body font-semibold', locked ? 'text-ink-muted' : 'text-ink')}>
              {module.title}
            </h4>
          </div>
          {/* In-progress bar, below the title (direct instruction: "when I
           *  have started module, I want to see a progress bar below
           *  title... label should say in progress, and not tell how
           *  much" — the chip text change is above, this is the new visual
           *  element). Reserved on EVERY card via `invisible` (value 0,
           *  hidden) when not in-progress, rather than only rendering it
           *  for the in-progress branch — this file already fought hard
           *  earlier this session to make completed/current/locked/in-
           *  progress all render at one identical height (see this card's
           *  own top-level `className` comment), and a bar that only
           *  exists for one state would reopen exactly that variance.
           *  Reusing the same `invisible`-not-unrendered technique already
           *  proven out for the badge suppression above (and root-caused
           *  from a real height bug the first time it mattered) rather
           *  than re-deriving it. `aria-label` carries the real percentage
           *  for assistive tech even though the chip no longer states it
           *  visually — the instruction was about decluttering the sighted
           *  label, not about withholding the real number from a screen
           *  reader user who can't see the bar's own fill.
           *
           *  Visible percentage caption added on direct follow-up feedback
           *  — the earlier fix moved the real number into the bar's
           *  `aria-label` only (accessibility, not sighted), which reads as
           *  the number vanishing entirely to a sighted coach. This does
           *  NOT reopen the original "don't tell how much" instruction: the
           *  status chip above stays the generic "In progress" text
           *  untouched — the percentage now lives with the bar specifically
           *  (`X% complete`, right above its track), not duplicated back
           *  onto the chip. Same `invisible`-not-unrendered reservation as
           *  the bar itself, so this caption's own line height doesn't
           *  reopen the per-state height variance either. */}
          <span className={cn('text-caption text-ink-faint', !inProgress && 'invisible')}>
            {Math.round(progress)}% complete
          </span>
          <Progress
            value={inProgress ? progress : 0}
            aria-label={inProgress ? `${Math.round(progress)}% complete` : undefined}
            className={cn(
              '[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-divider-soft',
              !inProgress && 'invisible',
            )}
          />
        </div>

        {/* Round 19 accessibility review — the locked "Locked" label's own
         *  `text-ink-faint` (#6d6d6d) measured 4.45:1 against `bg-divider-
         *  soft` (#f0f0f0), computed via `getComputedStyle` — a real, if
         *  narrow, miss of the 4.5:1 AA minimum for normal text. This
         *  button is `aria-disabled`, not native `disabled` (it must stay
         *  focusable to expose the `sr-only` "complete the module above
         *  first" hint), so it doesn't qualify for the exemption this
         *  project's own Round 14.6 report already reasoned through for
         *  genuinely native-disabled controls. Fixed with the identical
         *  swap Round 14.5 already established for this exact failure
         *  class (`PlanSessionsModal.tsx`'s disabled day tiles,
         *  "`text-ink-muted` restores a real margin") rather than inventing
         *  a new token — `text-ink-muted` (#333333) measures 11.09:1,
         *  re-verified live. Same fix applied to the identical pairing on
         *  `CertificateCard`'s and `PracticeModuleCard`'s own locked CTA
         *  below. */}
        <button
          type="button"
          aria-disabled={locked ? 'true' : undefined}
          onClick={handleCtaClick}
          className={cn(
            'inline-flex h-9 w-full shrink-0 items-center justify-center gap-1 rounded-full px-3 text-caption-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
            locked
              ? 'cursor-not-allowed bg-divider-soft text-ink-muted'
              : cn(
                  'bg-primary text-white hover:bg-primary-hover',
                  !handleCtaClick && 'cursor-not-allowed',
                ),
          )}
        >
          {locked && <Lock aria-hidden="true" className="size-3" />}
          {locked ? 'Locked' : timelineCtaLabel(status, displayNumber ?? index + 1)}
          {locked && <span className="sr-only"> (complete the module above first)</span>}
        </button>
      </div>
    </Card>
  )
}

/** Certificate's cover — a warm gold/cream wash via the same `moduleArt`
 *  technique every module cover uses, not a fabricated image. Distinct
 *  colours are fine here: `cover.colors` was always a decorative wash, not
 *  a semantic accent (design-tokens.md §17) — `primary` stays the system's
 *  only *interactive* accent, unaffected by this card's art. */
const CERTIFICATE_COVER = ['#f7ecd1', '#e8c96a', '#c9a24a'] as const

/**
 * Rebuilt onto `TimelineModuleCard`'s own vertical chassis (Round 9.1,
 * direct instruction — "should look similar to other modules"), replacing
 * the original portrait `CertificateCard`. Keeps its own modules-complete
 * progress bar + Download CTA in place of "Module progress" +
 * Start/Resume/Restart, since a percentage genuinely applies here. Rendered
 * standalone, after the three `ModuleGroupCanvas` sections below — it isn't
 * a curriculum tier, so it doesn't live inside a canvas.
 *
 * No longer carries a "CERTIFICATION" `Badge` (removed by a later, separate
 * direct instruction) — dropped for height parity against `PracticeModuleCard`,
 * whose own badge had already been removed earlier the same session; removing
 * this card's badge too brings both cards' title/description block back to
 * the same one-`<div>` shape. The now-single-child `gap-12` wrapper that used
 * to hold the badge above the title block was removed along with it — the
 * title/description `<div className="space-y-3">` now sits directly in the
 * outer `gap-6 p-3` container, matching `PracticeModuleCard`'s own structure
 * exactly. This card still keeps its progress bar (untouched, per explicit
 * instruction — a follow-up ask to also drop `PracticeModuleCard`'s own
 * progress bar was floated, then retracted the same session, so that card
 * still has one too). Both cards happen to measure the same height live
 * regardless, since both now share the exact same content-block shape
 * (cover + title/description + progress bar + CTA) — the badge was the only
 * structural difference between them.
 */
export function CertificateCard() {
  const progress = (completedModulesCount / PATHWAY_MODULES.length) * 100

  return (
    // "Deactivated," not just dimmed, while `!isCertified` — matches
    // `TimelineModuleCard`'s own locked-card treatment exactly (see that
    // component's doc comment for the full reasoning: flat opacity dimmed
    // this card's content and its `ring-hairline` border by the same
    // multiplier, but the border still read as a crisp edge floating over
    // washed-out content, per direct feedback). Same fix, same 3 moves:
    // ring goes to `ring-hairline`, the cover art gets `grayscale`, and
    // the title swaps to the already-AA-verified `text-ink-muted` the
    // locked CTA button below already uses — no opacity utility anywhere
    // on this card.
    <Card
      className={cn(
        'flex w-full flex-col gap-3 rounded-md p-3 shadow-card',
        isCertified ? 'ring-hairline' : 'ring-1 ring-hairline',
      )}
    >
      <div
        aria-hidden="true"
        className={cn('h-48 w-full shrink-0 rounded-sm', !isCertified && 'grayscale')}
        style={moduleArt(CERTIFICATE_COVER)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-6 p-3">
        <div className="space-y-3">
          <h4 className={cn('text-title font-display', !isCertified && 'text-ink-muted')}>Your certificate</h4>
          <p className="text-body text-ink-muted">
            Awarded once all {PATHWAY_MODULES.length} modules are complete.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Per direct instruction and this card's own doc comment above,
           *  the modules-complete progress bar below stays visible even
           *  while locked — deliberately, not an oversight: unlike a single
           *  module's own progress (meaningless at 0% before it unlocks),
           *  this bar tracks aggregate certification progress, which is
           *  genuinely meaningful and non-zero for most of a coach's time in
           *  this pathway. Hiding it would remove the one thing this card
           *  exists to communicate. */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-caption">
              <span className="text-ink">
                {completedModulesCount}/{PATHWAY_MODULES.length} modules complete
              </span>
              <span className="text-ink-faint">{Math.round(progress)}%</span>
            </div>
            <Progress
              value={progress}
              aria-label={`${completedModulesCount}/${PATHWAY_MODULES.length} modules complete`}
              className={cn(
                '[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-divider-soft',
                isCertified && '[&_[data-slot=progress-indicator]]:bg-success',
              )}
            />
          </div>

          <button
            type="button"
            aria-disabled={isCertified ? undefined : 'true'}
            className={cn(
              'inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full px-4 text-caption-medium outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto',
              isCertified
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-divider-soft text-ink-muted',
            )}
          >
            {!isCertified && <Lock aria-hidden="true" className="size-3.5" />}
            {/* Correction while implementing this pass's own instruction:
             *  this button never actually said "Locked" — unlike every other
             *  locked CTA in this file, it always showed "Download
             *  certificate" verbatim, disabled only via `aria-disabled` +
             *  style + the lock icon, with the *why* living solely in the
             *  now-removed liner line and this `sr-only` hint. Swapping the
             *  whole label while locked (mirroring how every *other* locked
             *  CTA on this page already behaves) is a small, deliberate
             *  behavior change beyond a literal "replace the liner with the
             *  button label," flagged when first done rather than silently
             *  decided. Two direct rounds of feedback since: first landed on
             *  "Unlocks after Practice" (mirroring `PracticeModuleCard`'s own
             *  phrasing), then simplified further per direct instruction —
             *  "just say unlock" — to the single word below, which already
             *  reads unambiguously paired with the lock icon immediately to
             *  its left; no restated gate condition needed on the button
             *  itself now that the tier subtitles above each carousel
             *  already establish the sequential-order requirement. Old
             *  `sr-only` "(complete all modules first)" hint stays removed —
             *  still redundant, if anything more so now. */}
            {isCertified ? 'Download certificate' : 'Unlock'}
          </button>
        </div>
      </div>
    </Card>
  )
}

/**
 * Overlaying chevron prev/next controls wrapped around a native
 * scroll-snap row, plus a dot pagination row below it — new for this
 * round's compact-carousel treatment inside each `ModuleGroupCanvas`.
 *
 * **Dots are real pages, not one-per-card (direct bug report: "paginations
 * does not makes sense, there are more pages than the number of horizontal
 * scrolls").** This started as one dot per card — deliberately, per the
 * original doc comment this replaces, since at the time `NotificationHub`'s
 * own fixed-chunk paging couldn't apply here: cards came in two different
 * widths (compact vs. an enlarged "current" card), so there was no clean
 * "how many fit on screen" number to chunk by. That blocker is gone — a
 * later, unrelated pass unified every card to one identical size regardless
 * of state — so the original one-dot-per-card scheme now just overcounts:
 * 7 dots for a "Sleep modules" row where only ~2 real scroll positions
 * (page 1 of ~4 cards, page 2 of the remaining ~3) exist at desktop width.
 * `visibleCount` (how many full cards actually fit in the track at once) is
 * measured live off the real DOM in `updateEdges` — first card's own
 * `offsetWidth` + the row's real `columnGap` (never hardcoded, since this
 * file's cards are already sized per-breakpoint via `sm:w-64`) — rather
 * than assumed, so it stays correct at every viewport width without a
 * breakpoint-keyed lookup table. `pageCount = ceil(itemCount / visibleCount)`
 * drives the dot count; `goToPage`/`scrollByPage` both operate in
 * `visibleCount`-sized jumps.
 *
 * **Chevrons became page-sized too, not left finer-grained.** Once dots
 * mean "one page of `visibleCount` cards," a chevron still nudging by a
 * single card would imply two different units for the two controls sitting
 * right next to each other with no way to explain why — a coach clicking
 * the right chevron 3 times to reach what the dots call "page 2" is exactly
 * the kind of mismatch this whole fix exists to remove. Both now move by
 * one full page (`visibleCount` cards' worth of width) per click, landing on
 * the same scroll-snap stops the dots jump to.
 *
 * Dots still reuse this app's one prior horizontal-scroll pagination
 * pattern (`NotificationHub.tsx`'s notice carousel — same size/spacing/
 * active-state visual language, `primary` in place of that component's
 * green tint since this canvas isn't green-tinted); "active" page (`activePage`)
 * is tracked as its own dedicated state, matched against each page's real
 * target scroll position inside `updateEdges` — not derived from a
 * card-granular `activeIndex` at render time (an earlier draft of this
 * comment described that approach; it was superseded because it broke on a
 * short trailing page — see `activePage`'s own state comment below for the
 * concrete example). Both chevrons and dots are genuinely
 * conditional, not just visually disabled — re-checked on scroll and on
 * container resize via `ResizeObserver` against real `scrollLeft`/
 * `scrollWidth`/`visibleCount`, so a tier that fits without overflow (the
 * Practice module tier's single card) gets neither, rather than shipping
 * controls that would just sit there doing nothing.
 *
 * Chevrons are `hidden` below `md`: at tablet/mobile widths a small overlaid
 * tap target is a worse fit than the touch swipe those widths already
 * support natively — the row's own `overflow-x-auto`/`snap-x`, and the dots
 * below it, keep working with or without the chevrons, at every breakpoint.
 *
 * Round 19 accessibility review — both chevrons measured 28×28px
 * (`p-1.5` padding around a `size-4` icon), short of this app's own
 * repeatedly-enforced 36px icon-button convention (design-tokens.md §1,
 * "Icon-only buttons follow suit (`size-9`)" — the same gap class Round
 * 3.1/10/18 each already fixed once on a different control). Fixed with a
 * fixed `size-9` box around the same `size-4` icon, re-verified live via
 * `getBoundingClientRect()` (36×36px both directions post-fix).
 */
function ModuleScrollRow({ children, itemCount }: { children: ReactNode; itemCount: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const leftChevronRef = useRef<HTMLButtonElement>(null)
  const rightChevronRef = useRef<HTMLButtonElement>(null)
  // Round 19.1 accessibility review — `handleChevronBlur` below (the
  // `onBlur`-plus-`relatedTarget`-check fix) turned out to be an unreliable
  // safety net, not a real fix, confirmed live: a genuine trusted mouse
  // click on a chevron at its scroll boundary sometimes drops keyboard
  // focus to `<body>` with **no `focusout`/`blur` event ever firing at
  // all** — verified with a `document`-level capture-phase listener that
  // logged nothing, ruling out a slow/late event rather than a missing one.
  // The identical unmount-while-focused pattern elsewhere in this app
  // (`NotificationHub.tsx`'s dismiss button) fires `focusout` reliably
  // under the same test, so this isn't a browser/tooling limitation — it's
  // specific to how/when this row's still-animating `scroll-behavior:
  // smooth` scroll interacts with the unmount. Since the DOM event this
  // row's fix depended on can't be trusted to fire at all, the real fix
  // can't live in an event handler — it has to observe the unmount
  // directly. A callback ref does that: React invokes it with `null`
  // *synchronously*, in the same commit that removes the node, regardless
  // of whether any DOM event later fires for it. Reading `document.
  // activeElement` against the *previous* value at that exact moment — the
  // node hasn't been forgotten yet, since this callback is the one place
  // that's about to forget it — and redirecting immediately, in the same
  // tick, closes the race entirely rather than betting on catching it a
  // frame or two later. `useCallback` with an empty dependency array keeps
  // each callback's own identity stable across renders, so React only
  // invokes it on a genuine mount/unmount of the underlying DOM node, never
  // on an unrelated re-render — an unstable (inline) callback ref would
  // fire on every render and misfire this exact redirect logic constantly.
  // `handleChevronBlur`/`onBlur` below is left in place as a second,
  // redundant layer rather than removed — harmless, and it's still the
  // thing that catches a normal Tab-driven blur needing no redirect at all
  // (`e.relatedTarget` present, early return) plus any focus-loss path this
  // synchronous check doesn't happen to cover.
  const handleLeftChevronNode = useCallback((node: HTMLButtonElement | null) => {
    const previous = leftChevronRef.current
    if (node === null && previous !== null && document.activeElement === previous) {
      ;(rightChevronRef.current ?? scrollRef.current)?.focus()
    }
    leftChevronRef.current = node
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable identities, never a real dependency
  }, [])
  const handleRightChevronNode = useCallback((node: HTMLButtonElement | null) => {
    const previous = rightChevronRef.current
    if (node === null && previous !== null && document.activeElement === previous) {
      ;(leftChevronRef.current ?? scrollRef.current)?.focus()
    }
    rightChevronRef.current = node
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable identities, never a real dependency
  }, [])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  // Which page's dot is lit. Computed directly against each page's own
  // *target* scroll position (the same clamped value `goToPage` itself
  // would scroll to for that page — see `updateEdges` below), not derived
  // from "which card is closest." A derived approach was tried first and
  // broke on a short trailing page: with 4 cards and 3 visible, page 2 is
  // really just 1 card, so its natural scroll position sits far short of a
  // full page-width step — the closest *card* to that position was still
  // one belonging to page 1, so the dot stayed lit on page 1 even after
  // scrolling all the way right, verified live before this fix. Matching
  // against page targets directly can't have that mismatch, by
  // construction: whatever page a click actually lands on is exactly the
  // page this comparison will report back.
  const [activePage, setActivePage] = useState(0)
  // How many full cards actually fit in the visible track at once — the
  // real "page size" dots/chevrons now paginate by. Measured, not assumed
  // (see this component's own doc comment above); starts at 1 so a
  // pre-measurement render never divides by 0.
  const [visibleCount, setVisibleCount] = useState(1)

  // Gates the *left* chevron only. Two things have to both be true before it
  // can show, worked out across two failed attempts (kept below for
  // history, since a third regression here is plausible without this
  // context):
  //
  // 1. **The coach must have actually driven the row themselves.** The
  //    mount-time auto-center effect below (`useLayoutEffect`) intentionally
  //    moves `scrollLeft` off its resting position to bring a deep "current"
  //    card into view — a real, direct-instruction feature, not a bug — but
  //    it shouldn't count as "scroll history" the coach now needs a chevron
  //    to undo. `hasInteractedRef` starts `false` and only ever flips to
  //    `true` on a genuine gesture: `wheel`/`touchstart`/`pointerdown` on the
  //    track itself, or a chevron/dot click (`scrollByPage`/`goToPage` below
  //    both set it). It never resets.
  //
  //    *First attempt, insufficient alone:* comparing `scrollLeft` against a
  //    `baselineScrollLeftRef` snapshot taken once at mount (instead of
  //    gating on interaction) fixed the initial-load flash but broke the
  //    moment that baseline coincided with the row's own true scroll
  //    *maximum* — which the Foundational tier does today (4 cards, current
  //    module 2 wants `280px`, but `scrollWidth - clientWidth` only allows
  //    `204px`, so the mount effect clamps there and that clamped value
  //    becomes the "baseline"). Since nothing can ever exceed that baseline
  //    on this row, the left chevron could never appear at all — a direct
  //    violation of "shows once you actually scroll right," verified live
  //    after clicking the *real* right chevron and landing right back at
  //    that same clamped position with no way back except the dot row.
  //
  // 2. **Once interacted, compare against the row's real geometric start**
  //    — `(el.firstElementChild)?.offsetLeft`, not literal `0`. This
  //    container carries its own `p-1` padding, so a fully-at-rest row (card
  //    1 completely unclipped) already sits at a small nonzero `scrollLeft`
  //    (`4px` today) purely from that padding — a flat `> 2` against literal
  //    `0` would keep the chevron lit even when there is nothing left to
  //    scroll to, the opposite failure from #1.
  const hasInteractedRef = useRef(false)
  const markInteracted = useCallback(() => {
    hasInteractedRef.current = true
  }, [])

  const updateEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const trueStart = (el.firstElementChild as HTMLElement | null)?.offsetLeft ?? 0
    setCanScrollLeft(hasInteractedRef.current && el.scrollLeft > trueStart + 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
    setHasOverflow(el.scrollWidth > el.clientWidth + 2)

    // How many full cards fit in the track at once, measured live off the
    // actual first card + the row's real `gap-5` (never hardcoded — see
    // this component's own doc comment). For `k` cards there are `k-1`
    // internal gaps, so the total width used is `k*step - gap`; solving
    // `k*step - gap <= clientWidth` for the largest integer `k` gives
    // `floor((clientWidth + gap) / step)`. Computed as a local var, not read
    // back from the `visibleCount` state (which still reflects the *previous*
    // render until this function's own `setVisibleCount` below commits) —
    // the active-page match just below needs this tick's real value, not a
    // stale one.
    const firstCard = el.firstElementChild as HTMLElement | null
    let visible = 1
    if (firstCard) {
      const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0
      const step = firstCard.offsetWidth + gap
      visible = step > 0 ? Math.max(1, Math.floor((el.clientWidth + gap) / step)) : 1
    }
    setVisibleCount(visible)

    // Active page — matched against each page's own real *target* scroll
    // position (the exact clamped value `goToPage(p)` would scroll to),
    // not derived from "which card is closest." See `activePage`'s own
    // state comment above for the short-trailing-page bug this replaces.
    const pages = Math.max(1, Math.ceil(itemCount / visible))
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    let closestPage = 0
    let closestPageDistance = Infinity
    for (let p = 0; p < pages; p++) {
      const child = el.children[Math.min(p * visible, itemCount - 1)] as HTMLElement | undefined
      if (!child) continue
      const pageTarget = Math.min(child.offsetLeft, maxScroll)
      const distance = Math.abs(pageTarget - el.scrollLeft)
      if (distance < closestPageDistance) {
        closestPageDistance = distance
        closestPage = p
      }
    }
    setActivePage(closestPage)
  }, [itemCount])

  useEffect(() => {
    updateEdges()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(updateEdges)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateEdges])

  // Mount-time auto-center (direct instruction, most load-bearing on
  // mobile where far less of the row is visible at once): without this, a
  // fresh page load always shows module 1 first regardless of tier state,
  // even when this tier's real "current" module sits several cards in.
  // `useLayoutEffect`, not `useEffect`, so the row is already at its
  // centered position on first paint rather than visibly jumping there a
  // frame later. Looks for `data-current` (set by `TimelineModuleCard`,
  // the one place that already knows which module is current — this
  // component deliberately doesn't re-derive that state itself) and falls
  // back to the first card when a tier has none (Sleep/Practice today,
  // per direct instruction — "module 1" is the correct fallback, not "do
  // nothing").
  //
  // Round 19 accessibility review — this previously called
  // `target.scrollIntoView({ inline: 'center', block: 'nearest' })`, on the
  // stated assumption that `block: 'nearest'` keeps the vertical page
  // scroll untouched. Confirmed live that assumption is false on this page:
  // `scrollIntoView` walks up every scrollable ancestor, not just this
  // row's own horizontal track, and with three `ModuleGroupCanvas`
  // instances each independently calling it on mount — Sleep's and
  // Practice's fallback targets (their own first card) genuinely aren't
  // vertically in view yet on a fresh load — the browser scrolled the
  // *page* itself to satisfy each one in turn. Reproduced deterministically
  // on repeated fresh loads of `/delivery/learning`: `window.scrollY`
  // landed exactly at `document.documentElement.scrollHeight - innerHeight`
  // every time, i.e. the page opened already scrolled to its absolute
  // bottom, hiding the "Learning" heading and every card above the
  // Certificate entirely with zero user action — the same class of bug
  // Round 18 already found and fixed once on this exact page (via the
  // now-removed `autoCenterCurrent` opt-out), just reintroduced through a
  // different code path once that page became this file's only caller.
  // Fixed by computing the horizontal center offset directly and setting
  // `scrollLeft` on this row's own container — matching this codebase's
  // established fix for the identical class of leak (Round 17.1's own
  // manual, container-scoped `scrollTo` delta calculation) — which cannot
  // touch the page's vertical scroll position at all, by construction.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const target =
      (el.querySelector('[data-current="true"]') as HTMLElement | null) ??
      (el.firstElementChild as HTMLElement | null)
    // Phase 3 (Round 19 design critique) fix — the previous "centered"
    // formula (`target.offsetLeft - (clientWidth - target.offsetWidth) / 2`)
    // computes an offset that essentially never lands on a real snap point:
    // this row is `snap-x snap-mandatory`, so the browser immediately
    // re-snaps any settled scroll position to whichever card's own
    // `snap-start` offset is *nearest* to the requested value — not
    // necessarily the target card's. For the live Foundational tier (module
    // 1 completed, module 2 current, cards at offsetLeft 4/280/556/832), the
    // computed "center" for module 2 works out to ~56px — measurably closer
    // to module 1's own snap point (4) than to module 2's (280) — so the row
    // silently re-snapped back to module 1 on every fresh load, exactly
    // undoing the "bring the current module into view" behavior this effect
    // exists for (per the comment above, "most load-bearing on mobile,"
    // reproduced live). Fixed the same way `goToPage()` below already
    // handles this correctly: scroll straight to the target's own real
    // `offsetLeft`, so the assignment always lands on a valid snap point and
    // actually sticks. The current card now lands as the first fully visible
    // card rather than visually centered — a real trade-off, but a reliably
    // correct one instead of a centering calculation scroll-snap silently
    // discards.
    if (target) {
      // This row also carries `scroll-smooth` (`scroll-behavior: smooth`)
      // for the chevron/dot-driven `scrollBy`/`scrollTo` calls below, which
      // explicitly want an animated scroll. That same CSS property also
      // governs a *direct* `el.scrollLeft = x` assignment, not just the
      // `scrollTo`/`scrollBy` methods — confirmed live via instrumented
      // logging: this line was silently animating instead of jumping, so the
      // `updateEdges()` call right after it was reading `scrollLeft`
      // mid-animation rather than at its real settled value (e.g. reading
      // back the pre-scroll `4px` while the animation went on to settle
      // several frames later at a different value — on a real load, `204px`,
      // itself the *clamped* max scroll extent, `scrollWidth - clientWidth`,
      // since `target.offsetLeft` here, `280px`, was further right than this
      // row can actually scroll with only 4 cards). That clamping itself is
      // fine — a current module deep enough in a short row simply can't
      // always land as the fully left-most card, a real physical limit, not
      // a bug — but reading a stale, pre-settled value fed `canScrollRight`/
      // `hasOverflow`/the active dot with wrong numbers for a frame. Forcing
      // `auto` (instant) for this one mount-time jump makes the write and
      // the very next `updateEdges()` read land in the same tick, always in
      // sync with whatever the browser actually settles on (clamped or not).
      // Same class of fix as `goToPage`'s snap-point correction just above,
      // one layer deeper (the write's *timing*, not just the value it
      // writes).
      const previousBehavior = el.style.scrollBehavior
      el.style.scrollBehavior = 'auto'
      el.scrollLeft = target.offsetLeft
      el.style.scrollBehavior = previousBehavior
    }
    updateEdges()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, [])

  // Scrolls by a full *page* (`visibleCount` cards' worth of width), not a
  // single card — see this component's own doc comment above for why
  // chevrons moved in step with the dots' own page-sized jumps. Reads the
  // row's real `gap-5` live via `getComputedStyle` rather than the flat `16`
  // this used to hardcode (a stale leftover from this row's original
  // `gap-4`/16px spacing, never updated when the row was bumped to `gap-5`/
  // 20px — caught while rewriting this function for paging, fixed here
  // rather than left as a second latent bug alongside the one this pass
  // exists to fix).
  function scrollByPage(direction: 1 | -1) {
    const el = scrollRef.current
    if (!el) return
    hasInteractedRef.current = true
    const firstCard = el.firstElementChild as HTMLElement | null
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0
    const step = (firstCard?.offsetWidth ?? 200) + gap
    el.scrollBy({ left: direction * step * visibleCount, behavior: 'smooth' })
  }

  // Jumps to page `p`'s first card — `p * visibleCount`, clamped to the last
  // real card index so a short final page (e.g. Sleep's 7 cards over pages
  // of 4/3) never reads past the end of the row.
  function goToPage(p: number) {
    const el = scrollRef.current
    const index = Math.min(p * visibleCount, itemCount - 1)
    const target = el?.children[index] as HTMLElement | undefined
    if (!el || !target) return
    hasInteractedRef.current = true
    el.scrollTo({ left: target.offsetLeft, behavior: 'smooth' })
  }

  // Round 19 accessibility review — both chevrons conditionally unmount
  // outright on `canScrollLeft`/`canScrollRight` (kept that way rather than
  // switched to an always-mounted `aria-disabled` pattern, since the left
  // chevron's whole `hasInteractedRef` mechanism above exists specifically
  // to keep it *hidden*, not just inert, until a coach has actually
  // scrolled — a considered UX choice this fix shouldn't undo).
  // That unmount is also the exact boundary a coach reaches by using either
  // chevron as designed (clicking "next" until the row is fully scrolled,
  // or "previous" back to the start): the browser fires a synchronous
  // `blur` on a focused element the instant it's removed from the DOM, with
  // no redirect target of its own, dropping keyboard focus to `<body>` —
  // the same "unmount steals focus" bug class this app's own reviews have
  // already found and fixed multiple times elsewhere (`ConfirmDialog.tsx`'s
  // chassis-level fix, `NotificationHub.tsx`'s dismiss-button unmount).
  // Fixed generically: on blur, if `relatedTarget` is `null` (the real
  // signature of "focus went nowhere," not a normal Tab-driven blur, which
  // always carries a `relatedTarget`), redirect to the sibling chevron if
  // it's still mounted, else this row's own scroll container (`tabIndex=-1`
  // below makes it a valid, if silent, landing spot) — deferred one frame so
  // it runs after the triggering unmount has actually committed.
  //
  // Round 19.1 accessibility review — this single-`requestAnimationFrame`
  // check is a genuine, live-confirmed race, not a hypothetical: a real
  // trusted mouse click on this chevron at its scroll boundary reproducibly
  // dropped focus to `<body>` with **zero** `focusout` event ever firing
  // (confirmed via a `document`-level capture-phase listener — an identical
  // unmount-while-focused case elsewhere in this app, `NotificationHub.tsx`'s
  // dismiss button, DOES fire `focusout` reliably under the same test
  // harness, ruling out a browser/tooling limitation as the cause). Repeated
  // trials of the *identical* real click showed this redirect succeeding
  // roughly as often as it failed — a real timing race against this row's
  // still-animating `scroll-behavior: smooth` scroll, which keeps firing
  // `onScroll`→`updateEdges` (and therefore re-rendering `canScrollLeft`/
  // `canScrollRight`) for some time after the click, not just once. A single
  // RAF only gets one look at `document.activeElement` — if a further
  // re-render lands in between, or the unmount itself hasn't fully committed
  // by that one frame, the check silently misses and focus is stranded on
  // `<body>` with no second chance. Hardened to retry across a short window
  // of frames (not just one) rather than a single roll of the dice, so a
  // later frame catches the redirect even when the first one's timing loses
  // the race; stops once it either succeeds or a small frame budget is
  // spent, so it never loops indefinitely if focus has legitimately moved
  // elsewhere (a real Tab press, e.g.) in the meantime.
  function handleChevronBlur(e: FocusEvent<HTMLButtonElement>, fallback: RefObject<HTMLButtonElement | null>) {
    if (e.relatedTarget) return
    let framesLeft = 8
    const tryRefocus = () => {
      if (document.activeElement !== document.body) return
      const target = fallback.current ?? scrollRef.current
      target?.focus()
      framesLeft -= 1
      if (framesLeft > 0 && document.activeElement === document.body) {
        requestAnimationFrame(tryRefocus)
      }
    }
    requestAnimationFrame(tryRefocus)
  }

  // Real page count, derived from the measured `visibleCount` — see this
  // component's own doc comment for why dots (and now chevrons) paginate by
  // page, not by card. `activePage` itself is real state, computed inside
  // `updateEdges` (see that state's own comment for why it isn't derived
  // here at render time).
  const pageCount = Math.max(1, Math.ceil(itemCount / visibleCount))

  return (
    <div className="min-w-0">
      <div className="relative min-w-0">
        {/* "Learning path" motif (direct instruction) — a single thin
         *  dashed line behind the row, evoking a path the coach progresses
         *  along, without the numbered-circle/connector-rail treatments
         *  already rejected elsewhere in this file (see the `STANDING
         *  RULE` comment below) — this is a row-level background motif, not
         *  a per-card marker. `z-0` + the scroll track's own `relative z-10`
         *  keeps it strictly behind every card (only visible in the gaps
         *  between them); `border-ink-faint` measures 4.45:1 against this
         *  canvas's `bg-muted` (#f0f0f0 on #f0f0f0 would be the same
         *  invisible-dot bug fixed elsewhere in this file), clearing the
         *  WCAG 3:1 non-text-contrast minimum with real margin. `aria-
         *  hidden` — purely decorative, carries no information a screen
         *  reader needs. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-1 top-1/2 z-0 -translate-y-1/2 border-t border-dashed border-ink-faint" />
        <div
          ref={scrollRef}
          // `tabIndex={-1}` — not part of the normal Tab order, but a valid
          // programmatic-focus landing spot for `handleChevronBlur`'s
          // fallback when a chevron unmounts out from under focus and its
          // sibling chevron isn't mounted either (e.g. a tier with overflow
          // in only one direction).
          tabIndex={-1}
          onScroll={updateEdges}
          // Native drag/scroll gestures — as distinct from the mount-time
          // effect's own programmatic `scrollLeft` assignment above, which
          // dispatches a `scroll` event too but never a `wheel`/`touchstart`/
          // `pointerdown` — flip `hasInteractedRef` so the left chevron's
          // gating (see that ref's own comment) starts responding immediately
          // once a coach actually touches the row, not just via the
          // chevron/dot buttons' own explicit flag.
          onWheel={markInteracted}
          onTouchStart={markInteracted}
          onPointerDown={markInteracted}
          // `items-center`, not this flex row's default `items-stretch` —
          // measured live via `getBoundingClientRect()` across every tier:
          // with `items-stretch`, every card in a row silently stretches to
          // match its *tallest* sibling, so a card's rendered height
          // depended on whether its own row happened to contain the one
          // enlarged "current" card — accidental, content-driven sizing,
          // not a deliberate one. That size difference is gone now (a
          // later, direct "make the current card match the others" pass
          // removed it — see `TimelineModuleCard`'s own doc comment), so
          // every card in every row renders the same fixed height today
          // (cover + `h-[58px]` title block + button) and `items-stretch`
          // would produce an identical result to `items-center` in
          // practice. Left as `items-center` anyway rather than reverted:
          // it's still the correct choice if a future card ever needs
          // taller content again, and there's no cost to keeping it.
          //
          // `gap-5` (20px) — a modest bump from the original `gap-4` (16px)
          // per direct instruction, not a drastic change; `relative z-10`
          // keeps this track (and every card in it) painting above the
          // "learning path" line positioned behind it.
          className="relative z-10 flex w-full min-w-0 snap-x snap-mandatory items-center gap-5 overflow-x-auto scroll-smooth p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
        {canScrollLeft && (
          <button
            type="button"
            ref={handleLeftChevronNode}
            onClick={() => scrollByPage(-1)}
            onBlur={(e) => handleChevronBlur(e, rightChevronRef)}
            aria-label="Scroll to previous page of modules"
            // Solid black pill + white icon — this app's own established
            // guaranteed-contrast-over-any-card-content pattern (same
            // reasoning as `TimelineModuleCard`'s "Approx. N min" chip and
            // `ModuleBadge`'s pill, both `bg-black`/`text-white`), swapped in
            // after the previous `bg-card`/`text-ink` chevrons read as too
            // subtle against the white cards they sit beside. `hover:bg-black/80`
            // is a one-off dark-hover value (no existing dark/black hover
            // token in design-tokens.md to reuse) rather than this app's
            // usual `bg-X hover:bg-X-hover` named pair. `size-9` (36px) hit
            // target kept as-is — already this app's established control-
            // height convention.
            className="absolute top-1/2 left-1 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black shadow-card outline-none hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-ring md:flex"
          >
            <ChevronLeft aria-hidden="true" className="size-5 text-white" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            ref={handleRightChevronNode}
            onClick={() => scrollByPage(1)}
            onBlur={(e) => handleChevronBlur(e, leftChevronRef)}
            aria-label="Scroll to next page of modules"
            className="absolute top-1/2 right-1 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black shadow-card outline-none hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-ring md:flex"
          >
            <ChevronRight aria-hidden="true" className="size-5 text-white" />
          </button>
        )}
      </div>
      {hasOverflow && pageCount > 1 && (
        // Inactive dots were `bg-divider-soft` (#f0f0f0) sitting directly on
        // this canvas's own `bg-muted` (also #f0f0f0, design-tokens.md §1) —
        // a measured 1.00:1 contrast ratio, i.e. genuinely invisible, not
        // just "light." `ink-faint` (#6d6d6d) measures 4.45:1 against
        // `bg-muted` — reuses this app's existing muted-metadata token
        // rather than inventing a new one, and clears the WCAG 2.2 AA 3:1
        // non-text-contrast minimum with real margin. Re-checked after this
        // canvas gained its own per-tier `bg-tier-foundational`/`-sleep`
        // tints (both lighter than `bg-muted`): `ink-faint` measures 4.66:1
        // / 4.84:1 against them, still comfortably clearing the 3:1 floor —
        // this token choice holds on every background this canvas can now
        // render, not just the original grey. Each dot's own hit
        // target is a fixed 24px (`min-h-6 min-w-6`) box around a 6px
        // visual dot, matching WCAG 2.2 AA 2.5.8's 24px floor exactly — the
        // *visible* dot stays small, only the clickable area grows,
        // decoupling "how big it looks" from "how big you can click it."
        //
        // One dot per real *page* now (`pageCount`), not one per card
        // (`itemCount`) — see this component's own doc comment above for
        // the full rationale/bug this replaces. `activePage` is tracked as
        // its own dedicated state (see that state's declaration above),
        // computed inside `updateEdges` against each page's real target
        // scroll position — deliberately not derived from card-granular
        // proximity at render time, since that approach broke on a short
        // trailing page (see `activePage`'s own comment for the concrete
        // repro this replaces).
        <div role="group" aria-label="Module pagination" className="mt-3 flex items-center justify-center gap-0.5">
          {Array.from({ length: pageCount }).map((_, p) => (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              aria-label={`Go to page ${p + 1} of ${pageCount}`}
              aria-current={p === activePage}
              className="flex min-h-6 min-w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  p === activePage ? 'w-5 bg-primary' : 'w-1.5 bg-ink-faint hover:bg-primary',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * One curriculum tier's grey "canvas" — a flat, unbordered, shadowless
 * surface (`bg-muted`, distinct from the page's own slightly lighter
 * `bg-background`) grouping that tier's module cards. Previously held a
 * full vertical stack of large cards, one per row; now holds a single
 * `ModuleScrollRow` of compact carousel tiles (see `TimelineModuleCard`'s
 * doc comment), so the canvas's own padding shrinks to match a one-row
 * layout instead of a tall stack — no numbered circles, no connecting line,
 * no marker-level complete/current/upcoming colour state (a separate,
 * earlier removal had already dropped that same marker rail's three
 * Baseline/Midline/Endline Reflection milestone cards in favour of a
 * dedicated "AI reflection" column elsewhere on the page — see
 * `AiReflectionPanel.tsx`).
 *
 * `displayNumber` on each card is *local* to this tier (1, 2, 3… within just
 * this group) rather than the module's real position in the full
 * curriculum, matching the curriculum overview doc's own per-tier numbering
 * — the card's lock/complete/current state still reads off the module's
 * real global index in `PATHWAY_MODULES`, passed through separately. The
 * forced-linear order guarantees at most one module per whole curriculum is
 * ever "current", so within any one tier's row that's either exactly one
 * card, or none at all — every card renders the identical compact size
 * regardless (see `TimelineModuleCard`'s own doc comment), so this state
 * only ever changes a card's badge/status chip/CTA, never its footprint.
 *
 * `w-full min-w-0 overflow-hidden` on this root is a second, explicit
 * containment boundary on top of `ModuleTimeline`'s own `min-w-0` fix —
 * belt-and-braces, not redundant: this div sits between that grid-item fix
 * and `ModuleScrollRow`'s actual `overflow-x-auto` scroller, and a real bug
 * was caught live where the canvas itself (not just the page) could still
 * stretch wider than its column and carry the scroll row's full unscrolled
 * width with it. `overflow-hidden` here is a hard backstop: even if some
 * future edit reintroduces a min-content leak lower in the tree, this
 * canvas physically cannot render wider than the width it's given.
 */
// Per-tier canvas background, direct instruction ("blue for foundational,
// green for sleep modules") — see `--color-tier-foundational`/`-sleep` in
// `index.css` for the token rationale/contrast math. Keyed off `group.key`
// rather than array position so a future reordering of `MODULE_GROUPS`
// can't silently swap which tier gets which color; any group without a
// listed key (none exist today, but `Practice`/`Certificate` never pass
// through this component at all) falls back to the original flat
// `bg-muted`, never an unstyled gap.
/**
 * Round 29, direct instruction: the carousel canvases are `purple-50` for
 * Foundational and `yellow-50` for Sleep, matching each tier's own letter
 * badge. This retires `--color-tier-foundational`/`--color-tier-sleep`, a
 * blue/green categorical pair predating the brand ramps — both tiers now sit
 * on the app's real palette.
 */
const TIER_BACKGROUND: Record<string, string> = {
  foundational: 'bg-purple-50',
  sleep: 'bg-yellow-50',
}

// Sleep's subtitle used to be forced into a 2-line break at its own first
// sentence boundary (via a `FORCE_TWO_LINE_SUBTITLE` lookup + a
// `splitAtFirstSentence()` helper, both removed here) — that copy was
// genuinely 2 sentences ("Core curriculum... The chapter structure...").
// The rewritten copy (see `trainingPathwayV2.ts`'s own comment on this
// tier's `subtitle`, done via a real `/design:ux-copy` pass after direct
// feedback that the old copy exposed internal chapter-naming jargon) is one
// natural sentence with nothing to break at — forcing the old split point
// onto new copy that no longer has two sentences would either produce an
// empty second line or require guessing a new, arbitrary break point for
// copy that reads fine as a single line. Removed the whole mechanism rather
// than leave it in place unused: Sleep's subtitle now renders through the
// exact same plain single-string path Foundational's always has.

function ModuleGroupCanvas({
  group,
  sequenceNumber,
}: {
  group: (typeof MODULE_GROUPS)[number]
  /** This tier's position among the 3 sequential curriculum blocks
   *  (Foundational/Sleep/Practice) — see `SequenceMarker`'s own doc comment
   *  for why Certificate doesn't get one and why this isn't `ModuleBadge`
   *  reused. Passed in by `ModuleTimeline` (`MODULE_GROUPS`' own array
   *  index + 1) rather than derived from `group.key` here, since this
   *  component has no independent way to know "block 1 of 3" from a single
   *  group object alone. */
  sequenceNumber: number
}) {
  const modules = group.moduleIds
    .map((id) => PATHWAY_MODULES.find((m) => m.id === id))
    .filter((m): m is TrainingModuleV2 => m !== undefined)

  const completed = modules.filter(
    (m) => timelineRowState(PATHWAY_MODULES.indexOf(m), m) === 'completed',
  ).length

  // Gating label beside the tier title (Round 29). Derived from the same
  // `firstIncompleteIndex` the module cards' own lock state comes from, so the
  // two can never disagree — the failure mode this project keeps hitting is a
  // label asserting something the rows beneath it contradict.
  const indices = modules.map((m) => PATHWAY_MODULES.indexOf(m))
  const firstIndex = Math.min(...indices)
  const lastIndex = Math.max(...indices)
  const tierLabel: { tone: 'next' | 'muted'; label: string } | null = isCertified
    ? null
    : firstIncompleteIndex >= firstIndex && firstIncompleteIndex <= lastIndex
      ? { tone: 'next', label: 'You start here' }
      : firstIncompleteIndex < firstIndex
        ? {
            tone: 'muted',
            label: `Locked, complete Part ${SEQUENCE_LETTERS[sequenceNumber - 2] ?? 'A'} first`,
          }
        : null

  return (
    // Round 29 (frame `413:2006`): the tier header sits *outside* the tinted
    // canvas, on the page, with only the carousel inside it — 24px between the
    // two, per the frame's own 57px header / 81px canvas offsets.
    <div className="w-full min-w-0">
      {/* Marker-above-everything (direct instruction, supersedes the
       *  previous "marker beside a title+subtitle column" row arrangement
       *  above): number on its own line at the top, title below it, subtitle
       *  below that — a plain vertical stack, all left-aligned. `gap-3`
       *  (12px) between the marker and the title+count row below it, same
       *  12px rhythm as `space-y-3` between that row and the subtitle —
       *  one consistent spacing value at every level of the stack rather
       *  than a tighter value for one gap and a looser one for the other,
       *  per direct feedback that the previous inline layout read as
       *  cramped.
       *
       *  **Count placement, a real judgment call:** with the marker now
       *  occupying its own row above a now-much-taller left column, keeping
       *  `justify-between` on one wide row (count floating at the very top,
       *  beside the marker) would leave it visually stranded above the
       *  title/subtitle it actually describes. Vertically centering it
       *  against the whole 3-row stack was the other option offered, but
       *  that risks it landing beside an arbitrary middle line (the
       *  subtitle, on Sleep's now-2-line version) with no clear reason why.
       *  Landed instead on keeping the count paired with the *title*
       *  specifically, on the title's own row (`flex items-baseline
       *  justify-between`) — it was always answering "how many of *this
       *  named tier* are done," a fact tied to the tier's name (the title),
       *  not to its sequence position (the marker) or its description (the
       *  subtitle). This reads as the row it's always semantically
       *  belonged with, not a new placement invented for this pass. */}
      {/* Round 29 (frame `413:2007`) replaces the previous marker-above-title
       *  vertical stack with a horizontal row: the tier pill on the left,
       *  vertically centred against the title+description block beside it. */}
      <div className="flex items-center gap-4">
        <SequenceMarker number={sequenceNumber} tierKey={group.key} />
        {/* Subtitle bumped `text-caption` (14px) → `text-body` (17px), and
         *  the gap below the title tightened `space-y-3` (12px) →
         *  `space-y-1.5` (6px) — direct feedback that the subtitle read too
         *  small and sat too far from the title it belongs with. Verified
         *  live rather than applied blindly: at `text-body`, the subtitle
         *  doesn't overpower the `text-title` (21px) heading above it —
         *  still clearly secondary — and `space-y-1.5` reads as "belongs
         *  with this title," not cramped, once seen next to the marker's
         *  own `gap-3` above it (the marker-to-title gap deliberately
         *  stayed wider — that's a break between two different elements,
         *  not a heading and its own caption). Both values apply through
         *  the shared `ModuleGroupCanvas` component, so this covers
         *  Foundational and Sleep identically; no per-tier scoping needed
         *  or wanted here. */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="font-display text-title">{group.title}</h2>
              {/* Round 29, direct instruction: a gating label beside each tier
               *  title. Derived, never hardcoded — `firstIncompleteIndex` is
               *  the one source of truth for forced-linear lock state, so the
               *  label cannot contradict the module cards below it. The tier
               *  holding the current module says "You start here"; a tier whose
               *  predecessor is unfinished says so and names it. A tier that is
               *  simply done gets no label — a finished tier needs no
               *  instruction. */}
              {tierLabel && <Chip tone={tierLabel.tone} label={tierLabel.label} />}
            </div>
            {/* Was a bare "{completed}/{modules.length}" — direct feedback: "1/4
             *  of what?" This sits in a tier header right above a horizontal
             *  carousel with its own dot pagination below, so an unlabeled
             *  fraction reads as a page count, not a completion count.
             *  "complete" is the shortest word that disambiguates without
             *  repeating the heavier "X/Y modules complete" phrasing
             *  `LearningProgressCard`/`CertificateCard` use in a standalone
             *  card — this is a small header-corner annotation, not a
             *  headline.
             *
             *  Also `text-ink-muted`, not this file's usual `text-ink-faint`
             *  for small metadata: computed live against the new per-tier
             *  tints below, `ink-faint` cleared AA but only barely (4.66:1 on
             *  `tier-foundational`, 4.84:1 on `tier-sleep` — not far above
             *  the 4.45:1 that already failed once elsewhere in this file on
             *  flat `bg-muted`). `ink-muted` measures 11.6:1 / 12.07:1 on the
             *  same two backgrounds — real margin, not a technicality.
             *
             *  `font-semibold` added per direct feedback that this read too
             *  light/thin sitting on the same row as the bold title —
             *  `text-caption` alone renders at its default 14px/400. This
             *  app has no separate `text-caption-strong` utility for the
             *  bolder 14px/600 pairing design-tokens.md documents (side-nav
             *  section labels, badge text); the real convention everywhere
             *  else it's needed (`AddCoachTraineeModal.tsx`,
             *  `PlanSessionsModal.tsx`) is just `text-caption` +
             *  `font-semibold` combined directly — matched here rather than
             *  inventing a new weight value. */}
            <span className="shrink-0 text-caption font-semibold text-ink-muted">
              {completed}/{modules.length} complete
            </span>
          </div>
          {group.subtitle && <p className="text-body text-ink-muted">{group.subtitle}</p>}
        </div>
      </div>

      {/* `mt-4` (16px) → `mt-6` (24px), per direct feedback that the whole
       *  header text block (marker/title/subtitle) sat too close to the
       *  module card row below it — a separate gap from the title-to-
       *  subtitle spacing just above, which was deliberately tightened in
       *  an earlier pass and stays untouched; that one is a heading-to-its-
       *  own-caption relationship, this one is a break between two
       *  genuinely different sections (header text vs. the card carousel).
       *  Verified live, not picked on paper: 24px reads as clear
       *  separation without over-spacing the card, matching this file's own
       *  usual block-separation rhythm elsewhere (e.g. `ModuleTimeline`'s
       *  own top-level `gap-8` between whole tiers). Applies through this
       *  shared component, confirmed identical (24px) on both Foundational
       *  and Sleep via computed geometry. */}
      <div
        className={cn(
          'mt-6 min-w-0 overflow-hidden rounded-lg p-4 md:p-6',
          TIER_BACKGROUND[group.key] ?? 'bg-muted',
        )}
      >
        <ModuleScrollRow itemCount={modules.length}>
          {modules.map((m, i) => (
            <TimelineModuleCard
              key={m.id}
              module={m}
              index={PATHWAY_MODULES.indexOf(m)}
              displayNumber={i + 1}
            />
          ))}
        </ModuleScrollRow>
      </div>
    </div>
  )
}

/**
 * The home-timeline's module list — two grey `ModuleGroupCanvas` sections
 * (Foundational modules / Sleep modules, per `data/trainingPathwayV2.ts`'s
 * `MODULE_GROUPS`), then the standalone `PracticeModuleCard` (its tier only
 * ever holds one module, so no canvas/carousel wrapper) and `CertificateCard`
 * — neither of which is a multi-module curriculum tier, so both stay outside
 * any canvas.
 *
 * Its one caller today is the Coach Delivery Portal's Learning tab
 * (`DeliveryLearningHomePage.tsx`), which places this component in the left
 * cell of a 2-column grid beside a sibling "AI reflection" `Card` with no
 * top margin of its own. The root `<div>` here previously carried a leftover
 * `mt-8` from an earlier, single-column page layout this component used to
 * own outright — with no equivalent offset on the sibling card, it pushed
 * this whole column ~32px below the AI reflection card's top edge instead of
 * the two sharing a flush top edge. Removed; any vertical spacing this
 * component needs from a page-level hero now belongs to the caller, not
 * baked in here.
 *
 * `min-w-0` here is load-bearing, not decorative: this component is a
 * direct grid item in the caller's `grid-cols-[1fr_324px]` (narrowed twice
 * from an original `400px`, per that file's own comment — this comment's
 * number is kept in sync with the live value, not a historical snapshot),
 * and a grid
 * track's default `auto` minimum is the largest min-content contribution
 * among its items — which, for a flex/grid item, bubbles up from descendant
 * content unless explicitly overridden. Each tier's `ModuleScrollRow` holds
 * several `shrink-0` cards wanting real width; without this, the browser
 * was sizing the whole `1fr` track (and the page itself) to fit that
 * un-scrolled total width instead of letting the row's own `overflow-x-auto`
 * absorb it — caught live via a real horizontal page scrollbar that pushed
 * the sibling "AI reflection" card off the visible viewport entirely.
 */
/**
 * Round 29 (Figma `410:1507`) — the "My modules" tab of My Training.
 *
 * `PracticeModuleCard` is gone entirely: direct instruction, "there is no more
 * any practice module". `CertificateCard` is no longer rendered here either —
 * Certification is now its own tab on that page, and the frame's My modules tab
 * draws only the two tier canvases. It stays exported rather than deleted
 * because that tab's frame is still to come; delete it if that changes.
 */
export function ModuleTimeline() {
  return (
    // 64px between tiers: frame `410:1603` runs tier A to y=450 and starts
    // tier B at y=514.
    <div className="flex min-w-0 flex-col gap-16">
      {MODULE_GROUPS.map((group, i) => (
        <ModuleGroupCanvas key={group.key} group={group} sequenceNumber={i + 1} />
      ))}
    </div>
  )
}
