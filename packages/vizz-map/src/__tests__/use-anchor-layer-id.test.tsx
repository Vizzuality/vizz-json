import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock react-map-gl/maplibre before importing the hook
const fakeMap = {
  isStyleLoaded: vi.fn(),
  getStyle: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}
const useMapMock = vi.fn()

vi.mock('react-map-gl/maplibre', () => ({
  useMap: () => useMapMock(),
}))

import { useAnchorLayerId } from '../use-anchor-layer-id'

function makeStyle(layers: Array<{ id: string }>) {
  return { layers }
}

const wrapper = ({ children }: { children: ReactNode }) => <>{children}</>

beforeEach(() => {
  fakeMap.isStyleLoaded.mockReset()
  fakeMap.getStyle.mockReset()
  fakeMap.on.mockReset()
  fakeMap.off.mockReset()
  useMapMock.mockReset()
})

describe('useAnchorLayerId', () => {
  it('returns undefined when no map is mounted', () => {
    useMapMock.mockReturnValue({ current: undefined })
    const { result } = renderHook(() => useAnchorLayerId(), { wrapper })
    expect(result.current).toBeUndefined()
  })

  it('resolves the label layer id when the style is already loaded', () => {
    fakeMap.isStyleLoaded.mockReturnValue(true)
    fakeMap.getStyle.mockReturnValue(
      makeStyle([{ id: 'bg' }, { id: 'road-label' }]),
    )
    useMapMock.mockReturnValue({ current: fakeMap })

    const { result } = renderHook(() => useAnchorLayerId(), { wrapper })
    expect(result.current).toBe('road-label')
  })

  it('subscribes to styledata and resolves after load', () => {
    fakeMap.isStyleLoaded.mockReturnValue(false)
    useMapMock.mockReturnValue({ current: fakeMap })

    const { result } = renderHook(() => useAnchorLayerId(), { wrapper })
    expect(result.current).toBeUndefined()
    expect(fakeMap.on).toHaveBeenCalledWith('styledata', expect.any(Function))

    // Simulate styledata firing with labels present
    const handler = fakeMap.on.mock.calls[0][1] as () => void
    fakeMap.getStyle.mockReturnValue(
      makeStyle([{ id: 'bg' }, { id: 'waterway-label' }]),
    )
    act(() => handler())

    expect(result.current).toBe('waterway-label')
  })

  it('unsubscribes on unmount', () => {
    fakeMap.isStyleLoaded.mockReturnValue(true)
    fakeMap.getStyle.mockReturnValue(makeStyle([{ id: 'road-label' }]))
    useMapMock.mockReturnValue({ current: fakeMap })

    const { unmount } = renderHook(() => useAnchorLayerId(), { wrapper })
    unmount()
    expect(fakeMap.off).toHaveBeenCalledWith('styledata', expect.any(Function))
  })
})
