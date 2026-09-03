import { Navigate, useParams } from 'react-router-dom'
import { Hammer } from 'lucide-react'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import {
  CONSUMER_CREST_TRACKING,
  CONSUMER_HERO_TO_CONTENT,
  ConsumerCanvasWave,
  ConsumerContentReveal,
  ConsumerMascotFigure,
} from '@/components/consumer/ConsumerCanvasWave'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'

/**
 * Placeholder page for the two header tabs that have no surface behind them yet
 * — Need Help. (My Lessons became a real page in Round 43.)
 *
 * Both were `aria-disabled` buttons first, which is this project's standing
 * treatment for a control a frame draws but nothing has wired. That was the
 * wrong call here and was corrected on direct instruction ("my learning, and
 * need help buttons not working, I want to see animation", with "for these
 * pages, keep it in progress"): a disabled tab cannot be selected, so the
 * selected-tab animation could only ever be seen on Home, and a nav where two
 * of three items refuse to respond reads as broken rather than as unfinished.
 *
 * So the tabs navigate, and the page says plainly that it is being built. That
 * is a real state, honestly labelled — not a fake screen with placeholder
 * content in it, which is the thing that gets mistaken for finished work.
 *
 * One component with a `title`/`body` prop rather than two near-identical files:
 * when the real My Learning page lands it replaces one route, and this stays for
 * the other.
 */
export function ConsumerInProgressPage({ title, body }: { title: string; body: string }) {
  const { dyadId } = useParams()
  const { consumerDyads } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)

  if (!dyad) return <Navigate to="/consumer" replace />

  return (
    <ConsumerShell
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      // `relative overflow-clip` because the wave below is 132% of this
      // column's width by design; the clip is what makes that safe.
      contentClassName="bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-24 md:px-20"
      optedOut={dyad.optedOut}
    >
      {/* Direct instruction: "in my learnings, keep the big wavy pillow" — the
          same wave and the same awake mascot as Home, so moving between tabs
          does not swap the page's whole backdrop for a bare canvas. Shared
          components rather than copies; see `ConsumerCanvasWave`. */}
      <ConsumerCanvasWave />

      {/* The hero is Home's, not a second one (Round 43, direct instruction:
          "the hero section i.e. weavy background + avatar, streamline across all
          pages. We use what we have done in home section"). The wave was already
          the shared component; the mascot was not, so this page rendered the
          full-size desktop art on a phone and floated it 35px above the crest at
          1440. Both now come from `ConsumerCanvasWave`. */}
      {/* One flex column around both, the same shape Home and My Lessons use —
          the mascot and the content used to be siblings of the shell with the
          space between them coming from the content's own `pt-6`, which is a
          gap that only one of the two knows about. `CONSUMER_HERO_TO_CONTENT`
          is a `gap`, so it needs them to share a container to mean anything. */}
      <div
        className={cn(
          'relative flex flex-col items-center pt-4 text-center',
          CONSUMER_HERO_TO_CONTENT,
        )}
        style={CONSUMER_CREST_TRACKING}
      >
        <ConsumerMascotFigure />

        {/* Only this block animates on a tab change. */}
        <ConsumerContentReveal className="relative flex flex-col items-center gap-6 text-center">
          <span
            aria-hidden="true"
            className="flex size-16 items-center justify-center rounded-full bg-yellow-100 text-consumer-primary"
          >
            <Hammer className="size-7" />
          </span>
          {/* `h1`, not `h2`: this page has no hero band, so this is the page's
              own heading and the document would otherwise have none. */}
          <h1 className="text-display-lg text-ink">{title}</h1>
          {/* 18px below `md`, 20px from there — see `LEAD_20` on the Home page. */}
          <p className="max-w-[560px] text-sub-greeting leading-[1.3] text-ink-muted md:text-consumer-lead">
            {body}
          </p>
        </ConsumerContentReveal>
      </div>
    </ConsumerShell>
  )
}
