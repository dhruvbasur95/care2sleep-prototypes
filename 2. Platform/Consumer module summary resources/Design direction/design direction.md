# Design direction — Consumer module summary resources (print)

**Read this before designing, building or editing any downloadable print document
for consumers** — every module summary PDF, and any other print piece made for
people living with dementia and their care partners. It is the standing brief.
Decisions made with the user are recorded here as rules; module-by-module progress
goes in `1. Start here/handover.md` and `progress-log.md`, never here.

---

## 0. The approved reference: Module 1 sample pages

**The finished Module 1 resource, `Module 1/Resource/index.html` (and its PDF), is now the visual reference**
(2026-11-26). It grew out of the sample pages approved on 2026-11-25 (*"good I like this direction … keep this
document as reference"*); the sample's images were binned before the first commit, so `Module 1/Sample pages/` is
text-only history. The table below describes the sample pages as approved.
Build every new resource to look like it; when this file and the sample disagree, the
sample is the later decision. View it with the `consumer-print-resources` server
(`.claude/launch.json`, `preview_start`), never `file://`, which loads no fonts.
Press **G** to show the grid.

| Page | What it shows |
|---|---|
| 1 Cover | Care2Sleep logo, "Module 1", title, sleeping pillow on a flat yellow band, Monash logo |
| 2 Contents | One even row per section: page number, "Chapter N", title |
| 3 Module opening | Goals as numbered rows; "What you will learn" in a deep purple panel with the awake pillow (`purple-200` ground) |
| 4 Chapter opener | `purple-50` page, title top left, generated painting edge to edge at the bottom with a soft repeating wave edge |
| 5 Text + figure | Section title + subtitle tight, body, the sleep cycle cut out on a lilac panel |
| 6 Steps | The three NREM stages: pictures zig-zag, titled steps, dotted curve with arrows |
| 7 Image + key points | REM picture on white, Module 7 highlighter, two key-point panels with their own icons |
| 8 Lists | Lead-in list in two columns inside a lilac panel |
| 9 Reflection | Pillow beside a question bubble, full-width write-in lines |

Every text page: grey running head with the section name only, page number in a
brand tab hanging from the top edge.

**In one line each — the approved look:** left-aligned, full width, traditional;
Atkinson headings in purple, Inter body 13/18; white text pages, light-tint chapter
openers; flat panels at an 8 pt radius; pictures on white or a deliberate lilac panel,
never cropped, never faded in code; no blobs, no dashes, no repeated icons; the words
of the source exactly as written.

---

## 1. What these documents are

- One downloadable **Resource** per consumer module — the "Download the resource" CTA
  on the module summary screen. Call it a **resource** in any reader-facing copy,
  never a "guide" (CLAUDE.md terminology).
- **Readers:** people living with dementia and their care partners, many of them
  older and **not digitally literate**. They will read it on screen *and* print it at
  home. Design for a reader who is tired, possibly low-vision, holding a printout.
- **Standard:** it must look like it was designed by a professional print designer —
  calm, confident, generous, and consistent page to page.

## 2. Non-negotiables

1. **The words never change.** Every word in the source document appears in the
   resource, in the same order, spelled the same way. Typos, repeats and wording
   problems are **flagged to the user, never fixed silently** — the user decides.
2. **Structure may be clarified, words may not.** Turning a misplaced bullet into a
   lead-in, a source table cell into a key-point box, or an "[icon]" placeholder into
   a real icon is structure. Even so, list each structural change for the user before
   building.
3. **Every chapter starts on a new page.**
4. **No widows, no orphans** — see §6.
5. **A strong grid** governs every page — see §4. Nothing is placed by eye.
6. **A professional type hierarchy and spacing system** — see §5. A fixed, small set
   of sizes and spaces; no one-off values.
7. **Care2Sleep branding** — colour, type and imagery style from the product — see §3.
8. **Icons where they help**, from `lucide`, the app's own icon library — see §8.
9. **Always left-aligned, always the full text width** (direct instruction,
   2026-11-25, on the first sample pages). Text, headings, lists, panels and the
   running head all start on the left margin and run the full width between the
   margins. Page numbers in the contents sit **before** the entry.
10. **Traditional and familiar.** Plain, calm layouts a reader understands at once.
    See §2a for what this rules out.

## 2a. What not to do

Things the user has said they **don't** like. Each one is a rule. Check every page
against this list before showing it. Add to it whenever the user rejects something,
with their words and the date.

| Don't | User's words · date |
|---|---|
| **Contemporary design**: fashionable, editorial or "designery" layouts, and decorative devices a reader has to interpret | *"end users are not someone who will cherish contemporary design"* · 2026-11-25 |
| **An indented reading column**: text pushed in from the left margin with an empty side column (the "hang") | *"we always left align, and use full page width"* · 2026-11-25 |
| **Centred or right-aligned text**, including page numbers flush right in the contents and a running head split left and right. (The agreed exceptions, all asked for by the user: the page-number tab at the top right, "Module N" at the right of the running foot, and the QR caption centred under its code on the back page, §7) | same instruction · 2026-11-25 |
| **Random blobs or free-form shapes**: decorative circles, wobbly hills, shapes behind text. Bands and backgrounds are flat rectangles with straight edges | *"i dont like random blobs"* · 2026-11-25 |
| **Organic or uneven corners on panels and boxes.** One clean, even, small radius on every container: **8 pt** (`--radius`). This overrides the organic edge in ref-05 | *"lets not use organic shapes, keep the container edge radius clean, and reduce edge radius"* · 2026-11-25 |
| **Repeating icons.** Each icon appears once in a document (the one exception: the question icon on every question, below), and each one matches what its block says (a cycle for "90-minute cycles", a battery for "restoring energy"). Never one stock icon on every box of a type | *"always make sure not to use repeating icons"* · 2026-11-25 |
| **Images on a dull background**: grey, dull yellow, cream paper or a painterly wash behind the artwork. Images sit on **pure white**, or on something deliberately bold | *"images to either have a completely white background or something that stands out, never a dull grey, dull yellow or dull painterly effect"* · 2026-11-25 |
| **A page colour that doesn't match the image background.** Text pages are paper white `#ffffff`, so white-ground images sit on them with no visible edge; chapter openers are the light tint, and their painting meets it through the wave | *"the image backgrund does not sites well page background so keep it white"* · 2026-11-25 |
| **A decorative shape behind a heading or text** | same instruction · 2026-11-25 |
| **Em dashes**, and en dashes used as dashes, anywhere. Where the source has one, replace it with a comma or colon and list the change for the user | *"whereever you find em dash, remove"* · 2026-11-25 |
| **A chapter marker with a rule and a count** ("Chapter 1 ——— of 4"). Just **"Chapter 1"** | *"I dont like this ———— of 04, just chapter number s fine"* · 2026-11-25 |
| **A gap between a title and its subtitle.** The subtitle belongs to its title: nothing between them but their own line spacing (the title's line box sits directly on the subtitle's) | *"the gap between title and sub title should be reduced"* · 2026-11-25 |
| **Content crowding the running head.** Keep at least 30 pt clear between the running-head rule and the first line of content | *"space between the header and content should be increased"* · 2026-11-25 |
| **An image that doesn't fill its frame**: a letterboxed image, a border or background baked into the file, or any gap between the artwork and the frame edge | *"always make sure the image scales 100% to the container, there are no background visible"* · 2026-11-25 |
| **Clutter: the same thing shown twice.** Text listing Stage 1, 2, 3 followed by a picture strip of Stage 1, 2, 3 reads as messy. Put each picture beside its own text instead | *"this section looks cluttered, messy"* · 2026-11-25 |
| **Cropped images**: a frame that trims the picture, or a cut-out that slices through the drawing | *"make sure images are never cropped"* · 2026-11-25 |
| **The same layout reflex every time**: one style (a vertical timeline, two columns) applied by default instead of chosen for the content | *"re-think this … dont just re-use the vertical style UI"*, *"not always it should be 2 column"* · 2026-11-25 |
| **Steps without titles** | *"if using this style always important to have titles"* · 2026-11-25 |
| **Arrows that don't sit on their line**: a different colour or style from the dots, or a gap between the last dot and the arrow | *"arrows not visually sitting properly with dotted lines"* · 2026-11-25 |
| **A narrow write-in space**: lines indented or sharing the width with an illustration | *"when add space for user to write use 100% width"* · 2026-11-25 |
| **An uneven contents page**: one entry carrying a long list of sub-sections while the others carry none | *"keep table of content consistent, chapter one has so many items"* · 2026-11-25 |
| **Characters just standing there**: a cast-sheet line-up, posed figures doing nothing | *"I dont like this, just showing standing characters, they should be chapter relevant doing something"* · 2026-11-25 |
| **The pillow's ground base or its "zzz" in a scene** | *"pillow should not have lower base, or zzz"* · 2026-11-25 |
| **Dead space between a title and its picture** | *"I dont want dead space between text and image"* · 2026-11-25 |
| **A boxed or framed picture on a chapter opener**: hard rectangular edges, rounded frame | *"the chapter cover image should have a painter effect, should seamlessly merge with the page"* · 2026-11-25 |
| **The pillow mascot on chapter openers** | *"remove pillow, not needed"* · 2026-11-25 |
| **A character at the bottom edge of the page**: a figure cut off by, or resting on, the page's bottom edge | *"never any character at bottom of the page"* · 2026-11-25 |
| **A faked or stretched picture**: sky or background extended by repeating the painting, a heavy dark wash block, an airbrushed or blurred edge standing in for a real watercolour edge. When the art doesn't fit the layout, **generate art composed for it** | *"this is exactly what I dont want"* (on the extended night-sky opener) · 2026-11-25 |
| **A digital fade or vignette on a picture**: gradient masks, feathered or blurred edges added in code. A soft edge must be **painted into the artwork itself** (a watercolour wash that ends on the paper), so it reads as painting, not as an effect | *"remove fade effect, it should be the image painterly effect"* · 2026-11-25 |
| **Over-detailed chapter images**: busy rooms, lots of props, fine patterns, extra figures. A chapter image is simple: the people and one or two things that tell the story, on a calm, plain ground | *"for chapter images rule is not to make is too detailed"* · 2026-11-25 |
| **A picture inside a pillow (or any shaped) frame on a chapter opener** | *"okay we never do this, revert back"* · 2026-11-25 |
| **A wordy running head**: module title plus chapter plus separators | *"too wordy, just chapter – name"* · 2026-11-25 |
| **Labels or annotations on review pages**: no page names, reference notes or tool bars around sample pages shown to the user. The pages alone. | *"I dont want to see any labels"* · 2026-11-25 |
| **A bottom stroke under the last item** of a ruled list (contents rows, the ingredient rows, any list with hairlines between items). Rules go **between** items only | *"last item never to have a bottom stroke"* · 2026-11-26 |
| **A question without the question icon.** Every question asked of the reader (reflection prompts, closing questions) carries the **question mark in a speech bubble** (lucide `message-circle-question`), never a topic icon (a scale was tried) and never a number badge. This is the **one icon allowed to repeat** | *"whenever asking question, always use a ? inside a speech bubble icon"* · 2026-11-26 |
| **A solid or filled pillow face.** The pillow's expression may change from scene to scene, but its **eyes, nose, mouth and eyebrows are always drawn as outlines** (line strokes), as in the app's mascot | *"you can play with pillow face, making sure eyes nose, mouth, and eyebrows are always outline style"* · 2026-11-26 |
| **A cover picture that floats on white**: an object or scene placed in the middle of the page with no ground and no wash. Every cover keeps Module 1's composition: a ground running edge to edge along the bottom and a wash rising from it, fading up into white paper, the picture in the lower part of the page | *"its not on same lines as module 1, i.e. gradual fade/bottom/lower third image"* · 2026-11-26 |
| **The man from the Module 7 knowledge video** in any resource art | *"dont use the male person from module 7 knowledge video"* · 2026-11-26 |
| **An icon on every box by reflex.** A key-point box gets no icon when the content right above it already carries icons (the three ingredient rows), and an icon is never placed where it can't share the left edge of the icons above it | *"not necessary a box like this will need icon, as the content above already has so many icons, also this icon in yellow box does not align vertically left to the once above, so best not to add in such instance"* · 2026-11-26 |

## 3. Brand

### Colour

Figma (`xhAPgU8I5GzG9UDPHqJrnj`) is the source of truth for every colour. The values
below are the app's current tokens; **re-read the Figma paint styles live before a
new document is built** and never amend a Figma style.

| Role | Token | Hex |
|---|---|---|
| Brand purple (headings, accents) | `consumer-primary` / `Purple/500` | `#3a00ad` |
| Purple tints (panels, rules) | `purple-50` · `purple-200` · `purple-300` | `#f3efff` · `#e4d6ff` · `#c2a3ff` |
| Deep purple | `purple-900` / wave deep | `#200061` / `#2a0379` |
| Yellow ramp (highlights, key points) | `yellow-50` · `100` · `200` · `400` · `500` | `#fff8e5` · `#fff0cc` · `#ffe299` · `#ffcc4d` · `#ffb600` |
| **Page (print)** | paper white | **`#ffffff`** for text pages (2026-11-25: the screen `page-canvas` `#fffcfa` is not used in print) |
| **Chapter opener page** | `purple-50` / `yellow-50` | `#f3efff` / `#fff8e5`, chosen to suit the painting |
| Running head | `ink-faint` + hairline | `#6d6d6d` (5.17:1 on white) + `#e0e0e0` |
| Step connectors | `purple-400` | `#a070ff` (dots and arrowheads) |
| Highlighter | Module 7 knowledge video | **`#ffdd75`** (sampled from shots 260 and 490; not a Figma style yet) |
| Body text | `ink` / `ink-muted` | `#1a1a1a` / `#333333` |
| Hairlines | `neutral/lighter-grey` | `#e0e0e0` |

- Purple carries structure (headings, chapter numbers, rules); yellow carries
  emphasis (key points). Keep the palette restrained — no colours outside it.
- **Contrast is measured, not assumed:** body text 4.5:1 minimum against its actual
  background, 7:1 preferred for this audience.
- **It must survive a greyscale home printer.** Meaning is never carried by colour
  alone, and tinted panels must still separate from the page in greyscale.

### Type

| Use | Family | Decided |
|---|---|---|
| Headings, cover, chapter openers, key-point boxes' lead | **Atkinson Hyperlegible Next** | 2026-11-25 |
| Body text, lists, captions, write-in prompts | **Inter** | 2026-11-25 |

Both are already in the project (`@fontsource-variable/atkinson-hyperlegible-next`,
`@fontsource-variable/inter`) and must be **embedded** in the PDF.

### Imagery

- The Care2Sleep illustration style: **soft watercolour and ink**, the same artwork as
  the knowledge videos and modules. Never stock photography. The paper ground the art
  is painted on is **removed or made transparent** for print (see below); it never
  shows as a cream or grey patch. The pillow mascot is the one flat-vector element.
- **Use clean originals only.** Never a screenshot of a Figma storyboard card (those
  carry titles, "Image pending" and narration text), never an image copied out of a
  Word doc when the original exists. Originals for the coach videos live in
  `3. Coaching modules/13. Knowledge and scenario video pipeline/Knowledge video workflow/…/03_Images/`.
- **Resolution: 300 ppi at placed size**; below 200 ppi is flagged to the user before
  use, with the placed size stated.
- **Keep the PDF small** (direct instruction, 2026-11-26: *"no dont make 4k, as we need to be minndfull of PDF size"*). Generate paintings at **2K, never 4K**; 200 to 300 ppi placed is accepted for paintings (the Module 1 cover is 217 ppi). Compress images for the PDF rather than upscaling.
- Where the source says to combine shots, combine them as one composed figure, or (as
  with the NREM stages) put each part beside its own text. **No added captions**: the
  words never change, so a figure carries only its alt text.
- **Every image merges with the page it sits on** (direct instruction, 2026-11-25: *"images
  should always accordingly merge with the page, and theme set accordingly"*). Its ground
  is either the page colour itself or transparent, so there is never a visible edge where
  picture meets page. Save cut-outs and faded edges with **transparency** (RGBA PNG), not
  baked onto white, so the same file works on white, `purple-50` and `yellow-50`. Pick the
  page tint to suit the picture's palette.
- **Every image sits on pure white, or on a deliberate brand panel** (the user's
  suggestion, 2026-11-25: *"images can have background also"*). A panel is a flat
  `purple-50` block with the 8 pt radius and 18 pt padding, with the artwork cut out
  onto it (paper ground made transparent, tightly cropped). It must look chosen, not
  dull: never grey, beige or a painterly wash.
- **The white treatment:** Before placing it, replace the artwork's paper
  ground (cream, grey, painterly wash) with `#ffffff`: estimate the ground colour from
  the image's border, fade anything close to it to white, and keep the illustration.
  Check by eye afterwards that no part of the artwork was eaten (a pale wash, a thin
  line) and that no fragment of a neighbouring drawing is left at a crop edge.
- **An image that exists only as a small Word copy is re-created, never upscaled** (direct instruction, 2026-11-26:
  *"for images, re-create them, keeping visuals exactly as is, only background changes"*): regenerate it at 2K from the
  Word copy as reference, with every element kept and only the paper ground turned pure white. Use a clean original
  first wherever one exists.
- **Every image fills its frame, and an image is never cropped** (direct instructions,
  2026-11-25: *"always make sure the image scales 100% to the container"*, then
  *"make sure images are never cropped"*). Strip any border or background baked into
  the file first (Word-doc copies often carry one). Then the **frame takes the image's
  own proportions** (`height: auto`); never `object-fit: cover`, which trims the edges.
  When cutting a part out of a larger picture, find the artwork's real edges by
  measurement and pad around them; a crop line must never pass through the drawing.
  If the true proportions don't fit the page, change the layout, not the picture.

## 4. Grid system

A strong grid is required (direct instruction, 2026-11-25). It has three layers, and
every element on every page snaps to them:

1. **Baseline grid.** Every line of text — body, headings, captions, list items and
   the write-in rules — sits on one shared baseline increment. Lines register across
   facing pages and through the sheet.
2. **Column grid.** A fixed set of columns and gutters inside fixed margins. Text
   blocks, images, key-point boxes and icons start and end on column edges.
3. **Spacing scale.** Every vertical space (between paragraphs, before and after
   headings, around boxes and figures) is a whole multiple of the baseline,
   drawn from a short named scale.

Images are sized to whole columns wide and whole baselines tall.

**Working values (used in the first sample pages, 2026-11-25; not yet signed off):**
A4 portrait · margins 54 pt left and right · text area starts 72 pt from the top
(30 pt below the running-head rule) and is 487.28 × 702 pt (39 body lines) ·
12 columns, 12 pt gutter (column 29.607 pt) · baseline 6 pt · body 13/18 pt Inter
across the full width (about 70 characters a line) · spacing scale 6 · 12 · 18 · 24 ·
36 · 48 · 72 pt. Running head in the top margin (section name left, page-number tab
right); running foot in the bottom margin (§7). These values are the ones the approved sample
pages use (§0).

**Values — to be signed off with the user, then recorded here as final:**
page size **A4 portrait, 210 × 297 mm** (decided 2026-11-25) · margins · columns ·
gutter · baseline · spacing scale. The grid is shown to the user as an empty page plan
and signed off **before** any page is designed on it.

## 5. Type hierarchy and spacing

- A small, fixed scale — roughly: cover title · chapter title · section heading ·
  sub-heading · body · key-point text · caption/label · running head/folio. Every
  step has one size, one weight, one leading, and a fixed space above and below.
- **Legibility for this audience:** body text at least **12 pt**, with generous
  leading; nothing reader-facing below 10 pt. Left-aligned, ragged right — **never
  justified** (uneven word gaps hurt older readers). No all-caps running text, no
  italic for long passages.
- Measure (line length) about 55–75 characters for body text.
- Headings are sentence case (project rule), except where the source capitalises a
  defined term (e.g. "Sleep Drive").
- Hierarchy is made by size, weight, colour and space — not by underlines or boxes
  around headings.

## 6. Widows, orphans and breaks

Checked page by page on the **rendered PDF**, not assumed from CSS:

- **No widow or orphan:** never a single line of a paragraph alone at the top or the
  bottom of a page. Minimum two lines either side of a break.
- **No runt:** never a single word alone on a paragraph's or heading's last line.
- **A heading is never the last thing on a page** — it always keeps with at least two
  lines of what follows.
- **Key-point boxes, figures with their captions, and a write-in prompt with its
  lines are never split** across pages.
- A list's lead-in stays with its first item.
- **Every chapter starts on a new page.**

## 7. Recurring components

Each is designed once and reused identically in every module:

| Component | What it holds |
|---|---|
| **Cover** | **One frame, ref-12** (2026-11-26): a white page and a painting on white paper that fills the page edge to edge from the bottom, **no wave, no border** (a wave was tried: *"the wave makes the page look un-even"*). Care2Sleep logo (120 pt) top left and **no partner logo on the cover** (the Monash logo was tried top right and removed, 2026-11-26: *"remove monash logo from cover page"*; partners live on the back page), then "Module N" and the title **left-aligned and laid over the painting's open white top** (centring was tried and reverted: *"left align text back"*). The painting is composed for this: the scene low, rising at the sides, the upper left empty paper. **"Module N" is set exactly like a chapter opener's "Chapter N"** (Atkinson 18/24 bold purple, 18 pt above the title; *"font size does not match chapter intro chapter<> font"*). **The cover painting replaces the flat pillow mascot** (*"remove pillow, and add module 1 relevant image matching chapter style imagery"*) and differs from chapter art in two ways: it is **a little more colourful** to catch the eye, in **purple and yellow hues only**, still simple and uncluttered; and **the pillow is painted into the scene** as a real pillow with its face, never the flat mascot with its "zzz" or ground base (*"integrate pillow as part of the image"*). Module 1: OpenArt `0iKyZlZB7KW24BiL02Wd` (Nano Banana Pro, 3:4, cast sheet + a clean pillow reference), the pair sitting on the bed at night while the care partner plumps the one smiling pillow, the older woman in a **golden cardigan so she stands out from the purple wall** (*"the lady clothes also match background"*), a tall moonlit window on the right, the upper left open white paper; file `Resource shell/module-1-cover.png`, 217 ppi placed. Earlier versions (extra pillow, lavender cardigan, a hard painted wall block) were rejected and removed. **This cover is the approved style for every module's cover** (direct instruction, 2026-11-26: *"this direction for the cover image looks great, keep same stlyle"*): white paper as the page, a simple warm scene with the pair and the painted pillow low in the frame rising at the sides, purple and golden hues, the upper left left open for the live title. **The subject need not be a room or people** (direct instruction, 2026-11-26, Module 2: *"I dont want bedroom or living room scene, and not necessary it needs to have characters, can be something to do be brain, training, + add avatar"*): it is the module's idea, with the pillow avatar painted in. Module 2: a purple and golden brain holding a little bed under the moon, golden stepping stones, the pillow; OpenArt `bQIGIFGiqJZoG6pxyII0`, made with the Module 1 cover as the composition reference |
| **Contents** | One row per section, every row the same shape: page number, then "Chapter N" where there is one, then the title (ref-10). **The page number aligns to the top of its row, not the middle or the bottom** (direct instruction, 2026-11-26: *"align number top not centre"*). **Every row ends the same distance below its title** (24 pt, with 24 pt above its first line: widened from 12 on 2026-11-26, *"increase space between rows"*), so a row without a "Chapter N" label is simply shorter, never padded to match (direct answer, 2026-11-26). **No sub-section lists**, so no entry is longer than the others (direct instruction, 2026-11-25: *"keep table of content consistent"*). Sub-sections live in the PDF bookmarks instead |
| **Module opening** | Goals and What you will learn |
| **Chapter opener** | A page of its own on the light tint (`purple-50` or `yellow-50`, to suit the picture). "Chapter N" and the title left-aligned, **sitting just above the wave** (**about 64 pt clear of it**: 130 pt read as dead space, 20 pt as too tight, 48 pt then opened by another 16; direct instructions 2026-11-25), with the open tint above them. The chapter's painting fills the **bottom of the page edge to edge**, uncropped (`height: auto` at full page width), down to the page's bottom edge. **Its top edge is a soft, even, repeating wave** where it meets the tint, like ref-11 (`References/ref-11-wave-edge-band.webp`, there with the picture on top; here it sits at the bottom): the page tint drawn over the picture's top in 3.5 even crests across the page, 18 pt crest to trough (direct instruction, 2026-11-25: *"what I was after I have attached reference … in this case the image stays at bottom"*). The painting is **generated for the chapter** in the house style (`nano-banana-pro`, cast sheet attached, 2K), kept **simple** (the people and one or two story objects on a plain wash), people centred with floor below them, no text; its paper border is trimmed off. No pillow mascot. Chapter 1: OpenArt `3vVwwnkPBEmCXNLVotiP`, version B (`gen-ch1-b-trim.png`), the care partner tucking the older woman in. **Characters may be a man and a woman** (direct instruction, 2026-11-26, Module 2: *"change characters, use male, female"*): the man is the project's Module 6 cast man (`3. Coaching modules/07. Image generation/visual-references/01-cast/person-with-lived-experience/ple-male-m6-ch1-s170-calm-mind-and-body.png`, balding, short grey beard), the woman the pair-A care partner (curly dark hair, blue shirt); never the Module 7 video man (§2a). **Trim the paper edge on all four sides until no paper shows**, or a deckled white strip lands on the page bottom |
| **Section heading** | Atkinson 22/30 bold purple; a subtitle (lead) sits directly under it with no extra gap; 30 pt+ clear of the running head |
| **Key-point box** | The source's single-cell highlighted tables. Flat colour panel, 8 pt radius, Atkinson 14/24 semibold: the first in deep purple (`#3a00ad`, white text, yellow icon), the next in pale yellow (`yellow-100`, deep purple text, purple icon). One content-matched lucide icon each, never repeated, **except** when the content directly above already carries icons: then no icon (§2a, 2026-11-26) |
| **Figure** | Image on the grid at its own proportions (never cropped), on white or a lilac `purple-50` panel; placed at the head or foot of the text it belongs to; alt text, no caption |
| **Reflection prompt** | The awake pillow beside a lilac speech bubble holding the question-mark icon and the question (Atkinson 15/24 purple), then full-width ruled write-in lines (§9) |
| **Steps / process** | Any sequence (Stage 1, 2, 3). **Not** a plain vertical timeline (*"dont just re-use the vertical style UI"*). Each step's picture zig-zags down the page (left, right, left), its text beside it, joined to the next by a **flowing dotted curve** through the gap between rows (*"a flowy dotted line connecting stages"*). **A process gets arrows** (*"when showing a process add arrows also"*): a small solid triangle in the dots' own colour (`purple-400`), sitting on the last dot, with the dots spaced so one always lands exactly on each end. **Every step has a title** (*"always important to have titles"*): "Stage 1" in the heading face above its text. All 2026-11-25 |
| **Lists** | Purple disc bullets, with a lead-in where the source has one (set as the list's bold purple lead, inside a lilac panel for a lead-in list). **Mix one and two columns** (*"not always it should be 2 column"*): two columns only when the items are short and pair up evenly; long or odd-numbered lists stay one column. Two-column lists read across, row by row |
| **Highlight** | Words the **source** sets in bold. The Module 7 knowledge-video highlighter: `#ffdd75` block, corners rounded at ~0.17 of the text height, a little padding, the words in their normal weight and colour, each wrapped line its own block (direct instruction, 2026-11-25) |
| **Running head + folio** | The running head names **only the section**: "Chapter 1: Understanding Sleep", "What You Will Learn" (never the module title as well; direct instruction, 2026-11-25: *"too wordy, just chapter – name"*; a colon, not a dash). It is **grey**: `ink-faint` `#6d6d6d` text (5.17:1 on white, measured) over a `#e0e0e0` hairline (*"change to grey"*). Left-aligned in the top margin. **The page number sits top right, in a solid brand tab** (`#3a00ad`) that **starts at the page's top edge and hangs down** to just below the running-head rule (0 to 46 pt), 30 pt wide, aligned to the right margin, **its bottom a full half-round** (radius = half the width, 15 pt; direct instruction, 2026-11-25: *"make it full curve"*), the number in white 11 pt semibold at its foot (direct instructions, 2026-11-25: first *"just text in grey medium weight"*, then *"the number can sit inside a shape that is blue filled"*, *"that shape touches top of page and comes down"*). The rule stops short of the tab. Neither appears on the cover or chapter openers. **Numbering starts at the module opening ("What You Will Learn") as page 1**; the cover and the contents page are front matter and carry **no number and no running head** (direct instructions, 2026-11-26: *"start page number from what you will learn i.e. it becomes page 1"*, then *"no need for header for content page"*) |
| **Running foot** | On every page that has a running head, **and on the contents page** (which has no head; direct instruction, 2026-11-26: *"add lower footer to content page also"*). **Not** on the cover or a chapter opener. the same grey `#e0e0e0` hairline as the head, margin to margin, with **"Care2Sleep" left-aligned and "Module N" right-aligned** under it (no slash; direct instruction, 2026-11-26: *"remove / and move module<> on right"*), in the head's own type (`ink-faint` `#6d6d6d`, Inter 10/12 medium). The text sits 24 pt from the page bottom, mirroring the head's 24 pt from the top (direct instruction, 2026-11-26: *"except cover page, content page, chapter cover page, I want the same light grey horizontal stroke and below left aligned Care2Sleep / Module 1"*) |
| **Back page** | The last page of every resource, on **`yellow-50` `#fff8e5`** (direct instruction, 2026-11-26: *"last page background y50"*). **No running head, no running foot, no page number** (a header was tried and removed the same day: *"remove header"*, 2026-11-26). The **Care2Sleep logo centred** across the page (240 pt wide), **96 pt above the vertical centre** (*"move care to sleep logo a little up"*, then *"move further up by another 48px"*). **Left column, top aligned to the QR code:** "Contact us:" (same label style) with the contact email **directly** under it in body type (Inter 13/18), no gap (*"reduce space"*) (direct instruction, 2026-11-26: *"top aligned to the QR code, add another field on left Contact us: and below add dummy email"*). ⚠️ The email is a **placeholder** (`research.team@care2sleep.example.au`) until the user supplies the real one. **Bottom left:** "Project Partners:" (Atkinson 12/18 bold purple), then the partner logos in a row: **Monash University in black**, 84 pt wide (`monash-university-black.svg`, the app's white logo with its fill set to black, nothing else changed) and **Dementia Australia**, 98 pt wide, 24 pt apart (`dementia-australia-logo.svg`, the official file from dementia.org.au, unaltered navy). **Bottom right:** a 96 pt QR code in **ink `#1a1a1a`** (purple `#3a00ad` was tried and reverted, 2026-11-26: *"black was better revert"*), sitting straight on the page tint with no white plate, with **"Scan to visit the project website"** under it (Inter 10/12, **centred under the code**: *"centre align text"*, 2026-11-26). Both groups sit on the bottom margin. ⚠️ The QR's URL is a **placeholder** (`https://example.com/care2sleep`) until the project website exists |
| **Comparison** | Two opposed statements from the source ("BED = AWAKE, WORRY, FRUSTRATION VS. BED = SLEEP, RELAXATION"): inside the pale-yellow key-point box, two white cards side by side (8 pt radius), each a small "BED =" label (Atkinson 12/18 bold purple) over the words (Atkinson 16/24 bold `purple-900`), with "VS." in a 36 pt `purple-500` disc between them (white 11 pt, 11.78:1). Words and order unchanged (direct instruction, 2026-11-26: *"re-imagine how to show same in different way, while still keeping same yellow box"*) |
| **Formula line** | A source line written as an equation ("Bed + sleep = strong sleep connection"): Atkinson 15/24 bold on a flat lilac or pale-yellow strip, 8 pt radius, after its lead-in sentence (Module 2) |
| **Picture list** | A short list where each item has its own picture (Module 2's bed habits): one row per item, a 108 pt picture beside the text, hairlines between rows only |
| **Closing** | "Bringing it all together" recap and its reflection prompts |

## 8. Icons

- **`lucide` only**, the app's own library — never a hand-drawn or invented glyph.
- Used where they aid wayfinding: reflection prompts and every other question (the question icon, the only icon that repeats), key points,
  chapter markers. Not as decoration on every paragraph.
- One stroke weight (2) and one size (24 pt) per role; brand purple, or yellow on a deep
  purple panel. **Never the same icon twice in a document**, except the question icon on every question. Decorative icons are
  marked as artifacts in the tagged PDF.

## 9. Write-in spaces

Decided 2026-11-25: **printed ruled lines *and* fillable form fields.**

**The output is always a PDF, and every write-in space must be an editable text field
when the PDF is opened in Adobe Acrobat / Acrobat Reader**, so a consumer can type their
answer on screen (direct instruction, 2026-11-25: *"the output will be PDF and you will
always make sure the pdf when opened in adobe the text field is editable i.e. consumer can
enter text"*). A resource whose fields don't accept typing in Adobe is not finished.

- Ruled lines sit on the baseline grid, with enough lines for a real answer, and
  **always run the full text width**, margin to margin (direct instruction,
  2026-11-25: *"when add space for user to write use 100% width"*). Nothing beside them.
- Each has a matching fillable **multi-line** text field (AcroForm) over its lines, named
  after its question, sized to the lines, scrolling off, font readable (≥ 12 pt), so a
  reader can type on screen and save. Check by actually typing into **every** field in
  Adobe Acrobat Reader, saving, and reopening; then check macOS Preview too.
- The PDF must not be flattened, secured or printed-to-PDF after the fields are added:
  any of those strips the fields.

## 10. Accessibility of the file

- Tagged PDF with a correct reading order, real headings and lists.
- Document title, language (`en-AU`) and author set in the metadata.
- Alt text for every meaningful image; decorative art marked as an artifact.
- Fonts embedded; text is real text, never outlined or rasterised.

## 11. Production

- **The build tool is chosen** (2026-11-26): the module's `Resource/index.html` is printed to a tagged PDF by headless **Google Chrome** (A4, `@page` margin 0, one `.page` per sheet, `en-AU`), then `Build tools/add_fields.py` (pypdf) adds the multi-line answer fields (from `pdf-fields.json`, positions measured live in pt), the bookmarks (from `pdf-outline.json`, the contents page's sections) and the metadata. Run `Build tools/build-pdf.sh "Module N" "<file name>.pdf"` with the `consumer-print-resources` server up. The PDF title comes from the page's `<title>` and the subject from the `Module N` folder (2026-11-26), so nothing in the tool changes per module. Paintings are placed as **JPEG** copies (quality 82): Module 1 went from 27 MB of PNG to 2.8 MB, and its PDF is 4.8 MB.
- **Known limits, accepted 2026-11-26:** the fonts are variable fonts, so Chrome embeds the text as Type3 glyphs (it reads, selects and extracts fine; the user declined installing `fonttools` to cut fixed weights). Typed answers use the field's own line spacing (about 14 pt), not the printed 30 pt rules. The answer fields are not yet in the PDF's tag tree. Number ranges (`4-6`, `20-30`, `90-minute`) are kept on one line with `.nobr` so they never break at the hyphen.
- **Shared shell assets live in `Consumer module summary resources/Resource shell/`**, not in a module folder (direct instruction, 2026-11-26): the partner logos (`monash-university-black.svg`, `dementia-australia-logo.svg`), the QR code (`qr-project-website.svg`, a static vector file, placeholder URL) and the module cover paintings. Every module's resource links to these one copies, so a logo or QR change is made once.

- Built from source (HTML/CSS paged media or equivalent) so a corrected source doc can
  be re-flowed, never hand-assembled page by page. The tool is chosen at build time
  and must support: page breaks, widow/orphan control, running heads, embedded fonts,
  tagged output and fillable fields.
- One folder per module: `Module N/` holds the source (`.docx` + `.md`), its images,
  the build source and the output PDF.

## 12. Visual references

`Design direction/References/` holds the visual references the user supplies for
print work. **Study every file in it before designing**, and name which reference a
design decision draws on. References set the *standard and feel*; this file's rules
(brand, grid, verbatim content) still win where the two disagree — raise the conflict
with the user rather than choosing.

### Reference notes

Each entry: the file, **what the user said they like** (their words), and what is
observed in it. Only the liked quality is a direction; the rest is context.

**ref-01 — `ref-01-highlighted-words.png`** (2026-11-25)
- **User likes:** *"how certain words are highlighted."*
- Observed: a large pull quote, set ragged in a clean geometric sans, in deep
  purple/navy on a warm cream page. A few key phrases ("driven and", "passionate",
  "fun, interesting", "and dynamic") sit on **flat, solid coral blocks**, like a
  highlighter pen but crisp. The block hugs the word's height, has square ends and is
  slightly wider than the text. The highlighted words switch to a **handwritten
  script** in the same dark ink. The attribution is small, tracked caps.
- Brand fit: the coral is close to the consumer portal's own accent `#f55b42`
  (`--color-consumer-accent`). The yellow ramp is the other candidate. Cream page plus
  deep purple text is already the Care2Sleep pairing.
- ⚠️ **Superseded by the Module 7 highlighter** (2026-11-25, §7 Highlight): soft
  `#ffdd75`, rounded, words unchanged, no script face. Only source-bold words.
- To raise before using: (1) **which words get highlighted** is a content-emphasis
  choice, so the user picks or approves them (the words themselves still never change);
  (2) a script face may be hard to read for this audience, so keep the highlight block
  but check whether to keep the script; (3) the block must still show on a greyscale
  print.

**ref-02 — `ref-02-numbers-and-graphs.webp`** (2026-11-25)
- **User likes:** *"how cleanly numbers and graphs have been used."*
- Observed: a survey report spread. One thick **donut chart** (a single ring, flat
  colour segments, no outlines, no gridlines, no legend box) with the total set large
  in its centre and a small label under it. Each figure is a **big, heavy numeral**
  ("12%", "9%") in its segment's colour, with a small plain label beside or under it.
  That pairing *is* the legend. The facing page is **full-bleed flat colour blocks**
  (pink and coral), each holding one big number and a short label. Few colours, lots of
  empty space, nothing decorative.
- How it maps to this content: the source's numbers ("90-minute cycles", "4–6 times",
  "30 mins or more", "20–30 minutes", "within 30 minutes") are candidates for the
  big-numeral treatment, and the 90-minute sleep cycle is a natural ring. Numbers
  must be **the source's own figures, in its own words**; never invent a statistic or
  a chart value.
- Brand fit: segment colours would come from the purple and yellow ramps, not the
  reference's green, pink and red.
- To raise before using: a full-bleed colour page depends on bleed, and many home
  printers cannot print to the edge (see the home-print rule in §3).

**ref-03 — `ref-03-image-title-colour-page.webp`** (2026-11-25)
- **User likes:** *"the use of image + just some title based text + colored
  background."*
- Observed: a full-page opener. A soft, out-of-focus **photo fills the page**, its
  warm yellow-green tones working as the background colour. A single **large serif
  statement** (about six short lines) sits top left on the grid, in dark ink. The only
  other text is a tiny tracked-caps running head and a small folio. The subject (a bee)
  sits in the open space to the right, so title and image never fight. Text-heavy
  pages follow on the facing side, so the opener gets to breathe.
- How it maps: the **chapter opener** and possibly the cover (§7). One image, the
  chapter title, maybe the opening line, a flat background colour from the brand, and
  nothing else.
- Brand fit: Care2Sleep art is watercolour on a warm paper ground rather than photography,
  so the "coloured background" would be a flat brand tint (a yellow or purple step) or the
  illustration's own paper tone, with the artwork placed so it leaves the title its own
  open space. The title face would be Atkinson Hyperlegible, not the reference's serif.

**ref-04 — `ref-04-images-top-or-bottom.webp`** (2026-11-25)
- **User likes:** *"how the images have been added at bottom or in beginning."*
- Observed: an etiquette booklet spread. Each page's illustration is **anchored to a
  page edge**: at the **bottom** of the left page, running off the bottom and left
  edges, and at the **top** of the right page, running off the top and right edges.
  The text block takes the opposite end of the page. Image and text never interleave
  mid-column, so each page reads as two clean zones: text, then picture (or picture,
  then text). The art is large and cropped by the trim, which makes it feel bold, not
  boxed. Alternating top and bottom across a spread gives a diagonal balance.
- Also observed (not called out by the user): a big bold section word ("Etiquette")
  set between the list and the image; numbered steps with a **large bold numeral, a
  thin vertical rule, then the text**, separated by hairlines; one flat page colour
  across the whole spread; a small folio at the bottom outer corner.
- How it maps: place figures **at the head or foot of a page**, never floating in the
  middle of running text; let a figure bleed off the page edge where the art allows;
  alternate head/foot placement across facing pages. That also helps the break rules
  (§6): a figure anchored to a page end never strands a line of text.
- To raise before using: bleeding art off the trim needs a bleed edge, which most home
  printers cannot print to (see the home-print rule in §3). Watercolour art may need
  a soft paper edge rather than a hard crop.

**ref-05 — `ref-05-text-in-organic-boxes.png`** (2026-11-25)
- **User likes:** *"how some of text is added inside coloured organic boxes."*
- Observed: a product booklet on a warm cream page. Selected passages sit inside
  **solid colour panels with soft, slightly irregular hand-drawn edges**. They aren't
  crisp rectangles: the corners are generously rounded and the sides gently wobble.
  There are **two tones of one hue**: a deep blue panel with white text for the main
  message, and a pale blue panel with blue text for secondary passages. Panels span
  the text column, have roomy, even inner padding, and stack with consistent gaps. One
  panel carries a small round badge breaking its bottom edge. Headings sit outside
  the panels, centred, in a hand-lettered caps face. A thin rule under the running
  head and a small round folio give the page a frame.
- ⚠️ **The organic edge is superseded** (2026-11-25, §2a): panels have one clean 8 pt
  radius. The two-tone solid panel idea still stands.
- How it maps: the **key-point boxes** (the source's single-cell tables) and possibly
  the reflection prompts (§7). Deep purple panel + white text for the strongest key
  point; pale purple (`purple-50`/`purple-200`) or pale yellow panel + purple text
  for the rest. The organic edge echoes the soft watercolour art, and the app already
  owns a torn-paper blob shape (`blobFrame.ts`), so there is a precedent.
- Rules that still apply: panel width and padding snap to the grid (§4); a panel is
  never split across pages (§6); contrast is measured on the panel colour; the panel
  must stay visible in a greyscale print. **The hand-lettered caps headings are not
  part of what was liked**: headings stay Atkinson Hyperlegible, sentence case.

**ref-06 — `ref-06-font-pairing.png`** (2026-11-25)
- **User likes:** *"font pairing."*
- Observed: a heading set **large and bold** (a grotesque sans at heavy weight) in a
  muted brand purple, tightly leaded (about 1.0–1.1), broken into **short lines of
  two or three words**, so it stacks like a block. Under it, after a clear gap,
  sits body copy in a **light/regular weight of a plain neo-grotesque sans**, much
  smaller, dark grey, comfortably leaded, short measure. The contrast comes from
  **size and weight**, not from mixing serif with sans: heavy display sans over light
  text sans, one hue for the heading and a neutral for the body. Both are left-aligned
  and ragged on one shared left edge. The page is plain white.
- How it maps: this is already the decided pairing (§3). Atkinson Hyperlegible Next in
  a heavy weight for headings, tight leading, purple; Inter regular for body,
  `ink`/`ink-muted`, normal leading. Take from it: **a big jump in size and weight
  between heading and body**, tight heading leading, deliberate short heading lines, a
  generous gap before the body, and one shared left edge.
- Rules that still apply: **no runts** in the stacked heading (§6); headings wrap by
  measured width and `text-wrap: balance`, never hand-placed line breaks that change
  the words; body stays at least 12 pt and never as light as the reference's (thin
  grey body text fails this audience). Measure contrast on the purple heading.

**ref-07 — `ref-07-avatar-and-shapes.png`** (2026-11-25)
- **User likes:** *"the use of avatar and shapes"*, adding *"we have pillow avatar."*
- Observed: a flat warm-yellow ground. A **cream speech-bubble shape** with soft
  rounded corners and a small tail holds a short statement in a friendly bold sans,
  with an oversized heavy **closing quote mark** breaking out of the bubble's top
  right corner. A **simple mascot** (a pale-blue flower/blob with two dot eyes and a
  tiny smile) peeks up from the bottom edge, partly overlapping the bubble, as if it
  is the one speaking. Flat colours, no outlines, no gradients; the character and the
  shapes do the warmth, the type stays plain.
- How it maps: Care2Sleep's own mascot is the **pillow avatar**, already in the
  product. Use it as the friendly voice of the resource: peeking from a page edge
  beside a key point, a speech bubble, or a reflection prompt. **Use the existing
  artwork, never redraw it.** Sources:
  `2. Platform/prototype/public/illustrations/consumer-welcome/` (`pillow-mascot.svg`,
  `pillow-body.svg`, `pillow-face.svg`, `pillow-brows.svg`, `pillow-awake.svg`,
  `awake-*.svg`, `z-small/medium/large.svg`),
  `public/illustrations/consumer-lesson/card-pillow-1/2/3.svg`, and the module summary
  pillow in `src/components/consumer/SummaryBannerArt.tsx` (Figma `4139:42732`). These
  are vector, so they print sharp at any size.
- Shapes: speech bubbles in pale purple (ref-05's organic edges and any blobs are
  ruled out, §2a; bubbles take the clean 8 pt radius). The oversized quote mark is
  only for text that is genuinely a quote or the mascot "speaking"; the source has no
  quotations, so don't fake one.
- **On dark purple, the pillow's ground shadow is `purple-200`** (`#E4D6FF`) instead of the
  export's beige `#EADECC` (direct instruction, 2026-11-25: first *"use p50"*, then
  corrected to *"p200"*). Use the recoloured
  copy `pillow-awake-on-dark.svg`; only that one fill changes, the drawing is untouched.
- Restraint: the mascot is an accent (a few appearances, at meaningful moments such
  as chapter openers, key points and reflection prompts), not on every page. Mark it
  as decorative in the tagged PDF.

**ref-08 — `ref-08-pairing-and-coloured-type.webp`** (2026-11-25)
- **User likes:** *"font pairing + colored font used."*
- Observed: a report spread in **one brand colour** (green). On the white pages,
  headings are a **heavy geometric sans in the brand colour**, tightly leaded and
  stacked in short lines, and the **body text is set in the same colour**, in a
  small humanist text face. There's no black at all, so the page reads as one tinted
  voice. A section marker "02 —— 03" (numbers joined by a long rule) sits above a
  heading. On the facing page the colours **invert**: a full flat green page with a
  huge heavy statement in **white**, plus a slightly darker green square set behind
  part of the text as a subtle tonal shape.
- How it maps: (1) the brand purple as the type colour. Headings in purple, and
  possibly body text in deep purple (`purple-900` `#200061`) instead of black, so each
  page reads in one Care2Sleep voice. (2) An **inverted page**: a full purple page with a
  large white statement, for chapter openers or one key line, with a darker purple
  tonal shape behind (a `purple-900` block on `purple-500`, or a pale tint on cream).
  (3) ~~The numbers-joined-by-a-rule chapter marker~~: **rejected 2026-11-25**, see
  §2a. Chapters are marked "Chapter 1".
- Rules that still apply: body text in a colour must still measure **≥ 4.5:1 (7:1
  preferred)** on its paper, and coloured body text must stay readable in greyscale
  (deep purple prints near-black, which is fine; mid purple does not). Never set body
  as small or as tight as the reference; the 12 pt minimum and generous leading hold.
  Big statement text is a source sentence used verbatim, never a new line written for
  effect. The inverted full-colour page has the same bleed/home-print caveat as
  ref-02 and ref-04.

**ref-09 — `ref-09-colour-chapter-divider.png`** (2026-11-25)
- **User likes:** *"how a page can be used with color background to indicate chapter
  1..2... with chapter titles."*
- Observed: a **whole page in one flat colour** (warm yellow) with nothing on it but
  one large, centred statement in dark ink, a tiny ornament at the top and a tiny
  tracked-caps credit under it. Huge margins on every side; the page is mostly empty
  colour. It sits opposite a dense white text page, so the colour page reads as a
  pause, a door between sections.
- How it maps: a **chapter divider page**. Each chapter opens on a full colour page
  carrying only the chapter number and the chapter title, centred or on the grid, with
  everything else stripped away; the chapter's text starts on the next page. Combine
  with the decided rule that every chapter starts on a new page (§2), and with ref-03
  (image + title opener) and ref-08 (inverted page). ⚠️ **Settled 2026-11-25**: the
  chapter opener is the light-tint page with the painting and wave edge (§7, ref-11).
- Colour per chapter: one consistent brand colour for every divider, or a step per
  chapter from the purple/yellow ramps (e.g. yellow, pale purple, purple), as a
  wayfinding cue a reader can see from the closed edge of a printout. To settle with
  the user.
- Rules that still apply: the reference's quotation is **not** something to copy; the
  divider carries the chapter's own number and title from the source, verbatim.
  Divider pages add to the page count, so a module with four short chapters (as
  Module 1 has) gains four mostly empty pages, which is worth showing the user. Same
  bleed/home-print caveat as ref-02.

**ref-10 — `ref-10-contents-page.webp`** (2026-11-25)
- **User likes:** *"how simple clean table of content page is."*
- Observed: a contents page in **one colour** (red ink on white). The title
  "Contents" is large and centred over a full-width hairline. Each entry is a row: the
  **section title, large, at the left**, and its **page number, same size, flush
  right** on the same baseline, with **no dot leaders**. Under each title is a short
  list of its sub-sections in **small tracked caps**. Every row is separated by a thin
  full-width hairline, and the rows have generous, even spacing. Nothing else on the
  page: no icons, no images, no boxes.
- ⚠️ **Superseded in part** (2026-11-25, §7 Contents): page numbers sit **before** each
  entry, and **no sub-section lists**. The one-colour, hairline-row simplicity stands.
- How it maps: a **Contents page** after the cover, which the components list (§7)
  did not have yet. Rows: the module opening, Chapter 1 to Chapter 4, and "Bringing it
  all together"; each chapter row shows its number and title (verbatim from the
  source) with the page number flush right, and the sub-section headings listed
  beneath (Chapter 1 has nine). One colour (brand purple) on the page canvas, hairline
  rules, the rows on the baseline grid.
- Rules that still apply: sub-section names in **sentence case at a readable size**
  (≥ 10 pt), not tiny all-caps, which this audience struggles with; page numbers
  generated from the real layout, never typed; each entry a real link to its page in
  the PDF, and the same structure exported as PDF bookmarks.

**ref-11 — `ref-11-wave-edge-band.webp`** (2026-11-25)
- **User wanted:** *"what I was after I have attached reference"*, with *"in this case
  the image stays at bottom, but you get the gist"*.
- Observed: an editorial spread. A bold illustration runs **edge to edge** across the
  top of the page, and its bottom edge is a **soft, even, repeating wave** meeting the
  plain page; a large title and the body text follow below.
- How it maps: the **chapter opener** (§7). Same wave edge, but the picture sits at the
  bottom of the page and the wave is its top edge. The flat, saturated illustration
  style of the reference is **not** the direction; Care2Sleep keeps its watercolour.

**ref-12 — `ref-12-text-and-image-one-frame.webp`** (2026-11-26)
- **User likes:** *"how text and images go well with each other as if they are part of one single frame"*, with *"I dont want text to be part of image, need to overlay"*.
- Observed: a picture-book page. The illustration's own paper is the page: no box, no edge, no wave. Shapes rise from the bottom and both sides, taller at the edges and lower in the middle, leaving open paper at the top where a few short lines of text sit, left-aligned. Text and picture read as one composition.
- How it maps: the **cover** (§7). The painting is generated on **white paper composed for the text**, with the upper-left left empty. The logos, "Module N" and the title are **live text laid over** that open paper (never painted into the image). No wave and no border on the cover (*"the wave makes the page look un-even"*, 2026-11-26).

## 13. Done means

A resource is not finished until every item is checked and the result reported:

- [ ] **Verbatim check:** an automated text diff of the PDF against the source shows
      no change to any word (only the structural changes the user approved)
- [ ] Every page viewed as a rendered image — no widow, orphan, runt, stranded heading
      or split box/figure/prompt
- [ ] Every chapter starts on a new page
- [ ] Everything on the grid (baseline and columns)
- [ ] Images at ≥ 300 ppi placed (or flagged and accepted; generated paintings at 2K are accepted from 200 ppi)
- [ ] PDF file size checked and reported; images compressed, never upscaled
- [ ] Contrast measured; a greyscale render still reads
- [ ] **Every write-in field accepts typed text in Adobe Acrobat Reader**, and the typed text
      survives save and reopen (also checked in Preview)
- [ ] Fonts embedded, tagged, metadata set
