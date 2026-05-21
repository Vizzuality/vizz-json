/**
 * Monaco editor integration: set validation markers (squiggles) and jump-to.
 *
 * pathToRange converts a validator diagnostic path string (e.g.
 * "config.sources[0].styles[1].paint.fill-color[2]") into a Monaco range by
 * walking the JSON source text. Uses a hand-written tokeniser (no external
 * dependency) since jsonc-parser is not yet in the dependency list.
 */
import type { Monaco } from '@monaco-editor/react'
import type { Diagnostic } from '#/lib/validator'

type IStandaloneCodeEditor = Monaco['editor']['IStandaloneCodeEditor']
type ITextModel = Monaco['editor']['ITextModel']
type IMarkerData = Monaco['editor']['IMarkerData']

// ── Range type ────────────────────────────────────────────────────────────────

type Range = {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

// ── Path tokeniser ────────────────────────────────────────────────────────────

type PathSegment =
  | { kind: 'key'; name: string }
  | { kind: 'index'; index: number }

function parsePath(path: string): PathSegment[] {
  const segments: PathSegment[] = []
  const re = /([^.[]+)|\[(\d+)\]/g
  let match: RegExpExecArray | null
  while ((match = re.exec(path)) !== null) {
    // One of the two capture groups fires per iteration; the other is ''
    if (match[1]) {
      segments.push({ kind: 'key', name: match[1] })
    } else {
      segments.push({ kind: 'index', index: parseInt(match[2], 10) })
    }
  }
  return segments
}

// ── JSON position finder ──────────────────────────────────────────────────────

function findPositionInJson(
  text: string,
  segments: PathSegment[],
): { startOffset: number; endOffset: number } | null {
  let pos = 0

  function skipWhitespace() {
    while (pos < text.length && /\s/.test(text[pos])) pos++
  }

  function peekChar(): string {
    skipWhitespace()
    return text[pos] ?? ''
  }

  function readString(): string | null {
    skipWhitespace()
    if (text[pos] !== '"') return null
    pos++
    let result = ''
    while (pos < text.length) {
      const ch = text[pos]
      if (ch === '\\') {
        pos++
        const esc = text[pos] ?? ''
        const escMap: Record<string, string> = {
          '"': '"',
          '\\': '\\',
          '/': '/',
          b: '\b',
          f: '\f',
          n: '\n',
          r: '\r',
          t: '\t',
        }
        result += escMap[esc] ?? esc
        pos++
      } else if (ch === '"') {
        pos++
        return result
      } else {
        result += ch
        pos++
      }
    }
    return null
  }

  function skipValue(): void {
    skipWhitespace()
    const ch = peekChar()
    if (ch === '"') {
      readString()
    } else if (ch === '{') {
      pos++
      skipWhitespace()
      if (peekChar() === '}') {
        pos++
        return
      }
      while (pos < text.length) {
        readString()
        skipWhitespace()
        if (text[pos] === ':') pos++
        skipValue()
        skipWhitespace()
        if (text[pos] === ',') {
          pos++
          continue
        }
        if (text[pos] === '}') {
          pos++
          break
        }
        break
      }
    } else if (ch === '[') {
      pos++
      skipWhitespace()
      if (peekChar() === ']') {
        pos++
        return
      }
      while (pos < text.length) {
        skipValue()
        skipWhitespace()
        if (text[pos] === ',') {
          pos++
          continue
        }
        if (text[pos] === ']') {
          pos++
          break
        }
        break
      }
    } else {
      while (pos < text.length && !/[\s,}\]]/.test(text[pos])) pos++
    }
  }

  function navigateTo(segIdx: number): boolean {
    if (segIdx >= segments.length) return true
    const seg = segments[segIdx]
    skipWhitespace()
    const ch = peekChar()

    if (seg.kind === 'key') {
      if (ch !== '{') return false
      pos++
      skipWhitespace()
      if (peekChar() === '}') return false
      while (pos < text.length) {
        const key = readString()
        if (key === null) return false
        skipWhitespace()
        if (text[pos] !== ':') return false
        pos++
        skipWhitespace()
        if (key === seg.name) {
          return navigateTo(segIdx + 1)
        }
        skipValue()
        skipWhitespace()
        if (text[pos] === ',') {
          pos++
          continue
        }
        if (text[pos] === '}') break
        break
      }
      return false
    }

    // seg.kind === 'index'
    {
      if (ch !== '[') return false
      pos++
      skipWhitespace()
      if (peekChar() === ']') return false
      let idx = 0
      while (pos < text.length) {
        skipWhitespace()
        if (idx === seg.index) {
          return navigateTo(segIdx + 1)
        }
        skipValue()
        idx++
        skipWhitespace()
        if (text[pos] === ',') {
          pos++
          continue
        }
        if (text[pos] === ']') break
        break
      }
      return false
    }

    return false
  }

  const found = navigateTo(0)
  if (!found) return null

  skipWhitespace()
  const startOffset = pos
  const ch = text[pos]
  let endOffset: number
  if (ch === '"') {
    readString()
    endOffset = pos
  } else {
    endOffset = pos
    while (endOffset < text.length && !/[\s,}\]]/.test(text[endOffset]))
      endOffset++
  }

  return { startOffset, endOffset }
}

function offsetToLineCol(
  text: string,
  offset: number,
): { line: number; col: number } {
  let line = 1
  let col = 1
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++
      col = 1
    } else {
      col++
    }
  }
  return { line, col }
}

export function pathToRange(jsonText: string, path: string): Range | null {
  const segments = parsePath(path)
  if (segments.length === 0) return null

  const result = findPositionInJson(jsonText, segments)
  if (!result) return null

  const { line: startLineNumber, col: startColumn } = offsetToLineCol(
    jsonText,
    result.startOffset,
  )
  const { line: endLineNumber, col: endColumn } = offsetToLineCol(
    jsonText,
    result.endOffset,
  )

  return { startLineNumber, startColumn, endLineNumber, endColumn }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function setValidationMarkers(
  _editor: IStandaloneCodeEditor | null,
  monacoApi: Monaco,
  model: ITextModel,
  jsonText: string,
  diagnostics: readonly Diagnostic[],
): void {
  const markers: IMarkerData[] = diagnostics.map((d) => {
    const range = pathToRange(jsonText, d.path) ?? {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    }
    return {
      severity:
        d.severity === 'error'
          ? monacoApi.MarkerSeverity.Error
          : monacoApi.MarkerSeverity.Warning,
      message: `${d.code}: ${d.message}`,
      startLineNumber: range.startLineNumber,
      startColumn: range.startColumn,
      endLineNumber: range.endLineNumber,
      endColumn: range.endColumn,
    }
  })
  monacoApi.editor.setModelMarkers(model, 'vizz-validator', markers)
}

export function jumpTo(
  editorInstance: IStandaloneCodeEditor | null,
  jsonText: string,
  path: string,
): void {
  const range = pathToRange(jsonText, path)
  if (!editorInstance || !range) return
  editorInstance.revealRangeNearTop({
    startLineNumber: range.startLineNumber,
    startColumn: range.startColumn,
    endLineNumber: range.endLineNumber,
    endColumn: range.endColumn,
  })
  editorInstance.setPosition({
    lineNumber: range.startLineNumber,
    column: range.startColumn,
  })
  editorInstance.focus()
}
