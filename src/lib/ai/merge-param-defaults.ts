import type { AiSchema } from '#/lib/ai/persistence/types'
import type { ResolvedParams } from '#/lib/types'

export function mergeParamDefaults(
  snapshot: AiSchema,
  values: ResolvedParams,
): AiSchema {
  const next_params = snapshot.params_config.map((param) =>
    Object.prototype.hasOwnProperty.call(values, param.key)
      ? { ...param, default: values[param.key] }
      : param,
  )
  return { ...snapshot, params_config: next_params }
}
