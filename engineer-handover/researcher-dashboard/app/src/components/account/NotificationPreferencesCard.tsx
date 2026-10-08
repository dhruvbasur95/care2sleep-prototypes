import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import type { NotificationPreferences } from '@/data/research'

/**
 * Email/SMS notification opt-ins on My Profile. One caller,
 * `ResearchAccountPage`, which persists through the store.
 *
 * No edit-mode toggle, unlike the profile-details cards on the same page: two
 * checkboxes do not need one. "Save changes" appears only once the local
 * selection actually differs from what is saved, so the card has no way to
 * submit a no-op.
 *
 * The `useEffect` re-syncs local state when the saved preferences change
 * underneath — required because the checkboxes are locally controlled, not
 * driven straight off the prop.
 *
 * ⚠️ Saving updates the store and nothing else. No notification is ever sent
 * by this app, through either channel; these preferences are recorded intent
 * with no delivery mechanism behind them.
 */
export function NotificationPreferencesCard({
  preferences,
  onSave,
}: {
  preferences: NotificationPreferences
  onSave: (prefs: NotificationPreferences) => void
}) {
  const [email, setEmail] = useState(preferences.email)
  const [sms, setSms] = useState(preferences.sms)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEmail(preferences.email)
    setSms(preferences.sms)
  }, [preferences.email, preferences.sms])

  const dirty = email !== preferences.email || sms !== preferences.sms

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="bg-card-header p-6">
        <h2 className="font-display text-title">Notification preferences</h2>
        <p className="mt-1 text-caption text-ink-muted">
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
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-caption text-ink">
            <input
              type="checkbox"
              checked={email}
              onChange={(e) => {
                setEmail(e.target.checked)
                setSaved(false)
              }}
              className="size-4 rounded-xs border-hairline text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            Email
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-caption text-ink">
            <input
              type="checkbox"
              checked={sms}
              onChange={(e) => {
                setSms(e.target.checked)
                setSaved(false)
              }}
              className="size-4 rounded-xs border-hairline text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            SMS
          </label>

          {dirty && (
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Save changes
            </button>
          )}
          {saved && !dirty && (
            <p role="status" className="text-fine font-semibold text-success">
              Saved.
            </p>
          )}
        </form>
      </div>
    </Card>
  )
}
