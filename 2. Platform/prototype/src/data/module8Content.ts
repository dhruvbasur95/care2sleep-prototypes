/**
 * Module 8 — Resetting Your Body Clock.
 *
 * Source: `3. Coaching modules/05. Modules/Module 8/Module 8.md` (the words) and
 * `Module 8.docx` (the formatting), transcribed verbatim. **Both are
 * read-only** — never edit them; discrepancies are listed in `CONTENT_FLAGS` at
 * the foot of this file rather than corrected.
 *
 * Its own file for the same reason as Module 7's: both checks scan the whole
 * file they are given.
 *
 *   python3 "06. verify-slides.py" "05. Modules/Module 8/Module 8.md" "../2. Platform/prototype/src/data/module8Content.ts"
 *   python3 "09. verify-transcription.py" "05. Modules/Module 8/Module 8.md" "../2. Platform/prototype/src/data/module8Content.ts"
 *
 * Videos and images are placeholders (direct instruction, 2026-11-27: "images
 * and videos stay placeholder"): no YouTube ids, no artwork stems, no
 * `heroArt`, and no `brief`/`script` — a `<Video block>` is only its id, and an
 * `<Image block>`'s description is a brief for the artist, not copy.
 *
 * Inline emphasis is kept as the source's own markdown and rendered by
 * `InlineText`; bold that formats a whole field is dropped. Paragraph breaks and
 * bullet lists come from the .docx (`\n\n`, `- `) — layout, not an edit.
 *
 * Both `<Case scenario block_1>` tables carry `turns`, so their conversations
 * render as live chat (`ConversationChat`) rather than as conversation artwork,
 * which does not exist for this module.
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

/** Chapters 1 and 2's "Sub skills covered" cell, one skill per entry. Chapter 2
 *  adds Open Questions; Chapter 3 drops Building Rapport and adds it. */
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

const M8_SETUP: ModuleSetup = {
  name: 'Module 8 - Resetting Your Body Clock',
  coreMessage:
    'A consistent body clock, supported by regular light exposure, physical activity and daily routines, helps regulate sleep and wakefulness and improve sleep quality, particularly for people living with dementia.',
  // Stops at the colon: the component names below it are labels (CLAUDE.md,
  // "Transcribing and auditing" rule 2).
  coreSkillsIntro: 'In this module, we\'ll look at all six parts of the SIPTEA framework:',
  coreSkills: SIX_COMPONENTS,
}

const M8_INTRO_SLIDE: Slide = {
  id: 's1-module-intro',
  navLabel: 'Module introduction',
  fixedTemplate: true,
  blocks: [
    {
      tag: 'module-intro',
      title: 'Before you begin',
      expectationSetting:
        'This module explores the second ingredient in the Good Sleep Recipe: Body Clock. It examines how circadian rhythms influence sleep and alertness, and how light exposure, physical activity and daily routines can support better sleep, particularly for people living with dementia.',
      transitionCopy: 'Here\'s what you can expect to hear from your clients:',
      quotes: [
        {
          text: 'If I spend the whole day indoors, I seem to feel more sluggish.',
          attribution: 'Person with lived experience',
        },
        {
          text: 'They seem fine in the morning, but by late afternoon they become restless and confused.',
          attribution: 'Care partner',
        },
        {
          text: 'My sleep routine seems to have shifted completely. I’m sleeping during the day and awake all night.',
          attribution: 'Person with lived experience',
        },
      ],
    },
  ],
}

const M8_OUTRO_SLIDE: Slide = {
  id: 's26-module-outro',
  navLabel: 'Module summary',
  fixedTemplate: true,
  blocks: [
    {
      tag: 'chapter-outro',
      moduleSummary:
        'In this module, you have explored how sleep is regulated by the body\'s internal clock and how everyday habits related to light, physical activity, and routines, can influence sleep and wakefulness, particularly for people living with dementia.',
      comingUpNext: 'Module 9',
      nextModuleCopy:
        'A tired body cannot always fall asleep if the mind and body are still on high alert. In the next module, learn why calming our thoughts and relaxing the body before bed helps allow our natural sleep systems to do their job.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Chapter 1 — slides 2-11                                             */
/* ------------------------------------------------------------------ */

const M8_CHAPTER_1: ChapterContent = {
  number: 1,
  title: 'What is the Clock?',
  // No "Scenarios used in this Chapter" selection; one pass, as Module 7.
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
          chapterTitle: 'What is the Clock?',
          whatYouWillLearn:
            'In this chapter, you will learn about the Body Clock, how it regulates our natural sleep-wake cycle, and how it works alongside Sleep Drive to determine when we feel sleepy and alert.',
          coreSkillsIntro: 'We\'ll look at five parts of the SIPTEA framework:',
          coreSkills: [...SIX_COMPONENTS.slice(0, 5), ...SUB_SKILLS],
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
            {
              text: 'What the Body Clock (Process C) is and how it regulates our sleep-wake cycle.',
              icon: 'clock',
            },
            {
              text: 'How Sleep Drive (Process S) and Body Clock (Process C) work together to regulate sleep and alertness.',
              icon: 'workflow',
            },
            {
              text: 'Factors that can disrupt the body clock and make sleep more difficult.',
              icon: 'alarm-clock-off',
            },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'Why do they seem to get more restless as the evening approaches?',
              attribution: 'Care partner',
            },
            {
              text: 'I feel like my body is telling me to sleep, but my mind is telling me to stay awake.',
              attribution: 'Person with lived experience',
            },
            {
              text: 'When I spend time outside during the day, I sleep better at night.',
              attribution: 'Care partner',
            },
          ],
          transition: 'Let\'s explore how our body clock regulates sleep and alertness.',
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
          title: 'Getting to Know Your Body Clock',
          subtitle:
            'Our Body Clock sends signals from the brain that tell our body when it\'s time to be awake and when it\'s time to sleep. Read on to learn more about how it works.',
        },
        {
          tag: 'text-3',
          subtitle: 'Getting to Know Your Body Clock',
          body:
            'In Module 6 - The Building Blocks of Good Sleep, we introduced the Good Sleep Recipe and how Process S of the Two-Process Model of Sleep Regulation involves building sleep drive (or hunger for sleep).\n\n' +
            'In this module, we will now introduce you to the second process of our model: Process C. Where Process S helps explain the pressure to sleep, Process C explains how our body knows to sleep at night and be alert during the day.',
        },
        { tag: 'image' },
        {
          tag: 'text-3',
          subtitle: 'The Body Clock: Your Internal 24-Hour Rhythm',
          body:
            'Process C refers to our *circadian rhythms*, also known as our *body clock*. It is the internal system that helps regulate the timing of various bodily functions, including our sleep-wake cycle, hormone release, body temperature and appetite.\n\n' +
            'And as Module 6 first highlighted, the Body Clock (Process C) helps determine the timing of sleep and wakefulness across the 24-hour day. The body clock sends signals that change throughout the day, helping us feel alert during the day and gradually preparing our bodies for sleep at night.\n\n' +
            'Process C (Body Clock) works together with Process S (Sleep Drive) to regulate sleep, helping align sleep pressure with the body\'s natural sleep-wake rhythm.',
        },
        { tag: 'image' },
        {
          tag: 'text-3',
          subtitle: 'How Does the Body Clock Work?',
          body:
            'Our body clock influences how alert or sleepy we feel at different times of the day.\n\n' +
            '- **Morning:** Alerting signals increase after waking, helping us feel awake and ready for the day.\n' +
            '- **Afternoon:** Alertness may dip slightly, often referred to as the "post-lunch slump".\n' +
            '- **Evening:** Alerting signals gradually decrease as the body prepares for sleep.\n' +
            '- **Night:** Alertness is naturally at its lowest, supporting sleep.\n\n' +
            'Our body temperature also naturally drops in the evening to help us wind down, then rises again in the morning to support waking.\n\n' +
            'Another important part of this process is *melatonin*, a hormone released by the brain in response to darkness. Melatonin helps prepare the body for sleep. Exposure to light in the morning suppresses melatonin production, helping us feel more awake and alert.',
        },
        {
          tag: 'text-3',
          subtitle:
            'But what helps our body clock recognise when it\'s time to be awake and when it\'s time to prepare for sleep?',
          body:
            'Light is the most important external influence on our body clock.\n\n' +
            'When light enters our eyes, it sends a powerful signal to the brain that it is daytime, helping us feel awake and alert. In contrast, lower light levels in the evening allow the body to prepare for sleep.\n\n' +
            'Other influences of our body clock include:\n\n' +
            '- Physical activity and exercise.\n' +
            '- Consistent daily routines.\n' +
            '- Regular sleep and wake times.\n\n' +
            'Keeping these patterns consistent helps our body recognise when it is time to be awake and when it is time to sleep.',
        },
      ],
    },
    {
      id: 's5-ch1-know-what',
      navLabel: 'Know what',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'text-3',
          subtitle: 'What Happens When Our Body Clock Is Out of Sync?',
          body:
            'When our body clock becomes out of sync with the 24-hour day, our sleep and energy levels can become disrupted. We may feel physically and mentally exhausted, struggle to fall asleep or stay asleep, or find it harder to feel alert during the day.\n\n' +
            'Some factors that can disrupt our body clock include:\n\n' +
            '- Shift work or jet lag.\n' +
            '- Inconsistent sleep schedules.\n' +
            '- Exposure to bright light before bedtime.\n\n' +
            'Over time, ongoing disruption can affect overall health and contribute to sleep disorders.',
        },
        { tag: 'image' },
        {
          tag: 'text-3',
          subtitle: 'The Body Clock and Dementia',
          body:
            'In people living with dementia, the strength of signals produced by the body clock can become less robust because of changes in the brain. This can contribute to irregular sleep-wake patterns and symptoms such as sundowning, where confusion, restlessness, or agitation increase in the late afternoon or early evening. These changes can also mean that the difference between daytime alertness and nighttime sleepiness becomes less clear, contributing to fragmented sleep, increased daytime napping, or being awake at unusual times.',
        },
      ],
    },
    {
      id: 's6-ch1-your-turn',
      navLabel: 'Your turn - recall and apply',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title: 'Let\'s review your body clock knowledge:',
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'MCQ',
              question: 'What are the two processes in the Two-Process Model of Sleep Regulation?',
              selectMode: 'Select one',
              options: [
                'A. Melatonin and body temperature',
                'B. Light exposure and physical activity',
                'C. Sleep Drive (Process S) and Body Clock (Process C)',
                'D. Sleep and exercise',
              ],
              correctAnswer: 'C',
              correctMessage:
                'Well done! Process S (Sleep Drive) builds sleep hunger throughout the day, while Process C (Body Clock) helps regulate the timing of sleep and wakefulness. Together, they influence when we feel sleepy and alert.',
              wrongMessage:
                'Not quite. The two processes are Sleep Drive (Process S), which builds our need for sleep, and the Body Clock (Process C), which regulates the timing of sleep and wakefulness.',
            },
            {
              type: 'MCQ',
              question: 'The Body Clock regulates our internal system over roughly how many hours?',
              selectMode: 'Select one',
              options: ['A. 12 hours', 'B. 18 hours', 'C. 24 hours', 'D. 36 hours'],
              correctAnswer: 'C',
              correctMessage:
                'That\'s right! Our body clock follows a roughly 24-hour rhythm, helping regulate our sleep-wake cycle and other bodily functions, such as hormone release, body temperature and appetite.',
              wrongMessage:
                'Not quite. Our body clock follows a roughly 24-hour rhythm, helping coordinate sleep, wakefulness and other bodily functions throughout the day and night.',
            },
            {
              type: 'MCQ',
              question:
                'Which of the following can disrupt our body clock and make it harder to maintain a regular sleep-wake pattern?',
              selectMode: 'Select one',
              options: [
                'A. Getting regular exposure to natural daylight',
                'B. Keeping a consistent sleep schedule',
                'C. Working night shifts, travelling across time zones and using bright screens before bed',
                'D. Maintaining regular daily routines',
              ],
              correctAnswer: 'C',
              correctMessage:
                'Well done! These factors can disrupt our body clock by interfering with the natural timing of our sleep-wake cycle. This can make it harder to fall asleep, stay asleep and feel alert during the day.',
              wrongMessage:
                'Not quite. Night shifts, travelling across time zones and exposure to bright light before bed can disrupt our body clock. Regular daylight exposure and consistent routines can help support it.',
            },
          ],
        },
      ],
    },
    {
      id: 's7-ch1-know-what',
      navLabel: 'Know what',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'style-1',
          heading: 'The Body Clock and Sleep Drive: Working Together',
          subheading:
            'Read on to learn more about how these two processes work together and what happens when they\'re out of sync.',
        },
        // Four rows, no artwork yet: each image pane renders its numbered
        // placeholder.
        {
          tag: 'accordion-image',
          items: [
            {
              subtitle: 'Factors influencing the Two-process Model of Sleep',
              body: 'The Two-Process Model explains the basic “engine” behind sleep: Process S builds the need for sleep, while Process C helps regulate the timing of sleep and wakefulness.',
            },
            {
              subtitle: 'When these two processes are working together',
              body:
                'We build enough sleep pressure during the day, while we receive strong signals from our body clock to be awake during the day and sleep at night.\n\n' +
                'Throughout the day, the body clock\'s alerting signals gradually increase, helping us stay awake despite growing sleep pressure. In the evening, these altering signals decrease, allowing sleep pressure to take over and support sleep.',
            },
            {
              subtitle: 'When there is a mismatch between the two processes',
              body:
                'Falling asleep, or staying asleep, might be harder.\n\n' +
                'For example, if we have built up strong sleep pressure but our body clock is still signalling wakefulness, we may feel tired but struggle to fall asleep. Similarly, if our body clock is signalling that it is time for sleep but we have not built up enough sleep pressure (for example, after a long nap), we may not feel ready to sleep.',
            },
            {
              subtitle: 'Other factors that influence sleep',
              body:
                'Even when the body\'s natural sleep processes are working as intended, other factors can make sleep more difficult. For example, stress, worry, pain, medications, environmental factors and sleep disorders can all influence how easily we fall asleep, how well we stay asleep and how refreshed we feel the next day.\n\n' +
                'Later modules will explore some of these factors in more detail.',
            },
          ],
        },
      ],
    },
    {
      id: 's8-ch1-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'Let’s explore how conversations about the body clock can help people understand how our natural 24-hour rhythm regulates sleep and wakefulness.',
        },
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title: 'Talking About the Body Clock',
          hearPairs: [
            {
              clientSays: 'Would getting outside during the day help me sleep better at night?',
              youCanSay:
                '“It may help. Natural daylight, particularly in the morning, helps regulate the body clock and supports a more regular sleep-wake pattern.”',
            },
            {
              clientSays:
                'They often become restless and confused in the late afternoon. What is happening to them?',
              youCanSay:
                '“This can sometimes be related to changes in the body clock. People living with dementia may experience increased confusion or restlessness in the late afternoon or evening, sometimes referred to as sundowning. Other factors can also contribute, let’s explore those now…”',
            },
            {
              clientSays: 'I wake up at different times each morning.',
              youCanSay:
                '“Sounds like it\'s been hard to keep a consistent wake-up time. Waking at different times can disrupt the body clock and affect how sleep drive builds. A consistent wake-up time helps both processes work together to support better sleep at night.”',
            },
          ],
        },
      ],
    },
    {
      id: 's9-ch1-case-scenarios',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        // Its Sub-heading copy is authored empty.
        { tag: 'style-1', heading: 'Let’s put your coaching to the test!' },
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
                  text: 'Have you noticed any patterns in when the person you support seems more awake, sleepy or unsettled throughout the day?',
                },
                {
                  who: 'carer',
                  text: 'They\'re usually quite settled in the morning, but in the late afternoon they become restless and sometimes seem confused. I always thought it was just because they were tired.',
                },
                {
                  who: 'coach',
                  text: 'That\'s an interesting observation. Have you noticed whether this happens around a similar time each day?',
                },
                {
                  who: 'carer',
                  text: 'Yes, almost every afternoon. I hadn\'t really thought about it being connected to their sleep.',
                },
              ],
              conversation:
                'Coach: "Have you noticed any patterns in when the person you support seems more awake, sleepy or unsettled throughout the day?" Care partner: "They\'re usually quite settled in the morning, but in the late afternoon they become restless and sometimes seem confused. I always thought it was just because they were tired." Coach: "That\'s an interesting observation. Have you noticed whether this happens around a similar time each day?" Care partner: "Yes, almost every afternoon. I hadn\'t really thought about it being connected to their sleep."',
              question: 'What is the most helpful way for the coach to build on this observation?',
              selectMode: 'Select one',
              options: [
                'A. "It sounds like they\'re probably not getting enough sleep at night. We should focus on reducing their daytime activity."',
                'B. "Our body clock helps regulate when we feel alert and when we feel sleepy. In people living with dementia, these signals can become weaker or less consistent, which may contribute to changes in alertness, confusion or restlessness later in the day."',
                'C. "This is a normal part of ageing, so it\'s best not to focus too much on changes in their sleep-wake patterns.',
              ],
              correctAnswer: 'B',
              correctMessage:
                'Exactly! The body clock helps regulate our sleep-wake cycle and influences when we feel alert or sleepy. In people living with dementia, changes in the brain can weaken these signals, contributing to irregular sleep-wake patterns and experiences such as sundowning.',
              wrongMessage:
                'Not quite. The aim is to help the care partner understand that the body clock influences patterns of alertness and sleepiness throughout the day. Changes to these signals in people living with dementia can contribute to increased restlessness or confusion later in the day.',
              tags: ['S', 'P'],
            },
            {
              type: 'Case scenario',
              turns: [
                {
                  who: 'coach',
                  text: 'What have you noticed about the person\'s sleepiness during the day and their ability to settle at night?',
                },
                {
                  who: 'carer',
                  text: 'They\'re often exhausted by the evening, but when it\'s time for bed, they seem wide awake. I don\'t understand how they can be so tired but still not fall asleep.',
                },
                {
                  who: 'coach',
                  text: 'That sounds confusing, especially when they\'re showing signs of being tired. Have you noticed whether this happens regularly?',
                },
                {
                  who: 'carer',
                  text: 'Yes, quite often. Sometimes they seem ready for bed much earlier, but then become more alert again.',
                },
              ],
              conversation:
                'Coach: "What have you noticed about the person\'s sleepiness during the day and their ability to settle at night?" Care partner: "They\'re often exhausted by the evening, but when it\'s time for bed, they seem wide awake. I don\'t understand how they can be so tired but still not fall asleep." Coach: "That sounds confusing, especially when they\'re showing signs of being tired. Have you noticed whether this happens regularly?" Care partner: "Yes, quite often. Sometimes they seem ready for bed much earlier, but then become more alert again."',
              question: 'What is the most helpful way for the coach to explain what might be happening?',
              selectMode: 'Select one',
              options: [
                'A. "If someone is tired enough, their body should naturally fall asleep. Perhaps we need to encourage them to stay in bed for longer."',
                'B. "This might be because the two processes that regulate sleep aren\'t quite aligned. Process S builds sleep pressure throughout the day, while Process C helps regulate the timing of sleep. Someone can feel tired because they\'ve built up sleep pressure, but their body clock may still be sending signals to stay awake."',
                'C. "It sounds like they\'re sleeping too much during the day. Removing all daytime naps should help them fall asleep more easily at night."',
              ],
              correctAnswer: 'B',
              correctMessage:
                'Exactly! Sleep Drive and Body Clock work together to regulate sleep. Sleep Drive builds the need for sleep, while your Body Clock helps determine when the body is ready for sleep. When these processes are out of sync, someone may feel tired but still struggle to fall asleep because their body clock is continuing to promote alertness.',
              wrongMessage:
                'Not quite. The aim is to explain that feeling tired and being biologically ready for sleep are not always the same thing. Sleep Drive and Body Clock work together, and when their signals don\'t align, falling asleep can become more difficult.',
              tags: ['S', 'E'],
            },
            {
              type: 'Case scenario',
              turns: [
                {
                  who: 'coach',
                  text: 'Have you noticed whether the person\'s exposure to natural light changes throughout the day?',
                },
                {
                  who: 'carer',
                  text: 'They spend most of the day indoors, and we usually keep the curtains closed because bright light seems to bother them. I didn\'t realise this could affect their sleep.',
                },
              ],
              conversation:
                'Coach: "Have you noticed whether the person\'s exposure to natural light changes throughout the day?" Care partner: "They spend most of the day indoors, and we usually keep the curtains closed because bright light seems to bother them. I didn\'t realise this could affect their sleep."',
              question:
                'The care partner has explained that bright light bothers the person they support. What would be the most helpful response from the coach?',
              selectMode: 'Select one',
              options: [
                'A. "Natural light is really important for sleep, so it\'s important to try to keep the curtains open during the day, even if they find the light uncomfortable."',
                'B. "If bright light bothers them, it\'s probably best to avoid natural light altogether and focus on other ways to improve their sleep."',
                'C. "It sounds like you\'ve been mindful of their comfort by adjusting the environment. We know that light helps regulate the body clock, so perhaps we could explore ways of introducing natural light that feel comfortable for them. What do you think might work?"',
              ],
              correctAnswer: 'C',
              correctMessage:
                'Exactly! The coach acknowledges the care partner\'s efforts to protect the person\'s comfort while recognising that natural light plays an important role in regulating the body clock. Rather than recommending a one-size-fits-all approach, the coach explores how light exposure could be adapted to suit the person\'s individual needs and preferences.',
              wrongMessage:
                'Not quite. The aim is to acknowledge the care partner\'s concerns and recognise that strategies need to be appropriate for the person living with dementia. While natural light helps regulate the body clock, it\'s important to explore ways of introducing it that consider the person\'s comfort and individual needs.',
              tags: ['S', 'I', 'P', 'T', 'E'],
            },
          ],
        },
      ],
    },
    {
      id: 's10-ch1-know-why',
      navLabel: 'Know why',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Understanding the body clock and its role in sleep',
          subtitle:
            'Knowing when the body is biologically ready for sleep can help us understand why sleep difficulties occur and how to support better sleep.',
          body:
            'The body clock (Process C) plays an important role in regulating when we feel awake and when we feel sleepy. Understanding how it works helps us recognise that sleep is not just about feeling tired - it is also about the timing of the body\'s natural signals for sleep and alertness.',
        },
      ],
    },
    {
      id: 's11-ch1-transition',
      navLabel: 'Transition',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'sub-title',
          copy: 'In this chapter, we\'ve explored the role of the Body Clock (Process C) and how it works alongside Sleep Drive (Process S) to regulate our sleep-wake cycle. Let’s now explore how we can use light to support our Body Clock.',
          icon: 'sun',
        },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Chapter 2 — slides 12-18                                            */
/* ------------------------------------------------------------------ */

const M8_CHAPTER_2: ChapterContent = {
  number: 2,
  title: 'Using Light to Support the Body Clock',
  scenarioCount: 1,
  slides: [
    {
      id: 's12-ch2-intro',
      navLabel: 'Chapter introduction',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-intro',
          chapterNumber: 'Chapter 2',
          chapterTitle: 'Using Light to Support the Body Clock',
          whatYouWillLearn:
            'In this chapter, you’ll learn how light exposure at different times of the day can help regulate the body clock and support better sleep. We’ll explore practical ways to use morning, daytime and evening light to encourage a healthy sleep-wake rhythm, as well as how to adapt these strategies to support people living with dementia.',
          coreSkillsIntro: 'We\'ll look at three parts of the SIPTEA framework:',
          coreSkills: [
            'S - Shared Understanding',
            'I - Implementation Intent',
            'T - Tailoring',
            ...SUB_SKILLS,
            'Open Questions',
          ],
        },
      ],
    },
    {
      id: 's13-ch2-opening',
      navLabel: 'Opening topic',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-opening',
          keyTopicsIntro: 'Here\'s what you\'ll learn:',
          keyTopics: [
            {
              text: 'How light exposure at different times of the day can help regulate the body clock.',
              icon: 'sun',
            },
            {
              text: 'Practical ways to use morning, daytime and evening light to encourage a healthy sleep-wake rhythm.',
              icon: 'sunrise',
            },
            {
              text: 'How to adapt light strategies to support people living with dementia.',
              icon: 'heart-handshake',
            },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'It\'s dark when I leave for work and dark when I get home',
              attribution: 'Care partner',
            },
            {
              text: 'We keep the house brightly lit all evening',
              attribution: 'Person with lived experience',
            },
            {
              text: 'I use my phone or tablet at night because it\'s my only time to unwind',
              attribution: 'Care partner',
            },
          ],
          transition:
            'Let\'s explore how small changes to our light habits can help strengthen the body clock.',
        },
      ],
    },
    {
      id: 's14-ch2-know-what',
      navLabel: 'Know what',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-what',
          label: 'Know What',
          title: 'Resetting The Clock',
          subtitle:
            'Light is one of the most powerful signals for our body clock. Learn how to use light exposure during the day and evening to support a healthy sleep-wake rhythm.',
        },
        {
          tag: 'text-3',
          subtitle: 'Introduction to Light Therapy',
          body:
            'When our eyes sense light, it sends a powerful message to our brain to “wake up”. This means we can use light strategically to help reset our body clocks each day.\n\n' +
            'A lot of the tools you’ll be learning about in this module come from a treatment approach called ***Light Therapy***. Light Therapy involves getting light at certain times of the day, usually through natural light or a specialised light box, and has been shown to improve mood in older adults and people living with dementia.',
        },
        // Chapter 2's knowledge video — placeholder until a YouTube id exists.
        { tag: 'video', variant: 'knowledge' },
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
          title: 'Test Your Knowledge: How Light Influences Sleep and the Body Clock',
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'MCQ',
              question:
                'Why is morning light exposure important for maintaining a healthy sleep-wake rhythm?',
              selectMode: 'Select one',
              options: [
                'A. It helps the body feel sleepy earlier in the morning.',
                'B. It helps increase alertness and reinforces the body\'s signal that it is time to be awake.',
                'C. It increases melatonin production throughout the day.',
                'D. It prevents the need for sleep at night.',
              ],
              correctAnswer: 'B',
              correctMessage:
                'That\'s correct! Bright light in the morning helps increase alertness, reduce grogginess and reinforce the body\'s natural signal that it is time to be awake.',
              wrongMessage:
                'Not quite. Morning light helps the body feel more alert and reinforces the sleep-wake rhythm by signalling that it is time to be awake.',
            },
            {
              type: 'MCQ',
              question:
                'What is recommended to help support sleep in the two to three hours before bedtime?',
              selectMode: 'Select one',
              options: [
                'A. Turn on bright ceiling lights.',
                'B. Spend time using phones and tablets.',
                'C. Dim the lights and use softer lamps.',
                'D. Increase exposure to bright natural light.',
              ],
              correctAnswer: 'C',
              correctMessage:
                'That\'s correct! Reducing bright light and using softer lighting in the evening helps signal to the brain that it is time to wind down and prepare for sleep.',
              wrongMessage:
                'Not quite. Bright light in the evening can signal to the brain that it is still time to be awake. Try dimming the lights and choosing softer lighting before bedtime.',
            },
            {
              type: 'MCQ',
              question:
                'Someone is regularly waking up too early. How might adjusting their light exposure help?',
              selectMode: 'Select one',
              options: [
                'A. Increase bright light exposure very early in the morning.',
                'B. Avoid all light exposure during the day.',
                'C. Delay bright light exposure until closer to their preferred wake-up time.',
                'D. Use bright lights immediately before bedtime.',
              ],
              correctAnswer: 'C',
              correctMessage:
                'That\'s correct! Delaying bright light exposure until closer to the person\'s preferred wake-up time may help avoid shifting their body clock even earlier.',
              wrongMessage:
                'Not quite. Getting bright light very early in the morning can shift the body clock earlier and potentially contribute to waking even earlier. Delaying light exposure may help.',
            },
          ],
        },
      ],
    },
    {
      id: 's16-ch2-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'This chapter has focused on using light strategically to help regulate the body clock and support better sleep. Now, we\'ll explore how to work with clients to identify practical ways to introduce these strategies into their daily routines.',
        },
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title: 'Examples of how the strategies can be applied in everyday situations:',
          hearPairs: [
            {
              clientSays: 'I can\'t get outside in the morning',
              youCanSay:
                'Some care partners find it difficult to get outside because they are busy with morning caregiving tasks, work commitments, poor weather, or limited mobility.\n\n' +
                'Try:\n\n' +
                '- Open curtains and blinds as soon as you wake up.\n' +
                '- Spend time near a bright window while having breakfast or a morning drink.\n' +
                '- If possible, combine morning light with another routine (e.g., taking the bin out, watering plants, sitting on the porch).\n' +
                '- Aim to build short periods of outdoor light into your day, even if only for 10–15-minutes.',
            },
            {
              clientSays: 'I use my phone or tablet at night because it\'s my only time to unwind',
              youCanSay:
                'Many care partners only have time to themselves once the person they support is asleep, making evening screen use feel important for relaxation.\n\n' +
                'Try:\n\n' +
                '- Consider whether another relaxing activity could meet the same need.\n' +
                '- If using devices, reduce brightness and enable night mode or blue-light filtering.\n' +
                '- Try finishing screen use 30–60-minutes before bed rather than stopping all at once.\n' +
                '- Avoid emotionally stimulating content close to bedtime.',
            },
            {
              clientSays:
                'We keep the house brightly lit all evening because it’s better for the person with lived experience',
              youCanSay:
                'Bright lighting can unintentionally signal to the brain that it is still daytime.\n\n' +
                'Try:\n\n' +
                '- Gradually dim lights during the evening.\n' +
                '- Use lamps or warm lighting instead of bright ceiling lights.\n' +
                '- Create a consistent "wind-down" lighting routine each night.\n' +
                '- If safety is a concern, use targeted lighting (e.g., hallway or bathroom night lights) rather than keeping the whole house brightly lit.',
            },
            {
              clientSays: 'The person I support doesn\'t want to go outside',
              youCanSay:
                'People living with dementia may be reluctant to go outdoors for a range of reasons, including anxiety, confusion, apathy, mobility difficulties, poor weather or simply not wanting to go outside.\n\n' +
                'Try:\n\n' +
                '- Pair outdoor time with an enjoyable activity (e.g., gardening, a cup of tea outside, feeding birds).\n' +
                '- Keep outings short and familiar.\n' +
                '- Sit near a bright window if going outside is not possible.\n' +
                '- Look for opportunities to increase natural light throughout the home.',
            },
          ],
        },
        {
          tag: 'case-scenario',
          label: 'Case scenario',
          cases: [
            {
              type: 'Case scenario',
              turns: [
                {
                  who: 'coach',
                  text: 'Can you tell me a little about what mornings are usually like for you and the person you care for?',
                },
                {
                  who: 'carer',
                  text: 'We tend to stay inside for most of the morning. Sometimes it takes a while for them to get going, and I find it difficult to encourage them to get up and moving.',
                },
                {
                  who: 'coach',
                  text: 'That sounds like a challenging way to start the day, particularly when you\'re trying to help them feel more awake. It\'s understandable that getting outside might not always feel achievable. Have you noticed whether they seem more alert on days when they spend some time in natural light?',
                },
                {
                  who: 'carer',
                  text: 'Actually, yes. They seem to enjoy sitting near the window when we have breakfast.',
                },
              ],
              conversation:
                'Coach: "Can you tell me a little about what mornings are usually like for you and the person you care for?" Care partner: "We tend to stay inside for most of the morning. Sometimes it takes a while for them to get going, and I find it difficult to encourage them to get up and moving." Coach: "That sounds like a challenging way to start the day, particularly when you\'re trying to help them feel more awake. It\'s understandable that getting outside might not always feel achievable. Have you noticed whether they seem more alert on days when they spend some time in natural light?" Care partner: "Actually, yes. They seem to enjoy sitting near the window when we have breakfast."',
              question:
                'The care partner has identified that the person enjoys sitting near the window during breakfast. How might you respond to support their planning?',
              selectMode: 'Select one',
              options: [
                'A. "You should make sure they go outside every morning, even if they don\'t feel like it."',
                'B. "It\'s great that you\'ve noticed they enjoy sitting near the window. Starting with opening the curtains and having breakfast there sounds like a manageable way to build morning light into your routine."',
                'C. "Try keeping the curtains closed until the person feels fully awake."',
              ],
              correctAnswer: 'B',
              correctMessage:
                'Exactly! Acknowledging what the care partner has already noticed and building on an activity the person enjoys makes the strategy more achievable. Small changes, such as opening the curtains during breakfast, can help increase morning light exposure.',
              wrongMessage:
                'Not quite. The aim is to build on what is already working and find realistic ways to increase morning light exposure. A strategy that fits naturally into the existing routine may be easier to maintain.',
              tags: ['S', 'I'],
            },
            {
              type: 'Case scenario',
              turns: [
                {
                  who: 'coach',
                  text: 'How has light exposure been fitting into your daily routine recently?',
                },
                {
                  who: 'carer',
                  text: 'It varies quite a bit. Some mornings we go outside, but other days we stay indoors. It depends on how we\'re both feeling.',
                },
                {
                  who: 'coach',
                  text: 'That makes sense. Some days are easier than others. You\'ve already identified that getting outside sometimes works well. What do you think makes those days easier?',
                },
                {
                  who: 'carer',
                  text: 'Usually when we have something planned in the morning. They seem more motivated when there\'s a reason to get outside.',
                },
                {
                  who: 'coach',
                  text: 'That\'s really useful to recognise. Regular light exposure in the morning and throughout the day can help reinforce the body\'s sleep-wake rhythm. Perhaps we could build on activities you already enjoy rather than creating a completely new routine.',
                },
              ],
              conversation:
                'Coach: "How has light exposure been fitting into your daily routine recently?" Care partner: "It varies quite a bit. Some mornings we go outside, but other days we stay indoors. It depends on how we\'re both feeling." Coach: "That makes sense. Some days are easier than others. You\'ve already identified that getting outside sometimes works well. What do you think makes those days easier?" Care partner: "Usually when we have something planned in the morning. They seem more motivated when there\'s a reason to get outside." Coach: "That\'s really useful to recognise. Regular light exposure in the morning and throughout the day can help reinforce the body\'s sleep-wake rhythm. Perhaps we could build on activities you already enjoy rather than creating a completely new routine.”',
              question: 'What should the coach say next?',
              selectMode: 'Select one',
              options: [
                'A. "What activities do you both enjoy doing in the morning, and how could we build some outdoor time into those activities?"',
                'B. "I recommend going for a walk every morning. This will help establish a consistent routine, so let\'s make that the goal."',
                'C. "You could try opening the curtains every morning and going outside more often. It\'s important to make sure this happens consistently."',
              ],
              correctAnswer: 'A',
              correctMessage:
                'Exactly! The coach is inviting the care partner to share their ideas and preferences rather than deciding on a strategy for them.',
              wrongMessage:
                'Not quite. The coach should avoid simply prescribing a strategy. Instead, they should invite the care partner to reflect on what works for them, share their ideas and help decide which changes feel achievable for both people.',
              tags: ['S', 'I', 'T'],
            },
          ],
        },
      ],
    },
    {
      id: 's17-ch2-know-why',
      navLabel: 'Know why',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Why Light Matters for Better Sleep',
          subtitle: 'Everyday light exposure can influence sleep and wellbeing',
          body:
            'Light is one of the body\'s main signals for regulating the sleep-wake rhythm. Exposure to natural light in the morning and during the day can help support alertness, mood and a more regular sleep pattern. In contrast, bright light in the evening, including light from electronic devices, can make it harder to wind down and fall asleep.\n\n' +
            'Small, consistent changes to light exposure can support a healthier sleep-wake rhythm. Working collaboratively with the dyad helps turn these strategies into realistic routines that work for both people.',
        },
      ],
    },
    {
      id: 's18-ch2-transition',
      navLabel: 'Transition',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'sub-title',
          copy: 'Alongside light exposure, physical activity and regular daily routines can also play an important role in supporting healthy sleep. Let\'s explore how movement and everyday activities can help strengthen the sleep-wake rhythm.',
          icon: 'footprints',
        },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Chapter 3 — slides 19-25                                            */
/* ------------------------------------------------------------------ */

const M8_CHAPTER_3: ChapterContent = {
  number: 3,
  title: 'Moving Through the Day: Building Healthy Habits for Better Sleep',
  scenarioCount: 1,
  slides: [
    {
      id: 's19-ch3-intro',
      navLabel: 'Chapter introduction',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-intro',
          chapterNumber: 'Chapter 3',
          chapterTitle: 'Moving Through the Day: Building Healthy Habits for Better Sleep',
          whatYouWillLearn:
            'In this chapter, you will learn how movement and daily routines can support better sleep and wellbeing.',
          coreSkillsIntro: 'We\'ll look at all six parts of the SIPTEA framework:',
          // This chapter's Sub skills cell omits Building Rapport.
          coreSkills: [...SIX_COMPONENTS, ...SUB_SKILLS.slice(1), 'Open Questions'],
        },
      ],
    },
    {
      id: 's20-ch3-opening',
      navLabel: 'Opening topic',
      fixedTemplate: true,
      blocks: [
        {
          tag: 'chapter-opening',
          keyTopicsIntro: 'Here\'s what you\'ll learn:',
          keyTopics: [
            { text: 'How physical activity supports sleep and overall wellbeing.', icon: 'dumbbell' },
            { text: 'Ways to build enjoyable movement into daily routines.', icon: 'footprints' },
            {
              text: 'How consistent routines support a healthy sleep-wake rhythm.',
              icon: 'calendar-clock',
            },
          ],
          quotesIntro:
            'A small glimpse of the kinds of things your clients might say about these topics:',
          quotes: [
            {
              text: 'The person I support is no longer able to exercise like they used to',
              attribution: 'Care partner',
            },
            {
              text: 'When we\'ve had a more active day, sleep sometimes seems to come a little easier.',
              attribution: 'Person with lived experience',
            },
            {
              text: 'I know exercise is important, but some days I\'m just too exhausted to encourage it.',
              attribution: 'Care partner',
            },
          ],
          // Not bold in the source, unlike Chapters 1 and 2 — the block styles
          // this field the same either way.
          transition:
            'Just like light, physical activity and daily routines provide important signals to the body. Read on to learn more.',
        },
      ],
    },
    {
      id: 's21-ch3-know-what',
      navLabel: 'Know what',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-what',
          label: 'Know What',
          title: 'Everyday Movement and Routines for Better Sleep',
          subtitle:
            'Discover how enjoyable physical activity, regular movement and consistent daily habits can support sleep, wellbeing and a healthy body clock.',
        },
        {
          tag: 'text-3',
          subtitle: 'The Benefits of Physical Activity',
          body:
            'Physical activity offers a range of physical and mental health benefits for everyone, including people living with dementia. It can also play an important role in supporting the body\'s internal clock and promoting better sleep.\n\n' +
            'Research suggests that regular physical activity can help regulate the body\'s clock genes and synchronise the circadian rhythm, supporting a healthier sleep-wake cycle.\n\n' +
            'Being active during the day can also help create structure and routine, improve mood and reduce long periods of sitting or daytime sleeping. Together, these benefits can help reinforce the body\'s natural signals for when to be awake and when to sleep.',
        },
        { tag: 'image' },
        {
          tag: 'text-3',
          subtitle: 'Making Movement Part of Everyday Life',
          body:
            'Around **30 minutes of daily physical activity** has been associated with better sleep quality and other health benefits, including improved heart health, for people living with dementia.\n\n' +
            'But, physical activity doesn\'t have to mean going to the gym or following a structured exercise program. The best activity is one that is enjoyable, safe and suited to the person\'s interests and abilities. This could include walking, swimming, cycling, gardening, dancing or simply moving around the home.\n\n' +
            'Some ways to build more movement into the day include:\n\n' +
            '- Aim for around 30 minutes of physical activity each day, where appropriate and achievable.\n' +
            '- Break activity into shorter sessions throughout the day rather than doing it all at once.\n' +
            '- Combine movement with natural light, such as taking a morning walk or gardening outdoors.\n' +
            '- Build movement into activities that are already part of the daily routine, such as housework, walking to appointments or spending time in the garden.\n\n' +
            'Remember, consistency is more important than intensity. Even small amounts of enjoyable movement throughout the day can make a difference.',
        },
        { tag: 'image' },
        {
          tag: 'style-1',
          heading: 'Timing Matters',
          subheading:
            'Just like bright light at night can interfere with the body clock, so can exercise close to bedtime.\n\n' +
            'Exercising too close to bedtime can elevate core body temperature and release stimulating endorphins, potentially delaying the body clock and making it harder to wind down and fall asleep.\n\n' +
            'It is recommended that we **avoid intense exercise within 2-hours of bedtime** to reduce any impact on sleep.\n\n' +
            'However, movement doesn\'t need to stop in the evening. Gentle stretching, a slow walk or other relaxing activities are usually fine if they feel comfortable and help the person unwind.',
        },
      ],
    },
    {
      id: 's22-ch3-you-might-also-hear',
      navLabel: 'You might also hear',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'interactive',
          pattern: 'you-might-also-hear',
          title:
            'Remember the concerns and experiences clients shared at the beginning of this chapter? Let\'s explore how you can respond with empathy and work together to find practical ways forward.',
          hearPairs: [
            {
              clientSays: 'The person I support is no longer able to exercise like they used to',
              youCanSay:
                'Physical limitations, frailty, or dementia progression can make previous forms of exercise difficult.\n\n' +
                'Try:\n\n' +
                '- Adapt activities to the person\'s current abilities.\n' +
                '- Consider gentle walking, chair-based exercises, stretching, dancing, or gardening.\n' +
                '- Focus on maintaining movement rather than achieving a particular exercise target.\n' +
                '- Celebrate any increase in daily movement.',
            },
            {
              clientSays: 'I know exercise is important, but some days I\'m just too exhausted to encourage it.',
              youCanSay:
                'Poor sleep often creates a cycle where daytime fatigue reduces activity, which can then make sleep more difficult.\n\n' +
                'Try:\n\n' +
                '- Start with very small amounts of movement.\n' +
                '- Choose enjoyable activities rather than structured exercise.\n' +
                '- Be active earlier in the day if possible.\n' +
                '- Remember that even light physical activity contributes to better sleep over time.',
            },
            {
              clientSays: 'I exercise at night because it\'s the only time I have',
              youCanSay:
                'Evening may be the only opportunity for physical activity for many people..\n\n' +
                'Try:\n\n' +
                '- Notice whether evening exercise affects your ability to fall asleep.\n' +
                '- If possible, finish vigorous exercise at least two hours before bedtime.\n' +
                '- Consider swapping vigorous workouts for gentler movement later in the evening (e.g., walking, stretching, yoga).\n' +
                '- Focus on doing what is realistic rather than aiming for perfection.',
            },
          ],
        },
        {
          tag: 'interactive',
          pattern: 'your-turn',
          title: 'Test Your Understanding',
          interactionType: 'Multiple-choice question',
          questions: [
            {
              type: 'MCQ',
              question:
                'How much physical activity is associated with better sleep quality and other health benefits for people living with dementia?',
              selectMode: 'Select one',
              options: [
                'A. Around 10 minutes once a week',
                'B. Around 30 minutes each day, where appropriate and achievable',
                'C. At least 60 minutes in one continuous session each day',
                'D. Only when the person feels tired',
              ],
              correctAnswer: 'B',
              correctMessage:
                'Around 30 minutes of daily physical activity has been associated with better sleep quality and other health benefits. This can be broken into shorter sessions throughout the day rather than completed all at once.',
              wrongMessage:
                'Remember that around 30 minutes of daily activity is a useful guide, but it can be spread across shorter sessions and adapted to the person\'s abilities.',
            },
            {
              type: 'MCQ',
              question: 'Which of the following activities count as physical movement?',
              selectMode: 'Select one',
              options: [
                'A. Walking, gardening and dancing',
                'B. Swimming, cycling and stretching',
                'C. Everyday activities such as housework and moving around the home',
                'D. All of the above',
              ],
              correctAnswer: 'D',
              correctMessage:
                'Movement comes in many forms. It does not need to be structured exercise. Everyday activities, hobbies and gentle movement can all help people stay active.',
              wrongMessage:
                'Physical activity includes more than formal exercise. Think about the different ways someone can move throughout the day, including everyday tasks and enjoyable activities.',
            },
            {
              type: 'MCQ',
              question: 'When should intense physical activity ideally be avoided to help support sleep?',
              selectMode: 'Select one',
              options: [
                'A. Within 30 minutes of waking up',
                'B. During the middle of the day',
                'C. Within two hours of bedtime',
                'D. At any time after lunch',
              ],
              correctAnswer: 'C',
              correctMessage:
                'Intense exercise within two hours of bedtime can increase body temperature and alertness, making it harder to wind down and fall asleep. Gentle activities, such as stretching or a slow walk, are usually fine if comfortable.',
              wrongMessage:
                'Consider how intense exercise close to bedtime can make it harder to relax. Aim to avoid intense activity in the two hours before bed, while allowing for gentle movement if it feels comfortable.',
            },
          ],
        },
      ],
    },
    {
      id: 's23-ch3-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-how',
          label: 'Know How',
          title: 'Coaching in Action',
          subtitle:
            'Learn how to coach dyads to build enjoyable movement and consistent daily routines into everyday life.',
        },
        {
          tag: 'text-3',
          subtitle: 'Coaching for Body Clock',
          body:
            'Supporting the body clock is about re-establishing regular routines and habits, particularly regarding the timing of light exposure and physical activity.\n\n' +
            'Try asking your dyad these kinds of questions:\n\n' +
            '- How much time do you spend outside or in bright light?\n' +
            '- Do you use technology in the evenings?\n' +
            '- How do you feel after using screens late at night?\n' +
            '- What kind of lighting do you usually have in the evening?\n' +
            '- What are some of the things that you enjoy to keep your body active?\n' +
            '- When during the day is it easiest to fit this in?\n' +
            '- How might your caring responsibilities affect this?\n' +
            '- What about the person you care for?',
        },
        {
          tag: 'case-scenario',
          label: 'Case scenario',
          cases: [
            {
              type: 'Case scenario',
              turns: [
                {
                  who: 'coach',
                  text: 'It sounds like finding time for movement has been a bit challenging lately. Can you tell me a little more about what gets in the way?',
                },
                {
                  who: 'carer',
                  text: 'Some days we\'re both tired, and getting out for a walk feels like too much effort.',
                },
                {
                  who: 'coach',
                  text: 'That’s completely understandable. It sounds like you’d both like to be more active, but it needs to feel manageable. What are some activities you already enjoy doing together?',
                },
                {
                  who: 'carer',
                  text: 'We used to enjoy gardening. Maybe we could start with that again.',
                },
              ],
              conversation:
                'Coach: “It sounds like finding time for movement has been a bit challenging lately. Can you tell me a little more about what gets in the way?” Care partner: “Some days we\'re both tired, and getting out for a walk feels like too much effort.” Coach: “That’s completely understandable. It sounds like you’d both like to be more active, but it needs to feel manageable. What are some activities you already enjoy doing together?” Care partner: “We used to enjoy gardening. Maybe we could start with that again.”',
              question: 'What skills did the coach use?',
              selectMode: 'Select multiple',
              options: [
                'A. Empathy',
                'B. Open-ended questioning',
                'C. Reflective Listening',
                'D. Giving advice',
                'E. Affirmation',
              ],
              correctAnswer: 'A + B + C',
              correctMessage:
                'Exactly! The coach demonstrates empathy by acknowledging the care partner\'s feelings, uses open-ended questions to encourage sharing, and reflective listening to show understanding of their experience.',
              wrongMessage:
                'Not quite. Listen carefully to how the coach responds. They acknowledge the care partner\'s feelings, invite them to share more about their experiences, and reflect back what they\'ve heard to demonstrate understanding. These are key skills that help build trust and support collaborative conversations.',
              tags: ['S', 'E'],
            },
            {
              type: 'Case scenario',
              turns: [
                {
                  who: 'ple',
                  text: 'I used to enjoy gardening, but I haven\'t been doing much of it lately.',
                },
                {
                  who: 'carer',
                  text: 'Honestly, I\'d love for us to spend more time outside together, but I\'m not sure how to get started.',
                },
                {
                  who: 'coach',
                  text: 'It sounds like gardening is something you both value. What would be a manageable way to bring a little more of it into your week?',
                },
                {
                  who: 'ple',
                  text: 'I think I could water the plants and maybe do a bit of planting.',
                },
                {
                  who: 'coach',
                  text: 'That\'s a great starting point. How often would you like to do that together?',
                },
                { who: 'carer', text: 'Maybe three mornings a week, after breakfast?' },
                { who: 'ple', text: 'Yes, I think I could manage that.' },
                {
                  who: 'coach',
                  text: 'So, would setting a goal to spend around 15 minutes gardening together three mornings a week feel achievable for both of you?',
                },
                { who: 'carer', text: 'Yes, I think that\'s something we can try.' },
                {
                  who: 'coach',
                  text: 'Great. We can check in on how it\'s working and make changes if needed. The important thing is that it feels enjoyable and manageable for you both.',
                },
              ],
              conversation:
                'Person living with dementia: “I used to enjoy gardening, but I haven\'t been doing much of it lately.” Care partner: “Honestly, I\'d love for us to spend more time outside together, but I\'m not sure how to get started.” Coach: “It sounds like gardening is something you both value. What would be a manageable way to bring a little more of it into your week?” Person living with dementia: “I think I could water the plants and maybe do a bit of planting.” Coach: “That\'s a great starting point. How often would you like to do that together?” Care partner: “Maybe three mornings a week, after breakfast?” Person living with dementia: “Yes, I think I could manage that.” Coach: “So, would setting a goal to spend around 15 minutes gardening together three mornings a week feel achievable for both of you?” Care partner: “Yes, I think that\'s something we can try.” Coach: “Great. We can check in on how it\'s working and make changes if needed. The important thing is that it feels enjoyable and manageable for you both.”',
              question: 'What skills did the coach demonstrate?',
              selectMode: 'Select multiple',
              options: [
                'A. Collaborative goal setting',
                'B. Supporting autonomy and choice',
                'C. Giving direct instructions',
                'D. Breaking a goal into a specific, achievable action',
                'E. Using confrontation to encourage behaviour change',
              ],
              correctAnswer: 'A + B + D',
              correctMessage:
                'Exactly! The coach involves both people in choosing an activity, deciding how often to do it and agreeing on a realistic goal. They support the dyad\'s autonomy by checking that the goal feels achievable and leaving room to adjust it.',
              wrongMessage:
                'Not quite. Notice how the coach helps the dyad turn an enjoyable activity into a specific and manageable goal. Both people have a say in deciding what they would like to do and how often, supporting shared decision-making and autonomy.',
              tags: ['S', 'I', 'T', 'A'],
            },
          ],
        },
      ],
    },
    {
      id: 's24-ch3-know-how',
      navLabel: 'Know how',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'style-1',
          heading: 'Supporting Your Dyad Through Light and Daily Activity',
          subheading: 'Watch a video putting these coaching strategies into action:',
        },
        // Chapter 3's scenario video — placeholder until a YouTube id exists.
        // Its dialogue script stays in module.md.
        { tag: 'video', variant: 'scenario' },
      ],
    },
    {
      id: 's25-ch3-know-why',
      navLabel: 'Know why',
      fixedTemplate: false,
      blocks: [
        {
          tag: 'know-why',
          label: 'Know Why',
          title: 'Understanding the Body Clock and Sleep',
          subtitle:
            'Understanding how the body clock influences sleep and wakefulness can help us support healthier daily routines and improve sleep patterns for people living with dementia.',
          body:
            'Dementia can affect the body\'s internal clock (circadian rhythm), making it harder to maintain regular sleep-wake patterns. Changes in the brain can weaken the signals that help regulate when we feel awake during the day and sleepy at night. Alongside light exposure, physical activity and consistent daily routines can help reinforce the body clock. By encouraging enjoyable physical activity and consistent routines in the evening, care partners can help support a more predictable sleep-wake rhythm for themselves and the person they care for.',
        },
      ],
    },
  ],
}

export const MODULE_8: ModuleContent = {
  moduleId: 'resetting-body-clock',
  setup: M8_SETUP,
  introSlide: M8_INTRO_SLIDE,
  chapters: [M8_CHAPTER_1, M8_CHAPTER_2, M8_CHAPTER_3],
  outroSlide: M8_OUTRO_SLIDE,
}

/**
 * Discrepancies in `Module 8.md`, raised rather than corrected (the source is
 * read-only). Everything above is transcribed as authored.
 */
export const CONTENT_FLAGS: string[] = [
  'Slide 7, accordion row 2: "these altering signals decrease" — probably "alerting".',
  'Slide 9, case 1, option C opens a quote mark it never closes.',
  'Slide 22, You Might Also Hear row 3: "for many people.." ends with two full stops.',
  'Slide 21 and slide 22 disagree on wording: "within 2-hours of bedtime" (body) vs "within two hours of bedtime" (quiz). Not an error, just inconsistent.',
  'The Click to reveal blocks (slides 8, 16 and 22) name the speaker in their Topic / concept column ("Person with lived experience might say…", "Dyad might say…"). The block does not render that column, so who is speaking is not shown.',
  'Slides 4 and 7 ask for "the image used in Module 6" for the body clock and the Two-Process Model. Every image is a placeholder in this build.',
  'The video block on slide 14 is a knowledge video and the one on slide 24 a scenario video; neither has a YouTube id yet.',
  'Chapter 3\'s "Sub skills covered" omits Building Rapport, which Chapters 1 and 2 list first.',
]
