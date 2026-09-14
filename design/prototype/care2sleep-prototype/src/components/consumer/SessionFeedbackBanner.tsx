import { MessageCircleHeart } from 'lucide-react'
import { CardIcon } from '@/components/consumer/ConsumerCard'

/**
 * The post-session feedback prompt, above the day's tasks on Consumer Home.
 * Frames `930:5484` (the card) and `930:5313` (its place in the section).
 *
 * Shown after a coaching session and asking one question — how was it — with a
 * way to answer and a way to decline. It is deliberately not a task card: it
 * appears above "Your tasks for today" rather than inside it, because it is a
 * thing that just happened rather than a thing still to do.
 *
 * ── The icon ──────────────────────────────────────────────────────────────
 *
 * The frame draws a bare 52px white square, which is a placeholder for an icon
 * (direct instruction: "this new banner will also have icon as place holder to
 * use appropriate icon"). It renders through the page's own `CardIcon`, the same
 * treatment the diary and session cards already use, so the square is not
 * reproduced. `MessageCircleHeart` — a speech bubble with a heart is "tell us
 * how you felt", and it is distinct from the two glyphs already on this page
 * (`NotebookPen` for the diary, `Video` for the session).
 *
 * ── Copy ──────────────────────────────────────────────────────────────────
 *
 * **The label, title and body are supplied copy** — given verbatim after a
 * copy review, so they are transcribed rather than edited. An earlier pass here
 * had changed three of these lines (matched the congratulation to the module
 * completion screen, dropped "today", and rewrote the benefit line away from
 * "take better care of you"); all three were reverted to what was asked for.
 * The benefit line was then supplied again as "Your feedback will help us
 * improve this study project" — which is what this is: a research study, not a
 * care service.
 *
 * The frame's `<>` placeholder is filled from the live plan rather than written,
 * so the banner cannot name a different session from the card below it, and it
 * reads as an ordinal — "your 4th session", "your planning session" — because
 * that is the shape the supplied sentence needs.
 */
export function SessionFeedbackBanner({
  sessionOrdinal,
  onShare,
  onSkip,
}: {
  /** Fills the supplied sentence "You finished your <> session" — an ordinal
   *  ("4th") or "planning", already reader-facing. */
  sessionOrdinal: string
  onShare?: () => void
  onSkip: () => void
}) {
  return (
    <section
      aria-labelledby="session-feedback-heading"
      /* Stacked until the desktop layout — icon top-left, then the words, then
         the buttons — which is how the sleep diary card beside it already
         behaves at those widths (direct instruction: "in tablet mode, the
         stacking should [be] as done for sleep diary card"). The frame's
         icon-beside-copy row is a 1281 layout, and putting it on a tablet left
         the text in a column narrow enough to wrap every line. One breakpoint
         for the whole card, so the icon, the copy and the buttons all change
         arrangement together rather than at two different widths. */
      className="flex flex-col gap-6 rounded-lg border border-parchment bg-yellow-200 px-4 pt-6 pb-8 shadow-card sm:px-8 sm:pt-8 sm:pb-10 min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:gap-10"
    >
      <CardIcon icon={MessageCircleHeart} />

      {/* The frame's 104px gap between the words and the buttons only exists
          when they sit side by side; stacked on a narrow screen they take the
          column's own rhythm instead. */}
      <div className="flex min-w-0 flex-1 flex-col gap-6 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:gap-[104px]">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {/* The card label. No full stop, matching every other card label on
              this page ("Fill sleep diary", "Complete this week's module"). */}
          <p className="text-consumer-eyebrow text-ink">Provide post session feedback</p>
          <div className="flex flex-col gap-2">
            <h2
              id="session-feedback-heading"
              className="text-consumer-card-title text-balance text-ink"
            >
              How was your session today?
            </h2>
            <p className="text-consumer-eyebrow text-balance text-ink">
              {/* The number and the word it counts are bold together — direct
                  instruction — so the one fact that changes per session is the
                  part the eye lands on. `font-semibold` is 600, this portal's
                  heaviest weight. */}
              You finished your{' '}
              <span className="font-semibold">{sessionOrdinal} session</span>. We would love to
              know how you felt. Your feedback will help us improve this study project. We will
              ask this each time you finish a session.
            </p>
          </div>
        </div>

        {/*
          ── Button width, which took three goes ─────────────────────────────
          The task cards beside this one set their CTAs to `w-full` *of their own
          card*, and this banner's card is the whole row — so copying `w-full`
          made these buttons far longer than any button near them: measured 830px
          against the 362px a diary CTA gets at 1056 ("too long, and not matching
          the length used for sleep diary and other cards"). Capping at the
          frame's 273px then went the other way, reading as stubby once the row
          narrowed and the siblings went full width at 474px ("not syncing with
          other card buttons").

          ⚠️ **The cap now starts at 1024, not at every width below 1100** —
          direct instruction that these should "mirror module button widht for
          different view ports below desktop", and measured, they did not: at
          811px the banner buttons were 384px against a 585px "Resume module".

          The breakpoint is the task-card grid's own. Those cards are
          `grid-cols-1` below **1024** and `grid-cols-2` above it, so:

            • **below 1024** a card is the full row and its CTA is
              row − 64 of card padding. The banner card has the same width and
              the same padding, so its content box **is** that number — 585 at
              811px, measured — and plain `w-full` mirrors a module CTA exactly
              with no arithmetic.
            • **1024 → 1100** a card is half the row, so its CTA is
              `(row − 40 gap)/2 − 64`. Expressed against this column's own
              parent — which is the banner's content box, `row − 64` — that
              reduces to **`50% − 52px`**, so the mirror is exact at every width
              in the band rather than at one point in it. A flat 384px was 20px
              wide at 1060 (measured 384 against a 364 card CTA); the calc lands
              within ~2px, the borders being the remainder.
            • **1100+** keeps the banner frame's own 273px, where the buttons sit
              in a fixed column beside the copy rather than under it.

          This is also why `w-full` measured 830px in the earlier pass quoted
          above: that reading was taken at 1056, inside the two-column band,
          where the banner spans the whole row and a card does not.

          ⚠️ The card's own mobile padding moved `px-5` -> **`px-4`** for the
          same reason. With the cap gone, the button width *is* the card's
          content width, so the two cards' padding has to agree or the mirror is
          off by twice the difference: measured 285 here against 293 in a module
          card, because this card was 20px and the task cards are 16px below
          `sm`. Both are 32 from `sm` up, which is why 811px already matched.
        */}
        <div className="flex w-full flex-col gap-4 min-[1024px]:max-w-[calc(50%-52px)] min-[1100px]:max-w-[273px] min-[1100px]:shrink-0">
          {/* No feedback form exists yet, so this is the project's standing
              treatment for a control a frame draws but nothing has wired: real,
              focusable, and honest about it rather than silently dead. */}
          <button
            type="button"
            aria-disabled={onShare ? undefined : true}
            onClick={onShare}
            className="text-body-md flex h-12 items-center justify-center rounded-[28px] bg-consumer-primary px-5 text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
          >
            Share my thoughts
            {onShare ? null : <span className="sr-only"> (coming soon)</span>}
          </button>
          {/* Skip is real: it puts the banner away. */}
          <button
            type="button"
            onClick={onSkip}
            className="text-body-md flex h-12 items-center justify-center rounded-[28px] border-2 border-consumer-primary bg-transparent px-5 text-consumer-primary outline-none transition-colors hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </section>
  )
}
