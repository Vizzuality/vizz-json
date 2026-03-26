import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlideNavigation } from '#/hooks/use-slide-navigation'

function fireKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

describe('useSlideNavigation', () => {
  it('starts at slide 0 step 0', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 5, stepsPerSlide: [1, 2, 1, 3, 1] }),
    )
    expect(result.current.slide).toBe(0)
    expect(result.current.step).toBe(0)
  })

  it('advances step on ArrowRight when steps remain', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 2, stepsPerSlide: [3, 1] }),
    )
    act(() => fireKey('ArrowRight'))
    expect(result.current.slide).toBe(0)
    expect(result.current.step).toBe(1)
  })

  it('advances to next slide when all steps exhausted', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 2, stepsPerSlide: [2, 1] }),
    )
    act(() => fireKey('ArrowRight')) // step 0 -> 1
    act(() => fireKey('ArrowRight')) // slide 0 -> 1, step 0
    expect(result.current.slide).toBe(1)
    expect(result.current.step).toBe(0)
  })

  it('does not go past last slide', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 2, stepsPerSlide: [1, 1] }),
    )
    act(() => fireKey('ArrowRight')) // slide 1
    act(() => fireKey('ArrowRight')) // should stay
    expect(result.current.slide).toBe(1)
  })

  it('goes back a step on ArrowLeft', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 2, stepsPerSlide: [3, 1] }),
    )
    act(() => fireKey('ArrowRight')) // step 1
    act(() => fireKey('ArrowRight')) // step 2
    act(() => fireKey('ArrowLeft'))
    expect(result.current.slide).toBe(0)
    expect(result.current.step).toBe(1)
  })

  it('goes to previous slide last step on ArrowLeft at step 0', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 3, stepsPerSlide: [2, 3, 1] }),
    )
    // Go to slide 1
    act(() => fireKey('ArrowRight')) // s0 step1
    act(() => fireKey('ArrowRight')) // s1 step0
    act(() => fireKey('ArrowLeft')) // back to s0, last step (1)
    expect(result.current.slide).toBe(0)
    expect(result.current.step).toBe(1)
  })

  it('does not go before slide 0', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 2, stepsPerSlide: [1, 1] }),
    )
    act(() => fireKey('ArrowLeft'))
    expect(result.current.slide).toBe(0)
    expect(result.current.step).toBe(0)
  })

  it('ArrowDown works same as ArrowRight', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 2, stepsPerSlide: [1, 1] }),
    )
    act(() => fireKey('ArrowDown'))
    expect(result.current.slide).toBe(1)
  })

  it('ArrowUp works same as ArrowLeft', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 2, stepsPerSlide: [1, 1] }),
    )
    act(() => fireKey('ArrowDown'))
    act(() => fireKey('ArrowUp'))
    expect(result.current.slide).toBe(0)
  })

  it('respects initialSlide option', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({
        totalSlides: 5,
        stepsPerSlide: [1, 1, 1, 1, 1],
        initialSlide: 3,
      }),
    )
    expect(result.current.slide).toBe(3)
  })

  it('clamps initialSlide to valid range', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({
        totalSlides: 3,
        stepsPerSlide: [1, 1, 1],
        initialSlide: 99,
      }),
    )
    expect(result.current.slide).toBe(2)
  })

  it('exposes progress as fraction', () => {
    const { result } = renderHook(() =>
      useSlideNavigation({ totalSlides: 4, stepsPerSlide: [1, 1, 1, 1] }),
    )
    expect(result.current.progress).toBe(0)
    act(() => fireKey('ArrowRight'))
    expect(result.current.progress).toBeCloseTo(1 / 3)
  })
})
