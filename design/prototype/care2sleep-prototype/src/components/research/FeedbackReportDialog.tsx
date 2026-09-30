import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Trash2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'

/**
 * The gate on Stage CP -> Stage H: a researcher cannot advance a trainee out of
 * Peer community feedback without attaching the feedback report written about
 * them.
 *
 * ⚠️ **Nothing is saved, by direct instruction** — *"do not save anything, idea
 * is to mock experience, whatever I upload does not get saved anywhere."* The
 * picked `File` is held in this component's own state for the life of the
 * dialog and is never written to the store, never uploaded, never read back.
 * The progress bar is a timer, not a transfer. What survives the dialog is the
 * stage completion itself (`togglePhase`, which already persists) plus the
 * `File` handed to `onConfirm`, which the caller keeps in memory for as long as
 * the page is open. Reload and it is gone — the stage stays complete and the
 * download is retired rather than replaced by a fabricated document.
 *
 * What would replace this: a real upload to file storage returning an id, and
 * a `feedbackReport` field on the coach record holding {id, filename, size,
 * uploadedDate, uploadedBy}. At that point `SIMULATED_UPLOAD_MS` and the whole
 * `progress` state go away — the bar would track a real `XMLHttpRequest`
 * progress event instead.
 */

/** Long enough to read as a transfer, short enough not to be a wait. */
const SIMULATED_UPLOAD_MS = 1600
const TICK_MS = 80

/* The copy asks for a PDF; the input accepts anything (direct instruction,
   both halves). The real report is a PDF, so that is what a researcher should
   be told to bring — but nothing here enforces it, because a prototype that
   rejects a tester's file is testing the wrong thing. The divergence is
   deliberate and disappears with the mock: a real implementation validates
   server-side, which is where the safeguard always belonged. */
const ACCEPT_LABEL = 'PDF'

type Stage = 'empty' | 'uploading' | 'ready'

/** The one box all three states fill, so the panel never shifts under the
 *  researcher. The dropzone adds its own dashed border and pointer on top. */
const SURFACE =
  'flex h-full w-full flex-col items-center justify-center gap-3 rounded-sm bg-purple-50 px-8 text-center'

export function FeedbackReportDialog({
  open,
  traineeFirstName,
  onConfirm,
  onClose,
}: {
  open: boolean
  /** Used by the title only — the sub copy carries no name. */
  traineeFirstName: string
  /** Receives the picked `File` itself, so the completed row can hand the
   *  researcher back exactly what they attached rather than fabricating a
   *  stand-in document. Held in memory only — see the note at the top. */
  onConfirm: (file: File) => void
  onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('empty')
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | null>(null)

  /* A drag that enters a child fires `dragleave` on the parent, so a single
     boolean flips off the moment the pointer crosses the icon inside the zone.
     Counting enter/leave pairs is what keeps the hover state stable. */
  const dragDepth = useRef(0)

  const reset = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
    dragDepth.current = 0
    setFile(null)
    setStage('empty')
    setProgress(0)
    setDragging(false)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  // Fresh every time it opens: a dialog that reopens holding the previous
  // trainee's attachment would be a real hazard, not a convenience.
  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  useEffect(() => () => {
    if (timer.current !== null) window.clearInterval(timer.current)
  }, [])

  const accept = useCallback((picked: File | undefined) => {
    if (!picked) return
    setFile(picked)
    setStage('uploading')
    setProgress(0)

    const steps = Math.ceil(SIMULATED_UPLOAD_MS / TICK_MS)
    let n = 0
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      n += 1
      const pct = Math.min(100, Math.round((n / steps) * 100))
      setProgress(pct)
      if (pct >= 100) {
        if (timer.current !== null) window.clearInterval(timer.current)
        timer.current = null
        setStage('ready')
      }
    }, TICK_MS)
  }, [])

  const remove = () => {
    reset()
    // Focus cannot be left on the button that just unmounted. This project's
    // most-repeated defect.
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <ConfirmDialog
      open={open}
      title={`Upload the feedback report for ${traineeFirstName}`}
      /* One line, no name (direct instruction). The previous three-line version
         restated the stage, described the report, and named the trainee twice
         over — all of which the title, the row behind the dialog and the
         dropzone already say. What was left worth keeping is the one thing the
         researcher does not already know: attaching it is what closes the
         stage. */
      body="Attach the community of practice feedback report to complete this stage."
      confirmLabel="Mark complete"
      cancelLabel="Cancel"
      /* Direct instruction: the report is required, so the stage cannot be
         completed without one. The control stays focusable and explains
         itself rather than disappearing. */
      confirmDisabled={stage !== 'ready' || !file}
      /* Wider than the app's 440px confirm default (direct instruction): this
         dialog holds a drop target, a progress state and a file row, none of
         which read well in a narrow column. 640px keeps the instruction copy
         to two comfortable lines rather than four. */
      panelClassName="max-h-[85vh] w-full max-w-[640px]"
      onConfirm={() => {
        if (file) onConfirm(file)
      }}
      onClose={onClose}
    >
      {/* Direct instruction: the panel keeps ONE size across all three states.
          The dropzone, the progress state and the uploaded file row are very
          different heights, so without a fixed box the dialog grew and shrank
          under the researcher mid-flow — and the footer buttons moved with it.
          A fixed height reserved once, with each state centred inside it. */}
      <div className="flex h-[200px] flex-col justify-center gap-4 pt-2">
        {stage === 'empty' && (
          <>
            {/* A real <label> wrapping a visually-hidden <input type="file">:
                the same accessible pattern `ConsentRepository` established, so
                the whole zone is one keyboard-reachable control that opens the
                file picker on Enter or Space. A <div onClick> would not. */}
            <label
              htmlFor="cp-feedback-report"
              onDragEnter={(e) => {
                e.preventDefault()
                dragDepth.current += 1
                setDragging(true)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                e.preventDefault()
                dragDepth.current -= 1
                if (dragDepth.current <= 0) setDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                dragDepth.current = 0
                setDragging(false)
                accept(e.dataTransfer.files?.[0])
              }}
              className={cn(
                SURFACE,
                'cursor-pointer border border-dashed transition-colors',
                /* The drag-over reaction. `primary/5` would composite to a
                   ~9-per-channel shift on this surface — present in the DOM and
                   invisible on screen, which this project's own rules call out
                   by name. `purple-50` is a real fill and the border goes solid
                   primary with it, so two things change at once. */
                dragging
                  ? 'border-solid border-primary !bg-purple-200'
                  /* `ink-faint`, not the app's usual `hairline`: this border
                     is the affordance, not a boundary between two surfaces.
                     `hairline` measured 1.21:1 against the zone fill, and a
                     drop target nobody can see is not a drop target. 5.17:1. */
                  /* No fill of its own: SURFACE's `purple-50` carries all
                     three states, so the dropzone and the panel that replaces
                     it are the same colour as well as the same size. A
                     `bg-parchment` here would win over SURFACE through
                     tailwind-merge and leave the empty state grey while the
                     other two went purple. */
                  : 'border-ink-faint hover:border-primary',
              )}
            >
              <UploadCloud
                aria-hidden="true"
                className={cn('size-8', dragging ? 'text-primary' : 'text-ink-faint')}
              />
              <span className="text-caption-medium text-ink">
                {dragging ? 'Drop the report here' : 'Drag the report here, or browse'}
              </span>
              <span className="text-fine text-ink-muted">Upload {ACCEPT_LABEL}</span>
              <input
                ref={inputRef}
                id="cp-feedback-report"
                type="file"
                className="sr-only"
                onChange={(e) => accept(e.target.files?.[0] ?? undefined)}
              />
            </label>
          </>
        )}

        {/* Uploading and uploaded share the dropzone's own box (direct
            instruction): one light-grey panel at the same size, content
            centred, so the three states occupy an identical footprint and
            nothing under them moves. `SURFACE` is that shared shell. */}
        {stage !== 'empty' && file && (
          <div className={SURFACE}>
            {stage === 'uploading' ? (
              <div className="flex w-full max-w-[380px] flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="min-w-0 truncate text-caption-medium text-ink">
                    {file.name}
                  </span>
                  {/* Live so the percentage is announced as it climbs, rather
                      than the bar changing silently for a screen-reader user. */}
                  <span
                    aria-live="polite"
                    className="shrink-0 text-caption tabular-nums text-ink-muted"
                  >
                    {progress}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Uploading ${file.name}`}
                  className="h-2 w-full overflow-hidden rounded-full bg-hairline"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex max-w-full items-center gap-3">
                {/* Filled `primary`, not the completed row's purple-50 tint
                    (direct instruction: "barely visible, use blue instead").
                    The panel behind it is now purple-50 itself, so a tinted
                    pill on a tinted panel had almost nothing to separate it —
                    the completed row keeps the tint because it sits on white.
                    Type up from 12px to 14px, and the shadow off the app's
                    warm gold onto its neutral one, since gold on purple reads
                    as a smudge rather than a lift. */}
                <span className="inline-flex h-9 min-w-0 max-w-[320px] items-center gap-2 rounded-full bg-primary px-4 text-caption-medium text-white shadow-notice-card">
                  <FileText aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </span>
                {/* The bin gets its own white disc so it reads as a control on
                    the tinted panel rather than a loose glyph, and carries the
                    `destructive` semantic because removing is what it does. */}
                <button
                  type="button"
                  onClick={remove}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-destructive shadow-notice-card outline-none transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  <span className="sr-only">Remove {file.name}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ConfirmDialog>
  )
}
