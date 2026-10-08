import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { type Coach } from '@/data/research'
import { useResearch } from '@/data/research-context'

/**
 * "Transfer to another coach" — the hand-off action for when a coach is no
 * longer participating in the study (or any other reassignment reason) and
 * their consumer needs a new coach (Round 3.1). Candidate pool is other
 * joined, still-participating SPACES coaches — passed in by the caller so
 * this stays a plain presentational dialog.
 */
export function TransferConsumerDialog({
  open,
  onClose,
  dyadId,
  dyadTitle,
  eligibleCoaches,
}: {
  open: boolean
  onClose: () => void
  dyadId: string
  dyadTitle: string
  eligibleCoaches: Coach[]
}) {
  const { transferDyad } = useResearch()
  const [targetId, setTargetId] = useState(eligibleCoaches[0]?.id ?? '')

  return (
    <ConfirmDialog
      open={open}
      title={`Transfer ${dyadTitle}?`}
      body="Choose the coach who will take over this consumer's SPACES delivery. Session history, health data, and reflections stay with the consumer."
      confirmLabel="Transfer consumer"
      cancelLabel="Cancel"
      onConfirm={() => {
        if (!targetId) return
        transferDyad(dyadId, targetId)
        onClose()
      }}
      onClose={onClose}
    >
      {eligibleCoaches.length === 0 ? (
        <p className="text-caption text-ink-faint">
          No other joined coach is available to transfer to right now.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor="transfer-target-coach" className="text-fine text-ink-faint">
            New coach
          </label>
          <div className="relative">
            <select
              id="transfer-target-coach"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="h-9 w-full appearance-none rounded-sm border border-hairline bg-card pr-9 pl-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            >
              {eligibleCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} · {c.employer}
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
  )
}
