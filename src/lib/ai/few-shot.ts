import rasterOpacity from '#/examples/01-raster-opacity.json'
import graduated from '#/examples/04-graduated-interpolate.json'
import dataDriven from '#/examples/06-data-driven-circles.json'

type LayerSchemaExample = {
  metadata: {
    title: string
    description: string
    tier: 'basic' | 'intermediate' | 'advanced'
  }
  config: Record<string, unknown>
  params_config: ReadonlyArray<{
    key: string
    default: unknown
    min?: number
    max?: number
    step?: number
    options?: readonly string[]
    group?: 'legend'
  }>
  legend_config?: unknown
}

type FewShotExample = {
  metadata: LayerSchemaExample['metadata']
  style: Record<string, unknown>
  parameterize: ReadonlyArray<{
    path: string
    key: string
    default: unknown
    min?: number
    max?: number
    step?: number
    options?: readonly string[]
    group?: 'legend'
  }>
  legend_config?: unknown
}

const PLACEHOLDER_RE = /^@@#params\.(.+)$/

function walkAndReplace(
  value: unknown,
  path: string,
  placeholderToPath: Map<string, string>,
  paramsConfig: LayerSchemaExample['params_config'],
): unknown {
  if (typeof value === 'string') {
    const m = PLACEHOLDER_RE.exec(value)
    if (m) {
      const key = m[1]
      if (!placeholderToPath.has(key)) placeholderToPath.set(key, path)
      const def = paramsConfig.find((p) => p.key === key)?.default
      return def
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item, i) =>
      walkAndReplace(item, `${path}[${i}]`, placeholderToPath, paramsConfig),
    )
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      const nextPath = path === '' ? k : `${path}.${k}`
      out[k] = walkAndReplace(v, nextPath, placeholderToPath, paramsConfig)
    }
    return out
  }
  return value
}

function toFewShot(example: LayerSchemaExample): FewShotExample {
  const placeholderToPath = new Map<string, string>()
  const style = walkAndReplace(
    example.config,
    '',
    placeholderToPath,
    example.params_config,
  ) as Record<string, unknown>

  const parameterize = example.params_config
    .filter((p) => placeholderToPath.has(p.key))
    .map((p) => ({
      path: placeholderToPath.get(p.key)!,
      key: p.key,
      default: p.default,
      ...(p.min !== undefined && { min: p.min }),
      ...(p.max !== undefined && { max: p.max }),
      ...(p.step !== undefined && { step: p.step }),
      ...(p.options && { options: p.options }),
      ...(p.group && { group: p.group }),
    }))

  return {
    metadata: example.metadata,
    style,
    parameterize,
    ...(example.legend_config !== undefined && {
      legend_config: example.legend_config,
    }),
  }
}

export const FEW_SHOT_EXAMPLES = [
  toFewShot(rasterOpacity as LayerSchemaExample),
  toFewShot(graduated as LayerSchemaExample),
  toFewShot(dataDriven as LayerSchemaExample),
] as const
