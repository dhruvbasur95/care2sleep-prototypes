/**
 * The consumer/client "Profile details" tab body — Study information, both
 * dyad members' personal details, and notification preferences.
 *
 * Extracted verbatim from the Research Dashboard's `ConsumerDetailPage.tsx`
 * for the coach-portal handover package. The researcher page itself is not
 * part of this package; this component is, because the Coach Delivery
 * Portal's own "Client Profile Details" tab renders it.
 *
 * `viewerRole` is deliberately preserved in full (see the comment on the
 * component below): a coach's removals are *permissions*, not layout, and the
 * researcher branch is kept intact so a researcher view can be reintroduced
 * without reconstructing it.
 *
 * `RecordRowDivider` came with it from `CoachProfilePage.tsx` — the trainee
 * record page it originally lived on is not in this package, and this file is
 * now its only reader.
 */
import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { dyadTitle } from '@/components/shared/dyadHealth'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { formatDate } from '@/data/format'
import type {
  ConsumerDyad,
  NotificationPreferences,
  PersonProfile,
} from '@/data/spaces'

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/** Round 23, frame `174:345` (node `194:1858`): the rule between two record
 *  rows is not a 1px border on the row — it is a **16px band with a hairline
 *  centred inside it, inset 24px from each edge**. That distinction is why it
 *  is its own element: a `border-b` would sit flush against the next row and
 *  run the full card width, which is visibly not what the frame draws. */
export function RecordRowDivider() {
  return (
    <div aria-hidden="true" className="flex h-4 items-center px-6">
      <span className="h-px w-full bg-hairline" />
    </div>
  )
}

/** One dyad member's identity record, on the trainee record page's Personal
 *  details card vocabulary (design-tokens.md §67): a `purple-50` header band
 *  (title + "Edit details" pinned right, no `border-t` seam below it — the
 *  band is its own boundary) over a `dl` of 40px label/value rows separated
 *  by `RecordRowDivider`. Deliberately a local sibling of `ProfilePersonCard`
 *  above rather than a rebuild of it in place — that component is also
 *  reused as-is by the Coach Delivery Portal's own (untouched, "Not started"
 *  per the revamp) Consumer Profile Details tab, and restyling it there
 *  wasn't asked for. Same fields, same `onSave` shape, same edit path. */
function PersonRecordCard({
  title,
  person,
  showRelationship,
  onSave,
  readOnly = false,
}: {
  title: string
  person: PersonProfile
  showRelationship: boolean
  onSave: (patch: Partial<PersonProfile>) => void
  /** Round 36, direct instruction: a coach may read a client's PLE/Carer
   *  details but not change them — that write path belongs to the research
   *  team. Hides the "Edit details" affordance entirely and never enters the
   *  form state, rather than relying on `onSave` simply not being wired. */
  readOnly?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  const [age, setAge] = useState(String(person.age))
  const [relationship, setRelationship] = useState(person.relationship ?? '')
  const [email, setEmail] = useState(person.email ?? '')
  const [phone, setPhone] = useState(person.phone ?? '')
  const [background, setBackground] = useState(person.background)

  // Both the form's Cancel and Save controls unmount the instant `editing`
  // flips back to `false` — the card swaps to its `dl` and remounts "Edit
  // details" in the same spot. Without this, focus drops to `<body>`, this
  // project's most-repeated defect class (CLAUDE.md's non-negotiables list).
  // `wasEditing` distinguishes "just left edit mode" from first mount, so
  // this doesn't steal focus on initial page load.
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  useEffect(() => {
    if (editing) {
      wasEditing.current = true
    } else if (wasEditing.current) {
      wasEditing.current = false
      editButtonRef.current?.focus()
    }
  }, [editing])

  const resetFields = () => {
    setName(person.name)
    setAge(String(person.age))
    setRelationship(person.relationship ?? '')
    setEmail(person.email ?? '')
    setPhone(person.phone ?? '')
    setBackground(person.background)
  }

  const idFor = (field: string) => `${title}-${field}`

  const fields: { label: string; value: string; breakAll?: boolean; multiline?: boolean }[] = [
    { label: 'Name', value: person.name },
    { label: 'Age', value: String(person.age) },
    ...(showRelationship ? [{ label: 'Relationship to PLE', value: person.relationship ?? '—' }] : []),
    { label: 'Email', value: person.email || '—', breakAll: true },
    { label: 'Phone', value: person.phone || '—' },
    { label: 'Background', value: person.background, multiline: true },
  ]

  return (
    <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
      <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
        <h2 className="font-display text-title text-ink">{title}</h2>
        {!editing && !readOnly && (
          <button
            ref={editButtonRef}
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-9 shrink-0 items-center rounded-sm bg-card px-4 text-caption-medium text-primary outline-none transition-colors hover:bg-parchment focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            Edit details
          </button>
        )}
      </div>

      {editing && !readOnly ? (
        <form
          className="flex flex-col gap-4 p-6"
          onSubmit={(e) => {
            e.preventDefault()
            onSave({
              name,
              age: Number(age) || person.age,
              ...(showRelationship ? { relationship } : {}),
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
              background,
            })
            setEditing(false)
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={idFor('name')} className="text-caption-medium text-ink-faint">
                Name
              </label>
              <input
                id={idFor('name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={idFor('age')} className="text-caption-medium text-ink-faint">
                Age
              </label>
              <input
                id={idFor('age')}
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {showRelationship && (
            <div className="flex flex-col gap-2">
              <label htmlFor={idFor('relationship')} className="text-caption-medium text-ink-faint">
                Relationship to PLE
              </label>
              <input
                id={idFor('relationship')}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={idFor('email')} className="text-caption-medium text-ink-faint">
                Email <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                id={idFor('email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={idFor('phone')} className="text-caption-medium text-ink-faint">
                Phone <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                id={idFor('phone')}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={idFor('background')} className="text-caption-medium text-ink-faint">
              Background
            </label>
            <textarea
              id={idFor('background')}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              rows={4}
              className="w-full rounded-sm border border-hairline bg-card px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-6 text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => {
                resetFields()
                setEditing(false)
              }}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary px-6 text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="flex flex-col py-4">
          {fields.map((f, i) => (
            <Fragment key={f.label}>
              {i > 0 && <RecordRowDivider />}
              <div
                className={cn(
                  'flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:gap-0',
                  f.multiline ? 'sm:items-start' : 'sm:items-center sm:py-0',
                )}
              >
                <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">{f.label}</dt>
                <dd className={cn('min-w-0 text-caption text-ink', f.breakAll && 'break-all')}>
                  {f.value}
                </dd>
              </div>
            </Fragment>
          ))}
        </dl>
      )}
    </Card>
  )
}

/** Local sibling of `components/account/NotificationPreferencesCard.tsx` —
 *  same fields, same behaviour, but styled onto this tab's `purple-50`
 *  header cards (Figma `210:797`, node `221:2`) rather than that
 *  component's `bg-card-header` band. Same precedent as `PersonRecordCard`
 *  above: a local variant rather than restyling a component 3 other Account
 *  pages already rely on. */
function DyadNotificationPreferencesCard({
  dyad,
  onSave,
}: {
  dyad: ConsumerDyad
  onSave: (prefs: NotificationPreferences) => void
}) {
  const preferences = dyad.notificationPreferences ?? { email: true, sms: false }
  const [email, setEmail] = useState(preferences.email)
  const [sms, setSms] = useState(preferences.sms)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEmail(preferences.email)
    setSms(preferences.sms)
  }, [preferences.email, preferences.sms])

  const dirty = email !== preferences.email || sms !== preferences.sms

  // Figma `210:797` node `221:19`/`221:22`: a 28px `purple-500` checkbox with
  // a white checkmark, not the browser's native control — `appearance-none`
  // on the (still real, still keyboard/AT-operable) input, with the check
  // glyph as a `peer-checked`-driven sibling rather than a second fake
  // element layered on top of a hidden real one.
  const checkboxClass =
    'peer size-7 shrink-0 cursor-pointer appearance-none rounded-[6px] border border-hairline bg-card outline-none transition-colors checked:border-purple-500 checked:bg-purple-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
      <div className="flex min-h-16 items-center bg-purple-50 px-6 py-3">
        <h2 className="font-display text-title text-ink">Notification preferences</h2>
      </div>
      <div className="p-6">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSave({ email, sms })
            setSaved(true)
          }}
        >
          <label className="flex cursor-pointer items-center gap-3 text-caption text-ink">
            <span className="relative inline-flex size-7 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={email}
                onChange={(e) => {
                  setEmail(e.target.checked)
                  setSaved(false)
                }}
                className={checkboxClass}
              />
              <Check
                aria-hidden="true"
                className="pointer-events-none absolute size-4 text-white opacity-0 peer-checked:opacity-100"
              />
            </span>
            Email
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-caption text-ink">
            <span className="relative inline-flex size-7 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={sms}
                onChange={(e) => {
                  setSms(e.target.checked)
                  setSaved(false)
                }}
                className={checkboxClass}
              />
              <Check
                aria-hidden="true"
                className="pointer-events-none absolute size-4 text-white opacity-0 peer-checked:opacity-100"
              />
            </span>
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

/** Both dyad members' basic details, each in their own editable, vertically
 *  stacked field list, side by side as two columns. Restructured onto the
 *  trainee record page's Personal details card vocabulary
 *  (design-tokens.md §67) — see `PersonRecordCard` above. Consent records
 *  removed per Figma `210:797`, which has no such section on this tab.
 *
 *  Figma `210:797`: adds a "Study information" card (join date + a
 *  researcher-initiated "Withdraw from study", the same `purple-50` header +
 *  destructive-outline-on-`bg-card` button `CoachProfilePage`'s own Study
 *  information card already established for the trainee record page — see
 *  that file's comment on why the fill is opaque, not a translucent tint)
 *  and a "Notification preferences" card at the end. The frame's own
 *  personal-details content ("Claire Donnelly / Research coordinator /
 *  Monash University") is a researcher's own profile borrowed from a My
 *  Profile screen, same as the trainee record page's frame — this dyad's
 *  real PLE/Carer fields stay, just retitled to match the frame's card
 *  headings. "Join date" reads the dyad's earliest consent upload as the
 *  closest existing stand-in for an enrolment date, rather than adding a new
 *  field for a UI-only pass. */
/* Round 36: exported and made role-aware so the Coach Delivery Portal's own
   "Client Profile Details" tab renders *this* component rather than a second,
   simpler set of cards of its own. Before this the coach saw two bare
   `ProfilePersonCard`s while the researcher saw Study information + two
   `PersonRecordCard`s + Notification preferences — the same record, two
   different card vocabularies, which is exactly the drift this project keeps
   paying for. One component, one set of cards, two permission levels.

   A coach's two removals are permissions, not layout (direct instruction):
   they cannot withdraw a client from the study, and they cannot change the
   client's notification preferences — so the button and the whole
   preferences card are *absent*, not disabled. The third difference is a
   routing fact rather than a permission: "Assigned coach" links to
   `/research/spaces-coaches/:id`, a Research Dashboard route the Coach
   Delivery Portal must not send anyone into, so the coach sees the name as
   plain text.

   Handover package note: this package has no `viewerRole="researcher"` caller
   — the coach's client page is the only one — and `/research/spaces-coaches/:id`
   is not a route here. The researcher branch is kept intact anyway, on
   instruction: it is the specification of what a coach may *not* do, and
   hardcoding the coach path would silently delete that distinction. If a
   researcher view is ever added back, that link needs its route back too. */
export function ProfileDetailsSections({
  dyad,
  viewerRole = 'researcher',
}: {
  dyad: ConsumerDyad
  /** Same `viewerRole` contract `SessionTracker` established in Round 17.2 and
   *  `ModuleEngagementTab`/`SleepDiaryFeed` adopted in Round 30. */
  viewerRole?: 'researcher' | 'coach'
}) {
  const { updateDyadPerson, setDyadOptOut, updateDyadNotificationPreferences, coaches, spacesCoaches } =
    useResearch()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const isResearcher = viewerRole === 'researcher'
  const joinDate = dyad.consentDocuments[0]?.uploadedDate
  /* Direct instruction: the assigned coach belongs in Study information — who
     this consumer is paired with, and since when, is study record rather than
     personal detail. Derived from `dyad.coachId`, never a second stored copy of
     the name: this page and the coach record page must not be able to disagree
     about a pairing.
     Every row degrades honestly when there is no coach, rather than being
     omitted — "not assigned" is a real state a researcher acts on, and a
     missing row reads as missing data. */
  const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined
  /* Only link to the coach record page when there *is* one. `spacesCoaches`
     holds onboarded coaches; a certified-but-not-yet-onboarded candidate has a
     `Coach` record and no SPACES record, so `/research/spaces-coaches/:id`
     redirects straight back to the roster for them. A link that silently
     dead-ends is worse than plain text, so the name renders unlinked instead.
     ⚠️ That case is reachable today: `dyad-012` is assigned to `mei-ling-chen`,
     who sits in the "Waiting to be onboarded" list — a consumer assigned to a
     coach who has not been onboarded is a seed-data contradiction, flagged
     here rather than papered over. */
  const coachRecordExists = !!coach && spacesCoaches.some((sc) => sc.coachId === coach.id)

  return (
    // 40px stack, all cards vertical — same rhythm as the other tabs.
    <div className="flex flex-col gap-10">
      <Card className="gap-0 overflow-hidden rounded-lg border border-parchment bg-card py-0 shadow-card">
        <div className="flex min-h-16 items-center justify-between gap-4 bg-purple-50 px-6 py-3">
          <h2 className="font-display text-title text-ink">Study information</h2>
          {isResearcher && !dyad.optedOut && (
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="inline-flex h-9 shrink-0 items-center rounded-sm border border-destructive bg-card px-4 text-caption-medium text-destructive outline-none transition-colors hover:bg-destructive/8 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
            >
              Withdraw from study
            </button>
          )}
        </div>
        <dl className="flex flex-col py-4">
          <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
            <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">Join date</dt>
            <dd className="text-caption text-ink">{joinDate ? formatDate(joinDate) : '—'}</dd>
          </div>
          <RecordRowDivider />
          <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
            <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">Assigned coach</dt>
            <dd className="text-caption text-ink">
              {isResearcher && coachRecordExists && coach ? (
                /* A link, not plain text: the coach record is where a
                   researcher goes next from here, and it is one hop away.
                   Never for a coach — the target is a Research Dashboard
                   route, so it renders as the plain-text branch below. */
                <Link
                  to={`/research/spaces-coaches/${coach.id}`}
                  className="rounded-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {coach.fullName}
                </Link>
              ) : coach ? (
                <span>{coach.fullName}</span>
              ) : (
                <span className="text-destructive">Not assigned</span>
              )}
            </dd>
          </div>
          <RecordRowDivider />
          <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
            <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">Coach email</dt>
            <dd className="text-caption break-all text-ink">{coach?.email || '\u2014'}</dd>
          </div>
          <RecordRowDivider />
          <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
            <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">Assigned on</dt>
            <dd className="text-caption text-ink">
              {dyad.coachAssignedDate ? formatDate(dyad.coachAssignedDate) : '\u2014'}
            </dd>
          </div>
          {dyad.optedOut && (
            <>
              <RecordRowDivider />
              <div className="flex min-h-10 flex-col gap-1 px-6 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-0">
                <dt className="text-caption-medium text-ink sm:w-40 sm:shrink-0">Status</dt>
                <dd className="text-caption text-destructive">
                  Withdrawn on {formatDate(dyad.optedOut.date)}
                </dd>
              </div>
            </>
          )}
        </dl>
      </Card>

      <div className={cn('grid grid-cols-1 gap-6', dyad.patient && 'lg:grid-cols-2')}>
        {dyad.patient && (
          <PersonRecordCard
            title="PLE personal details"
            person={dyad.patient}
            showRelationship={false}
            readOnly={!isResearcher}
            onSave={(patch) => updateDyadPerson(dyad.id, 'patient', patch)}
          />
        )}
        <PersonRecordCard
          title="Carer personal details"
          person={dyad.carer}
          showRelationship={!!dyad.patient}
          readOnly={!isResearcher}
          onSave={(patch) => updateDyadPerson(dyad.id, 'carer', patch)}
        />
      </div>

      {isResearcher && (
        <DyadNotificationPreferencesCard
          dyad={dyad}
          onSave={(prefs) => updateDyadNotificationPreferences(dyad.id, prefs)}
        />
      )}

      {isResearcher && (
        <ConfirmDialog
          open={withdrawOpen}
          title={`Withdraw ${dyadTitle(dyad)} from the study?`}
          body="Their status changes to withdrawn and their records are kept per their consent. They'll lose access to Zoom session links. This is reversible in the prototype only."
          confirmLabel="Withdraw from study"
          cancelLabel="Keep active"
          destructive
          onConfirm={() => {
            setDyadOptOut(dyad.id, 'Withdrawn by the research team')
            setWithdrawOpen(false)
          }}
          onClose={() => setWithdrawOpen(false)}
        />
      )}
    </div>
  )
}
