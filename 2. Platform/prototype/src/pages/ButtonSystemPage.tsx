import { useState } from 'react'
import { ArrowRight, Check, Plus, Trash2 } from 'lucide-react'
import {
  BUTTON_STATES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
  btn,
  hasButtonPaint,
  type ButtonSize,
  type ButtonSurface,
  type ButtonTone,
  type ButtonVariant,
} from '@/components/shared/buttonSystem'

/**
 * The button system spec page — `/button-system`.
 *
 * Direct instruction, 2026-10-07: *"share here first in browser"* and *"first
 * create a separate instance do not amend, or fix currently deployed version"*.
 * So this page renders the **proposed** system from `buttonSystem.ts`, which
 * nothing shipped imports. The deployed buttons are untouched.
 *
 * Every swatch calls `btn(...)` — the same function a real call site would —
 * rather than restating class strings, so the page cannot drift from the system
 * it documents. The `hover` column is the system's own `state: 'hover'`, not a
 * hand-written approximation, which is also how Figma's `State=Hover` variants
 * would be generated.
 */

const TONE_NOTE: Record<ButtonTone, string> = {
  brand: 'The default. Every ordinary action.',
  destructive: 'Withdraw, delete, opt out.',
  success: 'Confirming a completed state.',
  neutral: 'A quiet action beside a louder one.',
  inverse: 'On a brand-coloured band only.',
  ink: 'Consumer only — a CTA on cover art.',
}

/**
 * The hit-area guide.
 *
 * Direct instruction, 2026-10-07: *"for ghost can you show me dotted imaginary
 * outline to make sure there is padding?"* — a fair question, because a ghost
 * button is the one variant whose box you cannot see, and this project has
 * shipped a 17px and a 22px target before now.
 *
 * Drawn with CSS `outline`, deliberately: an outline is painted outside the
 * border box and takes **no layout space**, so what you see is the button's
 * real geometry rather than a wrapper approximating it. An inline style rather
 * than a class because the base sets `outline-none`, and two unprefixed
 * outline utilities would be resolved by stylesheet order — the same collision
 * that made the secondary hover paint white.
 */
const GUIDE: React.CSSProperties = { outline: '1px dashed rgba(109,109,109,0.55)' }

function Swatch({
  variant,
  tone,
  size,
  surface,
  icon,
  guide,
}: {
  variant: ButtonVariant
  tone: ButtonTone
  size?: ButtonSize
  surface: ButtonSurface
  icon?: boolean
  guide?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      {BUTTON_STATES.map((state) => (
        <button
          key={state}
          type="button"
          aria-disabled={state === 'deactive' || undefined}
          onClick={(e) => state === 'deactive' && e.preventDefault()}
          style={guide ? GUIDE : undefined}
          className={btn({ variant, tone, state, size, surface })}
        >
          {icon && <Plus aria-hidden="true" className="size-4" strokeWidth={2.25} />}
          Button
          {state === 'deactive' && <span className="sr-only"> (unavailable)</span>}
        </button>
      ))}
    </div>
  )
}

function VariantBlock({
  variant,
  surface,
  guide,
}: {
  variant: ButtonVariant
  surface: ButtonSurface
  guide?: boolean
}) {
  const tones = BUTTON_TONES.filter((t) => hasButtonPaint(surface, variant, t))
  const onBand = tones.filter((t) => t === 'inverse')
  const onWhite = tones.filter((t) => t !== 'inverse')

  return (
    <section className="overflow-hidden rounded-lg border border-parchment bg-card shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 bg-purple-50 p-6">
        <h3 className="font-display text-title capitalize">{variant}</h3>
        <p className="text-caption text-ink-muted">
          {variant === 'primary' && 'Solid fill. One per view — the thing you want pressed.'}
          {variant === 'secondary' && 'A 1px stroke on its own white fill. The common case.'}
          {variant === 'ghost' && 'Label alone. Hover is an underline and nothing else.'}
        </p>
      </div>

      <div className="border-t border-hairline">
        <div className="grid grid-cols-[150px_1fr] items-center gap-x-6 border-b border-hairline px-6 py-3">
          <p className="text-fine text-ink-faint">Tone</p>
          <div className="flex items-center gap-3">
            {BUTTON_STATES.map((s) => (
              <p key={s} className="w-[108px] text-fine text-ink-faint capitalize">
                {s}
              </p>
            ))}
          </div>
        </div>

        {onWhite.map((tone) => (
          <div
            key={tone}
            className="grid grid-cols-[150px_1fr] items-center gap-x-6 border-b border-hairline px-6 py-4 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="text-caption-medium text-ink capitalize">{tone}</p>
              <p className="mt-0.5 text-fine text-ink-faint">{TONE_NOTE[tone]}</p>
            </div>
            <Swatch variant={variant} tone={tone} surface={surface} guide={guide} />
          </div>
        ))}

        {onBand.length > 0 && (
          <div className="grid grid-cols-[150px_1fr] items-center gap-x-6 bg-primary px-6 py-4">
            <div className="min-w-0">
              <p className="text-caption-medium text-white">Inverse</p>
              <p className="mt-0.5 text-fine text-white/70">{TONE_NOTE.inverse}</p>
            </div>
            <Swatch variant={variant} tone="inverse" surface={surface} guide={guide} />
          </div>
        )}
      </div>
    </section>
  )
}

export function ButtonSystemPage() {
  // Defaults ON: the question this page has to answer first is whether a ghost
  // button has a real target, and you cannot see that without the guide.
  const [guide, setGuide] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1100px] px-10 py-14">
        <header className="mb-10">
          <p className="text-fine text-ink-faint">Proposed · not yet wired into any shipped surface</p>
          <h1 className="mt-2 font-display text-display-md text-primary">Button system</h1>
          <p className="mt-3 max-w-[70ch] text-body text-ink-muted text-balance">
            Three variants, and colour as an axis rather than a variant. This replaces fifteen
            Figma styles and fifty distinct class signatures measured in the researcher pages
            alone.
          </p>
          <label className="mt-5 inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-parchment bg-card px-4 py-2.5 shadow-card">
            <input
              type="checkbox"
              checked={guide}
              onChange={(e) => setGuide(e.target.checked)}
              className="size-4 rounded-xs border-hairline"
            />
            <span className="text-caption-medium text-ink">Show hit area</span>
            <span className="text-fine text-ink-faint">
              dashed outline = the button&rsquo;s real box, padding included
            </span>
          </label>
        </header>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            ['variant', 'primary · secondary · ghost', 'The weight.'],
            ['tone', 'brand · destructive · success · neutral · inverse', 'The colour. Not a variant.'],
            ['state', 'static · hover · deactive', "Mirrors Figma's own State axis."],
          ].map(([k, v, note]) => (
            <div key={k} className="rounded-lg border border-parchment bg-card p-5 shadow-card">
              <p className="font-mono text-fine text-primary">{k}</p>
              <p className="mt-1.5 text-caption-medium text-ink">{v}</p>
              <p className="mt-1 text-fine text-ink-faint">{note}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-4 font-display text-title text-ink">App surface</h2>
        <p className="mb-5 max-w-[70ch] text-caption text-ink-muted">
          Researcher, coach and trainee portals. Pill radius, 14/500 label, one height: 40.
        </p>
        <div className="flex flex-col gap-8">
          {BUTTON_VARIANTS.map((v) => (
            <VariantBlock key={v} variant={v} surface="app" guide={guide} />
          ))}
        </div>

        {/* Sizes */}
        <h2 className="mt-14 mb-4 font-display text-title text-ink">Sizes</h2>
        <p className="mb-5 max-w-[70ch] text-caption text-ink-muted">
          One height per surface: 40 for the three staff portals, 48 for the Consumer Portal. The old
          32 / 36 / 44 spread is gone. 40 clears the former 36px floor and WCAG 2.2&rsquo;s 24px
          minimum. An icon-only control is square, which is a shape, not a style.
        </p>
        <div className="rounded-lg border border-parchment bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-6">
            {(
              [
                ['md', '40 · researcher, trainee, coach'],
                ['lg', '48 · consumer'],
              ] as [ButtonSize, string][]
            ).map(([size, note]) => (
              <div key={size} className="flex flex-col gap-2">
                <button type="button" className={btn({ variant: 'primary', size })}>
                  Continue
                  <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} />
                </button>
                <p className="text-fine text-ink-faint">{note}</p>
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button type="button" aria-label="Add" className={btn({ variant: 'secondary', size: 'icon' })}>
                  <Plus aria-hidden="true" className="size-4" strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  className={btn({ variant: 'secondary', tone: 'destructive', size: 'icon' })}
                >
                  <Trash2 aria-hidden="true" className="size-4" strokeWidth={2.25} />
                </button>
              </div>
              <p className="text-fine text-ink-faint">icon · square</p>
            </div>
          </div>
        </div>

        {/* Icon slot */}
        <h2 className="mt-14 mb-4 font-display text-title text-ink">With and without an icon</h2>
        <p className="mb-5 max-w-[70ch] text-caption text-ink-muted">
          A slot, not a variant — the base reserves the 8px gap and the call site supplies the
          glyph. There is no separate icon style.
        </p>
        <div className="rounded-lg border border-parchment bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            {BUTTON_VARIANTS.map((variant) => (
              <div key={variant} className="flex items-center gap-3">
                <button type="button" className={btn({ variant })}>
                  Mark complete
                </button>
                <button type="button" className={btn({ variant })}>
                  <Check aria-hidden="true" className="size-4" strokeWidth={2.25} />
                  Mark complete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Consumer surface */}
        <h2 className="mt-14 mb-4 font-display text-title text-ink">Consumer surface</h2>
        <p className="mb-5 max-w-[70ch] text-caption text-ink-muted">
          A separate axis, not a theme override. The Consumer Portal never emits{' '}
          <code className="font-mono text-fine">--primary</code>,{' '}
          <code className="font-mono text-fine">text-caption-*</code> or{' '}
          <code className="font-mono text-fine">ring-ring</code> — that rule is about provenance,
          not the painted colour, and this is what stops them leaking back in through a button.
        </p>
        <div className="flex flex-col gap-8">
          {BUTTON_VARIANTS.map((v) => (
            <VariantBlock key={v} variant={v} surface="consumer" guide={guide} />
          ))}
        </div>

        {/* What it replaces */}
        <h2 className="mt-14 mb-4 font-display text-title text-ink">What it replaces</h2>
        <div className="overflow-hidden rounded-lg border border-parchment bg-card shadow-card">
          <table className="w-full text-left">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-6 py-3 text-fine text-ink-faint">Old Figma style</th>
                <th className="px-6 py-3 text-fine text-ink-faint">Becomes</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Filled', 'primary · brand'],
                ['Destructive', 'primary · destructive'],
                ['Success', 'primary · success'],
                ['White filled / Quick action', 'primary · inverse'],
                ['Outline', 'secondary · brand'],
                ['Outline filled', 'secondary · brand'],
                ['Destructive outline + “r8”', 'secondary · destructive'],
                ['White outline', 'secondary · inverse'],
                ['Utility', '— removed'],
                ['Utility outline', 'secondary · neutral'],
                ['Ghost / Ghost icon', 'ghost · size icon'],
                ['Locked', 'state: deactive'],
              ].map(([from, to]) => (
                <tr key={from} className="border-t border-hairline">
                  <td className="px-6 py-3 text-caption text-ink">{from}</td>
                  <td className="px-6 py-3 font-mono text-fine text-primary">{to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-[70ch] text-caption text-ink-muted">
          <strong className="text-ink">Utility has no replacement on purpose.</strong> It was a grey
          <code className="mx-1 font-mono text-fine">#f5f5f7</code> fill at an 8px radius — a cool
          grey on a warm canvas, and the one treatment that made the same action look different on
          every page. Its call sites become <code className="font-mono text-fine">secondary</code>.
        </p>
      </div>
    </div>
  )
}
