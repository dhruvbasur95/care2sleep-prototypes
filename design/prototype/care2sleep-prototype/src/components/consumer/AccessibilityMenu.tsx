import { useMemo, useRef, type ComponentType, type RefObject } from 'react'
import { Popover } from '@base-ui/react/popover'
import { ChevronsDown, ChevronsUp, PersonStanding, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  decreaseTextSize,
  increaseTextSize,
  resetTextSize,
  useTextScale,
} from '@/data/consumerTextScale'

/**
 * The Consumer Portal's accessibility menu — trigger in the header, card on
 * open. Frame `918:4720` (the card only; the trigger has no frame and is a
 * direct instruction: "icon with white background, black stroke outline, and
 * radius 999").
 *
 * ── One divergence from the frame, and it is the important one ───────────
 *
 * The frame labels its three controls at **14px**. This portal's scale has a
 * hard floor of **16px and nothing below it** — a standing non-negotiable, and
 * the one place it matters most is here: this is the menu a reader opens
 * *because they could not read something*, and setting its own labels smaller
 * than the portal's minimum would be self-defeating. So the labels are 16px and
 * the tiles grew from the frame's 100px to fit them. Everything else — the
 * 348px card, 16px radius, 24/28 padding, the `parchment` stroke, the warm card
 * shadow, the three-up tile row, the rule under "Text Size" — is the frame's.
 *
 * The frame's `caption semi-bold` (14/500/-0.224) is also an app-wide token,
 * and app-wide type steps are exactly what must not leak into this portal.
 */

/**
 * The trigger. White fill, `ink` stroke, fully round — direct instruction.
 *
 * 44px, over the 36px floor, because it sits beside a 44px hamburger and an
 * accessibility affordance is the last control that should be the small one.
 *
 * **`border-2`** (direct instruction, "increase outline stroke to 2px). It also
 * happens to be the right number rather than just the asked-for one: the glyph
 * inside is lucide's default 2px stroke, so a 1px ring read as a hairline drawn
 * around a heavier drawing. At 2px the ring and the figure are one weight, and
 * the whole control reads as a single icon rather than an icon in a box.
 */
const TRIGGER =
  'flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white text-ink outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 data-[popup-open]:bg-purple-50'

/**
 * One of the three tiles.
 *
 * `min-h-[100px]` rather than the frame's fixed `h-[100px]`: the labels are two
 * lines at 16px here rather than 14, and a fixed height is how a frame's own
 * numbers silently clip real copy — the trap §80 names. `min-w-0` on a `flex-1`
 * cell because items default to `min-width: auto`, which this project has
 * turned into a real horizontal scroll three times.
 *
 * A spent control is `aria-disabled` and not `disabled`: it keeps its tab stop
 * and says why through `sr-only` text, which is this app's standing treatment
 * for a control that is present but cannot act. `disabled` would drop it out of
 * the tab order mid-interaction, moving the two controls either side of it
 * under a reader's fingers.
 */
function Tile({
  icon: Icon,
  lines,
  onClick,
  disabledReason,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  /** Two lines, as the frame sets them — "Increase" / "Text". An array rather
   *  than a string with a `<br>`, so the wrap is data and not markup. */
  lines: [string, string]
  onClick: () => void
  disabledReason?: string
}) {
  return (
    <button
      type="button"
      aria-disabled={disabledReason ? true : undefined}
      onClick={disabledReason ? undefined : onClick}
      className={cn(
        'flex min-h-[100px] min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-[12px] border border-ink-faint bg-parchment p-2 text-center text-[16px] font-medium leading-tight text-ink outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary',
        /* 55%, measured: `ink` on `parchment` at 55% opacity rasterises to
           rgb(129,129,131) against the tile, which is 4.61:1 and still clears
           AA. The obvious `opacity-50` on the whole tile takes the border down
           with it and lands the label at 3.9:1 — the same stacking mistake
           Round 14.5 fixed on `WeekdayPicker`. */
        disabledReason && 'text-ink/55',
      )}
    >
      <Icon aria-hidden={true} className="size-5 shrink-0" />
      <span>
        {lines[0]}
        <br />
        {lines[1]}
        {disabledReason && <span className="sr-only"> ({disabledReason})</span>}
      </span>
    </button>
  )
}

/**
 * The open/close motion shared by both header submenus — the accessibility card
 * and the account menu (Round 49, direct instruction: "for sub menu, introduce
 * a subtle animation when they are displayed, or closed").
 *
 * A 4px drop and a fade over 200ms, in and out. Deliberately small: these cards
 * hang 12px below a sticky header and travel toward the reader, so anything
 * larger reads as the card falling out of the bar rather than opening from it.
 * The same easing and the same distance in both directions — two different
 * curves on one element is most of what reads as "springy" (Round 32).
 *
 * Driven by Base UI's own `data-starting-style` / `data-ending-style`, not
 * `framer-motion`: the popup is unmounted by the library on close, so an exit
 * animation has to be something the library itself can wait for, and it detects
 * a CSS transition and holds the node until it finishes.
 *
 * `motion-reduce:transition-none` rather than a `motion-safe:` prefix on each
 * state class: stacking a media variant on top of a data-attribute variant is
 * exactly the combination this project has already watched fail to compile
 * silently (§ the arbitrary-property note in CLAUDE.md), and cancelling the
 * transition wholesale is both simpler and correct — the element lands on its
 * final state immediately.
 *
 * Exported so the account menu in `ConsumerHeader` reads the same string.
 */
/** Moved to `components/shared/submenuMotion` in Round 47 when the app header's
 *  account menu adopted the same card. Re-exported so this module's existing
 *  importers did not have to change. */
export { SUBMENU_CARD_MOTION } from '@/components/shared/submenuMotion'
import { SUBMENU_CARD_MOTION } from '@/components/shared/submenuMotion'

export function AccessibilityMenu({
  className,
  anchorRef,
}: {
  className?: string
  /**
   * What the card hangs from — the whole `<header>`, not this trigger.
   *
   * They are not the same box below 1200: the header is the bar PLUS the nav
   * tab row beneath it, so anchoring to the trigger (which lives in the bar)
   * put the card 12px under the bar and 63px ON TOP of the tabs. Measured, not
   * spotted — it looks plausible in a screenshot because the card is opaque and
   * simply covers them.
   *
   * Anchoring to the header makes the instruction "subtle gap between the main
   * header and this one" true at both breakpoints without a per-breakpoint
   * offset, because the header knows its own height and the tab row is inside
   * it.
   */
  anchorRef?: RefObject<HTMLElement | null>
}) {
  const { label, canIncrease, canDecrease, isDefault } = useTextScale()
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  /**
   * A virtual anchor composed from two different boxes, because the card needs
   * one thing from each and no single element carries both.
   *
   * - **bottom** comes from the whole `<header>`. Below 1200 the header is the
   *   bar PLUS the nav tab row, so hanging off the trigger (which lives in the
   *   bar) put the card 12px under the bar and 63px ON TOP of the tabs —
   *   measured, and invisible in a screenshot because the card is opaque and
   *   simply covers them.
   * - **right** comes from the trigger. Hanging the horizontal edge off the
   *   header too pinned the card 5px from the window edge, ignoring this
   *   portal's gutter, which is 24 below 1200 and 80 above it. Reading the
   *   trigger's own right edge gets both for free, because the trigger already
   *   sits on that gutter at every width.
   *
   * `getBoundingClientRect` is called on every reposition rather than measured
   * once, so this survives a resize, a scroll and the breakpoint change.
   */
  const anchor = useMemo(
    () => ({
      getBoundingClientRect: () => {
        const header = anchorRef?.current?.getBoundingClientRect()
        const trigger = triggerRef.current?.getBoundingClientRect()
        const bottom = header?.bottom ?? trigger?.bottom ?? 0
        const right = trigger?.right ?? header?.right ?? 0
        const left = trigger?.left ?? right
        const top = header?.top ?? bottom
        return {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
          top,
          right,
          bottom,
          left,
        } as DOMRect
      },
    }),
    [anchorRef],
  )

  return (
    <Popover.Root>
      <Popover.Trigger
        ref={triggerRef}
        aria-label="Accessibility tools"
        className={cn(TRIGGER, className)}
      >
        {/*
          `PersonStanding`, not lucide's `Accessibility` — direct instruction,
          "use this style icon not person in wheelchair".

          The two are genuinely different marks and the swap is not cosmetic.
          `Accessibility` draws an off-centre figure over a wheel arc
          (`M4.24 14.5a5 5 0 0 0 6.88 6`), which reads as the wheelchair symbol.
          `PersonStanding` is the universal-access figure: head, arms out
          (`m6 8 6 2 6-2`), legs splayed (`m9 20 3-6 3 6`), symmetric about
          x=12 — the standing person the reference shows.

          The enclosing ring in the reference is the BUTTON, not the glyph:
          `TRIGGER` is already a `rounded-full` white disc with an `ink` border,
          so the two compose into one circled figure. Nesting a second circle
          inside would draw a ring within a ring.

          Left at lucide's own defaults — `size-6` and the library's 2px stroke
          — rather than given this portal's occasional `strokeWidth={2.25}`
          override. Measured against its neighbours: the hamburger in the same
          bar is `lucide-menu` at 24px/2, and `phone`/`mail` on the page are
          24px/2. Matching the library default IS matching the other icons here.
        */}
        <PersonStanding aria-hidden="true" className="size-6" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          anchor={anchor}
          side="bottom"
          align="end"
          /* "make sure there is subtle gap between the main header and this
             one" — 12px. Enough to read as a separate surface against the
             header's own card shadow, short enough that the card still reads as
             belonging to the control that opened it. */
          sideOffset={12}
          className="z-50 outline-none"
        >
          <Popover.Popup
            /* The frame's card: 348 wide, 16px radius, 24 side / 28 block
               padding, 24 gap, `parchment` stroke, and the app's own warm
               `shadow-card` — which IS the frame's declared Card shadow.
               `max-w-[calc(100vw-32px)]` is not in the frame and has to be:
               348 does not fit a 375 screen inside the 24px gutter this portal
               uses, and a popup wider than the viewport is how a menu ends up
               with its own horizontal scroll. */
            /* Round 49, direct instruction: "visually align the accessibility
               sub menu as done for sub menu for my account". Both cards now
               hang off the header's own bottom edge at the same 12px offset and
               share one width, radius, stroke, fill and shadow, so they read as
               two panels of one system rather than two separate popovers that
               happen to be near each other. The frame's own 348 loses to the
               account card's 320 — one of the two had to move, and the narrower
               of the pair is the one that still fits a 375 screen inside this
               portal's gutter without relying on the max-width clamp. */
            className={cn(
              SUBMENU_CARD_MOTION,
              'w-[320px] max-w-[calc(100vw-32px)] rounded-lg border border-parchment bg-white px-6 py-7 text-ink shadow-card outline-none',
            )}
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                {/* 18/600 — the frame's, and it is on this portal's scale. */}
                <Popover.Title className="text-[18px] font-semibold leading-[1.4]">
                  Accessibility tools
                </Popover.Title>
                {/*
                  Round 49, direct instruction: "accessibility sub menu close
                  button does not visually align across the app".

                  It did not, and measurably so — this portal had **three**
                  close buttons. The hamburger drawer's is 44px round,
                  `consumer-primary`, `X` at `size-7`, hover `purple-50`; the
                  coach profile modal's is 44px round with `X` at `size-6`; and
                  this one was a 36px box holding a 12px `X` inside a filled
                  24px grey disc, a treatment used nowhere else. It is now the
                  drawer's, which the modal already half-agrees with.

                  That drops the frame's own grey disc, which is the right call
                  twice over: the app's 36px control floor already outranked the
                  frame's 24px target (standing rule, enforced since Round 3.1),
                  and a portal cannot have one glyph mean "close" in three
                  different costumes.

                  `-mt-2 -mr-2` keeps the *glyph* on the card's own 24px inset
                  rather than the button box: the box is 44 around a 28px `X`,
                  so 8px of it is padding, and pulling the box back by exactly
                  that leaves the visible mark where the padding says it should
                  be while the hit area grows outward into the corner.
                */}
                <Popover.Close
                  aria-label="Close accessibility tools"
                  className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-consumer-primary outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary"
                >
                  <X aria-hidden="true" className="size-7" />
                </Popover.Close>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[18px] font-semibold leading-[1.4]">Text size</h3>
                    {/* Not in the frame. Added because all three controls change
                        something the reader may not be looking at — the menu
                        floats over the page, and on a short screen the text it
                        resizes can be entirely behind it. A percentage is the
                        only feedback that works from inside the card. */}
                    <span aria-live="polite" className="text-[16px] text-ink-muted">
                      {label}
                    </span>
                  </div>
                  {/* The frame's rule: a 1.5px line under the section heading,
                      full width. `ink`, matching the heading above it. */}
                  <div className="h-px w-full bg-ink" />
                </div>

                <div className="flex items-stretch gap-2">
                  <Tile
                    icon={ChevronsUp}
                    lines={['Increase', 'Text']}
                    onClick={increaseTextSize}
                    disabledReason={canIncrease ? undefined : 'already at the largest size'}
                  />
                  <Tile
                    icon={ChevronsDown}
                    lines={['Decrease', 'Text']}
                    onClick={decreaseTextSize}
                    disabledReason={canDecrease ? undefined : 'already at the smallest size'}
                  />
                  <Tile
                    icon={RotateCcw}
                    lines={['Reset', 'Text']}
                    onClick={resetTextSize}
                    disabledReason={isDefault ? 'text is already at the default size' : undefined}
                  />
                </div>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
