import { useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import { CoachProfileModal } from '@/components/consumer/CoachProfileModal'
import { useResearch } from '@/data/research-context'
import type { ConsumerDyad } from '@/data/spaces'

/**
 * "Meet your coach" — Figma frame `771:3665`, the **rebuilt** card.
 *
 * This replaces an earlier, much larger version (frames `761:3469`/`761:3597`/
 * `761:3578`) and simplifies it in three ways that between them delete most of
 * what was hard about it:
 *
 * - **The yellow blob is gone.** The top region is a flat `purple-50` band,
 *   104px tall. (It was `yellow-200` until a direct instruction moved it:
 *   "change yellow to purple 50". `purple-50` #f3efff already carries 14 other
 *   consumer surfaces, so this is the portal's own pale purple rather than a
 *   tint borrowed from another portal.) All of the rotated-bbox derivation, the per-breakpoint
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

/* `BAND_H` and `PORTRAIT` were deleted with the banded layout (frame
   `2931:18660` draws no band and centres the portrait), grep-confirmed at zero
   readers. Only the export ratio below survives them. */

/** The export is larger than its own circle because of the white ring and
 *  shadow baked into it (116.564 against 104) and is centred on the circle, not
 *  aligned to it. The ratio is what matters, not either number — it held when
 *  the portrait was 90.658, when it was 104, and it holds now the compact frame
 *  draws it at 88. */
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
 * ⚠️ **This now opens `CoachProfileModal`.** It shipped as a focusable
 * `aria-disabled` control with an `sr-only` "(coming soon)" cue because, in this
 * comment's own earlier words, there was no coach profile on the consumer side.
 * Round 47 built one from frame `979:8284`, so the placeholder and its cue are
 * gone. An `aria-disabled` button left in place after its destination exists is
 * worse than the original gap: it tells a screen-reader user a finished feature
 * is unavailable.
 *
 * ⚠️ **No `display` utility in these base classes, deliberately.** The two
 * placements below are toggled by `hidden` / `min-[1281px]:flex`, and a base
 * `inline-flex` here silently beat the `hidden` — display utilities carry equal
 * specificity, so the winner is decided by stylesheet order, not by the order
 * they appear in the attribute. The result was **the button rendering twice**,
 * reported from the live page. Display stays the call site's business.
 */
function ReadProfileButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 items-center justify-center rounded-3xl border border-consumer-primary bg-white px-5 text-body-md text-consumer-primary outline-none transition-colors hover:bg-consumer-primary/5 focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 ${className ?? ''}`}
    >
      Read profile
    </button>
  )
}

export function CoachCard({ dyad }: { dyad: ConsumerDyad }) {
  const { coaches } = useResearch()
  const coach = dyad.coachId ? coaches.find((c) => c.id === dyad.coachId) : undefined
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      {/* `flex-1` so the two cards in this row match heights. The frame draws
          both at a flat 380px; they stretch here instead, because this portal's
          CTA is 48px where the frame's is 36 and a pinned height would push the
          taller card's content past its own edge — the trap this project's
          standing rules already record once. */}
      {/* Frame `2931:18660` ("Coach Card Compact"), which supersedes `771:3667`.

          ⚠️ **The coloured band is gone.** This card used to open with a 104px
          tinted band (`yellow-200`, then `purple-50` earlier today) carrying a
          portrait that overhung it; the compact frame draws none of that. The
          band, `BAND_H`, the overhang padding and the portrait's absolute
          placement all went with it, and so did the reason this file needed
          `overflow-hidden`.

          ⚠️ **This must stay a JSX expression comment, brace-wrapped.** It sits
          inside a fragment, where a bare block comment is not a comment at all
          — it is a JSX text child, and it rendered this whole paragraph onto
          the card. Note also that the close-comment sequence cannot appear in
          the prose: writing it out terminates the comment early, which is how
          this note broke the build on its first attempt. Same family as the
          attribute-list trap this project already records. */}
      {/* Gaps are 32, not the frame's 24 (direct instruction: "increase gap",
          annotated at name -> contact and contact -> CTA). Both the card's own
          gap and the identity/contact wrapper's moved together: those are the
          two the annotation marked, and leaving one at 24 would have made the
          card's vertical rhythm uneven. `justify-between` makes 32 a floor
          rather than a fixed step, since the row stretches both cards to the
          taller of the two and any slack lands in these gaps. */}
      <div className="flex w-full flex-1 flex-col justify-between gap-8 rounded-lg border border-hairline bg-white px-8 pt-8 pb-10 shadow-card">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          {/* `2931:18662` — an 88px circle (the frame's `rounded-[44px]` on an
              88px box is a full round). The export is wider than its own circle,
              which is why it is placed at `PORTRAIT_EXPORT_SCALE` inside an
              `overflow-hidden` round rather than dropped in at 100%: that ratio
              is what keeps the face framed the way every other surface frames
              it. Clipping here is safe now that there is no ring overhanging a
              band to slice. */}
          <div className="relative size-[88px] shrink-0 overflow-hidden rounded-full">
            <img
              src={`${import.meta.env.BASE_URL}illustrations/consumer-welcome/coach-portrait-placeholder.png`}
              alt=""
              aria-hidden="true"
              className="absolute max-w-none"
              style={{
                left: `${((1 - PORTRAIT_EXPORT_SCALE) / 2) * 100}%`,
                top: `${((1 - PORTRAIT_EXPORT_SCALE) / 2) * 100}%`,
                width: `${PORTRAIT_EXPORT_SCALE * 100}%`,
                height: `${PORTRAIT_EXPORT_SCALE * 100}%`,
              }}
            />
          </div>

          {/* `2931:18664` — 20/500, which is `consumer-lesson`'s own top of
              clamp. The `font-semibold` this line used to carry is gone: the
              frame is Medium, and 600 here was a holdover from the banded
              layout. The "Your Coach" eyebrow above it is gone too — the
              section heading now reads "Your coach details", so the card was
              saying it a third time. */}
          <p className="text-consumer-lesson max-w-full truncate text-ink">
            {coach ? coach.fullName : 'Not assigned yet'}
          </p>
        </div>

        {coach ? (
          <div className="flex flex-col items-center gap-2">
            <ContactRow icon={Phone} value={coach.phone} />
            <ContactRow icon={Mail} value={coach.email} />
          </div>
        ) : (
          <p className="text-consumer-eyebrow text-center text-ink-muted">
            You will see your coach&rsquo;s name and how to reach them here once you are matched.
          </p>
        )}
      </div>

      {/* `2926:13255` — a 1px `#e0e0e0` rule, this app's `hairline`, as a real
          border rather than the frame's exported rectangle. */}
      <hr className="border-t border-hairline" />

      {/* `2931:18679` — full width now, and one control at every width. The old
          card had two instances of this button (inline beside the name on
          desktop, full width on mobile) because the name row and the button
          shared a row above 1281; the compact frame stacks everything, so the
          desktop instance had nothing left to sit beside and the pair collapsed
          to one. */}
      {coach && <ReadProfileButton onClick={() => setProfileOpen(true)} className="flex w-full" />}
    </div>

      <CoachProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        dyadId={dyad.id}
        coach={coach}
      />
    </>
  )
}
