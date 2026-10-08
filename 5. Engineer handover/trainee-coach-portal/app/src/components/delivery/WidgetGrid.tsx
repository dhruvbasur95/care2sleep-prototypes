/**
 * ⚠️ UNREACHABLE IN THIS PACKAGE — retained deliberately, not dead code.
 *
 * The add/remove shortcut-tile system (Gmail / Calendar / Zoom / picker) built
 * in Round 6.1. Removed from the coach Home in Round 18 ("coaches won't be
 * needing any widgets") and from the Research Dashboard Home in Round 28.
 * Nothing imports this file.
 *
 * Note for the rebuild: its widget-picker announcement is the origin of this
 * app's `role="status" aria-live="polite"` sr-only pattern, which several live
 * components still follow. Deleting the file is safe; keep the pattern.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, HardDrive, MessageSquare, Plus, Users, type LucideIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { cn } from '@/lib/utils'

/**
 * Coach Delivery Portal Home page widget system (Round 6.1, design-tokens.md
 * §21; icons/labels revised Round 6.1.1). A real add/remove widget pattern,
 * not a static shortcut grid: a fixed default set of tiles renders on load,
 * plus a dashed "Add widget" tile that opens a picker of further mock
 * tools. Every tile is permanently decorative — nothing in this codebase has
 * a real destination, so every picker-added tile renders through the same
 * inert code path as the defaults (Gmail/Calendar/Zoom). Gmail/Calendar/Zoom
 * render their real brand marks (`public/logos/`, sourced from the Round 6.1
 * Figma reference's own Quick-links icons) instead of a generic tinted
 * lucide-react glyph. Picker-added tools (Slack/Teams/Outlook/Drive) still
 * use the brand-tinted lucide-react badge — no request to source real logos
 * for those yet.
 *
 * The one-time "Coach Training Portal" default tile (a real `Link` to
 * `/training-v2`) was removed once that standalone home page was retired —
 * the learning journey now lives in the Coach Delivery Portal's own
 * Learning tab, which this widget grid (rendered only on the Research
 * Dashboard's My Schedule page today) has no reason to link to. `WidgetTile`
 * below still supports a real `to` destination generically, for whatever
 * default tile eventually gets one.
 */

interface WidgetTileData {
  key: string
  label: string
  /** Generic lucide glyph + tinted badge — used when logoSrc isn't set. */
  icon?: LucideIcon
  /** Brand tint hex, used for both the badge fill (/10 opacity) and icon color. */
  tint?: string
  /** Real brand logo (public/logos/*), takes precedence over icon+tint. */
  logoSrc?: string
  /** Renders the tile as a real link when set — no default tile sets this
   *  today, all are decorative. */
  to?: string
}

export const DEFAULT_TILES: WidgetTileData[] = [
  { key: 'gmail', label: 'Gmail', logoSrc: '/logos/gmail.png' },
  { key: 'calendar', label: 'Calendar', logoSrc: '/logos/google-calendar.png' },
  { key: 'zoom', label: 'Zoom', logoSrc: '/logos/zoom.png' },
]

interface PickerTool {
  key: string
  label: string
  icon: LucideIcon
  tint: string
}

const PICKER_TOOLS: PickerTool[] = [
  { key: 'slack', label: 'Slack', icon: MessageSquare, tint: '#611f69' },
  { key: 'teams', label: 'Microsoft Teams', icon: Users, tint: '#6264a7' },
  { key: 'outlook', label: 'Outlook', icon: Calendar, tint: '#0078d4' },
  { key: 'drive', label: 'Google Drive', icon: HardDrive, tint: '#0f9d58' },
]

/** Square (not circular, per §21) brand-tinted icon badge — shared by the
 *  grid tile and the picker row so a tool's identity is visually consistent
 *  in both places. */
function TintBadge({ icon: Icon, tint }: { icon: LucideIcon; tint: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-sm"
      style={{ backgroundColor: `${tint}1a` }}
    >
      <Icon className="size-5" strokeWidth={1.75} style={{ color: tint }} />
    </span>
  )
}

/** Renders a tile's real brand logo when set, else falls back to the
 *  generic tinted lucide-react badge. */
function TileVisual({ tile }: { tile: WidgetTileData }) {
  if (tile.logoSrc) {
    return <img src={tile.logoSrc} alt="" aria-hidden="true" className="size-10 shrink-0 object-contain" />
  }
  return <TintBadge icon={tile.icon!} tint={tile.tint!} />
}

function WidgetTile({ tile }: { tile: WidgetTileData }) {
  if (tile.to) {
    return (
      <Link
        to={tile.to}
        className="group flex flex-col gap-3 rounded-lg bg-card p-6 shadow-card outline-none ring-1 ring-hairline transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
      >
        <TileVisual tile={tile} />
        <span className="text-caption font-semibold text-ink">{tile.label}</span>
      </Link>
    )
  }
  return (
    <div
      aria-disabled="true"
      className="flex flex-col gap-3 rounded-lg bg-card p-6 shadow-card ring-1 ring-hairline transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      <TileVisual tile={tile} />
      <span className="text-caption font-semibold text-ink-muted">
        {tile.label}
        {/* The visible "Coming soon" tag was removed this round (Round 6.1.1);
         *  aria-disabled has no defined meaning on a non-interactive, roleless
         *  div, so without this the "not yet functional" signal was lost for
         *  screen reader users specifically (sighted users can still infer
         *  non-interactivity from the lack of hover/click affordance, but SR
         *  users got nothing). Matches DeliverySidebar's identical
         *  sr-only " (coming soon)" convention for its inert nav items. */}
        <span className="sr-only"> (coming soon)</span>
      </span>
    </div>
  )
}

function AddWidgetTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-hairline bg-transparent p-6 text-ink-faint outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] hover:border-primary hover:text-primary"
    >
      <Plus aria-hidden="true" className="size-5" strokeWidth={1.75} />
      <span className="text-caption font-semibold">Add widget</span>
    </button>
  )
}

function WidgetPicker({
  open,
  onClose,
  added,
  onAdd,
  lastAddedLabel,
}: {
  open: boolean
  onClose: () => void
  added: Set<string>
  onAdd: (tool: PickerTool) => void
  lastAddedLabel: string | null
}) {
  const allAdded = PICKER_TOOLS.every((tool) => added.has(tool.key))

  return (
    <ConfirmDialog
      open={open}
      title="Add a widget"
      body="Add a shortcut tile to your home page. These are prototype placeholders for this round."
      confirmLabel="Close"
      cancelLabel="Close"
      singleAction
      onConfirm={onClose}
      onClose={onClose}
    >
      {/* Announces each Add→Added state change to assistive tech — the
       *  visible button text swap alone isn't a reliable announcement
       *  across screen readers (design-tokens.md §21 accessibility note). */}
      <p role="status" aria-live="polite" className="sr-only">
        {lastAddedLabel ? `${lastAddedLabel} added to your home page.` : ''}
      </p>
      {allAdded ? (
        <p className="py-6 text-center text-caption text-ink-faint">
          You've added every available widget.
        </p>
      ) : (
        <ul className="divide-y divide-hairline">
          {PICKER_TOOLS.map((tool) => {
            const isAdded = added.has(tool.key)
            return (
              <li key={tool.key} className="flex min-h-11 items-center gap-3 py-2">
                <TintBadge icon={tool.icon} tint={tool.tint} />
                <span className="flex-1 text-body text-ink">{tool.label}</span>
                <button
                  type="button"
                  disabled={isAdded}
                  onClick={() => onAdd(tool)}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center justify-center rounded-sm bg-pearl px-4 text-caption-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
                    isAdded
                      ? 'cursor-not-allowed text-ink-faint'
                      : 'text-ink-muted hover:bg-divider-soft',
                  )}
                >
                  {isAdded ? 'Added' : 'Add'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </ConfirmDialog>
  )
}

/** Default tiles + any picker-added tiles, plus the "Add widget" trigger.
 *  Component-local state only — added tiles don't persist across a reload,
 *  per the plan's "no persistence needed" note.
 *
 *  `tiles` (Round 10) lets a caller override the default set — currently
 *  unexercised (the Research Dashboard's My Schedule page, the only
 *  renderer today, just takes the defaults), kept as this component's own
 *  generic override point for whenever a future caller's tile set differs. */
export function WidgetGrid({ tiles = DEFAULT_TILES }: { tiles?: WidgetTileData[] } = {}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addedTiles, setAddedTiles] = useState<WidgetTileData[]>([])
  const [lastAddedLabel, setLastAddedLabel] = useState<string | null>(null)
  const addedKeys = new Set(addedTiles.map((t) => t.key))

  function handleAdd(tool: PickerTool) {
    setAddedTiles((prev) => [...prev, { key: tool.key, label: tool.label, icon: tool.icon, tint: tool.tint }])
    setLastAddedLabel(tool.label)
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <WidgetTile key={tile.key} tile={tile} />
        ))}
        {addedTiles.map((tile) => (
          <WidgetTile key={tile.key} tile={tile} />
        ))}
        <AddWidgetTile onClick={() => setPickerOpen(true)} />
      </div>

      <WidgetPicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false)
          setLastAddedLabel(null)
        }}
        added={addedKeys}
        lastAddedLabel={lastAddedLabel}
        onAdd={handleAdd}
      />
    </div>
  )
}
