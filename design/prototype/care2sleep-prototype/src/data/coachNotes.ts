import { useSyncExternalStore } from 'react'

/**
 * The trainee's own notebook, behind "My Notes" (`/delivery/notes`, Figma
 * `638:12057`).
 *
 * Module-scoped rather than component state, for the reason CLAUDE.md spells
 * out: every `/delivery` page mounts its own shell *and* its own page, so a note
 * written here and held in a component would vanish the moment the coach
 * navigated to Home and back. Not persisted, so a refresh returns to the seeds —
 * the same never-persisted treatment the onboarding flow, the resume banner and
 * the stage switcher all get in this prototype.
 *
 * `useSyncExternalStore` rather than a plain module variable because readers
 * genuinely have to re-render: adding a note has to appear in the table
 * immediately, on the same screen.
 */
export interface CoachNote {
  id: string
  title: string
  body: string
  /** ISO date, so the table can sort and format without parsing display text. */
  date: string
  /** 24-hour `HH:MM`, matching the frame's own "10:30" / "14:00" column. */
  time: string
}

/**
 * Seeded from frame `641:12650`'s three rows, **with the content changed**.
 *
 * The frame's own titles are a certified coach's supervision log — "Check-in:
 * Kellerman dyad, Frank's capacity", "First supervision: Kellerman dyad". This
 * page lives in the *trainee* nav, and a trainee has no assigned clients and no
 * supervision sessions yet; the thing that actually sends them here is the "How
 * did {stage} go?" banner on Home. So the seeds are the notes that prompt would
 * produce. The frame's dates and times are kept exactly.
 */
let notes: CoachNote[] = [
  {
    id: 'note-3',
    title: 'Guided group practice: session 1',
    body: "Facilitator ran through the SIPTEA components with the whole group. I found Shared understanding easiest to follow. Want to re-read the Emotion navigation section before the next one.",
    date: '2026-07-22',
    time: '10:30',
  },
  {
    id: 'note-2',
    title: 'Peer role-play: what to work on',
    body: "Played the coach for the second brief. I jumped to suggesting a plan before really hearing what mattered to them. Next time: slow down, stay in Shared understanding longer.",
    date: '2026-07-21',
    time: '14:00',
  },
  {
    id: 'note-1',
    title: 'Content learning: module 2 takeaways',
    body: 'Population understanding. The part on how dementia changes sleep architecture was new to me and worth revisiting.',
    date: '2026-06-24',
    time: '10:00',
  },
]

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCoachNotes(): CoachNote[] {
  return useSyncExternalStore(
    subscribe,
    () => notes,
    () => notes,
  )
}

/** Removes a note outright. There is no undo and no soft-delete tier here, which
 *  is exactly why the UI gates it behind a confirmation. */
export function deleteCoachNote(id: string): void {
  notes = notes.filter((n) => n.id !== id)
  emit()
}

/** Newest first, so a note the coach just wrote lands at the top of the table
 *  rather than somewhere down the list they have to hunt for. */
export function addCoachNote(input: { title: string; body: string; when: Date }): void {
  const pad = (n: number) => String(n).padStart(2, '0')
  notes = [
    {
      id: `note-${notes.length + 1}-${input.when.getTime()}`,
      title: input.title.trim(),
      body: input.body.trim(),
      date: `${input.when.getFullYear()}-${pad(input.when.getMonth() + 1)}-${pad(input.when.getDate())}`,
      time: `${pad(input.when.getHours())}:${pad(input.when.getMinutes())}`,
    },
    ...notes,
  ]
  emit()
}
