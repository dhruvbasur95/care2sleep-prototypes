import { useState } from 'react'
import { Check } from 'lucide-react'
import { type ConsumerDyad } from '@/data/spaces'
import { cn } from '@/lib/utils'
import { LessonPlayCta, LessonProgress } from './LessonCards'
import { releasedLessons, type LessonState } from './lessons'

/**
 * The lesson card — Figma frames `787:1156` (start), `787:1185` (resume) and
 * **`787:1438` (complete)**, plus `787:1286` for every mobile value. One card
 * with three states rather than the single state it shipped as before.
 *
 * Frame measurements — mobile (`787:1286`) -> desktop, transcribed:
 *   card        `consumer-primary` fill, 16px radius, `parchment` stroke, Card shadow
 *   cover       192px at both, full bleed to the card's own edge
 *   body        px 16 / py 24  ->  px 32 / pt 32 / pb 40
 *   body gap    24  ->  40 between the content block and the CTA
 *   content     32 between the eyebrow row and the title block; 8 inside it
 *   eyebrow     16 -> 18 / 400 at 1.4     lesson line  18 -> 20 / 500 at 1.3
 *   title       24 -> 28 / 500 at normal  chip label   14 -> 18 / 600 at 1.4
 *   progress    264x10 track, 143px fill, 24px radius, the frame's yellow gradient
 *   CTA         full width to 1280, then the frame's 256px; 48 tall, radius 28
 *
 * Every type step above is **one class**, not a `md:` pair — the sizes are
 * `clamp()`s interpolating between these two frames. See `consumer-tokens.css`.
 *
 * ── The play button is the state trigger ──────────────────────────────────
 *
 * Direct instruction: "make play lesson button as the trigger to show Start, in
 * process, completed states on loop." So the CTA advances start -> resume ->
 * complete -> start, and the card is the only thing on this page that changes.
 *
 * This is a **review tool, not product chrome** — the same category as
 * `CoachStageSwitcher`, and it should be deleted the moment a real consumer
 * module player exists to link to. It is not persisted and resets on reload.
 * Its one real merit beyond demoing the states: this CTA used to be a focusable
 * `aria-disabled` button that did nothing, and a control that does something is
 * a better answer than a control that admits it does not.
 *
 * ── Two places the frames disagree, and what shipped ──────────────────────
 *
 * 1. **The resume state's two progress figures do not agree with each other.**
 *    `787:1185` draws the bar at 143/264 = 54% and captions it "~10 mins left",
 *    but 54% of a 15-minute lesson leaves ~7 minutes, not 10. Rather than
 *    reproduce a card that contradicts itself, both numbers derive from one
 *    `DEMO_PROGRESS` — the bar keeps the frame's own geometry (it is the visual
 *    design, which is what this project copies from a frame) and the caption is
 *    computed from it. The card therefore reads "~7 mins left".
 *
 * 2. **The complete state was redesigned, and the earlier read was wrong.**
 *    An earlier pass built `787:1201` — a translucent white chip beside the
 *    lesson number — and flagged the green-chip variant embedded in the page
 *    frame as the stale one. It was the other way round: `787:1201` is gone from
 *    the handover and `787:1438` is the state, with the bright green
 *    `consumer-lesson-complete` chip top-right sharing a row with the eyebrow.
 *    The page frame's own embedded copy (`787:1241`) agrees with it apart from a
 *    trailing "Lesson completed" caption, which `787:1438` drops and so does
 *    this. The white-chip contrast fix that pass made is therefore moot — the
 *    green chip carries purple text at a measured 9.83:1.
 */

/** Frame `787:1196`/`787:1197` — the fill is 143px of a 264px track. */
const DEMO_PROGRESS = 143 / 264


/** start -> resume -> complete -> start. */
const NEXT: Record<LessonState, LessonState> = {
  start: 'resume',
  resume: 'complete',
  complete: 'start',
}

/**
 * The frame's yellow progress fill — `linear-gradient(90.93deg, #FFCC4D 69.75%,
 * #DEA108 122.42%)`. Written as a literal rather than a token because it is a
 * two-stop gradient at a specific angle, which the palette has no equivalent
 * for; the two stops are the yellow ramp's own `yellow-300` and a darker step.
 */
const PROGRESS_FILL =
  'linear-gradient(90.93deg, rgb(255,204,77) 69.75%, rgb(222,161,8) 122.42%)'

export function LearningTaskCard({ dyad }: { dyad: ConsumerDyad }) {
  const [state, setState] = useState<LessonState>('start')

  // The week's lesson comes from the **shared** helper, which is what My
  // Lessons features at the top of its own page. Round 43: this used to pick
  // "the first module not yet completed" inline, and the two pages named
  // different lessons as this week's — one fact, two answers, which is this
  // project's most-repeated data bug. It also inherited the pre-module, so it
  // could render "Getting started"; consumer lessons now start at Lesson 1.
  const view = releasedLessons(dyad)[0]

  // A consumer with nothing released yet has no card to show.
  if (!view) return null

  const lessonLabel = view.label
  const current = { title: view.title }
  const totalMinutes = view.totalMinutes
  const minutesLeft = Math.max(1, Math.round(totalMinutes * (1 - DEMO_PROGRESS)))

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-parchment bg-consumer-primary shadow-card">
      {/*
        Frame `787:1157`. The frame positions the photo absolutely at
        `h-[581.18%] top-[-122.78%]`, which reproduces its natural aspect at the
        frame's own 744px width — but ties the image's height to the *container's*
        height, so it distorts the moment the card narrows. `object-cover` with
        the frame's own crop centre is the same picture at 744px and stays
        undistorted at every other width.

        29.7% is where the frame's visible band actually sits: it shows y 235.7 ->
        427.7 of a 1115.9px-tall image, whose centre is 331.7 / 1115.9.
      */}
      <img
        src="/illustrations/consumer-home/lesson-cover.jpg"
        alt=""
        aria-hidden="true"
        className="h-[192px] w-full shrink-0 object-cover"
        style={{ objectPosition: 'center 29.7%' }}
      />

      {/* Frame `787:1507` (mobile) vs `787:1440` (desktop): the body padding
          steps 16/24 -> 32/32/40 and the gap under the content 24 -> 40. */}
      <div className="flex flex-1 flex-col gap-6 px-4 pt-6 pb-6 sm:gap-10 sm:px-8 sm:pt-8 sm:pb-10">
        <div className="flex flex-col gap-8">
          {/*
            The eyebrow is **state-dependent**, and that is the frames' own
            reading rather than drift between them: `787:1156` and `787:1185`
            both say "Complete this week's lesson" while the lesson is still
            outstanding, and `787:1438` says "This week's lesson" once it is
            done — an instruction stops being an instruction after it has been
            followed. The mobile frame `787:1510` agrees.

            On complete the eyebrow shares a `justify-between` row with the
            chip (`787:1442`); in the other two states it sits alone.
          */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-consumer-eyebrow text-white">
              {state === 'complete'
                ? "This week's lesson"
                : "Complete this week's lesson"}
            </p>

            {state === 'complete' && (
              <span className="flex shrink-0 items-center gap-1 rounded-[32px] bg-consumer-lesson-complete py-1 pr-3 pl-1">
                {/*
                  A composed disc, **not** lucide's `CircleCheck`.

                  `CircleCheck` draws its circle and its tick with one
                  `currentColor` stroke, so the only way to get a white tick is
                  a white circle outline with it — and the frame has no ring, it
                  is a solid purple disc with a white check ("there is no white
                  outline stroke"). Two elements is the only way to colour the
                  disc and the mark independently. The glyph is still lucide,
                  which is what the standing rule is actually about.
                */}
                <span
                  aria-hidden="true"
                  className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-consumer-primary"
                >
                  <Check className="size-4 text-white" strokeWidth={3.5} />
                </span>
                <span className="text-consumer-chip text-consumer-primary">Lesson complete</span>
              </span>
            )}
          </div>

          {/*
            Round 43, direct instruction: "I have changed the spacing for when
            the card is in progress for mobile view. check that and streamline
            home cards also."

            Frame `792:2390` ("Lesson of week Resume") redraws this card and
            changes two things about the resume state, both applied here:

              - the gap under the title is **16**, not the 8 the other two
                states use (`gap-4` vs `gap-2`), so the progress block reads as
                its own thing rather than as a third line of the title;
              - the figure sits **above** a full-width bar at every width. This
                card previously went side-by-side above 1281 with a fixed 264px
                track. The new frame drops that arrangement, so it goes.
          */}
          <div className={cn('flex flex-col', state === 'resume' ? 'gap-4' : 'gap-2')}>
            <p className="text-consumer-lesson text-white">{lessonLabel}</p>

            <p className="text-consumer-card-title text-white">{current.title}</p>

            {state === 'start' && (
              <p className="text-caption text-parchment">~{totalMinutes} mins to complete</p>
            )}

            {/* This comment sits OUTSIDE the conditional deliberately: a JSX
                comment placed between the `&&` and its element is child syntax
                in an expression position and does not parse — the same family
                of trap Round 23 hit inside an attribute list. */}
            {state === 'resume' && (
              <LessonProgress
                title={current.title}
                minutesLeft={minutesLeft}
                progress={DEMO_PROGRESS}
                labelClassName="text-white"
                trackClassName="bg-white"
                fillStyle={{ backgroundImage: PROGRESS_FILL }}
              />
            )}
          </div>
        </div>

        {/* The demo state trigger. Focus stays on this button across a state
            change because it never unmounts — the one thing that would have made
            this this project's most-repeated defect. */}
        <LessonPlayCta
          state={state}
          title={current.title}
          onClick={() => setState(NEXT[state])}
          className="mt-auto w-full bg-white text-consumer-primary focus-visible:ring-white focus-visible:ring-offset-consumer-primary min-[1281px]:w-64"
        />

        {/* The card's content changes under a button whose own label also
            changes; without this a screen-reader user gets the new label and no
            indication that the lesson's state moved with it. */}
        <span role="status" aria-live="polite" className="sr-only">
          {state === 'start' && `${lessonLabel} not started. About ${totalMinutes} minutes.`}
          {state === 'resume' && `${lessonLabel} in progress. About ${minutesLeft} minutes left.`}
          {state === 'complete' && `${lessonLabel} complete.`}
        </span>
      </div>
    </div>
  )
}
