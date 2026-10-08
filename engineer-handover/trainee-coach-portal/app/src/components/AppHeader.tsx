import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Bell, ChevronDown } from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { coach } from '@/data/portal'
import { signOutOfTraining } from '@/data/auth'

/**
 * Global header — black bar per design-tokens.md §7 `header`.
 * The notification bell is an inert placeholder on both portals: rendered
 * as a non-interactive element so it's never announced as a button to
 * assistive tech.
 *
 * `portal` selects the chrome for the surface being shown:
 * - `training-v2` (default) — the module overview/player pages reached from
 *   the Coach Delivery Portal's Learning tab (the standalone Coach Training
 *   Portal home these once belonged to is retired — this label just
 *   describes the training content on screen now, and its wordmark links
 *   back to `/delivery/learning`, not a `/training-v2` home that no longer
 *   exists). No profile page yet, so "Edit profile" stays absent from the
 *   account menu entirely.
 * - `delivery` — Coach Delivery Portal (Round 6.1): switch-portal link, the
 *   signed-in coach's name via `accountLabel` (Helen Zhang this round — no
 *   delivery-portal profile page yet, "Edit profile" stays disabled, same
 *   treatment as Research's account menu)
 * - `switcher` — the baseline portal-switcher screen: wordmark only
 *
 * Handover package: the `research` and `consumer` variants were removed with
 * the portals they dressed. They are gone rather than left unused because
 * each carried a home link (`/research`, `/consumer`) to a route that no
 * longer exists in this package — a dead branch that still reads as a
 * supported option.
 *
 * `fullBleed` drops the centered max-width so the header's side padding
 * lines up with edge-to-edge page layouts (e.g. the in-module page, whose
 * side nav and footer run flush to the viewport edge). Centered pages
 * use the default, which matches their own centered max-w-[1200px] column.
 *
 * **Round 4.1 (Dhruv, UI edit):** the research portal's account area was an
 * inert "Account (coming soon)" span. Replaced with a real `Menu` dropdown
 * (same base-ui primitive + visual grammar as the "more actions" menu on
 * Coach Profile) with "Edit profile" and "Sign out" (navigates to the
 * portal switcher, the closest stand-in for a logged-out state in a
 * prototype with no real auth). Training then had the *opposite* problem —
 * it hadn't been brought in line with this new structure, and duplicated
 * "Account" (inert span) + a separate "Profile" link side by side. Both
 * portals now render one shared block (`Switch portal` + bell + one `Menu`
 * dropdown), varying only in the account name shown and whether "Edit
 * profile" is a live link or disabled. (That "training → /training/profile"
 * live link was Option A's — Option A and its profile page are gone; no
 * portal currently has a profile page, so `profilePath` is always `null`.)
 */
export function AppHeader({
  portal = 'training-v2',
  fullBleed = false,
  accountLabel,
}: {
  portal?: 'training-v2' | 'delivery' | 'switcher'
  fullBleed?: boolean
  /** Delivery portal only — the signed-in coach's display name (no static import to fall back to, unlike training). */
  accountLabel?: string
}) {
  const navigate = useNavigate()
  const home =
    portal === 'training-v2' ? '/delivery/learning' : portal === 'delivery' ? '/delivery' : '/'
  const label =
    portal === 'training-v2'
      ? 'Coach Training Portal'
      : portal === 'delivery'
        ? 'Coach Delivery Portal'
        : null
  const accountName = portal === 'delivery' ? (accountLabel ?? '') : coach.fullName
  // No portal has a profile page yet — kept as an explicit `null` (not
  // removed outright) since the "Edit profile" menu item below is already
  // written to gracefully omit itself when this is null.
  const profilePath: string | null = null

  return (
    <header className="sticky top-0 z-30 bg-header text-white">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-primary px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to main content
      </a>
      <div
        className={cn(
          'flex h-12 items-center justify-between px-4 md:px-8',
          !fullBleed && 'mx-auto max-w-[1200px] px-6',
        )}
      >
        <Link
          to={home}
          className="flex min-h-11 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-display text-body-md">
            Care2Sleep
          </span>
          {label && (
            <>
              <span aria-hidden="true" className="h-4 w-px bg-white/25" />
              <span className="text-fine text-on-dark-muted">
                {label}
              </span>
            </>
          )}
        </Link>

        {(portal === 'training-v2' || portal === 'delivery') && (
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="/"
              className="flex min-h-11 items-center gap-1.5 rounded-sm text-fine text-link-on-dark outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeftRight aria-hidden="true" className="size-3.5" />
              Switch portal
            </Link>

            {/* Inert placeholder — notifications (coming soon) */}
            <span
              className="flex size-11 items-center justify-center text-on-dark-muted"
              title="Notifications (coming soon)"
            >
              <Bell aria-hidden="true" className="size-[18px]" />
              <span className="sr-only">Notifications (coming soon)</span>
            </span>

            <Menu.Root>
              {/* HANDOVER PACKAGE ONLY — accessibility fix, WCAG 4.1.2.
                  The name below is `hidden sm:inline`, so under 640px it is
                  `display:none` and leaves the a11y tree. The only remaining
                  child is an `aria-hidden` chevron, so the control had NO
                  accessible name at all on mobile — measured as the only
                  unnamed control on the page. `aria-label` names it at every
                  width; the visible span still carries the label above `sm`,
                  and `aria-label` correctly wins for assistive tech either way. */}
              <Menu.Trigger
                aria-label={`${accountName} — account menu`}
                className="group flex min-h-11 items-center gap-1 rounded-sm text-fine text-on-dark-muted outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:text-white"
              >
                <span className="hidden sm:inline">{accountName}</span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-3.5 transition-transform group-data-[popup-open]:rotate-180"
                />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50 outline-none">
                  <Menu.Popup className="min-w-[180px] rounded-sm bg-card p-1 text-caption text-ink shadow-card ring-1 ring-hairline outline-none">
                    {profilePath && (
                      <>
                        <Menu.Item
                          onClick={() => navigate(profilePath)}
                          className="flex min-h-9 cursor-pointer items-center rounded-sm px-3 text-ink-muted outline-none data-[highlighted]:bg-pearl data-[highlighted]:text-ink"
                        >
                          Edit profile
                        </Menu.Item>
                        <Separator className="my-1" />
                      </>
                    )}
                    <Menu.Item
                      onClick={() => {
                        signOutOfTraining()
                        navigate('/')
                      }}
                      className="flex min-h-9 cursor-pointer items-center rounded-sm px-3 text-ink-muted outline-none data-[highlighted]:bg-pearl data-[highlighted]:text-ink"
                    >
                      Sign out
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        )}
      </div>
    </header>
  )
}
