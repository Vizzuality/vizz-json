import { describe, it, expect } from 'vitest'
import {
  extractLiteralColors,
  scaffoldLegendFromLayer,
  wireLayerToLegendParams,
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

// ── wireLayerToLegendParams ───────────────────────────────────────────────────

describe('wireLayerToLegendParams', () => {
  // Mimic the AI's "broken match" shape from the handoff: legend refs declared
  // and matching params_config entries exist, but paint outputs are hardcoded
  // hex literals — the params never flow into the layer.
  const BROKEN_MATCH_SNAPSHOT: LayerSchema = {
    config: {
      sources: [
        {
          id: 'world',
          type: 'geojson',
          legend_config: {
            type: 'choropleth',
            items: [
              {
                label: 'High income: OECD',
                value: '@@#params.high_oecd_color',
              },
              {
                label: 'High income: nonOECD',
                value: '@@#params.high_non_oecd_color',
              },
              {
                label: 'Upper middle income',
                value: '@@#params.upper_middle_color',
              },
              {
                label: 'Lower middle income',
                value: '@@#params.lower_middle_color',
              },
              {
                label: 'Low income',
                value: '@@#params.low_income_color',
              },
              { label: 'Fallback', value: '@@#params.fallback_color' },
            ],
          },
        },
      ],
      styles: [
        {
          source: 'world',
          type: 'fill',
          paint: {
            'fill-color': [
              'match',
              ['get', 'income_grp'],
              '1. High income: OECD',
              '#FCFFA4',
              '2. High income: nonOECD',
              '#FCA50A',
              '3. Upper middle income',
              '#DD513A',
              '4. Lower middle income',
              '#8B1C62',
              '5. Low income',
              '#2D0B59',
              '#ffffff',
            ],
          },
        },
      ],
    },
    params_config: [
      { key: 'high_oecd_color', default: '#000000', group: 'legend' },
      { key: 'high_non_oecd_color', default: '#000000', group: 'legend' },
      { key: 'upper_middle_color', default: '#000000', group: 'legend' },
      { key: 'lower_middle_color', default: '#000000', group: 'legend' },
      { key: 'low_income_color', default: '#000000', group: 'legend' },
      { key: 'fallback_color', default: '#000000', group: 'legend' },
    ],
  }

  it('wires literal paint outputs to legend params in ordinal order', () => {
    const { snapshot, warnings } = wireLayerToLegendParams(
      BROKEN_MATCH_SNAPSHOT,
    )
    expect(warnings).toEqual([])
    const styles = (
      snapshot.config as { styles: { paint: Record<string, unknown> }[] }
    ).styles
    const expr = styles[0].paint['fill-color'] as unknown[]
    // ["match", input, v1, out1, v2, out2, ..., default]
    expect(expr[3]).toBe('@@#params.high_oecd_color')
    expect(expr[5]).toBe('@@#params.high_non_oecd_color')
    expect(expr[7]).toBe('@@#params.upper_middle_color')
    expect(expr[9]).toBe('@@#params.lower_middle_color')
    expect(expr[11]).toBe('@@#params.low_income_color')
    expect(expr[12]).toBe('@@#params.fallback_color')
  })

  it('moves each literal value into the matching param default', () => {
    const { snapshot } = wireLayerToLegendParams(BROKEN_MATCH_SNAPSHOT)
    const byKey = Object.fromEntries(
      snapshot.params_config.map((p) => [p.key, p.default]),
    )
    expect(byKey['high_oecd_color']).toBe('#FCFFA4')
    expect(byKey['high_non_oecd_color']).toBe('#FCA50A')
    expect(byKey['upper_middle_color']).toBe('#DD513A')
    expect(byKey['lower_middle_color']).toBe('#8B1C62')
    expect(byKey['low_income_color']).toBe('#2D0B59')
    expect(byKey['fallback_color']).toBe('#ffffff')
  })

  it('returns a warning and leaves the source untouched when counts differ', () => {
    const snapshot: LayerSchema = {
      config: {
        sources: [
          {
            id: 's',
            type: 'geojson',
            legend_config: {
              type: 'choropleth',
              items: [
                { label: 'A', value: '@@#params.a_color' },
                { label: 'B', value: '@@#params.b_color' },
              ],
            },
          },
        ],
        styles: [
          {
            source: 's',
            type: 'fill',
            paint: {
              'fill-color': [
                'match',
                ['get', 'type'],
                'x',
                '#111111',
                'y',
                '#222222',
                'z',
                '#333333',
                '#444444',
              ],
            },
          },
        ],
      },
      params_config: [
        { key: 'a_color', default: '#aaa', group: 'legend' },
        { key: 'b_color', default: '#bbb', group: 'legend' },
      ],
    }

    const result = wireLayerToLegendParams(snapshot)
    expect(result.warnings.length).toBe(1)
    expect(result.warnings[0]).toContain('"s"')
    expect(result.warnings[0]).toContain('4 paint literal slots')
    expect(result.warnings[0]).toContain('2 legend params')
    // No mutation
    expect(result.snapshot).toBe(snapshot)
  })

  it('skips sources with no legend param refs and no literals to wire', () => {
    const result = wireLayerToLegendParams(BASE_SNAPSHOT)
    expect(result.warnings).toEqual([])
    expect(result.snapshot).toBe(BASE_SNAPSHOT)
  })

  it('wires interpolate gradient stops in order', () => {
    const snapshot: LayerSchema = {
      config: {
        sources: [
          {
            id: 'q',
            type: 'geojson',
            legend_config: {
              type: 'gradient',
              items: [
                { label: 'low', value: '@@#params.low_c' },
                { label: 'mid', value: '@@#params.mid_c' },
                { label: 'high', value: '@@#params.high_c' },
              ],
            },
          },
        ],
        styles: [
          {
            source: 'q',
            type: 'circle',
            paint: {
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'mag'],
                1,
                '#fee5d9',
                4,
                '#fc9272',
                8,
                '#cb181d',
              ],
            },
          },
        ],
      },
      params_config: [
        { key: 'low_c', default: '#000', group: 'legend' },
        { key: 'mid_c', default: '#000', group: 'legend' },
        { key: 'high_c', default: '#000', group: 'legend' },
      ],
    }

    const { snapshot: next, warnings } = wireLayerToLegendParams(snapshot)
    expect(warnings).toEqual([])
    const expr = (
      next.config as { styles: { paint: Record<string, unknown> }[] }
    ).styles[0].paint['circle-color'] as unknown[]
    expect(expr[4]).toBe('@@#params.low_c')
    expect(expr[6]).toBe('@@#params.mid_c')
    expect(expr[8]).toBe('@@#params.high_c')
    const byKey = Object.fromEntries(
      next.params_config.map((p) => [p.key, p.default]),
    )
    expect(byKey['low_c']).toBe('#fee5d9')
    expect(byKey['mid_c']).toBe('#fc9272')
    expect(byKey['high_c']).toBe('#cb181d')
  })

  it('skips already-wired paint slots (no literals = nothing to do)', () => {
    const result = wireLayerToLegendParams(NO_LEGEND_SNAPSHOT)
    // Source has no legend_config → no legend keys → skip
    expect(result.warnings).toEqual([])
    expect(result.snapshot).toBe(NO_LEGEND_SNAPSHOT)
  })

  it('does not mutate the original snapshot when wiring succeeds', () => {
    const snapshotJson = JSON.stringify(BROKEN_MATCH_SNAPSHOT)
    wireLayerToLegendParams(BROKEN_MATCH_SNAPSHOT)
    expect(JSON.stringify(BROKEN_MATCH_SNAPSHOT)).toBe(snapshotJson)
  })
})
