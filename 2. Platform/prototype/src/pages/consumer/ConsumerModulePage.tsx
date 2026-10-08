import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headphones,
  NotebookPen,
  Video,
} from 'lucide-react'
import { CompletionHero } from '@/components/consumer/ConsumerCompletionHero'
import { EpisodePanel, type FollowMode } from '@/components/consumer/EpisodePanel'
import {
  CHROME_TRANSITION,
  ConsumerFlowFooter,
  PILL_OUTLINE,
  PILL_PRIMARY,
  SHELL,
} from '@/components/consumer/ConsumerFlowFooter'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import { ModuleHeroWave } from '@/components/consumer/ModuleHeroWave'
import {
  ModuleReflection,
  type ReflectionAnswers,
  type ReflectionMember,
  type ReflectionWho,
} from '@/components/consumer/ModuleReflection'
import { RESOURCE_CARD_ID, ResourceCard } from '@/components/consumer/ResourceCard'
import { ModuleSummaryCards } from '@/components/consumer/ModuleSummaryCards'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import {
  formatTimestamp,
  moduleLesson,
  moduleReflection,
  type ModuleLesson,
  type ReflectionQuestion,
} from '@/data/consumerLessonContent'

/**
 * A consumer module's inner pages — complete as of Round 47.
 *
 * | Stage | Frame |
 * |---|---|
 * | welcome | `818:12862` |
 * | video | `819:13049` |
 * | summary | `882:2067` (front) · `900:2244` (back) |
 * | reflection | `910:2367` |
 * | done | `915:3850`, with `915:4218` for its badge |
 *
 * ── Shape ─────────────────────────────────────────────────────────────────
 *
 * One page, five screens, `stage` state rather than five routes — the same
 * chassis `ConsumerDiaryPage` (Round 44) already uses for this portal's other
 * multi-step flow, down to the `AnimatePresence mode="wait"` swap and moving
 * focus to the incoming heading on every change. Two consumer flows built two
 * different ways would be the drift this project keeps writing rules about.
 * They now also share the completion screen itself, through
 * `components/consumer/ConsumerCompletionHero.tsx`.
 *
 * Only **four** of the five carry progress: see `STAGES` below.
 *
 * ── The header has no nav here, on purpose ────────────────────────────────
 *
 * `showNav={false}` (new in this round, additive on `ConsumerShell`). Both
 * frames draw the bare wordmark + Sign Out header, and that is right rather
 * than an oversight: a module is something you are *inside*. Leaving the portal
 * tabs up invites a consumer to wander out of a video halfway through with no
 * idea whether their place was kept. Going home is a deliberate control in the
 * yellow bar instead.
 *
 * ── Every screen has a way back ───────────────────────────────────────────
 *
 * Round 46 shipped the video screen with Continue and nothing else, following
 * frame `819:13080`, which contains a "Back" pill (`875:1162`) the designer set
 * `hidden`. That was flagged at the time as a product call rather than a code
 * one, with the competing reading written down: a consumer with dementia should
 * never be in a flow with no visible way back. **Round 47 settled it that way
 * by direct instruction** — the video screen has a Go back now, so all four
 * stages do. On welcome it says "Go home" and leaves the module, because there
 * is no stage behind it.
 */

/* ── Stages ─────────────────────────────────────────────────────────────── */

/** The four stages that carry progress. `done` is a fifth screen but not a
 *  fifth quarter — it is what the module ends on, so it sits outside this list
 *  and the bar reads 100% on reflection rather than 80%. */
const STAGES = ['welcome', 'video', 'summary', 'reflection'] as const
type ProgressStage = (typeof STAGES)[number]
type Stage = ProgressStage | 'done'

/**
 * The progress figure in the yellow bar, derived from the stage rather than
 * stored. Frame `875:1390` draws a bar at 48.389 of 104 (46.5%) beside a label
 * reading "100% complete" — the two cannot both be true, so neither is
 * transcribed and both are computed from the same number here.
 */
function stageProgress(stage: ProgressStage): number {
  return (STAGES.indexOf(stage) + 1) / STAGES.length
}

/**
 * Direction-aware chrome: the module bar comes back when you scroll **up**, the
 * footer comes in when you scroll **down**. Direct instruction.
 *
 * ── Why this shape, given both were unpinned one instruction ago ───────────
 *
 * Pinning them permanently was the first build and was rejected: between a
 * sticky global header, a sticky bar and a sticky footer, roughly a quarter of
 * a short laptop viewport was chrome and the video read through a letterbox.
 * Unpinning fixed that and lost something real — on a long page there was no
 * way out and no way on without scrolling to an end. This is the resolution:
 * each band is present exactly when you are heading toward what it does. Scroll
 * up (going back, wanting context) and the bar with Go home and your progress
 * returns; scroll down (working through the page) and Continue meets you.
 *
 * ── `sticky` + `translateY`, not `fixed` ──────────────────────────────────
 *
 * `fixed` takes the bands out of flow, so the content underneath needs top and
 * bottom padding equal to two heights that change with the viewport — a
 * measurement to keep in sync, which is how spacing drifts. `sticky` keeps each
 * band's original slot reserved and only overlays while stuck, so hiding one is
 * a transform and nothing else moves. The footer's natural slot is the end of
 * the content, which is also exactly where it should be when you arrive there.
 *
 * ── The rules, in priority order ──────────────────────────────────────────
 *
 *   page does not scroll   -> both visible (there is no direction to read)
 *   at the top             -> bar visible, footer hidden
 *   at the bottom          -> footer visible, bar hidden
 *   scrolling up           -> bar visible, footer hidden
 *   scrolling down         -> bar hidden, footer visible
 *
 * The two end rules are not the direction rules restated: you can arrive at the
 * bottom while scrolling down and then rubber-band, and without them the footer
 * would flick away at the moment you reached the thing it offers.
 *
 * `DIRECTION_THRESHOLD` is what stops the flicker. A raw `scrollY > last` test
 * flips on single-pixel jitter from momentum and trackpad rubber-banding, so a
 * flip needs 8px of travel in the new direction — enough to be a decision,
 * short enough to feel immediate.
 *
 * Under `prefers-reduced-motion` both bands stay visible permanently. Hiding
 * them is the animation, so honouring the preference means not doing it at all
 * rather than teleporting them, which is worse than either.
 */
const DIRECTION_THRESHOLD = 8
/** Treat "within this of an end" as at that end, so a 1px rounding error or a
 *  fractional device pixel ratio does not read as mid-page. */
const EDGE_EPSILON = 4

function useScrollChrome(reduceMotion: boolean, stage: Stage) {
  const [chrome, setChrome] = useState({ bar: true, footer: true })

  useEffect(() => {
    // Every stage starts with both bands visible and lets the first scroll take
    // over. Deriving the arrival state from the scroll position instead would
    // hide the footer on a screen the reader has not scrolled yet, so they land
    // on a page whose only way forward is off-screen — the wrong first
    // impression anywhere, and this portal's audience is the one this project
    // has an explicit plain-language, big-targets note about.
    setChrome({ bar: true, footer: true })
    if (reduceMotion) return

    // Not state: these are read and written on every scroll event and nothing
    // re-renders off them. Holding them in state would re-render the page at
    // scroll frequency to compute two booleans.
    let last = window.scrollY
    let anchor = window.scrollY

    const read = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight

      if (max <= EDGE_EPSILON) {
        setChrome({ bar: true, footer: true })
        last = y
        anchor = y
        return
      }
      if (y <= EDGE_EPSILON) {
        setChrome({ bar: true, footer: false })
        last = y
        anchor = y
        return
      }
      if (y >= max - EDGE_EPSILON) {
        setChrome({ bar: false, footer: true })
        last = y
        anchor = y
        return
      }

      // `anchor` is where the current run started, so the threshold measures
      // travel since the last flip rather than since the last event — a slow
      // drag would otherwise never accumulate 8px in one step and never flip.
      if ((y > last && y < anchor) || (y < last && y > anchor)) anchor = last
      const travel = y - anchor
      if (Math.abs(travel) >= DIRECTION_THRESHOLD) {
        setChrome(travel > 0 ? { bar: false, footer: true } : { bar: true, footer: false })
        anchor = y
      }
      last = y
    }

    // Deliberately NOT called here — see the reset above. The first real scroll
    // is what hands control to the direction rules.
    window.addEventListener('scroll', read, { passive: true })
    // A resize can turn a scrolling page into a non-scrolling one, and no
    // scroll event fires for that.
    window.addEventListener('resize', read)
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [reduceMotion, stage])

  return chrome
}

/**
 * The yellow bar under the header: where you are, and the one way out.
 * Slides in on scroll up — see `useScrollChrome`.
 */
function ModuleBar({
  lesson,
  stage,
  onHome,
  shown,
}: {
  lesson: ModuleLesson
  stage: ProgressStage
  onHome: () => void
  shown: boolean
}) {
  const pct = Math.round(stageProgress(stage) * 100)
  return (
    <div
      // Sticks directly under the global header, which is `sticky top-0`. The
      // offset reads `--consumer-header-h` rather than a literal: it was
      // `top-24` (96px) and Round 47 brought the header down to 72, which left
      // a 24px band of canvas showing between the two — reported as dead space,
      // and invisible unless you know what the number was.
      // `-translate-y-[calc(100%+96px)]` rather than `-100%`: sliding it only
      // its own height leaves it parked *behind* that header but still inside
      // the viewport, so its drop shadow bleeds out from under the white bar.
      // The extra 96 carries it fully off screen.
      // Read by `scrollToResourceCard` so an in-page jump can clear whatever
      // this bar's real height is, rather than carrying a copy of it.
      data-module-bar=""
      className={cn(
        'sticky top-[var(--consumer-chrome-h)] z-20 border-t border-hairline bg-yellow-200 py-4',
        shown ? 'translate-y-0' : '-translate-y-[calc(100%+96px)]',
      )}
      // `aria-hidden` is deliberately NOT set when hidden: this band holds the
      // only Go home control, and a screen-reader user has no scroll direction
      // to restore it with. It stays in the accessibility tree and in the tab
      // order at all times; only its paint moves.
      style={{
        filter: 'drop-shadow(2px 4px 8px rgba(230,194,127,0.2))',
        transition: CHROME_TRANSITION,
      }}
    >
      {/* `flex-nowrap`: below 640 the Go home control collapses to its glyph
          and sits in the SAME row as the module info (direct instruction), so
          the row must not wrap. Above 640 it is a labelled pill at the far left
          with the info right-aligned opposite, as the frame draws it. */}
      <div className={cn('flex items-center justify-between gap-4', SHELL)}>
      {/*
        Two shapes, one control.

        **Below 640** it is a 48px circle carrying only the house, sitting in the
        same row as the module info — direct instruction. The label does not
        disappear, it becomes `sr-only`, so the button keeps its accessible name
        and the 48px hit area is unchanged. (Worth flagging rather than burying:
        this portal's audience note argues against icon-only controls, and this
        is a deliberate exception made on instruction, not an oversight.)

        **From 640** it is the frame's labelled pill, at `min-w-32` rather than
        the frame's fixed 128. That is a measured fix, not a preference: this
        app's content — 20px padding either side, the glyph, an 8px gap and "Go
        home" at 16/600 — needs about 130, and at a hard 128 the flex line
        overflowed and the `<svg>`, being a flex item like any other, absorbed
        the difference by squashing. `shrink-0` on the glyph stops an icon ever
        paying for a layout's overflow.
      */}
      <button
        type="button"
        onClick={onHome}
        className={cn(
          PILL_OUTLINE,
          'shrink-0 whitespace-nowrap',
          'size-12 px-0 min-[640px]:size-auto min-[640px]:h-12 min-[640px]:min-w-32 min-[640px]:px-5',
        )}
      >
        {/* 20px at stroke 2.25, not the frame's 16 at lucide's default 2.
            Direct instruction: "home icon does not match the UI", then "its too
            small, thin". A 2-unit stroke on a 24-unit grid rendered into a 16px
            box paints 1.33 device px, which is genuinely lighter than the 16/600
            label beside it — the glyph and the text should read at the same
            weight. Measured, not eyeballed. */}
        {/* `ChevronLeft` at the bar's own 20px / 2.25 weight rather than
            lucide's 16/2 default — the same correction the house glyph carried
            before it ("home icon does not match the UI", then "its too small,
            thin"): a 2-unit stroke rendered into a 16px box paints 1.33 device
            px and reads lighter than the 16/600 label beside it. */}
        <ChevronLeft aria-hidden="true" strokeWidth={2.25} className="size-5 shrink-0" />
        <span className="sr-only min-[640px]:not-sr-only">{EXIT_LABEL}</span>
      </button>

      <div className="flex min-w-0 flex-col items-start gap-1 min-[640px]:items-end">
        {/*
          Round 46, direct instruction, mobile only: the number and the module
          name stack, the percentage sits under them, and the bar goes **below**
          the percentage at a reduced width.

Both halves are one DOM at both widths rather than a mobile copy and a
          desktop copy — an invisible or duplicated variant is how the two drift
          apart (Round 34). The label/title split is two spans that go from
          `block` to `inline` with a colon that only exists above 640.

          ⚠️ The bar was **below** the caption on mobile first, also on direct
          instruction. It came back up into the row on the next one: sitting on
          its own line near the band's lower edge, a full 100% bar read as a
          second rule under the band rather than as progress — "the lower stroke
          becomes progress bar. do not progress bar below the 100%complete
          text." Beside the caption it cannot be mistaken for the edge. The
          reduced width from that first pass is kept.
        */}
        <p className="text-body-md text-ink min-[640px]:truncate">
          <span className="block min-[640px]:inline">
            {lesson.label}
            <span className="hidden min-[640px]:inline">:</span>
          </span>{' '}
          <span className="block min-[640px]:inline">{lesson.title}</span>
        </p>
        <div className="flex items-center gap-3 min-[640px]:gap-4">
          {/* A real `progressbar`, not a tinted div — the percentage beside it
              is a caption, and a caption is not a machine-readable value. */}
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${lesson.title} progress`}
            className="h-1.5 w-20 overflow-hidden rounded-2xl bg-white min-[640px]:w-26"
          >
            <div className="h-full rounded-2xl bg-consumer-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-body whitespace-nowrap text-ink">{pct}% complete</p>
        </div>
      </div>
      </div>
    </div>
  )
}

/* ── Stage 1: welcome ───────────────────────────────────────────────────── */

function WelcomeStage({
  lesson,
  headingRef,
}: {
  lesson: ModuleLesson
  headingRef: (node: HTMLHeadingElement | null) => void
}) {
  /*
   * Round 47, direct instruction: streamline this screen with the other three.
   * The two full-width pills that used to sit in the content are gone and the
   * shared `ConsumerFlowFooter` carries them instead, so everything this block used
   * to do to hold them clear of the copy — `justify-between`, a 64px floor gap,
   * `pb-20` — went with them. What is left is the band and one centred column.
   *
   * The Start learning pill keeps its wording and **gains the footer's
   * chevron**, reversing an earlier call in this flow that gave it none because
   * it begins rather than advances. One footer used four times cannot also be
   * four footers, and the label already carries that distinction.
   *
   * ⚠️ A JSX comment cannot sit beside the root element of a `return ( … )` —
   * that is two children in an expression position, and it fails in the Vite
   * transform. Same family of trap as Round 23's comment inside an attribute
   * list. Hence a plain JS comment out here.
   */
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-10">
        <ModuleHeroWave />

        {/* The frame's 112px inset is wider than the page gutter and is what
            keeps a 40px title from running the full width. */}
        <div
          className={cn(
            'flex flex-col items-center gap-4 text-center',
            'mx-auto w-full max-w-[1320px] px-6 min-[1200px]:px-28',
          )}
        >
          <p className="text-consumer-lesson font-semibold text-black">{lesson.label}</p>
          <div className="flex w-full flex-col gap-4">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-consumer-display text-balance text-black outline-none"
            >
              {lesson.title}
            </h1>
            <p className="text-consumer-eyebrow text-balance text-ink-muted">{lesson.intro}</p>
          </div>
        </div>
      </div>

    </div>
  )
}

/* ── Stage 2: video ─────────────────────────────────────────────────────── */

/**
 * The three ways to follow along.
 *
 * Real single-select buttons with a visible pressed state, and the panel beside
 * them deliberately does NOT change yet — direct instruction: "for now make
 * them functional, i.e. add interactive states, but do not wire them. I will
 * share the UI for each."
 *
 * `aria-pressed` on three buttons in a `role="group"`, NOT
 * `role="radiogroup"`/`role="radio"`. Those roles carry a roving-tabindex and
 * arrow-key contract, and this project has already shipped one control that
 * claimed them without implementing it (`WeekdayPicker`, fixed in Round 14.5).
 * A pressed toggle needs no such contract and is honest about what it is.
 */
const FOLLOW_MODES = [
  { id: 'video', label: 'Video', icon: Video },
  // Direct instruction: "use your own icons, figma is for reference only".
  // The frame draws a music note for Audio and a quote mark for Transcript;
  // both are lucide glyphs chosen for the *layout*, not for this audience.
  // `Headphones` says listen and `FileText` says read, which is what these two
  // controls actually offer — and this portal's readers are the ones this
  // project has an explicit plain-language note about, so a quote mark standing
  // in for "a written version of the video" is the wrong kind of clever.
  { id: 'audio', label: 'Audio', icon: Headphones },
  { id: 'transcript', label: 'Transcript', icon: FileText },
] as const

function FollowAlongCard({
  mode,
  onSelect,
}: {
  mode: FollowMode
  onSelect: (m: FollowMode) => void
}) {
  return (
    <div className="flex w-full shrink-0 flex-col justify-center gap-6 rounded-sm bg-yellow-100 p-6 min-[1200px]:w-60">
      <div className="flex flex-col gap-1.5 text-ink-muted">
        <p className="text-consumer-lead">How would you like to follow along?</p>
        <p className="text-body leading-[1.4]">Pick the way that feels most comfortable for you.</p>
      </div>
      {/* Frames `918:4313` / `920:1096` / `920:1119` stack the three controls in
          one column at 12px. They were a wrapping row while nothing but their
          own pressed state changed; now that each one swaps the panel beside
          it, a fixed column is also what stops the list reflowing under the
          reader as they move down it. Below 1200 the card is full width, where
          a single 152px column in a 327px card reads as a stray — so it wraps
          into a row again there, which is the shape it already had. */}
      <div role="group" aria-label="How would you like to follow along?" className="flex flex-wrap gap-3 min-[1200px]:flex-col min-[1200px]:flex-nowrap">
        {FOLLOW_MODES.map(({ id, label, icon: Icon }) => {
          const active = mode === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(id)}
              className={cn(
                'flex h-10 w-38 items-center justify-center gap-2 rounded-[28px] border border-ink text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2',
                active ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-parchment',
              )}
            >
              {/* Same 20px / 2.25 treatment as the Go home glyph — at 16px on
                  lucide's default stroke these read visibly lighter than the
                  16/600 label they sit beside. */}
              <Icon aria-hidden="true" strokeWidth={2.25} className="size-5 shrink-0" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Jump to a chapter.
 *
 * A real horizontal scroller, because 6 chapters at 180px plus gaps is 1164px
 * against a content column that is 1121px at 1281 — it overflows at the frame's
 * own width, let alone a phone. `min-w-0` on the flex parent AND the scroller
 * is load-bearing: without it the widest child sizes the track and pushes the
 * whole document into horizontal scroll, which this project has shipped three
 * times (Rounds 21.1, 30, 34).
 *
 * There is deliberately no `sr-only` text inside the scroller. Tailwind's
 * `sr-only` is `position: absolute` + `white-space: nowrap`, and inside a
 * horizontally-scrolling row it escapes the clip and widens the document —
 * Round 30 traced a 2399px page to exactly that. The accessible names ride on
 * `aria-label` instead, which carries the same information and generates no box.
 */
/** One thumbnail (180) plus its gap (16). A chevron press moves two of them,
 *  which is far enough to feel like progress and short enough that nothing is
 *  skipped past unseen. */
const CHAPTER_STEP = (180 + 16) * 2

function ChapterCarousel({
  lesson,
  activeId,
  onSelect,
}: {
  lesson: ModuleLesson
  activeId: string
  onSelect: (id: string) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  /**
   * Both chevrons stay mounted at the ends and go `disabled` instead of
   * disappearing — deliberately, and not a style preference.
   *
   * Round 19.1 shipped a Critical here: a carousel chevron that unmounts when
   * it reaches an end drops keyboard focus to `<body>` mid-press, and the fix
   * needed memoized callback refs to work around a `blur`-vs-smooth-scroll
   * race. A control that never unmounts cannot lose focus on unmount, so the
   * whole class of bug does not arise. Disabled buttons stay in the tab order
   * via `aria-disabled` rather than the `disabled` attribute, so focus is never
   * silently dropped from one either.
   */
  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 })
  }, [])

  useEffect(() => {
    measure()
    const el = scroller.current
    if (!el) return
    // A `ResizeObserver` as well as the scroll listener: the row's overflow
    // depends on the container's width, so a resize can move it from
    // "scrollable" to "not" without any scroll event firing.
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  const nudge = (dir: -1 | 1) => {
    scroller.current?.scrollBy({ left: dir * CHAPTER_STEP, behavior: 'smooth' })
  }

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-6 rounded-2xl bg-purple-200 p-6">
      <div className="flex flex-col gap-1 text-ink">
        <h2 className="text-consumer-lead">Jump to a chapter</h2>
        <p className="text-body leading-[1.4]">
          Tap any chapter below to watch that part of the video
        </p>
      </div>

      {/* `pb-2 -mb-2` so a focus ring on the last row is not clipped by the
          scroller's own overflow — the same fix Round 18 applied to the
          notification carousel, where `overflow-x-auto` also clips vertically
          per spec. */}
      <div ref={scroller} onScroll={measure} className="-mb-2 min-w-0 overflow-x-auto pb-2">
        <ul className="flex w-max gap-4">
          {lesson.episode.chapters.map((chapter, i) => {
            const active = chapter.id === activeId
            const last = i === lesson.episode.chapters.length - 1
            return (
              <li key={chapter.id} className="flex w-45 shrink-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(chapter.id)}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`Chapter ${i + 1}, ${chapter.title}, starts at ${formatTimestamp(chapter.startsAt)}`}
                  className={cn(
                    'block h-27 w-full overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2',
                    active &&
                      'border-[3px] border-consumer-primary bg-white p-0.5 shadow-[2px_8px_16px_0px_rgba(85,85,85,0.4)]',
                  )}
                >
                  {/* One shared cover, per direct instruction. The frames' own
                      thumbnails are seven stock photos of a man at a bookshelf
                      from an unrelated video; this is the photo the module
                      cards already use. */}
                  {/* The same crop centre `LearningTaskCard` uses: the source
                      is a 666x1000 portrait and a plain `object-cover` into a
                      180x108 landscape box lands on a shoulder. 29.7% is where
                      the two faces sit. */}
                  <img
                    src="/illustrations/consumer-home/lesson-cover.jpg"
                    alt=""
                    className="size-full rounded-lg object-cover"
                    style={{ objectPosition: 'center 29.7%' }}
                  />
                </button>

                {/* Timestamp row. The connector is a border on the row rather
                    than a separate line element, so it can never be a pixel off
                    the badges it runs between. It stops at the last chapter —
                    a line running off the end of the list implies a chapter
                    that is not there. */}
                <div className="relative flex h-8 items-center">
                  {!last && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 right-[-1rem] left-0 border-t border-consumer-primary/40"
                    />
                  )}
                  <span className="relative rounded-[10px] bg-consumer-primary px-2.5 py-1 text-body-md text-white">
                    {formatTimestamp(chapter.startsAt)}
                  </span>
                </div>

                <p
                  className={cn(
                    'line-clamp-2 text-body',
                    active ? 'text-consumer-primary' : 'text-ink',
                  )}
                >
                  {chapter.title}
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Direct instruction: "in jump to chapter section add a chevron to let
          user see whats hidden in chapters". Placed over the thumbnail strip
          rather than below the row, so it is beside the thing it moves.
          `top-[7.5rem]` is the panel's 24px padding + the heading block + the
          24px gap + half a 108px thumbnail. */}
      {(['left', 'right'] as const).map((side) => {
        const dir = side === 'left' ? -1 : 1
        const off = side === 'left' ? edges.start : edges.end
        const Icon = side === 'left' ? ChevronLeft : ChevronRight
        return (
          <button
            key={side}
            type="button"
            aria-disabled={off}
            onClick={off ? undefined : () => nudge(dir)}
            className={cn(
              // Direct instruction: black fill, white glyph, with a shadow.
              // The shadow is the thumbnails' own active-state one (frame
              // `882:1875`) rather than the app's warm gold card shadow, which
              // reads as a smudge on this purple panel — the same call Round 30
              // made for the trainee sidebar.
              'absolute top-[7.5rem] flex size-10 items-center justify-center rounded-full bg-ink text-white shadow-[2px_8px_16px_0px_rgba(85,85,85,0.4)] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
              side === 'left' ? 'left-1' : 'right-1',
              off && 'pointer-events-none opacity-0',
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span className="sr-only">
              {side === 'left' ? 'Show earlier chapters' : 'Show later chapters'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Where leaving the module goes.
 *
 * Round 48, direct instruction: "say go back fie either when user comes from
 * home or module, navigation remains same" — so the CONTROL is one control,
 * labelled "Go back" wherever the reader came from, and only the destination
 * still follows the origin (`?from=modules` -> My Modules, anything else ->
 * Home).
 *
 * That reverses this function's own earlier shape, which returned a matching
 * label and glyph per origin ("Go home" with a house, "My modules" with a
 * mortarboard). The reasoning then was this file's own rule that a control must
 * not name a destination it does not go to — and "Go back" satisfies that rule
 * better than either specific label did, because it is true of both
 * destinations without naming either. A reader who arrived from My Modules and
 * is sent to My Modules has gone back; so has one who arrived from Home.
 *
 * Carried in the URL rather than router state, for the reason Round 7.1 used a
 * `?from=` param for the coach player: router state is lost on a refresh and on
 * a shared link, and this page is one a reviewer reloads constantly.
 *
 * Home is the default, which is also the fallback for a deep link with no
 * `from` at all: it is the one destination every consumer has.
 */
function moduleExitTo(dyadId: string, from: string | null) {
  return from === 'modules' ? `/consumer/${dyadId}/learning` : `/consumer/${dyadId}`
}

/** The exit control's words, in one place. One string, because there is now
 *  exactly one label and three surfaces that print it (the yellow bar, the
 *  welcome footer, the completion CTA) — three literals would be three chances
 *  to drift.
 *
 *  Direct instruction: "This button should be Go back home. keep chevron.
 *  Navigation remains same", then "Or say Go home".
 *
 *  ⚠️ **The destination is not always home.** `moduleExitTo` returns My Modules
 *  when the module was opened from there (`?from=modules`), which is the common
 *  path off that page, and Home otherwise. So this label is true of one of its
 *  two destinations and the routing was deliberately left alone as instructed.
 *  Two one-line fixes exist if the mismatch matters later: derive the label from
 *  `moduleExitTo`'s own branch, or drop the `from` param so the control really
 *  does always go home. */
const EXIT_LABEL = 'Go home'


function VideoStage({
  lesson,
  headingRef,
}: {
  lesson: ModuleLesson
  headingRef: (node: HTMLHeadingElement | null) => void
}) {
  const [mode, setMode] = useState<FollowMode>('video')
  const [activeChapter, setActiveChapter] = useState(lesson.episode.chapters[0].id)

  return (
    <div className={cn('flex flex-col gap-10 py-14', SHELL)}>
      <div className="flex flex-col gap-2">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-consumer-card-title text-balance text-black outline-none"
        >
          {lesson.episode.title}
        </h1>
        <p className="text-consumer-eyebrow text-ink-muted">{lesson.episode.sub}</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Stacks below 1200 — the frame's row needs 849 + 32 + 240 of content
            against a column that is only that wide at the frame's own 1281. */}
        <div className="flex min-w-0 flex-col items-stretch gap-8 min-[1200px]:flex-row min-[1200px]:items-start">
          {/* Round 48 — the grey `#d9d9d9` placeholder is replaced by the real
              three-mode panel (frames `918:4307` / `920:1087` / `920:1110`).
              The toggle beside it now drives it, closing Round 46's own
              "do not wire them, I will share the UI for each". */}
          <EpisodePanel mode={mode} episode={lesson.episode} title={lesson.title} />
          <FollowAlongCard mode={mode} onSelect={setMode} />
        </div>

        <ChapterCarousel lesson={lesson} activeId={activeChapter} onSelect={setActiveChapter} />
      </div>
    </div>
  )
}

/* ── Stage 3: summary ───────────────────────────────────────────────────── */

/**
 * Frame `882:2067`.
 *
 * The frame draws a bare 75px `#d9d9d9` square above the heading — a
 * placeholder, not a treatment. Direct instruction: "there is a grey container,
 * thats for you to add icon blue coloer as you did in home page". Home's own
 * `CardIcon` (Round 45) is the precedent: a lucide glyph in `consumer-primary`,
 * no badge, no circle.
 *
 * Round 47 renamed this screen **"Module summary"** and moved it off
 * `NotebookPen`, on direct instruction. Both were right to change together: the
 * screen recaps what the module covered, and `NotebookPen` is this app's
 * reflection mark across all four portals — which is now a real stage of its
 * own, one screen further on. Two stages sharing one glyph and one word would
 * have been the only cue telling them apart.
 */
/**
 * Scroll the take-home guide into view from the summary copy above it (direct
 * instruction: "can here also we can give reference to download cards, section,
 * it scrolls and takes me there").
 *
 * Three things this deliberately does not do:
 *
 *   - **Not an `<a href="#...">`.** This app is on a HashRouter, so a fragment
 *     link rewrites `location.hash` and the router tries to match it as a route.
 *     A button carries the same action without touching navigation.
 *   - **Not `scrollIntoView`.** It scrolls every scrollable ancestor, and this
 *     project has fixed three separate bugs caused by exactly that (Rounds 18,
 *     19 and 7.1.2). An explicit `window.scrollTo` cannot pick the wrong one.
 *   - **Not a fixed offset for the sticky bar.** The bar's height is measured
 *     from the DOM, so this stays right if its padding or copy ever changes.
 *
 * Focus moves to the card as well as the scroll, which is what makes this a
 * real skip-link rather than a mouse-only convenience — otherwise a keyboard
 * user's next Tab continues from the link they just pressed, halfway up a page
 * that has moved under them.
 */
function scrollToResourceCard() {
  const card = document.getElementById(RESOURCE_CARD_ID)
  if (!card) return
  const bar = document.querySelector('[data-module-bar]')
  const clearance = (bar ? bar.getBoundingClientRect().height : 0) + 88
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: Math.max(0, card.getBoundingClientRect().top + window.scrollY - clearance),
    behavior: reduce ? 'auto' : 'smooth',
  })
  card.focus({ preventScroll: true })
}

/** Small counts as words, so a sentence reads as a sentence. Only the range a
 *  module's chapter list can actually reach; anything else falls back to the
 *  numeral rather than inventing a word. */
function countWord(n: number): string {
  return (
    ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n)
  )
}

function SummaryStage({
  lesson,
  headingRef,
}: {
  lesson: ModuleLesson
  headingRef: (node: HTMLHeadingElement | null) => void
}) {
  return (
    <div className={cn('flex flex-col gap-10 py-14', SHELL)}>
      <div className="flex flex-col gap-4">
        <span
          aria-hidden="true"
          className="flex size-[75px] shrink-0 items-center justify-center text-consumer-primary"
        >
          <BookOpen className="size-14" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-consumer-card-title text-balance text-black outline-none"
          >
            Module summary
          </h1>
          {/* The first sentence is the doc's MODULE CORE MESSAGE, quoted
              verbatim and read from the episode so it cannot drift from the one
              the cards were written against. The rest is the copy supplied in
              Round 47, with two of this portal's own conventions applied:
              "summaries" -> "summarise" (the verb, not the noun) and "listened"
              -> "listened to". */}
          {/* The module's core message used to open this paragraph; Round 47
              moved it to the completion screen on instruction, so this screen
              needed a line of its own. Four words, after a longer first attempt
              was cut back on instruction: it only has to say what the screen is
              before the sentence that says what the cards are. */}
          {/*
            Written for this portal's audience — direct instruction: "it needs to
            be more clear, simple, and easy to understand, remember this is for
            old people, with poor digital literacy, accessibility issues", then,
            after a first pass cut it to one line, "the copy is too short, make
            it more relevant, whats this page about, what Have I learnet so far,
            what Can I do in this page".

            So it answers those three, in that order, one per sentence:

              1. **What have I learned so far** — the chapters are behind them,
                 and what those chapters were actually about. The "one ordinary
                 day" framing is the module's own, from its intro and its Close
                 ("almost nothing about tonight was decided tonight").
              2. **What is this page** — a card for each part.
              3. **What can I do here** — turn a card over, and download the
                 guide at the bottom.

            The two earlier versions are recorded because each was wrong in a way
            worth not repeating:

              "A quick recap of this module. Below are cards that summarise
               everything you watched or listened to. Tap on each to read more,
               and download."
                 - "recap"/"summarise" are the wrong register, it described the
                   page layout before saying anything about the content, and
                   "and download" went stale the moment the per-card download
                   moved to the resource card.

              "Here is what this module covered. Tap a card to read more about
               it."
                 - Plain, but it says nothing about what was covered and never
                   mentions the guide, so a reader who scrolled no further would
                   not know it was there.

            One idea per sentence, and short ones. The chapter count is
            **interpolated from the module**, never written: this project has had
            a hardcoded count go wrong three separate times.
          */}
          <p className="text-consumer-eyebrow text-ink-muted">
            You have now been through all {countWord(lesson.episode.summaryCards.length)} parts of
            this module. Together they follow one ordinary day, from getting up in the morning to going
            to bed at night. There is a card below for each part.{' '}
            <span className="min-[1200px]:hidden">Tap</span>
            <span className="hidden min-[1200px]:inline">Click</span> a card to turn it over and
            read the main points again. At the bottom of the page you can{' '}
            <button
              type="button"
              onClick={scrollToResourceCard}
              // `py-2 -my-2` is the app's 36px control floor, bought back out of
              // the line box rather than added to it: at its natural 25px
              // `layout-audit.js` flagged this, and rightly — it is a real
              // target, and this portal's audience note is explicitly "big
              // targets". The negative margin cancels the padding's effect on
              // line rhythm, so the paragraph still sets as one block. Same
              // trick as the Round 32 tour's Skip control.
              //
              // ⚠️ 8px, not 6: the surrounding step is `consumer-eyebrow`, which
              // is a clamp, so the line box is 25px at desktop but only 22px on
              // a phone. 6px cleared the floor at 1056 and left it at **34px** at
              // 375 — measured at both, after the first pass was only checked on
              // the wide one.
              className="-my-2 inline-block rounded-sm py-2 font-semibold text-consumer-primary underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
            >
              download a guide to keep
            </button>
            .
          </p>
        </div>
      </div>

      <ModuleSummaryCards episode={lesson.episode} />

      {/* Frame `940:5497` — the take-home guide, below the cards (direct
          instruction: "we add a resource card below the summary cards"). One
          download for the whole module, which is why the per-card one above
          was removed in the same pass. */}
      <ResourceCard />
    </div>
  )
}

/* ── Stage 4: reflection ────────────────────────────────────────────────── */

/**
 * Frame `910:2367`.
 *
 * The same header shape as Summary — the frame's bare 75px `#d9d9d9` square
 * resolved to a lucide glyph in `consumer-primary`, then the title and one line
 * of sub copy — followed by the question card. `NotebookPen` moved here from
 * Summary in this round: it is this app's reflection mark across all four
 * portals, and this is now the reflection.
 *
 * The title and sub copy are the activity's, not the module's, so they live
 * here rather than in `consumerLessonContent` — they read identically whichever
 * module you are in. The questions do not, and they are read from the module.
 */
function ReflectionStage({
  questions,
  index,
  answers,
  members,
  onIndexChange,
  onToggle,
  shareWithCoach,
  onShareChange,
  headingRef,
}: {
  questions: ReflectionQuestion[]
  index: number
  answers: ReflectionAnswers
  members: ReflectionMember[]
  onIndexChange: (next: number) => void
  onToggle: (questionId: string, who: ReflectionWho, optionId: string) => void
  shareWithCoach: boolean | null
  onShareChange: (share: boolean) => void
  headingRef: (node: HTMLHeadingElement | null) => void
}) {
  return (
    <div className={cn('flex flex-col gap-10 py-14', SHELL)}>
      <div className="flex flex-col gap-4">
        <span
          aria-hidden="true"
          className="flex size-[75px] shrink-0 items-center justify-center text-consumer-primary"
        >
          <NotebookPen className="size-14" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-consumer-card-title text-balance text-black outline-none"
          >
            A few questions for both of you
          </h1>
          {/*
            Rewritten to match the Summary screen's pass — direct instruction:
            "make sure to update the copy here also, similar to how you improved
            the summary screen copy". Same three jobs, same order: what you have
            done, what this is, what you can do here.

            What the previous version got wrong:

              "Reflection questions activity" / "A self-check-in: there is no
               right or wrong answer, nothing here is scored, and nothing you
               choose is a problem."

              - **"activity" was filler** and "Reflection questions" named the
                internal stage rather than telling the reader what is about to
                happen. The heading now says who it is for, which is the part
                that actually changed in this round.
              - **"A self-check-in" is jargon** for this audience, and it opened
                a single sentence carrying three separate ideas behind a colon.
              - It never said **both of you answer**, which is the whole shape of
                the screen now, and never said the answers can be changed.

            The reassurance is kept nearly intact — "no right or wrong answers",
            "nothing you choose is a problem" — because for this audience it is
            the most useful sentence on the screen, and it only needed splitting
            off into its own.

            The count is interpolated, never written: same rule as the Summary
            screen, where a hardcoded number was wrong the first time.
          */}
          <p className="text-consumer-eyebrow text-ink-muted">
            You have finished the module. These {countWord(questions.length)} questions ask how
            sleep is going for each of you. There are no right or wrong answers, and nothing you
            choose is a problem. You can go back and change an answer at any time.
          </p>
        </div>
      </div>

      <ModuleReflection
        questions={questions}
        index={index}
        answers={answers}
        onIndexChange={onIndexChange}
        members={members}
        onToggle={onToggle}
      />

      {/* The share decision, below the summary card — direct instruction:
          "below this summary card, they need to decide whether they share it
          with their coach".

          Two buttons rather than a switch or a ticked-by-default checkbox. A
          default would answer a consent question on the reader's behalf, and
          this is the one screen in the module where what happens next depends
          on what they choose. Neither is preselected, and `Finish module` stays
          blocked until one is — the module footer says why.

          `aria-pressed` toggles rather than `role="radiogroup"`, the same call
          the answer boxes make: a radiogroup carries a roving-tabindex and
          arrow-key contract this project has shipped unimplemented once
          already. */}
      {index >= questions.length && (
        <section
          aria-labelledby="reflection-share-heading"
          className="flex flex-col gap-4 rounded-[16px] border border-parchment bg-white p-5 shadow-card min-[768px]:p-8"
        >
          <div className="flex flex-col gap-2">
            <h2
              id="reflection-share-heading"
              className="text-consumer-card-title text-balance text-ink"
            >
              Would you like your coach to see these answers?
            </h2>
            <p className="text-consumer-eyebrow text-ink-muted">
              Sharing helps your coach plan your next session around what you
              said. If you keep them private, only the two of you will see them.
              You can tell your coach either way.
            </p>
          </div>

          <div className="grid gap-3 min-[768px]:grid-cols-2">
            {[
              { value: true, label: 'Yes, share with my coach' },
              { value: false, label: 'No, keep these private' },
            ].map((choice) => {
              const on = shareWithCoach === choice.value
              return (
                <button
                  key={String(choice.value)}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onShareChange(choice.value)}
                  className={cn(
                    'flex min-h-14 items-center justify-center gap-3 rounded-[28px] border-2 px-5 py-3 text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2',
                    on
                      ? 'border-consumer-primary bg-consumer-primary text-white'
                      : 'border-consumer-primary bg-white text-consumer-primary hover:bg-purple-50',
                  )}
                >
                  {on ? <Check aria-hidden="true" className="size-6 shrink-0" strokeWidth={3} /> : null}
                  {choice.label}
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

/* ── Stage 5: done ──────────────────────────────────────────────────────── */

/**
 * The completion rosette — frame `915:4218`, committed as its own export at
 * 267 x 297.589.
 *
 * ── The breath is on the whole badge, not the pillow alone ────────────────
 *
 * Direct instruction was to bring back the pillow animation the sleep diary's
 * final screen uses, and this is the same 4s `scale: [1, 1.035, 1]` /
 * `y: [0, -3, 0]` loop on the same easing, read from the same place rather than
 * retyped. What differs is the *target*: the diary's pillow is one of six
 * separate layers, so it can breathe on its own, while this rosette is a single
 * flattened vector with the pillow inside it. The pillow could be pulled out of
 * the export and animated separately, and that is exactly the split this project
 * has shipped misaligned three times (§78.1) — so the badge breathes as one
 * object. At this size the difference is not visible; the rule is worth more
 * than the nuance.
 *
 * `motion-reduce` is handled by `useReducedMotion`, matching the mascot's own.
 */
function ModuleCompleteBadge() {
  const reduceMotion = useReducedMotion()
  return (
    <motion.img
      src="/illustrations/consumer-lesson/module-complete-badge.svg"
      alt=""
      aria-hidden="true"
      width={267}
      height={297.589}
      className="block h-auto w-[176px] sm:w-[218px]"
      animate={reduceMotion ? undefined : { scale: [1, 1.035, 1], y: [0, -3, 0] }}
      transition={
        reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' as const }
      }
    />
  )
}

/**
 * Frame `915:3850`, which is the sleep diary's own thank-you screen with
 * different words — same wave, same six-layer pillow, same centred column. So
 * it renders through the shared `CompletionHero` rather than a second copy of
 * that composition.
 *
 * ── Copy ──────────────────────────────────────────────────────────────────
 *
 * The "Remember, ..." sentence is the module's core message, quoted from the
 * activities doc and **moved here from the Summary screen** on instruction. It
 * is read from `episode.coreMessage`, not retyped, so the two screens cannot
 * drift about what this module's one idea is. The word "Remember," is the only
 * thing added to it.
 *
 * Three tone fixes on the rest, none of them to that sentence:
 *
 *  - The frame's title is "You have now completed module 4" — an administrative
 *    sentence for the one screen in the flow that should sound pleased. "Well
 *    done" leads, the module keeps its capital, and there is no exclamation
 *    mark, which this portal uses nowhere.
 *  - "Don't forget to complete your sleep diary for the day" contracts (this
 *    portal spells them out) and, more to the point, tells someone off before
 *    they have done anything wrong. Rewritten as an offer.
 *  - "Go Back Home" is title case against a portal that writes "Go home"
 *    everywhere else, including the yellow bar two screens back.
 */
function ModuleDoneStage({
  lesson,
  headingRef,
  onHome,
}: {
  lesson: ModuleLesson
  headingRef: (node: HTMLHeadingElement | null) => void
  onHome: () => void
}) {
  return (
    <CompletionHero
      // Frame `915:4218` — the rosette badge, replacing the pillow-and-books
      // mascot the diary's own thank-you screen uses. Direct instruction, and
      // it reads correctly: a rosette is what you get for finishing something,
      // where the pillow with a mug and a stack of books is what you get for
      // keeping a diary.
      mascot={<ModuleCompleteBadge />}
      // Direct instruction: "its fine if the avatar badge overlays on top of
      // text below subtly". The rosette's ribbons end in a point, which tucks
      // behind the heading better than it floats clear of it.
      artOverlap
      title={`Well done, you have finished ${lesson.label}`}
      headingRef={headingRef}
    >
      <p className="text-consumer-eyebrow mt-2 max-w-[644px] text-ink">
        Remember, {lesson.episode.coreMessage.charAt(0).toLowerCase()}
        {lesson.episode.coreMessage.slice(1)} When you are ready, today's sleep diary is waiting
        for you.
      </p>
      <div className="mt-6 flex w-full max-w-[448px] flex-col sm:mt-14">
        <button
          type="button"
          onClick={onHome}
          className={cn(PILL_PRIMARY, 'w-full justify-center')}
        >
          {EXIT_LABEL}
        </button>
      </div>
    </CompletionHero>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function ConsumerModulePage() {
  const { dyadId, moduleId } = useParams()
  const { consumerDyads } = useResearch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const reduceMotion = useReducedMotion()

  const [stage, setStage] = useState<Stage>('welcome')
  /**
   * The furthest stage reached, which is not the same as the current one and is
   * the only thing that can tell "Start learning" from "Go next" on the welcome
   * screen. Coming back to a screen you have already been past should not
   * re-offer to start something you have started — direct instruction.
   *
   * Held separately rather than derived from `stage`, for the reason
   * `ModulePlayerNav`'s own `furthestIndex` is (Round 33): re-reading an earlier
   * screen must never make a later one unreachable, or roll a label back.
   */
  const [furthest, setFurthest] = useState(0)
  const chrome = useScrollChrome(!!reduceMotion, stage)

  /**
   * The reflection activity's own state, held here rather than inside the
   * stage: `AnimatePresence` unmounts a stage on every swap, so a reader who
   * stepped back to the Summary to re-read a card and then forward again would
   * find their answers gone and their place reset to question one.
   *
   * Session state only, like the sleep diary's (Round 44) — a reload starts
   * over, and nothing is written to the coach's record. There is no store slice
   * for a consumer's reflection answers yet, and inventing one would put a
   * number on a researcher's screen that no coach has ever discussed.
   */
  const [questionIndex, setQuestionIndex] = useState(0)
  /**
   * Answers are held **per person**, not per question — new requirement: both
   * members of the dyad answer the same question before it advances, the way
   * the sleep diary already collects a night from both of them.
   *
   * Keyed by question id, then by `ReflectionWho`, so a question the reader has
   * not reached yet is simply absent and a carer-only dyad never grows a `ple`
   * key. One of them can fill both columns in — the point is that both answers
   * exist, not who held the phone.
   */
  const [answers, setAnswers] = useState<ReflectionAnswers>({})
  /** null until the reader chooses — see the share card. Never defaulted: a
   *  default would answer a consent question for them. */
  const [shareWithCoach, setShareWithCoach] = useState<boolean | null>(null)

  const toggleAnswer = useCallback(
    (questionId: string, who: ReflectionWho, optionId: string) => {
      setAnswers((prev) => {
        const forQuestion = prev[questionId] ?? {}
        const current = forQuestion[who] ?? []
        return {
          ...prev,
          [questionId]: {
            ...forQuestion,
            [who]: current.includes(optionId)
              ? current.filter((id) => id !== optionId)
              : [...current, optionId],
          },
        }
      })
    },
    [],
  )

  const dyad = consumerDyads.find((d) => d.id === dyadId)

  /**
   * Who is answering, PLE first then carer — the same order and the same
   * first-name-only treatment the sleep diary uses, so the two activities name
   * the pair identically.
   *
   * ⚠️ Built as a list rather than a fixed pair: a carer-only dyad has no
   * `patient`, and hard-coding two columns would have drawn an empty one under
   * a name nobody has. `useMemo` before the early returns below, because hooks
   * cannot sit behind a conditional.
   */
  const reflectionMembers = useMemo<ReflectionMember[]>(() => {
    if (!dyad) return []
    const rows: ReflectionMember[] = []
    if (dyad.patient) rows.push({ who: 'ple', name: dyad.patient.name.split(' ')[0] })
    rows.push({ who: 'carer', name: dyad.carer.name.split(' ')[0] })
    return rows
  }, [dyad])

  const lesson = moduleLesson(moduleId)
  const questions = moduleReflection(moduleId)

  /**
   * Focus the incoming stage's heading — as a **callback ref**, not a `useRef`
   * plus a `useEffect` keyed on `stage`.
   *
   * The effect version was built first and measured dropping focus to `<body>`
   * on every single stage change, which is this project's most-repeated defect
   * (six rounds). The cause is Round 32's lesson one layer up: under
   * `AnimatePresence mode="wait"` the incoming node mounts a commit LATER than
   * the state change, so an effect keyed on `stage` runs while the *outgoing*
   * stage is still the only thing in the tree. It focuses the old heading, or
   * nothing at all, and never runs again once the real one arrives.
   *
   * A callback ref is keyed on the **element**, which cannot exist too early:
   * React invokes it synchronously the moment the new heading attaches,
   * whichever commit that turns out to be. `preventScroll` keeps the viewport
   * still — focusing an element at the top of a fresh screen has scrolled
   * artwork out of frame in Rounds 18 and 19.
   */
  const headingRef = useCallback((node: HTMLHeadingElement | null) => {
    node?.focus({ preventScroll: true })
  }, [])

  if (!dyad) return <Navigate to="/consumer" replace />
  // A module with no content yet, or an id that is not a numbered module, goes
  // back to the list rather than rendering an empty player.
  if (!lesson) return <Navigate to={`/consumer/${dyadId}/learning`} replace />

  /** Leaving part-way through returns you where you came from — Home, or My
   *  Modules if that is where the module was opened from. */
  const toOrigin = () => navigate(moduleExitTo(dyad.id, from))
  /**
   * Finishing goes **Home**, always — direct instruction: "after completing
   * module, take me back to homepage".
   *
   * Deliberately not `moduleExitTo`: that returns My Modules when the module
   * was opened from there, which is the common path off that page, so a reader
   * who finished a module was being dropped back on the list they started from
   * rather than the page that shows them what to do next. It also settles the
   * mismatch flagged when this button was renamed — the completion CTA says
   * "Go home" and now genuinely goes home.
   *
   * The mid-module exit above still returns to its origin: leaving early is a
   * different intent from finishing, and going back to the list you were
   * browsing is the right answer there.
   */
  const toHomePage = () => navigate(`/consumer/${dyad.id}`)
  const advance = () => {
    if (stage === 'done') {
      toHomePage()
      return
    }
    // Finishing the last progress stage lands on the completion screen rather
    // than dropping the reader back on My Modules with no acknowledgement that
    // they got to the end. Frame `915:3850`.
    const next: Stage | undefined = STAGES[STAGES.indexOf(stage) + 1] ?? 'done'
    setStage(next)
    setFurthest((f) => Math.max(f, STAGES.indexOf(next)))
    // The heading focus uses `preventScroll`, so without this a reader who
    // advanced from the bottom of a long stage would land part-way down the
    // next one. `instant` rather than smooth: this is a screen change, not a
    // journey across one page, and animating it would race the stage crossfade.
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
  const retreat = () => {
    // From the completion screen, back is the last thing you did.
    const prev = stage === 'done' ? 'reflection' : STAGES[STAGES.indexOf(stage) - 1]
    if (!prev) return
    setStage(prev)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  /*
   * Finish only lights up once every question has an answer — direct
   * instruction. Counted against the real question list rather than a tally
   * that could drift from it, and only on the reflection stage: Continue on the
   * video and summary screens is not gated on anything. Leaving the module is
   * still possible throughout, through Go back and through Go home in the
   * yellow bar.
   *
   * Computed here rather than inline in the attribute list: a comment in a JSX
   * attribute position is the trap §Round 23 records, where `tsc` passes what
   * Vite's parser will not.
   */
  const reflectionIncomplete =
    stage === 'reflection' &&
    questions.some((q) =>
      // Every member has to have answered every question — the same "both of
      // you" rule the card itself enforces per question, applied to the whole
      // set before the module can be finished.
      reflectionMembers.some((m) => ((answers[q.id] ?? {})[m.who] ?? []).length === 0),
    )
  const blockedReason = reflectionIncomplete
    ? 'Please answer all questions first.'
    : stage === 'reflection' && shareWithCoach === null
      ? // The share choice is required rather than defaulted, so Finish waits
        // for it too. Same treatment as an unanswered question: the control
        // stays focusable and says why.
        'Please choose whether to share your answers first.'
      : undefined

  const stageMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
      }

  return (
    <ConsumerShell
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      showNav={false}
      // A module is entered from Home or My Modules, so the portal's own
      // first-run welcome does not belong in front of it.
      showWelcome={false}
      // The shell contributes no padding: the welcome stage's photo band is
      // full-bleed and the yellow bar and footer bleed to the viewport edges,
      // so every inset below is the stage's own.
      contentClassName="bg-consumer-canvas relative overflow-x-clip p-0"
      contentFullBleed
      // The footer is viewport-anchored whenever the chrome slides it in, and
      // the shell's cue pins itself to the same corner — measured overlapping
      // the footer's own Go back on a phone. The sliding chrome already says
      // there is more below.
      showScrollCue={false}
      optedOut={dyad.optedOut}
    >
      {/*
        Direct instruction: "the lower footer should always be sticky at
        bottom". `sticky bottom-0` alone is not enough — a sticky element only
        detaches from the flow once its container overflows, so on a short
        stage (Summary, Reflection, or the video screen on a tall monitor) the
        footer simply sat wherever the content ended, halfway up the page.

        This column gives the page a viewport-height floor and hands the slack
        to the stage between the two bars, so the footer is pushed to the bottom
        of the window when the content is short and stays stuck there when it is
        long. `96px` is the header's own height, which is `sticky top-0` above
        this. `min-h-0` on the growing child, or a long stage cannot shrink
        inside it and the sticky footer is pushed off-screen.
      */}
      <div className="flex min-h-[calc(100vh-var(--consumer-header-h))] flex-col">
      {/* The footer is on every stage; the yellow bar is not. Round 47 put the
          bar on welcome too and it came straight back off on the next
          instruction: "there is no need to show header on first page, just
          footer is fine". It is the right call — the bar carries Go home and a
          progress figure, and neither means anything on a screen you have not
          started, where "25% complete" is a claim about work nobody has done.
          The footer stays, because that screen does need a way forward. */}
      {stage !== 'welcome' && stage !== 'done' && (
        <ModuleBar
          lesson={lesson}
          stage={stage}
          onHome={toOrigin}
          shown={chrome.bar}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col">
      {/*
        No `initial={false}`, deliberately — direct instruction: "when I start,
        resume module, there is no motion transition to the welcome page, add
        it. currently it is static."

        The cause was one level up. `ConsumerShell` holds a module-scoped
        `pageIntroPlayed` latch that suppresses `motion.main`'s entrance after
        the first render of the session, added in Round 41 so switching between
        Home / My Modules / Need Help does not replay a fade every time ("this
        section should not keep on reload"). Correct for tabs, wrong here: a
        module is a place you *enter* from a Play control, and arriving with no
        movement at all reads as a page that failed to transition.

        So the entrance is owned by this page rather than by unwinding the
        shell's latch, which would bring the flicker back on all four tabs. The
        first mount now plays the same 8px rise the stage swaps use, so entering
        the module and moving through it feel like one motion vocabulary.
      */}
      <AnimatePresence mode="wait">
        {stage === 'welcome' && (
          <motion.div key="welcome" className="flex flex-1 flex-col" {...stageMotion}>
            <WelcomeStage lesson={lesson} headingRef={headingRef} />
          </motion.div>
        )}

        {stage === 'video' && (
          <motion.div key="video" {...stageMotion}>
            <VideoStage lesson={lesson} headingRef={headingRef} />
          </motion.div>
        )}

        {stage === 'summary' && (
          <motion.div key="summary" {...stageMotion}>
            <SummaryStage lesson={lesson} headingRef={headingRef} />
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done" {...stageMotion}>
            <ModuleDoneStage
              lesson={lesson}
              headingRef={headingRef}
              onHome={toHomePage}
            />
          </motion.div>
        )}

        {stage === 'reflection' && (
          <motion.div key="reflection" {...stageMotion}>
            <ReflectionStage
              questions={questions}
              index={questionIndex}
              answers={answers}
              members={reflectionMembers}
              onIndexChange={setQuestionIndex}
              onToggle={toggleAnswer}
              shareWithCoach={shareWithCoach}
              onShareChange={setShareWithCoach}
              headingRef={headingRef}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {stage !== 'done' && (
      <ConsumerFlowFooter
          /* "Finish module" everywhere but a phone, where the footer also
             carries Go back and the pair would crowd — direct instruction. */
          label={
            stage === 'welcome' ? (
              // "Start learning" only the first time through. Come back to this
              // screen having already been past it and it says "Go next" like
              // every other stage, because there is nothing left to start.
              furthest > 0 ? (
                'Go next'
              ) : (
                'Start learning'
              )
            ) : stage === 'reflection' ? (
              <>
                <span className="min-[768px]:hidden">Finish</span>
                <span className="hidden min-[768px]:inline">Finish module</span>
              </>
            ) : (
              // "Go next" from the second screen on — direct instruction. It
              // pairs with "Go back" beside it, which "Continue" never did:
              // the two now name the same kind of move in opposite directions.
              'Go next'
            )
          }
          onContinue={advance}
          continueBlockedReason={blockedReason}
          // Every stage has a back control now — direct instruction to add one
          // to the video screen, which had kept the single action its own frame
          // draws (`819:13080`'s Back pill is set `hidden` there). Frame
          // `882:2185` already put one beside Continue from Summary on, so the
          // frames were the odd pair, not the flow.
          // Welcome's back control leaves the module for the consumer's Home
          // rather than stepping a stage: there is no stage behind it, and
          // `retreat` would silently do nothing. It reads "Go back home" there —
          // direct instruction — and the destination follows the label, because
          // a button that says home and lands on My Modules is a lie the reader
          // has no way to check.
          /* No `backLabel`/`backIcon` overrides any more: `ConsumerFlowFooter`
             already defaults to "Go back" with a `ChevronLeft`, which is now
             what every stage wants. The welcome screen differs only in WHERE
             its back control goes, not in what it says. */
          onBack={stage === 'welcome' ? toOrigin : retreat}
          shown={chrome.footer}
      />
      )}
      </div>
    </ConsumerShell>
  )
}
