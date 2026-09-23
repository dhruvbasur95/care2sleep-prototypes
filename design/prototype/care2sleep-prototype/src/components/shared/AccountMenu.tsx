import type { ArrowLeftRight } from 'lucide-react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
import { cn } from '@/lib/utils'
import { SUBMENU_CARD_MOTION } from '@/components/shared/submenuMotion'

/**
 * The header's account control: a bordered pill carrying the signed-in
 * person's initials and name, opening a card of account actions.
 *
 * Extracted in Round 47 on direct instruction — *"re-use the user account
 * component as done in consumer portal"*. The Consumer Portal built this shape
 * first (`ConsumerHeader`, frame `787:1755`'s own right-hand group); the
 * trainee and coach header had a bare text trigger with a chevron. This is that
 * control, made portal-agnostic.
 *
 * ## The avatar
 * ⚠️ The initials disc **reintroduces an avatar**, against the app-wide "no
 * avatars" rule (Round 4.1). That was already true of the Consumer Portal's
 * version and was taken there knowingly; re-using the control spreads it to two
 * more portals. Recorded rather than quietly widened: it is initials only,
 * never a photograph, and only on this one control.
 *
 * ## `variant`
 * The Consumer Portal is on its own type scale and brand, so nothing app-wide
 * may leak into it and nothing of its own may leak out — hence a variant rather
 * than one set of classes. `app` uses `--primary` and the 36px control height
 * that fits the 48px app header; `consumer` uses `consumer-primary` and the
 * portal's own 44px control.
 *
 * `ConsumerHeader` still inlines its own copy of this control — migrating it is
 * a mechanical follow-up, deliberately not done in the same pass as a change to
 * every other portal's header. Same staging as `Toast`, which shipped shared
 * with four call sites still inlining it.
 */
export type AccountAction = {
  label: string
  icon: typeof ArrowLeftRight
  onSelect: () => void
  /** Destructive actions take the app's `destructive` token rather than the
   *  brand colour — colour is not the only cue (the row keeps its label), but
   *  it is the one that makes "Sign out" read as the end of a session. */
  destructive?: boolean
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AccountMenu({
  name,
  actions,
  variant = 'app',
}: {
  name: string
  actions: AccountAction[]
  variant?: 'app' | 'consumer'
}) {
  const consumer = variant === 'consumer'
  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'group flex shrink-0 items-center gap-2 rounded-3xl border-2 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
          consumer
            ? 'h-11 border-consumer-primary pr-4 pl-1.5 text-consumer-primary hover:bg-purple-50 focus-visible:ring-consumer-primary'
            : // 36px, not the consumer's 44: the app header's bar is 48px tall,
              // so a 44px pill would sit in 2px of clearance. Still the app's
              // own control-height floor, not below it.
              'h-9 border-primary pr-3 pl-1 text-primary hover:bg-purple-50 focus-visible:ring-ring',
        )}
      >
        {/* `aria-hidden`: the initials restate the name printed beside them, so
            announcing both reads "H Z Helen Zhang". */}
        <span
          aria-hidden="true"
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
            consumer ? 'size-8 bg-consumer-primary text-[14px]' : 'size-7 bg-primary text-fine',
          )}
        >
          {initialsOf(name)}
        </span>
        <span className={cn('hidden sm:inline', consumer ? 'text-body-md' : 'text-caption-medium')}>
          {name}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'shrink-0 transition-transform group-data-[popup-open]:rotate-180',
            consumer ? 'size-4' : 'size-3.5',
          )}
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={12} className="z-50 outline-none">
          {/* The Consumer Portal's own card chrome: 16px radius, `parchment`
              stroke and the warm `shadow-card` — not the cool `ring-hairline` a
              dropdown used to carry. */}
          <Menu.Popup
            className={cn(
              SUBMENU_CARD_MOTION,
              // Direct instruction: "match the sub menu as done in consumers".
              // So the card itself is not varianted at all — same 320px, same
              // 16px radius, `parchment` stroke, warm `shadow-card` and drop-in
              // motion in every portal. Only what sits *inside* a row follows
              // the portal's own scale.
              'w-[320px] max-w-[calc(100vw-32px)] rounded-lg border border-parchment bg-white p-2 text-ink shadow-card outline-none',
            )}
          >
            {actions.map((action) => (
              <Menu.Item
                key={action.label}
                onClick={action.onSelect}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-4 rounded-sm px-4 text-left outline-none transition-colors data-[highlighted]:bg-purple-50',
                  'min-h-[60px]',
                  action.destructive ? 'text-destructive' : 'text-ink',
                )}
              >
                <span className="flex min-w-0 items-center gap-4">
                  <action.icon
                    aria-hidden="true"
                    className={cn(
                      'shrink-0',
                      consumer ? 'size-7' : 'size-5',
                      action.destructive
                        ? 'text-destructive'
                        : consumer
                          ? 'text-consumer-primary'
                          : 'text-primary',
                    )}
                    strokeWidth={1.75}
                  />
                  <span className={cn('min-w-0', consumer ? 'text-consumer-lesson' : 'text-caption')}>
                    {action.label}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className={cn(
                    'shrink-0',
                    consumer ? 'size-6' : 'size-4',
                    action.destructive
                      ? 'text-destructive'
                      : consumer
                        ? 'text-consumer-primary'
                        : 'text-primary',
                  )}
                />
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
