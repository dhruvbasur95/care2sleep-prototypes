# Care2Sleep — Trainee/Coach Portal: data model

**Scope.** Every type and field the Coach Delivery Portal (`/delivery/*`) and the module-learning surfaces (`/training-v2/*`) read or write.

**Audience.** An engineer designing a real schema. Nothing here is a backend. Everything in `src/data/` is a TypeScript literal compiled into the bundle; everything mutable is React `useState` inside one provider (`src/data/research-store.tsx`) and is lost on page reload.

**Source root.** `handover/trainee-coach-portal/app/src/` (byte-identical to `design/prototype/care2sleep-prototype/src/` at time of writing — verified by `diff -q`).

**Verification.** Every invariant in §7 was executed against every seeded record with `npx tsx` importing the real modules. 25 held; the failures are reported as seed defects in §7.2, not corrected.

---

## 0. Domain primer

An engineer who has not read the study protocol needs these six words before the schema makes sense.

| Term | Meaning |
|---|---|
| **Coach** | An aged-care worker recruited into the study. Passes through the **COACH** training pathway (8 phases), is **certified**, and then delivers the intervention under **SPACES**. In the code, one `Coach` record covers both lives — the trainee and the certified coach are the same row. Never "trainee" in UI copy, but `Coach.currentPhase < 8` is what "trainee" means in data. |
| **Consumer / Client** | The people receiving sleep coaching. Same people, **audience-dependent word**: researcher surfaces say "consumer", coach surfaces say "client". Internal identifiers keep "consumer" (`ConsumerDyad`, `dyadId`, `/delivery/consumers/:id`) — those are code, not copy, and must not be renamed. |
| **Dyad** | The unit of enrolment: **one person living with dementia + their carer**, enrolled together and coached together as one case. Modelled as `ConsumerDyad`. A dyad may be **carer-only** (`patient` absent) — a carer participating without a co-enrolled person with dementia. There is no separate `Person` table; the two people are embedded objects on the dyad. |
| **PLE** | *Person with Lived Experience* — the dyad member living with dementia. This is the display label for `ConsumerDyad.patient`. The field name is legacy (`patient`); the label was `PLWD` until 2026-08-19. Never "patient" in UI. |
| **Catch-up session** | One of the 6 numbered coaching sessions. The consumer works through a content module on their own; the coach then **catches up** with them about it. The session follows the module — never the reverse. Preceded by an unnumbered **Planning** session (see §2). |
| **Annotation summary / reflection** | The coach's own structured **SIPTEA** self-reflection. Two entirely different things share this name in the codebase — see §5. Never called a "report". A coach's reflection is written **from a session debrief**, not at will. |
| **SIPTEA** | The 6-component in-session coaching framework: **S**hared understanding, **I**mplementation intent, **P**roblem identification, **T**ailoring, **E**motion navigation, **A**ction and goals. It is the shared vocabulary across training, assessment, feedback and supervision, and it is the fixed shape of every reflection record. |

Two numbering systems collide throughout and are the single most dangerous thing in this schema. Read §2 before writing any migration.

---

## 1. Entity map

```
Coach (research.ts)  ─── 1 ────► CertificationRecord      (embedded)
  │                  ─── N ────► ModuleRecord              (embedded, coach's OWN training)
  │                  ─── N ────► AnnotationSummary         (embedded, 4 COACH timepoints)
  │                  ─── N ────► GroupSessionAttendance    (embedded)  ──► GroupSession
  │                  ─── 0/1 ──► TraineeUpcomingSession    (embedded)
  │
  ├──◄ SpacesCoach (spaces.ts)      1:0..1  — the SPACES onboarding record
  ├──◄ ConsumerDyad.coachId         1:N     — the caseload
  └──◄ SupervisionNote.coachId      1:N

ConsumerDyad (spaces.ts)
  ├── patient?: PersonProfile          (PLE — absent for carer-only)
  ├── carer:    PersonProfile
  ├── sessionsCompleted: SessionCompletionRecord[]     ← seed; live copy in store
  ├── sessionPlan?: SessionPlan                        ← seed; live copy in store
  │     ├── sessions: SessionPlanRow[7]
  │     └── adHocMeetings: AdHocMeeting[]
  ├── moduleEngagement: ConsumerModuleRecord[7]        ← the CLIENT's learning
  ├── annotationSummaries: AnnotationSummaryEntry[]    ← the COACH's reflections about this client
  ├── patientLog / carerLog: HealthLogEntry[]          ← Fitbit + sleep diary, per person per night
  ├── consentDocuments: ConsentDocument[]
  ├── sessionRecordings: SpacesSessionRecording[]
  ├── upcomingSession?: UpcomingSession                ← LEGACY, superseded by sessionPlan
  └── optedOut?: { reason, date }

Curriculum (two separate, unconnected sets — see §6)
  PATHWAY_MODULES_V2[11]  — the COACH's own training curriculum   (trainingPathwayV2.ts)
  CONSUMER_MODULES[7]     — the CLIENT's content modules          (spaces.ts)
```

---

## 2. Session numbering — read this first

`SPACES_SESSIONS` (`spaces.ts:53`) has **7 entries, keyed 1–7**. What a human reads is **not** that number.

| Internal `number` | `name` | What a coach/client/researcher sees |
|---|---|---|
| 1 | Planning | **"Planning"** — never "Session 0", never a number |
| 2 | Post-Module 1 | "Session 1" |
| 3 | Post-Module 2 | "Session 2" |
| … | … | … |
| 7 | Post-Module 6 | "Session 6" |

**Session 1 (internal) is the Planning meeting** — the coach and client's first meeting, where they agree the module target dates and the catch-up schedule. It is *not* the always-unlocked "Getting started" content module (`CONSUMER_MODULES[0]`), which is a separate thing the client can open the day they enrol.

Every stored key — `sessionCompletion`, `SessionPlanRow.session`, `SpacesSessionRecording.session`, `AnnotationSummaryEntry.session`, `SupervisionNote.session` — uses the **internal** number. The offset exists only because renumbering the seed would have been a migration; a real schema should decide once and store one number.

### Single sources of truth (do not reimplement)

| Fact | The one function | File:line |
|---|---|---|
| Display number for a catch-up | `displaySessionNumber(n) = n - 1` | `spaces.ts:71` |
| Display **label** for any session incl. Planning | `sessionRowLabel(n)` | `spaces.ts:85` |
| "N of 6" progress figure | `catchupSessionsCompleted(completed)` — filters out session 1 | `spaces.ts:120` |
| The 6-catch-up denominator | `SPACES_CATCHUP_COUNT` (= `SPACES_SESSIONS.length - 1`) | `spaces.ts:106` |
| The next session as a **record** | `nextUpcomingSessionEntry(plan, completed, legacyUpcoming)` | `spaces.ts:344` |
| The next session as a **number** | `nextUpcomingSessionNumber(...)` — delegates to the above | `spaces.ts:359` |
| Earliest dated, uncompleted plan row | `nextPlannedSession(plan, completed)` | `spaces.ts:307` |
| Whether the whole arc is planned | `isPlanSet(plan)` | `spaces.ts:295` |

`nextUpcomingSessionEntry` and `nextUpcomingSessionNumber` exist because two adjacent table columns ("Upcoming Session" and "Session Date") were each resolving "which session is next" independently and could disagree. **A production schema should expose "next session" as one derived view, not two.**

**A raw number is never safe to render.** `sessionRowLabel()` handles internal 1 correctly ("Planning"); `displaySessionNumber(1)` returns `0` and renders as the nonsensical "Session 0". Both `nextPlannedSession` and `nextUpcomingSessionEntry` deliberately exclude internal session 1 for exactly this reason.

---

## 3. `Coach` — the trainee/coach record

`src/data/research.ts:535`. One row per person. The coach portal reads it for identity, certification and the certificate download; it does **not** read `moduleRecords` (see §6.3).

### Stored fields

| Field | Type | Domain meaning | Notes |
|---|---|---|---|
| `id` | `string` | Internal key. Seed ids are slugified names (`'helen-zhang'`); runtime ids are `` `coach-${Date.now()}` `` (`research-store.tsx:327`). | Not a study identifier. |
| `participantId` | `string` | **The study identifier** — `C2S-C-NNN`. What appears on the certificate and in research records. | Generated by `nextParticipantId(coaches)` (`research.ts:1455`), which scans the max numeric suffix and adds 1. Currently returns `C2S-C-026`. Not collision-safe under concurrency. |
| `fullName`, `initials` | `string` | Display identity. `initials` is stored, not derived — it can drift from `fullName`. | Avatars are banned app-wide, so `initials` has almost no reader left. |
| `email`, `phone` | `string` | Contact. Editable from the coach's own My profile (`updateContact`). | |
| `employer`, `roleAtEmployer`, `yearsInAgedCare` | `string`/`number` | The aged-care partner organisation the coach was recruited from, their job title there, and their experience. Carried from recruitment. | Partner organisations are an open study decision (CLAUDE.md). |
| `cohort` | `string` | Training cohort. **Stage O (guided group practice) is scheduled per cohort, not per trainee** — this is the join key for `CohortUpcomingSession`. | "Cohort" was removed as *user-facing* copy but is load-bearing data. Stops applying once certified. |
| `enrolmentDate` | ISO date | Phase 2 complete — the trainee has a working portal account. | |
| `status` | `'enrolled'\|'active'\|'withdrawn'\|'completed'` | Study **lifecycle** status. `'completed'` means they finished the COACH pathway. | |
| `inviteStatus` | `'pending'\|'active'` | Whether they have **accepted the platform invite**. A genuinely separate axis from `status`. | **This pairing has caused a shipped bug twice** (Round 9, Round 20): a KPI counted `status` while the column headed "Status" rendered `inviteStatus`, and the two disagreed on screen. In a real schema, name them so this cannot happen. |
| `currentPhase` | `1..8` | Position in the 8-phase COACH pathway (see §3.2). | The `>= 8` boundary is what "certified and delivering" means. |
| `withdrawalNote` | `string?` | Free text, set by `withdrawCoach`. | Present only when `status === 'withdrawn'`. |
| `lastActive` | ISO date? | Last platform activity. **Absent means never signed in** — correct for an unaccepted invite; the roster renders "Never". | Invariant: `<= TODAY`. Holds. But see §7.2 D6 — the signed-in coach persona has no value. |
| `moduleRecords` | `ModuleRecord[]` | The coach's **own** training progress, 1 per curriculum module. | See §6.3 — the coach portal never reads this. |
| `demoVideoNotes` | `string?` | Free-text submission for the Phase 3 demonstration-video analysis task. | Write-once, no UI write path in this package. |
| `annotationSummaries` | `AnnotationSummary[]` | The coach's own **4-timepoint** SIPTEA reflections (§5.1). | |
| `groupSessionAttendance` | `{sessionId, attended}[]` | Attendance against `groupSessions`. | Attendance is the artefact that *proves* Stage O happened. |
| `certification` | `CertificationRecord` | Placement 2 outcome. | §3.3 |
| `notificationPreferences` | `{email, sms}?` | Additive; defaults applied at render when absent. | |
| `upcomingSession` | `TraineeUpcomingSession?` | The trainee's own next **individual** placement Zoom session (Stage A or H). | Cohort sessions live on `upcomingGroupSessions` instead. |

### 3.2 The 8 COACH phases

`STUDY_PHASES` (`research.ts:53`). Five map to a lettered COACH stage; three do not.

| # | Name | Stage code | Display via `stageLabel(n)` |
|---|---|---|---|
| 1 | Recruitment | — | `Phase 1: Recruitment` |
| 2 | Enrolment and platform access | — | `Phase 2: Enrolment and platform access` |
| 3 | Content learning | **C** | `Stage C: Learning` |
| 4 | Guided group practice | **O** | `Stage O: Group Practice` |
| 5 | Placement 1 | **A** | `Stage A: Placement 1` |
| 6 | Community of practice | **CP** | `Stage CP: Community Practice` |
| 7 | Placement 2 and certification | **H** | `Stage H: Waiting final assessment` |
| 8 | Entry into SPACES delivery | — | `Phase 8: Entry into SPACES delivery` |

Single source of truth: `stageLabel(n)` (`research.ts:78`) and `stageShortName(n)` (`research.ts:65`). Never write the string. Colon separator, never an em dash.

**Completed-phase state is not on the `Coach` record.** It lives in the store as `phaseCompletion: Record<coachId, number[]>` and `phaseCompletionDates: Record<coachId, Record<phase, ISO date>>` — see §8.

### 3.3 `CertificationRecord` (`research.ts:419`)

| Field | Meaning |
|---|---|
| `outcome` | `'not-yet-assessed' \| 'pass' \| 'remediation-required'`. Set by the research coordinator relaying the **expert assessor's** decision — the assessor has no portal account. |
| `assessedDate` | ISO date of the Placement 2 assessment. |
| `certificateGenerated` | Whether the researcher has issued the certificate. **This, not `outcome`, is what gates the coach's Download control.** |
| `certificateDate` | ISO date issued. |
| `note` | Short note shown beside a remediation outcome. |

Certification is *awarded*, never "graduation". Pass threshold and the remediation pathway are both open study decisions.

---

## 4. `ConsumerDyad` — the client case

`spaces.ts:657`. The central record of the delivery side.

| Field | Stored/Derived | Domain meaning |
|---|---|---|
| `id` | stored | `dyad-0NN` seeds; `` `dyad-${Date.now()}` `` at runtime. |
| `coachId` | stored | The assigned coach. **Absent until the research coordinator assigns one** — enrolment and assignment are separate acts, and an unassigned dyad is a real, expected state. |
| `coachAssignedDate` | stored | When that assignment happened. Only meaningful alongside `coachId`. Exists because the Learning Progress timeline needed a real date and every surface was rendering an em dash. |
| `patient` | stored, **optional** | The PLE. Absent = carer-only dyad. |
| `carer` | stored, required | The carer. Realistically the only dyad member who operates the Consumer Portal, which is why `email`/`phone` are effectively carer-only fields. |
| `sleepGoals` | stored | What the dyad wants out of the intervention, in their words. Editable by the client on their own portal. |
| `caregivingContext` | stored | The caring situation — hours, night waking, support available. Set at intake. |
| `notes` | stored | "Additional notes" — **the research coordinator's** intake notes. |
| `coachNotes` | stored | **The coach's own** free-text notes on this dyad. Deliberately a separate field: a shipped bug had the coach's edit overwriting `notes`, which three other surfaces render. Never merge these two. |
| `sessionsCompleted` | stored (**seed only**) | Initial completion records. The live copy is `store.sessionCompletion[dyadId]`. Reading the field directly is a bug — it is frozen at page load. |
| `annotationSummaries` | stored, **most-recent-first** | The coach's reflections about this client (§5.2). |
| `patientLog` / `carerLog` | stored | Per-person, per-night sleep record (§4.3). |
| `consentDocuments` | stored | Filenames only. See integration-points.md §5. |
| `moduleEngagement` | stored | The client's progress through the 7 content modules (§4.2). |
| `sessionRecordings` | stored | Zoom recordings of held sessions — metadata only, no media. |
| `upcomingSession` | stored, **LEGACY** | Predates session planning. Superseded by `sessionPlan` wherever one exists; kept only as a fallback for an unplanned dyad. Some seeds still carry `session: 1`, which is why every reader guards against it. **Delete this in a real schema.** |
| `sessionPlan` | stored (**seed only**) | Initial plan. Live copy is `store.sessionPlans[dyadId]`. |
| `notificationPreferences` | stored | The carer's (account holder's) preferences. |
| `optedOut` | stored | `{reason, date}` once the dyad withdraws. Reason comes from a fixed dropdown; the study team follows up out of band. Sets a permanent site-wide banner and removes Zoom access. |
| `omitFromConsumerRoster` | stored | **A roster-visibility flag, not an archive state.** Exactly one list filters on it (the researcher's Consumer Management roster). The dyad is fully real everywhere else. This is a demo-curation artefact and should not survive into a production schema. |

### 4.1 `PersonProfile` (`spaces.ts:430`)

`name`, `age`, `relationship?` (carer only — relationship to the PLE), `background` (free text), `email?`, `phone?`. There is **no** person id, no date of birth, no address, no NHI/Medicare number, and no separate consent record per person. A real schema almost certainly needs a `Person` table with its own identifier — a dyad member currently has no identity outside the dyad object that embeds them.

### 4.2 Client module progress — `ConsumerModuleRecord` (`spaces.ts:636`)

`CONSUMER_MODULES` (`spaces.ts:593`) is **7 modules**: index 0 is the always-unlocked pre-module "Getting started with Care2Sleep", indices 1–6 are the named content modules. Each carries `slideCount: 6`.

| Field | Meaning |
|---|---|
| `moduleId` | FK into `CONSUMER_MODULES`. |
| `status` | `'not-started' \| 'in-progress' \| 'completed'` |
| `lastActivityDate` | ISO date last opened. Absent = never opened. |
| `slidesCompleted` | Slides viewed out of `slideCount`. Drives the completion percentage. |

**Unlock rule — one function, `moduleUnlockState(index, completed, manualUnlocks)` (`spaces.ts:622`):**

- Module index 0 is **always** unlocked.
- Module index *N* (1–6) unlocks when **internal session *N*** is marked complete.
- …or when *N* appears in `manualUnlocks` — a coach can grant a module early (e.g. the session happened but has not been logged yet). Live copy: `store.manualModuleUnlocks[dyadId]`.

**The two adjacent rules that are easy to conflate:**
- Module *N* is **unlocked by** internal session *N*.
- Module *N* is **reviewed by** internal session *N+1* (`SessionPlanRow.moduleTargetDate` doc, `spaces.ts:150`).

So the cycle is: finish module *N* → catch-up (internal session *N+1*) reviews it → that completion unlocks module *N+1*. Consistent, but only if you keep the two straight.

`moduleIndex(moduleId)` (`spaces.ts:608`) is the one id→index resolver. Returns `-1` on miss and callers do not all guard.

### 4.3 `HealthLogEntry` (`spaces.ts:448`) — one person, one night

| Field | Source in production | Meaning |
|---|---|---|
| `date` | — | The night. One entry per person per date. |
| `synced` | **Fitbit** | Did the device deliver a reading for this night. |
| `remPercent`, `deepPercent`, `lightPercent` | **Fitbit** | Sleep-stage split, % of total sleep time. |
| `durationMin` | **Fitbit** | Total sleep. |
| `disturbances` | **Fitbit** | Wakings detected by the device. |
| `diaryEntry` | **Client, manual** | Free-text note. |
| `diary` | **Client, manual** | The 9 answered Consensus Sleep Diary questions. |

**Device data and diary data are independent.** A night can have a diary answer and no device reading, or the reverse. The seed enforces this: when `synced === false`, all five Fitbit fields are `undefined` but `diaryEntry`/`diary` still come through. `withMissingDiaryOn()` (`spaces.ts:846`) models the other gap — the client forgot to fill the diary — leaving Fitbit fields intact.

### 4.4 Consensus Sleep Diary — `SleepDiaryAnswers` / `SleepDiaryComputed`

This is a **real clinical instrument** (Carney et al.), not an invented form. Q1–Q9 are answered; **Q10–Q13 are always derived and never stored.**

Stored (`spaces.ts:471`): `napMin` (Q1), `outOfSleepWindowMin` (Q2), `bedtime` (Q3), `sleepLatencyMin` (Q4), `wakeCount` (Q5, excluding the final waking), `awakeDuringNightMin` (Q6), `outOfBedDuringNightMin` (Q7), `wakeTime` (Q8), `outOfBedTime` (Q9).

Derived — **the one function is `computeSleepDiary(answers)` (`spaces.ts:535`)**:
- Q10 `minutesAwakeInBed` = Q8 → Q9
- Q11 `sleepOpportunityMin` = Q3 → Q9
- Q12 `totalSleepTimeMin` = Q11 − Q4 − Q6 − Q10
- Q13 `sleepEfficiencyPercent` = Q12 / Q11 × 100

**Times are free-form `"h:mm am/pm"` strings**, parsed by `parseTimeToMinutes()` (`spaces.ts:510`), which **returns `0` for anything it cannot parse** — a silent failure that yields a plausible-looking but wrong efficiency figure. `minutesFromTo()` wraps across midnight. A real schema should store minutes-since-midnight or a proper timestamp, and must decide what an unparseable/absent answer means.

Do not persist Q10–Q13. Two surfaces computing the same efficiency figure from stored values that have drifted from their inputs is precisely this project's recurring failure.

---

## 5. Reflections — two different records with one name

This is the highest-risk ambiguity in the package. **They are unrelated types with different shapes, different owners and different lifecycles.**

### 5.1 `AnnotationSummary` (`research.ts:384`) — the COACH's training reflection

Belongs to a `Coach`. Four timepoints across the COACH pathway (CLAUDE.md): **baseline** (after content learning), **midline** (after guided group practice), **endline** (after Placement 2 — shared with the expert assessor for the certification decision), **post-practice** (after the first real client session).

| Field | Meaning |
|---|---|
| `timepoint` | `'baseline' \| 'midline' \| 'endline'` — **note there is no `'post-practice'` member**, though the pathway defines four timepoints. |
| `approvedDate` | The date the coach **approved** the AI-generated summary. The approval, not the conversation, is the event. |
| `shared` | The coach controls sharing at each timepoint. |
| `summary` | Present **only when shared**. |

Data-access rule (CLAUDE.md): the coach always sees their own; the research team sees all; **the expert assessor sees endline only**. Nothing in this package enforces that — see integration-points.md §2.

### 5.2 `AnnotationSummaryEntry` (`spaces.ts:564`) — the coach's per-session client reflection

Belongs to a `ConsumerDyad`, written by the assigned coach, one per session debrief.

| Field | Meaning |
|---|---|
| `id` | `` `ann-${Date.now()}` `` at runtime. |
| `session` | **Optional.** The internal SPACES session this reflection is about. Entries written before this field existed have none and render without a session rather than guessing. Render through `sessionRowLabel()`. |
| `components` | `ReflectionComponentAnswer[]` — `{label, answer}` per SIPTEA component. **Structured, deliberately not one flattened string**, so every display surface renders labelled fields instead of parsing text apart. Labels are built as `` `${componentLetter}: ${label}` `` in `buildReflectionComponents()` (`AddAnnotationSummaryModal.tsx:105`). |
| `shared` | Whether shared with the supervisor. Independently toggleable after the fact. |
| `date`, `time` | When written. `date` is `TODAY` (frozen); `time` is the real wall clock — see integration-points.md §8. |

**Not capped.** Round 13 enforced one per client; Round 40 removed the cap because a coach now reflects after *every* session. `latestAnnotationState(dyad)` (`spaces.ts:1693`) derives the roster badge from `annotationSummaries[0]` — which is correct **only because the array is maintained most-recent-first by prepend**. That ordering is an unenforced invariant; a real schema should sort by `date`/`session`.

**The 6 SIPTEA components are a fixed, ordered constant** in `AddAnnotationSummaryModal.tsx:28` (`STEPS`) — not in `data/`, and not shared with any other surface. A real schema should own this list; a reflection whose `components` array does not match the current framework definition needs a versioning story.

### 5.3 `SupervisionNote` (`spaces.ts:1558`) — case notes and supervision notes

One type serving two concepts, distinguished by which optional fields are set.

| Field | Meaning |
|---|---|
| `id`, `coachId` | Owner. `coachId` is **required** — this type is always about a coach. |
| `dyadId` | Absent = a **coach-level supervision note** (researcher-authored, about the coach). Present = a **client case note** (coach-authored, about that client). |
| `session` | The internal session the note is about. Absent = ad-hoc. |
| `autoGenerated` | The platform drafted this note rather than the coach typing it. **Deliberately its own field, not derived from `session`** — "which session is this about" and "who wrote it" are two facts, and deriving one from the other breaks the moment a coach writes a session up by hand. Coach-facing label is **"Auto generated"**, never "AI generated". |
| `title`, `date`, `time`, `notes` | Content. |
| `attachments` | `string[]` — **filenames only**, never the file. See integration-points.md §5. |

`ResearchNote` (`spaces.ts:1670`) is a deliberately separate type for a researcher's note on a dyad with **no coach assigned yet** — `SupervisionNote.coachId` could not be made optional without auditing every reader. Seeded empty.

---

## 6. The two curricula — the most confusing part of the package

There are **two completely separate module systems**, both called "modules", with no join between them.

### 6.1 The coach's curriculum — `PATHWAY_MODULES_V2` (`trainingPathwayV2.ts:70`)

**11 modules**, grouped by `MODULE_GROUPS` into **Part A: Foundational (4)** and **Part B: Sleep (7)**. Part B is gated until Part A is complete. Both portals read `MODULE_GROUPS`, so they cannot disagree about the curriculum.

| Field | Meaning |
|---|---|
| `id` | Content key. **Four ids no longer match their titles** (`siptea-framework-v2` is titled "Onboarding and getting set up") — deliberately left alone, because `DEMO_PLAYER_REDIRECTS` keys off them and ids are never shown. |
| `title`, `description` | Coach-facing copy. |
| `status` | `'not-started' \| 'in-progress' \| 'completed'` — **a module-level constant, identical for every coach.** This is the demo spread, not a per-coach fact. |
| `progress` | 0–100. Same problem. |
| `estimatedMinutes` | All 11 are `35` — a placeholder, not real durations. |
| `cover.colors` | Three hexes driving `moduleArt()`'s gradient. No real cover imagery exists. |

### 6.2 Module player content — `MODULE_CONTENT` (`moduleContent.ts`)

Keyed by content id. **Populated for exactly one module, `understanding-sleep`.** Shape: `introLines[]` → `chapters[]` → `outro`. Each `Chapter` has `learnVideos[]` (1–2), `cases[]` (**exactly 3**, mixed video/written), `knowledgeCheck[]` (**exactly 5**), `siptaTag`, `whatToExpect[]`.

Two fields are explicitly **production briefs, not learner copy, and are rendered nowhere**: `LearnVideo.covers` and `CaseExample.video.dramatizedScene`. They describe what a video shoot must produce. Do not surface them.

`MODULE_OVERVIEW_CONTENT` (`moduleOverviewContent.ts`) is a lighter parallel map for the overview page: per-chapter `durationLabel` (made up, round numbers) plus 3 `objectives`. Its chapter `id`/`number`/`title` **mirror `MODULE_CONTENT` 1:1 by convention only** — nothing enforces it, and a drift would show the coach a chapter the player does not have.

**The step machine** — `buildPlayerSteps(content)` (`playerSteps.ts:31`) flattens content into an ordered `PlayerStep[]`:
`intro → per chapter [chapter-marker, learn, case×3, knowledge-check, what-to-expect, chapter-complete] → outro → feedback → complete`.
`STEPS_PER_CHAPTER = 8` is a hardcoded constant that **only holds because `cases` is exactly 3**. `chapterStepRange()`, `outroStepIndex()`, `feedbackStepIndex()` and `chapterProgress()` all derive from it, and so does the overview page's outline state — so a chapter with 2 or 4 cases silently corrupts every progress read.

### 6.3 Three unconnected models of "has this coach done this module"

| Model | Where | Scope | Who reads it |
|---|---|---|---|
| `Coach.moduleRecords[]` | store, per coach | Per coach, 11 records, with `completedDate`, `scenarioResponse`, `knowledgeCheckAnswers`, `feedbackRating`, `feedbackComment`, `slidesCompleted` | **Researcher surfaces only.** Grep confirms **zero** reads in `pages/delivery/`, `pages/training-v2/`, `components/delivery/`. |
| `PATHWAY_MODULES_V2[].status` | module constant | **Global — the same for every coach** | The coach portal's My Learning page, via `moduleState(index)` |
| `localStorage` step index | browser | Per browser, per module id | The player and, through `livePlayerStatus()`, the module cards |

**Consequence, and it is user-visible:** the signed-in coach's record says 11/11 modules complete; the coach portal's My Learning page shows **1/11**, because it reads the global constant. `displayStatus()`/`displayProgress()` (`pathway.ts`) layer `localStorage` over the constant and never consult `moduleRecords`. **A real implementation must collapse these three into one per-user progress record.**

Related derived helpers, all in `pathway.ts`:
- `firstIncompleteIndex` / `moduleState(index)` — the forced-linear rule: exactly one module is `current` (the first incomplete), everything after it is `upcoming` regardless of its own status.
- `realPlayerContentId(moduleId)` — resolves a demo redirect (`population-understanding` → `understanding-sleep`) so module 2 can open the only authored content. **Remove this map in production**; it is why progress is keyed by content id and why a naive progress scan reports a locked module as in progress.
- `livePlayerStatus(moduleId)` — the single source for live play progress. `resumableModule()` reads **only the current module**, deliberately, to avoid that collision.
- `wasStartedThisSession()` (`moduleProgressStore.ts:46`) — module-scoped `Set`, **not** persisted, so a refresh returns the Home banner to its default. "How far in are they" persists; "have they picked it up this sitting" does not. Two genuinely different facts.

### 6.4 `KnowledgeCheckQuestion` — two incompatible types with one name

- `research.ts:89` — `{question, options[], correctIndex}`, multiple choice, answered as `KnowledgeCheckAnswer {selectedIndex}` on `ModuleRecord`.
- `moduleContent.ts:73` — `{type, answerFormat: 'true-false'|'free-response', question, answer}`, **no options, no stored answer at all**.

The player uses the second and **stores nothing**. The researcher's view reads the first. A coach's actual in-player answers are never persisted anywhere. A real schema needs one question model and a real answer store.

---

## 7. Invariants

### 7.1 Verified — hold across every seeded record

Executed via `npx tsx` against the real modules. These are safe to encode as DB constraints or tests.

| # | Invariant |
|---|---|
| I1 | `sessionsCompleted[].session ∈ 1..7` |
| I2 | Completed sessions form a **contiguous prefix from 1** — no gaps. (Not enforced in code; held in seed.) |
| I3 | `moduleEngagement` covers all 7 `CONSUMER_MODULES` exactly once, no duplicates, no strays. |
| I4 | A module with `status !== 'not-started'` is `unlocked` per `moduleUnlockState`. |
| I5′ | No module is **`in-progress`** once its own catch-up session (internal `index+1`) is complete. (The stated rule. The broader "must be `completed`" form fails — see D2.) |
| I6 | `SessionPlanRow.moduleTargetDate < SessionPlanRow.date` for every dated row. The client finishes the module **before** the catch-up. Guaranteed by construction in `generatePlanRows()`. |
| I7 | Plan rows 2–7 are dated in strictly ascending order. |
| I8 | A completed catch-up session has a dated plan row. |
| I9 | `dyad.coachId` resolves to a real `Coach`; `coachAssignedDate` present **iff** `coachId` present. |
| I10 | `SpacesCoach.coachId` is a coach with `certification.outcome === 'pass'`. |
| I11 | `AnnotationSummaryEntry.session ∈ 1..7` and refers to a **completed** session. |
| I12 | `SupervisionNote.dyadId` belongs to `SupervisionNote.coachId`; `.session` is completed on that dyad. |
| I13 | Health-log dates strictly ascending per person; every log ends on `TODAY`; `synced === true` ⟺ Fitbit metrics present. |
| I14 | `SpacesSessionRecording.session` refers to a completed session. |
| I15 | `currentPhase >= 4` (Stage O) ⟹ **all** `moduleRecords` completed. A trainee's stage cannot outrun their content learning. |
| I16 | `inviteStatus === 'pending'` ⟹ no touched modules. |
| I17 | `lastActive <= TODAY`. |
| I18 | `certification.outcome !== 'not-yet-assessed'` ⟹ `assessedDate` present; `certificateGenerated` ⟹ `certificateDate` present **and** `outcome === 'pass'`. |
| I19 | `moduleRecords.length === 11` for every coach. |
| I20 | `status === 'completed'` ⟹ `completedDate` present and `<= TODAY`. |

### 7.2 Known seed defects — reported, **not corrected**

| # | Defect | Evidence |
|---|---|---|
| **D1** | **Completed sessions dated in the future.** `dyad-011` marks internal sessions 3 and 4 complete with `completedDate` `2026-08-05` and `2026-08-19`, against `TODAY = 2026-07-22`. Their plan rows carry the same future dates while the session reads as held. Two module `lastActivityDate`s (`2026-08-16`, `2026-08-19`) and two reflection dates (`2026-08-05`, `2026-08-19`) are future for the same reason. **The frozen clock has drifted behind the seed data.** A production system needs `completedDate <= now` as a constraint. |
| **D2** | **Two client modules never started though their catch-ups were held.** `dyad-011` modules index 1 and 2 are `not-started` while internal sessions 2 and 3 are complete. One such gap is a *deliberate* demo case (a module the client missed though the session went ahead); there are two. Preserve at most one deliberately, and decide explicitly whether the schema permits it — the study protocol says the catch-up works through the finished module's content, so a session held over an untouched module is either a real edge case worth modelling or a data error. |
| **D3** | **A client is assigned to a coach who has not been onboarded into SPACES.** `dyad-012` has `coachId: 'mei-ling-chen'`, but Mei-Ling Chen has **no `SpacesCoach` row** — she is deliberately the sole "Waiting to be onboarded" candidate in the researcher's Coach Management tab. So one surface says she is not yet delivering while another gives her a client. **A real schema should make `SpacesCoach` (or equivalent) a precondition for assignment.** |
| **D4** | **Coach module completion is not in curriculum order.** `marcus-webb` has 5 completed modules that are not the first 5: `understanding-sleep` (#5) is complete while `siptea-framework-v2` (#4) is `not-started`. The coach portal's forced-linear `moduleState()` and the researcher's per-module records therefore describe different curricula. Either the pathway is linear (and the seed is wrong) or it is not (and `moduleState()` is wrong). This needs a product decision, not a data fix. |
| **D5** | Three unconnected coach-progress models (§6.3). Not a seed defect but a modelling one, and the largest single thing to resolve. |
| **D6** | `helen-zhang` — the signed-in coach — has **no `lastActive`**, which the roster renders as "Never" for someone who is certified, delivering, and currently using the app. Cosmetic in the prototype; a real `lastActive` should be written on sign-in. |
| **D7** | `Coach.currentPhase` for `helen-zhang` is **8 (certified, delivering)** while the coach portal boots in `trainee` mode (`coachStage.ts` defaults to `'trainee'`). The portal's trainee/coach split is a **demo switch**, not derived from the record. See integration-points.md §2. |

---

## 8. Live (store) state vs. seed fields

Four facts exist **twice**: once frozen on the seed record, once live in the store. **The store copy is authoritative; reading the seed field directly is a bug.**

| Seed field | Live store slice | Initialised from |
|---|---|---|
| `ConsumerDyad.sessionsCompleted` | `sessionCompletion: Record<dyadId, SessionCompletionRecord[]>` | every dyad's own array, at provider mount |
| `ConsumerDyad.sessionPlan` | `sessionPlans: Record<dyadId, SessionPlan>` | `d.sessionPlan ?? emptySessionPlan()` |
| (none — new concept) | `manualModuleUnlocks: Record<dyadId, number[]>` | `{}` |
| (derived from `Coach`) | `phaseCompletion: Record<coachId, number[]>` | `initialPhases(c)` (`research-store.tsx:249`) |
| (derived from `Coach`) | `phaseCompletionDates: Record<coachId, Record<phase, ISO>>` | `initialPhaseDates(c)` (`research-store.tsx:266`) |
| (none) | `manualRecordings: Record<coachId, SessionRecording[]>` | `{}` |

`initialPhaseDates()` is worth copying as a design idea: stage completion dates are **derived from the artefact that proves the stage happened** — Stage C from the last completed module, Stage O from the last attended group session, Stage H from the assessment date — and Stages A and CP are left **deliberately undated** because this dataset has no dated artefact for them. It invents nothing. A production schema should either store an explicit `stage_completed_at` or keep deriving; it should not do both.

`emptySessionPlan()` (`spaces.ts:192`) creates all 7 rows unset — so "no plan" and "plan with nothing filled in" are the same object, and `isPlanSet()` (every row dated) is what actually distinguishes them.

---

## 9. Plan generation

`generatePlanRows(session0Date, firstCatchupDate, moduleWeekday, catchupTime, catchupEndTime?)` (`spaces.ts:269`) is the only writer of fresh plan dates.

- Cadence is **fixed weekly** (`WEEKLY_CADENCE_DAYS = 7`), not a coach choice — the study protocol says weekly.
- The **meeting is the anchor**. `firstCatchupDate` is chosen explicitly; sessions 2–7 land at 7-day intervals from it.
- Each module target is derived **backwards** from the session that reviews it: `session date − runway`, where `runway = (catchupWeekday − moduleWeekday + 7) % 7 || 7`. A Friday module before a Thursday catch-up correctly yields 6 days, not an invalid same-week ordering.
- Week 1's target **clamps to `session0Date`** when the first session is only days away — the module arrives immediately rather than the whole plan shifting. Meeting dates a coach agreed with their client are never silently moved.
- Catch-up weekdays are **working days only** (`DAY_OF_WEEK_OPTIONS`, Mon–Fri). Module unlock days allow **all seven** (`DAY_OF_WEEK_OPTIONS_ALL`) — a carer's free time is often the weekend, and nobody has to be at work for a module to appear.
- Internal session 1 (Planning) gets `session0Date` and **no `moduleTargetDate`**.

`SessionPlanRow.rescheduled` marks a row edited after being set. Rescheduling is **manual, single-row, no cascade**.

---

## 10. What each seed persona demonstrates

Preserve these states when replacing fixtures — each one is the only example of its case.

### Dyads

| Record | People | State | Demonstrates |
|---|---|---|---|
| `dyad-014` | Arthur & Tania Ngata | Assigned to Helen, **0 sessions, no plan, no modules, no logs, no reflections** | **The empty case.** A just-assigned client where every absence is correct, not a gap. Sorts first in the caseload (ordered by completed count ascending). Carries `omitFromConsumerRoster: true`. |
| `dyad-011` | Bruce (PLE) & Joan Whitfield | 3/6 catch-ups, plan set, 2 modules complete + 1 in progress + **2 skipped**, 3 reflections, 18-night logs incl. a Fitbit sync gap and a missing-diary night, 1 consent doc, 1 recording, 2 case notes (one auto-generated, one ad-hoc) | **The mid-progress case, and the richest record in the package.** The only dyad exercising: multiple reflections, the auto-generated/ad-hoc case-note filter, horizontal scroll in the sleep-diary grid, the sync-gap alert, and the "module missed but session held" edge case. Also the only dyad carrying a **legacy `upcomingSession`** (already completed, so it correctly resolves to nothing). Also carries seed defect D1. |
| `dyad-012` | Dorothy & Frank Kellerman | Assigned to Mei-Ling Chen, 0 sessions, **no plan** | **The unplanned case** — the live demo for the first-time planning wizard. Also carries defect D3 (coach not onboarded). |
| `dyad-013` | Eleanor & Margaret Sinclair | **7/7 sessions, 7/7 modules, plan set, 7 recordings, 1 reflection** | **The complete case.** The only fully-finished arc. Its single reflection has **no `session`**, so it is also the pre-Round-40 legacy-reflection case. |
| `dyad-030` | Harold & Diane Ableson | **No coach**, 0 sessions | **The unassigned case** — enrolled but not yet matched. Also seeded with an unresolved 2-night Fitbit sync gap. |

There is **no carer-only dyad** in the current seed, despite `patient` being optional and the enrolment wizard supporting it. That branch is unexercised.

### Coaches

| Record | State | Demonstrates |
|---|---|---|
| `helen-zhang` | Phase 8, `completed`, **certified with certificate issued**, 11/11 modules, 3 reflections, 3 clients | **The signed-in persona.** Every coach-portal page hardcodes her id. Note D6 (no `lastActive`) and D7 (record says certified; portal boots as trainee). |
| `priya-raman` | Phase 3, **`inviteStatus: 'pending'`**, 0 modules | The unaccepted-invite case — everything on her profile is inert. |
| `marcus-webb` | Phase 3, 5/11 modules + 1 in progress, **no group sessions attended** | The mid-training case. Carries defect D4. |
| `aisha-mohamed`, `daniel-osei`, `noah-fenwick` | Phase 4 (Stage O), 11/11 modules, baseline+midline reflections | The cohort at group practice. Three of them so a **cohort session row** has a genuine 3-attendee list and the "+N" truncation is exercised. |
| `lauren-mitchell` | Phase 7, 11/11 modules, **all three reflections, not yet assessed** | "Finished everything, waiting on the assessor." |
| `fatima-haidari` | Phase 8, certified, onboarded into SPACES, **0 clients** | A delivering coach with an empty caseload. |
| `mei-ling-chen` | Phase 8, certified, **no `SpacesCoach` row** | The sole "waiting to be onboarded" candidate — the only record the onboarding picker has to offer. But see D3. |

Also: 4 `groupSessions` (`gs-1`…`gs-4`, weekly, one facilitator "Dr Sarah Whitfield"), and exactly **one** `upcomingGroupSessions` entry with a real-looking Zoom link. `researchNotes` is seeded **empty**.

---

## 11. Open questions a real schema must resolve

Ordered by consequence.

1. **One coach-progress model.** Today there are three (§6.3), and they visibly disagree. Decide: is module progress per-coach, server-owned, and the source for both the coach's My Learning page and the researcher's Learning Progress tab? What is stored — step index, per-slide, per-question, or all three? Where do `scenarioResponse`, `knowledgeCheckAnswers` and module feedback actually live, given the player currently persists **none** of them?

2. **Session numbering.** Pick one. Either store 0–6 with Planning as a distinct non-numbered event type, or store 1–7 and accept a display offset — but do not carry both. Related: is Planning a `SPACES_SESSION` at all, or a different kind of appointment? It has no module, no number, no reflection, and every "next session" helper excludes it.

3. **Identity and the role/access matrix.** There is no `User`, no `Person` outside a dyad, no role, and no authorisation anywhere. The study defines at least five actors (coach, research coordinator, supervisor, expert assessor, consumer) with a documented data-access matrix — including the rule that an expert assessor sees **endline annotations only** and never a coach's client session notes. None of that is expressible in this schema. See integration-points.md §2.

4. **The unlock rule as a constraint.** "Completing session *N* unlocks module *N*" is currently a pure function over completion records, with a `manualUnlocks` escape hatch that has no audit trail — no who, no when, no why. If a coach can override the gate, the override is a record, not an array of integers.

5. **What "reflection" means.** Two types share the name (§5). Are the coach's 4-timepoint COACH reflections and their per-session client reflections one entity with a discriminator, or two? The type union `'baseline'|'midline'|'endline'` is already missing the fourth timepoint the protocol defines.

6. **Sleep data ownership and retention.** `HealthLogEntry` mixes device-derived and self-reported data in one row with no provenance field beyond `synced`. Fitbit data will arrive out of order, be revised, and have gaps. The diary is a validated instrument whose derived values must never be stored. And a coach can currently export a named client's full sleep history to a local CSV with no audit trail (integration-points.md §6).

7. **Consent.** `ConsentDocument` stores a filename and an upload date. No document, no version, no signatory, no scope, no expiry, no link to a dyad member. The study has not decided between REDCap and a platform-integrated system. Until it does, this is a placeholder, not a design.

8. **Withdrawal and retention.** `optedOut` is a reason string and a date. `withdrawCoach` writes a free-text note and leaves everything else in place. What actually happens to a withdrawn participant's session recordings, reflections and sleep data is a governance question the schema currently answers by doing nothing.

9. **Attachments.** `attachments: string[]` is a list of filenames with no file behind them (integration-points.md §5). Real case-note attachments are clinical records and need storage, access control, virus scanning and retention.

10. **Time.** `date` and `time` are separate strings, no timezone, no offset. The study runs in Australia; DST transitions will break weekly cadence arithmetic that adds 7 days to a date string. `parseTimeToMinutes` returns `0` on a parse failure rather than erroring.

11. **The demo-only fields.** `omitFromConsumerRoster`, `DEMO_PLAYER_REDIRECTS`, `PATHWAY_MODULES_V2[].status`/`progress`, and the `coachStage` switch are all review affordances. They must not be carried into a production schema, and each has at least one reader that will need rewriting when they go.
