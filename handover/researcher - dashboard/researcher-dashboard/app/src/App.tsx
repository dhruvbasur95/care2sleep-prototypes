import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { ResearchProvider } from '@/data/research-store'
import { ResearchHomePage } from '@/pages/research/ResearchHomePage'
import { RosterPage } from '@/pages/research/RosterPage'
import { CoachProfilePage } from '@/pages/research/CoachProfilePage'
import { SpacesRosterPage } from '@/pages/research/SpacesRosterPage'
import { SpacesCoachProfilePage } from '@/pages/research/SpacesCoachProfilePage'
import { ConsumerManagementPage } from '@/pages/research/ConsumerManagementPage'
import { ConsumerDetailPage } from '@/pages/research/ConsumerDetailPage'
import { ResearchAccountPage } from '@/pages/research/ResearchAccountPage'

/**
 * Research Dashboard — the whole app.
 *
 * The prototype this was extracted from hosts four portals behind one router
 * (Research Dashboard, Coach Delivery, Consumer, and a coach training area).
 * This package ships the Research Dashboard **only**: the other three portals'
 * pages, routes and shells are not present, and nothing here links to them.
 *
 * Route map — eight screens, two of them parameterised:
 *
 *   /                             -> redirect to /research/schedule
 *   /research                     -> redirect to /research/schedule
 *   /research/schedule            Home: meetings, attention items, study KPIs
 *   /research/trainees            Trainee Management: the coach-trainee roster
 *   /research/coaches/:coachId    Trainee record (5 tabs)
 *   /research/spaces-coaches      Coach Management: certified/delivering coaches
 *   /research/spaces-coaches/:coachId
 *                                 Coach record (4 tabs; Assigned Consumers has
 *                                 its own nested section tabs)
 *   /research/consumers           Consumer Management: the consumer roster
 *   /research/consumers/:dyadId   Consumer record (5 tabs)
 *   /research/account             My Profile
 *
 * `/research/schedule` is the home path for historical reasons — the page was
 * built as "My Schedule" and later became "My Home". The route string was
 * deliberately left alone so existing links keep working; renaming it is safe
 * if you have no external references to it.
 *
 * Note on comments: this codebase carries a long, deliberately detailed
 * commentary from the prototype it was extracted from, and some of it still
 * names components or screens from the other three portals. Those references
 * are historical context for *why* a decision was made — the files they name
 * are not in this package. Where such a comment justified real behaviour it has
 * been rewritten; where it only explained a cross-portal constraint it has been
 * removed. If you hit one that was missed, read it as history, not as a
 * pointer to something you should be able to open.
 *
 * ---------------------------------------------------------------------------
 * CODE THAT IS PRESENT BUT UNREACHABLE — read this before trusting a `grep`
 * ---------------------------------------------------------------------------
 *
 * A handful of things in this package compile, look finished, and can never
 * run. Each carries its own ⚠️ header at its definition; this is the index so
 * you find them before you waste time on them, not after.
 *
 *   `PlanSessionsModal.tsx`      ~1,060 lines. The guided "plan all 7 SPACES
 *   `EditSessionPlanModal.tsx`   ~410 lines.   sessions" wizard and its
 *                                single-panel edit sibling. NO MOUNT POINT:
 *                                their only trigger was the coach portal's
 *                                session tracker. Session planning is the
 *                                coach's workflow — a researcher reads a plan
 *                                through `SessionsPlanOverview` (read-only by
 *                                design; researchers must not mark sessions
 *                                complete) and cannot create or amend one.
 *                                Retained because this is real, heavily
 *                                iterated product logic a researcher-side
 *                                build may want. Deleting them or giving them
 *                                a researcher trigger are both product calls.
 *
 *   store actions               `bulkSetSessionPlan` and `toggleSession` have
 *                                callers, but only inside those two modals,
 *                                so they are unreachable too. Six more are
 *                                unwired outright — see the RETAINED BUT
 *                                UNWIRED block in `data/research-store.tsx`.
 *
 *   `sessionRecordingsFor()`     A complete derivation of a coach's session
 *   (`data/research.ts`)         recordings across the COACH stages, rendered
 *                                by no screen. Kept because session
 *                                recordings are a stated research-data
 *                                requirement. There is no recording artifact
 *                                in the data model — metadata only.
 *
 * Separately, ~13 controls are drawn but deliberately not wired. They all
 * render through `components/shared/InertButton.tsx`, whose doc comment lists
 * every one and what it is waiting on. `grep -rn InertButton src` is the
 * fastest way to see the whole to-build list. The one exception is the
 * notification bell in `AppHeader.tsx`, which is a `<span>` rather than a
 * focusable `aria-disabled` button.
 *
 * Two things that are neither dead nor finished, and will mislead you most:
 *   - `TODAY` in `data/format.ts` is a frozen date constant standing in for
 *     "now", and it is roughly five weeks in the past. It drives the
 *     Upcoming/Scheduled split, "sessions this week", pending-invite ageing,
 *     the future-session guard, and the timestamp on every store write.
 *     Replacing it with a real clock also means re-dating the seed data.
 *   - `generateMeetingCreds()` in `data/research-store.tsx` fabricates
 *     `https://zoom.us/j/<random>` links, and the seed data does the same.
 *     These render as real outbound `<a href target="_blank">` links to a
 *     third-party domain — not inert placeholders.
 *
 * `AnimatePresence` is keyed on `location.pathname`, so each route transition
 * runs the shell's own enter/exit animation. `MotionConfig reducedMotion="user"`
 * makes every framer-motion animation in the app honour the OS
 * `prefers-reduced-motion` setting — do not remove it; several screens animate
 * on mount.
 */
export default function App() {
  const location = useLocation()
  return (
    <MotionConfig reducedMotion="user">
      {/* Single source of truth for all mutable app state. Every page reads
          and writes through `useResearch()`; there is no other store. */}
      <ResearchProvider>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/research/schedule" replace />} />
            <Route path="/research" element={<Navigate to="/research/schedule" replace />} />

            <Route path="/research/schedule" element={<ResearchHomePage />} />

            {/* Coach trainees — people still moving through COACH certification. */}
            <Route path="/research/trainees" element={<RosterPage />} />
            <Route path="/research/coaches/:coachId" element={<CoachProfilePage />} />

            {/* Certified coaches — people delivering SPACES sessions to consumers. */}
            <Route path="/research/spaces-coaches" element={<SpacesRosterPage />} />
            <Route path="/research/spaces-coaches/:coachId" element={<SpacesCoachProfilePage />} />

            {/* Consumers — the dyads (person with lived experience + carer) or
                carer-only participants receiving sleep coaching. */}
            <Route path="/research/consumers" element={<ConsumerManagementPage />} />
            <Route path="/research/consumers/:dyadId" element={<ConsumerDetailPage />} />

            <Route path="/research/account" element={<ResearchAccountPage />} />

            {/* Unknown path: fall back to Home rather than rendering nothing. */}
            <Route path="*" element={<Navigate to="/research/schedule" replace />} />
          </Routes>
        </AnimatePresence>
      </ResearchProvider>
    </MotionConfig>
  )
}
