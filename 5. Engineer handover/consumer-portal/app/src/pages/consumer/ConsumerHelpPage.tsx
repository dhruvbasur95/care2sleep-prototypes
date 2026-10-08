import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Mail, MessageCircleQuestionMark, Phone, Search } from 'lucide-react'
import { ConsumerShell } from '@/components/consumer/ConsumerShell'
import {
  CONSUMER_CREST_TRACKING,
  CONSUMER_HERO_TO_CONTENT,
  ConsumerCanvasWave,
  ConsumerContentReveal,
  ConsumerPageHero,
} from '@/components/consumer/ConsumerCanvasWave'
import { cn } from '@/lib/utils'
import { useResearch } from '@/data/research-context'

/**
 * Need Help — Round 49, frame `982:8558`.
 *
 * Replaces the `ConsumerInProgressPage` placeholder that has stood behind this
 * destination since Round 41. Need Help is not a header tab: Round 48 moved it
 * into the account menu, so this page is reached from there.
 *
 * ── What comes from the frame, and what does not ──────────────────────────
 *
 * The hero is the portal's own shared one (`ConsumerPageHero`) with two
 * page-specific assets, exactly as the user described it: the wave is the same
 * curve in a **gold** paint rather than Home's cream, and the avatar gains a
 * question-mark bubble and a darker ground shadow to sit on it. All three live
 * in `ConsumerCanvasWave`, so nothing about the hero is rebuilt here.
 *
 * **The FAQ content is deliberately placeholder** (direct instruction: "Faqs
 * are all placeholder, dummy, I have 4 key sections but the questions are
 * placeholders. First get the page structure ready."). The four section titles
 * and their sub copy are the frame's own. The questions underneath them are
 * **dummy content written to be plausible for this study** (direct instruction:
 * "add some dymmy questions relevant to this project, and show some variation,
 * not necessarily it will be same number for all sections") — they are the
 * right shape and subject matter, but none of them has been reviewed by the
 * research team, and every answer body says so rather than inventing one.
 * Counts deliberately vary 4 / 5 / 3 / 2, so the layout is exercised against
 * uneven sections rather than a tidy 3-3-3-3 the real content will not match.
 *
 * ── Divergences from the frame, all deliberate ────────────────────────────
 *
 * 1. **The trailing vertical rule is dropped.** The frame's crisis row
 *    (`982:8865`) draws a divider after Beyond Blue with nothing to its right
 *    (`982:8878`). Two items take one rule between them.
 * 2. **The 52px white square is an icon**, per direct instruction ("Where there
 *    is a placeholder box, it will need icon"). `982:8588` is an empty white
 *    plate holding space for one. It is drawn as the glyph itself in white
 *    rather than a white plate with a glyph on it, so it reads as part of the
 *    card's own all-white content rather than as a second surface. The glyph is
 *    `MessageCircleQuestionMark`, matching the hamburger drawer's Need help row
 *    (direct instruction: "use what we are using for hamburger tope down
 *    drawer").
 * 3. **Copy is corrected** where the frame has slips: "essentials information"
 *    -> "essential information", "Care2sleep" -> "Care2Sleep", "About program"
 *    -> "About the program". The frame's sub copy also trails off in an
 *    ellipsis mid-sentence on two sections, which is a Figma text box running
 *    out of room rather than intended copy; both are finished here.
 * 4. **The rows are real accordions.** The frame draws a collapsed state only.
 *    A chevron that does nothing would be a silently dead control, which this
 *    project's standing rules forbid, so each row opens onto an honest "not
 *    written yet" line rather than fabricated answer copy.
 */

/** The research team's contact details. **Both values are deliberately
 *  unroutable placeholders**, and must stay that way until the real study
 *  contact is known:
 *   - the phone is a UK Ofcom drama-range number on an Australian study;
 *   - the email is on the reserved `example.edu` domain, matching every other
 *     address in the seed data. It was `@monash.edu` — a fictional person on a
 *     REAL, routable domain, which is a live mailbox waiting to receive mail
 *     meant for a study participant. Do not put a real domain here until the
 *     address behind it is real too. */
const RESEARCH_CONTACT = {
  phone: '+44 20 7946 0192',
  email: 'rosemary.vance@monash.example.edu',
}

/** The two crisis lines, `982:8885` / `982:8889`. Both are real and current
 *  Australian numbers, so unlike the contact details above these are not
 *  placeholder and should not be swapped for demo values. */
const CRISIS_LINES = [
  { label: 'In case of emergency', number: 'Call 000' },
  { label: 'Beyond Blue', number: 'Call 1300 22 4636' },
]

type FaqSection = {
  title: string
  sub: string
  questions: string[]
}

/**
 * The four sections. Titles and sub copy are the frame's; the questions are
 * placeholders and say so.
 *
 * They replace the frame's three identical "Question" rows per section, which
 * could not ship as drawn: three controls sharing one accessible name is
 * unusable with a screen reader, and a reader skimming the live page cannot
 * tell whether the repetition is placeholder or a bug.
 */
const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Common questions',
    sub: 'Get quick answers to the most frequently asked questions about the program',
    questions: [
      'How long does the Care2Sleep program run for?',
      'Do my carer and I both need to take part in every session?',
      'What happens if we miss a week?',
      'Is there any cost to us?',
    ],
  },
  {
    title: 'Sessions and learnings',
    sub: 'Here you will find step-by-step instructions, essential information, and tips for scheduling sessions with your coach',
    questions: [
      'When is my next module released?',
      'How do I join a session with my coach?',
      'Can I change the day or time of a session?',
      'Do I need to finish a module before my catch-up session?',
      'Can I go back and watch a module again?',
    ],
  },
  {
    title: 'Troubleshooting',
    sub: 'Having issues with the portal? Take a look at some troubleshooting steps, or report any problems you run into',
    questions: [
      'My Fitbit sleep data is not showing up',
      'The video will not play',
      'I cannot sign in to the portal',
    ],
  },
  {
    title: 'About the program',
    sub: 'Learn more about the Care2Sleep program',
    questions: [
      'Who is running Care2Sleep?',
      'How is my information kept private?',
    ],
  },
]

/**
 * An email with a single break opportunity, immediately after the `@`.
 *
 * `<wbr>` rather than `break-all` or a soft hyphen: `break-all` breaks wherever
 * the line happens to end (the orphaned "u" this replaces), and a soft hyphen
 * would render a hyphen inside an address, which reads as part of it.
 */
function emailLabel(address: string): ReactNode {
  const at = address.indexOf('@')
  if (at === -1) return address
  return (
    <>
      {address.slice(0, at + 1)}
      <wbr />
      {address.slice(at + 1)}
    </>
  )
}

/** A contact row — `982:8845` / `982:8849`. A real `<a>`, so the number dials
 *  and the address opens a mail client; the frame draws these as plain rows but
 *  a contact detail nobody can act on is the point of the card missed. */
function ContactRow({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Phone
  label: ReactNode
  href: string
}) {
  return (
    <a
      href={href}
      className={cn(
        // `px-5` on a phone rather than the frame's 24: the email is the
        // widest thing in this card and cannot wrap (below), so the padding is
        // what has to give at 375.
        'flex w-full items-center gap-3 rounded-[16px] bg-purple-50 px-5 py-4 lg:px-6',
        /*
         * ⚠️ **One line from `sm` up, a controlled two-line break below it.**
         *
         * "Email should not wrap" was given against the desktop card, where a
         * fixed 320px column broke the address mid-word and left a single "u"
         * on its own line. That is fixed by the column sizing to its content,
         * and from `sm` the address holds one line.
         *
         * On a 375 phone one line is arithmetically impossible and the earlier
         * `whitespace-nowrap` did not prevent the wrap so much as hide it — the
         * text simply painted outside its own pill and the page's
         * `overflow-clip` (which the full-bleed wave needs) swallowed the
         * evidence, which is also why the layout audit's `scrollWidth` check
         * reported clean. Measured at 375: the address alone is **237px**, plus
         * a 24px icon, a 12px gap and 40px of pill padding = **313px** of
         * content in a **261px** pill. Stripping every scrap of padding still
         * leaves it ~30px short, so there is no version of one line that fits.
         *
         * So below `sm` it breaks — but only at the `@`, via the `<wbr>` in
         * `emailLabel`, giving "rosemary.vance@" over "monash.edu" rather than
         * the orphaned character that prompted the instruction. Nothing else in
         * the string is a break opportunity.
         */
        'text-consumer-body-strong text-ink sm:whitespace-nowrap',
        'transition-colors hover:bg-white',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
      )}
    >
      <Icon
        aria-hidden="true"
        className="size-6 shrink-0 text-consumer-primary"
        strokeWidth={1.75}
      />
      {label}
    </a>
  )
}

/**
 * ⚠️ **The search is built, working and deliberately not rendered** (direct
 * instruction: "remove the search bar for now").
 *
 * A flag rather than a deletion, because "for now" is not "never" and the
 * pieces behind it — `HelpSearch`, `questionMatches`, the filtering in the page
 * body — are all still correct and still exercised by the types. Flipping this
 * to `true` restores it exactly as it was: a 720px pill above the blue card,
 * 72px clear of it.
 *
 * If it is still `false` next time this page is opened, delete it and the three
 * pieces it gates rather than letting a permanent flag pretend to be temporary.
 */
const SEARCH_ENABLED: boolean = false

/**
 * Does a question answer what the reader typed?
 *
 * **Word overlap, not a substring match** — and the field's own placeholder is
 * why. "Describe your issue" invites a sentence ("my fitbit is not syncing"),
 * and `question.includes(query)` returns nothing for a sentence against a
 * question phrased any other way, which is the classic search box that appears
 * broken while working exactly as written.
 *
 * So the query is split into words, stop words and one-or-two-letter fragments
 * are dropped, and a question matches if **any** surviving word appears in it.
 * `some` rather than `every`: a reader describing a problem in their own words
 * will use several this list does not have, and requiring all of them is the
 * same empty result by a longer route.
 */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'you', 'your', 'our', 'are', 'can', 'not', 'but', 'was',
  'his', 'her', 'has', 'have', 'with', 'this', 'that', 'from', 'what', 'when',
  'how', 'why', 'does', 'did', 'will', 'would', 'about', 'into', 'out', 'get',
  'got', 'its', "it's", 'is', 'my', 'me', 'we', 'us', 'to', 'of', 'in', 'on',
  'at', 'it', 'a', 'i', 'do', 'be', 'am',
])

function questionMatches(question: string, query: string): boolean {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  if (words.length === 0) return true
  const haystack = question.toLowerCase()
  return words.some((w) => haystack.includes(w))
}

/**
 * The search field — `988:9088`, inside a `988:9095` wrapper that insets it
 * 96px from the content column on both sides.
 *
 * A real `<input type="search">` doing real work, not a decorative bar. The
 * standing rule against silently dead controls applies with force here: a
 * search box is the one control a reader will type into before anything else,
 * and one that swallows a sentence and does nothing is worse than no search at
 * all.
 *
 * The frame draws only a resting state with grey placeholder text, so the focus
 * ring, the clear button and the result count are additions. The count is the
 * important one — filtering silently removes whole sections from the page, and
 * without a spoken count a screen-reader user has no idea the page changed.
 */
function HelpSearch({
  value,
  onChange,
  resultCount,
}: {
  value: string
  onChange: (v: string) => void
  resultCount: number
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  return (
    /* ⚠️ **Narrower than the frame, and above the card rather than below it**
       (direct instruction: "move the search bar above blue card, reduce its
       width"). Frame `988:9095` puts it under the card at a 96px inset, which
       is 929px of pill. A 720px cap centred in the column is the reduction; the
       column is `items-center`, so the cap is all it takes. */
    /* `mb-4` on top of the column's own 56 = **72px** down to the card
       (direct instruction: "add some vertical space between the search bar and
       blue card"). The search is one control and the card is a dense block of
       contact detail; 56 read as the two being one unit. Everything below the
       card keeps the plain 56. */
    <div className="mb-4 w-full max-w-[720px]">
      <label htmlFor={id} className="sr-only">
        Search help topics
      </label>
      {/* `rounded-full`, the frame's own 999px. The 1.5px `consumer-primary`
          stroke is the frame's too and is unusually heavy for a field in this
          app — kept, because it is what makes a white pill read as an input
          against a white-ish canvas with no fill of its own to do that job. */}
      <div className="flex w-full items-center gap-2.5 rounded-full border-[1.5px] border-consumer-primary bg-white px-6 py-4 focus-within:ring-2 focus-within:ring-consumer-primary focus-within:ring-offset-2">
        <Search aria-hidden="true" className="size-6 shrink-0 text-consumer-primary" />
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your issue"
          /* `min-w-0` so a long typed sentence scrolls inside the field rather
             than widening the pill and pushing the page sideways. */
          className="text-consumer-eyebrow min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value !== '' && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            /*
             * ⚠️ **The focus move is load-bearing, not a nicety.** This button
             * only exists while there is a value, so clearing unmounts the very
             * control that was clicked — and measured, that dropped focus
             * straight to `<body>`, this project's most-repeated defect and one
             * an earlier version of this comment wrongly claimed was impossible
             * here.
             *
             * The input is the right destination rather than a neutral one: a
             * reader who clears a search is about to type a different one.
             */
            className="text-consumer-body flex h-9 shrink-0 items-center rounded-full px-3 text-consumer-primary underline transition-colors hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-consumer-primary"
          >
            Clear
          </button>
        )}
      </div>
      {/* Live region, always mounted. A region that only appears once there are
          results announces nothing on the transition *into* zero results, which
          is the one case a reader most needs told. */}
      <p aria-live="polite" className="sr-only">
        {value === ''
          ? ''
          : `${resultCount} ${resultCount === 1 ? 'question' : 'questions'} match your search`}
      </p>
    </div>
  )
}

/**
 * One FAQ row. The whole row is the control, not just the chevron — a 35px
 * glyph at the far right of a 700px row is a needlessly small target, and this
 * portal's audience note (plain language, big targets) is explicit.
 */
function FaqRow({ question }: { question: string }) {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const panelId = useId()

  return (
    <>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex w-full items-center justify-between gap-4 rounded-[8px] py-2 text-left',
            'text-consumer-faq text-ink-muted',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-consumer-primary',
          )}
        >
          {question}
          {/* 36px hit area around a 28px glyph — the frame's own box is 35px,
              which already clears WCAG 2.2's 24px floor, but this app's control
              floor is 36 and a floor is a floor. */}
          <span className="flex size-9 shrink-0 items-center justify-center">
            <motion.span
              className="flex"
              animate={{ rotate: open ? 180 : 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <ChevronDown aria-hidden="true" className="size-7 text-ink" strokeWidth={2} />
            </motion.span>
          </span>
        </button>
      </h3>

      {/* ⚠️ The panel unmounts on close rather than animating to `height: 0` and
          staying in the tree. Animated `height: 0` is not concealment — the
          content keeps its focus order and its place in the accessibility tree
          unless it also gets `inert`, which is the Critical this project shipped
          in Round 20's accordion. Unmounting has no such failure mode. */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="text-consumer-body pb-2 text-ink-muted">
              This answer has not been written yet.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * One FAQ section — a title column and a rows column, `988:8941` and friends.
 *
 * ── Two genuinely different shapes, not one shape with a breakpoint ───────
 *
 * Desktop is the frame: two columns on the bare page canvas, 352px of title
 * against a flexible list, nothing drawn around either.
 *
 * Below `lg` the section becomes a **card** (direct instruction: "in mobile
 * view, add background white + shadow + purple header 50 to section"): white
 * body, the app's warm `shadow-card`, and the title block on a `purple-50`
 * band above it. There is no mobile frame for this page, so this is derived —
 * and it is derived from a pattern this app already has rather than invented,
 * being §35a's own card-header contract (one tinted header band, one divider,
 * content below).
 *
 * It earns its place: once the columns stack, a title and its own questions sit
 * in one undifferentiated run down the canvas with three more sections behind
 * them, and nothing tells a reader where one section stops. On desktop the
 * column gap does that job, which is why the card is not carried up there.
 */
function FaqBlock({ section, questions }: { section: FaqSection; questions: string[] }) {
  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-[16px] border border-parchment bg-white shadow-card',
        // Desktop drops the whole card back to the bare two-column row. Every
        // card property is cancelled explicitly rather than being written
        // `lg:`-first, so the mobile default cannot be lost to a later edit.
        'lg:flex-row lg:gap-20 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none',
      )}
    >
      {/* The frame fixes this column at 352px. `shrink-0` holds it there on a
          wide screen; below `lg` it is the card's header band. */}
      <div
        className={cn(
          'flex flex-col gap-2 border-b border-parchment bg-purple-50 px-5 py-6',
          'lg:w-[352px] lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0',
        )}
      >
        <h2 className="text-consumer-section text-ink-muted">{section.title}</h2>
        <p className="text-consumer-body text-ink-faint">{section.sub}</p>
      </div>

      {/* `min-w-0` on the flex child. Without it a long question sizes the track
          instead of wrapping inside it, which is the horizontal-page-scroll bug
          this project has shipped three times. */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 px-5 py-4 lg:p-4">
        {questions.map((q, i) => (
          <div key={q} className="flex flex-col gap-4">
            {i > 0 && <hr className="border-0 border-t border-hairline" />}
            <FaqRow question={q} />
          </div>
        ))}
      </div>
    </section>
  )
}

export function ConsumerHelpPage() {
  const { dyadId } = useParams()
  const { consumerDyads } = useResearch()
  const dyad = consumerDyads.find((d) => d.id === dyadId)
  const [query, setQuery] = useState('')

  /**
   * The filtered sections. A section drops out entirely once none of its
   * questions match, rather than lingering as a title over an empty list —
   * with four sections on the page, four headings above nothing is a worse
   * "no results" state than saying so once.
   *
   * ⚠️ Computed before the `!dyad` early return would be a hooks-order
   * violation, so the redirect below it stays last. `useMemo` and `useState`
   * both run unconditionally.
   */
  const visibleSections = useMemo(
    () =>
      FAQ_SECTIONS.map((section) => ({
        section,
        questions: section.questions.filter((q) => questionMatches(q, query)),
      })).filter((s) => s.questions.length > 0),
    [query],
  )
  const resultCount = visibleSections.reduce((n, s) => n + s.questions.length, 0)

  if (!dyad) return <Navigate to="/consumer" replace />

  return (
    <ConsumerShell
      /* See the note in `ConsumerDiaryPage` — the first-run welcome belongs to
         Home only, or it replays over this route on any direct arrival. */
      showWelcome={false}
      dyadId={dyad.id}
      accountLabel={dyad.carer.name}
      contentClassName="bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-24 md:px-20"
      optedOut={dyad.optedOut}
      showFooter
    >
      <ConsumerCanvasWave variant="help" />

      <div
        className={cn(
          'relative flex flex-col items-center pt-4 pb-16',
          CONSUMER_HERO_TO_CONTENT,
          CONSUMER_CREST_TRACKING,
        )}
      >
        <ConsumerPageHero
          withQuestion
          title="How can we help you?"
          sub={
            <>
              A few things you might find helpful.
              <br />
              If you are still not sure, reach out and we will help.
            </>
          }
        />

        {/* 56px between the contact card and each FAQ section — the frame's own
            `982:8583` gap. */}
        {/* One 56px rhythm for the whole column — search, card, then each FAQ
            section. Frame `982:8583` moved to 40 when it put the search under
            the card, but the search is above the card here, and the direct
            instruction was to "revert the spacing how it was below the blue
            card, and FAQ's". So the frame's own 56 stands and there is no
            special case to keep in step. */}
        <ConsumerContentReveal className="flex w-full max-w-[1121px] flex-col items-center gap-14">
          {SEARCH_ENABLED && (
            <HelpSearch value={query} onChange={setQuery} resultCount={resultCount} />
          )}

          {/* ── Contact the research team, `982:8587` ──────────────────────── */}
          <section
            className={cn(
              'flex flex-col gap-10 rounded-[16px] border border-parchment',
              'w-full bg-consumer-primary px-8 pt-8 pb-10 shadow-card',
            )}
          >
            {/* ⚠️ `MessageCircleQuestionMark`, NOT `LifeBuoy`. The portal
                settled this twice already — on the coach profile modal ("this
                icon does not make any sence") and again in
                `ConsumerMenuDrawer`: at a large size a life ring reads as a
                wheel or a target. One glyph, one meaning, and it is the same
                one the hamburger drawer's own Need help row uses. */}
            <MessageCircleQuestionMark
              aria-hidden="true"
              className="size-[52px] shrink-0 text-white"
              strokeWidth={1.5}
            />

            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center lg:gap-12">
              {/* The frame fixes this at 588px; a max-width rather than a width
                  so it can give the space back when the row stacks. */}
              <div className="flex max-w-[588px] flex-col gap-6 text-white">
                <p className="text-consumer-eyebrow">Get in touch with research team</p>
                <div className="flex flex-col gap-2">
                  <h2 className="text-consumer-card-title text-balance">
                    We are glad to help with anything about the app or your program
                  </h2>
                  <p className="text-consumer-eyebrow text-balance">
                    We will try our best to reply to you as soon as we can
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col justify-center gap-4 lg:w-auto lg:min-w-[320px] lg:shrink-0">
                <ContactRow
                  icon={Phone}
                  label={RESEARCH_CONTACT.phone}
                  href={`tel:${RESEARCH_CONTACT.phone.replace(/\s/g, '')}`}
                />
                <ContactRow
                  icon={Mail}
                  label={emailLabel(RESEARCH_CONTACT.email)}
                  href={`mailto:${RESEARCH_CONTACT.email}`}
                />
              </div>
            </div>

            <hr className="border-0 border-t-2 border-white/40" />

            {/* The crisis pair. One rule between two items — see divergence 1 in
                the file header. `divide-x` rather than a rendered divider node,
                so the rule cannot outlive the item it separates. */}
            <div className="flex flex-col items-center gap-6 self-center sm:flex-row sm:gap-0">
              {CRISIS_LINES.map((line, i) => (
                <div
                  key={line.label}
                  className={cn(
                    'flex flex-col items-center gap-2 text-center text-white sm:px-10',
                    i > 0 && 'sm:border-l-2 sm:border-white/40',
                  )}
                >
                  <p className="text-consumer-eyebrow">{line.label}</p>
                  <p className="text-consumer-crisis whitespace-nowrap">{line.number}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The sections keep their own container so the empty state has
              somewhere to live, but its gap now matches the column's — one
              rhythm, no nested exception. */}
          <div className="flex w-full flex-col gap-14">
            {visibleSections.map(({ section, questions }) => (
              <FaqBlock key={section.title} section={section} questions={questions} />
            ))}

            {/* Saying so beats four headings over four empty lists, and beats a
                page that silently loses most of its content. */}
            {visibleSections.length === 0 && (
              <p className="text-consumer-eyebrow text-ink-muted">
                Nothing here matches that. Try a different word, or get in touch with the
                research team using the details above.
              </p>
            )}
          </div>
        </ConsumerContentReveal>
      </div>
    </ConsumerShell>
  )
}
