/**
 * The three glyphs inside the login screen's user-type tiles (`LoginPage`).
 *
 * ── Why these are inline SVG and not `lucide-react` imports ───────────────
 *
 * The app's standing rule is lucide, always, never a hand-written `<svg>`.
 * **Every path below is lucide's own data, copied verbatim** from
 * `lucide-react@1.25.0` — `HeartHandshake`, `UserRound`, `MessageCircle` and
 * `ShieldUser`. Nothing here is drawn, traced or invented, and a lucide
 * upgrade is re-pasted, never redrawn.
 *
 * They are inlined for one reason: **a lucide React component has no
 * addressable parts.** It renders a flat list of children, so there is no
 * handle on "the shield" as distinct from "the person inside it", and these
 * glyphs animate their parts independently on hover. That is the same reason
 * `SummaryBannerArt` and `Doodles` are inline components rather than `<img>`
 * tags, and the same rule: if an illustration might ever animate one layer
 * while another holds still, it has to be inline.
 *
 * ── These are EXCEPTIONS, not the icon package ───────────────────────────
 *
 * Direct instruction, 2026-10-12: *"lets not consider this as part of our icon
 * package, these are exceptions"*. So:
 *
 *   - **96px glyph, 5px painted stroke** (direct instruction) — which is a
 *     `strokeWidth` of 1.25 on lucide's 24-unit grid, because 96 / 24 = 4.
 *     The app's own convention elsewhere is 2.25 (156 call sites) and 1.75
 *     (90). Neither is wrong; they are different things. **Do not "correct"
 *     these back to the house stroke**, and do not copy 1.25 onto anything
 *     else — at a normal 16-24px icon it would render as a hairline.
 *   - The composed coach glyph is **not** a lucide icon and must not be added
 *     to the Figma icon library as a master.
 *
 * ── The coach glyph is two lucide icons, placed ───────────────────────────
 *
 * Lucide has no single glyph that is a person *and* a speech bubble, and the
 * brief was explicit about wanting both. So `UserRound` and `MessageCircle`
 * are placed as a pair — **both whole and unedited; no path data was touched.**
 *
 * The placement numbers were measured, not guessed: the first pass put the
 * bubble's tail through the head. With the person at 0.72 its head spans
 * x 2.64-9.84, and the bubble at 0.46 starts at x 13.0, so there is a clear
 * 3.2-unit gap at every stroke weight.
 *
 * ⚠️ **A scaled group must counter-scale its own stroke.** A `scale(0.46)`
 * group draws its stroke at 0.46x too, so `strokeWidth` goes in as
 * `STROKE / scale` and lands back on the same painted width as the rest of the
 * glyph. Measured on the running page: all three groups paint exactly 5.0px.
 * Without it the bubble painted 1.89px against the glyph's 6.75px — and the
 * first attempt to fix it with a CSS rule failed silently, because that pass
 * used `<use>`, which clones into a shadow tree no document stylesheet can
 * reach. Passing the number as a prop sidesteps the whole problem.
 *
 * ── Motion ───────────────────────────────────────────────────────────────
 *
 * Each glyph animates its own parts on hover and on keyboard focus. The
 * keyframes are CSS, in `index.css` under "Login user-type glyphs" — not
 * `framer-motion`, matching the consumer banner's precedent, and not Tailwind
 * arbitrary properties under stacked variants, which this project has twice
 * measured emitting no CSS at all.
 *
 * The `c2s-glyph-*` class names are the contract between this file and that
 * stylesheet. `transform-box: fill-box` is set there on all of them and is
 * load-bearing: without it `transform-origin` resolves against the SVG
 * viewport rather than the shape, and the heartbeat becomes a swing.
 */

export type UserTypeGlyphName = 'care-partner' | 'coach' | 'researcher'

/**
 * 1.25 on a 24-unit grid rendered at 96px = a 5px painted stroke. Both halves
 * of that are the instruction; see the exceptions note above before changing
 * either.
 */
const STROKE = 1.25

/** The two placement scales for the composed coach glyph. */
const PERSON_SCALE = 0.72
const BUBBLE_SCALE = 0.46

const SVG_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  /* The bubble pops past its own box and the heart beats past the 24 grid;
     the tile is 193px around a 96px glyph, so there is room to spare. */
  overflow: 'visible',
} as const

/** lucide `HeartHandshake`. One path, so the whole glyph rocks as a unit. */
function CarePartnerGlyph({ className }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} strokeWidth={STROKE}>
      <g className="c2s-glyph-cradle">
        <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
      </g>
    </svg>
  )
}

/** lucide `UserRound` + lucide `MessageCircle`, both whole, placed as a pair. */
function CoachGlyph({ className }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} strokeWidth={STROKE}>
      <g transform={`translate(-2.4 6.4) scale(${PERSON_SCALE})`} strokeWidth={STROKE / PERSON_SCALE}>
        <g className="c2s-glyph-lean">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </g>
      </g>
      <g transform={`translate(12.4 1.6) scale(${BUBBLE_SCALE})`} strokeWidth={STROKE / BUBBLE_SCALE}>
        <g className="c2s-glyph-pop">
          <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
        </g>
      </g>
    </svg>
  )
}

/**
 * lucide `ShieldUser`, split into its two halves so the shield can flex while
 * the person tucks in behind it. The paths are lucide's, unchanged — only the
 * grouping is this file's.
 */
function ResearcherGlyph({ className }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className} strokeWidth={STROKE}>
      <g className="c2s-glyph-guard">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      </g>
      <g className="c2s-glyph-tuck">
        <path d="M6.376 18.91a6 6 0 0 1 11.249.003" />
        <circle cx="12" cy="11" r="4" />
      </g>
    </svg>
  )
}

const GLYPHS: Record<UserTypeGlyphName, (p: { className?: string }) => React.JSX.Element> = {
  'care-partner': CarePartnerGlyph,
  coach: CoachGlyph,
  researcher: ResearcherGlyph,
}

/**
 * `className` carries the SIZE, and the default is the desktop/tablet 96px.
 * The mobile frame draws these at 64 (`4216:18252`), so the call site passes
 * `size-16 min-[640px]:size-24` rather than this file knowing about
 * breakpoints. The stroke is deliberately NOT rescaled with it: 1.25 on a
 * 64px glyph paints 3.33px, which is the same optical weight relative to the
 * glyph and is what the frame draws.
 */
export function UserTypeGlyph({
  name,
  className = 'size-24',
}: {
  name: UserTypeGlyphName
  className?: string
}) {
  const Glyph = GLYPHS[name]
  return <Glyph className={className} />
}
