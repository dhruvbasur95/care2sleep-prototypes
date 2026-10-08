import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleEpisode, TranscriptLine } from '@/data/consumerLessonContent'

/**
 * The episode panel — the large box on the module's video screen, in its three
 * follow-along modes.
 *
 * Frames: `918:4307` (video), `920:1087` (audio), `920:1110` (transcript). All
 * three draw the same 783 x 440.495 box at an 8px radius with the same still
 * behind them, and differ only in what is laid over it. That is why this is one
 * component with a `mode` rather than three: the still, the radius, the clip and
 * the aspect are the constant, and treating them as three panels would let them
 * drift the first time one of the three is touched.
 *
 * ── The aspect is the frame's, and it already matched ─────────────────────
 *
 * 783 / 440.495 = 1.7776; the box this replaces was `aspect-[855/481]` =
 * 1.7775. The same ratio to four decimal places, so the existing class stays
 * and the box keeps scaling with the column rather than being pinned at 783.
 *
 * ── Everything inside is a percentage of the box, not a pixel ─────────────
 *
 * Because the box is fluid, every inset the frames give in px is stored here as
 * its share of 783 x 440.495 (`PCT` below). Transcribing 31px / 511px / 216px
 * literally would be correct at exactly 1281px of viewport and wrong at every
 * other width — the trap §85.1 already names. Type cannot scale that way and is
 * left in px.
 */

/** The frames' own still (`985ff728…png`), resampled 2731x4096 / 9.0MB ->
 *  933x1400 / 220KB. Round 30's onboarding photo set the precedent and the
 *  ratio: a portrait source rendered `object-cover` never needs its full
 *  height, and 933 is still 1.2x the 783 box at its widest. */
const STILL = '/illustrations/consumer-lesson/episode-still.jpg'

/** Frame widths as shares of the 783 x 440.495 box. Named rather than inlined
 *  so the arithmetic is auditable against the frame. */
const PCT = {
  /** 216 / 783 — the audio screen's album art. */
  audioArt: 27.586,
  /** 271 / 783 — how far right of centre the transcript's art column sits. */
  artOffsetX: 34.61,
  /** 6.74 / 440.495 — and how far above it. */
  artOffsetY: 1.53,
  /** 193 / 783 — the width of that column. */
  artColumn: 24.649,
  /** 136 / 193 — the art inside it. */
  artInColumn: 70.466,
} as const

/** The transcript sheet's own share of the box is expressed in its className
 *  instead, because it has to change at a breakpoint. Listing it here as well
 *  would be one fact in two places, which is the drift this file's own
 *  `chapterId` note is about. */

/**
 * The purple veil the audio and transcript screens share.
 *
 * `rgba(32,0,97,0.85)` over a 6px backdrop blur, both the frames' own. Worth
 * saying what it is NOT: it is not `consumer-primary` at 85%, which would paint
 * a visibly bluer purple — `#200061` is a darker, redder violet the palette has
 * no step for, and it is doing a specific job here (holding white text and a
 * `purple-50` panel legible over an arbitrary photograph) rather than carrying
 * brand colour. Kept as the frame's literal for that reason.
 */
const VEIL = 'absolute inset-0 bg-[rgba(32,0,97,0.85)] backdrop-blur-[6px]'

/**
 * The album art card, at whichever of its two sizes.
 *
 * One component, because the two frames draw the SAME card at two scales:
 * every number in the transcript version is the audio version times 0.6296
 * (136/216, 10.074/16, 0.63/1, 5.037/8, 20.148/32 — all within 0.001). So the
 * scale is the single input and the rest is derived, which is this project's
 * standing fix for a pair of transcribed geometries drifting apart (§78.1).
 */
function AlbumArt({ widthPct, scale }: { widthPct: number; scale: number }) {
  return (
    <div
      className="relative aspect-square shrink-0 overflow-hidden border-parchment"
      style={{
        width: `${widthPct}%`,
        borderRadius: 16 * scale,
        borderWidth: Math.max(1 * scale, 0.5),
        boxShadow: `${8 * scale}px ${8 * scale}px ${32 * scale}px 0 rgba(0,0,0,0.65)`,
      }}
    >
      <img src={STILL} alt="" aria-hidden="true" className="size-full object-cover" />
    </div>
  )
}

/** `==marked==` -> the frame's highlighter. The same deliberately tiny parser
 *  as `withBold` in `ModuleSummaryCards`, and deliberately not a markdown
 *  dependency, for the reason documented there. */
function withMark(text: string) {
  return text.split(/(==[^=]+==)/g).map((part, i) =>
    part.startsWith('==') && part.endsWith('==') ? (
      /* `yellow-400` `#ffb600`, not the frame's `#ffb846`. The ramp's nearest
         step is one channel off in blue and reads identically as a highlighter,
         and the standing rule prefers a real token over a fourth one-off yellow
         that exists nowhere else in four portals. `ink` on it rasterises at
         9.90:1 — measured through a 1x1 canvas, not computed from the hex,
         because Tailwind v4 emits `oklab()` and parsing that as RGB returns
         nonsense (§75's standing trap). `box-decoration-clone` so a phrase wrapping across two lines
         gets the radius on both halves rather than one long ragged band. */
      <mark
        key={i}
        /* `font-semibold` on the marked run — direct instruction, "any part
           that is getting highlighted, make it bold". 600, not 700: this
           portal's scale is capped at 600 (nothing heavier, standing rule), and
           the speaker roles beside it are already 600, so a 700 playhead would
           be the only thing on the surface breaking that ceiling. */
        className="box-decoration-clone rounded-xs bg-yellow-400 px-0.5 font-semibold text-ink"
      >
        {part.slice(2, -2)}
      </mark>
    ) : (
      part
    ),
  )
}

/** The feather gradient, in the sheet's own `purple-50`. One function so the
 *  top and bottom edges cannot drift to different curves — they are the same
 *  fade pointing opposite ways, and writing the stops twice is how that stops
 *  being true. */
function feather(direction: 'to top' | 'to bottom') {
  return (
    `linear-gradient(${direction}, ` +
    'rgba(243,239,255,0) 0%, ' +
    'rgba(243,239,255,0.28) 35%, ' +
    'rgba(243,239,255,0.62) 60%, ' +
    'rgba(243,239,255,0.92) 82%, ' +
    'rgba(243,239,255,1) 100%)'
  )
}

/**
 * One transcript row.
 *
 * The frame absolutely-positions each line inside a fixed-height `Content` box
 * (48px for a two-line quote, 24px for a one-liner). That is Figma describing
 * the result of its own text layout, not a spec — real copy of a different
 * length would overflow a hardcoded 48px silently. So the row is flow layout at
 * the frame's own `line-height: 24px`, which reproduces those heights exactly
 * for the lines that wrap the same way and grows honestly for the ones that do
 * not.
 */
function TranscriptRow({ line }: { line: TranscriptLine }) {
  return (
    /*
      The speaker is plain bold text above its line, not a chip — direct
      instruction, "instead of using labels, just use text instead of labels,
      make their roles bold".

      That retires the whole badge system this row carried three instructions
      ago: the fixed 76px width, the per-speaker fills, and the `items-start`
      that stopped a chip stretching into a container. None of it has anything
      to hold now, and the copy left-aligns with the role for free because both
      are block-level children of the same column.
    */
    <li className="py-3.5">
      {/*
        One size for every line, the size the spoken one used — direct
        instruction, "use same copy font as used for the one speaking".

        **24px / 36px**, raised in two steps on direct instruction — 18/28 ->
        21/32 ("further increase transcript font size") -> 24/36 ("use one size
        bigger font"). Line height moves with the type every time rather than
        being left behind: 18/28 is a 1.56 ratio, and holding the leading fixed
        while the size grows would tighten a multi-line quote to 1.17, which is
        where long-form copy stops being readable. 24/36 keeps 1.50.

        Worth noting against this portal's own scale: 24px is above every
        consumer body step this app has (`consumer-eyebrow` tops out at 18,
        `consumer-lead` at 20) and level with `consumer-card-title`'s 22-28
        clamp — so this copy now reads at heading size. It is a literal rather
        than a token, which is defensible for the one surface where the reader
        is doing sustained reading and where the audience note argues for size.
        If a second surface ever wants it, it should become a real step rather
        than a second literal.

        ⚠️ This **retires the size-based focus state** asked for earlier
        ("if narrator is speaking their chunk of text size is bigger"). The two
        cannot both be true: uniform copy is uniform.

        The `active` flag and the `activeIndex` that fed it are deleted with it
        rather than left threaded through unused — a prop nothing reads is a
        prop that will be wrong by the time something reads it again. What still
        marks the live line is the playhead highlight, which is the thing
        actually tracking the audio, and it is derived inside `withMark` from
        the copy itself. A future focus cue would recompute the index the same
        way `TranscriptSheet` used to, in one line.
      */}
      <p className="text-consumer-transcript text-ink">
        {/*
          `<strong>`, not a styled span: the role genuinely is stronger
          importance in a transcript, and it is the only thing telling a screen
          reader where one speaker ends and the next begins now that the chip is
          gone. A `font-bold` span would look identical and say nothing.

          The four speaker colours went with the chips. They were FILL colours,
          and two of them do not survive becoming text on this `purple-50`
          sheet — measured, #589F46 is 2.88:1 and #ffb600 is 1.56:1, both far
          under the 4.5:1 body text needs. So the roles are `ink` like the copy.
          Colouring them again means picking darker variants, which is a palette
          decision rather than one to guess at.
        */}
        <strong className="font-semibold">{line.speaker}</strong>
        <br />
        {withMark(line.text)}
      </p>
    </li>
  )
}

/**
 * The transcript sheet.
 *
 * `overflow-y-auto` where the frame has `overflow-clip`: the frame's own last
 * row is cut off mid-sentence at its 393px, which is a designer showing that
 * the list continues, not asking for copy to be unreachable. A scroll container
 * needs a tab stop to be operable by keyboard — the exact WCAG 2.1.1 failure
 * Round 20 found on the sleep-diary grid — hence `tabIndex={0}` and a real
 * accessible name.
 */
function TranscriptSheet({
  lines,
  className,
  style,
}: {
  lines: TranscriptLine[]
  className?: string
  style?: React.CSSProperties
}) {

  return (
    /*
      Three layers, and the split is the point.

      The FIRST pass faded the sheet itself with a `mask-image`, which is what
      the screenshot showed going wrong: a mask fades everything the element
      paints, so the card's own fill, its rounded bottom corners and its shadow
      dissolved along with the words and the blurred photograph came through the
      middle of the panel. Direct instruction: "use feather effect, add another
      layer, do not alter parent container."

      So this outer box owns the sheet's appearance — fill, radius, shadow, and
      the geometry passed in via `className` — and never fades. The scroller
      sits inside it at `inset-0`, and the feather is a third element on top of
      both. The card stays a crisp card; only the text under the gradient goes
      soft.
    */
    <div
      className={cn(
        /* The frame sets an opaque `#f3efff` AND a 6px backdrop blur. A
           backdrop filter behind an opaque fill can have no effect, so only the
           fill is carried — the blur is not dropped as a judgement call, it is
           a no-op either way and carrying it would imply a translucency this
           panel does not have. */
        'relative overflow-hidden rounded-sm bg-purple-50',
        className,
      )}
      style={{ boxShadow: '8px 8px 24px 8px rgba(0,0,0,0.25)', ...style }}
    >
      <div
        tabIndex={0}
        role="region"
        aria-label="Episode transcript"
        /* 24px sides, up from the frame's 16 — direct instruction. `pt-8` on
           top of that (direct instruction, "increase top padding"): the top
           feather now fades the first ~22% of the sheet, so without extra room
           above it the first line would start life already half-faded rather
           than crisp. The two numbers are related and should move together. */
        className="absolute inset-0 overflow-y-auto px-6 pt-8 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-consumer-primary"
      >
        {/* No rules between rows — the frame separates them by the 14px of
            padding each carries and nothing else. */}
        <ul>
          {lines.map((line, i) => (
            <TranscriptRow key={i} line={line} />
          ))}
        </ul>
      </div>

      {/*
        The feather, top and bottom.

        Bottom was there first; the top one is a direct instruction, "add
        feather effect top down also, so that the transcript fades away". Two
        edges rather than one changes what the panel reads as: with only a
        bottom fade the list looked like it ENDED softly, and with both it reads
        as a window onto something continuous that runs past the frame in both
        directions — which is what a transcript scrolling under a playhead
        actually is.

        Painted in the sheet's OWN `purple-50`, not in the purple veil behind
        it, which is what keeps the card opaque — the text dissolves into the
        card rather than a hole opening onto the photograph.

        Five stops rather than two, and that is what makes it a feather instead
        of a ramp: a plain `transparent -> solid` linear gradient is linear in
        alpha, and the eye reads its start as a visible edge. These stops
        approximate an ease-in curve so the fade begins imperceptibly and only
        commits near the edge.

        The bottom was strengthened on direct instruction ("increase feather
        effect slightly") and both knobs moved together, because moving only one
        changes the wrong thing: the layer went from half the sheet to 62%, so
        it STARTS earlier, and the curve moved up at every stop (0.15 -> 0.28,
        0.45 -> 0.62, 0.8 -> 0.92) so it is also DENSER at the same relative
        depth. Taller alone would only have pushed a soft edge further up;
        steeper alone would have made the bottom opaque sooner and read as a
        band again.

        The top is deliberately shallow — **14% against 62%**, and it is not to
        be extended (direct instruction, "but for top, do not extend the feather
        effect"). They are not symmetrical because the two edges are not doing
        the same job: the bottom hides what is coming and wants depth, the top
        only needs to soften a line sliding out of view. A deep top fade would
        eat the first line of a transcript nobody has scrolled yet, which is the
        one line most likely to be the one being spoken.

        Both edges still share `feather()`, so the CURVE is identical and only
        the depth differs. That is the part worth keeping if these are ever
        retuned again: two different curves would read as two different
        materials.

        ⚠️ Paint, not concealment — the same standing rule as animated
        `height: 0` (§50). The rows underneath stay scrollable, focusable and in
        the accessibility tree; `pointer-events-none` is what stops these layers
        swallowing the scroll they sit over, and `aria-hidden` keeps two purely
        decorative boxes out of the tree.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[14%]"
        style={{ backgroundImage: feather('to top') }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
        style={{ backgroundImage: feather('to bottom') }}
      />
    </div>
  )
}

export type FollowMode = 'video' | 'audio' | 'transcript'

export function EpisodePanel({
  mode,
  episode,
  title,
}: {
  mode: FollowMode
  episode: ModuleEpisode
  /** The module's own name — the two overlay screens label the art with it.
   *  Passed in rather than read off `episode.title`, which is the episode's
   *  question ("Why does sleep feel impossible…"); the frames print "Daytime
   *  habits that support sleep", which is the module. */
  title: string
}) {
  return (
    <div
      className={cn(
        'relative min-w-0 flex-1 overflow-hidden rounded-sm bg-ink',
        /*
          The frames' 16:9 everywhere EXCEPT transcript below 1200, where it is
          measured as unreadable rather than merely tight: at 375 the column is
          327 wide, so the box is 184 tall and the sheet inside it 295 x 152 —
          about two lines of 15px copy at a time. This portal's audience note is
          the reason that is not a trade worth making. So the box grows to a
          real reading height there and takes the frames' ratio back at 1200,
          where the frames' own side-by-side layout begins.
        */
        mode === 'transcript'
          ? 'min-h-[420px] min-[1200px]:aspect-[855/481] min-[1200px]:min-h-0'
          : 'aspect-[855/481]',
      )}
    >
      <img
        src={STILL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />

      {mode === 'video' && (
        <>
          {/* The frame's own 50% black. It is what makes a white play control
              legible over a photograph nobody has chosen yet. */}
          <div className="absolute inset-0 bg-black/50" />
          <button
            type="button"
            aria-disabled
            className="absolute left-1/2 top-1/2 flex size-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-white/20 outline-none backdrop-blur-[2px] transition-colors hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white"
          >
            {/* lucide, not the frame's exported `Frame 326` vector — the
                standing rule, and a play triangle is the case the rule was
                written for. `fill` as well as stroke, because at 56px an
                outlined triangle reads as an outline rather than a button. */}
            <Play aria-hidden="true" className="size-14 translate-x-1 fill-white text-white" />
            <span className="sr-only">Play the video (coming soon)</span>
          </button>
        </>
      )}

      {mode === 'audio' && (
        <>
          <div className={VEIL} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
            <AlbumArt widthPct={PCT.audioArt} scale={1} />
            {/* `consumer-card-title` is 28/500 at desktop, which is the frame's
                own size and weight; only its line height differs (`normal`
                against the frame's 1.4), so that one value is set here rather
                than minting a second 28px step for a two-line title. */}
            <p className="text-consumer-card-title max-w-[80%] text-balance text-center leading-[1.4] text-white">
              {title}
            </p>
          </div>
        </>
      )}

      {mode === 'transcript' && (
        <>
          <div className={VEIL} />
          {/*
            Below 1200 the row above this has already stacked, so the box is the
            full content column — 327px at 375. The frame's side-by-side
            (a 65%-wide sheet beside a 17%-wide art column) puts 15px type in a
            213px sheet there, which is not a reading column. So under 1200 the
            art is dropped and the sheet takes the whole box: the art is a label
            for audio that happens to be decorative here, and the transcript is
            the content. No frame covers this — derived and measured.
          */}
          <TranscriptSheet
            lines={episode.transcript}
            /* Frame `918:4496`: x 31, y 28.51, 511 x 393 of the 783 x 440.495
               box. Written as named-breakpoint arbitrary *values*, never
               arbitrary properties — §89's trap is the latter, which silently
               emits no rule under stacked variants. */
            className="absolute inset-4 min-[1200px]:inset-auto min-[1200px]:left-[3.959%] min-[1200px]:top-[6.472%] min-[1200px]:h-[89.218%] min-[1200px]:w-[65.262%]"
          />
          <div className="hidden min-[1200px]:contents">
            <div
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4"
              style={{
                left: `calc(50% + ${PCT.artOffsetX}%)`,
                top: `calc(50% - ${PCT.artOffsetY}%)`,
                width: `${PCT.artColumn}%`,
              }}
            >
              <AlbumArt widthPct={PCT.artInColumn} scale={136 / 216} />
              <p className="text-consumer-eyebrow text-balance text-center text-white">{title}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
