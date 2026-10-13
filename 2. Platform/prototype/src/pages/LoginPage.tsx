import { useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Care2SleepLogo } from '@/components/shared/Care2SleepLogo'
import { UserTypeGlyph, type UserTypeGlyphName } from '@/components/login/UserTypeGlyph'
import { LoginHeroBand } from '@/components/login/LoginHeroBand'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { Button } from '@/components/ui/button'

/**
 * The app's front door — Figma frame `4184:43030` ("Login screen"), replacing
 * `PortalSwitcherPage`.
 *
 * ── What this screen is, and what it is not ───────────────────────────────
 *
 * It is step 1 of a four-step sign-in: **select user type -> enter email ->
 * enter verification code -> dashboard**. Only step 1 has a frame, so only step
 * 1 is built. `Continue` therefore routes straight into the chosen portal
 * (direct instruction, 2026-10-12: *"I will tell you, this is next step for now
 * wire directly"*). The email and code screens slot in front of that
 * `navigate()` without touching anything else here.
 *
 * What it replaces was never a login at all: a plain three-tile portal
 * switcher with no notion of who you are. Every "Switch portal" and "Sign out"
 * in the app already lands on `/`, so they now land here, which is the first
 * time those two controls have meant what they say.
 *
 * ── The frame, transcribed ───────────────────────────────────────────────
 *
 *   canvas       linear-gradient(to left, #fffcfa 25.621%, #fff8e5 55.723%)
 *                — `--background` warming into `yellow-50`
 *   header       72px white bar, `shadow-card`, 80px side padding, wordmark
 *                137.1 x 34 and nothing else (the account cluster is hidden on
 *                the frame's own instance — nobody is signed in yet)
 *   columns      left `flex-1` (724 at 1512) + right a fixed 788
 *   right pad    80 side / 140 top
 *   heading      display-lg (40/500) -> 8 -> sub-greeting (18/500/1.4)
 *   -> 48 ->     three `flex-1` tiles, `gap-24`, square, radius 16,
 *                label 16 below at sub-greeting, centred
 *   -> 48 ->     full-width 48px CTA, radius 28
 *
 * Colours are the file's own styles: `Purple/50` `#f3efff` resting,
 * `Purple/200` `#e4d6ff` raised, `Purple/500` `#3a00ad` for the chosen label
 * and stroke, `neutral/black` `#1a1a1a` for the rest of the type.
 *
 * ── Three places this deliberately departs from the frame ────────────────
 *
 * 1. **Two copy fixes** (direct instruction): tiles 2 and 3 read "I'am" in the
 *    frame, and the heading reads "Care to Sleep" directly beneath a wordmark
 *    that reads "Care2Sleep". Both corrected here.
 * 2. **The tiles carry a glyph the frame does not draw.** They were empty on
 *    purpose up to 2026-10-12 — placeholders for artwork that had not been
 *    drawn — and now hold a 96px lucide-derived glyph each, with motion on
 *    hover and focus. `components/login/UserTypeGlyph.tsx` is the spec, and
 *    its header is where the "these are exceptions, not the icon package"
 *    instruction is recorded. The layout did not move to accommodate them:
 *    the square was already the right size and already centres.
 * 3. **Everything below 1200px is derived**, because the frame is 1512 only.
 *    See the `min-[1200px]` note below.
 *
 * ── The three tile states ────────────────────────────────────────────────
 *
 * The frame draws the consumer tile hovered, which is how the hover paint is
 * known at all. Chosen is the user's own call (2026-10-12: *"in selected state
 * show outline stroke p500"*):
 *
 * | state | tile | label |
 * |---|---|---|
 * | rest    | `purple-50` + a 1px INSET `purple-300` outline | `ink` |
 * | hover   | `purple-200` + `shadow-card-raised`, no outline | `primary` |
 * | chosen  | the hover paint + a 2px `primary` outline | `primary` |
 *
 * Every one of the three is an `outline`, never a `border`: a border would eat
 * its own width off a square whose size is the whole point, so the tiles would
 * twitch as the choice moved between them.
 *
 * The resting outline is a later addition (direct instruction, 2026-10-12:
 * *"while in static/default state, add outline of p300 1px inside"*) and the
 * word **inside** is the load-bearing part — it is `-outline-offset-1`, so the
 * hairline sits within the 193px square rather than around it. At offset 0 the
 * tile would measure 195px at rest and 193px on hover, and the row would
 * breathe every time the pointer crossed it.
 *
 * ⚠️ The chosen state therefore has to reset the offset explicitly
 * (`peer-checked:outline-offset-0`). Tailwind's offset utility is not part of
 * the width utility, so without that line the 2px `primary` outline would
 * inherit the resting -1px inset and sit a pixel inside the edge.
 */

/**
 * ⚠️ EVERY `min-[1200px]:` in this file is ONE decision and they must move
 * together — below it the artwork is hidden and the right-hand column goes full
 * width; above it the two columns are the frame's own `flex-1` + a fixed 788.
 * Four call sites, same number, same reason. The identical note is on
 * `ConsumerHeader`, whose switch this is deliberately the same as.
 *
 * **1200 is not a number picked for this page.** The arithmetic agrees with the
 * portal's existing choice: the right column is a fixed 788, so at 1200 the
 * artwork still gets 412px — enough for the blob and most of the pillow. Much
 * below that and the left column is a sliver of purple, which reads as a
 * rendering fault rather than as a design.
 *
 * ⚠️ **It is written out longhand at each site, and must stay that way.** The
 * first cut of this file hoisted it to a `BREAKPOINT` constant and built the
 * classes as `` `${BP}:px-20` ``. That compiles, typechecks, lints and puts the
 * right class in the DOM — and emits **no CSS at all**, because Tailwind v4
 * scans source *text* for literal class names and `min-[1200px]:px-20` never
 * appears in it. Measured: the page rendered in its own sub-1200 layout at a
 * 1512px viewport, with no error anywhere. Same family of failure as the
 * arbitrary-property traps this project has already paid for twice; a constant
 * is not worth it.
 */

/**
 * The three audiences, in the frame's own order, each with where `Continue`
 * takes it.
 *
 * A list rather than three hand-written blocks: they are the same control three
 * times and the only thing that differs is two strings. `id` is also the radio
 * group's value, so the selected state is one string of component state.
 *
 * The wording is this project's, not a description of a role — "I'm a care
 * partner, or supported by one" is how the consumer audience is addressed
 * everywhere in their own portal, and neither "consumer" nor "client" appears
 * on a screen that has not yet worked out which one the reader is.
 *
 * ⚠️ The non-breaking spaces in "or\u00a0a\u00a0coach" and "or\u00a0an\u00a0admin"
 * are load-bearing, not typos, and the frame does not have them.
 *
 * At the tile's 193px every label wraps to two lines, and where it wraps is the
 * whole of the design. Left to itself the browser breaks tile 2 after "or a",
 * stranding "coach" alone — the orphan this project's copy rule forbids. Both
 * alternatives (the frame's own "I am a trainee or / a coach", and the
 * balanced "I am / a trainee or a coach") were built and shown; the instruction
 * was *"move or to next line before a coach"*, then *"this is fine, or a coach
 * in next line"*. Binding "or a coach" into one unbreakable run is what puts
 * the whole phrase on line 2 — a `<br>` would do it too, but only at exactly
 * this width, and these tiles are `flex-1`.
 *
 * Tile 3 then followed the same shape on instruction (*"do same for researcher
 * or an admin"*), which is also a copy change: the frame reads "I am a
 * researcher/admin" and this reads "I am a researcher / or an admin". Tile 1
 * wraps correctly unaided and carries no mark. See also the note on why
 * `text-balance` is deliberately absent here.
 */
const USER_TYPES: { id: string; label: string; to: string; glyph: UserTypeGlyphName }[] = [
  {
    id: 'consumer',
    label: "I'm a care partner, or supported by one",
    to: '/consumer',
    glyph: 'care-partner',
  },
  { id: 'coach', label: 'I am a trainee or\u00a0a\u00a0coach', to: '/delivery', glyph: 'coach' },
  {
    id: 'researcher',
    label: 'I am a researcher or\u00a0an\u00a0admin',
    to: '/research',
    glyph: 'researcher',
  },
]

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

/**
 * `1200` is this file's one breakpoint and it is written out longhand
 * everywhere else; here it has to be a number because the page background is
 * an inline style and inline styles cannot carry a media query.
 *
 * `useSyncExternalStore` rather than `useState` + an effect: the first paint
 * then has the right value instead of flashing the desktop gradient on a
 * phone for one frame.
 */
const DESKTOP_QUERY = '(min-width: 1200px)'

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP_QUERY)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [chosen, setChosen] = useState<string | null>(null)
  const isDesktop = useIsDesktop()

  const destination = USER_TYPES.find((t) => t.id === chosen)?.to

  return (
    <div
      className="flex min-h-screen flex-col"
      /*
       * An inline `linear-gradient` over a Tailwind arbitrary value, on
       * purpose. The stops are the frame's own (#fffcfa at 25.621%, #fff8e5 at
       * 55.723%) and they are written as `var()` so the two tokens stay the
       * single source — but this project has twice been bitten by an arbitrary
       * Tailwind value that compiled to nothing while sitting in the DOM
       * looking correct, and a page whose entire background silently fails to
       * paint is not the place to find out again.
       */
      style={{
        /*
         * ⚠️ Desktop only (direct instruction, 2026-10-13: *"in tablet and
         * mobile use page canvas as background not gradient"*). Both frames
         * draw a flat page canvas under the band, and the warm left-to-right
         * gradient only makes sense beside a full-height artwork panel — with
         * the artwork moved to a band across the top there is nothing for it
         * to blend into, and it reads as a stray tint behind the copy.
         *
         * A media query in JS rather than a Tailwind variant because the
         * value is an inline style, and the note above about arbitrary values
         * is why it is inline in the first place.
         */
        backgroundImage: isDesktop
          ? 'linear-gradient(to left, var(--background) 25.621%, var(--color-yellow-50) 55.723%)'
          : undefined,
        backgroundColor: isDesktop ? undefined : 'var(--background)',
      }}
    >
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-primary px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to main content
      </a>

      {/* The frame's header instance carries the wordmark and nothing else —
          its account cluster is switched off, because there is no account yet.
          So the lockup is NOT a link here: on the app's front door "/" is the
          page you are already on, and a logo that navigates nowhere is worse
          than one that plainly does not. The wordmark art is `aria-hidden`, so
          the brand name is carried by real text beside it. */}
      <header className="shrink-0 bg-white shadow-card">
        {/* `justify-center` below 1200 is the tablet and mobile frames'
            (`4216:17127`, `4216:18005`), which both centre the wordmark; the
            desktop frame left-aligns it at the gutter. */}
        <div className="flex h-[72px] items-center justify-center px-6 min-[1200px]:justify-start min-[1200px]:px-20">
          <Care2SleepLogo maxWidth={137.1} />
          <span className="sr-only">Care2Sleep</span>
        </div>
      </header>

      {/* ⚠️ `min-[1200px]:min-h-[calc(100vh-72px)]` is what keeps the footer
          from COMPRESSING this screen (direct instruction, 2026-10-13: *"make
          sure the UI does not gets pushed up"*). Without it, adding a ~320px
          footer to a `min-h-screen` column makes `flex-1` hand the login
          whatever is left — on a 710px viewport that is 318px against ~490 of
          content, and the artwork and copy would be squeezed into it. With it,
          the desktop login keeps exactly the geometry it had before the footer
          existed and the footer is revealed by scrolling instead.

          ⚠️ And it is gated to 1200+, which is not tidiness. Below 1200 the
          content is far shorter and there IS room for both: at 820x1100 the
          copy needs ~500 of the 708 that remains after the footer, so nothing
          is compressed. Applying the guard there instead pushed the footer
          completely off a 1100px-tall tablet — main alone filled the viewport
          — so it could never be seen without scrolling past an empty band.

          `flex-col` below 1200: there the artwork is a BAND across the top
          rather than a panel down the side, so the two children stack. */}
      <motion.main
        {...pageMotion}
        id="main-content"
        className="flex min-h-0 flex-1 flex-col min-[1200px]:min-h-[calc(100vh-72px)] min-[1200px]:flex-row"
      >
        {/* Tablet and mobile only — the desktop panel below is its counterpart
            and the two are never shown together. 640 is the same line the tile
            layout turns on, so the band and the tiles change shape together. */}
        <div className="min-[1200px]:hidden">
          <div className="hidden min-[640px]:block">
            <LoginHeroBand variant="tablet" />
          </div>
          <div className="min-[640px]:hidden">
            <LoginHeroBand variant="mobile" />
          </div>
        </div>

        {/* Left panel — one exported vector, not the frame's 13 transformed
            layers. The export is Figma's own (`4201:43548`, the whole
            `Group 8639`) with two things stripped that Figma bakes into every
            export and that belong to the page rather than the drawing: a
            #F5F5F5 backing plate, and a copy of the page gradient. Nothing
            else was touched, and nothing is hand-drawn.

            ⚠️ It comes back CLIPPED to the 724px column — that is the standing
            trap, and here it is exactly what the design wants, since the frame
            clips this column too. The consequence to know: the art's right-hand
            crop is baked at 724, so `object-cover` scales the block rather than
            revealing more of it. For a decorative panel that is the correct
            trade; for anything load-bearing it would not be. */}
        {/* `login-art-panel` + `shrink-0` replaced a bare `flex-1`, which is
            what broke this page on a large monitor: a flexible panel beside a
            FIXED 788px column takes every extra pixel of window width on its
            own, and `object-cover` has no ceiling, so the drawing reached
            2.35x on a 1440p screen with 746px of it cropped away. The width
            now comes from `index.css` ("Login screen — the artwork panel's
            width"), which is also where the two knobs and the measured
            before-table live. */}
        <div className="login-art-panel relative hidden min-w-0 shrink-0 overflow-hidden min-[1200px]:block">
          <img
            src={`${import.meta.env.BASE_URL}illustrations/login/login-panel.svg`}
            alt=""
            aria-hidden="true"
            /*
             * ⚠️ **`cover`, anchored TOP-left.** Both halves of that matter and
             * both were arrived at by being wrong first.
             *
             * The right column is a FIXED 788 + margin, so widening the window
             * widens only this panel, and the panel's aspect drifts further
             * from the artwork's portrait 724 x 898 the wider or shorter the
             * window gets. Something has to give: either the drawing is scaled
             * to fill and cropped, or it is fitted and leaves canvas around it.
             *
             * It was `h-full w-auto` — fitted to the column's HEIGHT, never
             * cropped. That is the one thing it must not be: at 1512 x 710 it
             * put the art at 0.71x and 521px wide inside a 684px panel, leaving
             * ~200px of bare canvas before the copy. Reported as "a lot of dead
             * space between the two".
             *
             * `cover` fills the panel at every size, so there is no gap by
             * construction. **`left top` is what makes the crop free:** the
             * drawing's whole subject — blob, both sparkles, the pillow and its
             * face — is in the upper two thirds, and the bottom third is cloud
             * that the frame ALREADY runs off the bottom edge. Cropping there
             * continues a bleed the design has; cropping from the bottom
             * (`left bottom`, the first cut) ate both sparkles and the top of
             * the blob at 1550 x 783 and read as "too much scaled in".
             *
             * The residual cost, named rather than hidden: a window much wider
             * than 1512 scales the art up, because the panel it has to fill
             * grows while the right column does not. That is inherent to a
             * bleeding illustration and is what the knob below is for.
             */
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: 'left top' }}
          />
        </div>

        {/* The copy column's own wrapper, added 2026-10-13 with the panel cap.
            It exists only to own the width the panel no longer takes: once the
            artwork stops growing at 905px, everything beyond that lands here,
            and `justify-center` puts the copy in the middle of it rather than
            leaving a band of empty canvas between the two (direct instruction
            — the alternative, centring the whole composition, was the option
            NOT chosen).

            ⚠️ Below 1200 this must be inert. The panel is `hidden` there and
            the column is `w-full`, so the wrapper is a plain full-width flex
            box and `flex-1`/`justify-center` only switch on at the same
            breakpoint as everything else on this page.

            At 1512 this changes nothing by itself: the wrapper is exactly the
            column's own width plus its margin, so centring has no slack to
            distribute. What DOES move the copy there is the 0.94 share on the
            panel — measured, about 21px to the left. */}
        <div className="flex w-full min-w-0 min-[1200px]:flex-1 min-[1200px]:justify-center">
          <div
            /*
             * ── The two numbers here, and why neither is flat ─────────────────
             *
             * Both resolve to the frame's own value at the frame's own size
             * (1512 x 982) and only move away from it where the frame has nothing
             * to say. Check them there first: `pt` 108, `mr` 40.11.
             *
             * **`pt` = 11vh** — the frame's 140 as the share of the frame it is
             * (140 / 982 = 14.26vh), then **reduced by 32** on direct instruction
             * with the band annotated on a screenshot: 108 / 982 = 11vh. A flat
             * 140 on a 783px-tall window had already left the heading a fifth of
             * the way down with the CTA crowded against the bottom ("not top
             * aligned"); 108 is the designed value now, not a responsive
             * concession. Clamped 40-108 so the copy can neither drift down a
             * tall screen nor weld itself to the header on a short one.
             *
             * **`mr` = 2.65vw** — direct instruction: *"add some padding on
             * right, the second container is too much on right"*. A MARGIN, not
             * padding: the column is a fixed 788 holding a 628 content block, so
             * padding would have shrunk the heading, the tiles and the CTA
             * together. The margin moves the whole column inward instead and the
             * artwork panel (flex-1) gives up the space — it is a bleeding
             * illustration and has none of its own to lose. Total gap to the
             * viewport edge is now 120 (40 + the frame's 80).
             *
             * ⚠️ **This block is TOP-anchored, and an earlier cut that centred it
             * is what made the page scroll.** The route here is worth knowing,
             * because the obvious fix is the one that broke it: asked to move the
             * content up "so add some padding below", this had `justify-center`
             * plus a 32.25vh bottom pad, on the reasoning that bottom padding
             * cannot lift anything unless something is centring it. It lifts
             * correctly — and it also makes the column's own content taller than
             * the space it was given. Measured at 1440 x 700: padding 77 + 225.75
             * plus 485.33 of content made the column **788px** inside a 628px
             * box, the document grew to 860, and the page scrolled. Reported as
             * "no scroll to this page".
             *
             * The later instruction ("reduce the top padding by ~32px") asks for
             * the same lift by the means that cannot do this, so centring is gone
             * and the bottom pad is a flat 48. Nothing here can now exceed
             * 72 + 108 + 485.33 + 48 = 713px, which is why no desktop window
             * scrolls. **Do not reintroduce `justify-center` to nudge this block
             * vertically** — move `pt`, which is bounded.
             *
             * ⚠️ These are arbitrary *values*, which compile; the thing that does
             * not is an arbitrary *property* under stacked variants, and a class
             * built by string interpolation. Both are already documented above.
             * Every number below was still read back off the live page.
             */
            className="
              login-copy-col mx-auto flex w-full max-w-[820px] shrink-0 flex-col
              px-10 py-8
              min-[640px]:px-20 min-[640px]:pt-14 min-[640px]:pb-20
              min-[1200px]:w-[788px] min-[1200px]:max-w-none min-[1200px]:px-20
              min-[1200px]:pb-12 min-[1200px]:pt-[clamp(40px,11vh,108px)]
            "
          >
            {/* `text-balance` on both, per the no-orphans rule — at 628px the
                sub-line would otherwise drop "instructions" onto a line alone. */}
            <h1 className="login-greeting-title text-display-lg text-ink text-center text-balance min-[1200px]:text-left">Welcome to Care2Sleep</h1>
            <p className="login-greeting-sub text-sub-greeting text-ink mt-2 text-center text-balance min-[1200px]:text-left">
              To login, please select your user type, then follow the instructions
            </p>

            {/* A real radio group, not three buttons wearing `aria-pressed`.
                These are mutually exclusive and that is exactly what a radio
                group announces, arrow-keys between, and submits — all of which
                would have to be hand-written otherwise, and this project's
                audience note (plain language, big targets, nothing discovered by
                gesture) is the worst possible place to hand-write it. */}
            <fieldset className="mt-12 min-w-0 border-0 p-0">
              <legend className="sr-only">Select your user type</legend>

              {/* A `max-w-[628px]` used to sit here as a BUG FIX: the tiles
                  were `aspect-square` at a third of their container, so below
                  1200 — where this column is `w-full` — they inflated to a
                  third of the WINDOW and grew as tall, measured at 309px on a
                  1024x768 screen against a designed 193px. The extra height
                  pushed the page past the viewport and it scrolled.

                  It is gone because the cause is: from 640 up the tile now has
                  the tablet frame's fixed 144px height rather than an aspect
                  ratio, so its height no longer tracks the window's width at
                  all. Keeping the cap would have cost alignment — the tablet
                  frame draws this row and the CTA both at the content width
                  (660 of its 820), and a 628 cap left the tiles visibly
                  narrower than the button under them. */}
                <div className="grid min-w-0 grid-cols-1 gap-6 min-[640px]:grid-cols-3">
                {USER_TYPES.map((type) => (
                  <label
                    key={type.id}
                    /* `login-type-tile` is the hook BOTH the glyph keyframes and
                       the three tile layouts hang off — see "Login user-type
                       glyphs" and "Login user-type tiles" in `index.css`. It is
                       on the LABEL, not the square, so the motion plays wherever
                       in the tile the pointer lands, including over the caption.

                       The `max-w-[240px] mx-auto` that used to be here is gone:
                       it existed to stop a single-column tile filling a phone,
                       and below 640 the tile is now a full-width horizontal card
                       by design, which is the frame's own answer to the same
                       problem. */
                    className="group login-type-tile"
                  >
                    <input
                      type="radio"
                      name="user-type"
                      value={type.id}
                      checked={chosen === type.id}
                      onChange={() => setChosen(type.id)}
                      className="peer sr-only"
                    />
                    {/* `grid place-items-center` replaces the old `block`: the
                        square used to be empty, and now centres a 96px glyph in
                        it. Nothing else about the tile moved — it is still the
                        frame's own `aspect-square` at the full column width, so
                        the three states and the measured geometry are unchanged.

                        `text-primary` at rest, and it stays `primary` through
                        hover and chosen, so the colour transition belongs to the
                        caption alone. The glyph's job on hover is to move, not
                        to change colour. Measured on both fills: 10.43:1 on
                        `purple-50`, 8.61:1 on `purple-200`, against the 3:1 a
                        graphical element needs. */}
                    {/* `login-tile-card` wraps BOTH the icon cell and the
                        label, which is what lets one markup tree be three
                        shapes. Below 640 this span is the card and carries the
                        border; from 640 up it is a plain block and the icon
                        cell carries it instead. All of that is in `index.css`
                        — the states and the breakpoints cross, and this page
                        has twice shipped a stacked Tailwind variant that
                        emitted no CSS.

                        It is also a sibling of the radio, not a descendant, so
                        every checked and focus rule is a plain `input:checked ~`
                        selector rather than `:has()`. */}
                    <span className="login-tile-card">
                      <span aria-hidden="true" className="login-tile-icon">
                        {/* 64 on a phone (`4216:18252`), 96 from tablet up
                            (`4216:17168`). */}
                        <UserTypeGlyph
                          name={type.glyph}
                          className="size-16 min-[640px]:size-24"
                        />
                      </span>
                    {/* No `text-balance` here, and that is measured rather than
                        an omission. The frame breaks these labels as
                        "…partner, or / supported by one" and "I am a trainee or /
                        a coach"; natural wrapping at 193px reproduces all three
                        of those breaks exactly, while balancing moves label 3 to
                        "I am / a researcher/admin" — two words alone on a line
                        with a 36px first line. The no-orphans rule is about the
                        rendered result, and here the result is already right. */}
                      <span className="text-sub-greeting login-tile-label">
                        {type.label}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* 48px and radius 28 come from `surface: 'consumer'`, which is what
                the frame draws — this is the front door for all three audiences
                and the largest of the two heights is the right one for it. The
                grey the frame shows is not a colour choice, it is `deactive`
                resolving to `ink-faint` #6d6d6d, which is the exact hex in the
                frame.

                `aria-disabled` rather than `disabled`: the control stays
                reachable by keyboard, so someone tabbing to it is told why it
                will not move rather than finding it silently skipped. The guard
                below is what actually stops it. */}
            <Button
              surface="consumer"
              state={destination ? 'static' : 'deactive'}
              aria-disabled={!destination}
              onClick={() => {
                if (destination) navigate(destination)
              }}
              className="mt-12 w-full"
            >
              Continue
              {!destination && <span className="sr-only"> (select a user type first)</span>}
              <ChevronRight aria-hidden="true" className="size-6" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </motion.main>

      {/* Direct instruction (2026-10-13): the Monash acknowledgement band goes
          on ALL THREE breakpoints, not only the two frames that draw it. The
          consequence was stated and accepted: the desktop login now scrolls,
          which it deliberately never did. The `min-h` on `main` above is what
          keeps that a scroll rather than a squeeze. */}
      <SiteFooter />
    </div>
  )
}
