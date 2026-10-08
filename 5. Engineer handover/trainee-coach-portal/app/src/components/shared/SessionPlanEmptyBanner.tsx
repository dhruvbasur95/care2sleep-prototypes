/**
 * The coach's "you have not planned this client's sessions yet" banner.
 *
 * Extracted verbatim from the Research Dashboard's
 * `SpacesCoachProfilePage.tsx` for the coach-portal handover package. It is
 * coach-only copy (see the comment below), and its only reader is the Coach
 * Delivery Portal's per-client detail page; the researcher record page it was
 * defined in is not part of this package.
 */
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { ConsumerDyad } from '@/data/spaces'


/**
 * The coach's "you have not planned this client's sessions yet" banner —
 * Figma frame `683:2408`, Round 37. Replaces the icon-badge empty state that
 * used to sit inside the Session plan card, and is the entry point into
 * `PlanSessionsModal`.
 *
 * **Coach-only.** Every sentence in it is addressed to the person who does the
 * planning ("your coaching journey", "your step 1"), so the researcher's
 * read-only view of the same tracker keeps its own neutral empty state. This
 * is the `viewerRole` split `SessionTracker` already draws everywhere else.
 *
 * The frame's own numbers, transcribed rather than eyeballed: gap 48,
 * `pl-24 pr-48 py-48`, art 319.89x184.992, text column gap 24 with `px-16`,
 * title-to-body gap 8. Three deliberate substitutions per CLAUDE.md's
 * standing rules:
 *
 *  - The **fill, stroke, radius and shadow are the `Card` component's own
 *    defaults** (16px, 1px `parchment`, the warm `shadow-card`) — the frame
 *    specifies exactly those, so this is `<Card>` recoloured, not a bespoke
 *    box that happens to match today.
 *  - The **CTA is this app's inverted-on-purple pill**, the same one the
 *    consumer and SPACES coach record heroes use, not the frame's own button
 *    chrome. Its 44px height is the frame's; the 36px rule is a floor, not a
 *    cap.
 *  - `leading-[1.4]` on the body is a **local override of `--text-body`'s
 *    app-wide `normal`**. Round 23 established that Figma's `AUTO` and the
 *    browser's `normal` are the same metric, but this style declares an
 *    explicit 1.4 — measured, the frame's 3-line block is 66px, i.e. 22px a
 *    line against 16px text. So it is a real value, not drift.
 *
 * The illustration is the frame's **own exported SVG**, downloaded and
 * committed to `public/illustrations/` (the Round 23 certificate / Round 28
 * enrolment precedent). Never hand-drawn and never a lucide substitute: it is
 * a 62-vector composition, not an icon.
 */
/* Exported (Round 39) so the coach's own client page can render the create-plan
   path directly. `SessionTracker` left that page when the Coaching workspace tab
   was rebuilt, which took the only way to create a plan anywhere in the coach
   portal with it — a client with no plan became a dead end. The banner is the
   whole of that path, so it is what the page renders rather than the full
   tracker coming back. */
export function SessionPlanEmptyBanner({
  dyad,
  ctaRef,
  onCreate,
}: {
  dyad: ConsumerDyad
  ctaRef: React.RefObject<HTMLButtonElement | null>
  onCreate: () => void
}) {
  const [whyOpen, setWhyOpen] = useState(false)
  return (
    <Card className="flex-row items-center gap-12 overflow-hidden border-parchment bg-primary py-12 pr-12 pl-6 max-lg:flex-col max-lg:items-start max-lg:gap-8 max-lg:p-8">
      {/* The wrapper is load-bearing, not tidiness. `Card` carries
          `has-[>img:first-child]:pt-0` and `*:[img:first-child]:rounded-t-xl`
          — media-card rules for artwork meant to bleed to the top edge. A
          bare `<img>` here is that first child and tripped them: measured,
          the banner's top padding came out **0 where the frame says 48**,
          which reads as "the art sits a bit high" rather than as a bug. The
          wrapper takes the first-child slot so neither rule fires.
          Decorative: the sentence beside it already carries the meaning. */}
      <div className="shrink-0 max-lg:w-full">
        <img
          src="/illustrations/session-plan-calendar.svg"
          alt=""
          aria-hidden="true"
          className="h-[184.992px] w-[319.89px] max-lg:h-auto max-lg:w-full max-lg:max-w-[320px]"
        />
      </div>
      {/* `min-w-0` — a flex child defaults to `min-width: auto`, so without it
          the copy sizes the row instead of wrapping inside it. This project
          has shipped a real horizontal page scroll that way three times. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-6 px-4 max-lg:px-0">
        <div className="flex flex-col gap-2 text-white">
          {/* No full stop — direct instruction. */}
          <h3 className="font-display text-display-md text-balance">No session plan created yet</h3>
          {/* Copy pass, Round 37. Three changes off the frame's own wording,
              each against a convention this portal already holds:
                - "Select the button below to create one." is cut. The button
                  is the next thing on the page and says what it does, so the
                  sentence only sends a coach looking for a control they can
                  already see (the Round 36 empty-state rule).
                - "your step 1 is to" is cut. It implies a numbered sequence
                  the UI never shows; "before your first session" carries the
                  same ordering in plain language.
                - "coaching journey" -> "work". Round 17 rewrote this portal's
                  copy away from marketing voice three times.
              And it restores the rule the old empty state carried and the
              frame dropped — what a plan actually *does* — so the absence
              reads as a step not yet taken rather than something missing.
              No contractions, per the Round 32 sweep. */}
          <p className="text-body leading-[1.4] text-white/90">
            To start your work with{' '}
            {dyad.patient && (
              <>
                <strong className="font-bold">{dyad.patient.name}</strong> and{' '}
              </>
            )}
            <strong className="font-bold">{dyad.carer.name}</strong>, create a coaching session
            plan with them. It sets when each module unlocks and when you will meet to catch up.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            ref={ctaRef}
            type="button"
            onClick={onCreate}
            className="inline-flex h-11 min-w-[232px] items-center justify-center rounded-full border border-primary bg-white px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-parchment focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.97]"
          >
            Create session plan
          </button>
          {/* Round 40, direct instruction: a secondary "Why is this necessary?".
              It opens a real explanation rather than taking this app's unwired
              treatment — the answer is domain knowledge the product already
              holds, so a button that asks a question and then does nothing
              would be the worst of the options. White-outline on the purple
              band, the same pairing the coach Home banner's own two CTAs use. */}
          <button
            type="button"
            onClick={() => setWhyOpen(true)}
            className="inline-flex h-11 min-w-[232px] items-center justify-center rounded-full border border-white px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-[0.97]"
          >
            Why is this necessary?
          </button>
        </div>
      </div>

      {/* Round 40, direct instruction: rebuilt. The first pass was a narrow
          `ConfirmDialog` with three long bullets that each argued a mechanism —
          it answered "how the plan works" when the question on the button is
          "why do I have to do this, and what happens next".

          Now two short sections with a heading each: **why** and **what to
          expect**. Wider panel (560 -> 720) so a line is a readable length
          rather than four words, and the banner's own calendar artwork with the
          debrief doodles around it, so the modal is visibly the same object the
          coach pressed the button on.

          Spacing is the app's own scale throughout: 32px between the artwork
          and the copy, 24px between the two sections, 8px between a heading and
          its lines, 12px between lines. No one-off values. */}
      <ConfirmDialog
        open={whyOpen}
        title="Why you plan sessions first"
        body="A short plan up front is what the whole programme runs on."
        confirmLabel="Close"
        cancelLabel="Close"
        singleAction
        /* Round 40, direct instruction: wider (720 -> 840) with more room around
           the content — but **the panel keeps `ConfirmDialog`'s own `p-6`**.
           `MODAL_FOOTER_SURFACE_COMPACT` bleeds the footer edge-to-edge with
           `-mx-6 -mb-6`, sized to exactly that padding; raising the panel to
           `p-10` left a 16px white margin around the grey footer bar. The extra
           breathing room is added to the *content* instead (`px-4 pb-4` below),
           which is what was asked for and leaves the footer flush. */
        panelClassName="w-full max-w-[840px]"
        onConfirm={() => setWhyOpen(false)}
        onClose={() => setWhyOpen(false)}
      >
        {/* 32px below the dialog's own sub-line — `ConfirmDialog` puts no gap
            between its body text and its children, so the artwork was sitting
            directly under the sentence. */}
        <div className="mt-8 flex flex-col gap-10 px-4 pb-4 md:flex-row md:items-start">
          {/* Decorative — every word of the meaning is in the copy beside it.
              The doodles are positioned as percentages of the artwork box, so
              they hold their arrangement at any width. */}
          {/* The doodles sit **inside** the artwork's own box, not on negative
              insets. The dialog panel clips its content, so anything hung off
              the outside edge was being cut — which is what "image getting
              cropped" was. The box is padded instead and every doodle is
              positioned within 0-100% of it, so nothing can leave. */}
          <div
            aria-hidden="true"
            className="relative mx-auto w-[260px] shrink-0 px-6 py-5 md:mx-0"
          >
            <img src="/illustrations/session-plan-calendar.svg" alt="" className="w-full" />
            <img
              src="/illustrations/debrief/doodle-cloud.svg"
              alt=""
              className="absolute left-0 top-0 w-[20%]"
            />
            <img
              src="/illustrations/debrief/doodle-check.svg"
              alt=""
              className="absolute right-0 top-[28%] w-[18%]"
            />
            <img
              src="/illustrations/debrief/doodle-sparkle.svg"
              alt=""
              className="absolute bottom-0 left-[8%] w-[12%]"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <section className="flex flex-col gap-2">
              <h3 className="text-body-md text-ink">Why it is necessary</h3>
              {/* `/design:ux-copy`, Round 40, direct instruction. The previous
                  line ("Modules unlock off the plan") described a mechanism and
                  led with the system, so a coach had to work out what the plan
                  *was* before the sentence made sense. This leads with the two
                  people and the two decisions they make together, which is what
                  the plan actually is, and puts the consequence last. */}
              <p className="text-body text-ink-muted">
                You and your client agree this together: when each module becomes available to
                them, and when the two of you meet to talk it through. Nothing opens up for them
                until it is set.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-body-md text-ink">What to expect</h3>
              <ul className="flex list-disc flex-col gap-3 pl-5 text-body text-ink-muted">
                <li>Three questions, together with your client. It takes a few minutes.</li>
                {/* Catch-up first, then modules — that is `PlanSessionsModal`'s own
                    step order ("Catch-up meeting" then "Module unlock day").
                    The line had it the other way round, so a coach reading this
                    and then opening the wizard met the questions in the
                    opposite order to the one they had just been promised. */}
                <li>You pick a day to catch up and a day for modules, and we build the dates.</li>
                {/* The wizard's real last step is Review, where every date is
                    editable before anything is saved — so "review, personalise
                    and confirm" is what happens, and "you can change it later"
                    is the reassurance that follows it rather than the whole
                    point. */}
                <li>
                  Review the plan, personalise it and confirm. You can change it later too.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </ConfirmDialog>
    </Card>
  )
}
