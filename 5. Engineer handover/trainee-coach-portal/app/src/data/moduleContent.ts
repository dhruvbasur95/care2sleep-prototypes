/**
 * Round 7 — typed content model for the Coach Training Portal Option B
 * module player (`/training-v2/module/:id/play`). Generic/data-driven, but
 * populated for Module 4 ("Understanding Sleep") only this round. Keyed
 * `'understanding-sleep'` (re-keyed in a later direct UI update from the
 * Round 1-era `'sleep-basics'` id once Option B's home page moved to its
 * own real 11-module dataset, `data/trainingPathwayV2.ts` — see that file
 * and `pathway.ts`'s `MODULE_PLAYER_ID`) — content payload below unchanged.
 *
 * Content lifted close to verbatim from
 * `research/Module framework + example module/Module 4.md` — no rewriting
 * or summarizing of intro lines, Learn coverage, case vignettes/responses,
 * knowledge-check Q&A, or the "what to expect" list. Structural shape (one
 * intro, N chapters each with Learn/Case examples/Knowledge check/What to
 * expect, one outro) follows `Coaching Module Structure.md`.
 */

export interface LearnVideo {
  /** "Part 1 of 2" — only present when a chapter has 2 Learn videos. */
  label?: string
  /** e.g. "~4-5 min" — verbatim from the source doc's own time estimate. */
  durationLabel: string
  /**
   * The source doc's "Covers: ..." text, verbatim — a production brief
   * describing what the real video needs to cover ("Video sections are
   * marked with a placeholder describing what the video would need to
   * cover — not a full script," per the source doc's own framing note),
   * not copy written for a coach to read. Kept here for whoever eventually
   * produces the real video; **not rendered anywhere in the player**
   * (design-tokens.md §30, Round 7.1.2) — showing it verbatim read as the
   * lesson itself rather than a stand-in for one.
   */
  covers: string
}

export interface CaseExample {
  scenarioNumber: 1 | 2 | 3
  /** Generic scenario slot label, never a personal name — e.g. "Carer
   *  caring for someone with sleep issues" / "Carer with own sleep issue" /
   *  "Dyad". */
  slotLabel: string
  format: 'video' | 'written'
  /** Verbatim vignette / dramatized-scene description. */
  vignette: string
  /** Present when `format === 'video'`. */
  video?: {
    durationLabel: string
    /**
     * The source doc's "Dramatised scene: ..." staging description,
     * verbatim — production/direction notes for whoever shoots the real
     * video (often repeating the plain `vignette` above plus staging
     * detail and the pedagogical rationale, which duplicates the separate
     * `rationale` field). Kept for production reference; **not rendered
     * anywhere in the player** — the slide's visible body is always the
     * plain `vignette` field above, matching the written-format case's
     * own treatment (design-tokens.md §30, Round 7.1.2).
     */
    dramatizedScene: string
  }
  /** Present when `format === 'written'` — the coach's modelled response,
   *  verbatim. */
  coachResponse?: string
  /** The bracketed SIPTEA rationale note, verbatim — both formats have one. */
  rationale: string
}

export interface KnowledgeCheckQuestion {
  type: 'Factual' | 'Applied' | 'Factual + applied'
  answerFormat: 'true-false' | 'free-response'
  /** Verbatim question text. */
  question: string
  /** Verbatim model answer/explanation. */
  answer: string
}

export interface WhatToExpectItem {
  consumerMightSay: string
  youCanDo: string
}

export interface Chapter {
  id: string
  number: number
  title: string
  /** 1 video for a chapter covering one continuous idea, 2 for a chapter
   *  covering two distinct sub-skills. */
  learnVideos: LearnVideo[]
  /** Exactly 3, in scenario-number order. */
  cases: CaseExample[]
  /** Exactly 5, in source order. */
  knowledgeCheck: KnowledgeCheckQuestion[]
  /** The one-line SIPTEA tag heading the "What to expect" section, verbatim
   *  — e.g. "This is mostly S work". */
  siptaTag: string
  whatToExpect: WhatToExpectItem[]
}

export interface ModuleContent {
  /** `data/portal.ts` module id this content populates. */
  moduleId: string
  /** The 3 spoken intro lines, verbatim. */
  introLines: string[]
  /** e.g. "~1 min" — verbatim from the source doc. */
  introDurationLabel: string
  chapters: Chapter[]
  outro: {
    /** Verbatim outro vignette. */
    vignette: string
    /** The "Using what you've covered..." question, verbatim. */
    prompt: string
    /** The "No single correct answer, but..." authorial guidance line,
     *  verbatim — shown to the coach as gentle help text under the response
     *  field (this is a rehearsal, not an assessment). */
    guidance: string
  }
}

export const MODULE_CONTENT: Record<string, ModuleContent> = {
  'understanding-sleep': {
    moduleId: 'understanding-sleep',
    introLines: [
      'Isn’t it bad that she’s up again at 2am? Shouldn’t she be sleeping right through?',
      'Some nights I could sleep for a week and it still wouldn’t be enough.',
      'We both just lay there at 2am, wide awake, wondering if something was wrong.',
    ],
    introDurationLabel: '~1 min',
    chapters: [
      {
        id: 'ch1',
        number: 1,
        title: 'How sleep works',
        learnVideos: [
          {
            durationLabel: '~4-5 min',
            covers:
              'Covers: what sleep actually is (an active, regulated process the brain works to manage, not passive shutdown); sleep architecture across repeating ~90-minute cycles, 4-6 per night; NREM stages 1-3 (Stage 1 = brief, light transition, hypnagogic jerks are normal; Stage 2 = largest portion of the night, body temperature/heart rate drop; Stage 3 = deepest, most restorative, physical repair and immune support) and REM sleep ("paradoxical sleep", brain activity resembles wakefulness but the body is immobilised, most vivid dreaming happens here); night-time awakenings are a normal part of every cycle and usually go unremembered; awakenings are worth a closer look when someone is awake for more than about 30 minutes, or it affects next-day functioning.',
          },
        ],
        cases: [
          {
            scenarioNumber: 1,
            slotLabel: 'Carer caring for someone with sleep issues',
            format: 'video',
            vignette:
              'A carer tells the coach she’s worried her mother’s dementia is "getting worse" because her mother has been waking and calling out around 3am most nights.',
            video: {
              durationLabel: '~1-1.5 min',
              dramatizedScene:
                'Dramatised scene: a carer tells the coach she’s worried her mother’s dementia is "getting worse" because her mother has been waking and calling out around 3am most nights. The coach doesn’t reassure or correct immediately. She asks whether her mother settles again quickly or stays awake for a long stretch, and how she seems the next day. Demonstrates S (Shared understanding): validate the fear first, then gather the specific information needed to tell normal cycling apart from something worth exploring further, rather than jumping straight to either "that’s normal" or "let’s investigate."',
            },
            rationale:
              '[S] Validate the fear first, then gather the specific information needed to tell normal cycling apart from something worth exploring further, rather than jumping straight to either "that’s normal" or "let’s investigate."',
          },
          {
            scenarioNumber: 2,
            slotLabel: 'Carer with own sleep issue',
            format: 'written',
            vignette: 'My husband sleeps like a log; it’s me who’s up half the night listening for him.',
            coachResponse:
              'It sounds like your night might actually be the one we should focus on. What’s going through your mind when you’re lying there awake?',
            rationale:
              '[S] Notices and names whose sleep problem it actually is, rather than defaulting to the person living with dementia as "the patient."',
          },
          {
            scenarioNumber: 3,
            slotLabel: 'Dyad',
            format: 'written',
            vignette:
              'A person living with dementia and their partner both wake around 2am. Neither can work out who woke whom, and both assume something must be wrong.',
            coachResponse:
              'It sounds like that gave you both a bit of a fright. Can you tell me what happened after you woke: did either of you get back to sleep, and how long were you awake for?',
            rationale:
              '[S] Explores duration and impact with both members of the dyad before deciding whether this needs a closer look, rather than reassuring or alarming either partner based on assumption.',
          },
        ],
        knowledgeCheck: [
          {
            type: 'Factual',
            answerFormat: 'true-false',
            question: 'True or false: waking briefly during the night is a normal part of the sleep cycle.',
            answer: 'True.',
          },
          {
            type: 'Factual',
            answerFormat: 'free-response',
            question: 'Roughly how many sleep cycles does a person go through in a typical night?',
            answer: '4 to 6.',
          },
          {
            type: 'Applied',
            answerFormat: 'free-response',
            question:
              "In Scenario 1, what did the coach do before responding to the carer's fear that her mother's dementia was getting worse?",
            answer:
              'Validated the fear, then asked a clarifying question about duration and impact, rather than agreeing or dismissing it outright.',
          },
          {
            type: 'Applied',
            answerFormat: 'free-response',
            question: "In Scenario 2, whose sleep did the coach identify as needing attention first?",
            answer: "The carer's own sleep, not his wife's.",
          },
          {
            type: 'Factual + applied',
            answerFormat: 'free-response',
            question:
              "Based on the guideline from this chapter, is the dyad's 2am waking in Scenario 3 something to flag, or likely normal cycling? What would you want to know before deciding?",
            answer:
              "Likely normal cycling if they settled again within about 30 minutes and it isn't affecting daytime functioning. The coach needs to know how long they were awake and how they felt/functioned the next day before deciding.",
          },
        ],
        siptaTag: 'This is mostly S work',
        whatToExpect: [
          {
            consumerMightSay: "Isn't it bad that they're waking up at night?",
            youCanDo:
              'normalise that everyone wakes during the night, and ask about duration and next-day impact before deciding whether it needs a closer look.',
          },
          {
            consumerMightSay: "I think their dementia is getting worse because of the night waking.",
            youCanDo:
              'validate the fear, then gently separate "waking at night" (usually normal) from "increasing distress or confusion at night" (worth flagging), and don’t let the two get merged.',
          },
          {
            consumerMightSay: "It's actually me who can't sleep, not them.",
            youCanDo:
              'notice this and shift the focus of the conversation to their own sleep, rather than continuing to frame the person they care for as "the patient."',
          },
          {
            consumerMightSay: 'I feel groggy for ages after I wake up, so I must have slept badly.',
            youCanDo:
              'introduce sleep inertia gently as a possible explanation (covered fully in Chapter 2), and avoid judging sleep quality from first impressions on waking.',
          },
        ],
      },
      {
        id: 'ch2',
        number: 2,
        title: 'Sleep across the lifespan and what can go wrong',
        learnVideos: [
          {
            label: 'Part 1 of 2',
            durationLabel: '~3 min',
            covers:
              'Covers: how sleep changes with ageing (lighter, more fragmented sleep; earlier body clock timing, going to bed and waking earlier; more frequent night waking; less deep/Stage 3 sleep); sleep inertia in full (temporary grogginess and reduced alertness on waking, can take up to 2 hours to dissipate, often caused by waking during deep sleep; don’t judge how well someone slept by how they seem in the first few minutes awake); increased prevalence of sleep disorders in older age (insomnia, circadian rhythm disorders, sleep apnoea).',
          },
          {
            label: 'Part 2 of 2',
            durationLabel: '~3-4 min',
            covers:
              'Covers: why sleep matters (health, cognition, mood regulation, falls risk); the biopsychosocial model of sleep (biological, psychological, behavioural, social/environmental factors) as a way of understanding that sleep problems are almost always multi-causal, not one single cause; the distinction between sleep deprivation (something external gets in the way of the opportunity to sleep, e.g. pain, noise, caregiving duties) and insomnia (difficulty sleeping even when the opportunity is there, often tied to worry about sleep itself); note that in the dementia context, carers and people living with dementia often experience both at once; brief, appropriately bounded mention that sleep medications can help short-term but don’t address underlying causes and should be reviewed with a doctor. Full detail is covered later in the Sleep Assessment module, this is not the place to advise on medication.',
          },
        ],
        cases: [
          {
            scenarioNumber: 1,
            slotLabel: 'Carer caring for someone with sleep issues',
            format: 'written',
            vignette:
              "He's in pain most nights, and I think that's half the reason he can't settle, but it feels like everyone just wants to talk about his sleep habits.",
            coachResponse:
              'It sounds like the pain feels like the real story here. Can you walk me through a typical night: does he usually struggle to get comfortable first, or is he awake and then notices the pain?',
            rationale:
              "[S, P] Doesn't dismiss the biological factor (pain) in favour of a behavioural explanation. Explores which factor is actually driving the pattern before assuming it's a habits issue.",
          },
          {
            scenarioNumber: 2,
            slotLabel: 'Carer with own sleep issue',
            format: 'written',
            vignette:
              "I go to bed exhausted most nights but then I just lie there worrying about everything I didn't get done.",
            coachResponse:
              "That sounds like your mind doesn't get much of a chance to switch off. Would you say it's mostly about not having the chance to sleep, or mostly about not being able to switch your thoughts off once you're there?",
            rationale:
              "[S, P] Uses the deprivation-vs-insomnia distinction directly with the client, in plain language, to help identify which type of problem (and therefore which later module's strategies) is most relevant.",
          },
          {
            scenarioNumber: 3,
            slotLabel: 'Dyad',
            format: 'video',
            vignette:
              'A dyad both describe frustration: the carer says her husband has "just always woken early since he retired," and he says he doesn’t see it as a problem at all.',
            video: {
              durationLabel: '~1-1.5 min',
              dramatizedScene:
                'Dramatised scene: a dyad both describe frustration: the carer says her husband has "just always woken early since he retired," and he says he doesn’t see it as a problem at all. The coach explores with each of them separately what "a problem" would look like, and discovers the earlier waking itself isn’t distressing to either of them, but the carer’s own resulting tiredness is. Demonstrates S and P: not assuming a sleep pattern is a "problem" just because it’s been raised, and identifying the actual source of distress before proposing anything.',
            },
            rationale:
              '[S, P] Not assuming a sleep pattern is a "problem" just because it’s been raised, and identifying the actual source of distress before proposing anything.',
          },
        ],
        knowledgeCheck: [
          {
            type: 'Factual',
            answerFormat: 'free-response',
            question: 'Name two ways sleep commonly changes as people age.',
            answer:
              'Any two of: lighter/more fragmented sleep, earlier body clock timing, more frequent night waking, less deep sleep.',
          },
          {
            type: 'Factual',
            answerFormat: 'free-response',
            question: 'What is sleep inertia, and how long can it last?',
            answer: 'Temporary grogginess and reduced alertness on waking; can last up to 2 hours.',
          },
          {
            type: 'Factual',
            answerFormat: 'free-response',
            question: "What's the key difference between sleep deprivation and insomnia?",
            answer:
              'Deprivation is caused by external things getting in the way of the opportunity to sleep; insomnia is difficulty sleeping even when the opportunity is there.',
          },
          {
            type: 'Applied',
            answerFormat: 'free-response',
            question: 'In Scenario 1, what did the coach avoid assuming, and what did she explore instead?',
            answer:
              "Avoided assuming it was a habits/behavioural issue; explored whether pain was driving the pattern before proposing anything.",
          },
          {
            type: 'Applied',
            answerFormat: 'free-response',
            question: 'In Scenario 3, what turned out to be the actual source of distress, and for whom?',
            answer:
              "Not the early waking itself (neither found it distressing): the carer's own resulting tiredness.",
          },
        ],
        siptaTag: 'This is mostly S and P work',
        whatToExpect: [
          {
            consumerMightSay: "I think it's just old age, there's nothing to be done.",
            youCanDo:
              'acknowledge that some change is normal with ageing, while gently checking whether daytime functioning or distress suggests something worth exploring further.',
          },
          {
            consumerMightSay: 'I feel terrible when I wake up, so I must not have slept well.',
            youCanDo:
              "introduce sleep inertia as a possible explanation, and separate \"how I feel in the first few minutes\" from \"how well I actually slept.\"",
          },
          {
            consumerMightSay: "Nothing gets in the way of my sleep, I just can't switch off.",
            youCanDo:
              'use this as a cue this may be more of an insomnia pattern than deprivation, and flag it for the calming strategies covered in later modules.',
          },
          {
            consumerMightSay: 'Should they be on sleep medication?',
            youCanDo:
              "acknowledge it's a reasonable question, note that medication can help short-term but doesn't address underlying causes, and direct them to raise it with their GP. This isn't something to advise on directly.",
          },
        ],
      },
    ],
    outro: {
      vignette:
        "A carer tells you: \"My mum's been getting up around 4am every day for the last two weeks, wide awake, ready to start the day. She doesn't seem upset about it. She says she just feels ready to get up. But I'm exhausted because I can't get back to sleep once she's up.\"",
      prompt:
        'Using what you’ve covered in this module: is this necessarily a problem to fix? Whose sleep would you focus on first, and what would you want to ask before deciding on anything else?',
      guidance:
        'No single correct answer, but a strong response should: recognise this may be a normal age-related timing shift rather than a "problem" in itself, identify the carer’s own sleep as the presenting issue, and name at least one clarifying question before jumping to any strategy.',
    },
  },
}
