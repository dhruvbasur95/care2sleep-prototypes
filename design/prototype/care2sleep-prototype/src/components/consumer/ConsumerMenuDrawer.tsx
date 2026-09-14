import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeftRight,
  ChevronRight,
  GraduationCap,
  House,
  MessageCircleQuestionMark,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  closeConsumerMenu,
  pulseContentReveal,
  useConsumerMenu,
} from '@/data/consumerMenuReveal'
import { signOutOfTraining } from '@/data/auth'

/**
 * The Consumer Portal's hamburger menu, as a **full-screen drawer**.
 *
 * Replaces a `base-ui` `Menu.Popup` — a 220px dropdown of 16px rows anchored
 * under the trigger, holding the account actions only. Direct instruction: it
 * "needs to flow in from top down, and take full screen", with a clear close
 * button top right, and it now carries the portal's destinations rather than
 * just the account items.
 *
 * ── Why this is not the shared `ConfirmDialog` ─────────────────────────────
 *
 * That chassis is a centred, max-width panel with a footer — the coach profile
 * modal rides it precisely because it *is* a card. This is a full-bleed surface
 * that slides down from the top edge, so it would spend every prop fighting the
 * panel it inherits. What it does borrow is the chassis' hard-won behaviour,
 * reimplemented here because none of it is exported: Escape to close, a Tab
 * trap, scroll lock, and a deliberate focus target on open.
 *
 * ⚠️ **Focus goes on a callback ref, not an effect.** Under `AnimatePresence`
 * the drawer mounts a commit *later* than the state change, so a `useEffect`
 * keyed on `open` runs before the close button exists and focuses nothing —
 * this project has shipped that exact bug and recorded it twice (CLAUDE.md:
 * "under `AnimatePresence mode='wait'`, focus belongs on a callback ref"). A
 * callback ref is keyed on the element, which cannot exist too early.
 *
 * ⚠️ **Scroll lock is `overflow: hidden` on the root**, which stops the user
 * scrolling while leaving programmatic scrolling intact, and it compensates for
 * the removed scrollbar — without that the page jumps ~15px wider the moment
 * the drawer opens, shifting the header underneath it.
 */

/**
 * The rows, in the order given: the destinations, then the account items.
 *
 * ⚠️ **Log out is deliberately NOT one of these rows.** Direct instruction:
 * "if its a tablet the signout also goes inside", then "keep the same button
 * style red, but show it at bottom, centre aligned". So it keeps the header's
 * own destructive control — `text-destructive`, underlined, 44px — and sits
 * centred below the list rather than becoming a sixth chevron row that would
 * read as one more equal destination. It has to live here at all because the
 * header's desktop cluster (account pill + Log out) is hidden below 1200px, so
 * without it a phone or tablet has no way out at all.
 *
 * ⚠️ `Need help` takes `MessageCircleQuestionMark`, not the `LifeBuoy` the old
 * dropdown used. Same reason it was replaced on the coach profile modal one
 * change earlier ("this icon does not make any sence"): at a large size a life
 * ring reads as a wheel or a target. One glyph, one meaning, across the portal.
 */
type Row =
  | { kind: 'link'; label: string; icon: LucideIcon; to: (dyadId: string) => string }
  | { kind: 'action'; label: string; icon: LucideIcon; action: 'switch' }

const ROWS: Row[] = [
  { kind: 'link', label: 'Home', icon: House, to: (d) => `/consumer/${d}` },
  { kind: 'link', label: 'My Modules', icon: GraduationCap, to: (d) => `/consumer/${d}/learning` },
  { kind: 'link', label: 'My profile', icon: UserRound, to: (d) => `/consumer/${d}/account` },
  { kind: 'link', label: 'Need help', icon: MessageCircleQuestionMark, to: (d) => `/consumer/${d}/help` },
  { kind: 'action', label: 'Switch portal', icon: ArrowLeftRight, action: 'switch' },
]

export function ConsumerMenuDrawer() {
  /* No props: the state lives in `consumerMenuReveal` and this is mounted once
     above the router, so navigating cannot unmount it mid-animation. */
  const { open, dyadId } = useConsumerMenu()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement | null>(null)

  /* See the doc comment: the element, not an effect keyed on `open`. */
  const focusClose = useCallback((el: HTMLButtonElement | null) => {
    el?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    const prevPad = root.style.paddingRight
    const gap = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (gap > 0) root.style.paddingRight = `${gap}px`
    return () => {
      root.style.overflow = prevOverflow
      root.style.paddingRight = prevPad
    }
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      dismiss()
      return
    }
    if (e.key !== 'Tab') return
    /* A full-screen surface over the whole app has to trap Tab, or focus walks
       into the page behind it — invisible, but reachable. */
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    }
  }

  /**
   * ⚠️ **Navigation is deferred until the exit animation finishes.**
   *
   * Reported as "when I select a page from menu, the drawer just vanishes", and
   * the cause is architectural rather than a wrong duration: every page mounts
   * its **own** `ConsumerShell`, so `navigate()` unmounts the shell that owns
   * this header — and this drawer, and the `AnimatePresence` that would have
   * animated it — in the same commit. There is no exit to play because the
   * component performing it is already gone. CLAUDE.md records the general form
   * of this ("anything that must survive in-app navigation cannot be state in a
   * shell"); this is the animation version of it.
   *
   * So a row stores its destination, closes the drawer, and `onExitComplete`
   * navigates once the shutter is actually up. The new page then plays its own
   * `ConsumerContentReveal` on mount, which is the "content moves in" half of
   * the same gesture — so this path does **not** pulse the reveal signal, or
   * the outgoing page would animate in behind a closing shutter and then be
   * replaced.
   */
  /**
   * A row navigates and closes in the **same frame**.
   *
   * ⚠️ This is only safe because the drawer is mounted above the router. The
   * first version deferred `navigate()` to `onExitComplete` — necessary then,
   * because navigating unmounted this component and the drawer simply vanished
   * — and the result was three sequential events: shutter up, page swap,
   * content fade. Reported as choppy, and it was.
   *
   * Now the new page mounts underneath while the shutter is still rising and
   * plays its own `ConsumerContentReveal` on mount, so the reveal and the
   * shutter overlap. No pulse on this path: the mount already animates it, and
   * pulsing as well would animate the outgoing page too.
   *
   * Focus goes to the new page's `<main>` rather than back to the hamburger:
   * the header remounts with the page, so the trigger this drawer was opened
   * from no longer exists as the same node, and `<main id="main-content">`
   * carries `tabIndex={-1}` for exactly this.
   */
  const go = (row: Row) => {
    const to = row.kind === 'link' ? row.to(dyadId ?? '') : '/'
    closeConsumerMenu()
    navigate(to)
    requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true })
    })
  }

  /**
   * Dismissal that is not a navigation — the X and Escape.
   *
   * ⚠️ **The pulse fires as the close STARTS, not on `onExitComplete`.** It was
   * briefly in the latter, and measuring showed the content's entrance
   * beginning at 440ms — after the shutter had entirely gone, so the two read
   * as two events instead of one. Fired here they run concurrently: sampled
   * frame by frame, the drawer travels 0 -> -1024 while the content's opacity
   * goes 0 -> 1 and its offset 10 -> 0, both landing together, which is the
   * shutter-reveal the instruction asked for.
   */
  const dismiss = () => {
    pulseContentReveal()
    closeConsumerMenu()
    /* Queried rather than held in a ref: this component outlives the header
       that owns the trigger, so a ref captured on open can point at a node a
       navigation has already replaced. */
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('button[aria-label="Menu"]')?.focus()
    })
  }

  return (
    <AnimatePresence>
      {open && dyadId && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onKeyDown={onKeyDown}
          /* Down from the top edge and back up on close — the drawer is the
             thing that moves, so the close control returns it the way it came
             rather than fading it out in place.

             ⚠️ **The two directions carry different easings on purpose.**
             Direct instruction: "make the move in motion of the drawer more
             subtle, and ease in". Opening is `[0.32, 0, 0.35, 1]` at 0.5s: a
             slow, soft start that still decelerates into rest.

             A **literal** `ease-in` was tried first ([0.32, 0, 0.67, 0]) and
             measured: it held near the top edge for the first 160ms, moving
             28px, then covered the remaining ~1000px in the last third and
             arrived at full speed. An ease-in accelerates *into* its stop,
             which on a full-height shutter is the least subtle thing it can
             do — the opposite of the instruction's intent. The curve here keeps
             the gentle entry that "ease in" asks for and drops the hard
             arrival.

             Closing keeps a standard ease-out and is the **shorter** of the
             two, because it is choreographed against the content underneath:
             the shutter rising is what reveals a page that is itself moving in,
             and a slow exit would leave the content waiting behind it. */
          initial={reduceMotion ? { opacity: 0 } : { y: '-100%' }}
          animate={
            reduceMotion
              ? { opacity: 1, transition: { duration: 0 } }
              : { y: 0, transition: { duration: 0.68, ease: [0.32, 0, 0.35, 1] } }
          }
          /* The per-direction transitions ride the variants, not a top-level
             `transition` — this framer version has no `exit` key inside
             `transition` (it type-errors), and a single shared curve is what
             made the entrance read as a slam. */
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : { y: '-100%', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
          }
          className="bg-consumer-menu fixed inset-0 z-50 flex flex-col overflow-y-auto outline-none"
        >
          {/* Close, top right. 44px, this portal's target size. */}
          <div className="flex shrink-0 justify-end px-4 pt-4 pb-8 sm:pb-10">
            <button
              ref={focusClose}
              type="button"
              onClick={dismiss}
              className="flex size-11 items-center justify-center rounded-full text-consumer-primary outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary"
            >
              <X aria-hidden="true" className="size-7" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>

          {/* `gap-2` between rows and 32-40px under the close control — direct
              instruction to open both up. The rows keep their own 72px height,
              so the gap is added space rather than a taller target. */}
          <nav aria-label="Menu" className="flex flex-col gap-2 px-2 sm:px-6">
            {ROWS.map((row, i) => {
              const Icon = row.icon
              return (
                <motion.button
                  key={row.label}
                  type="button"
                  onClick={() => go(row)}
                  /* Stepper-style entrance (direct instruction: "when the
                     drawer moves in, I want the pages to also move in i.e.
                     fade in stepper style"). Each row follows the one above it
                     by 60ms, starting once the shutter is most of the way
                     down. Slowed on direct instruction ("hamburger move in +
                     inner buttons motion too quick"): the shutter is now 680ms
                     and each row follows the one above it by 90ms over 420ms,
                     starting 260ms in — so the rows arrive behind a surface
                     that is still moving, which is what makes it read as one
                     gesture rather than a list appearing after a panel. */
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.42, delay: 0.26 + i * 0.09, ease: [0.4, 0, 0.2, 1] }
                  }
                  /* The chevron is pushed to the right edge by `justify-between`
                     rather than sitting after the label, so all six line up in
                     one column down the right-hand side of the screen. */
                  className="flex min-h-[72px] w-full items-center justify-between gap-4 rounded-sm px-4 text-left outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    {/* The row's own glyph, at 32px against the 16px the
                        dropdown used, in `consumer-primary`. */}
                    <Icon
                      aria-hidden="true"
                      className="size-8 shrink-0 text-consumer-primary"
                      strokeWidth={1.75}
                    />
                    <span className="text-consumer-card-title-sm min-w-0 text-ink">
                      {row.label}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-7 shrink-0 text-consumer-primary"
                  />
                </motion.button>
              )
            })}
          </nav>

          {/* Log out, centred at the end of the sheet. `mt-auto` pins it to the
              bottom on a tall screen while still following the list on a short
              one, so it never overlaps.

              ⚠️ **A filled destructive pill, not the header's ghost.** Direct
              instruction: "use the primary style button for ipad, and mobile,
              not ghost style". The desktop header's Log out is an underlined
              text link, which works in a dense toolbar beside two other
              controls; on a full-screen sheet it read as a footnote. This is
              the same filled treatment My Profile's own "Opt out of the study"
              uses — this portal's established destructive primary — at the
              portal's 48px control height.

              The label is **Log out**, matching the desktop control it stands
              in for; the dropdown this drawer replaces said "Sign out", and two
              names for one action across two breakpoints is drift. */}
          <div className="mt-auto flex shrink-0 flex-col px-4 pt-6 pb-10 sm:px-6">
            {/* A separator above it (direct instruction): the list above is
                navigation, this is the one action that ends the session, and
                the rule is what says so before the colour does. Inset to the
                same gutter as the rows rather than bled full width, so it
                reads as belonging to the sheet's content column. */}
            <hr className="mb-6 border-t border-hairline" />
            {/* Full width on a phone, and wider than its label on a tablet
                (direct instruction — it measured 108px, which read as a small
                target for the one irreversible action here). */}
            <button
              type="button"
              onClick={() => {
                signOutOfTraining()
                dismiss()
                navigate('/')
              }}
              className="text-body-md flex h-12 w-full shrink-0 items-center justify-center rounded-3xl border border-destructive bg-destructive px-6 text-white outline-none transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 sm:w-[280px] sm:self-center"
            >
              Log out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
