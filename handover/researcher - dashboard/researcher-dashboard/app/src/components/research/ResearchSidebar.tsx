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
 * The dashboard's left navigator. Rendered once, by `ResearchShell`.
 *
 * Five destinations, all flat leaves — Home, and one per managed population
 * (Trainee Management, Consumer Management, Coach Management), plus My
 * Profile. There are no sub-lists and no accordion: every detail view (a
 * trainee, a consumer, a coach) is a row-click drill-in from its roster, not a
 * nav destination.
 *
 * The icon vocabulary is deliberate and worth preserving: a **person** icon
 * means *you* (My Profile), and the three managed populations use metaphor
 * objects instead (GraduationCap = still training, BadgeCheck = certified and
 * delivering, HeartHandshake = consumers). Introducing a second person
 * silhouette collides with My Profile at 20px, which is how the previous
 * Coach Management icon was chosen and rejected.
 *
 * ⚠️ The collapsed state persists to a single fixed `localStorage` key with no
 * namespacing by user or environment. That is fine for a single-user
 * prototype; it needs a per-user key once real auth exists. It is also the
 * only persistence anywhere in this package.
 *
 * Collapsed items are icon-only, so each carries an explicit `aria-label` and
 * a real `Tooltip` — not a native `title`, which appears too slowly to be a
 * usable label and cannot be styled. One `TooltipProvider` wraps the whole nav
 * so moving between adjacent icons reads as one group rather than restarting
 * the delay each time.
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
          {/* Home. The `/research/schedule` route is historical — the page
              began as "My Schedule". Renaming it is safe if you have no
              external references, but nothing user-visible depends on it. */}
          <AreaLink
            icon={Home}
            label="Home"
            collapsed={collapsed}
            to="/research/schedule"
          />

          {/* Trainee Management — coaches moving through the COACH training
              pathway.

              ⚠️ Its drill-in lives at `/research/coaches/:id`, NOT under
              `/research/trainees`, so this link does not stay highlighted on a
              trainee record page the way the other two population links do on
              theirs. If the record route is ever moved under `/research/
              trainees`, drop `end` or the link will stop lighting up there. */}
          <div className="mt-4">
            <AreaLink
              icon={GraduationCap}
              label="Trainee Management"
              collapsed={collapsed}
              end
              to="/research/trainees"
            />
          </div>

          {/* Consumer Management. Its drill-in is `/research/consumers/:id`, a
              sub-path, so the link stays highlighted there for free. */}
          <div className="mt-4">
            <AreaLink
              icon={HeartHandshake}
              label="Consumer Management"
              collapsed={collapsed}
              to="/research/consumers"
            />
          </div>

          {/* Coach Management — certified coaches delivering under SPACES.
              Drill-in is `/research/spaces-coaches/:id`, again a sub-path.

              `BadgeCheck` is chosen against the icon rule above: it is not a
              person silhouette (so it cannot collide with My Profile), and it
              says the thing that actually separates this population from
              Trainee Management directly above — they are certified.
              GraduationCap -> BadgeCheck reads as one progression. */}
          <div className="mt-4">
            <AreaLink
              icon={BadgeCheck}
              label="Coach Management"
              collapsed={collapsed}
              to="/research/spaces-coaches"
            />
          </div>

          {/* My Profile — the signed-in researcher. The one person icon in
              this nav; see the icon rule in the file header. */}
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

/** One nav destination. A real `NavLink` in both collapse states — collapsed
 *  renders icon-only with an `aria-label` and a tooltip, expanded renders icon
 *  + label.
 *
 *  `end` (default `false`) makes the link match its exact path only. Leave it
 *  off when a page's drill-in route is a sub-path of `to`, so the link stays
 *  highlighted on the detail page too. */
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

