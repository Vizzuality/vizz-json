import { describe, it, expect } from 'vitest'
import { validate } from '#/lib/validator/index'
import type { ValidatorRegistry, Diagnostic } from '#/lib/validator/types'

const stubRegistry: ValidatorRegistry = {
  getFunctionMeta: (name) =>
    name === 'buildColormap' ? { colorArgPaths: ['stops[*][1]'] } : undefined,
}

function codesOf(diags: readonly Diagnostic[]): string[] {
  return diags.map((d) => d.code)
}

const validSingleSource = {
  config: {
    sources: [
      {
        id: 'src',
        type: 'geojson',
        legend_config: {
          type: 'basic',
          items: [{ label: 'Fill', value: '@@#params.fill_color' }],
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

// ── MISSING_OPACITY_PARAM ─────────────────────────────────────────────

describe('MISSING_OPACITY_PARAM', () => {
  it('emits error when no opacity param exists for a source', () => {
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
            paint: { 'fill-color': '@@#params.fill_color' },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        // no opacity
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const found = diags.find((diag) => diag.code === 'MISSING_OPACITY_PARAM')
    expect(found).toBeDefined()
    expect(found!.severity).toBe('error')
  })

  it('does not emit when opacity param is present', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('MISSING_OPACITY_PARAM')
  })

  it('does not emit for multi-source when each source has a source-scoped opacity param', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'srcA',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'x', value: '@@#params.fill_color' }],
            },
          },
          {
            id: 'srcB',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'y', value: '@@#params.line_color' }],
            },
          },
        ],
        styles: [
          {
            source: 'srcA',
            type: 'fill',
            paint: {
              'fill-color': '@@#params.fill_color',
              'fill-opacity': '@@#params.srcA_opacity',
            },
            layout: { visibility: '@@#params.srcA_visibility' },
          },
          {
            source: 'srcB',
            type: 'line',
            paint: {
              'line-color': '@@#params.line_color',
              'line-opacity': '@@#params.srcB_opacity',
            },
            layout: { visibility: '@@#params.srcB_visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        {
          key: 'srcA_opacity',
          default: 0.8,
          min: 0,
          max: 1,
          source: 'srcA',
        },
        {
          key: 'srcA_visibility',
          default: 'visible',
          options: ['visible', 'none'],
          source: 'srcA',
        },
        { key: 'line_color', default: '#ef4444', group: 'legend' },
        {
          key: 'srcB_opacity',
          default: 0.6,
          min: 0,
          max: 1,
          source: 'srcB',
        },
        {
          key: 'srcB_visibility',
          default: 'visible',
          options: ['visible', 'none'],
          source: 'srcB',
        },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).not.toContain('MISSING_OPACITY_PARAM')
    expect(codesOf(diags)).not.toContain('MISSING_VISIBILITY_PARAM')
  })
})

// ── MISSING_VISIBILITY_PARAM ──────────────────────────────────────────

describe('MISSING_VISIBILITY_PARAM', () => {
  it('emits error when no visibility param exists for a source', () => {
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
              'fill-color': '@@#params.fill_color',
              'fill-opacity': '@@#params.opacity',
            },
            layout: {},
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        // no visibility
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const found = diags.find((diag) => diag.code === 'MISSING_VISIBILITY_PARAM')
    expect(found).toBeDefined()
    expect(found!.severity).toBe('error')
  })

  it('does not emit when visibility param is present', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('MISSING_VISIBILITY_PARAM')
  })
})

// ── OPACITY_NOT_WIRED ─────────────────────────────────────────────────

describe('OPACITY_NOT_WIRED', () => {
  it('emits error when opacity param exists but is not referenced in paint', () => {
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
              'fill-color': '@@#params.fill_color',
              // opacity param exists but is NOT wired to fill-opacity
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
    const found = diags.find((diag) => diag.code === 'OPACITY_NOT_WIRED')
    expect(found).toBeDefined()
    expect(found!.severity).toBe('error')
  })

  it('does not emit when opacity is properly wired', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('OPACITY_NOT_WIRED')
  })
})

// ── VISIBILITY_NOT_WIRED ──────────────────────────────────────────────

describe('VISIBILITY_NOT_WIRED', () => {
  it('emits error when visibility param exists but layout.visibility is not wired', () => {
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
              'fill-color': '@@#params.fill_color',
              'fill-opacity': '@@#params.opacity',
            },
            layout: {
              // visibility param exists in params_config but NOT wired here
            },
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
    const found = diags.find((diag) => diag.code === 'VISIBILITY_NOT_WIRED')
    expect(found).toBeDefined()
    expect(found!.severity).toBe('error')
  })

  it('does not emit when visibility is properly wired', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('VISIBILITY_NOT_WIRED')
  })
})

// ── Nested expression ref detection (Gap 1) ───────────────────────────

describe('OPACITY_NOT_WIRED — nested expression refs', () => {
  it('does not emit when opacity ref is nested inside an interpolate expression', () => {
    // Pattern from example 12: heatmap-opacity is a zoom-interpolate with a
    // param ref nested at the output position, not a top-level string.
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'gradient',
              items: [{ label: 'x', value: '@@#params.fill_color' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'heatmap',
            paint: {
              'heatmap-color': '@@#params.fill_color',
              'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                5,
                '@@#params.opacity',
                9,
                0,
              ],
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.9, min: 0, max: 1, step: 0.05 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).not.toContain('OPACITY_NOT_WIRED')
  })

  it('still emits OPACITY_NOT_WIRED when no ref exists anywhere (plain literal value)', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'gradient',
              items: [{ label: 'x', value: '@@#params.fill_color' }],
            },
          },
        ],
        styles: [
          {
            source: 'src',
            type: 'heatmap',
            paint: {
              'heatmap-color': '@@#params.fill_color',
              // heatmap-opacity is a literal number — no param ref
              'heatmap-opacity': 0.8,
            },
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.9, min: 0, max: 1, step: 0.05 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).toContain('OPACITY_NOT_WIRED')
  })

  it('still works for plain top-level ref (regression guard)', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('OPACITY_NOT_WIRED')
  })
})

describe('VISIBILITY_NOT_WIRED — nested expression refs', () => {
  it('does not emit when visibility ref is nested inside a case expression', () => {
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
              'fill-color': '@@#params.fill_color',
              'fill-opacity': '@@#params.opacity',
            },
            layout: {
              visibility: [
                'case',
                ['get', 'active'],
                '@@#params.visibility',
                'none',
              ],
            },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    expect(codesOf(diags)).not.toContain('VISIBILITY_NOT_WIRED')
  })
})
