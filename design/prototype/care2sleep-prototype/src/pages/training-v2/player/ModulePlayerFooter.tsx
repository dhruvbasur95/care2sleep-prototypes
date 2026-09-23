import { ChevronLeft, ChevronRight, House } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GateReason } from './slideGate'

/** What a slide reports up to `ModulePlayerPage` about its own Continue
 *  readiness — see `ModulePlayerFooter`'s doc comment below for the full
 *  contract. `label` is optional; omitting it leaves the footer's default
 *  ("Continue") in place. */
export interface FooterReadyState {
  canContinue: boolean
  label?: string
  /** Why Continue is locked, when it is — surfaced as a visible line beside the
   *  button, not only to a screen reader. See `LOCKED_COPY` below. */
  lockedReason?: GateReason
}

/** Only ever wired into the current (bottom-most) visited slide — see
 *  `ModulePlayerPage.tsx`. Optional so every screen's props can default it
 *  to a no-op when rendered as an already-completed, non-current slide. */
export type OnReadyChange = (state: FooterReadyState) => void

/**
 * `ModulePlayerFooter` — the module player's one global Continue control
 * (design-tokens.md §30, Round 7.1.2). A normal (non-scrolling) block
 * pinned to the bottom of the player shell's fixed-height flex column
 * (`ModulePlayerPage.tsx`'s `h-screen` layout, §31) — only the slide stack
 * itself scrolls, so this bar is always on screen without needing
 * `position: fixed`/`sticky` or any measured-height offset math.
 *
 * ## Governs outer step advancement only
 * This button always means "advance to the next step in the module's own
 * step machine" (`ModulePlayerPage.tsx`'s `steps`/`stepIndex`) — nothing
 * else. A slide can still have its own *local* sub-navigation that has
 * nothing to do with this footer: knowledge-check's "Next question" moves
 * between 5 questions that are all one single step; a case example's "What
 * would you do?" only reveals content in place. Those stay as ordinary
 * buttons rendered by the slide itself. Only the actual "I'm done with
 * this step" action is ever represented here.
 *
 * ## How a slide drives it
 * `ModulePlayerPage.tsx` renders exactly one `ModulePlayerFooter`, and
 * wires `onReadyChange` into only the current (bottom-most, active) slide
 * — never into already-completed ones stacked above it. A slide reports
 * its own continue-readiness once, on mount, and again any time it changes
 * (e.g. a video finishing, a question being answered):
 *
 * ```tsx
 * useEffect(() => {
 *   onReadyChange?.({ canContinue: watched, label: 'Continue' })
 * }, [watched, onReadyChange])
 * ```
 *
 * `label` lets a slide override the default "Continue" text (e.g. a
 * chapter marker's "Start chapter 2", the module outro's "Complete
 * module") without the footer needing to know why.
 */
/**
 * What the coach is told when Next is locked.
 *
 * **Visible, not `sr-only`.** The footer already carried an `sr-only`
 * "(complete this step to continue)", which leaves a sighted coach with a dead
 * button and nothing on screen explaining it. This portal's audience is
 * explicitly not a digitally literate one, so an unexplained disabled control
 * is a dead end rather than a nudge.
 *
 * Phrased as the action that unlocks it, in the second person, with no jargon
 * and no contraction — the same register as the stage banners and the tour.
 */
/**
 * ⚠️ **Hidden for now** (direct instruction, 2026-09-18: *"remove that tagline
 * scroll towards the end... hide it for now"*).
 *
 * The line still renders to assistive tech through the button's own `sr-only`
 * cue below — a disabled control with no stated reason is a WCAG problem as
 * well as a usability one, and that half was never the thing objected to. Only
 * the visible line under the pills is suppressed, by this one flag, so turning
 * it back on is a single character.
 *
 * Worth knowing before it stays off permanently: this portal's audience is
 * explicitly not digitally literate, and a dead Next button with nothing on
 * screen explaining it is the case the line was written for. If it is not
 * coming back, the gate probably wants some other visible signal — the
 * `ScrollCue` already covers the scroll half, so it is the interaction half
 * that is currently silent.
 */
const SHOW_LOCKED_REASON = false

const LOCKED_COPY: Record<Exclude<GateReason, null>, string> = {
  scroll: 'Scroll to the end of this slide to continue',
  interaction: 'Complete the activity on this slide to continue',
}

export function ModulePlayerFooter({
  label,
  disabled,
  lockedReason = null,
  onClick,
  onPrevious,
  onExit,
  railWidth,
}: {
  label: string
  disabled: boolean
  /** Which gate is outstanding, for the visible hint. `null` when Next is
   *  live, or on a step with no gate. */
  lockedReason?: GateReason
  onClick: () => void
  /** Step back one slide. Absent on the module's first step. */
  onPrevious?: () => void
  onExit: () => void
  /** The outline rail's current width. The slide pair is centred on the
   *  content column, not on the bar, so it has to be offset by the rail —
   *  and the rail collapses, which a fixed offset silently got wrong. */
  railWidth: number
}) {
  return (
    // Frame `519:10494`: an 84px `purple-50` band, `px-24 py-20`. Go Back Home
    // sits in a 330px block — the outline card's own width — so the slide pair
    // beside it centres over the content column rather than the whole bar. It
    // replaces the player's old centred Continue button *and* the exit control
    // the top progress bar used to carry, which the frame no longer draws.
    //
    // The three pills use this app's canonical button styles rather than the
    // frame's own chrome (16/600 labels, a 2px outline): `caption-medium` has
    // been the app-wide button step since Round 28, and the outline pill is
    // 1px everywhere else. Widths, heights, order and icons are the frame's.
    // `lg:gap-0` because from `lg` up the spacer below already carries the
    // whole gutter; a flex gap on top of it pushed the pair 32px right of the
    // content column's centre.
    <div className="relative flex shrink-0 items-center justify-between gap-8 bg-purple-50 px-6 py-5 lg:gap-0">
      {/* Absolutely placed from `lg` up so its own width can never shift the
          slide pair off the content column's centre line — the pair is offset
          by the rail instead, below. In flow at narrower widths, where the
          rail is hidden and the bar is just these two groups. */}
      <div className="lg:absolute lg:top-1/2 lg:left-6 lg:-translate-y-1/2">
        <button
          type="button"
          onClick={onExit}
          // Hover fills with `primary` and takes the label *and* the icon white
          // (the glyph is `currentColor`, so it follows the text).
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary bg-card px-6 text-caption-medium text-primary outline-none transition-colors hover:bg-primary hover:text-white focus-visible:ring-2 focus-visible:ring-ring"
        >
          <House aria-hidden="true" className="size-6" />
          Go Back Home
        </button>
      </div>

      {/* Rail + the row's own 32px gutter. Reserving it here means the pair
          beside it centres in exactly the content column's span, at either
          rail width. Hidden below `lg`, where there is no rail. */}
      <div aria-hidden="true" className="hidden shrink-0 lg:block" style={{ width: railWidth + 32 }} />

      <div className="flex min-w-0 flex-1 items-center justify-center gap-6 px-4">
        {/* The chevrons are inset absolutely and the label centres on its own.
         *  Laid out in flow with a gap, the *pair* centres, which reads as a
         *  label pushed off-centre by however wide the icon happens to be. */}
        <button
          type="button"
          aria-disabled={!onPrevious}
          onClick={onPrevious}
          className={cn(
            'relative inline-flex h-11 w-[272px] items-center justify-center rounded-full border text-caption-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring',
            onPrevious
              ? 'border-primary text-primary hover:bg-primary/5 active:scale-[0.98]'
              // A disabled pill still has to be readable: `primary/40` on this
              // band measured 1.98:1 and `ink-faint` 4.25:1; `ink-muted` is
              // 10.38:1 on the same fill.
              : 'cursor-not-allowed border-transparent bg-purple-200/40 text-ink-muted',
          )}
        >
          <ChevronLeft aria-hidden="true" className="absolute left-4 size-4" />
          Previous slide
          {!onPrevious && <span className="sr-only"> (this is the first slide)</span>}
        </button>

        <button
          type="button"
          aria-disabled={disabled}
          onClick={disabled ? undefined : onClick}
          className={cn(
            'relative inline-flex h-11 w-[272px] items-center justify-center rounded-full text-caption-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring',
            disabled
              ? 'cursor-not-allowed bg-purple-200/40 text-ink-muted'
              : 'bg-primary text-white hover:bg-primary-hover active:scale-[0.98]',
          )}
        >
          {label}
          <ChevronRight aria-hidden="true" className="absolute right-4 size-4" />
          {disabled && (
            <span className="sr-only">
              {' '}
              ({lockedReason ? LOCKED_COPY[lockedReason] : 'complete this step to continue'})
            </span>
          )}
        </button>
      </div>

      {/* The reason, under the pair it explains.
       *
       * `absolute` so it cannot change the bar's 84px height — the frame's own
       * number (`519:10494`), and a line that appeared and disappeared in flow
       * would shift every slide by ~20px as the gate opened and closed.
       *
       * `role="status"` because the text changes *without* the coach acting on
       * this control: it appears on arriving at a slide and clears when the gate
       * opens, and a screen-reader user otherwise gets no signal that Next just
       * became usable. `aria-live` is polite, so it never interrupts.
       *
       * Hidden below `lg` alongside the rail spacer's own breakpoint: at phone
       * width the two pills already collapse (a known, separate defect) and a
       * third line under them makes that worse rather than better. */}
      {SHOW_LOCKED_REASON && (
        <p
          role="status"
          className="pointer-events-none absolute inset-x-0 bottom-1 hidden text-center text-fine text-ink-muted lg:block"
        >
          {disabled && lockedReason ? LOCKED_COPY[lockedReason] : ''}
        </p>
      )}
    </div>
  )
}
