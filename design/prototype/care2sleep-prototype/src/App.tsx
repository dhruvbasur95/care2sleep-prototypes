import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { ResearchProvider } from '@/data/research-store'
import { PortalSwitcherPage } from '@/pages/PortalSwitcherPage'
import { ModuleOverviewPage } from '@/pages/training-v2/ModuleOverviewPage'
import { ModulePlayerPage } from '@/pages/training-v2/player/ModulePlayerPage'
import { ResearchHomePage } from '@/pages/research/ResearchHomePage'
import { RosterPage } from '@/pages/research/RosterPage'
import { CoachProfilePage } from '@/pages/research/CoachProfilePage'
import { SpacesRosterPage } from '@/pages/research/SpacesRosterPage'
import { SpacesCoachProfilePage } from '@/pages/research/SpacesCoachProfilePage'
import { ConsumerManagementPage } from '@/pages/research/ConsumerManagementPage'
import { ConsumerDetailPage } from '@/pages/research/ConsumerDetailPage'
import { ConsumerHomePage } from '@/pages/consumer/ConsumerHomePage'
import { DeliveryHomePage } from '@/pages/delivery/DeliveryHomePage'
import { DeliveryMeetingsPage } from '@/pages/delivery/DeliveryMeetingsPage'
import { DeliveryLearningHomePage } from '@/pages/delivery/DeliveryLearningHomePage'
import { DeliveryNotesPage } from '@/pages/delivery/DeliveryNotesPage'
import { DeliveryConsumerDetailPage } from '@/pages/delivery/DeliveryConsumerDetailPage'
import { DeliveryAccountPage } from '@/pages/delivery/DeliveryAccountPage'
import { ResearchAccountPage } from '@/pages/research/ResearchAccountPage'
import { ConsumerAccountPage } from '@/pages/consumer/ConsumerAccountPage'
import { ConsumerInProgressPage } from '@/pages/consumer/ConsumerInProgressPage'
import { ConsumerLessonsPage } from '@/pages/consumer/ConsumerLessonsPage'
import { ConsumerDiaryPage } from '@/pages/consumer/ConsumerDiaryPage'

/**
 * One app, every portal (decision 2026-07-22): the portal switcher is the
 * root route, with the Research Dashboard under /research and the Coach
 * Delivery Portal (which now also carries the coach's learning journey,
 * via its own Learning tab) under /delivery.
 */
export default function App() {
  const location = useLocation()
  return (
    <MotionConfig reducedMotion="user">
      <ResearchProvider>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PortalSwitcherPage />} />

            {/* The standalone Coach Training Portal home/timeline page
                (`/training-v2`, "Option B") is retired — no longer a
                switchable portal; a coach's learning journey now lives
                inside the Coach Delivery Portal's own Learning tab below
                (`/delivery/learning`). Its module overview and in-module
                player routes stay registered under the same `/training-v2`
                path prefix (URLs unchanged, just no longer reachable via a
                standalone home) since they're still the pages a coach lands
                on from that tab. */}
            {/* Module overview page (Round 7.1): the hub between a module's
                timeline card and its in-module player, replacing the old
                `ModulePreviewModal` overlay. A generic template — only
                `understanding-sleep` has real outline content this round,
                any other module id renders its real hero with a "coming
                soon" placeholder below. */}
            <Route path="/training-v2/module/:moduleId/overview" element={<ModuleOverviewPage />} />
            {/* Module content player (Round 7): the chapter-by-chapter
                screens after "Start module". Fully wired for
                `understanding-sleep` only (re-keyed from `sleep-basics` when
                the home page redesign moved to its own real 11-module
                dataset). */}
            <Route path="/training-v2/module/:moduleId/play" element={<ModulePlayerPage />} />

            {/* Coach Delivery Portal (Round 6.1) — the mocked Okta Verify
                sign-in gate that used to sit in front of this portal was
                removed per direct instruction; no auth/role logic, matches
                the Coach Training Portal and every other portal. */}
            <Route path="/delivery" element={<DeliveryHomePage />} />
            {/* Coach Delivery Portal — Learning tab: the coach's real entry
                point into the module timeline (see `DeliveryLearningHomePage`
                doc comment) since the standalone `/training-v2` home was
                retired. Clicking a module card still routes into the
                standalone/full-width `/training-v2/module/:id/overview` and
                `/play` pages above, which return here on exit. */}
            <Route path="/delivery/meetings" element={<DeliveryMeetingsPage />} />
            <Route path="/delivery/learning" element={<DeliveryLearningHomePage />} />
            <Route path="/delivery/notes" element={<DeliveryNotesPage />} />
            {/* Coach Delivery Portal — per-consumer detail view (Round 6.2) */}
            <Route path="/delivery/consumers/:dyadId" element={<DeliveryConsumerDetailPage />} />
            {/* Coach Delivery Portal — Account tab (Round 6.2.1) */}
            <Route path="/delivery/account" element={<DeliveryAccountPage />} />

            {/* Research Dashboard — "My Home" page (Round 10, renamed Round
                17), first in the sidebar. Bare "/research" now redirects
                here instead of landing on Trainee Management. */}
            <Route path="/research/schedule" element={<ResearchHomePage />} />
            <Route path="/research" element={<Navigate to="/research/schedule" replace />} />
            {/* Research Dashboard (Round 2) — "Trainee Management" in the
                sidebar; direct onboarding replaced the old EOI review queue,
                so this is the only Training Pipeline route left. */}
            <Route path="/research/trainees" element={<RosterPage />} />
            {/* Research Dashboard — My Profile tab (Round 6.2.1, renamed
                from "Account" Round 10) */}
            <Route path="/research/account" element={<ResearchAccountPage />} />
            <Route
              path="/research/coaches/:coachId"
              element={<CoachProfilePage />}
            />

            {/* Research Dashboard — Coaches (SPACES delivery oversight), Round 3 */}
            <Route path="/research/spaces-coaches" element={<SpacesRosterPage />} />
            <Route
              path="/research/spaces-coaches/:coachId"
              element={<SpacesCoachProfilePage />}
            />

            {/* Research Dashboard — Consumer Management, Round 4 */}
            <Route path="/research/consumers" element={<ConsumerManagementPage />} />
            <Route path="/research/consumers/:dyadId" element={<ConsumerDetailPage />} />

            {/* Consumer Portal (Round 5) — no real sign-in yet, so /consumer
                goes straight to the one demo consumer, Bruce & Joan
                Whitfield (dyad-011), standing in for a signed-in session. */}
            <Route path="/consumer" element={<Navigate to="/consumer/dyad-011" replace />} />
            <Route path="/consumer/:dyadId" element={<ConsumerHomePage />} />
            {/* Round 41 — the header's other two tabs. Real routes carrying an
                honest "still being built" page, so the tabs can be selected and
                the selected-tab animation is reachable. See
                `ConsumerInProgressPage`. */}
            {/* Round 43 — the real page, built from frames `771:3711` (desktop)
                and `792:2080` (mobile). `ConsumerInProgressPage` stays: it is
                still what Need Help renders. */}
            <Route path="/consumer/:dyadId/learning" element={<ConsumerLessonsPage />} />
            {/* Round 44 — the sleep diary fill-in flow (welcome -> 9 questions
                -> thank you), opened by Home's "Fill in sleep diary" CTA. */}
            <Route path="/consumer/:dyadId/diary" element={<ConsumerDiaryPage />} />
            <Route
              path="/consumer/:dyadId/help"
              element={
                <ConsumerInProgressPage
                  title="Need Help"
                  body="This is where you will find answers and a way to reach us. We are still building it. In the meantime, your coach is the best person to ask."
                />
              }
            />
            {/* Round 41, direct instruction: the Health & Sleep tab is gone.
                `ConsumerHealthPage.tsx` was deleted with it (grep-confirmed at
                zero other readers); the Fitbit and sleep-diary components it
                rendered are shared and keep their researcher/coach callers. */}
            {/* Consumer Portal — Account tab (Round 6.2.1), now reached from the
                header's account menu rather than a sidebar entry */}
            <Route path="/consumer/:dyadId/account" element={<ConsumerAccountPage />} />

            <Route path="*" element={<PortalSwitcherPage />} />
          </Routes>
        </AnimatePresence>
      </ResearchProvider>
    </MotionConfig>
  )
}
