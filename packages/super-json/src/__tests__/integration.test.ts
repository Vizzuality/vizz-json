import { describe, it, expect } from 'vitest'
import { createSuperJSON } from '../index'

describe('integration — deck.gl scatterplot spec', () => {
  class ScatterplotLayer {
    readonly props: Record<string, unknown>
    constructor(props: Record<string, unknown>) {
      this.props = props
    }
  }

  const superJSON = createSuperJSON({
    classes: { ScatterplotLayer },
  })

  it('resolves a full deck.gl scatterplot config (post params-resolution)', () => {
    // This simulates the JSON after @@#params have already been resolved (Stage 1)
    const input = {
      '@@type': 'ScatterplotLayer',
      id: 'earthquakes-scatter',
      data: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
      getPosition: '@@=geometry.coordinates',
      getRadius: 5000,
      getFillColor: '#ef4444',
      opacity: 0.8,
      radiusMinPixels: 2,
      radiusMaxPixels: 20,
      pickable: true,
    }

    const result = superJSON.resolve(input) as ScatterplotLayer
    expect(result).toBeInstanceOf(ScatterplotLayer)
    expect(result.props.id).toBe('earthquakes-scatter')
    expect(typeof result.props.getPosition).toBe('function')
    expect(result.props.getRadius).toBe(5000)
    expect(result.props.opacity).toBe(0.8)

    // Verify the accessor function works
    const accessor = result.props.getPosition as (d: Record<string, unknown>) => unknown
    expect(accessor({ geometry: { coordinates: [-122.4, 37.8] } })).toEqual([-122.4, 37.8])
  })
})

describe('integration — MapLibre config passthrough', () => {
  const superJSON = createSuperJSON({})

  it('passes through a MapLibre config unchanged (no @@ prefixes)', () => {
    const input = {
      source: {
        type: 'geojson',
        data: 'https://example.com/data.geojson',
      },
      styles: [
        {
          type: 'fill',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.7,
          },
          layout: {
            visibility: 'visible',
          },
        },
      ],
    }

    expect(superJSON.resolve(input)).toEqual(input)
  })
})

describe('integration — function in nested config', () => {
  function setQueryParams({ url, query }: { url: string; query: Record<string, unknown> }): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      params.set(key, String(value))
    }
    return `${url}?${params.toString()}`
  }

  const superJSON = createSuperJSON({ functions: { setQueryParams } })

  it('resolves @@function nested within a config object', () => {
    const input = {
      source: {
        type: 'raster',
        tiles: [
          {
            '@@function': 'setQueryParams',
            url: 'https://tiles.example.com/{z}/{x}/{y}.png',
            query: { token: 'abc123' },
          },
        ],
      },
    }

    const result = superJSON.resolve(input) as Record<string, any>
    expect(result.source.tiles[0]).toBe(
      'https://tiles.example.com/{z}/{x}/{y}.png?token=abc123',
    )
  })
})

describe('integration — component descriptors', () => {
  function GradientLegend(_props: Record<string, unknown>) {
    return null
  }
  function BasicLegend(_props: Record<string, unknown>) {
    return null
  }

  const superJSON = createSuperJSON({
    components: { GradientLegend, BasicLegend },
  })

  it('resolves @@type to component descriptors', () => {
    const input = {
      '@@type': 'GradientLegend',
      title: 'Population',
      colors: ['#eff6ff', '#1e3a8a'],
    }
    const result = superJSON.resolve(input) as Record<string, unknown>
    expect(result).toHaveProperty('$$component', GradientLegend)
    expect(result).toHaveProperty('props.title', 'Population')
  })
})

describe('integration — custom handler', () => {
  it('supports extra handlers registered at creation', () => {
    const superJSON = createSuperJSON({}, [
      {
        name: 'custom-prefix',
        type: 'value' as const,
        test: (v: string) => v.startsWith('@@custom:'),
        resolve: (v: string) => `resolved:${v.slice('@@custom:'.length)}`,
      },
    ])

    const input = { value: '@@custom:hello' }
    expect(superJSON.resolve(input)).toEqual({ value: 'resolved:hello' })
  })

  it('extra handlers take priority over built-in handlers', () => {
    const superJSON = createSuperJSON({}, [
      {
        name: 'override-expression',
        type: 'value' as const,
        test: (v: string) => v.startsWith('@@='),
        resolve: (v: string) => `custom:${v}`,
      },
    ])

    const input = { accessor: '@@=geometry.coordinates' }
    expect(superJSON.resolve(input)).toEqual({ accessor: 'custom:@@=geometry.coordinates' })
  })
})
