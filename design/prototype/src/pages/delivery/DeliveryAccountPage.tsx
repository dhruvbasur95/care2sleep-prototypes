import { useState } from 'react'
import { DeliveryShell } from '@/components/delivery/DeliveryShell'
import { OptOutCard } from '@/components/delivery/OptOutCard'
import { NotificationPreferencesCard } from '@/components/account/NotificationPreferencesCard'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RECORD_GRID, RecordFieldList, RecordInput } from '@/components/research/RecordFields'
import { useResearch } from '@/data/research-context'
import { formatDate } from '@/data/format'
import { cn } from '@/lib/utils'
import { Download } from 'lucide-react'

const COACH_ID = 'helen-zhang'

function ProfileDetailsCard({ coach }: { coach: ReturnType<typeof useResearch>['coaches'][number] }) {
  const { updateContact } = useResearch()
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(coach.email)
  const [phone, setPhone] = useState(coach.phone)

  // Frame `641:12971`'s own five fields. It drops the Participant ID and
  // Years-in-aged-care rows this card carried before — flagged rather than
  // silently kept, since a participant ID is a real thing a research
  // participant may need to quote, but the frame is explicit about the five.
  //
  // The frame's *values* are Claire Donnelly, Research coordinator, Monash
  // University — the researcher persona, pasted in from the researcher's own My
  // profile screen. This is the trainee portal, so the real coach record is
  // read instead: Role maps to `roleAtEmployer` and Organisation to `employer`.
  const fields = [
    { label: 'Full name', value: coach.fullName },
    { label: 'Role', value: coach.roleAtEmployer },
    { label: 'Organisation', value: coach.employer },
    { label: 'Email', value: coach.email, breakAll: true },
    { label: 'Phone', value: coach.phone },
  ]

  return (
    <Card className="gap-0 rounded-lg py-0">
      {/* `purple-50`, the frame's own `#f3efff` — not the `bg-card-header`
          token, which is the darker `purple-200` and would make this card
          disagree with every other card on the trainee pages. */}
      <div className="bg-purple-50 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-title">Profile details</h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              // Was `bg-pearl` + `ink-muted`: a cool grey fill on a warm purple
              // band with low-contrast grey text, which is the exact "foreign
              // patch" Round 28 found and the reason it was hard to read. The
              // app's own primary-outline pill instead — white fill, `primary`
              // label — which is what every other action on a tinted trainee
              // band uses (the pathway card's "Learn more").
              className="inline-flex h-9 shrink-0 items-center rounded-full border border-primary bg-white px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
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
              updateContact(coach.id, { email, phone })
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
              Name, participant ID, aged care employer, role, and years in aged care are set at
              recruitment and aren't editable here.
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
                  setEmail(coach.email)
                  setPhone(coach.phone)
                  setEditing(false)
                }}
                className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Cancel
              </button>
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

/**
 * Study details — the coach's standing facts about their participation, as
 * opposed to the contact details above (direct instruction).
 *
 * This is also where the **Trainee ID** lands. Frame `641:12971` dropped it from
 * Profile details, but a participant ID is a real thing a study participant may
 * need to quote, and it belongs with the study rather than with their phone
 * number.
 *
 * Every value is derived from the coach's own certification record, including
 * whether the download exists at all: `certificateGenerated` is the researcher's
 * own action, so a coach who has passed but whose certificate has not been
 * issued yet sees an honest "not ready" line rather than a button that cannot
 * produce a file.
 */
function StudyDetailsCard({ coach }: { coach: ReturnType<typeof useResearch>['coaches'][number] }) {
  const { certification } = coach
  const certified = certification.outcome === 'pass'
  const canDownload = certified && certification.certificateGenerated

  async function downloadCertificate() {
    // The real committed asset, not a generated stand-in. Round 23 shipped
    // `certificate-earned.svg` for the pathway rail; this hands the coach the
    // same artwork rather than fabricating a document.
    const res = await fetch('/illustrations/certificate-earned.svg')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `care2sleep-certificate-${coach.participantId}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fields = [
    { label: 'Trainee ID', value: coach.participantId },
    {
      label: 'Certified on',
      value: certified && certification.assessedDate
        ? formatDate(certification.assessedDate)
        : 'Not yet certified',
    },
  ]

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="bg-purple-50 p-6">
        <h2 className="font-display text-title">Study details</h2>
      </div>

      <div className="border-t border-hairline p-6 pt-4">
        {/* Round 47: same `RecordFields` vocabulary as the Profile details
            card directly above. Converted alongside it rather than left
            behind: two cards on one screen drawing label/value two different
            ways is precisely the drift the shared component exists to end. */}
        <RecordFieldList
          fields={fields.map((f) => ({ key: f.label, label: f.label, value: f.value }))}
        />

        <Separator className="mt-5 bg-divider-soft" />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <p className="text-caption text-ink-muted">
            {canDownload
              ? 'Your certificate of completion for the Care2Sleep coach training.'
              : "Your certificate will be available here once it's been issued."}
          </p>
          <button
            type="button"
            onClick={canDownload ? downloadCertificate : (e) => e.preventDefault()}
            aria-disabled={canDownload ? undefined : true}
            className={cn(
              'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              canDownload ? 'hover:bg-primary/10' : 'cursor-not-allowed opacity-50',
            )}
          >
            <Download aria-hidden="true" className="size-4" />
            Download certificate
            {!canDownload && <span className="sr-only"> (not available yet)</span>}
          </button>
        </div>
      </div>
    </Card>
  )
}

export function DeliveryAccountPage() {
  const { coaches, updateCoachNotificationPreferences } = useResearch()
  const coach = coaches.find((c) => c.id === COACH_ID)

  if (!coach) return null

  return (
    // **No hero band** (frame `641:12888`). Round 29 gave this page a `yellow-50`
    // box carrying the researcher page's treatment; the frame drops it and makes
    // the title page content in `purple-700`, which is what Home, My Learning and
    // My Notes all now do. One title treatment across the whole trainee portal.
    <DeliveryShell
      accountLabel={coach.fullName}
      // Same flush column and 64px top inset as Home, My Learning and My Notes.
      contentClassName="px-0 pt-16 md:px-0 md:pt-16"
    >
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-2" data-node-id="641:12921">
          <h1 className="font-display text-display-lg text-primary">My profile</h1>
          {/* No longer mentions password — that card is removed (direct
              instruction), and copy promising something the page does not do is
              worse than shorter copy. */}
          <p className="text-sub-greeting leading-[1.4] text-ink">
            Update your profile and notification preferences.
          </p>
        </div>

        {/* The frame puts a wave divider here labelled "Your previous notes",
            copied from the My Notes frame. Removed outright (direct
            instruction) rather than relabelled: on Home and My Notes the rule
            separates an intro from a distinct second thing, and this page is
            one continuous stack of cards with nothing to divide. */}

        <div className="flex flex-col gap-6">
          <ProfileDetailsCard coach={coach} />
          <StudyDetailsCard coach={coach} />
          <NotificationPreferencesCard
            preferences={coach.notificationPreferences ?? { email: true, sms: false }}
            onSave={(prefs) => updateCoachNotificationPreferences(coach.id, prefs)}
            headerClassName="bg-purple-50"
          />
          <OptOutCard />
        </div>
      </div>
    </DeliveryShell>
  )
}
