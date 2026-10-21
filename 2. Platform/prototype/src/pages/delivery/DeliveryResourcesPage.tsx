import { useState } from 'react'
import { DeliveryShell } from '@/components/delivery/DeliveryShell'
import { UnderlineTabs } from '@/components/shared/UnderlineTabs'
import { ClientModuleTimeline } from '@/components/delivery/ClientModuleTimeline'

/** Section tabs under the header (direct instruction, 2026-10-21). One tab for
 *  now; add the next one here. */
const RESOURCE_TABS = [{ id: 'client-modules', label: 'Client modules' }] as const
type ResourceTab = (typeof RESOURCE_TABS)[number]['id']

/**
 * Coach Delivery Portal "Resources" — coach stage only, after My Learning in the nav.
 *
 * Header (title, sub-line), then a section tab row. "Client modules"
 * holds the six-week module timeline (`ClientModuleTimeline`). Same flush
 * column and 64px top inset as My Notes, so the title lines up with its
 * siblings.
 */
export function DeliveryResourcesPage() {
  const [tab, setTab] = useState<ResourceTab>('client-modules')

  return (
    <DeliveryShell accountLabel="Helen Zhang" contentClassName="px-0 pt-16 md:px-0 md:pt-16">
      {/* 48px between the header and the tab row — the coach portal's gap
          between page sections (My Notes uses the same `gap-12`). */}
      <div className="flex flex-col gap-12">
        {/* Title + sub-line, same block as My Notes (`text-sub-greeting`, no
            full stop), so the two pages read as one family. The search field
            that sat to its right was removed (direct instruction, 2026-10-21 —
            hidden in Figma first): there is nothing on this page to search. */}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display-lg text-primary">Resources</h1>
          <p className="text-balance text-sub-greeting leading-[1.4] text-ink">
            Find helpful information about the Care2Sleep project and how to use your dashboard
          </p>
        </div>
        <div className="flex flex-col">
          {/* `flushStart` puts the first label on the title's left edge
              rather than 16px inside it. */}
          <UnderlineTabs
            tabs={RESOURCE_TABS}
            active={tab}
            onChange={setTab}
            ariaLabel="Resources"
            layoutId="delivery-resources-underline"
            idPrefix="resources-tab"
            panelId="resources-panel"
            flushStart
            // The coach portal's page-level tab rule: 1px `primary`, matching
            // the client record's tabs.
            rule="primary"
          />
          {/* 32px below the tab row — the same gap the client record page
              leaves between its tab row and panel (`mb-8`) — and 32px again
              between the intro line and the timeline (Figma Mock D). The line
              says "work through, one for each catch-up session" so the tab
              cannot be misread as modules *about* clients. */}
          <div
            id="resources-panel"
            role="tabpanel"
            aria-labelledby={`resources-tab-${tab}`}
            className="flex flex-col gap-8 pt-8"
          >
            <p className="text-balance text-body text-ink">
              See the modules your clients work through, one for each catch-up session
            </p>
            <ClientModuleTimeline />
          </div>
        </div>
      </div>
    </DeliveryShell>
  )
}
