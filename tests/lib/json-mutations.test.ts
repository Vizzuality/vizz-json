import { describe, it, expect } from 'vitest'
import {
  reorderStyles,
  setStyleVisibility,
  setStyleOpacityLiteral,
} from '#/lib/json-mutations'

// Base JSON for tests
const baseJson = JSON.stringify(
  {
    metadata: { title: 'Test' },
    config: {
      sources: [{ id: 'a' }],
      styles: [
        { source: 'a', type: 'fill', paint: { 'fill-opacity': 0.8 } },
        { source: 'b', type: 'circle', paint: { 'circle-opacity': 0.5 } },
        { source: 'c', type: 'raster', paint: { 'raster-opacity': 1.0 } },
      ],
    },
    params_config: [],
  },
  null,
  2,
)

// Flat-styles JSON (no config wrapper)
const flatJson = JSON.stringify(
  {
    styles: [
      { source: 'x', type: 'fill' },
      { source: 'y', type: 'line' },
    ],
  },
  null,
  2,
)

// ------------------------------------------------------------------ reorderStyles

describe('reorderStyles', () => {
  it('moves element from index 0 to index 2', () => {
    const result = JSON.parse(reorderStyles(baseJson, 0, 2))
    const styles = result.config.styles
    expect(styles[0].source).toBe('b')
    expect(styles[1].source).toBe('c')
    expect(styles[2].source).toBe('a')
  })

  it('moves element from index 2 to index 0', () => {
    const result = JSON.parse(reorderStyles(baseJson, 2, 0))
    const styles = result.config.styles
    expect(styles[0].source).toBe('c')
    expect(styles[1].source).toBe('a')
    expect(styles[2].source).toBe('b')
  })

  it('moves adjacent elements (0→1)', () => {
    const result = JSON.parse(reorderStyles(baseJson, 0, 1))
    const styles = result.config.styles
    expect(styles[0].source).toBe('b')
    expect(styles[1].source).toBe('a')
    expect(styles[2].source).toBe('c')
  })

  it('is a no-op when from === to', () => {
    const result = JSON.parse(reorderStyles(baseJson, 1, 1))
    const styles = result.config.styles
    expect(styles[0].source).toBe('a')
    expect(styles[1].source).toBe('b')
    expect(styles[2].source).toBe('c')
  })

  it('preserves non-styles fields (metadata, params_config)', () => {
    const result = JSON.parse(reorderStyles(baseJson, 0, 1))
    expect(result.metadata.title).toBe('Test')
    expect(result.params_config).toEqual([])
  })

  it('preserves all style object fields', () => {
    const result = JSON.parse(reorderStyles(baseJson, 0, 2))
    expect(result.config.styles[2].paint['fill-opacity']).toBe(0.8)
  })

  it('works on flat-styles JSON (no config wrapper)', () => {
    const result = JSON.parse(reorderStyles(flatJson, 0, 1))
    expect(result.styles[0].source).toBe('y')
    expect(result.styles[1].source).toBe('x')
  })

  it('throws on invalid JSON', () => {
    expect(() => reorderStyles('not json', 0, 1)).toThrow()
  })

  it('throws when fromIndex is out of range', () => {
    expect(() => reorderStyles(baseJson, 5, 1)).toThrow()
  })

  it('throws when toIndex is out of range', () => {
    expect(() => reorderStyles(baseJson, 0, 5)).toThrow()
  })
})

// ------------------------------------------------------------------ setStyleVisibility

describe('setStyleVisibility', () => {
  it('sets visibility to none for index 0', () => {
    const result = JSON.parse(setStyleVisibility(baseJson, 0, false))
    expect(result.config.styles[0].layout.visibility).toBe('none')
  })

  it('sets visibility to visible for index 1', () => {
    const result = JSON.parse(setStyleVisibility(baseJson, 1, true))
    expect(result.config.styles[1].layout.visibility).toBe('visible')
  })

  it('preserves existing layout keys when toggling', () => {
    const json = JSON.stringify(
      {
        config: {
          styles: [
            {
              source: 'x',
              type: 'fill',
              layout: { visibility: 'visible', 'line-join': 'round' },
            },
          ],
        },
      },
      null,
      2,
    )
    const result = JSON.parse(setStyleVisibility(json, 0, false))
    expect(result.config.styles[0].layout['line-join']).toBe('round')
    expect(result.config.styles[0].layout.visibility).toBe('none')
  })

  it('creates layout object when absent', () => {
    const json = JSON.stringify(
      {
        config: {
          styles: [{ source: 'x', type: 'fill' }],
        },
      },
      null,
      2,
    )
    const result = JSON.parse(setStyleVisibility(json, 0, false))
    expect(result.config.styles[0].layout.visibility).toBe('none')
  })

  it('is idempotent — toggling visible twice stays visible', () => {
    const once = setStyleVisibility(baseJson, 0, true)
    const twice = setStyleVisibility(once, 0, true)
    expect(JSON.parse(twice).config.styles[0].layout.visibility).toBe('visible')
  })

  it('works on flat-styles JSON', () => {
    const result = JSON.parse(setStyleVisibility(flatJson, 0, false))
    expect(result.styles[0].layout.visibility).toBe('none')
  })

  it('throws on invalid JSON', () => {
    expect(() => setStyleVisibility('bad json', 0, true)).toThrow()
  })

  it('throws when styleIndex is out of range', () => {
    expect(() => setStyleVisibility(baseJson, 10, true)).toThrow()
  })
})

// ------------------------------------------------------------------ setStyleOpacityLiteral

describe('setStyleOpacityLiteral', () => {
  it('sets numeric opacity on existing paint key', () => {
    const result = JSON.parse(
      setStyleOpacityLiteral(baseJson, 0, 'fill-opacity', 0.3),
    )
    expect(result.config.styles[0].paint['fill-opacity']).toBe(0.3)
  })

  it('writes to a different style index', () => {
    const result = JSON.parse(
      setStyleOpacityLiteral(baseJson, 1, 'circle-opacity', 0.9),
    )
    expect(result.config.styles[1].paint['circle-opacity']).toBe(0.9)
  })

  it('adds new paint key when missing', () => {
    const json = JSON.stringify(
      {
        config: { styles: [{ source: 'x', type: 'fill', paint: {} }] },
      },
      null,
      2,
    )
    const result = JSON.parse(
      setStyleOpacityLiteral(json, 0, 'fill-opacity', 0.7),
    )
    expect(result.config.styles[0].paint['fill-opacity']).toBe(0.7)
  })

  it('creates paint object when absent', () => {
    const json = JSON.stringify(
      {
        config: { styles: [{ source: 'x', type: 'fill' }] },
      },
      null,
      2,
    )
    const result = JSON.parse(
      setStyleOpacityLiteral(json, 0, 'fill-opacity', 0.5),
    )
    expect(result.config.styles[0].paint['fill-opacity']).toBe(0.5)
  })

  it('preserves other paint keys', () => {
    const result = JSON.parse(
      setStyleOpacityLiteral(baseJson, 0, 'fill-opacity', 0.2),
    )
    // source and type untouched
    expect(result.config.styles[0].source).toBe('a')
    expect(result.config.styles[0].type).toBe('fill')
  })

  it('works on flat-styles JSON', () => {
    const json = JSON.stringify(
      {
        styles: [{ source: 'x', type: 'fill', paint: { 'fill-opacity': 0.8 } }],
      },
      null,
      2,
    )
    const result = JSON.parse(
      setStyleOpacityLiteral(json, 0, 'fill-opacity', 0.2),
    )
    expect(result.styles[0].paint['fill-opacity']).toBe(0.2)
  })

  it('throws on invalid JSON', () => {
    expect(() =>
      setStyleOpacityLiteral('bad json', 0, 'fill-opacity', 0.5),
    ).toThrow()
  })

  it('throws when styleIndex is out of range', () => {
    expect(() =>
      setStyleOpacityLiteral(baseJson, 10, 'fill-opacity', 0.5),
    ).toThrow()
  })
})
