import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { WizardProgressRail } from '@/components/shared/WizardProgressRail'
import { STEP_CONTENT_GAP, WizardStepHeading } from '@/components/shared/WizardStepHeading'
import { MODAL_FOOTER_SURFACE } from '@/components/shared/modalFooter'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'

/**
 * "Enroll new consumer" — the Consumer Management Table's intake flow.
 * A multi-step wizard (same dialog chassis, progress rail, and
 * steps-then-review shape as `AddCoachTraineeModal`/`AddAnnotationSummaryModal`)
 * rather than one small form, since a real study intake needs more than a
 * handful of fields to fit comfortably in a single screen.
 *
 * Step 1 chooses dyad vs. carer-only up front, which decides whether the
 * PLE details step exists at all for the rest of the flow — a carer-only
 * consumer never sees a PLE step, rather than seeing one it has to skip.
 * No coach is assigned here — that happens later from the Coach view
 * (`AssignConsumerDialog`), which picks from consumers this form has
 * already enrolled.
 */

type StepKey = 'type' | 'consentCheck' | 'plwd' | 'carer' | 'context' | 'review'

interface WizardStep {
  key: StepKey
  /** Short (2–3 word) label shown in the progress rail. */
  navLabel: string
  /** Fuller, instructional heading shown above the step's fields. */
  heading: string
  /** One-line subtitle shown under the heading. */
  subtitle: string
}

const DYAD_STEPS: WizardStep[] = [
  {
    key: 'type',
    navLabel: 'Consumer type',
    heading: 'Choose dyad or carer only',
    subtitle: 'Select how this consumer is enrolling in the study.',
  },
  {
    // Round 28, direct instruction: a consent gate immediately after the
    // dyad/carer choice. Deliberately distinct from the `consent` step at the
    // end of this wizard — that one *attaches paperwork* and is explicitly
    // optional ("you can also add this later"). This one asks whether informed
    // consent was actually obtained, and is the one thing in this wizard that
    // can stop an enrolment outright. Placed early for that reason: it is the
    // cheapest possible point to discover the answer is no, before the
    // researcher types four screens of personal details.
    key: 'consentCheck',
    navLabel: 'Consent check',
    heading: 'Confirm consent has been obtained',
    subtitle: 'This consumer can only be enrolled once informed consent has been given.',
  },
  {
    key: 'plwd',
    navLabel: 'PLE details',
    heading: "Add the PLE's details",
    subtitle: 'Basic details for the person living with dementia.',
  },
  {
    key: 'carer',
    navLabel: 'Carer details',
    heading: "Add the carer's details",
    subtitle: 'Basic and contact details for the carer.',
  },
  {
    key: 'context',
    navLabel: 'Sleep & caregiving',
    heading: 'Describe sleep & caregiving',
    subtitle: "What this consumer wants from sleep coaching, and their day-to-day caregiving situation.",
  },
  {
    // Round 28, direct instruction: the consent-document upload step is gone —
    // consent forms are no longer stored on the platform. Review takes its
    // place as the final step, so the rail now ends where the flow actually
    // ends rather than on an optional attachment screen.
    //
    // Review being a real step (rather than a screen that appears *after* the
    // last one) is what makes the rail honest: "Step 6 of 6" now counts the
    // thing the researcher is actually looking at.
    key: 'review',
    navLabel: 'Review',
    heading: 'Review and confirm',
    subtitle: 'Check the details below, then enroll this consumer.',
  },
]

/** Every dyad step except the PLE one — a carer enrolling alone has no PLE.
 *
 *  Round 28: was a positional list (`DYAD_STEPS[0], [2], [3], [4]`), which
 *  silently mis-mapped the moment a step was inserted above — exactly what
 *  happened when `consentCheck` went in at index 1. Filtering by key instead
 *  means a future insertion maintains this automatically. */
const CARER_ONLY_STEPS: WizardStep[] = DYAD_STEPS.filter((s) => s.key !== 'plwd')

/**
 * Step 1's two options, from Figma frame `334:36`.
 *
 * The artwork is the frame's **own exported assets**, downloaded and committed
 * to `public/illustrations/` (the same treatment Round 23 gave the certificate
 * pair) rather than redrawn — there is no vector data to redraw from, so
 * anything hand-authored would simply be a different picture.
 *
 * Each illustration is two SVG groups, positioned by the frame's own
 * percentage insets inside the 120px container. The negative bottom insets are
 * transcribed, not typos: the figures are drawn taller than the container and
 * clipped at its bottom edge, which is the composition the frame shows.
 */
const CONSUMER_TYPE_OPTIONS = [
  {
    carer: false,
    title: 'Dyad',
    body: 'A person living with dementia and their carer, both enrolled together.',
    artFront: '/illustrations/enroll-dyad-front.svg',
    artFrontInset: 'inset-[18.52%_42.4%_59.2%_44.37%]',
    artMain: '/illustrations/enroll-dyad-main.svg',
    artMainInset: 'inset-[4.09%_22.27%_-37.38%_22.27%]',
  },
  {
    carer: true,
    title: 'Carer only',
    body: 'A carer participating on their own, with no co-enrolled person with dementia.',
    artFront: '/illustrations/enroll-carer-front.svg',
    artFrontInset: 'inset-[25.96%_20.52%_40.92%_59.77%]',
    artMain: '/illustrations/enroll-carer-main.svg',
    artMainInset: 'inset-[10.83%_15.42%_-104.58%_22.27%]',
  },
] as const

const inputClass =
  'h-9 w-full rounded-sm border border-hairline bg-card px-3 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'
const textareaClass =
  'w-full rounded-sm border border-hairline bg-card px-3 py-2 text-caption text-ink outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Review-step section chrome — matches `AddCoachTraineeModal`'s own
 * `ReviewSection` (`bg-card-header` header band, hairline divider,
 * top-right "Edit"), reused here rather than reinvented so both wizards'
 * review screens read as one pattern. Sections with no `onEdit` (Consumer
 * type, Consent) render as plain read-only cards with the same title chrome.
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

  // Round 20 accessibility review — identical fix to `AddCoachTraineeModal`'s
  // own `ReviewSection` (kept in sync deliberately, matching the duplication
  // this component's doc comment above already documents): Edit → form and
  // Save/Cancel → read-only both unmount the control that was just
  // activated, dropping focus to `<body>` and, inside an open modal, taking
  // the panel's `keydown` Tab trap out of the loop with it.
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
            // Three sections all render a button labelled just "Edit" — this
            // is what tells them apart in a screen reader's button list.
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

function FieldList({ fields }: { fields: { label: string; value: string; breakAll?: boolean }[] }) {
  return (
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
  )
}

type PlwdDraft = { patientName: string; patientAge: string; patientBackground: string }

function PlwdDetailsSection({
  patientName,
  patientAge,
  patientBackground,
  onSave,
}: {
  patientName: string
  patientAge: string
  patientBackground: string
  onSave: (draft: PlwdDraft) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PlwdDraft>({ patientName, patientAge, patientBackground })

  const startEdit = () => {
    setDraft({ patientName, patientAge, patientBackground })
    setEditing(true)
  }

  return (
    <ReviewSection title="PLE details" editing={editing} onEdit={startEdit}>
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSave(draft)
            setEditing(false)
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="review-patient-name" className="text-fine text-ink-faint">
                Name
              </label>
              <input
                id="review-patient-name"
                value={draft.patientName}
                onChange={(e) => setDraft((d) => ({ ...d, patientName: e.target.value }))}
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="review-patient-age" className="text-fine text-ink-faint">
                Age
              </label>
              <input
                id="review-patient-age"
                type="number"
                min={0}
                value={draft.patientAge}
                onChange={(e) => setDraft((d) => ({ ...d, patientAge: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="review-patient-background" className="text-fine text-ink-faint">
              Background
            </label>
            <textarea
              id="review-patient-background"
              value={draft.patientBackground}
              onChange={(e) => setDraft((d) => ({ ...d, patientBackground: e.target.value }))}
              rows={3}
              className={textareaClass}
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
        <FieldList
          fields={[
            { label: 'Name', value: patientName },
            { label: 'Age', value: patientAge },
            { label: 'Background', value: patientBackground },
          ]}
        />
      )}
    </ReviewSection>
  )
}

type CarerDraft = {
  carerName: string
  carerAge: string
  relationship: string
  carerEmail: string
  carerPhone: string
  carerBackground: string
}

function CarerDetailsSection({
  carerOnly,
  carerName,
  carerAge,
  relationship,
  carerEmail,
  carerPhone,
  carerBackground,
  onSave,
}: {
  carerOnly: boolean
  carerName: string
  carerAge: string
  relationship: string
  carerEmail: string
  carerPhone: string
  carerBackground: string
  onSave: (draft: CarerDraft) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<CarerDraft>({
    carerName,
    carerAge,
    relationship,
    carerEmail,
    carerPhone,
    carerBackground,
  })

  const startEdit = () => {
    setDraft({ carerName, carerAge, relationship, carerEmail, carerPhone, carerBackground })
    setEditing(true)
  }

  const fields = [
    { label: 'Name', value: carerName },
    { label: 'Age', value: carerAge },
    ...(!carerOnly ? [{ label: 'Relationship to PLE', value: relationship || '—' }] : []),
    { label: 'Email', value: carerEmail || '—', breakAll: true },
    { label: 'Phone', value: carerPhone || '—' },
    { label: 'Background', value: carerBackground },
  ]

  return (
    <ReviewSection title="Carer details" editing={editing} onEdit={startEdit}>
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSave(draft)
            setEditing(false)
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="review-carer-name" className="text-fine text-ink-faint">
                Name
              </label>
              <input
                id="review-carer-name"
                value={draft.carerName}
                onChange={(e) => setDraft((d) => ({ ...d, carerName: e.target.value }))}
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="review-carer-age" className="text-fine text-ink-faint">
                Age
              </label>
              <input
                id="review-carer-age"
                type="number"
                min={0}
                value={draft.carerAge}
                onChange={(e) => setDraft((d) => ({ ...d, carerAge: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          {!carerOnly && (
            <div className="flex flex-col gap-1">
              <label htmlFor="review-carer-relationship" className="text-fine text-ink-faint">
                Relationship to PLE
              </label>
              <input
                id="review-carer-relationship"
                value={draft.relationship}
                onChange={(e) => setDraft((d) => ({ ...d, relationship: e.target.value }))}
                autoComplete="off"
                className={inputClass}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="review-carer-email" className="text-fine text-ink-faint">
                Email <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                id="review-carer-email"
                type="email"
                value={draft.carerEmail}
                onChange={(e) => setDraft((d) => ({ ...d, carerEmail: e.target.value }))}
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="review-carer-phone" className="text-fine text-ink-faint">
                Phone <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                id="review-carer-phone"
                type="tel"
                value={draft.carerPhone}
                onChange={(e) => setDraft((d) => ({ ...d, carerPhone: e.target.value }))}
                autoComplete="off"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="review-carer-background" className="text-fine text-ink-faint">
              Background
            </label>
            <textarea
              id="review-carer-background"
              value={draft.carerBackground}
              onChange={(e) => setDraft((d) => ({ ...d, carerBackground: e.target.value }))}
              rows={3}
              className={textareaClass}
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
        <FieldList fields={fields} />
      )}
    </ReviewSection>
  )
}

type ContextDraft = { sleepGoals: string; caregivingContext: string; notes: string }

function SleepCaregivingSection({
  sleepGoals,
  caregivingContext,
  notes,
  onSave,
}: {
  sleepGoals: string
  caregivingContext: string
  notes: string
  onSave: (draft: ContextDraft) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ContextDraft>({ sleepGoals, caregivingContext, notes })

  const startEdit = () => {
    setDraft({ sleepGoals, caregivingContext, notes })
    setEditing(true)
  }

  return (
    <ReviewSection title="Sleep & caregiving" editing={editing} onEdit={startEdit}>
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
            <label htmlFor="review-sleep-goals" className="text-fine text-ink-faint">
              Sleep goals
            </label>
            <textarea
              id="review-sleep-goals"
              value={draft.sleepGoals}
              onChange={(e) => setDraft((d) => ({ ...d, sleepGoals: e.target.value }))}
              rows={2}
              className={textareaClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="review-caregiving-context" className="text-fine text-ink-faint">
              Caregiving context
            </label>
            <textarea
              id="review-caregiving-context"
              value={draft.caregivingContext}
              onChange={(e) => setDraft((d) => ({ ...d, caregivingContext: e.target.value }))}
              rows={2}
              className={textareaClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="review-notes" className="text-fine text-ink-faint">
              Additional notes <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <textarea
              id="review-notes"
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              rows={2}
              className={textareaClass}
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
        <FieldList
          fields={[
            { label: 'Sleep goals', value: sleepGoals },
            { label: 'Caregiving context', value: caregivingContext },
            { label: 'Additional notes', value: notes || '—' },
          ]}
        />
      )}
    </ReviewSection>
  )
}

export function EnrollConsumerDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { enrollConsumer } = useResearch()

  const [step, setStep] = useState(0)
  const [carerOnly, setCarerOnly] = useState(false)
  /**
   * Round 28 — the consent gate's answer.
   *
   * Three states, not a boolean: `null` is "not answered yet", which is
   * genuinely different from "answered no". Both block progress, but only the
   * second one deserves an explanation on screen, and a boolean defaulting to
   * `false` would have shown the researcher a consent warning before they had
   * touched anything.
   */
  const [consentObtained, setConsentObtained] = useState<'yes' | 'no' | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientBackground, setPatientBackground] = useState('')
  const [carerName, setCarerName] = useState('')
  const [carerAge, setCarerAge] = useState('')
  const [relationship, setRelationship] = useState('')
  const [carerBackground, setCarerBackground] = useState('')
  const [carerEmail, setCarerEmail] = useState('')
  const [carerPhone, setCarerPhone] = useState('')
  const [sleepGoals, setSleepGoals] = useState('')
  const [caregivingContext, setCaregivingContext] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [discardOpen, setDiscardOpen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  const steps = carerOnly ? CARER_ONLY_STEPS : DYAD_STEPS
  const currentKey = steps[Math.min(step, steps.length - 1)].key
  /** Round 28: Review is now the last real step, so this is derived rather than
   *  its own `useState`. One source of truth — the two could previously
   *  disagree (e.g. `reviewing` true while `step` still pointed elsewhere). */
  const reviewing = currentKey === 'review'

  const anyEntered =
    [
      patientName,
      patientAge,
      patientBackground,
      carerName,
      carerAge,
      relationship,
      carerBackground,
      carerEmail,
      carerPhone,
      sleepGoals,
      caregivingContext,
      notes,
    ].some((v) => v.trim().length > 0)

  const reset = () => {
    setStep(0)
    setCarerOnly(false)
    setConsentObtained(null)
    setPatientName('')
    setPatientAge('')
    setPatientBackground('')
    setCarerName('')
    setCarerAge('')
    setRelationship('')
    setCarerBackground('')
    setCarerEmail('')
    setCarerPhone('')
    setSleepGoals('')
    setCaregivingContext('')
    setNotes('')
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
    if (currentKey === 'plwd' && (!patientName.trim() || !patientAge.trim() || !patientBackground.trim())) {
      setError('Fill in the PLE’s name, age, and background.')
      return
    }
    if (currentKey === 'carer' && (!carerName.trim() || !carerAge.trim() || !carerBackground.trim())) {
      setError('Fill in the carer’s name, age, and background.')
      return
    }
    if (currentKey === 'context' && (!sleepGoals.trim() || !caregivingContext.trim())) {
      setError('Fill in sleep goals and caregiving context.')
      return
    }
    // Round 28 — the one hard stop in this wizard. `no` is handled on the step
    // itself (a persistent explanation, plus a disabled Next), so the only case
    // that needs an error here is "hasn't answered".
    if (currentKey === 'consentCheck' && consentObtained !== 'yes') {
      setError(
        consentObtained === 'no'
          ? 'Consent must be obtained before this consumer can be enrolled.'
          : 'Confirm whether consent has been obtained.',
      )
      return
    }
    setError('')
    setStep((s) => s + 1)
  }

  const handleSubmit = () => {
    enrollConsumer({
      patient: carerOnly
        ? undefined
        : { name: patientName, age: Number(patientAge) || 0, background: patientBackground },
      carer: {
        name: carerName,
        age: Number(carerAge) || 0,
        relationship: carerOnly ? undefined : relationship || undefined,
        background: carerBackground,
        email: carerEmail.trim() || undefined,
        phone: carerPhone.trim() || undefined,
      },
      sleepGoals,
      caregivingContext,
      notes: notes.trim() || undefined,
    })
    onClose()
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
                      Review consumer details
                    </h2>
                    <p className="mt-2 shrink-0 text-caption text-ink-faint">
                      Nothing has been added yet. Check the details below, then enroll this
                      consumer.
                    </p>

                    <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                      <ReviewSection title="Consumer type">
                        {/* Round 28: consent shown alongside type. Both are
                            set in the wizard's first two steps, neither is
                            editable here, and consent is the more consequential
                            of the two — a review screen that omitted it would
                            be presenting an enrolment for confirmation without
                            showing the condition that permitted it. Reaching
                            this screen at all means the answer was "yes", so
                            the value is not conditional. */}
                        <FieldList
                          fields={[
                            { label: 'Type', value: carerOnly ? 'Carer only' : 'Dyad' },
                            { label: 'Consent obtained', value: 'Yes' },
                          ]}
                        />
                        <p className="mt-2 text-fine text-ink-faint">
                          Set in the first two steps and not editable here. Cancel and start over
                          to change either.
                        </p>
                      </ReviewSection>

                      {!carerOnly && (
                        <PlwdDetailsSection
                          patientName={patientName}
                          patientAge={patientAge}
                          patientBackground={patientBackground}
                          onSave={(draft) => {
                            setPatientName(draft.patientName)
                            setPatientAge(draft.patientAge)
                            setPatientBackground(draft.patientBackground)
                          }}
                        />
                      )}

                      <CarerDetailsSection
                        carerOnly={carerOnly}
                        carerName={carerName}
                        carerAge={carerAge}
                        relationship={relationship}
                        carerEmail={carerEmail}
                        carerPhone={carerPhone}
                        carerBackground={carerBackground}
                        onSave={(draft) => {
                          setCarerName(draft.carerName)
                          setCarerAge(draft.carerAge)
                          setRelationship(draft.relationship)
                          setCarerEmail(draft.carerEmail)
                          setCarerPhone(draft.carerPhone)
                          setCarerBackground(draft.carerBackground)
                        }}
                      />

                      <SleepCaregivingSection
                        sleepGoals={sleepGoals}
                        caregivingContext={caregivingContext}
                        notes={notes}
                        onSave={(draft) => {
                          setSleepGoals(draft.sleepGoals)
                          setCaregivingContext(draft.caregivingContext)
                          setNotes(draft.notes)
                        }}
                      />

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
                        Enroll consumer
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 id={titleId} className="shrink-0 font-display text-title text-ink">
                      Enroll a new consumer
                    </h2>

                    <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] md:gap-8">
                      <div className="shrink-0 rounded-lg bg-primary/10 p-4 md:p-6">
                        <WizardProgressRail
                          current={step}
                          steps={steps}
                          ariaLabel="Enroll consumer progress"
                        />
                      </div>

                      <div>
                        <WizardStepHeading
                          step={step}
                          stepCount={steps.length}
                          heading={steps[step].heading}
                          subtitle={steps[step].subtitle}
                        />

                        {currentKey === 'type' && (
                          // `cards-container` (`334:41`): side by side, 20px
                          // gap, both cards a fixed 280px so they stay equal
                          // regardless of how their copy wraps.
                          <div
                            className={cn(STEP_CONTENT_GAP, 'flex flex-col gap-5 sm:flex-row')}
                            role="radiogroup"
                            aria-label="Consumer type"
                          >
                            {CONSUMER_TYPE_OPTIONS.map((opt) => {
                              const selected = carerOnly === opt.carer
                              return (
                                <button
                                  key={opt.title}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  onClick={() => setCarerOnly(opt.carer)}
                                  className={cn(
                                    'flex flex-1 flex-col gap-3 rounded-md p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:h-[280px]',
                                    // `card-dyad` (`334:42`) selected vs
                                    // `card-carer` (`334:47`) default. The
                                    // frame's 1.5px selected stroke against a
                                    // 1px default is deliberate — it is what
                                    // keeps the card from shifting size when
                                    // picked, since both are drawn inside the
                                    // box.
                                    selected
                                      ? 'border-[1.5px] border-purple-900 bg-purple-50'
                                      : 'border border-hairline bg-card hover:bg-purple-50/50',
                                  )}
                                >
                                  {/* `icon-container` (`335:4224`/`335:4835`):
                                      120px tall, full width, 8px radius, and
                                      the tint changes with state — Purple/300
                                      when selected, Purple/200 when not.

                                      The illustrations are the frame's own
                                      exported assets, committed under
                                      `public/illustrations/`, positioned with
                                      the frame's own percentage insets. The
                                      negative bottom inset is not a mistake:
                                      each figure is drawn taller than the
                                      container and clipped at the bottom edge,
                                      which is what `overflow-hidden` here is
                                      for. */}
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      'relative block h-[120px] w-full shrink-0 overflow-hidden rounded-sm transition-colors',
                                      selected ? 'bg-purple-300' : 'bg-purple-200',
                                    )}
                                  >
                                    <img
                                      alt=""
                                      src={opt.artFront}
                                      className={cn('absolute block max-w-none', opt.artFrontInset)}
                                    />
                                    <img
                                      alt=""
                                      src={opt.artMain}
                                      className={cn('absolute block max-w-none', opt.artMainInset)}
                                    />
                                  </span>
                                  <span className="flex flex-col gap-1">
                                    {/* The frame draws 18/700 here. No step in
                                        this app's scale is 18px bold, and the
                                        instruction was to stay on our tokens
                                        rather than mint one, so this is
                                        `body-md` (16/600) — the closest
                                        emphasised-body step. */}
                                    <span className="text-body-md text-ink">{opt.title}</span>
                                    <span className="text-caption text-ink-muted">{opt.body}</span>
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {currentKey === 'consentCheck' && (
                          <div className={STEP_CONTENT_GAP}>
                            {/* Native `<input type="radio">`, not the
                                `role="radio"` buttons the Consumer type step
                                above uses.

                                Two reasons. (1) The options are mutually
                                exclusive, which is a radio group, not two
                                checkboxes — two checkboxes would claim the
                                researcher can tick both "yes" and "no".
                                (2) A native radio group brings arrow-key
                                navigation, roving focus and grouping for free.
                                The hand-rolled `role="radiogroup"` above does
                                NOT implement that contract — the same gap
                                Round 14.5 found and fixed on `WeekdayPicker`.
                                Rather than copy a known-broken pattern for
                                consistency's sake, this uses the element that
                                is correct by construction. The indicator is
                                drawn as a check-in-a-box to match the
                                tick-style control asked for. */}
                            <fieldset className="space-y-3">
                              <legend className="sr-only">
                                Has informed consent been obtained for this consumer?
                              </legend>
                              {(
                                [
                                  {
                                    value: 'yes' as const,
                                    label: 'Yes, I have obtained consent',
                                    hint: 'Informed consent has been given and can be evidenced.',
                                  },
                                  {
                                    value: 'no' as const,
                                    label: 'No, I have not obtained consent',
                                    hint: 'Enrolment cannot continue until consent has been given.',
                                  },
                                ]
                              ).map((opt) => (
                                <label
                                  key={opt.value}
                                  className={cn(
                                    'flex w-full cursor-pointer items-start gap-3 rounded-sm border p-4 transition-colors',
                                    consentObtained === opt.value
                                      ? 'border-primary bg-primary/5'
                                      : 'border-hairline hover:bg-pearl',
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="consent-obtained"
                                    value={opt.value}
                                    checked={consentObtained === opt.value}
                                    onChange={() => {
                                      setConsentObtained(opt.value)
                                      setError('')
                                    }}
                                    className="peer sr-only"
                                  />
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs border transition-colors',
                                      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                                      consentObtained === opt.value
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-hairline bg-card',
                                    )}
                                  >
                                    {consentObtained === opt.value && (
                                      <Check className="size-3.5" strokeWidth={3} />
                                    )}
                                  </span>
                                  <span>
                                    <span className="block text-caption font-semibold text-ink">
                                      {opt.label}
                                    </span>
                                    {/* Round 28, direct instruction: `caption`
                                        regular in `ink`, not `fine`/`ink-faint`
                                        — matching the Consumer type cards, so
                                        both selection steps read alike. */}
                                    <span className="mt-1 block text-caption text-ink">
                                      {opt.hint}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </fieldset>

                            {/* Shown only for an explicit "no". Not an error —
                                the researcher answered honestly and the system
                                is telling them what has to happen first, so it
                                is phrased as a next step rather than a
                                rejection. `role="status"`, not `alert`: it is
                                the consequence of a choice they just made, not
                                an interruption. */}
                            {consentObtained === 'no' && (
                              <div
                                role="status"
                                className="mt-4 rounded-sm border border-destructive/30 bg-destructive/8 p-4"
                              >
                                <p className="text-caption font-semibold text-destructive">
                                  This consumer cannot be enrolled yet
                                </p>
                                <p className="mt-1 text-caption text-ink">
                                  Informed consent has to be obtained before any details are
                                  recorded. Cancel this enrolment, complete the consent process,
                                  then start again.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {currentKey === 'plwd' && (
                          <div className={cn(STEP_CONTENT_GAP, 'space-y-3')}>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="flex flex-col gap-1">
                                <label htmlFor="enroll-patient-name" className="text-fine text-ink-faint">
                                  Name
                                </label>
                                <input
                                  id="enroll-patient-name"
                                  value={patientName}
                                  onChange={(e) => setPatientName(e.target.value)}
                                  autoComplete="off"
                                  className={inputClass}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label htmlFor="enroll-patient-age" className="text-fine text-ink-faint">
                                  Age
                                </label>
                                <input
                                  id="enroll-patient-age"
                                  type="number"
                                  min={0}
                                  value={patientAge}
                                  onChange={(e) => setPatientAge(e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="enroll-patient-background" className="text-fine text-ink-faint">
                                Background
                              </label>
                              <textarea
                                id="enroll-patient-background"
                                value={patientBackground}
                                onChange={(e) => setPatientBackground(e.target.value)}
                                rows={3}
                                className={textareaClass}
                              />
                            </div>
                          </div>
                        )}

                        {currentKey === 'carer' && (
                          <div className={cn(STEP_CONTENT_GAP, 'space-y-3')}>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="flex flex-col gap-1">
                                <label htmlFor="enroll-carer-name" className="text-fine text-ink-faint">
                                  Name
                                </label>
                                <input
                                  id="enroll-carer-name"
                                  value={carerName}
                                  onChange={(e) => setCarerName(e.target.value)}
                                  autoComplete="off"
                                  className={inputClass}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label htmlFor="enroll-carer-age" className="text-fine text-ink-faint">
                                  Age
                                </label>
                                <input
                                  id="enroll-carer-age"
                                  type="number"
                                  min={0}
                                  value={carerAge}
                                  onChange={(e) => setCarerAge(e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                            {!carerOnly && (
                              <div className="flex flex-col gap-1">
                                <label htmlFor="enroll-carer-relationship" className="text-fine text-ink-faint">
                                  Relationship to PLE
                                </label>
                                <input
                                  id="enroll-carer-relationship"
                                  value={relationship}
                                  onChange={(e) => setRelationship(e.target.value)}
                                  autoComplete="off"
                                  className={inputClass}
                                />
                              </div>
                            )}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="flex flex-col gap-1">
                                <label htmlFor="enroll-carer-email" className="text-fine text-ink-faint">
                                  Email <span className="font-normal text-ink-faint">(optional)</span>
                                </label>
                                <input
                                  id="enroll-carer-email"
                                  type="email"
                                  value={carerEmail}
                                  onChange={(e) => setCarerEmail(e.target.value)}
                                  autoComplete="off"
                                  className={inputClass}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label htmlFor="enroll-carer-phone" className="text-fine text-ink-faint">
                                  Phone <span className="font-normal text-ink-faint">(optional)</span>
                                </label>
                                <input
                                  id="enroll-carer-phone"
                                  type="tel"
                                  value={carerPhone}
                                  onChange={(e) => setCarerPhone(e.target.value)}
                                  autoComplete="off"
                                  className={inputClass}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="enroll-carer-background" className="text-fine text-ink-faint">
                                Background
                              </label>
                              <textarea
                                id="enroll-carer-background"
                                value={carerBackground}
                                onChange={(e) => setCarerBackground(e.target.value)}
                                rows={3}
                                className={textareaClass}
                              />
                            </div>
                          </div>
                        )}

                        {currentKey === 'context' && (
                          <div className={cn(STEP_CONTENT_GAP, 'space-y-3')}>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="enroll-sleep-goals" className="text-fine text-ink-faint">
                                Sleep goals
                              </label>
                              <textarea
                                id="enroll-sleep-goals"
                                value={sleepGoals}
                                onChange={(e) => setSleepGoals(e.target.value)}
                                rows={2}
                                className={textareaClass}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="enroll-caregiving-context" className="text-fine text-ink-faint">
                                Caregiving context
                              </label>
                              <textarea
                                id="enroll-caregiving-context"
                                value={caregivingContext}
                                onChange={(e) => setCaregivingContext(e.target.value)}
                                rows={2}
                                className={textareaClass}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="enroll-notes" className="text-fine text-ink-faint">
                                Additional notes <span className="font-normal text-ink-faint">(optional)</span>
                              </label>
                              <textarea
                                id="enroll-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className={textareaClass}
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
                            {/* Round 20 design-critique fix — see the matching
                                note in AddCoachTraineeModal.tsx: the review
                                screen says "Go back", the wizard steps said
                                "Back". Same control, one label. */}
                            Go back
                          </button>
                        )}
                        {/* Round 28 — blocked only on the consent step, and
                            only once the researcher has actually said "no".
                            `aria-disabled` rather than `disabled` so the
                            control stays focusable and a keyboard user can
                            reach it and read why it is inert (Round 16's
                            precedent); `goNext` still runs and sets the error,
                            so pressing it explains itself rather than doing
                            nothing. */}
                        <button
                          type="button"
                          onClick={goNext}
                          aria-disabled={currentKey === 'consentCheck' && consentObtained === 'no'}
                          className={cn(
                            'inline-flex h-9 items-center justify-center rounded-full px-[18px] text-caption-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            currentKey === 'consentCheck' && consentObtained === 'no'
                              ? 'cursor-not-allowed bg-primary/40 text-white'
                              : 'bg-primary text-white hover:bg-primary-hover active:scale-[0.97]',
                          )}
                        >
                          {/* Round 28: `- 2`, not `- 1`. Review is now a step
                              of its own with its own footer, so this footer's
                              last appearance is on the step *before* it —
                              which is the one that should say where Next
                              leads. With `- 1` the label was unreachable and
                              every step read "Next", including the last. */}
                          {step === steps.length - 2 ? 'Review details' : 'Next'}
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
        title="Discard this consumer?"
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
