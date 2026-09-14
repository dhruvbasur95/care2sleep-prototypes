import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The reason an inert control is inert, shown on hover — Round 47, direct
 * instruction: "when I try to click it, there is a hover deactive icon that we
 * show, swap that", and "on hover show the reason".
 *
 * So this **replaces** `cursor: not-allowed`, which is the problem it solves
 * rather than a companion to it: that cursor says "no" and nothing about why,
 * in a glyph the browser draws and this project cannot word. The control keeps
 * a normal cursor and says the sentence instead. It is a hover tip and nothing
 * else — an earlier pass put the same sentence permanently under the button and
 * that was rejected twice, in both places it appeared.
 *
 * ── Hover, and the two things hover is not ────────────────────────────────
 *
 * - **Focus too.** `onFocusCapture`/`onBlurCapture` on the wrapper, so a
 *   keyboard reader who tabs onto the blocked control gets what a mouse reader
 *   gets. The button also carries `aria-describedby` pointing here, so a screen
 *   reader hears it whether or not the tip is painted.
 * - **Tap too.** There is no hover on a phone, and this portal's audience is
 *   the reason that matters. A touch on an `aria-disabled` button still fires a
 *   real `click`, so the tip opens on that as well and closes on the next
 *   pointer down outside it. Without this the sentence would be invisible to
 *   most of the people it was written for.
 *
 * ── Two ways this can get stuck open, both closed ─────────────────────────
 *
 * 1. **When the control unblocks.** The wrapper does not unmount, so `open`
 *    would survive into a state that has nothing to explain — measured once
 *    with the footer's tip still painted after Continue had advanced a stage.
 *    With no `reason` the tip is not rendered at all, and the effect resets the
 *    flag so it cannot reappear when a later screen blocks again.
 * 2. **On touch.** There is no `mouseleave` to close it, hence the outside
 *    `pointerdown` listener, attached only while it is open.
 */
export function BlockedHint({
  id,
  reason,
  align = 'center',
  className,
  children,
}: {
  id: string
  /** A full sentence, or empty when the control is not blocked — in which case
   *  this renders nothing but a layout wrapper around its child. */
  reason?: string
  align?: 'center' | 'end'
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [reason])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  if (!reason) return <span className={cn('flex', className)}>{children}</span>

  return (
    <span
      ref={ref}
      className={cn('relative flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
      onClick={() => setOpen(true)}
    >
      {children}
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        // `hidden` rather than an opacity fade: a tip animated to `opacity: 0`
        // stays in the accessibility tree, which is the standing rule this
        // project wrote after animating `height: 0` and leaving the content
        // focusable. `hidden` gives `display: none`, so nothing needs `inert`.
        className={cn(
          'absolute bottom-full z-30 mb-2 w-max max-w-[260px] rounded-lg bg-ink px-3 py-2 text-body text-white shadow-card',
          /*
           * `center` is centre-on-the-button only from 768 up. Below it the tip
           * anchors to the button's right edge instead — measured at 375, a
           * 260px tip centred on the footer's Finish (which sits right of the
           * viewport centre, because Go back takes the left) ran from 142 to
           * 402 against a 375 viewport and was cut off. Anchoring right keeps it
           * whole without a JS clamp.
           */
          align === 'center'
            ? 'right-0 text-left min-[768px]:right-auto min-[768px]:left-1/2 min-[768px]:-translate-x-1/2 min-[768px]:text-center'
            : 'right-0 text-left',
        )}
      >
        {reason}
      </span>
    </span>
  )
}
