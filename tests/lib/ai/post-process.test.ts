import { describe, it, expect } from 'vitest'
import { postProcess } from '#/lib/ai/post-process'
import type { AiOutput } from '#/lib/ai/output-schema'

const baseOutput: AiOutput = {
  metadata: { title: 'Raster opacity', description: 'd', tier: 'basic' },
  style: {
    sources: [
      { id: 'imagery', type: 'raster', tiles: ['https://x'], tileSize: 256 },
    ],
    styles: [
      {
        source: 'imagery',
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
  it('builds a config with @@ placeholders inserted at every path', () => {
    const result = postProcess(baseOutput)

    expect(result.config).toMatchObject({
      sources: [{ id: 'imagery', type: 'raster' }],
      styles: [
        {
          source: 'imagery',
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

  it('output has NO top-level legend_config', () => {
    const result = postProcess(baseOutput) as Record<string, unknown>
    expect(result).not.toHaveProperty('legend_config')
  })

  it('when source has legend_config, it is preserved on sources[0] after parameterize substitutions', () => {
    const withSourceLegend: AiOutput = {
      metadata: { title: 'Choropleth', description: 'd', tier: 'basic' },
      style: {
        sources: [
          {
            id: 'countries',
            type: 'geojson',
            legend_config: {
              type: 'choropleth',
              items: [{ label: 'High', value: '#ff0000' }],
            },
          },
        ],
        styles: [
          {
            source: 'countries',
            type: 'fill',
            paint: { 'fill-color': '#ff0000' },
          },
        ],
      },
      parameterize: [
        {
          path: 'styles[0].paint.fill-color',
          key: 'fill_color',
          default: '#ff0000',
          group: 'legend',
        },
      ],
    }

    const result = postProcess(withSourceLegend)

    // legend_config is on the source (via the cloned config.sources[0]), not top-level
    const configSources = (
      result.config as { sources?: Array<Record<string, unknown>> }
    ).sources
    expect(configSources).toBeDefined()
    expect(configSources![0]).toHaveProperty('legend_config')
    // Top-level must still be absent
    expect(result).not.toHaveProperty('legend_config')
  })

  it('preserves metadata in the output', () => {
    const result = postProcess(baseOutput)
    expect(result.metadata).toEqual(baseOutput.metadata)
  })

  it('parameterize with group=legend is reflected in params_config', () => {
    const withLegendParam: AiOutput = {
      ...baseOutput,
      parameterize: [
        {
          path: 'styles[0].paint.raster-opacity',
          key: 'my_color',
          default: '#ff0000',
          group: 'legend',
        },
      ],
    }
    const result = postProcess(withLegendParam)
    const param = result.params_config.find((p) => p.key === 'my_color')
    expect(param?.group).toBe('legend')
  })
})
