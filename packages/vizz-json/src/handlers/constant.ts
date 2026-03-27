import type { ValueHandler, ResolverConfig } from '../types'

const CONSTANT_PREFIX = '@@#'
const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])

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
      if (FORBIDDEN_SEGMENTS.has(namespace) || FORBIDDEN_SEGMENTS.has(key)) {
        throw new Error(
          `[vizz-json] Forbidden path segment in constant: "${value}"`,
        )
      }
      const enumValue = config.enumerations?.[namespace]?.[key]
      if (enumValue !== undefined) return enumValue
    }

    throw new Error(
      `[vizz-json] Unknown constant: "${value}". Register it in enumerations.`,
    )
  },
}
