import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { type Coach } from '@/data/research'
import { useResearch } from '@/data/research-context'

/**
 * "Onboard new coach" — reuses the `confirm-dialog` chassis (design-tokens.md
 * §13 `coach-invite-dialog`) and the same coach-picker `<select>` pattern as
 * `TransferConsumerDialog`. Candidate pool is certified coaches
 * (certification.outcome === 'pass') who aren't already in the SPACES
 * roster — the Round 3 judgment call on open question 1 (see
 * round-3-…-prototype-plan.md decisions log).
 *
 * Round 21: this is now a **real write path**. It was built in Round 11 as a
 * walkthrough that only showed a success toast, which stopped being defensible
 * once Coach Management grew a "Waiting to be onboarded" tab with a per-row
 * "Onboard as coach" CTA — confirming appeared to do nothing, because the
 * coach stayed in the waiting list. Confirming now commits through the store's
 * `inviteCoach` action (which already existed and had no callers), so the
 * coach moves out of the waiting tab and into the active roster immediately.
 * The toast stays. Copy tightened via /design:ux-copy. A coach has one
 * dashboard throughout — training only unlocks a training-portal link on
 * it; this step is what unlocks running live consumer sessions on that
 * same dashboard, so the body copy says that directly rather than
 * implying a separate portal gets "activated".
 *
 * A second "Onboard {name}?" step (the same nested-ConfirmDialog pattern
 * as `AddCoachTraineeModal`'s discard confirmation) gates the actual
 * commit, so picking a coach from the dropdown isn't itself the
 * point of no return.
 */
export function OnboardCoachDialog({
  open,
  onClose,
  eligibleCoaches,
  initialCoachId,
}: {
  open: boolean
  onClose: () => void
  eligibleCoaches: Coach[]
  /** Preselects a coach when the dialog is opened from that coach's own row in
   *  the "Waiting to be onboarded" tab, rather than always defaulting to the
   *  first of the pool — a per-row CTA that then asked the researcher to pick
   *  the same coach again from a dropdown would be a step backwards. */
  initialCoachId?: string
}) {
  const { inviteCoach } = useResearch()
  const [selectedId, setSelectedId] = useState(initialCoachId ?? eligibleCoaches[0]?.id ?? '')
  const [confirmingCoach, setConfirmingCoach] = useState<Coach | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedId(initialCoachId ?? eligibleCoaches[0]?.id ?? '')
      setConfirmingCoach(null)
    }
    // only re-seed the selection when the dialog opens, not on every roster change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!confirmation) return
    const timer = window.setTimeout(() => setConfirmation(null), 4000)
    return () => window.clearTimeout(timer)
  }, [confirmation])

  return (
    <>
      <ConfirmDialog
        open={open && !confirmingCoach}
        title="Onboard new coach"
        body="This lets the coach start running consumer sessions from their dashboard."
        confirmLabel="Onboard coach"
        cancelLabel="Cancel"
        confirmDisabled={eligibleCoaches.length === 0}
        onConfirm={() => {
          const match = eligibleCoaches.find((c) => c.id === selectedId)
          if (!match) return
          setConfirmingCoach(match)
        }}
        onClose={onClose}
      >
        {eligibleCoaches.length === 0 ? (
          <p className="text-caption text-ink-faint">
            No certified coaches are waiting to be onboarded.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="onboard-coach-select" className="text-fine text-ink-faint">
              Coach
            </label>
            <div className="relative">
              <select
                id="onboard-coach-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="h-9 w-full appearance-none rounded-sm border border-hairline bg-card pr-9 pl-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              >
                {eligibleCoaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
              />
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={open && !!confirmingCoach}
        title={`Onboard ${confirmingCoach?.fullName ?? ''}?`}
        body="They'll be able to start running consumer sessions from their dashboard."
        confirmLabel="Onboard coach"
        cancelLabel="Go back"
        onConfirm={() => {
          if (!confirmingCoach) return
          inviteCoach(confirmingCoach.id)
          setConfirmation(`${confirmingCoach.fullName} has been onboarded.`)
          setConfirmingCoach(null)
          onClose()
        }}
        onClose={() => setConfirmingCoach(null)}
      />

      {confirmation && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-[60] mx-auto w-fit max-w-[90vw] rounded-full bg-ink px-5 py-3 text-caption font-semibold text-white shadow-card"
        >
          {confirmation}
        </div>
      )}
    </>
  )
}
