import { describe, it, expect } from 'vitest'
import type { LayerSpecification } from 'maplibre-gl'
import { findAnchorLayerId } from '../utils'

const bg = {
  id: 'background',
  type: 'background',
} as unknown as LayerSpecification
const road = { id: 'road-line', type: 'line' } as unknown as LayerSpecification
const label = {
  id: 'road-label',
  type: 'symbol',
} as unknown as LayerSpecification
const customLayer = {
  id: 'custom-layer-anchor',
  type: 'background',
} as unknown as LayerSpecification

describe('findAnchorLayerId', () => {
  it('returns the first layer whose id contains "label"', () => {
    expect(findAnchorLayerId([bg, road, label])).toBe('road-label')
  })

  it('prefers "custom-layer" over "label" even if label appears earlier', () => {
    expect(findAnchorLayerId([label, bg, customLayer])).toBe(
      'custom-layer-anchor',
    )
  })

  it('returns the first "custom-layer" match when multiple are present', () => {
    const second = {
      id: 'custom-layer-two',
      type: 'background',
    } as unknown as LayerSpecification
    expect(findAnchorLayerId([customLayer, second])).toBe('custom-layer-anchor')
  })

  it('returns undefined when no matching layer is present', () => {
    expect(findAnchorLayerId([bg, road])).toBeUndefined()
  })

  it('returns undefined for an empty array', () => {
    expect(findAnchorLayerId([])).toBeUndefined()
  })

  it('returns undefined when input is undefined', () => {
    expect(findAnchorLayerId(undefined)).toBeUndefined()
  })
})
