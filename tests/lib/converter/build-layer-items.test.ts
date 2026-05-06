import { describe, it, expect } from 'vitest'
import { buildLayerItems } from '#/lib/converter/build-layer-items'

describe('buildLayerItems', () => {
  it('returns one item per source when each source has one style', () => {
    const items = buildLayerItems({
      sources: [
        { id: 'a', type: 'geojson', data: 'https://a' },
        { id: 'b', type: 'geojson', data: 'https://b' },
      ],
      styles: [
        { source: 'a', type: 'fill' },
        { source: 'b', type: 'heatmap' },
      ],
    })

    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({
      source: { id: 'a' },
      styles: [{ type: 'fill' }],
    })
    expect(items[1]).toMatchObject({
      source: { id: 'b' },
      styles: [{ type: 'heatmap' }],
    })
  })

  it('groups consecutive styles bound to the same source', () => {
    const items = buildLayerItems({
      sources: [
        { id: 'a', type: 'geojson', data: 'https://a' },
        { id: 'b', type: 'geojson', data: 'https://b' },
      ],
      styles: [
        { source: 'a', type: 'fill' },
        { source: 'a', type: 'line' },
        { source: 'b', type: 'circle' },
      ],
    })

    expect(items).toHaveLength(2)
    expect(items[0].styles).toHaveLength(2)
    expect(items[1].styles).toHaveLength(1)
  })

  it('emits items in sources-array order, regardless of styles order', () => {
    const items = buildLayerItems({
      sources: [
        { id: 'first', type: 'geojson', data: 'https://1' },
        { id: 'second', type: 'geojson', data: 'https://2' },
      ],
      styles: [
        { source: 'second', type: 'heatmap' },
        { source: 'first', type: 'fill' },
      ],
    })

    expect(items.map((i) => i.source.id)).toEqual(['first', 'second'])
  })

  it('produces a stable id encoding source ids and style types for remount keys', () => {
    const items = buildLayerItems({
      sources: [{ id: 'a', type: 'geojson', data: 'x' }],
      styles: [
        { source: 'a', type: 'fill' },
        { source: 'a', type: 'line' },
      ],
    })
    expect(items[0].id).toBe('a--fill,line')
  })

  it('returns an empty array when sources or styles are missing', () => {
    expect(buildLayerItems({ sources: [], styles: [] })).toEqual([])
    expect(
      buildLayerItems({
        sources: [{ id: 'a', type: 'geojson', data: 'x' }],
        styles: [],
      }),
    ).toEqual([])
  })

  it('skips sources that have no matching styles', () => {
    const items = buildLayerItems({
      sources: [
        { id: 'a', type: 'geojson', data: 'x' },
        { id: 'b', type: 'geojson', data: 'y' },
      ],
      styles: [{ source: 'a', type: 'fill' }],
    })
    expect(items).toHaveLength(1)
    expect(items[0].source.id).toBe('a')
  })
})
