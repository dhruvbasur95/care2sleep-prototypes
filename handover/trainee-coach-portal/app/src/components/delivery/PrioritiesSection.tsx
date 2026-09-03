import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, MoreVertical } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

/**
 * "This week's priorities" — the coach Home list from frame `739:5550`
 * (`739:7338`).
 *
 * **Replaces `AttentionSection`'s card grid on coach Home**, rather than being
 * a variant of it. The two differ in shape, not colour: that one is a wrapping
 * grid of themed cards, each with a title, a body, optional meta and its own
 * CTA pill; this is a flat list of one-line rows inside a single box. Serving
 * both from one component would have meant a flag that switches off the very
 * layout making the card version correct on the surfaces that still want it —
 * which this project's own standing rules say to build locally instead.
 *
 * What it *does* keep from that component, deliberately, is the header: the
 * `alert-pastel` count pill and the `primary` ghost "Dismiss all", at the same
 * 12px gap. Those are drawn identically in this frame, and the researcher's own
 * hub uses them too, so all three portals keep one treatment.
 *
 * **A row is one short, specific instruction.** The frame's own rows are five
 * copies of a module title ("Setting the Stage for Sleep"), which is placeholder
 * content rather than a priority — it names a thing, not something to do. Every
 * row here is built from the coach's real caseload by `coachPriorities()` in
 * `DeliveryHomePage`.
 *
 * Every row is the same two-part shape: a **title** on top and a **note**
 * under it (direct instruction). The title is `caption-medium`, the note
 * `body` regular, and rows are 16px apart.
 *
 * Round 40, `/design:user-research` — the first pass wrote each row as a whole
 * sentence ("Write your reflection on Session 1 with Eleanor Sinclair &
 * Margaret Sinclair"), which wrapped to two lines, put the verb and the name
 * 60 characters apart, and made three rows that are the *same kind of job*
 * scan as three unrelated sentences. A coach reading a to-do list is doing two
 * things at once — deciding what to pick up, and checking whose it is — and a
 * fixed slot for each is what lets them do both without reading the line.
 *
 * The two parts are told apart by **weight only** — direct instruction, twice:
 * no colour coding, and no per-row icon either. Both parts are `ink`. Colour on this list would have to mean
 * something, and "session plan" versus "reflection" is not a severity.
 */
export interface PriorityItem {
  id: string
  /** The headline, 2-4 words. What kind of thing this is. */
  title: string
  /** One sentence under it: who it concerns, and what to do about it. */
  note: string
  /** Where the row goes when opened. */
  to: string
}

/** The frame's 296px box, minus its 12px padding either side. Five rows fit.
 *  A **fixed** height, not a cap (direct instruction): the box is one half of a
 *  two-column row, so it shrinking to fit one priority would drag the KPI grid
 *  beside it down with it every time a coach dismissed something. */
const LIST_HEIGHT = 'h-[272px]'

export function PrioritiesSection({
  items,
  className,
}: {
  items: PriorityItem[]
  className?: string
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const visible = items.filter((i) => !dismissed.has(i.id))

  /* Dismissing unmounts the control that was clicked, and "Dismiss all"
     unmounts every one at once — focus would fall to `<body>`, this project's
     most-repeated defect. Same landing spots the deleted `AttentionSection` used: the heading
     while rows remain, `#main-content` once the section itself goes. */
  const dismiss = (ids: string[]) => {
    const remaining = visible.filter((i) => !ids.includes(i.id)).length
    setDismissed((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
    setOpenMenu(null)
    if (remaining > 0) headingRef.current?.focus({ preventScroll: true })
    else document.getElementById('main-content')?.focus({ preventScroll: true })
  }

  /* Round 40, direct instruction: **"Dismiss all" does not remove the box.**
     The researcher's own attention hub and the trainee's hide themselves when
     empty, and that is right there — they sit above other content that closes
     up behind them. Here the box is one half of a two-column row, and hiding it
     leaves the KPI tiles beside a 456px hole. An empty state is also the more
     honest end state: "nothing this week" is a real, good answer to "what are
     this week's priorities", where a vanished section answers nothing. */
  const empty = visible.length === 0

  return (
    <section className={cn('flex flex-col gap-4', className)} data-tour="priorities">
      <div className="flex min-h-9 items-center justify-between gap-6">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 font-display text-title text-ink outline-none"
        >
          This week&rsquo;s priorities
        </h2>
        {!empty && (
          <div className="flex shrink-0 items-center gap-3">
            {/* The frame's own pill and ghost button, matching the researcher
                hub and the trainee attention section exactly. White on
                `alert-pastel` measures 3.45:1 and is a documented, explicitly
                requested exception (see `index.css`) — not a new one. */}
            <span className="inline-flex items-center rounded-full bg-alert-pastel px-2.5 py-1 text-caption-medium text-white">
              {visible.length} {visible.length === 1 ? 'alert' : 'alerts'}
            </span>
            <button
              type="button"
              onClick={() => dismiss(visible.map((i) => i.id))}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-sm px-3 text-caption-medium text-primary outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Dismiss all
            </button>
          </div>
        )}
      </div>

      {/* Round 40, direct instruction: **white in both states.** The frame
          nests a white panel inside a `parchment` one, which paints a grey ring
          around the list and nothing else — and read as a mistake in the empty
          state, where the ring is the only thing with a fill. One surface now:
          white, `parchment` stroke, the app's card shadow, exactly like the
          clients table below it and the Case notes table in the client record.
          The 12px + 16px the frame splits across two boxes becomes one 16px
          inset, so the rows sit where they did. */}
      <div className="rounded-lg border border-parchment bg-white p-4 shadow-card">
        <div className={cn('flex flex-col gap-4 overflow-y-auto', LIST_HEIGHT)}>
          {empty && (
            /* The shared `EmptyState` — icon in its tinted circle over one
               short line — inside the box rather than instead of it, and
               `m-auto` so it centres in the fixed height rather than sitting at
               the top of an otherwise empty panel. */
            <EmptyState icon={CheckCircle2} copy="Nothing needs your attention this week." className="m-auto" />
          )}

          {visible.map((item) => (
            <div
              key={item.id}
              /* Round 40, direct instruction: **the whole card is the control,
                 not the text**. A stretched link
                 (`after:absolute after:inset-0`) rather than an `<a>` wrapping
                 the row, because the kebab is a real button and nesting one
                 inside a link is invalid and unreachable by keyboard. The kebab
                 sits above that overlay on `z-10`.

                 `ink`, not the frame's `primary` (direct instruction: black,
                 not purple). Title and note differ by weight and size alone, so
                 the pattern survives for anyone who cannot separate colours and
                 the list implies no severity it does not have. */
              className="relative flex shrink-0 items-start justify-between gap-3 rounded-xs bg-purple-50 p-3 transition-colors hover:bg-purple-200 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <Link
                  to={item.to}
                  className="text-caption-medium text-ink outline-none after:absolute after:inset-0 after:rounded-xs"
                >
                  {item.title}
                </Link>
                <span className="text-body text-ink">{item.note}</span>
              </div>

              {/* The frame's kebab. It opens a one-item menu rather than being a
                  bare dismiss button, because a kebab that fires an action on
                  click is a lie about what a kebab means — and this app already
                  has kebabs on four surfaces that all open menus. */}
              <div className="relative z-10 -mt-1.5 -mr-1.5 shrink-0">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === item.id}
                  onClick={() => setOpenMenu((c) => (c === item.id ? null : item.id))}
                  className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreVertical aria-hidden="true" className="size-4" />
                  <span className="sr-only">Options for {item.title}</span>
                </button>
                {openMenu === item.id && (
                  <div
                    role="menu"
                    className="absolute right-0 z-10 mt-1 min-w-[160px] rounded-sm bg-white p-1 shadow-card ring-1 ring-hairline"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => dismiss([item.id])}
                      className="flex h-9 w-full items-center rounded-xs px-3 text-caption-medium text-ink outline-none transition-colors hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
