import { type ComponentType, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BlockedHint } from '@/components/consumer/BlockedHint'
import { cn } from '@/lib/utils'

/**
 * The Consumer Portal's Go back / Go next flow footer, and the pill geometry
 * and page gutter that go with it.
 *
 * Extracted from `ConsumerModulePage` at its second caller (Round 48, direct
 * instruction: "re-use the go back and continue/next footer component as used
 * in consumer module footer … apply exact same to sleep diary pages also just
 * inner ones"). The sleep diary's question steps had grown their own Back/Next
 * row — same job, different geometry (`rounded-3xl` against `rounded-[28px]`, a
 * 2px outline against 1px, no chevrons, no bar, no blocked-state affordance) —
 * which is exactly the two-surfaces-drift this project keeps extracting shared
 * components to end. One footer, two flows.
 *
 * Everything below is the module page's own code moved verbatim; the only
 * additions are `backBlockedReason` (the diary's first question has nowhere to
 * go back to) and a default on `shown` (the diary has no direction-aware
 * chrome, so its footer is simply always in).
 */

/* ── Pill geometry ──────────────────────────────────────────────────────── */

/** The frames' pill geometry, shared by every button on these screens.
 *  48px, which is the frames' own and clears the app's 36px floor (a floor,
 *  not a cap). */
const PILL =
  'flex h-12 items-center justify-center gap-2 rounded-[28px] px-5 text-body-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2'
export const PILL_PRIMARY = `${PILL} bg-consumer-primary text-white`
export const PILL_OUTLINE = `${PILL} border border-consumer-primary bg-white text-consumer-primary`

/**
 * The page's own horizontal inset. The frames use 80px at 1281 and this portal
 * switches its layout at 1200 (`ConsumerHeader`), so the two step together
 * rather than at `md`, which would move the padding and the header's own
 * compact/wide switch at different widths.
 */
export const GUTTER = 'px-6 min-[1200px]:px-20'

/**
 * A flow page opts out of the shell's `max-w-[1320px]` cap
 * (`contentFullBleed`), because the photo band, the yellow bar and this footer
 * are all full-bleed in the frames. Everything that is NOT one of those
 * backgrounds re-applies the cap itself through this class, so the reading
 * column still stops at the same width as every other consumer page instead of
 * stretching to a 1920 window.
 */
export const SHELL = `mx-auto w-full max-w-[1320px] ${GUTTER}`

/**
 * ⚠️ The property is **`translate`, not `transform`**, and getting that wrong
 * is silent. Tailwind v4 emits `translate-y-*` as the standalone CSS
 * `translate` property — `getComputedStyle(el).transform` reads `none` on an
 * element that is visibly offset, and its `translate` carries
 * `0px calc(-100% - 96px)`. A first pass transitioned `transform`, so the class
 * toggled, the band moved to the right place, and it **teleported**: the
 * transition was declared on a property that never changed. A screenshot cannot
 * show that; only reading both properties back can.
 */
export const CHROME_TRANSITION = 'translate 220ms cubic-bezier(0.4, 0, 0.2, 1)'


/* ── Footer ─────────────────────────────────────────────────────────────── */

/** One id per control, so each button's `aria-describedby` and the line it
 *  points at cannot drift apart. The footer is only ever mounted once per
 *  page, so a module-scoped constant is safe. */
const FORWARD_REASON_ID = 'consumer-flow-footer-forward-reason'
const BACK_REASON_ID = 'consumer-flow-footer-back-reason'

/**
 * The white footer bar.
 *
 * **Not sticky to the viewport by default** — direct instruction ("dont make
 * footer sticky", for the learning screens). It was pinned first, which is what
 * frame `819:13049` looks like, but that frame is an 886px artboard clipping
 * its own carousel behind the bar rather than a design for a page that
 * genuinely scrolls: pinned, the footer permanently covered the bottom of the
 * chapter row.
 *
 * The page's own `min-h-[calc(100vh-var(--consumer-header-h))]` column still
 * pushes it to the bottom of the window when a stage is short, so a Summary,
 * Reflection or diary question screen does not leave it floating halfway up.
 *
 * On a long stage it slides in on scroll **down** and away on scroll up, where
 * the caller drives `shown` from a direction-aware hook. Its `sticky` slot is
 * the end of the content, so when the reader actually arrives there it is
 * already home rather than overlaying anything.
 */
export function ConsumerFlowFooter({
  label,
  onContinue,
  onBack,
  backLabel = 'Go back',
  backIcon: BackIcon = ChevronLeft,
  continueBlockedReason,
  backBlockedReason,
  shown = true,
}: {
  /** A node, not a string, so a caller can vary the wording by breakpoint with
   *  two CSS-hidden spans — `display: none` text is excluded from the
   *  accessible name, so the button always announces the words on screen. */
  label: ReactNode
  onContinue: () => void
  /** Frame `882:2185` adds a Go back beside Continue on the Summary screen.
   *  Optional, so a screen that genuinely has no way back can omit it. */
  onBack?: () => void
  /** Defaults to "Go back", which as of Round 48 is what BOTH flows use on
   *  every screen — the diary overrides it to its own "Back" and nothing else
   *  overrides it at all. */
  backLabel?: string
  /** The glyph in the back control. `ChevronLeft` everywhere as of Round 48:
   *  the module's welcome screen used to swap in a house (or a mortarboard)
   *  because its back control left the module rather than stepping a stage, and
   *  that was retired with the per-origin labels — "Go back" with a chevron is
   *  true of both destinations. The prop stays because it costs nothing and a
   *  future flow may genuinely need a different mark. */
  backIcon?: ComponentType<{ className?: string }>
  /** When set, the forward control is present but inert, and this sentence is
   *  shown by `BlockedHint` on hover, focus and tap **and** wired as the
   *  button's own `aria-describedby`. `aria-disabled` rather than `disabled`,
   *  the same call as the reflection card's own Next: the control a reader is
   *  waiting for should still be findable and should say why it is not ready.
   *  A full sentence, because it is read on screen rather than inside a
   *  parenthesis. */
  continueBlockedReason?: string
  /** The same treatment for the back control — the sleep diary's first question
   *  has nothing behind it. Blocked rather than removed (direct instruction, on
   *  the diary's own Back): a control that vanishes and reappears as you travel
   *  reads as a bug. */
  backBlockedReason?: string
  /** Defaults to in. A flow with direction-aware chrome passes its own flag. */
  shown?: boolean
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 border-t border-hairline bg-white py-4',
        shown ? 'translate-y-0' : 'translate-y-full',
      )}
      // Not `aria-hidden` when hidden, for the same reason as the module bar:
      // the forward control is the only way on and a keyboard user cannot
      // scroll it back.
      style={{
        filter: 'drop-shadow(2px 4px 8px rgba(230,194,127,0.2))',
        transition: CHROME_TRANSITION,
      }}
    >
      <div className={cn('flex items-center justify-center gap-4', SHELL)}>
        {onBack && (
          <BlockedHint id={BACK_REASON_ID} reason={backBlockedReason} className="shrink-0">
            <button
              type="button"
              aria-disabled={backBlockedReason ? true : undefined}
              aria-describedby={backBlockedReason ? BACK_REASON_ID : undefined}
              onClick={backBlockedReason ? undefined : onBack}
              /* The 152px width is a floor from 768 up and off below it. At 375
                 the row is 327 wide, and a fixed 152 for Go back left ~159 for
                 the forward pill — enough to wrap "Start learning" onto two
                 lines inside a 48px pill. Letting Go back size to its own
                 content (~120) fits both on one line with room to spare. */
              className={cn(
                PILL_OUTLINE,
                'shrink-0 gap-4 whitespace-nowrap min-[768px]:w-38',
                /* 60%, not the 40% the diary's own Back used before this footer
                   took the job: rasterised over the footer's white, 40% paints
                   the purple border at 1.72:1 against it and the label at
                   2.35:1, both well under the 3:1 a control outline needs. 60%
                   paints rgb(129,92,203) — 4.86:1 for the label. Same reasoning
                   as the forward pill's /65 below. */
                backBlockedReason && 'opacity-60 hover:opacity-60',
              )}
            >
              <BackIcon aria-hidden="true" className="size-4 shrink-0" />
              {backLabel}
            </button>
          </BlockedHint>
        )}
        <BlockedHint
          id={FORWARD_REASON_ID}
          reason={continueBlockedReason}
          className="w-full max-w-96"
        >
          <button
            type="button"
            aria-disabled={continueBlockedReason ? true : undefined}
            aria-describedby={continueBlockedReason ? FORWARD_REASON_ID : undefined}
            onClick={continueBlockedReason ? undefined : onContinue}
            className={cn(
              PILL_PRIMARY,
              'w-full justify-between',
              /* /65, not /55. Rasterised over the footer's white: 55% paints
                 rgb(147,115,210) and puts the white label at 3.73:1, which fails
                 AA; 65% paints rgb(127,89,202) at 5.02:1. Round 33's own disabled
                 Next was kept legible for the same reason. No `cursor-not-allowed`
                 — the hint replaces it, which is the whole point of the hint. */
              continueBlockedReason && 'bg-consumer-primary/65 hover:opacity-100',
            )}
          >
            <span className="flex-1 whitespace-nowrap text-center">{label}</span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
          </button>
        </BlockedHint>
      </div>
    </div>
  )
}
