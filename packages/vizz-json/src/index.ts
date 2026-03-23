import { resolveNode } from './resolver'
import {
  typeHandler,
  functionHandler,
  expressionHandler,
  constantHandler,
} from './handlers'
import type { Handler, ResolverConfig, VizzJson } from './types'

// ── Built-in handlers (in resolution order) ────────────────────────

const builtinHandlers: readonly Handler[] = [
  typeHandler,
  functionHandler,
  expressionHandler,
  constantHandler,
]

// ── Factory ────────────────────────────────────────────────────────

export function createVizzJson(
  config: ResolverConfig,
  extraHandlers: readonly Handler[] = [],
): VizzJson {
  const handlers = [...extraHandlers, ...builtinHandlers]

  return {
    resolve(json: Record<string, unknown>): Record<string, unknown> {
      return resolveNode(json, config, handlers) as Record<string, unknown>
    },
  }
}

// ── Re-exports ─────────────────────────────────────────────────────

export type {
  KeyHandler,
  ValueHandler,
  Handler,
  ResolverConfig,
  VizzJson,
} from './types'
export {
  typeHandler,
  functionHandler,
  expressionHandler,
  constantHandler,
  isComponentDescriptor,
  COMPONENT_DESCRIPTOR,
} from './handlers'
export type { ComponentDescriptor } from './handlers'
export { getNestedValue } from './resolver'
