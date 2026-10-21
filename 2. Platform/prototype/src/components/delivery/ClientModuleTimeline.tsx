import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Download, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CONSUMER_MODULES, consumerModuleCover } from '@/data/spaces'
import { MINUTES_PER_SLIDE } from '@/components/consumer/lessons'
import { previewPercent, useAllPreviewProgress } from '@/data/coachModulePreview'

/**
 * Resources → Client modules: the six modules a client works through, one per
 * week, as a vertical timeline (Figma "Mock D · Weekly timeline, one card
 * open", `4422:10130`, Coach page section 13).
 *
 * **One card open at a time.** Week 1 is open on arrival; opening another
 * closes it, and "Hide details" closes the open one so all six can be scanned
 * (direct instruction, 2026-10-21).
 *
 * **The rail follows the cards.** Each row is a flex row whose rail line is
 * `flex-1`, so it is always exactly as tall as its card. The card's height
 * change is a real `height` animation on the details block — not a `layout`
 * transform, which would scale the line rather than lengthen it — so the line
 * grows and shrinks with the card on every frame.
 *
 * Every fact is read from the curriculum, never written: titles and covers
 * from `CONSUMER_MODULES`, minutes from the client portal's own
 * `MINUTES_PER_SLIDE` estimate, and the unlock / catch-up wording from the
 * SPACES rule (Module 1 opens after the planning session; Module N+1 opens
 * once catch-up session N is done; catch-up N covers Module N).
 */

/** Ease in-out (direct instruction: "the hide and show has a motion ease
 *  in-out movement", then "further smoothen out the motion").
 *
 *  A gentle in-out curve over 0.5s — the earlier 0.35s on a steep curve
 *  (0.65, 0, 0.35, 1) read as a snap. Height, cover width and every CSS
 *  property that changes with the state (padding, gaps, the title's size,
 *  the node fill) share this one duration and curve, so nothing in the card
 *  arrives before the rest of it.
 *
 *  The fade is staged on top: content fades in a little after the height has
 *  started opening, and fades out quickly on close, so text never shows
 *  squashed inside a box that is still growing or already shrinking. */
const EASE = [0.45, 0, 0.55, 1] as const
const DURATION = 0.5
const EASE_CSS = `cubic-bezier(${EASE.join(',')})`
/** Inline so a CSS transition and its framer-motion partner cannot drift. */
const CSS_MOTION = { transitionDuration: `${DURATION}s`, transitionTimingFunction: EASE_CSS }

/** Cover: 240px wide, the card's full height — Figma Mock D's own box
 *  (direct instruction, 2026-10-21: "I preferred the image dimension from
 *  previous mock D version"). */
const COVER_WIDTH = 240
/** 24px between the cover and the info column — part of the cover's animated
 *  width, so the gap opens with it rather than sitting empty beforehand. */
const COVER_GAP = 24

function unlocksAfter(n: number) {
  return n === 1 ? 'After the planning session' : `After catch-up session ${n - 1}`
}

export function ClientModuleTimeline() {
  const idBase = useId()
  // Coming back from a preview reopens THAT module's card, so the progress
  // just made is in view; otherwise Week 1, as before.
  const location = useLocation()
  const returnedFrom = (location.state as { openModule?: string } | null)?.openModule
  const [openIndex, setOpenIndex] = useState<number | null>(() => {
    const i = CONSUMER_MODULES.findIndex((m) => m.id === returnedFrom)
    return i >= 0 ? i : 0
  })
  const previews = useAllPreviewProgress()
  const previewLinkId = (moduleId: string) => `${idBase}-preview-${moduleId}`

  // Back from a preview, focus lands on that module's Preview / Resume link
  // rather than on <body> (the route change unmounts the control that was
  // pressed — this project's most-repeated defect). Once, on arrival.
  useEffect(() => {
    if (!returnedFrom) return
    const el = document.getElementById(previewLinkId(returnedFrom))
    el?.focus({ preventScroll: true })
    el?.scrollIntoView({ block: 'center' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const reduceMotion = useReducedMotion()
  const still = { duration: 0 }
  const size = reduceMotion ? still : { duration: DURATION, ease: EASE }
  // Staged fade: in after the box has begun opening, out before it closes.
  const fadeIn = reduceMotion ? still : { duration: DURATION * 0.7, ease: EASE, delay: DURATION * 0.25 }
  const fadeOut = reduceMotion ? still : { duration: DURATION * 0.4, ease: EASE }


  return (
    <ol className="flex flex-col" aria-label="Client modules, week by week">
      {CONSUMER_MODULES.map((mod, i) => {
        const n = i + 1
        const open = openIndex === i
        const last = i === CONSUMER_MODULES.length - 1
        const detailsId = `${idBase}-details-${n}`
        const minutes = Math.round(mod.slideCount * MINUTES_PER_SLIDE)
        const preview = previews[mod.id]
        const pct = previewPercent(preview)
        // Resume only for a preview left part-way; a finished one starts over.
        const resumable = !!preview && !preview.complete

        return (
          <li key={mod.id} className="flex min-w-0 gap-6">
            {/* Rail: a 40px node, then a 2px `purple-200` line filling the rest
                of the row. Filled when open, outlined when closed (frame). */}
            <div aria-hidden="true" className="flex w-10 shrink-0 flex-col items-center">
              <span
                className={cn(
                  // Decorative rail node, not a control. button-guard-ignore
                  'flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-body-md transition-colors',
                  open ? 'bg-primary text-white' : 'bg-white text-primary',
                )}
                style={CSS_MOTION}
              >
                {n}
              </span>
              {!last && <span className="w-0.5 flex-1 bg-purple-200" />}
            </div>

            <div className={cn('min-w-0 flex-1', !last && 'pb-4')}>
              <div
                className={cn(
                  // `group` drives the collapsed hover. `relative` anchors the
                  // closed card's full-card hit area (the toggle's `after`).
                  'group @container relative flex rounded-lg border border-parchment bg-white px-6 transition-[padding,box-shadow,border-color]',
                  open ? 'py-6 shadow-card' : 'py-5',
                  // Collapsed hover (direct instruction): the outline turns
                  // `purple-200` and the card lifts onto the same warm shadow an
                  // open card carries. Both are measured state changes against
                  // the white card, unlike a faint tint.
                  !open && 'hover:border-purple-200 hover:shadow-card',
                )}
                style={CSS_MOTION}
              >
                {/* Cover, left. Its WIDTH animates (0 → 240 + the 24px gap), so
                    the info column slides right as it arrives instead of the
                    image popping in. Hidden below a 560px card, where 240px of
                    art would leave the text a sliver.

                    **240px wide, the card's full height, centred** (Mock D's
                    box): `self-stretch` makes it as tall as the info column and
                    `object-cover object-center` fills it from the middle of the
                    art. The image is `absolute`, so it never props the card
                    open — a closing card used to hold its height until the
                    cover unmounted, then drop ~90px in one frame. */}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="cover"
                      className="relative hidden shrink-0 self-stretch overflow-hidden @[560px]:block"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: COVER_WIDTH + COVER_GAP, opacity: 1, transition: { width: size, opacity: fadeIn } }}
                      exit={{ width: 0, opacity: 0, transition: { width: size, opacity: fadeOut } }}
                    >
                      <img
                        src={consumerModuleCover(mod.id)}
                        alt=""
                        className="absolute inset-y-0 left-0 h-full rounded-sm object-cover object-center"
                        style={{ width: COVER_WIDTH }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className={cn('flex min-w-0 flex-1 flex-col transition-[padding]', open ? 'py-2' : 'py-0')}
                  style={CSS_MOTION}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn('flex min-w-0 flex-1 flex-col transition-[gap]', open ? 'gap-4' : 'gap-2')}
                      style={CSS_MOTION}
                    >
                      {/* `caption-medium` (14/500), per the updated frame. */}
                      <p className="text-caption-medium text-primary">
                        Week {n}
                        <span aria-hidden="true">&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                        <span className="sr-only">, </span>
                        Module {n}
                      </p>
                      {/* 16/600 closed → 20/500 open (frame). The size and
                          weight transition with the card, so the title grows
                          rather than jumping a step. */}
                      <h3
                        className={cn(
                          'text-balance text-ink transition-[font-size,line-height,font-weight]',
                          open ? 'text-title' : 'text-body-md',
                        )}
                        style={CSS_MOTION}
                      >
                        {mod.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={detailsId}
                      onClick={() => setOpenIndex(open ? null : i)}
                      className={cn(
                        // `min-h-9`: the 36px control floor (`layoutAudit()`
                        // measured 17px). `-my-2.5` takes the extra 19px back
                        // out of the row, so the card keeps the frame's height.
                        '-my-2.5 inline-flex min-h-9 shrink-0 items-center self-start rounded-xs text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring',
                        // Closed: the whole card is the hit area, so the
                        // hover state is honest — anywhere it lights up, a
                        // click opens it.
                        !open && "self-center after:absolute after:inset-0 after:rounded-lg after:content-[''] group-hover:underline",
                      )}
                    >
                      {open ? 'Hide details' : 'Show details'}
                      <span className="sr-only">: {mod.title}</span>
                    </button>
                  </div>

                  {/* Details. A real height animation (0 ↔ auto), so the row —
                      and with it the rail line — grows with the card. */}
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="details"
                        id={detailsId}
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, transition: { height: size, opacity: fadeIn } }}
                        exit={{ height: 0, opacity: 0, transition: { height: size, opacity: fadeOut } }}
                      >
                        <div className="flex flex-col gap-8 pt-1">
                          {/* 24px between the minutes/progress row and the instructions (direct instruction). */}
                          <div className="flex flex-col gap-6">
                            {/* One row: the bar sits after "About N minutes"
                              (direct instruction), wrapping under it only if
                              the card is too narrow for both. */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <p className="text-caption text-ink-muted">About {minutes} minutes</p>
                              {/* The coach's own progress through the preview
                                  (direct instruction), once they have opened
                                  it: bar, with the % on the right. The player's
                                  top bar reads the same `previewPercent`. */}
                              {preview && (
                                <div className="flex items-center gap-3">
                                  <div
                                    role="progressbar"
                                    aria-valuenow={pct}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`Your preview of ${mod.title}`}
                                    // 96px (direct instruction: "reduce progress
                                    // bar width"), down from a 320px stretch.
                                    className="h-1.5 w-24 overflow-hidden rounded-full bg-purple-50"
                                  >
                                    {/* Green once finished (direct instruction):
                                        `success` #1f7d37, the semantic token,
                                        on both the fill and the 100%. */}
                                    <div
                                      className={cn('h-full rounded-full', preview.complete ? 'bg-success' : 'bg-primary')}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <p className={cn('shrink-0 text-caption-medium', preview.complete ? 'text-success' : 'text-ink')}>
                                    {pct}%
                                  </p>
                                </div>
                              )}
                            </div>
                            {/* Module-builder style instructions: label / value
                                pairs in a real `<dl>`. */}
                            {/* Labels `body-md` (16/600), values `body` (16/400) —
                                direct instruction; labels in `ink` black (also
                                direct instruction). The pair is the module
                                builder's own 16px pair. The label column sizes
                                to its widest label (`auto`) with a 12px gap —
                                a fixed 128px left a visible hole after
                                "Unlocks:" (direct instruction: reduce the gap).
                                `items-baseline`: the two type steps have
                                different line heights, so top-aligned rows sat
                                a few px off each other. */}
                            <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5">
                              <dt className="text-body-md text-ink">Unlocks:</dt>
                              <dd className="text-body text-ink-muted">{unlocksAfter(n)}</dd>
                              <dt className="text-body-md text-ink">Talk about it:</dt>
                              <dd className="text-body text-ink-muted">In catch-up session {n}</dd>
                            </dl>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Opens the client's own module player in its coach
                                mode. "Resume module" once a preview has been left
                                part-way, which reopens it where the coach left. */}
                            <Button
                              id={previewLinkId(mod.id)}
                              render={<Link to={`/delivery/resources/modules/${mod.id}`} />}
                            >
                              <Play aria-hidden="true" className="size-6" strokeWidth={1.75} />
                              {resumable ? 'Resume module' : 'Preview module'}
                            </Button>
                            {/* The module's one-pager, after Preview (direct
                                instruction). "Download the resource" is the
                                client summary screen's own wording (CLAUDE.md
                                terminology). No file exists yet — the client's
                                button is unwired too — so this is the
                                unwired-control treatment: focusable,
                                `aria-disabled`, "(coming soon)". */}
                            <Button
                              variant="secondary"
                              aria-disabled="true"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Download aria-hidden="true" className="size-6" strokeWidth={1.75} />
                              Download the resource
                              <span className="sr-only"> (coming soon)</span>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
