/**
 * The module summary card's pillow illustration — Figma `4139:42732`
 * ("Frame 2"), exported whole on 2026-10-12.
 *
 * ── Why this is inline and not the `.svg` file it arrived as ──────────────
 *
 * It shipped first as `/illustrations/consumer-resource/summary-banner.svg`
 * behind an `<img>`, which is the right call for an illustration nothing has to
 * touch at runtime. It stopped being the right call the moment the pillow had
 * to move: an `<img>` is one opaque box, and the brief is that the **pillow**
 * breathes while the **ground shadow under it does not**, with the brows and
 * mouth on their own beats. That needs the parts addressable, so the export is
 * inlined here and the public `.svg` was deleted rather than left beside it —
 * two copies of one drawing is the §78.1 drift this project keeps paying for.
 *
 * **The path data is Figma's own export, untouched.** Only the grouping and the
 * `class` hooks are this file's. If the illustration changes, re-export and
 * re-paste; do not edit a path by hand.
 *
 * ── What moves, and what deliberately does not ────────────────────────────
 *
 * | layer | motion |
 * |---|---|
 * | ground ellipse `#B5935F` | **none** — it is the shadow the pillow rests on, and a shadow that breathes with the body reads as the whole drawing scaling |
 * | pillow body + its stroke | a slow breath, anchored at its own bottom |
 * | brows | a small lift, on a shorter clock |
 * | mouth | a small curl, on a longer one |
 *
 * The eyes and the nose dot ride inside the pillow group with no beat of their
 * own: they inherit the breath, which is what keeps the face attached to the
 * body. Three different durations (5.4s / 4.3s / 6.7s) so the three beats never
 * line up — the same reason the feedback pillows each carry their own duration
 * (`consumer-tokens.css`, "Feedback pillow idle beats").
 *
 * Keyframes live in `consumer-tokens.css` beside those, not here, and the whole
 * thing stops under `prefers-reduced-motion: reduce`.
 *
 * ⚠️ **CSS keyframes, not `framer-motion`.** That file records the measurement:
 * framer wrote `transform: none` and left it, having never parsed a percentage
 * keyframe array on these shapes. Do not "upgrade" this to motion components.
 *
 * ⚠️ `transform-box: fill-box` is load-bearing. Without it an SVG transform
 * resolves its origin against the **viewport**, not the shape, so
 * `transform-origin: 50% 100%` would anchor the breath somewhere off the
 * drawing entirely and the pillow would swing rather than swell.
 */

import type { CSSProperties } from 'react'

/** Figma's own export size. The card places it at a fixed 339 x 498; see
 *  `ResourceCard`'s `BANNER` for the column geometry around it. */
export const BANNER_W = 339
export const BANNER_H = 498

export function SummaryBannerArt({
  className,
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      className={className}
      width={BANNER_W}
      height={BANNER_H}
      viewBox={`0 0 ${BANNER_W} ${BANNER_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      /* The SVG's own viewport does not clip either, for the same reason the
         column does not: the pillow is drawn flush to the viewBox edge, so the
         default crop would take the swell off every frame. The module summary
         card is the single clipping boundary, and it is the one the design
         bleeds to. */
      style={{ overflow: 'visible', ...style }}
    >
      {/* The ground shadow. Outside the breathing group on purpose — see the
          table above. Its path runs on to x=467 — a long shadow Figma crops at
          the card edge — and the SVG's own viewBox is what crops it here. */}
      <path
        d="M233.488 494.875C362.439 496.105 467.138 482.518 467.338 464.527C467.538 446.536 363.165 430.955 234.213 429.725C105.261 428.495 0.562982 442.082 0.362701 460.073C0.162419 478.064 104.536 493.645 233.488 494.875Z"
        fill="#B5935F"
      />

      <g className="consumer-banner-breath">
        {/* Body: Figma's fill and its two inner shadows, then the stroke drawn
            over it as a separate path — that is how the export is built, and
            splitting them is what keeps the stroke crisp over the blur. */}
        <g filter="url(#summary-banner-inner-shadow)">
          <path
            d="M132.848 451.631C111.014 446.797 88.4283 452.067 66.2183 454.676C58.0849 455.631 50.529 454.476 46.4393 448.712C27.242 421.651 59.3851 381.679 49.2576 350.084C25.04 274.532 22.9931 213.486 42.9704 132.459C51.184 99.1454 28.2874 65.3156 30.6175 31.0835C30.8663 27.4276 32.1063 23.9852 34.6859 20.9512C42.282 12.017 54.9494 13.7778 66.606 18.4331C84.3498 25.5196 104.688 28.5071 122.893 22.7081C161.869 10.2929 237.846 -4.49824 338.394 20.9526V463.561C288.834 482.062 186.183 463.439 132.848 451.631Z"
            fill="#FFE299"
          />
        </g>
        <path
          d="M341.894 465.991L339.617 466.841C314.01 476.4 275.231 476.265 236.691 472.444C197.971 468.606 158.823 460.966 132.092 455.048C121.678 452.742 110.98 452.824 99.999 453.848C88.8017 454.891 78.1003 456.804 66.627 458.151C58.2218 459.139 48.8559 458.166 43.585 450.736C32.9248 435.709 36.7447 417.324 41.0537 400.242C43.2724 391.447 45.6727 382.891 46.9287 374.5C48.1777 366.155 48.2271 358.335 45.9248 351.152C21.5031 274.963 19.4448 213.257 39.5723 131.621C43.4426 115.923 40.029 99.9363 35.6133 82.999C31.2726 66.3496 25.9128 48.6695 27.126 30.8457C27.4211 26.5102 28.9126 22.3379 32.0195 18.6836C36.6132 13.2808 42.731 11.2043 49.0635 11.0967C55.2933 10.9909 61.868 12.7718 67.9043 15.1826C85.187 22.0849 104.653 24.8449 121.831 19.373C161.301 6.8004 237.953 -8.08148 339.252 17.5596L341.894 18.2285V465.991Z"
          stroke="#FFCC4D"
          strokeWidth="7"
        />

        {/* ── The face, turning toward the copy ───────────────────────────
            Direct instruction, Round 64: "the face also need to animate as the
            text is on left to the avatar, the face need to direct towards the
            text".

            So the whole face is one group and it turns LEFT — a small shift
            plus a touch of rotation, which together read as a head turn rather
            than the features sliding across the pillow. It holds the look for a
            quarter of the cycle (45-70%) before coming back, because a glance
            that turns and returns immediately reads as a twitch; holding is
            what makes it look like attention.

            It wraps the brows and the mouth, so their own beats compose on top
            of the turn rather than fighting it. The eyes and nose have no beat
            of their own — they just ride the turn and the breath, which is what
            keeps the face attached to the body. */}
        <g className="consumer-banner-face">
        <path
          d="M213.233 257.386C219.019 257.134 223.491 252.614 223.221 247.289C222.951 241.964 218.041 237.852 212.255 238.103C206.469 238.355 201.998 242.875 202.268 248.2C202.538 253.525 207.447 257.637 213.233 257.386Z"
          fill="#3A00AD"
        />
        <path
          d="M264.065 196.594C278.47 195.968 291.447 205.972 293.101 219.187L294.154 226.992C294.276 229.402 292.419 231.597 289.815 232.012C286.869 232.14 284.812 230.418 284.363 228.021L283.31 220.216C282.182 210.905 272.975 204.058 263.199 205.389C253.08 206.432 245.963 214.895 247.076 223.905L248.129 231.71C248.251 234.121 246.393 236.315 243.79 236.73C241.171 236.844 238.787 235.136 238.337 232.74L237.285 224.935C235.585 210.817 246.417 197.965 261.758 196.393C262.413 196.364 263.068 196.336 263.723 196.307L264.065 196.594Z"
          fill="#3A00AD"
        />
        <path
          d="M151.133 208.447C157.681 208.162 164.336 209.987 169.788 213.977C175.583 218.254 179.178 224.439 180.169 231.039L181.222 238.845C181.344 241.255 179.487 243.449 176.883 243.864C174.263 243.978 172.207 242.256 171.758 239.859L170.705 232.055C170.148 227.549 167.658 223.732 163.904 220.876C160.15 218.019 155.49 216.712 150.594 217.227C145.683 217.441 141.549 220.036 138.444 223.493C135.338 226.949 133.915 231.238 134.472 235.744L135.524 243.549C135.646 245.959 133.789 248.153 131.185 248.568C128.566 248.682 126.182 246.974 125.732 244.578L124.68 236.773C123.674 229.872 125.972 223.431 130.608 217.794C135.259 212.459 141.981 209.146 149.154 208.231C149.808 208.202 150.463 208.174 151.118 208.145L151.133 208.447Z"
          fill="#3A00AD"
        />

        {/* The mouth, on its own slow curl. */}
        <path
          className="consumer-banner-mouth"
          d="M222.589 300.203C191.159 301.569 168.872 295.593 167.875 295.335C165.21 294.545 163.778 292.191 164.638 289.738C165.498 287.285 168.056 285.966 170.721 286.756C170.721 286.756 198.65 293.997 234.884 290.308C270.79 286.633 296.058 273.758 296.386 273.744C298.616 272.439 301.624 273.516 303.041 275.568C304.457 277.621 303.285 280.389 301.055 281.694C300.103 282.339 273.868 295.558 236.013 299.619C231.429 299.818 227.188 300.305 222.932 300.49L222.589 300.203Z"
          fill="#3A00AD"
        />

        {/* The brows, lifting together on a shorter clock. Grouped so one
            keyframe serves both and they can never drift apart. */}
        <g className="consumer-banner-brows">
          <path
            d="M128.603 163.759C128.603 163.759 126.431 163.012 125.999 161.999C124.424 160.138 125.049 157.485 127.387 156.105C127.456 155.81 136.877 149.994 150.936 147.274C164.995 144.554 176.022 146.162 176.342 146.227C178.584 146.679 180.409 148.9 179.923 150.963C179.437 153.026 177.03 154.701 174.788 154.248C174.788 154.248 165.112 152.604 152.793 155.057C140.794 157.576 132.542 162.702 132.542 162.702C131.373 163.392 130.343 163.493 129.062 163.234L128.603 163.759Z"
            fill="#3A00AD"
          />
          <path
            d="M294.85 155.119C294.85 155.119 292.86 155.23 291.757 154.844C291.757 154.844 283.031 150.807 270.411 150.066C258.11 149.258 248.668 151.868 248.668 151.868C246.256 152.996 243.832 151.341 242.933 149.056C242.354 146.703 243.517 144.602 245.682 143.836C246.321 143.701 256.649 140.594 271.012 141.586C285.375 142.578 295.277 147.295 295.669 147.522C297.948 148.588 298.919 151.167 297.756 153.269C297.014 154.353 295.881 155.211 294.603 155.48L294.85 155.119Z"
            fill="#3A00AD"
          />
        </g>
        </g>
      </g>

      <defs>
        {/* Figma's own two inner shadows on the pillow body. The id is renamed
            from the export's `filter0_ii_4139_42767` only so it reads; the
            filter itself is unchanged. */}
        <filter
          id="summary-banner-inner-shadow"
          x="22.3937"
          y="-56"
          width="363"
          height="596.377"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="16" dy="-56" />
          <feGaussianBlur stdDeviation="51" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.721569 0 0 0 0 0.27451 0 0 0 1 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="40" dy="62" />
          <feGaussianBlur stdDeviation="31" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" />
          <feBlend mode="normal" in2="effect1_innerShadow" result="effect2_innerShadow" />
        </filter>
      </defs>
    </svg>
  )
}
