import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { WizardProgressRail, type WizardRailStep } from '@/components/shared/WizardProgressRail'
import { STEP_CONTENT_GAP, WizardStepHeading } from '@/components/shared/WizardStepHeading'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { nextParticipantId } from '@/data/research'
import { TODAY, formatDate } from '@/data/format'

/**
 * "Add coach trainee" — the direct-onboarding replacement for the old
 * "review an EOI, then approve it" flow: a coach trainee is now added
 * straight onto the roster at Phase 2 (Enrolment and platform access),
 * skipping a research-side review queue entirely (Phase 1, Recruitment, is
 * assumed to have already happened outside this platform).
 *
 * Modelled directly on `AddAnnotationSummaryModal` — the only multi-step
 * wizard already in this app — reusing its dialog chassis (backdrop, focus
 * trap, Escape, return-focus, `max-h-[85vh]` panel) and its
 * steps-then-review shape, rather than inventing a new wizard pattern.
 * Differs from that wizard in one structural way: each step collects
 * distinct form fields (name/email/phone, then employer/role/years), not one
 * repeated free-text question, so the step content is a small form rather
 * than a single textarea, and the review screen is a field list (matching
 * `ProfilePage`/`CoachProfilePage`'s own `dt`/`dd` "Participation record"
 * grammar) rather than a composed paragraph.
 *
 * Aged care details (employer / role / years in aged care) are exactly the
 * fields `CoachProfilePage`'s Contact Details card already treats as
 * "set at recruitment and aren't editable here" — i.e. captured once at
 * onboarding and carried unchanged through the eventual trainee → coach
 * transition (a later round's scope). That existing field set is reused
 * as-is here rather than inventing a new one for this still-TBD step.
 */

const STEPS = [
  {
    key: 'personal',
    navLabel: 'Personal details',
    heading: 'Add their personal details',
    subtitle: 'The trainee’s name and contact information.',
  },
  {
    key: 'aged-care',
    navLabel: 'Aged care details',
    heading: 'Add their aged care details',
    /* The record pages label this "Years of work experience **at
       enrolment**"; the wizard drops the qualifier because filling this form
       IS the enrolment — the as-at date is today, and saying otherwise here
       would read as a question about some other moment. Same field, and the
       brief's own wording either way. */
    subtitle: 'Their organisation, role, and years of work experience.',
  },
  {
    // Round 28, direct instruction — matches `EnrollConsumerDialog`. Review is
    // a real step rather than a screen that appears after the last one, so the
    // rail ends where the flow ends and "Step 3 of 3" counts the thing the
    // researcher is actually looking at.
    key: 'review',
    navLabel: 'Review',
    heading: 'Review and confirm',
    subtitle: 'Check the details below, then add this trainee.',
  },
] as const

const STEP_COUNT = STEPS.length
/** Index of the review step — the last one. */
const REVIEW_STEP = STEP_COUNT - 1

const RAIL_STEPS: WizardRailStep[] = STEPS.map((s) => ({
  key: s.key,
  navLabel: s.navLabel,
  heading: s.heading,
}))

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Review-step section chrome, shared by the two editable sections below and
 * the read-only Enrolment section. Matches `ProfileDetailsCard`'s own
 * established pattern (`bg-card-header` header band, hairline divider,
 * "Edit details" top-right) rather than inventing a new review-screen
 * convention — see `ResearchAccountPage.tsx`.
 */
function ReviewSection({
  title,
  editing,
  onEdit,
  children,
}: {
  title: string
  editing?: boolean
  onEdit?: () => void
  children: React.ReactNode
}) {
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const prevEditing = useRef(editing)

  // Round 20 accessibility review — confirmed live by driving the real flow
  // and polling `document.activeElement`: both directions of this inline
  // edit swap dropped keyboard focus to `<body>`. Clicking "Edit" unmounts
  // the very button that was just activated (`onEdit && !editing`), and
  // Save/Cancel unmount themselves on the way back out. Inside an open modal
  // that's worse than the usual case — the dialog's Tab trap is a `keydown`
  // handler on the panel, so once focus sits on `<body>` the trap stops
  // receiving events entirely. Fixed generically here, in the one chassis
  // both wizards' review sections share, rather than per-section.
  useEffect(() => {
    const wasEditing = prevEditing.current
    if (wasEditing === editing) return
    prevEditing.current = editing
    if (editing) {
      contentRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus()
    } else if (wasEditing) {
      editButtonRef.current?.focus()
    }
  }, [editing])

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="flex items-center justify-between gap-4 bg-card-header p-4">
        <h3 className="font-display text-body font-semibold text-ink">{title}</h3>
        {onEdit && !editing && (
          <button
            ref={editButtonRef}
            type="button"
            onClick={onEdit}
            // Every section's button reads just "Edit" visually; without this
            // a screen reader's button list is "Edit, Edit" with nothing to
            // tell them apart.
            aria-label={`Edit ${title}`}
            className="inline-flex h-8 items-center rounded-sm bg-pearl px-3 text-caption-medium text-ink-muted outline-none transition-all hover:bg-divider-soft focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            Edit
          </button>
        )}
      </div>
      <div ref={contentRef} className="border-t border-hairline p-4">
        {children}
      </div>
    </Card>
  )
}

type PersonalDraft = { fullName: string; email: string; phone: string }

function PersonalDetailsSection({
  fullName,
  email,
  phone,
  onSave,
}: {
  fullName: string
  email: string
  phone: string
  onSave: (draft: PersonalDraft) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PersonalDraft>({ fullName, email, phone })

  const startEdit = () => {
    setDraft({ fullName, email, phone })
    setEditing(true)
  }

  const fields = [
    { label: 'Full name', value: fullName },
    { label: 'Email', value: email, breakAll: true },
    { label: 'Phone', value: phone },
  ]

  return (
    <ReviewSection title="Personal details" editing={editing} onEdit={startEdit}>
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSave(draft)
            setEditing(false)
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="review-full-name" className="text-fine text-ink-faint">
              Full name
            </label>
            <input
              id="review-full-name"
              value={draft.fullName}
              onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="review-email" className="text-fine text-ink-faint">
              Email
            </label>
            <input
              id="review-email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="review-phone" className="text-fine text-ink-faint">
              Phone
            </label>
            <input
              id="review-phone"
              type="tel"
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
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
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                <dt className="text-caption text-ink-faint">{f.label}</dt>
                <dd
                  className={cn(
                    'min-w-0 break-words text-body text-ink',
                    f.breakAll && 'break-all',
                  )}
                >
                  {f.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      )}
    </ReviewSection>
  )
}

type AgedCareDraft = { employer: string; roleAtEmployer: string; yearsInAgedCare: string }

function AgedCareDetailsSection({
  employer,
  roleAtEmployer,
  yearsInAgedCare,
  onSave,
}: {
  employer: string
  roleAtEmployer: string
  yearsInAgedCare: string
  onSave: (draft: AgedCareDraft) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<AgedCareDraft>({ employer, roleAtEmployer, yearsInAgedCare })

  const startEdit = () => {
    setDraft({ employer, roleAtEmployer, yearsInAgedCare })
    setEditing(true)
  }

  const fields = [
    { label: 'Aged-care organisation', value: employer },
    { label: 'Role at organisation', value: roleAtEmployer },
    { label: 'Years of work experience', value: yearsInAgedCare },
  ]

  return (
    <ReviewSection title="Aged care details" editing={editing} onEdit={startEdit}>
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSave(draft)
            setEditing(false)
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="review-employer" className="text-fine text-ink-faint">
              Aged-care organisation
            </label>
            <input
              id="review-employer"
              value={draft.employer}
              onChange={(e) => setDraft((d) => ({ ...d, employer: e.target.value }))}
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="review-role" className="text-fine text-ink-faint">
              Role at organisation
            </label>
            <input
              id="review-role"
              value={draft.roleAtEmployer}
              onChange={(e) => setDraft((d) => ({ ...d, roleAtEmployer: e.target.value }))}
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="review-years" className="text-fine text-ink-faint">
              Years of work experience
            </label>
            <input
              id="review-years"
              type="number"
              min={0}
              value={draft.yearsInAgedCare}
              onChange={(e) => setDraft((d) => ({ ...d, yearsInAgedCare: e.target.value }))}
              className={cn(inputClass, 'sm:w-32')}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
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
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                <dt className="text-caption text-ink-faint">{f.label}</dt>
                <dd className="min-w-0 break-words text-body text-ink">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}
    </ReviewSection>
  )
}

export function AddCoachTraineeModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { coaches, addCoachTrainee } = useResearch()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [employer, setEmployer] = useState('')
  const [roleAtEmployer, setRoleAtEmployer] = useState('')
  const [yearsInAgedCare, setYearsInAgedCare] = useState('')
  const [error, setError] = useState('')
  const [discardOpen, setDiscardOpen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  /** Round 28: Review is the last real step now, so this is derived from the
   *  step index rather than being its own `useState` — one source of truth,
   *  matching `EnrollConsumerDialog`. The two could previously disagree. */
  const reviewing = step === REVIEW_STEP

  const previewParticipantId = nextParticipantId(coaches)

  const anyEntered =
    [fullName, email, phone, employer, roleAtEmployer, yearsInAgedCare].some(
      (v) => v.trim().length > 0,
    )

  const reset = () => {
    setStep(0)
    setFullName('')
    setEmail('')
    setPhone('')
    setEmployer('')
    setRoleAtEmployer('')
    setYearsInAgedCare('')
    setError('')
    setDiscardOpen(false)
  }

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus({ preventScroll: true })
      reset()
    } else if (triggerRef.current) {
      triggerRef.current.focus({ preventScroll: true })
      triggerRef.current = null
    }
    // reset is a stable function — only `open` should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const requestClose = () => {
    if (discardOpen) return
    if (!anyEntered) {
      onClose()
      return
    }
    setDiscardOpen(true)
  }

  const trapKeys = (e: React.KeyboardEvent) => {
    if (discardOpen) return
    if (e.key === 'Escape') {
      requestClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled]), textarea:not([disabled])',
      ),
    ]
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const goNext = () => {
    if (step === 0) {
      if (!fullName.trim() || !email.trim() || !phone.trim()) {
        setError('Fill in the trainee’s name, email, and phone number.')
        return
      }
      setError('')
      setStep(1)
      return
    }
    if (!employer.trim() || !roleAtEmployer.trim() || !yearsInAgedCare.trim()) {
      setError('Fill in their aged care employer, role, and years in aged care.')
      return
    }
    setError('')
    setStep(REVIEW_STEP)
  }

  const handleSubmit = () => {
    // Cohort is no longer a coach-facing concept — every new trainee is
    // placed in the one active cohort behind the scenes, matching the
    // grouping the schedule table's Stage O rows still rely on.
    const cohorts = [...new Set(coaches.map((c) => c.cohort))].sort()
    const cohort = cohorts[cohorts.length - 1] ?? 'Cohort 1'
    const id = addCoachTrainee({
      fullName,
      email,
      phone,
      employer,
      roleAtEmployer,
      yearsInAgedCare: Number(yearsInAgedCare) || 0,
      cohort,
    })
    onClose()
    navigate(`/research/coaches/${id}`)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/25"
              onClick={requestClose}
              aria-hidden="true"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                ref={panelRef}
                tabIndex={-1}
                onKeyDown={trapKeys}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="pointer-events-auto flex h-[85vh] max-h-[820px] w-full max-w-[920px] flex-col overflow-hidden rounded-lg bg-card p-6 outline-none ring-1 ring-hairline md:p-8"
              >
                {reviewing ? (
                  <>
                    <h2 id={titleId} className="shrink-0 font-display text-title text-ink">
                      Review coach trainee details
                    </h2>
                    <p className="mt-2 shrink-0 text-caption text-ink-faint">
                      Nothing has been added yet. Check the details below, then add them to the
                      roster.
                    </p>

                    <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                      <PersonalDetailsSection
                        fullName={fullName}
                        email={email}
                        phone={phone}
                        onSave={(draft) => {
                          setFullName(draft.fullName)
                          setEmail(draft.email)
                          setPhone(draft.phone)
                        }}
                      />

                      <AgedCareDetailsSection
                        employer={employer}
                        roleAtEmployer={roleAtEmployer}
                        yearsInAgedCare={yearsInAgedCare}
                        onSave={(draft) => {
                          setEmployer(draft.employer)
                          setRoleAtEmployer(draft.roleAtEmployer)
                          setYearsInAgedCare(draft.yearsInAgedCare)
                        }}
                      />

                      <ReviewSection title="Enrolment">
                        <dl>
                          {[
                            { label: 'Participant ID', value: previewParticipantId },
                            { label: 'Enrolment date', value: formatDate(TODAY) },
                          ].map((f, i) => (
                            <div key={f.label}>
                              {i > 0 && <Separator className="bg-divider-soft" />}
                              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                                <dt className="text-caption text-ink-faint">{f.label}</dt>
                                <dd className="min-w-0 break-words text-body text-ink">{f.value}</dd>
                              </div>
                            </div>
                          ))}
                        </dl>
                        <p className="mt-2 text-fine text-ink-faint">
                          Set automatically and not editable here.
                        </p>
                      </ReviewSection>
                    </div>

                    <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                      <button
                        type="button"
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                        className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Go back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                      >
                        Add coach trainee
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 id={titleId} className="shrink-0 font-display text-title text-ink">
                      Add coach trainee
                    </h2>

                    <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] md:gap-8">
                      <div className="shrink-0 rounded-lg bg-primary/10 p-4 md:p-6">
                        <WizardProgressRail
                          steps={RAIL_STEPS}
                          current={step}
                          ariaLabel="Add coach trainee progress"
                        />
                      </div>

                      <div>
                        <WizardStepHeading
                          step={step}
                          stepCount={STEP_COUNT}
                          heading={STEPS[step].heading}
                          subtitle={STEPS[step].subtitle}
                        />

                        {step === 0 ? (
                          <div className={cn(STEP_CONTENT_GAP, 'space-y-3')}>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="trainee-full-name" className="text-fine text-ink-faint">
                                Full name
                              </label>
                              <input
                                id="trainee-full-name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoComplete="off"
                                className={inputClass}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="trainee-email" className="text-fine text-ink-faint">
                                Email
                              </label>
                              <input
                                id="trainee-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                                className={inputClass}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="trainee-phone" className="text-fine text-ink-faint">
                                Phone
                              </label>
                              <input
                                id="trainee-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                autoComplete="off"
                                className={inputClass}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className={cn(STEP_CONTENT_GAP, 'space-y-3')}>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="trainee-employer" className="text-fine text-ink-faint">
                                Aged-care organisation
                              </label>
                              <input
                                id="trainee-employer"
                                value={employer}
                                onChange={(e) => setEmployer(e.target.value)}
                                autoComplete="off"
                                className={inputClass}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="trainee-role" className="text-fine text-ink-faint">
                                Role at organisation
                              </label>
                              <input
                                id="trainee-role"
                                value={roleAtEmployer}
                                onChange={(e) => setRoleAtEmployer(e.target.value)}
                                autoComplete="off"
                                className={inputClass}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="trainee-years" className="text-fine text-ink-faint">
                                Years of work experience
                              </label>
                              <input
                                id="trainee-years"
                                type="number"
                                min={0}
                                value={yearsInAgedCare}
                                onChange={(e) => setYearsInAgedCare(e.target.value)}
                                className={cn(inputClass, 'sm:w-32')}
                              />
                            </div>
                          </div>
                        )}

                        {error && (
                          <p role="alert" className="mt-3 text-fine text-destructive">
                            {error}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={cn(MODAL_FOOTER_SURFACE, 'mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3')}>
                      <button
                        type="button"
                        onClick={requestClose}
                        className="inline-flex min-h-11 items-center rounded-sm text-caption-medium text-ink-muted outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Cancel
                      </button>
                      <div className="flex items-center gap-3">
                        {step > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setError('')
                              setStep((s) => Math.max(0, s - 1))
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-primary px-[18px] text-caption-medium text-primary outline-none transition-all hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                          >
                            {/* Round 20 design-critique fix: Round 20 renamed
                                the review screen's back control to "Go back"
                                but left the wizard steps' own back button as
                                "Back" — the same control, in the same footer
                                position, labelled two ways inside one flow. */}
                            Go back
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={goNext}
                          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
                        >
                          {step === REVIEW_STEP - 1 ? 'Review details' : 'Next'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={discardOpen}
        title="Discard this coach trainee?"
        body="Nothing you've entered will be saved. You'll need to start over from Step 1."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          setDiscardOpen(false)
          onClose()
        }}
        onClose={() => setDiscardOpen(false)}
      />
    </>
  )
}
