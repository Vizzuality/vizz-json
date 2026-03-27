import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlideNavigation } from '#/hooks/use-slide-navigation'

function fireKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

describe('useSlideNavigation', () => {
  it('starts at slide 0', () => {
    const { result } = renderHook(() => useSlideNavigation({ totalSlides: 5 }))
    expect(result.current.slide).toBe(0)
  })

  it('advances to next slide on ArrowRight', () => {
    const { result } = renderHook(() => useSlideNavigation({ totalSlides: 3 }))
    act(() => fireKey('ArrowRight'))
    expect(result.current.slide).toBe(1)
  })

  it('does not go past last slide', () => {
    const { result } = renderHook(() => useSlideNavigation({ totalSlides: 2 }))
    act(() => fireKey('ArrowRight')) // slide 1
    act(() => fireKey('ArrowRight')) // should stay
    expect(result.current.slide).toBe(1)
  })

  it('goes back on ArrowLeft', () => {
    const { result } = renderHook(() => useSlideNavigation({ totalSlides: 3 }))
    act(() => fireKey('ArrowRight'))
    act(() => fireKey('ArrowRight'))
    act(() => fireKey('ArrowLeft'))
    expect(result.current.slide).toBe(1)
  })

  it('does not go before slide 0', () => {
    const { result } = renderHook(() => useSlideNavigation({ totalSlides: 2 }))
    act(() => fireKey('ArrowLeft'))
    expect(result.current.slide).toBe(0)
  })

  it('ArrowDown works same as ArrowRight', () => {
    const { result } = renderHook(() => useSlideNavigation({ totalSlides: 2 }))
    act(() => fireKey('ArrowDown'))
    expect(result.current.slide).toBe(1)
  })

  it('ArrowUp works same as ArrowLeft', () => {
    const { result } = renderHook(() => useSlideNavigation({ totalSlides: 2 }))
    act(() => fireKey('ArrowDown'))
    act(() => fireKey('ArrowUp'))
    expect(result.current.slide).toBe(0)
  })

  it('respects initialSlide option', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 5, initialSlide: 3 }),
    )
    expect(result.current.slide).toBe(3)
  })

  it('clamps initialSlide to valid range', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 3, initialSlide: 99 }),
    )
    expect(result.current.slide).toBe(2)
  })

  it('exposes progress as fraction', () => {
    const { result } = renderHook(() => useSlideNavigation({ totalSlides: 4 }))
    expect(result.current.progress).toBe(0)
    act(() => fireKey('ArrowRight'))
    expect(result.current.progress).toBeCloseTo(1 / 3)
  })
})
