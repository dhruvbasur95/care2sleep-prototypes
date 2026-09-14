# Care2Sleep — Consumer Portal: data model

Every exported type, every store member, every derived fact, and the one demo
consumer end to end.

Read [`engineering-overview.md`](./engineering-overview.md) first for the
architecture this sits inside, and
[`integration-points.md`](./integration-points.md) for where a real backend
attaches to it.

**The one-line version.** There is no backend and no persistence.
`src/data/spaces.ts` (1,851 lines) and `src/data/research.ts` (1,517) are the
seed; `src/data/research-store.tsx` (965) is a single React context holding the
entire study's mutable state in memory. The Consumer Portal reads a thin slice of
that — one dyad, its plan, its completion record, its assigned coach — and writes
to exactly **three** of the store's 34 actions. Everything is lost on reload.

Everything below was measured against the code as it stands. Where a number
appears, I executed it (`npx tsx` against the real modules) or grepped for it.

---

## 1. Where the types live

| File | L | Holds | Consumer relevance |
|---|---|---|---|
| `src/data/spaces.ts` | 1851 | SPACES delivery: dyads, sessions, plans, diary, modules, seed | **Primary.** Nearly everything this portal renders |
| `src/data/research.ts` | 1517 | COACH training: coach trainees, certification | **One type** — `Coach`, six fields of it |
| `src/data/consumerLessonContent.ts` | 427 | Module video / chapters / summary / transcript / reflection | **Primary.** Consumer-only |
| `src/components/consumer/lessons.ts` | 109 | The consumer's own view of their modules | **Primary.** Consumer-only |
| `src/data/format.ts` | 113 | `TODAY` + timezone-safe formatters | **Primary** |
| `src/data/trainingPathwayV2.ts` | 274 | The 11-module *coach* curriculum | **Zero.** Imported only by `research.ts` |
| `src/data/auth.ts` | 13 | One `sessionStorage.removeItem` | Vestigial — §3.5 |

> **Naming, deliberate, not drift.** Consumer-facing copy says **Module**;
> internal identifiers still say *lesson* (`lessons.ts`, `LessonView`,
> `releasedLessons`, `LessonCards`, the `/learning` route). `ConsumerDyad`,
> `dyadId` and `/consumer/:dyadId` likewise keep "consumer" as an identifier
> while the copy addresses the reader as "you". **Do not rename these on sight.**

---

## 2. Every type

### 2.1 `ConsumerDyad` — the root record (`spaces.ts:783`)

This is the whole consumer. One record per enrolled consumer; the portal shows
exactly one. **Stored** means it is a seed field; nothing on this type is derived.

| Field | Type | Meaning in the study | Rendered by |
|---|---|---|---|
| `id` | `string` | `dyad-011` etc. The URL segment | route param only |
| `coachId` | `string?` | Joins to `research.ts`'s `coaches[]`. Absent until a coach is assigned | `CoachCard.tsx:116` |
| `coachAssignedDate` | `string?` | ISO date the coach was assigned | ⛔ **never read here** |
| `patient` | `PersonProfile?` | **The PLE.** Absent for a carer-only consumer | account page, diary, reflection |
| `carer` | `PersonProfile` | The carer. Always present; **this is the account holder** | account page, every `accountLabel` |
| `sleepGoals` | `string` | Intake text | ⛔ never read (Home's sleep-goals section was deleted) |
| `caregivingContext` | `string` | Intake text | ⛔ never read |
| `notes` | `string?` | Researcher's intake notes | ⛔ never read |
| `coachNotes` | `string?` | Coach's private notes | ⛔ never read — coach-facing |
| `sessionsCompleted` | `SessionCompletionRecord[]` | **Seed only.** The live copy is `store.sessionCompletion[dyadId]` | indirectly, via the store |
| `annotationSummaries` | `AnnotationSummaryEntry[]` | The **coach's** SIPTEA reflections *about* this consumer | ⛔ never read — coach/researcher-facing |
| `patientLog` | `HealthLogEntry[]` | PLE's nightly Fitbit + diary record | **written, never read** — §2.6 |
| `carerLog` | `HealthLogEntry[]` | Carer's nightly record | **written, never read** |
| `consentDocuments` | `ConsentDocument[]` | Researcher-uploaded consent PDFs | ⛔ never read |
| `moduleEngagement` | `ConsumerModuleRecord[]` | Per-module status and slide count | `releasedLessons()` → every module card |
| `sessionRecordings` | `SpacesSessionRecording[]` | Zoom recordings | ⛔ never read — researcher-facing |
| `upcomingSession` | `UpcomingSession?` | Pre-Round-14 single next session. **Superseded** | ⛔ **deliberately** not read — §6.2 |
| `sessionPlan` | `SessionPlan?` | **Seed only.** Live copy is `store.sessionPlans[dyadId]` | indirectly |
| `notificationPreferences` | `NotificationPreferences?` | Email/SMS toggles | ⛔ never read — the card was removed |
| `optedOut` | `{reason, date}?` | Set by the opt-out flow | `ConsumerShell.tsx:439` banner, `ConsumerAccountPage.tsx:105` |
| `diarySubmittedOn` | `string?` | ISO date the diary was last submitted **through the portal** | `ConsumerHomePage.tsx:218` |
| `omitFromConsumerRoster` | `boolean?` | Researcher roster filter | ⛔ never read — researcher-facing |

**Why `diarySubmittedOn` exists, and why a backend must keep it.** The obvious
check — "does today's health log carry a `diary`?" — is always true:
`healthLog()` seeds a `diary` on every date it generates, and its last date is
meant to be `TODAY`. The unfilled-diary card would be unreachable. This field
records the **submission event**. Seeded history and a portal submission are
different facts.

### 2.2 `PersonProfile` (`spaces.ts:439`)

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Rendered in full; first name only in the diary and reflection column headers |
| `age` | `number` | Editable on My profile |
| `relationship` | `string?` | Carer only — relationship to the PLE. ⛔ **never rendered to the consumer** |
| `background` | `string` | Clinical/context prose. ⛔ **never rendered to the consumer** |
| `email` | `string?` | Editable on My profile |
| `phone` | `string?` | Editable on My profile |

`ConsumerPersonCard.tsx:116-119` renders exactly `name`, `age`, `email`, `phone`
(falling back to `—`), and `:163-166` writes exactly those four back.

### 2.3 Sessions

`SpacesSession` (`spaces.ts:48`), the fixed 7: `1 Planning`, `2 Post-Module 1` …
`7 Post-Module 6`.

> ### ⚠️ The numbering trap
>
> Internal numbers are **1–7** and are what every store key uses. What a reader
> sees is **internal − 1**. Internal 1 (Planning) has **no display number at
> all**. Always go through `displaySessionNumber()` (`spaces.ts:71`) or, when the
> value might be 1, `sessionRowLabel()` (`spaces.ts:85`). **A raw number on
> screen is always wrong.**

| Type | L | Field | Notes |
|---|---|---|---|
| `SessionCompletionRecord` | `:94` | `session`, `completedDate`, `completedTime` | internal number |
| `SessionPlanRow` | `:150` | `session` | internal number |
| | | `date`, `time` | `undefined` until the coach plans the row |
| | | `endTime` | optional, additive. **Read by `SessionPlanStrip.tsx:244`, not by Home** — §6.3 |
| | | `moduleTargetDate` | when the module should be finished by; **always strictly before this row's own `date`** (the consumer completes the module, *then* the coach catches up on it) |
| | | `rescheduled` | set on any date change after the row was first dated |
| | | `previousDate` | the date moved off, rendered struck through |
| | | `meetingId`, `zoomLink` | placeholder Zoom creds. ⛔ **never rendered in this portal** |
| `AdHocMeeting` | `:182` | `id, title, date, time, meetingId, zoomLink` | a one-off outside the 7. ⛔ **no consumer surface reads these** |
| `SessionPlan` | `:195` | `sessions: SessionPlanRow[]`, `adHocMeetings: AdHocMeeting[]` | |
| `UpcomingSession` | `:129` | `session, date, time, meetingId, zoomLink` | **legacy**, superseded by the plan |

`SPACES_CATCHUP_COUNT = SPACES_SESSIONS.length - 1` = **6** (`:106`) — derived, so
"6 sessions" cannot drift from the list.

### 2.4 Modules

`ConsumerModule` (`spaces.ts:692`) — `id`, `title`, `slideCount` (always 6).
`CONSUMER_MODULES` (`:699`) has **7 entries**: index 0 is the always-unlocked
pre-module, indices 1–6 are the numbered modules the consumer sees.

| idx | id | Consumer label | Content authored? |
|---|---|---|---|
| 0 | `getting-started` | *(pre-module, never numbered, never listed)* | no |
| 1 | `understanding-sleep-dementia` | Module 1 | no |
| 2 | `calming-bedtime-routine` | Module 2 | no |
| 3 | `managing-nighttime-waking` | Module 3 | no |
| 4 | `daytime-habits` | Module 4 | **yes — the only one** |
| 5 | `carer-own-sleep` | Module 5 | no |
| 6 | `using-sleep-data` | Module 6 | no |

`ConsumerModuleRecord` (`:742`) — `moduleId`, `status`
(`not-started | in-progress | completed`), `lastActivityDate?`, `slidesCompleted?`.

`ModuleUnlockState` (`:718`) — `locked | unlocked`, derived. **See §6.1: it has
zero callers in this portal.**

### 2.5 Sleep diary

`SleepDiaryAnswers` (`spaces.ts:480`) — the 9 directly-answered Consensus Sleep
Diary questions for one person on one night. Times are free-form `"h:mm am/pm"`
strings, **not** `HH:MM`, matching the reference paper diary.

| Field | Q | Type |
|---|---|---|
| `napMin` | 1 | number (minutes) |
| `outOfSleepWindowMin` | 2 | number |
| `bedtime` | 3 | `"10:00 pm"` |
| `sleepLatencyMin` | 4 | number |
| `wakeCount` | 5 | number |
| `awakeDuringNightMin` | 6 | number |
| `outOfBedDuringNightMin` | 7 | number |
| `wakeTime` | 8 | `"7:00 am"` |
| `outOfBedTime` | 9 | `"7:30 am"` |

`SleepDiaryComputed` (`:503`) — Q10–13, **always derived, never stored**, via
`computeSleepDiary()` (`:544`): `minutesAwakeInBed`, `sleepOpportunityMin`,
`totalSleepTimeMin`, `sleepEfficiencyPercent`. **A backend must not persist
these.**

`SleepDiaryQuestion` / `SLEEP_DIARY_QUESTIONS` (`:557`/`:588`) — all 13 in order,
with the consumer-facing `label`, an optional `help` explainer, `kind`
(`number | time`) and `unit`. Measured: **13 total, 9 answered, 4 computed.** The
questionnaire derives its own steps rather than restating the list:

```ts
// ConsumerDiaryPage.tsx:75
const QUESTIONS = SLEEP_DIARY_QUESTIONS.filter(
  (q): q is SleepDiaryQuestion & { field: keyof SleepDiaryAnswers } => !q.computed && !!q.field,
)
```

### 2.6 `HealthLogEntry` (`spaces.ts:457`) — one person, one night

`date`, `synced`, `remPercent?`, `deepPercent?`, `lightPercent?`, `durationMin?`,
`disturbances?`, `diaryEntry?` (free text), `diary?` (`SleepDiaryAnswers`).

> ### ⚠️ Every field on this type is out of scope for this interface
>
> Grepping all of `src/components` and `src/pages` for `remPercent`,
> `deepPercent`, `lightPercent`, `durationMin`, `disturbances`, `synced`,
> `diaryEntry`, `patientLog`, `carerLog`, `HealthLogEntry` and
> `computeSleepDiary` returns **one hit, inside a comment**. The Consumer Portal
> **writes** the log and never reads it back. See §6.6.

A missed Fitbit sync and a missed diary are **independent**: `withSyncGap()`
drops the device fields but keeps `diary` and `diaryEntry`;
`withMissingDiaryOn()` drops `diary` alone. A UI must never infer one from the
other.

### 2.7 Module content (`consumerLessonContent.ts`) — consumer-only

| Type | L | Fields |
|---|---|---|
| `ModuleChapter` *(not exported)* | `:47` | `id`, `title`, `startsAt` (seconds). **`startsAt` is an estimate** — derived at 140 words/min from the production script plus 1.2s per scripted `[pause]`. Replace with real timestamps when the video is cut |
| `ModuleSummaryCard` | `:79` | `chapterId` (**looked up, never a duplicated title**), `number` (`"01"`), `lead` (2 lines max), `bullets[]` (support `**bold**`), `style: 1\|2\|3` |
| `TranscriptLine` | `:117` | `speaker: 'Narrator'\|'Expert'\|'PLE'\|'Carer'`, `text` (supports `==marked==`). **The mark is a playback position, not emphasis** — there is exactly one in the whole transcript and a real player should replace it, not add to it |
| `ModuleEpisode` | `:139` | `title`, `sub`, `durationSeconds`, `chapters[]`, `summaryCards[]`, `transcript[]`, `coreMessage` |
| `ReflectionQuestion` | `:337` | `id`, `prompt`, `options: {id,label}[]` — **multi-select** |
| `ModuleLesson` | `:319` | the derived return of `moduleLesson()`: `index`, `id`, `title`, `label`, `intro`, `episode` |

**Only `daytime-habits` has content.** `MODULE_EPISODES`, `MODULE_INTROS` and
`MODULE_REFLECTIONS` each carry exactly one key. Executed against the real
module: `moduleLesson()` returns `null` for all six other module ids **and** for
a bogus one. Their cards therefore render an inert, `aria-disabled` CTA rather
than linking into an empty player. **This is honest, not a wiring bug.**

Measured for `daytime-habits`: 6 chapters (`intro@0`, `building-blocks@166`,
`wake-time@516`, `napping@714`, `sleepy-not-tired@929`, `close@1135`), duration
**1215s**, 4 summary cards (styles 1/2/3/1, every `chapterId` resolving), 10
transcript lines, 5 reflection questions with 4 options each.

### 2.8 `research.ts` — one type, six fields

`Coach` (`research.ts:535`) is the only export this portal touches, and only
through `store.coaches`. The Consumer Portal imports exactly **one thing** from
that 1,517-line file — `type Coach` — a type-only import erased at compile time.

| Field | Rendered by |
|---|---|
| `fullName` | `CoachCard.tsx:185`, `CoachProfileModal.tsx:196,257,292` |
| `phone` | `CoachCard.tsx:213`, `CoachProfileModal.tsx:326` (`tel:`) |
| `email` | `CoachCard.tsx:214`, `CoachProfileModal.tsx:327` (`mailto:`) |
| `roleAtEmployer` | `CoachProfileModal.tsx:264,292,309` |
| `employer` | `CoachProfileModal.tsx:292,309` |
| `yearsInAgedCare` | `CoachProfileModal.tsx:292,310` |

⛔ **Everything else on `Coach` is out of scope** — `participantId`, `initials`,
`cohort`, `enrolmentDate`, `status`, `inviteStatus`, `currentPhase`,
`withdrawalNote`, `lastActive`, `moduleRecords`, `demoVideoNotes`,
`annotationSummaries`, `groupSessionAttendance`, `certification`,
`notificationPreferences`, `upcomingSession`. So is **every other export** of
`research.ts` and **all of `trainingPathwayV2.ts`**.

**A real backend serving this interface needs a six-field coach summary
endpoint, not the training record.** Do not ship a coach's certification history
to a consumer.

### 2.9 Types that exist and are never rendered here

`AnnotationShareState`, `ReflectionComponentAnswer`, `AnnotationSummaryEntry`
(the **coach's** SIPTEA reflection — do not reuse it for the consumer's module
reflection, see `integration-points.md` §5), `ConsentDocument`, `SpacesCoach`,
`SupervisionNote`, `ResearchNote`, `SpacesSessionRecording`,
`NotificationPreferences`, `InvitationStatus`, `JoinedStatus`.

---

## 3. The store — `src/data/research-store.tsx`

### 3.1 Shape

One provider, `ResearchProvider`, mounted once at `App.tsx:45` above the router.
It holds **13 `useState` slices** and exposes them plus 34 actions — **47
members** — through `ResearchContext` (`research-context.ts:23`), read via
`useResearch()`.

| Slice | L | Initialised from | Shape |
|---|---|---|---|
| `coaches` | `:301` | `research.ts` `coaches` | `Coach[]` |
| `searchQuery` | `:302` | `''` | `string` |
| `phaseCompletion` | `:303` | `initialPhases(c)` per coach | `Record<coachId, number[]>` |
| `phaseCompletionDates` | `:308` | `initialPhaseDates(c)` per coach | `Record<coachId, Record<number,string>>` |
| `spacesCoaches` | `:312` | `spaces.ts` `spacesCoaches` | `SpacesCoach[]` |
| `consumerDyads` | `:313` | `spaces.ts` `consumerDyads` | `ConsumerDyad[]` |
| `supervisionNotes` | `:314` | seed | `SupervisionNote[]` |
| `researchNotes` | `:317` | seed (empty) | `ResearchNote[]` |
| `manualRecordings` | `:321` | `{}` | `Record<coachId, SessionRecording[]>` |
| `sessionCompletion` | `:322` | `d.sessionsCompleted` per dyad | `Record<dyadId, SessionCompletionRecord[]>` |
| `sessionPlans` | `:325` | `d.sessionPlan ?? emptySessionPlan()` per dyad | `Record<dyadId, SessionPlan>` |
| `manualModuleUnlocks` | `:328` | `{}` | `Record<dyadId, number[]>` |
| `researcherProfile` | `:329` | `research.ts` `researcher` | object |

> **Why `sessionCompletion` and `sessionPlans` are separate from the dyad
> record.** They are the **live** copies; `dyad.sessionsCompleted` and
> `dyad.sessionPlan` are the frozen seed. Every consumer surface must read the
> store keys, never the dyad fields. `NextSessionCard` and `SessionPlanStrip`
> both do. `dyad.upcomingSession` is the one field that still disagrees — §6.2.

### 3.2 The 7 members with callers here

There are **12** `useResearch()` call sites and every one destructures — no
`store.foo(...)` form exists anywhere — so this list is exhaustive.

| Member | L | What it mutates | Called by |
|---|---|---|---|
| `coaches` | `:68` | read-only | `CoachCard.tsx:116` |
| `consumerDyads` | `:94` | read-only | `ConsumerShell.tsx:292`, `ConsumerHomePage.tsx:216,498`, `ConsumerAccountPage.tsx:217`, `ConsumerDiaryPage.tsx:154`, `ConsumerHelpPage.tsx:484`, `ConsumerLessonsPage.tsx:57`, `ConsumerModulePage.tsx:1217` |
| `sessionCompletion` | `:129` | read-only | `ConsumerHomePage.tsx:333,498`, `SessionPlanStrip.tsx:643` |
| `sessionPlans` | `:136` | read-only | `ConsumerHomePage.tsx:333`, `SessionPlanStrip.tsx:643` |
| `updateDyadPerson(dyadId, 'patient'\|'carer', patch)` | `:438` | shallow-merges a `PersonProfile` patch onto that member | `ConsumerAccountPage.tsx:293,299` via `ConsumerPersonCard` |
| `submitSleepDiary(dyadId, {patient?, carer})` | `:690` | writes each member's `diary` onto their own `HealthLogEntry` for `TODAY` (**updating in place if that date exists, appending `{date: TODAY, synced: false, diary}` if not**), **and** stamps `dyad.diarySubmittedOn = TODAY` | `ConsumerDiaryPage.tsx:244` |
| `setDyadOptOut(dyadId, reason)` | `:856` | sets `dyad.optedOut = { reason, date: TODAY }` | `ConsumerAccountPage.tsx:197` |

`submitSleepDiary` is **one action covering both members**, deliberately, so a
caller cannot half-make the write.

### 3.3 The 40 members with no caller here — **inherited surface, not a delete list**

These are real API surface for the three portals that were cut from this package.
They tell you what a backend has to support even though this interface never
invokes them. **Do not bulk-delete.**

*Fields (9)* — `searchQuery`, `phaseCompletion`, `phaseCompletionDates`,
`spacesCoaches`, `supervisionNotes`, `researchNotes`, `manualRecordings`,
`manualModuleUnlocks`, `researcherProfile`

| Group | Actions (31) |
|---|---|
| Search | `setSearchQuery` |
| Coach trainee lifecycle | `addCoachTrainee`, `withdrawCoach`, `updateContact`, `togglePhase`, `recordCertificationOutcome`, `inviteCoach`, `updateCoachNotificationPreferences` |
| Consumer administration | `enrollConsumer`, `addConsumer`, `transferDyad`, `updateDyadOverview`, `updateDyadCoachNotes`, `updateDyadNotificationPreferences`, `addConsentDocument`, `removeConsentDocument` |
| Sessions and modules | **`toggleSession`**, `updateSessionPlanRow`, `bulkSetSessionPlan`, `addAdHocMeeting`, **`unlockModuleManually`** |
| Notes and recordings | `addSupervisionNote`, `updateSupervisionNote`, `addResearchNote`, `addManualRecording`, `addDyadSessionRecording` |
| Coach reflections | `submitPostPracticeAnnotation`, `updateAnnotationSummary` |
| Diary (free text) | `addDiaryEntry` |
| Researcher profile | `updateResearcherContact`, `updateResearcherNotificationPreferences` |

**Three of these matter most to a consumer engineer:**

- **`toggleSession` (`:571`) is the only thing that marks a session complete**,
  and under the data layer's own rule it is therefore the only thing that unlocks
  a module. The consumer can never call it. **Module release is entirely a coach
  action.** It writes `completedDate: TODAY` but `completedTime` from the **real**
  `new Date()` — one of the few places the two clocks meet.
- **`unlockModuleManually` (`:651`)** is the coach's early-access override, also
  unreachable here.
- **`addDiaryEntry` (`:674`)** writes the free-text `diaryEntry` field — the
  *coach-facing* note, distinct from the 9 structured answers. It pairs with the
  live `submitSleepDiary` and no consumer surface calls it.

### 3.4 What is lost, and when

**On reload: everything.** No `localStorage`, no IndexedDB, no network. The whole
`src/` tree contains exactly three textual matches for
`localStorage|sessionStorage`; two are comments saying *deliberately not
persisted*, and the third is `auth.ts`'s single `removeItem`.

**Lost even without a reload**, because it never reaches the store at all:

| Thing | Where it lives | Lost when |
|---|---|---|
| Module reflection answers | `ConsumerModulePage.tsx:1259` `useState` | leaving the module page |
| The share-with-coach choice | `ConsumerModulePage.tsx:1262` `useState` | leaving the module page |
| Module stage / `furthest` progress | `ConsumerModulePage.tsx:1223,1234` | leaving the module page |
| Session feedback mood + free text | `SessionFeedbackModal.tsx:419,420` | closing the modal |
| Diary draft answers | `ConsumerDiaryPage.tsx` `Draft` state | leaving the flow |
| Text size | `consumerTextScale.ts:43` | reload |
| Welcome / tour seen | `ConsumerShell.tsx:35`, `consumerOnboarding.ts:25` | reload |

`ConsumerModulePage` calls `useResearch()` for `consumerDyads` only (`:1217`) and
**never invokes an action**. The file says so at `:1243-1246`: *"There is no store
slice for a consumer's reflection answers yet, and inventing one would put a
number on a researcher's screen that no coach has ever discussed."*

### 3.5 `auth.ts` is vestigial

Thirteen lines exposing `signOutOfTraining()`, which removes
`sessionStorage['care2sleep.trainingAuth']` — a key **nothing in this package
ever sets**. Two callers (`ConsumerHeader.tsx:553`, `ConsumerMenuDrawer.tsx:357`),
both of which then `navigate('/')`, which redirects straight back to the same
consumer. **Log out is a no-op loop.**

### 3.6 What a real persistence layer would own

| Owner | Data |
|---|---|
| **Identity service** | the consumer ↔ `dyadId` binding, currently a hardcoded redirect |
| **Consumer record store** | `ConsumerDyad` minus the derived and coach-owned parts. `PersonProfile` edits need an **audit trail** — a research participant is changing their own record |
| **Session service** | `sessionPlans` + `sessionCompletion` as one authority. The portal must **read** completion, never write it |
| **Module progress service** | `moduleEngagement` per dyad per module, plus **a new store for reflection answers and the share flag, which does not exist today** |
| **Diary service** | one `SleepDiaryAnswers` per person per date, plus the submission stamp. **Q10–13 must stay derived** |
| **Feedback service** | post-session mood + free text. **No storage exists at all today** |
| **Fitbit ingestion** | `HealthLogEntry`'s device fields, nightly |
| **Consent / withdrawal** | `optedOut`, plus whatever REDCap holds |
| **Clock** | `TODAY` becomes the real date — `integration-points.md` §2 |

---

## 4. The module-scoped stores

### 4.1 Why they exist

`App.tsx:47` keys `<Routes>` on `location.pathname` inside
`AnimatePresence mode="wait"`, so **the entire page subtree including
`ConsumerShell` is unmounted and remounted on every in-app navigation.** Anything
in component state is destroyed by navigating.

The standing fix is a module-scoped `let`, a `Set` of listeners, and
`useSyncExternalStore`:

```ts
let value = initial
const listeners = new Set<() => void>()
function emit()       { listeners.forEach((l) => l()) }
function subscribe(l) { listeners.add(l); return () => { listeners.delete(l) } }
const read = () => value
export function useThing() { return useSyncExternalStore(subscribe, read, read) }
```

`useSyncExternalStore` is what makes a value living *outside* React re-render the
components reading it. A plain module `let` would be stable but silent.

### 4.2 The four stores

| Store | File | Holds | Persisted? |
|---|---|---|---|
| **Content-reveal pulse** | `consumerMenuReveal.ts:23` | a monotonically increasing `token: number` | no |
| **Hamburger drawer** | `consumerMenuReveal.ts:62` | `{ open: boolean, dyadId: string \| null }` | no |
| **Onboarding tour** | `consumerOnboarding.ts:25` | `open: boolean` | no |
| **Text size** | `consumerTextScale.ts:43` | `index: number` into a 5-step ladder | no |

**Content reveal is a *token*, not a boolean, deliberately:** consecutive drawer
closes must each fire, and a boolean would need resetting — a second render and a
race. `pulseContentReveal()` is called by the drawer's X/Escape path only, never
by the navigate path (the new page's own mount animation covers that one).

**Drawer open state lives here *and* the drawer is mounted above the router**
(`App.tsx:89`) for the same reason: a row tap must navigate **and** close in the
same frame.

**Tour open state lives here** because the welcome flow's completion *navigates*
to Home, unmounting the shell that opened the tour. A shell-state flag would be
destroyed by the very navigation meant to reveal it.

**Text size.** The ladder is `[1, 1.125, 1.25, 1.375, 1.5]` with default index 0:
**100% is the floor and there is deliberately nothing below it.** It previously
began at `0.875`, which multiplied this portal's 16px floor down to 14px on every
body element — a setting that made text *less* readable, offered to an audience
defined by not being able to read it.

It is applied as `style={{ zoom: scale }}` in two places:

- `ConsumerShell.tsx:437` on `<motion.main>` — **scoped to `main`, so the header,
  and therefore the accessibility menu doing the scaling, holds still.**
- `ConsumerMenuDrawer.tsx:258` on the drawer panel — because the drawer is
  mounted above the routes in `App.tsx` and would otherwise inherit nothing.
  Below 1200px **that drawer is the navigation**.

`useTextScale()` returns `canIncrease` / `canDecrease` / `isDefault` rather than
leaving the menu to work them out, so the ladder's length lives in one file.

> `zoom` scales layout as well as text, so this is a page magnifier rather than a
> WCAG 1.4.4 text resize. The store's own doc says so, and says it maps to no
> spec. That is the right call for *this* audience — a carer who cannot read the
> diary wants it bigger, not reflowed.

### 4.3 Three more module-scoped flags (no `useSyncExternalStore`)

| Flag | File | Purpose |
|---|---|---|
| `welcomeDismissed` | `ConsumerShell.tsx:35` | has the first-run welcome been passed this session |
| `pageIntroPlayed` | `ConsumerShell.tsx:86` | suppress the page entrance animation after the first load |
| `navIntroPlayed` | `ConsumerHeader.tsx` | same, for the nav row |

Plain `let`s because nothing needs to re-render off them — they are read once
during render and written in an effect. `welcomeDismissed` is additionally
written **during render** at `ConsumerShell.tsx:263` when a page passes
`showWelcome={false}`: deliberate, idempotent, and an effect would paint the
welcome for a frame on the way past.

### 4.4 What non-persistence means for the product

| Store | Prototype | Production expectation |
|---|---|---|
| Welcome seen | replays on **every** page load | a per-account flag on the server, or at minimum `localStorage` |
| Tour seen | replays on every page load | same |
| Text size | resets on every load | **must** persist per device. This is an accessibility setting for an audience defined by needing it |
| Drawer / reveal | correct as-is | genuinely ephemeral |

The replaying welcome and tour are a deliberate **review** trade — a first-run
screen that appears once per browser is a screen nobody can look at twice — but
they are the first two things to change when this ships.

---

## 5. The demo consumer — `dyad-011`, Bruce & Joan Whitfield

`/`, `/consumer` and the catch-all all `<Navigate replace>` to
`/consumer/dyad-011` (`App.tsx:50,51,76`). Five dyads exist in the seed
(`dyad-011/012/013/014/030`) but **only `dyad-011` is reachable in normal use** —
the others need a typed URL, so their state is latent.

### 5.1 Complete state, executed against the real seed

```
TODAY            2026-08-26                  (format.ts:45, frozen)
PLE              Bruce Whitfield, 81, bruce.whitfield@example.com, 0412 887 209
Carer            Joan Whitfield, 78, Spouse, joan.whitfield@example.com, 0412 887 213
Greeting         "Joan & Bruce"              (dyadFirstNames — carer first)
Coach            helen-zhang — Helen Zhang, Enrolled nurse,
                 St Brigid's Aged Care, 8 yrs, 0421 555 480,
                 h.zhang@stbrigids.example.au
                 assigned 2026-06-22
optedOut                 undefined
diarySubmittedOn         undefined           → Home opens on the "fill it in" card
notificationPreferences  undefined
omitFromConsumerRoster   undefined
consentDocuments         1 (whitfield-dyad-consent-signed.pdf, 2026-06-20) — not rendered
sessionRecordings        1 — not rendered
```

**Sessions completed** (internal → display), all on or before `TODAY`:

| internal | display | date | time |
|---|---|---|---|
| 1 | Planning | 2026-06-24 | 10:00 |
| 2 | Session 1 | 2026-07-22 | 10:00 |
| 3 | Session 2 | 2026-08-05 | 10:00 |
| 4 | Session 3 | 2026-08-19 | 10:00 |

`catchupSessionsCompleted` = **3 of 6**. `nextPlannedSession` = internal **5** →
**"Session 4"**, Wed 2 September 2026, 10:00.

**Session plan** — all 7 rows dated, chronological, every `moduleTargetDate`
exactly 8 days before its own session, every row except Planning carrying
placeholder Zoom creds. **No row carries `endTime`.** Row 6 is the deliberate
rescheduled case: `2026-09-18`, `previousDate: 2026-09-16`, `rescheduled: true`.

**Module engagement vs. unlock state:**

| idx | module | `moduleUnlockState` | status | slides | last activity |
|---|---|---|---|---|---|
| 0 | getting-started | unlocked | completed | 6/6 | 2026-06-20 |
| 1 | understanding-sleep-dementia | unlocked | **not-started** | – | – |
| 2 | calming-bedtime-routine | unlocked | in-progress | 2/6 | 2026-08-12 |
| 3 | managing-nighttime-waking | unlocked | completed | 6/6 | 2026-08-16 |
| 4 | daytime-habits | unlocked | in-progress | 3/6 | 2026-08-19 |
| 5 | carer-own-sleep | **locked** | not-started | – | – |
| 6 | using-sleep-data | **locked** | not-started | – | – |

Module 1 is the deliberate "attended the catch-up but never opened the module"
case. `releasedLessons()` therefore yields, newest first:

```
Module 4  daytime-habits                resume    50%   8 mins left of 15   ← content EXISTS
Module 3  managing-nighttime-waking     complete 100%                       ← inert CTA
Module 2  calming-bedtime-routine       resume    33%  10 mins left of 15   ← inert CTA
Module 1  understanding-sleep-dementia  start      0%  15 mins              ← inert CTA
```

> **Worth knowing before anyone reports it as a bug:** Module 3 renders "Module
> complete" and Module 2 renders a 33% bar for content that **does not exist**.
> The missing content is a known build state; the engagement seed asserting
> progress against unbuilt modules is what makes the page look self-contradicting.
> It is a product call, not a defect. The honest seed leaves Modules 1–3
> `not-started`, which collapses the page to a single card.

**Health logs** — 18 contiguous nights each, `2026-07-05 … 2026-07-22`. Patient's
structured diary missing on `2026-07-13`; both members' Fitbit unsynced on
`2026-07-21` and `2026-07-22`.

⚠️ **Those logs end 35 days before `TODAY`.** `spaces.ts`'s `healthLog()`
hardcodes `const endDate = '2026-07-22'` while its own doc comment claims it
"ends on `format.ts`'s TODAY" — one fact, two copies, and `TODAY` has since
moved. Invisible today **only because nothing in this portal reads the log**
(§6.6). Fix is one line: `const endDate = TODAY`; the file already imports from
`./format`.

**Coach reflections** — 3 entries (`ann-011-3` s4 2026-08-19 shared,
`ann-011-2` s3 2026-08-05 not shared, `ann-011-1` s2 2026-07-22 shared).
Coach-facing; not rendered here.

**`upcomingSession`** — still `{ session: 2, date: '2026-07-22' }`, a session that
is already in `sessionsCompleted`. A field named "upcoming" pointing at a
completed session. Deliberately not read — §6.2.

### 5.2 Seed consistency

`docs/seed-invariants.mjs`, run against the live seed:

```
Seed invariants — frozen clock TODAY = 2026-08-26
26 invariant(s) hold.
Seed is internally consistent.
```

It asserts, across **every** dyad: nothing marked completed is dated after
`TODAY`; no module `lastActivityDate` is after `TODAY`; no health-log entry is
after `TODAY`; every not-yet-completed plan row is dated on or after `TODAY`; no
reflection post-dates the clock; and no module still reads `in-progress` once its
own catch-up session is complete. **Run it after any change to `TODAY` or to
`spaces.ts`.**

---

## 6. Derived facts

Every value below is computed at render time. **A fact derived twice in two
places is this project's most-repeated bug class**, so each entry names *every*
call site.

### 6.1 Module unlock state — ⚠️ two rules, one fact

```
moduleUnlockState(index, completed, manualUnlocks = [])    spaces.ts:728
```

Index ≤ 0 → always unlocked. Index N → unlocked once **internal session N** is
complete, or N is in `manualUnlocks`.

**Call sites in this package: zero.** Measured, not assumed.

> **This is the single most important thing to understand about this interface.**
> The Consumer Portal does **not** gate modules on unlock state. It gates them on
> **engagement**, via `releasedLessons()` (§6.4), whose own doc at
> `lessons.ts:14-25` records a direct correction that *"marking a session
> complete has nothing to do with module unlocking"*. `moduleUnlockState` is
> still the data layer's answer and is what the coach and researcher portals
> read. The two agree for `dyad-011` today — I checked all seven modules — but
> they are two rules for one fact and **they can disagree**.
>
> **Not something to resolve before using this package** — this is a prototype,
> and nothing in it makes the two diverge. Whoever builds the real
> module-release endpoint picks one rule and serves it.

`isPlanSet(plan)` (`spaces.ts:304`) is in the same position: exported, real, and
**never called here**. `ConsumerModulePage`'s only guards are
`!dyad → /consumer` and `!moduleLesson(moduleId) → /learning`.

### 6.2 The next session

```
nextPlannedSession(plan, completed)                  spaces.ts:316
nextUpcomingSessionEntry(plan, completed, legacy)    spaces.ts:353   ← not used here
nextUpcomingSessionNumber(...)                       spaces.ts:368   ← not used here
```

The earliest plan row that is **dated, not completed, and not internal 1**.

**Call sites (2), one function:**

| Site | Uses it for |
|---|---|
| `ConsumerHomePage.tsx:351` | `NextSessionCard` — the date, time and number on Home |
| `SessionPlanStrip.tsx:649` | inside `useResolvedPlan`, for the strip's "Next session" cell |

Both read the same function, so they cannot name different sessions. ✅

**`dyad.upcomingSession` is deliberately read nowhere in this portal.**
`ConsumerHomePage.tsx:336-349` documents why: on this dyad the field still names
internal session 2, already completed, so reading it put "1 of 6, Wed 22 July"
eight inches above a strip marking that same session Completed. The field is
still read by the coach and researcher portals and was left alone.

### 6.3 Session end time — ⚠️ two authorities

| Surface | Rule | Site |
|---|---|---|
| Home's next-session card | **start + one hour, invented in the render** | `addOneHour()` `ConsumerHomePage.tsx:164`, used `:443` |
| The session-plan strip | reads the real `row.endTime`, and shows the start alone when absent | `SessionPlanStrip.tsx:244` |

`SessionPlanRow.endTime` exists on the type, is honoured by the strip, and is
**unset on all seven of `dyad-011`'s rows**, so the strip currently renders a bare
start time while Home nine inches above it renders a range. The strip's own
comment names the divergence and declines to repeat the assumption. **A backend
should return a real `endTime` or `durationMin` and Home should read it.**

### 6.4 A consumer's released modules — the portal's real module authority

```
MINUTES_PER_SLIDE = 2.5              lessons.ts:30
NUMBERED_LESSON_COUNT = 6            lessons.ts:58   (= SPACES_CATCHUP_COUNT, derived)
viewFor(index, dyad)                 lessons.ts:60
releasedLessons(dyad)                lessons.ts:94
```

`releasedLessons` walks `moduleEngagement`, finds the **highest-indexed module
with a status other than `not-started`**, and returns every module from that
index **down to 1**, newest first. `[0]` is "module of the week"; the rest are
"previous modules". **One ordering**, so the featured card and the list cannot
both claim a module or drop one between them.

It stops at 1, never 0: `CONSUMER_MODULES[0]` is the pre-module, real content that
the coach-facing surfaces still count, but not one of the consumer's *modules* —
so no label ever reads "Module 0".

`viewFor` derives, per module:

| Field | Rule |
|---|---|
| `state` | `completed` → `complete`; else `slidesCompleted > 0` → `resume`; else `start`. **An `in-progress` record with 0 slides is a *start*, not a resume** — a 0% bar labelled "Resume" claims something happened |
| `totalMinutes` | `round(slideCount × 2.5)` = 15 |
| `progress` | `min(1, slides / slideCount)` |
| `minutesLeft` | `max(1, round(totalMinutes × (1 − progress)))` — floored at 1, because "~0 mins left" on an unfinished module reads as a bug |
| `label` | `` `Module ${index}` `` |

**Call sites (2), one function:**

| Site | Uses it for |
|---|---|
| `ConsumerLessonsPage.tsx:64` | `const [featured, ...previous] = releasedLessons(dyad)` |
| `LearningTaskCard.tsx:101` | `releasedLessons(dyad)[0]` — Home's module-of-the-week card |

**No duplication.** This file exists *because* Home and My Modules previously each
picked "this week's module" their own way and named different ones. ✅

### 6.5 Module content resolution

```
moduleLesson(moduleId)        consumerLessonContent.ts:302
moduleReflection(moduleId)    consumerLessonContent.ts:424
formatTimestamp(seconds)      consumerLessonContent.ts:157
```

`moduleLesson` returns `null` for index < 1 or for any module with no
`MODULE_EPISODES` entry. It reads `index`, `title` and `label` from
`CONSUMER_MODULES`, **never from the content file**, so a module's identity cannot
disagree with My Modules.

**Call sites (3):**

| Site | Uses it for |
|---|---|
| `ConsumerLessonsPage.tsx:50` | does this card get a real link? |
| `LearningTaskCard.tsx:114` | the same, for Home |
| `ConsumerModulePage.tsx:1303` | the page itself; `null` → `<Navigate replace>` to `/learning` |

`formatTimestamp` is used twice, both in the chapter carousel
(`ConsumerModulePage.tsx:587,623`).

### 6.6 The whole Fitbit / diary history — derived by nobody

`healthLog()` (`spaces.ts:~928`), `withSyncGap()`, `withMissingDiaryOn()` and
`computeSleepDiary()` (`:544`) generate and derive a rich 18-night record per
person. **The Consumer Portal renders none of it.** Zero read sites for any
device field, for `patientLog`/`carerLog`, or for `computeSleepDiary` (§2.6).

The diary flow is **write-only** from this interface's point of view: it posts 9
answers and shows a thank-you. Stated loudly because the type surface strongly
implies otherwise.

### 6.7 Diary completeness and submission

```
done          = dyad.diarySubmittedOn === TODAY          ConsumerHomePage.tsx:218
stepComplete  = every present member has a non-empty answer for this question
                                                          ConsumerDiaryPage.tsx:210
QUESTIONS     = SLEEP_DIARY_QUESTIONS.filter(!computed && field)
                                                          ConsumerDiaryPage.tsx:75
to12Hour(value)  "HH:MM" → "h:mm am/pm"                   ConsumerDiaryPage.tsx:94
```

`stepComplete` also **guards the write** (`:220`): without it, `Number('')` would
put `NaN` into the store. The footer renders `aria-disabled` with a visible
`BlockedHint` naming the reason rather than hiding the control.

Time inputs are native `type="time"` and convert on submit, never in the field.

### 6.8 Session-plan cell status

```
statusOf(row, completedSessions, nextSession)   SessionPlanStrip.tsx:73
useResolvedPlan(dyad)                            SessionPlanStrip.tsx:638
```

Priority order: `completed` → `next` → `rescheduled` → `scheduled`. Internal
session 1 is filtered out entirely at `:647`, so the strip shows exactly the 6
numbered catch-ups.

### 6.9 Module-flow progress and gating

```
stageProgress(stage)          ConsumerModulePage.tsx:102   (STAGES.indexOf + 1) / 4
useScrollChrome(rm, stage)    ConsumerModulePage.tsx:156
moduleExitTo(dyadId, from)    ConsumerModulePage.tsx:702
reflectionIncomplete          ConsumerModulePage.tsx:1389
blockedReason                 ConsumerModulePage.tsx:1397
```

`STAGES = ['welcome','video','summary','reflection']`; `done` is deliberately
**not** a fifth quarter, so the bar reads 100% on reflection. `stageProgress` is
derived because the frame it came from drew a 46.5% bar beside a label reading
"100% complete" — neither was transcribed.

`reflectionIncomplete` requires **every member × every question** to have at least
one selected option. `blockedReason` adds the share choice, which is
`boolean | null` and is **never defaulted** — a default would answer a consent
question on the reader's behalf.

### 6.10 Small derivations, each single-source

| Fact | Function | Call sites |
|---|---|---|
| Both first names, carer first ("Joan & Bruce") | `dyadFirstNames` `spaces.ts:776` | `ConsumerHomePage.tsx:178`, `ConsumerShell.tsx:295` (tour greeting) — **2 sites, one function** ✅ |
| Display session number | `displaySessionNumber` `spaces.ts:71` | `SessionPlanStrip.tsx:150,603`; `ConsumerHomePage.tsx:390,533` |
| Session label incl. "Planning" | `sessionRowLabel` `spaces.ts:85` | *(no consumer call site — `nextPlannedSession` already excludes internal 1)* |
| Numbered catch-up count | `SPACES_CATCHUP_COUNT` `spaces.ts:106` | `ConsumerHomePage.tsx:411`, `SessionPlanStrip.tsx:528`, `lessons.ts:58` |
| Today, as "Wed, 26 August" | `todayParts` `ConsumerHomePage.tsx:147` | `:174` — **reads `TODAY`, not `new Date()`** |
| Ordinal ("3rd") | `ordinal` `ConsumerHomePage.tsx:490` | `:533`, the feedback banner |
| 12-hour time | `formatTime` `format.ts:98` | Home, strip |
| Number word ("five") | `countWord` `ConsumerModulePage.tsx:820` | `:901`, `:1026` |
| Sleep length "6h 12m" | `formatSleepDuration` `format.ts:63` | **none** — zero references |

### 6.11 "Which session did you just finish?" — fixed, and worth knowing why

`ConsumerHomePage.tsx:526-538` derives `finishedSessionOrdinal` from the **highest
completed** session, excluding internal 1:

```ts
const lastFinishedSession = completedRecords.reduce(
  (highest, record) => (record.session !== 1 && record.session > highest ? record.session : highest), 0)
const finishedSessionOrdinal =
  lastFinishedSession > 0 ? ordinal(displaySessionNumber(lastFinishedSession))
  : completedRecords.some((r) => r.session === 1) ? 'planning'
  : 'latest'
```

It previously derived from `nextPlannedSession` — the session that has **not**
happened — so the banner read *"You finished your 4th session"* directly above a
card reading *"Coaching session: 4 of 6 · Scheduled · Wed 2 September"*. Two
statements about the same session on one screen, one of them false. For
`dyad-011` it now correctly reads **"3rd"**.

### 6.12 Facts computed in more than one place — the flags

| Fact | Computed at | Verdict |
|---|---|---|
| **"Is module N available?"** | `moduleUnlockState` (`spaces.ts:728`, the data layer, **0 callers here**) **and** `releasedLessons`' highest-touched rule (`lessons.ts:95-99`) | ⚠️ **Two rules, one fact.** Documented and deliberate. They agree throughout this prototype; a real build picks one |
| **"When does this session end?"** | `addOneHour` in Home's render **and** `row.endTime` in the strip | ⚠️ **Two authorities**, currently disagreeing in form (a range vs. a bare start) because `endTime` is unset everywhere |
| **"What date does the health log end on?"** | `format.ts`'s `TODAY` **and** `spaces.ts`'s hardcoded `endDate = '2026-07-22'` | ⚠️ **Already drifted** by 35 days. Invisible only because nothing reads the log |
| **"Which session is next?"** | 2 call sites, **one function** | ✅ correct |
| **"Which module is this week's?"** | 2 call sites, **one function** | ✅ correct — this is what `lessons.ts` exists for |
| **"Which session did you just finish?"** | 1 site, off completion records | ✅ correct (§6.11) |
| **"What is today?"** | `TODAY` everywhere, including Home's greeting | ✅ one clock |
