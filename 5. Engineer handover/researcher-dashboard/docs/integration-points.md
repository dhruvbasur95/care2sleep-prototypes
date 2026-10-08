# Integration points

Every seam in the Research Dashboard where a real backend or third-party service
attaches. For each: the exact file and function, what it does today, the data
shape it produces or consumes, and what a real implementation has to satisfy.

Read `engineering-overview.md` first for the architecture and the traps, and
`data-model.md` for the entity relationships, full type definitions and
invariants that the shapes below are drawn from.

**The starting position, stated plainly:** this package makes **zero network
calls**. `grep -rn "fetch(\|axios\|XMLHttpRequest\|WebSocket" src` returns
nothing. Every integration below is currently either a pure in-memory function,
a fabricated value, or a control that does nothing.

## Contents

1. [The store — all mutation actions](#1-the-store--all-mutation-actions)
2. [Authentication and identity](#2-authentication-and-identity)
3. [REDCap consumer sync](#3-redcap-consumer-sync)
4. [Fitbit sleep data](#4-fitbit-sleep-data)
5. [Zoom session links and recordings](#5-zoom-session-links-and-recordings)
6. [File upload and attachments](#6-file-upload-and-attachments)
7. [CSV export](#7-csv-export)
8. [Notification delivery](#8-notification-delivery)
9. [The clock](#9-the-clock)
10. [Summary: seam to owner](#10-summary-seam-to-owner)

---

## 1. The store — all mutation actions

**File:** `src/data/research-store.tsx`
**Contract:** the `ResearchStore` interface (line ~123)
**Accessor:** `useResearch()` from `src/data/research-context.ts`

Every mutation in the app goes through one of the actions below. There is no
other write path. This list is the closest thing the package has to an API
specification — with one critical caveat.

### Caveat: a third of this surface has no caller

**The presence of an action does not mean the feature exists.** Verified by grep
across `src/`, excluding comment-only mentions:

| Action | Callers | Note |
|---|---|---|
| `enrollConsumer` | **none** | The REDCap target. See section 3. |
| `addConsumer` | **none** | Create-with-coach variant of the same thing. |
| `updateDyadOverview` | **none** | Editable sleep-goals / caregiving / intake notes. |
| `updateSessionPlanRow` | **none** | Per-row plan edits. Also disagrees with `bulkSetSessionPlan` on `rescheduled` semantics — see below. |
| `addConsentDocument` | **none** | Consent forms are no longer stored on the platform. |
| `removeConsentDocument` | **none** | Same. |
| `addManualRecording` | **none** | Recording upload. The `manualRecordings` slice is neither written nor read. |
| `bulkSetSessionPlan` | 2 files, **both unmountable** | Only `PlanSessionsModal` / `EditSessionPlanModal`, which have no mount point. |
| `toggleSession` | 1 file, **unmountable** | Only `PlanSessionsModal`. |
| `manualModuleUnlocks` | read by 2, **written by none** | Effectively read-only state. |

Treat these as **specification of intent**, not as live endpoints. Deleting them
is a product call, not cleanup; each encodes a real requirement. Equally, do not
wire a new caller without confirming the flow it belongs to is coming back.

### Actions that genuinely run today

Grouped by domain. "Writes" describes the in-memory effect a backend must
reproduce.

#### Coach trainees (the COACH pathway)

| Action | Signature | Writes |
|---|---|---|
| `addCoachTrainee` | `(input: CoachTraineeInput) => string` | Appends a `Coach` built by `coachFromTraineeInput()`: `status: 'enrolled'`, `inviteStatus: 'pending'`, `currentPhase: 2`, `enrolmentDate: TODAY`, empty module records. Mints `participantId` via `nextParticipantId(coaches)`. Seeds `phaseCompletion[id]` — **but not `phaseCompletionDates[id]`**, an unintended asymmetry. Returns the new id. |
| `withdrawCoach` | `(coachId) => void` | Soft: `status: 'withdrawn'` plus a `withdrawalNote` string. Record retained per consent. |
| `updateContact` | `(coachId, { email, phone })` | Those two fields. |
| `togglePhase` | `(coachId, phase)` | Adds/removes the stage number in `phaseCompletion`, and stamps or clears `phaseCompletionDates[coachId][phase] = TODAY`. **Never writes back to `Coach.currentPhase`** — the two representations can diverge. |
| `recordCertificationOutcome` | `(coachId, 'pass' \| 'remediation-required')` | `certification.outcome`, `assessedDate: TODAY`, and a `note` on remediation. **Does not** advance `currentPhase` or set `status: 'completed'`, though the fixtures pair a pass with both. Decide whether it should. |
| `updateCoachNotificationPreferences` | `(coachId, prefs)` | `Coach.notificationPreferences`. |

**`addCoachTrainee` is the one genuinely complete create path in the package —
and it dead-ends.** No invitation is sent, and **nothing can move `inviteStatus`
from `pending` to `active`**. Consequences: four of the five trainee-record tabs
render a "not available yet" empty state, the pending banner never clears,
`lastActive` stays unset so the roster reads "Never", and the notification hub
starts nagging about the unsent invite after 21 days with no action that
resolves it.

**A real implementation must add:** an invitation email on create, and an
accept-invite endpoint that writes `inviteStatus: 'active'` and `lastActive`.

#### SPACES delivery

| Action | Signature | Writes |
|---|---|---|
| `inviteCoach` | `(coachId) => void` | Appends a `SpacesCoach` row `{ id: 'spaces-<coachId>', coachId, invitationStatus: 'invited', joinedStatus: 'not-joined', invitedDate: TODAY }`. Idempotent by `coachId`. |
| `transferDyad` | `(dyadId, newCoachId)` | Sets `dyad.coachId` **only**. Serves both first assignment and transfer. **Does not touch `coachAssignedDate`**, so a transferred dyad keeps the date it was first assigned while several surfaces render that as "coach assigned on". |
| `updateDyadPerson` | `(dyadId, 'patient' \| 'carer', patch)` | One dyad member's profile fields. `'patient'` is the PLE. |
| `updateDyadCoachNotes` | `(dyadId, coachNotes)` | `coachNotes` only, never `notes` — separate fields with separate owners. Conflating them silently destroys the coordinator's intake notes. |
| `updateDyadNotificationPreferences` | `(dyadId, prefs)` | Dyad preferences. |
| `setDyadOptOut` | `(dyadId, reason)` | `optedOut: { reason, date: TODAY }`. One-way; there is no un-opt-out. |
| `addSupervisionNote` | `(coachId, { title, date, time, notes, attachments, dyadId? })` | Prepends a `SupervisionNote`. `coachId` required. |
| `addResearchNote` | `(dyadId, { title, date, time, notes, attachments })` | Prepends a `ResearchNote`. `dyadId` required, no coach. Deliberately a separate type so a researcher can note a dyad that has no coach. |

**Neither note action records an author id.** For a study audit trail that is a
real gap, not a nicety — see section 2.

**`inviteCoach` writes state nothing displays.** `invitationStatus` and
`joinedStatus` are written on every onboarding; no surface in this package
renders either. Onboarding therefore appears instantaneous even though the model
distinguishes invited from joined. Decide whether that distinction survives into
the real system.

#### Researcher profile

| Action | Signature | Writes |
|---|---|---|
| `updateResearcherContact` | `({ email, phone })` | `researcherProfile`. |
| `updateResearcherNotificationPreferences` | `(prefs)` | `researcherProfile.notificationPreferences`. |

### Rules a backend must preserve

- **Nothing is ever deleted.** Withdrawal, opt-out and transfer are all soft.
  There is no un-invite, no un-enrol, no delete-dyad, no delete-note, no
  un-unlock. Preserve this — it is a research-records requirement, not an
  oversight.
- **Every write is stamped from `TODAY`**, the frozen clock — except
  `toggleSession`'s `completedTime`, which reads the real machine clock. One
  record can carry two notions of "now". Pick one before wiring anything.
- **Ids are minted from `Date.now()`** (`coach-${Date.now()}`,
  `dyad-${Date.now()}`, and the meeting-credential suffix). Two records created
  in the same millisecond collide. Let the server assign ids.
- **`updateSessionPlanRow` contradicts its own contract.** It computes
  `alreadySet = !!row?.date` and then sets `rescheduled: true` for *any* patch,
  so editing only `moduleTargetDate`, or re-saving an identical date, falsely
  flags the session as rescheduled. `bulkSetSessionPlan` implements it correctly
  by comparing `prevRow.date !== r.date`. Latent only because the row action has
  no caller. Better still: derive "rescheduled" server-side from an audit trail
  rather than storing a boolean two code paths can disagree about.
- **The `value` memo dependency array must list every state value and every
  action.** Omitting one hands consumers a stale closure that appears to work
  until an unrelated re-render papers over it.

---

## 2. Authentication and identity

**There is no authentication anywhere in this package.** No login, no session,
no user id, no route guard, no token.

### The identity seam

**File:** `src/data/research.ts` (line ~1655)

```ts
export const researcher = {
  fullName: 'Claire Donnelly',
  initials: 'CD',
  role: 'Research coordinator',
  organisation: 'Monash University',
  email: 'c.donnelly@monash.example.edu',
  phone: '0400 221 987',
  notificationPreferences: { email: true, sms: false },
}
```

A hardcoded object literal. `ResearchProvider` seeds `researcherProfile` from
it, and `AppHeader` reads `researcher.fullName` directly. Every "you" / "your"
surface in the app resolves to this literal.

**A real implementation must supply:** an authenticated user with a stable id,
a display name, a role, and an organisation — and every write must record that
id as its author. `addResearchNote` and `addSupervisionNote` currently record
none, which a study audit trail requires.

### Sign out

**File:** `src/components/AppHeader.tsx` (line ~96)

Deliberately inert: `aria-disabled="true"`, `closeOnClick={false}`, no handler,
`sr-only " (coming soon)"`. It previously navigated to `/`, which redirects
straight back to Home, so pressing it visibly did nothing. It now honestly does
nothing rather than miming success.

**A real implementation must:** terminate the session, clear any client state,
and redirect to a real logged-out destination — which does not exist in this
package.

### Password change

**File:** `src/components/account/PasswordChangeCard.tsx` (line ~99)

```tsx
onSubmit={(e) => {
  e.preventDefault()
  setSent(true)
}}
```

No password is checked — there is none — and no email is sent. The card then
displays "We've sent a link to {email}". Together with the inert sign out, the
entire identity surface of My Profile is presentational.

**Keep the shape when wiring it up:** never set a new password inline. Confirm
identity with the current password, then send a reset link so the change happens
over a verified channel. The three-state (idle / open / sent) structure and its
two focus effects are correct and worth preserving — the card swaps its whole
content between states, and without the effects focus falls to `<body>`.

### Client-side persistence

The only thing written to disk is the sidebar collapsed flag:

**File:** `src/components/research/ResearchSidebar.tsx` (line ~53)
**Key:** `c2s-research-nav-collapsed`, values `'1'` / `'0'`

Unnamespaced by user or environment. Namespace it per user when real auth lands.

---

## 3. REDCap consumer sync

**This is the blocking gap: there is currently no working way to add a consumer
to the study.**

The in-app enrolment wizard was removed from this package, and its replacement
is an inert button. There is no REDCap client anywhere in `src/`.

### The control

**File:** `src/pages/research/ConsumerManagementPage.tsx` (line ~252)

A `Sync with REDCap` hero CTA rendered through `InertButton` with
`appearance="active"` — visually indistinguishable from a live control, with an
`sr-only " (coming soon)"` cue as the only signal. The hero subtitle already
promises "Sync consumers from REDCap", and Home's `Sync consumers` quick action
links here on that promise.

### The call target

**File:** `src/data/research-store.tsx` — `enrollConsumer` (line ~541)

Zero callers today. It already builds a complete `ConsumerDyad` from a plain
input object, which makes it the right shape for an importer to call **once per
synced record**.

```ts
enrollConsumer(input: {
  patient?: Omit<PersonProfile, 'relationship'>   // the PLE; omit for carer-only
  carer: PersonProfile
  sleepGoals: string
  caregivingContext: string
  notes?: string
  consentDocumentFilenames?: string[]
}): string   // returns the new dyad id
```

`PersonProfile` is `{ name, age, relationship?, background, email?, phone? }`.

What it seeds, which a real importer must reproduce:

- `id: 'dyad-<Date.now()>'` — replace with a server id
- `sessionsCompleted: []`, `annotationSummaries: []`, `sessionRecordings: []`
- `patientLog: []`, `carerLog: []` — the Fitbit arrays, see section 4
- `moduleEngagement` — one `not-started` record per entry in `CONSUMER_MODULES`
  (**7 records**: index 0 is the always-unlocked "Getting started" pre-module,
  1–6 are the named modules)
- `consentDocuments` — filename plus `uploadedDate: TODAY`; no file is stored
- Store slices: `sessionCompletion[id] = []` and
  `sessionPlans[id] = emptySessionPlan()` (7 undated rows)

**A real implementation must satisfy:**

- Idempotency per REDCap record — a re-sync must update, not duplicate.
- A stable external identifier mapping REDCap record to dyad id. There is no
  such field on `ConsumerDyad` today; one must be added.
- The dyad arrives **unassigned** (`coachId` undefined). Assignment is a
  separate researcher action via `transferDyad`.
- Note the model supports **carer-only** consumers (`patient` omitted) and every
  layout guards for it, but no seeded dyad currently exercises that case.
- Restoring a platform-side enrolment flow means **rebuilding the wizard**, not
  re-pointing a trigger — the component is not in this package.

Related and currently orphaned: `addConsentDocument` / `removeConsentDocument`
exist but have no callers, and `ConsumerDyad.consentDocuments` is read for dates
only. Consent evidence is display-only. Decide explicitly whether consent
documents live on this platform or in REDCap.

---

## 4. Fitbit sleep data

**There is no Fitbit client anywhere in this package.** All sleep data is seeded
arrays.

### The data boundary

**File:** `src/data/spaces.ts` (line ~482)

`ConsumerDyad.patientLog` and `ConsumerDyad.carerLog`, both
`HealthLogEntry[]` — one entry per person per night. **This array is what a
nightly sync job populates.**

```ts
interface HealthLogEntry {
  date: string          // 'YYYY-MM-DD'
  synced: boolean       // did the device report; gates the five fields below
  remPercent?: number   // % of total sleep time
  deepPercent?: number  // the three percentages sum to ~100
  lightPercent?: number
  durationMin?: number
  disturbances?: number
  diaryEntry?: string          // carer free-text note; independent of `synced`
  diary?: SleepDiaryAnswers    // Consensus Sleep Diary Q1-9
}
```

Rules the seed obeys and a sync job must too:

- `synced === false` implies the five Fitbit fields are **absent**, not zero.
- `diaryEntry` and `diary` are **independent of `synced`** — the diary is
  self-reported, the Fitbit fields are device-reported.
- Logs are date-ascending with unique dates.
- `patientLog` is present if and only if `patient` (the PLE) is.

### The sleep diary is partly derived, never stored

**Function:** `computeSleepDiary()` in `src/data/spaces.ts`

The Consensus Sleep Diary has 13 questions. Only **Q1–9 are stored**
(`SleepDiaryAnswers`). **Q10–13 are always derived at render**
(`SleepDiaryComputed`: `minutesAwakeInBed`, `sleepOpportunityMin`,
`totalSleepTimeMin`, `sleepEfficiencyPercent`) and never persisted. Preserve
that — storing them creates a second source of truth that can disagree with its
own inputs.

Note also that diary times are free-form `"10:00 pm"` strings parsed by
`parseTimeToMinutes`, whereas every other time in the schema is 24-hour
`"HH:MM"`. **Two time formats coexist in one schema.** Check which one a field
uses before comparing.

`computeSleepDiary` has **no validation**: an inconsistent bedtime / out-of-bed
pair yields a negative `totalSleepTimeMin` and a nonsensical efficiency
percentage rather than an error. Add assertions
(`sleepOpportunityMin > 0`, `0 <= sleepEfficiencyPercent <= 100`).

### The sync-gap rule — reimplement, do not port

**File:** `src/pages/research/ConsumerDetailPage.tsx` (lines ~166 and ~186)

`dyadHealthAlerts(dyad)` is **the single source of truth for every Fitbit and
diary gap alert in the app**. `components/research/ResearchNotificationHub.tsx`
imports it from here — the one component-imports-a-page dependency in the
package. It is safe (the function is pure) and deliberate (duplicating gap
detection is how two surfaces start disagreeing), but the right home is
`data/spaces.ts`.

**The implementation does not match the rule it claims.** It is documented as
">48 hours without data", but:

```ts
export function hasRecentGap(log, failing) {
  if (log.length < 2) return false
  return log.slice(-2).every(failing)
}
```

It tests the **last two array entries**, with no reference to their dates or to
today. Two consequences a backend must fix rather than reproduce:

1. If a log simply stops (device returned, participant withdrew), the last two
   entries may both be `synced: true` and **no alert fires** — exactly the case
   the check exists for.
2. It cannot distinguish a gap two days ago from one two months ago.

Reimplement as a real date difference against the current date. Both dyad
members are checked independently, and must stay that way — a carer not syncing
and the PLE not syncing are different findings.

One related open item: the consumer record passes `showAlerts={false}` to the
sync monitor on the justification that a page-level banner shows the same
signal, but that banner was removed. **Neither surface currently renders the
alert on that page.** That is a product call, not a mechanical fix.

---

## 5. Zoom session links and recordings

### Meeting credentials are fabricated

**File:** `src/data/research-store.tsx` (line ~273)

```ts
function generateMeetingCreds(): { meetingId: string; zoomLink: string } {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9)
  return {
    meetingId: `${suffix.slice(0, 3)} ${suffix.slice(3, 6)} ${suffix.slice(6)}`,
    zoomLink: `https://zoom.us/j/${suffix}`,
  }
}
```

**This one function is the entire meeting integration.** Replace it with a real
Meetings API call and the whole app gets real meetings. It is called from
`updateSessionPlanRow` and `bulkSetSessionPlan` whenever a plan row first gets a
date; the fixtures in `research.ts` and `spaces.ts` carry the same fabricated
shape.

**Warning worth repeating to anyone demoing this:** these render as genuine
`<a href target="_blank">` anchors to `zoom.us`
(`MeetingsSection.tsx` line ~101). Clicking one reaches a 404 or an unrelated
stranger's meeting. They are not inert placeholders.

**A real implementation must supply:** create / update / delete on a meeting
provider, returning at minimum a join URL and a meeting id, plus a store slice
for researcher-created meetings — which **does not exist today**.

### The scheduling controls are inert

Four controls wait on this integration, all via
`components/shared/InertButton.tsx`:

| Control | File | Note |
|---|---|---|
| `Schedule session` | `MeetingsSection` header | Needs a create-meeting write path plus a store slice that does not exist. |
| `Schedule meeting` | `ResearchHomePage` quick bar | **The same unbuilt feature.** Two entry points, one flow — wire them together or one will be forgotten. |
| `Edit` (per row) | `MeetingsSection` | See the two-targets warning below. |
| `Delete` (per row) | `MeetingsSection` | Same. |

**The two row kinds have different write targets and one handler cannot serve
both:**

- **Group-practice rows** come off `upcomingGroupSessions` — **cohort-wide**, so
  one edit affects every attendee in that cohort.
- **Placement and supervision rows** come off `coach.upcomingSession` — a single
  person.

### Session recordings: a derivation with no feature behind it

**File:** `src/data/research.ts` — `sessionRecordingsFor(coach)` (with
`historicalOr()` and `daysBefore()`)

A complete derivation of a coach's recordings across the COACH stages, including
a real edge-case guard that keeps a certified coach's recording dates behind
their own assessment date. **It has zero callers** — the Session Recordings tab
was not shipped. The `manualRecordings` store slice and `addManualRecording`
exist to supplement it and are likewise unwired and unread.

It is retained because session recordings are a stated research-data
requirement. **But the derivation existing is not the feature existing:** there
is no storage, no upload, no playback path, and no recording artifact anywhere
in the data model — only metadata (`id`, `phase`, `title`, `date`, `time`,
`durationMin`, `source`, `participants`).

Note there are **two** recording types for different things:
`SessionRecording` (coach, COACH-phase-scoped, **derived**) and
`SpacesSessionRecording` (dyad, SPACES-session-scoped, **stored**). Do not
collapse them without deciding which semantics you want.

**Confirm before building:** is recording capture, storage and playback in scope
for the backend at all? Researchers explicitly do **not** have access to a
coach's session recordings for coach-consumer delivery, so the access model
matters as much as the storage.

---

## 6. File upload and attachments

**No file is ever uploaded or stored. Only the filename survives.**

### The two upload sites

| File | Line | Context |
|---|---|---|
| `src/pages/research/SpacesCoachProfilePage.tsx` | ~2070 | `SupervisionRecords` — the "Attach File" control on the shared note form, used by supervision notes on two pages. |
| `src/pages/research/ConsumerDetailPage.tsx` | ~3129 | The consumer record's research-notes form. |

Both do the same thing:

```tsx
onChange={(e) =>
  setAttachments(e.target.files ? Array.from(e.target.files).map((f) => f.name) : [])
}
```

The `File` object is read and **discarded**. `attachments: string[]` — filenames
only — is what reaches `addSupervisionNote` / `addResearchNote`.

**Why this matters more than most stubs:** the UI then lists the filename, which
reads exactly like a successful upload. A researcher would reasonably believe a
supervision-note attachment is stored. It is not, and there is no error, no
pending state, and no way to tell from the interface.

**A real implementation must supply:** object storage with per-file ids, upload
progress and failure states, virus scanning, access control appropriate to
research records, and a retention policy. Change `attachments: string[]` to a
real reference type (id, filename, size, content type, uploaded-by, uploaded-at)
at the same time.

### Consent documents

`ConsumerDyad.consentDocuments` (`{ id, filename, uploadedDate }`) has the same
filename-only shape. Its add/remove UI is gone and both store actions are
orphaned, so existing documents are **display-only** — read for dates in three
places. Decide whether consent evidence lives here or in REDCap (section 3).

---

## 7. CSV export

**File:** `src/lib/csv.ts`

```ts
export function downloadCsv(filename: string, rows: string[][])
```

Fully client-side: joins rows with proper quote escaping
(`/[",\n]/` triggers quoting, `"` doubles), wraps in a `Blob`, and triggers an
anchor download via `URL.createObjectURL`. No server involvement. It works
today and needs no backend to keep working.

Three call sites, all on the consumer record
(`src/pages/research/ConsumerDetailPage.tsx`):

| Line | Export | Filename pattern |
|---|---|---|
| ~2008 | Study log | `<dyad>-study-log.csv` |
| ~2643 | Fitbit sleep data | `<dyad>-fitbit-sleep-data-<view>.csv` |
| ~2859 | Sleep diary, one date | `<dyad>-sleep-diary-<date>.csv` |

**Considerations for production, none of which are bugs today:**

- Export is **unaudited**. Participant health data leaves the browser with no
  record of who exported what, when. For a research platform that is likely a
  governance requirement — it probably needs to become a server-side, logged
  operation.
- No BOM is emitted, so Excel may mis-detect UTF-8 on some platforms.
- Large exports build the entire string in memory; fine at current data volumes.
- Row content is assembled per call site rather than from a shared column
  definition, so an exported column set can drift from the rendered table.

---

## 8. Notification delivery

**No notification is ever sent by this app, through any channel.**

### Preferences are recorded intent only

**File:** `src/components/account/NotificationPreferencesCard.tsx`

Email/SMS opt-ins, persisted through the store via
`updateResearcherNotificationPreferences`, and mirrored per coach
(`updateCoachNotificationPreferences`) and per dyad
(`updateDyadNotificationPreferences`). The shape is
`NotificationPreferences { email: boolean; sms: boolean }`.

Saving updates the store and **nothing else**. There is no delivery mechanism
behind either channel.

Note this interface is **declared twice, identically** — in `research.ts` and
`spaces.ts` — and imported separately. Structural typing means nothing errors,
so a change to one copy stays invisible. Collapse to one definition.

### The in-app hub has no read state

**File:** `src/components/shared/NotificationHubView.tsx`, driven by
`src/components/research/ResearchNotificationHub.tsx`

The hub is genuinely data-driven — it derives notices from the real fixture set
(consumers with no coach, long-pending invites, missing session plans, Fitbit
and diary sync gaps). But **dismissal is component-local `useState`**. Dismissed
notices reappear on any navigation or reload, and "Dismiss all" is purely
visual. A real researcher will read that as a bug.

Four further controls are inert pending a per-user read-state store:
`Mark all as read` and a per-row overflow menu, on **both** the trainee record
and the consumer record. "Read" is not a state anything here persists, and the
overflow menu has no items designed at all.

**Wire both Key-updates panels together.** They are copy-paste markup, not a
shared component — wiring one and not the other is a live risk.

### Thresholds are study protocol living in components

`PENDING_INVITE_ALERT_DAYS = 21` (`ResearchNotificationHub.tsx`),
`CERTIFIED_WINDOW_DAYS = 60` (`RosterPage.tsx`), `WEEK_DAYS = 7` and
`GROUP_PHASE = 4` (`ResearchHomePage.tsx`), the 48-hour sync-gap rule
(`ConsumerDetailPage.tsx`), and `GRADUATED_PHASE = 8` — **declared twice, in
`ResearchHomePage.tsx` and `RosterPage.tsx`**.

That last one is the live risk: a KPI tile and the roster beneath it derive from
separate copies of one rule, so a change to one silently makes the tile
contradict the table. De-duplicate it immediately; move the rest into a single
`config/protocol.ts` where the study team can see them.

### One dead-end CTA to fix while you are here

The hub's highest-severity notice — "*consumer* still has no coach assigned" —
renders an `Assign a coach` button linking to the consumer record. **That page
has no coach-assignment control of any kind.** The only working path is the
coach record's Assigned Consumers tab, which calls `transferDyad`. Because this
is a live link rather than an inert button, it gives no cue that it cannot
complete the task it names.

---

## 9. The clock

**File:** `src/data/format.ts`

```ts
export const TODAY = '2026-07-22'
```

Not a formatting detail — it is the app's definition of "now", and it is the
single injection point for a real clock.

It drives: the Upcoming (today + tomorrow) vs Scheduled split on Home,
"sessions this week", pending-invite ageing, the "certified this period" KPI
window, the guard blocking completion of a future session, and **the timestamp
on every store write**.

**A real implementation must:**

- Replace it with an injectable clock — not `new Date()` scattered at call
  sites, or the fixtures become untestable.
- **Re-date the seed fixtures in the same change.** Against a real clock every
  seeded meeting is in the past and Home's "Upcoming" tab reads empty.
- Resolve the mixed-clock write: `toggleSession` stamps `completedDate` from
  `TODAY` but `completedTime` from `new Date()`. Both should come from one
  server-side timestamp.
- Use `toLocalISODate()`, already in this file, rather than
  `toISOString().slice(0,10)` — the latter converts to UTC first and silently
  shifts the date by a day in timezones ahead of UTC (such as Melbourne).

Date conventions across the data layer: dates are bare `YYYY-MM-DD` strings
compared with `>` / `localeCompare`; **no `Date` objects are stored anywhere**;
times are 24-hour `"HH:MM"` except the sleep diary (see section 4).

---

## 10. Summary: seam to owner

| Seam | Attach at | Status today |
|---|---|---|
| Authentication | `researcher` object, `data/research.ts` | Hardcoded literal. No auth exists. |
| Sign out | `AppHeader.tsx` menu item | Inert by design. |
| Password reset | `PasswordChangeCard.tsx` `onSubmit` | Mock; claims an email was sent. |
| Audit trail / authorship | `addResearchNote`, `addSupervisionNote` | No author id recorded. |
| Consumer enrolment (REDCap) | `enrollConsumer` + the inert `Sync with REDCap` CTA | No client. **No way to add a consumer.** |
| Coach invitation | `addCoachTrainee` | Creates the record; sends nothing. `pending` is terminal. |
| Fitbit sync | `HealthLogEntry[]` on each dyad | Seeded arrays. No client. |
| Sync-gap alerts | `hasRecentGap` / `dyadHealthAlerts`, `ConsumerDetailPage.tsx` | Implemented against array position, not dates. Reimplement. |
| Meeting create/update/delete | `generateMeetingCreds()`, `research-store.tsx` | Fabricates live `zoom.us` links. |
| Session recordings | `sessionRecordingsFor()`, `data/research.ts` | Complete derivation, zero callers, no artifact. |
| File storage | Two `<input type="file">` handlers | Filename kept, `File` discarded. |
| Consent documents | `ConsumerDyad.consentDocuments` | Display-only; both actions orphaned. |
| CSV export | `lib/csv.ts` `downloadCsv()` | Works client-side. Unaudited. |
| Notification delivery | `NotificationPreferences` on 3 entities | Recorded intent, no delivery. |
| Notification read state | `NotificationHubView` local `useState` | Not persisted; resets on navigation. |
| Certificate generation | `certificateGenerated` / `certificateDate` | Declared, never read or written. |
| The clock | `TODAY`, `data/format.ts` | Frozen constant, ~5 weeks in the past. |
| Persistence (everything) | `ResearchProvider`, `research-store.tsx` | In-memory. Reload discards all state. |
