import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DeliveryShell } from '@/components/delivery/DeliveryShell'
import { WaveDivider } from '@/components/delivery/WaveDivider'
import { EmptyState } from '@/components/shared/EmptyState'
import { Toast } from '@/components/shared/Toast'
import { TablePager } from '@/components/shared/TablePager'
import { addCoachNote, deleteCoachNote, useCoachNotes, type CoachNote } from '@/data/coachNotes'
import { formatDate } from '@/data/format'
import { useCoachStage } from '@/data/coachStage'
import { NotebookText, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

/**
 * Coach Delivery Portal "My Notes" (Figma `638:12057`).
 *
 * A write box above a table of everything written before, split by the same
 * wave rule Home uses. No hero band — the title is page content with the
 * frame's own 64px top inset, exactly as Home and My Learning are.
 *
 * **Deep link.** The "How did {stage} go?" banner on Home links here as
 * `/delivery/notes?title=...`, which pre-fills the title and drops the cursor
 * straight into the note box (direct instruction) — the coach arrives ready to
 * type rather than having to restate what they are writing about. The param is
 * consumed once and stripped from the URL, so a refresh or a back-navigation
 * does not silently re-fill a box the coach has since cleared.
 */
/** Five per page (direct instruction). */
const NOTES_PER_PAGE = 5

export function DeliveryNotesPage() {
  const notes = useCoachNotes()
  const stage = useCoachStage()
  const [searchParams, setSearchParams] = useSearchParams()
  const prefill = searchParams.get('title')

  const [title, setTitle] = useState(prefill ?? '')
  const [body, setBody] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // `now` is captured once per mount rather than read at submit time so the
  // stamp shown in the card header is the same instant that gets saved — a
  // coach who reads "10:51 am" and then writes for two minutes should not find
  // 10:53 in the table.
  const [now] = useState(() => new Date())

  useEffect(() => {
    if (!prefill) return
    // Focus the body, not the title: the title is already written for them, so
    // the only thing left to do is type the note.
    bodyRef.current?.focus()
    // Strip the param without adding a history entry, so Back still returns to
    // Home rather than to this page in its pre-filled state.
    setSearchParams({}, { replace: true })
  }, [prefill, setSearchParams])

  const canSave = title.trim().length > 0 && body.trim().length > 0
  const [confirmation, setConfirmation] = useState<string | null>(null)

  function handleAdd() {
    if (!canSave) return
    addCoachNote({ title, body, when: new Date() })
    setTitle('')
    setBody('')
    // Both halves of the confirmation matter and they do different jobs. The
    // toast is the visible one; moving focus to the list heading is what tells a
    // screen-reader or keyboard user *where their note went*, since the button
    // they just pressed has gone disabled underneath them and is a dead end.
    // `role="status"` on the toast is announced politely, so the two do not
    // fight each other.
    setConfirmation('Note added.')
    headingRef.current?.focus()
  }

  function handleDelete(note: CoachNote) {
    deleteCoachNote(note.id)
    setConfirmation('Note deleted.')
    // The row — and the Delete button that opened the dialog — has just
    // unmounted, so `ConfirmDialog`'s focus-restore has nothing to return to.
    // Send focus to the list heading instead of letting it fall to `<body>`.
    headingRef.current?.focus()
  }

  return (
    <DeliveryShell
      accountLabel="Helen Zhang"
      // Same flush column and 64px top inset as Home and My Learning. Without
      // it this page took the shell's hero-less default (48px in, 80px down)
      // and its title sat inset while theirs ran flush — one shell, two
      // left edges.
      contentClassName="px-0 pt-16 md:px-0 md:pt-16"
    >
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-2" data-node-id="638:12103">
          <h1 className="font-display text-display-lg text-primary">My notes</h1>
          <p className="text-sub-greeting leading-[1.4] text-ink">
            Write a new note anytime, or revisit the ones you've already added
          </p>
          {/* Round 40, direct instruction — and **only once they are a coach**.
              A trainee has no clients and no Case notes tab, so the sentence
              would name two things that do not exist for them yet. Once they
              do, the distinction is worth stating plainly: these notes are the
              coach's own and belong to nobody's record, which is the opposite
              of a case note and is not otherwise visible from this page. */}
          {stage === 'coach' && (
            <p className="text-caption text-ink-muted">
              These notes are just for you. Notes about a client belong on that
              client&rsquo;s record, under Case notes.
            </p>
          )}
        </div>

        {/* `641:12593`. The frame reads `p-[33px]`; 32px is used instead — 33 is
            not a value this design system has anywhere, and the app's own card
            padding step is 32. */}
        <section
          className="flex flex-col items-end gap-6 overflow-hidden rounded-lg border border-parchment bg-white p-8 shadow-card"
          data-node-id="641:12593"
        >
          <div className="flex w-full items-start justify-between gap-6">
            {/* The frame writes "Whats on your mind?" — apostrophe restored. */}
            <h2 className="min-w-0 flex-1 font-display text-title text-ink">
              What's on your mind?
            </h2>
            {/* Live, not the frame's literal "28 Aug, 2026 - 10:51 am": this is
                the stamp the note is about to be saved with, so a hardcoded one
                would be wrong the moment anybody looked at it. */}
            <div className="flex shrink-0 items-center gap-4 text-body-md text-ink">
              <span>
                {now.toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span aria-hidden="true" className="size-1 rounded-full bg-ink" />
              <span>
                {now
                  .toLocaleTimeString('en-AU', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                  .toLowerCase()}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col items-end justify-end gap-6">
            <div className="flex w-full flex-col gap-2">
              <label htmlFor="note-title" className="text-caption-medium text-ink-muted">
                Give a title to your note
              </label>
              <input
                id="note-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add title here"
                className="h-11 w-full rounded-sm border border-hairline bg-white px-4 text-body text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <label htmlFor="note-body" className="text-caption-medium text-ink-muted">
                Notes
              </label>
              <textarea
                id="note-body"
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write here"
                className="h-40 w-full resize-y rounded-sm border border-hairline bg-parchment p-4 text-body text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* The app's canonical primary-filled pill at the trainee platform's
                44px, not the frame's `py-[9px]` (35px), which is under this
                project's own 36px control floor. Width is the frame's 248px. */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canSave}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-[248px]"
            >
              Add note
            </button>
          </div>
        </section>

        <WaveDivider label="Your previous notes" />

        <NotesTable notes={notes} headingRef={headingRef} onDelete={handleDelete} />
      </div>

      <Toast message={confirmation} onDismiss={() => setConfirmation(null)} />
    </DeliveryShell>
  )
}

/** `641:12650` — a `yellow-50` shell around a `purple-50` header row and white
 *  rows. The tint on the container only shows through the last row's rounded
 *  bottom corners, which is what stops the table ending on a hard white edge. */
function NotesTable({
  notes,
  headingRef,
  onDelete,
}: {
  notes: CoachNote[]
  headingRef: React.Ref<HTMLHeadingElement>
  onDelete: (note: CoachNote) => void
}) {
  const [viewing, setViewing] = useState<CoachNote | null>(null)
  const [deleting, setDeleting] = useState<CoachNote | null>(null)
  // Held separately from `deleting` so the dialog keeps its copy — which names
  // the note — through `AnimatePresence`'s exit, instead of blanking mid-fade.
  const [deletingShown, setDeletingShown] = useState<CoachNote | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (deleting) setDeletingShown(deleting)
  }, [deleting])

  const lastPage = Math.max(0, Math.ceil(notes.length / NOTES_PER_PAGE) - 1)
  // Deleting the last note on the final page, or adding one while parked deep in
  // the list, would otherwise leave the pager pointing past the end and the
  // table empty with no way back. Clamp instead of trusting the stored page.
  useEffect(() => {
    if (page > lastPage) setPage(lastPage)
  }, [page, lastPage])

  const visible = notes.slice(page * NOTES_PER_PAGE, (page + 1) * NOTES_PER_PAGE)

  return (
    <section className="flex flex-col gap-4">
      <h2 ref={headingRef} tabIndex={-1} className="sr-only outline-none">
        Your previous notes
      </h2>

      {notes.length === 0 ? (
        <EmptyState icon={NotebookText} copy="No notes yet." />
      ) : (
        <div
          className="overflow-hidden rounded-lg bg-yellow-50"
          data-node-id="641:12650"
        >
          {/* `table-fixed` is load-bearing, not tidiness. With auto layout the
              excerpt's full text sizes the Title column, which pushed the table
              to 1428px inside an 864px container and wrapped every date onto
              three lines — `layout-audit.js` caught both. Fixed layout honours
              the frame's own 140/100/160 columns, gives Title the remainder, and
              is what gives `truncate` a width to truncate against. */}
          <table className="w-full table-fixed text-caption">
            <thead>
              <tr className="bg-purple-50 text-ink-muted">
                <th scope="col" className="px-8 py-3.5 text-left font-medium">
                  Title
                </th>
                <th scope="col" className="w-[140px] px-0 py-3.5 text-left font-medium">
                  Date
                </th>
                <th scope="col" className="w-[100px] px-0 py-3.5 text-left font-medium">
                  Time
                </th>
                {/* The frame sizes this column for two actions. Delete is a
                    third, and at 160px the row wrapped — measured, then widened
                    to fit View + Download + Delete plus their two 16px gaps.
                    `pr-8` matches the 32px the frame puts on the *row*, not just
                    its first cell: without it the last control sits flush on the
                    table's right edge. */}
                <th scope="col" className="w-[210px] py-3.5 pr-8 text-left font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  onView={() => setViewing(note)}
                  onDelete={() => setDeleting(note)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Only once there is a second page. A pager over a single page of notes
          is chrome that can never do anything. */}
      {notes.length > NOTES_PER_PAGE && (
        <TablePager
          page={page}
          pageSize={NOTES_PER_PAGE}
          total={notes.length}
          onPageChange={setPage}
          itemLabel="notes"
        />
      )}

      <NoteViewerDialog note={viewing} onClose={() => setViewing(null)} />

      {/* Deleting is irreversible here — there is no undo and no bin — so it is
          gated. `destructive` gives the confirm button the red treatment, and
          the copy names the note and states the consequence rather than asking
          "Are you sure?", per this project's own dialog-copy rule. */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete this note?"
        body={
          deletingShown
            ? `"${deletingShown.title}" will be removed. You can't undo this.`
            : ''
        }
        confirmLabel="Delete note"
        cancelLabel="Keep note"
        destructive
        onConfirm={() => {
          if (deletingShown) onDelete(deletingShown)
          setDeleting(null)
        }}
        onClose={() => setDeleting(null)}
      />
    </section>
  )
}

/**
 * Read-only note viewer (direct instruction): title on top, the stamp under it,
 * the note itself below. **No editing** — a saved note is a record of what the
 * coach thought at the time, and this build has no update path anyway, so an
 * editable-looking box would promise something that does not exist.
 *
 * Built on `ConfirmDialog` rather than a new chassis. That component already
 * carries this project's hard-won modal behaviour — the Round 11 two-step
 * focus-restore race, the Round 14 `AnimatePresence` exit fix, the Tab trap and
 * Escape — and a hand-rolled dialog would have to reproduce all of it. Its
 * `singleAction` mode gives exactly the one Close this needs.
 */
function NoteViewerDialog({ note, onClose }: { note: CoachNote | null; onClose: () => void }) {
  // `note` is held rather than read straight through so the panel keeps its
  // content while `AnimatePresence` plays the exit — clearing it on close would
  // blank the dialog for the duration of the fade.
  const [shown, setShown] = useState<CoachNote | null>(note)
  useEffect(() => {
    if (note) setShown(note)
  }, [note])

  return (
    <ConfirmDialog
      open={!!note}
      title={shown?.title ?? ''}
      body={shown ? `${formatDate(shown.date)}  ·  ${shown.time}` : ''}
      confirmLabel="Close"
      cancelLabel="Close"
      singleAction
      // Wider and taller than the confirm-dialog default (direct instruction).
      // 440px turned a paragraph into a ribbon; this is a document to read, not
      // a question to answer.
      panelClassName="max-h-[85vh] w-full max-w-[720px]"
      onConfirm={onClose}
      onClose={onClose}
    >
      {/* The notepad: the same `parchment` surface and hairline the write box
          uses, so a saved note reads as the same object it was typed into —
          just without a cursor. `whitespace-pre-wrap` keeps the coach's own
          line breaks. */}
      <div className="min-h-[280px] rounded-sm border border-hairline bg-parchment p-4">
        <p className="whitespace-pre-wrap text-body leading-[1.4] text-ink">{shown?.body}</p>
      </div>
    </ConfirmDialog>
  )
}

function NoteRow({
  note,
  onView,
  onDelete,
}: {
  note: CoachNote
  onView: () => void
  onDelete: () => void
}) {
  function download() {
    const text = `${note.title}\n${formatDate(note.date)} ${note.time}\n\n${note.body}\n`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <tr className="border-b border-hairline bg-white align-top">
      <td className="px-8 py-6">
        <div className="flex flex-col gap-1">
          <span className="text-caption-medium text-ink">{note.title}</span>
          {/* A one-line excerpt of the note itself (direct instruction), so the
              table says what was written and not just what it was called — two
              notes titled after the same stage are otherwise indistinguishable.
              `truncate` rather than a fixed character count: the ellipsis then
              lands wherever the column actually runs out, at any width. */}
          <span className="truncate text-caption text-ink-faint">{note.body}</span>
        </div>
      </td>
      <td className="py-6 text-ink">{formatDate(note.date)}</td>
      <td className="py-6 text-ink">{note.time}</td>
      <td className="py-6 pr-8">
        <div className="flex items-center gap-4">
          {/* The frame draws View and Download as plain underlined links and
              specifies no destination for either. Download is real — it writes
              the note out as a .txt. View opens the read-only viewer. */}
          <button
            type="button"
            onClick={onView}
            className="rounded-xs text-caption-medium text-primary underline underline-offset-2 outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            View
          </button>
          <button
            type="button"
            onClick={download}
            className="rounded-xs text-caption-medium text-primary underline underline-offset-2 outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            Download
          </button>
          {/* An icon, not a word (direct instruction), and `destructive` rather
              than `primary`: this is the one action in the row that cannot be
              taken back and it should not read like its two harmless neighbours.
              Icon-only needs its name supplied some other way, so it carries a
              real `aria-label` naming the note — and a `title`, which is what
              gives sighted users the same label on hover. The 36px box is this
              project's control floor; the glyph inside stays 16px. */}
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete note: ${note.title}`}
            title="Delete note"
            className="-my-2 inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
