import { Navigate, useParams } from 'react-router-dom'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import {
  CONSUMER_CREST_TRACKING,
  CONSUMER_HERO_TO_CONTENT,
  ConsumerCanvasWave,
  ConsumerContentReveal,
  ConsumerPageHero,
} from '@/components/consumer/ConsumerCanvasWave'
import { FeaturedLessonCard, PreviousLessonCard } from '@/components/consumer/LessonCards'
import { NUMBERED_LESSON_COUNT, releasedLessons } from '@/components/consumer/lessons'
import { moduleLesson } from '@/data/consumerLessonContent'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'

/**
 * My Lessons — Round 43, frames `771:3711` (desktop, 1281) and `792:2080`
 * (mobile, 375), with the six card states in `LessonCards.tsx`.
 *
 * Replaces the `ConsumerInProgressPage` placeholder that stood behind this tab
 * since Round 41. That component stays: it still serves Need Help.
 *
 * ── What is derived rather than transcribed ───────────────────────────────
 *
 * The frames repeat one lesson ("Lesson 4 — Understanding Your Sleep Patterns")
 * in every card, which is placeholder content, not curriculum. Every card here
 * reads the consumer's real `moduleEngagement` through `releasedLessons`, so the
 * page shows this dyad's actual lessons in their actual states.
 *
 * The headline count is derived too. Both frames get it wrong in different
 * ways — the desktop says "6 lesson in total" (missing plural) and the mobile
 * renders " lesson in total" with the number dropped entirely, which is a Figma
 * variable that did not resolve. The sentence is built from
 * `NUMBERED_LESSON_COUNT`, so it cannot drift from the curriculum the way the
 * coach portal's "five stages" did over a six-stage rail three separate times.
 */
/**
 * Round 46 — where a card's Play control goes. `undefined` for a module with no
 * content built yet, which leaves that card's CTA a plain button that does
 * nothing rather than a link into an empty player. Only Module 4 is populated
 * today, so five of the six cards are deliberately still inert; that is honest
 * about the state of the content and is not a wiring bug.
 */
function moduleHref(dyadId: string, moduleId: string): string | undefined {
  // `?from=modules` — Round 48, direct instruction. The module's own exit reads
  // this to decide where leaving it goes and what the control says; see
  // `moduleExit` in `ConsumerModulePage`. Home's `LearningTaskCard` stamps
  // nothing, because Home is that function's default.
  return moduleLesson(moduleId)
    ? `/consumer/${dyadId}/module/${moduleId}?from=modules`
    : undefined
}

export function ConsumerLessonsPage() {
  const { dyadId } = useParams()
  const { consumerDyads } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)

  if (!dyad) return <Navigate to="/consumer" replace />

  // `[0]` is the week's lesson; the rest are the list below it. One ordering,
  // so the two sections cannot both claim a lesson or drop one between them.
  const [featured, ...previous] = releasedLessons(dyad)

  return (
    <ConsumerShell
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      // `relative overflow-clip` because the wave is 132% of this column's
      // width by design; the clip is what makes that safe.
      contentClassName="bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-24 md:px-20"
      optedOut={dyad.optedOut}
      showFooter
    >
      <ConsumerCanvasWave />

      {/* The hero is Home's own component, and the crest tracking with it — see
          `ConsumerPageHero` and `CONSUMER_CREST_TRACKING`. */}
      <div
        className={cn(
          'relative flex flex-col items-center pt-4 pb-16',
          CONSUMER_HERO_TO_CONTENT,
          CONSUMER_CREST_TRACKING,
        )}
      >
        <ConsumerPageHero
          withPencil
          title="My Modules"
          sub={
            <>
              <strong className="font-semibold">
                {NUMBERED_LESSON_COUNT} modules in total
              </strong>
              , one released each week
            </>
          }
        />

        {/* Both sections are `gap-4 lg:gap-6` — 16 on a phone, and **24** on
            desktop rather than the frames' own 32 (Round 43, direct
            instruction: "reduce space between the section title i.e. lesson of
            the week and card below + previous lessons and cards below down from
            32px to 24px"). Both sections, so the two headings sit the same
            distance above their content.

            Only the content below the mascot animates on a tab change — the
            wave, the mascot and the title hold still. */}
        <ConsumerContentReveal className="flex w-full max-w-[1121px] flex-col gap-14">
          {featured && (
            <section className="flex flex-col gap-4 lg:gap-6">
              <h2 className="text-consumer-heading text-ink">Module of the week</h2>
              <FeaturedLessonCard view={featured} to={moduleHref(dyad.id, featured.id)} />
            </section>
          )}

          {previous.length > 0 && (
            <>
              {/* Mobile draws the rule as its own full-width divider above the
                  heading; desktop runs it out to the right of the heading
                  instead. Two placements of ONE divider — which is why this one
                  went straight as well: leaving it wavy would have given the
                  same rule two different shapes depending on width. */}
              <hr className="border-t border-consumer-primary lg:hidden" />

              <section className="flex flex-col gap-4 lg:gap-6">
                <div className="flex items-center gap-6">
                  {/* Round 43, direct instruction: "previous weeks lessons (fix
                      english, grammer)". Plural possessive — the lessons belong
                      to the weeks that have passed, so the apostrophe goes
                      after the s. */}
                  <h2 className="text-consumer-heading whitespace-nowrap text-ink">
                    Previous weeks&rsquo; modules
                  </h2>
                  {/* A plain 1px rule in `consumer-primary`, not the hand-drawn `ConsumerWaveRule`
                      (direct instruction: "remove the wavy stroke after
                      previous week modules, and change with a straight line").

                      `min-w-0` is kept for the same reason it was there for the
                      wave: it is the flex child that fills the row, and without
                      it a wide child sizes the track and pushes the page into
                      horizontal scroll — the failure this project has shipped
                      three times. A border cannot overflow the way the 920px
                      SVG export could, but the guard costs nothing and the rule
                      it protects is about the container, not the content. */}
                  <span className="hidden min-w-0 flex-1 border-t border-consumer-primary lg:block" />
                </div>

                {/* 64px between rows on desktop. Frame `786:4211` draws 48;
                    the Round 43 direct instruction against the live page was
                    "increase vertical space to 64px", so the instruction wins
                    over the frame and this is recorded as a divergence rather
                    than left looking like a transcription slip. */}
                <ul className="flex flex-col gap-6 lg:gap-16">
                  {previous.map((view) => (
                    <li key={view.id}>
                      <PreviousLessonCard view={view} to={moduleHref(dyad.id, view.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {/* A consumer whose first lesson has not been released yet has no
              featured card and no list. Saying so plainly beats an empty page
              that reads as a failed load. */}
          {!featured && (
            <p className="text-consumer-lead text-ink-muted">
              Your first module has not been released yet. Your coach will let you know when it
              is ready.
            </p>
          )}
        </ConsumerContentReveal>
      </div>
    </ConsumerShell>
  )
}
