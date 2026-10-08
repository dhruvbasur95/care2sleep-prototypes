import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import {
  ConsumerCanvasWave,
  ConsumerContentReveal,
  ConsumerPageHero,
  CONSUMER_CREST_TRACKING,
  CONSUMER_HERO_TO_CONTENT,
} from '@/components/consumer/ConsumerCanvasWave'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { ConsumerPersonCard } from '@/components/consumer/ConsumerPersonCard'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'
import { formatDate } from '@/data/format'


/**
 * Opt out of the study — frame `961:7913`'s third card.
 *
 * A flat message+CTA panel: `destructive/10` fill, a full-strength
 * `destructive` 1px stroke, 16px radius, copy left and the red pill right. It
 * carries **no `bg-card-header` band and no hairline divider**, which is §35a's
 * documented "pure message + CTA, no distinct content section" exception rather
 * than an oversight.
 *
 * The fill is `bg-destructive/10`, not a literal: `#d70015` at 10% over white
 * composites to `rgb(251,230,232)`, which is the frame's `#fbe6e8` exactly. The
 * token and the frame agree, so there is nothing to name.
 *
 * ⚠️ **No reason is asked for, and that is a deliberate reversal.** Direct
 * instruction: "if they want to optout, drop a message, someone from Researcher
 * team will be in touch with them. do not ask for a reason for optout." The
 * `OPT_OUT_REASONS` dropdown this card used to open with is gone. What replaces
 * it is an optional free-text message in the confirm step — the consumer's own
 * words to the research team, not a category chosen from a list about why they
 * are leaving.
 *
 * The message rides the store's existing `optedOut.reason` string rather than a
 * new field. That is a compromise worth flagging: the researcher's own surface
 * still labels it "Reason". Nothing is mislabelled for the consumer, and no
 * data-model change reaches three other portals, but the researcher-facing
 * label should follow if this sticks.
 *
 * ⚠️ **Opting out does nothing on the consumer's end** — direct correction:
 * "dont say you will no longer have any accress, optingout for consumer does
 * noting on their end". So neither the dialog nor the opted-out state claims
 * any loss of access. Opting out records the request and notifies the research
 * team; whatever happens to the person's participation happens off-platform,
 * in a conversation with them. Both copy strings previously promised that Zoom
 * links would be withdrawn, which was a consequence this platform does not
 * actually deliver.
 *
 * The title is `ink`, not `destructive`: red on this pink measures 4.51:1 and
 * clears AA by 0.01 on text that is not WCAG "large" — the same call Round 31
 * made on the trainee portal's own opt-out card.
 */
function OptOutCard({
  dyadId,
  dyad,
}: {
  dyadId: string
  dyad: ReturnType<typeof useResearch>['consumerDyads'][number]
}) {
  const { setDyadOptOut } = useResearch()
  /**
   * Two steps, direct instruction: "make it a 2 stepper, after providing
   * optout reason, ask for confirmation". `null` is closed.
   *
   * Rendered as two mutually-exclusive `ConfirmDialog`s rather than one dialog
   * whose props switch, so the incoming step actually **mounts** — that is what
   * makes `ConfirmDialog`'s own focus-on-open effect run and move focus into
   * the new step. Switching props in place leaves focus on the old step's
   * button and announces nothing, which is this project's most-repeated defect
   * class wearing a different hat.
   */
  const [step, setStep] = useState<'message' | 'confirm' | null>(null)
  const [message, setMessage] = useState('')

  /**
   * ⚠️ Confirming opt-out **unmounts its own trigger** — the card replaces
   * itself with the opted-out panel — so `ConfirmDialog`'s focus-restore has no
   * button left to return to and focus lands on `<body>`. Measured, not
   * assumed: `document.activeElement.tagName` came back `BODY` after a real
   * end-to-end run. This is the defect class this project has shipped in six
   * separate rounds, so the confirmed state takes focus deliberately.
   *
   * `justOptedOut` gates it rather than the effect firing on `dyad.optedOut`
   * alone: an already-opted-out consumer arriving on this page would otherwise
   * have focus yanked to the middle of the document on load.
   */
  const [justOptedOut, setJustOptedOut] = useState(false)
  const optedOutHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (justOptedOut) optedOutHeadingRef.current?.focus()
  }, [justOptedOut])

  const close = () => {
    setStep(null)
    setMessage('')
  }

  if (dyad.optedOut) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-6">
        <TriangleAlert aria-hidden="true" className="mt-1 size-5 shrink-0 text-destructive" />
        <div className="min-w-0">
          <h2
            ref={optedOutHeadingRef}
            tabIndex={-1}
            className="text-consumer-heading text-ink outline-none"
          >
            You have opted out
          </h2>
          <p className="mt-1 text-body text-ink">
            You opted out on {formatDate(dyad.optedOut.date)}. Someone from the research team
            will be in touch with you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive bg-destructive/10 p-6 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-consumer-heading text-ink">Opt out of the study program</h2>
        {/* The frame's own wording. Its hard `<br>` is dropped — it was placed
            for a 1024px artboard and forces a third line once the column
            narrows, which is the trap `text-pretty` exists for. "Need Help" is
            a real link here: the page it names already exists at
            `/consumer/:dyadId/help`, and the frame underlines it as one. */}
        <p className="text-pretty text-body text-ink">
          You always have the right to withdraw from the program and research project. If you
          have any questions or feedback, please do not hesitate to get in touch with us first
          (see{' '}
          <Link
            to={`/consumer/${dyadId}/help`}
            className="underline outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-consumer-primary"
          >
            Need help
          </Link>{' '}
          page).
        </p>
      </div>

      <button
        type="button"
        onClick={() => setStep('message')}
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-destructive bg-destructive px-[18px] text-body-md text-white outline-none transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
      >
        Opt out of the study
      </button>

      {/* Step 1 — the message. Nothing is committed here. */}
      <ConfirmDialog
        variant="consumer"
        open={step === 'message'}
        title="Opt out of Care2Sleep?"
        body="You can leave a message for the research team. This does not end your participation yet."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={() => setStep('confirm')}
        onClose={close}
      >
        {/* Optional on purpose. Making it required would be asking for a
            reason by another name, which is the thing that was explicitly
            removed. */}
        <div className="flex flex-col gap-2">
          <label htmlFor="opt-out-message" className="text-consumer-body-strong text-ink">
            Leave a message (optional)
          </label>
          <textarea
            id="opt-out-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Anything you would like the research team to know."
            className="w-full rounded-sm border border-pearl bg-pearl px-3 py-2.5 text-body text-ink outline-none transition-colors focus-visible:border-consumer-primary focus-visible:ring-2 focus-visible:ring-consumer-primary"
          />
        </div>
      </ConfirmDialog>

      {/* Step 2 — the confirmation, and the only place the store is written.
          "Go back" returns to step 1 with the message still typed, rather than
          closing the flow: a confirm step whose only escape is cancelling the
          whole thing is a trap. */}
      <ConfirmDialog
        variant="consumer"
        open={step === 'confirm'}
        title="Are you sure you want to opt out?"
        body="Someone from the research team will be in touch with you."
        confirmLabel="Yes, opt out"
        cancelLabel="Go back"
        destructive
        onConfirm={() => {
          setDyadOptOut(dyadId, message.trim() || 'No message left')
          setStep(null)
          setJustOptedOut(true)
        }}
        onClose={() => setStep('message')}
      >
        {message.trim() && (
          <div className="flex flex-col gap-2">
            <p className="text-consumer-body-strong text-ink">Your message</p>
            <p className="rounded-sm border border-pearl bg-pearl px-3 py-2.5 text-body whitespace-pre-wrap text-ink">
              {message.trim()}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
export function ConsumerAccountPage() {
  const { dyadId } = useParams()
  const { consumerDyads, updateDyadPerson } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)

  if (!dyad) return <Navigate to="/consumer" replace />

  return (
    <ConsumerShell
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      optedOut={dyad.optedOut}
      // No hero band. This was the only consumer page using the shell's `hero`
      // slot, which paints `bg-pearl` — the app's COOL grey — across the top of
      // a portal whose canvas is the warm `consumer-canvas`. Every other page
      // here (Home, My Modules, the diary) puts its title straight on the
      // canvas, so a grey band on this one read as a page from a different
      // product. The temperature mismatch is a standing rule in CLAUDE.md; the
      // consistency is the point.
      //
      // `relative overflow-clip` and the padding are My Modules' own, because
      // this page now carries the same wave: the wave is wider than this column
      // by design and the clip is what makes that safe.
      contentClassName="bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-24 md:px-20"
    >
      <ConsumerCanvasWave />

      {/* The wave + avatar + title block is Home's own `ConsumerPageHero`,
          crest tracking and hero-to-content gap included — direct instruction
          to replicate Home's background and avatar here. Reusing the component
          rather than restating its markup is what keeps the three consumer
          heroes from drifting, which is why it was extracted in Round 43. */}
      <div
        className={cn(
          'relative flex flex-col items-center pt-4 pb-16',
          CONSUMER_HERO_TO_CONTENT,
          CONSUMER_CREST_TRACKING,
        )}
      >
        {/* Title only, no `sub` — direct instruction. Sentence case, per this
            project's own copy rule and matching the coach portal's My profile. */}
        <ConsumerPageHero title="My profile" />

        {/*
          One vertical stack — direct instruction: "stack the sections
          vertically -> PLE -> carer -> Optout card". The PLE and Carer cards
          were a `lg:grid-cols-2` pair and are now full width in source order.

          The 56px row gap (`gap-14`) is **Home's and My Modules' own section
          gap**, not a number picked for this page — direct instruction to keep
          the vertical spacing between sections consistent with the other
          pages. Both of those wrap their sections in this same
          `ConsumerContentReveal` at `gap-14`, and the three cards here are this
          page's sections, each with its own heading. The hero-to-content gap
          above already comes from the shared `CONSUMER_HERO_TO_CONTENT`, so
          both of this page's vertical rhythms are now the portal's rather than
          local. (The in-progress page's `gap-6` is not a counter-example: it is
          a single centred message, not a stack of sections.)

          ⚠️ A one-column **grid**, not a flex column. `ConsumerPersonCard`'s
          own `Card` carries `self-start`: in a grid that resolves on the block
          axis and is harmless, but in a flex column it resolves on the *inline*
          axis and shrinks each card to its content width, leaving a ragged
          right-hand edge.

          The Contact details card is gone (direct instruction). Frame
          `961:7913` folds Email and Phone into the two person cards, so the
          page is exactly the three cards it draws — its fields were not lost,
          they moved to the person they belong to.
        */}
        <ConsumerContentReveal className="grid w-full max-w-[1121px] grid-cols-1 gap-14">
          {dyad.patient && (
            <ConsumerPersonCard
              title="Person with lived experience details"
              person={dyad.patient}
              onSave={(patch) => updateDyadPerson(dyad.id, 'patient', patch)}
            />
          )}
          <ConsumerPersonCard
            title="Carer details"
            person={dyad.carer}
            onSave={(patch) => updateDyadPerson(dyad.id, 'carer', patch)}
          />

          <OptOutCard dyadId={dyad.id} dyad={dyad} />
        </ConsumerContentReveal>
      </div>
    </ConsumerShell>
  )
}
