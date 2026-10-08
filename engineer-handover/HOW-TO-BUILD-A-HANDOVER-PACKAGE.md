# How to build an engineer handover package

**Applies to any portal.** Extracted 2026-10-08 from the coach-portal
orchestration plan, which was written for one portal but is almost entirely
general. Portal-specific findings were dropped; the process was kept.

A handover package is a runnable, documented, accessibility-checked slice of the
prototype for **one** portal, plus the documents an engineer needs to build the
real thing. **The prototype is the specification** — it is not a starting
codebase. There is no backend, no auth, no persistence.

Existing packages, use as reference: `researcher-dashboard/`,
`trainee-coach-portal/`, `consumer-portal/`.

---

## The governing constraint

**Do not alter the live prototype.** Every change — including every
accessibility fix — lands inside the package, which is a copy. Record the
prototype's `src` checksum before starting and re-verify it at the close.

The package and the prototype are therefore **expected to diverge**, and the
package's `CHANGELOG.md` records exactly how. This is deliberate, not drift.

A consequence worth stating up front: where a portal imports from another
portal's files, **do not refactor to extract the shared pieces.** Copy the files
wholesale and let the documentation tell the engineer precisely which exports
this portal uses and which lines belong elsewhere. Extraction is cleaner and is
forbidden by the freeze. Record the decision so nobody later reads it as an
oversight.

Orphaned and unreachable files are likewise **retained and annotated**, not
deleted — a header comment saying why it is unreachable.

---

## Phase 0 — Freeze and baseline *(sequential, no agents)*

1. Record the exact baseline **before any change**: `tsc -b`, `oxlint`, the dev
   server's transform log, and `layoutAudit()` on every surface.
2. **Enumerate the surface list once, authoritatively** — every route, tab,
   sub-tab, modal, wizard step and transient state (onboarding screens, tour
   steps, player slides, derived banner states, celebration animations).
3. Snapshot the seed personas the package will demonstrate.

**Gate:** the surface list is the unit of work for every later phase. Nothing
proceeds until it is complete — **an audit that misses a surface reads as a
clean audit.**

---

## Phase 1 — Copy

All work happens inside `engineer-handover/<portal>/`, a copy. The prototype is
frozen from here on.

---

## Phase 2 — Parallel audit fan-out *(agents report, they do not fix)*

Non-overlapping file ownership, one owner per file set. Fixing is Phase 3, so
that two agents never edit one file. All agents are **read-only on app code**
and write only their own report into `<portal>/_audit/`.

| Agent | Owns | Produces |
|---|---|---|
| **A — Accessibility** | Every surface from Phase 0 | Measured WCAG 2.1 AA audit. Contrast **rasterised through a 1×1 canvas** (Tailwind v4 emits `oklab()`; parsing the computed string as RGB returns nonsense). Focus management on every unmount-on-click control. Control heights against the floor. Keyboard reach into scroll containers. Reflow at 320px. Collapsed-content concealment — `inert`/`aria-hidden`, not just `height: 0`. |
| **B — Code check** | This portal's pages and components | Dead code; inert controls and what each waits on; derived-fact single sources of truth; two-surfaces-one-fact risks; numbering offsets; hardcoded personas; seed-data contradictions. |
| **C — Motion + orchestration** | Animation and flow only, read-only | Every animation with its measured duration, easing, delay, trigger and exit. Every multi-step flow as a state machine. **Written so it can be rebuilt without the code** — an engineer cannot recover motion or orchestration by reading it. |
| **D — Data model + integrations** | `data/*` | Every type and field, stored vs. derived, the store's whole action surface **including actions with no caller**, and every seam a real backend attaches to (auth, REDCap, Fitbit, Zoom, upload, CSV, the frozen clock). |
| **E — Design handoff + tokens** | Visual spec | Measured from the running app, never transcribed from Figma. |

### Agent C also owns hidden demo triggers

Several state changes in this prototype are reachable only through scaffolding
that will not exist in the real product, and **an engineer cannot tell them
apart from real behaviour.** Sweep for every one and produce a table:

> what you click → what it changes → what drives it for real → `file:line` →
> delete, or keep as an internal tool

Known examples, as a pattern to recognise rather than a complete list:

| In the prototype you… | …to see | In the real product this is driven by |
|---|---|---|
| Click a stage on the trainee COACH pathway timeline | that stage's dashboard state | real progress — module completions, session attendance, assessment outcome. **The rail is an indicator, not a control.** |
| Click the Zoom button in the coach view | the add-reflection flow | a completed session debrief. A reflection belongs to the session it follows and is never a standing to-do. |
| Toggle the "Demo view: Trainee / Coach" switch | the other stage's whole portal | the coach's actual certification state. **A review tool, not product chrome.** |

Each affected state machine cross-references this table, so the engineer is
warned at the point they would otherwise rebuild the scaffolding.

**Gate:** reports on disk, findings triaged into fix-now vs. document-as-known,
before Phase 3 begins.

---

## Phase 3 — Fix and annotate *(sequential, one owner)*

**Fix the accessibility issues, don't just report them** — but every fix lands
in the package, never in the prototype.

Fixes are scoped to **assistive semantics and focus behaviour**: accessible
names, focus management, `inert` on concealed regions, keyboard reach, hit
areas. Any fix that would change the **visual design** — a contrast failure
needing a new colour, say — is **documented as a known defect with a recommended
value, not applied.** Where "fix accessibility" and "do not alter the UI"
collide, say so in the report and let the design owner decide.

1. Fix every confirmed defect, **re-verifying each live**: `activeElement` reads
   for focus, rasterised recompute for contrast, real dispatched key presses for
   keyboard paths. **No fix is claimed on a re-read of the diff.**
2. Annotate the code for handover:
   - Every designed-but-unwired control is self-documenting — focusable,
     `aria-disabled`, an `sr-only` "(coming soon)", and a comment naming what it
     is waiting on. (The researcher package's `InertButton` is the convention.)
   - Header comments on retained-but-unreachable files.
   - **Comment the load-bearing measurements** — the numbers that look arbitrary
     and are not.
3. Add a **reviewer bypass** for anything that replays on every page load
   (onboarding, a first-run tour), and document it. A package that makes a
   reviewer click four screens per load will not get reviewed.

**Gate:** `tsc -b`, `oxlint`, the Vite transform log, `layoutAudit()` empty on
every surface, and every fix re-verified live and individually.

> `tsc` passing is **not** proof the app builds. A comment inside a JSX attribute
> list passes `tsc --noEmit` and is rejected by Vite's parser, blanking the page
> behind a green typecheck. Always check the dev server's own transform log too.

---

## Phase 4 — Documentation *(one owner per document set)*

| Set | Documents |
|---|---|
| 1 | `engineering-overview.md` — architecture, directory map, routes, how a page renders, conventions, traps, what to build first. **This is the engineer's entry point.** · `data-model.md` · `integration-points.md` |
| 2 | `design-handoff.md` — measured visual spec, read from the running app · `design-tokens.md` · `motion-spec.md` |
| 3 | `orchestration-flows.md` · `CHANGELOG.md` · `README.md` |

`motion-spec.md` and `orchestration-flows.md` exist because an engineer cannot
recover motion or flow orchestration from the code.

**The audit reports are internal and are NOT shipped.** `_audit/` is working
material: it drives the fixes and feeds the documents, then is deleted before
delivery. Engineers receive the *result* of the audits, not the audits.

One consequence must be handled deliberately rather than by omission: any defect
**found and not fixed** — chiefly anything whose fix would change the visual
design — still has to reach the engineer, or they inherit a known problem with
no way to learn it. Those go into the README's **State of the code** section as
named known limitations with the recommended fix. Short and honest, not a report.

**Gate:** every numeric claim traceable to a measurement, not to Figma. Every
cross-document reference resolves. No document contradicts another.

---

## Phase 5 — Cut the package

```
engineer-handover/<portal>/
├── README.md     Scope (what is deliberately absent) · Quickstart with its real
│                 traps · doc index · directory map · study-context primer ·
│                 State of the code (what is real vs. mocked)
├── app/          App.tsx rewritten to this portal's routes only, `/` redirecting
│                 in, `*` catching back. Other portals' pages not copied.
└── docs/         the documents above + layout-audit.js
```

Remove the other portals **outright** rather than shipping them with a note
asking the engineer to ignore them. Where remaining code or comments mention
them, the README says to treat that as historical context, not a pointer.

Ship a real `node_modules` install and lockfile.

**The gate that matters:** delete `node_modules`, reinstall from scratch,
`npm run dev`, and drive every route in a fresh browser.
**A package that only runs on this machine is not a handover.**

---

## Keeping a package honest after delivery

A package is a point-in-time snapshot and goes stale fast. Before handing over an
existing package, **measure it** rather than assuming:

```bash
# how far has the package drifted from the live app?
H=engineer-handover/<portal>/app/src
L=design/prototype/care2sleep-prototype/src
find $H -type f | while read f; do rel=${f#$H/};
  if [ -f "$L/$rel" ]; then diff -q "$f" "$L/$rel" >/dev/null || echo "CHANGED  $rel";
  else echo "GONE FROM LIVE  $rel"; fi; done
```

**Refreshing the source without rewriting the documents is worse than being
openly out of date** — a specification describing a build it no longer matches
is an inconsistency that stays invisible until an engineer builds the wrong
thing. Update code and documents together, or not at all.
