#!/usr/bin/env node
/**
 * Care2Sleep Consumer Portal — type scale contract check.
 *
 *   node docs/type-scale-check.mjs [path/to/consumer-tokens.css]
 *
 * Exits 0 when the scale is coherent, 1 with a report when it is not.
 * Wire it into CI. It takes about 30ms and it catches the class of defect
 * that is invisible in a screenshot.
 *
 * ── The contract it enforces ────────────────────────────────────────────────
 *
 *  1. RANGE      Every fluid token interpolates across the SAME viewport
 *                range, 375 -> 1200px. A token that finishes growing early
 *                crosses its neighbours somewhere in the middle, which is
 *                exactly where nobody looks.
 *  2. RANK       For any two tokens, if one is larger at 375 it is never
 *                smaller at 1200. Ties are fine; reversals are not. A scale
 *                that reorders itself between breakpoints is not a scale.
 *  3. FLOOR      Nothing renders below 16px at any width. This portal's
 *                audience is people with low digital literacy, many of them
 *                older; 16px is the floor, not a target.
 *  4. WEIGHT     Nothing heavier than 600.
 *  5. NO FLAT    A flat token inside a fluid scale is what breaks rule 2.
 *                If a token genuinely must not grow, add it to ALLOWED_FLAT
 *                below with the reason — do not silently widen the rule.
 *
 * Why 375 and 1200: the designs exist at those two widths and nowhere else.
 * Everything between them is interpolation, so it has to be governed by a
 * rule rather than drawn.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const FILE = process.argv[2] ?? fileURLToPath(new URL('../app/src/consumer-tokens.css', import.meta.url))
const MIN_W = 375
const MAX_W = 1200
const FLOOR = 16
const MAX_WEIGHT = 600

/** Tokens allowed to be flat, each with the reason it does not grow. */
const ALLOWED_FLAT = {
  'consumer-body': 'the reading size IS the floor; growing it would push every other step up',
  'consumer-body-strong': 'the same step at weight 600',
  'consumer-faq': 'an accordion label, deliberately one step above body at every width',
}

const css = readFileSync(FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const px = (term, w) =>
  term.split('+').reduce((sum, part) => {
    const t = part.trim()
    if (t.endsWith('rem')) return sum + parseFloat(t) * 16
    if (t.endsWith('vw')) return sum + (parseFloat(t) * w) / 100
    if (t.endsWith('px')) return sum + parseFloat(t)
    return sum
  }, 0)

const tokens = []
for (const [, name, value] of css.matchAll(/--text-(consumer-[a-z0-9-]+):\s*([^;]+);/g)) {
  if (/--(line-height|letter-spacing|font-weight)$/.test(name)) continue
  const clamp = value.trim().match(/^clamp\(([^,]+),([^,]+),([^)]+)\)$/)
  if (!clamp) {
    const flat = px(value, 0)
    tokens.push({ name, min: flat, max: flat, fluid: false, range: null })
    continue
  }
  const min = px(clamp[1], 0)
  const max = px(clamp[3], 0)
  const mid = clamp[2]
  const intercept = px(mid.replace(/[\d.]+vw/, '0px'), 0)
  const vw = parseFloat((mid.match(/([\d.]+)vw/) ?? [0, 0])[1])
  const range = vw
    ? [Math.round(((min - intercept) / vw) * 100), Math.round(((max - intercept) / vw) * 100)]
    : null
  tokens.push({ name, min, max, fluid: true, range })
}

const weights = Object.fromEntries(
  [...css.matchAll(/--text-(consumer-[a-z0-9-]+)--font-weight:\s*([^;]+);/g)].map(([, n, w]) => [n, parseInt(w, 10)]),
)

const fail = []
const at = (t, w) => t.min + (t.max - t.min) * Math.min(Math.max((w - MIN_W) / (MAX_W - MIN_W), 0), 1)

for (const t of tokens) {
  if (t.fluid && t.range && (t.range[0] !== MIN_W || t.range[1] !== MAX_W))
    fail.push(`RANGE   ${t.name} interpolates ${t.range[0]}->${t.range[1]}, not ${MIN_W}->${MAX_W}`)
  if (!t.fluid && !(t.name in ALLOWED_FLAT))
    fail.push(`NO FLAT ${t.name} is flat at ${t.min}px inside a fluid scale — add it to ALLOWED_FLAT with a reason, or give it a range`)
  if (t.min < FLOOR || t.max < FLOOR)
    fail.push(`FLOOR   ${t.name} renders ${Math.min(t.min, t.max)}px, below the ${FLOOR}px floor`)
  if (weights[t.name] > MAX_WEIGHT)
    fail.push(`WEIGHT  ${t.name} is ${weights[t.name]}, above ${MAX_WEIGHT}`)
}

for (let i = 0; i < tokens.length; i++)
  for (let j = i + 1; j < tokens.length; j++) {
    const a = tokens[i]
    const b = tokens[j]
    if ((a.min - b.min) * (a.max - b.max) < 0)
      fail.push(
        `RANK    ${a.name} (${a.min}->${a.max}) and ${b.name} (${b.min}->${b.max}) reverse rank between ${MIN_W} and ${MAX_W}`,
      )
  }

const widths = [375, 768, 1200, 1440]
console.log(`Care2Sleep consumer type scale — ${tokens.length} tokens\n`)
console.log('token'.padEnd(30) + widths.map((w) => String(w).padStart(9)).join('') + '   wt')
for (const t of [...tokens].sort((a, b) => a.min - b.min || a.max - b.max))
  console.log(
    t.name.padEnd(30) +
      widths.map((w) => at(t, w).toFixed(2).padStart(9)).join('') +
      String(weights[t.name] ?? '').padStart(5) +
      (t.fluid ? '' : '   (flat)'),
  )
console.log('\ndistinct rendered sizes per width:')
for (const w of widths)
  console.log(`  ${String(w).padStart(4)}: ${new Set(tokens.map((t) => +at(t, w).toFixed(2))).size}`)

if (fail.length) {
  console.error(`\n${fail.length} contract violation(s):\n`)
  for (const f of fail) console.error('  ' + f)
  process.exit(1)
}
console.log('\nScale is coherent: one interpolation range, no rank reversals, nothing below the floor.')
