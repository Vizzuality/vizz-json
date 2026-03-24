import { describe, it, expect } from 'vitest'
import {
  generateAmbientSplat,
  generateAmbientArc,
  nextAmbientDelay,
  DEFAULT_AMBIENT_CONFIG,
} from '#/lib/fluid/ambient-splats'
import { DEFAULT_FLUID_CONFIG } from '#/lib/fluid/types'

/** Create a deterministic random function from a sequence of values */
function createSeededRandom(values: number[]) {
  let i = 0
  return () => {
    const val = values[i % values.length]
    i++
    return val
  }
}

describe('generateAmbientSplat', () => {
  it('returns a splat within canvas bounds (10% margin)', () => {
    const random = createSeededRandom([0, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5])
    const splat = generateAmbientSplat(true, random)

    expect(splat.x).toBeGreaterThanOrEqual(0.1)
    expect(splat.x).toBeLessThanOrEqual(0.9)
    expect(splat.y).toBeGreaterThanOrEqual(0.1)
    expect(splat.y).toBeLessThanOrEqual(0.9)
  })

  it('generates velocity within maxVelocity bound', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5])
    const splat = generateAmbientSplat(true, random)
    const speed = Math.hypot(splat.dx, splat.dy)

    expect(speed).toBeLessThanOrEqual(DEFAULT_AMBIENT_CONFIG.maxVelocity)
    expect(speed).toBeGreaterThan(0)
  })

  it('returns a color tuple with 3 elements', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const splat = generateAmbientSplat(true, random)

    expect(splat.color).toHaveLength(3)
  })

  it('produces darker colors in light mode', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const darkSplat = generateAmbientSplat(true, random)

    const random2 = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const lightSplat = generateAmbientSplat(false, random2)

    const darkBrightness = darkSplat.color.reduce((a, b) => a + b, 0)
    const lightBrightness = lightSplat.color.reduce((a, b) => a + b, 0)
    expect(darkBrightness).toBeGreaterThan(lightBrightness)
  })

  it('includes explicit radius derived from splatRadiusMin and radiusScale', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const splat = generateAmbientSplat(true, random)

    expect(splat.radius).toBeDefined()
    expect(splat.radius).toBeCloseTo(
      DEFAULT_FLUID_CONFIG.splatRadiusMin * DEFAULT_AMBIENT_CONFIG.radiusScale,
    )
  })

  it('respects custom radiusScale for explicit radius', () => {
    const customConfig = { ...DEFAULT_AMBIENT_CONFIG, radiusScale: 2.0 }
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const splat = generateAmbientSplat(
      true,
      random,
      DEFAULT_FLUID_CONFIG,
      customConfig,
    )

    expect(splat.radius).toBeCloseTo(DEFAULT_FLUID_CONFIG.splatRadiusMin * 2.0)
  })
})

describe('generateAmbientArc', () => {
  it('returns the configured number of arc steps', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const arc = generateAmbientArc(true, random)

    expect(arc).toHaveLength(DEFAULT_AMBIENT_CONFIG.arcSteps)
  })

  it('returns splats with positions along a curve', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const arc = generateAmbientArc(true, random)

    // All positions should be within canvas bounds
    for (const splat of arc) {
      expect(splat.x).toBeGreaterThan(0)
      expect(splat.x).toBeLessThan(1)
      expect(splat.y).toBeGreaterThan(0)
      expect(splat.y).toBeLessThan(1)
    }
  })

  it('all splats share the same color', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const arc = generateAmbientArc(true, random)

    const firstColor = arc[0].color
    for (const splat of arc) {
      expect(splat.color[0]).toBe(firstColor[0])
      expect(splat.color[1]).toBe(firstColor[1])
      expect(splat.color[2]).toBe(firstColor[2])
    }
  })

  it('all splats share the same radius', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const arc = generateAmbientArc(true, random)

    const expectedRadius =
      DEFAULT_FLUID_CONFIG.splatRadiusMin * DEFAULT_AMBIENT_CONFIG.radiusScale
    for (const splat of arc) {
      expect(splat.radius).toBeCloseTo(expectedRadius)
    }
  })

  it('splat positions are not all identical (they follow a curve)', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const arc = generateAmbientArc(true, random)

    const first = arc[0]
    const last = arc[arc.length - 1]
    const distance = Math.hypot(last.x - first.x, last.y - first.y)

    // The arc should span a meaningful distance
    expect(distance).toBeGreaterThan(0.01)
  })

  it('velocity vectors have non-zero magnitude', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const arc = generateAmbientArc(true, random)

    // Middle splats should have highest velocity (sine envelope)
    const midIndex = Math.floor(arc.length / 2)
    const midSpeed = Math.hypot(arc[midIndex].dx, arc[midIndex].dy)
    expect(midSpeed).toBeGreaterThan(0)
  })

  it('velocity follows a sine envelope (peaks in the middle)', () => {
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const arc = generateAmbientArc(true, random)

    const firstSpeed = Math.hypot(arc[0].dx, arc[0].dy)
    const midSpeed = Math.hypot(
      arc[Math.floor(arc.length / 2)].dx,
      arc[Math.floor(arc.length / 2)].dy,
    )
    const lastSpeed = Math.hypot(
      arc[arc.length - 1].dx,
      arc[arc.length - 1].dy,
    )

    // Middle should be faster than endpoints
    expect(midSpeed).toBeGreaterThan(firstSpeed)
    expect(midSpeed).toBeGreaterThan(lastSpeed)
  })

  it('respects custom arcSteps', () => {
    const customConfig = { ...DEFAULT_AMBIENT_CONFIG, arcSteps: 6 }
    const random = createSeededRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const arc = generateAmbientArc(true, random, DEFAULT_FLUID_CONFIG, customConfig)

    expect(arc).toHaveLength(6)
  })
})

describe('nextAmbientDelay', () => {
  it('returns minimum delay at random=0', () => {
    const random = () => 0
    const delay = nextAmbientDelay(random)

    expect(delay).toBe(DEFAULT_AMBIENT_CONFIG.intervalMin * 1000)
  })

  it('returns maximum delay at random=1', () => {
    const random = () => 1
    const delay = nextAmbientDelay(random)

    expect(delay).toBe(DEFAULT_AMBIENT_CONFIG.intervalMax * 1000)
  })

  it('returns delay in between for random=0.5', () => {
    const random = () => 0.5
    const delay = nextAmbientDelay(random)
    const expected =
      (DEFAULT_AMBIENT_CONFIG.intervalMin +
        0.5 *
          (DEFAULT_AMBIENT_CONFIG.intervalMax -
            DEFAULT_AMBIENT_CONFIG.intervalMin)) *
      1000

    expect(delay).toBeCloseTo(expected)
  })

  it('always returns a value within the configured range', () => {
    for (let i = 0; i <= 10; i++) {
      const r = i / 10
      const delay = nextAmbientDelay(() => r)

      expect(delay).toBeGreaterThanOrEqual(
        DEFAULT_AMBIENT_CONFIG.intervalMin * 1000,
      )
      expect(delay).toBeLessThanOrEqual(
        DEFAULT_AMBIENT_CONFIG.intervalMax * 1000,
      )
    }
  })

  it('respects custom config', () => {
    const customConfig = {
      ...DEFAULT_AMBIENT_CONFIG,
      intervalMin: 1,
      intervalMax: 3,
    }
    const delay = nextAmbientDelay(() => 0.5, customConfig)

    expect(delay).toBeCloseTo(2000)
  })
})
