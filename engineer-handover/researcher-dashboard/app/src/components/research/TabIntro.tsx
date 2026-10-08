/**
 * Per-tab title + sub copy, at the top of every tab panel on the three record
 * pages (trainee, consumer, coach). Fifteen panels use it.
 *
 * The tab row names the section in two or three words; this block says what
 * the section is *for* and what the researcher is expected to do with it — the
 * job a tab label cannot do without becoming a sentence.
 *
 * ⚠️ The title is deliberately the *quieter* of the two lines (`ink-muted`
 * against the sub copy's `ink`). It only restates the tab you just clicked;
 * the sub copy is the new information. This is not a mistake to "fix".
 *
 * Two pages render their intro inline instead of through this component,
 * because their frame pairs it with a right-aligned action on the same row.
 * Any change here should be checked against those (`CoachProfilePage`'s Stage
 * Management, `ConsumerDetailPage`'s Overview).
 */
export function TabIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    // Top padding only. The parent tabpanel's own `gap-14` already spaces this
    // block from the first content card; adding bottom padding here stacks the
    // two and reads as an excessive gap.
    <div className="flex flex-col gap-2 pt-4">
      <h2 className="font-display text-title text-ink-muted">{title}</h2>
      <p className="text-body text-ink">{subtitle}</p>
    </div>
  )
}
