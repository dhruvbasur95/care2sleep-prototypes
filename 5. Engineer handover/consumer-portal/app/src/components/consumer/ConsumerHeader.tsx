import { useEffect, useMemo, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion'
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  House,
  Menu as MenuIcon,
  MessageCircleQuestionMark,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
import { AccessibilityMenu, SUBMENU_CARD_MOTION } from '@/components/consumer/AccessibilityMenu'
import { openConsumerMenu, useConsumerMenu } from '@/data/consumerMenuReveal'
import { ConsumerLogo } from '@/components/consumer/ConsumerLogo'
import { cn } from '@/lib/utils'
import { signOutOfTraining } from '@/data/auth'

/**
 * The account menu's three destinations.
 *
 * A list rather than three hand-written `Menu.Item`s, so the rows cannot drift
 * apart the way they had already started to — and so that this stays visibly
 * the same set as `ConsumerMenuDrawer`'s own bottom three rows, which is what
 * the shared row treatment is claiming.
 */
const ACCOUNT_ROWS: {
  label: string
  icon: LucideIcon
  to: 'switch' | ((dyadId: string) => string)
}[] = [
  { label: 'My profile', icon: UserRound, to: (d) => `/consumer/${d}/account` },
  { label: 'Need help', icon: MessageCircleQuestionMark, to: (d) => `/consumer/${d}/help` },
  { label: 'Switch portal', icon: ArrowLeftRight, to: 'switch' },
]

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
     stays `/learning`.

     ⚠️ Round 46, direct instruction: "we call them My modules, not my lessons,
     so update everywhere". The visible label is now **My Modules**, and the
     word "module" replaced "lesson" across every consumer-facing string in this
     portal. Frames `818:12862`/`819:13049` corroborate it — both say "Module".
     Internal identifiers (`LessonCards`, `LessonView`, `releasedLessons`, the
     `/learning` route) deliberately keep "lesson": they are code, not copy, and
     renaming them is a large diff with no user-visible effect — the same call
     this project already made for `ConsumerDyad`/`dyadId` under the
     consumer/client rule.
     stays `/learning` — it is an identifier, not copy, and renaming it would
     break every link already pointing at it for no user-visible gain. The coach
     portal's own "My Learning" is a different audience and is untouched. */
  { to: (d) => `/consumer/${d}/learning`, label: 'My Modules', icon: GraduationCap },
  /* ⚠️ Round 48, direct instruction: "move need help under my account drop
     down". Need Help is no longer a tab — it is a menu item in the account
     dropdown, and in the compact hamburger beside it, so the two menus still
     carry the same set.

     The nav is two tabs now, not three. That is worth stating because this row
     is a `1fr auto 1fr` centred grid measured against a three-tab width
     (§ the header's own doc comment, "the nav 519-921"): the row re-centres on
     its own content, so nothing needed adjusting, but a future frame drawn
     against three tabs will not match. */
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
      // ⚠️ Round 48, direct instruction: "visually balance out top navigation
      // header". The `bar` variant is now IN FLOW at >=1200 — it was
      // `absolute left-1/2 -translate-x-1/2`, i.e. centred on the PAGE.
      //
      // Page-centring was right when the two sides were close in width. They no
      // longer are: measured at 1281, the logo is 137px and the right group is
      // 355px (accessibility + account pill + Log out), which left gaps of 292
      // on one side of the nav and 74 on the other. Centred by arithmetic,
      // visibly shoved right.
      //
      // As a normal child of the bar's own `justify-between`, the nav centres
      // between its neighbours instead of against the window, which is what
      // "balanced" means to the eye. The original reason for taking it out of
      // flow — that it should not shift as either side changes width — is now
      // the thing to avoid rather than preserve.
      //
      // The old note below still applies to the COMPACT row and to why the
      // grid exists at all:
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
          ? 'hidden min-[1200px]:block'
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
                  // 16 at every width. The compact row used to drop to 14,
                  // which is below this portal's floor (Round 46 type sweep).
                  variant === 'row' && 'w-full min-w-0 px-2 text-body-md',
                  /* `relative` because the sliding pill below is an absolute
                     child of this link. The active fill is NOT a background
                     class any more — see the `layoutId` element. */
                  'relative',
                  isActive
                    ? 'text-ink'
                    // Light grey on hover (direct instruction). `pearl`
                    // (#f5f5f7) rather than a warm tint: this project's own rule
                    // is that pearl is a cool grey that reads foreign on the
                    // warm page canvas but is correct inside a white surface,
                    // and this header is white.
                    : 'text-ink hover:bg-purple-50',
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
                      enough width to truncate "My Modules" to "My Modu...",
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
                  {/* The yellow pill slides between tabs instead of appearing
                      and disappearing (direct instruction: "I want the yellow
                      background behind the home and module button to slide left
                      right, not just instantly show, hide").

                      One `layoutId` shared by both tabs is what does it: framer
                      sees the same layout identity leave one link and arrive in
                      the other and interpolates the box between them, which a
                      background class can only pop. The spring is this app's own
                      tab convention (stiffness 500 / damping 35), the same one
                      `UnderlineTabs` uses for its sliding underline.

                      ⚠️ The id carries `variant`. `NavTabs` renders twice — once
                      in the bar, once as the row beneath it — and both are
                      mounted at once with CSS hiding one. Two live elements
                      sharing a `layoutId` make framer animate between the
                      hidden copy and the visible one, which is this project's
                      documented `idNamespace` rule for exactly this reason. */}
                  {isActive && (
                    <motion.span
                      aria-hidden="true"
                      layoutId={`consumer-nav-pill-${variant}`}
                      className="absolute inset-0 rounded-[40px] bg-yellow-200"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 500, damping: 35 }
                      }
                    />
                  )}
                  {/* Above the pill, or the fill paints over the label. */}
                  {isActive && (
                    <Icon
                      aria-hidden="true"
                      className="relative z-10 hidden size-5 shrink-0 sm:block"
                    />
                  )}
                  <span className="relative z-10 truncate">{label}</span>
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
  /** The accessibility card hangs from the whole header, tab row included —
   *  see `AccessibilityMenu`'s own `anchorRef` note. */
  const headerRef = useRef<HTMLElement | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const accountTriggerRef = useRef<HTMLButtonElement | null>(null)

  /**
   * Round 49, direct instruction: the account menu "should show below the
   * header, and not overlay (just like it is done for accessibility sub menu)".
   *
   * So it hangs off the same virtual anchor `AccessibilityMenu` already uses,
   * and for the same measured reason: below 1200 the header is the bar PLUS the
   * nav tab row, so anchoring to the trigger drops the card 8px under the bar
   * and straight **on top of** the tabs. Opaque card, invisible in a
   * screenshot.
   *
   * `bottom` comes from the whole `<header>` (which knows its own height at
   * both breakpoints), `right` from the trigger (which already sits on this
   * portal's gutter — 24 below 1200, 80 above — so reading it gets the inset
   * for free). Recomputed on every reposition, so it survives a resize, a
   * scroll and the breakpoint change.
   */
  const accountAnchor = useMemo(
    () => ({
      getBoundingClientRect: () => {
        const header = headerRef.current?.getBoundingClientRect()
        const trigger = accountTriggerRef.current?.getBoundingClientRect()
        const bottom = header?.bottom ?? trigger?.bottom ?? 0
        const right = trigger?.right ?? header?.right ?? 0
        const left = trigger?.left ?? right
        const top = header?.top ?? bottom
        return {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
          top,
          right,
          bottom,
          left,
        } as DOMRect
      },
    }),
    [],
  )
  /* Read, not owned: the drawer is mounted once above the router so it can
     outlive this header, which every page remounts. See `consumerMenuReveal`. */
  const { open: menuOpen } = useConsumerMenu()
  const reduceMotion = useReducedMotion()

  /**
   * Publish the header's **real** height as `--consumer-chrome-h`, for anything
   * that sticks below it.
   *
   * ⚠️ `--consumer-header-h` is the bar only (72px). The tab row below it is
   * inside this same sticky header, so on a page that shows it the header is
   * 133px and a sticky element offset by 72px slides its top 61px under an
   * opaque white row — the reported "banner semi-hides when I scroll".
   *
   * ⚠️ **Measured, not a media query.** The row is `min-[1200px]:hidden`, so a
   * breakpoint looks sufficient and is not: `showNav` is a **per-page** choice
   * and the module player turns it off, so at 375px its header is 72px, and a
   * viewport-based 133px pushed that page's own sticky bar 61px too low. The
   * row is animated by `AnimatePresence` besides, so its height is not
   * constant even within one page. A `ResizeObserver` is correct on every page
   * and during the animation; the two facts it replaces were each wrong on one
   * page.
   *
   * Written on `documentElement` rather than passed down because the readers
   * are in sibling trees (`ConsumerShell`'s banner, the module page's own bar),
   * and cleaned back to the CSS fallback on unmount so a non-consumer portal
   * never inherits a stale height.
   */
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const write = () =>
      document.documentElement.style.setProperty(
        '--consumer-chrome-h',
        `${Math.round(el.getBoundingClientRect().height)}px`,
      )
    write()
    const ro = new ResizeObserver(write)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty('--consumer-chrome-h')
    }
  }, [])

  const navItemTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const }

  /**
   * The initials in the account disc — "Joan Whitfield" -> "JW".
   *
   * Derived from `accountLabel` rather than stored, so it cannot disagree with
   * the name the rest of the portal shows. Takes the first letter of the first
   * and last words: a middle name would otherwise produce three letters in a
   * 32px circle, and a single-word name correctly yields one.
   */
  const accountInitials = accountLabel
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part, i, all) => (i === 0 || i === all.length - 1 ? part[0] : ''))
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
  /**
   * Round 49, direct instruction: "Re-use the big icons (make them small just a
   * little), and improve the sub menu page buttons".
   *
   * These are now the hamburger drawer's own rows rather than a compact
   * dropdown list — icon, label, trailing chevron, generous hit area — so the
   * two places a consumer reaches My profile / Need help / Switch portal from
   * look like the same thing. One step down from the drawer at every size,
   * because this one sits in a 320px card rather than a full-screen sheet:
   * icons `size-7` against its `size-8`, chevron `size-6` against `size-7`,
   * label `consumer-lesson` (18 -> 20) against its `card-title-sm` (22), row
   * 60px against 72.
   */
  const accountItemClass =
    'flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-4 rounded-sm px-4 text-left text-ink outline-none transition-colors data-[highlighted]:bg-purple-50'

  return (
    <header ref={headerRef} className="sticky top-0 z-30 bg-white shadow-card">
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
      {/* The bar's height is `--consumer-header-h`, not a literal: the module
          page and the welcome screen both size a viewport-height column against
          it and `ConsumerCanvasWave` offsets its crest by it, so a number
          written here would have to be written in four places. The frames draw
          96 (`787:1329` mobile, `761:3171` desktop); Round 47 halved the logo on
          instruction and the bar came down to 72 with it — a fixed-height bar
          does not shrink just because its contents do. Side padding is the
          frames' own 24 -> 80. */}
      {/*
        Round 48 — at >=1200 this is a `1fr auto 1fr` GRID, not a flex row.

        Three attempts, and the two failures are worth keeping because they are
        opposite errors:
        1. `absolute left-1/2 -translate-x-1/2` centred the nav on the page, but
           out of flow it could overlap its neighbours, and with a 137px logo
           against a 355px right group the gaps read 292 / 74.
        2. A plain flex child centred it BETWEEN its neighbours — gaps 187 / 187
           — which is balanced by measurement and visibly left of the page
           centre, because the two sides are not the same width. Reported as
           "the buttons are off centre now", and correct.

        A grid with equal outer tracks gives what both attempts were reaching
        for: the middle track is page-centred, so the nav is too, and the side
        tracks are real layout rather than absolute positioning, so nothing can
        overlap anything. At 1281 each outer track is (1121 - 263) / 2 = 429,
        which comfortably holds the 137px logo and the 355px group.

        ⚠️ The outer tracks are equal, NOT sized to their content. If the right
        group ever grows past its track the nav stops being centred, so that is
        the number to re-measure if controls are added to it.
      */}
      <div className="relative flex h-[var(--consumer-header-h)] items-center justify-between px-6 min-[1200px]:grid min-[1200px]:grid-cols-[1fr_auto_1fr] min-[1200px]:px-20">
        {/* Compact only: the hamburger, **first in the row** so it sits at the
            left with the logo centred against it.

            It opens `ConsumerMenuDrawer` — a full-screen surface sliding down
            from the top — rather than the 220px dropdown that used to hang off
            it. The drawer now carries the destinations as well as the account
            actions, so the tab row beneath the bar is no longer the only way to
            reach Home and My Modules on a phone. */}
        <button
          ref={menuTriggerRef}
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => openConsumerMenu(dyadId)}
          className="flex size-11 shrink-0 items-center justify-center rounded-sm text-ink outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary min-[1200px]:hidden"
        >
          <MenuIcon aria-hidden="true" className="size-6" />
        </button>



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
          /* `min-h-9` and centred: the link used to inherit its height from the
             lockup, which was 52px and comfortably over the 36px floor. Round 47
             scaled the logo to 0.65 and the hit area went to 34 — under the
             floor on every page in the portal, caught by `layout-audit.js` and
             invisible to look at, because the logo itself is unchanged. The
             minimum only affects the box, never the artwork. */
          className="absolute left-1/2 flex min-h-9 -translate-x-1/2 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-consumer-primary min-[1200px]:static min-[1200px]:translate-x-0 min-[1200px]:justify-self-start"
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
        {/*
          ⚠️ **An empty middle track, and it is load-bearing.**
          `AnimatePresence` renders no wrapper of its own, so with the nav
          hidden the grid above drops to two children and the account cluster
          falls into the MIDDLE `auto` track — floating mid-bar instead of
          sitting at the right edge. That is the layout bug Round 48 hit when it
          first tried hiding the nav on the welcome screen, and it is the reason
          that attempt was abandoned rather than fixed.

          Round 49 hides the nav again on instruction ("home and module page
          should be hidden when its welcome journey"), so the track is held open
          explicitly instead. Grid-only: below 1200 the bar is a flex row and an
          extra zero-width child would add a `justify-between` gap.
        */}
        {!showNav && <div aria-hidden="true" className="hidden min-[1200px]:block" />}

        {/* Compact only: the accessibility trigger takes the slot that used to
            hold an empty `size-11` spacer — direct instruction, "on tablet show
            is on header on right after logo, stacked extreme right, and same on
            mobile".

            It is the same 44px the spacer was, which is why the centred logo
            stays centred: the balance the spacer existed to provide is now
            provided by a real control of identical width. Deleting the spacer
            and adding a differently-sized button would have shifted the logo
            off centre at every width below 1200. */}
        <AccessibilityMenu anchorRef={headerRef} className="min-[1200px]:hidden" />

        {/* Wide only: the account dropdown and the coral Sign Out. Both fold
            into the hamburger below 1200. */}
        {/* `gap-4` = 16px between the accessibility trigger and the account
            control — direct instruction, "move accessibility icon and my
            account closer, 16px". Log out takes back the original 24 through
            its own `ml-2`: it is the one destructive action in the group, and
            collapsing it into the same rhythm as the other two would make it
            read as a third equal option rather than a way out. */}
        {/* `col-start-3` pins this to the RIGHT track explicitly rather than
            letting it land wherever auto-placement puts it. Without it, any
            state that drops the nav leaves two children in a three-track grid
            and this cluster silently takes the middle track — which is exactly
            what happened on the welcome screen. Belt and braces: the welcome
            screen now shows the nav too, but a future `showNav={false}` caller
            should not be able to reintroduce the same bug. */}
        <div className="hidden items-center gap-4 min-[1200px]:flex min-[1200px]:col-start-3 min-[1200px]:justify-self-end">
          {/* First in the group, so it is the same distance from the right edge
              as the compact trigger is — the control does not appear to move
              across the breakpoint, it just gains neighbours. */}
          <AccessibilityMenu anchorRef={headerRef} />
          <Menu.Root>
            {/*
              Round 48, direct instruction — a bordered account control with an
              initials disc, "My account" and a chevron, plus Log out lifted back
              OUT of the menu as a ghost.

              Built on this portal's own system, not the reference's chrome
              ("make sure to stick with system UI"): the reference is navy, and
              blue maps onto the brand here by standing rule, so the border, the
              disc and the label are all `consumer-primary`. Height is the
              portal's 44px control, the radius is `rounded-3xl`, and the label
              is 16/600 off the consumer scale rather than the reference's own
              weight.

              ⚠️ **This reintroduces an avatar, which is an app-wide "no
              avatars" rule (Round 4.1).** It is a direct instruction and the
              rule is a project convention rather than an accessibility one, so
              it is taken — but it is taken knowingly and narrowly: initials
              only, no photograph, and only on this one control in one portal.
              Flagged rather than quietly reversed, because the next person will
              otherwise read it as drift.
            */}
            <Menu.Trigger
              ref={accountTriggerRef}
              className="group flex h-11 items-center gap-2 rounded-3xl border-2 border-consumer-primary bg-white pr-4 pl-1.5 text-consumer-primary outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2">
              {/* `aria-hidden`: the initials are a decorative restatement of the
                  signed-in name, and the trigger's own words already say what it
                  opens. Announcing "J W My account" would read as two labels. */}
              <span
                aria-hidden="true"
                /* `text-consumer-body-strong` (16/600), not the `text-[14px]` this
                    carried: 14px was the only render below this portal's 16px floor
                    anywhere in the app. Two initials at 16/600 measure ~20px wide
                    and still clear the 32px circle. */
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-consumer-primary text-consumer-body-strong text-white"
              >
                {accountInitials}
              </span>
              <span className="text-body-md">My account</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-data-[popup-open]:rotate-180"
              />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner
                anchor={accountAnchor}
                side="bottom"
                align="end"
                /* 12px, matching `AccessibilityMenu`'s own gap to the header —
                   the two cards hang off the same edge and a different offset
                   on each would read as one of them being misplaced. */
                sideOffset={12}
                className="z-50 outline-none"
              >
                {/* The accessibility card's chrome, deliberately: 16px radius,
                    `parchment` stroke and the app's warm `shadow-card`, not the
                    cool `ring-hairline` a dropdown had. Same surface, same
                    distance below the header, so they read as one pattern. */}
                <Menu.Popup
                  className={cn(
                    SUBMENU_CARD_MOTION,
                    'w-[320px] max-w-[calc(100vw-32px)] rounded-lg border border-parchment bg-white p-2 text-ink shadow-card outline-none',
                  )}
                >
                  {ACCOUNT_ROWS.map((row) => (
                    <Menu.Item
                      key={row.label}
                      onClick={() =>
                        navigate(row.to === 'switch' ? '/' : row.to(dyadId))
                      }
                      className={accountItemClass}
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        <row.icon
                          aria-hidden="true"
                          className="size-7 shrink-0 text-consumer-primary"
                          strokeWidth={1.75}
                        />
                        <span className="text-consumer-lesson min-w-0">{row.label}</span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="size-6 shrink-0 text-consumer-primary"
                      />
                    </Menu.Item>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>

          {/*
            Log out, outside the menu again — direct instruction, reversing the
            "keep it at the bottom of the dropdown" one message earlier. Ghost
            and red: no fill, no border, `destructive` text, underlined as the
            reference draws it.

            `destructive` `#d70015` rather than the `consumer-accent` coral the
            filled pill used. That is a real improvement rather than a swap:
            white on the coral measured **3.25:1** and failed AA at 16/600,
            where `destructive` on white is **5.38:1**. Red-as-text is also what
            makes a ghost read as destructive at all — a coral ghost would just
            look like a second brand colour.

            `underline` is load-bearing, not decoration: without a border or a
            fill, colour would be the only thing separating this from the label
            beside it, and colour alone is exactly what WCAG 1.4.1 forbids as a
            sole carrier.
          */}
          <button
            type="button"
            onClick={signOut}
            className="ml-2 flex h-11 shrink-0 items-center justify-center rounded-3xl px-3 text-body-md text-destructive underline underline-offset-4 outline-none transition-colors hover:bg-destructive/8 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          >
            Log out
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
