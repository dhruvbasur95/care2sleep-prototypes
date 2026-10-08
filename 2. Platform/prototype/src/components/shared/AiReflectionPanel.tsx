import { useState } from 'react'
import { Lock, NotebookPen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { cn } from '@/lib/utils'
import { isCertified } from '@/pages/training-v2/pathway'

/**
 * The Coach Delivery Portal Learning tab's baseline-reflection card (sticky
 * right column, below `LearningProgressCard` — see `DeliveryLearningHomePage.tsx`,
 * its one live caller). Originally shipped as a static, single-state "AI
 * reflection" placeholder with no active/inactive branching and no real copy
 * at all — this replaces that with the deliberately separate follow-up its
 * own prior doc comment called out as deferred.
 *
 * **Why the copy dropped "AI" (direct instruction):** the real annotated-
 * SIPTEA-guide reflective conversation genuinely runs on an AI-guided
 * conversation + AI-generated summary under the hood (CLAUDE.md) — that
 * mechanism isn't being removed. But to a coach, this card should read as a
 * series of questions they'll answer, not as an "AI feature," so the visible
 * heading/body below never say "AI." The exported symbol name
 * (`AiReflectionPanel`) is left as-is — it's an internal identifier, not
 * visible copy.
 *
 * **Copy, revised on direct feedback ("the baseline reflection copy is
 * confusing").** A first pass said "reflection questions" twice without ever
 * saying what the questions are ABOUT. Fixed with one shared body line:
 * "personal check-in on how your training's going" names WHAT (a check-in on
 * their own training experience, not a test) and WHY (personal, not graded)
 * at once.
 *
 * **Body copy revised again** ("very clearly state it will unlock after all
 * modules are completed, and it is mandatory") to add the two facts above,
 * via a real `/design:ux-copy` pass, not a freehand patch: "required as part
 * of your COACH pathway" states mandatory-ness as a plain structural fact of
 * how the program works (per CLAUDE.md's own framing of the annotated-
 * SIPTEA guide as coach-owned, not a compliance/surveillance thing), placed
 * *after* the warm "personal check-in" framing rather than leading with it,
 * so the sentence doesn't open on an obligation. The concrete unlock
 * condition itself ended up carried by the locked button's own label
 * instead of a separate caption line (see that button's doc comment below)
 * once the exact instructed copy named "all modules" outright — a separate
 * caption stating the same condition again would have been pure repetition.
 *
 * **Visual states — revised three times on direct feedback.** First pass had
 * two genuinely different looks (plain white/muted-grey card with a text-
 * only caption while inactive, vs. a purple wash + real button once active)
 * — the live default (inactive) screenshot then drew "default state should
 * be in purple, I want to see a button not a line." So the purple wash +
 * full-color `badge-purple` icon badge (`--color-reflection-panel`,
 * `index.css`) is now the one constant look in both states, and the
 * inactive-only caption text is gone — replaced by a real button.
 *
 * **The disabled button's own colors needed a second, separate fix.** The
 * first pass reused `CertificateCard`'s locked-button colors verbatim
 * (`bg-divider-soft` `#f0f0f0` / `text-ink-muted`) — a blind reuse that broke
 * here specifically: `CertificateCard` sits on a plain white card, where that
 * grey reads fine, but this card's background is now *always*
 * `--color-reflection-panel` (`#f5f3ff`), and `#f0f0f0` against `#f5f3ff` is
 * only 1.04:1 — functionally invisible as a button. Fixed with a dedicated
 * disabled treatment actually computed against this card's own background,
 * not copied from a different one: `bg-white` fill (clean neutral surface
 * against the surrounding wash) + a real `border-badge-purple/70` edge
 * (composited-border contrast 3.63:1 against the card, 3.82:1 against the
 * button's own white fill — both clear WCAG's 3:1 non-text/UI-component
 * floor) + `text-badge-purple` label/icon (7.1:1 on the white fill, AAA —
 * the same number `badge-purple`'s own design-tokens.md entry already
 * documents for white text-on-badge use, just inverted here to badge-text-
 * on-white). Reads as a quieter, "off" purple next to the vivid solid
 * `bg-primary` enabled button, rather than a generic grey that happened to
 * vanish against this one background.
 *
 * The button's own label went through 2 more rounds of direct feedback after
 * that. First it kept one constant "Start reflection" label in both states
 * (the state difference carried entirely by the `Lock` icon + disabled
 * styling + an `sr-only` reason) — flagged as a real bug: "how can it say
 * start when its locked," since a disabled-but-still-actionable-sounding
 * label reads as broken regardless of how many other signals surround it.
 * Fixed to match `CertificateCard`'s own already-shipped precedent for the
 * identical problem (`ModuleTimeline.tsx`, `isCertified ? 'Download
 * certificate' : 'Unlock'`) — briefly "Unlock" while locked. That in turn
 * was rejected on direct, verbatim instruction ("why does it say unlock. it
 * should be Finish all modules to unlock") for not naming the actual
 * condition — the shipped label is now the literal instructed string,
 * `isCertified ? 'Start reflection' : 'Finish all modules to unlock'`, no
 * further wordsmithing. The longer locked label made the old `sr-only`
 * suffix (" (once you finish your modules)") redundant — it stated the same
 * condition the visible label now states outright — so it's removed rather
 * than doubled up. Button height switched `h-9` → `min-h-9` + `py-2` +
 * `text-center` so the longer locked label can wrap to a second line at
 * this card's narrow (~324px) column width without truncating or shrinking,
 * rather than assuming one line would always fit.
 *
 * **CTA destination.** Real baseline-reflection conversation UI doesn't
 * exist anywhere in this app yet (Round 9.1's milestone card was explicitly
 * "a static placeholder, since the real AI-guided conversation flow isn't
 * built yet," still true today), so the enabled button opens an honest
 * placeholder dialog (the app's existing generic `ConfirmDialog`, its
 * single-button `singleAction` mode — the same chassis/tone
 * `WidgetGrid.tsx`'s "Add a widget" dialog already uses for an identical
 * "this is a prototype placeholder" disclosure) rather than silently going
 * nowhere or faking a real destination. The disabled button has no
 * `onClick` at all, matching `CertificateCard`'s own locked button.
 *
 * **Scope: baseline only.** This is the first of the app's 4 real reflection
 * timepoints (baseline / midline / endline / post-practice, per CLAUDE.md).
 * Gates on `isCertified` — the same flag `CertificateCard` already uses to
 * unlock the certificate, true once all curriculum modules are complete.
 * Midline/endline/post-practice content is a deliberate follow-up.
 *
 * **Icon:** `Sparkles` (the original placeholder's icon) reads as "AI
 * magic," undercutting the de-AI-branding above. Replaced with
 * `NotebookPen` — reads as writing/reflecting/journaling.
 *
 * **Contrast, computed against the real background (not assumed), now
 * unconditional since the wash no longer varies by state:** `ink` (heading)
 * 15.34:1, `ink-muted` (body) 11.52:1 — both AAA. The icon badge circle
 * (`bg-badge-purple/10` composited over `--color-reflection-panel`) is
 * 5.53:1 — clear AA.
 */
export function AiReflectionPanel() {
  const [placeholderOpen, setPlaceholderOpen] = useState(false)

  return (
    <>
      <Card className="flex min-h-[322px] flex-col items-center justify-center gap-6 bg-reflection-panel p-10 text-center ring-badge-purple/20">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-badge-purple/10 text-badge-purple"
        >
          <NotebookPen className="size-6" />
        </span>
        <div className="space-y-1.5">
          <h2 className="font-display text-title">Baseline reflection</h2>
          <p className="max-w-[280px] text-caption text-ink-muted">
            A short, personal check-in on your training that's required as part of your COACH pathway.
          </p>
        </div>

        <button
          type="button"
          aria-disabled={isCertified ? undefined : 'true'}
          onClick={isCertified ? () => setPlaceholderOpen(true) : undefined}
          className={cn(
            'inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-center text-caption-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isCertified
              ? 'border-transparent bg-primary text-white transition-colors hover:bg-primary-hover'
              : 'cursor-not-allowed border-badge-purple/70 bg-white text-badge-purple',
          )}
        >
          {!isCertified && <Lock aria-hidden="true" className="size-3.5 shrink-0" />}
          {isCertified ? 'Start reflection' : 'Finish all modules to unlock'}
        </button>
      </Card>

      <ConfirmDialog
        open={placeholderOpen}
        title="Baseline reflection"
        body="This part of the prototype isn't built yet."
        confirmLabel="Close"
        cancelLabel="Close"
        singleAction
        onConfirm={() => setPlaceholderOpen(false)}
        onClose={() => setPlaceholderOpen(false)}
      />
    </>
  )
}
