import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { CARD_HAIRLINE, CARD_PAD, CardIcon } from '@/components/consumer/ConsumerCard'
import {
  SPACES_CATCHUP_COUNT,
  displaySessionNumber,
  nextPlannedSession,
  type ConsumerDyad,
  type SessionCompletionRecord,
  type SessionPlan,
  type SessionPlanRow,
} from '@/data/spaces'
import { formatTime } from '@/data/format'
import { useResearch } from '@/data/research-context'
import { cn } from '@/lib/utils'

/**
 * The consumer's whole coaching arc, as one horizontal strip of session cells.
 * Frame `930:5195` ("Upcoming Session Details"), Round 48.
 *
 * ── WHAT THIS READS ───────────────────────────────────────────────────────
 *
 * The live `sessionPlans` + `sessionCompletion` pair, never `dyad.upcomingSession`.
 * That seed field is frozen and already disagrees with the completion record on
 * this portal's own demo dyad, which is exactly the "two surfaces, two fields,
 * one fact" failure this project keeps unpicking — see `ConsumerHomePage`'s
 * `NextSessionCard`, which was moved onto the same derivation in this round so
 * the two cards on one page cannot contradict each other.
 *
 * Only the **6 numbered catch-ups** are listed. Internal session 1 is
 * "Planning", which has no number and is not something the consumer tracks
 * against a six-session arc; `displaySessionNumber` maps internal 2-7 onto the
 * 01-06 the frame draws.
 *
 * ── THE FRAME'S TYPE LOSES TO THE PORTAL'S SCALE ──────────────────────────
 *
 * Direct instruction: "make sure to apply the consumer font tokens." The frame
 * draws this strip at 11px / 13px / 15px and in Bold (700) and Black (900), and
 * this portal's scale has a hard floor of **16px and a ceiling of 600** — the
 * audience note (people living with dementia and their carers) is the reason
 * that floor exists. So every label here is a `--text-consumer-*` step:
 *
 *     frame 11/700 uppercase  ->  text-consumer-body-strong  16/600 sentence case
 *     frame 15/700            ->  text-consumer-body-strong  16/600
 *     frame 13/600            ->  text-consumer-eyebrow      16 -> 18/400
 *     frame 28/900            ->  text-consumer-card-title   22 -> 28/500
 *     frame 36/900 (next)     ->  text-consumer-display      28 -> 40/500
 *
 * Two knock-ons worth stating rather than discovering later:
 *
 *   1. **Sentence case, not the frame's uppercase.** At 16px "NEXT SESSION"
 *      does not fit a cell's inner width at this strip's own column count, and
 *      sentence case is this project's copy rule anyway. It is a legibility win
 *      for this audience, not only a fitting one.
 *   2. **The numerals are 500, not the frame's 900.** 600 is the portal's
 *      ceiling and the documented scale pairs 28 and 40 with 500, so a 900
 *      numeral would be off the scale in both size steps. The next session is
 *      still unmistakable — it is the taller, purple-filled, shadowed cell with
 *      a yellow numeral, which is four other signals.
 *
 * ── COLOUR ────────────────────────────────────────────────────────────────
 *
 * The frame's completed badge is `#28c840` on `#e2f9e9`, which measures far
 * under AA. This portal already owns a measured "complete" pairing — the
 * lesson-complete green with `consumer-primary` text at 9.83:1 — so that is
 * reused rather than a second green being introduced at a failing contrast.
 * The rescheduled hint likewise drops the frame's `#ff5f57` (about 3:1 on
 * white): the strikethrough is what carries "this moved", not the hue.
 */

type CellStatus = 'completed' | 'next' | 'rescheduled' | 'scheduled'

function statusOf(
  row: SessionPlanRow,
  completedSessions: Set<number>,
  nextSession: number | undefined,
): CellStatus {
  if (completedSessions.has(row.session)) return 'completed'
  if (row.session === nextSession) return 'next'
  if (row.rescheduled) return 'rescheduled'
  return 'scheduled'
}

/** "Wed 1 Oct" — the frame's own short form, and the same abbreviated-weekday
 *  convention `NextSessionCard` already uses on this page.
 *
 *  Two calls rather than one options object on purpose: asking for weekday and
 *  date together makes `Intl` insert its own separator ("Wed, 1 Oct"), and the
 *  frame draws no comma. en-AU's own short months stay as it writes them —
 *  "July", "Sept" — which is longer than a three-letter abbreviation and better
 *  for this portal's audience than forcing "Jul". */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const weekday = d.toLocaleDateString('en-AU', { weekday: 'short' })
  return `${weekday} ${dayMonth(iso)}`
}

/** "16 Sept" — the same date without its weekday, for the struck-through
 *  "was ..." hint.
 *
 *  Measured, not a style preference: with the weekday it wants 145px inside a
 *  126px cell and wraps onto a second line, which puts a strikethrough across
 *  two lines. The weekday is the redundant half — the row's live date directly
 *  above it already says which day the session moved *to*, and this line exists
 *  to say what the date used to be. */
function dayMonth(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  })
}

/* `px-3`. This was briefly `px-2` to win back the 8px per cell that let all six
   fit across the desktop row, and it read as cramped ("not enough side padding
   to completed, next, rescheduled, scheduled labels" — direct report). The
   padding is the wrong place to take that space from: the room now comes out of
   the desktop-only column gap instead (see the `<ol>`), which nobody reads as
   tight. */
const BADGE_BASE =
  'text-consumer-body-strong inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1'

const BADGE_TONE: Record<CellStatus, string> = {
  // `consumer-lesson-complete` + `consumer-primary`, measured 9.83:1 — this
  // portal's existing, documented "complete" pairing.
  completed: 'bg-consumer-lesson-complete text-consumer-primary',
  // Frame `930:5229` — yellow/100 behind purple text, sitting on the purple cell.
  next: 'bg-yellow-100 text-consumer-primary',
  // Frame `930:5240` — yellow/300 (#ffcc4d; the frame calls this swatch
  // "yellow/400", a naming mismatch already recorded in Round 31).
  rescheduled: 'bg-yellow-300 text-ink',
  scheduled: 'bg-parchment text-ink-muted',
}

/* The portal's own outline pill, squared off into a circle: 48px, which is
   this portal's CTA height since Round 46 and well clear of the app's 36px
   floor. `disabled:` rather than hiding at the ends, so the pair does not
   reflow as it is used. */
const CHEVRON =
  'flex size-12 shrink-0 items-center justify-center rounded-full border border-consumer-primary bg-white text-consumer-primary outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40'

const BADGE_LABEL: Record<CellStatus, string> = {
  completed: 'Completed',
  next: 'Next session',
  rescheduled: 'Rescheduled',
  scheduled: 'Scheduled',
}

function SessionCell({ row, status }: { row: SessionPlanRow; status: CellStatus }) {
  const isNext = status === 'next'
  const number = String(displaySessionNumber(row.session)).padStart(2, '0')
  const Icon = status === 'completed' ? Check : Clock

  return (
    <li
      // Queried by the mobile auto-scroll below rather than handed a ref: a ref
      // would need a wrapper element, and anything but an `<li>` inside this
      // `<ol>` is invalid markup (`display: contents` does not make it valid).
      data-next-cell={isNext || undefined}
      className={cn(
        // `min-w` rather than a fixed width: the frame's 160px cell assumes the
        // frame's own 11px labels, and at this portal's 16px floor a fixed box
        // would clip. `flex-1` shares the row evenly when there is space and
        // the min-width is what makes the strip scroll when there is not.
        /*
          ── Width is viewport-proportional below desktop, not a fixed box ───
          Direct instruction: "in mobile I want to see roughly 10% of the
          previous and next card between the current card", and for tablet
          "increase the width".

          `(100% - 32px) / 1.2` is that 10% solved rather than eyeballed. With
          the centred card at width W and a 16px gap either side, the row shows
          `W + 2*gap + 2*peek`; setting `peek = 0.1W` and solving for the
          scroller's own width gives `W = (client - 2*gap) / 1.2`. Measured at
          375: cells land at 224.2px and the neighbour shows 22.4px — 10.0%.

          The percentage resolves against the `<ol>`, whose width is the
          scroller's content box (a block-level flex container in an overflow
          container takes the container's width and lets its children spill),
          so this tracks the real available width at every size.

          Tablet is a flat 324px — the frame-derived 216 scaled by 1.5 (direct
          instruction: "in tablet, the card proportions can be increased by
          0.5x"). The heights scale with it, 228 -> 342 and the next card
          248 -> 372, so the cards grow in proportion rather than stretching
          into a different shape. Desktop drops back to the frame's own sizes,
          where six across is the constraint instead.

          Desktop hands the row back to `flex-1`, where all six fit and share
          the width evenly. The switch is at 1281 and not this portal's usual
          1200 because that is where they genuinely fit: six cells at their
          content minimum plus five 16px gaps need 1018px, and the card's inner
          width only reaches that at ~1281.
        */
        'flex w-[calc((100%-32px)/1.2)] shrink-0 flex-col items-center justify-center gap-4 rounded-xl p-4 text-center min-[640px]:w-[324px] min-[1281px]:w-auto min-[1281px]:min-w-[152px] min-[1281px]:flex-1',
        isNext
          ? // Frame `930:5228`: taller, filled, and lifted off the row.
            'min-h-[248px] min-[640px]:min-h-[372px] min-[1281px]:min-h-[248px] border-[2.5px] border-consumer-primary bg-consumer-primary shadow-[2px_5px_10px_rgba(85,85,85,0.25)] min-[1281px]:min-w-[178px]'
          : 'min-h-[228px] bg-white min-[640px]:min-h-[342px] min-[1281px]:min-h-[228px]',
        status === 'rescheduled' && 'border-[1.5px] border-yellow-400',
        status !== 'rescheduled' && !isNext && 'border border-ink-faint',
      )}
    >
      <span className={cn(BADGE_BASE, BADGE_TONE[status])}>
        {(status === 'completed' || isNext) && (
          <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.5} />
        )}
        {BADGE_LABEL[status]}
      </span>

      {/* A real `<dl>`, per this project's standing rule for every label/number
          pair — the frame draws "SESSION" over "01" as two loose text nodes. */}
      <dl className="flex flex-col items-center gap-1">
        <dt
          className={cn(
            'text-consumer-body-strong',
            isNext ? 'text-yellow-300' : 'text-ink-faint',
          )}
        >
          Session
        </dt>
        <dd
          className={cn(
            isNext
              ? 'text-consumer-display text-yellow-300'
              : 'text-consumer-card-title text-ink',
          )}
        >
          {number}
        </dd>
      </dl>

      <div className="flex flex-col items-center gap-1">
        <p className={cn('text-consumer-body-strong', isNext ? 'text-white' : 'text-ink')}>
          {row.date ? shortDate(row.date) : 'Date to be confirmed'}
        </p>

        {isNext && row.time && (
          <p className="text-consumer-eyebrow text-white">
            {/* `endTime` is optional on a plan row; the frame draws a range, so
                a row without one shows its start alone rather than inventing an
                end. `NextSessionCard` on this same page derives "+1 hour" when
                it has to, and that assumption is deliberately not repeated here. */}
            {formatTime(row.time)}
            {row.endTime ? ` - ${formatTime(row.endTime)}` : ''}
          </p>
        )}

        {status === 'rescheduled' && row.previousDate && (
          /* Direct instruction: "for any session that got rescheduled, and has
             been cut off use red token", then "not grey" when this first
             shipped in `ink-faint`.

             `destructive` (#d70015), not the frame's own `#ff5f57` and not the
             portal's `consumer-accent` coral: both are too light to carry text
             on white (the coral measures ~3.2:1 and fails AA), where
             `destructive` measures 5.38:1. That is the identical call
             `ConsumerHeader` already made for its red Log out link, for the
             same reason — so this portal now has one red-as-text, not two.

             The strikethrough stays and is load-bearing: colour alone as the
             carrier of "this date no longer applies" is what WCAG 1.4.1
             forbids. */
          <p className="text-consumer-eyebrow text-destructive line-through">
            was {dayMonth(row.previousDate)}
          </p>
        )}
      </div>
    </li>
  )
}

export function SessionPlanStrip({ dyad }: { dyad: ConsumerDyad }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)
  /* Chevrons exist only while the row actually overflows, and each disables at
     its own end — a control that cannot do anything is worse than no control.
     Derived from measurement on scroll/resize rather than from the breakpoint,
     so it stays right if the copy or the type ever changes the row's width. */
  const [scrollState, setScrollState] = useState({
    overflowing: false,
    atStart: true,
    atEnd: false,
    active: 0,
  })
  const { rows, completedSessions, nextSession } = useResolvedPlan(dyad)

  /**
   * Direct instruction: "In mobile view, by default the upcoming session card
   * should be shown." The next cell is the fourth of six here, so on a phone it
   * starts off-screen and the strip would open on session 01 — the least useful
   * end of a plan whose whole point is what is coming up.
   *
   * ⚠️ Deliberately **not** `scrollIntoView`. That call scrolls every scrollable
   * ancestor, and this project has shipped it twice as a real bug: Round 18's
   * carousel jumped the whole page on load, and Round 19's did it again through
   * a prop that silently stopped applying. Setting `scrollLeft` on the one
   * container we own cannot touch the document.
   *
   * Runs once per next-cell element rather than on mount, so it is correct if
   * the plan resolves after first paint, and it is skipped entirely when the
   * cell already fits in view (the desktop case), where scrolling would be a
   * jump with no purpose.
   */
  /** Centre any cell in the scroller. Rect-relative, never `offsetLeft`:
   *  `offsetLeft` is measured from the nearest *positioned* ancestor, which is
   *  not this scroller, so it silently carries some other element's offset —
   *  measured 27.5px out at 375px. A delta between two live rects cannot be
   *  wrong about its frame. */
  const centreOn = useCallback((cell: HTMLElement) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    // Already fits — scrolling would be a jump with no purpose (desktop).
    if (scroller.scrollWidth <= scroller.clientWidth) return
    const delta = cell.getBoundingClientRect().left - scroller.getBoundingClientRect().left
    const centring = (scroller.clientWidth - cell.offsetWidth) / 2
    scroller.scrollLeft = Math.max(0, scroller.scrollLeft + delta - centring)
  }, [])

  const centreOnNext = useCallback(() => {
    const cell = scrollerRef.current?.querySelector<HTMLLIElement>('[data-next-cell]')
    if (cell) centreOn(cell)
  }, [centreOn])

  /** Overflow, end-stops, and which cell is currently centred — all measured,
   *  never inferred from the breakpoint, so they stay right if the copy or the
   *  type ever changes the row's width. */
  const syncScrollState = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const max = scroller.scrollWidth - scroller.clientWidth
    const viewCentre = scroller.getBoundingClientRect().left + scroller.clientWidth / 2
    const cells = [...scroller.querySelectorAll('li')]
    let active = 0
    let best = Infinity
    cells.forEach((cell, i) => {
      const r = cell.getBoundingClientRect()
      const d = Math.abs(r.left + r.width / 2 - viewCentre)
      if (d < best) {
        best = d
        active = i
      }
    })
    setScrollState({
      overflowing: max > 1,
      atStart: scroller.scrollLeft <= 1,
      atEnd: scroller.scrollLeft >= max - 1,
      active,
    })
  }, [])

  /** One cell plus its gap, so a chevron advances exactly one session. */
  const step = useCallback((direction: 1 | -1) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    // Pressing a chevron is the user taking over — after this, a width change
    // must not yank the row back to the next session under their hands.
    userScrolledRef.current = true
    const cell = scroller.querySelector('li')
    const distance = cell ? cell.getBoundingClientRect().width + 16 : scroller.clientWidth * 0.8
    scroller.scrollBy({ left: direction * distance, behavior: 'smooth' })
  }, [])

  const goTo = useCallback(
    (index: number) => {
      const cell = scrollerRef.current?.querySelectorAll('li')[index]
      if (!cell) return
      userScrolledRef.current = true
      const scroller = scrollerRef.current
      if (!scroller) return
      const delta = cell.getBoundingClientRect().left - scroller.getBoundingClientRect().left
      const centring = (scroller.clientWidth - (cell as HTMLElement).offsetWidth) / 2
      scroller.scrollTo({
        left: Math.max(0, scroller.scrollLeft + delta - centring),
        behavior: 'smooth',
      })
    },
    [],
  )

  /*
    ⚠️ **A `useEffect` alone centres against the wrong geometry.** Measured: the
    effect fires while the row still has its previous widths, computes a delta
    for a layout that is about to change, and leaves the card 122px off centre —
    the maths is right, the moment is wrong. A `ResizeObserver` on the row is
    keyed on the layout actually settling, which is the thing being waited for,
    so it covers first paint, webfont swap, and every breakpoint change with one
    mechanism instead of three guesses at a delay.

    Re-centring is skipped once the user has scrolled the row themselves, and
    that is tracked from real input events rather than from `scroll`, so our own
    `scrollLeft` write can never be mistaken for a gesture — the flag-and-rAF
    dance that would otherwise be needed is what made Round 18's carousel drop
    focus mid-Tab.
  */
  useEffect(() => {
    const scroller = scrollerRef.current
    const row = scroller?.querySelector('ol')
    if (!scroller || !row) return

    const markUserScrolled = () => {
      userScrolledRef.current = true
    }
    const INPUT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    for (const type of INPUT_EVENTS) {
      scroller.addEventListener(type, markUserScrolled, { passive: true })
    }
    scroller.addEventListener('scroll', syncScrollState, { passive: true })

    /*
      ⚠️ **One observer callback is not enough, and this is measured.** The
      observer can fire on an *intermediate* layout: coming from 820 to 375 it
      ran while the scroller was 271.5px wide, centred correctly against that,
      and the box then settled at 293 — leaving the card a consistent 10.75px
      off with no further callback to correct it. The maths was right both
      times; only the geometry moved underneath it.

      So each callback schedules a verification a beat later: re-measure, and
      only re-centre if the card is actually off by more than a pixel or two.
      That converges whichever layout the observer happened to catch, and it
      cannot fight the user, because a real interaction sets the flag and both
      passes bail out.
    */
    let settleTimer: ReturnType<typeof setTimeout> | undefined

    const verifyCentred = () => {
      if (userScrolledRef.current) return
      const cell = scroller.querySelector<HTMLLIElement>('[data-next-cell]')
      if (!cell) return
      if (scroller.scrollWidth <= scroller.clientWidth) return
      const offset = cell.getBoundingClientRect().left - scroller.getBoundingClientRect().left
      const wanted = (scroller.clientWidth - cell.offsetWidth) / 2
      if (Math.abs(offset - wanted) > 2) centreOn(cell)
    }

    const observer = new ResizeObserver(() => {
      if (!userScrolledRef.current) centreOnNext()
      syncScrollState()
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        verifyCentred()
        syncScrollState()
      }, 250)
    })
    observer.observe(scroller)
    observer.observe(row)
    // The cells' own width is what changes at a breakpoint while the scroller's
    // box may not, so the row alone can miss it.
    const firstCell = row.querySelector('li')
    if (firstCell) observer.observe(firstCell)

    return () => {
      for (const type of INPUT_EVENTS) scroller.removeEventListener(type, markUserScrolled)
      scroller.removeEventListener('scroll', syncScrollState)
      observer.disconnect()
      clearTimeout(settleTimer)
    }
  }, [centreOn, centreOnNext, syncScrollState])

  /*
    Hidden entirely until at least one session has a date.

    ⚠️ `!rows.length` is NOT the right test and was the first thing tried. The
    store seeds every dyad with `emptySessionPlan()`, so a consumer whose coach
    has not planned anything yet still has 7 rows — they are simply undated.
    Testing length rendered six "Scheduled / Date to be confirmed" cells under a
    heading claiming "Following is your coaching session plan", which is a plan
    the consumer does not have. `dyad-012` is a real case of this in the seed
    data, not a hypothetical.

    Nothing is shown in its place: `NextSessionCard` directly above already says
    "Nothing booked yet. Your coach will schedule your next call with you.", and
    two statements of the same absence is the duplication this page keeps
    removing.
  */
  if (!rows.some((row) => row.date)) return null


  return (
    /* The heading lives here rather than on the page beside its three sibling
       `<h2>`s, because this whole block hides when there is no dated plan and a
       heading owned by the page would be left stranded over nothing. */
    <section className="flex flex-col gap-6">
      {/* Direct instruction, after the card was first built headingless to match
          the frame, which draws none: "Your coaching session plan". */}
      <h2 className="text-consumer-heading text-ink">Your coaching session plan</h2>

      <div className={cn(CARD_HAIRLINE, CARD_PAD, 'flex flex-col gap-8 bg-white')}>
      {/* The frame is desktop-only and sets the icon beside the copy. On a phone
          that leaves the paragraph ~233px wide next to a 52px glyph, so it
          stacks below `sm` — which is also what this page's other two icon
          cards (`NextSessionCard`, the diary card) already do at every width. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
        <CardIcon icon={CalendarDays} />
        <div className="flex min-w-0 flex-col justify-center gap-2">
          {/*
            ⚠️ The frame's own paragraph (`930:5266`) ends with the exact sentence
            its bold line (`930:5270`) then repeats verbatim — "If you can't make
            it to a session or need to reschedule, please inform your coach."
            Reproduced as drawn, a consumer reads the same instruction twice in
            two lines. The duplicate is dropped from the paragraph and left where
            the frame gives it emphasis, which is evidently the intent.
          */}
          <p className="text-consumer-eyebrow text-balance text-ink">
            Following is your coaching session plan with your coach. You can see which ones you
            have already done and which ones are coming up.
          </p>
          <p className="text-consumer-body-strong text-balance text-ink">
            If you cannot make it to a session or need to reschedule, please inform your coach.
          </p>
        </div>
      </div>

      {/*
        A scroll container with no focusable content inside is unreachable by
        keyboard — a real WCAG 2.1.1 failure this project already fixed once on
        the sleep-diary grid (Round 20). None of these cells is a control, so the
        region itself is the tab stop and carries the name.

        ⚠️ No `sr-only` anywhere inside this row. Tailwind's `sr-only` is
        `position: absolute` + `white-space: nowrap`, which escapes a horizontal
        scroller's clip and widens the whole document — Round 30 shipped a real
        2399px page scroll from exactly that. The heading below is a normal
        element hidden with `hidden`, not `sr-only`.
      */}
      <div
        ref={scrollerRef}
        role="region"
        aria-label={`Your ${SPACES_CATCHUP_COUNT} coaching sessions`}
        tabIndex={0}
        /* `py-4`, and the 16px is load-bearing rather than rhythm. `overflow-x:
           auto` also clips the *vertical* axis per spec, and the next-session
           cell's shadow is `2px 5px 10px`, so it reaches 15px below the card —
           at `py-2` the bottom 7px of it was cut off, reported as "the session
           plan card shadow is getting clipped". Same class of bug as Round 18's
           carousel, where 4px was tried before the shadow was measured. */
        className="min-w-0 overflow-x-auto py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-consumer-primary"
      >
        {/* 16px gap below desktop — the mobile peek maths above solves against
            exactly that number. Desktop tightens to 12px, which is where the
            24px the badges needed back came from: six cells with `px-3` pills
            want 1070px against the row's 1063px, and five 4px-narrower gaps
            close it with room to spare. */}
        <ol className="flex min-w-0 items-center gap-4 min-[1281px]:gap-3">
          {rows.map((row) => (
            <SessionCell
              key={row.session}
              row={row}
              status={statusOf(row, completedSessions, nextSession)}
            />
          ))}
        </ol>
      </div>

      {/* Chevrons, below the row rather than overlaid on it: the peeking
          neighbours either side ARE the affordance the instruction asked for
          ("roughly 10% of the previous and next card"), and an overlay button
          would sit on top of exactly that.

          Hidden entirely once the row fits, which is the desktop case. */}
      {scrollState.overflowing && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={scrollState.atStart}
            aria-label="Show earlier sessions"
            className={CHEVRON}
          >
            <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2.25} />
          </button>

          {/*
            Pagination (direct instruction: "for mobile and tablet view add
            pagination also. the centre one is always longer width wise. rest
            circles, also factor in animation for this").

            Real buttons, not decoration — each jumps to its own session, which
            also gives the row a keyboard path to any card without scrolling
            through the ones between. The visible dot is 10px but the control is
            24 x 36: this project has shipped 6px pagination dots once already
            and they failed WCAG 2.2's 2.5.8 target-size minimum. 36 tall is
            this app's own control floor, which `layout-audit.js` caught at a
            first-pass 24 — a real finding, not a false positive. The width
            stays at 24 (2.5.8's own minimum) because six 36px-wide controls
            plus two 48px chevrons do not fit a 375px card: measured 344px
            against 293px of room.

            The active pill is `w-7` against the circles' `w-2.5`, animated with a
            plain width/colour transition rather than framer-motion — one property
            on six small elements, and `motion-reduce` then removes it honestly.
            (The thing to avoid here is an arbitrary *property* under stacked
            variants: Round 46 found `motion-safe:hover:[--x:1]` emitting no CSS
            at all. A plain `transition-*` utility is not that.)
          */}
          <ol className="flex items-center gap-1">
            {rows.map((row, i) => {
              const isActive = i === scrollState.active
              return (
                <li key={row.session} className="flex">
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show session ${String(displaySessionNumber(row.session)).padStart(2, '0')}`}
                    aria-current={isActive ? 'true' : undefined}
                    className="flex h-9 w-6 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-2.5 rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none',
                        isActive ? 'w-7 bg-consumer-primary' : 'w-2.5 bg-hairline',
                      )}
                    />
                  </button>
                </li>
              )
            })}
          </ol>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={scrollState.atEnd}
            aria-label="Show later sessions"
            className={CHEVRON}
          >
            <ChevronRight aria-hidden="true" className="size-6" strokeWidth={2.25} />
          </button>
        </div>
      )}
      </div>
    </section>
  )
}

/** Pulls the dyad's plan + completion out of the store and reduces them to the
 *  6 numbered catch-ups this strip renders. */
function useResolvedPlan(dyad: ConsumerDyad): {
  rows: SessionPlanRow[]
  completedSessions: Set<number>
  nextSession: number | undefined
} {
  const { sessionPlans, sessionCompletion } = useResearch()
  const plan: SessionPlan | undefined = sessionPlans[dyad.id]
  const completed: SessionCompletionRecord[] = sessionCompletion[dyad.id] ?? []

  const rows = (plan?.sessions ?? []).filter((row) => row.session !== 1)
  const completedSessions = new Set(completed.map((c) => c.session))
  const nextSession = nextPlannedSession(plan, completed)?.session

  return { rows, completedSessions, nextSession }
}
