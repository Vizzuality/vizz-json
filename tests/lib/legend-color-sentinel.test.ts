/**
 * Sentinel behavior: resolveItemColor should return the sentinel magenta (#ff00ff)
 * when a color position fails to resolve — i.e., the valueParamKey is present but
 * the resolved value is missing or invalid, AND item.value itself is not a valid CSS color.
 *
 * This replaces the previous 'transparent' fallback for broken color positions so authors
 * see the failure visually on the map.
 */
import { describe, it, expect } from 'vitest'
import { resolveItemColor } from '#/lib/legend-color'

const SENTINEL = '#ff00ff'

describe('resolveItemColor sentinel behavior', () => {
  it('returns sentinel when valueParamKey is present but param value is missing from values', () => {
    const result = resolveItemColor(
      { value: '@@#params.missing_color' },
      { valueParamKey: 'missing_color' },
      {}, // empty values — key not found
    )
    expect(result).toBe(SENTINEL)
  })

  it('returns sentinel when valueParamKey is present but resolved value is not a valid CSS color string', () => {
    const result = resolveItemColor(
      { value: '@@#params.bad_color' },
      { valueParamKey: 'bad_color' },
      { bad_color: 42 }, // number, not a CSS color
    )
    expect(result).toBe(SENTINEL)
  })

  it('returns sentinel when item.value is an @@ ref that is not a valid CSS color (no mapping resolves it)', () => {
    // item.value starts with @@ — not a valid CSS color, not resolved via mapping
    const result = resolveItemColor(
      { value: '@@#params.orphan_color' },
      undefined,
      undefined,
    )
    expect(result).toBe(SENTINEL)
  })

  it('returns sentinel when valueParamKey present but values is undefined', () => {
    const result = resolveItemColor(
      { value: '@@#params.color' },
      { valueParamKey: 'color' },
      undefined,
    )
    expect(result).toBe(SENTINEL)
  })

  it('still returns a valid color when the param resolves correctly', () => {
    const result = resolveItemColor(
      { value: '@@#params.fill_color' },
      { valueParamKey: 'fill_color' },
      { fill_color: '#3b82f6' },
    )
    expect(result).toBe('#3b82f6')
  })

  it('still returns item.value when it is a valid CSS color and no mapping', () => {
    const result = resolveItemColor({ value: '#aabbcc' }, undefined, undefined)
    expect(result).toBe('#aabbcc')
  })

  it('returns sentinel for a garbage non-@@ non-color string when valueParamKey is present', () => {
    // valueParamKey signals this IS a color slot — if it can't resolve, show sentinel
    const result = resolveItemColor(
      { value: 'not_a_color' },
      { valueParamKey: 'some_color' },
      { some_color: 'not_a_color' }, // resolved but invalid
    )
    expect(result).toBe(SENTINEL)
  })

  it('returns transparent (not sentinel) for a garbage non-@@ string with no mapping', () => {
    // No valueParamKey → not obviously a color position; keep transparent
    const result = resolveItemColor(
      { value: 'not_a_color' },
      undefined,
      undefined,
    )
    expect(result).toBe('transparent')
  })
})
