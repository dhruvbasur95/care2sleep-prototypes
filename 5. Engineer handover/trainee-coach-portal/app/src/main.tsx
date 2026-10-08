import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'

/**
 * HANDOVER PACKAGE ONLY — not in the source prototype.
 *
 * Accessibility fix. An audit of this portal measured 30 distinct animations,
 * of which 11 did not honour `prefers-reduced-motion` — they each read the
 * setting nowhere and animated regardless. One was actively worse than not
 * honouring it: the Plan Sessions loading spinner *froze* under the setting,
 * so a user who asks for less motion got a stalled progress indicator instead
 * of a calmer one.
 *
 * `MotionConfig reducedMotion="user"` makes framer-motion respect the OS
 * setting globally: transform and layout animations are skipped, while opacity
 * transitions still run, which is the WCAG-aligned behaviour (motion is the
 * vestibular trigger; a cross-fade is not).
 *
 * It is applied here, at the root, rather than at 11 call sites because the
 * source prototype is frozen for this handover and a root wrapper touches no
 * component. Components that already guard on `useReducedMotion()` keep working
 * unchanged — this is a floor, not an override.
 *
 * See docs/motion-spec.md §1 for the full list of affected animations.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <App />
      </HashRouter>
    </MotionConfig>
  </StrictMode>,
)
