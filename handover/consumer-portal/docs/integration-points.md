# Care2Sleep — Consumer Portal: integration points

Every seam where a real backend attaches, what the UI does today, what it would
call, what it needs back, and what breaks if it is missing.

Read [`engineering-overview.md`](./engineering-overview.md) for the architecture
and [`data-model.md`](./data-model.md) for the types and derived facts referenced
throughout. The **real vs. mocked** table is at the end (§14) — read that first if
you have one minute.

**The context for all of it:** there is no backend, no authentication and no
persistence. Verified — zero `fetch`, zero `XMLHttpRequest`, zero `localStorage`
writes anywhere in `src/`. Everything is an in-memory React context over a seed
file, and a reload resets it.

---

## 1. Auth and session — **seam #1**

Everything else in this document is downstream of knowing who is reading.

**Today:** there is none.

```tsx
// App.tsx:50-51, :76
<Route path="/"         element={<Navigate to="/consumer/dyad-011" replace />} />
<Route path="/consumer" element={<Navigate to="/consumer/dyad-011" replace />} />
<Route path="*"         element={<Navigate to="/consumer/dyad-011" replace />} />
```

Every page then resolves its dyad by looking the URL segment up in the store, six
times over with no shared hook:

```tsx
const dyad = consumerDyads.find((d) => d.id === dyadId)
if (!dyad) return <Navigate to="/consumer" replace />
```

`src/data/auth.ts` is vestigial: `signOutOfTraining()` removes
`sessionStorage['care2sleep.trainingAuth']`, a key **nothing in this package ever
writes**, and both callers (`ConsumerHeader.tsx:553`,
`ConsumerMenuDrawer.tsx:357`) then `navigate('/')` — straight back to the same
consumer. **Log out is a no-op loop.**

**Would call**

- `POST /auth/session` — sign in.
- `GET /me` → `{ dyadId, role: 'consumer', displayName }`
- `DELETE /auth/session` — a real sign-out.

**Needs back:** the `dyadId` to substitute for the three hardcoded literals, and
the carer's name for the header's `accountLabel`.

**What breaks without it:** nothing in the prototype, and everything in
production. It is the only thing standing between this build and one consumer
reading another consumer's sleep diary.

**Two facts worth pricing before you design the flow.**

1. **Both dyad members share one account.** The carer is the account holder —
   `accountLabel` is `dyad.carer.name` on all six pages — and one of them fills
   the diary "on behalf of you both". There is no per-member login anywhere in
   the model.
2. **This audience is explicitly not digitally literate**, and many are older.
   A password form is a real cost here. A magic-link, device-remembered or
   carer-assisted flow is worth costing against it before defaulting.

**Also delete when this lands:** the "Switch portal" row in the account menu
(`ConsumerHeader.tsx:37`) and the drawer (`ConsumerMenuDrawer.tsx:79`). Both
navigate to `/`, which redirects straight back. A consumer has one portal.

---

## 2. The frozen clock — **the highest-impact seam**

```ts
// src/data/format.ts:45
export const TODAY = '2026-08-26'
```

**Today:** a module constant. Every "completed" / "scheduled" / "done today"
judgement in the portal is a string comparison against it.

### Everything that reads it, on a consumer-reachable path

| Behaviour | Site |
|---|---|
| Home's greeting — *"Today is Wed, 26 August"* | `ConsumerHomePage.tsx:148` (`todayParts`) |
| "Is today's diary done?" — `dyad.diarySubmittedOn === TODAY` | `ConsumerHomePage.tsx:218` |
| The date the diary is filled *for* | `ConsumerDiaryPage.tsx:91` (`DIARY_DATE`) |
| The date `submitSleepDiary` writes the answers under | `research-store.tsx:696,699` |
| The submission stamp it sets | `research-store.tsx:711` |
| The date `setDyadOptOut` stamps | `research-store.tsx:858` |
| Every seeded health-log date | `spaces.ts:938` — **and this one does not actually read it, see below** |
| Whether a plan row reads as past or upcoming | the seed's own dates, via `nextPlannedSession` |

Three more sites (`toggleSession` `:581`, `addDiaryEntry` `:680,684`, and several
coach/researcher actions) read `TODAY` but are unreachable from this UI.

### One clock, deliberately

Home's greeting reads `TODAY`, not `new Date()`, and
`ConsumerHomePage.tsx:119-146` argues the case at length. **Do not "fix" it
back.** An earlier version read the real clock on the reasonable argument that a
line saying "Today is" can be checked against the reader's own calendar; the cost
was worse. Captured live before the fix:

```
Today is Mon, 14 September
Coaching session: 4 of 6 · Scheduled · For: Wed, 2 September 2026
```

Two clocks on one screen. In a package that may sit unopened for months, the real
clock drifts further from the seed every day.

### ⚠️ One duplicate that has already drifted

`spaces.ts:938` hardcodes `const endDate = '2026-07-22'` while its own doc
comment at `:927` claims the log "ends on `format.ts`'s TODAY". `TODAY` has since
moved to `2026-08-26`, so **the demo dyad's health logs end 35 days early**
(measured: `2026-07-05 … 2026-07-22`). This is invisible today only because
nothing in this portal reads the log back (§7). One fact, two copies. Fix:
`const endDate = TODAY` — the file already imports from `./format`.

### What breaks when time becomes real

- **Timezone discipline must survive.** `formatDate`, `formatDateLong`,
  `formatTime` and `toLocalISODate` are all written to avoid `new Date(iso)`,
  which parses a bare date as UTC midnight and therefore renders the **previous
  day** anywhere ahead of UTC — Melbourne included, which is where this study
  runs. Keep it.
- **"Today's diary" becomes a genuine per-day question**, which needs a
  server-side notion of the consumer's own timezone and day boundary. **A diary
  filled at 00:30 is about *last* night.** That is a product decision, not a
  formatting one.
- **The seed becomes irrelevant** — which is the point — but until then, run
  `docs/seed-invariants.mjs` after any change to `TODAY` (§13).

**Would call:** nothing. But the server **must return plain `YYYY-MM-DD` local
dates, not instants.** Returning an ISO timestamp reintroduces the exact
off-by-one-day bug these helpers exist to avoid.

---

## 3. Sleep-diary writes — **the one write that fully works**

**Today:** `submitSleepDiary(dyadId, { patient?, carer })`
(`research-store.tsx:690`) writes each member's 9 answers onto their own
`HealthLogEntry` for `TODAY` — updating that date's entry in place if it exists,
appending `{ date: TODAY, synced: false, diary }` if not — and stamps
`dyad.diarySubmittedOn = TODAY`. **One action for both members**, so a caller
cannot half-make the write.

Called from exactly one place, `ConsumerDiaryPage.tsx:244`, on Finish. Nothing is
persisted at any earlier step: the draft lives in one `useState`.

**Would call**

```
POST /consumers/{dyadId}/sleep-diary
```
```jsonc
{ "date": "2026-08-26",
  "entries": [
    { "member": "ple", "answers": {
        "napMin": 60, "outOfSleepWindowMin": 30, "bedtime": "10:00 pm",
        "sleepLatencyMin": 45, "wakeCount": 2, "awakeDuringNightMin": 60,
        "outOfBedDuringNightMin": 25, "wakeTime": "7:00 am", "outOfBedTime": "7:30 am" } },
    { "member": "carer", "answers": { /* … */ } } ] }
```

**Needs back:** the stored record plus a `submittedOn` stamp.

**Three things a backend must get right.**

1. **Do not accept or return Q10–13.** `minutesAwakeInBed`,
   `sleepOpportunityMin`, `totalSleepTimeMin` and `sleepEfficiencyPercent` are
   derived by `computeSleepDiary()` (`spaces.ts:544`). Storing them makes two
   sources for one number.
2. **Times are `"h:mm am/pm"` strings, not `HH:MM`** — the reference paper
   diary's own format. `to12Hour()` (`ConsumerDiaryPage.tsx:94`) converts from the
   native `type="time"` control on submit, never in the field.
3. **`diarySubmittedOn` is a separate fact from the log entry.** See
   `data-model.md` §2.1 for why: the seed writes a `diary` on every generated
   date, so "today's log has a diary" cannot answer "did they submit today".

**Also needs deciding:** an idempotency rule for re-submitting the same date, and
whether a carer-only consumer posts one entry or two.

**Unused sibling:** `addDiaryEntry` (`research-store.tsx:674`) writes the
free-text `diaryEntry` field. **No consumer surface calls it** — that note is
coach-facing today.

---

## 4. Module-progress writes — **nothing exists**

**Today:** the module flow writes nothing at all. `ConsumerModulePage` calls
`useResearch()` for `consumerDyads` only (`:1217`) and never invokes an action.
`moduleEngagement` is seed-only; `releasedLessons()` reads it and the consumer can
never change it. `stage` and `furthest` reset on every entry, so a reader who
leaves mid-module starts over.

**Would call**

```
PUT /consumers/{dyadId}/modules/{moduleId}/progress
  → { status: 'not-started'|'in-progress'|'completed', slidesCompleted, lastActivityDate }
```

Fire on each stage advance, or at minimum on `done`.

**Needs back:** the persisted progress, so leaving mid-module resumes where the
reader was.

> ### Two rules answer "is module N available" — worth knowing, not worth solving here
>
> (`data-model.md` §6.1)
>
> - the data layer's `moduleUnlockState` (`spaces.ts:728`) — module N unlocks
>   once **internal session N** is complete;
> - the portal's `releasedLessons` (`lessons.ts:94`) — every module from the
>   **highest-engaged one** downwards is released.
>
> **The portal uses the second. `moduleUnlockState` has zero callers here.** They
> agree for the demo dyad, and nothing in this prototype makes them disagree.
>
> **This is not a decision you need to make to use this package.** It is recorded
> because whoever builds the real module-release endpoint will have to pick one
> rule and serve it — the coach and researcher portals read the first — and
> because two rules for one fact is the kind of thing that is much cheaper to
> notice now than to discover later. Until then it is inert.
>
> Note also that under the first rule, **the consumer can never release a
> module** — `toggleSession` is a coach action the consumer cannot invoke.

---

## 5. The module reflection — collected, gated, reviewable, then discarded

**Today:** five multi-select questions, answered **per dyad member**, plus a
review screen where answers are editable in place, plus a share-with-coach
choice — and none of it is written anywhere. It is `useState` on the page
(`ConsumerModulePage.tsx:1259,1262`) and dies with it.

The gating is real and is worth preserving: `Finish module` is blocked until
**every member × every question** has at least one option, **and** the share
choice has been made. The share choice is `boolean | null` and is **never
defaulted** — a default would answer a consent question on the reader's behalf.

**Would call**

```
POST /consumers/{dyadId}/modules/{moduleId}/reflection
```
```jsonc
{ "sharedWithCoach": true,
  "answers": {
    "what-woke-you": { "ple": ["own-body"], "carer": ["both"] },
    "…": { }
  } }
```

Answers are keyed `answers[questionId][who]` where `who` is `'ple' | 'carer'`. A
carer-only dyad never grows a `ple` key.

> ### ⚠️ This endpoint cannot be written until a product question is answered
>
> **`sharedWithCoach` has no destination.** There is no field on `ConsumerDyad`
> for a consumer's reflection, and **`annotationSummaries` is the *coach's*
> SIPTEA record — do not reuse it.** Decide who sees these answers, and under
> what consent, before building the endpoint. The file itself says so at
> `ConsumerModulePage.tsx:1243-1246`: *"inventing one would put a number on a
> researcher's screen that no coach has ever discussed."*

---

## 6. Post-session feedback — **nothing exists, and the trigger is a demo button**

**Today:** mood and free text are `useState` in `SessionFeedbackModal`
(`:419,420`). "Submit Feedback" (`:828`) calls `setStep('thanks')` and **writes
nowhere.** Reopening the modal resets to the mood step with nothing chosen. Skip
is a local boolean that hides the banner for that page instance only.

**The trigger is the bigger gap.** The banner appears when you press **"Join
video call"** on Home's next-session card (`ConsumerHomePage.tsx:468`). That is a
**demo switch**, documented as such at the call site, standing in for a
"session finished" signal the platform does not have. It is a `<button>` rather
than the `<a href={upcoming.zoomLink}>` it replaces, deliberately, because a
control that opens Zoom *and* toggles a banner would be two actions wearing one
label.

**Would call**

```
POST /consumers/{dyadId}/sessions/{sessionNumber}/feedback
  → { "mood": "okay", "comment": "…", "skipped": false }
```

`mood` ∈ `very-good | good | okay | not-great | very-bad`
(`SessionFeedbackModal.tsx` `MOODS`).

⚠️ **`sessionNumber` must be the *internal* number of the session just
completed** — see the numbering trap in `data-model.md` §2.3. Home already
derives the right one (`ConsumerHomePage.tsx:526-538`, reading the highest
completed record, not the next planned one).

**Needs back:** an acknowledgement, and a flag so the banner does not reappear for
a session already answered or skipped.

**Also needs:** the trigger itself — *"this session has finished"*. In production
that is the coach marking the session complete (`toggleSession`,
`research-store.tsx:571`), an action the consumer can never invoke. Splitting
this seam is a two-line change on the UI side: restore the real Join anchor, and
drive the banner off server state.

---

## 7. Fitbit — **read by nothing in this portal. Say this out loud.**

**Today:** `HealthLogEntry` carries `synced`, `remPercent`, `deepPercent`,
`lightPercent`, `durationMin` and `disturbances`, and the seed generates 18 nights
per person per dyad, including a deliberate two-night sync gap and one missing
diary night.

Grepping all of `src/components` and `src/pages` for **any** of those fields, plus
`patientLog`, `carerLog`, `HealthLogEntry` and `computeSleepDiary`, returns
**one hit, and it is inside a comment.**

**So: for *this* interface there is no Fitbit seam today.** The Consumer Portal
writes the log and never reads it. The coach and researcher portals are the
readers. Stated plainly because the type surface strongly implies otherwise, and
someone will otherwise scope a chart that nothing asked for.

**If the Consumer Portal is ever meant to show it,** the seam is a nightly
ingestion:

```
GET /consumers/{dyadId}/sleep-data?from=&to=   → HealthLogEntry-shaped rows
```

with `synced: false` and the device fields **absent (not zero)** on a missed
night. The seed is explicit that a missed sync still leaves the manual diary
intact (`withSyncGap` drops the device fields and keeps `diary`), so the two are
independent and a UI **must not infer one from the other**.

---

## 8. Zoom — links exist on every row, rendered nowhere

**Today:** `SessionPlanRow.meetingId` / `zoomLink` and `AdHocMeeting`'s
equivalents are generated client-side by `generateMeetingCreds()`
(`research-store.tsx:248`) and are seeded on six of `dyad-011`'s seven plan rows
(every row except Planning). **No consumer surface renders either.** Verified:
the only occurrence of `zoomLink` anywhere in `components/` or `pages/` is inside
a comment. The Join button is the demo switch from §6.

**Would call**

```
GET /consumers/{dyadId}/sessions  → rows including joinUrl, startsAt, endsAt
```

The join URL should be created when the coach plans the session, not by the
client.

**Needs back: `endsAt` or `durationMin`.** This is a live inconsistency, not a
hypothetical — see `data-model.md` §6.3. Home invents the end time as start + one
hour (`addOneHour`, `ConsumerHomePage.tsx:164`), while the session-plan strip nine
inches below it reads the real `row.endTime` (`SessionPlanStrip.tsx:244`) and
renders the start alone when it is absent, which on the seed it always is. **Two
authorities for one fact, currently disagreeing in form.**

**Also needs deciding:** ad-hoc meetings exist in the model
(`AdHocMeeting`, `SessionPlan.adHocMeetings`) and `addAdHocMeeting` has **no UI
caller anywhere in this package**. Decide whether a consumer should see them.

---

## 9. Consent and REDCap

**Today:** `dyad.consentDocuments` is seed-only — one entry on `dyad-011`
(`whitfield-dyad-consent-signed.pdf`, `2026-06-20`) — and is **not rendered
anywhere in the Consumer Portal.** The store actions `addConsentDocument` and
`removeConsentDocument` are researcher-facing and have no caller here.

The project's own open decisions list still records the consent system as **TBD —
REDCap or platform-integrated**, so this is not a wiring gap so much as an
unmade decision.

**Would call:** whatever the consent system exposes. **This interface arguably
needs read-only proof of consent at most** — a status, not a document store. A
consumer downloading their own signed PDF is a plausible feature and is not
designed anywhere in this package.

**Needs back:** a consent status, if anything.

---

## 10. Opt out of the study

**Today:** `setDyadOptOut(dyadId, message)` (`research-store.tsx:856`) sets
`dyad.optedOut = { reason: message, date: TODAY }` in memory. Two-step flow on My
profile: an optional free-text message, then a confirmation.

**What changes portal-wide afterwards:**

| Surface | Change |
|---|---|
| Every consumer page | a persistent, **non-dismissible** red banner at the top of `main` (`ConsumerShell.tsx:439`), which takes over the `topBanner` slot entirely |
| My profile | the opt-out card is replaced by *"You have opted out — You opted out on {date}. Someone from the research team will be in touch with you."* |
| **Everything else** | **nothing** |

> ### ⚠️ This is the load-bearing product fact
>
> Direct correction, recorded at `ConsumerHomePage.tsx:355-362` and
> `ConsumerAccountPage.tsx:42-50`: **opting out does nothing on the consumer's
> end.** Sessions, modules, the diary and the coach card all keep working, and
> the Zoom link is not withheld. An earlier build withheld it and said access was
> gone, which is a consequence the platform does not deliver. **Opting out
> records a request; the research team follows it up off-platform.**

**Would call:** `POST /consumers/{dyadId}/withdrawal` → `{ message }`

**Needs back:** the stored withdrawal and its date.

**What breaks without it:** the copy promises *"someone will be in touch"*, and
that promise **is the entire behaviour**. A withdrawal that does not notify the
research team is a lie on screen, not a missing feature.

**One naming compromise to resolve.** The message rides the store's existing
`optedOut.reason` string, and the researcher's own surface still labels that field
"Reason" — while this flow deliberately **does not ask for a reason** (direct
instruction). Nothing is mislabelled for the consumer, but the researcher-facing
label should follow if this sticks.

---

## 11. Personal details, notification preferences, and the coach relationship

| Seam | Today | Would call | Needs back |
|---|---|---|---|
| **Personal details** | `updateDyadPerson(dyadId, 'patient'\|'carer', patch)` shallow-merges `name`, `age`, `email`, `phone` in memory. `background` and `relationship` are on the type and **never shown to the consumer** | `PATCH /consumers/{dyadId}/members/{ple\|carer}` | the updated profile. ⚠️ **A research participant editing their own record needs an audit trail** — who changed what, when |
| **Notification preferences** | `updateDyadNotificationPreferences` exists with **no consumer caller**; the preferences card was removed from My profile, and `dyad.notificationPreferences` is read nowhere | `PUT /consumers/{dyadId}/notification-preferences` → `{ email, sms }` | current prefs. **Out of scope unless the card returns** |
| **Coach relationship** | `CoachCard.tsx:116` reads `store.coaches` and finds by `dyad.coachId`. The **unassigned state is a real, rendered case** ("Not assigned yet") | `GET /consumers/{dyadId}/coach` | ⚠️ **exactly six fields**: `fullName`, `phone`, `email`, `roleAtEmployer`, `employer`, `yearsInAgedCare`. Nothing else on `Coach` is read here (`data-model.md` §2.8) — **do not ship a coach's training and certification record to a consumer** |

The coach's portrait is a placeholder illustration for every coach
(`CoachCard.tsx`). Whether coaches get real photos is a product decision nobody
has made.

---

## 12. Content delivery — **there are no media assets**

**Today:** all module content is a TypeScript module,
`src/data/consumerLessonContent.ts`, and **only `daytime-habits` (Module 4) is
populated.** Executed against the real module: `moduleLesson()` returns `null`
for all six other module ids *and* for a bogus one.

`public/` holds **103 files, 2.4 MB, all illustrations and logos**. There is no
video and no audio anywhere in the package. The video stage renders a grey
placeholder with an `aria-disabled` "Play the video" and an `sr-only` "(coming
soon)" (`EpisodePanel.tsx:398-406`); the audio mode renders a placeholder; the
transcript is a hand-abridged **10 lines** of a ~90-line production script.

**Would call**

```
GET /modules/{moduleId}
  → { index, title, intro,
      episode: { title, sub, durationSeconds, chapters[], summaryCards[],
                 transcript[], coreMessage } }
GET /modules/{moduleId}/resource.pdf        ← "Download the guide", today aria-disabled
```

plus a **signed, expiring media URL** per module for video and audio, with
captions. **The content is about people living with dementia; it should not be
world-readable.**

**Needs back, and worth stating explicitly:**

- **`chapters[].startsAt` must become real cut points.** Today they are estimated
  at 140 words/min plus 1.2s per scripted `[pause]`. For `daytime-habits` that
  produces six chapters at `0 / 166 / 516 / 714 / 929 / 1135` seconds against a
  stated `durationSeconds` of **1215**. `durationSeconds` is the same estimate.
- **`summaryCards[].chapterId` must reference a chapter and never carry a
  duplicate title.** The title is looked up, so the summary screen and the
  chapter carousel cannot name one chapter two ways. Preserve that.
- **Module identity — number and title — must keep coming from the curriculum**
  (`CONSUMER_MODULES`), not from the content payload. That is what stops a page
  claiming to be Module 1 behind a card that says Module 4.
- **The transcript's `==marked==` span is a playback position, not emphasis.**
  There is exactly one in the whole transcript and it stands for where a player
  that does not exist yet would have reached. When a real player lands, that
  static mark should be **replaced** by one driven off current time, not added to.

**What breaks until content lands:** six of seven module cards render a
focusable, `aria-disabled` CTA with an `sr-only` reason. That is the honest
degradation and should be preserved, not removed. But note the two rough edges it
leaves, both worth a product call:

- The seed asserts progress (Module 3 "complete", Module 2 at 33%) for modules
  that were never authored, so the page reads as self-contradicting.
- A valid module URL with no content and a typed typo produce **identical**
  outcomes — `<Navigate replace>` to `/learning` with no message — and `replace`
  means Back cannot return.

---

## 13. Verifying a change against these seams

```bash
export PATH="$HOME/.local/node/bin:$PATH"

cd app && npx tsc -b     # NOT `tsc --noEmit`: the root tsconfig has "files": []
cd app && npx oxlint     # expect exactly 4 warnings, all in ConsumerCanvasWave.tsx

cd app && npx tsx ../docs/seed-invariants.mjs   # after ANY change to TODAY or spaces.ts
node docs/type-scale-check.mjs                  # after ANY --text-consumer-* change
```

`docs/seed-invariants.mjs` is the one that guards §2. It asserts, across every
dyad, that nothing marked completed is dated after the clock, nothing scheduled is
dated before it, no health-log entry post-dates it, and no module still reads
"in progress" once its own catch-up is complete. Current state: **26 invariants
hold**. It reproduces seven real failures if `TODAY` is moved back to its previous
value.

---

## 14. Real vs. mocked — the one-minute table

| Feature | State | Notes |
|---|---|---|
| Routing, all 6 pages + 3 redirects | ✅ **Real** | `HashRouter`; every page reachable |
| First-run welcome (4 steps) | ✅ **Real** | Fully working. **Not persisted** — replays on every full load |
| First-run tour (5 screens) | ✅ **Real** | Fully working. Not persisted; **no re-entry point** |
| Hamburger drawer | ✅ **Real** | Except the "Switch portal" row, which loops |
| Accessibility text scaling | ✅ **Real** | 5-step ladder, 100%–150%. Works; **resets on reload** |
| Sleep diary, all 9 questions | ✅ **Real** | Writes to the store; Home reflects it immediately. The only complete write path |
| Opt out of the study | ✅ **Real** | Two-step, writes to the store, banner appears portal-wide |
| Edit PLE / carer details | ✅ **Real** | Writes `name`, `age`, `email`, `phone` |
| Session-plan strip | ✅ **Real** | Reads the live plan + completion; all four cell states reachable |
| Coach card + profile modal | ⚠️ **Partial** | Real coach data; `tel:`/`mailto:` work. **The portrait is a placeholder for every coach** |
| Next-session card | ⚠️ **Partial** | Date, time and number are real. **The end time is invented** (start + 1h); Join is a demo switch |
| My Modules list | ⚠️ **Partial** | States and progress are real. **Only 1 of 4 rendered cards has a destination** |
| Home "module of the week" card | ⚠️ **Partial** | Same — real state, real link only for Module 4 |
| Module: welcome / video / summary / reflection | ⚠️ **Partial** | Flow, gating, review screen and share choice all work. **Nothing is written**; no video; only one module has content |
| Transcript | ⚠️ **Partial** | Real words from the production script, hand-abridged to 10 lines. The highlight mark is static |
| Chapter timestamps | ⚠️ **Partial** | Estimated at 140 wpm, not measured |
| Need help page | ⚠️ **Partial** | Layout, accordion and **real crisis numbers**. Every FAQ answer says it is not written; **the research phone number is a UK drama-range stand-in**; search is switched off |
| Session feedback banner + modal | ❌ **Visual only** | Triggered by a demo button; **submits nowhere** |
| Module reflection answers | ❌ **Visual only** | Collected, gated, reviewable, editable — then discarded |
| Share-with-coach consent | ❌ **Visual only** | **No destination exists in the data model** |
| Module progress | ❌ **Visual only** | Never written; resets on every entry |
| "Download the guide" | ❌ **Visual only** | `aria-disabled` + `sr-only` "(coming soon)" |
| Video / audio playback | ❌ **Visual only** | Grey placeholders; **no media assets exist in the package** |
| Fitbit / sleep data | ❌ **Not present** | Seeded in the model, **read by no consumer surface** |
| Zoom join links | ❌ **Not present** | Seeded on six of seven plan rows, **rendered nowhere** |
| Consent documents | ❌ **Not present** | Seeded, not rendered |
| Notification preferences | ❌ **Not present** | Store action exists, card removed |
| Ad-hoc meetings | ❌ **Not present** | Modelled, no consumer surface, no UI caller anywhere |
| Sign in | ❌ **None** | Hardcoded redirect to `dyad-011` |
| Sign out | ❌ **None** | Clears an unused key, returns to the same consumer |
| Switch portal | ❌ **None** | Navigates to `/`, which redirects back |
| Persistence of any kind | ❌ **None** | No `localStorage`, no `sessionStorage`, no network |

### The seams in build order

1. **Auth/session** (§1) — everything is downstream of it.
2. **Persist the text size** (§ `data-model.md` 4.4) — cheapest real win; one
   `localStorage` read and one write in an existing store.
3. **Decide the two blocked product questions** — which rule releases a module
   (§4), and where reflection answers go (§5). Neither is a code decision.
4. **Make time real** (§2).
5. **Wire the three writes that already have UI** — diary (§3), module progress +
   reflection (§4, §5), feedback (§6).
6. **Content delivery** (§12) — the largest external dependency and the one this
   team does not control.
