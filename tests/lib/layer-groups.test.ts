import { describe, it, expect } from 'vitest'
import { deriveLayerGroups } from '#/lib/layer-groups'
import { inferParamControl } from '#/lib/param-inference'
import { extractLegendParamKeys } from '#/lib/legend-param-mapping'
import type { LegendConfig, ParamConfig } from '#/lib/types'

// Helper to build InferredParam array from ParamConfig array
function infer(configs: readonly ParamConfig[]) {
  return configs.map(inferParamControl)
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

const example01Legend: LegendConfig = {
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

const example02Legend: LegendConfig = {
  type: 'basic',
  items: [{ label: 'Countries', value: '@@#params.fill_color' }],
}

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
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'pop_max'],
            0,
            0,
            20000000,
            1,
          ],
          'heatmap-intensity': 1.2,
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
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 6, 30],
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

const example11Legend: LegendConfig = {
  type: 'gradient',
  items: [
    { label: 'Country fill', value: '@@#params.fill_color' },
    { label: 'Heatmap low', value: '@@#params.heatmap_color_low' },
    { label: 'Heatmap high', value: '@@#params.heatmap_color_high' },
  ],
}

// ------------------------------------------------------------------ tests

describe('deriveLayerGroups', () => {
  describe('null config', () => {
    it('returns empty groups and all params as orphans', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(null, params, null, new Map())
      expect(result.groups).toHaveLength(0)
      expect(result.orphans).toHaveLength(params.length)
      expect(result.orphans).toEqual(params)
    })

    it('handles null params too', () => {
      const result = deriveLayerGroups(null, [], null, new Map())
      expect(result.groups).toHaveLength(0)
      expect(result.orphans).toHaveLength(0)
    })
  })

  describe('missing or empty styles', () => {
    it('returns empty groups when styles array is absent', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups({ config: {} }, params, null, new Map())
      expect(result.groups).toHaveLength(0)
      expect(result.orphans).toHaveLength(params.length)
    })

    it('returns empty groups when styles array is empty', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(
        { config: { styles: [] } },
        params,
        null,
        new Map(),
      )
      expect(result.groups).toHaveLength(0)
      expect(result.orphans).toHaveLength(params.length)
    })
  })

  describe('single-style schema (example 01)', () => {
    it('returns 1 group', () => {
      const params = infer(example01Params)
      const mapping = extractLegendParamKeys(example01Legend)
      const result = deriveLayerGroups(
        example01Config,
        params,
        example01Legend,
        mapping,
      )
      expect(result.groups).toHaveLength(1)
    })

    it('group has correct id and name', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(
        example01Config,
        params,
        example01Legend,
        new Map(),
      )
      const g = result.groups[0]
      expect(g.id).toBe('imagery-raster-0')
      expect(g.name).toBe('imagery · raster')
    })

    it('detects opacity param from raster-opacity ref', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(
        example01Config,
        params,
        example01Legend,
        new Map(),
      )
      const g = result.groups[0]
      expect(g.opacityParamKey).toBe('opacity')
      expect(g.opacityLiteral).toBeNull()
    })

    it('detects visibility param ref', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(
        example01Config,
        params,
        example01Legend,
        new Map(),
      )
      const g = result.groups[0]
      expect(g.visibilityParamKey).toBe('visibility')
      expect(g.visibilityLiteral).toBe('visible')
    })

    it('opacity and visibility params are NOT in bodyParams', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(
        example01Config,
        params,
        example01Legend,
        new Map(),
      )
      const g = result.groups[0]
      const bodyKeys = g.bodyParams.map((p) => p.key)
      expect(bodyKeys).not.toContain('opacity')
      expect(bodyKeys).not.toContain('visibility')
    })

    it('no orphans when all params belong to the single style', () => {
      const params = infer(example01Params)
      const result = deriveLayerGroups(
        example01Config,
        params,
        example01Legend,
        new Map(),
      )
      expect(result.orphans).toHaveLength(0)
    })
  })

  describe('single-style schema (example 02) — color params move to colorParams', () => {
    it('fill_color and outline_color land in colorParams', () => {
      const params = infer(example02Params)
      const mapping = extractLegendParamKeys(example02Legend)
      const result = deriveLayerGroups(
        example02Config,
        params,
        example02Legend,
        mapping,
      )
      const g = result.groups[0]
      const colorKeys = g.colorParams.map((p) => p.key)
      expect(colorKeys).toContain('fill_color')
      expect(colorKeys).toContain('outline_color')
    })

    it('opacity and visibility are not in colorParams', () => {
      const params = infer(example02Params)
      const result = deriveLayerGroups(
        example02Config,
        params,
        example02Legend,
        new Map(),
      )
      const g = result.groups[0]
      const colorKeys = g.colorParams.map((p) => p.key)
      expect(colorKeys).not.toContain('opacity')
      expect(colorKeys).not.toContain('visibility')
    })
  })

  describe('multi-style schema (example 11) — 2 groups', () => {
    it('returns 2 groups', () => {
      const params = infer(example11Params)
      const mapping = extractLegendParamKeys(example11Legend)
      const result = deriveLayerGroups(
        example11Config,
        params,
        example11Legend,
        mapping,
      )
      expect(result.groups).toHaveLength(2)
    })

    it('first group (countries/fill) detects fill_opacity as opacity param', () => {
      const params = infer(example11Params)
      const mapping = extractLegendParamKeys(example11Legend)
      const result = deriveLayerGroups(
        example11Config,
        params,
        example11Legend,
        mapping,
      )
      const g0 = result.groups[0]
      expect(g0.id).toBe('countries-fill-0')
      expect(g0.opacityParamKey).toBe('fill_opacity')
    })

    it('second group (capitals/heatmap) detects heatmap_opacity as opacity param', () => {
      const params = infer(example11Params)
      const mapping = extractLegendParamKeys(example11Legend)
      const result = deriveLayerGroups(
        example11Config,
        params,
        example11Legend,
        mapping,
      )
      const g1 = result.groups[1]
      expect(g1.id).toBe('capitals-heatmap-1')
      expect(g1.opacityParamKey).toBe('heatmap_opacity')
    })

    it('fill_color belongs to countries layer colorParams', () => {
      const params = infer(example11Params)
      const mapping = extractLegendParamKeys(example11Legend)
      const result = deriveLayerGroups(
        example11Config,
        params,
        example11Legend,
        mapping,
      )
      const g0 = result.groups[0]
      const colorKeys = g0.colorParams.map((p) => p.key)
      expect(colorKeys).toContain('fill_color')
      expect(colorKeys).not.toContain('heatmap_color_low')
    })

    it('heatmap color params belong to capitals layer', () => {
      const params = infer(example11Params)
      const mapping = extractLegendParamKeys(example11Legend)
      const result = deriveLayerGroups(
        example11Config,
        params,
        example11Legend,
        mapping,
      )
      const g1 = result.groups[1]
      const colorKeys = g1.colorParams.map((p) => p.key)
      expect(colorKeys).toContain('heatmap_color_low')
      expect(colorKeys).toContain('heatmap_color_mid')
      expect(colorKeys).toContain('heatmap_color_high')
      expect(colorKeys).not.toContain('fill_color')
    })

    it('no orphans in example 11', () => {
      const params = infer(example11Params)
      const mapping = extractLegendParamKeys(example11Legend)
      const result = deriveLayerGroups(
        example11Config,
        params,
        example11Legend,
        mapping,
      )
      expect(result.orphans).toHaveLength(0)
    })

    it('each group bodyParams does not include opacity key', () => {
      const params = infer(example11Params)
      const mapping = extractLegendParamKeys(example11Legend)
      const result = deriveLayerGroups(
        example11Config,
        params,
        example11Legend,
        mapping,
      )
      for (const g of result.groups) {
        const bodyKeys = g.bodyParams.map((p) => p.key)
        expect(bodyKeys).not.toContain(g.opacityParamKey)
      }
    })
  })

  describe('literal opacity (no param ref)', () => {
    it('detects numeric literal opacity and exposes paintKey', () => {
      const config = {
        config: {
          styles: [
            {
              source: 'test',
              type: 'fill',
              paint: { 'fill-opacity': 0.5 },
            },
          ],
        },
      }
      const result = deriveLayerGroups(config, [], null, new Map())
      const g = result.groups[0]
      expect(g.opacityParamKey).toBeNull()
      expect(g.opacityLiteral).toEqual({ paintKey: 'fill-opacity', value: 0.5 })
    })
  })

  describe('literal visibility', () => {
    it('uses visible default when layout.visibility is absent', () => {
      const config = {
        config: {
          styles: [
            {
              source: 'test',
              type: 'fill',
              paint: {},
            },
          ],
        },
      }
      const result = deriveLayerGroups(config, [], null, new Map())
      const g = result.groups[0]
      expect(g.visibilityLiteral).toBe('visible')
      expect(g.visibilityParamKey).toBeNull()
    })

    it('reads literal none from layout', () => {
      const config = {
        config: {
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
      const result = deriveLayerGroups(config, [], null, new Map())
      const g = result.groups[0]
      expect(g.visibilityLiteral).toBe('none')
    })
  })

  describe('orphan params', () => {
    it('params not referenced by any style are orphans', () => {
      const config = {
        config: {
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
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'global_setting', default: 0.5, min: 0, max: 1, step: 0.1 },
      ])
      const result = deriveLayerGroups(config, params, null, new Map())
      const orphanKeys = result.orphans.map((p) => p.key)
      expect(orphanKeys).toContain('global_setting')
      expect(orphanKeys).not.toContain('fill_color')
    })
  })

  describe('fallback styles path (no config wrapper)', () => {
    it('reads styles from top-level when config wrapper is absent', () => {
      const config = {
        styles: [
          {
            source: 'test',
            type: 'fill',
            paint: { 'fill-color': '@@#params.fill_color' },
          },
        ],
      }
      const params = infer([
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
      ])
      const result = deriveLayerGroups(config, params, null, new Map())
      expect(result.groups).toHaveLength(1)
      expect(result.orphans).toHaveLength(0)
    })
  })

  describe('name fallbacks', () => {
    it('uses Layer N+1 when source and type are absent', () => {
      const config = {
        config: { styles: [{}, {}] },
      }
      const result = deriveLayerGroups(config, [], null, new Map())
      expect(result.groups[0].name).toBe('Layer 1')
      expect(result.groups[1].name).toBe('Layer 2')
    })
  })
})
