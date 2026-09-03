import { cn } from '@/lib/utils'
import {
  certificationLabels,
  inviteStatusLabels,
  statusLabels,
  type CertificationOutcome,
  type CoachStatus,
  type InviteStatus,
} from '@/data/research'
import {
  invitationStatusLabels,
  joinedStatusLabels,
  type InvitationStatus,
  type JoinedStatus,
} from '@/data/spaces'

/**
 * Status chips per design-tokens.md §1 semantic rule: neutral tones + the
 * one success green — no rival accents, never colour-only (the chip text
 * carries the state).
 *
 * Round 20 consistency fix: every tone now renders the SAME visual
 * treatment — filled tinted background + matching-tint border + coloured
 * text — differing only in which colour. Previously `success`/`neutral`/
 * `muted` fell through to the base span's plain `border-hairline bg-pearl`
 * (grey chrome) with only their text tinted, while `warning`/`next`/
 * `destructive` each had their own filled-bg+border treatment — the same
 * status concept (a chip) rendering two different ways depending on tone,
 * which read as a bug (flagged directly: "Pending" filled amber vs. "Active"
 * plain grey-with-green-text). Fixed at this single shared component so
 * every call site (`CoachStatusChip`/`InviteStatusChip`/`CertificationChip`/
 * `InvitationStatusChip`/`JoinedStatusChip`/`CompletionChip` and every direct
 * `<Chip tone=… />` use) inherits the fix automatically — no per-site patches.
 * Contrast computed for real (WCAG formula, text colour over its own
 * flattened tint-on-white background, not eyeballed), all clear AA (4.5:1
 * normal text) with margin: success 4.66:1, neutral 10.96:1, muted 4.59:1,
 * warning 6.84:1, next 6.41:1 (moved off raw `primary` #0066cc, which
 * measured only 3.68:1 against its own pale tint and failed AA, onto the
 * existing `primary-hover` #0055ab token — same hue family, already used
 * app-wide), destructive 4.66:1. Fill opacity is 8% (not the 10-20% used by
 * the pre-existing `warning`/`next`/`destructive` tones) specifically
 * because `success`/`neutral`/`muted`'s own text colours are close enough in
 * lightness to their tint that 10%+ opacity pulled contrast under 4.5:1 —
 * lower opacity lightens the bg, which *raises* contrast against a dark
 * foreground. */
type Tone = 'success' | 'neutral' | 'muted' | 'warning' | 'next' | 'destructive' | 'yellow'

/**
 * Round 23, frame `152:176` — the chip's *geometry* and its `muted` tone are
 * now transcribed from that frame's `status-badge` (nodes `152:703`/`152:706`),
 * which is the only chip the frame draws: 27px tall, 16px side padding, 12px
 * Semi Bold text, `neutral/off-white` fill, `neutral/lighter-grey` border,
 * `neutral/light-grey` text. Every other tone keeps its own hue and only
 * follows the new geometry, so the six tones stay a set.
 *
 * `muted` moving off the Round 20 `ink-faint/8` tint onto flat `parchment` +
 * `hairline` is the one tone change, and it is a small contrast *gain*, not a
 * loss: `ink-faint` on `parchment` is **4.75:1** (index.css records this
 * measured figure for the same pair) against 4.59:1 on the old tint.
 */
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
    /* Round 40, direct instruction ("use yellow hues") — the brand yellow ramp
       rather than the borrowed `amber-*` scale `warning` still sits on. It is
       added here rather than hand-rolled at its call site so it inherits the
       one geometry all seven tones share.
       Text is `ink`, not a dark yellow: the ramp tops out at `yellow-400`
       (#ffb600), which is a mid-tone against `yellow-50` and nowhere near AA.
       `ink` on `yellow-50` measures 16.0:1. */
    case 'yellow':
      return 'border-yellow-300 bg-yellow-50 text-ink'
  }
}

export function Chip({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={cn(
        // `h-[27px]`, not `py-1.5` + auto height: Figma draws the 1px border
        // *inside* its 27px frame, and CSS `box-sizing: border-box` only
        // matches that if the height is stated. Padding alone gives 29px.
        // Weight comes from `text-fine` itself, which is now 600 app-wide
        // (Figma's own `fine` style is Semi Bold) rather than a `font-semibold`
        // per tone.
        'inline-flex h-[27px] shrink-0 items-center rounded-full border px-4 text-fine whitespace-nowrap',
        toneClass(tone),
      )}
    >
      {label}
    </span>
  )
}

const coachTone: Record<CoachStatus, Tone> = {
  enrolled: 'neutral',
  active: 'success',
  completed: 'success',
  withdrawn: 'muted',
}

export function CoachStatusChip({ status }: { status: CoachStatus }) {
  return <Chip tone={coachTone[status]} label={statusLabels[status]} />
}

/* Round 23, direct instruction: `not-yet-assessed` is **red**, not the quiet
   grey `muted` it carried before. It reads correctly on both surfaces it
   appears on — a trainee who has ticked every stage but has no Placement 2
   outcome recorded is genuinely blocked and waiting on the research team, which
   is the one thing on that card worth chasing. `destructive` is already this
   app's tone for that ("Not assigned" on Consumer Management uses it for the
   same "nothing has happened and it should have" meaning), and its chip pair is
   contrast-measured at 4.66:1. */
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

/** Whether a coach trainee has accepted their platform invite yet
 *  (`RosterPage`'s Status column, `CoachProfilePage`'s pending-invite
 *  banner) — a different axis from `CoachStatusChip`'s study-lifecycle
 *  status. */
export function InviteStatusChip({ status }: { status: InviteStatus }) {
  return <Chip tone={inviteTone[status]} label={inviteStatusLabels[status]} />
}

const invitationTone: Record<InvitationStatus, Tone> = {
  invited: 'neutral',
  accepted: 'success',
  declined: 'muted',
}

export function InvitationStatusChip({ status }: { status: InvitationStatus }) {
  return <Chip tone={invitationTone[status]} label={invitationStatusLabels[status]} />
}

const joinedTone: Record<JoinedStatus, Tone> = {
  'not-joined': 'muted',
  joined: 'success',
}

export function JoinedStatusChip({ status }: { status: JoinedStatus }) {
  return <Chip tone={joinedTone[status]} label={joinedStatusLabels[status]} />
}

/** Module completion chip for the training-progress rail and oversight table. */
export function CompletionChip({
  state,
  detail,
}: {
  state: 'completed' | 'in-progress' | 'not-started'
  detail?: string
}) {
  const tone: Tone =
    state === 'completed' ? 'success' : state === 'in-progress' ? 'neutral' : 'muted'
  const label =
    state === 'completed'
      ? (detail ?? 'Completed')
      : state === 'in-progress'
        ? 'In progress'
        : 'Not started'
  return <Chip tone={tone} label={label} />
}
