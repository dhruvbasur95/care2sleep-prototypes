import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * `SlideLayout` — the one canonical shell every module-player slide is
 * built from (design-tokens.md §30, Round 7.1.2). Every prior screen
 * (`ModuleIntroScreen`, `ChapterLearnScreen`, `CaseExampleScreen`, etc.) hand
 * -rolled its own copy of the same `mx-auto max-w-[...] px-6 py-10` wrapper
 * plus an eyebrow/`<h1>`/body block, each with tiny inconsistencies. This
 * component is that wrapper, written once — **every new slide should start
 * from `SlideLayout`, not from a fresh hand-rolled `<div>`.**
 *
 * ## The "whole slide is the canvas" rule
 * A slide's content sits directly on the page background — it is never
 * wrapped in an additional bounding box (a `Card`, a ring, a shadow) purely
 * to contain it. Individual elements *within* a slide (a video thumbnail,
 * a divider between list rows) can still look like distinct objects, but
 * the slide as a whole is not itself "a card sitting on a page" — the page
 * background *is* the slide.
 *
 * ## Two variants, not a free-form prop bag
 * - **`standard`** (default) — top-aligned, `max-w-[720px]`. Used by every
 *   content slide (intro, Learn, case examples, knowledge check, what-to-
 *   expect, outro).
 * - **`centered`** — vertically centered, `max-w-[560px]`, for the player's
 *   short transitional "punctuation" beats only (chapter marker, chapter
 *   complete, module complete) — screens that are a heading + one line of
 *   body copy and nothing else. Reach for `standard` unless a screen is
 *   genuinely one of those three transitional beats.
 *
 * ## What this does NOT own
 * `SlideLayout` renders the slide's heading block and hands off to
 * `children` for the type-specific body (a video, a reveal-on-tap case, a
 * knowledge-check question). It does not render a Continue button — that
 * is `ModulePlayerFooter`'s job, driven by the current step's own
 * `onReadyChange` report (see that component's doc comment). A slide may
 * still render its *own* local, non-advancing controls inside `children`
 * (e.g. knowledge-check's "Next question", a case's "What would you do?"
 * reveal) — those are sub-navigation within one step, not advancement to
 * the next one, and stay local to the screen.
 *
 * ## Focus management + heading structure (accessibility-review fix)
 * Every visited slide stays mounted (the player's vertical scroll-stack —
 * see `ModulePlayerPage.tsx`), so a sighted user sees the page scroll to
 * reveal new content, but nothing told a keyboard/screen-reader user the
 * same thing: focus simply reverted to `<body>` once the control that
 * triggered the change (a "Continue"/"Next question" button belonging to
 * old, now-scrolled-past content) unmounted or changed shape. This
 * component now moves focus to its own heading whenever `title` changes —
 * which covers both cases that need it: a brand-new `SlideLayout` mounting
 * for a new outer step, and one long-lived instance's `title` changing
 * internally (knowledge-check's 5 questions, all one step).
 *
 * Only the **current** slide should ever grab focus this way, or a stale,
 * already-completed slide re-rendering for an unrelated reason could steal
 * it back — pass `isCurrent={false}` for every slide behind the active
 * one. That same flag also demotes the heading to `<h2>`: with every
 * visited slide mounted at once, rendering all of them as `<h1>` would
 * leave a screen reader's heading list full of equally-ranked "page
 * titles" with no way to tell which one is actually current. Exactly one
 * `<h1>` — the active slide's — keeps the outline meaningful.
 */
export function SlideLayout({
  eyebrow,
  title,
  body,
  variant = 'standard',
  isCurrent = true,
  children,
}: {
  eyebrow?: string
  title: string
  body?: string
  variant?: 'standard' | 'centered'
  /** Whether this is the active slide (vs. an already-completed one still
   *  mounted above it). Defaults to `true` for standalone/one-off uses of
   *  this component outside the player's stacked-slide context. */
  isCurrent?: boolean
  children?: React.ReactNode
}) {
  const centered = variant === 'centered'
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (isCurrent) headingRef.current?.focus()
  }, [title, isCurrent])

  const Heading = isCurrent ? 'h1' : 'h2'

  return (
    <div
      className={cn(
        'mx-auto flex h-full flex-col px-6 py-10 md:px-8',
        // Frame `665:1013`: a 656px column, centred in the content area. It is
        // now centred *vertically* too — the player shows one slide at a time
        // and no longer scrolls a stack, so a fixed top inset left every short
        // slide sitting high with dead space under it.
        centered ? 'max-w-[560px] text-center' : 'max-w-[656px]',
      )}
    >
      {/* `my-auto` rather than `justify-center`: it centres a slide that fits
          and, unlike centred flex content, does not push the top of a taller
          slide out of reach of the scroll container above. */}
      <div className="my-auto w-full">
        {/* Frame `665:1014`: `fine` in sentence case, not the uppercase
            tracked eyebrow this slide used before. */}
        {eyebrow && <p className="text-fine text-ink-faint">{eyebrow}</p>}
        <Heading
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 font-display text-display-md outline-none"
        >
          {title}
        </Heading>
        {body && (
          <p
            className={cn(
              'mt-3 text-caption leading-[1.3] text-ink-faint',
              centered && 'text-body text-ink-muted',
            )}
          >
            {body}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
