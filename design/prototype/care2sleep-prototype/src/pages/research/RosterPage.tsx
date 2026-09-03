import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, ChevronRight, Clock, UserCheck, Users } from 'lucide-react'
import { ResearchShell } from '@/components/research/ResearchShell'
import { ResearchPageHero } from '@/components/research/ResearchPageHero'
import { Card } from '@/components/ui/card'
import { SearchInput } from '@/components/SearchInput'
import { AddCoachTraineeModal } from '@/components/research/AddCoachTraineeModal'
import { InviteStatusChip } from '@/components/research/StatusChip'
import { StatCard } from '@/components/shared/StatCard'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { cn } from '@/lib/utils'
import { stageLabel, type Coach } from '@/data/research'
import { PATHWAY_MODULES_V2 } from '@/data/trainingPathwayV2'
import { formatDate, TODAY } from '@/data/format'
import { useResearch } from '@/data/research-context'

/**
 * Trainee Management — rebuilt in **Round 21** from Figma frame
 * `s6OLTSd4nc9V9W9lT1oBTO` node `23:1453`, against the same purple/yellow
 * palette and type steps the Home page rebuild established.
 *
 * What the frame changed from the Round 20 version:
 * - **Title and sub copy**: "Trainee Management" → **"Manage trainees"**, with
 *   new sub copy. Rendered through the shared `ResearchPageHero`.
 * - **KPI tiles**: the white `ring-hairline` `KpiTile` row is replaced by the
 *   frame's yellow `StatCard` — the same tile Home's "Study overview" uses, now
 *   shared. Section heading "Trainee insights" → **"Trainees overview"**.
 * - **Table simplified to a title + search bar.** All three filter selects
 *   (Status / Stage / Needs support), the "Clear filters" button, and the
 *   `bg-card-header` band with its subtitle are gone. The heading and the
 *   search field now sit *above* the card as a plain section row, which is how
 *   the frame draws it — so this table is a documented exception to §35a's
 *   card-header rule: its header isn't inside the card at all.
 * - **Columns cut from 6 to 4** (+ the chevron): Trainee Name / Trainee ID /
 *   Status / Current Stage.
 *
 * ⚠️ **The frame and the instruction disagreed, and the instruction won.** Node
 * `23:1453` still draws `Needs Help` and `Date Raised` columns (nodes
 * `23:1943`/`23:1945`, with Marcus Webb's "Yes" tag and "18 Jul 2026" filled
 * in) and a 5th "Needs support" KPI tile. All three are removed here, and a
 * follow-up instruction ("get rid of any need support data, no longer needed")
 * took it further: `Coach.needsSupport`/`supportRaisedDate` are **deleted from
 * the data model**, along with the profile banner and the study-wide
 * notification that read them. Nothing in the app tracks a support flag now.
 *
 * Chips use this app's own `InviteStatusChip`/`Chip` rather than the frame's raw
 * amber/green tints, per the standing "the chrome is ours" rule — the frame's
 * `#fef3c7`/`#d1fae5` fills are the same concept `Chip`'s unified tones already
 * express, with contrast already measured (see `StatusChip.tsx`).
 */

/**
 * Trainee Management shows only coaches still in training — anyone at
 * currentPhase 8 (Entry into SPACES delivery) has already been certified and
 * moved into live delivery, tracked instead under the Coach Management area. A
 * business rule rather than a hardcoded row cap, so a newly-added trainee
 * (always created at Phase 2) still appears here automatically (Round 9.1).
 */
const GRADUATED_PHASE = 8

/** Stage-wise linear order (direct instruction) — earliest COACH stage
 *  first. A pending invite hasn't reached any stage yet, so it sorts ahead
 *  of Stage C; ties within the same stage keep their natural roster order
 *  (`Array.prototype.sort` is stable). */
function sortTrainees(list: Coach[]): Coach[] {
  const rank = (c: Coach) => (c.inviteStatus === 'pending' ? -1 : c.currentPhase)
  return [...list].sort((a, b) => rank(a) - rank(b))
}

/** "Certified this period" window — a coach counts once their Placement 2
 *  assessment (`certification.assessedDate`) falls within this many days of
 *  the prototype's fixed `TODAY`. 60 days keeps the tile a genuine,
 *  date-driven count (5 of the 6 `certifiedCoaches` records, not a static
 *  "all of them") rather than a synonym for "ever certified." */
const CERTIFIED_WINDOW_DAYS = 60

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`)
  const to = new Date(`${toIso}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

/** Total modules in the COACH content-learning curriculum, read from the real
 *  dataset rather than hardcoded so the "x of N" denominator can't go stale. */
const TOTAL_MODULES = PATHWAY_MODULES_V2.length

/** How many of the curriculum's modules this trainee has finished.
 *
 *  This column and "Current Stage" are two views of the same underlying
 *  progress, so they have to agree — a trainee at Stage O (Guided group
 *  practice) has by definition finished Content learning, and one whose invite
 *  is still pending has never signed in and so cannot have finished anything.
 *  That invariant is enforced in the seed data itself (see `fillRecordsComplete`
 *  in `data/research.ts`), not patched over here: this function just counts,
 *  and if the data were inconsistent the column would correctly show it. Both
 *  violations found when this column was added — Priya Raman showing 2 completed
 *  behind an unaccepted invite, Aisha Mohamed showing 8/12 at Stage O — were
 *  fixed at the data layer. */
function modulesCompleted(c: Coach): number {
  return c.moduleRecords.filter((r) => r.status === 'completed').length
}

/** The frame's `table-column-titles` (`23:1934`). Its own `#f8fafc` fill and
 *  12px label were dropped in Round 21 for consistency across the dashboard —
 *  see below. Brought up to the Round 25 `purple-50` header treatment
 *  (`text-ink`, `py-4`) to match Consumer Management's own table, which had
 *  migrated but this one hadn't. */
const TH = 'px-4 py-4 text-caption-medium text-ink'

/** Roster tabs. "Certified" deliberately shows an empty state rather than the
 *  6 real `certifiedCoaches` records: per direct instruction it reads "no data
 *  available", and certified coaches are managed under Coach Management, not
 *  here — this roster is scoped to trainees still in the COACH pathway.
 *  "Pending invite" scopes the same table to `inviteStatus === 'pending'`
 *  trainees only, mirroring "Active trainees" own inviteStatus filter. */
const ROSTER_TABS = [
  { id: 'active', label: 'Active trainees' },
  { id: 'pending', label: 'Pending invite' },
  { id: 'certified', label: 'Certified' },
] as const
type RosterTab = (typeof ROSTER_TABS)[number]['id']

export function RosterPage() {
  const { coaches, searchQuery, setSearchQuery } = useResearch()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [tab, setTab] = useState<RosterTab>('active')

  const trainees = sortTrainees(coaches.filter((c) => c.currentPhase < GRADUATED_PHASE))

  // The first 4 counts scope to the roster shown on this page (currentPhase < 8);
  // "Certified this period" deliberately reads the *full* coach list, since a
  // certified trainee graduates out of this roster the moment they reach Phase 8
  // and would otherwise never be countable here at all.
  //
  // `activeCount` counts `inviteStatus`, not the separate `CoachStatus`
  // lifecycle field — the Status column renders `InviteStatusChip`, so counting
  // the other field made the tile contradict the table directly beneath it
  // (Round 20 design critique). Keep them on the same field.
  const activeCount = trainees.filter((c) => c.inviteStatus === 'active').length
  const invitePendingCount = trainees.filter((c) => c.inviteStatus === 'pending').length
  const certifiedThisPeriodCount = coaches.filter((c) => {
    if (c.certification.outcome !== 'pass' || c.certification.assessedDate === undefined) {
      return false
    }
    // `days >= 0` matters: a future-dated assessedDate (Helen Zhang's, which
    // post-dates the prototype's fixed TODAY) yields a negative difference and
    // would otherwise always satisfy `<= 60`, silently inflating this tile.
    const days = daysBetween(c.certification.assessedDate, TODAY)
    return days >= 0 && days <= CERTIFIED_WINDOW_DAYS
  }).length

  const q = searchQuery.trim().toLowerCase()
  const searched = trainees.filter(
    (c) =>
      q === '' ||
      c.fullName.toLowerCase().includes(q) ||
      c.employer.toLowerCase().includes(q) ||
      c.participantId.toLowerCase().includes(q),
  )
  // "Active trainees" and "Pending invite" split the same searched list by
  // inviteStatus, matching the two KPI tiles above (activeCount/invitePendingCount).
  const filtered = searched.filter((c) => c.inviteStatus === (tab === 'pending' ? 'pending' : 'active'))
  // Pre-search, tab-scoped count — distinguishes "this tab has no rows at
  // all" from "a search term produced zero results", matching Consumer
  // Management's own empty-state split.
  const tabScoped = trainees.filter((c) => c.inviteStatus === (tab === 'pending' ? 'pending' : 'active'))

  return (
    <ResearchShell
      heroNoSeam
      heroClassName="bg-purple-50"
      hero={
        <ResearchPageHero
          title="Manage trainees"
          subtitle="Onboard, track, and manage coaches who first join as trainees."
          action={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-[18px] text-caption-medium text-white outline-none transition-all hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]"
            >
              Add new coach trainee
            </button>
          }
        />
      }
    >
      {/* Trainees overview — the frame's `kpi-row` (`23:1709`): 5 yellow tiles,
          16px apart, each filling an equal share of the row. */}
      <section>
        <h2 className="font-display text-title text-ink">Trainees overview</h2>
        {/* 4 tiles, not the frame's 5: "Needs support" removed on direct
            instruction, along with the flag itself — see the header comment. */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total trainees" value={trainees.length} icon={Users} />
          <StatCard label="Active trainees" value={activeCount} icon={UserCheck} />
          <StatCard label="Invite pending" value={invitePendingCount} icon={Clock} />
          <StatCard label="Certified this period" value={certifiedThisPeriodCount} icon={Award} />
        </div>
      </section>

      {/* Trainees management table. 96px section gap, matching Home. */}
      <section className="mt-24">
        {/* The frame puts the heading and the search field on one row *above*
            the card (`23:2120`), not in a card-header band — so this table is a
            deliberate, documented exception to §35a. */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-title text-ink">Trainees management table</h2>
            <p className="mt-2 text-body text-ink-muted">Click a trainee to view more details.</p>
          </div>
          <div>
            <SearchInput
              id="coach-search"
              label="Search trainees"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search trainees"
              widthClassName="sm:w-[340px]"
            />
          </div>
        </div>

        <div className="mt-6">
          <UnderlineTabs
            tabs={ROSTER_TABS}
            active={tab}
            onChange={setTab}
            ariaLabel="Trainee roster"
            layoutId="trainee-roster-tab-underline"
            idPrefix="roster-tab"
            panelId="roster-panel"
          />
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {filtered.length} of {trainees.length} trainees
        </p>

        <div id="roster-panel" role="tabpanel" aria-labelledby={`roster-tab-${tab}`} className="mt-6">
        {/* Same chassis as Consumer Management's table: a `Card` at
            `rounded-lg` with a hairline ring, not a bare `rounded-sm` div —
            including the "Certified" tab's empty state, which used to sit
            outside the Card as its own bare block. CLAUDE.md's own history
            documents this exact regression being fixed once already (Round
            10: an icon empty state "folded into the same card... for full
            consistency with every other data-table pattern in the app"). */}
        <Card className="gap-0 rounded-lg py-0">
          <div className="overflow-x-auto">
            {tab === 'certified' ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Award className="size-8 text-primary" strokeWidth={1.75} />
                </span>
                <p className="text-body text-ink-muted">No data available.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-10 text-center text-body text-ink-muted">
                {tabScoped.length === 0
                  ? 'No trainees in this view yet.'
                  : `No trainees match “${searchQuery.trim()}”.`}
              </p>
            ) : (
              <table className="w-full min-w-[840px] border-collapse text-left">
                <thead>
                  {/* `purple-50`, no bottom rule — matches Consumer
                      Management's own table (Round 25). */}
                  <tr className="bg-purple-50">
                    <th scope="col" className={cn(TH, 'px-6')}>
                      Trainee Name
                    </th>
                    {/* No fixed pixel widths. The first pass gave every column
                        one (160+180+260+170+140+48 = 958px) inside a card that
                        measures 893px with the sidebar expanded — so the table
                        overflowed, the chevron column scrolled out of sight, and
                        the name column got squeezed until every name wrapped to
                        two lines. Letting the browser distribute the row and
                        pinning only what must not wrap fixes all three at once. */}
                    <th scope="col" className={TH}>
                      Trainee ID
                    </th>
                    <th scope="col" className={TH}>
                      Status
                    </th>
                    <th scope="col" className={TH}>
                      Current Stage
                    </th>
                    <th scope="col" className={TH}>
                      Modules Completed
                    </th>
                    <th scope="col" className={TH}>
                      Last Active
                    </th>
                    <th scope="col" className="relative px-4 py-3.5">
                      <span className="sr-only">Open profile</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/research/coaches/${c.id}`)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-pearl',
                        i > 0 && 'border-t border-hairline',
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex min-h-11 items-center">
                          <Link
                            to={`/research/coaches/${c.id}`}
                            aria-label={`View ${c.fullName}'s profile`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-caption font-semibold whitespace-nowrap text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {c.fullName}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                        {c.participantId}
                      </td>
                      <td className="px-4 py-4">
                        <InviteStatusChip status={c.inviteStatus} />
                      </td>
                      <td className="px-4 py-4 text-caption text-ink">
                        {c.inviteStatus === 'pending' ? (
                          <span aria-label="No stage yet, because the invite hasn't been accepted">—</span>
                        ) : (
                          stageLabel(c.currentPhase)
                        )}
                      </td>
                      <td className="px-4 py-4 text-caption tabular-nums whitespace-nowrap text-ink-muted">
                        {modulesCompleted(c)} of {TOTAL_MODULES}
                      </td>
                      <td className="px-4 py-4 text-caption whitespace-nowrap text-ink-muted">
                        {c.lastActive ? (
                          formatDate(c.lastActive)
                        ) : (
                          <span className="text-ink-faint">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ChevronRight aria-hidden="true" className="inline size-4 text-ink-faint" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
        </div>
      </section>

      <AddCoachTraineeModal open={addOpen} onClose={() => setAddOpen(false)} />

    </ResearchShell>
  )
}
