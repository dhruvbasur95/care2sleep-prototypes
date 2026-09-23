/**
 * Round 47 — the module player's content model, rebuilt around the
 * clinician-authored `module.md` block vocabulary.
 *
 * ## What changed and why
 * The previous model (Round 7, Module 4 "Understanding Sleep") baked one
 * fixed chapter shape into its types: `learnVideos`, exactly 3 `cases`,
 * exactly 5 `knowledgeCheck` questions, 5 `whatToExpect` rows. That shape
 * does not exist in the real authoring format. `Coaching modules master/`
 * defines modules as an ordered run of **tagged blocks** grouped into
 * **slides**, where:
 *
 * - a chapter repeats its Know How / You Might Also Hear / Your turn /
 *   Transition unit once per **scenario**, and a chapter can have 1, 2 or 3
 *   scenarios (Module 6: 1, 1, 2);
 * - a slide's block order is only guaranteed stable when module.md marks it
 *   `{keep this slide structure same}` — every other slide is read fresh
 *   from that instance (workflow §2a). Module 6 Chapter 3's second Know How
 *   really does omit the `<Intro block_2>` its first one has.
 *
 * So the model here is literal: a module is slides, a slide is an ordered
 * `Block[]`, and a `Block` is a discriminated union keyed by its module.md
 * tag. Nothing counts blocks or assumes positions. Adding a scenario to a
 * chapter is adding four slides to an array, not a type change.
 *
 * ## Source
 * `Coaching modules master/Modules/Module 6.md`, transcribed verbatim.
 * **That file is read-only** — never edit it; flag discrepancies in
 * conversation instead. Known content flags for this module are listed in
 * `CONTENT_FLAGS` at the foot of this file rather than silently corrected.
 *
 * ## Two rules that are easy to get wrong
 * 1. **One `<Video block>` is exactly ONE video**, however many rows its
 *    content table carries. Chapter 1's Know What table has five rows; that
 *    is the brief for a single video, not five videos.
 * 2. **Scenario dialogue scripts are production material, not learner
 *    copy.** They are carried here for whoever shoots the video and are
 *    never rendered in the player.
 */

/** One attributed quote — the `Quotes_` atom (`2584:1049`). */
export interface Quote {
  text: string
  /** e.g. "Care partner" / "Person with lived experience". */
  attribution: string
}

/**
 * One row of an `<Accordion with image block>` (`2697:25053`).
 *
 * Deliberately the same `subtitle` + `body` shape as a `text-3` block, because
 * that is exactly what these are: consecutive `<Text block_3>` items from
 * module.md, grouped for presentation rather than re-authored.
 */
export interface AccordionImageItem {
  subtitle: string
  body: string
  /**
   * The row's own image — per-item by design (direct instruction): the pane
   * holds its position and its *contents* cross-fade as drawers open.
   *
   * Populated 2026-09-18 from the four subjects supplied directly. Stored as a
   * bare asset **STEM**; `illustrations/module/accordion/<stem>.webp` is
   * composed in `AccordionWithImage`.
   *
   * ⚠️ This note used to say the verifier's `authored` tuple would need
   * `image` adding to it when the field was first populated. **It does not**,
   * and no change was made: `verify-transcription.py` skips pure kebab-case
   * literals *before* it applies the 25-character rule, so a stem is exempt on
   * its own. That also means `strengthening-sleep-drive` — exactly 25 chars —
   * passes. Storing a path or an extension would break both exemptions, which
   * is the same reason `heroArt` and `RevisionTerm.art` store stems. Verified:
   * still PASS at 337 strings / 253 literals, unchanged.
   */
  image?: string
}

/** A row of a Know What knowledge-video content table. The whole table is
 *  the brief for ONE video (see the header note) — these rows are never
 *  rendered, they exist so whoever produces the video has the source. */
export interface KnowledgeVideoRow {
  topic: string
  content: string
  /** The source's "Format — select all that apply" column, verbatim and
   *  unresolved: no selection is marked in module.md, so nothing here
   *  decides anything yet. */
  format: string
  notes?: string
}

/** The three `<Interactive block>` patterns. None has a Figma template, so
 *  all three render as a **bare** labelled placeholder (direct instruction,
 *  2026-09-15, overriding workflow §3a's "preserve the content in the
 *  stub"). The content below is still carried in full so the real
 *  components can be built straight from it without re-parsing module.md. */
export type InteractivePattern = 'revision' | 'you-might-also-hear' | 'your-turn'

/**
 * The glyph shown above a transition slide's line of copy.
 *
 * **Per slide, not per block type** (direct instruction: the transition icon
 * has to be content-relevant). A transition slide says what was just covered
 * and where it leads, and those differ every time — one fixed glyph across all
 * four of Module 6's transitions said nothing about any of them.
 *
 * ⚠ **This is the one field on a block that module.md does not supply.** The
 * authoring format has no icon column, so the choice is made here, against the
 * slide's own copy, and is a build-side design decision rather than
 * transcribed content. `verify-transcription.py` therefore must not check it —
 * it is excluded as an authored field. If the authoring template ever gains an
 * icon field, this should read from it instead (see the workflow doc §6.1).
 *
 * Names map to `lucide-react` components in `blocks/BlockRenderer.tsx`. Keep
 * the union small and meaning-bearing; do not add a glyph without a slide that
 * needs it.
 */
export type TransitionIcon = 'blocks' | 'search' | 'scale' | 'sun-moon'

/** Know What revision — glossary term/definition pairs, click to reveal. */
/**
 * The back-of-card glyph for one revision term.
 *
 * ⚠️ **No authoring column** — module.md's Revision row is bold-term/definition
 * pairs and nothing else, so this is chosen in the build against each term's own
 * meaning, like the transition slide's and the chapter-opening topics'.
 * `verify-transcription.py` excludes any key named `icon`, which is why the
 * check still passes with these present.
 */
export type RevisionIcon =
  | 'cooking-pot'
  | 'gauge'
  | 'clock'
  | 'wind'
  | 'zap'
  | 'flask-conical'
  | 'blocks'
  // Chapter 2's terms, added 2026-09-18 when its revision block was populated.
  // `gauge` and `flask-conical` are REUSED there rather than duplicated: its
  // "Sleep Drive" and "Adenosine" are the same two terms chapter 1 defines, so
  // they share both the glyph and the artwork. A second drawing of the same
  // concept would read as two different things.
  | 'activity'
  | 'trending-up'
  | 'sun-moon'
  | 'thermometer'
  | 'utensils'
  | 'hourglass'

export interface RevisionTerm {
  term: string
  definition: string
  /** Optional so a revision block with no glyphs chosen yet still renders —
   *  chapter 2's is deliberately untouched, this round being scoped to chapter
   *  1 ("only update chapter 1 know what revision section for now"). The card
   *  falls back to a neutral mark rather than crashing or leaving a hole. */
  icon?: RevisionIcon
  /** Watercolour art shown INSIDE the front card's pillow, as a bare asset
   *  STEM — `illustrations/module/revision/<stem>.webp` is composed in
   *  `RevisionFlipCards`. Same rule as `heroArt`: store the stem, never the
   *  path or the extension, so `verify-transcription.py`'s 25-character rule
   *  and its kebab-case skip both keep passing.
   *
   *  It depicts the same subject as `icon` — the glyph on the flip side — drawn
   *  in the generated-artwork style (direct instruction, 2026-09-18: blue and
   *  light purple hues). Optional: a term without one shows the plain pillow,
   *  which is what chapter 2's still-untouched revision block does.
   */
  art?: string
}

export interface RevisionContent {
  /** Verbatim run of bold-term/definition pairs from the source's single
   *  "Revision" row, split into terms for the flip cards. */
  terms: RevisionTerm[]
}

/** You Might Also Hear — a realistic client line paired with coach guidance. */
export interface HearPair {
  clientSays: string
  youCanSay: string
}

/** Your turn — one question. `interactionType` is chosen per scenario in
 *  module.md, not per question. */
export interface YourTurnQuestion {
  type: string
  question: string
  selectMode?: string
  options?: string[]
  correctAnswer: string
  correctMessage: string
  wrongMessage: string
}

export type Block =
  | {
      tag: 'module-intro'
      title: string
      expectationSetting: string
      transitionCopy: string
      quotes: Quote[]
    }
  | {
      tag: 'chapter-intro'
      chapterNumber: string
      chapterTitle: string
      whatYouWillLearn: string
      coreSkillsIntro: string
      coreSkills: string[]
      /** Per-chapter hero art for the photo band, as a bare asset STEM —
       *  `illustrations/module/<stem>.webp` is composed in `BlockRenderer`.
       *  Optional: a chapter without one falls back to the shared
       *  `chapter-intro-hero.webp`, so other modules are untouched.
       *
       *  ⚠️ Store the stem, never the path or the extension. This is the same
       *  trap as the YouTube ids: `verify-transcription.py` reports any string
       *  literal of 25+ characters that is not in module.md, and it skips pure
       *  kebab-case, which a `.webp` suffix breaks. A stem is short and
       *  kebab-case, so the check stays untouched.
       *
       *  These are generated artwork, not authored content — module.md has no
       *  row for them, the same as the five icon fields (workflow §6.1 item 5).
       */
      heroArt?: string
    }
  | {
      tag: 'chapter-opening'
      keyTopicsIntro: string
      keyTopics: KeyTopic[]
      quotesIntro: string
      quotes: Quote[]
      transition: string
    }
  /** `<Text block_2>` and `<Intro block_2>` — identical field shape
   *  (Label + Title + Sub-title); the block reference resolves the latter by
   *  reusing the former's component, so they share one tag here. */
  | { tag: 'text-2'; label: string; title: string; subtitle: string }
  /** `<Text block_3>` — Sub-title + Body, repeatable on one slide. */
  | { tag: 'text-3'; subtitle: string; body: string }
  /**
   * `<Accordion with image block>` — Figma `2697:25053`. A **run** of
   * `<Text block_3>` items (the same Sub-title + Body shape, hence the same
   * field names) presented as one single-open accordion beside a per-item image
   * pane, rather than as a stack of paragraphs.
   *
   * This is a presentation choice made in the build, not new content: the items
   * are the source's own consecutive `<Text block_3>` blocks, verbatim.
   * module.md has no tag for it — the same way the transition slide's glyph and
   * the chapter intro's second lead line are build-side (workflow §6.1).
   */
  | { tag: 'accordion-image'; items: AccordionImageItem[] }
  /** `<Text block _Sub title>` — one labelled line of copy. The source's own
   *  field name varies (Introduction / Transition / Sub-title copy) and is
   *  authoring metadata, not rendered. */
  | { tag: 'sub-title'; copy: string; icon?: TransitionIcon }
  /** `<Text block _Body>` — one long-form paragraph. */
  | { tag: 'body'; copy: string }
  | {
      tag: 'video'
      /** Knowledge video (Know What) or scenario video (Know How). */
      variant: 'knowledge' | 'scenario'
      /** Know What only — the multi-row content brief for this ONE video. */
      brief?: KnowledgeVideoRow[]
      /** Know How only — the full SIPTEA-tagged dialogue. Production
       *  material; never rendered. */
      script?: string
      /** Know How only — "Dyad" / "Carer supporting" / "Carer's own issue". */
      scenario?: string
      /**
       * The YouTube video id for this block — the 11 characters after
       * `youtu.be/`, not the whole share link.
       *
       * Present = a real embed replaces the placeholder. Absent = the
       * placeholder, which is still every other video in the module: the
       * project rule is that video blocks stay placeholders until a real asset
       * exists, and this field is how one arrives, not an exception to it.
       *
       * **The id rather than the URL is deliberate, and it keeps
       * `verify-transcription.py` untouched.** That check reads every string
       * literal of 25+ characters and requires it to appear verbatim in
       * module.md; a full share link is 28+ and would be reported as a
       * transcription failure, forcing an exclusion to be added to the
       * verifier itself. An 11-character id falls under the threshold and is
       * skipped on its own — the build's own vocabulary stays out of the check
       * without the check having to be told about it.
       *
       * (`YouTubeEmbed` still parses full `youtu.be` / `watch?v=` / `/embed/`
       * URLs, so pasting one here works — it would just need that exclusion.)
       */
      youtubeId?: string
    }
  | {
      tag: 'interactive'
      pattern: InteractivePattern
      /** The source's own Title row. Three are unfilled in Module 6 — see
       *  `CONTENT_FLAGS`. Kept verbatim rather than invented. */
      title: string
      revision?: RevisionContent
      hearPairs?: HearPair[]
      /** Your turn only — the one interaction type selected for this
       *  scenario. Unmarked in module.md; derived from each question row's
       *  own Type/Select columns and flagged where they disagree. */
      interactionType?: string
      questions?: YourTurnQuestion[]
    }
  | {
      /**
       * Know What's own block (2026-09-16, direct instruction) — a replica of
       * `know-how`, differing only in the eyebrow's glyph and word. Same shape,
       * same three deltas from `<Text block_2>`, and no body: a Know What slide
       * is this intro followed by its own framing copy and knowledge video.
       *
       * Its icon is a build-side choice — module.md has no icon column. See
       * workflow §6.1.
       */
      tag: 'know-what'
      label: string
      title: string
      subtitle: string
    }
  | {
      /**
       * Know How's own block (2026-09-16, direct instruction). `<Text block_2>`
       * plus an icon, a larger label and the wider Label -> Title gap — exactly
       * the three things that distinguish `know-why`, and nothing else. It has
       * **no body**: a Know How slide is a Label/Title/Sub-title intro followed
       * by its own separate scenario video block.
       *
       * Like `know-why`, its icon is a build-side choice — module.md has no
       * icon column. See workflow §6.1.
       */
      tag: 'know-how'
      label: string
      title: string
      subtitle: string
    }
  | {
      /**
       * Know Why's own block (2026-09-16, direct instruction). Previously a
       * `text-2` plus a separate `body` block, which put the body in its own
       * 40px box a 40px gap away; the section reads as one thought, so the
       * body moves up under the sub title with 24px between them.
       *
       * Its `icon` is the second field in this file that module.md does not
       * supply — the transition slide's is the first. See workflow §6.1.
       */
      tag: 'know-why'
      label: string
      title: string
      subtitle: string
      body: string
    }
  | {
      tag: 'chapter-outro'
      moduleSummary: string
      comingUpNext: string
      nextModuleCopy: string
    }

/**
 * The glyph a Chapter-opening key topic carries.
 *
 * ⚠️ Like the transition slide's, this field has **no authoring column** —
 * module.md lists key topics as bare lines of copy. So the choice is made in
 * the build against each topic's own words, and `verify-transcription.py`
 * excludes any key named `icon` for exactly this reason. See workflow §6.1.
 */
export type TopicIcon =
  | 'cooking-pot'
  | 'layers'
  | 'puzzle'
  | 'workflow'
  | 'gauge'
  | 'clipboard-list'
  | 'dumbbell'
  | 'sliders-horizontal'
  | 'route'

export interface KeyTopic {
  text: string
  icon: TopicIcon
}

export interface Slide {
  id: string
  /** The outline rail's sub-step label. **A fixed set of seven names, one
   *  per slide type in a chapter, carrying no numbers at all** (direct
   *  instruction, 2026-09-16): Opening topic · Know what · Know how · You
   *  might also hear · Your turn - recall and apply · Transition · Know why.
   *  A chapter with two scenarios repeats four of them verbatim rather than
   *  suffixing "1"/"2" — the rail is a list of *kinds* of slide, and the
   *  chapter's order already says which pass a row belongs to.
   *
   *  This was previously the source's own slide label ("1.2 Know What —
   *  Learn"); slide *numbers* have never been shown to the learner and the
   *  qualifying phrases ("— learn", "— skills in scenario", "— support the
   *  client") went with them. */
  navLabel: string
  /** `{keep this slide structure same}` in the source — a fixed-template
   *  slide whose block order is locked across modules (workflow §2a).
   *  Recorded so a future module's parse can be cross-checked, not used to
   *  branch any rendering. */
  fixedTemplate: boolean
  blocks: Block[]
}

export interface ChapterContent {
  number: number
  title: string
  /** Read from the source's own numbered slide labels ("3.3 Know How 1",
   *  "3.5 Know How 2"), never inferred by counting blocks. */
  scenarioCount: 1 | 2 | 3
  slides: Slide[]
}

/** The "MODULE SETUP" / "Module brief" table, which sits outside the slide
 *  sequence. Not a slide: it is the source for the **module overview
 *  page**, the page outside the player. */
export interface ModuleSetup {
  name: string
  coreMessage: string
  coreSkillsIntro: string
  coreSkills: string[]
}

export interface ModuleContent {
  moduleId: string
  setup: ModuleSetup
  introSlide: Slide
  chapters: ChapterContent[]
  outroSlide: Slide
}

/* ------------------------------------------------------------------ */
/* Module 6 — The Building Blocks of Good Sleep                        */
/* Source: `Coaching modules master/Modules/Module 6.md` (read-only).   */
/* ------------------------------------------------------------------ */

const M6_SETUP: ModuleSetup = {
  name: 'Module 6 - The Building Blocks of Good Sleep',
  coreMessage:
    'Understand the key foundations of good, consistent sleep, what sleep drive is, and simple ways to strengthen your body’s natural drive for sleep.',
  coreSkillsIntro: 'In this module, you\'ll learn about these core skills:',
  coreSkills: [
    'S - Shared Understanding',
    'I - Implementation Intent',
    'P - Problem Identification',
    'T - Tailoring',
    'E - Emotion Navigation',
    'A - Action and Goals',
    'Active Listening',
    'Reflective Listening - Paraphrasing, rephrasing, summarising, Checking Understanding',
    'Building Rapport - Positivity, Coordination',
    'Open Questions',
    'Closed Questions',
    'Validation',
    'Normalisation',
    'Empathy',
    'Communication - Clear, simple language',
    'Person-Centred Communication',
    'Non-judgemental Communication',
    'Rapport Building - Positivity and Coordination',
    'Goal-Setting',
  ],
}

const M6_INTRO_SLIDE: Slide = {
  id: 's1-module-intro',
  navLabel: 'Module introduction',
  fixedTemplate: true,
  blocks: [
    {
      tag: 'module-intro',
      title: 'Before you begin',
      expectationSetting:
        'This module introduces the three foundations of healthy sleep: sleep drive, the body clock, and a calm mind. You’ll learn what sleep drive is, why it matters for good, consistent sleep, and practical strategies for strengthening your body’s natural drive for sleep, including how to tackle common difficulties that individuals may experience when using these strategies.',
      transitionCopy: 'Here’s what you can expect to hear from your clients.',
      quotes: [
        {
          text: 'It suits me that she stays in bed all day — she’s not at fall risk. I know how that sounds, but I’m just so tired.',
          attribution: 'Care partner',
        },
        {
          text: 'I feel like I should be able to sleep. I don’t know why I can’t.',
          attribution: 'Person with lived experience',
        },
        {
          text: 'When I don’t sleep well, everything else gets harder the next day.',
          attribution: 'Care partner',
        },
      ],
    },
  ],
}

const M6_OUTRO_SLIDE: Slide = {
  id: 's30-module-outro',
  navLabel: 'Module summary',
  fixedTemplate: true,
  blocks: [
    {
      tag: 'chapter-outro',
      moduleSummary:
        'In this module, you’ve learned how sleep drive builds and decreases across the day, and how it works alongside the body clock to regulate sleep and wakefulness. You’ve explored practical ways to protect and strengthen sleep drive, including keeping a consistent wake time, managing daytime naps, and avoiding going to bed before they feel sleepy. You’ve also considered how to explore sleep and wake patterns and adapt these strategies to the individual needs, routines, and caring responsibilities of your client.',
      comingUpNext: 'Module 7',
      nextModuleCopy:
        'Retraining the Brain Where to Sleep, we will introduce Stimulus Control, and understand how our brain learns to connect the bed with sleep.',
    },
  ],
}

const M6_CHAPTER_1: ChapterContent = {
  number: 1,
  title: 'The Foundations of Good Sleep',
  scenarioCount: 1,
  slides: [
    {
      id: 's2-ch1-intro',
      navLabel: 'Chapter introduction',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-intro',
          chapterNumber: 'Chapter 1',
          heroArt: 'm06-ch1-cover',
          chapterTitle: 'The Foundations of Good Sleep',
          whatYouWillLearn:
            'In this chapter, you\'ll learn about the three ingredients behind healthy sleep and how they work together.',
          coreSkillsIntro: 'In this chapter, you\'ll learn about these core skills:',
          coreSkills: [
            'S - Shared Understanding',
            'T - Tailoring',
            'E - Emotion Navigation',
            'Building Rapport - Positivity, Coordination',
            'Open Questions',
            'Validation',
            'Normalisation',
            'Empathy',
            'Reflective Listening - Paraphrasing',
            'Communication - Clear, simple language',
            'Person-Centred Communication',
          ],
        },
      ],
    },
    {
      id: 's3-ch1-opening',
      navLabel: 'Opening topic',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-opening',
          keyTopicsIntro: 'Here’s what you\'ll learn:',
          keyTopics: [
            { text: 'Introduce The Good Sleep Recipe', icon: 'cooking-pot' },
            { text: 'Brief introduction to each of the ingredient', icon: 'layers' },
            { text: 'Understand how these ingredients work together to support good quality sleep', icon: 'puzzle' },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'The problem is getting to sleep. Once I’m asleep, I don’t wake up.',
              attribution: 'Care partner',
            },
            {
              text: 'He just sleeps, constantly. It’s me that can’t sleep.',
              attribution: 'Care partner',
            },
            {
              text: 'The brain’s not tired. It can’t switch off.',
              attribution: 'Person with lived experience',
            },
          ],
          transition:
            'None of these come down to one thing going wrong. For one person, it\'s the getting to sleep in the first place. For another, it\'s watching their partner drop straight off while they\'re still lying there wide awake. For someone else, it\'s a mind that just won\'t switch off. Sleep isn\'t something you can just try harder at. It depends on three things lining up together. That\'s what this chapter introduces: the Good Sleep Recipe, three ingredients that work together to help someone fall asleep and stay asleep. Now you\'ll learn about the science behind the Good Sleep Recipe.',
        },
      ],
    },
    {
      id: 's4-ch1-know-what',
      navLabel: 'Know what',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-what',
          label: 'Know What',
          title: 'Learn about the Good Sleep Recipe',
          subtitle:
            'The three ingredients behind good sleep and how they come together to help your clients sleep better.',
        },
        {
          tag: 'sub-title',
          copy: 'Good sleep depends on a few key ingredients that work together to help individuals fall asleep and stay asleep. Now let\'s watch a video to learn more about the Good Sleep Recipe.',
        },
        {
          tag: 'video',
          variant: 'knowledge',
          // Chapter 1's Know What video — the first real asset in the
          // module; every other video block is still a placeholder.
          youtubeId: 'cFzVSt6Dbsc',
          brief: [
            {
              topic: 'The Good Sleep Recipe',
              content:
                'One of the core messages of the Care2Sleep program is that good sleep depends on a few key ingredients that work together to help individuals fall asleep and stay asleep. These include building sleep drive, keeping the body clock in sync, and calming the mind and body before bed.',
              format: 'Video  Website text  Audio only',
              notes: 'Optional',
            },
            {
              topic: 'Video_K1_Sleep Drive',
              content:
                'This is our hunger for sleep. From the moment we wake, this drive (or hunger) gradually builds, getting stronger the longer we stay awake. The more it builds, the easier it is to fall asleep. Ideally, we want to be very “hungry” for sleep when we get into bed each night!',
              format: 'Video  Website text  Audio only',
              notes:
                'If an image or graphic is used for the three ingredients, then I would suggest the same visual be used across modules (e.g., Body Clock in Module 8, Calm, Mind and Body in Module 9, etc.',
            },
            {
              topic: 'Video_K1_Body Clock',
              content:
                'Also known as our circadian rhythms. This is the part of our brain that sends our body signals when it is time to be awake and when it is time to be asleep. Our body clock is mainly regulated by light and keeps us in tune with the outside world on a roughly 24-hour routine.',
              format: 'Video  Website text  Audio only',
              notes:
                'If an image or graphic is used for the three ingredients, then I would suggest the same visual be used across modules (e.g., Body Clock in Module 8, Calm, Mind and Body in Module 9, etc.',
            },
            {
              topic: 'Video_K1_Calm Mind and Body',
              content:
                'A busy mind or tense body can make it hard to fall asleep. Think of it like an internal alarm system. Stress, worry, and heightened alertness can interfere with sleep by keeping the brain and body in a state of “readiness”. This is sometimes called hyperarousal - when the mind and body remain more activated than is helpful for sleep.',
              format: 'Video  Website text  Audio only',
              notes:
                'If an image or graphic is used for the three ingredients, then I would suggest the same visual be used across modules (e.g., Body Clock in Module 8, Calm, Mind and Body in Module 9, etc.',
            },
            {
              topic: 'Video_K1_Bringing the ingredients together',
              content:
                'These three ingredients work together so that sleep is best when we: Are hungry for sleep Sleep at a time consistent with our body clock Have a calm mind and body',
              format: 'Video  Website text  Audio only',
              notes:
                'The initial part could be part of the video, together with the three ingredients above, but then the rest of this content (e.g., From',
            },
          ],
        },
        {
          tag: 'sub-title',
          copy: 'Throughout this program, every strategy is designed to strengthen one or more of these three ingredients. Some strategies help build sleep drive, others strengthen the body clock, while others calm the mind and body. Together, they create the best conditions for healthy sleep. However, we know that sleep challenges and the circumstances surrounding them are unique to each person. As your client progresses through these modules, some strategies may feel general in nature or not immediately suitable for them. As the coach it will be your role to discuss how these strategies may be adapted, prioritised, and applied in a way that best fits their individual circumstances, needs, and preferences. The goal is to find strategies and routines that are realistic and sustainable, rather than aiming for perfection!',
        },
        {
          tag: 'interactive',
          pattern: 'revision',
          title: "Now that you've gone through the video, let's revise some of the key words. Tap on each word card to reveal more information about it.",
          revision: {
            terms: [
              {
                term: 'Good Sleep Recipe',
                icon: 'cooking-pot',
                art: 'good-sleep-recipe',
                definition:
                  'Good sleep depends on three ingredients: sleep drive, body clock, and a calm mind and body.',
              },
              {
                term: 'Sleep Drive',
                icon: 'gauge',
                art: 'sleep-drive',
                definition:
                  'The body\'s natural, increasing need for sleep that builds the longer we remain awake. The longer we are awake, the stronger it gets.',
              },
              {
                term: 'Body Clock',
                icon: 'clock',
                art: 'body-clock',
                definition:
                  'Also known as our circadian rhythms. The part of the brain that signals when it\'s time to be awake and when it\'s time to sleep. Mainly regulated by light, and keeps us in tune with the outside world on a roughly 24-hour routine.',
              },
              {
                term: 'Calm Mind and Body',
                icon: 'wind',
                art: 'calm-mind-body',
                definition:
                  'A busy mind or tense body can make it hard to fall asleep. Stress, worry, and heightened alertness interfere with sleep by keeping the brain and body in a state of "readiness.',
              },
              {
                term: 'Hyperarousal',
                icon: 'zap',
                art: 'hyperarousal',
                definition:
                  'When the mind and body remain more activated than is helpful for sleep (the state caused by stress, worry, or heightened alertness working against a calm mind and body).',
              },
              {
                term: 'Adenosine',
                icon: 'flask-conical',
                art: 'adenosine',
                definition:
                  'A naturally occurring chemical in the brain that gradually builds up the longer we\'re awake. As it accumulates, our drive for sleep becomes stronger, making us feel increasingly sleepy.',
              },
              {
                term: 'The Three Ingredients Working Together',
                icon: 'blocks',
                art: 'three-together',
                definition:
                  'Sleep is best when someone is: hungry for sleep, sleeping at a time consistent with their body clock, and has a calm mind and body.',
              },
            ],
          },
        },
        {
          tag: 'sub-title',
          copy: 'Knowing the three ingredients is one thing, using them in an actual conversation is another. The next section shows what that sounds like in practice: a coach walking a dyad through the Good Sleep Recipe, and the kinds of pushback and questions that tend to come up along the way.',
        },
      ],
    },
    {
      id: 's5-ch1-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'Watch how a coach explains the three sleep ingredients in a real conversation, and which skills they use to do it',
        },
        {
          tag: 'sub-title',
          copy: 'Now you\'ll watch a video of the coach explaining the three sleep ingredients to the dyad. As you watch, look out for the tags showing which core skill is being used at each moment.',
        },
        {
          tag: 'video',
          variant: 'scenario',
          // Chapter 1's Know How scenario video ('Dyad').
          youtubeId: 'Tz9kXuPkudY',
          scenario: 'Dyad',
          script:
            'Coach (S - Shared Understanding; Open Questions): This week your module talked about the Good Sleep Recipe. I thought we could spend a few minutes just checking in on it together. How did you find that part of the module? / Care Partner: I remember there were three things, but I can’t remember all of them. / Person Living with Dementia: Something about sleep hunger and the body clock, but I’m not sure about the third one. / Coach (S - Shared Understanding; Building Rapport - Positivity, Coordination): That’s a great start! There’s quite a bit of information in the modules, let’s go over the three ingredients now. / Coach: So, the three ingredients are sleep drive, your body clock, and a calm mind and body. They each play a part in helping us get ready for and maintain sleep. / Coach (S - Shared Understanding; Open Questions): Thinking about those three, what do you remember what sleep drive means? / Care Partner: Is that how tired you are? / Coach (S - Shared Understanding; Building Rapport - Positivity, Coordination): Yes, that’s a good way of thinking about it. Sleep drive is like our hunger for sleep. It builds the longer we’re awake, helping us feel ready to sleep. / Coach (S - Shared Understanding; Communication - Clear, simple language): The second ingredient is the body clock. This is our internal timing system that helps tell our body when it’s time to be awake and when it’s time to sleep. Light is one of the main things that helps keep that clock in sync. / Person Living with Dementia: And the third one is keeping calm? / Coach (S - Shared Understanding; Building Rapport - Positivity, Coordination): Exactly. The third ingredient is a calm mind and body. If we’re worried, stressed or physically tense, our brain and body can stay more alert, which can make it harder to settle into sleep. / Care Partner: I do tend to worry about things once I get into bed. / Coach (S - Shared Understanding; E - Emotion Navigation; Validation, Normalisation, Empathy): That makes sense. It’s very common for worries to feel stronger at bedtime, when the day quiets down and there’s more space to notice what’s on your mind. / Coach: So, the three ingredients work together: We want to build up enough hunger for sleep, have our sleep occurring at a time that fits with our body clock, and help the mind and body settle for sleep. / Coach (S - Shared Understanding; I - Implementation Intent; T - Tailoring; Open Questions, Person-Centred Communication): Looking at those three ingredients, which one do you think might be most relevant to what you’ve been experiencing with sleep? / Care Partner: Probably the calm mind and body one. I seem to start worrying as soon as I get into bed. / Coach (S Shared Understanding; Reflective Listening - Paraphrasing): It sounds like your body is ready for bed, but your mind can still be quite active, making it hard to settle into sleep. / Coach: That gives us somewhere useful to start. We’ll keep coming back to these three ingredients throughout the program and explore which strategies might help strengthen one or more of them.',
        },
      ],
    },
    {
      id: 's6-ch1-you-might-also-hear',
      navLabel: 'You might also hear',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title:
            'Aside from the scenario that you watched previously, your clients might also say a few other things. Here is what you can say in response.',
          hearPairs: [
            {
              clientSays:
                'I\'m tired all day, so surely I should sleep as soon as my head hits the pillow.',
              youCanSay:
                'Explain that sleepiness alone isn\'t the whole story. Sleep drive can be high while the mind and body remain alert or it’s not at a time that fits with the body clock. Reinforce the fact that in this program each strategy is designed to strengthen one or more of the Good Sleep Recipe ingredients.',
            },
            {
              clientSays: 'So which one of these do we need to fix?',
              youCanSay:
                'Explain that the three ingredients are a framework for understanding sleep, rather than three things that necessarily need to be “fixed”. Together, explore which ingredient, or ingredients, may be most relevant. Let them know that each ingredient will be covered in the modules.',
            },
            {
              clientSays:
                'I know all of this already… we just need something that will actually help. We\'ve tried everything and nothing works.',
              youCanSay:
                'Validate the frustration and avoid promising a quick fix. Acknowledge that they have already covered the information and avoid repeating it unnecessarily. Shift towards exploring the first set of strategies, covered later in this module.',
            },
            {
              clientSays: 'Their sleep is completely different every night.',
              youCanSay:
                'Look for patterns rather than expecting perfection. Ask about daytime sleep, timing, light/activity and what happens before bed.',
            },
          ],
        },
      ],
    },
    {
      id: 's7-ch1-your-turn',
      navLabel: 'Your turn - recall and apply',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title:
            'Now that you\'ve learned about the Good Sleep Recipe and watched coaching in action, let’s recall some of it',
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'Recall',
              question: 'What are the three ingredients in the Good Sleep Recipe?',
              selectMode: 'Select multiple',
              options: [
                'A. Sleep time',
                'B. Sleep drive',
                'C. Body clock',
                'D. Good hygiene',
                'E. Calm mind and body',
                'F . Melatonin',
              ],
              correctAnswer: 'B. Sleep Drive + C. Body Clock + E. Calm Mind and Body',
              correctMessage:
                'That’s right. These three ingredients work together to create the best conditions for sleep.',
              wrongMessage:
                'Not quite. The three ingredients are sleep drive, body clock, and calm mind and body.',
            },
          ],
        },
      ],
    },
    {
      id: 's8-ch1-transition',
      navLabel: 'Transition',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'sub-title',
          copy: 'The Good Sleep Recipe provides a simple framework for understanding the core strategies in Care2Sleep. As we move into the practical skills, remember that the aim is not to apply every strategy at once, but to consider which ingredients are most relevant to the person’s circumstances and which changes are realistic and sustainable for them.',
          icon: 'blocks',
        },
      ],
    },
    {
      id: 's9-ch1-know-why',
      navLabel: 'Know why',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Why the Good Sleep Recipe Matters',
          subtitle: 'Why this matters for the clients you\'ll be working with',
          body: 'For the clients you\'ll work with, sleep difficulties rarely have one simple cause. Someone may be tired but not sleepy at bedtime because their sleep drive has been reduced by daytime sleep. Someone else may be sleeping at times that don\'t fit well with their body clock. Another person may have plenty of sleep drive but find that worry, stress or the demands of caring keep their mind and body on alert. The Good Sleep Recipe gives you a simple way to make sense of these different experiences without suggesting that there is one solution that works for everyone. As a coach, your role is not to expect people to get all three ingredients “right”. It is to help them notice what may be contributing to their sleep difficulties, identify what matters most to them, and find changes that fit their circumstances.',
        },
      ],
    },
  ],
}

const M6_CHAPTER_2: ChapterContent = {
  number: 2,
  title: 'Understanding Sleep Drive and Our Hunger for Sleep',
  scenarioCount: 1,
  slides: [
    {
      id: 's10-ch2-intro',
      navLabel: 'Chapter introduction',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-intro',
          chapterNumber: 'Chapter 2',
          heroArt: 'm06-ch2-cover',
          chapterTitle: 'Understanding Sleep Drive and Our Hunger for Sleep',
          whatYouWillLearn:
            'In this chapter, you\'ll learn about the science of sleep drive and what can quietly wear it down before bedtime.',
          coreSkillsIntro: 'In this chapter, you\'ll learn about these core skills:',
          coreSkills: [
            'S - Shared Understanding',
            'I - Implementation Intent',
            'P - Problem Identification',
            'T - Tailoring',
            'E - Emotion Navigation',
            'Reflective Listening — Paraphrasing',
            'Reflective Listening - Summarising',
            'Reflective Listening - Checking Understanding',
            'Empathy',
            'Validation',
            'Open Questions',
            'Closed Questions',
            'Clarifying Questions',
            'Active Listening',
            'Non-judgemental Communication',
          ],
        },
      ],
    },
    {
      id: 's11-ch2-opening',
      navLabel: 'Opening topic',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-opening',
          keyTopicsIntro: 'Here’s what you\'ll learn:',
          keyTopics: [
            { text: 'Introduction to the Two-Process Model of Sleep Regulation', icon: 'workflow' },
            { text: 'Describe Sleep Drive (Process S) and how it creates the natural “hunger for sleep”', icon: 'gauge' },
            { text: 'How to assess and identify factors that influence sleep drive', icon: 'clipboard-list' },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'Everyone says don’t have naps, don’t have naps — but with everything that’s wrong with my head and I get so tired, I probably do still need that nap.',
              attribution: 'Person with lived experience',
            },
            {
              text: 'If she’s slept too much during the day, we’ve tried to wake her up more.',
              attribution: 'Care partner',
            },
          ],
          transition:
            'Behind patterns like these is one of the three ingredients from the Good Sleep Recipe: sleep drive. In this chapter, we’ll look more closely at what sleep drive actually is, how it builds across the day, and what can quietly wear it down before bedtime. Now you\'ll learn about the science of sleep drive.',
        },
      ],
    },
    {
      id: 's12-ch2-know-what',
      navLabel: 'Know what',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-what',
          label: 'Know What',
          title: 'What Builds (and Drains) Sleep Drive',
          subtitle: 'The science of sleep drive and what quietly wears it down before bedtime',
        },
        {
          tag: 'sub-title',
          copy: 'Sleep drive is one of the key ingredients behind good sleep, our natural, building drive to fall asleep and stay asleep. Now let’s watch a video to learn more about sleep drive.',
        },
        {
          tag: 'video',
          variant: 'knowledge',
          // Chapter 2's Know What knowledge video — `Care2Sleep_Module6_Chapter2_K`.
          youtubeId: 'tmoqVH0eIXk',
          brief: [
            {
              topic: 'Understand the link between what sleep is and how it is regulated',
              content:
                'In the last module, we explored what sleep is, why it’s important for physical and mental health, and what can happen when we don’t get enough of it. But this raises an important question: how does the body know when it is time to be awake and when it is time to sleep? That is where one of our good sleep ingredients comes into play: Sleep Drive. Sleep Drive is one of two key processes integral to the Two-Process Model of Sleep Regulation.',
              format: 'Video  Website text  Audio only',
              notes: 'Optional',
            },
            {
              topic: 'Video_K2_Two-Process Model of Sleep Regulation',
              content:
                'Developed more than 40 years ago, the Two-Process Model of Sleep Regulation describes how sleep is controlled by two interacting systems: Process S (sleep drive), which builds the longer we stay awake, and Process C (the body clock or circadian rhythm), which helps determine the timing of sleep and wakefulness across the 24-hour day. Together, these two processes interact to influence when we feel sleepy, when we wake up, and how alert we feel during the day. Understanding how sleep drive and the body clock work together can help explain many common sleep difficulties, and guide the strategies you\'ll support your client to try throughout this program. In this module, we will focus on Process S (sleep drive). For more information about Process C (the body clock or circadian rhythm), visit Module 8 - Resetting the Body Clock.',
              format: 'Video  Website text  Audio only',
              notes: 'Optional',
            },
            {
              topic: 'Video_K2_Process S (Sleep Drive)',
              content:
                'Process S refers to homeostatic sleep pressure, or as it’s also known as, Sleep Drive. Sleep drive is the body\'s natural, increasing need for sleep that builds the longer we remain awake. It works much like hunger: the longer we go without food, the hungrier we become, and once we eat, that hunger is satisfied. Similarly, from the moment we wake up, our sleep drive gradually builds throughout the day, reaching its peak by bedtime, before decreasing again while we sleep. This process is driven in part by the gradual build-up of a naturally occurring chemical in the brain, called adenosine. As adenosine accumulates, our drive for sleep becomes stronger, making us feel increasingly sleepy the longer we stay awake. For most people, around 16 hours of wakefulness will build up enough sleep drive to be able to sleep for around 8 hours. However, that means that reducing “sleep hunger” during the day, such as by napping, going to bed too early, or sleeping in, can lower the amount of sleep drive someone has at bedtime. Ideally, we want “sleep hunger” to be at its highest when a person gets into bed, so that falling and staying asleep is easier.',
              format: 'Video  Website text  Audio only',
              notes: 'Optional',
            },
          ],
        },
        {
          tag: 'text-3',
          subtitle:
            'Supporting someone to protect their sleep drive for bedtime, will involve understanding a) their typical routines and b) where sleep-related habits and routines may be influencing the rate or amount of “sleep hunger” has accumulated over the day.',
          body: 'The sleep assessment you do with your client should help you understand some of this background information. you\'ll go through how to do sleep assessment in Module 12 - Sleep Assessment. During your coaching session, it might look like: Understanding how regular their sleep and wake times are from day to day. Asking about naps or periods of daytime sleep, including when they happen, how long they last, and how often. Exploring how long they are awake before going to bed and whether they tend to go to bed because they are sleepy or because it is their usual bedtime. Understanding how the caring role affects their sleep and wake patterns, including whether they need to wake during the night or adjust their routine around the person they support. Exploring what sleep and wake patterns seem to work for the person they are caring for, and what feels realistic to maintain.',
        },
        {
          tag: 'interactive',
          pattern: 'revision',
          title: '<Add copy here>',
          revision: {
            terms: [
              {
                term: 'Sleep Drive',
                icon: 'gauge',
                art: 'sleep-drive',
                definition:
                  'The body\'s natural, increasing need for sleep that builds the longer we remain awake. The longer we are awake, the stronger it gets.',
              },
              {
                term: 'Two-Process Model of Sleep Regulation',
                icon: 'activity',
                art: 'two-process-model',
                definition:
                  'A model (developed more than 40 years ago) describing how sleep is controlled by two interacting systems: Process S and Process C.',
              },
              {
                term: 'Process S',
                icon: 'trending-up',
                art: 'process-s',
                definition:
                  'Homeostatic sleep pressure. It is another name for sleep drive. Builds the longer we stay awake.',
              },
              {
                term: 'Process C',
                icon: 'sun-moon',
                art: 'process-c',
                definition:
                  'The body clock or circadian rhythm. Helps determine the timing of sleep and wakefulness across the 24-hour day.',
              },
              {
                term: 'Homeostatic Sleep Pressure',
                icon: 'thermometer',
                art: 'homeostatic-pressure',
                definition:
                  'Another name for sleep drive (Process S). Our natural, building need for sleep; the longer we are awake, the stronger it gets.',
              },
              {
                term: 'Adenosine',
                icon: 'flask-conical',
                art: 'adenosine',
                definition:
                  'A naturally occurring chemical in the brain that gradually builds up the longer we\'re awake. As it accumulates, our drive for sleep becomes stronger, making us feel increasingly sleepy.',
              },
              {
                term: 'Sleep Hunger',
                icon: 'utensils',
                art: 'sleep-hunger',
                definition:
                  'An informal, everyday way of describing sleep drive. It is used to explain why napping, going to bed too early, or sleeping in can lower how much sleep drive is left by bedtime.',
              },
              {
                term: '16 Hours / 8 Hours',
                icon: 'hourglass',
                art: 'sixteen-eight',
                definition:
                  'Roughly about 16 hours of wakefulness builds enough sleep drive for around 8 hours of sleep.',
              },
            ],
          },
        },
        {
          tag: 'sub-title',
          copy: 'That\'s the theory, but a care partner won\'t come to you talking about “Process S” or “adenosine”. They\'ll tell you their person doesn\'t seem tired at bedtime, or naps at odd times of day. The next section shows how to turn what you now know about sleep drive into the kind of questions that uncover what\'s actually going on.',
        },
      ],
    },
    {
      id: 's13-ch2-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'Watch how a coach explores what\'s affecting sleep drive at bedtime in a real conversation, and which skills they use to do it.',
        },
        {
          tag: 'sub-title',
          copy: 'Now you\'ll watch a video of the coach exploring how daytime naps, time in bed, daily routines, and overnight caregiving may affect the person living with dementia’s sleep drive at bedtime. As you watch, look out for the tags showing which core skill is being used at each moment.',
        },
        {
          tag: 'video',
          variant: 'scenario',
          // Chapter 2's Know How scenario video ('Carer supporting').
          youtubeId: 'EZhldtopOxk',
          scenario: 'Carer supporting',
          script:
            'Care Partner: They just don\'t seem tired at bedtime anymore. Some nights they\'re awake for ages before they finally fall asleep. / Coach (S - Shared Understanding; E - Emotion Navigation; Reflective Listening - Paraphrasing; Empathy; Validation): It sounds like bedtime has become quite difficult, particularly when they\'re not seeming sleepy. / Coach (S - Shared Understanding; Open Questions): I\'d like to understand a little more about what happens across their whole day, because what happens during the day can affect how much sleep hunger builds by bedtime. What does a typical day and night look like for them at the moment? / Care Partner: They usually get up around 8, have breakfast, and then sit in their chair for most of the morning. After lunch they usually fall asleep for a while. / Coach (S - Shared Understanding; Active Listening; Clarifying Questions): Hmm, okay. And when they fall asleep after lunch, roughly what time does that happen and how long would they usually sleep for? / Care Partner: Probably around 1:30. Sometimes it\'s half an hour, sometimes it\'s two hours. / Coach (S - Shared Understanding; Reflective Listening - Summarising/Paraphrasing, Checking Understanding): So there\'s quite a bit of variation in both the timing and length of that daytime sleep. And what time would they usually go to bed in the evening? / Care Partner: Around 8pm. That\'s always been their bedtime. / Coach (S - Shared Understanding; Clarifying Questions): And at 8pm, do they usually seem sleepy and ready to go to bed, or is it more that it\'s their usual routine? / Care Partner: Usually they\'re not that sleepy. We put them to bed because it\'s 8 o\'clock, but then they can be awake until 10. / Coach (S - Shared Understanding; Reflective Listening - Summarising/Paraphrasing, Checking Understanding): That helps me understand the pattern. They may be spending quite a long time in bed before they\'re actually ready to sleep, and the daytime sleep may also be reducing some of the sleep hunger that would otherwise build by the evening. / Care Partner: I hadn\'t thought about the nap affecting bedtime. I thought they needed it because they were tired. / Coach (E - Emotion Navigation; T - Tailoring; Validation; Empathy; Non-judgemental Communication): That makes sense. The nap may well be meeting a genuine need for rest, so I wouldn\'t want to assume it needs to be removed. / Coach (S - Shared Understanding; I - Implementation Intent; Closed/Clarifying Questions): Before we think about changing anything, I\'d also like to understand what the caring role looks like overnight. Do you need to wake them, or change your own routine around them? / Care Partner: Yes, sometimes they\'re awake at 2 or 3 in the morning, and I\'m up with them. It can be so exhausting. / Coach (S - Shared Understanding; P- Problem Identification; E - Emotion Navigation; Validation; Empathy; Reflective Listening - Summarising): That sounds important. Their sleep pattern isn\'t happening in isolation, what happens overnight affects you both, and your routines need to be realistic around the care you\'re providing. / Coach (I - Implementation Intent; P - Problem Identification; T - Tailoring; Person-centred Communication): From what you\'ve described, there are a few things we could keep an eye on: the variable daytime naps, the long period between getting into bed and actually falling asleep, and how consistently they wake and go to bed. We can use that information to work out what, if anything, is worth changing.',
        },
      ],
    },
    {
      id: 's14-ch2-you-might-also-hear',
      navLabel: 'You might also hear',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title:
            'Aside from the scenario that you watched previously, your clients might also say a few other things. Here is what you can say in response.',
          hearPairs: [
            {
              clientSays:
                'Some days they sleep for three hours and other days they don\'t nap at all.',
              youCanSay:
                'Normalise differences day to day, based on physical and cognitive load. Explore what is different on those days (e.g., activity, fatigue, appointments, overnight sleep or routine), and whether the variation corresponds with differences in night-time sleep.',
            },
            {
              clientSays:
                'They\'re in bed for 12 hours, but I don\'t think they\'re actually asleep for all of that.',
              youCanSay:
                'Explore how much time is spent awake, resting or unsettled in bed. This can help distinguish time in bed from actual sleep. Consider whether quiet, relaxing, rest time can be shifted out of the bed.',
            },
            {
              clientSays:
                'I can\'t really keep their routine consistent because of my caring responsibilities.',
              youCanSay:
                'Avoid framing consistency as something they must achieve perfectly. Explore what aspects of the routine are realistically within their control and where small amounts of regularity might be possible.',
            },
          ],
        },
      ],
    },
    {
      id: 's15-ch2-your-turn',
      navLabel: 'Your turn - recall and apply',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title:
            "Now that you've learned what builds and drains sleep drive, and watched coaching in action, let's recall some of it.",
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'Recall',
              question:
                'Which information would be most useful when assessing whether daytime routines may be impacting sleep drive?',
              selectMode: 'Select multiple',
              options: [
                'A. When they nap and how long they sleep during the day.',
                'B. Whether they spend long periods resting or dozing during the day.',
                'C. Their favourite evening television programs.',
                'D. What time they usually go to bed and whether they are sleepy at that time.',
                'E. Whether the bedroom furniture has recently changed.',
              ],
              correctAnswer:
                'A. When they nap and how long they sleep during the day. + B. Whether they spend long periods resting or dozing during the day. + D. What time they usually go to bed and whether they are sleepy at that time.',
              correctMessage:
                'That\'s right. Understanding daytime sleep, activity, bedtime and how sleepy they are at bedtime helps you build a picture of how much sleep hunger may have accumulated.',
              wrongMessage:
                'Not quite. We want to know what sleep routines or patterns may influence sleep drive.',
            },
            {
              type: 'Applied',
              question:
                'A care partner says, “They sleep for two hours after lunch, then we put them to bed at 8pm even though they don\'t seem tired.” What should you do next?',
              selectMode: 'Select one',
              options: [
                'A. Ask when the nap happens, how long it lasts, whether this varies, and how sleepy they are at bedtime.',
                'B. Recommend immediately stopping the nap so they will definitely sleep at night.',
                'C. Tell them to put the person to bed even earlier so they have more opportunity to sleep.',
                'D. Focus only on what happens during the night, because daytime routines don\'t affect sleep drive.',
              ],
              correctAnswer:
                'A. Ask when the nap happens, how long it lasts, whether this varies, and how sleepy they are at bedtime.',
              correctMessage:
                'That\'s right. Before recommending a change, explore the pattern. The timing and length of the nap, along with how sleepy they are at bedtime, can help you understand whether daytime sleep may be reducing sleep hunger.',
              wrongMessage:
                'Not quite. The coach should first understand the pattern rather than assuming the nap needs to stop or that an earlier bedtime will help. The assessment helps identify which, if any, part of the routine may be influencing sleep drive.',
            },
          ],
        },
      ],
    },
    {
      id: 's16-ch2-transition',
      navLabel: 'Transition',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'sub-title',
          copy: 'Once you can recognise the patterns that may be influencing sleep drive, the next step is to use that information to work with the client on changes that are realistic, meaningful and sustainable..',
          icon: 'search',
        },
      ],
    },
    {
      id: 's17-ch2-know-why',
      navLabel: 'Know why',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Why Understanding Sleep Drive Matters',
          subtitle: 'Why this matters for the clients you\'ll be working with',
          body: 'For the clients you\'ll work with, understanding sleep drive starts with understanding what happens across the whole day. A person living with dementia may nap because they are genuinely tired, spend long periods resting, or have an irregular sleep-wake pattern. A care partner may adjust their own routine around overnight care, sleep in after a difficult night, or go to bed earlier because they are worried about being exhausted the next day. These responses are understandable, but they can also change how much sleep hunger has built by bedtime. A good assessment helps you look for these patterns without assuming that any one behaviour is the problem. A long daytime nap, for example, may be important recovery time for the person, while an early bedtime may be the only way a care partner feels they can manage after a difficult night. The important question is how these patterns relate to what happens at night and what the client wants to change.',
        },
      ],
    },
  ],
}

/**
 * Chapter 3 is the module's only multi-scenario chapter: the Know How /
 * You Might Also Hear / Your turn / Transition unit runs **twice** (Carer
 * supporting, then Carer's own issue), per the source's own numbered slide
 * labels "3.3 Know How 1" and "3.5 Know How 2".
 *
 * Note the two Know How slides are deliberately **not** symmetrical — the
 * second omits the `<Intro block_2>` and the intro `<Text block _Sub title>`
 * the first carries. That is how the source is authored; Know How is a
 * variable slide, so its block order is read per instance (workflow §2a)
 * rather than copied from the chapter's first scenario.
 */
const M6_CHAPTER_3: ChapterContent = {
  number: 3,
  title: 'Strengthening Sleep Drive',
  scenarioCount: 2,
  slides: [
    {
      id: 's18-ch3-intro',
      navLabel: 'Chapter introduction',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-intro',
          chapterNumber: 'Chapter 3',
          heroArt: 'm06-ch3-cover',
          chapterTitle: 'Strengthening Sleep Drive',
          whatYouWillLearn:
            'In this chapter, you will learn about practical strategies for strengthening sleep drive, and how to adapt them to each client’s circumstances.',
          coreSkillsIntro: 'In this chapter, you will learn about these core skills:',
          coreSkills: [
            'S - Shared Understanding',
            'I - Implementation Intent',
            'P - Problem Identification',
            'T - Tailoring',
            'E - Emotion Navigation',
            'A - Action and Goals',
            'Active Listening',
            'Reflective Listening - Paraphrasing, rephrasing, summarising, checking understanding',
            'Open Questions',
            'Empathy',
            'Validation',
            'Normalisation',
            'Non-judgemental Communication',
            'Person-Centred Communication',
            'Communication - Clear, simple language',
            'Rapport Building - Positivity and Coordination',
            'Goal-Setting',
          ],
        },
      ],
    },
    {
      id: 's19-ch3-opening',
      navLabel: 'Opening topic',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-opening',
          keyTopicsIntro: 'Here’s what you will learn:',
          keyTopics: [
            { text: 'Identify practical strategies for strengthening sleep drive', icon: 'dumbbell' },
            { text: 'Apply sleep drive strategies to individual circumstances', icon: 'sliders-horizontal' },
            { text: 'Recognise common barriers to using sleep drive strategies and ways to adapt strategies', icon: 'route' },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'I tend to work late into the night because everything calms down and there’s no demands on my time. Before I know it, it’s 3 or 4 in the morning and I’m not in the least sleepy. Then I get up at a semi-normal time and within an hour I really just want to go back to bed.',
              attribution: 'Care partner',
            },
            {
              text: 'It’s very hard to change a habit, especially when everyone sleeps so differently.',
              attribution: 'Person with lived exoerience',
            },
          ],
          transition:
            'Once you can recognise what may be affecting someone’s sleep drive, the next question is what to actually do about it. In this chapter, we’ll walk through three practical strategies for protecting and strengthening sleep drive, and how to adapt them when a client’s routine or caring responsibilities make them harder to follow.',
        },
      ],
    },
    {
      id: 's20-ch3-know-what',
      navLabel: 'Know what',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-what',
          label: 'Know What',
          title: 'Learn about the ways to build stronger Sleep Drive',
          subtitle:
            'Practical, everyday strategies for helping a client strengthening their sleep drive',
        },
        {
          // The slide's four `<Text block_3>` strategies, presented as one
          // accordion beside a per-item image pane (Figma `2697:25053`).
          // Copy is the source's, verbatim and in source order; only the
          // presentation changed.
          tag: 'accordion-image',
          items: [
          { subtitle: 'Strengthening Sleep Drive', image: 'strengthening-sleep-drive', body: 'Building a strong sleep drive involves protecting our hunger for sleep. Many factors can affect sleep for people living with dementia and the people who support them at home. These factors can sometimes make it harder to build enough sleep pressure for a good night’s sleep. Reducing “sleep hunger” during the day, such as by napping, going to bed too early, or sleeping in, can lower the amount of sleep drive that has built by bedtime. Ideally, we want our sleep hunger to be at its highest when we get into bed, so that falling and staying asleep is easier. Strengthening sleep drive is one strategy that may help support a more regular sleep pattern.' },
          { subtitle: 'Keep a consistent wake-up time', image: 'consistent-wake-time', body: 'Waking up at the same time each day helps the body build sleep pressure at a predictable rate, making it easier to feel sleepy at night. For people living with dementia, a regular wake time can also provide structure and routine, which may support more consistent sleep-wake patterns. If needed, aim to wake within a consistent window (for example, within 30-minutes of their usual wake time) in order to create regularity to support sleep without needing to follow an exact schedule. The best wake-up time will depend on the person’s sleep needs, daily activities, health, and individual circumstances. Work with them to determine the routine that will work best for them, rather than aiming for perfection.' },
          { subtitle: 'Avoid or limit daytime naps', image: 'limit-daytime-naps', body: 'Napping reduces our “sleep hunger,” which can make it harder to fall asleep at bedtime. However, we know that sometimes daytime rest can be important, especially if someone is experiencing poor-quality sleep, increased fatigue, or reduced energy due to dementia and/or caregiving responsibilities. Similarly, for people living with dementia, naps may also be an important source of rest and help to limit agitation and confusion, particularly in the afternoons and evenings. In these situations, shorter naps or “micro-breaks” may help reduce excessive sleepiness while still protecting nighttime sleep. Therefore, where possible, protect this sleep hunger by avoiding naps. However, if naps are unavoidable, consider taking shorter naps earlier in the day (20-30-minutes or less) which won’t chip away at sleep drive. Longer naps or stretches of sleep, particularly in the late afternoon or evening, can make it hard to get to sleep or stay asleep at night. The aim is to find a balance that supports daytime well-being while maintaining enough sleep drive for night-time sleep.' },
          { subtitle: 'Avoid going to bed too early', image: 'not-too-early-to-bed', body: 'Going to bed before we feel sleepy can weaken sleep drive. This means there may not be enough sleep drive to get us to sleep or to keep us asleep over the night! It may also lead to more time lying awake in bed. Spending long periods awake in bed can also create frustration and make the bed feel associated with wakefulness rather than sleep.' },
          ],
        },
        {
          tag: 'sub-title',
          copy: 'These strategies are straightforward to explain, but not always straightforward to put into practice, especially when a nap feels necessary, or a bad night makes an early bedtime tempting. The next section works through two conversations where a coach helps a care partner find a version of these strategies that actually fits their situation.',
        },
      ],
    },
    {
      id: 's21-ch3-know-how-1',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'Watch how a coach puts these strategies into practice in a real conversation, and which skills they use to do it.',
        },
        // The source's `<Text block_3>` scenario lead-in — "Scenario 1: Carer
        // Supporting" and its paragraph — is **deliberately not rendered**
        // (direct instruction, 2026-09-17, annotated on the live slide: *"get
        // rid of this for now"*). The Know How block above already frames the
        // video, and the lead-in repeated it.
        //
        // "For now" is the operative word: this is a display decision, not a
        // content one. module.md is read-only and still carries the copy, so
        // restoring it is re-adding the block below, nothing more.
        {
          tag: 'video',
          variant: 'scenario',
          // Chapter 3's first Know How scenario video ('Carer supporting').
          youtubeId: 'AsxjB4KoMJ0',
          scenario: 'Carer supporting',
          script:
            'Coach (S - Shared Understanding; Open Questions): You mentioned that they need to nap during the day. Tell me a little more about what the naps look like. / Care Partner: They’re exhausted by lunchtime, so I usually let them sleep. Sometimes they’ll sleep for an hour or two. / Coach (S - Shared Understanding; Reflective Listening - Paraphrasing; Empathy): It sounds like you’re trying to respond to how tired they are and make sure they get the rest they need. / Care Partner: Exactly. And if they don’t nap, then they can be really irritable and confused. But then at night they can take ages to fall asleep, and sometimes they’re awake for hours. / Coach (E - Emotion Navigation; Validation; Empathy): That sounds frustrating, especially when the nap seems to help during the day but then the night can become more difficult. / Coach (S — Shared Understanding; Communication - Clear, simple language): One thing that may help us understand this is the idea of sleep drive. Sleep drive is like a hunger for sleep. It builds the longer we’re awake, and when it’s strong, it helps us fall asleep more easily. / Coach (S — Shared Understanding; Communication - Clear, simple language): A longer or later nap can take some of that sleep drive away. So, even though the person may feel better after the nap, they may have less sleep drive when bedtime comes around. / Care Partner: So are you saying they shouldn\'t nap at all? / Coach (I - Implementation Intent; T - Tailoring; Non-judgemental Communication): Not necessarily. A nap isn\'t automatically a problem, and we don\'t want to assume that stopping naps is the right answer for everyone. / Coach (S - Shared Understanding; P - Problem Identification; Open Questions): What we\'re interested in is whether the timing and length of the nap might be affecting their sleep at night. It would be useful for us to look at when they nap, how long they sleep for, and what happens to their night-time sleep afterwards. / Care Partner: Usually it\'s around one or two o\'clock, but sometimes they fall asleep earlier. Could be 1-2 hours. If they’ve had a bad night, I tend to let them sleep for longer. / Coach (E - Emotion Navigation; Validation; Empathy; Reflective Listening - Rephrasing): In that kind of situation, you\'re responding to a difficult night and trying to help them recover. / Care Partner: But if I think about it, if they have a really long nap, they\'re more likely to be awake at night. / Coach (S - Shared Understanding; Reflective Listening - Paraphrasing; Active Listening): That\'s useful information. It suggests the longer nap might sometimes be reducing the amount of sleep drive they have at bedtime. / Coach (S - Shared Understanding; I - Implementation Intent; Person-Centred Communication; Non-judgemental Communication): We don\'t need to assume that every nap needs changing, though. If the nap is helping them feel better and participate in the day, that matters too. If you\'re comfortable, you could experiment with some small changes and see what happens. / Care Partner: I wouldn\'t want to stop them resting altogether. / Coach (S - Shared Understanding; E - Emotion Navigation; Empathy; Reflective Listening - Paraphrasing): It sounds like making sure they get the rest they need is really important to you. / Coach (I - Implementation Intent; T - Tailoring; Person-centred Communication; Open Questions): If that’s the case, based on what you\'ve noticed, one option we could try is reducing the daytime nap, or on some days seeing whether they can manage without a nap, to give more sleep drive a chance to build by bedtime. How would that feel for you? / Care Partner: I don\'t know if I could do that. They\'re so exhausted by lunchtime, and if they don\'t sleep they\'re really irritable. / Coach (P - Problem Identification; E - Emotion Navigation; Validation; Empathy; Reflective Listening - Paraphrasing): That sounds difficult. You’re seeing that the nap helps them get through the day, so I can understand why stopping it altogether might not feel realistic. / Coach (P - Problem Identification; Open Questions; Person-centred Communication): What do you think would happen if we tried a shorter nap, or tried keeping them awake on a day when they seem a little less tired? / Care Partner: I think a shorter nap might be possible, but I wouldn\'t want to stop it completely. Maybe even bring it a little earlier and see what happens. / Coach (T - Tailoring; Reflective Listening - Paraphrasing; Person-Centred Communication): So keeping some daytime rest feels important, but you might be comfortable experimenting with reducing the amount of sleep rather than removing the nap altogether. / Care Partner: Yeah, I think so. / Coach (I - Implementation Intent; T - Tailoring; A - Action and Goals; Rapport Building - Positivity, Coordination): That sounds like a good place to start. It\'s about finding a balance that gives them the rest they need while allowing enough sleep drive to build for the night. / Coach (P - Problem Identification; T - Tailoring; A - Action and Goals; Open Questions): What do you think would be a realistic change to start with: shortening the nap, bringing it a little earlier, or trying one day without a nap when they\'re not as tired? / Care Partner: Maybe we could try making it earlier first. / Coach (I - Implementation Intent; P - Problem Identification; Empathy; Validation; Open Questions): I can see why you’d want to let them rest when they’re that tired, particularly if the nap helps them get through the day. What do you think would be a realistic time for a nap on a usual day? / Care Partner: Maybe around 12 o\'clock rather than 1:30 or 2. / Coach (T - Tailoring; E - Emotion Navigation; A - Action and Goals; Reflective Listening - Summarising/Paraphrasing; Rapport Building - Positivity; Goal-Setting): That sounds like a reasonable place to start. We could try an earlier nap for the next week and see whether it changes how sleepy they are at bedtime, while also keeping an eye on how they manage during the day. / Coach (I - Implementation Intent; A - Action and Goals; Open Questions; Goal-Setting): And, what might a shorter nap look like in practice? How long do you think would feel manageable for them? / Care Partner: Maybe 30 minutes. I think they could manage that. / Coach (I - Implementation Intent; T - Tailoring; Open Questions): Okay. And when would be the easiest time to try that? / Care Partner: Around 12 o’clock would probably work. / Coach (A - Action and Goals; I - Implementation Intent; Reflective Listening - Summarising; Goal-Setting): So, for the next week, you\'ll aim for a 30-minute nap around 12 o’clock, rather than letting them sleep for one or two hours. / Care Partner: Yes, I think we could try that. And you know, if they’re coping okay, maybe we try no nap at all. / Coach (S - Shared Understanding; A - Action and Goals; I - Implementation Intent; Rapport Building - Positivity): That’s a good thought. We could see how they manage with the earlier and shorter nap first, and if they’re coping well during the day, we can consider whether trying a day without a nap might be useful.',
        },
      ],
    },
    {
      id: 's22-ch3-you-might-also-hear-1',
      navLabel: 'You might also hear',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title:
            'Aside from the scenario that you watched previously, your clients might also say a few other things. Here is what you can say in response.',
          hearPairs: [
            {
              clientSays: 'If I don\'t let them nap, they\'re miserable for the rest of the day.',
              youCanSay:
                'Validate the carer\'s concern. Explore what happens when the person doesn\'t nap, rather than suggesting they simply stop. Observe whether naps improve or worsen night-time sleep. Consider whether the timing or length of the nap could be adjusted while still meeting their need for rest. Aim for naps earlier in the day where possible, rather than late afternoon or evening. Also consider shorter naps (for example, 20–30-minutes) if longer naps appear to affect night-time sleep. Pair this with maintaining a consistent wake-up time where possible to support the build-up of sleep drive.',
            },
            {
              clientSays: 'They fall asleep whenever they sit down. I can\'t keep them awake.',
              youCanSay:
                'Avoid framing this as a failure of the carer or something they must prevent. Explore when this happens, how long they sleep and whether there are patterns across the day. Identify small, realistic changes to the timing or length of rest rather than trying to prevent all daytime sleep. Also consider what “rest” involves and the types of activities they do during this time that might make it more likely that they will fall asleep (e.g., sitting in their favourite chair watching TV). Explore whether the type of activity needs to change.',
            },
            {
              clientSays:
                'It’s not just the person I care for. I need a nap during the day because I am exhausted.',
              youCanSay:
                'Validate the care partners need for rest. Explain that the same idea about sleep drive can apply to them: If a nap is needed, keep it short (around 20–30-minutes where possible) and aim for earlier naps rather than late afternoon or evening sleep. Consider alternatives such as a quiet rest period, relaxation, or a brief walk. Focus on improving night-time sleep rather than relying on long daytime sleep.',
            },
          ],
        },
      ],
    },
    {
      id: 's23-ch3-your-turn-1',
      navLabel: 'Your turn - recall and apply',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title:
            "Now that you've learned about napping and sleep drive, and watched coaching in action, let's recall some of it.",
          interactionType: 'Free-text question',
          questions: [
            {
              type: 'Recall - Free Text',
              question:
                'What is the main reason for considering daytime naps in relation to sleep drive?',
              selectMode: 'N/A',
              correctAnswer:
                'Long or late naps can reduce the amount of sleep drive/hunger that has built at bedtime.',
              correctMessage:
                'Sleep drive builds during time awake, so daytime sleep can sometimes affect how much sleep hunger has built by bedtime. The aim isn\'t to avoid all naps. It\'s to consider whether the timing or duration of daytime sleep is affecting the sleep drive needed for night-time sleep.',
              wrongMessage:
                'N/A',
            },
          ],
        },
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title:
            "Now that you've learned about napping and sleep drive, and watched coaching in action, let's recall some of it.",
          interactionType: 'Ranking question',
          questions: [
            {
              type: 'Applied - Ranking',
              question:
                'How would you respond to a carer who told you that the person they support needs to nap during the day?',
              selectMode: 'Rank 1-4',
              options: [
                '1. Assess whether the nap is actually affecting night-time sleep. If it is helping the person rest and participate in the day, it may not need to change.',
                '2. If the nap appears to be reducing sleep drive at bedtime and affecting night-time sleep, consider whether avoiding the nap altogether is appropriate and realistic.',
                '3. If naps are unavoidable, attempt small changes such as making it shorter or moving it earlier in the day.',
                '4. If night-time sleep continues to be affected despite other adjustments, consider whether reducing or eliminating daytime sleep is appropriate and realistic for this person.',
              ],
              correctAnswer:
                '1. Assess whether the nap is actually affecting night-time sleep. If it is helping the person rest and participate in the day, it may not need to change. 2. If the nap appears to be reducing sleep drive at bedtime and affecting night-time sleep, consider whether avoiding the nap altogether is appropriate and realistic. 3. If naps are unavoidable, attempt small changes such as making it shorter or moving it earlier in the day. 4. If night-time sleep continues to be affected despite other adjustments, consider whether reducing or eliminating daytime sleep is appropriate and realistic for this person.',
              correctMessage:
                'That’s right. Start by assessing whether daytime sleep is impacting sleep at night. When rest is needed, limiting the nap or moving it earlier can help preserve sleep drive for the night.',
              wrongMessage:
                'Not quite. The aim isn’t to eliminate naps automatically. First consider whether the person needs daytime sleep. If they do, look for ways to limit or adjust the nap so they can still rest while allowing sleep drive to build for the night.',
            },
          ],
        },
      ],
    },
    {
      id: 's24-ch3-transition-1',
      navLabel: 'Transition',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'sub-title',
          copy: 'We’ve looked at how to balance daytime rest with sleep drive. Now let’s consider how the care partner’s own sleep routine can affect the same balance.',
          icon: 'scale',
        },
      ],
    },
    {
      id: 's25-ch3-know-how-2',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          // The Know how block template, not the plain `text-3` this slide
          // carried until 2026-09-17 (direct instruction, annotated on the live
          // slide: *"update to know how block"*). It is a Know How slide, and
          // it was the only one in the module whose intro rendered without the
          // section's own eyebrow — slide 21 has a `know-how` block above its
          // scenario line, this one does not, because the source authors the
          // two asymmetrically (see this chapter's own note above).
          //
          // Nothing is invented to do it: the scenario line becomes the
          // template's Title and its paragraph the Sub title, both verbatim.
          // `label` is the template's own fixed word, the same one slide 21
          // already uses.
          tag: 'know-how',
          label: 'Know How',
          title: 'Scenario 2: Carer\'s own issue',
          subtitle:
            'Now you\'ll watch another video of the coach talking with a care partner after a poor night’s sleep, hoping to recover lost sleep and manage tiredness during the day. As you watch, look out for the tags showing which core skill is being used at each moment.',
        },
        {
          tag: 'video',
          variant: 'scenario',
          // Chapter 3's second Know How scenario video ('Carer’s own issue').
          youtubeId: 'CyZ945jJJZc',
          scenario: 'Carer’s own issue',
          script:
            'Care Partner: I sleep in after a bad night. If I\'ve been up a lot with them, I just can\'t face getting up at my usual time. / Coach (S - Shared Understanding; Reflective Listening - Paraphrasing; Empathy; Non-judgemental Communication): That makes a lot of sense. When you\'ve had a broken night, sleeping in can feel like the best way to recover and get through the day. / Care Partner: Exactly. And if I don\'t sleep in, I\'m worried I\'ll be exhausted all day. / Coach (S - Shared Understanding; E - Emotion Navigation; Reflective Listening - Rephrasing; Empathy): It sounds like there\'s a real tension between needing to recover from a difficult night and wanting to sleep better the following night. / Care Partner: Yes. But sometimes I don\'t really have a choice. Their sleep can be so unpredictable. / Coach (S - Shared Understanding; E - Emotion Navigation; Validation; Empathy; Reflective Listening - Paraphrasing) : Absolutely. With caring responsibilities, you may not be able to control when you\'re awake during the night, so following a routine perfectly feels impossible. / Coach (S - Shared Understanding; Communication - Clear, simple language) : One thing we do know is that sleeping in for a long time after a bad night can reduce the amount of sleep hunger that builds during the day. That can make it harder to sleep the following night. / Care Partner: So I\'m supposed to get up even when I\'m exhausted? / Coach (E - Emotion Navigation; Validation; Empathy; Non-judgemental Communication): I can see why that feels difficult, especially when you\'ve already had a disrupted night and need to function during the day. / Coach (I - Implementation Intent; Communication, Clear, simple language): Where it\'s realistic, you could try keeping your usual wake-up time within about 30 minutes, rather than having a long sleep-in. Then, during the day, you could use things like getting some daylight, light activity, or taking a brief rest break to help manage the tiredness. / Care Partner: I\'m not sure I could do that every day. / Coach (P - Problem Identification; T - Tailoring; Open Questions): That\'s okay, we don\'t need to aim for perfection. What might be the smallest change that feels manageable for you, perhaps keeping your wake-up time within 30 minutes on the weekdays when you can? / Care Partner: I think I could try that when the night hasn\'t been completely awful. / Coach (I - Implementation Intent; T - Tailoring; A - Action and Goals; Normalisation; Person-centred Communication) : That sounds like a reasonable place to start. The aim isn\'t to ignore how tired you are or to expect you to manage every night perfectly. It\'s about finding a small, realistic way to rebuild sleep hunger during the day, so your body has more opportunity to sleep the following night. / Care Partner: That feels more manageable than being told I can\'t sleep in at all. / Coach (S - Shared Understanding; T - Tailoring; E - Emotion Navigation; Validation; Reflective Listening - Paraphrasing): It sounds like having some flexibility makes the strategy feel more realistic for your caring role.',
        },
      ],
    },
    {
      id: 's26-ch3-you-might-also-hear-2',
      navLabel: 'You might also hear',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title:
            'Aside from the scenario that you watched previously, your clients might also say a few other things. Here is what you can say in response.',
          hearPairs: [
            {
              clientSays: 'These strategies are difficult because of my caring role.',
              youCanSay:
                'Focus on small, achievable changes rather than perfection (e.g., consistent wake-up time within a 30-minute window). Also identify the most influential change (e.g., adjusting the timing or duration of naps, maintaining a consistent wake time, or changing bedtime routines). Adapt strategies to the caregiver’s and care recipient’s needs or consider support options that allow the caregiver opportunities for recovery.',
            },
          ],
        },
      ],
    },
    {
      id: 's27-ch3-your-turn-2',
      navLabel: 'Your turn - recall and apply',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title:
            'Now that you\'ve learned ways to build stronger sleep drive and watched coaching in action, let\'s recall some of it.',
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'Recall',
              question:
                'Which of the following best explains why keeping a consistent wake-up time can support sleep?',
              selectMode: 'Select one',
              options: [
                'A. It means the person will always feel tired at the same time each evening.',
                'B. It helps sleep drive build at a more predictable rate, supporting sleepiness at night.',
                'C. It allows the person to recover any sleep they lost the night before.',
                'D. It reduces the need for daytime rest altogether.',
              ],
              correctAnswer:
                'B. It helps sleep drive build at a more predictable rate, supporting sleepiness at night.',
              correctMessage:
                'That’s right. A consistent wake-up time helps sleep drive build predictably across the day, which can support sleep at night.',
              wrongMessage:
                'Not quite. The key idea is that a regular wake-up time helps sleep drive build across the day. It isn’t about recovering lost sleep or eliminating the need for rest.',
            },
            {
              type: 'Applied',
              question:
                'A care partner says, “We had a terrible night, so I’m going to sleep in for a few hours and go to bed early tonight.” What would be the most helpful response?',
              selectMode: 'Select one',
              options: [
                'A. Try to get up within about 30 minutes of your usual wake-up time, even after a poor night, so that sleep drive can build again during the day.',
                'B. Stay in bed until you feel fully rested, as getting enough sleep is more important than keeping a regular wake-up time.',
                'C. Go to bed much earlier that evening to make up for the sleep you lost.',
                'D. Avoid any daytime rest or activity so that you are tired enough to sleep that night.',
              ],
              correctAnswer:
                'A. Try to get up within about 30 minutes of your usual wake-up time, even after a poor night, so that sleep drive can build again during the day.',
              correctMessage:
                'Exactly. Keeping your wake-up time reasonably consistent helps rebuild sleep drive for the following night.',
              wrongMessage:
                'Not quite. After a poor night, it can be tempting to stay in bed or go to bed much earlier, but this can reduce the sleep drive that builds during the day. A more helpful approach is to return to your usual wake-up time as much as possible.',
            },
            {
              type: 'Applied',
              question:
                'Another care partner comes to you worried about their sleep. “I’m exhausted after a bad night, so I’m worried I won’t make it through the day. What could I try?!”',
              selectMode: 'Select one',
              options: [
                'A. Stay in bed or take a long nap so you can recover as much sleep as possible during the day.',
                'B. Go to bed much earlier that night, even if you don\'t feel sleepy yet.',
                'C. Use light exposure, some light activity or a brief rest break to help manage tiredness while allowing sleep drive to build.',
                'D. Push through the tiredness without resting at all, because any daytime rest will interfere with sleep that night.',
              ],
              correctAnswer:
                'C. Use light exposure, some light activity or a brief rest break to help manage tiredness while allowing sleep drive to build.',
              correctMessage:
                'That\'s right. Daytime strategies such as light exposure, light activity and brief rest breaks can help you manage tiredness without relying on long periods of daytime sleep. This gives sleep drive a chance to build for the next night.',
              wrongMessage:
                'Not quite. The aim isn\'t to ignore tiredness or to compensate for a poor night with lots of extra sleep. Instead, use manageable daytime strategies to get through the day while allowing sleep drive to build again.',
            },
          ],
        },
      ],
    },
    {
      id: 's28-ch3-transition-2',
      navLabel: 'Transition',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'sub-title',
          copy: 'For the client you\'ll work with, sleep drive can be affected by what happens across the whole day, not just by what happens at bedtime.',
          icon: 'sun-moon',
        },
      ],
    },
    {
      id: 's29-ch3-know-why',
      navLabel: 'Know why',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Why Building Sleep Drive Matters',
          subtitle: 'Why this matters for the clients you\'ll be working with',
          body: 'Understanding sleep drive helps the coach explain why changes to naps, wake-up times and bedtime timing may affect the following night, rather than presenting them as absolute rules to follow. Your role is to help the client notice these patterns and understand the possible trade-offs, then identify the smallest change that is realistic for them. For some, this might mean moving a nap earlier or making it shorter. For others, it might be returning to a usual wake-up time after a poor night, or using light activity and brief rest breaks to manage daytime tiredness. The most useful strategy is the one that strengthens sleep drive without creating an unrealistic burden for the person or their care partner.',
        },
      ],
    },
  ],
}

export const MODULE_CONTENT: Record<string, ModuleContent> = {
  'building-blocks-good-sleep': {
    moduleId: 'building-blocks-good-sleep',
    setup: M6_SETUP,
    introSlide: M6_INTRO_SLIDE,
    chapters: [M6_CHAPTER_1, M6_CHAPTER_2, M6_CHAPTER_3],
    outroSlide: M6_OUTRO_SLIDE,
  },
}

/**
 * Discrepancies found in `Module 6.md` while transcribing. **The source
 * file is read-only** — these are raised here (and in conversation) rather
 * than silently corrected, per `Coaching modules master/CLAUDE.md`'s ground
 * rule. Nothing below has been "fixed" in the data above; it is transcribed
 * exactly as authored.
 */
export const CONTENT_FLAGS: string[] = [
  'One <Interactive block> title is still unfilled and renders as authored: "<Add copy here>" (Ch2 Know What revision). Every Your turn title was filled in on 2026-09-17 from copy supplied directly, in module.md as well as here — Ch1, Ch2, and both of Ch3 — as was Ch1 Know What revision.',
  'Ch1 Your turn has a Recall question only. The template’s own instruction requires at least one Recall AND one Applied question per scenario.',
  'Ch3 Your turn 1 is split across two <Interactive block> tables with different interaction types (Free Text, then Ranking). The template’s own instruction says not to mix interaction types within one scenario. The Free Text table’s two message columns were also merged into one on 2026-09-17 (direct instruction: free text has no right or wrong answer), so its header no longer matches the template’s.',
  'Ch1 Know What revision, "Calm Mind and Body": the definition ends mid-quote — a state of "readiness. — with no closing quote.',
  'Ch3 opening quote 2 is attributed to a "Person with lived exoerience" (typo for experience).',
  'Ch2 Know What Text block_3 body begins "you’ll go through how to do sleep assessment" mid-sentence with a lowercase y after a full stop.',
  'Ch2 transition slide copy ends with a double full stop ("...and sustainable..").',
  'Ch3 opening transition says "three practical strategies" but the Know What slide that follows lists four <Text block_3> entries (one framing block plus three named strategies) — consistent if the framing block is not counted, worth confirming.',
  'Module core skills list contains near-duplicates: "Building Rapport - Positivity, Coordination" and "Rapport Building - Positivity and Coordination".',
  'No "Scenarios used in this Chapter" selection is actually marked in any chapter — all three options are listed. Scenario counts here are read from the numbered slide labels (Ch3: "Know How 1" / "Know How 2"), which is the method the workflow doc prescribes.',
  'No "Interaction type for this scenario" selection is marked either — all seven options are listed. Types here are derived from each question row’s own Type and Select columns.',
  'Knowledge-video "Format — select all that apply" columns are unmarked (all three options listed) on every row, so no row resolves to video vs. website text vs. audio.',
  'The Figma <Chapter intro block> template carries a "Key items to look out for — Keywords" list that module.md has no field for. Left empty and not rendered rather than invented.',
]

/**
 * `CONTENT_FLAGS` records what is wrong in a module's **source**, which is
 * read-only — so the build can never fix these, only remember them. That made
 * them easy to forget: the array had **zero readers**, so thirteen real content
 * problems sat in a file nobody opens.
 *
 * A dev-only warning is the cheapest thing that stops that. It is deliberately
 * not a UI surface: these are notes for whoever edits the module.md, not for a
 * coach mid-lesson. Stripped from production by `import.meta.env.DEV`.
 */
if (import.meta.env.DEV && CONTENT_FLAGS.length > 0) {
  console.warn(
    `[module content] ${CONTENT_FLAGS.length} unresolved source flag(s) — these are ` +
      `problems in the authored module.md that the build transcribed verbatim:\n` +
      CONTENT_FLAGS.map((f, i) => `  ${i + 1}. ${f}`).join('\n'),
  )
}

