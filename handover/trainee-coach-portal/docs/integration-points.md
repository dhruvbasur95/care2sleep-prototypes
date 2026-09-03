# Care2Sleep — Trainee/Coach Portal: integration points

**Scope.** Every seam where a real backend or third party attaches to the Coach Delivery Portal (`/delivery/*`) and the module-learning surfaces (`/training-v2/*`).

**The headline.** This package makes **zero network calls** other than two `fetch()` calls for a static SVG in its own `public/` directory. There is no server, no API client, no `XMLHttpRequest`, no WebSocket, no analytics, no error reporting. All state is React `useState` in one provider plus five `localStorage`/`sessionStorage` keys. Confirmed by a full-tree grep.

**Read this alongside** `data-model.md`, which describes the shapes referenced here.

**Standing warning.** Several behaviours below are *mocks that look finished*. Where a mock would be wrong in production it is marked **⚠ MOCK**. Do not inherit any of these as a specification.

---

## 1. The store — the entire write surface

`src/data/research-store.tsx`. One React context (`ResearchProvider`, mounted once in `App.tsx:35`) exposing **32 actions** and 12 state slices. Every action mutates `useState` synchronously and returns `void` (three return an id). **Nothing is persisted, nothing is validated, nothing is authorised, no action can fail.**

In production every one of these becomes a request that can be rejected, can conflict, and must be authorised against the caller's role.

### 1.1 Actions with **no caller at all** — 7 of 32

These are the most valuable rows in this document. Each was built for a real workflow whose UI was later removed, deferred, or never built. They are the natural **import/seed endpoints** and the write paths a real implementation will need first.

| Action | Signature | Built for | Why it has no caller |
|---|---|---|---|
| `addConsumer` | `(coachId: string, input: { patient?: Omit<PersonProfile,'relationship'>; carer: PersonProfile; sleepGoals: string; caregivingContext: string }) => void` | Adding a client **directly onto a named coach's caseload**, one step. Creates the dyad, seeds `sessionCompletion[id] = []`, `sessionPlans[id] = emptySessionPlan()`, and all 7 `moduleEngagement` rows `not-started`. | Superseded by the two-step researcher flow: `enrollConsumer` (no coach) then `transferDyad` (assign). Its manual "Add consumer" form was deleted in Round 11. **This is the one action that models "enrol and assign atomically" — likely what a real import needs.** |
| `updateSessionPlanRow` | `(dyadId: string, session: number, patch: Partial<SessionPlanRow>) => void` | **Rescheduling a single session** without touching the rest of the arc. Generates Zoom credentials the first time a row is dated, and sets `rescheduled: true` if the row already had a date. Never cascades. | Per-row inline editing was removed from the wizard (Round 14.4) once every date derived from two weekday answers; `EditSessionPlanModal` now writes the whole plan through `bulkSetSessionPlan`. **A real "move one session" endpoint should look exactly like this** — the whole-plan write is a much blunter instrument. |
| `addAdHocMeeting` | `(dyadId: string, meeting: { title: string; date: string; time: string }) => void` | A **one-off meeting outside the 7-session plan** — does not count toward completion and unlocks no module. Generates `id`, `meetingId`, `zoomLink`. | Its only trigger was the "Upcoming sessions" panel's Add control on the coach's Session Notes tab, removed in Round 36. Explicitly noted in-code as intentionally retained (`DeliveryConsumerDetailPage.tsx:446`): a data-layer capability with no current UI owner. **Ad-hoc meetings still render everywhere** — `MeetingsSection`, My schedule, the panel — so this is a read path with a severed write path. |
| `addManualRecording` | `(coachId: string, recording: SessionRecording) => void` | The researcher uploading a **COACH-pathway** session recording (group practice, placements) against a trainee, additive to `sessionRecordingsFor()`'s derived list. | The Session Recordings tab's Upload control was removed. |
| `addConsentDocument` | `(dyadId: string, filename: string) => void` | Attaching a consent form to a dyad after enrolment. Creates `{id: 'consent-'+Date.now(), filename, uploadedDate: TODAY}`. | The consent-document upload step was **removed from the enrolment wizard entirely in Round 28** — consent forms are no longer stored on the platform pending the REDCap-vs-platform decision. `enrollConsumer` still accepts `consentDocumentFilenames`, and seeded documents still render. |
| `removeConsentDocument` | `(dyadId: string, documentId: string) => void` | Removing a consent document. | Same removal. |
| `addDyadSessionRecording` | `(dyadId: string, recording: SpacesSessionRecording) => void` | Uploading a **SPACES delivery** session recording against a client dyad. | Its Upload control was removed with the shared recordings card. Seeded recordings still render on both the researcher and coach sides. |

**Pattern worth naming:** every one of these is a *write* path whose *read* path is still live. Five of the seven concern artefacts the study protocol actually requires — consent forms, session recordings, ad-hoc meetings. They are not dead code; they are unfinished features.

### 1.2 Actions the coach portal calls

| Action | Signature | What it does today | What it must do for real |
|---|---|---|---|
| `toggleSession` | `(dyadId, session: number) => void` | **Toggle** a session's completion. Adding stamps `completedDate: TODAY` + `completedTime: new Date()...` (§8). Removing deletes the record outright. Called from `SessionTracker`, the session-debrief flow (`DeliveryConsumerDetailPage.tsx:2543`), and `PlanSessionsModal` (which completes the Planning session the moment a plan is created). | Completing a session **unlocks a module for the client** — this is the single highest-consequence write in the portal. A toggle with no audit, no reason, and no un-unlock is wrong. Un-completing is a researcher-only override in the UI but is not enforced at this layer. |
| `bulkSetSessionPlan` | `(dyadId, rows: SessionPlanRow[]) => void` | Replaces all 7 rows. Generates Zoom creds for any newly-dated row; sets `rescheduled: true` where a date changed. | Needs optimistic-concurrency handling — the coach and the researcher can both open this plan. |
| `unlockModuleManually` | `(dyadId, moduleIndex: number) => void` | Appends an index to `manualModuleUnlocks[dyadId]`. | **An override of a protocol gate with no who/when/why.** Must become an auditable record. Called only from the researcher page today, but the capability is portal-agnostic. |
| `addSupervisionNote` | `(coachId, { title, date, time, notes, attachments: string[], dyadId?, session? }) => void` | Prepends a note. The coach portal always passes `attachments: []`, `date: TODAY`, `time: new Date()...`, `dyadId`, and **no `session`** (ad-hoc case notes only). | **Client case notes are clinical records.** Need immutable audit, authorisation, and real attachment storage. Note it cannot currently write `autoGenerated` — see §7. |
| `updateSupervisionNote` | `(noteId, patch: Partial<Pick<SupervisionNote,'title'\|'notes'\|'session'\|'date'\|'time'>>) => void` | Patches **by id**, deliberately, so an edit form cannot rewrite the note's `coachId`/`dyadId` scoping. The coach portal is the only caller. | Keep the by-id patch discipline. Add versioning — editing a clinical note should not silently destroy the prior text. |
| `submitPostPracticeAnnotation` | `(dyadId, components: ReflectionComponentAnswer[], shared: boolean, session?: number) => void` | Prepends an `AnnotationSummaryEntry`. `id = 'ann-'+Date.now()`, `date: TODAY`, `time: new Date()...`. | See §7 — the "AI-generated" summary is a deterministic local mapping. |
| `updateAnnotationSummary` | `(dyadId, entryId, patch: { components?, shared? }) => void` | Patches by id. Also used for share-toggle alone. | `shared` governs whether a supervisor can see a coach's private reflection. That is an access-control decision, not a boolean on a row. |
| `updateContact` | `(coachId, { email, phone }) => void` | Overwrites both fields on the coach record. Called from the coach's own My profile **and** two researcher pages. | Changing an account email is normally verification-gated. |
| `updateCoachNotificationPreferences` | `(coachId, prefs: { email, sms }) => void` | Overwrites. | Nothing sends anything (§9). |

### 1.3 Actions in the package but reached only from researcher/consumer surfaces

Listed because they define the data lifecycle the coach portal sits inside, and because a role model must cover them.

`addCoachTrainee(input: CoachTraineeInput) => string` · `withdrawCoach(coachId)` · `togglePhase(coachId, phase)` · `recordCertificationOutcome(coachId, 'pass'|'remediation-required')` · `inviteCoach(coachId)` · `updateDyadPerson(dyadId, 'patient'|'carer', patch)` · `updateDyadOverview(dyadId, patch)` · `updateDyadCoachNotes(dyadId, coachNotes)` · `transferDyad(dyadId, newCoachId)` · `addResearchNote(dyadId, note)` · `enrollConsumer(input) => string` · `addDiaryEntry(dyadId, 'patient'|'carer', entry)` · `updateResearcherContact` · `updateResearcherNotificationPreferences` · `updateDyadNotificationPreferences` · `setDyadOptOut(dyadId, reason)` · `setSearchQuery(q)`.

Three of these are worth flagging for the coach portal specifically:

- **`transferDyad`** reassigns a client to a different coach. The coach portal's own ownership check reads the **static seed**, not the store (§2.3), so a transfer does not take effect on the coach's access.
- **`togglePhase`** advances a trainee's COACH stage — the thing the trainee's whole Home page is *about*. There is no coach-side write path and no certification write path at all; the portal's trainee/coach split is a demo switch (§2.4).
- **`setDyadOptOut`** is a study withdrawal. It sets a permanent banner and removes Zoom access, and does nothing else — no data handling, no notification, no retention decision.

---

## 2. Authentication and authorisation

**There is none.** State this plainly to the study team.

### 2.1 The signed-in coach is a hardcoded string

`const COACH_ID = 'helen-zhang'` appears in **four files**:

- `pages/delivery/DeliveryHomePage.tsx:64`
- `pages/delivery/DeliveryConsumerDetailPage.tsx:61`
- `pages/delivery/DeliveryMeetingsPage.tsx:17`
- `pages/delivery/DeliveryAccountPage.tsx:12`

Plus `COACH_FIRST_NAME = 'Helen'` (`DeliveryHomePage.tsx:65`) and the literal string `accountLabel="Helen Zhang"` at three `DeliveryShell` call sites — **not** derived from `COACH_ID`.

**There is a second, independent identity source.** `data/portal.ts:40` exports a standalone `coach` object (`fullName`, `initials`, `organisation`, `participantId`, `trainingStage`, `email`). `AppHeader.tsx:84` uses it for `portal="training-v2"` surfaces, while `/delivery/*` uses `accountLabel`. The two are not kept in sync — `portal.ts` was a stale Round-1 placeholder for several rounds before being corrected by hand. **Delete one of them.**

### 2.2 Sign out does nothing

`data/auth.ts:11` — `signOutOfTraining()` calls `sessionStorage.removeItem('care2sleep.trainingAuth')`. **Nothing ever writes that key.** The header menu item (`AppHeader.tsx:167`) calls it and then `navigate('/')`. Net effect: a client-side route change. Every module-scoped store, the whole in-memory data store, and all `localStorage` module progress survive.

### 2.3 No route guards, and the one ownership check is wrong

`App.tsx` has **no wrapper** on any `/delivery/*` or `/training-v2/*` route. The mocked Okta gate was removed (`App.tsx:63`).

| Route | Component | Guard |
|---|---|---|
| `/delivery` | `DeliveryHomePage` | none |
| `/delivery/meetings` | `DeliveryMeetingsPage` | none |
| `/delivery/learning` | `DeliveryLearningHomePage` | none |
| `/delivery/notes` | `DeliveryNotesPage` | none |
| `/delivery/consumers/:dyadId` | `DeliveryConsumerDetailPage` | **in-component, see below** |
| `/delivery/account` | `DeliveryAccountPage` | none |
| `/training-v2/module/:moduleId/overview` | `ModuleOverviewPage` | none |
| `/training-v2/module/:moduleId/play` | `ModulePlayerPage` | none |

The single ownership check (`DeliveryConsumerDetailPage.tsx:2109`):

```ts
const ownDyad = dyadsForCoach(COACH_ID).find((d) => d.id === dyadId)
const dyad = ownDyad ? consumerDyads.find((d) => d.id === dyadId) ?? ownDyad : undefined
if (!dyad) return <Navigate to="/delivery" replace />
```

`dyadsForCoach` reads the **static seed array**, not the live store. So a dyad transferred away at runtime still passes, and a dyad assigned at runtime is refused. It is also client-side, which makes it a routing convenience, not access control.

### 2.4 The trainee/coach split is a demo switch

`data/coachStage.ts` holds `let stage: CoachStage = 'trainee'` in module scope, flipped by a visible `CoachStageSwitcher` control with **no authorisation whatsoever**. It resets to `trainee` on reload. It is documented in-code as *"a **demo affordance**, not a real account state"* and CLAUDE.md instructs deleting it once a real certification write path lands.

It also **contradicts the data**: `helen-zhang` has `currentPhase: 8`, `status: 'completed'`, `certification.outcome: 'pass'` — she is certified and delivering — yet the portal boots into the trainee dashboard.

Similarly, `TraineeHome`'s `activeStage` (`DeliveryHomePage.tsx:2111`) is page-level `useState(0)` — **which COACH stage the trainee is on is not read from any record.** Every banner, prompt and stage card on the trainee's Home switches off a number a reviewer clicks.

### 2.5 What the study team must supply

**The role and data-access matrix is not specified in this package and cannot be inferred from it.** CLAUDE.md documents a matrix that has no representation in code:

| Data | Coach sees | Research team | Expert assessor |
|---|---|---|---|
| Annotation summaries | own, always | yes | **endline only** |
| SIPTEA competency checklist | outcome only | full | full |
| Session recordings | **no** | yes | yes |
| Client Fitbit + sleep diary | assigned clients only | yes | **no** |

Nothing enforces any row of this. Concretely, the following need a decision from the study team before any implementation:

1. What roles exist as accounts? The study names a research coordinator, a supervisor, an expert assessor, a facilitator, coaches and consumers. **The expert assessor and facilitator are not yet identified**, and the assessor is described as having *no portal access at all* (the coordinator relays their decision via `recordCertificationOutcome`). Is that permanent?
2. Who may read a coach's **client case notes** (`SupervisionNote` with a `dyadId`)? A coach writes them; a supervisor presumably reads them; the matrix above does not cover them.
3. What does `AnnotationSummaryEntry.shared` actually grant, and to whom — the supervisor only, or the whole research team?
4. How is the endline-only rule for expert assessors expressed, given `AnnotationSummary.timepoint` is a plain field on an embedded array?
5. Does a coach retain access to a client's record after `transferDyad`, or after the client opts out?
6. Authentication method. The prototype twice built and twice removed a mocked Okta Verify flow. Monash SSO is the obvious candidate but is not decided.

---

## 3. Zoom

### 3.1 Meeting credentials are fabricated

`generateMeetingCreds()` (`research-store.tsx:231`) — the **only** generator:

```ts
const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9)
return {
  meetingId: `${suffix.slice(0,3)} ${suffix.slice(3,6)} ${suffix.slice(6)}`,
  zoomLink: `https://zoom.us/j/${suffix}`,
}
```

**⚠ MOCK.** No API call, no meeting created, no host, no passcode, no waiting room, no calendar invite. Called from `updateSessionPlanRow:577`, `bulkSetSessionPlan:603`, `addAdHocMeeting:631`.

Seeded links are hand-written and equally fake: `research.ts:483` (the one cohort group session), `research.ts:798`, `research.ts:1315`, `spaces.ts:1187`, and all six rows of `dyad-011`'s seeded plan (`spaces.ts:1208-1249`).

### 3.2 They render as real, clickable anchors

**Yes — this is the important part.** Two coach-portal surfaces render a live `<a href>` to a fabricated `zoom.us` URL that opens in a new tab:

- `components/shared/MeetingsSection.tsx:159` — "Start Session", `target="_blank" rel="noreferrer"`. On My schedule, **client rows suppress it** (`hideStart: true`, `DeliveryMeetingsPage.tsx:52,70`) — joining happens in the client record — but **trainee group-session rows do not**, so that link is live.
- `pages/delivery/DeliveryHomePage.tsx:2077` — "Join Zoom" on the meeting card, `href={next.zoomLink}`, live, pointing at `https://zoom.us/j/8392201567`.

`components/shared/UpcomingSessionsPanel.tsx:132` also renders one, **without `rel="noreferrer"`** (the other two have it). It is not currently mounted by any delivery page.

The client-record Join control (`DeliveryConsumerDetailPage.tsx:1713`) is deliberately a `<button>`, not a link — direct instruction, *"no need to open zoom tab, just show banner"*. Its `onJoin` handler (line 2484) only pushes into un-persisted local state. Its two other branches render focusable `aria-disabled` buttons with `sr-only` cues: *"(this session has already been held)"* and *"(no meeting link yet)"*.

### 3.3 What real Zoom integration must supply

Creating a meeting when a plan row is first dated (and updating it on reschedule, deleting it on removal); a host identity; participant admission; recording capture and the storage that `SpacesSessionRecording`/`SessionRecording` currently only hold metadata for; and attendance, which drives `GroupSessionAttendance` — today a hand-seeded boolean with no write path.

`InertButton` (`MeetingsSection.tsx:118`) marks the unwired controls: **Edit** and **Delete** on every meeting row, and **"Schedule new meeting"** (`DeliveryMeetingsPage.tsx:137`). All are focusable `aria-disabled` with an `sr-only` "(coming soon)" cue — a deliberate convention, not neglect. There is **no "Copy link" control anywhere** and no `navigator.clipboard` use in the tree.

---

## 4. Fitbit

**⚠ MOCK — there is no Fitbit integration of any kind.** No OAuth, no token, no fetch, no webhook, no scheduled job, no "sync now" control.

Every `HealthLogEntry.synced` value is authored:
- `healthLog()` (`spaces.ts:797`) — `const synced = allSynced || i % 3 !== 2`, a modulo pattern. When false, all five device fields are `undefined`.
- `withSyncGap(log, days, notes)` (`spaces.ts:828`) — forces the most recent *n* nights unsynced.
- Literal rows for `dyad-030` (`spaces.ts:1538`).
- **The only runtime write:** `addDiaryEntry` (`research-store.tsx:647`) appends `{date: TODAY, synced: false, diaryEntry}` if today has no row. That is the *consumer* portal's diary write, not a sync.

### 4.1 Two different sync-gap rules, and they disagree

| Rule | Where | Threshold |
|---|---|---|
| `hasRecentGap(log, failing)` → `dyadHealthAlerts(dyad)` | `pages/research/ConsumerDetailPage.tsx:113` / `:124` | last **two** entries both failing |
| inline check in `coachPriorities` | `pages/delivery/DeliveryHomePage.tsx:2417` | `logs.some(log => log[log.length-1]?.synced === false)` — the last **one** |

So a single missed night raises a "Fitbit not syncing" row on the coach's Home while the shared alert function stays silent. The in-code comment at `DeliveryHomePage.tsx:2416` claims the two "cannot disagree" because they read the same flag — **the flag is the same, the threshold is not.** This is exactly the two-surfaces-one-fact class this project keeps hitting; it should be one function.

### 4.2 What real integration must supply

Per-participant OAuth and token refresh; a nightly ingestion job; **provenance and revision handling** (Fitbit revises prior nights); a real definition of "not synced" that distinguishes device-not-worn from account-disconnected from job-failed; and a decision about what a coach may see and export (§6).

---

## 5. File upload — **the file is discarded**

There are exactly **two** `<input type="file">` elements in the entire tree, and **neither is reachable from the coach portal**:

1. `pages/research/SpacesCoachProfilePage.tsx:3157` (inside the shared `SupervisionRecords` form)
2. `pages/research/ConsumerDetailPage.tsx:3682` (researcher notes)

Both handlers are identical:

```tsx
onChange={(e) => setAttachments(e.target.files ? Array.from(e.target.files).map((f) => f.name) : [])}
```

**Only `file.name` survives.** The `File` object is dropped at the `.map`. There is no `FileReader`, no blob, no upload, no `accept` attribute, no size or type validation. `attachments: string[]` then flows into store state and renders as `attachments.join(', ')` and a count.

The coach portal's own note-writing path hardcodes `attachments: []` (`DeliveryConsumerDetailPage.tsx:583`) — no upload affordance at all.

**Consent documents have no file input either.** Filenames enter as plain strings via `enrollConsumer`'s `consentDocumentFilenames` or `addConsentDocument`, and the wizard's consent-upload step was removed entirely in Round 28.

**For real:** attachments on a clinical case note need object storage, per-file access control tied to the note's own authorisation, virus scanning, retention aligned with the consent, and a filename that is display metadata rather than the identity of the record.

---

## 6. CSV export — client-side, unlogged, and it exports identified health data

`src/lib/csv.ts` (14 lines):

```ts
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
const url = URL.createObjectURL(blob); const a = document.createElement('a')
a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
```

No server round-trip. `csvEscape` handles `"`, `,` and `\n` but **not the CSV-injection prefixes** `=`, `+`, `-`, `@` — and free-text diary entries and note bodies flow through it unescaped.

Two call sites are reachable from the coach portal, both via components imported from `ConsumerDetailPage.tsx`:

| Call site | Exports |
|---|---|
| `FitbitSyncMonitor.handleExport` (`ConsumerDetailPage.tsx:2962`) | A named client's full Fitbit sleep history. Filename includes `dyadTitle(dyad)` — i.e. the participants' names. |
| `SleepDiaryFeed` export (`ConsumerDetailPage.tsx:3334`) | A named client's full Consensus Sleep Diary. |

**⚠ In production this is a data-governance problem, not a feature.** A coach can put a named participant's complete sleep record on a local disk with no audit trail, no consent check and no watermark. Whether coaches may export at all is a study-team decision.

Two other client-side downloads exist, both `await fetch('/illustrations/certificate-earned.svg')` — a **fixed static SVG in this app's own `public/`**, not a generated certificate:

- `DeliveryAccountPage.tsx:168` → `care2sleep-certificate-${coach.participantId}.svg`
- `DeliveryHomePage.tsx:2119` → `care2sleep-certificate.svg` (no participant id)

Same asset, two filenames. **⚠ MOCK** — real certificate generation needs a server-rendered, verifiable document carrying the participant id, assessment date and issuing authority.

---

## 7. The "AI" annotation tool does not exist

The study's central reflective instrument is an **AI-guided conversation** producing a structured summary the coach reviews and approves.

What is built (`components/delivery/AddAnnotationSummaryModal.tsx`):
- Six fixed questions, one per SIPTEA component, hardcoded in `STEPS` (line 28) — **not in `data/`**, and not shared with any other surface.
- `buildReflectionComponents(answers)` (line 105) — *"a deterministic mapping over the 6 step answers, explicitly not a real Anthropic API call"*. It relabels each answer as `` `${letter}: ${label}` `` and substitutes `'(no response recorded)'` for a blank.
- A review screen, a share toggle, then `submitPostPracticeAnnotation`.

**⚠ MOCK.** There is no conversation, no generation, no summarisation, no model call. The wizard is a six-field form. Everything the study describes — the guided conversation, the generated summary, the coach's review-and-approve step as a distinct event — has to be built.

Note also that a coach's reflection is written **from a session debrief**, not at will (a direct project correction): the wizard is opened from the session-complete banner and carries the internal session number through as `session`. Preserve that coupling.

Related: `SupervisionNote.autoGenerated` marks a case note the platform drafted. The seed contains one such note (`sup-007`), but **no code path sets it** — `addSupervisionNote` is only ever called with coach-typed content. The auto-drafting of case notes from a session is entirely unbuilt.

---

## 8. The clock is frozen — and mixed with the real one

`data/format.ts:20` — `export const TODAY = '2026-07-22'`, a string constant. It is imported by ~16 modules and is what every seeded date is authored against.

**The real wall clock is also used, in the same records.** Every one of these pairs a frozen date with a live time:

| Site | Writes |
|---|---|
| `research-store.tsx:561` (`toggleSession`) | `completedDate: TODAY` + `completedTime: new Date().toTimeString().slice(0,5)` |
| `research-store.tsx:729` (`submitPostPracticeAnnotation`) | `date: TODAY` + `time: new Date()...` |
| `DeliveryConsumerDetailPage.tsx:579` (case note) | `date: TODAY` + `time: new Date()...` |

So a note written at 3pm on any real day is stamped `2026-07-22 15:00`.

`Date.now()` is additionally used as an **id generator** at eight places in the store (`coach-`, `dyad-`, `consent-`, `sup-`, `ann-`, `adhoc-`, and inside `generateMeetingCreds`). Not collision-safe, and it leaks a timestamp into every identifier.

**Two surfaces run on the real clock instead**, deliberately: `PlanSessionsModal.tsx:35` and `EditSessionPlanModal.tsx:18` both set `PLAN_ANCHOR = toLocalISODate(new Date())`, so their date pickers anchor to the actual today. The consequence is that a freshly-booked session lands weeks ahead of everything else, and `MeetingsSection`'s `isUpcoming` check (`row.date === TODAY || row.date === TOMORROW`, line 229) can never match it — it always falls into the "Scheduled" tab.

`DeliveryNotesPage.tsx` calls `new Date()` **twice** (line 46 for the displayed stamp, line 63 for the saved one), so the two can differ across a midnight boundary despite an in-code comment claiming they cannot.

**Moving to a real clock requires:** replacing `TODAY` at every import site; **re-anchoring the whole seed dataset relatively** (see `data-model.md` §7.2 D1 — two sessions are already marked complete with dates in the future because the frozen clock has drifted behind the fixtures); replacing `Date.now()` ids with server-issued ids; adding a timezone (the study runs in Australia, and weekly cadence arithmetic adds 7 days to a **date string**, which DST will break); and deciding whether `date`/`time` stay separate strings or become timestamps.

Date helpers to reuse rather than reimplement: `formatDate`, `formatDateLong`, `formatTime`, `formatSleepDuration`, and especially **`toLocalISODate(d)`** (`format.ts:82`) — `toISOString()` shifts the date by a day in timezones ahead of UTC, which has already caused a real bug here.

---

## 9. Notifications

**Nothing sends anything.** No email, no SMS, no push, no in-app persistence.

`Coach.notificationPreferences` and `ConsumerDyad.notificationPreferences` (`{email, sms}`) are stored and editable and have **no consumer**.

What the portal shows instead is derived, in-page, from live data:

- `coachPriorities(dyads, sessionPlans, sessionCompletion, coachRecord)` (`DeliveryHomePage.tsx:2365`) — four passes: newly-assigned client (within `NEW_ASSIGNMENT_DAYS = 14` of `TODAY`), upcoming planned session, the coach's own supervision session, and the Fitbit gap (§4.1). Rendered by `components/delivery/PrioritiesSection.tsx`.
- Dismissals live in `useState<Set<string>>` (`PrioritiesSection.tsx:69`). **Not persisted** — navigating away and back restores every dismissed row.

`components/delivery/NotificationHub.tsx` is **dead for the coach portal**: its `NotificationHub` wrapper and `buildNotifications` have zero call sites, and only the researcher's hub imports `NotificationHubView`. Its `buildNotifications` (line 123) is nonetheless a useful spec of the intended notice set: sync-gap alerts → reflection-ready (session 1 held, no reflection) → today's Zoom → no session plan.

**For real:** a notification service with a per-user delivery log, honouring the stored preferences, plus persisted read/dismiss state. Note that some of these notices concern participant health data and must not be delivered in a message body.

---

## 10. Persistence — `localStorage` / `sessionStorage`

Complete inventory of the whole tree.

| Key | Module | Value | Purpose |
|---|---|---|---|
| `training-v2:module-progress:${moduleId}` | `pages/training-v2/moduleProgressStore.ts:14` | stringified integer step index | **The only real progress persistence in the package.** Monotonic — `setModuleStepIndex` only writes when `index > current` (line 58). `localStorage` deliberately, so progress survives a closed tab. |
| `c2s-delivery-nav-collapsed` | `components/delivery/DeliverySidebar.tsx:55` | `'1'`/`'0'` | Sidebar collapse. |
| `c2s-research-nav-collapsed` | `components/research/ResearchSidebar.tsx:55` | `'1'`/`'0'` | Sidebar collapse. |
| `c2s-consumer-nav-collapsed` | `components/consumer/ConsumerSidebar.tsx:21` | `'1'`/`'0'` | Sidebar collapse. |
| `care2sleep.trainingAuth` | `data/auth.ts:9` (**sessionStorage**) | — | **Never written.** Only removed, by the inert Sign out (§2.2). |

`getModuleStepIndex` has **no `try`/`catch`** — a `localStorage` throw (Safari private browsing, storage disabled) propagates out of `ModuleOverviewPage.tsx:11` and `ModulePlayerPage.tsx:9` and crashes both routes.

### 10.1 Module-scoped state that is deliberately *not* persisted

Each of these resets on hard refresh but survives in-app navigation — a deliberate pattern, because *"every page under a portal mounts its own shell, so a flag stored there resets the moment the user navigates"*.

| State | Module | Note |
|---|---|---|
| `stage: CoachStage` | `data/coachStage.ts:26` | The trainee/coach demo switch (§2.4). |
| `notes: CoachNote[]` | `data/coachNotes.ts:38` | **The trainee's entire "My Notes" notebook.** Three seeds; `addCoachNote`/`deleteCoachNote` mutate a module variable. A coach's notes are lost on refresh. This is the clearest example of a real feature with a placeholder persistence tier. |
| tour `active`/`index`/`steps` | `data/deliveryTour.ts:202` | First-run coachmark tour. |
| `onboardingDismissed` | `components/delivery/DeliveryShell.tsx:28` | So the welcome flow replays on every load. |
| `startedThisSession: Set<string>` | `moduleProgressStore.ts:44` | Deliberately *not* `localStorage` — see `data-model.md` §6.3. |
| `attendedSessions` | `DeliveryConsumerDetailPage.tsx` | The "Join" button's only effect. |
| priorities/notification dismissals | `PrioritiesSection.tsx:69` | §9. |
| **the entire data store** | `research-store.tsx` | Plain `useState`. |

**A real per-user persistence layer replaces all of the above**, and the split matters: sidebar collapse is a client preference and can stay local; module progress, notes, tour completion and onboarding state are **per-user server records** (a coach who switches device must not restart their training).

There is one architectural note worth carrying forward: `format.ts` and `research-context.ts` exist as separate modules **specifically** so `research-store.tsx` exports only a component. Mixing component and non-component exports defeats React Fast Refresh, and the resulting silent remount was wiping all in-memory state mid-session. Keep that boundary.

---

## 11. Other outbound calls

Complete, for the whole tree:

| Site | Call |
|---|---|
| `DeliveryAccountPage.tsx:168`, `DeliveryHomePage.tsx:2119` | `fetch('/illustrations/certificate-earned.svg')` — same-origin static asset |
| `DeliveryHomePage.tsx:2077`, `MeetingsSection.tsx:159`, `UpcomingSessionsPanel.tsx:132` | `<a href={zoomLink} target="_blank">` (§3.2) |

**Zero** occurrences of: `XMLHttpRequest`, `WebSocket`, `EventSource`, `axios`, `mailto:`, `tel:`, `window.open`, `navigator.clipboard`, `navigator.sendBeacon`, service workers, analytics, error reporting.

`components/delivery/WidgetGrid.tsx:47` references `/logos/zoom.png`, a local asset; that grid was removed from both Home pages.

---

## 12. Content that is a placeholder, not a spec

Flagged because an engineer will otherwise treat rendered content as delivered scope.

| Thing | State |
|---|---|
| **Module content** | Authored for **exactly one** of eleven modules (`understanding-sleep`). Every other module's overview and player degrade to a "coming soon" message. |
| **Videos** | **None exist.** `VideoPlaceholder.tsx` renders a gradient thumbnail and simulates a watch-through with `Date.now()` (lines 69, 71). The `covers` and `dramatizedScene` fields are production briefs for a future shoot and are deliberately rendered nowhere. |
| **`DEMO_PLAYER_REDIRECTS`** | `pathway.ts` points module 2 at module 5's content so the click-through can be exercised. A known, accepted content mismatch. **Remove it.** |
| **Module durations** | All 11 modules are `estimatedMinutes: 35`; chapter durations in `moduleOverviewContent.ts` are round numbers, explicitly "made up for this round". |
| **Knowledge-check answers** | The player stores **nothing** — not the coach's selections, not their free-response text, not the module feedback rating/comment. `ModuleRecord` has fields for all of it and no write path. |
| **Module covers** | Generated gradients (`moduleArt()`), not artwork. |
| **`~2 hrs` / `Day 12`** on trainee Home | Frame values. No per-module duration or enrolment-derived day counter exists on a coach record. |
| **"Know more" / "Learn more"** | Unwired `aria-disabled` controls awaiting a destination. |
| **`researchNotes`** | Seeded empty. |
| **Certificate** | A fixed SVG (§6). |

---

## 13. Priority order for a real implementation

1. **Identity, roles and the data-access matrix** (§2.5). Everything else is gated on it, and the answers must come from the study team, not engineering.
2. **A single per-user module-progress record** (`data-model.md` §6.3) — today three unconnected models disagree on screen.
3. **Session completion as an audited event**, not a toggle (§1.2) — it unlocks content for a participant.
4. **Zoom** (§3): fabricated links currently render as live anchors.
5. **Persistence for the seven no-caller actions** (§1.1) — consent, recordings and ad-hoc meetings all have live read paths and severed writes.
6. **The clock and the seed re-anchor** (§8) — already producing impossible records.
7. **Fitbit** (§4), including one sync-gap rule instead of two.
8. **The AI annotation tool** (§7) — the study's central reflective instrument is currently a six-field form.
9. **Attachments and CSV export** (§5, §6) — both are governance problems before they are engineering ones.
