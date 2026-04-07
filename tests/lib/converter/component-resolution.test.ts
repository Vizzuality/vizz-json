import { describe, it, expect } from 'vitest'
import { resolveParams } from '#/lib/converter'
import { createConverter } from '#/lib/converter/converter-config'
import { isComponentDescriptor } from '@vizzuality/vizz-json'

describe('component resolution pipeline', () => {
  const converter = createConverter()

  it('resolves @@type entries in a components array via wrap/unwrap', () => {
    const components = [
      { '@@type': 'InfoPanel', title: 'Hello', description: 'World' },
      {
        '@@type': 'StatCard',
        label: 'Count',
        value: '42',
        unit: 'items',
        color: '#000',
      },
    ]

    // Wrap
    const wrapped = { components }

    // Stage 1: params (none to resolve here, but run it for pipeline fidelity)
    const paramsResolved = resolveParams(wrapped, {})

    // Stage 2: @@type resolution
    const result = converter.resolve(paramsResolved)

    // Unwrap
    const resolved = result.components as unknown[]
    expect(Array.isArray(resolved)).toBe(true)
    expect(resolved).toHaveLength(2)
    expect(isComponentDescriptor(resolved[0])).toBe(true)
    expect(isComponentDescriptor(resolved[1])).toBe(true)
  })

  it('resolves @@#params inside @@type component props', () => {
    const components = [
      {
        '@@type': 'InfoPanel',
        title: '@@#params.myTitle',
        description: 'static',
      },
    ]

    const wrapped = { components }
    const paramsResolved = resolveParams(wrapped, { myTitle: 'Resolved Title' })
    const result = converter.resolve(paramsResolved)

    const resolved = result.components as unknown[]
    expect(isComponentDescriptor(resolved[0])).toBe(true)

    const descriptor = resolved[0] as {
      $$component: unknown
      props: Record<string, unknown>
    }
    expect(descriptor.props.title).toBe('Resolved Title')
    expect(descriptor.props.description).toBe('static')
  })

  it('resolves GradientLegend with items array via @@type', () => {
    const components = [
      {
        '@@type': 'GradientLegend',
        items: [
          { label: 'Low', value: '@@#params.color_1' },
          { label: 'High', value: '@@#params.color_3' },
        ],
      },
    ]

    const wrapped = { components }
    const paramsResolved = resolveParams(wrapped, {
      color_1: '#ffffff',
      color_3: '#000000',
    })
    const result = converter.resolve(paramsResolved)

    const resolved = result.components as unknown[]
    expect(isComponentDescriptor(resolved[0])).toBe(true)

    const descriptor = resolved[0] as {
      $$component: unknown
      props: Record<string, unknown>
    }
    const items = descriptor.props.items as Array<{
      label: string
      value: string
    }>
    expect(items[0].value).toBe('#ffffff')
    expect(items[1].value).toBe('#000000')
  })
})
