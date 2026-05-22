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

// ── DEAD_PARAM ────────────────────────────────────────────────────────

describe('DEAD_PARAM', () => {
  it('emits warn for a param that is never referenced in the snapshot', () => {
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
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
        // unused_param is never referenced
        { key: 'unused_param', default: 0.5 },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const dead = diags.filter((d) => d.code === 'DEAD_PARAM')
    expect(dead.length).toBeGreaterThan(0)
    expect(dead[0].severity).toBe('warn')
    expect(dead.some((d) => d.meta?.key === 'unused_param')).toBe(true)
  })

  it('does not emit when all params are referenced', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('DEAD_PARAM')
  })

  it('emits the exact orphaned param key in meta', () => {
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
            layout: { visibility: '@@#params.visibility' },
          },
        ],
      },
      params_config: [
        { key: 'fill_color', default: '#3b82f6', group: 'legend' },
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
        { key: 'orphan_key', default: 42 },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const dead = diags.find(
      (d) => d.code === 'DEAD_PARAM' && d.meta?.key === 'orphan_key',
    )
    expect(dead).toBeDefined()
  })
})

// ── GHOST_REF ────────────────────────────────────────────────────────

describe('GHOST_REF', () => {
  it('emits error for a @@#params.X ref with no matching params_config entry', () => {
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
              // ghost_color has no params_config entry
              'fill-color': '@@#params.ghost_color',
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
    const ghost = diags.filter((d) => d.code === 'GHOST_REF')
    expect(ghost.length).toBeGreaterThan(0)
    expect(ghost[0].severity).toBe('error')
    expect(ghost.some((d) => d.meta?.key === 'ghost_color')).toBe(true)
  })

  it('does not emit when all refs have matching params_config entries', () => {
    const diags = validate(validSingleSource, stubRegistry)
    expect(codesOf(diags)).not.toContain('GHOST_REF')
  })

  it('emits for ghost ref inside legend items', () => {
    const snapshot = {
      config: {
        sources: [
          {
            id: 'src',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [
                { label: 'x', value: '@@#params.fill_color' },
                // ghost legend ref
                { label: 'y', value: '@@#params.nonexistent_color' },
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
        { key: 'opacity', default: 0.8, min: 0, max: 1 },
        { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
      ],
    }
    const diags = validate(snapshot, stubRegistry)
    const ghost = diags.filter((d) => d.code === 'GHOST_REF')
    expect(ghost.some((d) => d.meta?.key === 'nonexistent_color')).toBe(true)
  })
})
