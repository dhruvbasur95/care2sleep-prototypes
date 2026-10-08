import { GraduationCap, Mail, MessageCircleQuestionMark, Phone, Stethoscope, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { Coach } from '@/data/research'

/**
 * "Meet your coach" — the coach's full profile, Figma frame `979:8284`.
 *
 * Opened by `CoachCard`'s **Read More** control on Home, which shipped as a
 * focusable `aria-disabled` placeholder because, in its own words, "there is no
 * coach profile page on the consumer side".
 *
 * ⚠️ **A modal, not a page** — direct correction after a first pass built it as
 * a route at `/consumer/:dyadId/coach`. That page and its route are gone. The
 * frame's own shape argued for the modal all along: it is drawn as a single
 * 614px card with its own radius, border and shadow, which is a panel rather
 * than a page's content column.
 *
 * It rides the shared `ConfirmDialog` chassis rather than a hand-rolled one, so
 * it inherits the focus trap, Escape handling, scroll lock and the guarded
 * focus-restore that chassis has accumulated over several rounds — this project
 * has shipped focus-to-`<body>` bugs in six separate rounds, and a bespoke
 * dialog would be the seventh. Three props adapt it:
 *
 *   • `hideHeader` — the card carries its own heading in the purple hero, so the
 *     chassis' title would compete with it. `title` still supplies the dialog's
 *     accessible name.
 *   • `panelClassName` with `p-0` — the hero bleeds to the panel's edges, so the
 *     panel becomes the card. Its `rounded-lg`/`overflow-hidden` then do the
 *     clipping the page version's own card did.
 *   • `footerClassName` cancelling the bleed — the footer's negative margins are
 *     calibrated to the chassis' `p-6`, and a `p-0` panel would leave the grey
 *     bar poking 24px outside the panel on three sides. This is the same trap
 *     that was hit once already on the opt-out dialog.
 *
 * ── The hero, and why it is built from ratios rather than offsets ──────────
 *
 * The frame is a 614x951 card. Its hero is a purple wave whose **bottom edge is
 * the wavy line**, with the portrait straddling that edge. Three facts from
 * `get_metadata` drive everything:
 *
 *   • the wave vector is 765.917 x 387 at x -71.29, y -137 in a 612-wide hero,
 *     so it is ~124% of the card width, centred, and overhangs the top by 137;
 *   • its bottom lands at y **250**, not at the hero's 315 — the last 65px of
 *     the frame's "hero" region is already white card;
 *   • the portrait is 144 square at y 171, so **79px sits in the purple and
 *     65px hangs below it** — it is very nearly centred on the wavy edge.
 *
 * So the purple region is 250 tall, and everything else is expressed against
 * that one number: the wave is 154.816% of it tall (387.04/250) and 124.24% of
 * the card wide (760.376/612), and the portrait's overhang is 45.139% of its own
 * size (65/144). The hero height and the portrait size are the only two
 * numbers chosen here; the wave and the overhang both follow from them, which is the §78.1 lesson this project has re-learned three times: a
 * shape and the thing it frames must derive from one source, never from two
 * transcribed offsets.
 *
 * ⚠️ **The wave is stretched, deliberately.** Its export carries
 * `preserveAspectRatio="none"`, so sizing it to 124.24% x 154.816% of the hero
 * fills that box exactly at every card width instead of letterboxing. That is
 * what guarantees the purple reaches the hero's top corners on a 327px phone as
 * well as at the frame's 614px — a uniformly-scaled wave would have to be
 * *taller* than the hero to cover it, and would then push its own curve out of
 * frame. The curve flattens slightly on narrow cards; on a decorative band that
 * is the right trade.
 *
 * ⚠️ **The hero must have a definite height**, which is why it is two fixed values
 * rather than content-driven: the wave's percentage sizing resolves against the
 * hero's own box, and a percentage height against an `auto` containing block
 * resolves to `auto` and collapses. The portrait is anchored to the hero's
 * *bottom* edge rather than stacked after the text, so a long coach name cannot
 * push it off the wave.
 *
 * The wave's own fill is `#3A00AD`, which is exactly `consumer-primary` — this
 * portal's brand purple, not the app's `--primary`. No new token.
 *
 * ── Type ──────────────────────────────────────────────────────────────────
 *
 * The three section titles (Speciality / Professional background / Contact
 * details) are `consumer-lesson` — this portal's **18px medium** step, which
 * clamps to 20 on a wide card — on direct instruction, replacing the frame's
 * own 16/600. The fallback panel's heading moved with them so the four section
 * headings stay one size.
 *
 * The frame's 22px headings are **Bold (700)** and its subtitle is **14px**.
 * Both are outside this portal's scale, which is nothing below 16px and nothing
 * heavier than 600 — a standing rule, and the audience is the one with the
 * explicit "not digitally literate at all" note. So the names render at 22/600
 * (`consumer-card-title-sm` plus a weight step, the portal's ceiling) and the
 * subtitle at 16px. Everything else in the frame is already 16px.
 *
 * ── Icons ─────────────────────────────────────────────────────────────────
 *
 * The frame leaves three 40px `#e0e0e0` squares as placeholders and exports its
 * phone/mail glyphs as SVGs. Direct instruction was to put relevant icons in the
 * grey slots; this project's standing rule supplies all five from `lucide-react`
 * rather than the frame's exports. `Stethoscope` for the clinical speciality,
 * `GraduationCap` for professional background, and
 * `MessageCircleQuestionMark` for the "cannot reach your coach" fallback —
 * deliberately not `Mail` again, which already means "email the coach" two rows
 * above.
 *
 * ⚠️ That last one was `LifeBuoy` first and was reported as making no sense: at
 * 28px a life ring reads as a wheel or a target rather than as help. A speech
 * bubble carrying a question mark says "ask someone else", which is what the
 * panel is actually for.
 */

/**
 * 760.376 / 612 and 387.04 / 250 — the wave against the card's width and
 * against the purple region's height. These two are the whole hero.
 */
/**
 * 760.376 / 612 and 387.04 / 250 — the wave against the card's width and
 * against the purple region's height. These two are the whole hero.
 */
const WAVE_W_PCT = (760.376 / 612) * 100
const WAVE_H_PCT = (387.04 / 250) * 100

/**
 * 65 of the portrait's 144 hangs below the wavy edge (`979:8293` against the
 * wave's own y 250), so the overhang is 45.139% of whatever size it renders at.
 *
 * ⚠️ The two size pairs below are written as **Tailwind responsive classes at
 * the call sites**, not as custom properties: an arbitrary *property* under
 * stacked variants can silently emit no CSS at all in this project's setup
 * (CLAUDE.md), and a first pass here did use `var(--coach-portrait)` without
 * ever defining it. The arithmetic is:
 *
 *   portrait 112 (base) -> overhang 112 * 0.45139 = 50.6 -> body pt 51 + 24 = 75
 *   portrait 144 (sm)   -> overhang 144 * 0.45139 = 65   -> body pt 65 + 24 = 89
 *
 * The hero is 224 base / 250 sm; `sm` is the frame's own number, and the base
 * is the same stack measured against a ~327px phone card. It must be a
 * **definite** height — the wave's percentage sizing resolves against the hero's
 * box, and a percentage against an `auto` containing block collapses.
 */

/** A 40px icon slot, standing in for the frame's grey placeholder squares. */
function IconSlot({ icon: Icon }: { icon: typeof Phone }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center text-consumer-primary"
    >
      <Icon className="size-7" strokeWidth={1.75} />
    </span>
  )
}

/**
 * A phone number and an email address are the two things on this page someone
 * will actually act on, so they are real `tel:`/`mailto:` links rather than
 * text a carer has to copy out by hand. The frame draws them as plain text.
 *
 * ⚠️ **The whole row is the link, at 44px.** A first pass made only the text
 * itself the link and `design/layout-audit.js` caught it at **20px tall** —
 * under this project's 36px floor, on the one surface whose audience has the
 * explicit "not digitally literate at all" note. Wrapping the icon in it too
 * makes the target the full row rather than a line of small text.
 */
function ContactRow({ icon: Icon, value, href }: { icon: typeof Phone; value: string; href: string }) {
  return (
    <a
      href={href}
      className="-mx-2 flex min-h-11 items-center gap-3 rounded-sm px-2 text-body-md break-words text-ink outline-none transition-colors hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-consumer-primary"
    >
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center text-consumer-primary"
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">{value}</span>
    </a>
  )
}

export function CoachProfileModal({
  open,
  onClose,
  dyadId,
  coach,
}: {
  open: boolean
  onClose: () => void
  dyadId: string
  coach: Coach | undefined
}) {
  return (
    <ConfirmDialog
      open={open}
      hideHeader
      hideFooter
      singleAction
      /* The accessible name, since `hideHeader` drops the visible title. */
      title={coach ? `Meet your coach, ${coach.fullName}` : 'Meet your coach'}
      body=""
      confirmLabel="Close"
      cancelLabel="Close"
      onConfirm={onClose}
      onClose={onClose}
      /* 675 = the frame's 614 plus ~10% (direct instruction). The wave is sized
         as a percentage of the card, so it widens with the panel and needs no
         second edit; the hero height and portrait stay at the frame's values,
         so the curve simply reads a little shallower across a wider card.
         `min(92vw, …)` keeps the cap the viewport's on a phone. */
      panelClassName="w-[min(92vw,675px)] max-h-[90vh] overflow-hidden rounded-lg p-0"
      contentClassName="mt-0"
      /* No footer at all (direct instruction) — the card is the whole panel,
         and a grey chassis bar under it read as a second surface. The dismiss
         control is the button over the hero below, so the dialog still has a
         visible way out besides Escape and the backdrop. Note this also
         retires a fix made minutes earlier: the footer's bleed had to be
         cancelled at `md:` as well as at the base, and with no footer there is
         nothing left to bleed. */
    >
      <div className="relative flex flex-col">
        {/* Top-right, over the purple hero. White on `#3A00AD` measures
            11.78:1. 44px, this portal's target size, and it is the dialog's
            only visible dismiss control now that the footer is gone.

            It **scrolls with the content** rather than pinning to the panel
            (direct instruction). It was briefly `sticky` in a zero-height
            wrapper, on the reasoning that a dialog should always show a way
            out; the bottom Close button now carries that duty, so the X can
            belong to the hero it sits on and leave with it. */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex size-11 items-center justify-center rounded-full text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
        >
          <X aria-hidden="true" className="size-6" />
          <span className="sr-only">Close</span>
        </button>
      {/* ── Hero: the wave, the identity block and the portrait ────────── */}
      <div className="relative h-[224px] w-full sm:h-[250px]">
        <img
          src="/illustrations/consumer-coach/coach-hero-wave.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 max-w-none"
          style={{
            width: `${WAVE_W_PCT}%`,
            height: `${WAVE_H_PCT}%`,
            /* The frame skews the vector by -0.82deg. Reproduced with the
               centring transform rather than on a wrapper, so there is one
               transform on one element. */
            transform: 'translateX(-50%) skewX(-0.82deg)',
          }}
        />

        <div className="absolute inset-x-0 top-[42px] px-6 text-center sm:top-14">
          <p className="text-consumer-card-title-sm font-semibold text-white">
            Meet your coach
          </p>
          <p className="text-consumer-card-title-sm font-semibold text-balance text-white">
            {coach ? coach.fullName : 'Not assigned yet'}
          </p>
          {/* The frame's "Aged Care & Dementia Specialist" is a label this
              data model does not have. `roleAtEmployer` is the real field
              that answers the same question, so the line is true for
              whichever coach a dyad actually has. */}
          {coach && (
            <p className="mt-2 text-body text-parchment">{coach.roleAtEmployer}</p>
          )}
        </div>

        {/* Anchored to the hero's bottom edge so it straddles the wavy line
            exactly as drawn, whatever the text above it does. */}
        <div className="absolute bottom-[-51px] left-1/2 size-28 -translate-x-1/2 sm:bottom-[-65px] sm:size-36">
          {/* The white ring is a border on the element that also clips the
              photo, so ring and photo cannot drift apart — the frame draws
              it as two nested 8px/4.667px strokes, which is one ring. */}
          <img
            src="/illustrations/consumer-coach/coach-portrait.png"
            alt=""
            aria-hidden="true"
            className="size-full rounded-full border-[6px] border-white object-cover sm:border-8"
          />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {/* pt clears the portrait's overhang, then the frame's own 24px. */}
      <div className="flex flex-col gap-6 px-5 pt-[75px] pb-8 sm:px-8 sm:pt-[89px]">
        <section className="flex gap-4">
          <IconSlot icon={Stethoscope} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="text-consumer-lesson text-ink">Speciality</h2>
            <p className="text-pretty text-body leading-[1.4] text-ink">
              {coach
                ? `${coach.fullName.split(' ')[0]} has ${coach.yearsInAgedCare} years of experience in aged care at ${coach.employer}, working as ${/^[aeiou]/i.test(coach.roleAtEmployer) ? 'an' : 'a'} ${coach.roleAtEmployer.toLowerCase()}. They are trained as a Care2Sleep coach to help you and your family build gentle, practical routines that make sleep easier.`
                : 'Your coach will be introduced here once one is assigned to you.'}
            </p>
          </div>
        </section>

        <section className="flex gap-4">
          <IconSlot icon={GraduationCap} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="text-consumer-lesson text-ink">Professional background</h2>
            {/* The frame's four bullets are literal `<>` placeholders, so
                there is no copy to transcribe. These are built from the
                real `Coach` fields instead — a coach record carries no
                biography, and inventing four sentences of one would put
                fiction on a participant's screen. */}
            {coach ? (
              <ul className="ms-6 flex list-disc flex-col gap-2 text-body leading-[1.4] text-ink">
                <li>{coach.roleAtEmployer} at {coach.employer}</li>
                <li>{coach.yearsInAgedCare} years working in aged care</li>
                <li>Completed the Care2Sleep coach training program</li>
                <li>Supported by the Care2Sleep research team at Monash University</li>
              </ul>
            ) : (
              <p className="text-body text-ink">Not available yet.</p>
            )}
          </div>
        </section>

        {/* Frame `979:8307` — label beside the rows on a wide card, stacked
            on a narrow one, which the frame has no state for. */}
        <section className="flex flex-col gap-4 rounded-sm bg-purple-50 px-6 py-4 sm:flex-row sm:gap-12">
          <h2 className="text-consumer-lesson text-ink sm:whitespace-nowrap">Contact details</h2>
          {coach ? (
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <ContactRow icon={Phone} value={coach.phone} href={`tel:${coach.phone.replace(/\s+/g, '')}`} />
              <ContactRow icon={Mail} value={coach.email} href={`mailto:${coach.email}`} />
            </div>
          ) : (
            <p className="text-body text-ink">Not available yet.</p>
          )}
        </section>

        <section className="flex flex-col gap-2 rounded-sm bg-yellow-200 px-6 py-4">
          <IconSlot icon={MessageCircleQuestionMark} />
          <div className="flex flex-col gap-1">
            <h2 className="text-consumer-lesson text-ink">
              In case you cannot reach your coach
            </h2>
            {/* The frame's `<name>@.edu` is an unfilled placeholder. The
                research team's real address is not in this data model, so
                the sentence points at the page that exists for exactly this
                rather than printing a broken address. */}
            <p className="text-pretty text-body leading-[1.4] text-ink">
              If you cannot reach your coach, the{' '}
              {/* Navigating away has to close the modal too: the dialog is
                  mounted by `CoachCard` on Home, and React Router would swap
                  the page underneath an open panel otherwise. */}
              <Link
                to={`/consumer/${dyadId}/help`}
                onClick={onClose}
                className="underline outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-consumer-primary"
              >
                Need help
              </Link>{' '}
              page has other ways to get in touch with the research team.
            </p>
          </div>
        </section>

        {/* A second way out at the end of the card (direct instruction), in the
            session-feedback flow's own secondary pill: 48px, `rounded-[28px]`,
            1px brand border, brand label on white. Written as values rather
            than imported — `SessionFeedbackModal`'s `PILL`/`PILL_BACK` are
            private to that file and carry its per-frame widths.

            Two dismiss controls is deliberate, not a duplicate: the X pins to
            the top of a panel whose content runs ~1000px, and this one meets
            the reader where the content ends, which for this audience is where
            they will look for it. */}
        <button
          type="button"
          onClick={onClose}
          className="text-body-md flex h-12 w-full items-center justify-center gap-2 rounded-[28px] border border-consumer-primary bg-white px-5 text-consumer-primary outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 sm:w-[152px] sm:self-center"
        >
          Close
        </button>
      </div>
      </div>
    </ConfirmDialog>
  )
}
