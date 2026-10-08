import { useState } from 'react'
import { Card } from '@/components/ui/card'
import type { PersonProfile } from '@/data/spaces'

/**
 * The PLE / Carer identity card on the Consumer Portal's My Profile page —
 * name, age and relationship, with an inline edit form.
 *
 * ⚠️ **No Background field, on direct instruction** — removed from both the PLE
 * and the Carer card. `person.background` itself is deliberately left on the
 * data model and is NOT cleared on save: the researcher's
 * `ConsumerDetailPage` and the coach's `SpacesCoachProfilePage` both still read
 * it, so this is the audience-dependent split this project already applies to
 * consumer/client wording — the consumer simply does not maintain that field
 * about themselves.
 *
 * ── Why this is a consumer component and not the researcher's `PersonCard` ──
 *
 * It began as `PersonCard`, exported from `SpacesCoachProfilePage`, and the
 * consumer account page imported it across the portal boundary. By Round 46
 * that sharing was **fiction**: a grep for the component turned up exactly two
 * render sites, both on `ConsumerAccountPage`. No researcher or coach surface
 * had used it for some time, so it was a researcher-styled component with only
 * a consumer caller — which is why My Profile was the one consumer page still
 * rendering 14px labels, an app-purple `bg-primary` and 36px controls while
 * everything around it was on this portal's own scale and brand.
 *
 * Direct instruction: "make consumer portal consistent, regardless of what has
 * been extracted from researcher portal". So the component moved to where its
 * only caller lives and took this portal's own values with it. The original was
 * deleted rather than left behind — a shared component nobody shares is just a
 * second copy waiting to drift.
 *
 * What changed from the researcher original, all of it token-for-token:
 *
 *   title       `text-title` 20/500      -> `consumer-heading` 22/500
 *   labels      `text-fine` 12/600       -> `body` 16/400
 *   values      `text-caption` 14/400    -> `body` 16/400
 *   buttons     `caption-medium` 14/500  -> `body-md` 16/600
 *   controls    `h-9` 36px               -> `h-12` 48px, this portal's height
 *   brand       `primary` #4a278f        -> `consumer-primary` #3a00ad
 *   focus ring  `ring-ring`              -> `ring-consumer-primary`
 *   button shape rounded-sm / pill        -> the portal's 28px pills
 *
 * The pale purple header band stays `bg-card-header`: that token resolves to
 * `purple-50`, which is the same fill the module summary cards' bullet panel
 * uses, so it is a shared ramp value rather than an app-only decision.
 */

/**
 * The edit-mode input, styled as the frame's own field — direct instruction:
 * "match the text fields style also now / as done in figma".
 *
 * So it takes the `pearl` fill, the matching 1px `pearl` stroke and the 8px
 * radius that `VALUE_FIELD` below reads from frame `961:7913`, replacing the
 * white `bg-card` + `hairline` input this portal used before. Reading and
 * editing therefore differ only by being editable, which is the point: the
 * frame draws one field treatment, not two.
 *
 * Two deliberate departures from the frame, both because this is a real
 * control rather than a picture of one:
 *
 *   • **48px, not the frame's ~40px.** This portal put every control on 48px
 *     in Round 46 and the audience is explicitly low-digital-literacy, so the
 *     height is a floor decision, not a visual one. `min-h-12` is on the
 *     read-only box too, so switching modes cannot reflow the card.
 *   • **A real focus ring.** The frame has no focus state; dropping the ring
 *     to match it would fail the keyboard contract, and `pearl`-on-`pearl`
 *     leaves no other visible affordance.
 */
const FIELD =
  'h-12 w-full rounded-sm border border-pearl bg-pearl px-3 text-body text-ink outline-none transition-colors focus-visible:border-consumer-primary focus-visible:ring-2 focus-visible:ring-consumer-primary'

/** The portal's three button shapes, at its own 48px height. */
const PILL =
  'inline-flex h-12 items-center justify-center rounded-3xl px-5 text-body-md outline-none transition-all focus-visible:ring-2 focus-visible:ring-consumer-primary focus-visible:ring-offset-2 active:scale-[0.97]'
const PILL_FILLED = `${PILL} bg-consumer-primary text-white hover:opacity-90`
const PILL_OUTLINE = `${PILL} border border-consumer-primary bg-white text-consumer-primary hover:bg-purple-50`

/**
 * The frame's own value field: a filled `pearl` box with a matching 1px stroke
 * and an 8px radius (`radius-sm`), reading as an input without being one.
 *
 * `pearl` is `#f5f5f7` — the frame's `neutral/off-white` exactly. It is the
 * cool grey this project warns about, and it is correct **here**: the standing
 * rule is that `pearl` belongs inside a white card, where this lives, and only
 * reads as a foreign patch directly on the warm page canvas.
 */
const VALUE_FIELD =
  'flex min-h-12 items-center rounded-sm border border-pearl bg-pearl px-3 py-2.5 text-body break-words text-ink'

/** The frame's header band: `purple-50` #f3efff, 24px inline, 14px block. */
const HEADER_BAND = 'flex items-center justify-between gap-4 bg-purple-50 px-6 py-[14px]'

export function ConsumerPersonCard({
  title,
  person,
  onSave,
}: {
  title: string
  person: PersonProfile
  onSave: (patch: Partial<PersonProfile>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  const [age, setAge] = useState(String(person.age))
  const [email, setEmail] = useState(person.email ?? '')
  const [phone, setPhone] = useState(person.phone ?? '')

  /* Frame `961:7913` — two rows of two. Written as one 2-column grid rather
     than the frame's two explicit row containers: the field order is identical
     and a single grid is what lets it collapse to one column on a phone, which
     the frame has no state for. `min-w-0` on the cells because a long email is
     exactly the child that would otherwise size the track. */
  const fields = [
    { key: 'name', label: 'Full name', value: person.name },
    { key: 'age', label: 'Age', value: String(person.age) },
    { key: 'email', label: 'Email', value: person.email || '—' },
    { key: 'phone', label: 'Phone', value: person.phone || '—' },
  ]

  const reset = () => {
    setName(person.name)
    setAge(String(person.age))
    setEmail(person.email ?? '')
    setPhone(person.phone ?? '')
  }

  const inputId = (k: string) => `${title.replace(/\s+/g, '-').toLowerCase()}-${k}`

  return (
    <Card className="gap-0 overflow-hidden rounded-lg py-0">
      <div className={HEADER_BAND}>
        <h3 className="text-consumer-heading text-ink">{title}</h3>
        {!editing && (
          /* The frame draws its own white 36px block here; this is the
             portal's existing outline pill instead — direct instruction to
             "re-use as done elsewhere throughout the app", which is also this
             project's standing rule: the frame decides where a button goes and
             what it says, the app decides how it looks. */
          <button type="button" onClick={() => setEditing(true)} className={PILL_OUTLINE}>
            {/* Just "Edit" on a phone (direct instruction). Two spans rather
                than one string plus `sr-only`: `sr-only` is absolutely
                positioned with `white-space: nowrap`, which is what widened
                the whole document in Round 30's carousel, and the shorter
                label is the real accessible name here anyway. */}
            <span className="sm:hidden">Edit</span>
            <span className="hidden sm:inline">Edit details</span>
          </button>
        )}
      </div>

      {/* No hairline divider under the header: the frame's band closes itself
          with its own fill, exactly as the trainee record page's `purple-50`
          table header does. A documented, frame-driven §35a divergence. */}
      <div className="flex flex-col gap-5 p-6">
        {editing ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault()
              onSave({
                name,
                age: Number(age) || person.age,
                email,
                phone,
              })
              setEditing(false)
            }}
          >
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {[
                { key: 'name', label: 'Full name', value: name, set: setName, type: 'text' },
                { key: 'age', label: 'Age', value: age, set: setAge, type: 'text' },
                { key: 'email', label: 'Email', value: email, set: setEmail, type: 'email' },
                { key: 'phone', label: 'Phone', value: phone, set: setPhone, type: 'tel' },
              ].map((f) => (
                <div key={f.key} className="flex min-w-0 flex-col gap-2">
                  <label htmlFor={inputId(f.key)} className="text-consumer-body-strong text-ink">
                    {f.label}
                  </label>
                  <input
                    id={inputId(f.key)}
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className={FIELD}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className={PILL_FILLED}>
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  reset()
                  setEditing(false)
                }}
                className={PILL_OUTLINE}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="flex min-w-0 flex-col gap-2">
                <dt className="text-consumer-body-strong text-ink">{f.label}</dt>
                <dd className={VALUE_FIELD}>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Card>
  )
}
