import { CONSUMER_MODULES } from '@/data/spaces'

/**
 * The content behind a consumer module's inner pages — Round 46, frames
 * `818:12862` (welcome) and `819:13049` (video).
 *
 * ── Why this file exists rather than the frames' own strings ───────────────
 *
 * The two frames are a *template*: the video header reads "Module 1:
 * Understanding Sleep" over chapters titled "How to Stop AI From Killing
 * Everyone" and "Prediction for 2027", which is stock content from an unrelated
 * video. Transcribing that would have put a page claiming to be Module 1 behind
 * a card on My Modules that says Module 4 — this project's most-repeated bug,
 * two surfaces disagreeing about one fact.
 *
 * So the module's *identity* (number, title) is read from `CONSUMER_MODULES` at
 * render time and never written here, and the episode content below comes from
 * the real production script the user supplied
 * (`BuildingBlocksOfGoodSleep_step4_script.docx.md`).
 *
 * **The two frames' own episode copy is kept**, because it is not placeholder:
 * "Why does sleep feel impossible when you need it most?" is the question the
 * script's intro opens on (two households awake at twenty past two), and the
 * sub copy naming "what sleep drive is and how daily habits affect your nights"
 * describes this script exactly — sleep drive is the script's central idea and
 * all three of its strategies are daytime ones. That copy was written against
 * this module; only the module header and the chapter titles were stock.
 *
 * ── Chapters ──────────────────────────────────────────────────────────────
 *
 * Six, not the frames' seven: the script has an INTRO, four numbered chapters
 * and a CLOSE. The carousel is data-driven, so the count follows the content
 * rather than the frame's repeated placeholder tiles.
 *
 * `startsAt` is **derived, not invented**. No video exists yet, so there is no
 * real runtime to read. Each chapter's start is the running sum of the ones
 * before it, each timed at 140 words per minute of narration (an unhurried
 * documentary rate, appropriate for this portal's audience) plus 1.2s for every
 * `[pause]` the script marks. That puts the module at 20:15. Recorded here so
 * the next person knows these are a stated estimate off a real script rather
 * than numbers someone liked the look of — replace them with the true
 * timestamps the moment the video is cut.
 */

/** Seconds, so a timestamp is stored once and formatted once. Writing "2:46"
 *  as a string invites a chapter list that no longer sorts. */
interface ModuleChapter {
  id: string
  title: string
  startsAt: number
}

/**
 * One flip card on the Summary screen — Round 46, frames `882:2067` (front) and
 * `900:2244` (back).
 *
 * Content is the supplied `BuildingBlocksOfGoodSleep_activities_v2.md`, whose
 * own heading for these is **"CHAPTER SUMMARY CARDS"**. The frame's three cards
 * all read "01 / The Building Blocks of Sleep" — one card duplicated as a
 * layout study, not three different cards.
 *
 * **`chapterId`, not a title.** The title is looked up from `chapters` at render
 * time so this screen and the video screen's carousel cannot name the same
 * chapter two different ways — the "two surfaces, one fact" rule. It is also
 * why the supplied doc's own title casing ("Waiting Until You're Sleepy") is not
 * carried here: the chapter list already settled on this portal's sentence case
 * with contractions spelled out, and one of the two had to win.
 *
 * The bullet *bodies* are kept **verbatim from the doc**, contractions and all.
 * They are an author's production copy rather than UI chrome, and the frame
 * renders them as written.
 *
 * `style` is 1, 2 or 3 — the three hand-drawn pillow vectors the frame gives the
 * cards (`902:2341`/`902:2348`/`902:2355`), each at its own size and rotation.
 * Direct instruction: "each has 3 UI styles". There are four chapters and three
 * styles, so they cycle; that is what a set of styles is for, and it is why the
 * count is derived from the content rather than fixed at the frame's three.
 */
export interface ModuleSummaryCard {
  /** Must match a `ModuleChapter.id` — the title is read from there. */
  chapterId: string
  /** Zero-padded for display: the frame draws "01", not "1". */
  number: string
  /**
   * The sentence under the title on the back. **Two lines at most**, direct
   * instruction, which at the 371px desktop card means roughly 65 characters —
   * measured, not estimated: 88 characters wrapped to three.
   */
  lead: string
  /** Bullet bodies. A `**bold**` span is rendered, matching frame `900:2264`. */
  bullets: string[]
  style: 1 | 2 | 3
}

/**
 * One line of the episode transcript — frame `920:1110`.
 *
 * **The frame's own six lines are dummy copy and are not used.** They transcribe
 * a *coaching session* ("Good morning everyone... Dad got quite confused on
 * Tuesday evening"), which is a different thing entirely from this module's
 * video, and the tab is labelled Transcript on a screen whose other two modes
 * play that video. Direct instruction settles it: "refer to .md for transcript.
 * Just extract some key words from the script, no need to show everything." So
 * the frame supplies the treatment and `BuildingBlocksOfGoodSleep_step4_script`
 * supplies the words.
 *
 * **Abridged on purpose**, ten lines against a script of about ninety. The
 * selection walks all six chapters in order so the transcript and the chapter
 * carousel tell the same story in the same sequence.
 *
 * `speaker` is the script's own cast, mapped onto this project's terminology:
 * the script writes "Care Partner", every consumer surface writes **Carer**,
 * and the terminology table is what a reader of this portal has already been
 * taught. `PLE` is the table's own label. Narrator and Expert have no house
 * equivalent and keep the script's words.
 */
export interface TranscriptLine {
  speaker: 'Narrator' | 'Expert' | 'PLE' | 'Carer'
  /**
   * The line. `==marked==` paints the frame's highlighter behind a phrase —
   * the same deliberately tiny convention `**bold**` already uses in
   * `summaryCards`, for the same reason: these strings are plain sentences and
   * a markdown dependency would let arbitrary markup into them.
   *
   * ⚠️ **The mark is a playback position, not emphasis.** Direct instruction,
   * and it reverses this field's first pass, which highlighted a key phrase on
   * every one of the ten lines: "Purpose is to show text highlight as the audio
   * plays, and not to highlight any important words." So there is exactly ONE
   * mark in the whole transcript, a couple of words into the first line, and it
   * stands for where a player that does not exist yet would have reached.
   *
   * The consequence worth stating: a second mark anywhere else would claim the
   * audio is in two places at once. When a real player lands this static mark
   * should be REPLACED by one driven off its current time, not added to.
   */
  text: string
}

export interface ModuleEpisode {
  /** The question the episode opens on — the frame's own `Episode title`. */
  title: string
  /** One line under it saying what watching will do — the frame's own sub. */
  sub: string
  /** Total runtime in seconds. Derived the same way as `startsAt`. */
  durationSeconds: number
  chapters: ModuleChapter[]
  /** The Summary screen's flip cards. */
  summaryCards: ModuleSummaryCard[]
  /** The video screen's Transcript mode. */
  transcript: TranscriptLine[]
  /** The Summary screen's own lead paragraph — the doc's MODULE CORE MESSAGE,
   *  quoted verbatim, which is also what frame `882:2106` prints. */
  coreMessage: string
}

/** `m:ss`. A chapter list is never an hour long, so no hours branch. */
export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Keyed by `ConsumerModule.id`, not by index — the pre-module sits at index 0
 * and every "Module N" label is `index`, so an index key here would silently
 * point one module off the moment the curriculum gains an entry.
 *
 * Only `daytime-habits` (Module 4) is populated. A module with no entry falls
 * through to the "not ready yet" state rather than rendering an empty player,
 * the same way `ModuleOverviewPage` degrades in the coach portal.
 */
const MODULE_EPISODES: Record<string, ModuleEpisode> = {
  'daytime-habits': {
    title: 'Why does sleep feel impossible when you need it most?',
    sub: 'Watch this short video. It explains what sleep drive is and how daily habits affect your nights.',
    durationSeconds: 20 * 60 + 15,
    chapters: [
      // Titles are the script's own chapter headings, in this portal's sentence
      // case and with its contractions removed — the script writes "Waiting
      // Until You're Sleepy", and every other consumer surface (the welcome
      // screen, My Modules, the diary) spells contractions out.
      { id: 'intro', title: 'Two houses, one hour', startsAt: 0 },
      { id: 'building-blocks', title: 'The building blocks of sleep', startsAt: 166 },
      { id: 'wake-time', title: 'Waking up at the same time', startsAt: 516 },
      { id: 'napping', title: 'Resting without losing sleep hunger', startsAt: 714 },
      { id: 'sleepy-not-tired', title: 'Waiting until you are sleepy', startsAt: 929 },
      { id: 'close', title: 'The whole day, in four lines', startsAt: 1135 },
    ],
    coreMessage:
      "You can build your body's own drive for sleep, a little each day, through small choices about waking, resting, and going to bed.",
    transcript: [
      { speaker: 'Narrator', text: 'It is ==twenty past two== at night. The house is quiet, but it is not silent.' },
      {
        speaker: 'PLE',
        text: 'Sometimes I can go back to sleep and other times I think it is pointless. So I get up and I go and sit in my family room and hope that I will go back to sleep.',
      },
      {
        speaker: 'Expert',
        text: 'Sleep is not something that simply happens to you. It is an active process, and your body and brain work at it every night.',
      },
      {
        speaker: 'Expert',
        text: 'Sleep does not run as one unbroken block. It moves in cycles of about ninety minutes, and after each one there is a brief awakening.',
      },
      {
        speaker: 'Expert',
        text: 'From the moment you get up, your body builds a pressure to sleep. We call that your sleep drive. Your hunger for sleep.',
      },
      {
        speaker: 'Expert',
        text: 'Your sleep hunger starts building the moment you wake. Sleep in two hours and you have started two hours late.',
      },
      {
        speaker: 'Narrator',
        text: 'Three ordinary things build that hunger. A regular wake time. Limiting afternoon naps. And getting into bed only once you are sleepy.',
      },
      {
        speaker: 'Expert',
        text: 'If you truly need a nap, keep it short. Twenty to thirty minutes, earlier rather than later, so there is still enough of the day left.',
      },
      {
        speaker: 'Expert',
        text: 'Tired is what the day does to you. Sleepy is physical and your body tells you it is ready. Heavy eyes. Reading the same line three times over.',
      },
      {
        speaker: 'Carer',
        text: 'If my mind will not switch off, I start literally to count sheep or to count my breathing, to keep my mind from doing other things.',
      },
    ],
    // One per numbered chapter — the intro and the close have no summary card.
    // Four cards against three pillow styles, so style 1 comes round again.
    summaryCards: [
      {
        chapterId: 'building-blocks',
        number: '01',
        lead: "You can't change every waking. You can build your sleep drive.",
        bullets: [
          'Waking in the night is normal. Everyone surfaces between sleep cycles, and most of us never remember it.',
          "Nightmares, reflux, and the sleep changes that come with dementia aren't habits, and they aren't anyone's fault.",
          "Three everyday things reduce your sleep hunger before bedtime: **getting up late, sleeping in the afternoon, and going to bed before you're sleepy.** The next three chapters take one each.",
          'These strategies are a starting point. Your sleep coach can help tailor them to your own circumstances.',
        ],
        style: 1,
      },
      {
        chapterId: 'wake-time',
        number: '02',
        lead: "Sleep in, and the hunger you need by bedtime starts late.",
        bullets: [
          'Aim for a regular wake-up time: within about 30 minutes of the same time each day, not an exact minute.',
          'Even after a bad night. Especially after a bad night.',
          "Getting up is the part that matters for tonight's sleep, not what you manage afterwards.",
          "A regular wake-up time also gives a person living with dementia one predictable thing in a day where a lot else isn't.",
        ],
        style: 2,
      },
      {
        chapterId: 'napping',
        number: '03',
        lead: "An afternoon nap spends the hunger you were saving for tonight.",
        bullets: [
          'Where you can, the first thing to try is waiting. Often the tiredness passes on its own.',
          'If rest is genuinely needed, keep it **short and early**: a 20 to 30 minute micro-break, earlier in the day rather than later.',
          "One person in this module describes the other side of it: a nap can cost her the night and buy her the evening, and some days that's a trade worth making. It's a choice, not a failure.",
          'Whether the nap happens usually has less to do with willpower than with what the day looks like. If afternoons are when you go under, it is easier to have something on at two o\'clock than to fight the chair at two o\'clock.',
        ],
        style: 3,
      },
      {
        chapterId: 'sleepy-not-tired',
        number: '04',
        lead: 'Tired is what the day does to you. Sleepy is heavy eyes.',
        bullets: [
          'Getting into bed before your sleep hunger is strong enough usually just moves the waiting from the couch to the bed.',
          "Lying awake in bed often enough can start to teach your brain that bed is a place where you're awake. The next module is about that.",
          'While you wait: the same small, dull things in roughly the same order each night. **Dull is what gives sleepiness room to turn up.**',
          "If your mind won't switch off, give it one boring job: counting your breaths, or counting sheep.",
        ],
        style: 1,
      },
    ],
  },
}

/**
 * The welcome screen's description.
 *
 * Written from the script's own intro — "we are going to walk through one
 * ordinary day together. From getting up in the morning, back round to going to
 * bed" — rather than from the frame, whose paragraph ("This module covers the
 * essential concepts and frameworks you need to get started...") is template
 * filler that would read identically on all six modules.
 */
const MODULE_INTROS: Record<string, string> = {
  'daytime-habits':
    'Almost everything that decides how you sleep tonight happens during the day. We will walk through one ordinary day together, from getting up in the morning back round to going to bed, and pick up three things you can try in your own days.',
}

/** Everything a module's inner pages need, resolved from the curriculum so the
 *  number and title can never disagree with My Modules or Home. `null` when the
 *  id is not a numbered consumer module, or has no content yet. */
export function moduleLesson(moduleId: string | undefined) {
  if (!moduleId) return null
  const index = CONSUMER_MODULES.findIndex((m) => m.id === moduleId)
  // Index 0 is the always-unlocked pre-module and is not a numbered module.
  if (index < 1) return null
  const episode = MODULE_EPISODES[moduleId]
  if (!episode) return null
  return {
    index,
    id: moduleId,
    title: CONSUMER_MODULES[index].title,
    label: `Module ${index}`,
    intro: MODULE_INTROS[moduleId] ?? '',
    episode,
  }
}

export type ModuleLesson = NonNullable<ReturnType<typeof moduleLesson>>

/* ── Reflection questions ───────────────────────────────────────────────── */

/**
 * One reflection question and its answers — Round 47, frame `910:2367`.
 *
 * **Multi-select, not single.** The frame's own sub copy under every question
 * reads "Choose one or more options", and that is the instruction given
 * directly. The doc writes them as if they were one-of lists, but several
 * genuinely take more than one answer at once ("Both, at different points" and
 * "Hard to say" are not mutually exclusive), so the frame is right.
 */
interface ReflectionOption {
  id: string
  label: string
}

export interface ReflectionQuestion {
  id: string
  prompt: string
  options: ReflectionOption[]
}

/**
 * The five questions are the supplied `BuildingBlocksOfGoodSleep_activities_v2.md`
 * REFLECTION QUESTIONS section, one whole-module set shown after the module
 * finishes. Three things were changed on the way in, all of them this portal's
 * standing conventions rather than edits to the content:
 *
 * 1. **Contractions are spelled out** — "there's" -> "there is", "I'm" -> "I am",
 *    "aren't" -> "are not". Every other consumer surface does (§89), and the
 *    doc's own chapter headings were already normalised this way for the
 *    carousel in Round 46.
 * 2. **No em dashes** (Round 17.1's app-wide sweep; verified at zero in
 *    rendered consumer text in §89.12). Two questions carried one and are
 *    repunctuated, not reworded.
 * 3. Q3's prompt reads "In the afternoon, and you sit down for a minute" in the
 *    doc, which has no main clause. Written here as "It is the afternoon, and
 *    you sit down for a minute" — the reading the sentence plainly intends.
 *
 * Nothing else is reworded: these are a clinician's own words and the point of
 * the screen is that they are recognisable, not tidy.
 */
const MODULE_REFLECTIONS: Record<string, ReflectionQuestion[]> = {
  'daytime-habits': [
    {
      id: 'what-woke-you',
      prompt: 'Think about last night. What woke you?',
      options: [
        { id: 'own-body', label: 'My own body' },
        { id: 'someone-else', label: 'Something or someone else' },
        { id: 'both', label: 'Both, at different points' },
        { id: 'hard-to-say', label: 'Hard to say' },
      ],
    },
    {
      id: 'wake-time',
      prompt:
        'Someone in this module gets up anyway after a rough night, and is still in her dressing gown at eleven. How close is your own wake-up time, day to day?',
      options: [
        { id: 'within-30', label: 'Within about 30 minutes, most days' },
        { id: 'some-days', label: 'Close on some days, quite different on others' },
        { id: 'depends', label: 'It depends entirely on the night I have had' },
        { id: 'not-thought', label: 'I had not thought about my wake-up time before now' },
      ],
    },
    {
      id: 'afternoon',
      prompt: 'It is the afternoon, and you sit down for a minute. What usually happens next?',
      options: [
        { id: 'stay-awake', label: 'I tend to stay awake, and the tiredness passes' },
        { id: 'short-rest', label: 'I have a short rest, around 20 to 30 minutes' },
        { id: 'go-under', label: 'I go under for longer than I meant to' },
        { id: 'not-afternoons', label: 'Afternoons are not when it catches up with me' },
      ],
    },
    {
      id: 'tired-or-sleepy',
      prompt:
        'Now that they have been named separately, which is more familiar to you at bedtime?',
      options: [
        { id: 'sleepy', label: 'I am usually properly sleepy by the time I get in' },
        { id: 'worn-out', label: 'I am worn out from the day, but not sleepy' },
        { id: 'hard-to-tell', label: 'Hard to tell them apart' },
        { id: 'changes', label: 'It changes night to night' },
      ],
    },
    {
      id: 'which-one',
      prompt:
        'Of the three things this module says are yours to work with, which one sounds most like your life?',
      options: [
        { id: 'when-i-get-up', label: 'When I get up' },
        { id: 'afternoon-rest', label: 'Whether I rest in the afternoon' },
        { id: 'into-bed', label: 'How early I get into bed' },
        { id: 'not-sure', label: 'I am not sure yet. I would rather sit with it for now' },
      ],
    },
  ],
}

/** The questions for a module, or an empty list where none are written yet.
 *  The Reflection stage reads its length for the step pips, so a module with no
 *  questions cannot render a one-step flow with nothing in it. */
export function moduleReflection(moduleId: string | undefined): ReflectionQuestion[] {
  if (!moduleId) return []
  return MODULE_REFLECTIONS[moduleId] ?? []
}
