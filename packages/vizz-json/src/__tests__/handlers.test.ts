import { describe, it, expect } from 'vitest'
import { createVizzJson } from '../index'

// ── @@type handler ─────────────────────────────────────────────────

describe('@@type handler — classes', () => {
  class FakeLayer {
    readonly props: Record<string, unknown>
    constructor(props: Record<string, unknown>) {
      this.props = props
    }
  }

  const vizzJson = createVizzJson({ classes: { FakeLayer } })

  it('instantiates a registered class with resolved props', () => {
    const input = { '@@type': 'FakeLayer', id: 'test', opacity: 0.8 }
    const result = vizzJson.resolve(input) as unknown as FakeLayer
    expect(result).toBeInstanceOf(FakeLayer)
    expect(result.props).toEqual({ id: 'test', opacity: 0.8 })
  })

  it('throws for an unregistered type', () => {
    const input = { '@@type': 'UnknownLayer', id: 'test' }
    expect(() => vizzJson.resolve(input)).toThrow(
      'Unknown type: "UnknownLayer"',
    )
  })

  it('recursively resolves props before instantiating', () => {
    const vizzJsonWithFns = createVizzJson({
      classes: { FakeLayer },
      functions: { buildUrl: (props: any) => `${props.base}/api` },
    })

    const input = {
      '@@type': 'FakeLayer',
      url: { '@@function': 'buildUrl', base: 'https://example.com' },
    }
    const result = vizzJsonWithFns.resolve(input) as unknown as FakeLayer
    expect(result.props.url).toBe('https://example.com/api')
  })
})

describe('@@type handler — components', () => {
  function GradientLegend(_props: Record<string, unknown>) {
    return null
  }

  const vizzJson = createVizzJson({ components: { GradientLegend } })

  it('returns a $$component descriptor for registered components', () => {
    const input = {
      '@@type': 'GradientLegend',
      title: 'Population',
      colors: ['#eff6ff', '#1e3a8a'],
    }
    const result = vizzJson.resolve(input)
    expect(result).toHaveProperty('$$component', GradientLegend)
    expect(result).toHaveProperty('props', {
      title: 'Population',
      colors: ['#eff6ff', '#1e3a8a'],
    })
  })

  it('prefers classes over components when both match', () => {
    class GradientLegendClass {
      readonly props: Record<string, unknown>
      constructor(props: Record<string, unknown>) {
        this.props = props
      }
    }

    const sj = createVizzJson({
      classes: { GradientLegend: GradientLegendClass as any },
      components: { GradientLegend },
    })
    const result = sj.resolve({ '@@type': 'GradientLegend', title: 'Test' })
    expect(result).toBeInstanceOf(GradientLegendClass)
  })
})

// ── @@function handler ─────────────────────────────────────────────

describe('@@function handler', () => {
  function setQueryParams({
    url,
    query,
  }: {
    url: string
    query: Record<string, string>
  }): string {
    const params = new URLSearchParams(query)
    return `${url}?${params.toString()}`
  }

  function ifParam({
    condition,
    then: t,
    else: e,
  }: {
    condition: unknown
    then: unknown
    else: unknown
  }): unknown {
    return condition ? t : e
  }

  const vizzJson = createVizzJson({ functions: { setQueryParams, ifParam } })

  it('calls a registered function with props', () => {
    const input = {
      '@@function': 'setQueryParams',
      url: 'https://api.example.com/tiles',
      query: { format: 'mvt', zoom: '5' },
    }
    expect(vizzJson.resolve(input)).toBe(
      'https://api.example.com/tiles?format=mvt&zoom=5',
    )
  })

  it('evaluates conditional functions', () => {
    const input = {
      '@@function': 'ifParam',
      condition: true,
      then: 'yes',
      else: 'no',
    }
    expect(vizzJson.resolve(input)).toBe('yes')
  })

  it('throws for an unregistered function', () => {
    const input = { '@@function': 'unknown' }
    expect(() => vizzJson.resolve(input)).toThrow('Unknown function: "unknown"')
  })
})

// ── @@= expression handler ─────────────────────────────────────────

describe('@@= expression handler', () => {
  const vizzJson = createVizzJson({})

  it('creates an accessor function for dot-path expressions', () => {
    const input = { getPosition: '@@=geometry.coordinates' }
    const result = vizzJson.resolve(input)
    const accessor = result.getPosition as (
      d: Record<string, unknown>,
    ) => unknown

    expect(typeof accessor).toBe('function')
    expect(accessor({ geometry: { coordinates: [1, 2] } })).toEqual([1, 2])
  })

  it('handles single-level paths', () => {
    const input = { getValue: '@@=value' }
    const result = vizzJson.resolve(input)
    const accessor = result.getValue as (d: Record<string, unknown>) => unknown

    expect(accessor({ value: 42 })).toBe(42)
  })

  it('returns undefined for missing paths', () => {
    const input = { getValue: '@@=deep.missing.path' }
    const result = vizzJson.resolve(input)
    const accessor = result.getValue as (d: Record<string, unknown>) => unknown

    expect(accessor({ other: 'value' })).toBeUndefined()
  })
})

// ── @@# constant handler ───────────────────────────────────────────

describe('@@# constant handler', () => {
  const vizzJson = createVizzJson({
    enumerations: {
      GL: {
        SRC_ALPHA: 0x0302,
        ONE_MINUS_SRC_ALPHA: 0x0303,
        POINTS: 0x0000,
      },
    },
  })

  it('resolves GL constants from enumerations', () => {
    const input = { blendSrc: '@@#GL.SRC_ALPHA' }
    expect(vizzJson.resolve(input)).toEqual({ blendSrc: 0x0302 })
  })

  it('resolves multiple constants', () => {
    const input = {
      parameters: {
        blendSrc: '@@#GL.SRC_ALPHA',
        blendDst: '@@#GL.ONE_MINUS_SRC_ALPHA',
      },
    }
    expect(vizzJson.resolve(input)).toEqual({
      parameters: {
        blendSrc: 0x0302,
        blendDst: 0x0303,
      },
    })
  })

  it('throws for an unregistered constant', () => {
    const input = { value: '@@#GL.UNKNOWN' }
    expect(() => vizzJson.resolve(input)).toThrow('Unknown constant')
  })
})

// ── Mixed handlers ─────────────────────────────────────────────────

describe('mixed handlers in a single spec', () => {
  class ScatterplotLayer {
    readonly props: Record<string, unknown>
    constructor(props: Record<string, unknown>) {
      this.props = props
    }
  }

  const vizzJson = createVizzJson({
    classes: { ScatterplotLayer },
    enumerations: { GL: { SRC_ALPHA: 0x0302 } },
  })

  it('resolves @@type with nested @@= expressions', () => {
    const input = {
      '@@type': 'ScatterplotLayer',
      id: 'earthquakes',
      getPosition: '@@=geometry.coordinates',
      opacity: 0.8,
    }
    const result = vizzJson.resolve(input) as unknown as ScatterplotLayer
    expect(result).toBeInstanceOf(ScatterplotLayer)
    expect(typeof result.props.getPosition).toBe('function')
    expect(result.props.id).toBe('earthquakes')
    expect(result.props.opacity).toBe(0.8)
  })
})
