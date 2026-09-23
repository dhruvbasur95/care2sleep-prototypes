import { useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Shared across all 3 new Account tabs (Round 6.2.1). Industry-standard
 *  pattern, matching this app's own `SignInPage` forgot-password flow: never
 *  set a new password inline — confirm identity with the current password,
 *  then send a reset link to the account's email so the actual change
 *  happens over a verified channel. Entirely self-contained; there's no real
 *  password anywhere in this prototype to check against.
 *
 *  Round 6.2.1 accessibility fix: the card swaps content across 3 states
 *  (idle/open/sent) without ever moving focus, so a keyboard/screen-reader
 *  user who triggers a transition loses their place to `<body>` — matching
 *  the same class of gap noted (but left unfixed, as non-blocking) in the
 *  Round 6.2 annotation wizard's accessibility report. Fixed here with two
 *  focus moves: into the current-password input on open, and onto the
 *  "Check your email" heading once sent. */
/**
 * ── `variant` ──────────────────────────────────────────────────────────────
 *
 * Round 46. The Consumer Portal runs its own type scale and brand purple
 * (`consumer-tokens.css`), and this card was one of the last places the app
 * scale leaked into it — 14px text, `bg-primary` #4a278f, 36px controls against
 * that portal's 48. Direct instruction: "make consumer portal consistent,
 * regardless of what has been extracted from researcher portal."
 *
 * Two portals genuinely render this card, so it takes a prop rather than
 * moving — the same pattern as `viewerRole` on `SessionTracker`. Defaults to
 * `app`, so the researcher page is byte-identical.
 */
const TONE = {
  app: {
    title: 'font-display text-title',
    body: 'text-caption',
    label: 'text-fine',
    field:
      'h-9 text-caption focus-visible:border-ring focus-visible:ring-ring',
    ghost:
      'h-9 rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted hover:bg-divider-soft focus-visible:ring-ring',
    filled:
      'h-9 rounded-full bg-primary px-[18px] text-caption-medium text-white hover:bg-primary-hover focus-visible:ring-ring',
    outline:
      'h-9 rounded-full border border-primary px-[18px] text-caption-medium text-primary hover:bg-primary/5 focus-visible:ring-ring',
    link: 'text-caption-medium text-primary focus-visible:ring-ring',
    accent: 'text-primary',
    accentBg: 'bg-primary/10',
  },
  consumer: {
    title: 'text-consumer-heading text-ink',
    body: 'text-body',
    label: 'text-body',
    field:
      'h-12 text-body focus-visible:border-consumer-primary focus-visible:ring-consumer-primary',
    ghost:
      'h-12 rounded-3xl border border-consumer-primary bg-white px-5 text-body-md text-consumer-primary hover:bg-purple-50 focus-visible:ring-consumer-primary',
    filled:
      'h-12 rounded-3xl bg-consumer-primary px-5 text-body-md text-white hover:opacity-90 focus-visible:ring-consumer-primary',
    outline:
      'h-12 rounded-3xl border border-consumer-primary px-5 text-body-md text-consumer-primary hover:bg-purple-50 focus-visible:ring-consumer-primary',
    link: 'text-body-md text-consumer-primary focus-visible:ring-consumer-primary',
    accent: 'text-consumer-primary',
    accentBg: 'bg-consumer-primary/10',
  },
} as const

export function PasswordChangeCard({
  email,
  variant = 'app',
  headerClassName,
}: {
  email: string
  /** `consumer` swaps type, brand purple and control height — see above. */
  variant?: 'app' | 'consumer'
  /** Header band override, mirroring `NotificationPreferencesCard`'s own prop.
   *  Defaults to `bg-card-header` (`purple-200`), so every existing caller is
   *  byte-identical; the researcher's My Profile passes `bg-purple-50` so its
   *  three cards match the `purple-50` band the record pages use (direct
   *  instruction, 2026-09-21). */
  headerClassName?: string
}) {
  const t = TONE[variant]
  const inputClass = cn(
    'w-full rounded-sm border border-hairline bg-card px-3 text-ink outline-none transition-colors focus-visible:ring-2',
    t.field,
  )
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [sent, setSent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmationRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (open && !sent) inputRef.current?.focus()
  }, [open, sent])

  useEffect(() => {
    if (sent) confirmationRef.current?.focus()
  }, [sent])

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className={cn('p-6', open && (headerClassName ?? 'bg-card-header'))}>
        <h2 className={t.title}>Password</h2>

        {!open && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className={cn('text-ink-muted', t.body)}>••••••••</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn('inline-flex items-center outline-none transition-all focus-visible:ring-2 active:scale-[0.97]', t.ghost)}
            >
              Change password
            </button>
          </div>
        )}
      </div>

      {/* The idle/sent states above and below are message+one-button only, so
          they stay divider-free per the master pattern's exception — but the
          "open" state below is a real form (label+input+2 buttons), which
          does qualify, so the divider only renders while that form is showing. */}
      {open && (
        <div className="border-t border-hairline p-6 pt-4">
          {sent ? (
            <div className="flex flex-col items-start gap-3">
              <span
                aria-hidden="true"
                className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', t.accentBg)}
              >
                <Mail className={cn('size-5', t.accent)} strokeWidth={1.75} />
              </span>
              <div>
                <p ref={confirmationRef} tabIndex={-1} role="status" className={cn('font-semibold text-ink outline-none', t.body)}>
                  Check your email
                </p>
                <p className={cn('mt-1 text-ink-faint', t.body)}>
                  We've sent a link to {email} to finish changing your password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setSent(false)
                  setCurrentPassword('')
                }}
                className={cn('inline-flex min-h-11 items-center rounded-sm outline-none hover:underline focus-visible:ring-2', t.link)}
              >
                Done
              </button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
            >
              <p className={cn('text-ink-faint', t.body)}>
                Enter your current password to request a change. We'll email a link to{' '}
                {email} to set a new one.
              </p>
              <div className="flex flex-col gap-1">
                <label htmlFor="account-current-password" className={cn('text-ink-faint', t.label)}>
                  Current password
                </label>
                <input
                  ref={inputRef}
                  id="account-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!currentPassword.trim()}
                  className={cn('inline-flex items-center justify-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-divider-soft disabled:text-ink-faint', t.filled)}
                >
                  Request password change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setCurrentPassword('')
                  }}
                  className={cn('inline-flex items-center justify-center outline-none transition-all focus-visible:ring-2 active:scale-[0.97]', t.outline)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Card>
  )
}
