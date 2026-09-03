import { Mail, Phone } from 'lucide-react'
import { useResearch } from '@/data/research-context'
import type { ConsumerDyad } from '@/data/spaces'

/**
 * "Meet your coach" — Figma frame `771:3665`, the **rebuilt** card.
 *
 * This replaces an earlier, much larger version (frames `761:3469`/`761:3597`/
 * `761:3578`) and simplifies it in three ways that between them delete most of
 * what was hard about it:
 *
 * - **The yellow blob is gone.** The top region is a flat `yellow-200` band,
 *   104px tall. All of the rotated-bbox derivation, the per-breakpoint
 *   placements, the corner-gap inset and the stroke-width edit existed to serve
 *   that shape and go with it. (The blob's export stays committed at
 *   `/illustrations/consumer-welcome/coach-card-blob.svg` — unreferenced now,
 *   but a one-line restore if the shape returns.)
 * - **The portrait is 90.66px**, not 200 or 160, at 6.38% from the left. It
 *   still straddles the band's lower edge (58 -> 148.66, so 44.66px into the
 *   body), which is what the body's 64px top padding clears.
 * - **The type came down a step throughout**: the eyebrow is the frame's
 *   published `sub-greeting` (18/400 at 1.4), the name 18/600 at 1.3, and the
 *   contact rows `body` (16/400 at 1.4) with 24px icons rather than 32.
 *
 * The band height and portrait size are fixed px rather than fractions of the
 * card, deliberately: a flat colour band has no shape to distort, and a 90px
 * circle already sits comfortably in the ~327px card a 375px screen gives it.
 * The previous version needed proportional everything because it was
 * reproducing a 486px illustration — that whole class of problem is gone.
 *
 * **The two icons are lucide (`Phone`, `Mail`), not the frame's exported SVGs** —
 * this project's standing rule. The frame's glyphs are a handset and an
 * envelope, which is what these are; only the drawing is the app's own.
 *
 * **The portrait is a placeholder and is flagged, not quietly adopted.** A
 * `Coach` record has no photo field, so there is nothing to wire this to, and
 * this app has a standing app-wide "no avatars" rule (Round 4.1, reinstated
 * Round 21). A designed portrait on a card whose whole job is "here is the
 * person you will be talking to" is a different thing from an avatar chip in a
 * table row, and the frame is explicit — so it ships as drawn, with the conflict
 * recorded rather than resolved on the frame's behalf. The committed file is one
 * stock face standing in for every coach, which is why it wants a real field
 * before this reaches a participant.
 */

/** Frame `771:3668` — the flat band the portrait straddles. */
const BAND_H = 104
/**
 * Frame `771:3688`, resized — 104 square at top 51.33, up from 90.658 at 58.
 *
 * `left` is the card's own 32px content inset rather than the frame's 32.5px or
 * the 6.38% this used before: at the frame's 540.5px card those all land within
 * 2px of each other, but only the inset keeps the portrait's left edge on the
 * same vertical as the name and contact rows beneath it at *every* card width.
 */
const PORTRAIT = { size: 104, left: 32, top: 51.33 }
/** The export is larger than the circle because of its own white ring and
 *  shadow (116.564 against 104); centred on the circle, not aligned to it. The
 *  ratio is unchanged from the smaller frame — 1.1208 either way — so the
 *  resize is a single number, not a re-derivation. */
const PORTRAIT_EXPORT_SCALE = 116.564 / 104

function ContactRow({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center text-consumer-primary"
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 truncate text-body text-ink">{value}</span>
    </div>
  )
}

/**
 * Frame `771:3707` (desktop, inline) / `787:1571` (mobile, full width).
 *
 * One definition, two placements — see the call sites. This is exactly this
 * app's canonical **primary outline** pill: 28px radius, 1px brand border,
 * brand label. The frames draw it 40px tall; it renders at 44 here, since the
 * 36px floor is a minimum and this portal's audience is the one with the
 * explicit big-targets note.
 *
 * No destination — there is no coach profile page on the consumer side — so it
 * is a focusable `aria-disabled` control with an `sr-only` cue, per this
 * project's standing rule against silently dead buttons.
 */
function ReadMoreButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      onClick={(e) => e.preventDefault()}
      className={`h-11 items-center justify-center rounded-3xl border border-consumer-primary bg-white px-5 text-body-md text-consumer-primary outline-none transition-colors hover:bg-consumer-primary/5 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 ${className ?? ''}`}
    >
      Read More
      <span className="sr-only"> (coming soon)</span>
    </button>
  )
}

export function CoachCard({ dyad }: { dyad: ConsumerDyad }) {
  const { coaches } = useResearch()
  const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined

  return (
    /* `flex-1` so the two cards in the frame's side-by-side row match heights —
       the frame draws both at 365 (`761:3447` and `771:3667`), where their own
       content is 315 and 368. Without it the row is as tall as the taller card
       and the shorter one floats with a gap beneath it. */
    <div className="flex w-full flex-1 flex-col overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
      {/* The band is **not** the clipping element. The portrait's white ring
          extends past its own box, and clipping at the band sliced the bottom of
          that ring flat — reported twice as "the avatar is getting clipped", and
          found by measuring the ring's overhang rather than by looking. The
          card's own `overflow-hidden` keeps everything inside the rounded
          corners; nothing else needs to clip. */}
      <div className="relative w-full bg-yellow-200" style={{ height: BAND_H }}>
        <div
          className="absolute"
          style={{
            left: PORTRAIT.left,
            top: PORTRAIT.top,
            width: PORTRAIT.size,
            height: PORTRAIT.size,
          }}
        >
          <img
            src="/illustrations/consumer-welcome/coach-portrait-placeholder.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: `${((1 - PORTRAIT_EXPORT_SCALE) / 2) * 100}%`,
              top: `${((1 - PORTRAIT_EXPORT_SCALE) / 2) * 100}%`,
              width: `${PORTRAIT_EXPORT_SCALE * 100}%`,
              height: `${PORTRAIT_EXPORT_SCALE * 100}%`,
              maxWidth: 'none',
            }}
          />
        </div>
      </div>

      {/* pt 72 clears the portrait's 51.33px overhang (it was 64 against a
          44.66px overhang, before the portrait grew to 104). Padding steps
          `px-4 pb-6` -> `px-8 pb-10` between the mobile frame (`787:1555`) and
          the desktop one (`771:3671`); pt is 72 at both. */}
      <div className="flex flex-1 flex-col px-4 pt-[72px] pb-6 sm:px-8 sm:pb-10">
        {/* Frame `771:3673`: the name block and the Read More control share one
            row on desktop, name block flexible and the button holding its width.
            On mobile (`787:1557`) the row holds the name alone — see the
            full-width button below the contact rows. */}
        <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* "Your Coach", not the frame's "Meet your coach" (direct
                instruction) — the section heading directly above already says
                "Meet your coach", so the card was repeating it. */}
            <p className="text-consumer-eyebrow text-ink-muted">Your Coach</p>
            {/* The frame's `<Full name>` is a placeholder; this reads the dyad's
                real assigned coach. A dyad with no coach yet is a real state in
                this app, so it says so rather than rendering an empty line. */}
            {/* 20px on desktop (direct instruction), scaling down with the rest
                of the system rather than being pinned there. `consumer-lesson`
                is already the 18 -> 20 ramp at 1.3, so this reuses it with a
                weight override instead of adding a second token whose only
                difference from it would be 600 — the size ramp is the thing
                worth naming once. Mobile lands at 18, which is the same
                proportional step every other pair on this page takes. */}
            <p className="text-consumer-lesson truncate font-semibold text-ink">
              {coach ? coach.fullName : 'Not assigned yet'}
            </p>
          </div>
          {/* Frame `771:3707` — new (direct instruction: "I have also added a
              read more button to coach profile card"). This is exactly this
              app's canonical **primary outline** pill: same 28px radius, same
              1px brand border, same brand label. The frame draws it 40px tall;
              it renders at 44 here, since the 36px floor is a minimum and this
              portal's audience is the one with the explicit big-targets note.

              No destination — there is no coach profile page on the consumer
              side — so it is a focusable `aria-disabled` control with an
              `sr-only` cue, per this project's standing rule. It is only
              rendered when there is a coach to read about. */}
          {coach && <ReadMoreButton className="hidden shrink-0 min-[1281px]:flex" />}
        </div>

        {/* The frame draws a 1px `#e0e0e0` line, which is this app's own
            `hairline` — a real border rather than the frame's exported SVG. */}
        <hr className="border-t border-hairline" />

        {coach ? (
          <div className="flex flex-col gap-4 sm:gap-6">
            <ContactRow icon={Phone} value={coach.phone} />
            <ContactRow icon={Mail} value={coach.email} />
          </div>
        ) : (
          <p className="text-body text-ink-muted">
            You will see your coach&rsquo;s name and how to reach them here once you are matched.
          </p>
        )}
        </div>

        {/* Frame `787:1571` — on mobile the control leaves the name row and
            becomes a full-width button at the foot of the card, 48px below the
            contact block (`787:1555`'s own gap). Desktop keeps it inline beside
            the name, which is `771:3707`.

            Rendered as a second instance rather than moved with `order`,
            because the two placements are structurally different: on desktop it
            is a child of the name row, on mobile a sibling of the whole contact
            section, and no amount of reordering nests an element into a row it
            is not in. `hidden` is `display: none`, so exactly one of the two is
            in the accessibility tree at any width — this is not two buttons. */}
        {/* `mt-auto` pins it to the card's bottom edge so it lines up with the
            session card's CTA beside it; `pt-12` on the wrapper keeps the frame's
            48px minimum gap when there is no slack to consume. */}
        {coach && (
          <div className="mt-auto pt-12 min-[1281px]:hidden">
            <ReadMoreButton className="flex w-full" />
          </div>
        )}
      </div>
    </div>
  )
}
