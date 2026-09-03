import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * The app's confirmation pill — a short "that worked" message that appears at
 * the bottom of the viewport and clears itself.
 *
 * The markup and the 4s timer were hand-rolled identically at four call sites
 * (`OnboardCoachDialog`, `AddAnnotationSummaryModal`, and twice in
 * `SpacesCoachProfilePage`) before this existed. Extracted at the fifth (My
 * Notes) rather than adding another copy, following the same
 * extract-at-the-next-caller rule `ResearchPageHero`, `StatCard`,
 * `MeetingsSection` and `WaveDivider` were each pulled out under. **The four
 * originals still inline it** — migrating them is a mechanical follow-up in the
 * researcher portal, deliberately not bundled into a trainee-portal change.
 *
 * `role="status"` (not `alert`) is right for a success confirmation: it is
 * announced politely, after whatever the user is doing, rather than
 * interrupting. It also means the message must be *rendered* to be announced,
 * which is why the timer clears the message rather than just hiding it.
 */
export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, 4000)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key="toast"
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-x-0 bottom-6 z-[60] mx-auto w-fit max-w-[90vw] rounded-full bg-ink px-5 py-3 text-caption font-semibold text-white shadow-card"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
