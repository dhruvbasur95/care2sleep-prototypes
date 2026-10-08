import { useEffect, useRef, useState } from 'react'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'

/**
 * "Opt out of the study" — the trainee's own withdrawal request.
 *
 * **Red throughout** (direct instruction), and the one card on this page that
 * is not purple. That is the point: everything above it changes a preference,
 * this one ends a coach's participation in a research study, and it should not
 * look like a sibling of "Notification preferences".
 *
 * The tint is `destructive` composited rather than a new red ramp — this
 * palette has exactly one red (`--destructive` `#d70015`) plus the unrelated
 * `alert-pastel`, and inventing a three-step scale for a single card would put
 * colours in the system that nothing else can use. `/5` on the body and `/10` on
 * the header give two distinguishable warm greys-of-red over white while leaving
 * the `destructive` text well clear of AA.
 *
 * Opting out is gated by a confirmation and is **not reversible from here**: the
 * card swaps to a standing acknowledgement, because the next step is a
 * conversation with a supervisor, not another button.
 */
export function OptOutCard() {
  const [confirming, setConfirming] = useState(false)
  const [optedOut, setOptedOut] = useState(false)
  const doneRef = useRef<HTMLParagraphElement>(null)

  // Focus has to land on the acknowledgement, and it has to land there *after*
  // the dialog is completely gone.
  //
  // The button that opened the dialog unmounts with this state change, so
  // `ConfirmDialog`'s focus-restore has nothing to return to — its `.focus()` on
  // a detached node is a no-op and leaves focus on the closing panel, which then
  // unmounts and drops it to `<body>`. Measured: one `requestAnimationFrame` was
  // not enough, `document.activeElement` was still the panel.
  //
  // So this waits out the panel's own 200ms exit rather than racing it. A
  // timeout keyed on the state change, not a frame count.
  useEffect(() => {
    if (!optedOut) return
    const t = window.setTimeout(() => doneRef.current?.focus(), 300)
    return () => window.clearTimeout(t)
  }, [optedOut])

  function confirm() {
    setOptedOut(true)
    setConfirming(false)
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden rounded-lg border-destructive/30 py-0">
        <div className="bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1">
              {/* `ink`, not `destructive`. Red-on-red measured **4.51:1** here
                  — `#d70015` against the painted `rgb(251,230,232)` band — which
                  clears AA by 0.01, and 22px/500 is not WCAG "large text" (that
                  needs 24px, or 18.66px bold), so 4.5 is the real requirement.
                  A heading whose legibility depends on a rounding error is not
                  worth the shout, especially in a card whose whole job is to be
                  read carefully. The red is carried by the icon, both bands, the
                  border and the button instead — the card still reads red at a
                  glance, and this also matches every other card title on the
                  page, which is `ink`. */}
              <h2 className="font-display text-title text-ink">Opt out of the study</h2>
              <p className="text-caption text-ink-muted">
                Leaving the Care2Sleep study means you'll stop your training and won't be assigned
                clients.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-destructive/20 bg-destructive/5 p-6">
          {optedOut ? (
            <div className="flex items-start gap-3">
              <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
              {/* `role="status"` so the change is announced, `tabIndex={-1}` so
                  focus can land here once the button it replaced is gone. */}
              <p
                ref={doneRef}
                role="status"
                tabIndex={-1}
                className="text-body leading-[1.4] text-ink outline-none"
              >
                Your supervisor has been notified, they will be in touch with you shortly.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-caption text-ink-muted">
                Your supervisor will be notified and will talk it through with you first.
              </p>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-destructive px-[18px] text-caption-medium text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
              >
                Opt out of the study
              </button>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirming}
        title="Opt out of the study?"
        body="Your supervisor will be notified straight away. You can talk it through with them before anything changes."
        confirmLabel="Opt out"
        cancelLabel="Stay in the study"
        destructive
        onConfirm={confirm}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}
