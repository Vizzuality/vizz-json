/**
 * Lightweight jsonpath-like walker.
 * Supports dot notation for object keys, [N] for numeric index, [*] for array wildcard.
 *
 * Examples:
 *   walk(obj, 'stops[*][1]')
 *   walk(obj, 'paint.fill-color')
 *   walk(obj, 'a.b[0]')
 */

export type WalkResult = {
  readonly value: unknown
  readonly path: string
}

type Segment =
  | { type: 'key'; key: string }
  | { type: 'index'; index: number }
  | { type: 'wildcard' }

function parseSegments(pathStr: string): Segment[] {
  const segments: Segment[] = []
  // Split by '.' first, then handle [...] suffixes on each part
  // e.g. "stops[*][1]" → key "stops", wildcard, index 1
  //      "a.b[0]" → key "a", key "b", index 0
  const dotParts = pathStr.split('.')
  for (const part of dotParts) {
    // part may look like "stops[*][1]" or "b[0]" or just "color"
    const bracketRx = /^([^[]*)((?:\[(?:\*|\d+)\])*)$/
    const m = bracketRx.exec(part)
    if (!m) {
      segments.push({ type: 'key', key: part })
      continue
    }
    const [, keyPart, suffixes] = m
    if (keyPart) {
      segments.push({ type: 'key', key: keyPart })
    }
    // parse each [...] suffix
    const suffixRx = /\[(\*|\d+)\]/g
    let sm: RegExpExecArray | null
    while ((sm = suffixRx.exec(suffixes)) !== null) {
      if (sm[1] === '*') {
        segments.push({ type: 'wildcard' })
      } else {
        segments.push({ type: 'index', index: parseInt(sm[1], 10) })
      }
    }
  }
  return segments
}

function walkSegments(
  node: unknown,
  segments: readonly Segment[],
  basePath: string,
): WalkResult[] {
  if (segments.length === 0) {
    return [{ value: node, path: basePath }]
  }

  const [seg, ...rest] = segments

  if (seg.type === 'key') {
    if (node === null || node === undefined || typeof node !== 'object') {
      return []
    }
    const obj = node as Record<string, unknown>
    if (!(seg.key in obj)) return []
    const nextPath = basePath ? `${basePath}.${seg.key}` : seg.key
    return walkSegments(obj[seg.key], rest, nextPath)
  }

  if (seg.type === 'index') {
    if (!Array.isArray(node)) return []
    if (seg.index < 0 || seg.index >= node.length) return []
    const nextPath = `${basePath}[${seg.index}]`
    return walkSegments(node[seg.index], rest, nextPath)
  }

  // wildcard
  if (!Array.isArray(node)) return []
  const results: WalkResult[] = []
  for (let i = 0; i < node.length; i++) {
    const nextPath = `${basePath}[${i}]`
    results.push(...walkSegments(node[i], rest, nextPath))
  }
  return results
}

export function walk(input: unknown, path: string): WalkResult[] {
  if (input === null || input === undefined) return []
  const segments = parseSegments(path)
  return walkSegments(input, segments, '')
}
