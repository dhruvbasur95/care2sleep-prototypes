/**
 * The Consumer Portal's site footer — frame `988:9113`.
 *
 * A dark band carrying the Monash University lockup and an Acknowledgement of
 * Country, over a hairline rule.
 *
 * ── Where it appears, and where it deliberately does not ──────────────────
 *
 * Three surfaces only — Home, My Modules and Need Help (direct instruction:
 * "this footer only shows on home, module, need help pages"). `ConsumerShell`
 * takes `showFooter` and defaults it **off**, so this is opt-in per page rather
 * than opt-out: three of the portal's six surfaces carry it, and a default of
 * `true` would silently hand one to every flow built later.
 *
 * The three that do not are not an oversight:
 *   - **My Profile** is the fourth page and was not named.
 *   - **The sleep diary** and **a module's inner pages** are *flows*, not pages.
 *     Both run full-bleed with their own chrome (the module's bar and footer
 *     are direction-aware, appearing on scroll), and a second, darker footer
 *     underneath that is two competing page-bottoms.
 *
 * ── The type size is this project's rule, not the frame's ─────────────────
 *
 * ⚠️ The frame sets this copy at **12px/500**. It renders here at **16px/400**,
 * because the Consumer Portal's scale has a hard floor of 16px and a ceiling of
 * weight 600 (CLAUDE.md), and that floor is not a stylistic preference — this
 * portal's audience note is explicit that its readers are not digitally
 * literate and need plain language and large targets. 12px would be, by some
 * margin, the smallest text anywhere in the portal.
 *
 * The weight drops 500 -> 400 with it: 500 at 12px is compensating for the
 * size, and at 16px over four lines it reads heavier than the body copy above
 * it without meaning anything by it.
 *
 * Say the word if the frame's 12 is wanted instead — it is a one-line change,
 * and it is recorded here rather than silently taken either way.
 */
import { CONSUMER_PAGE_GUTTER } from '@/components/consumer/ConsumerShell'
import { cn } from '@/lib/utils'

/**
 * The Acknowledgement of Country, verbatim from the frame.
 *
 * ⚠️ **Institutional copy — do not paraphrase, reflow or "tighten" it.** The
 * one change from the frame is the trailing space after "emerging.", which is a
 * Figma text-node artefact rather than punctuation.
 */
const ACKNOWLEDGEMENT =
  'Our team acknowledge the traditional custodians of the land on which we live, gather and work. ' +
  'We recognise their continuing connection to land, water and community. ' +
  'We pay respect to Elders past, present and emerging.'

export function ConsumerFooter() {
  return (
    /*
     * `role="contentinfo"` comes free from `<footer>` only while it is not
     * nested inside another sectioning element. It renders as the last child of
     * `<main>` here — see `ConsumerShell` — so the role is stated explicitly
     * rather than assumed.
     */
    <footer role="contentinfo" className="bg-consumer-footer w-full">
      {/*
        ⚠️ **No `mx-auto max-w-[1320px]`, so this band matches `ConsumerHeader`
        exactly** (direct instruction: "align header and footer", after "footer
        side padding still not matching as used in header").

        The padding was never the problem and changing it did not fix this. The
        header bar is full-bleed with a gutter, so its contents start at the
        gutter; the footer was additionally capped at 1320 and centred, so at
        1600 its bar began at x=140 and the Monash lockup landed at **220
        against the header logo's 80** — a 140px step between the two bands that
        frame every page, and it grows with the viewport.

        The trade, stated rather than hidden: page *content* is still capped at
        1320, so above ~1480 the footer now aligns with the header rather than
        with the content column above it. Header and footer are the two
        full-bleed bands and the frame the page sits in, which is the pair that
        was asked to agree.
      */}
      <div className={cn('pt-10 pb-12', CONSUMER_PAGE_GUTTER)}>
        <div className="flex flex-col gap-8">
          {/*
            The frame's `988:9121` rule: 1px `#F1F1F1` at 50% opacity. A
            `<div>` with a border rather than the exported `<img>` — it is a
            straight line, and an asset for one would be an asset to keep in
            step with a colour for no gain. It is decorative (the gap already
            separates the band from the page above it), so it carries no
            `<hr>` semantics.
          */}
          <div aria-hidden="true" className="bg-consumer-footer-ink/50 h-px w-full" />

          {/*
            `items-start` and `justify-between` are the frame's. Below `lg` the
            row stacks: at 375 the logo and a 650px paragraph cannot share a
            line, and the acknowledgement is the half that must stay readable.
          */}
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:justify-between">
            {/*
              A **real downloaded brand mark**, exported from the frame and
              committed to `public/logos/` — the one narrow, pre-existing
              exception to this project's never-hand-draw-an-icon rule (Round
              6.1.1), and the same folder the Gmail/Calendar/Zoom logos live in.
              Never redraw or substitute a lucide glyph for this.

              Sized at the frame's own 107.39 x 30.924. `shrink-0` because it is
              a logo: it may not be squeezed by the paragraph beside it.
            */}
            <img
              src="/logos/monash-university.svg"
              alt="Monash University"
              width={107}
              height={31}
              className="h-[30.924px] w-[107.39px] shrink-0"
            />

            {/*
              The frame fixes this at 650px. A max-width rather than a width, so
              it gives the space back when the row stacks. See the type note in
              the file header for why this is 16px and not the frame's 12.
            */}
            <p className="text-consumer-body text-consumer-footer-ink lg:max-w-[650px]">
              {ACKNOWLEDGEMENT}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
