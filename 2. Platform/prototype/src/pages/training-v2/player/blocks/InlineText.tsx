import { Fragment } from 'react'
import { cn } from '@/lib/utils'

/**
 * Renders the source's own inline emphasis (direct instruction, 2026-11-23:
 * *"always make sure to factor this in while extracting text"*).
 *
 * module.md marks emphasis inside a sentence with markdown — `**bold**`,
 * `*italic*`, `***bold italic***` — and the transcription now keeps those
 * markers in the data verbatim. This turns them back into `<strong>` / `<em>`.
 * `09. verify-transcription.py` already strips `*` on both sides, so data that
 * keeps the markers still passes.
 *
 * Bold is `font-semibold` (600), the heaviest step in this app's type scale,
 * not the browser's 700.
 */
const TOKEN = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*\s][^*]*?\*)/g

export function InlineText({ text }: { text: string }) {
  const parts = text.split(TOKEN)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
          return (
            <strong key={i} className="font-semibold">
              <em>{part.slice(3, -3)}</em>
            </strong>
          )
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}

/**
 * Paragraphs and bullet lists for text that sits where block elements are not
 * allowed — inside a `<button>` (the click-to-reveal answer), a heading (the
 * transition line) or a label. Same markup convention as `ChunkedText`: a blank
 * line starts a new paragraph, and a chunk whose lines all start `- ` is a
 * list. Every piece is a `<span>`; bullets get `display: list-item` for their
 * marker. Taken from the module's .docx, which keeps the Enters the .md loses.
 */
export function FormattedText({ text }: { text: string }) {
  const chunks = text.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean)
  const isList = (chunk: string) => chunk.split('\n').every((line) => line.trim().startsWith('- '))
  // A list reads down its left edge, so any text carrying one is left-aligned
  // even where its container centres (the click-to-reveal panel); plain
  // paragraphs keep whatever alignment they inherit.
  return (
    <span className={cn('flex flex-col gap-4', chunks.some(isList) && 'text-left')}>
      {chunks.map((chunk, i) => {
        const lines = chunk.split('\n').map((line) => line.trim())
        if (isList(chunk)) {
          return (
            <span key={i} className="flex flex-col gap-2">
              {lines.map((line) => (
                <span key={line} className="ml-6 list-item list-disc">
                  <InlineText text={line.slice(2)} />
                </span>
              ))}
            </span>
          )
        }
        return (
          <span key={i} className="block">
            <InlineText text={chunk} />
          </span>
        )
      })}
    </span>
  )
}
