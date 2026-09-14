import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MODAL_FOOTER_SURFACE, MODAL_FOOTER_SURFACE_COMPACT } from '@/components/shared/modalFooter'
import { cn } from '@/lib/utils'

/**
 * Confirmation dialog for record-changing actions (approve, decline,
 * withdraw, reassign). Copy per design/ux-copy.md Round 2: the title
 * names the person, the body states the consequence, and buttons repeat
 * the verb — never OK/Cancel.
 *
 * Accessibility: role="dialog" + aria-modal, labelled by its title,
 * focus moves to the panel on open and returns to the trigger on close,
 * Tab cycles inside, Escape closes.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  singleAction = false,
  /** Round 11 design-critique fix — every dropdown-then-confirm flow this
   *  round added (Onboard/Assign/Transfer) left its "Continue"/confirm
   *  button enabled even with an empty candidate pool, so clicking it did
   *  nothing with zero feedback. Pass true whenever there's genuinely
   *  nothing to confirm. */
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
  panelClassName,
  footerClassName,
  contentClassName,
  variant = 'app',
  hideHeader = false,
  hideFooter = false,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  /** Round 6.1 (§21 `widget-picker`) — for dialogs whose `children` slot is a
   *  row-list where each row carries its own action, so there's nothing for
   *  a Cancel/Confirm pair to confirm. Renders one text-link "close" control
   *  (`confirmLabel`) instead of the usual two-button footer. */
  singleAction?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
  /** Panel size override. Defaults to the 440px / 85vh confirm-dialog box, so
   *  every existing caller is byte-identical. My Notes' read-only note viewer
   *  passes a wider, taller one — it is showing a document, not asking a
   *  question, and 440px made a paragraph into a ribbon. */
  panelClassName?: string
  /** Footer bleed override, needed only by a caller that also overrides the
   *  panel's padding. `MODAL_FOOTER_SURFACE_COMPACT`'s negative margins are
   *  calibrated to this chassis' own `p-6`; a panel passing `p-8` leaves an
   *  8px white gutter either side of the pearl band, which is exactly the
   *  kind of thing that looks fine in a screenshot and shows up in a measure.
   *  Optional, so every existing caller renders byte-identically. */
  footerClassName?: string
  /** Children-wrapper override. Needed by a caller that gives the panel a
   *  `min-h`: without a `flex-1` here nothing grows, so the content and the
   *  pearl footer both stack at the top and the extra height falls below the
   *  footer as bare white. Optional, so every existing caller is unchanged. */
  contentClassName?: string
  /**
   * `'consumer'` scales the whole dialog up for the Consumer Portal.
   *
   * Direct instruction: "improve the pop-up modal dimensions, its too small for
   * someone with pood digital literacy, and accessibility isues", then "make
   * sure it is responsive also". The 440px panel, 14px buttons and `ink-muted`
   * sub-line are the researcher's dialog, and this portal's audience is
   * explicitly people who are not digitally literate — its own scale starts at
   * 16px and puts every control on 48px.
   *
   * A prop rather than a second component, per this project's standing rule for
   * a component shared with the Consumer Portal, and rather than a new default,
   * which would resize every dialog in the other three portals. `'app'` is
   * byte-identical to before.
   *
   * Responsive by construction: the width is `min(92vw, 640px)`, so the panel
   * is capped by the viewport rather than by a breakpoint and cannot overflow a
   * 375px phone; padding steps 24 -> 32 at `sm`; and the footer's existing
   * stack-below-`sm` behaviour is untouched.
   */
  variant?: 'app' | 'consumer'
  /**
   * Skip the visible title and sub-line, for a dialog whose `children` carry
   * their own heading.
   *
   * The consumer portal's coach profile is the case: it is a designed card with
   * a purple hero and the coach's name inside it (frame `979:8284`), so this
   * chassis' own title would be a second, competing one. `title` is still
   * **required and still used** — it becomes the dialog's `aria-label`, because
   * a dialog with no accessible name is a worse trade than a duplicated
   * heading. Passing an empty string to fake this would have produced exactly
   * that: an `aria-labelledby` pointing at an empty element.
   */
  hideHeader?: boolean
  /**
   * Drop the footer bar entirely, for a dialog that carries its own dismiss
   * control.
   *
   * The consumer portal's coach profile is the case (direct instruction: "no
   * footer for this one, add close button top right") — it is a designed card,
   * and a grey chassis footer under it read as a second, competing surface. Its
   * close control is a 44px button over the card's own purple hero instead.
   *
   * A dialog using this **must** provide its own way out, since Escape and the
   * backdrop are otherwise the only ones.
   */
  hideFooter?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const bodyId = useId()
  const consumer = variant === 'consumer'

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus({ preventScroll: true })
    } else if (triggerRef.current) {
      const trigger = triggerRef.current
      const closingPanel = panelRef.current
      triggerRef.current = null
      // Round 11 accessibility fix — a 2-step confirm flow (two sibling
      // `ConfirmDialog`s swapping `open` in the same transition, e.g.
      // "Continue"/"Go back") closes this instance in the same commit that
      // opens the next step. Restoring focus to the *original* trigger here
      // would race that step's own focus() call and could win, stranding
      // focus behind the still-open backdrop. Deferring one frame lets the
      // sibling's synchronous focus() land first; only steal focus back to
      // the original trigger if nothing else claimed it (a genuine close).
      //
      // Round 14 accessibility fix — that "did something else claim focus"
      // check was `activeElement === body`, which is wrong for a plain
      // self-close (Escape, Cancel, backdrop click, or a confirm whose own
      // trigger unmounts): `AnimatePresence`'s exit animation keeps this
      // panel mounted (and focused, via the `open` branch's own
      // `panelRef.current.focus()` above) for its transition duration, so at
      // the next-frame check `document.activeElement` is still *this*
      // closing panel, not body — the old check misread that as "someone
      // else already claimed focus" and skipped restoring, silently losing
      // focus to body a moment later once the panel actually unmounted.
      // Checking "is focus still inside the panel that's closing" instead of
      // "is focus on body" correctly restores on every genuine self-close,
      // while still deferring to a 2-step flow's new panel (a *different*
      // DOM subtree, not contained by this one) when that's what happened.
      requestAnimationFrame(() => {
        const active = document.activeElement
        const stillInClosingPanel = !!closingPanel && !!active && closingPanel.contains(active)
        if (!active || active === document.body || stillInClosingPanel) {
          trigger.focus({ preventScroll: true })
        }
      })
    }
  }, [open])

  const trapKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled])',
      ),
    ]
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/25"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              onKeyDown={trapKeys}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              {...(hideHeader
                ? { 'aria-label': title }
                : { 'aria-labelledby': titleId, 'aria-describedby': bodyId })}
              className={cn(
                'pointer-events-auto flex flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline',
                panelClassName ??
                  (consumer
                    ? 'max-h-[90vh] w-[min(92vw,640px)] p-6 md:p-8'
                    : 'max-h-[85vh] w-full max-w-[440px]'),
              )}
            >
              {!hideHeader && (
              <>
              <h2
                id={titleId}
                className={cn(
                  'shrink-0 text-ink',
                  consumer ? 'text-consumer-heading' : 'font-display text-title',
                )}
              >
                {title}
              </h2>
              {/* Round 40, direct instruction: 4px under the title (was 12px),
                  and the sub-line is `body` regular (was `caption`). Applied on
                  the shared chassis rather than one dialog, so every modal in
                  the app keeps one title/sub-line treatment — the alternative
                  is the drift this component exists to prevent. */}
              <p
                id={bodyId}
                className={cn(
                  'mt-1 shrink-0 text-body',
                  /* `ink` not `ink-muted`: this is the sentence that explains
                     what is about to happen, and muted grey on a consumer
                     surface is the wrong place to save contrast. */
                  consumer ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {body}
              </p>
              </>
              )}

              {children && (
                <div className={cn('mt-4 min-h-0 overflow-y-auto', contentClassName)}>
                  {children}
                </div>
              )}

              {/*
                Below `sm` the buttons go FULL WIDTH and stack; from `sm` this
                is the original right-aligned row, unchanged.

                On a phone the row wrapped into two right-aligned pills of
                different widths, which reads as two unrelated controls rather
                than a choice between two — worst on the destructive dialogs,
                where the red button was the narrower of the pair. Full width
                also gives the biggest possible target, which matters for the
                Consumer Portal's audience.
              */}
              {!hideFooter && (
              <div
                className={cn(
                  /* ⚠️ The footer's bleed is negative margins sized to the
                     PANEL's padding, so the two cannot be chosen
                     independently. `modalFooter.ts` documents the pairing:
                     `_COMPACT` (-mx-6) belongs to a `p-6`-only panel, the wide
                     constant (-mx-6 md:-mx-8) to a `p-6 md:p-8` one. The
                     consumer variant's larger panel therefore takes the wide
                     footer; giving it the compact one left the grey bar 8px
                     short of the panel edge on three sides — reported from the
                     live page, and invisible in any measurement of the footer
                     alone, because the footer was exactly as wide as it asked
                     to be. */
                  consumer ? MODAL_FOOTER_SURFACE : MODAL_FOOTER_SURFACE_COMPACT,
                  'mt-6 flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end',
                  footerClassName,
                )}
              >
                {singleAction ? (
                  <button
                    type="button"
                    onClick={onClose}
                    // `self-end` keeps this one right-aligned in the stacked
                    // column — it is a text link, not a button, so stretching
                    // it full width would put its underline across the panel.
                    className={cn(
                      'inline-flex min-h-11 items-center self-end rounded-sm outline-none hover:underline sm:self-auto',
                      /* The app styling here is 14px `caption-medium` in
                         `--primary` with `ring-ring` — three things the
                         Consumer Portal's standing no-leakage rule forbids on
                         its own surfaces. */
                      consumer
                        ? 'px-2 text-body-md text-consumer-primary focus-visible:ring-2 focus-visible:ring-consumer-primary'
                        : 'text-caption-medium text-primary focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    {confirmLabel}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className={cn(
                        'inline-flex w-full items-center justify-center rounded-full border outline-none transition-all active:scale-[0.97] sm:w-auto',
                        consumer
                          ? 'h-12 border-consumer-primary px-6 text-body-md text-consumer-primary hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary'
                          : 'h-9 border-primary px-[18px] text-caption-medium text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring',
                      )}
                    >
                      {cancelLabel}
                    </button>
                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={confirmDisabled}
                      className={cn(
                        'inline-flex w-full items-center justify-center rounded-full text-white outline-none transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] sm:w-auto',
                        consumer
                          ? 'h-12 px-6 text-body-md focus-visible:ring-consumer-primary'
                          : 'h-9 px-[18px] text-caption-medium focus-visible:ring-ring',
                        confirmDisabled
                          ? 'cursor-not-allowed bg-primary/40 hover:bg-primary/40'
                          : destructive
                            ? 'bg-destructive hover:bg-destructive/90'
                            : 'bg-primary hover:bg-primary-hover',
                      )}
                    >
                      {confirmLabel}
                    </button>
                  </>
                )}
              </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
