import type { LucideIcon } from 'lucide-react'

/**
 * The four-step row under a wizard's welcome heading — icon disc, label, one
 * line of description, joined by a hairline.
 *
 * Extracted from `AddAnnotationSummaryModal` at its second caller, the goal
 * setting modal (2026-11-09). The metrics are that file's, and the arithmetic
 * behind them still holds: four columns at **160px with a 32px gap** fit the
 * 920px wizard panel's ~836px content box, and the connector inset is half a
 * column (**80px**) so the line ends at each end circle's centre.
 *
 * `items-stretch` because the descriptions differ in length, and `min-w-0` on
 * the row and its cells because fixed columns otherwise size the track to the
 * widest child and push the document into horizontal scroll.
 */
export function WizardWelcomeSteps({
  steps,
}: {
  steps: { Icon: LucideIcon; label: string; description: string }[]
}) {
  return (
    <div className="relative isolate">
      {/* Hidden on the stacked layout: a horizontal rule joining vertically
          stacked steps points at nothing. */}
      <span
        aria-hidden="true"
        className="absolute top-[27px] right-[80px] left-[80px] -z-10 hidden h-0.5 bg-hairline min-[880px]:block"
      />
      <ol className="flex min-w-0 flex-col items-center gap-8 min-[880px]:flex-row min-[880px]:items-stretch min-[880px]:justify-center min-[880px]:gap-8">
        {steps.map(({ Icon, label, description }) => (
          <li
            key={label}
            className="flex w-full min-w-0 max-w-[280px] flex-col items-center gap-4 min-[880px]:w-[160px] min-[880px]:max-w-none"
          >
            <span
              aria-hidden="true"
              className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-purple-50 text-primary"
            >
              <Icon className="size-6" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-balance text-body-md text-ink">{label}</p>
              <p className="text-balance text-caption text-ink-muted">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
