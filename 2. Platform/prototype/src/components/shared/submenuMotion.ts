/**
 * The drop-in/out motion every header sub-menu card uses.
 *
 * Defined in the Consumer Portal's `AccessibilityMenu` first; moved here in
 * Round 47 when the trainee/coach account menu adopted the same card, on the
 * instruction to *"match the sub menu as done in consumers"*. The class string
 * is portal-agnostic — it carries no colour and no type — so it is shared
 * rather than varianted, and `AccessibilityMenu` re-exports it so no consumer
 * call site had to change.
 */
export const SUBMENU_CARD_MOTION =
  'transition-[opacity,transform] duration-200 ease-out data-[starting-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[ending-style]:opacity-0 data-[ending-style]:-translate-y-1 motion-reduce:transition-none'
