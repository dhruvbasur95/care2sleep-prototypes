import { cn } from '@/lib/utils'
import {
  certificationLabels,
  inviteStatusLabels,
  statusLabels,
  type CertificationOutcome,
  type CoachStatus,
  type InviteStatus,
} from '@/data/research'

/**
 * Every status chip in the dashboard. `Chip` is the primitive; the three named
 * wrappers below bind a specific domain enum to a tone so a given status
 * always looks the same wherever it appears.
 *
 * Callers: all six research pages plus `SessionsPlanOverview`,
 * `PlanSessionsModal` and `EditSessionPlanModal`.
 *
 * ⚠️ THE SIX TONES ARE ONE SET AND MUST STAY ONE SET. All six render the same
 * treatment — filled tint, matching-tint border, coloured text — differing
 * only in hue. Half of them used to fall through to plain grey chrome with
 * only tinted text, and the result read as a bug: the same concept rendering
 * two ways depending on which status it happened to be. Do not give a tone its
 * own geometry, and do not hand-roll a chip elsewhere.
 *
 * State is never carried by colour alone — the label always says it.
 *
 * ⚠️ CONTRAST IS CALIBRATED, INCLUDING THE FILL OPACITY. All six were measured
 * with the WCAG formula against the flattened tint-on-white result, not
 * eyeballed: success 4.66:1, neutral 10.96:1, muted 4.75:1, warning 6.84:1,
 * next 6.41:1, destructive 4.66:1.
 *
 * The 8% fill is counter-intuitive and load-bearing. These text colours sit
 * close in lightness to their own tints, so *raising* opacity toward the more
 * usual 10-20% pulls contrast **under** 4.5:1. Lower opacity lightens the
 * background, which raises contrast against dark text. `next` is also
 * deliberately on `primary-hover` rather than `primary`: `primary` measured
 * 3.68:1 against its own tint and failed AA.
 *
 * Geometry is `h-[27px]`, not padding-derived — see the note at `Chip`.
 */
type Tone = 'success' | 'neutral' | 'muted' | 'warning' | 'next' | 'destructive'

function toneClass(tone: Tone): string {
  switch (tone) {
    case 'success':
      return 'border-success/20 bg-success/8 text-success'
    case 'neutral':
      return 'border-ink-muted/20 bg-ink-muted/8 text-ink-muted'
    case 'muted':
      return 'border-hairline bg-parchment text-ink-faint'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'next':
      return 'border-primary-hover/20 bg-primary-hover/8 text-primary-hover'
    case 'destructive':
      return 'border-destructive/20 bg-destructive/8 text-destructive'
  }
}

export function Chip({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={cn(
        // `h-[27px]` explicitly, not padding plus auto height. The 1px border
        // is drawn *inside* the 27px box, which `box-sizing: border-box` only
        // reproduces when the height is stated; padding alone gives 29px.
        //
        // Weight comes from `text-fine`, which is 600 app-wide. Do not add
        // `font-semibold` per tone — it would override the token.
        'inline-flex h-[27px] shrink-0 items-center rounded-full border px-4 text-fine whitespace-nowrap',
        toneClass(tone),
      )}
    >
      {label}
    </span>
  )
}

/** Study-lifecycle status. Distinct from `InviteStatusChip` below — see its
 *  note; conflating the two has caused a KPI to contradict the table under it
 *  more than once. */
const coachTone: Record<CoachStatus, Tone> = {
  enrolled: 'neutral',
  active: 'success',
  completed: 'success',
  withdrawn: 'muted',
}

export function CoachStatusChip({ status }: { status: CoachStatus }) {
  return <Chip tone={coachTone[status]} label={statusLabels[status]} />
}

/* `not-yet-assessed` is red rather than a quiet grey on purpose: a trainee who
   has ticked every stage but has no Placement 2 outcome recorded is blocked and
   waiting on the research team, which is the thing on that card worth chasing.
   `destructive` carries the same "nothing has happened and it should have"
   meaning as "Not assigned" on Consumer Management. */
const certTone: Record<CertificationOutcome, Tone> = {
  'not-yet-assessed': 'destructive',
  pass: 'success',
  'remediation-required': 'neutral',
}

export function CertificationChip({ outcome }: { outcome: CertificationOutcome }) {
  return <Chip tone={certTone[outcome]} label={certificationLabels[outcome]} />
}

const inviteTone: Record<InviteStatus, Tone> = {
  pending: 'warning',
  active: 'success',
}

/**
 * Whether a coach trainee has accepted their platform invite
 * (`RosterPage`'s Status column, `CoachProfilePage`'s pending-invite banner).
 *
 * ⚠️ This is a **different axis** from `CoachStatusChip`'s study-lifecycle
 * status, and one trainee can be `active` on one while `pending` on the other.
 * Any KPI sitting above a column that renders this chip must count
 * `inviteStatus`, not `status`, or the tile will contradict the table beneath
 * it. That exact bug has shipped twice.
 *
 * `pending` is a terminal state in this package: nothing can flip it to
 * `active`, because there is no invitation email and no accept-invite
 * endpoint. See `addCoachTrainee` in the store.
 */
export function InviteStatusChip({ status }: { status: InviteStatus }) {
  return <Chip tone={inviteTone[status]} label={inviteStatusLabels[status]} />
}

