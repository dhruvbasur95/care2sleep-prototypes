/**
 * ⚠️ DUMMY DATA — a single Zoom-style session transcript, reused everywhere a
 * transcript is shown.
 *
 * **What this stands in for.** A coach uploads the Zoom transcript file when
 * they confirm a session as complete, and it is shared with the research team
 * from that moment. Nothing on the platform stores one yet: there is no
 * transcript field on `SessionPlanRow`, no upload path on the coach side, and
 * no per-session file. This module is the placeholder for that, on direct
 * instruction ("you do not need to re-create any database now to link the two").
 *
 * **What replaces it.** One uploaded file per held session, keyed off the same
 * session number the reflection already carries. When that lands, delete this
 * file and read the real transcript; every caller already asks for it by
 * `(dyad, session)`, so nothing else has to change.
 *
 * The content is the same conversation for every session and every dyad — only
 * the speaker names are substituted — because it exists to show the shape of a
 * transcript, not to describe any real pairing.
 */

export interface TranscriptLine {
  /** Elapsed time from the start of the recording, as Zoom stamps it. */
  time: string
  speaker: string
  text: string
}

/** Roles in the seed below, swapped for real names by `sessionTranscript`. */
type Role = 'coach' | 'ple' | 'carer'

const SEED: { time: string; role: Role; text: string }[] = [
  { time: '00:00:06', role: 'coach', text: 'Morning both — can you hear me all right?' },
  { time: '00:00:11', role: 'carer', text: 'We can, yes. Give me one second, I am just moving the laptop so we are both in shot.' },
  { time: '00:00:19', role: 'coach', text: 'No rush at all. How has the week been?' },
  { time: '00:00:24', role: 'carer', text: 'Mixed, honestly. Two good nights and then Thursday was back to the old pattern.' },
  { time: '00:00:33', role: 'ple', text: 'I was awake at three again. I did not want to wake her so I just lay there.' },
  { time: '00:00:41', role: 'coach', text: 'That sounds like a long stretch to be lying there awake. What did you end up doing?' },
  { time: '00:00:48', role: 'ple', text: 'Nothing much. I looked at the clock a fair bit, which I know you told me not to do.' },
  { time: '00:00:57', role: 'coach', text: 'No judgement here — clock watching is one of the hardest habits to drop. Can I ask what the room was like? Light, temperature?' },
  { time: '00:01:08', role: 'carer', text: 'The hall light is on all night. That was my doing, for the falls.' },
  { time: '00:01:16', role: 'coach', text: 'That makes complete sense, and I am not going to ask you to turn it off. Could we try something dimmer at floor level instead, so the path is still lit?' },
  { time: '00:01:29', role: 'carer', text: 'A plug-in one, you mean? We could try that.' },
  { time: '00:01:34', role: 'coach', text: 'Exactly that. Shall we make it this week’s one change, and leave everything else as it is so we can see what it does on its own?' },
  { time: '00:01:45', role: 'ple', text: 'I can manage one thing.' },
  { time: '00:01:48', role: 'coach', text: 'One thing is the whole idea. I will note it down, and we will look at the diary together next week before we add anything else.' },
  { time: '00:01:58', role: 'carer', text: 'That works for us. Same time next Tuesday?' },
  { time: '00:02:03', role: 'coach', text: 'Same time. Thanks both — and go gently on yourselves if Thursday happens again.' },
]

/**
 * The transcript for one session, with the pairing's own names substituted.
 * `ple` is optional so a carer-only household reads correctly rather than
 * naming someone who is not in the study.
 */
export function sessionTranscript(names: { coach: string; ple?: string; carer: string }): TranscriptLine[] {
  const speaker: Record<Role, string> = {
    coach: names.coach,
    ple: names.ple ?? names.carer,
    carer: names.carer,
  }
  return SEED.map((l) => ({ time: l.time, speaker: speaker[l.role], text: l.text }))
}

/** Plain-text rendering, in the shape Zoom's own transcript download uses. */
export function transcriptAsText(lines: TranscriptLine[], heading: string): string {
  return [heading, '', ...lines.map((l) => `${l.time}  ${l.speaker}\n${l.text}\n`)].join('\n')
}
