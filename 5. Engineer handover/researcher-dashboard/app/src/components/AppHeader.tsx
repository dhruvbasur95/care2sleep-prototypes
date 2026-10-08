import { Link } from 'react-router-dom'
import { Bell, ChevronDown } from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
import { cn } from '@/lib/utils'
import { researcher } from '@/data/research'

/**
 * Global header — the black bar above everything. Rendered once, by
 * `ResearchShell`; no page mounts it directly.
 *
 * This package ships the Research Dashboard only, so the header has a single
 * fixed treatment and no portal switcher. Every route lives under
 * `/research/*`.
 *
 * The signed-in identity comes from the hardcoded `researcher` object in
 * `data/research.ts`. There is no login, no session and no user id anywhere in
 * this package — this name is the entire identity surface, and it is the seam
 * a real auth integration attaches to.
 *
 * ⚠️ TWO CONTROLS HERE ARE DELIBERATELY INERT, and neither should be made to
 * look live until it has a backend:
 *  - The notification bell has never had a backing feed.
 *  - "Sign out" has nothing to sign out of. It used to navigate to `/`, which
 *    redirects straight back to Home, so pressing it visibly did nothing.
 *    `closeOnClick={false}` keeps the menu open so it does not mime success,
 *    and focus stays on the item rather than dropping to `<body>`.
 *
 * The bell is the one inert control in the package that does NOT follow the
 * app-wide convention (see `components/shared/InertButton.tsx`): it is a
 * `<span>`, so it is keyboard-unreachable and relies on a native `title`.
 * Wiring notifications up should also make it a real focusable control.
 *
 * The "Skip to main content" link targets `#main-content` on `ResearchShell`'s
 * `<main>`. That element carries `tabIndex={-1}` — without it a bare `id` is
 * not a focus target and the skip link moves the scroll position but not
 * focus. Do not remove either half.
 *
 * `fullBleed` drops the centered max-width so the header's side padding lines
 * up with an edge-to-edge page. No caller passes it today.
 */
export function AppHeader({ fullBleed = false }: { fullBleed?: boolean }) {
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
          to="/research"
          className="flex min-h-11 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-display text-body-md">
            Care2Sleep
          </span>
          <span aria-hidden="true" className="h-4 w-px bg-white/25" />
          <span className="text-fine text-on-dark-muted">
            Research Dashboard
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Inert: no notification feed exists. See the ⚠️ note above before
              changing this into a real button. */}
          <span
            className="flex size-11 items-center justify-center text-on-dark-muted"
            title="Notifications (coming soon)"
          >
            <Bell aria-hidden="true" className="size-[18px]" />
            <span className="sr-only">Notifications (coming soon)</span>
          </span>

          <Menu.Root>
            <Menu.Trigger className="group flex min-h-11 items-center gap-1 rounded-sm text-fine text-on-dark-muted outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:text-white">
              <span className="hidden sm:inline">{researcher.fullName}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-3.5 transition-transform group-data-[popup-open]:rotate-180"
              />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50 outline-none">
                <Menu.Popup className="min-w-[180px] rounded-sm bg-card p-1 text-caption text-ink shadow-card ring-1 ring-hairline outline-none">
                  {/* Unwired, not dead. Keep all three parts: `aria-disabled`
                      and the `sr-only` cue tell a screen-reader user nothing
                      will happen, and `closeOnClick={false}` stops the menu
                      dismissing itself as though something had. Focus stays on
                      the item rather than falling to `<body>`. */}
                  <Menu.Item
                    aria-disabled="true"
                    closeOnClick={false}
                    className="flex min-h-9 cursor-default items-center rounded-sm px-3 text-ink-faint outline-none data-[highlighted]:bg-pearl"
                  >
                    Sign out
                    <span className="sr-only"> (coming soon)</span>
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </header>
  )
}
