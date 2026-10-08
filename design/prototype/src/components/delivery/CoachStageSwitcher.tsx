import { FlaskConical } from 'lucide-react'
import { setCoachStage, useCoachStage, type CoachStage } from '@/data/coachStage'
import { cn } from '@/lib/utils'

const OPTIONS: { id: CoachStage; label: string }[] = [
  { id: 'trainee', label: 'Trainee' },
  { id: 'coach', label: 'Coach' },
]

/**
 * Floating demo-state control, bottom-right of the Coach Delivery Portal
 * (Round 29, direct instruction: "I add a simple use case switcher bottom
 * right corner").
 *
 * It flips the whole portal between the two stages a single coach passes
 * through — trainee (no caseload yet) and certified coach (delivering). It is
 * a **review tool, not product chrome**, and is labelled that way rather than
 * dressed up as a real setting: nothing in the study lets a coach choose their
 * own stage. If this prototype ever gains a real certification write path,
 * this control should be deleted, not repurposed.
 *
 * `fixed` + a high `z-index` so it stays reachable over the sticky sidebar and
 * header. It is a real `radiogroup` with roving arrow keys — this project has
 * shipped a hand-rolled `role="radiogroup"` without that contract once already
 * (`WeekdayPicker`, fixed in Round 14.5), so the pattern is done properly here
 * rather than re-learned.
 */
export function CoachStageSwitcher() {
  const stage = useCoachStage()

  return (
    <div className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-full border border-parchment bg-card py-2 pr-2 pl-4 shadow-card">
      <span className="flex items-center gap-2 text-fine text-ink-muted">
        <FlaskConical aria-hidden="true" className="size-4" />
        Demo view
      </span>
      <div
        role="radiogroup"
        aria-label="Demo view: coach stage"
        className="flex items-center gap-1 rounded-full bg-pearl p-1"
      >
        {OPTIONS.map((o, i) => {
          const selected = stage === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setCoachStage(o.id)}
              onKeyDown={(e) => {
                if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
                e.preventDefault()
                const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
                setCoachStage(OPTIONS[(i + dir + OPTIONS.length) % OPTIONS.length].id)
              }}
              className={cn(
                'h-9 rounded-full px-4 text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
