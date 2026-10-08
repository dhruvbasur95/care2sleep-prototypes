import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  CalendarDays,
  GraduationCap,
  Home,
  NotebookText,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCoachStage } from '@/data/coachStage'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Coach Delivery Portal hub navigator (Round 6.1). Same collapsible-left-
 * sidebar chassis as `ConsumerSidebar`/`ResearchSidebar` (design-tokens.md
 * §10 `sidebar-nav`). Round 6.2 (§9 amendment) removed the 4 inert
 * placeholders this sidebar carried since Round 6.1 (Consumers, Sessions,
 * Reflective Tool, Supervision) outright — each concept now maps onto one of
 * the per-consumer detail page's 4 tabs instead of needing its own top-level
 * destination. Round 6.2.1 adds the coach's own **Account** tab, refactoring
 * this sidebar from a single hardcoded Home link into the same `links`-array
 * pattern `ConsumerSidebar` already uses.
 *
 * **Round 29 (Figma `370:6647`) — coach portal only.** This sidebar diverges
 * from `ResearchSidebar`/`ConsumerSidebar` for the first time: it is no longer
 * a flush white full-height panel but a *floating card* — `purple-200`, 16px
 * radius, `shadow-card`, 200px wide — inset 24px from the viewport by
 * `DeliveryShell`. The other two portals are deliberately untouched.
 *
 * Measured deltas from the frame: 240px -> 200px wide, 20px -> 24px icons,
 * 10px -> 16px icon/label gap, 14px -> 16px labels, 4px -> 32px between items,
 * and the header row's `border-b` removed (a rule across a rounded card reads
 * as a seam). Active is `primary` at 600, idle `ink` at 400.
 *
 * Two deliberate overrides of the frame:
 * - The toggle button stays **36px** (`size-9`), not the frame's 32px. The
 *   36px control floor is a non-negotiable enforced in Rounds 3.1/10/18; the
 *   icon inside is still 20px, so it reads identically.
 * - Icons are `lucide-react`, never the frame's exported SVGs (CLAUDE.md).
 *
 * The collapsed state has no frame of its own — the design draws only the
 * expanded 200px variant — so the pre-existing collapse behaviour is kept and
 * restyled onto the card.
 */

const COLLAPSE_KEY = 'c2s-delivery-nav-collapsed'

interface DeliveryLink {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
  /** No destination built yet. Renders as a focusable `aria-disabled` row with
   *  an `sr-only` "(coming soon)" cue rather than a link to a blank route —
   *  CLAUDE.md's unwired-control rule, which exists precisely so a nav item
   *  cannot take focus and then silently do nothing. `to` is still required and
   *  still the route this will claim, so wiring it later is deleting one flag. */
  pending?: boolean
  /** `data-tour` anchor key for the first-run tour, if this row is one of its
   *  stops. See `data/deliveryTour`. */
  tour?: string
  /** Shown only once the trainee is a certified coach (Round 40). Distinct
   *  from `pending`: that means "built later", this means "not yours yet". */
  coachOnly?: boolean
}

/**
 * Frame `542:1598` — three items: Home, My Learning, My Profile.
 *
 * **"My meetings" was gone from the nav** between Round 30 and Round 40: the
 * frame's Home page carries a "My meeting" card of its own, so a trainee's copy
 * of the tab's content had a home on the page that replaced it. The route was
 * left mounted throughout, which is what made restoring it a one-entry change.
 * Round 40 brought it back as **"My schedule", coach only** — see the entry's
 * own note below for why the trainee still does not get it.
 *
 * "My Training" -> "My Learning" restores frame `403:1273`'s original label,
 * which a later Round 29 instruction had overridden. The route stays
 * `/delivery/learning` — renaming it would break every existing link into the
 * module overview and player for a label change.
 *
 * **"My Notes"** was added as a provision when it was still hidden in the frame,
 * and is now a real destination (`638:12057`). It sits above My Profile because
 * Profile is account chrome and conventionally sits last — which is also where
 * frame `638:12057`'s own nav puts it. `NotebookText`, deliberately not the
 * `NotebookPen` the Home rail uses for the reflection stage: notes and
 * reflections are different things and should not share a glyph in one portal.
 *
 * The `pending` flag it used to carry is kept on the type, unused — it is the
 * documented treatment for the next nav row that gets drawn before it is built.
 */
const links: DeliveryLink[] = [
  { to: '/delivery', label: 'Home', icon: Home, end: true },
  /* Round 40, direct instruction: unhidden. `/delivery/meetings` has been
     mounted-but-unlinked since Round 30 pulled it from the nav, and the page
     itself never stopped working — this restores the entry rather than
     rebuilding anything.

     **Coach only.** The page already branches by stage, but a trainee's half of
     it duplicates the group-practice rows their Home page's own meeting card
     carries, which is exactly why Round 30 removed the row. A coach's does not:
     client sessions across a whole caseload have nowhere else to be listed
     together. */
  {
    to: '/delivery/meetings',
    /* Title case, matching its three siblings — the nav's own convention,
       even though the pages they open are sentence case ("My notes"). */
    label: 'My Schedule',
    icon: CalendarDays,
    end: true,
    coachOnly: true,
    tour: 'nav-schedule',
  },
  // Round 32: `tour` is the first-run tour's anchor key. It lives on the link
  // rather than in the markup so the collapsed and expanded rows — two separate
  // `NavLink`s — cannot end up anchoring different elements.
  { to: '/delivery/learning', label: 'My Learning', icon: GraduationCap, end: true, tour: 'nav-learning' },
  { to: '/delivery/notes', label: 'My Notes', icon: NotebookText, end: true, tour: 'nav-notes' },
  { to: '/delivery/account', label: 'My Profile', icon: UserRound, end: false, tour: 'nav-profile' },
]

export function DeliverySidebar() {
  const stage = useCoachStage()
  const visibleLinks = links.filter((l) => !l.coachOnly || stage === 'coach')
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1',
  )

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <aside
      className={cn(
        // Frame `370:6647`: a floating card, not a flush panel.
        'sticky z-10 shrink-0 overflow-hidden rounded-xl bg-purple-200 transition-[width] duration-200 ease-out',
        // Frame `542:1598` gives the card a **neutral** grey shadow, not this
        // app's warm gold `shadow-card` — a gold cast reads as a smudge against
        // a purple ground. No stroke either; the frame draws none.
        'shadow-[2px_4px_16px_0px_rgba(85,85,85,0.1)]',
        // One offset in every state: the 48px header is always rendered now, so
        // the card sits 48px + the shell's own 24px inset from the top and
        // never moves when onboarding ends. (An earlier pass had a second,
        // headerless offset for the welcome flow; the header coming back
        // retired it.)
        'top-18 h-[calc(100dvh-3rem-48px)]',
        collapsed ? 'w-16' : 'w-50',
      )}
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'flex h-16 items-center px-4',
            collapsed ? 'justify-center' : 'justify-end',
          )}
        >
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls="delivery-nav"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            // `pearl` is a cool grey and reads as a foreign patch on the warm
            // purple card (Round 28's finding, same shape). `purple-50` is the
            // ramp's own next step up from `purple-200` — a lighter tint reads
            // more clearly than a darker one, which muddies against the card.
            // The brand ramp skips 100, so 50 is the neighbour. Note
            // `bg-purple-100` would still *render* — Tailwind v4's own default
            // palette fills an undefined brand step silently, with a hue that
            // is in no Figma swatch (Round 40).
            className="flex size-9 items-center justify-center rounded-sm text-ink outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="size-5" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-5" strokeWidth={1.75} />
            )}
          </button>
        </div>

        <nav
          id="delivery-nav"
          aria-label="Coach Delivery Portal"
          // Frame `370:6654` puts the first 24px icon's centre 108px below the
          // card top (64px header + 32px list inset + half the icon). Our rows
          // are 36px tall rather than the frame's bare 24px — the control-height
          // floor — so the list inset is 26px, not 32px, to land the icon on the
          // same line: 64 + 26 + 18 = 108.
          className={cn('flex-1 overflow-y-auto pt-[26px]', collapsed ? 'px-3' : 'px-6')}
        >
          <TooltipProvider>
            {visibleLinks.map((link) => {
              return collapsed ? (
                <Tooltip key={link.to}>
                  <TooltipTrigger
                    render={
                      link.pending ? (
                        <button
                          type="button"
                          aria-disabled="true"
                          aria-label={link.label}
                          onClick={(e) => e.preventDefault()}
                          className="mt-2 flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-sm text-ink outline-none transition-colors first:mt-0 hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      ) : (
                        <NavLink
                          to={link.to}
                          end={link.end}
                          aria-label={link.label}
                          data-tour={link.tour}
                          className={({ isActive }) =>
                            cn(
                              'mt-2 flex min-h-11 items-center justify-center rounded-sm outline-none transition-colors first:mt-0 focus-visible:ring-2 focus-visible:ring-ring',
                              isActive
                                ? 'bg-purple-50 text-primary'
                                : 'text-ink hover:bg-purple-50',
                            )
                          }
                        />
                      )
                    }
                  >
                    <link.icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
                  </TooltipTrigger>
                  {/* Collapsed, the label lives only in the tooltip and the
                      `aria-label`, so the "coming soon" cue has to ride along
                      with it or a collapsed nav silently loses the one signal
                      that this row is inert. */}
                  <TooltipContent side="right">
                    {link.label}
                    {link.pending && ' (coming soon)'}
                  </TooltipContent>
                </Tooltip>
              ) : link.pending ? (
                <button
                  key={link.to}
                  type="button"
                  aria-disabled="true"
                  onClick={(e) => e.preventDefault()}
                  className="mt-5 -mx-2 flex min-h-9 w-[calc(100%+1rem)] cursor-not-allowed items-center gap-4 rounded-sm px-2 text-left text-body text-ink outline-none transition-colors first:mt-0 hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <link.icon aria-hidden="true" className="size-6 shrink-0" strokeWidth={1.75} />
                  <span className="flex-1 whitespace-nowrap">{link.label}</span>
                  <span className="sr-only">(coming soon)</span>
                </button>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  data-tour={link.tour}
                  className={({ isActive }) =>
                    cn(
                      // Frame item tops are 32 / 88 / 144 — a 56px pitch. Rows
                      // are 36px (the control floor, above the frame's bare
                      // 24px), so the gap is 20px to keep 36 + 20 = 56 exact.
                      // 16px icon/label gap, 16px labels. `-mx-2 px-2` widens
                      // the hover/focus surface without shifting the icons off
                      // the frame's own 24px inset.
                      'mt-5 -mx-2 flex min-h-9 items-center gap-4 rounded-sm px-2 outline-none transition-colors first:mt-0 focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'text-body-md text-primary'
                        : 'text-body text-ink hover:bg-purple-50',
                    )
                  }
                >
                  <link.icon aria-hidden="true" className="size-6 shrink-0" strokeWidth={1.75} />
                  <span className="flex-1 whitespace-nowrap">{link.label}</span>
                </NavLink>
              )
            })}
          </TooltipProvider>
        </nav>
      </div>
    </aside>
  )
}
