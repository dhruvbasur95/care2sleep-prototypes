import { SIPTEA_BG, SIPTEA_NAMES, type SipteaInitial } from '@/data/siptea'

/**
 * One SIPTEA component as a chip — the `siptea-banner` node in frame
 * `3214:19765`, shown under `Skills covered:` once a case scenario answer is in.
 *
 * A 44-radius pill split into two halves: a coloured cap carrying the white
 * initial, and a white body carrying the component's name.
 *
 * ## The colour and the name both come from `data/siptea.ts`
 * Not from the frame, and not from module.md. The frame's own chip is labelled
 * `Emotional Navigation` and module.md's Tags column writes
 * `Emotion Navigation`; CLAUDE.md's terminology table says
 * `Emotion navigation`. Three spellings of one component is exactly the drift
 * the mapping module exists to end, so the initial is the only thing read from
 * the content and everything else is looked up.
 *
 * ## Contrast
 * White on `siptea-p` (golden amber) measures **2.04:1** and fails even the
 * 3:1 large-text bar — the same failure the SIPTEA colour table flags.
 * Deliberately left as drawn (direct instruction, 2026-09-28: *"ignore the
 * contrast check for SIPTEA labels"*). The name beside it is `ink` on white at
 * 16.1:1, so the component is never identified by the initial alone — which is
 * what makes leaving it defensible rather than merely instructed.
 *
 * The initial is `aria-hidden`: it is the first letter of the word immediately
 * beside it, and a screen reader announcing "S, Shared understanding" is
 * reading the same thing twice.
 */
export function SipteaSkillChip({ initial }: { initial: SipteaInitial }) {
  return (
    <span className="inline-flex items-stretch overflow-hidden rounded-[44px] border border-hairline bg-white shadow-siptea-chip">
      <span
        aria-hidden="true"
        className={`flex w-16 shrink-0 items-center justify-center py-2 text-display-sm text-white ${SIPTEA_BG[initial]}`}
      >
        {initial}
      </span>
      <span className="flex items-center py-2 pl-4 pr-6 text-body-md text-ink">
        {SIPTEA_NAMES[initial]}
      </span>
    </span>
  )
}

/**
 * The `Skills covered:` group inside an answer outcome.
 *
 * Renders nothing at all when a case carries no tags, rather than an empty
 * heading — every Module 6 case has at least one, but the field is authored in
 * a free-text column and an empty cell is a real possibility.
 */
export function SipteaSkillsCovered({ skills }: { skills: SipteaInitial[] }) {
  if (skills.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sub-greeting leading-[1.4] text-ink">Skills covered:</p>
      {/* `flex-wrap`, not the frame's fixed 3-up row: a case can carry one tag
          or three, and the frame's own row already wraps its third chip onto a
          second line at the panel width it was drawn at. */}
      <ul className="flex list-none flex-wrap gap-4 p-0">
        {skills.map((initial) => (
          <li key={initial}>
            <SipteaSkillChip initial={initial} />
          </li>
        ))}
      </ul>
    </div>
  )
}
