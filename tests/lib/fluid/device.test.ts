import { describe, it, expect } from 'vitest'
import { shouldDisableSimulation, parseBgColor } from '#/lib/fluid/device'

describe('shouldDisableSimulation', () => {
  it('disables on mobile user agent', () => {
    expect(shouldDisableSimulation('iPhone', 1024, undefined, 8)).toBe(true)
  })

  it('disables on Android user agent', () => {
    expect(shouldDisableSimulation('Android Chrome', 1024, undefined, 8)).toBe(
      true,
    )
  })

  it('disables on small screen', () => {
    expect(
      shouldDisableSimulation('Chrome Desktop', 600, undefined, 8),
    ).toBe(true)
  })

  it('disables on low memory', () => {
    expect(shouldDisableSimulation('Chrome Desktop', 1024, 2, 8)).toBe(true)
  })

  it('disables on low cores', () => {
    expect(
      shouldDisableSimulation('Chrome Desktop', 1024, undefined, 2),
    ).toBe(true)
  })

  it('enables on capable desktop', () => {
    expect(
      shouldDisableSimulation('Chrome Desktop', 1440, undefined, 8),
    ).toBe(false)
  })

  it('enables when deviceMemory is undefined (Firefox/Safari)', () => {
    expect(
      shouldDisableSimulation('Firefox Desktop', 1440, undefined, 8),
    ).toBe(false)
  })
})

describe('parseBgColor', () => {
  it('parses rgb() format', () => {
    expect(parseBgColor('rgb(255, 255, 255)')).toEqual({
      r: 255,
      g: 255,
      b: 255,
    })
  })

  it('parses rgba() format', () => {
    expect(parseBgColor('rgba(10, 10, 10, 1)')).toEqual({
      r: 10,
      g: 10,
      b: 10,
    })
  })

  it('parses rgb() with decimal values', () => {
    expect(parseBgColor('rgb(10.5, 20.7, 30.2)')).toEqual({
      r: 11,
      g: 21,
      b: 30,
    })
  })

  it('returns black for unparseable input', () => {
    expect(parseBgColor('invalid')).toEqual({ r: 0, g: 0, b: 0 })
  })
})
