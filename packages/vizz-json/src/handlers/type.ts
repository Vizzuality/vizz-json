import type { KeyHandler, ResolverConfig } from '../types'

export const COMPONENT_DESCRIPTOR = '$$component' as const

export type ComponentDescriptor = {
  readonly $$component: unknown
  readonly props: Record<string, unknown>
}

export function isComponentDescriptor(
  value: unknown,
): value is ComponentDescriptor {
  return (
    value !== null &&
    typeof value === 'object' &&
    COMPONENT_DESCRIPTOR in (value as Record<string, unknown>)
  )
}

export const typeHandler: KeyHandler = {
  name: 'type',
  type: 'key',
  key: '@@type',
  resolve(
    typeName: string,
    props: Record<string, unknown>,
    config: ResolverConfig,
  ): unknown {
    const Class = config.classes?.[typeName]
    if (Class) {
      return new Class(props)
    }

    const Component = config.components?.[typeName]
    if (Component) {
      return { [COMPONENT_DESCRIPTOR]: Component, props }
    }

    throw new Error(
      `[vizz-json] Unknown type: "${typeName}". Register it in classes or components.`,
    )
  },
}
