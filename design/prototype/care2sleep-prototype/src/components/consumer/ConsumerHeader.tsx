import { useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion'
import {
  ArrowLeftRight,
  ChevronDown,
  GraduationCap,
  House,
  LifeBuoy,
  LogOut,
  Menu as MenuIcon,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
import { ConsumerLogo } from '@/components/consumer/ConsumerLogo'
import { cn } from '@/lib/utils'
import { signOutOfTraining } from '@/data/auth'

/**
 * Consumer Portal header — Figma frame `748:1314`, replacing the app-wide black
 * `AppHeader` on this portal only (direct instruction: "in consumers we also
 * update the header").
 *
 * The frame: a 96px white bar, 80px side padding, the project's own warm Card
 * shadow, the new wordmark lockup at the left and a coral "Sign Out" pill at
 * the right. Nothing else — no bell, no portal label, no account name.
 *
 * **The header is now this portal's whole navigation.** Over the course of
 * Round 41 the Consumer Portal's left sidebar was emptied out one instruction at
 * a time — Health & Sleep deleted, Home promoted into this bar, My Profile moved
 * into the account menu — and a rail with nothing in it is not a design, so
 * `ConsumerSidebar` was deleted. That is a consequence of the three
 * instructions, not a fourth decision taken on their behalf, and it is the one
 * thing here worth a second look.
 *
 * DIVERGENCES FROM THE FRAME, all from direct instruction:
 *
 * 1. **Three centred nav buttons** — Home, My Lessons, Need Help ("add
 *    three button on top in header ... Centre align them"). Centred against the
 *    *page*, not against the space left over between the logo and the account
 *    controls: a plain flex row would drift as either side's width changed, so
 *    the bar is a `1fr auto 1fr` grid and the nav sits in the middle track.
 * 2. **The account dropdown holds Switch portal and My Profile** ("club switch
 *    portal button under user dropdown", then "move my profile details under
 *    consumer drop down for consumers only"). Sign out left the menu to become
 *    the coral button, which is why the menu is not empty.
 * 3. **The notification bell is gone.** It was an inert placeholder on all four
 *    portals; the frame omits it, so it is removed here rather than kept as
 *    decoration. The other three portals still carry it via `AppHeader`.
 *
 * Controls are 44px, not the app's 36px floor — that floor is a minimum, and
 * this portal's audience (people living with dementia and their carers) is the
 * one this project has an explicit note about: plain language, big targets.
 *
 * ── THE COMPACT/WIDE SWITCH IS 1200px, NOT `md` ──────────────────────────
 *
 * Every breakpoint in this file is `min-[1200px]`, and they must move together —
 * they are one decision (nav in the bar, or nav in a row beneath it), not seven.
 *
 * It was `md` (768px), and that was wrong by over 400px. The bar is a
 * `justify-between` pair with the nav **absolutely centred on top of it**, so
 * the nav does not participate in layout and nothing stops it overlapping its
 * neighbours. Measured at 1440: the logo occupies 80-291, the nav 519-921 and
 * the account group 1091-1360. Between 768 and ~1180 those three collide, and it
 * rendered as a pile — the wordmark behind the Home pill, "Need Help" printed
 * through the account name. Reported from a tablet screenshot, then reproduced.
 *
 * **1200, not this project's existing 1120**, and the extra 80px is the whole
 * point. At exactly 1120 the measured gap between the nav's right edge and the
 * account group is **10px** — which holds only for the persona this portal
 * happens to open on. `accountLabel` is the carer's name, and the longest one
 * seeded ("Margaret Sinclair", 17 chars against Joan Whitfield's 14) is ~24px
 * wider, so 1120 overlaps for a real record in the store. 1200 clears the
 * longest seeded name by ~26px.
 *
 * If a longer name than that ever lands, this breaks again silently — the
 * durable fix is bounding the account group's width rather than out-running it,
 * which is a change to how the trigger is laid out, not to this number.
 *
 * Below it, the mobile treatment simply applies: logo centred, account controls
 * in the hamburger, and the three tabs as a full-width row under the bar. That
 * is the requested behaviour ("show the buttons below as done for mobile") and
 * it needed no new layout — only the switch moved.
 *
 * The skip link is preserved and moved with the header. It is not in the frame
 * and never has been in any frame — it is a WCAG 2.4.1 requirement, and Round
 * 28 had to fix this app's own copy of it once already (it pointed at a bare
 * `id` that could not take focus). `main` carries `tabIndex={-1}` in
 * `ConsumerShell` so this actually moves focus.
 */

/**
 * Shared geometry for the three nav controls, so a live one and an unwired one
 * cannot drift apart in size — only in colour.
 *
 * Frame `761:3306` draws each item as a 112x40 box with a 24px gap, `body-md`
 * (16/600) labels, and the *active* one as a **`yellow-200` pill with dark
 * text** — not a filled brand-purple pill, which is what a first pass built
 * before this frame arrived. 44px rather than the frame's 40px: the 36px floor
 * is a minimum and this portal's audience is the one this project has an
 * explicit note about (plain language, big targets), so the height goes up, not
 * down. `min-w-[112px]` rather than a fixed width, because "Need Help" at
 * 16/600 does not fit 112px in Inter and the frame's own label is clipped.
 */
/**
 * The three tabs. All three are real routes as of the instruction "my learning,
 * and need help buttons not working, I want to see animation" — they were
 * `aria-disabled` placeholders, which meant clicking them did nothing and the
 * selected-tab animation could never be seen on anything but Home. They now
 * navigate to their own pages, which say plainly that they are still being
 * built ("For these pages, keep it in progress"). A page that admits it is
 * unfinished is a better answer than a control that silently refuses.
 *
 * The icon is per tab because only the *active* tab shows one, so each needs
 * its own glyph for the spring to have something to reveal.
 */
const NAV_LINKS: { to: (dyadId: string) => string; label: string; icon: LucideIcon }[] = [
  { to: (d) => `/consumer/${d}`, label: 'Home', icon: House },
  /* Round 43, direct instruction: "we now call it my Lessons. so update button
     names also". Both new frames' own nav says "My Lessons" too. The **route**
     stays `/learning` — it is an identifier, not copy, and renaming it would
     break every link already pointing at it for no user-visible gain. The coach
     portal's own "My Learning" is a different audience and is untouched. */
  { to: (d) => `/consumer/${d}/learning`, label: 'My Lessons', icon: GraduationCap },
  { to: (d) => `/consumer/${d}/help`, label: 'Need Help', icon: LifeBuoy },
]

const NAV_ITEM =
  'flex h-11 min-w-[112px] items-center justify-center gap-1.5 rounded-[40px] px-4 text-body-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-consumer-primary'

/**
 * Entrance for the nav row (direct instruction: "Should not show up in welcome
 * screen. When I click continue, then show the tabs / buttons, I want a move in
 * animation for them also, like a wave, moving in from down to up in a linear
 * order (very subtly micro animation)").
 *
 * "Linear order" is a per-item delay, not a per-item easing: each tab starts
 * 70ms after the one to its left and they all travel the same 8px. That is what
 * makes the row read as a wave rather than as three things appearing at once.
 * The whole row is held back by `NAV_ENTRANCE_DELAY_S` so it arrives after the
 * welcome screen has finished leaving — otherwise the first tab lands while the
 * pillow is still fading out and the two movements compete.
 */
/** 8px of travel, up from below. Small on purpose — "very subtly micro". */
const NAV_RISE = { out: { opacity: 0, y: 8 }, in: { opacity: 1, y: 0 } }
/** Slowed on direct instruction ("the top buttons move in animation too
 *  fast"): the per-item gap went 0.07 -> 0.14 and each item's own travel 0.34 ->
 *  0.6s, so the last tab now settles ~1.0s after the first begins rather than
 *  ~0.55s. The stagger is what carries the "wave", so widening the gap does more
 *  for legibility here than lengthening any single item would. */
const NAV_STAGGER_S = 0.14
const NAV_ENTRANCE_DELAY_S = 0.45

/**
 * Has the nav's entrance already played this page load?
 *
 * Module-scoped, and load-bearing for the same reason `ConsumerShell`'s welcome
 * flag is: `App.tsx` wraps its `<Routes>` in an `AnimatePresence` keyed on the
 * pathname, so **every** in-app navigation unmounts and remounts the whole page
 * including this header. Without this flag the three tabs replayed their
 * staggered wave on every tab change (reported: "selecting a different tab loads
 * the page again including header", "the buttons should not load in moving
 * animation again and again its only first time, or whenever page is
 * refreshed").
 *
 * A module variable rather than state because state lives in the component that
 * keeps being thrown away. It resets on a real page refresh, which is exactly
 * the requested behaviour.
 *
 * This deliberately does NOT suppress the selected tab's icon spring. That one
 * is keyed on the icon mounting when a tab becomes active, so it still fires on
 * every selection — which is the animation the instruction asks to keep seeing.
 */
let navIntroPlayed = false

/**
 * The three tabs, rendered twice: centred in the bar on desktop, and as a
 * full-width row beneath it on mobile (direct instruction: "in mobile view
 * profile and signout goes into hamburger menu. The logo takes centre, and the
 * three buttons act as page tabs").
 *
 * One component, two placements, because the mobile row is the same three
 * controls with the same states — the previous pass let all four groups sit in
 * one flex row at every width and at 390px they overlapped into an unreadable
 * pile (reported with a screenshot, and it was as bad as it looked).
 */
function NavTabs({
  dyadId,
  variant,
  reduceMotion,
  itemTransition,
}: {
  dyadId: string
  /** `bar` = centred inside the header bar (>=1200). `row` = a full-width tab
   *  row beneath it (<1200). Same three controls and the same states either
   *  way — only the placement differs. */
  variant: 'bar' | 'row'
  reduceMotion: boolean | null
  itemTransition: Transition
}) {
  return (
    <motion.nav
      key={`consumer-nav-${variant}`}
      aria-label={variant === 'bar' ? 'Main' : 'Main (compact)'}
      // Absolutely centred rather than a middle grid track. A first pass used
      // `grid-cols-[1fr_auto_1fr]`, and when the nav is hidden on the welcome
      // screen the `auto` track collapsed and the account controls slid inward
      // off the right edge — reported, then reproduced. Out of flow means the
      // logo and the account group are a plain `justify-between` pair whose
      // positions do not depend on whether the nav is mounted, and the nav
      // centres on the *page*.
      //
      // ⚠️ Out of flow also means **nothing pushes back**: the centred nav will
      // happily sit on top of the logo and the account controls, and between
      // 768px and ~1140px it did exactly that (reported at tablet width: the
      // wordmark behind the Home pill, "Need Help" printed over the account
      // name).
      //
      // Hence `min-[1200px]` rather than `md` throughout this file — see the
      // note above `ConsumerHeader`. Every breakpoint here is written as a
      // **literal** class: Tailwind scans source text, so a composed
      // `${VAR}:block` generates no CSS at all and fails silently.
      //
      // ⚠️ **The tab row is back, and it overrides the frame.** `787:1329`
      // (iPhone SE) draws no tab row and puts nothing but a hamburger opposite
      // the logo. That was built, then reverted on direct instruction ("just
      // bring mobile header out as we have in tablet + mobile before"). The
      // frame loses here on purpose: three always-visible destinations beat
      // three hidden behind an icon for this portal's stated audience, and it
      // restores the arrangement an earlier instruction asked for explicitly.
      className={
        variant === 'bar'
          ? 'absolute left-1/2 hidden -translate-x-1/2 min-[1200px]:block'
          : 'border-t border-parchment px-3 py-2 min-[1200px]:hidden'
      }
      initial={navIntroPlayed ? false : 'out'}
      animate="in"
      exit="out"
      variants={{
        in: {
          transition: {
            staggerChildren: reduceMotion ? 0 : NAV_STAGGER_S,
            delayChildren: reduceMotion ? 0 : NAV_ENTRANCE_DELAY_S,
          },
        },
      }}
    >
      <ul className={variant === 'bar' ? 'flex items-center gap-6' : 'flex items-center gap-2'}>
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <motion.li
            key={label}
            variants={NAV_RISE}
            transition={itemTransition}
            // Equal thirds in the row so it reads as a tab bar rather than
            // three differently-sized pills. `min-w-0` because the labels are
            // wider than a third of a 375px screen and a flex item defaults to
            // `min-width: auto` — the exact omission this project has shipped
            // three times as a horizontal page scroll.
            className={variant === 'row' ? 'min-w-0 flex-1' : undefined}
          >
            <NavLink
              to={to(dyadId)}
              end
              className={({ isActive }) =>
                cn(
                  NAV_ITEM,
                  // 14px only where the row is genuinely tight — a phone. From
                  // `sm` up each tab has ~200px+ and steps back to the bar's 16.
                  variant === 'row' && 'w-full min-w-0 px-2 text-caption-medium sm:text-body-md',
                  isActive
                    ? 'bg-yellow-200 text-ink'
                    // Light grey on hover (direct instruction). `pearl`
                    // (#f5f5f7) rather than a warm tint: this project's own rule
                    // is that pearl is a cool grey that reads foreign on the
                    // warm page canvas but is correct inside a white surface,
                    // and this header is white.
                    : 'text-ink hover:bg-pearl',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* The frame gives only the *active* item a glyph, so the icon
                      MOUNTS on selection — which is what lets it spring in with
                      no state tracking at all (direct instruction: "when I
                      select a page (tab) spring in the icon for that selected
                      tab"). A spring rather than a duration: the overshoot is
                      the whole effect, and Round 32 found that an eased curve at
                      this travel reads as a pop. */}
                  {/* Desktop only (direct instruction, twice: "no icons in
                      mobile view", then again in Round 43 "for mobile view we do
                      not show icons in buttons at top i.e home, learning, need
                      help") — in a three-across mobile row the glyph costs
                      enough width to truncate "My Lessons" to "My Less...",
                      which is a worse trade than losing the icon.

                      ⚠️ It is `hidden sm:block`, NOT a comment. This block said
                      "desktop only" for two rounds while rendering the icon at
                      every width, because the note was written and the class
                      never was — which is why the instruction had to be given a
                      second time. A prose claim about a breakpoint is not a
                      breakpoint; measure the rendered glyph count at 375.

                      No entrance animation. Two were built on direct
                      instruction — a spring-scale pop, then a squash-and-stretch
                      rise from the bottom edge — and both were rejected ("I
                      still dont like the icon animation, remove it, keep it
                      simple. just show icon for selected tab/page"). Recorded
                      rather than quietly dropped so neither gets proposed again
                      as an obvious improvement: the plain state change is the
                      decision. */}
                  {isActive && (
                    <Icon aria-hidden="true" className="hidden size-5 shrink-0 sm:block" />
                  )}
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  )
}

export function ConsumerHeader({
  dyadId,
  accountLabel,
  showNav = true,
}: {
  dyadId: string
  /** The signed-in dyad's display name, shown as the dropdown trigger. */
  accountLabel: string
  /**
   * Whether the three nav tabs are shown. `false` during the first-run welcome
   * screen, which is one CTA on an otherwise empty canvas — a nav row above it
   * offers three ways out of a screen whose whole job is the one button.
   */
  showNav?: boolean
}) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const navItemTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const }

  const signOut = () => {
    signOutOfTraining()
    navigate('/')
  }

  // Set after the first render that shows the nav, so the entrance plays once
  // per page load. Deliberately not in an effect with a dependency array: it is
  // a one-way latch, not reactive state, and nothing re-renders off it.
  useEffect(() => {
    if (showNav) navIntroPlayed = true
  }, [showNav])

  /** The two account actions. Same items in the desktop dropdown and the mobile
   *  hamburger, so the two menus cannot drift — on mobile Sign out joins them,
   *  because the coral button has nowhere to sit once the logo takes the
   *  centre. */
  const accountItemClass =
    'flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-3 text-ink-muted outline-none data-[highlighted]:bg-pearl data-[highlighted]:text-ink'

  return (
    <header className="sticky top-0 z-30 bg-white shadow-card">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-consumer-primary px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to main content
      </a>

      {/* h-24 = the frame's 96px. The lockup is 47.35px tall and `items-center`
          reproduces the frame's own 24.32px top offset exactly, so the frame's
          40px block padding is not transcribed as padding — it would fight the
          centring. Side padding is the frame's 80px, dropping to 24px below `md`
          where 160px of gutter would leave the lockup no room. */}
      {/* h-24 = the frames' 96px, now at **every** width — `787:1329` (mobile)
          and `761:3171` (desktop) both draw 96, where this used to drop to 80
          below the wide breakpoint. Side padding is the frames' own 24 -> 80. */}
      <div className="relative flex h-24 items-center justify-between px-6 min-[1200px]:px-20">
        {/* Compact only: the hamburger, **first in the row** so it sits at the
            left with the logo centred against it. It holds the account actions
            only — the three destinations are the tab row beneath the bar again,
            not menu items. */}
        <Menu.Root>
          <Menu.Trigger
            aria-label="Menu"
            className="flex size-11 shrink-0 items-center justify-center rounded-sm text-ink outline-none transition-colors hover:bg-pearl focus-visible:ring-2 focus-visible:ring-consumer-primary min-[1200px]:hidden"
          >
            <MenuIcon aria-hidden="true" className="size-6" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="start" sideOffset={8} className="z-50 outline-none">
              <Menu.Popup className="min-w-[220px] rounded-sm bg-card p-1 text-body text-ink shadow-card ring-1 ring-hairline outline-none">
                <Menu.Item onClick={() => navigate(`/consumer/${dyadId}/account`)} className={accountItemClass}>
                  <UserRound aria-hidden="true" className="size-4" />
                  My profile
                </Menu.Item>
                <Menu.Item onClick={() => navigate('/')} className={accountItemClass}>
                  <ArrowLeftRight aria-hidden="true" className="size-4" />
                  Switch portal
                </Menu.Item>
                <Menu.Item onClick={signOut} className={accountItemClass}>
                  <LogOut aria-hidden="true" className="size-4" />
                  Sign out
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>

        {/* `aria-label` rather than an added `sr-only` span. A first pass used
            the span and the accessible name came out as the run-together
            "Care2SleepCare2Sleep home", because the wordmark inside the lockup
            was real text and contributed to the name — read back from the DOM,
            not assumed. (It is a flat vector now, so it contributes nothing, but
            the label is still what names the link.) The label contains the
            visible word, so WCAG 2.5.3 (Label in Name) holds.

            **Centred below 1200, left-aligned above.** Frame `787:1405` puts it
            first in the row with a hamburger opposite, and that was built — then
            reverted on direct instruction back to the earlier arrangement
            (hamburger left, logo centred, tabs in a row beneath). */}
        <Link
          to={`/consumer/${dyadId}`}
          aria-label="Care2Sleep home"
          className="absolute left-1/2 -translate-x-1/2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-consumer-primary min-[1200px]:static min-[1200px]:translate-x-0"
        >
          <ConsumerLogo />
        </Link>

        <AnimatePresence>
          {showNav && (
            <NavTabs
              dyadId={dyadId}
              variant="bar"
              reduceMotion={reduceMotion}
              itemTransition={navItemTransition}
            />
          )}
        </AnimatePresence>

        {/* Balances the hamburger so the centred logo is actually centred rather
            than offset by its width. `aria-hidden` and not focusable. */}
        <span aria-hidden="true" className="size-11 shrink-0 min-[1200px]:hidden" />

        {/* Wide only: the account dropdown and the coral Sign Out. Both fold
            into the hamburger below 1200. */}
        <div className="hidden items-center gap-6 min-[1200px]:flex">
          <Menu.Root>
            <Menu.Trigger className="group flex h-11 items-center gap-1.5 rounded-sm px-1 text-body text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-consumer-primary data-[popup-open]:text-ink">
              <span className="hidden sm:inline">{accountLabel}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-data-[popup-open]:rotate-180"
              />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50 outline-none">
                <Menu.Popup className="min-w-[220px] rounded-sm bg-card p-1 text-body text-ink shadow-card ring-1 ring-hairline outline-none">
                  <Menu.Item onClick={() => navigate(`/consumer/${dyadId}/account`)} className={accountItemClass}>
                    <UserRound aria-hidden="true" className="size-4" />
                    My profile
                  </Menu.Item>
                  <Menu.Item onClick={() => navigate('/')} className={accountItemClass}>
                    <ArrowLeftRight aria-hidden="true" className="size-4" />
                    Switch portal
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>

          {/* Frame `761:3167`: 40px tall, 28px radius, 20px inline padding,
              coral fill, Inter 16/600 white. `shrink-0` because this is a
              fixed-height flex child and flex-shrink has compressed a `h-*`
              button below the 36px floor in this project before (Round 21
              shipped a 31px CTA exactly this way). */}
          <button
            type="button"
            onClick={signOut}
            className="flex h-10 shrink-0 items-center justify-center rounded-3xl bg-consumer-accent px-5 text-body-md text-white outline-none transition-colors hover:bg-consumer-accent/90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
          >
            Sign Out
          </button>
        </div>

      </div>

      {/* The tab row, below the bar and above the page — restored on direct
          instruction. It is inside `<header>`, which is `sticky` and therefore
          occupies normal flow, so adding it pushes the wave, the mascot and
          every section below them down together with no offset to maintain:
          `ConsumerCanvasWave` positions against the content column, not the
          page top. Verified by measurement rather than assumed. */}
      <AnimatePresence>
        {showNav && (
          <NavTabs
            dyadId={dyadId}
            variant="row"
            reduceMotion={reduceMotion}
            itemTransition={navItemTransition}
          />
        )}
      </AnimatePresence>
    </header>
  )
}
