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
      heroNoSeam
      // Round 21: the same `purple-50` welcome band + `display-xl` purple
      // title + `subtitle`-scale sub copy the Home page introduced, so every
      // Research Dashboard destination shares one hero treatment.
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
