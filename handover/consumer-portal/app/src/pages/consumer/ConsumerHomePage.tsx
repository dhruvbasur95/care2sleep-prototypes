import { Link, Navigate, useParams } from 'react-router-dom'
import { NotebookPen, Video } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CoachCard } from '@/components/consumer/CoachCard'
import { SessionFeedbackBanner } from '@/components/consumer/SessionFeedbackBanner'
import { SessionFeedbackModal } from '@/components/consumer/SessionFeedbackModal'
import { CARD_HAIRLINE, CARD_PAD, CardIcon } from '@/components/consumer/ConsumerCard'
import { SessionPlanStrip } from '@/components/consumer/SessionPlanStrip'
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
  dyadFirstNames,
  type ConsumerDyad,
  nextPlannedSession,
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

const CTA =
  'flex h-12 items-center justify-center gap-4 rounded-3xl px-5 text-body-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2'

/* ------------------------------------------------------------------------ */
/* Today's date                                                              */
/* ------------------------------------------------------------------------ */

/**
 * "Monday, 31 August" — the frame's format, split so the weekday can sit in the
 * regular weight and the date heavier, which is how `761:3287` sets it.
 *
 * ⚠️ Reads the app's frozen `TODAY`, **not** `new Date()`. This is the one
 * line in the portal that names the current date out loud, so it is the one
 * that makes the frozen clock visible — and that is exactly why it has to use
 * it.
 *
 * It used to read the real clock, on the reasonable argument that a line saying
 * "Today is" can be checked against the reader's own calendar. The cost was
 * worse: every other date on this page derives from `TODAY`, so the greeting
 * announced one date while the card directly beneath it called a session
 * "Scheduled" for a date already behind that one. Captured live before the fix:
 * "Today is Mon, 14 September" sitting above "Coaching session: 4 of 6 ·
 * Scheduled · Wed 2 September". Two clocks on one screen is the "two surfaces,
 * one fact" failure this project keeps rediscovering, and in a package that may
 * sit unopened for months the real clock drifts further from the seed every day.
 *
 * **In production this becomes the real date** — see
 * `docs/integration-points.md` §2. At that point `TODAY` disappears, every
 * comparison that reads it moves to a server-provided now, and this function
 * goes back to `new Date()`. Until then, one clock.
 *
 * The ISO string is split by hand rather than passed to `new Date(iso)`, which
 * parses a bare date as UTC and renders the previous day for anyone east of
 * Greenwich — Melbourne included, which is where this study runs.
 */
function todayParts(): { weekday: string; date: string } {
  const [year, month, day] = TODAY.split('-').map(Number)
  const d = new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1)
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
  // Shared with the onboarding tour's own greeting via `dyadFirstNames` — two
  // surfaces greeting the same two people must not hold two copies of the rule.
  const names = dyadFirstNames(dyad)

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

function NextSessionCard({
  dyad,
  onToggleSessionFeedback,
}: {
  dyad: ConsumerDyad
  onToggleSessionFeedback: () => void
}) {
  const { sessionPlans, sessionCompletion } = useResearch()

  /*
    ⚠️ **Derived from the live plan + completion, not `dyad.upcomingSession`.**
    That seed field is frozen: it still names internal session 2 (22 July) on
    this portal's own demo dyad, whose completion record has sessions 1-4 done.
    Nobody could see that until Round 48 put the whole plan on screen directly
    below this card — at which point this one said "Coaching session: 1 of 6,
    Wed 22 July" while the strip marked that exact session Completed and pointed
    at Session 04. One fact, two fields, two answers, eight inches apart.

    `nextPlannedSession` already existed and already excluded the Planning row;
    it is what the strip reads too, so the two cannot drift again.

    Scope note: `upcomingSession` is still read by the Coach Delivery and
    Research portals. Those are stale in the same way and are deliberately left
    alone — this fixes the contradiction that is actually on screen together.
  */
  const upcoming = nextPlannedSession(sessionPlans[dyad.id], sessionCompletion[dyad.id] ?? [])
  // The frame draws only the booked state. A dyad with nothing scheduled is a
  // real case in this app (`dyad-014` has no plan at all), so it gets a plain
  // line rather than a card promising a call that does not exist.
  /* ⚠️ **Opting out is deliberately NOT a condition here** — direct
     correction: "optingout for consumer does noting on their end". This branch
     used to also fire on `dyad.optedOut` and tell the consumer their session
     links were no longer available, which is a consequence this platform does
     not actually deliver: opting out records the request and the research team
     follows it up off-platform. Withholding a booked call's link on the
     strength of it made the page contradict the opt-out card beside it. */
  if (!upcoming?.date || !upcoming.time) {
    return (
      <div className={`${CARD_HAIRLINE} ${CARD_PAD} bg-white`}>
        <p className="text-consumer-eyebrow text-ink-muted">
          Nothing booked yet. Your coach will schedule your next call with you.
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
  // `nextPlannedSession` already filters the planning row out, so this guard is
  // belt-and-braces rather than a reachable state; it is kept because the card
  // renders `upcoming.session` directly and a future caller might not.
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
                  ⚠️ **Prefers the stored `endTime`; derives one only if absent.**
                  `endTime` IS an optional field on a plan row, and
                  `SessionPlanStrip` — which renders the same session further
                  down THIS page — reads it. Deriving unconditionally here meant
                  two authorities for one fact: with `endTime` unset on all
                  seven seed rows they happened to agree, and the moment anyone
                  set one they would have disagreed nine inches apart on the
                  same screen. That is this project's most-repeated bug class.

                  The fallback is start + one hour, which is this study's own
                  session length everywhere it is stated — but it is an
                  assumption living in the render rather than a field, so it is
                  a fallback and not the rule. The real fix is `endTime` (or a
                  `durationMin`) being populated on the session record; see
                  `docs/data-model.md`.
                */}
                <dd className="text-consumer-primary">
                  {formatTime(upcoming.time)} to{' '}
                  {formatTime(upcoming.endTime ?? addOneHour(upcoming.time))}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/*
          ⚠️ **A demo switch, not the real Join.** Direct instruction: "to show
          this trigger, just use the session detail card join video call button
          as a switch, show and hide" — pressing it toggles the post-session
          feedback banner above the tasks, standing in for the session-finished
          signal the platform does not have yet.

          It is a `<button>` rather than the `<a href={upcoming.zoomLink}>` it
          replaces, because a control that opens Zoom in a new tab *and* toggles
          a banner would be two actions wearing one label. The Zoom link is
          still on the record and this reverts to an anchor in one line.

          This is a review tool in the same category as `CoachStageSwitcher`:
          delete it the moment a real "session complete" signal exists, rather
          than building on it.
        */}
        <button
          type="button"
          onClick={onToggleSessionFeedback}
          className={`${CTA} mt-auto w-full bg-consumer-primary text-white min-[1281px]:w-64`}
        >
          Join video call
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * "4th", not "fourth" — direct instruction. Digits are quicker to read than
 * number words, which matters more than usual for this portal's readers, and
 * the sentence around it is already plain.
 *
 * The planning session never reaches here: it has no number and is described by
 * its own name, the same rule the rest of the app follows.
 */
function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

export function ConsumerHomePage() {
  const { dyadId } = useParams()
  const { consumerDyads, sessionCompletion } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)
  /** Toggled by the session card's Join control — a demo switch standing in for
   *  the "session finished" signal the platform does not have yet. */
  const [showSessionFeedback, setShowSessionFeedback] = useState(false)
  /** Skip asks first — direct instruction. */
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false)
  /** The two-step feedback flow, frames `951:6673` / `951:6776` / `951:6954`. */
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  /* Which session the banner says was finished — see the note below. */
  /* The supplied sentence is "You finished your <> session", so the placeholder
     has to read as an ordinal — "your fourth session" — and the planning session
     fills it as the word "planning", which is what it is called everywhere else
     in this app. Never a raw number: internal session 1 is Planning and has no
     number at all.

     ⚠️ This derives from the last session actually COMPLETED. It previously
     derived from `nextSession` — the session that has not happened yet — so the
     banner announced "You finished your 4th session" directly above a card
     reading "Coaching session: 4 of 6 · Scheduled · Wed 2 September". Two
     statements about the same session, on the same screen, one of them wrong:
     the reader had finished the third.

     `session !== 1` for the same reason `catchupSessionsCompleted` does it —
     Planning is not one of the six numbered catch-ups. If ONLY Planning is on
     the record the sentence says "planning"; with nothing at all it falls back
     to "latest", which is vague but never false. */
  const completedRecords = dyad ? (sessionCompletion[dyad.id] ?? []) : []
  const lastFinishedSession = completedRecords.reduce(
    (highest, record) => (record.session !== 1 && record.session > highest ? record.session : highest),
    0,
  )
  const finishedSessionOrdinal =
    lastFinishedSession > 0
      ? ordinal(displaySessionNumber(lastFinishedSession))
      : completedRecords.some((record) => record.session === 1)
        ? 'planning'
        : 'latest'

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
      showFooter
    >
      <ConsumerCanvasWave />

      {/*
        The viewport-derived top margin — direct instruction: "for desktop just
        move the avatar + hello section and everything below that down, so that
        avatar sits properly, without touching background wavy position.", then
        again with the remaining gap drawn over the live page: "move the avatar
        and all content below it down, so that it sits on the line."

        ⚠️ This block used to note that "the mascot is already at the frame's
        exact position (measured 144 -> 234 against `761:3269`'s own 144 -> 234)"
        and that only the wave moves past 1281px. The first half is true and is
        exactly the problem: at the frame's own position the mascot hangs 20.6px
        clear of the crest it is drawn resting on, so matching the frame is what
        made it float. Do not restore the frame value on the strength of that
        measurement — see `CONSUMER_CREST_TRACKING` for the derivation.

        Shared with My Modules and the in-progress pages so one hero cannot sit
        on the crest while another does not.
      */}
      <div
        className={cn(
          'relative flex flex-col items-center pt-4 pb-16',
          CONSUMER_HERO_TO_CONTENT,
          CONSUMER_CREST_TRACKING,
        )}
      >
        <WelcomeHeader dyad={dyad} />

        {/* Only this block animates on a tab change — the wave, the mascot and
            the greeting above it hold still. See `ConsumerContentReveal`. */}
        <ConsumerContentReveal className="flex w-full flex-col gap-14">
          <section className="flex flex-col gap-6">
            <h2 className="text-consumer-heading text-ink">Your tasks for today</h2>

            {/* Frames `930:5484` / `930:5313`. **Inside** the tasks section,
                under its heading — direct instruction, reversing an earlier
                placement above the title. `mb-4` on top of the section's own
                24px gap makes the space between this and the cards the frame's
                own 40px, while the heading keeps the section's normal rhythm. */}
            {showSessionFeedback && (
              <SessionFeedbackBanner
                sessionOrdinal={finishedSessionOrdinal}
                onShare={() => setFeedbackOpen(true)}
                onSkip={() => setSkipConfirmOpen(true)}
              />
            )}
            {/* **No fixed row height.** The original frame pinned this row at
                420px and that number was transcribed; the streamlined frame
                (`761:3442`) dropped it, and keeping it was what pushed the
                diary card's now-four-line copy 19px past its own
                `overflow-hidden` edge — measured, after `mt-auto` alone did not
                fix it. The row grows to its tallest card and `items-stretch`
                brings the other up to match. */}
            <div
              className={cn(
                'grid grid-cols-1 gap-6 sm:gap-10 min-[1024px]:items-stretch min-[1024px]:grid-cols-2 min-[1281px]:grid-cols-[744px_1fr]',
                // The frame puts 40px between the banner and the cards; the
                // section's own gap is 24, so the row makes up the difference
                // only while the banner is there.
                showSessionFeedback && 'mt-4',
              )}
            >
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
          {/*
            ── Where this page goes two-up ──────────────────────────────────
            Direct instruction: "in tablet view, for the smallest tablet i.e.
            ipad air, can the cards be stacked vertically ... Bigger the tablet
            gets more aligned it gets with desktop view."

            Both of this page's rows moved from `md` (768) to **1024**, so the
            portrait tablets stack into one column — iPad Air is 820 and iPad
            Pro 11" is 834, and at 768 each of these cards was getting roughly
            330px of usable width — while iPad Pro 12.9" portrait (1024) and
            every landscape tablet get the desktop pairing. 1281 then adds the
            desktop-only `744px` first column above.

            Stacked order is the DOM order and is what the instruction asked
            for: module, sleep diary, session details, coach, coaching plan.
          */}
          <div className="grid grid-cols-1 gap-6 sm:gap-10 min-[1024px]:grid-cols-2">
            <section className="flex min-w-0 flex-col gap-6">
              {/* Frame `761:3445`: "Your next session details", where it read
                  "Your next session" — the card under it now carries the
                  session number, status, date and time rather than one line. */}
              <h2 className="text-consumer-heading text-ink">Your next session details</h2>
              <NextSessionCard
                dyad={dyad}
                onToggleSessionFeedback={() => setShowSessionFeedback((v) => !v)}
              />
            </section>

            <section className="flex min-w-0 flex-col gap-6">
              <h2 className="text-consumer-heading text-ink">Meet your coach</h2>
              <CoachCard dyad={dyad} />
            </section>
          </div>

          {/* Frame `930:5195` — the whole coaching arc, below the next-session
              and coach pair (direct instruction: "add a card below the your next
              session, meet your coach section ... where the users can see their
              scheduled plan").

              No `<h2>` above it: unlike the four sections before it, the frame
              gives this card its own intro paragraph and icon instead of a
              section heading, and adding one would say the same thing twice. */}
          <SessionPlanStrip dyad={dyad} />

          {/*
            The page's closing help affordance, after the last card (direct
            instruction). Two treatments, one destination:

              • **1024+** — a single red underlined ghost link, as asked for.
              • **below 1024** — the copy as its own line with a secondary
                outline pill beneath it, which is the same width rule as every
                other CTA on this page.

            The copy is an invitation rather than an instruction (chosen from
            four options): "Having trouble with something? We can help". It
            reads as an offer, so someone who does not need help can pass over
            it.

            ⚠️ **Only the trailing phrase is the link, not the sentence**
            (direct instruction). The phrase is "Click here to get help" —
            asked for over "We can help" — and the trailing "to get help" is
            what keeps it usable: a screen-reader user can list a page's links
            with no surrounding copy, so a bare "Click here" would say nothing,
            while this one names its destination.

            ⚠️ On the small layout the copy is the **question only** and the
            button reads "Get help". Repeating "Click here to get help" as copy
            there would point at nothing — the thing to press is the button
            beneath it, and a sentence telling someone to click while a labelled
            button sits below is two instructions for one action.

            ⚠️ **Red on both treatments, on instruction** — "for tablets, and
            mobile, both button needs to use red error state UI, no background".
            So the button is a `destructive` outline on a **transparent** fill
            rather than the `consumer-primary` outline pill this portal uses
            elsewhere, which keeps it matching the desktop link rather than the
            page's other CTAs.

            Worth recording that this project otherwise reserves red for the
            irreversible — Log out, Opt out of the study, Leave without saving.
            The one thing that keeps those apart from this is fill: My Profile's
            "Opt out of the study" is a **filled** red pill, and this is an
            outline on nothing, so they do not read as the same control.

            The breakpoint is 1024 — the same line this page's own task-card
            grid switches on, rather than the header's 1200.
          */}
          <div className="flex flex-col items-center gap-4 min-[1024px]:gap-0">
            {/* Desktop: the question is plain copy and only "We can help" is
                the link — direct instruction, "I do not want the whole
                sentence ot be CTA". It also leaves the link text meaningful on
                its own, which a leading "Having trouble with something?" would
                not be. */}
            <p className="text-consumer-eyebrow hidden text-ink min-[1024px]:block">
              Having trouble with something?{' '}
              <Link
                to={`/consumer/${dyad.id}/help`}
                className="text-destructive underline underline-offset-4 outline-none transition-colors hover:no-underline focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
              >
                Click here to get help
              </Link>
            </p>

            {/* Tablet and mobile: the question as copy, the action as a
                button — a long underlined sentence is a poor touch target, and
                this audience is the one with the explicit big-targets note. */}
            <p className="text-consumer-eyebrow text-center text-ink min-[1024px]:hidden">
              Having trouble with something?
            </p>
            <Link
              to={`/consumer/${dyad.id}/help`}
              className="text-body-md flex h-12 w-full items-center justify-center rounded-[28px] border border-destructive bg-transparent px-5 text-destructive outline-none transition-colors hover:bg-destructive/8 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 min-[1024px]:hidden"
            >
              Get help
            </Link>
          </div>
        </ConsumerContentReveal>

        {/*
          Skip asks before it acts — direct instruction. The same
          `ConfirmDialog` the sleep diary and the account page already use, so
          this portal has one confirmation shape rather than a third.

          Copy follows the diary's own pattern: name the action in the title,
          state the consequence plainly, and label both buttons with what they
          do rather than Yes/No.

          `destructive` — direct instruction to use the error token here. It is
          the same treatment the diary's "Leave without saving" carries, and it
          does the same job: the red is what separates the consequential choice
          from the quiet outline "Go back" beside it at a glance. Worth noting
          the reasoning it overrides, since nothing is actually lost by skipping:
          the second sentence carries that, saying the prompt returns after the
          next session.
        */}
        <SessionFeedbackModal
          open={feedbackOpen}
          sessionOrdinal={finishedSessionOrdinal}
          onClose={() => setFeedbackOpen(false)}
        />

        <ConfirmDialog
          open={skipConfirmOpen}
          title="Skip this feedback?"
          body="We will not ask about this session again. We will still ask after your next session."
          confirmLabel="Skip this feedback"
          cancelLabel="Go back"
          destructive
          onConfirm={() => {
            setSkipConfirmOpen(false)
            setShowSessionFeedback(false)
          }}
          onClose={() => setSkipConfirmOpen(false)}
        />
      </div>
    </ConsumerShell>
  )
}
