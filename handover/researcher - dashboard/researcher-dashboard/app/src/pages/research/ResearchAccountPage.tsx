/**
 * My Profile — the signed-in researcher's own account page.
 *
 * Route: `/research/account` (see `App.tsx`). The last entry in the sidebar.
 *
 * Reads and writes `researcherProfile` on the research store. There is no auth
 * in this package, so "the signed-in researcher" is the single hardcoded
 * `researcher` object seeded from `data/research.ts` — one person, always the
 * same one, and the identity every "you"/"your" surface in the app resolves to.
 * Wiring real auth starts here and at that seed object.
 *
 * Three cards, two of which are shared and one local:
 *   - `ProfileDetailsCard` (below) — name/role/organisation are read-only
 *     because they are set by the institution, not the user; only email and
 *     phone are editable, via `updateResearcherContact`.
 *   - `NotificationPreferencesCard` — shared, writes through
 *     `updateResearcherNotificationPreferences`.
 *   - `PasswordChangeCard` — shared, and a **stub**: its submit handler only
 *     flips local state and then claims an email was sent. No password is
 *     checked (none exists) and no mail is sent. This is the identity-provider
 *     integration boundary.
 */
import { useState } from 'react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { NotificationPreferencesCard } from '@/components/account/NotificationPreferencesCard'
import { PasswordChangeCard } from '@/components/account/PasswordChangeCard'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useResearch } from '@/data/research-context'

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

function ProfileDetailsCard() {
  const { researcherProfile, updateResearcherContact } = useResearch()
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(researcherProfile.email)
  const [phone, setPhone] = useState(researcherProfile.phone)

  const fields = [
    { label: 'Full name', value: researcherProfile.fullName },
    { label: 'Role', value: researcherProfile.role },
    { label: 'Organisation', value: researcherProfile.organisation },
    { label: 'Email', value: researcherProfile.email, breakAll: true },
    { label: 'Phone', value: researcherProfile.phone },
  ]

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="bg-card-header p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-title">Profile details</h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 items-center rounded-sm bg-pearl px-4 text-caption-medium text-ink-muted outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Edit details
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-hairline p-6 pt-4">
        {editing ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              updateResearcherContact({ email, phone })
              setEditing(false)
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="account-email" className="text-fine text-ink-faint">
                Email
              </label>
              <input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="account-phone" className="text-fine text-ink-faint">
                Phone
              </label>
              <input
                id="account-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <p className="text-fine text-ink-faint">
              Name, role, and organisation are set by Monash University and aren't editable here.
            </p>
            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail(researcherProfile.email)
                  setPhone(researcherProfile.phone)
                  setEditing(false)
                }}
                className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl>
            {fields.map((f, i) => (
              <div key={f.label}>
                {i > 0 && <Separator className="bg-divider-soft" />}
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-caption text-ink-faint">{f.label}</dt>
                  <dd className={f.breakAll ? 'text-caption break-all text-ink' : 'text-caption text-ink'}>
                    {f.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Card>
  )
}

export function ResearchAccountPage() {
  const { researcherProfile, updateResearcherNotificationPreferences } = useResearch()

  return (
    <ResearchShell
      // `heroNoSeam` is required on any hero that is a plain title with no tab
      // row under it. Without it the shell reserves zero padding between the
      // band and the content below, because it assumes a tab row closes the
      // band out. Every list page in this portal passes it for the same reason.
      heroNoSeam
      // The pale `purple-50` welcome band is the shared treatment for every
      // non-record page in the Research Dashboard. The three record pages use a
      // solid `purple-700` band instead — do not mix the two.
      heroClassName="bg-purple-50"
      hero={
        <ResearchPageHero
          title="My profile"
          subtitle="Update your profile, notification preferences, and password."
        />
      }
    >
      <div className="space-y-6">
        <ProfileDetailsCard />
        <NotificationPreferencesCard
          preferences={researcherProfile.notificationPreferences}
          onSave={updateResearcherNotificationPreferences}
        />
        <PasswordChangeCard email={researcherProfile.email} />
      </div>
    </ResearchShell>
  )
}
