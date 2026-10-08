import { useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Password change on My Profile. One caller, `ResearchAccountPage`.
 *
 * ⚠️ ENTIRELY A MOCK. `onSubmit` does `preventDefault()` and `setSent(true)`.
 * No password is checked — there is none — and no email is sent, yet the card
 * then tells the user "We've sent a link to {email}". Together with the inert
 * "Sign out" in the header, the whole identity surface of this page is
 * theatre. This submit handler is the seam an identity provider attaches to.
 *
 * The *shape* is worth keeping when you wire it up: never set a new password
 * inline. Confirm identity with the current password, then send a reset link
 * so the actual change happens over a verified channel.
 *
 * ⚠️ THE TWO FOCUS EFFECTS ARE REQUIRED, not polish. The card swaps its whole
 * content across three states (idle -> open -> sent), and each swap unmounts
 * the control that caused it. Without the effects a keyboard or screen-reader
 * user is dropped to `<body>` on both transitions. They move focus into the
 * current-password input on open, and onto the "Check your email" heading once
 * sent. Any new state needs the same treatment.
 */
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

      {/* The card-header band and its divider only apply once there is a real
          content section below them. The idle and sent states are
          message-plus-one-button, so they stay flat; the open state is a real
          form, so it gets both. */}
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
