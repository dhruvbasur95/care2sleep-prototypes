/**
 * button-guard — a source-level gate that finds hand-written buttons.
 *
 * ## Why this exists
 *
 * The app has ONE button definition (`components/shared/buttonSystem.ts`, reached
 * through `components/ui/button.tsx`). A screen can either ask that file for a
 * button, or hand-paint one by writing the classes out. Both look the same on
 * screen. Only the first one follows along when the definition changes.
 *
 * That difference is not visible, and it has already cost two rounds:
 *
 * - Round 67 fixed the consumer hover inside the button system. **No consumer
 *   screen used the button system**, so the fix reached nothing. Nobody could
 *   tell by looking — the hand-written copies had been typed to match.
 * - The copies carried `hover:opacity-90`, which fades the element instead of
 *   repainting the fill, so the same button hovered to a different hex on every
 *   card it sat on (#4E19B5 on the canvas, #4B15B5 on the lavender diary card,
 *   against a resting #3A00AD) — all LIGHTER, walking the white label's contrast
 *   from 11.78:1 down to 9.84:1.
 *
 * Measured 2026-10-14 by this script, before the first migration round: **82
 * hand-written buttons, 81 of them distinct recipes**, in five different heights (32 · 36 ·
 * 40 · 44 · 48) where the system defines two (40 app, 48 consumer).
 *
 * ## What it is for
 *
 * Migrating the existing 60 is a one-off. This script is the part that makes it
 * stick: it turns "is the app consistent?" from a question somebody has to go
 * and measure into a number anyone can read in two seconds.
 *
 * ## How to run it
 *
 *   npm run guard:buttons          # report, always exits 0
 *   npm run guard:buttons -- --ci  # fails if the count went UP since BASELINE
 *   npm run guard:buttons -- --list  # every finding with its class string
 *
 * `--ci` is a RATCHET, not a pass/fail bar. The count is allowed to fall and
 * never to rise, which is what lets the migration land portal by portal without
 * the guard blocking a half-finished app. Lower BASELINE as each round lands.
 *
 * ## What counts as a finding
 *
 * An interactive element (`<button>`, `<a>`, `<Link>`, `<NavLink>`,
 * `<motion.button>`) whose own opening tag carries BOTH a pill radius
 * (`rounded-full` · `rounded-3xl` · `rounded-[28px]`) AND an explicit height
 * (`h-8`…`h-14`, `size-9`…`size-12`) — and which does not reach the button
 * system. Plus any module-scope string constant that is a button recipe by the
 * same test.
 *
 * Requiring an interactive tag is what keeps status chips, avatars, progress
 * tracks and decorative circles out of the result: they are round, but they are
 * not controls. Requiring an explicit height is what keeps out the chips that
 * size themselves with `py-*`.
 *
 * ## Deliberate exceptions
 *
 * Two controls are documented 36px/48px exceptions in CLAUDE.md and are NOT
 * defects. They are listed in ALLOWLIST below rather than silently skipped, so
 * the reason travels with the exception. To add one, put the reason in the file
 * — an exception without a stated reason is how a defect becomes a convention.
 *
 * A one-off can also be waived at the call site with a comment on the line
 * above or the same line:
 *
 *   {\/* button-guard-ignore: reason this one cannot use the system *\/}
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const SRC = join(ROOT, 'src')

/**
 * The count at the last landed round. `--ci` fails only when the real count is
 * HIGHER than this. Lower it as each portal migrates; never raise it.
 */
const BASELINE = 24

/**
 * Documented exceptions, with the reason each one is not a defect.
 * Keyed by path suffix so a file move does not silently re-arm the exception.
 */
const ALLOWLIST = [
  {
    file: 'components/shared/TablePager.tsx',
    why: 'CLAUDE.md, direct instruction 2026-10-09: the pager keeps a 36px hit area to match the Figma frames. It is the one surviving 36px step; it clears WCAG 2.2 2.5.8 (24px) and this project’s own control floor. Do not "correct" it to 40.',
  },
  {
    file: 'components/shared/NeedHelpButton.tsx',
    why: 'CLAUDE.md: 153x48 radius 28, a deliberate exception to the 40px app height. It is the same physical control in all three portals, and splitting it by surface is exactly what let the four earlier copies drift.',
  },
]

/**
 * ⚠️ No trailing `\b` after the bracket form. `\brounded-\[28px\]\b` never
 * matches: `]` is a non-word character and so is the space that follows it, so
 * there is no boundary between them. The probe caught it — the guard was blind
 * to every `rounded-[28px]` control, which is the Consumer Portal's own radius
 * and therefore most of what it exists to find.
 */
const PILL = /\b(rounded-full|rounded-3xl)\b|rounded-\[28px\]/
/**
 * ⚠️ The leading `(?<![\w-])` is load-bearing. `\bh-9\b` matches INSIDE
 * `min-h-9`, because the boundary between `-` and `h` is a word boundary — so
 * the first run reported a draggable column chip in `ConsumerDetailPage` that
 * carries `min-h-9`, a floor rather than a fixed height, and is not a CTA at
 * all. A minimum height is not the system's business; a fixed one is.
 */
const HEIGHT = /(?<![\w-])(h-8|h-9|h-10|h-11|h-12|h-14|size-9|size-10|size-11|size-12)\b/
/** Any reference to the shared system — direct, or through its named shortcuts. */
const ON_SYSTEM =
  /\b(btn\(|buttonVariants|CONSUMER_PILL_|PILL_PRIMARY|PILL_OUTLINE|GHOST_BUTTON|OUTLINE_FILLED_BUTTON|HELP_BUTTON|<Button\b)/
const IGNORE = /button-guard-ignore/

/**
 * Shapes the five-axis system does not express, and should not be asked to.
 * These are NOT buttons that drifted — they are different controls that happen
 * to be round, and forcing them onto `btn()` would mean overriding most of what
 * it emits, which is a worse call site than the one it replaced.
 *
 * - **A toggle** (`aria-pressed`, `role="tab"`, `role="switch"`) has two paints
 *   that swap on state. The system has `state`, but it means hover/deactive,
 *   not selected — a segmented control is its own component
 *   (`components/shared/SegmentedSwitch.tsx` already is one).
 * - **A control underlined at REST is a link**, not a ghost button — CLAUDE.md
 *   and WCAG 1.4.1 both say leave it alone. `ghost`'s underline is a *hover*
 *   treatment, so migrating one of these would delete the only thing marking it
 *   as a link.
 *
 * ⚠️ Icon discs are deliberately NOT excluded. The system has `size: 'icon'`
 * (40) and `icon-lg` (48), so a round icon button IS expressible; only the 44px
 * ones need a decision. Excluding them would hide real drift.
 */
const NOT_A_BUTTON = /aria-pressed|role="(tab|switch)"/
const UNDERLINED_AT_REST = /(?<!hover:)\bunderline\b/
/** A string constant is a button recipe only if it also looks like a control. */
const CONTROL_HINT = /\b(focus-visible:|outline-none|transition-)/

const TAGS = ['<button', '<a ', '<a\n', '<Link', '<NavLink', '<motion.button']

const args = new Set(process.argv.slice(2))
const CI = args.has('--ci')
const LIST = args.has('--list')

/** Every .tsx under src/, depth-first. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.tsx')) out.push(full)
  }
  return out
}

/**
 * From the index of an opening tag, return the text of that tag only — up to
 * the `>` that closes it, ignoring any `>` inside a nested brace expression
 * (`className={cn(a > b)}`) or inside a quoted string.
 */
function openingTag(src, start) {
  let depth = 0
  let quote = null
  for (let i = start; i < src.length && i < start + 4000; i++) {
    const c = src[i]
    if (quote) {
      if (c === quote && src[i - 1] !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '>' && depth === 0) return src.slice(start, i + 1)
  }
  return src.slice(start, start + 4000)
}

const lineOf = (src, index) => src.slice(0, index).split('\n').length

/** The line itself and the one above it, for an ignore comment. */
function waived(src, index) {
  const lines = src.slice(0, index).split('\n')
  const here = src.split('\n')[lines.length - 1] ?? ''
  const above = lines[lines.length - 2] ?? ''
  return IGNORE.test(here) || IGNORE.test(above)
}

const findings = []
const allowed = []

for (const file of walk(SRC)) {
  const rel = relative(SRC, file).split(sep).join('/')
  const src = readFileSync(file, 'utf8')
  const exception = ALLOWLIST.find((a) => a.file.endsWith(rel) || rel.endsWith(a.file))
  const hits = []
  /** Character spans of the tags already reported, so pass 2 cannot re-count them. */
  const counted = []

  // Pass 1 — interactive elements whose own tag paints a pill.
  for (const tag of TAGS) {
    let i = src.indexOf(tag)
    while (i !== -1) {
      const open = openingTag(src, i)
      // ⚠️ Record the span whenever it LOOKS like a control, including when it
      // already reaches the system. A migrated call site is
      // `cn(buttonVariants(...), 'h-12 … rounded-[28px] …')` — the override
      // string on its own carries a pill radius, a height and a transition, so
      // pass 2 re-reported every control this round had just fixed. The
      // element pass is the authority on the whole tag; pass 2 only exists for
      // recipes that live outside one.
      if (PILL.test(open) && HEIGHT.test(open)) {
        // Adjudicated either way: record the span BEFORE deciding, so pass 2
        // cannot re-report this element's own class string as a loose recipe.
        // The probe caught exactly that — a toggle the element pass correctly
        // skipped came back through the second pass, because `aria-pressed`
        // lives on the element and is invisible to a bare string.
        counted.push([i, i + open.length])
        if (
          !ON_SYSTEM.test(open) &&
          !NOT_A_BUTTON.test(open) &&
          !UNDERLINED_AT_REST.test(open) &&
          !waived(src, i)
        ) {
          hits.push({ line: lineOf(src, i), kind: 'element', text: open.replace(/\s+/g, ' ').slice(0, 160) })
        }
      }
      i = src.indexOf(tag, i + 1)
    }
  }

  // Pass 2 — a button recipe parked in a string constant and used via className.
  //
  // ⚠️ Dedupe by character SPAN, not by line proximity. An element's own
  // `className={cn('…')}` string starts several lines after the `<button`, so
  // the first run double-counted every multi-line control — `UpcomingSessionsPanel`
  // once as the element at :131 and again as its class string at :135.
  for (const m of src.matchAll(/(['"`])((?:[^'"`\\]|\\.){40,600}?)\1/g)) {
    const text = m[2]
    if (!PILL.test(text) || !HEIGHT.test(text) || !CONTROL_HINT.test(text)) continue
    if (ON_SYSTEM.test(text) || NOT_A_BUTTON.test(text) || UNDERLINED_AT_REST.test(text)) continue
    // A module-scope constant built as `cn(buttonVariants(...), '…overrides…')`
    // puts the override string outside any element tag, so pass 1 never sees
    // it and the string alone looks like a loose recipe. Look back a short way
    // for the system call that owns it. 240 chars covers a formatted cn() with
    // its arguments on separate lines without reaching an unrelated one.
    if (ON_SYSTEM.test(src.slice(Math.max(0, m.index - 240), m.index))) continue
    if (waived(src, m.index)) continue
    if (counted.some(([a, b]) => m.index >= a && m.index < b)) continue
    hits.push({ line: lineOf(src, m.index), kind: 'recipe', text: text.replace(/\s+/g, ' ').slice(0, 160) })
  }

  if (!hits.length) continue
  if (exception) allowed.push({ rel, count: hits.length, why: exception.why })
  else findings.push({ rel, hits })
}

// ---- report ----------------------------------------------------------------

const total = findings.reduce((n, f) => n + f.hits.length, 0)
const recipes = new Set(findings.flatMap((f) => f.hits.map((h) => h.text))).size

const byPortal = {}
for (const f of findings) {
  const portal = f.rel.split('/').slice(0, 2).join('/')
  byPortal[portal] = (byPortal[portal] ?? 0) + f.hits.length
}

console.log('\n  Hand-written buttons — not reaching the button system\n')
if (!total) {
  console.log('  None. Every control in the app reads one definition.\n')
} else {
  for (const [portal, n] of Object.entries(byPortal).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(3)}  ${portal}`)
  }
  console.log(`\n    ${total} hand-written, ${recipes} distinct recipes.`)
  console.log(`    Baseline ${BASELINE}. ${total > BASELINE ? `UP ${total - BASELINE}` : total < BASELINE ? `down ${BASELINE - total} — lower BASELINE in this file` : 'unchanged'}.`)
}

if (LIST && total) {
  console.log('')
  for (const f of findings) {
    console.log(`  ${f.rel}`)
    for (const h of f.hits) console.log(`    :${String(h.line).padEnd(4)} ${h.kind === 'recipe' ? '[const] ' : ''}${h.text}`)
  }
}

if (allowed.length) {
  console.log('\n  Documented exceptions, not counted:')
  for (const a of allowed) console.log(`    ${a.rel} (${a.count}) — ${a.why.slice(0, 96)}…`)
}

console.log(
  total
    ? `\n  Fix one by importing { Button } or { buttonVariants } from '@/components/ui/button'.\n  Run with --list to see every finding.\n`
    : '',
)

if (CI && total > BASELINE) {
  console.error(`  FAIL: ${total - BASELINE} hand-written button(s) added since the baseline.\n`)
  process.exit(1)
}
