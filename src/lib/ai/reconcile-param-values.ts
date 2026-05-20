import type { AiSchema } from '#/lib/ai/persistence/types'
import { inferParamControl } from '#/lib/param-inference'
import type { ParamConfig } from '#/lib/types'

/**
 * Returns `next` with its params_config defaults reconciled against `prev`:
 *  - new param: keep the AI-emitted default
 *  - colour param whose default differs from prev: keep the AI's new default
 *    (the AI is intentionally re-colouring the layer)
 *  - any other param present in prev: keep the previous default so user edits
 *    survive the next AI turn
 *
 * The output is a fresh snapshot — the caller persists it as-is and the
 * snapshot is the only source of truth for live values.
 */
export function reconcileSnapshot(
  prev: AiSchema | null,
  next: AiSchema,
): AiSchema {
  if (!prev) return next
  const prevByKey = new Map(prev.params_config.map((p) => [p.key, p]))
  const params_config: ParamConfig[] = next.params_config.map((param) => {
    const prevParam = prevByKey.get(param.key)
    if (!prevParam) return { ...param }
    const isColour = inferParamControl(param).control_type === 'color_picker'
    if (isColour && prevParam.default !== param.default) return { ...param }
    return { ...param, default: prevParam.default }
  })
  return { ...next, params_config }
}
