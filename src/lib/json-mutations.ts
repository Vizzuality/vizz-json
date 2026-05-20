/** Helpers that mutate config.styles[] / config.sources[] in a JSON string and return the re-serialized result. */

function getStylesRef(parsed: Record<string, unknown>): unknown[] {
  const config = parsed.config as Record<string, unknown> | undefined
  if (config && Array.isArray(config.styles)) return config.styles
  if (Array.isArray(parsed.styles)) return parsed.styles as unknown[]
  throw new Error('No styles array found in parsed JSON')
}

function getSourcesRef(parsed: Record<string, unknown>): unknown[] {
  const config = parsed.config as Record<string, unknown> | undefined
  if (config && Array.isArray(config.sources)) return config.sources
  if (Array.isArray(parsed.sources)) return parsed.sources as unknown[]
  throw new Error('No sources array found in parsed JSON')
}

function assertInRange(
  arr: readonly unknown[],
  index: number,
  label: string,
): void {
  if (index < 0 || index >= arr.length) {
    throw new RangeError(
      `${label} index ${index} out of range (length: ${arr.length})`,
    )
  }
}

function parse(jsonText: string): Record<string, unknown> {
  return JSON.parse(jsonText) as Record<string, unknown>
}

function serialize(parsed: Record<string, unknown>): string {
  return JSON.stringify(parsed, null, 2)
}

/**
 * Move a style from `fromIndex` to `toIndex` in the styles array.
 * Parses jsonText, reorders config.styles[] (or top-level styles[]),
 * and returns re-serialized JSON with 2-space indent.
 */
export function reorderStyles(
  jsonText: string,
  fromIndex: number,
  toIndex: number,
): string {
  const parsed = parse(jsonText)
  const styles = getStylesRef(parsed)

  assertInRange(styles, fromIndex, 'style')
  assertInRange(styles, toIndex, 'style')

  if (fromIndex === toIndex) return serialize(parsed)

  const item = styles.splice(fromIndex, 1)[0]
  styles.splice(toIndex, 0, item)

  return serialize(parsed)
}

/**
 * Move a source from `fromIndex` to `toIndex` in the sources array.
 * Parses jsonText, reorders config.sources[] (or top-level sources[]),
 * and returns re-serialized JSON with 2-space indent.
 */
export function reorderSources(
  jsonText: string,
  fromIndex: number,
  toIndex: number,
): string {
  const parsed = parse(jsonText)
  const sources = getSourcesRef(parsed)

  assertInRange(sources, fromIndex, 'source')
  assertInRange(sources, toIndex, 'source')

  if (fromIndex === toIndex) return serialize(parsed)

  const item = sources.splice(fromIndex, 1)[0]
  sources.splice(toIndex, 0, item)

  return serialize(parsed)
}

/**
 * Set layout.visibility on a specific style entry.
 * Creates layout object if absent.
 */
export function setStyleVisibility(
  jsonText: string,
  styleIndex: number,
  visible: boolean,
): string {
  const parsed = parse(jsonText)
  const styles = getStylesRef(parsed)

  assertInRange(styles, styleIndex, 'style')

  const style = styles[styleIndex] as Record<string, unknown>
  const existingLayout = (style.layout ?? {}) as Record<string, unknown>
  style.layout = { ...existingLayout, visibility: visible ? 'visible' : 'none' }

  return serialize(parsed)
}

/**
 * Write a numeric opacity value to a specific paint key on a style.
 * Creates paint object if absent.
 */
export function setStyleOpacityLiteral(
  jsonText: string,
  styleIndex: number,
  paintKey: string,
  value: number,
): string {
  const parsed = parse(jsonText)
  const styles = getStylesRef(parsed)

  assertInRange(styles, styleIndex, 'style')

  const style = styles[styleIndex] as Record<string, unknown>
  const existingPaint = (style.paint ?? {}) as Record<string, unknown>
  style.paint = { ...existingPaint, [paintKey]: value }

  return serialize(parsed)
}
