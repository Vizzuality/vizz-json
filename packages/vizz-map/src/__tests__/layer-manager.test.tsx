import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('react-map-gl/maplibre', () => ({
  useMap: vi.fn(),
  Source: ({ children, id }: { children?: ReactNode; id: string }) => (
    <div data-testid="source" data-id={id}>
      {children}
    </div>
  ),
  Layer: ({
    id,
    beforeId,
    type,
  }: {
    id: string
    beforeId?: string
    type?: string
  }) => (
    <div
      data-testid="layer"
      data-id={id}
      data-before-id={beforeId ?? ''}
      data-type={type ?? ''}
    />
  ),
}))

import { useMap } from 'react-map-gl/maplibre'
import { LayerManager } from '../layer-manager'

const useMapMock = useMap as unknown as ReturnType<typeof vi.fn>

const fakeMap = {
  isStyleLoaded: () => true,
  getStyle: () => ({ layers: [{ id: 'bg' }, { id: 'road-label' }] }),
  on: vi.fn(),
  off: vi.fn(),
}

beforeEach(() => {
  useMapMock.mockReset()
})

describe('LayerManager', () => {
  it('falls back to undefined beforeId when no map is mounted', () => {
    useMapMock.mockReturnValue({ current: undefined })
    const { getAllByTestId } = render(
      <LayerManager
        items={[
          {
            id: 'a',
            source: { type: 'geojson', data: 'x' },
            styles: [{ type: 'fill' }],
          },
        ]}
      />,
    )
    // Spec: missing anchor → degraded but visible. Placeholder still renders,
    // but its beforeId is undefined so layers fall to the top of the stack.
    const placeholders = getAllByTestId('layer').filter(
      (l) => l.dataset.type === 'background',
    )
    expect(placeholders).toHaveLength(1)
    expect(placeholders[0].dataset.id).toBe('a-layer')
    expect(placeholders[0].dataset.beforeId).toBe('')
    // And the real item layer inherits the same undefined beforeId.
    const realLayers = getAllByTestId('layer').filter(
      (l) => l.dataset.type !== 'background',
    )
    expect(realLayers).toHaveLength(1)
    expect(realLayers[0].dataset.beforeId).toBe('')
  })

  it('renders N placeholder layers + N items when anchor is resolved', () => {
    useMapMock.mockReturnValue({ current: fakeMap })
    const { getAllByTestId } = render(
      <LayerManager
        items={[
          {
            id: 'a',
            source: { type: 'geojson', data: 'x' },
            styles: [{ type: 'fill' }],
          },
          {
            id: 'b',
            source: { type: 'geojson', data: 'y' },
            styles: [{ type: 'line' }],
          },
        ]}
      />,
    )
    const layers = getAllByTestId('layer')
    const placeholders = layers.filter((l) => l.dataset.type === 'background')
    expect(placeholders).toHaveLength(2)
    const sources = getAllByTestId('source')
    expect(sources).toHaveLength(2)
  })

  it('reverses item order so input[0] renders on top of the stack', () => {
    useMapMock.mockReturnValue({ current: fakeMap })
    const { getAllByTestId } = render(
      <LayerManager
        items={[
          {
            id: 'top',
            source: { type: 'geojson', data: 'x' },
            styles: [{ type: 'fill' }],
          },
          {
            id: 'bottom',
            source: { type: 'geojson', data: 'y' },
            styles: [{ type: 'fill' }],
          },
        ]}
      />,
    )
    const placeholders = getAllByTestId('layer').filter(
      (l) => l.dataset.type === 'background',
    )
    // After reverse(): processing order is [bottom, top]
    // placeholder[0] (bottom) -> beforeId = anchor
    // placeholder[1] (top)    -> beforeId = bottom-layer
    expect(placeholders[0].dataset.id).toBe('bottom-layer')
    expect(placeholders[0].dataset.beforeId).toBe('road-label')
    expect(placeholders[1].dataset.id).toBe('top-layer')
    expect(placeholders[1].dataset.beforeId).toBe('bottom-layer')
  })

  it('chains item beforeIds so items stack via placeholders', () => {
    useMapMock.mockReturnValue({ current: fakeMap })
    const { getAllByTestId } = render(
      <LayerManager
        items={[
          {
            id: 'top',
            source: { type: 'geojson', data: 'x' },
            styles: [{ type: 'fill' }],
          },
          {
            id: 'bottom',
            source: { type: 'geojson', data: 'y' },
            styles: [{ type: 'fill' }],
          },
        ]}
      />,
    )
    // Real layers carry their item id in the data-id (e.g., "bottom-layer-0")
    const realLayers = getAllByTestId('layer').filter(
      (l) => l.dataset.type !== 'background',
    )
    const bottom = realLayers.find((l) => l.dataset.id === 'bottom-layer-0')
    const top = realLayers.find((l) => l.dataset.id === 'top-layer-0')
    expect(bottom?.dataset.beforeId).toBe('road-label')
    expect(top?.dataset.beforeId).toBe('bottom-layer')
  })

  it('renders nothing when items is empty', () => {
    useMapMock.mockReturnValue({ current: fakeMap })
    const { queryAllByTestId } = render(<LayerManager items={[]} />)
    expect(queryAllByTestId('layer')).toHaveLength(0)
    expect(queryAllByTestId('source')).toHaveLength(0)
  })
})
