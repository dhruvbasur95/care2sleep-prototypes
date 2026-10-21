/**
 * Care2Sleep layout audit — Round 21.
 *
 * Paste into the browser console (or run via the preview tool's
 * `javascript_tool`) on any page after a rebuild. Returns a list of findings;
 * an empty list is a pass.
 *
 * Why this exists: the Round 21 Trainee Management rebuild shipped three layout
 * bugs that all looked fine in a screenshot and were only found because someone
 * circled them and asked:
 *
 *   1. A 340px search wrapper containing a 280px input — 60px of dead space,
 *      caused by a hardcoded `sm:w-[280px]` on the inner `<input>`.
 *   2. A table whose fixed column widths summed to 958px inside an 893px card,
 *      so it overflowed: the last column scrolled out of sight entirely.
 *   3. Names wrapping to two lines as a knock-on of (2).
 *
 * None of those are visible as "broken" — they read as slightly-off design. All
 * three are trivially detectable by measurement, which is what this does.
 *
 * Usage:
 *   const findings = layoutAudit()          // whole page
 *   const findings = layoutAudit('#main')   // scoped to a subtree
 */
function layoutAudit(rootSelector) {
  const root = rootSelector ? document.querySelector(rootSelector) : document.body
  if (!root) return [{ check: 'root', detail: `no element matches ${rootSelector}` }]

  const findings = []
  const add = (check, el, detail) =>
    findings.push({
      check,
      detail,
      el: el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${
        el.className && typeof el.className === 'string'
          ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.')
          : ''
      }` : null,
      text: el?.textContent?.trim().slice(0, 60) ?? null,
    })

  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return false
    const cs = getComputedStyle(el)
    return cs.display !== 'none' && cs.visibility !== 'hidden'
  }

  /* 1. Page-level horizontal overflow. The body must never scroll sideways. */
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
    add(
      'page-h-scroll',
      document.documentElement,
      `document scrollWidth ${document.documentElement.scrollWidth} > clientWidth ${document.documentElement.clientWidth}`,
    )
  }

  /* 2. Content wider than its own scroll container. A table inside an
   *    `overflow-x-auto` is allowed to scroll *by design* at narrow widths, but
   *    at desktop width it usually means over-allocated fixed column widths —
   *    which silently hides the trailing column. Reported so the call is
   *    explicit rather than accidental. */
  root.querySelectorAll('table').forEach((t) => {
    if (!visible(t)) return
    const scroller = t.closest('[class*="overflow-x-auto"],[class*="overflow-auto"]') ?? t.parentElement
    if (!scroller) return
    const tw = t.getBoundingClientRect().width
    const sw = scroller.clientWidth
    if (tw > sw + 1) add('table-overflows-container', t, `table ${Math.round(tw)}px inside ${sw}px container — trailing column(s) are off-screen`)
  })

  /* 3. A form control not filling its own wrapper. Catches bug (1): a width set
   *    on the control instead of the wrapper, so a caller's width has no
   *    effect. Only flags a >8px shortfall on a wrapper that has no other
   *    laid-out children, i.e. where the control was clearly meant to fill.
   *
   *    CALIBRATED 2026-10-12 (was: KNOWN FALSE POSITIVE, Consumer Management
   *    profile, Round 25 Figma pass) — a `<label>` wrapping a checkbox plus
   *    its own text ("Email"/"SMS") used to report here: the text is a bare
   *    text node, not an Element, so `wrap.children` saw only the checkbox and
   *    the "no other laid-out children" heuristic wrongly concluded the
   *    checkbox was meant to fill the whole label row. Measured on
   *    `/research/consumers/dyad-011`: `input.peer.size-7` inside a
   *    `<span class="relative …">` inside a `<label>` whose other child node
   *    is the `#text` "Email" — reported as "1034px narrower than its 1062px
   *    wrapper" twice, on both notification-preference rows.
   *
   *    The fix is NOT "wrapper is a `<label>`" — that special case would also
   *    hide a real missed width on a checkbox/radio row. It is to count
   *    **non-whitespace text nodes** as siblings alongside Elements, which is
   *    what the "clearly meant to fill" heuristic always meant: a control with
   *    its own visible label text beside it was never meant to fill. The two
   *    false positives below are untouched by this — neither has a text-node
   *    sibling — so the check keeps its teeth.
   *
   *    KNOWN FALSE POSITIVE (withdraw-a-coach flow, Round 46) — a `<select>`
   *    inside a padded table cell reports here. `wrap` is deliberately the
   *    control's *grandparent* so the check can see past a `relative`
   *    positioning div; in a table that grandparent is the `<td>`, and the
   *    reported shortfall is exactly the cell's own horizontal padding
   *    (32px against a `px-4` cell). The control does fill its own wrapper.
   *    Left reporting rather than special-casing "wrapper is a `<td>`", for
   *    the same reason as above: that would hide a genuine missed width on
   *    any control that really is meant to fill a cell. Recognise it by the
   *    shortfall matching the cell padding exactly.
   *
   *    KNOWN FALSE POSITIVE (Your turn free-text block, 2026-09-17) — the same
   *    grandparent mechanism, one level up from a table. The textarea's parent
   *    is the block's `purple-50` container and its grandparent is the plain
   *    column that holds it; the container is the column's only laid-out child,
   *    so the sibling heuristic passes, and the reported shortfall is exactly
   *    the container's own `p-10` (80px at every viewport width). Recognise it
   *    the same way: the gap equals twice the intermediate container's padding
   *    and does not change with the viewport. Left reporting rather than
   *    special-cased, for the same reason as the two above. */
  root.querySelectorAll('input, select, textarea').forEach((c) => {
    if (!visible(c)) return
    const wrap = c.parentElement?.parentElement
    if (!wrap) return
    const siblings = [...wrap.childNodes].filter((n) =>
      n.nodeType === 3
        ? (n.textContent ?? '').trim().length > 0
        : n.nodeType === 1 && visible(n) && !n.contains(c),
    )
    if (siblings.length > 0) return
    const gap = wrap.clientWidth - c.getBoundingClientRect().width
    if (gap > 8) add('control-not-filling-wrapper', c, `control is ${Math.round(gap)}px narrower than its ${wrap.clientWidth}px wrapper`)
  })

  /* 4. Unexpected text wrapping in a table cell. Catches bug (3).
   *
   *    CALIBRATION NOTE — the first version of this check divided the cell's
   *    height by its line-height and reported 37 false positives on a page that
   *    was known-good: a `<td>`'s height includes its own vertical padding
   *    (`py-3` = 24px), so a single-line cell measured as "3 lines". Line count
   *    is now read from `Range.getClientRects()` and is unaffected by padding.
   *    Measured on the innermost text-bearing element, not the cell, so a
   *    wrapper div's own min-height can't inflate it either.
   *
   *    SECOND CALIBRATION — `getClientRects().length` alone was still wrong: it
   *    returns one rect per *text node*, not per line, and JSX renders
   *    `{count} of {total}` as three separate text nodes. Six "0 of 12" cells
   *    were therefore reported as "3 lines" while sitting happily on one. Real
   *    line count is the number of **distinct rect tops**.
 *
 *    THIRD CALIBRATION (Round 23) — still one known false positive, left in
 *    rather than coded around. On the SPACES coach page's Consumer caseload
 *    table, the "View details" cell reports 2 lines because the cell's inner
 *    element is an `inline-flex` `<button>`: a Range spanning it yields a rect
 *    for the button box *and* one for its text line, at different tops. The
 *    button measures 96x36 with `white-space: nowrap` inside a 218px cell, so
 *    it demonstrably does not wrap. Excluding inline-flex children would also
 *    exclude the real bug class this check exists for, so the trade is to know
 *    about this one. Same standing as the Round 21.1 "Next"-chip cell.
 *    The supervision-records "Attachments" cell (paperclip icon + count in an
 *    inline-flex span) is the same shape and the same false positive: measured
 *    31x17 in a 160px column, demonstrably one line.
 *
 *    FOURTH CALIBRATION (2026-09-22) — `SessionDateCalendar`'s day grid reports
 *    **42 of these at once**, one per visible day, whenever the picker is open.
 *    Same cause, one step removed: the day cell's inner element is a `<button>`,
 *    which is not in this check's `a, span, p` lookup, so `target` falls back to
 *    the cell and the Range spans the 36x36 flex button box PLUS its text line.
 *    Measured on the "16" cell: cell 41x40, button 36x36, Range over the cell
 *    gives tops 452 and 461, while a Range over the **text node alone** gives a
 *    single 14x17 rect. It does not wrap. Left as a known false positive for the
 *    same reason as the three above — widening the lookup to `button` would not
 *    help (the button is itself the flex container), and measuring the deepest
 *    text-bearing node instead is a rewrite of this check, not a calibration.
 *    Worth knowing because 42 findings will bury a real one: if you are auditing
 *    a screen with a date picker, close it first or discount these by shape.
 *
 *    FIFTH CALIBRATION (2026-10-02) — the trainee reflection wizard's review
 *    table reports **all six** row headers at once. Same shape again: the `<th>`
 *    holds a flex row of a 24px SIPTEA colour disc and the component's name, so
 *    the check's `span` lookup lands on the flex container and the Range spans
 *    the disc box and the text line at different tops. Measured on every row:
 *    the name returns a **single** client rect 17px tall in a 348px column, so
 *    nothing wraps. Left as a known false positive rather than widened away —
 *    the column was briefly taken from 34% to 44% on the strength of this
 *    finding before it was measured, which is exactly the mistake this file's
 *    own header warns about. Discount a disc-plus-label cell by shape.
 *
 *    SIXTH CALIBRATION (2026-10-06, Figma mirror run; CLOSED 2026-10-12) -
 *    Consumer Management (`/research/consumers`) reported four `<th>`s at once:
 *    "Session Plan", "Modules Completed" and "Module Activity" on 2 lines, and
 *    "Coaching sessions completed" on 3. These genuinely DO wrap - the Range
 *    really returns 2 and 3 tops - and nothing is hidden: the table is 1110px
 *    inside a 1110px scroller, `scrollWidth === clientWidth`, no horizontal
 *    page scroll, all 9 columns visible. It was left reporting for six days as
 *    an accepted false positive, which meant the page could never return empty
 *    and the pass condition meant nothing there.
 *
 *    The flaw was treating ANY wrap as proof of a squeeze. A header wraps for
 *    two different reasons and only one is a defect: the column is too narrow
 *    for the label's widest WORD (a real squeeze - the word itself has nowhere
 *    to go), or the column fits every word and the PHRASE is simply long enough
 *    to need two lines (a density decision the author made).
 *
 *    So a `<th>` is now discounted only when its widest word fits its own
 *    content box. Measured on this table at 1512px, widest word vs content
 *    width: "Session Plan" 53 in 81 - "Modules Completed" 73 in 96 - "Module
 *    Activity" 51 in 99 - "Coaching sessions completed" 71 in 121. Every one
 *    has room to spare, so all four wrap between words. A genuinely squeezed
 *    header still fires: the same table's 16px action column measures a 44px
 *    widest word, and the probe in the note below confirms it reports.
 *
 *    Deliberately `<th>` ONLY. The same reasoning would apply to `<td>`, but
 *    the evidence gathered was for header labels, and the three `<td>` false
 *    positives below are different shapes (disc-plus-label, calendar grid, chip
 *    row) that this guard would not have caught anyway. Widening it needs its
 *    own measurement, not an assumption.
 *
 *    PROOF THE NARROWING KEPT ITS TEETH (re-run this after touching it).
 *    NOTE `table-layout:fixed` - it is load-bearing. The first attempt at this
 *    probe used an auto-layout table, which treats `width:40px` on a `<th>` as
 *    a hint, widened the column to fit, never wrapped, and so returned empty -
 *    which reads exactly like a blinded check. Verify the probe WRAPS before
 *    trusting that it fired:
 *      document.body.insertAdjacentHTML('beforeend',
 *        '<div id=__p><table style="table-layout:fixed;width:40px"><thead><tr>' +
 *        '<th style="width:40px;padding:0;font:500 14px Inter,sans-serif">' +
 *        'Assigned Coach</th></tr></thead></table></div>');
 *      layoutAudit('#__p');   // must report table-cell-text-wrapping
 *      document.getElementById('__p').remove();
 *    Measured when written: 40px content box, 62px widest word, 2 lines, fires.
 */
  /** Rendered width of a string in an element's own painted font. Canvas, not a
   *  probe node: a probe inherits the cell's `width`/`white-space` and would be
   *  measuring the wrap we are trying to explain. */
  const textWidth = (() => {
    const ctx = document.createElement('canvas').getContext('2d')
    return (text, el) => {
      const cs = getComputedStyle(el)
      ctx.font = cs.font || `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      return ctx.measureText(text).width
    }
  })()

  root.querySelectorAll('td, th').forEach((cell) => {
    if (!visible(cell)) return
    const target = cell.querySelector('a, span, p') ?? cell
    const words = (target.textContent ?? '').trim().split(/\s+/).filter(Boolean)
    if (words.length === 0 || words.length > 3) return
    // SEVENTH CALIBRATION (2026-10-21, Round 73): line tops come from TEXT
    // nodes only. The range used to cover the cell's whole contents, so an
    // element box on the same line counted as a line of its own: My Notes'
    // actions cell (View · Download · a 36px trash button, one flex row,
    // nothing wrapped) reported because the button's box top (936) differed
    // from the links' text top (946). Measured: View and Download both at
    // y946, cell width 210 against 165 of content. Real wraps are still lines
    // of text at different tops, so they still fire (probe below).
    // Proved both ways: the 40px "Assigned Coach" <th> probe and a 60px
    // "View note" link cell still fire; a View/Download/icon-button cell does
    // not. Still fires (left deliberately): TEXT inside a taller sibling
    // control on the same line — its text sits lower, which is rare enough to
    // read as a real finding until proven otherwise.
    const tops = new Set()
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) if (r.width > 0) tops.add(Math.round(r.top))
    }
    if (tops.size < 2) return

    // SIXTH CALIBRATION: a header whose widest word fits its own content box
    // wrapped between words — the phrase is long, the column is not squeezed.
    // The 0.5px slack absorbs sub-pixel layout rounding, which otherwise makes
    // a word that exactly fills its box ("Type", 33 in 33) read as overflowing.
    if (cell.tagName === 'TH') {
      const cs = getComputedStyle(cell)
      const contentW =
        cell.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const widestWord = Math.max(...words.map((w) => textWidth(w, cell)))
      if (widestWord <= contentW + 0.5) return
    }

    add('table-cell-text-wrapping', cell, `short text wrapped onto ${tops.size} lines — column is being squeezed`)
  })

  /* 5. Controls under this app's enforced 36px height floor (Rounds 3.1/10/18).
   *
   *    CALIBRATION NOTE — the first version flagged the visually-hidden "Skip to
   *    main content" link and every plain text link inside a table cell. Neither
   *    is a control in the sense the 36px rule means: `.sr-only` elements are
   *    deliberately 1px-ish, and a bare text link inside a `<td>` is running
   *    text, not a tap target (its row is the tap target). Both are now excluded,
   *    which is the difference between an audit that gets read and one that gets
   *    ignored.
   *
   *    KNOWN FALSE POSITIVE (Round 23) — the chromeless-link exclusion above is
   *    scoped to `td`/`th`, so a bare underlined text link *outside* a table
   *    still reports. The Consumer Portal's "Join Zoom" link in its sticky
   *    session banner is one (17px, inline-flex, no fill/border/shadow). Inline
   *    text links are exempt from WCAG 2.2 SC 2.5.8, so it is not a real
   *    finding. Left reporting rather than widening the exclusion to every
   *    chromeless link everywhere, which would hide real bare-icon buttons. */
  root.querySelectorAll('button, a[href], input[type="button"], input[type="submit"]').forEach((c) => {
    if (!visible(c)) return
    if (c.closest('.sr-only')) return
    const cs = getComputedStyle(c)
    if (cs.display === 'inline') return
    // A plain text link inside a table cell: no fill, no border, no ring.
    const chromeless =
      cs.backgroundColor === 'rgba(0, 0, 0, 0)' &&
      parseFloat(cs.borderTopWidth) === 0 &&
      cs.boxShadow === 'none'
    if (c.closest('td, th') && chromeless) return
    // Carousel pagination dots are deliberately small — Round 20 already
    // accepted 6x6px dots here as a known minor. They must still clear WCAG 2.2
    // AA's 24x24 target size (2.5.8), so that is the bar applied to them rather
    // than the app's 36px primary-control convention.
    //
    // CALIBRATION (Round 29) — was a `Page ` *prefix* test, now a match on the
    // "<page|step> N of M" phrase anywhere in the label. Two real pagination
    // controls were reporting as control-height failures on surfaces that are
    // correct and already clear 2.5.8:
    //   - the Coach Delivery Portal onboarding carousel, "Step 1 of 5" (26px);
    //   - `ModuleTimeline`'s module carousel, "Go to page 1 of 2" (24px, a
    //     size its own code comment documents as deliberately matching the
    //     2.5.8 floor exactly).
    // Only the first was a new surface — the module dots had been reporting on
    // My Training all along, which is worth knowing before trusting any past
    // "audit clean" claim about that page.
    // Still deliberately label-driven rather than geometry-driven: a bare-icon
    // button at 24px that isn't a pager keeps reporting.
    const label = c.getAttribute('aria-label')
    if (label && /\b(page|step)\s+\d+\s+of\s+\d+/i.test(label)) {
      const ph = c.getBoundingClientRect().height
      if (ph > 0 && ph < 24) add('pagination-dot-under-24px', c, `${Math.round(ph)}px tall, below WCAG 2.2 AA's 24px target size`)
      return
    }
    // CALIBRATION (Round 40) — a **stretched link** reports its own text box,
    // not its real target. The coach Home priorities list makes each card the
    // control by giving the title link an `::after { position: absolute;
    // inset: 0 }` overlay, so the `<a>` measures 17px while the thing a coach
    // can actually click is the 502x75 card around it. Verified by
    // `document.elementFromPoint` at the card's corners and centre: every probe
    // returns the `<a>`, and the kebab beside it stays separately clickable.
    // Narrow on purpose — it only exempts an anchor whose own `::after` is a
    // zero-inset absolute overlay, which is the one idiom that decouples an
    // element's box from its hit area. A short bare `<a>` with no such overlay
    // keeps reporting.
    const after = getComputedStyle(c, '::after')
    const stretched =
      c.tagName === 'A' &&
      after.position === 'absolute' &&
      ['top', 'right', 'bottom', 'left'].every((side) => after[side] === '0px')
    if (stretched) return
    const h = c.getBoundingClientRect().height
    if (h > 0 && h < 35.5) add('control-under-36px', c, `${Math.round(h)}px tall, below the 36px floor`)
  })

  /* 6. Any element sticking out past the right edge of the viewport.
   *
   *    CALIBRATION (Round 41) — `overflow-clip` was added to the ancestor
   *    exemption below. The exemption's whole premise is "something above this
   *    element clips it, so it is not really past the edge", and `overflow-clip`
   *    clips at least as hard as `overflow-hidden` (it clips without
   *    establishing a scroll container at all). Leaving it out reported the
   *    Consumer Portal welcome screen's wave twice — a deliberately
   *    over-wide 1439px illustration inside a 1281px `overflow-clip` section,
   *    with `documentElement.scrollWidth === innerWidth` confirming no page
   *    scroll. That is the exact shape this exemption exists for, and it was
   *    only being missed on a class-name technicality. Narrow on purpose: an
   *    over-wide element with NO clipping ancestor still reports. */
  const vw = document.documentElement.clientWidth
  root.querySelectorAll('*').forEach((el) => {
    if (!visible(el)) return
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed') {
      const scroller = el.closest('[class*="overflow-x-auto"],[class*="overflow-auto"],[class*="overflow-hidden"],[class*="overflow-clip"]')
      if (!scroller) add('element-past-viewport', el, `right edge ${Math.round(r.right)}px > viewport ${vw}px`)
    }
  })

  /* 7. Sibling cards in one grid row rendering at different heights — the
   *    "equal-height header band" class of bug this project has hit twice. */
  root.querySelectorAll('[class*="grid-cols"]').forEach((grid) => {
    const kids = [...grid.children].filter(visible)
    if (kids.length < 2) return
    const byRow = new Map()
    kids.forEach((k) => {
      const top = Math.round(k.getBoundingClientRect().top)
      if (!byRow.has(top)) byRow.set(top, [])
      byRow.get(top).push(k)
    })
    byRow.forEach((rowKids) => {
      // 3+ per row only. A 2-column master/detail split (e.g. the trainee
      // profile's Learning Progress tracker: a 693px canvas beside an 808px
      // panel) is *supposed* to have unequal column heights, and flagging it
      // reported a false positive on a page that was correct. The real bug class
      // — Round 20's unequal card-header bands — is always a row of 3+ sibling
      // tiles, which this still catches.
      if (rowKids.length < 3) return
      const hs = rowKids.map((k) => Math.round(k.getBoundingClientRect().height))
      if (Math.max(...hs) - Math.min(...hs) > 2) {
        add('grid-row-uneven-heights', grid, `siblings in one row differ in height: ${hs.join(', ')}px`)
      }
    })
  })

  return findings
}
