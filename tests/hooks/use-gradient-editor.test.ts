import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGradientEditor } from '#/hooks/use-gradient-editor'
import type { GradientStop } from '#/lib/gradient-types'

const makeStop = (overrides: Partial<GradientStop> = {}): GradientStop => ({
  id: crypto.randomUUID(),
  color: '#ff0000',
  position: 0,
  dataValue: 0,
  label: 'Test',
  ...overrides,
})

describe('useGradientEditor', () => {
  it('initializes with provided stops', () => {
    const stops = [makeStop({ position: 0 }), makeStop({ position: 1 })]
    const { result } = renderHook(() => useGradientEditor(stops))

    expect(result.current.state.stops).toHaveLength(2)
    expect(result.current.state.selectedStopId).toBeNull()
    expect(result.current.state.isDirty).toBe(false)
  })

  it('selects a stop', () => {
    const stops = [makeStop({ id: 'a' }), makeStop({ id: 'b' })]
    const { result } = renderHook(() => useGradientEditor(stops))

    act(() => result.current.selectStop('a'))

    expect(result.current.state.selectedStopId).toBe('a')
  })

  it('updates a stop immutably', () => {
    const stops = [
      makeStop({ id: 'a', color: '#ff0000' }),
      makeStop({ id: 'b' }),
    ]
    const { result } = renderHook(() => useGradientEditor(stops))
    const original = result.current.state.stops

    act(() => result.current.updateStop('a', { color: '#00ff00' }))

    expect(result.current.state.stops[0].color).toBe('#00ff00')
    expect(result.current.state.isDirty).toBe(true)
    expect(result.current.state.stops).not.toBe(original)
  })

  it('adds a stop with interpolated data value', () => {
    const stops = [
      makeStop({ id: 'a', position: 0, dataValue: 0 }),
      makeStop({ id: 'b', position: 1, dataValue: 1000 }),
    ]
    const { result } = renderHook(() => useGradientEditor(stops))

    act(() => result.current.addStop(0.5, '#808080'))

    expect(result.current.state.stops).toHaveLength(3)
    const newStop = result.current.state.stops[2]
    expect(newStop.position).toBe(0.5)
    expect(newStop.color).toBe('#808080')
    expect(newStop.dataValue).toBe(500)
    expect(newStop.label).toBe('')
    expect(result.current.state.selectedStopId).toBe(newStop.id)
    expect(result.current.state.isDirty).toBe(true)
  })

  it('removes a stop', () => {
    const stops = [
      makeStop({ id: 'a' }),
      makeStop({ id: 'b' }),
      makeStop({ id: 'c' }),
    ]
    const { result } = renderHook(() => useGradientEditor(stops))

    act(() => result.current.removeStop('b'))

    expect(result.current.state.stops).toHaveLength(2)
    expect(result.current.state.stops.find((s) => s.id === 'b')).toBeUndefined()
    expect(result.current.state.isDirty).toBe(true)
  })

  it('does not remove when only 2 stops remain', () => {
    const stops = [makeStop({ id: 'a' }), makeStop({ id: 'b' })]
    const { result } = renderHook(() => useGradientEditor(stops))

    act(() => result.current.removeStop('a'))

    expect(result.current.state.stops).toHaveLength(2)
    expect(result.current.state.isDirty).toBe(false)
  })

  it('clears selection when selected stop is removed', () => {
    const stops = [
      makeStop({ id: 'a' }),
      makeStop({ id: 'b' }),
      makeStop({ id: 'c' }),
    ]
    const { result } = renderHook(() => useGradientEditor(stops))

    act(() => result.current.selectStop('b'))
    act(() => result.current.removeStop('b'))

    expect(result.current.state.selectedStopId).toBeNull()
  })

  it('resets to new stops', () => {
    const stops = [makeStop({ id: 'a' }), makeStop({ id: 'b' })]
    const { result } = renderHook(() => useGradientEditor(stops))

    act(() => result.current.updateStop('a', { color: '#00ff00' }))

    const newStops = [makeStop({ id: 'x' }), makeStop({ id: 'y' })]
    act(() => result.current.reset(newStops))

    expect(result.current.state.stops).toHaveLength(2)
    expect(result.current.state.stops[0].id).toBe('x')
    expect(result.current.state.isDirty).toBe(false)
    expect(result.current.state.selectedStopId).toBeNull()
  })
})
