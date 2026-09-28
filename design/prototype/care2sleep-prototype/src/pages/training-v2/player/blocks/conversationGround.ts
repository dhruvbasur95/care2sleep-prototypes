/**
 * The ground every conversation-shaped block sits on.
 *
 * Cream at the top, clearing through white, settling into a pale lilac — the
 * same fall the Figma conversation frames paint with two stacked radial
 * gradients.
 *
 * It lives here rather than at either call site because **three** blocks use it
 * now: the case scenario conversations (block_1's artwork bakes it in, block_2's
 * live chat paints it) and You Might Also Hear (direct instruction, 2026-09-28:
 * *"re-use the same gradient background you have used for case scenario 1, 2 for
 * this interactive block style"*). One constant is the only way those three stay
 * the same surface.
 *
 * ⚠️ It replaced `hear-pair-wash.webp` on the You Might Also Hear rows. That
 * asset carried hard-won contrast numbers — its darkest pixel measured 8.26:1
 * against `ink-muted` after two failed attempts at a painterly wash. **A
 * gradient has to clear the same bar**: the darkest stop here is `purple-50`,
 * and `ink-muted` on it measures well clear (re-measured on the live page, not
 * calculated from the token). Re-check if any stop ever changes.
 *
 * ⚠️ `purple-50`, not `purple-100`. This project's purple ramp has no 100 —
 * it runs 50, 200, 300, 400, 500, 700, 900, 950. `to-purple-100` compiled
 * silently to **Tailwind's own default** `oklch(0.946 0.033 307.174)`, a colour
 * that exists nowhere in `index.css`. Caught by reading the computed gradient
 * off the live page rather than trusting that the class name resolved.
 */
export const CONVERSATION_GROUND = 'bg-gradient-to-b from-yellow-50 via-white to-purple-50'
