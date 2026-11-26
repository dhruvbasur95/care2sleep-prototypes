import { cn } from '@/lib/utils'
import { InlineText } from './InlineText'

/**
 * One long-form copy field rendered as chunks (2026-11-03, direct instruction:
 * "break into two paragraphs" / "break into chunks and add bullets"). The field
 * stays a single string so the block's shape is unchanged: a blank line starts
 * a new paragraph, and a chunk whose lines all begin `- ` is a bullet list.
 * A string with neither renders as one paragraph, exactly as before.
 *
 * Its own file since Module 8 (2026-11-27), whose accordion bodies and a
 * Style 1 sub-heading carry paragraph breaks: `AccordionWithImage` is imported
 * BY `BlockRenderer`, so it cannot import this back from there.
 */
export function ChunkedText({ text, className }: { text: string; className?: string }) {
  const chunks = text.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean)
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {chunks.map((chunk, i) => {
        const lines = chunk.split('\n').map((line) => line.trim())
        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <ul key={i} className="flex list-disc flex-col gap-2 pl-6">
              {lines.map((line) => (
                <li key={line}>
                  <InlineText text={line.slice(2)} />
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i}>
            <InlineText text={chunk} />
          </p>
        )
      })}
    </div>
  )
}
