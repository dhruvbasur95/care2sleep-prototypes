import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * ⚠️ THE UNWIRED-CONTROL CONVENTION. Read this before wiring anything up.
 *
 * The design deliberately draws controls that have **no write path behind them
 * yet**. The rule is that such a control is never omitted and never silently
 * dead: it renders as a focusable `aria-disabled` button carrying an `sr-only`
 * "(coming soon)" cue.
 *
 * This component is the shared implementation, and the fastest index of the
 * work still to do: `grep -rn InertButton src`.
 *
 * ⚠️ It is not the whole list. Eight more controls follow the same convention
 * hand-rolled, because they are links or icon buttons rather than pills.
 * `grep -rn "coming soon" src` finds those too. Do not treat an absence from
 * this file as proof a control is live.
 *
 * WHAT EACH INERT CONTROL IS WAITING ON
 *
 *  Via this component:
 *  | Control                     | Where                         | Needs |
 *  |-----------------------------|-------------------------------|-------|
 *  | `Edit` / `Delete` (per row) | `MeetingsSection`             | a meeting update/delete API plus two new store actions. The two row kinds have **different write targets**: group-practice rows come off `upcomingGroupSessions` (cohort-wide, one edit affects every attendee), placement/supervision rows off `coach.upcomingSession` (one person). One handler cannot serve both. |
 *  | `Schedule session`          | `MeetingsSection` header      | a create-meeting write path — a meeting-provider API plus a store slice for researcher-created meetings, which does not exist. |
 *  | `Schedule meeting`          | `ResearchHomePage` quick bar  | the same unbuilt feature as `Schedule session`. Two entry points, one flow — wire them together or one will be forgotten. |
 *  | `Need help`                 | `ResearchHomePage` hero       | a destination nobody has designed. A content/IA decision (help centre? mailto? support form?), not an engineering task. |
 *  | `Sync with REDCap`          | `ConsumerManagementPage` hero | a REDCap client. **This is the one that blocks a real deployment**: it is the only consumer-enrolment route in this build, so consumers cannot currently be added at all. The store's `enrollConsumer` action already builds a complete `ConsumerDyad` from a plain input object and is the intended call target, once per synced record. |
 *
 *  Hand-rolled, same convention:
 *  | `Need Help?`                | `CoachProfilePage`, Stage Management  | same unbuilt destination as `Need help`. Resolve both together. |
 *  | `Mark all as read` + per-row overflow | `CoachProfilePage` and `ConsumerDetailPage`, "Key updates" | a per-user notification read-state store. "Read" is not a state anything here persists. The two Key-updates panels are **copy-paste, not a shared component** — wiring one and not the other is a live risk. The overflow menu has no items designed at all. |
 *  | `Download` (certificate)    | `SpacesCoachProfilePage` Overview     | a certificate generation/storage service. `CertificationRecord` already carries `certificateGenerated`/`certificateDate` fields that nothing reads or writes — those are the intended hooks, not working plumbing. |
 *  | Notification bell           | `AppHeader`                           | a notification feed. It is also the one control that breaks this convention: a `<span>`, keyboard-unreachable, relying on a native `title`. |
 *
 * `appearance` — how inert the control *looks*, never how inert it is:
 *  - `dimmed` (default): muted, `cursor-default`; callers add their own
 *    `opacity-*`. Used by the row `Edit`/`Delete` pair.
 *  - `active`: renders **identically to a live control**, hover and press
 *    included. Used by the scheduling CTAs, `Need help` and `Sync with
 *    REDCap`. `cursor-pointer` is required here, not decoration — a
 *    `<button>` computes to `cursor: default`, so an inert pill sitting beside
 *    real `<a>` pills gives itself away on hover without it.
 *
 * Do not drop `aria-disabled` or the `sr-only` cue from either appearance.
 * Under `active` they are the *only* remaining signal that a control which
 * looks and hovers like a button will do nothing.
 */
export function InertButton({
  label,
  className,
  children,
  appearance = 'dimmed',
}: {
  label: string
  className: string
  children?: ReactNode
  appearance?: 'dimmed' | 'active'
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      className={cn(className, appearance === 'dimmed' ? 'cursor-default' : 'cursor-pointer')}
    >
      {children}
      {label}
      <span className="sr-only"> (coming soon)</span>
    </button>
  )
}
