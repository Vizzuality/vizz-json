import type { AiSchema } from '#/lib/ai/persistence/types'
import type { ResolvedParams } from '#/lib/types'

export function mergeParamDefaults(
  snapshot: AiSchema,
  values: ResolvedParams,
): AiSchema {
  const next_params = snapshot.params_config.map((param) => {
    const value = values[param.key]
    if (value === undefined) return param
    return { ...param, default: value }
  })
  return { ...snapshot, params_config: next_params }
}
