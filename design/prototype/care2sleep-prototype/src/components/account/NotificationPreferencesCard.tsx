import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { NotificationPreferences } from '@/data/research'

/**
 * Shared across all 3 Account tabs (Round 6.2.1) — the checkbox pair is always
 * editable (no separate edit-mode toggle, unlike the profile-details cards)
 * since two checkboxes don't need one; "Save changes" only appears once the
 * local selection actually differs from what's saved.
 *
 * ── `variant`, and why a genuinely shared component grew one ───────────────
 *
 * The Consumer Portal runs its own type scale and brand purple
 * (`consumer-tokens.css`), and Round 46 found this card was one of the last
 * places the app scale leaked into it: 14px labels, `bg-primary` #4a278f rather
 * than `consumer-primary` #3a00ad, and 36px controls against that portal's 48.
 * Direct instruction: "make consumer portal consistent, regardless of what has
 * been extracted from researcher portal."
 *
 * Unlike `PersonCard` — which turned out to have no researcher caller at all and
 * simply moved — this one really is shared by three portals, so it takes a prop
 * instead. Same pattern as `viewerRole` on `SessionTracker` and
 * `ProfileDetailsSections`: one component, one behaviour, the surface values
 * chosen by who is looking. Defaults to `app`, so the researcher and trainee
 * pages render byte-identically.
 */
const TONE = {
  app: {
    title: 'font-display text-title',
    body: 'text-caption',
    label: 'text-caption',
    check: 'text-primary focus-visible:ring-ring',
    button:
      'h-9 rounded-full bg-primary px-[18px] text-caption-medium text-white hover:bg-primary-hover focus-visible:ring-ring',
    saved: 'text-fine',
  },
  consumer: {
    title: 'text-consumer-heading text-ink',
    body: 'text-body',
    label: 'text-body',
    check: 'text-consumer-primary focus-visible:ring-consumer-primary',
    button:
      'h-12 rounded-3xl bg-consumer-primary px-5 text-body-md text-white hover:opacity-90 focus-visible:ring-consumer-primary',
    saved: 'text-body',
  },
} as const

export function NotificationPreferencesCard({
  preferences,
  onSave,
  headerClassName,
  variant = 'app',
}: {
  preferences: NotificationPreferences
  onSave: (prefs: NotificationPreferences) => void
  /** `consumer` swaps the type scale, brand purple and control height for the
   *  Consumer Portal's own — see the note above. */
  variant?: 'app' | 'consumer'
  /** Header band override. Defaults to `bg-card-header` (`purple-200`), so the
   *  researcher and consumer Account pages stay byte-identical. The trainee
   *  portal passes `bg-purple-50` because frame `641:12994` — and every other
   *  card on that page — uses the lighter step. */
  headerClassName?: string
}) {
  const [email, setEmail] = useState(preferences.email)
  const [sms, setSms] = useState(preferences.sms)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEmail(preferences.email)
    setSms(preferences.sms)
  }, [preferences.email, preferences.sms])

  const dirty = email !== preferences.email || sms !== preferences.sms
  const t = TONE[variant]

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className={cn('p-6', headerClassName ?? 'bg-card-header')}>
        <h2 className={t.title}>Notification preferences</h2>
        <p className={cn('mt-1 text-ink-muted', t.body)}>
          Choose how you'd like to be notified about updates.
        </p>
      </div>

      <div className="border-t border-hairline p-6 pt-4">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSave({ email, sms })
            setSaved(true)
          }}
        >
          <label className={cn('flex min-h-11 cursor-pointer items-center gap-2 text-ink', t.label)}>
            <input
              type="checkbox"
              checked={email}
              onChange={(e) => {
                setEmail(e.target.checked)
                setSaved(false)
              }}
              className={cn('size-4 rounded-xs border-hairline outline-none focus-visible:ring-2', t.check)}
            />
            Email
          </label>
          <label className={cn('flex min-h-11 cursor-pointer items-center gap-2 text-ink', t.label)}>
            <input
              type="checkbox"
              checked={sms}
              onChange={(e) => {
                setSms(e.target.checked)
                setSaved(false)
              }}
              className={cn('size-4 rounded-xs border-hairline outline-none focus-visible:ring-2', t.check)}
            />
            SMS
          </label>

          {dirty && (
            <button
              type="submit"
              className={cn(
                'inline-flex items-center justify-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]',
                t.button,
              )}
            >
              Save changes
            </button>
          )}
          {saved && !dirty && (
            <p role="status" className={cn('font-semibold text-success', t.saved)}>
              Saved.
            </p>
          )}
        </form>
      </div>
    </Card>
  )
}
