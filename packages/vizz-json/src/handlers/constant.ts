import type { ValueHandler, ResolverConfig } from '../index'

const CONSTANT_PREFIX = '@@#'

export const constantHandler: ValueHandler = {
  name: 'constant',
  type: 'value',
  test(value: string): boolean {
    return value.startsWith(CONSTANT_PREFIX)
  },
  resolve(value: string, config: ResolverConfig): unknown {
    const path = value.slice(CONSTANT_PREFIX.length)
    const parts = path.split('.')

    if (parts.length === 2) {
      const [namespace, key] = parts
      const enumValue = config.enumerations?.[namespace]?.[key]
      if (enumValue !== undefined) return enumValue
    }

    throw new Error(
      `[vizz-json] Unknown constant: "${value}". Register it in enumerations.`,
    )
  },
}
