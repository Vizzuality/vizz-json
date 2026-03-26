import { useMemo } from 'react'

type CodeBlockProps = {
  readonly value: Record<string, unknown> | unknown[]
  readonly title?: string
}

type HighlightType =
  | 'param-ref'
  | 'function-ref'
  | 'type-ref'
  | 'expr-ref'

type TextSegment = {
  readonly text: string
  readonly highlight?: HighlightType
}

const HIGHLIGHT_STYLES: Record<HighlightType, string> = {
  'param-ref': 'text-blue-400 bg-blue-400/10 rounded px-0.5',
  'function-ref': 'text-purple-400 bg-purple-400/10 rounded px-0.5',
  'type-ref': 'text-emerald-400 bg-emerald-400/10 rounded px-0.5',
  'expr-ref': 'text-amber-400 bg-amber-400/10 rounded px-0.5',
}

function classifyPrefix(value: string): HighlightType | undefined {
  if (value.startsWith('@@#params.')) return 'param-ref'
  if (value.startsWith('@@function')) return 'function-ref'
  if (value.startsWith('@@type')) return 'type-ref'
  if (value.startsWith('@@=')) return 'expr-ref'
  return undefined
}

// Match quoted strings containing @@ prefixes in JSON
function segmentJsonLine(line: string): TextSegment[] {
  const segments: TextSegment[] = []
  const regex =
    /"(@@#params\.[^"]*|@@function:[^"]*|@@function|@@type:[^"]*|@@type|@@=[^"]*)"/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index) })
    }
    const innerValue = match[1]
    const highlight = classifyPrefix(innerValue)
    segments.push({ text: match[0], highlight })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex) })
  }

  return segments
}

export function CodeBlock({ value, title }: CodeBlockProps) {
  const formatted = useMemo(() => JSON.stringify(value, null, 2), [value])

  const lines = useMemo(
    () => formatted.split('\n').map((line) => segmentJsonLine(line)),
    [formatted],
  )

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {title && (
        <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code role="code">
          {lines.map((segments, lineIndex) => (
            <span key={lineIndex}>
              {segments.map((segment, segIndex) =>
                segment.highlight ? (
                  <span
                    key={segIndex}
                    className={HIGHLIGHT_STYLES[segment.highlight]}
                    data-highlight={segment.highlight}
                  >
                    {segment.text}
                  </span>
                ) : (
                  <span key={segIndex}>{segment.text}</span>
                ),
              )}
              {lineIndex < lines.length - 1 ? '\n' : ''}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
