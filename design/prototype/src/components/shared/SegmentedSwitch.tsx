import { useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * A pill-shaped segmented control — **buttons, not tabs** (direct instruction,
 * Round 39).
 *
 * The distinction is not only visual. This page already carries two underline
 * tab rows above this point (the page's own sticky row, and `FitbitSyncMonitor`'s
 * PLE/Carer row inside the panel), so a third underline row would have been the
 * same mark at a third level. A filled segmented control reads as a *view
 * switch* rather than another level of navigation.
 *
 * Still `role="tablist"` underneath, because that is what it does behaviourally
 * — one of N views, arrow-key addressable, with the panel wired by
 * `aria-controls`. The instruction was about the button styling, and giving a
 * view switch a different visual treatment is not a reason to hand a screen
 * reader a worse model of it.
 *
 * Extracted to `components/shared/` at its second caller (the researcher's own
 * Fitbit / Sleep diary switch on the consumer and coach record pages). It began
 * local to the Coach Delivery Portal's client detail page; copying it across
 * would have set running exactly the drift `ProfileDetailsSections` was created
 * to end.
 *
 * Roving tabindex + arrow keys are implemented here rather than borrowed:
 * `UnderlineTabs` already does this correctly, but its whole value is the
 * sliding underline this control is specifically not supposed to have, so
 * adding a "no underline, filled pills instead" flag would switch off the
 * behaviour that makes it right for its other callers.
 */
export function SegmentedSwitch<T extends string>({
  options,
  active,
  onChange,
  ariaLabel,
  idPrefix,
  panelId,
}: {
  options: readonly { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  ariaLabel: string
  idPrefix: string
  panelId: string
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next: number
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % options.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + options.length) % options.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = options.length - 1
    else return
    e.preventDefault()
    onChange(options[next].id)
    btnRefs.current[next]?.focus()
  }

  return (
    /* `p-1` on a tinted track, so the selected pill sits *inside* a visible
       trough rather than floating — that trough is what makes an unselected
       segment read as a control at rest instead of plain text.

       The track is `purple-50` on a `purple-200` stroke, **not** `parchment`
       (direct instruction: "light grey behind yellow background not visible").
       That is this project's own documented trap: `parchment` is a cool grey
       and the page canvas is the warm `#fffcfa`, so the two composite to almost
       nothing — the trough was in the DOM and invisible on screen, which is the
       same "a class exists therefore the state exists" mistake Round 28
       recorded for a `primary/5` hover. Purple also ties the track to the
       selected pill's own `primary` fill rather than introducing a third
       neutral. */
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-purple-200 bg-purple-50 p-1"
    >
      {options.map((o, i) => {
        const selected = o.id === active
        return (
          <button
            key={o.id}
            ref={(el) => {
              btnRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-${o.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            /* `h-9` is the app's control floor, and `shrink-0` with it — a
               flex child at a fixed height still compresses below the floor
               without it (Round 21 shipped a 31px CTA exactly this way). */
            /* No icon (direct instruction). The two labels already say what
               they are, and a glyph per segment competed with the fill that
               carries the selected state. */
            className={cn(
              'inline-flex h-9 shrink-0 items-center rounded-full px-4 text-caption-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              selected
                ? 'bg-primary text-white'
                : 'bg-transparent text-ink-muted hover:bg-card hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
