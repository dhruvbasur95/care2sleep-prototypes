/**
 * The "How to set up your Zoom meeting link" walkthrough in the session plan wizard's
 * Create Zoom link step. One entry per slide, in the order the coach pages
 * through them.
 *
 * Source: the Notion page "Zoom Session Creation" (2026-10-21), from its
 * opening paragraph down. Left out by direct instruction: the AI-generated
 * notice above that paragraph, the "Open items", and "Why these settings"
 * (research-team rationale, not something a coach acts on). "consumer" is
 * "client" throughout, because this is coach-facing copy.
 *
 * Inline markup, kept deliberately small so the copy stays readable here:
 * `**text**` is a Zoom UI label (rendered semibold) and `[text](url)` is a
 * link. Nothing else is parsed.
 *
 * Images are the Notion screenshots, at 2x. `width`/`height` are their pixel
 * sizes, so the slide can reserve the box before the file loads.
 */

export type ZoomGuideBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'callout'; text: string }
  /** A yellow box holding one value the coach pastes into Zoom, with a
   *  button that copies it (direct instruction, 2026-10-21). `label` sits
   *  before the value; `button` is the button's own text. */
  | { kind: 'copy'; label: string; value: string; button: string }

export interface ZoomGuideImage {
  file: string
  width: number
  height: number
  alt: string
}

export interface ZoomGuideSlide {
  title: string
  blocks: ZoomGuideBlock[]
  image?: ZoomGuideImage
}

export const ZOOM_GUIDE: ZoomGuideSlide[] = [
  {
    title: 'Before you start',
    blocks: [
      {
        kind: 'p',
        text: 'Use this guide to create the Zoom meeting for the SPACES sessions of one client. Create one recurring meeting for each client, when the client is assigned to you. You use the same meeting link for all their sessions.',
      },
      {
        kind: 'ul',
        items: [
          'Sign in to Zoom with your Monash account.',
          "Get the client ID from Care2Sleep. Do not put the client's name anywhere in Zoom.",
          'Check if the client agreed to be recorded.',
          'Get the email addresses of the research team members to add as alternative hosts.',
        ],
      },
    ],
  },
  {
    title: 'Step 1: Open the Schedule Meeting page',
    blocks: [
      {
        kind: 'p',
        text: 'Go to [https://zoom.us/meeting/schedule](https://zoom.us/meeting/schedule). Sign in to your Monash staff account if prompted.',
      },
    ],
  },
  {
    title: 'Step 2: Enter the topic',
    blocks: [
      {
        kind: 'p',
        text: 'In **Topic**, enter **C2S-SPACES-** and then the client ID. For example: **C2S-SPACES-1234**.',
      },
      /* Placeholder client ID, deliberately not linked to any client yet
         (direct instruction: "for now add a random client ID"). Wire it to
         the plan's own client when the wizard passes one in. */
      {
        kind: 'copy',
        label: 'Your topic details:',
        value: 'C2S-SPACES-4827',
        button: 'Copy details',
      },
    ],
    image: {
      file: '01-topic.png',
      width: 1396,
      height: 220,
      alt: 'The Topic field in Zoom, filled in with C2S-SPACES- and a client ID.',
    },
  },
  {
    title: 'Step 3: Set the date and time',
    blocks: [
      {
        kind: 'p',
        text: 'In **When**, enter the date and time of the first coaching session. Keep **Duration** at 1 hr and **Time Zone** at your local time zone.',
      },
      {
        kind: 'p',
        text: 'Zoom does not limit the meeting to this time. The link works at any time, so if a session moves, you do not change anything in Zoom.',
      },
    ],
    image: {
      file: '02-when.png',
      width: 1396,
      height: 358,
      alt: 'The When, Duration and Time Zone fields in Zoom.',
    },
  },
  {
    title: 'Step 4: Make the meeting recurring',
    blocks: [
      {
        kind: 'ol',
        items: [
          'Select **Recurring meeting**.',
          'In **Recurrence**, select **Weekly**.',
          'In **End date**, select **After** and set it to **7** occurrences.',
        ],
      },
    ],
    image: {
      file: '03-recurrence.png',
      width: 2222,
      height: 554,
      alt: 'Recurring meeting selected in Zoom, set to weekly and ending after 7 occurrences.',
    },
  },
  {
    title: 'Step 5: Check the security settings',
    blocks: [
      {
        kind: 'ol',
        items: [
          'Keep **Passcode** selected. Zoom selects it by default.',
          'Select **Waiting Room**. Then you admit each person into the meeting.',
        ],
      },
    ],
    image: {
      file: '04-security.png',
      width: 1432,
      height: 486,
      alt: 'The Security section in Zoom, with Passcode and Waiting Room selected.',
    },
  },
  {
    title: 'Step 6: Turn on automatic cloud recording',
    blocks: [
      {
        kind: 'ol',
        items: [
          'Next to **Options**, select **Show**.',
          'Select **Automatically record meeting**.',
          'Select **In the cloud**.',
        ],
      },
      {
        kind: 'callout',
        text: 'Zoom selects **On the local computer** by default. Make sure that you change it to **In the cloud**. If the client did not agree to be recorded, do not select **Automatically record meeting**.',
      },
    ],
    image: {
      file: '05-recording.png',
      width: 1554,
      height: 502,
      alt: 'The Options section in Zoom, with Automatically record meeting and In the cloud selected.',
    },
  },
  {
    title: 'Step 7: Add the research team as alternative hosts',
    blocks: [
      {
        kind: 'ol',
        items: [
          'In **Alternative Hosts**, enter the email address of each research team member.',
          'Keep all of the co-owner options selected: **Meeting summary**, **Meeting cloud recording**, and **Add or edit polls**. These let the research team get the recordings.',
        ],
      },
      /* Placeholder address on the prototype's own `example.au` domain, so it
         cannot be mistaken for a real inbox. Swap for the research team's
         address when it is confirmed. */
      {
        kind: 'copy',
        label: 'Researcher email:',
        value: 'research.team@care2sleep.example.au',
        button: 'Copy email',
      },
    ],
    image: {
      file: '06-alternative-hosts.png',
      width: 1696,
      height: 408,
      alt: 'The Alternative Hosts field in Zoom, with all three co-owner options selected.',
    },
  },
  {
    title: 'Step 8: Save the meeting',
    blocks: [{ kind: 'p', text: 'Select **Save**. Keep the default value of all other settings.' }],
    image: {
      file: '07-save.png',
      width: 398,
      height: 136,
      alt: 'The Save button in Zoom.',
    },
  },
  {
    title: 'Step 9: Add the link to Care2Sleep',
    blocks: [
      {
        kind: 'ol',
        items: [
          'On the **Meeting Information** page that opens, find **Invite Link**.',
          'Select the copy icon to the right of the link.',
          "Paste the link into the client's session plan in Care2Sleep.",
        ],
      },
    ],
    image: {
      file: '08-invite-link.png',
      width: 1700,
      height: 690,
      alt: 'The Meeting Information page in Zoom, with the Invite Link and its copy icon highlighted.',
    },
  },
  {
    title: 'When something changes',
    blocks: [
      {
        kind: 'ul',
        items: [
          '**A session moves to a different day or time.** Change the session date in Care2Sleep only. The Zoom link stays the same.',
          '**The client moves to a different coach.** The new coach creates a new meeting with this guide and puts the new link in Care2Sleep. Zoom cannot move a meeting from one user to another.',
        ],
      },
    ],
  },
]
