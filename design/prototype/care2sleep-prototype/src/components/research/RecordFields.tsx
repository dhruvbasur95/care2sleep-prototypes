import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The app-scale "title + text field" record row, and the one place its skin
 * lives.
 *
 * ## Why this exists
 * Direct instruction, 2026-09-21: *"update the detail fields, use title + text
 * field component as we have done for consumer details page. Update this
 * everywhere, wherever we have profile details."*
 *
 * The reference is `components/consumer/ConsumerPersonCard.tsx` — the Consumer
 * Portal's own My Profile card, rebuilt in Round 46 from frame `961:7913`. Its
 * shape is a **label above a filled `pearl` box with a matching 1px stroke**,
 * laid out two to a row, where reading and editing differ only by the box being
 * typeable. Before this, every researcher-side profile surface drew an inline
 * `Label .......... value` line instead, and there were four hand-rolled copies
 * of it (consumer record, trainee record, SPACES coach record, My Profile) plus
 * two in the coach portal.
 *
 * ## Why this is a *new* component rather than an import of `ConsumerPersonCard`
 * CLAUDE.md is explicit in both directions: the Consumer Portal is on its own
 * type scale and brand and nothing app-wide may leak into it, and
 * `ConsumerPersonCard` is consumer-only by design — *"If a researcher surface
 * ever needs one again, build it there rather than re-sharing this."* So the
 * **shape** is copied and the **values** are this app's own:
 *
 *   labels    `consumer-body-strong` 16/600 -> `caption-medium` 14/500
 *   values    `body` 16/400                 -> `caption` 14/400
 *   controls  `h-12` 48px                   -> `h-9` 36px, the app's floor
 *   focus     `ring-consumer-primary`       -> `ring-ring`
 *
 * `pearl` (`#f5f5f7`) is deliberate and is the *same* fill the reference uses.
 * CLAUDE.md warns that `pearl` is a cool grey that reads as a foreign patch on
 * the warm `#fffcfa` page canvas — every caller here sits inside a white
 * `Card`, which is exactly where that rule says `pearl` belongs.
 */

/** The read-mode value box. Looks like a field, is not one. */
export const RECORD_VALUE_BOX =
  'flex min-h-9 items-center rounded-sm border border-pearl bg-pearl px-3 py-2 text-caption break-words text-ink'

/** The edit-mode control, same skin, actually typeable. A real focus ring: the
 *  `pearl`-on-`pearl` field has no other visible focus affordance. */
export const RECORD_INPUT =
  'h-9 w-full rounded-sm border border-pearl bg-pearl px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/** Multi-line variant — `Background`, `Comorbidities` and friends are
 *  sentences, not values, and clipping them to 36px loses the point of them. */
export const RECORD_TEXTAREA =
  'w-full rounded-sm border border-pearl bg-pearl px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/** `appearance-none` so the native chrome does not fight the `pearl` skin;
 *  `pr-8` leaves room for the caret drawn by `RecordSelect` below. */
export const RECORD_SELECT = `${RECORD_INPUT} appearance-none pr-8`

export const RECORD_LABEL = 'text-caption-medium text-ink'

/**
 * The field grid both modes share. Written once so a card cannot read at three
 * columns and edit at two.
 *
 * **Two across** (direct instruction, 2026-09-21: *"all sub fields in a 3x3
 * stack"*, corrected moments later to *"or 2x2 stack actually"*). A third
 * column was built and reverted: at two columns the eight short fields on a
 * person card land as a clean four-by-two block, whereas three left a ragged
 * two-cell gap before the narrative fields below. One column on a phone.
 *
 * `min-w-0` on the container and the cells because a long email is precisely
 * the child that would otherwise size the track — CLAUDE.md's standing rule,
 * which has produced a real horizontal page scroll three times.
 */
export const RECORD_GRID = 'grid min-w-0 grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'

/** Spans every column — for the narrative fields (Background, Comorbidities,
 *  Own health conditions), which read as broken columns at half width. Kept
 *  beside `RECORD_GRID` so the two can never disagree about how many columns
 *  there are. */
export const RECORD_GRID_FULL = 'sm:col-span-2'

export interface RecordFieldItem {
  key: string
  label: string
  /** Rendered inside the value box. A node, not a string, so a chip or a link
   *  can sit in a row without the caller forking the whole list. */
  value: ReactNode
  /** Spans every grid column — for sentence fields (Background, Comorbidities)
   *  and for anything whose value would otherwise wrap inside a half-width
   *  box. Put these **last** in the list: a spanning item mid-grid pushes
   *  itself to the next full row and leaves the cells before it empty. */
  full?: boolean
}

/**
 * Read-mode field list. A real `<dl>`/`<dt>`/`<dd>`, per CLAUDE.md's standing
 * rule that every label/value pair is proper description-list semantics — the
 * value box is styling on the `<dd>`, never a replacement for it.
 */
export function RecordFieldList({
  fields,
  className,
}: {
  fields: RecordFieldItem[]
  className?: string
}) {
  return (
    <dl className={cn(RECORD_GRID, className)}>
      {fields.map((f) => (
        <div
          key={f.key}
          className={cn('flex min-w-0 flex-col gap-2', f.full && RECORD_GRID_FULL)}
        >
          <dt className={RECORD_LABEL}>{f.label}</dt>
          <dd className={RECORD_VALUE_BOX}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Edit-mode label + control wrapper, so the label typography and the 8px
 *  label-to-control gap cannot drift from the read view beside it. */
export function RecordFieldShell({
  id,
  label,
  full,
  children,
}: {
  id: string
  label: string
  full?: boolean
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', full && RECORD_GRID_FULL)}>
      <label htmlFor={id} className={RECORD_LABEL}>
        {label}
      </label>
      {children}
    </div>
  )
}

/** Single-line text/email/tel/number field. */
export function RecordInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  full,
  inputRef,
  ...rest
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  full?: boolean
  /** Handed to the `<input>` itself. Named `inputRef` rather than `ref`
   *  because this is a plain function component, not a `forwardRef` one — and
   *  it is load-bearing, not a convenience: `SpacesCoachProfilePage` focuses
   *  this field on entering edit mode, which is half of the fix for the
   *  focus-falls-to-`<body>` defect this project has shipped in six separate
   *  rounds. Dropping it while restyling the card would have reintroduced it
   *  silently. */
  inputRef?: React.Ref<HTMLInputElement>
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange' | 'type'>) {
  return (
    <RecordFieldShell id={id} label={label} full={full}>
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={RECORD_INPUT}
        {...rest}
      />
    </RecordFieldShell>
  )
}

/** Multi-line field. */
export function RecordTextarea({
  id,
  label,
  value,
  onChange,
  rows = 3,
  full = true,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  full?: boolean
}) {
  return (
    <RecordFieldShell id={id} label={label} full={full}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={RECORD_TEXTAREA}
      />
    </RecordFieldShell>
  )
}

/** Fixed-choice field — Yes/No, dementia type, and the like. A real `<select>`
 *  rather than a hand-rolled listbox: this project has shipped a
 *  `role="radiogroup"` without its keyboard contract twice (Round 14.5's
 *  `WeekdayPicker`, and the enrolment wizard's consumer-type step), and a
 *  native control cannot make that mistake. */
export function RecordSelect({
  id,
  label,
  value,
  onChange,
  options,
  full,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  full?: boolean
}) {
  return (
    <RecordFieldShell id={id} label={label} full={full}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={RECORD_SELECT}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {/* Drawn rather than left to the native caret, which `appearance-none`
            removes. `aria-hidden` because the `<select>` already announces
            itself as a combobox. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -mt-1 size-0 border-x-4 border-t-[5px] border-x-transparent border-t-ink-faint"
        />
      </div>
    </RecordFieldShell>
  )
}

/** Escape hatch for a caller that needs `Fragment`-level control over a mixed
 *  row set while keeping the grid. Exported so no caller re-types the grid
 *  classes. */
export { Fragment as RecordFragment }
