import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Goal } from 'lucide-react'
import { CARD_HAIRLINE, CARD_PAD, CardIcon } from '@/components/consumer/ConsumerCard'
import { CarouselNav } from '@/components/consumer/CarouselNav'
import { DashedOutline } from '@/components/consumer/DashedOutline'
import { ThanksMascot } from '@/components/shared/ThanksMascot'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  CLIENT_PLANNING_GOALS_TITLE,
  CLIENT_SESSION_GOALS_TITLE,
  clientGoalNotes,
} from '@/data/clientGoals'
import { useResearch } from '@/data/research-context'
import {
  PLANNING_SESSION,
  SPACES_CATCHUP_COUNT,
  displaySessionNumber,
  type ConsumerDyad,
} from '@/data/spaces'
import { cn } from '@/lib/utils'

/**
 * "Your Care2Sleep goals" — Consumer Home, between the coach card and the
 * session plan (Figma `4942:25528`, 2026-11-12). No tablet or phone frames:
 * everything below 1024 is derived.
 *
 * One button per session (Planning, then 1-6), then that session's goals as
 * sticky notes in a horizontal row with the session plan's own chevrons and
 * dots (`CarouselNav`). Goals are ⚠️ DUMMY defaults, never the coach's saved
 * goals — see `data/clientGoals.ts`.
 *
 * Not rendered at all until a session is planned — `ConsumerHomePage` gates
 * it, heading included, on `hasPlannedSession`, the strip's own test.
 *
 * Session state follows the client's own `sessionCompletion`:
 *   past    — held, not the latest       `purple-50` pill
 *   now     — the latest held session    solid `consumer-primary`, "This week: …"
 *   future  — not held yet               dashed `purple-300` pill, pillow + two lines
 * A selected pill that is not "now" gets a solid 2px `consumer-primary` ring,
 * so "the one I'm looking at" and "this week" can never be confused.
 */

type SessionStatus = 'past' | 'now' | 'future'

/* Pills are tabs, but they are built on the button system so they inherit its
   48px consumer height, 28px radius, type, focus ring and press. Only the
   paint differs per state — `cn` (tailwind-merge) lets each override win. */
const PILL_BASE = cn(
  buttonVariants({ variant: 'secondary', surface: 'consumer' }),
  'shrink-0 transition-colors',
)
const PILL_PAINT: Record<SessionStatus, string> = {
  past: 'border-transparent bg-purple-50 text-purple-900 hover:bg-purple-200',
  now: 'border-transparent bg-consumer-primary text-white hover:bg-consumer-primary-hover',
  // The dashed edge is a `DashedOutline` ([6, 4], Figma's own), not a border.
  // `border-transparent`: the system's own 1px `consumer-primary` stroke was
  // showing under the dashes (reported 2026-11-12).
  future: 'relative border-transparent bg-white text-ink-muted hover:bg-purple-50',
}
const PILL_SELECTED = 'border-2 border-solid border-consumer-primary'

export function ClientGoalsCard({ dyad }: { dyad: ConsumerDyad }) {
  const { sessionCompletion } = useResearch()
  const held = new Set((sessionCompletion[dyad.id] ?? []).map((c) => c.session))
  const latest = held.size ? Math.max(...held) : undefined

  // Internal session numbers: Planning is 1, the catch-ups 2-7.
  const sessions = Array.from({ length: SPACES_CATCHUP_COUNT + 1 }, (_, i) => PLANNING_SESSION + i)
  const statusOf = (n: number): SessionStatus =>
    !held.has(n) ? 'future' : n === latest ? 'now' : 'past'
  const nameOf = (n: number) =>
    n === PLANNING_SESSION ? 'Planning session' : `Session ${displaySessionNumber(n)}`
  const labelOf = (n: number) => (statusOf(n) === 'now' ? `This week: ${nameOf(n)}` : nameOf(n))

  const [selected, setSelected] = useState(latest ?? PLANNING_SESSION)
  const pillsRef = useRef<HTMLDivElement>(null)

  /* Phones: the pills are one horizontal scroller (direct instruction: "on
     mobile, the buttons … will also be horizontal scroller"), and the "This
     week" pill is always centred in it (direct instruction: "in mobile view,
     always make sure this week button is in centre").

     "Always" means on load AND whenever the row changes size — a phone rotating,
     a window resized, fonts settling — until the client moves the row
     themselves. Their own scroll or tap is tracked from real input events, not
     from `scroll`, so our own `scrollLeft` write can never count as theirs
     (the same split `SessionPlanStrip` uses).

     `scrollLeft` on the one scroller, never `scrollIntoView`, which also
     scrolls the page (SessionPlanStrip, Round 18). Where the row fits (tablet
     and up, where it wraps) there is nothing to centre. */
  useEffect(() => {
    const row = pillsRef.current
    if (!row) return
    let userMoved = false
    const centreThisWeek = () => {
      if (userMoved || row.scrollWidth <= row.clientWidth) return
      const pill = row.querySelector<HTMLElement>('[data-this-week]')
      if (!pill) return
      const delta = pill.getBoundingClientRect().left - row.getBoundingClientRect().left
      row.scrollLeft = Math.max(0, row.scrollLeft + delta - (row.clientWidth - pill.offsetWidth) / 2)
    }
    const markMoved = () => {
      userMoved = true
    }
    const INPUT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    for (const type of INPUT_EVENTS) row.addEventListener(type, markMoved, { passive: true })
    const observer = new ResizeObserver(centreThisWeek)
    observer.observe(row)
    centreThisWeek()
    return () => {
      for (const type of INPUT_EVENTS) row.removeEventListener(type, markMoved)
      observer.disconnect()
    }
  }, [])

  const select = (n: number, focus: boolean) => {
    setSelected(n)
    if (focus) pillsRef.current?.querySelector<HTMLElement>(`[data-session="${n}"]`)?.focus()
  }

  // Tabs: roving tabindex, arrows + Home/End.
  const onPillKey = (e: KeyboardEvent) => {
    const i = sessions.indexOf(selected)
    const to =
      e.key === 'ArrowRight' ? Math.min(sessions.length - 1, i + 1)
      : e.key === 'ArrowLeft' ? Math.max(0, i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? sessions.length - 1
      : -1
    if (to < 0) return
    e.preventDefault()
    select(sessions[to], true)
  }

  const isPlanning = selected === PLANNING_SESSION
  const status = statusOf(selected)
  const panelId = `client-goals-panel-${dyad.id}`

  return (
    <div className={cn(CARD_HAIRLINE, CARD_PAD, 'flex flex-col gap-6 bg-white')}>
      <div className="flex items-center gap-4">
        <CardIcon icon={Goal} />
        <p className="text-consumer-lesson text-ink">Your goals for:</p>
      </div>

      {/* Wraps from `md`; one scrolling row below it. `py-1` keeps the focus
          ring (2px + 2px offset) inside the scroller's clip. */}
      <div
        ref={pillsRef}
        role="tablist"
        aria-label="Sessions"
        onKeyDown={onPillKey}
        className="-mx-4 -my-1 flex gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {sessions.map((n) => {
          const s = statusOf(n)
          const isSelected = n === selected
          return (
            <button
              key={n}
              type="button"
              role="tab"
              id={`client-goals-tab-${dyad.id}-${n}`}
              data-session={n}
              data-this-week={s === 'now' || undefined}
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(n, false)}
              className={cn(PILL_BASE, PILL_PAINT[s], isSelected && s !== 'now' && PILL_SELECTED)}
            >
              {labelOf(n)}
              {s === 'future' && !isSelected && (
                <DashedOutline radius={24} dash={[6, 4]} className="text-purple-300" />
              )}
            </button>
          )
        })}
      </div>

      {/* The frame's dashed content panel, from `md`. On a phone its outline
          and 32px padding would leave the 7 planning dots no room (measured:
          312px of controls against 275px). */}
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`client-goals-tab-${dyad.id}-${selected}`}
        className="relative flex min-w-0 flex-col gap-8 md:p-8"
      >
        {/* Figma: 2px inside, `[8, 6]`, r12, `neutral/lighter-grey`. */}
        <DashedOutline radius={12} dash={[8, 6]} className="hidden text-hairline md:block" />
        {/* ── One height for every session ─────────────────────────────
            Direct instruction: "can the container height not change for every
            session, by default keep it same, use planning session height for
            reference, this is to reduce pixel shift."

            All three bodies share ONE grid cell. The Planning and Session
            bodies are always rendered there as `invisible` sizers (inert,
            hidden from assistive tech), so the cell is always as tall as the
            tallest of them — Planning, today — and the visible body is
            stretched to it. Inside, the notes grow to fill (`flex-1`), which
            keeps the chevrons on the same line for every session.

            ⚠️ A sizer must carry the SAME markup as what it stands in for —
            it is the same component here, never a hand-copied approximation
            (CLAUDE.md: Round 34's sizer drifted by one class). A note opened
            with Show all can still grow the panel; that is the one shift that
            is the client's own doing. */}
        <div className="grid min-w-0">
          <div aria-hidden="true" inert className="invisible flex min-w-0 flex-col gap-8 [grid-area:1/1]">
            <GoalsBody isPlanning title={CLIENT_PLANNING_GOALS_TITLE} label="Planning session" />
          </div>
          <div aria-hidden="true" inert className="invisible flex min-w-0 flex-col gap-8 [grid-area:1/1]">
            <GoalsBody isPlanning={false} title={CLIENT_SESSION_GOALS_TITLE} label="Session" />
          </div>

          {status === 'future' ? (
            /* A session not held yet: no title and no card, just the pillow and
               two lines (direct instruction, 2026-11-12). `ThanksMascot` is the
               portal's one character, reused rather than a second copy. */
            <div className="flex min-w-0 flex-col items-center justify-center gap-4 py-6 text-center [grid-area:1/1]">
              <ThanksMascot />
              <div className="flex flex-col gap-2">
                <p className="text-consumer-lesson text-balance text-ink">No goals set yet</p>
                <p className="max-w-[44ch] text-consumer-body text-balance text-ink-muted">
                  You will set these goals with your coach at {nameOf(selected)}. They will appear
                  here after the session.
                </p>
              </div>
            </div>
          ) : (
            // Keyed on the session: a new set of notes starts at the first one.
            <div key={selected} className="flex min-w-0 flex-col gap-8 [grid-area:1/1]">
              <GoalsBody
                isPlanning={isPlanning}
                title={isPlanning ? CLIENT_PLANNING_GOALS_TITLE : CLIENT_SESSION_GOALS_TITLE}
                label={labelOf(selected)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Notes ─────────────────────────────────────────────────────────────── */

/** The title + notes. Rendered for the visible session AND as the height
 *  sizers, so the two can never disagree. */
function GoalsBody({ isPlanning, title, label }: { isPlanning: boolean; title: string; label: string }) {
  return (
    <>
      <h3 className="text-consumer-card-title text-ink">{title}</h3>
      <NotesCarousel isPlanning={isPlanning} title={label} />
    </>
  )
}

function NotesCarousel({ isPlanning, title }: { isPlanning: boolean; title: string }) {
  const notes = clientGoalNotes(isPlanning)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState({ overflowing: false, atStart: true, atEnd: false, active: 0, leftmost: 0 })

  const sync = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const max = scroller.scrollWidth - scroller.clientWidth
    const left = scroller.getBoundingClientRect().left
    const items = [...scroller.querySelectorAll('li')]
    let active = 0
    let best = Infinity
    items.forEach((li, i) => {
      const d = Math.abs(li.getBoundingClientRect().left - left)
      if (d < best) {
        best = d
        active = i
      }
    })
    // The note at the left edge is what stepping counts from. The DOT is
    // different at the very end: the last note never reaches the left edge,
    // so its dot would never light — the end of the row IS the last note.
    const leftmost = active
    if (scroller.scrollLeft >= max - 1) active = items.length - 1
    setScroll({ overflowing: max > 1, atStart: scroller.scrollLeft <= 1, atEnd: scroller.scrollLeft >= max - 1, active, leftmost })
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.addEventListener('scroll', sync, { passive: true })
    const observer = new ResizeObserver(sync)
    observer.observe(scroller)
    sync()
    return () => {
      scroller.removeEventListener('scroll', sync)
      observer.disconnect()
    }
  }, [sync])

  const goTo = useCallback((index: number) => {
    const scroller = scrollerRef.current
    const note = scroller?.querySelectorAll('li')[index]
    if (!scroller || !note) return
    // Rect-relative, so it lands on the note even if called mid-animation.
    const delta = note.getBoundingClientRect().left - scroller.getBoundingClientRect().left
    scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: 'smooth' })
  }, [])

  /* Each press aims at the note after the LAST TARGET, not at "one note-width
     from here". A relative `scrollBy` issued mid-animation was swallowed by
     snapping: measured, two quick presses moved one note. The target is
     forgotten once the row has settled. */
  const targetRef = useRef<number | null>(null)
  const settleTimer = useRef<number | undefined>(undefined)
  const step = useCallback(
    (direction: 1 | -1) => {
      const base = targetRef.current ?? scroll.leftmost
      const target = Math.min(notes.length - 1, Math.max(0, base + direction))
      targetRef.current = target
      window.clearTimeout(settleTimer.current)
      settleTimer.current = window.setTimeout(() => (targetRef.current = null), 700)
      goTo(target)
    },
    [scroll.leftmost, notes.length, goTo],
  )
  useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      {/* `py-5 -my-5` / `px-4 -mx-4`: `overflow-x: auto` clips both axes, and
          the notes' warm shadow reaches ~20px. `scroll-px-4` keeps snap aligned
          to the visible edge, not the padding edge. No `sr-only` in here —
          it escapes the clip and widens the page (Round 30). */}
      <div
        ref={scrollerRef}
        role="region"
        aria-label={`${title}: ${notes.length} goals`}
        tabIndex={0}
        className="-mx-4 -my-5 flex min-w-0 flex-1 flex-col snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 py-5 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-consumer-primary [&::-webkit-scrollbar]:hidden"
      >
        {/* Widths are the frame's (`4942:25528`, 1:1 — direct instruction
            2026-11-12): 331px from 768 up, 24px gaps, however many fit. A
            phone has no frame, so it is derived: one note + a 40px peek. */}
        {/* Column flex on the scroller, `flex-1` here: the row fills the
            fixed panel height, so the notes stretch to it. */}
        {/* `after:` is the trailing inset. A scroller's own end padding is not
            added after children that overflow a flex row, so the last note sat
            flush with the card edge at the end of the row (reported on mobile,
            2026-11-12; true at every width). The spacer costs one 24px gap;
            1px wide and `-ml-[9px]` lands its far edge 16px past the last
            note, matching the leading `px-4`. ⚠️ It must NOT be 0px wide: a
            zero-width box is left out of the scrollable area (measured: still
            0px of inset with `w-0`). */}
        <ol className="flex min-w-0 flex-1 gap-6 after:-ml-[9px] after:w-px after:shrink-0 after:content-['']">
          {notes.map((note, i) => (
            <StickyNote key={i} index={i} total={notes.length} {...note} />
          ))}
        </ol>
      </div>

      {scroll.overflowing && (
        <CarouselNav
          className="justify-center"
          count={notes.length}
          active={scroll.active}
          atStart={scroll.atStart}
          atEnd={scroll.atEnd}
          onStep={step}
          onGoTo={goTo}
          previousLabel="Show earlier goals"
          nextLabel="Show later goals"
          dotLabel={(i) => `Show goal ${i + 1}`}
          showDots={false}
          nextVariant="primary"
        />
      )}
    </div>
  )
}

/**
 * One goal as a sticky note — the user's own example in `4942:25528`: yellow
 * paper, a `yellow-200` edge, a 32px bottom-right radius and a folded corner
 * in the same `yellow-200`.
 *
 * Long answers stop at 4 lines with Show all, which opens the note in place
 * (the row then grows to it). The button exists only when the text is really
 * cut — measured, not guessed from a character count, because the cut depends
 * on the note's width.
 *
 * Geometry is the frame's, 1:1: 331 x min 311, padding 24 on all sides, 24
 * gaps, "Show all" 40px tall with 20px sides. ⚠️ The padding is written
 * `p-[23px]`: Figma's 1px stroke is INSIDE and takes no space, so its 24 is
 * measured from the outer edge, while a CSS border adds to the padding. 23 +
 * the 1px border = the frame's 24, and the text is 283 wide in both. (A 36px bottom padding, a
 * 358px width and a 48px button were tried and rejected as unapproved drift.)
 * The folded corner is this 36px shape, settled 2026-11-12 ("keep it as is,
 * to match app"): the user's original vector was lost with the brainstorm
 * frames, and Figma's `Home / Goals card` master draws the same shape. The
 * question text scales down below desktop (17px tablet, 16px phone) — also
 * settled as is.
 */
function StickyNote({
  index,
  total,
  question,
  answer,
}: {
  index: number
  total: number
  question: string
  answer: string
}) {
  const answerRef = useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = useState(false)
  const [clamped, setClamped] = useState(false)
  // `useId`: the same notes also render inside the invisible sizers.
  const answerId = useId()

  useLayoutEffect(() => {
    const p = answerRef.current
    if (!p) return
    const measure = () => {
      if (!open) setClamped(p.scrollHeight > p.clientHeight + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(p)
    return () => observer.disconnect()
  }, [open])

  return (
    <li
      aria-label={`Goal ${index + 1} of ${total}`}
      className="relative flex min-h-[311px] w-[calc(100%-40px)] shrink-0 snap-start flex-col gap-6 rounded-[16px_16px_32px_16px] border border-yellow-200 bg-yellow-50 p-[23px] shadow-card min-[768px]:w-[331px]"
    >
      <div className="flex flex-col gap-3">
        <p className="text-consumer-eyebrow font-medium text-consumer-primary">
          {String(index + 1).padStart(2, '0')}
        </p>
        <p className="text-consumer-eyebrow font-medium text-ink">{question}</p>
      </div>

      <div className="flex flex-col items-start gap-4">
        <p
          ref={answerRef}
          id={answerId}
          className={cn('text-consumer-body text-ink', !open && 'line-clamp-4')}
        >
          {answer}
        </p>
        {(clamped || open) && (
          <Button
            type="button"
            variant="secondary"
            surface="consumer"
            size="md"
            // The frame's instance is 40 tall with 20px sides (`size: 'md'` is
            // 40 with 18px); `px-5` is the frame's padding, 1:1.
            className="px-5"
            aria-expanded={open}
            aria-controls={answerId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Show less' : 'Show all'}
          </Button>
        )}
      </div>

      {/* The folded corner. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-px -bottom-px size-9 rounded-[10px_0_32px_0] bg-yellow-200 shadow-[-2px_-2px_4px_rgba(230,194,127,0.25)]"
      />
    </li>
  )
}
