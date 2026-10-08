import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * A right-hand slide-in panel — the app's first drawer.
 *
 * Built for the Coach Management record page's "View consumer details" quick
 * view (direct instruction): the consumer whose study progress you are reading
 * is named in the band above, and this is where you check who they actually
 * are without losing your place on the page. A `ConfirmDialog` would have been
 * the wrong chassis — it is centred, capped at 440px, and its footer expects a
 * decision; this panel is a read surface with nothing to confirm.
 *
 * Accessibility is deliberately the same contract `ConfirmDialog` already
 * proved out, because the failure modes are identical:
 *   - `role="dialog"` + `aria-modal`, labelled by its own title.
 *   - Focus moves into the panel on open and returns to the trigger on close.
 *     The trigger here is a button that stays mounted, so the restore is
 *     simple — but it still has to happen, or closing drops focus to `<body>`,
 *     which is this project's most-repeated defect.
 *   - Tab cycles inside the panel; Escape closes it.
 *
 * `AnimatePresence` keeps the panel mounted through its exit transition, so
 * the focus restore is deferred a frame and skipped if something else has
 * already claimed focus — the same reasoning as `ConfirmDialog`'s own comment.
 */
export function SlideOverPanel({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus({ preventScroll: true })
    } else if (triggerRef.current) {
      const trigger = triggerRef.current
      const closingPanel = panelRef.current
      triggerRef.current = null
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
        'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled]), textarea:not([disabled])',
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
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            onKeyDown={trapKeys}
            /* Slides from the right edge. `x: '100%'` rather than a pixel
               offset so the same transition holds at the mobile full-width
               size and at the 480px desktop width. */
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-background shadow-float outline-none"
          >
            {/* The header is `purple-50`, matching the consumer-selected band
                this panel opens from — the two belong to the same selection. */}
            <div className="flex shrink-0 items-start justify-between gap-4 bg-purple-50 px-6 py-5">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-title text-ink">
                  {title}
                </h2>
                {subtitle && <p className="mt-1 text-caption text-ink-muted">{subtitle}</p>}
              </div>
              {/* 36px hit area, this app's own floor — a 24px icon button is
                  the gap Rounds 18 and 20 each caught once. */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close consumer details"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted outline-none transition-colors hover:bg-purple-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
