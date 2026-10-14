import type { ReactNode } from 'react'
import { Download } from 'lucide-react'
import { BANNER_H, BANNER_W, SummaryBannerArt } from '@/components/consumer/SummaryBannerArt'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The module summary screen's banner illustration — Figma `4139:42732`
 * ("Frame 2"), exported whole on 2026-10-12 and committed as
 * `/illustrations/consumer-resource/summary-banner.svg`.
 *
 * ── It replaced a photo, and the photo machinery went with it ─────────────
 *
 * Until this round the card carried a photograph in a torn-paper blob, built
 * here out of `resourceBlobFrame.ts`, a JPEG and four sticker SVGs. The design
 * moved to a flat vector, so all of that was deleted rather than left behind:
 * nothing else imported it (checked repo-wide with `--no-ignore-files`, since
 * `grep -r` here is ugrep and skips gitignored files).
 *
 * ── It is ONE export, not a reassembly ───────────────────────────────────
 *
 * The whole illustration — the tan ground ellipse, the `#FFE299` blob with its
 * `#FFCC4D` stroke and two inner shadows, and the six `#3A00AD` shapes — comes
 * out of Figma as a single file. This project has shipped a photograph outside
 * its own frame three times by transcribing two halves of one drawing
 * separately (see `blobFrame.ts` and §78.1); a single export cannot drift.
 *
 * ── The numbers, and where they come from ────────────────────────────────
 *
 * Figma's own, read off the node, not eyeballed:
 *
 * | | |
 * |---|---|
 * | banner column | 354.87 wide, full card height, **clipped** |
 * | artwork | 339 x 498, placed at left **16.48**, top **40** |
 *
 * The artwork is deliberately **wider than its column** — it bleeds off the
 * right-hand edge, which is why the column clips and why the card's own right
 * padding is 0. Figma's rendered bounds are 338.39 x 497.1 and its clip lands
 * at 354.87, i.e. 0.61px before the export's own right edge, so the 339-wide
 * file holds everything that is ever visible and nothing is lost to the crop.
 *
 * It began as an `<img>` pointing at a committed `.svg`. It is now an inline
 * `<svg>` (`SummaryBannerArt`) because the pillow had to come alive and an
 * `<img>` has no addressable parts — see that file for what breathes and what
 * deliberately does not. The public `.svg` was deleted in the same pass rather
 * than left beside it.
 */
const BANNER = {
  COLUMN_W: 354.87,
  LEFT: 16.48,
  TOP: 40,
} as const

function ResourceBanner() {
  return (
    /* **Desktop only** (direct instruction, Round 64: "in tablet and mobile, we
       do not show this vector" — and the Figma tablet and phone frames have no
       banner node at all). Hidden on the SAME 900px breakpoint the card's row
       layout uses, so the banner can never be visible while the card is
       stacked. It is decorative, so a narrow reader loses nothing.

       `self-stretch` rather than a height: the copy column sets the card's
       height and the banner fills it, which is Figma's `layoutSizingVertical:
       FILL` on the same frame. */
    <div
      aria-hidden="true"
      /* ⚠️ **Deliberately NOT clipped** (direct instruction, Round 64: "do not
         clip the immediate container of the avatar, only clip the parent module
         summary card"). This column is 354.87 wide and the pillow is drawn
         flush to its right edge, so a clip here would slice the breath a few px
         INSIDE the card and leave a visible seam short of the edge. The card
         does the clipping, at the edge, where the bleed is meant to land. */
      className="relative hidden shrink-0 self-stretch min-[900px]:block"
      style={{ width: BANNER.COLUMN_W }}
    >
      <SummaryBannerArt
        className="absolute max-w-none"
        style={{ left: BANNER.LEFT, top: BANNER.TOP, width: BANNER_W, height: BANNER_H }}
      />
    </div>
  )
}

/** The module's own three strategies, in the module's own words. */
const RESOURCE_POINTS = [
  'Getting up at about the same time each day',
  'Resting in the afternoon without losing sleep for the night',
  'Telling sleepy apart from tired, so you go to bed at the right time',
]

/**
 * `heading` is the SCREEN's own heading block — icon, `<h1>` and the paragraph
 * introducing the module. It is passed in rather than written here because the
 * card does not own it: it owns the guide.
 *
 * Round 64 clubbed the two (direct instruction: "can we club: Module summary …
 * and copy in guide i.e. Your sleep guide"). Before it, the screen opened with
 * a book icon, "Module summary" and a paragraph, and then the card immediately
 * below opened with "Your sleep guide" and a one-line sub copy — two headings
 * and two intros, stacked, saying overlapping things to a reader this portal's
 * own audience note describes as having poor digital literacy.
 *
 * So the card absorbed the screen's heading block and gave up its own `<h3>`;
 * "Module summary" is the only title now, and the guide's own line survives as
 * the lead-in to its bullets, where it reads as a caption for the list rather
 * than a second heading. The book icon was not deleted with it — it moved
 * inside, above the title (direct instruction: "or actually icon can move above
 * the title in card title").
 *
 * No `id`/`tabIndex` on the section any more, either. Both existed only so the
 * summary copy could jump DOWN to this card when it sat below four 500px cards;
 * the card is now the first thing on the screen, so there is nothing to skip to
 * and a focusable non-control would just be an extra Tab stop.
 */
export function ResourceCard({ heading }: { heading: ReactNode }) {
  return (
    /* **Text first in the DOM, artwork second** (direct instruction, Round 64:
       "move to right"). Not `order-*`: on the stacked phone layout a visual
       order that disagrees with the DOM order is a real reading-order defect,
       and reordering the source gives the same desktop result with none of
       that — artwork right at >= 900px, artwork below the copy under it, which
       is also the right stacking now that the card opens with the screen's own
       heading. */
    /* ── Padding is asymmetric from 900px up ──────────────────────────────
       Figma `2461:3925`: the card is padded `0 / 0 / 0 / 40` and the COPY
       COLUMN carries its own `40 / 0 / 40 / 0`. Stacked (below 900) the card
       keeps a plain 24 all round, which is what the tablet and phone frames
       draw.

       The reason the padding moved off the card and onto the column: the
       banner bleeds to the card's top, right and bottom edges, and a card with
       40px of padding has no way to let a child reach them.

       ⚠️ **`overflow-hidden` stays.** It was taken off for one pass so the
       breathing pillow would not be sliced at the card's right edge, and put
       straight back on sight (direct instruction, Round 64: "unclip parent
       container, to avoid animation clipping", then "clip the parent
       container"). Unclipped, the pillow and its ground shadow hang outside the
       card over the page canvas, which reads worse than the clean bleed does —
       and the bleed is what Figma draws, where `Frame 2` clips too. The breath
       is 1.2%, so what it loses at that line is under 2px. */
    <section className="flex flex-col items-center gap-8 overflow-hidden rounded-lg border border-parchment bg-yellow-100 p-6 shadow-card min-[900px]:flex-row min-[900px]:gap-12 min-[900px]:p-0 min-[900px]:pl-10">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 min-[900px]:py-10">
        {heading}

        <p className="text-consumer-eyebrow text-balance text-ink-muted">
          The three things from this module, on one page you can keep.
        </p>

        <ul className="flex flex-col gap-2">
          {RESOURCE_POINTS.map((point) => (
            <li key={point} className="flex gap-3">
              {/* A dot, not a glyph — the same CSS bullet the summary cards use,
                  so the two lists read as one system. */}
              <span
                aria-hidden="true"
                className="mt-[8px] size-1.5 shrink-0 rounded-full bg-consumer-primary"
              />
              <span className="text-consumer-eyebrow min-w-0 flex-1 text-ink-muted">{point}</span>
            </li>
          ))}
        </ul>

        {/* Round 64, direct instruction, replacing "It is a PDF. Read it at your
            own pace, or print it to keep." The supplied line was "You can also
            read them on your own pace, click the button below the download
            resources", with "make sure grammer, tone is fixed" — so three fixes
            and nothing else:

              1. "on your own pace" -> "at your own pace" (the idiom).
              2. The comma splice is split into two sentences. One idea per
                 sentence is this portal's own convention and its audience note
                 ("old people, with poor digital literacy") is the reason.
              3. "the download resources" -> "to download the resource". The
                 verb was missing, and the control it points at must be named
                 with the words it actually carries — pointing at a button by a
                 word it does not show is exactly what this audience cannot
                 recover from.

            **"resource", not "guide"** (direct instruction, Round 64: "its not
            a guide, but resource, fix copy + CTA"). Swept in one pass: this
            sentence, the CTA label and `RESOURCE_POINTS`. "Guide" no longer
            appears anywhere a reader can see on this screen — only in the photo
            asset's filename, which is code.

            Tap/Click switches on the same 1200px breakpoint the paragraph above
            uses, so the two instructions on this screen cannot disagree about
            what a reader is holding. */}
        {/* **No `text-balance` here** (direct instruction, Round 64: "club the
            two sentences, do not text wrap"). Balancing split it at the sentence
            boundary and set it as two even lines, which read as two separate
            instructions stacked. Plain wrapping keeps it as one running line
            wherever it fits. This is a deliberate local exception to the
            no-orphans rule in `CLAUDE.md`, which calls for `text-balance` on
            short paragraphs — here the balance IS the defect. */}
        <p className="text-consumer-body-strong text-ink-muted">
          You can also read them at your own pace.{' '}
          <span className="min-[1200px]:hidden">Tap</span>
          <span className="hidden min-[1200px]:inline">Click</span> the button below to download
          the resource.
        </p>

        {/* The flip cards' own download control, moved here whole — direct
            instruction: "Re-use the download button card as used in flip to see
            cards, only update the copy". Still the project's standing treatment
            for a control a frame draws but nothing has wired: real, focusable,
            and honest about it rather than silently dead.

            The frame's own 384px (`max-w-96`) applies **only from 900px**, the
            same breakpoint the card's row layout and its artwork use (direct
            instruction, Round 64: "in tablet and mobile the button should be
            100% width"). Once the card stacks there is no second column for a
            384px pill to balance against, and this portal's audience note asks
            for big targets. */}
        <button
          type="button"
          aria-disabled="true"
          className={cn(buttonVariants({ surface: 'consumer' }), 'flex w-full min-[900px]:max-w-96 hover:bg-consumer-primary')} /* button-height-pinned: round-69 */
        >
          <Download aria-hidden="true" strokeWidth={1.75} className="size-6 shrink-0"  />
          Download the resource
          <span className="sr-only"> (coming soon)</span>
        </button>
      </div>

      <ResourceBanner />
    </section>
  )
}
