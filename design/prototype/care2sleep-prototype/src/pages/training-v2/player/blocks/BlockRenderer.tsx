import {
  Blocks,
  BookOpen,
  ClipboardList,
  CookingPot,
  Dumbbell,
  Gauge,
  Layers,
  Footprints,
  Lightbulb,
  MessagesSquare,
  Puzzle,
  Route,
  SlidersHorizontal,
  Workflow,
  Scale,
  Search,
  Sparkles,
  SunMoon,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BlockBox } from './BlockBox'
import { cn } from '@/lib/utils'
import { PATHWAY_MODULES_V2 } from '@/data/trainingPathwayV2'
import type {
  Block,
  InteractivePattern,
  TopicIcon,
  TransitionIcon,
} from '@/data/moduleContent'
import { VideoPlaceholder } from '../VideoPlaceholder'
import { YouTubeEmbed } from '../YouTubeEmbed'
import { QuoteBubble, pickBubbles } from './QuoteBubble'
import { WaveDivider } from '@/components/delivery/WaveDivider'
import { SIPTEA_BG, splitChapterSkills } from '@/data/siptea'
import { AccordionWithImage } from './AccordionWithImage'
import { InteractiveBlock } from './InteractiveBlock'
import { PILLOW_SHAPES } from './pillowFrame'
import { RevisionFlipCards } from './RevisionFlipCards'
import { HearPairRevealList } from './HearPairReveal'
import { YourTurnMcq } from './YourTurnMcq'
import { YourTurnFreeText } from './YourTurnFreeText'
import { YourTurnRanking } from './YourTurnRanking'
/* The animated pillow, imported from the Consumer Portal rather than copied
   (direct instruction). It is brand illustration, not consumer chrome — no
   consumer type step or colour token rides along with it, which is why this
   does not breach the "nothing leaks between portals" rule the way importing,
   say, `ConsumerPersonCard` would. If a third portal ever needs it, promote it
   to `components/shared/` the way `Care2SleepLogo` was; staged the same way
   `Toast` was. */
import { ConsumerMascot } from '@/components/consumer/ConsumerCanvasWave'

/**
 * One renderer per `module.md` block tag — the code side of the Figma block
 * component library (file `xhAPgU8I5GzG9UDPHqJrnj`, canvas `2577:19500`).
 *
 * ## What is taken from Figma and what is not
 * Per direct instruction: **composition from the frames, styling from this
 * app.** So each block's field order, grouping, and which parts sit on a
 * tinted panel vs. a plain card follow the Figma component exactly; the
 * type scale, colour tokens, radii and shadows are the portal's own, not
 * the templates' (which the block reference itself calls "intentionally
 * low-fidelity — a first pass to validate the workflow").
 *
 * ## Deliberate divergences, each with a reason
 * - **Core skills render as a wrapping chip list, not the frame's three
 *   circular badges.** The frame draws exactly 3; the real chapters carry
 *   11, 15 and 17 skills. Three fixed circles cannot hold seventeen, and
 *   truncating to three would drop authored content.
 * - **Interactive blocks are bare placeholders.** None of the three
 *   patterns has a Figma component yet, and the instruction (2026-09-15)
 *   is a labelled card naming the pattern with no content inside —
 *   overriding workflow §3a's earlier "preserve the content in the stub".
 *   The content is still in `moduleContent.ts` for whoever builds the real
 *   components.
 * - **Video blocks show no duration badge.** module.md carries no runtime
 *   for these videos, and inventing one would put a fabricated number on
 *   screen.
 */

/**
 * Transition-slide glyphs, keyed by the name a slide carries in its own data.
 *
 * Content-relevant by instruction, so this is a per-slide choice rather than
 * one mark for the whole pattern. Module 6's four transitions, and why each:
 * - `blocks` — the Good Sleep Recipe's three ingredients, in a module called
 *   "The Building Blocks of Good Sleep".
 * - `search` — "once you can recognise the patterns...".
 * - `scale` — "how to balance daytime rest with sleep drive... the same
 *   balance".
 * - `sun-moon` — "across the whole day, not just... at bedtime".
 *
 * `Footprints` is the fallback for a transition with no icon named, so a new
 * module renders rather than crashing — but naming one is the intent.
 */
/**
 * Chapter-opening key-topic glyphs, chosen against each topic's own copy.
 *
 * The same build-side choice as the transition slide's and the "Know ..."
 * eyebrows': module.md lists key topics as bare lines with no icon column, so
 * this cannot be transcribed. See workflow §6.1.
 */
const TOPIC_ICONS: Record<TopicIcon, LucideIcon> = {
  'cooking-pot': CookingPot,
  layers: Layers,
  puzzle: Puzzle,
  workflow: Workflow,
  gauge: Gauge,
  'clipboard-list': ClipboardList,
  dumbbell: Dumbbell,
  'sliders-horizontal': SlidersHorizontal,
  route: Route,
}

const TRANSITION_ICONS: Record<TransitionIcon, LucideIcon> = {
  blocks: Blocks,
  search: Search,
  scale: Scale,
  'sun-moon': SunMoon,
}

/**
 * The second lead line on the Chapter intro block's skills panel.
 *
 * ⚠️ A **build-side string with no authoring field** — the sixth such field in
 * this build, after the four icons and the outro's next-module name. module.md
 * supplies one `coreSkillsIntro` line, which sits over the SIPTEA discs; it has
 * nothing for the practice group beneath the rule. This is block chrome (a
 * label, like "Core skills covered" was) rather than content, which is why it
 * lives here and not in `moduleContent.ts`, where `verify-transcription.py`
 * would correctly fail it for not appearing in the source.
 *
 * Taken verbatim from the Figma template `2609:21746`. The template's *first*
 * line is deliberately NOT taken: it hardcodes "all three parts of the SIPTEA
 * framework", which is true of chapter 1 only.
 */
export const PRACTICE_SKILLS_INTRO =
  // Exact wording given 2026-09-18 ("the skills", not "the following skills").
  // Exported at its second caller — the module overview page's Core skills
  // card — rather than copied, so the two surfaces cannot drift apart.
  "Then we'll explore the skills that make up SIPTEA in practice:"

/**
 * The "Know ..." section eyebrow: a glyph and a `title`-step label.
 *
 * Shared by `know-what`, `know-how` and `know-why`, which differ from
 * `<Text block_2>` in exactly three ways and from each other in only the glyph
 * and the word. Keeping it in one place is what stops the three drifting, which
 * is the whole reason this project keeps extracting things at their second
 * caller.
 *
 * ⚠️ The glyph is a **build-side choice** — module.md has no icon column, the
 * same gap the transition slide has (workflow §6.1 item 5). Unlike a
 * transition's, it is one mark per section *type* rather than per slide, because
 * "Know What", "Know How" and "Know Why" are fixed section labels.
 *
 * `aria-hidden`: the label beside it already names the section, so announcing a
 * glyph adds nothing.
 */
/** Exported at its second caller — the module feedback slide draws the same
 *  icon + `title`/`primary` label row the three "Know ..." blocks do. */
export function SectionEyebrow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <p className="flex items-center gap-2 text-title text-primary">
      <Icon aria-hidden="true" className="size-8 shrink-0" strokeWidth={1.75} />
      {label}
    </p>
  )
}

/** A control the frame draws but which has no handler wired renders focusable
 *  and `aria-disabled` with an `sr-only` cue — never silently dead, never
 *  dropped (standing rule). */
function OutroButton({
  onClick,
  className,
  children,
}: {
  onClick?: () => void
  className?: string
  children: React.ReactNode
}) {
  const wired = Boolean(onClick)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={wired ? undefined : true}
      className={cn(
        'inline-flex h-12 shrink-0 items-center justify-center rounded-full px-5 text-caption-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
        className,
      )}
    >
      {children}
      {!wired && <span className="sr-only"> (coming soon)</span>}
    </button>
  )
}

/**
 * A bare, labelled stand-in for one of the three `<Interactive block>`
 * patterns. Focusable and announced rather than a silently inert box, per
 * this project's standing "unwired controls" rule.
 */
function InteractivePlaceholder({
  pattern,
  isFirst,
}: {
  pattern: InteractivePattern
  isFirst: boolean
}) {
  const label =
    pattern === 'revision'
      ? 'Know What revision'
      : pattern === 'you-might-also-hear'
        ? 'You Might Also Hear'
        : 'Your turn'

  // The pattern name is a real heading, not a styled <p>. Three of Module 6's
  // slides (both You Might Also Hear runs, every Your turn) consist of nothing
  // *but* interactive blocks, so if this rendered as plain text those slides
  // would have no heading at all — no <h1>, and nothing for `BlockSlide` to
  // move focus to on arrival, dropping a keyboard user on <body>. That is this
  // project's most-repeated defect class, and it only appears on the slides
  // whose entire content is still pending design.
  const Heading = isFirst ? 'h1' : 'h2'

  return (
    <Card className="border-dashed bg-yellow-50/60 p-8 text-center shadow-none">
      <Sparkles aria-hidden="true" className="mx-auto size-5 text-yellow-400" />
      <Heading
        data-slide-heading={isFirst || undefined}
        tabIndex={isFirst ? -1 : undefined}
        className="mt-3 font-display text-title outline-none"
      >
        {label}
      </Heading>
      <p className="mt-2 text-caption text-ink-muted">Interactive component — pending design</p>
    </Card>
  )
}

export function BlockView({
  block,
  isFirst,
  isOnly = false,
}: {
  block: Block
  isFirst: boolean
  /** True when this block is the slide's entire content. A `<Text block
   *  _Sub title>` alone on a slide *is* the transition slide — that is how
   *  module.md authors one (Module 6 slides 8, 16, 24 and 28). Detecting it
   *  structurally beats matching on the slide's label, which is authored
   *  prose and would break the moment a module titled one differently. */
  isOnly?: boolean
}) {
  // Exactly one heading per slide is promoted to the slide's own <h1>; every
  // later block heading is an <h2>. `BlockSlide` focuses the first one.
  const Heading = isFirst ? 'h1' : 'h2'

  switch (block.tag) {
    case 'module-intro': {
      const variants = pickBubbles(
        block.quotes.length,
        block.quotes.map((q) => q.text),
      )
      // TWO blocks from one tag. Rebuilt 2026-09-17 from `Module intro
      // block_new` (`2652:22759`), which replaces the 2026-09-16 build against
      // `2643:1048`. Same compound mechanism as `chapter-intro` /
      // `chapter-outro`.
      //
      // ## What changed, and why the old numbers are all gone
      // The old card was a **photo band across the top** with the pillow
      // centred on its crest and the copy beneath. The new one inverts that
      // completely: no photograph at all, a purple **radial gradient** card,
      // the copy at the TOP, and a cream wave rising across the bottom with
      // the pillow standing on it, off to the LEFT. Nothing carried over
      // except the quotes block below it, so `module-intro-band.webp` is gone
      // rather than re-cropped.
      return (
        <>
          {/* Block 1 — the gradient card. `p-0` because the card *is* the box:
              the wave has to reach three of its edges, and the copy carries
              its own 40px inset. */}
          <BlockBox className="p-0">
            <div
              className="overflow-hidden rounded-[16px] bg-primary bg-cover bg-center pt-10"
              /* The frame's own radial gradient, committed verbatim as an
                 export rather than re-authored as a CSS `radial-gradient()` —
                 its nine stops and elongated `gradientTransform` matrix do not
                 survive being eyeballed into two colour stops. It carries
                 `preserveAspectRatio="none"`, so it stretches to whatever
                 height the copy gives the card; `bg-primary` underneath is the
                 frame's own base fill and covers the card before the image
                 loads. */
              style={{
                backgroundImage: `url("${import.meta.env.BASE_URL}illustrations/module/module-intro-gradient.svg")`,
                backgroundSize: '100% 100%',
              }}
            >
              <div className="flex flex-col gap-4 p-10 text-center">
                <Heading
                  data-slide-heading={isFirst || undefined}
                  tabIndex={isFirst ? -1 : undefined}
                  className="font-display text-display-md text-white text-balance outline-none"
                >
                  {block.title}
                </Heading>
                <p className="text-sub-greeting leading-[1.4] text-white text-balance">
                  {block.expectationSetting}
                </p>
              </div>

              {/* The wave band. Its height is FIXED at the frame's 160px rather
                  than scaling with the card's width, and that is deliberate:
                  the pillow standing on it is a live component at its own
                  natural 90px, so a band that scaled down with the narrower
                  in-app card (880px against the frame's 1264px) would be 111px
                  tall and the pillow would overrun it. The wave carries
                  `preserveAspectRatio="none"` — it is drawn to be stretched —
                  so holding the height and letting the width squeeze shortens
                  the wavelength without touching the crest's amplitude. */}
              <div className="relative h-[160px] w-full">
                {/* Positioned exactly as the frame nests it, every number
                    divided by the frame's own 1264px card width or 160px band
                    height so it scales with the card rather than being
                    transcribed at one size:
                      centre x  50% - 14.3/1264      w  1564.918/1264
                      centre y  (7 + 1161.496/2)/160 h  1161.496/160
                    The blob runs far below the band; the card's own
                    `overflow-hidden` clips it. */}
                <img
                  src={`${import.meta.env.BASE_URL}illustrations/module/module-intro-wave.svg`}
                  alt=""
                  aria-hidden="true"
                  className="absolute max-w-none"
                  style={{
                    left: 'calc(50% - 1.1313%)',
                    top: '367.7%',
                    width: '123.807%',
                    height: '725.935%',
                    transform: 'translate(-50%, -50%) rotate(0.79deg) skewX(-0.82deg)',
                  }}
                />
                {/* The pillow is NOT part of the export — direct instruction,
                    carried over and reconfirmed for this rebuild ("avatar
                    animation use as is"). It is the Consumer Portal's own live
                    `ConsumerMascot`: breath, tilt, expressions, nap and zzz,
                    a four-layer split that baking it into the wave would throw
                    away. §78.1's "export them together" does not apply because
                    the wave and the pillow neither clip nor mask each other.

                    Left 93/1264 of the band width so it keeps its place on the
                    crest as the wave squeezes; top 35px absolute, because the
                    band's height is absolute. */}
                <div
                  className="pointer-events-none absolute"
                  style={{ left: '7.358%', top: '35px' }}
                >
                  {/* A warm-grey shadow (`#9E9281`, the frame's own `Ellipse
                      2`), not the white disc it used to sit on: the pillow now
                      rests ON the cream wave rather than hanging over a purple
                      edge, so it casts a shadow instead of needing a floor.
                      Built the documented way — the committed white ground with
                      one `fill` changed and nothing else, verified byte-identical
                      otherwise — so it stays in register by construction. */}
                  <ConsumerMascot
                    ground={`${import.meta.env.BASE_URL}illustrations/module/mascot-ground-shadow.svg`}
                    zzzTone="white"
                  />
                </div>
              </div>
            </div>
          </BlockBox>

          {/* Block 2 — the quotes. Byte-identical treatment to the chapter
              opening's own quote block, because the two frames draw the same
              thing: same intro step, same wrapping row, same 56/24 gaps. */}
          <BlockBox className="flex flex-col gap-10">
            <p className="text-center text-sub-greeting leading-[1.4] text-ink-muted">
              {block.transitionCopy}
            </p>
            <div className="flex flex-wrap items-start justify-center gap-x-14 gap-y-6">
              {block.quotes.map((quote, i) => (
                <QuoteBubble key={i} quote={quote} variant={variants[i]} index={i} />
              ))}
            </div>
          </BlockBox>
        </>
      )
    }

    case 'chapter-intro': {
      // TWO blocks from one tag, the same shape as `chapter-outro`: the photo
      // band + chapter description, then the skills panel. Rebuilt 2026-09-16
      // from the new Figma template `2609:21746`, which replaced `2584:1053`.
      //
      // ## The skills are two different things now, not one chip list
      // Direct instruction: the SIPTEA components a chapter names render as
      // coloured initial discs; everything else renders as bullet points below
      // a wave rule. The old `SkillChips` flattened both into one row of
      // identical pills, which lost that the first group is the framework being
      // taught and the second is the micro-skills it is practised through.
      //
      // ⚠️ The split is **derived from the authored strings**, not written —
      // see `splitChapterSkills`. Chapters 1/2/3 name three, five and six
      // components respectively, so anything that states a count has to read
      // the data. This is the `PATHWAY_STAGE_COUNT_WORD` rule again; the
      // template's own copy ("all three parts of the SIPTEA framework") is
      // wrong on two of the three chapters for exactly this reason, and is not
      // reproduced.
      const { components, practice } = splitChapterSkills(block.coreSkills)
      // Two columns, filled down the first then the second, which is how the
      // template reads. `ceil` puts the odd one in the left column.
      const half = Math.ceil(practice.length / 2)
      const practiceColumns = [practice.slice(0, half), practice.slice(half)]

      return (
        <>
          {/* `p-0`: the hero card spans the block's own full width in the
              frame, and the description below carries the 40px inset itself. */}
          <BlockBox className="p-0">
            {/* The frame's 16px gap between the hero card and the copy. */}
            <div className="flex flex-col gap-4">
              {/* Rebuilt 2026-09-17 from `Chapter intro block (pair)<new>`
                  (`2654:23230`). Two changes from the 2026-09-16 build, both
                  structural rather than cosmetic:
                  - the wave went **yellow -> purple**, and
                  - the band is now a **rounded 16px card on all four corners**
                    rather than a full-bleed strip with a 4px top radius.

                  The purple is NOT in the export — it is this card's own
                  `bg-primary`, and the photo above it carries a wave-shaped
                  transparent bottom that lets it through. Verified by
                  rasterising the re-export: 189,871 of 1,680,672 pixels
                  (11.3%) are fully transparent. That matters twice over: it is
                  the §3 trap this project has hit on three separate exports
                  (a Figma PNG being RGBA does not make it transparent), and it
                  is what keeps the wave edge and the purple behind it derived
                  from ONE source rather than transcribed twice.

                  The card is aspect-scaled, not fixed at the frame's 360px:
                  the photo occupies 327.92 of that 360, so pinning the height
                  while the in-app card is 880px wide against the frame's 1281
                  would leave a 135px purple skirt where the frame has 32. */}
              <div
                /* `border-art-edge`: the subtle warm brown asked for directly
                   on 2026-09-18 — "can we have some really subtle darker brown
                   so that the cover image does not completely blend in
                   background". It is a border on the card rather than a tone
                   painted into the artwork, for two reasons: it follows the
                   card's own 16px radius (a straight edge drawn inside the
                   image would be cut at the corners), and it leaves the
                   committed art untouched, so "re-do artwork as is" holds. */
                className="relative w-full overflow-hidden rounded-[16px] border border-art-edge bg-primary"
                /* The purple under the wave is a **radial gradient**, not a flat
                   fill (direct instruction, 2026-09-17, matching the module
                   intro card). Committed as an export for the same reason that
                   one is: nine stops and an elongated `gradientTransform`
                   matrix do not survive being eyeballed into a CSS
                   `radial-gradient()`. It is NOT the same file as the module
                   intro's — the two frames carry different matrices and stop
                   offsets (this one centres at 615.89, 592.5, below the card,
                   so the light lavender fans up from the bottom edge), so
                   sharing one asset would silently make one of them wrong.
                   `bg-primary` stays as the base fill: it covers the card
                   before the image loads, and it is the frame's own base. */
                /* ⚠️ The purple wave is GONE — direct instruction, 2026-09-18,
                   annotated on the live page ("the blue wavy vector"). The art
                   now fills the whole card at the frame's own 1281/360, so
                   there is no transparent bottom, no purple skirt and no
                   gradient showing through.

                   Three things followed from removing it, and they move
                   together — changing one alone leaves a visible seam:
                   - the image aspect went 1281/327.92 -> 1281/360 (it is the
                     card now, not a band pinned to its top);
                   - the committed covers are plain RGB, not RGBA — the wave
                     alpha they used to carry is no longer applied at all;
                   - `bg-primary` and the gradient stay only as a pre-load
                     base, and are never seen once the image decodes.

                   `chapter-intro-gradient.svg` and the alpha channel of
                   `chapter-intro-hero.webp` are now unused by this block. They
                   are left in place: the shared hero is still the fallback for
                   any module with no `heroArt`, and that one is masked. */
                style={{ aspectRatio: '1281 / 360' }}
              >
                <img
                  /* Per-chapter hero art where the module supplies one
                     (`heroArt`, a bare kebab-case stem — see the field's own
                     note in `moduleContent.ts` for why it is not a path), and
                     the original shared photo otherwise. The fallback is what
                     keeps every other module rendering exactly as before.

                     The artwork carries its own wave-shaped transparent bottom,
                     taken from THIS asset's alpha channel rather than redrawn,
                     so the wave edge and the purple behind it still come from
                     one source (§78.1). A replacement that is not masked the
                     same way will sit as a hard rectangle over the gradient. */
                  src={`${import.meta.env.BASE_URL}illustrations/module/${block.heroArt ?? 'chapter-intro-hero'}.webp`}
                  alt=""
                  aria-hidden="true"
                  // WebP, not the PNG Figma hands back: 137KB against 2.4MB
                  // for the same pixels.
                  //
                  // `object-cover` rather than a second aspect-ratio: the
                  // committed covers are already cut to 1281/360, and the
                  // shared fallback is 1281/327.92, so cover absorbs that
                  // difference instead of letterboxing the fallback.
                  className="absolute inset-0 block h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-10 p-10 text-center">
                <p className="text-title text-primary">{block.chapterNumber}</p>
                <div className="flex flex-col gap-4">
                  <Heading
                    data-slide-heading={isFirst || undefined}
                    tabIndex={isFirst ? -1 : undefined}
                    className="font-display text-display-md text-balance outline-none"
                  >
                    {block.chapterTitle}
                  </Heading>
                  <p className="text-body text-ink-muted text-balance">{block.whatYouWillLearn}</p>
                </div>
              </div>
            </div>
          </BlockBox>

          {/* The panel IS the second box — `p-0` so its own 40px padding is the
              only inset, rather than sitting 40px inside another 40px. */}
          <BlockBox className="p-0">
            <div className="flex flex-col gap-10 rounded-[16px] bg-yellow-50 p-10">
              <div className="flex flex-col gap-6">
                {/* module.md's own authored line. The template writes its own
                    sentence here; this keeps the authored copy authored. */}
                <p className="text-center text-sub-greeting leading-[1.4] text-ink-muted text-balance">
                  {block.coreSkillsIntro}
                </p>
                {/* `flex-wrap`, not the template's fixed row of three: real
                    chapters carry three, five and six. Same reason the chapter
                    opening's skills are a wrapping list rather than the frame's
                    three circular badges. */}
                {/* Direct instruction: **max three discs per row, then wrap,
                    every row centred.** Both fall out of one width cap rather
                    than a chunked array — the track is exactly three items wide
                    (3x224 + 2x8 = 688), so a fourth cannot fit on a row, and
                    `justify-center` centres whatever a row ends up holding.
                    Chapter 2 names five components, so its second row holds two,
                    centred under the first three. A chunked array would give
                    the same desktop result and then refuse to reflow at all
                    below it, and it would fragment one list into several for a
                    screen reader. */}
                <ul className="mx-auto flex max-w-[688px] flex-wrap items-start justify-center gap-x-2 gap-y-6">
                  {components.map((c) => (
                    <li
                      key={c.raw}
                      className="flex w-[224px] shrink-0 flex-col items-center gap-4 py-4"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-[88px] shrink-0 items-center justify-center rounded-full text-[40px] leading-none font-medium text-white',
                          SIPTEA_BG[c.initial],
                        )}
                      >
                        {c.initial}
                      </span>
                      {/* The disc is decorative: the initial it shows is the
                          first letter of the name directly below it, so
                          announcing both reads "S Shared Understanding". */}
                      <span className="text-title text-ink text-balance">{c.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {practice.length > 0 && (
                <>
                  <WaveDivider tone="brand" />
                  <div className="flex flex-col gap-6">
                    <p className="text-center text-sub-greeting leading-[1.4] text-ink-muted text-balance">
                      {PRACTICE_SKILLS_INTRO}
                    </p>
                    {/* A real two-column grid, not a wrapping flex row.
                        Direct instruction: two parallel columns by default, and
                        a long skill **wraps inside its own column** rather than
                        widening it.

                        `flex-wrap` did the opposite. Chapter 3's "Reflective
                        Listening - Paraphrasing, rephrasing, summarising,
                        checking understanding" is wider than half the panel, so
                        the two columns could not sit side by side and the
                        second dropped below the first — eleven skills reading
                        as one staggered list.

                        `min-w-0` on the container AND the cells is the part
                        that makes wrapping actually happen: grid items default
                        to `min-width: auto`, so the longest label would size
                        its own track instead of wrapping inside it. This
                        project has shipped that bug three times. */}
                    <div className="mx-auto grid w-full min-w-0 grid-cols-2 gap-x-[104px]">
                      {practiceColumns.map((column, i) => (
                        <ul key={i} className="flex min-w-0 flex-col gap-6">
                          {column.map((skill) => (
                            <li key={skill.raw} className="flex min-w-0 items-start gap-3">
                              <img
                                src={`${import.meta.env.BASE_URL}illustrations/module/bullet-square.svg`}
                                alt=""
                                aria-hidden="true"
                                // `mt-1` sits the bullet on the first line's cap
                                // height rather than centring it against a block
                                // that may now be two or three lines tall.
                                className="mt-1 block h-4 w-[19px] shrink-0"
                              />
                              <span className="min-w-0 text-body text-ink">{skill.name}</span>
                            </li>
                          ))}
                        </ul>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </BlockBox>
        </>
      )
    }

    case 'chapter-opening': {
      // Rebuilt 2026-09-16 from the "New opening block" frame (`2594:21641`).
      // Three stacked sections 40px apart: a tinted panel of icon topic cards,
      // the quotes as hand-drawn chat bubbles, and a transition line.
      const variants = pickBubbles(
        block.quotes.length,
        block.quotes.map((q) => q.text),
      )
      // THREE blocks from one tag (direct instruction, 2026-09-16: "in opening
      // block slide, its made up of three individual blocks") — the topic
      // panel, the quotes, and the transition line. Same compound mechanism as
      // `chapter-outro`; see `COMPOUND_BLOCK_TAGS`. Each box supplies its own
      // 40px inset, so the sections below carry none of their own.
      return (
        <>
          {/* Block 1 — `purple-50` panel, radius 16. */}
          <BlockBox className="flex flex-col gap-6 rounded-[16px] bg-purple-50">
            <Heading
              data-slide-heading={isFirst || undefined}
              tabIndex={isFirst ? -1 : undefined}
              className="font-display text-display-md text-balance outline-none"
            >
              {block.keyTopicsIntro}
            </Heading>
            {/* Equal-width cards, not a bullet list. `min-w-0` on the row and
                on every cell: without it one long topic sizes the track instead
                of wrapping inside its own card, which is this project's
                most-repeated horizontal-overflow bug. */}
            <ul className="flex min-w-0 list-none gap-4">
              {block.keyTopics.map((topic) => {
                const TopicGlyph = TOPIC_ICONS[topic.icon]
                return (
                  <li
                    key={topic.text}
                    // Icon top-left, copy under it (direct instruction). `items-start` so the
                    // glyph sits against the card's left edge rather than centring on
                    // the column, and no `justify-center` so a short topic hugs the top
                    // instead of floating in the middle of a card sized by its tallest
                    // sibling.
                    // Recoloured 2026-09-17 to the frame's own three values,
                    // read off `2594:21153` rather than eyeballed from a
                    // render: card `#3a00ad` = `primary`, icon stroke `#FFE299`
                    // = `yellow-200`, label white. The card had been
                    // `purple-200` with a `primary` glyph and `ink-muted` copy
                    // — a light card where the frame draws a dark one, which is
                    // the divergence that was reported ("this is still not
                    // updated"). Measured on the painted pixels: label 11.8:1,
                    // glyph 9.3:1 — both clear.
                    className="flex min-w-0 flex-1 flex-col items-start gap-4 rounded-[8px] bg-primary p-4"
                  >
                    {/* The frame's white 48px square was the placeholder for
                        this glyph, not a tile behind it (direct instruction),
                        so the icon stands on the card's own fill. 32px — the
                        same size the Know How / Know Why eyebrows use, so icon
                        size stays constant across templates rather than
                        tracking whatever box happened to mark the spot. */}
                    <TopicGlyph
                      aria-hidden="true"
                      className="size-8 shrink-0 text-yellow-200"
                      strokeWidth={1.75}
                    />
                    <p className="text-body text-white">{topic.text}</p>
                  </li>
                )
              })}
            </ul>
          </BlockBox>

          {/* Block 2 — the quotes. Centred, wrapping, 24px row / 56px column
              gaps, exactly as the frame lays them out. */}
          <BlockBox className="flex flex-col gap-10">
            <p className="text-center text-sub-greeting leading-[1.4] text-ink-muted">
              {block.quotesIntro}
            </p>
            <div className="flex flex-wrap items-start justify-center gap-x-14 gap-y-6">
              {block.quotes.map((quote, i) => (
                <QuoteBubble key={i} quote={quote} variant={variants[i]} index={i} />
              ))}
            </div>
          </BlockBox>

          {/* Block 3 — the transition line: centred, `title` step in the brand
              colour, on the page's own ground. No white card (direct
              instruction) — the frame drew one and it has been dropped. */}
          <BlockBox>
            <p className="text-center text-title text-primary">{block.transition}</p>
          </BlockBox>
        </>
      )
    }

    case 'text-2':
      return (
        <div>
          <p className="text-body-md text-primary">{block.label}</p>
          <Heading
            data-slide-heading={isFirst || undefined}
            tabIndex={isFirst ? -1 : undefined}
            className="mt-6 font-display text-display-md text-balance outline-none"
          >
            {block.title}
          </Heading>
          <p className="mt-2 text-sub-greeting leading-[1.4] text-ink-muted text-balance">
            {block.subtitle}
          </p>
        </div>
      )

    case 'know-what':
      // The third "Know ..." block (direct instruction, 2026-09-16): a replica
      // of `know-how`, differing only in the eyebrow's glyph and word. Same
      // three deltas from `<Text block_2>` — the icon, the `title`-step label,
      // and a 40px Label -> Title gap in place of 24 — and, like `know-how`, no
      // body: a Know What slide is this intro followed by its own separate
      // framing copy and knowledge video.
      //
      // Before this it rendered as a plain `text-2`, which is why "Know What"
      // read as a smaller, plainer label than the two sections around it while
      // naming the same kind of thing.
      return (
        <div>
          <SectionEyebrow icon={BookOpen} label={block.label} />
          <Heading
            data-slide-heading={isFirst || undefined}
            tabIndex={isFirst ? -1 : undefined}
            className="mt-10 font-display text-display-md text-balance outline-none"
          >
            {block.title}
          </Heading>
          <p className="mt-2 text-sub-greeting leading-[1.4] text-ink-muted text-balance">
            {block.subtitle}
          </p>
        </div>
      )

    case 'know-how':
      // `<Text block_2>` plus the three things that make a "Know ..." block
      // (direct instruction, 2026-09-16): the eyebrow's icon, its `title`-step
      // label, and a 40px Label -> Title gap in place of 24. No body — the
      // scenario video is its own block on the same slide.
      return (
        <div>
          <SectionEyebrow icon={MessagesSquare} label={block.label} />
          <Heading
            data-slide-heading={isFirst || undefined}
            tabIndex={isFirst ? -1 : undefined}
            className="mt-10 font-display text-display-md text-balance outline-none"
          >
            {block.title}
          </Heading>
          <p className="mt-2 text-sub-greeting leading-[1.4] text-ink-muted text-balance">
            {block.subtitle}
          </p>
        </div>
      )

    case 'know-why':
      return (
        <div>
          <SectionEyebrow icon={Lightbulb} label={block.label} />
          <Heading
            data-slide-heading={isFirst || undefined}
            tabIndex={isFirst ? -1 : undefined}
            className="mt-10 font-display text-display-md text-balance outline-none"
          >
            {block.title}
          </Heading>
          <p className="mt-2 text-sub-greeting leading-[1.4] text-ink-muted text-balance">
            {block.subtitle}
          </p>
          {/* 24px below the sub title (direct instruction). The body joins the
              chain here rather than carrying the `body` block's own spacing —
              that block sat in a separate box a 40px gap away. */}
          <p className="mt-6 text-body text-ink-muted">{block.body}</p>
        </div>
      )

    case 'text-3':
      return (
        <div>
          <Heading
            data-slide-heading={isFirst || undefined}
            tabIndex={isFirst ? -1 : undefined}
            className="text-sub-greeting leading-[1.4] text-ink outline-none"
          >
            {block.subtitle}
          </Heading>
          <p className="mt-2 text-body text-ink-muted">{block.body}</p>
        </div>
      )

    case 'accordion-image':
      // Draws its own box (hence `COMPOUND_BLOCK_TAGS`): the frame puts a
      // stroke and a radius on the padded box itself, which a wrapper
      // `BlockBox` would paint outside instead.
      return <AccordionWithImage items={block.items} />

    case 'sub-title':
      // A sub-title alone on a slide is a transition beat: centred, with an
      // icon above it. Mid-slide (the line that introduces a video, or the one
      // that hands off to the next section) it stays a plain italic line —
      // same tag, two jobs, and only the standalone one is a transition.
      if (isOnly) {
        const TransitionGlyph = block.icon ? TRANSITION_ICONS[block.icon] : Footprints
        return (
          <div className="flex flex-col items-center text-center">
            {/* The Consumer Portal's `CardIcon` treatment (direct instruction):
                a bare glyph — no tinted circle, no plate — at `size-10` with
                `strokeWidth={1.75}`, in the portal's own brand colour. The
                first pass used this app's `EmptyState` circle-and-fill, which
                is the wrong register for a full-slide beat.

                The glyph is chosen per slide against that slide's own copy
                (direct instruction: it has to be content-relevant), not one
                fixed mark for every transition — see `TRANSITION_ICONS`. A
                generic arrow would in any case be wrong here: the footer's own
                chevron already says "next". */}
            {/* 40px below the glyph (direct instruction, 2026-09-16, already
                applied in Figma) — was 24. */}
            <TransitionGlyph
              aria-hidden="true"
              strokeWidth={1.75}
              className="mb-10 size-10 text-primary"
            />
            {/* `<Text block _Title>` (`2584:1043`), read from Figma rather than
                guessed: Inter Medium 32/500, letter-spacing -0.374, neutral/
                black. That is exactly this app's `display-md` + `ink`, so it
                maps to existing tokens rather than needing a new step.

                No max-width: the block's own 40px padding already bounds the
                line, and a fixed cap would stop the text using the extra width
                the column gains when the outline rail collapses. */}
            <Heading
              data-slide-heading
              tabIndex={-1}
              className="font-display text-display-md text-ink text-balance outline-none"
            >
              {block.copy}
            </Heading>
          </div>
        )
      }
      return isFirst ? (
        <Heading
          data-slide-heading
          tabIndex={-1}
          className="font-display text-title leading-[1.4] text-balance outline-none"
        >
          {block.copy}
        </Heading>
      ) : (
        // The **Sub title** role — `sub-greeting`, 18/500 — not an italic
        // 16/400 line (direct instruction, 2026-09-17: "same change to
        // subtitle block", following the same move on the block beside it).
        //
        // The italic was carried over from the source, where every Sub title's
        // copy is written in `*asterisks*`. That is an authoring convention for
        // marking the field, not a typographic instruction: the block library
        // defines Sub title as 18/500 with no slant, and the same copy set in
        // italic read as an aside rather than as the section's own sub-line.
        <p className="text-sub-greeting leading-[1.4] text-ink-muted">{block.copy}</p>
      )

    case 'body':
      // The Body role, 16/400 — `<Text block _Body>`'s own step in the block
      // type scale.
      //
      // Module 6 now has NO body block: its one instance (slide 4's "Throughout
      // this program...") was retagged `<Text block _Sub title>` in the source
      // on 2026-09-17, on instruction. The case stays because the tag is still
      // a real part of the block library and a future module may author one.
      return <p className="text-body text-ink-muted">{block.copy}</p>

    case 'video': {
      // One label serves both the placeholder's accessible label and the
      // embed's iframe title, so a video reads the same to a screen reader
      // whether or not its asset exists yet.
      const videoLabel =
        block.variant === 'scenario'
          ? `Scenario video${block.scenario ? `: ${block.scenario}` : ''}`
          : 'Knowledge video'

      // A `<Video block>` is just a video link: given an id it renders the real
      // player, and the placeholder is what a block with no asset yet falls
      // back to. Nothing else in the block is learner-facing — `brief` and
      // `script` are production material for whoever shoots the video.
      return (
        <Card className="overflow-hidden p-3 shadow-none">
          {block.youtubeId ? (
            <YouTubeEmbed source={block.youtubeId} title={videoLabel} />
          ) : (
            <VideoPlaceholder label={videoLabel} />
          )}
        </Card>
      )
    }

    case 'interactive': {
      /**
       * Every interactive block is now a container — a Sub title, 16px, then
       * whatever the interaction is (direct instruction, 2026-09-17). Only the
       * Know What **revision** pattern has a real component so far; the other
       * two keep the bare stub inside the same container, so they gain the
       * shared header rather than a second header of their own.
       *
       * ⚠️ **The authored title is still `<Add copy here>` in module.md** for
       * all three of Module 6's interactive blocks (they are in `CONTENT_FLAGS`
       * for exactly this). Rendering that placeholder string on screen would be
       * worse than a derived label, so an unfilled title falls back to the
       * pattern's own name — the same thing the old stub showed. It is a
       * fallback, not a substitute: the moment a real title is authored it
       * wins.
       */
      const patternLabel =
        block.pattern === 'revision'
          ? 'Know What revision'
          : block.pattern === 'you-might-also-hear'
            ? 'You Might Also Hear'
            : 'Your turn'
      const authored = block.title.trim()
      const title = authored && !authored.startsWith('<') ? authored : patternLabel

      if (block.pattern === 'revision' && block.revision) {
        return (
          // `p-0`: the panel IS the box. Its own 40px inset sits inside the
          // tint, where a wrapper box's would sit outside it and double up —
          // the same reason the chapter intro's skills panel draws its own.
          <BlockBox className="p-0">
            <InteractiveBlock
              title={title}
              titleId={`${block.pattern}-title`}
              isFirst={isFirst}
              // Direct instruction, 2026-09-17: this block gets the `yellow-50`
              // tint. It is the container's call rather than the cards' —
              // exactly what `surface` exists for.
              surface="panel"
            >
              <RevisionFlipCards
                terms={block.revision.terms}
                labelledBy={`${block.pattern}-title`}
              />
            </InteractiveBlock>
          </BlockBox>
        )
      }

      if (block.pattern === 'you-might-also-hear' && block.hearPairs?.length) {
        return (
          // No `surface` here, deliberately: click-to-reveal style 2 gives
          // **each pair** its own `purple-50` panel (direct instruction), so a
          // tint on the container too would be a second surface behind the
          // first.
          <BlockBox>
            <InteractiveBlock
              title={title}
              titleId={`${block.pattern}-title`}
              isFirst={isFirst}
            >
              <HearPairRevealList
                pairs={block.hearPairs}
                labelledBy={`${block.pattern}-title`}
              />
            </InteractiveBlock>
          </BlockBox>
        )
      }

      // Direct instruction, 2026-09-17: *"for logic, refer the module 6 wherever
      // there is MCQ, use this component"*. The gate is the block's own
      // `interactionType` — the one interaction type module.md selects per
      // scenario — not the `your-turn` pattern, because Module 6's Chapter 3
      // carries a Free-text block and a Ranking block that are also `your-turn`
      // and have no component yet. `options` is checked too: an MCQ row with no
      // options would render a question nobody can answer.
      if (
        block.pattern === 'your-turn' &&
        block.interactionType === 'Multiple-choice question' &&
        block.questions?.length &&
        block.questions.every((question) => question.options?.length)
      ) {
        return (
          // A normal `BlockBox` here, **not** revision's `p-0`. Direct
          // instruction, 2026-09-17: *"for mcqs, title goes outside yellow
          // box"*. With the title on the page canvas it needs the box's own
          // 40px inset to line up against, and the tint below it then starts at
          // the same left edge rather than bleeding to the column.
          <BlockBox>
            <InteractiveBlock
              title={title}
              titleId={`${block.pattern}-title`}
              isFirst={isFirst}
              surface="panel"
              surfaceScope="content"
            >
              <YourTurnMcq
                questions={block.questions}
                labelledBy={`${block.pattern}-title`}
              />
            </InteractiveBlock>
          </BlockBox>
        )
      }

      // Direct instruction, 2026-09-17. Same gate as multiple choice, a
      // different interaction type — and **no `surface`**: this pattern draws
      // its own `purple-50` container, so the container's `yellow-50` tint
      // would be a second surface behind the first, exactly as it would be for
      // You Might Also Hear.
      if (
        block.pattern === 'your-turn' &&
        block.interactionType === 'Free-text question' &&
        block.questions?.length
      ) {
        return (
          <BlockBox>
            <InteractiveBlock
              title={title}
              titleId={`${block.pattern}-title`}
              isFirst={isFirst}
            >
              <YourTurnFreeText
                questions={block.questions}
                labelledBy={`${block.pattern}-title`}
              />
            </InteractiveBlock>
          </BlockBox>
        )
      }

      // Ranking. One question per block in Module 6 and one drag exercise per
      // question, so this takes the question rather than the array — a second
      // ranking on the same slide would be two blocks, not a paged set.
      if (
        block.pattern === 'your-turn' &&
        block.interactionType === 'Ranking question' &&
        block.questions?.[0]?.options?.length
      ) {
        return (
          <BlockBox>
            <InteractiveBlock
              title={title}
              titleId={`${block.pattern}-title`}
              isFirst={isFirst}
              // Direct instruction, 2026-09-17: the ranking block sits on
              // `yellow-50`, the container's own tint, with the title above it —
              // the same arrangement multiple choice uses.
              surface="panel"
              surfaceScope="content"
            >
              <YourTurnRanking
                question={block.questions[0]}
                labelledBy={`${block.pattern}-title`}
              />
            </InteractiveBlock>
          </BlockBox>
        )
      }

      return (
        <BlockBox>
          <InteractiveBlock title={title}>
            <InteractivePlaceholder pattern={block.pattern} isFirst={isFirst} />
          </InteractiveBlock>
        </BlockBox>
      )
    }

    case 'chapter-outro':
      // ONE block: the summary band and its copy. The "Coming up next" card
      // used to be this tag's second box; it now lives on the **Module
      // complete** screen, below that screen's own copy (direct instruction,
      // 2026-09-18, once the last slide came into view: "move the upcoming
      // block to below the text block in that slide"). Its two CTAs went with
      // the move — the card says what is next, the player footer acts on it.
      //
      // This case still draws its own `BlockBox` (it needs `pt-0` so the band
      // can bleed to the top edge), which is why `chapter-outro` stays in
      // `COMPOUND_BLOCK_TAGS`.
      return (
        <>
          {/* `pt-0` so the band can reach the top edge of its own box — the
              frame draws it flush, with only the copy beneath it inset. */}
          <BlockBox className="pt-0">
            {/* The band bleeds the box's side padding. `-mx-10` cancels it
                exactly; there is no top padding left to cancel. */}
            {/* Re-pulled 2026-09-17: the template's band changed from a yellow
                wave with a 4px top radius to a **purple** wave inside a
                `rounded-[16px]` frame, and it is now TWO layers, not one —
                a 1281x360 purple-gradient box with a 1281x327.92 image pinned
                to its top. The image's own lower corners are transparent (the
                alpha channel was checked, not assumed), which is what the box's
                purple shows through; painting the strip with a flat colour
                instead would band against the wave's own shading.

                This is NOT the §78.1 "mask and outline transcribed separately"
                trap: the photo and its wave are still one export, exactly as
                before. The gradient is the *backdrop* the export is drawn over,
                and it is transcribed verbatim from the frame rather than
                re-derived, so the two cannot drift. */}
            {/* ⚠️ Streamlined to match the chapter cover, 2026-09-18 (direct
                instruction: *"update the module summary image also, streamline
                it to as done for chapter cover art"*). The same three numbers
                moved together here as there, and they only work as a set:
                  - the image aspect went 1281/327.92 -> 1281/360, so it IS the
                    card rather than a band pinned to its top;
                  - the committed art is plain RGB with no wave alpha;
                  - `OUTRO_BAND_BACKDROP` is gone from this block — with no
                    transparent wave there is nothing for a backdrop gradient to
                    show through, and leaving it would only paint a purple strip
                    behind an opaque image.
                `border-art-edge` is the same warm brown the chapter covers got,
                for the same reason: warm paper on a warm canvas disappears. */}
            <div
              className="-mx-10 overflow-hidden rounded-[16px] border border-art-edge"
              style={{ aspectRatio: '1281 / 360' }}
            >
              <img
                src={`${import.meta.env.BASE_URL}illustrations/module-outro/summary-band.webp`}
                alt=""
                className="block h-full w-full object-cover"
              />
            </div>

            {/* The frame's own two gaps: 16px from the band to the description
                block, then that block's own 40px inset. The box supplies the
                other three sides, so only the top is repeated here. */}
            <div className="mt-4 flex flex-col gap-2 pt-10 text-center">
              <Heading
                data-slide-heading={isFirst || undefined}
                tabIndex={isFirst ? -1 : undefined}
                // `display-md`, not `display-lg`: the template moved the title
                // 40px -> 32/500/-0.374, which is this block library's own
                // "Title" role (see the block type scale), not a one-off size.
                className="font-display text-display-md text-balance outline-none"
              >
                Module summary
              </Heading>
              {/* `text-pretty`, not `text-balance` (direct instruction,
                  2026-09-17: "no orphans, I can see orphan in module summary").
                  The summary runs to six lines, and `text-wrap: balance` is
                  capped at four in every engine that ships it — it was doing
                  nothing here. `pretty` is the rule for a paragraph this long:
                  it leaves the earlier lines alone and only pulls a word down
                  to stop the last line being a single word. */}
              <p className="text-body text-pretty text-ink-muted">{block.moduleSummary}</p>
            </div>
          </BlockBox>

        </>
      )
  }
}

/**
 * The "Coming up next" panel — drawn as the lower half of the updated
 * `<Chapter outro block>` template (`2594:19665`, 2026-09-16), which replaced
 * the old plain card (`2584:1057`).
 *
 * ## The two CTAs
 * Removed on 2026-09-18 and **put back the same day**, once the card landed on
 * the Module complete screen where leaving is the only thing left to do.
 *
 * ## One CTA
 * **"Continue with next module"** opens the module this card names — the
 * destination and the copy both come from `nextModuleFromOutro`, so they
 * cannot disagree.
 *
 * The frame draws a second pill beside it and **it was deleted** on
 * 2026-09-18: whatever it was called, it said the same thing as the player
 * footer's own primary on this step, which is visible at the same time. Its
 * label had already been through "Resume back later" -> "Go back home" ->
 * "Go to my learnings" chasing that footer control; the button was the
 * problem, not the wording.
 *
 * ## The one field module.md does not supply
 * The frame draws **Module number** and **Module name** as two separate
 * slots. The source's outro table has only three rows — Module summary,
 * Coming up next ("Module 7"), Next module copy — so there is no name to
 * transcribe, and the name sits inside the copy line's own first clause
 * ("Retraining the Brain Where to Sleep, we will introduce...").
 *
 * Splitting that string would edit transcribed content, so the name is
 * **derived** from the app's own curriculum instead, keyed by the number the
 * source does give. The two surfaces then cannot disagree about what Module 7
 * is called, which is the failure this project keeps having to undo — and
 * nothing is invented. Renders nothing at all rather than a guess if the
 * number does not resolve.
 *
 * This is the same class of gap as the Chapter intro block's Keywords row and
 * the transition slide's icon: a template field with no authoring column
 * behind it. See workflow §6.1.
 */
export interface OutroActions {
  /** Into the module this card names. */
  onContinueNextModule: () => void
}

/**
 * The module this outro's "Coming up next" row points at.
 *
 * module.md supplies a number and no name, so the record is looked up in the
 * app's own curriculum — and **both the card's copy and the button's
 * destination read this one function**, so the line naming Module 7 and the
 * control that opens it can never point at different modules.
 */
export function nextModuleFromOutro(block: Extract<Block, { tag: 'chapter-outro' }>) {
  const number = Number(block.comingUpNext.match(/\d+/)?.[0])
  return Number.isFinite(number) ? PATHWAY_MODULES_V2[number - 1] : undefined
}

export function ComingUpNextCard({
  block,
  actions,
}: {
  block: Extract<Block, { tag: 'chapter-outro' }>
  actions?: OutroActions
}) {
  const nextModuleName = nextModuleFromOutro(block)?.title

  return (
    <div className="flex flex-col items-center gap-12 rounded-[16px] bg-primary p-10 shadow-card lg:flex-row">
      {/* The pillow mascot, as the frame's own export rather than redrawn.
          Its rotation and skew are the frame's, and they are what stop it
          reading as a flat rectangle. */}
      {/* Sized as a *share* of the card, not the frame's literal 330px. The
          frame is 1281 wide and gives the pillow 329.77 of its 1201px inner
          width — 27.5%. The player's card is 720px at an open rail, where a
          fixed 330px takes 47% and squeezes the module name into three lines
          with the two CTAs stacked. The ratio reproduces the frame's
          composition at whatever width the column actually is. */}
      {/* The pillow now carries cover art for the module COMING UP, not the one
          just finished (direct instruction, 2026-09-18: *"add a cover image to
          the pillow in coming up next, make it module relevant"*). Module 7 is
          "Retraining Your Brain Where to Sleep", so the art is a made bed with a
          head resting just above its pillow and a light arc joining the two —
          stimulus control, the bed and sleep learning to belong together.

          ⚠️ **The silhouette is `PILLOW_SHAPES[0]`, not a transcription.** The
          committed `pillow.svg` turned out to carry the *same path data* as
          `card-pillow-1` — verified character-for-character — differing only in
          viewBox inset and in having no stroke. So it reuses the flip cards'
          own source rather than introducing a second copy of one shape, which
          is the §78.1 rule: one path, rendered twice in one inline SVG (cream
          fill, then the clipped art). No stroke here, because this pillow has
          never had one.

          `viewBox` is this asset's own `0 0 324.265 248.48` — `card-pillow-1`'s
          `-3 -3 330.265 254.48` exists only to give its 6px stroke room, and
          borrowing it would inset the art by 3px for no reason. */}
      <svg
        viewBox="0 0 324.265 248.48"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        className="w-[60%] max-w-[330px] shrink-0 rotate-[-2.14deg] skew-x-[-0.82deg] lg:w-[27.5%]"
      >
        <defs>
          <clipPath id="outro-pillow-clip">
            <path d={PILLOW_SHAPES[0].d} />
          </clipPath>
        </defs>
        <path d={PILLOW_SHAPES[0].d} fill="#FBF5E6" />
        <image
          href={`${import.meta.env.BASE_URL}illustrations/module-outro/coming-up-next.webp`}
          x={-324.265 * 0.06}
          y={-248.48 * 0.06}
          width={324.265 * 1.12}
          height={248.48 * 1.12}
          /* `meet` + the same 1.12 the flip cards use, for the same reason: the
             source is square and the pillow is wider than tall, so `slice`
             would cut the bed's head and foot off. */
          preserveAspectRatio="xMidYMid meet"
          clipPath="url(#outro-pillow-clip)"
        />
      </svg>

      <div className="flex min-w-0 flex-1 flex-col gap-12">
        <div className="flex min-w-0 flex-col gap-6 text-white">
          <h3 className="text-sub-greeting">Coming up next</h3>
          <div className="flex flex-col gap-4">
            {/* One line, not the two the template carried until 2026-09-16 —
                the separate Module number (16/600) and Module name (32/500)
                rows collapsed into a single `Module <>: ` slot at 18/500. The
                template's trailing colon is what carries the name, so the two
                are joined here rather than the name being dropped: a line
                reading "Module 7:" with nothing after it is broken copy. */}
            <p className="text-sub-greeting">
              {nextModuleName ? `${block.comingUpNext}: ${nextModuleName}` : block.comingUpNext}
            </p>
            <p className="text-body">{block.nextModuleCopy}</p>
          </div>
        </div>

        {/* ONE button, not the frame's pair. Its "Go to my learnings" sibling
            was deleted on 2026-09-18 — *"get rid of this button, its
            repetitive"* — because the player footer's primary on this step
            already carries that exact label and destination, a few hundred
            pixels below it.

            It hugs its label rather than keeping the frame's `flex-1` — that
            was how two pills split a 624px row, and one button stretched to
            624px is a banner, not a button.

            The treatment is this card's own inverted style: filled
            `bg-primary` would be invisible on a `primary` card, and
            `text-caption-medium` is the app's button step app-wide, a
            deliberate divergence from the frame's 16/600 per the standing
            "the frame decides where a button goes and what it says, the app
            decides how it looks" rule. */}
        <div className="flex items-center gap-4">
          {/* Not the footer's "Back to your modules" (direct instruction,
              2026-09-18, annotated on this exact button): inside a card whose
              whole job is to name Module 7, the primary control carries you
              into Module 7. The footer keeps its own label and its own move. */}
          <OutroButton
            onClick={actions?.onContinueNextModule}
            className="bg-white text-primary hover:bg-purple-50"
          >
            Continue with next module
          </OutroButton>
        </div>
      </div>
    </div>
  )
}

