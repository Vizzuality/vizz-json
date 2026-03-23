import type { Handler, KeyHandler, ResolverConfig } from './index'

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export { getNestedValue }

function findKeyHandler(
  obj: Record<string, unknown>,
  handlers: readonly Handler[],
): KeyHandler | undefined {
  for (const handler of handlers) {
    if (handler.type === 'key' && handler.key in obj) {
      return handler
    }
  }
  return undefined
}

function resolveValue(
  value: string,
  handlers: readonly Handler[],
  config: ResolverConfig,
): unknown {
  for (const handler of handlers) {
    if (handler.type === 'value' && handler.test(value)) {
      return handler.resolve(value, config)
    }
  }
  return value
}

export function resolveNode(
  node: unknown,
  config: ResolverConfig,
  handlers: readonly Handler[],
): unknown {
  if (typeof node === 'string') {
    return resolveValue(node, handlers, config)
  }

  if (Array.isArray(node)) {
    return node.map((item) => resolveNode(item, config, handlers))
  }

  if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const keyHandler = findKeyHandler(obj, handlers)

    if (keyHandler) {
      const handlerValue = obj[keyHandler.key] as string
      const remainingProps: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(obj)) {
        if (k !== keyHandler.key) {
          remainingProps[k] = resolveNode(v, config, handlers)
        }
      }
      return keyHandler.resolve(handlerValue, remainingProps, config)
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = resolveNode(value, config, handlers)
    }
    return result
  }

  return node
}
