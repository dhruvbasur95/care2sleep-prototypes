import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Check, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LessonState, LessonView } from './lessons'

/**
 * The lesson cards for the Consumer Portal — Round 43, frames `771:3711`
 * (desktop My Lessons), `792:2080` (mobile) and the six state frames
 * `792:2310` / `792:2390` / `792:2429` (the week's lesson: start / resume /
 * complete) and `792:2454` / `792:2337` / `792:2362` (a previous lesson: the
 * same three).
 *
 * ── Six frames, two components, one set of primitives ─────────────────────
 *
 * The six frames are not six designs. They are **three states against two
 * surfaces**, so they ship as two card components sharing `LessonPlayCta`,
 * `LessonProgress` and the two complete indicators. Building six would have
 * guaranteed that a later change to, say, the progress bar reached four of them.
 *
 * ── Why each card is one DOM, not a mobile copy and a desktop copy ────────
 *
 * The two page frames compose the same card very differently: on mobile the
 * week's lesson is a filled purple card with the photo inside it, and on desktop
 * the photo becomes a bordered tile with the text beside it on the bare page
 * canvas. A previous lesson goes further — on mobile it has **no photo at all**.
 *
 * That is a real difference, but it is a difference of surface colour and flex
 * direction over the same content in the same order, so it is one element tree
 * with responsive classes rather than two trees behind a breakpoint. Two trees
 * would mean every copy fix, every aria change and every state addition had to
 * be made twice — and this project has a standing rule about exactly that
 * (`ProfileDetailsSections`, §80).
 *
 * ── Type steps: the frames' flat values against the portal's clamps ───────
 *
 * Round 42 replaced this portal's paired `text-x md:text-y` classes with single
 * `clamp()` steps, and four of these frames' pairs land on an existing step
 * **exactly**: 28/40 is `consumer-display`, 22/28 is `consumer-card-title`,
 * 18/20 is `consumer-lesson`, 16/18 is `consumer-eyebrow`. That is a strong
 * signal the frames were drawn against the same system.
 *
 * Two nodes are outliers and were **not** given new tokens: the section heading
 * is a flat 22 where `consumer-heading` is 20 -> 22, and the chip is a flat 16
 * where `consumer-chip` is 14 -> 18. Both match the frame exactly at desktop and
 * sit 2px under it at 375. Adding a step for each would give this portal two
 * section-heading tokens and two chip tokens differing only on a phone, which is
 * the drift the Round 42 pass existed to end. Recorded here rather than hidden:
 * if the 375 values are deliberate, change the two `clamp()` minimums in
 * `consumer-tokens.css` and both surfaces move together.
 */

/** Every card in these frames uses the same photo. There is no per-lesson cover
 *  art in the data, and inventing six would be inventing content — so this is
 *  the one committed cover, shared with Home's own lesson card. */
const LESSON_COVER = '/illustrations/consumer-home/lesson-cover.jpg'

/**
 * CTA labels.
 *
 * Sentence case, and the same label at every width. The desktop frame shortens
 * the week's lesson CTA to "Play" while every other frame says "Play Lesson";
 * one control with two names across a resize is worse than losing four
 * characters, so the longer label holds. "Play again" is the Round 43 direct
 * instruction ("we were saying Play lesson again, but stream line it to Play
 * again"), applied to Home in the same round.
 */
const CTA_LABEL: Record<LessonState, string> = {
  start: 'Play module',
  resume: 'Resume module',
  complete: 'Play again',
}

/**
 * The play pill: **48** tall, 28 radius, a 16px play glyph and a 16/600 label.
 *
 * ⚠️ 48, not the 56 these cards' own frames draw — Round 46, direct
 * instruction: "i can see button height variation in home page play lesson
 * looks taller than fill sleep diary. make sure the button heights are
 * consistent." Measured on Home, the three task-card CTAs were 56 / 48 / 48
 * ("Resume module", "Fill in sleep diary", "Join video call") sitting in a row
 * of identical cards, which reads as a mistake rather than as emphasis.
 *
 * 48 is the value everything else in this portal already uses, including both
 * module inner-page frames, so the outlier moved rather than the majority. A
 * deliberate divergence from frames `792:2310`/`786:4179` and their siblings,
 * recorded here so it is not "corrected" back on the next transcription pass.
 */
export function LessonPlayCta({
  state,
  className,
  title,
  to,
}: {
  state: LessonState
  className?: string
  /** Named in the accessible label so a screen-reader user hears which lesson
   *  a "Play again" button belongs to — there are up to seven on this page. */
  title: string
  /**
   * Where the module's inner pages live. When set, the control renders as a
   * real `<Link>` rather than a button, because it navigates: middle-click,
   * right-click-open-in-new-tab and the browser's own status bar all stop
   * working on a button that calls `navigate()`.
   *
   * Optional, and a card with no destination stays a plain button that does
   * nothing, which is honest for the five modules whose content is not built.
   *
   * An `onClick` prop lived here until Round 46's close-out. Its only caller
   * was Home's demo state cycler, which the same round replaced with a real
   * link, so it went rather than remain a second unused way to wire one
   * control.
   */
  to?: string
}) {
  const inner = (
    <>
      <Play aria-hidden="true" className="size-4 fill-current" />
      {CTA_LABEL[state]}
    </>
  )
  const shared = cn(
    'flex h-12 items-center justify-center gap-2 rounded-[28px] px-5 text-body-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2',
    className,
  )
  const label = `${CTA_LABEL[state]}: ${title}`

  if (to) {
    return (
      <Link to={to} aria-label={label} className={shared}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" aria-label={label} className={shared}>
      {inner}
    </button>
  )
}

/**
 * The resume state's figure and bar.
 *
 * A real `progressbar` role rather than a tinted div, so the percentage is
 * machine-readable and not left to the caption beside it. Stacked at every
 * width (label above bar, 8px between) — the Round 43 frames dropped the
 * side-by-side arrangement Home's card used above 1281.
 */
export function LessonProgress({
  title,
  minutesLeft,
  progress,
  trackClassName,
  fillClassName,
  labelClassName,
  fillStyle,
}: {
  /** Only for the bar's accessible name — the visible label is the figure. */
  title: string
  minutesLeft: number
  /** 0-1. */
  progress: number
  trackClassName: string
  fillClassName?: string
  labelClassName?: string
  fillStyle?: CSSProperties
}) {
  return (
    // Frame `787:1080`: mobile stacks the figure above a full-width bar;
    // desktop sets them in a row with a **fixed 97px** track (`787:1077`) and a
    // 16px gap. The bar is not full width on desktop — it sits beside the
    // figure, which is why the wrapper stops stretching at `lg`.
    //
    // ⚠️ `lg:justify-start` is load-bearing. `justify-center` is VERTICAL while
    // this is a column and becomes HORIZONTAL the moment `lg:flex-row` applies,
    // which centred the figure and bar in the content column and was reported
    // as the row being broken. Flipping flex-direction silently reinterprets
    // every alignment class on the same element.
    <div className="flex w-full flex-col justify-center gap-2 lg:w-auto lg:flex-row lg:items-center lg:justify-start lg:gap-4">
      <p
        className={cn(
          'text-consumer-eyebrow font-medium whitespace-nowrap lg:font-semibold',
          labelClassName,
        )}
      >
        {minutesLeft} mins left
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={`${title} progress`}
        className={cn('h-[7px] w-full overflow-hidden rounded-[24px] lg:w-[97px]', trackClassName)}
      >
        <div
          className={cn('h-full rounded-[24px]', fillClassName)}
          style={{ width: `${progress * 100}%`, ...fillStyle }}
        />
      </div>
    </div>
  )
}

/**
 * The complete chip.
 *
 * A composed disc, **not** lucide's `CircleCheck` — that draws its ring and its
 * tick in one `currentColor`, and both frames want a solid disc behind a
 * contrasting mark. Two elements is the only way to colour them independently.
 * The glyph is still lucide, which is what the standing rule is about.
 */
export function LessonCompleteChip({
  pillClassName,
  discClassName,
  checkClassName,
  labelClassName,
  label = 'Complete',
  className,
}: {
  pillClassName: string
  /** Carries the disc size too — the mobile chips draw a 24px disc and the
   *  desktop pill a 30px one (`787:1273`). */
  discClassName: string
  checkClassName: string
  labelClassName: string
  /** Mobile says "Complete", desktop "Lesson complete" — both are the frames'
   *  own wording, and each has the room its own layout gives it. */
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-[32px] py-1 pr-3 pl-1',
        pillClassName,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('flex shrink-0 items-center justify-center rounded-full', discClassName)}
      >
        <Check className={cn('size-4', checkClassName)} strokeWidth={3.5} />
      </span>
      <span className={cn('text-consumer-chip', labelClassName)}>{label}</span>
    </span>
  )
}

/**
 * The desktop treatment of the same fact — frame `787:1271`.
 *
 * **This replaced a green line.** Until Round 43's own last pass the desktop
 * frames drew `CircleCheck` + `#008302` text with no pill, which shipped mapped
 * onto the app's `success`. The updated frame makes it a `yellow-200` pill
 * carrying a 30px purple disc and `consumer-primary` text, so the desktop and
 * mobile indicators are now the same *object* in two tones rather than two
 * different treatments — which is why this renders through the same
 * `LessonCompleteChip` as the mobile chips instead of being its own component.
 *
 * The label is the frame's "Lesson complete", longer than the mobile chips'
 * "Complete" because the desktop row has the width for it.
 */
function LessonCompleteLine() {
  return (
    <LessonCompleteChip
      label="Module complete"
      pillClassName="bg-yellow-200"
      discClassName="size-[30px] bg-consumer-primary"
      checkClassName="text-white"
      labelClassName="text-consumer-primary"
    />
  )
}

/* ------------------------------------------------------------------------ */
/* The week's lesson                                                         */
/* ------------------------------------------------------------------------ */

/**
 * Frames `792:2310` / `792:2390` / `792:2429` (mobile) and `771:3741` +
 * `783:4112` (desktop).
 *
 * Mobile is a filled `consumer-primary` card with the photo bleeding to its top
 * edge; desktop splits into a bordered photo tile and a text column on the page
 * canvas, which is why every colour here is a responsive pair.
 */
export function FeaturedLessonCard({ view, to }: { view: LessonView; to?: string }) {
  return (
    <div
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-lg bg-consumer-primary shadow-card',
        // Desktop: the card stops being a card. No fill, no shadow, no clip —
        // the photo tile carries its own radius and the text sits on the canvas.
        'lg:flex-row lg:items-center lg:gap-10 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:shadow-none',
      )}
    >
      {/*
        16:9 at both widths (the frame's 682.889 x 384.125 is exactly 1920/1080).
        The desktop width is the frame's own share of its content column —
        682.889 of 1121 — as a percentage rather than a fixed px, so the tile
        keeps its proportion instead of squeezing the text column at 1024.
      */}
      {/* Round 43, direct instruction: "add shadow also to all images including
          the current lesson". `lg:` only — on mobile this photo is flush inside
          the filled card, which carries the shadow itself. */}
      <div className="aspect-[1920/1080] w-full shrink-0 overflow-hidden bg-white lg:w-[61%] lg:rounded-lg lg:border-4 lg:border-consumer-primary lg:shadow-card">
        <img src={LESSON_COVER} alt="" aria-hidden="true" className="size-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-6 lg:gap-10 lg:p-0">
        <div className="flex flex-col gap-6 lg:gap-4">
          {/* On complete the label shares a row with the chip; in the other two
              states it sits alone. `justify-between` either way, so a single
              child still starts at the left edge. */}
          <div className="flex items-start justify-between gap-4">
            {/* Round 43, direct instruction: "make the lesson of the week lesson
                number text black". The frame sets it in `consumer-primary`,
                which put three purples in one column (number, title, and the
                CTA's own fill on the previous rows). Black only from `lg` — on
                mobile this label sits on the filled purple card, where black
                would be unreadable, so it stays white there. */}
            <p className="text-consumer-lesson text-white lg:text-ink">{view.label}</p>
            {view.state === 'complete' && (
              <LessonCompleteChip
                pillClassName="bg-consumer-lesson-complete lg:hidden"
                discClassName="size-6 bg-consumer-primary"
                checkClassName="text-white"
                labelClassName="text-consumer-primary"
              />
            )}
          </div>

          <div className={cn('flex flex-col', view.state === 'resume' ? 'gap-4' : 'gap-2', 'lg:gap-1')}>
            <p className="text-consumer-card-title text-white lg:text-consumer-primary">{view.title}</p>

            {view.state === 'start' && (
              <p className="text-consumer-eyebrow text-white lg:text-ink-muted">
                ~{view.totalMinutes} mins to complete
              </p>
            )}

            {view.state === 'resume' && (
              <LessonProgress
                title={view.title}
                minutesLeft={view.minutesLeft}
                progress={view.progress}
                labelClassName="text-white lg:text-ink-muted"
                trackClassName="bg-white lg:bg-hairline"
                /* The frame's yellow gradient on the purple card; on the pale
                   desktop canvas yellow all but disappears, so the frame uses
                   flat purple there. */
                fillClassName="lg:bg-consumer-primary"
                fillStyle={{ backgroundImage: PROGRESS_FILL }}
              />
            )}

            {/* Desktop has no chip — the frames mark completion with a green
                line under the title instead. */}
            {view.state === 'complete' && (
              <span className="hidden lg:flex">
                <LessonCompleteLine />
              </span>
            )}
          </div>
        </div>

        <LessonPlayCta
          state={view.state}
          title={view.title}
          to={to}
          className="w-full bg-white text-consumer-primary focus-visible:ring-white focus-visible:ring-offset-consumer-primary lg:w-auto lg:self-start lg:bg-ink lg:text-white lg:focus-visible:ring-ink lg:focus-visible:ring-offset-consumer-canvas"
        />
      </div>
    </div>
  )
}

/**
 * The frame's yellow progress fill — `linear-gradient(91.77deg, #FFCC4D 69.75%,
 * #DEA108 122.42%)`. A literal because the palette has no two-stop gradient
 * equivalent; the stops are the yellow ramp's `yellow-300` and a darker step.
 * Kept identical to `LearningTaskCard`'s so Home and My Lessons paint the same
 * bar.
 */
const PROGRESS_FILL =
  'linear-gradient(91.766deg, rgb(255,204,77) 69.751%, rgb(222,161,8) 122.42%)'

/* ------------------------------------------------------------------------ */
/* A previous lesson                                                         */
/* ------------------------------------------------------------------------ */

/**
 * Frames `792:2454` / `792:2337` / `792:2362` (mobile) and `783:4145` /
 * `786:4187` / `786:4199` (desktop).
 *
 * The photo is **absent on mobile by design** — the frames give a previous
 * lesson a flat `purple-200` card with text only, and only bring the photo back
 * as a bordered tile on desktop. It is `hidden lg:block` rather than omitted so
 * the desktop tree needs no second component.
 */
export function PreviousLessonCard({ view, to }: { view: LessonView; to?: string }) {
  return (
    <div
      className={cn(
        'group flex w-full flex-col overflow-hidden rounded-lg bg-purple-200 shadow-card',
        'lg:flex-row lg:items-center lg:gap-8 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:shadow-none',
      )}
    >
      {/*
        326 x 250, not the frame's original 399 x 306 — Round 43, direct
        instruction: "for previous lesson cards, in desktop view, I have now
        reduced the image height down to 250px. proportionally reduce width,
        lesson of week remains same".

        The width is derived, not guessed: 399 x (250 / 306) = 325.98. Keeping
        `aspect-[399/306]` and setting only the width is what makes that exact —
        326 x 306/399 = 250.0 — so the crop is unchanged and the two numbers
        cannot drift apart the way a hand-typed pair would. The week's lesson
        tile is deliberately untouched.
      */}
      {/* Round 43, direct instruction: "for previous lesson images, change
          stroke from blue to light grey", desktop. `hairline` (#e0e0e0) — the
          app's own light-grey border token, and the same stroke the frames use
          for the progress track beside it. The week's lesson keeps the purple
          stroke, which is now the thing that marks it out as the current one. */}
      {/* Round 43, direct instruction: "when I hover over play lesson, resume
          lesson, or start lesson, also highlight the image i.e. change from grey
          to blue hex that we have."

          `group-has-[button:hover]` and not a `hover:` on the tile: the trigger
          is the CTA, not the image. `focus-visible` is carried alongside it so a
          keyboard user gets the same pairing — a hover-only affordance is
          invisible to them, and this portal's audience is the one this project
          has an explicit note about. */}
      <div className="hidden aspect-[399/306] w-[326px] shrink-0 overflow-hidden rounded-lg border-[3px] border-hairline bg-white shadow-card transition-colors group-has-[button:hover]:border-consumer-primary group-has-[button:focus-visible]:border-consumer-primary lg:block">
        <img src={LESSON_COVER} alt="" aria-hidden="true" className="size-full object-cover" />
      </div>

      {/* Frame `786:4176`: the content column is `gap-24 py-8` on desktop, and
          the block above the CTA is `gap-32` (`786:4186`). */}
      <div className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-6 lg:gap-6 lg:p-0 lg:py-2">
        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="flex items-start justify-between gap-4">
            <p className="text-consumer-lesson text-ink lg:text-ink-muted">{view.label}</p>
            {view.state === 'complete' && (
              <LessonCompleteChip
                pillClassName="bg-consumer-primary lg:hidden"
                discClassName="size-6 bg-white"
                checkClassName="text-consumer-primary"
                labelClassName="text-white"
              />
            )}
          </div>

          <div
            className={cn(
              'flex flex-col',
              // Desktop gaps are per state and come from the frames themselves:
              // 8 under a title with a progress row (`786:4178`), 12 under one
              // with the green complete line (`787:1052`).
              view.state === 'resume' ? 'gap-4 lg:gap-2' : 'gap-2',
              view.state === 'complete' && 'lg:gap-3',
            )}
          >
            {/* A previous lesson's title is a flat 22 at **both** widths
                (`786:4179`), where the week's lesson grows 22 -> 28. That is a
                real distinction in the frames — the featured card is louder —
                so it takes its own flat step rather than borrowing the clamp. */}
            <p className="text-consumer-card-title-sm text-ink lg:text-consumer-primary">
              {view.title}
            </p>

            {view.state === 'start' && (
              <p className="text-consumer-eyebrow text-ink lg:text-ink-muted">
                ~{view.totalMinutes} mins to complete
              </p>
            )}

            {view.state === 'resume' && (
              <LessonProgress
                title={view.title}
                minutesLeft={view.minutesLeft}
                progress={view.progress}
                labelClassName="text-ink lg:text-ink-muted"
                trackClassName="bg-purple-300 lg:bg-hairline"
                fillClassName="bg-consumer-primary"
              />
            )}

            {view.state === 'complete' && (
              <span className="hidden lg:flex">
                <LessonCompleteLine />
              </span>
            )}
          </div>
        </div>

        <LessonPlayCta
          state={view.state}
          title={view.title}
          to={to}
          className="w-full bg-consumer-primary text-white focus-visible:ring-consumer-primary focus-visible:ring-offset-purple-200 lg:w-auto lg:self-start lg:bg-ink lg:text-white lg:focus-visible:ring-ink lg:focus-visible:ring-offset-consumer-canvas"
        />
      </div>
    </div>
  )
}
