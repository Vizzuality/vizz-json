import { resolveNode } from './resolver'
import {
  typeHandler,
  functionHandler,
  expressionHandler,
  constantHandler,
} from './handlers'
import type { ComponentType } from 'react'

// ── Types ──────────────────────────────────────────────────────────

export type KeyHandler = {
  readonly name: string
  readonly type: 'key'
  readonly key: string
  readonly resolve: (
    value: string,
    props: Record<string, unknown>,
    config: ResolverConfig,
  ) => unknown
}

export type ValueHandler = {
  readonly name: string
  readonly type: 'value'
  readonly test: (value: string) => boolean
  readonly resolve: (value: string, config: ResolverConfig) => unknown
}

export type Handler = KeyHandler | ValueHandler

export type ResolverConfig = {
  readonly classes?: Record<string, new (props: any) => any>
  readonly components?: Record<string, ComponentType<any>>
  readonly functions?: Record<string, (props: any) => unknown>
  readonly enumerations?: Record<string, Record<string, unknown>>
}

export type SuperJSON = {
  readonly resolve: (json: Record<string, unknown>) => Record<string, unknown>
}

// ── Built-in handlers (in resolution order) ────────────────────────

const builtinHandlers: readonly Handler[] = [
  typeHandler,
  functionHandler,
  expressionHandler,
  constantHandler,
]

// ── Factory ────────────────────────────────────────────────────────

export function createSuperJSON(
  config: ResolverConfig,
  extraHandlers: readonly Handler[] = [],
): SuperJSON {
  const handlers = [...extraHandlers, ...builtinHandlers]

  return {
    resolve(json: Record<string, unknown>): Record<string, unknown> {
      return resolveNode(json, config, handlers) as Record<string, unknown>
    },
  }
}

// ── Re-exports ─────────────────────────────────────────────────────

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
