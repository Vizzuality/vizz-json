import { describe, it, expect } from 'vitest'
import { buildStyle } from '../src/ui/lib/build-style'

const basemap = {
  version: 8,
  name: 'test-basemap',
  sources: {
    'basemap-tiles': { type: 'vector', url: 'https://example.com/tiles.json' },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#fff' },
    },
    { id: 'basemap-roads', type: 'line', source: 'basemap-tiles' },
  ],
} as const

describe('buildStyle', () => {
  it('merges the vizz source under a fixed id', () => {
    const result = buildStyle(basemap, {
      source: { type: 'geojson', data: 'https://example.com/data.geojson' },
      styles: [{ type: 'fill', paint: { 'fill-color': '#f00' } }],
    })
    expect(result.sources['basemap-tiles']).toBeDefined()
    expect(result.sources['vizz-data']).toEqual({
      type: 'geojson',
      data: 'https://example.com/data.geojson',
    })
  })

  it('appends vizz layers after basemap layers with unique ids and source=vizz-data', () => {
    const result = buildStyle(basemap, {
      source: { type: 'geojson', data: 'x' },
      styles: [
        { type: 'fill', paint: { 'fill-color': '#f00' } },
        { type: 'line', paint: { 'line-color': '#000' } },
      ],
    })
    expect(result.layers.length).toBe(4)
    expect(result.layers[0].id).toBe('background')
    expect(result.layers[1].id).toBe('basemap-roads')
    expect(result.layers[2]).toMatchObject({
      id: 'vizz-layer-0',
      type: 'fill',
      source: 'vizz-data',
    })
    expect(result.layers[3]).toMatchObject({
      id: 'vizz-layer-1',
      type: 'line',
      source: 'vizz-data',
    })
  })

  it('does not mutate inputs', () => {
    const resolved = {
      source: { type: 'geojson' as const, data: 'x' },
      styles: [{ type: 'fill' }],
    }
    const before = JSON.stringify({ basemap, resolved })
    buildStyle(basemap, resolved)
    expect(JSON.stringify({ basemap, resolved })).toBe(before)
  })

  it('preserves an existing layer id on the vizz style if provided', () => {
    const result = buildStyle(basemap, {
      source: { type: 'geojson', data: 'x' },
      styles: [{ id: 'my-countries', type: 'fill' }],
    })
    expect(result.layers[2].id).toBe('my-countries')
  })
})
