/**
 * Module 7 — Retraining Your Brain Where to Sleep.
 *
 * Source: `3. Coaching modules/05. Modules/Module 7/Module 7.md`, transcribed verbatim.
 * **That file is read-only** — never edit it; discrepancies are listed in
 * `CONTENT_FLAGS` at the foot of this file rather than corrected.
 *
 * Kept out of `moduleContent.ts` on purpose: `06. verify-slides.py` counts the
 * unique `s<N>-` ids and `09. verify-transcription.py` checks every literal in
 * the file it is given, so each module needs a file of its own to be checked
 * against its own source:
 *
 *   python3 "06. verify-slides.py" "05. Modules/Module 7/Coach Module - Template-based [Final].md" "../2. Platform/prototype/src/data/module7Content.ts"
 *   python3 "09. verify-transcription.py" "05. Modules/Module 7/Coach Module - Template-based [Final].md" "../2. Platform/prototype/src/data/module7Content.ts"
 *
 * Every block maps to an entry in the Module builder tool
 * (`3. Coaching modules/04. Module builder tool/`). Videos and images are
 * placeholders (direct instruction, 2026-11-20): no YouTube ids, no artwork,
 * and no `brief`/`script` — a `<Video block>` is only its id (CLAUDE.md), and
 * an `<Image block>`'s description is a brief for the artist, not copy.
 *
 * Inline emphasis is KEPT as the source's own markdown — `**bold**`,
 * `*italic*`, `***both***` — and `InlineText` renders it (2026-11-23). Bold
 * that only formats a whole field (a quiz question, a table label, a fixed
 * lead-in) is dropped: the block already styles that field. Long bodies are
 * split into paragraphs at the source's own line breaks — layout, not an edit;
 * the verifier strips both.
 */

import type { ChapterContent, ModuleContent, ModuleSetup, Slide } from './moduleContent'

const SIX_COMPONENTS = [
  'S - Shared Understanding',
  'I - Implementation Intent',
  'P - Problem Identification',
  'T - Tailoring',
  'E - Emotion Navigation',
  'A - Action and Goals',
]

/** The chapters' "Sub skills covered" cell, one skill per entry. Chapter 1's
 *  omits Open Questions; Chapters 2 and 3 end with it. */
const SUB_SKILLS = [
  'Building Rapport — Attentiveness, Coordination, Positivity',
  'Active Listening',
  'Empathy',
  'Reflective Listening — Paraphrasing/Rephrasing',
  'Communication — Clear, simple language',
  'Non-judgemental Communication',
  'Validation',
  'Normalisation',
  'Person-Centred Communication',
]

const M7_SETUP: ModuleSetup = {
  name: 'Module 7 - Retraining Your Brain Where to Sleep',
  coreMessage:
    'Explore how sleep associations develop through classical conditioning and how stimulus control strategies can strengthen the bed-sleep connection and support calm responses to nighttime awakenings.',
  // Stops at the colon: the component names below it are labels (CLAUDE.md,
  // "Transcribing and auditing" rule 2).
  coreSkillsIntro: 'In this module, we\'ll look at all six parts of the SIPTEA framework:',
  coreSkills: SIX_COMPONENTS,
}

const M7_INTRO_SLIDE: Slide = {
  id: 's1-module-intro',
  navLabel: 'Module introduction',
  fixedTemplate: true,
  blocks: [
    {
      tag: 'module-intro',
      title: 'Before you begin',
      expectationSetting:
        'This module explores how classical conditioning shapes sleep associations and how the bed can become a cue for wakefulness, rather than sleep. Coaches will learn practical stimulus control strategies to strengthen the bed-sleep connection, while encouraging calm, supportive approaches to nighttime awakenings, particularly when supporting someone living with dementia.',
      transitionCopy: 'Here\'s what you can expect to hear from your clients:',
      quotes: [
        {
          text: 'I spend so much time lying awake in bed that sometimes I dread going to sleep.',
          attribution: 'Care partner',
        },
        {
          text: 'I get into bed early because I want to maximise my opportunity for sleep',
          attribution: 'Person with lived experience',
        },
        {
          text: 'I go to bed early because I am tired, but then I lie awake',
          attribution: 'Care partner',
        },
      ],
    },
  ],
}

const M7_OUTRO_SLIDE: Slide = {
  id: 's24-module-outro',
  navLabel: 'Module summary',
  fixedTemplate: true,
  blocks: [
    {
      tag: 'chapter-outro',
      moduleSummary:
        'In this module, you have learnt how sleep associations develop and explored four stimulus control strategies to help rebuild the connection between bed and sleep. You have also learnt how to respond calmly and supportively to night awakenings, particularly when supporting someone living with dementia.',
      comingUpNext: 'Module 8',
      nextModuleCopy:
        'You will learn how the body clock regulates sleep, and how light exposure, physical activity and consistent routines can help support healthy sleep patterns, particularly for people living with dementia.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Chapter 1 — slides 2-9                                              */
/* ------------------------------------------------------------------ */

const M7_CHAPTER_1: ChapterContent = {
  number: 1,
  title: 'The Bed-Sleep Connection: How Sleep Associations Are Formed',
  // No "Scenarios used in this Chapter" selection and no scenario units in
  // this module: each chapter is one pass. See the content flags.
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
          heroArt: 'm07-ch1-cover',
          chapterTitle: 'The Bed-Sleep Connection: How Sleep Associations Are Formed',
          whatYouWillLearn:
            'In this chapter, you will learn how classical conditioning shapes sleep associations and how the bed can become associated with wakefulness rather than sleep.',
          coreSkillsIntro: 'We\'ll look at two parts of the SIPTEA framework:',
          coreSkills: ['S - Shared Understanding', 'E - Emotion Navigation', ...SUB_SKILLS],
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
          keyTopicsIntro: 'Here\'s what you\'ll learn:',
          keyTopics: [
            { text: 'What is classical conditioning, and how does it relate to sleep?', icon: 'link' },
            { text: 'How conditioned arousal weakens the connection between the bed and sleep', icon: 'bed' },
            {
              text: 'Why trying too hard to sleep can increase pressure and make sleep more difficult',
              icon: 'gauge',
            },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'I\'m exhausted on the couch, but as soon as I get into bed, I\'m wide awake.',
              attribution: 'Person with lived experience',
            },
            {
              text: 'I get so frustrated when I can\'t fall asleep, and the more I think about it, the worse it gets.',
              attribution: 'Care partner',
            },
            {
              text: 'I tell myself I need to sleep because tomorrow is going to be awful if I don\'t.',
              attribution: 'Care partner',
            },
          ],
          transition: 'Let\'s explore how the bed-sleep association develops and why it matters.',
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
          title: 'What is classical conditioning, and how does it relate to sleep?',
          subtitle:
            'Learning through association is how our brains connect experiences over time, including linking our bed with sleep or wakefulness. Read on to learn more about how these connections are formed.',
        },
        {
          tag: 'text-3',
          subtitle: 'Learning Through Association',
          body:
            'Our brains learn through **associations.** Over time, they link certain places, behaviours, and feelings together. For example, we might feel hungry when we smell food cooking, or feel relaxed when we sit in our favourite chair.\n\n' +
            'This type of learning is known as **classical conditioning**. It simply means that the brain learns by repeatedly pairing things together over time.\n\n' +
            '**But how does this relate to sleep?** Well, ideally the bed and bedroom should be associated with sleep and relaxation. When this connection is strong, getting into bed naturally signals to the brain that it is time to sleep and we can fall asleep, and stay asleep, much easier.\n\n' +
            'However, when sleep problems persist, the brain can accidentally learn different associations. If someone spends long periods awake in bed worrying, thinking, or feeling frustrated about sleep, the brain may begin to link the bed with wakefulness rather than sleep.',
        },
        { tag: 'image', image: 'm07-ch1-s04-bed-sleep-association' },
        {
          tag: 'style-1',
          heading: 'This is also known as ***Conditioned Arousal.***',
          subheading:
            'Over time, the brain can begin to treat the bed as a place for being awake rather than sleeping.',
        },
        {
          tag: 'text-3',
          subtitle:
            '***Conditioned Arousal*** can also help to explain when individuals complain of being very sleepy in the evenings or struggling to stay awake on the couch, but become wide awake upon getting into the bed.',
          body:
            'With repeated experiences, simply getting into bed can trigger alertness, making it harder to fall asleep, even when feeling tired.\n\n' +
            'In these cases, *the bed and bedroom have become conditioned to arousal, rather than sleep.* What’s more, this conditioned arousal can mean that people start to try harder to sleep, which can sometimes make sleep even harder to achieve.\n\n' +
            'Sleep is one of the few things in life that becomes harder when we try to force it. The more pressure we place on ourselves to sleep, the more alert and activated the brain can become. Thoughts such as, “I have to fall asleep now”, “If I don’t sleep, tomorrow will be terrible”, or “I need to check how much sleep I’ve had”, can all increase alertness and reinforce the connection between bed and wakefulness. Instead of trying to make sleep happen, the goal is to create the conditions where sleep can naturally return.',
        },
      ],
    },
    {
      id: 's5-ch1-your-turn',
      navLabel: 'Your turn - recall and apply',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title: 'Let’s test your knowledge of the bed-sleep connection:',
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'MCQ',
              question: 'What is classical conditioning in relation to sleep?',
              selectMode: 'Select one',
              options: [
                'A. The process of forcing the brain to fall asleep at a specific time.',
                'B. The brain learning to associate certain places, behaviours, or experiences with sleep or wakefulness.',
                'C. The process of reducing the amount of sleep needed each night.',
                'D. The brain naturally becoming tired after physical activity.',
              ],
              correctAnswer: 'B',
              correctMessage:
                'That\'s right! Our brains learn through association by repeatedly pairing places, behaviours, and experiences together. Over time, the bed can become a cue that signals the brain it\'s time to sleep.',
              wrongMessage:
                'Not quite! Classical conditioning is how the brain learns to associate certain places, behaviours, or experiences with particular responses. In relation to sleep, the goal is to build a strong association between the bed and sleep.',
            },
            {
              type: 'MCQ',
              question: 'Why can trying harder to fall asleep sometimes make sleep more difficult?',
              selectMode: 'Select one',
              options: [
                'A. It increases pressure and worry, which can make the brain more alert and reinforce wakefulness.',
                'B. It reduces the body\'s natural need for sleep.',
                'C. It causes the brain to forget its usual sleep routine.',
                'D. It makes the body release too much melatonin.',
              ],
              correctAnswer: 'A',
              correctMessage:
                'Exactly! The more pressure we put on ourselves to fall asleep, the more alert and activated the brain can become. Taking the pressure off and allowing sleep to happen naturally can help break this cycle.',
              wrongMessage:
                'Not quite! Trying too hard to sleep can increase worry, frustration, and alertness. Rather than forcing sleep, the aim is to create the right conditions for sleep to come naturally.',
            },
            {
              type: 'MCQ',
              question:
                'Why might someone feel sleepy on the couch but become wide awake when they get into bed?',
              selectMode: 'Select one',
              options: [
                'A. The bedroom is usually warmer than the living room.',
                'B. They are experiencing conditioned arousal, where the brain has learned to associate the bed with wakefulness rather than sleep.',
                'C. Their body has suddenly become less tired.',
                'D. They have slept too much during the day.',
              ],
              correctAnswer: 'B',
              correctMessage:
                'That\'s right! This is an example of ***conditioned arousal***. The brain has learned to associate the bed with wakefulness rather than sleep. As a result, getting into bed can trigger alertness, even when the person feels tired.',
              wrongMessage:
                'Not quite! This experience can be explained by ***conditioned arousal***. When someone repeatedly spends time awake, worrying, or feeling frustrated in bed, the brain can begin to associate the bed with wakefulness rather than sleep.',
            },
          ],
        },
      ],
    },
    {
      id: 's6-ch1-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'Let’s explore how conversations about the bed-sleep connection and conditioned arousal can help people understand why sleep difficulties can become self-perpetuating, and how thoughts, behaviours and associations around sleep can influence the sleep experience.',
        },
        // Source slide 6 holds Know how + the Click to reveal together (the
        // 2026-11-23 re-upload merged the old slides 6 and 7).
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title: 'Let\'s explore what clients often say about sleep:',
          hearPairs: [
            {
              clientSays: 'I\'m so tired all evening, but as soon as I get into bed, I\'m wide awake.',
              youCanSay:
                'Try:\n\n' +
                '- Wait until they feel sleepy rather than simply tired/exhausted. Look for signs of nodding off, yawning, or heavy eyes.\n' +
                '- Use a relaxing evening routine outside of bed.\n' +
                '- Keep a consistent wake-up time to support sleep drive building across the day.\n' +
                '- Consider whether earlier bedtime is related to fatigue, habit, or worry about not getting enough sleep.',
            },
            {
              clientSays: 'I\'m scared that if I don\'t sleep tonight, tomorrow will be a disaster.',
              youCanSay:
                'Try:\n\n' +
                '- Encourage them to tune into their body and go to bed when they actually feel sleepy. This will help to reduce some of the pressure to sleep.\n' +
                '- Create a relaxing transition period before bed so that tiredness can naturally build into sleepiness.\n' +
                '- Focus on maintaining a consistent wake-up time to support sleep drive building across the day.\n' +
                '- Remind them that resting calmly is still valuable, even if sleep does not happen immediately.',
            },
          ],
        },
      ],
    },
    {
      id: 's7-ch1-case-scenarios',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'style-1',
          heading:
            'Let’s look at some other real conversations and how coaches respond to their dyads in these situations.',
        },
        {
          tag: 'case-scenario',
          variant: 'block-2',
          label: 'Case scenario',
          cases: [
            {
              type: 'Case scenario',
              turns: [
                {
                  who: 'coach',
                  text: 'Have you noticed whether your experience of being in bed has changed since sleep became more difficult?',
                },
                {
                  who: 'ple',
                  text: 'I think so. I used to look forward to going to bed, but now I almost dread it.',
                },
              ],
              conversation:
                'Coach: "Have you noticed whether your experience of being in bed has changed since sleep became more difficult?" Person with lived experience: "I think so. I used to look forward to going to bed, but now I almost dread it."',
              question:
                'The person with lived experience has revealed something about the association between their bed and sleep. What might you say next? Select one.',
              selectMode: 'Select one',
              options: [
                'A. "You might need to change your bedtime routine so you feel more relaxed. Let’s start there."',
                'B. “That sounds really difficult, particularly when bed used to be somewhere you looked forward to being. When we\'ve experienced repeated difficulties sleeping, bedtime itself can gradually become associated with frustration and worry, rather than rest and sleep.”',
                'C. "Just try not to think about sleep so much when you get into bed.”',
              ],
              correctAnswer: 'B',
              correctMessage:
                'Exactly! Repeated experiences of wakefulness and frustration can change how someone feels about their bed. The brain can gradually begin to associate the bed with worry and alertness rather than sleep.',
              wrongMessage:
                'Not quite. The focus here is to acknowledge the person\'s experience and introduce how repeated experiences can influence the association between the bed and sleep, rather than jumping straight into strategies.',
              tags: ['S', 'E'],
            },
            {
              type: 'Case scenario',
              turns: [
                {
                  who: 'coach',
                  text: 'When you think about difficult nights, what tends to happen when you\'re lying in bed awake?',
                },
                {
                  who: 'carer',
                  text: 'I start checking the time and thinking about how little sleep I\'ll get.',
                },
                {
                  who: 'coach',
                  text: 'That sounds like a lot of pressure to experience night after night. How long do you think this has been happening?',
                },
                {
                  who: 'carer',
                  text: 'Probably for months. I think I\'ve started associating my bedroom with not sleeping.',
                },
                { who: 'coach', text: 'That\'s a really insightful observation…' },
              ],
              conversation:
                'Coach: "When you think about difficult nights, what tends to happen when you\'re lying in bed awake?" Care partner: "I start checking the time and thinking about how little sleep I\'ll get." Coach: "That sounds like a lot of pressure to experience night after night. How long do you think this has been happening?" Care partner: "Probably for months. I think I\'ve started associating my bedroom with not sleeping." Coach: "That\'s a really insightful observation…”',
              question:
                'What is the most helpful way for the coach to build on this insight? Select one.',
              selectMode: 'Select one',
              options: [
                'A. "You need to stop checking the clock because it\'s adding pressure to the night and making your sleep worse."',
                'B. "It sounds like your brain has learned to associate the bedroom with wakefulness through repeated experiences. This isn\'t something you\'re doing wrong, it\'s a learned response."',
                'C. "You should consider changing bedrooms to create a fresh association with sleep."',
              ],
              correctAnswer: 'B',
              correctMessage:
                'Exactly! The coach reinforces the care partner\'s insight, reduces self-blame and explains how conditioned arousal can develop over time through repeated experiences.',
              wrongMessage:
                'Not quite. The aim is to help the care partner understand how learned associations develop over time, while reinforcing that this is not their fault.',
              tags: ['S', 'E'],
            },
          ],
        },
      ],
    },
    {
      id: 's8-ch1-know-why',
      navLabel: 'Know why',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Understanding the Bed + Sleep Connection',
          subtitle:
            'Why understanding sleep associations and conditioned arousal is important for supporting the dyad’s sleep improvement',
          body:
            'Understanding how the bed can become associated with wakefulness, frustration and anxiety, rather than sleep, is an essential part of helping your dyads recognise behaviours that may be reinforcing conditioned arousal.\n\n' +
            'This knowledge provides the foundation for helping them rebuild positive associations between bed and sleep, change unhelpful sleep habits, and develop greater confidence in their ability to sleep naturally.',
        },
      ],
    },
    {
      id: 's9-ch1-transition',
      navLabel: 'Transition',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'sub-title',
          copy: 'Now that we understand how our sleep-related habits can influence the connection between our bed and sleep, let\'s explore four strategies that can help strengthen this connection and support better sleep.',
          icon: 'bed',
        },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Chapter 2 — slides 10-17                                            */
/* ------------------------------------------------------------------ */

const M7_CHAPTER_2: ChapterContent = {
  number: 2,
  title: 'Breaking Bad Bed Habits',
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
          heroArt: 'm07-ch2-cover',
          chapterTitle: 'Breaking Bad Bed Habits',
          whatYouWillLearn:
            'In this chapter, we will explore common sleep habits that can unintentionally weaken the connection between the bed and sleep. You will learn how to identify these habits and work with your dyads to make small, practical changes to their routines that help strengthen this connection and support better sleep.',
          coreSkillsIntro: 'We\'ll look at all six parts of the SIPTEA framework:',
          coreSkills: [...SIX_COMPONENTS, ...SUB_SKILLS, 'Open Questions'],
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
          keyTopicsIntro: 'Here\'s what you\'ll learn:',
          keyTopics: [
            { text: 'Common sleep habits that can weaken the bed-sleep connection', icon: 'tv' },
            { text: 'How to retrain the brain to recognise it’s time for sleep', icon: 'brain' },
            {
              text: 'Four practical strategies for strengthening the bed-sleep connection',
              icon: 'clipboard-list',
            },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'I watch TV/use my phone in bed because it helps me relax',
              attribution: 'Care partner',
            },
            {
              text: 'If I can\'t sleep, I just lie there hoping it will eventually happen.',
              attribution: 'Person with lived experience',
            },
            {
              text: 'I lie in bed thinking about everything I need to do tomorrow.',
              attribution: 'Care partner',
            },
          ],
          transition:
            'Let\'s explore how small changes to our everyday habits can help strengthen the bed–sleep connection.',
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
          title: 'Making Your Bed a Cue for Sleep',
          subtitle:
            'Certain sleep-related habits can unintentionally work to weaken the connection between the bed and sleep.',
        },
        // Body copy is authored empty on both of this slide's Style 2 blocks.
        { tag: 'text-3', subtitle: 'Some examples include:', body: '' },
        { tag: 'image', image: 'm07-ch2-s12-everyday-bed-habits' },
        {
          tag: 'text-3',
          subtitle:
            'When these patterns happen regularly, the brain may begin to learn: “This is the place where I am awake”.',
          body: '',
        },
      ],
    },
    {
      id: 's13-ch2-know-what',
      navLabel: 'Know what',
      fixedTemplate: false,
      blocks: [
        { tag: 'style-1', heading: 'Recognising It’s Time for Sleep' },
        {
          tag: 'text-3',
          subtitle: 'How do we retrain the brain where to sleep?',
          body:
            'As you\'ve just learnt, our brains can begin to associate the bed with wakefulness, worry and frustration, when ideally, we want the bed to signal sleep and relaxation.\n\n' +
            'The good news is that the brain is adaptable. Just as it can learn to associate the bed with wakefulness, it can also relearn to associate it with sleep.\n\n' +
            'The key is to create experiences that gradually strengthen the connection between the bed and sleep. This is the foundation of the next core component of our sleep program, known as ***Stimulus Control Therapy (SCT)***.',
        },
        {
          tag: 'text-3',
          subtitle: '*Stimulus Control Therapy*',
          body:
            'This refers to a behavioural approach that aims to strengthen the association between the bed and sleep by changing sleep-related habits and behaviours.\n\n' +
            '**By changing our behaviours and how we use the bed, we can reduce alertness, gradually weaken conditioned arousal and rebuild the association between the bed, bedroom and sleep.**',
        },
        {
          tag: 'style-1',
          heading:
            'Watch this video as it discusses four different ways to help our brains recognise it’s time for sleep:',
        },
        { tag: 'video', variant: 'knowledge' },
        {
          tag: 'interactive',
          pattern: 'revision',
          title: 'Let’s recap the four different ways to help our brains recognise it’s time for sleep:',
          revision: {
            terms: [
              {
                term: 'Only use the bed for sleeping and intimacy',
                art: 'm07-ch2-s13-flip-bed-for-sleep',
                icon: 'bed',
                definition:
                  'Use the bed mainly for sleep and intimacy to strengthen the connection between the bed and sleep.',
              },
              {
                term: 'Only go to bed when feeling sleepy',
                art: 'm07-ch2-s13-flip-bed-when-sleepy',
                icon: 'moon',
                definition:
                  'Wait until they notice signs of sleepiness before getting into bed, rather than going to bed just because it\'s bedtime.',
              },
              {
                term: 'If you cannot sleep, take a break from the bed',
                art: 'm07-ch2-s13-flip-break-from-bed',
                icon: 'armchair',
                definition:
                  'If they’re still awake after around 15–20 minutes, take a calming break from bed and return when they feel sleepy.',
              },
              {
                term: 'Avoid watching the clock',
                art: 'm07-ch2-s13-flip-clock-watching',
                icon: 'clock',
                definition:
                  'Try not to check the time during the night. Encourage them to focus instead on relaxing and noticing when they feel sleepy again.',
              },
            ],
          },
        },
      ],
    },
    {
      id: 's14-ch2-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'This chapter has focused on four different ways to help our brains recognise it’s time for sleep. Let’s see how a coach can help the person understand the purpose behind each strategy, explore what might make it challenging, and support them to consider how it could work in their own circumstances.',
        },
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title: 'Answer the questions about how you would respond to following scenarios:',
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'MCQ',
              question:
                'A care partner usually goes to bed at 10 pm because they believe they should, even when they don\'t feel sleepy. They also frequently check the clock during the night to see how much sleep they are getting.\n\n' +
                'How might you respond to help them understand the strategies of going to bed when sleepy and avoiding clock watching?',
              selectMode: 'Select one',
              options: [
                'A. "Easy. You should just stop looking at the clock and only go to bed when you\'re completely exhausted."',
                'B. "It sounds like there\'s a lot of pressure around getting enough sleep. It may be helpful to explore the difference between feeling tired and feeling sleepy. Checking the time can also increase worry and pressure around sleep."',
                'C. "Why don\'t you just go to bed an hour later and see if that fixes the problem?"',
              ],
              correctAnswer: 'B',
              correctMessage:
                'Exactly! The coach validates the person\'s experience, introduces the difference between tiredness and sleepiness, and explains how clock watching can increase pressure and worry around sleep.',
              wrongMessage:
                'Not quite. The aim is to acknowledge the person\'s experience, build understanding of sleepiness and explore the impact of clock watching, rather than immediately prescribing a change or setting rigid rules.',
            },
            {
              type: 'MCQ',
              question:
                'A person with lived experience often lies awake for hours, becoming increasingly frustrated. They believe they should stay in bed because that is where sleep is supposed to happen.\n\n' +
                'How might you explain the purpose of getting out of bed when unable to sleep?',
              selectMode: 'Select one',
              options: [
                'A. "You should get out of bed every time you wake up during the night, even if you feel relaxed."',
                'B. "You need to spend less time in bed so that you\'ll be more tired the following night."',
                'C. "It\'s understandable to think staying in bed is the best thing to do. However, when you\'re awake and becoming frustrated, getting out of bed for a while can help reduce the association between your bed and wakefulness."',
              ],
              correctAnswer: 'C',
              correctMessage:
                'Exactly! The response acknowledges the person\'s thinking and explains how getting out of bed when awake and frustrated can help strengthen the association between bed and sleep.',
              wrongMessage:
                'Not quite. The strategy isn\'t about getting out of bed every time someone wakes or simply reducing time in bed. It\'s about reducing the association between the bed and prolonged wakefulness.',
            },
            {
              type: 'MCQ',
              question:
                'A care partner explains that the person with lived experience often watches television, eats meals and spends much of the day in bed. The care partner says they allow this because it seems to keep the person comfortable and settled.\n\n' +
                'How might you respond to explore the reasons behind this and consider whether using the bed for other activities is necessary?',
              selectMode: 'Select one',
              options: [
                'A. "The person should be told to spend less time in bed. It is important that they only use the bed for sleep and intimacy."',
                'B. "It sounds like you\'re trying to make sure they\'re comfortable and supported. Could you tell me a little more about why they spend so much time in bed? Are there reasons that make it easier or necessary for them to stay there?"',
                'C. "You should encourage them to sit somewhere else during the day, even if moving around is difficult."',
              ],
              correctAnswer: 'B',
              correctMessage:
                'Exactly! The coach acknowledges the care partner\'s intentions and explores the reasons for the person\'s time in bed before suggesting changes. Understanding factors such as safety, mobility, comfort and support needs is essential before considering whether other activities could take place outside the bed.',
              wrongMessage:
                'Not quite. The coach should avoid assuming that spending time in bed is simply a habit that needs to change. It is important to first understand the person\'s circumstances, including any safety concerns, mobility limitations or care needs, before exploring what changes may be appropriate.',
            },
          ],
        },
      ],
    },
    {
      id: 's15-ch2-you-might-also-hear',
      navLabel: 'You might also hear',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'text-3',
          subtitle: 'Coaching for Sleep Associations',
          // The questions are one per line, as a bullet list — layout only.
          body:
            'Stimulus control aims to strengthen the association between bed and sleep by creating consistent cues that signal when it is time to rest. It will be important to understand the kinds of things that the bed and bedroom may be associated with for your dyad (e.g., worry, planning, TV, screen-time, reading, etc.).\n\n' +
            'During your coaching session you might ask:\n\n' +
            '- What do you do in bed when you can’t sleep?\n' +
            '- What kinds of activities might be associated with your bed or bedroom?\n' +
            '- How do you usually decide when it’s time to go to bed?\n' +
            '- What are your signs that you are sleepy and ready for bed? Or the person you’re caring for?\n' +
            '- How do you usually respond when you can’t get back to sleep?\n' +
            '- What might it look like to shift your focus from “trying to sleep” to “just resting”?\n' +
            '- How does the person you support respond when they are awake at night? What helps them feel safe and settled?',
        },
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title: 'Further examples of how the strategies can be applied in everyday situations:',
          hearPairs: [
            {
              clientSays: 'I watch TV/use my phone in bed because it helps me relax',
              youCanSay:
                'Try:\n\n' +
                '- Move relaxing activities to another location where possible.\n' +
                '- If moving the activity is not realistic, consider making it part of the wind-down routine before getting into bed rather than continuing once in bed.\n' +
                '- If devices are used, consider reducing stimulating content close to bedtime.',
            },
            {
              clientSays: 'Getting out of bed at night is not realistic because of my caring role',
              youCanSay:
                'Try:\n\n' +
                '- Look for opportunities to prepare a “quiet activity” in advance (e.g., a book, puzzle, calming audio, or comfortable chair), so that waking at night does not become a stressful decision point.\n' +
                '- If leaving the room is not possible, consider a quiet, low-stimulation activity while remaining calm and avoiding frustration (e.g., reading).\n' +
                '- Consider if they can move to another space in the room (e.g., an armchair in the corner), in order to keep the bed for sleep. Potentially suggest sitting up in bed.\n' +
                '- Identify which parts of stimulus control are more realistic (e.g., reducing phone use in bed or avoiding clock checking).',
            },
            {
              clientSays: 'I don’t want to wake the whole house if I get out of bed',
              youCanSay:
                'Have them think about:\n\n' +
                '- Things they enjoy (e.g., listening to favourite music, doing a hobby, reading)\n' +
                '- Things that provide a sense of accomplishment (e.g., folding laundry, completing a simple puzzle, organising photos, doing a small, familiar task that feels satisfying without being stimulating)\n' +
                '- Things that engage different senses (Sight: watching a familiar, calming program, looking through a magazine; Hearing: listening to an audiobook, calming music, or a familiar podcast; Touch: knitting, a simple craft, sorting objects, using a sensory item; Smell: enjoying a calming scent such as tea or a familiar fragrance)\n' +
                '- Things they would like to try or learn (e.g., reading about an interest, practising a skill)',
            },
            {
              clientSays: 'I check the clock constantly because I worry about how much sleep I am getting',
              youCanSay:
                'Try:\n\n' +
                '- Remind them that calculating time will increase their arousal, making sleep even harder to achieve.\n' +
                '- Turn the clock away or remove it from view.\n' +
                '- Focus on resting rather than forcing sleep.\n' +
                '- Use calming strategies if awake, such as slow breathing or relaxation.',
            },
            {
              clientSays: 'I get into bed early because I want to maximise my opportunity for sleep',
              youCanSay:
                'Try:\n\n' +
                '- Encourage them to tune into their body and go to bed when they actually feel sleepy. This will help to reduce some of the pressure to sleep.\n' +
                '- Create a relaxing transition period before bed so that tiredness can naturally build into sleepiness.\n' +
                '- Focus on maintaining a consistent wake-up time to support sleep drive building across the day.\n' +
                '- Remind them that resting calmly is still valuable, even if sleep does not happen immediately.',
            },
          ],
        },
      ],
    },
    {
      id: 's16-ch2-know-why',
      navLabel: 'Know why',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Understanding the Why Behind Stimulus Control',
          subtitle:
            'Knowing why the strategies work can help you feel more confident introducing and supporting them.',
          body:
            'The four strategies in this chapter are aimed at strengthening the connection between the bed and sleep.\n\n' +
            'Understanding the reasons behind each strategy can help you explain them in a meaningful way, explore any challenges the person with lived experience or care partner may experience, and consider how they can be adapted to individual needs and circumstances.',
        },
      ],
    },
    {
      id: 's17-ch2-transition',
      navLabel: 'Transition',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'sub-title',
          copy: 'Having explored the stimulus control strategies and how they can be applied in practice, it’s also important to consider the broader context of night-time waking.\n\n' +
            'For people living with dementia, waking during the night can have different meanings and may call for a more flexible, person-centred approach. In this next chapter, let’s explore how we can support night-time wakefulness while recognising that awakenings are a normal part of sleep.',
          icon: 'moon',
        },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Chapter 3 — slides 18-23                                            */
/* ------------------------------------------------------------------ */

const M7_CHAPTER_3: ChapterContent = {
  number: 3,
  title: 'When Sleep Is Interrupted: Understanding and Responding to Awakenings',
  scenarioCount: 1,
  slides: [
    {
      id: 's18-ch3-intro',
      navLabel: 'Chapter introduction',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-intro',
          chapterNumber: 'Chapter 3',
          heroArt: 'm07-ch3-cover',
          chapterTitle: 'When Sleep Is Interrupted: Understanding and Responding to Awakenings',
          whatYouWillLearn:
            'In this chapter, you will learn how to support night-time wakefulness with understanding and empathy.',
          // Verbatim, though the Skills row below it names all six — flagged.
          coreSkillsIntro: 'We\'ll look at two parts of the SIPTEA framework:',
          coreSkills: [...SIX_COMPONENTS, ...SUB_SKILLS, 'Open Questions'],
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
          keyTopicsIntro: 'Here\'s what you\'ll learn:',
          keyTopics: [
            { text: 'Revisit night-time awakenings and their role in the sleep cycle.', icon: 'moon' },
            {
              text: 'Recognise factors that may contribute to night-time wakefulness and distress in people living with dementia.',
              icon: 'puzzle',
            },
            {
              text: 'Identify empathetic and practical ways to support someone who wakes during the night.',
              icon: 'heart-handshake',
            },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'The person I support gets up at night and becomes distressed',
              attribution: 'Care partner',
            },
            {
              text: 'I worry that if I let them stay up, they\'ll get into a pattern of being awake at night.',
              attribution: 'Care partner',
            },
            {
              text: 'Sometimes they\'re awake for hours, and I struggle to know what to do.',
              attribution: 'Care partner',
            },
          ],
          transition:
            'So, how might you support your dyads if night-time awakenings are a problem for them? Let’s learn more.',
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
          title: 'Busting the Myth of Awakenings',
          subtitle:
            'Waking during the night can be a natural part of our sleep cycle, but how we respond to these awakenings can make a difference. Read on to learn why wakefulness is normal and how to support someone who wakes during the night, particularly someone living with dementia.',
        },
        {
          tag: 'text-3',
          subtitle: 'When is waking during the night normal?',
          body:
            'There is a common misconception that waking during the night means something is wrong with our sleep. We often feel pressure or expectation to sleep right through until morning. However, as we learnt in the first module, **waking during the night is a normal part of the sleep cycle.** We all experience brief awakenings throughout the night, although we may not remember them.\n\n' +
            'Being awake for a period during the night also allows our natural drive for sleep, known as sleep hunger, to build. This helps us feel sleepier and can support falling asleep more easily and sleeping more deeply when we next go to bed.\n\n' +
            'The important thing to remember is that being awake is not necessarily the problem; becoming frustrated or anxious about being awake can make it harder to return to sleep.',
        },
        { tag: 'image', image: 'm07-ch3-s20-restless-awakening' },
        {
          tag: 'text-3',
          subtitle: 'Supporting Night-Time Wakefulness in Dementia',
          body:
            'For many people living with dementia, the night-time and early morning hours can be a time for calm, quiet and relaxation. However, night-time can also be difficult. Changes in the brain that affect sleep regulation may lead to more frequent waking, lighter and less restful sleep, and vivid or distressing dreams. Other factors, such as pain, health conditions, needing to use the toilet, anxiety or depression, may also interrupt sleep.\n\n' +
            'When someone wakes during the night, their care partner can support them by offering relaxing activities until they begin to feel sleepy again. Creating a comfortable, low-stimulation environment can help. This might include using soft lighting, keeping noise to a minimum and offering calming, familiar activities.\n\n' +
            'Night-time waking may also be accompanied by distress. In these moments, it can be more helpful to focus on being present and offering reassurance rather than trying to reason with or correct the person. It is important to remember that their experience feels real and meaningful to them, even if it does not match what others can see or understand. For example, a person living with dementia may feel extremely frightened by something that others might consider unlikely or irrational. Rather than dismissing their concern by saying, "Don\'t be silly, that\'s never going to happen", encourage their care partner to acknowledge their feelings and offer reassurance, such as “I can see you\'re feeling very upset and frightened. It must have felt really scary. I am here with you.”\n\n' +
            'Nightmares or frightening dreams can also contribute to distress. The feelings created by a dream may continue after waking, even if the details are unclear or do not seem realistic to others. Responding to the emotion, such as fear or confusion, rather than focusing on whether the dream was real can help the person feel safe and supported.\n\n' +
            'Responding with empathy does not mean agreeing with a concern or reinforcing a misunderstanding. It means recognising the person\'s feelings and helping them feel understood. It can also be helpful to consider what their waking or distress might be communicating. They may be feeling uncomfortable, lonely or confused, need reassurance, or be responding to something in their environment.\n\n' +
            'Overall, calm reassurance, empathy and a quiet environment can help someone feel more settled and supported during night-time waking. The aim is not always to get the person back to sleep straight away, but to help them feel safe, comfortable and understood.',
        },
        { tag: 'image', image: 'm07-ch3-s20-calm-awakening' },
      ],
    },
    {
      id: 's21-ch3-your-turn',
      navLabel: 'Your turn - recall and apply',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title: 'Let’s test your knowledge of night-time awakenings:',
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'MCQ',
              question:
                'A person living with dementia wakes during the night and seems comfortable but is not ready to return to sleep. What could their care partner do?',
              selectMode: 'Select one',
              options: [
                'A. Offer a familiar, calming activity in a quiet environment',
                'B. Leave them alone until they fall asleep',
                'C. Encourage them to return to bed straight away',
                'D. Turn on bright lights and start a conversation',
              ],
              correctAnswer: 'A',
              correctMessage:
                'Correct! Offering a familiar, calming activity in a quiet environment can help the person feel comfortable and relaxed while they are awake. The aim is to support rest and reduce stimulation, rather than putting pressure on them to fall asleep.',
              wrongMessage:
                'Try again. If the person is comfortable but not ready to sleep, a familiar, calming activity in a quiet environment may help them relax. Bright lights, increased activity or pressuring them to return to bed may make it harder to settle.',
            },
            {
              type: 'MCQ',
              question: 'Which factors may contribute to sleep difficulties for people living with dementia?',
              selectMode: 'Select multiple',
              options: [
                'A. Anxiety, depression or unmet needs',
                'B. Pain or other health conditions',
                'C. Having a familiar activity available',
                'D. Changes in the brain that regulate sleep',
              ],
              correctAnswer: 'A, B, D',
              correctMessage:
                'That\'s right. Changes in the brain that regulate sleep, as well as anxiety, depression, pain and other health conditions or unmet needs, can all affect sleep.',
              wrongMessage:
                'Not quite. Sleep difficulties can be linked to changes in the brain that regulate sleep, as well as factors such as anxiety, depression, pain and other health conditions or unmet needs. Think about which options describe possible causes of disrupted sleep.',
            },
            {
              type: 'MCQ',
              question:
                'A person living with dementia wakes from a frightening dream and appears very upset. What is the most helpful response from their care partner?',
              selectMode: 'Select one',
              options: [
                'A. Encourage them to forget about the dream',
                'B. Explain that the dream was not real',
                'C. Ask them to describe every detail of the dream',
                'D. Acknowledge their fear and offer calm reassurance',
              ],
              correctAnswer: 'D',
              correctMessage:
                'Well done! A frightening dream can leave someone feeling distressed even after they wake. Acknowledging their feelings and offering calm reassurance can help them feel safe and supported. The focus should be on their emotional experience, rather than whether the dream was real.',
              wrongMessage:
                'Try again. Even if a dream was not real, the fear someone feels after waking can be very real. Acknowledging their distress and offering reassurance can help them feel understood and safe.',
            },
            {
              type: 'MCQ',
              question:
                'Responding with empathy means agreeing with a person\'s concern or reinforcing their misunderstanding.',
              selectMode: 'Select one',
              options: ['A. True', 'B. False'],
              correctAnswer: 'B',
              correctMessage:
                'That\'s right. Empathy does not mean agreeing with a concern or reinforcing a misunderstanding. It means recognising the person\'s feelings, showing understanding and helping them feel safe and supported.',
              wrongMessage:
                'Not quite. Empathy is about acknowledging how someone feels, not necessarily agreeing with what they believe. A care partner can offer reassurance and respond to the person\'s distress without reinforcing a misunderstanding.',
            },
          ],
        },
      ],
    },
    {
      id: 's22-ch3-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'In this Know How section, let’s watch the sleep coach in a real conversation with their dyad, and notice which skills they use, as the coach helps the dyad explore night-time awakenings in more detail.',
        },
        // Chapter 3's case scenario video (2026-11-24). Its dialogue script
        // stays in module.md — a `<Video block>` is only its YouTube id.
        { tag: 'video', variant: 'scenario', youtubeId: 'ziCd8w_Xu2U' },
      ],
    },
    {
      id: 's23-ch3-know-why',
      navLabel: 'Know why',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Our Responses to Night-Time Awakenings',
          subtitle:
            'Understanding the reasons behind night-time waking can help us provide calm, compassionate and person-centred support.',
          body:
            'Dementia can affect sleep patterns and make night-time waking more frequent or distressing. Other factors, such as pain, anxiety or unmet needs, may also play a role. By offering reassurance, familiar activities and a calm environment, care partners can help the person feel safe, comfortable and understood, without putting pressure on them to fall back asleep.',
        },
      ],
    },
  ],
}

export const MODULE_7: ModuleContent = {
  moduleId: 'retraining-brain-sleep',
  setup: M7_SETUP,
  introSlide: M7_INTRO_SLIDE,
  chapters: [M7_CHAPTER_1, M7_CHAPTER_2, M7_CHAPTER_3],
  outroSlide: M7_OUTRO_SLIDE,
}

/**
 * Discrepancies in `Module 7.md`, raised rather than corrected (the source is
 * read-only). Everything above is transcribed as authored.
 */
export const CONTENT_FLAGS: string[] = [
  'Chapter 3 intro: the fixed title reads "We\'ll look at two parts of the SIPTEA framework:" but its Skills row lists all six components.',
  'No chapter carries a "Scenarios used in this Chapter" selection or a repeated Know How / You Might Also Hear / Your turn / Transition unit, so every chapter is built as one pass (scenarioCount 1) and slides are read in source order.',
  'Chapter 3 has no Transition slide; the module goes straight from its Know Why (slide 23) to the module summary (slide 24).',
  'The Click to reveal blocks (slides 6 and 15) name the speaker in their Topic / concept column ("Person with lived experience might say…", "Care partner might say…", "Dyad might say…"). The block does not render that column, so who is speaking is not shown.',
  'Both case scenario questions end with "Select one." inside the question copy, which the block also says on its own.',
  'Slide 17\'s transition copy is three sentences across two paragraphs (from the .docx) and leaves its optional bullet points empty, so it renders as a two-paragraph heading.',
  'Every <Video block> except Chapter 3\'s case scenario is a placeholder: no other video links are authored yet.',
]
