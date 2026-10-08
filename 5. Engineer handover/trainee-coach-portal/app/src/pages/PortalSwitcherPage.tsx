import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Users, type LucideIcon } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card } from '@/components/ui/card'

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

/** Active portal tile — same chassis as module-card, whole card one tab stop. */
function PortalTile({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: string
  icon: LucideIcon
  title: string
  body: string
}) {
  return (
    <Card className="group relative gap-0 rounded-lg py-0 transition-transform duration-150 has-[a:active]:scale-[0.98] has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <div className="flex flex-col gap-3 p-6">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-primary/10"
        >
          <Icon className="size-5 text-primary" strokeWidth={1.75} />
        </span>
        <div className="space-y-1">
          <h2 className="text-body leading-[1.24] font-semibold tracking-[-0.374px]">
            {title}
          </h2>
          <p className="text-caption text-ink-faint">{body}</p>
        </div>
        <Link
          to={to}
          className='mt-1 inline-flex min-h-11 w-fit items-center gap-1.5 text-caption-medium text-primary outline-none after:absolute after:inset-0 after:rounded-lg after:content-[""] group-hover:underline'
        >
          Open
          <span className="sr-only"> {title}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </Card>
  )
}

/** Baseline screen above all portals — plain navigation, no auth/role logic. */
export function PortalSwitcherPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader portal="switcher" />

      <motion.main
        {...pageMotion}
        id="main-content"
        className="mx-auto max-w-[860px] px-6 pt-14 pb-16 md:px-8 md:pt-20"
      >
        <h1 className="font-display text-display-md">
          Care2Sleep platform
        </h1>
        <p className="mt-2 text-body text-ink-faint">
          Choose where you're working today.
        </p>

        {/* Handover package: the Research Dashboard and Consumer Portal tiles
            are removed along with the pages behind them — this package is the
            coaching card only, per the client's instruction. The grid keeps
            its own gap and chassis but drops to one column: a single tile in
            the previous `sm:grid-cols-2` row left a visibly empty cell beside
            it. Capped at the tile's own two-column width so the one card does
            not stretch across the full 860px measure. */}
        <div className="mt-10 grid max-w-[418px] grid-cols-1 gap-6">
          <PortalTile
            to="/delivery"
            icon={Users}
            title="Coach Delivery Portal"
            body="Live session delivery, supervision and training modules for certified coaches."
          />
        </div>
      </motion.main>
    </div>
  )
}
