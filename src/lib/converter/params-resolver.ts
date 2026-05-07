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

function isParamsRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PARAMS_PREFIX)
}

const EMBEDDED_PARAMS_RE = /@@#params\.([a-zA-Z_$][\w.$]*)/g

function hasEmbeddedParamsRef(value: string): boolean {
  return value.includes(PARAMS_PREFIX)
}

function stringifyParam(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return JSON.stringify(value)
}

function resolveValue(
  value: unknown,
  params: Readonly<Record<string, unknown>>,
): unknown {
  if (isParamsRef(value)) {
    const path = value.slice(PARAMS_PREFIX.length)
    return getNestedValue(params as Record<string, unknown>, path)
  }

  if (typeof value === 'string' && hasEmbeddedParamsRef(value)) {
    return value.replace(EMBEDDED_PARAMS_RE, (_match, path: string) => {
      const resolved = getNestedValue(params as Record<string, unknown>, path)
      return stringifyParam(resolved)
    })
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, params))
  }

  if (value !== null && typeof value === 'object') {
    return resolveObject(value as Record<string, unknown>, params)
  }

  return value
}

function resolveObject(
  obj: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveValue(value, params)
  }
  return result
}

export function resolveParams(
  json: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return resolveObject(json, params)
}
