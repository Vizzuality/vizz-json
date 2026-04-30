import type { AiOutput, ParameterizeEntry } from './output-schema'
import type {
  LayerSchema,
  ParamConfig,
  ExampleMetadata,
  LegendConfig,
} from '#/lib/types'

type PostProcessed = LayerSchema & {
  readonly metadata: ExampleMetadata
  readonly legend_config?: LegendConfig
}

function tokenize(path: string): readonly (string | number)[] {
  // Splits "styles[0].paint.raster-opacity" -> ["styles", 0, "paint", "raster-opacity"]
  // Replace [N] with .N then split on dots
  const normalised = path.replace(/\[(\d+)\]/g, '.$1')
  return normalised
    .split('.')
    .filter(Boolean)
    .map((t) => (/^\d+$/.test(t) ? Number(t) : t))
}

function setAtPath(root: unknown, path: string, value: unknown): void {
  const tokens = tokenize(path)
  if (tokens.length === 0) throw new Error(`empty path`)
  let cursor: unknown = root
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]
    const next =
      typeof token === 'number'
        ? Array.isArray(cursor)
          ? cursor[token]
          : undefined
        : (cursor as Record<string, unknown>)[token]
    if (next === undefined || next === null) {
      throw new Error(`unresolved path ${path} at segment ${String(token)}`)
    }
    cursor = next
  }
  const leaf = tokens[tokens.length - 1]
  if (typeof leaf === 'number' && Array.isArray(cursor)) {
    cursor[leaf] = value
  } else if (typeof leaf === 'string' && cursor && typeof cursor === 'object') {
    ;(cursor as Record<string, unknown>)[leaf] = value
  } else {
    throw new Error(`unresolved path ${path}`)
  }
}

function deepClone<T>(value: T): T {
  return structuredClone(value)
}

function toParamConfig(entry: ParameterizeEntry): ParamConfig {
  const { key, default: def, min, max, step, options, group } = entry
  return {
    key,
    default: def,
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
    ...(step !== undefined && { step }),
    ...(options && { options: options as readonly string[] }),
    ...(group && { group }),
  }
}

export function postProcess(output: AiOutput): PostProcessed {
  const config = deepClone(output.style)

  for (const entry of output.parameterize) {
    setAtPath(config, entry.path, `@@#params.${entry.key}`)
  }

  const params_config = output.parameterize.map(toParamConfig)

  return {
    metadata: output.metadata,
    config,
    params_config,
    ...(output.legend_config && { legend_config: output.legend_config }),
  }
}
