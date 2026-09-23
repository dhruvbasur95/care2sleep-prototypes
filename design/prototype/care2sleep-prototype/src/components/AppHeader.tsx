import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Bell, LogOut } from 'lucide-react'
import { Care2SleepLogo } from '@/components/shared/Care2SleepLogo'
import { AccountMenu } from '@/components/shared/AccountMenu'
import { cn } from '@/lib/utils'
import { coach } from '@/data/portal'
import { researcher } from '@/data/research'
import { signOutOfTraining } from '@/data/auth'

/**
 * Global header — black bar per design-tokens.md §7 `header`.
 * The notification bell is an inert placeholder on both portals: rendered
 * as a non-interactive element so it's never announced as a button to
 * assistive tech.
 *
 * Round 47, direct instruction: **the portal name no longer sits beside the
 * lockup** ("no need to say coach training portal"). `portal` still selects the
 * home destination and the account name; it no longer selects a label, because
 * there is none.
 *
 * `portal` selects the chrome for the surface being shown:
 * - `training-v2` (default) — the module overview/player pages reached from
 *   the Coach Delivery Portal's Learning tab (the standalone Coach Training
 *   Portal home these once belonged to is retired — this label just
 *   describes the training content on screen now, and its wordmark links
 *   back to `/delivery/learning`, not a `/training-v2` home that no longer
 *   exists). No profile page yet, so "Edit profile" stays absent from the
 *   account menu entirely.
 * - `research` — Research Dashboard: switch-portal link, researcher account
 * - `consumer` — Consumer Portal (Round 5): switch-portal link, the signed-in
 *   dyad's name via `accountLabel` (no profile page yet, "Edit profile" stays
 *   disabled — same treatment as Research's account menu today)
 * - `delivery` — Coach Delivery Portal (Round 6.1): switch-portal link, the
 *   signed-in coach's name via `accountLabel` (Helen Zhang this round — no
 *   delivery-portal profile page yet, "Edit profile" stays disabled, same
 *   treatment as Research's account menu)
 * - `switcher` — the baseline portal-switcher screen: wordmark only
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
  portal?: 'training-v2' | 'research' | 'consumer' | 'delivery' | 'switcher'
  fullBleed?: boolean
  /** Consumer/Delivery portals only — the signed-in dyad's/coach's display name (no static import to fall back to, unlike training/research). */
  accountLabel?: string
}) {
  const navigate = useNavigate()
  const home =
    portal === 'research'
      ? '/research'
      : portal === 'training-v2'
        ? '/delivery/learning'
        : portal === 'consumer'
          ? '/consumer'
          : portal === 'delivery'
            ? '/delivery'
            : '/'
  const accountName =
    portal === 'consumer' || portal === 'delivery'
      ? (accountLabel ?? '')
      : portal === 'research'
        ? researcher.fullName
        : coach.fullName
  return (
    /* Round 47, direct instruction: the trainee and coach portals re-use the
       header with the C2S logo. The bar had to come off `bg-header` (black) to
       do it — the lockup is purple `#3A00AD` and measures **1.78:1** on black,
       which is not a logo, it is a smudge. It is now the Consumer Portal's own
       treatment: white surface, warm card shadow, no bottom rule.

       ⚠️ The height stays this app's 48px rather than the consumer bar's 72.
       That bar's height is a CSS variable four other things offset from; this
       one is `sticky top-0` under pages that already reserve space against it
       (`lg:top-24` on My Learning's right rail, for one). Growing it is a
       separate, measurable change, not a side effect of a colour swap. */
    <header className="sticky top-0 z-30 bg-white text-ink shadow-card">
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
          aria-label="Care2Sleep home"
          className="flex min-h-11 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* The lockup is `aria-hidden` inside the link, so the link needs its
              own accessible name — the same contract every other call site of
              this logo uses. */}
          <Care2SleepLogo maxWidth={116} />
        </Link>

        {(portal === 'training-v2' || portal === 'research' || portal === 'consumer' || portal === 'delivery') && (
          <div className="flex items-center gap-2 md:gap-4">
            {/* Inert placeholder — notifications (coming soon) */}
            <span
              className="flex size-11 items-center justify-center text-ink-muted"
              title="Notifications (coming soon)"
            >
              <Bell aria-hidden="true" className="size-[18px]" />
              <span className="sr-only">Notifications (coming soon)</span>
            </span>

            {/* Round 47, direct instruction: the trainee/coach header re-uses
                the Consumer Portal's account control and its sub-menu card.
                What used to sit here was a bare text trigger with a chevron. */}
            <AccountMenu
              name={accountName}
              actions={[
                { label: 'Switch portal', icon: ArrowLeftRight, onSelect: () => navigate('/') },
                {
                  label: 'Sign out',
                  icon: LogOut,
                  destructive: true,
                  onSelect: () => {
                    signOutOfTraining()
                    navigate('/')
                  },
                },
              ]}
            />
          </div>
        )}
      </div>
    </header>
  )
}
