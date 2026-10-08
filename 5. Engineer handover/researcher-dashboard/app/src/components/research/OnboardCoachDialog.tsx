import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { type Coach } from '@/data/research'
import { useResearch } from '@/data/research-context'

/**
 * "Onboard new coach" — moves a certified coach into the SPACES delivery
 * roster so they can start running consumer sessions. Opened from Coach
 * Management, either from the page CTA or from a row in the "Waiting to be
 * onboarded" tab.
 *
 * A **real write path**: confirming commits through the store's `inviteCoach`.
 * The caller supplies `eligibleCoaches` — certified coaches
 * (`certification.outcome === 'pass'`) not already in the SPACES roster — and
 * a coach disappears from the waiting tab the moment this completes.
 *
 * Two `ConfirmDialog`s in sequence, not one: picking a coach from the dropdown
 * must not itself be the point of no return, so a named "Onboard {name}?" step
 * gates the commit. That sequencing is exactly the two-step case
 * `ConfirmDialog`'s focus-restore is written to survive — see its note before
 * changing how these two swap `open`.
 *
 * ⚠️ `inviteCoach` writes `invitationStatus` and `joinedStatus` onto the new
 * `SpacesCoach` record, and **nothing in this package displays either field**.
 * Onboarding records a state no screen shows.
 *
 * Copy note: a coach has one dashboard throughout. Training unlocks a
 * training-portal link on it; this step unlocks running live consumer sessions
 * on the same dashboard. The body copy says that rather than implying a
 * separate portal is being activated.
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
  /** Preselects a coach when opened from that coach's own row. Without it a
   *  per-row CTA would ask the researcher to pick the same coach again from a
   *  dropdown. Falls back to the first of the pool. */
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
    // Deliberately keyed on `open` alone: re-seeding on every roster change
    // would reset a selection the researcher had already made.
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
