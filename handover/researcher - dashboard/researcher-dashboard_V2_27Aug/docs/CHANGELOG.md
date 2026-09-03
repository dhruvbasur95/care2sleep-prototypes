# Changelog — Care2Sleep Research Dashboard handover

What changed in this package between hand-off revisions, why, and which
documents each change invalidates.

Entries are newest first. Each one states the **user-visible change**, the
**code that moved**, and anything an engineer would otherwise mis-estimate.

---

## 2026-08-27 — One pairing, one place

**The shape of the change.** A researcher used to read a coach-consumer pairing
across two record pages: the consumer's own page held their study progress,
sleep data and notes, while the coach's page held the caseload and the coach's
reflection. The same facts appeared on both, from different fields, and the two
could disagree.

They no longer do. **Everything about one pairing is now read on the coach
record page**, under `Assigned Consumers`. The consumer record page keeps only
the fields nobody else owns: identity, contact, consent, notifications.

This is a reorganisation, not a rewrite. No data model changed, no store action
changed, and no component was deleted.

### Coach record page (`/research/spaces-coaches/:coachId`)

`Assigned Consumers` now splits into **three sub-tabs** below the consumer
selector, rendered through the shared `UnderlineTabs`:

| Sub-tab | Contents |
|---|---|
| **Study progress** | KPI row → study-progress timeline **+** Latest updates (60/40) → Modules and sessions **+** Consumer module completion overview → Study log |
| **Consumer sleep & health data** | Fitbit sleep data, sleep diary notes |
| **Coach's reflection** | The coach's shared session reflection |

Other changes on this page:

- **The `Sessions plan overview` table is hidden here.** The study-progress
  timeline stands in its place — the same facts per session, read as a journey.
  `SessionsPlanOverview` itself is untouched and still exported.
- **`Transfer consumer` moved out of the hero** and into the consumer-selector
  band, beside a new **`View consumer details`** button. Both act on the
  *selected consumer*; only `Assign consumer`, which acts on the coach, remains
  in the hero.
- `View consumer details` opens a new right-hand **slide-in panel**
  (`components/research/SlideOverPanel.tsx`, the package's first drawer). It
  renders the consumer record page's own `ContactDetailsCard` per dyad member
  and a link through to that consumer's Profile details. Deliberately **no
  notes**: a freeform field with a save path does not belong in a panel opened
  to check a phone number.
- The selector band's label and dropdown moved from centred to the page's
  content gutter, and the dropdown's value is now `body-md`.
- The page accepts **`?tab=`, `?dyad=` and `?sub=`** deep links. Each is
  validated against the real list, and a `?dyad=` outside this coach's caseload
  is ignored rather than honoured — it would otherwise blank the `<select>`.

### Consumer record page (`/research/consumers/:dyadId`)

- **Four of the five tabs are hidden:** Overview, Study Progress, Sleep & Health
  Data, Notes. Only **Profile details** remains, and the tab row hides itself at
  a single entry (`TABS.length > 1`) — a tablist with one tab is a heading that
  looks clickable.
- `Study information` gained **Assigned coach**, **Coach email** and **Assigned
  on**. All three are derived from `dyad.coachId`; the coach name is *never*
  stored twice, or this page and the coach record page could disagree about a
  pairing.
- New hero CTA **`View study progress`**, deep-linking to the coach page with
  this consumer already selected and the Study progress sub-tab open.
- The page accepts **`?tab=`**, which is how the drawer's
  `Go to consumer profile details` link lands on the right tab.

### What was exported, not deleted

Nothing was removed. The following are now exported from
`pages/research/ConsumerDetailPage.tsx` and consumed by
`pages/research/SpacesCoachProfilePage.tsx`:

| Export | Status |
|---|---|
| `StudyProgressTimelineCard` | Extracted from the former `LearningProgressTab` |
| `StudyLogSection` | Extracted from the same |
| `ModuleCompletionOverviewCard` | Extracted from the same |
| `HealthDataHubTab` | Moved caller |
| `ContactDetailsCard` | Second caller (the drawer) |
| `OverviewTab`, `NotesTab` | **No caller.** Exported rather than deleted, because "hide" was the instruction and the `researchNotes` / `addResearchNote` store slice is still live. Re-enabling either is one entry in `TABS`. |

`UnderlineTabs` gained one opt-in prop, `flushStart`, which pulls the row left
by its own tab padding so the first label lands on the content gutter. Off by
default; existing callers are unchanged.

### Three measurements worth keeping

Each of these looked correct in a screenshot and was wrong under measurement.

1. **`minmax(0, 6fr) / minmax(0, 4fr)`, not `6fr / 4fr`.** An `fr` track's
   automatic minimum is `auto`, so the timeline's horizontally-scrolling card
   row grew its own track past its share. Measured **80/20** where 60/40 was
   intended. `min-w-0` on the *child* does not fix it — the overflow is in the
   track.
2. **Band padding nests outside the max-width container**, matching
   `ResearchShell`'s own `px-6 md:px-20` → `mx-auto max-w-[1320px]`. Reversed,
   the centring and the gutter stack and the label lands 80px right of every
   heading below it, but only once the viewport exceeds 1320 + gutters.
3. **`heroNoSeam` + `heroFlushBelow` on the consumer record page.** With the tab
   row hidden the hero ended flush against its last line, and once padding was
   restored the tabpanel's own `mt-16` double-counted — 128px from band to first
   heading where the convention is 64.

### Seed-data contradiction, flagged not fixed

`dyad-012` (Dorothy & Frank Kellerman) is assigned to `mei-ling-chen`, who sits
in Coach Management's **"Waiting to be onboarded"** list. A consumer cannot be
assigned to a coach who has not been onboarded; there is no
`/research/spaces-coaches/mei-ling-chen` for that pairing to link to.

The UI degrades honestly rather than hiding it — the coach's name renders
unlinked, and the `View study progress` CTA renders `aria-disabled` with an
`sr-only` reason. **A real backend must not allow this state.** See
`docs/data-model.md` on `ConsumerDyad.coachId` and `SpacesCoach`.

### Verified

- `tsc -b` and `oxlint` clean.
- `docs/layout-audit.js` empty on all three coach sub-tabs and on the consumer
  record page. The two `control-not-filling-wrapper` findings on Profile details
  are the pre-existing 28px notification checkboxes, unchanged by this work.
- Focus enters the slide-in panel on open and returns to its trigger on Escape,
  confirmed by a live `activeElement` read.
- Deep link `?tab=Assigned Consumers&dyad=dyad-014&sub=progress` lands on the
  right tab, sub-tab and consumer.

### Documents this invalidates

| Document | What changed |
|---|---|
| `docs/engineering-overview.md` | §5 route table updated for both record pages |
| `docs/design-handoff.md` | Route table's tab counts |
| `docs/accessibility-report.md` | **M2** and **O1** are unchanged defects on **changed routes** — they now reproduce under Coach record → Assigned Consumers, not Consumer record. Re-test there. |
| `README.md` | Route summary and documentation index |
| `docs/data-model.md`, `docs/integration-points.md` | **Not affected.** No type, field, action or integration seam changed. |
