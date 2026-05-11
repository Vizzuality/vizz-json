import type { AiSchema } from '#/lib/ai/persistence/types'
import { inferParamControl } from '#/lib/param-inference'
import type { ResolvedParams } from '#/lib/types'

export function reconcileParamValues(
  prev: AiSchema | null,
  next: AiSchema,
  current: ResolvedParams,
): ResolvedParams {
  const out: Record<string, unknown> = {}
  for (const param of next.params_config) {
    if (!prev) {
      out[param.key] = param.default
      continue
    }
    const prevParam = prev.params_config.find((p) => p.key === param.key)
    const isColour = inferParamControl(param).control_type === 'color_picker'
    if (isColour && prevParam && prevParam.default !== param.default) {
      out[param.key] = param.default
      continue
    }
    const hasUserValue = Object.prototype.hasOwnProperty.call(
      current,
      param.key,
    )
    out[param.key] = hasUserValue ? current[param.key] : param.default
  }
  return out
}
