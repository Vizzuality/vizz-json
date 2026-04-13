const PARAMS_PREFIX = '@@#params.'

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

function resolveValue(
  value: unknown,
  params: Readonly<Record<string, unknown>>,
): unknown {
  if (typeof value === 'string' && value.startsWith(PARAMS_PREFIX)) {
    const path = value.slice(PARAMS_PREFIX.length)
    return getNestedValue(params as Record<string, unknown>, path)
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, params))
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = resolveValue(v, params)
    }
    return result
  }
  return value
}

export function resolveParams(
  json: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(json)) {
    result[key] = resolveValue(value, params)
  }
  return result
}
