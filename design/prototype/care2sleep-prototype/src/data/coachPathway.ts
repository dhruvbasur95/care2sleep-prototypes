/**
 * The COACH pathway stages the trainee dashboard's rail draws.
 *
 * This lives in `data/` rather than in `DeliveryHomePage` because two surfaces
 * need it and one of them cannot import that page: the import chain runs
 * `DeliveryHomePage -> DeliveryShell -> DeliveryOnboarding`, so the onboarding
 * flow reaching back for the page's own constant would close a cycle. This is
 * the same constraint Round 32 hit when the tour needed the stage count.
 *
 * Any surface that states how many stages there are must read
 * `PATHWAY_STAGE_COUNT_WORD` rather than writing a number. Round 32 found the
 * Figma frames saying "five stages" over a rail that drew six, and Round 31
 * found "Complete all five stages" above a six-stage rail — the same sentence
 * wrong twice, because it was authored instead of derived.
 */

export interface PathwayStageCopy {
  /** "Stage 1:" — the eyebrow above the label. */
  stage: string
  label: string
}

export const PATHWAY_STAGE_COPY: PathwayStageCopy[] = [
  { stage: 'Stage 1:', label: 'Content Learning' },
  { stage: 'Stage 2:', label: 'Guided Group Practice' },
  { stage: 'Stage 3:', label: 'Peer Role-Play' },
  { stage: 'Stage 4:', label: 'Hands-on Assessment' },
  { stage: 'Stage 5:', label: 'My Reflection' },
  { stage: 'Stage 6:', label: 'Live Intervention' },
]

const COUNT_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'] as const

/** The stage count as a word, for prose. Falls back to the digits past seven. */
export const PATHWAY_STAGE_COUNT_WORD: string =
  COUNT_WORD[PATHWAY_STAGE_COPY.length] ?? String(PATHWAY_STAGE_COPY.length)

/**
 * The stage labels as a sentence list, lower-cased for mid-sentence use:
 * "content learning, guided group practice, ... and live intervention".
 *
 * Derived so the onboarding screen that names the stages cannot list a set the
 * rail does not draw — it previously named five stages ("active simulation",
 * "community feedback") that appear nowhere in the pathway.
 */
export const PATHWAY_STAGE_SENTENCE: string = (() => {
  const names = PATHWAY_STAGE_COPY.map((s) => s.label.toLowerCase())
  const last = names[names.length - 1]
  return `${names.slice(0, -1).join(', ')}, and ${last}`
})()
