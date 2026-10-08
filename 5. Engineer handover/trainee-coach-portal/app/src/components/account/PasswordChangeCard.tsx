import { useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

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
export function PasswordChangeCard({ email }: { email: string }) {
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
      <div className={open ? 'bg-card-header p-6' : 'p-6'}>
        <h2 className="font-display text-title">Password</h2>

        {!open && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-caption text-ink-muted">••••••••</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-9 items-center rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
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
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10"
              >
                <Mail className="size-5 text-primary" strokeWidth={1.75} />
              </span>
              <div>
                <p ref={confirmationRef} tabIndex={-1} role="status" className="text-caption font-semibold text-ink outline-none">
                  Check your email
                </p>
                <p className="mt-1 text-caption text-ink-faint">
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
                className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
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
              <p className="text-caption text-ink-faint">
                Enter your current password to request a change. We'll email a link to{' '}
                {email} to set a new one.
              </p>
              <div className="flex flex-col gap-1">
                <label htmlFor="account-current-password" className="text-fine text-ink-faint">
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
                  className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-divider-soft disabled:text-ink-faint"
                >
                  Request password change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setCurrentPassword('')
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
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
