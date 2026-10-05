import {
  SIPTEA_BG,
  SIPTEA_INITIALS,
  SIPTEA_NAMES,
  resolveSipteaInitial,
  type SipteaInitial,
} from '@/data/siptea'
import { cn } from '@/lib/utils'

/**
 * One SIPTEA reflection, as a two-column table: component, answer.
 *
 * **The app's single rendering of a reflection** (Round 55). Before this there
 * were four, all of the same object:
 *
 *   1. the trainee wizard's review — coloured disc + name, per-row Edit
 *   2. the coach wizard's review — `"S: Shared understanding"` + a live textarea
 *   3. the coach's saved-reflection viewer — the same table in a read-only mode
 *   4. the researcher's dialog — a bespoke `<dl>` with 180px `primary` labels
 *
 * Direct instruction, 2026-10-05, with an annotated screenshot of (1):
 * *"Streamline review screen, make it similar to how trainee review screen
 * is"*, and *"when the researchers gets to see coaches reflections, use same
 * template, but there should be no edit button"*. So all four are this.
 *
 * ## ⚠️ This supersedes a Round 39 instruction, deliberately
 * The coach's review was moved **to** in-place textareas in Round 39, away from
 * a per-row Edit that jumped back a step, on the reasoning that *"correcting a
 * sentence should not mean leaving the screen you noticed it on."* The 2026-10-05
 * instruction moves it back. That is a reversal, not a refactor, and it is
 * recorded here rather than quietly applied — if the in-place editor is wanted
 * again, this is the comment that says it once existed and why.
 *
 * ## Rows are data, not positions
 * The caller passes rows. It does **not** pass a bare `answers[]` to be labelled
 * from `SIPTEA_NAMES` positionally, because the two stored label shapes in the
 * seed (`'S: Shared understanding'` and a bare `'Shared understanding'`) would
 * then render a constant over positional data — correct only for as long as
 * every stored entry happens to hold six components in SIPTEA order. `fromStored`
 * below reads the component back off its own label instead.
 *
 * ## A known `layout-audit.js` false positive travels with this
 * `layout-audit.js`'s FIFTH CALIBRATION records that the disc-plus-name `<th>`
 * reports as "wrapped onto 3 lines" on all six rows: the check reads descendant
 * rect-tops, and the 24px disc and the 17px name sit at different y inside one
 * flex row. Measured, each name is a single 17px rect. Sharing this markup
 * extends that false positive to every caller — which is the cost of one
 * rendering, and is preferred to four.
 */

export interface ReflectionRow {
  /** `null` for a stored label this app no longer recognises — the label is
   *  rendered as-is, with no colour disc, rather than guessing a component. */
  initial: SipteaInitial | null
  name: string
  answer: string
}

/** Rows for a reflection being **written** — six, in SIPTEA order, from the
 *  wizard's own answer array. */
export function rowsFromAnswers(answers: string[]): ReflectionRow[] {
  return SIPTEA_INITIALS.map((initial, i) => ({
    initial,
    name: SIPTEA_NAMES[initial],
    answer: answers[i] ?? '',
  }))
}

/** Rows for a reflection being **read back** from the store, whose labels were
 *  written by whichever version of the wizard was live at the time. */
export function rowsFromStored(
  components: { label: string; answer: string }[],
): ReflectionRow[] {
  return components.map((c) => {
    const initial = resolveSipteaInitial(c.label)
    return {
      initial,
      name: initial ? SIPTEA_NAMES[initial] : c.label,
      answer: c.answer,
    }
  })
}

export function ReflectionReviewTable({
  rows,
  /** Present on a wizard's own review screen, absent everywhere a saved
   *  reflection is read. Its absence is what makes this read-only — there is
   *  no separate flag, so a viewer cannot accidentally be given an editor. */
  onEdit,
  /** What the answer column is called. Defaults to the trainee wizard's own
   *  wording, which is the one the screenshot settled. */
  answerHeading = 'Your answer',
  /** Shown in place of an empty answer. A wizard says "not yet"; a saved
   *  record says it was left blank, which is final rather than pending. */
  emptyLabel = 'Not answered yet.',
}: {
  rows: ReflectionRow[]
  onEdit?: (index: number) => void
  answerHeading?: string
  emptyLabel?: string
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-parchment shadow-card">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-purple-50">
            <th scope="col" className="w-[34%] px-4 py-3.5 text-caption-medium text-ink-muted">
              SIPTEA component
            </th>
            <th scope="col" className="px-4 py-3.5 text-caption-medium text-ink-muted">
              {answerHeading}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.name}-${i}`} className={cn(i > 0 && 'border-t border-hairline')}>
              {/* A row header, not a plain cell — the component is what the
                  answer is *about*, which is what `scope="row"` tells a screen
                  reader reading across. */}
              <th
                scope="row"
                className="px-4 py-3 text-left align-top text-caption-medium font-medium text-ink"
              >
                <span className="flex items-center gap-2">
                  {row.initial && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-fine text-white',
                        SIPTEA_BG[row.initial],
                      )}
                    >
                      {row.initial}
                    </span>
                  )}
                  {/* `min-w-0`: a flex child defaults to `min-width: auto`, so
                      without it the name cannot wrap inside its own box and
                      pushes the row instead. */}
                  <span className="min-w-0">{row.name}</span>
                </span>
              </th>
              <td className="px-4 py-3 align-top">
                <p className="text-caption whitespace-pre-line text-ink">
                  {row.answer.trim() || <span className="text-ink-faint">{emptyLabel}</span>}
                </p>
                {/* Editing goes back to the question's own screen rather than
                    opening a field here — see the supersession note above. */}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(i)}
                    className="-mx-2 mt-1 inline-flex h-9 items-center rounded-sm px-2 text-caption-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Edit
                    <span className="sr-only"> {row.name}</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
