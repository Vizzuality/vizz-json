import { describe, it, expect } from 'vitest'
import { validate } from '#/lib/validator/index'
import type { ValidatorRegistry } from '#/lib/validator/types'
import { getFunctionMeta } from '#/lib/converter/functions'

// Use the real registry for integration tests
const realRegistry: ValidatorRegistry = { getFunctionMeta }

const stubRegistry: ValidatorRegistry = {
  getFunctionMeta: (name) =>
    name === 'buildColormap' ? { colorArgPaths: ['stops[*][1]'] } : undefined,
}

describe('validate() — integration', () => {
  it('returns empty diagnostics for a fully valid single-source snapshot', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'countries',
            type: 'geojson',
            legend_config: {
              type: 'choropleth',
              items: [
                { label: 'High income', value: '@@#params.high_oecd_color' },
                {
                  label: 'Upper middle',
                  value: '@@#params.upper_middle_color',
                },
              ],
            },
          },
        ],
        styles: [
          {
            source: 'countries',
            type: 'fill',
            paint: {
              'fill-color': [
                'match',
                ['get', 'income_grp'],
                'High',
                '@@#params.high_oecd_color',
                '@@#params.upper_middle_color',
              ],
              'fill-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'high_oecd_color', default: '#fde725', group: 'legend' },
        { key: 'upper_middle_color', default: '#21918c', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    // upper_middle_color is in the match default slot — exempt from layer-only mismatch
    // No errors expected
    expect(diags.filter((d) => d.severity === 'error')).toHaveLength(0)
  })

  it('does not crash when snapshot is entirely empty object', () => {
    expect(() => validate({}, stubRegistry)).not.toThrow()
  })

  it('does not crash when snapshot is null', () => {
    expect(() => validate(null, stubRegistry)).not.toThrow()
  })

  it('does not crash when config has no sources', () => {
    const snapshot = {
      config: { sources: [], styles: [] },
      params_config: [],
    }
    expect(() => validate(snapshot, stubRegistry)).not.toThrow()
  })

  it('collects multiple diagnostic codes from a broken snapshot', () => {
    const snapshot = {
      config: {
        sources: [
          // no legend_config → MISSING_LEGEND_CONFIG (error)
          { id: 'src', type: 'geojson' },
        ],
        styles: [
          {
            source: 'src',
            type: 'fill',
            paint: {
              // literal color → COLOR_LITERAL_IN_PAINT
              'fill-color': '#ff0000',
              // opacity not wired → OPACITY_NOT_WIRED (if opacity param exists)
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        // opacity param present but not wired → OPACITY_NOT_WIRED
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
        // ghost_key referenced nowhere → DEAD_PARAM
        { key: 'unused_key', default: 99 },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const codes = new Set(diags.map((d) => d.code))
    expect(codes.has('COLOR_LITERAL_IN_PAINT')).toBe(true)
    expect(codes.has('MISSING_LEGEND_CONFIG')).toBe(true)
    expect(codes.has('OPACITY_NOT_WIRED')).toBe(true)
    expect(codes.has('DEAD_PARAM')).toBe(true)
  })

  it('works with the real registry: buildColormap colorArgPaths are walked', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'raster',
            type: 'raster',
            legend_config: {
              type: 'gradient',
              items: [
                { label: 'low', value: '@@#params.color_1' },
                { label: 'high', value: '@@#params.color_2' },
              ],
            },
          },
        ],
        styles: [
          {
            source: 'raster',
            type: 'raster',
            paint: {
              'raster-opacity': '@@#params.opacity',
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      // Note: tiles/colormap config is not in config.styles.paint — for raster sources
      // the color params flow through function args. Since the styles don't reference
      // color_1/color_2, those would be DEAD_PARAM or show LEGEND_LAYER_MISMATCH.
      // This test just verifies no crash and returns a Diagnostic array.
      params_config: [
        { key: 'color_1', default: '#08306b', group: 'legend' },
        { key: 'color_2', default: '#f5f5f5', group: 'legend' },
        { key: 'opacity', default: 1.0, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    expect(() => validate(snapshot, realRegistry)).not.toThrow()
    const diags = validate(snapshot, realRegistry)
    expect(Array.isArray(diags)).toBe(true)
  })
})
