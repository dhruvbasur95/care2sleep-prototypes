# Care2Sleep — Consumer Portal: engineering overview

**Read this first.** It is the entry point for the package. When you need the
data layer in full, go to [`data-model.md`](./data-model.md); when you need to
know where a backend attaches, go to
[`integration-points.md`](./integration-points.md).

```
handover/consumer-portal/
├── README.md               start here
├── app/                    the runnable prototype — 56 source files, 23,435 lines
└── docs/                   this folder — 8 documents + 3 runnable scripts
```

Run it:

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # node is off the default PATH here
cd app && npm install && npm run dev
```

Everything below was measured against the code as it stands, on a running dev
server at `http://localhost:5220`.

---

## 1. What this is, and what it is not

This is the **Consumer Portal** of Care2Sleep, a Monash University sleep-coaching
intervention. Aged care workers are trained as sleep coaches; each coach is
assigned **consumers** — a dyad of a **PLE** (Person with Lived Experience,
living with dementia) and their **Carer**, or a carer participating alone. This
package is what that dyad sees: their session plan, their weekly module, their
sleep diary, their coach.

**It is a runnable design prototype, and it is the specification.** Roughly a
third of every file is commentary recording what was measured, what was tried
and rejected, and which bug a particular line prevents. Treat the comments as
normative. When you change one of these files, change its comment in the same
commit.

### What it is not

- **Not a starting codebase.** Nothing here is production-shaped below the
  component layer. The data layer is a seed file and one React context.
- **No backend.** Zero `fetch`, zero `XMLHttpRequest`, zero network calls of any
  kind. Verified: `grep -rn "\bfetch(\|XMLHttpRequest\|axios" src/` returns
  nothing.
- **No authentication.** `/` redirects to a hardcoded consumer, `dyad-011`.
  "Log out" clears a `sessionStorage` key nothing ever writes and then navigates
  to `/`, which redirects straight back in. See `integration-points.md` §1.
- **No persistence.** No `localStorage`, no IndexedDB. The whole `src/` tree
  contains exactly **three** textual matches for `localStorage|sessionStorage`,
  two of which are comments saying *deliberately not persisted*. A reload resets
  everything to seed.
- **No real media.** `public/` holds 103 files, 2.4 MB, all illustrations and
  logos. There is no video and no audio anywhere in the package. Only **one** of
  the seven modules (`daytime-habits`, "Module 4") has authored content at all.
- **Not multi-role.** The Research Dashboard and Coach Delivery Portal were
  deleted from this copy rather than shipped with a note asking you to ignore
  them. There is no portal switcher and no role switch. (The "Switch portal" menu
  row survives in two menus and is a dead loop — see §8.)

---

## 2. Architecture

### 2.1 Stack

| Layer | What | Version (installed) |
|---|---|---|
| UI | React | **19.2.8** |
| Routing | `react-router-dom`, **`HashRouter`**, no basename | 7.18.1 |
| Build | Vite | 8.1.5 |
| Types | TypeScript, **`strict: true`** | 6.0.3 |
| Styling | Tailwind **v4**, CSS-first (no `tailwind.config.js`) | 4.3.3 |
| Motion | framer-motion | 12.42.2 |
| Icons | `lucide-react` — the only icon source | 1.25.0 |
| Menus/popovers | `@base-ui/react` (2 files) | 1.6.0 |
| Lint | oxlint | 1.75.0 |

Twelve runtime dependencies, all of them genuinely imported. Three are
non-obviously load-bearing and a `src/`-only dependency checker will report them
unused: `@tailwindcss/vite` (wired in `vite.config.ts:49`) and the two
`@fontsource-variable` packages (single CSS `@import` each, no JS importer).

**This is not a shadcn app.** shadcn was scaffolded and then abandoned: one of
~50 registry components survives (`src/components/ui/card.tsx`), **six of its
seven exports have zero references anywhere** (measured), and its one live export
is neutralised at its only call site. `class-variance-authority` — shadcn's
variant engine — is not installed. The two library-backed primitives come from
base-ui directly, not shadcn wrappers. See §8.9 for the staffing consequence.

Tailwind v4 means there is **no `tailwind.config.js`, no `postcss.config.js` and
no `content` array**, and there will not be. Theme configuration lives in
`@theme` blocks inside two stylesheets:

```
src/index.css          739 lines  — app-wide system; the entry point
  :1   @import "tailwindcss"
  :16  @import "@fontsource-variable/inter"
  :21  @import "./consumer-tokens.css"
  :28  @theme inline { … }     fonts, --text-* scale, radii, colours
  :721 @layer base { … }

src/consumer-tokens.css  675 lines  — THE CONSUMER PORTAL'S OWN BRAND
  :58  @import "@fontsource-variable/atkinson-hyperlegible-next"
  :60  @theme inline { … }     --color-consumer-* and 18 --text-consumer-* steps
  :555 @utility bg-consumer-canvas
```

The split is deliberate and **the two files must not be merged**. The Consumer
Portal runs a second, parallel brand: the app-wide `--primary` is `#4a278f`, this
portal's `--color-consumer-primary` is `#3a00ad`. `consumer-tokens.css`'s own
header documents the cost and names the intended resolution.

One v4 consequence worth knowing: **content scanning is automatic and a utility
class that appears nowhere in source is not generated at all**, so injecting a
class at runtime to test something will silently compute to nothing.

### 2.2 State: one context, plus module-scoped stores

There are exactly two kinds of state in this app, and choosing wrongly between
them is the single most common way to break it.

**(a) Domain state — `src/data/research-store.tsx`.** One provider,
`ResearchProvider`, mounted once in `App.tsx:45` above the router. It holds
**13 `useState` slices** seeded from `src/data/spaces.ts` and `src/data/research.ts`,
and exposes them plus 34 actions — **47 members** — through `ResearchContext`,
read via `useResearch()` from `src/data/research-context.ts`.

The Consumer Portal reads **7 of those 47**. There are 12 `useResearch()` call
sites and every one destructures, so this list is exhaustive:

```
coaches            CoachCard.tsx:116
consumerDyads      7 files, 8 sites
sessionPlans       ConsumerHomePage.tsx:333, SessionPlanStrip.tsx:643
sessionCompletion  ConsumerHomePage.tsx:333/498, SessionPlanStrip.tsx:643
updateDyadPerson   ConsumerAccountPage.tsx:217
submitSleepDiary   ConsumerDiaryPage.tsx:154
setDyadOptOut      ConsumerAccountPage.tsx:66
```

The other **40 are inherited surface from the three deleted portals, not dead
code** — they describe what a backend has to support. `data-model.md` §3 lists
them individually. Do not bulk-delete them; two of them (`toggleSession`,
`unlockModuleManually`) are the only things that can release a module, and the
consumer can never call either.

**(b) Anything that must survive navigation — a module-scoped store.**

`App.tsx:47` keys `<Routes>` on `location.pathname` inside
`AnimatePresence mode="wait"`:

```tsx
<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>
```

so **every in-app navigation unmounts and remounts the whole page subtree,
including `ConsumerShell` and the header.** Anything held in component state is
destroyed by the navigation that was supposed to reveal it. This project has
shipped that bug twice.

The standing fix is a module-scoped `let`, a `Set` of listeners, and
`useSyncExternalStore`:

```ts
// src/data/consumerOnboarding.ts
let open = false
const listeners = new Set<() => void>()
function emit() { listeners.forEach((l) => l()) }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } }
const read = () => open
export function useConsumerOnboardingOpen() {
  return useSyncExternalStore(subscribe, read, read)
}
```

`useSyncExternalStore` is what makes a value living *outside* React re-render the
components reading it. A plain module `let` would be stable but silent.

Four stores follow the pattern; three plain `let` latches do the same job where
nothing needs to re-render. All seven are in `data-model.md` §4.

### 2.3 Everything else

- **No `React.lazy`, no dynamic `import()`, no component maps.** Static analysis
  of reachability is therefore complete.
- **No `createPortal` anywhere.** Every modal renders inline at its call site.
- `MotionConfig reducedMotion="user"` wraps the app at `App.tsx:44`, so
  components get reduced-motion handling for free; `useReducedMotion()` is read
  where a component needs to branch.
- **Zero `any`, zero `@ts-expect-error`, zero lint suppressions.**

---

## 3. Directory map

All 56 files. Line counts measured.

### Entry and chassis — 3 files, 186 lines

| File | L | What |
|---|---|---|
| `src/main.tsx` | 13 | `createRoot` → `StrictMode` → `HashRouter` → `App` |
| `src/App.tsx` | 93 | The whole route table (§4), the `MotionConfig`/provider/`AnimatePresence` stack, and the one `ConsumerMenuDrawer` mounted above the router |
| `src/lib/utils.ts` | 80 | `cn()` — `clsx` + `extendTailwindMerge`. **60 of its 80 lines are a warning.** See §6.2 |

### Styles — 2 files, 1,414 lines

| File | L | What |
|---|---|---|
| `src/index.css` | 739 | App-wide `@theme`: Inter, the `--text-*` scale, radii, neutral + app-brand colours |
| `src/consumer-tokens.css` | 675 | This portal's own brand: `--color-consumer-*`, 18 fluid `--text-consumer-*` steps, the `bg-consumer-canvas` utility |

### Pages — 6 files, 4,194 lines

| File | L | Route |
|---|---|---|
| `src/pages/consumer/ConsumerHomePage.tsx` | 787 | `/consumer/:dyadId` |
| `src/pages/consumer/ConsumerLessonsPage.tsx` | 174 | `/consumer/:dyadId/learning` — "My Modules" |
| `src/pages/consumer/ConsumerModulePage.tsx` | 1581 | `/consumer/:dyadId/module/:moduleId` — 4 stages + a completion screen |
| `src/pages/consumer/ConsumerDiaryPage.tsx` | 700 | `/consumer/:dyadId/diary` — welcome → 9 questions → done |
| `src/pages/consumer/ConsumerHelpPage.tsx` | 645 | `/consumer/:dyadId/help` — "Need help" |
| `src/pages/consumer/ConsumerAccountPage.tsx` | 307 | `/consumer/:dyadId/account` — "My profile" |

### Data — 11 files, 5,429 lines

| File | L | What | In scope here? |
|---|---|---|---|
| `src/data/spaces.ts` | 1851 | SPACES delivery: dyads, sessions, plans, diary, modules, and the seed | **Primary** |
| `src/data/research.ts` | 1517 | COACH training: coach trainees, certification | **One type** — `Coach`, for the coach card |
| `src/data/research-store.tsx` | 965 | The single in-memory context. 13 slices, 47 members | **Primary** (7 members) |
| `src/data/consumerLessonContent.ts` | 427 | Module video/chapters/summary/transcript/reflection content | **Primary.** Consumer-only |
| `src/data/trainingPathwayV2.ts` | 274 | The 11-module *coach* curriculum | **Zero.** Imported only by `research.ts` |
| `src/data/format.ts` | 113 | **`TODAY`** + timezone-safe date/time formatters | **Primary.** See §8.1 |
| `src/data/consumerTextScale.ts` | 93 | Text-size ladder store | **Primary** |
| `src/data/consumerMenuReveal.ts` | 89 | Drawer open state + a monotonic content-reveal token | **Primary** |
| `src/data/consumerOnboarding.ts` | 58 | Tour open state | **Primary** |
| `src/data/research-context.ts` | 29 | `ResearchContext` + `useResearch`. Split out of the store on purpose — §6.5 | **Primary** |
| `src/data/auth.ts` | 13 | `signOutOfTraining()`. **Vestigial** — clears a key nothing sets | Seam only |

### Components — 34 files, 12,212 lines

**Chassis and shared primitives**

| File | L | What |
|---|---|---|
| `components/consumer/ConsumerShell.tsx` | 499 | The page chassis. Header, `<main>`, opted-out banner, welcome gate, tour, scroll cue, opt-in footer, and the text-scale `zoom`. 10 additive props |
| `components/consumer/ConsumerHeader.tsx` | 874 | Sticky header: skip link, wordmark, sliding-pill nav, account menu, accessibility menu, hamburger |
| `components/consumer/ConsumerCanvasWave.tsx` | 868 | Backdrop wave, blinking pillow mascot, `useMascotExpression`, `ConsumerPageHero`, `ConsumerContentReveal`. **7 importers** |
| `components/consumer/ConsumerFooter.tsx` | 129 | Dark site footer, Monash lockup, Acknowledgement of Country |
| `components/consumer/ConsumerMenuDrawer.tsx` | 370 | Full-bleed top-down hamburger drawer. Mounted once at `App.tsx:89` |
| `components/consumer/AccessibilityMenu.tsx` | 355 | base-ui `Popover` with the three text-size controls |
| `components/consumer/ScrollCue.tsx` | 115 | Self-hiding "scroll down" pill |
| `components/consumer/ConsumerLogo.tsx` | 79 | The committed wordmark SVG as an `aria-hidden` `<img>` |
| `components/consumer/ConsumerCard.tsx` | 43 | `CARD_HAIRLINE` / `CARD_PAD` class constants + the 52px `CardIcon` slot |
| `components/consumer/ConsumerFlowFooter.tsx` | 210 | Sticky Go back / Continue bar for *flows*, plus `PILL_*` / `GUTTER` / `SHELL` / `CHROME_TRANSITION` |
| `components/consumer/ConsumerWaveRule.tsx` | 42 | Squiggle rule between sections |
| `components/consumer/BlockedHint.tsx` | 109 | Shows *why* an `aria-disabled` control is inert, on hover / focus / tap |
| `components/shared/ConfirmDialog.tsx` | 353 | The modal chassis: focus trap, Escape, guarded focus-restore. 5 call sites |
| `components/shared/modalFooter.ts` | 26 | The full-bleed modal footer class string |
| `components/ui/card.tsx` | 112 | The last shadcn component. **6 of 7 exports unreferenced** |

**First-run flows**

| File | L | What |
|---|---|---|
| `components/consumer/ConsumerWelcome.tsx` | 1156 | The 4-step first-run welcome. All four steps mounted at once on a travelling rail; inactive ones `inert` |
| `components/consumer/ConsumerOnboardingTour.tsx` | 512 | The 5-screen first-run tour. One fixed 577×716 card over a flat dim — **no spotlight** |

**Home**

| File | L | What |
|---|---|---|
| `components/consumer/SessionPlanStrip.tsx` | 652 | The 6 numbered catch-ups as a scrollable strip, off live plan + completion |
| `components/consumer/LearningTaskCard.tsx` | 238 | "Module of the week" purple card |
| `components/consumer/CoachCard.tsx` | 252 | "Meet your coach" → opens `CoachProfileModal` |
| `components/consumer/CoachProfileModal.tsx` | 382 | Coach profile rendered *through* `ConfirmDialog` |
| `components/consumer/SessionFeedbackBanner.tsx` | 163 | Post-session prompt above "Your tasks for today" |
| `components/consumer/SessionFeedbackModal.tsx` | 855 | 3-screen mood + comment flow. **Writes nowhere** |

**My Modules and a module**

| File | L | What |
|---|---|---|
| `components/consumer/LessonCards.tsx` | 533 | Featured + previous module cards and their three shared primitives |
| `components/consumer/lessons.ts` | 109 | `releasedLessons()` / `viewFor()` — **the portal's real module authority** (§8.3) |
| `components/consumer/ModuleHeroWave.tsx` | 185 | Module welcome photo band. Photo + wave are **one baked asset** — do not split |
| `components/consumer/EpisodePanel.tsx` | 464 | Module video box in 3 modes (video / audio / transcript) |
| `components/consumer/ModuleSummaryCards.tsx` | 832 | Tap-to-flip summary cards, 3 cycling pillow styles |
| `components/consumer/ModuleReflection.tsx` | 598 | Reflection activity, one question at a time, plus a review screen |
| `components/consumer/ResourceCard.tsx` | 286 | Take-home resource card, torn-paper photo frame |
| `components/consumer/ConsumerCompletionHero.tsx` | 466 | Full-viewport completion screen |
| `components/consumer/pillowFrame.ts` | 71 | The 3 pillow shapes as path data + stroke constants |
| `components/consumer/resourceBlobFrame.ts` | 53 | The resource torn-paper frame as one path + backdrop |

**My profile**

| File | L | What |
|---|---|---|
| `components/consumer/ConsumerPersonCard.tsx` | 221 | PLE / Carer identity card with inline edit. The only `<Card>` caller |

**No component file in this package is dead** — every one of the 34 has at least
one real importer. Dead code exists only at the exported-symbol level.

---

## 4. The routes

`src/App.tsx`. **Six pages, three redirects.** Routing is `HashRouter`, so URLs
look like `http://localhost:5220/#/consumer/dyad-011`.

| Path | Renders |
|---|---|
| `/` | `<Navigate replace>` → `/consumer/dyad-011` |
| `/consumer` | `<Navigate replace>` → `/consumer/dyad-011` |
| `/consumer/:dyadId` | `ConsumerHomePage` |
| `/consumer/:dyadId/learning` | `ConsumerLessonsPage` — "My Modules" |
| `/consumer/:dyadId/module/:moduleId` | `ConsumerModulePage` |
| `/consumer/:dyadId/diary` | `ConsumerDiaryPage` |
| `/consumer/:dyadId/help` | `ConsumerHelpPage` |
| `/consumer/:dyadId/account` | `ConsumerAccountPage` — "My profile" |
| `*` | `<Navigate replace>` → `/consumer/dyad-011`. **There is no 404 design** |

Every page resolves its dyad the same way, six times over, with no shared hook:

```tsx
const dyad = consumerDyads.find((d) => d.id === dyadId)
if (!dyad) return <Navigate to="/consumer" replace />
```

The guard sits **after all hooks** deliberately — forced by the Rules of Hooks,
and reasoned about in `ConsumerHelpPage.tsx`. Do not "tidy" it earlier.

### What has no route

Three significant surfaces are not routes, and looking for them in `App.tsx` will
not find them:

- **The first-run welcome** (4 steps) is rendered by `ConsumerShell` *instead of*
  the page, on whichever consumer page loads first — unless that page passes
  `showWelcome={false}`, which all five non-Home pages now do. It is gated on a
  module-scoped `let welcomeDismissed` (`ConsumerShell.tsx:35`).
- **The first-run tour** (5 screens) is a modal mounted by `ConsumerShell`,
  opened only by the welcome's handover. There is no other entry point and no
  re-entry point.
- **The hamburger drawer** is mounted once at `App.tsx:89`, **above** `<Routes>`,
  so it outlives a navigation and can close and navigate in the same frame.

The multi-step flows inside `ConsumerModulePage` (welcome → video → summary →
reflection → done) and `ConsumerDiaryPage` (welcome → 9 questions → done) are
page state, not routes. `orchestration-flows.md` has each as a state machine.

---

## 5. How a page renders, end to end

Walking `#/consumer/dyad-011` from the entry point to painted pixels.

**1. `main.tsx`** mounts `StrictMode` → `HashRouter` → `App`, and imports
`index.css`, which pulls in Tailwind, Inter, and `consumer-tokens.css`.

**2. `App.tsx`** wraps everything in `MotionConfig reducedMotion="user"` →
`ResearchProvider` → `AnimatePresence mode="wait"` → `<Routes>` keyed on
`location.pathname`. `ConsumerMenuDrawer` is mounted as a sibling of
`<AnimatePresence>`, not inside it.

**3. `ResearchProvider`** builds its 13 slices from the seed. Two are worth
naming: `sessionCompletion` is initialised from each dyad's `sessionsCompleted`,
and `sessionPlans` from each dyad's `sessionPlan ?? emptySessionPlan()`. **Those
store keys are the live copies; the dyad fields are the frozen seed.** Every
consumer surface must read the store keys.

**4. `ConsumerHomePage`** resolves the dyad, reads `sessionCompletion` for the
feedback-banner ordinal, derives `finishedSessionOrdinal`, then renders a
`ConsumerShell`.

**5. `ConsumerShell`** (`:352` onward) does, in order:

- `useTextScale()` for the current `zoom` factor.
- Decides `skipWelcome = welcomed || !showWelcome`. Home passes neither, so on a
  fresh load `skipWelcome` is `false` and the shell renders
  **`<ConsumerWelcome>` inside `<main>` instead of the page**. Finishing it calls
  `dismissWelcome` (`:313`): set the module flag, set state, `navigate(…, {replace:true})`
  to Home explicitly, then `openConsumerOnboarding()`.
- Renders `<ConsumerHeader showNav={skipWelcome && showNav}>` — a sticky 72px bar
  (`--consumer-header-h`) carrying the skip link, wordmark, sliding-pill nav,
  accessibility popover, account menu and hamburger.
- Renders `<motion.main id="main-content" tabIndex={-1} style={{ zoom: scale }}>`.
  **`zoom` is scoped to `main`, not the document**, so the header — and therefore
  the menu doing the scaling — holds still. `tabIndex={-1}` is what makes the
  skip link and every focus-recovery path actually work.
- Inside `main`: the opted-out banner (or `topBanner`) if present, the optional
  `hero` band, then the content column, which is `contentClassName` if given,
  otherwise a computed default. Home passes
  `"bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-20 md:px-20"`.
- Then, conditionally, `<ConsumerFooter>` **inside `main`** — deliberately, so
  the text scale reaches it.
- Outside `main` but inside the shell: `<ScrollCue>` (suppressed while the tour
  is open) and `<ConsumerOnboardingTour>`.

**6. Home's own content** is `<ConsumerCanvasWave>` (the backdrop wave and
mascot), then a hero wrapper carrying `CONSUMER_HERO_TO_CONTENT` and
`CONSUMER_CREST_TRACKING`, then `<ConsumerPageHero>` for the greeting, then a
`<ConsumerContentReveal>` around everything below it. **Only that last block
animates on a tab change** — the wave, mascot and greeting hold still.

**7. Measured live at 991 × 689**, Home: `documentElement.scrollWidth === clientWidth`
(no horizontal page scroll); the smallest rendered font size anywhere in `main`
is **16px**; the primary CTAs ("Resume module", "Fill in sleep diary", "Join
video call", "Read More", "Get help") are all **48px**; the session-strip cells
are 36px.

---

## 6. Conventions to follow

Each one is derived from the code, with a real example.

### 6.1 A page is `ConsumerShell` + content. Always.

All six pages do this and there is no other page shape.

```tsx
// ConsumerLessonsPage.tsx:67
<ConsumerShell
  showWelcome={false}
  dyadId={dyad.id}
  accountLabel={dyad.carer.name}
  contentClassName="bg-consumer-canvas relative overflow-clip px-6 pt-8 pb-24 md:px-20"
  optedOut={dyad.optedOut}
  showFooter
>
```

**Every shell prop is additive with a default that preserves existing
behaviour**: `showNav`, `showWelcome`, `contentFullBleed`, `showScrollCue`,
`showFooter`, `heroNoSeam`, `topBanner`, `hero`, `contentClassName`. Follow that
when adding one. Note `hero`, `heroNoSeam` and `topBanner` are currently passed
by **no** page — they are dead slots, and `ConsumerAccountPage.tsx` and
`ConsumerHomePage.tsx` each carry a comment explaining why the pearl band they
carry is the wrong temperature for this portal.

### 6.2 Every merged className goes through `cn()` — and every `--text-*` token must be registered

`src/lib/utils.ts` is 80 lines and 60 of them are a warning. The hazard:
`tailwind-merge` has no way to know `text-consumer-body` is a *font size* and not
a *colour*. Both start with `text-`, so by default it buckets them as conflicting
and **silently keeps only the last one**. `cn('text-consumer-body', 'text-ink-muted')`
would drop the size, leave the class sitting in the markup, and render the
element on inherited type with no error anywhere. This project shipped exactly
that bug once.

The fix is `extendTailwindMerge` with every custom step registered under
`font-size`. **I verified the registry programmatically** — parsed every
`--text-*` declaration out of both stylesheets with comments stripped and diffed
against the list in `utils.ts`:

```
declared: 29   registered: 29
declared NOT registered: []      ← would be a live, silent bug
registered NOT declared: []      ← dead entry
```

Exact match both directions. There is no live `cn()` bug today.

> **Hand this to whoever touches the type scale, verbatim:** adding a `--text-*`
> token to `index.css` or `consumer-tokens.css` and adding its name to
> `utils.ts`'s `font-size` array are **one commit, not two**. No test and no type
> catches the omission; the symptom is text silently rendering at the wrong size
> at only *some* call sites — the ones that also pass a colour.

### 6.3 State that must survive navigation goes in a module-scoped store, never `useState`

This is the portal's most important architectural rule and it is not stylistic.
See §2.2 for the mechanism and `data-model.md` §4 for all seven stores. The test
is simple: *if this value has to be true after a `navigate()`, it cannot live in
a component.*

The reverse also holds. `ConsumerModulePage`'s reflection answers, the diary
draft, and the feedback mood are all `useState` **on purpose** — they are
per-attempt working state that should not survive leaving the flow, and the fact
that they also do not survive is what `integration-points.md` §5 and §6 are about.

### 6.4 Consumer surfaces use `--*-consumer-*` tokens; app tokens are leakage

`consumer-primary`, not `primary`. `ring-consumer-primary`, not `ring-ring`.
`text-consumer-*`, not `text-caption` / `text-fine` / `text-title`. A component
genuinely shared with another portal takes a `variant` prop — but note that
`ConfirmDialog`'s `variant` prop has been **removed**, because all five call sites
passed `"consumer"` and the `'app'` branch was the last thing painting coach-brand
purple in a consumer package.

The type scale has hard rules, enforced by `docs/type-scale-check.mjs`: every
fluid token interpolates 375 → 1200px, no rank reversals, **nothing below 16px,
nothing heavier than 600**. Measured output today: 18 tokens, 6 distinct sizes at
375px, 12 at 768, 8 at desktop.

### 6.5 Keep component and non-component exports in separate modules

`useResearch` lives in `data/research-context.ts`, split out of
`research-store.tsx`, and `TODAY`/`formatDate` live in `data/format.ts` for the
same reason. Vite's Fast Refresh flags *any* non-component export beside a
component as making the whole module refresh-incompatible, so an edit anywhere
that cascaded into re-evaluating the store forced `ResearchProvider` to remount
with fresh initial state — **silently wiping in-memory session data without a
visible page reload.**

oxlint currently reports exactly this in four places
(`ConsumerCanvasWave.tsx:236,241,242,313` — `Z_LAYERS`, `Z_PATH`,
`Z_TIMES`/`Z_CYCLE_S` and `useMascotExpression` exported beside components). Those
are the only four warnings in the package and they are a DX note, not a defect.

### 6.6 Artwork is a committed asset, or one path rendered twice. Never hand-drawn.

Icons are `lucide-react`, always — 25 files import it and there is no other icon
source. `<svg>`/`<path>` appear only in `ResourceCard.tsx` and
`ModuleSummaryCards.tsx`, and always render an extracted path constant:

```tsx
// resourceBlobFrame.ts:29 → ResourceCard.tsx
<clipPath id="resource-blob-clip"><path d={RESOURCE_BLOB_PATH} /></clipPath>
<path d={RESOURCE_BLOB_PATH} stroke={RESOURCE_BLOB_STROKE} … />
```

**A mask and the outline that frames it are derived from one source.** This
project has shipped a photo outside its own frame three times by transcribing the
two independently. `ModuleHeroWave.tsx` takes the other valid route — photo and
wave baked as one asset — and says so at the top of the file. Do not "improve"
either by splitting them.

Everything else lives in `public/illustrations/<surface>/` and is referenced by
absolute path (`/illustrations/…`), which is what `vite.config.ts`'s
`publicAssetBase` plugin rewrites when `base !== '/'`.

### 6.7 Import alias: `@/` across directories, `./` for same-folder siblings

Obeyed without exception. `@/` maps to `src/` in **both** `vite.config.ts:52`
and `tsconfig.app.json`'s `paths` — update them together. Note `components.json`
declares an `@/hooks` alias pointing at a directory that does not exist.

### 6.8 The unwired-control convention — preserve it

A control the design draws but nothing has wired renders as a **focusable,
`aria-disabled` button carrying an `sr-only` reason** — never a silently dead
button, and never omitted:

```tsx
// LessonCards.tsx — the CTA on a module with no content yet
<button type="button" aria-disabled="true" aria-label={label}
        className={cn(shared, 'cursor-not-allowed opacity-60')}
        onClick={(event) => event.preventDefault()}>
  {inner}
  <span className="sr-only"> (coming soon — this module is not available yet)</span>
</button>
```

`aria-disabled` rather than `disabled`, deliberately: a `disabled` button leaves
the tab order, so a screen-reader user never reaches it and never learns the
module exists. The same treatment is on "Play the video"
(`EpisodePanel.tsx`), the resource download (`ResourceCard.tsx`), and the
gated Next controls in the diary and reflection — those last two also render a
visible `BlockedHint` naming the reason.

---

## 7. Terminology that is load-bearing in code

| Term | Rule |
|---|---|
| **Consumer / dyad** | The pair receiving coaching. Consumer-facing copy never uses the word — it addresses the reader as **"you"**. `ConsumerDyad`, `dyadId`, `/consumer/:dyadId` are **identifiers**, not copy |
| **"Client"** | **Coach-facing only. It must never appear on a consumer surface.** Verified: zero occurrences in this package |
| **"Patient"** | Never. The field on `ConsumerDyad` is still `patient` — an identifier — and renders as **PLE** or as the person's own name |
| **PLE** | Person with Lived Experience, the dyad member living with dementia. Never "PLWD", never "patient" |
| **Module** | What content is called on every consumer surface — "My Modules", "Module 4", "Play module". **Internal identifiers still say *lesson*** (`LessonCards`, `LessonView`, `releasedLessons`, `lessons.ts`, the `/learning` route). Deliberate, documented at `ConsumerHeader.tsx:148`. Do not rename on sight |
| **Session numbering** | Internal session numbers are **1–7**; what a reader sees is **internal − 1**. Internal 1 is "Planning" and has **no display number at all**. Always go through `displaySessionNumber()` (`spaces.ts:71`) or `sessionRowLabel()` (`spaces.ts:85`). A raw number on screen is always wrong. See §8.2 |
| **Annotation summary** | The *coach's* SIPTEA reflection about a consumer. Not the consumer's module reflection — see `integration-points.md` §5 before reusing the field |

---

## 8. Known traps

Everything an engineer would otherwise rediscover.

### 8.1 The frozen clock

```ts
// src/data/format.ts:45
export const TODAY = '2026-08-26'
```

**The whole package's sense of time comes from here.** Every "completed" /
"scheduled" judgement is a string comparison against this constant. It is the
single highest-impact seam in the package; `integration-points.md` §2 lists
every site that reads it.

Two things to know before you touch it:

- **`2026-08-26` is not arbitrary.** The demo dyad's plan runs weekly on
  Wednesdays; this is exactly one week after the last completed session (Wed 19
  Aug) and one week before the next scheduled one (Wed 2 Sep). It was moved here
  from `2026-07-22`, which had drifted *behind* the seed — seven invariants
  failed, visible on screen as a session marked "Completed" on a future date.
- **`docs/seed-invariants.mjs` exists to catch that**, and reproduces the
  original seven failures if you move `TODAY` back. Run it after any change to
  `TODAY` or to `spaces.ts`:

  ```bash
  cd app && npx tsx ../docs/seed-invariants.mjs
  # → Seed invariants — frozen clock TODAY = 2026-08-26
  #   26 invariant(s) hold.
  ```

There is **one place the constant is duplicated instead of imported**, and it
will drift: `spaces.ts`'s `healthLog()` hardcodes `const endDate = '2026-07-22'`
while its own doc comment claims it "ends on `format.ts`'s TODAY". It already has
drifted — the demo dyad's health logs currently run `2026-07-05 … 2026-07-22`,
ending 35 days before `TODAY`. This is invisible today only because **nothing in
this portal reads the health log back** (§8.5). The fix is one line:
`const endDate = TODAY` — the file already imports from `./format`.

Home's greeting reads `TODAY`, not `new Date()`, and `ConsumerHomePage.tsx:119-146`
explains at length why. Do not "fix" it back: an earlier version read the real
clock and put "Today is Mon, 14 September" directly above a card calling a
session "Scheduled" for 2 September.

### 8.2 Session numbering is off by one, and one session has no number

`SPACES_SESSIONS` is 1–7: `1 Planning`, `2 Post-Module 1` … `7 Post-Module 6`.
Every store key, every completion record and every plan row uses those internal
numbers. What a consumer reads is **internal − 1**, and internal 1 renders as
the word "Planning".

```ts
displaySessionNumber(5)  // → 4      — "Session 4"
sessionRowLabel(1)       // → 'Planning'
displaySessionNumber(1)  // → 0      — never render this
```

`SPACES_CATCHUP_COUNT` is 6, derived as `SPACES_SESSIONS.length - 1`, and
`lessons.ts`'s `NUMBERED_LESSON_COUNT` is derived from *that*, so "6 modules in
total" cannot drift from the curriculum. Verified: every display site in this
portal goes through one of the two helpers (`SessionPlanStrip.tsx:150,603`;
`ConsumerHomePage.tsx:390,533`). No "Session 0" is reachable.

### 8.3 There are **two rules** for "is module N available", and the portal uses the one with no helper

| Rule | Where | Says |
|---|---|---|
| `moduleUnlockState(index, completed, manualUnlocks)` | `spaces.ts:728` | Module N unlocks once **internal session N** is complete |
| `releasedLessons(dyad)` | `lessons.ts:94` | Every module from the **highest-engaged one** down to 1 is released |

**`moduleUnlockState` has zero callers in this package.** The Consumer Portal
gates entirely on engagement, and `lessons.ts:14-25` records a direct correction
that "marking a session complete has nothing to do with module unlocking". The
two rules happen to agree for the demo dyad today — I checked — but they are two
rules for one fact and they can disagree. **Nothing in this prototype requires you to resolve that** — nothing in it
makes the two diverge. It is recorded because whoever builds the real
module-release endpoint picks one rule and serves it, and because two rules for
one fact is cheap to notice now and expensive to discover later. See
`data-model.md` §6.1 and `integration-points.md` §6.

### 8.4 `AnimatePresence initial={false}` propagates, and kills infinite keyframes

`AnimatePresence` passes its "is this the initial mount" state down through
`PresenceContext` to **every descendant**, not just its direct children. A
descendant running an infinite keyframe array (`animate={{ scale: [1, 1.03, 1] }}`)
snaps to its last frame and never loops.

**An explicit `initial` on the child does not override this** — that was tried
and measured still dead. The working fix is to start the animation imperatively
from an effect with `useAnimationControls()`, which runs after mount, when
presence is no longer "initial". The diary's breathing pillow is the live
example; measured after the fix, 386 style writes in 3.2s.

### 8.5 Fitbit and the sleep-diary history are written and never read

`HealthLogEntry` carries `synced`, `remPercent`, `deepPercent`, `lightPercent`,
`durationMin`, `disturbances` and `diaryEntry`, and the seed generates 18 nights
per person per dyad including a deliberate two-night sync gap and one missing
diary. Grepping all of `src/components` and `src/pages` for any of those fields,
plus `patientLog`, `carerLog`, `HealthLogEntry` and `computeSleepDiary`, returns
**one hit, and it is inside a comment.**

The Consumer Portal's diary flow is **write-only from this interface's point of
view**: it posts 9 answers and shows a thank-you. State this loudly to anyone
scoping the work, because the type surface strongly implies otherwise.

### 8.6 The welcome and the tour are not persisted, so both replay on every full load

Deliberate and documented in all three stores: a first-run screen that appears
once per browser is a screen a reviewer can never look at twice. The consequence
is that a hard reload drops you into the 4-screen welcome, then the 5-screen
tour — and finishing the welcome navigates to Home, so **there is no resume path
from any interruption**. Reloading mid-diary loses the answers *and* does not
return you to the diary.

The related fix that is already in: **all five non-Home pages pass
`showWelcome={false}`**. Landing on `/diary`, `/learning`, `/help`, `/account` or
a module with fresh state used to render the whole welcome over that route, and
its final CTA navigates to Home — so the reader never reached the page they asked
for. Verified live: a fresh load of `#/consumer/dyad-011/help` renders
`<h1>How can we help you?</h1>`; a fresh load of `#/consumer/dyad-011` renders
`<h1>Welcome to Care2Sleep</h1>`.

`ConsumerShell.tsx:263` sets `welcomeDismissed = true` **during render** when a
page passes `showWelcome={false}`. That is deliberate and idempotent — an effect
would run a commit too late and the welcome would paint for a frame on the way
past.

### 8.7 `tsc --noEmit` checks **zero** files here

The root `tsconfig.json` is a solution file with `"files": []`. Measured:

```bash
$ npx tsc --noEmit --listFiles | wc -l
0
$ npx tsc -p tsconfig.app.json --noEmit --listFiles | grep -c '/src'
54
```

Always use **`npx tsc -b`**, which is what `npm run build` runs.

And **a green typecheck is not proof the app builds.** This project once put a
`{/* … */}` comment inside a JSX *attribute list*: `tsc` passed it, Vite's oxc
parser rejected it, and the page went blank behind a clean typecheck.
`ConsumerModulePage.tsx:1385-1387` still carries a comment recording that trap at
the site where it was avoided. Always check the dev server's own transform output
as well.

### 8.8 Focus management is the defect class this project ships most often

Six separate rounds. The rules that came out of it, all present in this code:

- **Under `AnimatePresence mode="wait"`, focus belongs on a callback ref, not an
  effect.** The incoming node mounts a commit *later* than the state change, so
  a `useEffect` keyed on the state focuses the outgoing heading or nothing, never
  runs again, and every transition lands on `<body>`.
  `ConsumerModulePage.tsx:1300` and `ConsumerOnboardingTour.tsx` both use the
  callback-ref form and both say why.
  The welcome flow uses an *effect* — correctly, unusually — because all four of
  its steps are already mounted, so nothing races.
- **Any control that unmounts on click must move focus somewhere deliberate.**
  `main` carries `tabIndex={-1}` as this portal's landing spot; the tour's close
  and the welcome's handover both target `#main-content`.
  `ConsumerAccountPage.tsx` gates a focus move on `justOptedOut` so that an
  already-opted-out reader arriving on the page does not have focus yanked
  mid-document on load.
- **`.focus()` on a `visibility: hidden` element silently does nothing.**
- **Programmatic `element.focus()` dispatches no focus event in a preview
  harness** — `document.activeElement` reads correctly while `focus`/`focusin`
  listeners never fire. Verify focus behaviour with real key presses.

### 8.9 This is not a shadcn app — budget accordingly

Do not scope the rebuild as *"a shadcn app, so the component layer is mostly
free."* Measured: **34 component files, 12,212 lines**, of which
`src/components/ui/` is 112. It is bespoke, frame-accurate, heavily-commented
React with substantial hand-written motion and accessibility work, running on a
brand that deliberately diverges from the app tokens. The shadcn scaffolding is
residue: `components.json`, one `card.tsx` with six unreferenced exports, and an
`@/hooks` alias pointing at nothing.

### 8.10 Smaller ones, in one list

- **`/`, `/consumer` and every unmatched path all land on `dyad-011`.** A valid
  module URL with no content and a typo produce identical outcomes — both
  `<Navigate replace>` to `/learning` with no message, and `replace` means Back
  cannot return. Measured across all 7 module ids plus a bogus one: only
  `daytime-habits` opens.
- **"Switch portal" is a dead loop.** It appears in the account menu
  (`ConsumerHeader.tsx:37`) and the drawer (`ConsumerMenuDrawer.tsx:79`), and
  navigates to `/`, which redirects straight back. A consumer has one portal.
- **"Log out" clears a key nothing sets.** `data/auth.ts`'s
  `signOutOfTraining()` removes `sessionStorage['care2sleep.trainingAuth']`,
  which nothing in this package ever writes, then both callers `navigate('/')`.
- **The research team's phone number on Need Help is a UK Ofcom drama-range
  number on an Australian study** (`ConsumerHelpPage.tsx:70`). The two crisis
  lines beside it — `Call 000` and Beyond Blue `1300 22 4636` — are **real and
  current and must not be swapped for demo values.**
- **Every FAQ answer opens onto "this answer has not been written yet."** The
  questions are plausible placeholders; the answers are honestly absent rather
  than fabricated. FAQ search is behind `const SEARCH_ENABLED: boolean = false`
  (`ConsumerHelpPage.tsx:229`); the matcher is real, the field is not rendered.
- **The console keeps a retained buffer across `location.reload()` and
  `console.clear()`** in preview harnesses. Judge console cleanliness in a
  **fresh tab** only.
- **Tailwind v4 emits `oklab()`/`oklch()`**, so parsing a computed colour string
  as RGB returns nonsense. Rasterise through a 1×1 canvas before computing
  contrast.
- **A Figma PNG export being RGBA does not mean it is transparent.**
- **Animated `height: 0` is not concealment** — collapsed content stays focusable
  and in the a11y tree unless it also gets `inert`/`aria-hidden`.
- **`sr-only` inside a horizontally-scrolling row widens the document.** It is
  `position: absolute` + `white-space: nowrap`, so it escapes the clip.
- **A new grid or flex container needs `min-w-0` on the container *and* its
  cells.** Items default to `min-width: auto`, so one wide child sizes the track
  instead of scrolling inside its own box.
- **Two comments in `index.css` and several across `src/` name files that were
  deleted with the other portals.** They still assert something true about the
  token or the component; only the file pointer is dead.
- **One stale count survives**: `LessonCards.tsx` says "honest for the five
  modules whose content is not built." It is six of seven. The project's standing
  rule is that a stated count is derived, never written — delete the number.

---

## 9. What to build first

In order. Each item unblocks the ones under it.

**1. Auth and session — seam #1.** Everything else is downstream of knowing who
is reading. Today `:dyadId` is a literal in three `<Navigate>` elements. Replace
the redirect with a real session lookup, delete `data/auth.ts`, and give "Log
out" a real teardown. Note the audience constraint before you cost it: these
readers are older and explicitly **not digitally literate**, and a passwordless
or carer-assisted flow is worth pricing against a password form. Note also that
**both dyad members share one account** — the carer is the account holder and one
of them fills the diary "on behalf of you both". See `integration-points.md` §1.

**2. Persist the text-size setting.** The cheapest real win in the package. It is
already a clean module-scoped store with a 5-step ladder
(`src/data/consumerTextScale.ts`); it needs one `localStorage` read at module
init and one write in `emit()`. This is an accessibility setting, offered to an
audience defined by needing it, and today it resets on every load. A reader who
needs 150% needs it every time.

**3. Decide the two open product questions before writing any endpoint.** Both
block real work and neither is a code decision:
   - **Which rule releases a module** — session-completion (`moduleUnlockState`)
     or engagement (`releasedLessons`)? Whoever builds the real endpoint picks one
     and serves it — not a question this prototype needs answered.
   - **Where a consumer's module reflection answers go, and who sees them.**
     There is no field for them on `ConsumerDyad` today, and
     `annotationSummaries` is the *coach's* SIPTEA record — do not reuse it.
     `sharedWithCoach` is collected, gated and then discarded because there is
     nowhere for it to land.

**4. Make time real.** Delete `TODAY`, move every comparison to a server-provided
now, and keep the timezone discipline in `format.ts` — every helper there avoids
`new Date(iso)` precisely because it parses a bare date as UTC and renders the
previous day anywhere east of Greenwich, Melbourne included. "Today's diary" then
becomes a genuine per-day question needing a server-side notion of the consumer's
own day boundary: a diary filled at 00:30 is about *last* night.

**5. Wire the three writes that already have UI.** In increasing order of
blocking: the sleep diary (`submitSleepDiary` already exists and works end to
end — it needs an endpoint behind it), module progress + reflection (needs
decision 3), post-session feedback (needs a "this session has finished" signal,
which today is a demo button).

**6. Then, and only then, the cleanups.** The 40 unreferenced store members, the
six dead `card.tsx` exports, the duplicated `GUTTER`/`CONSUMER_PAGE_GUTTER`
constants, the four near-identical focus traps. None of them affect behaviour and
doing them first makes every diff above harder to read.

---

## 10. How to verify a change

Run all of these. The first two are necessary and **not sufficient**.

```bash
export PATH="$HOME/.local/node/bin:$PATH"

cd app
npx tsc -b        # NOT `tsc --noEmit` — that checks zero files here (§8.7)
npx oxlint        # expect exactly 4 warnings, all react/only-export-components
                  # in ConsumerCanvasWave.tsx:236,241,242,313
```

**3. Read the dev server's own transform output.** A green typecheck is not proof
the app builds (§8.7). Check the terminal running `npm run dev`, and check the
browser console **in a fresh tab** (§8.10).

**4. `docs/layout-audit.js`** — paste into the browser console on the page you
changed and run `layoutAudit()`. **An empty result is the pass condition**;
anything returned is a real finding until proven otherwise. It measures seven
things eyes do not catch: page-level horizontal scroll, a table wider than its
own container, a form control not filling its wrapper, short table text wrapping
because a column is squeezed, controls under the 36px floor, elements past the
viewport edge, and uneven heights across 3+ sibling tiles. It is calibrated to
zero false positives; read its `CALIBRATION NOTE`s before loosening a check, and
record why in the file if you do.

**5. `docs/type-scale-check.mjs`** — run it after **any** change to a
`--text-consumer-*` token. It exits non-zero on breach and takes about 30ms.

```bash
node docs/type-scale-check.mjs
# → Care2Sleep consumer type scale — 18 tokens
#   distinct rendered sizes per width:  375: 6   768: 12   1200: 8   1440: 8
#   Scale is coherent: one interpolation range, no rank reversals,
#   nothing below the floor.
```

It enforces five things: one interpolation range (375→1200) for every fluid
token, no rank reversals between breakpoints, **nothing below 16px**, nothing
heavier than 600, and no flat token inside the fluid scale unless it is in
`ALLOWED_FLAT` with a stated reason.

**6. `docs/seed-invariants.mjs`** — run it after **any** change to `TODAY` or to
`data/spaces.ts`.

```bash
cd app && npx tsx ../docs/seed-invariants.mjs
# → 26 invariant(s) hold.  Seed is internally consistent.
```

It asserts that nothing marked completed sits in the future, nothing scheduled
sits in the past, no health-log entry post-dates the clock, and no module still
reads "in progress" after its own catch-up was held.

**7. Measure, do not look.** Contrast is computed from painted pixels rasterised
through a canvas, never from the authored hex. Focus is verified with real key
presses, never with `.focus()` alone. A stated count is derived from the data,
never typed.
