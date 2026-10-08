import { useState } from 'react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { NotificationPreferencesCard } from '@/components/account/NotificationPreferencesCard'
import { PasswordChangeCard } from '@/components/account/PasswordChangeCard'
import { Card } from '@/components/ui/card'
import { RECORD_GRID, RecordFieldList, RecordInput } from '@/components/research/RecordFields'
import { useResearch } from '@/data/research-context'
import { OUTLINE_FILLED_BUTTON } from '@/components/shared/buttonStyles'
import { Button } from '@/components/ui/button'

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
      {/* `purple-50`, not the darker `bg-card-header` `purple-200` (direct
          instruction, 2026-09-21): this page's cards were the last researcher
          surface whose header band disagreed with the three record pages. */}
      <div className="bg-purple-50 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-title">Profile details</h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              // Direct instruction, 2026-10-07: the coach and consumer portals
              // both open their profile editor with the primary-outline pill,
              // and only the researcher used the grey utility box. Class string
              // copied verbatim from `DeliveryAccountPage`, for the reason that
              // file already states — `bg-pearl`'s cool grey reads as a foreign
              // patch on the warm `purple-50` band, and `ink-muted` on it is
              // the hardest label to read on this page.
              className={OUTLINE_FILLED_BUTTON}
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
            <div className={RECORD_GRID}>
              <RecordInput
                id="account-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
              />
              <RecordInput
                id="account-phone"
                label="Phone"
                type="tel"
                value={phone}
                onChange={setPhone}
              />
            </div>
            <p className="text-fine text-ink-faint">
              Name, role, and organisation are set by Monash University and aren't editable here.
            </p>
            <div className="flex gap-3">
              <Button
                type="submit"
              >
                Save changes
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEmail(researcherProfile.email)
                  setPhone(researcherProfile.phone)
                  setEditing(false)
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          /* Round 47: the shared "title + text field" vocabulary
             (`RecordFields`) — direct instruction to use it on every
             profile-details surface. */
          <RecordFieldList
            fields={fields.map((f) => ({ key: f.label, label: f.label, value: f.value }))}
          />
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
          headerClassName="bg-purple-50"
        />
        <PasswordChangeCard email={researcherProfile.email} headerClassName="bg-purple-50" />
      </div>
    </ResearchShell>
  )
}
