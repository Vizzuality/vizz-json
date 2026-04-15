import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

// Stub Source / Layer so we can inspect props via DOM
vi.mock('react-map-gl/maplibre', () => ({
  Source: ({
    children,
    id,
    ...props
  }: {
    children?: ReactNode
    id: string
    [k: string]: unknown
  }) => (
    <div data-testid="source" data-id={id} data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
  Layer: ({
    id,
    beforeId,
    ...props
  }: {
    id: string
    beforeId?: string
    [k: string]: unknown
  }) => (
    <div
      data-testid="layer"
      data-id={id}
      data-before-id={beforeId ?? ''}
      data-props={JSON.stringify(props)}
    />
  ),
}))

import { LayerManagerItem } from '../layer-manager-item'

describe('LayerManagerItem', () => {
  it('renders a Source with id="{id}-source" and forwards source props', () => {
    const { getByTestId } = render(
      <LayerManagerItem
        id="vizz"
        source={{ type: 'geojson', data: 'x.json' }}
        styles={[]}
        beforeId="anchor"
      />,
    )
    const src = getByTestId('source')
    expect(src.dataset.id).toBe('vizz-source')
    const props = JSON.parse(src.dataset.props ?? '{}')
    expect(props.type).toBe('geojson')
    expect(props.data).toBe('x.json')
  })

  it('renders one Layer per style, indexed id, forwards beforeId', () => {
    const { getAllByTestId } = render(
      <LayerManagerItem
        id="vizz"
        source={{ type: 'geojson', data: 'x' }}
        styles={[
          { type: 'fill', paint: { 'fill-color': '#f00' } },
          { type: 'line', paint: { 'line-color': '#000' } },
        ]}
        beforeId="anchor"
      />,
    )
    const layers = getAllByTestId('layer')
    expect(layers).toHaveLength(2)
    expect(layers[0].dataset.id).toBe('vizz-layer-0')
    expect(layers[0].dataset.beforeId).toBe('anchor')
    expect(layers[1].dataset.id).toBe('vizz-layer-1')
    expect(layers[1].dataset.beforeId).toBe('anchor')
  })

  it('passes style props through to Layer', () => {
    const { getAllByTestId } = render(
      <LayerManagerItem
        id="vizz"
        source={{ type: 'geojson', data: 'x' }}
        styles={[{ type: 'fill', paint: { 'fill-color': '#f00' } }]}
      />,
    )
    const props = JSON.parse(getAllByTestId('layer')[0].dataset.props ?? '{}')
    expect(props.type).toBe('fill')
    expect(props.paint).toEqual({ 'fill-color': '#f00' })
  })
})
