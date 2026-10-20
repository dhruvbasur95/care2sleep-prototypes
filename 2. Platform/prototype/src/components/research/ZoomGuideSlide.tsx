import { Fragment, type ReactNode } from 'react'
import type { ZoomGuideBlock, ZoomGuideSlide as Slide } from '@/data/zoomGuide'

/** Renders `**label**` as semibold and `[text](url)` as a link. The only two
 *  marks the guide's copy uses — see `data/zoomGuide.ts`. */
function rich(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      out.push(
        <strong key={m.index} className="font-semibold">
          {m[1]}
        </strong>,
      )
    } else {
      out.push(
        /* Medium + underline: weight and an underline at rest, so the link
           is not told apart by colour alone (WCAG 1.4.1). New tab, because
           the coach is mid-wizard and must not lose it. */
        <a
          key={m.index}
          href={m[3]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          {m[2]}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function Block({ block }: { block: ZoomGuideBlock }) {
  if (block.kind === 'p') return <p>{rich(block.text)}</p>
  if (block.kind === 'callout') {
    return (
      <p className="rounded-sm border border-yellow-200 bg-yellow-50 px-4 py-3">
        {rich(block.text)}
      </p>
    )
  }
  const List = block.kind === 'ol' ? 'ol' : 'ul'
  return (
    <List
      className={
        block.kind === 'ol'
          ? 'flex list-decimal flex-col gap-2 pl-6'
          : 'flex list-disc flex-col gap-2 pl-6'
      }
    >
      {block.items.map((item, i) => (
        <li key={i} className="pl-1">
          {rich(item)}
        </li>
      ))}
    </List>
  )
}

/**
 * One page of the Create Zoom link step's walkthrough: a light grey card with
 * the same padding on every side, and the content block centred in it both
 * ways (direct instruction). The copy inside that block stays left-aligned
 * (direct correction) — centred lines put every list marker at a different x.
 *
 * The card hugs its content (direct instruction: reduce the container).
 * Reserving the tallest slide's 550px left "Before you start" floating in
 * ~240px of empty grey. Paging can change the card's height, which is safe
 * here: the prev/next controls sit ABOVE the card, so they never move.
 */
export function ZoomGuideSlide({ slide }: { slide: Slide }) {
  const img = slide.image
  return (
    <div className="flex w-full items-center justify-center rounded-sm bg-pearl p-8 text-body text-ink">
      <div className="flex w-full max-w-[760px] flex-col items-start gap-4">
        <h3 className="text-sub-greeting text-balance text-primary">{slide.title}</h3>
        <div className="flex w-full flex-col gap-3">
          {slide.blocks.map((b, i) => (
            <Fragment key={i}>
              <Block block={b} />
            </Fragment>
          ))}
        </div>
        {img && (
          /* Half the file's pixel size: the screenshots are 2x captures, so
             this is their natural on-screen size, capped to the column.
             `shadow-card` (direct instruction) is the Figma "Card shadow"
             style, so the two stay one value. */
          <img
            src={`${import.meta.env.BASE_URL}zoom-guide/${img.file}`}
            alt={img.alt}
            width={img.width / 2}
            height={img.height / 2}
            className="mt-2 h-auto max-w-full rounded-sm border border-hairline bg-white shadow-card"
            style={{ width: img.width / 2 }}
          />
        )}
      </div>
    </div>
  )
}
