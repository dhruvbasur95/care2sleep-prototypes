import { Link, Navigate, useParams } from 'react-router-dom'
import { NotebookPen, Video } from 'lucide-react'
import { CoachCard } from '@/components/consumer/CoachCard'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import { LearningTaskCard } from '@/components/consumer/LearningTaskCard'
import {
  CONSUMER_CREST_TRACKING,
  CONSUMER_HERO_TO_CONTENT,
  ConsumerCanvasWave,
  ConsumerContentReveal,
  ConsumerPageHero,
} from '@/components/consumer/ConsumerCanvasWave'
import {
  SPACES_CATCHUP_COUNT,
  displaySessionNumber,
  type ConsumerDyad,
} from '@/data/spaces'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { TODAY, formatTime } from '@/data/format'

/**
 * Consumer Portal Home — Figma frame `761:3170`, a full replacement for the
 * Round 5 dashboard rather than an edit of it.
 *
 * What went, on direct instruction ("Get rid of the following from home page ->
 * 7 session road map, Sleep goals section, learning dashboard card. These are no
 * longer needed for consumers"): all three, plus the Health & Sleep tab and the
 * left sidebar with it (see `ConsumerHeader`). What the frame puts in their
 * place is a single day-shaped page: who you are, what today is, the two things
 * to do today, and when you next see your coach.
 *
 * Frame measurements, transcribed:
 *   page inset          80px sides, 32px top, 80px bottom; inner pt 16 / pb 64
 *   welcome -> content  48px          content sections     56px apart
 *   heading -> cards    24px          task row             420px tall, 40px gap
 *   learning card       744px wide, 192px cover, 32px padding, 32px inner gap
 *   diary card          fills the rest, pt 24 / px 24 / pb 32
 *   session card        328px panel + 32px/48px padding, 48px inner gap
 *   radius 16 everywhere, `parchment` stroke, the project's warm Card shadow
 *
 * ONE THING TO KNOW BEFORE EDITING: **the two 192px and 328px blocks are empty
 * in the frame and empty here.** They are reserved imagery — a module cover and
 * a session illustration — that does not exist as an asset yet. They are
 * rendered as plain tinted blocks rather than filled with a stand-in gradient,
 * because a placeholder that looks finished is the harder thing to notice later.
 *
 * Data: this round is UI rewiring only (direct instruction: "you do not worry
 * about data, focus on rewiring UI"), so every value below reads a field that
 * already exists — the dyad's two names, its `upcomingSession`, its assigned
 * coach, and its own module engagement. Nothing was added to the store and no
 * seed data was reshaped. The frame's own strings ("Helen & Richie", "Monday,
 * 31 August", "Understanding Your Sleep Patterns", "Tuesday, 2 September")
 * are the designer's sample content and are NOT hardcoded here.
 */

/* ------------------------------------------------------------------------ */
/* Shared card chrome                                                        */
/* ------------------------------------------------------------------------ */

/** The frame's own card treatment: 16px radius, a 1px `parchment` stroke and
 *  the warm Card shadow. Written out rather than using `<Card>` because every
 *  card on this page has a full-bleed tinted region running to its own edge,
 *  which `Card`'s padding and `bg-card` default both fight. */
const CARD = 'overflow-hidden rounded-lg border border-parchment shadow-card'

/**
 * The same card, stroked `hairline` (#e0e0e0) instead of `parchment` (#f5f5f7).
 *
 * Only the next-session card takes it, and that is the frames' own choice, not
 * an oversight in them — `761:3447` (desktop) and `787:1537` (mobile) both draw
 * `#e0e0e0` where the lesson, diary and coach cards all draw `#f5f5f7`. It is
 * the one card of the four sitting on white with no tinted region of its own, so
 * the slightly darker stroke is what keeps its edge visible.
 *
 * Written as a second constant rather than appended to `CARD`: these are plain
 * template strings, not `cn()`, so two competing `border-*` classes would be
 * resolved by stylesheet order rather than by intent.
 */
const CARD_HAIRLINE = 'overflow-hidden rounded-lg border border-hairline shadow-card'

/**
 * ── The paired type constants are gone ────────────────────────────────────
 *
 * This file used to carry `CARD_TITLE`, `HEADING_22`, `EYEBROW_18` and
 * `LEAD_20`, each a **pair** of classes (`text-x md:text-y`) standing in for a
 * step that changes size between mobile and desktop.
 *
 * Every one of those is now a single token whose size is a `clamp()` spanning
 * the two frames — `text-consumer-card-title`, `text-consumer-heading`,
 * `text-consumer-eyebrow`, `text-consumer-lead`. The constants are deleted
 * rather than repointed, because their whole reason to exist was keeping the
 * two halves of a pair together, and there is no longer a second half.
 *
 * Two things that buys beyond brevity: tablet is a real size instead of a copy
 * of desktop, and a call site can no longer accidentally keep the mobile value
 * by dropping the `md:` half. See `consumer-tokens.css` for the formula.
 */

/** The frame's card padding, mobile -> desktop: `px-4 py-6` becomes
 *  `px-8 pt-8 pb-10` (frames `787:1524`/`787:1537` vs `761:3379`/`761:3447`).
 *  One constant, because three cards share it and they drifted apart once
 *  already when each carried its own copy. */
const CARD_PAD = 'px-4 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-10'

/**
 * The 52px icon slot the frame added to the sleep-diary and next-session cards
 * (direct instruction: "I have also added icon provision for sleep diary, and
 * session card. add icon use blue color as used for buttons").
 *
 * The frame draws each as a bare `#d9d9d9` square — a placeholder, not a
 * treatment — so the square is not reproduced. What ships is a lucide glyph in
 * `consumer-primary`, which is the "blue" the instruction means: it is the fill
 * on every CTA on this page. Glyphs are chosen to match how this app already
 * uses them — `NotebookPen` is the reflection/notes mark, `Video` is the mark on
 * every Zoom session row in all four portals.
 */
function CardIcon({ icon: Icon }: { icon: typeof Video }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-[52px] shrink-0 items-center justify-center text-consumer-primary"
    >
      <Icon className="size-10" strokeWidth={1.75} />
    </span>
  )
}

const CTA =
  'flex h-12 items-center justify-center gap-4 rounded-3xl px-5 text-body-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2'

/* ------------------------------------------------------------------------ */
/* Today's date                                                              */
/* ------------------------------------------------------------------------ */

/**
 * "Monday, 31 August" — the frame's format, split so the weekday can sit in the
 * regular weight and the date heavier, which is how `761:3287` sets it.
 *
 * Reads the **real** current date, not the app's frozen demo `TODAY`
 * (`2026-07-22`). That was the first pass and it was wrong on screen: a line
 * that literally says "Today is" and then names a date three weeks in the past
 * is the one place in this app where the demo constant cannot stand in for the
 * clock, because the reader can check it against their own calendar.
 *
 * ⚠️ The consequence, and it is a data-layer one this round deliberately did not
 * touch: every *other* date on this page still derives from `TODAY`, so a
 * session dated 22 July now reads as past relative to this greeting. The fix is
 * to move the seed's `TODAY` forward (or make it dynamic), which is a change
 * felt across all four portals — flagged, not taken here.
 */
function todayParts(): { weekday: string; date: string } {
  const d = new Date()
  return {
    weekday: d.toLocaleDateString('en-AU', { weekday: 'short' }),
    date: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long' }),
  }
}

/**
 * A session's end time, for the frame's "10:00am to 11:00am" row.
 *
 * See the call site's own note: there is no end time or duration on the session
 * record, so this adds a stated hour to the start. Wraps with `% 24` rather than
 * overflowing to "24:00" — a late-evening session is not a real case in this
 * study, but a time control that can print an invalid hour is worth one modulo.
 */
function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/* ------------------------------------------------------------------------ */
/* Welcome header                                                            */
/* ------------------------------------------------------------------------ */

function WelcomeHeader({ dyad }: { dyad: ConsumerDyad }) {
  const { weekday, date } = todayParts()
  // Both dyad members, carer first, matching the frame's two-name greeting.
  // A carer-only dyad has no PLE, so it greets one person rather than printing
  // a dangling ampersand — the frame has no carer-only state to copy.
  const names = [dyad.carer, dyad.patient]
    .filter(Boolean)
    .map((p) => p!.name.split(' ')[0])
    .join(' & ')

  return (
    // The whole block — mascot, alignment, gaps and both type steps — is
    // `ConsumerPageHero`, shared with My Lessons. Everything the comments here
    // used to explain (left on mobile / centred from `sm`, the 16 -> 48 gap that
    // is deliberately not the frame's 32) moved with it, so there is one place
    // to change it rather than one per page.
    //
    // Semi-bold on the date, not bold (direct instruction): 600 against the
    // line's own 400 is a clear enough step at 20px, and 700 next to a 40px
    // display heading directly above competed with it.
    <ConsumerPageHero
      title={`Hello ${names}`}
      sub={
        <>
          Today is <strong className="font-semibold">{`${weekday}, ${date}`}</strong>
        </>
      }
    />
  )
}

/* ------------------------------------------------------------------------ */
/* Task 2 — sleep diary                                                      */
/* ------------------------------------------------------------------------ */

function DiaryTaskCard({ dyadId }: { dyadId: string }) {
  /**
   * Whether today's diary is already in.
   *
   * ⚠️ This reads `diarySubmittedOn`, NOT the health log. Checking the log for
   * a diary on TODAY was the first pass and it is wrong here: `healthLog()`
   * seeds a `diary` on every date it generates and its last date IS `TODAY`,
   * so every dyad loads with today's entry already populated and the card
   * showed "done" before anyone had filled anything in. Caught by reloading
   * and finding the completed state on a fresh store.
   */
  const { consumerDyads } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)
  const done = dyad?.diarySubmittedOn === TODAY

  return (
    <div
      // A fixed 40px gap after the icon, and **no `justify-between`** — which
      // the frame does use, and which was tried both ways.
      //
      // `justify-between` distributes slack, so it only reproduces the frame at
      // the frame's own proportions. Stacked on a phone there is no slack and the
      // icon touched "Sleep Diary" ("spacing does not match figma frame"); on a
      // laptop, where this card stretches to a learning card taller than the
      // frame's, it opened to ~170px ("so much dead space before sleep diary
      // icon"). The same property produced both complaints. A fixed gap is the
      // one arrangement that reads identically at every card height, so the
      // slack now collects at the bottom of the card instead of inside the copy.
      // `purple-200` (#e4d6ff), not the `yellow-200` this card shipped as —
      // frame `761:3379` recolours it. The yellow does not leave the page: it is
      // still the coach card's own band, so the two cards no longer share a fill
      // and the diary now sits in the same family as the purple lesson card
      // beside it.
      className={`${CARD} ${CARD_PAD} flex min-w-0 flex-1 flex-col gap-6 self-stretch bg-purple-200 sm:gap-10`}
    >
      {/* Frame `771:3704` — the new icon slot, at the top of the card with the
          content pushed to the bottom by `justify-between`, which is the frame's
          own arrangement. */}
      <CardIcon icon={NotebookPen} />
      {/* Direct instruction: "can Play Module and Fill in sleep diary be bottom
          aligned", reported three times before it held.

          The mechanism is **`mt-auto` on the button as a DIRECT child of the
          card**, and both halves of that matter. `flex-1` + `justify-between` on
          an inner wrapper was the first attempt: `flex: 1 1 0%` lets a column
          child shrink below its content, so the card stopped growing and pushed
          the button past its own `overflow-hidden` edge. Moving to `mt-auto` was
          right but was applied to a wrapper that then measured 285.6px inside a
          card with 57px of unclaimed slack — the wrapper simply was not growing,
          so the margin had nothing to consume. Removing the wrapper entirely
          leaves the card as the only flex column, and its slack is unambiguously
          the button's to take. */}
      {/*
        ── Done for today (frame `818:12819`) ────────────────────────────────
        The card shell, its fill, padding, radius, shadow and icon are all
        UNCHANGED — only the copy differs, and the eyebrow label and CTA are
        absent ("only copy gets updated, CTA hides, so does the card label
        text. add this state without messing up the dimensions").

        Nothing here touches height. The card is `self-stretch flex-1` in a row
        with the lesson card, so the row's height is the taller sibling's
        either way; dropping the CTA just leaves the slack the frame also
        draws, with the copy sitting at the top.
      */}
      {done ? (
        <div className="flex flex-col gap-2 text-ink">
          <p className="text-consumer-card-title text-balance">
            Thanks for filling in today&rsquo;s sleep diary
          </p>
          <p className="text-consumer-eyebrow text-balance">
            Remember to fill it in again tomorrow, right here on your homepage.
          </p>
        </div>
      ) : (
      <div className="flex flex-col gap-6 text-ink">
        {/* "Fill sleep diary", not the frames' noun "Sleep Diary" (direct
            instruction) — every other eyebrow in this row heads a task, and the
            section above them both says "Your tasks for today". */}
        <p className="text-consumer-eyebrow">Fill sleep diary</p>
        <div className="flex flex-col gap-2">
          <p className="text-consumer-card-title">How did you sleep last night?</p>
          {/* The frame's 18/400 at 1.4. The app's `sub-greeting` token is the
              right size and weight but `normal` line height, so 1.4 is applied
              locally — the same call the trainee welcome flow made rather than
              moving a token every portal hero reads. */}
          {/* Extended on direct instruction ("add after 5 mins. It is important
              for both of you to fill this fix english"). The added clause is
              true to the data model, not just encouragement: this app keeps a
              separate diary row for the PLE and the carer, so "each" is
              accurate. The frame's own "roughly 5mins" is corrected to "about 5
              minutes" as part of the same instruction — plain, unabbreviated
              wording is also what this portal's audience note asks for. */}
          <p className="text-consumer-eyebrow">
            Please fill in your sleep diary. It takes about 5 minutes, and it is important that
            you each fill in your own.
          </p>
        </div>
      </div>
      )}
      {/* Round 44 — live at last: opens the sleep diary fill-in flow's welcome
          screen (`ConsumerDiaryPage`). This control was `aria-disabled` from
          Round 41 to 43 because the write path had no destination. */}
      {!done && (
        <Link
          to={`/consumer/${dyadId}/diary`}
          className={`${CTA} mt-auto w-full bg-consumer-primary text-white`}
        >
          {/* "Fill in sleep diary", not the frame's "Fill In Diary" (direct
              instruction) — names the thing in full, and in this project's own
              sentence casing rather than the frame's title case. */}
          Fill in sleep diary
        </Link>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Your next session                                                         */
/* ------------------------------------------------------------------------ */

function NextSessionCard({ dyad }: { dyad: ConsumerDyad }) {
  const upcoming = dyad.upcomingSession
  // The frame draws only the booked state. A dyad with nothing scheduled is a
  // real case in this app (`dyad-014` has no plan at all), so it gets a plain
  // line rather than a card promising a call that does not exist.
  if (!upcoming || dyad.optedOut) {
    return (
      <div className={`${CARD_HAIRLINE} ${CARD_PAD} bg-white`}>
        <p className="text-consumer-eyebrow text-ink-muted">
          {dyad.optedOut
            ? 'You have opted out of Care2Sleep, so session links are no longer available here.'
            : 'Nothing booked yet. Your coach will schedule your next call with you.'}
        </p>
      </div>
    )
  }

  const d = new Date(`${upcoming.date}T00:00:00`)
  const weekday = d.toLocaleDateString('en-AU', { weekday: 'short' })
  // Weekday abbreviated (direct instruction: "can we use Mon, Tue, Wed.. instead
  // of full day names"), month still written out. The two are a deliberate split:
  // a short weekday is a universally-read convention, where an abbreviated month
  // is the kind of shortening this portal's plain-language note argues against.
  const date = d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Internal session 1 is "Planning", which has no number — `displaySessionNumber`
  // would render it as "0 of 6". The 6 numbered catch-ups are internal 2-7.
  const isPlanning = upcoming.session === 1
  const shownNumber = displaySessionNumber(upcoming.session)

  return (
    /* Frame `761:3447` (rebuilt): the flat "Session date and time:" eyebrow and
       single date line are replaced by a titled, ruled block — which session this
       is out of six, then its status, then the date and time as labelled rows. */
    <div className={`${CARD_HAIRLINE} ${CARD_PAD} flex flex-1 flex-col gap-8 bg-white`}>
      {/* Frame `771:3701` — the icon slot. See `CardIcon`. */}
      <CardIcon icon={Video} />

      {/* `flex-1` + `mt-auto` on the CTA so it sits on the card's bottom edge
          rather than directly under its own copy — the session and coach cards
          stretch to a shared row height, and without this their two CTAs land at
          different heights (reported at tablet). */}
      <div className="flex flex-1 flex-col gap-8">
        <div className="flex flex-col gap-6">
          {/* Frame `787:1110`: the count is the one brand-coloured span in the
              title, so "which session is this" is what the eye lands on. */}
          <p className="text-consumer-card-title text-ink">
            Coaching session:{' '}
            <span className="text-consumer-primary">
              {isPlanning ? 'Planning' : `${shownNumber} of ${SPACES_CATCHUP_COUNT}`}
            </span>
          </p>

          {/* Frame `787:1125` draws a 1px `#e0e0e0` rule — this app's `hairline`,
              as a real border rather than the frame's exported SVG. */}
          <hr className="border-t border-hairline" />

          <div className="flex flex-col gap-4">
            <p className="text-consumer-eyebrow text-ink-muted">Scheduled</p>
            {/* Frame `787:1130`: label in ink, value in brand purple, 4px apart.
                A real `<dl>` — this project's standing rule for every
                label/value pair. */}
            <dl className="flex flex-col gap-1">
              <div className="text-consumer-card-title flex flex-wrap gap-x-2">
                <dt className="text-ink">For:</dt>
                <dd className="text-consumer-primary">
                  {weekday}, {date}
                </dd>
              </div>
              <div className="text-consumer-card-title flex flex-wrap gap-x-2">
                <dt className="text-ink">At:</dt>
                {/*
                  ⚠️ **The end time is derived, not stored.** `UpcomingSession`
                  carries a start `time` and nothing else, so the frame's
                  "10:00am to 11:00am" is reproduced as start + one hour. One
                  hour is this study's own session length everywhere else it is
                  stated, but it is an assumption living in the render rather
                  than a field — the honest fix is a `durationMin` (or an
                  `endTime`) on the session record.
                */}
                <dd className="text-consumer-primary">
                  {formatTime(upcoming.time)} to {formatTime(addOneHour(upcoming.time))}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <a
          href={upcoming.zoomLink}
          target="_blank"
          rel="noreferrer"
          className={`${CTA} mt-auto w-full bg-consumer-primary text-white min-[1281px]:w-64`}
        >
          Join video call
        </a>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

export function ConsumerHomePage() {
  const { dyadId } = useParams()
  const { consumerDyads } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)

  if (!dyad) return <Navigate to="/consumer" replace />

  return (
    <ConsumerShell
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      // No hero band and no top banner. The frame's greeting is page content on
      // the warm canvas, and the "session today" banner this page used to pin
      // above its hero is now redundant — "Your next session" says the same
      // thing in the layout's own terms, and two copies of one fact is what
      // this project keeps having to unpick.
      contentClassName="bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-20 md:px-20"
      optedOut={dyad.optedOut}
    >
      <ConsumerCanvasWave />

      {/*
        The viewport-derived top margin — direct instruction: "for desktop just
        move the avatar + hello section and everything below that down, so that
        avatar sits properly, without touching background wavy position."

        The mascot is already at the frame's exact position (measured 144 -> 234
        against `761:3269`'s own 144 -> 234); what moves past 1281px is the wave.
        Shared with the in-progress pages so one hero cannot track the crest
        while another does not — see `CONSUMER_CREST_TRACKING` for the derivation.
      */}
      <div
        className={cn('relative flex flex-col items-center pt-4 pb-16', CONSUMER_HERO_TO_CONTENT)}
        style={CONSUMER_CREST_TRACKING}
      >
        <WelcomeHeader dyad={dyad} />

        {/* Only this block animates on a tab change — the wave, the mascot and
            the greeting above it hold still. See `ConsumerContentReveal`. */}
        <ConsumerContentReveal className="flex w-full flex-col gap-14">
          <section className="flex flex-col gap-6">
            <h2 className="text-consumer-heading text-ink">Your tasks for today</h2>
            {/* **No fixed row height.** The original frame pinned this row at
                420px and that number was transcribed; the streamlined frame
                (`761:3442`) dropped it, and keeping it was what pushed the
                diary card's now-four-line copy 19px past its own
                `overflow-hidden` edge — measured, after `mt-auto` alone did not
                fix it. The row grows to its tallest card and `items-stretch`
                brings the other up to match. */}
            <div className="grid grid-cols-1 gap-6 sm:gap-10 md:items-stretch min-[768px]:grid-cols-2 min-[1281px]:grid-cols-[744px_1fr]">
              <LearningTaskCard dyad={dyad} />
              <DiaryTaskCard dyadId={dyad.id} />
            </div>
          </section>

          {/* Frame `761:3444` (updated): the two sections now sit **side by
              side** — 540.5px each with a 40px gap inside the 1121px column —
              rather than stacked full width. `lg:` because at 540px each they
              need a wide viewport; below that they stack, which is the same
              content in the same order.

              `min-w-0` on the cells is not optional: a grid item defaults to
              `min-width: auto`, and this project has shipped a real horizontal
              page scroll from exactly that omission three times. */}
          <div className="grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-2">
            <section className="flex min-w-0 flex-col gap-6">
              {/* Frame `761:3445`: "Your next session details", where it read
                  "Your next session" — the card under it now carries the
                  session number, status, date and time rather than one line. */}
              <h2 className="text-consumer-heading text-ink">Your next session details</h2>
              <NextSessionCard dyad={dyad} />
            </section>

            <section className="flex min-w-0 flex-col gap-6">
              <h2 className="text-consumer-heading text-ink">Meet your coach</h2>
              <CoachCard dyad={dyad} />
            </section>
          </div>
        </ConsumerContentReveal>
      </div>
    </ConsumerShell>
  )
}
