import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import { NotificationPreferencesCard } from '@/components/account/NotificationPreferencesCard'
import { PasswordChangeCard } from '@/components/account/PasswordChangeCard'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { PersonCard } from '@/pages/research/SpacesCoachProfilePage'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { formatDate } from '@/data/format'
import type { ConsumerDyad } from '@/data/spaces'

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/** The carer is the account holder (they're the one signed in to the
 *  portal), so contact details — needed for notifications and the password-
 *  change email — live here rather than as fields on the shared `PersonCard`
 *  (which is also reused, unchanged, by the Research Dashboard and Coach
 *  Delivery Portal, where email/phone aren't relevant). */
function ContactDetailsCard({ dyad }: { dyad: ConsumerDyad }) {
  const { updateDyadPerson } = useResearch()
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(dyad.carer.email ?? '')
  const [phone, setPhone] = useState(dyad.carer.phone ?? '')

  const fields = [
    { label: 'Email', value: dyad.carer.email || '—', breakAll: true },
    { label: 'Phone', value: dyad.carer.phone || '—' },
  ]

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="bg-card-header p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-title">Contact details</h2>
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
        <p className="mt-1 text-caption text-ink-muted">
          Used for notifications and password reset links.
        </p>
      </div>
      <div className="border-t border-hairline p-6 pt-4">
        {editing ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              updateDyadPerson(dyad.id, 'carer', { email, phone })
              setEditing(false)
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="account-carer-email" className="text-fine text-ink-faint">
                Email
              </label>
              <input
                id="account-carer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="account-carer-phone" className="text-fine text-ink-faint">
                Phone
              </label>
              <input
                id="account-carer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
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
                  setEmail(dyad.carer.email ?? '')
                  setPhone(dyad.carer.phone ?? '')
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

const OPT_OUT_REASONS = [
  'Too time-consuming',
  'Sleep has improved, no longer needed',
  'Health or personal circumstances have changed',
  'Prefer not to say',
  'Other',
]

function OptOutCard({ dyadId, dyad }: { dyadId: string; dyad: ReturnType<typeof useResearch>['consumerDyads'][number] }) {
  const { setDyadOptOut } = useResearch()
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (dyad.optedOut) {
    return (
      <Card className="gap-0 rounded-lg border border-destructive/30 bg-destructive/5 py-0">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <h2 className="font-display text-title text-destructive">You've opted out</h2>
              <p className="mt-1 text-caption text-ink-muted">
                Opted out on {formatDate(dyad.optedOut.date)}. Reason: {dyad.optedOut.reason}.
              </p>
              <p className="mt-2 text-caption text-ink-faint">
                Someone from the research team will be in touch with you. You no longer have
                access to Zoom session links.
              </p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="gap-0 rounded-lg border border-destructive/30 bg-destructive/5 py-0">
      <div className="p-6">
        <h2 className="font-display text-title text-destructive">Opt out of the study</h2>
        <p className="mt-1 text-caption text-ink-muted">
          If you no longer want to take part in Care2Sleep, you can opt out here. Someone from
          the research team will follow up with you directly.
        </p>
      </div>

      <div className="border-t border-hairline p-6 pt-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="opt-out-reason" className="text-fine text-ink-faint">
            Reason (optional)
          </label>
          <div className="relative">
            <select
              id="opt-out-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 w-full appearance-none rounded-sm border border-hairline bg-card pr-9 pl-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a reason…</option>
              {OPT_OUT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-destructive px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
        >
          Opt out of the study
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Opt out of Care2Sleep?"
        body="Someone from the research team will be in touch with you. You'll no longer have access to Zoom session links. This can't be undone from here."
        confirmLabel="Opt out"
        cancelLabel="Stay in the study"
        destructive
        onConfirm={() => {
          setDyadOptOut(dyadId, reason || 'Prefer not to say')
          setConfirmOpen(false)
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  )
}

export function ConsumerAccountPage() {
  const { dyadId } = useParams()
  const { consumerDyads, updateDyadPerson, updateDyadNotificationPreferences } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)

  if (!dyad) return <Navigate to="/consumer" replace />

  return (
    <ConsumerShell
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      optedOut={dyad.optedOut}
      heroNoSeam
      hero={
        <div>
          <h1 className="font-display text-display-md">My Profile</h1>
          <p className="mt-1 text-body text-ink-faint">
            Update your details, alerts, and password whenever you need.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className={cn('grid grid-cols-1 gap-6', dyad.patient && 'lg:grid-cols-2')}>
          {dyad.patient && (
            <PersonCard
              title="PLE"
              person={dyad.patient}
              showRelationship={false}
              onSave={(patch) => updateDyadPerson(dyad.id, 'patient', patch)}
            />
          )}
          <PersonCard
            title="Carer"
            person={dyad.carer}
            showRelationship={!!dyad.patient}
            onSave={(patch) => updateDyadPerson(dyad.id, 'carer', patch)}
          />
        </div>

        <ContactDetailsCard dyad={dyad} />

        <NotificationPreferencesCard
          preferences={dyad.notificationPreferences ?? { email: true, sms: false }}
          onSave={(prefs) => updateDyadNotificationPreferences(dyad.id, prefs)}
        />

        <PasswordChangeCard email={dyad.carer.email ?? ''} />

        <OptOutCard dyadId={dyad.id} dyad={dyad} />
      </div>
    </ConsumerShell>
  )
}
