import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/research/ConfirmDialog'
import { FileDropzone, type UploadStage } from '@/components/shared/FileDropzone'

/**
 * The gate on Stage CP -> Stage H: a researcher cannot advance a trainee out of
 * Community feedback without attaching the feedback report written about them.
 *
 * ⚠️ **Nothing is saved, by direct instruction** — *"do not save anything, idea
 * is to mock experience, whatever I upload does not get saved anywhere."* The
 * picked `File` is held in this component's own state for the life of the
 * dialog and is never written to the store. What survives is the stage
 * completion itself (`togglePhase`, which already persists) plus the `File`
 * handed to `onConfirm`, which the caller keeps in memory for as long as the
 * page is open. Reload and it is gone — the stage stays complete and the
 * download is retired rather than replaced by a fabricated document.
 *
 * **Round 55:** the three-state upload box moved to
 * `components/shared/FileDropzone.tsx` when the coach's transcript step became
 * its second caller. Everything visual is unchanged — this file is now the
 * dialog chassis and the stage gate, and the box is shared.
 */

/* The copy asks for a PDF; the input accepts anything (direct instruction,
   both halves). The real report is a PDF, so that is what a researcher should
   be told to bring — but nothing here enforces it. The divergence is
   deliberate and disappears with the mock: a real implementation validates
   server-side. */
const ACCEPT_LABEL = 'PDF'

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
  const [stage, setStage] = useState<UploadStage>('empty')

  // Fresh every time it opens: a dialog that reopens holding the previous
  // trainee's attachment would be a real hazard, not a convenience.
  useEffect(() => {
    if (open) {
      setFile(null)
      setStage('empty')
    }
  }, [open])

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
      <div className="pt-2">
        <FileDropzone
          id="cp-feedback-report"
          acceptLabel={ACCEPT_LABEL}
          noun="report"
          file={file}
          onChange={setFile}
          onStageChange={setStage}
        />
      </div>
    </ConfirmDialog>
  )
}
