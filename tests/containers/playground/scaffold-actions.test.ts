import { describe, it, expect } from 'vitest'
import {
  extractLiteralColors,
  scaffoldLegendFromLayer,
} from '#/containers/playground/scaffold-actions'
import type { LayerSchema } from '#/lib/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_SNAPSHOT: LayerSchema = {
  config: {
    sources: [
      {
        id: 'countries',
        type: 'geojson',
        legend_config: {
          type: 'basic',
          items: [{ label: 'Fill', value: '@@#params.fill_color' }],
        },
      },
    ],
    styles: [
      {
        source: 'countries',
        type: 'fill',
        paint: {
          'fill-color': '@@#params.fill_color',
          'fill-opacity': '@@#params.opacity',
        },
      },
    ],
  },
  params_config: [
    { key: 'fill_color', default: '#3b82f6', group: 'legend' },
    { key: 'opacity', default: 0.8 },
  ],
}

const LITERAL_MATCH_SNAPSHOT: LayerSchema = {
  config: {
    sources: [
      {
        id: 'regions',
        type: 'geojson',
        legend_config: {
          type: 'choropleth',
          items: [{ label: 'a', value: '#ff0000' }],
        },
      },
    ],
    styles: [
      {
        source: 'regions',
        type: 'fill',
        paint: {
          'fill-color': ['match', ['get', 'code'], 'A', '#ff0000', '#cccccc'],
        },
      },
    ],
  },
  params_config: [],
}

const NO_LEGEND_SNAPSHOT: LayerSchema = {
  config: {
    sources: [
      {
        id: 'quakes',
        type: 'geojson',
      },
    ],
    styles: [
      {
        source: 'quakes',
        type: 'circle',
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            3,
            '@@#params.low_color',
            7,
            '@@#params.high_color',
          ],
        },
      },
    ],
  },
  params_config: [
    { key: 'low_color', default: '#fee8c8', group: 'legend' },
    { key: 'high_color', default: '#b30000', group: 'legend' },
  ],
}

const STEP_SNAPSHOT: LayerSchema = {
  config: {
    sources: [
      {
        id: 'pop',
        type: 'geojson',
      },
    ],
    styles: [
      {
        source: 'pop',
        type: 'fill',
        paint: {
          'fill-color': [
            'step',
            ['get', 'density'],
            '@@#params.color_a',
            1000,
            '@@#params.color_b',
            5000,
            '@@#params.color_c',
          ],
        },
      },
    ],
  },
  params_config: [
    { key: 'color_a', default: '#edf8e9', group: 'legend' },
    { key: 'color_b', default: '#74c476', group: 'legend' },
    { key: 'color_c', default: '#006d2c', group: 'legend' },
  ],
}

// ── extractLiteralColors ──────────────────────────────────────────────────────

describe('extractLiteralColors', () => {
  it('returns the same snapshot when there are no color literals', () => {
    const result = extractLiteralColors(BASE_SNAPSHOT)
    expect(result).toEqual(BASE_SNAPSHOT)
  })

  it('replaces a bare hex literal in paint with a param ref', () => {
    const snapshot: LayerSchema = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: { type: 'basic', items: [] },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: { 'fill-color': '#aabbcc' },
          },
        ],
      },
      params_config: [],
    }

    const result = extractLiteralColors(snapshot)
    const styles = (
      result.config as { styles: { paint: Record<string, unknown> }[] }
    ).styles
    const paintColor = styles[0].paint['fill-color'] as string
    expect(paintColor).toMatch(/^@@#params\.auto_color_\d+$/)

    // The param_config should have a new entry
    const newKey = paintColor.replace('@@#params.', '')
    const paramEntry = result.params_config.find((p) => p.key === newKey)
    expect(paramEntry).toBeDefined()
    expect(paramEntry?.default).toBe('#aabbcc')
    expect(paramEntry?.group).toBe('legend')
  })

  it('replaces literals inside a match expression color slots', () => {
    const result = extractLiteralColors(LITERAL_MATCH_SNAPSHOT)
    const styles = (
      result.config as { styles: { paint: Record<string, unknown> }[] }
    ).styles
    const expr = styles[0].paint['fill-color'] as unknown[]

    // output at index 3 was '#ff0000' — should now be a param ref
    expect(typeof expr[3]).toBe('string')
    expect((expr[3] as string).startsWith('@@#params.')).toBe(true)

    // The extracted param should exist in params_config
    const key = (expr[3] as string).replace('@@#params.', '')
    const entry = result.params_config.find((p) => p.key === key)
    expect(entry?.default).toBe('#ff0000')
  })

  it('avoids key collisions with pre-existing params_config keys', () => {
    const snapshot: LayerSchema = {
      config: {
        sources: [
          {
            id: 's',
            type: 'geojson',
          },
        ],
        styles: [
          {
            source: 's',
            type: 'fill',
            paint: { 'fill-color': '#112233' },
          },
        ],
      },
      params_config: [{ key: 'auto_color_1', default: '#existing' }],
    }

    const result = extractLiteralColors(snapshot)
    const styles = (
      result.config as { styles: { paint: Record<string, unknown> }[] }
    ).styles
    const ref = styles[0].paint['fill-color'] as string
    const key = ref.replace('@@#params.', '')
    // Should skip auto_color_1 (already taken) and use auto_color_2
    expect(key).toBe('auto_color_2')
    // The original auto_color_1 entry should still be there
    expect(
      result.params_config.find((p) => p.key === 'auto_color_1'),
    ).toBeDefined()
  })

  it('returns an immutable copy — original snapshot is not mutated', () => {
    const result = extractLiteralColors(LITERAL_MATCH_SNAPSHOT)
    // Original should be unchanged
    const origStyles = (
      LITERAL_MATCH_SNAPSHOT.config as {
        styles: { paint: Record<string, unknown> }[]
      }
    ).styles
    const origExpr = origStyles[0].paint['fill-color'] as unknown[]
    expect(origExpr[3]).toBe('#ff0000')
    // Result should be different object
    expect(result).not.toBe(LITERAL_MATCH_SNAPSHOT)
  })
})

// ── scaffoldLegendFromLayer ───────────────────────────────────────────────────

describe('scaffoldLegendFromLayer', () => {
  it('re-derives and replaces a legend_config for a source with a bare-ref paint', () => {
    const result = scaffoldLegendFromLayer(BASE_SNAPSHOT)
    const sources = (result.config as { sources: Record<string, unknown>[] })
      .sources
    const legend = sources[0].legend_config as {
      type: string
      items: { label: string; value: unknown }[]
    }
    // Should be derived from the bare-ref fill_color paint
    expect(legend.type).toBe('basic')
    expect(legend.items[0].value).toBe('@@#params.fill_color')
  })

  it('builds a gradient legend from an interpolate expression', () => {
    const result = scaffoldLegendFromLayer(NO_LEGEND_SNAPSHOT)
    const sources = (result.config as { sources: Record<string, unknown>[] })
      .sources
    const legend = sources[0].legend_config as {
      type: string
      items: { label: string; value: unknown }[]
    }
    expect(legend.type).toBe('gradient')
    // Should have items for low_color and high_color
    expect(legend.items.length).toBeGreaterThanOrEqual(2)
    const values = legend.items.map((i) => i.value)
    expect(values).toContain('@@#params.low_color')
    expect(values).toContain('@@#params.high_color')
  })

  it('builds a choropleth legend from a step expression', () => {
    const result = scaffoldLegendFromLayer(STEP_SNAPSHOT)
    const sources = (result.config as { sources: Record<string, unknown>[] })
      .sources
    const legend = sources[0].legend_config as {
      type: string
      items: { label: string; value: unknown }[]
    }
    expect(legend.type).toBe('choropleth')
    expect(legend.items.length).toBeGreaterThanOrEqual(3)
    const values = legend.items.map((i) => i.value)
    expect(values).toContain('@@#params.color_a')
    expect(values).toContain('@@#params.color_b')
    expect(values).toContain('@@#params.color_c')
  })

  it('builds a choropleth legend from a match expression', () => {
    const matchSnapshot: LayerSchema = {
      config: {
        sources: [{ id: 'src', type: 'geojson' }],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': [
                'match',
                ['get', 'type'],
                'forest',
                '@@#params.forest_color',
                'desert',
                '@@#params.desert_color',
                '#888888',
              ],
            },
          },
        ],
      },
      params_config: [
        { key: 'forest_color', default: '#2d6a4f', group: 'legend' },
        { key: 'desert_color', default: '#e9c46a', group: 'legend' },
      ],
    }

    const result = scaffoldLegendFromLayer(matchSnapshot)
    const sources = (result.config as { sources: Record<string, unknown>[] })
      .sources
    const legend = sources[0].legend_config as {
      type: string
      items: { label: string; value: unknown }[]
    }
    expect(legend.type).toBe('choropleth')
    const values = legend.items.map((i) => i.value)
    expect(values).toContain('@@#params.forest_color')
    expect(values).toContain('@@#params.desert_color')
  })

  it('replaces an existing legend_config entirely (replace semantics)', () => {
    const snapshot: LayerSchema = {
      config: {
        sources: [
          {
            id: 's',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'Old', value: '#old' }],
            },
          },
        ],
        styles: [
          {
            source: 's',
            type: 'fill',
            paint: {
              'fill-color': [
                'step',
                ['get', 'v'],
                '@@#params.c1',
                10,
                '@@#params.c2',
              ],
            },
          },
        ],
      },
      params_config: [
        { key: 'c1', default: '#aaa', group: 'legend' },
        { key: 'c2', default: '#bbb', group: 'legend' },
      ],
    }

    const result = scaffoldLegendFromLayer(snapshot)
    const sources = (result.config as { sources: Record<string, unknown>[] })
      .sources
    const legend = sources[0].legend_config as {
      type: string
      items: { label: string; value: unknown }[]
    }
    // Should be the new legend, not the old one
    expect(legend.type).toBe('choropleth')
    expect(legend.items.map((i) => i.value)).not.toContain('#old')
  })

  it('returns an immutable copy — original snapshot is not mutated', () => {
    const result = scaffoldLegendFromLayer(NO_LEGEND_SNAPSHOT)
    const origSources = (
      NO_LEGEND_SNAPSHOT.config as { sources: Record<string, unknown>[] }
    ).sources
    expect(origSources[0].legend_config).toBeUndefined()
    expect(result).not.toBe(NO_LEGEND_SNAPSHOT)
  })
})
