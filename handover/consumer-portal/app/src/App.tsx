import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { ResearchProvider } from '@/data/research-store'
import { ConsumerHomePage } from '@/pages/consumer/ConsumerHomePage'
import { ConsumerLessonsPage } from '@/pages/consumer/ConsumerLessonsPage'
import { ConsumerModulePage } from '@/pages/consumer/ConsumerModulePage'
import { ConsumerDiaryPage } from '@/pages/consumer/ConsumerDiaryPage'
import { ConsumerHelpPage } from '@/pages/consumer/ConsumerHelpPage'
import { ConsumerAccountPage } from '@/pages/consumer/ConsumerAccountPage'
import { ConsumerMenuDrawer } from '@/components/consumer/ConsumerMenuDrawer'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Care2Sleep — CONSUMER PORTAL. The whole route table.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This package ships the Consumer Portal only. The full Care2Sleep prototype
 * also contains a Research Dashboard and a Coach Delivery Portal; both were
 * removed from this copy rather than shipped with a note asking you to ignore
 * them, so there is **no portal switcher and no way to change role**. Every
 * route below is something a consumer can reach.
 *
 * ── Two things about this file that are load-bearing ────────────────────────
 *
 * 1. `key={location.pathname}` on `<Routes>` is what makes page transitions
 *    work. `AnimatePresence mode="wait"` needs the child's key to change for
 *    it to run an exit animation at all; keying on the *pathname* (not on
 *    `location.key`) means a re-render at the same URL does not replay the
 *    page's entrance. See `docs/motion-spec.md` §1.
 *
 * 2. `ConsumerMenuDrawer` is mounted ABOVE `<Routes>`, deliberately — see its
 *    own comment at the bottom of this file.
 *
 * ── There is no sign-in ─────────────────────────────────────────────────────
 *
 * `/` redirects to one hardcoded demo consumer (`dyad-011`, Bruce & Joan
 * Whitfield). In production the `:dyadId` segment comes from the authenticated
 * session, and this redirect is the seam where that happens — see
 * `docs/integration-points.md` §1.
 */
export default function App() {
  const location = useLocation()
  return (
    <MotionConfig reducedMotion="user">
      <ResearchProvider>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* No real sign-in yet, so the root goes straight to the one demo
                consumer standing in for a signed-in session. */}
            <Route path="/" element={<Navigate to="/consumer/dyad-011" replace />} />
            <Route path="/consumer" element={<Navigate to="/consumer/dyad-011" replace />} />

            {/* Home — the welcome flow and the first-run tour both open from
                here on a fresh load. */}
            <Route path="/consumer/:dyadId" element={<ConsumerHomePage />} />

            {/* My Modules — the module list. */}
            <Route path="/consumer/:dyadId/learning" element={<ConsumerLessonsPage />} />

            {/* A module's inner pages: welcome -> video -> summary ->
                reflection. Opened by any "Play module" CTA. */}
            <Route path="/consumer/:dyadId/module/:moduleId" element={<ConsumerModulePage />} />

            {/* The sleep diary fill-in flow: welcome -> 9 questions -> thank
                you. Opened by Home's "Fill in sleep diary" CTA. */}
            <Route path="/consumer/:dyadId/diary" element={<ConsumerDiaryPage />} />

            {/* Need help. Reached from the account menu, not a header tab. */}
            <Route path="/consumer/:dyadId/help" element={<ConsumerHelpPage />} />

            {/* My profile. Also reached from the account menu. */}
            <Route path="/consumer/:dyadId/account" element={<ConsumerAccountPage />} />

            {/* Anything else returns to Home rather than rendering a dead
                screen. There is no 404 design. */}
            <Route path="*" element={<Navigate to="/consumer/dyad-011" replace />} />
          </Routes>
        </AnimatePresence>

        {/* ⚠️ **Mounted once, ABOVE the routes, deliberately.** The hamburger
            drawer has to outlive a navigation: every consumer page mounts its
            own `ConsumerShell`, so a drawer rendered inside the header
            unmounted the instant a row was tapped and its exit animation never
            played. Sitting here, it can navigate and close in the same frame —
            the new page mounts underneath and plays its own entrance while the
            shutter is still rising over it. Its open state is the
            module-scoped store in `data/consumerMenuReveal`, not React state,
            for the same reason. See `docs/motion-spec.md` §4. */}
        <ConsumerMenuDrawer />
      </ResearchProvider>
    </MotionConfig>
  )
}
