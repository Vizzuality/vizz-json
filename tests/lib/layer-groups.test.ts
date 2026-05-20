import { describe, it, expect } from 'vitest'
import { deriveLayerGroups, collectParamRefs } from '#/lib/layer-groups'
import { inferParamControl } from '#/lib/param-inference'
import { extractLegendParamKeys } from '#/lib/legend-param-mapping'
import type { LegendConfig, ParamConfig } from '#/lib/types'
import type { SourceLegendEntry } from '#/lib/pipeline/types'

// Helper to build InferredParam array from ParamConfig array
function infer(configs: readonly ParamConfig[]) {
  return configs.map(inferParamControl)
}

// Helper to build a SourceLegendEntry from raw legend + param values for resolution
function makeLegendEntry(
  sourceId: string,
  rawLegend: LegendConfig,
  resolvedLegend: LegendConfig,
  extraParams: readonly {
    key: string
    value: unknown
    control_type:
      | 'slider'
      | 'color_picker'
      | 'switch'
      | 'text_input'
      | 'select'
      | 'json_editor'
    group?: 'legend'
  }[] = [],
): SourceLegendEntry {
  const paramMapping = extractLegendParamKeys(rawLegend)
  return {
    sourceId,
    rawLegend,
    resolvedLegend,
    paramMapping,
    thresholdParams: extraParams.filter(
      (p) => p.control_type === 'slider' && p.group === 'legend',
    ) as readonly any[],
  }
}

// ------------------------------------------------------------------ example configs

const example01Config = {
  config: {
    sources: [{ id: 'imagery', type: 'raster' }],
    styles: [
      {
        source: 'imagery',
        type: 'raster',
        paint: { 'raster-opacity': '@@#params.opacity' },
        layout: { visibility: '@@#params.visibility' },
      },
    ],
  },
}

const example01Params: ParamConfig[] = [
  { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
  { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
]

const example01RawLegend: LegendConfig = {
  type: 'basic',
  items: [{ label: 'Sentinel-2 Imagery', value: 'visible' }],
}

const example02Config = {
  config: {
    sources: [{ id: 'countries', type: 'geojson' }],
    styles: [
      {
        source: 'countries',
        type: 'fill',
        paint: {
          'fill-color': '@@#params.fill_color',
          'fill-opacity': '@@#params.opacity',
          'fill-outline-color': '@@#params.outline_color',
        },
        layout: { visibility: '@@#params.visibility' },
      },
    ],
  },
}

const example02Params: ParamConfig[] = [
  { key: 'fill_color', default: '#3b82f6', group: 'legend' },
  { key: 'outline_color', default: '#ffffff', group: 'legend' },
  { key: 'opacity', default: 0.7, min: 0, max: 1, step: 0.05 },
  { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
]

const example02RawLegend: LegendConfig = {
  type: 'basic',
  items: [{ label: 'Countries', value: '@@#params.fill_color' }],
}

// Example 11: multi-source heatmap
const example11Config = {
  config: {
    sources: [
      { id: 'countries', type: 'geojson' },
      { id: 'capitals', type: 'geojson' },
    ],
    styles: [
      {
        source: 'countries',
        type: 'fill',
        paint: {
          'fill-color': '@@#params.fill_color',
          'fill-opacity': '@@#params.fill_opacity',
          'fill-outline-color': '#ffffff',
        },
      },
      {
        source: 'capitals',
        type: 'heatmap',
        paint: {
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.2,
            '@@#params.heatmap_color_low',
            0.6,
            '@@#params.heatmap_color_mid',
            1.0,
            '@@#params.heatmap_color_high',
          ],
          'heatmap-opacity': '@@#params.heatmap_opacity',
        },
      },
    ],
  },
}

const example11Params: ParamConfig[] = [
  { key: 'fill_color', default: '#dbeafe', group: 'legend' },
  { key: 'fill_opacity', default: 0.6, min: 0, max: 1, step: 0.05 },
  { key: 'heatmap_color_low', default: '#2c7bb6', group: 'legend' },
  { key: 'heatmap_color_mid', default: '#fdae61', group: 'legend' },
  { key: 'heatmap_color_high', default: '#d7191c', group: 'legend' },
  { key: 'heatmap_opacity', default: 0.85, min: 0, max: 1, step: 0.05 },
]

const example11RawLegendCountries: LegendConfig = {
  type: 'basic',
  items: [{ label: 'Country fill', value: '@@#params.fill_color' }],
}

const example11RawLegendCapitals: LegendConfig = {
  type: 'gradient',
  items: [
    { label: 'Heatmap low', value: '@@#params.heatmap_color_low' },
    { label: 'Heatmap high', value: '@@#params.heatmap_color_high' },
  ],
}

// ------------------------------------------------------------------ tests

describe('collectParamRefs', () => {
  it('collects @@#params.* keys from a string value', () => {
    const refs = new Set<string>()
    collectParamRefs('@@#params.opacity', refs)
    expect(refs.has('opacity')).toBe(true)
  })

  it('ignores non-param strings', () => {
    const refs = new Set<string>()
    collectParamRefs('some-literal', refs)
    expect(refs.size).toBe(0)
  })

  it('traverses arrays recursively', () => {
    const refs = new Set<string>()
    collectParamRefs(['@@#params.a', 'literal', '@@#params.b'], refs)
    expect(refs.has('a')).toBe(true)
    expect(refs.has('b')).toBe(true)
  })

  it('traverses objects recursively', () => {
    const refs = new Set<string>()
    collectParamRefs(
      { x: '@@#params.color', y: { z: '@@#params.opacity' } },
      refs,
    )
    expect(refs.has('color')).toBe(true)
    expect(refs.has('opacity')).toBe(true)
  })

  it('ignores null and non-objects', () => {
    const refs = new Set<string>()
    collectParamRefs(null, refs)
    collectParamRefs(42, refs)
    collectParamRefs(undefined, refs)
    expect(refs.size).toBe(0)
  })
})

describe('deriveLayerGroups', () => {
  describe('null config', () => {
    it('returns empty groups and all params as orphans', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(null, params, [])
      expect(result.groups).toHaveLength(0)
      expect(result.orphans).toHaveLength(params.length)
      expect(result.orphans).toEqual(params)
    })

    it('handles null params too', () => {
      const result = deriveLayerGroups(null, [], [])
      expect(result.groups).toHaveLength(0)
      expect(result.orphans).toHaveLength(0)
    })
  })

  describe('missing or empty styles/sources', () => {
    it('returns empty groups when styles array is absent', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups({ config: {} }, params, [])
      expect(result.groups).toHaveLength(0)
      expect(result.orphans).toHaveLength(params.length)
    })

    it('returns empty groups when styles array is empty', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(
        { config: { sources: [{ id: 'x' }], styles: [] } },
        params,
        [],
      )
      expect(result.groups).toHaveLength(0)
      expect(result.orphans).toHaveLength(params.length)
    })

    it('skips source with no matching styles', () => {
      const config = {
        config: {
          sources: [{ id: 'lonely', type: 'geojson' }],
          styles: [{ source: 'different', type: 'fill' }],
        },
      }
      const result = deriveLayerGroups(config, [], [])
      expect(result.groups).toHaveLength(0)
    })
  })

  describe('single-source single-style (example 01) — per-source shape', () => {
    it('returns 1 group with 1 nested style', () => {
      const params = infer(example01Params)
      const entry = makeLegendEntry(
        'imagery',
        example01RawLegend,
        example01RawLegend,
      )
      const result = deriveLayerGroups(example01Config, params, [entry])
      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].styles).toHaveLength(1)
    })

    it('group has correct sourceId and name', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(example01Config, params, [])
      const g = result.groups[0]
      expect(g.id).toBe('imagery')
      expect(g.name).toBe('imagery')
    })

    it('group sourceIndex matches source position in sources array', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(example01Config, params, [])
      expect(result.groups[0].sourceIndex).toBe(0)
    })

    it('nested style carries opacity param key from raster-opacity ref', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(example01Config, params, [])
      const style = result.groups[0].styles[0]
      expect(style.opacityParamKey).toBe('opacity')
      expect(style.opacityLiteral).toBeNull()
    })

    it('nested style carries visibility param key', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(example01Config, params, [])
      const style = result.groups[0].styles[0]
      expect(style.visibilityParamKey).toBe('visibility')
      expect(style.visibilityLiteral).toBe('visible')
    })

    it('opacity and visibility params are NOT in bodyParams', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(example01Config, params, [])
      const bodyKeys = result.groups[0].styles[0].bodyParams.map((p) => p.key)
      expect(bodyKeys).not.toContain('opacity')
      expect(bodyKeys).not.toContain('visibility')
    })

    it('no orphans when all params belong to the single style', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(example01Config, params, [])
      expect(result.orphans).toHaveLength(0)
    })

    it('group legend is null when no SourceLegendEntry provided', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(example01Config, params, [])
      expect(result.groups[0].legend).toBeNull()
    })

    it('group legend is populated when SourceLegendEntry provided', () => {
      const params = infer(example01Params)
      const resolvedLegend: LegendConfig = {
        type: 'basic',
        items: [{ label: 'Sentinel-2 Imagery', value: 'visible' }],
      }
      const entry = makeLegendEntry(
        'imagery',
        example01RawLegend,
        resolvedLegend,
      )
      const result = deriveLayerGroups(example01Config, params, [entry])
      const legend = result.groups[0].legend
      expect(legend).not.toBeNull()
      expect(legend!.type).toBe('basic')
      expect(legend!.items).toHaveLength(1)
    })
  })

  describe('single-source single-style (example 02) — color params', () => {
    it('fill_color and outline_color land in colorParams on the nested style', () => {
      const params = infer(example02Params)
      const result = deriveLayerGroups(example02Config, params, [])
      const style = result.groups[0].styles[0]
      const colorKeys = style.colorParams.map((p) => p.key)
      expect(colorKeys).toContain('fill_color')
      expect(colorKeys).toContain('outline_color')
    })

    it('opacity and visibility are not in colorParams', () => {
      const params = infer(example02Params)
      const result = deriveLayerGroups(example02Config, params, [])
      const colorKeys = result.groups[0].styles[0].colorParams.map((p) => p.key)
      expect(colorKeys).not.toContain('opacity')
      expect(colorKeys).not.toContain('visibility')
    })
  })

  describe('single-source multi-style — 1 group with 2 nested styles', () => {
    it('returns 1 group with 2 nested styles when source has fill+line layers', () => {
      const config = {
        config: {
          sources: [{ id: 'roads', type: 'geojson' }],
          styles: [
            {
              source: 'roads',
              type: 'fill',
              paint: {
                'fill-color': '@@#params.fill_color',
                'fill-opacity': '@@#params.fill_opacity',
              },
            },
            {
              source: 'roads',
              type: 'line',
              paint: { 'line-color': '@@#params.line_color', 'line-width': 2 },
            },
          ],
        },
      }
      const params = infer([
        { key: 'fill_color', default: '#blue' },
        { key: 'fill_opacity', default: 0.8, min: 0, max: 1, step: 0.1 },
        { key: 'line_color', default: '#000' },
      ])
      const result = deriveLayerGroups(config, params, [])
      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].styles).toHaveLength(2)
    })

    it('nested style index reflects global position in styles array', () => {
      const config = {
        config: {
          sources: [{ id: 'roads', type: 'geojson' }],
          styles: [
            { source: 'roads', type: 'fill', paint: {} },
            { source: 'roads', type: 'line', paint: {} },
          ],
        },
      }
      const result = deriveLayerGroups(config, [], [])
      expect(result.groups[0].styles[0].index).toBe(0)
      expect(result.groups[0].styles[1].index).toBe(1)
    })
  })

  describe('multi-source (example 11) — 2 groups', () => {
    it('returns 2 groups for 2 sources with matching styles', () => {
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [])
      expect(result.groups).toHaveLength(2)
    })

    it('first group id is "countries", second is "capitals"', () => {
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [])
      expect(result.groups[0].id).toBe('countries')
      expect(result.groups[1].id).toBe('capitals')
    })

    it('first group (countries) detects fill_opacity on its nested style', () => {
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [])
      const style = result.groups[0].styles[0]
      expect(style.opacityParamKey).toBe('fill_opacity')
    })

    it('second group (capitals) detects heatmap_opacity on its nested style', () => {
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [])
      const style = result.groups[1].styles[0]
      expect(style.opacityParamKey).toBe('heatmap_opacity')
    })

    it('fill_color belongs to countries colorParams only', () => {
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [])
      const countriesColors = result.groups[0].styles[0].colorParams.map(
        (p) => p.key,
      )
      const capitalsColors = result.groups[1].styles[0].colorParams.map(
        (p) => p.key,
      )
      expect(countriesColors).toContain('fill_color')
      expect(capitalsColors).not.toContain('fill_color')
    })

    it('heatmap color params belong to capitals colorParams only', () => {
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [])
      const capitalsColors = result.groups[1].styles[0].colorParams.map(
        (p) => p.key,
      )
      const countriesColors = result.groups[0].styles[0].colorParams.map(
        (p) => p.key,
      )
      expect(capitalsColors).toContain('heatmap_color_low')
      expect(capitalsColors).toContain('heatmap_color_mid')
      expect(capitalsColors).toContain('heatmap_color_high')
      expect(countriesColors).not.toContain('heatmap_color_low')
    })

    it('no orphans in example 11 when all params are referenced', () => {
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [])
      expect(result.orphans).toHaveLength(0)
    })

    it('each group nested style bodyParams does not include its opacity key', () => {
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [])
      for (const g of result.groups) {
        for (const style of g.styles) {
          const bodyKeys = style.bodyParams.map((p) => p.key)
          if (style.opacityParamKey) {
            expect(bodyKeys).not.toContain(style.opacityParamKey)
          }
        }
      }
    })

    it('multi-source: group 0 carries basic legend, group 1 carries gradient legend', () => {
      const params = infer(example11Params)
      const resolvedCountries: LegendConfig = {
        type: 'basic',
        items: [{ label: 'Country fill', value: '#dbeafe' }],
      }
      const resolvedCapitals: LegendConfig = {
        type: 'gradient',
        items: [
          { label: 'Heatmap low', value: '#2c7bb6' },
          { label: 'Heatmap high', value: '#d7191c' },
        ],
      }
      const entries: SourceLegendEntry[] = [
        makeLegendEntry(
          'countries',
          example11RawLegendCountries,
          resolvedCountries,
        ),
        makeLegendEntry(
          'capitals',
          example11RawLegendCapitals,
          resolvedCapitals,
        ),
      ]
      const result = deriveLayerGroups(example11Config, params, entries)
      expect(result.groups[0].legend!.type).toBe('basic')
      expect(result.groups[1].legend!.type).toBe('gradient')
    })

    it('param shared across sources appears in each source colorParams independently', () => {
      // Hypothetical: if both sources referenced the same param
      const config = {
        config: {
          sources: [
            { id: 'src_a', type: 'geojson' },
            { id: 'src_b', type: 'geojson' },
          ],
          styles: [
            {
              source: 'src_a',
              type: 'fill',
              paint: { 'fill-color': '@@#params.shared_color' },
            },
            {
              source: 'src_b',
              type: 'fill',
              paint: { 'fill-color': '@@#params.shared_color' },
            },
          ],
        },
      }
      const params = infer([{ key: 'shared_color', default: '#ff0000' }])
      const result = deriveLayerGroups(config, params, [])
      const aColors = result.groups[0].styles[0].colorParams.map((p) => p.key)
      const bColors = result.groups[1].styles[0].colorParams.map((p) => p.key)
      expect(aColors).toContain('shared_color')
      expect(bColors).toContain('shared_color')
    })
  })

  describe('literal opacity (no param ref)', () => {
    it('detects numeric literal opacity and exposes paintKey on the nested style', () => {
      const config = {
        config: {
          sources: [{ id: 'test', type: 'geojson' }],
          styles: [
            { source: 'test', type: 'fill', paint: { 'fill-opacity': 0.5 } },
          ],
        },
      }
      const result = deriveLayerGroups(config, [], [])
      const style = result.groups[0].styles[0]
      expect(style.opacityParamKey).toBeNull()
      expect(style.opacityLiteral).toEqual({
        paintKey: 'fill-opacity',
        value: 0.5,
      })
    })
  })

  describe('literal visibility', () => {
    it('uses visible default when layout.visibility is absent', () => {
      const config = {
        config: {
          sources: [{ id: 'test', type: 'geojson' }],
          styles: [{ source: 'test', type: 'fill', paint: {} }],
        },
      }
      const result = deriveLayerGroups(config, [], [])
      const style = result.groups[0].styles[0]
      expect(style.visibilityLiteral).toBe('visible')
      expect(style.visibilityParamKey).toBeNull()
    })

    it('reads literal none from layout', () => {
      const config = {
        config: {
          sources: [{ id: 'test', type: 'geojson' }],
          styles: [
            {
              source: 'test',
              type: 'fill',
              paint: {},
              layout: { visibility: 'none' },
            },
          ],
        },
      }
      const result = deriveLayerGroups(config, [], [])
      const style = result.groups[0].styles[0]
      expect(style.visibilityLiteral).toBe('none')
    })
  })

  describe('orphan params', () => {
    it('params not referenced by any style are orphans', () => {
      const config = {
        config: {
          sources: [{ id: 'test', type: 'geojson' }],
          styles: [
            {
              source: 'test',
              type: 'fill',
              paint: { 'fill-color': '@@#params.fill_color' },
            },
          ],
        },
      }
      const params = infer([
        { key: 'fill_color', default: '#3b82f6', group: 'legend' as const },
        { key: 'global_setting', default: 0.5, min: 0, max: 1, step: 0.1 },
      ])
      const result = deriveLayerGroups(config, params, [])
      const orphanKeys = result.orphans.map((p) => p.key)
      expect(orphanKeys).toContain('global_setting')
      expect(orphanKeys).not.toContain('fill_color')
    })

    it('orphan params = params with group=legend referenced by NO source', () => {
      // This verifies the acceptance criterion about orphan params
      const config = {
        config: {
          sources: [{ id: 'src', type: 'geojson' }],
          styles: [{ source: 'src', type: 'fill', paint: {} }],
        },
      }
      const params = infer([
        {
          key: 'used_by_nothing',
          default: '#ff0000',
          group: 'legend' as const,
        },
      ])
      const result = deriveLayerGroups(config, params, [])
      expect(result.orphans.map((p) => p.key)).toContain('used_by_nothing')
    })
  })

  describe('fallback styles path (no config wrapper)', () => {
    it('reads styles from top-level when config wrapper is absent', () => {
      const config = {
        sources: [{ id: 'test', type: 'geojson' }],
        styles: [
          {
            source: 'test',
            type: 'fill',
            paint: { 'fill-color': '@@#params.fill_color' },
          },
        ],
      }
      const params = infer([
        { key: 'fill_color', default: '#3b82f6', group: 'legend' as const },
      ])
      const result = deriveLayerGroups(config, params, [])
      expect(result.groups).toHaveLength(1)
      expect(result.orphans).toHaveLength(0)
    })
  })

  describe('legend on LayerGroup — thresholdParams from SourceLegendEntry', () => {
    it('legend has empty thresholdParams when no slider params exist in entry', () => {
      const params = infer(example02Params)
      const resolvedLegend: LegendConfig = {
        type: 'basic',
        items: [{ label: 'Countries', value: '#3b82f6' }],
      }
      const entry = makeLegendEntry(
        'countries',
        example02RawLegend,
        resolvedLegend,
      )
      const result = deriveLayerGroups(example02Config, params, [entry])
      const legend = result.groups[0].legend
      expect(legend).not.toBeNull()
      expect(legend!.thresholdParams).toHaveLength(0)
    })

    it('legend.thresholdParams is passed through from SourceLegendEntry', () => {
      // Build an entry that explicitly has threshold params
      const configWithThresholds = {
        config: {
          sources: [{ id: 'data', type: 'geojson' }],
          styles: [
            {
              source: 'data',
              type: 'heatmap',
              paint: {
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  '@@#params.threshold_low',
                  '@@#params.color_low',
                ],
                'heatmap-opacity': '@@#params.opacity',
              },
            },
          ],
        },
      }
      const rawLegend: LegendConfig = {
        type: 'gradient',
        items: [{ label: 'Low', value: '@@#params.color_low' }],
      }
      const resolvedLegend: LegendConfig = {
        type: 'gradient',
        items: [{ label: 'Low', value: '#ff0000' }],
      }
      const thresholdParam = {
        key: 'threshold_low',
        value: 0.2,
        control_type: 'slider' as const,
        group: 'legend' as const,
      }
      const entry: SourceLegendEntry = {
        sourceId: 'data',
        rawLegend,
        resolvedLegend,
        paramMapping: extractLegendParamKeys(rawLegend),
        thresholdParams: [thresholdParam],
      }
      const params = infer([
        { key: 'color_low', default: '#ff0000', group: 'legend' as const },
        { key: 'opacity', default: 0.85, min: 0, max: 1, step: 0.05 },
        {
          key: 'threshold_low',
          default: 0.2,
          min: 0,
          max: 1,
          step: 0.05,
          group: 'legend' as const,
        },
      ])
      const result = deriveLayerGroups(configWithThresholds, params, [entry])
      const legend = result.groups[0].legend
      expect(legend).not.toBeNull()
      const thresholdKeys = legend!.thresholdParams.map((p) => p.key)
      expect(thresholdKeys).toContain('threshold_low')
    })
  })

  describe('legend items contain resolved colors when resolvedLegend is passed', () => {
    it('legend items from resolvedLegend have real color strings, not @@ refs', () => {
      const resolvedCountries: LegendConfig = {
        type: 'basic',
        items: [{ label: 'Country fill', value: '#dbeafe' }],
      }
      const entry = makeLegendEntry(
        'countries',
        example11RawLegendCountries,
        resolvedCountries,
      )
      const params = infer(example11Params)
      const result = deriveLayerGroups(example11Config, params, [entry])
      const groupWithLegend = result.groups.find((g) => g.legend !== null)
      expect(groupWithLegend).toBeDefined()
      for (const item of groupWithLegend!.legend!.items) {
        expect(String(item.value)).not.toMatch(/^@@/)
      }
    })
  })
})
