import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BadgeCheck,
  GraduationCap,
  HeartHandshake,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Research Dashboard hub navigator (Round 2.1, renamed Round 2.2.1) — a
 * collapsible left sidebar that replaces the old top program bar + horizontal
 * section tabs.
 *
 * The dashboard is a hub across three participant populations:
 * - **Consumer Management** — people receiving sleep coaching (Round 4: the
 *   Consumer Management Table — a single-destination leaf, no sub-list; the
 *   consumer detail view is a row-click drill-in, not a nav destination)
 * - **Trainee Management** — coaches moving through the COACH training
 *   pathway (a single-destination leaf, same treatment as Consumer
 *   Management/Coaches below)
 * - **Coaches** — certified coaches delivering under SPACES (Round 3: the
 *   Coach Management Table — a single-destination leaf, no sub-list)
 *
 * "Program 1 / Program 2" naming is retired (Dhruv, Round 2.1). "Trainees" /
 * "Coaches" (roster) area+sub-view naming, which collided with the
 * certified-Coaches area, was replaced by "Training Pipeline" / "Recruitment
 * (EOI)" + "Trainee progress" (Dhruv, Round 2.2.1) — then, once the
 * Recruitment (EOI) review queue was retired in favour of directly onboarding
 * coach trainees, "Training Pipeline" collapsed back down to the single
 * "Trainee Management" leaf it is today: a real route-driven accordion no
 * longer has anything to expand into. Grammar is design-tokens.md §10/§13
 * `sidebar-nav`, which reuses the §7 `side-nav` tokens.
 *
 * **Round 4.1 (Dhruv, UI edit):** collapsed (icon-only) nav items relied on
 * the native `title` attribute for a hover label, which is slow to appear
 * and unstyled. Replaced with the app's own `Tooltip` primitive (base-ui,
 * previously unused in the app), rendered to the right of the icon via a
 * `Portal` so it isn't clipped by the nav's `overflow-y-auto`. One shared
 * `TooltipProvider` wraps the collapsed nav so hovering between adjacent
 * icons feels like one continuous group rather than 3 independent delays.
 */

const COLLAPSE_KEY = 'c2s-research-nav-collapsed'

export function ResearchSidebar() {
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
        'sticky top-12 z-10 h-[calc(100dvh-3rem)] shrink-0 border-r border-hairline bg-card transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-full flex-col">
        {/* Collapse toggle */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-hairline px-3',
            collapsed ? 'justify-center' : 'justify-end',
          )}
        >
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls="research-nav"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="flex size-9 items-center justify-center rounded-sm text-ink-muted outline-none transition-colors hover:bg-pearl hover:text-ink focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="size-5" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-5" strokeWidth={1.75} />
            )}
          </button>
        </div>

        <nav
          id="research-nav"
          aria-label="Research Dashboard"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <TooltipProvider>
          {/* Home — the researcher's own landing page. Rebuilt in Round 21
              from a supplied Figma frame: a tinted welcome band + Quick Links
              bar, a "Study overview" stat row, the study-wide attention
              section, and a tabbed day-grouped meetings table.

              Renamed twice, both on direct instruction: "My Schedule" →
              "My Home" (Round 17, since the page was never just a calendar;
              icon moved Calendar → Home to match) → **"Home"** (Round 21, to
              match the Figma frame's own nav label). The route is
              deliberately left as `/research/schedule`: it's internal, no
              user ever sees it, and changing it would churn every link and
              tour anchor for no visible gain. */}
          <AreaLink
            icon={Home}
            label="Home"
            collapsed={collapsed}
            to="/research/schedule"
          />

          {/* Trainee Management — coaches moving through the COACH training
              pathway. Direct-onboarding replaced the old Recruitment (EOI)
              review queue, so this collapsed from a 2-child accordion
              ("Training Pipeline") back down to a single destination, same
              treatment as Consumer Management/Coaches below. */}
          <div className="mt-4">
            <AreaLink
              icon={GraduationCap}
              label="Trainee Management"
              collapsed={collapsed}
              end
              to="/research/trainees"
            />
          </div>

          {/* Consumer Management — active leaf area, Round 4 (Consumer
              Management Table + enroll flow). One destination, like Coaches
              below — the consumer detail view is a row-click drill-in, not a
              nav destination, so this never grows a sub-list either. */}
          <div className="mt-4">
            <AreaLink
              icon={HeartHandshake}
              label="Consumer Management"
              collapsed={collapsed}
              to="/research/consumers"
            />
          </div>

          {/* Coaches (certified / SPACES) — active leaf area, Round 3. One
              destination (the Coach Management Table); the coach profile is
              a row-click drill-in, not a nav destination.

              Icon changed twice in Round 17, both on direct feedback.
              `UserRoundCheck` → `HeadsetIcon` → `BadgeCheck`.

              The first change fixed a real collision: `UserRoundCheck` was
              indistinguishable from My Profile's own `UserRound`, being the
              same single-person silhouette differing only by a small check
              badge that disappears at 20px. The rest of this nav uses
              *metaphor objects* rather than people (GraduationCap for
              trainees, HeartHandshake for consumers), reserving a person icon
              for "you" — so any second person silhouette was always going to
              collide.

              `HeadsetIcon` solved the collision but read as a call-centre
              agent, which is the wrong register for a Monash research study.
              `BadgeCheck` keeps the non-person silhouette and says the right
              thing: what distinguishes this population from Trainee
              Management directly above is precisely that they are
              *certified*. GraduationCap (still learning) → BadgeCheck
              (qualified, now delivering) reads as one progression. The check
              mark here is incidental to a badge/rosette base shape, so it
              doesn't reintroduce the `UserRoundCheck` problem, which was
              about the base shape being a person. */}
          <div className="mt-4">
            <AreaLink
              icon={BadgeCheck}
              label="Coach Management"
              collapsed={collapsed}
              to="/research/spaces-coaches"
            />
          </div>

          {/* My Profile (renamed from Account, Round 10) — the signed-in
              researcher's own profile (Round 6.2.1). */}
          <div className="mt-4">
            <AreaLink
              icon={UserRound}
              label="My Profile"
              collapsed={collapsed}
              to="/research/account"
            />
          </div>
          </TooltipProvider>
        </nav>
      </div>
    </aside>
  )
}

/** An active, single-destination leaf area (Consumer Management / Trainee
 *  Management / Coaches) — a real NavLink at every collapse state.
 *
 *  `end` (default `false`, matching the original 2 leaf areas' behaviour)
 *  controls whether this link also stays highlighted on a drilled-in detail
 *  route below it (e.g. Coaches → `/research/spaces-coaches/:coachId`, which
 *  works for free since that's a distinct sub-path). Trainee Management is
 *  the one exception: its `to` is the bare `/research` root — a prefix of
 *  *every* research route — so it opts into `end` to avoid lighting up on
 *  every other area's page too. */
function AreaLink({
  icon: Icon,
  label,
  collapsed,
  to,
  end = false,
}: {
  icon: LucideIcon
  label: string
  collapsed: boolean
  to: string
  end?: boolean
}) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-ink-muted hover:bg-pearl hover:text-ink',
                )
              }
            />
          }
        >
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-2.5 rounded-sm px-2 text-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'font-semibold text-primary'
            : 'font-normal text-ink-muted hover:bg-pearl hover:text-ink',
        )
      }
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
      <span className="flex-1">{label}</span>
    </NavLink>
  )
}

