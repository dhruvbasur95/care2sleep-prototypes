import { useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Care2SleepLogo } from '@/components/shared/Care2SleepLogo'
import { LoginHeroBand } from '@/components/login/LoginHeroBand'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { Button } from '@/components/ui/button'

/**
 * The app's front door. Figma: section `02 · Login — email` on the
 * `1. Login screens` page — `4245:869` desktop, `4245:1021` tablet,
 * `4245:1167` mobile.
 *
 * ── What this screen is, and what it is not ───────────────────────────────
 *
 * The flow is **email address -> Okta SSO -> dashboard**. The screen never asks
 * who you are, because the identity provider already knows; Okta is outside
 * this prototype's scope and is deliberately **not mocked**.
 *
 * Which leaves one problem: with no Okta, nothing decides which dashboard to
 * open. The `Select user type (for prototype only)` dropdown is that stand-in.
 * It pre-fills the email and sets the destination, and it is **not in any
 * frame** (direct instruction, 2026-10-13: *"in figma we do not show the select
 * user type as this will not be part of developed version. we also do not
 * consider this as a variance for future"*). It is scaffolding, not a variant.
 *
 * ⚠️ **The dropdown decides the destination, not the email.** Anyone can type
 * anything into the field; there is no Okta here to read it. The CTA goes live
 * only when a type is chosen AND the field is non-empty — a sign-in button that
 * submits nothing would be lying about what it does.
 *
 * ── What was here before ─────────────────────────────────────────────────
 *
 * Until 2026-10-13 this screen asked the reader to pick one of three user-type
 * tiles, each with its own animated lucide-derived glyph. That whole design —
 * tiles, glyphs, their three states and their per-breakpoint stroke weights —
 * was deleted when the flow changed, by instruction (*"if we do in future, we
 * will rebuild using figma as reference"*). It is not gone: the frames survive
 * in Figma section `01 · Login`, the spec is `design-tokens.md` §104-§106, and
 * the code is in git history. **Do not reconstruct it from memory** — the frames
 * are the reference.
 *
 * ── The frame, transcribed ───────────────────────────────────────────────
 *
 *   canvas       linear-gradient(to left, #fffcfa 25.621%, #fff8e5 55.723%)
 *                — `--background` warming into `yellow-50`. Desktop only;
 *                below 1200 the canvas is flat.
 *   header       72px white bar, `shadow-card`, 80px side padding, wordmark
 *                137.1 x 34 and nothing else (nobody is signed in yet)
 *   columns      left `flex-1` (724 at 1512) + right a fixed 788
 *   right pad    80 side / 140 top
 *   heading      display-lg (40/500) -> 8 -> sub-greeting (18/500/1.4)
 *   -> 48 ->     the form block: label -> 8 -> 48px field, twice
 *   -> 48 ->     the CTA stack: two full-width 48px pills, 16 apart
 *
 * Field and CTA geometry, and why both controls share one skin, are in
 * `index.css` under "Login — the email field…" and in `design-tokens.md`
 * §107.3.
 *
 * ── Where this departs from the frame ────────────────────────────────────
 *
 * 1. **The dropdown**, above — app only, by instruction.
 * 2. **Copy fixes**, all previously instructed and now carried by the frames
 *    too: "Care2Sleep" not "Care to Sleep", and "sign in" as two words
 *    throughout, matching the CTA.
 * 3. **Everything below 1200px is derived** from the tablet and mobile frames;
 *    see the `min-[1200px]` note below.
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
 * The three audiences, each with the email the prototype fills in for them and
 * the portal that email signs into.
 *
 * ⚠️ **This list is no longer drawn on the screen.** It was three tiles until
 * 2026-10-13, when the flow became email -> Okta SSO -> dashboard: the real
 * screen never asks who you are, because the identity provider already knows.
 * The list survives as the prototype-only dropdown's options, since Okta is out
 * of scope here and something has to decide which dashboard to open.
 *
 * `label` is therefore a dropdown option, not a sentence the audience reads
 * about itself — the first-person tile wording ("I'm a care partner, or
 * supported by one") and its load-bearing non-breaking spaces went with the
 * tiles. The old frames in Figma section `01 · Login` still carry all of it.
 *
 * `email` is deliberately role-based and obviously fake, on the `example.com`
 * the seed data already uses. No person's name: a plausible one in a sign-in
 * field reads as a real account.
 */
const USER_TYPES: { id: string; label: string; to: string; email: string }[] = [
  {
    id: 'consumer',
    label: 'Care partner, or supported by one',
    to: '/consumer',
    email: 'care.partner@example.com',
  },
  { id: 'coach', label: 'Trainee or coach', to: '/delivery', email: 'coach@example.com' },
  {
    id: 'researcher',
    label: 'Researcher or admin',
    to: '/research',
    email: 'researcher@example.com',
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
  /** The prototype-only dropdown's value; `''` is its "Choose one…" option. */
  const [chosen, setChosen] = useState('')
  const [email, setEmail] = useState('')
  const isDesktop = useIsDesktop()

  const destination = USER_TYPES.find((t) => t.id === chosen)?.to

  /**
   * ⚠️ **The DROPDOWN decides where this goes, not the email.** Anyone can type
   * any address into the field — in the built version Okta reads it and routes
   * accordingly, and there is no Okta here. So the destination comes from the
   * stand-in that replaces it, and the email has to be non-empty only because a
   * sign-in button that submits nothing is a lie about what it does.
   */
  const ready = Boolean(destination) && email.trim() !== ''

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
             * from the artwork's portrait 724 x 910 the wider or shorter the
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
            {/* `text-balance` on both, per the no-orphans rule.

                The sub-line was "To login, please select your user type, then
                follow the instructions" until 2026-10-13. Two things were wrong
                with it: **"login" is the noun — the verb is "log in"** — and
                "follow the instructions" is filler that names no action. The
                replacement opens on "To log in" by direct instruction, and at
                35 characters it is the one candidate that holds a SINGLE line
                at every width, 295 included. See `ux-copy.md`. */}
            <h1 className="login-greeting-title text-display-lg text-ink text-center text-balance min-[1200px]:text-left">Welcome to Care2Sleep</h1>
            <p className="login-greeting-sub text-sub-greeting text-ink mt-2 text-center text-balance min-[1200px]:text-left">
              To sign in, enter your email address
            </p>

            {/* ⚠️ **The user-type dropdown is PROTOTYPE-ONLY and is not in any
                frame** (direct instruction, 2026-10-13: *"in figma we do not
                show the select user type as this will not be part of developed
                version. we also do not consider this as a variance for
                future"*).

                The real flow is: type an email, Okta SSO takes over, and Okta
                sends you to the right place. Okta is outside this prototype, so
                something has to stand in for "the identity provider knows who
                you are" — this dropdown is that stand-in. Choosing a type
                pre-fills the email below and sets where `Continue to sign in`
                lands, which is exactly the decision Okta would be making.

                It is a real `<select>`, not a hand-rolled listbox: this project
                has twice shipped a `role="radiogroup"` without its keyboard
                contract, and a native control cannot make that mistake.

                `login-form-block` is the hook for the column's tall-window
                rhythm in `index.css`. It REPLACES a `> fieldset` selector —
                keep it a class, since the element it names keeps changing. */}
            <div className="login-form-block mt-12 min-w-0">
              {/* "(for prototype only)" is part of the label and carries the
                  label's own weight (direct instruction, 2026-10-13: *"use same
                  font weight"*) — not a lighter aside, and not a separate hint
                  paragraph, which is what this was first built as. It reads as
                  one line because it IS one line: the control is prototype-only
                  in its entirety, so qualifying it in a second voice underneath
                  said the same thing twice. */}
              <label htmlFor="login-user-type" className="text-body-md text-ink block">
                Select user type (for prototype only)
              </label>
              <div className="relative mt-2">
                <select
                  id="login-user-type"
                  value={chosen}
                  onChange={(e) => {
                    const next = USER_TYPES.find((t) => t.id === e.target.value)
                    setChosen(e.target.value)
                    setEmail(next ? next.email : '')
                  }}
                  className="login-field w-full appearance-none pr-14"
                >
                  <option value="">Choose one…</option>
                  {USER_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {/* lucide, per the icon rule, and `aria-hidden` because the
                    `<select>` already announces itself as a combobox.
                    `appearance-none` above is what removes the native caret. */}
                <ChevronDown
                  aria-hidden="true"
                  strokeWidth={2}
                  className="text-ink-faint pointer-events-none absolute top-1/2 right-6 size-5 -translate-y-1/2"
                />
              </div>

              {/* A VISIBLE label, not a placeholder standing in for one: a
                  placeholder disappears the moment someone types, and this
                  project's audience note is explicit that nothing should be
                  discovered or remembered. The placeholder is an example of the
                  shape, which is all it is good for. */}
              <label htmlFor="login-email" className="text-body-md text-ink mt-6 block">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-field mt-2 w-full"
              />
            </div>

            {/* ⚠️ **The two CTAs are ONE child of the column, deliberately.**
                `index.css` opens the column's rhythm up on a tall window with
                `.login-copy-col > button { margin-top: 64px }` — written when
                the CTA *was* a single button. The moment a second button
                became a sibling it inherited that 64px, so on a monitor the
                pair sat 64px apart instead of 16 and read as two unrelated
                controls (reported 2026-10-13: "it does not look broken in
                monitor view"). Measured at 2740x1300: 64px, against 16 at
                1512x982, where the rule does not apply.

                Wrapping them makes the stack the column's fourth child, so the
                opening-up rule moves the PAIR and the 16px between them is
                fixed at every size — which is also what all three frames draw
                (desktop `4216:18637`, and the stacks now on tablet and mobile).
                A `gap`, not margins, so nothing can be inherited into it. */}
            <div className="login-cta-stack mt-12 flex w-full flex-col gap-4">
              {/* 48px and radius 28 come from `surface: 'consumer'`, which is
                  what the frame draws — this is the front door for all three
                  audiences and the largest of the two heights is the right one
                  for it. The grey the frame shows is not a colour choice, it is
                  `deactive` resolving to `ink-faint` #6d6d6d, which is the exact
                  hex in the frame.

                  `aria-disabled` rather than `disabled`: the control stays
                  reachable by keyboard, so someone tabbing to it is told why it
                  will not move rather than finding it silently skipped. The
                  guard below is what actually stops it. */}
              <Button
                surface="consumer"
                state={ready ? 'static' : 'deactive'}
                aria-disabled={!ready}
                onClick={() => {
                  if (ready && destination) navigate(destination)
                }}
                className="w-full"
              >
                Continue to sign in
                {!ready && (
                  <span className="sr-only"> (select a user type and enter an email first)</span>
                )}
              </Button>

              {/* `Go back` is drawn on all three frames and has nowhere to go
                  yet: this is step 1 of four and the landing page it will return
                  to is not built (direct instruction, 2026-10-13 — "keep it
                  inactive"). So it renders under this project's unwired-control
                  rule: full `secondary · brand` paint as the frame draws it,
                  `aria-disabled` rather than `disabled` so it stays reachable by
                  keyboard, and an `sr-only` cue saying why it will not move.
                  Never the `disabled` attribute — an inert "(coming soon)"
                  control is deliberately focusable, and a silently dead button
                  is the one thing this rule exists to prevent.

                  `state="deactive"` because it reads as unavailable and it IS —
                  step 1 has nowhere to go back to until the landing page exists
                  (direct instruction, 2026-10-13). **The frames agree**: all
                  three were changed to match on the same day, and carry the
                  same three values this paints — fill `#FFFFFF`, stroke
                  `#E0E0E0` 1px, label `#6D6D6D`.

                  `deactive` is paint only — the `aria-disabled` above is what
                  carries it to assistive tech, and the pair must stay together
                  or the grey is a lie. */}
              <Button
                variant="secondary"
                surface="consumer"
                state="deactive"
                aria-disabled="true"
                className="w-full"
              >
                Go back home
                <span className="sr-only"> (coming soon)</span>
              </Button>
            </div>
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
