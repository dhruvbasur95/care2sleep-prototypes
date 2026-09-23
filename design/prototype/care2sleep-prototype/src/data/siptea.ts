/**
 * The SIPTEA components and their colours.
 *
 * Source of truth is the **"SIPTEA color table"** frame (`2614:1044`) on the
 * Figma block library page, added 2026-09-16 by direct instruction. The hexes
 * live in `index.css` as `--color-siptea-*`; this module owns the *mapping*
 * from a component's initial to its colour, its name, and the rule for telling
 * a SIPTEA component apart from a practice skill.
 *
 * Any surface that colours a SIPTEA component reads this — do not re-declare a
 * palette at a call site. That is the drift `ProfileDetailsSections` and
 * `coachPathway.ts` both exist to prevent.
 */

export const SIPTEA_INITIALS = ['S', 'I', 'P', 'T', 'E', 'A'] as const
export type SipteaInitial = (typeof SIPTEA_INITIALS)[number]

/** Tailwind colour classes per component. Written out in full rather than
 *  built by interpolation — Tailwind scans source text, so a class assembled
 *  at runtime (`bg-siptea-${k}`) emits no CSS at all. */
export const SIPTEA_BG: Record<SipteaInitial, string> = {
  S: 'bg-siptea-s',
  I: 'bg-siptea-i',
  P: 'bg-siptea-p',
  T: 'bg-siptea-t',
  E: 'bg-siptea-e',
  A: 'bg-siptea-a',
}

/**
 * One skill as authored in module.md's "Core skills covered" list.
 *
 * module.md writes a SIPTEA component as `"S - Shared Understanding"` and a
 * practice skill as a bare name (`"Open Questions"`), so the split is **read
 * from the authored string**, never from a position in the list or a count.
 * That matters: chapter 1 names three components, chapter 2 five, chapter 3
 * all six, and the prose sentence that announces them ("all three parts of the
 * SIPTEA framework") is template copy, not something module.md supplies.
 */
export type ChapterSkill =
  | { kind: 'component'; initial: SipteaInitial; name: string; raw: string }
  | { kind: 'practice'; name: string; raw: string }

/**
 * ⚠️ The single capital letter is load-bearing. `"Building Rapport -
 * Positivity, Coordination"` also contains " - " and is NOT a component, which
 * is why this anchors on exactly one character from the SIPTEA set rather than
 * splitting on the dash.
 */
const COMPONENT_RE = /^([SIPTEA]) [-—] (.+)$/

export function classifySkill(raw: string): ChapterSkill {
  const match = COMPONENT_RE.exec(raw.trim())
  if (!match) return { kind: 'practice', name: raw, raw }
  return { kind: 'component', initial: match[1] as SipteaInitial, name: match[2], raw }
}

export function splitChapterSkills(skills: string[]) {
  const classified = skills.map(classifySkill)
  return {
    components: classified.filter((s) => s.kind === 'component') as Extract<
      ChapterSkill,
      { kind: 'component' }
    >[],
    practice: classified.filter((s) => s.kind === 'practice'),
  }
}
