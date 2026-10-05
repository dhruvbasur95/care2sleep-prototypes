import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Trash2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The app's file-attachment control: one fixed box carrying three states —
 * empty dropzone, uploading, uploaded.
 *
 * Built in Round 52 inside `components/research/FeedbackReportDialog.tsx` (the
 * Stage CP gate) and **extracted here at its second caller** in Round 55, when
 * the coach's post-session reflection gained a mandatory transcript upload
 * (direct instruction: *"re-use the upload components we are using for
 * researcher when uploading feedback form for stage CP. Show upload box, with
 * correct hover states, state correct file version they need to upload in drop
 * box but for prototyping accept any file"*).
 *
 * ⚠️ **Nothing is saved, by direct instruction** — *"do not save anything, idea
 * is to mock experience, whatever I upload does not get saved anywhere."* The
 * picked `File` is handed to `onChange` and held in the caller's own state for
 * the life of its dialog. The progress bar is a timer, not a transfer. Reload
 * and it is gone.
 *
 * What would replace this: a real upload to file storage returning an id.
 * `SIMULATED_UPLOAD_MS` and the whole `progress` state go away at that point —
 * the bar would track a real `XMLHttpRequest` progress event instead.
 *
 * ## Why one fixed box
 * Direct instruction: the panel keeps ONE size across all three states. The
 * dropzone, the progress state and the file row are very different heights, so
 * without a fixed box the dialog grew and shrank under the user mid-flow, and
 * the footer buttons moved with it.
 */

/** Long enough to read as a transfer, short enough not to be a wait. */
const SIMULATED_UPLOAD_MS = 1600
const TICK_MS = 80

/** The one box all three states fill, so nothing shifts under the user. The
 *  dropzone adds its own dashed border and pointer on top. */
const SURFACE =
  'flex h-full w-full flex-col items-center justify-center gap-3 rounded-sm bg-purple-50 px-8 text-center'

export type UploadStage = 'empty' | 'uploading' | 'ready'

export function FileDropzone({
  /** Unique per mounted instance — it pairs the `<label>` with its input, and
   *  two of these can be in the tree at once. */
  id,
  /** What the user is told to bring, e.g. `'PDF'` or `'VTT or TXT'`. The input
   *  itself accepts anything: a prototype that rejects a tester's file is
   *  testing the wrong thing, and a real implementation validates server-side,
   *  which is where the safeguard always belonged. */
  acceptLabel,
  /** What the empty state calls the thing, e.g. `'report'` or `'transcript'`. */
  noun,
  file,
  onChange,
  /** Mirrors the internal state out, so a caller can gate its own Next button
   *  on `'ready'` rather than re-deriving it from `file` (which is set the
   *  instant the file is picked, i.e. while it is still "uploading"). */
  onStageChange,
  /** Where focus goes when the user removes the attached file. Without it,
   *  focus lands on `<body>` — the control that was clicked has unmounted.
   *  Defaults to the file input, which is what replaces it. */
  onRemoved,
}: {
  id: string
  acceptLabel: string
  noun: string
  file: File | null
  onChange: (file: File | null) => void
  onStageChange?: (stage: UploadStage) => void
  onRemoved?: () => void
}) {
  const [stage, setStage] = useState<UploadStage>(file ? 'ready' : 'empty')
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | null>(null)

  /* A drag that enters a child fires `dragleave` on the parent, so a single
     boolean flips off the moment the pointer crosses the icon inside the zone.
     Counting enter/leave pairs is what keeps the hover state stable. */
  const dragDepth = useRef(0)

  /* Held in a ref so the effects below do not need it as a dependency — a
     caller that passes an inline arrow would otherwise re-run them every
     render and restart the timer mid-upload. */
  const stageChangeRef = useRef(onStageChange)
  stageChangeRef.current = onStageChange

  useEffect(() => {
    stageChangeRef.current?.(stage)
  }, [stage])

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearInterval(timer.current)
    },
    [],
  )

  const accept = useCallback(
    (picked: File | undefined) => {
      if (!picked) return
      onChange(picked)
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
    },
    [onChange],
  )

  const remove = () => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
    dragDepth.current = 0
    onChange(null)
    setStage('empty')
    setProgress(0)
    setDragging(false)
    if (inputRef.current) inputRef.current.value = ''
    /* Focus cannot be left on the button that just unmounted. This project's
       most-repeated defect. `requestAnimationFrame` so the empty state has
       mounted and its input exists to receive it. */
    window.requestAnimationFrame(() => {
      if (onRemoved) onRemoved()
      else inputRef.current?.focus()
    })
  }

  return (
    <div className="flex h-[200px] flex-col justify-center gap-4">
      {stage === 'empty' && (
        /* A real <label> wrapping a visually-hidden <input type="file">: the
           same accessible pattern `ConsentRepository` established, so the whole
           zone is one keyboard-reachable control that opens the file picker on
           Enter or Space. A <div onClick> would not. */
        <label
          htmlFor={id}
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
               invisible on screen, which this project's own rules call out by
               name. `purple-200` is a real fill and the border goes solid
               primary with it, so two things change at once. */
            dragging
              ? 'border-solid border-primary !bg-purple-200'
              : /* `ink-faint`, not the app's usual `hairline`: this border is
                   the affordance, not a boundary between two surfaces.
                   `hairline` measured 1.21:1 against the zone fill, and a drop
                   target nobody can see is not a drop target. 5.17:1.
                   No fill of its own — SURFACE's `purple-50` carries all three
                   states, so the dropzone and the panel that replaces it are
                   the same colour as well as the same size. */
                'border-ink-faint hover:border-primary',
          )}
        >
          <UploadCloud
            aria-hidden="true"
            className={cn('size-8', dragging ? 'text-primary' : 'text-ink-faint')}
          />
          <span className="text-caption-medium text-ink">
            {dragging ? `Drop the ${noun} here` : `Drag the ${noun} here, or browse`}
          </span>
          {/* "… file" (direct instruction, 2026-10-05). In the shared template
              rather than the caller's label, so the researcher's own dropzone
              reads "Upload PDF file" and the prop stays a bare format name. */}
          <span className="text-fine text-ink-muted">Upload {acceptLabel} file</span>
          <input
            ref={inputRef}
            id={id}
            type="file"
            className="sr-only"
            onChange={(e) => accept(e.target.files?.[0] ?? undefined)}
          />
        </label>
      )}

      {/* Uploading and uploaded share the dropzone's own box (direct
          instruction): one panel at the same size, content centred, so the
          three states occupy an identical footprint and nothing under them
          moves. */}
      {stage !== 'empty' && file && (
        <div className={SURFACE}>
          {stage === 'uploading' ? (
            <div className="flex w-full max-w-[380px] flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 truncate text-caption-medium text-ink">{file.name}</span>
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
              {/* Filled `primary`, not a tint (direct instruction: "barely
                  visible, use blue instead") — the panel behind it is
                  `purple-50`, so a tinted pill on a tinted panel had almost
                  nothing to separate it. The shadow is the app's neutral one,
                  not its warm gold, since gold on purple reads as a smudge. */}
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
  )
}
