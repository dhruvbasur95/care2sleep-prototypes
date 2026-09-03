import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { ResearchProvider } from '@/data/research-store'
import { PortalSwitcherPage } from '@/pages/PortalSwitcherPage'
import { ModuleOverviewPage } from '@/pages/training-v2/ModuleOverviewPage'
import { ModulePlayerPage } from '@/pages/training-v2/player/ModulePlayerPage'
import { DeliveryHomePage } from '@/pages/delivery/DeliveryHomePage'
import { DeliveryMeetingsPage } from '@/pages/delivery/DeliveryMeetingsPage'
import { DeliveryLearningHomePage } from '@/pages/delivery/DeliveryLearningHomePage'
import { DeliveryNotesPage } from '@/pages/delivery/DeliveryNotesPage'
import { DeliveryConsumerDetailPage } from '@/pages/delivery/DeliveryConsumerDetailPage'
import { DeliveryAccountPage } from '@/pages/delivery/DeliveryAccountPage'

/**
 * One app, one portal (handover package): the portal switcher is still the
 * root route, but the Coach Delivery Portal under /delivery is the only card
 * on it. That portal also carries the coach's learning journey via its own
 * My Learning tab, whose module overview and player pages stay registered
 * under the /training-v2 path prefix below.
 *
 * The Research Dashboard (/research) and Consumer Portal (/consumer) routes,
 * and the pages behind them, are deliberately absent from this package — the
 * client's instruction is that researcher and consumer surfaces are not
 * shared.
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
            {/* Handover package: every `/research/*` and `/consumer/*` route
                was removed along with the pages behind them — this package is
                the Coach Delivery Portal and the learning journey only. */}

            {/* Unknown paths land on the portal switcher, which is this
                package's single entry point. `replace` so the bad URL does
                not sit in history behind the page the user ends up on. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </ResearchProvider>
    </MotionConfig>
  )
}
