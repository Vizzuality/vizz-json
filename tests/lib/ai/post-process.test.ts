import { describe, it, expect } from 'vitest'
import { postProcess } from '#/lib/ai/post-process'
import type { AiOutput } from '#/lib/ai/output-schema'

const baseOutput: AiOutput = {
  metadata: { title: 'Raster opacity', description: 'd', tier: 'basic' },
  style: {
    source: { type: 'raster', tiles: ['https://x'], tileSize: 256 },
    styles: [
      {
        type: 'raster',
        paint: { 'raster-opacity': 0.8 },
        layout: { visibility: 'visible' },
      },
    ],
  },
  parameterize: [
    {
      path: 'styles[0].paint.raster-opacity',
      key: 'opacity',
      default: 0.8,
      min: 0,
      max: 1,
      step: 0.05,
    },
    {
      path: 'styles[0].layout.visibility',
      key: 'visibility',
      default: 'visible',
      options: ['visible', 'none'],
    },
  ],
}

describe('postProcess', () => {
  it('builds a LayerSchema with @@ placeholders inserted at every path', () => {
    const result = postProcess(baseOutput)

    expect(result.config).toMatchObject({
      source: { type: 'raster' },
      styles: [
        {
          type: 'raster',
          paint: { 'raster-opacity': '@@#params.opacity' },
          layout: { visibility: '@@#params.visibility' },
        },
      ],
    })
  })

  it('builds params_config preserving min/max/step/options', () => {
    const result = postProcess(baseOutput)

    expect(result.params_config).toEqual([
      { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
      { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
    ])
  })

  it('does not mutate the input', () => {
    const snapshot = JSON.stringify(baseOutput)
    postProcess(baseOutput)
    expect(JSON.stringify(baseOutput)).toBe(snapshot)
  })

  it('throws when a parameterize path does not resolve', () => {
    const bad: AiOutput = {
      ...baseOutput,
      parameterize: [{ path: 'styles[42].paint.foo', key: 'x', default: 1 }],
    }
    expect(() => postProcess(bad)).toThrow(/path/)
  })

  it('preserves legend_config and metadata in the output', () => {
    const withLegend: AiOutput = {
      ...baseOutput,
      legend_config: {
        type: 'basic',
        items: [{ label: 'Sentinel-2', value: 'visible' }],
      },
    }
    const result = postProcess(withLegend)
    expect(result.metadata).toEqual(withLegend.metadata)
    expect(result.legend_config).toEqual(withLegend.legend_config)
  })
})
