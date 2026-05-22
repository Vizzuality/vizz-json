import { describe, it, expect } from 'vitest'
import { validate } from '#/lib/validator/index'
import type { ValidatorRegistry, Diagnostic } from '#/lib/validator/types'

const stubRegistry: ValidatorRegistry = {
  getFunctionMeta: (name) =>
    name === 'buildColormap' ? { colorArgPaths: ['stops[*][1]'] } : undefined,
}

function codesOf(diags: readonly Diagnostic[]): string[] {
  return diags.map((diag) => diag.code)
}

// ── Minimal valid snapshot for single-source ────────────────────────
const validSingleSource = {
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
        layout: { visibility: '@@#params.visibility' },
      },
    ],
  },
  params_config: [
    { key: 'fill_color', default: '#3b82f6', group: 'legend' },
    { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
    { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
  ],
}

// ── COLOR_LITERAL_IN_PAINT ───────────────────────────────────────────

describe('COLOR_LITERAL_IN_PAINT', () => {
  it('emits error when paint contains a hex literal', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'x', value: '@@#params.fill_color' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': '#aabbcc',
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#aabbcc' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).toContain('COLOR_LITERAL_IN_PAINT')
    const found = diags.find((diag) => diag.code === 'COLOR_LITERAL_IN_PAINT')!
    expect(found.severity).toBe('error')
    expect(found.meta?.literal).toBe('#aabbcc')
  })

  it('does not emit for param refs in paint', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('COLOR_LITERAL_IN_PAINT')
  })

  it('emits for hex literal inside match expression color slot', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'x', value: '@@#params.high_color' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': [
                'match',
                ['get', 'cat'],
                'A',
                '#ff0000',
                '@@#params.high_color',
              ],
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'high_color', default: '#ff0000', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).toContain('COLOR_LITERAL_IN_PAINT')
  })

  it('does NOT emit for data-value slots in match expression', () => {
    // 'A' is a data value (match key), not a color slot
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'x', value: '@@#params.color_a' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': [
                'match',
                ['get', 'cat'],
                'A',
                '@@#params.color_a',
                '@@#params.default_color',
              ],
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_a', default: '#3b82f6', group: 'legend' },
        { key: 'default_color', default: '#6b7280', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).not.toContain('COLOR_LITERAL_IN_PAINT')
  })

  it('emits for color slot literal in interpolate expression', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'gradient',
              items: [{ label: 'x', value: '@@#params.color_low' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'value'],
                0,
                '#ff0000',
                100,
                '@@#params.color_low',
              ],
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_low', default: '#2171b5', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).toContain('COLOR_LITERAL_IN_PAINT')
  })

  it('emits for literal in step expression output slot', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'choropleth',
              items: [{ label: 'x', value: '@@#params.color_1' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': [
                'step',
                ['get', 'value'],
                '#000000',
                50,
                '@@#params.color_1',
              ],
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_1', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).toContain('COLOR_LITERAL_IN_PAINT')
  })

  it('emits for literal in case expression output slot', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'x', value: '@@#params.active_color' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': [
                'case',
                ['get', 'active'],
                '@@#params.active_color',
                '#cccccc',
              ],
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'active_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).toContain('COLOR_LITERAL_IN_PAINT')
  })
})

// ── COLOR_LITERAL_IN_LEGEND ──────────────────────────────────────────

describe('COLOR_LITERAL_IN_LEGEND', () => {
  it('emits error when legend item value is a literal hex', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'x', value: '#ff0000' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': '@@#params.fill_color',
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#ff0000', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).toContain('COLOR_LITERAL_IN_LEGEND')
    const found = diags.find((diag) => diag.code === 'COLOR_LITERAL_IN_LEGEND')!
    expect(found.severity).toBe('error')
  })

  it('does not emit when legend item value is a param ref', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('COLOR_LITERAL_IN_LEGEND')
  })

  it('does not emit for numeric threshold items in gradient legend', () => {
    // threshold items have numeric values — not color slots
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'raster',
            legend_config: {
              type: 'gradient',
              items: [
                { label: 'low', value: '@@#params.color_1' },
                { label: 'threshold', value: 100 },
                { label: 'high', value: '@@#params.color_2' },
              ],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'raster',
            paint: { 'raster-opacity': '@@#params.opacity' },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_1', default: '#2171b5', group: 'legend' },
        { key: 'color_2', default: '#f5f5f5', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).not.toContain('COLOR_LITERAL_IN_LEGEND')
  })
})

// ── LEGEND_LAYER_MISMATCH ────────────────────────────────────────────

describe('LEGEND_LAYER_MISMATCH', () => {
  it('emits error when a color param appears in paint (non-exempt slot) but not in legend', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              // only color_a in legend; color_b is in a non-default (non-exempt) output slot
              items: [{ label: 'x', value: '@@#params.color_a' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              // match with two output slots (non-default): both color_a and color_b
              // color_b is at index 5 (non-exempt), not the last element
              'fill-color': [
                'match',
                ['get', 'cat'],
                'A',
                '@@#params.color_a',
                'B',
                '@@#params.color_b',
                '@@#params.default_color',
              ],
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_a', default: '#3b82f6', group: 'legend' },
        { key: 'color_b', default: '#ff0000', group: 'legend' },
        { key: 'default_color', default: '#6b7280', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const mismatch = diags.filter(
      (diag) => diag.code === 'LEGEND_LAYER_MISMATCH',
    )
    expect(mismatch.length).toBeGreaterThan(0)
    expect(mismatch[0].severity).toBe('error')
    // color_b should be the layer-only param
    expect(mismatch.some((diag) => diag.meta?.key === 'color_b')).toBe(true)
  })

  it('does not emit mismatch when paint and legend refs are symmetric', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('LEGEND_LAYER_MISMATCH')
  })

  it('emits for legend-only param (in legend but not in paint)', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [
                { label: 'Fill', value: '@@#params.fill_color' },
                // extra_color only in legend
                { label: 'Extra', value: '@@#params.extra_color' },
              ],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': '@@#params.fill_color',
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'extra_color', default: '#ff0000', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const mismatch = diags.filter(
      (diag) =>
        diag.code === 'LEGEND_LAYER_MISMATCH' &&
        diag.meta?.direction === 'legend-only',
    )
    expect(mismatch.length).toBeGreaterThan(0)
  })

  it('exempts match default-only params from LEGEND_LAYER_MISMATCH', () => {
    // default_color appears ONLY in the last (default) slot of match
    // It is exempt and should NOT emit layer-only mismatch
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'A', value: '@@#params.color_a' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': [
                'match',
                ['get', 'cat'],
                'A',
                '@@#params.color_a',
                '@@#params.default_color',
              ],
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_a', default: '#3b82f6', group: 'legend' },
        { key: 'default_color', default: '#6b7280', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    // default_color should NOT trigger LEGEND_LAYER_MISMATCH
    const mismatch = diags.filter(
      (diag) => diag.code === 'LEGEND_LAYER_MISMATCH',
    )
    expect(mismatch.length).toBe(0)
  })
})

// ── MISSING_LEGEND_CONFIG ────────────────────────────────────────────

describe('MISSING_LEGEND_CONFIG', () => {
  it('emits error when non-raster source has no legend_config', () => {
    const snapshot = {
      config: {
        sources: [{ id: 'src', type: 'geojson' }],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': '@@#params.fill_color',
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const found = diags.find((diag) => diag.code === 'MISSING_LEGEND_CONFIG')
    expect(found).toBeDefined()
    expect(found!.severity).toBe('error')
  })

  it('emits warn (not error) when raster source has no legend_config', () => {
    const snapshot = {
      config: {
        sources: [{ id: 'src', type: 'raster' }],
        styles: [
          {
            source: 'src',
            type: 'raster',
            paint: { 'raster-opacity': '@@#params.opacity' },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const found = diags.find((diag) => diag.code === 'MISSING_LEGEND_CONFIG')
    expect(found).toBeDefined()
    expect(found!.severity).toBe('warn')
  })

  it('does not emit when legend_config is present', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('MISSING_LEGEND_CONFIG')
  })
})

// ── Source-level @@function colorArgPaths (Gap 2) ────────────────────

describe('LEGEND_LAYER_MISMATCH — source-level @@function colorArgPaths', () => {
  it('does not emit when color params come from buildColormap in source.tiles', () => {
    // Example 07 pattern: colors are in source.tiles[0].query.colormap.stops[*][1]
    // The validator must walk source-level function calls via colorArgPaths.
    const snapshot = {
      config: {
        sources: [
          {
            id: 'imagery',
            type: 'raster',
            tiles: [
              {
                '@@function': 'setQueryParams',
                url: 'https://example.com/tiles/{z}/{x}/{y}.png',
                query: {
                  colormap: {
                    '@@function': 'buildColormap',
                    stops: [
                      [0, '@@#params.color_1'],
                      [50, '@@#params.color_2'],
                      [100, '@@#params.color_3'],
                    ],
                  },
                },
              },
            ],
            legend_config: {
              type: 'gradient',
              items: [
                { label: 'Low', value: '@@#params.color_1' },
                { label: 'Mid', value: '@@#params.color_2' },
                { label: 'High', value: '@@#params.color_3' },
              ],
            },
          },
        ],
        styles: [
          {
            source: 'imagery',
            type: 'raster',
            paint: { 'raster-opacity': '@@#params.opacity' },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_1', default: '#08306b', group: 'legend' },
        { key: 'color_2', default: '#08519c', group: 'legend' },
        { key: 'color_3', default: '#2171b5', group: 'legend' },
        { key: 'opacity', default: 1.0, min: 0, max: 1, step: 0.05 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).not.toContain('LEGEND_LAYER_MISMATCH')
  })

  it('emits COLOR_LITERAL_IN_PAINT when buildColormap stop has a literal color', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'imagery',
            type: 'raster',
            tiles: [
              {
                '@@function': 'buildColormap',
                stops: [
                  [0, '#ff0000'],
                  [100, '@@#params.color_2'],
                ],
              },
            ],
            legend_config: {
              type: 'gradient',
              items: [{ label: 'High', value: '@@#params.color_2' }],
            },
          },
        ],
        styles: [
          {
            source: 'imagery',
            type: 'raster',
            paint: { 'raster-opacity': '@@#params.opacity' },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_2', default: '#2171b5', group: 'legend' },
        { key: 'opacity', default: 1.0, min: 0, max: 1, step: 0.05 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).toContain('COLOR_LITERAL_IN_PAINT')
  })

  it('detects buildColormap nested deeper in source (source.tiles[0])', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'raster',
            tiles: [
              {
                '@@function': 'buildColormap',
                stops: [
                  [0, '@@#params.color_low'],
                  [100, '@@#params.color_high'],
                ],
              },
            ],
            legend_config: {
              type: 'gradient',
              items: [
                { label: 'Low', value: '@@#params.color_low' },
                { label: 'High', value: '@@#params.color_high' },
              ],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'raster',
            paint: { 'raster-opacity': '@@#params.opacity' },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'color_low', default: '#08306b', group: 'legend' },
        { key: 'color_high', default: '#f5f5f5', group: 'legend' },
        { key: 'opacity', default: 1.0, min: 0, max: 1, step: 0.05 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).not.toContain('LEGEND_LAYER_MISMATCH')
  })

  it('ignores function calls with no colorArgPaths registered', () => {
    const registryNoColorArgs: ValidatorRegistry = {
      getFunctionMeta: (name) => (name === 'setQueryParams' ? {} : undefined),
    }
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'Fill', value: '@@#params.fill_color' }],
            },
            // A function call in the source that has no colorArgPaths
            someField: {
              '@@function': 'setQueryParams',
              url: 'https://example.com',
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              'fill-color': '@@#params.fill_color',
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, registryNoColorArgs)
    // No false errors from the no-colorArgPaths function
    expect(codesOf(diags)).not.toContain('LEGEND_LAYER_MISMATCH')
    expect(codesOf(diags)).not.toContain('COLOR_LITERAL_IN_PAINT')
  })
})
