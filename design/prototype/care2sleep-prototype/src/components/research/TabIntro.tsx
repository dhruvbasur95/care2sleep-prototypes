/**
 * Per-tab title + sub copy for the Research Dashboard's three record pages
 * (trainee, consumer, SPACES coach). Figma frame `45:161`, node `93:7`.
 *
 * Sits at the top of every tab panel, above that tab's own content. The tab
 * row itself names the section in two or three words; this block says what the
 * section is *for* and what the researcher is expected to do with it — the job
 * a bare tab label can't do without becoming a sentence.
 *
 * Deliberately one shared component rather than a copy per page. The same
 * treatment already drifted across five pages once in this project (the reason
 * `ResearchPageHero` was extracted in Round 21), and this block is going onto
 * fifteen tab panels at once — so a per-page copy would be five chances to
 * diverge before anyone noticed.
 *
 * **Researcher view only.** The Coach Delivery Portal and Consumer Portal have
 * their own record pages with their own tab rows; they are not in scope here,
 * and this component should not be reached for there without a frame that asks
 * for it.
 *
 * Type per the frame: title `title` (24/500) in `ink-muted`, sub copy `body`
 * (16/400) in `ink`, 8px apart. Note the title is the *quieter* of the two
 * colours — deliberate, and it reads correctly: the title restates the tab you
 * already clicked, while the sub copy is the new information.
 */
export function TabIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    // `pt-4` (16px) keeps this block's own breathing room below the tab row.
    // No bottom padding: the parent tabpanel's `gap-14` (56px) already spaces
    // this block from the first content card below it, and the two were
    // previously stacking (16px + 56px = 72px), reading as an excessive gap.
    <div className="flex flex-col gap-2 pt-4">
      {/* Round 23: `text-ink-muted`, not `text-ink`. The doc comment above has
          said "the title is the *quieter* of the two colours" since this
          component was written, and frame `152:176` confirms it (`#333333`), but
          the markup shipped `text-ink` — so the intent was documented and then
          not implemented. Corrected against the frame. */}
      <h2 className="font-display text-title text-ink-muted">{title}</h2>
      <p className="text-body text-ink">{subtitle}</p>
    </div>
  )
}
