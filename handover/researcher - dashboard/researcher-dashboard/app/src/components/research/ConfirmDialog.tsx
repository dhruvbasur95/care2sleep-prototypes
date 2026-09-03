import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MODAL_FOOTER_SURFACE_COMPACT } from '@/components/shared/modalFooter'
import { cn } from '@/lib/utils'

/**
 * The confirmation dialog for every record-changing action — withdraw,
 * transfer, assign, onboard, opt out, discard a wizard. Five callers across
 * three pages and two other components.
 *
 * COPY CONTRACT: the title names the person or thing, the body states the
 * consequence, and the buttons repeat the verb. Never "OK"/"Cancel" as a
 * confirm label — a user reading only the buttons should still know what they
 * are agreeing to.
 *
 * ⚠️ IT DOES NOT UNMOUNT ITS CHILDREN THE WAY A WIZARD NEEDS. `children` is
 * rendered inside the panel and is fine for a picker or a short list, but a
 * multi-screen flow cannot live here — that is why the wizard modals hand-roll
 * their own chassis rather than reusing this one.
 *
 * ⚠️ THE FOCUS-RESTORE IS DELIBERATE AND SUBTLE. Read the effect below before
 * simplifying it. Two separate defects are encoded there, and both are
 * invisible unless you drive the dialog with a keyboard:
 *  - restoring focus synchronously on close breaks two-step flows, where one
 *    dialog closes in the same commit that opens the next;
 *  - checking "is focus on `<body>`" instead of "is focus still inside the
 *    closing panel" silently loses focus on an ordinary close, because
 *    `AnimatePresence` keeps the focused panel mounted through its exit
 *    animation.
 *
 * Accessibility otherwise: `role="dialog"` + `aria-modal`, labelled by its
 * title and described by its body, Tab trapped inside, Escape closes.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  singleAction = false,
  /** Pass true whenever there is genuinely nothing to confirm — most often a
   *  picker dialog whose candidate list is empty. Without it the confirm
   *  button stays enabled and clicking it does nothing, with no feedback. */
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  /** For dialogs whose `children` is a row list where each row carries its own
   *  action, so there is nothing for a Cancel/Confirm pair to confirm. Renders
   *  one text-link close control labelled `confirmLabel`. Note `onConfirm` is
   *  never called in this mode — the close control runs `onClose`. */
  singleAction?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus({ preventScroll: true })
    } else if (triggerRef.current) {
      const trigger = triggerRef.current
      const closingPanel = panelRef.current
      triggerRef.current = null
      // ⚠️ Two constraints are encoded here. Both were real, keyboard-only
      // defects; neither is visible on screen.
      //
      // (1) WHY THE `requestAnimationFrame`. A two-step confirm flow — two
      //     sibling `ConfirmDialog`s swapping `open` in one transition, as
      //     `OnboardCoachDialog` does — closes this instance in the same
      //     commit that opens the next. Restoring focus to the original
      //     trigger synchronously races the new panel's own focus() and can
      //     win, stranding focus behind a still-open backdrop. Deferring a
      //     frame lets the sibling land first.
      //
      // (2) WHY THE TEST IS `stillInClosingPanel`, NOT `activeElement ===
      //     body`. On an ordinary self-close (Escape, Cancel, backdrop click,
      //     or a confirm whose own trigger unmounts) `AnimatePresence` keeps
      //     this panel mounted *and focused* through its exit animation, so a
      //     frame later `activeElement` is still this panel — never `body`. A
      //     body check reads that as "someone else claimed focus", skips the
      //     restore, and loses focus to `body` once the panel finally
      //     unmounts. Asking "is focus still inside the panel that is closing"
      //     restores correctly on a self-close while still yielding to a
      //     two-step flow's new panel, which is a different subtree.
      requestAnimationFrame(() => {
        const active = document.activeElement
        const stillInClosingPanel = !!closingPanel && !!active && closingPanel.contains(active)
        if (!active || active === document.body || stillInClosingPanel) {
          trigger.focus({ preventScroll: true })
        }
      })
    }
  }, [open])

  // Focus trap. A `keydown` handler on the panel, which is why focus must
  // never be allowed to reach `<body>` while the dialog is open — the handler
  // simply stops receiving events, and Tab escapes to the page behind.
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
              aria-labelledby={titleId}
              aria-describedby={bodyId}
              className="pointer-events-auto flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline"
            >
              <h2
                id={titleId}
                className="shrink-0 font-display text-title text-ink"
              >
                {title}
              </h2>
              <p id={bodyId} className="mt-3 shrink-0 text-caption text-ink-muted">
                {body}
              </p>

              {children && <div className="mt-4 min-h-0 overflow-y-auto">{children}</div>}

              <div className={cn(MODAL_FOOTER_SURFACE_COMPACT, 'mt-6 flex shrink-0 flex-wrap justify-end gap-3')}>
                {singleAction ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {confirmLabel}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                    >
                      {cancelLabel}
                    </button>
                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={confirmDisabled}
                      className={cn(
                        'inline-flex h-9 items-center justify-center rounded-full px-[18px] text-caption-medium text-white outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]',
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
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
