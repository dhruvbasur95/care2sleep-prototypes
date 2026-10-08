import { Download } from 'lucide-react'

/** Kept beside the page that jumps to it — see `scrollToResourceCard`. */
export const RESOURCE_CARD_ID = 'module-resource-card'
import {
  RESOURCE_BLOB_BACKDROP_FILL,
  RESOURCE_BLOB_BACKDROP_PATH,
  RESOURCE_BLOB_H,
  RESOURCE_BLOB_PATH,
  RESOURCE_BLOB_STROKE,
  RESOURCE_BLOB_STROKE_W,
  RESOURCE_BLOB_W,
} from '@/components/consumer/resourceBlobFrame'

/**
 * The take-home resource card, below a module's summary cards.
 * Frame `940:5497` ("Resource download card"), Round 48.
 *
 * ── THE COPY IS THE MODULE'S, NOT THE FRAME'S ─────────────────────────────
 *
 * Direct instruction: "This is for reference only, copy is something you need
 * to work on." The frame's own bullets — breathing exercises, a calming sleep
 * environment, a daily routine checklist — describe a different module. None of
 * the three appears anywhere in this one, whose actual content is a regular
 * wake time, resting without spending your sleep hunger, and waiting until you
 * are sleepy rather than merely tired. Shipping the frame's list would have
 * promised a guide to something the person had not just watched.
 *
 * So the three bullets are the module's own three chapters, written in the
 * words the module used, and the heading pair says what the thing is and what
 * is in it. Source: `BuildingBlocksOfGoodSleep_activities_v2.md` (chapter
 * summary cards) and `..._step4_script.docx.md` (the Close, "the whole day in
 * four lines").
 *
 * Written for this portal's stated audience — people living with dementia and
 * their carers — so: short sentences, one idea each, no metaphor that has to be
 * unpacked ("sleep hunger" is the module's own term and is deliberately not
 * introduced cold here), and the download says plainly what it will do before
 * it is pressed rather than after.
 */

/* ── Artwork geometry ─────────────────────────────────────────────────────
 *
 * Every number is the frame's own, expressed as a share of the artwork box so
 * the whole illustration scales with the card instead of overflowing a narrow
 * one. Frame `941:5856` rotates the assembled artwork 4.45deg, and its 391.17 x
 * 304.759 container is the *rotated bounding box* of a 370.81 x 276.83 inner
 * box — which checks out: 370.81·cos4.45 + 276.83·sin4.45 = 391.2, and
 * 370.81·sin4.45 + 276.83·cos4.45 = 304.8. So the inner box is what the pieces
 * are positioned in, and the outer one only reserves room for the rotation.
 */
const ART_W = 370.81
const ART_H = 276.83
const pctX = (v: number) => `${((v / ART_W) * 100).toFixed(3)}%`
const pctY = (v: number) => `${((v / ART_H) * 100).toFixed(3)}%`

/** A sticker's wrapper is its *rotated* bounding box, so the vector inside is
 *  centred at its own size and then turned — the frame's own construction. */
function Sticker({
  src,
  left,
  top,
  boxW,
  boxH,
  vectorW,
  rotate,
}: {
  src: string
  left: number
  top: number
  boxW: number
  boxH: number
  vectorW: number
  rotate: number
}) {
  return (
    <span
      aria-hidden="true"
      className="absolute flex items-center justify-center"
      style={{ left: pctX(left), top: pctY(top), width: pctX(boxW), height: pctY(boxH) }}
    >
      <img
        src={src}
        alt=""
        className="block max-w-none"
        style={{ width: `${((vectorW / boxW) * 100).toFixed(2)}%`, transform: `rotate(${rotate}deg)` }}
      />
    </span>
  )
}

function ResourceArtwork() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full shrink-0 min-[900px]:w-[391px]"
      style={{ aspectRatio: '391.17 / 304.759' }}
    >
      {/* The inner box, rotated as one piece — see the geometry note above. */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          width: `${((ART_W / 391.17) * 100).toFixed(3)}%`,
          height: `${((ART_H / 304.759) * 100).toFixed(3)}%`,
          transform: 'translate(-50%, -50%) rotate(4.45deg)',
        }}
      >
        {/* Frame `941:5857` — the offset blob behind, `yellow-400`. Its own
            shape and its own 3.35deg, and nothing is registered against it. */}
        <span
          className="absolute flex items-center justify-center"
          style={{ left: pctX(3.23), top: 0, width: pctX(338.259), height: pctY(274.896) }}
        >
          <svg
            viewBox={`0 0 ${RESOURCE_BLOB_W} ${RESOURCE_BLOB_H}`}
            className="block h-auto w-[95.74%]"
            style={{ transform: 'rotate(3.35deg)' }}
            fill="none"
          >
            <path d={RESOURCE_BLOB_BACKDROP_PATH} fill={RESOURCE_BLOB_BACKDROP_FILL} />
          </svg>
        </span>

        {/*
          ⚠️ **The photo and its frame are ONE path, rendered twice.**

          Figma exports the mask at 320.278 x 245.993 and the outline at
          323.845 x 256.432 — different shapes, positioned relative to each
          other by two hand-transcribed offsets (the frame puts the photo card
          at ml 4.55 and the outline at ml 15.48). Transcribing both is how this
          project has shipped a photograph sitting outside its own frame three
          separate times. Here the outline path is the `clipPath` *and* the
          stroke, in one SVG, so they cannot drift at any size.

          `preserveAspectRatio="xMidYMid slice"` is the SVG equivalent of
          `object-cover`: the source is a 800 x 1200 portrait and this box is
          landscape, so it crops rather than squashing.
        */}
        <svg
          viewBox={`0 0 ${RESOURCE_BLOB_W} ${RESOURCE_BLOB_H}`}
          className="absolute"
          style={{
            left: pctX(15.48),
            top: pctY(14.45),
            width: pctX(323.845),
            height: pctY(256.432),
          }}
          fill="none"
        >
          <defs>
            <clipPath id="resource-blob-clip">
              <path d={RESOURCE_BLOB_PATH} />
            </clipPath>
          </defs>
          <image
            href="/illustrations/consumer-resource/guide-photo.jpg"
            x="0"
            y="0"
            width={RESOURCE_BLOB_W}
            height={RESOURCE_BLOB_H}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#resource-blob-clip)"
          />
          <path
            d={RESOURCE_BLOB_PATH}
            fill="none"
            stroke={RESOURCE_BLOB_STROKE}
            strokeWidth={RESOURCE_BLOB_STROKE_W}
          />
        </svg>

        {/* Frames `941:5863`, `941:5868`, `941:5876`, `941:5879` — the frame's
            own exported vectors, committed rather than redrawn. */}
        <Sticker
          src="/illustrations/consumer-resource/sticker-s3.svg"
          left={47.65}
          top={3.75}
          boxW={74.708}
          boxH={56.527}
          vectorW={70.882}
          rotate={4.55}
        />
        <Sticker
          src="/illustrations/consumer-resource/sticker-s1.svg"
          left={281.17}
          top={48.73}
          boxW={89.64}
          boxH={81.895}
          vectorW={79.165}
          rotate={-9.55}
        />
        <Sticker
          src="/illustrations/consumer-resource/sticker-s2.svg"
          left={0}
          top={205.48}
          boxW={78.179}
          boxH={71.346}
          vectorW={69.7}
          rotate={-8.67}
        />
        <Sticker
          src="/illustrations/consumer-resource/sparkle.svg"
          left={273.77}
          top={240.94}
          boxW={31.675}
          boxH={31.675}
          vectorW={29.434}
          rotate={4.55}
        />
      </div>
    </div>
  )
}

/** The module's own three strategies, in the module's own words. */
const GUIDE_POINTS = [
  'Getting up at about the same time each day',
  'Resting in the afternoon without losing sleep for the night',
  'Telling sleepy apart from tired, so you go to bed at the right time',
]

export function ResourceCard() {
  return (
    /* `id` + `tabIndex={-1}` so the summary copy above can jump here and land
       focus on the card, not just scroll the page under the reader. See
       `scrollToResourceCard`. */
    <section
      id={RESOURCE_CARD_ID}
      tabIndex={-1}
      className="flex flex-col items-center gap-8 rounded-lg border border-parchment bg-yellow-100 p-6 shadow-card outline-none focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 min-[900px]:flex-row min-[900px]:gap-12 min-[900px]:p-10"
      aria-labelledby="resource-card-title"
    >
      <ResourceArtwork />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 id="resource-card-title" className="text-consumer-card-title text-balance text-ink-muted">
            Your sleep guide
          </h3>
          <p className="text-consumer-eyebrow text-balance text-ink-muted">
            The three things from this module, on one page you can keep.
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {GUIDE_POINTS.map((point) => (
            <li key={point} className="flex gap-3">
              {/* A dot, not a glyph — the same CSS bullet the summary cards use,
                  so the two lists read as one system. */}
              <span
                aria-hidden="true"
                className="mt-[8px] size-1.5 shrink-0 rounded-full bg-consumer-primary"
              />
              <span className="text-consumer-eyebrow min-w-0 flex-1 text-ink-muted">{point}</span>
            </li>
          ))}
        </ul>

        {/* Says what pressing it will do, before it is pressed. For a reader who
            is unsure what a download is, "opens" and "print" are the concrete
            parts, not the file size or the format on its own. */}
        <p className="text-consumer-body-strong text-balance text-ink-muted">
          It is a PDF. Read it at your own pace, or print it to keep.
        </p>

        {/* The flip cards' own download control, moved here whole — direct
            instruction: "Re-use the download button card as used in flip to see
            cards, only update the copy". Still the project's standing treatment
            for a control a frame draws but nothing has wired: real, focusable,
            and honest about it rather than silently dead. `max-w-96` is the
            frame's own 384px. */}
        <button
          type="button"
          aria-disabled="true"
          className="flex h-12 w-full max-w-96 items-center justify-center gap-2 rounded-[28px] bg-consumer-primary px-5 text-body-md text-white outline-none focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2"
        >
          <Download aria-hidden="true" strokeWidth={2.25} className="size-5 shrink-0" />
          Download the guide
          <span className="sr-only"> (coming soon)</span>
        </button>
      </div>
    </section>
  )
}
